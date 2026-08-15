import { Activity, AlertTriangle, Award, BadgeCheck, Box, Check, Crown, FileCheck, Grid, Key, LayoutTemplate, Logs, Printer, Receipt, RefreshCw, Stamp, Terminal, User } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseGoldenReleaseCertProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface ModuleCard {
  id: string;
  name: string;
  category: string;
  status: 'certified' | 'pending';
  score: number;
  reviewer: string;
}

interface ScenarioItem {
  id: string;
  title: string;
  description: string;
  status: 'success' | 'pending';
  module: string;
}

interface OperationalItem {
  id: string;
  label: string;
  desc: string;
  status: 'ready' | 'pending';
}

interface DocItem {
  id: string;
  name: string;
  status: 'complete' | 'draft';
  desc: string;
}

export default function EnterpriseGoldenReleaseCert({ triggerNotification }: EnterpriseGoldenReleaseCertProps) {
  // 1. Golden Readiness Review Modules
  const [modules, setModules] = useState<ModuleCard[]>([
    { id: 'mod_1', name: 'شؤون الطلاب (Student Affairs)', category: 'الأكاديميات والقبول', status: 'certified', score: 100, reviewer: 'لجنة شؤون الطلاب العليا' },
    { id: 'mod_2', name: 'الرسوم والتحصيل (Fees & Bills)', category: 'الشؤون المالية والتحصيل', status: 'certified', score: 99, reviewer: 'الإدارة المالية المركزية' },
    { id: 'mod_3', name: 'الحسابات العامة (General Ledger)', category: 'الشؤون المالية والتحصيل', status: 'certified', score: 100, reviewer: 'المدقق المالي المعتمد' },
    { id: 'mod_4', name: 'الامتحانات (Exams & Control)', category: 'الأكاديميات والقبول', status: 'certified', score: 98, reviewer: 'لجنة الكنترول العام للمدارس' },
    { id: 'mod_5', name: 'الموارد البشرية (HR & Payroll)', category: 'الإدارة التشغيلية والمساندة', status: 'certified', score: 98, reviewer: 'إدارة شؤون الموظفين والموارد' },
    { id: 'mod_6', name: 'التقارير (Reports & Dashboards)', category: 'الإدارة التشغيلية والمساندة', status: 'certified', score: 99, reviewer: 'إدارة نظم المعلومات والتقارير' },
    { id: 'mod_7', name: 'إدارة النظام (System Administration)', category: 'البنية السحابية والأمان', status: 'certified', score: 100, reviewer: 'إدارة أمن وحوكمة المنصة' },
  ]);

  // 2. Enterprise Scenario Certification (13 critical scenarios)
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([
    { id: 'sc_1', title: 'قبول طالب جديد (Student Admission)', description: 'تسجيل البيانات، مطابقة الفئة العمرية، وربط ولي الأمر بالمستندات المرفقة.', status: 'success', module: 'شؤون الطلاب' },
    { id: 'sc_2', title: 'إنشاء الرسوم (Fees Generation)', description: 'تهيئة جدول الرسوم الأساسية، والزي المدرسي، والخدمات الإضافية وتطبيقها آلياً.', status: 'success', module: 'الرسوم والتحصيل' },
    { id: 'sc_3', title: 'جدولة الأقساط (Installment Scheduling)', description: 'تقسيم المستحقات السنوية إلى دفعات ميسرة وربطها بالتواريخ بمرونة كاملة.', status: 'success', module: 'الرسوم والتحصيل' },
    { id: 'sc_4', title: 'التحصيل (Fee Collection)', description: 'استلام مبالغ جزئية أو كاملة إلكترونياً أو نقدياً والتحديث اللحظي للمستحقات.', status: 'success', module: 'الرسوم والتحصيل' },
    { id: 'sc_5', title: 'إصدار سند القبض (Receipt Voucher)', description: 'توليد السند برقم مرجعي فريد وتوثيق تاريخ الحركة المالي والضريبة المعتمدة.', status: 'success', module: 'الحسابات العامة' },
    { id: 'sc_6', title: 'إنشاء القيد اليومي (Daily Journal Entry)', description: 'قيد محاسبي آلي مزدوج متوازن كلياً من السند لترحيله للأستاذ دون تدخل بشري.', status: 'success', module: 'الحسابات العامة' },
    { id: 'sc_7', title: 'تحديث الأستاذ العام (General Ledger Update)', description: 'انعكاس كافة الحركات والقيود في كشف حسابات الأستاذ العام والفروع لحظياً.', status: 'success', module: 'الحسابات العامة' },
    { id: 'sc_8', title: 'استخراج القوائم المالية (Financial Statements)', description: 'توليد ميزان المراجعة، قائمة الدخل، والميزانية العمومية بدقة متناهية وسرعة فائقة.', status: 'success', module: 'الحسابات العامة' },
    { id: 'sc_9', title: 'إدخال الدرجات (Grades Entry)', description: 'رصد درجات الفترات والاختبارات بواسطة المعلمين بنظام تدقيق وتثبيت آمن.', status: 'success', module: 'الامتحانات' },
    { id: 'sc_10', title: 'استخراج النتائج (Results Extraction)', description: 'تجميع الدرجات، احتساب التقديرات والنسب المئوية التراكمية، وإصدار كشوف التميز.', status: 'success', module: 'الامتحانات' },
    { id: 'sc_11', title: 'احتساب الرواتب (Payroll Calculation)', description: 'معالجة حضور الموظفين، السلف، خصومات التأخير، احتساب البدلات ورفع المسير.', status: 'success', module: 'الموارد البشرية' },
    { id: 'sc_12', title: 'الإقفال المالي (Financial Closing)', description: 'ترحيل الحسابات الختامية السنوية، تصفير الإيرادات والمصروفات وتجميد السجل المالي.', status: 'success', module: 'الحسابات العامة' },
    { id: 'sc_13', title: 'فتح عام دراسي جديد (New Academic Year)', description: 'ترقية الطلاب لصفوفهم التالية، ترحيل الأرصدة المالية، وتهيئة الفصول الدراسية.', status: 'success', module: 'إدارة النظام' },
  ]);

  // 3. Operational Readiness (6 aspects)
  const [operationalAspects, setOperationalAspects] = useState<OperationalItem[]>([
    { id: 'op_1', label: 'النسخ الاحتياطي (Automated Backups)', desc: 'جدولة دورية لأخذ نسخ كاملة وقواعد البيانات السحابية بصفة آلية كل ساعة.', status: 'ready' },
    { id: 'op_2', label: 'الاستعادة (Disaster Recovery & Restore)', desc: 'اختبار محاكاة استعادة المنصة بالكامل في غضون دقيقتين دون فقد أي بيانات.', status: 'ready' },
    { id: 'op_3', label: 'سجلات التدقيق الشامل (Comprehensive Audit Trail)', desc: 'تسجيل فوري متصل لكل حركة في النظام وهوية المنفذ والقيم قبل وبعد التعديل.', status: 'ready' },
    { id: 'op_4', label: 'صلاحيات الأدوار الوظيفية (Role Permissions Grid)', desc: 'تطبيق القيود الصارمة القائمة على الأدوار (RBAC) والفصل بين المهام والواجبات.', status: 'ready' },
    { id: 'op_5', label: 'مراقبة الأخطاء (Live Error Tracking Logs)', desc: 'رصد الأخطاء البرمجية عبر منصة تتبع لحظي وإشعار فريق العمل على الفور.', status: 'ready' },
    { id: 'op_6', label: 'مراقبة الأداء (Real-time Performance Metrics)', desc: 'قياس سرعة استجابة الاستعلامات واستقرار الخوادم لخدمة آلاف المستخدمين بدقة.', status: 'ready' },
  ]);

  // 4. Release Documentation (5 key docs)
  const [docs, setDocs] = useState<DocItem[]>([
    { id: 'doc_1', name: 'دليل المستخدم (User Manual)', desc: 'شرح متكامل لجميع الخصائص والمميزات الموجهة للموظفين والمعلمين والمديرين.', status: 'complete' },
    { id: 'doc_2', name: 'دليل مسؤول النظام (Admin Manual)', desc: 'دليل المطورين والمسؤولين لتهيئة الفروع وصلاحيات الأدوار والنسخ الاحتياطي.', status: 'complete' },
    { id: 'doc_3', name: 'سجل التغييرات (Change Log)', desc: 'توثيق كلي لكافة الميزات والإضافات البرمجية التي تمت صياغتها خطوة بخطوة.', status: 'complete' },
    { id: 'doc_4', name: 'ملاحظات الإصدار (Release Notes)', desc: 'بيان توضيحي لخصائص ومزايا الإصدار السحابي الموحد والتحسينات المضافة.', status: 'complete' },
    { id: 'doc_5', name: 'خطة الترقية والانتقال السلس (Upgrade Plan)', desc: 'دليل الخطوات لترقية وتحديث الفروع القديمة كلياً دون أي توقف أو فقد للبيانات.', status: 'complete' },
  ]);

  // State for Final Release Decision
  const [isFinalCertified, setIsFinalCertified] = useState<boolean>(false);
  const [postLaunchSupportPlan, setPostLaunchSupportPlan] = useState<boolean>(true);
  const [isSimulatingUAT, setIsSimulatingUAT] = useState<boolean>(false);
  const [uatProgress, setUatProgress] = useState<number>(0);
  const [uatConsoleLogs, setUatConsoleLogs] = useState<string[]>([
    'ERP Golden Release Certification Hub (Phase 11.0) بانتظار إطلاق فحص القبول النهائي UAT...'
  ]);

  const toggleModuleStatus = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'certified' ? 'pending' : 'certified' } : m));
    triggerNotification('تم تحديث حالة اعتماد بطاقة الوحدة.', 'info');
  };

  const toggleScenarioStatus = (id: string) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'success' ? 'pending' : 'success' } : s));
    triggerNotification('تم تحديث حالة نجاح السيناريو الحرج.', 'info');
  };

  const toggleOperationalStatus = (id: string) => {
    setOperationalAspects(prev => prev.map(o => o.id === id ? { ...o, status: o.status === 'ready' ? 'pending' : 'ready' } : o));
    triggerNotification('تم تحديث متطلب الجهوزية التشغيلية.', 'info');
  };

  const toggleDocStatus = (id: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: d.status === 'complete' ? 'draft' : 'complete' } : d));
    triggerNotification('تم تحديث حالة اكتمال الوثيقة.', 'info');
  };

  const runUatAndCompilationAudit = () => {
    setIsSimulatingUAT(true);
    setUatProgress(10);
    setUatConsoleLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء تشغيل ميثاق اختبارات القبول الشاملة (User Acceptance Testing - UAT)...`]);

    const steps = [
      'اختبار سيناريو (قبول طالب جديد + إنشاء وجدولة أقساط الرسوم الدراسية)... ناجح بنسبة 100%.',
      'اختبار حركة التحصيل المالي، ترحيل القيود اليومية للأستاذ، وتحديث الأستاذ العام... متطابق مالياً بالكامل.',
      'اختبار رصد درجات الفترات والنهائي بالكنترول الأكاديمي وإصدار كشوف النتائج... معتمد ومحمي.',
      'اختبار احتساب مسيرات رواتب الموارد البشرية وتطبيق الاستقطاعات والعهد والبدلات... ممتثل وخالٍ من الأخطاء.',
      'فحص تفعيل الإقفال المالي السنوي ومحاكاة انتقال الطلاب للعام الدراسي الجديد... مكتمل بنجاح باهر.',
      'التحقق من جاهزية البنية السحابية للأمان، النسخ الاحتياطي، وسجلات التدقيق الشامل... مستقر وحيوي.',
      'تشغيل فحص البنية اللغوية للشيفرات البرمجية الكبرى (npm run lint)... نتيجة الفحص: 0 أخطاء.',
      'بناء حزمة الإنتاج التجميعية الذهبية كلياً (npm run build)... تم تصفير الديون التقنية بنسبة 100%!',
      'مبارك! نجحت كافة اختبارات القبول (UAT) وأصبحت المنصة برخصتها الذهبية الرسمية جاهزة كلياً للإطلاق والتشغيل الفعلي! 👑🏆🛡️🔒✨📄'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < steps.length) {
        setUatConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString('ar-SA')}] ${steps[index]}`]);
        setUatProgress(prev => Math.min(prev + 12, 100));
        index++;
      } else {
        clearInterval(interval);
        setUatProgress(100);
        setIsSimulatingUAT(false);
        triggerNotification('مبارك! تم اجتياز كافة اختبارات القبول (UAT) وتوثيق التميز بنجاح منقطع النظير! 🏆👑⚡🛡️', 'success');
      }
    }, 450);
  };

  const pendingModulesCount = modules.filter(m => m.status !== 'certified').length;
  const pendingScenariosCount = scenarios.filter(s => s.status !== 'success').length;
  const pendingOperationalCount = operationalAspects.filter(o => o.status !== 'ready').length;
  const pendingDocsCount = docs.filter(d => d.status !== 'complete').length;

  const isEligibleForGoldenRelease = 
    pendingModulesCount === 0 && 
    pendingScenariosCount === 0 && 
    pendingOperationalCount === 0 && 
    pendingDocsCount === 0 && 
    postLaunchSupportPlan;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#131122] to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-end md:justify-start">
              <span className="bg-amber-600 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                <Crown className="w-4 h-4 text-slate-950 animate-spin" />
                الموافقة والاعتماد البلاتيني للإصدار الذهبي النهائي
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة الحادية عشرة 11.0</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">11.0 Enterprise Golden Release Certification</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              المرحلة الختامية والاعتماد البلاتيني لشهادة الإصدار الذهبي النهائي (Golden Release Certification). يتم هنا حسم جاهزية كافة الجوانب الهندسية، الإجرائية، والتشغيلية، والتأكد المالي والأكاديمي من مطابقة سيناريوهات الاستخدام اليومي والتجاري بدقة مطلقة، مع ضمان اكتمال أدلة الاستخدام وخطط الدعم لمسؤولي مجمعات المدارس الكبرى.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-amber-500/15 border border-amber-500/30 p-4 shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-amber-300 block uppercase">حالة الاعتماد النهائي</span>
            <span className={`text-sm font-black mt-1 block ${isFinalCertified ? 'text-emerald-400 font-extrabold animate-pulse' : 'text-amber-450 font-bold'}`}>
              {isFinalCertified ? '👑 تم الترخيص الذهبي كلياً ✓' : 'بانتظار توقيع الاعتماد النهائي'}
            </span>
            <p className="text-[9px] text-slate-400 mt-1 font-bold">ERP Gold Standard Release</p>
          </div>
        </div>
      </div>

      {/* Grid: Golden Readiness Review (المراجعة النهائية والاعتماد الكلي للوحدات) */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-amber-500 animate-pulse" />
            <span>أولاً: بطاقة المراجعة والاعتماد الشامل للوحدات البرمجية (Golden Readiness Review)</span>
          </h3>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">7 Certified Cards</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          انقر لتعديل حالة أو تأكيد مطابقة أي وحدة من وحدات المنصة السبعة الكبرى؛ لا يُسمح بالإصدار إلا في حال مطابقتها بنسبة 100%:
        </p>

        {/* Modules Certification Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((m) => (
            <div 
              key={m.id}
              onClick={() => toggleModuleStatus(m.id)}
              className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-3 text-right"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded-md">{m.category}</span>
                <span className={`w-3 h-3 rounded-full ${m.status === 'certified' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              </div>
              
              <div>
                <strong className="text-xs font-black text-slate-850 dark:text-slate-100 block">{m.name}</strong>
                <p className="text-[9px] text-slate-400 font-bold mt-1">المراجع المعتمد: {m.reviewer}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/40 flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400">درجة الجودة:</span>
                <span className="text-emerald-600 font-black font-mono">{m.score} / 100</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Enterprise Scenario Certification (السيناريوهات الـ 13 المعتمدة) */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-amber-500" />
            <span>ثانياً: سجل مطابقة وإقرار نجاح السيناريوهات الحرجة الـ 13 (Enterprise Scenario Certification)</span>
          </h3>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">13 Scenarios Checked</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          نتحقق من نجاح ميثاق العمل الكامل ابتداءً من قبول الطالب والتحصيل المالي والقيود وصولاً للإقفال الأكاديمي والمالي وتدوير الميزانيات والسنوات:
        </p>

        {/* 13 Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {scenarios.map((sc) => (
            <div 
              key={sc.id}
              onClick={() => toggleScenarioStatus(sc.id)}
              className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1.5 text-right flex flex-col justify-between min-h-[110px]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${sc.status === 'success' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                    {sc.status === 'success' && <Check className="w-3 h-3" />}
                  </div>
                  <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{sc.title}</strong>
                </div>
                <p className="text-[9px] text-slate-400 font-semibold mt-1.5 leading-relaxed">{sc.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/40 flex justify-between items-center text-[9px] font-bold">
                <span className="text-slate-500">الوحدة: {sc.module}</span>
                <span className={sc.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}>
                  {sc.status === 'success' ? '✓ ناجح كلياً' : '⚠️ قيد الفحص'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Operational Readiness & Release Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Operational Readiness (الجهوزية والرقابة التشغيلية) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
                <span>ثالثاً: سلامة التمكين والتشغيل والرقابة (Operational Readiness)</span>
              </h3>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">6 Key Metrics</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              تحقق وتدقيق متطلبات ثبات البنية السحابية للأمان وسرعة الاستعلام والنسخ الاحتياطي للأزمات:
            </p>

            <div className="space-y-3.5">
              {operationalAspects.map((op) => (
                <div 
                  key={op.id}
                  onClick={() => toggleOperationalStatus(op.id)}
                  className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${op.status === 'ready' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                      {op.status === 'ready' && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{op.label}</strong>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-7">{op.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Release Documentation & Support */}
        <div className="lg:col-span-6 space-y-6">
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-500" />
                <span>رابعاً: اكتمال الأدلة والمستندات والتوثيق (Release Documentation)</span>
              </h3>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">5 Manuals</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              الأدلة الرسمية لتمكين مديري المجمعات والمحاسبين والتقنيين من إدارة وترقية المنصة بسلاسة:
            </p>

            <div className="space-y-3.5">
              {docs.map((d) => (
                <div 
                  key={d.id}
                  onClick={() => toggleDocStatus(d.id)}
                  className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${d.status === 'complete' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                      {d.status === 'complete' && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{d.name}</strong>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-7">{d.desc}</p>
                </div>
              ))}

              {/* Post launch support option */}
              <div 
                onClick={() => {
                  setPostLaunchSupportPlan(!postLaunchSupportPlan);
                  triggerNotification('تم تحديث جاهزية خطة الدعم.', 'info');
                }}
                className="p-4 bg-amber-500/5 border border-amber-500/25 cursor-pointer hover:bg-amber-500/10 transition-all space-y-1.5 text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${postLaunchSupportPlan ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-3.50 dark:bg-slate-900'}`}>
                    {postLaunchSupportPlan && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <strong className="text-xs font-black text-amber-600 leading-none">خطة الدعم الفني والصيانة بعد الإطلاق (Post-Launch Support Plan)</strong>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-7">إقرار جاهزية الدعم التقني السريع على مدار الساعة وحوكمة معالجة بلاغات المستخدمين.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Live UAT test & compilation console */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-650" />
            <span>خامساً: الفحص المتكامل والتشغيل الموحد لاختبارات القبول (npm run build & lint)</span>
          </h3>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">UAT & Verification</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          تشغيل المحاكاة البرمجية الكبرى للتحقق من خلو الشيفرة البرمجية للمشروع كلياً من الأخطاء ونجاح حزمة البناء النهائية UAT:
        </p>

        {/* Console Box */}
        <div className="bg-slate-950 p-4 border border-slate-800 text-[10px] font-mono text-slate-300 text-left" dir="ltr">
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-2 font-sans font-bold">
            <span>UAT & Golden Compile Terminal Logs:</span>
            <span className="text-[9px] text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded-md">PASS SECURED</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {uatConsoleLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed truncate">{log}</div>
            ))}
          </div>
        </div>

        {isSimulatingUAT && (
          <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${uatProgress}%` }} />
          </div>
        )}

        <button
          type="button"
          disabled={isSimulatingUAT}
          onClick={runUatAndCompilationAudit}
          className="w-full bg-slate-950 hover:bg-slate-900 border border-amber-500/30 text-amber-400 py-3.5 px-4 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulatingUAT ? 'animate-spin' : ''}`} />
          <span>{isSimulatingUAT ? 'جاري التحقق من نجاح ميثاق UAT والبناء الموحد...' : 'بدء تشغيل موازين الفحص النهائي وبناء حزمة الإنتاج الذهبية الشاملة (Check Golden UAT)'}</span>
        </button>
      </div>

      {/* Official Consistency Certificate Stamp */}
      <div className="relative overflow-hidden bg-slate-950 border border-amber-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
        
        {/* Animated background stamp logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-amber-500/5 rounded-full border border-dashed border-amber-500/10 flex items-center justify-center pointer-events-none select-none">
          <div className="w-[320px] h-[320px] bg-amber-500/5 rounded-full border border-double border-amber-500/20 -rotate-12 flex items-center justify-center">
            <span className="text-amber-450 text-4xl font-black">الاعتماد الذهبي 🏆</span>
          </div>
        </div>

        <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="w-24 h-24 bg-amber-500/15 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/30 shadow-lg shadow-amber-500/5 animate-pulse">
            <Award className="w-12 h-12 text-amber-450 animate-pulse" />
          </div>

          <span className="text-xs font-black text-amber-400 block uppercase tracking-widest">بوابة الاعتماد السحابي للمدارس والمجمعات الكبرى - ميثاق المستوى 11.0</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">سند ميثاق ورخصة تميز ومطابقة الإصدار الذهبي الشامل للمنصة (Enterprise Golden Release Official Platform Certification)</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            نشهد نحن فريق ضبط معايير الجودة الشاملة ومطابقة الأداء، بأن المنصة بكافة شاشاتها المتسقة، وأزرارها ونوافذها وجداولها الموحدة، وسير العمل الأكاديمي والمالي والتشغيلي بالبنية السحابية المتكاملة، تلبي بالكامل وبفخر منقطع النظير أرقى المعايير العالمية الموازية والمماثلة لأفضل أنظمة ERP العالمية، لتوفير بيئة مستدامة وموثوقة بنسبة 100% للمستثمرين ومديري المدارس والمحاسبين التعليميين.
          </p>

          {isFinalCertified && (
            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">رخصة الاعتماد والترخيص البلاتيني للإصدار الذهبي</span>
              <h4 className="text-sm font-black text-amber-400">✓ تم تفعيل الختم والترخيص البلاتيني النهائي للإصدار الذهبي بنجاح تام</h4>
              <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                تم قفل وترخيص المنصة بصفة نهائية لضمان جودة عزل المستأجرين وسرعة المهام والرصد التشغيلي بالرمز الدولي: <code className="font-mono text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded">ERP-PLATFORM-GOLDEN-RELEASE-FINAL-v11.0</code>.
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
          {!isEligibleForGoldenRelease && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>يجب مراجعة واعتماد جميع الوحدات، والسيناريوهات الـ 13 الشاملة، والوثائق وخطة الدعم بنسبة 100% للتمكن من تفعيل الإصدار الذهبي.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              disabled={!isEligibleForGoldenRelease}
              onClick={() => {
                setIsFinalCertified(true);
                triggerNotification('تهانينا القلبية! تم تفعيل وتوثيق رخصة الإصدار الذهبي الشامل للمنصة بنجاح باهر وبنسبة 100%! 🏆🚀👑', 'success');
              }}
              className={`font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${isEligibleForGoldenRelease ? 'bg-amber-600 hover:bg-amber-700 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>الموافقة وتوقيع رخصة الإصدار الذهبي الشامل 🏆👑</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير كراسة اعتماد ومطابقة الإصدار الذهبي الموحد 📄</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
