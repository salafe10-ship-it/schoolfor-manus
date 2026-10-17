import { createHash, createHmac, randomUUID } from 'node:crypto';
import { UnitOfWork } from '../../../database/UnitOfWork.js';
import type { TenantContext } from '../../../tenant/TenantContext.js';
import { ConflictError, DatabaseError, ValidationError } from '../../../utils/errors.js';

export type EnrollmentCertificateRequestContext = TenantContext & {
  requestId: string;
  correlationId: string;
  ipAddress: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function signingSecret(): string {
  const value = String(process.env.STUDENT_CERTIFICATE_SIGNING_SECRET || '').trim();
  if (value.length < 32) throw new DatabaseError('توقيع شهادات القيد غير مهيأ؛ يلزم سر شهادات مخصص لا يقل عن 32 حرفًا.');
  return value;
}

function academicPlacement(structure: unknown, classReference: string | null): Record<string, string> {
  const root = structure && typeof structure === 'object' && !Array.isArray(structure) ? structure as Record<string, unknown> : {};
  const classes = Array.isArray(root.classes) ? root.classes : [];
  const grades = Array.isArray(root.grades) ? root.grades : [];
  const stages = Array.isArray(root.stages) ? root.stages : [];
  const classRow = classes.find((value) => {
    const row = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return [row.id, row.code, row.name].some(candidate => String(candidate || '').trim() === String(classReference || '').trim());
  }) as Record<string, unknown> | undefined;
  const gradeRow = grades.find((value) => String((value as any)?.id || '') === String(classRow?.gradeId || '')) as Record<string, unknown> | undefined;
  const stageRow = stages.find((value) => String((value as any)?.id || '') === String(gradeRow?.stageId || '')) as Record<string, unknown> | undefined;
  return {
    stageId: String(stageRow?.id || ''), stageName: String(stageRow?.name || stageRow?.code || ''),
    gradeId: String(gradeRow?.id || ''), gradeName: String(gradeRow?.name || gradeRow?.code || ''),
    classId: String(classRow?.id || ''), className: String(classRow?.name || classRow?.code || classReference || '')
  };
}

export class CanonicalEnrollmentCertificateService {
  async issue(context: EnrollmentCertificateRequestContext, studentId: string, idempotencyKey: string, reason: string) {
    if (!UUID.test(studentId)) throw new ValidationError('معرّف الطالب غير صالح.');
    if (!/^[\x21-\x7e]{1,200}$/.test(idempotencyKey)) throw new ValidationError('مفتاح منع التكرار للشهادة مطلوب.');
    if (String(reason || '').trim().length < 3) throw new ValidationError('سبب إصدار شهادة القيد مطلوب.');
    const key = `student-enrollment-certificate:${studentId}:${idempotencyKey}`;
    const secret = signingSecret();

    return UnitOfWork.runInTransaction(context.schoolId, {
      operationName: 'STU-CERT-001 issue signed enrollment certificate',
      tenantId: context.tenantId, userId: context.userId, userName: context.userId,
      ipAddress: context.ipAddress, affectedTables: ['student_enrollment_certificates', 'audit_events'],
    }, async () => {
      const db = UnitOfWork.getActiveContext()?.databaseTransaction;
      if (!db) throw new DatabaseError('معاملة شهادة القيد غير متاحة.');
      const prior = await db.query<any>(
        `SELECT id, certificate_number, certificate_reference, certificate_payload,
                payload_hash, signature_algorithm, signature, status, issued_at
           FROM public.student_enrollment_certificates
          WHERE tenant_id = $1::uuid AND idempotency_key = $2 LIMIT 1`, [context.tenantId, key]);
      if (prior.rows[0]) return { ...prior.rows[0], idempotent: true, signed: true, signatureStatus: 'approved' };

      const actor = await db.query<{ id: string }>(
        `SELECT id FROM public.users WHERE tenant_id = $1::uuid
          AND (id = $2::uuid OR auth_user_id = $2::uuid)
          AND school_id = $3::uuid AND (branch_id IS NULL OR branch_id = $4::uuid)
          AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
        [context.tenantId, context.userId, context.schoolId, context.branchId]);
      const actorId = actor.rows[0]?.id;
      if (!actorId) throw new DatabaseError('المستخدم الحالي غير مهيأ كسجل مؤسسي نشط.');

      const source = await db.query<any>(
        `SELECT s.id, s.student_number, s.date_of_birth::text AS date_of_birth,
                s.status, concat_ws(' ', s.legal_first_name, s.legal_middle_name, s.legal_last_name) AS student_name,
                e.id AS enrollment_id, e.class_reference, e.section_reference,
                e.academic_year_id, COALESCE(y.name, y.code) AS academic_year_name,
                sc.legal_name AS school_legal_name, sc.display_name AS school_display_name,
                settings.setting_value AS academic_structure
           FROM public.students s
           JOIN public.schools sc ON sc.tenant_id = s.tenant_id AND sc.id = s.school_id
           JOIN LATERAL (
             SELECT e.* FROM public.enrollments e
              WHERE e.tenant_id = s.tenant_id AND e.school_id = s.school_id AND e.student_id = s.id
                AND (e.branch_id = s.branch_id OR e.branch_id IS NULL)
                AND e.enrollment_status IN ('pending', 'active') AND e.deleted_at IS NULL
              ORDER BY e.starts_on DESC, e.created_at DESC LIMIT 1
           ) e ON true
           LEFT JOIN public.academic_years y ON y.tenant_id = e.tenant_id AND y.school_id = e.school_id AND y.id = e.academic_year_id
           LEFT JOIN LATERAL (
             SELECT setting_value FROM public.school_settings
              WHERE tenant_id = s.tenant_id AND school_id = s.school_id
                AND setting_key = 'academic_structure' AND status = 'active' AND deleted_at IS NULL
              ORDER BY effective_from DESC, version DESC LIMIT 1
           ) settings ON true
          WHERE s.tenant_id = $1::uuid AND s.school_id = $2::uuid AND s.id = $3::uuid
            AND (s.branch_id = $4::uuid OR s.branch_id IS NULL) AND s.deleted_at IS NULL`,
        [context.tenantId, context.schoolId, studentId, context.branchId]);
      const row = source.rows[0];
      if (!row) throw new ConflictError('الطالب غير موجود في نطاق المدرسة الموثوق.');
      if (!row.enrollment_id) throw new ConflictError('لا يمكن إصدار شهادة قيد دون قيد دراسي كانوني.');

      const placement = academicPlacement(row.academic_structure, row.class_reference);
      const certificateId = randomUUID();
      const issuedAt = new Date().toISOString();
      const certificateReference = `CERT-${createHash('sha256').update(`${context.schoolId}:${studentId}:${row.enrollment_id}:${issuedAt}`).digest('hex').slice(0, 20).toUpperCase()}`;
      const certificateNumber = `ENR-${new Date(issuedAt).getUTCFullYear()}-${String(row.student_number)}-${certificateReference.slice(-8)}`;
      const payload = {
        certificateType: 'student-enrollment', certificateReference, certificateNumber, issuedAt,
        school: { legalName: row.school_legal_name, displayName: row.school_display_name },
        student: { id: row.id, studentNumber: row.student_number, name: row.student_name, dateOfBirth: row.date_of_birth, status: row.status },
        enrollment: { id: row.enrollment_id, academicYearId: row.academic_year_id, academicYearName: row.academic_year_name, classReference: row.class_reference, sectionReference: row.section_reference, placement },
        issuanceReason: String(reason).trim(), source: 'canonical-postgres'
      };
      const payloadText = JSON.stringify(payload);
      const payloadHash = createHash('sha256').update(payloadText).digest('hex');
      const signature = createHmac('sha256', secret).update(payloadText).digest('base64url');
      const auditId = randomUUID();
      await db.query(
        `INSERT INTO public.audit_events
          (id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata, request_id, correlation_id)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'student_enrollment_certificate', $6::uuid, 'ISSUE', 'CanonicalEnrollmentCertificateService', $7, 'success', $8::jsonb, $9::uuid, $10::uuid)`,
        [auditId, context.tenantId, context.schoolId, context.branchId, actorId, certificateId, String(reason).trim(), JSON.stringify({ certificateNumber, certificateReference, payloadHash }), context.requestId, context.correlationId]);
      const inserted = await db.query<any>(
        `INSERT INTO public.student_enrollment_certificates
          (id, tenant_id, school_id, branch_id, student_id, enrollment_id, certificate_number, certificate_reference, certificate_payload, payload_hash, signature, issued_at, issued_by, idempotency_key, created_by, audit_id, request_id, correlation_id)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7, $8, $9::jsonb, $10, $11, $12::timestamptz, $13::uuid, $14, $13::uuid, $15::uuid, $16::uuid, $17::uuid)
         RETURNING id, certificate_number, certificate_reference, certificate_payload, payload_hash, signature_algorithm, signature, status, issued_at`,
        [certificateId, context.tenantId, context.schoolId, context.branchId, studentId, row.enrollment_id, certificateNumber, certificateReference, payloadText, payloadHash, signature, issuedAt, actorId, key, auditId, context.requestId, context.correlationId]);
      return { ...inserted.rows[0], idempotent: false, signed: true, signatureStatus: 'approved' };
    }, context);
  }
}

export const canonicalEnrollmentCertificateService = new CanonicalEnrollmentCertificateService();
