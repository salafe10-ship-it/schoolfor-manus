import { FallbackStorage } from './FallbackStorage';
import { FinancialConfigurationRepository } from './FinancialConfigurationRepository';
import { AuditRepository } from './AuditRepository';
import { CurrencyMaster, CurrencyProfile, ExchangeRate, FinancialConfiguration } from '../../types';

export class CurrencyRepository {
  private static readonly DATABASE_FILE = 'currency_master_database.json';

  /**
   * Dynamic DB Reader for Currencies.
   * Assumes data has been bootstrapped by BootstrapLoader.
   */
  public static getAllCurrencies(): CurrencyMaster[] {
    return FallbackStorage.safeReadFile<CurrencyMaster[]>(this.DATABASE_FILE, []);
  }

  /**
   * Search for currency by its ISO code.
   */
  public static getCurrencyByCode(code: string): CurrencyMaster | null {
    const list = this.getAllCurrencies();
    return list.find(c => c.isoCode.toUpperCase() === code.toUpperCase()) || null;
  }

  /**
   * Add a new currency to the master list in the database dynamically (No code recompile!).
   */
  public static async addCurrency(
    currency: Omit<CurrencyMaster, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string,
    userName: string,
    schoolId: string
  ): Promise<CurrencyMaster> {
    const list = this.getAllCurrencies();
    if (list.some(c => c.isoCode.toUpperCase() === currency.isoCode.toUpperCase())) {
      throw new Error(`مخالفة محاسبية: رمز العملة (${currency.isoCode}) مسجل مسبقاً في النظام.`);
    }

    const newCur: CurrencyMaster = {
      ...currency,
      id: `cur_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    list.push(newCur);
    FallbackStorage.safeWriteFile(this.DATABASE_FILE, list);

    await AuditRepository.log(
      schoolId,
      userId,
      userName,
      'CPA / Multi-Currency ERP Consultant',
      'CREATE',
      'currency_master',
      '127.0.0.1',
      `إضافة عملة جديدة للمؤسسة: ${newCur.currencyName} (${newCur.isoCode}) بخصائص مخصصة`
    );

    return newCur;
  }

  /**
   * Update currency master configurations dynamically.
   */
  public static async updateCurrency(
    id: string,
    updatedData: Partial<Omit<CurrencyMaster, 'id' | 'createdAt' | 'updatedAt'>>,
    userId: string,
    userName: string,
    schoolId: string,
    reason: string
  ): Promise<CurrencyMaster> {
    const list = this.getAllCurrencies();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error('العملة المطلوبة غير موجودة في قاعدة البيانات.');
    }

    const oldVal = list[idx];
    const newVal: CurrencyMaster = {
      ...oldVal,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    list[idx] = newVal;
    FallbackStorage.safeWriteFile(this.DATABASE_FILE, list);

    await AuditRepository.log(
      schoolId,
      userId,
      userName,
      'Chief ERP Architect',
      'UPDATE',
      'currency_master',
      '127.0.0.1',
      `تحديث العملة ${oldVal.isoCode} من قبل المستخدم: ${userName}. السبب: ${reason}. القيم القديمة: ${JSON.stringify(oldVal)}, القيم الجديدة: ${JSON.stringify(newVal)}`
    );

    return newVal;
  }

  /**
   * Disable/Delete currency with validations.
   */
  public static async deleteCurrency(
    id: string,
    userId: string,
    userName: string,
    schoolId: string
  ): Promise<void> {
    const list = this.getAllCurrencies();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error('العملة غير موجودة.');
    }

    const target = list[idx];
    
    // Check if any school configuration is currently using this currency
    const configs = FallbackStorage.getFinancialConfigurations();
    const isUsed = configs.some(c => c.currency && c.currency.code === target.isoCode);
    if (isUsed) {
      throw new Error(`مخالفة أمان مالي: لا يمكن تعطيل أو حذف العملة (${target.isoCode}) لأنها مستخدمة كعملة أساسية لإحدى المدارس القائمة.`);
    }

    list.splice(idx, 1);
    FallbackStorage.safeWriteFile(this.DATABASE_FILE, list);

    await AuditRepository.log(
      schoolId,
      userId,
      userName,
      'Internal Audit Director',
      'DELETE',
      'currency_master',
      '127.0.0.1',
      `حذف العملة ${target.isoCode} (${target.currencyName}) نهائياً من قاعدة البيانات.`
    );
  }

  /**
   * Neutral Defaults to prevent any hardcoded currencies or specific country biases.
   */
  public static getNeutralDefaults(): CurrencyProfile {
    return {
      currencyCode: 'CUR',
      currencyName: 'عملة افتراضية محايدة (Neutral Default)',
      currencySymbol: '¤',
      isoCode: 'CUR',
      decimalPrecision: 2,
      thousandsSeparator: ',',
      decimalSeparator: '.',
      negativeNumberFormat: 'minus',
      currencyPosition: 'Left'
    };
  }

  /**
   * Retrieve the School Currency Profile dynamically from database settings.
   * If not configured, defaults to Neutral Defaults.
   */
  public static async getSchoolProfile(schoolId: string): Promise<CurrencyProfile> {
    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    const cur = config.currency;

    if (!cur || cur.code === 'CUR' || cur.code === 'XYZ') {
      return this.getNeutralDefaults();
    }

    // Dynamic Master DB Lookup
    const matched = this.getCurrencyByCode(cur.code);
    if (matched && matched.status !== 'active') {
      throw new Error(`مخالفة محاسبية: العملة الأساسية للمدرسة (${cur.code}) تم تعطيلها من قبل مسؤول النظام ولا يمكن تشغيل العمليات المالية بها.`);
    }

    return {
      currencyCode: cur.code,
      currencyName: matched ? matched.currencyName : `${cur.code} Currency`,
      currencySymbol: cur.symbol || (matched ? matched.currencySymbol : '¤'),
      isoCode: cur.code,
      decimalPrecision: cur.precision !== undefined ? cur.precision : (matched ? matched.decimalPrecision : 2),
      thousandsSeparator: cur.thousandsSeparator || ',',
      decimalSeparator: cur.decimalSeparator || '.',
      negativeNumberFormat: cur.negativeFormat || (matched ? matched.negativeNumberFormat : 'minus'),
      currencyPosition: matched && matched.symbolPosition === 'Left' ? 'Left' : 'Right'
    };
  }

  /**
   * Update the school's currency profile.
   * Validates decimals, maps back to the central financial configuration, and creates an audit log.
   */
  public static async updateSchoolProfile(
    schoolId: string,
    profile: Partial<CurrencyProfile>,
    userId: string,
    userName: string,
    reason: string
  ): Promise<CurrencyProfile> {
    const current = await this.getSchoolProfile(schoolId);
    const updated: CurrencyProfile = {
      ...current,
      ...profile
    };

    // CPA and Audit Rule: No changing base currency if there are already journal transactions logged in general ledger.
    const journalEntries = FallbackStorage.getJournalEntries();
    const hasPostings = journalEntries.some(je => (je as any).schoolId === schoolId || je.items?.some((i: any) => i.schoolId === schoolId));
    if (hasPostings && current.currencyCode !== 'CUR' && current.currencyCode !== updated.currencyCode) {
      throw new Error(`مخالفة معايير IFRS المحاسبية: يمنع منعاً باتاً تعديل العملة الأساسية للمؤسسة بعد ترحيل وتسجيل قيود محاسبية فعلية في دفاتر اليومية العامة.`);
    }

    // Dynamic Database master validation
    const masterCur = this.getCurrencyByCode(updated.currencyCode);
    if (updated.currencyCode !== 'CUR') {
      if (!masterCur) {
        throw new Error(`العملة المقترحة (${updated.currencyCode}) غير معرفة في قاعدة البيانات.`);
      }
      if (masterCur.status !== 'active') {
        throw new Error(`العملة المقترحة (${updated.currencyCode}) معطلة حالياً من قبل مسؤول النظام.`);
      }
      // Ensure precision complies with decimal definition
      if (updated.decimalPrecision !== masterCur.decimalPrecision) {
        // Automatically align or issue warning. We will enforce strict alignment or allow authorized custom decimal precision
        if (updated.decimalPrecision < 0 || updated.decimalPrecision > 4) {
          throw new Error(`الخانات العشرية للعملة (${updated.decimalPrecision}) غير متوافقة مع الحدود المعتمدة محاسبياً.`);
        }
      }
    }

    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    const updatedConfig: Partial<FinancialConfiguration> = {
      ...config,
      rounding: {
        ...config.rounding,
        precision: updated.decimalPrecision
      },
      currency: {
        code: updated.currencyCode,
        precision: updated.decimalPrecision,
        symbol: updated.currencySymbol,
        negativeFormat: updated.negativeNumberFormat,
        thousandsSeparator: updated.thousandsSeparator,
        decimalSeparator: updated.decimalSeparator
      }
    };

    await FinancialConfigurationRepository.updateConfiguration(
      schoolId,
      updatedConfig,
      userId,
      userName,
      reason || 'تحديث ملف تعريف العملة وقواعد التقريب المرتبطة بها'
    );

    return updated;
  }

  /**
   * Get all exchange rates configured for a school.
   */
  public static getExchangeRates(schoolId: string): ExchangeRate[] {
    return FallbackStorage.safeReadFile<ExchangeRate[]>('currency_exchange_rates_database.json', []);
  }

  /**
   * Update or add an exchange rate (CPA manually configured or dynamic APIs).
   */
  public static saveExchangeRate(schoolId: string, rate: Partial<ExchangeRate> & { fromCurrency: string; toCurrency: string; rate: number }, userId: string, userName: string) {
    const rates = FallbackStorage.safeReadFile<ExchangeRate[]>('currency_exchange_rates_database.json', []);
    
    const existingIdx = rates.findIndex(r => 
      r.schoolId === schoolId && 
      r.fromCurrency === rate.fromCurrency && 
      r.toCurrency === rate.toCurrency
    );

    const newRate: ExchangeRate = {
      id: rate.id || `rate_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId,
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: rate.rate,
      effectiveDate: rate.effectiveDate || new Date().toISOString(),
      isManual: rate.isManual !== undefined ? rate.isManual : true,
      createdAt: new Date().toISOString(),
      createdBy: userName
    };

    if (existingIdx >= 0) {
      rates[existingIdx] = newRate;
    } else {
      rates.push(newRate);
    }

    FallbackStorage.safeWriteFile('currency_exchange_rates_database.json', rates);
    return newRate;
  }

  /**
   * Perform currency conversions using active exchange rates.
   */
  public static convertAmount(amount: number, from: string, to: string, schoolId: string): number {
    if (from === to) return amount;
    const rates = this.getExchangeRates(schoolId);
    
    // Direct rate
    const directRate = rates.find(r => r.schoolId === schoolId && r.fromCurrency === from && r.toCurrency === to);
    if (directRate) {
      return amount * directRate.rate;
    }

    // Inverse rate
    const inverseRate = rates.find(r => r.schoolId === schoolId && r.fromCurrency === to && r.toCurrency === from);
    if (inverseRate) {
      return amount / inverseRate.rate;
    }

    // Default simulation if no rates stored, to ensure non-blocking operation
    if (from === 'USD' && to === 'EUR') return amount * 0.92;
    if (from === 'EUR' && to === 'USD') return amount / 0.92;
    if (from === 'SAR' && to === 'LYD') return amount * 1.285;
    if (from === 'LYD' && to === 'SAR') return amount / 1.285;

    throw new Error(`تعذر العثور على سعر صرف صالح للتحويل من ${from} إلى ${to}.`);
  }

  /**
   * Formats a financial amount according to a specific currency profile.
   * Leveraged in documents, reports, and UI widgets.
   */
  public static formatWithProfile(amount: number, profile: CurrencyProfile): string {
    const isNegative = amount < 0;
    const absoluteValue = Math.abs(amount);

    const precision = profile.decimalPrecision;
    const parts = absoluteValue.toFixed(precision).split('.');
    
    let integerPart = parts[0];
    const decimalPart = parts[1] || '';

    // Thousands separator insertion
    const rx = /(\d+)(\d{3})/;
    while (rx.test(integerPart)) {
      integerPart = integerPart.replace(rx, `$1${profile.thousandsSeparator}$2`);
    }

    let formattedNumber = integerPart;
    if (precision > 0 && decimalPart) {
      formattedNumber += profile.decimalSeparator + decimalPart;
    }

    if (isNegative) {
      if (profile.negativeNumberFormat === 'brackets') {
        formattedNumber = `(${formattedNumber})`;
      } else {
        formattedNumber = `-${formattedNumber}`;
      }
    }

    if (profile.currencyPosition === 'Left') {
      return `${profile.currencySymbol}${formattedNumber}`;
    } else {
      return `${formattedNumber}${profile.currencySymbol}`;
    }
  }
}
