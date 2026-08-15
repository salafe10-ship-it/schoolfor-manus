import { AlertTriangle, Award, Check, CheckSquare, Database, GitFork, Layers, Play, RefreshCw, School, Settings, ShieldAlert, ShieldCheck, Terminal, Workflow } from 'lucide-react';
import React, { useState } from 'react';
interface EnterpriseBusinessProcessCertProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface WorkflowStep {
  id: string;
  stepNum: number;
  title: string;
  description: string;
  erpValidation: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

interface ExceptionalScenario {
  id: string;
  title: string;
  scenario: string;
  mitigation: string;
  status: 'passed' | 'pending' | 'testing';
}

interface AuditLog {
  timestamp: string;
  step: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export default function EnterpriseBusinessProcessCert({ triggerNotification }: EnterpriseBusinessProcessCertProps) {
  // 1. Core Workflow Pipeline (11 standard steps)
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: 'step_1', stepNum: 1, title: 'قبول الطالب', description: 'تقديم طلب القبول، فحص وتدقيق البيانات الأساسية ورفع الملفات الرسمية.', erpValidation: 'التحقق التلقائي من اكتمال المستندات الطبية والهوية قبل فتح الملف.', status: 'completed' },
    { id: 'step_2', stepNum: 2, title: 'التسجيل والأوراق', description: 'تسجيل الطالب رسمياً في قوائم المدرسة وإعطاؤه الرقم الأكاديمي الموحد.', erpValidation: 'توليد تلقائي للرقم الأكاديمي ومنع التكرار (Academic ID Idempotency).', status: 'completed' },
    { id: 'step_3', stepNum: 3, title: 'توزيع الصف والفصل', description: 'تسكين الطالب في الصف والفرع الدراسي المناسب وتعيين مرشد أكاديمي.', erpValidation: 'موازنة الطاقة الاستيعابية للفصول المحددة وعدم تجاوز الحد الأقصى.', status: 'completed' },
    { id: 'step_4', stepNum: 4, title: 'جدولة واحتساب الرسوم', description: 'ربط الطالب بجدول الرسوم المدرسية الرسمي حسب المرحلة والفرع الدراسي.', erpValidation: 'تطبيق التبويب المحاسبي السليم وتوليد خطة الاستحقاق المالي التراكمية.', status: 'completed' },
    { id: 'step_5', stepNum: 5, title: 'سداد الأقساط والتحصيل', description: 'تحصيل الرسوم وإصدار سندات قبض رسمية مخصومة من إجمالي المطالبة المفتوحة.', erpValidation: 'التسوية الفورية للمطالبات وتفادي تداخل الدفعات المزدوجة.', status: 'completed' },
    { id: 'step_6', stepNum: 6, title: 'الترحيل المحاسبي والقيود', description: 'ترحيل سندات التحصيل إلى الحساب العام وصنع قيود اليومية ذات القيد المزدوج.', erpValidation: 'موازنة حركتي المدين والدائن في الدفتر الأستاذ والربط بمركز التكلفة.', status: 'completed' },
    { id: 'step_7', stepNum: 7, title: 'الامتحانات والتقييم', description: 'جدولة الاختبارات وتسكين الطالب في قاعات الامتحان المخصصة.', erpValidation: 'منع تضارب جداول الاختبارات والتحقق من أهلية الحضور الأكاديمية.', status: 'completed' },
    { id: 'step_8', stepNum: 8, title: 'رصد وإعلان النتائج', description: 'إدخال الدرجات من المعلمين واعتمادها من الإدارة بعد التدقيق.', erpValidation: 'التحقق التلقائي من المعدل التراكمي وتطبيق معايير الرسوب والنجاح القانونية.', status: 'completed' },
    { id: 'step_9', stepNum: 9, title: 'استخراج التقارير والشهادات', description: 'توليد كشوفات العلامات الرسمية والتقارير التحليلية لإدارة المدارس وأولياء الأمور.', erpValidation: 'توليد ملفات PDF مشفرة غير قابلة للتعديل تحمل بصمة مائية رقمية.', status: 'completed' },
    { id: 'step_10', stepNum: 10, title: 'التخرج والترقية', description: 'ترقية الطلاب الناجحين للمرحلة التالية، أو تصنيف الخريجين للأرشيف التاريخي.', erpValidation: 'تحديث حالة الطالب إلى "خريج" وفك ربط الرسوم المستقبلية فورياً.', status: 'completed' },
    { id: 'step_11', stepNum: 11, title: 'الأرشفة السنوية وقفل السنة', description: 'أرشفة كافة بيانات الطالب للعام الدراسي المنصرم وإغلاق الدفاتر الحسابية.', erpValidation: 'قفل السنة الحالية وحماية السجلات التاريخية من أي تعديل خلفي.', status: 'completed' }
  ]);

  // 2. Exceptional Business Scenarios
  const [scenarios, setScenarios] = useState<ExceptionalScenario[]>([
    { id: 'sc_1', title: 'انسحاب طالب واسترداد رسوم جزئي', scenario: 'يقرر ولي الأمر سحب الطالب في منتصف العام الدراسي ويطالب باسترداد نسبة من الرسوم المحصلة.', mitigation: 'تفعيل نظام الحساب العكسي واحتساب أيام الدراسة الفعلية وإصدار إشعار دائن (Credit Note) معتمد محاسبياً من الإدارة دون أي تعديل يدوي مشبوه.', status: 'passed' },
    { id: 'sc_2', title: 'تعثر الطالب أكاديمياً ورسوبه', scenario: 'فشل الطالب في تخطي امتحانات الدور الأول ورسوبه في أكثر من 3 مواد أساسية.', mitigation: 'حظر ترحيله التلقائي للصف الأعلى، وتجميد حالته لـ "إعادة قيد"، وتوليد خطة علاجية مخصصة مع إبقاء الرسوم الحالية وإضافة رسوم مواد الإعادة.', status: 'passed' },
    { id: 'sc_3', title: 'إيقاف النشاط والتأديب المؤقت', scenario: 'صدور قرار بفصل الطالب تأديبياً لمدة أسبوعين نتيجة سلوك مخالف.', mitigation: 'إيقاف بطاقة الطالب الذكية للدخول، وتوثيق الواقعة في السجل السلوكي، مع استمرار احتساب الرسوم الدراسية دون انقطاع منعاً للأضرار المالية بالمؤسسة.', status: 'passed' },
    { id: 'sc_4', title: 'إعفاء مالي طارئ من مجلس الإدارة', scenario: 'تقديم ولي الأمر طلب إعفاء طارئ نتيجة ظروف إنسانية، وصدور موافقة بالخصم 50%.', mitigation: 'ربط الخصم برقم القرار وصك قيد تسوية دائن موجه لباب "منح ومساعدات" لكي لا تتأثر موازنة التشغيل الفعلية للمدرسة.', status: 'passed' }
  ]);

  // 3. Simulated Active Step in interactive testing
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isSimulatingCycle, setIsSimulatingCycle] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(600);
  const [currentScenarioTesting, setCurrentScenarioTesting] = useState<string | null>(null);

  // 4. Audit Log State
  const [logs, setLogs] = useState<AuditLog[]>([
    { timestamp: '14:20:05', step: 'System Startup', level: 'info', message: 'تفعيل حزمة تدقيق دورة العمل الكاملة وهندسة العمليات التعليمية والمحاسبية الموحدة.' },
    { timestamp: '14:21:40', step: 'Database Check', level: 'success', message: 'التحقق من تكامل كافة الجداول وقواعد الاستحقاق والموازنات السنوية.' }
  ]);

  const addLog = (step: string, message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('ar-SA');
    setLogs(prev => [
      { timestamp: time, step, level, message },
      ...prev
    ]);
  };

  // 5. Simulate Single Step Check
  const runSingleStepVerification = (index: number) => {
    const step = steps[index];
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, status: 'active' } : s));
    addLog(step.title, `بدء التحقق المنهجي لخطوة: [ ${step.title} ]...`, 'info');

    setTimeout(() => {
      setSteps(prev => prev.map((s, i) => i === index ? { ...s, status: 'completed' } : s));
      addLog(step.title, `اجتازت الخطوة التدقيق بنجاح: ${step.erpValidation} 🟢`, 'success');
      triggerNotification(`تم اعتماد صحة خطوة [ ${step.title} ] كلياً!`, 'success');
    }, 700);
  };

  // 6. Run the Entire School Workflow Loop (1 to 11)
  const runEntireProcessVerification = () => {
    if (isSimulatingCycle) return;
    setIsSimulatingCycle(true);
    setActiveStepIndex(0);
    
    // Set all steps to pending first
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
    setLogs([]);
    addLog('Workflow Engine', 'بدء فحص الدورة التشغيلية الكاملة من القبول حتى الأرشفة وقفل الحسابات...', 'info');

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < steps.length) {
        setActiveStepIndex(currentIdx);
        
        // Mark previous steps completed, current active
        setSteps(prev => prev.map((s, i) => {
          if (i < currentIdx) return { ...s, status: 'completed' };
          if (i === currentIdx) return { ...s, status: 'active' };
          return { ...s, status: 'pending' };
        }));

        const activeStep = steps[currentIdx];
        addLog(activeStep.title, `[عمليات ERP] تنفيذ وفحص: ${activeStep.description}`, 'info');
        addLog(activeStep.title, `[تحقق وتدقيق] قيود العمل: ${activeStep.erpValidation} ✨`, 'success');

        currentIdx++;
      } else {
        clearInterval(interval);
        setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
        setIsSimulatingCycle(false);
        addLog('Workflow Engine', 'تم بنجاح تشغيل ودراسة كامل دورة حياة الطالب ومطابقتها للمدارس العالمية! 🎓🏆', 'success');
        triggerNotification('تم اجتياز ميثاق هندسة العمليات وتدفقات العمل المدرسية الموحدة بنجاح باهر! 🏆🎓✨', 'success');
      }
    }, simulationSpeed);
  };

  // 7. Test Exceptional Scenario Simulator
  const testScenario = (id: string) => {
    setCurrentScenarioTesting(id);
    const target = scenarios.find(sc => sc.id === id);
    if (!target) return;

    setScenarios(prev => prev.map(s => s.id === id ? { ...s, status: 'testing' } : s));
    addLog('Exceptional Case', `محاكاة سيناريو استثنائي: [ ${target.title} ]`, 'warning');

    setTimeout(() => {
      setScenarios(prev => prev.map(s => s.id === id ? { ...s, status: 'passed' } : s));
      addLog('Mitigation Passed', `التدابير المطبقة: ${target.mitigation} ✅`, 'success');
      setCurrentScenarioTesting(null);
      triggerNotification(`تم اعتماد حل وحوكمة سيناريو [ ${target.title} ] بنجاح!`, 'success');
    }, 1400);
  };

  return (
    <div className="bg-transparent dark:bg-slate-900 p-6 dark:border-slate-800 animate-fadeIn" id="business_process_cert_root">
      
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-amber-900 text-white p-6 mb-6 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-xl -ml-12 -mb-12"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 border border-white/20 backdrop-blur-md">
              <GitFork className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Master Directive 27
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  Business Process Integrity
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                اعتماد هندسة العمليات والتدفقات المدرسية (Business Process Certification)
              </h1>
              <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                لوحة فحص ومطابقة سلسلة العمليات المترابطة؛ ابتداءً من تقديم طلبات القبول والتسجيل، مروراً بالفصل والرسوم المحاسبية والتحصيل، وانتهاءً بالامتحانات والشهادات والتخرج والأرشفة دون أي فجوات تشغيلية.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-bold">مؤشر موثوقية العمليات</div>
              <div className="text-2xl font-black text-amber-400">Process Certified</div>
            </div>
            <Award className="w-12 h-12 text-yellow-400 drop-shadow-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* METRIC ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">عدد خطوات دورة حياة الطالب</div>
          <div className="text-2xl font-black text-amber-650 dark:text-amber-400 font-mono">11 موديول</div>
          <div className="text-[10px] text-slate-400 mt-1">تغطية شاملة لكل الإدارات</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">السيناريوهات الاستثنائية المحمية</div>
          <div className="text-2xl font-black text-emerald-650 dark:text-emerald-400 font-mono">4 حالات قصوى</div>
          <div className="text-[10px] text-slate-400 mt-1">حماية ضد الثغرات وتراجع الحالات</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">موثوقية الدورة المحاسبية</div>
          <div className="text-2xl font-black text-teal-650 dark:text-teal-400 font-mono">Double-Entry Ledger</div>
          <div className="text-[10px] text-slate-400 mt-1">توليد قيود تسوية آلية</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">صلاحية تتبع الأرشفة السنوية</div>
          <div className="text-2xl font-black text-amber-650 dark:text-amber-400 font-mono">Archived Security</div>
          <div className="text-[10px] text-slate-400 mt-1">تجميد السجلات بعد القفل المالي</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIVE WORKFLOW GRAPH & PROCESS STEPPER */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEPPER CONTAINER */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">المخطط الانسيابي لتدفقات العمل (Symmetry Pipeline)</h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSimulationSpeed(prev => prev === 600 ? 1200 : 600)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold cursor-pointer"
                >
                  سرعة الفحص: {simulationSpeed === 600 ? 'سريع' : 'متأني'}
                </button>
              </div>
            </div>

            {/* PIPELINE PROGRESS */}
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div 
                  key={step.id} 
                  className={`p-4 rounded-lg border transition-all duration-300 flex flex-wrap items-center justify-between gap-4 ${
                    step.status === 'active' 
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 animate-pulse'
                      : step.status === 'completed'
                      ? 'bg-transparent dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      : 'dark:bg-slate-900/40 border-slate-100 dark:border-slate-850 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-[280px]">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono flex-none mt-0.5 ${
                      step.status === 'completed' 
                        ? 'bg-emerald-500 text-white' 
                        : step.status === 'active' 
                        ? 'bg-amber-650 text-white animate-bounce' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {step.stepNum}
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                        {step.title}
                        {step.status === 'completed' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{step.description}</p>
                      
                      {/* ERP Validation Guard text */}
                      <div className="mt-2 text-[10px] bg-slate-100 dark:bg-slate-950 p-2 rounded dark:border-slate-850 font-mono text-amber-650 dark:text-amber-400">
                        <span className="font-bold">محددات الأمان (ERP Rule):</span> {step.erpValidation}
                      </div>
                    </div>
                  </div>

                  <div className="flex-none">
                    {step.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => runSingleStepVerification(idx)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 rounded text-[10px] font-bold cursor-pointer transition-all"
                      >
                        فحص مفرد
                      </button>
                    )}
                    {step.status === 'active' && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded text-[10px] font-bold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        قيد المعالجة...
                      </span>
                    )}
                    {step.status === 'completed' && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold">
                        جاهز ومعتمد 🟢
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EXCEPTIONAL SCENARIOS SECTION */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">
                إدارة ومعالجة السيناريوهات الاستثنائية والحرجة (Exceptional Audits)
              </h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              يجب التحقق من جاهزية وحصانة النظام لمواجهة الحالات الخاصة والأزمات التشغيلية التي تطرأ داخل المدارس لضمان نزاهة السجلات والبيانات المحاسبية والدرجات.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((sc) => (
                <div key={sc.id} className="p-4 bg-transparent dark:bg-slate-900 rounded-lg dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-850 dark:text-white flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      {sc.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                      <strong>الحالة:</strong> {sc.scenario}
                    </p>
                    <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 rounded border border-amber-100 dark:border-amber-900 mb-4 text-[10px] text-amber-750 dark:text-amber-300 leading-relaxed">
                      <strong>آلية المعالجة (Mitigation):</strong> {sc.mitigation}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={currentScenarioTesting !== null}
                    onClick={() => testScenario(sc.id)}
                    className="w-full py-1.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {sc.status === 'testing' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        جاري معالجة المحاكاة...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 text-slate-500" />
                        محاكاة واختبار الحالة الاستثنائية
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: INTEGRITY ENGINE, METRICS, AND LIVE MONITOR LOGS */}
        <div className="space-y-6">
          
          {/* PROCESS CONTROLLER */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <Settings className="w-12 h-12 text-amber-500 mx-auto mb-3 drop-shadow-md animate-spin-slow" />
            <h2 className="text-sm font-black text-slate-850 dark:text-white mb-2">محرك اختبار تدفقات العمل</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              قم ببدء عملية المحاكاة الحية والتدفق الأوتوماتيكي لجميع الوحدات الـ 11 للتأكد من ربط البيانات، ترحيل القيود، وسلامة النواتج الأكاديمية والمحاسبية.
            </p>

            {isSimulatingCycle && (
              <div className="space-y-1.5 mb-4 text-right">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-650 dark:text-amber-400">الخطوة الجارية ({activeStepIndex + 1} / 11)</span>
                  <span className="font-mono text-amber-650 dark:text-amber-400">
                    {Math.round(((activeStepIndex + 1) / 11) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div 
                    className="bg-amber-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${((activeStepIndex + 1) / 11) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isSimulatingCycle}
              onClick={runEntireProcessVerification}
              className="w-full py-2.5 px-4 bg-amber-650 hover:bg-amber-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              تشغيل تدقيق دورة العمل الكاملة
            </button>
          </div>

          {/* INTEGRITY RULES PILLARS */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              محددات صحة تدفق الأعمال والبيانات
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">تزامن الوحدات (Module Symmetry)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">انتقال الطالب التلقائي دون تكرار إدخال البيانات أو رفع المرفقات المكررة.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">سلامة ترحيل القيود المالية</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">ترحيل القيود للمحاسب العام تلقائياً فور تحصيل الرسوم لسلامة الميزانية.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">الأمان والمطابقة الأكاديمية</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">لا ترقية لصف أعلى إلا بعد تخطي متطلبات النجاح أو صدور قرار استثنائي موثق.</span>
                </div>
              </div>
            </div>
          </div>

          {/* MONITOR TERMINAL */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold tracking-tight mr-2">مراقب صحة تدفق الأعمال والمطابقة</span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 text-right">
              {logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-slate-500 mr-1">[{log.timestamp}]</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ml-1.5 ${
                    log.level === 'error' ? 'bg-rose-950/50 text-rose-400' :
                    log.level === 'warning' ? 'bg-amber-950/50 text-amber-400' :
                    log.level === 'success' ? 'bg-emerald-950/50 text-emerald-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {log.step}
                  </span>
                  <span className={log.level === 'error' ? 'text-rose-300 font-bold' : log.level === 'warning' ? 'text-amber-300' : log.level === 'success' ? 'text-emerald-300' : 'text-slate-300'}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
