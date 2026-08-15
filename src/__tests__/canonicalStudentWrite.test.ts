import { afterEach, describe, expect, it } from 'vitest';
import { CanonicalStudentWriteRepository } from '../database/repositories/CanonicalStudentWriteRepository';
import { UnitOfWork } from '../database/UnitOfWork';
import type { TransactionBeginOptions, TransactionDriver, TransactionQueryResult, TransactionSession } from '../database/transactions/TransactionContracts';
import type { TenantContext } from '../tenant/TenantContext';

const context: TenantContext = {
  tenantId: 'school-a',
  schoolId: 'school-a',
  branchId: 'branch-a',
  academicYear: 'year-a',
  userId: 'auth-user-a',
  role: 'SchoolAdmin'
};

const currentStudent = {
  id: 'student-a',
  tenant_id: 'school-a',
  school_id: 'school-a',
  branch_id: 'branch-a',
  student_number: 'STU-001',
  legal_first_name: 'Amina',
  legal_middle_name: null,
  legal_last_name: 'Hassan',
  preferred_name: null,
  date_of_birth: '2014-05-12',
  gender: 'female',
  nationality: 'SD',
  status: 'active',
  version: 3,
  created_at: '2026-08-11T00:00:00.000Z',
  updated_at: '2026-08-11T00:00:00.000Z',
  deleted_at: null
};

class WriteSession implements TransactionSession {
  public readonly id = 'canonical-write-test';
  public readonly statements: string[] = [];
  public committed = false;
  public rolledBack = false;

  async query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sqlText: string,
    _parameters: readonly unknown[] = []
  ): Promise<TransactionQueryResult<Row>> {
    const sql = sqlText.trimStart();
    this.statements.push(sqlText);
    if (sql.startsWith('SELECT id\n       FROM public.users')) return { rows: [{ id: 'internal-user-a' }] as unknown as Row[], rowCount: 1 };
    if (sql.startsWith('SELECT id, tenant_id')) return { rows: [currentStudent] as unknown as Row[], rowCount: 1 };
    if (sql.startsWith('UPDATE public.students')) return { rows: [{ ...currentStudent, version: 4, legal_last_name: 'Ali', updated_at: '2026-08-11T01:00:00.000Z' }] as unknown as Row[], rowCount: 1 };
    return { rows: [], rowCount: 1 } as TransactionQueryResult<Row>;
  }

  async commit(): Promise<void> { this.committed = true; }
  async rollback(): Promise<void> { this.rolledBack = true; }
  async release(): Promise<void> {}
}

class WriteDriver implements TransactionDriver {
  public session?: WriteSession;
  async begin(_options: TransactionBeginOptions): Promise<TransactionSession> {
    this.session = new WriteSession();
    return this.session;
  }
}

afterEach(async () => {
  if (UnitOfWork.isTransactionActive()) await UnitOfWork.rollback();
  UnitOfWork.configureTransactionDriver(null);
});

describe('Canonical Student write boundary', () => {
  it('updates only canonical fields inside one transaction with trusted tenant scope', async () => {
    const driver = new WriteDriver();
    UnitOfWork.configureTransactionDriver(driver);

    const result = await CanonicalStudentWriteRepository.update(
      context,
      'student-a',
      { legalLastName: 'Ali', dateOfBirth: '2014-05-12' },
      3,
      {
        action: 'UPDATE',
        reason: 'correction',
        requestId: '11111111-1111-4111-8111-111111111111',
        correlationId: '22222222-2222-4222-8222-222222222222',
        ipAddress: '127.0.0.1'
      }
    );

    expect(result).toMatchObject({ id: 'student-a', legalLastName: 'Ali', version: 4 });
    expect(driver.session?.committed).toBe(true);
    expect(driver.session?.rolledBack).toBe(false);
    expect(driver.session?.statements.some(sql => sql.includes('INSERT INTO public.audit_events'))).toBe(true);
    expect(driver.session?.statements.some(sql => sql.includes('UPDATE public.students'))).toBe(true);
  });

  it('rejects a stale version before writing audit or student data', async () => {
    const driver = new WriteDriver();
    UnitOfWork.configureTransactionDriver(driver);

    await expect(CanonicalStudentWriteRepository.update(
      context,
      'student-a',
      { legalLastName: 'Ali' },
      2,
      {
        action: 'UPDATE',
        reason: 'stale',
        requestId: '11111111-1111-4111-8111-111111111111',
        correlationId: '22222222-2222-4222-8222-222222222222',
        ipAddress: '127.0.0.1'
      }
    )).rejects.toMatchObject({ statusCode: 409 });

    expect(driver.session?.statements.some(sql => sql.includes('INSERT INTO public.audit_events'))).toBe(false);
    expect(driver.session?.committed).toBe(false);
    expect(driver.session?.rolledBack).toBe(true);
  });
});
