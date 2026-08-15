import { AccountingPeriod } from '../../types';
import { BusinessRuleDecision, BusinessRuleSeverity } from '../types/BusinessRuleDecision';
import { BusinessRuleException } from '../errors/BusinessRuleException';

export class FinancialClosingDomainRules {
  /**
   * RULE 1: Strict Multi-Tenant Shielding
   * Prevents operations across different schools (strict tenant verification).
   */
  public static verifyMultiTenantBoundary(schoolId: string, requestSchoolId: string): void {
    if (schoolId !== requestSchoolId) {
      const decision: BusinessRuleDecision = {
        ruleCode: 'FC-RULE-001',
        ruleName: 'School Tenant Isolation Rule',
        decision: 'Deny',
        severity: BusinessRuleSeverity.Critical,
        userMessage: `انتهاك أمني للمدارس المتعددة: غير مسموح بالوصول لبيانات المدرسة [${requestSchoolId}] من حساب المدرسة [${schoolId}].`,
        technicalMessage: `Multi-tenant violation: Tenant mismatch. Active tenant [${schoolId}] attempted to perform operation on target tenant [${requestSchoolId}].`,
        recommendation: 'تأكد من تسجيل الدخول بالمستندات الصحيحة للمدرسة المطلوبة ومطابقة الرمز التعريفي للمنشأة.',
        category: 'Security / Multi-Tenancy',
        metadata: { schoolId, requestSchoolId }
      };
      throw new BusinessRuleException(decision);
    }
  }

  /**
   * RULE 2: No Unposted Entries Allowed
   * Prevents period closing if there are any journal entries in draft or unposted state.
   */
  public static verifyNoUnpostedEntries(unpostedCount: number): void {
    if (unpostedCount > 0) {
      const decision: BusinessRuleDecision = {
        ruleCode: 'FC-RULE-002',
        ruleName: 'No Unposted Entries Rule',
        decision: 'Deny',
        severity: BusinessRuleSeverity.Error,
        userMessage: `مخالفة قواعد الإقفال المالي: يمنع إغلاق الفترة المالية نظراً لوجود عدد (${unpostedCount}) قيود معلقة بالحالة مسودة.`,
        technicalMessage: `Closing blocked. There are ${unpostedCount} unposted (draft) journal entries in the target period.`,
        recommendation: 'قم بمراجعة وترحيل جميع القيود المعلقة (Draft) أو حذف غير المرغوب فيه منها قبل محاولة الإقفال.',
        category: 'Financial Closing / General Ledger',
        metadata: { unpostedCount }
      };
      throw new BusinessRuleException(decision);
    }
  }

  /**
   * RULE 3: Balanced Journal Entries Only
   * Prevents closing if there are unbalanced entries.
   */
  public static verifyNoUnbalancedEntries(unbalancedCount: number): void {
    if (unbalancedCount > 0) {
      const decision: BusinessRuleDecision = {
        ruleCode: 'FC-RULE-003',
        ruleName: 'Balanced Journal Entries Rule',
        decision: 'Deny',
        severity: BusinessRuleSeverity.Error,
        userMessage: `مخالفة قواعد الإقفال المالي: يمنع إغلاق الفترة المالية نظراً لوجود عدد (${unbalancedCount}) قيود غير متوازنة محاسبياً.`,
        technicalMessage: `Closing blocked. Found ${unbalancedCount} unbalanced journal entries where debits do not equal credits.`,
        recommendation: 'تأكد من توازن كافة أطراف القيود اليومية (المدين والدائن) المسجلة خلال الفترة.',
        category: 'Financial Closing / Journal Entries',
        metadata: { unbalancedCount }
      };
      throw new BusinessRuleException(decision);
    }
  }

  /**
   * RULE 4: No Posting Discrepancy Errors
   * Verification of ledger totals (Debits must exactly match Credits).
   */
  public static verifyLedgerTotals(discrepancyAmount: number): void {
    if (discrepancyAmount > 0.01) {
      const decision: BusinessRuleDecision = {
        ruleCode: 'FC-RULE-004',
        ruleName: 'Trial Balance Consistency Rule',
        decision: 'Deny',
        severity: BusinessRuleSeverity.Error,
        userMessage: `مخالفة الحوكمة الحسابية: يمنع إغلاق الفترة لوجود فروقات ترحيل غير متوازنة في ميزان المراجعة بقيمة: ${discrepancyAmount}`,
        technicalMessage: `Trial balance discrepancy detected. Total debits and credits differ by ${discrepancyAmount}, exceeding threshold of 0.01.`,
        recommendation: 'قم بتشغيل مطابقة الأرصدة وإعادة ترحيل الحسابات المتأثرة لحل الاختلاف المالي.',
        category: 'Financial Closing / Trial Balance',
        metadata: { discrepancyAmount }
      };
      throw new BusinessRuleException(decision);
    }
  }

  /**
   * RULE 5: No Duplicate Closures
   * Prevents re-closing an already closed period.
   */
  public static verifyPeriodNotClosed(period: AccountingPeriod): void {
    if (period.status === 'closed') {
      const decision: BusinessRuleDecision = {
        ruleCode: 'FC-RULE-005',
        ruleName: 'Period Closing Status Rule',
        decision: 'Deny',
        severity: BusinessRuleSeverity.Warning,
        userMessage: `مخالفة قواعد الإقفال المالي: الفترة المالية (${period.periodName}) مغلقة بالفعل مسبقاً.`,
        technicalMessage: `Target period [${period.id}] is already in 'closed' status.`,
        recommendation: 'لا يتطلب هذا الإجراء أي عمل، الفترة مغلقة بالفعل. قم بإعادة فتحها أولاً إذا لزم التعديل.',
        category: 'Financial Closing / Status Validation',
        metadata: { periodId: period.id, status: period.status }
      };
      throw new BusinessRuleException(decision);
    }
  }

  /**
   * RULE 6: Strict Reopening Authorization
   * Prevents opening/reopening a closed period unless system-approved policy is met (authorized reason with min length).
   */
  public static verifyReopeningReason(reason: string, minLength: number): void {
    if (!reason || reason.trim().length < minLength) {
      const decision: BusinessRuleDecision = {
        ruleCode: 'FC-RULE-006',
        ruleName: 'Reopening Policy Authorization Rule',
        decision: 'Deny',
        severity: BusinessRuleSeverity.Error,
        userMessage: `مخالفة سياسة النظام المالي: يتطلب إعادة فتح الفترة المالية المغلقة تقديم مبرر تدقيقي معتمد لا يقل عن ${minLength} أحرف.`,
        technicalMessage: `Reopening reason length [${reason ? reason.length : 0}] is shorter than minimum policy requirement of ${minLength} characters.`,
        recommendation: `يرجى تقديم شرح وافٍ ومبرر رسمي لأغراض الرقابة وتدقيق الحسابات بحد أدنى ${minLength} أحرف.`,
        category: 'Financial Closing / Authorization Policy',
        metadata: { reasonLength: reason ? reason.length : 0, requiredMinLength: minLength }
      };
      throw new BusinessRuleException(decision);
    }
  }

  /**
   * RULE 7: Period Belonging Check
   * Prevents closing a period that belongs to another school.
   */
  public static verifyPeriodOwnership(period: AccountingPeriod, schoolId: string): void {
    if (period.schoolId !== schoolId) {
      const decision: BusinessRuleDecision = {
        ruleCode: 'FC-RULE-007',
        ruleName: 'Period Ownership Verification Rule',
        decision: 'Deny',
        severity: BusinessRuleSeverity.Critical,
        userMessage: `انتهاك ملكية البيانات: الفترة المالية المحددة لا تنتمي إلى مدرسة [${schoolId}].`,
        technicalMessage: `Period [${period.id}] does not belong to active school tenant [${schoolId}].`,
        recommendation: 'يرجى التحقق من صحة اختيار الفترة والاتصال بمسؤول النظام في حال تكرار المشكلة.',
        category: 'Security / Ownership Verification',
        metadata: { periodId: period.id, periodSchoolId: period.schoolId, activeSchoolId: schoolId }
      };
      throw new BusinessRuleException(decision);
    }
  }

  /**
   * RULE 8: Fiscal Year Not Closed
   * Prevents double closing of a fiscal year.
   */
  public static verifyFiscalYearNotClosed(fromYearStatus: string): void {
    if (fromYearStatus === 'closed') {
      const decision: BusinessRuleDecision = {
        ruleCode: 'FC-RULE-008',
        ruleName: 'Fiscal Year Closing Status Rule',
        decision: 'Deny',
        severity: BusinessRuleSeverity.Warning,
        userMessage: 'مخالفة قواعد الإقفال المالي: السنة المالية مغلقة بالفعل مسبقاً ولا يمكن إقفالها مجدداً.',
        technicalMessage: "Fiscal year status is already 'closed'.",
        recommendation: 'السنة مغلقة بالكامل مسبقاً، ولا يمكن إجراء تدوير أو إغلاق إضافي.',
        category: 'Financial Closing / Fiscal Year',
        metadata: { fromYearStatus }
      };
      throw new BusinessRuleException(decision);
    }
  }

  /**
   * RULE 9: No Open Periods in Fiscal Year
   * All months must be closed prior to yearly closing.
   */
  public static verifyNoOpenPeriodsInYear(openPeriodsCount: number, openPeriodNames: string[]): void {
    if (openPeriodsCount > 0) {
      const decision: BusinessRuleDecision = {
        ruleCode: 'FC-RULE-009',
        ruleName: 'Sequential Closing Integrity Rule',
        decision: 'Deny',
        severity: BusinessRuleSeverity.Error,
        userMessage: `مخالفة سياسة الإقفال السنوي: يمنع إقفال السنة المالية لعدم اكتمال إقفال كافة الأشهر التابعة لها: [${openPeriodNames.join(', ')}].`,
        technicalMessage: `Cannot close fiscal year. Found ${openPeriodsCount} open periods: [${openPeriodNames.join(', ')}].`,
        recommendation: 'قم بإقفال كافة الفترات الشهرية المتبقية للسنة المالية المحددة قبل محاولة إقفال السنة بالكامل.',
        category: 'Financial Closing / Sequential Closing',
        metadata: { openPeriodsCount, openPeriodNames }
      };
      throw new BusinessRuleException(decision);
    }
  }

  /**
   * RULE 10: Period Closed For Reopening
   * Only closed periods can be reopened.
   */
  public static verifyPeriodClosedForReopening(period: AccountingPeriod): void {
    if (period.status === 'open') {
      const decision: BusinessRuleDecision = {
        ruleCode: 'FC-RULE-010',
        ruleName: 'Reopening Target Status Rule',
        decision: 'Deny',
        severity: BusinessRuleSeverity.Warning,
        userMessage: 'مخالفة سياسة إعادة الفتح: الفترة المالية مفتوحة بالفعل ولا تحتاج لإعادة فتح محاسبي.',
        technicalMessage: `Reopen command ignored. Period [${period.id}] is currently 'open'.`,
        recommendation: 'لا داعي لإعادة الفتح، الفترة مفتوحة بالفعل ومتاحة للتسجيل والترحيل.',
        category: 'Financial Closing / Status Validation',
        metadata: { periodId: period.id, status: period.status }
      };
      throw new BusinessRuleException(decision);
    }
  }
}
