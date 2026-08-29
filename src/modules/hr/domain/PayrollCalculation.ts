import type {
  HRAttendance,
  HRAdvance,
  HRBonus,
  HREmployee,
  HRLeave,
  HRPenalty,
  HRSettings
} from '../../../components/hr/types.js';

export interface PayrollCalculationLine {
  employeeId: string;
  gross: number;
  penalty: number;
  advanceDeduction: number;
  attendanceDeduction: number;
  leaveDeduction: number;
  overtimePay: number;
  net: number;
}

export interface PayrollCalculationTotals {
  gross: number;
  penalty: number;
  advance: number;
  attendance: number;
  leave: number;
  overtime: number;
  net: number;
}

export interface PayrollCalculationResult {
  lines: PayrollCalculationLine[];
  totals: PayrollCalculationTotals;
}

const money = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;

/**
 * One payroll formula shared by the browser preview and the trusted server.
 * The defaults are deliberately conservative: attendance affects payroll only
 * through explicitly recorded late minutes; unpaid absence and overtime pay
 * require an explicit HR policy setting.
 */
export function calculatePayrollRun(input: {
  period: string;
  employees: HREmployee[];
  rewards: HRBonus[];
  penalties: HRPenalty[];
  advances: HRAdvance[];
  attendance: HRAttendance[];
  leaves: HRLeave[];
  settings?: Partial<HRSettings> & {
    unpaidAbsenceDeduction?: boolean;
    overtimeMultiplier?: number;
  };
}): PayrollCalculationResult {
  const settings = input.settings || {};
  const lateDeductionRate = Math.max(0, Number(settings.lateDeductionRate ?? 1));
  const unpaidAbsenceDeduction = settings.unpaidAbsenceDeduction === true;
  const overtimeMultiplier = Math.max(0, Number(settings.overtimeMultiplier ?? 0));
  const workingHours = Math.max(1, Number(settings.workingHoursPerDay ?? 8));
  const lines = input.employees
    .filter(employee => employee.status !== 'resigned')
    .map(employee => {
      const basicSalary = Math.max(0, Number(employee.basicSalary || 0));
      const allowance = (Array.isArray(employee.allowances) ? employee.allowances : [])
        .reduce((sum, item) => sum + Math.max(0, Number(item?.amount || 0)), 0);
      const bonus = input.rewards
        .filter(item => item.employeeId === employee.id && item.status === 'applied' && String(item.date || '').startsWith(input.period))
        .reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0)), 0);
      const penalty = input.penalties
        .filter(item => item.employeeId === employee.id && item.status === 'applied' && String(item.date || '').startsWith(input.period))
        .reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0)), 0);
      const advance = input.advances.find(item => item.employeeId === employee.id && item.status === 'approved' && Number(item.remainingAmount || 0) > 0);
      const advanceDeduction = advance
        ? Math.min(Math.max(0, Number(advance.deductionPerMonth || 0)), Math.max(0, Number(advance.remainingAmount || 0)))
        : 0;
    const employeeAttendance = input.attendance.filter(item => item.employeeId === employee.id && String(item.date || '').startsWith(input.period));
      const delayMinutes = employeeAttendance.reduce((sum, item) => sum + (item.status === 'late' ? Math.max(0, Number(item.delayMinutes || 0)) : 0), 0);
      const absentDays = employeeAttendance.filter(item => item.status === 'absent').length;
      const overtimeHours = employeeAttendance.reduce((sum, item) => sum + Math.max(0, Number(item.overtimeHours || 0)), 0);
      const hourlyRate = basicSalary / 30 / workingHours;
      const attendanceDeduction = hourlyRate * (delayMinutes / 60) * lateDeductionRate
        + (unpaidAbsenceDeduction ? (basicSalary / 30) * absentDays : 0);
      const overtimePay = hourlyRate * overtimeHours * overtimeMultiplier;
      const unpaidLeaveDays = input.leaves
        .filter(item => item.employeeId === employee.id && item.status === 'approved' && item.type === 'unpaid')
        .reduce((sum, item) => {
          const start = new Date(`${item.startDate}T00:00:00Z`);
          const end = new Date(`${item.endDate}T00:00:00Z`);
          const periodStart = new Date(`${input.period}-01T00:00:00Z`);
          const nextPeriod = new Date(periodStart);
          nextPeriod.setUTCMonth(nextPeriod.getUTCMonth() + 1);
          const overlapStart = Math.max(start.getTime(), periodStart.getTime());
          const overlapEnd = Math.min(end.getTime(), nextPeriod.getTime() - 86400000);
          return sum + (overlapEnd >= overlapStart ? Math.floor((overlapEnd - overlapStart) / 86400000) + 1 : 0);
        }, 0);
      const leaveDeduction = (settings.unpaidAbsenceDeduction === true ? (basicSalary / 30) * unpaidLeaveDays : 0);
      const gross = basicSalary + allowance + bonus;
      const net = Math.max(0, gross + overtimePay - penalty - advanceDeduction - attendanceDeduction - leaveDeduction);
      return {
        employeeId: String(employee.id),
        gross: money(gross),
        penalty: money(penalty),
        advanceDeduction: money(advanceDeduction),
        attendanceDeduction: money(attendanceDeduction),
        leaveDeduction: money(leaveDeduction),
        overtimePay: money(overtimePay),
        net: money(net)
      };
    })
    .filter(line => line.gross > 0 || line.overtimePay > 0);

  const totals = lines.reduce<PayrollCalculationTotals>((sum, line) => ({
    gross: money(sum.gross + line.gross),
    penalty: money(sum.penalty + line.penalty),
    advance: money(sum.advance + line.advanceDeduction),
    attendance: money(sum.attendance + line.attendanceDeduction),
    leave: money(sum.leave + line.leaveDeduction),
    overtime: money(sum.overtime + line.overtimePay),
    net: money(sum.net + line.net)
  }), { gross: 0, penalty: 0, advance: 0, attendance: 0, leave: 0, overtime: 0, net: 0 });

  return { lines, totals };
}
