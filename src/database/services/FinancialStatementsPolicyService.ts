import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { EnterpriseLogger } from './EnterpriseLogger';

export interface StatementsPolicyConfig {
  allowUnpostedDraftsInStatements: boolean;
  strictDoubleEntryCheck: boolean;
  presentationBasis: 'Accrual' | 'Cash' | 'ModifiedAccrual';
  disclosureNotesRequired: boolean;
  strictTrialBalanceMatch: boolean;
}

export class FinancialStatementsPolicyService {

  /**
   * Get statements policy config by combining central configuration with defaults
   */
  public static async getStatementsPolicy(schoolId: string): Promise<StatementsPolicyConfig> {
    try {
      const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
      
      return {
        allowUnpostedDraftsInStatements: config?.generalLedger?.allowDirectJournalEdits ?? false,
        strictDoubleEntryCheck: config?.generalLedger?.requireDoubleEntry ?? true,
        presentationBasis: (config?.revenueRecognition?.method === 'Cash Basis') ? 'Cash' : 'Accrual',
        disclosureNotesRequired: true,
        strictTrialBalanceMatch: true
      };
    } catch (err) {
      EnterpriseLogger.warn('Statements configuration not found, using enterprise defaults.', 'FinancialStatementsPolicy');
      return {
        allowUnpostedDraftsInStatements: false,
        strictDoubleEntryCheck: true,
        presentationBasis: 'Accrual',
        disclosureNotesRequired: true,
        strictTrialBalanceMatch: true
      };
    }
  }

  /**
   * Apply exact rounding rules based on the corporate settings
   */
  public static applyRounding(amount: number, precision: number = 3): number {
    return Number(amount.toFixed(precision));
  }
}
