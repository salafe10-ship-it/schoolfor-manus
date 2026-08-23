import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('accounts receivable canonical write contract', () => {
  it('guards account, transaction, allocation, settlement, adjustment, and write-off mutations', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/AccountsReceivableRepository.ts'), 'utf8');
    expect(file).toContain('FallbackStorage.assertCanonicalPersistence');
    expect((file.match(/assertAuthoritativePersistence\(/g) || []).length).toBeGreaterThanOrEqual(11);
    expect(file).toContain("this.assertAuthoritativePersistence('transaction write');");
    expect(file).toContain("this.assertAuthoritativePersistence('write-off');");
  });
});
