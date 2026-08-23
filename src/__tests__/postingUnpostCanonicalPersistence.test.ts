import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/database/services/PostingEngine.ts', 'utf8');

describe('posting unpost canonical persistence', () => {
  it('does not mutate fallback general-ledger storage during unpost', () => {
    const start = source.indexOf('public static async unpostJournalEntry');
    const end = source.indexOf('public static async', start + 10);
    const block = source.slice(start, end === -1 ? undefined : end);
    expect(block).not.toContain('FallbackStorage.saveGeneralLedgerLines');
    expect(block).toContain('GeneralLedgerRepository.enlistDeleteGeneralLedgerByReference');
  });
});
