import { createHash, randomUUID } from 'node:crypto';

export type InstallmentFrequency = 'monthly' | 'quarterly' | 'yearly';

export interface InstallmentDraft {
  installmentNumber: number;
  dueDate: string;
  amount: number;
}

export interface StudentFeeInvoiceCommand {
  id?: string;
  studentId: string;
  templateId?: string;
  description: string;
  amount: number;
  taxAmount?: number;
  currency?: string;
  dueDate: string;
  invoiceDate?: string;
  academicYearId: string;
  academicPeriodId: string;
  financialPeriod: string;
  revenueAccount: string;
  receivableAccount?: string;
  idempotencyKey: string;
  branchId?: string | null;
}

export function normalizeIdempotencyKey(value: unknown, scope: string): string {
  const raw = String(value || '').trim();
  if (raw.length >= 8 && raw.length <= 180) return raw;
  throw new Error(`مفتاح العملية (${scope}) مطلوب ويجب أن يتراوح طوله بين 8 و180 حرفاً.`);
}

export function makeDeterministicIdempotencyKey(parts: Array<string | number | null | undefined>): string {
  const payload = parts.map((part) => String(part ?? '').trim()).join('|');
  return `fee_${createHash('sha256').update(payload).digest('hex').slice(0, 48)}`;
}

export function assertMoney(value: unknown, field: string, allowZero = false): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || (!allowZero && amount <= 0)) {
    throw new Error(`قيمة ${field} غير صالحة.`);
  }
  return Number(amount.toFixed(2));
}

export function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const targetDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(targetDay, lastDay));
  return result;
}

export function buildInstallmentSchedule(params: {
  totalAmount: number;
  count: number;
  startDueDate: string;
  frequency: InstallmentFrequency;
  gracePeriodDays?: number;
}): InstallmentDraft[] {
  const total = assertMoney(params.totalAmount, 'إجمالي خطة التقسيط');
  const count = Number(params.count);
  if (!Number.isInteger(count) || count < 1 || count > 60) {
    throw new Error('عدد الأقساط يجب أن يكون رقمًا صحيحًا بين 1 و60.');
  }
  const start = new Date(`${params.startDueDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) throw new Error('تاريخ أول قسط غير صالح.');
  const interval = params.frequency === 'monthly' ? 1 : params.frequency === 'quarterly' ? 3 : 12;
  const grace = Math.max(0, Math.min(90, Number(params.gracePeriodDays || 0)));
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;
  return Array.from({ length: count }, (_, index) => {
    const due = addCalendarMonths(start, index * interval);
    due.setUTCDate(due.getUTCDate() + grace);
    const amountCents = base + (index === count - 1 ? remainder : 0);
    return {
      installmentNumber: index + 1,
      dueDate: due.toISOString().slice(0, 10),
      amount: Number((amountCents / 100).toFixed(2)),
    };
  });
}

export function makeReceiptId(): string {
  return randomUUID();
}

export function makeInvoiceId(): string {
  return randomUUID();
}

export function makePaymentAttemptId(): string {
  return randomUUID();
}

export function isTerminalInvoiceStatus(status: string): boolean {
  return ['paid', 'cancelled', 'void', 'written_off', 'refunded'].includes(status.trim().toLowerCase());
}
