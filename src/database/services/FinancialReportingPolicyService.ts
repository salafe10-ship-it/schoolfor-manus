import { FinancialConfiguration } from '../../types';
import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { EnterpriseLogger } from './EnterpriseLogger';

export interface ReportingPolicyConfig {
  allowUnpostedDraftsInProvisionalReports: boolean;
  strictDoubleEntryCheck: boolean;
  reportingBasis: 'Accrual' | 'Cash' | 'ModifiedAccrual';
  disclosureNotesRequired: boolean;
}

export class FinancialReportingPolicyService {

  /**
   * Get reporting policy config by combining central configuration with reporting defaults
   */
  public static async getReportingPolicy(schoolId: string): Promise<ReportingPolicyConfig> {
    try {
      const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
      
      return {
        allowUnpostedDraftsInProvisionalReports: config?.generalLedger?.allowDirectJournalEdits ?? false,
        strictDoubleEntryCheck: config?.generalLedger?.requireDoubleEntry ?? true,
        reportingBasis: (config?.revenueRecognition?.method === 'Cash Basis') ? 'Cash' : 'Accrual',
        disclosureNotesRequired: true
      };
    } catch (err) {
      EnterpriseLogger.warn('Reporting configuration not found, using enterprise defaults.', 'FinancialReportingPolicy');
      return {
        allowUnpostedDraftsInProvisionalReports: false,
        strictDoubleEntryCheck: true,
        reportingBasis: 'Accrual',
        disclosureNotesRequired: true
      };
    }
  }

  /**
   * Apply exact rounding rules based on the corporate settings
   */
  public static applyPolicyRounding(amount: number, precision: number = 3): number {
    return Number(amount.toFixed(precision));
  }
}
