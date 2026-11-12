export interface CustomInstallmentDraft {
  installmentNumber: number;
  dueDate: string;
  amount: number;
}

/** Validate a historical schedule without changing its dates or amounts. */
export function validateCustomInstallmentSchedule(params: {
  availableAmount: number;
  schedules: unknown;
}): CustomInstallmentDraft[] {
  const available = Number(params.availableAmount);
  const availableCents = Math.round(available * 100);
  if (!Number.isFinite(available) || !Number.isSafeInteger(availableCents) || availableCents <= 0) {
    throw new Error('الرصيد المتاح للتقسيط غير صالح.');
  }
  if (!Array.isArray(params.schedules) || params.schedules.length < 1 || params.schedules.length > 60) {
    throw new Error('عدد الأقساط المخصصة يجب أن يكون بين 1 و60.');
  }

  let previousDate = '';
  let scheduledCents = 0;
  const rows = params.schedules.map((item: unknown, index: number) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`بيانات القسط ${index + 1} غير صالحة.`);
    }
    const source = item as Record<string, unknown>;
    const dueDate = String(source.dueDate || '').trim();
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(dueDate)
      ? new Date(`${dueDate}T00:00:00.000Z`)
      : null;
    if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dueDate) {
      throw new Error(`تاريخ استحقاق القسط ${index + 1} غير صالح.`);
    }
    if (previousDate && dueDate < previousDate) {
      throw new Error('تواريخ الأقساط يجب أن تكون مرتبة من الأقدم إلى الأحدث.');
    }
    previousDate = dueDate;

    const amount = Number(source.amount);
    const cents = Math.round(amount * 100);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(cents)
      || Math.abs(amount * 100 - cents) > 0.000001) {
      throw new Error(`مبلغ القسط ${index + 1} يجب أن يكون موجبًا وبدقة منزلتين عشريتين.`);
    }
    scheduledCents += cents;
    if (!Number.isSafeInteger(scheduledCents)) throw new Error('إجمالي الأقساط المخصصة غير صالح.');
    return { installmentNumber: index + 1, dueDate, amount: cents / 100 };
  });

  if (scheduledCents > availableCents) {
    throw new Error('إجمالي الأقساط المخصصة يتجاوز الرصيد المتاح على المطالبة.');
  }
  return rows;
}

