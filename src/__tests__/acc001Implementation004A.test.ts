import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('ACC-001 IMPLEMENTATION-004A canonical persistence containment', () => {
  it('does not return an in-memory journal as a saved result', () => {
    const source = read('src/database/services/AccountingPostingService.ts');
    expect(source).toContain('PostingEngine.createJournalEntryDraft');
    expect(source).toContain("if (!schoolId)");
    expect(source).not.toContain('id: uuidv4()');
  });

  it('rejects illustrative account mappings instead of posting fake financial success', () => {
    const source = read('src/modules/accounting/application/AccountingPostingEngine.ts');
    expect(source).toContain('ACCOUNTING DECISION REQUIRED');
    expect(source).not.toContain("accountId: 'CASH_ACCOUNT'");
    expect(source).not.toContain("accountId: 'REVENUE_ACCOUNT'");
    expect(source).not.toContain("status: 'posted'");
    expect(source).not.toContain('generateJournalEntries');
  });

  it('requires trusted tenant context for approval and posting', () => {
    const source = read('src/database/services/AccountingPostingService.ts');
    expect(source).toContain('approveJournal(schoolId: string, journalId: string, approvedBy: string)');
    expect(source).toContain('postJournal(schoolId: string, journalId: string, postedBy: string)');
    expect(source).toContain("if (!schoolId || !approvedBy)");
    expect(source).toContain("if (!schoolId || !postedBy)");
    expect(source).toContain("posted.status !== 'posted'");
  });
});
