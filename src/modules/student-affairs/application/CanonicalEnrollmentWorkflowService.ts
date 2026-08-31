import { createHash, randomUUID } from 'node:crypto';
import { UnitOfWork } from '../../../database/UnitOfWork.js';
import type { TransactionSession } from '../../../database/transactions/TransactionContracts.js';
import type { TenantContext } from '../../../tenant/TenantContext.js';
import { ConflictError, DatabaseError, ValidationError } from '../../../utils/errors.js';

type EnrollmentOperation = 'transfer' | 'promote' | 're_enroll';

type WorkflowRequest = {
  operation: unknown;
  studentIds: unknown;
  targetClassId?: unknown;
  targetGradeId?: unknown;
  targetSection?: unknown;
  reason?: unknown;
  idempotencyKey: unknown;
  ipAddress?: unknown;
};

export type CanonicalEnrollmentWorkflowResult = {
  idempotent: boolean;
  operation: EnrollmentOperation;
  processedCount: number;
  createdEnrollmentCount: number;
  updatedEnrollmentCount: number;
  unchangedCount: number;
  targetClassReference: string;
  targetSectionReference: string;
  academicYearId: string;
  termId: string;
  requestId: string;
  correlationId: string;
};

export type AcademicEnrollmentClass = { id: string; code: string; name: string; gradeId: string; capacity: number; isActive: boolean };

const OPERATION_TYPE = 'STUDENT_CANONICAL_ENROLLMENT_WORKFLOW';
const SOURCE = 'CanonicalEnrollmentWorkflowService';

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function transaction(): TransactionSession {
  const active = UnitOfWork.getActiveContext();
  if (!active?.isActive || !active.databaseTransaction) {
    throw new DatabaseError('عملية القيد تتطلب معاملة PostgreSQL نشطة.');
  }
  return active.databaseTransaction;
}

export function normalizeEnrollmentOperation(value: unknown): EnrollmentOperation {
  const operation = clean(value) as EnrollmentOperation;
  if (!['transfer', 'promote', 're_enroll'].includes(operation)) {
    throw new ValidationError('نوع عملية القيد غير مدعوم.');
  }
  return operation;
}

function normalizeStudentIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 200) {
    throw new ValidationError('يجب تحديد طالب واحد إلى 200 طالب للعملية الذرية.');
  }
  const ids = [...new Set(value.map(clean))];
  if (ids.length !== value.length || ids.some(id => !isUuid(id))) {
    throw new ValidationError('توجد معرفات طلاب مكررة أو غير صالحة.');
  }
  return ids;
}

function normalizeIdempotency(value: unknown): string {
  const key = clean(value);
  if (!key || key.length > 180) throw new ValidationError('مفتاح منع التكرار مطلوب وبحد أقصى 180 حرفاً.');
  return key;
}

function normalizeReason(value: unknown, operation: EnrollmentOperation): string {
  const reason = clean(value) || (operation === 'promote' ? 'ترقية أكاديمية موثقة' : operation === 're_enroll' ? 'إعادة قيد موثقة' : 'نقل أكاديمي موثق');
  if (reason.length < 5 || reason.length > 500) throw new ValidationError('سبب العملية يجب أن يكون بين 5 و500 حرف.');
  return reason;
}

function normalizeStructure(value: unknown): { classes: AcademicEnrollmentClass[]; sections: Set<string> } {
  const structure = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const sections = new Set((Array.isArray(structure.sections) ? structure.sections : []).map(clean).filter(Boolean));
  const classes = (Array.isArray(structure.classes) ? structure.classes : []).map(item => {
    const row = item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : {};
    return {
      id: clean(row.id),
      code: clean(row.code).toUpperCase(),
      name: clean(row.name),
      gradeId: clean(row.gradeId || row.grade_id),
      capacity: Number(row.capacity),
      isActive: row.isActive !== false
    };
  }).filter(item => item.isActive && item.id && item.code && item.name && item.gradeId && Number.isSafeInteger(item.capacity) && item.capacity > 0);
  if (!classes.length) throw new ValidationError('لا توجد فصول نشطة وسليمة في الهيكل الأكاديمي الموثوق.');
  if (!sections.size) throw new ValidationError('لا توجد شعب فعالة في الهيكل الأكاديمي الموثوق.');
  return { classes, sections };
}

function sectionFromClassCode(code: string): string | null {
  const suffix = code.match(/-([A-Z])$/i)?.[1]?.toUpperCase();
  return suffix === 'A' ? 'أ' : suffix === 'B' ? 'ب' : suffix === 'C' ? 'ج' : suffix === 'D' ? 'د' : null;
}

export function resolveTargetEnrollmentClass(classes: AcademicEnrollmentClass[], sections: Set<string>, targetClassId: string, targetGradeId: string, targetSection: string): AcademicEnrollmentClass {
  if (!sections.has(targetSection)) throw new ValidationError('الشعبة المستهدفة غير موجودة في الهيكل الأكاديمي الموثوق.');
  const candidates = classes.filter(item => item.isActive && item.gradeId === targetGradeId);
  if (!candidates.length) throw new ValidationError('الصف المستهدف غير موجود في الهيكل الأكاديمي الموثوق.');
  const byId = targetClassId ? candidates.find(item => item.id === targetClassId || item.code === targetClassId || item.name === targetClassId) : undefined;
  const bySection = candidates.find(item => sectionFromClassCode(item.code) === targetSection);
  const selected = byId || bySection || candidates[0];
  if (!selected) throw new ValidationError('الفصل المستهدف غير موجود في الهيكل الأكاديمي الموثوق.');
  const encodedSection = sectionFromClassCode(selected.code);
  if (encodedSection && encodedSection !== targetSection) throw new ValidationError('الفصل المستهدف لا يطابق الشعبة المختارة.');
  return selected;
}

function payloadHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function resultFromPayload(payload: unknown): CanonicalEnrollmentWorkflowResult {
  if (!payload || typeof payload !== 'object' || !('result' in payload)) throw new ConflictError('نتيجة العملية السابقة غير صالحة. استخدم مفتاحاً جديداً.');
  const result = (payload as { result?: unknown }).result;
  if (!result || typeof result !== 'object') throw new ConflictError('نتيجة العملية السابقة غير مكتملة. استخدم مفتاحاً جديداً.');
  return { ...(result as CanonicalEnrollmentWorkflowResult), idempotent: true };
}

export class CanonicalEnrollmentWorkflowService {
  async execute(context: TenantContext, request: WorkflowRequest): Promise<CanonicalEnrollmentWorkflowResult> {
    const operation = normalizeEnrollmentOperation(request.operation);
    const studentIds = normalizeStudentIds(request.studentIds);
    const idempotencyKey = normalizeIdempotency(request.idempotencyKey);
    const reason = normalizeReason(request.reason, operation);
    const targetGradeId = clean(request.targetGradeId);
    const targetSection = clean(request.targetSection);
    const targetClassId = clean(request.targetClassId);
    if (!targetGradeId || !targetSection) throw new ValidationError('الصف والشعبة المستهدفان مطلوبان من الهيكل الأكاديمي الموثوق.');
    if (!context.tenantId || !context.schoolId || !context.branchId || !context.academicYear || !context.userId) {
      throw new ValidationError('سياق المدرسة الموثوق غير مكتمل.');
    }
    if (!UnitOfWork.hasTransactionDriver()) throw new DatabaseError('محرك معاملات PostgreSQL غير متاح لعملية القيد.');

    const requestId = randomUUID();
    const correlationId = randomUUID();
    return UnitOfWork.runInTransaction(context.schoolId, {
      operationName: `Canonical student ${operation}`,
      tenantId: context.tenantId,
      userId: context.userId,
      userName: context.userId,
      ipAddress: clean(request.ipAddress) || 'unknown',
      affectedTables: ['students', 'enrollments', 'enrollment_history', 'audit_events', 'outbox_events']
    }, async () => {
      const db = transaction();
      const prior = await db.query<{ payload: unknown; event_type: string }>(
        `SELECT payload, event_type FROM public.outbox_events WHERE tenant_id = $1 AND idempotency_key = $2 AND deleted_at IS NULL LIMIT 1`,
        [context.tenantId, idempotencyKey]
      );
      if (prior.rows[0]) {
        if (prior.rows[0].event_type !== OPERATION_TYPE) throw new ConflictError('مفتاح منع التكرار مستخدم لعملية مختلفة.');
        return resultFromPayload(prior.rows[0].payload);
      }

      const actor = await db.query<{ id: string }>(
        `SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
        [context.tenantId, context.userId]
      );
      const actorId = actor.rows[0]?.id;
      if (!actorId) throw new ValidationError('المستخدم الحالي غير مهيأ كسجل مؤسسي نشط.');

      const academic = await db.query<{ academic_year_id: string; term_id: string; starts_on: string; structure: unknown }>(
        `SELECT y.id AS academic_year_id, t.id AS term_id, y.starts_on::text, settings.setting_value AS structure
           FROM public.academic_years y
           JOIN public.terms t ON t.tenant_id = y.tenant_id AND t.school_id = y.school_id
            AND t.academic_year_id = y.id AND (t.branch_id = $3 OR t.branch_id IS NULL)
            AND t.status = 'active' AND t.deleted_at IS NULL
           JOIN LATERAL (
             SELECT setting_value FROM public.school_settings
              WHERE tenant_id = y.tenant_id AND school_id = y.school_id AND setting_key = 'academic_structure'
                AND status = 'active' AND deleted_at IS NULL
              ORDER BY effective_from DESC, created_at DESC LIMIT 1
           ) settings ON true
          WHERE y.tenant_id = $1 AND y.school_id = $2 AND y.id = $4 AND y.status = 'active'
            AND y.is_current = true AND y.deleted_at IS NULL
          ORDER BY t.sequence DESC, t.starts_on DESC LIMIT 1`,
        [context.tenantId, context.schoolId, context.branchId, context.academicYear]
      );
      const currentAcademic = academic.rows[0];
      if (!currentAcademic) throw new ValidationError('لا توجد سنة وفصل دراسي نشطان للعملية.');
      const { classes, sections } = normalizeStructure(currentAcademic.structure);
      const target = resolveTargetEnrollmentClass(classes, sections, targetClassId, targetGradeId, targetSection);

      const students = await db.query<{ id: string; status: string }>(
        `SELECT id, status FROM public.students
          WHERE tenant_id = $1 AND school_id = $2 AND (branch_id = $3 OR branch_id IS NULL)
            AND id = ANY($4::uuid[]) AND deleted_at IS NULL FOR UPDATE`,
        [context.tenantId, context.schoolId, context.branchId, studentIds]
      );
      if (students.rows.length !== studentIds.length) throw new ValidationError('يوجد طالب غير متاح داخل نطاق المدرسة الموثوق.');
      if (students.rows.some(student => !['active', 'applicant', 'admitted', 'suspended'].includes(student.status))) {
        throw new ValidationError('لا يمكن نقل أو ترقية طالب في حالة دورة حياة غير قابلة للتشغيل.');
      }

      const occupancy = await db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM public.enrollments
          WHERE tenant_id = $1 AND school_id = $2 AND (branch_id = $3 OR branch_id IS NULL)
            AND academic_year_id = $4 AND class_reference = $5 AND section_reference = $6
            AND enrollment_status IN ('pending', 'active') AND deleted_at IS NULL AND NOT (student_id = ANY($7::uuid[]))`,
        [context.tenantId, context.schoolId, context.branchId, currentAcademic.academic_year_id, target.name, targetSection, studentIds]
      );
      const occupied = Number(occupancy.rows[0]?.count || 0);
      if (occupied + studentIds.length > target.capacity) throw new ValidationError(`السعة المعتمدة للفصل ${target.name} لا تكفي للعملية.`);

      let createdEnrollmentCount = 0;
      let updatedEnrollmentCount = 0;
      let unchangedCount = 0;
      for (const student of students.rows) {
        const currentResult = await db.query<{ id: string; enrollment_status: string; class_reference: string | null; section_reference: string | null; version: number; enrollment_number: string }>(
          `SELECT id, enrollment_status, class_reference, section_reference, version, enrollment_number
             FROM public.enrollments
            WHERE tenant_id = $1 AND school_id = $2 AND (branch_id = $3 OR branch_id IS NULL)
              AND student_id = $4 AND academic_year_id = $5 AND enrollment_status IN ('pending', 'active') AND deleted_at IS NULL
            ORDER BY CASE enrollment_status WHEN 'active' THEN 0 ELSE 1 END, starts_on DESC, created_at DESC LIMIT 1 FOR UPDATE`,
          [context.tenantId, context.schoolId, context.branchId, student.id, currentAcademic.academic_year_id]
        );
        const current = currentResult.rows[0];
        const auditId = randomUUID();
        const studentRequestId = randomUUID();
        const studentCorrelationId = randomUUID();
        await db.query(
          `INSERT INTO public.audit_events (id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata, request_id, correlation_id)
           VALUES ($1, $2, $3, $4, $5, 'student_enrollment', $6, $7, $8, $9, 'success', $10::jsonb, $11, $12)`,
          [auditId, context.tenantId, context.schoolId, context.branchId, actorId, student.id, operation, SOURCE, reason,
            JSON.stringify({ operation, targetClassReference: target.name, targetSectionReference: targetSection, targetGradeId }), studentRequestId, studentCorrelationId]
        );

        let enrollmentId: string;
        let fromStatus = 'pending';
        let toStatus = 'active';
        if (current) {
          enrollmentId = current.id;
          fromStatus = current.enrollment_status;
          toStatus = current.enrollment_status;
          if (current.class_reference === target.name && current.section_reference === targetSection && current.enrollment_status === 'active') {
            unchangedCount += 1;
          } else {
            const updated = await db.query<{ id: string }>(
              `UPDATE public.enrollments SET class_reference = $1, section_reference = $2, admission_status = 'approved',
                 admission_reference = COALESCE(NULLIF(btrim(admission_reference), ''), $3), enrollment_status = 'active',
                 version = version + 1, updated_at = now(), updated_by = $4, audit_id = $5, request_id = $6, correlation_id = $7
               WHERE id = $8 AND tenant_id = $9 AND school_id = $10 AND version = $11 RETURNING id`,
              [target.name, targetSection, `STUDENT-AFFAIRS-${operation.toUpperCase()}`, actorId, auditId, studentRequestId, studentCorrelationId, current.id, context.tenantId, context.schoolId, current.version]
            );
            if (!updated.rows[0]) throw new ConflictError('تغير قيد الطالب أثناء العملية؛ تم التراجع عن العملية كاملة.');
            updatedEnrollmentCount += 1;
          }
        } else {
          enrollmentId = randomUUID();
          const enrollmentNumber = `ENR-${new Date().getUTCFullYear()}-${enrollmentId.slice(0, 8).toUpperCase()}`;
          await db.query(
            `INSERT INTO public.enrollments (id, tenant_id, school_id, branch_id, student_id, academic_year_id, term_id, enrollment_number,
                admission_reference, admission_status, enrollment_status, starts_on, class_reference, section_reference, version,
                created_by, updated_by, audit_id, request_id, correlation_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved', 'active', $10::date, $11, $12, 1, $13, $13, $14, $15, $16)`,
            [enrollmentId, context.tenantId, context.schoolId, context.branchId, student.id, currentAcademic.academic_year_id, currentAcademic.term_id,
              enrollmentNumber, `STUDENT-AFFAIRS-${operation.toUpperCase()}`, currentAcademic.starts_on, target.name, targetSection, actorId, auditId, studentRequestId, studentCorrelationId]
          );
          createdEnrollmentCount += 1;
        }

        await db.query(
          `INSERT INTO public.enrollment_history (id, tenant_id, school_id, branch_id, student_id, enrollment_id, event_type, from_status, to_status,
             effective_on, reason_code, reason_notes, approved_at, approved_by, recorded_by, created_by, updated_by, audit_id, request_id, correlation_id)
           VALUES ($1, $2, $3, $4, $5, $6, 'amended', $7, $8, CURRENT_DATE, $9, $10, now(), $11, $11, $11, $11, $12, $13, $14)`,
          [randomUUID(), context.tenantId, context.schoolId, context.branchId, student.id, enrollmentId, fromStatus, toStatus, `student_${operation}`, reason, actorId, auditId, studentRequestId, studentCorrelationId]
        );
      }

      const result: CanonicalEnrollmentWorkflowResult = {
        idempotent: false, operation, processedCount: students.rows.length, createdEnrollmentCount,
        updatedEnrollmentCount, unchangedCount, targetClassReference: target.name, targetSectionReference: targetSection,
        academicYearId: currentAcademic.academic_year_id, termId: currentAcademic.term_id, requestId, correlationId
      };
      const payload = { operation: OPERATION_TYPE, reason, result };
      await db.query(
        `INSERT INTO public.outbox_events (id, tenant_id, event_type, aggregate_type, aggregate_id, event_version, payload, payload_hash,
           idempotency_key, status, retry_count, max_retries, request_id, correlation_id, created_by, updated_by, audit_id, version)
         VALUES ($1, $2, $3, 'School', $4, 1, $5::jsonb, $6, $7, 'pending', 0, 10, $8, $9, $10, $10, NULL, 1)`,
        [randomUUID(), context.tenantId, OPERATION_TYPE, context.schoolId, JSON.stringify(payload), payloadHash(payload), idempotencyKey, requestId, correlationId, actorId]
      );
      return result;
    }, context);
  }
}

export const canonicalEnrollmentWorkflowService = new CanonicalEnrollmentWorkflowService();
