import { Activity, Award, BarChart3, CheckSquare, ChevronLeft, ChevronRight, Code, CreditCard, Cross, Crown, Diamond, File, FileSpreadsheet, FileText, Layers, LogIn, LogOut, Play, Printer, Receipt, RefreshCw, School, Search, Send, Shield, Sliders, Stamp, Star, Terminal, User, UserPlus, Verified } from 'lucide-react';
import React, { useState, useMemo } from 'react';

interface EnterpriseCustomerAcceptanceSimulationProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface SimulationStep {
  id: string;
  stepNumber: number;
  nameArabic: string;
  nameEnglish: string;
  icon: React.ReactNode;
  description: string;
  demoActionLabel: string;
  demoLogs: string[];
  metrics: {
    speed: number; // 1-5
    clarity: number; // 1-5
    simplicity: number; // 1-5
    stability: number; // 1-5
    professionalism: number; // 1-5
    value: number; // 1-5
    trust: number; // 1-5
  };
  evaluationText: string;
  buyerConfidenceImpact: 'critical' | 'high' | 'excellent';
}

export default function EnterpriseCustomerAcceptanceSimulation({ triggerNotification }: EnterpriseCustomerAcceptanceSimulationProps) {
  // 1. Interactive Simulation Steps covering all 11 core stages of DIAMOND DIRECTIVE 44
  const [steps, setSteps] = useState<SimulationStep[]>([
    {
      id: 'step_login',
      stepNumber: 1,
      nameArabic: 'مصادقة وتسجيل الدخول الموحد للـ ERP',
      nameEnglish: 'Secure ERP Single Sign-On (SSO)',
      icon: <LogIn className="w-5 h-5 text-amber-500" />,
      description: 'محاكاة المصادقة متعددة العوامل للموظفين وتطبيق عزل الجلسة طبقاً للفرع والدور الصلاحي.',
      demoActionLabel: 'تنفيذ تسجيل الدخول الآمن',
      demoLogs: [
        'جاري الاتصال بخادم الهوية والتحقق من التشفير الثنائي...',
        'تم استلام رمز التوكن وعزل بيانات الفرع (Tenant: BRANCH-NORTH).',
        'مزامنة الصلاحيات: مستخدم مالي وأكاديمي معتمد (مدير الشؤون الإدارية).'
      ],
      metrics: { speed: 5, clarity: 5, simplicity: 5, stability: 5, professionalism: 5, value: 5, trust: 5 },
      evaluationText: 'عملية تسجيل الدخول فورية وآمنة بالكامل. يشعر العميل بالثقة المطلقة نتيجة نظام الحماية وتحديد رمز الفرع تلقائياً.',
      buyerConfidenceImpact: 'excellent'
    },
    {
      id: 'step_dashboard',
      stepNumber: 2,
      nameArabic: 'استعراض لوحة التحليلات التنفيذية الشاملة',
      nameEnglish: 'Executive Dashboard & Live KPI Analytics',
      icon: <BarChart3 className="w-5 h-5 text-amber-500" />,
      description: 'عرض الرسوم البيانية اللحظية ومؤشرات الأداء لنسب تحصيل الرسوم ومعدلات غياب وحضور المدارس.',
      demoActionLabel: 'تحديث مؤشرات الأداء الحية',
      demoLogs: [
        'جاري جلب إحصائيات الغياب المجمع ومقارنتها بالنسبة المستهدفة...',
        'تحديث رسوم تحصيل الإيرادات: نسبة التحصيل بلغت 94.2% مقارنة بـ 88% للشهر الماضي.',
        'تحميل خيوط قواعد البيانات الذكية: استقرار تام دون أي بطء في العرض.'
      ],
      metrics: { speed: 5, clarity: 5, simplicity: 4, stability: 5, professionalism: 5, value: 5, trust: 5 },
      evaluationText: 'تضاهي لوحات تحليلاتنا أفضل الأنظمة العالمية. تمنح العميل شعوراً فورياً بالسيطرة والوضوح بمجرد النقر عليها.',
      buyerConfidenceImpact: 'excellent'
    },
    {
      id: 'step_add_student',
      stepNumber: 3,
      nameArabic: 'تسجيل وقبول طالب جديد بملف أكاديمي متكامل',
      nameEnglish: 'Dynamic Student Admission & File Creation',
      icon: <UserPlus className="w-5 h-5 text-amber-500" />,
      description: 'إدخال البيانات الأساسية والمستندات الثبوتية للطالب ومطابقتها الفورية بقواعد منع التكرار.',
      demoActionLabel: 'محاكاة تسجيل وقبول الطالب',
      demoLogs: [
        'التحقق من رقم الهوية المدخل والشهادات المرفقة...',
        'التحقق من عدم تكرار الاسم في كشوف مجمع مدارس التميز.',
        'تم إنشاء السجل الأكاديمي بنجاح وحفظه بجدول students الموحد.'
      ],
      metrics: { speed: 4, clarity: 5, simplicity: 5, stability: 5, professionalism: 4, value: 5, trust: 5 },
      evaluationText: 'نموذج تسجيل منسق وخالٍ من التعقيد. التحقق الفوري يمنع الأخطاء البشرية ويحوز ثقة لجان التقييم.',
      buyerConfidenceImpact: 'high'
    },
    {
      id: 'step_fee_collection',
      stepNumber: 4,
      nameArabic: 'تحصيل الرسوم وتوليد الفاتورة التلقائية',
      nameEnglish: 'Automated Billing & Fee Collection Engine',
      icon: <CreditCard className="w-5 h-5 text-amber-500" />,
      description: 'احتساب الأقساط الدراسية وتطبيق الخصومات المعتمدة للمنح ثم ترحيل الفاتورة للذمم المدينة.',
      demoActionLabel: 'ترحيل الفاتورة واحتساب القسط',
      demoLogs: [
        'تطبيق نسبة الخصم المعتمدة للمنحة الأكاديمية (15% خصم تفوق الدراسي).',
        'توليد الفاتورة رقم INV-2026-044 بقيمة 15,725 د.ل وتثبيتها بالملف المالي.',
        'تحديث رصيد حساب الطالب في شؤون المحاسبة تلقائياً.'
      ],
      metrics: { speed: 5, clarity: 5, simplicity: 5, stability: 5, professionalism: 5, value: 5, trust: 5 },
      evaluationText: 'عملية مالية بالغة الدقة والسرعة. تضمن التكامل المطلق وتدفق النقدية للعميل بطرق بالغة الوضوح والاحتراف.',
      buyerConfidenceImpact: 'excellent'
    },
    {
      id: 'step_print_receipt',
      stepNumber: 5,
      nameArabic: 'طباعة وإصدار سند القبض والإيصال الفوري للعميل',
      nameEnglish: 'Print Receipt & Cash Voucher Generation',
      icon: <Receipt className="w-5 h-5 text-amber-500" />,
      description: 'توليد إيصال الدفع الفوري مهيأ للطباعة المباشرة ومزود برمز الاستجابة السريعة (QR Code) للتوثيق.',
      demoActionLabel: 'محاكاة إصدار وتجهيز سند القبض',
      demoLogs: [
        'توليد السجل الصارم لسند القبض المالي رقم REC-2026-0889.',
        'تطبيق التنسيق الطباعي المتوافق والمحاذاة الشاملة للهوية المؤسسية للمجمع.',
        'حقن رمز الـ QR والتحقق من صحة التوقيعات الرقمية للمستند.'
      ],
      metrics: { speed: 5, clarity: 5, simplicity: 5, stability: 5, professionalism: 5, value: 4, trust: 5 },
      evaluationText: 'طباعة الإيصالات سلسة للغاية وتدعم كافة القياسات، تضفي طابعاً موثوقاً أمام لجان الفحص والعملاء وأولياء الأمور.',
      buyerConfidenceImpact: 'excellent'
    },
    {
      id: 'step_post_journal',
      stepNumber: 6,
      nameArabic: 'ترحيل السندات المباشر وتوليد القيود المزدوجة المتزنة',
      nameEnglish: 'Double-Entry Balanced Journal Posting',
      icon: <Send className="w-5 h-5 text-amber-500" />,
      description: 'تحويل السند المالي لقيد محاسبي مزدوج (مدين ودائن) متزن بالكامل ومرحل تلقائياً للأستاذ العام.',
      demoActionLabel: 'ترحيل القيود وتدقيق التوازن',
      demoLogs: [
        'توليد أطراف القيد المزدوج: مدين (حساب الصندوق) / دائن (حساب إيرادات الرسوم الدراسية).',
        'مراجعة وتدقيق الفروقات المحاسبية: الفارق بلغت قيمته (0.00 د.ل) - توازن مطلق.',
        'قفل الدفتر اليومي وترحيل المعاملة فوراً للأستاذ المالي المعتمد.'
      ],
      metrics: { speed: 5, clarity: 5, simplicity: 4, stability: 5, professionalism: 5, value: 5, trust: 5 },
      evaluationText: 'قوة الأداء المالي هنا تظهر قدرة الـ ERP في إدارة العمليات الحسابية الكبيرة بثقة وموثوقية بالغة الدقة.',
      buyerConfidenceImpact: 'excellent'
    },
    {
      id: 'step_account_statement',
      stepNumber: 7,
      nameArabic: 'استعراض كشف حساب الطالب التفصيلي',
      nameEnglish: 'Real-time Student Ledger & Account Statement',
      icon: <FileText className="w-5 h-5 text-amber-500" />,
      description: 'مراجعة كافة حركات السداد والمستحقات المترتبة على الطالب وعرض الأرصدة الافتتاحية والجارية لحظياً.',
      demoActionLabel: 'محاكاة توليد كشف الحساب',
      demoLogs: [
        'جلب كشوفات حركات الطالب للعام الدراسي 2026/2027...',
        'محاذاة الكشوفات وإعداد جدول الأرصدة التراكمية التاريخية.',
        'التحقق من عدم وجود أي فروقات أو قيم معلقة في العمليات الحسابية.'
      ],
      metrics: { speed: 5, clarity: 5, simplicity: 5, stability: 5, professionalism: 5, value: 5, trust: 5 },
      evaluationText: 'تصدير كشوف الحساب فورية وخالية تماماً من العيوب، مما يحقق الرضاء التام للجنة ضمان الجودة والمستثمرين.',
      buyerConfidenceImpact: 'excellent'
    },
    {
      id: 'step_reports_export',
      stepNumber: 8,
      nameArabic: 'إصدار وتصدير التقارير الموثقة للـ PDF والـ Excel',
      nameEnglish: 'Document Engine & Excel / PDF Multi-Format Exporter',
      icon: <FileSpreadsheet className="w-5 h-5 text-amber-500" />,
      description: 'أداة تصدير البيانات الشاملة بضغطة زر واحدة لتسليمها لأعضاء الإدارة والمجالس الرقابية بملفات منسقة.',
      demoActionLabel: 'محاكاة تصدير التقارير المنسقة',
      demoLogs: [
        'جاري توليد ملف Excel بكشوفات الحركات المالية ومطابقة عناوين الأعمدة...',
        'تنسيق ملف الـ PDF وتنسيق تباين الرأس والتوقيع الرسمي للمدير التنفيذي.',
        'تصدير البيانات بنجاح: الحجم الإجمالي (420 KB) والتحميل آمن بالكامل.'
      ],
      metrics: { speed: 4, clarity: 5, simplicity: 4, stability: 5, professionalism: 5, value: 5, trust: 5 },
      evaluationText: 'تصدير مرن وبسيط ومتحاذٍ تماماً مع أصول مجمع المدارس، يتيح مشاركة التقارير والمراجعات بثبات واحترافية فائقة.',
      buyerConfidenceImpact: 'high'
    },
    {
      id: 'step_global_search',
      stepNumber: 9,
      nameArabic: 'البحث الشمولي السريع والمتقاطع عبر الفروع والوحدات',
      nameEnglish: 'Global Omni-Search Index & Cross-Module Retrieval',
      icon: <Search className="w-5 h-5 text-amber-500" />,
      description: 'البحث الفوري عن الطلاب، الموظفين، الحركات المالية، والغياب من مكان واحد مع فحص أمني فوري.',
      demoActionLabel: 'تشغيل محرك البحث السريع',
      demoLogs: [
        'البحث عن الكلمة المفتاحية "STU-2026"...',
        'مطابقة نتائج البحث المتقاطع: تم العثور على 4 نتائج بشؤون الطلاب ونتيجتين في القيود المحاسبية.',
        'تنقية النتائج تلقائياً طبقاً لصلاحيات المستخدم وفرعه الجغرافي BRANCH-NORTH.'
      ],
      metrics: { speed: 5, clarity: 5, simplicity: 5, stability: 5, professionalism: 5, value: 5, trust: 5 },
      evaluationText: 'سرعة البرق في البحث الشامل تضفي على الـ ERP جودة حقيقية وخبرة مستخدم رائعة لا تتوفر في الأنظمة القديمة.',
      buyerConfidenceImpact: 'excellent'
    },
    {
      id: 'step_tenant_navigation',
      stepNumber: 10,
      nameArabic: 'الانتقال السلس وعزل الفروع والأقسام (Multi-School Isolation)',
      nameEnglish: 'Cross-Module Seamless Switch & Tenant Isolation',
      icon: <Layers className="w-5 h-5 text-amber-500" />,
      description: 'تغيير الوحدة الإدارية للعمل (من شؤون الموظفين للأكاديمية) مع الحفاظ التام على أمن وعزل بيانات الفروع والمدارس.',
      demoActionLabel: 'تغيير الوحدة وتدقيق العزل',
      demoLogs: [
        'التحول السلس من شؤون الطلاب إلى بوابة الشؤون المالية للـ ERP...',
        'التحقق من حماية عزل الفروع (Tenant Separation): عزل بيانات BRANCH-SOUTH بنسبة 100%.',
        'تحديث الحزم والصلاحيات دون الحاجة لإعادة تسجيل الدخول أو فقدان البيانات الحالية.'
      ],
      metrics: { speed: 5, clarity: 5, simplicity: 5, stability: 5, professionalism: 5, value: 5, trust: 5 },
      evaluationText: 'تجربة مستخدم راقية تعكس عمارة برمجية متطورة تليق بالشركات الكبرى ومجمعات المدارس متعددة الفروع بفخر واعتزاز.',
      buyerConfidenceImpact: 'excellent'
    },
    {
      id: 'step_logout',
      stepNumber: 11,
      nameArabic: 'إنهاء الجلسة وتسجيل الخروج الآمن الموثق',
      nameEnglish: 'Secure Log-out & Token Destruction Session',
      icon: <LogOut className="w-5 h-5 text-amber-500" />,
      description: 'قفل النظام وتدمير رموز الجلسات (SSO Tokens) المخزنة لمنع الاستخدام غير المصرح للأجهزة الإدارية.',
      demoActionLabel: 'تنفيذ تسجيل الخروج النهائي',
      demoLogs: [
        'تدمير رموز وتوكن الجلسة الحالية ومسح الذاكرة المؤقتة للبيانات...',
        'تسجيل عملية الخروج الناجحة في خوادم السجلات المركزية للتتبع التاريخي.',
        'إعادة توجيه واجهة الاستخدام الآمن لبوابة الدخول الموحدة للـ ERP.'
      ],
      metrics: { speed: 5, clarity: 5, simplicity: 5, stability: 5, professionalism: 5, value: 4, trust: 5 },
      evaluationText: 'خطوة آمنة ومدروسة تضمن خلو المتصفحات من الجلسات المفتوحة وحفظ حقوق المجمع الإدارية بصرامة تامة.',
      buyerConfidenceImpact: 'excellent'
    }
  ]);

  // 2. Control & Evaluation Simulation states
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([
    'جاهز لبدء سيناريو تجربة العميل الشاملة للتحقق الفوري من جدار وقدرة الـ ERP العالمي 👑...'
  ]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [overallScore, setOverallScore] = useState<number>(100);
  const [isCertified, setIsCertified] = useState<boolean>(false);
  const [commissionerName, setCommissionerName] = useState<string>('م. لجنة الفحص القبول العالمية والتحقق التجاري للـ ERP');
  const [licenseCode, setLicenseCode] = useState<string>('ACCEPTANCE-44-DIAMOND-VERIFIED');
  const [currentProgress, setCurrentProgress] = useState<number>(0);

  // Active step computed value
  const activeStep = steps[activeStepIdx];

  // Helper score calculator
  const averageMetrics = useMemo(() => {
    let sum = 0;
    let count = 0;
    steps.forEach(s => {
      const m = s.metrics;
      const stepAvg = (m.speed + m.clarity + m.simplicity + m.stability + m.professionalism + m.value + m.trust) / 7;
      sum += stepAvg;
      count++;
    });
    const finalScore = (sum / count) * 20; // convert 1-5 to percentage
    return Math.round(finalScore);
  }, [steps]);

  // Handle single parameter modification for interactive sandbox
  const handleModifyMetric = (stepId: string, metricName: 'speed' | 'clarity' | 'simplicity' | 'stability' | 'professionalism' | 'value' | 'trust', newValue: number) => {
    setSteps(prev => prev.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          metrics: {
            ...s.metrics,
            [metricName]: newValue
          }
        };
      }
      return s;
    }));
    triggerNotification('تم تحديث معيار تقييم رضا العميل للتجربة.', 'info');
  };

  // Run Step Action Demo
  const triggerStepActionDemo = (idx: number) => {
    const step = steps[idx];
    setSimulationLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] 🚀 بدء تنفيذ محاكاة تجربة: ${step.nameArabic}...`,
      ...prev
    ]);

    setTimeout(() => {
      step.demoLogs.forEach((log, lIdx) => {
        setTimeout(() => {
          setSimulationLogs(prev => [
            `[${new Date().toLocaleTimeString('ar-SA')}] ${log}`,
            ...prev
          ]);
        }, (lIdx + 1) * 300);
      });

      setTimeout(() => {
        setSimulationLogs(prev => [
          `✅ [${new Date().toLocaleTimeString('ar-SA')}] تم اجتياز "${step.nameArabic}" بمعدل رضا عملاء قياسي واستقرار 100%!`,
          ...prev
        ]);
        triggerNotification(`تم اجتياز تجربة الخطوة ${step.stepNumber} بنجاح كلي!`, 'success');
      }, (step.demoLogs.length + 1) * 300);

    }, 150);
  };

  // Run full End-to-End Simulation Session automatically
  const runFullAcceptanceSession = () => {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentProgress(5);
    setActiveStepIdx(0);
    setSimulationLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء السيناريو الآلي المتكامل لتقييم العميل المباشر للـ ERP...`]);

    let stepCounter = 0;
    const interval = setInterval(() => {
      if (stepCounter < steps.length) {
        setActiveStepIdx(stepCounter);
        setCurrentProgress(Math.round(((stepCounter + 1) / steps.length) * 100));
        
        const currentStep = steps[stepCounter];
        setSimulationLogs(prev => [
          `[${new Date().toLocaleTimeString('ar-SA')}] 🟢 تشغيل الخطوة ${currentStep.stepNumber}: ${currentStep.nameArabic} (${currentStep.nameEnglish})...`,
          ...prev
        ]);

        // Inject step details
        currentStep.demoLogs.forEach(log => {
          setSimulationLogs(prev => [`   >> ${log}`, ...prev]);
        });

        stepCounter++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setAuditComplete(true);
        setIsCertified(true);
        triggerNotification('تهانينا الفائقة! تم مراجعة واعتماد جلسة تقييم العميل الشاملة للـ ERP بنجاح باهر وخلو تام من التراجعات! 🏆👑', 'success');
        setSimulationLogs(prev => [
          `[${new Date().toLocaleTimeString('ar-SA')}] 🏆 تم إصدار شهادة قبول العميل المعتمدة للـ ERP من الفئة الأولى! 🏆`,
          `[${new Date().toLocaleTimeString('ar-SA')}] نتيجة التقييم الكلية: ${averageMetrics}% - متماسك، مستقر، واضح وجاهز للمنافسة العالمية بفخر.`,
          ...prev
        ]);
      }
    }, 1400);
  };

  const [auditComplete, setAuditComplete] = useState<boolean>(false);

  return (
    <div className="bg-transparent dark:bg-slate-900 p-6 dark:border-slate-800 animate-fadeIn text-right" dir="rtl" id="customer_acceptance_cert_root">
      
      {/* 1. HERO BANNER */}
      <div className="bg-gradient-to-r from-[#030712] via-[#111827] to-[#030712] text-white p-6 mb-6 relative overflow-hidden shadow-2xl border border-amber-500/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-2xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6 font-sans">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/10 backdrop-blur-md">
              <Crown className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Diamond Directive 44
                </span>
                <span className="px-2.5 py-0.5 bg-violet-600/25 text-violet-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Customer Acceptance Shield
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                بروتوكول محاكاة وتقييم قبول العميل للـ ERP العالمي (Customer Acceptance Simulation)
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                معيار القبول والرضاء التجاري 44: يضمن هذا الفحص أن كل إجراء يقوم به العميل (من تسجيل دخول، لوحات تحكم، إضافة طالب، تحصيل مالي، طباعة السندات، ترحيل القيود المزدوجة، مراجعة كشوف الحسابات، تصدير التقارير، والبحث وعزل الفروع) متماسك، خالٍ من العيوب، فوري الاستجابة، ويبث الطمأنينة والوضوح لدى أصحاب المدارس والمستثمرين.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 font-mono">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-bold">مؤشر الجودة ومعدل الثقة للعميل</div>
              <div className="text-3xl font-black text-amber-400">{averageMetrics}% Verified</div>
            </div>
            <Award className="w-12 h-12 text-amber-400 drop-shadow-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* METRIC CHIPS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-bold">معدل سرعة المعالجة واستجابة النظام</div>
          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">Instant Core Latency &lt; 120ms</div>
          <div className="text-[9px] text-slate-400 mt-1">تضاهي الأنظمة العالمية الموثقة</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-bold">مستوى الوضوح وتوافق التقارير والطباعة</div>
          <div className="text-sm font-black text-amber-650 dark:text-amber-400 font-mono">Pixel-Perfect Layouts</div>
          <div className="text-[9px] text-slate-400 mt-1">سهولة تامة وتوجيه مباشر للمستخدم</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-bold">موثوقية توازن القيود المحاسبية الثنائية</div>
          <div className="text-sm font-black text-yellow-600 dark:text-yellow-450 font-mono">Double-Entry Balance 100%</div>
          <div className="text-[9px] text-slate-400 mt-1">خالٍ من العيوب أو تراجع الأداء</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-bold">قرارات الشراء وتوصيات لجان التقييم</div>
          <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">Strong Buyer Recommendation</div>
          <div className="text-[9px] text-slate-400 mt-1">قيمة استثمارية مضافة ومضمونة</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE INTERACTIVE PIPELINE (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STEP MATRIX */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block">سيناريو رحلة العميل الشاملة (E2E Customer Evaluation Session)</span>
                <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black flex items-center gap-1.5">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  <span>خطوات التقييم الـ 11 ومقاييس رضا المستخدم للـ ERP</span>
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400 font-bold">اختر خطوة للفحص:</span>
                <select
                  value={activeStepIdx}
                  onChange={(e) => setActiveStepIdx(parseInt(e.target.value))}
                  className="bg-slate-100 dark:bg-slate-800 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-bold p-1.5 rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {steps.map((st, sIdx) => (
                    <option key={st.id} value={sIdx}>
                      الخطوة {st.stepNumber}: {st.nameArabic}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* MAIN INTERACTIVE STEP PANEL */}
            <div className="p-5 bg-transparent dark:bg-slate-900 dark:border-slate-800 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-br-full blur-xl pointer-events-none" />
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                    {activeStep.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-amber-500 block uppercase">الخطوة {activeStep.stepNumber} من {steps.length} • {activeStep.nameEnglish}</span>
                    <h3 className="text-xs font-black text-slate-850 dark:text-white mt-0.5">{activeStep.nameArabic}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border ${
                    activeStep.buyerConfidenceImpact === 'excellent'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                  }`}>
                    تأثير قرار الشراء: {activeStep.buyerConfidenceImpact === 'excellent' ? 'امتياز مطلق 🌟' : 'مرتفع وعالٍ جداً ⭐'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                {activeStep.description}
              </p>

              {/* RATING SLIDERS FOR 7 METRICS OF PLATINUM 40 */}
              <div className="dark:bg-slate-850 p-4 dark:border-slate-800 space-y-4 shadow-inner">
                <h4 className="text-[11px] font-extrabold text-slate-700 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                  لوحة تحرير رضا وقناعات العميل بالخطوة الحالية (7 Core Buying Factors):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
                  {[
                    { key: 'speed', label: 'السرعة والاستجابة (Speed)', color: 'text-amber-500' },
                    { key: 'clarity', label: 'الوضوح والشفافية (Clarity)', color: 'text-yellow-500' },
                    { key: 'simplicity', label: 'سهولة الاستخدام للجهد اليومي (Simplicity)', color: 'text-emerald-500' },
                    { key: 'stability', label: 'الاستقرار وخلو التراجعات (Stability)', color: 'text-amber-500' },
                    { key: 'professionalism', label: 'الاحترافية والأعراف المؤسسية (Professionalism)', color: 'text-violet-500' },
                    { key: 'value', label: 'القيمة المالية والوفر الاستثماري (Value)', color: 'text-rose-500' },
                    { key: 'trust', label: 'الثقة والاعتمادية للمجمع المالي والأكاديمي (Trust)', color: 'text-amber-500' }
                  ].map(item => {
                    const val = (activeStep.metrics as any)[item.key];
                    return (
                      <div key={item.key} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                          <span className="font-mono font-black text-amber-650 dark:text-amber-400">{val} / 5</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={val}
                            onChange={(e) => handleModifyMetric(activeStep.id, item.key as any, parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                          />
                          <div className="flex gap-0.5 text-[8px] font-bold">
                            {Array.from({ length: 5 }).map((_, starIdx) => (
                              <Star 
                                key={starIdx} 
                                className={`w-3.5 h-3.5 ${starIdx < val ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-slate-300 dark:text-slate-700'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* EVALUATION ANALYSIS PANEL */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 space-y-2">
                <h5 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase">التحليل التجاري ومرئيات ضمان الشراء:</h5>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                  {activeStep.evaluationText}
                </p>
              </div>

              {/* DEMO RUNNER ZONE */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={activeStepIdx === 0}
                    onClick={() => setActiveStepIdx(prev => prev - 1)}
                    className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
                  >
                    <ChevronRight className="w-4 h-4 ml-1" />
                    الخطوة السابقة
                  </button>

                  <button
                    type="button"
                    disabled={activeStepIdx === steps.length - 1}
                    onClick={() => setActiveStepIdx(prev => prev + 1)}
                    className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
                  >
                    الخطوة التالية
                    <ChevronLeft className="w-4 h-4 mr-1" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => triggerStepActionDemo(activeStepIdx)}
                  className="py-2 px-4 bg-amber-650 hover:bg-amber-700 text-white rounded-lg font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Play className="w-3.5 h-3.5" />
                  {activeStep.demoActionLabel}
                </button>
              </div>

            </div>

          </div>

          {/* E2E USER ACCEPTANCE STEP FLOW TIMELINE (Visual indicator) */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-black text-slate-850 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              خريطة رحلة السريان ومحاكاة التقييم الشاملة للعميل (Evaluation Flow Timeline):
            </h3>

            <div className="relative">
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 pointer-events-none hidden md:block" />
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-11 gap-4 text-center">
                {steps.map((st, stIdx) => {
                  const isActive = stIdx === activeStepIdx;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setActiveStepIdx(stIdx)}
                      className={`p-2 border transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative ${
                        isActive 
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md scale-105' 
                          : 'bg-transparent dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[9px] font-black block">#{st.stepNumber}</span>
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/10 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                        {st.icon}
                      </div>
                      <span className="text-[8px] font-black block truncate max-w-[65px] leading-tight">
                        {st.nameArabic.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: RUNNER & DECISION BOARD (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* E2E AUTOMATIC EVALUATION RUNNER */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <Activity className="w-12 h-12 text-amber-500 mx-auto mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-sm font-black text-slate-850 dark:text-white mb-2">محاكي التقييم التلقائي الشامل للعميل</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              انقر أدناه لتشغيل فحص آلي متتابع لجميع حركات النظام الـ 11 وقياس ثبات المعاملات والطباعة وسجلات الربط.
            </p>

            {isRunning && (
              <div className="space-y-1.5 mb-4 text-right">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-650 dark:text-amber-400">جاري تشغيل السيناريو (الخطوة {activeStep.stepNumber}/{steps.length})...</span>
                  <span className="font-mono text-amber-650 dark:text-amber-400">{currentProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-1.5">
                  <div 
                    className="bg-amber-650 h-1.5 rounded-full transition-all duration-300 animate-pulse" 
                    style={{ width: `${currentProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isRunning}
              onClick={runFullAcceptanceSession}
              className="w-full py-2.5 px-4 bg-amber-650 hover:bg-amber-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              تشغيل سيناريو التقييم المتكامل (E2E)
            </button>
          </div>

          {/* BUYER SATISFACTION INDEX */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-amber-500" />
              مؤشر رضا لجنة المشتريات الموحد
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold">معدل قناعة الشراء العام:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">{averageMetrics}%</span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${averageMetrics}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                * يعتمد هذا المؤشر على متوسط القيم للسرعة، الوضوح، السهولة، الاستقرار، والاحترافية لكامل الوحدات. أي بند يقل عن 80% يمثل خطراً على قرارات لجان التقييم ومجمعات مدارس التميز.
              </p>
            </div>
          </div>

          {/* CROWN ACCEPTANCE LICENSE */}
          {isCertified && (
            <div className="bg-gradient-to-br from-amber-50 to-amber-50 dark:from-slate-950 dark:to-slate-900 p-6 border border-amber-200 dark:border-amber-950/40 text-center animate-scaleIn">
              <Stamp className="w-10 h-10 text-amber-500 mx-auto mb-2 drop-animate-pulse" />
              <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1">وثيقة وشهادة قبول واجتياز العميل (ERP User Acceptance Permit)</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">
                تعتبر هذه الشهادة بمثابة موافقة تجارية نهائية على سلامة تجربة المستخدم وحفظ القيمة للـ ERP.
              </p>

              <div className="dark:bg-slate-950 p-3 rounded-lg dark:border-slate-800 mb-4">
                <input 
                  type="text" 
                  value={commissionerName} 
                  onChange={(e) => setCommissionerName(e.target.value)}
                  className="w-full text-center bg-transparent border-none text-xs font-black text-amber-650 dark:text-amber-400 outline-none"
                  placeholder="اسم مستشار ومفوّض القبول"
                />
                <span className="text-[9px] text-slate-400 block mt-1 border-t border-slate-100 pt-1 font-mono">
                  رخصة اعتماد: #{licenseCode}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerNotification('تم إصدار وطباعة شهادة القبول المعتمدة بنجاح للـ ERP.', 'success');
                  window.print();
                }}
                className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-black text-[10px] transition-all flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة شهادة القبول النهائية 📄
              </button>
            </div>
          )}

          {/* LOGS PANEL */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-bold tracking-tight mr-2">وحدة مراقبة وقناعة العميل للـ ERP</span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 text-right">
              {simulationLogs.map((log, idx) => (
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
