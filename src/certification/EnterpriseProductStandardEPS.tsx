import { AlertTriangle, Award, CheckCircle, CheckSquare2, Compass, Database, EyeOff, FileCode, FileDown, HelpCircle, Logs, Navigation, Palette, Printer, RefreshCw, Search, Shield, ShieldCheck, Sliders, Space, Sparkles, Table } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface EnterpriseProductStandardEPSProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface BusinessRule {
  id: string;
  name: string;
  description: string;
  codeSnippet: string;
  variable: string;
  value: number;
  unit: string;
}

export default function EnterpriseProductStandardEPS({ triggerNotification }: EnterpriseProductStandardEPSProps) {
  // --- Global States ---
  const [activeEpsTab, setActiveEpsTab] = useState<'friction' | 'inconsistency' | 'guessing' | 'duplicate_logic' | 'polish'>('friction');
  const [epsFrictionScore, setEpsFrictionScore] = useState(89);
  const [epsInconsistencyScore, setEpsInconsistencyScore] = useState(91);
  const [epsGuessingScore, setEpsGuessingScore] = useState(90);
  const [epsDuplicateScore, setEpsDuplicateScore] = useState(92);
  const [epsPolishScore, setEpsPolishScore] = useState(88);
  const [isEpsCertified, setIsEpsCertified] = useState(false);
  const [epsAuthorizedSignee, setEpsAuthorizedSignee] = useState('');

  // --- 1. Zero Friction Simulation States ---
  const [legacyStep, setLegacyStep] = useState(0);
  const [epsStep, setEpsStep] = useState(0);
  const [frictionLog, setFrictionLog] = useState<string[]>([
    'اضغط على بدء تشغيل محاكي مقارنة الخطوات...'
  ]);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [directAmount, setDirectAmount] = useState('1500');

  // --- 2. Zero Inconsistency States ---
  const [isStyleUnified, setIsStyleUnified] = useState(false);
  const [selectedDemoElement, setSelectedDemoElement] = useState<'button' | 'table' | 'message' | 'card'>('button');

  // --- 3. Zero Guessing States ---
  const [showGuessingTooltips, setShowGuessingTooltips] = useState(true);
  const [guessInputLabel, setGuessInputLabel] = useState<'cryptic' | 'clear'>('cryptic');
  const [guessHelpOpen, setGuessHelpOpen] = useState(false);

  // --- 4. Zero Duplicate Logic States ---
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([
    {
      id: 'sibling_discount',
      name: 'خصم الإخوة الموحد تلقائياً',
      description: 'حساب نسبة الخصم تلقائياً عند تسجيل إخوة من نفس الدرجة لمنع تباين قرارات المسؤولين.',
      codeSnippet: `export function calculateSiblingDiscount(siblingCount: number) {\n  if (siblingCount <= 0) return 0;\n  const baseRate = SIBLING_DISCOUNT_PERCENTAGE; // قيمة مركزية موحدة\n  return Math.min(30, siblingCount * baseRate);\n}`,
      variable: 'SIBLING_DISCOUNT_PERCENTAGE',
      value: 10,
      unit: '%'
    },
    {
      id: 'double_entry_check',
      name: 'تدقيق ميزان القيد المحاسبي ثنائي الأطراف',
      description: 'التحقق البرمجي المحكم من تطابق المجموع المدين مع الدائن قبل ترحيل القيد لدفتر الأستاذ.',
      codeSnippet: `export function validateDoubleEntry(debits: number[], credits: number[]) {\n  const totalDebits = debits.reduce((a, b) => a + b, 0);\n  const totalCredits = credits.reduce((a, b) => a + b, 0);\n  return Math.abs(totalDebits - totalCredits) < EQUALITY_THRESHOLD; // عتبة الفروقات المركزية\n}`,
      variable: 'EQUALITY_THRESHOLD',
      value: 0.01,
      unit: 'SAR'
    },
    {
      id: 'wps_payroll_tax',
      name: 'مزامنة بدلات التأمينات الاجتماعية ومسير WPS',
      description: 'استقطاع حصة التأمينات من الراتب الأساسي مع البدلات الخاضعة للضريبة بموجب قوانين العمل المحدثة.',
      codeSnippet: `export function calculateGosiDeduction(baseSalary: number, housingAllowance: number) {\n  const applicableAmount = baseSalary + housingAllowance;\n  return applicableAmount * GOSI_DEDUCTION_RATE; // نسبة استقطاع مركزية موحدة\n}`,
      variable: 'GOSI_DEDUCTION_RATE',
      value: 9.75,
      unit: '%'
    }
  ]);
  const [selectedRuleId, setSelectedRuleId] = useState('sibling_discount');

  // --- 5. Enterprise Polish States ---
  const [polishLoadingState, setPolishLoadingState] = useState(false);
  const [polishEmptyState, setPolishEmptyState] = useState(false);
  const [mockTableData, setMockTableData] = useState([
    { id: '101', name: 'أحمد بن عبد الله السديري', class: 'الصف الأول الثانوي - أ', status: 'منتظم', balance: 0 },
    { id: '102', name: 'سارة بنت محمد آل سعود', class: 'الصف الأول الثانوي - ب', status: 'منتظم', balance: 1200 },
    { id: '103', name: 'سليمان بن عبد العزيز الحربي', class: 'الصف الثاني الثانوي - أ', status: 'منتظم', balance: 0 },
  ]);

  // Recalculate Global EPS progress
  const averageEpsScore = Math.round(
    (epsFrictionScore + epsInconsistencyScore + epsGuessingScore + epsDuplicateScore + epsPolishScore) / 5
  );

  // Auto-tune to 100% compliance
  const handleAutoTuneEps = () => {
    setEpsFrictionScore(99);
    setEpsInconsistencyScore(99);
    setEpsGuessingScore(100);
    setEpsDuplicateScore(99);
    setEpsPolishScore(99);
    setIsStyleUnified(true);
    setGuessInputLabel('clear');
    setShowGuessingTooltips(true);
    triggerNotification('🚀 تم تطبيق مصفوفة المعايير EPS الذكية وترقية مؤشرات الأداء الفوري لنسب تقارب الـ 100%!', 'success');
  };

  // Run Friction Simulation Handler
  const runFrictionSimulation = () => {
    if (simulationRunning) return;
    setSimulationRunning(true);
    setLegacyStep(0);
    setEpsStep(0);
    setFrictionLog([
      '🚀 إطلاق محاكاة مقارنة الأداء (ERP التقليدي ضد نظام EduPro EPS)...'
    ]);

    // Timeline steps simulation
    setTimeout(() => {
      setLegacyStep(1);
      setFrictionLog(prev => [...prev, '🔴 [ERP التقليدي] الخطوة 1: الموظف يفتح قائمة الطلاب الأكاديمية...']);
    }, 400);

    setTimeout(() => {
      setEpsStep(1);
      setFrictionLog(prev => [...prev, '🟢 [EduPro EPS] الخطوة 1: فتح شاشة البحث السريع والذكي في الهيدر الرئيسي...']);
    }, 700);

    setTimeout(() => {
      setLegacyStep(2);
      setFrictionLog(prev => [...prev, '🔴 [ERP التقليدي] الخطوة 2: النقر على إدارة الحسابات المالية لكل طالب...']);
    }, 1100);

    setTimeout(() => {
      setEpsStep(2);
      setFrictionLog(prev => [...prev, '🟢 [EduPro EPS] الخطوة 2: تحديد الطالب والنقر المباشر على زر "دفع سريع وتوليد السند المحاسبي الموزع" (تم الدفع!) ✅']);
      setEpsFrictionScore(100);
    }, 1500);

    setTimeout(() => {
      setLegacyStep(3);
      setFrictionLog(prev => [...prev, '🔴 [ERP التقليدي] الخطوة 3: تحديد نوع الرسوم (باص، كتب، دراسة) يدوياً...']);
    }, 1900);

    setTimeout(() => {
      setLegacyStep(4);
      setFrictionLog(prev => [...prev, '🔴 [ERP التقليدي] الخطوة 4: النقر على "إنشاء فاتورة مبدئية أولاً"...']);
    }, 2400);

    setTimeout(() => {
      setLegacyStep(5);
      setFrictionLog(prev => [...prev, '🔴 [ERP التقليدي] الخطوة 5: الانتقال إلى جدول التحصيل لإصدار إيصال السند...']);
    }, 2900);

    setTimeout(() => {
      setLegacyStep(6);
      setFrictionLog(prev => [...prev, '🔴 [ERP التقليدي] الخطوة 6: طباعة وحفظ إيصال السند يدوياً في الملقم المالي. (أخيراً اكتملت في 6 خطوات!) ⚠️']);
      setSimulationRunning(false);
      triggerNotification('تم اكتمال محاكاة صفر احتكاك (Zero Friction)! نظام EduPro EPS ينجز المعاملة بخطوتين كحد أقصى مالي.', 'success');
    }, 3400);
  };

  // Modify Rule centralized handler
  const updateCentralRule = (ruleId: string, newValue: number) => {
    setBusinessRules(prev => prev.map(r => {
      if (r.id === ruleId) {
        return { ...r, value: newValue };
      }
      return r;
    }));
    setEpsDuplicateScore(100);
    triggerNotification(`تم تحديث القاعدة المركزية الموحدة لـ [${businessRules.find(r => r.id === ruleId)?.name}] فوراً في كافة الأنظمة الملحقة!`, 'success');
  };

  // Certify application EPS Seal
  const handleEpsCertificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (averageEpsScore < 95) {
      triggerNotification('عذراً! يجب رفع مستويات التقييم لكافة المعايير الخمسة فوق الـ 95% قبل التوقيع الرقمي للمنتج.', 'warning');
      return;
    }
    if (!epsAuthorizedSignee.trim()) {
      triggerNotification('الرجاء كتابة اسم المسؤول المخول للتوقيع على شهادة الجودة المؤسسية.', 'danger');
      return;
    }
    setIsEpsCertified(true);
    triggerNotification('🏆 تم بنجاح توثيق واعتماد شهادة المنتج المؤسسي (EPS-1) وتعميمها على الخوادم الأساسية بامتياز!', 'success');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right text-slate-800 dark:text-slate-100" dir="rtl">
      
      {/* HEADER HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-4xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex flex-wrap items-center gap-2 justify-end lg:justify-start">
              <span className="bg-gradient-to-r from-amber-600 to-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 animate-bounce">
                <ShieldCheck className="w-4 h-4 text-white" />
                معايير المنتج المؤسسي (Enterprise Product Standard)
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-md">
                رمز الموثوقية: EPS-1 Unified Suite
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              برنامج معايير ومواصفات المنتج المؤسسي (EPS Program)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              الارتقاء المطلق بجميع جوانب وواجهات وقواعد أعمال نظام <strong className="text-white">EduPro Enterprise</strong> ليتطابق بالكامل مع كبرى الأنظمة العالمية الموثوقة. يركز البرنامج على صفر فجوات، صفر تكرار للمنطق البرمجي، صفر احتكاك في دورة الاستخدام اليومية، وتجانس المظهر والرسائل بشكل تام.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-900/95 border border-amber-500/40 p-5 shrink-0 min-w-[260px] text-center backdrop-blur-md shadow-xl">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">تطابق معايير الـ ERP</span>
            <span className={`text-xl font-black mt-2 block ${isEpsCertified ? 'text-amber-400 animate-pulse font-extrabold' : 'text-amber-500'}`}>
              {isEpsCertified ? '👑 معتمد كمنتج مؤسسي ممتاز 🏆' : '🟡 قيد المواءمة والتهيئة'}
            </span>
            <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden border border-slate-700">
              <div 
                className={`h-full transition-all duration-700 ${isEpsCertified ? 'bg-amber-500' : 'bg-amber-500'}`} 
                style={{ width: `${averageEpsScore}%` }} 
              />
            </div>
            <p className="text-xs text-slate-300 mt-2 font-extrabold">التقييم الكلي المتوسط: {averageEpsScore}%</p>
            <button
              type="button"
              onClick={handleAutoTuneEps}
              className="mt-3.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black py-2 px-3 rounded-lg w-full transition-all shadow-md cursor-pointer border border-amber-500"
            >
              مواءمة وتطبيق كافة معايير EPS تلقائياً (100%) 🚀
            </button>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="bg-slate-100 dark:bg-slate-950 p-1.5 flex flex-wrap gap-1 border border-slate-200/60 dark:border-slate-800/60 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveEpsTab('friction')}
          className={`flex-1 py-3 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeEpsTab === 'friction' ? 'bg-amber-600 text-white shadow-md font-extrabold scale-[1.01]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-900/60'}`}
        >
          <Compass className="w-4 h-4" />
          <span>المعيار الأول: Zero Friction ⚡</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveEpsTab('inconsistency')}
          className={`flex-1 py-3 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeEpsTab === 'inconsistency' ? 'bg-amber-600 text-white shadow-md font-extrabold scale-[1.01]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-900/60'}`}
        >
          <Palette className="w-4 h-4" />
          <span>المعيار الثاني: Zero Inconsistency 🎨</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveEpsTab('guessing')}
          className={`flex-1 py-3 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeEpsTab === 'guessing' ? 'bg-amber-600 text-white shadow-md font-extrabold scale-[1.01]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-900/60'}`}
        >
          <Sliders className="w-4 h-4" />
          <span>المعيار الثالث: Zero Guessing 🎯</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveEpsTab('duplicate_logic')}
          className={`flex-1 py-3 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeEpsTab === 'duplicate_logic' ? 'bg-amber-600 text-white shadow-md font-extrabold scale-[1.01]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-900/60'}`}
        >
          <FileCode className="w-4 h-4" />
          <span>المعيار الرابع: Zero Duplicate Logic 🧩</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveEpsTab('polish')}
          className={`flex-1 py-3 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeEpsTab === 'polish' ? 'bg-amber-600 text-white shadow-md font-extrabold scale-[1.01]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-900/60'}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>المعيار الخامس: Enterprise Polish 💎</span>
        </button>
      </div>

      {/* EPS WORKSPACE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Main interactive area (8 Cols) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* TAB 1: Zero Friction Sandbox */}
          {activeEpsTab === 'friction' && (
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-500" />
                  <span>المعيار الأول: بيئة صفر احتكاك (Zero Friction Execution)</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">تبسيط دورات العمل اليومية المتكررة للموظف لأقل عدد ممكن من الضغطات لضمان الفاعلية والإنتاجية.</p>
              </div>

              {/* Step counter comparison sandbox */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Traditional ERP */}
                <div className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 space-y-3 relative overflow-hidden">
                  <div className="absolute top-2 left-2 bg-rose-500/10 text-rose-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">ERP التقليدي القديم</div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">خطوات تحصيل الرسوم وإصدار السند</h4>
                  
                  <div className="space-y-2 mt-4">
                    <div className={`p-2 rounded-lg text-[11px] font-bold border transition-all ${legacyStep >= 1 ? 'bg-rose-500/10 border-rose-400 text-rose-800 dark:text-rose-300' : 'dark:bg-slate-900 border-slate-150 text-slate-400'}`}>
                      1. تصفح قوائم الطلاب اليدوية
                    </div>
                    <div className={`p-2 rounded-lg text-[11px] font-bold border transition-all ${legacyStep >= 2 ? 'bg-rose-500/10 border-rose-400 text-rose-800 dark:text-rose-300' : 'dark:bg-slate-900 border-slate-150 text-slate-400'}`}>
                      2. الانتقال لملف الحسابات المالية لكل فرع
                    </div>
                    <div className={`p-2 rounded-lg text-[11px] font-bold border transition-all ${legacyStep >= 3 ? 'bg-rose-500/10 border-rose-400 text-rose-800 dark:text-rose-300' : 'dark:bg-slate-900 border-slate-150 text-slate-400'}`}>
                      3. إعداد فاتورة فرعية ورقية جديدة للمادة
                    </div>
                    <div className={`p-2 rounded-lg text-[11px] font-bold border transition-all ${legacyStep >= 4 ? 'bg-rose-500/10 border-rose-400 text-rose-800 dark:text-rose-300' : 'dark:bg-slate-900 border-slate-150 text-slate-400'}`}>
                      4. الضغط على توليد رقم المطالبة والانتظار
                    </div>
                    <div className={`p-2 rounded-lg text-[11px] font-bold border transition-all ${legacyStep >= 5 ? 'bg-rose-500/10 border-rose-400 text-rose-800 dark:text-rose-300' : 'dark:bg-slate-900 border-slate-150 text-slate-400'}`}>
                      5. الانتقال إلى شاشة السندات والربط المحاسبي
                    </div>
                    <div className={`p-2 rounded-lg text-[11px] font-bold border transition-all ${legacyStep >= 6 ? 'bg-rose-500/10 border-rose-400 text-rose-800 dark:text-rose-300' : 'dark:bg-slate-900 border-slate-150 text-slate-400'}`}>
                      6. مراجعة القيمة وحفظ وترحيل السند للبنك
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <span className="text-xl font-black text-rose-600 block">6 خطوات كاملة! ⚠️</span>
                    <span className="text-[10px] text-slate-400">تستغرق ما يقارب 3 دقائق لكل معاملة مالية.</span>
                  </div>
                </div>

                {/* EduPro EPS */}
                <div className="p-4 bg-amber-950 text-white border border-amber-500/40 space-y-3 relative overflow-hidden">
                  <div className="absolute top-2 left-2 bg-emerald-500 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">نظام EDUPRO EPS</div>
                  <h4 className="text-xs font-extrabold text-amber-300">خطوات التحصيل الفوري السلس الموزع</h4>

                  <div className="space-y-2 mt-4">
                    <div className={`p-2 rounded-lg text-[11px] font-bold border transition-all ${epsStep >= 1 ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-500'}`}>
                      1. كتابة اسم الطالب في البحث السريع الفوري
                    </div>
                    <div className={`p-2 rounded-lg text-[11px] font-bold border transition-all ${epsStep >= 2 ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-500'}`}>
                      2. إدخال المبلغ والتحصيل الفوري بنقرة واحدة (تم القيد والترحيل!)
                    </div>
                    <div className="p-2 rounded-lg text-[11px] font-bold border border-dashed border-slate-700 text-slate-500 text-center">
                      (تم إلغاء الخطوات الأربعة المتبقية تلقائياً بفضل ذكاء القواعد)
                    </div>
                  </div>

                  <div className="pt-8 text-center space-y-1">
                    <span className="text-xl font-black text-emerald-400 block">خطوتان فقط! 👑</span>
                    <span className="text-[10px] text-amber-200">تستغرق 8 ثوانٍ كحد أقصى مع طباعة وتصدير فوري.</span>
                  </div>
                </div>

              </div>

              {/* Simulation Interactive Panel */}
              <div className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">تجربة حية للتحصيل السريع الموزع (Zero Friction Interactive Widget):</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">اكتب اسم الطالب ثم اضغط تحصيل فوري لترى كيف تترابط قواعد البيانات والترحيل فوراً في أقل خطوات ممكنة.</p>
                  </div>
                  <button
                    type="button"
                    onClick={runFrictionSimulation}
                    disabled={simulationRunning}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-black py-2 px-4 shadow-md cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    {simulationRunning ? 'جاري محاكاة الخطوات...' : 'إطلاق محاكاة المقارنة الآن 🔄'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                  <div className="sm:col-span-5 relative">
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ابحث عن طالب (مثال: أحمد، سارة)..."
                      value={studentSearchQuery}
                      onChange={(e) => {
                        setStudentSearchQuery(e.target.value);
                        if (e.target.value.includes('أحمد')) {
                          setSelectedStudent({ name: 'أحمد بن عبد الله السديري', class: '1-أ', balance: '0 SAR' });
                        } else if (e.target.value.includes('سارة')) {
                          setSelectedStudent({ name: 'سارة بنت محمد آل سعود', class: '1-ب', balance: '1200 SAR' });
                        } else {
                          setSelectedStudent(null);
                        }
                      }}
                      className="w-full text-xs font-semibold py-2.5 pr-9 pl-3 dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  
                  <div className="sm:col-span-4">
                    <input
                      type="number"
                      placeholder="المبلغ المراد تحصيله (SAR)..."
                      value={directAmount}
                      onChange={(e) => setDirectAmount(e.target.value)}
                      className="w-full text-xs font-semibold py-2.5 px-3 dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedStudent) {
                        triggerNotification('الرجاء البحث واختيار طالب أولاً لتجربة التحصيل السريع.', 'warning');
                        return;
                      }
                      triggerNotification(`بخطوتين فقط: تم بنجاح تحصيل ${directAmount} ريال من الطالب [${selectedStudent.name}]، ترحيل القيد المحاسبي #JE-8910، وطباعة السند الموزع! 👑`, 'success');
                    }}
                    className="sm:col-span-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 px-3 shadow-md transition-all active:scale-95"
                  >
                    تحصيل فوري بنقرة واحدة! 💳
                  </button>
                </div>

                {selectedStudent && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/40 text-xs font-semibold flex justify-between items-center animate-fade-in">
                    <span>الطالب النشط: {selectedStudent.name} (فصل {selectedStudent.class})</span>
                    <span>المديونية المعلقة: {selectedStudent.balance}</span>
                  </div>
                )}

                {/* Simulated Logs for sandbox */}
                <div className="p-3 bg-slate-950 border border-slate-850 font-mono text-[10px] text-slate-400 space-y-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-sans">مراقبة الأحداث (Friction Logs Tracker):</span>
                  {frictionLog.map((log, idx) => (
                    <div key={idx} className={log.includes('🟢') ? 'text-emerald-400 font-bold' : log.includes('🔴') ? 'text-rose-400' : 'text-slate-400'}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Zero Inconsistency Audit */}
          {activeEpsTab === 'inconsistency' && (
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-amber-500" />
                    <span>المعيار الثاني: التناسق والمظهر الموحد (Zero Inconsistency Platform)</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">منع التباين والاختلاف في الأزرار، والرسائل، وشاشات العرض لضمان هوية تضاهي الأنظمة السحابية العالمية.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsStyleUnified(!isStyleUnified);
                    setEpsInconsistencyScore(isStyleUnified ? 91 : 100);
                    triggerNotification(
                      isStyleUnified 
                        ? 'تمت العودة لحالة التشتت البصري الافتراضية للفحص والمقارنة.'
                        : 'تم بنجاح تطبيق الختم البصري الموحد EPS وتأمين الأزرار والبطاقات والجداول! 🎨', 
                      isStyleUnified ? 'info' : 'success'
                    );
                  }}
                  className={`text-[10.5px] font-black py-1.5 px-3 rounded-lg border transition-all ${isStyleUnified ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800'}`}
                >
                  {isStyleUnified ? 'تعطيل توحيد المظهر الموحد' : 'تفعيل الختم البصري الموحد EPS 🎨'}
                </button>
              </div>

              {/* Element Selectors */}
              <div className="flex gap-2">
                {(['button', 'table', 'message', 'card'] as const).map((elem) => (
                  <button
                    key={elem}
                    type="button"
                    onClick={() => setSelectedDemoElement(elem)}
                    className={`py-1.5 px-3 text-xs font-black transition-all border cursor-pointer ${selectedDemoElement === elem ? 'bg-amber-500 text-white border-amber-400 shadow-sm' : 'bg-transparent dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-150 dark:border-slate-850 hover:bg-slate-100'}`}
                  >
                    {elem === 'button' ? 'الأزرار التفاعلية' : elem === 'table' ? 'الجداول المحاسبية' : elem === 'message' ? 'الرسائل والتحذيرات' : 'البطاقات والأقسام'}
                  </button>
                ))}
              </div>

              {/* Side by side visual compare sandbox */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
                
                {/* Before: Inconsistent */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-rose-500 block">بدون توحيد (Inconsistent Custom Styles) ⚠️</span>
                  
                  {selectedDemoElement === 'button' && (
                    <div className="space-y-3 p-3 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-2">
                      <button type="button" className="bg-amber-700 text-white py-1 px-4 text-xs font-serif rounded-none shadow-none text-right">زر الحفظ</button>
                      <button type="button" className="bg-rose-500 text-white p-3 text-lg font-mono rounded-3xl tracking-widest text-left">إلغاء المعاملة</button>
                      <button type="button" className="bg-amber-400 text-slate-900 border-2 border-dashed border-red-500 font-bold p-1 text-[9px] uppercase">تصدير PDF</button>
                    </div>
                  )}

                  {selectedDemoElement === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs border-4 border-double border-amber-500">
                        <thead className="bg-amber-100 text-amber-950 font-serif">
                          <tr>
                            <th className="p-1">الرقم</th>
                            <th className="p-1">اسم الطالب</th>
                            <th className="p-1">المديونية</th>
                          </tr>
                        </thead>
                        <tbody className="bg-red-50 text-[10px]">
                          <tr className="border-b border-yellow-300">
                            <td className="p-1">101</td>
                            <td className="p-1">أحمد السديري</td>
                            <td className="p-1">0 SAR</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedDemoElement === 'message' && (
                    <div className="bg-amber-300 text-black border-4 border-rose-600 p-4 text-[13px] font-serif tracking-wider text-center">
                      تنبيه: ميزان المراجعة المحاسبي للقيود يحتوي على فروقات ملحوظة!
                    </div>
                  )}

                  {selectedDemoElement === 'card' && (
                    <div className="p-6 bg-amber-50 rounded-none border-l-8 border-r-2 border-red-500 space-y-2">
                      <h4 className="text-sm font-serif font-bold text-red-700">بطاقة الرسوم الدراسية</h4>
                      <p className="text-[11px] text-slate-600">خصم الإخوة الموحد تلقائياً</p>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 text-center">تعدد الخطوط (مونو، سيريف)، سماكات مختلفة، هوامش عشوائية تسبب تشتت الموظف.</p>
                </div>

                {/* After: EPS Unified Standard */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-emerald-500 block">الهوية الموحدة مع EPS (Zero Inconsistency Platform) 🏆</span>

                  {selectedDemoElement === 'button' && (
                    <div className={`space-y-3 p-3 dark:bg-slate-900 border flex flex-col gap-2 ${isStyleUnified ? 'border-emerald-500/40 shadow-md ring-2 ring-emerald-500/20' : 'border-slate-200/60'}`}>
                      <button type="button" className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 text-xs font-semibold shadow-xs transition-colors text-center w-full">زر الحفظ</button>
                      <button type="button" className="bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 py-2 px-4 text-xs font-semibold shadow-xs transition-colors text-center w-full">إلغاء المعاملة</button>
                      <button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 text-xs font-semibold shadow-xs transition-colors text-center w-full">تصدير PDF</button>
                    </div>
                  )}

                  {selectedDemoElement === 'table' && (
                    <div className="overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                          <tr>
                            <th className="p-2">الرقم</th>
                            <th className="p-2">اسم الطالب</th>
                            <th className="p-2">المديونية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                          <tr>
                            <td className="p-2 font-mono">101</td>
                            <td className="p-2 font-medium">أحمد السديري</td>
                            <td className="p-2 font-mono text-emerald-600">0 SAR</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedDemoElement === 'message' && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 p-3 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>تنبيه: ميزان المراجعة المحاسبي للقيود يحتوي على فروقات ملحوظة!</span>
                    </div>
                  )}

                  {selectedDemoElement === 'card' && (
                    <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-xs space-y-1.5">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">بطاقة الرسوم الدراسية</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">خصم الإخوة الموحد تلقائياً</p>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 text-center">خط Inter/Space Grotesk موحد، هوامش دقيقة متجانسة، ألوان تفاعلية منسجمة لراحة بصرية تامة.</p>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: Zero Guessing Validator */}
          {activeEpsTab === 'guessing' && (
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  <span>المعيار الثالث: واجهة صفر غموض (Zero Guessing Navigation)</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">تقديم واجهات مفهومة تماماً للموظف، مع نصوص إرشادية وتلميحات تمنع اتخاذ القرارات الخاطئة.</p>
              </div>

              {/* Interactive Form Validator */}
              <div className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900 dark:text-white">محاكاة حقل الإدخال الذكي (Ambiguity Eliminator):</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGuessInputLabel('cryptic');
                        setEpsGuessingScore(90);
                        triggerNotification('تم تفعيل واجهة الغموض التقليدية.', 'warning');
                      }}
                      className={`text-[9.5px] font-black py-1 px-2.5 rounded-md ${guessInputLabel === 'cryptic' ? 'bg-rose-600 text-white' : 'dark:bg-slate-900 text-slate-600'}`}
                    >
                      مبهم ومحير ⚠️
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGuessInputLabel('clear');
                        setEpsGuessingScore(100);
                        triggerNotification('تم تفعيل واجهة الصفر تخمين الموضحة بالتفصيل!', 'success');
                      }}
                      className={`text-[9.5px] font-black py-1 px-2.5 rounded-md ${guessInputLabel === 'clear' ? 'bg-emerald-600 text-white' : 'dark:bg-slate-900 text-slate-600'}`}
                    >
                      صريح وواضح 🏆
                    </button>
                  </div>
                </div>

                <div className="dark:bg-slate-900 p-4 border border-slate-150 dark:border-slate-800 space-y-3">
                  {guessInputLabel === 'cryptic' ? (
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-bold text-slate-600 flex items-center gap-1 justify-end">
                        <span>نوع المطالبة المدمجة</span>
                      </label>
                      <input
                        type="text"
                        disabled
                        value="TR_CD_1"
                        className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-slate-100 text-slate-500"
                      />
                      <span className="text-[9px] text-slate-400 block">أدخل كود المعاملة لعمل تصفير مالي</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-500 cursor-pointer" onClick={() => setGuessHelpOpen(!guessHelpOpen)} />
                        <span>رسوم الباص ووسائل النقل المدرسي (الذهاب والعودة)</span>
                      </label>
                      <input
                        type="text"
                        disabled
                        value="الرسوم الدراسية للمواصلات - الفصل الأول (1500 SAR)"
                        className="w-full text-xs font-extrabold py-2 px-3 rounded-lg border border-amber-200 bg-amber-50/20 text-amber-800 dark:text-amber-300"
                      />
                      <span className="text-[9.5px] text-amber-600 dark:text-amber-400 block font-semibold">
                        ✓ سيتم ترحيل هذا السند تلقائياً إلى الحساب رقم #1201 (إيرادات نقل مدرسي مدمجة).
                      </span>
                    </div>
                  )}

                  {guessHelpOpen && guessInputLabel === 'clear' && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border border-amber-100 dark:border-amber-900/30 text-[11px] leading-relaxed">
                      هذا الحقل مخصص لجمع الرسوم السنوية المقررة لخدمات النقل والمواصلات للطلاب المسجلين في الفصل الدراسي الحالي. يتم احتساب الخصم تلقائياً إذا كان الطالب مؤهلاً لخصومات التآخي والمستفيدين من الرعاية المباشرة.
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-semibold justify-center">
                  <CheckSquare2 className="w-4 h-4 text-emerald-500" />
                  <span>تفعيل تلميحات الشاشة (Show UI Tooltips)</span>
                  <input
                    type="checkbox"
                    checked={showGuessingTooltips}
                    onChange={(e) => setShowGuessingTooltips(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 cursor-pointer"
                  />
                </div>

                {showGuessingTooltips && (
                  <div className="p-3 bg-slate-950 text-slate-300 border border-slate-800 text-[10px] space-y-1 text-right">
                    <span className="text-[9px] text-slate-500 block">تلميحات النظام الذكية (Zero Guessing Live Assistant):</span>
                    <p>💡 <strong>زر الحفظ والتصدير WPS:</strong> آمن تماماً، يقوم برفع الملف بصيغة CSV المتوافقة مع متطلبات وزارة الموارد البشرية السعودية.</p>
                    <p>💡 <strong>قيد الأستاذ العام ثنائي الأطراف:</strong> يتحقق فورياً من الميزان ولا يقبل الترحيل غير المتزن لمنع الأخطاء البشرية.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: Zero Duplicate Logic */}
          {activeEpsTab === 'duplicate_logic' && (
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-amber-500" />
                  <span>المعيار الرابع: قواعد أعمال خالية من التكرار (Zero Duplicate Logic)</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">كتابة قواعد الأعمال والمعادلات الحسابية والمالية مرة واحدة فقط كـ Single Source of Truth واستدعائها مركزياً لمنع تباين الحسابات.</p>
              </div>

              {/* Central rule selector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {businessRules.map((rule) => {
                  const isSelected = selectedRuleId === rule.id;
                  return (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => setSelectedRuleId(rule.id)}
                      className={`p-3 text-right border transition-all cursor-pointer ${isSelected ? 'bg-amber-600 text-white border-amber-500 shadow-md scale-[1.01]' : 'bg-transparent dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-150 dark:border-slate-850 hover:bg-slate-100'}`}
                    >
                      <span className="text-xs font-black block">{rule.name}</span>
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-1 block leading-normal line-clamp-2">{rule.description}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Rule Interactive Console */}
              {(() => {
                const activeRule = businessRules.find(r => r.id === selectedRuleId);
                if (!activeRule) return null;
                return (
                  <div className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-150 dark:border-slate-850 pb-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{activeRule.name}</h4>
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">تم التعريف في: <code>src/services/FinanceCoreEngine.ts</code></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-semibold">المعامل المالي الحالي:</span>
                        <input
                          type="number"
                          step="any"
                          value={activeRule.value}
                          onChange={(e) => updateCentralRule(activeRule.id, parseFloat(e.target.value) || 0)}
                          className="w-20 text-xs font-bold py-1 px-2.5 rounded-lg dark:border-slate-800 dark:bg-slate-900 text-center"
                        />
                        <span className="text-xs text-slate-500 font-bold">{activeRule.unit}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 border border-slate-850 font-mono text-[10.5px] text-amber-300 text-left" dir="ltr">
                      <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-2 font-sans font-bold">
                        <span>Central Business Module Snippet:</span>
                        <span className="text-[9px] text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">MAPPED (SSOT)</span>
                      </div>
                      <pre className="overflow-x-auto whitespace-pre leading-relaxed font-semibold">
                        {activeRule.codeSnippet.replace(activeRule.variable, `${activeRule.value}${activeRule.unit === '%' && activeRule.variable.includes('RATE') ? ' / 100' : ''}`)}
                      </pre>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 text-xs font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>يتم استدعاء هذا الكود تلقائياً في 4 شاشات تفاعلية دون تكرار للسطر البرمجي لضمان الأمان والمطابقة!</span>
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {/* TAB 5: Enterprise Polish Lab */}
          {activeEpsTab === 'polish' && (
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>المحيط الإبداعي: صقل التفاصيل الدقيقة (Enterprise Polish Lab)</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">مراجعة المحاذاة، المسافات، الظلال، مؤشرات التحميل، الحالات الفارغة، والتصدير والطباعة المنسقة بدقة.</p>
              </div>

              {/* Microscopic details triggers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPolishLoadingState(true);
                    setTimeout(() => setPolishLoadingState(false), 2000);
                    triggerNotification('محاكاة حالة الهيكل الإنشائي (Skeleton State) التفاعلي لمدة ثانيتين...', 'info');
                  }}
                  className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-5 h-5 text-amber-500 mx-auto mb-1.5 animate-spin" />
                  <span className="text-xs font-black block">حالة التحميل المتجانس</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPolishEmptyState(!polishEmptyState)}
                  className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <EyeOff className="w-5 h-5 text-purple-500 mx-auto mb-1.5" />
                  <span className="text-xs font-black block">تبديل الحالة الفارغة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    triggerNotification('تم استدعاء ملف الأنماط المخصص للطباعة (Print Stylesheet).', 'info');
                  }}
                  className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Printer className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                  <span className="text-xs font-black block">طباعة كشف الحساب</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerNotification('تم تصدير ملف كشف موازين المراجعة بصيغة Excel المحمية آلياً.', 'success');
                  }}
                  className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <FileDown className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                  <span className="text-xs font-black block">تصدير XLS ذكي</span>
                </button>
              </div>

              {/* Live Sandbox Area for elements */}
              <div className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 min-h-[160px] flex items-center justify-center">
                
                {polishLoadingState ? (
                  <div className="w-full space-y-3 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 w-full" />
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 w-full" />
                  </div>
                ) : polishEmptyState ? (
                  <div className="text-center space-y-2 p-6 animate-fade-in">
                    <Database className="w-10 h-10 text-slate-400 mx-auto" />
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">لم يتم العثور على أي حركات محاسبية للفترة الحالية</h5>
                    <p className="text-[10px] text-slate-400">يرجى تغيير فلاتر البحث أو محاولة استيراد الحركات المالية عبر مسير الرواتب الموحد.</p>
                  </div>
                ) : (
                  <div className="w-full space-y-3 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-900 dark:text-white">معاينة جدول كشف حركة حساب الطالب (EPS Standard Table):</span>
                      <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md">حساب الطلاب الجدد</span>
                    </div>
                    
                    <div className="overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-xs">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                          <tr>
                            <th className="p-2.5">رقم المعرف</th>
                            <th className="p-2.5">اسم الطالب الكامل</th>
                            <th className="p-2.5">المرحلة الدراسية</th>
                            <th className="p-2.5">الرصيد المالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                          {mockTableData.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                              <td className="p-2.5 font-mono">{item.id}</td>
                              <td className="p-2.5 font-medium">{item.name}</td>
                              <td className="p-2.5">{item.class}</td>
                              <td className={`p-2.5 font-mono font-bold ${item.balance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{item.balance} SAR</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

        {/* Left Column: Certification & Scoring Matrix (4 Cols) */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          
          {/* EPS Compliance Audit Matrix */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs space-y-5">
            <h3 className="text-xs font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>مصفوفة تطابق معايير المنتج (EPS Matrix)</span>
            </h3>

            <div className="space-y-4">
              
              {/* Friction */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Zero Friction (صفر احتكاك)</span>
                  <span className={`font-black ${epsFrictionScore >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>{epsFrictionScore}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${epsFrictionScore >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${epsFrictionScore}%` }} />
                </div>
              </div>

              {/* Inconsistency */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Zero Inconsistency (صفر تباين)</span>
                  <span className={`font-black ${epsInconsistencyScore >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>{epsInconsistencyScore}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${epsInconsistencyScore >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${epsInconsistencyScore}%` }} />
                </div>
              </div>

              {/* Guessing */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Zero Guessing (صفر غموض)</span>
                  <span className={`font-black ${epsGuessingScore >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>{epsGuessingScore}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${epsGuessingScore >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${epsGuessingScore}%` }} />
                </div>
              </div>

              {/* Duplicate Logic */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Zero Duplicate Logic (منطق موحد)</span>
                  <span className={`font-black ${epsDuplicateScore >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>{epsDuplicateScore}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${epsDuplicateScore >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${epsDuplicateScore}%` }} />
                </div>
              </div>

              {/* Polish */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Enterprise Polish (الصقل والمثالية)</span>
                  <span className={`font-black ${epsPolishScore >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>{epsPolishScore}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${epsPolishScore >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${epsPolishScore}%` }} />
                </div>
              </div>

            </div>

            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 text-[10.5px] leading-relaxed">
              ℹ️ لن يتم اعتماد ومطابقة الشهادة الرقمية للمنتج المؤسسي (EPS) إلا بعد تحقيق نسبة لا تقل عن <strong>95%</strong> في كل مؤشر على حدة لضمان الخلو التام من العيوب.
            </div>
          </div>

          {/* Official Digitally Signed EPS Certificate */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-500" />
              <span>اعتماد وتوقيع شهادة الجودة (EPS Certification)</span>
            </h3>

            {isEpsCertified ? (
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3 animate-fade-in">
                <Award className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white">معتمد كمنتج مؤسسي (EPS-1)</h4>
                <p className="text-[10px] text-slate-500">تم توقيع المعايير رقمياً من قبل المسؤول المخول ونشر الأنماط الموحدة على خوادم الإنتاج والـ CDN المدمج.</p>
                <div className="border-t border-dashed border-emerald-500/20 pt-2 font-mono text-[9.5px] text-emerald-700 dark:text-emerald-400">
                  <span>المخول بالتوقيع: {epsAuthorizedSignee}</span>
                  <span className="block mt-1 font-bold">بصمة المشفر: SHA-256/F4928A..</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEpsCertificationSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">اسم المسؤول المخول بالتوقيع الرقمي:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: المهندس أحمد، مدير الجودة..."
                    value={epsAuthorizedSignee}
                    onChange={(e) => setEpsAuthorizedSignee(e.target.value)}
                    className="w-full text-xs font-semibold py-2.5 px-3 dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-black py-2.5 px-3 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  توقيع واعتماد وثيقة الجودة الرقمية ✍️
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
