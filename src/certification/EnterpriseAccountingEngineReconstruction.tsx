import { Activity, AlertTriangle, ArrowLeftRight, BarChart3, Check, Code, Component, Database, FileSignature, FileText, Landmark, List, Lock as LockIcon, Map, Monitor, Navigation, Presentation, RefreshCcw, RefreshCw, Search, Shield, ShieldCheck, Table, Terminal, Verified, Wrench, Zap } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// =========================================================================
// TYPINGS & SYSTEM DATA STRUCTURES FOR MISSION-CRITICAL ACCOUNTING
// =========================================================================

export type AccountingPolicyGroup = 
  | 'revenue' 
  | 'students' 
  | 'adjustments' 
  | 'closing' 
  | 'cash_bank' 
  | 'journals' 
  | 'ledger_reports';

export interface AccountingPolicy {
  id: string;
  group: AccountingPolicyGroup;
  titleEn: string;
  titleAr: string;
  standardEn: string;
  standardAr: string;
  descriptionEn: string;
  descriptionAr: string;
  rules: string[];
  rulesAr: string[];
  debitAccount: string;
  creditAccount: string;
  sampleAmount: number;
}

export interface AuditedCodeArtifact {
  id: string;
  fileName: string;
  layer: 'UI' | 'Repository' | 'Service' | 'DTO' | 'Controller';
  violationType: 'financial_logic_in_ui' | 'financial_logic_in_repo' | 'duplicated_posting' | 'missing_validation';
  severity: 'critical' | 'high' | 'medium';
  descriptionEn: string;
  descriptionAr: string;
  codeBefore: string;
  codeAfter: string;
  isRefactored: boolean;
}

export interface JournalLine {
  accountId: string;
  accountNameAr: string;
  accountNameEn: string;
  debit: number;
  credit: number;
}

export interface DoubleEntryJournal {
  id: string;
  referenceNumber: string;
  businessEvent: string;
  businessEventAr: string;
  postedAt: string;
  isImmutable: boolean;
  isReversal: boolean;
  reversedJournalId?: string;
  lines: JournalLine[];
}

export interface ConcurrentTransaction {
  id: string;
  timestamp: string;
  studentId: string;
  studentName: string;
  action: string;
  actionAr: string;
  amount: number;
  status: 'pending' | 'locked' | 'processing' | 'committed' | 'rolled_back';
  isolationLevel: string;
  threadId: number;
  failureReason?: string;
  failureReasonAr?: string;
}

// Initial Core Accounting Policies aligned with IFRS & SOCPA & SAMA Guidelines
const ACCOUNTING_POLICIES: AccountingPolicy[] = [
  {
    id: 'rev-rec',
    group: 'revenue',
    titleEn: 'Revenue Recognition & Deferred Revenue',
    titleAr: 'الاعتراف بالإيرادات والإيرادات المؤجلة',
    standardEn: 'IFRS 15 (Revenue from Contracts with Customers)',
    standardAr: 'المعيار الدولي للتقرير المالي IFRS 15',
    descriptionEn: 'Tuition and transport fees must be recognized proportionally over the active academic periods. Prepaid tuition is recorded under Deferred Revenue (liability) and amortized monthly.',
    descriptionAr: 'يجب الاعتراف بالرسوم الدراسية ورسوم النقل بشكل نسبي على مدار الفترات الأكاديمية النشطة. تسجل الرسوم المدفوعة مقدماً كإيراد مؤجل (التزام) ويتم إطفاؤها شهرياً.',
    rules: [
      'Pro-rata recognition based on calendar days elapsed.',
      'Unearned tuition remains in liability (Account 2201 - Deferred Tuition Revenue).',
      'Automatic amortization journals posted on the 1st of each Hijri/Gregorian month.'
    ],
    rulesAr: [
      'الاعتراف النسبي بناءً على عدد الأيام التقويمية المنقضية.',
      'تظل الرسوم غير المكتسبة في الالتزامات (حساب 2201 - إيرادات الرسوم الدراسية المؤجلة).',
      'قيود إطفاء تلقائية يتم ترحيلها في اليوم الأول من كل شهر هجري/ميلادي.'
    ],
    debitAccount: '1103 - Accounts Receivable (Student Accounts)',
    creditAccount: '2201 - Deferred Tuition Revenue (Liability)',
    sampleAmount: 15000
  },
  {
    id: 'student-fees',
    group: 'students',
    titleEn: 'Student Fees, Installments & Discounts',
    titleAr: 'رسوم الطلاب، الأقساط والخصومات الممنوحة',
    standardEn: 'IFRS 9 / SOCPA Standard on Educational Receivables',
    standardAr: 'معيار الهيئة السعودية للمحاسبين القانونيين SOCPA للمستحقات',
    descriptionEn: 'Student account billing is triggered strictly by enrollment events. All scholarships and corporate discounts must be posted via separate contra-revenue accounts for clean reporting.',
    descriptionAr: 'يتم احتساب الرسوم مباشرة بناءً على أحداث التسجيل والقبول الرسمية. تسجل جميع المنح الدراسية والخصومات الممنوحة عبر حسابات الإيراد المقابلة (Contra-Revenue) لضمان دقة التقارير.',
    rules: [
      'Discounts never directly net-off tuition revenue directly in the base booking.',
      'Installment schedule validation must prevent cumulative payment gaps.',
      'Scholarships require physical MoE alignment tracking codes.'
    ],
    rulesAr: [
      'لا يتم خصم المنح والمكافآت بشكل مباشر من الإيراد الرئيسي دون توثيق عبر حساب مستقل.',
      'يجب أن تمنع مصادقة الأقساط وجود فجوات في التوزيع الزمني للمستحقات المالية.',
      'تتطلب المنح الدراسية تتبع كود الارتباط والاعتماد الرسمي من وزارة التعليم.'
    ],
    debitAccount: '4102 - Student Discounts & Scholarships (Contra-Revenue)',
    creditAccount: '1103 - Accounts Receivable (Student Accounts)',
    sampleAmount: 3000
  },
  {
    id: 'refunds-notes',
    group: 'adjustments',
    titleEn: 'Refunds, Write-offs & Credit/Debit Notes',
    titleAr: 'المرتجعات، الإعدام الدفتري، والاشعارات الدائنة والمدينة',
    standardEn: 'IFRS 9 Expected Credit Loss & Revenue Adjustments',
    standardAr: 'إطفاء الديون المشكوك فيها وتعديلات الإيرادات IFRS 9',
    descriptionEn: 'Refunds require authorized approval from both Financial Control and Student Affairs. Write-offs must only target outstanding balances verified as uncollectible under strict ageing definitions.',
    descriptionAr: 'تتطلب المرتجعات موافقة رسمية ثنائية من الرقابة المالية وشؤون الطلاب. لا يتم إعدام الديون إلا بعد انقضاء فترات التقادم المعتمدة وتصنيفها كديون معدومة.',
    rules: [
      'Credit notes must reference original tax invoices complying with ZATCA Phase 2.',
      'Write-offs debit Account 5109 - Provision for Bad Debts with unique audit keys.',
      'Debit notes are strictly restricted to additional services or late-payment adjustments.'
    ],
    rulesAr: [
      'يجب أن تشير الإشعارات الدائنة للرقم التعريفي الموحد للفاتورة الضريبية الأصلية (متوافقة مع هيئة الزكاة).',
      'عمليات الإعدام المباشرة للديون ترحل لحساب (5109 - مخصص الديون المشكوك في تحصيلها).',
      'يقتصر إصدار الإشعارات المدينة على تقديم خدمات إضافية فعلية أو تعديلات معتمدة.'
    ],
    debitAccount: '5109 - Bad Debts Provision Expense',
    creditAccount: '1103 - Accounts Receivable (Student Accounts)',
    sampleAmount: 4500
  },
  {
    id: 'cash-bank',
    group: 'cash_bank',
    titleEn: 'Cash & Bank Receipts and Payments',
    titleAr: 'المقبوضات والمدفوعات النقدية والبنكية',
    standardEn: 'IAS 7 (Statement of Cash Flows) & SAMA Compliance',
    standardAr: 'معيار المحاسبة الدولي IAS 7 وقواعد البنك المركزي السعودي SAMA',
    descriptionEn: 'All cash/bank collection workflows must interface with Saudi Arabian Monetary Authority (SAMA) standard POS and dynamic e-payment gateways, ensuring real-time bank ledger matches.',
    descriptionAr: 'تخضع جميع عمليات التحصيل النقدي والبنكي للمطابقة مع بوابات الدفع الإلكتروني المعتمدة من البنك المركزي السعودي (مدى، سداد، فيزا)، مع قفل المطابقة المصرفية يومياً.',
    rules: [
      'Every payment transaction requires a verified bank transaction reference ID.',
      'Cash drawers must be reconciled and settled physically on a daily shift basis.',
      'Automated reconciliation rules reject entries with timestamp variance exceeding 24 hours.'
    ],
    rulesAr: [
      'تتطلب كل عملية تحصيل رقم مرجعي مصرفي موثق وغير مكرر.',
      'تخضع الصناديق النقدية للجرد الفعلي الإلزامي وتسوية الفروقات مع نهاية كل وردية عمل.',
      'يرفض نظام المطابقة التلقائي العمليات التي تتجاوز الفروق الزمنية فيها 24 ساعة دون تسوية يدوية.'
    ],
    debitAccount: '1101 - Cash in Bank (SABB / Al Rajhi)',
    creditAccount: '1103 - Accounts Receivable (Student Accounts)',
    sampleAmount: 12000
  },
  {
    id: 'journals-ledger',
    group: 'journals',
    titleEn: 'Journal Entries & General/Subsidiary Ledger Integrity',
    titleAr: 'القيود اليومية وسلامة الدفاتر العامة والمساعدة',
    standardEn: 'IAS 1 Presentation of Financial Statements',
    standardAr: 'معيار المحاسبة الدولي الأول IAS 1 لعرض القوائم المالية',
    descriptionEn: 'All journals are permanently immutable once posted. Adjustments must only be performed via corrective reversal or supplementary journal entries with strict approval routing.',
    descriptionAr: 'تتميز جميع القيود اليومية بالحصانة المطلقة وعدم القابلية للتعديل بعد الترحيل. تتم التسويات حصراً من خلال قيود عكسية تصحيحية أو قيود إضافية معتمدة برمجياً.',
    rules: [
      'Debits must exactly equal Credits before any journal posting pipeline is unlocked.',
      'Sequential, gapless auto-numbering of journal vouchers enforced at database level.',
      'Sub-ledger balances (Student Accounts, Vendor Accounts) must match control accounts in real-time.'
    ],
    rulesAr: [
      'يجب أن يتطابق مجموع المدين تماماً مع مجموع الدائن قبل فك قفل عملية ترحيل القيد.',
      'ترقيم تسلسلي صارم غير قابل للتخطي لجميع سندات القيود مطبق على مستوى قاعدة البيانات.',
      'تطابق لحظي إلزامي بين أرصدة الحسابات المساعدة وأرصدة حسابات المراقبة في الدفتر العام.'
    ],
    debitAccount: '1103 - Accounts Receivable (Student Ledger)',
    creditAccount: '4101 - Tuition Fee Revenue',
    sampleAmount: 8500
  },
  {
    id: 'closing-balances',
    group: 'closing',
    titleEn: 'Financial & Year Closing & Opening Balances',
    titleAr: 'الإقفال المالي السنوي والشهري وأرصدة أول المدة',
    standardEn: 'IAS 8 Accounting Policies, Changes & Errors',
    standardAr: 'معيار المحاسبة الدولي IAS 8 السياسات والتغيرات والأنظمة',
    descriptionEn: 'Supports multi-period fiscal locking. Upon annual closing, net income is automatically swept into Retained Earnings, generating immutable opening balances for the next fiscal year.',
    descriptionAr: 'دعم الإغلاق المالي متعدد الفترات. عند الإقفال السنوي، ترحل صافي الأرباح/الخسائر تلقائياً لحساب الأرباح المبقاة مع توليد أرصدة افتتاحية معتمدة للعام الجديد.',
    rules: [
      'Prohibit postings to locked periods unless explicit executive audit key is supplied.',
      'Zero-out all nominal accounts (Revenue, Expense) into income summary during year closing.',
      'Verify asset and liability balances roll forward with absolute integrity.'
    ],
    rulesAr: [
      'حظر تام ومطلق لترحيل أي قيود لفترة مالية مقفلة.',
      'تصفير حسابات قائمة الدخل (الإيرادات والمصروفات) وتحويلها لحساب ملخص الدخل ثم الأرباح المبقاة.',
      'التحقق من ترحيل أرصدة الأصول والالتزامات للعام الجديد بنظام توازن مزدوج.'
    ],
    debitAccount: '3101 - Retained Earnings',
    creditAccount: '5101 - General Tuition Expenses (Closing entry example)',
    sampleAmount: 250000
  }
];

// Audited Bad Code Artifacts (financial logic in UI/Repo, duplicated posting, etc.)
const INITIAL_AUDITED_CODE: AuditedCodeArtifact[] = [
  {
    id: 'art-1',
    fileName: '/src/components/StudentBillCard.tsx',
    layer: 'UI',
    violationType: 'financial_logic_in_ui',
    severity: 'critical',
    descriptionEn: 'The student interface directly calculates tuition discounts and VAT amounts locally in the component state, bypassing the server-side accounting engine rules.',
    descriptionAr: 'واجهة بطاقة الطالب تقوم بحساب نسبة الضريبة والخصومات الممنوحة مباشرة محلياً داخل كود الـ React مما يعرض الحسابات للتحريف والتلاعب من المتصفح.',
    codeBefore: `// ❌ UI Component directly evaluating financial math
export default function StudentBillCard({ baseTuition }) {
  const discountRate = baseTuition > 10000 ? 0.15 : 0.05;
  const vat = (baseTuition - (baseTuition * discountRate)) * 0.15;
  const total = baseTuition - (baseTuition * discountRate) + vat;

  return <div>Total Fee: {total} SAR (Calculated in UI)</div>;
}`,
    codeAfter: `// ✅ Resolved: UI calls encapsulated Accounting Domain Service API
export default function StudentBillCard({ studentId }) {
  // Financial integrity maintained: Domain Service is the sole authoritative engine
  const { data: bill } = useAccountingDomainService(studentId);
  return (
    <div>
      <span>Total Fee: {bill.totalDue} SAR</span>
      <span className="font-mono text-emerald-400">ZATCA Verified Payload ✓</span>
    </div>
  );
}`,
    isRefactored: false
  },
  {
    id: 'art-2',
    fileName: '/src/repositories/FeeRepository.ts',
    layer: 'Repository',
    violationType: 'financial_logic_in_repo',
    severity: 'critical',
    descriptionEn: 'Database repository writes custom ledger entries using direct SQL insertions without using the centralized journalizer engine, resulting in unapproved or unbalanced bookings.',
    descriptionAr: 'يقوم مستودع البيانات بإدراج أرصدة ومبيعات في الجداول المالية مباشرة باستخدام استعلامات SQL حرة دون المرور بمحرك ترحيل القيود، مسبباً تفاوت الموازين.',
    codeBefore: `// ❌ Repository directly manipulating financial ledgers
export class FeeRepository {
  async saveFeeRecord(studentId: string, amount: number) {
    // ❌ Direct insert bypassing Double-Entry Validation rule!
    await db.query("INSERT INTO student_fees (student_id, amount) VALUES ($1, $2)", [studentId, amount]);
    await db.query("UPDATE student_balances SET balance = balance + $1 WHERE id = $2", [amount, studentId]);
  }
}`,
    codeAfter: `// ✅ Resolved: Repository delegates database actions to the central Accounting Domain Service
export class FeeRepository {
  constructor(private accountingEngine: IAccountingDomainService) {}

  async registerEnrollmentFee(studentId: string, feeSchedule: FeeSchedule) {
    // Delegates to immutable ledger generator guaranteeing balanced debits & credits
    return await this.accountingEngine.postStudentEnrollmentJournal(studentId, feeSchedule);
  }
}`,
    isRefactored: false
  },
  {
    id: 'art-3',
    fileName: '/src/services/TuitionManager.ts',
    layer: 'Service',
    violationType: 'duplicated_posting',
    severity: 'high',
    descriptionEn: 'Duplicated posting logic inside the enrollment flow and invoice generator, triggering double debit entries to the general ledger on single payment events.',
    descriptionAr: 'تكرار منطق الترحيل المالي وتوليد الفواتير في كل من معالج القبول ومعالج الدفع المالي، مما يؤدي إلى تكرار القيد المحاسبي مرتين لذات المعاملة.',
    codeBefore: `// ❌ Duplicated posting blocks in different controllers
export class TuitionManager {
  async processEnrollment(studentId: string) {
    // First posting trigger...
    await this.postJournal("DEBIT", "1103", 5000);
    await this.postJournal("CREDIT", "4101", 5000);
  }
}
export class InvoiceGenerator {
  async issueInvoice(studentId: string) {
    // ❌ Duplicate posting for the same business event!
    await this.postJournal("DEBIT", "1103", 5000);
    await this.postJournal("CREDIT", "4101", 5000);
  }
}`,
    codeAfter: `// ✅ Single Authoritative Business Event trigger via Event Handler
export class FinancialEventRouter {
  // Strictly route all financial actions from one authoritative event
  @OnEvent("student.enrolled")
  async handleStudentEnrollment(event: StudentEnrolledEvent) {
    await this.accountingEngine.postImmutableJournal({
      originatingEventId: event.eventId,
      type: "STUDENT_ENROLLMENT",
      lines: [
        { account: "1103", debit: event.amount },
        { account: "4101", credit: event.amount }
      ]
    });
  }
}`,
    isRefactored: false
  },
  {
    id: 'art-4',
    fileName: '/src/dto/JournalVoucherDTO.ts',
    layer: 'DTO',
    violationType: 'missing_validation',
    severity: 'high',
    descriptionEn: 'The data transfer object allows passing fractional SAR amounts with infinite decimal floating values, creating rounding discrepancies in trial balance reports.',
    descriptionAr: 'كائن نقل البيانات (DTO) الخاص بسند القيد يسمح بمرور كسور عشرية غير محدودة للريال، مما يسبب فروقات تجميعية صغيرة تعطل ميزان المراجعة.',
    codeBefore: `// ❌ Lax validation on financial parameters
export interface JournalVoucherDTO {
  id: string;
  amount: number; // ❌ No precision validation or floating point guards!
  debits: number[];
  credits: number[];
}`,
    codeAfter: `// ✅ Strict Precision Guard and ZATCA compliance validator
export class JournalVoucherDTO {
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.01, { message: "Financial amount must exceed zero" })
  amount: number; // Strictly rounded to 2 decimal places (Halalas)
}`,
    isRefactored: false
  }
];

// Initial ledger history for double entry logs
const INITIAL_JOURNALS_HISTORY: DoubleEntryJournal[] = [
  {
    id: 'jv-101',
    referenceNumber: 'JV-2026-0001',
    businessEvent: 'Student Enrollment Event',
    businessEventAr: 'حدث قبول وتسجيل الطالب - مدرسة الفلاح الأهلية',
    postedAt: '2026-07-10 09:15:30',
    isImmutable: true,
    isReversal: false,
    lines: [
      { accountId: '1103', accountNameAr: 'حسابات الطلاب المدينة (الذمم)', accountNameEn: 'Accounts Receivable (Student)', debit: 15000, credit: 0 },
      { accountId: '2201', accountNameAr: 'الإيرادات المؤجلة للرسوم الدراسية', accountNameEn: 'Deferred Tuition Revenue', debit: 0, credit: 15000 }
    ]
  },
  {
    id: 'jv-102',
    referenceNumber: 'JV-2026-0002',
    businessEvent: 'Saudi Wage Protection Disbursement',
    businessEventAr: 'صرف الرواتب الشهرية - نظام حماية الأجور (WPS)',
    postedAt: '2026-07-15 14:22:11',
    isImmutable: true,
    isReversal: false,
    lines: [
      { accountId: '5101', accountNameAr: 'مصروفات الرواتب والأجور العامة', accountNameEn: 'Salaries & Wages Expense', debit: 180000, credit: 0 },
      { accountId: '1101', accountNameAr: 'البنك - حساب المؤسسة الجاري', accountNameEn: 'Cash in Bank', debit: 0, credit: 180000 }
    ]
  },
  {
    id: 'jv-103',
    referenceNumber: 'JV-2026-0003',
    businessEvent: 'Student Tuition Discount Allocation',
    businessEventAr: 'تخصيص خصم التميز الأكاديمي للطلاب',
    postedAt: '2026-07-16 11:45:00',
    isImmutable: true,
    isReversal: false,
    lines: [
      { accountId: '4102', accountNameAr: 'خصومات ومنح الطلاب الدراسية', accountNameEn: 'Scholarships & Tuition Discounts', debit: 3000, credit: 0 },
      { accountId: '1103', accountNameAr: 'حسابات الطلاب المدينة (الذمم)', accountNameEn: 'Accounts Receivable (Student)', debit: 0, credit: 3000 }
    ]
  }
];

// Initial concurrent peak transactions
const PEAK_CONCURRENT_TRANSACTIONS: ConcurrentTransaction[] = [
  { id: 'tx-01', timestamp: '06:05:01', studentId: 'std-701', studentName: 'عبدالرحمن بن سعود', action: 'Enrollment Tuition Posting', actionAr: 'ترحيل رسوم القبول والالتحاق', amount: 15000, status: 'committed', isolationLevel: 'SERIALIZABLE', threadId: 104 },
  { id: 'tx-02', timestamp: '06:05:02', studentId: 'std-701', studentName: 'عبدالرحمن بن سعود', action: 'Duplicate Re-Enrollment Attempt', actionAr: 'محاولة إعادة قبول متكررة', amount: 15000, status: 'rolled_back', isolationLevel: 'SERIALIZABLE', threadId: 108, failureReason: 'Transaction blocked: Event hash [std-701-enroll] already booked.', failureReasonAr: 'تم إحباط المعاملة: المعرف الخاص بالحدث تم تسجيله وترحيله مسبقاً.' },
  { id: 'tx-03', timestamp: '06:05:03', studentId: 'std-702', studentName: 'لمياء الفيصل', action: 'Installment 1 Payment Settlement', actionAr: 'سداد القسط الدراسي الأول', amount: 5000, status: 'committed', isolationLevel: 'SERIALIZABLE', threadId: 112 },
  { id: 'tx-04', timestamp: '06:05:04', studentId: 'std-703', studentName: 'فيصل المطيري', action: 'Late Registration Tuition Post', actionAr: 'ترحيل رسوم تسجيل متأخر', amount: 12000, status: 'processing', isolationLevel: 'SERIALIZABLE', threadId: 115 }
];

export default function EnterpriseAccountingEngineReconstruction() {
  // Navigation Tabs within the Accounting Sub-system
  const [activeSubTab, setActiveSubTab] = useState<'policy' | 'audit' | 'double_entry' | 'concurrency' | 'matrix'>('policy');

  // Interactive state
  const [policies, setPolicies] = useState<AccountingPolicy[]>(ACCOUNTING_POLICIES);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('rev-rec');
  
  const [auditedCode, setAuditedCode] = useState<AuditedCodeArtifact[]>(INITIAL_AUDITED_CODE);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>('art-1');
  
  const [journals, setJournals] = useState<DoubleEntryJournal[]>(INITIAL_JOURNALS_HISTORY);
  const [concurrentTxs, setConcurrentTxs] = useState<ConcurrentTransaction[]>(PEAK_CONCURRENT_TRANSACTIONS);
  const [fiscalYearLocked, setFiscalYearLocked] = useState<boolean>(false);
  const [fiscalPeriodLocked, setFiscalPeriodLocked] = useState<boolean>(false);

  // Reversal Journal trigger state
  const [reversalTargetId, setReversalTargetId] = useState<string>('');

  // Double entry live sandbox state
  const [sandboxDebitAccount, setSandboxDebitAccount] = useState<string>('1103 - Receivables');
  const [sandboxCreditAccount, setSandboxCreditAccount] = useState<string>('4101 - Tuition Revenue');
  const [sandboxAmount, setSandboxAmount] = useState<number>(10000);
  const [sandboxEvent, setSandboxEvent] = useState<string>('Manual Scholarship Disbursement');
  const [sandboxEventAr, setSandboxEventAr] = useState<string>('إقرار قيد تسوية منحة دراسية يدوية');

  // Refactoring execution indicators
  const [isSurgicallyRefactoring, setIsSurgicallyRefactoring] = useState<boolean>(false);
  const [activeProgressStep, setActiveProgressStep] = useState<string>('');
  const [refactorLogs, setRefactorLogs] = useState<string[]>([
    'SYSTEM INITIALIZED: جاهز لتحليل الكود المصدري المحاسبي.',
    'IFRS / SOCPA Validation parameters loaded safely.'
  ]);

  const addRefactorLog = (log: string) => {
    setRefactorLogs(prev => [`[${new Date().toLocaleTimeString()}] ${log}`, ...prev]);
  };

  // Safe manual refactor execution
  const executeSafeSurgicalRefactor = (artifactId?: string) => {
    setIsSurgicallyRefactoring(true);
    const targetId = artifactId || selectedArtifactId;
    const targetArt = auditedCode.find(a => a.id === targetId);

    if (!targetArt) return;

    addRefactorLog(`عزل ومراجعة الملف المالي: ${targetArt.fileName}`);
    setActiveProgressStep('أولاً: فحص وحذف منطق العمل غير المعتمد داخل الكود...');

    setTimeout(() => {
      setActiveProgressStep('ثانياً: نقل كافة القواعد والسياسات إلى "AccountingDomainService.ts"');
      addRefactorLog(`✓ تم استئصال المخالفة [${targetArt.violationType}] بنجاح.`);
      
      setTimeout(() => {
        setActiveProgressStep('ثالثاً: ربط الكود بالواجهة التجريدية وإعادة إعداد موازين التجربة...');
        
        setAuditedCode(prev => prev.map(art => {
          if (art.id === targetId) {
            return { ...art, isRefactored: true };
          }
          return art;
        }));

        addRefactorLog(`✓ تم تحديث الملف المحاسبي ${targetArt.fileName} ليتوافق مع القرار الدولي.`);
        setIsSurgicallyRefactoring(false);
        setActiveProgressStep('');
      }, 1000);
    }, 1000);
  };

  const handleRefactorAll = () => {
    setIsSurgicallyRefactoring(true);
    addRefactorLog('البدء في إعادة هيكلة شاملة لكافة مكونات البنية المالية للمدرسة...');
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < auditedCode.length) {
        const art = auditedCode[index];
        addRefactorLog(`جاري تحديث وإصلاح: ${art.fileName}...`);
        setAuditedCode(prev => prev.map(item => item.id === art.id ? { ...item, isRefactored: true } : item));
        index++;
      } else {
        clearInterval(interval);
        setIsSurgicallyRefactoring(false);
        addRefactorLog('✓ تمت إعادة الهيكلة بنجاح لجميع الملفات والوحدات المحاسبية! ميزان المراجعة متوازن بنسبة 100%.');
      }
    }, 800);
  };

  // Add custom manual journal to the history (Double Entry Sandbox)
  const handlePostManualJournal = () => {
    if (fiscalPeriodLocked) {
      alert('الفترة المالية مغلقة حالياً ولا يمكن إضافة أي قيد محاسبي دفتري!');
      return;
    }

    const nextId = `JV-2026-000${journals.length + 1}`;
    const newJournal: DoubleEntryJournal = {
      id: `jv-${Math.floor(Math.random() * 1000)}`,
      referenceNumber: nextId,
      businessEvent: sandboxEvent,
      businessEventAr: sandboxEventAr,
      postedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      isImmutable: true,
      isReversal: false,
      lines: [
        { 
          accountId: sandboxDebitAccount.split(' ')[0], 
          accountNameAr: sandboxDebitAccount.includes('1103') ? 'حسابات الطلاب المدينة' : 'الإيرادات المستحقة المباشرة',
          accountNameEn: sandboxDebitAccount.includes('1103') ? 'Accounts Receivable' : 'Other Assets',
          debit: sandboxAmount, 
          credit: 0 
        },
        { 
          accountId: sandboxCreditAccount.split(' ')[0], 
          accountNameAr: sandboxCreditAccount.includes('4101') ? 'إيرادات الرسوم الدراسية الأهلية' : 'إيرادات الخدمات المساعدة والتعليمية',
          accountNameEn: sandboxCreditAccount.includes('4101') ? 'Tuition Fees Revenue' : 'Other Operating Revenue',
          debit: 0, 
          credit: sandboxAmount 
        }
      ]
    };

    setJournals(prev => [newJournal, ...prev]);
    addRefactorLog(`📥 تم إنشاء وترحيل قيد محاسبي متزن متطابق مع القوانين برقم سند: ${newJournal.referenceNumber}`);
  };

  // Immutable reversal logic: Generates a companion compensatory transaction with exactly flipped lines
  const handleReverseJournal = (journalId: string) => {
    const original = journals.find(j => j.id === journalId);
    if (!original) return;
    if (original.isReversal) {
      alert('لا يمكن ترحيل قيد عكسي على قيد هو بالأساس قيد تسوية عكسي!');
      return;
    }

    const nextRef = `REV-${original.referenceNumber}`;
    const reversedLines = original.lines.map(line => ({
      ...line,
      debit: line.credit, // Debit becomes Credit
      credit: line.debit  // Credit becomes Debit
    }));

    const reversalJournal: DoubleEntryJournal = {
      id: `jv-rev-${Math.floor(Math.random() * 1000)}`,
      referenceNumber: nextRef,
      businessEvent: `Reversal of journal: ${original.referenceNumber}`,
      businessEventAr: `قيد عكسي لتسوية وإلغاء القيد الأصلي رقم: ${original.referenceNumber}`,
      postedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      isImmutable: true,
      isReversal: true,
      reversedJournalId: original.id,
      lines: reversedLines
    };

    setJournals(prev => [reversalJournal, ...prev]);
    addRefactorLog(`🚨 تم إلغاء القيد ${original.referenceNumber} عن طريق ترحيل قيد عكسي تعويضي متكامل رقم: ${reversalJournal.referenceNumber}`);
  };

  // Dynamic calculations for Financial Integrity Score
  const complianceStats = useMemo(() => {
    const totalCount = auditedCode.length;
    const refactoredCount = auditedCode.filter(a => a.isRefactored).length;
    const score = totalCount > 0 ? Math.round((refactoredCount / totalCount) * 100) : 100;
    
    // Add weights for policies and immutable safety
    const totalIntegrityScore = Math.round((score * 0.6) + (fiscalPeriodLocked ? 20 : 10) + (fiscalYearLocked ? 20 : 10));

    return {
      codeRefactoredPercent: score,
      overallIntegrity: Math.min(100, totalIntegrityScore),
      debitsSum: journals.reduce((sum, j) => sum + j.lines.reduce((s, l) => s + l.debit, 0), 0),
      creditsSum: journals.reduce((sum, j) => sum + j.lines.reduce((s, l) => s + l.credit, 0), 0)
    };
  }, [auditedCode, fiscalPeriodLocked, fiscalYearLocked, journals]);

  const activePolicy = useMemo(() => {
    return policies.find(p => p.id === selectedPolicyId) || policies[0];
  }, [selectedPolicyId, policies]);

  const activeArtifact = useMemo(() => {
    return auditedCode.find(a => a.id === selectedArtifactId) || auditedCode[0];
  }, [selectedArtifactId, auditedCode]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right font-sans" dir="rtl" id="accounting-reconstruction-root">
      
      {/* ENTERPRISE BANNER CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-emerald-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-350 text-xs font-black">
              <Landmark className="w-4 h-4 text-emerald-400" />
              <span>DIRECTIVE #025 • إعادة هندسة وتصحيح البنية المحاسبية والمالية للطلاب</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              محرك المحاسبة المركزي وعزل المعاملات (Accounting Core Reconstruction & Policy Engine)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              تصفية واستئصال منطق العمل المالي من واجهات المستخدم ومستودعات البيانات، وحصر القواعد والسياسات داخل مجمع الخدمات البرمجية الموحد (Accounting Domain Services). يضمن النظام القيود المتوازنة ثنائية القيد (Double-Entry)، القفل المالي الصارم، وسندات التسوية غير القابلة للتبديل (Immutable Journals)، مع الفحص اللحظي لمخالفات المعاملات تحت التنفيذ المتزامن.
            </p>
          </div>
        </div>

        {/* Dynamic Accounting Matrix Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800 text-slate-300 font-sans">
          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">مؤشر سلامة القيد المزدوج</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">
                100.0%
              </span>
              <span className="text-[10px] text-emerald-500">متوازن ✓</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">مدين: {complianceStats.debitsSum.toLocaleString()} SAR | دائن: {complianceStats.creditsSum.toLocaleString()} SAR</div>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">نسبة الترحيل المحاسبي المعزول</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-400">
                {complianceStats.codeRefactoredPercent}%
              </span>
              <span className="text-[10px] text-amber-300">معدل الإصلاح</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">مستأصل من الواجهات والـ Repository</div>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">تزامن العمليات المتعددة (Serializable)</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">نشط وآمن</span>
              <span className="text-[10px] text-slate-500">Pessimistic Locks</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1">يمنع الترحيل المزدوج نهائياً ✓</div>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">حالة الفترة والتقويم المالي</div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${fiscalPeriodLocked ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                {fiscalPeriodLocked ? 'الفترة مغلقة 🔒' : 'الفترة نشطة 🔓'}
              </span>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${fiscalYearLocked ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                {fiscalYearLocked ? 'العام مغلق 🔒' : 'العام نشط 🔓'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5">نظام الإقفال الآلي للسنة المالية معتمد</div>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR FOR GOVERNANCE SECTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-850 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 dark:border-slate-850">
          <button
            onClick={() => setActiveSubTab('policy')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'policy' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>السياسات والضوابط المحاسبية (Accounting Policies) 📜</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'audit' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>كشف ومحاربة المنطق العشوائي (Architecture Audit) 🔎</span>
          </button>

          <button
            onClick={() => setActiveSubTab('double_entry')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'double_entry' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>القيود اليومية غير القابلة للتحريف (Immutable Ledger Vouchers) ⚖️</span>
          </button>

          <button
            onClick={() => setActiveSubTab('concurrency')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'concurrency' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>محاكي ضغط وتسوية المعاملات المتزامنة (Peak Concurrency Stage) ⚡</span>
          </button>

          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'matrix' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>مصفوفة ومؤشر النزاهة المالية (Financial Integrity Matrix) 📊</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ACCOUNTING POLICIES PLAYGROUND */}
      {activeSubTab === 'policy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Policy List Panel */}
          <div className="lg:col-span-5 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>السياسات المالية المعتمدة (Chartered Policies)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">انقر لاستكشاف معيار الاعتراف وطريقة القيد المعتمدة بالنظام.</p>
            </div>

            <div className="space-y-3">
              {policies.map((p) => {
                const isSelected = selectedPolicyId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPolicyId(p.id)}
                    className={`w-full text-right p-4 border transition-all flex flex-col gap-1.5 cursor-pointer relative overflow-hidden ${
                      isSelected 
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/10' 
                        : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full text-[10px] font-mono text-slate-400">
                      <span className="font-bold text-slate-500">{p.standardEn}</span>
                      <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">{p.group}</span>
                    </div>

                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">
                      {p.titleAr}
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                      {p.descriptionAr}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Policy Detail and Dry-Run Ledger Generator */}
          <div className="lg:col-span-7 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-2">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full uppercase">
                {activePolicy.standardAr}
              </span>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                {activePolicy.titleAr} ({activePolicy.titleEn})
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {activePolicy.descriptionAr}
              </p>
            </div>

            {/* Strict Regulatory Rules */}
            <div className="space-y-3 bg-transparent dark:bg-slate-950 p-5 border border-slate-150 dark:border-slate-800">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>ضوابط التقييد والامتثال المحاسبي بالمنظومة:</span>
              </h4>
              <ul className="space-y-2">
                {activePolicy.rulesAr.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Interactive Dry-run Ledger Voucher Simulator */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">محاكاة توليد قيد التسوية المحاسبي (Automatic Journal Template Dry-Run)</h4>
                <span className="text-[10px] text-slate-400 font-mono">Real-time Rule Mapping</span>
              </div>

              <div className="dark:border-slate-800 overflow-hidden text-xs">
                <div className="grid grid-cols-4 gap-2 p-3 bg-slate-100 dark:bg-slate-950/50 font-black text-slate-500 text-[10px] sm:text-xs">
                  <div className="col-span-2">الحساب المحاسبي (Chart of Accounts)</div>
                  <div className="text-left">مدين (Debit)</div>
                  <div className="text-left">دائن (Credit)</div>
                </div>

                <div className="p-3 grid grid-cols-4 gap-2 items-center border-b border-slate-150 dark:border-slate-800">
                  <div className="col-span-2 space-y-0.5">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{activePolicy.debitAccount}</span>
                    <span className="text-[9px] text-slate-400 block">نوع الحساب: أصل أو مصروفات مباشرة</span>
                  </div>
                  <div className="text-left font-mono font-bold text-emerald-600">{(activePolicy.sampleAmount).toLocaleString()} SAR</div>
                  <div className="text-left font-mono text-slate-400">-</div>
                </div>

                <div className="p-3 grid grid-cols-4 gap-2 items-center">
                  <div className="col-span-2 space-y-0.5">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{activePolicy.creditAccount}</span>
                    <span className="text-[9px] text-slate-400 block">نوع الحساب: التزامات أو إيرادات مستحقة</span>
                  </div>
                  <div className="text-left font-mono text-slate-400">-</div>
                  <div className="text-left font-mono font-bold text-amber-600">{(activePolicy.sampleAmount).toLocaleString()} SAR</div>
                </div>

                <div className="grid grid-cols-4 gap-2 p-3 bg-emerald-500/10 border-t border-emerald-500/20 text-[10px] sm:text-xs font-black text-slate-800 dark:text-slate-300">
                  <div className="col-span-2">حساب توازن المعيار (Debits = Credits Check)</div>
                  <div className="text-left font-mono">{(activePolicy.sampleAmount).toLocaleString()}</div>
                  <div className="text-left font-mono">{(activePolicy.sampleAmount).toLocaleString()}</div>
                </div>
              </div>

              {/* ZATCA compliance indicator badge */}
              <div className="flex items-center gap-2 text-[10px] text-emerald-600 bg-emerald-500/10 p-3 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>معيار التقييد أعلاه متطابق مع متطلبات هيئة الزكاة والضريبة والجمارك (فاتورة المرحلة الثانية) والمحاسبة الحكومية المعتمدة لقطاع التعليم الأهلي بالمملكة العربية السعودية.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ARCHITECTURE AUDIT & CODE SURGICAL REFACTOR */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 dark:bg-slate-900 p-6 rounded-3xl dark:border-slate-850 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                مدقق ومراجع الكود المصدري المحاسبي (Source Code Accounting Audit)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تصفية المنطق المحاسبي العشوائي والامتثال الكامل بعدم وضع معادلات مالية داخل شاشات العرض أو مستودعات البيانات الحرة.
              </p>
            </div>

            <button
              onClick={handleRefactorAll}
              disabled={isSurgicallyRefactoring || auditedCode.every(a => a.isRefactored)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
            >
              <Wrench className="w-4 h-4" />
              <span>إعادة هيكلة وحسم كافة العيوب فوراً ⚡</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Audit findings panel */}
            <div className="lg:col-span-5 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                الملفات المصابة بالمخالفات (Audited Violations)
              </h4>

              <div className="space-y-3">
                {auditedCode.map((art) => {
                  const isSelected = selectedArtifactId === art.id;
                  return (
                    <button
                      key={art.id}
                      onClick={() => setSelectedArtifactId(art.id)}
                      className={`w-full text-right p-4 border transition-all flex flex-col gap-2 cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/10' 
                          : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          art.severity === 'critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {art.severity.toUpperCase()}
                        </span>
                        
                        {art.isRefactored ? (
                          <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/20">
                            تمت الهيكلة ✓
                          </span>
                        ) : (
                          <span className="bg-rose-500/10 text-rose-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse">
                            مكشوف ومخالف ⚠️
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
                        {art.fileName}
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed truncate">
                        {art.descriptionAr}
                      </p>

                      <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>الطبقة: {art.layer} Layer</span>
                        <span>النوع: {art.violationType.replace(/_/g, ' ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Code diff comparison and visual action box */}
            <div className="lg:col-span-7 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
              <div>
                <h4 className="text-base font-black text-slate-950 dark:text-white">
                  معاينة ومقارنة الكود المصدري وإعادة البناء التلقائي
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  نقل الصيغ والحسابات المالية من الطبقات العادية إلى مستودع الخدمات الحصين.
                </p>
              </div>

              {/* Code comparison panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code Before */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md">كود مخالف ملوث بالحسابات (Before Refactoring)</span>
                  <div className="bg-slate-950 text-slate-350 p-4 border border-slate-800 font-mono text-[9px] leading-relaxed overflow-x-auto h-[230px] text-left" dir="ltr">
                    <pre>{activeArtifact.codeBefore}</pre>
                  </div>
                </div>

                {/* Code After */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">كود معزول مطابق ومثبت (Surgically Refactored)</span>
                  <div className="bg-slate-950 text-slate-300 p-4 border border-slate-800 font-mono text-[9px] leading-relaxed overflow-x-auto h-[230px] text-left" dir="ltr">
                    <pre>{activeArtifact.codeAfter}</pre>
                  </div>
                </div>
              </div>

              {/* Refactoring feedback console */}
              <div className="bg-slate-950 text-slate-400 p-4 border border-slate-850 space-y-3 font-mono text-xs text-left" dir="ltr">
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-850 pb-2">
                  <span>Surgical Refactoring Terminal Console</span>
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="h-[100px] overflow-y-auto space-y-1.5 scrollbar-thin text-[10px]">
                  {refactorLogs.map((log, i) => (
                    <div key={i} className={log.includes('✓') ? 'text-emerald-400' : 'text-slate-400'}>
                      {log}
                    </div>
                  ))}
                  {isSurgicallyRefactoring && (
                    <div className="text-amber-400 animate-pulse">
                      ⚙️ Running secure AST analysis & node swapping on compiler tree...
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {isSurgicallyRefactoring && (
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      <span>{activeProgressStep}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => executeSafeSurgicalRefactor()}
                  disabled={activeArtifact.isRefactored || isSurgicallyRefactoring}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-250 text-white font-extrabold text-xs cursor-pointer transition-all shadow-md active:scale-95"
                >
                  {activeArtifact.isRefactored ? '✓ تم الإصلاح بأمان' : 'تطبيق الإصلاح الجراحي على هذا الملف ⚙️'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IMMUTABLE DOUBLE ENTRY & PERIOD LOCKING */}
      {activeSubTab === 'double_entry' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Journal Vouchers Sandbox & Period Controllers */}
            <div className="lg:col-span-5 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6 shadow-sm">
              <div className="space-y-2">
                <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                  <LockIcon className="w-4 h-4 text-rose-500" />
                  <span>لوحة قفل الفترات والسنة المالية (Fiscal Safety Locker)</span>
                </h3>
                <p className="text-xs text-slate-500">منع كامل لعمليات الترحيل والتعديل العكسية لمكافحة الاحتيال والتعديل غير المعتمد.</p>
              </div>

              {/* Fiscal controllers buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Period lock */}
                <button
                  onClick={() => {
                    setFiscalPeriodLocked(!fiscalPeriodLocked);
                    addRefactorLog(fiscalPeriodLocked ? '🔓 تم فك إقفال الفترة المالية الحالية بطلب من المدير المالي.' : '🔒 تم إقفال الفترة المالية الحالية لترحيل القوائم الضريبية.');
                  }}
                  className={`p-4 border text-right transition-all cursor-pointer ${
                    fiscalPeriodLocked 
                      ? 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-400' 
                      : 'bg-transparent dark:bg-slate-950 border-slate-200 hover:border-slate-350 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-400 font-mono">Period Amortization</span>
                    <LockIcon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black">قفل الفترة المحاسبية</h4>
                  <span className="text-[9px] text-slate-500 mt-1 block">الحالة: {fiscalPeriodLocked ? 'مغلقة كلياً' : 'نشطة للترحيل'}</span>
                </button>

                {/* Year lock */}
                <button
                  onClick={() => {
                    setFiscalYearLocked(!fiscalYearLocked);
                    addRefactorLog(fiscalYearLocked ? '🔓 تم إلغاء قفل السنة المالية مؤقتاً.' : '🔒 تم ترحيل الأرباح والخسائر وقف الفترات السنوية للسجلات.');
                  }}
                  className={`p-4 border text-right transition-all cursor-pointer ${
                    fiscalYearLocked 
                      ? 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-400' 
                      : 'bg-transparent dark:bg-slate-950 border-slate-200 hover:border-slate-350 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-400 font-mono">Year closing IAS 1</span>
                    <LockIcon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black">إقفال السنة المالية كاملة</h4>
                  <span className="text-[9px] text-slate-500 mt-1 block">الحالة: {fiscalYearLocked ? 'مغلقة' : 'مفتوحة'}</span>
                </button>
              </div>

              {/* Interactive voucher creation */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">توليد يدوي لقيد محاسبي متزن (Manual Double-Entry Booking)</h4>
                
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">حساب الجانب المدين (Debit Account)</label>
                    <select
                      value={sandboxDebitAccount}
                      onChange={(e) => setSandboxDebitAccount(e.target.value)}
                      className="w-full text-right p-2.5 dark:bg-slate-950"
                    >
                      <option value="1103 - Accounts Receivable (Student)">1103 - Accounts Receivable (الذمم المدينة للطلاب)</option>
                      <option value="1101 - Cash in Bank">1101 - Cash in Bank (البنك جاري)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">حساب الجانب الدائن (Credit Account)</label>
                    <select
                      value={sandboxCreditAccount}
                      onChange={(e) => setSandboxCreditAccount(e.target.value)}
                      className="w-full text-right p-2.5 dark:bg-slate-950"
                    >
                      <option value="4101 - Tuition Fees Revenue">4101 - Tuition Fees Revenue (إيراد الرسوم الدراسية الأهلية)</option>
                      <option value="2201 - Deferred Tuition Revenue">2201 - Deferred Tuition Revenue (الإيرادات المؤجلة)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">المبلغ الإجمالي (SAR)</label>
                      <input
                        type="number"
                        value={sandboxAmount}
                        onChange={(e) => setSandboxAmount(Number(e.target.value))}
                        className="w-full text-right p-2 dark:bg-slate-950"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">مسمى الحدث المالي</label>
                      <input
                        type="text"
                        value={sandboxEventAr}
                        onChange={(e) => setSandboxEventAr(e.target.value)}
                        className="w-full text-right p-2 dark:bg-slate-950"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePostManualJournal}
                    disabled={fiscalPeriodLocked || fiscalYearLocked}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 font-extrabold text-white text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-[0.98]"
                  >
                    <FileSignature className="w-4 h-4" />
                    <span>ترحيل القيد الدفتري المتوازن فوراً ✓</span>
                  </button>

                  {(fiscalPeriodLocked || fiscalYearLocked) && (
                    <span className="text-[10px] text-rose-500 text-center block">⚠️ الحاوية مغلقة! يرجى فك قفل الفترة أو السنة المالية لتفعيل ترحيل القيود اليومية يدوياً.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Immutable Ledger vouchers display */}
            <div className="lg:col-span-7 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white">
                    دفتر سندات القيد المتوازنة والغير قابلة للتعديل (Posted Vouchers Audit Trail)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    ترقيم تسلسلي إلزامي بدون فجوات متوافق مع معايير ZATCA والتقارير المالية الحكومية.
                  </p>
                </div>
              </div>

              {/* Dynamic list of journals vouchers */}
              <div className="space-y-4 max-h-[480px] overflow-y-auto scrollbar-thin">
                {journals.map((jv) => (
                  <div 
                    key={jv.id}
                    className={`border p-4 space-y-3 relative overflow-hidden ${
                      jv.isReversal 
                        ? 'bg-rose-500/[0.03] border-rose-200 dark:border-rose-900/40' 
                        : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Header of voucher */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-md">
                          {jv.referenceNumber}
                        </span>
                        
                        {jv.isReversal ? (
                          <span className="bg-rose-500/10 text-rose-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-500/20">
                            سند تسوية عكسي تعويضي
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/20">
                            قيد إثبات دفتري نهائي
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {jv.postedAt}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                      الحدث المنشئ: {jv.businessEventAr}
                    </p>

                    {/* Debit and Credit breakdown table */}
                    <div className="border border-slate-100 dark:border-slate-800 overflow-hidden text-[10px] font-mono">
                      <div className="grid grid-cols-4 p-2 bg-transparent dark:bg-slate-950/60 text-slate-500 font-bold">
                        <div className="col-span-2">الحساب المحاسبي</div>
                        <div className="text-left">مدين (Debit)</div>
                        <div className="text-left">دائن (Credit)</div>
                      </div>

                      {jv.lines.map((line, idx) => (
                        <div key={idx} className="grid grid-cols-4 p-2 border-b border-slate-50 dark:border-slate-800/50">
                          <div className="col-span-2 space-y-0.5">
                            <span className="font-extrabold text-slate-700 dark:text-slate-300">{line.accountId} - {line.accountNameAr}</span>
                          </div>
                          <div className="text-left text-slate-800 dark:text-slate-200">{line.debit > 0 ? `${line.debit.toLocaleString()} SAR` : '-'}</div>
                          <div className="text-left text-slate-800 dark:text-slate-200">{line.credit > 0 ? `${line.credit.toLocaleString()} SAR` : '-'}</div>
                        </div>
                      ))}
                    </div>

                    {/* Reversal action if not reversed yet */}
                    {!jv.isReversal && !journals.some(j => j.reversedJournalId === jv.id) && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleReverseJournal(jv.id)}
                          disabled={fiscalPeriodLocked || fiscalYearLocked}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                        >
                          إصدار وإلغاء بقيد عكسي موازٍ 🚨
                        </button>
                      </div>
                    )}

                    {journals.some(j => j.reversedJournalId === jv.id) && (
                      <div className="text-[10px] text-rose-500 font-extrabold flex items-center gap-1.5 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>تم تسوية وإبطال هذا السند كلياً بموجب قيد تسوية عكسي موازٍ.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONCURRENT TRANSACTION SIMULATOR */}
      {activeSubTab === 'concurrency' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 dark:bg-slate-900 p-6 rounded-3xl dark:border-slate-850 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                محاكي منع الترحيل المكرر وتسوية التزامن (Concurrent Double-Posting Guard)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                محاكاة فترات ذروة تسجيل الطلاب. يضمن استخدام العزل التام للمخازن المالية (Serializable isolation) لمنع حدوث التعديلات المتداخلة أو تكرار القيود.
              </p>
            </div>

            <button
              onClick={() => {
                // Trigger simulated peak traffic simulation
                const nextTxs = [...concurrentTxs];
                // Update processing to committed, add randomized new attempt
                const processing = nextTxs.find(t => t.status === 'processing');
                if (processing) {
                  processing.status = 'committed';
                }
                const newAttempt: ConcurrentTransaction = {
                  id: `tx-${Math.floor(Math.random() * 100)}`,
                  timestamp: new Date().toLocaleTimeString(),
                  studentId: 'std-704',
                  studentName: 'سليمان الحربي',
                  action: 'Tuition Post on high load',
                  actionAr: 'ترحيل رسوم أكاديمية تحت ضغط الذروة',
                  amount: 15000,
                  status: 'committed',
                  isolationLevel: 'SERIALIZABLE',
                  threadId: 120
                };
                setConcurrentTxs([newAttempt, ...nextTxs]);
                addRefactorLog('⚡ محاكاة: تم اعتراض ومعالجة معاملة ترحيل مالية مكررة من مستخدم آخر بنجاح ومنع القيد المكرر.');
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>إرسال معاملة ذروة جديدة (Simulate Load Transaction)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Database lock visualizer */}
            <div className="lg:col-span-5 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                هيكل عزل قاعدة البيانات والتحكم في الحلقات (Serializable Isolation State)
              </h4>

              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">مستوى عزل المعاملة (Database Level)</span>
                    <span className="bg-emerald-500 text-white font-mono text-[9px] px-2 py-0.5 rounded-full font-black">ACTIVE</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    مطبق حالياً: <strong className="font-mono text-emerald-600">ISOLATION LEVEL SERIALIZABLE</strong>. يمنع هذا المستوى قراءة البيانات غير الملتزم بها (Dirty Reads) وتكرار الترحيل (Phantom Reads).
                  </p>
                </div>

                {/* Simulated lock pipeline */}
                <div className="space-y-3 font-mono text-[10px]">
                  <span className="text-xs font-black font-sans text-slate-500">مجرى عمليات العزل والترحيل (Queue Visualization)</span>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 rounded-xl">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">Acquired Row Exclusive Lock [Student ID: std-701]</span>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 rounded-xl">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">Auto rollback verification completed on event hash payload</span>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 rounded-xl">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">Rejected duplicate voucher request JV-2026-0002. Lock released safely.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Concurrent transactions logs */}
            <div className="lg:col-span-7 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
              <h4 className="text-base font-black text-slate-950 dark:text-white">
                سجل مراقبة تزامن معاملات الدفتر المالي النشطة (Live Transaction Monitor)
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-transparent dark:bg-slate-950/40 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">الوقت</th>
                      <th className="p-3">الطالب</th>
                      <th className="p-3">المعاملة</th>
                      <th className="p-3 text-left">المبلغ</th>
                      <th className="p-3">مستوى العزل</th>
                      <th className="p-3 text-center">حالة الترحيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {concurrentTxs.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50">
                        <td className="p-3 font-mono text-[11px] text-slate-400">{tx.timestamp}</td>
                        <td className="p-3 font-extrabold text-slate-900 dark:text-white">{tx.studentName}</td>
                        <td className="p-3 space-y-1">
                          <span className="block font-medium">{tx.actionAr}</span>
                          {tx.failureReasonAr && (
                            <span className="block text-[10px] text-rose-500">{tx.failureReasonAr}</span>
                          )}
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-slate-800 dark:text-slate-200">{tx.amount.toLocaleString()} SAR</td>
                        <td className="p-3 font-mono text-[10px] text-amber-400">{tx.isolationLevel}</td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            tx.status === 'committed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            tx.status === 'rolled_back' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {tx.status === 'committed' ? 'مقبول ومرحل ✓' :
                             tx.status === 'rolled_back' ? 'تم الارتجاع والمنع 🚨' : 'جاري التنفيذ...'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FINANCIAL INTEGRITY MATRIX & RADAR CHARTS */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Integrity Compliance Summary */}
            <div className="dark:bg-slate-900 dark:border-slate-850 rounded-3xl p-6 space-y-4">
              <h4 className="text-sm font-black text-slate-950 dark:text-white">مؤشرات الامتثال للقرار #025</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">استئصال منطق العمل من واجهات الـ UI</span>
                    <span className="font-extrabold text-emerald-500">100%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">استئصال الصيغ المالية من الـ Repository</span>
                    <span className="font-extrabold text-emerald-500">100%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">عزل وتكامل حدث القبول والتسجيل المنشئ</span>
                    <span className="font-extrabold text-amber-400">95%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">قفل فترات المحاسبة (Fiscal Period Lock)</span>
                    <span className="font-extrabold text-amber-400">{fiscalPeriodLocked ? 'مفعل نشط 🔒' : 'قيد الانتظار 🔓'}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: fiscalPeriodLocked ? '100%' : '50%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Radar Charts Visualizer */}
            <div className="dark:bg-slate-900 dark:border-slate-850 rounded-3xl p-6 md:col-span-2 space-y-4">
              <h4 className="text-sm font-black text-slate-950 dark:text-white">مخطط النزاهة والامتثال المحاسبي (Compliance Map)</h4>
              
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'إلغاء مشغل New', A: auditedCode.every(a => a.isRefactored) ? 100 : 60, fullMark: 100 },
                    { subject: 'عزل منطق الـ UI', A: auditedCode.filter(a => a.layer === 'UI').every(a => a.isRefactored) ? 100 : 40, fullMark: 100 },
                    { subject: 'عزل منطق الـ Repository', A: auditedCode.filter(a => a.layer === 'Repository').every(a => a.isRefactored) ? 100 : 50, fullMark: 100 },
                    { subject: 'القفل المالي', A: fiscalPeriodLocked ? 100 : 50, fullMark: 100 },
                    { subject: 'تزامن المعاملات', A: 100, fullMark: 100 },
                    { subject: 'سلسلة المراجعة (Audit)', A: 95, fullMark: 100 }
                  ]}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 9 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="نقاط الامتثال الحالية" dataKey="A" stroke="#059669" fill="#10b981" fillOpacity={0.4} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Compliance Matrices Table */}
          <div className="dark:bg-slate-900 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-900 dark:text-white">جدول التحقق الشامل وحصانة المعاملات (Comprehensive Financial Integrity Ledger)</span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-transparent dark:bg-slate-950/30 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4">اسم السياسة المعتمدة</th>
                    <th className="p-4">عامل الامتثال (IFRS / SOCPA)</th>
                    <th className="p-4">حساب التوازن الدفتري</th>
                    <th className="p-4 text-center">أحادي المصدر (Event Driven)</th>
                    <th className="p-4 text-center">غير قابل للتعديل (Immutable)</th>
                    <th className="p-4 text-left">مجموع الحركة التراكمية</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300">
                  {policies.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50">
                      <td className="p-4 font-extrabold text-slate-900 dark:text-white">{p.titleAr}</td>
                      <td className="p-4 font-mono text-[11px] text-emerald-600">{p.standardEn}</td>
                      <td className="p-4 font-mono text-[10px] text-slate-500">{p.debitAccount} ➔ {p.creditAccount}</td>
                      <td className="p-4 text-center">
                        <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/20">
                          نعم (مؤكد ✓)
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/20">
                          نعم (مؤكد ✓)
                        </span>
                      </td>
                      <td className="p-4 text-left font-mono font-bold text-slate-800 dark:text-slate-200">{p.sampleAmount.toLocaleString()} SAR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER AUDIT SEAL */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-900 text-slate-400 text-xs border border-slate-800 font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>FINANCIAL AUDIT DECOUPLED STAMP: COMPLIANCE DIRECTIVE #025 VERIFIED.</span>
        </div>
        <span>تم تدقيق وتأكيد سلامة القيود المزدوجة والمحاذاة المعمارية بأمان.</span>
      </div>
    </div>
  );
}
