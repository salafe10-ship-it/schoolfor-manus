import { createHash, randomUUID } from 'node:crypto';
import { UnitOfWork } from '../../../database/UnitOfWork.js';
import type { TenantContext } from '../../../tenant/TenantContext.js';
import { authorizationEngine } from '../../../authorization/AuthorizationEngine.js';
import { PERMISSIONS } from '../../../authorization/PermissionRegistry.js';
import { AuthorizationError, ConflictError, DatabaseError, ValidationError } from '../../../utils/errors.js';
import {
  assertAcademicContext,
  assertNoDatabaseConflict,
  assertNoDuplicateStudent,
  assertStudentNumberAvailable,
  enqueueAcademicStatus,
  enqueueAuditEvent,
  enqueueEnrollment,
  enqueueOutboxEvent,
  enqueueStatusHistory,
  enqueueStatusTransition,
  enqueueStudent,
  enqueueStudentGuardian,
  findIdempotentRegistration,
  resolveGuardian,
  resolveInternalActorUserId,
  type GuardianInput
} from '../infrastructure/StudentRegistrationRepositories.js';

export type StudentRegistrationCommand = {
  studentNumber?: unknown;
  legalFirstName?: unknown;
  legalMiddleName?: unknown;
  legalLastName?: unknown;
  preferredName?: unknown;
  dateOfBirth?: unknown;
  gender?: unknown;
  nationality?: unknown;
  birthCountryCode?: unknown;
  termId?: unknown;
  admissionReference?: unknown;
  idempotencyKey?: unknown;
  duplicateOverride?: unknown;
  duplicateOverrideReason?: unknown;
  guardian?: Record<string, unknown>;
};

export type RegistrationRequestContext = {
  requestId?: string;
  correlationId?: string;
  ipAddress?: string;
  idempotencyKey?: unknown;
};

export type StudentRegistrationResult = {
  idempotent: boolean;
  studentId: string;
  studentNumber?: string;
  guardianId?: string;
  guardianNumber?: string;
  enrollmentId?: string;
  academicStatusId?: string;
  transitionId?: string;
  statusHistoryId?: string;
  auditId?: string;
  outboxEventId?: string;
  requestId: string;
  correlationId: string;
};

type NormalizedCommand = {
  studentNumber?: string;
  legalFirstName: string;
  legalMiddleName: string | null;
  legalLastName: string;
  preferredName: string | null;
  dateOfBirth: string;
  gender: string | null;
  nationality: string | null;
  birthCountryCode: string | null;
  termId: string;
  admissionReference: string | null;
  duplicateOverride: boolean;
  duplicateOverrideReason: string | null;
  idempotencyKey: string;
  guardian: GuardianInput;
};

function stringValue(value: unknown, field: string, required = false): string | null {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ValidationError(`${field} is required.`);
    return null;
  }
  if (typeof value !== 'string') throw new ValidationError(`${field} must be text.`);
  const normalized = value.trim();
  if (required && !normalized) throw new ValidationError(`${field} is required.`);
  return normalized || null;
}

function enumValue(value: unknown, field: string, allowed: readonly string[], fallback: string): string {
  const normalized = stringValue(value, field) || fallback;
  if (!allowed.includes(normalized)) throw new ValidationError(`${field} contains an unsupported value.`);
  return normalized;
}

function booleanValue(value: unknown, field: string): boolean {
  if (value === undefined) return false;
  if (typeof value !== 'boolean') throw new ValidationError(`${field} must be boolean.`);
  return value;
}

function dateValue(value: unknown): string {
  const date = stringValue(value, 'dateOfBirth', true)!;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ValidationError('dateOfBirth must use YYYY-MM-DD.');
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new ValidationError('dateOfBirth is not a valid calendar date.');
  }
  return date;
}

function canonicalNumber(value: unknown, field: string): string | undefined {
  const normalized = stringValue(value, field);
  if (!normalized) return undefined;
  const result = normalized.toUpperCase();
  if (result.length > 64 || !/^[A-Z0-9][A-Z0-9._/-]*$/.test(result)) {
    throw new ValidationError(`${field} has an invalid canonical format.`);
  }
  return result;
}

function guardianInput(value: unknown): GuardianInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('guardian is required for student registration.');
  }
  const input = value as Record<string, unknown>;
  const relationshipType = enumValue(input.relationshipType, 'guardian.relationshipType', ['parent', 'legal_guardian', 'foster_parent', 'sibling', 'relative', 'sponsor', 'other'], 'parent');
  const custodyStatus = enumValue(input.custodyStatus, 'guardian.custodyStatus', ['unknown', 'shared', 'sole', 'none', 'court_ordered'], 'unknown');
  const consentStatus = enumValue(input.consentStatus, 'guardian.consentStatus', ['pending', 'granted', 'revoked', 'not_required'], 'pending');
  return {
    id: stringValue(input.id, 'guardian.id') || undefined,
    guardianNumber: canonicalNumber(input.guardianNumber, 'guardian.guardianNumber'),
    legalFirstName: stringValue(input.legalFirstName, 'guardian.legalFirstName') || undefined,
    legalMiddleName: stringValue(input.legalMiddleName, 'guardian.legalMiddleName') || undefined,
    legalLastName: stringValue(input.legalLastName, 'guardian.legalLastName') || undefined,
    phone: stringValue(input.phone, 'guardian.phone') || undefined,
    email: stringValue(input.email, 'guardian.email')?.toLowerCase() || undefined,
    addressLine1: stringValue(input.addressLine1, 'guardian.addressLine1') || undefined,
    addressLine2: stringValue(input.addressLine2, 'guardian.addressLine2') || undefined,
    city: stringValue(input.city, 'guardian.city') || undefined,
    countryCode: stringValue(input.countryCode, 'guardian.countryCode')?.toUpperCase() || undefined,
    relationshipType,
    isPrimary: input.isPrimary === undefined ? true : input.isPrimary === true,
    isEmergencyContact: input.isEmergencyContact === true,
    canCollectStudent: input.canCollectStudent === true,
    custodyStatus,
    consentStatus
  };
}

function idempotencyKeyValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError('Idempotency-Key is required.', { errorCode: 'STU-IDM-001' });
  }
  const normalized = stringValue(value, 'Idempotency-Key', true)!;
  if (normalized.length > 200) throw new ValidationError('Idempotency-Key is too long.', { errorCode: 'STU-IDM-001' });
  return normalized;
}

function normalizeCommand(command: StudentRegistrationCommand, requestIdempotencyKey: unknown): NormalizedCommand {
  if (!command || typeof command !== 'object') throw new ValidationError('Registration payload is required.');
  return {
    studentNumber: canonicalNumber(command.studentNumber, 'studentNumber'),
    legalFirstName: stringValue(command.legalFirstName, 'legalFirstName', true)!,
    legalMiddleName: stringValue(command.legalMiddleName, 'legalMiddleName'),
    legalLastName: stringValue(command.legalLastName, 'legalLastName', true)!,
    preferredName: stringValue(command.preferredName, 'preferredName'),
    dateOfBirth: dateValue(command.dateOfBirth),
    gender: stringValue(command.gender, 'gender'),
    nationality: stringValue(command.nationality, 'nationality'),
    birthCountryCode: stringValue(command.birthCountryCode, 'birthCountryCode')?.toUpperCase() || null,
    termId: stringValue(command.termId, 'termId', true)!,
    admissionReference: stringValue(command.admissionReference, 'admissionReference'),
    duplicateOverride: booleanValue(command.duplicateOverride, 'duplicateOverride'),
    duplicateOverrideReason: stringValue(command.duplicateOverrideReason, 'duplicateOverrideReason'),
    idempotencyKey: idempotencyKeyValue(requestIdempotencyKey),
    guardian: guardianInput(command.guardian)
  };
}

function assertContext(context: TenantContext): void {
  const values = [context.tenantId, context.schoolId, context.branchId, context.academicYear, context.userId, context.role];
  if (values.some(value => typeof value !== 'string' || !value.trim())) throw new ValidationError('Trusted tenant context is incomplete.');
  if (context.tenantId !== context.schoolId) throw new ValidationError('Trusted tenant and school context do not match.');
}

function serverId(value: string | undefined): string {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : randomUUID();
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
  }
  return value;
}

function hashPayload(payload: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(canonicalize(payload))).digest('hex');
}

function studentFingerprint(input: NormalizedCommand): string {
  return hashPayload({
    studentNumber: input.studentNumber || null,
    legalFirstName: input.legalFirstName,
    legalMiddleName: input.legalMiddleName,
    legalLastName: input.legalLastName,
    preferredName: input.preferredName,
    dateOfBirth: input.dateOfBirth,
    gender: input.gender,
    nationality: input.nationality,
    birthCountryCode: input.birthCountryCode,
    termId: input.termId,
    admissionReference: input.admissionReference,
    duplicateOverride: input.duplicateOverride,
    duplicateOverrideReason: input.duplicateOverrideReason,
    guardian: input.guardian
  });
}

export function createStudentRegistrationFingerprint(command: StudentRegistrationCommand): string {
  return studentFingerprint(normalizeCommand(command, 'test-idempotency-key'));
}

function assertPermission(context: TenantContext, permission: string, message: string): void {
  const allowed = authorizationEngine.can({ id: context.userId, schoolId: context.schoolId, role: context.role }, permission);
  if (!allowed) throw new AuthorizationError(message, { permission });
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === '23505';
}

export class StudentRegistrationService {
  async register(
    context: TenantContext,
    command: StudentRegistrationCommand,
    requestContext: RegistrationRequestContext = {}
  ): Promise<StudentRegistrationResult> {
    assertContext(context);
    const input = normalizeCommand(command, requestContext.idempotencyKey);
    const requestFingerprint = studentFingerprint(input);
    if (input.studentNumber) assertPermission(context, PERMISSIONS.STUDENT_NUMBER_OVERRIDE, 'Manual student number override is not permitted.');
    if (input.guardian.id) assertPermission(context, PERMISSIONS.STUDENT_GUARDIAN_LINK, 'Linking an existing guardian is not permitted.');
    if (input.duplicateOverride) assertPermission(context, PERMISSIONS.STUDENT_DUPLICATE_OVERRIDE, 'Duplicate override is not permitted.');
    const requestId = serverId(requestContext.requestId);
    const correlationId = serverId(requestContext.correlationId);
    const studentId = randomUUID();
    const guardianId = randomUUID();
    const enrollmentId = randomUUID();
    const academicStatusId = randomUUID();
    const transitionId = randomUUID();
    const statusHistoryId = randomUUID();
    const auditId = randomUUID();
    const outboxEventId = randomUUID();
    const studentNumber = input.studentNumber || `STU-${new Date().getUTCFullYear()}-${studentId.slice(0, 8).toUpperCase()}`;
    const guardianNumber = input.guardian.guardianNumber || `GDN-${guardianId.slice(0, 8).toUpperCase()}`;
    const enrollmentNumber = `ENR-${new Date().getUTCFullYear()}-${enrollmentId.slice(0, 8).toUpperCase()}`;

    try {
      return await UnitOfWork.runInTransaction(
        context.schoolId,
        {
          operationName: 'SOP-001 Student Registration',
          userId: context.userId,
          userName: context.userId,
          ipAddress: requestContext.ipAddress || 'unknown',
          affectedTables: ['students', 'guardians', 'student_guardians', 'enrollments', 'student_academic_status', 'student_status_transitions', 'student_status_history', 'audit_events', 'outbox_events'],
          tenantId: context.tenantId
          },
          async () => {
          const existing = await findIdempotentRegistration(context.tenantId, input.idempotencyKey);
          if (existing) {
            const storedFingerprint = typeof existing.payload.requestFingerprint === 'string'
              ? existing.payload.requestFingerprint
              : null;
            if (!storedFingerprint || storedFingerprint !== requestFingerprint) {
              throw new ConflictError('Idempotency-Key was already used with a different payload.', {
                errorCode: 'STU-IDM-001',
                idempotencyKey: input.idempotencyKey
              });
            }
            const priorResult = existing.payload.result;
            if (!priorResult || typeof priorResult !== 'object') {
              throw new ConflictError('The original idempotent registration result is unavailable.', { errorCode: 'STU-IDM-001' });
            }
            return { ...(priorResult as StudentRegistrationResult), idempotent: true };
          }

          const actorUserId = await resolveInternalActorUserId(context.tenantId, context.userId);

          await assertAcademicContext(context.tenantId, context.schoolId, context.academicYear, input.termId);
          await assertStudentNumberAvailable(context.tenantId, context.schoolId, studentNumber);
          await assertNoDuplicateStudent(
            context.tenantId,
            context.schoolId,
            input.dateOfBirth,
            input.legalFirstName,
            input.legalLastName,
            input.legalMiddleName,
            input.duplicateOverride,
            input.duplicateOverrideReason
          );

          // Audit is queued first because every business row references this event
          // through an immediate foreign key. The whole batch still commits or rolls back as one unit.
          enqueueAuditEvent({
            id: auditId,
            tenantId: context.tenantId,
            schoolId: context.schoolId,
            branchId: context.branchId,
            studentId,
            userId: actorUserId,
            requestId,
            correlationId,
            metadata: {
              studentId,
              enrollmentId,
              requestId,
              correlationId,
              duplicateOverride: input.duplicateOverride,
              duplicateOverrideReason: input.duplicateOverrideReason
            }
          });

          const guardian = await resolveGuardian(
            { tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, userId: actorUserId },
            input.guardian,
            auditId,
            requestId,
            correlationId,
            guardianId
          );

          enqueueStudent({
            id: studentId,
            tenantId: context.tenantId,
            schoolId: context.schoolId,
            branchId: context.branchId,
            studentNumber,
            legalFirstName: input.legalFirstName,
            legalMiddleName: input.legalMiddleName,
            legalLastName: input.legalLastName,
            preferredName: input.preferredName,
            dateOfBirth: input.dateOfBirth,
            gender: input.gender,
            nationality: input.nationality,
            birthCountryCode: input.birthCountryCode,
             userId: actorUserId,
            auditId,
            requestId,
            correlationId
          });
          enqueueStudentGuardian({
            id: randomUUID(), tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId,
            studentId, guardianId: guardian.id, relationshipType: input.guardian.relationshipType,
            isPrimary: input.guardian.isPrimary, isEmergencyContact: input.guardian.isEmergencyContact,
            canCollectStudent: input.guardian.canCollectStudent, custodyStatus: input.guardian.custodyStatus,
            consentStatus: input.guardian.consentStatus, userId: actorUserId, auditId, requestId, correlationId
          });
          enqueueEnrollment({
            id: enrollmentId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId,
            studentId, academicYearId: context.academicYear, termId: input.termId, enrollmentNumber,
            admissionReference: input.admissionReference, userId: actorUserId, auditId, requestId, correlationId
          });
          enqueueAcademicStatus({ id: academicStatusId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, studentId, userId: actorUserId, auditId, requestId, correlationId });
          enqueueStatusTransition({ id: transitionId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, studentId, idempotencyKey: input.idempotencyKey, userId: actorUserId, auditId, requestId, correlationId });
          enqueueStatusHistory({ id: statusHistoryId, tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId, studentId, transitionId, userId: actorUserId, auditId, requestId, correlationId });

          const result: StudentRegistrationResult = {
            idempotent: false,
            studentId,
            studentNumber,
            guardianId: guardian.id,
            guardianNumber: guardian.created ? guardianNumber : guardian.guardianNumber,
            enrollmentId,
            academicStatusId,
            transitionId,
            statusHistoryId,
            auditId,
            outboxEventId,
            requestId,
            correlationId
          };
          const payload = {
            studentId, studentNumber, guardianId: guardian.id, enrollmentId,
            academicStatusId, transitionId, statusHistoryId, requestId, correlationId,
            requestFingerprint,
            result
          };
          enqueueOutboxEvent({ id: outboxEventId, tenantId: context.tenantId, studentId, idempotencyKey: input.idempotencyKey, requestId, correlationId, payload, payloadHash: hashPayload(payload), userId: actorUserId, auditId });

          return result;
        },
        context
      );
    } catch (error) {
      if (isUniqueViolation(error)) return assertNoDatabaseConflict(error);
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof DatabaseError) throw error;
      throw new DatabaseError('Student registration transaction failed.', { cause: error instanceof Error ? error.message : String(error) });
    }
  }
}

export const studentRegistrationService = new StudentRegistrationService();
