import { randomUUID } from 'node:crypto';
import { UnitOfWork } from '../../../database/UnitOfWork.js';
import type { TenantContext } from '../../../tenant/TenantContext.js';
import { ConflictError, DatabaseError, ValidationError } from '../../../utils/errors.js';
import {
  studentRegistrationService,
  type StudentRegistrationCommand,
  type StudentRegistrationResult
} from './StudentRegistrationService.js';

const MAX_IMPORT_ROWS = 200;

export type CanonicalStudentImportRequest = {
  rows: StudentRegistrationCommand[];
  idempotencyKey?: unknown;
  requestId?: string;
  correlationId?: string;
  ipAddress?: string;
};

export type CanonicalStudentImportResult = {
  batchIdempotencyKey: string;
  totalRows: number;
  createdCount: number;
  idempotentCount: number;
  students: StudentRegistrationResult[];
};

function requiredBatchKey(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Idempotency-Key مطلوب لاستيراد دفعة الطلاب.', { errorCode: 'STU-IMPORT-IDM-001' });
  }
  const normalized = value.trim();
  if (normalized.length > 180) {
    throw new ValidationError('Idempotency-Key لاستيراد الدفعة طويل أكثر من المسموح.', { errorCode: 'STU-IMPORT-IDM-002' });
  }
  return normalized;
}

function validateRows(rows: unknown): StudentRegistrationCommand[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new ValidationError('يجب أن تحتوي دفعة الاستيراد على طالب واحد على الأقل.', { errorCode: 'STU-IMPORT-001' });
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new ValidationError(`الحد الأقصى للاستيراد الذري هو ${MAX_IMPORT_ROWS} طالبًا في الدفعة الواحدة.`, { errorCode: 'STU-IMPORT-002' });
  }
  if (rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
    throw new ValidationError('كل صف في ملف الاستيراد يجب أن يكون سجل طالب صالحًا.', { errorCode: 'STU-IMPORT-003' });
  }
  return rows as StudentRegistrationCommand[];
}

export class CanonicalStudentImportService {
  async execute(context: TenantContext, request: CanonicalStudentImportRequest): Promise<CanonicalStudentImportResult> {
    const rows = validateRows(request.rows);
    const batchIdempotencyKey = requiredBatchKey(request.idempotencyKey);
    if (!UnitOfWork.hasTransactionDriver()) {
      throw new DatabaseError('استيراد الطلاب يتطلب اتصال PostgreSQL معاملاتيًا؛ لم تتم أي كتابة.', {
        errorCode: 'STU-IMPORT-PERSISTENCE-001'
      });
    }

    const requestId = request.requestId || randomUUID();
    const correlationId = request.correlationId || randomUUID();
    const work = async (): Promise<CanonicalStudentImportResult> => {
      const students: StudentRegistrationResult[] = [];
      for (let index = 0; index < rows.length; index += 1) {
        students.push(await studentRegistrationService.register(context, rows[index], {
          requestId,
          correlationId,
          ipAddress: request.ipAddress || 'unknown',
          idempotencyKey: `${batchIdempotencyKey}:${index + 1}`
        }));
      }
      const idempotentCount = students.filter(student => student.idempotent).length;
      return {
        batchIdempotencyKey,
        totalRows: students.length,
        createdCount: students.length - idempotentCount,
        idempotentCount,
        students
      };
    };

    try {
      return await UnitOfWork.runInTransaction(
        context.schoolId,
        {
          operationName: 'SOP-001 Student Import Batch',
          userId: context.userId,
          userName: context.userId,
          ipAddress: request.ipAddress || 'unknown',
          affectedTables: ['students', 'guardians', 'student_guardians', 'enrollments', 'student_academic_status', 'student_status_transitions', 'student_status_history', 'audit_events', 'outbox_events'],
          tenantId: context.tenantId
        },
        work,
        context
      );
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof DatabaseError) throw error;
      throw new DatabaseError('فشل استيراد دفعة الطلاب؛ تم إلغاء الدفعة كاملة دون حفظ جزئي.', {
        errorCode: 'STU-IMPORT-TRANSACTION-001',
        cause: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

export const canonicalStudentImportService = new CanonicalStudentImportService();
