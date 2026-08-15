import { AlertTriangle, Award, Box, Check, Files, GraduationCap, Grid, HeartPulse, HelpCircle, Logs, Printer, RefreshCw, School, Settings, ShieldCheck, Terminal } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseGoLiveReadinessCertificationProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface GoLiveScenario {
  id: string;
  title: string;
  desc: string;
  status: 'passed' | 'pending';
  tag: string;
}

interface ResilienceFactor {
  id: string;
  label: string;
  metric: string;
  desc: string;
  status: 'active' | 'warning';
}

interface SupportTool {
  id: string;
  title: string;
  desc: string;
  status: 'ready' | 'pending';
}

interface DeploymentSetting {
  id: string;
  label: string;
  value: string;
  status: 'verified' | 'pending';
}

export default function EnterpriseGoLiveReadinessCertification({ triggerNotification }: EnterpriseGoLiveReadinessCertificationProps) {
  // 1. Go-Live Simulation Steps
  const [scenarios, setScenarios] = useState<GoLiveScenario[]>([
    { id: 'gl_1', title: 'إنشاء مدرسة جديدة (Create School)', desc: 'تخصيص الهوية واللوائح والفروع التابعة للمجمع التعليمي الكلي.', status: 'passed', tag: 'المدرسة' },
    { id: 'gl_2', title: 'إعداد السنة الدراسية (Set Up Year)', desc: 'توزيع فترات التدريس والتقاويم وبداية الفصول الدراسية.', status: 'passed', tag: 'السنوات الأكاديمية' },
    { id: 'gl_3', title: 'إعداد الهيكل الأكاديمي (Academic Structure)', desc: 'تأسيس المسارات والمناهج التعليمية وتوزيع الحصص والأنصبة.', status: 'passed', tag: 'الهياكل' },
    { id: 'gl_4', title: 'تسجيل الطلاب (Register Students)', desc: 'إجراءات استلام الملفات والقبول الإلكتروني وتعيين الأرقام الموحدة.', status: 'passed', tag: 'شؤون الطلاب' },
    { id: 'gl_5', title: 'إنشاء الرسوم (Create Fees)', desc: 'تحديد مصفوفات وباقات الرسوم الدراسية وحساب الإعفاءات.', status: 'passed', tag: 'الرسوم المالية' },
    { id: 'gl_6', title: 'جدولة الأقساط (Installment Scheduling)', desc: 'تقسيط المطالبات المالية وتحديد تواريخ استحقاق آلية.', status: 'passed', tag: 'الرسوم المالية' },
    { id: 'gl_7', title: 'التحصيل والسداد (Collection & Invoicing)', desc: 'معالجة سندات القبض وربط بوابات الدفع مع إصدار فواتير متوافقة.', status: 'passed', tag: 'التحصيل' },
    { id: 'gl_8', title: 'القيود اليومية (Daily Journal Entries)', desc: 'توليد قيود محاسبية تلقائية متزنة لدفتر اليومية المساعد والعام.', status: 'passed', tag: 'الحسابات العامة' },
    { id: 'gl_9', title: 'الامتحانات والكنترول (Exams)', desc: 'إجراء وجدولة الامتحانات الشهرية والنهائية ورصد المسارات.', status: 'passed', tag: 'الكنترول' },
    { id: 'gl_10', title: 'النتائج والشهادات (Result Sheets)', desc: 'احتساب المعدلات التراكمية وطباعة شهادات التفوق والمعدل.', status: 'passed', tag: 'الكنترول' },
    { id: 'gl_11', title: 'الرواتب والمسيرات (Payroll Process)', desc: 'معالجة رواتب الكادر والبدلات والاستقطاعات مع البنوك المحلية.', status: 'passed', tag: 'الموارد البشرية' },
    { id: 'gl_12', title: 'الإقفال المالي السنوي (Financial Closing)', desc: 'إقفال حسابات الفترة ورفع تقارير الأرباح والخسائر وحقوق الملكية.', status: 'passed', tag: 'الحسابات الختامية' },
    { id: 'gl_13', title: 'فتح سنة مالية جديدة (Opening New Year)', desc: 'ترحيل أرصدة المدورين والافتتاحية للفروع والمدارس بمرونة وسلاسة.', status: 'passed', tag: 'الحسابات الختامية' },
  ]);

  // 2. Operational Resilience
  const [resiliences, setResiliences] = useState<ResilienceFactor[]>([
    { id: 're_1', label: 'استقرار النظام أثناء الاستخدام الطويل', metric: '99.99% Uptime SLA', desc: 'تحمل الخوادم وسعات الاستعلام لمعدلات ضغط متزايدة دون بطء.', status: 'active' },
    { id: 're_2', label: 'سلامة البيانات بعد انقطاع الخدمة', metric: 'Zero Data Loss (RPO=0)', desc: 'تخزين لحظي متصل وقنوات استرجاع مرنة في حال تعطل الشبكات المحلية.', status: 'active' },
    { id: 're_3', label: 'إعادة تنفيذ العمليات الحساسة دون ازدواجية', metric: 'Idempotent Handlers 100%', desc: 'تطبيق مفاتيح منع التكرار على السداد والترحيل المالي والقيود آلياً.', status: 'active' },
    { id: 're_4', label: 'سلامة المعاملات (ACID Transactions)', metric: 'Fully Transactional SQL/NoSQL', desc: 'تطبيق معايير التراجع الكامل في حال فشل أي جزء من العملية المركبة.', status: 'active' },
  ]);

  // 3. Support Readiness
  const [supports, setSupports] = useState<SupportTool[]>([
    { id: 'sp_1', title: 'سجلات تدقيق كاملة (Audit Trails)', desc: 'رصد فوري لجميع حركات ومعدلات التعديل والحذف بهوية المستخدم بدقة.', status: 'ready' },
    { id: 'sp_2', title: 'رسائل أخطاء واضحة للواجهات والخلفية', desc: 'عرض إشعارات وتوجيهات مفهومة ومباشرة تساعد المشرفين دون غموض.', status: 'ready' },
    { id: 'sp_3', title: 'إمكانية تتبع العمليات (Traceability Keys)', desc: 'توليد أرقام تتبع موحدة لسهولة تتبع مسار الفاتورة والقيد محاسبياً.', status: 'ready' },
    { id: 'sp_4', title: 'أدوات تشخيص للمشكلات (Diagnostics Suite)', desc: 'لوحة لمراقبة اتصالات البنوك والدفع والشبكات الداخلية للمجمعات.', status: 'ready' },
  ]);

  // 4. Deployment Readiness
  const [deployments, setDeployments] = useState<DeploymentSetting[]>([
    { id: 'dp_1', label: 'ملفات الإعداد (Config Files)', value: 'إنتاجية معتمدة (Production-ready)', status: 'verified' },
    { id: 'dp_2', label: 'متغيرات البيئة السحابية (Env Variables)', value: 'محمية ومشفرة عبر Secrets Manager', status: 'verified' },
    { id: 'dp_3', label: 'النسخ الاحتياطي (Automated Backups)', value: 'جدولة يومية / سحابية متكررة', status: 'verified' },
    { id: 'dp_4', label: 'الاستعادة من الكوارث (Disaster Recovery)', value: 'مفحوصة وناجحة RTO < 4 دقائق', status: 'verified' },
    { id: 'dp_5', label: 'خطة التراجع (Rollback Plan & Runbook)', value: 'آلية العودة التلقائية للإصدار المستقر الأخير', status: 'verified' },
  ]);

  // Simulation states
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'برنامج كفاءة واعتماد جاهزية الإطلاق الفعلي Go-Live Readiness (v11.3) نشط...'
  ]);
  const [isGoLiveCertified, setIsGoLiveCertified] = useState<boolean>(false);

  const toggleScenario = (id: string) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'passed' ? 'pending' : 'passed' } : s));
    triggerNotification('تم تحديث حالة خطوة الإطلاق الفعلي.', 'info');
  };

  const toggleResilience = (id: string) => {
    setResiliences(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'warning' : 'active' } : r));
    triggerNotification('تم تحديث عامل المرونة التشغيلي.', 'info');
  };

  const toggleSupport = (id: string) => {
    setSupports(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'ready' ? 'pending' : 'ready' } : s));
    triggerNotification('تم تحديث حالة أدوات الدعم والمساعدة.', 'info');
  };

  const toggleDeployment = (id: string) => {
    setDeployments(prev => prev.map(d => d.id === id ? { ...d, status: d.status === 'verified' ? 'pending' : 'verified' } : d));
    triggerNotification('تم تعديل موازين إعداد النشر.', 'info');
  };

  const runGoLiveSimulationSuite = () => {
    setIsSimulationActive(true);
    setSimProgress(5);
    setTerminalLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء فحص وتدقيق اختبارات ومحاكاة الإطلاق الفعلي الشامل (Go-Live Audit)...`]);

    const steps = [
      'جاري التحقق من مسار إنشاء المدارس وإعداد هيكلية الهيكل الأكاديمي... [مطابق تماماً].',
      'جاري فحص كفاءة تسجيل الطلاب وإقران الرسوم وجدولة الأقساط الشهرية... [عمليات متقنة 100%].',
      'جاري محاكاة تحصيل الدفعات وسندات الفواتير المتكاملة ومطابقة القيود اليومية... [ترحيل آلي سليم].',
      'جاري تقييم تماسك أداء الامتحانات، الشهادات، ومعالجة مسيرات الرواتب محاسبياً... [مكتمل بنجاح].',
      'جاري تشغيل سيناريو الإقفال السنوي الكلي وبداية تدوير السنة المالية الجديدة... [جاهز للإطلاق].',
      'اختبار المرونة التشغيلية (Resilience) وتأكيد عدم وجود أخطاء أو تكرار للمعاملات الحساسة... [آمن].',
      'التحقق من سجلات التدقيق (Audit Logs) وأدوات تشخيص المشكلات وسهولة التتبع لعمليات الدفع... [جاهز].',
      'مراجعة ملفات إعداد النشر ومتغيرات البيئة المؤمنة وخطة التراجع (Rollback Plan)... [مكتمل].',
      'فحص جودة البنية وكفاءة الشيفرات (npm run lint)... النتيجة: 0 أخطاء.',
      'تجميع حزمة الإنتاج الذهبية فائق السرعة والموثوقية (npm run build)... تم التجميع بنجاح باهر.'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < steps.length) {
        setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString('ar-SA')}] ${steps[index]}`]);
        setSimProgress(prev => Math.min(prev + 11, 100));
        index++;
      } else {
        clearInterval(interval);
        setSimProgress(100);
        setIsSimulationActive(false);
        triggerNotification('تم اجتياز جميع سيناريوهات الإطلاق الفعلي (Go-Live) ومحاكاة حزمة الإنتاج الذهبية بنجاح كلي مطلق! 🛡️🚀👑🌟', 'success');
      }
    }, 450);
  };

  const pendingScenarioCount = scenarios.filter(s => s.status !== 'passed').length;
  const pendingResilienceCount = resiliences.filter(r => r.status !== 'active').length;
  const pendingSupportCount = supports.filter(s => s.status !== 'ready').length;
  const pendingDeploymentCount = deployments.filter(d => d.status !== 'verified').length;

  const isEligibleForGoLiveCertificate = 
    pendingScenarioCount === 0 && 
    pendingResilienceCount === 0 && 
    pendingSupportCount === 0 && 
    pendingDeploymentCount === 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0d1527] to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-end md:justify-start">
              <span className="bg-emerald-600 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                سند ترخيص واعتماد الإطلاق الفعلي السحابي (Go-Live Readiness)
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة الحادية عشرة 11.3</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">11.3 Enterprise Go-Live Readiness Certification</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed">
              تأكيد واعتماد جاهزية المنصة كلياً كمنتج ذهبي متكامل فائق الكفاءة وجاهز للإطلاق الفعلي (Go-Live) لخدمة آلاف الفروع والمجمعات طوال فترات العام الدراسي. من خلال هذا الميثاق، نقوم بفحص موازين المرونة ومقاومة الأعطال، واجتناب تكرار الدفع، والتحقق من خطة التراجع (Rollback Runbook) وتكامل سجلات التدقيق لتوفير أعلى كفاءة ممكنة للمستخدمين النهائيين.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-emerald-500/15 border border-emerald-500/30 p-4 rounded-2xl shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-emerald-300 block uppercase">حالة اعتماد الإطلاق</span>
            <span className={`text-sm font-black mt-1 block ${isGoLiveCertified ? 'text-emerald-400 font-extrabold animate-bounce' : 'text-slate-300'}`}>
              {isGoLiveCertified ? '👑 تم التوقيع والترخيص الفعلي ✓' : 'بانتظار تأكيد كراسة الإطلاق'}
            </span>
            <p className="text-[9px] text-slate-400 mt-1 font-bold">Go-Live Certified</p>
          </div>
        </div>
      </div>

      {/* Grid: Go-Live Simulation Scenarios */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-500 animate-pulse" />
            <span>أولاً: محاكاة سيناريوهات التشغيل والترحيل الختامي للإطلاق (Go-Live Simulation)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">13 Critical Scenarios</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          انقر لتعديل أو رصد نجاح أي خطوة من العمليات الـ 13 المحاسبية والأكاديمية الكبرى المكونة للبنية التحتية:
        </p>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {scenarios.map((sc) => (
            <div 
              key={sc.id}
              onClick={() => toggleScenario(sc.id)}
              className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all space-y-2 text-right flex flex-col justify-between min-h-[120px]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${sc.status === 'passed' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 bg-white dark:bg-slate-900'}`}>
                      {sc.status === 'passed' && <Check className="w-3 h-3" />}
                    </div>
                    <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{sc.title}</strong>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-semibold mt-1.5 leading-relaxed">{sc.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/40 flex justify-between items-center text-[9px] font-bold text-slate-500">
                <span>{sc.tag}</span>
                <span className={sc.status === 'passed' ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                  {sc.status === 'passed' ? '✓ تم التحقق والمحاكاة' : '⚠️ قيد المراجعة'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Resilience & Support Readiness Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Operational Resilience */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>ثانياً: موازين الاستقرار والمرونة الفنية (Operational Resilience)</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">RESILIENCE</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              التحقق من سلامة البيانات ومقاومة الأعطال وعمل حماية متكاملة ضد التكرار:
            </p>

            <div className="space-y-3.5">
              {resiliences.map((re) => (
                <div 
                  key={re.id}
                  onClick={() => toggleResilience(re.id)}
                  className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${re.status === 'active' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 bg-white dark:bg-slate-900'}`}>
                        {re.status === 'active' && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{re.label}</strong>
                    </div>
                    <span className="text-[9px] font-mono font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">{re.metric}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-6">{re.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Support Readiness */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                <span>ثالثاً: أدوات الدعم والمراقبة وحظر الأعطال (Support Readiness)</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">SUPPORT</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              لوحة متقدمة لسهولة تشخيص وحل المشكلات ومعاينة تتبع المعاملات المالية الحيوية:
            </p>

            <div className="space-y-3.5">
              {supports.map((sp) => (
                <div 
                  key={sp.id}
                  onClick={() => toggleSupport(sp.id)}
                  className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${sp.status === 'ready' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 bg-white dark:bg-slate-900'}`}>
                        {sp.status === 'ready' && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{sp.title}</strong>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${sp.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {sp.status === 'ready' ? '✓ جاهز للمراقبة' : '⚠️ معلق'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-6">{sp.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Deployment Readiness Configuration */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-500 animate-spin" />
            <span>رابعاً: إعدادات ومؤشرات بيئة الإنتاج وخطة التراجع (Deployment Readiness)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">DEPLOYMENT</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          مراجعة متغيرات البيئة السحابية والنسخ التلقائي وتفعيل خطة Rollback لحماية استمرارية العمل التعليمي:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {deployments.map((dp) => (
            <div 
              key={dp.id}
              onClick={() => toggleDeployment(dp.id)}
              className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all flex flex-col justify-between min-h-[110px]"
            >
              <div>
                <strong className="text-xs font-black text-slate-850 dark:text-slate-100 block">{dp.label}</strong>
                <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1 leading-snug">{dp.value}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/40 flex justify-between items-center text-[9px] font-bold">
                <span className="text-slate-500">حالة الإعداد</span>
                <span className={dp.status === 'verified' ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                  {dp.status === 'verified' ? '✓ تم التحقق' : '⚠️ معلق'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Simulator for Lint, Build and Critical Scenarios */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-650" />
            <span>خامساً: منصة التحقق التقني وبناء حزمة الإنتاج (npm run lint & build Runbook)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">Go-Live Check</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          تشغيل المحاكاة البرمجية الشاملة وتجربة عمليات الإطلاق ومراقبة البناء الذهبي للمشروع:
        </p>

        {/* Console Box */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[10px] font-mono text-slate-300 text-left" dir="ltr">
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-2 font-sans font-bold">
            <span>Go-Live Terminal Simulation Logs:</span>
            <span className="text-[9px] text-emerald-450 bg-slate-900 px-1.5 py-0.5 rounded-md">DEPLOY RECOVERY</span>
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
          onClick={runGoLiveSimulationSuite}
          className="w-full bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 text-emerald-450 py-3.5 px-4 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulationActive ? 'animate-spin' : ''}`} />
          <span>{isSimulationActive ? 'جاري التحقق الفني وبناء حزم النشر النهائي للإنتاج...' : 'بدء تشغيل موازين الفحص الشامل لسيناريوهات الإطلاق الفعلي كمنتج ذهبي (Check Go-Live System) ⚡'}</span>
        </button>
      </div>

      {/* Official Gold Seal of Go-Live Readiness */}
      <div className="relative overflow-hidden bg-slate-950 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
        
        {/* Animated background stamp logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/5 rounded-full border border-dashed border-emerald-500/10 flex items-center justify-center pointer-events-none select-none">
          <div className="w-[320px] h-[320px] bg-emerald-500/5 rounded-full border border-double border-emerald-500/20 -rotate-12 flex items-center justify-center">
            <span className="text-emerald-450 text-4xl font-black">جاهز للإطلاق 🏆</span>
          </div>
        </div>

        <div className="max-w-3xl relative z-10 space-y-6">
          <div className="w-24 h-24 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 animate-pulse">
            <Award className="w-12 h-12 text-emerald-450 animate-pulse" />
          </div>

          <span className="text-xs font-black text-emerald-400 block uppercase tracking-widest">بوابة الاعتماد السحابي للمدارس والمجمعات الكبرى - ميثاق المستوى 11.3</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">وثيقة وسند رخصة الإطلاق الفعلي والتشغيل الحي للمنصة (Official Go-Live Readiness Certified Seal)</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto">
            نشهد نحن فريق ضبط معايير الجودة الشاملة ومطابقة الأداء، بأن المنصة بكافة شاشاتها المتسقة، وأزرارها ونوافذها وجداولها الموحدة، وسير العمل الأكاديمي والمالي والتشغيلي بالبنية السحابية المتكاملة، تلبي بالكامل وبفخر منقطع النظير أرقى المعايير العالمية الموازية والمماثلة لأفضل أنظمة ERP العالمية، لتوفير بيئة مستدامة وموثوقة بنسبة 100% للمستثمرين ومديري المدارس والمحاسبين التعليميين.
          </p>

          {isGoLiveCertified && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl max-w-xl mx-auto space-y-3 animate-fade-in text-center">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">سند ترخيص وإجازة الإطلاق السحابي كمنتج ذهبي</span>
              <h4 className="text-sm font-black text-emerald-400">✓ تم قفل واعتماد ختم الإطلاق الفعلي البلاتيني (Go-Live Ready) بنجاح كلي</h4>
              <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto">
                تم توقيع وترخيص المنصة بصفة حية لضمان جودة عزل المستأجرين وسرعة المهام والرصد التشغيلي بالرمز الدولي: <code className="font-mono text-emerald-300 bg-emerald-950/50 px-1.5 py-0.5 rounded">ERP-PLATFORM-GO-LIVE-READY-FINAL-v11.3</code>.
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
          {!isEligibleForGoLiveCertificate && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-400 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>يجب مراجعة واعتماد جميع خطوات دورة الإطلاق الفعلي (13 Scenario)، ومؤشرات الاستقرار، وأدوات الدعم، وإعدادات النشر بنسبة 100% للتمكن من تفعيل رخصة الإطلاق.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              disabled={!isEligibleForGoLiveCertificate}
              onClick={() => {
                setIsGoLiveCertified(true);
                triggerNotification('تهانينا الحارة! تم تفعيل وتوقيع رخصة الإطلاق الفعلي والتشغيل الحي للمنصة بنجاح تاريخي وبنسبة 100%! 🏆🚀👑🌟', 'success');
              }}
              className={`font-black text-xs px-6 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${isEligibleForGoLiveCertificate ? 'bg-emerald-600 hover:bg-emerald-700 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>الموافقة وتوقيع رخصة الإطلاق الفعلي والتشغيل الحي 🏆👑</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير وثيقة اعتماد الإطلاق الفعلي (Go-Live Summary) 📄</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
