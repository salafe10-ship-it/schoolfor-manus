import { describe, expect, it } from 'vitest';

type VoucherState = 'draft' | 'approved' | 'posted' | 'reversed';

const allowedTransitions: Record<VoucherState, VoucherState[]> = {
  draft: ['approved'],
  approved: ['posted'],
  posted: ['reversed'],
  reversed: []
};

const canTransition = (from: VoucherState, to: VoucherState) => allowedTransitions[from].includes(to);

describe('receipt/payment state contract', () => {
  it('requires Draft → Approved → Posted and rejects direct posting', () => {
    expect(canTransition('draft', 'approved')).toBe(true);
    expect(canTransition('approved', 'posted')).toBe(true);
    expect(canTransition('draft', 'posted')).toBe(false);
  });

  it('keeps posted documents immutable and permits reversal only', () => {
    expect(canTransition('posted', 'draft')).toBe(false);
    expect(canTransition('posted', 'approved')).toBe(false);
    expect(canTransition('posted', 'reversed')).toBe(true);
    expect(canTransition('reversed', 'posted')).toBe(false);
  });

  it('defines idempotency as one operation key per tenant', () => {
    const operations = new Map<string, string>();
    const register = (tenant: string, key: string, documentId: string) => {
      const scopedKey = `${tenant}:${key}`;
      const existing = operations.get(scopedKey);
      if (existing) return existing;
      operations.set(scopedKey, documentId);
      return documentId;
    };

    expect(register('tenant-a', 'receipt-1', 'rv-1')).toBe('rv-1');
    expect(register('tenant-a', 'receipt-1', 'rv-2')).toBe('rv-1');
    expect(register('tenant-b', 'receipt-1', 'rv-3')).toBe('rv-3');
  });
});
