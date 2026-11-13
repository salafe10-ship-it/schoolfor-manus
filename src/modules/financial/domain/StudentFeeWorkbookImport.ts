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

export type StudentFeeWorkbookIssue = {
  workbookRow: number;
  name: string;
  category: 'identity' | 'claim' | 'installment' | 'payment';
  message: string;
};

export type StudentFeeWorkbookParseResult = {
  headerRowIndex: number;
  rows: StudentFeeWorkbookRow[];
  issues: StudentFeeWorkbookIssue[];
};

const normalizeText = (value: unknown) => String(value ?? '')
  .normalize('NFKC')
  .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[\u064B-\u065F\u0670]/g, '')
  .replace(/[أإآ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/[ـ_\-–—]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const roundMoney = (value: number) => Number(value.toFixed(2));

const normalizeDigits = (value: string) => value
  .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

const toMoney = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? roundMoney(value) : 0;
  const text = normalizeDigits(String(value ?? '')).replace(/[٬,]/g, '').trim();
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
  const issues: StudentFeeWorkbookIssue[] = [];
  matrix.slice(headerRowIndex + 1).forEach((row, offset) => {
    const workbookRow = headerRowIndex + offset + 2;
    const primaryName = String(row[1] ?? '').trim();
    const secondaryName = String(row[4] ?? '').trim();
    const name = primaryName || secondaryName;
    const grossAmount = toMoney(row[20]);
    const discountAmount = toMoney(row[21]);
    const netAmount = roundMoney(grossAmount - discountAmount);
    const hasOtherFinancialData = row.slice(20).some(value => String(value ?? '').trim() !== '');
    if (!name && grossAmount <= 0 && !hasOtherFinancialData) return;
    if (!name) {
      issues.push({ workbookRow, name: 'غير محدد', category: 'identity', message: `الصف ${workbookRow} يحتوي بيانات مالية دون اسم طالب.` });
      return;
    }
    if (primaryName && secondaryName && normalizeText(primaryName) !== normalizeText(secondaryName)) {
      issues.push({ workbookRow, name: `${primaryName} / ${secondaryName}`, category: 'identity', message: `الصف ${workbookRow} يحتوي اسمين مختلفين في عمودي الاسم؛ تُرك للمراجعة.` });
      return;
    }

    // Formula cells are intentionally omitted by the spreadsheet reader. The
    // net claim is therefore derived from the literal gross and discount
    // values, and a supplied literal net is checked when one exists.
    const suppliedNetAmount = String(row[22] ?? '').trim();
    const suppliedNet = toMoney(row[22]);
    if (grossAmount <= 0 || netAmount <= 0 || discountAmount < 0 || discountAmount > grossAmount
      || (suppliedNetAmount !== '' && Math.abs(suppliedNet - netAmount) > 0.01)) {
      issues.push({ workbookRow, name, category: 'claim', message: `الصف ${workbookRow} يحتوي مطالبة أو خصمًا غير موجب أو غير متطابق؛ لم تُصدر المطالبة.` });
      return;
    }

    const plans: StudentFeeWorkbookPlanRow[] = [];
    let planIsInvalid = false;
    [27, 29, 31, 33, 35, 37].forEach(amountIndex => {
      const rawAmount = row[amountIndex];
      const rawDate = row[amountIndex + 1];
      const amount = toMoney(rawAmount);
      const dueDate = spreadsheetDateToIso(rawDate);
      if (!String(rawAmount ?? '').trim() && !String(rawDate ?? '').trim()) return;
      if (amount <= 0 || !dueDate) {
        planIsInvalid = true;
        return;
      }
      plans.push({ amount, dueDate });
    });
    if (planIsInvalid) {
      issues.push({ workbookRow, name, category: 'installment', message: `الصف ${workbookRow} يحتوي قسطًا ناقص المبلغ أو التاريخ؛ تُركت خطة الطالب كاملة دون إنشاء.` });
      plans.length = 0;
    }

    const payments: StudentFeeWorkbookPaymentRow[] = [];
    [39, 43, 47, 51, 55, 59].forEach((amountIndex, paymentIndex) => {
      const rawAmount = row[amountIndex];
      const rawDate = row[amountIndex + 1];
      const amount = toMoney(rawAmount);
      const date = spreadsheetDateToIso(rawDate);
      const bankReference = String(row[amountIndex + 2] ?? '').trim();
      const cashMarker = String(row[amountIndex + 3] ?? '').trim();
      if (!String(rawAmount ?? '').trim() && !String(rawDate ?? '').trim() && !bankReference && !cashMarker) return;
      if (amount <= 0 || !date) {
        issues.push({ workbookRow, name, category: 'payment', message: `الصف ${workbookRow} / السداد ${paymentIndex + 1}: مبلغ السداد أو تاريخه ناقص أو غير صالح؛ تُرك هذا السداد.` });
        return;
      }
      payments.push({ ordinal: paymentIndex + 1, amount, date, bankReference, cashMarker });
    });

    rows.push({
      workbookRow,
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

  const duplicateRows = new Map<string, StudentFeeWorkbookRow[]>();
  for (const row of rows) {
    const key = [row.name, row.stage, row.grade, row.section].map(normalizeText).join('|');
    const grouped = duplicateRows.get(key) || [];
    grouped.push(row);
    duplicateRows.set(key, grouped);
  }
  const duplicateRowNumbers = new Set<number>();
  for (const group of duplicateRows.values()) {
    if (group.length < 2) continue;
    for (const row of group) {
      duplicateRowNumbers.add(row.workbookRow);
      issues.push({ workbookRow: row.workbookRow, name: row.name, category: 'identity', message: `الصف ${row.workbookRow}: تكرر الاسم والصف والشعبة في الشيت؛ تُركت كل الصفوف المتكررة للمراجعة.` });
    }
  }

  const safeRows = rows.filter(row => !duplicateRowNumbers.has(row.workbookRow));
  if (safeRows.length === 0 && issues.length === 0) throw new Error('الشيت لا يحتوي صفوفًا مالية قابلة للاستيراد.');
  return { headerRowIndex, rows: safeRows, issues };
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

