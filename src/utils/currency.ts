/**
 * Currency management and custom financial display rules.
 * Dynamic Multi-Currency Foundation fully integrated with enterprise settings.
 */

import { EnterpriseLogger } from '../database/services/EnterpriseLogger';
import { useState, useEffect } from 'react';

export interface CurrencyConfig {
  code?: string;
  name: string;
  symbol: string;
  fractionName: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  showSymbolInReports: boolean;
}

/**
 * Neutral Defaults to prevent any hardcoded currency bias when not set.
 */
export const NEUTRAL_DEFAULT_CURRENCY: CurrencyConfig = {
  code: 'CUR',
  name: 'عملة افتراضية محايدة (Neutral Default)',
  symbol: '¤',
  fractionName: 'جزء',
  decimalPlaces: 2,
  symbolPosition: 'before',
  showSymbolInReports: true,
};

// Map of common currencies to easily populate details
export const KNOWN_CURRENCIES: Record<string, { name: string; symbol: string; fractionName: string; symbolPosition: 'before' | 'after'; decimalPlaces: number }> = {
  SAR: { name: 'الريال السعودي', symbol: 'ر.س', fractionName: 'هللة', symbolPosition: 'after', decimalPlaces: 2 },
  JOD: { name: 'الدينار الأردني', symbol: 'د.أ', fractionName: 'فلس', symbolPosition: 'after', decimalPlaces: 3 },
  LYD: { name: 'الدينار الليبي', symbol: 'د.ل', fractionName: 'درهم', symbolPosition: 'after', decimalPlaces: 3 },
  EGP: { name: 'الجنيه المصري', symbol: 'ج.م', fractionName: 'قرش', symbolPosition: 'after', decimalPlaces: 2 },
  SDG: { name: 'الجنيه السوداني', symbol: 'ج.س', fractionName: 'قرش', symbolPosition: 'after', decimalPlaces: 2 },
  KWD: { name: 'الدينار الكويتي', symbol: 'د.ك', fractionName: 'فلس', symbolPosition: 'after', decimalPlaces: 3 },
  USD: { name: 'الدولار الأمريكي', symbol: '$', fractionName: 'سنت', symbolPosition: 'before', decimalPlaces: 2 },
  EUR: { name: 'اليورو', symbol: '€', fractionName: 'سنت', symbolPosition: 'before', decimalPlaces: 2 },
  GBP: { name: 'الجنيه الإسترليني', symbol: '£', fractionName: 'بنس', symbolPosition: 'before', decimalPlaces: 2 },
  AED: { name: 'الدرهم الإماراتي', symbol: 'د.إ', fractionName: 'فلس', symbolPosition: 'after', decimalPlaces: 2 },
  JPY: { name: 'الين الياباني', symbol: '¥', fractionName: 'رين', symbolPosition: 'before', decimalPlaces: 0 },
};

export const CURRENCY_OPTIONS = Object.entries(KNOWN_CURRENCIES).map(([code, currency]) => ({ code, ...currency }));

export function getCurrencyConfigForCode(code: string): CurrencyConfig {
  const normalizedCode = String(code || '').trim().toUpperCase();
  const info = KNOWN_CURRENCIES[normalizedCode];
  return info ? {
    code: normalizedCode,
    name: info.name,
    symbol: info.symbol,
    fractionName: info.fractionName,
    decimalPlaces: info.decimalPlaces,
    symbolPosition: info.symbolPosition,
    showSymbolInReports: true,
  } : { ...NEUTRAL_DEFAULT_CURRENCY, code: normalizedCode || 'CUR' };
}

const ARABIC_ONES = ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const ARABIC_TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const ARABIC_HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function arabicIntegerWords(value: number): string {
  const number = Math.floor(Math.abs(value));
  if (number < 20) return ARABIC_ONES[number];
  if (number < 100) {
    const remainder = number % 10;
    return remainder ? `${ARABIC_ONES[remainder]} و${ARABIC_TENS[Math.floor(number / 10)]}` : ARABIC_TENS[number / 10];
  }
  if (number < 1000) {
    const remainder = number % 100;
    return remainder ? `${ARABIC_HUNDREDS[Math.floor(number / 100)]} و${arabicIntegerWords(remainder)}` : ARABIC_HUNDREDS[number / 100];
  }
  const scales = [{ value: 1_000_000_000, singular: 'مليار', dual: 'ملياران', plural: 'مليارات' }, { value: 1_000_000, singular: 'مليون', dual: 'مليونان', plural: 'ملايين' }, { value: 1000, singular: 'ألف', dual: 'ألفان', plural: 'آلاف' }];
  for (const scale of scales) {
    if (number >= scale.value) {
      const count = Math.floor(number / scale.value);
      const remainder = number % scale.value;
      const scaleName = count === 1 ? scale.singular : count === 2 ? scale.dual : count <= 10 ? scale.plural : `${scale.singular}ًا`;
      const countWords = count <= 2 ? '' : `${arabicIntegerWords(count)} `;
      return `${countWords}${scaleName}${remainder ? ` و${arabicIntegerWords(remainder)}` : ''}`;
    }
  }
  return String(number);
}

export function amountToArabicWords(amount: number, config: CurrencyConfig): string {
  const precision = Math.max(0, Math.min(3, config.decimalPlaces));
  const factor = 10 ** precision;
  const minorUnits = Math.round(Math.abs(Number.isFinite(amount) ? amount : 0) * factor);
  const major = Math.floor(minorUnits / factor);
  const minor = minorUnits % factor;
  const sign = amount < 0 ? 'سالب ' : '';
  const minorWords = minor && precision ? ` و${arabicIntegerWords(minor)} ${config.fractionName}` : '';
  return `فقط ${sign}${arabicIntegerWords(major)} من ${config.name}${minorWords} لا غير`;
}

/**
 * Get the currency config dynamically based on the active school's financial settings.
 * Fully compatible with backward states and provides neutral defaults.
 */
export function getCurrencyConfig(): CurrencyConfig {
  try {
    const activeSchoolId = localStorage.getItem('active_school_id');
    const storedConfig = localStorage.getItem('erp_system_currency_config');
    
    // Check if there are saved financial configurations
    const rawConfigs = localStorage.getItem('school_db_financial_configurations_database.json');
    if (rawConfigs && activeSchoolId) {
      const configs = JSON.parse(rawConfigs);
      const activeCfg = configs.find((c: any) => c.schoolId === activeSchoolId);
      
      if (activeCfg && activeCfg.currency && activeCfg.currency.code !== 'CUR' && activeCfg.currency.code !== 'XYZ') {
        const cur = activeCfg.currency;
        const info = KNOWN_CURRENCIES[cur.code] || { name: `${cur.code} Currency`, symbol: '¤', fractionName: 'جزء', symbolPosition: 'after' as const, decimalPlaces: 2 };
        
        return {
          code: cur.code,
          name: info.name,
          symbol: cur.symbol || info.symbol,
          fractionName: info.fractionName,
          decimalPlaces: cur.precision !== undefined ? cur.precision : info.decimalPlaces,
          symbolPosition: info.symbolPosition,
          showSymbolInReports: true,
        };
      }
    }

    // Fallback to legacy single config if stored and valid
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      if (parsed && parsed.symbol && parsed.symbol !== 'ر.س' && parsed.symbol !== 'د.أ') {
        const code = String(parsed.code || Object.entries(KNOWN_CURRENCIES).find(([, item]) => item.symbol === parsed.symbol)?.[0] || 'CUR');
        const info = KNOWN_CURRENCIES[code];
        return info ? {
          ...parsed,
          code,
          name: info.name,
          symbol: parsed.symbol || info.symbol,
          fractionName: info.fractionName,
          decimalPlaces: parsed.decimalPlaces ?? info.decimalPlaces,
          symbolPosition: info.symbolPosition,
        } : parsed;
      }
    }
  } catch (e: any) {
    EnterpriseLogger.error("Failed to fetch active school currency config", "CurrencyUtils", { error: e });
  }

  return NEUTRAL_DEFAULT_CURRENCY;
}

export function saveCurrencyConfig(config: CurrencyConfig) {
  const normalizedConfig = { ...config, code: config.code || Object.entries(KNOWN_CURRENCIES).find(([, item]) => item.name === config.name)?.[0] || 'CUR' };
  localStorage.setItem('erp_system_currency_config', JSON.stringify(normalizedConfig));
  
  // Also synchronize to the active school's financial configurations to preserve data integrity!
  try {
    const activeSchoolId = localStorage.getItem('active_school_id');
    const rawConfigs = localStorage.getItem('school_db_financial_configurations_database.json');
    if (rawConfigs && activeSchoolId) {
      const configs = JSON.parse(rawConfigs);
      const idx = configs.findIndex((c: any) => c.schoolId === activeSchoolId);
      
      // Guess currency code based on name or symbol
      let code = 'CUR';
      for (const [k, v] of Object.entries(KNOWN_CURRENCIES)) {
        if (v.name === config.name || k === normalizedConfig.code || k === config.name) {
          code = k;
          break;
        }
      }
      if (code === 'CUR' && config.symbol === 'ر.س') code = 'SAR';
      if (code === 'CUR' && config.symbol === 'د.ل') code = 'LYD';
      if (code === 'CUR' && config.symbol === '$') code = 'USD';
      if (code === 'CUR' && config.symbol === 'د.أ') code = 'JOD';

      const updatedCurrencyBlock = {
        code,
        precision: normalizedConfig.decimalPlaces,
        symbol: normalizedConfig.symbol,
        negativeFormat: 'minus' as const,
        thousandsSeparator: ',',
        decimalSeparator: '.',
      };

      if (idx >= 0) {
        configs[idx].currency = updatedCurrencyBlock;
        configs[idx].rounding.precision = normalizedConfig.decimalPlaces;
      } else {
        configs.push({
          id: `config_${activeSchoolId}_custom`,
          schoolId: activeSchoolId,
          updatedAt: new Date().toISOString(),
          updatedBy: 'System UI',
          generalLedger: { allowDirectJournalEdits: false, requireDoubleEntry: true },
          rounding: { precision: normalizedConfig.decimalPlaces, mode: 'HalfUp', allocationPolicy: 'LastPeriodAdjustment' },
          currency: updatedCurrencyBlock,
          revenueRecognition: { method: 'Deferred Revenue', deferredRevenueAccount: '2301', earnedRevenueAccount: '4101', frequency: 'Academic Terms', startPolicy: 'Invoice Date' },
          posting: { requireApprovedWorkflow: false, autoPostInvoices: true },
          fiscal: { currentFiscalYearId: 'fy_2026' }
        });
      }
      localStorage.setItem('school_db_financial_configurations_database.json', JSON.stringify(configs));
    }
  } catch (err: any) {
    EnterpriseLogger.error("Failed to sync saveCurrencyConfig to school configuration", "CurrencyUtils", { error: err });
  }

  // Dispatch custom event to notify React components to update
  window.dispatchEvent(new Event('currency_config_changed'));
}

/**
 * Formats a financial amount according to the currency configuration.
 * @param amount The numeric amount to format.
 * @param isOfficialDocument Whether this is a report/invoice/receipt/voucher (where symbol is used if configured).
 */
export function formatAmount(amount: number | string, isOfficialDocument: boolean = false): string {
  const config = getCurrencyConfig();
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  
  // Format with dynamic decimal places
  const formattedNumber = num.toLocaleString('en-US', {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  });

  // Financial values are intentionally displayed as numbers only.
  // Currency remains stored in the financial records, but no symbol is rendered.
  return formattedNumber;
}

export function useCurrency() {
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>(getCurrencyConfig());

  useEffect(() => {
    const handleChanged = () => {
      setCurrencyConfig(getCurrencyConfig());
    };
    window.addEventListener('currency_config_changed', handleChanged);
    window.addEventListener('active_school_changed', handleChanged);
    return () => {
      window.removeEventListener('currency_config_changed', handleChanged);
      window.removeEventListener('active_school_changed', handleChanged);
    };
  }, []);

  const format = (amount: number | string, isOfficialDocument: boolean = false) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    const formattedNumber = num.toLocaleString('en-US', {
      minimumFractionDigits: currencyConfig.decimalPlaces,
      maximumFractionDigits: currencyConfig.decimalPlaces,
    });

    // Keep the currency metadata for accounting, while rendering amounts as numbers only.
    return formattedNumber;
  };

  return {
    currencyConfig,
    format,
    saveCurrency: (newConfig: CurrencyConfig) => {
      saveCurrencyConfig(newConfig);
      setCurrencyConfig(newConfig);
    }
  };
}
