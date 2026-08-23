import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('receivables engine canonical read contract', () => {
  it('fails closed before using local installment or student registries', () => {
    const allocation = readFileSync('src/database/services/CollectionAllocationEngine.ts', 'utf8');
    const ar = readFileSync('src/database/services/AccountsReceivableEngine.ts', 'utf8');
    expect(allocation).toContain("collection allocation installment read");
    expect(ar).toContain("accounts receivable student synchronization");
    expect(ar).toContain("accounts receivable portfolio read");
    expect(ar).toContain("accounts receivable company metrics read");
  });
});
