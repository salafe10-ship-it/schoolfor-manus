import { UnitOfWork } from '../../../database/UnitOfWork.js';
import { SQLCommandBuilder } from '../../../database/transactions/SQLCommand.js';
import type { TransactionSession } from '../../../database/transactions/TransactionContracts.js';
import { ConflictError, DatabaseError, ValidationError } from '../../../utils/errors.js';

type DbRow = Record<string, any>;

function transaction(): TransactionSession {
  const context = UnitOfWork.getActiveContext();
  if (!context?.isActive || !context.databaseTransaction) {
    throw new DatabaseError('Student registration requires an active PostgreSQL transaction.');
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

function enqueueInsert(
  table: string,
  id: string,
  sqlText: string,
  parameters: unknown[],
  summary: Record<string, unknown>
): void {
  UnitOfWork.enlistCreate(
    table,
    id,
    summary,
    SQLCommandBuilder.create({
      sqlText,
      parameters,
      executionContext: `SOP-001 ${table} insert`,
      tenantContext: 'TRUSTED_TENANT_CONTEXT'
    })
  );
}

export type ExistingOutbox = {
  aggregate_id: string;
  payload: Record<string, unknown>;
  payload_hash: string;
};

export async function findIdempotentRegistration(tenantId: string, idempotencyKey: string): Promise<ExistingOutbox | null> {
  const row = await one<{ aggregate_id: string; payload: Record<string, unknown>; payload_hash: string }>(
    `SELECT aggregate_id, payload, payload_hash
       FROM outbox_events
      WHERE tenant_id = $1
        AND idempotency_key = $2
        AND deleted_at IS NULL
      LIMIT 1`,
    [tenantId, idempotencyKey]
  );
  return row;
}

export async function assertStudentNumberAvailable(tenantId: string, schoolId: string, studentNumber: string): Promise<void> {
  const row = await one<{ id: string }>(
    `SELECT id
       FROM students
      WHERE tenant_id = $1
        AND school_id = $2
        AND student_number = $3
        AND deleted_at IS NULL
      LIMIT 1`,
    [tenantId, schoolId, studentNumber]
  );
  if (row) throw new ConflictError('Student number is already in use.', { field: 'studentNumber' });
}

function normalizedName(value: string | null | undefined): string {
  return (value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase();
}

function nameSimilarity(left: string | null | undefined, right: string | null | undefined): number {
  const a = normalizedName(left);
  const b = normalizedName(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= b.length; column += 1) {
      const above = previous[column];
      previous[column] = a[row - 1] === b[column - 1]
        ? diagonal
        : Math.min(previous[column] + 1, previous[column - 1] + 1, diagonal + 1);
      diagonal = above;
    }
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length);
}

export async function assertNoDuplicateStudent(
  tenantId: string,
  schoolId: string,
  dateOfBirth: string,
  firstName: string,
  lastName: string,
  middleName: string | null,
  allowOverride: boolean,
  overrideReason: string | null
): Promise<void> {
  if (allowOverride && !overrideReason) {
    throw new ValidationError('A duplicate override requires a reason.', { errorCode: 'STU-DUP-002' });
  }
  const rows = await many<{ id: string; student_number: string; legal_first_name: string; legal_middle_name: string | null; legal_last_name: string }>(
    `SELECT id, student_number, legal_first_name, legal_middle_name, legal_last_name
       FROM students
      WHERE tenant_id = $1
        AND school_id = $2
        AND date_of_birth = $3::date
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      LIMIT 50`,
    [tenantId, schoolId, dateOfBirth]
  );
  if (rows.length === 0) return;
  const bestMatch = rows.reduce((best, candidate) => {
    const score = nameSimilarity(firstName, candidate.legal_first_name) * 0.4
      + nameSimilarity(middleName, candidate.legal_middle_name) * 0.1
      + nameSimilarity(lastName, candidate.legal_last_name) * 0.4
      + 0.1; // dateOfBirth is an exact query predicate
    return score > best.score ? { candidate, score } : best;
  }, { candidate: rows[0], score: 0 });
  const score = bestMatch.score;
  if (score < 0.72) return;
  if (allowOverride) return;
  throw new ConflictError('A possible duplicate student requires authorized review.', {
    errorCode: 'STU-DUP-001',
    reviewRequired: true,
    matchScore: Number(score.toFixed(3))
  });
}

export async function assertAcademicContext(
  tenantId: string,
  schoolId: string,
  academicYearId: string,
  termId: string
): Promise<void> {
  const year = await one<{ id: string }>(
    `SELECT id
       FROM academic_years
      WHERE tenant_id = $1
        AND school_id = $2
        AND id = $3
        AND deleted_at IS NULL
        AND status IN ('planned', 'active')
      LIMIT 1`,
    [tenantId, schoolId, academicYearId]
  );
  if (!year) throw new ValidationError('The trusted academic year is not available for registration.');

  const term = await one<{ id: string }>(
    `SELECT id
       FROM terms
      WHERE tenant_id = $1
        AND school_id = $2
        AND academic_year_id = $3
        AND id = $4
        AND deleted_at IS NULL
        AND status IN ('planned', 'active')
      LIMIT 1`,
    [tenantId, schoolId, academicYearId, termId]
  );
  if (!term) throw new ValidationError('The selected term does not belong to the trusted academic year.');
}

export async function resolveInternalActorUserId(tenantId: string, authUserId: string): Promise<string> {
  const row = await one<{ id: string }>(
    `SELECT id
       FROM users
      WHERE tenant_id = $1
        AND auth_user_id = $2
        AND deleted_at IS NULL
        AND status = 'active'
      LIMIT 1`,
    [tenantId, authUserId]
  );
  if (!row) throw new ValidationError('The authenticated user is not provisioned as an active tenant user.');
  return row.id;
}

export type GuardianInput = {
  id?: string;
  guardianNumber?: string;
  legalFirstName?: string;
  legalMiddleName?: string;
  legalLastName?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  countryCode?: string;
  relationshipType: string;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  canCollectStudent: boolean;
  custodyStatus: string;
  consentStatus: string;
};

export type GuardianResolution = { id: string; created: boolean; guardianNumber: string };

export async function resolveGuardian(
  context: { tenantId: string; schoolId: string; branchId: string; userId: string },
  input: GuardianInput,
  auditId: string,
  requestId: string,
  correlationId: string,
  generatedId: string
): Promise<GuardianResolution> {
  if (input.id) {
    const existing = await one<{ id: string; guardian_number: string }>(
      `SELECT id, guardian_number
         FROM guardians
        WHERE tenant_id = $1
          AND school_id = $2
          AND (branch_id = $3 OR branch_id IS NULL)
          AND id = $4
          AND deleted_at IS NULL
        LIMIT 1`,
      [context.tenantId, context.schoolId, context.branchId, input.id]
    );
    if (!existing) throw new ValidationError('The guardian is not available in the trusted tenant context.');
    return { id: existing.id, created: false, guardianNumber: existing.guardian_number };
  }

  const match = await one<{ id: string; guardian_number: string }>(
    `SELECT id, guardian_number
       FROM guardians
        WHERE tenant_id = $1
          AND school_id = $2
          AND (branch_id = $3 OR branch_id IS NULL)
          AND deleted_at IS NULL
        AND (
          ($4::text IS NOT NULL AND lower(email) = lower($4))
          OR ($5::text IS NOT NULL AND phone = $5)
        )
      ORDER BY created_at ASC
      LIMIT 1`,
    [context.tenantId, context.schoolId, context.branchId, input.email || null, input.phone || null]
  );
  if (match) return { id: match.id, created: false, guardianNumber: match.guardian_number };

  if (!input.legalFirstName || !input.legalLastName || (!input.phone && !input.email)) {
    throw new ValidationError('A new guardian requires first name, last name, and phone or email.');
  }

  const guardianNumber = input.guardianNumber || `GDN-${generatedId.slice(0, 8).toUpperCase()}`;
  enqueueInsert(
    'guardians',
    generatedId,
    `INSERT INTO guardians (
       id, tenant_id, school_id, branch_id, guardian_number,
       legal_first_name, legal_middle_name, legal_last_name,
       phone, email, address_line1, address_line2, city, country_code,
       verification_status, status, version, created_by, updated_by,
       audit_id, request_id, correlation_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
               'unverified', 'active', 1, $15, $15, $16, $17, $18)`,
    [
      generatedId, context.tenantId, context.schoolId, context.branchId, guardianNumber,
      input.legalFirstName, input.legalMiddleName || null, input.legalLastName,
      input.phone || null, input.email || null, input.addressLine1 || null,
      input.addressLine2 || null, input.city || null, input.countryCode || null,
      context.userId, auditId, requestId, correlationId
    ],
    { id: generatedId, guardianNumber }
  );
  return { id: generatedId, created: true, guardianNumber };
}

export function enqueueStudent(values: {
  id: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  studentNumber: string;
  legalFirstName: string;
  legalMiddleName: string | null;
  legalLastName: string;
  preferredName: string | null;
  dateOfBirth: string;
  gender: string | null;
  nationality: string | null;
  birthCountryCode: string | null;
  userId: string;
  auditId: string;
  requestId: string;
  correlationId: string;
}): void {
  enqueueInsert(
    'students',
    values.id,
    `INSERT INTO students (
       id, tenant_id, school_id, branch_id, student_number,
       legal_first_name, legal_middle_name, legal_last_name, preferred_name,
       date_of_birth, gender, nationality, birth_country_code, status, version,
       created_by, updated_by, audit_id, request_id, correlation_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::date, $11, $12, $13,
               'applicant', 1, $14, $14, $15, $16, $17)`,
    [
      values.id, values.tenantId, values.schoolId, values.branchId, values.studentNumber,
      values.legalFirstName, values.legalMiddleName, values.legalLastName, values.preferredName,
      values.dateOfBirth, values.gender, values.nationality, values.birthCountryCode,
      values.userId, values.auditId, values.requestId, values.correlationId
    ],
    { id: values.id, studentNumber: values.studentNumber }
  );
}

export function enqueueStudentGuardian(values: {
  id: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  studentId: string;
  guardianId: string;
  relationshipType: string;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  canCollectStudent: boolean;
  custodyStatus: string;
  consentStatus: string;
  userId: string;
  auditId: string;
  requestId: string;
  correlationId: string;
}): void {
  enqueueInsert(
    'student_guardians',
    values.id,
    `INSERT INTO student_guardians (
       id, tenant_id, school_id, branch_id, student_id, guardian_id,
       relationship_type, is_primary, is_emergency_contact, can_collect_student,
       custody_status, consent_status, status, version, created_by, updated_by,
       audit_id, request_id, correlation_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
               'active', 1, $13, $13, $14, $15, $16)`,
    [
      values.id, values.tenantId, values.schoolId, values.branchId, values.studentId, values.guardianId,
      values.relationshipType, values.isPrimary, values.isEmergencyContact, values.canCollectStudent,
      values.custodyStatus, values.consentStatus, values.userId, values.auditId, values.requestId, values.correlationId
    ],
    { id: values.id, studentId: values.studentId, guardianId: values.guardianId }
  );
}

export function enqueueEnrollment(values: {
  id: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  studentId: string;
  academicYearId: string;
  termId: string;
  enrollmentNumber: string;
  admissionReference: string | null;
  userId: string;
  auditId: string;
  requestId: string;
  correlationId: string;
}): void {
  enqueueInsert(
    'enrollments',
    values.id,
    `INSERT INTO enrollments (
       id, tenant_id, school_id, branch_id, student_id, academic_year_id, term_id,
       enrollment_number, admission_reference, admission_status, enrollment_status,
       starts_on, version, created_by, updated_by, audit_id, request_id, correlation_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'pending', CURRENT_DATE,
               1, $10, $10, $11, $12, $13)`,
    [
      values.id, values.tenantId, values.schoolId, values.branchId, values.studentId,
      values.academicYearId, values.termId, values.enrollmentNumber, values.admissionReference,
      values.userId, values.auditId, values.requestId, values.correlationId
    ],
    { id: values.id, enrollmentNumber: values.enrollmentNumber }
  );
}

export function enqueueAcademicStatus(values: {
  id: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  studentId: string;
  userId: string;
  auditId: string;
  requestId: string;
  correlationId: string;
}): void {
  enqueueInsert(
    'student_academic_status',
    values.id,
    `INSERT INTO student_academic_status (
       id, tenant_id, school_id, branch_id, student_id, status, effective_on,
       reason_code, version, created_by, updated_by, audit_id, request_id, correlation_id
     ) VALUES ($1, $2, $3, $4, $5, 'applicant', CURRENT_DATE, 'initial_registration',
               1, $6, $6, $7, $8, $9)`,
    [values.id, values.tenantId, values.schoolId, values.branchId, values.studentId, values.userId, values.auditId, values.requestId, values.correlationId],
    { id: values.id, studentId: values.studentId, status: 'applicant' }
  );
}

export function enqueueStatusTransition(values: {
  id: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  studentId: string;
  idempotencyKey: string;
  userId: string;
  auditId: string;
  requestId: string;
  correlationId: string;
}): void {
  enqueueInsert(
    'student_status_transitions',
    values.id,
    `INSERT INTO student_status_transitions (
       id, tenant_id, school_id, branch_id, student_id, from_status, to_status,
       transition_kind, approval_status, effective_on, reason_code, requested_by,
       idempotency_key, version, created_by, updated_by, audit_id, request_id, correlation_id
     ) VALUES ($1, $2, $3, $4, $5, NULL, 'applicant', 'initial', 'pending', CURRENT_DATE,
               'initial_registration', $6, $7, 1, $6, $6, $8, $9, $10)`,
    [values.id, values.tenantId, values.schoolId, values.branchId, values.studentId, values.userId, values.idempotencyKey, values.auditId, values.requestId, values.correlationId],
    { id: values.id, studentId: values.studentId, toStatus: 'applicant' }
  );
}

export function enqueueStatusHistory(values: {
  id: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  studentId: string;
  transitionId: string;
  userId: string;
  auditId: string;
  requestId: string;
  correlationId: string;
}): void {
  enqueueInsert(
    'student_status_history',
    values.id,
    `INSERT INTO student_status_history (
       id, tenant_id, school_id, branch_id, student_id, transition_id,
       from_status, to_status, event_type, effective_on, reason_code,
       recorded_by, status, version, created_by, updated_by, audit_id,
       request_id, correlation_id
     ) VALUES ($1, $2, $3, $4, $5, $6, NULL, 'applicant', 'initial', CURRENT_DATE,
               'initial_registration', $7, 'active', 1, $7, $7, $8, $9, $10)`,
    [values.id, values.tenantId, values.schoolId, values.branchId, values.studentId, values.transitionId, values.userId, values.auditId, values.requestId, values.correlationId],
    { id: values.id, studentId: values.studentId, transitionId: values.transitionId }
  );
}

export function enqueueAuditEvent(values: {
  id: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  studentId: string;
  userId: string;
  requestId: string;
  correlationId: string;
  metadata: Record<string, unknown>;
}): void {
  enqueueInsert(
    'audit_events',
    values.id,
    `INSERT INTO audit_events (
       id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id,
       action, source, reason, result, metadata, request_id, correlation_id
     ) VALUES ($1, $2, $3, $4, $5, 'StudentRegistration', $6, 'create',
               'StudentRegistrationService', 'SOP-001 registration', 'success', $7::jsonb, $8, $9)`,
    [values.id, values.tenantId, values.schoolId, values.branchId, values.userId, values.studentId, JSON.stringify(values.metadata), values.requestId, values.correlationId],
    { id: values.id, entityType: 'StudentRegistration', entityId: values.studentId }
  );
}

export function enqueueGuardianAuditEvent(values: {
  id: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  guardianId: string;
  studentId: string;
  userId: string;
  requestId: string;
  correlationId: string;
  metadata: Record<string, unknown>;
}): void {
  enqueueInsert(
    'audit_events',
    values.id,
    `INSERT INTO audit_events (
       id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id,
       action, source, reason, result, metadata, request_id, correlation_id
     ) VALUES ($1, $2, $3, $4, $5, 'Guardian', $6, 'update',
               'CanonicalGuardianUpdateService', 'Guardian canonical update', 'success', $7::jsonb, $8, $9)`,
    [values.id, values.tenantId, values.schoolId, values.branchId, values.userId, values.guardianId, JSON.stringify({ ...values.metadata, studentId: values.studentId }), values.requestId, values.correlationId],
    { id: values.id, entityType: 'Guardian', entityId: values.guardianId }
  );
}

export function enqueueOutboxEvent(values: {
  id: string;
  tenantId: string;
  studentId: string;
  idempotencyKey: string;
  requestId: string;
  correlationId: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  userId: string;
  auditId: string;
}): void {
  enqueueInsert(
    'outbox_events',
    values.id,
    `INSERT INTO outbox_events (
       id, tenant_id, event_type, aggregate_type, aggregate_id, event_version,
       payload, payload_hash, idempotency_key, status, retry_count, max_retries,
       request_id, correlation_id, created_by, updated_by, audit_id, version
     ) VALUES ($1, $2, 'StudentRegistered', 'Student', $3, 1, $4::jsonb, $5, $6,
               'pending', 0, 10, $7, $8, $9, $9, $10, 1)`,
    [values.id, values.tenantId, values.studentId, JSON.stringify(values.payload), values.payloadHash, values.idempotencyKey, values.requestId, values.correlationId, values.userId, values.auditId],
    { id: values.id, eventType: 'StudentRegistered', aggregateId: values.studentId }
  );
}

export function enqueueGuardianOutboxEvent(values: {
  id: string;
  tenantId: string;
  guardianId: string;
  idempotencyKey: string;
  requestId: string;
  correlationId: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  userId: string;
  auditId: string;
}): void {
  enqueueInsert(
    'outbox_events',
    values.id,
    `INSERT INTO outbox_events (
       id, tenant_id, event_type, aggregate_type, aggregate_id, event_version,
       payload, payload_hash, idempotency_key, status, retry_count, max_retries,
       request_id, correlation_id, created_by, updated_by, audit_id, version
     ) VALUES ($1, $2, 'GuardianUpdated', 'Guardian', $3, 1, $4::jsonb, $5, $6,
               'pending', 0, 10, $7, $8, $9, $9, $10, 1)`,
    [values.id, values.tenantId, values.guardianId, JSON.stringify(values.payload), values.payloadHash, values.idempotencyKey, values.requestId, values.correlationId, values.userId, values.auditId],
    { id: values.id, eventType: 'GuardianUpdated', aggregateId: values.guardianId }
  );
}

export function assertNoDatabaseConflict(error: unknown): never {
  const candidate = error as { code?: string; constraint?: string };
  if (candidate?.code === '23505') {
    throw new ConflictError('The registration conflicts with an existing record.', { constraint: candidate.constraint || 'unique_constraint' });
  }
  throw error;
}
