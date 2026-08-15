import { TreasuryRepository } from '../repositories/TreasuryRepository';
import { PaymentInstrumentType, PaymentInstrumentConfig } from '../../types';

export interface TreasuryPolicy {
  schoolId: string;
  allowGlobalNegativeBalances: boolean;
  defaultMainChestId?: string;
  defaultBranchChestId?: string;
  defaultBankAccountId?: string;
}

export class TreasuryPolicyService {
  private static policies: Record<string, TreasuryPolicy> = {};

  /**
   * Retrieves the treasury policy for a given school (instantiates defaults if not present)
   */
  public static getPolicy(schoolId: string): TreasuryPolicy {
    if (!this.policies[schoolId]) {
      this.policies[schoolId] = {
        schoolId,
        allowGlobalNegativeBalances: false,
      };
    }
    return this.policies[schoolId];
  }

  /**
   * Updates the treasury policy parameters
   */
  public static updatePolicy(schoolId: string, updates: Partial<TreasuryPolicy>): TreasuryPolicy {
    const current = this.getPolicy(schoolId);
    this.policies[schoolId] = {
      ...current,
      ...updates
    };
    return this.policies[schoolId];
  }

  /**
   * Checks if a payment instrument is globally active/enabled across the system
   */
  public static async isInstrumentEnabled(instrument: PaymentInstrumentType): Promise<boolean> {
    const configs = await TreasuryRepository.getPaymentInstrumentConfigs();
    const config = configs.find(c => c.instrument === instrument);
    return config ? config.isActive : false;
  }

  /**
   * Toggles a payment instrument's active state
   */
  public static async setInstrumentStatus(instrument: PaymentInstrumentType, isActive: boolean): Promise<void> {
    const configs = await TreasuryRepository.getPaymentInstrumentConfigs();
    const index = configs.findIndex(c => c.instrument === instrument);
    if (index !== -1) {
      configs[index].isActive = isActive;
    } else {
      configs.push({ instrument, isActive, notes: 'تمت إضافتها وتعديل حالتها عبر إدارة السياسات' });
    }
    await TreasuryRepository.savePaymentInstrumentConfigs(configs);
  }
}
