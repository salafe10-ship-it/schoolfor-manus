import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('general ledger integrity', () => {
  it('does not load hard-coded opening balances without central data', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/GeneralLedgerPortal.tsx'), 'utf8');
    expect(source).toContain('لا تُحمّل أرصدة افتتاحية تجريبية');
    expect(source).toContain('return [];');
  });
});
