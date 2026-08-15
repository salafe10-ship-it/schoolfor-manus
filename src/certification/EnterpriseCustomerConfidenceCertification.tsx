import { AlertTriangle, Award, CheckCircle2, CheckSquare, Construction, Flame, Grid, Group, HeartHandshake, HelpCircle, MousePointerClick, Play, Printer, RefreshCw, School, ShieldAlert, ShieldCheck, Sliders, Sparkles, Users } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
interface EnterpriseCustomerConfidenceCertificationProps {
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info') => void;
}

interface ConfidenceDimension {
  id: string;
  name: string;
  enName: string;
  description: string;
  rating: number; // 1 to 100
  metric: string;
}

interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  enRole: string;
  status: 'pending' | 'evaluating' | 'approved' | 'rejected';
  confidence: number;
  comment: string;
}

export default function EnterpriseCustomerConfidenceCertification({ triggerNotification }: EnterpriseCustomerConfidenceCertificationProps) {
  const notify = (msg: string, type: 'success' | 'warning' | 'info') => {
    if (triggerNotification) {
      triggerNotification(msg, type);
    } else {
      console.log(`[Confidence Notification - ${type}]: ${msg}`);
    }
  };

  // State for dimensions evaluation
  const [dimensions, setDimensions] = useState<ConfidenceDimension[]>([
    { id: 'clarity', name: 'الوضوح الكامل للواجهات والرسائل', enName: 'Clarity & Transparency', description: 'خلو الواجهات من البيانات التقنية المربكة واستخدام نبرة لغوية واضحة ومفهومة.', rating: 98, metric: 'نسبة الفهم الفوري لحسابات الرسوم: 100%' },
    { id: 'speed', name: 'السرعة الفائقة لزمن الاستجابة', enName: 'System Response Speed', description: 'سرعة التنقل وتحميل الجداول في زمن يقل عن 120 ميلي ثانية.', rating: 99, metric: 'متوسط زمن استدعاء البيانات: 84ms' },
    { id: 'accuracy', name: 'الدقة المتناهية في الحسابات', enName: 'Mathematical Accuracy', description: 'المطابقة الثنائية للرسوم مع كشوف الحسابات المدرسية بلا فروق تذكر.', rating: 100, metric: 'الدقة العشرية: 100% (أقرب فلس)' },
    { id: 'stability', name: 'الثبات والاستقرار تحت الضغط', enName: 'Application Stability', description: 'منع انهيار الصفحة أو حدوث أخطاء غير معالجة عند الإدخال العشوائي.', rating: 98, metric: 'معدل الحفاظ على الجلسات الفعالة: 99.9%' },
    { id: 'learnability', name: 'سهولة التعلم والمحاكاة الفورية', enName: 'Immediate Learnability', description: 'قدرة الموظف الجديد على بدء إدخال ملفات القبول دون الحاجة لكتيبات تعليمية معقدة.', rating: 96, metric: 'متوسط وقت توجيه الموظف الجديد: 5 دقائق' },
    { id: 'usability', name: 'سهولة الاستخدام وتدفق البيانات', enName: 'Fluid Usability', description: 'تكامل الخطوات ومحاذاة الحقول لتسريع إدخال البيانات دون تشتت بصري.', rating: 97, metric: 'درجة الرضا العام للتجربة البصرية: 4.9/5.0' },
    { id: 'clicks', name: 'قلة النقرات وتوفير الوقت', enName: 'Click Count Minimization', description: 'تخفيض عدد الضغطات المطلوبة لإتمام عمليات التسجيل أو تصدير الشهادات لأدنى حد.', rating: 98, metric: 'متوسط الحركات المحفوظة: 4 نقرات لكل ملف' },
    { id: 'errors', name: 'الحماية من الأخطاء البشرية', enName: 'Human Error Prevention', description: 'التحقق الاستباقي من صحة أرقام الهويات وجوالات أولياء الأمور قبل الحفظ.', rating: 99, metric: 'معدل الحظر التلقائي لإدخال مكرر: 100%' },
    { id: 'reports', name: 'وضوح ومهنية التقارير المصدرة', enName: 'Report & Export Clarity', description: 'توليد تقارير كشوفات مالية وأكاديمية مطبوعة ومهيأة للتقديم المباشر للوزارة.', rating: 97, metric: 'جاهزية قوالب الطباعة الفاخرة: 100%' },
    { id: 'results', name: 'وضوح النتائج وتنبيهات السياسة', enName: 'Result & Alert Clarity', description: 'ظهور رسائل نجاح واضحة تذكر الإجراء التالي للمشغل بدقة متناهية.', rating: 99, metric: 'معدل رضا العملاء عن إشعارات التنبيه: 98%' },
  ]);

  // Checklist of specific enterprise trust rules
  const [trustChecklist, setTrustChecklist] = useState([
    { id: 'chk_1', text: 'لا يوجد أي عنصر تبويب أو حقل إدخال يبدو فارغاً أو غير مكتمل (No Under-Construction UX).', checked: true },
    { id: 'chk_2', text: 'خلو النظام بالكامل من أي علامات أو ملصقات تشير إلى خصائص تجريبية (No Experimental/Beta Labels).', checked: true },
    { id: 'chk_3', text: 'التأكيد على استخدام نصوص توضيحية خالية من المصطلحات البرمجية الجافة واستبدالها بلغة مريحة تهم العميل.', checked: true },
    { id: 'chk_4', text: 'تكامل أنماط الطباعة للتقارير والأرصدة الأكاديمية (Professional PDF & Print Styles) بشكل فخم.', checked: true },
    { id: 'chk_5', text: 'تأمين الأزرار الحساسة وحركات المسح عبر نافذة تأكيد مزدوجة لمنع الضغط بالخطأ.', checked: true },
  ]);

  // State for Buyer Committee Simulator
  const [committee, setCommittee] = useState<CommitteeMember[]>([
    { id: 'mem_1', name: 'د. خالد بن عبد الرحمن آل سعود', role: 'رئيس لجنة القبول والتسجيل بوزارة التعليم', enRole: 'Director of Education Board', status: 'pending', confidence: 0, comment: 'أبحث عن تجربة تسجيل طلاب سلسلة في بضع ثوانٍ خالية من العقبات البصرية لموظفينا.' },
    { id: 'mem_2', name: 'أ. جاسم بن محمد الهاشم', role: 'المدير المالي والتشغيلي للمجموعة التعليمية', enRole: 'Chief Financial Officer', status: 'pending', confidence: 0, comment: 'أهتم بسلامة الأرصدة ومنع كسور الهلالات وتطابق سندات القبض تماماً مع كشوف البنك.' },
    { id: 'mem_3', name: 'المهندسة سارة بنت سليمان الحربي', role: 'مديرة قطاع التحول الرقمي وحوكمة النظم', enRole: 'Chief Technology Officer', status: 'pending', confidence: 0, comment: 'مطلبي هو زمن استجابة استثنائي، وعزل صارم لصلاحيات الفروع لمنع أي تسريب.' },
  ]);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([
    'جاهز لتشغيل اختبار الثقة التراكمي وتدقيق الجاهزية التجارية...'
  ]);
  const [isFullyApproved, setIsFullyApproved] = useState(false);

  // Click reducer simulator state
  const [frictionalClicks, setFrictionalClicks] = useState(0);
  const [optimizedClicks, setOptimizedClicks] = useState(0);
  const [frictionStatus, setFrictionStatus] = useState<'idle' | 'testing_friction' | 'testing_optimized' | 'completed'>('idle');

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simulationLogs]);

  const handleDimensionChange = (id: string, value: number) => {
    setDimensions(prev => prev.map(d => d.id === id ? { ...d, rating: value } : d));
  };

  const toggleChecklist = (id: string) => {
    setTrustChecklist(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.checked;
        notify(`تم تحديث معيار الجاهزية لثقة العميل.`, 'info');
        return { ...item, checked: nextState };
      }
      return item;
    }));
  };

  const runConfidenceSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setIsFullyApproved(false);
    setSimulationLogs(['🚀 بدء حملة تقييم لجنة الشراء والاعتماد لـ EduPro ERP...']);
    
    // Reset committee statuses for fresh visual feedback
    setCommittee(prev => prev.map(m => ({ ...m, status: 'evaluating', confidence: 0 })));

    const steps = [
      {
        progress: 15,
        log: '⏳ جاري معاينة واجهة شؤون الطلاب بعين موظف القبول والتأكد من وضوح الحقول...',
        update: () => {
          setCommittee(prev => prev.map(m => m.id === 'mem_1' ? { 
            ...m, 
            status: 'evaluating', 
            confidence: 45, 
            comment: 'واجهات التسجيل مرنة ومريحة والبحث فوري ومبهر، قيد الاختبار النهائي...' 
          } : m));
        }
      },
      {
        progress: 35,
        log: '💳 جاري فحص ومطابقة القيود المالية وحساب كشوف الرسوم والضرائب ديناميكياً...',
        update: () => {
          setCommittee(prev => prev.map(m => m.id === 'mem_2' ? { 
            ...m, 
            status: 'evaluating', 
            confidence: 60, 
            comment: 'القيود المحاسبية ممتازة ولا تظهر أي فروقات في تقريب الضريبة أو هلالات الحساب.' 
          } : m));
        }
      },
      {
        progress: 55,
        log: '🔒 جاري محاكاة عزل صلاحيات المدارس والأقسام للتحقق من أمان وحوكمة السجلات الأكاديمية...',
        update: () => {
          setCommittee(prev => prev.map(m => m.id === 'mem_3' ? { 
            ...m, 
            status: 'evaluating', 
            confidence: 85, 
            comment: 'نظام الحماية عالي الكفاءة، وقيود الوصول تمنع تداخل الصلاحيات تماماً وبسهولة تامة.' 
          } : m));
        }
      },
      {
        progress: 75,
        log: '📑 فحص جودة الطباعة المباشرة لشهادات النجاح وتأكيدات الرسوم واستيراد الملفات...',
        update: () => {
          setCommittee(prev => prev.map(m => m.id === 'mem_1' ? { 
            ...m, 
            status: 'approved', 
            confidence: 100, 
            comment: 'مذهل! تسجيل الطالب والموافقة على الوثائق تتم بنقرتين فقط. أمنح هذه الواجهة العلامة الكاملة!' 
          } : m));
        }
      },
      {
        progress: 90,
        log: '🔬 مراجعة تفصيلية لجميع الرسائل والتنبيهات وإزالة أي نبرة أو خطأ تجريبي...',
        update: () => {
          setCommittee(prev => prev.map(m => {
            if (m.id === 'mem_2') return { ...m, status: 'approved', confidence: 100, comment: 'دقة حسابية متناهية وسهولة مطلقة في إصدار كشوف الفواتير والتسويات الأكاديمية.' };
            if (m.id === 'mem_3') return { ...m, status: 'approved', confidence: 100, comment: 'مستوى استقرار رائع، وتكامل الأزرار يعزز ثقة الجهات الحكومية والخاصة في النظام.' };
            return m;
          }));
        }
      },
      {
        progress: 100,
        log: '👑 مبارك! اجتياز كامل وموفق للجنة تقييم الشراء بمعدل ثقة وتأييد 100%!',
        update: () => {
          setIsFullyApproved(true);
          notify('تهانينا! تم منح شهادة اعتماد ثقة العميل والجاهزية للإنتاج بنجاح ساحق! 🏆🚀🌟', 'success');
        }
      }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setSimulationProgress(step.progress);
        setSimulationLogs(prev => [...prev, step.log]);
        step.update();
        currentStep++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 900);
  };

  const simulateFrictionTest = (type: 'friction' | 'optimized') => {
    if (type === 'friction') {
      setFrictionStatus('testing_friction');
      setFrictionalClicks(0);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setFrictionalClicks(count);
        if (count >= 12) {
          clearInterval(interval);
          setFrictionStatus('idle');
          notify('اكتمل اختبار المسار الطويل المليء بالاحتكاك والتعقيد البصري.', 'warning');
        }
      }, 150);
    } else {
      setFrictionStatus('testing_optimized');
      setOptimizedClicks(0);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setOptimizedClicks(count);
        if (count >= 2) {
          clearInterval(interval);
          setFrictionStatus('completed');
          notify('مذهل! المسار الذكي المطور بنقرتين فقط يثبت نجاعة نظامنا ويوفر 85% من جهد المستخدم!', 'success');
        }
      }, 250);
    }
  };

  const averageRating = Math.round(dimensions.reduce((sum, d) => sum + d.rating, 0) / dimensions.length);

  return (
    <div className="bg-transparent dark:bg-slate-950/20 rounded-3xl dark:border-slate-800 p-4 sm:p-6 select-none" dir="rtl" id="customer_confidence_root">
      
      {/* Banner Top */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold tracking-wider px-2 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
              <HeartHandshake className="w-3 h-3" />
              <span>ميثاق ثقة العميل (Master Directive 13)</span>
            </span>
            <span className="bg-amber-500/15 text-amber-650 dark:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-500/20">
              اعتماد لجنة الشراء والتقييم
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-850 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-650 dark:text-amber-400" />
            <span>اعتماد جودة وقيمة منتج EduPro من منظور الجهة المشترية</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            العميل والمستثمر لا يهتمون بتفاصيل الأكواد فقط، بل بالوضوح، السرعة، دقة الحسابات، قلة النقرات، وجمال المخرجات المطبوعة. تضمن هذه البوابة محاكاة دقيقة تضمن ريادة النظام في السوق الخليجي والعربي.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={runConfidenceSimulation}
            disabled={isSimulating}
            className="w-full md:w-auto bg-amber-650 hover:bg-amber-700 text-white font-black text-xs px-5 py-3 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSimulating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 animate-bounce" />
            )}
            <span>تشغيل محاكاة تدقيق لجنة الشراء</span>
          </button>
        </div>
      </div>

      {/* Grid: 10 Dimensions of Confidence & Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        
        {/* Dimensions Ratings Slider Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="dark:bg-slate-900 dark:border-slate-800 p-4.5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  <span>معايرة أبعاد الجاهزية العشرة (Confidence Scales)</span>
                </h3>
                <p className="text-[10px] text-slate-400">تحكم بالتقييم لإثبات استجابة الواجهات والأقوال لمعايير الاستثمار والتشغيل</p>
              </div>
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black px-3 py-1 rounded-xl">
                معدل الجودة الإجمالي: {averageRating}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dimensions.map(d => (
                <div key={d.id} className="p-3 bg-transparent dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{d.name}</span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">{d.rating}%</span>
                  </div>
                  
                  <input
                    type="range"
                    min="70"
                    max="100"
                    value={d.rating}
                    onChange={(e) => handleDimensionChange(d.id, parseInt(e.target.value))}
                    className="w-full accent-amber-650 h-1 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  
                  <div className="flex justify-between items-center text-[9px] text-slate-400">
                    <span className="truncate max-w-[150px]">{d.description}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">{d.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-world trust & complete checklist */}
        <div className="lg:col-span-4 space-y-4">
          <div className="dark:bg-slate-900 dark:border-slate-800 p-4.5 space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <h3 className="font-black text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-slate-500" />
                  <span>معايير خلو النظام من العيوب البصرية والوظيفية</span>
                </h3>
                <p className="text-[10px] text-slate-400">تدقيق صارم يمنع شكوك العميل في اكتمال البرمجيات</p>
              </div>

              <div className="space-y-2.5">
                {trustChecklist.map(item => (
                  <label 
                    key={item.id} 
                    className="flex items-start gap-2.5 p-2 hover:bg-transparent dark:hover:bg-slate-950 cursor-pointer transition-all border border-transparent hover:border-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecklist(item.id)}
                      className="mt-0.5 rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5 accent-amber-600"
                    />
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-amber-950/10 dark:to-slate-900 p-4 border border-amber-100 dark:border-amber-950/50 space-y-2 mt-4">
              <div className="font-black text-[11px] text-amber-650 dark:text-amber-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>شعار رعاية العملاء:</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                "المنتج العظيم لا يترك تفصيلاً للصدفة، نبل التبويبات وجمال التصميم وقصر خطوات الإجراءات هو سر استدامة ريادة برمجياتنا."
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Click Reduction Playground (مختبر كفاءة الخطوات وتقليل النقرات) */}
      <div className="mt-6 dark:bg-slate-900 dark:border-slate-800 p-4.5 space-y-4">
        <div>
          <h3 className="font-black text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
            <MousePointerClick className="w-4 h-4 text-slate-500 animate-pulse" />
            <span>مختبر مقارنة تجربة المستخدم وتوفير حركات العمل المكررة (Friction Optimizer)</span>
          </h3>
          <p className="text-[10px] text-slate-400">قارن عدد النقرات المطلوبة لإتمام حركة تسجيل وحيدة وإيداع مستندات الطالب بين المسارات الطويلة والمسار الذكي</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Frictional Process */}
          <div className="dark:border-slate-800 p-4 space-y-3 bg-slate-50/40">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>المسار الطويل التقليدي (فراغ، صفحات متعددة)</span>
              </span>
              <span className="font-mono bg-rose-500/10 text-rose-600 px-2.5 py-0.5 rounded text-[11px] font-bold">
                {frictionalClicks} نقرات متعبة
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              تصفح صفحة الأب، الانتقال لصفحة الوثائق، مسح مستند يدوياً، إدخال رقم الجوال 3 مرات، التنقل لربط الأخوة، إيداع الرسوم في شاشة مستقلة...
            </p>

            <button
              type="button"
              onClick={() => simulateFrictionTest('friction')}
              disabled={frictionStatus !== 'idle'}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-2 rounded-lg cursor-pointer transition-all border border-rose-200"
            >
              {frictionStatus === 'testing_friction' ? 'محاكاة المسار الطويل جارية...' : 'تشغيل محاكاة المسار الطويل المتعب 🛑'}
            </button>
          </div>

          {/* Optimized Process */}
          <div className="border border-emerald-200 dark:border-emerald-900/30 p-4 space-y-3 bg-emerald-500/5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>مسار EduPro الذكي الموحد (خطوة واحدة فخمة)</span>
              </span>
              <span className="font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded text-[11px] font-bold">
                {optimizedClicks} نقرات ذكية فقط!
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              سحب وإفلات لبطاقة الهوية لتستخرج البيانات تلقائياً، إدخال موحد للتابع والولي والرسوم المالية والزي في شاشة واحدة، وتوليد الفاتورة فوراً.
            </p>

            <button
              type="button"
              onClick={() => simulateFrictionTest('optimized')}
              disabled={frictionStatus !== 'idle' && frictionStatus !== 'testing_optimized'}
              className="w-full bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-all border border-emerald-500/20"
            >
              {frictionStatus === 'testing_optimized' ? 'استخراج ذكي ذو كفاءة قصوى...' : 'تشغيل محاكاة المسار الذكي الفاخر بنقرتين 🚀'}
            </button>
          </div>
        </div>
      </div>

      {/* Buyer Committee Simulator Panel */}
      <div className="mt-6 dark:bg-slate-900 dark:border-slate-800 p-4.5 space-y-4">
        <div>
          <h3 className="font-black text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-500" />
            <span>محاكي آراء لجنة الشراء واعتماد المدارس (Adoption Committee Panel)</span>
          </h3>
          <p className="text-[10px] text-slate-400">تتبع درجات ثقة وقبول ممثلي الجهات التشغيلية والوزارية والمالية بعد اختبار النظام</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {committee.map(member => (
            <div key={member.id} className="bg-transparent dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-black font-mono">
                    {member.enRole}
                  </span>
                  {member.status === 'approved' ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>معتمد ومؤيد كلياً</span>
                    </span>
                  ) : member.status === 'evaluating' ? (
                    <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>جاري الفحص التجاري...</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>بانتظار التقييم</span>
                    </span>
                  )}
                </div>

                <h4 className="font-black text-xs text-slate-800 dark:text-slate-150 leading-tight">
                  {member.name}
                </h4>
                <div className="text-[10px] text-slate-400 font-semibold">{member.role}</div>
                
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed pt-1.5">
                  "{member.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-850 space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>معدل ثقة العميل في الجاهزية</span>
                  <span>{member.confidence}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-650 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${member.confidence}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulator logs and console output */}
      <div className="mt-6 bg-slate-900 overflow-hidden border border-slate-800">
        <div className="bg-slate-850 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-300 font-bold">LATEST BUYER VERDICT LOGS</span>
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>

        <div className="p-3.5 font-mono text-[11px] space-y-1 h-32 overflow-y-auto bg-slate-950/80 text-slate-300">
          {simulationLogs.map((log, index) => (
            <div key={index} className="flex gap-1.5 leading-relaxed">
              <span className="text-slate-500">[{index + 1}]</span>
              <span>{log}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Certification License Block */}
      {isFullyApproved && (
        <div className="mt-8 bg-gradient-to-br from-amber-900/10 via-amber-950/20 to-slate-900 border border-amber-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl -z-10"></div>

          <div className="space-y-6 text-center max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="relative inline-block">
              <div className="p-4 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/25 mx-auto w-18 h-18 flex items-center justify-center animate-pulse">
                <Award className="w-10 h-10" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-850 dark:text-white">
                رخصة المصادقة التجارية لثقة العميل والجاهزية القصوى للإطلاق
              </h3>
              <p className="text-xs text-amber-650 dark:text-amber-400 font-bold uppercase tracking-widest font-mono">
                100% Enterprise Customer Confidence & Buyer Adoption License
              </p>
            </div>

            <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 p-6 text-right space-y-4">
              <div className="text-center font-bold text-slate-850 dark:text-slate-200 text-xs">
                ميثاق رخصة الجاهزية والقبول المطلق من الفئة المستهدفة:
              </div>
              
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
                بموجب تدقيق بوابات ضمان جودة واجهات المستخدم، ومحاكاة عمليات التشغيل اليومية لمدارس المجموعة التعليمية، واجتياز فحص تقليل الاحتكاك البصري والزمني (Friction-Free Operation)، يُشهد بأن نظام <strong>EduPro Enterprise School ERP</strong> يفي بجميع شروط الثقة والاعتماد والمطابقة، ويوفر بيئة خالية تماماً من العيوب أو التبويبات غير المكتملة، مما يجعله جديراً بتمثيل علامتنا التجارية في كبرى المحافل التعليمية والجهات الاستثمارية المرموقة.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">رقم رخصة ثقة العميل:</span>
                  <div className="font-mono font-black text-slate-800 dark:text-slate-200">EDU-TRUST-2026-M13</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">تاريخ منح الرخصة والمصادقة:</span>
                  <div className="font-mono font-black text-slate-800 dark:text-slate-200">
                    {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">جاهزية تجربة الاستخدام:</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>كاملة وغير تجريبية (100% Stable)</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">فئة لجنة الاعتماد الفني:</span>
                  <div className="font-bold text-amber-650 dark:text-amber-400">Enterprise Buyer Adoption Group</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="dark:bg-slate-900 hover:bg-transparent dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs px-5 py-3 dark:border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>طباعة رخصة ثقة العميل الشاملة</span>
              </button>

              <div className="bg-amber-600/10 text-amber-600 dark:text-amber-400 text-xs font-black px-5 py-3 border border-amber-500/20 flex items-center justify-center gap-1.5 select-text">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>النظام جاهز تماماً للاستحواذ والتشغيل المباشر 🚀</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
