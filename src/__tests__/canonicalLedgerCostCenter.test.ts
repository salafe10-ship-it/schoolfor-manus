import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/modules/financial/application/CanonicalErpPostingService.ts', 'utf8');

describe('canonical ledger cost-center projection', () => {
  it('keeps cost centers attached to journal lines and ledger rows', () => {
    expect(source).toContain('const costCenterByLine = new Map<string, string | undefined>();');
    expect(source).toContain('costCenterByLine.set(`${line.journal_entry_id}:${line.id}`, costCenter);');
    expect(source).toContain('costCenterByLine.get(`${row.journal_entry_id}:${row.journal_line_id}`)');
  });

  it('does not query the unavailable general-ledger cost_center column', () => {
    expect(source).not.toContain('balance_after, source_type, source_id, description, cost_center, created_at');
  });
});
