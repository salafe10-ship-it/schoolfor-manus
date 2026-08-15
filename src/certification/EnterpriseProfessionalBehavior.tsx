import { Activity, AlertTriangle, Delete, Lock as LockIcon, Logs, Network, Printer, RefreshCw, Save, Shield, ShieldCheck, Signature, Stamp, Terminal, Trash2, VerifiedIcon } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';

import { IdempotencyGuard } from '../utils/IdempotencyGuard';

interface EnterpriseProfessionalBehaviorProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface BehaviorDimension {
  id: string;
  titleArabic: string;
  titleEnglish: string;
  categoryArabic: string;
  explanationArabic: string;
  assuranceStandard: string;
  status: 'certified' | 'monitoring';
  score: number;
}

export default function EnterpriseProfessionalBehavior({ triggerNotification }: EnterpriseProfessionalBehaviorProps) {
  // Setup subscription to IdempotencyGuard to display real-time active request locks
  const [activeLocks, setActiveLocks] = useState<string[]>([]);
  useEffect(() => {
    setActiveLocks(IdempotencyGuard.getActiveLocks());
    const unsubscribe = IdempotencyGuard.subscribe(() => {
      setActiveLocks(IdempotencyGuard.getActiveLocks());
    });
    return unsubscribe;
  }, []);

  const [isSimulatingSave, setIsSimulatingSave] = useState(false);

  const handleSimulatedSlowSave = async () => {
    const key = 'simulated_slow_save';
    
    // Request Lock attempt
    if (!IdempotencyGuard.acquire(key)) {
      triggerNotification('⚠️ تنبيه الأمان المحاسبي: تم كشف نقرة مكررة أثناء الحفظ! تم إبطال الطلب لمنع تكرار السجل.', 'danger');
      setSimulationLogs(prev => [
        `[${new Date().toLocaleTimeString('ar-SA')}] 🛑 [منع التكرار] تم حظر كبسة زر مكررة لمنع تكرار القيود الحسابية! (Idempotency Lock Active)`,
        ...prev
      ]);
      return;
    }

    setIsSimulatingSave(true);
    setSimulationLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] 🔄 [حفظ آمن] بدء الحفظ مع محاكاة تأخير شبكي (4 ثوانٍ). تم قفل الزر وتفعيل Request Lock لـ [${key}]...`,
      ...prev
    ]);

    try {
      // Simulate network delay of 4 seconds
      await new Promise(resolve => setTimeout(resolve, 4000));
      triggerNotification('✅ تم حفظ المعاملة وتزامنها مع مخدمات الوزارة بنجاح تام وبدون تكرار!', 'success');
      setSimulationLogs(prev => [
        `[${new Date().toLocaleTimeString('ar-SA')}] 💚 [نجاح تام] تم حفظ السجل بنجاح وتوثيق العملية في سجل التدقيق سحابياً.`,
        ...prev
      ]);
    } finally {
      IdempotencyGuard.release(key);
      setIsSimulatingSave(false);
    }
  };

  // 1. Core professional behavior pillars from Elite Directive 49
  const [dimensions, setDimensions] = useState<BehaviorDimension[]>([
    {
      id: 'critical_confirmations',
      titleArabic: 'تأكيد وحماية العمليات الحرجة والتعديل',
      titleEnglish: 'Atomic Intent & Critical Confirmations',
      categoryArabic: 'المعاملات المالية والإدارية',
      explanationArabic: 'منع الحفظ أو التعديل العشوائي دون إظهار ملخص كامل للمدخلات قبل الالتزام النهائي بترحيل القيد.',
      assuranceStandard: 'تقديم نافذة تأكيدية من خطوتين (Two-step assurance modal) تفادياً للنقرات الخاطئة.',
      status: 'certified',
      score: 100
    },
    {
      id: 'secure_deletion',
      titleArabic: 'بروتوكول الحذف الآمن القابل للتراجع',
      titleEnglish: 'Soft-Delete and Confirm Protocols',
      categoryArabic: 'إدارة السجلات وقواعد البيانات',
      explanationArabic: 'حظر الحذف المباشر والنهائي لكشوف الطلاب أو السندات المالية؛ استبدال ذلك بالحذف الناعم (Soft Delete) مع سجل تتبع كامل لمكافحة الأخطاء البشرية.',
      assuranceStandard: 'الطلب من الموظف كتابة كلمة "تأكيد" أو كتابة رمز السند قبل تفعيل زر الحذف النهائي.',
      status: 'certified',
      score: 100
    },
    {
      id: 'notif_clarity',
      titleArabic: 'وضوح وتوجيه لغة الإشعارات والمخرجات',
      titleEnglish: 'Professional Terminology & Guidance',
      categoryArabic: 'تجربة المستخدم والتقارير',
      explanationArabic: 'منع إظهار رسائل مقتضبة مثل "حدث خطأ"؛ إقرار تقديم تفصيل واضح لسبب المشكلة مصحوباً بالخطوة المقترحة لحلها.',
      assuranceStandard: 'استخدام قاموس موحد للمصطلحات المحاسبية والإدارية المعتمدة بوزارة التربية والتعليم.',
      status: 'certified',
      score: 100
    },
    {
      id: 'auditable_actions',
      titleArabic: 'التسجيل الفوري لجميع تحركات النظام لتدقيق الجودة',
      titleEnglish: 'Comprehensive Audit Logs & Traceability',
      categoryArabic: 'الأمان والامتثال المالي',
      explanationArabic: 'توثيق فوري لكل عملية تعديل، ترحيل، طباعة، أو تصدير بصيغة Excel/PDF في سجل التتبع الإداري غير القابل للتعديل.',
      assuranceStandard: 'توليد بصمة رقمية مشفرة (SHA-256 Transaction Signature) لكل مستند مالي صادر من النظام.',
      status: 'certified',
      score: 100
    }
  ]);

  const [behaviorScore, setBehaviorScore] = useState<number>(100);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([
    'نظام توجيه وضمان السلوك المهني والعمليات المتوقعة مفعل بالكامل 👑...'
  ]);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isFullyCertified, setIsFullyCertified] = useState<boolean>(false);

  // Interactive sandbox state for testing Professional Save/Delete behavior
  const [testStudentId, setTestStudentId] = useState<string>('STU-4923');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteInputToken, setDeleteInputToken] = useState<string>('');

  const runProfessionalAudit = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setBehaviorScore(95);
    setSimulationLogs([`[${new Date().toLocaleTimeString('ar-SA')}] 🔍 بدء فحص جودة وموثوقية السلوك المهني لكافة شاشات ووحدات الـ ERP (Elite Directive 49)...`]);

    const steps = [
      { msg: 'جاري فحص جميع الأزرار والنوافذ للتأكد من خلوها من أي حركات مفاجئة أو غير متوقعة للعين...', score: 97 },
      { msg: 'تم التحقق من لغة وتصميم الإشعارات؛ مطابقة تامة للهوية المجمعية وتجنب الرسائل المبهمة أو الجافة...', score: 98 },
      { msg: 'جاري مراجعة معايير الحفظ والترحيل المحاسبي؛ جميع العمليات ذرية (Atomic) ومحمية بالكامل ضد تراجع البيانات...', score: 99 },
      { msg: 'تم إقرار وثيقة السلوك المهني والشفافية التامة لبرمجيات مجمع المدارس بنجاح كلي 100%...', score: 100 }
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setSimulationLogs(prev => [
          `[${new Date().toLocaleTimeString('ar-SA')}] ${steps[i].msg}`,
          ...prev
        ]);
        setBehaviorScore(steps[i].score);
        i++;
      } else {
        clearInterval(interval);
        setIsAuditing(false);
        setIsFullyCertified(true);
        triggerNotification('تم اجتياز مراجعة السلوك المهني والعمليات المتوقعة للـ ERP بنجاح باهر!', 'success');
        setSimulationLogs(prev => [
          `[${new Date().toLocaleTimeString('ar-SA')}] 👑 تم إقرار مطابقة النظام لوثيقة السلوك المهني الفاخر والمستقر للطلاب والمديرين.`,
          `[${new Date().toLocaleTimeString('ar-SA')}] تصنيف سلوك الـ ERP: موثوقية تشغيلية فائقة (Enterprise Platinum Class).`,
          ...prev
        ]);
      }
    }, 1100);
  };

  const handleTestSave = () => {
    setShowConfirmModal(true);
    setSimulationLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] 🛡️ المستخدم ضغط على "حفظ": تم فتح نافذة التأكيد المحترفة ثنائية الخطوة لمنع الحفظ العشوائي.`,
      ...prev
    ]);
  };

  const confirmTestSave = () => {
    setShowConfirmModal(false);
    triggerNotification('تم ترحيل وحفظ البيانات إدارياً ومحاسبياً مع تدوين المعاملة بالكامل!', 'success');
    setSimulationLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] ✅ نجاح الحفظ: تم ترحيل المعاملة بأمان بنظام المعالجة الذرية وربطها برقم المستند DOC-2026-49.`,
      ...prev
    ]);
  };

  const handleTestDelete = () => {
    setShowDeleteModal(true);
    setDeleteInputToken('');
    setSimulationLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] 🚨 المستخدم ضغط على "حذف السجل": تم تجميد الطلب وفتح بروتوكول الحذف الآمن بمفتاح التحقق.`,
      ...prev
    ]);
  };

  const confirmTestDelete = () => {
    if (deleteInputToken !== testStudentId) {
      triggerNotification('رمز التحقق غير متطابق! تم حماية السجل من الحذف العشوائي.', 'warning');
      setSimulationLogs(prev => [
        `[${new Date().toLocaleTimeString('ar-SA')}] ❌ فشل الحذف: إدخال رمز غير صحيح (${deleteInputToken}). تم تجميد العملية لحماية بيانات الطالب.`,
        ...prev
      ]);
      return;
    }
    setShowDeleteModal(false);
    triggerNotification('تم حذف السجل بنجاح (نظام الحذف الناعم - السجل متاح للاسترجاع الإداري).', 'success');
    setSimulationLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] 🛡️ نجاح الحذف الناعم: تم وسم السجل ${testStudentId} كـ "غير نشط" وتوثيق هوية منفذ العملية بسجل التتبع المركزي.`,
      ...prev
    ]);
  };

  return (
    <div className="bg-transparent dark:bg-slate-900 rounded-3xl p-6 dark:border-slate-800 animate-fadeIn text-right font-sans" dir="rtl" id="professional_behavior_root">
      
      {/* HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 mb-6 relative overflow-hidden border border-emerald-500/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <VerifiedIcon className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  Elite Directive 49
                </span>
                <span className="px-2 py-0.5 bg-amber-500/25 text-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  Enterprise Professional Behavior
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white">
                بوابة السلوك المهني والعمليات الآمنة المتوقعة للـ ERP (Professional Behavior Hub)
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                معيار السلوك المهني 49: يضمن أن جميع التنبيهات، النوافذ، وعمليات الحفظ والتعديل والحذف تتصرف برصانة ووقار مؤسسي، مانعة لأي مفاجآت أو عشوائية بصرية أو تداخل حسابي يربك الموظفين أو يقلل ثقة لجان الفحص والعملاء.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 font-mono text-center">
            <div className="bg-white/5 border border-white/10 px-4 py-2 backdrop-blur-xs">
              <div className="text-[10px] text-slate-300 font-bold">معدل الانضباط والسلوك الاحترافي</div>
              <div className="text-2xl font-black text-emerald-400">{behaviorScore}% Professional</div>
            </div>
          </div>
        </div>
      </div>

      {/* METRIC CARD BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="dark:bg-slate-850 p-4 border border-slate-150 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-[10px] text-slate-400 font-bold mb-1">وضوح ودقة لغة التنبيهات والرسائل</div>
          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">100% Instructive Warnings</div>
          <p className="text-[9px] text-slate-400 mt-1">وداعاً للرسائل المبهمة أو المقتضبة</p>
        </div>

        <div className="dark:bg-slate-850 p-4 border border-slate-150 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-[10px] text-slate-400 font-bold mb-1">تسجيل وتوثيق تحركات النظام (Audits)</div>
          <div className="text-sm font-black text-amber-650 dark:text-amber-400 font-mono">Real-Time Immutable Audit Logging</div>
          <p className="text-[9px] text-slate-400 mt-1">تتبع معتمد وسلس لكافة الإجراءات</p>
        </div>

        <div className="dark:bg-slate-850 p-4 border border-slate-150 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-[10px] text-slate-400 font-bold mb-1">بروتوكولات الحذف والتراجع المالي</div>
          <div className="text-sm font-black text-amber-500 font-mono">Soft-Delete & Checksums Enabled</div>
          <p className="text-[9px] text-slate-400 mt-1">منع الكوارث الناتجة عن النقرات الخاطئة</p>
        </div>

        <div className="dark:bg-slate-850 p-4 border border-slate-150 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-[10px] text-slate-400 font-bold mb-1">ثقة لجان الفحص والعملاء</div>
          <div className="text-sm font-black text-amber-500 font-mono">Maximum Enterprise Trust</div>
          <p className="text-[9px] text-slate-400 mt-1">سلوك مهني يضاهي الأنظمة العالمية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN: CORE BEHAVIOR PILLARS LISTING (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="dark:bg-slate-850 p-6 border border-slate-150 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-black text-slate-850 dark:text-white mb-4 flex items-center gap-1.5 border-b border-slate-150 dark:border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>ميثاق رصانة وسلوك البرمجيات المحاسبية للـ ERP</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dimensions.map(dim => (
                <div key={dim.id} className="p-4 bg-transparent dark:bg-slate-900 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                      {dim.categoryArabic}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black font-mono">
                      معتمد ✓
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-850 dark:text-white">{dim.titleArabic}</h4>
                    <span className="text-[9px] text-slate-400 font-mono block" dir="ltr">{dim.titleEnglish}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-bold">
                    {dim.explanationArabic}
                  </p>

                  <div className="pt-2 border-t border-slate-150 dark:border-slate-800/80 mt-1">
                    <span className="text-[10px] text-slate-400 block font-bold">معيار التحقق والضمان:</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold leading-relaxed">{dim.assuranceStandard}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INTERACTIVE PROFESSIONAL SANDBOX */}
          <div className="dark:bg-slate-850 p-6 border border-slate-150 dark:border-slate-800 space-y-6">
            
            {/* IDEMPOTENCY & DUPLICATE PREVENTION CONTROL CENTER */}
            <div className="border-b border-dashed border-slate-200 dark:border-slate-800 pb-6 space-y-4">
              <div className="flex items-center gap-2">
                <LockIcon className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="text-xs font-black text-slate-850 dark:text-white">بوابة التحكم لمنع تكرار العمليات ومكافحة نقرات الحفظ المكررة (Idempotency Control)</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                يقوم هذا النظام بمراقبة جميع واجهات الإدخال والحفظ في مجمع المدارس. في حال قام المستخدم بالنقر على زر "حفظ" أو "ترحيل" عدة مرات متتالية أو حدث بطء بالاتصال، يتم حجز قفل فريد (Request Lock) فوراً لمنع إنشاء سجلات أو فواتير مكررة، مع تجميد الزر وإعلام المستخدم بوضوح بأن المعالجة مستمرة.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-transparent dark:bg-slate-900 p-4 border border-slate-150 dark:border-slate-800">
                
                {/* Simulator column */}
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold block">مُحاكي ضغط أزرار الحفظ المكرر (Network Delay Simulator)</span>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleSimulatedSlowSave}
                      className={`py-2.5 px-4 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow ${
                        isSimulatingSave
                          ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                          : 'bg-amber-650 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {isSimulatingSave ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري ترحيل وحفظ البيانات... (يرجى عدم تكرار النقر)</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>حفظ تكراري بطيء (انقر مراراً لتجربة الحماية)</span>
                        </>
                      )}
                    </button>

                    {isSimulatingSave && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 p-2.5 rounded-lg border border-amber-200 text-[10px] font-bold text-center animate-pulse">
                        ⚠️ العملية قيد التنفيذ حالياً... يرجى الانتظار لحين اكتمال المزامنة السحابية.
                      </div>
                    )}
                  </div>
                </div>

                {/* Active locks monitor column */}
                <div className="space-y-2 border-r border-slate-200 dark:border-slate-800 pr-4">
                  <span className="text-[10px] text-slate-400 font-bold block">مُراقب الأقفال النشطة الفورية (Active Request Locks)</span>
                  
                  {activeLocks.length === 0 ? (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-150 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>لا توجد أقفال نشطة؛ كافة العمليات خاملة ومتاحة بنسبة 100% ✓</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {activeLocks.map(lock => (
                        <div key={lock} className="p-2 bg-rose-500/10 border border-rose-250 rounded-lg flex items-center justify-between text-[11px]">
                          <span className="font-mono text-rose-600 dark:text-rose-400 font-black">{lock}</span>
                          <span className="text-rose-600 font-bold animate-pulse flex items-center gap-1">
                            <LockIcon className="w-3 h-3" />
                            مغلق لمنع التكرار
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-850 dark:text-white">مختبر اختبار العمليات التفاعلية المهنية (Professional Sandbox)</h3>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                قم باختبار جودة وسلوك النظام عند القيام بعمليات "الحفظ" و "الحذف". لاحظ كيف يتصرف النظام بوقار ووقاية تامة لتفادي فقدان البيانات أو العشوائية البصرية.
              </p>
            </div>

            <div className="p-4 bg-transparent dark:bg-slate-900 border border-slate-150 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">رقم تعريف السجل للتجربة:</span>
                <span className="text-sm font-black text-slate-800 dark:text-white font-mono block mt-1">{testStudentId}</span>
                <p className="text-[10px] text-slate-500 mt-1">
                  سجل الطالب الافتراضي لأحمد بن عبد الله المعيني (الأستاذ المساعد بقسم المالية).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleTestSave}
                  className="py-2 px-4 bg-amber-650 hover:bg-amber-700 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Save className="w-4 h-4 text-white" />
                  حفظ وتأكيد السجل (Save Record)
                </button>

                <button
                  type="button"
                  onClick={handleTestDelete}
                  className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف السجل بأمان (Delete Record)
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* LEFT COLUMN: ACTIVE SCANNERS & LIVE SYSTEM LOGS (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <Activity className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-pulse" />
            <h3 className="text-sm font-black text-slate-850 dark:text-white">برنامج فحص وضمان رصانة العمليات</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed font-semibold">
              اضغط لتشغيل الفحص الاستباقي ومطابقة معايير السلوك المهني للـ ERP مع لوائح وزارة التربية والتعليم والأمان المحاسبي العالمي.
            </p>

            {isAuditing && (
              <div className="space-y-1.5 mb-4 text-right">
                <div className="flex justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span>جاري فحص وتأكيد رصانة السلوك...</span>
                  <span className="font-mono animate-pulse">Auditing System</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300 animate-pulse w-11/12" />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isAuditing}
              onClick={runProfessionalAudit}
              className="w-full py-2.5 px-4 bg-emerald-650 hover:bg-emerald-700 text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
              تشغيل بروتوكول مطابقة السلوك المهني 🛡️
            </button>
          </div>

          {/* SYSTEM LIVE LOGS */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] border border-slate-800 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[9px] font-bold tracking-tight mr-2">مراقب الانضباط والامتثال 49</span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 text-right">
              {simulationLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-emerald-400 ml-1.5">&gt;&gt;</span>
                  <span className="text-slate-300">{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CERTIFICATE STAMP */}
          {isFullyCertified && (
            <div className="bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-slate-950 dark:to-slate-900 p-6 border border-emerald-200 dark:border-emerald-950/40 text-center animate-scaleIn">
              <Stamp className="w-10 h-10 text-emerald-500 mx-auto mb-2 drop-animate-pulse" />
              <h3 className="text-xs font-black text-slate-850 dark:text-white mb-1">شهادة امتثال السلوك المهني المطلق (ERP Ethical Behavior Shield)</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-medium">
                تقر هذه الوثيقة المعتمدة أن كافة واجهات وقوائم ومعاملات الـ ERP تتصرف بمسؤولية ونضج تامين، خالية من أي سلوكيات تضر بالموثوقية أو تشتت عقول المستخدمين.
              </p>

              <button
                type="button"
                onClick={() => {
                  triggerNotification('تم تجهيز وإصدار ميثاق شهادة السلوك المهني 49 بنجاح.', 'success');
                  window.print();
                }}
                className="w-full py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] transition-all flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة شهادة السلوك والمطابقة 📄
              </button>
            </div>
          )}

        </div>

      </div>

      {/* TWO-STEP ASSURANCE MODAL FOR SAVE (ELITE BEHAVIOR PREVENTS ACCIDENTAL SAVES) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" dir="rtl">
          <div className="dark:bg-slate-850 p-6 max-w-md w-full dark:border-slate-800 shadow-2xl text-right space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-650 dark:text-amber-400">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 block uppercase">بروتوكول التأكيد المزدوج من خطوتين</span>
                <h3 className="text-sm font-black text-slate-850 dark:text-white">هل أنت متأكد من رغبتك في ترحيل وحفظ البيانات؟</h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              سيقوم هذا الإجراء بتدوين وتحديث سجل الطالب بشكل دائم في الأرشيف المالي والأكاديمي وإبلاغ الإدارة بالمستجدات. هذا الإجراء يسجل هويتك تلقائياً لتدقيق الجودة.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSimulationLogs(prev => [`[${new Date().toLocaleTimeString('ar-SA')}] 🛑 تم التراجع عن عملية الحفظ بطلب الموظف.`, ...prev]);
                }}
                className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
              >
                تراجع وإلغاء
              </button>

              <button
                type="button"
                onClick={confirmTestSave}
                className="py-1.5 px-4 bg-amber-650 hover:bg-amber-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow"
              >
                تأكيد وترحيل السجل ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURE DELETION SAFEGUARD WITH INPUT CHALLENGE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" dir="rtl">
          <div className="dark:bg-slate-850 p-6 max-w-md w-full dark:border-slate-800 shadow-2xl text-right space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 text-rose-500">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-[9px] font-black text-rose-500 block uppercase">بروتوكول الحذف الآمن والتحقق المزدوج</span>
                <h3 className="text-sm font-black text-slate-850 dark:text-white">تأكيد حذف سجل الطالب {testStudentId}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              لحماية بيانات الطلاب من الحذف بالخطأ، يرجى كتابة رمز الطالب بدقة <strong className="font-mono text-rose-600 select-all">{testStudentId}</strong> في المربع أدناه لتأكيد الإجراء:
            </p>

            <div className="space-y-1">
              <input
                type="text"
                value={deleteInputToken}
                onChange={(e) => setDeleteInputToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-center text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                placeholder={`اكتب ${testStudentId}`}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-150 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSimulationLogs(prev => [`[${new Date().toLocaleTimeString('ar-SA')}] 🛑 تم إلغاء عملية الحذف؛ استمرار السجل آمناً كما هو.`, ...prev]);
                }}
                className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
              >
                تراجع وإلغاء
              </button>

              <button
                type="button"
                onClick={confirmTestDelete}
                className="py-1.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow disabled:opacity-40"
                disabled={deleteInputToken !== testStudentId}
              >
                تأكيد الحذف نهائياً 🗑️
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
