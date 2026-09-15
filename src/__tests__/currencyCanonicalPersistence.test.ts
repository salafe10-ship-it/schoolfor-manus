import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

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
});
