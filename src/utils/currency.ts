/**
 * Currency management and custom financial display rules.
 * Dynamic Multi-Currency Foundation fully integrated with enterprise settings.
 */

import { EnterpriseLogger } from '../database/services/EnterpriseLogger';
import { useState, useEffect } from 'react';

export interface CurrencyConfig {
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
  name: 'عملة افتراضية محايدة (Neutral Default)',
  symbol: '¤',
  fractionName: 'جزء',
  decimalPlaces: 2,
  symbolPosition: 'before',
  showSymbolInReports: true,
};

// Map of common currencies to easily populate details
const KNOWN_CURRENCIES: Record<string, { name: string; fractionName: string; symbolPosition: 'before' | 'after' }> = {
  SAR: { name: 'الريال السعودي', fractionName: 'هللة', symbolPosition: 'after' },
  JOD: { name: 'الدينار الأردني', fractionName: 'فلس', symbolPosition: 'after' },
  LYD: { name: 'الدينار الليبي', fractionName: 'درهم', symbolPosition: 'after' },
  EGP: { name: 'الجنيه المصري', fractionName: 'قرش', symbolPosition: 'after' },
  KWD: { name: 'الدينار الكويتي', fractionName: 'فلس', symbolPosition: 'after' },
  USD: { name: 'الدولار الأمريكي', fractionName: 'سنت', symbolPosition: 'before' },
  EUR: { name: 'اليورو', fractionName: 'سنت', symbolPosition: 'before' },
  GBP: { name: 'الجنيه الإسترليني', fractionName: 'بنس', symbolPosition: 'before' },
  AED: { name: 'الدرهم الإماراتي', fractionName: 'فلس', symbolPosition: 'after' },
  JPY: { name: 'الين الياباني', fractionName: 'رين', symbolPosition: 'before' },
};

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
        const info = KNOWN_CURRENCIES[cur.code] || { name: `${cur.code} Currency`, fractionName: 'جزء', symbolPosition: 'after' };
        
        return {
          name: info.name,
          symbol: cur.symbol || '¤',
          fractionName: info.fractionName,
          decimalPlaces: cur.precision !== undefined ? cur.precision : 2,
          symbolPosition: info.symbolPosition,
          showSymbolInReports: true,
        };
      }
    }

    // Fallback to legacy single config if stored and valid
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      if (parsed && parsed.symbol && parsed.symbol !== 'ر.س' && parsed.symbol !== 'د.أ') {
        return parsed;
      }
    }
  } catch (e: any) {
    EnterpriseLogger.error("Failed to fetch active school currency config", "CurrencyUtils", { error: e });
  }

  return NEUTRAL_DEFAULT_CURRENCY;
}

export function saveCurrencyConfig(config: CurrencyConfig) {
  localStorage.setItem('erp_system_currency_config', JSON.stringify(config));
  
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
        if (v.name === config.name || k === config.name) {
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
        precision: config.decimalPlaces,
        symbol: config.symbol,
        negativeFormat: 'minus' as const,
        thousandsSeparator: ',',
        decimalSeparator: '.',
      };

      if (idx >= 0) {
        configs[idx].currency = updatedCurrencyBlock;
        configs[idx].rounding.precision = config.decimalPlaces;
      } else {
        configs.push({
          id: `config_${activeSchoolId}_custom`,
          schoolId: activeSchoolId,
          updatedAt: new Date().toISOString(),
          updatedBy: 'System UI',
          generalLedger: { allowDirectJournalEdits: false, requireDoubleEntry: true },
          rounding: { precision: config.decimalPlaces, mode: 'HalfUp', allocationPolicy: 'LastPeriodAdjustment' },
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

  // In official documents (reports, invoices, receipts, prints)
  if (isOfficialDocument && config.showSymbolInReports) {
    if (config.symbolPosition === 'before') {
      return `${config.symbol} ${formattedNumber}`;
    } else {
      return `${formattedNumber} ${config.symbol}`;
    }
  }

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

    if (isOfficialDocument && currencyConfig.showSymbolInReports) {
      if (currencyConfig.symbolPosition === 'before') {
        return `${currencyConfig.symbol} ${formattedNumber}`;
      } else {
        return `${formattedNumber} ${currencyConfig.symbol}`;
      }
    }

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
