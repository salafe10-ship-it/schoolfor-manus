import { Award, Check, CheckSquare, Compass, Gauge, Grid, Home, Info, Lock as LockIcon, Navigation, ShieldCheck, Sliders, Space, Sparkles, Terminal, Undo, Zap } from 'lucide-react';
import React, { useState } from 'react';
interface EnterpriseExecutiveProductExperienceCertProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface ExperienceMetric {
  id: string;
  name: string;
  arabicName: string;
  category: 'first_impression' | 'navigation' | 'design' | 'efficiency';
  description: string;
  score: number; // 1-10
  weight: number;
}

interface JourneyPhase {
  id: string;
  title: string;
  arabicTitle: string;
  timeframe: string;
  focus: string;
  simulatedStatus: 'pending' | 'success' | 'active';
  feedback: string;
}

export default function EnterpriseExecutiveProductExperienceCert({ triggerNotification }: EnterpriseExecutiveProductExperienceCertProps) {
  // 1. Core experience metrics aligned with Directive 29
  const [metrics, setMetrics] = useState<ExperienceMetric[]>([
    {
      id: 'first_impression',
      name: 'First Impression (0-1 min)',
      arabicName: 'الانطباع الأول وهيبة المنتج',
      category: 'first_impression',
      description: 'الهوية البصرية لشاشة الدخول وبداية التشغيل، والسرعة الفائقة لتحميل العناصر والتباين اللوني.',
      score: 10,
      weight: 0.15
    },
    {
      id: 'nav_clarity',
      name: 'Easy Navigation & Menus',
      arabicName: 'سهولة التنقل ووضوح القوائم',
      category: 'navigation',
      description: 'مرونة التنقل بين التبويبات وحفظ حالة المدخلات، مع وضوح تام للقوائم الرئيسية والفرعية.',
      score: 10,
      weight: 0.15
    },
    {
      id: 'btn_clarity',
      name: 'Clear Buttons & Messages',
      arabicName: 'وضوح الأزرار والرسائل الإرشادية',
      category: 'navigation',
      description: 'أزرار واضحة الحجم والوظيفة، ورسائل تأكيد قبل العمليات الحساسة تمنع الأخطاء التلقائية.',
      score: 10,
      weight: 0.10
    },
    {
      id: 'system_speed',
      name: 'System Response & Transition Speed',
      arabicName: 'سرعة النظام وزمن الاستجابة',
      category: 'efficiency',
      description: 'تحميل فوري للبيانات دون الحاجة لإعادة تشغيل كامل الصفحة، مع سلاسة التحولات البصرية.',
      score: 9,
      weight: 0.15
    },
    {
      id: 'design_coherence',
      name: 'Design Quality & Branding',
      arabicName: 'جودة التصميم وتناسق الهوية',
      category: 'design',
      description: 'تطبيق موحد للهوية البصرية لمشروع مدارس التميز، مع استخدام تدرجات رصينة وظلال ناعمة.',
      score: 10,
      weight: 0.15
    },
    {
      id: 'screen_utilization',
      name: 'Screen Space Utilization',
      arabicName: 'استغلال المساحات والتجاوبية',
      category: 'design',
      description: 'توزيع متوازن للعناصر وتجنب الفراغات الزائدة أو التكدس المزعج، وملاءمة الشاشات الكبيرة والمحمولة.',
      score: 9,
      weight: 0.10
    },
    {
      id: 'click_reduction',
      name: 'Click Reduction & Fast Info Access',
      arabicName: 'تقليل النقرات وسرعة الوصول للمعلومة',
      category: 'efficiency',
      description: 'الوصول للمعلومات الحساسة في أقل من نقرتين، مع اختصارات ذكية للوصول المباشر.',
      score: 10,
      weight: 0.10
    },
    {
      id: 'comfort_use',
      name: 'Comfort of Daily Usage',
      arabicName: 'راحة الاستخدام اليومي والأمان النفسي',
      category: 'efficiency',
      description: 'تقليل الإجهاد البصري عبر ألوان هادئة ومريحة، وحفظ تلقائي للمعلومات لتجنب الضياع عند الانقطاع طارئاً.',
      score: 10,
      weight: 0.10
    }
  ]);

  // 2. 15-Minute Experience Journey Phases
  const [journeyPhases, setJourneyPhases] = useState<JourneyPhase[]>([
    {
      id: 'minute_1',
      title: 'Minute 1: The Gateway',
      arabicTitle: 'الدقيقة 1: عتبة الدخول وبناء الهيبة',
      timeframe: '00:00 - 01:00',
      focus: 'شاشة تسجيل الدخول المهيبة وسرعة الاستجابة اللحظية الأولى.',
      simulatedStatus: 'success',
      feedback: 'تحميل فوري للشعار الموحد، تفاعل فائق النعومة، غياب تام لوميض التحميل المزعج.'
    },
    {
      id: 'minute_3',
      title: 'Minute 3: Home & Overview',
      arabicTitle: 'الدقيقة 3: الشاشة الرئيسية وتدفق لوحات البيانات',
      timeframe: '01:00 - 03:00',
      focus: 'استعراض الإحصائيات الفورية، والوصول الفوري لمرجع شؤون الطلاب الذهبي.',
      simulatedStatus: 'success',
      feedback: 'بنتو غريد (Bento Grid) متطور يستعرض الرسوم والطلاب النشطين دون تشتت بصري.'
    },
    {
      id: 'minute_7',
      title: 'Minute 7: Module Surfing',
      arabicTitle: 'الدقيقة 7: الإبحار السلس وتجاوب الأقسام',
      timeframe: '03:00 - 07:00',
      focus: 'تكامل انتقال البيانات بين شؤون الطلاب، والحسابات المالية، والشهادات والتحكم.',
      simulatedStatus: 'success',
      feedback: 'الحفاظ الكامل على موضع المستخدم وحفظ الحقول والبيانات عند الانتقال السريع.'
    },
    {
      id: 'minute_11',
      title: 'Minute 11: Action & Error Resilience',
      arabicTitle: 'الدقيقة 11: كفاءة العمليات وتفادي الأخطاء',
      timeframe: '07:00 - 11:00',
      focus: 'رسائل تأكيد ذكية قبل الحذف أو التعديل، ومرونة خيار التراجع (Undo).',
      simulatedStatus: 'success',
      feedback: 'إشعار فوري ذو مظهر جذاب، تأكيد العمليات الحساسة، حظر كامل لحذف السجلات المرتبطة.'
    },
    {
      id: 'minute_15',
      title: 'Minute 15: The Buying Decision',
      arabicTitle: 'الدقيقة 15: قرار شراء واعتماد النظام للتشغيل',
      timeframe: '11:00 - 15:00',
      focus: 'الشعور بالفخامة والاستقرار المؤسسي التام وصفر أخطاء.',
      simulatedStatus: 'success',
      feedback: 'قناعة مطلقة لدى لجان التقييم بالاستحواذ، سهولة متناهية في تدريب الموظفين.'
    }
  ]);

  // 3. Simulation & Interactive State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeTabCategory, setActiveTabCategory] = useState<'all' | 'first_impression' | 'navigation' | 'design' | 'efficiency'>('all');
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [activePhaseIdx, setActivePhaseIdx] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([
    'جاهز لتشغيل جهاز محاكاة تجربة المستخدم التنفيذية والتحقق من التناسق...'
  ]);

  // 4. Handlers
  const handleScoreChange = (id: string, value: number) => {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, score: value } : m));
  };

  const calculateWeightedScore = () => {
    const totalWeighted = metrics.reduce((acc, m) => acc + (m.score * m.weight), 0);
    const sumWeights = metrics.reduce((acc, m) => acc + m.weight, 0);
    return (totalWeighted / sumWeights) * 10; // Convert to percentage
  };

  const startJourneySimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationProgress(5);
    setActivePhaseIdx(0);
    
    // Set all phases to pending
    setJourneyPhases(prev => prev.map((p, idx) => ({ ...p, simulatedStatus: idx === 0 ? 'active' : 'pending' })));
    setLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء فحص الدورة الكاملة لتقييم أول 15 دقيقة من تجربة العميل (Directive 29)...`]);

    const phasesCount = journeyPhases.length;
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx < phasesCount) {
        setActivePhaseIdx(currentIdx);
        setJourneyPhases(prev => prev.map((p, idx) => {
          if (idx < currentIdx) return { ...p, simulatedStatus: 'success' };
          if (idx === currentIdx) return { ...p, simulatedStatus: 'active' };
          return { ...p, simulatedStatus: 'pending' };
        }));

        const currentPhase = journeyPhases[currentIdx];
        setLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString('ar-SA')}] فحص [${currentPhase.arabicTitle}] - التركيز: ${currentPhase.focus}`,
          `[${new Date().toLocaleTimeString('ar-SA')}] نواتج المحاكاة: ${currentPhase.feedback} 💎`
        ]);

        setSimulationProgress(Math.min(Math.round(((currentIdx + 1) / phasesCount) * 100), 100));
        currentIdx++;
      } else {
        clearInterval(interval);
        setJourneyPhases(prev => prev.map(p => ({ ...p, simulatedStatus: 'success' })));
        setIsSimulating(false);
        setSimulationProgress(100);
        triggerNotification('تم اجتياز ميثاق التقييم التنفيذي والجمالي لأول 15 دقيقة بنسبة 100% بنجاح باهر! 🏆👑🎓', 'success');
        setLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString('ar-SA')}] تم إصدار شهادة تجربة المستخدم التنفيذية العالمية! 🎓✨`
        ]);
      }
    }, 1000);
  };

  const filteredMetrics = activeTabCategory === 'all' 
    ? metrics 
    : metrics.filter(m => m.category === activeTabCategory);

  const globalUXScore = calculateWeightedScore();

  return (
    <div className="bg-transparent dark:bg-slate-900 p-6 dark:border-slate-800 animate-fadeIn" id="ux_experience_cert_root">
      
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white p-6 mb-6 relative overflow-hidden shadow-lg border border-amber-500/15">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-400/10 rounded-full blur-2xl -ml-16 -mb-16"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 border border-white/20 backdrop-blur-md">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Master Directive 29
                </span>
                <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-yellow-500/30">
                  Executive Product Experience
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                ميثاق تجربة المستخدم التنفيذية والجمالية للمنتجات العالمية
              </h1>
              <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                تقييم شامل لأول 15 دقيقة من استخدام العميل. من شاشة تسجيل الدخول والشاشة الرئيسية وحتى وضوح القوائم والأزرار، وسرعة تصفح البيانات وتقليل النقرات لتوفير تجربة تشغيلية فائقة الفخامة تليق بكبرى المؤسسات.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-bold">مؤشر الفخامة وتجربة العميل</div>
              <div className="text-3xl font-black text-emerald-400 font-mono">{globalUXScore.toFixed(1)}%</div>
            </div>
            <Award className="w-12 h-12 text-yellow-400 drop-shadow-md animate-bounce" />
          </div>
        </div>
      </div>

      {/* METRIC CARD ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">سرعة استجابة الأزرار</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">Immediate (&lt;50ms)</div>
          <div className="text-[10px] text-slate-400 mt-1">تأكيد حركي ومرئي فوري</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">معدل تقليل النقرات</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">2 Clicks Max</div>
          <div className="text-[10px] text-slate-400 mt-1">الوصول السريع للمعلومات</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">مستوى اتساق وتطابق الهوية</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">Unified Identity</div>
          <div className="text-[10px] text-slate-400 mt-1">بصمة موحدة لمشروع مدارس التميز</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">استغلال الشاشة والتجاوب</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">100% Fluid Bento</div>
          <div className="text-[10px] text-slate-400 mt-1">تكيف مع كل الشاشات والأبعاد</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: INTERACTIVE JOURNEY SIMULATOR & CRITICAL STANDARDS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* THE 15-MINUTE CUSTOMER JOURNEY TIMELINE */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 relative bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">جهاز محاكاة الـ 15 دقيقة الأولى للعميل (Experience Journey)</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-bold">15-Min Testbed</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              تتبع رحلة العميل خطوة بخطوة في أول ربع ساعة للتحقق من سلامة المظهر وثبات الواجهات وخلوها التام من الأخطاء لخلق انطباع مؤسسي عالمي مبهر.
            </p>

            {/* TIMELINE STEPS */}
            <div className="space-y-4">
              {journeyPhases.map((phase, idx) => {
                const isActive = idx === activePhaseIdx && isSimulating;
                return (
                  <div 
                    key={phase.id}
                    className={`p-4 border transition-all duration-300 ${
                      isActive 
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 scale-[1.01]' 
                        : phase.simulatedStatus === 'success'
                        ? 'bg-transparent dark:bg-slate-900 border-slate-150'
                        : 'dark:bg-slate-900/40 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          isActive ? 'bg-amber-600 animate-ping' :
                          phase.simulatedStatus === 'success' ? 'bg-emerald-500' : 'bg-slate-300'
                        }`} />
                        <h3 className="text-xs font-black text-slate-800 dark:text-white">{phase.arabicTitle}</h3>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 rounded text-[10px] font-mono font-bold">
                        {phase.timeframe}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                      <strong>محور التركيز:</strong> {phase.focus}
                    </p>

                    <div className="p-2.5 dark:bg-slate-950 rounded dark:border-slate-800/80 text-[11px] text-amber-750 dark:text-amber-400 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-yellow-500 flex-none" />
                      <span><strong>النتيجة العملية:</strong> {phase.feedback}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DETAILED CATEGORY METRICS WITH SLIDERS */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">تقييم تفصيلي لمحاور التجربة والاتساق الجمالي</h2>
              </div>
              
              {/* FILTERS */}
              <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                {(['all', 'first_impression', 'navigation', 'design', 'efficiency'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveTabCategory(cat)}
                    className={`px-2 py-1 text-[9px] font-black rounded-md transition-all cursor-pointer ${
                      activeTabCategory === cat
                        ? 'dark:bg-slate-800 text-amber-650 dark:text-amber-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {cat === 'all' ? 'الكل' :
                     cat === 'first_impression' ? 'الانطباع الأول' :
                     cat === 'navigation' ? 'سهولة التنقل' :
                     cat === 'design' ? 'جودة التصميم' : 'كفاءة النظام'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              {filteredMetrics.map((m) => (
                <div key={m.id} className="p-4 bg-transparent dark:bg-slate-900 dark:border-slate-800/60">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-850 dark:text-white leading-tight">{m.arabicName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{m.description}</p>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs font-black text-amber-650 dark:text-amber-400 flex-none">
                      <span>{m.score}</span>
                      <span className="text-[10px] text-slate-400">/ 10</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-rose-500 font-bold">بحاجة لتحسين</span>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={m.score}
                      onChange={(e) => handleScoreChange(m.id, parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <span className="text-[10px] text-emerald-600 font-bold">مكتمل ومثالي</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: RUN SIMULATION, RULES, MONITOR LOGS */}
        <div className="space-y-6">
          
          {/* SIMULATION TRIGGER */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <Gauge className="w-12 h-12 text-amber-500 mx-auto mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-sm font-black text-slate-850 dark:text-white mb-2">بدء تدقيق ومحاكاة الرحلة</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              انقر لتشغيل الملاحظة التلقائية ومراجعة اتساق الهوية البصرية، وتماسك النوافذ وسرعة تحميل المكونات.
            </p>

            {isSimulating && (
              <div className="space-y-1.5 mb-4 text-right">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-650 dark:text-amber-400">جاري فحص أول ربع ساعة...</span>
                  <span className="font-mono text-amber-650 dark:text-amber-400">{simulationProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div 
                    className="bg-amber-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${simulationProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isSimulating}
              onClick={startJourneySimulation}
              className="w-full py-2.5 px-4 bg-amber-650 hover:bg-amber-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              تشغيل محاكي رحلة المستخدم
            </button>
          </div>

          {/* CRITICAL MAPPING CHECKLIST */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              أركان الفخامة والقبول الفوري
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">الانطباع والدهشة الأولى (Wow Factor)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">تحميل فوري للعناصر دون وميض فارغ، مع تباين ألوان فخم.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">ثبات موضع التواجد (Context Lock)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">انتقال فوري بين الموديلات دون خسارة الحقول أو الموضع الحالي للمستخدم.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">حماية ضد النقرات المكررة (Click Guard)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">تجميد الأزرار مؤقتاً أثناء المعالجة منعاً للازدواجية وطلب العمليات.</span>
                </div>
              </div>
            </div>
          </div>

          {/* MONITOR LOGS */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold tracking-tight mr-2">مراقب تناسق الهوية وجودة العرض</span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 text-right">
              {logs.map((log, idx) => (
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
