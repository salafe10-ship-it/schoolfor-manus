import { describe, expect, it } from 'vitest';
import { calculatePayrollRun } from '../modules/hr/domain/PayrollCalculation';
import type { HREmployee } from '../components/hr/types';

const employee: HREmployee = {
  id: 'EMP-1', name: 'موظف الاختبار', nationalId: '1', phone: '', email: '', address: '', birthDate: '1990-01-01', gender: 'male',
  departmentId: 'DEP-1', jobId: 'JOB-1', hiringDate: '2026-01-01', costCenter: 'admin', status: 'active', degree: '', major: '',
  experienceYears: 0, trainingCourses: [], basicSalary: 3000, allowances: [], bankName: '', iban: '', attachments: [], auditLogs: []
};

describe('HR payroll calculation', () => {
  it('uses the same canonical formula for late attendance and approved deductions', () => {
    const result = calculatePayrollRun({
      period: '2026-06', employees: [employee], rewards: [],
      penalties: [{ id: 'P-1', employeeId: 'EMP-1', type: 'deduction', date: '2026-06-10', amount: 50, reason: 'test', status: 'applied' }],
      advances: [{ id: 'A-1', employeeId: 'EMP-1', amount: 200, date: '2026-01-01', installments: 2, deductionPerMonth: 100, remainingAmount: 200, reason: 'test', status: 'approved' }],
      attendance: [{ id: 'AT-1', employeeId: 'EMP-1', date: '2026-06-10', status: 'late', delayMinutes: 60, overtimeHours: 0 }],
      leaves: [],
      settings: { lateDeductionRate: 1, workingHoursPerDay: 8 }
    });
    expect(result.lines[0]).toMatchObject({ gross: 3000, penalty: 50, advanceDeduction: 100, attendanceDeduction: 12.5, overtimePay: 0, net: 2837.5 });
    expect(result.totals).toEqual({ gross: 3000, penalty: 50, advance: 100, attendance: 12.5, leave: 0, overtime: 0, net: 2837.5 });
  });

  it('does not pay overtime or deduct absence without an explicit policy', () => {
    const result = calculatePayrollRun({
      period: '2026-06', employees: [employee], rewards: [], penalties: [], advances: [],
      attendance: [{ id: 'AT-1', employeeId: 'EMP-1', date: '2026-06-10', status: 'absent', delayMinutes: 0, overtimeHours: 8 }], leaves: []
    });
    expect(result.totals).toMatchObject({ attendance: 0, overtime: 0, net: 3000 });
  });

  it('applies unpaid leave and overtime only when the school policy enables them', () => {
    const result = calculatePayrollRun({
      period: '2026-06', employees: [employee], rewards: [], penalties: [], advances: [],
      attendance: [{ id: 'AT-1', employeeId: 'EMP-1', date: '2026-06-10', status: 'present', delayMinutes: 0, overtimeHours: 2 }],
      leaves: [{ id: 'L-1', employeeId: 'EMP-1', type: 'unpaid', startDate: '2026-06-10', endDate: '2026-06-11', reason: 'test', status: 'approved' }],
      settings: { unpaidAbsenceDeduction: true, overtimeMultiplier: 2, workingHoursPerDay: 8 }
    });
    expect(result.lines[0]).toMatchObject({ leaveDeduction: 200, overtimePay: 50, net: 2850 });
    expect(result.totals).toMatchObject({ leave: 200, overtime: 50, net: 2850 });
  });
});
