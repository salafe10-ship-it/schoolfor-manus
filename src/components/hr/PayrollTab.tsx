import { Check, CheckSquare, Coins, CreditCard, Eye, FileText, Filter, Play, Printer, Search, ShieldAlert, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { HRAttendance, HREmployee, HRPenalty, HRAdvance, HRBonus, HRPayrollRun, HRSettings, HRContract } from './types';
import { calculatePayrollRun } from '../../modules/hr/domain/PayrollCalculation';

interface PayrollTabProps {
  employees: HREmployee[];
  contracts: HRContract[];
  attendance: HRAttendance[];
  leaves: import('./types').HRLeave[];
  penalties: HRPenalty[];
  advances: HRAdvance[];
  rewards: HRBonus[];
  payrollRuns: HRPayrollRun[];
  settings: HRSettings;
  formatCurrency: (amount: number, showSymbol?: boolean) => string;
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'error') => void;
  costCenterLabels: Record<string, string>;
  canApprove?: boolean;
  canFinancialWrite?: boolean;
  onApprovePayroll: (period: string) => Promise<boolean>;
  onCommitPayroll: (period: string) => Promise<boolean>;
  onPayPayroll: (period: string) => Promise<boolean>;
}

interface PayrollItem {
  employeeId: string;
  costCenter: string;
  employeeName: string;
  basicSalary: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  advancesDeducted: number;
  netSalary: number;
}

export default function PayrollTab({
  employees,
  contracts,
  attendance,
  leaves,
  penalties,
  advances,
  rewards,
  payrollRuns,
  settings,
  formatCurrency,
  triggerNotification,
  costCenterLabels,
  canApprove = false,
  canFinancialWrite = false,
  onApprovePayroll,
  onCommitPayroll,
  onPayPayroll
}: PayrollTabProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [payrollList, setPayrollList] = useState<PayrollItem[]>([]);
  const [isPosted, setIsPosted] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isCommitted, setIsCommitted] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<PayrollItem | null>(null);

  // Sync / Calculate payroll for selected month
  useEffect(() => {
    const persistedRun = payrollRuns.find(run => run.period === selectedMonth);
    setIsApproved(['approved', 'committed', 'paid'].includes(persistedRun?.status || ''));
    setIsCommitted(persistedRun?.status === 'committed' || persistedRun?.status === 'paid');
    setIsPosted(persistedRun?.status === 'paid');

    // Calculate items
    const calculation = calculatePayrollRun({ period: selectedMonth, employees, rewards, penalties, advances, attendance, leaves, settings });
    const items: PayrollItem[] = calculation.lines.map(line => {
      const employee = employees.find(item => item.id === line.employeeId);
      const basicSalary = Number(employee?.basicSalary || 0);
      const allowances = (employee?.allowances || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const bonuses = rewards.filter(item => item.employeeId === line.employeeId && item.status === 'applied' && item.date.startsWith(selectedMonth)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return {
        employeeId: line.employeeId,
        employeeName: employee?.name || line.employeeId,
        basicSalary,
        allowances,
        bonuses,
        deductions: line.penalty + line.attendanceDeduction + (line.leaveDeduction || 0),
        advancesDeducted: line.advanceDeduction,
        netSalary: line.net,
        costCenter: line.costCenter || employee?.costCenter || 'admin'
      };
    });

    setPayrollList(items);
  }, [employees, attendance, leaves, penalties, advances, rewards, payrollRuns, selectedMonth, settings]);

  // Total summary calculations
  const totals = payrollList.reduce((acc, item) => {
    acc.basic += item.basicSalary;
    acc.allowances += item.allowances;
    acc.bonuses += item.bonuses;
    acc.deductions += item.deductions;
    acc.advances += item.advancesDeducted;
    acc.net += item.netSalary;
    return acc;
  }, { basic: 0, allowances: 0, bonuses: 0, deductions: 0, advances: 0, net: 0 });

  const payrollStage = isPosted ? 3 : isCommitted ? 2 : isApproved ? 1 : 0;
  const payrollStageLabel = isPosted ? 'مصروف ومرحل' : isCommitted ? 'ملتزم محاسبيًا' : isApproved ? 'معتمد من HR' : 'مسودة للمراجعة';
  const stageSteps = ['مسودة', 'اعتماد HR', 'إثبات الالتزام', 'الصرف والترحيل'];

  const activeEmployees = employees.filter(employee => employee.status === 'active');
  const coveredEmployees = activeEmployees.filter(employee => contracts.some(contract => (
    contract.employeeId === employee.id &&
    contract.status === 'active' &&
    contract.startDate <= `${selectedMonth}-31` &&
    (!contract.endDate || contract.endDate >= `${selectedMonth}-01`)
  )));
  const employeesWithoutContract = activeEmployees.length - coveredEmployees.length;
  const employeesWithoutBank = activeEmployees.filter(employee => !employee.bankName || !employee.iban).length;
  const attendanceDaysInPeriod = attendance.filter(item => String(item.date || '').startsWith(selectedMonth)).length;
  const readinessWarnings = [
    employeesWithoutContract > 0 ? `${employeesWithoutContract} موظف نشط بلا عقد سارٍ مربوط بالفترة` : '',
    employeesWithoutBank > 0 ? `${employeesWithoutBank} موظف يحتاج مراجعة بيانات الحساب البنكي` : '',
    attendanceDaysInPeriod === 0 ? 'لا توجد سجلات حضور موثقة لهذه الفترة؛ راجعها قبل اعتماد الخصومات' : ''
  ].filter(Boolean);

  // Handle Post Payroll to General Ledger
  const handlePostPayroll = async () => {
    if (payrollList.length === 0) {
      triggerNotification('لا توجد بيانات رواتب لاحتسابها واعتمادها', 'warning');
      return;
    }
    if (isPosted) {
      triggerNotification('تنبيه: مسير رواتب هذا الشهر معتمد ومرحل مسبقاً بالحسابات العامة', 'warning');
      return;
    }

    if (!isApproved) {
      const approved = await onApprovePayroll(selectedMonth);
      if (approved) setIsApproved(true);
      return;
    }
    if (!isCommitted) {
      const committed = await onCommitPayroll(selectedMonth);
      if (committed) setIsCommitted(true);
      return;
    }
    const posted = await onPayPayroll(selectedMonth);
    if (posted) setIsPosted(true);
    return;
  };

  // Handle Print Salary Slip
  const handlePrintSlip = (item: PayrollItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
      <head>
        <title>قسيمة مفردات راتب - ${item.employeeName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
          .container { border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #dfb55a; padding-bottom: 15px; margin-bottom: 20px; }
          .header h2 { margin: 5px 0; font-size: 18px; color: #1e293b; }
          .slip-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
          .slip-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
          .slip-box h3 { margin-top: 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; font-size: 13px; color: #475569; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
          .row.total { font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 10px; font-size: 14px; color: #1e3a8a; }
          .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>مدرسة النور الدولية بالمنظومة الموحدة</h2>
            <h2>قسيمة مفردات الراتب الشهري (Payslip)</h2>
            <p>شهر الاستحقاق: ${selectedMonth}</p>
          </div>

          <div style="margin-bottom: 20px; font-size: 13px;">
            <div><strong>كود الموظف:</strong> ${item.employeeId}</div>
            <div><strong>الاسم الكامل:</strong> ${item.employeeName}</div>
            <div><strong>مركز التكلفة:</strong> ${costCenterLabels[item.costCenter]}</div>
          </div>

          <div class="slip-grid">
            <div class="slip-box">
              <h3>المكتسبات والبدلات (+)</h3>
              <div class="row"><span>الراتب الأساسي:</span> <span>${formatCurrency(item.basicSalary, true)}</span></div>
              <div class="row"><span>البدلات الثابتة:</span> <span>${formatCurrency(item.allowances, true)}</span></div>
              <div class="row"><span>المكافآت والتحفيز:</span> <span>${formatCurrency(item.bonuses, true)}</span></div>
            </div>
            
            <div class="slip-box">
              <h3>الاستقطاعات والخصومات (-)</h3>
              <div class="row"><span>خصومات وغيابات:</span> <span style="color:red;">${formatCurrency(item.deductions, true)}</span></div>
              <div class="row"><span>أقساط السلف المستردة:</span> <span style="color:red;">${formatCurrency(item.advancesDeducted, true)}</span></div>
            </div>
          </div>

          <div class="slip-box" style="margin-bottom: 20px;">
            <div class="row total">
              <span>صافي الراتب المستحق للصرف:</span>
              <span>${formatCurrency(item.netSalary, true)}</span>
            </div>
          </div>

          <div style="font-size: 10px; text-align: right; color: #64748b;">
            <p>* تم تحويل هذا الراتب آلياً ومقاصته مع السجلات المصرفية والمالية بنجاح.</p>
          </div>

          <div class="footer">
            <p>© وحدة الاستحقاق والرواتب - ERP Suite</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Month & State Header card */}
      <div className="bg-slate-900/40 p-5 border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-[#dfb55a]">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">مسير رواتب العاملين لشهر استحقاق مالي</h3>
            <p className="text-xs text-slate-400">راجع مستحقات البدلات، الجزاءات، السلف المخصومة، ثم رحّلها آلياً للحسابات العامة.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-300">شهر الاستحقاق:</label>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-850 border border-slate-700 text-white rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#dfb55a]"
          />

          {isPosted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
              <ShieldCheck className="w-4 h-4" />
              <span>معتمد ومرحل للحسابات</span>
            </div>
          ) : (
            <button 
              onClick={handlePostPayroll}
              disabled={isApproved ? !canFinancialWrite : !canApprove}
              title={!isApproved ? 'يتطلب اعتماد المسير صلاحية اعتماد الموارد البشرية' : !isCommitted ? 'يتطلب إثبات الالتزام صلاحية الكتابة المالية' : 'يتطلب تنفيذ الصرف صلاحية الكتابة المالية'}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Play className="w-4 h-4" />
              <span>{!isApproved ? 'اعتماد مسير الرواتب' : !isCommitted ? 'إثبات التزام الرواتب' : 'تنفيذ الصرف وترحيل القيد'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-amber-700/25 bg-amber-50/70 p-4 md:grid-cols-[1fr_auto] md:items-center" role="status" aria-label="مسار اعتماد مسير الرواتب">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black text-slate-900">حالة مسير {selectedMonth}</span>
            <span className="rounded-full border border-amber-700/30 bg-white px-2.5 py-1 text-[10px] font-black text-slate-900">{payrollStageLabel}</span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {stageSteps.map((step, index) => <div key={step} className={`rounded-md px-1.5 py-1.5 text-center text-[9px] font-black ${index <= payrollStage ? 'bg-emerald-700 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}><span className="block">{index + 1}</span>{step}</div>)}
          </div>
        </div>
        <div className="text-[10px] font-bold leading-5 text-slate-700 md:max-w-xs">لا يتم إنشاء قيد مالي عند اعتماد HR. يثبت الالتزام أولاً، ثم ينفذ الصرف فقط بصلاحية مالية موثقة.</div>
      </div>

      <div className={`rounded-xl border p-4 ${readinessWarnings.length > 0 ? 'border-amber-700/30 bg-amber-50/70' : 'border-emerald-700/30 bg-emerald-50/70'}`} role="status" aria-label="فحص جاهزية مسير الرواتب">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-black text-slate-900">فحص الجاهزية قبل الاعتماد</h4>
            <p className="mt-1 text-xs font-bold text-slate-600">مراجعة غير تدميرية للعقد والحساب البنكي والحضور قبل انتقال المسير للمرحلة التالية.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${readinessWarnings.length > 0 ? 'bg-amber-200 text-amber-950' : 'bg-emerald-200 text-emerald-950'}`}>
            {readinessWarnings.length > 0 ? `${readinessWarnings.length} تنبيه للمراجعة` : 'جاهز مبدئيًا'}
          </span>
        </div>
        <div className="mt-3 grid gap-2 text-xs font-bold text-slate-700 md:grid-cols-3">
          <div className="rounded-lg bg-white/80 p-2">العقود السارية: {coveredEmployees.length} / {activeEmployees.length}</div>
          <div className="rounded-lg bg-white/80 p-2">الحسابات البنكية المكتملة: {activeEmployees.length - employeesWithoutBank} / {activeEmployees.length}</div>
          <div className="rounded-lg bg-white/80 p-2">سجلات الحضور: {attendanceDaysInPeriod}</div>
        </div>
        {readinessWarnings.length > 0 && <ul className="mt-3 space-y-1 text-xs font-bold text-amber-950" aria-label="تنبيهات الجاهزية">{readinessWarnings.map(warning => <li key={warning}>• {warning}</li>)}</ul>}
      </div>

      {/* Financial totals bento summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-slate-900/40 p-4 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-500 block">إجمالي الأساسي</span>
          <span className="text-sm font-bold text-slate-200 font-mono">{formatCurrency(totals.basic, true)}</span>
        </div>
        <div className="bg-slate-900/40 p-4 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-500 block">البدلات الممنوحة</span>
          <span className="text-sm font-bold text-emerald-400 font-mono">+{formatCurrency(totals.allowances, true)}</span>
        </div>
        <div className="bg-slate-900/40 p-4 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-500 block">المكافآت التحفيزية</span>
          <span className="text-sm font-bold text-emerald-400 font-mono">+{formatCurrency(totals.bonuses, true)}</span>
        </div>
        <div className="bg-slate-900/40 p-4 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-500 block">الخصومات والجزاءات</span>
          <span className="text-sm font-bold text-rose-400 font-mono">-{formatCurrency(totals.deductions, true)}</span>
        </div>
        <div className="bg-slate-900/40 p-4 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-500 block">أقساط سلف مستردة</span>
          <span className="text-sm font-bold text-[#dfb55a] font-mono">-{formatCurrency(totals.advances, true)}</span>
        </div>
        <div className="bg-slate-900/40 p-4 border border-slate-700 text-center bg-emerald-950/20">
          <span className="text-[10px] text-emerald-400 block font-bold">الصافي الإجمالي المستحق</span>
          <span className="text-base font-black text-emerald-400 font-mono">{formatCurrency(totals.net, true)}</span>
        </div>
      </div>

      {/* Payroll spreadsheet table */}
      <div className="bg-slate-900/60 border border-slate-800 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-[11px] text-slate-400 font-bold">
                <th className="p-4">كود الموظف</th>
                <th className="p-4">اسم الموظف</th>
                <th className="p-4">مركز التكلفة</th>
                <th className="p-4 text-center">الراتب الأساسي (+)</th>
                <th className="p-4 text-center">البدلات الثابتة (+)</th>
                <th className="p-4 text-center">المكافآت الممنوحة (+)</th>
                <th className="p-4 text-center">الخصومات والغياب (-)</th>
                <th className="p-4 text-center">قسط السلفة (-)</th>
                <th className="p-4 text-center text-emerald-400 font-bold">صافي الراتب المستحق (=)</th>
                <th className="p-4 text-center">قسيمة الصرف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {payrollList.length === 0 ? (
                <tr><td colSpan={10} className="p-12 text-center"><div className="mx-auto max-w-md rounded-xl border border-dashed border-amber-700/30 bg-amber-50/60 p-6"><FileText className="mx-auto mb-2 h-8 w-8 text-amber-700" /><p className="font-black text-slate-900">لا توجد رواتب قابلة للعرض لهذه الفترة</p><p className="mt-1 text-xs font-bold text-slate-600">تحقق من الموظفين النشطين أو اختر شهر استحقاق آخر. لم يتم إنشاء أي مسير تلقائيًا.</p></div></td></tr>
              ) : payrollList.map(item => (
                <tr key={item.employeeId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-semibold text-slate-400">{item.employeeId}</td>
                  <td className="p-4 font-bold text-white">{item.employeeName}</td>
                  <td className="p-4 font-medium text-slate-300">{costCenterLabels[item.costCenter]}</td>
                  <td className="p-4 text-center font-mono text-slate-300">{formatCurrency(item.basicSalary, false)}</td>
                  <td className="p-4 text-center font-mono text-emerald-500/80">+{formatCurrency(item.allowances, false)}</td>
                  <td className="p-4 text-center font-mono text-emerald-400">
                    {item.bonuses > 0 ? `+${formatCurrency(item.bonuses, false)}` : '-'}
                  </td>
                  <td className="p-4 text-center font-mono text-rose-400">
                    {item.deductions > 0 ? `-${formatCurrency(item.deductions, false)}` : '-'}
                  </td>
                  <td className="p-4 text-center font-mono text-amber-500">
                    {item.advancesDeducted > 0 ? `-${formatCurrency(item.advancesDeducted, false)}` : '-'}
                  </td>
                  <td className="p-4 text-center font-mono font-black text-emerald-400 bg-emerald-950/5">
                    {formatCurrency(item.netSalary, true)}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handlePrintSlip(item)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-[#dfb55a] rounded"
                      title="طباعة قسيمة الراتب"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
