import ExcelJS from 'exceljs';
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

export async function buildStudentExportXlsx(rows: Record<string, unknown>[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Students');
  worksheet.addRow([...EXPORT_HEADERS]);
  worksheet.getRow(1).font = { bold: true };
  worksheet.addRows(rows.map(row => [
    safeCell(row.studentNumber || row.studentCode),
    safeCell(row.name),
    safeCell(row.classroom),
    safeCell(row.section),
    safeCell(row.status),
    safeCell(row.registrationDate)
  ]));
  worksheet.columns = EXPORT_HEADERS.map((header, index) => ({
    header,
    key: `column-${index}`,
    width: 24
  }));
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = { from: 'A1', to: `F${Math.max(rows.length + 1, 1)}` };

  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = Uint8Array.from(buffer as unknown as ArrayLike<number>);
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error('XLSX artifact validation failed.');
  }
  return Buffer.from(bytes);
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

  const buffer = await buildStudentExportXlsx(result.data);
  return { buffer, rowCount: result.totalCount, fileName: studentExportFileName() };
}
