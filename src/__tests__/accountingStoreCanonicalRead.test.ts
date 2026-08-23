import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('accounting store canonical read contract', () => {
  it('routes every authoritative local read through the canonical guard', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/modules/accounting/store/accountingStore.ts'), 'utf8');
    expect(file).toContain('FallbackStorage.isCanonicalPersistenceRequired()');
    expect((file.match(/localStorage\.getItem\(/g) || []).length).toBe(1);
    expect((file.match(/readCanonicalLocal\(/g) || []).length).toBeGreaterThanOrEqual(11);
  });
});
