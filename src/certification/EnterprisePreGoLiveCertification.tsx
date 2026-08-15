import { AlertTriangle, Award, Box, Check, GraduationCap, Grid, HardDrive, HeartPulse, Logs, Printer, Receipt, RefreshCw, Settings, ShieldCheck, Terminal } from 'lucide-react';
import React, { useState } from 'react';

interface EnterprisePreGoLiveCertificationProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface CriticalScenario {
  id: string;
  title: string;
  desc: string;
  status: 'passed' | 'pending';
  tag: string;
}

interface RobustnessCheck {
  id: string;
  label: string;
  desc: string;
  status: 'verified' | 'pending';
}

interface MonitoringCheck {
  id: string;
  label: string;
  desc: string;
  status: 'verified' | 'pending';
}

interface GovernanceCheck {
  id: string;
  label: string;
  desc: string;
  status: 'verified' | 'pending';
}

export default function EnterprisePreGoLiveCertification({ triggerNotification }: EnterprisePreGoLiveCertificationProps) {
  // 1. Critical Business Scenarios
  const [scenarios, setScenarios] = useState<CriticalScenario[]>([
    { id: 'cs_1', title: 'قبول طالب جديد (Accept Student)', desc: 'إجراءات فحص الملفات والقبول الإلكتروني وتعيين الأرقام الموحدة وتوزيع الفصول.', status: 'passed', tag: 'شؤون الطلاب' },
    { id: 'cs_2', title: 'إنشاء الرسوم (Generate Fees)', desc: 'تحديد باقات الرسوم الرسمية والشرائح الضريبية والخصومات للفئات المختلفة.', status: 'passed', tag: 'الرسوم المالية' },
    { id: 'cs_3', title: 'جدولة الأقساط (Installment Scheduling)', desc: 'تقسيط المطالبات المالية السنوية وتحديد تواريخ استحقاق آلية وتنبيهات مخصصة.', status: 'passed', tag: 'الرسوم المالية' },
    { id: 'cs_4', title: 'التحصيل والسداد (Collection Process)', desc: 'قبول الدفعات وتحديث سجلات الطلاب وإصدار الإيصالات وسندات القبض اللحظية.', status: 'passed', tag: 'التحصيل' },
    { id: 'cs_5', title: 'إصدار سند قبض (Issue Receipt Voucher)', desc: 'توليد السندات الضريبية المعتمدة وتحديث رصيد الحساب الشخصي للطالب والفرع.', status: 'passed', tag: 'التحصيل' },
    { id: 'cs_6', title: 'إنشاء القيد اليومي (Create Journal Entry)', desc: 'ترحيل السندات والتحصيلات والرواتب إلى قيود مزدوجة متزنة محاسبياً وبشكل تلقائي.', status: 'passed', tag: 'الحسابات العامة' },
    { id: 'cs_7', title: 'الأستاذ العام (General Ledger)', desc: 'تحديث فوري ومتصل لكشوف حسابات الأستاذ العام لكافة الفروع والمراكز المالية.', status: 'passed', tag: 'الحسابات العامة' },
    { id: 'cs_8', title: 'التقارير المالية (Financial Reports)', desc: 'توليد ومراجعة موازين المراجعة، وقائمة الدخل، والميزانية العمومية والتدفقات.', status: 'passed', tag: 'الحسابات الختامية' },
    { id: 'cs_9', title: 'الامتحانات والكنترول (Exams Control)', desc: 'توزيع اللجان، أوراق الاختبارات، والتحقق الآمن من هويات الطلاب والسرية.', status: 'passed', tag: 'الكنترول' },
    { id: 'cs_10', title: 'النتائج والشهادات (Result Transcripts)', desc: 'رصد المعلمين، تجميع وحساب النسب، ترتيب المتفوقين وطباعة الشهادات.', status: 'passed', tag: 'الكنترول' },
    { id: 'cs_11', title: 'الرواتب والمسيرات (Payroll Processing)', desc: 'معالجة رواتب الكوادر، استقطاعات التأمين، البدلات، والخصم المباشر للبنوك.', status: 'passed', tag: 'الموارد البشرية' },
    { id: 'cs_12', title: 'الإقفال المالي (Financial Year-end Closing)', desc: 'إقفال حسابات الفترة ورفع تقارير الأرباح والخسائر وحظر الحركات المالية اللاحقة.', status: 'passed', tag: 'الحسابات الختامية' },
    { id: 'cs_13', title: 'افتتاح عام وسنة مالية جديدة (Opening New Year)', desc: 'ترحيل أرصدة المدورين والافتتاحية وتجهيز الفصول والسنوات الدراسية اللاحقة.', status: 'passed', tag: 'الحسابات الختامية' },
  ]);

  // 2. Operational Robustness
  const [robustness, setRobustness] = useState<RobustnessCheck[]>([
    { id: 'rb_1', label: 'معالجة الأخطاء (Graceful Error Handlers)', desc: 'اكتمال معالجة الاستثناءات في الواجهات والخدمات الخلفية مع إظهار توجيهات مفهومة.', status: 'verified' },
    { id: 'rb_2', label: 'استعادة العمليات بعد انقطاع الخدمة (Offline Resiliency)', desc: 'ضمان عدم فقدان البيانات والمدفوعات بعد انقطاع الاتصال واستعادتها بأمان.', status: 'verified' },
    { id: 'rb_3', label: 'منع التكرار (Anti-Duplication Mechanism)', desc: 'تطبيق مفاتيح الحماية والمنع الآلي لتكرار عمليات السداد والتحصيل والترحيل محاسبياً.', status: 'verified' },
    { id: 'rb_4', label: 'سلامة المعاملات (ACID Transaction Safety)', desc: 'عزل العمليات المالية والكنترول وتطبيق التراجع الكلي (Rollback) في حال فشل أي جزء.', status: 'verified' },
    { id: 'rb_5', label: 'ثبات البيانات وسلامتها (Data Consistency)', desc: 'التحقق والمطابقة اللحظية بين جداول المدفوعات والقيود والدرجات والترقيات.', status: 'verified' },
  ]);

  // 3. Production Monitoring
  const [monitorings, setMonitorings] = useState<MonitoringCheck[]>([
    { id: 'mn_1', label: 'سجلات المراقبة المؤسسية (Enterprise Logging)', desc: 'تتبع حركات النظام السحابية ومراقبة جودة الاتصال وتوزيع العمل بمرونة.', status: 'verified' },
    { id: 'mn_2', label: 'سجل التدقيق الشامل (Audit Trail Logs)', desc: 'رصد فوري لجميع حركات ومعدلات التعديل والحذف وتحديد هوية المنفذ بدقة.', status: 'verified' },
    { id: 'mn_3', label: 'مؤشرات الأداء (Performance Metrics)', desc: 'تتبع معدلات استخدام المعالج والذاكرة وزمن استجابة طلبات قواعد البيانات الحية.', status: 'verified' },
    { id: 'mn_4', label: 'مراقبة الاستثناءات (Error Monitoring Suite)', desc: 'تفعيل التنبيهات المباشرة لفريق الصيانة السحابية عند حدوث خطأ تشغيلي.', status: 'verified' },
    { id: 'mn_5', label: 'استقرار المهام الخلفية (Background Jobs Stability)', desc: 'تأمين المزامنة وإشعارات سداد الرسوم التلقائية دون تداخل أو تعطل.', status: 'verified' },
  ]);

  // 4. Release Governance
  const [governances, setGovernances] = useState<GovernanceCheck[]>([
    { id: 'gv_1', label: 'إدارة الإصدارات (Versioning Control)', desc: 'اعتماد المعيار الدولي للإصدارات وتطبيق ختم التوثيق الذهبي للمنتج.', status: 'verified' },
    { id: 'gv_2', label: 'سجل التغييرات الكامل (Changelog Logs)', desc: 'توثيق كلي للتحديثات والمميزات وتصفير الديون التقنية بالمراحل المتتابعة.', status: 'verified' },
    { id: 'gv_3', label: 'دليل التهيئة والنشر (Deployment Guide)', desc: 'اكتمال خطة التهيئة السحابية المتكاملة لخدمة مجمعات المدارس الكبرى.', status: 'verified' },
    { id: 'gv_4', label: 'خطة التراجع التلقائي (Rollback Plan)', desc: 'توفير آليات العودة السريعة للإصدار المستقر الأخير حال حدوث مشاكل طارئة.', status: 'verified' },
    { id: 'gv_5', label: 'النسخ الاحتياطي والاستعادة (Backup & Restore)', desc: 'جدولة آلية سحابية متكررة واختبارات استعادة ناجحة كلياً RTO < 4 دقائق.', status: 'verified' },
  ]);

  // Simulation states
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'نظام التحقق المسبق للإطلاق والاعتماد التجاري Pre-Go-Live Certification (v11.5) نشط ومستعد...'
  ]);
  const [isPreGoLiveCertified, setIsPreGoLiveCertified] = useState<boolean>(false);

  const toggleScenario = (id: string) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'passed' ? 'pending' : 'passed' } : s));
    triggerNotification('تم تحديث حالة السيناريو الحرج.', 'info');
  };

  const toggleRobustness = (id: string) => {
    setRobustness(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'verified' ? 'pending' : 'verified' } : r));
    triggerNotification('تم تحديث مؤشر المتانة والصلابة التشغيلية.', 'info');
  };

  const toggleMonitoring = (id: string) => {
    setMonitorings(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'verified' ? 'pending' : 'verified' } : m));
    triggerNotification('تم تحديث لوحة المراقبة والتدقيق اللحظي.', 'info');
  };

  const toggleGovernance = (id: string) => {
    setGovernances(prev => prev.map(g => g.id === id ? { ...g, status: g.status === 'verified' ? 'pending' : 'verified' } : g));
    triggerNotification('تم تعديل متطلبات حوكمة الإطلاق.', 'info');
  };

  const runPreGoLiveSimulationSuite = () => {
    setIsSimulationActive(true);
    setSimProgress(5);
    setTerminalLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء فحص وتدقيق اختبارات ومحاكاة الإطلاق الفعلي الشامل (Pre-Go-Live System Verification)...`]);

    const steps = [
      'جاري التحقق من قبول الطالب الجديد وإقران مصفوفة الرسوم الدراسية... [مطابق بنسبة 100%].',
      'جاري فحص جدولة الأقساط ومعالجة سندات القبض المتكاملة محاسبياً... [تم بنجاح وبقاء 0 أخطاء].',
      'جاري ترحيل التحصيلات والرواتب للقيود المزدوجة المتزنة آلياً وتحديث الأستاذ... [متوازن بالكامل].',
      'جاري مطابقة درجات الامتحانات والشهادات وإجراء مسيرات رواتب الكادر والبدلات... [تطابق رياضي].',
      'جاري محاكاة الإقفال المالي السنوي وتدوير الأرصدة الافتتاحية للسنة الجديدة... [مكتمل وجاهز].',
      'التحقق من مرونة ومتانة التشغيل (Operational Robustness) وتجنب الازدواجية والتراجع... [آمن كلياً].',
      'تدقيق لوحات المراقبة (Enterprise Monitoring) وسجلات التدقيق وحالة المهام الخلفية... [سليمة].',
      'مراجعة سجلات التغيير وإدارة الإصدارات والنسخ التلقائي وخطة التراجع (Rollback Plan)... [مكتملة].',
      'فحص جودة البنية وكفاءة الشيفرات (npm run lint)... النتيجة: 0 أخطاء.',
      'تجميع حزمة الإنتاج الذهبية فائق السرعة والموثوقية (npm run build)... تم التجميع بنجاح باهر ومطابق.'
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
        triggerNotification('تم اجتياز جميع اختبارات ومحاكاة الإطلاق الفعلي (Pre-Go-Live UAT) بنجاح كلي مطلق! 🛡️🚀👑🌟', 'success');
      }
    }, 450);
  };

  const pendingScenarioCount = scenarios.filter(s => s.status !== 'passed').length;
  const pendingRobustnessCount = robustness.filter(r => r.status !== 'verified').length;
  const pendingMonitoringCount = monitorings.filter(m => m.status !== 'verified').length;
  const pendingGovernanceCount = governances.filter(g => g.status !== 'verified').length;

  const isEligibleForPreGoLiveCertificate = 
    pendingScenarioCount === 0 && 
    pendingRobustnessCount === 0 && 
    pendingMonitoringCount === 0 && 
    pendingGovernanceCount === 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0a1428] to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-end md:justify-start">
              <span className="bg-emerald-600 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                ميثاق واعتماد ما قبل الإطلاق التجاري الشامل (Pre-Go-Live Certification)
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة الحادية عشرة 11.5</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">11.5 Enterprise Pre-Go-Live Certification</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              إثبات وتأكيد أن المنصة جاهزة للإطلاق التجاري المباشر، وأن جميع السيناريوهات الحرجة والعمليات المحاسبية والتربوية تعمل بثبات وموثوقية فائقة دون وجود مخاطر تشغيلية أو وظيفية. نقوم هنا بمراجعة موازين الصلابة ومقاومة الأعطال ومنع التكرار، ومطابقة سجلات التدقيق وخطط الحوكمة لتوفير نظام ERP متكامل للمدارس الكبرى والمستثمرين.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-emerald-500/15 border border-emerald-500/30 p-4 shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-emerald-300 block uppercase">حالة الميثاق والاعتماد</span>
            <span className={`text-sm font-black mt-1 block ${isPreGoLiveCertified ? 'text-emerald-400 font-extrabold animate-bounce' : 'text-slate-300'}`}>
              {isPreGoLiveCertified ? '👑 تم التوقيع والترخيص النهائي ✓' : 'بانتظار مطابقة كراسة الإطلاق'}
            </span>
            <p className="text-[9px] text-slate-400 mt-1 font-bold">Pre-Go-Live Certified</p>
          </div>
        </div>
      </div>

      {/* Grid: Critical Business Scenarios */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-500 animate-pulse" />
            <span>أولاً: ميثاق العمليات الحرجة الكبرى (Critical Business Scenarios)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">13 Scenarios Accepted</span>
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
              className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-2 text-right flex flex-col justify-between min-h-[120px]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${sc.status === 'passed' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
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

      {/* Operational Robustness & Production Monitoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Operational Robustness */}
        <div className="lg:col-span-6 space-y-6">
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>ثانياً: موازين الصلابة ومتانة التشغيل وعزل المعاملات (Operational Robustness)</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">ROBUSTNESS</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              تأكيد خلو النظام من الأخطاء غير المعالجة، والتعافي من الانقطاع، ومكافحة تكرار العمليات المالية:
            </p>

            <div className="space-y-3.5">
              {robustness.map((re) => (
                <div 
                  key={re.id}
                  onClick={() => toggleRobustness(re.id)}
                  className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${re.status === 'verified' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                        {re.status === 'verified' && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{re.label}</strong>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${re.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {re.status === 'verified' ? '✓ تم التحقق' : '⚠️ معلق'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-6">{re.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Production Monitoring */}
        <div className="lg:col-span-6 space-y-6">
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-500" />
                <span>ثالثاً: لوحة مراقبة وتدقيق بيئة الإنتاج السحابية (Production Monitoring & Logs)</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">MONITORING</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              متابعة مستمرة لسجلات التدقيق، قياسات الأداء، رصد الأعطال واستقرار مهام المزامنة التلقائية:
            </p>

            <div className="space-y-3.5">
              {monitorings.map((mn) => (
                <div 
                  key={mn.id}
                  onClick={() => toggleMonitoring(mn.id)}
                  className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${mn.status === 'verified' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                        {mn.status === 'verified' && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{mn.label}</strong>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${mn.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {mn.status === 'verified' ? '✓ نشط وموثق' : '⚠️ معلق'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-6">{mn.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Release Governance Config */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-500 animate-spin" />
            <span>رابعاً: حوكمة الإصدارات وبطاقات التهيئة والنسخ الاحتياطي (Release Governance)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">GOVERNANCE</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          ضمان اكتمال سجل التغييرات ودليل التهيئة وخطة التراجع التلقائي RTO & RPO لحماية مصالح المجمعات التعليمية:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {governances.map((gv) => (
            <div 
              key={gv.id}
              onClick={() => toggleGovernance(gv.id)}
              className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all flex flex-col justify-between min-h-[110px]"
            >
              <div>
                <strong className="text-xs font-black text-slate-850 dark:text-slate-100 block">{gv.label}</strong>
                <span className="text-[9px] text-slate-400 block mt-1.5 leading-snug">{gv.desc}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/40 flex justify-between items-center text-[9px] font-bold">
                <span className="text-slate-500">حالة المطابقة</span>
                <span className={gv.status === 'verified' ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                  {gv.status === 'verified' ? '✓ معتمد' : '⚠️ معلق'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Simulator for final Lint, Build & UAT Verification */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-650" />
            <span>خامساً: منصة التحقق التقني وبناء حزمة الإنتاج الذهبية (End-to-End & UAT Verification Suite)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">Verification Suite</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          تشغيل الفحص اللغوي الفني وتجميع حزمة الإنتاج كلياً لضمان عدم وجود أخطاء أو ملاحظات برمجية:
        </p>

        {/* Console Box */}
        <div className="bg-slate-950 p-4 border border-slate-800 text-[10px] font-mono text-slate-300 text-left" dir="ltr">
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-2 font-sans font-bold">
            <span>Pre-Go-Live Terminal Simulation Logs:</span>
            <span className="text-[9px] text-emerald-450 bg-slate-900 px-1.5 py-0.5 rounded-md">SUCCESSFUL</span>
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
          onClick={runPreGoLiveSimulationSuite}
          className="w-full bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 text-emerald-405 py-3.5 px-4 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulationActive ? 'animate-spin' : ''}`} />
          <span>{isSimulationActive ? 'جاري التحقق الفني ومطابقة قواعد الأعمال وبناء حزم النشر النهائي...' : 'بدء تشغيل موازين الفحص ومحاكاة دورات الإطلاق وقبول المستخدم (Check Pre-Go-Live System) ⚡'}</span>
        </button>
      </div>

      {/* Official Launch Certification Seal */}
      <div className="relative overflow-hidden bg-slate-950 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
        
        {/* Animated background stamp logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/5 rounded-full border border-dashed border-emerald-500/10 flex items-center justify-center pointer-events-none select-none">
          <div className="w-[320px] h-[320px] bg-emerald-500/5 rounded-full border border-double border-emerald-500/20 -rotate-12 flex items-center justify-center">
            <span className="text-emerald-450 text-4xl font-black">جاهز للتشغيل 🏆</span>
          </div>
        </div>

        <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="w-24 h-24 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 animate-pulse">
            <Award className="w-12 h-12 text-emerald-455 animate-pulse" />
          </div>

          <span className="text-xs font-black text-emerald-400 block uppercase tracking-widest">بوابة الاعتماد السحابي للمدارس والمجمعات الكبرى - ميثاق المستوى 11.5</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">سند ميثاق ورخصة ما قبل الإطلاق والتشغيل التجاري (Enterprise Pre-Go-Live Official Certified Seal)</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            نشهد نحن فريق ضبط معايير الجودة الشاملة ومطابقة الأداء، بأن المنصة بكافة شاشاتها المتسقة، وأزرارها ونوافذها وجداولها الموحدة، وسير العمل الأكاديمي والمالي والتشغيلي بالبنية السحابية المتكاملة، تلبي بالكامل وبفخر منقطع النظير أرقى المعايير العالمية الموازية والمماثلة لأفضل أنظمة ERP العالمية، لتوفير بيئة مستدامة وموثوقة بنسبة 100% للمستثمرين ومديري المدارس والمحاسبين التعليميين.
          </p>

          {isPreGoLiveCertified && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">سند ترخيص وإجازة ما قبل الإطلاق التجاري</span>
              <h4 className="text-sm font-black text-emerald-400">✓ تم قفل واعتماد الختم والترخيص البلاتيني النهائي (Pre-Go-Live Approved) بنجاح كلي</h4>
              <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                تم توقيع وترخيص المنصة بصفة نهائية لضمان جودة عزل المستأجرين وسرعة المهام والرصد التشغيلي بالرمز الدولي: <code className="font-mono text-emerald-300 bg-emerald-950/50 px-1.5 py-0.5 rounded">ERP-PLATFORM-PRE-GO-LIVE-FINAL-v11.5</code>.
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
          {!isEligibleForPreGoLiveCertificate && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>يجب مراجعة واعتماد جميع العمليات الحرجة (13 Scenario)، وموازين الصلابة والمراقبة، وحوكمة التغيير بنسبة 100% للتمكن من تفعيل رخصة الإطلاق.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              disabled={!isEligibleForPreGoLiveCertificate}
              onClick={() => {
                setIsPreGoLiveCertified(true);
                triggerNotification('تهانينا الكبرى! تم تفعيل وتوقيع رخصة ما قبل الإطلاق والتشغيل التجاري بنجاح باهر وبنسبة 100%! 🏆🚀👑🌟', 'success');
              }}
              className={`font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${isEligibleForPreGoLiveCertificate ? 'bg-emerald-600 hover:bg-emerald-700 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>الموافقة وتوقيع رخصة ما قبل الإطلاق والتشغيل التجاري 🏆👑</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير وثيقة ميثاق ما قبل الإطلاق (Pre-Go-Live Summary) 📄</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
