import { randomUUID } from 'node:crypto';
import { UnitOfWork } from '../../../database/UnitOfWork.js';
import type { TenantContext } from '../../../tenant/TenantContext.js';
import { ConflictError, DatabaseError, ValidationError } from '../../../utils/errors.js';

export type GraduationRequestContext = TenantContext & {
  requestId: string;
  correlationId: string;
  ipAddress: string;
};

export type GraduationInput = {
  studentId: string;
  reason: string;
  idempotencyKey: string;
  resultArchiveId?: string;
};

type GraduationEvidence = {
  enrollment_id: string;
  academic_year_id: string;
  term_id: string;
  academic_year_code: string;
  academic_year_name: string;
  enrollment_version: number;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CanonicalGraduationService {
  async execute(context: GraduationRequestContext, input: GraduationInput) {
    if (!uuidPattern.test(input.studentId)) throw new ValidationError('معرّف الطالب غير صالح.');
    if (input.resultArchiveId && !uuidPattern.test(input.resultArchiveId)) throw new ValidationError('معرّف أرشيف النتائج غير صالح.');
    const reason = String(input.reason || '').trim();
    if (reason.length < 3 || reason.length > 1000) throw new ValidationError('سبب اعتماد التخرج مطلوب وبحد أقصى 1000 حرف.');
    const suppliedKey = String(input.idempotencyKey || '').trim();
    if (!/^[\x21-\x7e]{1,200}$/.test(suppliedKey)) throw new ValidationError('Idempotency-Key صالح مطلوب لاعتماد التخرج.');
    const idempotencyKey = `student-graduate:${input.studentId}:${suppliedKey}`;

    try {
      return await UnitOfWork.runInTransaction(
        context.schoolId,
        {
          operationName: 'STU-GRAD-001 approve canonical graduation',
          userId: context.userId,
          userName: context.userId,
          ipAddress: context.ipAddress,
          affectedTables: ['student_graduation_records', 'enrollments', 'enrollment_history', 'students', 'student_academic_status', 'student_status_transitions', 'student_status_history', 'audit_events', 'outbox_events'],
          tenantId: context.tenantId
        },
        async () => {
          const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
          if (!transaction) throw new DatabaseError('معاملة التخرج الكانونية غير متاحة.');

          const existing = await transaction.query<any>(
            `SELECT id, student_id, enrollment_id, result_archive_id, academic_year, semester,
                    result_percentage, grade_symbol, cohort_rank, approved_at
               FROM public.student_graduation_records
              WHERE tenant_id = $1::uuid AND idempotency_key = $2
              LIMIT 1`,
            [context.tenantId, idempotencyKey]
          );
          if (existing.rows[0]) return { ...existing.rows[0], idempotent: true };

          const actor = await transaction.query<{ id: string }>(
            `SELECT id FROM public.users
              WHERE tenant_id = $1::uuid
                AND (id = $2::uuid OR auth_user_id = $2::uuid)
                AND school_id = $3::uuid
                AND (branch_id IS NULL OR branch_id = $4::uuid)
                AND status = 'active' AND deleted_at IS NULL
              LIMIT 1`,
            [context.tenantId, context.userId, context.schoolId, context.branchId]
          );
          const actorId = actor.rows[0]?.id;
          if (!actorId) throw new DatabaseError('مرجع المستخدم المخول لاعتماد التخرج غير متاح.');

          const enrollment = await transaction.query<GraduationEvidence>(
            `SELECT e.id AS enrollment_id, e.academic_year_id, e.term_id,
                    y.code AS academic_year_code, y.name AS academic_year_name,
                    e.version AS enrollment_version
               FROM public.enrollments e
               JOIN public.students s
                 ON s.tenant_id = e.tenant_id AND s.school_id = e.school_id AND s.id = e.student_id
               JOIN public.academic_years y
                 ON y.tenant_id = e.tenant_id AND y.school_id = e.school_id AND y.id = e.academic_year_id
              WHERE e.tenant_id = $1::uuid AND e.school_id = $2::uuid
                AND e.student_id = $3::uuid
                AND (e.branch_id IS NULL OR e.branch_id = $4::uuid)
                AND (s.branch_id IS NULL OR s.branch_id = $4::uuid)
                AND e.enrollment_status = 'active'
                AND e.deleted_at IS NULL AND s.deleted_at IS NULL AND y.deleted_at IS NULL
              ORDER BY e.starts_on DESC
              LIMIT 1
              FOR UPDATE OF e, s`,
            [context.tenantId, context.schoolId, input.studentId, context.branchId]
          );
          const evidence = enrollment.rows[0];
          if (!evidence) throw new ConflictError('لا يمكن التخرج دون قيد دراسي نشط داخل المدرسة الحالية.');

          const academicStatus = await transaction.query<{ id: string; version: number }>(
            `SELECT id, version FROM public.student_academic_status
              WHERE tenant_id = $1::uuid AND school_id = $2::uuid AND student_id = $3::uuid
                AND (branch_id IS NULL OR branch_id = $4::uuid)
                AND status = 'active' AND deleted_at IS NULL
              LIMIT 1 FOR UPDATE`,
            [context.tenantId, context.schoolId, input.studentId, context.branchId]
          );
          if (!academicStatus.rows[0]) throw new ConflictError('الحالة الأكاديمية الحالية للطالب ليست نشطة ولا تسمح بالتخرج.');

          const archive = await transaction.query<any>(
            `SELECT a.id, a.academic_year, a.semester,
                    (result.item->>'percentage')::numeric AS result_percentage,
                    result.item->>'gradeSymbol' AS grade_symbol,
                    NULLIF(result.item->>'rank', '')::integer AS cohort_rank
               FROM public.exams_result_archives a
               CROSS JOIN LATERAL jsonb_array_elements(COALESCE(a.payload->'calculatedResults', '[]'::jsonb)) AS result(item)
              WHERE a.tenant_id = $1::uuid AND a.school_id = $2::uuid
                AND result.item->>'studentId' = $3
                AND result.item->>'status' = 'passed'
                AND COALESCE((a.payload->'approvalStatus'->>'approved')::boolean, false) = true
                AND a.academic_year IN ($4, $5)
                AND ($6::uuid IS NULL OR a.id = $6::uuid)
              ORDER BY a.created_at DESC
              LIMIT 1`,
            [context.tenantId, context.schoolId, input.studentId, evidence.academic_year_code, evidence.academic_year_name, input.resultArchiveId || null]
          );
          const result = archive.rows[0];
          if (!result) throw new ConflictError('لا توجد نتيجة نهائية ناجحة ومقفلة لنفس الطالب والسنة الدراسية.');

          const balance = await transaction.query<{ outstanding: string }>(
            `SELECT COALESCE(SUM(remaining_amount), 0)::text AS outstanding
               FROM public.student_fee_invoices
              WHERE tenant_id = $1::uuid AND school_id = $2::uuid
                AND student_id = $3
                AND remaining_amount > 0
                AND lower(status) NOT IN ('cancelled', 'void', 'written_off')`,
            [context.tenantId, context.schoolId, input.studentId]
          );
          if (Number(balance.rows[0]?.outstanding || 0) > 0) throw new ConflictError('لا يمكن اعتماد التخرج قبل إتمام المخالصة المالية للطالب.');

          const graduationId = randomUUID();
          const transitionId = randomUUID();
          const auditId = randomUUID();
          const now = new Date().toISOString();
          const today = now.slice(0, 10);
          const metadata = JSON.stringify({
            graduationId,
            studentId: input.studentId,
            enrollmentId: evidence.enrollment_id,
            resultArchiveId: result.id,
            academicYear: result.academic_year,
            financialClearance: true
          });

          await transaction.query(
            `INSERT INTO public.audit_events
              (id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id,
               action, source, reason, result, metadata, request_id, correlation_id)
             VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'student_graduation',
                     $6::uuid, 'APPROVE', 'CanonicalGraduationService', $7, 'success', $8::jsonb,
                     $9::uuid, $10::uuid)`,
            [auditId, context.tenantId, context.schoolId, context.branchId, actorId, graduationId, reason, metadata, context.requestId, context.correlationId]
          );

          await transaction.query(
            `INSERT INTO public.student_graduation_records
              (id, tenant_id, school_id, branch_id, student_id, enrollment_id, result_archive_id,
               academic_year, semester, result_percentage, grade_symbol, cohort_rank,
               approval_reason, approved_at, approved_by, idempotency_key, created_by,
               audit_id, request_id, correlation_id)
             VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7::uuid,
                     $8, $9, $10, $11, $12, $13, $14::timestamptz, $15::uuid, $16,
                     $15::uuid, $17::uuid, $18::uuid, $19::uuid)`,
            [graduationId, context.tenantId, context.schoolId, context.branchId, input.studentId,
              evidence.enrollment_id, result.id, result.academic_year, result.semester,
              result.result_percentage, result.grade_symbol, result.cohort_rank, reason, now,
              actorId, idempotencyKey, auditId, context.requestId, context.correlationId]
          );

          await transaction.query(
            `INSERT INTO public.student_status_transitions
              (id, tenant_id, school_id, branch_id, student_id, from_status, to_status,
               transition_kind, approval_status, effective_on, reason_code, reason_notes,
               requested_at, approved_at, completed_at, requested_by, approved_by, completed_by,
               idempotency_key, created_by, updated_by, audit_id, request_id, correlation_id)
             VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'active', 'graduated',
                     'ordinary', 'completed', $6::date, 'GRADUATION_APPROVED', $7,
                     $8::timestamptz, $8::timestamptz, $8::timestamptz, $9::uuid, $9::uuid, $9::uuid,
                     $10, $9::uuid, $9::uuid, $11::uuid, $12::uuid, $13::uuid)`,
            [transitionId, context.tenantId, context.schoolId, context.branchId, input.studentId, today, reason, now, actorId, idempotencyKey, auditId, context.requestId, context.correlationId]
          );

          await transaction.query(
            `INSERT INTO public.student_status_history
              (id, tenant_id, school_id, branch_id, student_id, transition_id, from_status, to_status,
               event_type, effective_on, reason_code, reason_notes, approved_at, approved_by,
               recorded_by, created_by, updated_by, audit_id, request_id, correlation_id)
             VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, 'active', 'graduated',
                     'ordinary', $7::date, 'GRADUATION_APPROVED', $8, $9::timestamptz, $10::uuid,
                     $10::uuid, $10::uuid, $10::uuid, $11::uuid, $12::uuid, $13::uuid)`,
            [randomUUID(), context.tenantId, context.schoolId, context.branchId, input.studentId, transitionId, today, reason, now, actorId, auditId, context.requestId, context.correlationId]
          );

          await transaction.query(
            `INSERT INTO public.enrollment_history
              (id, tenant_id, school_id, branch_id, student_id, academic_year_id, term_id,
               enrollment_id, event_type, from_status, to_status, effective_on, reason_code,
               reason_notes, recorded_by, created_by, updated_by, audit_id, request_id, correlation_id)
             VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7::uuid,
                     $8::uuid, 'completed', 'active', 'completed', $9::date, 'GRADUATION_APPROVED',
                     $10, $11::uuid, $11::uuid, $11::uuid, $12::uuid, $13::uuid, $14::uuid)`,
            [randomUUID(), context.tenantId, context.schoolId, context.branchId, input.studentId,
              evidence.academic_year_id, evidence.term_id, evidence.enrollment_id, today, reason,
              actorId, auditId, context.requestId, context.correlationId]
          );

          const enrollmentUpdate = await transaction.query(
            `UPDATE public.enrollments
                SET enrollment_status = 'completed',
                    ends_on = GREATEST($5::date, starts_on + 1),
                    completion_reason = $6,
                    version = version + 1, updated_at = now(), updated_by = $7::uuid,
                    audit_id = $8::uuid, request_id = $9::uuid, correlation_id = $10::uuid
              WHERE tenant_id = $1::uuid AND school_id = $2::uuid AND id = $3::uuid
                AND student_id = $4::uuid AND enrollment_status = 'active' AND version = $11`,
            [context.tenantId, context.schoolId, evidence.enrollment_id, input.studentId, today,
              'GRADUATION_APPROVED: ' + reason, actorId, auditId, context.requestId,
              context.correlationId, evidence.enrollment_version]
          );
          if (enrollmentUpdate.rowCount !== 1) throw new ConflictError('تغير القيد أثناء اعتماد التخرج؛ أعد تحميل البيانات.');

          await transaction.query(
            `UPDATE public.student_academic_status
                SET status = 'graduated', effective_on = $5::date, reason_code = 'GRADUATION_APPROVED',
                    reason_notes = $6, approved_at = $7::timestamptz, approved_by = $8::uuid,
                    version = version + 1, updated_at = now(), updated_by = $8::uuid,
                    audit_id = $9::uuid, request_id = $10::uuid, correlation_id = $11::uuid
              WHERE tenant_id = $1::uuid AND school_id = $2::uuid AND student_id = $3::uuid
                AND (branch_id IS NULL OR branch_id = $4::uuid) AND status = 'active'`,
            [context.tenantId, context.schoolId, input.studentId, context.branchId, today, reason, now, actorId, auditId, context.requestId, context.correlationId]
          );

          await transaction.query(
            `UPDATE public.students
                SET status = 'graduated', version = version + 1, updated_at = now(), updated_by = $5::uuid,
                    audit_id = $6::uuid, request_id = $7::uuid, correlation_id = $8::uuid
              WHERE tenant_id = $1::uuid AND school_id = $2::uuid AND id = $3::uuid
                AND (branch_id IS NULL OR branch_id = $4::uuid) AND status = 'active'`,
            [context.tenantId, context.schoolId, input.studentId, context.branchId, actorId, auditId, context.requestId, context.correlationId]
          );

          const response = {
            graduationId,
            studentId: input.studentId,
            enrollmentId: evidence.enrollment_id,
            resultArchiveId: result.id,
            academicYear: result.academic_year,
            semester: result.semester,
            resultPercentage: Number(result.result_percentage),
            gradeSymbol: result.grade_symbol,
            cohortRank: result.cohort_rank,
            approvedAt: now,
            idempotent: false
          };
          await transaction.query(
            `INSERT INTO public.outbox_events
              (id, tenant_id, event_type, aggregate_type, aggregate_id, event_version, payload,
               payload_hash, idempotency_key, status, request_id, correlation_id, created_by, updated_by, audit_id)
             VALUES ($1::uuid, $2::uuid, 'Student.Graduated', 'student_graduation', $3::uuid, 1,
                     $4::jsonb, encode(digest($4, 'sha256'), 'hex'), $5, 'pending', $6::uuid,
                     $7::uuid, $8::uuid, $8::uuid, $9::uuid)`,
            [randomUUID(), context.tenantId, graduationId, JSON.stringify(response), idempotencyKey,
              context.requestId, context.correlationId, actorId, auditId]
          );
          return response;
        },
        context
      );
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof DatabaseError) throw error;
      throw new DatabaseError('فشل اعتماد التخرج الكانوني.', error instanceof Error ? error.message : error);
    }
  }
}

export const canonicalGraduationService = new CanonicalGraduationService();
