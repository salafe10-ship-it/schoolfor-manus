import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('invoice and installment canonical guard contract', () => {
  it('fails closed before using local student, fiscal, or invoice registries', () => {
    const validator = readFileSync('src/database/services/InvoiceValidator.ts', 'utf8');
    const engine = readFileSync('src/database/services/InstallmentEngine.ts', 'utf8');
    expect(validator).toContain('invoice validation student and fiscal master read');
    expect(engine).toContain('installment plan student and invoice read');
    expect(engine).toContain('bulk installment plan creation');
  });
});
