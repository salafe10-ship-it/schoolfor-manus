import { Check, CheckSquare, Coins, CreditCard, Eye, FileText, Filter, Play, Printer, Search, ShieldAlert, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { EnterpriseLogger } from '../../database/services/EnterpriseLogger';
import React, { useState, useEffect } from 'react';
import { HREmployee, HRPenalty, HRAdvance, HRBonus, HRSettings } from './types';
import { SQLTransactionEngine } from '../../database/transactions/transactionManager';
import { SQLCommandBuilder } from '../../database/transactions/SQLCommand';
import { getTrustedAccessToken } from '../../utils/auth';
import { FallbackStorage } from '../../database/repositories/FallbackStorage';

interface PayrollTabProps {
  employees: HREmployee[];
  penalties: HRPenalty[];
  advances: HRAdvance[];
  rewards: HRBonus[];
  settings: HRSettings;
  formatCurrency: (amount: number, showSymbol?: boolean) => string;
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'error') => void;
  costCenterLabels: Record<string, string>;
  onApprovePayroll: (period: string) => Promise<void>;
  onPayPayroll: (period: string) => Promise<void>;
}

interface PayrollItem {
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  advancesDeducted: number;
  netSalary: number;
  costCenter: string;
}

export default function PayrollTab({
  employees,
  penalties,
  advances,
  rewards,
  settings,
  formatCurrency,
  triggerNotification,
  costCenterLabels,
  onApprovePayroll,
  onPayPayroll
}: PayrollTabProps) {
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [payrollList, setPayrollList] = useState<PayrollItem[]>([]);
  const [isPosted, setIsPosted] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<PayrollItem | null>(null);

  // Sync / Calculate payroll for selected month
  useEffect(() => {
    // Check if payroll is already posted in localStorage
    const postedKey = `erp_hr_payroll_posted_${selectedMonth}`;
    const postedVal = FallbackStorage.isCanonicalPersistenceRequired()
      ? null
      : localStorage.getItem(postedKey);
    setIsPosted(!!postedVal);

    // Calculate items
    const items: PayrollItem[] = employees
      .filter(emp => emp.status !== 'resigned')
      .map(emp => {
        // Calculate total allowances
        const totalAllowances = emp.allowances.reduce((acc, a) => acc + a.amount, 0);

        // Filter applied rewards for this employee in selected month
        const totalBonuses = rewards
          .filter(r => r.employeeId === emp.id && r.status === 'applied' && r.date.startsWith(selectedMonth))
          .reduce((acc, r) => acc + r.amount, 0);

        // Filter penalties for this employee in selected month
        const totalPenalties = penalties
          .filter(p => p.employeeId === emp.id && p.status === 'applied' && p.date.startsWith(selectedMonth))
          .reduce((acc, p) => acc + p.amount, 0);

        // Filter active advances and deduct installment
        const activeAdvance = advances.find(a => a.employeeId === emp.id && (a.status === 'approved' || a.status === 'fully_paid') && a.remainingAmount > 0);
        let advanceDeduction = 0;
        if (activeAdvance) {
          advanceDeduction = Math.min(activeAdvance.deductionPerMonth, activeAdvance.remainingAmount);
        }

        const net = emp.basicSalary + totalAllowances + totalBonuses - totalPenalties - advanceDeduction;

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          basicSalary: emp.basicSalary,
          allowances: totalAllowances,
          bonuses: totalBonuses,
          deductions: totalPenalties,
          advancesDeducted: advanceDeduction,
          netSalary: Math.max(0, net),
          costCenter: emp.costCenter
        };
      });

    setPayrollList(items);
  }, [employees, penalties, advances, rewards, selectedMonth]);

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
      await onApprovePayroll(selectedMonth);
      setIsApproved(true);
      return;
    }
    await onPayPayroll(selectedMonth);
    setIsPosted(true);
    return;

    if (FallbackStorage.isCanonicalPersistenceRequired()) {
      triggerNotification('ترحيل الرواتب متوقف حتى يتم ربط مسار الرواتب بمصدر محاسبي مركزي موثوق.', 'warning');
      return;
    }

    if (!confirm(`هل أنت متأكد من رغبتك في اعتماد مسير الرواتب لشهر (${selectedMonth}) وترحيله تلقائياً للحسابات العامة؟ سيعمل هذا الإجراء على تعديل ميزان المراجعة وتوليد القيود وسندات الصرف.`)) {
      return;
    }

    // Prepare ledger account references
    const bankSafeAccount = settings.defaultBankSafeAccount || '1102'; // Source bank/safe
    const salariesExpenseAccount = settings.defaultSalariesExpenseAccount || '5101'; // Salaries expense
    
    // We fetch general ledger journal entries and vouchers from localStorage to append our entries!
    let ledgerAccounts: any[] = [];
    let journalEntries: any[] = [];
    let paymentVouchers: any[] = [];

    try {
      const accs = localStorage.getItem('erp_chart_of_accounts_v2');
      if (accs) ledgerAccounts = JSON.parse(accs);
      const jvs = localStorage.getItem('erp_journal_entries_v2');
      if (jvs) journalEntries = JSON.parse(jvs);
      const pvs = localStorage.getItem('erp_payment_vouchers_v2');
      if (pvs) paymentVouchers = JSON.parse(pvs);
    } catch (e: any) {
      EnterpriseLogger.error("Failed to read ledger structures from localstorage", "PayrollTab", { error: e });
    }

    const jvId = `JV-2026-P${selectedMonth.replace('-', '')}`;
    const dateStr = new Date().toISOString().split('T')[0];

    SQLTransactionEngine.run({
      operationName: `POST_PAYROLL (ترحيل مسير الرواتب شهر ${selectedMonth})`,
      tenantId: 'school_1',
      userId: 'mgr_hr',
      userName: 'مدير الموارد البشرية',
      ipAddress: '192.168.1.100',
      affectedTables: ['accounts_ledger', 'journal_entries', 'voucher_payments'],
      validationBlock: () => ({ valid: true }),
      authorizationBlock: () => ({ authorized: true }),
      executionBlock: () => {
        // 1. Debit Salaries Expense and Credit Cash/Bank in the ledger account list
        if (ledgerAccounts.length > 0) {
          const updatedAccounts = ledgerAccounts.map((acc: any) => {
            if (acc.code === bankSafeAccount) {
              // Credit asset (reduces balance)
              return { ...acc, balance: Number(acc.balance) - totals.net };
            }
            if (acc.code === salariesExpenseAccount) {
              // Debit expense (increases balance)
              return { ...acc, balance: Number(acc.balance) + totals.net };
            }
            return acc;
          });
          localStorage.setItem('erp_chart_of_accounts_v2', JSON.stringify(updatedAccounts));
        }

        // 2. Append Double-Entry Journal Entry
        const newJV = {
          id: jvId,
          date: dateStr,
          description: `إثبات مستحقات وصرف مسير الرواتب والأجور لشهر ${selectedMonth} (قيد آلي)`,
          debitTotal: totals.net,
          creditTotal: totals.net,
          status: 'مرحل'
        };
        const updatedJVs = [newJV, ...journalEntries];
        localStorage.setItem('erp_journal_entries_v2', JSON.stringify(updatedJVs));

        // 3. For each paid employee, append a Payment Voucher (سند صرف)
        const newVouchers: any[] = [];
        payrollList.forEach((item, index) => {
          const pvId = `PV-2026-P${selectedMonth.replace('-', '')}${String(index + 1).padStart(3, '0')}`;
          
          newVouchers.push({
            id: pvId,
            date: dateStr,
            beneficiary: item.employeeName,
            costCenter: item.costCenter,
            paidFromAccount: bankSafeAccount,
            paidToAccount: salariesExpenseAccount,
            amount: item.netSalary,
            against: `صرف الراتب الصافي المستحق لشهر ${selectedMonth}`,
            attachmentName: null,
            paymentMethod: bankSafeAccount === '1102' ? 'تحويل' : 'نقدي',
            status: 'معتمد' as const,
            notes: `مسير رواتب الكتروني معتمد • راتب أساسي: ${item.basicSalary}، بدلات: ${item.allowances}، مكافآت: ${item.bonuses}، خصومات: ${item.deductions}`
          });
        });

        const updatedPVs = [...newVouchers, ...paymentVouchers];
        localStorage.setItem('erp_payment_vouchers_v2', JSON.stringify(updatedPVs));

        // Sync with server database authoritative financial API
        fetch('/api/financial/database', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getTrustedAccessToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            journalEntries: updatedJVs,
            paymentVouchers: updatedPVs,
            chartOfAccounts: ledgerAccounts.length > 0 ? ledgerAccounts : undefined
          })
        }).catch(err => {
          EnterpriseLogger.error("Failed to sync payroll postings with server financial database", "PayrollTab", { error: err });
        });

        // Mark payroll as posted in local storage
        localStorage.setItem(`erp_hr_payroll_posted_${selectedMonth}`, 'true');
        setIsPosted(true);

        return true;
      },
      nestedSqlQueries: [
        SQLCommandBuilder.create({
          sqlText: `-- Post Payroll for Month $1`,
          parameters: [selectedMonth],
          executionContext: 'Payroll Processing Engine'
        }),
        SQLCommandBuilder.create({
          sqlText: `UPDATE chart_of_accounts SET balance = balance - $1 WHERE code = $2;`,
          parameters: [totals.net, bankSafeAccount],
          executionContext: 'Payroll Balance Posting'
        }),
        SQLCommandBuilder.create({
          sqlText: `UPDATE chart_of_accounts SET balance = balance + $1 WHERE code = $2;`,
          parameters: [totals.net, salariesExpenseAccount],
          executionContext: 'Payroll Expense Posting'
        }),
        SQLCommandBuilder.create({
          sqlText: `INSERT INTO journal_entries (id, date, description, debit_total, credit_total, status) VALUES ($1, $2, $3, $4, $5, $6);`,
          parameters: [jvId, dateStr, `مسير الرواتب لشهر ${selectedMonth}`, totals.net, totals.net, 'Posted'],
          executionContext: 'Payroll Journal Logging'
        })
      ]
    });

    triggerNotification(`✓ تم اعتماد وترحيل مسير رواتب شهر ${selectedMonth} بنجاح! تم إنشاء القيود وتوليد عدد ${payrollList.length} سند صرف فردي وإدراجها بدفتر اليومية العامة للمدرسة.`, 'success');
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
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Play className="w-4 h-4" />
              <span>{isApproved ? 'تنفيذ الصرف وترحيل القيد' : 'اعتماد مسير الرواتب'}</span>
            </button>
          )}
        </div>
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
              {payrollList.map(item => (
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
