import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const portal = readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');
const server = readFileSync('server.ts', 'utf8');

describe('canonical ledger reversal UI contract', () => {
  it('asks the server to reverse a posted journal and verifies the returned reversal id', () => {
    expect(portal).toContain('/api/financial/journals/${encodeURIComponent(jvId)}/reverse');
    expect(portal).toContain('!result.data?.reversalId');
    expect(portal).not.toContain('const reversalEntry = {');
    expect(server).toContain('CanonicalErpPostingService.reverseJournal');
  });

  it('never returns a posted journal to draft', () => {
    expect(portal).toContain('لا يمكن إعادة القيد المرحل إلى مسودة');
    const start = portal.indexOf('const handleUnpostJv');
    const end = portal.indexOf('const validateJvIntegrity', start);
    const block = portal.slice(start, end);
    expect(block).not.toContain("status: 'مسودة'");
    expect(block).not.toContain('persistCanonicalFinancialSnapshot');
  });
});
