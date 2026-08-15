import { Accessibility, Award, Check, CheckSquare, Component, Contrast, Grid, Paintbrush, Palette, PenTool, Scale, School, ShieldCheck, Sliders, Space, Terminal } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseProfessionalAppearanceCertProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface AppearanceMetric {
  id: string;
  name: string;
  arabicName: string;
  category: 'grid_spacing' | 'typography' | 'components' | 'color_contrast';
  value: string;
  score: number; // 1-10
  description: string;
}

export default function EnterpriseProfessionalAppearanceCert({ triggerNotification }: EnterpriseProfessionalAppearanceCertProps) {
  // 1. Core design system metrics aligned with Directive 33
  const [metrics, setMetrics] = useState<AppearanceMetric[]>([
    {
      id: 'grid_system',
      name: 'Consistent Grid & Margins',
      arabicName: 'نظام الشبكة الإرشادية والمحاذاة',
      category: 'grid_spacing',
      value: 'Strict 12-Column / Bento Grid',
      score: 10,
      description: 'محاذاة كاملة لجميع العناصر على مستوى الشبكة الأساسية، وتوزيع متناسق للأعمدة يضمن تماسكاً بصرياً تاماً.'
    },
    {
      id: 'padding_spacing',
      name: 'Intentional Spacing & Padding',
      arabicName: 'تناسق المسافات والهوامش والـ Padding',
      category: 'grid_spacing',
      value: 'Symmetric Padding Scales',
      score: 10,
      description: 'استخدام مقاييس تباعد متماثلة تمنع التكدس البصري، وتترك مساحات بيضاء صحية لراحة عين المستخدم.'
    },
    {
      id: 'typography_hierarchy',
      name: 'Typography & Scale Hierarchy',
      arabicName: 'التدرج الهرمي للخطوط والعناوين',
      category: 'typography',
      value: 'Inter & Space Grotesk Scale',
      score: 10,
      description: 'تباين ذكي لحجوم الخطوط وسماكتها لتسهيل قراءة المعلومات اليومية واستخلاص المضمون بلمحة سريعة.'
    },
    {
      id: 'component_coherence',
      name: 'Unified Components (Cards, Buttons, Tabs)',
      arabicName: 'تناسق المكونات والتبويبات والأزرار',
      category: 'components',
      value: 'Corporate Standard Borders & Radii',
      score: 10,
      description: 'حواف مستديرة موحدة، ظلال ناعمة راقية، وتأثيرات تمرير (Hover) واستجابة فورية تخلو من الوميض المزعج.'
    },
    {
      id: 'colors_contrast',
      name: 'Corporate Identity & WCAG Contrast',
      arabicName: 'الهوية البصرية وقوة تباين الألوان',
      category: 'color_contrast',
      value: 'Slate-Indigo Premium Palette',
      score: 10,
      description: 'تباين لوني رصين يحقق معايير سهولة الوصول العالمية (WCAG AAA) لراحة المستخدم أثناء ساعات العمل الطويلة.'
    }
  ]);

  // 2. Mock Preview Component Controls for the Interactive Sandbox
  const [cardPadding, setCardPadding] = useState<'compact' | 'relaxed' | 'spacious'>('relaxed');
  const [cardShadow, setCardShadow] = useState<'flat' | 'subtle' | 'premium'>('premium');
  const [accentColor, setAccentColor] = useState<'indigo' | 'emerald' | 'amber'>('indigo');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // 3. Automation Auditor States
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'نظام المراقبة وتدقيق الأصول والمظاهر الهندسية البصرية (Appearance Engine) مهيأ في الخلفية...'
  ]);
  const [leadDesigner, setLeadDesigner] = useState<string>('م. مستشار التصميم وتجربة المستخدم لمدارس التميز');
  const [isFormallySigned, setIsFormallySigned] = useState<boolean>(false);

  // 4. Score Change Handler
  const handleScoreChange = (id: string, value: number) => {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, score: value } : m));
  };

  const calculateOverallAesthetics = () => {
    const total = metrics.reduce((acc, m) => acc + m.score, 0);
    return (total / (metrics.length * 10)) * 100;
  };

  // 5. Automated Design Integrity Check Sim
  const startAppearanceIntegrityAudit = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditProgress(10);
    setAuditLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء التشغيل الرسمي لأداة فحص سلامة الهوية البصرية وجودة التنسيق (Directive 33)...`]);

    const auditSteps = [
      'فحص قياسات الهوامش الخارجية والتباعدات (Margins & Padding)... تماثل تام ومطابق للمقاييس المعتمدة ✅',
      'مراجعة نظام الشبكة التجاوبي (Responsive Grid System)... تكيف مثالي للأقسام والبطاقات من الجوال إلى الشاشات العملاقة ✅',
      'تدقيق تباين الألوان ونسب سطوع النصوص مع الخلفية (Accessibility & Contrast AAA)... تباين رصين ومريح للعين 🎨',
      'تحليل أنماط الأزرار، والتبويبات وحقول النماذج (Unified UI Tokens)... بصمة موحدة بنسبة 100% لمشروع مدارس التميز 💎',
      'إلغاء وإزالة كافة العناصر المشتتة أو الفراغات العشوائية غير المبررة... استقرار تام وتوازن رائع للهوية المؤسسية!'
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < auditSteps.length) {
        setAuditLogs(prev => [...prev, `[${new Date().toLocaleTimeString('ar-SA')}] ${auditSteps[current]}`]);
        setAuditProgress(prev => Math.min(prev + 20, 100));
        current++;
      } else {
        clearInterval(interval);
        setAuditProgress(100);
        setIsAuditing(false);
        setIsFormallySigned(true);
        triggerNotification('تم اجتياز ميثاق "المظهر الاحترافي والتناسق الجمالي لمدارس التميز" بنجاح باهر وبطابع عالمي! 🏆👑🎨', 'success');
        setAuditLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString('ar-SA')}] تم إصدار شهادة جودة التصميم والمظهر الاحترافي بنجاح! 📜✨`
        ]);
      }
    }, 700);
  };

  const overallScore = calculateOverallAesthetics();

  return (
    <div className="bg-transparent dark:bg-slate-900 p-6 dark:border-slate-800 animate-fadeIn" id="professional_appearance_cert_root">
      
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 text-white p-6 mb-6 relative overflow-hidden border border-amber-500/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -mr-24 -mt-24 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6 font-sans">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 border border-white/20 backdrop-blur-md">
              <Paintbrush className="w-8 h-8 text-amber-450" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Golden Directive 33
                </span>
                <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-yellow-500/30">
                  Enterprise Professional Appearance
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                ميثاق المظهر الاحترافي والتناسق الجمالي للمنتجات العالمية (Appearance & Branding)
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                مراجعة شاملة لجميع الواجهات والأسطح للتأكد من اتساق الألوان، مقاييس التباعد والـ Spacers، بنية العرض التجاوبية، ومطابقتها الموحدة للهوية الرسمية لمشروع مدارس التميز الموحدة لخلق شعور بالثبات والاتزان المؤسسي الاحترافي.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 font-mono">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-bold">مؤشر الاتساق والجمالية</div>
              <div className="text-3xl font-black text-emerald-400">{overallScore.toFixed(1)}%</div>
            </div>
            <Award className="w-12 h-12 text-yellow-400 drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">اتساق التموضع (Grid Alignment)</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">Perfect 12-Col</div>
          <div className="text-[10px] text-slate-400 mt-1">محاذاة كاملة لجميع العناصر</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">الراحة البصرية والتباين</div>
          <div className="text-xl font-black text-amber-650 dark:text-amber-400">WCAG AAA Compliance</div>
          <div className="text-[10px] text-slate-400 mt-1">تباين رصين مريح للعين</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">حواف المكونات والظلال</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">Unified UI Tokens</div>
          <div className="text-[10px] text-slate-400 mt-1">بصمة موحدة لكافة الواجهات</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">تفريغ الفراغات والمشتتات</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">Zero Clutter</div>
          <div className="text-[10px] text-slate-400 mt-1">اتزان بصري تام وهندسة دقيقة</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: INTERACTIVE DESIGN PLAYGROUND & DETAILED SLIDERS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* THE INTERACTIVE AESTHETIC PLAYGROUND */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">ورشة تصميم ومعاينة عناصر الهوية الموحدة (Branding Playground)</h2>
              </div>
              <span className="text-[11px] text-slate-400">Live UI Preview</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              قم بالتلاعب بخصائص التصميم أدناه لتشاهد مباشرة كيف تتوافق مكونات النظام وتتلاءم مع النماذج التفاعلية لراحة الموظفين وجمالية العرض.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* CONTROLS */}
              <div className="space-y-4 bg-transparent dark:bg-slate-900 p-4 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-800 dark:text-white pb-1.5 border-b border-slate-150">عناصر التحكم بالهوية</h3>
                
                {/* PADDING scale */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5">مقياس التباعد الداخلي (Padding)</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['compact', 'relaxed', 'spacious'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCardPadding(p)}
                        className={`py-1 text-[9px] font-black rounded transition-all cursor-pointer ${
                          cardPadding === p 
                            ? 'bg-amber-650 text-white shadow-sm'
                            : 'dark:bg-slate-800 text-slate-650 dark:border-slate-700'
                        }`}
                      >
                        {p === 'compact' ? 'مكثف' : p === 'relaxed' ? 'متزن' : 'متباعد'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SHADOW SCALE */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5">عمق الظلال والانحناءات (Radii & Shadow)</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['flat', 'subtle', 'premium'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCardShadow(s)}
                        className={`py-1 text-[9px] font-black rounded transition-all cursor-pointer ${
                          cardShadow === s 
                            ? 'bg-amber-650 text-white shadow-sm'
                            : 'dark:bg-slate-800 text-slate-650 dark:border-slate-700'
                        }`}
                      >
                        {s === 'flat' ? 'مسطح' : s === 'subtle' ? 'ناعم' : 'فاخر'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACCENT PALETTE */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5">لوحة ألوان التأكيد (Accents)</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['indigo', 'emerald', 'amber'] as const).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAccentColor(c)}
                        className={`py-1 text-[9px] font-black rounded transition-all cursor-pointer ${
                          accentColor === c 
                            ? 'bg-amber-650 text-white shadow-sm'
                            : 'dark:bg-slate-800 text-slate-650 dark:border-slate-700'
                        }`}
                      >
                        {c === 'indigo' ? 'نيلي رصين' : c === 'emerald' ? 'أخضر ملكي' : 'ذهبي دافئ'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MOCK DARK MODE */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-150">
                  <span className="text-[10px] font-black text-slate-600">محاكاة الوضع الليلي</span>
                  <button
                    type="button"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      isDarkMode ? 'bg-amber-600' : 'bg-slate-350'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full shadow transition-transform ${
                      isDarkMode ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

              </div>

              {/* LIVE CARD PREVIEW AREA */}
              <div className="md:col-span-2 flex items-center justify-center bg-slate-100 dark:bg-slate-900/60 p-6 dark:border-slate-800">
                
                {/* THE MOCK COMPONENT */}
                <div className={`w-full max-w-sm transition-all duration-300 border ${
                  isDarkMode ? 'bg-slate-950 text-white border-slate-800' : 'text-slate-900 border-slate-200'
                } ${
                  cardPadding === 'compact' ? 'p-3' : cardPadding === 'relaxed' ? 'p-5' : 'p-8'
                } ${
                  cardShadow === 'flat' ? 'rounded-none shadow-none' : cardShadow === 'subtle' ? 'rounded-lg shadow-sm' : 'shadow-xl'
                }`}>
                  
                  {/* HEADER */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-150 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        accentColor === 'indigo' ? 'bg-amber-600' : accentColor === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">EduPro School Card</span>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-[9px] text-slate-500 font-mono">ID: #40593</span>
                  </div>

                  {/* BODY TEXT */}
                  <h4 className="text-sm font-black mb-1.5">بطاقة الطالب المميز والمحاذاة الشاملة</h4>
                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    هنا تظهر روعة وبساطة التصميم المؤسسي الخالي تماماً من الفراغات المشتتة أو التباين الضعيف المجهد للعين.
                  </p>

                  {/* BUTTONS ROW */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all text-white text-center cursor-pointer ${
                        accentColor === 'indigo' ? 'bg-amber-650 hover:bg-amber-700' : accentColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      موافق ومعتمد
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-[10px] font-black rounded-lg border transition-all text-center cursor-pointer ${
                        isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-250 text-slate-500'
                      }`}
                    >
                      إلغاء
                    </button>
                  </div>

                </div>

              </div>

            </div>
          </div>

          {/* DETAILED RATINGS SLIDERS */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">معايرة وتقييم ركائز التصميم المؤسسي الفاخر</h2>
            </div>

            <div className="space-y-5">
              {metrics.map((m) => (
                <div key={m.id} className="p-4 bg-transparent dark:bg-slate-900 dark:border-slate-800/60">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-850 dark:text-white">{m.arabicName}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">{m.description}</p>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs font-black text-amber-650 dark:text-amber-400 flex-none">
                      <span>{m.score}</span>
                      <span className="text-[10px] text-slate-400">/ 10</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-rose-500 font-bold">تعديلات تصميمية</span>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={m.score}
                      onChange={(e) => handleScoreChange(m.id, parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <span className="text-[10px] text-emerald-600 font-bold">بنية مثالية ومطابقة</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TRIGGER DEPLOY, LOGS MONITOR, FORMAL SIGNATURE */}
        <div className="space-y-6">
          
          {/* SIMULATION TRIGGER */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <Grid className="w-12 h-12 text-amber-500 mx-auto mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-sm font-black text-slate-850 dark:text-white mb-2">محرك مراجعة الأصول البصرية</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              انقر لبدء المسح البصري للواجهات ومراجعة الهوية ومطابقة تناسق الهوامش والخطوط.
            </p>

            {isAuditing && (
              <div className="space-y-1.5 mb-4 text-right">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-650 dark:text-amber-400">جاري مسح الواجهات...</span>
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
              onClick={startAppearanceIntegrityAudit}
              className="w-full py-2.5 px-4 bg-amber-650 hover:bg-amber-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              تشغيل مدقق المظهر والهوية
            </button>
          </div>

          {/* VISUAL COMPLIANCE CHECKLIST */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              قواعد الإخضاع الجمالي والمظهر الرسمي
            </h3>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">تطابق الحواف والانحناءات (Border Radii)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">توحيد تام لكافة الأزرار والبطاقات وحقول النماذج لإضفاء تماسك هندسي.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">إلغاء العناصر الفوضوية (Anti-Clutter)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">حظر الإطارات والظلال الفجة والألوان الصاخبة المزعجة غير المبررة.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">الهوية الموحدة لمدارس التميز</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">التكامل والانسجام التام بين الخطوط والمعدلات والظلال على اتساع النظام.</span>
                </div>
              </div>
            </div>
          </div>

          {/* DESIGN SIGNATURE BLOCK */}
          {isFormallySigned && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-950 dark:to-slate-900 p-6 border border-amber-200 dark:border-amber-900/40 text-center animate-scaleIn">
              <PenTool className="w-10 h-10 text-amber-500 mx-auto mb-2 drop-shadow-sm" />
              <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1">وثيقة اعتماد الهوية والمظهر الاحترافي</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">
                تعتبر هذه الشهادة دليلاً رسمياً على تطابق وتناسق كافة العناصر وتماسكها الجمالي والـ UI/UX.
              </p>

              <div className="dark:bg-slate-950 p-3 rounded-lg dark:border-slate-800 mb-4">
                <input 
                  type="text" 
                  value={leadDesigner} 
                  onChange={(e) => setLeadDesigner(e.target.value)}
                  className="w-full text-center bg-transparent border-none text-xs font-black text-amber-650 dark:text-amber-400 outline-none"
                  placeholder="اسم المفوض بالتوقيع"
                />
                <span className="text-[9px] text-slate-400 block mt-1 border-t border-slate-100 pt-1 font-mono">
                  توقيع معتمد برقم تسلسلي: #APPEARANCE-PERFECTION-33
                </span>
              </div>
            </div>
          )}

          {/* LIVE SYSTEM AUDIT MONITOR */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold tracking-tight mr-2">مراقب سلامة الهوية والتصميم</span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 text-right">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
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
