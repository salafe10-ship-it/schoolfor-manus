import { 
  ICollectionAllocationStrategy, 
  OldestDueAllocationStrategy, 
  OldestInvoiceAllocationStrategy, 
  OldestInstallmentAllocationStrategy, 
  SpecificInvoiceAllocationStrategy, 
  SpecificInstallmentAllocationStrategy, 
  ProportionalAllocationStrategy, 
  ManualAllocationStrategy, 
  CustomerPreferenceAllocationStrategy, 
  FallbackReceivableAllocationStrategy 
} from './CollectionAllocationStrategies';
import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { CollectionsPolicyService } from './CollectionsPolicyService';
import { EnterpriseLogger } from './EnterpriseLogger';

/**
 * Enterprise Collection Allocation Strategy Factory
 * Reads current system configuration and retrieves the appropriate modular strategy.
 */
export class CollectionAllocationStrategyFactory {
  /**
   * Retrieves the strategy based on Configuration-driven values or provided overrides.
   */
  public static async getStrategy(schoolId: string, policyOverride?: string): Promise<ICollectionAllocationStrategy> {
    let policyName = policyOverride;

    if (!policyName) {
      try {
        const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
        if (config && config.collections && config.collections.allocationPolicy) {
          policyName = config.collections.allocationPolicy;
        }
      } catch (err: any) {
        EnterpriseLogger.warn('Could not retrieve FinancialConfiguration, falling back to service default.', 'CollectionAllocationStrategyFactory', { error: err?.message || err });
      }
    }

    if (!policyName) {
      policyName = CollectionsPolicyService.getPolicy(schoolId).defaultPolicy;
    }

    // Direct routing to the matching class based on configurations
    switch (policyName) {
      case 'Oldest Due First':
      case 'FIFO':
      case 'LIFO':
        return new OldestDueAllocationStrategy();
      case 'Oldest Invoice First':
        return new OldestInvoiceAllocationStrategy();
      case 'Oldest Installment First':
        return new OldestInstallmentAllocationStrategy();
      case 'Specific Invoice':
        return new SpecificInvoiceAllocationStrategy();
      case 'Specific Installment':
        return new SpecificInstallmentAllocationStrategy();
      case 'Proportional Allocation':
      case 'PRO_RATA':
        return new ProportionalAllocationStrategy();
      case 'Manual Allocation':
      case 'MANUAL':
        return new ManualAllocationStrategy();
      case 'Customer Preference':
        return new CustomerPreferenceAllocationStrategy();
      default:
        // Safe default fallback routing to prevent technical drift
        return new FallbackReceivableAllocationStrategy();
    }
  }
}
