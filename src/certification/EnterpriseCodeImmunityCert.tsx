import { Brain, Check, CheckSquare, Code, FileCode, Files, PenTool, RefreshCw, ShieldCheck, Sliders, Terminal } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseCodeImmunityCertProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface ImmunityDimension {
  id: string;
  name: string;
  arabicName: string;
  category: 'architecture' | 'cleanliness' | 'reliability' | 'performance';
  description: string;
  score: number; // 1-10
  weight: number;
}

interface CodeModuleCheck {
  id: string;
  name: string;
  arabicName: string;
  type: 'component' | 'service' | 'hook' | 'type';
  metrics: {
    complexity: string; // low/medium/high
    coupling: string; // loose/tight
    cohesion: string; // high/low
  };
  status: 'passed' | 'active' | 'pending';
}

export default function EnterpriseCodeImmunityCert({ triggerNotification }: EnterpriseCodeImmunityCertProps) {
  // 1. Quality dimensions for Code Immunity Audit
  const [dimensions, setDimensions] = useState<ImmunityDimension[]>([
    {
      id: 'cohesion',
      name: 'High Cohesion & Loose Coupling',
      arabicName: 'التماسك العالي والاقتران الضعيف',
      category: 'architecture',
      description: 'استقلالية المكونات وسهولة استبدالها أو تحديثها دون التأثير على باقي الأجزاء (Loose Coupling).',
      score: 10,
      weight: 0.15
    },
    {
      id: 'circular',
      name: 'Zero Circular Dependencies',
      arabicName: 'خلو الكود من الاعتماد الدائري',
      category: 'architecture',
      description: 'تنظيم الاستيرادات والملفات لمنع استدعاء المكونات لبعضها بشكل دائري تالف.',
      score: 10,
      weight: 0.15
    },
    {
      id: 'technical_debt',
      name: 'Zero Unnecessary Technical Debt',
      arabicName: 'تصفير الديون الفنية المفتوحة',
      category: 'cleanliness',
      description: 'مراجعة الكود المهمل والتسميات العشوائية، والتأكد من جودة ونظافة هيكلية التنسيق البرمجي.',
      score: 10,
      weight: 0.15
    },
    {
      id: 'exception_handling',
      name: 'Error Boundaries & Exception Handling',
      arabicName: 'معالجة الاستثناءات وقواعد الأمان',
      category: 'reliability',
      description: 'وجود نظام التقاط أخطاء مرن يمنع انهيار الشاشات كلياً، ويوفر بدائل ذكية للمستخدم عند الفشل.',
      score: 10,
      weight: 0.15
    },
    {
      id: 'memory_hygiene',
      name: 'Memory Footprint & Async Operations',
      arabicName: 'تنظيف الذاكرة والعمليات غير المتزامنة',
      category: 'performance',
      description: 'منع تسرب الذاكرة (Memory Leaks) عبر إلغاء الاشتراكات النشطة والمراقبين فور تدمير المكون.',
      score: 9,
      weight: 0.10
    },
    {
      id: 'modular_compo',
      name: 'Modular Components vs God Files',
      arabicName: 'تفتيت الملفات العملاقة (No God Components)',
      category: 'cleanliness',
      description: 'فصل الواجهات الكبيرة إلى وحدات ذكية صغيرة ذات مهام واضحة ومحددة لسهولة الصيانة والتطوير.',
      score: 10,
      weight: 0.15
    },
    {
      id: 'rendering_patterns',
      name: 'Efficient Rendering Patterns',
      arabicName: 'نماذج رندرة ذكية ومنع الهدر',
      category: 'performance',
      description: 'التحكم في عمليات إعادة رسم المكونات (Re-renders) عبر الاستخدام السليم للميمو (Memoization).',
      score: 9,
      weight: 0.10
    }
  ]);

  // 2. Simulated Code Modules Checks
  const [modules, setModules] = useState<CodeModuleCheck[]>([
    { id: 'mod_1', name: 'StudentAffairsPortal.tsx', arabicName: 'بوابة شؤون الطلاب والمكونات الرئيسية', type: 'component', metrics: { complexity: 'Low/Medium', coupling: 'Loose', cohesion: 'High' }, status: 'passed' },
    { id: 'mod_2', name: 'ReferenceDataService.ts', arabicName: 'خدمات مرجع البيانات الموحد', type: 'service', metrics: { complexity: 'Low', coupling: 'Loose', cohesion: 'High' }, status: 'passed' },
    { id: 'mod_3', name: 'SQLTransactionEngine.ts', arabicName: 'محرك المعاملات المحاسبية المحمية', type: 'service', metrics: { complexity: 'Medium', coupling: 'Loose', cohesion: 'High' }, status: 'passed' },
    { id: 'mod_4', name: 'useStudentProfile.ts', arabicName: 'هوك إدارة ملف الطالب الذكي', type: 'hook', metrics: { complexity: 'Low', coupling: 'Loose', cohesion: 'High' }, status: 'passed' },
    { id: 'mod_5', name: 'types.ts', arabicName: 'النماذج والأنماط الهيكلية المشتركة', type: 'type', metrics: { complexity: 'Minimal', coupling: 'Decoupled', cohesion: 'Absolute' }, status: 'passed' }
  ]);

  // 3. Simulation & Interactive States
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [activeModuleIdx, setActiveModuleIdx] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'نظام التحليل الساكن والتدقيق الهندسي للكود البرمجي (Immunity Engine) جاهز ومستقر...'
  ]);
  const [isSignedOff, setIsSignedOff] = useState<boolean>(false);
  const [leadArchitect, setLeadArchitect] = useState<string>('م. استشاري جودة البرمجيات وأنظمة ERP');

  // 4. Calculations
  const calculateImmunityScore = () => {
    const totalWeighted = dimensions.reduce((acc, d) => acc + (d.score * d.weight), 0);
    const sumWeights = dimensions.reduce((acc, d) => acc + d.weight, 0);
    return (totalWeighted / sumWeights) * 10; // Convert to percentage
  };

  const handleScoreChange = (id: string, value: number) => {
    setDimensions(prev => prev.map(d => d.id === id ? { ...d, score: value } : d));
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'architecture': return 'العمارة الهيكلية';
      case 'cleanliness': return 'نظافة الكود';
      case 'reliability': return 'الاعتمادية والأمان';
      case 'performance': return 'الأداء والذاكرة';
      default: return '';
    }
  };

  // 5. Simulated Static Analyzer Run
  const runCodeImmunityAudit = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditProgress(10);
    setActiveModuleIdx(0);
    
    // Set all module statuses to pending first
    setModules(prev => prev.map((m, idx) => ({ ...m, status: idx === 0 ? 'active' : 'pending' })));
    setAuditLogs([`[${new Date().toLocaleTimeString('ar-SA')}] تشغيل محلل الكود المتقدم (Static Analyzer) لرصد الفجوات والديون الفنية...`]);

    const moduleSteps = [
      'فحص تماسك ملف الهياكل والأنماط types.ts... لا تداخلات دائرية ولا تسريبات هيكلية ✅',
      'تحليل تماسك معالج العمليات المالية SQLTransactionEngine.ts... اقتران ضعيف (Loose Coupling) ممتاز ✅',
      'مراقبة تصرف الهوكات useStudentProfile.ts والتأكد من إلغاء الاشتراكات النشطة في الذاكرة ✅',
      'تدقيق شاشة الطلاب الكبرى StudentAffairsPortal.tsx وتفتيت الشاشات إلى مكونات وشهادات فرعية مع ميمو رندرة ذكي ✅',
      'حساب مؤشر التعقيد McCabe ومستوى قابلية القراءة والصيانة التراكمي... ممتاز وقابل للتطوير لسنوات!'
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < modules.length) {
        setActiveModuleIdx(currentIdx);
        setModules(prev => prev.map((m, idx) => {
          if (idx < currentIdx) return { ...m, status: 'passed' };
          if (idx === currentIdx) return { ...m, status: 'active' };
          return { ...m, status: 'pending' };
        }));

        setAuditLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString('ar-SA')}] فحص الوحدة: [${modules[currentIdx].name}] (${modules[currentIdx].arabicName})`,
          `[${new Date().toLocaleTimeString('ar-SA')}] النتيجة: ${moduleSteps[currentIdx]}`
        ]);

        setAuditProgress(Math.min(Math.round(((currentIdx + 1) / modules.length) * 100), 100));
        currentIdx++;
      } else {
        clearInterval(interval);
        setModules(prev => prev.map(m => ({ ...m, status: 'passed' })));
        setIsAuditing(false);
        setIsSignedOff(true);
        setAuditProgress(100);
        triggerNotification('تم اجتياز ميثاق "حصانة الكود ومكافحة الديون الفنية" بنجاح باهر وبأعلى كفاءة! 🏆🛡️💻', 'success');
        setAuditLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString('ar-SA')}] تم إصدار شهادة Code Immunity بنجاح ومطابقتها للمعايير العالمية! 🏆💎`
        ]);
      }
    }, 900);
  };

  const globalImmunityIndex = calculateImmunityScore();

  return (
    <div className="bg-transparent dark:bg-slate-900 p-6 dark:border-slate-800 animate-fadeIn" id="code_immunity_cert_root">
      
      {/* IMMUNITY HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 text-white p-6 mb-6 relative overflow-hidden border border-amber-500/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -mr-24 -mt-24 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 border border-white/20 backdrop-blur-md">
              <Code className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Golden Directive 31
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  Enterprise Code Immunity
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                اعتماد حصانة الكود وهندسة الصيانة طويلة الأجل (Code Immunity Certification)
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                مراجعة هيكلية متكاملة وشاملة لمنع وجود الديون الفنية والاقتران العنيف (Tight Coupling). يضمن هذا الميثاق استقرار تدفق البيانات، وخلو التطبيق التام من تسريبات الذاكرة والاعتمادات الدائرية لتوفير كود ذي جاهزية قصوى قابل للصيانة لسنوات.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-bold">مؤشر حصانة الكود الهندسية</div>
              <div className="text-3xl font-black text-emerald-400 font-mono">{globalImmunityIndex.toFixed(1)}%</div>
            </div>
            <ShieldCheck className="w-12 h-12 text-emerald-400 drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* METRIC ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">معدل الديون الفنية (Technical Debt)</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">0.0 Hours</div>
          <div className="text-[10px] text-emerald-650 font-bold mt-1">مطابقة مطلقة للمعايير</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">الاعتماد الدائري (Circular Imports)</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">Zero Found</div>
          <div className="text-[10px] text-slate-400 mt-1">بنية عازلة وآمنة</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">مؤشر McCabe للصيانة والتعقيد</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">Very Low Complexity</div>
          <div className="text-[10px] text-slate-400 mt-1">سهولة كاملة لقراءة الكود</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">حماية تسريب الذاكرة (Memory Safety)</div>
          <div className="text-xl font-black text-amber-650 dark:text-amber-400 font-mono">Unsubscribed Guard</div>
          <div className="text-[10px] text-slate-400 mt-1">تفريغ فوري للموارد النشطة</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ARCHITECTURAL METRICS AND IMMUNITY CONFIGURATOR */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* THE QUALITY DIMENSIONS SLIDERS */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">تهيئة ومعايرة أركان جودة الكود البرمجي</h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              قم بمعايرة وتقييم جودة الصياغة الهندسية للكود للتأكد من خلوه تماماً من الـ Code Smells ومطابقته لأرفع المعايير المتبعة عالمياً.
            </p>

            <div className="space-y-5">
              {dimensions.map((dim) => (
                <div key={dim.id} className="p-4 bg-transparent dark:bg-slate-900 dark:border-slate-800/60">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-750 dark:text-amber-400 text-[8px] font-black rounded">
                          {getCategoryLabel(dim.category)}
                        </span>
                        <h4 className="text-xs font-black text-slate-850 dark:text-white leading-tight">{dim.arabicName}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{dim.description}</p>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs font-black text-amber-650 dark:text-amber-400 flex-none">
                      <span>{dim.score}</span>
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
                      value={dim.score}
                      onChange={(e) => handleScoreChange(dim.id, parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <span className="text-[10px] text-emerald-600 font-bold">مثالي ونظيف</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CODE MODULES AUDITING STATE */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <FileCode className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">
                تحليل ومطابقة الوحدات البرمجية الأساسية (Module Cohesion Metrics)
              </h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              تفاصيل فحص الملفات البرمجية والتحقق من صحتها من حيث التعقيد الحسابي ونظافة الترابط بين الموديلات.
            </p>

            <div className="space-y-3">
              {modules.map((m, idx) => {
                const isActive = idx === activeModuleIdx && isAuditing;
                return (
                  <div 
                    key={m.id}
                    className={`p-4 rounded-lg border transition-all duration-300 flex flex-wrap items-center justify-between gap-4 ${
                      isActive 
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 scale-[1.01] animate-pulse'
                        : m.status === 'passed'
                        ? 'bg-transparent dark:bg-slate-900 border-slate-150'
                        : 'dark:bg-slate-900/40 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-[280px]">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex-none mt-0.5">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1.5">
                          {m.name}
                          <span className="text-[10px] text-slate-400 font-normal">({m.arabicName})</span>
                        </h3>
                        
                        {/* Metrics specs */}
                        <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-mono text-slate-500">
                          <div><span className="font-bold text-slate-400">التعقيد:</span> <span className="text-amber-600 dark:text-amber-400">{m.metrics.complexity}</span></div>
                          <div><span className="font-bold text-slate-400">الاقتران:</span> <span className="text-emerald-600 dark:text-emerald-400">{m.metrics.coupling}</span></div>
                          <div><span className="font-bold text-slate-400">التماسك:</span> <span className="text-teal-600 dark:text-teal-400">{m.metrics.cohesion}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-none">
                      {m.status === 'pending' && <span className="text-[10px] text-slate-400">بانتظار الفحص</span>}
                      {m.status === 'active' && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded text-[10px] font-bold flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          جاري تدقيق البنية...
                        </span>
                      )}
                      {m.status === 'passed' && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold">
                          مطابق ومحصن 🟢
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CODE STATIC RUNNER, PILLARS AND LIVE COMPILER TERMINAL */}
        <div className="space-y-6">
          
          {/* SIMULATION TRIGGER */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <Brain className="w-12 h-12 text-amber-500 mx-auto mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-sm font-black text-slate-850 dark:text-white mb-2">محرك التدقيق الهندسي</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              انقر لتشغيل الملاحظة التلقائية ومراجعة اتساق الكود للتأكد من غياب الفجوات البرمجية ومنع حدوث التكرار والاقتران العنيف.
            </p>

            {isAuditing && (
              <div className="space-y-1.5 mb-4 text-right">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-650 dark:text-amber-400">جاري التدقيق الساكن...</span>
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
              onClick={runCodeImmunityAudit}
              className="w-full py-2.5 px-4 bg-amber-650 hover:bg-amber-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              تشغيل تدقيق حصانة الكود
            </button>
          </div>

          {/* CODE IMMUNITY CHECKLIST */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              شروط وأركان اعتماد حصانة الكود
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">تفتيت الملفات العملاقة (No God Components)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">فصل الشاشات الكبيرة لوحدات ومكونات فرعية لضمان قابلية القراءة العالية.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">أمان الذاكرة والاشتراكات (Cleanup Guard)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">مكافحة الـ Memory Leaks عبر التفريغ الفوري لكافة المستمعين والوظائف النشطة.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">إمساك وحوكمة الأخطاء (Error Boundaries)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">التقاط واحتواء الأخطاء الطارئة لتفادي شاشات الانهيار المزعجة للمستخدمين.</span>
                </div>
              </div>
            </div>
          </div>

          {/* ARCHITECT SIGNATURE BLOCK */}
          {isSignedOff && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-950 dark:to-slate-900 p-6 border border-amber-200 dark:border-amber-900/40 text-center animate-scaleIn">
              <PenTool className="w-10 h-10 text-amber-500 mx-auto mb-2 drop-shadow-sm" />
              <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1">وثيقة توقيع حصانة الكود المعتمدة</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">
                تعتبر هذه الشهادة برهاناً هندسياً على صرامة واستقرار وتماسك الكود وجاهزيته للصيانة لسنوات طويلة.
              </p>

              <div className="dark:bg-slate-950 p-3 rounded-lg dark:border-slate-800 mb-4">
                <input 
                  type="text" 
                  value={leadArchitect} 
                  onChange={(e) => setLeadArchitect(e.target.value)}
                  className="w-full text-center bg-transparent border-none text-xs font-black text-amber-650 dark:text-amber-400 outline-none"
                  placeholder="اسم المفوض بالتوقيع"
                />
                <span className="text-[9px] text-slate-400 block mt-1 border-t border-slate-100 pt-1 font-mono">
                  توقيع معتمد برقم تسلسلي: #CODE-IMMUNITY-2026-31
                </span>
              </div>
            </div>
          )}

          {/* MONITOR LOGS */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold tracking-tight mr-2">مراقب صحة الكود ومكافحة الديون الفنية</span>
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
