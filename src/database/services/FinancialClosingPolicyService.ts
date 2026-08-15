import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { ClosingPolicyConfig } from '../repositories/FinancialClosingTypes';
import { EnterpriseLogger } from './EnterpriseLogger';

export class FinancialClosingPolicyService {
  /**
   * Get the Closing Policy Configuration based on central ERP settings with secure defaults
   */
  public static async getClosingPolicy(schoolId: string): Promise<ClosingPolicyConfig> {
    try {
      const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
      
      return {
        requireAuditOverrideForReopening: true,
        minReasonLength: 5,
        strictTrialBalanceMatch: config?.generalLedger?.requireDoubleEntry ?? true,
        allowForceCloseWithDiscrepancy: false
      };
    } catch (err) {
      EnterpriseLogger.warn(
        'Closing configuration not found, applying default strict enterprise policies.',
        'FinancialClosingPolicy'
      );
      return {
        requireAuditOverrideForReopening: true,
        minReasonLength: 5,
        strictTrialBalanceMatch: true,
        allowForceCloseWithDiscrepancy: false
      };
    }
  }
}
