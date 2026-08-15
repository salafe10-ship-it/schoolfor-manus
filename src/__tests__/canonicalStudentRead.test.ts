import { afterEach, describe, expect, it } from 'vitest';
import { StudentService } from '../database/services/StudentService';
import { UnitOfWork } from '../database/UnitOfWork';
import { runWithTenantContext, type TenantContext } from '../tenant/TenantContext';
import type {
  TransactionBeginOptions,
  TransactionDriver,
  TransactionQueryResult,
  TransactionSession
} from '../database/transactions/TransactionContracts';

const trustedContext: TenantContext = {
  tenantId: 'tenant-a',
  schoolId: 'school-a',
  branchId: 'branch-a',
  academicYear: 'year-a',
  userId: 'user-a',
  role: 'SchoolAdmin'
};

const studentRow = {
  id: 'student-a',
  tenant_id: 'tenant-a',
  school_id: 'school-a',
  branch_id: 'branch-a',
  student_number: 'STU-0001',
  legal_first_name: 'Amina',
  legal_middle_name: null,
  legal_last_name: 'Hassan',
  preferred_name: null,
  date_of_birth: '2015-01-02',
  gender: 'female',
  nationality: 'SD',
  status: 'admitted',
  version: 1,
  created_at: '2026-08-08T00:00:00.000Z',
  deleted_at: null,
  total_count: 1
};

class ReadSession implements TransactionSession {
  public committed = false;
  public rolledBack = false;
  public released = false;
  public readonly queries: Array<{ sql: string; parameters: readonly unknown[] }> = [];

  public constructor(
    private readonly rows: Record<string, unknown>[],
    private readonly failQuery = false
  ) {}

  public readonly id = 'canonical-read-tx';

  public async query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    parameters: readonly unknown[] = []
  ): Promise<TransactionQueryResult<Row>> {
    this.queries.push({ sql, parameters });
    if (this.failQuery) throw new Error('database query failed');
    return { rows: this.rows as Row[], rowCount: this.rows.length };
  }

  public async commit(): Promise<void> {
    this.committed = true;
  }

  public async rollback(): Promise<void> {
    this.rolledBack = true;
  }

  public async release(): Promise<void> {
    this.released = true;
  }
}

class ReadDriver implements TransactionDriver {
  public options: TransactionBeginOptions | undefined;
  public session: ReadSession;
  public beginCount = 0;

  public constructor(rows: Record<string, unknown>[], private readonly failQuery = false) {
    this.session = new ReadSession(rows, failQuery);
  }

  public async begin(options: TransactionBeginOptions): Promise<TransactionSession> {
    this.beginCount += 1;
    this.options = options;
    return this.session;
  }
}

afterEach(async () => {
  if (UnitOfWork.isTransactionActive()) await UnitOfWork.rollback();
  UnitOfWork.configureTransactionDriver(null);
});

describe('PERF-002 canonical Student read path', () => {
  it('returns a committed Student written in the canonical PostgreSQL source', async () => {
    const driver = new ReadDriver([studentRow]);
    UnitOfWork.configureTransactionDriver(driver);

    const result = await runWithTenantContext(trustedContext, () =>
      StudentService.advancedSearch('client-supplied-school', {
        page: 1,
        limit: 20,
        quickSearch: 'STU-0001'
      }, trustedContext)
    );

    expect(result.totalCount).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'student-a',
      studentNumber: 'STU-0001',
      name: 'Amina Hassan',
      status: 'accepted'
    });
    expect(driver.session.committed).toBe(true);
    expect(driver.session.released).toBe(true);
  });

  it('uses only trusted TenantContext values and ignores the caller school argument', async () => {
    const driver = new ReadDriver([studentRow]);
    UnitOfWork.configureTransactionDriver(driver);

    await runWithTenantContext(trustedContext, () =>
      StudentService.advancedSearch('school-spoofed-by-client', { page: 2, limit: 10 }, trustedContext)
    );

    const query = driver.session.queries[0];
    expect(query.sql).toContain('s.tenant_id = $1');
    expect(query.sql).toContain('s.school_id = $2');
    expect(query.sql).toContain('s.branch_id = $3');
    expect(query.parameters.slice(0, 3)).toEqual(['tenant-a', 'school-a', 'branch-a']);
    expect(driver.options?.trustedContext).toEqual(trustedContext);
  });

  it('fails closed on a database error and does not return fallback data', async () => {
    const driver = new ReadDriver([], true);
    UnitOfWork.configureTransactionDriver(driver);

    await expect(runWithTenantContext(trustedContext, () =>
      StudentService.advancedSearch('school-a', { page: 1, limit: 20 }, trustedContext)
    )).rejects.toThrow('database query failed');

    expect(driver.session.committed).toBe(false);
    expect(driver.session.rolledBack).toBe(true);
    expect(driver.session.released).toBe(true);
  });

  it('rejects reads without a trusted tenant context', async () => {
    const driver = new ReadDriver([studentRow]);
    UnitOfWork.configureTransactionDriver(driver);

    await expect(StudentService.advancedSearch('school-a', { page: 1, limit: 20 }))
      .rejects.toThrow('Trusted tenant context is required');
  });

  it('reuses the active request transaction instead of opening a nested read transaction', async () => {
    const driver = new ReadDriver([studentRow]);
    UnitOfWork.configureTransactionDriver(driver);

    await UnitOfWork.runInTransaction(
      trustedContext.schoolId,
      {
        operationName: 'Student Read request',
        tenantId: trustedContext.tenantId,
        userId: trustedContext.userId,
        userName: trustedContext.userId,
        ipAddress: 'test',
        affectedTables: ['students']
      },
      async () => StudentService.advancedSearch(
        'ignored-school',
        { page: 1, limit: 20 },
        trustedContext
      ),
      trustedContext
    );

    expect(driver.beginCount).toBe(1);
    expect(driver.session.committed).toBe(true);
    expect(driver.session.released).toBe(true);
  });

  it('applies canonical classroom and section filters while keeping the trusted scope', async () => {
    const driver = new ReadDriver([studentRow]);
    UnitOfWork.configureTransactionDriver(driver);

    await runWithTenantContext(trustedContext, () =>
      StudentService.advancedSearch('ignored-school', {
        page: 2,
        limit: 20,
        classroom: 'الصف الثاني',
        section: 'ب'
      }, trustedContext)
    );

    const query = driver.session.queries[0];
    expect(query.sql).toContain('enrollment.class_reference = $4');
    expect(query.sql).toContain('enrollment.section_reference = $5');
    expect(query.sql).toContain('LIMIT $6 OFFSET $7');
    expect(query.parameters).toEqual(['tenant-a', 'school-a', 'branch-a', 'الصف الثاني', 'ب', 20, 20]);
  });

  it('rejects unsupported sort fields instead of silently falling back', async () => {
    const driver = new ReadDriver([studentRow]);
    UnitOfWork.configureTransactionDriver(driver);

    await expect(runWithTenantContext(trustedContext, () =>
      StudentService.advancedSearch('school-a', { sortBy: 'unsafe_sql' }, trustedContext)
    )).rejects.toThrow('حقل الترتيب المطلوب غير معتمد');

    expect(driver.session.queries).toHaveLength(0);
  });

  it('rejects page sizes above the server contract maximum', async () => {
    const driver = new ReadDriver([studentRow]);
    UnitOfWork.configureTransactionDriver(driver);

    await expect(runWithTenantContext(trustedContext, () =>
      StudentService.advancedSearch('school-a', { page: 1, limit: 101 }, trustedContext)
    )).rejects.toThrow('حجم الصفحة يجب أن يكون بين 1 و100');

    expect(driver.session.queries).toHaveLength(0);
  });
});
