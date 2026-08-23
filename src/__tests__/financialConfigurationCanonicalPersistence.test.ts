import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('financial configuration canonical persistence contract', () => {
  it('guards configuration reads, writes, and audit reads from local fallback', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/FinancialConfigurationRepository.ts'), 'utf8');
    expect(file).toContain('FallbackStorage.assertCanonicalPersistence');
    expect((file.match(/assertAuthoritativePersistence\(/g) || []).length).toBeGreaterThanOrEqual(4);
    expect(file).toContain("this.assertAuthoritativePersistence('write');");
  });
});
