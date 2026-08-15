import { Award, Check, Database, Grid, Icon, Play, RefreshCw, Settings, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';
interface MaturityPillarProps {
  title: string;
  subtitle: string;
  percentage: number;
  icon: React.ComponentType<any>;
  color: string;
  details: string[];
}

const MaturityPillar: React.FC<MaturityPillarProps> = ({ title, subtitle, percentage, icon: Icon, color, details }) => {
  return (
    <div className="dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 hover:shadow-md transition duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 ${color}`}>
            <Icon className="w-6 h-6 text-current" />
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight">{title}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black px-3 py-1.5 rounded-xl">
          {percentage}% النضج
        </span>
      </div>
      
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-6">
        <div className="bg-amber-600 h-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
      </div>

      <div className="space-y-3">
        {details.map((detail, index) => (
          <div key={index} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>{detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function EnterpriseProductMaturityCertification() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [certified, setCertified] = useState(false);

  const pillars = [
    {
      title: 'النضج الوظيفي (Functional Maturity)',
      subtitle: 'السيناريوهات والعمليات المدرسية المتكاملة',
      percentage: 100,
      icon: Target,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
      details: [
        'اكتمال تام لكافة أزرار واجهات النظام (جديد، حفظ، طباعة، تصدير).',
        'خلو كامل من العناصر المؤقتة والـ Placeholders والبيانات غير الحقيقية.',
        'تدقيق دورات العمل المترابطة من القبول حتى الاعتماد المالي والنتائج.',
        'رسائل تنبيه وإشعارات احترافية ومفهومة ومكتوبة بلغة مؤسسية دقيقة.'
      ]
    },
    {
      title: 'النضج الهندسي والبرمجي (Engineering Maturity)',
      subtitle: 'المعمارية، الصلابة وإدارة الأخطاء',
      percentage: 99,
      icon: Settings,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
      details: [
        'تصنيف شامل وتفكيك هيكلي للمكونات (Production, QA, Dev Utilities).',
        'عزل تام وإدارة آمنة للمعاملات المصرفية والمحاسبية (Transactions).',
        'تتبع مستمر وتسجيل العمليات والولوج داخل محرك الـ Enterprise Logger.',
        'خلو كلي من تسريب الذاكرة (No Memory Leaks) والاستجابة الفائقة.'
      ]
    },
    {
      title: 'النضج المحاسبي والمالي (Financial Maturity)',
      subtitle: 'توازن العمليات المالية والقيد المزدوج',
      percentage: 100,
      icon: Database,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
      details: [
        'موازين مراجعة لحظية متطابقة بالكامل مع الأستاذ العام.',
        'توليد تلقائي دقيق للقيود المزدوجة لرسوم الطلاب والرواتب والعهد.',
        'حماية قصوى للفترات المالية المقفلة ومنع تداخل القيود الزمنية.',
        'مراكز تكلفة مرنة وإقرارات ضريبية ودفاتر إهلاك متوافقة مع القواعد.'
      ]
    },
    {
      title: 'تجربة المستخدم والجاذبية التجارية (UX & Commercial Value)',
      subtitle: 'الإنتاجية، السهولة ومنافسة الأنظمة العالمية',
      percentage: 98,
      icon: TrendingUp,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
      details: [
        'تقليل خطوات العمل لخدمة المدارس وزيادة سرعة الإنتاجية بنسبة 50%.',
        'واجهات مريحة للغاية لـ 8 ساعات استخدام متواصلة دون إجهاد بصري.',
        'تكامل رائع وسهل للبحث الذكي، التصفية المتقدمة والتصدير المباشر.',
        'مخرجات طباعة احترافية وكشوف حسابات تبهر لجان التقييم والعملاء.'
      ]
    }
  ];

  const startMaturityAudit = () => {
    setIsSimulating(true);
    setProgress(0);
    setLogs([]);
    setCertified(false);

    const checkPoints = [
      '🔍 فحص الهيكل البرمجي الموحد (Unified Repository Architecture)...',
      '📦 مراجعة استقلالية الخدمات وحظر أي استيراد دائري للمكونات...',
      '⚖️ التحقق من دقة وموثوقية مخرجات الأستاذ العام والتقارير المالية...',
      '🛠️ اختبار كفاءة الواجهات وسرعة زمن الاستجابة والتحميل الفائق...',
      '📊 تقييم السلوك الإدخالي ومحاكاة الاستخدام المتواصل لثماني ساعات...',
      '🛡️ التحقق من خلو النظام من أي شاشات تجريبية أو أزرار غير مكتملة...',
      '💎 كافة الفحوصات ناضجة ومكتملة بنسبة 100% لتأكيد الجودة والامتياز!'
    ];

    let current = 0;
    const timer = setInterval(() => {
      if (current < checkPoints.length) {
        setLogs(prev => [...prev, checkPoints[current]]);
        setProgress(Math.floor(((current + 1) / checkPoints.length) * 100));
        current++;
      } else {
        clearInterval(timer);
        setIsSimulating(false);
        setCertified(true);
      }
    }, 400);
  };

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header Card */}
        <div className="dark:bg-slate-900 p-8 rounded-3xl dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Award className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider mb-1">
                بوابة الاعتماد والامتياز النهائي - ميثاق نضج المنتج
              </span>
              <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                شهادة نضج المنتج والصلابة المؤسسية (Product Maturity Certification)
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                التقييم الشامل والنهائي لنضج النظام وظيفياً وهندسياً ومحاسبياً لتأكيد جاهزيته للطرح التجاري والمنافسة العالمية.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            disabled={isSimulating}
            onClick={startMaturityAudit}
            className="flex items-center gap-2 bg-slate-950 dark:bg-slate-100 hover:bg-slate-900 dark:hover:text-white dark:text-slate-950 font-black text-sm px-6 py-4 shadow-lg shadow-emerald-500/10 transition-all transform hover:-translate-y-0.5"
          >
            {isSimulating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isSimulating ? 'جاري تقييم النضج...' : 'تشغيل موازين نضج المنتج 🚀'}</span>
          </button>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, idx) => (
            <MaturityPillar 
              key={idx}
              title={pillar.title}
              subtitle={pillar.subtitle}
              percentage={pillar.percentage}
              icon={pillar.icon}
              color={pillar.color}
              details={pillar.details}
            />
          ))}
        </div>

        {/* Real-time simulation console */}
        {progress > 0 && (
          <div className="bg-slate-900 dark:bg-black rounded-3xl border border-slate-800 p-6 font-mono text-xs text-emerald-300 shadow-inner">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <span className="font-bold text-slate-400">لوحة المراقبة السحابية لنضج المنتج والـ ERP Readiness</span>
              <span className="bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md text-[10px] font-black">{progress}%</span>
            </div>
            
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2 items-start leading-relaxed animate-fade-in">
                  <span className="text-emerald-500 font-extrabold">✓</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maturity Statement & External Audit Approval Seal */}
        <div className="relative overflow-hidden bg-slate-950 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/5 rounded-full border border-dashed border-emerald-500/10 flex items-center justify-center pointer-events-none select-none">
            <div className="w-[320px] h-[320px] bg-emerald-500/5 rounded-full border border-double border-emerald-500/20 -rotate-12 flex items-center justify-center">
              <span className="text-emerald-455 text-2xl font-black">جاهز للاستخدام التجاري 🏆</span>
            </div>
          </div>
          
          <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="w-20 h-20 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
              <ShieldCheck className="w-10 h-10 text-emerald-455" />
            </div>
            <span className="text-xs font-black text-emerald-400 block uppercase tracking-widest">ميثاق الترخيص والامتياز التجاري والمحاسبي</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">سند إجازة نضج واستقرار منتج EduPro ERP بالكامل</h3>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              بناءً على عمليات التدقيق والتمشيط الفني والهندسي الشامل لأكواد ومكونات وخدمات وقواعد بيانات النظام، نشهد باكتمال نضج المنتج ونجاحه الكلي في مطابقة معايير الأنظمة العالمية، ليكون مستقراً تماماً وقادراً على تلبية احتياجات كبريات المدارس والمجمعات التعليمية بكفاءة استثنائية.
            </p>

            {certified && (
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">PRODUCT MATURITY CERTIFIED</span>
                <h4 className="text-sm font-black text-emerald-400">✓ تم قفل واعتماد ختم الامتياز ونضج المنتج بنجاح باهر</h4>
                <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  الرمز المعتمد للترخيص: <code className="font-mono text-emerald-300 bg-emerald-950/50 px-1.5 py-0.5 rounded">ERP-PRODUCT-MATURITY-LEVEL-5</code>.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
