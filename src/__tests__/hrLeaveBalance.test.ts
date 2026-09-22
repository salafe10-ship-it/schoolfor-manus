import { describe, expect, it } from 'vitest';
import { calculateLeaveBalance, canRequestLeave } from '../modules/hr/domain/LeaveBalance';

describe('HR leave balance policy', () => {
  const policy = { type: 'annual' as const, annualEntitlement: 24, carryOverLimit: 6, accrualMethod: 'annual' as const, requiresApproval: true, allowNegativeBalance: false, active: true };

  it('calculates entitlement, used, pending and available days', () => {
    const result = calculateLeaveBalance('EMP-1', 'annual', 2026, [
      { id: 'L1', employeeId: 'EMP-1', type: 'annual', startDate: '2026-01-10', endDate: '2026-01-12', reason: 'approved', status: 'approved' },
      { id: 'L2', employeeId: 'EMP-1', type: 'annual', startDate: '2026-02-10', endDate: '2026-02-14', reason: 'pending', status: 'pending' },
    ], policy);
    expect(result).toEqual({ entitled: 24, accrued: 24, used: 3, pending: 5, carriedOver: 6, available: 22 });
  });

  it('rejects requests beyond the available balance', () => {
    const balance = { entitled: 10, accrued: 10, used: 8, pending: 1, carriedOver: 0, available: 1 };
    expect(canRequestLeave(balance, 2)).toBe(false);
    expect(canRequestLeave(balance, 2, true)).toBe(true);
  });
});
