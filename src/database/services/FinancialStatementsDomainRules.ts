import { JournalEntry, TrialBalanceItem } from '../../types';

export class FinancialStatementsDomainRules {

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
   * RULE 2: No Unposted Data in Official Statements
   * Prevents using draft or cancelled entries in official financial statements.
   */
  public static verifyOnlyPostedEntries(entries: JournalEntry[]): void {
    const unposted = entries.filter(e => e.status !== 'posted' && e.status !== 'approved');
    if (unposted.length > 0) {
      throw new Error(`مخالفة السياسة المالية: لا يمكن تكوين القوائم المالية باستخدام قيود محاسبية غير مرحلة أو مسودة: [${unposted.map(u => u.id).join(', ')}].`);
    }
  }

  /**
   * RULE 3: Balanced Trial Balance Check
   * Financial statements can only be built if the Trial Balance is perfectly balanced.
   */
  public static verifyTrialBalanceBalanced(trialBalance: TrialBalanceItem[]): void {
    const totalDebit = trialBalance.reduce((sum, item) => sum + (item.periodDebit || 0), 0);
    const totalCredit = trialBalance.reduce((sum, item) => sum + (item.periodCredit || 0), 0);
    
    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.01) {
      throw new Error(`خلل في ميزان المراجعة: لا يمكن إنشاء القوائم المالية لأن ميزان المراجعة غير متوازن. الفرق: ${diff}.`);
    }
  }

  /**
   * RULE 4: No Statements for Unapproved / Pending Period Statuses
   */
  public static verifyPeriodIsApproved(periodStatus: string): void {
    if (periodStatus !== 'open' && periodStatus !== 'closed') {
      throw new Error('مخالفة قواعد الحوكمة المالية: لا يمكن استخراج القوائم المالية لفترة مالية غير معتمدة أو معلقة.');
    }
  }

  /**
   * RULE 5: Snapshot Policy Compliance Check
   * Prevents statement generation if policy demands frozen snapshot but none exists.
   */
  public static verifySnapshotRequirement(periodStatus: string, hasSnapshot: boolean, requireSnapshot: boolean): void {
    if (periodStatus === 'closed' && requireSnapshot && !hasSnapshot) {
      throw new Error('انتهاك سياسة المراجعة: تتطلب سياسة النظام استخدام لقطة مالية مجمدة (Snapshot) للفترات المغلقة، ولكنها غير متوفرة حالياً.');
    }
  }
}
