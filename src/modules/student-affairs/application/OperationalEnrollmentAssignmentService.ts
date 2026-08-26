import { createHash, randomUUID } from 'node:crypto';
import { UnitOfWork } from '../../../database/UnitOfWork.js';
import type { TransactionSession } from '../../../database/transactions/TransactionContracts.js';
import type { TenantContext } from '../../../tenant/TenantContext.js';
import { ConflictError, DatabaseError, ValidationError } from '../../../utils/errors.js';

type ActiveClass = {
  id: string;
  code: string;
  name: string;
  capacity: number;
  section: string;
};

type Candidate = {
  id: string;
  studentNumber: string;
  status: string;
};

export type OperationalEnrollmentAssignment = {
  studentId: string;
  classReference: string;
  sectionReference: string;
};

export type OperationalEnrollmentRepairResult = {
  idempotent: boolean;
  processedCount: number;
  createdEnrollmentCount: number;
  updatedEnrollmentCount: number;
  activatedStudentCount: number;
  distribution: Array<{ classReference: string; sectionReference: string; studentCount: number }>;
  requestId: string;
  correlationId: string;
};

type CurrentEnrollment = {
  id: string;
  enrollment_number: string;
};

type CurrentAcademicStatus = {
  id: string;
  status: string;
};

type ExistingOutbox = {
  event_type: string;
  payload: { result?: OperationalEnrollmentRepairResult } | null;
};

const OPERATION = 'STUDENT_OPERATIONAL_ENROLLMENT_REPAIR';
const REASON_CODE = 'operational_enrollment_repair';
const CORRECTION_REFERENCE = 'STUDENT-AFFAIRS-OPERATIONAL-ENROLLMENT-REPAIR';

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function hashPayload(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function sectionFromClassCode(code: string, allowedSections: Set<string>): string {
  const suffix = code.match(/-([A-Z])$/i)?.[1]?.toUpperCase();
  const mapped = suffix === 'A' ? 'أ' : suffix === 'B' ? 'ب' : suffix === 'C' ? 'ج' : suffix === 'D' ? 'د' : '';
  if (mapped && allowedSections.has(mapped)) return mapped;
  const firstSection = [...allowedSections].sort((left, right) => left.localeCompare(right, 'ar'))[0];
  if (!firstSection) throw new ValidationError('لا توجد شعب فعالة في الهيكل الأكاديمي الموثوق.');
  return firstSection;
}

function parseActiveClasses(structure: unknown): ActiveClass[] {
  const record = structure && typeof structure === 'object' && !Array.isArray(structure)
    ? structure as Record<string, unknown>
    : null;
  const rawSections = Array.isArray(record?.sections) ? record.sections : [];
  const allowedSections = new Set(rawSections.map(cleanText).filter(Boolean));
  const rawClasses = Array.isArray(record?.classes) ? record.classes : [];
  const seenNames = new Set<string>();
  const classes = rawClasses.map((value): ActiveClass | null => {
    const item = value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
    if (!item || item.isActive === false) return null;
    const id = cleanText(item.id);
    const code = cleanText(item.code).toUpperCase();
    const name = cleanText(item.name);
    const capacity = Number(item.capacity);
    if (!id || !code || !name || !Number.isSafeInteger(capacity) || capacity <= 0) {
      throw new ValidationError('يوجد فصل غير مكتمل أو بلا سعة في الهيكل الأكاديمي الموثوق.');
    }
    if (seenNames.has(name)) throw new ValidationError(`اسم الفصل ${name} مكرر في الهيكل الأكاديمي.`);
    seenNames.add(name);
    return { id, code, name, capacity, section: sectionFromClassCode(code, allowedSections) };
  }).filter((item): item is ActiveClass => item !== null);
  if (!classes.length) throw new ValidationError('لا توجد فصول نشطة مهيأة لإسناد الطلاب.');
  return classes.sort((left, right) => left.code.localeCompare(right.code, 'en'));
}

/**
 * Produces a stable, capacity-aware placement plan. The plan deliberately uses
 * only the school-owned academic structure and never accepts class names from
 * the browser. A deterministic ordering makes retries observable and testable.
 */
export function buildCapacityAwareOperationalEnrollmentPlan(
  candidates: Candidate[],
  classes: ActiveClass[],
  existingOccupancy: Map<string, number>
): OperationalEnrollmentAssignment[] {
  const remainingCapacity = new Map<string, number>();
  const assignedCount = new Map<string, number>();
  for (const academicClass of classes) {
    const occupied = existingOccupancy.get(academicClass.name) || 0;
    if (occupied > academicClass.capacity) {
      throw new ValidationError(`الفصل ${academicClass.name} يتجاوز سعته المعتمدة بالفعل.`);
    }
    remainingCapacity.set(academicClass.name, academicClass.capacity - occupied);
    assignedCount.set(academicClass.name, 0);
  }
  if ([...remainingCapacity.values()].reduce((total, value) => total + value, 0) < candidates.length) {
    throw new ValidationError('السعات المعتمدة للفصول لا تكفي لإسناد جميع الطلاب غير المرتبطين.');
  }

  return [...candidates]
    .sort((left, right) => left.studentNumber.localeCompare(right.studentNumber, 'en') || left.id.localeCompare(right.id, 'en'))
    .map(candidate => {
      const selected = classes
        .filter(academicClass => (remainingCapacity.get(academicClass.name) || 0) > 0)
        .sort((left, right) => {
          const leftRatio = ((existingOccupancy.get(left.name) || 0) + (assignedCount.get(left.name) || 0)) / left.capacity;
          const rightRatio = ((existingOccupancy.get(right.name) || 0) + (assignedCount.get(right.name) || 0)) / right.capacity;
          return leftRatio - rightRatio || left.code.localeCompare(right.code, 'en');
        })[0];
      if (!selected) throw new ValidationError('تعذر العثور على سعة متاحة لإسناد الطالب.');
      remainingCapacity.set(selected.name, (remainingCapacity.get(selected.name) || 0) - 1);
      assignedCount.set(selected.name, (assignedCount.get(selected.name) || 0) + 1);
      return {
        studentId: candidate.id,
        classReference: selected.name,
        sectionReference: selected.section
      };
    });
}

function transaction(): TransactionSession {
  const context = UnitOfWork.getActiveContext();
  if (!context?.isActive || !context.databaseTransaction) {
    throw new DatabaseError('عملية ربط القيد تتطلب معاملة قاعدة بيانات نشطة.');
  }
  return context.databaseTransaction;
}

function toResult(value: unknown): OperationalEnrollmentRepairResult {
  if (!value || typeof value !== 'object') throw new ConflictError('نتيجة المحاولة السابقة غير صالحة. استخدم مفتاح عملية جديداً.');
  const result = value as OperationalEnrollmentRepairResult;
  if (!Number.isSafeInteger(result.processedCount) || !Array.isArray(result.distribution)) {
    throw new ConflictError('نتيجة المحاولة السابقة غير مكتملة. استخدم مفتاح عملية جديداً.');
  }
  return result;
}

function requireContext(context: TenantContext): void {
  const required = [context.tenantId, context.schoolId, context.branchId, context.academicYear, context.userId, context.role];
  if (required.some(value => !cleanText(value))) throw new ValidationError('سياق المدرسة الموثوق غير مكتمل.');
}

export class OperationalEnrollmentAssignmentService {
  async repairUnassignedStudents(
    context: TenantContext,
    request: { idempotencyKey: unknown; reason?: unknown; ipAddress?: unknown }
  ): Promise<OperationalEnrollmentRepairResult> {
    requireContext(context);
    if (!UnitOfWork.hasTransactionDriver()) {
      throw new DatabaseError('لا يتوفر محرك معاملات قاعدة البيانات لإصلاح ربط القيد.');
    }
    const idempotencyKey = cleanText(request.idempotencyKey);
    // Per-student correction transitions derive their key from this batch key,
    // so reserve enough room for the UUID suffix while staying within the DB
    // constraint on student_status_transitions.idempotency_key.
    if (!idempotencyKey || idempotencyKey.length > 150) {
      throw new ValidationError('مفتاح منع التكرار مطلوب لإصلاح ربط القيد.');
    }
    const reason = cleanText(request.reason) || 'ربط تشغيلي للطلاب بتفويض مدير النظام لتجهيز الاختبار الفعلي.';
    if (reason.length < 5 || reason.length > 500) throw new ValidationError('سبب ربط القيد يجب أن يكون بين 5 و500 حرف.');
    const requestId = randomUUID();
    const correlationId = randomUUID();

    return UnitOfWork.runInTransaction(
      context.schoolId,
      {
        operationName: 'Student Operational Enrollment Repair',
        tenantId: context.tenantId,
        userId: context.userId,
        userName: context.userId,
        ipAddress: cleanText(request.ipAddress) || 'unknown',
        affectedTables: [
          'students',
          'enrollments',
          'student_academic_status',
          'student_status_transitions',
          'student_status_history',
          'audit_events',
          'outbox_events'
        ]
      },
      async () => {
        const db = transaction();
        const prior = await db.query<ExistingOutbox>(
          `SELECT event_type, payload
             FROM public.outbox_events
            WHERE tenant_id = $1
              AND idempotency_key = $2
              AND deleted_at IS NULL
            LIMIT 1`,
          [context.tenantId, idempotencyKey]
        );
        if (prior.rows[0]) {
          if (prior.rows[0].event_type !== OPERATION) {
            throw new ConflictError('مفتاح منع التكرار استُخدم لعملية أخرى.');
          }
          return { ...toResult(prior.rows[0].payload?.result), idempotent: true };
        }

        const actor = await db.query<{ id: string }>(
          `SELECT id
             FROM public.users
            WHERE tenant_id = $1
              AND auth_user_id = $2
              AND status = 'active'
              AND deleted_at IS NULL
            LIMIT 1`,
          [context.tenantId, context.userId]
        );
        const actorUserId = actor.rows[0]?.id;
        if (!actorUserId) throw new ValidationError('المستخدم الحالي غير مهيأ كسجل مستخدم داخلي نشط.');

        const academicContext = await db.query<{ starts_on: string; term_id: string; structure: unknown }>(
          `SELECT y.starts_on::text,
                  t.id AS term_id,
                  settings.setting_value AS structure
             FROM public.academic_years y
             INNER JOIN public.terms t
               ON t.tenant_id = y.tenant_id
              AND t.school_id = y.school_id
              AND t.academic_year_id = y.id
              AND (t.branch_id = $3 OR t.branch_id IS NULL)
              AND t.status = 'active'
              AND t.deleted_at IS NULL
             INNER JOIN LATERAL (
               SELECT setting_value
                 FROM public.school_settings
                WHERE tenant_id = y.tenant_id
                  AND school_id = y.school_id
                  AND setting_key = 'academic_structure'
                  AND status = 'active'
                  AND deleted_at IS NULL
                ORDER BY effective_from DESC, created_at DESC
                LIMIT 1
             ) settings ON true
            WHERE y.tenant_id = $1
              AND y.school_id = $2
              AND y.id = $4
              AND y.status = 'active'
              AND y.is_current = true
              AND y.deleted_at IS NULL
            ORDER BY t.sequence DESC, t.starts_on DESC
            LIMIT 1`,
          [context.tenantId, context.schoolId, context.branchId, context.academicYear]
        );
        const currentAcademicContext = academicContext.rows[0];
        if (!currentAcademicContext) {
          throw new ValidationError('لا توجد سنة وفصل دراسي نشطان وهيكل أكاديمي موثوق لإصلاح الربط.');
        }
        const classes = parseActiveClasses(currentAcademicContext.structure);

        const candidatesResult = await db.query<Candidate>(
          `SELECT s.id, s.student_number AS "studentNumber", s.status
             FROM public.students s
            WHERE s.tenant_id = $1
              AND s.school_id = $2
              AND s.branch_id = $3
              AND s.deleted_at IS NULL
              AND s.status IN ('active', 'applicant')
              AND NOT EXISTS (
                SELECT 1
                  FROM public.enrollments e
                 WHERE e.tenant_id = s.tenant_id
                   AND e.school_id = s.school_id
                   AND (e.branch_id = s.branch_id OR e.branch_id IS NULL)
                   AND e.student_id = s.id
                   AND e.academic_year_id = $4
                   AND e.enrollment_status IN ('pending', 'active')
                   AND e.deleted_at IS NULL
                   AND NULLIF(btrim(e.class_reference), '') IS NOT NULL
                   AND NULLIF(btrim(e.section_reference), '') IS NOT NULL
              )
            ORDER BY s.student_number ASC, s.id ASC
            FOR UPDATE`,
          [context.tenantId, context.schoolId, context.branchId, context.academicYear]
        );
        const candidates = candidatesResult.rows.map(candidate => ({
          ...candidate,
          id: cleanText(candidate.id),
          studentNumber: cleanText(candidate.studentNumber),
          status: cleanText(candidate.status)
        }));
        if (candidates.some(candidate => !isUuid(candidate.id) || !candidate.studentNumber || !['active', 'applicant'].includes(candidate.status))) {
          throw new ValidationError('توجد بيانات طلاب غير صالحة ضمن عملية إصلاح الربط.');
        }
        if (candidates.length === 0) {
          const result: OperationalEnrollmentRepairResult = {
            idempotent: false,
            processedCount: 0,
            createdEnrollmentCount: 0,
            updatedEnrollmentCount: 0,
            activatedStudentCount: 0,
            distribution: [],
            requestId,
            correlationId
          };
          const payload = { operation: OPERATION, result, reason };
          await db.query(
            `INSERT INTO public.audit_events (
               id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id,
               action, source, reason, result, metadata, request_id, correlation_id
             ) VALUES ($1, $2, $3, $4, $5, 'StudentEnrollmentRepair', $6,
                       'noop', 'StudentAffairsOperationalEnrollmentAssignmentService', $7,
                       'success', $8::jsonb, $9, $10)`,
            [randomUUID(), context.tenantId, context.schoolId, context.branchId, actorUserId, context.schoolId, reason, JSON.stringify(payload), requestId, correlationId]
          );
          return result;
        }

        const occupancyResult = await db.query<{ class_reference: string; student_count: string }>(
          `SELECT e.class_reference, COUNT(*)::text AS student_count
             FROM public.enrollments e
            WHERE e.tenant_id = $1
              AND e.school_id = $2
              AND (e.branch_id = $3 OR e.branch_id IS NULL)
              AND e.academic_year_id = $4
              AND e.enrollment_status IN ('pending', 'active')
              AND e.deleted_at IS NULL
              AND NULLIF(btrim(e.class_reference), '') IS NOT NULL
            GROUP BY e.class_reference`,
          [context.tenantId, context.schoolId, context.branchId, context.academicYear]
        );
        const occupancy = new Map(occupancyResult.rows.map(row => [cleanText(row.class_reference), Number(row.student_count) || 0]));
        const plan = buildCapacityAwareOperationalEnrollmentPlan(candidates, classes, occupancy);
        const assignmentByStudent = new Map(plan.map(assignment => [assignment.studentId, assignment]));
        const auditId = randomUUID();
        const auditMetadata = {
          operation: OPERATION,
          source: 'student-affairs',
          candidateCount: candidates.length,
          distribution: plan.reduce<Record<string, number>>((summary, assignment) => {
            const key = `${assignment.classReference} | ${assignment.sectionReference}`;
            summary[key] = (summary[key] || 0) + 1;
            return summary;
          }, {}),
          requestId,
          correlationId
        };
        await db.query(
          `INSERT INTO public.audit_events (
             id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id,
             action, source, reason, result, metadata, request_id, correlation_id
           ) VALUES ($1, $2, $3, $4, $5, 'StudentEnrollmentRepair', $6,
                     'repair', 'StudentAffairsOperationalEnrollmentAssignmentService', $7,
                     'success', $8::jsonb, $9, $10)`,
          [auditId, context.tenantId, context.schoolId, context.branchId, actorUserId, context.schoolId, reason, JSON.stringify(auditMetadata), requestId, correlationId]
        );

        let createdEnrollmentCount = 0;
        let updatedEnrollmentCount = 0;
        let activatedStudentCount = 0;
        for (const candidate of candidates) {
          const assignment = assignmentByStudent.get(candidate.id);
          if (!assignment) throw new DatabaseError('خطة الربط فقدت طالباً قبل الحفظ.');
          const enrollmentResult = await db.query<CurrentEnrollment>(
            `SELECT id, enrollment_number
               FROM public.enrollments
              WHERE tenant_id = $1
                AND school_id = $2
                AND (branch_id = $3 OR branch_id IS NULL)
                AND student_id = $4
                AND academic_year_id = $5
                AND enrollment_status IN ('pending', 'active')
                AND deleted_at IS NULL
              ORDER BY CASE enrollment_status WHEN 'active' THEN 0 ELSE 1 END, starts_on DESC, created_at DESC
              LIMIT 1
              FOR UPDATE`,
            [context.tenantId, context.schoolId, context.branchId, candidate.id, context.academicYear]
          );
          const enrollment = enrollmentResult.rows[0];
          if (enrollment) {
            await db.query(
              `UPDATE public.enrollments
                  SET class_reference = $1,
                      section_reference = $2,
                      admission_reference = COALESCE(NULLIF(btrim(admission_reference), ''), 'STUDENT-AFFAIRS-OPERATIONAL-ASSIGNMENT'),
                      admission_status = 'approved',
                      enrollment_status = 'active',
                      starts_on = $3,
                      version = version + 1,
                      updated_at = now(),
                      updated_by = $4,
                      audit_id = $5,
                      request_id = $6,
                      correlation_id = $7
                WHERE tenant_id = $8 AND id = $9`,
              [assignment.classReference, assignment.sectionReference, currentAcademicContext.starts_on, actorUserId, auditId, requestId, correlationId, context.tenantId, enrollment.id]
            );
            updatedEnrollmentCount += 1;
          } else {
            const enrollmentId = randomUUID();
            const enrollmentNumber = `ENR-OPR-${enrollmentId.slice(0, 8).toUpperCase()}`;
            await db.query(
              `INSERT INTO public.enrollments (
                 id, tenant_id, school_id, branch_id, student_id, academic_year_id, term_id,
                 enrollment_number, admission_reference, admission_status, enrollment_status,
                 starts_on, class_reference, section_reference, version, created_by, updated_by,
                 audit_id, request_id, correlation_id
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
                         'STUDENT-AFFAIRS-OPERATIONAL-ASSIGNMENT', 'approved', 'active',
                         $9, $10, $11, 1, $12, $12, $13, $14, $15)`,
              [enrollmentId, context.tenantId, context.schoolId, context.branchId, candidate.id, context.academicYear, currentAcademicContext.term_id, enrollmentNumber, currentAcademicContext.starts_on, assignment.classReference, assignment.sectionReference, actorUserId, auditId, requestId, correlationId]
            );
            createdEnrollmentCount += 1;
          }

          const academicStatusResult = await db.query<CurrentAcademicStatus>(
            `SELECT id, status
               FROM public.student_academic_status
              WHERE tenant_id = $1
                AND student_id = $2
                AND deleted_at IS NULL
              LIMIT 1
              FOR UPDATE`,
            [context.tenantId, candidate.id]
          );
          const academicStatus = academicStatusResult.rows[0];
          const fromStatus = cleanText(academicStatus?.status) || candidate.status;
          if (!academicStatus && fromStatus === 'active') {
            await db.query(
              `INSERT INTO public.student_academic_status (
                 id, tenant_id, school_id, branch_id, student_id, status, effective_on,
                 reason_code, reason_notes, approved_at, approved_by, version, created_by, updated_by,
                 audit_id, request_id, correlation_id
               ) VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, now(), $9, 1, $9, $9, $10, $11, $12)`,
              [randomUUID(), context.tenantId, context.schoolId, context.branchId, candidate.id, currentAcademicContext.starts_on, REASON_CODE, reason, actorUserId, auditId, requestId, correlationId]
            );
          } else if (fromStatus !== 'active') {
            const transitionId = randomUUID();
            if (academicStatus) {
              await db.query(
                `UPDATE public.student_academic_status
                    SET status = 'active', effective_on = $1, reason_code = $2, reason_notes = $3,
                        approved_at = now(), approved_by = $4, version = version + 1,
                        updated_at = now(), updated_by = $4, audit_id = $5, request_id = $6, correlation_id = $7
                  WHERE tenant_id = $8 AND id = $9`,
                [currentAcademicContext.starts_on, REASON_CODE, reason, actorUserId, auditId, requestId, correlationId, context.tenantId, academicStatus.id]
              );
            } else {
              await db.query(
                `INSERT INTO public.student_academic_status (
                   id, tenant_id, school_id, branch_id, student_id, status, effective_on,
                   reason_code, reason_notes, approved_at, approved_by, version, created_by, updated_by,
                   audit_id, request_id, correlation_id
                 ) VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, now(), $9, 1, $9, $9, $10, $11, $12)`,
                [randomUUID(), context.tenantId, context.schoolId, context.branchId, candidate.id, currentAcademicContext.starts_on, REASON_CODE, reason, actorUserId, auditId, requestId, correlationId]
              );
            }
            await db.query(
              `INSERT INTO public.student_status_transitions (
                 id, tenant_id, school_id, branch_id, student_id, from_status, to_status,
                 transition_kind, approval_status, effective_on, reason_code, reason_notes,
                 correction_reference, requested_at, approved_at, completed_at, requested_by, approved_by,
                 completed_by, idempotency_key, version, created_by, updated_by, audit_id, request_id, correlation_id
               ) VALUES ($1, $2, $3, $4, $5, $6, 'active', 'correction', 'completed', $7, $8, $9,
                         $10, now(), now(), now(), $11, $11, $11, $12, 1, $11, $11, $13, $14, $15)`,
              [transitionId, context.tenantId, context.schoolId, context.branchId, candidate.id, fromStatus, currentAcademicContext.starts_on, REASON_CODE, reason, CORRECTION_REFERENCE, actorUserId, `${idempotencyKey}:${candidate.id}`, auditId, requestId, correlationId]
            );
            await db.query(
              `INSERT INTO public.student_status_history (
                 id, tenant_id, school_id, branch_id, student_id, transition_id, from_status, to_status,
                 event_type, effective_on, reason_code, reason_notes, approved_at, approved_by,
                 recorded_by, status, version, created_by, updated_by, audit_id, request_id, correlation_id
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 'correction', $8, $9, $10, now(), $11,
                         $11, 'active', 1, $11, $11, $12, $13, $14)`,
              [randomUUID(), context.tenantId, context.schoolId, context.branchId, candidate.id, transitionId, fromStatus, currentAcademicContext.starts_on, REASON_CODE, reason, actorUserId, auditId, requestId, correlationId]
            );
          }
          if (candidate.status !== 'active') {
            await db.query(
              `UPDATE public.students
                  SET status = 'active', version = version + 1, updated_at = now(), updated_by = $1,
                      audit_id = $2, request_id = $3, correlation_id = $4
                WHERE tenant_id = $5 AND id = $6`,
              [actorUserId, auditId, requestId, correlationId, context.tenantId, candidate.id]
            );
            activatedStudentCount += 1;
          }
        }

        const distribution = [...new Map(plan.map(assignment => {
          const key = `${assignment.classReference}\u0000${assignment.sectionReference}`;
          return [key, assignment];
        })).values()].map(assignment => ({
          classReference: assignment.classReference,
          sectionReference: assignment.sectionReference,
          studentCount: plan.filter(candidate => candidate.classReference === assignment.classReference && candidate.sectionReference === assignment.sectionReference).length
        })).sort((left, right) => left.classReference.localeCompare(right.classReference, 'ar'));
        const result: OperationalEnrollmentRepairResult = {
          idempotent: false,
          processedCount: candidates.length,
          createdEnrollmentCount,
          updatedEnrollmentCount,
          activatedStudentCount,
          distribution,
          requestId,
          correlationId
        };
        const outboxPayload = { operation: OPERATION, reason, result };
        await db.query(
          `INSERT INTO public.outbox_events (
             id, tenant_id, event_type, aggregate_type, aggregate_id, event_version,
             payload, payload_hash, idempotency_key, status, retry_count, max_retries,
             request_id, correlation_id, created_by, updated_by, audit_id, version
           ) VALUES ($1, $2, $3, 'School', $4, 1, $5::jsonb, $6, $7,
                     'pending', 0, 10, $8, $9, $10, $10, $11, 1)`,
          [randomUUID(), context.tenantId, OPERATION, context.schoolId, JSON.stringify(outboxPayload), hashPayload(outboxPayload), idempotencyKey, requestId, correlationId, actorUserId, auditId]
        );
        return result;
      },
      context
    );
  }
}

export const operationalEnrollmentAssignmentService = new OperationalEnrollmentAssignmentService();
