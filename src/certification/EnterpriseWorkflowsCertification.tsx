import { Activity, AlertTriangle, ArrowRightLeft, Award, Building, Check, CheckCircle2, CheckSquare2, Download, FileText, Filter, Grid, History as HistoryIcon, Logs, Map, Play, Printer, Receipt, RefreshCw, Scale, School, Search, Settings, ShieldAlert, Sliders, Stamp, Table, Terminal, Undo2, Verified, View, Workflow, XCircle } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { motion, AnimatePresence } from 'motion/react';

interface EnterpriseWorkflowsCertificationProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface WorkflowStep {
  id: string;
  labelArabic: string;
  labelEnglish: string;
  status: 'connected' | 'interrupted'; // connected = متكامل آلياً, interrupted = فجوة أو خطوة خارج النظام
  interruptionReason?: string;
  assignedRole: string;
}

interface WorkflowAnomaly {
  id: string;
  type: 'missing_step' | 'duplicate_step' | 'broken_transition' | 'circular_workflow' | 'hidden_dependency' | 'unvalidated_transition' | 'unrecoverable_failure' | 'partial_transaction' | 'orphan_operation';
  labelArabic: string;
  labelEnglish: string;
  descriptionArabic: string;
  descriptionEnglish: string;
  isSolved: boolean;
  severity: 'critical' | 'warning';
}

interface StateMachineState {
  name: string;
  labelArabic: string;
  labelEnglish: string;
  assignedRole: string;
  validationRule: string;
  rollbackRule: string;
  businessConstraint: string;
}

interface WorkflowAudit {
  id: string;
  titleArabic: string;
  titleEnglish: string;
  description: string;
  steps: WorkflowStep[];
  anomalies: WorkflowAnomaly[];
  currentState: string;
  statesList: StateMachineState[];
  allowedTransitions: Record<string, string[]>; // Map of state -> allowed next states
  isCertified: boolean;
}

export default function EnterpriseWorkflowsCertification({ triggerNotification }: EnterpriseWorkflowsCertificationProps) {
  // Filter and General View State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('wf_financial');
  const [showOnlyInterrupted, setShowOnlyInterrupted] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [isSimulatingTransition, setIsSimulatingTransition] = useState<boolean>(false);
  const [isRollbackRunning, setIsRollbackRunning] = useState<boolean>(false);

  // Terminal Console Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString('ar-SA')}] بوابة فحص ومعايرة مسارات العمل (Workflow Integrity Engine v16.0) نشطة وجاهزة.`,
    `[${new Date().toLocaleTimeString('ar-SA')}] تم تطبيق الميثاق الموحد للتحول السحابي (TRANSFORMATION DIRECTIVE #016) لمنع الفجوات والخطوات الخارجية.`
  ]);

  // Comprehensive workflows with full state-machine specifications & detected anomalies
  const [workflows, setWorkflows] = useState<WorkflowAudit[]>([
    {
      id: 'wf_financial',
      titleArabic: 'الدورة المالية والمحاسبية المتكاملة للطلاب',
      titleEnglish: 'Student Financial & General Ledger Integration Loop',
      description: 'دورة التدفق المالي الأساسية التي تبدأ من قيد الطالب، وتمر بجدولة الأقساط والتحصيل، وتصل إلى القوائم والتقارير المالية والأستاذ العام بمطابقة 100%.',
      currentState: 'DRAFT',
      isCertified: true,
      steps: [
        { id: 'wf1-s1', labelArabic: 'الطلاب والقبول', labelEnglish: 'Student Admission', status: 'connected', assignedRole: 'شؤون الطلاب' },
        { id: 'wf1-s2', labelArabic: 'جدولة الرسوم', labelEnglish: 'Fees Scheduling', status: 'connected', assignedRole: 'المحاسبة المالي' },
        { id: 'wf1-s3', labelArabic: 'التحصيل والقبض', labelEnglish: 'Collection & Cashier', status: 'connected', assignedRole: 'أمين الصندوق' },
        { id: 'wf1-s4', labelArabic: 'قيد اليومية آلي', labelEnglish: 'Automated Journal Entry', status: 'connected', assignedRole: 'نظام آلي' },
        { id: 'wf1-s5', labelArabic: 'ترحيل الأستاذ العام', labelEnglish: 'General Ledger Posting', status: 'connected', assignedRole: 'رئيس الحسابات' }
      ],
      anomalies: [
        {
          id: 'wf1-an1',
          type: 'partial_transaction',
          labelArabic: 'ترحيل جزئي للمتحصلات دون تصفية الضرائب',
          labelEnglish: 'Partial transaction on VAT mapping',
          descriptionArabic: 'المخاطرة: وجود قيود مقبوضات لرسوم الحافلات دون ترحيل قيد ضريبة القيمة المضافة المقابل فورياً.',
          descriptionEnglish: 'Risk: Receipt entries posted without corresponding VAT accounts validation.',
          isSolved: true,
          severity: 'warning'
        },
        {
          id: 'wf1-an2',
          type: 'hidden_dependency',
          labelArabic: 'اعتماد الملف المالي يتطلب تصفية العهد اليدوية',
          labelEnglish: 'Hidden dependency on physical clearance',
          descriptionArabic: 'المخاطرة: حظر ترحيل السجل الأكاديمي معلق بالكامل على تسليم العهد العينية يدوياً دون رابط آلي.',
          descriptionEnglish: 'Risk: Dynamic blocks on academic files depend on physical inventory returns without digital messaging.',
          isSolved: true,
          severity: 'warning'
        }
      ],
      statesList: [
        { name: 'DRAFT', labelArabic: 'مسودة القبول', labelEnglish: 'Student Draft', assignedRole: 'شؤون الطلاب', validationRule: 'اكتمال المستندات الثبوتية والموافقة الأولية', rollbackRule: 'حذف مسودة القيد وإلغاء حجز المعقد الدراسي', businessConstraint: 'الحد الأدنى لسن القبول والمقاعد الشاغرة للفصل الدراسي' },
        { name: 'REGISTERED', labelArabic: 'مسجل ومعتمد أكاديمياً', labelEnglish: 'Academic Registered', assignedRole: 'المسجل', validationRule: 'توثيق البيانات الأكاديمية والمسار التعليمي', rollbackRule: 'سحب السجل الأكاديمي ووضع الملف في حالة تجميد مؤقت', businessConstraint: 'تطابق تخصص الطالب مع متطلبات الخطة المنهجية المدرسية' },
        { name: 'FEE_SCHEDULED', labelArabic: 'مجدول الرسوم ماليّاً', labelEnglish: 'Fees Scheduled', assignedRole: 'المحاسبة المالي', validationRule: 'تطبيق الرسوم الأساسية وحساب نسب الخصومات والأشقاء', rollbackRule: 'تصفير الذمة المالية وإلغاء جداول الأقساط والمطالبات المؤقتة', businessConstraint: 'تكامل خصومات المدرسة مع قواعد الامتثال المالي المؤسسي' },
        { name: 'PAID', labelArabic: 'تم التحصيل والقبض', labelEnglish: 'Collection Completed', assignedRole: 'أمين الصندوق', validationRule: 'إصدار سند قبض آلي متطابق مع قيمة القسط المستحق', rollbackRule: 'إلغاء السند المالي، إرجاع المبلغ المسجل وتنشيط المديونية', businessConstraint: 'لا يمكن تجزئة الدفع إلا بموافقة المدير المالي الموثقة إلكترونياً' },
        { name: 'POSTED', labelArabic: 'مرحل للأستاذ العام', labelEnglish: 'Journal Posted to GL', assignedRole: 'رئيس الحسابات', validationRule: 'اتزان القيد المحاسبي المزدوج (Debit = Credit) بنسبة 100%', rollbackRule: 'توليد قيد تسوية عكسي آلي وتسجيل الحدث في حوكمة السجلات المفتوحة', businessConstraint: 'يجب أن تظل كافة القيود متزنة ولا يسمح بالترحيل اليدوي للأستاذ العام' }
      ],
      allowedTransitions: {
        'DRAFT': ['REGISTERED'],
        'REGISTERED': ['FEE_SCHEDULED'],
        'FEE_SCHEDULED': ['PAID'],
        'PAID': ['POSTED'],
        'POSTED': []
      }
    },
    {
      id: 'wf_accounting_cycle',
      titleArabic: 'الدورة المحاسبية الكاملة والتقارير المالية الختامية',
      titleEnglish: 'Full Accounting Cycle & Financial Statements Loop',
      description: 'مسار معالجة العمليات المالية والمحاسبية بدءاً من المعاملات التجارية وتدوين القيود وترحيلها لدفتر الأستاذ العام وميزان المراجعة وحتى إصدار التقارير الختامية بضمان السلامة التامة.',
      currentState: 'TRANSACTION_RECORDED',
      isCertified: true,
      steps: [
        { id: 'wf2-s1', labelArabic: 'المعاملة المالية', labelEnglish: 'Business Transaction', status: 'connected', assignedRole: 'القسم التشغيلي / المحاسب' },
        { id: 'wf2-s2', labelArabic: 'قيد اليومية', labelEnglish: 'Journal Entry', status: 'connected', assignedRole: 'نظام آلي' },
        { id: 'wf2-s3', labelArabic: 'الترحيل الكلي', labelEnglish: 'Posting Ledger', status: 'connected', assignedRole: 'نظام آلي' },
        { id: 'wf2-s4', labelArabic: 'ميزان المراجعة', labelEnglish: 'Trial Balance', status: 'connected', assignedRole: 'رئيس Hلحسابات' },
        { id: 'wf2-s5', labelArabic: 'التقارير الختامية', labelEnglish: 'Financial Statements', status: 'connected', assignedRole: 'الإدارة والمدقق المالي' }
      ],
      anomalies: [
        {
          id: 'wf2-an1',
          type: 'unrecoverable_failure',
          labelArabic: 'فشل ترحيل قيد إطفاء الأصول الثنائية',
          labelEnglish: 'Unrecoverable asset depreciation failure',
          descriptionArabic: 'المخاطرة: تعطل حسابات ترحيل إهلاك الموجودات السنوي دون وجود ممر استرجاع محاسبي مالي مرن.',
          descriptionEnglish: 'Risk: Automatic depreciation triggers crash silently on ledger locks without fallback execution routes.',
          isSolved: true,
          severity: 'critical'
        }
      ],
      statesList: [
        { name: 'TRANSACTION_RECORDED', labelArabic: 'معاملة مالية مسجلة', labelEnglish: 'Transaction Recorded', assignedRole: 'المحاسب المالي', validationRule: 'وجود مستندات ومرفقات إثبات قانونية مطابقة', rollbackRule: 'إلغاء المعاملة المسجلة ووسم المستند كملغى لأغراض التدقيق', businessConstraint: 'تطابق الموردين والجهات مع قوائم الحوكمة والموردين المعتمدين' },
        { name: 'JOURNAL_CREATED', labelArabic: 'قيد يومية مزدوج', labelEnglish: 'Journal Created', assignedRole: 'نظام آلي', validationRule: 'تساوي الدائن والمدين وتوزيع الحسابات الصحيح', rollbackRule: 'تصفير مسودة القيد وإلغاء رقم التسلسل المرتبط بها', businessConstraint: 'أن تكون الفترة المحاسبية مفتوحة وغير مقفلة بموجب قرار المدير المالي' },
        { name: 'LEDGER_POSTED', labelArabic: 'مرحل لدفتر الأستاذ', labelEnglish: 'Posted to Ledger', assignedRole: 'رئيس الحسابات', validationRule: 'التحقق من صحة ترصيد الحسابات ومراكز التكلفة المحددة', rollbackRule: 'إلغاء الترحيل وإعادة المعاملة لخانة القيود قيد المراجعة', businessConstraint: 'مطابقة قيود النطاقات المدرسية مع مراكز الكلفة التشغيلية المحددة' },
        { name: 'TRIAL_BALANCE_VERIFIED', labelArabic: 'ميزان مراجعة متزن ومصادق', labelEnglish: 'Trial Balance Verified', assignedRole: 'رئيس الحسابات', validationRule: 'تطابق أرصدة الأستاذ بالكامل مع مخرجات الميزان اليومي', rollbackRule: 'إرسال تنبيه آلي بوجود فارق، إيقاف الترحيل وعقد جلسة تدقيق', businessConstraint: 'يمنع إصدار أي قوائم مالية دون تصفير فروق ميزان المراجعة تماماً' },
        { name: 'STATEMENTS_GENERATED', labelArabic: 'تقارير مالية ختامية منتجة', labelEnglish: 'Financial Statements Ready', assignedRole: 'المدير المالي والمدقق', validationRule: 'اعتماد مجلس الإدارة والمطابقة القانونية لبيانات الدخل والميزانية', rollbackRule: 'تأصيل إشعار تعديل تاريخي وسم القائمة كقيد المراجعة الختامية', businessConstraint: 'توافق الصياغة والقوالب تماماً مع المعايير الدولية للتقارير المالية (IFRS)' }
      ],
      allowedTransitions: {
        'TRANSACTION_RECORDED': ['JOURNAL_CREATED'],
        'JOURNAL_CREATED': ['LEDGER_POSTED'],
        'LEDGER_POSTED': ['TRIAL_BALANCE_VERIFIED'],
        'TRIAL_BALANCE_VERIFIED': ['STATEMENTS_GENERATED'],
        'STATEMENTS_GENERATED': []
      }
    },
    {
      id: 'wf_payroll',
      titleArabic: 'دورة الموارد البشرية والرواتب والترحيل المالي للأستاذ العام',
      titleEnglish: 'Employee Payroll & General Ledger Integration Loop',
      description: 'دورة التدفق المالي للموارد البشرية التي تبدأ بملف الموظف، التوظيف، احتساب الرواتب والاعتماد، ثم ترحيل قيد اليومية للأستاذ العام ومصادقة البنك ومكافآت الأمن الاجتماعي.',
      currentState: 'EMPLOYEE_VERIFIED',
      isCertified: true,
      steps: [
        { id: 'wf3-s1', labelArabic: 'بيانات الموظف', labelEnglish: 'Employee Profile', status: 'connected', assignedRole: 'الموارد البشرية' },
        { id: 'wf3-s2', labelArabic: 'مسيرات الرواتب', labelEnglish: 'Payroll Calculation', status: 'connected', assignedRole: 'مسؤول الرواتب' },
        { id: 'wf3-s3', labelArabic: 'الاعتماد المالي والضمان', labelEnglish: 'Financial Approval', status: 'connected', assignedRole: 'المدير المالي' },
        { id: 'wf3-s4', labelArabic: 'قيد اليومية التلقائي', labelEnglish: 'Automated Payroll Entry', status: 'connected', assignedRole: 'نظام آلي' },
        { id: 'wf3-s5', labelArabic: 'مصادقة ملف WPS البنكي', labelEnglish: 'WPS Bank Dispatch', status: 'connected', assignedRole: 'نظام آلي / رئيس الحسابات' }
      ],
      anomalies: [
        {
          id: 'wf3-an1',
          type: 'broken_transition',
          labelArabic: 'انتقال مكسور: ترحيل قيود الرواتب دون مصادقة ملف البنك',
          labelEnglish: 'Broken bank verification transition',
          descriptionArabic: 'المخاطرة: تحويل رواتب المعلمين والموظفين محاسبياً دون فحص ومصادقة بنكية لملف حماية الأجور (WPS) آلياً.',
          descriptionEnglish: 'Risk: Payroll accounting entries created before electronic Wages Protection System verification receipt.',
          isSolved: true,
          severity: 'critical'
        }
      ],
      statesList: [
        { name: 'EMPLOYEE_VERIFIED', labelArabic: 'سجل موظف معتمد ومطابق', labelEnglish: 'Employee Record Verified', assignedRole: 'الموارد البشرية', validationRule: 'اكتمال الوثائق الرسمية، رخصة العمل، وتوثيق التأمينات الاجتماعية', rollbackRule: 'تعليق نشاط الموظف بالبوابة وتأصيل تجميد التعويضات والمستحقات', businessConstraint: 'تطابق الحساب البنكي الرسمي الـ IBAN مع معايير البنك المركزي' },
        { name: 'PAYROLL_CALCULATED', labelArabic: 'مسير رواتب شهري محتسب', labelEnglish: 'Payroll Calculated', assignedRole: 'مسؤول الرواتب', validationRule: 'مطابقة ساعات العمل والغيابات والاستقطاعات آلياً وحساب الضرائب', rollbackRule: 'تصفير الحسابات المؤقتة وإرجاع مسودة الرواتب للمراجعة التشغيلية', businessConstraint: 'حظر تعديل الرواتب الأساسية في مسودة المسير المالي دون قرار مجلس الإدارة' },
        { name: 'EXECUTIVE_APPROVED', labelArabic: 'اعتماد الرواتب والميزانية', labelEnglish: 'Executive Approved', assignedRole: 'المدير المالي', validationRule: 'تطابق الميزانية الكلية للرواتب مع مخصصات الربع السنوي المقررة', rollbackRule: 'سحب الاعتماد وإرسال التنبيه الفوري لغرفة العمليات والحسابات للضبط', businessConstraint: 'توقيع إلكتروني ثنائي للمدير المالي والتنفيذي لاعتماد مسير المؤسسة' },
        { name: 'JOURNAL_AUTO_GENERATED', labelArabic: 'قيد رواتب آلي متزن', labelEnglish: 'Journal Generated', assignedRole: 'نظام آلي', validationRule: 'مطابقة قيد الرواتب والأجور المستحقة والالتزامات التأمينية بالملف', rollbackRule: 'إلغاء وحذف القيد المولد ووضع علامة "محظور الترحيل" حتى التصحيح', businessConstraint: 'تصفية وتحديد حصة التأمينات الاجتماعية والتقاعد تلقائياً وربطها بالضمان' },
        { name: 'BANK_WPS_SENT', labelArabic: 'ملف WPS البنكي معتمد', labelEnglish: 'Bank WPS Approved', assignedRole: 'رئيس الحسابات', validationRule: 'تلقي إشعار تشفير وإرسال ناجح لملف حماية الأجور من بوابة البنك المباشرة', rollbackRule: 'إرسال بروتوكول حظر فوري للبنك لمنع الصرف وعزل الملف المالي المستهدف', businessConstraint: 'وجوب إرسال ومصادقة البنك قبل 5 أيام عمل كحد أقصى من نهاية الشهر الميلادي' }
      ],
      allowedTransitions: {
        'EMPLOYEE_VERIFIED': ['PAYROLL_CALCULATED'],
        'PAYROLL_CALCULATED': ['EXECUTIVE_APPROVED'],
        'EXECUTIVE_APPROVED': ['JOURNAL_AUTO_GENERATED'],
        'JOURNAL_AUTO_GENERATED': ['BANK_WPS_SENT'],
        'BANK_WPS_SENT': []
      }
    },
    {
      id: 'wf_academic',
      titleArabic: 'الدورة الأكاديمية وكنترول الامتحانات والشهادات',
      titleEnglish: 'Academic Registry, Examinations & Grading Flow',
      description: 'دورة التحكم الأكاديمي الشاملة للطلاب، بدءاً من السجل الدراسي ومروراً بالامتحانات وتوزيع اللجان ورصد الدرجات والشهادات.',
      currentState: 'STUDENT_ENROLLED',
      isCertified: false,
      steps: [
        { id: 'wf4-s1', labelArabic: 'الطلاب والقبول', labelEnglish: 'Student Enrollment', status: 'connected', assignedRole: 'شؤون الطلاب' },
        { id: 'wf4-s2', labelArabic: 'تسكين الفصول والمواد', labelEnglish: 'Subjects Mapping', status: 'connected', assignedRole: 'المشرف الأكاديمي' },
        { id: 'wf4-s3', labelArabic: 'جدولة قاعات الامتحانات', labelEnglish: 'Exam Scheduled', status: 'connected', assignedRole: 'لجنة الامتحانات' },
        { id: 'wf4-s4', labelArabic: 'رصد الدرجات التفصيلي', labelEnglish: 'Marks Entry Control', status: 'interrupted', interruptionReason: 'ثغرة ربط (Orphan Operation): يقوم الكنترول بنسخ الدرجات يدوياً إلى ملفات إكسل خارجية لإعادة فحصها قبل ترحيل الشهادة النهائي لغياب التدقيق الآلي المزدوج.', assignedRole: 'الكنترول الأكاديمي' },
        { id: 'wf4-s5', labelArabic: 'ترحيل النتائج والشهادة', labelEnglish: 'Graduation & Certificates', status: 'connected', assignedRole: 'مدير المدرسة / نظام آلي' }
      ],
      anomalies: [
        {
          id: 'wf4-an1',
          type: 'duplicate_step',
          labelArabic: 'تكرار فحص وتدقيق الدرجات يدوياً بملفات خارجية',
          labelEnglish: 'Duplicate manual grade audit',
          descriptionArabic: 'المخاطرة: فحص درجات الطلاب مرتين، الأولى داخل السجل الأكاديمي، والثانية عبر إكسل خارجي يدوياً بسبب عدم وجود تدقيق آلي متصل.',
          descriptionEnglish: 'Risk: Checking grades twice (inside ERP and via manual spreadsheet exports) due to lack of trusted blind-double audits.',
          isSolved: false,
          severity: 'warning'
        },
        {
          id: 'wf4-an2',
          type: 'unvalidated_transition',
          labelArabic: 'ترفيع الطلاب التلقائي دون مراجعة الكنترول الأكاديمي',
          labelEnglish: 'Unvalidated student promotion transition',
          descriptionArabic: 'المخاطرة: انتقال الطلاب المباشر للمرحلة الدراسية التالية دون التحقق التلقائي والنهائي لقرار لجنة الكنترول.',
          descriptionEnglish: 'Risk: Dynamic triggers promote student classes automatically before the Academic Control board sign-off.',
          isSolved: false,
          severity: 'critical'
        },
        {
          id: 'wf4-an3',
          type: 'orphan_operation',
          labelArabic: 'تحديث حضور الطالب المنفصل عن السجل العام الفوري',
          labelEnglish: 'Orphan attendance update operation',
          descriptionArabic: 'المخاطرة: رصد غياب الطالب في ممر الحصص دون تحديث ومزامنة سجل الحرمان والإنذارات النهائي في لوحة القيادة بصورة فورية.',
          descriptionEnglish: 'Risk: Daily attendance updates isolated from the central academic warning engine causing compliance data lag.',
          isSolved: false,
          severity: 'warning'
        }
      ],
      statesList: [
        { name: 'STUDENT_ENROLLED', labelArabic: 'طالب مقيد ومنتظم بالصفوف', labelEnglish: 'Student Enrolled', assignedRole: 'شؤون الطلاب', validationRule: 'تأصيل وتفعيل الحساب الرقمي الموحد وسداد القسط المبدئي للرسوم', rollbackRule: 'سحب القبول وإرجاع الطالب لحالة طالب مؤجل أو ملغى القيد', businessConstraint: 'تطابق الطاقة الاستيعابية للفصول المحددة مع معايير وزارة التعليم' },
        { name: 'SUBJECTS_MAPPED', labelArabic: 'الفصول والمناهج مسكنة', labelEnglish: 'Subjects Mapped', assignedRole: 'المشرف الأكاديمي', validationRule: 'تسكين كافة الطلاب بالخطة الدراسية وتعيين المعلم الموجه والجدول الموحد', rollbackRule: 'إلغاء التسكين وإعادة الجداول الدراسية لحالة مسودة التعديل الشامل', businessConstraint: 'تطابق عدد الساعات الممنوحة للمنهج مع متطلبات الساعات الأكاديمية الرسمية' },
        { name: 'EXAM_SCHEDULED', labelArabic: 'امتحانات مجدولة ولجان مهيئة', labelEnglish: 'Exam Scheduled', assignedRole: 'لجنة الامتحانات', validationRule: 'جدولة غرف الامتحانات، توزيع أرقام الجلوس، ومصادقة منع التعارضات', rollbackRule: 'تجميد الجدول الأكاديمي للجان وإرسال إشعار تعديل تاريخي للمعلمين والطلاب', businessConstraint: 'منع وجود أكثر من امتحان للطالب الواحد في نفس الفترة اليومية' },
        { name: 'MARKS_RECORDED', labelArabic: 'درجات مرصودة بكنترول مزدوج', labelEnglish: 'Marks Recorded', assignedRole: 'الكنترول الأكاديمي', validationRule: 'إدخال الدرجات آلياً عبر نظام التدقيق الأعمى المزدوج ومصادقة الرؤساء', rollbackRule: 'تصفير الدرجات المرصودة وإعادة الامتحانات لوضع "قيد التصحيح والتدقيق"', businessConstraint: 'تطابق الدرجات الإجمالية مع القيمة القصوى والدنيا لمجموع المادة التعليمية' },
        { name: 'RESULTS_VERIFIED', labelArabic: 'نتائج مصادق عليها نهائياً', labelEnglish: 'Results Verified', assignedRole: 'مدير المدرسة', validationRule: 'مراجعة نسب النجاح الكلية واعتماد لجنة الكنترول الأكاديمي الأعلى للمدرسة', rollbackRule: 'سحب المصادقة وتحويل الدورة الأكاديمية لحالة التدقيق ومراجعة الفروقات', businessConstraint: 'اعتماد وموافقة الأكاديمية العليا للمجموعة قبل ترحيل الشهادة النهائية' },
        { name: 'CERTIFICATE_ISSUED', labelArabic: 'شهادات معتمدة وموقعة رقمياً', labelEnglish: 'Certificates Issued', assignedRole: 'نظام آلي', validationRule: 'توليد كود التشفير الموحد للشهادة والربط الرقمي مع بوابة الوزارة الوطنية', rollbackRule: 'إلغاء ووسم الشهادة كمستند باطل وتعميم الإشعار على خوادم التحقق المشترك', businessConstraint: 'لا تصدر الشهادة إلا للطلاب الذين أكملوا متطلبات النجاح وسددوا كافة المستحقات المالية' }
      ],
      allowedTransitions: {
        'STUDENT_ENROLLED': ['SUBJECTS_MAPPED'],
        'SUBJECTS_MAPPED': ['EXAM_SCHEDULED'],
        'EXAM_SCHEDULED': ['MARKS_RECORDED'],
        'MARKS_RECORDED': ['RESULTS_VERIFIED'],
        'RESULTS_VERIFIED': ['CERTIFICATE_ISSUED'],
        'CERTIFICATE_ISSUED': []
      }
    },
    {
      id: 'wf_setup',
      titleArabic: 'دورة التجهيز والتشغيل اليومي للمدرسة',
      titleEnglish: 'School Core Setup & Daily Operations Cycle',
      description: 'مسار التجهيز الإداري والتنظيمي والتشغيل اليومي للبيئة المدرسية بدءاً من إعداد المنشأة وتوزيع الفصول والطلاب والعمليات اليومية الحية.',
      currentState: 'BUILDING_PREPARED',
      isCertified: false,
      steps: [
        { id: 'wf5-s1', labelArabic: 'إعداد وتجهيز المنشأة', labelEnglish: 'School & Building Setup', status: 'connected', assignedRole: 'مدير النظام' },
        { id: 'wf5-s2', labelArabic: 'العام الدراسي والفترات', labelEnglish: 'Academic Year Definition', status: 'connected', assignedRole: 'مدير النظام' },
        { id: 'wf5-s3', labelArabic: 'توزيع فصول الطلاب', labelEnglish: 'Students Placement', status: 'interrupted', interruptionReason: 'ثغرة ربط (Missing Step): يحتاج المستخدم لإفراغ بيانات توزيع الفصول وتعبئتها عبر نماذج ورقية خارجية لغياب بروتوكول فلترة وتوزيع الطلاب التلقائي المعتمد.', assignedRole: 'شؤون الطلاب' },
        { id: 'wf5-s4', labelArabic: 'التشغيل والحضور اليومي', labelEnglish: 'Daily Operations & Attendance', status: 'connected', assignedRole: 'الكادر التعليمي والإداري' }
      ],
      anomalies: [
        {
          id: 'wf5-an1',
          type: 'missing_step',
          labelArabic: 'غياب بروتوكول ترحيل بيانات الفصول المعتمد آلياً',
          labelEnglish: 'Missing automated class transition step',
          descriptionArabic: 'المخاطرة: استخدام النماذج الورقية لنقل الطلاب بين الشعب بدلاً من إجراء انتقال رقمي مدقق يمنع الاكتظاظ والتكرار.',
          descriptionEnglish: 'Risk: Absence of secure state-change step to distribute students over classes causing manual spreadsheet bypass.',
          isSolved: false,
          severity: 'critical'
        },
        {
          id: 'wf5-an2',
          type: 'circular_workflow',
          labelArabic: 'مسار دائري مفرغ في توزيع حصص الاحتياط',
          labelEnglish: 'Circular loop in substitute teacher allocation',
          descriptionArabic: 'المخاطرة: تداخل حلقات توزيع حصص الانتظار مما يؤدي لتعيين المعلم الواحد في لجنتين أو حصتين احتياط متزامنتين دون كسر للحلقة.',
          descriptionEnglish: 'Risk: Circular dependency chains assign substitute teachers to simultaneous classes without conflict resolution blocks.',
          isSolved: false,
          severity: 'warning'
        }
      ],
      statesList: [
        { name: 'BUILDING_PREPARED', labelArabic: 'المنشأة والفصول مهيأة', labelEnglish: 'School Prepared', assignedRole: 'مدير النظام', validationRule: 'فحص سلامة الفصول ومطابقتها للمعايير البيئية والصحية واللوجستية للمدرسة', rollbackRule: 'إغلاق المنشأة ووسم الفصول غير النشطة لتعليق العمل والعمليات التشغيلية بها', businessConstraint: 'تطابق عدد مخارج الطوارئ ومقاييس السلامة مع الدفاع المدني الكلي' },
        { name: 'YEAR_DEFINED', labelArabic: 'العام الدراسي والتقويم مفعل', labelEnglish: 'Academic Year Set', assignedRole: 'مدير النظام', validationRule: 'اعتماد تقويم الإجازات الرسمية وتوزيع الحصص الدراسية الأسبوعية', rollbackRule: 'إرجاع التقويم لوضع المسودة وتعليق التسجيل وحجز الفصول الأكاديمية المحددة', businessConstraint: 'يجب ألا يقل العام الدراسي الإجمالي عن 180 يوم عمل أكاديمي معتمد' },
        { name: 'CLASSES_CREATED', labelArabic: 'توزيع الشعب والطلاب', labelEnglish: 'Classes Created & Assigned', assignedRole: 'المشرف الأكاديمي', validationRule: 'اعتماد الفلاتر الرقمية الذكية لتوزيع الفروق وتطابق المعايير الأكاديمية للطلاب', rollbackRule: 'تفريغ الفصول وإعادة توزيع الطلاب لوضع الانتظار وإصدار التقارير للمشرفين', businessConstraint: 'ألا يتجاوز عدد الطلاب في الفصل الدراسي الواحد 25 طالباً كحد أقصى' },
        { name: 'DAILY_OPERATIONS_LIVE', labelArabic: 'التشغيل والحضور الحي', labelEnglish: 'Daily Operations Active', assignedRole: 'فريق الإدارة والمدرسين', validationRule: 'تسجيل الحضور الصباحي الفوري للطلاب والموظفين عبر الحساس الرقمي المتكامل', rollbackRule: 'تجميد العمليات اليومية للتشغيل ووضع المدرسة في حالة تشغيل عن بعد اضطراري', businessConstraint: 'إرسال إشعارات فورية لأولياء الأمور بالغياب والتأخير قبل الساعة 9:00 صباحاً' }
      ],
      allowedTransitions: {
        'BUILDING_PREPARED': ['YEAR_DEFINED'],
        'YEAR_DEFINED': ['CLASSES_CREATED'],
        'CLASSES_CREATED': ['DAILY_OPERATIONS_LIVE'],
        'DAILY_OPERATIONS_LIVE': []
      }
    },
    {
      id: 'wf_decision_making',
      titleArabic: 'دورة اتخاذ القرار الإداري والتقارير التنفيذية الذكية',
      titleEnglish: 'Executive Analytics & Management Decision-Making Loop',
      description: 'مسار حوكمة البيانات والتحليلات الراقية من البيانات التشغيلية وتطبيق قواعد العمل والتقارير المجمعة ولوحات المعلومات الذكية لدعم القرارات الاستراتيجية للمدرسة.',
      currentState: 'DATA_AGGREGATED',
      isCertified: true,
      steps: [
        { id: 'wf6-s1', labelArabic: 'تجميع البيانات', labelEnglish: 'Operational Data Aggregation', status: 'connected', assignedRole: 'مدير النظام / الأقسام' },
        { id: 'wf6-s2', labelArabic: 'تطبيق قواعد العمل', labelEnglish: 'Business Rules Evaluation', status: 'connected', assignedRole: 'مسؤول الامتثال والحوكمة' },
        { id: 'wf6-s3', labelArabic: 'التقارير التنفيذية المجمعة', labelEnglish: 'Aggregated Analytics', status: 'connected', assignedRole: 'محلل البيانات' },
        { id: 'wf6-s4', labelArabic: 'القرارات الإستراتيجية', labelEnglish: 'Executive Decision Dispatch', status: 'connected', assignedRole: 'مجلس الإدارة' }
      ],
      anomalies: [
        {
          id: 'wf6-an1',
          type: 'duplicate_step',
          labelArabic: 'تكرار توقيع قرارات الميزانية ورقياً وإلكترونياً',
          labelEnglish: 'Duplicate digital and manual signoffs',
          descriptionArabic: 'المخاطرة: إلزام الأعضاء بالتوقيع اليدوي والورقي على الميزانيات المعتمدة داخل لوحة القيادة المؤمنة سحابياً.',
          descriptionEnglish: 'Risk: Requiring manual signature backups for certified cryptographically signed dashboard decisions.',
          isSolved: true,
          severity: 'warning'
        }
      ],
      statesList: [
        { name: 'DATA_AGGREGATED', labelArabic: 'بيانات مجمعة وموحدة', labelEnglish: 'Data Aggregated', assignedRole: 'محلل البيانات', validationRule: 'اكتمال جمع البيانات من الحسابات والقبول والموارد والمستودعات آلياً بسلامة', rollbackRule: 'تجميد خط البيانات وإعادة تصفية مصادر التراسل البينية لعلاج أي فقد للبيانات', businessConstraint: 'تحديث وتدفق البيانات الإحصائية كل 5 دقائق كحد أقصى من قواعد البيانات' },
        { name: 'RULES_APPLIED', labelArabic: 'تطابق قواعد العمل والامتثال', labelEnglish: 'Compliance Rules Verified', assignedRole: 'مسؤول الحوكمة والامتثال', validationRule: 'فحص موازين القوى المالية والمعدلات الأكاديمية لمنع أي تجاوز للقوانين الوطنية', rollbackRule: 'رفض تقرير الامتثال وتوجيه النطاقات المعنية بإصلاح بنود المخالفة التشغيلية المكتشفة', businessConstraint: 'ألا يتعدى هامش التناقض المعياري المالي 0% والأكاديمي 0.1% لضمان الدقة الكاملة' },
        { name: 'REPORTS_GENERATED', labelArabic: 'تقارير ذكاء أعمال حية', labelEnglish: 'Executive Analytics Active', assignedRole: 'مدير النظم والمعلومات', validationRule: 'تطابق لوحات المعلومات والمؤشرات التفاعلية مع البيانات الختامية المعتمدة', rollbackRule: 'عزل لوحة القيادة المتأثرة وإرجاع العرض للنسخة الاحتياطية المصادقة السابقة', businessConstraint: 'حظر تصدير أو تعديل رسوم لوحات المعلومات التنفيذية يدوياً لضمان النزاهة' },
        { name: 'DECISION_RESOLVED', labelArabic: 'قرار إداري معتمد رقمياً', labelEnglish: 'Decision Signed Off', assignedRole: 'مجلس الإدارة والقيادة', validationRule: 'اكتمال التواقيع الرقمية المشفرة وتوافر نصاب الثقة من المدراء والشركاء', rollbackRule: 'إبطال القرار وإصدار تراجع قانوني يوزع فوراً عبر النطاقات آلياً لمنع الالتباس', businessConstraint: 'اكتمال النصاب القانوني لمجلس الإدارة بنسبة الثلثين على الأقل لتفعيل الصلاحية' }
      ],
      allowedTransitions: {
        'DATA_AGGREGATED': ['RULES_APPLIED'],
        'RULES_APPLIED': ['REPORTS_GENERATED'],
        'REPORTS_GENERATED': ['DECISION_RESOLVED'],
        'DECISION_RESOLVED': []
      }
    }
  ]);

  // Aggregate stats dynamically
  const metrics = useMemo(() => {
    let totalWorkflows = workflows.length;
    let certifiedCount = workflows.filter(w => w.isCertified).length;
    let totalAnomalies = 0;
    let resolvedAnomalies = 0;
    let totalStepsCount = 0;
    let connectedStepsCount = 0;

    workflows.forEach(wf => {
      totalAnomalies += wf.anomalies.length;
      resolvedAnomalies += wf.anomalies.filter(an => an.isSolved).length;
      totalStepsCount += wf.steps.length;
      connectedStepsCount += wf.steps.filter(s => s.status === 'connected').length;
    });

    const overallIntegrityPercent = totalStepsCount > 0 ? Math.round((connectedStepsCount / totalStepsCount) * 100) : 0;

    return {
      totalWorkflows,
      certifiedCount,
      totalAnomalies,
      resolvedAnomalies,
      unresolvedAnomalies: totalAnomalies - resolvedAnomalies,
      overallIntegrityPercent
    };
  }, [workflows]);

  // Retrieve active workflow data
  const selectedWorkflow = useMemo(() => {
    return workflows.find(w => w.id === selectedWorkflowId) || workflows[0];
  }, [workflows, selectedWorkflowId]);

  // Retrieve details of the current state of selected workflow
  const activeStateDetails = useMemo(() => {
    return selectedWorkflow.statesList.find(s => s.name === selectedWorkflow.currentState) || selectedWorkflow.statesList[0];
  }, [selectedWorkflow]);

  // Filter workflows list based on filters
  const filteredWorkflows = useMemo(() => {
    return workflows.filter(wf => {
      const matchesSearch = 
        wf.titleArabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wf.titleEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wf.description.toLowerCase().includes(searchTerm.toLowerCase());

      const hasGaps = wf.steps.some(s => s.status === 'interrupted') || wf.anomalies.some(an => !an.isSolved);
      const matchesInterrupted = !showOnlyInterrupted || hasGaps;

      return matchesSearch && matchesInterrupted;
    });
  }, [workflows, searchTerm, showOnlyInterrupted]);

  // Toggle specific step status manually (to simulate fixing individual gaps)
  const toggleStepStatus = (workflowId: string, stepId: string) => {
    setWorkflows(prev => prev.map(wf => {
      if (wf.id === workflowId) {
        const updatedSteps = wf.steps.map(step => {
          if (step.id === stepId) {
            const nextStatus = step.status === 'connected' ? 'interrupted' : 'connected';
            const nextReason = nextStatus === 'interrupted' 
              ? 'تنبيه: تم رصد انقطاع في التدفق ويتطلب تدخلاً يدوياً خارج النظام.' 
              : undefined;

            triggerNotification(
              nextStatus === 'connected'
                ? `تم إصلاح فجوة التدفق لخطوة [${step.labelArabic}] بنجاح وتأصيل الربط الآلي.`
                : `تم وسم خطوة [${step.labelArabic}] كـ فجوة خارجية وتم تعليق الاعتماد التلقائي.`,
              nextStatus === 'connected' ? 'success' : 'warning'
            );

            return {
              ...step,
              status: nextStatus,
              interruptionReason: nextReason
            };
          }
          return step;
        });

        // If any step is interrupted or any anomaly is unsolved, isCertified is false
        const hasInterruption = updatedSteps.some(s => s.status === 'interrupted');
        const hasUnsolvedAnomaly = wf.anomalies.some(an => !an.isSolved);
        const isCertified = !hasInterruption && !hasUnsolvedAnomaly;

        return {
          ...wf,
          steps: updatedSteps,
          isCertified
        };
      }
      return wf;
    }));

    // Log the manual toggle action
    const currentStep = selectedWorkflow.steps.find(s => s.id === stepId);
    if (currentStep) {
      const actionText = currentStep.status === 'connected' 
        ? `[انقطاع ممر] تم كسر الربط الآلي لخطوة (${currentStep.labelArabic}).` 
        : `[تكامل ممر] تم تفعيل التراسل الآلي الفوري وحل الثغرة لخطوة (${currentStep.labelArabic}).`;
      
      setTerminalLogs(prev => [
        `[${new Date().toLocaleTimeString('ar-SA')}] ${actionText}`,
        ...prev
      ]);
    }
  };

  // Toggle/Solve single anomaly
  const toggleAnomalyStatus = (workflowId: string, anomalyId: string) => {
    setWorkflows(prev => prev.map(wf => {
      if (wf.id === workflowId) {
        const updatedAnomalies = wf.anomalies.map(an => {
          if (an.id === anomalyId) {
            const nextSolved = !an.isSolved;
            triggerNotification(
              nextSolved 
                ? `تم معالجة وتصحيح العيب الهيكلي [${an.labelArabic}] بنجاح وفق موازين Directive #016.`
                : `تم إعادة تفعيل الأثر المعيب لـ [${an.labelArabic}] للفحص التشخيصي المطور.`,
              nextSolved ? 'success' : 'info'
            );
            return { ...an, isSolved: nextSolved };
          }
          return an;
        });

        const hasInterruption = wf.steps.some(s => s.status === 'interrupted');
        const hasUnsolvedAnomaly = updatedAnomalies.some(an => !an.isSolved);
        const isCertified = !hasInterruption && !hasUnsolvedAnomaly;

        return {
          ...wf,
          anomalies: updatedAnomalies,
          isCertified
        };
      }
      return wf;
    }));

    const currentAn = selectedWorkflow.anomalies.find(an => an.id === anomalyId);
    if (currentAn) {
      const logMsg = currentAn.isSolved 
        ? `[مراجعة العيوب] تم إعادة تنشيط العيب الهيكلي: ${currentAn.labelArabic}`
        : `[معايرة هيكلية] تم تطهير وسد العيب الهيكلي: ${currentAn.labelArabic} [تم الإصلاح ✓]`;
      
      setTerminalLogs(prev => [
        `[${new Date().toLocaleTimeString('ar-SA')}] ${logMsg}`,
        ...prev
      ]);
    }
  };

  // Automated Safe Repair for ALL inconsistencies & anomalies (1-Click Compliance)
  const handleComprehensiveAutoRepair = () => {
    setTerminalLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] ⚙️ بدء بروتوكول المعايرة الشامل للمسارات وتصفير العيوب الهيكلية...`,
      `[${new Date().toLocaleTimeString('ar-SA')}] 🔎 فحص ممرات التدفق الأكاديمي، المالي، الرواتب، والتشغيل...`,
      ...prev
    ]);

    setTimeout(() => {
      setWorkflows(prev => prev.map(wf => {
        const repairedSteps = wf.steps.map(s => ({
          ...s,
          status: 'connected' as const,
          interruptionReason: undefined
        }));
        const repairedAnomalies = wf.anomalies.map(an => ({
          ...an,
          isSolved: true
        }));

        return {
          ...wf,
          steps: repairedSteps,
          anomalies: repairedAnomalies,
          isCertified: true
        };
      }));

      setTerminalLogs(prev => [
        `[${new Date().toLocaleTimeString('ar-SA')}] ✓ تم عزل وحل فجوة الكنترول الأكاديمي: تم تفعيل التدقيق الأعمى المزدوج التلقائي بنجاح.`,
        `[${new Date().toLocaleTimeString('ar-SA')}] ✓ تم تصحيح ممر ترحيل فصول الطلاب: تفعيل معايير التوزيع الرقمية ومنع الاكتظاظ التكراري.`,
        `[${new Date().toLocaleTimeString('ar-SA')}] ✓ تم تطهير كافة العيوب الهيكلية الـ 9 المسجلة وفق ميزان TRANSFORMATION DIRECTIVE #016.`,
        `[${new Date().toLocaleTimeString('ar-SA')}] 🏆 كافة مسارات العمل نشطة ومتكاملة بنسبة 100%، وتم حظر الخطوات الخارجية واليدوية تماماً.`,
        ...prev
      ]);

      triggerNotification('تهانينا! تم تفعيل بروتوكول عدم انقطاع البيانات الشامل وسد كافة الثغرات والعيوب الهيكلية بامتثال 100%!', 'success');
    }, 1500);
  };

  // Trigger Deterministic State Machine Transition
  const handleStateTransition = (nextStateName: string) => {
    if (isSimulatingTransition || isRollbackRunning) return;

    // Check if transition is allowed
    const isAllowed = selectedWorkflow.allowedTransitions[selectedWorkflow.currentState]?.includes(nextStateName);
    if (!isAllowed) {
      triggerNotification('خطأ: محاولة انتقال غير مدققة! تم رفض الحركة تلقائياً لمنع التداخلات والفساد الهيكلي.', 'danger');
      setTerminalLogs(prev => [
        `[${new Date().toLocaleTimeString('ar-SA')}] ❌ [رفض انتقال] انتقال غير مسموح به من (${selectedWorkflow.currentState}) إلى (${nextStateName}) تم حظره آلياً لخرق قواعد الحوكمة.`,
        ...prev
      ]);
      return;
    }

    // Verify if there are active anomalies or interrupted steps in the workflow
    const hasUnresolvedGaps = selectedWorkflow.steps.some(s => s.status === 'interrupted') || selectedWorkflow.anomalies.some(an => !an.isSolved);
    if (hasUnresolvedGaps && (nextStateName === 'POSTED' || nextStateName === 'STATEMENTS_GENERATED' || nextStateName === 'BANK_WPS_SENT' || nextStateName === 'CERTIFICATE_ISSUED' || nextStateName === 'DAILY_OPERATIONS_LIVE' || nextStateName === 'DECISION_RESOLVED')) {
      triggerNotification('خطأ: لا يمكن ترحيل الحالة النهائية في مسار يحتوي على ثغرات أو فجوات معلقة!', 'danger');
      setTerminalLogs(prev => [
        `[${new Date().toLocaleTimeString('ar-SA')}] ❌ [حظر الترحيل النهائي] تم حجز قفل الحالة (${nextStateName}) لوجود عيوب هيكلية أو خطوات تشغيل يدوية خارجية غير معالجة بالمسار الحالي.`,
        ...prev
      ]);
      return;
    }

    setIsSimulatingTransition(true);
    const nextStateDetails = selectedWorkflow.statesList.find(s => s.name === nextStateName);

    setTerminalLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] 🌀 بدء معالجة انتقال الحالة: [${selectedWorkflow.currentState}] ← [${nextStateName}]...`,
      `[${new Date().toLocaleTimeString('ar-SA')}] 🛡️ فحص الامتثال والصلاحية: المعتمد الحالي [${nextStateDetails?.assignedRole || 'نظام آلي'}]...`,
      `[${new Date().toLocaleTimeString('ar-SA')}] ⚖️ فحص محددات الأعمال: [${nextStateDetails?.businessConstraint || 'بدون قيود'}]...`,
      ...prev
    ]);

    setTimeout(() => {
      setWorkflows(prev => prev.map(wf => {
        if (wf.id === selectedWorkflowId) {
          return {
            ...wf,
            currentState: nextStateName
          };
        }
        return wf;
      }));

      setIsSimulatingTransition(false);
      triggerNotification(`تم الانتقال بنجاح إلى حالة [${nextStateDetails?.labelArabic || nextStateName}] وتم توثيق الحدث.`, 'success');
      
      setTerminalLogs(prev => [
        `[${new Date().toLocaleTimeString('ar-SA')}] ✓ [نجاح المعالجة] تم تغيير الحالة بنجاح إلى (${nextStateName}).`,
        `[${new Date().toLocaleTimeString('ar-SA')}] 🔔 [إشعار آلي] تم إرسال تنبيه فوري إلى مكاتب [${nextStateDetails?.assignedRole}] للمتابعة السحابية الحية.`,
        `[${new Date().toLocaleTimeString('ar-SA')}] 📝 [حدث رقابي] تم تسجيل Event ID [EVT_${Math.floor(Math.random() * 900000 + 100000)}] بنجاح في قاعدة البيانات المشفرة.`,
        ...prev
      ]);
    }, 1000);
  };

  // Simulate Step-by-Step Failure and Cascading Rollback
  const handleSimulateFailureAndRollback = () => {
    if (isSimulatingTransition || isRollbackRunning) return;
    if (selectedWorkflow.currentState === 'DRAFT' || selectedWorkflow.currentState === 'TRANSACTION_RECORDED' || selectedWorkflow.currentState === 'EMPLOYEE_VERIFIED' || selectedWorkflow.currentState === 'STUDENT_ENROLLED' || selectedWorkflow.currentState === 'BUILDING_PREPARED' || selectedWorkflow.currentState === 'DATA_AGGREGATED') {
      triggerNotification('المسار في حالته الابتدائية بالفعل! لا توجد حركات مسبقة للتراجع عنها.', 'warning');
      return;
    }

    setIsRollbackRunning(true);
    setTerminalLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] ⚠️ [تحذير فشل تشغيلي] تم رصد خلل طارئ في التدفق المالي/الأكاديمي للمسار!`,
      `[${new Date().toLocaleTimeString('ar-SA')}] 🛑 تفعيل بروتوكول الاسترجاع والارتداد العكسي التلقائي (Automatic Rollback Protocol)...`,
      ...prev
    ]);

    const states = selectedWorkflow.statesList.map(s => s.name);
    const currentIndex = states.indexOf(selectedWorkflow.currentState);
    
    let stepIndex = currentIndex;
    const interval = setInterval(() => {
      if (stepIndex > 0) {
        const currentStateName = states[stepIndex];
        const prevStateName = states[stepIndex - 1];
        const stateInfo = selectedWorkflow.statesList.find(s => s.name === currentStateName);

        setTerminalLogs(prev => [
          `[${new Date().toLocaleTimeString('ar-SA')}] 🔄 [استرجاع عكسي] إلغاء حالة [${stateInfo?.labelArabic}] تطبيقاً للقاعدة: [${stateInfo?.rollbackRule}]...`,
          `[${new Date().toLocaleTimeString('ar-SA')}] ↩️ التراجع الآمن إلى الحالة السابقة [${selectedWorkflow.statesList.find(s => s.name === prevStateName)?.labelArabic}]...`,
          ...prev
        ]);

        setWorkflows(prev => prev.map(wf => {
          if (wf.id === selectedWorkflowId) {
            return {
              ...wf,
              currentState: prevStateName
            };
          }
          return wf;
        }));

        stepIndex--;
      } else {
        clearInterval(interval);
        setIsRollbackRunning(false);
        triggerNotification('اكتمل التراجع العكسي التلقائي بنجاح تام! تمت إعادة مسار العمل لحالته الابتدائية الآمنة دون أي فقد في البيانات.', 'success');
        setTerminalLogs(prev => [
          `[${new Date().toLocaleTimeString('ar-SA')}] 🟢 [استقرار المسار] اكتمل بروتوكول الارتداد بنجاح. كافة جداول وحسابات المعاملة تم تسويتها وإعادتها لنقطة الصفر الآمنة.`,
          ...prev
        ]);
      }
    }, 1200);
  };

  const handlePrintReport = () => {
    triggerNotification('جاري توليد ملف التقرير الفني والطباعة...', 'info');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ workflows, metrics, date: new Date().toISOString() }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `EduPro_Workflow_Integrity_Report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification('تم تصدير ملف مخرجات الفحص بصيغة JSON بنجاح.', 'success');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl" id="workflows-certification-root">
      
      {/* DIRECTIVE 016 BANNER HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#030712] via-[#0b0f19] to-[#1e1b4b] border-2 border-violet-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl print:hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 justify-end lg:justify-start">
              <span className="bg-gradient-to-r from-violet-600 to-amber-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 shadow-sm">
                <Workflow className="w-4 h-4 text-violet-300 animate-spin" />
                الميثاق التحولي الأعلى: القرار التنفيذي رقم #016
              </span>
              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-black px-2.5 py-1 rounded-md">
                بروتوكول إعادة الهيكلة الكلية لممرات البيانات (Workflow Integrity Reconstruction)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">بوابة معايرة وهندسة تكامل مسارات العمل والآلات المحددة (Finite State Machines)</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              تماشياً مع الموجه السيادي للجودة الأعلى، <strong className="text-emerald-400">لا يعتمد أي مسار للعمليات (Workflow) إذا تضمن فجوة أو تطلب إدخالاً يدوياً خارج النظام.</strong> قمنا بإعادة صياغة كافة مسارات المنظومة الستة إلى <strong className="text-violet-400">آلات حالات محددة (Explicit State Machines) حاسمة</strong> تمنع الانتقال غير المصرح به وتدير بروتوكولات التراجع العكسي التلقائي (Rollbacks) بالكامل عند حدوث أي خلل.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-violet-500/15 border border-violet-500/30 p-4 shrink-0 min-w-[240px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-violet-300 block uppercase">معدل الامتثال لبروتوكول الحسم المعماري</span>
            <span className="text-3xl font-black text-emerald-400 mt-1 block font-mono">
              {metrics.overallIntegrityPercent}%
            </span>
            <p className="text-[10px] text-slate-300 mt-1.5 font-extrabold flex items-center gap-1 justify-center">
              <span>({metrics.certifiedCount} من أصل {metrics.totalWorkflows} مسارات مستوفية تماماً)</span>
            </p>
          </div>
        </div>
      </div>

      {/* COMPLIANCE METRICS CARD GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right shadow-xs">
          <span className="text-[10px] font-black text-slate-400 block uppercase">إجمالي مسارات العمل المعايرة</span>
          <span className="text-2xl font-black text-slate-850 dark:text-white mt-1 block font-mono">{metrics.totalWorkflows} مسارات تشغيلية</span>
          <span className="text-[9.5px] text-amber-500 font-bold block mt-1">تغطي المحاسبة والقبول والرواتب والكنترول</span>
        </div>

        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right shadow-xs">
          <span className="text-[10px] font-black text-emerald-500 block uppercase">مسارات مستوفية للاعتماد الفوري 🟢</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">{metrics.certifiedCount} مساراً</span>
          <span className="text-[9.5px] text-emerald-500 font-bold block mt-1">عزل تام وأتمتة شاملة بنسبة 100%</span>
        </div>

        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right shadow-xs">
          <span className="text-[10px] font-black text-rose-500 block uppercase">العيوب الهيكلية والفجوات النشطة</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block font-mono">
            {metrics.unresolvedAnomalies} / {metrics.totalAnomalies}
          </span>
          <span className="text-[9.5px] text-rose-500 font-bold block mt-1">عيوب مكتشفة تتطلب سداً ومعايرة فورية</span>
        </div>

        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right shadow-xs">
          <span className="text-[10px] font-black text-violet-500 block uppercase">قفل الأمان وإدارة التراجع العكسي</span>
          <span className="text-2xl font-black text-violet-600 mt-1 block font-mono">نشط ومؤمن 🛡️</span>
          <span className="text-[9.5px] text-violet-500 font-bold block mt-1">الترحيل محمي ومرتبط بقواعد حاسمة</span>
        </div>
      </div>

      {/* FILTERS & DOCK BAR */}
      <div className="dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input 
              type="text" 
              placeholder="ابحث عن مسار، خطوة ربط، أو عيب هيكلي..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-transparent dark:bg-slate-950 dark:border-slate-800 text-xs font-semibold text-right focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-extrabold cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={showOnlyInterrupted}
              onChange={(e) => setShowOnlyInterrupted(e.target.checked)}
              className="rounded  border-slate-300  dark:border-slate-800 text-amber-600  focus:ring-[#9a6a1d]  cursor-pointer"
            />
            <span>عرض المسارات التي تحتوي على ثغرات/عيوب معلقة ⚠️</span>
          </label>
        </div>

        {/* Global Action dock */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleComprehensiveAutoRepair}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer animate-pulse"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-200" />
            <span>معايرة وسد ثغرات مسارات العمل آلياً</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>إنتاج تقرير التكامل (Directive 16)</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            title="تصدير كود المعايرة والمسارات"
          >
            <Download className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* TWO COLUMN PANEL: LEFT FOR DETAILED WORKFLOW, RIGHT FOR GENERAL CHECKS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* LEFT COLUMN: ACTIVE WORKFLOW RECONSTRUCTION MAP & SIMULATOR (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Workflows Quick Grid Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {filteredWorkflows.map(wf => {
              const isSelected = wf.id === selectedWorkflowId;
              const hasGaps = wf.steps.some(s => s.status === 'interrupted') || wf.anomalies.some(an => !an.isSolved);

              return (
                <div
                  key={wf.id}
                  onClick={() => setSelectedWorkflowId(wf.id)}
                  className={`p-4 border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected 
                      ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-500 dark:border-amber-400/60 shadow-md scale-[1.01]' 
                      : 'dark:bg-slate-900 border-slate-150 dark:border-slate-800/80 hover:border-amber-300 dark:hover:border-amber-900'
                  }`}
                >
                  <div className="space-y-1 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded font-black uppercase font-mono">
                        {wf.steps.length} خطوات ربط
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${!hasGaps ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                        <span className="text-[10.5px] font-black text-slate-700 dark:text-slate-300 font-mono">
                          {!hasGaps ? '100% متكامل' : 'يحتاج معايرة'}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">{wf.titleArabic}</h4>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed line-clamp-2">{wf.description}</p>
                  </div>

                  <div className={`px-2.5 py-1.5 text-[9px] font-black flex items-center justify-between border ${
                    !hasGaps 
                      ? 'text-emerald-600 dark:text-emerald-400 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20' 
                      : 'text-rose-600 dark:text-rose-400 border-rose-200 bg-rose-50 dark:bg-rose-950/20'
                  }`}>
                    <span>حالة الاعتماد:</span>
                    <strong>{!hasGaps ? 'معتمد ورقمي آمن ✓' : 'معلق ومحجوب ⛔'}</strong>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACTIVE WORKFLOW SPECIFICATION VIEW & STATE SIMULATOR */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xs">
            
            {/* Visualizer Header */}
            <div className="border-b border-slate-150 dark:border-slate-850 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 text-right">
                <span className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1 leading-none">
                  <Activity className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>آلة الحالات النشطة (Active Finite State Machine):</span>
                </span>
                <h3 className="text-base font-black text-slate-850 dark:text-white leading-relaxed">
                  {selectedWorkflow.titleArabic}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  {selectedWorkflow.description}
                </p>
              </div>

              {/* Reset to draft */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const firstState = selectedWorkflow.statesList[0].name;
                    setWorkflows(prev => prev.map(wf => {
                      if (wf.id === selectedWorkflowId) {
                        return { ...wf, currentState: firstState };
                      }
                      return wf;
                    }));
                    triggerNotification('تم إعادة تدوير آلة الحالات وتهيئة القيد للوضع المبدئي.', 'info');
                    setTerminalLogs(prev => [
                      `[${new Date().toLocaleTimeString('ar-SA')}] 🌀 تم تهيئة وإعادة تعيين آلة الحالات لـ [${selectedWorkflow.titleArabic}] للحالة المبدئية (${firstState}).`,
                      ...prev
                    ]);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-[10px] font-black flex items-center gap-1"
                >
                  <HistoryIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>إعادة تعيين الحالة المبدئية</span>
                </button>
              </div>
            </div>

            {/* DIAGRAM PANEL: VISUAL STATE MACHINE GRAPH */}
            <div className="p-6 bg-slate-950 border border-slate-850 overflow-x-auto relative">
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[8.5px] text-slate-400 font-mono">
                <Sliders className="w-3 h-3 text-amber-400 animate-spin" />
                <span>STATE_FLOW_TRANSITIONS</span>
              </div>

              <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-3 min-w-[750px] md:min-w-0 flex-wrap py-4">
                {selectedWorkflow.statesList.map((st, index) => {
                  const isActive = selectedWorkflow.currentState === st.name;
                  const isPast = selectedWorkflow.statesList.findIndex(s => s.name === selectedWorkflow.currentState) > index;
                  const isAllowedNext = selectedWorkflow.allowedTransitions[selectedWorkflow.currentState]?.includes(st.name);

                  let borderClass = 'border-slate-800';
                  let bgClass = 'bg-slate-900/40';
                  let textClass = 'text-slate-450';
                  let statusText = 'انتظار';

                  if (isActive) {
                    borderClass = 'border-amber-500 ring-2 ring-amber-500/20';
                    bgClass = 'bg-amber-950/30';
                    textClass = 'text-white font-black';
                    statusText = 'نشط الآن ●';
                  } else if (isPast) {
                    borderClass = 'border-emerald-500/80';
                    bgClass = 'bg-emerald-950/10';
                    textClass = 'text-emerald-400';
                    statusText = 'مكتمل وموثق ✓';
                  } else if (isAllowedNext) {
                    borderClass = 'border-amber-500/40 border-dashed hover:border-amber-500';
                    bgClass = 'bg-slate-900/60 cursor-pointer';
                    textClass = 'text-slate-300 hover:text-white';
                    statusText = 'انتقال متاح';
                  }

                  return (
                    <React.Fragment key={st.name}>
                      {/* State node */}
                      <div 
                        onClick={() => isAllowedNext && handleStateTransition(st.name)}
                        className={`p-3.5 border ${bgClass} ${borderClass} ${textClass} transition-all flex flex-col justify-between items-center text-center w-full md:w-[130px] shrink-0 min-h-[150px] relative select-none`}
                      >
                        {/* Index number badge */}
                        <span className={`absolute -top-2 -right-2 font-mono text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border ${
                          isActive 
                            ? 'bg-amber-600 text-white border-amber-400 animate-pulse' 
                            : isPast 
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' 
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                          {index + 1}
                        </span>

                        <div className="space-y-1.5 pt-1.5 w-full">
                          <strong className="text-[11px] font-black leading-tight block">{st.labelArabic}</strong>
                          <span className="text-[8px] text-slate-500 font-mono block uppercase leading-none">{st.name}</span>
                        </div>

                        <div className="space-y-1.5 w-full mt-2">
                          <span className="text-[8px] text-slate-400 font-bold block bg-slate-950 px-1.5 py-0.5 rounded leading-tight">
                            {st.assignedRole}
                          </span>
                          <span className={`text-[8.5px] font-black block leading-none ${
                            isActive ? 'text-amber-400' : isPast ? 'text-emerald-400' : 'text-slate-500'
                          }`}>
                            {statusText}
                          </span>
                        </div>
                      </div>

                      {/* Connection bridge */}
                      {index < selectedWorkflow.statesList.length - 1 && (
                        <div className="flex md:flex-col items-center justify-center shrink-0 py-1 md:py-0">
                          <ArrowRightLeft className={`w-4 h-4 rotate-90 md:rotate-0 ${
                            isPast ? 'text-emerald-500/80' : 'text-slate-700'
                          }`} />
                          <span className="text-[8px] text-slate-600 font-mono font-black hidden md:inline mt-0.5">ALLOW</span>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* INTERACTIVE CONTROLLER: TRANSITIONS & ROLLBACKS */}
            <div className="p-5 bg-transparent dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 space-y-4">
              
              {/* Simulator state summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-250 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-right">
                  <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    الحالة الحالية المحاكية للمسار:
                  </span>
                  <strong className="bg-amber-600/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-lg text-xs font-black">
                    {activeStateDetails.labelArabic} ({selectedWorkflow.currentState})
                  </strong>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-450 font-bold block leading-none">الصلاحية والمسؤولية:</span>
                  <span className="text-[11.5px] text-amber-600 dark:text-amber-400 font-black block mt-0.5">
                    {activeStateDetails.assignedRole}
                  </span>
                </div>
              </div>

              {/* Rules & Constraints sheet for active state */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 dark:bg-slate-900 dark:border-slate-800 space-y-1">
                  <span className="text-[9.5px] font-black text-slate-400 block uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    قواعد التحقق (Validation Rules)
                  </span>
                  <p className="text-[10.5px] text-slate-600 dark:text-slate-350 font-semibold leading-relaxed">
                    {activeStateDetails.validationRule}
                  </p>
                </div>

                <div className="p-3 dark:bg-slate-900 dark:border-slate-800 space-y-1">
                  <span className="text-[9.5px] font-black text-slate-400 block uppercase flex items-center gap-1">
                    <Scale className="w-3 h-3 text-amber-500" />
                    محددات الأعمال (Business Constraints)
                  </span>
                  <p className="text-[10.5px] text-slate-600 dark:text-slate-350 font-semibold leading-relaxed">
                    {activeStateDetails.businessConstraint}
                  </p>
                </div>

                <div className="p-3 dark:bg-slate-900 dark:border-slate-800 space-y-1">
                  <span className="text-[9.5px] font-black text-slate-400 block uppercase flex items-center gap-1">
                    <Undo2 className="w-3 h-3 text-amber-500" />
                    قواعد التراجع (Rollback Rules)
                  </span>
                  <p className="text-[10.5px] text-rose-700 dark:text-rose-400 font-semibold leading-relaxed">
                    {activeStateDetails.rollbackRule}
                  </p>
                </div>
              </div>

              {/* Controller buttons layout */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                
                {/* Active allowed transitions */}
                <div className="flex-1 space-y-1.5 text-right">
                  <span className="text-[9.5px] text-slate-400 font-black block">إجراء انتقال حتمي مصادق عليه (Deterministic Transitions):</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkflow.statesList.map(st => {
                      const isAllowed = selectedWorkflow.allowedTransitions[selectedWorkflow.currentState]?.includes(st.name);
                      
                      return (
                        <button
                          key={st.name}
                          type="button"
                          onClick={() => handleStateTransition(st.name)}
                          disabled={isSimulatingTransition || isRollbackRunning}
                          className={`px-3 py-2 text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                            isAllowed 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs animate-pulse' 
                              : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-850'
                          }`}
                        >
                          {!isAllowed && <Settings className="w-3 h-3 text-slate-400 dark:text-slate-700" />}
                          {isAllowed && <Play className="w-3 h-3 text-amber-200 animate-spin" />}
                          <span>انتقل لـ {st.labelArabic}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fallback Rollback execution */}
                <div className="sm:w-[250px] shrink-0 border-t sm:border-t-0 sm:border-r border-slate-300 dark:border-slate-800 pt-3 sm:pt-0 sm:pr-4 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={handleSimulateFailureAndRollback}
                    disabled={isSimulatingTransition || isRollbackRunning || selectedWorkflow.currentState === selectedWorkflow.statesList[0].name}
                    className="w-full py-2 px-3 bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-600/30 hover:border-rose-600 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Undo2 className="w-4 h-4" />
                    <span>محاكاة فشل وارتداد عكسي آمن</span>
                  </button>
                </div>

              </div>

            </div>

            {/* INTEGRITY DIAGNOSTIC REPORT: 9 COMPREHENSIVE ANOMALIES MAPPING */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-850 pb-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-violet-500" />
                  <span>سجل تشخيص ومعالجة العيوب الهيكلية الـ 9 (Directive #016 Integrity Diagnostic Log):</span>
                </span>
                <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                  نشط ومطابق ✓
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedWorkflow.anomalies.map(an => (
                  <div 
                    key={an.id}
                    className={`p-4 border transition-all flex flex-col justify-between gap-3 ${
                      an.isSolved 
                        ? 'bg-emerald-500/5 dark:bg-emerald-950/5 border-emerald-500/20 hover:bg-emerald-500/10' 
                        : 'bg-rose-500/5 dark:bg-rose-950/5 border-rose-500/20 hover:bg-rose-500/10'
                    }`}
                  >
                    <div className="space-y-1.5 text-right">
                      <div className="flex items-center justify-between">
                        <span className={`text-[8.5px] font-black px-2.5 py-0.5 rounded-sm ${
                          an.severity === 'critical' ? 'bg-rose-900 text-rose-300' : 'bg-amber-900 text-amber-300'
                        }`}>
                          {an.severity === 'critical' ? 'عيب خطير جداً ⛔' : 'عيب تنبيهي ⚠️'}
                        </span>
                        
                        <span className={`text-[10px] font-black flex items-center gap-1 ${
                          an.isSolved ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${an.isSolved ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                          {an.isSolved ? 'معالج وسليم ✓' : 'عيب هيكلي نشط'}
                        </span>
                      </div>

                      <strong className="text-[12px] font-black text-slate-900 dark:text-white block leading-snug">
                        {an.labelArabic}
                      </strong>
                      <span className="text-[9.5px] text-slate-450 font-mono block leading-none">{an.labelEnglish}</span>
                      
                      <p className="text-[11px] text-slate-450 font-semibold leading-relaxed">
                        {an.descriptionArabic}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-850/60 pt-2 flex items-center justify-between">
                      <span className="text-[8.5px] font-mono text-slate-500">TYPE: {an.type.toUpperCase()}</span>
                      <button
                        type="button"
                        onClick={() => toggleAnomalyStatus(selectedWorkflow.id, an.id)}
                        className={`px-3 py-1 rounded-lg text-[9.5px] font-black cursor-pointer transition-colors ${
                          an.isSolved 
                            ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                            : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                        }`}
                      >
                        {an.isSolved ? 'إعادة الفحص 🔄' : 'حل ومعايرة العيب آلياً 🛠️'}
                      </button>
                    </div>
                  </div>
                ))}

                {/* If selected workflow has no anomalies (some are perfect out of the box) */}
                {selectedWorkflow.anomalies.length === 0 && (
                  <div className="md:col-span-2 p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
                    <CheckSquare2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300">لم يتم رصد أي عيوب هيكلية في هذا المسار</p>
                    <p className="text-[10px]">كافة ممرات انتقال البيانات سليمة تماماً ومصادق عليها من اللجنة العليا.</p>
                  </div>
                )}
              </div>

            </div>

            {/* FLOW STEPS DETAILED GAP CHECKS */}
            <div className="space-y-3.5">
              <strong className="text-xs font-black text-slate-800 dark:text-slate-200 block border-b border-slate-150 dark:border-slate-850 pb-2">
                تفاصيل ممرات التراسل وربط قواعد البيانات (Data Flow Gaps Diagnosis):
              </strong>

              <div className="space-y-2">
                {selectedWorkflow.steps.map((step, idx) => {
                  const isOk = step.status === 'connected';

                  return (
                    <div 
                      key={step.id}
                      className={`p-3.5 border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        isOk 
                          ? 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-150 dark:border-slate-800/80 hover:bg-slate-50' 
                          : 'bg-rose-50/30 dark:bg-rose-950/15 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50/50 animate-pulse'
                      }`}
                    >
                      <div className="space-y-1 flex-1 text-right">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-xs font-black text-slate-850 dark:text-slate-200">
                            الخطوة {idx + 1}: {step.labelArabic}
                          </strong>
                          <span className="text-[9.5px] text-slate-450 font-mono">({step.labelEnglish})</span>
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8.5px] font-bold px-2 py-0.5 rounded-md">
                            المسؤول: {step.assignedRole}
                          </span>
                        </div>

                        {isOk ? (
                          <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold leading-relaxed">
                            ✓ متكامل تلقائياً داخل النظام. لا يحتاج الكادر إلى أي معالجة ورقية أو تصدير خارجي، ويتم ترحيل البيانات بشكل مشفر بين النطاقات آلياً وبصيغة متطابقة 100%.
                          </p>
                        ) : (
                          <div className="space-y-1.5 pt-1 text-rose-700 dark:text-rose-400 leading-relaxed text-xs">
                            <strong className="text-[10.5px] font-black block">⛔ خطوة خارجية / انقطاع بيانات مفصلي:</strong>
                            <p className="text-[10.5px] font-semibold">
                              {step.interruptionReason || 'يتطلب هذا الممر معالجة ورقية أو ملفات إكسل خارجية، مما يضر بوحدة وسلامة قواعد البيانات ويؤخر الترحيل التلقائي.'}
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleStepStatus(selectedWorkflow.id, step.id)}
                        className={`px-3 py-1.5 text-[10px] font-black transition-all cursor-pointer ${
                          isOk 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs animate-pulse'
                        }`}
                      >
                        {isOk ? 'تراسل متكامل ✓' : 'إصلاح وحل الثغرة آلياً 🛠️'}
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: TERMINAL CONSOLE & DIRECTIVE #016 COMPLIANCE SEAL (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* TERMINAL CONSOLE STREAM */}
          <div className="bg-slate-950 border border-slate-850 rounded-3xl p-5 shadow-2xl text-right text-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
              <strong className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>مراقبة الحسم للعمليات البينية</span>
              </strong>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-slate-400 font-bold font-mono">INTEGRITY_STREAM</span>
              </div>
            </div>

            {/* Terminal logs list */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 font-mono text-[9.5px] leading-relaxed text-slate-300">
              {terminalLogs.map((log, index) => (
                <p 
                  key={index} 
                  className={
                    log.includes('❌') || log.includes('فشل') || log.includes('⚠️')
                      ? 'text-rose-400 font-extrabold border-r-2 border-rose-600 pr-1' 
                      : log.includes('✓') || log.includes('🟢') || log.includes('نجاح')
                        ? 'text-emerald-400 font-black border-r-2 border-emerald-600 pr-1'
                        : 'text-slate-300'
                  }
                >
                  {log}
                </p>
              ))}
            </div>

            <div className="pt-2 text-left border-t border-slate-850 flex justify-between items-center">
              <span className="text-[8px] text-slate-500">v16.0.4-LTS</span>
              <button
                type="button"
                onClick={() => setTerminalLogs([`[${new Date().toLocaleTimeString('ar-SA')}] تم مسح وتفريغ لوحة المراقبة البينية بنجاح.`])}
                className="text-[9px] text-amber-400 hover:text-amber-300 font-black"
              >
                مسح السجلات البينية
              </button>
            </div>
          </div>

          {/* OFFICIAL DIRECTIVE #016 VERDICT SEAL */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <div className="space-y-0.5 text-right">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                  <Award className="w-4 h-4 text-violet-500" />
                  <span>ميثاق الاعتماد رقم #016</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">لجنة الرقابة والتحول المعماري السحابي</p>
              </div>
              <span className="text-[9px] bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full font-extrabold">SEAL_AUTHENTIC</span>
            </div>

            <div className="space-y-4 text-right">
              
              {/* Detailed Breakdown checkboxes */}
              <div className="space-y-2.5">
                {workflows.map(wf => {
                  const hasGaps = wf.steps.some(s => s.status === 'interrupted') || wf.anomalies.some(an => !an.isSolved);

                  return (
                    <div 
                      key={wf.id}
                      className="flex items-start gap-2.5 p-2 bg-transparent dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850"
                    >
                      <div className="mt-0.5 shrink-0">
                        {!hasGaps ? (
                          <CheckSquare2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <strong className="text-[11px] font-black text-slate-800 dark:text-slate-200 block leading-tight">{wf.titleArabic}</strong>
                        <span className="text-[9px] text-slate-450 block leading-tight">
                          {!hasGaps 
                            ? 'معتمد - آلة حالات حتمية دون أي خطوات معيبة.' 
                            : 'معلق ومحجوب - يحتوي على خطوات خارجية أو عيوب معلقة.'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Compliance Verdict */}
              {metrics.unresolvedAnomalies === 0 ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-900/50 space-y-1.5 animate-bounce">
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block uppercase tracking-wide flex items-center gap-1 leading-none">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>تم توثيق واعتماد تكامل مسارات العمل الكلية ✓</span>
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    تم مطابقة وتأكيد كافة ممرات التراسل آلياً وبصورة رقمية معزولة 100%. نظام المؤسسة خالٍ تماماً من الديون التشغيلية والفساد الهيكلي للبيانات.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/15 border border-rose-200 dark:border-rose-900/50 space-y-1.5">
                  <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 block uppercase tracking-wide flex items-center gap-1 leading-none">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>الاعتماد الكلي للتشغيل معلق!</span>
                  </span>
                  <p className="text-[10px] text-rose-700 dark:text-rose-300 leading-relaxed">
                    لا تزال بعض مسارات العمل تحتوي على عيوب هيكلية نشطة أو فجوات بيانات. يمنع الاعتماد العام لدرء مخاطر فقدان البيانات وقنوات الاتصال المتداخلة.
                  </p>
                </div>
              )}

              {/* Printable Official Stamp Block */}
              <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] bg-slate-50/50 dark:bg-slate-950/5">
                <div className="space-y-1 text-right">
                  <span className="text-[9px] text-slate-400 block font-bold">المشرف العام على جودة الأنظمة:</span>
                  <strong className="text-slate-700 dark:text-slate-300 block">مـ. خالد بن محمد الرويلي</strong>
                  <span className="text-[9px] text-slate-450 block font-semibold leading-none">رئيس لجنة الحوكمة البرمجية الكبرى</span>
                </div>
                <div className="text-center font-mono shrink-0">
                  <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-2 border-amber-500/30 rounded-full flex flex-col items-center justify-center font-black text-[8px] leading-tight shadow-xs uppercase">
                    <span>SEAL</span>
                    <span className="text-emerald-500 text-[6.5px]">CERTIFIED</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* REPORT MODAL: PRINTABLE WORKFLOW INTEGRITY DOCUMENT (DIRECTIVE 16) */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full space-y-6 shadow-2xl relative text-right"
              dir="rtl"
            >
              
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="absolute top-4 left-4 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-full cursor-pointer transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>

              {/* Official Report Header */}
              <div className="border-b-4 border-double border-amber-600 pb-4 text-center space-y-2">
                <span className="text-[10px] font-black text-amber-600 tracking-widest block uppercase font-mono">
                  KINGDOM OF SAUDI ARABIA - EDUPRO SOFTWARE GOVERNANCE COMMITTEE
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  تقرير سلامة ومطابقة مسارات العمل الكلية (Directive #016 Integrity Audit Document)
                </h2>
                <div className="flex justify-center gap-6 text-[10.5px] text-slate-500 font-bold">
                  <span>تاريخ الفحص: {new Date().toLocaleDateString('ar-SA')}</span>
                  <span>الامتثال العام: {metrics.overallIntegrityPercent}%</span>
                  <span>حالة الترخيص: معتمد بالكامل</span>
                </div>
              </div>

              {/* Document Summary description */}
              <div className="p-4 bg-transparent dark:bg-slate-900 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                <p>
                  بموجب الأمر المعماري الصادر عن لجنة موازين الأنظمة والقرار رقم 16 الخاص بالتحول الرقمي الشامل، تم فحص كافّة ممرات التراسل وقواعد البيانات عابرة النطاقات لضمان خلوها من أي خطوات ورقية أو تداخلات معيبة. 
                </p>
                <p className="font-extrabold text-amber-600 dark:text-amber-400">
                  النتيجة: تمت إعادة بناء وتوثيق كافّة المسارات لتكون آلات حالات محددة (FSM) حاسمة، وتم سد كافة ثغرات الارتداد العكسي وتوثيق الحوكمة بنسبة 100%.
                </p>
              </div>

              {/* Table of Workflows & Audit Status */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                      <th className="p-3 font-black text-slate-700 dark:text-slate-300">معرف المسار</th>
                      <th className="p-3 font-black text-slate-700 dark:text-slate-300">اسم مسار العمل</th>
                      <th className="p-3 font-black text-slate-700 dark:text-slate-300 text-center">الخطوات المتكاملة</th>
                      <th className="p-3 font-black text-slate-700 dark:text-slate-300 text-center">العيوب المكتشفة</th>
                      <th className="p-3 font-black text-slate-700 dark:text-slate-300 text-center">موقف الاعتماد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflows.map(wf => {
                      const hasGaps = wf.steps.some(s => s.status === 'interrupted') || wf.anomalies.some(an => !an.isSolved);
                      const resolvedCount = wf.anomalies.filter(a => a.isSolved).length;
                      const totalCount = wf.anomalies.length;

                      return (
                        <tr key={wf.id} className="border-b border-slate-150 dark:border-slate-850 hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">{wf.id.toUpperCase()}</td>
                          <td className="p-3 font-black text-slate-850 dark:text-slate-200">
                            <div>{wf.titleArabic}</div>
                            <div className="text-[9.5px] text-slate-400 font-mono leading-none">{wf.titleEnglish}</div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold">
                            {wf.steps.filter(s => s.status === 'connected').length} / {wf.steps.length}
                          </td>
                          <td className="p-3 text-center">
                            <span className={totalCount - resolvedCount > 0 ? 'text-rose-500 font-extrabold' : 'text-emerald-500 font-black'}>
                              {totalCount - resolvedCount} معلق ({resolvedCount} تم معالجته)
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              !hasGaps 
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                            }`}>
                              {!hasGaps ? 'مستوفى ومعتمد ✓' : 'معلق ومحجوب ⛔'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Report Footer Official Stamp Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="space-y-1.5 text-right">
                  <strong className="text-xs text-slate-800 dark:text-slate-200 block">تواقيع ومصادقات لجنة الرقابة والتحول:</strong>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed">
                    تم توقيع هذا المستند رقمياً باستخدام التوقيع الكربتوغرافي الموحد المانع للتزوير والمسجل في سجل حوكمة البيانات المركزي للمنظومة الكبرى.
                  </p>
                </div>

                <div className="flex justify-end gap-3 items-center">
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    <span>طباعة الوثيقة الرسمية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-black"
                  >
                    إغلاق العرض
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
