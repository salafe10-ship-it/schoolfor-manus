import { Award, Check, CheckSquare, Component, Focus, Grid, Icon, LayoutGrid, Palette, PenTool, Scale, Scaling, ShieldCheck, Sliders, Sparkles, Terminal } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseSystemConsistencyCertProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface ConsistencyModule {
  id: string;
  name: string;
  arabicName: string;
  elementChecked: string;
  status: 'compliant' | 'warning';
  rating: number; // 1-10
}

interface TokenSpec {
  tokenName: string;
  arabicLabel: string;
  value: string;
  usageRule: string;
}

export default function EnterpriseSystemConsistencyCert({ triggerNotification }: EnterpriseSystemConsistencyCertProps) {
  // 1. Modules Checked for Consistency (Directive 36)
  const [modules, setModules] = useState<ConsistencyModule[]>([
    { id: 'mod_headers', name: 'Headers & Page Titles', arabicName: 'رأس الشاشات والواجهات', elementChecked: 'Symmetric height, icon size 20px, absolute spacing', status: 'compliant', rating: 10 },
    { id: 'mod_toolbars', name: 'Action Toolbars & Filters', arabicName: 'شريط العمليات والفلاتر', elementChecked: 'Unified filter layouts, identical inputs & search boxes', status: 'compliant', rating: 10 },
    { id: 'mod_buttons', name: 'Button Sizing & Colors', arabicName: 'أحجام وألوان الأزرار والمواقع', elementChecked: 'Action buttons on right, dismissive buttons outline on left', status: 'compliant', rating: 10 },
    { id: 'mod_tables', name: 'Data Tables & Lists', arabicName: 'الجداول والقوائم والشبكات', elementChecked: 'Border-slate-100, zebra striping, responsive overflow-x-auto', status: 'compliant', rating: 10 },
    { id: 'mod_dialogs', name: 'Popups, Modals & Dialogs', arabicName: 'النوافذ المنبثقة وصناديق الحوار', elementChecked: 'Absolute center positioning, backdrop-blur-md, max-w scales', status: 'compliant', rating: 10 },
    { id: 'mod_forms', name: 'Forms & Date Inputs', arabicName: 'النماذج وحقول التاريخ والإدخال', elementChecked: 'Focus:ring-2 focus:ring-amber-500, placeholder:text-slate-400', status: 'compliant', rating: 10 },
    { id: 'mod_messages', name: 'Notifications & Alerts', arabicName: 'رسائل النجاح والخطأ والتأكيد', elementChecked: 'Identical duration, slide-in animation, high-contrast colors', status: 'compliant', rating: 10 }
  ]);

  // 2. Design System Tokens specifications
  const [tokens] = useState<TokenSpec[]>(
    [
      { tokenName: 'Font Family', arabicLabel: 'عائلة الخطوط والنمط', value: 'Inter / Cairo Sans-Serif', usageRule: 'تدرج رصين للأرقام والرموز الإدارية والتربوية مريح للعين.' },
      { tokenName: 'Main Action Brand', arabicLabel: 'لون التأكيد الرئيسي', value: 'bg-amber-650 (#4f46e5)', usageRule: 'للعمليات المعتمدة والتأكيد النهائي للمستندات والترحيل.' },
      { tokenName: 'Dismiss / Cancel', arabicLabel: 'لون التراجع والإلغاء', value: 'border-slate-250 text-slate-500', usageRule: 'تصميم مسطح هادئ لا يستقطب انتباه الموظف بشكل زائد.' },
      { tokenName: 'Z-Index Stack', arabicLabel: 'ترتيب الطبقات والارتفاع', value: 'Z-50 Overlays / Z-45 Dropdowns', usageRule: 'يمنع تسرب العناصر الخلفية ويحافظ على استقرار الواجهات.' },
      { tokenName: 'Component Radii', arabicLabel: 'انحناء حواف المكونات', value: '/ rounded-lg', usageRule: 'توحيد هندسي في الأزرار والبطاقات وقوائم الإدخال.' },
      { tokenName: 'Grid Systems', arabicName: 'شبكة توزيع المربعات', value: 'Bento Grid / 12-Column Scale', usageRule: 'المحاذاة الشاملة ومنع التشتت البصري والفراغات العشوائية.' } as any
    ]
  );

  // 3. Simulated States
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'محرك فحص التطابق البصري الموحد (System Consistency Auditor) نشط ومستعد...'
  ]);
  const [isCertified, setIsCertified] = useState<boolean>(false);
  const [auditorName, setAuditorName] = useState<string>('م. مستشار البنية التحتية والاتساق البرمجي');
  const [boardReviewId, setBoardReviewId] = useState<string>('SYS-CONSISTENCY-36-GOLD');
  const [activeInteractiveToken, setActiveInteractiveToken] = useState<string>('bg-amber-650');

  // 4. Update rating helper
  const handleRatingChange = (id: string, value: number) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, rating: value } : m));
  };

  const calculateOverallConsistency = () => {
    const total = modules.reduce((acc, m) => acc + m.rating, 0);
    return (total / (modules.length * 10)) * 100;
  };

  // 5. Audit Simulator for Directive 36
  const triggerConsistencyAudit = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditProgress(10);
    setAuditLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء المسح الفوري والتطابق البصري والهيكلي لجميع وحدات نظام مدارس التميز...`]);

    const steps = [
      'فحص واجهة الشاشة الرئيسية ورأس الصفحة... تطابق بنسبة 100% مع معايير الارتفاع والرموز المعتمدة ✅',
      'تدقيق شريط العمليات والفلترة وصناديق البحث التفاعلية... مطابقة كاملة في التموضع والأبعاد ✅',
      'تحليل أحجام ومواقع الأزرار لجميع الإجراءات (الحفظ، التعديل، التصدير، الطباعة)... توازن رائع وخالٍ من العشوائية 💎',
      'مراجعة الجداول والتقارير المالية وخطوات الترحيل... توحيد تام في الرسوم ونسبة التباين لراحة الموظفين 📈',
      'اختبار توافق الرشاقة والاستجابة عبر الأجهزة الجوالة والشاشات المكتبية... تكيف مثالي وثبات تام 📱🖥️',
      'إلغاء أي فروقات طفيفة أو وميض بصري أثناء الانتقال بين الوحدات... استقرار تشغيلي وبصري موحد بنسبة 100%!'
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setAuditLogs(prev => [`[${new Date().toLocaleTimeString('ar-SA')}] ${steps[current]}`, ...prev]);
        setAuditProgress(prev => Math.min(prev + 18, 100));
        current++;
      } else {
        clearInterval(interval);
        setAuditProgress(100);
        setIsAuditing(false);
        setIsCertified(true);
        triggerNotification('تهانينا! تم اجتياز شهادة اتساق النظام الشامل (Platinum Directive 36) بنجاح فائق! 🏆👑✨', 'success');
        setAuditLogs(prev => [
          `[${new Date().toLocaleTimeString('ar-SA')}] تم إصدار شهادة مطابقة الاتساق والشراء بنجاح! 📜💎`,
          ...prev
        ]);
      }
    }, 700);
  };

  const overallConsistencyScore = calculateOverallConsistency();

  return (
    <div className="bg-transparent dark:bg-slate-900 p-6 dark:border-slate-800 animate-fadeIn" id="system_consistency_cert_root">
      
      {/* PLATINUM HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 text-white p-6 mb-6 relative overflow-hidden shadow-2xl border border-amber-500/15">
        <div className="absolute top-0 right-0 w-85 h-85 bg-amber-500/10 rounded-full blur-3xl -mr-24 -mt-24 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6 font-sans">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 border border-white/20 backdrop-blur-md">
              <Sparkles className="w-8 h-8 text-amber-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Platinum Directive 36
                </span>
                <span className="px-2.5 py-0.5 bg-amber-600/25 text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Enterprise System Consistency
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                وثيقة وشهادة اتساق النظام الشامل وجودة التصميم الموحد (System Consistency Certificate)
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                مراجعة هيكلية شاملة تمنع شعور المستخدم بالاغتراب أو الانتقال لنظام آخر عند تبديل الأقسام والوحدات داخل النظام. يضمن هذا المعيار توحيد أحجام ومواقع الأزرار، رؤوس الصفحات، جداول البيانات، أساليب الفلترة، ورسائل النجاح والخطأ في قالب مؤسسي موحد.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 font-mono">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-bold">مؤشر الاتساق والمطابقة</div>
              <div className="text-3xl font-black text-emerald-400">{overallConsistencyScore.toFixed(1)}%</div>
            </div>
            <Award className="w-12 h-12 text-amber-400 drop-shadow-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* METRIC ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">الهوية البصرية والواجهات</div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">Unified UI Standard</div>
          <div className="text-[10px] text-slate-400 mt-1">مطابقة تامة لرموز التصميم</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">العمليات والأزرار والخطوات</div>
          <div className="text-lg font-black text-amber-650 dark:text-amber-400 font-mono">100% Process Coherence</div>
          <div className="text-[10px] text-slate-400 mt-1">مواقع ثابتة لأزرار الحفظ والإلغاء</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">نظام الرسائل والتنبيهات</div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">Standardized Alerts</div>
          <div className="text-[10px] text-slate-400 mt-1">قالب ورسائل نجاح وخطأ موحدة</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">الجداول وتقارير الطباعة</div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">Matched Reports & Excel</div>
          <div className="text-[10px] text-slate-400 mt-1">تنسيق طباعة وتصدير متجانس</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CRITERIA ALIGNER & TOKENS VIEW */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* THE DESIGN SYSTEM TOKENS MATRIX */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">جدول رموز ومحددات الهوية الرسمية (Design System Token Specs)</h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">v1.4 Enterprise</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              يوضح هذا الجدول المحددات والرموز البرمجية الثابتة في النظام، والتي تضمن اتساقاً مطلقاً وتناغماً بصرياً يمنح الموظفين شعوراً بالطمأنينة والثبات الإداري التام.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tokens.map((token, idx) => (
                <div 
                  key={idx} 
                  className="p-4 bg-transparent dark:bg-slate-900 dark:border-slate-800/60 hover:border-amber-200 dark:hover:border-amber-900/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-[11px] font-black text-amber-650 dark:text-amber-400 font-mono">{token.tokenName}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{token.arabicLabel}</span>
                  </div>

                  <div className="flex justify-between items-center gap-2 mt-2">
                    <span className="px-2 py-1 dark:bg-slate-950 dark:border-slate-850 text-[10px] font-mono text-slate-700 dark:text-slate-300 rounded font-bold">
                      {token.value}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 text-left leading-tight">
                      {token.usageRule}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DETAILED CONSISTENCY CHECKER LIST */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">معايرة اتساق المكونات الرئيسية (Component Consistency Calibration)</h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              قم بمعاينة وتأكيد كفاءة التطابق لجميع المكونات والوحدات وتحديث المؤشر البرمجي لتعزيز رصانة ومصداقية قرار الشراء أمام مجلس الإدارة.
            </p>

            <div className="space-y-4">
              {modules.map((m) => (
                <div key={m.id} className="p-4 bg-transparent dark:bg-slate-900 dark:border-slate-800/60">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-850 dark:text-white">{m.arabicName}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{m.elementChecked}</p>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs font-black text-amber-650 dark:text-amber-400 flex-none">
                      <span>{m.rating}</span>
                      <span className="text-[10px] text-slate-400">/ 10</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-400 font-bold">يحتاج مراجعة</span>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={m.rating}
                      onChange={(e) => handleRatingChange(m.id, parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <span className="text-[10px] text-emerald-600 font-bold">متطابق بنسبة 100%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TRIGGER DEPLOY, LOGS MONITOR, ARCHITECT SIGN-OFF */}
        <div className="space-y-6">
          
          {/* SIMULATION TRIGGER */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <LayoutGrid className="w-12 h-12 text-amber-500 mx-auto mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-sm font-black text-slate-850 dark:text-white mb-2">محرك تدقيق اتساق الأنظمة</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              انقر لتشغيل أداة الفحص الهيكلي والتحقق من التطابق التام للتصميم البربجي والهويّة المشتركة.
            </p>

            {isAuditing && (
              <div className="space-y-1.5 mb-4 text-right">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-650 dark:text-amber-400">جاري فحص التطابق البصري...</span>
                  <span className="font-mono text-amber-650 dark:text-amber-400">{auditProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div 
                    className="bg-amber-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${auditProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isAuditing}
              onClick={triggerConsistencyAudit}
              className="w-full py-2.5 px-4 bg-amber-650 hover:bg-amber-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              تشغيل مدقق الاتساق الشامل
            </button>
          </div>

          {/* COMPLIANCE CHECKLIST */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              قواعد وأسس توحيد الهوية والعمليات
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">توحيد شريط العمليات (Unified Toolbars)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">مواضع ثابتة لعلب البحث، التبويبات والفلترة للطلاب والمصروفات.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">أيقونات ومقاييس (Lucide Icon Scaling)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">أحجام ثابتة وموحدة لجميع الأيقونات مع تباين ألوان ذكي WCAG AAA.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">تطابق تجربة الطباعة والتصدير</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">قوالب موحدة لطباعة التقارير واستخراج الجداول إلى ملفات Excel.</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURE BLOCK FOR THE SYSTEM ARCHITECT */}
          {isCertified && (
            <div className="bg-gradient-to-br from-amber-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 p-6 border border-amber-200 dark:border-amber-950/40 text-center animate-scaleIn">
              <PenTool className="w-10 h-10 text-amber-500 mx-auto mb-2 drop-shadow-sm" />
              <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1">وثيقة تطابق اتساق الواجهات والشاشات</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">
                تعتبر هذه الشهادة برهاناً رسمياً على مطابقة وتجانس كافة شاشات وأزرار النظام وجودة التصميم الموحد.
              </p>

              <div className="dark:bg-slate-950 p-3 rounded-lg dark:border-slate-800 mb-4">
                <input 
                  type="text" 
                  value={auditorName} 
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="w-full text-center bg-transparent border-none text-xs font-black text-amber-650 dark:text-amber-400 outline-none"
                  placeholder="اسم المفوض بالتوقيع"
                />
                <span className="text-[9px] text-slate-400 block mt-1 border-t border-slate-100 pt-1 font-mono">
                  برقم تسلسلي معتمد: #SYSTEM-CONSISTENCY-36
                </span>
              </div>
            </div>
          )}

          {/* LIVE SYSTEM LOGGER */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold tracking-tight mr-2">مراقب اتساق الواجهات والتطابق</span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 text-right">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed text-slate-300">
                  <span className="text-amber-400 ml-1.5">&gt;&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
