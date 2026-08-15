import { afterEach, describe, expect, it } from 'vitest';
import { UnitOfWork } from '../database/UnitOfWork';
import { ConflictError, DatabaseError, ValidationError } from '../utils/errors';
import { normalizeDocumentListFilters, StudentDocumentService } from '../modules/student-documents/application/StudentDocumentService';
import type { TransactionBeginOptions, TransactionDriver, TransactionQueryResult, TransactionSession } from '../database/transactions/TransactionContracts';
import type { StudentDocumentRequestContext } from '../modules/student-documents/domain/types';

const TENANT = '11111111-1111-4111-8111-111111111111';
const SCHOOL = '22222222-2222-4222-8222-222222222222';
const BRANCH = '33333333-3333-4333-8333-333333333333';
const STUDENT = '44444444-4444-4444-8444-444444444444';
const CATEGORY = '55555555-5555-4555-8555-555555555555';
const USER = '66666666-6666-4666-8666-666666666666';
const FORGED = '99999999-9999-4999-8999-999999999999';
const DOCUMENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

class FakeSession implements TransactionSession {
  readonly id = 'doc-test-session';
  readonly calls: Array<{ sql: string; parameters: readonly unknown[] }> = [];
  committed = false;
  rolledBack = false;
  failCommit = false;
  documentRow: Record<string, unknown> | null = null;
  versionRows: Array<Record<string, unknown>> = [];

  async query<Row extends Record<string, unknown> = Record<string, unknown>>(sqlText: string, parameters: readonly unknown[] = []): Promise<TransactionQueryResult<Row>> {
    this.calls.push({ sql: sqlText, parameters });
    if (sqlText.includes('FROM outbox_events')) return { rows: [], rowCount: 0 } as TransactionQueryResult<Row>;
    if (sqlText.includes('FROM users')) return { rows: [{ id: USER }] as unknown as Row[], rowCount: 1 };
    if (sqlText.includes('FROM students')) return { rows: [{ id: STUDENT }] as unknown as Row[], rowCount: 1 };
    if (sqlText.includes('FROM student_document_categories')) return { rows: [{ id: CATEGORY, tenant_id: TENANT, category_code: 'ID', display_name: 'Identity', status: 'active', version: 1, deleted_at: null }] as unknown as Row[], rowCount: 1 };
    if (sqlText.includes('MAX(version_number)')) return { rows: [{ next_version: 2 }] as unknown as Row[], rowCount: 1 };
    if (sqlText.includes('FROM student_document_versions')) return { rows: this.versionRows as unknown as Row[], rowCount: this.versionRows.length };
    if (sqlText.includes('FROM student_documents d')) return { rows: this.documentRow ? [this.documentRow as Row] : [], rowCount: this.documentRow ? 1 : 0 };
    if (sqlText.includes('SELECT id') && sqlText.includes('FROM student_documents')) return { rows: [] as Row[], rowCount: 0 };
    return { rows: [] as Row[], rowCount: 0 };
  }

  async commit(): Promise<void> {
    this.committed = true;
    if (this.failCommit) throw new Error('simulated commit failure');
  }

  async rollback(): Promise<void> { this.rolledBack = true; }
  async release(): Promise<void> {}
}

class FakeDriver implements TransactionDriver {
  readonly sessions: FakeSession[] = [];
  failCommit = false;
  documentRow: Record<string, unknown> | null = null;
  versionRows: Array<Record<string, unknown>> = [];

  async begin(_options: TransactionBeginOptions): Promise<TransactionSession> {
    const session = new FakeSession();
    session.failCommit = this.failCommit;
    session.documentRow = this.documentRow;
    session.versionRows = this.versionRows;
    this.sessions.push(session);
    return session;
  }
}

function context(overrides: Partial<StudentDocumentRequestContext> = {}): StudentDocumentRequestContext {
  return {
    tenantId: TENANT,
    schoolId: SCHOOL,
    branchId: BRANCH,
    academicYear: '77777777-7777-4777-8777-777777777777',
    userId: USER,
    role: 'student_affairs',
    requestId: '88888888-8888-4888-8888-888888888888',
    correlationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    ipAddress: '127.0.0.1',
    idempotencyKey: 'doc-test-001',
    ...overrides,
  };
}

function input() {
  return {
    tenantId: FORGED,
    schoolId: FORGED,
    branchId: FORGED,
    createdBy: FORGED,
    categoryId: CATEGORY,
    documentReference: 'DOC-001',
    title: 'Identity Document',
    classification: 'confidential' as const,
    verificationStatus: 'pending' as const,
    originalFileName: 'identity.pdf',
    mediaType: 'application/pdf',
    byteSize: 1024,
    contentHash: 'a'.repeat(64),
    retentionUntil: '2030-01-01',
    archiveEligibleOn: '2029-01-01',
    legalHold: false,
  };
}

afterEach(() => UnitOfWork.configureTransactionDriver(null));

describe('DOC-001R StudentDocumentService', () => {
  it('rejects unbounded pagination before database access', () => {
    expect(() => normalizeDocumentListFilters({ limit: '101' })).toThrow(ValidationError);
  });

  it('uses trusted tenant and actor values instead of client metadata', async () => {
    const driver = new FakeDriver();
    UnitOfWork.configureTransactionDriver(driver);
    const result = await new StudentDocumentService().registerDocument(context(), STUDENT, input());
    expect(result.idempotent).toBe(false);
    expect(driver.sessions[0].calls.flatMap(call => call.parameters)).not.toContain(FORGED);
    expect(driver.sessions[0].calls.flatMap(call => call.parameters)).toContain(TENANT);
  });

  it('rolls back the complete document operation when commit fails', async () => {
    const driver = new FakeDriver();
    driver.failCommit = true;
    UnitOfWork.configureTransactionDriver(driver);
    await expect(new StudentDocumentService().registerDocument(context({ idempotencyKey: 'doc-test-rollback' }), STUDENT, input())).rejects.toBeInstanceOf(DatabaseError);
    expect(driver.sessions[0].committed).toBe(true);
    expect(driver.sessions[0].rolledBack).toBe(true);
  });

  it('requires a reason for every verification decision, including approval', async () => {
    const driver = new FakeDriver();
    UnitOfWork.configureTransactionDriver(driver);
    await expect(new StudentDocumentService().decide(context({ idempotencyKey: 'doc-verify-no-reason' }), DOCUMENT, 'verify', '')).rejects.toBeInstanceOf(ValidationError);
    expect(driver.sessions).toHaveLength(0);
  });

  it('rejects verification from a draft lifecycle state', async () => {
    const driver = new FakeDriver();
    driver.documentRow = {
      id: DOCUMENT,
      tenant_id: TENANT,
      school_id: SCHOOL,
      branch_id: BRANCH,
      student_id: STUDENT,
      category_id: CATEGORY,
      document_reference: 'DOC-001',
      lifecycle_status: 'draft',
      verification_status: 'not_required',
      classification: 'confidential',
      current_version_number: 1,
      retention_until: null,
      legal_hold: false,
      archive_eligible_on: null,
      verified_at: null,
      verified_by: null,
      version: 1,
      deleted_at: null,
    };
    UnitOfWork.configureTransactionDriver(driver);
    await expect(new StudentDocumentService().decide(context({ idempotencyKey: 'doc-verify-draft' }), DOCUMENT, 'verify', 'approved')).rejects.toBeInstanceOf(ConflictError);
  });

  it('returns rejected or expired documents to pending verification when a new version is added', async () => {
    const driver = new FakeDriver();
    driver.documentRow = {
      id: DOCUMENT,
      tenant_id: TENANT,
      school_id: SCHOOL,
      branch_id: BRANCH,
      student_id: STUDENT,
      category_id: CATEGORY,
      document_reference: 'DOC-001',
      lifecycle_status: 'draft',
      verification_status: 'rejected',
      classification: 'confidential',
      current_version_number: 1,
      retention_until: null,
      legal_hold: false,
      archive_eligible_on: null,
      verified_at: null,
      verified_by: null,
      version: 1,
      deleted_at: null,
    };
    driver.versionRows = [{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', version_number: 1, is_current: true }];
    UnitOfWork.configureTransactionDriver(driver);
    await new StudentDocumentService().addVersion(context({ idempotencyKey: 'doc-new-version' }), DOCUMENT, {
      revisionReason: 'Corrected metadata',
      originalFileName: 'identity-v2.pdf',
      mediaType: 'application/pdf',
      byteSize: 1024,
      contentHash: 'b'.repeat(64),
    });
    const update = driver.sessions[0].calls.find(call => call.sql.includes('UPDATE student_documents'));
    expect(update?.parameters).toContain('pending_verification');
    expect(update?.parameters).toContain('pending');
  });

  it('namespaces idempotency keys by operation and resource', async () => {
    const driver = new FakeDriver();
    UnitOfWork.configureTransactionDriver(driver);
    await new StudentDocumentService().registerDocument(context({ idempotencyKey: 'same-client-key' }), STUDENT, input());
    const outboxInsert = driver.sessions[0].calls.find(call => call.sql.includes('INSERT INTO outbox_events'));
    expect(outboxInsert?.parameters).toContain(`document:register:${STUDENT}:same-client-key`);
  });
});
