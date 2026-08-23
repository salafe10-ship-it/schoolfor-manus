import { AccountingPeriod, JournalEntry, Invoice, CollectionReceipt, TreasuryTransaction, Voucher } from '../../types';
import { FallbackStorage } from '../repositories/FallbackStorage';

export interface ClosingValidationData {
  unpostedCount: number;
  unbalancedCount: number;
  discrepancyAmount: number;
  pendingInvoicesCount: number;
  pendingInvoicesAmount: number;
  pendingReceiptsCount: number;
  pendingReceiptsAmount: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  errors: string[];
}

export interface YearClosingValidationData {
  openPeriodsCount: number;
  openPeriodNames: string[];
}

export interface ReopenValidationData {
  reasonLength: number;
  isAlreadyOpen: boolean;
}

export class FinancialClosingValidator {
  /**
   * Compiles technical metrics for monthly period closing validation.
   */
  public static async validatePeriodClosing(
    schoolId: string,
    period: AccountingPeriod,
    allEntries: JournalEntry[],
    glLines: any[]
  ): Promise<ClosingValidationData> {
    FallbackStorage.assertCanonicalPersistence('period closing validation reads');
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);

    // Filter journals for the period
    const periodEntries = allEntries.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end && (e as any).schoolId === schoolId;
    });

    const unpostedCount = periodEntries.filter(e => e.status === 'draft').length;
    const unbalancedCount = periodEntries.filter(e => Math.abs(e.totalDebit - e.totalCredit) > 0.001).length;

    // General ledger line discrepancy checks
    const periodGLLines = glLines.filter(gl => {
      const d = new Date(gl.date);
      return d >= start && d <= end && gl.schoolId === schoolId;
    });

    const sumDebit = periodGLLines.reduce((sum, line) => sum + line.debit, 0);
    const sumCredit = periodGLLines.reduce((sum, line) => sum + line.credit, 0);
    const discrepancyAmount = parseFloat(Math.abs(sumDebit - sumCredit).toFixed(2));

    // Get pending invoices
    const allInvoices = FallbackStorage.getInvoices().filter(inv => inv.schoolId === schoolId);
    const periodInvoices = allInvoices.filter(inv => {
      const d = new Date(inv.dueDate);
      return d >= start && d <= end;
    });
    const pendingInvoices = periodInvoices.filter(inv => inv.status === 'Draft' || inv.status === 'Pending Approval');
    const pendingInvoicesCount = pendingInvoices.length;
    const pendingInvoicesAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || inv.totalAmount || 0), 0);

    // Get pending receipts
    const allReceipts = FallbackStorage.getCollectionReceipts().filter(rec => rec.schoolId === schoolId);
    const periodReceipts = allReceipts.filter(rec => {
      const d = new Date(rec.collectedAt);
      return d >= start && d <= end;
    });
    const pendingReceipts = periodReceipts.filter(rec => rec.status === 'Draft' || rec.status === 'Pending Approval');
    const pendingReceiptsCount = pendingReceipts.length;
    const pendingReceiptsAmount = pendingReceipts.reduce((sum, rec) => sum + (rec.amount || 0), 0);

    // Get pending payments (withdrawing treasury transactions or draft vouchers)
    const allTreasury = FallbackStorage.getTreasuryTransactions().filter(tx => tx.schoolId === schoolId);
    const periodTreasury = allTreasury.filter(tx => {
      const d = new Date(tx.transactionDate);
      return d >= start && d <= end;
    });
    const pendingTreasury = periodTreasury.filter(tx => 
      (tx.type === 'Withdrawal' || tx.type === 'Transfer') && 
      (tx.status === 'Draft' || tx.status === 'Pending Approval')
    );

    const allVouchers = FallbackStorage.getVouchers().filter(v => (v as any).schoolId === schoolId);
    const periodVouchers = allVouchers.filter(v => {
      const d = new Date(v.date);
      return d >= start && d <= end;
    });
    const pendingVouchers = periodVouchers.filter(v => v.status === 'draft' && v.type === 'payment');

    const pendingPaymentsCount = pendingTreasury.length + pendingVouchers.length;
    const pendingPaymentsAmount = 
      pendingTreasury.reduce((sum, tx) => sum + (tx.amount || 0), 0) + 
      pendingVouchers.reduce((sum, v) => sum + (v.amount || 0), 0);

    // Compile Arabic errors for integrity violations
    const errors: string[] = [];
    if (unpostedCount > 0) {
      errors.push(`تنبيه حرج: يوجد عدد (${unpostedCount}) قيود يومية معلقة بالحالة "مسودة". يجب ترحيلها أو حذفها لضمان مطابقة ميزان المراجعة.`);
    }
    if (unbalancedCount > 0) {
      errors.push(`تنبيه حرج: تم رصد عدد (${unbalancedCount}) قيود غير متوازنة محاسبياً (المدين لا يساوي الدائن). يمنع إقفال الفترة قطعياً.`);
    }
    if (discrepancyAmount > 0.01) {
      errors.push(`تنبيه حرج: يوجد فروقات ترحيل غير متطابقة في ميزان الأستاذ العام بقيمة: ${discrepancyAmount} د.ل.`);
    }
    if (pendingInvoicesCount > 0) {
      errors.push(`تنبيه حرج: يوجد عدد (${pendingInvoicesCount}) فواتير رسوم دراسية معلقة بالحالة "مسودة" بقيمة إجمالية ${pendingInvoicesAmount} د.ل.`);
    }
    if (pendingReceiptsCount > 0) {
      errors.push(`تنبيه حرج: يوجد عدد (${pendingReceiptsCount}) سندات قبض مالي معلقة بالحالة "مسودة" بقيمة إجمالية ${pendingReceiptsAmount} د.ل.`);
    }
    if (pendingPaymentsCount > 0) {
      errors.push(`تنبيه حرج: يوجد عدد (${pendingPaymentsCount}) عمليات صرف مالي (أو سندات صرف) معلقة بالحالة "مسودة" بقيمة إجمالية ${pendingPaymentsAmount} د.ل.`);
    }

    return {
      unpostedCount,
      unbalancedCount,
      discrepancyAmount,
      pendingInvoicesCount,
      pendingInvoicesAmount,
      pendingReceiptsCount,
      pendingReceiptsAmount,
      pendingPaymentsCount,
      pendingPaymentsAmount,
      errors
    };
  }

  /**
   * Compiles technical metrics for daily closing validation.
   */
  public static async validateDailyClosing(
    schoolId: string,
    dateStr: string
  ): Promise<ClosingValidationData> {
    FallbackStorage.assertCanonicalPersistence('daily closing validation reads');
    const date = new Date(dateStr);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Filter journals for the day
    const allEntries = FallbackStorage.getJournalEntries().filter(e => (e as any).schoolId === schoolId);
    const dayEntries = allEntries.filter(e => {
      const d = new Date(e.date);
      return d >= startOfDay && d <= endOfDay;
    });

    const unpostedCount = dayEntries.filter(e => e.status === 'draft').length;
    const unbalancedCount = dayEntries.filter(e => Math.abs(e.totalDebit - e.totalCredit) > 0.001).length;

    // Filter GL discrepancy
    const glLines = FallbackStorage.getGeneralLedgerLines().filter(gl => gl.schoolId === schoolId);
    const dayGLLines = glLines.filter(gl => {
      const d = new Date(gl.date);
      return d >= startOfDay && d <= endOfDay;
    });
    const sumDebit = dayGLLines.reduce((sum, line) => sum + line.debit, 0);
    const sumCredit = dayGLLines.reduce((sum, line) => sum + line.credit, 0);
    const discrepancyAmount = parseFloat(Math.abs(sumDebit - sumCredit).toFixed(2));

    // Get pending invoices
    const allInvoices = FallbackStorage.getInvoices().filter(inv => inv.schoolId === schoolId);
    const dayInvoices = allInvoices.filter(inv => {
      const d = new Date(inv.dueDate);
      return d >= startOfDay && d <= endOfDay;
    });
    const pendingInvoices = dayInvoices.filter(inv => inv.status === 'Draft' || inv.status === 'Pending Approval');
    const pendingInvoicesCount = pendingInvoices.length;
    const pendingInvoicesAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || inv.totalAmount || 0), 0);

    // Get pending receipts
    const allReceipts = FallbackStorage.getCollectionReceipts().filter(rec => rec.schoolId === schoolId);
    const dayReceipts = allReceipts.filter(rec => {
      const d = new Date(rec.collectedAt);
      return d >= startOfDay && d <= endOfDay;
    });
    const pendingReceipts = dayReceipts.filter(rec => rec.status === 'Draft' || rec.status === 'Pending Approval');
    const pendingReceiptsCount = pendingReceipts.length;
    const pendingReceiptsAmount = pendingReceipts.reduce((sum, rec) => sum + (rec.amount || 0), 0);

    // Get pending payments
    const allTreasury = FallbackStorage.getTreasuryTransactions().filter(tx => tx.schoolId === schoolId);
    const dayTreasury = allTreasury.filter(tx => {
      const d = new Date(tx.transactionDate);
      return d >= startOfDay && d <= endOfDay;
    });
    const pendingTreasury = dayTreasury.filter(tx => 
      (tx.type === 'Withdrawal' || tx.type === 'Transfer') && 
      (tx.status === 'Draft' || tx.status === 'Pending Approval')
    );

    const allVouchers = FallbackStorage.getVouchers().filter(v => (v as any).schoolId === schoolId);
    const dayVouchers = allVouchers.filter(v => {
      const d = new Date(v.date);
      return d >= startOfDay && d <= endOfDay;
    });
    const pendingVouchers = dayVouchers.filter(v => v.status === 'draft' && v.type === 'payment');

    const pendingPaymentsCount = pendingTreasury.length + pendingVouchers.length;
    const pendingPaymentsAmount = 
      pendingTreasury.reduce((sum, tx) => sum + (tx.amount || 0), 0) + 
      pendingVouchers.reduce((sum, v) => sum + (v.amount || 0), 0);

    const errors: string[] = [];
    if (unpostedCount > 0) {
      errors.push(`يوجد عدد (${unpostedCount}) قيود يومية معلقة اليوم بالحالة "مسودة".`);
    }
    if (unbalancedCount > 0) {
      errors.push(`تم رصد عدد (${unbalancedCount}) قيود غير متطابقة لليوم.`);
    }
    if (discrepancyAmount > 0.01) {
      errors.push(`يوجد فروق ترحيل في ميزان الأستاذ العام لليوم بقيمة: ${discrepancyAmount} د.ل.`);
    }
    if (pendingInvoicesCount > 0) {
      errors.push(`يوجد عدد (${pendingInvoicesCount}) فواتير رسوم معلقة لليوم بقيمة ${pendingInvoicesAmount} د.ل.`);
    }
    if (pendingReceiptsCount > 0) {
      errors.push(`يوجد عدد (${pendingReceiptsCount}) سندات قبض مالي معلقة لليوم بقيمة ${pendingReceiptsAmount} د.ل.`);
    }
    if (pendingPaymentsCount > 0) {
      errors.push(`يوجد عدد (${pendingPaymentsCount}) مستندات صرف مالي معلقة لليوم بقيمة ${pendingPaymentsAmount} د.ل.`);
    }

    return {
      unpostedCount,
      unbalancedCount,
      discrepancyAmount,
      pendingInvoicesCount,
      pendingInvoicesAmount,
      pendingReceiptsCount,
      pendingReceiptsAmount,
      pendingPaymentsCount,
      pendingPaymentsAmount,
      errors
    };
  }

  /**
   * Compiles technical metrics for fiscal year-end closing validation.
   */
  public static async validateFiscalYearClosing(
    schoolId: string,
    periods: AccountingPeriod[]
  ): Promise<YearClosingValidationData> {
    const openPeriods = periods.filter(p => p.status === 'open');
    return {
      openPeriodsCount: openPeriods.length,
      openPeriodNames: openPeriods.map(p => p.periodName)
    };
  }

  /**
   * Compiles technical metrics for reopening a period.
   */
  public static async validatePeriodReopening(
    schoolId: string,
    period: AccountingPeriod,
    reason: string
  ): Promise<ReopenValidationData> {
    return {
      reasonLength: (reason || '').trim().length,
      isAlreadyOpen: period.status === 'open'
    };
  }
}
