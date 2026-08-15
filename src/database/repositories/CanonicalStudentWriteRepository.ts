import { randomUUID } from 'node:crypto';
import { UnitOfWork } from '../UnitOfWork';
import type { TransactionSession } from '../transactions/TransactionContracts';
import type { TenantContext } from '../../tenant/TenantContext';
import { ConflictError, DatabaseError, NotFoundError, ValidationError } from '../../utils/errors';

type StudentWritePatch = {
  legalFirstName?: string;
  legalMiddleName?: string | null;
  legalLastName?: string;
  preferredName?: string | null;
  dateOfBirth?: string;
  gender?: string | null;
  nationality?: string | null;
  studentNumber?: string;
};

type WriteAudit = {
  action: 'UPDATE' | 'SOFT_DELETE' | 'RESTORE';
  reason: string;
  requestId: string;
  correlationId: string;
  ipAddress: string;
};

type CanonicalStudent = {
  id: string;
  tenant_id: string;
  school_id: string;
  branch_id: string | null;
  student_number: string;
  legal_first_name: string;
  legal_middle_name: string | null;
  legal_last_name: string;
  preferred_name: string | null;
  date_of_birth: string;
  gender: string | null;
  nationality: string | null;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function transaction(): TransactionSession {
  const active = UnitOfWork.getActiveContext();
  if (!active?.isActive || !active.databaseTransaction) {
    throw new DatabaseError('Canonical Student writes require an active PostgreSQL transaction.');
  }
  return active.databaseTransaction;
}

function requireContext(context: TenantContext): void {
  const values = [context.tenantId, context.schoolId, context.branchId, context.academicYear, context.userId, context.role];
  if (values.some(value => typeof value !== 'string' || !value.trim())) {
    throw new ValidationError('Trusted tenant context is incomplete.');
  }
  if (context.tenantId !== context.schoolId) {
    throw new ValidationError('Trusted tenant and school context do not match.');
  }
}

function text(value: unknown, field: string, required = false): string | null {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ValidationError(`${field} is required.`);
    return null;
  }
  if (typeof value !== 'string') throw new ValidationError(`${field} must be text.`);
  const normalized = value.trim();
  if (required && !normalized) throw new ValidationError(`${field} is required.`);
  return normalized || null;
}

function dateValue(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ValidationError('dateOfBirth must use YYYY-MM-DD.');
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new ValidationError('dateOfBirth is not a valid calendar date.');
  }
  return value;
}

function uuidOrGenerate(value: string | undefined): string {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : randomUUID();
}

async function actorId(context: TenantContext): Promise<string> {
  const row = await transaction().query<{ id: string }>(
    `SELECT id
       FROM public.users
      WHERE tenant_id = $1
        AND auth_user_id = $2
        AND deleted_at IS NULL
        AND status = 'active'
      LIMIT 1`,
    [context.tenantId, context.userId]
  );
  if (!row.rows[0]) throw new ValidationError('The authenticated user is not provisioned as an active tenant user.');
  return row.rows[0].id;
}

async function writeAudit(
  context: TenantContext,
  studentId: string,
  audit: WriteAudit,
  internalActorId: string
): Promise<string> {
  const auditId = randomUUID();
  await transaction().query(
    `INSERT INTO public.audit_events (
       id, tenant_id, school_id, branch_id, actor_user_id,
       entity_type, entity_id, action, source, reason, result,
       metadata, request_id, correlation_id
     ) VALUES ($1, $2, $3, $4, $5, 'student', $6, $7, 'student-affairs', $8, 'success', $9::jsonb, $10, $11)`,
    [
      auditId,
      context.tenantId,
      context.schoolId,
      context.branchId,
      internalActorId,
      studentId,
      audit.action,
      audit.reason,
      JSON.stringify({ ipAddress: audit.ipAddress, actorUserId: context.userId }),
      uuidOrGenerate(audit.requestId),
      uuidOrGenerate(audit.correlationId)
    ]
  );
  return auditId;
}

function mapStudent(row: CanonicalStudent): Record<string, unknown> {
  return {
    id: row.id,
    schoolId: row.school_id,
    branchId: row.branch_id || '',
    tenantId: row.tenant_id,
    name: [row.legal_first_name, row.legal_middle_name, row.legal_last_name].filter(Boolean).join(' '),
    legalFirstName: row.legal_first_name,
    legalMiddleName: row.legal_middle_name || '',
    legalLastName: row.legal_last_name,
    preferredName: row.preferred_name || '',
    studentNumber: row.student_number,
    studentCode: row.student_number,
    birthDate: row.date_of_birth,
    dateOfBirth: row.date_of_birth,
    gender: row.gender || undefined,
    nationality: row.nationality || undefined,
    status: row.status === 'admitted' ? 'accepted' : row.status,
    version: row.version,
    registrationDate: row.created_at,
    updatedAt: row.updated_at,
    isDeleted: Boolean(row.deleted_at)
  };
}

export class CanonicalStudentWriteRepository {
  public static async update(
    context: TenantContext,
    studentId: string,
    patch: StudentWritePatch,
    expectedVersion: number,
    audit: WriteAudit
  ): Promise<Record<string, unknown>> {
    requireContext(context);
    if (!UnitOfWork.hasTransactionDriver()) throw new DatabaseError('Canonical Student writes require the configured PostgreSQL transaction driver.');
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new ValidationError('Student version is required for a safe update.');

    const run = async () => {
      const db = transaction();
      const existing = await db.query<CanonicalStudent>(
        `SELECT id, tenant_id, school_id, branch_id, student_number,
                legal_first_name, legal_middle_name, legal_last_name,
                preferred_name, date_of_birth, gender, nationality, status,
                version, created_at, updated_at, deleted_at
           FROM public.students
          WHERE id = $1
            AND tenant_id = $2
            AND school_id = $3
            AND (branch_id = $4 OR branch_id IS NULL)
          FOR UPDATE`,
        [studentId, context.tenantId, context.schoolId, context.branchId]
      );
      const current = existing.rows[0];
      if (!current) throw new NotFoundError('Student record was not found in the trusted school context.');
      if (current.deleted_at) throw new ValidationError('Archived students must be restored through the approved lifecycle workflow.');
      if (current.version !== expectedVersion) {
        throw new ConflictError('Student was changed by another user. Reload the record before editing.', { expectedVersion, actualVersion: current.version });
      }

      const fields: Array<[string, unknown]> = [];
      if (patch.legalFirstName !== undefined) fields.push(['legal_first_name', text(patch.legalFirstName, 'legalFirstName', true)]);
      if (patch.legalMiddleName !== undefined) fields.push(['legal_middle_name', text(patch.legalMiddleName, 'legalMiddleName')]);
      if (patch.legalLastName !== undefined) fields.push(['legal_last_name', text(patch.legalLastName, 'legalLastName', true)]);
      if (patch.preferredName !== undefined) fields.push(['preferred_name', text(patch.preferredName, 'preferredName')]);
      if (patch.dateOfBirth !== undefined) fields.push(['date_of_birth', dateValue(text(patch.dateOfBirth, 'dateOfBirth', true) as string)]);
      if (patch.gender !== undefined) fields.push(['gender', text(patch.gender, 'gender')]);
      if (patch.nationality !== undefined) fields.push(['nationality', text(patch.nationality, 'nationality')]);
      if (patch.studentNumber !== undefined) fields.push(['student_number', text(patch.studentNumber, 'studentNumber', true)]);
      if (fields.length === 0) throw new ValidationError('No canonical student fields were supplied for update.');

      const internalActor = await actorId(context);
      const auditId = await writeAudit(context, studentId, audit, internalActor);
      const setClauses = fields.map(([column], index) => `${column} = $${index + 1}`).join(', ');
      const values = fields.map(([, value]) => value);
      const versionIndex = values.length + 1;
      const update = await db.query<CanonicalStudent>(
        `UPDATE public.students
            SET ${setClauses},
                updated_at = now(),
                updated_by = $${versionIndex + 1},
                version = version + 1,
                audit_id = $${versionIndex + 2},
                request_id = $${versionIndex + 3},
                correlation_id = $${versionIndex + 4}
          WHERE id = $${versionIndex}
            AND tenant_id = $${versionIndex + 5}
            AND school_id = $${versionIndex + 6}
            AND (branch_id = $${versionIndex + 7} OR branch_id IS NULL)
            AND version = $${versionIndex + 8}
        RETURNING id, tenant_id, school_id, branch_id, student_number,
                  legal_first_name, legal_middle_name, legal_last_name,
                  preferred_name, date_of_birth, gender, nationality, status,
                  version, created_at, updated_at, deleted_at`,
        [
          ...values,
          studentId,
          internalActor,
          auditId,
          uuidOrGenerate(audit.requestId),
          uuidOrGenerate(audit.correlationId),
          context.tenantId,
          context.schoolId,
          context.branchId,
          expectedVersion
        ]
      );
      if (!update.rows[0]) throw new ConflictError('Student update was rejected because the record version changed.');
      return mapStudent(update.rows[0]);
    };

    return UnitOfWork.isTransactionActive()
      ? run()
      : UnitOfWork.runInTransaction(
        context.schoolId,
        {
          operationName: 'Canonical Student Update',
          tenantId: context.tenantId,
          userId: context.userId,
          userName: context.userId,
          ipAddress: audit.ipAddress,
          affectedTables: ['students', 'audit_events']
        },
        run,
        context
      );
  }

  public static async changeLifecycle(
    context: TenantContext,
    studentId: string,
    action: 'SOFT_DELETE' | 'RESTORE',
    audit: WriteAudit,
    restoreStatus = 'active'
  ): Promise<Record<string, unknown>> {
    requireContext(context);
    if (!UnitOfWork.hasTransactionDriver()) throw new DatabaseError('Canonical Student writes require the configured PostgreSQL transaction driver.');
    if (action === 'RESTORE' && !['applicant', 'admitted', 'active', 'suspended'].includes(restoreStatus)) {
      throw new ValidationError('Restore status is not an approved student lifecycle state.');
    }

    const run = async () => {
      const db = transaction();
      const internalActor = await actorId(context);
      const existing = await db.query<CanonicalStudent>(
        `SELECT id, tenant_id, school_id, branch_id, student_number,
                legal_first_name, legal_middle_name, legal_last_name,
                preferred_name, date_of_birth, gender, nationality, status,
                version, created_at, updated_at, deleted_at
           FROM public.students
          WHERE id = $1
            AND tenant_id = $2
            AND school_id = $3
            AND (branch_id = $4 OR branch_id IS NULL)
          FOR UPDATE`,
        [studentId, context.tenantId, context.schoolId, context.branchId]
      );
      const current = existing.rows[0];
      if (!current) throw new NotFoundError('Student record was not found in the trusted school context.');
      if (action === 'SOFT_DELETE' && current.deleted_at) throw new ValidationError('Student is already archived.');
      if (action === 'RESTORE' && !current.deleted_at) throw new ValidationError('Student is not archived.');
      const auditId = await writeAudit(context, studentId, audit, internalActor);
      const requestId = uuidOrGenerate(audit.requestId);
      const correlationId = uuidOrGenerate(audit.correlationId);
      const updated = await db.query<CanonicalStudent>(
        `UPDATE public.students
            SET status = $1,
                deleted_at = ${action === 'SOFT_DELETE' ? 'now()' : 'NULL'},
                deleted_by = ${action === 'SOFT_DELETE' ? '$2' : 'NULL'},
                updated_at = now(),
                updated_by = ${action === 'SOFT_DELETE' ? '$3' : '$2'},
                version = version + 1,
                audit_id = ${action === 'SOFT_DELETE' ? '$4' : '$3'},
                request_id = ${action === 'SOFT_DELETE' ? '$5' : '$4'},
                correlation_id = ${action === 'SOFT_DELETE' ? '$6' : '$5'}
          WHERE id = ${action === 'SOFT_DELETE' ? '$7' : '$6'}
            AND tenant_id = ${action === 'SOFT_DELETE' ? '$8' : '$7'}
            AND school_id = ${action === 'SOFT_DELETE' ? '$9' : '$8'}
            AND (branch_id = ${action === 'SOFT_DELETE' ? '$10' : '$9'} OR branch_id IS NULL)
        RETURNING id, tenant_id, school_id, branch_id, student_number,
                  legal_first_name, legal_middle_name, legal_last_name,
                  preferred_name, date_of_birth, gender, nationality, status,
                  version, created_at, updated_at, deleted_at`,
        action === 'SOFT_DELETE'
          ? ['archived', internalActor, internalActor, auditId, requestId, correlationId, studentId, context.tenantId, context.schoolId, context.branchId]
          : [restoreStatus, internalActor, auditId, requestId, correlationId, studentId, context.tenantId, context.schoolId, context.branchId]
      );
      if (!updated.rows[0]) throw new ConflictError('Student lifecycle operation was rejected by the database.');
      return mapStudent(updated.rows[0]);
    };

    return UnitOfWork.isTransactionActive()
      ? run()
      : UnitOfWork.runInTransaction(
        context.schoolId,
        {
          operationName: `Canonical Student ${action}`,
          tenantId: context.tenantId,
          userId: context.userId,
          userName: context.userId,
          ipAddress: audit.ipAddress,
          affectedTables: ['students', 'audit_events']
        },
        run,
        context
      );
  }

  public static async suspend(
    context: TenantContext,
    studentId: string,
    audit: WriteAudit
  ): Promise<Record<string, unknown>> {
    requireContext(context);
    if (!UnitOfWork.hasTransactionDriver()) throw new DatabaseError('Canonical Student writes require the configured PostgreSQL transaction driver.');

    const run = async () => {
      const db = transaction();
      const currentResult = await db.query<CanonicalStudent>(
        `SELECT id, tenant_id, school_id, branch_id, student_number,
                legal_first_name, legal_middle_name, legal_last_name,
                preferred_name, date_of_birth, gender, nationality, status,
                version, created_at, updated_at, deleted_at
           FROM public.students
          WHERE id = $1
            AND tenant_id = $2
            AND school_id = $3
            AND (branch_id = $4 OR branch_id IS NULL)
            AND deleted_at IS NULL
          FOR UPDATE`,
        [studentId, context.tenantId, context.schoolId, context.branchId]
      );
      const current = currentResult.rows[0];
      if (!current) throw new NotFoundError('Student record was not found in the trusted school context.');
      if (current.status !== 'active') {
        throw new ValidationError('Only an active student can enter the approved suspended state.');
      }

      const internalActor = await actorId(context);
      const auditId = await writeAudit(context, studentId, audit, internalActor);
      const transitionId = randomUUID();
      const historyId = randomUUID();
      const requestId = uuidOrGenerate(audit.requestId);
      const correlationId = uuidOrGenerate(audit.correlationId);
      const idempotencyKey = `student-status:${studentId}:${requestId}`;

      await db.query(
        `INSERT INTO public.student_status_transitions (
           id, tenant_id, school_id, branch_id, student_id,
           from_status, to_status, transition_kind, approval_status,
           effective_on, reason_code, reason_notes,
           requested_at, approved_at, completed_at,
           requested_by, approved_by, completed_by,
           idempotency_key, version, created_by, updated_by,
           audit_id, request_id, correlation_id
         ) VALUES ($1, $2, $3, $4, $5, $6, 'suspended', 'ordinary', 'completed',
                   CURRENT_DATE, 'administrative_suspension', $7,
                   now(), now(), now(), $8, $8, $8, $9, 1, $8, $8, $10, $11, $12)`,
        [transitionId, context.tenantId, context.schoolId, context.branchId, studentId, current.status, audit.reason, internalActor, idempotencyKey, auditId, requestId, correlationId]
      );
      await db.query(
        `INSERT INTO public.student_status_history (
           id, tenant_id, school_id, branch_id, student_id, transition_id,
           from_status, to_status, event_type, effective_on, reason_code,
           reason_notes, approved_at, approved_by, recorded_by, status,
           version, created_by, updated_by, audit_id, request_id, correlation_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'suspended', 'ordinary',
                   CURRENT_DATE, 'administrative_suspension', $8, now(), $9, $9,
                   'active', 1, $9, $9, $10, $11, $12)`,
        [historyId, context.tenantId, context.schoolId, context.branchId, studentId, transitionId, current.status, audit.reason, internalActor, auditId, requestId, correlationId]
      );
      const statusUpdate = await db.query(
        `UPDATE public.student_academic_status
            SET status = 'suspended',
                effective_on = CURRENT_DATE,
                reason_code = 'administrative_suspension',
                reason_notes = $1,
                approved_at = now(),
                approved_by = $2,
                updated_at = now(),
                updated_by = $2,
                version = version + 1,
                audit_id = $3,
                request_id = $4,
                correlation_id = $5
          WHERE tenant_id = $6
            AND school_id = $7
            AND student_id = $8
            AND deleted_at IS NULL`,
        [audit.reason, internalActor, auditId, requestId, correlationId, context.tenantId, context.schoolId, studentId]
      );
      if (statusUpdate.rowCount !== 1) {
        throw new ValidationError('The current academic status record is missing; status change was rolled back.');
      }
      const updated = await db.query<CanonicalStudent>(
        `UPDATE public.students
            SET status = 'suspended', updated_at = now(), updated_by = $1,
                version = version + 1, audit_id = $2,
                request_id = $3, correlation_id = $4
          WHERE id = $5 AND tenant_id = $6 AND school_id = $7
            AND (branch_id = $8 OR branch_id IS NULL) AND status = 'active'
        RETURNING id, tenant_id, school_id, branch_id, student_number,
                  legal_first_name, legal_middle_name, legal_last_name,
                  preferred_name, date_of_birth, gender, nationality, status,
                  version, created_at, updated_at, deleted_at`,
        [internalActor, auditId, requestId, correlationId, studentId, context.tenantId, context.schoolId, context.branchId]
      );
      if (!updated.rows[0]) throw new ConflictError('Student status changed concurrently; no update was committed.');
      return mapStudent(updated.rows[0]);
    };

    return UnitOfWork.isTransactionActive()
      ? run()
      : UnitOfWork.runInTransaction(
        context.schoolId,
        {
          operationName: 'Canonical Student Suspend',
          tenantId: context.tenantId,
          userId: context.userId,
          userName: context.userId,
          ipAddress: audit.ipAddress,
          affectedTables: ['students', 'student_academic_status', 'student_status_transitions', 'student_status_history', 'audit_events']
        },
        run,
        context
      );
  }
}
