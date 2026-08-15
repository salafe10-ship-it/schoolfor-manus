import { TreasuryRepository } from '../repositories/TreasuryRepository';
import { PaymentInstrumentType, PaymentInstrumentConfig } from '../../types';

export class PaymentInstrumentService {

  /**
   * Retrieves all payment instruments and their activation statuses
   */
  public static async getAvailableInstruments(): Promise<PaymentInstrumentConfig[]> {
    return await TreasuryRepository.getPaymentInstrumentConfigs();
  }

  /**
   * Verifies if a payment instrument is supported and currently enabled
   */
  public static async validateInstrumentAvailability(instrument: PaymentInstrumentType): Promise<void> {
    const configs = await TreasuryRepository.getPaymentInstrumentConfigs();
    const config = configs.find(c => c.instrument === instrument);
    
    if (!config) {
      throw new Error(`خطأ الدفع: وسيلة الدفع (${instrument}) غير مدعومة في نظام الخزينة والمدفوعات المركزي.`);
    }

    if (!config.isActive) {
      throw new Error(`خطأ الدفع: وسيلة الدفع (${instrument}) موقوفة حالياً بقرار إداري.`);
    }
  }

  /**
   * Configures a payment instrument, allowing new methods to be added dynamically
   */
  public static async configureInstrument(
    instrument: PaymentInstrumentType,
    isActive: boolean,
    notes?: string
  ): Promise<PaymentInstrumentConfig> {
    const configs = await TreasuryRepository.getPaymentInstrumentConfigs();
    const index = configs.findIndex(c => c.instrument === instrument);

    const newConfig: PaymentInstrumentConfig = {
      instrument,
      isActive,
      notes: notes || 'تم التحديث عبر مدير المدفوعات'
    };

    if (index !== -1) {
      configs[index] = newConfig;
    } else {
      configs.push(newConfig);
    }

    await TreasuryRepository.savePaymentInstrumentConfigs(configs);
    return newConfig;
  }
}
