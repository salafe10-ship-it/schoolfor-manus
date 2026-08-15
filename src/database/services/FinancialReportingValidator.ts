import { JournalEntry, GeneralLedger, TrialBalanceItem } from '../../types';
import { FinancialReportingDomainRules } from './FinancialReportingDomainRules';
import { FinancialReportingPolicyService } from './FinancialReportingPolicyService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class FinancialReportingValidator {

  /**
   * Validate a reporting request before execution
   */
  public static async validateReportRequest(
    schoolId: string,
    requestSchoolId: string,
    periodStatus: string,
    entries: JournalEntry[]
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Verify tenant boundary
      FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);
    } catch (err: any) {
      errors.push(err.message);
    }

    try {
      // 2. Verify period state is not currently closing
      FinancialReportingDomainRules.verifyPeriodNotClosing(periodStatus);
    } catch (err: any) {
      errors.push(err.message);
    }

    try {
      // 3. Verify that all journal entries are balanced
      FinancialReportingDomainRules.verifyDoubleEntryBalance(entries);
    } catch (err: any) {
      errors.push(err.message);
    }

    // Warnings if unposted entries exist
    const draftCount = entries.filter(e => e.status === 'draft').length;
    if (draftCount > 0) {
      warnings.push(`تنبيه: يحتوي التقرير على عدد (${draftCount}) قيود مسودة غير مرحلة قد تؤثر على دقة الأرصدة النهائية.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate that Trial Balance sum matches the General Ledger sum
   */
  public static validateLedgerConsistency(
    ledger: GeneralLedger[],
    trialBalance: TrialBalanceItem[]
  ): ValidationResult {
    const errors: string[] = [];
    try {
      FinancialReportingDomainRules.verifyLedgerToTrialBalanceMatch(ledger, trialBalance);
    } catch (err: any) {
      errors.push(err.message);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }
}
