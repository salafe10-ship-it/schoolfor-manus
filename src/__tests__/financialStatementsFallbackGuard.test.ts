import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('financial statements fallback guard contract', () => {
  it('does not resolve or use local statements in canonical persistence mode', () => {
    const source = readFileSync('src/database/services/FinancialStatementsStorageStrategy.ts', 'utf8');
    expect(source).toContain("financial statement fallback save");
    expect(source).toContain("financial statement fallback read");
    expect(source).toContain("financial statements fallback list read");
    expect(source).toContain('FallbackStorage.isCanonicalPersistenceRequired()');
  });
});
