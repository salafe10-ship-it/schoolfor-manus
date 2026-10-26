import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { amountToArabicWords, getCurrencyConfig } from '../utils/currency';

describe('currency canonical persistence contract', () => {
  it('guards currency masters, exchange rates, and simulated production conversions', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/CurrencyRepository.ts'), 'utf8');
    expect(file).toContain('FallbackStorage.assertCanonicalPersistence');
    expect((file.match(/assertAuthoritativePersistence\(/g) || []).length).toBeGreaterThanOrEqual(7);
    expect(file).toContain('لا يوجد سعر صرف مركزي معتمد');
  });

  it('renders financial amounts as numbers without a currency symbol', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/utils/currency.ts'), 'utf8');
    expect(file).toContain('Financial values are intentionally displayed as numbers only.');
    expect(file).not.toContain('return `${formattedNumber} ${config.symbol}`');
    expect(file).not.toContain('return `${currencyConfig.symbol} ${formattedNumber}`');
  });

  it('supports Sudanese pound and its piastre unit in words and saved currency metadata', () => {
    expect(amountToArabicWords(1200, {
      code: 'SDG', name: 'الجنيه السوداني', symbol: 'ج.س', fractionName: 'قرش', decimalPlaces: 2,
      symbolPosition: 'after', showSymbolInReports: true
    })).toContain('الجنيه السوداني');
    expect(amountToArabicWords(17000, {
      code: 'SDG', name: 'الجنيه السوداني', symbol: 'ج.س', fractionName: 'قرش', decimalPlaces: 2,
      symbolPosition: 'after', showSymbolInReports: true
    })).toBe('فقط سبعة عشر ألفًا من الجنيه السوداني لا غير');
    expect(amountToArabicWords(12.5, {
      code: 'SDG', name: 'الجنيه السوداني', symbol: 'ج.س', fractionName: 'قرش', decimalPlaces: 2,
      symbolPosition: 'after', showSymbolInReports: true
    })).toContain('قرش');
    const settings = fs.readFileSync(path.resolve(process.cwd(), 'src/components/SystemSettingsPortal.tsx'), 'utf8');
    expect(settings).toContain('CURRENCY_OPTIONS.map');
    expect(settings).toContain('saveCurrencyConfig({');
    const seed = fs.readFileSync(path.resolve(process.cwd(), 'src/database/seeds/CurrencySeed.ts'), 'utf8');
    expect(seed).toContain("isoCode: 'SDG'");
    expect(seed).toContain("minorUnit: 'qirsh'");
  });
});
