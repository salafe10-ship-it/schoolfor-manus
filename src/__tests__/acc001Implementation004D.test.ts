import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('ACC-001 IMPLEMENTATION-004D canonical invoice integration', () => {
  it('uses the canonical posting adapter instead of direct fallback journal writes', () => {
    const source = read('src/database/services/InvoiceEngine.ts');
    expect(source).toContain('PostingEngine.createJournalEntryDraft');
    expect(source).not.toContain('FallbackStorage.saveJournalEntries(fallbackList)');
    expect(source).not.toContain("|| '1201'");
    expect(source).not.toContain("|| '4101'");
    expect(source).toContain('Double-entry ledger posting integration failed; invoice transaction will roll back');
  });

  it('does not invent account mappings and fails closed in canonical mode', () => {
    const source = read('src/database/services/InvoiceEngine.ts');
    expect(source).toContain('ACCOUNTING DECISION REQUIRED');
    expect(source).not.toContain("|| '1201'");
    expect(source).not.toContain("|| '4101'");
    expect(source).toContain('FallbackStorage.isCanonicalPersistenceRequired()');
  });
});
