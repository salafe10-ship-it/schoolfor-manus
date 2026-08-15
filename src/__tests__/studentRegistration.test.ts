import { afterEach, describe, expect, it } from 'vitest';
import { UnitOfWork } from '../database/UnitOfWork';
import type { TransactionBeginOptions, TransactionDriver, TransactionQueryResult, TransactionSession } from '../database/transactions/TransactionContracts';
import { createStudentRegistrationFingerprint, StudentRegistrationService } from '../modules/student-registration/application/StudentRegistrationService';
import type { TenantContext } from '../tenant/TenantContext';

class RegistrationSession implements TransactionSession {
  public readonly id = 'sop-001-test-session';
  public readonly statements: string[] = [];
  public readonly parameterBatches: unknown[][] = [];
  public committed = false;
  public rolledBack = false;
  public released = false;

  public constructor(private readonly failOnWrite?: string) {}

  async query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sqlText: string,
    parameters: readonly unknown[] = []
  ): Promise<TransactionQueryResult<Row>> {
    const normalizedSql = sqlText.trimStart();
    if (/^SELECT id[\s\S]*FROM users/.test(normalizedSql)) return { rows: [{ id: 'internal-user-1' }] as unknown as Row[], rowCount: 1 };
    if (/^SELECT id[\s\S]*FROM academic_years/.test(normalizedSql)) return { rows: [{ id: 'year-1' }] as unknown as Row[], rowCount: 1 };
    if (/^SELECT id[\s\S]*FROM terms/.test(normalizedSql)) return { rows: [{ id: 'term-1' }] as unknown as Row[], rowCount: 1 };
    if (/^SELECT id, guardian_number[\s\S]*FROM guardians/.test(normalizedSql)) return { rows: [], rowCount: 0 };
    if (/^SELECT aggregate_id, payload[\s\S]*FROM outbox_events/.test(normalizedSql)) return { rows: [], rowCount: 0 };
    if (/^SELECT id, student_number[\s\S]*FROM students/.test(normalizedSql)) return { rows: [], rowCount: 0 };
    if (/^SELECT id[\s\S]*FROM students/.test(normalizedSql)) return { rows: [], rowCount: 0 };
    if (this.failOnWrite && normalizedSql.startsWith(this.failOnWrite)) throw new Error('simulated SOP-001 write failure');
    this.statements.push(sqlText);
    this.parameterBatches.push([...parameters]);
    return { rows: [], rowCount: 1 } as TransactionQueryResult<Row>;
  }

  async commit(): Promise<void> { this.committed = true; }
  async rollback(): Promise<void> { this.rolledBack = true; this.statements.length = 0; }
  async release(): Promise<void> { this.released = true; }
}

class RegistrationDriver implements TransactionDriver {
  public session?: RegistrationSession;
  public constructor(private readonly failOnWrite?: string, private readonly idempotent = false) {}

  async begin(_options: TransactionBeginOptions): Promise<TransactionSession> {
    this.session = new RegistrationSession(this.failOnWrite);
    if (this.idempotent) {
      const session = this.session;
      const original = session.query.bind(session);
      session.query = async (sqlText: string, parameters: readonly unknown[] = []) => {
        if (/^SELECT aggregate_id, payload[\s\S]*FROM outbox_events/.test(sqlText.trimStart())) {
          return {
            rows: [{
              aggregate_id: 'existing-student',
              payload: { requestFingerprint: createStudentRegistrationFingerprint(command), result: {
                idempotent: false,
                studentId: 'existing-student',
                studentNumber: 'STU-EXISTING',
                requestId: '11111111-1111-4111-8111-111111111111',
                correlationId: '22222222-2222-4222-8222-222222222222'
              } },
              payload_hash: 'test-payload-hash'
            }],
            rowCount: 1
          } as any;
        }
        return original(sqlText, parameters);
      };
    }
    return this.session;
  }
}

const context: TenantContext = {
  tenantId: 'trusted-school',
  schoolId: 'trusted-school',
  branchId: 'branch-1',
  academicYear: 'year-1',
  userId: 'trusted-user',
  role: 'SchoolAdmin'
};

const command = {
  legalFirstName: 'Amina',
  legalLastName: 'Hassan',
  dateOfBirth: '2014-05-12',
  termId: 'term-1',
  idempotencyKey: 'registration-001',
  tenant_id: 'client-spoofed-tenant',
  school_id: 'client-spoofed-school',
  guardian: {
    legalFirstName: 'Mariam',
    legalLastName: 'Hassan',
    phone: '+249900000000',
    relationshipType: 'parent'
  }
};

afterEach(async () => {
  if (UnitOfWork.isTransactionActive()) await UnitOfWork.rollback();
  UnitOfWork.configureTransactionDriver(null);
});

describe('SOP-001 Student Registration', () => {
  it('commits the student lifecycle atomically using trusted context', async () => {
    const driver = new RegistrationDriver();
    UnitOfWork.configureTransactionDriver(driver);

    const result = await new StudentRegistrationService().register(context, command, {
      requestId: '11111111-1111-4111-8111-111111111111',
      correlationId: '22222222-2222-4222-8222-222222222222',
      idempotencyKey: 'registration-001'
    });

    expect(result.idempotent).toBe(false);
    expect(result.studentId).toBeTruthy();
    expect(result.guardianId).toBeTruthy();
    expect(result.enrollmentId).toBeTruthy();
    expect(driver.session?.committed).toBe(true);
    expect(driver.session?.rolledBack).toBe(false);
    expect(driver.session?.released).toBe(true);
    expect(driver.session?.statements[0]).toContain('INSERT INTO audit_events');
    expect(driver.session?.statements.some(sql => sql.includes("'StudentRegistered'"))).toBe(true);
    expect(driver.session?.parameterBatches.flat()).toContain('trusted-school');
    expect(driver.session?.parameterBatches.flat()).not.toContain('client-spoofed-tenant');
  });

  it('rolls back the complete workflow when a middle write fails', async () => {
    const driver = new RegistrationDriver('INSERT INTO enrollments');
    UnitOfWork.configureTransactionDriver(driver);

    await expect(new StudentRegistrationService().register(context, command, { idempotencyKey: 'registration-002' })).rejects.toThrow('Student registration transaction failed');
    expect(driver.session?.committed).toBe(false);
    expect(driver.session?.rolledBack).toBe(true);
    expect(driver.session?.released).toBe(true);
    expect(driver.session?.statements).toHaveLength(0);
  });

  it('returns the existing registration for a repeated idempotency key', async () => {
    const driver = new RegistrationDriver(undefined, true);
    UnitOfWork.configureTransactionDriver(driver);

    const result = await new StudentRegistrationService().register(context, command, {
      requestId: '11111111-1111-4111-8111-111111111111',
      correlationId: '22222222-2222-4222-8222-222222222222',
      idempotencyKey: 'registration-001'
    });

    expect(result).toMatchObject({ idempotent: true, studentId: 'existing-student' });
    expect(driver.session?.committed).toBe(true);
    expect(driver.session?.statements).toHaveLength(0);
  });

  it('rejects the same idempotency key when the normalized payload changes', async () => {
    const driver = new RegistrationDriver(undefined, true);
    UnitOfWork.configureTransactionDriver(driver);

    await expect(new StudentRegistrationService().register(context, { ...command, legalFirstName: 'Different' }, {
      idempotencyKey: 'registration-001'
    })).rejects.toMatchObject({
      statusCode: 409,
      details: { errorCode: 'STU-IDM-001' }
    });
    expect(driver.session?.committed).toBe(false);
    expect(driver.session?.rolledBack).toBe(true);
  });

  it('requires the idempotency key outside the business payload', async () => {
    const driver = new RegistrationDriver();
    UnitOfWork.configureTransactionDriver(driver);

    await expect(new StudentRegistrationService().register(context, command)).rejects.toMatchObject({
      statusCode: 400,
      details: { errorCode: 'STU-IDM-001' }
    });
    expect(driver.session).toBeUndefined();
  });

  it('rejects an incomplete trusted tenant context before opening a transaction', async () => {
    const driver = new RegistrationDriver();
    UnitOfWork.configureTransactionDriver(driver);
    await expect(new StudentRegistrationService().register({ ...context, branchId: '' }, command, { idempotencyKey: 'registration-003' })).rejects.toThrow('Trusted tenant context is incomplete');
    expect(driver.session).toBeUndefined();
  });
});
