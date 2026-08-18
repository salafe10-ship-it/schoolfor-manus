import { createHash, randomUUID } from 'node:crypto';
import { UnitOfWork } from '../../../database/UnitOfWork.js';
import type { TenantContext } from '../../../tenant/TenantContext.js';
import { authorizationEngine } from '../../../authorization/AuthorizationEngine.js';
import { PERMISSIONS } from '../../../authorization/PermissionRegistry.js';
import { ConflictError, DatabaseError, NotFoundError, ValidationError } from '../../../utils/errors.js';
import {
  enqueueGuardianAuditEvent,
  enqueueGuardianOutboxEvent,
  resolveInternalActorUserId
} from '../infrastructure/StudentRegistrationRepositories.js';
import { SQLCommandBuilder } from '../../../database/transactions/SQLCommand.js';

type GuardianUpdateContext = Pick<TenantContext, 'tenantId' | 'schoolId' | 'branchId' | 'userId' | 'role' | 'academicYear'>;

type GuardianUpdateCommand = {
  guardianId?: unknown;
  expectedGuardianVersion?: unknown;
  expectedRelationshipVersion?: unknown;
  legalFirstName?: unknown;
  legalMiddleName?: unknown;
  legalLastName?: unknown;
  phone?: unknown;
  email?: unknown;
  addressLine1?: unknown;
  addressLine2?: unknown;
  city?: unknown;
  countryCode?: unknown;
  relationshipType?: unknown;
  isPrimary?: unknown;
  isEmergencyContact?: unknown;
  canCollectStudent?: unknown;
  custodyStatus?: unknown;
  consentStatus?: unknown;
};

type RequestContext = {
  requestId?: string;
  correlationId?: string;
  ipAddress?: string;
};

type GuardianRow = {
  student_id: string;
  guardian_id: string;
  relationship_id: string;
  guardian_version: number;
  relationship_version: number;
  guardian_number: string;
  legal_first_name: string;
  legal_middle_name: string | null;
  legal_last_name: string;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country_code: string | null;
  relationship_type: string;
  is_primary: boolean;
  is_emergency_contact: boolean;
  can_collect_student: boolean;
  custody_status: string;
  consent_status: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RELATIONSHIP_TYPES = ['parent', 'legal_guardian', 'foster_parent', 'sibling', 'relative', 'sponsor', 'other'] as const;
const CUSTODY_STATUSES = ['unknown', 'shared', 'sole', 'none', 'court_ordered'] as const;
const CONSENT_STATUSES = ['pending', 'granted', 'revoked', 'not_required'] as const;
const CLIENT_SCOPE_FIELDS = ['tenantId', 'tenant_id', 'schoolId', 'school_id', 'branchId', 'branch_id'] as const;

function transaction() {
  const active = UnitOfWork.getActiveContext();
  if (!active?.isActive || !active.databaseTransaction) {
    throw new DatabaseError('Canonical Guardian updates require an active PostgreSQL transaction.');
  }
  return active.databaseTransaction;
}

function serverId(value: string | undefined): string {
  return value && UUID_PATTERN.test(value) ? value : randomUUID();
}

function assertContext(context: GuardianUpdateContext): void {
  const values = [context.tenantId, context.schoolId, context.branchId, context.academicYear, context.userId, context.role];
  if (values.some(value => typeof value !== 'string' || !value.trim())) {
    throw new ValidationError('Trusted tenant context is incomplete.', { errorCode: 'STU-GUARD-004', reason: 'MISSING_TRUSTED_CONTEXT' });
  }
  // A tenant may own multiple schools; trusted membership and SQL scope checks
  // keep tenant, school, and branch boundaries independent.

}

function assertNoClientScope(command: GuardianUpdateCommand): void {
  const record = command as Record<string, unknown>;
  const supplied = CLIENT_SCOPE_FIELDS.filter(field => Object.prototype.hasOwnProperty.call(record, field));
  if (supplied.length > 0) {
    throw new ValidationError('Tenant, school, and branch ownership are server-derived and cannot be supplied by the client.', {
      errorCode: 'STU-GUARD-004',
      reason: 'CLIENT_SCOPE_NOT_ACCEPTED',
      fields: supplied
    });
  }
}

function optionalText(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') throw new ValidationError(`${field} must be text.`);
  const normalized = value.trim();
  return normalized || null;
}

function requiredText(value: unknown, field: string): string {
  const normalized = optionalText(value, field);
  if (!normalized) throw new ValidationError(`${field} cannot be empty.`);
  return normalized;
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw new ValidationError(`${field} must be boolean.`);
  return value;
}

function enumValue<T extends string>(value: unknown, field: string, allowed: readonly T[]): T | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new ValidationError(`${field} contains an unsupported value.`);
  return value as T;
}

function expectedVersion(value: unknown, field: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new ValidationError(`${field} is required for a safe concurrent update.`);
  return parsed;
}

function payloadHash(payload: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function uniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === '23505';
}

export class CanonicalGuardianUpdateService {
  async update(
    context: GuardianUpdateContext,
    studentId: string,
    command: GuardianUpdateCommand,
    requestContext: RequestContext = {}
  ): Promise<Record<string, unknown>> {
    assertContext(context);
    if (!UUID_PATTERN.test(studentId)) throw new ValidationError('studentId must be a canonical UUID.');
    assertNoClientScope(command);

    const guardianId = command.guardianId === undefined ? undefined : String(command.guardianId);
    if (guardianId !== undefined && !UUID_PATTERN.test(guardianId)) throw new ValidationError('guardianId must be a canonical UUID.');
    const guardianVersion = expectedVersion(command.expectedGuardianVersion, 'expectedGuardianVersion');
    const relationshipVersion = expectedVersion(command.expectedRelationshipVersion, 'expectedRelationshipVersion');
    const actor = { id: context.userId, schoolId: context.schoolId, role: context.role };
    if (!authorizationEngine.can(actor, PERMISSIONS.STUDENT_WRITE)) {
      throw new ValidationError('Guardian update permission was not granted.', { errorCode: 'AUTHORIZATION_ERROR', reason: 'MISSING_PERMISSION' });
    }

    const guardianFields: Array<[string, unknown]> = [];
    if (command.legalFirstName !== undefined) guardianFields.push(['legal_first_name', requiredText(command.legalFirstName, 'legalFirstName')]);
    if (command.legalMiddleName !== undefined) guardianFields.push(['legal_middle_name', optionalText(command.legalMiddleName, 'legalMiddleName')]);
    if (command.legalLastName !== undefined) guardianFields.push(['legal_last_name', requiredText(command.legalLastName, 'legalLastName')]);
    if (command.phone !== undefined) guardianFields.push(['phone', optionalText(command.phone, 'phone')]);
    if (command.email !== undefined) {
      const email = optionalText(command.email, 'email');
      if (email && (!email.includes('@') || email.startsWith('@'))) throw new ValidationError('email is invalid.');
      guardianFields.push(['email', email]);
    }
    if (command.addressLine1 !== undefined) guardianFields.push(['address_line1', optionalText(command.addressLine1, 'addressLine1')]);
    if (command.addressLine2 !== undefined) guardianFields.push(['address_line2', optionalText(command.addressLine2, 'addressLine2')]);
    if (command.city !== undefined) guardianFields.push(['city', optionalText(command.city, 'city')]);
    if (command.countryCode !== undefined) {
      const countryCode = optionalText(command.countryCode, 'countryCode')?.toUpperCase() || null;
      if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) throw new ValidationError('countryCode must contain two uppercase letters.');
      guardianFields.push(['country_code', countryCode]);
    }

    const relationshipFields: Array<[string, unknown]> = [];
    if (command.relationshipType !== undefined) relationshipFields.push(['relationship_type', enumValue(command.relationshipType, 'relationshipType', RELATIONSHIP_TYPES)]);
    if (command.isPrimary !== undefined) relationshipFields.push(['is_primary', optionalBoolean(command.isPrimary, 'isPrimary')]);
    if (command.isEmergencyContact !== undefined) relationshipFields.push(['is_emergency_contact', optionalBoolean(command.isEmergencyContact, 'isEmergencyContact')]);
    if (command.canCollectStudent !== undefined) relationshipFields.push(['can_collect_student', optionalBoolean(command.canCollectStudent, 'canCollectStudent')]);
    if (command.custodyStatus !== undefined) relationshipFields.push(['custody_status', enumValue(command.custodyStatus, 'custodyStatus', CUSTODY_STATUSES)]);
    if (command.consentStatus !== undefined) relationshipFields.push(['consent_status', enumValue(command.consentStatus, 'consentStatus', CONSENT_STATUSES)]);
    if (guardianFields.length === 0 && relationshipFields.length === 0) throw new ValidationError('At least one Guardian or relationship field is required.');

    const requestId = serverId(requestContext.requestId);
    const correlationId = serverId(requestContext.correlationId);
    const auditId = randomUUID();
    const outboxId = randomUUID();
    const idempotencyKey = `guardian-update:${studentId}:${requestId}`;

    try {
      return await UnitOfWork.runInTransaction(
        context.schoolId,
        {
          operationName: 'STU-AFFAIRS-P0-003-04 Canonical Guardian Update',
          tenantId: context.tenantId,
          userId: context.userId,
          userName: context.userId,
          ipAddress: requestContext.ipAddress || 'unknown',
          affectedTables: ['students', 'guardians', 'student_guardians', 'audit_events', 'outbox_events']
        },
        async () => {
          const actorUserId = await resolveInternalActorUserId(context.tenantId, context.userId);
          const row = await transaction().query<GuardianRow>(
            `SELECT s.id AS student_id,
                    g.id AS guardian_id,
                    sg.id AS relationship_id,
                    g.version AS guardian_version,
                    sg.version AS relationship_version,
                    g.guardian_number, g.legal_first_name, g.legal_middle_name, g.legal_last_name,
                    g.phone, g.email, g.address_line1, g.address_line2, g.city, g.country_code,
                    sg.relationship_type, sg.is_primary, sg.is_emergency_contact,
                    sg.can_collect_student, sg.custody_status, sg.consent_status
               FROM public.students AS s
               INNER JOIN public.student_guardians AS sg
                 ON sg.tenant_id = s.tenant_id
                AND sg.school_id = s.school_id
                AND sg.branch_id = s.branch_id
                AND sg.student_id = s.id
                AND sg.status = 'active'
                AND sg.deleted_at IS NULL
               INNER JOIN public.guardians AS g
                 ON g.tenant_id = sg.tenant_id
                AND g.id = sg.guardian_id
                AND (g.branch_id = $3 OR g.branch_id IS NULL)
                AND g.status = 'active'
                AND g.deleted_at IS NULL
              WHERE s.id = $4
                AND s.tenant_id = $1
                AND s.school_id = $2
                AND s.branch_id = $3
                AND s.deleted_at IS NULL
                AND ($5::uuid IS NULL OR g.id = $5::uuid)
              ORDER BY sg.is_primary DESC, sg.created_at ASC
              LIMIT 1
              FOR UPDATE OF s, sg, g`,
            [context.tenantId, context.schoolId, context.branchId, studentId, guardianId || null]
          );
          const current = row.rows[0];
          if (!current) throw new NotFoundError('Guardian is not linked to the student in the trusted scope.', { errorCode: 'STU-GUARD-004', reason: 'GUARDIAN_NOT_LINKED_TO_STUDENT' });
          if (current.guardian_version !== guardianVersion || current.relationship_version !== relationshipVersion) {
            throw new ConflictError('Guardian data changed by another user. Reload the record before editing.', {
              errorCode: 'STU-GUARD-005',
              reason: 'STALE_GUARDIAN_VERSION',
              expectedGuardianVersion: guardianVersion,
              actualGuardianVersion: current.guardian_version,
              expectedRelationshipVersion: relationshipVersion,
              actualRelationshipVersion: current.relationship_version
            });
          }

          enqueueGuardianAuditEvent({
            id: auditId,
            tenantId: context.tenantId,
            schoolId: context.schoolId,
            branchId: context.branchId,
            guardianId: current.guardian_id,
            studentId: current.student_id,
            userId: actorUserId,
            requestId,
            correlationId,
            metadata: { guardianId: current.guardian_id, relationshipId: current.relationship_id, guardianFields: guardianFields.map(([field]) => field), relationshipFields: relationshipFields.map(([field]) => field) }
          });

          if (guardianFields.length > 0) {
            const setClauses = guardianFields.map(([field], index) => `${field} = $${index + 1}`).join(', ');
            const values = guardianFields.map(([, value]) => value);
            const actorIndex = values.length + 1;
            const auditIndex = values.length + 2;
            const requestIndex = values.length + 3;
            const correlationIndex = values.length + 4;
            const tenantIndex = values.length + 5;
            const schoolIndex = values.length + 6;
            const branchIndex = values.length + 7;
            const idIndex = values.length + 8;
            const versionIndex = values.length + 9;
            UnitOfWork.enlistUpdate('guardians', current.guardian_id, { id: current.guardian_id, version: current.guardian_version + 1 }, SQLCommandBuilder.create({
              sqlText: `UPDATE public.guardians
                           SET ${setClauses}, updated_at = now(), updated_by = $${actorIndex},
                               audit_id = $${auditIndex}, request_id = $${requestIndex},
                               correlation_id = $${correlationIndex}, version = version + 1
                         WHERE tenant_id = $${tenantIndex} AND school_id = $${schoolIndex}
                           AND (branch_id = $${branchIndex} OR branch_id IS NULL)
                           AND id = $${idIndex} AND version = $${versionIndex}`,
              parameters: [...values, actorUserId, auditId, requestId, correlationId, context.tenantId, context.schoolId, context.branchId, current.guardian_id, guardianVersion],
              executionContext: 'Canonical Guardian Update', tenantContext: 'TRUSTED_TENANT_CONTEXT'
            }));
          }

          if (relationshipFields.length > 0) {
            const setClauses = relationshipFields.map(([field], index) => `${field} = $${index + 1}`).join(', ');
            const values = relationshipFields.map(([, value]) => value);
            const actorIndex = values.length + 1;
            const auditIndex = values.length + 2;
            const requestIndex = values.length + 3;
            const correlationIndex = values.length + 4;
            const tenantIndex = values.length + 5;
            const schoolIndex = values.length + 6;
            const branchIndex = values.length + 7;
            const idIndex = values.length + 8;
            const versionIndex = values.length + 9;
            UnitOfWork.enlistUpdate('student_guardians', current.relationship_id, { id: current.relationship_id, version: current.relationship_version + 1 }, SQLCommandBuilder.create({
              sqlText: `UPDATE public.student_guardians
                           SET ${setClauses}, updated_at = now(), updated_by = $${actorIndex},
                               audit_id = $${auditIndex}, request_id = $${requestIndex},
                               correlation_id = $${correlationIndex}, version = version + 1
                         WHERE tenant_id = $${tenantIndex} AND school_id = $${schoolIndex}
                           AND branch_id = $${branchIndex} AND id = $${idIndex}
                           AND version = $${versionIndex}`,
              parameters: [...values, actorUserId, auditId, requestId, correlationId, context.tenantId, context.schoolId, context.branchId, current.relationship_id, relationshipVersion],
              executionContext: 'Canonical Guardian Relationship Update', tenantContext: 'TRUSTED_TENANT_CONTEXT'
            }));
          }

          const payload = {
            studentId: current.student_id,
            guardianId: current.guardian_id,
            relationshipId: current.relationship_id,
            guardianFields: Object.fromEntries(guardianFields),
            relationshipFields: Object.fromEntries(relationshipFields),
            requestId,
            correlationId
          };
          enqueueGuardianOutboxEvent({
            id: outboxId,
            tenantId: context.tenantId,
            guardianId: current.guardian_id,
            idempotencyKey,
            requestId,
            correlationId,
            payload,
            payloadHash: payloadHash(payload),
            userId: actorUserId,
            auditId
          });

          return {
            studentId: current.student_id,
            guardianId: current.guardian_id,
            relationshipId: current.relationship_id,
            guardianVersion: current.guardian_version + (guardianFields.length > 0 ? 1 : 0),
            relationshipVersion: current.relationship_version + (relationshipFields.length > 0 ? 1 : 0),
            auditId,
            outboxEventId: outboxId,
            requestId,
            correlationId,
            persistence: 'canonical-postgres'
          };
        },
        {
          tenantId: context.tenantId,
          schoolId: context.schoolId,
          branchId: context.branchId,
          academicYear: context.academicYear,
          userId: context.userId,
          role: context.role
        }
      );
    } catch (error) {
      if (uniqueViolation(error)) throw new ConflictError('Guardian update conflicts with an existing canonical record.', { errorCode: 'STU-GUARD-006' });
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof NotFoundError || error instanceof DatabaseError) throw error;
      throw new DatabaseError('Canonical Guardian update transaction failed.', { cause: error instanceof Error ? error.message : String(error) });
    }
  }
}

export const canonicalGuardianUpdateService = new CanonicalGuardianUpdateService();
