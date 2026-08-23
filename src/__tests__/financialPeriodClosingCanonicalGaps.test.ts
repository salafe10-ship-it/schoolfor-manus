import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('financial period and closing validation canonical guards', () => {
  it('blocks local fallback reads used for authoritative validation', () => {
    const validator = readFileSync(resolve(process.cwd(), 'src/database/services/FinancialClosingValidator.ts'), 'utf8');
    const periods = readFileSync(resolve(process.cwd(), 'src/database/services/FinancialPeriodService.ts'), 'utf8');
    expect(validator).toContain("period closing validation reads");
    expect(validator).toContain("daily closing validation reads");
    expect(periods).toContain("financial periods school read");
    expect(periods).toContain("academic periods read");
  });
});
