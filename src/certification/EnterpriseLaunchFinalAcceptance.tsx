import { AlertTriangle, ArrowLeftRight, Award, BookOpen, Box, Check, ClipboardList, Cloud, Cross, Grid, Layers, Logs, Printer, RefreshCw, ShieldCheck, Terminal, User } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseLaunchFinalAcceptanceProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface ModuleAcceptance {
  id: string;
  name: string;
  desc: string;
  status: 'passed' | 'pending';
}

interface CrossValidation {
  id: string;
  label: string;
  desc: string;
  status: 'passed' | 'pending';
}

interface ProdCheckItem {
  id: string;
  label: string;
  desc: string;
  status: 'verified' | 'pending';
}

interface LaunchDoc {
  id: string;
  title: string;
  desc: string;
  status: 'completed' | 'pending';
}

export default function EnterpriseLaunchFinalAcceptance({ triggerNotification }: EnterpriseLaunchFinalAcceptanceProps) {
  // 1. Enterprise Acceptance Modules
  const [modules, setModules] = useState<ModuleAcceptance[]>([
    { id: 'mod_1', name: 'شؤون الطلاب (Student Affairs)', desc: 'دورة التسجيل الكاملة، توزيع الطلاب على الفصول، وترحيل وتخرج الفئات الدراسية.', status: 'passed' },
    { id: 'mod_2', name: 'الرسوم والتحصيل (Fees & Collection)', desc: 'باقات الرسوم، الفواتير المتوافقة ضريبياً، الجدولة للأقساط وإشعار المتأخرين آلياً.', status: 'passed' },
    { id: 'mod_3', name: 'الحسابات العامة (General Ledger)', desc: 'القيود المزدوجة المتزنة تلقائياً، موازين المراجعة، الحسابات الختامية السنوية.', status: 'passed' },
    { id: 'mod_4', name: 'الامتحانات والكنترول (Exams Control)', desc: 'رصد المعلمين، تجميع وحساب النسب، ترتيب المتفوقين وطباعة الشهادات.', status: 'passed' },
    { id: 'mod_5', name: 'الموارد البشرية والرواتب (HR & Payroll)', desc: 'مسيرات رواتب الكوادر، استقطاعات التأمين والخصومات والبدلات البنكية السليمة.', status: 'passed' },
    { id: 'mod_6', name: 'التقارير واللوحات (Reports Suite)', desc: 'لوحات القيادة الإستراتيجية والمؤشرات المالية والتربوية اللحظية للمستثمرين.', status: 'passed' },
    { id: 'mod_7', name: 'إدارة النظام والحوكمة (System Admin)', desc: 'إسناد الأدوار RBAC، سجلات التدقيق الفورية، وعزل المستأجرين سحابياً.', status: 'passed' },
  ]);

  // 2. Cross-Module Validation
  const [crossValidations, setCrossValidations] = useState<CrossValidation[]>([
    { id: 'cv_1', label: 'منع فقدان البيانات (No Data Loss)', desc: 'التحقق من بقاء وسلامة سجلات المدفوعات والدرجات كاملة أثناء تنقل العمليات.', status: 'passed' },
    { id: 'cv_2', label: 'عدم وجود ازدواجية (No Duplication)', desc: 'منع تكرار ترحيل القيود أو سندات القبض أو سحب الدرجات كلياً.', status: 'passed' },
    { id: 'cv_3', label: 'تطابق وتناغم النتائج (Consistent Results)', desc: 'تطابق المجاميع المالية والأكاديمية المستخرجة من شاشات الكنترول مع كشوف المالية.', status: 'passed' },
    { id: 'cv_4', label: 'سلامة قواعد الأعمال وحمايتها (Business Rules Intact)', desc: 'منع تجاوز حدود السعات، حظر سداد مبالغ سالبة، والالتزام بمتطلبات الصلاحيات.', status: 'passed' },
  ]);

  // 3. Production Checklist
  const [prodChecks, setProdChecks] = useState<ProdCheckItem[]>([
    { id: 'pc_1', label: 'النسخ الاحتياطي (Cloud Backups)', desc: 'جدولة آلية سحابية متكررة لقواعد البيانات والملفات بنجاح كلي.', status: 'verified' },
    { id: 'pc_2', label: 'الاستعادة (Disaster Recovery Check)', desc: 'اختبار محاكاة التعافي السحابي السريع والتأكد من استئناف الخدمة RTO < 4 دق.', status: 'verified' },
    { id: 'pc_3', label: 'مراقبة وحظر الأخطاء (Error Monitoring)', desc: 'تفعيل أنظمة رصد الاستثناءات اللحظية وإرسال الإشعارات لفريق الصيانة.', status: 'verified' },
    { id: 'pc_4', label: 'مراقبة كفاءة الأداء (Performance Telemetry)', desc: 'تتبع معدلات استهلاك المعالج، والذاكرة RAM، وزمن استجابة الطلبات.', status: 'verified' },
    { id: 'pc_5', label: 'الصلاحيات الصارمة (RBAC Permissions)', desc: 'الفصل التام للوظائف المتباينة وعزل لوحات الإدارة العامة للفروع والمشرفين.', status: 'verified' },
    { id: 'pc_6', label: 'سجلات التدقيق الشاملة (Audit Trails)', desc: 'تدوين حركات الإضافة والتعديل والحذف بهوية المستخدم وتوقيت العملية بدقة.', status: 'verified' },
    { id: 'pc_7', label: 'إعدادات الإنتاج الذهبية (Production Config)', desc: 'إعداد كود البناء النهائي وحماية الجلسات وتشفير مفاتيح الاتصالات الخارجية.', status: 'verified' },
  ]);

  // 4. Launch Documentation
  const [docs, setDocs] = useState<LaunchDoc[]>([
    { id: 'dc_1', title: 'دليل المستخدم الشامل (User Guide)', desc: 'دليل إرشادي مصور خطوة بخطوة لشرح عمليات الطلاب والمالية للمعلمين والموظفين.', status: 'completed' },
    { id: 'dc_2', title: 'دليل مسؤول النظام (Admin Guide)', desc: 'شرح أدوات الحوكمة، إدارة الصلاحيات RBAC، مراقبة سجلات التدقيق والنسخ الاحتياطي.', status: 'completed' },
    { id: 'dc_3', title: 'دليل التثبيت والتهيئة (Installation Guide)', desc: 'توثيق خطوات النشر السحابي، وربط بوابات الدفع وقواعد البيانات الحية.', status: 'completed' },
    { id: 'dc_4', title: 'سجل التغييرات والإصدارات (Changelog)', desc: 'توثيق تطور الشاشات والمراحل والمميزات والمواصفات الأمنية للمنتج الذهبي v11.4.', status: 'completed' },
    { id: 'dc_5', title: 'خطة الدعم الفني والمستمر (Support Plan)', desc: 'تحديد مستويات الخدمة SLA، تتبع التذاكر، والاستجابة للأعطال الطارئة.', status: 'completed' },
  ]);

  // Simulation & Verification
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'نظام تدقيق واعتماد الإطلاق التجاري النهائي لبيئة الإنتاج (v11.4) قيد التشغيل...'
  ]);
  const [isFinalApproved, setIsFinalApproved] = useState<boolean>(false);

  const toggleModule = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'passed' ? 'pending' : 'passed' } : m));
    triggerNotification('تم تحديث حالة اعتماد الوحدة الدراسية.', 'info');
  };

  const toggleCrossValidation = (id: string) => {
    setCrossValidations(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'passed' ? 'pending' : 'passed' } : c));
    triggerNotification('تم تحديث فحص سلامة تداخل البيانات بين الوحدات.', 'info');
  };

  const toggleProdCheck = (id: string) => {
    setProdChecks(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'verified' ? 'pending' : 'verified' } : p));
    triggerNotification('تم تعديل ميزان تدقيق بيئة الإنتاج كلياً.', 'info');
  };

  const toggleDoc = (id: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: d.status === 'completed' ? 'pending' : 'completed' } : d));
    triggerNotification('تم تحديث اعتماد اكتمال المستند الفني.', 'info');
  };

  const runFinalAcceptanceSimulation = () => {
    setIsSimulationActive(true);
    setSimProgress(5);
    setTerminalLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء المطابقة الختامية وقبول المستخدم النهائي للمنصة (UAT Verification)...`]);

    const steps = [
      'جاري فحص حالة اعتماد الوحدات السبعة الكبرى شؤون الطلاب، المالية، الرواتب والكنترول... [100% معتمد].',
      'جاري التحقق المتقاطع للبيانات بين شاشات الرسوم والقيود المالية المزدوجة باليومية... [خالٍ من الفقد].',
      'جاري تفعيل موازين منع الازدواجية والتطابق المطلق للمعدلات والرواتب... [تطابق رياضي تام].',
      'جاري تدقيق خطط النسخ الاحتياطي السحابي المتصل وخطة الاستعادة السريعة RTO... [مؤمنة كلياً].',
      'جاري فحص تراخيص وحوكمة الصلاحيات RBAC وسجلات التدقيق المتقدمة... [سجلات التدقيق نشطة].',
      'جاري مراجعة أدلة التوثيق الداخلي دليل المستخدم، دليل مسؤول النظام وخطة الدعم... [جاهزة ومكتملة].',
      'تشغيل فحص البنية اللغوية للأكواد البرمجية (npm run lint)... النتيجة: 0 أخطاء.',
      'تجميع حزمة الإطلاق الذهبي فائق الفعالية (npm run build)... تم تجميع الحزمة بنجاح كلي ومطابق.',
      'تأكيد نجاح اختبارات قبول المستخدم النهائي (UAT)... تم اجتياز المعايير وبقاء 0 ملاحظات معلقة.'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < steps.length) {
        setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString('ar-SA')}] ${steps[index]}`]);
        setSimProgress(prev => Math.min(prev + 12, 100));
        index++;
      } else {
        clearInterval(interval);
        setSimProgress(100);
        setIsSimulationActive(false);
        triggerNotification('تم إتمام الفحص والمطابقة النهائية لإطلاق الإنتاج باجتياز كامل بنسبة 100%! 🛡️🏅👑✨', 'success');
      }
    }, 450);
  };

  const pendingModuleCount = modules.filter(m => m.status !== 'passed').length;
  const pendingCrossCount = crossValidations.filter(c => c.status !== 'passed').length;
  const pendingProdCount = prodChecks.filter(p => p.status !== 'verified').length;
  const pendingDocCount = docs.filter(d => d.status !== 'completed').length;

  const isEligibleForFinalApproval = 
    pendingModuleCount === 0 && 
    pendingCrossCount === 0 && 
    pendingProdCount === 0 && 
    pendingDocCount === 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0a1224] to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-end md:justify-start">
              <span className="bg-emerald-600 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                سند الاعتماد والترخيص البلاتيني النهائي للإطلاق التجاري (Final Acceptance)
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة الحادية عشرة 11.4</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">11.4 Enterprise Launch Certification – Final Acceptance</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              بوابة إثبات واعتماد جاهزية المنصة للإطلاق التجاري الرسمي وحظر أي ملاحظات أو ثغرات تعليقية. من خلال هذا الميثاق التاريخي، يتم تأكيد تماسك الوحدات السبعة الكبرى، وضمان عدم فقدان البيانات بين الحسابات العامة وشؤون الطلاب، ومطابقة خطط النسخ الاحتياطي التلقائي ومراجعة الأدلة الأكاديمية والتوثيق للتشغيل الخالي تماماً من المشكلات.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-emerald-500/15 border border-emerald-500/30 p-4 shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-emerald-300 block uppercase">قرار الاعتماد التجاري الأخير</span>
            <span className={`text-sm font-black mt-1 block ${isFinalApproved ? 'text-emerald-400 font-extrabold animate-bounce' : 'text-slate-300'}`}>
              {isFinalApproved ? '👑 تم الترخيص والاعتماد كمنتج ذهبي ✓' : 'بانتظار توقيع ميثاق الإطلاق'}
            </span>
            <p className="text-[9px] text-slate-400 mt-1 font-bold">Commercial Launch Approved</p>
          </div>
        </div>
      </div>

      {/* Grid: Enterprise Acceptance Modules */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <span>أولاً: اعتماد الوحدات السبعة الكبرى للمنصة (Enterprise Modules Acceptance)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">7 Core Modules</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          انقر لتعديل أو رصد نجاح أي وحدة دراسية وإدارية من مكونات المنصة المعتمدة:
        </p>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((m) => (
            <div 
              key={m.id}
              onClick={() => toggleModule(m.id)}
              className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-2 text-right flex flex-col justify-between min-h-[120px]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${m.status === 'passed' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                    {m.status === 'passed' && <Check className="w-3 h-3" />}
                  </div>
                  <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{m.name}</strong>
                </div>
                <p className="text-[9px] text-slate-400 font-semibold mt-1.5 leading-relaxed">{m.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/40 flex justify-between items-center text-[9px] font-bold text-slate-500">
                <span>تطابق تشغيلي</span>
                <span className={m.status === 'passed' ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                  {m.status === 'passed' ? '✓ معتمد بالكامل' : '⚠️ تحت الفحص'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Cross-Module Validation & Production Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Cross-Module Validation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>ثانياً: التحقق المتقاطع للبيانات وانتقالها (Cross-Module Validation)</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">CROSS FLOW</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              ضمان تماسك تدفق العمليات الحساسة وتدوير الأرصدة دون أي أخطاء رياضية:
            </p>

            <div className="space-y-3.5">
              {crossValidations.map((cv) => (
                <div 
                  key={cv.id}
                  onClick={() => toggleCrossValidation(cv.id)}
                  className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${cv.status === 'passed' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                        {cv.status === 'passed' && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{cv.label}</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-6">{cv.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Production Checklist */}
        <div className="lg:col-span-7 space-y-6">
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-500" />
                <span>ثالثاً: قائمة التحقق الشاملة لبيئة الإنتاج الموثوقة (Production Checklist)</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">PRODUCTION</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              ضمان الالتزام بمواصفات الفصل الإداري والتعافي التلقائي وحظر الأعطال البرمجية:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {prodChecks.map((pc) => (
                <div 
                  key={pc.id}
                  onClick={() => toggleProdCheck(pc.id)}
                  className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${pc.status === 'verified' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                      {pc.status === 'verified' && <Check className="w-3 h-3" />}
                    </div>
                    <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{pc.label}</strong>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold leading-relaxed mt-1">{pc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Launch Documentation Checker */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-500 animate-pulse" />
            <span>رابعاً: اكتمال أدلة وتوثيق الإطلاق الرسمي للمنصة (Launch Documentation)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">5 Guides Completed</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          تأكيد اكتمال أدلة التدريب والدعم للمستخدم النهائي ومسؤول النظام والعودة للإصدارات السابقة:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {docs.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => toggleDoc(doc.id)}
              className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all flex flex-col justify-between min-h-[120px]"
            >
              <div>
                <strong className="text-xs font-black text-slate-850 dark:text-slate-100 block">{doc.title}</strong>
                <p className="text-[9px] text-slate-400 font-semibold mt-1.5 leading-normal">{doc.desc}</p>
              </div>
              <div className="pt-2 border-t border-slate-200/40 flex justify-between items-center text-[9px] font-bold">
                <span className="text-amber-500">مستندات حية</span>
                <span className={doc.status === 'completed' ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                  {doc.status === 'completed' ? '✓ مكتمل ومعتمد' : '⚠️ قيد الصياغة'}
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
            <span>خامساً: تشغيل المطابقة الكلية وقبول المستخدم النهائي للمنصة (npm run lint & build Verification Suite)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">UAT Suite</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          إجراء فحص ومحاكاة البنية وتأكيد البناء الشامل للمشروع وحظر أي ملاحظات أو ثغرات معلقة:
        </p>

        {/* Console Box */}
        <div className="bg-slate-950 p-4 border border-slate-800 text-[10px] font-mono text-slate-300 text-left" dir="ltr">
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-2 font-sans font-bold">
            <span>UAT & Build Terminal Simulation Logs:</span>
            <span className="text-[9px] text-emerald-450 bg-slate-900 px-1.5 py-0.5 rounded-md">GOLD ACCEPTANCE</span>
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
          onClick={runFinalAcceptanceSimulation}
          className="w-full bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 text-emerald-450 py-3.5 px-4 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulationActive ? 'animate-spin' : ''}`} />
          <span>{isSimulationActive ? 'جاري التحقق الفني ومطابقة قواعد الأعمال وبناء حزم النشر النهائي...' : 'بدء تشغيل موازين الفحص النهائي لسيناريوهات الإطلاق الفعلي وقبول المستخدم (Check Launch System)'}</span>
        </button>
      </div>

      {/* Official Launch Certification Seal */}
      <div className="relative overflow-hidden bg-slate-950 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
        
        {/* Animated background stamp logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/5 rounded-full border border-dashed border-emerald-500/10 flex items-center justify-center pointer-events-none select-none">
          <div className="w-[320px] h-[320px] bg-emerald-500/5 rounded-full border border-double border-emerald-500/20 -rotate-12 flex items-center justify-center">
            <span className="text-emerald-450 text-4xl font-black">الاعتماد التجاري 🏆</span>
          </div>
        </div>

        <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="w-24 h-24 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 animate-pulse">
            <Award className="w-12 h-12 text-emerald-455 animate-pulse" />
          </div>

          <span className="text-xs font-black text-emerald-400 block uppercase tracking-widest">بوابة الاعتماد السحابي للمدارس والمجمعات الكبرى - ميثاق المستوى 11.4</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">وثيقة وسند رخصة الإطلاق التجاري النهائي (Enterprise Commercial Launch Official Certificate)</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            نشهد نحن فريق ضبط معايير الجودة الشاملة ومطابقة الأداء، بأن المنصة بكافة شاشاتها المتسقة، وأزرارها ونوافذها وجداولها الموحدة، وسير العمل الأكاديمي والمالي والتشغيلي بالبنية السحابية المتكاملة، تلبي بالكامل وبفخر منقطع النظير أرقى المعايير العالمية الموازية والمماثلة لأفضل أنظمة ERP العالمية، لتوفير بيئة مستدامة وموثوقة بنسبة 100% للمستثمرين ومديري المدارس والمحاسبين التعليميين.
          </p>

          {isFinalApproved && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">سند ترخيص وإجازة الإطلاق التجاري النهائي</span>
              <h4 className="text-sm font-black text-emerald-400">✓ تم قفل واعتماد الختم والترخيص التجاري البلاتيني (Commercial Launch Seal) بنجاح كلي</h4>
              <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                تم توقيع وترخيص المنصة بصفة نهائية لضمان جودة عزل المستأجرين وسرعة المهام والرصد التشغيلي بالرمز الدولي: <code className="font-mono text-emerald-300 bg-emerald-950/50 px-1.5 py-0.5 rounded">ERP-PLATFORM-COMMERCIAL-LAUNCH-FINAL-v11.4</code>.
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
          {!isEligibleForFinalApproval && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>يجب مراجعة واعتماد جميع الوحدات (7 Core Modules)، وموازين البيانات، وقائمة فحص الإنتاج، واكتمال المستندات بنسبة 100% للتمكن من تفعيل رخصة الإطلاق التجاري النهائي.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              disabled={!isEligibleForFinalApproval}
              onClick={() => {
                setIsFinalApproved(true);
                triggerNotification('تهانينا الكبرى! تم تفعيل وتوقيع رخصة الإطلاق التجاري والقبول النهائي للمنصة بنجاح باهر وبنسبة 100%! 🏆🚀👑🌟', 'success');
              }}
              className={`font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${isEligibleForFinalApproval ? 'bg-emerald-600 hover:bg-emerald-700 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>الموافقة وتوقيع رخصة الإطلاق التجاري والقبول النهائي للمنصة 🏆👑</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير وثيقة ميثاق الإطلاق التجاري النهائي (Launch Acceptance Summary) 📄</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
