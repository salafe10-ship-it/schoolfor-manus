import { createHash, randomUUID } from 'node:crypto';
import { UnitOfWork } from '../../../database/UnitOfWork.js';
import { AuthorizationError, ConflictError, DatabaseError, NotFoundError, ValidationError } from '../../../utils/errors.js';
import { DOCUMENT_CLASSIFICATIONS, DOCUMENT_LIFECYCLE_STATUSES, DOCUMENT_VERIFICATION_STATUSES, type DocumentCategoryInput, type DocumentDecision, type DocumentListFilters, type DocumentOperationResult, type DocumentStorageInput, type DocumentVersionInput, type StudentDocumentInput, type StudentDocumentRequestContext } from '../domain/types.js';
import {
  assertDocumentReferenceAvailable,
  assertStudentInScope,
  findIdempotentResult,
  getActiveCategory,
  getCategoryById,
  getDocument,
  getDocumentForUpdate,
  getCurrentStorageObject,
  insertAccessLog,
  insertAuditEvent,
  insertCategory,
  insertDocument,
  insertOutboxEvent,
  insertStorageObject,
  insertVersion,
  listAccessLogs,
  listCategories,
  listDocuments,
  listVersions,
  nextVersionNumber,
  resolveInternalActorUserId,
  updateCategory,
  updateCurrentVersion,
  updateDocument,
  type DocumentRow,
} from '../infrastructure/StudentDocumentRepository.js';

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const STUDENT_DOCUMENT_BUCKET = 'student-documents-private' as const;
const STORED_MEDIA_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);

function text(value: unknown, field: string, maxLength = 500): string {
  if (typeof value !== 'string') throw new ValidationError(`${field} is required.`);
  const trimmed = value.trim();
  if (!trimmed) throw new ValidationError(`${field} is required.`);
  if (trimmed.length > maxLength) throw new ValidationError(`${field} exceeds the permitted length.`);
  return trimmed;
}

function optionalText(value: unknown, field: string, maxLength = 2000): string | null {
  if (value === undefined || value === null || value === '') return null;
  return text(value, field, maxLength);
}

function uuid(value: unknown, field: string): string {
  const valueText = text(value, field, 80);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valueText)) {
    throw new ValidationError(`${field} must be a valid identifier.`);
  }
  return valueText;
}

function dateOnly(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  const valueText = text(value, field, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valueText) || Number.isNaN(Date.parse(`${valueText}T00:00:00Z`))) {
    throw new ValidationError(`${field} must be an ISO date.`);
  }
  return valueText;
}

function positiveVersion(value: unknown, field = 'expectedVersion'): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new ValidationError(`${field} must be a positive integer.`);
  return parsed;
}

function boundedPage(value: unknown, fallback: number, maximum: number): number {
  const parsed = value === undefined || value === '' ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) throw new ValidationError('Pagination value is outside the permitted range.');
  return parsed;
}

function classification(value: unknown): StudentDocumentInput['classification'] {
  const valueText = text(value, 'classification', 40);
  if (!DOCUMENT_CLASSIFICATIONS.includes(valueText as any)) throw new ValidationError('Classification is not supported.');
  return valueText as StudentDocumentInput['classification'];
}

function lifecycle(value: unknown): string {
  const valueText = text(value, 'lifecycleStatus', 40);
  if (!DOCUMENT_LIFECYCLE_STATUSES.includes(valueText as any)) throw new ValidationError('Lifecycle status is not supported.');
  return valueText;
}

function verification(value: unknown): string {
  const valueText = text(value, 'verificationStatus', 40);
  if (!DOCUMENT_VERIFICATION_STATUSES.includes(valueText as any)) throw new ValidationError('Verification status is not supported.');
  return valueText;
}

function validateFileMetadata(input: DocumentVersionInput): DocumentVersionInput {
  const originalFileName = text(input.originalFileName, 'originalFileName', 255);
  if (originalFileName.includes('\\') || originalFileName.includes('/') || originalFileName === '.' || originalFileName === '..') {
    throw new ValidationError('originalFileName must not contain a path.');
  }
  const mediaType = text(input.mediaType, 'mediaType', 255).toLowerCase();
  if (!/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/.test(mediaType)) {
    throw new ValidationError('mediaType is invalid.');
  }
  if (!Number.isInteger(input.byteSize) || input.byteSize < 0 || input.byteSize > MAX_DOCUMENT_BYTES) {
    throw new ValidationError('byteSize is outside the deployment limit.');
  }
  const contentHash = text(input.contentHash, 'contentHash', 512);
  if (contentHash.length < 32 || !/^[a-z0-9:_-]+$/i.test(contentHash)) {
    throw new ValidationError('contentHash must be a normalized integrity reference.');
  }
  return { revisionReason: optionalText(input.revisionReason, 'revisionReason', 1000), originalFileName, mediaType, byteSize: input.byteSize, contentHash };
}

function validateStorageInput(storage: DocumentStorageInput | undefined, file: DocumentVersionInput): DocumentStorageInput | undefined {
  if (!storage) return undefined;
  if (storage.bucketId !== STUDENT_DOCUMENT_BUCKET) throw new ValidationError('The private document bucket is invalid.');
  if (!STORED_MEDIA_TYPES.has(file.mediaType) || file.byteSize < 1 || !/^[0-9a-f]{64}$/.test(file.contentHash)) {
    throw new ValidationError('Stored document metadata is outside the approved binary policy.');
  }
  if (!/^[0-9a-f-]+\/[0-9a-f-]+\/[0-9a-f-]+\/[0-9a-f-]+\/[0-9a-f]{64}\.(pdf|png|jpg)$/.test(storage.objectKey)) {
    throw new ValidationError('The private document object key is invalid.');
  }
  return storage;
}

function assertIdempotentFingerprint(existing: Awaited<ReturnType<typeof findIdempotentResult>>, fingerprint: string): void {
  const previous = existing?.payload?.requestFingerprint;
  if (previous && previous !== fingerprint) {
    throw new ConflictError('Idempotency-Key was already used with a different document payload.');
  }
}

function validateRetention(retentionUntil: string | null, archiveEligibleOn: string | null): void {
  if (retentionUntil && archiveEligibleOn && archiveEligibleOn > retentionUntil) {
    throw new ValidationError('Archive eligibility cannot exceed the retention end date.');
  }
}

function requireIdempotency(context: StudentDocumentRequestContext, scope: string): string {
  const key = text(context.idempotencyKey, 'Idempotency-Key', 200);
  if (!/^[\x21-\x7E]+$/.test(key)) throw new ValidationError('Idempotency-Key contains unsupported characters.');
  return `${scope}:${key}`;
}

function payloadHash(payload: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as any).code === '23505');
}

function requireDocument(row: DocumentRow | null): DocumentRow {
  if (!row) throw new NotFoundError('Student document was not found in the trusted scope.');
  return row;
}

export function normalizeDocumentListFilters(query: Record<string, unknown>): DocumentListFilters {
  const lifecycleStatus = query.lifecycleStatus === undefined ? undefined : lifecycle(query.lifecycleStatus);
  const verificationStatus = query.verificationStatus === undefined ? undefined : verification(query.verificationStatus);
  const classificationValue = query.classification === undefined ? undefined : classification(query.classification);
  const retention = query.retention === undefined || query.retention === '' ? undefined : text(query.retention, 'retention', 20) as DocumentListFilters['retention'];
  if (retention && !['due', 'held', 'eligible'].includes(retention)) throw new ValidationError('Retention filter is not supported.');
  return {
    studentId: query.studentId ? uuid(query.studentId, 'studentId') : undefined,
    search: query.search ? text(query.search, 'search', 100) : undefined,
    categoryId: query.categoryId ? uuid(query.categoryId, 'categoryId') : undefined,
    lifecycleStatus: lifecycleStatus as DocumentListFilters['lifecycleStatus'],
    verificationStatus: verificationStatus as DocumentListFilters['verificationStatus'],
    classification: classificationValue,
    retention,
    page: boundedPage(query.page, 1, 1000000),
    limit: boundedPage(query.limit, 25, 100),
  };
}

export class StudentDocumentService {
  private async transaction<T>(context: StudentDocumentRequestContext, operationName: string, affectedTables: string[], work: () => Promise<T>): Promise<T> {
    try {
      return await UnitOfWork.runInTransaction(
        context.schoolId,
        {
          operationName,
          userId: context.userId,
          userName: context.userId,
          ipAddress: context.ipAddress,
          affectedTables,
          tenantId: context.tenantId,
        },
        work,
        context
      );
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthorizationError || error instanceof ConflictError || error instanceof NotFoundError || error instanceof DatabaseError) throw error;
      if (isUniqueViolation(error)) throw new ConflictError('Student document operation conflicts with an existing record.');
      throw new DatabaseError('Student document operation failed.');
    }
  }

  async listCategories(context: StudentDocumentRequestContext, search?: string, includeInactive = false) {
    return this.transaction(context, 'DOC-001R list categories', ['student_document_categories'], () => listCategories(context.tenantId, search, includeInactive));
  }

  async createCategory(context: StudentDocumentRequestContext, input: DocumentCategoryInput) {
    const key = requireIdempotency(context, 'category:create');
    const code = text(input.categoryCode, 'categoryCode', 80);
    if (!/^[A-Z0-9][A-Z0-9._/-]*$/.test(code)) throw new ValidationError('categoryCode must use the approved format.');
    const name = text(input.displayName, 'displayName', 200);
    const sortOrder = input.sortOrder === undefined ? 0 : Number(input.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) throw new ValidationError('sortOrder must be a non-negative integer.');
    const description = optionalText(input.description, 'description');
    return this.transaction(context, 'DOC-001R create category', ['student_document_categories', 'audit_events', 'outbox_events'], async () => {
      const existing = await findIdempotentResult(context.tenantId, key);
      if (existing?.payload?.result) return { ...(existing.payload.result as Record<string, unknown>), idempotent: true };
      const actorUserId = await resolveInternalActorUserId(context.tenantId, context.userId, context.schoolId, context.branchId);
      const categoryId = randomUUID();
      const auditId = randomUUID();
      const outboxId = randomUUID();
      const result = { categoryId, categoryCode: code, requestId: context.requestId, correlationId: context.correlationId, idempotent: false };
      await insertAuditEvent({ id: auditId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, actorUserId, entityType: 'student_document_category', entityId: categoryId, action: 'CREATE', requestId: context.requestId, correlationId: context.correlationId, metadata: { categoryId, categoryCode: code } });
      insertCategory({ id: categoryId, tenantId: context.tenantId, code, name, description, sortOrder, actorUserId, auditId, requestId: context.requestId, correlationId: context.correlationId });
      const eventPayload = { result, categoryId, categoryCode: code, requestId: context.requestId, correlationId: context.correlationId };
      await insertOutboxEvent({ id: outboxId, tenantId: context.tenantId, eventType: 'StudentDocumentCategory.Created', aggregateType: 'student_document_category', aggregateId: categoryId, payload: eventPayload, payloadHash: payloadHash(eventPayload), idempotencyKey: key, requestId: context.requestId, correlationId: context.correlationId, actorUserId, auditId });
      return result;
    });
  }

  async updateCategory(context: StudentDocumentRequestContext, categoryId: string, input: DocumentCategoryInput) {
    const id = uuid(categoryId, 'categoryId');
    const key = requireIdempotency(context, `category:update:${id}`);
    const name = text(input.displayName, 'displayName', 200);
    const description = optionalText(input.description, 'description');
    const sortOrder = input.sortOrder === undefined ? 0 : Number(input.sortOrder);
    const status = input.status || 'active';
    if (!['active', 'inactive', 'archived'].includes(status) || !Number.isInteger(sortOrder) || sortOrder < 0) throw new ValidationError('Category state is invalid.');
    return this.transaction(context, 'DOC-001R update category', ['student_document_categories', 'audit_events', 'outbox_events'], async () => {
      const existingIdempotent = await findIdempotentResult(context.tenantId, key);
      if (existingIdempotent?.payload?.result) return { ...(existingIdempotent.payload.result as Record<string, unknown>), idempotent: true };
      const current = await getCategoryById(context.tenantId, id);
      if (!current || current.deleted_at) throw new NotFoundError('Document category was not found in the trusted tenant.');
      const expectedVersion = positiveVersion(input.expectedVersion ?? current.version);
      if (expectedVersion !== current.version) throw new ConflictError('Category version is stale.');
      const actorUserId = await resolveInternalActorUserId(context.tenantId, context.userId, context.schoolId, context.branchId);
      const auditId = randomUUID();
      const outboxId = randomUUID();
      const result = { categoryId: id, version: current.version + 1, requestId: context.requestId, correlationId: context.correlationId, idempotent: false };
      await insertAuditEvent({ id: auditId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, actorUserId, entityType: 'student_document_category', entityId: id, action: status === 'archived' ? 'ARCHIVE' : 'UPDATE', requestId: context.requestId, correlationId: context.correlationId, metadata: { categoryId: id, previousVersion: current.version, status } });
      updateCategory({ id, tenantId: context.tenantId, name, description, sortOrder, status, actorUserId, deletedAt: status === 'archived' ? new Date().toISOString() : null, deletedBy: status === 'archived' ? actorUserId : null, expectedVersion });
      const eventPayload = { result, categoryId: id, status, requestId: context.requestId, correlationId: context.correlationId };
      await insertOutboxEvent({ id: outboxId, tenantId: context.tenantId, eventType: `StudentDocumentCategory.${status === 'archived' ? 'Archived' : 'Updated'}`, aggregateType: 'student_document_category', aggregateId: id, payload: eventPayload, payloadHash: payloadHash(eventPayload), idempotencyKey: key, requestId: context.requestId, correlationId: context.correlationId, actorUserId, auditId });
      return result;
    });
  }

  async listDocuments(context: StudentDocumentRequestContext, filters: DocumentListFilters) {
    return this.transaction(context, 'DOC-001R list student documents', ['student_documents', 'student_document_access_log', 'audit_events'], async () => {
      if (filters.studentId) await assertStudentInScope(context, filters.studentId);
      const result = await listDocuments(context, filters);
      const actorUserId = await resolveInternalActorUserId(context.tenantId, context.userId, context.schoolId, context.branchId);
      for (const document of result.rows) await this.recordAccess(context, actorUserId, document, 'view', 'list');
      return result;
    });
  }

  async getDocument(context: StudentDocumentRequestContext, documentId: string) {
    const id = uuid(documentId, 'documentId');
    return this.transaction(context, 'DOC-001R open student document', ['student_documents', 'student_document_versions', 'student_document_access_log', 'audit_events'], async () => {
      const document = requireDocument(await getDocument(context, id));
      const versions = await listVersions(context, id);
      const actorUserId = await resolveInternalActorUserId(context.tenantId, context.userId, context.schoolId, context.branchId);
      await this.recordAccess(context, actorUserId, document, 'view', 'open', versions.find(version => version.is_current)?.id || null);
      return { document, versions };
    });
  }

  async registerDocument(context: StudentDocumentRequestContext, studentIdValue: string, input: StudentDocumentInput, storageInput?: DocumentStorageInput): Promise<DocumentOperationResult> {
    const studentId = uuid(studentIdValue, 'studentId');
    const key = requireIdempotency(context, `document:register:${studentId}`);
    const categoryId = uuid(input.categoryId, 'categoryId');
    const reference = text(input.documentReference, 'documentReference', 160);
    const title = text(input.title, 'title', 250);
    const description = optionalText(input.description, 'description');
    const file = validateFileMetadata(input);
    const storage = validateStorageInput(storageInput, file);
    const documentClassification = classification(input.classification);
    const retentionUntil = dateOnly(input.retentionUntil, 'retentionUntil');
    const archiveEligibleOn = dateOnly(input.archiveEligibleOn, 'archiveEligibleOn');
    validateRetention(retentionUntil, archiveEligibleOn);
    const legalHold = input.legalHold === true;
    const requestedVerification = input.verificationStatus || 'not_required';
    if (!['not_required', 'pending'].includes(requestedVerification)) throw new ValidationError('A new document can only start as not_required or pending.');
    const requestFingerprint = payloadHash({ studentId, categoryId, reference, title, description, file, documentClassification, retentionUntil, archiveEligibleOn, legalHold, requestedVerification, objectKey: storage?.objectKey || null });
    return this.transaction(context, 'DOC-001R register student document', ['student_documents', 'student_document_versions', 'student_document_storage_objects', 'audit_events', 'outbox_events'], async () => {
      const existing = await findIdempotentResult(context.tenantId, key);
      assertIdempotentFingerprint(existing, requestFingerprint);
      if (existing?.payload?.result) return { ...(existing.payload.result as DocumentOperationResult), idempotent: true };
      await assertStudentInScope(context, studentId);
      if (!await getActiveCategory(context.tenantId, categoryId)) throw new ValidationError('Category is not active in the trusted tenant.');
      await assertDocumentReferenceAvailable(context.tenantId, reference);
      const actorUserId = await resolveInternalActorUserId(context.tenantId, context.userId, context.schoolId, context.branchId);
      const documentId = randomUUID();
      const versionId = randomUUID();
      const storageId = storage ? randomUUID() : null;
      const auditId = randomUUID();
      const outboxId = randomUUID();
      const lifecycleStatus = requestedVerification === 'pending' ? 'pending_verification' : 'draft';
      const result: DocumentOperationResult = { documentId, documentReference: reference, versionId, versionNumber: 1, stored: Boolean(storage), requestId: context.requestId, correlationId: context.correlationId, idempotent: false };
      await insertAuditEvent({ id: auditId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, actorUserId, entityType: 'student_document', entityId: documentId, action: 'CREATE', requestId: context.requestId, correlationId: context.correlationId, metadata: { documentId, studentId, categoryId, documentReference: reference, classification: documentClassification, stored: Boolean(storage), contentHash: file.contentHash } });
      insertDocument({ id: documentId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, studentId, categoryId, reference, title, description, lifecycle: lifecycleStatus, verification: requestedVerification, classification: documentClassification, retentionUntil, legalHold, archiveEligibleOn, actorUserId, auditId, requestId: context.requestId, correlationId: context.correlationId });
      insertVersion({ id: versionId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, studentId, documentId, versionNumber: 1, revisionReason: file.revisionReason, originalFileName: file.originalFileName, mediaType: file.mediaType, byteSize: file.byteSize, contentHash: file.contentHash, actorUserId, auditId, requestId: context.requestId, correlationId: context.correlationId });
      if (storage && storageId) insertStorageObject({ id: storageId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, studentId, documentId, documentVersionId: versionId, bucketId: storage.bucketId, objectKey: storage.objectKey, mediaType: file.mediaType, byteSize: file.byteSize, contentHash: file.contentHash, actorUserId, auditId, requestId: context.requestId, correlationId: context.correlationId });
      const eventPayload = { result, studentId, categoryId, classification: documentClassification, lifecycleStatus, requestFingerprint, requestId: context.requestId, correlationId: context.correlationId };
      await insertOutboxEvent({ id: outboxId, tenantId: context.tenantId, eventType: 'StudentDocument.Registered', aggregateType: 'student_document', aggregateId: documentId, payload: eventPayload, payloadHash: payloadHash(eventPayload), idempotencyKey: key, requestId: context.requestId, correlationId: context.correlationId, actorUserId, auditId });
      return result;
    });
  }

  async registerUploadedDocument(context: StudentDocumentRequestContext, studentIdValue: string, input: StudentDocumentInput, storage: DocumentStorageInput): Promise<DocumentOperationResult> {
    return this.registerDocument(context, studentIdValue, input, storage);
  }

  async addVersion(context: StudentDocumentRequestContext, documentIdValue: string, input: DocumentVersionInput, storageInput?: DocumentStorageInput): Promise<DocumentOperationResult> {
    const documentId = uuid(documentIdValue, 'documentId');
    const key = requireIdempotency(context, `document:version:${documentId}`);
    const file = validateFileMetadata(input);
    const storage = validateStorageInput(storageInput, file);
    const requestFingerprint = payloadHash({ documentId, file, objectKey: storage?.objectKey || null });
    return this.transaction(context, 'DOC-001R add student document version', ['student_documents', 'student_document_versions', 'student_document_storage_objects', 'audit_events', 'outbox_events'], async () => {
      const existing = await findIdempotentResult(context.tenantId, key);
      assertIdempotentFingerprint(existing, requestFingerprint);
      if (existing?.payload?.result) return { ...(existing.payload.result as DocumentOperationResult), idempotent: true };
      const document = requireDocument(await getDocumentForUpdate(context, documentId));
      if (document.lifecycle_status === 'archived') throw new ConflictError('Archived documents cannot receive a new version.');
      const actorUserId = await resolveInternalActorUserId(context.tenantId, context.userId, context.schoolId, context.branchId);
      const versionNumber = await nextVersionNumber(context, documentId);
      const versions = await listVersions(context, documentId);
      const currentVersion = versions.find(version => version.is_current);
      const auditId = randomUUID();
      const outboxId = randomUUID();
      const versionId = randomUUID();
      const storageId = storage ? randomUUID() : null;
      const result: DocumentOperationResult = { documentId, documentReference: document.document_reference, versionId, versionNumber, stored: Boolean(storage), requestId: context.requestId, correlationId: context.correlationId, idempotent: false };
      await insertAuditEvent({ id: auditId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, actorUserId, entityType: 'student_document_version', entityId: versionId, action: 'CREATE', requestId: context.requestId, correlationId: context.correlationId, metadata: { documentId, versionNumber, previousVersion: currentVersion?.version_number || null, stored: Boolean(storage), contentHash: file.contentHash } });
      if (currentVersion) updateCurrentVersion({ id: currentVersion.id, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, documentId });
      insertVersion({ id: versionId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, studentId: document.student_id, documentId, versionNumber, revisionReason: file.revisionReason, originalFileName: file.originalFileName, mediaType: file.mediaType, byteSize: file.byteSize, contentHash: file.contentHash, actorUserId, auditId, requestId: context.requestId, correlationId: context.correlationId });
      if (storage && storageId) insertStorageObject({ id: storageId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, studentId: document.student_id, documentId, documentVersionId: versionId, bucketId: storage.bucketId, objectKey: storage.objectKey, mediaType: file.mediaType, byteSize: file.byteSize, contentHash: file.contentHash, actorUserId, auditId, requestId: context.requestId, correlationId: context.correlationId });
      const requiresVerification = document.verification_status !== 'not_required';
      updateDocument({ id: documentId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, lifecycle: requiresVerification ? 'pending_verification' : document.lifecycle_status, verification: requiresVerification ? 'pending' : document.verification_status, classification: document.classification, currentVersionNumber: versionNumber, retentionUntil: document.retention_until, legalHold: document.legal_hold, archiveEligibleOn: document.archive_eligible_on, verifiedAt: null, verifiedBy: null, deletedAt: null, deletedBy: null, actorUserId, expectedVersion: document.version });
      const eventPayload = { result, documentId, versionNumber, requestFingerprint, requestId: context.requestId, correlationId: context.correlationId };
      await insertOutboxEvent({ id: outboxId, tenantId: context.tenantId, eventType: 'StudentDocument.VersionAdded', aggregateType: 'student_document', aggregateId: documentId, payload: eventPayload, payloadHash: payloadHash(eventPayload), idempotencyKey: key, requestId: context.requestId, correlationId: context.correlationId, actorUserId, auditId });
      return result;
    });
  }

  async addUploadedVersion(context: StudentDocumentRequestContext, documentIdValue: string, input: DocumentVersionInput, storage: DocumentStorageInput): Promise<DocumentOperationResult> {
    return this.addVersion(context, documentIdValue, input, storage);
  }

  async getContentDescriptor(context: StudentDocumentRequestContext, documentIdValue: string) {
    const documentId = uuid(documentIdValue, 'documentId');
    return this.transaction(context, 'DOC-001R authorize document download', ['student_documents', 'student_document_versions', 'student_document_storage_objects', 'student_document_access_log', 'audit_events'], async () => {
      const document = requireDocument(await getDocument(context, documentId));
      const storage = await getCurrentStorageObject(context, documentId);
      if (!storage) throw new NotFoundError('Binary content is not available for the current document version.');
      const actorUserId = await resolveInternalActorUserId(context.tenantId, context.userId, context.schoolId, context.branchId);
      await this.recordAccess(context, actorUserId, document, 'download', 'signed-url', storage.document_version_id);
      return storage;
    });
  }

  async decide(context: StudentDocumentRequestContext, documentIdValue: string, decision: DocumentDecision, reasonValue?: unknown, expectedVersionValue?: unknown): Promise<DocumentOperationResult> {
    const documentId = uuid(documentIdValue, 'documentId');
    const key = requireIdempotency(context, `document:decision:${documentId}`);
    if (!['verify', 'reject', 'expire'].includes(decision)) throw new ValidationError('Document decision is not supported.');
    const reason = text(reasonValue, 'reason', 1000);
    return this.transaction(context, 'DOC-001R document verification decision', ['student_documents', 'student_document_access_log', 'audit_events', 'outbox_events'], async () => {
      const existing = await findIdempotentResult(context.tenantId, key);
      if (existing?.payload?.result) return { ...(existing.payload.result as DocumentOperationResult), idempotent: true };
      const document = requireDocument(await getDocumentForUpdate(context, documentId));
      const expectedVersion = positiveVersion(expectedVersionValue ?? document.version);
      if (expectedVersion !== document.version) throw new ConflictError('Document version is stale.');
      if (document.lifecycle_status === 'archived') throw new ConflictError('Archived documents cannot receive a verification decision.');
      if (decision === 'verify' && document.lifecycle_status !== 'pending_verification') throw new ConflictError('Only documents pending verification can be verified.');
      if (decision === 'reject' && document.lifecycle_status !== 'pending_verification') throw new ConflictError('Only documents pending verification can be rejected.');
      if (decision === 'expire' && document.lifecycle_status === 'expired') throw new ConflictError('The document has already expired.');
      const versions = await listVersions(context, documentId);
      if (!versions.some(version => version.is_current)) throw new ConflictError('A current document version is required.');
      const today = new Date().toISOString().slice(0, 10);
      if (decision === 'expire' && (document.legal_hold || !document.retention_until || document.retention_until > today)) throw new ConflictError('Document is not eligible for expiry.');
      const actorUserId = await resolveInternalActorUserId(context.tenantId, context.userId, context.schoolId, context.branchId);
      const auditId = randomUUID();
      const outboxId = randomUUID();
      const accessLogId = randomUUID();
      const nextLifecycle = decision === 'verify' ? 'verified' : decision === 'expire' ? 'expired' : 'draft';
      const nextVerification = decision === 'verify' ? 'verified' : decision === 'expire' ? 'expired' : 'rejected';
      const result: DocumentOperationResult = { documentId, documentReference: document.document_reference, versionNumber: document.current_version_number, requestId: context.requestId, correlationId: context.correlationId, idempotent: false };
      await insertAuditEvent({ id: auditId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, actorUserId, entityType: 'student_document', entityId: documentId, action: decision.toUpperCase(), reason, requestId: context.requestId, correlationId: context.correlationId, metadata: { documentId, decision, previousVersion: document.version } });
      updateDocument({ id: documentId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, lifecycle: nextLifecycle, verification: nextVerification, classification: document.classification, currentVersionNumber: document.current_version_number, retentionUntil: document.retention_until, legalHold: document.legal_hold, archiveEligibleOn: document.archive_eligible_on, verifiedAt: decision === 'verify' ? new Date().toISOString() : null, verifiedBy: decision === 'verify' ? actorUserId : null, deletedAt: null, deletedBy: null, actorUserId, expectedVersion });
      await insertAccessLog({ id: accessLogId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, studentId: document.student_id, documentId, documentVersionId: (await listVersions(context, documentId)).find(version => version.is_current)?.id || null, actorUserId, accessType: 'verify', accessResult: 'allowed', reasonCode: reason, requestId: context.requestId, correlationId: context.correlationId, createdBy: actorUserId, auditId });
      const eventPayload = { result, documentId, decision, reason, requestId: context.requestId, correlationId: context.correlationId };
      await insertOutboxEvent({ id: outboxId, tenantId: context.tenantId, eventType: `StudentDocument.${decision === 'verify' ? 'Verified' : decision === 'expire' ? 'Expired' : 'Rejected'}`, aggregateType: 'student_document', aggregateId: documentId, payload: eventPayload, payloadHash: payloadHash(eventPayload), idempotencyKey: key, requestId: context.requestId, correlationId: context.correlationId, actorUserId, auditId });
      return result;
    });
  }

  async archive(context: StudentDocumentRequestContext, documentIdValue: string, restore: boolean, reasonValue?: unknown, expectedVersionValue?: unknown): Promise<DocumentOperationResult> {
    const documentId = uuid(documentIdValue, 'documentId');
    const key = requireIdempotency(context, `document:${restore ? 'restore' : 'archive'}:${documentId}`);
    const reason = text(reasonValue, 'reason', 1000);
    return this.transaction(context, restore ? 'DOC-001R restore student document' : 'DOC-001R archive student document', ['student_documents', 'student_document_access_log', 'audit_events', 'outbox_events'], async () => {
      const existing = await findIdempotentResult(context.tenantId, key);
      if (existing?.payload?.result) return { ...(existing.payload.result as DocumentOperationResult), idempotent: true };
      const document = requireDocument(await getDocumentForUpdate(context, documentId, restore));
      const expectedVersion = positiveVersion(expectedVersionValue ?? document.version);
      if (expectedVersion !== document.version) throw new ConflictError('Document version is stale.');
      if (!restore && document.legal_hold) throw new ConflictError('Legal hold prevents archive actions.');
      if (!restore) {
        const today = new Date().toISOString().slice(0, 10);
        if (!document.archive_eligible_on || document.archive_eligible_on > today) throw new ConflictError('Document is not archive eligible.');
      }
      const actorUserId = await resolveInternalActorUserId(context.tenantId, context.userId, context.schoolId, context.branchId);
      const auditId = randomUUID();
      const outboxId = randomUUID();
      const accessLogId = randomUUID();
      const result: DocumentOperationResult = { documentId, documentReference: document.document_reference, versionNumber: document.current_version_number, requestId: context.requestId, correlationId: context.correlationId, idempotent: false };
      await insertAuditEvent({ id: auditId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, actorUserId, entityType: 'student_document', entityId: documentId, action: restore ? 'RESTORE' : 'ARCHIVE', reason, requestId: context.requestId, correlationId: context.correlationId, metadata: { documentId, restore, reason } });
      updateDocument({ id: documentId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, lifecycle: restore ? 'draft' : 'archived', verification: restore ? 'not_required' : document.verification_status, classification: document.classification, currentVersionNumber: document.current_version_number, retentionUntil: document.retention_until, legalHold: document.legal_hold, archiveEligibleOn: document.archive_eligible_on, verifiedAt: restore ? null : document.verified_at, verifiedBy: restore ? null : document.verified_by, deletedAt: restore ? null : new Date().toISOString(), deletedBy: restore ? null : actorUserId, actorUserId, expectedVersion, allowRestore: restore });
      await insertAccessLog({ id: accessLogId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, studentId: document.student_id, documentId, actorUserId, accessType: restore ? 'restore' : 'archive', accessResult: 'allowed', reasonCode: reason, requestId: context.requestId, correlationId: context.correlationId, createdBy: actorUserId, auditId });
      const eventPayload = { result, documentId, restore, reason, requestId: context.requestId, correlationId: context.correlationId };
      await insertOutboxEvent({ id: outboxId, tenantId: context.tenantId, eventType: restore ? 'StudentDocument.Restored' : 'StudentDocument.Archived', aggregateType: 'student_document', aggregateId: documentId, payload: eventPayload, payloadHash: payloadHash(eventPayload), idempotencyKey: key, requestId: context.requestId, correlationId: context.correlationId, actorUserId, auditId });
      return result;
    });
  }

  async accessHistory(context: StudentDocumentRequestContext, documentIdValue: string, limitValue?: unknown) {
    const documentId = uuid(documentIdValue, 'documentId');
    const limit = boundedPage(limitValue, 50, 100);
    return this.transaction(context, 'DOC-001R list document access history', ['student_documents', 'student_document_access_log', 'audit_events'], async () => {
      const document = requireDocument(await getDocument(context, documentId, true));
      const actorUserId = await resolveInternalActorUserId(context.tenantId, context.userId, context.schoolId, context.branchId);
      await this.recordAccess(context, actorUserId, document, 'view', 'access-log');
      return listAccessLogs(context, documentId, limit);
    });
  }

  private async recordAccess(context: StudentDocumentRequestContext, actorUserId: string, document: DocumentRow, accessType: string, reason: string, documentVersionId: string | null = null): Promise<void> {
    const auditId = randomUUID();
    await insertAuditEvent({ id: auditId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, actorUserId, entityType: 'student_document_access', entityId: document.id, action: 'ACCESS', reason, requestId: context.requestId, correlationId: context.correlationId, metadata: { documentId: document.id, studentId: document.student_id, accessType, reason } });
    await insertAccessLog({ id: randomUUID(), tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, studentId: document.student_id, documentId: document.id, documentVersionId, actorUserId, accessType, accessResult: 'allowed', reasonCode: null, requestId: context.requestId, correlationId: context.correlationId, createdBy: actorUserId, auditId });
  }
}

export const studentDocumentService = new StudentDocumentService();
