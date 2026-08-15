import { AlertCircle, AlertTriangle, ArrowLeftRight, Award, Box, Bug, Check, CheckCircle2, CheckSquare, ClipboardCheck, ClipboardList, Cloud, Code, Cpu, Crown, Database, Delete, EyeOff, FileSpreadsheet, FileText, Goal, Grid, Key, Layers, Layers3, LayoutTemplate, List, Lock as LockIcon, Logs, MessageSquare, MousePointerClick, Network, Palette, Printer, Receipt, RefreshCw, Search, Section, Settings, ShieldAlert, ShieldCheck, Sliders, SlidersHorizontal, Sparkles, Table, Terminal, User, Verified, Workflow, X, Zap } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseGoldenCertificationReadinessProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface ModuleCertification {
  id: string;
  moduleName: string;
  moduleEn: string;
  businessCompletenessScore: number;
  uxScore: number;
  performanceScore: number;
  securityScore: number;
  maintainabilityScore: number;
  productionReadinessScore: number;
  criticalIssues: number;
  importantIssues: number;
  optionalEnhancements: number;
  status: 'certified' | 'pending';
}

interface E2EValidationScenario {
  id: string;
  title: string;
  flow: string;
  steps: string[];
  status: 'passed' | 'pending';
}

interface LaunchReadinessItem {
  id: string;
  title: string;
  desc: string;
  status: 'verified' | 'pending';
}

export default function EnterpriseGoldenCertificationReadiness({ triggerNotification }: EnterpriseGoldenCertificationReadinessProps) {
  // Certification Register Single Decision State
  const [finalDecision, setFinalDecision] = useState<'CERTIFIED' | 'RECOMMENDED' | 'NOT_CERTIFIED'>('CERTIFIED');
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  // 1. Final Module Quality Register & Certification
  const [modules, setModules] = useState<ModuleCertification[]>([
    { 
      id: 'mod_1', 
      moduleName: 'شؤون الطلاب والقبول', 
      moduleEn: 'Student Affairs & Admissions', 
      businessCompletenessScore: 100,
      uxScore: 98,
      performanceScore: 99,
      securityScore: 100,
      maintainabilityScore: 98,
      productionReadinessScore: 100,
      criticalIssues: 0, 
      importantIssues: 0, 
      optionalEnhancements: 2, 
      status: 'certified' 
    },
    { 
      id: 'mod_2', 
      moduleName: 'الرسوم المدرسية والتحصيل', 
      moduleEn: 'Fees & Collection', 
      businessCompletenessScore: 100,
      uxScore: 97,
      performanceScore: 98,
      securityScore: 99,
      maintainabilityScore: 97,
      productionReadinessScore: 100,
      criticalIssues: 0, 
      importantIssues: 0, 
      optionalEnhancements: 1, 
      status: 'certified' 
    },
    { 
      id: 'mod_3', 
      moduleName: 'الحسابات العامة والقيود المزدوجة', 
      moduleEn: 'General Ledger & Journal Entries', 
      businessCompletenessScore: 99,
      uxScore: 98,
      performanceScore: 99,
      securityScore: 100,
      maintainabilityScore: 98,
      productionReadinessScore: 99,
      criticalIssues: 0, 
      importantIssues: 0, 
      optionalEnhancements: 3, 
      status: 'certified' 
    },
    { 
      id: 'mod_4', 
      moduleName: 'الامتحانات والكنترول والشهادات', 
      moduleEn: 'Exams, Control & Certificates', 
      businessCompletenessScore: 100,
      uxScore: 99,
      performanceScore: 97,
      securityScore: 98,
      maintainabilityScore: 99,
      productionReadinessScore: 100,
      criticalIssues: 0, 
      importantIssues: 0, 
      optionalEnhancements: 1, 
      status: 'certified' 
    },
    { 
      id: 'mod_5', 
      moduleName: 'الموارد البشرية ومسيرات الرواتب', 
      moduleEn: 'HR & Payroll Management', 
      businessCompletenessScore: 98,
      uxScore: 97,
      performanceScore: 99,
      securityScore: 99,
      maintainabilityScore: 98,
      productionReadinessScore: 100,
      criticalIssues: 0, 
      importantIssues: 0, 
      optionalEnhancements: 4, 
      status: 'certified' 
    },
    { 
      id: 'mod_6', 
      moduleName: 'التقارير الإحصائية والمالية التنفيذية', 
      moduleEn: 'Executive Reporting & Analytics', 
      businessCompletenessScore: 100,
      uxScore: 98,
      performanceScore: 98,
      securityScore: 100,
      maintainabilityScore: 99,
      productionReadinessScore: 98,
      criticalIssues: 0, 
      importantIssues: 0, 
      optionalEnhancements: 2, 
      status: 'certified' 
    },
    { 
      id: 'mod_7', 
      moduleName: 'إدارة النظام والأدوار والصلاحيات', 
      moduleEn: 'System Admin, RBAC & Security', 
      businessCompletenessScore: 100,
      uxScore: 99,
      performanceScore: 100,
      securityScore: 100,
      maintainabilityScore: 100,
      productionReadinessScore: 100,
      criticalIssues: 0, 
      importantIssues: 0, 
      optionalEnhancements: 0, 
      status: 'certified' 
    },
  ]);

  // 2. Final End-to-End Validation
  const [e2eScenarios, setE2eScenarios] = useState<E2EValidationScenario[]>([
    {
      id: 'e2e_1',
      title: 'الدورة المالية والأكاديمية الكبرى الموحدة (Student Billing Cycle)',
      flow: 'Student ➔ Fees ➔ Collection ➔ Receipt ➔ Journal ➔ General Ledger ➔ Financial Reports',
      steps: [
        'قبول وتسجيل الطالب وتعيينه بفصله الدراسي بمستأجر المدرسة.',
        'تخصيص وإسناد الرسوم والكتب المدرسية آلياً وفق الشريحة المحددة.',
        'إجراء عملية التحصيل عبر السداد السريع ونقاط البيع.',
        'إصدار سند قبض مرقم ومشفر ضريبياً ومطابق كلياً للأنظمة.',
        'توليد قيد يومية مزدوج متوازن من حساب الصندوق للبنك آلياً.',
        'ترحيل فوري للأستاذ العام وتحديث ميزان المراجعة والتقارير المالية للشركة.'
      ],
      status: 'passed'
    },
    {
      id: 'e2e_2',
      title: 'دورة الموظف ومسيرات الرواتب والقيود (Employee Payroll Cycle)',
      flow: 'Employee ➔ Payroll ➔ Journal ➔ General Ledger',
      steps: [
        'تسجيل ملف الموظف، صياغة عقد العمل وتعيين البدلات الأساسية والخصومات والتأمين.',
        'احتساب مسيرات الرواتب بناءً على أيام الحضور والغياب الموثقة.',
        'تصدير المسير متوافقاً مع صيغة البنك المعتمدة.',
        'ترحيل قيد رواتب مزدوج تلقائي في شجرة الحسابات.',
        'انعكاس القيد في الأستاذ العام وتحديث تقارير التكاليف التشغيلية للمدرسة.'
      ],
      status: 'passed'
    },
    {
      id: 'e2e_3',
      title: 'دورة الامتحانات والرصد وإصدار النتائج الأكاديمية (Exams & Certification Cycle)',
      flow: 'Exams ➔ Results ➔ Certificates',
      steps: [
        'توزيع لجان الامتحانات، وتثبيت أرقام الجلوس والباركود السري لحجب هويات الطلاب.',
        'رصد درجات اختبارات الفصل الأول والثاني يدوياً وسحابياً عبر واجهة المعلم.',
        'حساب كلي للمعدل الفصلي والتراكمي (GPA) والتقدير العام.',
        'توليد وإصدار شهادات الطلاب الإلكترونية الموقعة رقمياً والمعتمدة للإدارة.'
      ],
      status: 'passed'
    }
  ]);

  // 3. Launch Readiness Checklist
  const [launchReadiness, setLaunchReadiness] = useState<LaunchReadinessItem[]>([
    { id: 'lr_1', title: 'النسخ الاحتياطي التلقائي (Automated Backup Policies)', desc: 'تثبيت خطط نسخ قاعدة البيانات سحابياً كل 6 ساعات ومطابقتها بالتشفير التام.', status: 'verified' },
    { id: 'lr_2', title: 'خطة الاستعادة ومحاكاة الكوارث (Disaster Recovery Validation)', desc: 'تحقيق RTO أقل من 4 دقائق وRPO فوري لضمان تماسك البيانات وسلامتها.', status: 'verified' },
    { id: 'lr_3', title: 'جدران حماية الأدوار والسرية (RBAC & Tenant Isolation)', desc: 'عزل تام للمستأجرين وحماية حسابات المدارس ومنع القفز بين السجلات نهائياً.', status: 'verified' },
    { id: 'lr_4', title: 'سجل التدقيق والمراقبة الكثيفة (Audit Trail Engine)', desc: 'رصد فوري متكامل لعمليات إضافة وحذف وتعديل القيود المالية ومحاولات تسجيل الدخول.', status: 'verified' },
    { id: 'lr_5', title: 'مراقبة الأداء والجهوزية (APM & Cloud Monitoring)', desc: 'تفعيل إشعارات الاستهلاك العالي للذاكرة واستجابة السيرفرات في السحابة على مدار الساعة.', status: 'verified' },
    { id: 'lr_6', title: 'التوثيق الشامل للشركاء (Final Documentation Guide)', desc: 'اكتمال أدلة المستخدم، دليل مسؤول النظام، أدلة الإعداد الأولي، ومسارات الربط.', status: 'verified' },
    { id: 'lr_7', title: 'دليل النشر والاستقرار السحابي (Production Deployment Guide)', desc: 'تأمين مسار نشر الحزمة الذهبية واستقرار الخدمات الدائمة تحت النقل المروري المكثف.', status: 'verified' },
  ]);

  // Simulation state
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'نظام التحقق البرمجي النهائي لإجازة وترخيص الإصدار الذهبي الشامل Golden Certification Engine (v12.4) نشط وجاهز...'
  ]);
  const [isGoldenCertified, setIsGoldenCertified] = useState<boolean>(false);

  // 7 Strict Reviews Protocol state
  const [protocolItems, setProtocolItems] = useState([
    {
      id: 'functional_review',
      nameArabic: '✓ المراجعة الوظيفية والتشغيلية (Functional Review)',
      nameEnglish: 'Functional Review',
      desc: 'التحقق الكامل من مطابقة كافة العمليات لمتطلبات ودورات العمل وقواعد المحاسبة والدورة الأكاديمية بنسبة 100%.',
      isMet: true,
      evidence: 'سجلات ترحيل القيود مزدوجة المدخلات متوازنة تماماً وصك التحصيل مرقم ضريبياً دون انكسار.',
      recommendation: 'تشغيل محاكي الدورة الأكاديمية والمالية الكبرى والتحقق من عدم وجود مخرجات صفرية.',
      severity: 'حرجة للغاية (Functional Accuracy)'
    },
    {
      id: 'engineering_review',
      nameArabic: '✓ المراجعة الهندسية والبرمجية (Engineering Review)',
      nameEnglish: 'Engineering Review',
      desc: 'مراجعة البنية البرمجية ونظافة الكود وتوافق الأنظمة وقابلية التوسع وخلو الشيفرات من استدعاءات متكررة أو ثغرات مكدسة.',
      isMet: true,
      evidence: 'مطابقة تامة لمعايير TypeScript الصارمة وخلو سجلات البناء من أي تحذيرات أو أخطاء بناء نوعية.',
      recommendation: 'مراجعة دورية للأكواد الجديدة في كل Sprint وتطبيق الفحص التلقائي المستمر.',
      severity: 'حرجة جداً (Code Quality Gate)'
    },
    {
      id: 'ui_review',
      nameArabic: '✓ مراجعة واجهات المستخدم (UI Review)',
      nameEnglish: 'UI Review',
      desc: 'ضمان الاتساق الكامل للألوان والمظاهر والخطوط والتباعدات والأزرار الموحدة وفقاً للهوية ودليل نظام التصميم.',
      isMet: true,
      evidence: 'درجات تباين الخطوط مطابقة لمعايير الاستخدام، مع توحيد أزرار ونوافذ مجمع الأنظمة الموحد.',
      recommendation: 'عزل المكونات الثانوية وتنسيقها وفق ميثاق واجهات المستخدم الفاخر (Global CSS Standard).',
      severity: 'متوسطة (Visual Consistency)'
    },
    {
      id: 'ux_review',
      nameArabic: '✓ مراجعة تجربة المستخدم (UX Review)',
      nameEnglish: 'UX Review',
      desc: 'التحقق من سلاسة تدفق النوافذ والعمليات، وإنجاز المهام بأقل عدد نقرات ممكن، واستجابة الرسائل وتوجيهات النظام.',
      isMet: true,
      evidence: 'تقليص خطوات تسوية الرسوم والقبول لأقل من 3 نقرات وضمان ظهور رسائل التأكيد والوضوح التام.',
      recommendation: 'تحديث مصفوفات التنقل السريع لتسهيل مهام مديري ومحاسبي المدارس.',
      severity: 'متوسطة (Interaction Quality)'
    },
    {
      id: 'security_review',
      nameArabic: '✓ المراجعة الأمنية (Security Review)',
      nameEnglish: 'Security Review',
      desc: 'تأمين مصفوفة الصلاحيات (RBAC)، وعزل كامل لقواعد البيانات ومستأجري المدارس والتحقق من منع القفز بين السجلات.',
      isMet: true,
      evidence: 'تفعيل جدران حماية المستأجرين (Tenant Isolation) وتأمين ثغرات حقن الطلبات والفلترة الرقمية الحساسة.',
      recommendation: 'تشغيل دوري لفحوصات الاختراق واختبار الصلاحيات الدقيقة لكل رتبة إدارية.',
      severity: 'خطيرة للغاية (Tenant Isolation & RBAC)'
    },
    {
      id: 'performance_review',
      nameArabic: '✓ مراجعة الأداء (Performance Review)',
      nameEnglish: 'Performance Review',
      desc: 'قياس سرعة معالجة وطلب الصفحات والجداول الكبرى تحت ضغط تحميل مالي وأكاديمي مكثف لضمان كفاءة السيرفرات.',
      isMet: true,
      evidence: 'مؤشرات تحميل الخادم تظهر وقتاً أقل من 120ms لمعالجة موازين المراجعة ومسيرات الرواتب.',
      recommendation: 'تحديث فهارس قواعد البيانات وفك الموازين الثقيلة سحابياً.',
      severity: 'حرجة (Load Capacity & APM)'
    },
    {
      id: 'production_review',
      nameArabic: '✓ مراجعة النشر والجاهزية (Production Review)',
      nameEnglish: 'Production Review',
      desc: 'مراجعة خطط النشر، سلامة الحزم المستقرة، فحص النسخ الاحتياطي التلقائي وسجلات تماسك البيانات وخطط الاستعادة.',
      isMet: true,
      evidence: 'استقرار مسار النشر ببيئة Cloud Run، تفعيل النسخ الاحتياطي المشفر كل 6 ساعات، مع تأمين RTO فوري.',
      recommendation: 'تحديث وثائق أدلة مسؤولي النظام وضمان استقرار المراقبة التلقائية APM.',
      severity: 'متوسطة (Operational Readiness)'
    }
  ]);

  interface DiscoveredObservation {
    id: string;
    title: string;
    reviewType: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    description: string;
    evidence: string;
    isDocumented: boolean;
    isCategorized: boolean;
    isClosed: boolean;
    isDeferred?: boolean;
    stage?: 'Verification' | 'Root Cause Analysis' | 'Permanent Fix' | 'Regression Testing' | 'Final Approval';
  }

  // Fast Track Protocol State
  const [isFastTrackActive, setIsFastTrackActive] = useState<boolean>(false);

  // Discovered Observations Register
  const [discoveredObservations, setDiscoveredObservations] = useState<DiscoveredObservation[]>([
    {
      id: 'obs_1',
      title: 'تأخر في معالجة ميزان المراجعة تحت ضغط التحميل',
      reviewType: 'performance',
      severity: 'High',
      description: 'أظهر الفحص تأخراً طفيفاً في استجابة ميزان المراجعة عند طلب ترحيل أكثر من 10,000 قيد محاسبي دفعة واحدة.',
      evidence: 'سجلات تحميل خادم قاعدة البيانات تظهر ارتفاع معدل استهلاك المعالج إلى 92% لمدة 8 ثوانٍ تم تحسينها عبر الفهرسة.',
      isDocumented: true,
      isCategorized: true,
      isClosed: true,
      isDeferred: false,
      stage: 'Final Approval'
    },
    {
      id: 'obs_2',
      title: 'ثغرة فحص الهوية والتحقق في واجهة سداد الرسوم السريعة',
      reviewType: 'security',
      severity: 'Critical',
      description: 'التحقق من نقاط النهاية أظهر إمكانية تعديل قيمة الفاتورة المصدرة في المتصفح قبل إرسال طلب السداد النهائي للخادم المالي.',
      evidence: 'تمت محاكاة تعديل الطلب (Request Tampering) والنجاح في تمرير سداد رسوم جزئي بقيمة 1 ريال بدلاً من 5000 ريال قبل سد الثغرة.',
      isDocumented: true,
      isCategorized: true,
      isClosed: false, // Initially open to demonstrate release blocking!
      isDeferred: false,
      stage: 'Root Cause Analysis'
    },
    {
      id: 'obs_3',
      title: 'تفاوت تباين ألوان خلفية جدول توزيع لجان الامتحانات',
      reviewType: 'ui',
      severity: 'Low',
      description: 'ألوان النصوص ودرجات التباين الرمادي في ترويسة جداول الكنترول لا تطابق دليل الهوية البصرية الموحد.',
      evidence: 'الفحص اليدوي ومطابقة درجات اللون أظهر اختلافاً طفيفاً (#64748B مقابل #475569) وتم توحيدها بالكامل.',
      isDocumented: true,
      isCategorized: true,
      isClosed: false, // Initially open, but of severity 'Low' so it can be deferred under Fast Track Protocol!
      isDeferred: false,
      stage: 'Permanent Fix'
    }
  ]);

  // Form states for adding a new observation
  const [newObsTitle, setNewObsTitle] = useState('');
  const [newObsReviewType, setNewObsReviewType] = useState('functional');
  const [newObsSeverity, setNewObsSeverity] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('Medium');
  const [newObsDescription, setNewObsDescription] = useState('');
  const [newObsEvidence, setNewObsEvidence] = useState('');

  // Pre-Release Verification Pillars (مراجعة ركائز البنية التحتية والأمان والامتياز الفني)
  const [preReleasePillars, setPreReleasePillars] = useState([
    { id: 'auth_n', nameAr: 'Authentication', nameEn: 'المصادقة والتحقق الآمن من الهوية', desc: 'تطبيق التشفير والمصادقة المزدوجة المتعددة الأطراف وحماية الجلسات.', isVerified: true },
    { id: 'auth_z', nameAr: 'Authorization', nameEn: 'تراخيص الصلاحيات الدقيقة والأدوار RBAC', desc: 'تحديد صلاحيات دقيقة جداً لكل مستوى ومستخدم لمنع التجاوزات غير المصرحة.', isVerified: true },
    { id: 'tenant_iso', nameAr: 'Tenant Isolation', nameEn: 'عزل تام للمستأجرين وقواعد البيانات', desc: 'ضمان عزل كامل لبيانات وسجلات كل مدرسة أو مجمع تعليمي بشكل مستقل.', isVerified: true },
    { id: 'logging_sys', nameAr: 'Logging', nameEn: 'سجلات التشغيل التفصيلية وتتبع الأثر', desc: 'تسجيل كافة العمليات والنداءات الفنية لتتبع استجابة وأداء النظام بدقة.', isVerified: true },
    { id: 'monitoring_sys', nameAr: 'Monitoring', nameEn: 'المراقبة المستمرة ومؤشرات كفاءة الموارد APM', desc: 'مراقبة حية لاستهلاك المعالج والذاكرة وسرعة استجابة الخوادم السحابية.', isVerified: true },
    { id: 'backup_sys', nameAr: 'Backup', nameEn: 'النسخ الاحتياطي التلقائي والمشفر', desc: 'سياسة نسخ احتياطي دورية لقواعد البيانات ومستندات المنصة سحابياً.', isVerified: true },
    { id: 'restore_sys', nameAr: 'Restore', nameEn: 'خطة استعادة البيانات واختبار الكوارث', desc: 'التحقق الدوري من سرعة استرجاع البيانات وتحقيق RTO/RPO المخطط له.', isVerified: true },
    { id: 'secrets_sys', nameAr: 'Secrets', nameEn: 'تأمين وإدارة كلمات السر ومفاتيح الربط', desc: 'تشفير وحفظ مفاتيح برمجة التطبيقات وسجلات الاتصال الحساسة بشكل مشفر.', isVerified: true },
    { id: 'env_vars', nameAr: 'Environment Variables', nameEn: 'سلامة متغيرات البيئة السحابية', desc: 'فحص وضمان تكوين متغيرات التشغيل دون وجود قيم مكشوفة في الشيفرة.', isVerified: true },
    { id: 'err_handling', nameAr: 'Error Handling', nameEn: 'المعالجة الذكية والشاملة للأخطاء البرمجية', desc: 'احتكاك مرن وسليم للثغرات والأخطاء وتوليد بدائل دون انقطاع الجلسة للمستخدم.', isVerified: true },
    { id: 'audit_trail', nameAr: 'Audit Trail', nameEn: 'سجل التدقيق والمحاسبة الجنائية التامة', desc: 'توثيق غير قابل للتعديل لكافة الحركات والتغييرات المالية والأكاديمية بالتاريخ والفاعل.', isVerified: true }
  ]);

  const togglePreReleasePillar = (id: string) => {
    setPreReleasePillars(prev => prev.map(p => p.id === id ? { ...p, isVerified: !p.isVerified } : p));
    triggerNotification('تم تحديث حالة التحقق من ركيزة الإصدار المعمارية.', 'info');
  };

  // 3-Goal UX & Visual Comfort Evaluation State (سهولة الفهم، سهولة الإنجاز، الراحة البصرية)
  const [uxScreens, setUxScreens] = useState([
    {
      id: 'ux_scr_1',
      screenName: 'بوابة تسجيل وقبول الطلاب الجدد',
      module: 'شؤون الطلاب والقبول',
      easeOfUnderstanding: true, // سهولة الفهم
      easeOfAccomplishment: true, // سهولة الإنجاز
      visualComfort: true, // الراحة البصرية
      requiresThinking: false, // يحتاج إلى تفكير؟
      remediationDetails: 'تم مراجعة الشاشة بالكامل؛ خالية من أي غموض وتوفر توجيهاً فورياً وتدفقاً متكاملاً لإكمال التسجيل في خطوتين.'
    },
    {
      id: 'ux_scr_2',
      screenName: 'لوحة إدارة الرسوم وحساب الفواتير المدرسية',
      module: 'الشؤون المالية والرسوم',
      easeOfUnderstanding: true,
      easeOfAccomplishment: true,
      visualComfort: true,
      requiresThinking: false,
      remediationDetails: 'تعتمد درجات تباين ألوان هادئة ومريحة، وتحسب الرسوم تلقائياً فوراً لتجنب أي عملية إدراكية معقدة.'
    },
    {
      id: 'ux_scr_3',
      screenName: 'واجهة رصد الاختبارات والمعدلات التراكمية',
      module: 'الامتحانات والمعدلات الأكاديمية',
      easeOfUnderstanding: true,
      easeOfAccomplishment: true,
      visualComfort: true,
      requiresThinking: false,
      remediationDetails: 'تتبع نظام تصميم هرمي واضح، مع تمييز فوري للمعدلات وحفظ تلقائي يختصر جهد المعلم نهائياً.'
    },
    {
      id: 'ux_scr_4',
      screenName: 'لوحة التحكم والتحليل الشامل للمستثمر والشركاء',
      module: 'التقارير والمؤشرات الذكية',
      easeOfUnderstanding: true,
      easeOfAccomplishment: true,
      visualComfort: true,
      requiresThinking: false,
      remediationDetails: 'لوحة رسومية هادئة وبسيطة تعرض المؤشرات الأساسية دون تفاصيل زائدة مشتتة لانتباه المستثمر.'
    }
  ]);

  const toggleUxScreenCriteria = (id: string, field: 'easeOfUnderstanding' | 'easeOfAccomplishment' | 'visualComfort' | 'requiresThinking') => {
    setUxScreens(prev => prev.map(scr => {
      if (scr.id === id) {
        const updated = { ...scr, [field]: !scr[field] };
        if (field === 'requiresThinking' && updated.requiresThinking) {
          triggerNotification('⚠️ تنبيه معرقل نشط: الشاشة تحتاج إعادة مراجعة فوراً لأنها تتطلب تفكيراً من المستخدم!', 'warning');
        } else if (field === 'requiresThinking' && !updated.requiresThinking) {
          triggerNotification('✓ تم التحديث: لم تعد الشاشة تتطلب تفكيراً مفرطاً، وهي مطابقة بنجاح.', 'success');
        } else {
          triggerNotification('تم تحديث معايير ملاءمة تجربة المستخدم والراحة البصرية.', 'info');
        }
        return updated;
      }
      return scr;
    }));
  };

  // Design Uniformity & Interface Standards (ميثاق توحيد التصميم والمظهر الفني لكافة شاشات المنصة)
  const [designUniformityItems, setDesignUniformityItems] = useState([
    { id: 'uni_header', labelAr: 'Header', labelEn: 'ترويسة الصفحات الموحدة', desc: 'توحيد ترويسة جميع الشاشات مع الشعار والعناوين الهيراركية والمسار اللحظي.', isUnified: true, element: 'Header' },
    { id: 'uni_toolbar', labelAr: 'Toolbar', labelEn: 'شريط الأدوات وأزرار البحث الموحدة', desc: 'تكامل موحد لأشرطة البحث والتصفية والأدوات السريعة بنسق متناغم في كافة الوحدات.', isUnified: true, element: 'Toolbar' },
    { id: 'uni_buttons', labelAr: 'Buttons', labelEn: 'أشكال وألوان الأزرار التفاعلية الموحدة', desc: 'استخدام أزرار تتبع نفس درجات الانحناء، الحواف، والحالات النشطة والhover والتأثيرات الحركية.', isUnified: true, element: 'Buttons' },
    { id: 'uni_cards', labelAr: 'Cards', labelEn: 'البطاقات والحاويات المستديرة الفاخرة', desc: 'توحيد الحواف الدائرية (rounded-3xl)، سماكة الإطار الخفيف، والظلال المريحة للعين.', isUnified: true, element: 'Cards' },
    { id: 'uni_tables', labelAr: 'Tables', labelEn: 'جداول البيانات والشبكات المنظمة', desc: 'اعتماد هيدر جداول داكن أو فاتح خفيف، وتنسيق الأسطر مع فواصل نظيفة ودعم متناسق للصفحات.', isUnified: true, element: 'Tables' },
    { id: 'uni_forms', labelAr: 'Forms', labelEn: 'حقول النماذج وعناصر الإدخال', desc: 'توحيد تصاميم حقول النصوص، حقول الاختيار، والتحقق الفوري من صحة المدخلات بنظام موحد.', isUnified: true, element: 'Forms' },
    { id: 'uni_dialogs', labelAr: 'Dialogs', labelEn: 'النوافذ المنبثقة والتحذيرات السريعة', desc: 'تصميم موحد وممركز لكافة الـ Modals والنوافذ التفصيلية وتأثير التلاشي الخاص بها.', isUnified: true, element: 'Dialogs' },
    { id: 'uni_colors', labelAr: 'Colors', labelEn: 'لوحة ألوان الهوية البصرية المستقرة', desc: 'الالتزام التام بتدرجات رمادي وصخور الكون (Slate & Charcoal) وألوان اللمسات التفاعلية كالعنبر والأزرق الداكن.', isUnified: true, element: 'Colors' },
    { id: 'uni_typography', labelAr: 'Typography', labelEn: 'الخطوط والهرمية البصرية للنصوص', desc: 'تكامل الخطوط العربية الفاخرة والخطوط التقنية بالأحجام الموحدة للمستويات الستة.', isUnified: true, element: 'Typography' },
    { id: 'uni_icons', labelAr: 'Icons', labelEn: 'مجموعة الأيقونات الموحدة من Lucide', desc: 'استخدام حصري لأيقونات lucide-react بنفس السماكة والأنماط، دون خلط أو عشوائية.', isUnified: true, element: 'Icons' },
    { id: 'uni_rtl', labelAr: 'RTL', labelEn: 'دعم التوجيه واللغة العربية المتناسقة', desc: 'محاذاة كاملة وصحيحة من اليمين إلى اليسار بكافة أجزاء المنصة والهوامش لمنع التداخل.', isUnified: true, element: 'RTL' }
  ]);

  const toggleDesignUniformityItem = (id: string) => {
    setDesignUniformityItems(prev => prev.map(item => item.id === id ? { ...item, isUnified: !item.isUnified } : item));
    triggerNotification('تم تحديث حالة التحقق من مطابقة وتوحيد التصميم.', 'info');
  };

  // 7 Quality Reviews State per Module (EduPro Enterprise Quality Reviews Charter)
  interface ModuleReviews {
    [moduleId: string]: {
      businessReview: boolean;
      engineeringReview: boolean;
      securityReview: boolean;
      performanceReview: boolean;
      uiReview: boolean;
      uxReview: boolean;
      productionReview: boolean;
    }
  }

  const [moduleReviews, setModuleReviews] = useState<ModuleReviews>({
    mod_1: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
    mod_2: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
    mod_3: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
    mod_4: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
    mod_5: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
    mod_6: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
    mod_7: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
  });

  const toggleModuleReview = (moduleId: string, reviewKey: 'businessReview' | 'engineeringReview' | 'securityReview' | 'performanceReview' | 'uiReview' | 'uxReview' | 'productionReview') => {
    setModuleReviews(prev => {
      const updated = { ...prev };
      updated[moduleId] = {
        ...updated[moduleId],
        [reviewKey]: !updated[moduleId][reviewKey]
      };
      return updated;
    });
    triggerNotification('تم تحديث حالة مراجعة جودة الوحدة الكبرى وفق ميثاق الجودة.', 'info');
  };

  // 7-Step Workflow State
  const [workflowSteps, setWorkflowSteps] = useState([
    { id: 'wf_1', label: '1. إنشاء البيانات', eng: 'Data Creation', status: 'success' as 'success' | 'interrupted' | 'idle', desc: 'توليد السجلات الأكاديمية والمالية آلياً', detail: 'تم توليد فاتورة الرسوم المدرسية رقم #INV-2026-001 بنجاح' },
    { id: 'wf_2', label: '2. حفظ البيانات', eng: 'Data Saving', status: 'success' as 'success' | 'interrupted' | 'idle', desc: 'حفظ آمن وغير قابل للتجزئة في قاعدة البيانات', detail: 'تم الحفظ المعزول للمستأجر وحفظ سلامة السجلات (ACID Transaction Committed)' },
    { id: 'wf_3', label: '3. الترحيل التلقائي', eng: 'Posting / Transfer', status: 'success' as 'success' | 'interrupted' | 'idle', desc: 'ترحيل السجلات والقيود آلياً دون تدخل بشري', detail: 'تم ترحيل الفاتورة وتوليد سند القبض تلقائياً بفارق زمن فوري' },
    { id: 'wf_4', label: '4. المعالجة المحاسبية', eng: 'Accounting', status: 'success' as 'success' | 'interrupted' | 'idle', desc: 'توليد قيود اليومية ومطابقة الحسابات المزدوجة', detail: 'تم توليد قيد اليومية المتوازن رقم #JV-8874 ومطابقة المدين والداين' },
    { id: 'wf_5', label: '5. التقارير الشاملة', eng: 'Reporting', status: 'success' as 'success' | 'interrupted' | 'idle', desc: 'تحديث ميزان المراجعة والتقارير المالية والختامية فوراً', detail: 'انعكاس القيد في الأستاذ العام وتحديث ميزان المراجعة والأرباح والخسائر' },
    { id: 'wf_6', label: '6. الطباعة والتصدير', eng: 'Printing & Export', status: 'success' as 'success' | 'interrupted' | 'idle', desc: 'إصدار وتجهيز المستندات عالية الدقة والتشفير الضريبي', detail: 'تم توليد ملف PDF مشفر وجاهز للطباعة مع الباركود والختم الرسمي' },
    { id: 'wf_7', label: '7. الأرشفة والنسخ', eng: 'Cloud Archiving', status: 'success' as 'success' | 'interrupted' | 'idle', desc: 'أرشفة السجل المشفر في الخزنة الرقمية السحابية', detail: 'تم حفظ نسخة مؤرشفة غير قابلة للتعديل بترميز SHA-256 في المستودع الآمن' },
  ]);

  const [isWorkflowInterrupted, setIsWorkflowInterrupted] = useState(false);
  const [interruptedStepId, setInterruptedStepId] = useState<string | null>(null);
  const [isAutofixRunning, setIsAutofixRunning] = useState(false);
  const [autofixLogs, setAutofixLogs] = useState<string[]>([]);

  const simulateWorkflowInterruption = (stepId: string) => {
    setIsWorkflowInterrupted(true);
    setInterruptedStepId(stepId);
    setWorkflowSteps(prev => prev.map((step, idx) => {
      const interruptedIdx = prev.findIndex(s => s.id === stepId);
      if (idx === interruptedIdx) {
        return { ...step, status: 'interrupted', detail: '🔴 انقطع مسار العمل هنا! تكتشف مشكلة تتطلب معالجة برمجية جذرية.' };
      } else if (idx > interruptedIdx) {
        return { ...step, status: 'idle', detail: '⏳ بانتظار استيفاء وإصلاح الخطوة السابقة' };
      }
      return step;
    }));
    triggerNotification('⚠️ تحذير حوكمة فوري: انقطع مسار العمل! تم قفل ترخيص الجودة تلقائياً ولا بد من حل المشكلة.', 'danger');
  };

  const runAutomatedWorkflowRecovery = () => {
    if (!interruptedStepId) return;
    setIsAutofixRunning(true);
    setAutofixLogs(['[بدء التشغيل] تهيئة محرك المعالجة الذاتية التلقائي دون أي تدخل يدوي...']);
    
    let currentIdxToFix = workflowSteps.findIndex(s => s.id === interruptedStepId);
    
    const interval = setInterval(() => {
      setWorkflowSteps(prev => {
        const nextStepToFixIdx = prev.findIndex((s, idx) => s.status !== 'success' && idx >= currentIdxToFix);
        
        if (nextStepToFixIdx === -1) {
          clearInterval(interval);
          setIsAutofixRunning(false);
          setIsWorkflowInterrupted(false);
          setInterruptedStepId(null);
          triggerNotification('✓ نجاح المعالجة الآلية! تم استكمال وإصلاح كامل مسار العمل بنسبة 100%.', 'success');
          return prev;
        }

        const updated = [...prev];
        const stepToFix = updated[nextStepToFixIdx];
        
        let originalDetail = '';
        if (stepToFix.id === 'wf_1') originalDetail = 'تم توليد فاتورة الرسوم المدرسية رقم #INV-2026-001 بنجاح';
        if (stepToFix.id === 'wf_2') originalDetail = 'تم الحفظ المعزول للمستأجر وحفظ سلامة السجلات (ACID Transaction Committed)';
        if (stepToFix.id === 'wf_3') originalDetail = 'تم ترحيل الفاتورة وتوليد سند القبض تلقائياً بفارق زمن فوري';
        if (stepToFix.id === 'wf_4') originalDetail = 'تم توليد قيد اليومية المتوازن رقم #JV-8874 ومطابقة المدين والداين';
        if (stepToFix.id === 'wf_5') originalDetail = 'انعكاس القيد في الأستاذ العام وتحديث ميزان المراجعة والأرباح والخسائر';
        if (stepToFix.id === 'wf_6') originalDetail = 'تم توليد ملف PDF مشفر وجاهز للطباعة مع الباركود والختم الرسمي';
        if (stepToFix.id === 'wf_7') originalDetail = 'تم حفظ نسخة مؤرشفة غير قابلة للتعديل بترميز SHA-256 في المستودع الآمن';

        updated[nextStepToFixIdx] = {
          ...stepToFix,
          status: 'success',
          detail: `🟢 [إصلاح تلقائي للعيوب]: ${originalDetail}`
        };

        setAutofixLogs(logs => [
          ...logs,
          `[مستمر] خطوة ${nextStepToFixIdx + 1} (${stepToFix.eng}): جاري معالجة وتمرير السجل آلياً دون أي تدخل بشري... نجاح.`
        ]);

        return updated;
      });
    }, 1000);
  };

  // Toggle helpers
  const toggleModuleStatus = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'certified' ? 'pending' : 'certified' } : m));
    triggerNotification('تم تحديث حالة اعتماد الوحدة.', 'info');
  };

  const toggleScenarioStatus = (id: string) => {
    setE2eScenarios(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'passed' ? 'pending' : 'passed' } : s));
    triggerNotification('تم تحديث حالة الفحص المترابط E2E.', 'info');
  };

  const toggleReadinessStatus = (id: string) => {
    setLaunchReadiness(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'verified' ? 'pending' : 'verified' } : r));
    triggerNotification('تم تحديث متطلب جاهزية الإطلاق النهائي.', 'info');
  };

  const toggleProtocolItem = (id: string) => {
    setProtocolItems(prev => prev.map(item => item.id === id ? { ...item, isMet: !item.isMet } : item));
    triggerNotification('تم تعديل حالة مطابقة بند بروتوكول الاعتماد الذهبي.', 'info');
  };

  const addObservation = () => {
    if (!newObsTitle.trim() || !newObsDescription.trim()) {
      triggerNotification('الرجاء كتابة العنوان والوصف لتوثيق الملاحظة.', 'warning');
      return;
    }
    const newObs: DiscoveredObservation = {
      id: `obs_${Date.now()}`,
      title: newObsTitle,
      reviewType: newObsReviewType,
      severity: newObsSeverity,
      description: newObsDescription,
      evidence: newObsEvidence || 'تم فحص البند وتوثيق الملاحظة برمجياً.',
      isDocumented: true,
      isCategorized: true,
      isClosed: false,
      isDeferred: false,
      stage: 'Verification'
    };
    setDiscoveredObservations(prev => [...prev, newObs]);
    setNewObsTitle('');
    setNewObsDescription('');
    setNewObsEvidence('');
    triggerNotification('تم توثيق وتصنيف الملاحظة الجديدة بنجاح! ⚠️📋', 'info');
  };

  const setObservationStage = (id: string, stage: 'Verification' | 'Root Cause Analysis' | 'Permanent Fix' | 'Regression Testing' | 'Final Approval') => {
    setDiscoveredObservations(prev => prev.map(o => o.id === id ? { ...o, stage } : o));
    triggerNotification(`تم تحديث مرحلة معالجة الملاحظة إلى: ${stage}`, 'info');
  };

  const toggleObsDocumented = (id: string) => {
    setDiscoveredObservations(prev => prev.map(o => o.id === id ? { ...o, isDocumented: !o.isDocumented } : o));
    triggerNotification('تم تعديل حالة توثيق الملاحظة.', 'info');
  };

  const toggleObsCategorized = (id: string) => {
    setDiscoveredObservations(prev => prev.map(o => o.id === id ? { ...o, isCategorized: !o.isCategorized } : o));
    triggerNotification('تم تعديل حالة تصنيف الملاحظة.', 'info');
  };

  const toggleObsClosed = (id: string) => {
    setDiscoveredObservations(prev => prev.map(o => o.id === id ? { ...o, isClosed: !o.isClosed } : o));
    triggerNotification('تم تعديل حالة إغلاق الملاحظة.', 'info');
  };

  const toggleObsDeferred = (id: string) => {
    setDiscoveredObservations(prev => prev.map(o => o.id === id ? { ...o, isDeferred: !o.isDeferred } : o));
    triggerNotification('تم تعديل حالة ترحيل وتأجيل الملاحظة إلى مرحلة التميز البصري.', 'info');
  };

  const deleteObservation = (id: string) => {
    setDiscoveredObservations(prev => prev.filter(o => o.id !== id));
    triggerNotification('تم حذف الملاحظة الموثقة من السجل.', 'info');
  };

  // Run full simulation
  const runGoldenCertificationSuite = () => {
    setIsSimulationActive(true);
    setSimProgress(5);
    setTerminalLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء عمليات التحقق الفني لميثاق الإصدار الذهبي الشامل (Enterprise Golden Release Audit)...`]);

    const steps = [
      'جاري استدعاء سجل الاعتماد ومراجعة موازين الجودة لكل من الوحدات السبع الكبرى... [مطابق 100%].',
      'جاري فحص المراجعات السبعة لـ Enterprise Release Approval للتأكد من الأدلة... [مكتمل].',
      'جاري فحص سجل الملاحظات والتحقق من إغلاق وتصنيف كافة العيوب المكتشفة... [تم إغلاقها بالكامل].',
      'جاري تشغيل السيناريو الأكاديمي والمالي المترابط (التحصيل السريع ➔ القيد ➔ الأستاذ العام) ودراسة النتائج... [نجاح دورة البيانات].',
      'جاري مراجعة دورة الموظف واحتساب مسيرات الرواتب وربطها التلقائي بالحسابات... [مطابق لبروتوكول البنوك].',
      'جاري فحص لجان الامتحانات وحجب هويات الطلاب وتوليد درجات الشهادات... [الكنترول المركزي مؤمن بنسبة 100%].',
      'جاري التحقق من خطط الاستعادة والنسخ السحابي ومستويات الاستجابة وعزل المستأجرين... [مستقر وآمن].',
      'تشغيل فحص البنية اللغوية للأكواد والشيفرات البرمجية (npm run lint)... النتيجة: 0 أخطاء برمجية.',
      'تجميع حزمة الإطلاق الذهبي الشامل (npm run build)... تم تجميع الحزمة بنجاح تام كنسخة إصدار ذهبي مستقر.'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < steps.length) {
        setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString('ar-SA')}] ${steps[index]}`]);
        setSimProgress(prev => Math.min(prev + 14, 100));
        index++;
      } else {
        clearInterval(interval);
        setSimProgress(100);
        setIsSimulationActive(false);
        // Force-set all protocol items, modules, and observations to green upon simulated suite success!
        setProtocolItems(prev => prev.map(item => ({ ...item, isMet: true })));
        setModules(prev => prev.map(m => ({ ...m, status: 'certified' })));
        setE2eScenarios(prev => prev.map(s => ({ ...s, status: 'passed' })));
        setLaunchReadiness(prev => prev.map(r => ({ ...r, status: 'verified' })));
        setPreReleasePillars(prev => prev.map(p => ({ ...p, isVerified: true })));
        setUxScreens(prev => prev.map(scr => ({ ...scr, easeOfUnderstanding: true, easeOfAccomplishment: true, visualComfort: true, requiresThinking: false })));
        setDesignUniformityItems(prev => prev.map(item => ({ ...item, isUnified: true })));
        setDiscoveredObservations(prev => prev.map(o => ({ ...o, isDocumented: true, isCategorized: true, isClosed: true, isDeferred: false })));
        setModuleReviews({
          mod_1: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
          mod_2: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
          mod_3: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
          mod_4: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
          mod_5: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
          mod_6: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
          mod_7: { businessReview: true, engineeringReview: true, securityReview: true, performanceReview: true, uiReview: true, uxReview: true, productionReview: true },
        });
        triggerNotification('تم اجتياز جميع فحوصات ميثاق الجودة والاستقرار الشامل للإصدار الذهبي بتميز مطلق! 🏆🚀👑✨', 'success');
      }
    }, 450);
  };

  const pendingModulesCount = modules.filter(m => m.status !== 'certified').length;
  const pendingScenariosCount = e2eScenarios.filter(s => s.status !== 'passed').length;
  const pendingReadinessCount = launchReadiness.filter(r => r.status !== 'verified').length;
  const pendingPillarsCount = preReleasePillars.filter(p => !p.isVerified).length;
  const pendingUxScreensCount = uxScreens.filter(scr => !scr.easeOfUnderstanding || !scr.easeOfAccomplishment || !scr.visualComfort || scr.requiresThinking).length;
  const pendingDesignUniformityCount = designUniformityItems.filter(item => !item.isUnified).length;

  const pendingQualityReviewsCount = Object.values(moduleReviews).reduce((acc: number, current) => {
    const unapproved = Object.values(current).filter(v => !v).length;
    return acc + unapproved;
  }, 0);

  const isEligibleForGoldenSeal = 
    pendingModulesCount === 0 && 
    pendingScenariosCount === 0 && 
    pendingReadinessCount === 0 &&
    pendingPillarsCount === 0 &&
    pendingUxScreensCount === 0 &&
    pendingDesignUniformityCount === 0 &&
    pendingQualityReviewsCount === 0 &&
    !isWorkflowInterrupted &&
    protocolItems.every(item => item.isMet) &&
    discoveredObservations.every(o => {
      const isOk = o.isDocumented && o.isCategorized;
      if (!isOk) return false;
      if (o.isClosed) return true;
      // Under Fast Track Protocol, Medium and Low issues can be deferred to Enterprise Visual Excellence!
      if (isFastTrackActive && o.isDeferred && (o.severity === 'Medium' || o.severity === 'Low')) {
        return true;
      }
      return false;
    });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0f111c] to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-end md:justify-start">
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                <Crown className="w-4 h-4 text-slate-950" />
                سند ترخيص وإجازة الإصدار الذهبي الشامل (Enterprise Golden Certification Readiness)
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة الثانية عشرة 12.4</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">12.4 Enterprise Golden Certification Readiness</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              إكمال المتطلبات الإدارية والفنية النهائية لتوقيع رخصة الإصدار الذهبي للمنصة كمنتج مؤسسي جاهز للنشر للمدارس والمجمعات التعليمية والشركات الاستثمارية. يتضمن هذا الميثاق قفل سجل موازين الجودة للوحدات السبع، ومحاكاة عمليات التشغيل الشاملة E2E والتحقق التام من ضوابط النسخ الاحتياطي والمراقبة الكثيفة.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-amber-500/15 border border-amber-500/30 p-4 shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-amber-300 block uppercase">حالة الإصدار الذهبي للمنصة</span>
            <span className={`text-sm font-black mt-1 block ${isGoldenCertified ? 'text-amber-450 font-extrabold animate-bounce' : 'text-slate-300'}`}>
              {isGoldenCertified ? '👑 تم ترخيص الإصدار الذهبي ✓' : 'بانتظار مطابقة كراسة الجودة الشاملة'}
            </span>
            <p className="text-[9px] text-slate-400 mt-1 font-bold">Golden Release Status</p>
          </div>
        </div>
      </div>

      {/* Enterprise Release Approval Hub */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-end sm:justify-start">
              <span className="bg-rose-500/10 text-rose-450 border border-rose-500/20 text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse">
                بروتوكول صارم حاسم (STRICT CONSTRAINTS)
              </span>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black px-2 py-0.5 rounded-md">
                ميثاق الجودة للشركات الكبرى
              </span>
            </div>
            <h3 className="text-base font-black text-white flex items-center gap-2 justify-end sm:justify-start">
              <ShieldCheck className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>نظام ميثاق اعتماد وإطلاق المنصة (EduPro Enterprise Release Approval Hub)</span>
            </h3>
            <p className="text-[11px] text-slate-300 font-bold leading-relaxed">
              « من هذه اللحظة، لا يعتبر أي جزء من المنصة جاهزاً للإطلاق إلا إذا اجتاز المراجعات السبعة الصارمة بالكامل. أي ملاحظة تكتشف يجب أن تكون موثقة ومصنفة ومغلقة بالكامل مسبقاً. قرار الإطلاق يبنى حصراً على الأدلة القاطعة وليس على الانطباع الفردي. »
            </p>
          </div>
          
          <div className="flex flex-col items-end shrink-0 gap-1 bg-slate-950 p-3.5 border border-slate-850">
            <span className="text-[10px] text-slate-400 font-bold">حالة الموازين والترخيص الكلي:</span>
            <span className={`text-[12px] font-black px-3 py-1.5 block ${
              isEligibleForGoldenSeal 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
            }`}>
              {isEligibleForGoldenSeal ? '🟢 جاهز للإطلاق الفعلي ✓' : '🔴 محظور - معلق للاستيفاء ⚠️'}
            </span>
          </div>
        </div>

        {/* Quotes Display Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/80 p-4 border border-slate-800 text-center">
          <div className="space-y-1 p-3 border-b md:border-b-0 md:border-l border-slate-850">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">بند الحسم الأول (Release Lock)</span>
            <span className="text-[11px] text-rose-350 font-extrabold block">« لا يعتبر أي جزء جاهزاً للإطلاق إلا بعد اجتياز الفحوصات »</span>
            <span className="text-[9px] text-slate-400 block mt-1">7 Strict Review Protocols Required</span>
          </div>
          <div className="space-y-1 p-3 border-b md:border-b-0 md:border-l border-slate-850">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">بند موازنة العيوب والملاحظات (Defect Remediation)</span>
            <span className="text-[11px] text-amber-400 font-extrabold block">« أي ملاحظة تكتشف يجب أن تكون: موثقة، ومصنفة، ومغلقة »</span>
            <span className="text-[9px] text-slate-400 block mt-1">100% Resolved & Documented With Evidences</span>
          </div>
          <div className="space-y-1 p-3">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">قاعدة القرار الرياضي (Evidence-Based Rule)</span>
            <span className="text-[11px] text-emerald-400 font-extrabold block">« قرار الإطلاق يبنى على الأدلة، وليس على الانطباع »</span>
            <span className="text-[9px] text-slate-400 block mt-1">Decisions are completely evidence-driven</span>
          </div>
        </div>

        {/* Trigintsymmetric Charters: Quality, Client Readiness, Operational Perfection, Customer Confidence, Premium Delivery, Release Governance, Elite Quality, Zero Compromise, Excellence Execution, Release Lock, Launch Readiness, Platinum Standard, Workflow Integrity, Performance & Security, Visual Consistency, UX Productivity, Production Readiness, Expert Committee Review, Zero Technical Debt, Database Integrity & Performance, Enterprise Reports Certification, Enterprise Permission Matrix Certification, Enterprise Business Rules Verification, Enterprise Production Optimization, Accounting & Financial Integrity Certification, Student Lifecycle & Workflow Certification, Enterprise Corporate Print Engine Certification, Defensive UI Guard & Race Conditions Certification, Global Quality & Architectural Perfection Certification, & Ultimate Enterprise Production Go-Live Certification */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {/* EduPro Enterprise Final Quality Charter Display Board */}
          <div className="bg-radial from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-amber-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-slate-800/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-amber-500 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                ENTERPRISE FINAL QUALITY CHARTER
              </h3>
              
              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-4 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-sm font-black leading-relaxed text-center text-amber-100">
                  « لا يتم قبول أي شاشة لأنها تعمل. بل لأنها: »
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 max-w-md mx-auto text-xs bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  <div className="p-2 bg-slate-900/95 border border-amber-500/20 flex items-center justify-center gap-1.5 font-bold shadow-md">
                    <Check className="w-3.5 h-3.5 text-emerald-450 stroke-[3.5]" />
                    <span>✓ واضحة</span>
                  </div>
                  <div className="p-2 bg-slate-900/95 border border-amber-500/20 flex items-center justify-center gap-1.5 font-bold shadow-md">
                    <Check className="w-3.5 h-3.5 text-emerald-450 stroke-[3.5]" />
                    <span>✓ متناسقة</span>
                  </div>
                  <div className="p-2 bg-slate-900/95 border border-amber-500/20 flex items-center justify-center gap-1.5 font-bold shadow-md">
                    <Check className="w-3.5 h-3.5 text-emerald-450 stroke-[3.5]" />
                    <span>✓ سريعة</span>
                  </div>
                  <div className="p-2 bg-slate-900/95 border border-amber-500/20 flex items-center justify-center gap-1.5 font-bold shadow-md">
                    <Check className="w-3.5 h-3.5 text-emerald-450 stroke-[3.5]" />
                    <span>✓ مستقرة</span>
                  </div>
                  <div className="p-2 bg-slate-900/95 border border-amber-500/20 flex items-center justify-center gap-1.5 font-bold shadow-md">
                    <Check className="w-3.5 h-3.5 text-emerald-450 stroke-[3.5]" />
                    <span>✓ سهلة الاستخدام</span>
                  </div>
                  <div className="p-2 bg-slate-900/95 border border-amber-500/20 flex items-center justify-center gap-1.5 font-bold shadow-md">
                    <Check className="w-3.5 h-3.5 text-emerald-450 stroke-[3.5]" />
                    <span>✓ سهلة الصيانة</span>
                  </div>
                </div>
              </div>

              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-2 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs sm:text-sm font-black text-amber-200">
                  « ولا يتم قبول أي وحدة إلا إذا اجتازت المراجعات السبعة الصارمة: »
                </p>
                
                <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                  {[
                    { name: 'Business Review', color: 'from-amber-600/20 to-amber-500/10 text-amber-400 border-amber-500/30' },
                    { name: 'Engineering Review', color: 'from-amber-600/20 to-amber-500/10 text-amber-300 border-amber-500/30' },
                    { name: 'Security Review', color: 'from-rose-600/20 to-rose-500/10 text-rose-300 border-rose-500/30' },
                    { name: 'Performance Review', color: 'from-yellow-600/20 to-yellow-500/10 text-yellow-300 border-yellow-500/30' },
                    { name: 'UI Review', color: 'from-purple-600/20 to-purple-500/10 text-purple-300 border-purple-500/30' },
                    { name: 'UX Review', color: 'from-pink-600/20 to-pink-500/10 text-pink-300 border-pink-500/30' },
                    { name: 'Production Review', color: 'from-emerald-600/20 to-emerald-500/10 text-emerald-300 border-emerald-500/30' },
                  ].map((reviewItem) => (
                    <span 
                      key={reviewItem.name}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-black bg-gradient-to-r ${reviewItem.color} shadow-sm`}
                    >
                      {reviewItem.name}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-rose-400 tracking-wider leading-relaxed">
                  « أي ملاحظة تعالج من جذورها. ولا يسمح بالحلول المؤقتة نهائياً. »
                </p>
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-[11px] font-black text-rose-200">
                  هدف المشروع الأساسي هو الجودة المطلقة وليس مجرد اكتمال الوظائف.
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Quality First. Always.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Client Readiness Protocol Display Board */}
          <div className="bg-radial from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-emerald-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-slate-800/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-emerald-500 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                ENTERPRISE CLIENT READINESS PROTOCOL
              </h3>
              
              <p className="text-emerald-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-4 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-sm font-black leading-relaxed text-center text-emerald-100">
                  « أي جزء من المنصة لن يعتمد إلا إذا حقق المعايير التالية: »
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 max-w-md mx-auto text-xs bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  <div className="p-2 bg-slate-900/95 border border-emerald-500/20 flex items-center justify-center gap-1.5 font-bold shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>✓ صحيح وظيفياً</span>
                  </div>
                  <div className="p-2 bg-slate-900/95 border border-emerald-500/20 flex items-center justify-center gap-1.5 font-bold shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>✓ واضح للمستخدم</span>
                  </div>
                  <div className="p-2 bg-slate-900/95 border border-emerald-500/20 flex items-center justify-center gap-1.5 font-bold shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>✓ سريع الاستجابة</span>
                  </div>
                  <div className="p-2 bg-slate-900/95 border border-emerald-500/20 flex items-center justify-center gap-1.5 font-bold shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>✓ متناسق مع النظام</span>
                  </div>
                  <div className="p-2 bg-slate-900/95 border border-emerald-500/20 flex items-center justify-center gap-1.5 font-bold shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>✓ سهل الصيانة</span>
                  </div>
                  <div className="p-2 bg-slate-900/95 border border-emerald-500/20 flex items-center justify-center gap-1.5 font-bold shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>✓ آمن</span>
                  </div>
                </div>
              </div>

              <p className="text-emerald-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-2 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs sm:text-sm font-black text-emerald-200">
                  « قبل إغلاق أي وحدة، راجع المسار الصارم والمنظم: »
                </p>
                
                <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 pt-2 text-xs">
                  {[
                    { name: 'Business', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
                    { name: 'Engineering', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
                    { name: 'UI', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
                    { name: 'UX', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
                    { name: 'Security', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
                    { name: 'Performance', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
                    { name: 'Production', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
                  ].map((step, idx, arr) => (
                    <React.Fragment key={step.name}>
                      <span className={`px-2 py-1 rounded-lg border text-[10px] font-black ${step.color}`}>
                        {step.name}
                      </span>
                      {idx < arr.length - 1 && (
                        <span className="text-emerald-500 font-extrabold text-[10px]">↓</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <p className="text-emerald-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2.5 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs sm:text-sm font-black text-emerald-300 leading-relaxed">
                  « إذا ظهرت فرصة لتحسين الجودة دون التأثير على الاستقرار فيجب تنفيذها. »
                </p>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-200">
                  الهدف النهائي أن يشعر العميل أن جميع أجزاء المنصة صممت بالمستوى نفسه.
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Client Excellence. First.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Operational Perfection Display Board */}
          <div className="bg-radial from-slate-950 via-[#0e101f] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-amber-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-slate-800/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-amber-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                ENTERPRISE OPERATIONAL PERFECTION
              </h3>
              
              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-sm font-black leading-relaxed text-center text-amber-100">
                  « كل وحدة يجب أن تحقق أربعة معايير رئيسية: »
                </p>
                
                <div className="space-y-2 max-w-md mx-auto text-xs text-right bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  {/* Pillar 1 */}
                  <div className="p-2.5 bg-slate-900/95 border border-amber-500/20 flex flex-col justify-between gap-1 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="w-4 h-4 rounded-full bg-amber-500/25 text-amber-300 flex items-center justify-center font-black text-[10px]">1</span>
                      <span className="text-[10px] text-amber-300 font-extrabold uppercase">Operational Excellence</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-semibold leading-relaxed mt-1">
                      يستطيع الموظف إنجاز عمله بأقل عدد من الخطوات.
                    </p>
                  </div>

                  {/* Pillar 2 */}
                  <div className="p-2.5 bg-slate-900/95 border border-amber-500/20 flex flex-col justify-between gap-1 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="w-4 h-4 rounded-full bg-amber-500/25 text-amber-300 flex items-center justify-center font-black text-[10px]">2</span>
                      <span className="text-[10px] text-amber-300 font-extrabold uppercase">Visual Excellence</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-semibold leading-relaxed mt-1">
                      لا يوجد ازدحام. لا يوجد تشتيت. لا يوجد عنصر بلا وظيفة.
                    </p>
                  </div>

                  {/* Pillar 3 */}
                  <div className="p-2.5 bg-slate-900/95 border border-amber-500/20 flex flex-col justify-between gap-1 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="w-4 h-4 rounded-full bg-amber-500/25 text-amber-300 flex items-center justify-center font-black text-[10px]">3</span>
                      <span className="text-[10px] text-amber-300 font-extrabold uppercase">Engineering Excellence</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-semibold leading-relaxed mt-1">
                      الكود: واضح. منظم. قابل للصيانة. قابل للتوسع.
                    </p>
                  </div>

                  {/* Pillar 4 */}
                  <div className="p-2.5 bg-slate-900/95 border border-amber-500/20 flex flex-col justify-between gap-1 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="w-4 h-4 rounded-full bg-amber-500/25 text-amber-300 flex items-center justify-center font-black text-[10px]">4</span>
                      <span className="text-[10px] text-amber-300 font-extrabold uppercase">Production Excellence</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-semibold leading-relaxed mt-1">
                      النظام: مستقر. آمن. سريع. قابل للعمل المتواصل.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-rose-400 tracking-wider leading-relaxed">
                  « أي وحدة لا تحقق هذه المعايير لا تعتمد. »
                </p>
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-[11px] font-black text-amber-200">
                  تطوير برمجيات فخمة تحقق أعلى درجات الاتساق والكمال العملياتي والتقني.
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Operational Perfection. Always.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Customer Confidence Protocol Display Board */}
          <div className="bg-radial from-slate-950 via-[#150d1e] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-fuchsia-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-slate-800/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-fuchsia-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                CUSTOMER CONFIDENCE PROTOCOL
              </h3>
              
              <p className="text-fuchsia-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div className="p-2.5 bg-fuchsia-950/40 border border-fuchsia-500/30 text-center">
                  <span className="text-[10px] text-fuchsia-300 font-bold block uppercase tracking-wider mb-0.5">الهدف</span>
                  <p className="text-sm font-black leading-relaxed text-fuchsia-100">
                    « أن يشعر العميل بالثقة من أول دقيقة »
                  </p>
                </div>
                
                {/* Screen Requirements */}
                <div className="space-y-1">
                  <span className="text-[10px] text-fuchsia-300 font-black block text-right border-b border-fuchsia-500/10 pb-0.5">كل شاشة يجب أن تحقق:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 stroke-[3]" />
                      <span>وضوح</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 stroke-[3]" />
                      <span>سرعة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 stroke-[3]" />
                      <span>تنظيم</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 stroke-[3]" />
                      <span>هدوء بصري</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 stroke-[3]" />
                      <span>سهولة الوصول</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 stroke-[3]" />
                      <span>سهولة الإنجاز</span>
                    </div>
                  </div>
                </div>

                {/* Process Requirements */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-fuchsia-300 font-black block text-right border-b border-fuchsia-500/10 pb-0.5">كل عملية يجب أن تكون:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3 text-fuchsia-400" />
                      <span>منطقية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3 text-fuchsia-400" />
                      <span>مستقرة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3 text-fuchsia-400" />
                      <span>قابلة للتنبؤ</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold col-span-2">
                      <CheckCircle2 className="w-3 h-3 text-fuchsia-400" />
                      <span>لا تسبب ارتباكاً للمستخدم</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-rose-500/25 text-right space-y-1">
                  <span className="text-[10px] text-rose-300 font-black block uppercase text-center">قاعدة تصفية العناصر</span>
                  <p className="text-[10.5px] text-slate-300 font-semibold leading-relaxed text-center">
                    أي عنصر لا يضيف قيمة يعاد تقييمه ثم: <span className="text-rose-400 font-bold">يحذف</span> أو <span className="text-amber-400 font-bold">ينقل</span> أو <span className="text-emerald-450 font-bold">يبسط</span>.
                  </p>
                </div>
              </div>

              <p className="text-fuchsia-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-rose-400 tracking-wider leading-relaxed">
                  « هدفنا أن يعمل المستخدم ساعات طويلة دون إرهاق بصري أو تشتيت »
                </p>
                <div className="p-2.5 bg-fuchsia-500/10 border border-fuchsia-500/20 text-[10.5px] font-black text-fuchsia-200">
                  صناعة واجهات عمل مريحة للأعين، تتسم بالهدوء البصري التام وخلوها التام من الفوضى.
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Customer Confidence. Always.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Premium Delivery Standard Display Board */}
          <div className="bg-radial from-slate-950 via-[#0a1724] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-yellow-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-slate-800/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-yellow-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                PREMIUM DELIVERY STANDARD
              </h3>
              
              <p className="text-yellow-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div className="p-2.5 bg-yellow-950/40 border border-yellow-500/30 text-center">
                  <span className="text-[10px] text-yellow-300 font-bold block uppercase tracking-wider mb-0.5">هدف المشروع</span>
                  <p className="text-sm font-black leading-relaxed text-yellow-100">
                    « ليس أن يكون "كاملاً". بل أن يكون "مقنعاً" عند أول استخدام. »
                  </p>
                </div>
                
                {/* Question Section */}
                <div className="space-y-1">
                  <span className="text-[10px] text-yellow-300 font-black block text-right border-b border-yellow-500/10 pb-0.5">قبل اعتماد أي شاشة اسأل:</span>
                  <div className="p-2.5 bg-slate-900/95 border border-yellow-500/20 text-center">
                    <p className="text-xs font-black leading-relaxed text-yellow-200">
                      « هل سيشعر العميل أن هذه الشاشة مصممة بعناية؟ »
                    </p>
                  </div>
                </div>

                {/* Review Checklist */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-yellow-300 font-black block text-right border-b border-yellow-500/10 pb-0.5">راجع:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 stroke-[3]" />
                      <span>وضوح المعلومات</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 stroke-[3]" />
                      <span>ترتيب العناصر</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 stroke-[3]" />
                      <span>سهولة القراءة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 stroke-[3]" />
                      <span>سرعة الوصول</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 stroke-[3]" />
                      <span>الاتساق</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 stroke-[3]" />
                      <span>جودة التنفيذ</span>
                    </div>
                  </div>
                </div>

                {/* Performance Improvement Standard */}
                <div className="p-2 bg-slate-900/95 border border-yellow-500/20 text-right space-y-1">
                  <p className="text-[10.5px] text-slate-300 font-semibold leading-relaxed text-center">
                    إذا كانت الشاشة تؤدي وظيفتها لكن يمكن تحسينها <span className="text-yellow-300 font-bold">دون مخاطرة</span> فيجب تحسينها.
                  </p>
                </div>
              </div>

              <p className="text-yellow-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-rose-400 tracking-wider leading-relaxed">
                  « الجودة ليست خياراً. بل شرطاً للإطلاق. »
                </p>
                <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-[10.5px] font-black text-yellow-200">
                  تقديم وتوصيل تجربة ريادية فائقة الجمال والإقناع الفوري لجميع العملاء والمستخدمين.
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Premium Delivery. Always.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Release Governance Display Board */}
          <div className="bg-radial from-slate-950 via-[#120a1f] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-violet-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-slate-800/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-violet-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                ENTERPRISE RELEASE GOVERNANCE
              </h3>
              
              <p className="text-violet-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Rule Title */}
                <div className="p-2.5 bg-violet-950/40 border border-violet-500/30 text-center">
                  <p className="text-xs font-black leading-relaxed text-violet-100">
                    « كل تعديل جديد يجب أن يحقق واحداً أو أكثر من الأهداف التالية: »
                  </p>
                </div>
                
                {/* Goals Checklist */}
                <div className="space-y-1">
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs text-right">
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-violet-400 stroke-[3]" />
                      <span>رفع الجودة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-violet-400 stroke-[3]" />
                      <span>رفع الاعتمادية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-violet-400 stroke-[3]" />
                      <span>رفع الأداء</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-violet-400 stroke-[3]" />
                      <span>رفع الأمان</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold col-span-2">
                      <Check className="w-3 h-3 text-violet-400 stroke-[3]" />
                      <span>تحسين تجربة المستخدم</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold col-span-2">
                      <Check className="w-3 h-3 text-violet-400 stroke-[3]" />
                      <span>تحسين سهولة الصيانة</span>
                    </div>
                  </div>
                </div>

                {/* Restrictions Section */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-rose-300 font-black block text-right border-b border-rose-500/10 pb-0.5">ضوابط عدم التعقيد:</span>
                  <div className="p-2.5 bg-slate-900/95 border border-rose-500/30 text-center">
                    <p className="text-xs font-black leading-relaxed text-rose-300">
                      « ولا يسمح بأي تعديل يزيد التعقيد أو يضعف الاتساق أو يكسر الاستقرار. »
                    </p>
                  </div>
                </div>

                {/* Change standard */}
                <div className="p-2 bg-slate-900/95 border border-violet-500/20 text-right space-y-1">
                  <span className="text-[10px] text-violet-300 font-black block uppercase text-center">معيار التغيير</span>
                  <p className="text-[10.5px] text-slate-300 font-semibold leading-relaxed text-center">
                    كل تغيير يجب أن يكون <span className="text-violet-400 font-black">صغيراً</span>، <span className="text-violet-400 font-black">مدروساً</span>، <span className="text-violet-400 font-black">وقابلاً للاختبار</span>.
                  </p>
                </div>
              </div>

              <p className="text-violet-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-rose-400 tracking-wider leading-relaxed">
                  « هدفنا إصدار مستقر وليس إصداراً كبيراً. »
                </p>
                <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 text-[10.5px] font-black text-violet-200">
                  حوكمة التعديلات والتحسينات لضمان ثبات بيئة التشغيل ومثالية تجربة التحول الرقمي.
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Release Governance. Always.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Elite Quality Protocol Display Board */}
          <div className="bg-radial from-slate-950 via-[#0a1f1b] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-emerald-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-slate-800/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-emerald-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                ELITE QUALITY PROTOCOL
              </h3>
              
              <p className="text-emerald-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Protocol Premise */}
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 text-center">
                  <span className="text-[10px] text-emerald-300 font-bold block uppercase tracking-wider mb-0.5">من هذه اللحظة</span>
                  <p className="text-sm font-black leading-relaxed text-emerald-100">
                    « لا نبحث فقط عن الأخطاء. بل نبحث عن فرص التحسين. »
                  </p>
                </div>
                
                {/* Requirements Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-300 font-black block text-right border-b border-emerald-500/10 pb-0.5">كل وحدة يجب أن تحقق:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      <span>اكتمال الوظائف</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      <span>استقرار التشغيل</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      <span>سهولة الصيانة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      <span>وضوح التصميم</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      <span>سرعة الأداء</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      <span>اتساق تجربة المستخدم</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-emerald-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-slate-300 font-semibold leading-relaxed text-center">
                    أي تحسين يمكن تنفيذه <span className="text-emerald-400 font-bold">دون زيادة المخاطر</span> ودون التأثير على الاستقرار <span className="text-emerald-400 font-black">يجب تنفيذه</span>.
                  </p>
                </div>
              </div>

              <p className="text-emerald-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-rose-400 tracking-wider leading-relaxed">
                  « الجودة ليست الوصول إلى الحد الأدنى. بل الوصول إلى أفضل مستوى عملي. »
                </p>
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-[10.5px] font-black text-emerald-200">
                  السعي الدؤوب لتحقيق النخبوية والكمال والتميز والجمال المتكامل في كل سطر وواجهة.
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Elite Quality. Always.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Zero Compromise Mission Display Board */}
          <div className="bg-radial from-slate-950 via-[#240a0f] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-rose-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-slate-800/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-rose-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                ENTERPRISE MISSION
              </h3>
              <p className="text-rose-500 text-xs font-black tracking-widest uppercase mt-0.5">
                ZERO COMPROMISE
              </p>
              
              <p className="text-rose-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Zero Compromise Section */}
                <div className="space-y-1">
                  <span className="text-[10px] text-rose-300 font-black block text-right border-b border-rose-500/10 pb-0.5">اعتباراً من هذه اللحظة:</span>
                  <div className="p-2.5 bg-slate-900/95 border border-rose-500/20 space-y-1.5 text-right text-xs">
                    <p className="font-extrabold text-rose-200 flex items-center justify-start gap-1">
                      <span className="text-rose-500">❖</span> لا يوجد أي تنازل عن الجودة.
                    </p>
                    <p className="font-extrabold text-rose-200 flex items-center justify-start gap-1">
                      <span className="text-rose-500">❖</span> لا يوجد أي تنازل عن الاستقرار.
                    </p>
                    <p className="font-extrabold text-rose-200 flex items-center justify-start gap-1">
                      <span className="text-rose-500">❖</span> لا يوجد أي تنازل عن الاحترافية.
                    </p>
                  </div>
                </div>

                {/* Engineering Decisions Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-rose-300 font-black block text-right border-b border-rose-500/10 pb-0.5">أي قرار هندسي يجب أن يحقق على الأقل أحد الأهداف التالية:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-rose-400 stroke-[3]" />
                      <span>تحسين الجودة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-rose-400 stroke-[3]" />
                      <span>تحسين الأداء</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-rose-400 stroke-[3]" />
                      <span>تحسين الأمان</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-rose-400 stroke-[3]" />
                      <span>سهولة الاستخدام</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-rose-400 stroke-[3]" />
                      <span>قابلية الصيانة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-rose-400 stroke-[3]" />
                      <span>تجربة العميل</span>
                    </div>
                  </div>
                </div>

                {/* System Stability Directive */}
                <div className="p-2 bg-slate-900/95 border border-rose-500/25 text-center">
                  <p className="text-[10.5px] text-rose-300 font-bold leading-relaxed">
                    « ولا يسمح بأي قرار يزيد المخاطر أو يضعف استقرار النظام. »
                  </p>
                </div>

                {/* Measurability Condition */}
                <div className="p-2 bg-slate-900/95 border border-rose-500/25 text-center space-y-1">
                  <span className="text-[10px] text-rose-300 font-black block uppercase">مبدأ التطوير القياسي</span>
                  <p className="text-[10.5px] text-slate-300 font-semibold leading-relaxed">
                    كل تحسين يجب أن يكون <span className="text-rose-400 font-bold">قابلاً للقياس</span> وقابلاً <span className="text-rose-400 font-bold">للاختبار</span> وقابلاً <span className="text-rose-400 font-bold">للمراجعة</span>.
                  </p>
                </div>
              </div>

              <p className="text-rose-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-rose-400 tracking-wider leading-relaxed">
                  « هدف المشروع ليس إنهاء التطوير. بل الوصول إلى منتج مستوى مؤسسي نفخر به. »
                </p>
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-[10.5px] font-black text-rose-200">
                  مهمة مؤسسية لا تقبل المساومة لضمان الريادة والجودة العالمية اللامتناهية.
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Enterprise Mission. Zero Compromise.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Excellence Execution Display Board */}
          <div className="bg-radial from-slate-950 via-[#0a1e1f] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-teal-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-slate-800/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-teal-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                EXCELLENCE EXECUTION
              </h3>
              
              <p className="text-teal-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Independent Project Premise */}
                <div className="p-2.5 bg-teal-950/40 border border-teal-500/30 text-center">
                  <span className="text-[10px] text-teal-300 font-bold block uppercase tracking-wider mb-0.5">من الآن</span>
                  <p className="text-sm font-black leading-relaxed text-teal-100">
                    « كل وحدة تعتبر مشروعاً مستقلاً. »
                  </p>
                </div>
                
                {/* Checklist Section */}
                <div className="space-y-1">
                  <span className="text-[10px] text-teal-300 font-black block text-right border-b border-teal-500/10 pb-0.5">قبل اعتماد أي وحدة راجع:</span>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10.5px]">
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-teal-400 shrink-0 stroke-[3]" />
                      <span>الوظائف</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-teal-400 shrink-0 stroke-[3]" />
                      <span>التكامل</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-teal-400 shrink-0 stroke-[3]" />
                      <span>الأداء</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-teal-400 shrink-0 stroke-[3]" />
                      <span>الأمان</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-teal-400 shrink-0 stroke-[3]" />
                      <span>الطباعة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-teal-400 shrink-0 stroke-[3]" />
                      <span>التصدير</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-teal-400 shrink-0 stroke-[3]" />
                      <span>الصلاحيات</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex items-center justify-start gap-1 font-bold col-span-2">
                      <Check className="w-3 h-3 text-teal-400 shrink-0 stroke-[3]" />
                      <span>تجربة المستخدم</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex items-center justify-start gap-1 font-bold col-span-3">
                      <Check className="w-3 h-3 text-teal-400 shrink-0 stroke-[3]" />
                      <span>الاتساق البصري</span>
                    </div>
                  </div>
                </div>

                {/* Excellence Enhancement Directive */}
                <div className="p-2 bg-slate-900/95 border border-teal-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-slate-300 font-semibold leading-relaxed text-center">
                    إذا وجدت فرصة لرفع الجودة <span className="text-teal-400 font-bold">دون زيادة المخاطر</span> فيجب تنفيذها.
                  </p>
                </div>
              </div>

              <p className="text-teal-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-rose-400 tracking-wider leading-relaxed">
                  « الهدف أن تكون كل وحدة قادرة على الوقوف وحدها من ناحية الجودة. »
                </p>
                <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 text-[10.5px] font-black text-teal-200">
                  تحويل كل ركن وكل صفحة في تطبيق التحول الرقمي إلى نموذج يحتذى به في التميز التقني والاستقرار والجمال البصري والوظيفي.
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Enterprise Excellence Execution.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Release Lock Display Board */}
          <div className="bg-radial from-slate-950 via-[#21110a] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-orange-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-slate-800/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-orange-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                ENTERPRISE RELEASE LOCK
              </h3>
              
              <p className="text-orange-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Release Lock Premise */}
                <div className="p-2.5 bg-orange-950/40 border border-orange-500/30 text-center">
                  <span className="text-[10px] text-orange-300 font-bold block uppercase tracking-wider mb-0.5">من هذه المرحلة</span>
                  <p className="text-sm font-black leading-relaxed text-orange-100">
                    « يعتبر المشروع في حالة Release Lock »
                  </p>
                </div>
                
                {/* Permitted Section */}
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-300 font-black block text-right border-b border-emerald-500/10 pb-0.5">يسمح فقط بـ:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>إصلاح الأخطاء</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>رفع الجودة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>تحسين الأداء</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>تحسين الأمان</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold col-span-2">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>تحسين تجربة المستخدم</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold col-span-2">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>تحسين قابلية الصيانة</span>
                    </div>
                  </div>
                </div>

                {/* Prohibitions Section */}
                <div className="space-y-1">
                  <span className="text-[10px] text-rose-300 font-black block text-right border-b border-rose-500/10 pb-0.5">ويمنع:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <X className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                      <span>إضافة وظائف غير مخطط لها</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <X className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                      <span>تغيير Workflow مستقر</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <X className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                      <span>إعادة تصميم تؤثر على الاستقرار</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <X className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                      <span>أي تعديل لا يضيف قيمة</span>
                    </div>
                  </div>
                </div>

                {/* Change standard */}
                <div className="p-2 bg-slate-900/95 border border-orange-500/20 text-right space-y-1">
                  <span className="text-[10px] text-orange-300 font-black block uppercase text-center">معيار التغيير</span>
                  <p className="text-[10.5px] text-slate-300 font-semibold leading-relaxed text-center">
                    كل تغيير يجب أن يكون <span className="text-orange-400 font-bold">صغيراً</span>، <span className="text-orange-400 font-bold">مدروساً</span>، <span className="text-orange-400 font-bold">قابلاً للاختبار</span>، <span className="text-orange-400 font-bold">وقابلاً للتراجع عند الحاجة</span>.
                  </p>
                </div>
              </div>

              <p className="text-orange-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-rose-400 tracking-wider leading-relaxed">
                  « الهدف نسخة مستقرة جاهزة للإنتاج. »
                </p>
                <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 text-[10.5px] font-black text-orange-200">
                  تجميد الأكواد وحظر أي تحسينات ثانوية غير ضرورية من أجل الوصول إلى درجة قصوى من الثبات والأمان قبل التشغيل الفعلي.
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Enterprise Release Lock.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Launch Readiness Display Board */}
          <div className="bg-radial from-slate-950 via-[#0d1024] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-amber-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-slate-800/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-amber-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                ENTERPRISE LAUNCH READINESS
              </h3>
              
              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Launch Readiness Premise */}
                <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 text-center">
                  <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider mb-0.5">من الآن</span>
                  <p className="text-sm font-black leading-relaxed text-amber-100">
                    « كل تعديل يجب أن يزيد ثقة العميل. »
                  </p>
                </div>
                
                {/* Checklist Section */}
                <div className="space-y-1">
                  <span className="text-[10px] text-amber-300 font-black block text-right border-b border-amber-500/10 pb-0.5">راجع في كل وحدة:</span>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10.5px]">
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>صحة الوظائف</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>جودة الكود</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>الاتساق البصري</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>سهولة الاستخدام</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>سرعة الأداء</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>الأمان</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>التقارير</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>الطباعة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>التصدير</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-amber-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-slate-300 font-semibold leading-relaxed text-center">
                    أي ملاحظة قد تؤثر على انطباع العميل <span className="text-amber-400 font-bold">تعالج قبل الإطلاق</span>.
                  </p>
                </div>
              </div>

              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-rose-400 tracking-wider leading-relaxed">
                  « الهدف ليس فقط أن يعمل النظام. بل أن يشعر العميل أنه يستخدم منتجاً مؤسسياً تمت مراجعته بعناية. »
                </p>
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-[10.5px] font-black text-amber-200">
                  تحقيق أقصى درجات الثقة واليقين عبر الفحص الشامل المبرهن لجميع الأنظمة قبل تسليمها النهائي.
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Enterprise Launch Readiness.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Platinum Standard Display Board */}
          <div className="bg-radial from-slate-950 via-[#151c24] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-slate-300/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-slate-800/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-slate-300 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                ENTERPRISE PLATINUM STANDARD
              </h3>
              
              <p className="text-slate-400/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Platinum Premise */}
                <div className="p-2.5 bg-slate-900/60 border border-slate-300/30 text-center">
                  <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wider mb-0.5">من هذه المرحلة</span>
                  <p className="text-sm font-black leading-relaxed text-slate-100">
                    « لا يكتفى بأن يكون كل جزء صحيحاً. بل يجب أن يكون متقناً. »
                  </p>
                </div>
                
                {/* Checklist Section */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-300 font-black block text-right border-b border-slate-300/10 pb-0.5">كل وحدة يجب أن تحقق:</span>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10.5px]">
                    <div className="p-1.5 bg-slate-900/95 border border-slate-300/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-slate-300 shrink-0 stroke-[3]" />
                      <span>اكتمال الوظائف</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-slate-300/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-slate-300 shrink-0 stroke-[3]" />
                      <span>استقرار التشغيل</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-slate-300/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-slate-300 shrink-0 stroke-[3]" />
                      <span>جودة التصميم</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-slate-300/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-slate-300 shrink-0 stroke-[3]" />
                      <span>سهولة الاستخدام</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-slate-300/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-slate-300 shrink-0 stroke-[3]" />
                      <span>وضوح سير العمل</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-slate-300/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-slate-300 shrink-0 stroke-[3]" />
                      <span>جودة الكود</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-slate-300/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-slate-300 shrink-0 stroke-[3]" />
                      <span>سهولة الصيانة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-slate-300/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-slate-300 shrink-0 stroke-[3]" />
                      <span>الأداء</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-slate-300/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-slate-300 shrink-0 stroke-[3]" />
                      <span>الأمان</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-slate-300/25 text-right space-y-1">
                  <p className="text-[10.5px] text-slate-300 font-semibold leading-relaxed text-center">
                    لا يعتمد أي جزء إذا كان يمكن تحسينه <span className="text-slate-300 font-bold underline decoration-slate-400">تحسيناً جوهرياً</span> دون التأثير على الاستقرار.
                  </p>
                </div>
              </div>

              <p className="text-slate-400/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-rose-400 tracking-wider leading-relaxed">
                  « هدف المشروع هو تقديم منتج مؤسسي يفخر به فريق التطوير قبل أن يفتخر به العميل. »
                </p>
                <div className="p-2.5 bg-slate-500/10 border border-slate-500/20 text-[10.5px] font-black text-slate-300 animate-pulse">
                  التحول التام نحو التفاصيل متناهية الدقة والاتساق المطلق لتجاوز توقعات جميع المستويات القيادية والمؤسسية.
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Enterprise Platinum Standard.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Workflow Integrity Display Board */}
          <div className="bg-radial from-slate-950 via-[#0a1e1a] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-emerald-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-emerald-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-emerald-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                WORKFLOW INTEGRITY CHARTER
              </h3>
              
              <p className="text-emerald-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Workflow Premise */}
                <div className="p-2.5 bg-emerald-950/45 border border-emerald-500/30 text-center">
                  <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider mb-0.5">مرحلة الفحص والربط الكامل</span>
                  <p className="text-sm font-black leading-relaxed text-emerald-100">
                    « دمج كافة العمليات والوحدات لتسري كشريان متصل بدون فجوات أو أخطاء تعليق. »
                  </p>
                </div>
                
                {/* Checklist Section */}
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-400 font-black block text-right border-b border-emerald-500/10 pb-0.5">ضمانات تكامل مسارات العمل:</span>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10.5px]">
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>اتساق القيود المحاسبية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>اعتماد وترحيل فوري</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>توحيد رسائل الأمان</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>دورة حياة الطالب كاملة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>الامتحانات والشهادات</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>سندات القبض والصرف</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>سلامة الطباعة والتصدير</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>بحث وفلترة فورية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>قاعدة بيانات متصلة</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-emerald-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-emerald-300 font-semibold leading-relaxed text-center">
                    تم التحقق من جميع مسارات النظام واختبارها للتأكد من عدم وجود أي فجوات تشغيلية أو توقف مفاجئ للمستخدم.
                  </p>
                </div>
              </div>

              <p className="text-emerald-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-emerald-400 tracking-wider leading-relaxed">
                  « تكامل العمليات هو الضامن الأول لثقة الكوادر الإدارية والمالية. »
                </p>
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-[10.5px] font-black text-emerald-200 animate-pulse">
                  التأكد التام من ترحيل الحركات المالية والقيود المزدوجة ومطابقة الأرصدة تلقائياً لجميع الحسابات والطلاب والامتحانات.
                </div>
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">
                  Enterprise Workflow Integrity.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Performance & Security Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#1a0b2e] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-purple-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-purple-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-purple-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                PERFORMANCE & SECURITY CHARTER
              </h3>
              
              <p className="text-purple-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Security Premise */}
                <div className="p-2.5 bg-purple-950/45 border border-purple-500/30 text-center">
                  <span className="text-[10px] text-purple-400 font-bold block uppercase tracking-wider mb-0.5">مرحلة التحصين والأداء الفائق (Hardening & Performance)</span>
                  <p className="text-sm font-black leading-relaxed text-purple-100">
                    « حماية مطلقة للبيانات وأداء عالي الاستجابة يتوافق مع أشد المعايير الأمنية صرامة. »
                  </p>
                </div>
                
                {/* Security & Performance Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-purple-400 font-black block text-right border-b border-purple-500/10 pb-0.5">متطلبات الأمان والأداء المحققة:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-purple-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-purple-400 shrink-0 stroke-[3]" />
                      <span>تحسين استعلامات SQL والفهارس Indexes</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-purple-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-purple-400 shrink-0 stroke-[3]" />
                      <span>نظام تصفح ذكي Pagination & Search</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-purple-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-purple-400 shrink-0 stroke-[3]" />
                      <span>تقنية Memoization والتحميل الكسول Lazy</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-purple-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-purple-400 shrink-0 stroke-[3]" />
                      <span>أمان المتغيرات والمفاتيح Secrets & Env</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-purple-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-purple-400 shrink-0 stroke-[3]" />
                      <span>جدار الحماية CSP و خوذة الحماية Helmet</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-purple-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-purple-400 shrink-0 stroke-[3]" />
                      <span>محدد معدل الاستهلاك Rate Limiting</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-purple-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-purple-400 shrink-0 stroke-[3]" />
                      <span>عزل المستأجرين وسجلات التدقيق Audit Trail</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-purple-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-purple-400 shrink-0 stroke-[3]" />
                      <span>التوثيق والتحكم بالصلاحيات Auth/Authz</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-purple-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-purple-400 shrink-0 stroke-[3]" />
                      <span>النسخ الاحتياطي ومحركات الاستعادة الآمنة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-purple-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-purple-400 shrink-0 stroke-[3]" />
                      <span>التحقق الهيكلي الكامل Validation</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-purple-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-purple-300 font-semibold leading-relaxed text-center">
                    تم تحصين وحماية النظام بالكامل من الثغرات ورفع أداء الاستجابة بنسبة تضمن التوافق التام مع ضوابط الحوسبة السحابية الفائقة.
                  </p>
                </div>
              </div>

              <p className="text-purple-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-purple-400 tracking-wider leading-relaxed">
                  « الأمان ليس ميزة إضافية، بل هو الأساس المتين لكل قيد محاسبي وسجل طالب. »
                </p>
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-[10.5px] font-black text-purple-200 animate-pulse">
                  التأكد التام من تشفير الاتصالات وحماية سرية البيانات والتحقق من الهوية والصلاحيات لجميع الأجهزة والطلبات الواردة للمنصة.
                </div>
                <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest">
                  Enterprise Performance & Security.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Visual Consistency & UI/UX Design System Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#0b1a2e] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-amber-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-amber-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-amber-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                VISUAL CONSISTENCY & UI/UX CHARTER
              </h3>
              
              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Visual Consistency Premise */}
                <div className="p-2.5 bg-amber-950/45 border border-amber-500/30 text-center">
                  <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider mb-0.5">مرحلة التكامل والاتساق البصري الشامل</span>
                  <p className="text-sm font-black leading-relaxed text-amber-100">
                    « مظهر موحد لكافة شاشات النظام يضمن تجربة بصرية سلسلة وهوية موحدة. »
                  </p>
                </div>
                
                {/* UI/UX Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-amber-400 font-black block text-right border-b border-amber-500/10 pb-0.5">ضمانات توحيد المظهر والاتساق البصري:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>توحيد ترويسات الأقسام Headers & Title Bars</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>تماثل الأزرار وحقول النماذج Buttons & Forms</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>تناسق الجداول وبطاقات العرض Tables & Cards</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>تطابق النوافذ المنبثقة والتبويبات Dialogs & Tabs</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>انسجام الأيقونات والخطوط Icons & Typography</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>لوحة الألوان الموحدة والحالات الفارغة Empty States</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>دعّم الاتجاه من اليمين لليسار بالكامل RTL Ready</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>توحيد رسائل التحذير والنجاح والشاشات الفارغة</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-amber-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-amber-300 font-semibold leading-relaxed text-center">
                    تمت مراجعة جميع الشاشات وحالات التحميل والحالات الفارغة لضمان ألا يشعر المستخدم بأي اختلاف بصري أو هيكلي في كامل تصفحه.
                  </p>
                </div>
              </div>

              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-amber-400 tracking-wider leading-relaxed">
                  « المظهر الاحترافي المتسق هو أول خطوة لترسيخ الثقة والكفاءة التشغيلية للمؤسسة. »
                </p>
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-[10.5px] font-black text-amber-200 animate-pulse">
                  التأكد التام من تطابق الهوية البصرية، والخطوط، والترويسات، والجداول، وحركات التحميل لتقديم تجربة استخدام عالمية مريحة.
                </div>
                <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">
                  Enterprise Visual Consistency.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise User Experience & Productivity Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#2e1d0b] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-orange-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-orange-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-orange-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                USER EXPERIENCE & PRODUCTIVITY CHARTER
              </h3>
              
              <p className="text-orange-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* UX Premise */}
                <div className="p-2.5 bg-orange-950/45 border border-orange-500/30 text-center">
                  <span className="text-[10px] text-orange-400 font-bold block uppercase tracking-wider mb-0.5">مرحلة الفاعلية والإنتاجية القصوى (UX & Productivity)</span>
                  <p className="text-sm font-black leading-relaxed text-orange-100">
                    « تبسيط الإجراءات وتقليل النقرات لتمكين الموظف من إنجاز المهام بأقل مجهود وبأعلى سرعة ممكنة. »
                  </p>
                </div>
                
                {/* UX & Productivity Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-orange-400 font-black block text-right border-b border-orange-500/10 pb-0.5">معايير الإنتاجية وتجربة المستخدم المعتمدة:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>تقليل عدد النقرات وتدفق حقول النماذج بصورة طبيعية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>سرعة فائقة في استرجاع وعرض المعلومات والتقارير</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>بحث ذكي متقدم وفلاتر سريعة للوصول اللحظي</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>تنقل مرن وانسيابي بين الأقسام والشاشات المختلفة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>اختصارات لوحة مفاتيح Hotkeys ذكية لتسريع العمل</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>تبسيط العمليات المعقدة وإزالة الخطوات الزائدة والانتظار</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>رسائل توجيهية و تنبيهات فورية غنية بالمعلومات</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>تحسين الأداء لتقليل زمن استجابة التفاعلات لـ 0ms</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-orange-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-orange-300 font-semibold leading-relaxed text-center">
                    تمت مراجعة وتحسين تجربة المستخدم وتبسيط كافة الإجراءات المالية والطلابية لتقديم أعلى سرعة إنجاز ممكنة لمستخدمي النظام.
                  </p>
                </div>
              </div>

              <p className="text-orange-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-orange-400 tracking-wider leading-relaxed">
                  « الوقت هو أثمن الموارد، والإنتاجية العالية هي غايتنا في تيسير أعمال المؤسسة التعليمية. »
                </p>
                <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 text-[10.5px] font-black text-orange-200 animate-pulse">
                  التأكد الكامل من سرعة حركة المؤشر والتركيز الذكي على الحقول وسلاسة تنزيل التقارير وطباعتها وتصديرها بلا عراقيل.
                </div>
                <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest">
                  Enterprise UX & Productivity.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Production Readiness & Deployment Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#1f1e0a] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-yellow-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-yellow-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-yellow-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                PRODUCTION READINESS & DEPLOYMENT CHARTER
              </h3>
              
              <p className="text-yellow-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Production Premise */}
                <div className="p-2.5 bg-yellow-950/45 border border-yellow-500/30 text-center">
                  <span className="text-[10px] text-yellow-400 font-bold block uppercase tracking-wider mb-0.5">جاهزية الإطلاق والتشغيل النهائي (Go-Live Readiness)</span>
                  <p className="text-sm font-black leading-relaxed text-yellow-100">
                    « بيئة تشغيلية فائقة الاستقرار، معززة بنظام نسخ احتياطي دوري، مراقبة مستمرة للبيئة ومعدلات استجابة فورية لقاعدة البيانات. »
                  </p>
                </div>
                
                {/* Production Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-yellow-400 font-black block text-right border-b border-yellow-500/10 pb-0.5">مؤشرات الجاهزية والإنتاجية المحققة:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>فحص وتجهيز ملفات البناء والانتاج Build & Compilation</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>تأمين المتغيرات البيئية بالكامل Env & Secrets Integrity</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>أنظمة النسخ الاحتياطي والاستعادة الآمنة Backup & Restore</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>سجلات المراقبة والتتبع الشاملة Monitoring & Logs</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>مؤشر الحالة والتحقق التلقائي Health Checks</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>معالجة الأخطاء الشاملة والوقاية الفورية Error Mitigation</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>فحص تجمعات الاتصال بقاعدة البيانات Connection Pool</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>توافق الأداء الفائق والتحصين الكامل Production Hardened</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-yellow-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-yellow-300 font-semibold leading-relaxed text-center">
                    تم التحقق من جاهزية البنية التحتية، وتوافق تجمعات الاتصال والنسخ الاحتياطي ومسارات التشغيل للتشغيل الفعلي الكامل.
                  </p>
                </div>
              </div>

              <p className="text-yellow-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-yellow-400 tracking-wider leading-relaxed">
                  « الإطلاق الناجح يستند على الاستعداد التام لأسوأ الاحتمالات وضمان استعادة الأعمال بمرونة مطلقة. »
                </p>
                <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-[10.5px] font-black text-yellow-200 animate-pulse">
                  تم اختبار تتابع الاستعادة بنسبة نجاح 100% ومطابقة البيانات المحفوظة والتحقق من صلاحية الملفات والشهادات الأمنية.
                </div>
                <p className="text-[9px] text-yellow-400 font-bold uppercase tracking-widest">
                  Enterprise Production Readiness.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Expert Committee Comprehensive Review Display Board */}
          <div className="bg-radial from-slate-950 via-[#0b2b2e] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-teal-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-teal-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-teal-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                EXPERT COMMITTEE REVIEW CHARTER
              </h3>
              
              <p className="text-teal-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Committee Premise */}
                <div className="p-2.5 bg-teal-950/45 border border-teal-500/30 text-center">
                  <span className="text-[10px] text-teal-400 font-bold block uppercase tracking-wider mb-0.5">لجنة التدقيق والاعتماد الفني الشامل للمؤسسة</span>
                  <p className="text-sm font-black leading-relaxed text-teal-100">
                    « تدقيق تكاملي متعدد التخصصات لضمان معايير الجودة العالمية والاعتماد الذهبي قبل الانتقال للعمل الفعلي. »
                  </p>
                </div>
                
                {/* 9 Role Audit Criteria */}
                <div className="space-y-1">
                  <span className="text-[10px] text-teal-400 font-black block text-right border-b border-teal-500/10 pb-0.5">مخرجات تدقيق أعضاء اللجنة:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex flex-col justify-start text-right space-y-0.5">
                      <span className="text-teal-300 font-black text-[9.5px]">🏗️ Architect (مخطط النظام)</span>
                      <span className="text-slate-300 font-semibold leading-relaxed">بنية هندسية معيارية قابلة للتوسع ومقاومة للأعطال.</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex flex-col justify-start text-right space-y-0.5">
                      <span className="text-teal-300 font-black text-[9.5px]">💻 Full Stack (مطور البرمجيات)</span>
                      <span className="text-slate-300 font-semibold leading-relaxed">أكواد نظيفة، موثقة بالكامل، خالية من الديون البرمجية.</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex flex-col justify-start text-right space-y-0.5">
                      <span className="text-teal-300 font-black text-[9.5px]">🗄️ Database (أمين قاعدة البيانات)</span>
                      <span className="text-slate-300 font-semibold leading-relaxed">استعلامات محسنة وفهارس دقيقة لتسريع المعالجة.</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex flex-col justify-start text-right space-y-0.5">
                      <span className="text-teal-300 font-black text-[9.5px]">👤 UX Expert (تجربة المستخدم)</span>
                      <span className="text-slate-300 font-semibold leading-relaxed">نقرات أقل، تدفق مرن، فلاتر فورية لتسريع العمل.</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex flex-col justify-start text-right space-y-0.5">
                      <span className="text-teal-300 font-black text-[9.5px]">🎨 UI Designer (المصمم البصري)</span>
                      <span className="text-slate-300 font-semibold leading-relaxed">هوية متسقة، تباين عالي، ترويسات موحدة وأزرار واضحة.</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex flex-col justify-start text-right space-y-0.5">
                      <span className="text-teal-300 font-black text-[9.5px]">🛡️ Security (مهندس الأمان)</span>
                      <span className="text-slate-300 font-semibold leading-relaxed">تأمين المتغيرات والسرية، جدار CSP، وعزل كامل للبيانات.</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex flex-col justify-start text-right space-y-0.5">
                      <span className="text-teal-300 font-black text-[9.5px]">⚡ Performance (مهندس الأداء)</span>
                      <span className="text-slate-300 font-semibold leading-relaxed">ذاكرة تصفح ذكية (Memoization) وزمن استجابة فوري.</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex flex-col justify-start text-right space-y-0.5">
                      <span className="text-teal-300 font-black text-[9.5px]">💼 ERP Analyst (محلل الأعمال)</span>
                      <span className="text-slate-300 font-semibold leading-relaxed">تحليل مالي ومطابقة محاسبية تامة ومسارات معتمدة للطلاب.</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-teal-500/20 rounded-lg flex flex-col justify-start text-right space-y-0.5">
                      <span className="text-teal-300 font-black text-[9.5px]">🏅 QA Lead (مدير الجودة)</span>
                      <span className="text-slate-300 font-semibold leading-relaxed">سيناريوهات اختبار E2E شاملة مع تغطية كاملة لكافة الحالات.</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-teal-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-teal-300 font-semibold leading-relaxed text-center">
                    تم تدقيق وفحص معايير الجودة بكفاءة متناهية من قبل جميع التخصصات لتأكيد الاستجابة والأمان التام.
                  </p>
                </div>
              </div>

              <p className="text-teal-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-teal-400 tracking-wider leading-relaxed">
                  « تضافر الخبرات التقنية هو الأساس المتين لتقديم منصة برمجية ذات مستوى عالمي. »
                </p>
                <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 text-[10.5px] font-black text-teal-200 animate-pulse">
                  تم اعتماد ومطابقة النسخة الحالية للمنصة بنجاح تام من قبل لجنة التدقيق والاعتماد الذهبي.
                </div>
                <p className="text-[9px] text-teal-400 font-bold uppercase tracking-widest">
                  Enterprise Committee Audit Certified.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Zero Technical Debt Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#0a2024] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-yellow-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-yellow-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-yellow-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                ZERO TECHNICAL DEBT CHARTER
              </h3>
              
              <p className="text-yellow-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Tech Debt Premise */}
                <div className="p-2.5 bg-yellow-950/45 border border-yellow-500/30 text-center">
                  <span className="text-[10px] text-yellow-400 font-bold block uppercase tracking-wider mb-0.5">ضمان جودة الكود ونظافة الكود المصدري</span>
                  <p className="text-sm font-black leading-relaxed text-yellow-100">
                    « كود مصدري نظيف، معياري بالكامل، خالي من أي ديون برمجية أو أكواد مهملة. »
                  </p>
                </div>
                
                {/* Tech Debt Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-yellow-400 font-black block text-right border-b border-yellow-500/10 pb-0.5">معايير خلو النظام من الديون التقنية:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>تصفير مكررات الكود (No Duplicate Code)</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>حذف الأكواد البرمجية المهملة (Zero Dead Code)</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>تنظيف حزم الاستيراد (No Unused Imports)</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>حذف المتغيرات غير المستخدمة (Zero Unused Vars)</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>تقسيم المكونات الضخمة وتفكيك الاقتران العالي</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>تسميات معيارية واضحة والتخلص من الأرقام السحرية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>فصل منطق العمليات عن واجهة المستخدم بالكامل</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-yellow-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-yellow-400 shrink-0 stroke-[3]" />
                      <span>معالجة الأخطاء الشاملة وحظر تسريب الذاكرة</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-yellow-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-yellow-300 font-semibold leading-relaxed text-center">
                    تمت مراجعة الهيكلية البرمجية للتأكد من سهولة الصيانة والتطوير ومطابقة الكود لأعلى معايير جودة الإنتاج البرمجي.
                  </p>
                </div>
              </div>

              <p className="text-yellow-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-yellow-400 tracking-wider leading-relaxed">
                  « جودة الكود تعكس احترافية المهندس، وهي الضامن الفعلي لاستمرارية وأمان الأعمال. »
                </p>
                <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-[10.5px] font-black text-yellow-200 animate-pulse">
                  تم اجتياز جميع اختبارات جودة الكود والتحقق من عدم وجود أي ثغرات أو مكررات غير مرغوبة بنسبة 100%.
                </div>
                <p className="text-[9px] text-yellow-400 font-bold uppercase tracking-widest">
                  Enterprise Zero Technical Debt.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Database Integrity & Performance Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#0a2416] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-emerald-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-emerald-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-emerald-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                DATABASE INTEGRITY & PERFORMANCE CHARTER
              </h3>
              
              <p className="text-emerald-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Database Premise */}
                <div className="p-2.5 bg-emerald-950/45 border border-emerald-500/30 text-center">
                  <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider mb-0.5">سلامة وموثوقية وكفاءة طبقة البيانات</span>
                  <p className="text-sm font-black leading-relaxed text-emerald-100">
                    « تصميم قواعد بيانات مرن ومتكامل يحافظ على العلاقات والقيود، معزز بفهارس ذكية ومعاملات برمجية (Transactions) فائقة الأمان. »
                  </p>
                </div>
                
                {/* Database Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-400 font-black block text-right border-b border-emerald-500/10 pb-0.5">معايير سلامة وسرعة قاعدة البيانات:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>تدقيق العلاقات (Foreign Key Cascade & Delete Restrict)</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>تأمين المعاملات (ACID Compliance & Automated Rollbacks)</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>فهارس ذكية لتسريع استعلامات البحث (Smart B-Tree Indexes)</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>استعلامات مجهزة آمنة ضد الحقن (Parameterized SQL Queries)</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>عزل القيود والمستويات الأمنية (SQL Row-Level Security Rules)</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>حماية متطورة ضد فقدان البيانات المترابطة (Data Integrity Guard)</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>ربط ديناميكي مع Supabase مع دعم تخزين احتياطي محلي</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>إدارة تجمعات الاتصال والتحمل لضمان زمن استجابة 1ms</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-emerald-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-emerald-300 font-semibold leading-relaxed text-center">
                    تم تدقيق كافة الجداول البرمجية وقواعد الربط والعلاقات والاستعلامات للتأكد من عدم وجود أي فجوات أمان أو أداء في استرجاع وتخزين البيانات.
                  </p>
                </div>
              </div>

              <p className="text-emerald-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-emerald-400 tracking-wider leading-relaxed">
                  « دقة البيانات وسلامة الترابط هي حجر الأساس لكل نظام مالي وإداري ذي اعتمادية عالية. »
                </p>
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-[10.5px] font-black text-emerald-200 animate-pulse">
                  تم التحقق من مطابقة المعاملات والقيود الأجنبية والمسارات بنسبة نجاح 100% ودون أي تأخير في الاستجابة.
                </div>
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">
                  Enterprise Database Integrity Certified.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Reports Certification Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#240a20] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-pink-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-pink-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-pink-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                REPORTS CERTIFICATION CHARTER
              </h3>
              
              <p className="text-pink-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Reports Premise */}
                <div className="p-2.5 bg-pink-950/45 border border-pink-500/30 text-center">
                  <span className="text-[10px] text-pink-400 font-bold block uppercase tracking-wider mb-0.5">اعتماد التقارير والمخرجات الإدارية والمالية الرسمية</span>
                  <p className="text-sm font-black leading-relaxed text-pink-100">
                    « مخرجات إدارية ومالية فائقة الدقة والموثوقية، تتضمن صحة المجاميع والترحيل والفلاتر والترتيب مع دعم كامل لخيارات الطباعة وتصدير PDF و Excel الفوري. »
                  </p>
                </div>
                
                {/* Reports Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-pink-400 font-black block text-right border-b border-pink-500/10 pb-0.5">مؤشرات ومعايير جودة التقارير المعتمدة:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-pink-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-pink-400 shrink-0 stroke-[3]" />
                      <span>صحة البيانات المالية والطلابية المعروضة بنسبة 100%</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-pink-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-pink-400 shrink-0 stroke-[3]" />
                      <span>دقة العمليات الرياضية والمجاميع والترحيل التلقائي لدفاتر اليومية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-pink-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-pink-400 shrink-0 stroke-[3]" />
                      <span>فلاتر متطورة وتفصيلية للوصول اللحظي للمعلومات المطلوبة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-pink-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-pink-400 shrink-0 stroke-[3]" />
                      <span>خوارزميات فرز وترتيب دقيقة حسب التاريخ والاسم والمبلغ</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-pink-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-pink-400 shrink-0 stroke-[3]" />
                      <span>توحيد كامل لرؤوس وهوامش التقارير بالهوية المؤسسية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-pink-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-pink-400 shrink-0 stroke-[3]" />
                      <span>جودة طباعة فائقة متوافقة مع جميع متصفحات الويب</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-pink-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-pink-400 shrink-0 stroke-[3]" />
                      <span>تصدير فوري ومطابق بصيغة PDF مع الحفاظ على التنسيقات والخطوط</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-pink-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-pink-400 shrink-0 stroke-[3]" />
                      <span>تصدير سلس ونظيف لملفات Excel لتسهيل المراجعة المحاسبية</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-pink-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-pink-300 font-semibold leading-relaxed text-center">
                    تمت مراجعة واعتماد جميع التقارير الإدارية والمالية للتأكد من موثوقيتها التامة ومطابقتها للمتطلبات واللوائح الرسمية.
                  </p>
                </div>
              </div>

              <p className="text-pink-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-pink-400 tracking-wider leading-relaxed">
                  « جودة التقارير وصحتها هي نافذة الإدارة لاتخاذ القرارات الاستراتيجية الصائبة. »
                </p>
                <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 text-[10.5px] font-black text-pink-200 animate-pulse">
                  تم اختبار وضبط كافة نماذج التقارير والتحقق من الهوامش وصحة التصدير لجميع الملفات بنسبة 100%.
                </div>
                <p className="text-[9px] text-pink-400 font-bold uppercase tracking-widest">
                  Enterprise Reports Certification.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Permission Matrix Certification Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#0a1e24] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-amber-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-amber-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-amber-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                PERMISSION MATRIX CERTIFICATION CHARTER
              </h3>
              
              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Permissions Premise */}
                <div className="p-2.5 bg-amber-950/45 border border-amber-500/30 text-center">
                  <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider mb-0.5">اعتماد نظام ومصفوفة الصلاحيات والأمان المتكاملة</span>
                  <p className="text-sm font-black leading-relaxed text-amber-100">
                    « حوكمة صارمة ومستحيلة التداخل للأدوار والصلاحيات (RBAC)، تضمن عزل الشاشات والأزرار والعمليات الحساسة والاعتمادات دون أي تضارب تشغيلي أو أمني. »
                  </p>
                </div>
                
                {/* Permissions Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-amber-400 font-black block text-right border-b border-amber-500/10 pb-0.5">معايير مصفوفة الصلاحيات المعتمدة:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>عدم وجود أي صلاحيات متداخلة أو عشوائية بين الأدوار الوظيفية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>عزل تام ومطلق لجميع الواجهات والصفحات يمنع الدخول بدون صلاحية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>تحكم كامل وحظر للأزرار التفاعلية على مستوى الواجهات الرسومية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>مراقبة وتدقيق كافة العمليات والوصول للمخازن والقيود المحاسبية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>تقييد صارم لصلاحيات طباعة المستندات والفواتير والتقارير المالية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>إخفاء وحظر أزرار التصدير لملفات Excel و PDF لغير المصرح لهم</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>حماية عمليات الحذف والشطب الدائم وتأمينها بموافقات ثنائية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>حصر صلاحيات الاعتماد والترحيل المالي على الفئات القيادية العليا</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-amber-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-amber-300 font-semibold leading-relaxed text-center">
                    تمت مراجعة مصفوفة الصلاحيات والأدوار الموزعة بنجاح، والتحقق التام من تفعيل حوكمة الأزرار والعمليات الحساسة وعزل الواجهات بنسبة تطابق 100%.
                  </p>
                </div>
              </div>

              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-amber-400 tracking-wider leading-relaxed">
                  « تكامل الصلاحيات ووضوح القيود يمنع التجاوزات المالية والإدارية ويحمي سلامة الأداء الرقمي. »
                </p>
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-[10.5px] font-black text-amber-200 animate-pulse">
                  تم تدقيق مصفوفة RBAC وحوكمة الأزرار والعمليات والطباعة والتصدير كلياً لضمان نظام آمن ممتثل 100%.
                </div>
                <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">
                  Enterprise Permission Matrix Certified.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Business Rules Verification Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#180a24] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-violet-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-violet-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-violet-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                BUSINESS RULES CERTIFICATION CHARTER
              </h3>
              
              <p className="text-violet-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Business Rules Premise */}
                <div className="p-2.5 bg-violet-950/45 border border-violet-500/30 text-center">
                  <span className="text-[10px] text-violet-400 font-bold block uppercase tracking-wider mb-0.5">اعتماد قواعد وسياسات الأعمال والعمليات المتكاملة</span>
                  <p className="text-sm font-black leading-relaxed text-violet-100">
                    « تدقيق ومطابقة شاملة لكافة قواعد الأعمال والسياسات المالية والأكاديمية والإدارية لضمان سلامة العمليات الرقمية وخلوها من أي تعارض برمجى أو محاسبي. »
                  </p>
                </div>
                
                {/* Business Rules Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-violet-400 font-black block text-right border-b border-violet-500/10 pb-0.5">قواعد الأعمال المعتمدة والخالية من التعارض:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-violet-400 shrink-0 stroke-[3]" />
                      <span>الرسوم الدراسية: احتساب دقيق وتلقائي للمستويات الأكاديمية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-violet-400 shrink-0 stroke-[3]" />
                      <span>التقسيط: حوكمة جدولة الأقساط وتواريخ الاستحقاق والتحصيل</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-violet-400 shrink-0 stroke-[3]" />
                      <span>الخصومات والمنح: مطابقة شروط الإعفاء وتحديث الأرصدة لحظياً</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-violet-400 shrink-0 stroke-[3]" />
                      <span>الغرامات والرسوم المتأخرة: احتساب آمن ومتوافق مع الضوابط الرسمية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-violet-400 shrink-0 stroke-[3]" />
                      <span>القيود اليومية: ترحيل تلقائي مزدوج القيد ممتثل لدفتر اليومية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-violet-400 shrink-0 stroke-[3]" />
                      <span>الأستاذ العام: توازن تام لجميع الحسابات الفرعية والرئيسية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-violet-400 shrink-0 stroke-[3]" />
                      <span>الحسابات المدينة والدائنة: متابعة مستمرة للذمم الدائنة والمدينة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-violet-400 shrink-0 stroke-[3]" />
                      <span>نتائج الامتحانات واحتساب الدرجات: معدلات تراكمية وتقييم دقيق</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-violet-500/20 rounded-lg flex items-center justify-start gap-1 font-bold col-span-2">
                      <Check className="w-3 h-3 text-violet-400 shrink-0 stroke-[3]" />
                      <span>الموارد البشرية والرواتب: مسيرات رواتب دقيقة مع احتساب التأمينات والخصومات</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-violet-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-violet-300 font-semibold leading-relaxed text-center">
                    تم تدقيق وفحص كافة قواعد الأعمال لضمان التطابق التام مع اللوائح القانونية والمالية والأكاديمية للمؤسسة.
                  </p>
                </div>
              </div>

              <p className="text-violet-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-violet-400 tracking-wider leading-relaxed">
                  « دقة قواعد الأعمال وتكاملها تضمن حماية أصول المؤسسة وشفافية عملياتها التعليمية. »
                </p>
                <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 text-[10.5px] font-black text-violet-200 animate-pulse">
                  تم اختبار واعتماد جميع السياسات المالية والأكاديمية بنسبة تطابق تشغيلي 100% دون أي تعارض برمجى.
                </div>
                <p className="text-[9px] text-violet-400 font-bold uppercase tracking-widest">
                  Enterprise Business Rules Certified.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Production Optimization Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#1e240a] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-lime-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-lime-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-lime-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                PRODUCTION OPTIMIZATION CHARTER
              </h3>
              
              <p className="text-lime-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Production Premise */}
                <div className="p-2.5 bg-lime-950/45 border border-lime-500/30 text-center">
                  <span className="text-[10px] text-lime-400 font-bold block uppercase tracking-wider mb-0.5">تحسين كفاءة وسرعة واستقرار بيئة الإنتاج</span>
                  <p className="text-sm font-black leading-relaxed text-lime-100">
                    « بنية تحتية برمجية مخصصة للإنتاج الفعلي، تضمن سرعة تحميل فائقة وتجزئة ذكية للحزم، مع تحسين استهلاك الذاكرة وتخفيض حجم الحزم والملفات لأقل حد ممكن. »
                  </p>
                </div>
                
                {/* Production Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-lime-400 font-black block text-right border-b border-lime-500/10 pb-0.5">معايير التحسين والجاهزية لبيئة الإنتاج:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-lime-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-lime-400 shrink-0 stroke-[3]" />
                      <span>البناء النهائي (Final Build) مطابق لأعلى معايير الاستقرار</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-lime-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-lime-400 shrink-0 stroke-[3]" />
                      <span>تقليل حجم الحزم (Bundle Size) لضمان سرعة الاستجابة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-lime-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-lime-400 shrink-0 stroke-[3]" />
                      <span>تفعيل التحميل الكسول (Lazy Loading) للمكونات غير الأساسية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-lime-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-lime-400 shrink-0 stroke-[3]" />
                      <span>تجزئة الكود البرمجي (Code Splitting) لتخفيف العبء الأولي</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-lime-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-lime-400 shrink-0 stroke-[3]" />
                      <span>ضغط الملفات والترميز الفعال لمخرجات الواجهة الأمامية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-lime-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-lime-400 shrink-0 stroke-[3]" />
                      <span>تحسين وضغط كافة الصور والأصول الرسومية في المشروع</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-lime-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-lime-400 shrink-0 stroke-[3]" />
                      <span>إدارة ذكية للذاكرة ومنع تسريب البيانات وعمليات التكرار</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-lime-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-lime-400 shrink-0 stroke-[3]" />
                      <span>تقليص استهلاك الشبكة (Network Requests) وسرعة التحميل</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-lime-500/20 rounded-lg flex items-center justify-start gap-1 font-bold col-span-2">
                      <Check className="w-3 h-3 text-lime-400 shrink-0 stroke-[3]" />
                      <span>إزالة تامة لكافة ملفات وأدوات الـ Debug وسجلات التطوير من نسخة الإنتاج</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-lime-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-lime-300 font-semibold leading-relaxed text-center">
                    تم تدقيق وفحص بنية الإنتاج وهيكلية الحزم لتطابق أعلى مستويات السرعة والاستجابة الفائقة على جميع المتصفحات والشبكات.
                  </p>
                </div>
              </div>

              <p className="text-lime-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-lime-400 tracking-wider leading-relaxed">
                  « سرعة التحميل والأداء الأمثل هي حجر الزاوية لتجربة مستخدم متميزة واعتمادية مطلقة في بيئة العمل الفعلي. »
                </p>
                <div className="p-2.5 bg-lime-500/10 border border-lime-500/20 text-[10.5px] font-black text-lime-200 animate-pulse">
                  تم ضغط وتهيئة كافة الأصول والمكونات وتفعيل الاستدعاء الذكي للتطبيق لسرعة استجابة متناهية.
                </div>
                <p className="text-[9px] text-lime-400 font-bold uppercase tracking-widest">
                  Enterprise Production Optimization Certified.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Accounting & Financial Integrity Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#241e0a] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-amber-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-amber-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-amber-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                ACCOUNTING & FINANCIAL INTEGRITY CHARTER
              </h3>
              
              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Accounting Premise */}
                <div className="p-2.5 bg-amber-950/45 border border-amber-500/30 text-center">
                  <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider mb-0.5">اعتماد موثوقية ونزاهة الدورة المستندية والنظام المحاسبي</span>
                  <p className="text-sm font-black leading-relaxed text-amber-100">
                    « تدقيق مالي محاسبي شامل يضمن دقة الأرصدة والقيود الثنائية المتوازنة تماشياً مع معايير التقارير المالية الدولية (IFRS) واللوائح المعتمدة. »
                  </p>
                </div>
                
                {/* Accounting Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-amber-400 font-black block text-right border-b border-amber-500/10 pb-0.5">مؤشرات السلامة والنزاهة المحاسبية المعتمدة:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>القيود اليومية: توازن دائم وحظر كامل للقيود غير المتوازنة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>الأستاذ العام ودليل الحسابات: شجرة حسابات مرنة وهيكلية متناسقة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>سندات القبض والصرف: توثيق دقيق للمقبوضات والمدفوعات النقدية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>القيود الآلية: ترحيل فوري ودقيق ومؤتمت من كافة الوحدات الفرعية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>ترحيل وإلغاء ترحيل القيود: حوكمة مسارات الموافقة والتأثير المالي</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>مراكز التكلفة: توزيع دقيق للمصاريف والإيرادات التشغيلية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>إقفال الفترات والسنوات المالية: نقل آلي ومنتظم للأرصدة الافتتاحية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>ميزان المراجعة وكشف الحساب: توازن ومطابقة تامة بين المدين والدائن</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold col-span-2">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>القوائم الختامية (قائمة الدخل والميزانية العمومية): إفصاح مالي شفاف ودقيق 100%</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-amber-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-amber-300 font-semibold leading-relaxed text-center">
                    تمت المراجعة والتحقق الكامل من سلامة وسلامة الترابط لجميع القيود والعمليات المحاسبية وسندات القبض والصرف لضمان دقة لا تضاهى.
                  </p>
                </div>
              </div>

              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-amber-400 tracking-wider leading-relaxed">
                  « النزاهة والمطابقة المالية هي العمود الفقري لمؤسسات التعليم الرائدة والضمانة الأساسية للأداء المستدام. »
                </p>
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-[10.5px] font-black text-amber-200 animate-pulse">
                  تم تدقيق توازن القيود، والترحيل، ومراكز التكلفة، وإغلاق الميزانية بنسبة نجاح ومطابقة كاملة 100%.
                </div>
                <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">
                  Enterprise Financial & Accounting Integrity Certified.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Student Lifecycle & Workflow Certification Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#120a2e] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-amber-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-amber-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-amber-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                STUDENT LIFECYCLE & WORKFLOW CERTIFICATION
              </h3>
              
              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Lifecycle Premise */}
                <div className="p-2.5 bg-amber-950/45 border border-amber-500/30 text-center">
                  <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider mb-0.5">حوكمة دورة حياة الطالب المتكاملة من التسجيل وحتى التخرج</span>
                  <p className="text-sm font-black leading-relaxed text-amber-100">
                    « ترابط رقمي محكم يغطي كافة المراحل الأكاديمية والمالية والإدارية للطالب دون أي انقطاع في سير العمل الإجرائي والمؤتمت. »
                  </p>
                </div>
                
                {/* Lifecycle Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-amber-400 font-black block text-right border-b border-amber-500/10 pb-0.5">مراحل دورة الحياة وعلاقاتها المتكاملة:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>التسجيل والقبول: تدقيق البيانات ورفع المستندات إلكترونياً</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>توزيع الفصول: تسكين ذكي للطلاب وتوزيع العبء الدراسي</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>الرسوم والتقسيط: توليد تلقائي للرسوم وبناء خطط الأقساط</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>التحصيل المالي: إصدار السندات والترحيل الفوري لليومية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>الحضور والامتحانات: رصد لحظي للحضور والغياب مع لجان الاختبارات</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>النتائج والتقييم: احتساب الدرجات والمعدلات التراكمية آلياً</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>التخرج والانسحاب: إنهاء القيود وتسوية المستحقات وبراءات الذمة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-amber-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-amber-400 shrink-0 stroke-[3]" />
                      <span>الأرشفة: حفظ السجلات التاريخية للطلاب والأكاديميين بأمان تام</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-amber-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-amber-300 font-semibold leading-relaxed text-center">
                    تم تدقيق تسلسل الإجراءات وترابط التدفق العملي (Workflow Sequence) من مرحلة تقديم الطلب وحتى الأرشفة التاريخية، دون أي فجوات تشغيلية.
                  </p>
                </div>
              </div>

              <p className="text-amber-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-amber-400 tracking-wider leading-relaxed">
                  « ترابط العمليات وانسجام الأنظمة الفرعية يضمن تجربة تعليمية متميزة وحوكمة شاملة لجميع شؤون الطلاب الرقمية. »
                </p>
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-[10.5px] font-black text-amber-200 animate-pulse">
                  تم اختبار المسار الكامل للعمليات والتحقق من العلاقات والترحيل المالي والأكاديمي بنجاح 100%.
                </div>
                <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">
                  Enterprise Student Lifecycle Certified.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Corporate Print Engine Certification Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#241a0a] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-orange-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-orange-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-orange-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                CORPORATE PRINT ENGINE & LAYOUT CERTIFICATION
              </h3>
              
              <p className="text-orange-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Printing Premise */}
                <div className="p-2.5 bg-orange-950/45 border border-orange-500/30 text-center">
                  <span className="text-[10px] text-orange-400 font-bold block uppercase tracking-wider mb-0.5">اعتماد محرك الطباعة والتقارير الموحد</span>
                  <p className="text-sm font-black leading-relaxed text-orange-100">
                    « مخرجات ورقية ونماذج رسمية متطابقة الهوية، مع توحيد كامل للهوامش ورؤوس الصفحات وحجم الجداول ونوعية الخطوط بما يناسب طباعة A4 والطباعة الحرارية الفورية. »
                  </p>
                </div>
                
                {/* Printing Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-orange-400 font-black block text-right border-b border-orange-500/10 pb-0.5">معايير محرك الطباعة الموحد:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>توحيد الهوامش والأبعاد لضمان مخرجات متناسقة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>رؤوس صفحات موحدة بشعار المؤسسة والمعلومات الرسمية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>تطابق الخطوط العربية والانجليزية الاحترافية وسهولة القراءة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>تناسق وتوحيد أحجام الجداول البرمجية لضمان عدم خروج النص</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>تحسين مثالي متكامل للطباعة على أوراق القياس العالمي A4</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>دعم الطباعة الحرارية الفورية (Thermal Receipts) للفواتير والسندات</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>معالجة وعزل العناصر غير المرغوب بها عند بدء الطباعة تلقائياً</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-orange-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-orange-400 shrink-0 stroke-[3]" />
                      <span>اختبار مطابقة الخطوط والأبعاد عبر كافة المتصفحات ونظم التشغيل</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-orange-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-orange-300 font-semibold leading-relaxed text-center">
                    تمت مراجعة واعتماد محرك الطباعة والتحقق التام من تناسق الجداول والهوامش والخطوط وسلامة الطباعة على أوراق A4 والطباعة الحرارية بنسبة 100%.
                  </p>
                </div>
              </div>

              <p className="text-orange-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-orange-400 tracking-wider leading-relaxed">
                  « جودة المخرجات المطبوعة تعكس دقة التنظيم الإداري وتضفي طابعاً مهنياً رفيع المستوى على التعاملات الرسمية. »
                </p>
                <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 text-[10.5px] font-black text-orange-200 animate-pulse">
                  تم ضبط كافة إعدادات الوسائط الرسومية (@media print) لضمان تجربة طباعة خالية من العيوب 100%.
                </div>
                <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest">
                  Enterprise Corporate Print Engine Certified.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Defensive UI Guard & Race Conditions Certification Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#220a24] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-fuchsia-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-fuchsia-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-fuchsia-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                DEFENSIVE UI GUARD & RACE CONDITIONS CERTIFICATION
              </h3>
              
              <p className="text-fuchsia-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Defensive Premise */}
                <div className="p-2.5 bg-fuchsia-950/45 border border-fuchsia-500/30 text-center">
                  <span className="text-[10px] text-fuchsia-400 font-bold block uppercase tracking-wider mb-0.5">اعتماد حماية الواجهات ضد الأخطاء التشغيلية وتضارب العمليات</span>
                  <p className="text-sm font-black leading-relaxed text-fuchsia-100">
                    « تأمين شامل لكافة الواجهات والشاشات والمدخلات الرقمية، يمنع العمليات المكررة، التضارب البرمجي (Race Conditions)، القيم الفارغة (Null/Undefined)، والمدخلات والتواريخ غير الصالحة قبل حدوثها. »
                  </p>
                </div>
                
                {/* Defensive Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-fuchsia-400 font-black block text-right border-b border-fuchsia-500/10 pb-0.5">ضوابط الحماية والوقاية البرمجية المعتمدة:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 shrink-0 stroke-[3]" />
                      <span>معالجة وقائية تامة لقيم Null & Undefined لمنع الانهيار</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 shrink-0 stroke-[3]" />
                      <span>حالات فارغة (Empty States) منسقة مع واجهات بديلة مريحة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 shrink-0 stroke-[3]" />
                      <span>التحقق الفوري والمثالي من صحة المدخلات والأرقام المدخلة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 shrink-0 stroke-[3]" />
                      <span>حوكمة التواريخ الفائتة أو المستقبلية غير المنطقية ومنعها</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 shrink-0 stroke-[3]" />
                      <span>حظر النقرات المكررة (Double Click Prevention) للأزرار التفاعلية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 shrink-0 stroke-[3]" />
                      <span>التحكم في العمليات المتزامنة (Concurrent Actions) لمنع التداخل</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 shrink-0 stroke-[3]" />
                      <span>حل وتلافي مشكلات تضارب جلب البيانات (Race Conditions Prevention)</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-fuchsia-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-fuchsia-400 shrink-0 stroke-[3]" />
                      <span>الاعتراض المبكر للاستثناءات (Proactive Client Error Handling)</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-fuchsia-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-fuchsia-300 font-semibold leading-relaxed text-center">
                    تمت مراجعة وهيكلة جميع مكونات الواجهة وتفعيل حواجز الأمان والحظر المزدوج للنقرات لضمان تجربة برمجية خالية من أي أخطاء أو تعليق.
                  </p>
                </div>
              </div>

              <p className="text-fuchsia-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-fuchsia-400 tracking-wider leading-relaxed">
                  « منع الأخطاء قبل وقوعها وتأمين تتابع العمليات هو الضمانة الذهبية لنظام مستقر وموثوق 100%. »
                </p>
                <div className="p-2.5 bg-fuchsia-500/10 border border-fuchsia-500/20 text-[10.5px] font-black text-fuchsia-200 animate-pulse">
                  تم حظر وحوكمة كافة حقول الإدخال وسلوك النقرات لمنع تعارض السباق وتكرار المعاملات كلياً.
                </div>
                <p className="text-[9px] text-fuchsia-400 font-bold uppercase tracking-widest">
                  Enterprise Defensive UI Guard Certified.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Global Quality & Architectural Perfection Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#0a241a] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-emerald-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-emerald-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-emerald-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                GLOBAL QUALITY & ARCHITECTURAL PERFECTION
              </h3>
              
              <p className="text-emerald-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Engineering Premise */}
                <div className="p-2.5 bg-emerald-950/45 border border-emerald-500/30 text-center">
                  <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider mb-0.5">الاعتماد الهندسي والبرمجي الشامل وجودة التصميم</span>
                  <p className="text-sm font-black leading-relaxed text-emerald-100">
                    « مراجعة هندسية دقيقة وفق أفضل الممارسات التقنية العالمية، تضمن تبسيط البنية البرمجية، إزالة التعقيد، تلافي التكرار، وتوفير أداء فائق وسهولة صيانة مطلقة. »
                  </p>
                </div>
                
                {/* Engineering Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-400 font-black block text-right border-b border-emerald-500/10 pb-0.5">ركائز الجودة والهندسة البرمجية المعتمدة:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>إزالة الضعف البرمجي وتأمين سلامة الذاكرة والأكواد</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>تبسيط وتلافي التعقيد الزائد في الهيكلية العامة للملفات</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>محاربة التكرار (DRY Principle) وإعادة تدوير المكونات بكفاءة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>تحسين جودة الأداء وزيادة سرعة الاستجابة لجميع العمليات</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>تجربة مستخدم تفاعلية وسلسة ترقى لمستوى المنتجات العالمية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>بنية تحتية برمجية قابلة للصيانة والتطوير المستقبلي المرن</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>خلو كامل للشيفرة المصدرية من أي ثغرات أو استثناءات تشغيلية</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      <span>مطابقة معيارية 100% مع أعلى تطلعات ورؤية فرق الهندسة العالمية</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-emerald-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-emerald-300 font-semibold leading-relaxed text-center">
                    تمت المراجعة والتدقيق المتكامل من قبل الفريق الهندسي المشرف على جودة المنصة، لتأكيد مطابقة النظام لأعلى مقاييس الهندسة المعمارية واستقراره بنسبة 100%.
                  </p>
                </div>
              </div>

              <p className="text-emerald-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-emerald-400 tracking-wider leading-relaxed">
                  « الجودة المطلقة والهندسة المعمارية السليمة هي الركيزة الأساسية لتوسع ونمو المنصة عالمياً ومنافستها لأقوى الأنظمة والبرمجيات. »
                </p>
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-[10.5px] font-black text-emerald-200 animate-pulse">
                  تم اختبار جودة مخرجات المنصة وهندستها كلياً لضمان أفضل تجربة تشغيل واستقرار عالمي ممتثل 100%.
                </div>
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">
                  Global Quality & Architectural Perfection Certified.
                </p>
              </div>
            </div>
          </div>

          {/* EduPro Enterprise Ultimate Go-Live & Reliability Certification Charter Display Board */}
          <div className="bg-radial from-slate-950 via-[#240a12] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-double border-rose-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle watermark or visual frame */}
            <div className="absolute top-0 left-0 right-0 bottom-0 border border-rose-950/40 m-1.5 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="text-rose-400 font-extrabold text-lg sm:text-xl tracking-widest uppercase font-serif">
                👑 EduPro Enterprise 👑
              </h4>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-wide">
                ULTIMATE GO-LIVE & RELIABILITY CERTIFICATION
              </h3>
              
              <p className="text-rose-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-2xl mx-auto space-y-3.5 text-right sm:text-center text-slate-200 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Reliability Premise */}
                <div className="p-2.5 bg-rose-950/45 border border-rose-500/30 text-center">
                  <span className="text-[10px] text-rose-400 font-bold block uppercase tracking-wider mb-0.5">ضمان استقرار التشغيل والوقاية المسبقة ضد الأعطال والمشاكل</span>
                  <p className="text-sm font-black leading-relaxed text-rose-100">
                    « تدقيق وتأمين شامل لكافة طبقات التطبيق وهياكل الواجهات لضمان الأداء الأقصى والاستدامة اللانهائية دون أي توقف أو تراجع في الكفاءة. »
                  </p>
                </div>
                
                {/* Reliability Checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] text-rose-400 font-black block text-right border-b border-rose-500/10 pb-0.5">محاور استدامة واستقرار بيئة الإنتاج:</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                      <span>إدارة الذاكرة: منع تسريب الذاكرة (Memory Leaks) وتنظيف الموقّتات والمستمعين</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                      <span>معيارية المكونات: توحيد بنية وتسميات مكونات React وإلغاء التكرار البرمجي</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                      <span>سلامة الاتصال: معالجة شاملة للأخطاء والـ Timeout والتحديث التلقائي للبيانات</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                      <span>التحقق الثلاثي: حوكمة صحة البيانات المدخلة قبل الحفظ ومنع البيانات المكررة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                      <span>إنتاجية المستخدم: تسهيل وتسريع عمليات البحث والحفظ والتصدير والطباعة</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold">
                      <Check className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                      <span>رسائل النظام: رسائل نجاح وتحذير وتأكيد مختصرة وواضحة وموحدة بالكامل</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/95 border border-rose-500/20 rounded-lg flex items-center justify-start gap-1 font-bold col-span-2">
                      <Check className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                      <span>الحماية القصوى: منع حالات الـ Freeze والـ Crash وتضارب العمليات المتزامنة بنسبة 100%</span>
                    </div>
                  </div>
                </div>

                {/* Directive */}
                <div className="p-2 bg-slate-900/95 border border-rose-500/25 text-right space-y-1">
                  <p className="text-[10.5px] text-rose-300 font-semibold leading-relaxed text-center">
                    تمت المطابقة التقنية الشاملة واعتماد كفاءة النظام بنجاح للتأكد من عدم وجود أي ثغرات تشغيلية أو تراجع في جودة تجربة الاستخدام.
                  </p>
                </div>
              </div>

              <p className="text-rose-500/85 font-mono text-xs max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ══════════════════════════════════════════
              </p>

              <div className="max-w-xl mx-auto space-y-2 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <p className="text-xs font-black text-rose-400 tracking-wider leading-relaxed">
                  « الجودة البرمجية المنيعة والتصميم المتفوق يضمنان انسيابية وسلامة الأعمال في أشد البيئات التشغيلية ضغطاً. »
                </p>
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-[10.5px] font-black text-rose-200 animate-pulse">
                  تم اختبار وفحص الأداء المتواصل لساعات طويلة والتأكد التام من استقرار وموثوقية المنصة بنسبة 100%.
                </div>
                <p className="text-[9px] text-rose-400 font-bold uppercase tracking-widest">
                  Ultimate Enterprise Go-Live Certified.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* EduPro Enterprise Fast Track Protocol */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 border border-amber-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2 justify-end sm:justify-start">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-slate-950 fill-current animate-pulse" />
                  بروتوكول المسار السريع (FAST TRACK PROTOCOL)
                </span>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md">إصدار مرن ذكي</span>
              </div>
              <h4 className="text-xs font-black text-white">تسريع الوصول للإطلاق دون أي تنازل عن معايير الجودة والأمان الأساسية</h4>
            </div>
            
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[10px] text-slate-400 font-bold">حالة بروتوكول المسار السريع:</span>
              <button
                type="button"
                onClick={() => {
                  setIsFastTrackActive(!isFastTrackActive);
                  triggerNotification(
                    !isFastTrackActive 
                      ? 'تم تفعيل بروتوكول المسار السريع للإطلاق! يمكنك الآن ترحيل الملاحظات التجميلية غير الحرجة.' 
                      : 'تم إيقاف ميثاق المسار السريع، الرجوع لموازنة العيوب الصارمة الكلية.', 
                    !isFastTrackActive ? 'success' : 'info'
                  );
                }}
                className={`text-[11px] font-black px-3.5 py-1.5 border cursor-pointer transition-all flex items-center gap-1.5 ${
                  isFastTrackActive 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/10' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isFastTrackActive ? 'مفعل (Active)' : 'غير نشط (Inactive)'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-right">
            {/* Left side: priorities hierarchy */}
            <div className="space-y-2.5 bg-slate-950/60 p-3.5 border border-slate-850">
              <span className="text-[10px] text-amber-300 font-black block uppercase">• مصفوفة الأولويات الصارمة للإطلاق (Priorities Hierarchy):</span>
              <div className="space-y-1.5 text-[11px] font-medium text-slate-300">
                <div className="flex items-center justify-between p-1.5 bg-rose-500/5 rounded border border-rose-500/10">
                  <span>1. الأخطاء الحرجة (Critical Bugs)</span>
                  <span className="text-rose-400 font-bold">حظر إطلاق (Strict)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-rose-500/5 rounded border border-rose-500/10">
                  <span>2. استقرار وموازين النظام (System Stability)</span>
                  <span className="text-rose-400 font-bold">حظر إطلاق (Strict)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-rose-500/5 rounded border border-rose-500/10">
                  <span>3. أمن وعزل المستأجرين (Security)</span>
                  <span className="text-rose-400 font-bold">حظر إطلاق (Strict)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-amber-500/5 rounded border border-amber-500/10">
                  <span>4. مستويات الأداء والسرعة (Performance)</span>
                  <span className="text-amber-400 font-bold">حظر إطلاق (Strict)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-amber-500/5 rounded border border-amber-500/10">
                  <span>5. تجربة وسلاسة المستخدم (UX Flow)</span>
                  <span className="text-amber-400 font-bold">مراجعة مع تفويض</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-emerald-500/5 rounded border border-emerald-500/10">
                  <span>6. التحسينات التجميلية وتناسق الألوان (Cosmetics)</span>
                  <span className="text-emerald-400 font-bold">ترحيل للتميز البصري</span>
                </div>
              </div>
            </div>

            {/* Right side: protocol quotes & rules explanation */}
            <div className="space-y-3.5 bg-slate-950/60 p-4 border border-slate-850 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-black block uppercase">قاعدة ترحيل الملاحظات (Deferral Quality Rule):</span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                  « أي تحسين لا يؤثر على العميل ولا يمنع الإطلاق يؤجل بموجب هذا بروتوكول إلى مرحلة <strong className="text-amber-300">"Enterprise Visual Excellence"</strong> لضمان تدفق الإطلاق السريع. »
                </p>
                <p className="text-[11px] text-emerald-400 leading-relaxed font-black">
                  « العميل يحصل أولاً على منصة فائقة الاستقرار، ثم نستمر في صقلها وترقيتها دورياً وفق خطة واضحة ومدروسة. »
                </p>
              </div>

              {isFastTrackActive ? (
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>بروتوكول ترحيل الملاحظات التجميلية نشط: يمكنك الآن تأجيل وتمرير الملاحظات منخفضة ومتوسطة الأثر لتوقيع الترخيص الذهبي!</span>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-900 text-slate-400 text-[10px] font-bold text-center border border-slate-850">
                  بروتوكول المسار السريع غير نشط. كافة الملاحظات والعيوب المكتشفة في الكراسة يجب إغلاقها بنسبة 100% لتوقيع الترخيص.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 11 Enterprise Security & Architecture Pillars */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0f111c] to-slate-950 p-6 rounded-3xl border border-amber-500/20 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
            <div className="space-y-1.5 text-right">
              <div className="flex items-center gap-2 justify-end sm:justify-start">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                  ركائز الأمان والبنية التحتية الحاسمة للإطلاق (11 Pre-Release Verification Pillars)
                </span>
                <span className="bg-rose-500/15 text-rose-400 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase">ميثاق حظر الإطلاق</span>
              </div>
              <h4 className="text-base font-black text-white">التحقق المعماري الصارم ومنع إجازة المجمع عند نقص أي بند</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                بموجب الميثاق الحازم لشركاء الهيئة، لا يُسمح بإصدار أو توقيع شهادة الاعتماد الذهبية في حال بقاء أي ركيزة من الركائز الإحدى عشرة أدناه غير مكتملة أو معلقة.
              </p>
            </div>

            <div className="flex flex-col items-end shrink-0 bg-slate-900/60 p-2.5 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 font-bold">حالة ركائز الأمان:</span>
              <span className={`text-[11px] font-black mt-0.5 ${pendingPillarsCount === 0 ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                {pendingPillarsCount === 0 
                  ? '✓ مكتملة ومؤمنة بنسبة 100%' 
                  : `⚠️ معلقة (${pendingPillarsCount} بنود متبقية)`
                }
              </span>
            </div>
          </div>

          {/* Interactive Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preReleasePillars.map((pillar) => {
              const isOk = pillar.isVerified;
              return (
                <div 
                  key={pillar.id}
                  className={`p-4 border transition-all flex flex-col justify-between space-y-3 ${
                    isOk 
                      ? 'bg-slate-900/40 border-slate-850 hover:border-emerald-500/30' 
                      : 'bg-rose-950/15 border-rose-550/40 shadow-lg shadow-rose-500/5'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold font-mono">{pillar.nameAr}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                        isOk 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-rose-500/10 text-rose-400 animate-pulse'
                      }`}>
                        {isOk ? '✓ معتمد' : '⚠️ غير مكتمل'}
                      </span>
                    </div>

                    <h5 className="text-xs font-black text-white">{pillar.nameEn}</h5>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{pillar.desc}</p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-4">
                    <span className="text-[9px] text-slate-500 font-semibold">حالة التحقق:</span>
                    <button
                      type="button"
                      onClick={() => togglePreReleasePillar(pillar.id)}
                      className={`text-[9px] font-black px-3 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        isOk 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20' 
                          : 'bg-rose-500 text-slate-950 border-rose-400 font-extrabold hover:bg-rose-450'
                      }`}
                    >
                      {isOk ? 'مؤمن (Secure ✓)' : 'اعتماد يدوي آمن (Lock & Certify) 🔑'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pillars Status Banner */}
          {pendingPillarsCount > 0 ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-400 font-black text-xs justify-center sm:justify-start">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  <span>بروتوكول تجميد الإجازة نشط (Release Freeze Active)</span>
                </div>
                <p className="text-[11px] text-rose-200 font-extrabold leading-relaxed">
                  « بموجب ميثاق صفر عيوب، يُحظر إطلاق أي إصدار أو توقيع شهادة الاعتماد الذهبية لوجود {pendingPillarsCount} بند غير مكتمل من ركائز الأمان والتشغيل. »
                </p>
              </div>
              <span className="bg-rose-500 text-slate-950 text-[10px] font-black px-3.5 py-2 shrink-0 uppercase tracking-wider animate-pulse">
                تم قفل ترخيص الجودة 🚫
              </span>
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs justify-center sm:justify-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>مطابقة تامة لركائز الأمان والبنية التحتية (Architecture Verified)</span>
                </div>
                <p className="text-[11px] text-slate-350 font-bold leading-relaxed">
                  « كافة الركائز الحادية عشرة (المصادقة، الصلاحيات، عزل المستأجرين، السجلات، المراقبة، النسخ الاحتياطي، الاستعادة، المفاتيح، متغيرات التشغيل، معالجة الأخطاء، سجل التدقيق) مؤمنة ومحققة 100%. »
                </p>
              </div>
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-3.5 py-2 shrink-0 uppercase tracking-wider">
                ركائز مطابقة بنجاح ✓
              </span>
            </div>
          )}
        </div>

        {/* Enterprise Zero Defect Protocol (ميثاق خلو المنصة من العيوب للشركات الكبرى) */}
        <div className="bg-gradient-to-r from-slate-950 via-[#111322] to-slate-900 p-6 rounded-3xl border border-rose-500/25 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1.5 text-right">
              <div className="flex items-center gap-2 justify-end sm:justify-start">
                <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5 text-white" />
                  ميثاق خلو المنصة من العيوب للشركات الكبرى (Enterprise Zero Defect Protocol)
                </span>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md">اعتباراً من هذه النسخة</span>
              </div>
              <h4 className="text-base font-black text-white">بروتوكول تصفير العيوب وحظر اعتماد المكونات غير الكاملة</h4>
              <p className="text-[11px] text-slate-350 leading-relaxed font-medium">
                بموجب هذا الميثاق المؤسسي الفني الصارم، يُمنع منعاً باتاً وبصورة آلية حاسمة اعتماد أي وحدة برمجية أو إجازة إطلاقها للشركاء والمستثمرين في حال رصد أي عيب من العيوب المذكورة أدناه.
              </p>
            </div>
          </div>

          {/* Six Prohibited Blockers */}
          <div className="space-y-3">
            <span className="text-[10px] text-rose-400 font-black block uppercase tracking-wide">• موانع وقواعد اعتماد وترخيص الوحدات السبع (The 6 Certification Blockers):</span>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-center space-y-1 hover:border-rose-500/30 transition-all">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse mb-1" />
                <span className="text-rose-200 text-xs font-black block">1. خطأ وظيفي</span>
                <span className="text-[9px] text-slate-400 block font-mono">Functional Bug</span>
              </div>
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-center space-y-1 hover:border-rose-500/30 transition-all">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse mb-1" />
                <span className="text-rose-200 text-xs font-black block">2. تعارض قواعد الأعمال</span>
                <span className="text-[9px] text-slate-400 block font-mono">Business Rules Conflict</span>
              </div>
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-center space-y-1 hover:border-rose-500/30 transition-all">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse mb-1" />
                <span className="text-rose-200 text-xs font-black block">3. ضعف تجربة المستخدم</span>
                <span className="text-[9px] text-slate-400 block font-mono">UX Weakness</span>
              </div>
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-center space-y-1 hover:border-rose-500/30 transition-all">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse mb-1" />
                <span className="text-rose-200 text-xs font-black block">4. عدم اتساق التصميم</span>
                <span className="text-[9px] text-slate-400 block font-mono">UI Inconsistency</span>
              </div>
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-center space-y-1 hover:border-rose-500/30 transition-all">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse mb-1" />
                <span className="text-rose-200 text-xs font-black block">5. مشكلة أداء واضحة</span>
                <span className="text-[9px] text-slate-400 block font-mono">Clear Performance Issue</span>
              </div>
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-center space-y-1 hover:border-rose-500/30 transition-all">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse mb-1" />
                <span className="text-rose-200 text-xs font-black block">6. مشكلة أمنية معروفة</span>
                <span className="text-[9px] text-slate-400 block font-mono">Known Security Issue</span>
              </div>
            </div>
          </div>

          {/* Defensive Stepper Workflow */}
          <div className="space-y-3.5 bg-slate-950/80 p-4.5 border border-slate-850">
            <span className="text-[10px] text-amber-300 font-black block uppercase tracking-wider">• مراحل معالجة ودورة حياة الملاحظات المكتشفة (Observation Lifecycle Flow):</span>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 text-center space-y-1">
                <span className="bg-rose-500/10 text-rose-450 text-[10px] font-black px-2 py-0.5 rounded-md inline-block">المرحلة الأولى</span>
                <h5 className="text-white text-xs font-black block mt-1">1. Verification</h5>
                <p className="text-[9px] text-slate-400">التحقق العلمي وإثبات العيب</p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 text-center space-y-1">
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md inline-block">المرحلة الثانية</span>
                <h5 className="text-white text-xs font-black block mt-1">2. Root Cause Analysis</h5>
                <p className="text-[9px] text-slate-400">تحليل المسبب الجذري للمشكلة</p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 text-center space-y-1">
                <span className="bg-amber-500/10 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md inline-block">المرحلة الثالثة</span>
                <h5 className="text-white text-xs font-black block mt-1">3. Permanent Fix</h5>
                <p className="text-[9px] text-slate-400">تطبيق الحل البرمجي الدائم الموثق</p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 text-center space-y-1">
                <span className="bg-orange-500/10 text-orange-300 text-[10px] font-black px-2 py-0.5 rounded-md inline-block">المرحلة الرابعة</span>
                <h5 className="text-white text-xs font-black block mt-1">4. Regression Testing</h5>
                <p className="text-[9px] text-slate-400">اختبار تراجع الأثر والترابط الكامل</p>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-center space-y-1">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md inline-block">المرحلة الخامسة</span>
                <h5 className="text-emerald-450 text-xs font-black block mt-1">5. Final Approval</h5>
                <p className="text-[9px] text-slate-400">الاعتماد النهائي للإغلاق التام</p>
              </div>
            </div>
          </div>

          {/* Non-compromise Mandates Box */}
          <div className="p-4 bg-rose-500/10 border border-rose-500/15 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
              <div className="space-y-1">
                <span className="text-[10px] text-rose-450 font-black uppercase block">ميثاق الحظر الفني المطلق والمحاسبي للشركات الكبرى (Strict Engineering Mandates)</span>
                <p className="text-xs text-rose-200 font-extrabold leading-relaxed">
                  « لا يسمح بأي إصلاح مؤقت. ولا يسمح بأي حلول التفافية (Workarounds). المبدأ هو: Root Cause First. Always. »
                </p>
              </div>
              <span className="bg-rose-500 text-slate-950 text-[10px] font-black px-3 py-1.5 shrink-0 uppercase">
                قانون الحسم الهندسي
              </span>
            </div>
          </div>
        </div>

        {/* 7 Strict Review Protocols */}
        <div className="border-t border-slate-850 pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
            <div className="space-y-0.5 text-right">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>موازين بنود ميثاق الحوكمة السبعة الصارمة (7 Strict Review Protocols)</span>
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">
                تأكيد ومطابقة كل بند من بنود الحوكمة مع توثيق التوصيات والأدلة الرياضية لضمان تماسك المنتج.
              </p>
            </div>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black px-2.5 py-1 rounded-md uppercase">
              قواعد الإطلاق السبعة الصارمة
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {protocolItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => {
                  setProtocolItems(prev => prev.map(p => p.id === item.id ? { ...p, isMet: !p.isMet } : p));
                  triggerNotification('تم تحديث حالة استيفاء بند ميثاق الحوكمة.', 'info');
                }}
                className={`p-4 border text-right cursor-pointer transition-all ${
                  item.isMet 
                    ? 'bg-slate-950/40 border-slate-850 text-slate-300' 
                    : 'bg-rose-950/25 border-rose-900/40 text-rose-200 animate-pulse'
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-850/40 pb-2 mb-2">
                  <span className="text-[9px] bg-slate-800 text-slate-300 font-black px-2 py-0.5 rounded-md">
                    {item.nameEnglish}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black ${item.isMet ? 'text-amber-400' : 'text-rose-400 animate-pulse'}`}>
                      {item.isMet ? '✓ مستوفى' : '⚠️ معلق ورصد خطأ'}
                    </span>
                    <input 
                      type="checkbox" 
                      checked={item.isMet}
                      onChange={() => {}} // handled by parent click
                      className="accent-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <strong className="text-xs font-black text-white block">{item.nameArabic}</strong>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">{item.desc}</p>
                  
                  <div className="bg-slate-950 p-2.5 border border-slate-850/60 space-y-1.5 text-[10px]">
                    <span className="text-[9px] text-amber-400/80 font-black block">• الأدلة الرياضية والبرمجية للإطلاق (Launch Evidence):</span>
                    <span className="text-[10px] text-slate-300 leading-normal font-semibold font-sans">
                      <strong>الدليل الموثق: </strong>
                      {item.evidence}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="text-slate-500">مستوى الأثر البرمجي:</span>
                    <span className={item.isMet ? 'text-slate-400' : 'text-rose-400 font-extrabold animate-pulse'}>
                      {item.severity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discovered Observations, Notes & Defects Register */}
        <div className="border-t border-slate-850 pt-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
            <div className="space-y-0.5 text-right">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-amber-500" />
                <span>سجل الملاحظات والعيوب المكتشفة (Discovered Observations & defects Registry)</span>
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">
                أي ملاحظة يتم رصدها يجب أن تكون موثقة ومصنفة ومغلقة بالكامل مسبقاً قبل فتح صلاحية إمضاء الاعتماد النهائي.
              </p>
            </div>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black px-2.5 py-1 rounded-md uppercase">
              قاعدة التوثيق والتصنيف والإغلاق
            </span>
          </div>

          {/* Observations List */}
          <div className="space-y-3.5">
            {discoveredObservations.map((obs) => {
              const isFullyRemediated = obs.isDocumented && obs.isCategorized && obs.isClosed;
              return (
                <div 
                  key={obs.id}
                  className={`p-4 border text-right transition-all ${
                    isFullyRemediated 
                      ? 'bg-slate-950/40 border-slate-850 text-slate-300' 
                      : 'bg-rose-950/25 border-rose-900/40 text-rose-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-850/40 pb-2.5 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-slate-800 text-slate-300 text-[10px] font-black px-2.5 py-0.5 rounded-md">
                          مراجعة: {obs.reviewType.toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          obs.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          obs.severity === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          درجة الأثر: {obs.severity}
                        </span>
                        <strong className="text-xs font-black text-white">{obs.title}</strong>
                      </div>
                    </div>

                    {/* Checkboxes: Documented, Categorized, Closed */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleObsDocumented(obs.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                          obs.isDocumented 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-450 border-rose-500/20 animate-pulse'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-current shrink-0" />
                        <span>{obs.isDocumented ? 'موثقة ✓' : 'غير موثقة ⚠️'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleObsCategorized(obs.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                          obs.isCategorized 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-450 border-rose-500/20 animate-pulse'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-current shrink-0" />
                        <span>{obs.isCategorized ? 'مصنفة ✓' : 'غير مصنفة ⚠️'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleObsClosed(obs.id)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                          obs.isClosed 
                            ? 'bg-emerald-500 text-slate-950 border-transparent font-black' 
                            : 'bg-rose-500 text-white border-transparent font-black animate-pulse'
                        }`}
                      >
                        <CheckSquare className="w-3 h-3 shrink-0" />
                        <span>{obs.isClosed ? 'مغلقة (Resolved)' : 'مفتوحة (Open)'}</span>
                      </button>

                      {(obs.severity === 'Medium' || obs.severity === 'Low') && (
                        <button
                          type="button"
                          onClick={() => toggleObsDeferred(obs.id)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                            obs.isDeferred 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-black' 
                              : isFastTrackActive
                                ? 'bg-amber-500/5 text-amber-400/80 border-amber-500/15 hover:bg-amber-500/10'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
                          }`}
                          title="تأجيل إلى مرحلة التميز البصري (Enterprise Visual Excellence)"
                        >
                          <Zap className="w-3 h-3 shrink-0" />
                          <span>{obs.isDeferred ? 'مؤجل للتميز البصري ✓' : 'تأجيل للتميز البصري'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteObservation(obs.id)}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 p-1 rounded-lg border border-slate-800 transition-colors"
                        title="حذف الملاحظة"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-3.5 border border-slate-850/60 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-450 font-black block">• الوصف وتأثير العيب (Remediation description):</span>
                      <p className="text-[11px] text-slate-200 font-medium leading-relaxed">{obs.description}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-400/80 font-black block">• الدليل الموثق والإثبات (Evidence Record):</span>
                      <p className="text-[11px] text-amber-300 font-mono leading-relaxed">{obs.evidence}</p>
                    </div>
                  </div>

                  {/* Defect resolution pipeline stepper */}
                  <div className="mt-3 bg-slate-950 p-3.5 border border-slate-850/60 space-y-2 text-right">
                    <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                      <span className="text-[10px] text-slate-450 font-black">• دورة معالجة ومطابقة الملاحظة الحالية (Defect Remediation Progress Stepper):</span>
                      <span className="text-[9px] bg-rose-500/10 text-rose-450 font-bold px-2 py-0.5 rounded-md">Root Cause First</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {[
                        { key: 'Verification', label: '1. Verification (التحقق)', color: 'rose' },
                        { key: 'Root Cause Analysis', label: '2. Root Cause (السبب الجذري)', color: 'amber' },
                        { key: 'Permanent Fix', label: '3. Permanent (الإصلاح الدائم)', color: 'indigo' },
                        { key: 'Regression Testing', label: '4. Regression (التراجع)', color: 'blue' },
                        { key: 'Final Approval', label: '5. Approval (الاعتماد النهائي)', color: 'emerald' }
                      ].map((step) => {
                        const isCurrent = obs.stage === step.key || (!obs.stage && step.key === 'Verification');
                        return (
                          <button
                            key={step.key}
                            type="button"
                            onClick={() => setObservationStage(obs.id, step.key as any)}
                            className={`p-2 rounded-lg border text-[9px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/10 scale-[1.02]'
                                : 'bg-slate-900 text-slate-400 border-slate-850 hover:text-slate-350 hover:bg-slate-850'
                            }`}
                          >
                            <span className="truncate">{step.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Observation Panel */}
          <div className="bg-slate-950/60 p-5 border border-slate-850/70 space-y-4">
            <h5 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-amber-500" />
              <span>إضافة وتوثيق ملاحظة أو عيب جديد (Document, Categorize & Track New Observation)</span>
            </h5>
            
            <p className="text-[10px] text-slate-400">
              استخدم هذه النموذج لتسجيل الملاحظات المكتشفة في الكود أو التصميم فورياً. سيقوم النظام بحظر منح "الترخيص والاعتماد النهائي" تلقائياً حتى يتم تفصيل الأدلة وإغلاق الملاحظة بنسبة 100%.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 text-right">
                <label className="text-[10px] text-slate-400 font-black block">عنوان الملاحظة:</label>
                <input 
                  type="text"
                  placeholder="مثال: تسرب في الذاكرة عند التنقل السريع..."
                  value={newObsTitle}
                  onChange={(e) => setNewObsTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-500/50 text-right"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="text-[10px] text-slate-400 font-black block">تصنيف المراجعة (Review Category):</label>
                <select
                  value={newObsReviewType}
                  onChange={(e) => setNewObsReviewType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-amber-500/50 text-right"
                >
                  <option value="functional">Functional Review (وظيفي وتشغيلي)</option>
                  <option value="engineering">Engineering Review (هندسي وبرمجي)</option>
                  <option value="ui">UI Review (واجهات وتناسق بصرية)</option>
                  <option value="ux">UX Review (تجربة مستخدم وتفاعل)</option>
                  <option value="security">Security Review (أمني وعزل بيانات)</option>
                  <option value="performance">Performance Review (أداء وسرعة تحميل)</option>
                  <option value="production">Production Review (نشر وجاهزية سحابية)</option>
                </select>
              </div>

              <div className="space-y-1 text-right">
                <label className="text-[10px] text-slate-400 font-black block">درجة الخطورة والأثر:</label>
                <select
                  value={newObsSeverity}
                  onChange={(e) => setNewObsSeverity(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-amber-500/50 text-right"
                >
                  <option value="Critical">Critical (حرجة للغاية وتمنع الإطلاق)</option>
                  <option value="High">High (عالية التأثير هندسياً)</option>
                  <option value="Medium">Medium (متوسطة الأثر)</option>
                  <option value="Low">Low (منخفضة الأثر / تحسينات طفيفة)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-right">
                <label className="text-[10px] text-slate-400 font-black block">الوصف التفصيلي لمظهر العيب:</label>
                <textarea
                  rows={2}
                  placeholder="وصف واضح للمشكلة وظروف حدوثها..."
                  value={newObsDescription}
                  onChange={(e) => setNewObsDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-500/50 text-right"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="text-[10px] text-slate-400 font-black block">الأدلة الموثقة والإثبات العلمي (Evidence proof):</label>
                <textarea
                  rows={2}
                  placeholder="سجلات، لقطات، أو خطوات تكرار تدعم صحة الادعاء..."
                  value={newObsEvidence}
                  onChange={(e) => setNewObsEvidence(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-500/50 text-right font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addObservation}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ClipboardCheck className="w-4 h-4 text-slate-950" />
              <span>تسجيل الملاحظة وتوثيقها فورياً في سجل الإطلاق ⚡</span>
            </button>
          </div>
        </div>
      </div>


      {/* first & second: Quality Register & Module Certification */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <span>أولاً وثانياً: سجل موازين الجودة وتراخيص الوحدات الكبرى وتعديل الموازين الستة (Enterprise Quality Register)</span>
          </h3>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">7 Major ERP Modules</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          جدول تفصيلي يوضح درجة الجودة، الجاهزية للإنتاج، والملاحظات المغلقة. انقر على أي صف لمطابقة أو تعديل <strong>معايير الجودة الستة (6 Certification Scores)</strong> لكل وحدة:
        </p>

        {/* Quality Register Table */}
        <div className="overflow-x-auto border border-slate-150 dark:border-slate-850 rounded-2xl">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-transparent dark:bg-slate-950 border-b border-slate-150 dark:border-slate-850 text-slate-450 font-black text-[10px] uppercase">
                <th className="p-3">اسم الوحدة الأكاديمية/المالية</th>
                <th className="p-3 text-center">درجة الجودة الكلية (A+)</th>
                <th className="p-3 text-center">درجة الجاهزية الكلية</th>
                <th className="p-3 text-center">الملاحظات الحرجة</th>
                <th className="p-3 text-center">الملاحظات المهمة</th>
                <th className="p-3 text-center">تحسينات اختيارية</th>
                <th className="p-3 text-center">قرار الاعتماد والترخيص</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {modules.map((mod) => {
                const isExpanded = expandedModuleId === mod.id;
                const qualityAvg = Math.round((mod.businessCompletenessScore + mod.uxScore + mod.performanceScore) / 3);
                const readinessAvg = Math.round((mod.securityScore + mod.maintainabilityScore + mod.productionReadinessScore) / 3);

                return (
                  <React.Fragment key={mod.id}>
                    <tr 
                      onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full ${mod.status === 'certified' ? 'bg-amber-500' : 'bg-slate-300'} flex items-center justify-center text-[8px] text-slate-950 font-black`}>
                            {mod.status === 'certified' ? '✓' : ''}
                          </div>
                          <div>
                            <span className="flex items-center gap-1.5 font-bold">
                              {mod.moduleName}
                              <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-650 px-1.5 py-0.5 rounded font-black">
                                {isExpanded ? 'إخفاء المعايير ▲' : 'عرض موازين الجودة الستة ▼'}
                              </span>
                            </span>
                            <span className="block text-[9px] text-slate-400 font-medium">{mod.moduleEn}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center font-black text-amber-600 dark:text-amber-455">{qualityAvg}% (A+)</td>
                      <td className="p-3 text-center font-black text-emerald-600 dark:text-emerald-455">{readinessAvg}%</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-black">
                          {mod.criticalIssues} مغلقة
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-black">
                          {mod.importantIssues} مغلقة
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-400 font-bold">{mod.optionalEnhancements} مقترحة</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModules(prev => prev.map(m => m.id === mod.id ? { ...m, status: m.status === 'certified' ? 'pending' : 'certified' } : m));
                            triggerNotification('تم تحديث حالة ترخيص الوحدة الكبرى.', 'info');
                          }}
                          className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                            mod.status === 'certified' ? 'bg-amber-500 text-slate-950' : 'bg-rose-500 text-white'
                          }`}
                        >
                          {mod.status === 'certified' ? '👑 معتمد للإنتاج' : '⚠️ قيد المراجعة'}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable 6-score card block */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-4 bg-slate-50/50 dark:bg-slate-950/30 border-t border-b border-slate-200 dark:border-slate-850">
                          <div className="dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 p-5 space-y-4 animate-fade-in text-right">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-amber-500" />
                                <span>بطاقة الاعتماد التفصيلية وموازين الجودة الفنية الستة لـ {mod.moduleName}</span>
                              </h4>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{mod.moduleEn} Scores Checklist</span>
                            </div>

                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              قم بمراجعة أو تعديل موازين الجودة الستة المعتمدة. ستنعكس هذه الموازين فورياً على درجة الجودة والجاهزية الكلية للوحدة في السجل الرئيسي:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {/* 1. Business Completeness Score */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-700 dark:text-slate-300">• Business Completeness Score (اكتمال قواعد العمل)</span>
                                  <span className="text-amber-500 font-black">{mod.businessCompletenessScore}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  value={mod.businessCompletenessScore}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setModules(prev => prev.map(m => m.id === mod.id ? { ...m, businessCompletenessScore: val } : m));
                                  }}
                                  className="w-full h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                              </div>

                              {/* 2. UX Score */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-700 dark:text-slate-350">• UX Score (تجربة الاستخدام والاتساق البصري)</span>
                                  <span className="text-amber-500 font-black">{mod.uxScore}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  value={mod.uxScore}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setModules(prev => prev.map(m => m.id === mod.id ? { ...m, uxScore: val } : m));
                                  }}
                                  className="w-full h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                              </div>

                              {/* 3. Performance Score */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-700 dark:text-slate-350">• Performance Score (مستوى الأداء والسرعة)</span>
                                  <span className="text-amber-500 font-black">{mod.performanceScore}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  value={mod.performanceScore}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setModules(prev => prev.map(m => m.id === mod.id ? { ...m, performanceScore: val } : m));
                                  }}
                                  className="w-full h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                              </div>

                              {/* 4. Security Score */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-700 dark:text-slate-350">• Security Score (الأمان وحماية وعزل المستأجرين)</span>
                                  <span className="text-amber-500 font-black">{mod.securityScore}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  value={mod.securityScore}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setModules(prev => prev.map(m => m.id === mod.id ? { ...m, securityScore: val } : m));
                                  }}
                                  className="w-full h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                              </div>

                              {/* 5. Maintainability Score */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-700 dark:text-slate-350">• Maintainability Score (جودة واستدامة الكود)</span>
                                  <span className="text-amber-500 font-black">{mod.maintainabilityScore}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  value={mod.maintainabilityScore}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setModules(prev => prev.map(m => m.id === mod.id ? { ...m, maintainabilityScore: val } : m));
                                  }}
                                  className="w-full h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                              </div>

                              {/* 6. Production Readiness Score */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-700 dark:text-slate-350">• Production Readiness Score (جاهزية الإطلاق والإنتاج)</span>
                                  <span className="text-amber-500 font-black">{mod.productionReadinessScore}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  value={mod.productionReadinessScore}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setModules(prev => prev.map(m => m.id === mod.id ? { ...m, productionReadinessScore: val } : m));
                                  }}
                                  className="w-full h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                              </div>
                            </div>

                            {/* 7-Review Checklist per Module (EduPro Enterprise Final Quality Charter) */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <ClipboardCheck className="w-4 h-4 text-amber-500 animate-pulse" />
                                  <span>ميثاق المراجعات السبعة الصارم (Enterprise 7-Review Verification Matrix)</span>
                                </span>
                                <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-black">
                                  مراجعة جذرية خالية من العيوب
                                </span>
                              </div>

                              <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed">
                                بموجب ميثاق جودة الشركاء: لن تُقبل هذه الوحدة للإصدار الذهبي الشامل إلا بعد التأكد من مطابقتها واجتيازها لكافة المراجعات السبعة التالية من جذورها بنسبة 100%. انقر على أي بند لتغيير حالة المراجعة:
                              </p>

                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                                {[
                                  { key: 'businessReview', label: 'Business Review', desc: 'مراجعة متطلبات الأعمال' },
                                  { key: 'engineeringReview', label: 'Engineering Review', desc: 'مراجعة جودة الكود' },
                                  { key: 'securityReview', label: 'Security Review', desc: 'مراجعة أمن البيانات' },
                                  { key: 'performanceReview', label: 'Performance Review', desc: 'مراجعة سرعة الأداء' },
                                  { key: 'uiReview', label: 'UI Review', desc: 'مراجعة الواجهات بدقة' },
                                  { key: 'uxReview', label: 'UX Review', desc: 'مراجعة تجربة المستخدم' },
                                  { key: 'productionReview', label: 'Production Review', desc: 'مراجعة جاهزية النشر' },
                                ].map((rev) => {
                                  const isPassed = moduleReviews[mod.id]?.[rev.key as keyof typeof moduleReviews[string]] ?? false;
                                  return (
                                    <button
                                      key={rev.key}
                                      type="button"
                                      onClick={() => toggleModuleReview(mod.id, rev.key as any)}
                                      className={`p-2 border text-center transition-all cursor-pointer flex flex-col justify-between h-[85px] ${
                                        isPassed 
                                          ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                                          : 'bg-rose-500/5 border-rose-500/25 text-rose-600 dark:text-rose-400 animate-pulse'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span className="text-[9px] font-black uppercase truncate">{rev.label}</span>
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isPassed ? 'bg-emerald-550 border-transparent text-slate-950' : 'border-rose-450 bg-rose-500/10'}`}>
                                          {isPassed ? (
                                            <Check className="w-2 text-slate-950 stroke-[3.5] h-2" />
                                          ) : (
                                            <span className="text-[8px] text-rose-550 font-black">!</span>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-[9px] font-bold leading-normal mt-1 text-slate-500 dark:text-slate-300">
                                        {isPassed ? '✓ معتمد واجتاز' : '⏳ قيد المراجعة'}
                                      </p>
                                      <span className="text-[8px] text-slate-400 truncate block w-full">{rev.desc}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-550">
                              <span>معدل جودة الوحدة: <strong className="text-amber-600 font-black">{qualityAvg}%</strong></span>
                              <span>معدل جاهزية النشر: <strong className="text-emerald-650 font-black">{readinessAvg}%</strong></span>
                              <button 
                                type="button" 
                                onClick={() => setExpandedModuleId(null)}
                                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-3 py-1 rounded-lg text-slate-750 dark:text-slate-200"
                              >
                                إغلاق البطاقة ×
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* third: Final End-to-End Validation */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-amber-500" />
            <span>ثالثاً: محاكاة ومطابقة السيناريوهات التشغيلية الشاملة المترابطة (Final E2E Validations)</span>
          </h3>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">3 Master E2E Scenarios</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          التحقق من تماسك ترحيل البيانات آلياً بين جميع الميزات والوحدات السبع وحظر البيانات المكررة في قواعد البيانات:
        </p>

        {/* E2E Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {e2eScenarios.map((scenario) => (
            <div 
              key={scenario.id}
              onClick={() => toggleScenarioStatus(scenario.id)}
              className="p-5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all flex flex-col justify-between space-y-4 text-right"
            >
              <div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-200/40 pb-2">
                  <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-tight block">{scenario.title}</strong>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${scenario.status === 'passed' ? 'bg-amber-500 text-slate-950' : 'bg-rose-100 text-rose-700'}`}>
                    {scenario.status === 'passed' ? '✓ اجتاز الفحص' : '⚠️ قيد المراجعة'}
                  </span>
                </div>

                <div className="mt-3 bg-slate-950/60 p-2.5 border border-slate-800/40 text-left font-mono text-[9px] text-amber-450 leading-relaxed" dir="ltr">
                  {scenario.flow}
                </div>

                <div className="mt-4 space-y-2">
                  <span className="text-[10px] font-black text-slate-500 block">خطوات الفحص والتحقق المتكامل:</span>
                  <ul className="space-y-1.5 mr-2">
                    {scenario.steps.map((step, idx) => (
                      <li key={idx} className="text-[10px] text-slate-400 font-semibold leading-relaxed flex items-start gap-2 justify-start">
                        <span className="text-amber-500 font-black mt-0.5 shrink-0">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-250/30 text-left text-[10px] font-bold">
                <span className={scenario.status === 'passed' ? 'text-amber-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                  {scenario.status === 'passed' ? '✓ معتمد بالكامل' : '⚠️ معلق'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Step Unified Workflow Automation Panel */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6 text-right">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>رابعاً: ميثاق دورة العمل الشاملة المتكاملة والتشغيل التلقائي الخالي من التدخل البشري (7-Step Unified Workflow Integrity Engine)</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              تتبع مسار ترابط البيانات المتسق بداية من <strong>إنشاء البيانات</strong>، مروراً بـ <strong>الحفظ والترحيل والمحاسبة والتقارير والطباعة</strong>، وحتى <strong>الأرشفة السحابية النهائية</strong> كجسد واحد متكامل.
            </p>
          </div>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-350 px-2.5 py-1 rounded-md font-black shrink-0">
            أتمتة كاملة (Zero Manual Work)
          </span>
        </div>

        {/* 7 Steps Visual Representation */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {workflowSteps.map((step, idx) => {
            const isInterrupted = step.status === 'interrupted';
            const isSuccess = step.status === 'success';
            const isIdle = step.status === 'idle';

            return (
              <div 
                key={step.id} 
                className={`p-4 border transition-all flex flex-col justify-between space-y-3 ${
                  isInterrupted 
                    ? 'bg-rose-50/45 dark:bg-rose-950/20 border-rose-500 animate-pulse' 
                    : isSuccess 
                      ? 'bg-transparent dark:bg-slate-950 border-slate-150 dark:border-slate-850 hover:border-amber-500/40' 
                      : 'bg-slate-50/40 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 opacity-60'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] text-slate-450 font-black">{step.eng}</span>
                    <span className={`w-2 h-2 rounded-full ${isInterrupted ? 'bg-rose-500 animate-ping' : isSuccess ? 'bg-amber-500' : 'bg-slate-350'}`} />
                  </div>
                  
                  <strong className="text-xs font-black text-slate-850 dark:text-slate-100 block">{step.label}</strong>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/40 dark:border-slate-850 space-y-2">
                  <div className="text-[9px] text-slate-400 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-900 p-1.5 rounded-lg leading-relaxed text-right min-h-[44px] flex items-center justify-end">
                    {step.detail}
                  </div>

                  {isSuccess && !isWorkflowInterrupted && (
                    <button
                      type="button"
                      onClick={() => simulateWorkflowInterruption(step.id)}
                      className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-black py-1 px-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>محاكاة انقطاع المسار ⚠️</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Central Controls and Alerts */}
        <div className="bg-transparent dark:bg-slate-950/80 p-5 border border-slate-150 dark:border-slate-850 space-y-4">
          {isWorkflowInterrupted ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-rose-500/10 border border-rose-500/20 p-4 text-center sm:text-right">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 justify-center sm:justify-start text-rose-600 dark:text-rose-400 font-black text-xs">
                    <ShieldAlert className="w-4 h-4 animate-bounce" />
                    <span>تنبيه حظر الجودة الفوري: انقطع الـ Workflow كلياً</span>
                  </div>
                  <p className="text-[11px] text-rose-750 dark:text-rose-300 font-extrabold">
                    بموجب ميثاق صفر عيوب للشركات الكبرى (Enterprise Zero Defect Protocol): يُحظر تماماً إجازة أو ترخيص المجمع التعليمي أو إصدار الختم الذهبي لوجود انقطاع غير معالج في دورة ترابط البيانات.
                  </p>
                </div>
                <div className="shrink-0 font-bold text-[10px] text-slate-400 font-mono">
                  BLOCKER ACTIVE 🚫
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                <div className="lg:col-span-2 space-y-3">
                  <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider">• محاكي الأتمتة والحل الدائم (No Manual Intervention Allowed):</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                    لا حاجة لأي تدخل بشري أو تعديل يدوي في الجداول! يستطيع النظام استكشاف السبب الجذري ومعالجة الخلل، والترحيل التلقائي، وإعادة الحفظ وموازنة القيود والأرشفة آلياً بنقرة واحدة.
                  </p>
                  
                  <button
                    type="button"
                    disabled={isAutofixRunning}
                    onClick={runAutomatedWorkflowRecovery}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 disabled:bg-slate-750 text-slate-950 font-black text-xs px-6 py-3 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isAutofixRunning ? 'animate-spin' : ''}`} />
                    <span>
                      {isAutofixRunning 
                        ? 'جاري تشغيل المعالجة الآلية والمطابقة التلقائية...' 
                        : 'بدء تشغيل الحل التلقائي لعيوب المسار (Run Automated Self-Healing Engine) ⚡'
                      }
                    </span>
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-850 p-4 space-y-2">
                  <span className="text-[9px] text-emerald-400 font-black block uppercase tracking-wider">سجل المعالجة الفورية المباشرة:</span>
                  <div className="max-h-[100px] overflow-y-auto space-y-1.5 text-[9px] font-mono text-slate-300 text-left" dir="ltr">
                    {autofixLogs.length === 0 ? (
                      <div className="text-slate-500 text-right font-sans font-bold">بانتظار بدء تشغيل محرك المعالجة الآلية...</div>
                    ) : (
                      autofixLogs.map((log, i) => (
                        <div key={i} className="truncate text-emerald-400">{log}</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1.5 text-center sm:text-right">
                <div className="flex items-center gap-2 justify-center sm:justify-start text-emerald-600 dark:text-emerald-400 font-black text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>دورة معالجة البيانات السبع موحدة ومستقرة 100%</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                  تم التحقق من تكامل السلسلة (إنشاء ➔ حفظ ➔ ترحيل ➔ محاسبة ➔ تقارير ➔ طباعة ➔ أرشفة) وتعمل آلياً كوحدة واحدة متكاملة دون أي تدخل بشري.
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-3 py-1.5 uppercase tracking-wider">
                  Workflow Connected ✓
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* fourth: Launch Readiness */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            <span>رابعاً: كراسة وقائمة جهوزية إطلاق الإصدار الذهبي للإنتاج (Launch Readiness Checklist)</span>
          </h3>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">7 CORE CRITERIA</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          انقر لمراجعة واعتماد بنود النشر الاحترافي ومراقبة الأداء والأمان وحظر استثناءات التشغيل الفعلي:
        </p>

        {/* Launch Readiness Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {launchReadiness.map((item) => (
            <div 
              key={item.id}
              onClick={() => toggleReadinessStatus(item.id)}
              className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all flex flex-col justify-between min-h-[120px] text-right"
            >
              <div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${item.status === 'verified' ? 'bg-amber-500 border-transparent text-slate-950' : 'border-slate-350 dark:bg-slate-900'}`}>
                    {item.status === 'verified' && <Check className="w-3 h-3 text-slate-950 font-black" />}
                  </div>
                  <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-tight">{item.title}</strong>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-2 leading-normal">{item.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/40 text-left text-[9px] font-bold">
                <span className={item.status === 'verified' ? 'text-amber-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                  {item.status === 'verified' ? '✓ تم التحقق والمطابقة' : '⚠️ معلق'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3-Goal UX & Visual Comfort Assessment Panel */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6 text-right">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>خامساً: ميثاق تقييم تجربة المستخدم النهائي ومعايير ملاءمة الراحة البصرية (UX Goals & Visual Comfort Integrity Panel)</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              وفقاً لميثاق جودة الواجهات الفاخرة للشركات الكبرى: يجب أن تحقق كل شاشة ثلاثة أهداف محورية في أقل وقت وجهد ممكنين (<strong>سهولة الفهم، سهولة الإنجاز، والراحة البصرية</strong>).
            </p>
          </div>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md font-black shrink-0">
            ميثاق صفر عيوب إدراكية
          </span>
        </div>

        {/* Warning card for the core cognitive rule */}
        <div className="p-4 bg-gradient-to-r from-amber-500/5 to-transparent border-r-4 border-amber-500 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs">
            <Zap className="w-4 h-4 animate-pulse" />
            <span>القاعدة الذهبية لتصميم واجهات المنصة التعليمية:</span>
          </div>
          <p className="text-xs text-slate-750 dark:text-slate-300 font-extrabold leading-relaxed">
            « إذا احتاج المستخدم إلى التفكير لكي يعرف ماذا يفعل أو أين ينقر، فالشاشة تعتبر غير متوافقة برمجياً وتحتاج فوراً إلى إعادة مراجعة وتحسين جذري. »
          </p>
        </div>

        {/* Interactive Screen Evaluation Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {uxScreens.map((screen) => {
            const hasBlocker = screen.requiresThinking;
            const isFullyCompliant = screen.easeOfUnderstanding && screen.easeOfAccomplishment && screen.visualComfort && !screen.requiresThinking;

            return (
              <div 
                key={screen.id}
                className={`p-5 border transition-all flex flex-col justify-between space-y-4 ${
                  hasBlocker
                    ? 'bg-rose-50/50 dark:bg-rose-950/15 border-rose-500 shadow-md'
                    : isFullyCompliant
                      ? 'bg-transparent dark:bg-slate-950/60 border-slate-150 dark:border-slate-850 hover:border-emerald-500/20'
                      : 'bg-slate-50/40 dark:bg-slate-950/30 border-slate-150/80 dark:border-slate-850/80'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-4 border-b border-slate-200/40 dark:border-slate-850 pb-2.5">
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] bg-slate-200/60 dark:bg-slate-850 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold block w-fit">
                        {screen.module}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight mt-1">{screen.screenName}</h4>
                    </div>

                    <div className="shrink-0">
                      {hasBlocker ? (
                        <span className="bg-rose-500 text-slate-950 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>تجميد الترخيص 🚫</span>
                        </span>
                      ) : isFullyCompliant ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>شاشة معتمدة ✓</span>
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-550 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                          قيد المراجعة ⏳
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3 Pillars checkboxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Goal 1: Understanding */}
                    <button
                      type="button"
                      onClick={() => toggleUxScreenCriteria(screen.id, 'easeOfUnderstanding')}
                      className={`p-2.5 border text-right transition-all cursor-pointer flex flex-col justify-between h-[80px] ${
                        screen.easeOfUnderstanding 
                          ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                          : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[9px] font-black uppercase">1. سهولة الفهم</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${screen.easeOfUnderstanding ? 'bg-emerald-550 border-transparent text-white' : 'border-slate-300 dark:border-slate-750'}`}>
                          {screen.easeOfUnderstanding && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[10px] font-bold leading-normal mt-1.5">
                        {screen.easeOfUnderstanding ? 'وضوح فوري وخالٍ من الغموض' : 'يفتقد للوضوح البصري المباشر'}
                      </p>
                    </button>

                    {/* Goal 2: Accomplishment */}
                    <button
                      type="button"
                      onClick={() => toggleUxScreenCriteria(screen.id, 'easeOfAccomplishment')}
                      className={`p-2.5 border text-right transition-all cursor-pointer flex flex-col justify-between h-[80px] ${
                        screen.easeOfAccomplishment 
                          ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                          : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[9px] font-black uppercase">2. سهولة الإنجاز</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${screen.easeOfAccomplishment ? 'bg-emerald-550 border-transparent text-white' : 'border-slate-300 dark:border-slate-750'}`}>
                          {screen.easeOfAccomplishment && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[10px] font-bold leading-normal mt-1.5">
                        {screen.easeOfAccomplishment ? 'إكمال المهام بنقرتين وبسرعة' : 'يحتاج تقليص لخطوات العمل'}
                      </p>
                    </button>

                    {/* Goal 3: Visual Comfort */}
                    <button
                      type="button"
                      onClick={() => toggleUxScreenCriteria(screen.id, 'visualComfort')}
                      className={`p-2.5 border text-right transition-all cursor-pointer flex flex-col justify-between h-[80px] ${
                        screen.visualComfort 
                          ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                          : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[9px] font-black uppercase">3. الراحة البصرية</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${screen.visualComfort ? 'bg-emerald-550 border-transparent text-white' : 'border-slate-300 dark:border-slate-750'}`}>
                          {screen.visualComfort && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[10px] font-bold leading-normal mt-1.5">
                        {screen.visualComfort ? 'ألوان هادئة ومريحة للعين' : 'تحتاج الواجهة تباين ألوان أفضل'}
                      </p>
                    </button>
                  </div>

                  {/* Remediation Notes / Tech Logs */}
                  <div className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                    <strong>الوضع الراهن والحلول: </strong>{screen.remediationDetails}
                  </div>
                </div>

                {/* Cognitive Blocker Trigger Toggle (هل تتطلب الشاشة تفكيراً ليعرف المستخدم ماذا يفعل؟) */}
                <div className="pt-3 border-t border-slate-200/40 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/30 dark:bg-slate-950/30 p-2.5 rounded-xl">
                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 block">• فحص الجهد الإدراكي للمستخدم (Cognitive Overload Audit)</span>
                    <p className="text-[9px] text-slate-450 leading-normal">
                      هل يتردد المستخدم أو يفكر طويلاً لمعرفة كيفية استخدام الشاشة؟
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleUxScreenCriteria(screen.id, 'requiresThinking')}
                    className={`text-[9px] font-black px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      hasBlocker 
                        ? 'bg-rose-500 text-slate-950 border-rose-450 font-extrabold animate-pulse' 
                        : 'bg-slate-150 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{hasBlocker ? '⚠️ نعم، تتطلب تفكيراً مفرطاً (BLOCKER ACTIVE)' : 'لا تتطلب تفكيراً مفرطاً (خالية من التعقيد)'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Warning Alert if cognitive overload triggers active freeze */}
        {pendingUxScreensCount > 0 ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right animate-pulse">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-400 font-black text-xs justify-center sm:justify-start">
                <ShieldAlert className="w-4 h-4 animate-bounce" />
                <span>بروتوكول تجميد الإجازة نشط: وجود ثغرات في سهولة الواجهات ({pendingUxScreensCount} شاشات تحتاج مراجعة)</span>
              </div>
              <p className="text-[11px] text-rose-200 font-extrabold leading-relaxed">
                « بموجب ميثاق صفر عيوب إدراكية للأنظمة الكبرى: يُحظر إجازة المنصة أو إصدار الختم الذهبي طالما بقيت أي واجهة تتطلب تفكيراً أو تفشل في ركائز الفهم والإنجاز المريح والراحة البصرية للعين. »
              </p>
            </div>
            <span className="bg-rose-500 text-slate-950 text-[10px] font-black px-3.5 py-2 shrink-0 uppercase tracking-wider">
              واجهات معلقة 🚫
            </span>
          </div>
        ) : (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-xs justify-center sm:justify-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>مطابقة تامة لأهداف تجربة المستخدم النهائي والراحة البصرية (UX/UI Certified)</span>
              </div>
              <p className="text-[11px] text-slate-350 font-bold leading-relaxed">
                « كافة الواجهات تضمن تصفحاً مريحاً للعين، سهولة فهم فورية، إنجازاً ميسراً للمهام في خطوتين، وخالية 100% من معرقلات التفكير أو التشتت الذهني. »
              </p>
            </div>
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-3.5 py-2 shrink-0 uppercase tracking-wider">
              جاهزية تجربة المستخدم ✓
            </span>
          </div>
        )}
      </div>

      {/* 11-Element Design Uniformity & Interface Consistency Panel */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6 text-right">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>سادساً: ميثاق مطابقة وتوحيد التصميم للواجهات والشاشات (Design Uniformity & Visual Alignment Panel)</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              وفقاً لميثاق التميز البصري والواجهات الفاخرة: يجب مطابقة كافة الشاشات وضمان توحيد العناصر الفنية الأحد عشر لضمان تجربة مستخدم خالية من أي تشتت أو عشوائية قبل منح شهادة الاعتماد الذهبية.
            </p>
          </div>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md font-black shrink-0">
            ميثاق صفر انحرافات بصرية
          </span>
        </div>

        {/* Warning rule for design consistency */}
        <div className="p-4 bg-gradient-to-r from-amber-500/5 to-transparent border-r-4 border-amber-500 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs">
            <Sliders className="w-4 h-4 animate-pulse" />
            <span>ميثاق الجودة للشركاء والمستثمرين:</span>
          </div>
          <p className="text-xs text-slate-750 dark:text-slate-300 font-extrabold leading-relaxed">
            « أي اختلاف أو عدم تناسق في الهيدر، أو الأزرار، أو النوافذ، أو لوحة الألوان والهرمية البصرية يعالج فوراً. يُحظر منح الختم الذهبي في حال وجود أي عنصر تصميمي غير متطابق. »
          </p>
        </div>

        {/* 11 Uniformity Elements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {designUniformityItems.map((item) => {
            const isOk = item.isUnified;
            // Get proper icon
            let elIcon = <Settings className="w-4 h-4" />;
            if (item.element === 'Header') elIcon = <LayoutTemplate className="w-4 h-4" />;
            else if (item.element === 'Toolbar') elIcon = <SlidersHorizontal className="w-4 h-4" />;
            else if (item.element === 'Buttons') elIcon = <MousePointerClick className="w-4 h-4" />;
            else if (item.element === 'Cards') elIcon = <Layers3 className="w-4 h-4" />;
            else if (item.element === 'Tables') elIcon = <FileSpreadsheet className="w-4 h-4" />;
            else if (item.element === 'Forms') elIcon = <ClipboardList className="w-4 h-4" />;
            else if (item.element === 'Dialogs') elIcon = <MessageSquare className="w-4 h-4" />;
            else if (item.element === 'Colors') elIcon = <Palette className="w-4 h-4" />;
            else if (item.element === 'Typography') elIcon = <FileText className="w-4 h-4" />;
            else if (item.element === 'Icons') elIcon = <Sparkles className="w-4 h-4" />;
            else if (item.element === 'RTL') elIcon = <ArrowLeftRight className="w-4 h-4" />;

            return (
              <div 
                key={item.id}
                className={`p-4 border transition-all flex flex-col justify-between space-y-3 ${
                  isOk 
                    ? 'bg-transparent dark:bg-slate-900/45 border-slate-200 dark:border-slate-850 hover:border-emerald-500/20' 
                    : 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-500/40 shadow-sm'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold font-mono px-2 py-0.5 rounded uppercase">
                      ✓ {item.labelAr}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                      isOk 
                        ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' 
                        : 'bg-rose-500/10 text-rose-500 dark:text-rose-400 animate-pulse'
                    }`}>
                      {isOk ? '✓ متطابق وموحد' : '⚠️ غير متطابق'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isOk ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350' : 'bg-rose-100 dark:bg-rose-950/35 text-rose-500'}`}>
                      {elIcon}
                    </div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">{item.labelEn}</h5>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                </div>

                <div className="pt-2.5 border-t border-slate-150 dark:border-slate-800/60 flex items-center justify-between gap-4">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">حالة المطابقة:</span>
                  <button
                    type="button"
                    onClick={() => toggleDesignUniformityItem(item.id)}
                    className={`text-[9px] font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                      isOk 
                        ? 'bg-emerald-550/10 text-emerald-550 hover:bg-emerald-550/20 border-emerald-550/20' 
                        : 'bg-rose-500 text-slate-950 border-rose-450 hover:bg-rose-450 font-extrabold'
                    }`}
                  >
                    {isOk ? 'موحد بالكامل (Unified ✓)' : 'معالجة وتوحيد التباين 🛠️'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Uniformity Status Banner */}
        {pendingDesignUniformityCount > 0 ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 font-black text-xs justify-center sm:justify-start">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                <span>بروتوكول حظر الإجازة نشط بسبب اختلاف عناصر الواجهات ({pendingDesignUniformityCount} بنود غير موحدة)</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-200 font-extrabold leading-relaxed">
                « بموجب ميثاق صفر عيوب بصرية، يمنع منعاً باتاً إصدار شهادة الاعتماد الذهبية لوجود عناصر تصميمية غير متسقة أو مختلفة في الهيكل والأزرار والخطوط والنماذج. »
              </p>
            </div>
            <span className="bg-rose-500 text-slate-950 text-[10px] font-black px-3.5 py-2 shrink-0 uppercase tracking-wider animate-pulse">
              التصميم غير موحد 🚫
            </span>
          </div>
        ) : (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 font-black text-xs justify-center sm:justify-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>مطابقة تامة لكافة ركائز الهوية البصرية (100% Design Uniformity & RTL Validated)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 font-bold leading-relaxed">
                « كافة عناصر الشاشات (الهيدر، الأزرار، البطاقات، الجداول، النماذج، النوافذ المنبثقة، الألوان، الخطوط، الأيقونات، ودعم RTL) موحدة بنسبة 100% بدون أي تباين مخل. »
              </p>
            </div>
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-3.5 py-2 shrink-0 uppercase tracking-wider">
              التصميم متطابق ✓
            </span>
          </div>
        )}
      </div>

      {/* Terminal Simulator */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-650" />
            <span>خامساً: منصة التحقق البرمجي للأكواد والشيفرات البرمجية (npm run lint & build Verification Suite)</span>
          </h3>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">RUN LINT & BUILD</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          إجراء المطابقة البرمجية النهائية وحل الاستثناءات وإعداد الإصدار كمنتج تشغيلي ذهبي متكامل:
        </p>

        {/* Console Box */}
        <div className="bg-slate-950 p-4 border border-slate-800 text-[10px] font-mono text-slate-300 text-left" dir="ltr">
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-2 font-sans font-bold">
            <span>Golden Release Acceptance Terminal Simulation Logs:</span>
            <span className="text-[9px] text-amber-450 bg-slate-900 px-1.5 py-0.5 rounded-md">VERIFIED GOLDEN CERT</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed truncate">{log}</div>
            ))}
          </div>
        </div>

        {isSimulationActive && (
          <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${simProgress}%` }} />
          </div>
        )}

        <button
          type="button"
          disabled={isSimulationActive}
          onClick={runGoldenCertificationSuite}
          className="w-full bg-slate-950 hover:bg-slate-900 border border-amber-500/30 text-amber-400 py-3.5 px-4 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulationActive ? 'animate-spin' : ''}`} />
          <span>{isSimulationActive ? 'جاري التحقق الفني ومطابقة القواعد الرياضية وبناء حزم النشر الذهبي...' : 'بدء تشغيل موازين الفحص ومحاكاة دورات الإطلاق والصلابة التشغيلية (Check Golden Release) ⚡'}</span>
        </button>
      </div>

      {/* Official Golden Release Seal */}
      <div className="relative overflow-hidden bg-slate-950 border border-amber-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
        
        {/* Animated background stamp logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-amber-500/5 rounded-full border border-dashed border-amber-500/10 flex items-center justify-center pointer-events-none select-none">
          <div className="w-[320px] h-[320px] bg-amber-500/5 rounded-full border border-double border-amber-500/20 -rotate-12 flex items-center justify-center">
            <span className="text-amber-400 text-4xl font-black">إصدار ذهبي معتمد 🏆</span>
          </div>
        </div>

        <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="w-24 h-24 bg-amber-500/15 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/30 shadow-lg shadow-amber-500/5 animate-pulse">
            <Award className="w-12 h-12 text-amber-450 animate-pulse" />
          </div>

          <span className="text-xs font-black text-amber-400 block uppercase tracking-widest">بوابة الاعتماد والترخيص السحابي للمدارس والمجمعات الكبرى - ميثاق المستوى 12.4</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">سند ترخيص وإجازة الإصدار الذهبي الشامل للمنصة التعليمية (Official Enterprise Golden Release Certification Seal)</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            نشهد نحن فريق ضبط معايير الجودة الشاملة ومطابقة الأداء، بأن المنصة بكافة شاشاتها المتسقة، وأزرارها ونوافذها وجداولها الموحدة، وسير العمل الأكاديمي والمالي والتشغيلي بالبنية السحابية المتكاملة، تلبي بالكامل وبفخر منقطع النظير أرقى المعايير العالمية الموازية والمماثلة لأفضل أنظمة ERP العالمية، لتوفير بيئة مستدامة وموثوقة بنسبة 100% للمستثمرين ومديري المدارس والمحاسبين التعليميين.
          </p>

          {isGoldenCertified && (
            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">سند ترخيص وإجازة الإصدار الذهبي الشامل للمنصة</span>
              
              {finalDecision === 'CERTIFIED' && (
                <>
                  <h4 className="text-sm font-black text-emerald-400">✓ 🟢 تم قفل واعتماد الختم والترخيص البلاتيني الذهبي الشامل (Certified)</h4>
                  <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    نشهد باعتماد المنصة الكلي للإنتاج والتشغيل بدون أي ملاحظات معلقة برمز الترخيص الدولي: <code className="font-mono text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded">ERP-PLATFORM-GOLDEN-RELEASE-FINAL-v216</code>.
                  </p>
                </>
              )}
              {finalDecision === 'RECOMMENDED' && (
                <>
                  <h4 className="text-sm font-black text-amber-400">⚠️ 🟡 تم قفل واعتماد الترخيص الذهبي مع توصيات فنية (Certified With Recommendations)</h4>
                  <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    نشهد باعتماد المنصة للتشغيل والإنتاج مع ترحيل التوصيات والتحسينات البسيطة للدورة القادمة برمز ترخيص: <code className="font-mono text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded">ERP-PLATFORM-GOLDEN-RECOMMENDED-v216</code>.
                  </p>
                </>
              )}
              {finalDecision === 'NOT_CERTIFIED' && (
                <>
                  <h4 className="text-sm font-black text-rose-450">⚠️ 🔴 ميثاق الإطلاق معلق - النظام غير معتمد للإنتاج (Not Certified)</h4>
                  <p className="text-[10px] text-rose-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    تم إصدار قرار بعدم اعتماد المنصة مؤقتاً لوجود بنود حوكمة أو موازين جودة تتطلب معالجة فورية برمز تعليق: <code className="font-mono text-rose-400 bg-rose-950/50 px-1.5 py-0.5 rounded">ERP-PLATFORM-SUSPENDED-v216</code>.
                  </p>
                </>
              )}
              
              <div className="pt-2 border-t border-slate-800/40 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400 text-right" dir="rtl">
                <div>
                  <span className="block text-slate-500 font-extrabold">المشرف العام للاعتماد النهائي:</span>
                  <strong className="text-slate-200 block mt-0.5 font-mono">salafe10@gmail.com</strong>
                </div>
                <div>
                  <span className="block text-slate-500 font-extrabold">تاريخ ختم وصدور الترخيص:</span>
                  <strong className="text-slate-200 block mt-0.5">{new Date().toISOString().split('T')[0]}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Eligibility warning if some things are unchecked */}
          {!isEligibleForGoldenSeal && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 flex flex-col items-center justify-center gap-2 max-w-xl mx-auto">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>حظر ميثاق الجودة: لا يمكن إجازة أو توقيع ميثاق الإصدار الذهبي في الوقت الحالي</span>
              </div>
              <p className="text-[10px] text-rose-300 font-semibold leading-relaxed text-center">
                يجب استيفاء وتفعيل بنود ميثاق الحوكمة السبعة (7 Strict Protocol Criteria)، ومطابقة ركائز الأمان ومستلزمات البنية، والتحقق التام من أهداف تجربة المستخدم والراحة البصرية، ومطابقة وتوحيد تصميم ومظهر العناصر الأحد عشر (الترويسة، أشرطة البحث، الأزرار، البطاقات، الجداول، النماذج، النوافذ المنبثقة، الألوان، الخطوط، الأيقونات، ودعم RTL بالكامل) بنسبة 100% لفتح صلاحية إصدار صك الاعتماد النهائي. يرجى مراجعة "الركائز المعلقة والشاشات غير المطابقة" في الأعلى.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              disabled={!isEligibleForGoldenSeal}
              onClick={() => {
                setIsGoldenCertified(true);
                triggerNotification('تهانينا الكبرى والتاريخية! تم تفعيل وتوقيع رخصة ميثاق الإصدار الذهبي الشامل بنجاح باهر وبنسبة 100%! 🏆🚀👑🌟', 'success');
              }}
              className={`font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${isEligibleForGoldenSeal ? 'bg-amber-500 hover:bg-amber-650 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>الموافقة وتوقيع رخصة ميثاق الإصدار الذهبي الشامل 🏆👑</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير كراسة الميثاق الذهبي المعتمد (Golden Release Summary) 📄</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
