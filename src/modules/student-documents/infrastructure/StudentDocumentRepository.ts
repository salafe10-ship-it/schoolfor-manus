import { UnitOfWork } from '../../../database/UnitOfWork.js';
import { SQLCommandBuilder } from '../../../database/transactions/SQLCommand.js';
import type { TransactionSession } from '../../../database/transactions/TransactionContracts.js';
import { DatabaseError } from '../../../utils/errors.js';
import type { DocumentListFilters, StudentDocumentRequestContext } from '../domain/types.js';

type DbRow = Record<string, any>;

function transaction(): TransactionSession {
  const context = UnitOfWork.getActiveContext();
  if (!context?.isActive || !context.databaseTransaction) {
    throw new DatabaseError('Student document operations require an active PostgreSQL transaction.');
  }
  return context.databaseTransaction;
}

async function one<T extends DbRow>(sql: string, parameters: readonly unknown[]): Promise<T | null> {
  const result = await transaction().query<T>(sql, parameters);
  return result.rows[0] || null;
}

async function many<T extends DbRow>(sql: string, parameters: readonly unknown[]): Promise<T[]> {
  const result = await transaction().query<T>(sql, parameters);
  return result.rows;
}

function enqueue(table: string, id: string, sqlText: string, parameters: unknown[], summary: Record<string, unknown>): void {
  UnitOfWork.enlistCreate(
    table,
    id,
    summary,
    SQLCommandBuilder.create({
      sqlText,
      parameters,
      executionContext: `DOC-001R ${table}`,
      tenantContext: 'TRUSTED_TENANT_CONTEXT'
    })
  );
}

function enqueueUpdate(table: string, id: string, sqlText: string, parameters: unknown[], summary: Record<string, unknown>): void {
  UnitOfWork.enlistUpdate(
    table,
    id,
    summary,
    SQLCommandBuilder.create({
      sqlText,
      parameters,
      executionContext: `DOC-001R ${table} update`,
      tenantContext: 'TRUSTED_TENANT_CONTEXT'
    })
  );
}

export type ExistingIdempotentResult = {
  payload: Record<string, any>;
  aggregateId: string;
};

export type CategoryRow = {
  id: string;
  tenant_id: string;
  category_code: string;
  display_name: string;
  description: string | null;
  sort_order: number;
  status: string;
  version: number;
  deleted_at: string | null;
};

export type DocumentRow = {
  id: string;
  tenant_id: string;
  school_id: string;
  branch_id: string | null;
  student_id: string;
  category_id: string;
  category_code?: string;
  category_name?: string;
  document_reference: string;
  title: string;
  description: string | null;
  lifecycle_status: string;
  verification_status: string;
  classification: string;
  current_version_number: number;
  retention_until: string | null;
  legal_hold: boolean;
  archive_eligible_on: string | null;
  verified_at: string | null;
  verified_by: string | null;
  version: number;
  deleted_at: string | null;
};

export type VersionRow = {
  id: string;
  document_id: string;
  version_number: number;
  revision_reason: string | null;
  original_file_name: string;
  media_type: string;
  byte_size: number;
  content_hash: string;
  is_current: boolean;
  uploaded_at: string;
  uploaded_by: string | null;
  version: number;
};

export type AccessLogRow = {
  id: string;
  document_id: string;
  document_version_id: string | null;
  actor_user_id: string | null;
  access_type: string;
  access_result: string;
  reason_code: string | null;
  occurred_at: string;
  request_id: string | null;
  correlation_id: string | null;
};

export async function resolveInternalActorUserId(tenantId: string, trustedUserId: string, schoolId: string, branchId: string): Promise<string> {
  const row = await one<{ id: string }>(
    `SELECT id
       FROM users
      WHERE tenant_id = $1::uuid
        AND (id = $2::uuid OR auth_user_id = $2::uuid)
        AND (school_id IS NULL OR school_id = $3::uuid)
        AND (branch_id IS NULL OR branch_id = $4::uuid)
        AND deleted_at IS NULL
        AND status IN ('invited', 'active')
      LIMIT 1`,
    [tenantId, trustedUserId, schoolId, branchId]
  );
  if (!row?.id) throw new DatabaseError('Trusted internal actor reference is unavailable.');
  return row.id;
}

export async function findIdempotentResult(tenantId: string, idempotencyKey: string): Promise<ExistingIdempotentResult | null> {
  const row = await one<ExistingIdempotentResult>(
    `SELECT aggregate_id AS "aggregateId", payload
       FROM outbox_events
      WHERE tenant_id = $1::uuid
        AND idempotency_key = $2
        AND deleted_at IS NULL
      LIMIT 1`,
    [tenantId, idempotencyKey]
  );
  return row;
}

export async function assertStudentInScope(context: StudentDocumentRequestContext, studentId: string): Promise<void> {
  const row = await one<{ id: string }>(
    `SELECT id
       FROM students
      WHERE tenant_id = $1::uuid
        AND school_id = $2::uuid
        AND id = $3::uuid
        AND (branch_id IS NULL OR branch_id = $4::uuid)
        AND deleted_at IS NULL
      LIMIT 1`,
    [context.tenantId, context.schoolId, studentId, context.branchId]
  );
  if (!row) throw new DatabaseError('Student document resource is not available in the trusted scope.');
}

export async function getActiveCategory(tenantId: string, categoryId: string): Promise<CategoryRow | null> {
  return one<CategoryRow>(
    `SELECT id, tenant_id, category_code, display_name, description, sort_order, status, version, deleted_at
       FROM student_document_categories
      WHERE tenant_id = $1::uuid
        AND id = $2::uuid
        AND status = 'active'
        AND deleted_at IS NULL`,
    [tenantId, categoryId]
  );
}

export async function getCategoryById(tenantId: string, categoryId: string): Promise<CategoryRow | null> {
  return one<CategoryRow>(
    `SELECT id, tenant_id, category_code, display_name, description, sort_order, status, version, deleted_at
       FROM student_document_categories
      WHERE tenant_id = $1::uuid AND id = $2::uuid
      LIMIT 1`,
    [tenantId, categoryId]
  );
}

export async function assertDocumentReferenceAvailable(tenantId: string, documentReference: string): Promise<void> {
  const row = await one<{ id: string }>(
    `SELECT id
       FROM student_documents
      WHERE tenant_id = $1::uuid
        AND document_reference = $2
        AND deleted_at IS NULL
      LIMIT 1`,
    [tenantId, documentReference]
  );
  if (row) throw new DatabaseError('Document reference is already in use.');
}

export async function nextVersionNumber(context: StudentDocumentRequestContext, documentId: string): Promise<number> {
  const row = await one<{ next_version: number }>(
    `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
       FROM student_document_versions
      WHERE tenant_id = $1::uuid
        AND school_id = $2::uuid
        AND (branch_id IS NULL OR branch_id = $3::uuid)
        AND document_id = $4::uuid`,
    [context.tenantId, context.schoolId, context.branchId, documentId]
  );
  return Number(row?.next_version || 1);
}

export async function listCategories(tenantId: string, search: string | undefined, includeInactive: boolean): Promise<CategoryRow[]> {
  const searchTerm = search?.trim() || null;
  return many<CategoryRow>(
    `SELECT id, tenant_id, category_code, display_name, description, sort_order, status, version, deleted_at
       FROM student_document_categories
      WHERE tenant_id = $1::uuid
        AND deleted_at IS NULL
        AND ($2::boolean = true OR status = 'active')
        AND ($3::text IS NULL OR category_code ILIKE '%' || $3 || '%' OR display_name ILIKE '%' || $3 || '%')
      ORDER BY sort_order ASC, category_code ASC`,
    [tenantId, includeInactive, searchTerm]
  );
}

export async function getDocumentForUpdate(context: StudentDocumentRequestContext, documentId: string, includeArchived = false): Promise<DocumentRow | null> {
  return one<DocumentRow>(
    `SELECT d.id, d.tenant_id, d.school_id, d.branch_id, d.student_id, d.category_id,
            c.category_code, c.display_name AS category_name, d.document_reference, d.title,
            d.description, d.lifecycle_status, d.verification_status, d.classification,
            d.current_version_number, d.retention_until, d.legal_hold, d.archive_eligible_on,
            d.verified_at, d.verified_by, d.version, d.deleted_at
       FROM student_documents d
       JOIN student_document_categories c ON c.tenant_id = d.tenant_id AND c.id = d.category_id
      WHERE d.tenant_id = $1::uuid
        AND d.school_id = $2::uuid
        AND (d.branch_id IS NULL OR d.branch_id = $3::uuid)
        AND d.id = $4::uuid
        AND ($5::boolean = true OR d.deleted_at IS NULL)
      FOR UPDATE`,
    [context.tenantId, context.schoolId, context.branchId, documentId, includeArchived]
  );
}

export async function getDocument(context: StudentDocumentRequestContext, documentId: string, includeArchived = false): Promise<DocumentRow | null> {
  return one<DocumentRow>(
    `SELECT d.id, d.tenant_id, d.school_id, d.branch_id, d.student_id, d.category_id,
            c.category_code, c.display_name AS category_name, d.document_reference, d.title,
            d.description, d.lifecycle_status, d.verification_status, d.classification,
            d.current_version_number, d.retention_until, d.legal_hold, d.archive_eligible_on,
            d.verified_at, d.verified_by, d.version, d.deleted_at
       FROM student_documents d
       JOIN student_document_categories c ON c.tenant_id = d.tenant_id AND c.id = d.category_id
      WHERE d.tenant_id = $1::uuid
        AND d.school_id = $2::uuid
        AND (d.branch_id IS NULL OR d.branch_id = $3::uuid)
        AND d.id = $4::uuid
        AND ($5::boolean = true OR d.deleted_at IS NULL)`,
    [context.tenantId, context.schoolId, context.branchId, documentId, includeArchived]
  );
}

export async function listDocuments(context: StudentDocumentRequestContext, filters: DocumentListFilters): Promise<{ rows: DocumentRow[]; total: number }> {
  const offset = (filters.page - 1) * filters.limit;
  const params: unknown[] = [context.tenantId, context.schoolId, context.branchId, filters.studentId || null, filters.search?.trim() || null, filters.categoryId || null, filters.lifecycleStatus || null, filters.verificationStatus || null, filters.classification || null, filters.retention || null, filters.limit, offset];
  const where = `d.tenant_id = $1::uuid
        AND d.school_id = $2::uuid
        AND (d.branch_id IS NULL OR d.branch_id = $3::uuid)
        AND ($4::uuid IS NULL OR d.student_id = $4::uuid)
        AND d.deleted_at IS NULL
        AND ($5::text IS NULL OR d.document_reference ILIKE '%' || $5 || '%' OR d.title ILIKE '%' || $5 || '%')
        AND ($6::uuid IS NULL OR d.category_id = $6::uuid)
        AND ($7::text IS NULL OR d.lifecycle_status = $7)
        AND ($8::text IS NULL OR d.verification_status = $8)
        AND ($9::text IS NULL OR d.classification = $9)
        AND ($10::text IS NULL
          OR ($10 = 'held' AND d.legal_hold = true)
          OR ($10 = 'due' AND d.retention_until IS NOT NULL AND d.retention_until <= CURRENT_DATE)
          OR ($10 = 'eligible' AND d.archive_eligible_on IS NOT NULL AND d.archive_eligible_on <= CURRENT_DATE AND d.legal_hold = false))`;
  const rows = await many<DocumentRow>(
    `SELECT d.id, d.tenant_id, d.school_id, d.branch_id, d.student_id, d.category_id,
            c.category_code, c.display_name AS category_name, d.document_reference, d.title,
            d.description, d.lifecycle_status, d.verification_status, d.classification,
            d.current_version_number, d.retention_until, d.legal_hold, d.archive_eligible_on,
            d.verified_at, d.verified_by, d.version, d.deleted_at
       FROM student_documents d
       JOIN student_document_categories c ON c.tenant_id = d.tenant_id AND c.id = d.category_id
      WHERE ${where}
      ORDER BY d.updated_at DESC, d.id
      LIMIT $11 OFFSET $12`,
    params
  );
  const countRow = await one<{ total: string }>(`SELECT COUNT(*)::text AS total FROM student_documents d WHERE ${where}`, params.slice(0, 10));
  return { rows, total: Number(countRow?.total || 0) };
}

export async function listVersions(context: StudentDocumentRequestContext, documentId: string): Promise<VersionRow[]> {
  return many<VersionRow>(
    `SELECT id, document_id, version_number, revision_reason, original_file_name, media_type,
            byte_size, content_hash, is_current, uploaded_at, uploaded_by, version
       FROM student_document_versions
      WHERE tenant_id = $1::uuid
        AND school_id = $2::uuid
        AND (branch_id IS NULL OR branch_id = $3::uuid)
        AND document_id = $4::uuid
      ORDER BY version_number DESC`,
    [context.tenantId, context.schoolId, context.branchId, documentId]
  );
}

export async function listAccessLogs(context: StudentDocumentRequestContext, documentId: string, limit: number): Promise<AccessLogRow[]> {
  return many<AccessLogRow>(
    `SELECT id, document_id, document_version_id, actor_user_id, access_type, access_result,
            reason_code, occurred_at, request_id, correlation_id
       FROM student_document_access_log
      WHERE tenant_id = $1::uuid
        AND school_id = $2::uuid
        AND (branch_id IS NULL OR branch_id = $3::uuid)
        AND document_id = $4::uuid
      ORDER BY occurred_at DESC
      LIMIT $5`,
    [context.tenantId, context.schoolId, context.branchId, documentId, limit]
  );
}

export async function insertAuditEvent(input: {
  id: string; tenantId: string; schoolId: string; branchId: string; actorUserId: string;
  entityType: string; entityId: string; action: string; reason?: string | null; result?: 'success' | 'failure' | 'partial' | 'denied';
  requestId: string; correlationId: string; metadata: Record<string, unknown>;
}): Promise<void> {
  enqueue('audit_events', input.id,
    `INSERT INTO audit_events
      (id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata, request_id, correlation_id)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7::uuid, $8, 'student-documents', $9, $10, $11::jsonb, $12::uuid, $13::uuid)`,
    [input.id, input.tenantId, input.schoolId, input.branchId, input.actorUserId, input.entityType, input.entityId, input.action, input.reason || null, input.result || 'success', JSON.stringify(input.metadata), input.requestId, input.correlationId],
    { id: input.id, tenantId: input.tenantId, entityType: input.entityType, entityId: input.entityId, action: input.action });
}

export async function insertOutboxEvent(input: {
  id: string; tenantId: string; eventType: string; aggregateType: string; aggregateId: string;
  payload: Record<string, unknown>; payloadHash: string; idempotencyKey: string; requestId: string;
  correlationId: string; actorUserId: string; auditId: string;
}): Promise<void> {
  enqueue('outbox_events', input.id,
    `INSERT INTO outbox_events
      (id, tenant_id, event_type, aggregate_type, aggregate_id, event_version, payload, payload_hash, idempotency_key, status, request_id, correlation_id, created_by, updated_by, audit_id)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5::uuid, 1, $6::jsonb, $7, $8, 'pending', $9::uuid, $10::uuid, $11::uuid, $11::uuid, $12::uuid)`,
    [input.id, input.tenantId, input.eventType, input.aggregateType, input.aggregateId, JSON.stringify(input.payload), input.payloadHash, input.idempotencyKey, input.requestId, input.correlationId, input.actorUserId, input.auditId],
    { id: input.id, tenantId: input.tenantId, eventType: input.eventType, aggregateId: input.aggregateId });
}

export async function insertAccessLog(input: {
  id: string; tenantId: string; schoolId: string; branchId: string; studentId: string; documentId: string;
  documentVersionId?: string | null; actorUserId: string; accessType: string; accessResult?: 'allowed' | 'denied' | 'failed';
  reasonCode?: string | null; requestId: string; correlationId: string; createdBy: string; auditId: string;
}): Promise<void> {
  enqueue('student_document_access_log', input.id,
    `INSERT INTO student_document_access_log
      (id, tenant_id, school_id, branch_id, student_id, document_id, document_version_id, actor_user_id, access_type, access_result, reason_code, occurred_at, request_id, correlation_id, created_by, audit_id)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7::uuid, $8::uuid, $9, $10, $11, now(), $12::uuid, $13::uuid, $14::uuid, $15::uuid)`,
    [input.id, input.tenantId, input.schoolId, input.branchId, input.studentId, input.documentId, input.documentVersionId || null, input.actorUserId, input.accessType, input.accessResult || 'allowed', input.reasonCode || null, input.requestId, input.correlationId, input.createdBy, input.auditId],
    { id: input.id, tenantId: input.tenantId, documentId: input.documentId, accessType: input.accessType });
}

export function insertCategory(input: { id: string; tenantId: string; code: string; name: string; description: string | null; sortOrder: number; actorUserId: string; auditId: string; requestId: string; correlationId: string }): void {
  enqueue('student_document_categories', input.id,
    `INSERT INTO student_document_categories
      (id, tenant_id, category_code, display_name, description, sort_order, status, version, created_by, updated_by, audit_id, request_id, correlation_id)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, 'active', 1, $7::uuid, $7::uuid, $8::uuid, $9::uuid, $10::uuid)`,
    [input.id, input.tenantId, input.code, input.name, input.description, input.sortOrder, input.actorUserId, input.auditId, input.requestId, input.correlationId],
    { id: input.id, tenantId: input.tenantId, categoryCode: input.code });
}

export function insertDocument(input: { id: string; tenantId: string; schoolId: string; branchId: string; studentId: string; categoryId: string; reference: string; title: string; description: string | null; lifecycle: string; verification: string; classification: string; retentionUntil: string | null; legalHold: boolean; archiveEligibleOn: string | null; actorUserId: string; auditId: string; requestId: string; correlationId: string }): void {
  enqueue('student_documents', input.id,
    `INSERT INTO student_documents
      (id, tenant_id, school_id, branch_id, student_id, category_id, document_reference, title, description, lifecycle_status, verification_status, classification, current_version_number, retention_until, legal_hold, archive_eligible_on, version, created_by, updated_by, audit_id, request_id, correlation_id)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7, $8, $9, $10, $11, $12, 1, $13::date, $14, $15::date, 1, $16::uuid, $16::uuid, $17::uuid, $18::uuid, $19::uuid)`,
    [input.id, input.tenantId, input.schoolId, input.branchId, input.studentId, input.categoryId, input.reference, input.title, input.description, input.lifecycle, input.verification, input.classification, input.retentionUntil, input.legalHold, input.archiveEligibleOn, input.actorUserId, input.auditId, input.requestId, input.correlationId],
    { id: input.id, tenantId: input.tenantId, studentId: input.studentId, documentReference: input.reference });
}

export function insertVersion(input: { id: string; tenantId: string; schoolId: string; branchId: string; studentId: string; documentId: string; versionNumber: number; revisionReason: string | null; originalFileName: string; mediaType: string; byteSize: number; contentHash: string; actorUserId: string; auditId: string; requestId: string; correlationId: string }): void {
  enqueue('student_document_versions', input.id,
    `INSERT INTO student_document_versions
      (id, tenant_id, school_id, branch_id, student_id, document_id, version_number, revision_reason, original_file_name, media_type, byte_size, content_hash, is_current, uploaded_by, created_by, updated_by, audit_id, request_id, correlation_id)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7, $8, $9, $10, $11, $12, true, $13::uuid, $13::uuid, $13::uuid, $14::uuid, $15::uuid, $16::uuid)`,
    [input.id, input.tenantId, input.schoolId, input.branchId, input.studentId, input.documentId, input.versionNumber, input.revisionReason, input.originalFileName, input.mediaType, input.byteSize, input.contentHash, input.actorUserId, input.auditId, input.requestId, input.correlationId],
    { id: input.id, tenantId: input.tenantId, documentId: input.documentId, versionNumber: input.versionNumber });
}

export function updateCurrentVersion(input: { id: string; tenantId: string; schoolId: string; branchId: string; documentId: string }): void {
  enqueueUpdate('student_document_versions', input.id,
    `UPDATE student_document_versions
        SET is_current = false, updated_at = now()
      WHERE tenant_id = $1::uuid AND school_id = $2::uuid AND (branch_id IS NULL OR branch_id = $3::uuid) AND document_id = $4::uuid AND id = $5::uuid AND deleted_at IS NULL`,
    [input.tenantId, input.schoolId, input.branchId, input.documentId, input.id],
    { id: input.id, tenantId: input.tenantId, documentId: input.documentId, isCurrent: false });
}

export function updateDocument(input: { id: string; tenantId: string; schoolId: string; branchId: string; lifecycle: string; verification: string; classification: string; currentVersionNumber: number; retentionUntil: string | null; legalHold: boolean; archiveEligibleOn: string | null; verifiedAt: string | null; verifiedBy: string | null; deletedAt: string | null; deletedBy: string | null; actorUserId: string; expectedVersion: number; allowRestore?: boolean }): void {
  enqueueUpdate('student_documents', input.id,
    `UPDATE student_documents
        SET lifecycle_status = $5,
            verification_status = $6,
            classification = $7,
            current_version_number = $8,
            retention_until = $9::date,
            legal_hold = $10,
            archive_eligible_on = $11::date,
            verified_at = $12::timestamptz,
            verified_by = $13::uuid,
            version = version + 1,
            updated_at = now(),
            updated_by = $14::uuid,
            deleted_at = $15::timestamptz,
            deleted_by = $16::uuid
      WHERE tenant_id = $1::uuid AND school_id = $2::uuid AND (branch_id IS NULL OR branch_id = $3::uuid) AND id = $4::uuid AND version = $17
        AND ($18::boolean = true OR deleted_at IS NULL)`,
    [input.tenantId, input.schoolId, input.branchId, input.id, input.lifecycle, input.verification, input.classification, input.currentVersionNumber, input.retentionUntil, input.legalHold, input.archiveEligibleOn, input.verifiedAt, input.verifiedBy, input.actorUserId, input.deletedAt, input.deletedBy, input.expectedVersion, input.allowRestore === true],
    { id: input.id, tenantId: input.tenantId, expectedVersion: input.expectedVersion });
}

export function updateCategory(input: { id: string; tenantId: string; name: string; description: string | null; sortOrder: number; status: string; actorUserId: string; deletedAt: string | null; deletedBy: string | null; expectedVersion: number }): void {
  enqueueUpdate('student_document_categories', input.id,
    `UPDATE student_document_categories
        SET display_name = $3,
            description = $4,
            sort_order = $5,
            status = $6,
            version = version + 1,
            updated_at = now(),
            updated_by = $7::uuid,
            deleted_at = $8::timestamptz,
            deleted_by = $9::uuid
      WHERE tenant_id = $1::uuid AND id = $2::uuid AND version = $10 AND deleted_at IS NULL`,
    [input.tenantId, input.id, input.name, input.description, input.sortOrder, input.status, input.actorUserId, input.deletedAt, input.deletedBy, input.expectedVersion],
    { id: input.id, tenantId: input.tenantId, expectedVersion: input.expectedVersion });
}
