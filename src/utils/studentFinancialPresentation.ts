export { toLocalDateInputValue } from './dateOnly.js';

export type InstallmentFrequency = 'monthly' | 'quarterly' | 'yearly';

export type AcademicStageKind = 'kindergarten' | 'primary' | 'middle' | 'secondary';

export interface StudentFinancialInvoiceSnapshot {
  studentId?: unknown;
  studentName?: unknown;
  student_name?: unknown;
  amount?: unknown;
  totalAmount?: unknown;
  taxAmount?: unknown;
  paidAmount?: unknown;
  remainingAmount?: unknown;
  status?: unknown;
}

export interface StudentFinancialBalance {
  studentId: string;
  studentName: string;
  invoiced: number;
  paid: number;
  remaining: number;
}

export interface StudentFinancialSnapshotTotals {
  totalInvoiced: number;
  totalPaid: number;
  totalRemaining: number;
  collectionRate: number | null;
  students: StudentFinancialBalance[];
}

/** Aggregate the verified invoice snapshot independently of write-context readiness. */
export function aggregateStudentFinancialSnapshot(
  invoices: readonly StudentFinancialInvoiceSnapshot[]
): StudentFinancialSnapshotTotals {
  const byStudent = new Map<string, StudentFinancialBalance>();
  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  for (const invoice of invoices) {
    const status = String(invoice.status || '').trim().toLowerCase();
    if (['cancelled', 'void', 'written_off', 'refunded'].includes(status)) continue;

    const amount = Number(invoice.amount || 0);
    const tax = Number(invoice.taxAmount || 0);
    const gross = Number(invoice.totalAmount ?? amount + tax);
    const invoiced = Number.isFinite(gross) ? Math.max(0, gross) : 0;
    const rawPaid = Number(invoice.paidAmount || 0);
    const paid = Number.isFinite(rawPaid) ? Math.max(0, rawPaid) : 0;
    const rawRemaining = Number(invoice.remainingAmount);
    const remaining = Number.isFinite(rawRemaining)
      ? Math.max(0, rawRemaining)
      : Math.max(0, invoiced - paid);

    totalInvoiced += invoiced;
    totalPaid += paid;
    totalRemaining += remaining;

    const studentId = String(invoice.studentId || '').trim();
    if (!studentId) continue;
    const student = byStudent.get(studentId) || {
      studentId,
      studentName: '',
      invoiced: 0,
      paid: 0,
      remaining: 0
    };
    student.studentName ||= String(invoice.studentName || invoice.student_name || '').trim();
    student.invoiced += invoiced;
    student.paid += paid;
    student.remaining += remaining;
    byStudent.set(studentId, student);
  }

  return {
    totalInvoiced: Number(totalInvoiced.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    totalRemaining: Number(totalRemaining.toFixed(2)),
    collectionRate: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : null,
    students: [...byStudent.values()]
  };
}

export function classifyAcademicStage(value: unknown): AcademicStageKind | null {
  const label = String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/\s+/g, ' ');
  if (/kindergarten|\bkg\b|روضة|رياض الأطفال|تمهيد/.test(label)) return 'kindergarten';
  if (/secondary|ثانوي/.test(label)) return 'secondary';
  if (/middle|intermediate|preparatory|متوسط|اعدادي|إعدادي/.test(label)) return 'middle';
  if (/primary|elementary|ابتدائي/.test(label)) return 'primary';
  return null;
}

/** Stage-specific fee items may only be distributed to the same academic stage. */
export function isFeeConfigurationCompatibleWithStage(feeType: unknown, stageLabel: unknown): boolean {
  const feeStage = classifyAcademicStage(feeType);
  if (!feeStage) return true;
  return classifyAcademicStage(stageLabel) === feeStage;
}

/** Prefer a stage-specific tariff; use a general tariff only when no exact stage tariff exists. */
export function findFeeConfigurationForStage<T extends { id?: unknown; type?: unknown }>(
  configurations: readonly T[],
  stageLabel: unknown
): T | null {
  const stage = classifyAcademicStage(stageLabel);
  if (!stage) return null;
  return configurations.find(configuration => classifyAcademicStage(configuration.type) === stage)
    || configurations.find(configuration => classifyAcademicStage(configuration.type) === null)
    || null;
}

export interface ReceiptTenderView {
  accountCode: string;
  amount: number;
  paymentMethod: string;
}

export interface StudentLedgerEntryInput {
  id: string;
  date: string;
  description: string;
  amount: unknown;
  kind: 'invoice' | 'receipt';
  status?: unknown;
  source?: unknown;
}

export interface StudentLedgerRow extends StudentLedgerEntryInput {
  debit: number;
  credit: number;
  balance: number | null;
  isCancelled: boolean;
}

/** Build a chronological student statement with invoice debits and receipt credits. */
export function buildStudentLedgerRows(entries: readonly StudentLedgerEntryInput[]): StudentLedgerRow[] {
  const normalized = entries.map(entry => {
    const parsedAmount = Number(entry.amount);
    const amount = Number.isFinite(parsedAmount)
      ? entry.kind === 'receipt' ? Math.abs(parsedAmount) : Math.max(0, parsedAmount)
      : 0;
    const status = String(entry.status || '').trim().toLowerCase();
    const isCancelled = entry.kind === 'invoice' && ['cancelled', 'void'].includes(status);
    return {
      ...entry,
      amount,
      isCancelled,
      debit: entry.kind === 'invoice' ? amount : 0,
      credit: entry.kind === 'receipt' ? amount : 0,
    };
  }).sort((left, right) =>
    left.date.localeCompare(right.date)
    || (left.kind === right.kind ? 0 : left.kind === 'invoice' ? -1 : 1)
    || left.id.localeCompare(right.id),
  );

  let balance = 0;
  return normalized.map(row => {
    if (!row.isCancelled) balance += row.debit - row.credit;
    return { ...row, balance: row.isCancelled ? null : Number(balance.toFixed(2)) };
  });
}

function parseReceiptPayload(value: unknown): Record<string, any> {
  if (typeof value === 'string') {
    try { return JSON.parse(value) || {}; } catch { return {}; }
  }
  return value && typeof value === 'object' ? value as Record<string, any> : {};
}

/**
 * Resolve the tender detail shown on student receipts. The canonical journal
 * is authoritative for posted account splits; older receipt source payloads
 * may only retain the first receiving account.
 */
export function resolveReceiptTenders(voucher: any, journalEntries: any[] = []): ReceiptTenderView[] {
  const payload = parseReceiptPayload(voucher?.sourcePayload);
  let raw: any = voucher?.receivingAccounts || voucher?.receivingAccountLines || payload.receivingAccounts;
  if (typeof raw === 'string') {
    const parsed = parseReceiptPayload(raw);
    raw = Array.isArray(parsed) ? parsed : parsed.receivingAccounts || parsed.lines;
  }
  const embedded = Array.isArray(raw) ? raw.map((item: any) => ({
    accountCode: String(item?.accountCode || item?.account || item?.code || '').trim(),
    amount: Number(item?.amount || 0),
    paymentMethod: String(item?.paymentMethod || '').trim()
  })).filter((item: ReceiptTenderView) => item.accountCode && Number.isFinite(item.amount) && item.amount > 0) : [];

  const voucherAmount = Number(voucher?.amount || 0);
  const sourceId = String(voucher?.id || '').trim();
  const journalId = String(voucher?.journalEntryId || '').trim();
  const journal = voucher?.canonicalJournalEntry || journalEntries.find((entry: any) =>
    (journalId && String(entry?.id || '') === journalId)
    || (String(entry?.sourceType || '') === 'student_receipt' && String(entry?.sourceId || '') === sourceId)
    || String(entry?.id || '') === `ERP-JV-student_receipt-${sourceId}`
  );
  const journalLines = Array.isArray(journal?.lines) ? journal.lines : Array.isArray(journal?.items) ? journal.items : [];
  const canonicalTenders = journalLines
    .filter((line: any) => Number(line?.debit || 0) > 0 && String(line?.accountCode || line?.account_code || '') !== '1201')
    .map((line: any) => ({
      accountCode: String(line?.accountCode || line?.account_code || '').trim(),
      amount: Number(line?.debit || 0),
      paymentMethod: ''
    }))
    .filter((item: ReceiptTenderView) => item.accountCode && Number.isFinite(item.amount) && item.amount > 0);
  const canonicalTotal = Number(canonicalTenders.reduce((sum: number, item: ReceiptTenderView) => sum + item.amount, 0).toFixed(2));
  if (canonicalTenders.length > 0 && Math.abs(canonicalTotal - voucherAmount) <= 0.01) {
    return canonicalTenders.map((tender: ReceiptTenderView) => {
      const matchingTender = embedded.find(item => item.accountCode === tender.accountCode && Math.abs(item.amount - tender.amount) <= 0.01);
      return {
        ...tender,
        paymentMethod: matchingTender?.paymentMethod
          || (canonicalTenders.length === 1 ? String(voucher?.paymentMethod || 'غير محددة') : 'غير محددة')
      };
    });
  }

  if (embedded.length > 0) return embedded.map(item => ({
    ...item,
    paymentMethod: item.paymentMethod || String(voucher?.paymentMethod || 'غير محددة')
  }));

  return [{
    accountCode: String(voucher?.receivingAccount || '1101').trim(),
    amount: voucherAmount,
    paymentMethod: String(voucher?.paymentMethod || 'غير محددة').trim()
  }];
}

export interface InstallmentPreviewRow {
  date: string;
  amount: number;
  status: 'unpaid';
}

const MONTH_INTERVAL: Record<InstallmentFrequency, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12
};

export function createInstallmentPreview(
  totalAmount: number,
  frequency: InstallmentFrequency,
  requestedCount: number,
  requestedStartDate: string,
  gracePeriodDays: number
): InstallmentPreviewRow[] {
  const count = Math.max(1, Math.min(60, Math.floor(Number(requestedCount) || 1)));
  const totalCents = Math.round(Number(totalAmount || 0) * 100);
  if (!Number.isFinite(totalCents) || totalCents <= 0 || !MONTH_INTERVAL[frequency]) return [];

  const match = String(requestedStartDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return [];
  const [, yearText, monthText, dayText] = match;
  const startYear = Number(yearText);
  const startMonth = Number(monthText) - 1;
  const startDay = Number(dayText);
  const startDate = new Date(Date.UTC(startYear, startMonth, startDay));
  if (startDate.getUTCFullYear() !== startYear
    || startDate.getUTCMonth() !== startMonth
    || startDate.getUTCDate() !== startDay) return [];

  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents - baseCents * count;
  const grace = Math.max(0, Math.min(90, Math.floor(Number(gracePeriodDays) || 0)));
  const interval = MONTH_INTERVAL[frequency];

  return Array.from({ length: count }, (_, index) => {
    const targetMonthStart = new Date(Date.UTC(startYear, startMonth + (index * interval), 1));
    const lastDay = new Date(Date.UTC(targetMonthStart.getUTCFullYear(), targetMonthStart.getUTCMonth() + 1, 0)).getUTCDate();
    targetMonthStart.setUTCDate(Math.min(startDay, lastDay) + grace);
    return {
      date: targetMonthStart.toISOString().slice(0, 10),
      amount: (baseCents + (index === count - 1 ? remainderCents : 0)) / 100,
      status: 'unpaid'
    };
  });
}

export function formatFinancialReference(reference: unknown): string {
  const value = String(reference || '').trim();
  if (value.length <= 24) return value;

  const uuid = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  if (uuid?.index !== undefined) return `${value.slice(0, uuid.index)}…${uuid[0].slice(-8)}`;

  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}
