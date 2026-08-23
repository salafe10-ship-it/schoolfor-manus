import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/database/repositories/FinancialReportingRepository.ts', 'utf8');

describe('financial reporting canonical persistence contract', () => {
  it('fails closed instead of reading or writing local snapshots in canonical mode', () => {
    expect(source).toContain('FallbackStorage.assertCanonicalPersistence(`financial reporting ${operation}`)');
    expect(source).toContain("this.assertAuthoritativePersistence('snapshot write')");
    expect(source).toContain("this.assertAuthoritativePersistence('snapshot read')");
    expect(source).toContain("this.assertAuthoritativePersistence('snapshots read')");
  });
});
