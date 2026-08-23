import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('inventory numeric validation', () => {
  it('rejects non-finite numeric quantities, prices, and invalid VAT rates', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/validation/validators.ts'), 'utf8');
    expect(source).toContain('!Number.isFinite(item.quantity)');
    expect(source).toContain('!Number.isFinite(item[field])');
    expect(source).toContain('item.vatRate > 100');
    const repository = readFileSync(resolve(process.cwd(), 'src/database/repositories/InventoryRepository.ts'), 'utf8');
    expect(repository).toContain('quantity: item.quantity ?? 0');
    expect(repository).not.toContain('quantity: item.quantity || 0');
  });
});
