import type { Student } from '../../../types';

export type StudentFeeWorkbookPlanRow = {
  amount: number;
  dueDate: string;
};

export type StudentFeeWorkbookPaymentRow = {
  ordinal: number;
  amount: number;
  date: string;
  bankReference: string;
  cashMarker: string;
};

export type StudentFeeWorkbookRow = {
  workbookRow: number;
  serial: string;
  name: string;
  nationalId: string;
  stage: string;
  grade: string;
  section: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  plans: StudentFeeWorkbookPlanRow[];
  payments: StudentFeeWorkbookPaymentRow[];
};

export type StudentFeeWorkbookParseResult = {
  headerRowIndex: number;
  rows: StudentFeeWorkbookRow[];
};

const normalizeText = (value: unknown) => String(value ?? '')
  .normalize('NFKC')
  .replace(/[\u064B-\u065F\u0670]/g, '')
  .replace(/[أإآ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/[ـ_\-–—]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const roundMoney = (value: number) => Number(value.toFixed(2));

const toMoney = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? roundMoney(value) : 0;
  const text = String(value ?? '').replace(/[٬,]/g, '').trim();
  if (!text) return 0;
  const amount = Number(text);
  return Number.isFinite(amount) ? roundMoney(amount) : 0;
};

const serialToIsoDate = (serial: number) => {
  const utc = new Date(Date.UTC(1899, 11, 30) + Math.round(serial * 86400000));
  if (!Number.isFinite(utc.getTime())) return '';
  return `${utc.getUTCFullYear().toString().padStart(4, '0')}-${(utc.getUTCMonth() + 1).toString().padStart(2, '0')}-${utc.getUTCDate().toString().padStart(2, '0')}`;
};

export const spreadsheetDateToIso = (value: unknown): string => {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return `${value.getFullYear().toString().padStart(4, '0')}-${(value.getMonth() + 1).toString().padStart(2, '0')}-${value.getDate().toString().padStart(2, '0')}`;
  }
  if (typeof value === 'number' && Number.isFinite(value) && value > 20000 && value < 80000) return serialToIsoDate(value);
  const text = String(value ?? '').trim();
  if (!text) return '';
  const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const dmy = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  return '';
};

const hasValue = (value: unknown) => String(value ?? '').trim() !== '';

const headerLooksLikeWorkbook = (row: readonly unknown[]) => {
  const joined = normalizeText(row.join(' '));
  return joined.includes('الاسم الكامل') && joined.includes('قيمة المطالبة') && joined.includes('المرحلة الدراسية');
};

/**
 * Parses the fixed financial workbook layout without interpreting formulas.
 * The workbook deliberately has repeated payment/plan labels, so positional
 * columns are used after locating the canonical header row.
 */
export function parseStudentFeeWorkbook(matrix: readonly (readonly unknown[])[]): StudentFeeWorkbookParseResult {
  const headerRowIndex = matrix.findIndex(headerLooksLikeWorkbook);
  if (headerRowIndex < 0) throw new Error('لم نعثر على صف عناوين الشيت الموحد المالي.');

  const rows: StudentFeeWorkbookRow[] = [];
  matrix.slice(headerRowIndex + 1).forEach((row, offset) => {
    const name = String(row[1] ?? row[4] ?? '').trim();
    const grossAmount = toMoney(row[20]);
    if (!name && grossAmount <= 0) return;
    if (!name) throw new Error(`الصف ${headerRowIndex + offset + 2} يحتوي قيمة مالية دون اسم طالب.`);
    const discountAmount = toMoney(row[21]);
    const netAmount = toMoney(row[22] ?? grossAmount - discountAmount);
    if (grossAmount <= 0 || netAmount <= 0 || discountAmount > grossAmount || Math.abs(roundMoney(grossAmount - discountAmount) - netAmount) > 0.01) {
      throw new Error(`الصف ${headerRowIndex + offset + 2} يحتوي مطالبة أو خصمًا غير متطابق.`);
    }

    const plans: StudentFeeWorkbookPlanRow[] = [];
    [27, 29, 31, 33, 35, 37].forEach(amountIndex => {
      const amount = toMoney(row[amountIndex]);
      const dueDate = spreadsheetDateToIso(row[amountIndex + 1]);
      if (amount <= 0 && !dueDate) return;
      if (amount <= 0 || !dueDate) throw new Error(`الصف ${headerRowIndex + offset + 2} يحتوي قسطًا ناقص المبلغ أو التاريخ.`);
      plans.push({ amount, dueDate });
    });

    const payments: StudentFeeWorkbookPaymentRow[] = [];
    [39, 43, 47, 51, 55, 59].forEach((amountIndex, paymentIndex) => {
      const amount = toMoney(row[amountIndex]);
      const date = spreadsheetDateToIso(row[amountIndex + 1]);
      const bankReference = String(row[amountIndex + 2] ?? '').trim();
      const cashMarker = String(row[amountIndex + 3] ?? '').trim();
      if (amount <= 0 && !date && !bankReference && !cashMarker) return;
      if (amount <= 0 || !date) throw new Error(`الصف ${headerRowIndex + offset + 2} يحتوي سدادًا ناقص المبلغ أو التاريخ.`);
      payments.push({ ordinal: paymentIndex + 1, amount, date, bankReference, cashMarker });
    });

    rows.push({
      workbookRow: headerRowIndex + offset + 2,
      serial: String(row[0] ?? '').trim(),
      name,
      nationalId: String(row[3] ?? '').trim(),
      stage: String(row[7] ?? '').trim(),
      grade: String(row[8] ?? '').trim(),
      section: String(row[9] ?? '').trim(),
      grossAmount,
      discountAmount,
      netAmount,
      plans,
      payments
    });
  });
  if (rows.length === 0) throw new Error('الشيت لا يحتوي صفوفًا مالية قابلة للاستيراد.');
  return { headerRowIndex, rows };
}

export const normalizeStudentWorkbookText = normalizeText;
export const workbookRowHasPaymentSource = (payment: StudentFeeWorkbookPaymentRow) => hasValue(payment.bankReference) || hasValue(payment.cashMarker);

export function workbookGradeOrdinal(value: unknown): number | undefined {
  const text = normalizeText(value);
  const ordinals: Array<[number, string[]]> = [
    [1, ['الاول', 'اولي', 'اولى', 'first']], [2, ['الثاني', 'الثانيه', 'ثاني', 'second']],
    [3, ['الثالث', 'الثالثه', 'ثالث', 'third']], [4, ['الرابع', 'الرابعه', 'رابع', 'fourth']],
    [5, ['الخامس', 'الخامسه', 'خامس', 'fifth']], [6, ['السادس', 'السادسه', 'سادس', 'sixth']],
    [7, ['السابع', 'السابعة', 'سابع', 'seventh']], [8, ['الثامن', 'الثامنه', 'ثامن', 'eighth']],
    [9, ['التاسع', 'التاسعه', 'تاسع', 'ninth']], [10, ['العاشر', 'العاشره', 'عاشر', 'tenth']],
    [11, ['الحادي عشر', 'الحادية عشر', 'الحادية عشرة', 'eleventh']], [12, ['الثاني عشر', 'الثانية عشر', 'الثانية عشرة', 'twelfth']]
  ];
  return ordinals.find(([, aliases]) => aliases.some(alias => text.includes(normalizeText(alias))))?.[0];
}

export function studentWorkbookNameMatches(student: Student, workbookName: string): boolean {
  const expected = normalizeText(workbookName);
  return normalizeText(student.name) === expected;
}

