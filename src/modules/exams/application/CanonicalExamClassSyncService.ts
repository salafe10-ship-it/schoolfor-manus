import { randomUUID } from 'node:crypto';
import { UnitOfWork } from '../../../database/UnitOfWork.js';
import type { TransactionSession } from '../../../database/transactions/TransactionContracts.js';
import type { TenantContext } from '../../../tenant/TenantContext.js';
import { ConflictError, DatabaseError, ValidationError } from '../../../utils/errors.js';

export type ExamClassLevel = 'kindergarten' | 'primary' | 'middle' | 'high';

export type CanonicalExamClass = {
  id: string;
  name: string;
  level: ExamClassLevel;
  capacity: number;
  sections: string[];
};

type AcademicStructureClass = {
  id?: unknown;
  code?: unknown;
  name?: unknown;
  capacity?: unknown;
  isActive?: unknown;
};

type CurrentExamsDatabase = {
  data: Record<string, unknown>;
  version: number;
};

type CanonicalClassReference = {
  class_reference: string;
};

const OPERATION = 'EXAMS_CANONICAL_CLASS_SYNC';

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function transaction(): TransactionSession {
  const context = UnitOfWork.getActiveContext();
  if (!context?.isActive || !context.databaseTransaction) {
    throw new DatabaseError('مزامنة صفوف الامتحانات تتطلب معاملة قاعدة بيانات نشطة.');
  }
  return context.databaseTransaction;
}

function requireTrustedContext(context: TenantContext): void {
  const required = [context.tenantId, context.schoolId, context.branchId, context.academicYear, context.userId];
  if (required.some(value => !cleanText(value))) {
    throw new ValidationError('سياق المدرسة الموثوق غير مكتمل لمزامنة صفوف الامتحانات.');
  }
}

function sectionFromCode(code: string, allowedSections: Set<string>): string {
  const suffix = code.match(/-([A-Z])$/i)?.[1]?.toUpperCase();
  const mapped = suffix === 'A' ? 'أ' : suffix === 'B' ? 'ب' : suffix === 'C' ? 'ج' : suffix === 'D' ? 'د' : '';
  if (mapped && allowedSections.has(mapped)) return mapped;
  const fallback = [...allowedSections].sort((left, right) => left.localeCompare(right, 'ar'))[0];
  if (!fallback) throw new ValidationError('لا توجد شعب فعالة في الهيكل الأكاديمي الموثوق.');
  return fallback;
}

function levelFromCode(code: string): ExamClassLevel {
  if (/^KG/i.test(code)) return 'kindergarten';
  if (/^PRI/i.test(code)) return 'primary';
  if (/^MID/i.test(code)) return 'middle';
  if (/^HIGH/i.test(code)) return 'high';
  throw new ValidationError(`رمز الصف ${code} لا يحدد مرحلة أكاديمية مدعومة.`);
}

/**
 * Converts the school-owned academic structure to the exact class references
 * consumed by the exams workflow. It fails closed on incomplete metadata so a
 * user cannot create a cycle that diverges from Student Affairs enrollments.
 */
export function buildCanonicalExamClassesFromAcademicStructure(structure: unknown): CanonicalExamClass[] {
  const record = structure && typeof structure === 'object' && !Array.isArray(structure)
    ? structure as Record<string, unknown>
    : null;
  const allowedSections = new Set(
    (Array.isArray(record?.sections) ? record.sections : []).map(cleanText).filter(Boolean)
  );
  const rawClasses = Array.isArray(record?.classes) ? record.classes : [];
  const names = new Set<string>();
  const ids = new Set<string>();
  const classes = rawClasses.map((raw): CanonicalExamClass | null => {
    const item = raw && typeof raw === 'object' && !Array.isArray(raw)
      ? raw as AcademicStructureClass
      : null;
    if (!item || item.isActive === false) return null;
    const id = cleanText(item.id);
    const code = cleanText(item.code).toUpperCase();
    const name = cleanText(item.name);
    const capacity = Number(item.capacity);
    if (!id || !code || !name || !Number.isSafeInteger(capacity) || capacity <= 0) {
      throw new ValidationError('يوجد صف نشط غير مكتمل أو بلا سعة في الهيكل الأكاديمي الموثوق.');
    }
    if (ids.has(id) || names.has(name)) {
      throw new ValidationError(`الصف ${name} مكرر في الهيكل الأكاديمي الموثوق.`);
    }
    ids.add(id);
    names.add(name);
    return {
      id,
      name,
      level: levelFromCode(code),
      capacity,
      sections: [sectionFromCode(code, allowedSections)]
    };
  }).filter((item): item is CanonicalExamClass => item !== null);

  if (!classes.length) throw new ValidationError('لا توجد صفوف نشطة لمزامنتها مع دورة الامتحانات.');
  return classes.sort((left, right) => left.name.localeCompare(right.name, 'ar'));
}

export type CanonicalExamClassSyncResult = {
  classes: CanonicalExamClass[];
  version: number;
  matchedStudentClassCount: number;
  requestId: string;
  correlationId: string;
};

export class CanonicalExamClassSyncService {
  async synchronize(
    context: TenantContext,
    request: { expectedVersion: unknown; ipAddress?: unknown }
  ): Promise<CanonicalExamClassSyncResult> {
    requireTrustedContext(context);
    if (!UnitOfWork.hasTransactionDriver()) {
      throw new DatabaseError('لا يتوفر محرك معاملات قاعدة البيانات لمزامنة صفوف الامتحانات.');
    }
    const expectedVersion = Number(request.expectedVersion);
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) {
      throw new ValidationError('رقم إصدار دورة الامتحانات مطلوب لمزامنة الصفوف.');
    }
    const requestId = randomUUID();
    const correlationId = randomUUID();

    return UnitOfWork.runInTransaction(
      context.schoolId,
      {
        operationName: 'Synchronize canonical exam classes',
        tenantId: context.tenantId,
        userId: context.userId,
        userName: context.userId,
        ipAddress: cleanText(request.ipAddress) || 'unknown',
        affectedTables: ['school_settings', 'students', 'enrollments', 'exams_database', 'audit_events']
      },
      async () => {
        const db = transaction();
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

        const current = await db.query<CurrentExamsDatabase>(
          `SELECT data, version
             FROM public.exams_database
            WHERE tenant_id = $1 AND school_id = $2
            FOR UPDATE`,
          [context.tenantId, context.schoolId]
        );
        const currentData = current.rows[0]?.data || {};
        const currentVersion = Number(current.rows[0]?.version || 0);
        if (currentVersion !== expectedVersion) {
          throw new ConflictError('تم تعديل دورة الامتحانات بواسطة مستخدم آخر. أعد المزامنة قبل مطابقة الصفوف.', {
            expectedVersion,
            actualVersion: currentVersion
          });
        }

        const structureResult = await db.query<{ structure: unknown }>(
          `SELECT setting_value AS structure
             FROM public.school_settings
            WHERE tenant_id = $1
              AND school_id = $2
              AND setting_key = 'academic_structure'
              AND status = 'active'
              AND deleted_at IS NULL
            ORDER BY effective_from DESC, created_at DESC
            LIMIT 1`,
          [context.tenantId, context.schoolId]
        );
        const classes = buildCanonicalExamClassesFromAcademicStructure(structureResult.rows[0]?.structure);
        const classNames = new Set(classes.map(item => item.name));

        const canonicalReferences = await db.query<CanonicalClassReference>(
          `SELECT DISTINCT btrim(e.class_reference) AS class_reference
             FROM public.enrollments e
             INNER JOIN public.students s
               ON s.tenant_id = e.tenant_id
              AND s.school_id = e.school_id
              AND s.id = e.student_id
              AND s.deleted_at IS NULL
            WHERE e.tenant_id = $1
              AND e.school_id = $2
              AND (e.branch_id = $3 OR e.branch_id IS NULL)
              AND e.academic_year_id = $4
              AND e.enrollment_status = 'active'
              AND e.deleted_at IS NULL
              AND s.status = 'active'
              AND NULLIF(btrim(e.class_reference), '') IS NOT NULL
            ORDER BY btrim(e.class_reference)`,
          [context.tenantId, context.schoolId, context.branchId, context.academicYear]
        );
        const missingReferences = canonicalReferences.rows
          .map(item => cleanText(item.class_reference))
          .filter(reference => reference && !classNames.has(reference));
        if (missingReferences.length) {
          throw new ValidationError(`صفوف طلاب نشطة غير معرفة في الهيكل الأكاديمي: ${missingReferences.join('، ')}.`);
        }

        const nextVersion = currentVersion + 1;
        const nextData = { ...currentData, exams_classes_list: classes };
        await db.query(
          `INSERT INTO public.exams_database (tenant_id, school_id, data, version, updated_at, updated_by)
           VALUES ($1, $2, $3::jsonb, $4, now(), $5)
           ON CONFLICT (school_id) DO UPDATE
             SET data = EXCLUDED.data,
                 version = EXCLUDED.version,
                 updated_at = EXCLUDED.updated_at,
                 updated_by = EXCLUDED.updated_by
           WHERE public.exams_database.tenant_id = EXCLUDED.tenant_id`,
          [context.tenantId, context.schoolId, JSON.stringify(nextData), nextVersion, actorUserId]
        );
        await db.query(
          `INSERT INTO public.audit_events (
             id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id,
             action, source, reason, result, metadata, request_id, correlation_id
           ) VALUES ($1, $2, $3, $4, $5, 'exams_database', $3,
                     $6, 'CanonicalExamClassSyncService', $7, 'success', $8::jsonb, $9, $10)`,
          [
            randomUUID(), context.tenantId, context.schoolId, context.branchId, actorUserId,
            OPERATION,
            'مطابقة صفوف دورة الامتحانات مع الهيكل الأكاديمي الموثوق.',
            JSON.stringify({ classCount: classes.length, matchedStudentClassCount: canonicalReferences.rows.length, expectedVersion, nextVersion }),
            requestId,
            correlationId
          ]
        );

        return {
          classes,
          version: nextVersion,
          matchedStudentClassCount: canonicalReferences.rows.length,
          requestId,
          correlationId
        };
      },
      context
    );
  }
}

export const canonicalExamClassSyncService = new CanonicalExamClassSyncService();
