import * as XLSX from 'xlsx';
import { AuditRepository } from '../../../database/repositories/AuditRepository';
import { CanonicalStudentReadRepository, type CanonicalStudentReadParams } from '../../../database/repositories/CanonicalStudentReadRepository';
import type { TenantContext } from '../../../tenant/TenantContext';
import type { AuditMetadata } from '../../../types';
import { ValidationError } from '../../../utils/errors';
import type { SupabaseClient } from '@supabase/supabase-js';

export const STUDENT_EXPORT_MAX_ROWS = 5000;
export const STUDENT_EXPORT_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type StudentExportFilters = Omit<CanonicalStudentReadParams, 'page' | 'limit'>;

export type StudentExportResult = {
  buffer: Buffer;
  rowCount: number;
  fileName: string;
};

const EXPORT_HEADERS = [
  'رقم الطالب',
  'اسم الطالب',
  'الفصل',
  'الشعبة',
  'الحالة',
  'تاريخ التسجيل'
] as const;

function safeCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

export function buildStudentExportXlsx(rows: Record<string, unknown>[]): Buffer {
  const data = rows.map(row => ({
    [EXPORT_HEADERS[0]]: safeCell(row.studentNumber || row.studentCode),
    [EXPORT_HEADERS[1]]: safeCell(row.name),
    [EXPORT_HEADERS[2]]: safeCell(row.classroom),
    [EXPORT_HEADERS[3]]: safeCell(row.section),
    [EXPORT_HEADERS[4]]: safeCell(row.status),
    [EXPORT_HEADERS[5]]: safeCell(row.registrationDate)
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data, { header: [...EXPORT_HEADERS] });
  worksheet['!cols'] = EXPORT_HEADERS.map(() => ({ wch: 24 }));
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true }) as Buffer;
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error('XLSX artifact validation failed.');
  }
  return buffer;
}

export function studentExportFileName(now = new Date()): string {
  return `students_export_${now.toISOString().slice(0, 10)}.xlsx`;
}

export async function generateStudentExport(
  filters: StudentExportFilters,
  tenantContext: TenantContext,
  audit: AuditMetadata,
  requestId: string,
  correlationId: string,
  supabase?: SupabaseClient
): Promise<StudentExportResult> {
  const result = await CanonicalStudentReadRepository.exportSearch(filters, tenantContext, undefined, supabase);
  if (result.totalCount === 0) {
    throw new ValidationError('لا توجد نتائج مطابقة لإنشاء ملف التصدير.');
  }
  if (result.totalCount > STUDENT_EXPORT_MAX_ROWS) {
    throw new ValidationError(`تجاوزت نتائج التصدير الحد الأقصى المسموح وهو ${STUDENT_EXPORT_MAX_ROWS} سجل.`);
  }

  await AuditRepository.create(tenantContext.schoolId, {
    userId: audit.userId,
    userName: audit.userName,
    userRole: audit.userRole as any,
    action: 'STUDENT_EXPORT_ACCEPTED',
    module: 'Student Affairs',
    ipAddress: audit.ipAddress,
    endpoint: '/api/students/export',
    httpMethod: 'GET',
    correlationId,
    result: 'accepted',
    severity: 'low',
    details: JSON.stringify({ operation: 'Student Data Export', rowCount: result.totalCount, requestId, correlationId })
  });

  const buffer = buildStudentExportXlsx(result.data);
  return { buffer, rowCount: result.totalCount, fileName: studentExportFileName() };
}
