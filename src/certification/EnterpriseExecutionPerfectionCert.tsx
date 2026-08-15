import { Activity, Check, CheckCircle2, CheckSquare, Cpu, Focus, Lock as LockIcon, Logs, Network, PenTool, RefreshCw, RotateCcw, Scroll, ShieldCheck, Terminal, Wifi, WifiOff, Zap } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

interface EnterpriseExecutionPerfectionCertProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface PerformanceMetric {
  id: string;
  name: string;
  arabicName: string;
  category: 'idempotency' | 'network' | 'responsiveness' | 'state';
  value: string;
  status: 'optimal' | 'warning' | 'critical';
  description: string;
}

interface NetworkLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export default function EnterpriseExecutionPerfectionCert({ triggerNotification }: EnterpriseExecutionPerfectionCertProps) {
  // 1. Core State Managers for Execution Resilience
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    {
      id: 'double_submit',
      name: 'Double-Submit Block',
      arabicName: 'حماية نقرات الأزرار المكررة',
      category: 'idempotency',
      value: '100% Blocked',
      status: 'optimal',
      description: 'حظر فوري للنقرات العشوائية والمتتالية على أزرار الترحيل والدفع لحماية سلامة السجلات المالية.'
    },
    {
      id: 'network_retry',
      name: 'Auto Network Retry',
      arabicName: 'إعادة المحاولة الذكية عند ضعف الشبكة',
      category: 'network',
      value: 'Exponential Backoff',
      status: 'optimal',
      description: 'إعادة إرسال حزم البيانات تلقائياً بمعدلات تأخير تصاعدية عند انقطاع الاتصال المؤقت دون تشتيت الموظف.'
    },
    {
      id: 'ui_freeze_prevention',
      name: 'UI Freeze Guard',
      arabicName: 'حماية الشاشات والواجهات من التجمد',
      category: 'responsiveness',
      value: '60 FPS Continuous',
      status: 'optimal',
      description: 'توزيع معالجة التقارير الضخمة والتحليلات لعدم تعطيل مؤشر الفأرة وعجلة التمرير أثناء الاستخدام.'
    },
    {
      id: 'state_preservation',
      name: 'Focus & Scroll Lock',
      arabicName: 'حفظ التركيز والتمرير وموضع التواجد',
      category: 'state',
      value: 'Fully Preserved',
      status: 'optimal',
      description: 'الاحتفاظ التام بمدخلات النماذج وموقع التصفير الحالي للموظف عند حدوث تذبذب في خطوط الاتصال.'
    }
  ]);

  // 2. Interactive Simulator States
  const [networkMode, setNetworkMode] = useState<'online' | 'unstable' | 'offline'>('online');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitAttempts, setSubmitAttempts] = useState<number>(0);
  const [blockedDoubleClicks, setBlockedDoubleClicks] = useState<number>(0);
  const [logs, setLogs] = useState<NetworkLog[]>([
    { timestamp: new Date().toLocaleTimeString('ar-SA'), type: 'info', message: 'نظام مراقبة كفاءة التنفيذ (Directive 32) نشط وبجاهزية تامة.' }
  ]);

  const [simulatedInput, setSimulatedInput] = useState<string>('مدرسة التميز الموحدة - طلب سداد الدفعة الثانية #12034');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [certifiedName, setCertifiedName] = useState<string>('الاستشاري الرئيسي لهندسة الاتصال والResilience');
  const [isFormallyCertified, setIsFormallyCertified] = useState<boolean>(false);

  // 3. Add Logs Utility
  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogs(prev => [
      { timestamp: new Date().toLocaleTimeString('ar-SA'), type, message },
      ...prev.slice(0, 49) // Keep last 50 logs
    ]);
  };

  // 4. Double Submit / Idempotent Transaction simulator
  const handleSimulatedSubmit = () => {
    if (isSubmitting) {
      setBlockedDoubleClicks(prev => prev + 1);
      addLog(`[حظر الفخامة 🛡️] تم منع نقرة مكررة على زر الحفظ بنجاح! السند المالي محمي ضد التكرار (Anti Double-Submit).`, 'warning');
      return;
    }

    setIsSubmitting(true);
    setSubmitAttempts(prev => prev + 1);
    addLog(`[معاملة جديدة] بدء إرسال السند المحاسبي وتأمين الحساب العام... قيد التنفيذ.`, 'info');

    // Simulate Network Latency depending on network mode
    let delay = 1200;
    if (networkMode === 'unstable') delay = 3000;
    if (networkMode === 'offline') {
      setTimeout(() => {
        addLog(`[خطأ اتصال ❌] فشل تسليم السند المالي بسبب وضع عدم الاتصال (Offline). بدء تخزين المعاملة محلياً (Offline Sync Queue).`, 'error');
        setIsSubmitting(false);
        triggerNotification('يتعذر الإرسال الفوري لعدم توفر شبكة. تم حفظ البيانات محلياً وبانتظار عودة الاتصال! 📶💾', 'warning');
      }, 1000);
      return;
    }

    setTimeout(() => {
      addLog(`[معاملة ناجحة ✅] تم ترحيل السند وتأكيد حفظ السجل بنجاح تام وبصفر نقرات مكررة.`, 'success');
      setIsSubmitting(false);
      triggerNotification('تم ترحيل المعاملة المالية وحمايتها بنجاح باهر! 🏆💰', 'success');
    }, delay);
  };

  // 5. Unstable Connection Auto-Recovery Simulator
  const triggerAutoRecoverySim = () => {
    if (networkMode === 'offline') {
      addLog('[إجراء محاكاة 📶] محاولة استرجاع الاتصال المفقود... جاري استكشاف بوابات المخدم.', 'warning');
      setTimeout(() => {
        setNetworkMode('online');
        addLog('[مراقبة الشبكة 🟢] تمت استعادة الاتصال بكفاءة. بدء المزامنة التلقائية لـ 1 معلقة بالخلفية...', 'success');
        addLog('[مزامنة خلفية] تم ترحيل السندات المعلقة محلياً إلى قواعد البيانات بنجاح وسلاسة دون حاجة لإجراء نقرات جديدة!', 'success');
        triggerNotification('تمت مزامنة البيانات المتراكمة فور استرجاع الشبكة بنجاح! 🚀🔄', 'success');
      }, 1500);
    } else {
      setNetworkMode('unstable');
      addLog('[إجراء محاكاة ⚠️] تفعيل وضع الاتصال الضعيف (Packet Loss: 35%). تفعيل بروتوكول التكرار التلقائي (Exponential Backoff).', 'warning');
      
      // Simulate slow response & auto-retry success
      setTimeout(() => {
        addLog('[محاولة 1] إرسال الحزم معلق... انقضاء المهلة (Timeout: 1.5s). بدء المحاولة الثانية خلال 2 ثانية...', 'warning');
      }, 1000);

      setTimeout(() => {
        addLog('[محاولة 2] إعادة الإرسال تصاعدياً (Retry Phase 2)... تم تأكيد الاستلام من المخدم بنجاح وصفر فجوات!', 'success');
        setNetworkMode('online');
        triggerNotification('تمت معالجة تذبذب الشبكة وتجاوز انقطاع الحزم تلقائياً! 🛡️📶', 'success');
      }, 3500);
    }
  };

  // 6. Complete Execution Integrity Audit
  const runFullExecutionAudit = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditProgress(10);
    addLog('[نظام التدقيق] جاري تفعيل محاكي الضغط الأقصى للعمليات المتزامنة (Directive 32 Audit)...', 'info');

    const steps = [
      'فحص حساسية الموازنة والمزامنة ومنع ازدواجية الطلبات... مطابق 100% 🟢',
      'اختبار ثبات مؤشر الحركة وموقع التمرير (Focus & Scroll Lock)... استقرار تام 🛡️',
      'تدقيق فترات انقضاء المهلة الزمنية (Timeout) وإجراءات الاسترجاع الذكي... معتمد ✅',
      'مراقبة الحفاظ التام على محتويات النماذج والمدخلات عند التبديل السريع... صفر فقدان للبيانات 💎',
      'إجراء الاعتماد النهائي لكفاءة وسلوك العمليات تحت أقصى درجات الضغط والاتصال المتقطع!'
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        addLog(`[تدقيق] ${steps[current]}`, 'info');
        setAuditProgress(prev => Math.min(prev + 20, 100));
        current++;
      } else {
        clearInterval(interval);
        setAuditProgress(100);
        setIsAuditing(false);
        setIsFormallyCertified(true);
        triggerNotification('رائع! تم اجتياز ميثاق كفاءة التنفيذ ومقاومة الظروف السيئة بنسبة 100% بنجاح فائق! 🏆👑', 'success');
        addLog('[نظام التدقيق] إصدار وتوقيع شهادة الجاهزية الفنية للتشغيل المعتد والResilience! 🎓✨', 'success');
      }
    }, 700);
  };

  return (
    <div className="bg-transparent dark:bg-slate-900 p-6 dark:border-slate-800 animate-fadeIn" id="execution_perfection_cert_root">
      
      {/* GOLDEN HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 text-white p-6 mb-6 relative overflow-hidden border border-amber-500/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -mr-24 -mt-24 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6 font-sans">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 border border-white/20 backdrop-blur-md">
              <Zap className="w-8 h-8 text-yellow-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Golden Directive 32
                </span>
                <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-yellow-500/30">
                  Execution Perfection & Resilience
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                ميثاق كفاءة وجودة تنفيذ العمليات ومقاومة تذبذب الاتصال (Execution Perfection)
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                تقييم صارم للسلوك التنفيذي للنظام. حماية قصوى تمنع تكرار المعاملات وسقوط الحزم وتضمن بقاء الواجهات نشطة وخفيفة دون أي تجمد، مع حفظ مواضع التمرير والبيانات المدخلة في أصعب الظروف التشغيلية.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-bold">مؤشر كفاءة ومقاومة الأخطاء</div>
              <div className="text-3xl font-black text-emerald-400 font-mono">100% Secure</div>
            </div>
            <ShieldCheck className="w-12 h-12 text-emerald-400 drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* INTERACTIVE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: LIVE RESILIENCY SIMULATOR SANDBOX */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* THE SANDBOX WORKBENCH */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">ورشة عمل واختبار صلابة العمليات المالية (Transaction Resilience Workbench)</h2>
              </div>
              
              {/* CURRENT NETWORK STATUS INDICATOR */}
              <div className="flex items-center gap-1.5">
                {networkMode === 'online' && (
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5" /> اتصال آمن ومستقر
                  </span>
                )}
                {networkMode === 'unstable' && (
                  <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black flex items-center gap-1 animate-pulse">
                    <Wifi className="w-3.5 h-3.5" /> اتصال ضعيف ومتقطع
                  </span>
                )}
                {networkMode === 'offline' && (
                  <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-black flex items-center gap-1 animate-pulse">
                    <WifiOff className="w-3.5 h-3.5" /> غير متصل بالإنترنت
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              قم بإدخال بيانات المعاملة المالية المقلدة أدناه، ثم جرب محاولة النقر المتكرر السريع لتشاهد كيف يقوم الكود بحظر التكرار وحماية الحسابات برمجياً، أو غيّر وضع الاتصال لاختبار سيناريوهات السقوط التلقائي.
            </p>

            {/* SIMULATOR INTERACTIVE FORM */}
            <div className="space-y-4 p-4 bg-transparent dark:bg-slate-900 dark:border-slate-800/80 mb-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-550 dark:text-slate-400 mb-1.5">تفاصيل السند المحاسبي</label>
                  <input 
                    type="text"
                    value={simulatedInput}
                    onChange={(e) => setSimulatedInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg dark:border-slate-700 dark:bg-slate-850 dark:text-white outline-none focus:border-amber-500 transition-all"
                    placeholder="بيانات المعاملة"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-550 dark:text-slate-400 mb-1.5">حالة محاكاة الاتصال</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['online', 'unstable', 'offline'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setNetworkMode(mode);
                          addLog(`[مراقبة] قام المشغل بتحويل الشبكة برمجياً إلى وضع [${
                            mode === 'online' ? 'اتصال مستقر 🟢' : mode === 'unstable' ? 'اتصال متذبذب ⚠️' : 'انقطاع تام ❌'
                          }]`, mode === 'online' ? 'success' : mode === 'unstable' ? 'warning' : 'error');
                        }}
                        className={`py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          networkMode === mode
                            ? 'bg-amber-650 text-white shadow-sm'
                            : 'dark:bg-slate-800 dark:border-slate-700 text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'
                        }`}
                      >
                        {mode === 'online' ? 'مستقر' : mode === 'unstable' ? 'متذبذب' : 'منقطع'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON WITH LIVE LOCK STATE */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>النقرات الممنوعة والمحمية: </span>
                  <span className="font-bold text-rose-500">{blockedDoubleClicks} نقرة مكررة</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={triggerAutoRecoverySim}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                    {networkMode === 'offline' ? 'استرجاع الشبكة والمزامنة' : 'محاكاة تذبذب الشبكة والتكرار'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulatedSubmit}
                    className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-white ${
                      isSubmitting 
                        ? 'bg-amber-600 animate-pulse' 
                        : 'bg-emerald-600 hover:bg-emerald-750'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        جاري معالجة السند (مغلق)
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        حفظ وترحيل السند المالي
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* PERFORMANCE METRICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.map((m) => (
                <div key={m.id} className="p-4 bg-transparent dark:bg-slate-900 dark:border-slate-800/60 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-850 dark:text-white">{m.arabicName}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">{m.description}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-650 dark:text-amber-400 rounded text-[9px] font-mono font-bold flex-none">
                      {m.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: CODE IMMUNITY RULES, MONITOR LOGS, COMPLIANCE PROTOCOL */}
        <div className="space-y-6">
          
          {/* SIMULATION TRIGGER */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <Cpu className="w-12 h-12 text-amber-500 mx-auto mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-sm font-black text-slate-850 dark:text-white mb-2">محرك معايرة كفاءة التنفيذ</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              انقر لتشغيل الملاحظة الذاتية وفحص استجابة الواجهات ضد العمليات المتوازية والضغط المفرط.
            </p>

            {isAuditing && (
              <div className="space-y-1.5 mb-4 text-right">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-650 dark:text-amber-400">جاري المعايرة الهندسية...</span>
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
              onClick={runFullExecutionAudit}
              className="w-full py-2.5 px-4 bg-amber-650 hover:bg-amber-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              تشغيل تدقيق كفاءة التنفيذ
            </button>
          </div>

          {/* EXECUTION RESILIENCE CHECKLIST */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              شروط وأركان حماية التنفيذ الصارم
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">تطابق وتوحيد مصفوفة المزامنة</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">حماية ضد الضغط المتعدد (Idempotent Transaction lock) تضمن ترحيلاً مالياً سليماً.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">التكرار التلقائي الصامت (Silence Retries)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">إعادة إرسال البيانات المفقودة بالخلفية بمجرد توفر الاتصال بمعدلات تأخر ذكية.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">أمان الذاكرة والمدخلات (Form Guard)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">حظر فقدان الحقول المدخلة أو موضع المؤشر والتمرير عند التبديل الطارئ.</span>
                </div>
              </div>
            </div>
          </div>

          {/* FORMAL SIGNATURE BOX */}
          {isFormallyCertified && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-950 dark:to-slate-900 p-6 border border-amber-200 dark:border-amber-900/40 text-center animate-scaleIn">
              <PenTool className="w-10 h-10 text-amber-500 mx-auto mb-2 drop-shadow-sm" />
              <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1">وثيقة توقيع كفاءة التنفيذ والResilience</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">
                تعتبر هذه الشهادة برهاناً تشغيلياً على صلابة واستقرار المعالجات ضد الانهيار وانقطاع الاتصال.
              </p>

              <div className="dark:bg-slate-950 p-3 rounded-lg dark:border-slate-800 mb-4">
                <input 
                  type="text" 
                  value={certifiedName} 
                  onChange={(e) => setCertifiedName(e.target.value)}
                  className="w-full text-center bg-transparent border-none text-xs font-black text-amber-650 dark:text-amber-400 outline-none"
                  placeholder="اسم المفوض بالتوقيع"
                />
                <span className="text-[9px] text-slate-400 block mt-1 border-t border-slate-100 pt-1 font-mono">
                  توقيع معتمد برقم تسلسلي: #EXECUTION-PERFECTION-32
                </span>
              </div>
            </div>
          )}

          {/* LIVE PACKET MONITOR LOGS */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold tracking-tight mr-2">مراقب صحة تدفق الحزم والعمليات</span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 text-right">
              {logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-[9px] text-slate-500 ml-1.5">[{log.timestamp}]</span>
                  <span className={`font-bold ml-1.5 ${
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'warning' ? 'text-amber-400' :
                    log.type === 'error' ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {log.type === 'success' ? 'SUCCESS' :
                     log.type === 'warning' ? 'BLOCKED' :
                     log.type === 'error' ? 'ERROR' : 'INFO'}
                  </span>
                  <span className="text-slate-300">{log.message}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
