import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('financial closing ledger read contract', () => {
  it('fails closed instead of returning local ledger data after a production query failure', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/services/FinancialClosingStorageStrategy.ts'), 'utf8');
    const fallbackCall = 'return FallbackStorage.getGeneralLedgerLines().filter(gl => gl.schoolId === schoolId);';
    const fallbackIndex = file.indexOf(fallbackCall);
    const guardIndex = file.lastIndexOf("FallbackStorage.assertCanonicalPersistence('financial closing general-ledger read')");
    expect(fallbackIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeLessThan(fallbackIndex);
  });
});
