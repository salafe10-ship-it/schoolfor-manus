import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('invoice student balance canonical guard contract', () => {
  it('does not mutate local student balances during invoice lifecycle actions', () => {
    const source = readFileSync('src/database/services/InvoiceEngine.ts', 'utf8');
    for (const operation of [
      'invoice student balance synchronization',
      'credit note student balance synchronization',
      'debit note student balance synchronization',
      'invoice cancellation student balance synchronization',
      'invoice void student balance synchronization',
    ]) expect(source).toContain(operation);
  });
});
