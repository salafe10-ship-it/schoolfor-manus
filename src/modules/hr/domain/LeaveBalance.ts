import type { HRLeave, HRLeavePolicy } from '../../../components/hr/types';

export interface HRLeaveBalance {
  entitled: number;
  accrued: number;
  used: number;
  pending: number;
  carriedOver: number;
  available: number;
}

const daysInLeave = (leave: HRLeave): number => {
  const start = Date.parse(`${leave.startDate}T00:00:00Z`);
  const end = Date.parse(`${leave.endDate}T00:00:00Z`);
  return Number.isFinite(start) && Number.isFinite(end) && end >= start
    ? Math.floor((end - start) / 86400000) + 1
    : 0;
};

export function calculateLeaveBalance(
  employeeId: string,
  type: HRLeave['type'],
  year: number,
  leaves: HRLeave[],
  policy?: HRLeavePolicy,
): HRLeaveBalance {
  const safePolicy = policy || {
    type,
    annualEntitlement: 0,
    carryOverLimit: 0,
    accrualMethod: 'annual' as const,
    requiresApproval: true,
    allowNegativeBalance: false,
    active: false,
  };
  const entitled = Math.max(0, Number(safePolicy.annualEntitlement) || 0);
  const carriedOver = Math.min(entitled, Math.max(0, Number(safePolicy.carryOverLimit) || 0));
  const accrued = safePolicy.accrualMethod === 'monthly'
    ? Math.round(((entitled / 12) * Math.max(0, Math.min(12, new Date().getMonth() + 1))) * 100) / 100
    : entitled;
  const relevant = leaves.filter(leave => leave.employeeId === employeeId && leave.type === type && new Date(`${leave.startDate}T00:00:00Z`).getUTCFullYear() === year);
  const used = relevant.filter(leave => leave.status === 'approved').reduce((sum, leave) => sum + daysInLeave(leave), 0);
  const pending = relevant.filter(leave => leave.status === 'pending').reduce((sum, leave) => sum + daysInLeave(leave), 0);
  const available = Math.max(0, accrued + carriedOver - used - pending);
  return { entitled, accrued, used, pending, carriedOver, available };
}

export function canRequestLeave(balance: HRLeaveBalance, requestedDays: number, allowNegativeBalance = false): boolean {
  return Number.isFinite(requestedDays) && requestedDays > 0 && (allowNegativeBalance || requestedDays <= balance.available);
}
