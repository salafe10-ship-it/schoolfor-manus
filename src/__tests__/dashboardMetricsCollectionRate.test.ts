import { describe, expect, it } from 'vitest';
import { calculateFeeCollectionRate } from '../components/dashboard/repository/feeCollectionRate';

describe('dashboard fee collection rate', () => {
  it('calculates paid value against active invoice totals including tax', () => {
    expect(calculateFeeCollectionRate([
      { amount: '100.00', tax_amount: '5', paid_amount: '52.5', status: 'partial' },
      { amount: 100, tax_amount: 0, paid_amount: 50, status: 'paid' },
    ])).toBe(50);
  });

  it('excludes cancelled, void, written-off, and refunded invoices', () => {
    expect(calculateFeeCollectionRate([
      { amount: 100, paid_amount: 50, status: 'unpaid' },
      { amount: 300, paid_amount: 300, status: 'cancelled' },
      { amount: 300, paid_amount: 300, status: 'VOID' },
      { amount: 300, paid_amount: 300, status: 'written_off' },
      { amount: 300, paid_amount: 300, status: 'refunded' },
    ])).toBe(50);
  });

  it('does not produce an invented rate when there are no billable invoices', () => {
    expect(calculateFeeCollectionRate([])).toBeNull();
    expect(calculateFeeCollectionRate([{ amount: 200, paid_amount: 200, status: 'refunded' }])).toBeNull();
  });

  it('ignores invalid and negative values instead of returning NaN', () => {
    expect(calculateFeeCollectionRate([
      { amount: 'bad', tax_amount: -10, paid_amount: 'bad', status: 'unpaid' },
      { amount: 100, tax_amount: 0, paid_amount: -5, status: 'unpaid' },
    ])).toBe(0);
  });
});
