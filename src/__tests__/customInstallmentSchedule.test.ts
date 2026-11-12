import { describe, expect, it } from 'vitest';
import { validateCustomInstallmentSchedule } from '../modules/financial/domain/CustomInstallmentSchedule';

describe('validateCustomInstallmentSchedule', () => {
  it('keeps unequal historical amounts and dates, including same-day rows', () => {
    const rows = validateCustomInstallmentSchedule({
      availableAmount: 2_500_000,
      schedules: [
        { dueDate: '2026-09-01', amount: 250_000 },
        { dueDate: '2026-10-04', amount: 750_000 },
        { dueDate: '2026-11-05', amount: 625_000 },
        { dueDate: '2026-11-05', amount: 375_000 },
      ],
    });

    expect(rows).toEqual([
      { installmentNumber: 1, dueDate: '2026-09-01', amount: 250_000 },
      { installmentNumber: 2, dueDate: '2026-10-04', amount: 750_000 },
      { installmentNumber: 3, dueDate: '2026-11-05', amount: 625_000 },
      { installmentNumber: 4, dueDate: '2026-11-05', amount: 375_000 },
    ]);
  });

  it('allows a partial schedule and leaves the remaining invoice balance unplanned', () => {
    const rows = validateCustomInstallmentSchedule({
      availableAmount: 2_500_000,
      schedules: [{ dueDate: '2026-10-07', amount: 1_750_000 }],
    });
    expect(rows[0].amount).toBe(1_750_000);
  });

  it.each([
    ['rejects a missing schedule', []],
    ['rejects an invalid calendar date', [{ dueDate: '2026-02-30', amount: 1 }]],
    ['rejects dates that move backwards', [{ dueDate: '2026-11-01', amount: 1 }, { dueDate: '2026-10-01', amount: 1 }]],
    ['rejects a schedule over the invoice balance', [{ dueDate: '2026-10-01', amount: 1_001 }]],
    ['rejects sub-cent amounts', [{ dueDate: '2026-10-01', amount: 1.001 }]],
  ])('%s', (_label, schedules) => {
    expect(() => validateCustomInstallmentSchedule({ availableAmount: 1_000, schedules })).toThrow();
  });
});

