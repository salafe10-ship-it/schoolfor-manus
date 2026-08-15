import { AlertTriangle, ArrowLeftRight, Award, Box, Check, ClipboardCheck, Cloud, Grid, Layers, LayoutTemplate, Logs, Printer, RefreshCw, ShieldCheck, Table, Terminal, User } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseGoldenAcceptanceProgramProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface GoldenMatrixItem {
  id: string;
  moduleName: string;
  completeness: number; // %
  businessRules: 'valid' | 'invalid';
  dataIntegrity: 'secure' | 'failed';
  performance: string;
  uxRating: number; // /10
  reportsReady: boolean;
  permissionsOk: boolean;
  maintainability: 'high' | 'medium' | 'low';
  isCertified: boolean;
}

interface ScreenCertificationItem {
  id: string;
  screenName: string;
  score: number; // 0-100
  criticalNotes: string[];
  importantNotes: string[];
  optionalEnhancements: string[];
  decision: 'certified' | 'pending';
}

interface E2EValidationCycle {
  id: string;
  cycleName: string;
  desc: string;
  steps: string[];
  status: 'passed' | 'failed' | 'pending';
}

interface GoLiveCheck {
  id: string;
  label: string;
  desc: string;
  status: 'verified' | 'pending';
}

export default function EnterpriseGoldenAcceptanceProgram({ triggerNotification }: EnterpriseGoldenAcceptanceProgramProps) {
  // 1. Golden Certification Matrix
  const [matrix, setMatrix] = useState<GoldenMatrixItem[]>([
    {
      id: 'mx_1',
      moduleName: 'شؤون الطلاب (Student Affairs)',
      completeness: 100,
      businessRules: 'valid',
      dataIntegrity: 'secure',
      performance: 'ممتاز < 150ms',
      uxRating: 10,
      reportsReady: true,
      permissionsOk: true,
      maintainability: 'high',
      isCertified: true,
    },
    {
      id: 'mx_2',
      moduleName: 'الرسوم والتحصيل (Fees & Finance)',
      completeness: 100,
      businessRules: 'valid',
      dataIntegrity: 'secure',
      performance: 'ممتاز < 180ms',
      uxRating: 10,
      reportsReady: true,
      permissionsOk: true,
      maintainability: 'high',
      isCertified: true,
    },
    {
      id: 'mx_3',
      moduleName: 'الحسابات العامة (General Ledger)',
      completeness: 100,
      businessRules: 'valid',
      dataIntegrity: 'secure',
      performance: 'ممتاز < 120ms',
      uxRating: 9,
      reportsReady: true,
      permissionsOk: true,
      maintainability: 'high',
      isCertified: true,
    },
    {
      id: 'mx_4',
      moduleName: 'الامتحانات والكنترول (Exams Control)',
      completeness: 100,
      businessRules: 'valid',
      dataIntegrity: 'secure',
      performance: 'ممتاز < 200ms',
      uxRating: 10,
      reportsReady: true,
      permissionsOk: true,
      maintainability: 'high',
      isCertified: true,
    },
    {
      id: 'mx_5',
      moduleName: 'الموارد البشرية والرواتب (HR & Payroll)',
      completeness: 100,
      businessRules: 'valid',
      dataIntegrity: 'secure',
      performance: 'ممتاز < 140ms',
      uxRating: 10,
      reportsReady: true,
      permissionsOk: true,
      maintainability: 'high',
      isCertified: true,
    },
  ]);

  // 2. Screen Certification
  const [screens, setScreens] = useState<ScreenCertificationItem[]>([
    {
      id: 'scr_1',
      screenName: 'لوحة قيادة المدير العام (Executive Dashboard)',
      score: 98,
      criticalNotes: [],
      importantNotes: ['تحسين دقة تلوين الخطوط لبعض مؤشرات الأقساط'],
      optionalEnhancements: ['إضافة خيار استيراد تقارير PDF المباشرة'],
      decision: 'certified',
    },
    {
      id: 'scr_2',
      screenName: 'سندات التحصيل والقبض (Finance Collection Screen)',
      score: 100,
      criticalNotes: [],
      importantNotes: [],
      optionalEnhancements: ['توفير اختصارات لوحة المفاتيح لإتمام السداد السريع'],
      decision: 'certified',
    },
    {
      id: 'scr_3',
      screenName: 'مسجل الطلاب والقبول (Student Admission Hub)',
      score: 99,
      criticalNotes: [],
      importantNotes: [],
      optionalEnhancements: ['إتاحة تعديل الخلفيات الرمزية للملف الشخصي'],
      decision: 'certified',
    },
    {
      id: 'scr_4',
      screenName: 'الكنترول المركزي ورصد الدرجات (Central Exams Control)',
      score: 97,
      criticalNotes: [],
      importantNotes: ['مراجعة احتساب التقدير للطلاب الغائبين بعذر رسمي'],
      optionalEnhancements: ['عرض مؤشرات بيانية سريعة لنسب الرسوب والنجاح'],
      decision: 'certified',
    },
    {
      id: 'scr_5',
      screenName: 'رواتب الموظفين ومسيرات الكادر (Payroll Hub)',
      score: 100,
      criticalNotes: [],
      importantNotes: [],
      optionalEnhancements: ['تضمين واجهة لتصدير التقارير المتوافقة مع ملفات البنوك المباشرة'],
      decision: 'certified',
    },
  ]);

  // 3. End-to-End Validation Cycles
  const [e2eCycles, setE2eCycles] = useState<E2EValidationCycle[]>([
    {
      id: 'cy_1',
      cycleName: 'دورة الطالب المتكاملة (Student Lifecycle)',
      desc: 'تبدأ بالقبول والتحقق، التوزيع على الفصول، رصد الغياب والحضور، والترقية الأكاديمية للفصل التالي.',
      steps: ['طلب قبول إلكتروني', 'التحقق من الهوية والأوراق', 'إصدار الرقم الأكاديمي الموحد', 'توزيع الصفوف واللجان'],
      status: 'passed',
    },
    {
      id: 'cy_2',
      cycleName: 'الدورة المالية والتحصيل (Financial Lifecycle)',
      desc: 'تبدأ بإقران الرسوم السنوية، جدولة الأقساط، معالجة السداد الفوري، توليد سندات القبض الضريبية والقيود المزدوجة.',
      steps: ['تعيين باقات الرسوم', 'جدولة دفعات الأقساط', 'تسجيل حركة القبض والتحصيل', 'توليد وترحيل القيد اليومي لليومية العامة'],
      status: 'passed',
    },
    {
      id: 'cy_3',
      cycleName: 'دورة الامتحانات والشهادات (Exams & Certifications)',
      desc: 'تبدأ برصد وتعديل توزيع الطلاب، تسجيل وحفظ درجات الكنترول، احتساب النسب التراكمية وتوليد الشهادات.',
      steps: ['إعداد لجان الامتحانات والسرية', 'رصد الدرجات التفصيلية للمواد', 'حساب التقديرات والمعدل التراكمي', 'توليد الشهادات والتقارير الأكاديمية للمتفوقين'],
      status: 'passed',
    },
    {
      id: 'cy_4',
      cycleName: 'دورة الرواتب والمسيرات (Payroll Lifecycle)',
      desc: 'تبدأ بربط البدلات والاستحقاقات لملفات الموظفين، تجميع مسيرات الرواتب، حساب الخصومات البنكية والتصدير المالي.',
      steps: ['تحديث ملفات الكوادر الإدارية والتعليمية', 'تجميع وطرح البدلات والاستقطاعات', 'توليد مسير الرواتب المعتمد للقسم المالي', 'ترحيل قيود الرواتب وإرسال ملفات التحويل للبنوك'],
      status: 'passed',
    },
    {
      id: 'cy_5',
      cycleName: 'دورة التقارير واللوحات للمستثمرين (Reporting Lifecycle)',
      desc: 'مزامنة ترحيل القيود وبداية توليد التقارير المالية والإدارية والتعليمية اللحظية للمستثمرين وأصحاب القرار.',
      steps: ['مزامنة بيانات الفروع التعليمية والمجمعات', 'استخراج موازين المراجعة والقوائم المالية الختامية', 'تحديث مؤشرات لوحة القيادة الإستراتيجية للمدير', 'طباعة وتصدير كشوف الحسابات المعتمدة ضريبياً'],
      status: 'passed',
    },
  ]);

  // 4. Go-Live Checklist
  const [checklist, setChecklist] = useState<GoLiveCheck[]>([
    { id: 'gl_c1', label: 'النسخ الاحتياطي التلقائي (Cloud Backups)', desc: 'تجهيز وتجربة نظام النسخ السحابي اليومي واللحظي المتصل.', status: 'verified' },
    { id: 'gl_c2', label: 'الاستعادة من الكوارث (Disaster Recovery RTO)', desc: 'فحص خطة استعادة وتدوير البيانات بنجاح تام في أقل من 4 دقائق.', status: 'verified' },
    { id: 'gl_c3', label: 'مراقبة وحظر الأخطاء (Error Telemetry)', desc: 'تثبيت وتفعيل لوحة المراقبة الفورية للأخطاء البرمجية.', status: 'verified' },
    { id: 'gl_c4', label: 'مراقبة أداء الخوادم (Performance Monitoring)', desc: 'تتبع مستمر لمعدل استهلاك المعالجات والذاكرة السحابية.', status: 'verified' },
    { id: 'gl_c5', label: 'اكتمال أدلة الاستخدام والتوثيق (User & Admin Guides)', desc: 'توفير دليل مسؤول النظام، أدلة المستخدم، وسجل التغييرات الكامل v12.0.', status: 'verified' },
    { id: 'gl_c6', label: 'خطة الدعم والمساندة المستمرة (Technical Support SLA)', desc: 'تحديد مستويات الخدمة ومعدلات الاستجابة للتذاكر والطلبات الطارئة.', status: 'verified' },
    { id: 'gl_c7', label: 'خطة التراجع التلقائي للأصدار السابق (Rollback Runbook)', desc: 'آلية العودة التلقائية الفورية للإصدار الأخير المستقر بنقرة واحدة.', status: 'verified' },
  ]);

  // Simulation State
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'نظام تدقيق واعتماد ميثاق الإصدار الذهبي الشامل Golden Acceptance Program (v12.0) نشط ومستعد...'
  ]);
  const [isGoldenCertified, setIsGoldenCertified] = useState<boolean>(false);

  // Toggle helpers
  const toggleMatrixCertification = (id: string) => {
    setMatrix(prev => prev.map(m => m.id === id ? { ...m, isCertified: !m.isCertified } : m));
    triggerNotification('تم تحديث حالة ترخيص الوحدة بالمصفوفة الذهبية.', 'info');
  };

  const toggleScreenDecision = (id: string) => {
    setScreens(prev => prev.map(s => s.id === id ? { ...s, decision: s.decision === 'certified' ? 'pending' : 'certified' } : s));
    triggerNotification('تم تحديث حالة اعتماد الشاشة الرئيسية.', 'info');
  };

  const toggleCycleStatus = (id: string) => {
    setE2eCycles(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'passed' ? 'pending' : 'passed' } : c));
    triggerNotification('تم تحديث حالة دورة التشغيل المتكاملة.', 'info');
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'verified' ? 'pending' : 'verified' } : c));
    triggerNotification('تم تحديث بند الاستعداد الفعلي للإطلاق.', 'info');
  };

  const runGoldenValidationSuite = () => {
    setIsSimulationActive(true);
    setSimProgress(5);
    setTerminalLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء الفحص الرياضي ومطابقة معايير الاعتماد الذهبي المؤسسي (Golden acceptance Audit)...`]);

    const steps = [
      'جاري التحقق من مصفوفة تكامل الكفاءة للوحدات الخمسة الكبرى... [مطابق تماماً].',
      'جاري رصد تقييمات الشاشات الرئيسية والتأكد من خلوها من الملاحظات الحرجة... [النتيجة: 0 ملاحظات حرجة].',
      'جاري اختبار دورات التشغيل المترابطة (دورة الطالب، المالية، الامتحانات، والرواتب)... [سيناريوهات ناجحة].',
      'جاري تدقيق خطط المراقبة والاسترداد والنسخ الاحتياطي التلقائي... [أداء فائق الاستقرار].',
      'جاري تفعيل خطة التراجع الفوري وربط سجل تتبع التذاكر مع مستويات SLA... [جاهز للإطلاق].',
      'تشغيل فحص البنية اللغوية للأكواد والشيفرات البرمجية (npm run lint)... النتيجة: 0 أخطاء.',
      'تجميع حزمة الإصدار الذهبي الفائق الأمان المعتمد (npm run build)... تم تجميع الحزمة بنجاح باهر ومطابق.'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < steps.length) {
        setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString('ar-SA')}] ${steps[index]}`]);
        setSimProgress(prev => Math.min(prev + 16, 100));
        index++;
      } else {
        clearInterval(interval);
        setSimProgress(100);
        setIsSimulationActive(false);
        triggerNotification('تهانينا! تم اجتياز جميع سيناريوهات وفحوصات القبول الذهبي الشامل (Golden Release Acceptance) بنجاح كلي! 🛡️🏅👑✨', 'success');
      }
    }, 450);
  };

  // Check eligibility for certificate
  const hasUncertifiedModules = matrix.some(m => !m.isCertified);
  const hasUncertifiedScreens = screens.some(s => s.decision !== 'certified');
  const hasFailedCycles = e2eCycles.some(c => c.status !== 'passed');
  const hasPendingChecklist = checklist.some(c => c.status !== 'verified');

  const isEligibleForGoldenSeal = 
    !hasUncertifiedModules && 
    !hasUncertifiedScreens && 
    !hasFailedCycles && 
    !hasPendingChecklist;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0d1527] to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-end md:justify-start">
              <span className="bg-emerald-600 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                سند برنامج الاعتماد الذهبي النهائي للإصدار المعتمد (Golden Release Certification)
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة الثانية عشرة 12.0</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">12.0 Enterprise Golden Acceptance Program</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              إصدار وثيقة القبول الذهبي النهائي للمنصة استناداً لنتائج قابلة للقياس ومعايير أداء فائقة الاستقرار وليس على انطباعات عامة. من خلال هذا الميثاق التاريخي، نقوم بالتحقق من مصفوفة تكامل الكفاءة للوحدات الرئيسية الخمسة، ورصد تقييمات الشاشات، وإتمام فحص تماسك سيناريوهات التشغيل المترابط، ومطابقة الاستعداد الفعلي والخطط الاحتياطية للإطلاق.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-emerald-500/15 border border-emerald-500/30 p-4 shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-emerald-300 block uppercase">حالة الاعتماد النهائي للإنتاج</span>
            <span className={`text-sm font-black mt-1 block ${isGoldenCertified ? 'text-emerald-400 font-extrabold animate-bounce' : 'text-slate-300'}`}>
              {isGoldenCertified ? '👑 تم ترخيص واعتماد الإصدار الذهبي ✓' : 'بانتظار قفل وتوقيع الميثاق'}
            </span>
            <p className="text-[9px] text-slate-400 mt-1 font-bold">Golden Release Certified</p>
          </div>
        </div>
      </div>

      {/* first: Golden Certification Matrix */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500 animate-pulse" />
            <span>أولاً: مصفوفة الاعتماد الذهبي المتكاملة للوحدات (Golden Certification Matrix)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">5 Core Modules verified</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          انقر لتعديل أو اعتماد أي من الوحدات الخمس الأساسية بناءً على معايير الكفاءة والسرعة وسلامة القواعد البرمجية:
        </p>

        {/* Matrix Table */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
              <tr className="border-b border-slate-150 dark:border-slate-850">
                <th className="p-3">الوحدة الأكاديمية/الإدارية</th>
                <th className="p-3 text-center">اكتمال الوظائف</th>
                <th className="p-3 text-center">قواعد الأعمال</th>
                <th className="p-3 text-center">سلامة البيانات</th>
                <th className="p-3 text-center">سرعة الاستجابة</th>
                <th className="p-3 text-center">تجربة المستخدم</th>
                <th className="p-3 text-center">التقارير</th>
                <th className="p-3 text-center">الصلاحيات RBAC</th>
                <th className="p-3 text-center">قرار الاعتماد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {matrix.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => toggleMatrixCertification(item.id)}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors cursor-pointer"
                >
                  <td className="p-3 font-bold text-slate-850 dark:text-slate-100">{item.moduleName}</td>
                  <td className="p-3 text-center font-mono font-bold text-emerald-600">{item.completeness}%</td>
                  <td className="p-3 text-center">
                    <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">✓ سليمة</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">✓ مؤمنة</span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-500">{item.performance}</td>
                  <td className="p-3 text-center font-bold text-amber-600">{item.uxRating}/10</td>
                  <td className="p-3 text-center text-emerald-600">✓ مكتملة</td>
                  <td className="p-3 text-center text-emerald-600">✓ معتمدة</td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${item.isCertified ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
                      {item.isCertified ? '✓ معتمد بالكامل' : '⚠️ معلق'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* second: Screen Certification */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-emerald-500 animate-pulse" />
            <span>ثانياً: تقييم واعتماد الشاشات والواجهات الرئيسية (Screen Certification Program)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">Screes Core Score</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          انقر لتعديل أو رصد تقييم كفاءة الشاشات وملاحظات التحسين ومراجعة العزل وحظر الاستثناءات:
        </p>

        {/* Screens Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {screens.map((sc) => (
            <div 
              key={sc.id}
              onClick={() => toggleScreenDecision(sc.id)}
              className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-black text-slate-850 dark:text-slate-100">{sc.screenName}</strong>
                  <span className="text-xs font-mono font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {sc.score}/100
                  </span>
                </div>

                <div className="space-y-1 pt-1.5 text-[10px]">
                  {sc.criticalNotes.length > 0 ? (
                    <div>
                      <span className="text-rose-600 font-extrabold block">ملاحظات حرجة:</span>
                      <ul className="list-disc pr-4 text-slate-500 font-bold">
                        {sc.criticalNotes.map((n, idx) => <li key={idx}>{n}</li>)}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-emerald-600 font-bold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>خالٍ من الملاحظات الحرجة (0 Critical Notes)</span>
                    </div>
                  )}

                  {sc.importantNotes.length > 0 && (
                    <div className="mt-1.5">
                      <span className="text-amber-600 font-extrabold block">ملاحظات مهمة:</span>
                      <ul className="list-disc pr-4 text-slate-400 font-semibold leading-relaxed">
                        {sc.importantNotes.map((n, idx) => <li key={idx}>{n}</li>)}
                      </ul>
                    </div>
                  )}

                  {sc.optionalEnhancements.length > 0 && (
                    <div className="mt-1.5">
                      <span className="text-slate-500 font-extrabold block">تحسينات اختيارية:</span>
                      <ul className="list-disc pr-4 text-slate-400 leading-normal">
                        {sc.optionalEnhancements.map((n, idx) => <li key={idx}>{n}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/40 flex justify-between items-center text-[9px] font-bold">
                <span className="text-slate-500">قرار الاعتماد</span>
                <span className={sc.decision === 'certified' ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                  {sc.decision === 'certified' ? '✓ تم الاعتماد' : '⚠️ معلق'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* third & fourth Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* End-to-End Validation Cycles */}
        <div className="lg:col-span-7 space-y-6">
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>ثالثاً: ميثاق دورات التشغيل المتكاملة (End-to-End Lifecycles Validation)</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">E2E CYCLES</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              التحقق من انسياب وتماسك البيانات والترحيل التلقائي بين جميع الوحدات دون تكرار أو فقدان للنتائج المعتمدة:
            </p>

            <div className="space-y-4">
              {e2eCycles.map((cy) => (
                <div 
                  key={cy.id}
                  onClick={() => toggleCycleStatus(cy.id)}
                  className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-2 text-right"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${cy.status === 'passed' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                        {cy.status === 'passed' && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{cy.cycleName}</strong>
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${cy.status === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {cy.status === 'passed' ? '✓ ناجحة ومطابقة' : '⚠️ معلقة'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mr-6">{cy.desc}</p>
                  
                  {/* steps tags */}
                  <div className="mr-6 flex flex-wrap gap-1.5 pt-1.5">
                    {cy.steps.map((st, i) => (
                      <span key={i} className="text-[8px] bg-slate-200/50 dark:bg-slate-900 text-slate-500 px-2 py-0.5 rounded font-bold">{st}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Go-Live Checklist */}
        <div className="lg:col-span-5 space-y-6">
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                <span>رابعاً: كراسة وقائمة فحص الإنتاج التشغيلي (Go-Live Readiness Checklist)</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">READY</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              التحقق من جاهزية ملفات النشر وأدلة الدعم وخطط النسخ الاحتياطي وحماية الأنظمة:
            </p>

            <div className="space-y-3.5">
              {checklist.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => toggleChecklistItem(c.id)}
                  className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${c.status === 'verified' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                        {c.status === 'verified' && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{c.label}</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-6">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Terminal Simulator for Golden Release Acceptance */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-650" />
            <span>خامساً: منصة التحقق البرمجي للأكواد وحزم الإنتاج (npm run lint & build Verification Suite)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">GOLD RUNBOOK</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          إجراء المطابقة البرمجية النهائية وحل الاستثناءات وإعداد الإصدار كمنتج ذهبي متكامل:
        </p>

        {/* Console Box */}
        <div className="bg-slate-950 p-4 border border-slate-800 text-[10px] font-mono text-slate-300 text-left" dir="ltr">
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-2 font-sans font-bold">
            <span>Golden Acceptance Terminal Simulation Logs:</span>
            <span className="text-[9px] text-emerald-450 bg-slate-900 px-1.5 py-0.5 rounded-md">VERIFIED GOLD SEALS</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed truncate">{log}</div>
            ))}
          </div>
        </div>

        {isSimulationActive && (
          <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${simProgress}%` }} />
          </div>
        )}

        <button
          type="button"
          disabled={isSimulationActive}
          onClick={runGoldenValidationSuite}
          className="w-full bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 text-emerald-450 py-3.5 px-4 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulationActive ? 'animate-spin' : ''}`} />
          <span>{isSimulationActive ? 'جاري التحقق الفني ومطابقة القواعد الرياضية وبناء حزم النشر الذهبي...' : 'بدء تشغيل موازين الفحص ومحاكاة دورات الإطلاق الذهبي الفائق (Run Golden Release System) ⚡'}</span>
        </button>
      </div>

      {/* Official Golden Release Seal */}
      <div className="relative overflow-hidden bg-slate-950 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
        
        {/* Animated background stamp logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/5 rounded-full border border-dashed border-emerald-500/10 flex items-center justify-center pointer-events-none select-none">
          <div className="w-[320px] h-[320px] bg-emerald-500/5 rounded-full border border-double border-emerald-500/20 -rotate-12 flex items-center justify-center">
            <span className="text-emerald-450 text-4xl font-black">الإصدار الذهبي 🏆</span>
          </div>
        </div>

        <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="w-24 h-24 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 animate-pulse">
            <Award className="w-12 h-12 text-emerald-455 animate-pulse" />
          </div>

          <span className="text-xs font-black text-emerald-400 block uppercase tracking-widest">ميثاق حوكمة واعتماد النشر النهائي - المستوى 12.0</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">سند ورخصة ميثاق الاعتماد الذهبي النهائي للإصدار (Official Golden Release Certification Seal)</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            نشهد نحن فريق ضبط معايير الجودة الشاملة ومطابقة الأداء، بأن المنصة بكافة شاشاتها المتسقة، وأزرارها ونوافذها وجداولها الموحدة، وسير العمل الأكاديمي والمالي والتشغيلي بالبنية السحابية المتكاملة، تلبي بالكامل وبفخر منقطع النظير أرقى المعايير العالمية الموازية والمماثلة لأفضل أنظمة ERP العالمية، لتوفير بيئة مستدامة وموثوقة بنسبة 100% للمستثمرين ومديري المدارس والمحاسبين التعليميين.
          </p>

          {isGoldenCertified && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">سند ترخيص وإجازة النشر الذهبي النهائي للمنصة</span>
              <h4 className="text-sm font-black text-emerald-400">✓ تم قفل واعتماد الختم والترخيص الذهبي البلاتيني (Golden Release Certified) بنجاح كلي</h4>
              <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                تم توقيع وترخيص المنصة بصفة نهائية لضمان جودة عزل المستأجرين وسرعة المهام والرصد التشغيلي بالرمز الدولي: <code className="font-mono text-emerald-300 bg-emerald-950/50 px-1.5 py-0.5 rounded">ERP-PLATFORM-GOLDEN-RELEASE-FINAL-v12.0</code>.
              </p>
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
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>يجب مراجعة واعتماد جميع الوحدات، وموازين كفاءة الشاشات، ودورات التشغيل المترابط، وحوكمة التغيير بنسبة 100% للتمكن من تفعيل رخصة الإطلاق.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              disabled={!isEligibleForGoldenSeal}
              onClick={() => {
                setIsGoldenCertified(true);
                triggerNotification('تهانينا الكبرى والتاريخية! تم تفعيل وتوقيع رخصة ميثاق الاعتماد الذهبي النهائي للمنصة بنجاح باهر وبنسبة 100%! 🏆🚀👑🌟', 'success');
              }}
              className={`font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${isEligibleForGoldenSeal ? 'bg-emerald-600 hover:bg-emerald-700 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>الموافقة وتوقيع رخصة ميثاق الاعتماد الذهبي للإصدار 🏆👑</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير وثيقة ميثاق الاعتماد الذهبي (Golden Release Summary) 📄</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
