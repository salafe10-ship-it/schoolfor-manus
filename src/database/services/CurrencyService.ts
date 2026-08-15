import { CurrencyRepository } from '../repositories/CurrencyRepository';
import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { CurrencyProfile, CurrencyMaster } from '../../types';
import { EnterpriseLogger } from './EnterpriseLogger';

export class CurrencyService {
  /**
   * Main formatting entry point.
   * Pulls the configuration dynamically from the school profile, or formats using neutral defaults if not configured.
   */
  public static async formatAmount(
    amount: number | string,
    schoolId: string,
    isOfficialDocument: boolean = true
  ): Promise<string> {
    const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    try {
      const profile = await CurrencyRepository.getSchoolProfile(schoolId);
      return CurrencyRepository.formatWithProfile(num, profile);
    } catch (err: any) {
      EnterpriseLogger.warn(`Fallback formatting for school ${schoolId}:`, 'CurrencyService', { error: err?.message || err });
      const neutral = CurrencyRepository.getNeutralDefaults();
      return CurrencyRepository.formatWithProfile(num, neutral);
    }
  }

  /**
   * Retreives the decimal precision defined for a school.
   */
  public static async getPrecision(schoolId: string): Promise<number> {
    try {
      const profile = await CurrencyRepository.getSchoolProfile(schoolId);
      return profile.decimalPrecision;
    } catch {
      return 2;
    }
  }

  /**
   * Retrieves the currency symbol defined for a school.
   */
  public static async getSymbol(schoolId: string): Promise<string> {
    try {
      const profile = await CurrencyRepository.getSchoolProfile(schoolId);
      return profile.currencySymbol;
    } catch {
      return '¤';
    }
  }

  /**
   * Convert amount from one currency to another dynamically.
   */
  public static convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    schoolId: string
  ): number {
    return CurrencyRepository.convertAmount(amount, fromCurrency, toCurrency, schoolId);
  }

  /**
   * Enterprise-wide Currency List.
   * Fetches the dynamic Currencies Master list from the database.
   */
  public static getActiveCurrencies(): CurrencyMaster[] {
    return CurrencyRepository.getAllCurrencies().filter(c => c.status === 'active');
  }

  /**
   * Perform automatic database seeding/migrations if any existing schools have legacy
   * SAR or JOD currency strings, ensuring absolute zero data loss (Backward Compatibility).
   */
  public static async performBackwardCompatibilitySync(schoolId: string): Promise<void> {
    try {
      const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
      const cur = config.currency;

      if (cur && (cur.code === 'SAR' || cur.code === 'JOD' || cur.code === 'LYD')) {
        // Ensure this currency is loaded from CurrencyMaster DB and activated
        const master = CurrencyRepository.getCurrencyByCode(cur.code);
        if (!master) {
          // If not exists, insert it
          await CurrencyRepository.addCurrency({
            isoCode: cur.code,
            currencyCode: cur.code,
            currencyName: cur.code === 'SAR' ? 'Saudi Riyal' : cur.code === 'JOD' ? 'Jordanian Dinar' : 'Libyan Dinar',
            nativeName: cur.code === 'SAR' ? 'ريال سعودي' : cur.code === 'JOD' ? 'دينار أردني' : 'دينار ليبي',
            currencySymbol: cur.symbol || '¤',
            decimalPrecision: cur.precision !== undefined ? cur.precision : 2,
            minorUnit: cur.code === 'SAR' ? 'halala' : 'fils',
            symbolPosition: cur.code === 'SAR' ? 'Right' : 'Right',
            thousandsSeparator: ',',
            decimalSeparator: '.',
            negativeNumberFormat: 'minus',
            status: 'active'
          }, 'system_financial', 'System Migration Service', schoolId);
        } else if (master.status !== 'active') {
          // Reactivate
          await CurrencyRepository.updateCurrency(master.id, { status: 'active' }, 'system_financial', 'System Migration Service', schoolId, 'Reactivating currency for backward compatibility');
        }
      }
    } catch (e: any) {
      EnterpriseLogger.error("Backward Compatibility Sync warning:", 'CurrencyService', { error: e?.message || e });
    }
  }
}
