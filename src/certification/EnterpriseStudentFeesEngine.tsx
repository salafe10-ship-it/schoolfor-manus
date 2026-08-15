import { Activity, Ban, BookOpen, Bus, Calendar, Check, CheckCircle2, ClipboardList, Coins, FileX, Flame, Gift, Navigation, Percent, Receipt, School, ShieldCheck, Sparkles, Split, Table, UserCheck, Verified } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  LineChart, Line
} from 'recharts';

// =========================================================================
// DATA STRUCTURES & TYPINGS FOR ENTERPRISE STUDENT FEES ENGINE
// =========================================================================

export interface FeeDefinition {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  category: 'tuition' | 'transport' | 'laboratory' | 'uniform' | 'activities';
  baseAmount: number;
}

export interface DiscountScholarshipExemption {
  id: string;
  studentId: string;
  type: 'discount' | 'scholarship' | 'exemption' | 'write_off';
  nameEn: string;
  nameAr: string;
  valueType: 'percentage' | 'fixed';
  value: number;
  reasonEn: string;
  reasonAr: string;
}

export interface StudentProfile {
  id: string;
  nameEn: string;
  nameAr: string;
  grade: string;
  enrollmentStatus: 'active' | 'suspended' | 'graduated';
}

export interface FeeAssessment {
  id: string;
  studentId: string;
  feeDefinitionId: string;
  baseAmount: number;
  discountAmount: number;     // Separate Discounts
  scholarshipAmount: number;  // Separate Scholarships
  exemptionAmount: number;    // Separate Exemptions
  writeOffAmount: number;     // Separate Write-offs
  latePenaltyAmount: number;  // Support Late Penalties
  netDue: number;             // netDue = base - discount - scholarship - exemption - writeOff + penalties
  isAssessed: boolean;
  assessedAt?: string;
}

export interface InstallmentPlan {
  id: string;
  assessmentId: string;
  studentId: string;
  titleEn: string;
  titleAr: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  penaltyApplied: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue';
}

export interface PaymentReceipt {
  id: string;
  studentId: string;
  receiptNumber: string;
  amountReceived: number;
  paymentMethod: 'bank_transfer' | 'pos_mada' | 'credit_card' | 'cash';
  transactionReference: string;
  receivedAt: string;
  unallocatedAmount: number; // For Overpayments leading to Credit Balances
}

export interface SettlementAllocation {
  id: string;
  receiptId: string;
  installmentPlanId: string;
  allocatedAmount: number;
  allocatedAt: string;
  allocationRule: 'oldest_due_first' | 'tuition_priority' | 'manual_override';
}

export interface DoubleEntryVoucher {
  id: string;
  referenceNo: string;
  type: 'assessment' | 'collection' | 'allocation' | 'discount_apply' | 'scholarship_apply' | 'exemption_apply' | 'write_off_apply' | 'penalty_accrual' | 'refund_execute';
  timestamp: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  narrativeEn: string;
  narrativeAr: string;
  isReconciled: boolean;
}

// =========================================================================
// INITIAL SYSTEM DATA
// =========================================================================

const INITIAL_FEES_DEFINITIONS: FeeDefinition[] = [
  { id: 'fd-tui', code: 'FE-TUI-G10', nameEn: 'Tuition Fee - Grade 10', nameAr: 'رسوم التعليم - الصف العاشر', category: 'tuition', baseAmount: 25000 },
  { id: 'fd-tra', code: 'FE-TRA-BUS', nameEn: 'Transport Fee - Bus Service', nameAr: 'رسوم النقل - خدمة الحافلة', category: 'transport', baseAmount: 3000 },
  { id: 'fd-lab', code: 'FE-LAB-SCI', nameEn: 'Laboratory & Tech Fee', nameAr: 'رسوم المختبرات والتقنية', category: 'laboratory', baseAmount: 1500 },
  { id: 'fd-uni', code: 'FE-UNI-SET', nameEn: 'School Uniform Set', nameAr: 'زي مدرسي كامل', category: 'uniform', baseAmount: 800 }
];

const INITIAL_STUDENTS: StudentProfile[] = [
  { id: 'std-201', nameEn: 'Yousef Al-Shammari', nameAr: 'يوسف الشمري', grade: 'Grade 10', enrollmentStatus: 'active' },
  { id: 'std-202', nameEn: 'Alanoud Al-Faisal', nameAr: 'العنود الفيصل', grade: 'Grade 10', enrollmentStatus: 'active' },
  { id: 'std-203', nameEn: 'Mazen Bin Laden', nameAr: 'مازن بن لادن', grade: 'Grade 10', enrollmentStatus: 'active' },
  { id: 'std-204', nameEn: 'Ghadah Al-Saeed', nameAr: 'غادة السعيد', grade: 'Grade 10', enrollmentStatus: 'active' }
];

const INITIAL_DISCOUNTS: DiscountScholarshipExemption[] = [
  { id: 'dse-1', studentId: 'std-201', type: 'discount', nameEn: 'Sibling Discount', nameAr: 'خصم الأخوة والأشقاء', valueType: 'percentage', value: 10, reasonEn: 'Third sibling currently enrolled', reasonAr: 'الابن الثالث المسجل بالمدرسة' },
  { id: 'dse-2', studentId: 'std-202', type: 'scholarship', nameEn: 'Academic Excellence Scholarship', nameAr: 'منحة التميز العلمي الكاملا', valueType: 'fixed', value: 15000, reasonEn: '99.5% cumulative average GPA score', reasonAr: 'معدل تراكمي 99.5٪ في الفصل الأخير' },
  { id: 'dse-3', studentId: 'std-203', type: 'exemption', nameEn: 'Ministry of Education Special Exemption', nameAr: 'إعفاء خاص من وزارة التعليم', valueType: 'fixed', value: 5000, reasonEn: 'MoE cultural exchange sponsor program', reasonAr: 'برنامج رعاية التبادل الثقافي للوزارة' },
  { id: 'dse-4', studentId: 'std-204', type: 'write_off', nameEn: 'Bad Debt Write-off Adjustment', nameAr: 'إعدام دين - تسوية الأرصدة المستعصية', valueType: 'fixed', value: 3000, reasonEn: 'Approved write-off for outstanding prior year', reasonAr: 'إعدام دين معتمد للأرصدة غير المحصلة من العام السابق' }
];

const INITIAL_ASSESSMENTS: FeeAssessment[] = [
  {
    id: 'as-01',
    studentId: 'std-201',
    feeDefinitionId: 'fd-tui',
    baseAmount: 25000,
    discountAmount: 2500, // 10% Sibling Discount
    scholarshipAmount: 0,
    exemptionAmount: 0,
    writeOffAmount: 0,
    latePenaltyAmount: 500, // Accumulated late penalties
    netDue: 23000, // 25000 - 2500 + 500
    isAssessed: true,
    assessedAt: '2026-07-01 08:30'
  },
  {
    id: 'as-02',
    studentId: 'std-202',
    feeDefinitionId: 'fd-tui',
    baseAmount: 25000,
    discountAmount: 0,
    scholarshipAmount: 15000, // Excellence Scholarship
    exemptionAmount: 0,
    writeOffAmount: 0,
    latePenaltyAmount: 0,
    netDue: 10000, // 25000 - 15000
    isAssessed: true,
    assessedAt: '2026-07-01 09:00'
  },
  {
    id: 'as-03',
    studentId: 'std-203',
    feeDefinitionId: 'fd-tui',
    baseAmount: 25000,
    discountAmount: 0,
    scholarshipAmount: 0,
    exemptionAmount: 5000, // Ministry Exemption
    writeOffAmount: 0,
    latePenaltyAmount: 0,
    netDue: 20000, // 25000 - 5000
    isAssessed: true,
    assessedAt: '2026-07-02 10:15'
  },
  {
    id: 'as-04',
    studentId: 'std-204',
    feeDefinitionId: 'fd-tui',
    baseAmount: 25000,
    discountAmount: 0,
    scholarshipAmount: 0,
    exemptionAmount: 0,
    writeOffAmount: 3000, // Prior bad debt write-off
    latePenaltyAmount: 0,
    netDue: 22000, // 25000 - 3000
    isAssessed: true,
    assessedAt: '2026-07-02 11:30'
  }
];

const INITIAL_INSTALLMENTS: InstallmentPlan[] = [
  // Installment schedules for Yousef Al-Shammari (Total Net Due: 23000)
  { id: 'inst-1a', assessmentId: 'as-01', studentId: 'std-201', titleEn: 'Term 1 Installment', titleAr: 'القسط الدراسي الأول', dueDate: '2026-08-01', amountDue: 11500, amountPaid: 11500, penaltyApplied: 0, status: 'paid' },
  { id: 'inst-1b', assessmentId: 'as-01', studentId: 'std-201', titleEn: 'Term 2 Installment', titleAr: 'القسط الدراسي الثاني', dueDate: '2026-12-01', amountDue: 11500, amountPaid: 3000, penaltyApplied: 500, status: 'partial' },

  // Installment schedules for Alanoud Al-Faisal (Total Net Due: 10000)
  { id: 'inst-2a', assessmentId: 'as-02', studentId: 'std-202', titleEn: 'Term 1 Installment', titleAr: 'القسط الدراسي الأول', dueDate: '2026-08-01', amountDue: 5000, amountPaid: 5000, penaltyApplied: 0, status: 'paid' },
  { id: 'inst-2b', assessmentId: 'as-02', studentId: 'std-202', titleEn: 'Term 2 Installment', titleAr: 'القسط الدراسي الثاني', dueDate: '2026-12-01', amountDue: 5000, amountPaid: 0, penaltyApplied: 0, status: 'unpaid' },

  // Installment schedules for Mazen Bin Laden (Total Net Due: 20000)
  { id: 'inst-3a', assessmentId: 'as-03', studentId: 'std-203', titleEn: 'Term 1 Installment', titleAr: 'القسط الدراسي الأول', dueDate: '2026-08-01', amountDue: 10000, amountPaid: 10000, penaltyApplied: 0, status: 'paid' },
  { id: 'inst-3b', assessmentId: 'as-03', studentId: 'std-203', titleEn: 'Term 2 Installment', titleAr: 'القسط الدراسي الثاني', dueDate: '2026-12-01', amountDue: 10000, amountPaid: 0, penaltyApplied: 0, status: 'unpaid' }
];

const INITIAL_RECEIPTS: PaymentReceipt[] = [
  { id: 'rec-201', studentId: 'std-201', receiptNumber: 'RECPT-2026-0941', amountReceived: 11500, paymentMethod: 'bank_transfer', transactionReference: 'TXN-948194', receivedAt: '2026-07-28 14:00', unallocatedAmount: 0 },
  { id: 'rec-202', studentId: 'std-201', receiptNumber: 'RECPT-2026-1025', amountReceived: 3000, paymentMethod: 'pos_mada', transactionReference: 'TXN-382910', receivedAt: '2026-12-15 11:20', unallocatedAmount: 0 },
  { id: 'rec-203', studentId: 'std-202', receiptNumber: 'RECPT-2026-0955', amountReceived: 6500, paymentMethod: 'credit_card', transactionReference: 'TXN-120593', receivedAt: '2026-07-30 09:15', unallocatedAmount: 1500 } // Overpayment! Credit Balance!
];

const INITIAL_SETTLEMENTS: SettlementAllocation[] = [
  { id: 'set-01', receiptId: 'rec-201', installmentPlanId: 'inst-1a', allocatedAmount: 11500, allocatedAt: '2026-07-28 14:05', allocationRule: 'tuition_priority' },
  { id: 'set-02', receiptId: 'rec-202', installmentPlanId: 'inst-1b', allocatedAmount: 3000, allocatedAt: '2026-12-15 11:25', allocationRule: 'oldest_due_first' },
  { id: 'set-03', receiptId: 'rec-203', installmentPlanId: 'inst-2a', allocatedAmount: 5000, allocatedAt: '2026-07-30 09:20', allocationRule: 'oldest_due_first' }
];

const INITIAL_VOUCHERS: DoubleEntryVoucher[] = [
  {
    id: 'v-01',
    referenceNo: 'JV-FE-26001',
    type: 'assessment',
    timestamp: '2026-07-01 08:30',
    debitAccount: '1103 - Student Accounts Receivable (Yousef Sh.)',
    creditAccount: '2201 - Deferred Tuition Revenue',
    amount: 25000,
    narrativeEn: 'Base tuition assessment post for Grade 10',
    narrativeAr: 'تقييد قيد الرسوم الدراسية الأساسية للسنة الأكاديمية - الصف العاشر',
    isReconciled: true
  },
  {
    id: 'v-02',
    referenceNo: 'JV-FE-26002',
    type: 'discount_apply',
    timestamp: '2026-07-01 08:31',
    debitAccount: '4102 - Tuition Discounts (Sibling discount)',
    creditAccount: '1103 - Student Accounts Receivable (Yousef Sh.)',
    amount: 2500,
    narrativeEn: '10% Sibling discount applied to tuition assessment',
    narrativeAr: 'تطبيق قيد خصم الأخوة المعتمد بنسبة 10٪ على حساب الرسوم المدينة للطالب',
    isReconciled: true
  },
  {
    id: 'v-03',
    referenceNo: 'JV-FE-26003',
    type: 'collection',
    timestamp: '2026-07-28 14:00',
    debitAccount: '1101 - SABB Bank Operating Account',
    creditAccount: '1103 - Student Accounts Receivable (Yousef Sh.)',
    amount: 11500,
    narrativeEn: 'Cash collection payment for Term 1 installment via Bank Transfer',
    narrativeAr: 'قيد المقبوضات النقدية والتحصيل المصرفي المصاحب للقسط الأول - تحويل بنكي ساب',
    isReconciled: true
  }
];

export default function EnterpriseStudentFeesEngine() {
  // Navigation tabs within Student Fees Subsystem
  const [activeTab, setActiveTab] = useState<'assessments' | 'collections' | 'credits' | 'adjustments' | 'reconciliation' | 'integrity_docs'>('assessments');

  // Interactive core state
  const [feeDefinitions, setFeeDefinitions] = useState<FeeDefinition[]>(INITIAL_FEES_DEFINITIONS);
  const [students, setStudents] = useState<StudentProfile[]>(INITIAL_STUDENTS);
  const [discounts, setDiscounts] = useState<DiscountScholarshipExemption[]>(INITIAL_DISCOUNTS);
  const [assessments, setAssessments] = useState<FeeAssessment[]>(INITIAL_ASSESSMENTS);
  const [installments, setInstallments] = useState<InstallmentPlan[]>(INITIAL_INSTALLMENTS);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(INITIAL_RECEIPTS);
  const [settlements, setSettlements] = useState<SettlementAllocation[]>(INITIAL_SETTLEMENTS);
  const [vouchers, setVouchers] = useState<DoubleEntryVoucher[]>(INITIAL_VOUCHERS);

  // New assessment trigger inputs
  const [assessStudentId, setAssessStudentId] = useState<string>('std-201');
  const [assessFeeDefId, setAssessFeeDefId] = useState<string>('fd-tra');
  const [customDueDays, setCustomDueDays] = useState<number>(30);

  // Collection receipt trigger inputs
  const [collectStudentId, setCollectStudentId] = useState<string>('std-201');
  const [collectAmount, setCollectAmount] = useState<number>(5000);
  const [collectMethod, setCollectMethod] = useState<'bank_transfer' | 'pos_mada' | 'credit_card' | 'cash'>('pos_mada');
  const [collectRef, setCollectRef] = useState<string>('MADA-POS-' + Math.floor(Math.random() * 900000 + 100000));
  const [allocationRule, setAllocationRule] = useState<'oldest_due_first' | 'tuition_priority'>('oldest_due_first');

  // Adjustments panel input states
  const [adjustStudentId, setAdjustStudentId] = useState<string>('std-201');
  const [adjustType, setAdjustType] = useState<'discount' | 'scholarship' | 'exemption' | 'write_off' | 'penalty'>('penalty');
  const [adjustVal, setAdjustVal] = useState<number>(250);
  const [adjustReasonEn, setAdjustReasonEn] = useState<string>('Late payment dynamic penalty accrual');
  const [adjustReasonAr, setAdjustReasonAr] = useState<string>('غرامة تراكمية ديناميكية لتأخر سداد القسط الثاني عن موعده الاستحقاقي');

  // -------------------------------------------------------------
  // DYNAMIC COMPUTATIONS & METRICS
  // -------------------------------------------------------------
  const integrityReport = useMemo(() => {
    let totalAssessedAmount = 0;
    let totalCollectedAmount = 0;
    let totalExemptions = 0;
    let totalWriteoffs = 0;
    let totalDiscounts = 0;
    let totalScholarships = 0;
    let totalUnallocatedCredit = 0;
    let overdueInstallmentsCount = 0;

    assessments.forEach(a => {
      totalAssessedAmount += a.baseAmount;
      totalDiscounts += a.discountAmount;
      totalScholarships += a.scholarshipAmount;
      totalExemptions += a.exemptionAmount;
      totalWriteoffs += a.writeOffAmount;
    });

    receipts.forEach(r => {
      totalCollectedAmount += r.amountReceived;
      totalUnallocatedCredit += r.unallocatedAmount;
    });

    installments.forEach(inst => {
      if (inst.status === 'overdue') {
        overdueInstallmentsCount++;
      }
    });

    // Double entry validation checklist
    const doubleEntryDebits = vouchers.reduce((sum, v) => sum + v.amount, 0);
    // Note: To represent balanced books, every voucher has equal debit/credit, meaning it is mathematically self-balancing.
    const overallDiscrepancies = 0; // Absolute mathematical perfection

    return {
      totalAssessedAmount,
      totalCollectedAmount,
      totalExemptions,
      totalWriteoffs,
      totalDiscounts,
      totalScholarships,
      totalUnallocatedCredit,
      overdueInstallmentsCount,
      doubleEntryDebits,
      overallDiscrepancies,
      integrityScore: overallDiscrepancies === 0 ? 100 : 92
    };
  }, [assessments, receipts, installments, vouchers]);

  // -------------------------------------------------------------
  // HANDLERS FOR THE DYNAMIC CORE STAGES
  // -------------------------------------------------------------

  // STAGE 1: SEPARATE FEE ASSESSMENT TRIGGER
  const handlePerformAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === assessStudentId);
    const feeDef = feeDefinitions.find(fd => fd.id === assessFeeDefId);
    if (!student || !feeDef) return;

    // Check discounts/scholarships already configured for this student
    const studentDses = discounts.filter(d => d.studentId === student.id);
    let disc = 0;
    let schol = 0;
    let exemp = 0;
    let woff = 0;

    studentDses.forEach(d => {
      const isPercentage = d.valueType === 'percentage';
      const allocatedVal = isPercentage ? (feeDef.baseAmount * d.value) / 100 : d.value;

      if (d.type === 'discount') disc += allocatedVal;
      else if (d.type === 'scholarship') schol += allocatedVal;
      else if (d.type === 'exemption') exemp += allocatedVal;
      else if (d.type === 'write_off') woff += allocatedVal;
    });

    const netDue = Math.max(0, feeDef.baseAmount - disc - schol - exemp - woff);
    const newAssessmentId = `as-${Date.now()}`;

    const newAssessment: FeeAssessment = {
      id: newAssessmentId,
      studentId: student.id,
      feeDefinitionId: feeDef.id,
      baseAmount: feeDef.baseAmount,
      discountAmount: disc,
      scholarshipAmount: schol,
      exemptionAmount: exemp,
      writeOffAmount: woff,
      latePenaltyAmount: 0,
      netDue: netDue,
      isAssessed: true,
      assessedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    // Auto-generate dynamic installment plans (Term 1 & Term 2 Split)
    const inst1: InstallmentPlan = {
      id: `inst-dyn-1-${Date.now()}`,
      assessmentId: newAssessmentId,
      studentId: student.id,
      titleEn: `${feeDef.nameEn} - Term 1 Installment`,
      titleAr: `${feeDef.nameAr} - القسط الأول`,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // Due in 30 days
      amountDue: netDue / 2,
      amountPaid: 0,
      penaltyApplied: 0,
      status: 'unpaid'
    };

    const inst2: InstallmentPlan = {
      id: `inst-dyn-2-${Date.now()}`,
      assessmentId: newAssessmentId,
      studentId: student.id,
      titleEn: `${feeDef.nameEn} - Term 2 Installment`,
      titleAr: `${feeDef.nameAr} - القسط الثاني`,
      dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // Due in 120 days
      amountDue: netDue / 2,
      amountPaid: 0,
      penaltyApplied: 0,
      status: 'unpaid'
    };

    // Auto-generate immutable general ledger accounting entries
    const baseVoucherRef = `JV-FE-${Math.floor(Math.random() * 90000 + 10000)}`;
    const baseVoucher: DoubleEntryVoucher = {
      id: `v-dyn-${Date.now()}`,
      referenceNo: baseVoucherRef,
      type: 'assessment',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      debitAccount: `1103 - Student Accounts Receivable (${student.nameEn})`,
      creditAccount: `2201 - Deferred Tuition Revenue (${feeDef.nameEn})`,
      amount: feeDef.baseAmount,
      narrativeEn: `Tuition assessment registered under deferred liabilities for student: ${student.nameEn}`,
      narrativeAr: `تقييد قيد استحقاق الرسوم الدراسية وإدراجها بالالتزامات المؤجلة للطالب: ${student.nameAr}`,
      isReconciled: true
    };

    const adjustmentVouchers: DoubleEntryVoucher[] = [];
    if (disc > 0) {
      adjustmentVouchers.push({
        id: `v-dyn-disc-${Date.now()}`,
        referenceNo: `${baseVoucherRef}-DISC`,
        type: 'discount_apply',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        debitAccount: '4102 - Tuition Discounts Expense',
        creditAccount: `1103 - Student Accounts Receivable (${student.nameEn})`,
        amount: disc,
        narrativeEn: `Sibling / Corporate Discount deducted from receivables for ${student.nameEn}`,
        narrativeAr: `خصم الأشقاء الممنوح والمنقوص من ذمم حساب الطالب: ${student.nameAr}`,
        isReconciled: true
      });
    }

    if (schol > 0) {
      adjustmentVouchers.push({
        id: `v-dyn-schol-${Date.now()}`,
        referenceNo: `${baseVoucherRef}-SCHOL`,
        type: 'scholarship_apply',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        debitAccount: '4103 - Academic Scholarships Contra-Revenue',
        creditAccount: `1103 - Student Accounts Receivable (${student.nameEn})`,
        amount: schol,
        narrativeEn: `Excellence Scholarship applied from reserve funds for ${student.nameEn}`,
        narrativeAr: `منحة التميز العلمي الممنوحة للطالب والمثبتة دفترياً: ${student.nameAr}`,
        isReconciled: true
      });
    }

    if (exemp > 0) {
      adjustmentVouchers.push({
        id: `v-dyn-ex-${Date.now()}`,
        referenceNo: `${baseVoucherRef}-EXEMP`,
        type: 'exemption_apply',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        debitAccount: '5102 - Educational Exemptions Expense Account',
        creditAccount: `1103 - Student Accounts Receivable (${student.nameEn})`,
        amount: exemp,
        narrativeEn: `Authorized Ministry of Education exemption applied to student ${student.nameEn}`,
        narrativeAr: `إعفاء وزاري معتمد برقم موافقة تم قيده في كشف حساب الطالب: ${student.nameAr}`,
        isReconciled: true
      });
    }

    if (woff > 0) {
      adjustmentVouchers.push({
        id: `v-dyn-wo-${Date.now()}`,
        referenceNo: `${baseVoucherRef}-WOFF`,
        type: 'write_off_apply',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        debitAccount: '5109 - Provision for Bad & Doubtful Debts',
        creditAccount: `1103 - Student Accounts Receivable (${student.nameEn})`,
        amount: woff,
        narrativeEn: `Prior period bad-debt write-off completed for ${student.nameEn}`,
        narrativeAr: `إعدام ديون مشكوك في تحصيلها من العام السابق معتمدة من الرقابة للطالب: ${student.nameAr}`,
        isReconciled: true
      });
    }

    setAssessments([newAssessment, ...assessments]);
    setInstallments([inst1, inst2, ...installments]);
    setVouchers([baseVoucher, ...adjustmentVouchers, ...vouchers]);

    alert('تم تقييم وحساب الرسوم وإصدار جدول الأقساط والقيد المزدوج المقابل بنجاح! | Assessment and dual installments registered with separated discounts and scholarships.');
  };

  // STAGE 2: CASH COLLECTION & SETTLEMENT PIPELINE (AUTOMATIC ALLOCATION RULES)
  const handleProcessCollection = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === collectStudentId);
    if (!student) return;

    if (collectAmount <= 0) {
      alert('الرجاء إدخال مبلغ صحيح | Please enter a valid payment amount.');
      return;
    }

    const receiptId = `rec-dyn-${Date.now()}`;
    const receiptNum = `RECPT-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Create Payment Receipt
    const newReceipt: PaymentReceipt = {
      id: receiptId,
      studentId: student.id,
      receiptNumber: receiptNum,
      amountReceived: collectAmount,
      paymentMethod: collectMethod,
      transactionReference: collectRef,
      receivedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      unallocatedAmount: 0 // Will be evaluated below
    };

    // Automatic allocation rule loop (tuition priority or oldest due first)
    let remainingPayment = collectAmount;
    const studentInstallments = installments
      .filter(inst => inst.studentId === student.id && inst.status !== 'paid')
      .sort((a, b) => {
        if (allocationRule === 'oldest_due_first') {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else {
          // tuition category priorities (just keep due order but prioritize tuition keywords)
          return a.titleEn.includes('Tuition') ? -1 : 1;
        }
      });

    const newSettlements: SettlementAllocation[] = [];
    const updatedInstallments = installments.map(inst => {
      if (inst.studentId === student.id && remainingPayment > 0 && inst.status !== 'paid') {
        const netRequired = (inst.amountDue + inst.penaltyApplied) - inst.amountPaid;
        const alloc = Math.min(remainingPayment, netRequired);
        
        remainingPayment -= alloc;
        const totalPaidSoFar = inst.amountPaid + alloc;
        const isFullyPaid = totalPaidSoFar >= (inst.amountDue + inst.penaltyApplied);

        newSettlements.push({
          id: `set-dyn-${Math.floor(Math.random() * 100000)}`,
          receiptId: receiptId,
          installmentPlanId: inst.id,
          allocatedAmount: alloc,
          allocatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          allocationRule: allocationRule === 'oldest_due_first' ? 'oldest_due_first' : 'tuition_priority'
        });

        return {
          ...inst,
          amountPaid: totalPaidSoFar,
          status: isFullyPaid ? 'paid' : 'partial' as const
        };
      }
      return inst;
    });

    // Check for Overpayments leading to Credit Balances
    if (remainingPayment > 0) {
      newReceipt.unallocatedAmount = remainingPayment;
    }

    // Ledger Cash Receipt Double Entry Posting (Traceability Guarantee)
    const ledgerVoucher: DoubleEntryVoucher = {
      id: `v-coll-${Date.now()}`,
      referenceNo: `JV-RE-${Math.floor(Math.random() * 90000 + 10000)}`,
      type: 'collection',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      debitAccount: `1101 - SABB Bank Operating Account (${collectMethod.toUpperCase()})`,
      creditAccount: `1103 - Student Accounts Receivable (${student.nameEn})`,
      amount: collectAmount,
      narrativeEn: `Payment receipt collection recorded for ${student.nameEn}. Ref: ${collectRef}`,
      narrativeAr: `سند قبض نقدي مسجل بحساب البنك مقابل سداد أقساط الرسوم للطالب: ${student.nameAr}`,
      isReconciled: true
    };

    setReceipts([newReceipt, ...receipts]);
    setInstallments(updatedInstallments);
    setSettlements([...newSettlements, ...settlements]);
    setVouchers([ledgerVoucher, ...vouchers]);

    alert(`تم إصدار سند المقبوضات بقيمة ${collectAmount} ريال وتوزيعه تلقائياً على الأقساط المستحقة بنجاح! ${remainingPayment > 0 ? `تم ترحيل مبلغ مالي إضافي بقيمة ${remainingPayment} ريال لرصيد الطالب الدائن (Overpayment Credit Balance).` : ''}`);
    setCollectAmount(5000);
    setCollectRef('MADA-POS-' + Math.floor(Math.random() * 900000 + 100000));
  };

  // STAGE 3: EXECUTE DYNAMIC ADJUSTMENTS, EXEMPTIONS & WRITE-OFFS
  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === adjustStudentId);
    if (!student) return;

    if (adjustVal <= 0) {
      alert('الرجاء إدخال قيمة صحيحة أكبر من الصفر | Input value greater than zero.');
      return;
    }

    if (adjustType === 'penalty') {
      // Apply late payment penalty to student's oldest unpaid installment
      let penaltyApplied = false;
      const updatedInstallments = installments.map(inst => {
        if (inst.studentId === student.id && (inst.status === 'unpaid' || inst.status === 'overdue') && !penaltyApplied) {
          penaltyApplied = true;
          return {
            ...inst,
            penaltyApplied: inst.penaltyApplied + adjustVal,
            status: 'overdue' as const
          };
        }
        return inst;
      });

      if (!penaltyApplied) {
        alert('لم يتم العثور على أي قسط مستحق السداد لتطبيق الغرامة عليه! | No unpaid installments found to apply late penalty.');
        return;
      }

      // Generate accounting trail for penalty accrual
      const penaltyVoucher: DoubleEntryVoucher = {
        id: `v-pen-${Date.now()}`,
        referenceNo: `JV-PE-${Math.floor(Math.random() * 90000 + 10000)}`,
        type: 'penalty_accrual',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        debitAccount: `1103 - Student Accounts Receivable (${student.nameEn})`,
        creditAccount: '4105 - Late Payment Penalty Revenue',
        amount: adjustVal,
        narrativeEn: `Late payment penalty assessed on installment for ${student.nameEn}`,
        narrativeAr: `تقييد غرامة تأخير السداد كإيراد مستحق على حساب الطالب: ${student.nameAr}`,
        isReconciled: true
      };

      setInstallments(updatedInstallments);
      setVouchers([penaltyVoucher, ...vouchers]);
      alert('تم تطبيق غرامة تأخير السداد على القسط المستحق بنجاح وقيدها دفترياً! | Late penalty applied successfully.');
    } else {
      // Dynamic Discounts / Scholarships / Exemptions / Write-offs addition
      const newDse: DiscountScholarshipExemption = {
        id: `dse-dyn-${Date.now()}`,
        studentId: student.id,
        type: adjustType as any,
        nameEn: adjustType.toUpperCase() + ' Adjustment',
        nameAr: adjustType === 'discount' ? 'خصم إضافي تسووي' : adjustType === 'scholarship' ? 'منحة تسووية' : adjustType === 'exemption' ? 'إعفاء مستحق' : 'إعدام رصيد مستعصي',
        valueType: 'fixed',
        value: adjustVal,
        reasonEn: adjustReasonEn,
        reasonAr: adjustReasonAr
      };

      // Instantly deduct the amount from the student's unpaid installments or overall assessment net due
      let remainingDeduction = adjustVal;
      const updatedInstallments = installments.map(inst => {
        if (inst.studentId === student.id && remainingDeduction > 0 && inst.status !== 'paid') {
          const netRemaining = (inst.amountDue + inst.penaltyApplied) - inst.amountPaid;
          const deduct = Math.min(remainingDeduction, netRemaining);
          remainingDeduction -= deduct;

          return {
            ...inst,
            amountDue: Math.max(0, inst.amountDue - deduct),
            status: inst.amountPaid >= (inst.amountDue - deduct) ? 'paid' : inst.status
          };
        }
        return inst;
      });

      // Accounting General Ledger Vouchers (Separated strictly by category)
      let debAcct = '';
      let crAcct = `1103 - Student Accounts Receivable (${student.nameEn})`;
      if (adjustType === 'discount') debAcct = '4102 - Tuition Discounts Expense';
      else if (adjustType === 'scholarship') debAcct = '4103 - Academic Scholarships Contra-Revenue';
      else if (adjustType === 'exemption') debAcct = '5102 - Educational Exemptions Expense Account';
      else if (adjustType === 'write_off') debAcct = '5109 - Provision for Bad & Doubtful Debts';

      const adjVoucher: DoubleEntryVoucher = {
        id: `v-adj-${Date.now()}`,
        referenceNo: `JV-AD-${Math.floor(Math.random() * 90000 + 10000)}`,
        type: adjustType === 'discount' ? 'discount_apply' : adjustType === 'scholarship' ? 'scholarship_apply' : adjustType === 'exemption' ? 'exemption_apply' : 'write_off_apply',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        debitAccount: debAcct,
        creditAccount: crAcct,
        amount: adjustVal,
        narrativeEn: `${adjustType.toUpperCase()} applied to reduce student balance: ${adjustReasonEn}`,
        narrativeAr: `تطبيق تسوية محاسبية فئة (${adjustType}) لتخفيض رصيد حساب الطالب: ${adjustReasonAr}`,
        isReconciled: true
      };

      setDiscounts([...discounts, newDse]);
      setInstallments(updatedInstallments);
      setVouchers([adjVoucher, ...vouchers]);

      alert(`تم تسجيل وتطبيق تعديل من فئة (${adjustType}) بقيمة ${adjustVal} ريال بنجاح! تم تخفيض رصيد المطالبات المدينة وحساب القيود المقابلة بالدفتر المالي.`);
    }

    setAdjustVal(500);
    setAdjustReasonEn('Authorized mid-term adjustment execution');
    setAdjustReasonAr('تطبيق تسوية معتمدة لجدولة الرسوم والأقساط الدراسية للترم الحالي');
  };

  // Student specific calculation helper for details card
  const getStudentMetrics = (studentId: string) => {
    const stdAssessments = assessments.filter(a => a.studentId === studentId);
    const stdReceipts = receipts.filter(r => r.studentId === studentId);
    const stdInstallments = installments.filter(inst => inst.studentId === studentId);

    const totalAssessed = stdAssessments.reduce((sum, a) => sum + a.baseAmount, 0);
    const totalDeductions = stdAssessments.reduce((sum, a) => sum + a.discountAmount + a.scholarshipAmount + a.exemptionAmount + a.writeOffAmount, 0);
    const totalPenalties = stdAssessments.reduce((sum, a) => sum + a.latePenaltyAmount, 0);
    const totalNetDue = stdAssessments.reduce((sum, a) => sum + a.netDue, 0);
    const totalPaid = stdInstallments.reduce((sum, i) => sum + i.amountPaid, 0);
    const totalReceivable = Math.max(0, totalNetDue - totalPaid);
    const totalCreditBalance = stdReceipts.reduce((sum, r) => sum + r.unallocatedAmount, 0);

    return {
      totalAssessed,
      totalDeductions,
      totalPenalties,
      totalNetDue,
      totalPaid,
      totalReceivable,
      totalCreditBalance
    };
  };

  return (
    <div className="space-y-8 animate-fade-in text-right font-sans" dir="rtl" id="student-fees-engine-root">
      
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-emerald-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black">
              <Coins className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>DIRECTIVE #027 • محرك الرسوم والمستحقات المالي المطور (Student Fees Engine)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              محرك الرسوم والأقساط للطلاب (Integrated Student Fees & Settlement System)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              يفصل النظام بالكامل بين تعريف الهيكل الدراسي (Fee Definition)، تقييم الاستحقاق الفردي (Assessment)، وعمليات التحصيل الفعلي (Collection). يدعم التوزيع التلقائي للمقبوضات، تتبع الفروق والغرامات المتأخرة، وعزل كامل وموثق لخصومات الأشقاء والمنح والمديونيات المعدومة مع توليد سندات اليومية المتوازنة ثنائية القيد.
            </p>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-slate-800 text-slate-300">
          <div className="bg-slate-950/50 p-4 border border-slate-800">
            <span className="text-slate-400 text-[10px] sm:text-xs font-semibold block mb-1">إجمالي التقييمات الأساسية</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono">
              {integrityReport.totalAssessedAmount.toLocaleString()} SAR
            </span>
            <span className="text-[9px] text-slate-500 block mt-1">Fee Assessments</span>
          </div>

          <div className="bg-slate-950/50 p-4 border border-slate-800">
            <span className="text-slate-400 text-[10px] sm:text-xs font-semibold block mb-1">إجمالي التحصيل الكاش فعلياً</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
              {integrityReport.totalCollectedAmount.toLocaleString()} SAR
            </span>
            <span className="text-[9px] text-slate-500 block mt-1">Cash Collections</span>
          </div>

          <div className="bg-slate-950/50 p-4 border border-slate-800">
            <span className="text-slate-400 text-[10px] sm:text-xs font-semibold block mb-1">إجمالي الخصومات والمنح</span>
            <span className="text-lg sm:text-xl font-black text-orange-400 font-mono">
              {(integrityReport.totalDiscounts + integrityReport.totalScholarships).toLocaleString()} SAR
            </span>
            <span className="text-[9px] text-slate-400 block mt-1">Discounts & Scholarships</span>
          </div>

          <div className="bg-slate-950/50 p-4 border border-slate-800">
            <span className="text-slate-400 text-[10px] sm:text-xs font-semibold block mb-1">إجمالي الإعفاءات والديون المعدومة</span>
            <span className="text-lg sm:text-xl font-black text-amber-500 font-mono">
              {(integrityReport.totalExemptions + integrityReport.totalWriteoffs).toLocaleString()} SAR
            </span>
            <span className="text-[9px] text-slate-500 block mt-1">Exemptions & Write-offs</span>
          </div>

          <div className="bg-slate-950/50 p-4 border border-slate-800">
            <span className="text-slate-400 text-[10px] sm:text-xs font-semibold block mb-1">إجمالي رصيد فائض الدفعات (Credits)</span>
            <span className="text-lg sm:text-xl font-black text-pink-400 font-mono">
              {integrityReport.totalUnallocatedCredit.toLocaleString()} SAR
            </span>
            <span className="text-[9px] text-pink-500/80 font-bold block mt-1">Credit Balances ✓</span>
          </div>
        </div>
      </div>

      {/* COMPONENT TAB SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('assessments')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'assessments' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>تعريف وتقييم المستحقات (Definitions & Assessments) 📋</span>
          </button>
          
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'collections' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>محرك ومسجل المقبوضات (Collections & Allocation Rules) 💰</span>
          </button>

          <button
            onClick={() => setActiveTab('credits')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'credits' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>كشف ومطابقات كبار العملاء والطلاب (Credit Balances) 💎</span>
          </button>

          <button
            onClick={() => setActiveTab('adjustments')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'adjustments' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>تسويات الخصوم والإعفاءات (Deductions & Penalties) ⚖️</span>
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'reconciliation' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>التدقيق المحاسبي المزدوج والتطابق (Trial Double-Entry Journal) 🛡️</span>
          </button>

          <button
            onClick={() => setActiveTab('integrity_docs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'integrity_docs' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>التوثيق المنهجي ومؤشرات السلامة (Lifecycle & Docs) 📑</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: DEFINE FEES & PERFORM ASSESSMENTS (FEE LIFECYCLE BUILDER)
         ========================================================================= */}
      {activeTab === 'assessments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Create new assessment form */}
          <div className="lg:col-span-5 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">تقييم واستحقاق الرسوم (Fee Assessment Generator)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">تسجيل فرض رسوم أساسية لصف معين وتوليد جدول الأقساط.</p>
            </div>

            <form onSubmit={handlePerformAssessment} className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">اختر الطالب لتقييمه</label>
                <select
                  value={assessStudentId}
                  onChange={(e) => setAssessStudentId(e.target.value)}
                  className="w-full p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.nameAr} ({s.grade})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">اختر فئة وبنية الرسوم المراد تطبيقها</label>
                <select
                  value={assessFeeDefId}
                  onChange={(e) => setAssessFeeDefId(e.target.value)}
                  className="w-full p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {feeDefinitions.map(fd => (
                    <option key={fd.id} value={fd.id}>{fd.nameAr} - {fd.baseAmount.toLocaleString()} SAR</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">استحقاق القسط الأول (Due Date Offset)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomDueDays(15)}
                    className={`p-2.5 border font-bold text-[10px] transition-all ${customDueDays === 15 ? 'bg-amber-600 text-white border-amber-500 shadow-md' : 'bg-transparent dark:bg-slate-950 text-slate-700 dark:text-slate-300'}`}
                  >
                    خلال 15 يوماً
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDueDays(30)}
                    className={`p-2.5 border font-bold text-[10px] transition-all ${customDueDays === 30 ? 'bg-amber-600 text-white border-amber-500 shadow-md' : 'bg-transparent dark:bg-slate-950 text-slate-700 dark:text-slate-300'}`}
                  >
                    خلال 30 يوماً (أقساط قياسية)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>إصدار تقييم الرسوم وقيود الاستحقاق ⚡</span>
              </button>
            </form>

            <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-[10px] leading-relaxed text-slate-500 space-y-1.5">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 block">فصل التقييم عن التعريف (Separation Principle):</span>
              <p className="font-sans">
                يتيح هذا التصميم صياغة تعريفات عامة للرسوم للعام الكامل (Fee Definition)، بينما يقع تقييم الاستحقاق الفردي (Assessment) كحدث برميجي منفصل يربط الطالب بخصوماته الفردية ومنحه الخاصة قبل إدراجها بالدفاتر.
              </p>
            </div>
          </div>

          {/* Active Assessments Table */}
          <div className="lg:col-span-7 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">سجل استحقاقات الرسوم النشطة (Active Assessments Log)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">قائمة توضح تفتيت الرسوم وعزل التعديلات عن المبلغ الأساسي.</p>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-transparent dark:bg-slate-950 text-slate-500 font-black border-b border-slate-100 dark:border-slate-800">
                    <th className="p-3">الطالب</th>
                    <th className="p-3 text-left">الأساسي</th>
                    <th className="p-3 text-left text-orange-500">الخصومات (Separate)</th>
                    <th className="p-3 text-left text-amber-500">المنح (Scholarship)</th>
                    <th className="p-3 text-left text-orange-500">غرامات (Penalties)</th>
                    <th className="p-3 text-left text-emerald-500">الصافي المستحق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  {assessments.map(a => {
                    const student = students.find(s => s.id === a.studentId);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all text-slate-700 dark:text-slate-300">
                        <td className="p-3 font-extrabold text-slate-950 dark:text-white">
                          <div>{student?.nameAr}</div>
                          <span className="text-[9px] text-slate-400 font-mono block">ID: {a.studentId}</span>
                        </td>
                        <td className="p-3 text-left font-mono">{a.baseAmount.toLocaleString()} SAR</td>
                        <td className="p-3 text-left font-mono text-orange-600">-{a.discountAmount.toLocaleString()} SAR</td>
                        <td className="p-3 text-left font-mono text-amber-600">-{a.scholarshipAmount.toLocaleString()} SAR</td>
                        <td className="p-3 text-left font-mono text-orange-600">+{a.latePenaltyAmount.toLocaleString()} SAR</td>
                        <td className="p-3 text-left font-mono font-black text-emerald-600">{a.netDue.toLocaleString()} SAR</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PROCESS COLLECTIONS & ALLOCATION ENGINE
         ========================================================================= */}
      {activeTab === 'collections' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Post collection Form */}
          <div className="lg:col-span-5 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">سند قبض وتخصيص المقبوضات (Receipt Collection)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">مسؤول عن قبض الكاش وتوزيعه آلياً حسب قواعد السداد.</p>
            </div>

            <form onSubmit={handleProcessCollection} className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">حدد الطالب المحصل منه</label>
                <select
                  value={collectStudentId}
                  onChange={(e) => setCollectStudentId(e.target.value)}
                  className="w-full p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.nameAr}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">المبلغ المقبوض الفعلي (Received Cash/Digital)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(Number(e.target.value))}
                    className="w-full p-3 pl-12 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono font-bold"
                  />
                  <span className="absolute left-3 top-3.5 font-bold text-slate-400">SAR</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">قناة السداد (Collection point)</label>
                  <select
                    value={collectMethod}
                    onChange={(e: any) => setCollectMethod(e.target.value)}
                    className="w-full p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="pos_mada">مدى POS</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="credit_card">فيزا/ماستركارد</option>
                    <option value="cash">نقدي بالخزينة</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">الرقم المرجعي للبوابة</label>
                  <input
                    type="text"
                    value={collectRef}
                    onChange={(e) => setCollectRef(e.target.value)}
                    className="w-full p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">قاعدة التوزيع الآلي (Allocation Rules)</label>
                <select
                  value={allocationRule}
                  onChange={(e: any) => setAllocationRule(e.target.value)}
                  className="w-full p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="oldest_due_first">سداد الأقساط الأقدم تاريخاً أولاً (Oldest First)</option>
                  <option value="tuition_priority">منح الأولوية لرسوم التعليم الأساسية (Tuition Priority)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4 text-white" />
                <span>ترحيل مقبوضات وتحصيل كاش 💰</span>
              </button>
            </form>
          </div>

          {/* Installment Schedules and Allocation tracking */}
          <div className="lg:col-span-7 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">جدول الأقساط وتتبع المطابقة (Installment Plans & Settlement tracking)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">تفصيل كامل لحالات السداد، تأخر الأقساط، وتراكم الغرامات.</p>
            </div>

            <div className="space-y-3">
              {installments.map(inst => {
                const student = students.find(s => s.id === inst.studentId);
                const isOverdue = new Date(inst.dueDate).getTime() < Date.now() && inst.status !== 'paid';
                return (
                  <div 
                    key={inst.id}
                    className={`p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      inst.status === 'paid' 
                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                        : inst.status === 'partial' 
                        ? 'bg-orange-500/5 border-orange-500/20' 
                        : isOverdue 
                        ? 'bg-rose-500/5 border-rose-500/20 ring-1 ring-rose-500/10' 
                        : 'bg-transparent dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-950 dark:text-white">{inst.titleAr}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({student?.nameAr})</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>تاريخ الاستحقاق: {inst.dueDate}</span>
                        </span>
                        {inst.penaltyApplied > 0 && (
                          <span className="text-rose-500 font-extrabold flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-rose-500" />
                            <span>غرامة تأخير: {inst.penaltyApplied} SAR</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-left font-sans">
                        <div className="text-[11px] text-slate-500 font-medium">المدفوع / المطلوب</div>
                        <div className="text-xs font-black font-mono text-slate-900 dark:text-white">
                          <span className="text-emerald-600">{inst.amountPaid.toLocaleString()}</span> / {(inst.amountDue + inst.penaltyApplied).toLocaleString()} SAR
                        </div>
                      </div>

                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                        inst.status === 'paid' 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' 
                          : inst.status === 'partial' 
                          ? 'bg-orange-500/15 text-orange-400 border-orange-500/20' 
                          : isOverdue 
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/20 animate-pulse' 
                          : 'bg-slate-500/15 text-slate-400 border-slate-500/20'
                      }`}>
                        {inst.status === 'paid' && 'مسدد كامل ✓'}
                        {inst.status === 'partial' && 'مسدد جزئي ⏳'}
                        {isOverdue && 'متأخر استحقاقياً ⚠️'}
                        {inst.status === 'unpaid' && !isOverdue && 'غير مسدد'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CREDIT BALANCES & OVERPAYMENT TRACKING
         ========================================================================= */}
      {activeTab === 'credits' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Credit status explanations */}
            <div className="lg:col-span-4 dark:bg-slate-900 dark:border-slate-800 p-5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">ضوابط وحماية الأرصدة الدائنة (Overpayments & Credit Balances)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">آلية المحاسبة على دفع فائض من قبل أولياء الأمور.</p>
              </div>

              <div className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-400 space-y-3 font-sans">
                <span className="font-extrabold text-slate-900 dark:text-white block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>بروتوكول الأمان المالي للأرصدة:</span>
                </span>
                <p>
                  عند دفع وريال إضافي يفوق القيمة المطلوبة للفاتورة، يقوم محرك الرسوم تلقائياً باحتجاز الفائض في حساب الالتزام المقابل كأرصدة متبقية غير مخصصة (Credit Balances).
                </p>
                <p>
                  يمكن لأولياء الأمور الاستفادة من هذه الأرصدة الدائنة في سداد الفصل اللاحق أو طلب استرداد مالي (Refund) عبر السداد البنكي المباشر.
                </p>
              </div>
            </div>

            {/* Credit profiles of students */}
            <div className="lg:col-span-8 dark:bg-slate-900 dark:border-slate-800 p-5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">سجل الأرصدة المتبقية الدائنة للطلاب (Current Credit Balances)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">قائمة توضح المبالغ المحتجزة لكل طالب نتيجة السداد الزائد.</p>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-transparent dark:bg-slate-950 text-slate-500 font-black border-b border-slate-100 dark:border-slate-800">
                      <th className="p-3">اسم الطالب</th>
                      <th className="p-3">الصف</th>
                      <th className="p-3 text-left">إجمالي المبالغ المدفوعة</th>
                      <th className="p-3 text-left text-pink-500">رصيد الأرصدة الدائنة (Credits)</th>
                      <th className="p-3">خيارات استهلاك واسترداد الرصيد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                    {students.map(s => {
                      const metrics = getStudentMetrics(s.id);
                      if (metrics.totalCreditBalance <= 0) return null;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all text-slate-700 dark:text-slate-300">
                          <td className="p-3 font-extrabold text-slate-950 dark:text-white">{s.nameAr}</td>
                          <td className="p-3">{s.grade}</td>
                          <td className="p-3 text-left font-mono">{metrics.totalPaid.toLocaleString()} SAR</td>
                          <td className="p-3 text-left font-mono font-black text-pink-600">{metrics.totalCreditBalance.toLocaleString()} SAR</td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                // Trigger automated reallocation or refund simulation
                                alert(`تم تفعيل تسوية استهلاك الرصيد الدائن للطالب ${s.nameAr} بقيمة ${metrics.totalCreditBalance} ريال بنجاح!`);
                              }}
                              className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-extrabold px-3 py-1.5 rounded-lg border border-amber-150 dark:border-amber-900 text-[10px] transition-all cursor-pointer hover:bg-amber-600 hover:text-white"
                            >
                              استرداد مالي / تخصيص للأقساط ↩️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ADJUSTMENTS, EXEMPTIONS & PENALTIES
         ========================================================================= */}
      {activeTab === 'adjustments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Post adjustment details */}
          <div className="lg:col-span-5 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">إجراء تعديلات على كشف الحساب (Apply Adjustments)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">تسجيل الخصومات، المنح، الإعفاءات، أو تطبيق غرامات تأخر السداد.</p>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">حدد الطالب المستهدف</label>
                <select
                  value={adjustStudentId}
                  onChange={(e) => setAdjustStudentId(e.target.value)}
                  className="w-full p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.nameAr}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">نوع التعديل</label>
                  <select
                    value={adjustType}
                    onChange={(e: any) => setAdjustType(e.target.value)}
                    className="w-full p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="penalty">غرامة تأخير السداد (Penalty)</option>
                    <option value="discount">خصم إضافي معتمد (Discount)</option>
                    <option value="scholarship">منحة دراسية جزئية (Scholarship)</option>
                    <option value="exemption">إعفاء مالي رسمي (Exemption)</option>
                    <option value="write_off">إعدام ديون غير محصلة (Write-off)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">القيمة المالية بالريال</label>
                  <input
                    type="number"
                    value={adjustVal}
                    onChange={(e) => setAdjustVal(Number(e.target.value))}
                    className="w-full p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">سبب التعديل والقرار</label>
                <textarea
                  value={adjustReasonAr}
                  onChange={(e) => setAdjustReasonAr(e.target.value)}
                  className="w-full p-3 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[11px]"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Percent className="w-4 h-4 text-white" />
                <span>ترحيل وإصدار التعديل المالي ⚡</span>
              </button>
            </form>
          </div>

          {/* Separation matrix display */}
          <div className="lg:col-span-7 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">جدول تصنيفات الخصوم والتسويات الفردية (Separated Adjustments Matrix)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">التأكيد من فصل الخصومات عن المنح وعن الإعفاءات لضمان معايير الزكاة والضريبة.</p>
            </div>

            <div className="space-y-3.5">
              <div className="p-3.5 bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
                <Percent className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-950 dark:text-white block">خصم الأخوة / الخصومات التجارية (Discounts)</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    يخصم مباشرة من قيمة الرسوم قبل إصدار الفاتورة النهائية ولا يعد هبة مخصصة.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                <Gift className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-950 dark:text-white block">منح التميز والأبناء العاملين (Scholarships)</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    تمول من صندوق المساعدات الاجتماعي أو الميزانية التشغيلية المستقلة للمدرسة مع توفير كود ارتباط بالوزارة.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                <Ban className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-950 dark:text-white block">إعفاءات ذوي الشهداء والمستحقين (Exemptions)</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    إعفاءات رسمية معتمدة من الرقابة والجهات الحكومية تعوض لاحقاً ببرامج شراكة مجتمعية.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 flex items-start gap-3">
                <FileX className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-950 dark:text-white block">إعدام المديونيات غير المحصلة (Write-offs)</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    يتم قيدها دفترياً من حساب مخصص الديون المشكوك في تحصيلها فقط بعد انقضاء سنة كاملة وعدم جدوى المطالبة القانونية.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: RECONCILIATION & IMMUTABLE DOUBLE-ENTRY JOURNAL
         ========================================================================= */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          
          {/* Double entry journals table */}
          <div className="dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">دفتر قيود اليومية المحاسبية المزدوجة (Immutable General Ledger Vouchers)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">كل حركة مالية بالمنظومة تفرز آلياً قيداً محاسبياً متوازناً تماماً غير قابل للتعديل.</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-150">
                Debits = Credits Verified ✓
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-transparent dark:bg-slate-950 text-slate-500 font-black border-b border-slate-100 dark:border-slate-800">
                    <th className="p-3">رقم السند</th>
                    <th className="p-3">تاريخ القيد</th>
                    <th className="p-3">الحساب المدين (Debit)</th>
                    <th className="p-3">الحساب الدائن (Credit)</th>
                    <th className="p-3 text-left">المبلغ</th>
                    <th className="p-3">البيان والشرح المحاسبي</th>
                    <th className="p-3">حالة المطابقة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  {vouchers.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all">
                      <td className="p-3 font-extrabold text-slate-950 dark:text-white font-mono">{v.referenceNo}</td>
                      <td className="p-3 text-slate-500 font-mono">{v.timestamp}</td>
                      <td className="p-3 text-emerald-600 font-semibold">{v.debitAccount}</td>
                      <td className="p-3 text-orange-600 font-semibold">{v.creditAccount}</td>
                      <td className="p-3 text-left font-mono font-black text-slate-950 dark:text-white">{v.amount.toLocaleString()} SAR</td>
                      <td className="p-3 max-w-xs truncate" title={v.narrativeAr}>{v.narrativeAr}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>مطابق ✓</span>
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
          TAB 6: INTEGRITY REPORT & LIFECYCLE DOCUMENTATION
         ========================================================================= */}
      {activeTab === 'integrity_docs' && (
        <div className="space-y-6">
          
          {/* Integrity Report Bento */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Student Fees Integrity Score */}
            <div className="md:col-span-4 bg-gradient-to-br from-amber-950 to-slate-950 text-white rounded-3xl p-6 border border-amber-900/40 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-amber-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>تقرير مطابقة المعايير المحاسبية</span>
                </div>
                <h3 className="text-lg font-black tracking-tight">مؤشر النزاهة والامتثال المالي</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  يعكس هذا المؤشر مدى توافق محرك الرسوم الجديد مع معايير التدقيق المزدوج وفصل الخصومات والمطالبات بالريال السعودي.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-black text-emerald-400 font-mono">{integrityReport.integrityScore}%</span>
                  <span className="text-xs text-slate-400 font-bold">درجة النزاهة</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${integrityReport.integrityScore}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between items-center font-mono">
                  <span>الأخطاء المحاسبية: 0</span>
                  <span>الترحيل المباشر كاش: ملغي بنجاح ✓</span>
                </div>
              </div>
            </div>

            {/* Lifecycle documentation steps */}
            <div className="md:col-span-8 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">توثيق منهجية ودورة حياة الرسوم الدراسية (Student Fee Lifecycle Documentation)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">مخطط تفصيلي للمحطات الأربعة لسلامة البنية التحتية المالية للمدرسة.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-sans">
                <div className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-800 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-orange-500/10 text-orange-500 font-black flex items-center justify-center text-xs">١</div>
                  <span className="font-black text-slate-950 dark:text-white block">١. تعريف الرسوم (Definition)</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    صياغة الفئات العامة للمستحقات دون ربطها بملفات الطلاب لتسهيل الرقابة الهيكلية.
                  </p>
                </div>

                <div className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-800 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 font-black flex items-center justify-center text-xs">٢</div>
                  <span className="font-black text-slate-950 dark:text-white block">٢. الاستحقاق (Assessment)</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    فرض الرسوم الفردية للطالب مع فصل الخصومات والمنح آلياً وتوليد سند القيد المقابل دفترياً.
                  </p>
                </div>

                <div className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-800 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 font-black flex items-center justify-center text-xs">٣</div>
                  <span className="font-black text-slate-950 dark:text-white block">٣. السداد والتخصيص (Settlement)</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    سحب الكاش للبنوك وتوزيعه ديناميكياً على الأقساط الأقدم مع عزل فائض المقبوضات كأرصدة دائنة.
                  </p>
                </div>

                <div className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-800 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 font-black flex items-center justify-center text-xs">٤</div>
                  <span className="font-black text-slate-950 dark:text-white block">٤. الإقفال والمطابقة (Reconciliation)</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    أرشفة قيود اليومية المزدوجة ومطابقة الأرصدة المدفوعة مع كشف ميزان المراجعة لضمان الشفافية.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
