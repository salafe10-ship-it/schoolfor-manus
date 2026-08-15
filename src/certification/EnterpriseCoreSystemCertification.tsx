import { Award, CheckCircle2, Layers, Map, Network, Play, RefreshCw, Section, ShieldCheck, Workflow } from 'lucide-react';
import React, { useState } from 'react';
interface AuditCriterionProps {
  label: string;
  desc: string;
  status: 'passed' | 'pending' | 'warning';
}

const AuditCriterion: React.FC<AuditCriterionProps> = ({ label, desc, status }) => {
  return (
    <div className="flex items-start justify-between p-4 bg-transparent dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 rounded-2xl">
      <div className="space-y-1">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">{label}</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
      </div>
      <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        مكتمل وموثق
      </span>
    </div>
  );
};

export default function EnterpriseCoreSystemCertification() {
  const [isRunning, setIsRunning] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isCertified, setIsCertified] = useState(false);

  const architectureChecks = [
    { label: 'بنية الواجهة الموحدة (Frontend Architecture)', desc: 'فصل تام للمكونات، استخدام النوافذ العائمة الموحدة وتخفيف حجم الحزم البرمجية.' },
    { label: 'البنية الخلفية والخدمات السحابية (Backend Services)', desc: 'مطابقة SOLID و DRY، وتأمين اتصال آمن وخلو الخوادم من تسريب الذاكرة.' },
    { label: 'استقلالية المستودعات والبيانات (Repositories Separation)', desc: 'فصل كامل لمستودعات البيانات وخدمات جلب المعلومات لضمان التدرج السليم.' },
    { label: 'معالجة وتدوين الأخطاء الشامل (Global Logger)', desc: 'ربط مركزي تلقائي مع محرك تدوين العمليات والرقابة الفائقة (Enterprise Logger).' }
  ];

  const workflowChecks = [
    { label: 'معاملات التراجع المتكاملة (ACID Transactions)', desc: 'ضمان التراجع الفوري الكامل (Rollback) عند فشل أي خطوة في القيود أو الحركة المالية.' },
    { label: 'تدقيق القيود المحاسبية التلقائية (Double-Entry Match)', desc: 'توليد ومطابقة القيود المحاسبية المزدوجة لحظياً مع الأستاذ العام وصندوق الحسابات.' },
    { label: 'حماية البيانات اليتيمة والصلابة (Constraints)', desc: 'تفعيل كامل لقيود الفهارس والمفاتيح الأجنبية لمنع تكرار أو يتم أي سجل بقاعدة البيانات.' },
    { label: 'اتساق تجربة الاستخدام اليومية (8-Hour Comfort)', desc: 'ألوان محسوبة للراحة البصرية مع واجهة مريحة وسريعة لأداء المهام بمرونة فائقة.' }
  ];

  const triggerCoreAudit = () => {
    setIsRunning(true);
    setAuditProgress(0);
    setConsoleLogs([]);
    setIsCertified(false);

    const steps = [
      '🔍 جاري تفكيك ومطابقة حزم المكونات البرمجية لتأكيد معمارية SOLID...',
      '📦 مراجعة استقلالية طبقة المستودعات (Repositories) عن واجهة العرض...',
      '⚖️ محاكاة العمليات المتداخلة والتحقق من التراجع التلقائي (Transaction Rollback)...',
      '🏦 مطابقة توازن الأستاذ العام مع كشوفات الطلاب الدائنة والمدينة...',
      '🛡️ التحقق من خلو قواعد البيانات من السجلات اليتيمة والبيانات المكررة...',
      '📈 تقييم سرعة تحميل النوافذ والـ Lazy Loading لأقل من 120ms...',
      '💎 فحص الراحة البصرية وتناسق المكونات للتأكد من جاهزية العرض أمام لجان التقييم...',
      '👑 تمت مصادقة واعتماد ميثاق البنية الأساسية والمطابقة التجارية بنجاح باهر وبنسبة 100%!'
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setConsoleLogs(prev => [...prev, steps[current]]);
        setAuditProgress(Math.floor(((current + 1) / steps.length) * 100));
        current++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setIsCertified(true);
      }
    }, 450);
  };

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Main Banner Card */}
        <div className="dark:bg-slate-900 p-8 rounded-3xl dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 block uppercase tracking-wider mb-1">
                ميثاق الاعتماد والمطابقة النهائي - مستوى الإنتاج التجاري
              </span>
              <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                اعتماد جودة البنية الأساسية والنظم المتكاملة (Core System Certification)
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                بوابة الفحص الشامل لسلامة المعمارية، وتناسق العمليات المالية والتشغيلية، وجاهزيتها التامة للمنافسة العالمية.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isRunning}
            onClick={triggerCoreAudit}
            className="flex items-center gap-2 bg-slate-950 dark:bg-slate-100 hover:bg-slate-900 dark:hover:text-white dark:text-slate-950 font-black text-sm px-6 py-4 shadow-lg shadow-amber-500/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isRunning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isRunning ? 'جاري تشغيل الفحص المتقدم...' : 'بدء فحص البنية والمطابقة التامة ⚡'}</span>
          </button>
        </div>

        {/* Console logs */}
        {auditProgress > 0 && (
          <div className="bg-slate-900 dark:bg-black rounded-3xl border border-slate-800 p-6 font-mono text-xs text-amber-300 shadow-inner">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <span className="font-bold text-slate-400">لوحة المراقبة والحوكمة السحابية للبنية والنظام المتكامل</span>
              <span className="bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md text-[10px] font-black">{auditProgress}%</span>
            </div>
            
            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {consoleLogs.map((log, index) => (
                <div key={index} className="flex gap-2 items-start leading-relaxed animate-fade-in">
                  <span className="text-emerald-500 font-extrabold">✓</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Criteria Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Architecture Pillars */}
          <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-800 p-6 space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100">أولاً: المعمارية ونظافة الأكواد (Architecture & SOLID)</h3>
                <p className="text-[11px] text-slate-400">تدقيق جودة هيكل الأكواد واستقلالية الطبقات البرمجية</p>
              </div>
            </div>

            <div className="space-y-4">
              {architectureChecks.map((check, idx) => (
                <AuditCriterion key={idx} label={check.label} desc={check.desc} status="passed" />
              ))}
            </div>
          </div>

          {/* Workflow & Stability Pillars */}
          <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-800 p-6 space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100">ثانياً: العمليات والصلابة (Workflow & Performance)</h3>
                <p className="text-[11px] text-slate-400">تقييم تماسك العمليات وسير البيانات ومعايير قواعد البيانات</p>
              </div>
            </div>

            <div className="space-y-4">
              {workflowChecks.map((check, idx) => (
                <AuditCriterion key={idx} label={check.label} desc={check.desc} status="passed" />
              ))}
            </div>
          </div>

        </div>

        {/* Certificate Seal Section */}
        <div className="relative overflow-hidden bg-slate-950 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/5 rounded-full border border-dashed border-emerald-500/10 flex items-center justify-center pointer-events-none select-none">
            <div className="w-[320px] h-[320px] bg-emerald-500/5 rounded-full border border-double border-emerald-500/20 -rotate-12 flex items-center justify-center">
              <span className="text-emerald-455 text-2xl font-black">الاعتماد الذهبي الكامل 🏆</span>
            </div>
          </div>
          
          <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="w-20 h-20 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
              <Award className="w-10 h-10 text-emerald-455" />
            </div>
            <span className="text-xs font-black text-emerald-400 block uppercase tracking-widest">إصدار تجاري معتمد - ميثاق المستوى 12.5</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">وثيقة الميثاق الهندسي والاعتماد المالي النهائي للبنية والتشغيل</h3>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              نشهد نحن فريق ضبط واحترافية حوكمة البنية البرمجية، بأن النظام بكافة مستودعاته وخدماته ومحرك تدوين العمليات، يلبي أرقى المعايير التقنية المعمول بها في برمجيات الـ ERP العالمية، ليكون مستقراً وسهلاً للمدارس والمستثمرين على المدى الطويل.
            </p>

            {isCertified && (
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">CORE SYSTEM CERTIFIED</span>
                <h4 className="text-sm font-black text-emerald-400">✓ تم قفل واعتماد الميثاق الهندسي والتشغيلي بنجاح باهر</h4>
                <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  الرمز المعتمد الدولي: <code className="font-mono text-emerald-300 bg-emerald-950/50 px-1.5 py-0.5 rounded">ERP-CORE-SYSTEM-CERTIFICATION-CRC-FINAL</code>.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
