import { describe, expect, it } from 'vitest';
import {
  buildInstallmentSchedule,
  makeDeterministicIdempotencyKey,
  normalizeIdempotencyKey,
} from '../modules/financial/application/CanonicalStudentFeeOperations';

describe('canonical student fee operations', () => {
  it('creates a rounded schedule whose sum exactly equals the invoice total', () => {
    const schedule = buildInstallmentSchedule({
      totalAmount: 1000.01,
      count: 4,
      startDueDate: '2026-09-30',
      frequency: 'monthly',
    });
    expect(schedule).toHaveLength(4);
    expect(schedule.reduce((sum, item) => sum + item.amount, 0)).toBe(1000.01);
    expect(schedule.map(item => item.dueDate)).toEqual([
      '2026-09-30',
      '2026-10-30',
      '2026-11-30',
      '2026-12-30',
    ]);
  });

  it('clamps month-end dates instead of overflowing into the next month', () => {
    const schedule = buildInstallmentSchedule({
      totalAmount: 300,
      count: 3,
      startDueDate: '2026-01-31',
      frequency: 'monthly',
    });
    expect(schedule.map(item => item.dueDate)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
  });

  it('generates stable idempotency keys for repeated bulk runs', () => {
    const first = makeDeterministicIdempotencyKey(['student-1', 'template-1', '2026', 'term-1']);
    const second = makeDeterministicIdempotencyKey(['student-1', 'template-1', '2026', 'term-1']);
    expect(first).toBe(second);
    expect(() => normalizeIdempotencyKey('', 'test')).toThrow();
  });
});
