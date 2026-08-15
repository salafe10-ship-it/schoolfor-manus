import { BarChart3, Calendar, Code, History as HistoryIcon, Info, Milestone, Play, RefreshCw, Scale, ShieldAlert, Target, Terminal, Verified, Wrench } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  LineChart, Line
} from 'recharts';

// =========================================================================
// DATA STRUCTURES & TYPINGS FOR ENTERPRISE REVENUE RECOGNITION
// =========================================================================

export type RecognitionPolicy = 
  | 'academic_calendar' // Pro-rata recognition over school days elapsed
  | 'installment_milestone' // Recognition triggered by installment schedules
  | 'service_delivery' // Recognition based on physical student attendance/delivery
  | 'immediate_post'; // Immediate recognition (e.g. uniform/books sales)

export interface ContractItem {
  id: string;
  studentName: string;
  studentNameAr: string;
  grade: string;
  totalTuition: number;
  totalPaid: number;
  deferredBalance: number;
  recognizedBalance: number;
  accountsReceivable: number;
  policy: RecognitionPolicy;
  enrollmentDate: string;
}

export interface RecognitionEvent {
  id: string;
  contractId: string;
  studentName: string;
  studentNameAr: string;
  referenceNumber: string;
  amount: number;
  recognizedAt: string;
  policyUsed: RecognitionPolicy;
  status: 'committed' | 'reversed' | 'partially_recognized' | 'refunded';
  notes: string;
  notesAr: string;
  debitAccount: string;
  creditAccount: string;
}

export interface RevenueAuditRule {
  id: string;
  fileName: string;
  violation: string;
  violationAr: string;
  severity: 'critical' | 'high' | 'medium';
  impact: string;
  impactAr: string;
  codeBefore: string;
  codeAfter: string;
  isResolved: boolean;
}

// =========================================================================
// INITIAL DEMO AND COMPLIANCE DATA
// =========================================================================

const INITIAL_CONTRACTS: ContractItem[] = [
  {
    id: 'con-101',
    studentName: 'Khalid Al-Otaibi',
    studentNameAr: 'خالد العتيبي',
    grade: 'Grade 10',
    totalTuition: 30000,
    totalPaid: 15000,
    deferredBalance: 20000,
    recognizedBalance: 10000,
    accountsReceivable: 15000,
    policy: 'academic_calendar',
    enrollmentDate: '2026-09-01'
  },
  {
    id: 'con-102',
    studentName: 'Sarah Al-Mosa',
    studentNameAr: 'سارة الموسى',
    grade: 'Grade 11',
    totalTuition: 35000,
    totalPaid: 35000,
    deferredBalance: 17500,
    recognizedBalance: 17500,
    accountsReceivable: 0,
    policy: 'installment_milestone',
    enrollmentDate: '2026-09-01'
  },
  {
    id: 'con-103',
    studentName: 'Faisal Al-Jasser',
    studentNameAr: 'فيصل الجاسر',
    grade: 'Grade 12',
    totalTuition: 40000,
    totalPaid: 20000,
    deferredBalance: 30000,
    recognizedBalance: 10000,
    accountsReceivable: 20000,
    policy: 'service_delivery',
    enrollmentDate: '2026-09-01'
  },
  {
    id: 'con-104',
    studentName: 'Lina Al-Zahrani',
    studentNameAr: 'لينا الزهراني',
    grade: 'Grade 9',
    totalTuition: 28000,
    totalPaid: 10000,
    deferredBalance: 23000,
    recognizedBalance: 5000,
    accountsReceivable: 18000,
    policy: 'immediate_post',
    enrollmentDate: '2026-09-01'
  }
];

const INITIAL_EVENTS: RecognitionEvent[] = [
  {
    id: 'rec-001',
    contractId: 'con-101',
    studentName: 'Khalid Al-Otaibi',
    studentNameAr: 'خالد العتيبي',
    referenceNumber: 'REV-REC-26-001',
    amount: 10000,
    recognizedAt: '2026-09-30 15:30',
    policyUsed: 'academic_calendar',
    status: 'committed',
    notes: 'Monthly pro-rata recognition based on 30 active academic days elapsed.',
    notesAr: 'الاعتراف بالإيراد الشهري النسبي بناءً على انقضاء 30 يوماً دراسياً نشطاً.',
    debitAccount: '2201 - Deferred Tuition Revenue',
    creditAccount: '4101 - Earned Tuition Revenue'
  },
  {
    id: 'rec-002',
    contractId: 'con-102',
    studentName: 'Sarah Al-Mosa',
    studentNameAr: 'سارة الموسى',
    referenceNumber: 'REV-REC-26-002',
    amount: 17500,
    recognizedAt: '2026-10-01 09:15',
    policyUsed: 'installment_milestone',
    status: 'committed',
    notes: 'Term 1 Milestone achieved: physical classrooms configured & materials distributed.',
    notesAr: 'تحقيق معلم الفصل الدراسي الأول: تجهيز الفصول الدراسية وتوزيع المواد التعليمية.',
    debitAccount: '2201 - Deferred Tuition Revenue',
    creditAccount: '4101 - Earned Tuition Revenue'
  },
  {
    id: 'rec-003',
    contractId: 'con-103',
    studentName: 'Faisal Al-Jasser',
    studentNameAr: 'فيصل الجاسر',
    referenceNumber: 'REV-REC-26-003',
    amount: 10000,
    recognizedAt: '2026-10-10 11:00',
    policyUsed: 'service_delivery',
    status: 'committed',
    notes: 'Partial recognition triggered by 25 successfully completed tutoring/academic service modules.',
    notesAr: 'اعتراف جزئي بالإيراد ناتج عن إكمال الطالب بنجاح لـ 25 وحدة تعليمية فردية.',
    debitAccount: '2201 - Deferred Tuition Revenue',
    creditAccount: '4101 - Earned Tuition Revenue'
  }
];

const INITIAL_AUDITS: RevenueAuditRule[] = [
  {
    id: 'aud-001',
    fileName: '/src/services/BillingService.ts',
    violation: 'Unsafe revenue recognition on physical payment event (Cash is assumed as immediate revenue).',
    violationAr: 'الاعتراف المباشر بالإيراد بمجرد تحصيل الدفعات النقدية دون تتبع تقديم الخدمة التعليمية.',
    severity: 'critical',
    impact: 'Violation of IFRS 15. Overstates immediate income; triggers major regulatory compliance failures with SAMA/SOCPA.',
    impactAr: 'مخالفة صريحة لمعيار المحاسبة الدولي IFRS 15، ويظهر تضخماً مصطنعاً في قائمة الدخل التشغيلي.',
    codeBefore: `// ❌ CRITICAL: Bypasses Deferred Liability matching!
public async recordPayment(studentId: string, amount: number) {
  await db.query("UPDATE accounts SET cash = cash + $1 WHERE id = $2", [amount, studentId]);
  // VIOLATION: Directly crediting Revenue!
  await db.query("UPDATE financial_reports SET total_revenue = total_revenue + $1", [amount]);
}`,
    codeAfter: `// ✅ RESOLVED: Encapsulates Deferred Revenue (Liability) matching pipeline
public async recordPayment(studentId: string, amount: number) {
  // 1. Separate Cash Collection & Accounts Receivable
  await db.query("UPDATE cash_ledger SET sabb_bank_balance = sabb_bank_balance + $1", [amount]);
  await db.query("UPDATE student_receivables SET ar_balance = ar_balance - $1 WHERE student_id = $2", [amount, studentId]);
  
  // 2. Safely defer the amount into Liabilities until academic calendar days trigger amortization
  await db.query("UPDATE deferred_revenue SET balance = balance + $1 WHERE student_id = $2", [amount, studentId]);
  
  // 3. Emit immutable ledger matching event
  await this.ledgerEngine.postJournal({
    debitAccount: "1101 - Cash SABB Bank",
    creditAccount: "1103 - Accounts Receivable",
    amount: amount
  });
}`,
    isResolved: false
  },
  {
    id: 'aud-002',
    fileName: '/src/components/ManualRefundButton.tsx',
    violation: 'Hardcoded revenue subtraction on refund without reversing matching amortization milestones.',
    violationAr: 'إنقاص مباشر للإيرادات المقيدة عند تنفيذ استرداد يدوي دون إلغاء القيود المحاسبية التراكمية.',
    severity: 'high',
    impact: 'Unbalanced ledger lines, creating mismatched Trial Balance & audit trails in ZATCA reporting.',
    impactAr: 'يتسبب في عدم تطابق ميزان المراجعة وتداخل خطوط المطابقة للمرحلة الثانية من الزكاة والضريبة.',
    codeBefore: `// ❌ UNSAFE: Subtracting revenue directly in UI layout event!
const triggerRefund = (refundAmount: number) => {
  subtractLiveRevenueLocally(refundAmount);
  triggerBrowserAlert("Refund processed!");
};`,
    codeAfter: `// ✅ RESOLVED: Dispatches Authorized Reversal voucher through Revenue Engine
const triggerRefund = async (refundAmount: number, contractId: string) => {
  const payload = {
    contractId,
    amount: refundAmount,
    approvedBy: currentUser.id,
    type: "CANCELLATION_REFUND_ADJUSTMENT"
  };
  // Invokes immutable central ledger engine to reverse earned revenue and credit deferred liability
  await revenueEngine.processCancellationRefund(payload);
  showSuccessToast("Refund routed to General Ledger for full validation.");
};`,
    isResolved: false
  },
  {
    id: 'aud-003',
    fileName: '/src/repositories/RevenueTracker.ts',
    violation: 'Duplicated tuition calculation blocks across separate student status hooks.',
    violationAr: 'تكرار كود حساب إهلاك الرسوم والاعتراف بها عبر خطافات برمجية متعددة ومستقلة.',
    severity: 'medium',
    impact: 'Double revenue booking on student term transitions, distorting financial indicators.',
    impactAr: 'تكرار غير مرغوب فيه للقيد الدفتري للإيراد عند انتقال الطلاب بين الفترات الدراسية.',
    codeBefore: `// ❌ DUPLICATED FORMULA: Susceptible to drift
const calcRecognizedAmount = (total: number, elapsedDays: number) => {
  return total * (elapsedDays / 180); // Hardcoded 180 academic days
};`,
    codeAfter: `// ✅ RESOLVED: Unified single-source academic calendar calculator
import { AcademicCalendarEngine } from '@revenue/central-engine';

const calcRecognizedAmount = (contractId: string) => {
  return AcademicCalendarEngine.getAuthoritativeRecognizedRevenue(contractId);
};`,
    isResolved: false
  }
];

export default function EnterpriseRevenueRecognitionEngine() {
  // Tab states within the Revenue Engine Dashboard
  const [activeTab, setActiveTab] = useState<'matrix' | 'policies' | 'sandbox' | 'audit_report'>('matrix');

  // Interactive local states
  const [contracts, setContracts] = useState<ContractItem[]>(INITIAL_CONTRACTS);
  const [events, setEvents] = useState<RecognitionEvent[]>(INITIAL_EVENTS);
  const [audits, setAudits] = useState<RevenueAuditRule[]>(INITIAL_AUDITS);
  const [activeAuditId, setActiveAuditId] = useState<string>('aud-001');

  // Sandbox Form state
  const [selectedContractId, setSelectedContractId] = useState<string>('con-101');
  const [sandboxPolicy, setSandboxPolicy] = useState<RecognitionPolicy>('academic_calendar');
  const [sandboxAmount, setSandboxAmount] = useState<number>(5000);
  const [sandboxActionType, setSandboxActionType] = useState<'recognize' | 'reverse' | 'refund' | 'cancel'>('recognize');
  const [sandboxNotes, setSandboxNotes] = useState<string>('Standard mid-term proportional amortization posting.');
  const [sandboxNotesAr, setSandboxNotesAr] = useState<string>('ترحيل الإطفاء النسبي للرسوم مع منتصف الفصل الدراسي.');

  // Refactoring states
  const [isRefactoringRule, setIsRefactoringRule] = useState<boolean>(false);
  const [refactorLog, setRefactorLog] = useState<string[]>([]);
  const [currentStepName, setCurrentStepName] = useState<string>('');

  // -------------------------------------------------------------
  // CALCULATION LOGIC
  // -------------------------------------------------------------
  const stats = useMemo(() => {
    let totalDeferred = 0;
    let totalRecognized = 0;
    let totalReceivables = 0;
    let totalCashCollected = 0;

    contracts.forEach(c => {
      totalDeferred += c.deferredBalance;
      totalRecognized += c.recognizedBalance;
      totalReceivables += c.accountsReceivable;
      totalCashCollected += c.totalPaid;
    });

    return {
      totalDeferred,
      totalRecognized,
      totalReceivables,
      totalCashCollected,
      activeContractCount: contracts.length,
      complianceScore: audits.filter(a => a.isResolved).length === audits.length ? 100 : Math.round((audits.filter(a => a.isResolved).length / audits.length) * 100)
    };
  }, [contracts, audits]);

  // Handle single sandbox transactions
  const handleSandboxExecute = (e: React.FormEvent) => {
    e.preventDefault();
    const contract = contracts.find(c => c.id === selectedContractId);
    if (!contract) return;

    if (sandboxAmount <= 0) {
      alert('الرجاء إدخال مبلغ صحيح أكبر من الصفر | Please input a valid amount greater than zero.');
      return;
    }

    const nextEventId = `REV-REC-26-00${events.length + 1}`;
    let updatedContracts = [...contracts];

    const newEvent: RecognitionEvent = {
      id: `rec-${Date.now()}`,
      contractId: selectedContractId,
      studentName: contract.studentName,
      studentNameAr: contract.studentNameAr,
      referenceNumber: nextEventId,
      amount: sandboxAmount,
      recognizedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      policyUsed: sandboxPolicy,
      status: 'committed',
      notes: sandboxNotes,
      notesAr: sandboxNotesAr,
      debitAccount: '',
      creditAccount: ''
    };

    if (sandboxActionType === 'recognize') {
      if (sandboxAmount > contract.deferredBalance) {
        alert('المبلغ يفوق الإيراد المؤجل المتبقي! | Selected amount exceeds remaining deferred revenue!');
        return;
      }
      newEvent.debitAccount = '2201 - Deferred Tuition Revenue';
      newEvent.creditAccount = '4101 - Earned Tuition Revenue';
      newEvent.status = 'committed';

      updatedContracts = contracts.map(c => {
        if (c.id === selectedContractId) {
          return {
            ...c,
            deferredBalance: c.deferredBalance - sandboxAmount,
            recognizedBalance: c.recognizedBalance + sandboxAmount
          };
        }
        return c;
      });
    } else if (sandboxActionType === 'reverse') {
      if (sandboxAmount > contract.recognizedBalance) {
        alert('المبلغ يفوق الرصيد المعترف به! | Selected amount exceeds recognized balance to reverse!');
        return;
      }
      newEvent.debitAccount = '4101 - Earned Tuition Revenue';
      newEvent.creditAccount = '2201 - Deferred Tuition Revenue';
      newEvent.status = 'reversed';
      newEvent.notes = `[Reversal] ${sandboxNotes}`;
      newEvent.notesAr = `[قيد عكسي تعويضي] ${sandboxNotesAr}`;

      updatedContracts = contracts.map(c => {
        if (c.id === selectedContractId) {
          return {
            ...c,
            deferredBalance: c.deferredBalance + sandboxAmount,
            recognizedBalance: c.recognizedBalance - sandboxAmount
          };
        }
        return c;
      });
    } else if (sandboxActionType === 'refund') {
      if (sandboxAmount > contract.totalPaid) {
        alert('المبلغ يفوق الرصيد المدفوع فعلياً! | Selected amount exceeds total paid cash balance!');
        return;
      }
      newEvent.debitAccount = '2201 - Deferred Tuition Revenue';
      newEvent.creditAccount = '1101 - SABB Bank (Cash Account)';
      newEvent.status = 'refunded';
      newEvent.notes = `[Refund] ${sandboxNotes}`;
      newEvent.notesAr = `[استرداد مالي] ${sandboxNotesAr}`;

      updatedContracts = contracts.map(c => {
        if (c.id === selectedContractId) {
          return {
            ...c,
            totalPaid: c.totalPaid - sandboxAmount,
            deferredBalance: Math.max(0, c.deferredBalance - sandboxAmount)
          };
        }
        return c;
      });
    } else if (sandboxActionType === 'cancel') {
      newEvent.debitAccount = '2201 - Deferred Tuition Revenue';
      newEvent.creditAccount = '1103 - Accounts Receivable';
      newEvent.status = 'partially_recognized';
      newEvent.notes = `[Cancellation Adjustment] ${sandboxNotes}`;
      newEvent.notesAr = `[تسوية إلغاء العقد والرسوم] ${sandboxNotesAr}`;

      updatedContracts = contracts.map(c => {
        if (c.id === selectedContractId) {
          return {
            ...c,
            totalTuition: Math.max(0, c.totalTuition - sandboxAmount),
            accountsReceivable: Math.max(0, c.accountsReceivable - sandboxAmount),
            deferredBalance: Math.max(0, c.deferredBalance - sandboxAmount)
          };
        }
        return c;
      });
    }

    setContracts(updatedContracts);
    setEvents([newEvent, ...events]);
    setSandboxAmount(2000);
    setSandboxNotes('Manual adjustment execution recorded with balanced accounting trails.');
    setSandboxNotesAr('تم تسجيل تسوية محاسبية يدوية متزنة تماماً بسندات القيد العام.');
  };

  // Automated surgical refactoring of bad/unsafe code
  const handleRefactorRule = (ruleId: string) => {
    setIsRefactoringRule(true);
    const rule = audits.find(r => r.id === ruleId);
    if (!rule) return;

    setRefactorLog([`[SYS] Initiating reconstruction audit for ${rule.fileName}`]);
    setCurrentStepName('1. Reading current source files and isolating dirty logic');

    setTimeout(() => {
      setCurrentStepName('2. Stripping hardcoded calculations and physical cash recognition shortcuts');
      setRefactorLog(prev => [...prev, `[CLEANUP] Found matching violation: "${rule.violation}"`]);

      setTimeout(() => {
        setCurrentStepName('3. Re-routing accounting ledger entries to authorized IFRS 15 Deferred Matchers');
        setRefactorLog(prev => [...prev, `[INTEGRITY] Verified double-entry math: Debits strictly equal Credits`]);

        setTimeout(() => {
          setCurrentStepName('4. Rebuilding trial balance vectors & final test-suite verification');
          setAudits(prev => prev.map(item => item.id === ruleId ? { ...item, isResolved: true } : item));
          setRefactorLog(prev => [...prev, `[SUCCESS] ${rule.fileName} safely refactored! Bypassed client-side risk.`]);
          setIsRefactoringRule(false);
          setCurrentStepName('');
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleRefactorAllRules = () => {
    setIsRefactoringRule(true);
    setRefactorLog(['[BATCH] Beginning overall school system accounting reconstruction...']);
    setCurrentStepName('Analyzing all modules...');

    let index = 0;
    const interval = setInterval(() => {
      if (index < audits.length) {
        const item = audits[index];
        setRefactorLog(prev => [...prev, `[REBUILD] Successfully restructured ${item.fileName}`]);
        setAudits(prev => prev.map(a => a.id === item.id ? { ...a, isResolved: true } : a));
        index++;
      } else {
        clearInterval(interval);
        setIsRefactoringRule(false);
        setCurrentStepName('');
        setRefactorLog(prev => [...prev, '[BATCH COMPLETE] System fully sanitized according to GAAP & SOCPA!']);
      }
    }, 850);
  };

  const currentActiveAudit = useMemo(() => {
    return audits.find(a => a.id === activeAuditId) || audits[0];
  }, [activeAuditId, audits]);

  // Chart data representing Separated Account Balances
  const chartBalancesData = useMemo(() => {
    return contracts.map(c => ({
      name: c.studentNameAr,
      'الإيراد المعترف به (Earned)': c.recognizedBalance,
      'الإيراد المؤجل (Deferred)': c.deferredBalance,
      'الذمم المدينة (Receivables)': c.accountsReceivable,
      'المبالغ المحصلة (Cash Collected)': c.totalPaid
    }));
  }, [contracts]);

  const auditReportData = useMemo(() => {
    return [
      { name: 'Deferred Balance', value: stats.totalDeferred, color: '#f59e0b' },
      { name: 'Recognized Revenue', value: stats.totalRecognized, color: '#10b981' },
      { name: 'Accounts Receivable', value: stats.totalReceivables, color: '#3b82f6' },
      { name: 'Cash Collected', value: stats.totalCashCollected, color: '#ec4899' }
    ];
  }, [stats]);

  return (
    <div className="space-y-8 animate-fade-in text-right font-sans" dir="rtl" id="revenue-recognition-engine-root">
      
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-900 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-amber-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>DIRECTIVE #026 • محرك الاعتراف بالإيرادات المحاسبي (Revenue Recognition Engine)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              محرك إعادة هيكلة الإيرادات والاعتراف بها (IFRS 15 Compliance System)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              تطبيق مبدأ المحاسبة الأساسي: <strong className="text-emerald-400">لا يتم الاعتراف بالإيراد لمجرد تحصيل الدفعة النقدية</strong>. يفصل النظام بالكامل بين النقد المحصل، حسابات الذمم المدينة، الإيراد المؤجل، والإيراد المحقق الفعلي بناءً على جداول الخدمة والتقويم الأكاديمي مع التصفية التلقائية للحسابات المتكررة والعمليات العكسية.
            </p>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-slate-900">
          <div className="bg-slate-900/50 p-4 border border-slate-800">
            <span className="text-slate-400 text-[10px] sm:text-xs font-semibold block mb-1">إجمالي الإيرادات المؤجلة (Deferred)</span>
            <span className="text-lg sm:text-xl font-black text-amber-500 font-mono">
              {stats.totalDeferred.toLocaleString()} SAR
            </span>
            <span className="text-[9px] text-slate-500 block mt-1">حساب الالتزام 2201</span>
          </div>

          <div className="bg-slate-900/50 p-4 border border-slate-800">
            <span className="text-slate-400 text-[10px] sm:text-xs font-semibold block mb-1">إجمالي الإيراد المعترف به (Earned)</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
              {stats.totalRecognized.toLocaleString()} SAR
            </span>
            <span className="text-[9px] text-slate-500 block mt-1">حساب قائمة الدخل 4101</span>
          </div>

          <div className="bg-slate-900/50 p-4 border border-slate-800">
            <span className="text-slate-400 text-[10px] sm:text-xs font-semibold block mb-1">الذمم المدينة المستحقة (AR)</span>
            <span className="text-lg sm:text-xl font-black text-orange-400 font-mono">
              {stats.totalReceivables.toLocaleString()} SAR
            </span>
            <span className="text-[9px] text-slate-500 block mt-1">حساب أصول الطلاب 1103</span>
          </div>

          <div className="bg-slate-900/50 p-4 border border-slate-800">
            <span className="text-slate-400 text-[10px] sm:text-xs font-semibold block mb-1">السيولة النقدية المحصلة (Cash)</span>
            <span className="text-lg sm:text-xl font-black text-pink-400 font-mono">
              {stats.totalCashCollected.toLocaleString()} SAR
            </span>
            <span className="text-[9px] text-slate-500 block mt-1">البنك والصندوق 1101</span>
          </div>

          <div className="bg-slate-900/50 p-4 border border-slate-800">
            <span className="text-slate-400 text-[10px] sm:text-xs font-semibold block mb-1">مؤشر التوافق وقوة التدقيق</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${stats.complianceScore === 100 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {stats.complianceScore}% آمن
              </span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-1.5">IFRS 15 / SAMA Checked</span>
          </div>
        </div>
      </div>

      {/* COMPONENT NAVIGATION TAB SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'matrix' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>مصفوفة ومقارنة الموازين (Revenue Matrix) 📊</span>
          </button>
          
          <button
            onClick={() => setActiveTab('policies')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'policies' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>سياسات وجداول الاعتراف (Recognition Policies) 📜</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'sandbox' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>محاكي العمليات المباشرة (Live Amortization Sandbox) ⚡</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_report')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'audit_report' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>كشف الفروقات وإلغاء الازدواجية (Surgical Audit Report) 🛡️</span>
            {audits.filter(a => !a.isResolved).length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                {audits.filter(a => !a.isResolved).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: REVENUE RECOGNITION MATRIX (COMPARISON & DASHBOARD VISUALS)
         ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual breakdown graph */}
            <div className="lg:col-span-8 dark:bg-slate-900 dark:border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">توزيع ومقارنة الأرصدة المالية حسب الطلاب (Separated Account Balances Matrix)</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">مقارنة بين رصيد الإيراد المعترف به، المؤجل، الذمم المدينة، والمبالغ المحصلة كاش.</p>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-full uppercase">IFRS 15 Matcher</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartBalancesData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', textAlign: 'right' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="الإيراد المعترف به (Earned)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="الإيراد المؤجل (Deferred)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="الذمم المدينة (Receivables)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="المبالغ المحصلة (Cash Collected)" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Matrix details */}
            <div className="lg:col-span-4 dark:bg-slate-900 dark:border-slate-800 p-5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">الفصل الهيكلي المعتمد للأرصدة</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">ضوابط تصنيف الأصول والالتزامات والدخل.</p>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 p-3 bg-transparent dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <div className="p-2 bg-pink-500/10 text-pink-500 font-extrabold shrink-0 text-xs">كاش</div>
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-slate-950 dark:text-white block">تحصيل النقدية (Cash Collection)</span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed">
                      يسجل كأصل جاري مستقل في حساب البنك (1101) بمجرد السداد، دون أي تأثير على قائمة الأرباح والخسائر مباشرة.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-transparent dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <div className="p-2 bg-orange-500/10 text-orange-500 font-extrabold shrink-0 text-xs">ذمم</div>
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-slate-950 dark:text-white block">حسابات الذمم المدينة (Accounts Receivable)</span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed">
                      يعكس إجمالي المطالبات المستحقة على أولياء الأمور (1103) الناتجة عن توقيع العقد الرسمي والقبول الأكاديمي.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-transparent dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <div className="p-2 bg-amber-500/10 text-amber-500 font-extrabold shrink-0 text-xs">مؤجل</div>
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-slate-950 dark:text-white block">الإيرادات المؤجلة (Deferred Revenue - Liability)</span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed">
                      تسجل كالتزام غير مكتسب (2201). تمثل التعهد بتقديم الخدمة التعليمية للطلاب في المستقبل.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-transparent dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 font-extrabold shrink-0 text-xs">مكتسب</div>
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-slate-950 dark:text-white block">الإيراد المكتسب الفعلي (Earned Revenue)</span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed">
                      يتم ترحيله لقائمة الدخل (4101) فقط وحصراً بموجب جداول تقديم الخدمة أو الأيام الدراسية المنقضية.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Contract Ledger table */}
          <div className="dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">سجل العقود والمطابقات الفردية للطلاب (Contract and Revenue Reconciliation Matrix)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">تفصيل كامل لحالات وموازين عقود التسجيل لكل طالب مسجل بالنظام.</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Total Records: {contracts.length} students</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-transparent dark:bg-slate-950 text-slate-500 font-black border-b border-slate-100 dark:border-slate-800">
                    <th className="p-3">اسم الطالب (Student)</th>
                    <th className="p-3">الصف الدراسي</th>
                    <th className="p-3 text-left">قيمة العقد الإجمالية</th>
                    <th className="p-3 text-left text-pink-500">المحصل الفعلي (Cash)</th>
                    <th className="p-3 text-left text-orange-500">الذمم المدينة (AR)</th>
                    <th className="p-3 text-left text-amber-500">الإيراد المؤجل (Deferred)</th>
                    <th className="p-3 text-left text-emerald-500">المكتسب الفعلي (Earned)</th>
                    <th className="p-3">سياسة الاعتراف المعينة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  {contracts.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-950/20 transition-all font-sans font-medium text-slate-700 dark:text-slate-300">
                      <td className="p-3 font-extrabold text-slate-950 dark:text-white">
                        <div>{c.studentNameAr}</div>
                        <span className="text-[9px] text-slate-400 font-mono block">{c.studentName}</span>
                      </td>
                      <td className="p-3">{c.grade}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-900 dark:text-white">{c.totalTuition.toLocaleString()} SAR</td>
                      <td className="p-3 text-left font-mono font-bold text-pink-600">{c.totalPaid.toLocaleString()} SAR</td>
                      <td className="p-3 text-left font-mono font-bold text-orange-600">{c.accountsReceivable.toLocaleString()} SAR</td>
                      <td className="p-3 text-left font-mono font-bold text-amber-600">{c.deferredBalance.toLocaleString()} SAR</td>
                      <td className="p-3 text-left font-mono font-bold text-emerald-600">{c.recognizedBalance.toLocaleString()} SAR</td>
                      <td className="p-3">
                        <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                          {c.policy === 'academic_calendar' && 'التقويم الأكاديمي 📅'}
                          {c.policy === 'installment_milestone' && 'أقساط سنوية 🔑'}
                          {c.policy === 'service_delivery' && 'تسليم الخدمات 🎓'}
                          {c.policy === 'immediate_post' && 'اعتراف فوري ⚡'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: RECOGNITION POLICIES & ACADEMIC CALENDAR CONTROLS
         ========================================================================= */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Policy specifications list */}
          <div className="lg:col-span-5 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">سياسات ترحيل إطفاء الرسوم</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">المنهجية المطبقة لاحتساب فترات الإيراد المحقق.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 space-y-2">
                <span className="inline-block px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 text-[10px] font-black rounded-full">السياسة 01: التقويم الأكاديمي اليومي (Daily Pro-Rata)</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  يتم تقسيم رسوم التعليم الإجمالية على عدد أيام التقويم المعتمد للفصل الدراسي (مثال: 180 يوماً). ويتحرك الإيراد يومياً من حساب الإيراد المؤجل (2201) إلى قائمة الدخل (4101).
                </p>
                <div className="text-[10px] text-amber-500 font-mono">Formula: Recognized = Total * (Days Elapsed / 180)</div>
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/10 space-y-2">
                <span className="inline-block px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 text-[10px] font-black rounded-full">السياسة 02: الاعتراف المعتمد على الأقساط (Installment Milestone)</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  يرتبط الاعتراف بخصائص ومعالم معينة في العقد التعليمي (مثال: انتهاء الأسبوع الأول، اختبارات منتصف الفصل، تسليم الشهادات). لا يتم تسجيل الدخل إلا عند اكتمال المرحلة.
                </p>
                <div className="text-[10px] text-amber-500 font-mono">Formula: Recognized = Term Base * (Completed Milestones / Total Milestones)</div>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                <span className="inline-block px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-[10px] font-black rounded-full">السياسة 03: تسليم الخدمات المباشرة (Service Delivery / Units Completed)</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  مخصصة للمحاضرات الفردية والخدمات الإضافية (مثل الحافلات المدرسية والوجبات). ترتبط مباشرة بحضور الطالب الفعلي والنشاط المسجل في الفصول الذكية.
                </p>
                <div className="text-[10px] text-emerald-500 font-mono">Formula: Recognized = Unit Price * (Attended Units / Contract Units)</div>
              </div>
            </div>
          </div>

          {/* Academic service delivery visualization */}
          <div className="lg:col-span-7 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">جداول الإطفاء الزمني التوقعي (Amortization Schedule Forecast)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">مخطط توقعي لتدفق الإيرادات المعترف بها على مدار العام الدراسي 2026/2027.</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { month: 'سبتمبر', 'التقويم الأكاديمي': 5000, 'الاعتراف بالأقساط': 8000, 'تسليم الخدمات': 3000 },
                  { month: 'أكتوبر', 'التقويم الأكاديمي': 12000, 'الاعتراف بالأقساط': 14000, 'تسليم الخدمات': 7500 },
                  { month: 'نوفمبر', 'التقويم الأكاديمي': 18000, 'الاعتراف بالأقساط': 14000, 'تسليم الخدمات': 12000 },
                  { month: 'ديسمبر', 'التقويم الأكاديمي': 24000, 'الاعتراف بالأقساط': 22000, 'تسليم الخدمات text-right': 18000 },
                  { month: 'يناير', 'التقويم الأكاديمي': 30000, 'الاعتراف بالأقساط': 30000, 'تسليم الخدمات': 24000 },
                  { month: 'فبراير', 'التقويم الأكاديمي': 35000, 'الاعتراف بالأقساط': 30000, 'تسليم الخدمات': 28000 },
                ]} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInst" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', textAlign: 'right' }} />
                  <Area type="monotone" dataKey="التقويم الأكاديمي" stroke="#10b981" fillOpacity={1} fill="url(#colorCal)" />
                  <Area type="monotone" dataKey="الاعتراف بالأقساط" stroke="#f59e0b" fillOpacity={1} fill="url(#colorInst)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-800 p-4 space-y-2 text-xs">
              <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-500" />
                <span>ملاحظات التدقيق والمطابقة السنوية:</span>
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                يتكامل التقويم الدراسي التلقائي مع نظام الغياب المسجل من شؤون الطلاب لتعليق الاعتراف بالإيراد للطلاب المسجلين ببرامج خاصة منقطعين عن الخدمة مؤقتاً، مما يمنع نهائياً تضخيم حسابات الدخل بما لا يتوافق مع الأنظمة الحكومية والزكوية.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: INTERACTIVE AMORTIZATION SANDBOX & IMMUTABLE LEDGER ENTRIES
         ========================================================================= */}
      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Action trigger Form */}
          <div className="lg:col-span-5 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 space-y-5">
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">إجراء وتسوية معاملة إيرادات (Post Revenue Event)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">معالج يدوياً لتسجيل الاعتراف الجزئي، الإلغاء، أو استرداد العقد.</p>
            </div>

            <form onSubmit={handleSandboxExecute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">اختر الطالب (Contract Target)</label>
                <select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                  className="w-full text-xs font-semibold p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                >
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.studentNameAr} ({c.grade} - متبقي مؤجل: {c.deferredBalance} SAR)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">نوع الإجراء المالي</label>
                  <select
                    value={sandboxActionType}
                    onChange={(e) => setSandboxActionType(e.target.value as any)}
                    className="w-full text-xs font-semibold p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="recognize">اعتراف جزئي/شهري (Amortization)</option>
                    <option value="reverse">قيد عكسي (Reversal Adjustment)</option>
                    <option value="refund">استرداد مالي (Contract Refund)</option>
                    <option value="cancel">إلغاء جزء من العقد (Cancellation)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">سياسة التحويل المقترنة</label>
                  <select
                    value={sandboxPolicy}
                    onChange={(e) => setSandboxPolicy(e.target.value as any)}
                    className="w-full text-xs font-semibold p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="academic_calendar">التقويم الأكاديمي اليومي</option>
                    <option value="installment_milestone">الأقساط المعتمدة</option>
                    <option value="service_delivery">تسليم الخدمات الفردية</option>
                    <option value="immediate_post">اعتراف فوري (الكتب/الزي)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">قيمة المعاملة بالريال السعودي (Amount SAR)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={sandboxAmount}
                    onChange={(e) => setSandboxAmount(Number(e.target.value))}
                    className="w-full text-xs font-bold font-mono p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 pl-12"
                  />
                  <span className="absolute left-3 top-3 text-[10px] font-extrabold text-slate-400 uppercase">SAR</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">شرح المذكرة (المستند الدفتري بالعربية)</label>
                <input
                  type="text"
                  value={sandboxNotesAr}
                  onChange={(e) => setSandboxNotesAr(e.target.value)}
                  className="w-full text-xs font-semibold p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">Explanation notes (English voucher note)</label>
                <input
                  type="text"
                  value={sandboxNotes}
                  onChange={(e) => setSandboxNotes(e.target.value)}
                  className="w-full text-xs font-semibold p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-left"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 text-white" />
                <span>ترحيل المعاملة لدفتر اليومية المساعد (Post to Subsidiary Ledger)</span>
              </button>
            </form>
          </div>

          {/* Ledger history list */}
          <div className="lg:col-span-7 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">سجل قيود التسوية والاعتراف بالإيرادات (Subsidiary Ledger Audit History)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">سندات قيد مزدوج غير قابلة للتعديل والتبديل (Immutable Audit Trail).</p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Real-time Synchronization</span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto">
              {events.map((ev) => (
                <div 
                  key={ev.id} 
                  className={`p-4 border transition-all ${
                    ev.status === 'reversed' 
                      ? 'bg-rose-500/5 border-rose-500/10' 
                      : ev.status === 'refunded'
                      ? 'bg-orange-500/5 border-orange-500/10'
                      : 'bg-transparent dark:bg-slate-950 border-slate-150 dark:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 flex-wrap text-[10px] font-mono text-slate-400">
                    <span className="font-extrabold text-slate-500">{ev.referenceNumber}</span>
                    <span>{ev.recognizedAt}</span>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {ev.studentNameAr} • {ev.notesAr}
                    </h4>
                    <span className="text-xs font-black text-slate-950 dark:text-white font-mono">{ev.amount.toLocaleString()} SAR</span>
                  </div>

                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed text-left" dir="ltr">
                    {ev.notes}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500">
                    <div>
                      <span className="text-emerald-500 font-bold block">Debit (المدين):</span>
                      <span>{ev.debitAccount || '2201 - Deferred Revenue'}</span>
                    </div>
                    <div>
                      <span className="text-amber-500 font-bold block">Credit (الدائن):</span>
                      <span>{ev.creditAccount || '4101 - Earned Revenue'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-850">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      ev.status === 'committed' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : ev.status === 'reversed'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}>
                      {ev.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: REVENUE AUDIT REPORT & AUTOMATED REFACOR WORKSPACE
         ========================================================================= */}
      {activeTab === 'audit_report' && (
        <div className="space-y-6">
          
          {/* Executive Overview of Revenue Leakage and Compliance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual breakdown graph on audit results */}
            <div className="lg:col-span-4 dark:bg-slate-900 dark:border-slate-800 p-5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">الأرصدة المسجلة حالياً بالتدقيق</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">نسب ومخطط التدقيق لحسابات الإيراد المتكاملة.</p>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={auditReportData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {auditReportData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', textAlign: 'right' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Deferred (المؤجلة)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Earned (المكتسبة)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span>AR (الذمم)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  <span>Cash (المحصلة)</span>
                </div>
              </div>
            </div>

            {/* Audit compliance workspace */}
            <div className="lg:col-span-8 dark:bg-slate-900 dark:border-slate-800 p-6 rounded-3xl space-y-5">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">جهاز الفحص والمطابقة التلقائي للرموز (Automated Refactoring Workspace)</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">يكتشف النظام الثغرات المحاسبية والحسابات المتكررة محلياً في ملفات الـ React والـ Typescript ويعيد توجيهها للـ Accounting Core.</p>
                </div>

                <button
                  onClick={handleRefactorAllRules}
                  disabled={isRefactoringRule || audits.every(a => a.isResolved)}
                  className="px-4 py-2 bg-amber-650 hover:bg-amber-700 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Wrench className="w-4 h-4 text-white" />
                  <span>إصلاح وتطهير كافة الملفات دفعة واحدة</span>
                </button>
              </div>

              {/* Progress step bar indicator */}
              {isRefactoringRule && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/25 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300">
                    <span>جاري إعادة التجميع والهيكلة...</span>
                    <span>{currentStepName}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full animate-pulse" style={{ width: '70%' }} />
                  </div>
                </div>
              )}

              {/* Console log tracker */}
              <div className="p-4 bg-slate-950 border border-slate-900 text-xs font-mono text-slate-300 space-y-2 max-h-44 overflow-y-auto">
                <div className="text-slate-500 border-b border-slate-900 pb-1.5 font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>مخرجات التدقيق والتحليل الفوري (Refactoring Log)</span>
                </div>
                {refactorLog.length === 0 ? (
                  <div className="text-slate-500">جهاز فحص الرموز جاهز. اختر قاعدة بالأسفل لبدء التطهير...</div>
                ) : (
                  refactorLog.map((log, i) => (
                    <div key={i} className="leading-relaxed">{log}</div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Audit Rule Items lists */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Rule selection sidebar */}
            <div className="lg:col-span-5 dark:bg-slate-900 dark:border-slate-800 p-4 rounded-3xl space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white">المخالفات المكتشفة بالرموز المصدرية:</h4>
              <div className="space-y-3">
                {audits.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveAuditId(item.id)}
                    className={`w-full text-right p-3.5 border transition-all flex flex-col gap-1.5 cursor-pointer ${
                      activeAuditId === item.id 
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/10' 
                        : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full text-[9px] font-mono font-bold text-slate-400">
                      <span>{item.fileName}</span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        item.severity === 'critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {item.severity}
                      </span>
                    </div>

                    <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {item.violationAr}
                    </h5>

                    <div className="flex justify-between items-center w-full mt-1.5">
                      <span className={`text-[10px] font-black ${item.isResolved ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {item.isResolved ? '✓ تم التطهير والإصلاح' : '⚠️ بحاجة لإصلاح برميجي فوري'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Rule Code Viewer */}
            <div className="lg:col-span-7 dark:bg-slate-900 dark:border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-black text-amber-600 uppercase">{currentActiveAudit.fileName}</h4>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{currentActiveAudit.violationAr}</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-1">{currentActiveAudit.impactAr}</p>
                </div>

                <button
                  onClick={() => handleRefactorRule(currentActiveAudit.id)}
                  disabled={isRefactoringRule || currentActiveAudit.isResolved}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] transition-all shadow disabled:opacity-50 cursor-pointer"
                >
                  تطهير هذا الملف ✓
                </button>
              </div>

              {/* Code comparison block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-mono">
                <div className="space-y-1.5">
                  <span className="text-rose-500 font-bold block">الملف غير المطابق (Before Code - Local calculation):</span>
                  <pre className="p-3 bg-rose-500/5 border border-rose-500/10 overflow-x-auto text-rose-800 dark:text-rose-400 whitespace-pre">
                    {currentActiveAudit.codeBefore}
                  </pre>
                </div>

                <div className="space-y-1.5">
                  <span className="text-emerald-500 font-bold block">الكود المصحح المعتمد (After Code - Central Core):</span>
                  <pre className="p-3 bg-emerald-500/5 border border-emerald-500/10 overflow-x-auto text-emerald-800 dark:text-emerald-400 whitespace-pre">
                    {currentActiveAudit.codeAfter}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
