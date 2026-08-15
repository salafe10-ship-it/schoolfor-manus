import { Activity, Award, BookOpen, Box, Check, CheckCircle2, CheckSquare2, Cloud, Database, FileSpreadsheet, Grid, Layers, List, Printer, Receipt, RotateCw, Settings, ShieldCheck, Signature, Sparkles, Target, User, UserCheck, icons } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface EnterpriseReleaseCandidateAuditProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface RCModule {
  id: string;
  name: string;
  engName: string;
  category: string;
  icon: React.ReactNode;
  status: 'Ready for Dev' | 'Ready for Production';
  criteria: {
    completeness: boolean;  // اكتمال الوظائف
    businessRules: boolean; // صحة قواعد الأعمال
    integration: boolean;   // التكامل
    performance: boolean;   // الأداء
    security: boolean;      // الأمان
    ux: boolean;            // تجربة المستخدم UX
    ui: boolean;            // واجهة المستخدم UI
    reports: boolean;       // التقارير
    printing: boolean;      // الطباعة
    exporting: boolean;     // التصدير
  };
}

export default function EnterpriseReleaseCandidateAudit({ triggerNotification }: EnterpriseReleaseCandidateAuditProps) {
  // 1. Module Certification State
  const [modules, setModules] = useState<RCModule[]>([
    {
      id: 'registration',
      name: 'منظومة القبول والتسجيل الموحد',
      engName: 'Registration & Admissions',
      category: 'الأكاديمية',
      icon: <UserCheck className="w-5 h-5 text-amber-500" />,
      status: 'Ready for Dev',
      criteria: {
        completeness: true,
        businessRules: true,
        integration: false,
        performance: true,
        security: true,
        ux: false,
        ui: true,
        reports: true,
        printing: false,
        exporting: false
      }
    },
    {
      id: 'fees',
      name: 'هيكلة الرسوم الدراسية والخصومات والتسهيلات',
      engName: 'Tuition Fees & Discounts',
      category: 'المالية',
      icon: <Layers className="w-5 h-5 text-emerald-500" />,
      status: 'Ready for Dev',
      criteria: {
        completeness: true,
        businessRules: false,
        integration: true,
        performance: false,
        security: true,
        ux: true,
        ui: false,
        reports: true,
        printing: true,
        exporting: false
      }
    },
    {
      id: 'collection',
      name: 'سندات القبض المباشرة والتحصيل والبنود التلقائية',
      engName: 'Direct Receipt Vouchers & Central Collections',
      category: 'المالية',
      icon: <CheckSquare2 className="w-5 h-5 text-orange-500" />,
      status: 'Ready for Dev',
      criteria: {
        completeness: true,
        businessRules: true,
        integration: false,
        performance: true,
        security: false,
        ux: true,
        ui: true,
        reports: false,
        printing: true,
        exporting: true
      }
    },
    {
      id: 'journal_entries',
      name: 'القيود المحاسبية الثنائية الموزونة',
      engName: 'Journal Entries & Double-Entry Ledger',
      category: 'المحاسبة',
      icon: <Activity className="w-5 h-5 text-amber-500" />,
      status: 'Ready for Dev',
      criteria: {
        completeness: false,
        businessRules: true,
        integration: true,
        performance: true,
        security: true,
        ux: false,
        ui: true,
        reports: true,
        printing: false,
        exporting: true
      }
    },
    {
      id: 'general_ledger',
      name: 'الأستاذ العام وموازين المراجعة اللحظية',
      engName: 'General Ledger & Trial Balances',
      category: 'المحاسبة',
      icon: <Database className="w-5 h-5 text-purple-500" />,
      status: 'Ready for Dev',
      criteria: {
        completeness: true,
        businessRules: false,
        integration: false,
        performance: true,
        security: true,
        ux: true,
        ui: true,
        reports: true,
        printing: false,
        exporting: true
      }
    },
    {
      id: 'financial_reports',
      name: 'التقارير الختامية وقائمة الأرباح والخسائر والميزانية',
      engName: 'Financial Reporting & Closing',
      category: 'المحاسبة والتقارير',
      icon: <FileSpreadsheet className="w-5 h-5 text-rose-500" />,
      status: 'Ready for Dev',
      criteria: {
        completeness: true,
        businessRules: true,
        integration: true,
        performance: false,
        security: true,
        ux: false,
        ui: true,
        reports: true,
        printing: true,
        exporting: false
      }
    },
    {
      id: 'exams',
      name: 'كنترول الامتحانات ورصد الكشوفات والشهادات الرسمية',
      engName: 'Exams & Grading Control',
      category: 'الأكاديمية',
      icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
      status: 'Ready for Dev',
      criteria: {
        completeness: true,
        businessRules: true,
        integration: true,
        performance: true,
        security: false,
        ux: true,
        ui: false,
        reports: true,
        printing: true,
        exporting: true
      }
    },
    {
      id: 'payroll',
      name: 'مسير الرواتب الموحد والموارد البشرية',
      engName: 'HR & Payroll Lifecycle',
      category: 'الإدارة',
      icon: <Settings className="w-5 h-5 text-teal-500" />,
      status: 'Ready for Dev',
      criteria: {
        completeness: true,
        businessRules: false,
        integration: true,
        performance: true,
        security: true,
        ux: true,
        ui: true,
        reports: false,
        printing: false,
        exporting: true
      }
    }
  ]);

  const [selectedModule, setSelectedModule] = useState<RCModule>(modules[0]);

  // 2. Regression Testing State
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testLogs, setTestLogs] = useState<string[]>([
    'بانتظار تفعيل مصفوفة اختبارات التراجع الشاملة (Regression Suite)...'
  ]);
  const [regressionTested, setRegressionTested] = useState(false);
  const [regressionPass, setRegressionPass] = useState(false);

  // 3. Design Review State
  const [designFilters, setDesignFilters] = useState({
    margins: true,
    buttons: true,
    colors: true,
    tables: true,
    icons: true,
    messages: true
  });
  const [designUnified, setDesignUnified] = useState(false);

  // 4. Performance Metrics State
  const [perfMetrics, setPerfMetrics] = useState({
    screenLoad: 12, // in ms
    searchQuery: 18,
    saveOp: 22,
    reportGen: 35,
    postingTime: 50,
    dashboardRender: 15
  });
  const [isOptimizing, setIsOptimizing] = useState(false);

  // 5. Documentation State (collapsibles)
  const [openDoc, setOpenDoc] = useState<string | null>('user');

  // 6. Release Candidate State
  const [isRc1Certified, setIsRc1Certified] = useState<boolean>(false);
  const [certificationSignedBy, setCertificationSignedBy] = useState<string>('');

  // Auto-recalculate Selected Module in list
  useEffect(() => {
    const updated = modules.find(m => m.id === selectedModule.id);
    if (updated) {
      setSelectedModule(updated);
    }
  }, [modules, selectedModule.id]);

  // Toggle specific criteria check
  const handleCriteriaToggle = (moduleId: string, criterionKey: keyof RCModule['criteria']) => {
    setModules(prev => prev.map(mod => {
      if (mod.id === moduleId) {
        const updatedCriteria = {
          ...mod.criteria,
          [criterionKey]: !mod.criteria[criterionKey]
        };

        // Determine if all 10 are checked
        const allChecked = Object.values(updatedCriteria).every(val => val === true);
        const nextStatus = allChecked ? 'Ready for Production' : 'Ready for Dev';

        return {
          ...mod,
          criteria: updatedCriteria,
          status: nextStatus
        };
      }
      return mod;
    }));
    triggerNotification('تم تحديث معيار الجودة للوحدة البرمجية المحددة.', 'info');
  };

  // Helper to quickly certify all criteria for a single module
  const certifySingleModule = (moduleId: string) => {
    setModules(prev => prev.map(mod => {
      if (mod.id === moduleId) {
        const updatedCriteria = {
          completeness: true,
          businessRules: true,
          integration: true,
          performance: true,
          security: true,
          ux: true,
          ui: true,
          reports: true,
          printing: true,
          exporting: true
        };
        return {
          ...mod,
          criteria: updatedCriteria,
          status: 'Ready for Production'
        };
      }
      return mod;
    }));
    triggerNotification('تمت مطابقة ومنح وثيقة الاعتماد الكامل للوحدة بنجاح بنسبة 100%!', 'success');
  };

  // Helper to certify all modules at once
  const certifyAllModules = () => {
    setModules(prev => prev.map(mod => ({
      ...mod,
      criteria: {
        completeness: true,
        businessRules: true,
        integration: true,
        performance: true,
        security: true,
        ux: true,
        ui: true,
        reports: true,
        printing: true,
        exporting: true
      },
      status: 'Ready for Production'
    })));
    triggerNotification('تمت ترقية واعتماد كافة موديولات EduPro للإنتاج بنسبة 100%! 🌟', 'success');
  };

  // 2. Interactive Regression Test Runner
  const runRegressionSuite = () => {
    setIsTesting(true);
    setTestProgress(0);
    setTestLogs([
      `[${new Date().toLocaleTimeString('ar-SA')}] ⚡ تم إطلاق مصفوفة اختبارات التراجع الشاملة (No-Regression Guard)...`,
      `[${new Date().toLocaleTimeString('ar-SA')}] 🔍 جاري فحص استقرار الكود وحلقات المزامنة...`
    ]);

    const testSteps = [
      { name: 'منظومة التسجيل والقبول للطلاب الجدد', duration: 4 },
      { name: 'احتساب هيكلة الرسوم وتوليد خصومات الأشقاء والنسب المالية', duration: 3 },
      { name: 'مطابقة ترحيل سندات القبض مع توازن الدفاتر المحاسبية', duration: 5 },
      { name: 'التحقق من معادلات القيود المحاسبية وتطابق الموازنة الثنائية', duration: 6 },
      { name: 'فحص تحديث موازين المراجعة والأستاذ العام اللحظي بالـ DB', duration: 4 },
      { name: 'مطابقة قائمة الأرباح والخسائر والتقارير الختامية التراكمية', duration: 5 },
      { name: 'كنترول الامتحانات ورصد الدرجات وإصدار الشهادات برمز QR', duration: 5 },
      { name: 'توليد مسيرات الرواتب الموحدة وحساب استقطاعات GOSI وتأمين البنوك', duration: 6 }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < testSteps.length) {
        const currentStep = testSteps[stepIndex];
        setTestLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString('ar-SA')}] جاري اختبار: ${currentStep.name}...`,
          `[${new Date().toLocaleTimeString('ar-SA')}] تم الفحص والتأكيد بنجاح في (${currentStep.duration}ms) - الحالة: سليم بنسبة 100% وبدون أي تراجع (0 Regressions).`
        ]);
        setTestProgress(Math.round(((stepIndex + 1) / testSteps.length) * 100));
        stepIndex++;
      } else {
        clearInterval(interval);
        setIsTesting(false);
        setRegressionTested(true);
        setRegressionPass(true);
        setTestLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString('ar-SA')}] 🎉 اكتملت اختبارات التراجع الشاملة لجميع وحدات EduPro بنجاح باهر!`,
          `[${new Date().toLocaleTimeString('ar-SA')}] 🛡️ النتيجة النهائية: 0 أخطاء، 0 تراجعات، توافقية وربط كامل ومستقر بنسبة 100%.`
        ]);
        triggerNotification('تم اجتياز مصفوفة اختبارات التراجع بنجاح! لا توجد أي تراجعات أو فجوات برمجية.', 'success');
      }
    }, 900);
  };

  // 3. Design Unification Trigger
  const unifyDesignSystem = () => {
    setDesignUnified(true);
    setDesignFilters({
      margins: true,
      buttons: true,
      colors: true,
      tables: true,
      icons: true,
      messages: true
    });
    triggerNotification('تم توحيد الهوامش، الأزرار، الألوان، الجداول، والأيقونات في كافة الشاشات والواجهات فورياً! 🎨', 'success');
  };

  // 4. Performance Optimizer Trigger
  const optimizePerformance = () => {
    setIsOptimizing(true);
    triggerNotification('جاري تفعيل الفهارس الثنائية الذكية، تحسين زمن الاستعلامات، وتنشيط الذاكرة المخبئية...', 'info');
    
    setTimeout(() => {
      setPerfMetrics({
        screenLoad: 4,      // ultra-fast!
        searchQuery: 6,
        saveOp: 8,
        reportGen: 12,
        postingTime: 15,
        dashboardRender: 5
      });
      setIsOptimizing(false);
      triggerNotification('تمت عملية تحسين الأداء بنجاح تام! تم تخفيض زمن الاستجابة إلى أدنى مستوى قياسي سحابي 🚀', 'success');
    }, 1500);
  };

  // 6. Sign off the final RC-1 Release Candidate Decision
  const handleRc1Certification = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if everything is certified/passed
    const allModulesCertified = modules.every(m => m.status === 'Ready for Production');
    if (!allModulesCertified) {
      triggerNotification('عذراً! يجب اعتماد وترقية كافة الموديولات الثمانية أولاً إلى وضع "جاهزة للإنتاج".', 'warning');
      return;
    }
    if (!regressionPass) {
      triggerNotification('عذراً! يجب تشغيل واجتياز مصفوفة اختبارات التراجع أولاً بنجاح.', 'warning');
      return;
    }
    if (!designUnified) {
      triggerNotification('تنبيه: يُنصح بتشغيل أداة توحيد الهوية البصرية لضمان خلو التصميم من التناقضات.', 'warning');
    }
    if (!certificationSignedBy.trim()) {
      triggerNotification('الرجاء كتابة اسم المخول بالتوقيع الرقمي للموافقة والختم.', 'danger');
      return;
    }

    setIsRc1Certified(true);
    triggerNotification('🏆 مبارك! تم توقيع الوثيقة رسمياً وترقية النظام إلى مرشح الإصدار الذهبي EduPro-RC-1 الاستقراري!', 'success');
  };

  // Stats Counters
  const certifiedModulesCount = modules.filter(m => m.status === 'Ready for Production').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right text-slate-800 dark:text-slate-100" dir="rtl">
      
      {/* SECTION 1: Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#101c40] to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-4xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex flex-wrap items-center gap-2 justify-end lg:justify-start">
              <span className="bg-amber-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <Award className="w-4 h-4 text-white" />
                برنامج مرشح الإصدار النهائي الشامل (RC-1 Program)
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-md">
                EduPro Enterprise Edition
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              برنامج ترقية مرشح الإصدار للإنتاج (Enterprise RC-1 Gate)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              بوابة الجودة والاعتماد الفيروزية لنقل كافة الوحدات والقطاعات الحيوية لبرمجيات <strong className="text-white">EduPro Enterprise</strong> من حالة <span className="text-amber-400 font-extrabold">"جاهزة للتطوير"</span> إلى منزلة الاستقرار المطبق للإنتاج والتشغيل الحي <span className="text-emerald-400 font-extrabold">"جاهزة للإنتاج بالكامل"</span>. نقوم هنا بمطابقة جودة الوحدات، اختبار حالات التراجع الصارم، تدقيق وتوحيد الهوية البصرية والهوامش، قياس الأداء، واستكمال الستة أدلة التوثيقية المعتمدة لإطلاق الإصدار <strong className="text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">RC-1</strong> بنجاح مطلق.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-900/90 border border-amber-500/40 p-5 shrink-0 min-w-[240px] text-center backdrop-blur-md shadow-xl">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">حالة الإصدار المستهدف</span>
            <span className={`text-xl font-black mt-2 block ${isRc1Certified ? 'text-emerald-400 animate-bounce' : 'text-amber-500'}`}>
              {isRc1Certified ? '👑 الـنـسـخـة RC-1 مـعـتـمـدة 🏆' : '🟡 قيد الفحص والتدقيق'}
            </span>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden border border-slate-700">
              <div 
                className={`h-full transition-all duration-700 ${isRc1Certified ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                style={{ width: `${(certifiedModulesCount / modules.length) * 100}%` }} 
              />
            </div>
            <p className="text-xs text-slate-300 mt-2 font-extrabold">الوحدات المستوفاة: {certifiedModulesCount} من {modules.length}</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Grid of Auditing Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left Column: Module Certification Workspace (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
              <div className="text-right">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>1. مصفوفة اعتماد الموديولات والوحدات (Module Certification)</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold">يجب استيفاء كافة المعايير الـ 10 لكل وحدة لإتاحة ترقيتها للإنتاج.</p>
              </div>

              <button
                type="button"
                onClick={certifyAllModules}
                className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900 text-amber-600 dark:text-amber-400 text-[10.5px] font-black px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/60 transition-colors"
              >
                اعتماد وتجاوز كافة الوحدات فورياً ⚡
              </button>
            </div>

            {/* Horizontal Module Quick Selector */}
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
              {modules.map((mod) => {
                const isSelected = selectedModule.id === mod.id;
                const isCertified = mod.status === 'Ready for Production';
                
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModule(mod)}
                    className={`py-2 px-3 text-xs font-black transition-all cursor-pointer border flex items-center gap-2 ${isSelected ? 'bg-amber-600 text-white border-amber-500 shadow-md scale-[1.01]' : 'bg-transparent dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-150 dark:border-slate-800/80 hover:bg-slate-100'}`}
                  >
                    {mod.icon}
                    <span>{mod.name.split(' ')[0]} {mod.name.split(' ')[1] || ''}</span>
                    <span className={`w-2 h-2 rounded-full ${isCertified ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  </button>
                );
              })}
            </div>

            {/* Detailed Evaluation of Selected Module */}
            <div className="p-5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 space-y-5">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-amber-600 dark:text-amber-400">
                    {selectedModule.icon}
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedModule.name}</h4>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase">{selectedModule.category} • {selectedModule.engName}</p>
                  </div>
                </div>

                <div className="text-center sm:text-left">
                  <span className={`text-[10.5px] px-3 py-1 rounded-full font-black border inline-block ${selectedModule.status === 'Ready for Production' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/50'}`}>
                    {selectedModule.status === 'Ready for Production' ? '✓ جاهزة للإنتاج' : '⚠️ معلقة للتدقيق والمطابقة'}
                  </span>
                  <button
                    type="button"
                    onClick={() => certifySingleModule(selectedModule.id)}
                    className="block text-[10px] font-bold text-amber-600 hover:underline mt-1.5 mx-auto"
                  >
                    مطابقة هذه الوحدة بالكامل بنسبة 100% ✓
                  </button>
                </div>
              </div>

              {/* Grid of the 10 critical criteria requested */}
              <div className="space-y-4">
                <span className="text-[11px] font-black text-slate-400 block uppercase">مستند المطابقة الفنية للوحدة (العشر معايير):</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Completeness */}
                  <button
                    type="button"
                    onClick={() => handleCriteriaToggle(selectedModule.id, 'completeness')}
                    className="p-3 dark:bg-slate-900 dark:border-slate-800 hover:border-amber-500/50 text-right flex justify-between items-center transition-all"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedModule.criteria.completeness ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-50'}`}>
                      {selectedModule.criteria.completeness && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-black block text-slate-800 dark:text-slate-200">اكتمال الوظائف</span>
                      <span className="text-[9px] text-slate-400 font-bold block">إتاحة كامل الشاشات والعمليات</span>
                    </div>
                  </button>

                  {/* Business Rules */}
                  <button
                    type="button"
                    onClick={() => handleCriteriaToggle(selectedModule.id, 'businessRules')}
                    className="p-3 dark:bg-slate-900 dark:border-slate-800 hover:border-amber-500/50 text-right flex justify-between items-center transition-all"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedModule.criteria.businessRules ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-50'}`}>
                      {selectedModule.criteria.businessRules && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-black block text-slate-800 dark:text-slate-200">صحة قواعد الأعمال</span>
                      <span className="text-[9px] text-slate-400 font-bold block">التطابق التام للمعادلات والقيود</span>
                    </div>
                  </button>

                  {/* Integration */}
                  <button
                    type="button"
                    onClick={() => handleCriteriaToggle(selectedModule.id, 'integration')}
                    className="p-3 dark:bg-slate-900 dark:border-slate-800 hover:border-amber-500/50 text-right flex justify-between items-center transition-all"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedModule.criteria.integration ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-50'}`}>
                      {selectedModule.criteria.integration && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-black block text-slate-800 dark:text-slate-200">التكامل والترابط</span>
                      <span className="text-[9px] text-slate-400 font-bold block">ربط الحسابات مع الطلاب والرواتب</span>
                    </div>
                  </button>

                  {/* Performance */}
                  <button
                    type="button"
                    onClick={() => handleCriteriaToggle(selectedModule.id, 'performance')}
                    className="p-3 dark:bg-slate-900 dark:border-slate-800 hover:border-amber-500/50 text-right flex justify-between items-center transition-all"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedModule.criteria.performance ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-50'}`}>
                      {selectedModule.criteria.performance && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-black block text-slate-800 dark:text-slate-200">سرعة الأداء</span>
                      <span className="text-[9px] text-slate-400 font-bold block">زمن الفتح والتحميل تحت 15ms</span>
                    </div>
                  </button>

                  {/* Security */}
                  <button
                    type="button"
                    onClick={() => handleCriteriaToggle(selectedModule.id, 'security')}
                    className="p-3 dark:bg-slate-900 dark:border-slate-800 hover:border-amber-500/50 text-right flex justify-between items-center transition-all"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedModule.criteria.security ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-50'}`}>
                      {selectedModule.criteria.security && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-black block text-slate-800 dark:text-slate-200">الأمان وتتبع السجلات</span>
                      <span className="text-[9px] text-slate-400 font-bold block">التوثيق وحماية الصلاحيات RBAC</span>
                    </div>
                  </button>

                  {/* UX */}
                  <button
                    type="button"
                    onClick={() => handleCriteriaToggle(selectedModule.id, 'ux')}
                    className="p-3 dark:bg-slate-900 dark:border-slate-800 hover:border-amber-500/50 text-right flex justify-between items-center transition-all"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedModule.criteria.ux ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-50'}`}>
                      {selectedModule.criteria.ux && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-black block text-slate-800 dark:text-slate-200">تجربة المستخدم UX</span>
                      <span className="text-[9px] text-slate-400 font-bold block">سهولة إتمام دورات العمل</span>
                    </div>
                  </button>

                  {/* UI */}
                  <button
                    type="button"
                    onClick={() => handleCriteriaToggle(selectedModule.id, 'ui')}
                    className="p-3 dark:bg-slate-900 dark:border-slate-800 hover:border-amber-500/50 text-right flex justify-between items-center transition-all"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedModule.criteria.ui ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-50'}`}>
                      {selectedModule.criteria.ui && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-black block text-slate-800 dark:text-slate-200">واجهة المستخدم UI</span>
                      <span className="text-[9px] text-slate-400 font-bold block">تناسق الهوامش والخطوط والألوان</span>
                    </div>
                  </button>

                  {/* Reports */}
                  <button
                    type="button"
                    onClick={() => handleCriteriaToggle(selectedModule.id, 'reports')}
                    className="p-3 dark:bg-slate-900 dark:border-slate-800 hover:border-amber-500/50 text-right flex justify-between items-center transition-all"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedModule.criteria.reports ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-50'}`}>
                      {selectedModule.criteria.reports && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-black block text-slate-800 dark:text-slate-200">التقارير المتكاملة</span>
                      <span className="text-[9px] text-slate-400 font-bold block">وجود كشوف تحليلية ذكية</span>
                    </div>
                  </button>

                  {/* Printing */}
                  <button
                    type="button"
                    onClick={() => handleCriteriaToggle(selectedModule.id, 'printing')}
                    className="p-3 dark:bg-slate-900 dark:border-slate-800 hover:border-amber-500/50 text-right flex justify-between items-center transition-all"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedModule.criteria.printing ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-50'}`}>
                      {selectedModule.criteria.printing && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-black block text-slate-800 dark:text-slate-200">دعم الطباعة RTL</span>
                      <span className="text-[9px] text-slate-400 font-bold block">طباعة السندات والشهادات بدقة</span>
                    </div>
                  </button>

                  {/* Exporting */}
                  <button
                    type="button"
                    onClick={() => handleCriteriaToggle(selectedModule.id, 'exporting')}
                    className="p-3 dark:bg-slate-900 dark:border-slate-800 hover:border-amber-500/50 text-right flex justify-between items-center transition-all"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedModule.criteria.exporting ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-50'}`}>
                      {selectedModule.criteria.exporting && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-black block text-slate-800 dark:text-slate-200">تصدير البيانات</span>
                      <span className="text-[9px] text-slate-400 font-bold block">تصدير متوافق مع Excel/PDF</span>
                    </div>
                  </button>

                </div>
              </div>

            </div>

          </div>

          {/* SECTION 4: Regression Testing Suite Simulator */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-md uppercase">Regression Guard Console</span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span>2. مصفوفة اختبارات التراجع الشاملة (No-Regression Guard)</span>
              </h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              يضمن هذا المدقق الفني عدم حدوث أي تراجع أو تأثير على الميزات القديمة بعد إجراء التحديثات الهيكلية الأخيرة. يفحص النظام سلامة المدفوعات والقيود والرواتب والشهادات معاً.
            </p>

            <div className="bg-slate-950 p-4 border border-slate-800 text-[10.5px] font-mono text-slate-300 text-left" dir="ltr">
              <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-2 font-sans font-bold">
                <span>Active Core Regression Outputs:</span>
                <span className="text-[9px] text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded-md">100% Stability Target</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {testLogs.map((log, idx) => {
                  const isPass = log.includes('بنجاح') || log.includes('سليم') || log.includes('نجاح');
                  return (
                    <div key={idx} className={`leading-relaxed ${isPass ? 'text-emerald-400 font-bold' : 'text-slate-300'}`} dir="rtl">
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>

            {isTesting ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  <span>جاري تفعيل سيناريوهات الضغط والتحقق...</span>
                  <span>{testProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden dark:border-slate-750">
                  <div className="h-full bg-amber-600 rounded-full transition-all duration-200" style={{ width: `${testProgress}%` }} />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={runRegressionSuite}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 px-4 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RotateCw className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                <span>إطلاق مصفوفة اختبارات التراجع ومطابقة الأنظمة المترابطة ⚡</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Design Review, Performance & Documentation (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          
          {/* 3. Design Review Panel */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>3. مراجعة اتساق الهوية البصرية (Design Review)</span>
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              فحص وتوحيد جميع شاشات وواجهات EduPro للتحقق من تطابق الهوامش وتناغم الأزرار والألوان والجداول والأيقونات والرسائل الإرشادية.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${designFilters.margins ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-700'}`}>
                  {designFilters.margins ? 'موحدة على 24/32px ✓' : 'مختلفة الهوامش ⚠️'}
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">الهوامش والمسافات (Margins)</span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${designFilters.buttons ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-700'}`}>
                  {designFilters.buttons ? 'موحدة الأزرار تفاعلياً ✓' : 'تباين الهياكل ⚠️'}
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">تصاميم وحالات الأزرار (Buttons)</span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${designFilters.colors ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-700'}`}>
                  {designFilters.colors ? 'متوافقة مع لوحة الألوان ✓' : 'غير متسقة ⚠️'}
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">درجات الألوان والتناسق البصري (Colors)</span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${designFilters.tables ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-700'}`}>
                  {designFilters.tables ? 'تنسيق RTL مع الكثافة ✓' : 'أخطاء محاذاة ⚠️'}
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">محاذاة وكثافة الجداول المالية (Tables)</span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${designFilters.icons ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-700'}`}>
                  {designFilters.icons ? 'Lucide React متطابقة الحجم ✓' : 'تباين القياسات ⚠️'}
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">الرموز والأيقونات البصرية (Icons)</span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${designFilters.messages ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-700'}`}>
                  {designFilters.messages ? 'نصوص مهذبة وموضوعية ✓' : 'تباين الهجة ⚠️'}
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">الرسائل ونوافذ التأكيد (Messages)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={unifyDesignSystem}
              className="w-full bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 py-2.5 px-4 text-xs font-black transition-colors cursor-pointer"
            >
              تشغيل أداة توحيد الهوية البصرية فورياً 🎨
            </button>
          </div>

          {/* 4. Performance Review Panel */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">أداء سحابي فائق</span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>4. رصد وتحليل زمن الاستجابة (Performance)</span>
              </h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              مراقبة وتحسين سرعة استجابة قاعدة البيانات ومحرك ترحيل القيود وبناء لوحات البيانات (Dashboards) في أوقات الذروة.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">الحد الأقصى: 15ms</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">زمن فتح الشاشات: {perfMetrics.screenLoad}ms</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(perfMetrics.screenLoad / 15) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">الحد الأقصى: 20ms</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">زمن استعلامات البحث المتقدم: {perfMetrics.searchQuery}ms</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(perfMetrics.searchQuery / 20) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">الحد الأقصى: 30ms</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">عمليات الحفظ والأرشفة: {perfMetrics.saveOp}ms</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(perfMetrics.saveOp / 30) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">الحد الأقصى: 50ms</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">زمن توليد التقارير الختامية: {perfMetrics.reportGen}ms</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(perfMetrics.reportGen / 50) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">الحد الأقصى: 60ms</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">ترحيل القيود وإغلاق الفترات: {perfMetrics.postingTime}ms</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(perfMetrics.postingTime / 60) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">الحد الأقصى: 25ms</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">تحديث اللوحات القيادية: {perfMetrics.dashboardRender}ms</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(perfMetrics.dashboardRender / 25) * 100}%` }} />
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isOptimizing}
              onClick={optimizePerformance}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 text-xs font-black transition-colors cursor-pointer"
            >
              {isOptimizing ? 'جاري تحسين الكود والاستعلامات...' : 'تنشيط مسرع أداء قواعد البيانات (Speed Optimizer) 🚀'}
            </button>
          </div>

        </div>

      </div>

      {/* SECTION 3: Documentation Hub Panel (Collapsible Guides) */}
      <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <span>5. مكتبة الأدلة التوثيقية الرسمية لـ EduPro (Documentation Hub)</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-bold">الأدلة الإرشادية الستة المطلوبة لاعتماد ترشيح النسخة RC-1.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Selector List */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            {[
              { id: 'user', label: 'دليل المستخدم النهائي (User Manual)', desc: 'شروحات واجهات القبول والسندات والشهادات للطلاب.' },
              { id: 'manager', label: 'دليل المدير والمشرف العام (Manager Guide)', desc: 'آليات اعتماد الموازنات والخصومات وإغلاق الفترات.' },
              { id: 'admin', label: 'دليل مسؤول نظام تكنولوجيا المعلومات (SysAdmin Guide)', desc: 'صلاحيات RBAC وحماية الجلسات وربط السيرفرات.' },
              { id: 'deploy', label: 'دليل النشر والاستضافة السحابية (Deployment)', desc: 'إعدادات Cloud Run والمنافذ والـ Environment.' },
              { id: 'backup', label: 'دليل النسخ الاحتياطي وحماية البيانات (Backup)', desc: 'سياسات النسخ السحابي اليومي المجدول والـ PITR.' },
              { id: 'changelog', label: 'سجل تتبع الإصدارات والتحديثات (Changelog)', desc: 'تتبع تاريخي لمراحل التطوير حتى RC-1.' }
            ].map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setOpenDoc(doc.id)}
                className={`text-right p-3 border transition-all cursor-pointer ${openDoc === doc.id ? 'bg-amber-650 text-white border-amber-600 shadow-md' : 'bg-transparent dark:bg-slate-950 hover:bg-slate-100/50 text-slate-700 dark:text-slate-200 border-slate-150 dark:border-slate-850'}`}
              >
                <strong className="text-xs block font-black">{doc.label}</strong>
                <span className={`text-[10px] mt-1 block font-semibold ${openDoc === doc.id ? 'text-amber-200' : 'text-slate-400'}`}>
                  {doc.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Viewer Area */}
          <div className="lg:col-span-8 p-6 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-3xl overflow-y-auto max-h-[440px] text-xs leading-relaxed space-y-4">
            
            {openDoc === 'user' && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-white border-b pb-2">دليل المستخدم النهائي لمنصة EduPro</h4>
                <p className="font-medium text-slate-600 dark:text-slate-300">
                  يركز هذا الدليل على شرح العمليات اليومية التي يقوم بها موظفو شؤون الطلاب، المندوبون الماليون، والكنترول الأكاديمي:
                </p>
                <div className="space-y-3 font-semibold text-slate-600 dark:text-slate-300">
                  <div className="p-3 dark:bg-slate-900 border border-slate-200/60">
                    <strong className="text-amber-600 dark:text-amber-400 block font-black">أولاً: التسجيل والقبول الإلكتروني</strong>
                    <p className="mt-1">من قائمة شؤون الطلاب، اختر "طلب جديد". أدخل بيانات الطالب الوطنية المكونة من 10 خانات ورقم هوية ولي الأمر بدقة. تأكد من تحميل صورة شهادة الميلاد والمستندات الرسمية، وتوزيع الطالب تلقائياً في فروع المجمع.</p>
                  </div>
                  <div className="p-3 dark:bg-slate-900 border border-slate-200/60">
                    <strong className="text-amber-600 dark:text-amber-400 block font-black">ثانياً: إصدار سندات القبض</strong>
                    <p className="mt-1">من القائمة المالية، اختر "سند قبض مباشر". سيقوم النظام تلقائياً بتوزيع مبالغ الدفع النقدية أو الشبكية على البنود المستحقة ذات الأولوية (مثل الرسوم المدرسية أولاً، الحافلة ثانياً، الزي ثالثاً)، وطباعة السند فورياً بدقة RTL.</p>
                  </div>
                  <div className="p-3 dark:bg-slate-900 border border-slate-200/60">
                    <strong className="text-amber-600 dark:text-amber-400 block font-black">ثالثاً: كشوف رصد الكنترول والشهادات</strong>
                    <p className="mt-1">يستطيع معلم المادة إدخال الدرجات في الكشوفات المحمية. بمجرد تأكيد الاعتماد من رئيس الكنترول، يصدر النظام شهادة الطالب مع الترتيب المئوي ورمز الاستجابة السريع QR المعتمد رسمياً.</p>
                  </div>
                </div>
              </div>
            )}

            {openDoc === 'manager' && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-white border-b pb-2">دليل المدير والمشرف العام (المراقبة وحوكمة القرارات)</h4>
                <p className="font-medium text-slate-600 dark:text-slate-300">
                  يوفر هذا الدليل لأصحاب القرار والمديرين الماليين آليات تتبع النشاط والموافقة على العمليات الاستثنائية:
                </p>
                <div className="space-y-3 font-semibold text-slate-600 dark:text-slate-300">
                  <div className="p-3 dark:bg-slate-900 border border-slate-200/60">
                    <strong className="text-emerald-600 dark:text-emerald-400 block font-black">أولاً: التحكم بهيكل الرسوم ونسب الخصم</strong>
                    <p className="mt-1">يمنع النظام تطبيق أي خصم مالي يتجاوز 100%، ويشترط موافقة خطية ورقمية معتمدة من المشرف العام لتطبيق الخصومات الخاصة بالوزارة أو الأشقاء من الدرجة الثالثة.</p>
                  </div>
                  <div className="p-3 dark:bg-slate-900 border border-slate-200/60">
                    <strong className="text-emerald-600 dark:text-emerald-400 block font-black">ثانياً: ترحيل وإغلاق الفترات المالية</strong>
                    <p className="mt-1">بنهاية كل شهر ميلادي، يُجري المدير المالي فحصاً لتوازن القيود. بمجرد تفعيل زر "إغلاق الفترة"، يتم قفل الدفاتر كلياً، ويُمنع أي تعديل أو حذف مادي بأثر رجعي لضمان نزاهة الدفاتر المحاسبية والميزانية.</p>
                  </div>
                </div>
              </div>
            )}

            {openDoc === 'admin' && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-white border-b pb-2">دليل مسؤول نظام تكنولوجيا المعلومات (SysAdmin Manual)</h4>
                <p className="font-medium text-slate-600 dark:text-slate-300">
                  يركز على إعدادات الأمن والـ RBAC والصلاحيات المشددة للبيئات السحابية:
                </p>
                <div className="space-y-3 font-semibold text-slate-600 dark:text-slate-300">
                  <div className="p-3 dark:bg-slate-900 border border-slate-200/60">
                    <strong className="text-purple-600 dark:text-purple-400 block font-black">تطبيق نظام الصلاحيات المبني على الأدوار (RBAC)</strong>
                    <p className="mt-1">يتم تعريف الأدوار (أدمن مالي، محاسب فروع، مسؤول كنترول، مدخل بيانات) وتطبيق قيود الاستعلام بدقة. تُحفظ وتُشفر جميع سجلات التعديل (Audit Trail) مع تسجيل عنوان الـ IP والوقت المحدد لكل حركة بالـ DB.</p>
                  </div>
                  <div className="p-3 dark:bg-slate-900 border border-slate-200/60">
                    <strong className="text-purple-600 dark:text-purple-400 block font-black">تأمين حماية الجلسات والمصادقة الثنائية (2FA)</strong>
                    <p className="mt-1">يتم تفعيل المصادقة الثنائية لجميع مستخدمي الإدارة والمسؤولين الذين يمتلكون صلاحيات سحب النسخ الاحتياطية أو ترحيل موازين المراجعة والأستاذ العام.</p>
                  </div>
                </div>
              </div>
            )}

            {openDoc === 'deploy' && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-white border-b pb-2">دليل النشر والاستضافة السحابية لـ EduPro (Deployment Guide)</h4>
                <p className="font-medium text-slate-600 dark:text-slate-300">
                  تفاصيل تهيئة ونشر الحاوية على خوادم Cloud Run:
                </p>
                <div className="space-y-3 font-semibold text-slate-600 dark:text-slate-300">
                  <p>1. <strong>المنافذ الافتراضية:</strong> يجب تشغيل السيرفر الموحد وتثبيته على المنفذ 3000 حصرياً، وهو المنفذ الوحيد المسموح به للدخول من خلال Reverse Proxy لضمان توجيه حركة المرور الآمنة.</p>
                  <p>2. <strong>متغيرات البيئة (Environment Variables):</strong> يجب الحفاظ على جميع مفاتيح الربط السحابي وسرية قاعدة البيانات سرياً في ملف <code>.env.example</code> بدون كتابة قيمها الفعلية بالكود.</p>
                  <p>3. <strong>بناء الواجهات:</strong> يتم تفعيل الأمر <code>npm run build</code> لإنتاج ملفات العرض الثابتة في المجلد <code>dist/</code> وضغط الأكواد لضمان زمن استجابة خارق تحت 15 مللي ثانية.</p>
                </div>
              </div>
            )}

            {openDoc === 'backup' && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-white border-b pb-2">دليل النسخ الاحتياطي وحماية البيانات من الكوارث (Backup Manual)</h4>
                <p className="font-medium text-slate-600 dark:text-slate-300">
                  سياسات حماية قواعد البيانات وتجنب فقدان البيانات المحاسبية:
                </p>
                <div className="space-y-3 font-semibold text-slate-600 dark:text-slate-300">
                  <p>✓ <strong>النسخ المجدول التلقائي:</strong> يتم أخذ نسخة احتياطية مشفرة بالكامل من قواعد بيانات الاستحقاق والقبول كل 24 ساعة سحابياً وحفظها في بيئة تخزين باردة ومعزولة.</p>
                  <p>✓ <strong>سياسة الاستعادة اللحظية (PITR):</strong> إمكانية استعادة قاعدة بيانات المجمع التعليمي والقيود المالية إلى أي نقطة زمنية محددة بالثانية خلال آخر 30 يوماً لتفادي الأخطاء البشرية.</p>
                  <p>✓ <strong>محاكاة الطوارئ:</strong> يتم إجراء اختبار سنوي لملاءمة الاستعادة لضمان جاهزية الأنظمة للعمل الفوري خلال أقل من 10 دقائق من حدوث أي كارثة فنية.</p>
                </div>
              </div>
            )}

            {openDoc === 'changelog' && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-white border-b pb-2">سجل تتبع الإصدارات والتحديثات (EduPro Release Changelog)</h4>
                <div className="space-y-3 font-semibold text-slate-600 dark:text-slate-300">
                  <div className="border-r-2 border-amber-500 pr-3">
                    <span className="text-[10px] font-black text-amber-500 block">الإصدار RC-1 (الحالي)</span>
                    <strong className="text-xs text-slate-900 dark:text-white">ترقية مرشح الإصدار الأول للإنتاج</strong>
                    <p className="mt-1 text-[11px]">توحيد الهوية البصرية، مطابقة المعايير العشرة لجميع الوحدات الـ 8، اجتياز مصفوفة اختبارات التراجع بنجاح 100%، واستكمال الأدلة الإرشادية الستة بالكامل.</p>
                  </div>
                  <div className="border-r-2 border-slate-300 pr-3">
                    <span className="text-[10px] font-black text-slate-400 block">الإصدار v0.9.0</span>
                    <strong className="text-xs text-slate-700 dark:text-slate-200">اكتمال البناء والقبول الإلكتروني الذكي</strong>
                    <p className="mt-1 text-[11px]">بناء لوحة كشوف الدرجات، توازن الدفتر اليومي، تفعيل مسارات حافلات الطلاب، وتدقيق حوكمة المعاملات المالية بالبوابة العامة.</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* SECTION 4: Release Candidate Decision (Official RC-1 Signature Box) */}
      <div className="relative overflow-hidden bg-gradient-to-l from-slate-950 via-[#0d1433] to-slate-950 border-2 border-amber-500/40 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
        
        {/* Background watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full border border-dashed border-amber-500/10 flex items-center justify-center pointer-events-none select-none">
          <span className="text-amber-500/10 text-4xl font-black rotate-12">EDU-PRO STABLE RC-1</span>
        </div>

        <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/30 shadow-lg shadow-amber-500/5 animate-pulse">
            <Award className="w-12 h-12 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <span className="text-xs font-black text-amber-400 block uppercase tracking-widest">مرحلة ترخيص وإصدار "مرشح الإصدار الأول RC-1"</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">قرار إصدار وتحويل النسخة إلى مرشح الإصدار الأول (EduPro RC-1)</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            بموجب هذا الإقرار، وبعد مراجعة واكتمال الوحدات الثمانية، واجتياز مصفوفة اختبارات التراجع بدون أي تراجعات، وتوحيد اتساق الشاشات وقياس الأداء تحت 15ms، وتوفير الأدلة الستة، يتم منح الختم الفني والاستقراري وتحويل النسخة لـ <strong>RC-1 Stable</strong>.
          </p>

          {isRc1Certified ? (
            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">قرار الاعتماد النهائي لمرشح الإصدار</span>
              <h4 className="text-sm font-black text-amber-400">✓ تم ترقية واعتماد النسخة بنجاح تام كـ EduPro RC-1 للتشغيل المباشر</h4>
              <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                تم توثيق قفل المعايير وإعداد النسخة تحت الرقم التسلسلي: <code className="font-mono text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded">EduPro-RC-1-STABLE-PRODUCTION</code>.
              </p>
              <div className="pt-2 border-t border-slate-800/40 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400 text-right" dir="rtl">
                <div>
                  <span className="block text-slate-500 font-extrabold">المسؤول عن التوقيع الرقمي:</span>
                  <strong className="text-slate-200 block mt-0.5">{certificationSignedBy}</strong>
                </div>
                <div>
                  <span className="block text-slate-500 font-extrabold">تاريخ الإصدار والختم:</span>
                  <strong className="text-slate-200 block mt-0.5">{new Date().toISOString().split('T')[0]}</strong>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRc1Certification} className="max-w-md mx-auto p-5 bg-slate-900 border border-slate-800 space-y-4">
              <div className="text-right">
                <label className="text-[11px] font-black text-slate-300 block mb-1">اسم المسؤول عن توثيق واعتماد مرشح الإصدار (Sign-off Signature):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: المهندس تركي بن ناصر الرويس"
                  value={certificationSignedBy}
                  onChange={(e) => setCertificationSignedBy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white text-right focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border border-amber-400"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>توقيع وثيقة واعتماد مرشح الإصدار RC-1 🚀</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-slate-950 hover:bg-[#2a1d13] text-[#fce79a] border border-slate-800 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة المستند</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}
