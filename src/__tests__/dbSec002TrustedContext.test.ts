import { afterEach, describe, expect, it } from 'vitest';
import { PostgresTransactionDriver } from '../../server/infrastructure/PostgresTransactionDriver';
import { UnitOfWork } from '../database/UnitOfWork';
import type { TransactionBeginOptions, TransactionDriver, TransactionSession } from '../database/transactions/TransactionContracts';

class CaptureClient {
  public readonly calls: Array<{ sql: string; parameters: readonly unknown[] }> = [];
  public released = false;

  public async query(sql: string, parameters: readonly unknown[] = []): Promise<{ rows: never[]; rowCount: number }> {
    this.calls.push({ sql, parameters });
    return { rows: [], rowCount: 0 };
  }

  public release(): void {
    this.released = true;
  }
}

class CapturePool {
  public constructor(public readonly client: CaptureClient) {}

  public async connect(): Promise<CaptureClient> {
    return this.client;
  }
}

class CaptureDriver implements TransactionDriver {
  public options: TransactionBeginOptions | undefined;
  private readonly session: TransactionSession = {
    id: 'capture-tx',
    query: async () => ({ rows: [], rowCount: 0 }),
    commit: async () => undefined,
    rollback: async () => undefined,
    release: async () => undefined
  };

  public async begin(options: TransactionBeginOptions): Promise<TransactionSession> {
    this.options = options;
    return this.session;
  }
}

afterEach(async () => {
  if (UnitOfWork.isTransactionActive()) await UnitOfWork.rollback();
  UnitOfWork.configureTransactionDriver(null);
});

describe('DB-SEC-002 trusted transaction context', () => {
  it('applies trusted context with transaction-local PostgreSQL settings only', async () => {
    const client = new CaptureClient();
    const driver = new PostgresTransactionDriver(new CapturePool(client) as never);

    const session = await driver.begin({
      transactionId: 'dbsec002-tx',
      tenantId: 'tenant-a',
      schoolId: 'tenant-a',
      operationName: 'DB-SEC-002 test',
      trustedContext: {
        tenantId: 'tenant-a',
        schoolId: 'tenant-a',
        branchId: 'branch-a',
        academicYear: 'year-a',
        userId: 'user-a',
        role: 'SchoolAdmin'
      }
    });

    const localContextCalls = client.calls.filter(call => call.sql.includes('set_config'));
    expect(client.calls[0].sql).toBe('BEGIN');
    expect(localContextCalls).toHaveLength(1);
    expect(localContextCalls[0].sql).toContain('set_config($1, $2, true)');
    expect(localContextCalls[0].sql).toContain('set_config($11, $12, true)');
    expect(localContextCalls[0].parameters).toEqual([
      ['app.tenant_id', 'tenant-a'],
      ['app.school_id', 'tenant-a'],
      ['app.branch_id', 'branch-a'],
      ['app.academic_year', 'year-a'],
      ['app.user_id', 'user-a'],
      ['app.role', 'SchoolAdmin']
    ].flat());
    expect(localContextCalls[0].sql).not.toContain(', false');

    await session.rollback();
    await session.release();
    expect(client.calls.at(-1)?.sql).toBe('ROLLBACK');
    expect(client.released).toBe(true);
  });

  it('fails closed for a tenant/school mismatch and releases the connection', async () => {
    const client = new CaptureClient();
    const driver = new PostgresTransactionDriver(new CapturePool(client) as never);

    await expect(driver.begin({
      transactionId: 'dbsec002-invalid',
      tenantId: 'tenant-a',
      schoolId: 'school-a',
      operationName: 'DB-SEC-002 invalid context',
      trustedContext: { tenantId: 'tenant-a', schoolId: 'school-b' }
    })).rejects.toThrow('Trusted tenant context is missing or invalid');

    expect(client.calls.map(call => call.sql)).toEqual(['BEGIN', 'ROLLBACK']);
    expect(client.released).toBe(true);
  });

  it('forwards the trusted context from the Unit of Work to the driver', async () => {
    const driver = new CaptureDriver();
    UnitOfWork.configureTransactionDriver(driver);

    await UnitOfWork.runInTransaction(
      'tenant-a',
      {
        operationName: 'DB-SEC-002 UoW test',
        userId: 'user-a',
        userName: 'user-a',
        ipAddress: '127.0.0.1',
        affectedTables: ['students'],
        tenantId: 'tenant-a'
      },
      async () => undefined,
      {
        tenantId: 'tenant-a',
        schoolId: 'tenant-a',
        branchId: 'branch-a',
        academicYear: 'year-a',
        userId: 'user-a',
        role: 'SchoolAdmin'
      }
    );

    expect(driver.options?.trustedContext).toEqual({
      tenantId: 'tenant-a',
      schoolId: 'tenant-a',
      branchId: 'branch-a',
      academicYear: 'year-a',
      userId: 'user-a',
      role: 'SchoolAdmin'
    });
  });
});
