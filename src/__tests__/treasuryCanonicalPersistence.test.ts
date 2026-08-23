import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('treasury canonical persistence contract', () => {
  it('guards treasury accounts, cash movements, and payment instruments outside transactions', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/TreasuryRepository.ts'), 'utf8');
    expect(file).toContain('FallbackStorage.assertCanonicalPersistence');
    expect((file.match(/assertAuthoritativePersistence\(/g) || []).length).toBeGreaterThanOrEqual(12);
    expect(file).toContain("this.assertAuthoritativePersistence('transaction write');");
  });
});
