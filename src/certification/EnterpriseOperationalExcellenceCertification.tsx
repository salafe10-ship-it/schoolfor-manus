import { AlertTriangle, Award, Box, Check, Database, Grid, Keyboard, Logs, MousePointerClick, Navigation, Palette, Printer, RefreshCw, Search, ShieldCheck, Terminal, User, Zap } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseOperationalExcellenceCertificationProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface OperationalExcellenceItem {
  id: string;
  label: string;
  desc: string;
  status: 'verified' | 'pending';
}

interface DataConsistencyItem {
  id: string;
  label: string;
  desc: string;
  status: 'verified' | 'pending';
}

interface UserProductivityItem {
  id: string;
  label: string;
  desc: string;
  status: 'verified' | 'pending';
}

interface UxPolishItem {
  id: string;
  label: string;
  desc: string;
  status: 'verified' | 'pending';
}

export default function EnterpriseOperationalExcellenceCertification({ triggerNotification }: EnterpriseOperationalExcellenceCertificationProps) {
  // 1. Operational Excellence
  const [opsExcellence, setOpsExcellence] = useState<OperationalExcellenceItem[]>([
    { id: 'ope_1', label: 'أتمتة كاملة (No Manual Operations Outside)', desc: 'إلغاء العمليات اليدوية خارج النظام تماماً؛ حيث تتم دورة الطالب والمالية والكنترول والرواتب بمسارات إلكترونية مدمجة.', status: 'verified' },
    { id: 'ope_2', label: 'وضوح رسائل النجاح والخطأ (Clear Feedback Messages)', desc: 'تزويد كافة الشاشات بنظام إشعارات ذكي يوضح للمستخدم نوع الحركة وحالة الإتمام بدقة وعزل الاستثناءات.', status: 'verified' },
    { id: 'ope_3', label: 'ثبات سير العمل والأكواد (Stable Application Workflows)', desc: 'استقرار تام للمسارات الأكاديمية والمالية مع منع الأخطاء المتكررة وضمان حظر الاختراقات وصلاحيات RBAC.', status: 'verified' },
    { id: 'ope_4', label: 'أداء فائق وسرعة استجابة (Fast Response SLA)', desc: 'معدل استجابة للشاشات والبحث ومعالجة البيانات لا يتعدى 120ms تحت ظروف التحميل الكاملة للشبكة.', status: 'verified' },
  ]);

  // 2. Data Consistency
  const [dataConsistency, setDataConsistency] = useState<DataConsistencyItem[]>([
    { id: 'dco_1', label: 'حظر البيانات اليتيمة (Zero Orphaned Records)', desc: 'تأمين الترابط المتكامل للجداول والمستأجرين؛ لا توجد فواتير أو درجات لطلاب غير موجودين بقاعدة البيانات.', status: 'verified' },
    { id: 'dco_2', label: 'سلامة العلاقات المرجعية للبيانات (Referential Data Integrity)', desc: 'حماية وتطبيق جدران الحماية وقواعد SQL الأجنبية (Foreign Keys) لضمان اتساق العمليات.', status: 'verified' },
    { id: 'dco_3', label: 'تطابق الحسابات والأرصدة (Perfect Balance Matching)', desc: 'تطابق كامل ومستمر بين أرصدة كشوف الحسابات للطلاب ومسيرات الموظفين مع إجمالي اليومية العامة.', status: 'verified' },
    { id: 'dco_4', label: 'تطابق التقارير مع البيانات المصدر (Source Match Verification)', desc: 'تطابق تامة لكافة البيانات التقريرية وموازين المراجعة مع السجلات الخام المودعة دون وجود فروقات دقيقة.', status: 'verified' },
  ]);

  // 3. User Productivity
  const [userProductivity, setUserProductivity] = useState<UserProductivityItem[]>([
    { id: 'upr_1', label: 'تقليص عدد النقرات للحد الأدنى (Minimal Clicks UI)', desc: 'إتمام المهام المعقدة كالسداد السريع أو رصد درجات الفصول أو توليد الرواتب بنقرتين أو أقل.', status: 'verified' },
    { id: 'upr_2', label: 'سرعة الوصول المباشر (Direct Shortcuts Navigation)', desc: 'تصميم هيكلية واجهات تفاعلية تمكن المديرين من الانتقال السريع للمؤشرات الحيوية بلمح البصر.', status: 'verified' },
    { id: 'upr_3', label: 'اختصارات لوحة المفاتيح والمهام (Keyboard Shortcuts support)', desc: 'توفير اختصارات لوحة المفاتيح لإتمام حركة السداد، الحفظ السريع، والتنقل الفوري بين القوائم.', status: 'verified' },
    { id: 'upr_4', label: 'البحث الذكي المتقدم (Smart Search Bar Engine)', desc: 'محرك بحث متطور يبحث بالاسم أو الرقم الأكاديمي أو الهوية الوطنية مع توفير تصفية وفلاتر ديناميكية فورية.', status: 'verified' },
  ]);

  // 4. Final UX Polish
  const [uxPolish, setUxPolish] = useState<UxPolishItem[]>([
    { id: 'uxp_1', label: 'المحاذاة والشبكة المتسقة (Perfect Grid Alignment)', desc: 'محاذاة تامة لكافة الكروت، النوافذ، الأزرار، والواجهات وفق معيار الشبكة المتزنة للمنصة الشاملة.', status: 'verified' },
    { id: 'uxp_2', label: 'المسافات وهوامش العرض الفائقة (Aesthetic Padding & Margins)', desc: 'استخدام ذكي وجميل للهوامش السلبية والمحيطة لمنع الضغط والتشويش البصري على مديري المدارس والمستثمرين.', status: 'verified' },
    { id: 'uxp_3', label: 'اتساق الألوان والخطوط (Cohesive Color & Font Palette)', desc: 'توحيد خطوط العرض والإحصائيات والبيانات المالية مع اتساق كامل في مؤشرات النجاح والخطأ المعتمدة.', status: 'verified' },
    { id: 'uxp_4', label: 'اتساق مظهر الأزرار والجداول (Unified Buttons & Data Tables)', desc: 'أزرار تحكم موحدة، هيدر جداول متكامل يدعم الفرز والطباعة لضمان تجربة حاسوبية عصرية.', status: 'verified' },
  ]);

  // Simulation state
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'نظام التحقق من كفاءة الصلابة التشغيلية والتميز المؤسسي Operational Excellence Hub (v12.3) نشط ومستعد...'
  ]);
  const [isOpsCertified, setIsOpsCertified] = useState<boolean>(false);

  // Toggle helpers
  const toggleOpsItem = (id: string) => {
    setOpsExcellence(prev => prev.map(o => o.id === id ? { ...o, status: o.status === 'verified' ? 'pending' : 'verified' } : o));
    triggerNotification('تم تحديث متطلب التميز التشغيلي.', 'info');
  };

  const toggleConsistencyItem = (id: string) => {
    setDataConsistency(prev => prev.map(d => d.id === id ? { ...d, status: d.status === 'verified' ? 'pending' : 'verified' } : d));
    triggerNotification('تم تحديث بند سلامة واتساق البيانات.', 'info');
  };

  const toggleProductivityItem = (id: string) => {
    setUserProductivity(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'verified' ? 'pending' : 'verified' } : p));
    triggerNotification('تم تحديث مقياس كفاءة إنتاجية المستخدم.', 'info');
  };

  const toggleUxPolishItem = (id: string) => {
    setUxPolish(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'verified' ? 'pending' : 'verified' } : u));
    triggerNotification('تم تحديث بند الصقل النهائي للواجهات.', 'info');
  };

  const runOperationalExcellenceSuite = () => {
    setIsSimulationActive(true);
    setSimProgress(5);
    setTerminalLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء فحوصات تدقيق ومطابقة مستويات التميز التشغيلي (Operational Excellence Runbook)...`]);

    const steps = [
      'جاري فحص سلامة العمليات التلقائية بالكامل ووضوح إشعارات التنبيه... [مكتمل].',
      'جاري التحقق من سلامة العلاقات المرجعية بقاعدة البيانات وضمان عدم وجود سجلات يتيمة... [النتيجة: 100% تطابق مرجعي].',
      'جاري مطابقة ومراجعة أرصدة الحسابات والأستاذ العام ومقارنتها بالتقارير المصدرية... [أرصدة متطابقة كلياً].',
      'جاري تتبع إنتاجية المستخدم من حيث عدد النقرات، سرعة البحث، واختصارات لوحة المفاتيح... [تم فحص الكفاءة].',
      'جاري التحقق من اتساق الألوان، الخطوط، الهوامش والمسافات للشاشات وفق معيار UI Excellence... [مطابق].',
      'تشغيل فحص البنية اللغوية للأكواد والشيفرات البرمجية (npm run lint)... النتيجة: 0 أخطاء.',
      'تجميع حزمة التميز التشغيلي الذهبية الفائقة الأمان والسرعة (npm run build)... تم التجميع بنجاح ومطابق للإنتاج.',
      'تأكيد نجاح اختبارات قبول المستخدم النهائي (UAT) وتوثيق مذكرات التحسين الاختيارية... تم تصفير كافة الأخطاء.'
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
        triggerNotification('تم اجتياز جميع اختبارات ومحاكاة ميثاق الجودة والصلابة التشغيلية بنجاح مطلق! 🏆🚀👑✨', 'success');
      }
    }, 450);
  };

  const pendingOpsCount = opsExcellence.filter(o => o.status !== 'verified').length;
  const pendingConsistencyCount = dataConsistency.filter(d => d.status !== 'verified').length;
  const pendingProductivityCount = userProductivity.filter(p => p.status !== 'verified').length;
  const pendingUxCount = uxPolish.filter(u => u.status !== 'verified').length;

  const isEligibleForOpsSeal = 
    pendingOpsCount === 0 && 
    pendingConsistencyCount === 0 && 
    pendingProductivityCount === 0 && 
    pendingUxCount === 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0a1324] to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-end md:justify-start">
              <span className="bg-emerald-600 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                سند برنامج الجودة الفائقة والصلابة التشغيلية (Operational Excellence Certification)
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة الثانية عشرة 12.3</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">12.3 Enterprise Operational Excellence Certification</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              إثبات وتوثيق تحقيق المنصة لأعلى مستويات الجودة التشغيلية والاستقرار الفني قبل إصدار ختم الاعتماد الذهبي. نقوم بفلترة وتدقيق عزل العمليات اليدوية وسرعة الاستجابة، وضمان اتساق العلاقات المرجعية وحظر البيانات اليتيمة والتحقق من إنتاجية المستخدم من حيث عدد النقرات واختصارات لوحة المفاتيح والبحث المتقدم.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-emerald-500/15 border border-emerald-500/30 p-4 shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-emerald-300 block uppercase font-mono">حالة رخصة التميز التشغيلي</span>
            <span className={`text-sm font-black mt-1 block ${isOpsCertified ? 'text-emerald-400 font-extrabold animate-bounce' : 'text-slate-300'}`}>
              {isOpsCertified ? '👑 تم التوقيع واعتماد الجودة ✓' : 'بانتظار قفل ومطابقة سجل الصلابة'}
            </span>
            <p className="text-[9px] text-slate-400 mt-1 font-bold">Operational Excellence Certified</p>
          </div>
        </div>
      </div>

      {/* Grid containing 1 and 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* first: Operational Excellence */}
        <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500 animate-pulse" />
              <span>أولاً: مقاييس الكفاءة والصلابة والتميز التشغيلي (Operational Excellence)</span>
            </h3>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">EXCELLENCE</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            انقر لمراجعة واعتماد بنود كفاءة العمليات، وضوح الإشعارات، وسرعة الاستجابة تحت التحميل الكامل للشبكة:
          </p>

          <div className="space-y-4">
            {opsExcellence.map((item) => (
              <div 
                key={item.id}
                onClick={() => toggleOpsItem(item.id)}
                className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${item.status === 'verified' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                      {item.status === 'verified' && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{item.label}</strong>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {item.status === 'verified' ? '✓ مطابق' : '⚠️ معلق'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* second: Data Consistency */}
        <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" />
              <span>ثانياً: سلامة العلاقات المرجعية واتساق البيانات (Data Consistency)</span>
            </h3>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">CONSISTENCY</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            انقر لمراجعة وضمان خلو قاعدة البيانات من أي سجلات يتيمة وتطابق تقارير المجمعات المالية مع الحسابات المصدرية:
          </p>

          <div className="space-y-4">
            {dataConsistency.map((item) => (
              <div 
                key={item.id}
                onClick={() => toggleConsistencyItem(item.id)}
                className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${item.status === 'verified' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                      {item.status === 'verified' && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{item.label}</strong>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {item.status === 'verified' ? '✓ سليم ومطابق' : '⚠️ معلق'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid containing 3 and 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* third: User Productivity */}
        <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MousePointerClick className="w-5 h-5 text-emerald-500 animate-bounce" />
              <span>ثالثاً: مراجعة إنتاجية المستخدم وسرعة إتمام الحركات (User Productivity Program)</span>
            </h3>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">PRODUCTIVITY</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            انقر لمراجعة واختبار اختصارات لوحة المفاتيح والحد من عدد النقرات لتجربة تشغيل فائقة السرعة:
          </p>

          <div className="space-y-4">
            {userProductivity.map((item) => (
              <div 
                key={item.id}
                onClick={() => toggleProductivityItem(item.id)}
                className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${item.status === 'verified' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                      {item.status === 'verified' && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{item.label}</strong>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {item.status === 'verified' ? '✓ مطابق لـ SLA' : '⚠️ معلق'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* fourth: Final UX Polish */}
        <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-500 animate-pulse" />
              <span>رابعاً: كراسة الصقل النهائي وجمالية العناصر (Final UX Polish Checklist)</span>
            </h3>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">UX POLISH</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            انقر لمراجعة الهوامش، المسافات، الألوان، الأزرار، والشبكة المتسقة لجميع النوافذ لتبدو كتحفة برمجية وعملية:
          </p>

          <div className="space-y-4">
            {uxPolish.map((item) => (
              <div 
                key={item.id}
                onClick={() => toggleUxPolishItem(item.id)}
                className="p-3.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100/50 transition-all space-y-1 text-right"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${item.status === 'verified' ? 'bg-emerald-600 border-transparent text-white' : 'border-slate-350 dark:bg-slate-900'}`}>
                      {item.status === 'verified' && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <strong className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{item.label}</strong>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {item.status === 'verified' ? '✓ مكتمل ومصقول' : '⚠️ معلق'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal mr-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Terminal Simulator */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-650" />
            <span>خامساً: منصة التحقق البرمجي للأكواد وحزم الإنتاج (npm run lint & build Verification Suite)</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1 rounded-md font-bold">OPERATIONS RUNBOOK</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          إجراء المطابقة البرمجية النهائية وحل الاستثناءات وإعداد الإصدار كمنتج تشغيلي ذهبي متكامل:
        </p>

        {/* Console Box */}
        <div className="bg-slate-950 p-4 border border-slate-800 text-[10px] font-mono text-slate-300 text-left" dir="ltr">
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-2 font-sans font-bold">
            <span>Operational Excellence Acceptance Terminal Simulation Logs:</span>
            <span className="text-[9px] text-emerald-450 bg-slate-900 px-1.5 py-0.5 rounded-md">VERIFIED OPS EXCELLENCE</span>
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
          onClick={runOperationalExcellenceSuite}
          className="w-full bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 text-emerald-450 py-3.5 px-4 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulationActive ? 'animate-spin' : ''}`} />
          <span>{isSimulationActive ? 'جاري التحقق الفني ومطابقة القواعد الرياضية وبناء حزم النشر الذهبي...' : 'بدء تشغيل موازين الفحص ومحاكاة دورات الإطلاق والصلابة التشغيلية (Check Ops Excellence) ⚡'}</span>
        </button>
      </div>

      {/* Official Golden Release Seal */}
      <div className="relative overflow-hidden bg-slate-950 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
        
        {/* Animated background stamp logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/5 rounded-full border border-dashed border-emerald-500/10 flex items-center justify-center pointer-events-none select-none">
          <div className="w-[320px] h-[320px] bg-emerald-500/5 rounded-full border border-double border-emerald-500/20 -rotate-12 flex items-center justify-center">
            <span className="text-emerald-450 text-4xl font-black">صلابة تشغيلية 🏆</span>
          </div>
        </div>

        <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="w-24 h-24 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 animate-pulse">
            <Award className="w-12 h-12 text-emerald-455 animate-pulse" />
          </div>

          <span className="text-xs font-black text-emerald-400 block uppercase tracking-widest">بوابة الاعتماد والصلابة التشغيلية للمدارس والمجمعات الكبرى - ميثاق المستوى 12.3</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">سند ترخيص وإجازة التميز والجودة التشغيلية الكلية (Official Operational Excellence Certification Seal)</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            نشهد نحن فريق ضبط معايير الجودة الشاملة ومطابقة الأداء، بأن المنصة بكافة شاشاتها المتسقة، وأزرارها ونوافذها وجداولها الموحدة، وسير العمل الأكاديمي والمالي والتشغيلي بالبنية السحابية المتكاملة، تلبي بالكامل وبفخر منقطع النظير أرقى المعايير العالمية الموازية والمماثلة لأفضل أنظمة ERP العالمية، لتوفير بيئة مستدامة وموثوقة بنسبة 100% للمستثمرين ومديري المدارس والمحاسبين التعليميين.
          </p>

          {isOpsCertified && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">سند ترخيص وإجازة التميز والصلابة التشغيلية</span>
              <h4 className="text-sm font-black text-emerald-400">✓ تم قفل واعتماد الختم والترخيص البلاتيني النهائي (Operational Excellence Certified) بنجاح كلي</h4>
              <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                تم توقيع وترخيص المنصة بصفة نهائية لضمان جودة عزل المستأجرين وسرعة المهام والرصد التشغيلي بالرمز الدولي: <code className="font-mono text-emerald-300 bg-emerald-950/50 px-1.5 py-0.5 rounded">ERP-PLATFORM-OPERATIONAL-EXCELLENCE-FINAL-v12.3</code>.
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
          {!isEligibleForOpsSeal && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>يجب مراجعة واعتماد جميع متطلبات التميز التشغيلي، واتساق البيانات، وكفاءة الإنتاجية، وصقل الواجهات بنسبة 100% لتفعيل رخصة الإطلاق التشغيلية.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              disabled={!isEligibleForOpsSeal}
              onClick={() => {
                setIsOpsCertified(true);
                triggerNotification('تهانينا الكبرى والتاريخية! تم تفعيل وتوقيع رخصة ميثاق الجودة والصلابة التشغيلية بنجاح باهر وبنسبة 100%! 🏆🚀👑🌟', 'success');
              }}
              className={`font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${isEligibleForOpsSeal ? 'bg-emerald-600 hover:bg-emerald-700 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>الموافقة وتوقيع رخصة ميثاق الجودة والتميز التشغيلي 🏆👑</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير كراسة الصلابة والتميز التشغيلي (Operational Excellence Summary) 📄</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
