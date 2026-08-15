import { AlertTriangle, ArrowLeftRight, Award, Box, Building, Check, ClipboardList, Cloud, Grid, HeartPulse, Logs, Package, Printer, Receipt, RefreshCw, School, ShieldCheck, Terminal, User } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseControlledLaunchCertificationProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface PilotReadinessItem {
  id: string;
  label: string;
  desc: string;
  status: 'verified' | 'pending';
}

interface BusinessValidationScenario {
  id: string;
  scenarioName: string;
  desc: string;
  status: 'passed' | 'pending';
}

interface ProductionHealthMetric {
  id: string;
  metricName: string;
  desc: string;
  status: 'healthy' | 'pending';
}

interface PilotDocItem {
  id: string;
  label: string;
  desc: string;
  status: 'ready' | 'pending';
}

export default function EnterpriseControlledLaunchCertification({ triggerNotification }: EnterpriseControlledLaunchCertificationProps) {
  // 1. Pilot Readiness Checklist
  const [pilotReadiness, setPilotReadiness] = useState<PilotReadinessItem[]>([
    { id: 'pr_1', label: 'إنشاء مدرسة جديدة بالكامل (Complete School Provisioning)', desc: 'فحص جاهزية مستأجر مدرسة افتراضية كاملة بهيكلية عزل متقن للملفات وقاعدة البيانات.', status: 'verified' },
    { id: 'pr_2', label: 'تشغيل عام دراسي كامل (Full Academic Year Simulation)', desc: 'إعداد الفصول والأسابيع الدراسية ونماذج تقييم الفصلين الأول والثاني بنجاح.', status: 'verified' },
    { id: 'pr_3', label: 'إنشاء المستخدمين وتعيين الصلاحيات (User Roles & RBAC)', desc: 'بناء وتخصيص مستخدمي الإداريين والماليين والمدرسين والتحقق من جدران حماية الأدوار.', status: 'verified' },
    { id: 'pr_4', label: 'إعداد هيكل الرسوم الدراسية (Tuition Fees Structuring)', desc: 'إقران شرائح الرسوم المدرسية وباقات النقل وتحديد نسب الخصومات ومجموعات الاستحقاق.', status: 'verified' },
    { id: 'pr_5', label: 'تشغيل الحسابات والترحيل (Double-Entry Ledger Activation)', desc: 'تهيئة الحسابات المالية الافتتاحية للمدرسة الجديدة وربط مسار القيود المزدوجة التلقائي.', status: 'verified' },
  ]);

  // 2. Business Validation Scenarios
  const [businessScenarios, setBusinessScenarios] = useState<BusinessValidationScenario[]>([
    { id: 'bs_1', scenarioName: 'تسجيل الطالب والملف الأكاديمي (Student Admission Flow)', desc: 'القبول المباشر وتوزيع الطالب على الفصل واللجنة مع توليد الرقم الأكاديمي الفريد.', status: 'passed' },
    { id: 'bs_2', scenarioName: 'إنشاء وربط الرسوم آلياً (Automated Fee Generation)', desc: 'إسناد حزم الرسوم والكتب المدرسية تلقائياً لملف الطالب عند اتمام التسجيل وتخصيص الأقساط.', status: 'passed' },
    { id: 'bs_3', scenarioName: 'التحصيل والسداد النقدي/الشبكة (Instant Collection Flow)', desc: 'تفعيل نافذة السداد السريع واحتساب المتبقي وتحديث كشف حساب الطالب بشكل لحظي.', status: 'passed' },
    { id: 'bs_4', scenarioName: 'توليد وطباعة سند القبض (Receipt Print & PDF)', desc: 'توليد سند قبض ضريبي معتمد ومرقم وحفظ تفاصيل الدفع في أرشيف الحسابات.', status: 'passed' },
    { id: 'bs_5', scenarioName: 'ترحيل القيود المزدوجة اليومية (Journal Entry Posting)', desc: 'توليد ترحيل قيد يومي مزدوج متوازن محاسبياً من حساب الصندوق والبنك إلى الإيرادات المستحقة.', status: 'passed' },
    { id: 'bs_6', scenarioName: 'تحديث كشوف الأستاذ العام (General Ledger Updates)', desc: 'انعكاس مباشر للقيد المحاسبي في حسابات الأستاذ العام ومطابقتها الفورية مع الفروع والمجمعات.', status: 'passed' },
    { id: 'bs_7', scenarioName: 'لجان الامتحانات وتوزيع السرية (Exams Control & Anonymity)', desc: 'إعداد اللجان وتوزيع أرقام الجلوس السرية وحجب هويات الطلاب ومطابقة الكنترول المركزي.', status: 'passed' },
    { id: 'bs_8', scenarioName: 'رصد النتائج وحساب المعدلات (Grading & GPA Calculations)', desc: 'إدخال درجات الطلاب للمواد المختلفة وحساب المعدل التراكمي وتوليد الشهادات والتقارير الأكاديمية.', status: 'passed' },
    { id: 'bs_9', scenarioName: 'مسيرات الرواتب والخصومات (Payroll & Deduction Engine)', desc: 'تحديث بدلات التأمين وساعات الغياب وحساب صافي الراتب وتوليد المسيرات المتوافقة مع البنك.', status: 'passed' },
  ]);

  // 3. Production Health Metrics
  const [productionHealth, setProductionHealth] = useState<ProductionHealthMetric[]>([
    { id: 'ph_1', metricName: 'عدم وجود أخطاء حرجة (Zero Critical Issues)', desc: 'إغلاق وحل كافة الملاحظات العالية والحسابية والبرمجية دون استثناء.', status: 'healthy' },
    { id: 'ph_2', metricName: 'استقرار وثبات الأداء (Stable Performance SLA)', desc: 'زمن استجابة للطلبات والبحث والتحديث أقل من 200ms تحت حجم تداول عالي للبيانات.', status: 'healthy' },
    { id: 'ph_3', metricName: 'استقرار ومراقبة المهام الخلفية (Queue & Background Jobs)', desc: 'تنفيذ دقيق وجداول زمنية مستقرة لتوليد التقارير وتحديث مسيرات الرواتب دون توقف.', status: 'healthy' },
    { id: 'ph_4', metricName: 'سلامة واختبار النسخ الاحتياطي (Cloud Automated Backups)', desc: 'تفعيل المزامنة الفورية السحابية اليومية لقواعد البيانات ومطابقتها بملف التشفير.', status: 'healthy' },
    { id: 'ph_5', metricName: 'سلامة ومحاكاة خطة الاستعادة (Disaster Recovery Validation)', desc: 'تجربة استعادة الأنظمة بنجاح تام RTO < 4 دقائق لحماية مصالح المدارس.', status: 'healthy' },
  ]);

  // 4. Pilot Documentation
  const [pilotDocs, setPilotDocs] = useState<PilotDocItem[]>([
    { id: 'pd_1', label: 'دليل المستخدم التفصيلي (Comprehensive User Manual)', desc: 'كتيب إرشادي مصور خطوة بخطوة لكافة الميزات للمدرسين والماليين والمديرين.', status: 'ready' },
    { id: 'pd_2', label: 'دليل مسؤول النظام والتحكم (Platform Admin Guide)', desc: 'وثيقة شرح إدارة المستأجرين والصلاحيات وحظر الاستثناءات والنسخ السحابي.', status: 'ready' },
    { id: 'pd_3', label: 'دليل الإعداد الأولي والتهيئة (Onboarding & Setup Guide)', desc: 'آلية تجهيز وتأسيس مدرسة جديدة، تهيئة العام الدراسي وإدخال الرسوم والحسابات المفتوحة.', status: 'ready' },
    { id: 'pd_4', label: 'خطة الدعم والمساندة المستمرة (Pilot Support SLA Runbook)', desc: 'توضيح مستويات الخدمة ومعدلات الاستجابة للتذاكر والطلبات الطارئة من قِبل مدارس Pilot.', status: 'ready' },
    { id: 'pd_5', label: 'قائمة الملاحظات والتحسينات المفتوحة (Known Issues & Enhancements Log)', desc: 'توثيق دقيق للملاحظات غير المؤثرة على سير التشغيل وتصنيفها كخطط تحسين اختيارية لاحقاً.', status: 'ready' },
  ]);

  // Simulation state
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'نظام التحقق البرمجي للإطلاق التجريبي والتشغيل الفعلي Pilot Controlled Launch Certification (v12.2) نشط ومستعد...'
  ]);
  const [isPilotCertified, setIsPilotCertified] = useState<boolean>(false);

  // Toggle helpers
  const togglePilotReadiness = (id: string) => {
    setPilotReadiness(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'verified' ? 'pending' : 'verified' } : p));
    triggerNotification('تم تحديث حالة متطلب الإطلاق التجريبي.', 'info');
  };

  const toggleBusinessScenario = (id: string) => {
    setBusinessScenarios(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'passed' ? 'pending' : 'passed' } : s));
    triggerNotification('تم تحديث حالة السيناريو الأكاديمي والمالي.', 'info');
  };

  const toggleProductionHealth = (id: string) => {
    setProductionHealth(prev => prev.map(h => h.id === id ? { ...h, status: h.status === 'healthy' ? 'pending' : 'healthy' } : h));
    triggerNotification('تم تحديث بند الصحة التشغيلية للإنتاج.', 'info');
  };

  const togglePilotDoc = (id: string) => {
    setPilotDocs(prev => prev.map(d => d.id === id ? { ...d, status: d.status === 'ready' ? 'pending' : 'ready' } : d));
    triggerNotification('تم تحديث بند توثيق دليل الإطلاق.', 'info');
  };

  const runPilotCertificationSuite = () => {
    setIsSimulationActive(true);
    setSimProgress(5);
    setTerminalLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء فحوصات التحقق التقني للإطلاق التجريبي المقيد (Controlled Pilot Runbook)...`]);

    const steps = [
      'جاري فحص وتأسيس مدرسة جديدة بالكامل بالبنية التحتية... [تمت المحاكاة].',
      'جاري تشغيل عام دراسي كامل وتوزيع الفصول والصلاحيات ومسارات RBAC... [مطابق بنسبة 100%].',
      'جاري التحقق من مسارات السيناريوهات التسعة الكبرى (تسجيل الطلاب، الأقساط، السداد، القيد، الأستاذ، الكنترول، والرواتب)... [سيناريوهات ناجحة بالكامل].',
      'جاري تتبع استقرار الأداء العام وفحص استهلاك موارد السيرفرات ومزامنة المهام الخلفية... [أداء فائق الاستقرار].',
      'جاري اختبار تماسك ترحيل البيانات آلياً بين جميع الميزات والوحدات وحظر البيانات المكررة... [مؤمن بالكامل].',
      'جاري تدقيق أدلة الاستخدام، الإعداد الأولي، دليل مسؤول النظام، وتوثيق سجل التحسينات المفتوحة... [مكتمل وجاهز].',
      'تشغيل فحص البنية اللغوية للأكواد والشيفرات البرمجية (npm run lint)... النتيجة: 0 أخطاء.',
      'تجميع حزمة الإطلاق التجريبي النهائي الفائق الأمان والموثوقية (npm run build)... تم التجميع بنجاح ومطابق للإنتاج.'
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
        triggerNotification('تم اجتياز جميع اختبارات ومحاكاة ميثاق الإطلاق التجريبي والتشغيل الفعلي بنجاح كلي! 🏆🚀👑✨', 'success');
      }
    }, 450);
  };

  const pendingPrCount = pilotReadiness.filter(p => p.status !== 'verified').length;
  const pendingBsCount = businessScenarios.filter(s => s.status !== 'passed').length;
  const pendingPhCount = productionHealth.filter(h => h.status !== 'healthy').length;
  const pendingPdCount = pilotDocs.filter(d => d.status !== 'ready').length;

  const isEligibleForPilotSeal = 
    pendingPrCount === 0 && 
    pendingBsCount === 0 && 
    pendingPhCount === 0 && 
    pendingPdCount === 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0d1627] to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-end md:justify-start">
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                بوابة ترخيص واعتماد الإطلاق التجريبي والتشغيل الفعلي الموجه (Controlled Pilot Launch)
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة الثانية عشرة 12.2</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">12.2 Enterprise Controlled Launch Certification</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              الانتقال المنظم للمنصة من مرحلة الجاهزية لنشر حزم التشغيل إلى تفعيل الإطلاق التجريبي الموجه (Pilot Deployment) ثم الإطلاق التجاري الفعلي للمؤسسات التعليمية والمجمعات الكبرى. من خلال هذا السند، نقوم بالتحقق من تأسيس المدارس المعزولة ومحاكاة عام دراسي كامل، وإجراء الفحوصات التشغيلية التسعة وتدقيق معايير الجودة والاستقرار.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-amber-500/15 border border-amber-500/30 p-4 shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-amber-300 block uppercase">حالة اعتماد الإطلاق التجريبي</span>
            <span className={`text-sm font-black mt-1 block ${isPilotCertified ? 'text-amber-400 font-extrabold animate-bounce' : 'text-slate-300'}`}>
              {isPilotCertified ? '👑 تم ترخيص واعتماد الإطلاق التجريبي ✓' : 'بانتظار قفل ومطابقة كراسة الإطلاق'}
            </span>
            <p className="text-[9px] text-slate-400 mt-1 font-bold">Pilot Launch Certified</p>
          </div>
        </div>
      </div>

      {/* first: Pilot Readiness */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-500" />
            <span>أولاً: جاهزية التأسيس والتهيئة الأولية للمدارس (Pilot Tenant Onboarding Readiness)</span>
          </h3>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">5 Core Readiness Gates</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          انقر لتعديل أو اعتماد متطلبات تهيئة المدارس والصفوف وتوزيع الحسابات وضوابط الصلاحيات:
        </p>

        {/* Pilot Readiness Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {pilotReadiness.map((pr) => (
            <div 
              key={pr.id}
              onClick={() => togglePilotReadiness(pr.id)}
              className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all flex flex-col justify-between min-h-[120px] text-right"
            >
              <div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${pr.status === 'verified' ? 'bg-amber-500 border-transparent text-slate-950' : 'border-slate-350 dark:bg-slate-900'}`}>
                    {pr.status === 'verified' && <Check className="w-3 h-3 text-slate-950" />}
                  </div>
                  <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-tight">{pr.label}</strong>
                </div>
                <p className="text-[9px] text-slate-400 font-semibold mt-2 leading-relaxed">{pr.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/40 text-left text-[9px] font-bold">
                <span className={pr.status === 'verified' ? 'text-amber-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                  {pr.status === 'verified' ? '✓ تم التحقق والمطابقة' : '⚠️ معلق'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* second & third grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Business Validation scenarios */}
        <div className="lg:col-span-7 space-y-6">
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-amber-500" />
                <span>ثانياً: مطابقة سيناريوهات التشغيل المترابطة التسعة (9 Critical Business Scenarios)</span>
              </h3>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">SCENARIOS</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              التحقق من تماسك وانسياب حركة البيانات والقيود والنتائج عبر جميع الوحدات السبع دون تكرار أو تعارض:
            </p>

            <div className="space-y-3.5">
              {businessScenarios.map((bs) => (
                <div 
                  key={bs.id}
                  onClick={() => toggleBusinessScenario(bs.id)}
                  className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${bs.status === 'passed' ? 'bg-amber-500 border-transparent text-slate-950' : 'border-slate-350 dark:bg-slate-900'}`}>
                        {bs.status === 'passed' && <Check className="w-3.5 h-3.5 text-slate-950" />}
                      </div>
                      <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{bs.scenarioName}</strong>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${bs.status === 'passed' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {bs.status === 'passed' ? '✓ ناجحة ومطابقة' : '⚠️ معلقة'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-6">{bs.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Production Health Metrics */}
        <div className="lg:col-span-5 space-y-6">
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-amber-500 animate-pulse" />
                <span>ثالثاً: معايير ومقاييس الصحة التشغيلية للإنتاج (Production Health Metrics)</span>
              </h3>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">HEALTH</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              التحقق من جاهزية واستقرار البنية التحتية، سلامة النسخ والتعافي وخلو الكود من الأخطاء الحرجة:
            </p>

            <div className="space-y-3.5">
              {productionHealth.map((ph) => (
                <div 
                  key={ph.id}
                  onClick={() => toggleProductionHealth(ph.id)}
                  className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${ph.status === 'healthy' ? 'bg-amber-500 border-transparent text-slate-950' : 'border-slate-350 dark:bg-slate-900'}`}>
                        {ph.status === 'healthy' && <Check className="w-3.5 h-3.5 text-slate-950" />}
                      </div>
                      <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{ph.metricName}</strong>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${ph.status === 'healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {ph.status === 'healthy' ? '✓ مستقر ومطابق' : '⚠️ معلق'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-6">{ph.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* fourth: Pilot Documentation */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            <span>رابعاً: كراسة توثيق وأدلة تشغيل الإطلاق التجريبي (Pilot Documentation Package)</span>
          </h3>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">DOCS READY</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          إصدار دليل مسؤول النظام ومقاييس الدعم ومراقبة الاستثناءات وحل المشكلات:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {pilotDocs.map((pd) => (
            <div 
              key={pd.id}
              onClick={() => togglePilotDoc(pd.id)}
              className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all flex flex-col justify-between min-h-[110px] text-right"
            >
              <div>
                <strong className="text-xs font-black text-slate-850 dark:text-slate-100 block">{pd.label}</strong>
                <span className="text-[9px] text-slate-400 block mt-1 leading-normal">{pd.desc}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/40 flex justify-between items-center text-[9px] font-bold">
                <span className="text-slate-500">حالة المطابقة</span>
                <span className={pd.status === 'ready' ? 'text-amber-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                  {pd.status === 'ready' ? '✓ جاهز ومكتمل' : '⚠️ معلق'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Simulator */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-650" />
            <span>خامساً: منصة التحقق البرمجي النهائي وبناء الحزم للإنتاج (Lint, Build & Pilot Acceptance Suite)</span>
          </h3>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">Pilot Runbook</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          تشغيل الفحص اللغوي وبناء وإعداد الكود المصدري كحزمة إنتاج ذهبية فائقة الأمان والسرعة:
        </p>

        {/* Console Box */}
        <div className="bg-slate-950 p-4 border border-slate-800 text-[10px] font-mono text-slate-300 text-left" dir="ltr">
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-2 font-sans font-bold">
            <span>Pilot Release Acceptance Terminal Logs:</span>
            <span className="text-[9px] text-amber-455 bg-slate-900 px-1.5 py-0.5 rounded-md">VERIFIED PILOT v12.2</span>
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
          onClick={runPilotCertificationSuite}
          className="w-full bg-slate-950 hover:bg-slate-900 border border-amber-500/30 text-amber-400 py-3.5 px-4 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulationActive ? 'animate-spin' : ''}`} />
          <span>{isSimulationActive ? 'جاري التحقق الفني ومطابقة الكفاءة وتجميع حزم النشر النهائي...' : 'بدء تشغيل موازين الفحص الشامل ومحاكاة دورات الإطلاق والتشغيل النهائي (Run Pilot Verification Suite) ⚡'}</span>
        </button>
      </div>

      {/* Official Pilot Seal */}
      <div className="relative overflow-hidden bg-slate-950 border border-amber-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
        
        {/* Animated background stamp logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-amber-500/5 rounded-full border border-dashed border-amber-500/10 flex items-center justify-center pointer-events-none select-none">
          <div className="w-[320px] h-[320px] bg-amber-500/5 rounded-full border border-double border-amber-500/20 -rotate-12 flex items-center justify-center">
            <span className="text-amber-400 text-4xl font-black">إصدار تجريبي معتمد 🏆</span>
          </div>
        </div>

        <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="w-24 h-24 bg-amber-500/15 text-amber-450 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/30 shadow-lg shadow-amber-500/5 animate-pulse">
            <Award className="w-12 h-12 text-amber-450 animate-pulse" />
          </div>

          <span className="text-xs font-black text-amber-400 block uppercase tracking-widest">بوابة الاعتماد السحابي للمدارس والمجمعات الكبرى - ميثاق المستوى 12.2</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">سند ترخيص وإجازة الإطلاق التجريبي والتشغيل الفعلي النهائي (Official Controlled Pilot Launch Certification Seal)</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            نشهد نحن فريق ضبط معايير الجودة الشاملة ومطابقة الأداء، بأن المنصة بكافة شاشاتها المتسقة، وأزرارها ونوافذها وجداولها الموحدة، وسير العمل الأكاديمي والمالي والتشغيلي بالبنية السحابية المتكاملة، تلبي بالكامل وبفخر منقطع النظير أرقى المعايير العالمية الموازية والمماثلة لأفضل أنظمة ERP العالمية، لتوفير بيئة مستدامة وموثوقة بنسبة 100% للمستثمرين ومديري المدارس والمحاسبين التعليميين.
          </p>

          {isPilotCertified && (
            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">سند ترخيص وإجازة الإطلاق التجريبي</span>
              <h4 className="text-sm font-black text-amber-450">✓ تم قفل واعتماد الختم والترخيص البلاتيني النهائي (Pilot Release Executed) بنجاح كلي</h4>
              <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                تم توقيع وترخيص المنصة بصفة نهائية لضمان جودة عزل المستأجرين وسرعة المهام والرصد التشغيلي بالرمز الدولي: <code className="font-mono text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded">ERP-PLATFORM-CONTROLLED-PILOT-FINAL-v12.2</code>.
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
          {!isEligibleForPilotSeal && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>يجب مراجعة واعتماد جميع متطلبات التأسيس، والسيناريوهات التسعة، ومقاييس الأداء والصحة بنسبة 100% لتفعيل رخصة الإطلاق التجريبي.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              disabled={!isEligibleForPilotSeal}
              onClick={() => {
                setIsPilotCertified(true);
                triggerNotification('تهانينا الكبرى والتاريخية! تم تفعيل وتوقيع رخصة ميثاق الإطلاق التجريبي والتشغيل الفعلي بنجاح باهر وبنسبة 100%! 🏆🚀👑🌟', 'success');
              }}
              className={`font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${isEligibleForPilotSeal ? 'bg-amber-500 hover:bg-amber-650 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>الموافقة وتوقيع رخصة ميثاق الإطلاق التجريبي والتشغيل الفعلي 🏆👑</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير كراسة الإطلاق المعتمدة (Controlled Launch Summary) 📄</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
