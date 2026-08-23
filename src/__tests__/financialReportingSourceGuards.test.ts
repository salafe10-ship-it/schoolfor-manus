import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('financial reporting source guard contract', () => {
  it('guards every report family that reads a local financial collection', () => {
    const source = readFileSync('src/database/services/FinancialReportingEngine.ts', 'utf8');
    for (const operation of [
      'general ledger source read', 'receivable source read',
      'income statement account source read', 'balance sheet account source read',
      'cash flow voucher source read', 'deferred revenue source read',
      'collections report source read', 'treasury report source read',
      'installments report source read', 'revenue recognition report source read',
    ]) expect(source).toContain(operation);
  });
});
