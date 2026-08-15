import { JournalEntry, GeneralLedger, TrialBalanceItem } from '../../types';

export class FinancialReportingDomainRules {

  /**
   * RULE 1: Multi-Tenant Shielding
   * Prevents reading across different schools (strict tenant security verification).
   */
  public static verifyMultiTenantBoundary(schoolId: string, requestSchoolId: string): void {
    if (schoolId !== requestSchoolId) {
      throw new Error(`انتهاك أمني متعدد المدارس: غير مسموح بالوصول لبيانات المدرسة [${requestSchoolId}] من حساب مدرسة [${schoolId}].`);
    }
  }

  /**
   * RULE 2: No Unposted Data in Official Ledger Reports
   * Prevents using draft or cancelled entries in official reports.
   */
  public static verifyOnlyPostedEntries(entries: JournalEntry[]): void {
    const unposted = entries.filter(e => e.status !== 'posted' && e.status !== 'approved');
    if (unposted.length > 0) {
      throw new Error(`مخالفة السياسة المحاسبية: يحتوي التقرير على قيود محاسبية غير مرحلة أو مسودة: [${unposted.map(u => u.id).join(', ')}].`);
    }
  }

  /**
   * RULE 3: Balanced Entry Double-Entry Verification
   * Prevents using unbalanced journal entries.
   */
  public static verifyDoubleEntryBalance(entries: JournalEntry[]): void {
    for (const entry of entries) {
      const diff = Math.abs(entry.totalDebit - entry.totalCredit);
      if (diff > 0.001) {
        throw new Error(`فشل التحقق الثنائي: القيد المحاسبي رقم [${entry.id}] غير متوازن. الفرق: ${diff}.`);
      }
    }
  }

  /**
   * RULE 4: No reports during active closing state
   * Prevents extracting a report for a period that is actively undergoing closure.
   */
  public static verifyPeriodNotClosing(periodStatus: 'open' | 'closed' | 'closing' | string): void {
    if (periodStatus === 'closing') {
      throw new Error('العملية معلقة: لا يمكن استخراج التقارير المالية لهذه الفترة لأنها قيد الإقفال الفعلي حالياً.');
    }
  }

  /**
   * RULE 5: Mathematical Integrity check between General Ledger and Trial Balance
   * Compares ledger total debit/credit with trial balance totals.
   */
  public static verifyLedgerToTrialBalanceMatch(ledger: GeneralLedger[], trialBalance: TrialBalanceItem[]): void {
    const ledgerDebit = ledger.reduce((sum, line) => sum + line.debit, 0);
    const ledgerCredit = ledger.reduce((sum, line) => sum + line.credit, 0);

    const tbDebit = trialBalance.reduce((sum, item) => sum + item.periodDebit, 0);
    const tbCredit = trialBalance.reduce((sum, item) => sum + item.periodCredit, 0);

    const debitDiff = Math.abs(ledgerDebit - tbDebit);
    const creditDiff = Math.abs(ledgerCredit - tbCredit);

    if (debitDiff > 0.01 || creditDiff > 0.01) {
      throw new Error(`تعارض النواة المالية: يوجد تباين محاسبي غير مقبول بين الأستاذ العام وميزان المراجعة. فرق المدين: ${debitDiff}, فرق الدائن: ${creditDiff}.`);
    }
  }

  /**
   * RULE 6: Period Policy Check
   * Prevents extracting report for an unapproved period if company policy strictly forbids it.
   */
  public static verifyPeriodPolicy(periodStatus: string, allowUnapproved: boolean): void {
    if (periodStatus !== 'open' && periodStatus !== 'closed' && !allowUnapproved) {
      throw new Error('مخالفة سياسة التقارير: لا يسمح باستخراج التقارير لفترة مالية غير معتمدة أو معلقة وفقاً لسياسة الشركة الحالية.');
    }
  }
}
