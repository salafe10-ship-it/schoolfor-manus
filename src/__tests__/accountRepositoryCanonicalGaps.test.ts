import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('AccountRepository canonical delete checks', () => {
  it('guards journal and voucher existence checks before local fallback reads', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/database/repositories/AccountRepository.ts'), 'utf8');
    expect(source).toContain('account delete transaction check');
    expect(source).toContain('const journalEntries = FallbackStorage.getJournalEntries();');
    expect(source).toContain('const vouchers = FallbackStorage.getVouchers();');
  });
});
