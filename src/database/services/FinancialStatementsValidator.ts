import { JournalEntry, TrialBalanceItem } from '../../types';
import { FinancialStatementsDomainRules } from './FinancialStatementsDomainRules';
import { FinancialStatementsPolicyService } from './FinancialStatementsPolicyService';

export interface StatementsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class FinancialStatementsValidator {

  /**
   * Validate a financial statements generation request before execution
   */
  public static async validateStatementsRequest(
    schoolId: string,
    requestSchoolId: string,
    periodStatus: string,
    entries: JournalEntry[],
    trialBalance: TrialBalanceItem[],
    hasSnapshot: boolean,
    requireSnapshot: boolean
  ): Promise<StatementsValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Verify tenant boundary
    try {
      FinancialStatementsDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);
    } catch (err: any) {
      errors.push(err.message);
    }

    // 2. Verify period approval
    try {
      FinancialStatementsDomainRules.verifyPeriodIsApproved(periodStatus);
    } catch (err: any) {
      errors.push(err.message);
    }

    // 3. Verify snapshot requirement if period is closed
    try {
      FinancialStatementsDomainRules.verifySnapshotRequirement(periodStatus, hasSnapshot, requireSnapshot);
    } catch (err: any) {
      errors.push(err.message);
    }

    // 4. Verify trial balance balance
    try {
      FinancialStatementsDomainRules.verifyTrialBalanceBalanced(trialBalance);
    } catch (err: any) {
      errors.push(err.message);
    }

    // 5. Verify only posted entries
    try {
      const policy = await FinancialStatementsPolicyService.getStatementsPolicy(schoolId);
      if (!policy.allowUnpostedDraftsInStatements) {
        FinancialStatementsDomainRules.verifyOnlyPostedEntries(entries);
      } else {
        const draftCount = entries.filter(e => e.status === 'draft').length;
        if (draftCount > 0) {
          warnings.push(`تنبيه: يتم بناء القوائم المالية باستخدام قيود مسودة غير مرحلة (${draftCount} قيود) بناءً على إعدادات السياسة.`);
        }
      }
    } catch (err: any) {
      errors.push(err.message);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
