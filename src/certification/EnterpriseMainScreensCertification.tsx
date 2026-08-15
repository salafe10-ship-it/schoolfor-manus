import { Activity, AlertTriangle, Award, Check, CheckCircle2, Code, Component, Cpu, Delete, Download, Filter, Info, Layout, Navigation, Plus, Printer, Search, Sheet, ShieldCheck, Sliders, Terminal, Trash2 } from 'lucide-react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface EnterpriseMainScreensCertificationProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface AuditChecklist {
  // 1- Visual Audit
  visualDesign: boolean;       // التصميم
  visualAlignment: boolean;    // المحاذاة
  visualColors: boolean;       // الألوان
  visualButtons: boolean;      // الأزرار
  visualTables: boolean;       // الجداول
  visualWindows: boolean;      // النوافذ

  // 2- UX Audit
  uxClicksCount: boolean;      // عدد النقرات
  uxFieldOrder: boolean;       // ترتيب الحقول
  uxSearch: boolean;           // البحث
  uxNavigation: boolean;       // التنقل
  uxMessages: boolean;         // الرسائل
  uxProductivity: boolean;     // الإنتاجية

  // 3- Functional Audit
  funcCompleteness: boolean;   // اكتمال الوظائف
  funcErrorStates: boolean;    // حالات الخطأ
  funcInputValidation: boolean;// التحقق من المدخلات
  funcPrint: boolean;          // الطباعة
  funcExport: boolean;         // التصدير

  // 4- Engineering Audit
  engComponentSize: boolean;   // حجم Component
  engSplitPotential: boolean;  // إمكانية تقسيمه
  engReusability: boolean;     // إعادة الاستخدام
  engDecoupledLogic: boolean;  // فصل Business Logic
  engPerformance: boolean;     // الأداء
}

interface CriticalObservation {
  id: string;
  text: string;
  isResolved: boolean;
  severity: 'critical' | 'warning';
}

interface MainScreenAudit {
  id: string;
  nameArabic: string;
  nameEnglish: string;
  category: string;
  description: string;
  checklist: AuditChecklist;
  criticalObservations: CriticalObservation[];
}

export default function EnterpriseMainScreensCertification({ triggerNotification }: EnterpriseMainScreensCertificationProps) {
  // Navigation & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'certified' | 'warning' | 'review' | 'rejected'>('all');
  const [selectedScreenId, setSelectedScreenId] = useState<string>('student_affairs');
  const [activeAuditTab, setActiveAuditTab] = useState<'visual' | 'ux' | 'functional' | 'engineering'>('visual');

  // Interactive Live Add State for Critical Observations
  const [newObsText, setNewObsText] = useState('');
  const [newObsSeverity, setNewObsSeverity] = useState<'critical' | 'warning'>('critical');

  // Refactoring simulation terminal state
  const [isRemediating, setIsRemediating] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // Initial audit data covering all major portals of the enterprise ERP
  const [screensData, setScreensData] = useState<MainScreenAudit[]>([
    {
      id: 'student_affairs',
      nameArabic: 'شؤون الطلاب والتسجيل وقبول الملفات',
      nameEnglish: 'Student Affairs & Admissions Portal',
      category: 'التسجيل والقبول',
      description: 'الشاشة الأساسية لإدخال بيانات الطلاب، الهويات الوطنية، تتبع الحالة الأكاديمية وتصدير خطابات القبول الرسمية.',
      checklist: {
        visualDesign: true,
        visualAlignment: true,
        visualColors: true,
        visualButtons: true,
        visualTables: true,
        visualWindows: true,
        
        uxClicksCount: true,
        uxFieldOrder: true,
        uxSearch: true,
        uxNavigation: true,
        uxMessages: true,
        uxProductivity: true,

        funcCompleteness: true,
        funcErrorStates: true,
        funcInputValidation: true,
        funcPrint: true,
        funcExport: true,

        engComponentSize: true,
        engSplitPotential: true,
        engReusability: true,
        engDecoupledLogic: true,
        engPerformance: true
      },
      criticalObservations: [
        { id: 'sa-1', text: 'كان هناك تكرار في أرقام الهويات الوطنية عند الإدخال السريع وتم إصلاحه في المرحلة السابقة بالكامل.', isResolved: true, severity: 'critical' }
      ]
    },
    {
      id: 'student_finance',
      nameArabic: 'الشؤون المالية وأقساط الطلاب والتحصيل',
      nameEnglish: 'Student Accounts & Installment Portal',
      category: 'الشؤون المالية',
      description: 'شاشة معقدة لإدارة الرسوم الدراسية، الخصومات العائلية وأخوة الطلاب، خطط الأقساط الشهرية، وسندات القبض المباشرة.',
      checklist: {
        visualDesign: true,
        visualAlignment: true,
        visualColors: true,
        visualButtons: true,
        visualTables: true,
        visualWindows: true,
        
        uxClicksCount: true,
        uxFieldOrder: true,
        uxSearch: true,
        uxNavigation: true,
        uxMessages: true,
        uxProductivity: true,

        funcCompleteness: true,
        funcErrorStates: true,
        funcInputValidation: true,
        funcPrint: true,
        funcExport: true,

        engComponentSize: true,
        engSplitPotential: true,
        engReusability: true,
        engDecoupledLogic: true,
        engPerformance: true
      },
      criticalObservations: [
        { id: 'sf-1', text: 'تمت معالجة القيد العكسي التلقائي لمنع المبالغ المعلقة واليتيمة عند الدفع بنجاح.', isResolved: true, severity: 'critical' }
      ]
    },
    {
      id: 'exams_results',
      nameArabic: 'الامتحانات ورصد الدرجات والشهادات واللجان',
      nameEnglish: 'Exams, Grading & Results Portal',
      category: 'التعليم والأكاديميا',
      description: 'شاشة رصد العلامات الفصلية والنهائية، توزيع الطلاب على لجان الامتحانات، حساب المعدلات التراكمية وطباعة الشهادات.',
      checklist: {
        visualDesign: true,
        visualAlignment: true,
        visualColors: true,
        visualButtons: false,
        visualTables: false,
        visualWindows: true,
        
        uxClicksCount: false,
        uxFieldOrder: true,
        uxSearch: false,
        uxNavigation: true,
        uxMessages: false,
        uxProductivity: true,

        funcCompleteness: false,
        funcErrorStates: false,
        funcInputValidation: false,
        funcPrint: true,
        funcExport: false,

        engComponentSize: false,
        engSplitPotential: true,
        engReusability: true,
        engDecoupledLogic: false,
        engPerformance: true
      },
      criticalObservations: [
        { id: 'ex-1', text: 'ملاحظة حرجة نشطة: احتساب التقدير التراكمي لبعض درجات الغياب يحسب كـ (F) بالخطأ دون إعطاء إنذار لولي الأمر.', isResolved: false, severity: 'critical' },
        { id: 'ex-2', text: 'تأخر في طباعة الشهادات المجمعة بصيغة PDF على متصفحات الجوال.', isResolved: true, severity: 'warning' }
      ]
    },
    {
      id: 'general_ledger',
      nameArabic: 'الدفتر العام والقيود اليومية والترحيل المالي',
      nameEnglish: 'General Ledger & Journal Entries',
      category: 'الشؤون المالية',
      description: 'الشاشة المحاسبية المركزية لإدخال قيود الديون والائتمانات، ميزان المراجعة اليومي، والتحقق من التوازن الإجباري للترحيل المالي.',
      checklist: {
        visualDesign: true,
        visualAlignment: true,
        visualColors: true,
        visualButtons: true,
        visualTables: true,
        visualWindows: true,
        
        uxClicksCount: true,
        uxFieldOrder: true,
        uxSearch: true,
        uxNavigation: true,
        uxMessages: true,
        uxProductivity: true,

        funcCompleteness: true,
        funcErrorStates: true,
        funcInputValidation: true,
        funcPrint: true,
        funcExport: true,

        engComponentSize: true,
        engSplitPotential: true,
        engReusability: true,
        engDecoupledLogic: true,
        engPerformance: true
      },
      criticalObservations: []
    },
    {
      id: 'hr_payroll',
      nameArabic: 'إدارة الموارد البشرية والرواتب وبدلات المعلمين',
      nameEnglish: 'HR & Payroll Portal',
      category: 'الموارد البشرية',
      description: 'شاشة احتساب الرواتب الأساسية للموظفين والمعلمين، استقطاع التأمينات والغياب، وإصدار مسيرات الرواتب المتوافقة مع ساند.',
      checklist: {
        visualDesign: true,
        visualAlignment: true,
        visualColors: true,
        visualButtons: true,
        visualTables: true,
        visualWindows: true,
        
        uxClicksCount: true,
        uxFieldOrder: true,
        uxSearch: true,
        uxNavigation: true,
        uxMessages: true,
        uxProductivity: true,

        funcCompleteness: false,
        funcErrorStates: false,
        funcInputValidation: true,
        funcPrint: true,
        funcExport: true,

        engComponentSize: true,
        engSplitPotential: true,
        engReusability: true,
        engDecoupledLogic: true,
        engPerformance: true
      },
      criticalObservations: [
        { id: 'hr-1', text: 'ملاحظة حرجة نشطة: وجود فرصة لتعديل رواتب المعلمين بأثر رجعي دون الحصول على موافقة خطية مشفرة من الإدارة العليا.', isResolved: false, severity: 'critical' }
      ]
    },
    {
      id: 'security_permissions',
      nameArabic: 'بوابة إدارة الصلاحيات وتوزيع الأدوار والمستخدمين',
      nameEnglish: 'Security, Roles & Permissions Portal',
      category: 'التحكم والأمان',
      description: 'شاشة التحكم بصلاحيات المستخدمين، منسق الأدوار (مدير، معلم، مالي، ولي أمر)، وسجلات التدقيق المتقدم للنشاطات الأمنية.',
      checklist: {
        visualDesign: true,
        visualAlignment: true,
        visualColors: true,
        visualButtons: true,
        visualTables: true,
        visualWindows: true,
        
        uxClicksCount: true,
        uxFieldOrder: true,
        uxSearch: true,
        uxNavigation: true,
        uxMessages: true,
        uxProductivity: true,

        funcCompleteness: true,
        funcErrorStates: true,
        funcInputValidation: true,
        funcPrint: true,
        funcExport: true,

        engComponentSize: true,
        engSplitPotential: true,
        engReusability: true,
        engDecoupledLogic: true,
        engPerformance: true
      },
      criticalObservations: []
    },
    {
      id: 'treasury_collections',
      nameArabic: 'بوابة الخزينة والتحصيل اليومي والمطابقة',
      nameEnglish: 'Treasury & Cashier Desk',
      category: 'الشؤون المالية',
      description: 'شاشة تتبع المبالغ السائلة في الخزن المدرسية ومطابقتها الفورية مع الأرصدة البنكية والقيود الدفترية وإصدار كشوفات الإغلاق.',
      checklist: {
        visualDesign: true,
        visualAlignment: true,
        visualColors: true,
        visualButtons: true,
        visualTables: true,
        visualWindows: true,
        
        uxClicksCount: true,
        uxFieldOrder: true,
        uxSearch: true,
        uxNavigation: true,
        uxMessages: true,
        uxProductivity: true,

        funcCompleteness: true,
        funcErrorStates: true,
        funcInputValidation: true,
        funcPrint: true,
        funcExport: true,

        engComponentSize: true,
        engSplitPotential: true,
        engReusability: true,
        engDecoupledLogic: true,
        engPerformance: true
      },
      criticalObservations: [
        { id: 'tr-1', text: 'وجود اختلاف طفيف (أقل من 5 ريال) أثناء مطابقة الإغلاق الليلي تم التغلب عليه عبر تقريب الكسور آلياً.', isResolved: true, severity: 'warning' }
      ]
    },
    {
      id: 'ai_portal',
      nameArabic: 'بوابة المساعد الذكي والتحليلات التنبؤية',
      nameEnglish: 'AI Assistant & Predictive Dashboard',
      category: 'التحكم والأمان',
      description: 'شاشة المحادثة والتحليلات التوليدية التي تساعد متخذ القرار على توقع حالات التعثر المالي والتأخر الدراسي للطلاب.',
      checklist: {
        visualDesign: true,
        visualAlignment: true,
        visualColors: true,
        visualButtons: true,
        visualTables: true,
        visualWindows: true,
        
        uxClicksCount: true,
        uxFieldOrder: true,
        uxSearch: true,
        uxNavigation: true,
        uxMessages: true,
        uxProductivity: true,

        funcCompleteness: true,
        funcErrorStates: true,
        funcInputValidation: true,
        funcPrint: true,
        funcExport: true,

        engComponentSize: true,
        engSplitPotential: true,
        engReusability: true,
        engDecoupledLogic: true,
        engPerformance: true
      },
      criticalObservations: []
    }
  ]);

  // Total items in checklist = 22
  const checklistKeys = useMemo(() => {
    return {
      visual: [
        { key: 'visualDesign' as keyof AuditChecklist, label: 'التصميم', desc: 'تطبيق الهوية البصرية واتساق المكونات الهيكلية.' },
        { key: 'visualAlignment' as keyof AuditChecklist, label: 'المحاذاة', desc: 'محاذاة العناصر والنصوص بالشكل الصحيح RTL.' },
        { key: 'visualColors' as keyof AuditChecklist, label: 'الألوان', desc: 'تباين الألوان وسلامتها للعين وتطابقها مع التصميم الموحد.' },
        { key: 'visualButtons' as keyof AuditChecklist, label: 'الأزرار', desc: 'توفير استجابة بصرية عند التمرير والنقر، ووضوح المقاسات.' },
        { key: 'visualTables' as keyof AuditChecklist, label: 'الجداول', desc: 'أعمدة متوازنة، حقول مقروءة، وتنسيق مناسب للبيانات الضخمة.' },
        { key: 'visualWindows' as keyof AuditChecklist, label: 'النوافذ والمنبثقات', desc: 'تصميم ناعم وحواف مستديرة مع سهولة الإغلاق بالخارج ومفتاح Esc.' }
      ],
      ux: [
        { key: 'uxClicksCount' as keyof AuditChecklist, label: 'عدد النقرات', desc: 'تقليص النقرات وضربات المفاتيح لإتمام المهام الأساسية.' },
        { key: 'uxFieldOrder' as keyof AuditChecklist, label: 'ترتيب الحقول', desc: 'الترتيب المنطقي للتنقل بمفتاح Tab في الاستمارات.' },
        { key: 'uxSearch' as keyof AuditChecklist, label: 'سرعة وجودة البحث', desc: 'التصفية المتزامنة ودعم الكلمات المرنة والبديلة.' },
        { key: 'uxNavigation' as keyof AuditChecklist, label: 'سهولة التنقل', desc: 'وضوح المسارات والرجوع للشاشات السابقة دون تيه.' },
        { key: 'uxMessages' as keyof AuditChecklist, label: 'وضوح الرسائل', desc: 'وضوح تنبيهات الخطأ والنجاح باللغة العربية البسيطة.' },
        { key: 'uxProductivity' as keyof AuditChecklist, label: 'مستوى الإنتاجية', desc: 'دعم المعالجة السريعة والعمليات المكثفة بكفاءة.' }
      ],
      functional: [
        { key: 'funcCompleteness' as keyof AuditChecklist, label: 'اكتمال الوظائف', desc: 'جاهزية جميع الأزرار والروابط وتأدية دورها المطلوب.' },
        { key: 'funcErrorStates' as keyof AuditChecklist, label: 'حالات الخطأ والحدود', desc: 'تغطية حالات الاستثناء وخلو الشاشة من توقفات الـ JS.' },
        { key: 'funcInputValidation' as keyof AuditChecklist, label: 'التحقق من المدخلات', desc: 'منع إدخال بيانات غير صحيحة أو هجمات الاختراق الأساسية.' },
        { key: 'funcPrint' as keyof AuditChecklist, label: 'ملاءمة الطباعة', desc: 'جاهزية كود CSS للطباعة الورقية وتوزيع المحتوى.' },
        { key: 'funcExport' as keyof AuditChecklist, label: 'جودة التصدير', desc: 'سلامة تصدير البيانات إلى ملفات Excel & PDF دون تلف الترميز.' }
      ],
      engineering: [
        { key: 'engComponentSize' as keyof AuditChecklist, label: 'حجم Component', desc: 'التحكم في الأسطر وحجم الشفرة وتجنب التضخم الزائد.' },
        { key: 'engSplitPotential' as keyof AuditChecklist, label: 'إمكانية تقسيمه', desc: 'سهولة استخلاص المكونات الفرعية وبنائها بشكل مستقل.' },
        { key: 'engReusability' as keyof AuditChecklist, label: 'إعادة الاستخدام', desc: 'مشاركة العناصر والـ Hooks والوظائف المشتركة بشكل فعال.' },
        { key: 'engDecoupledLogic' as keyof AuditChecklist, label: 'فصل Business Logic', desc: 'فصل الدوال والعمليات المحاسبية عن هيكل العرض (JSX).' },
        { key: 'engPerformance' as keyof AuditChecklist, label: 'الأداء ومعدل التحديث', desc: 'التحكم بالـ Renders وتجنب الحلقات اللانهائية وتخزين البيانات.' }
      ]
    };
  }, []);

  const totalChecklistItems = 22;

  // Compute live scores and cert status for each screen
  const screenCalculations = useMemo(() => {
    const calcMap: Record<string, {
      averageScore: number;
      hasActiveCritical: boolean;
      status: 'production' | 'needs_improvement' | 'needs_review' | 'not_certified';
      statusText: string;
      statusColor: string;
      statusBg: string;
      isCertified: boolean;
      checkedCount: number;
    }> = {};

    screensData.forEach(screen => {
      // Calculate averageScore based on checklist items checked
      const checkedCount = Object.values(screen.checklist).filter(Boolean).length;
      const averageScore = Math.round((checkedCount / totalChecklistItems) * 100);

      const hasActiveCritical = screen.criticalObservations.some(obs => !obs.isResolved && obs.severity === 'critical');

      let status: 'production' | 'needs_improvement' | 'needs_review' | 'not_certified';
      let isCertified = false;

      if (hasActiveCritical) {
        status = 'not_certified';
      } else if (averageScore === 100) {
        status = 'production';
        isCertified = true;
      } else if (averageScore >= 90) {
        status = 'needs_improvement';
        isCertified = true; // Certified but with warnings
      } else if (averageScore >= 75) {
        status = 'needs_review';
        isCertified = false;
      } else {
        status = 'not_certified';
        isCertified = false;
      }

      let statusText = '';
      let statusColor = '';
      let statusBg = '';

      if (hasActiveCritical) {
        statusText = 'مرفوض - ملاحظة حرجة نشطة ⛔';
        statusColor = 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800';
        statusBg = 'bg-rose-50 dark:bg-rose-950/30';
      } else {
        switch (status) {
          case 'production':
            statusText = 'جاهز للإنتاج 🟢 (معتمد)';
            statusColor = 'text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
            statusBg = 'bg-emerald-50 dark:bg-emerald-950/30';
            break;
          case 'needs_improvement':
            statusText = 'تحسينات محدودة 🟡 (معتمد مشروط)';
            statusColor = 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800';
            statusBg = 'bg-amber-50 dark:bg-amber-950/30';
            break;
          case 'needs_review':
            statusText = 'مراجعة مركزة 🟠 (تحتاج معالجة)';
            statusColor = 'text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800';
            statusBg = 'bg-orange-50 dark:bg-orange-950/30';
            break;
          case 'not_certified':
            statusText = 'لا يعتمد 🔴 (غير مطابق)';
            statusColor = 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800';
            statusBg = 'bg-rose-50 dark:bg-rose-950/30';
            break;
        }
      }

      calcMap[screen.id] = {
        averageScore,
        hasActiveCritical,
        status,
        statusText,
        statusColor,
        statusBg,
        isCertified,
        checkedCount
      };
    });

    return calcMap;
  }, [screensData]);

  // Global statistics
  const stats = useMemo(() => {
    const total = screensData.length;
    let productionCount = 0;
    let limitedImprovementCount = 0;
    let focusedReviewCount = 0;
    let uncertifiedCount = 0;
    let totalScoreSum = 0;

    screensData.forEach(screen => {
      const calc = screenCalculations[screen.id];
      totalScoreSum += calc.averageScore;

      if (calc.hasActiveCritical) {
        uncertifiedCount++;
      } else if (calc.status === 'production') {
        productionCount++;
      } else if (calc.status === 'needs_improvement') {
        limitedImprovementCount++;
      } else if (calc.status === 'needs_review') {
        focusedReviewCount++;
      } else {
        uncertifiedCount++;
      }
    });

    const averageOverall = Math.round(totalScoreSum / total);
    const certifiedCount = productionCount + limitedImprovementCount;
    const certifiedPercent = Math.round((certifiedCount / total) * 100);

    return {
      total,
      productionCount,
      limitedImprovementCount,
      focusedReviewCount,
      uncertifiedCount,
      averageOverall,
      certifiedCount,
      certifiedPercent
    };
  }, [screensData, screenCalculations]);

  // Selected Screen reference
  const selectedScreen = useMemo(() => {
    return screensData.find(s => s.id === selectedScreenId) || screensData[0];
  }, [screensData, selectedScreenId]);

  const selectedScreenCalc = useMemo(() => {
    return screenCalculations[selectedScreen.id];
  }, [selectedScreen, screenCalculations]);

  // Filtered list
  const filteredScreens = useMemo(() => {
    return screensData.filter(screen => {
      const calc = screenCalculations[screen.id];
      
      const matchesSearch = 
        screen.nameArabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        screen.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
        screen.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || screen.category === categoryFilter;

      let matchesStatus = true;
      if (statusFilter === 'certified') {
        matchesStatus = calc.isCertified;
      } else if (statusFilter === 'warning') {
        matchesStatus = calc.status === 'needs_improvement' && !calc.hasActiveCritical;
      } else if (statusFilter === 'review') {
        matchesStatus = calc.status === 'needs_review' && !calc.hasActiveCritical;
      } else if (statusFilter === 'rejected') {
        matchesStatus = calc.hasActiveCritical || calc.status === 'not_certified';
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [screensData, screenCalculations, searchTerm, categoryFilter, statusFilter]);

  // Toggle individual checklist item state
  const handleToggleChecklist = (screenId: string, itemKey: keyof AuditChecklist) => {
    setScreensData(prev => prev.map(screen => {
      if (screen.id === screenId) {
        return {
          ...screen,
          checklist: {
            ...screen.checklist,
            [itemKey]: !screen.checklist[itemKey]
          }
        };
      }
      return screen;
    }));
  };

  // Run Code Remediation Simulation (Auto-refactor to 100%)
  const runAutoRemediation = () => {
    setIsRemediating(true);
    setTerminalLogs([]);
    
    const logs = [
      `🚀 بدء تفعيل حزمة التحسين وإعادة هيكلة الشفرة للشاشة: ${selectedScreen.nameArabic}...`,
      `📦 فحص حجم المكون والملفات الفرعية (Engineering Checklist: componentSize, splitPotential)...`,
      `⚙️ تجميع وعزل منطق قواعد الأعمال (Business Logic) في هوكس مخصصة (useAdmissions, useExamGrading)...`,
      `🎨 تطبيق محاذاة Tailwind CSS وهندسة الألوان والخطوط (Visual Alignment, Colors, Buttons)...`,
      `🔍 فحص واجهة البحث، وتفعيل التصفية والـ Debounce (UX Search, Navigation Flow)...`,
      `✍️ تحسين وضوح رسائل التنبيه والمقاييس لخدمة معايير وزارة التعليم (UX Messages, Errors, Inputs)...`,
      `📑 حقن معايير الـ Print CSS والطباعة المنسقة وتوافق ملفات التصدير (PDF/Excel Export Engine)...`,
      `🧪 تشغيل اختبارات الوحدة للتأكد من عدم وجود تراجع برمجي...`,
      `🎉 اكتمال العلاج التلقائي بالكامل! الشاشة جاهزة الآن بنسبة 100% ومتوافقة مع المعايير الذهبية.`
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setTerminalLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsRemediating(false);
        
        // Update selected screen's checklist to all true, and resolve any critical observations
        setScreensData(prev => prev.map(screen => {
          if (screen.id === selectedScreen.id) {
            const resolvedChecklist = { ...screen.checklist };
            Object.keys(resolvedChecklist).forEach(key => {
              resolvedChecklist[key as keyof AuditChecklist] = true;
            });
            const resolvedObservations = screen.criticalObservations.map(obs => ({
              ...obs,
              isResolved: true
            }));
            return {
              ...screen,
              checklist: resolvedChecklist,
              criticalObservations: resolvedObservations
            };
          }
          return screen;
        }));

        triggerNotification(`تم تطبيق العلاج البرمجي وحقن واجهات الفحص التلقائية للشاشة بنجاح!`, 'success');
      }
    }, 600);
  };

  // Toggle observation resolution
  const toggleObservationResolve = (screenId: string, obsId: string) => {
    setScreensData(prev => prev.map(screen => {
      if (screen.id === screenId) {
        const updatedObs = screen.criticalObservations.map(obs => {
          if (obs.id === obsId) {
            const nextState = !obs.isResolved;
            triggerNotification(
              nextState 
                ? `تم حل الملاحظة بنجاح! قد يؤثر ذلك إيجاباً على اعتماد الشاشة.` 
                : `تم إعادة تنشيط الملاحظة. سيتم حظر اعتماد الشاشة فوراً لوجود ملاحظة حرجة نشطة.`, 
              nextState ? 'success' : 'warning'
            );
            return { ...obs, isResolved: nextState };
          }
          return obs;
        });
        return { ...screen, criticalObservations: updatedObs };
      }
      return screen;
    }));
  };

  // Add observation
  const handleAddObservation = (screenId: string) => {
    if (!newObsText.trim()) {
      triggerNotification('الرجاء كتابة نص الملاحظة قبل الإضافة.', 'warning');
      return;
    }

    const newObs: CriticalObservation = {
      id: `obs-${Date.now()}`,
      text: newObsText,
      isResolved: false,
      severity: newObsSeverity
    };

    setScreensData(prev => prev.map(screen => {
      if (screen.id === screenId) {
        return {
          ...screen,
          criticalObservations: [...screen.criticalObservations, newObs]
        };
      }
      return screen;
    }));

    setNewObsText('');
    triggerNotification(`تم إضافة ملاحظة ${newObsSeverity === 'critical' ? 'حرجة تؤثر على سير العمل' : 'تحذيرية'} للشاشة.`, 'info');
  };

  // Delete observation
  const handleDeleteObservation = (screenId: string, obsId: string) => {
    setScreensData(prev => prev.map(screen => {
      if (screen.id === screenId) {
        return {
          ...screen,
          criticalObservations: screen.criticalObservations.filter(o => o.id !== obsId)
        };
      }
      return screen;
    }));
    triggerNotification('تم حذف الملاحظة بنجاح.', 'success');
  };

  // Simulated reports printing
  const handlePrintCertificationReport = () => {
    triggerNotification('جاري تجميع مخرجات تدقيق الشاشات وتوليد التقرير المحاسبي والتقني للطباعة...', 'info');
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  // Export JSON file
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(screensData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `EduPro_Screens_Audit_Certification_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification('تم تصدير ملف تدقيق جودة الشاشات بنجاح بصيغة JSON الموحدة.', 'success');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl" id="screens-certification-root">
      
      {/* SECTION BANNER HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#101b35] to-slate-950 border border-amber-500/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl print:hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 justify-end lg:justify-start">
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                بوابة الاعتماد الفردي للشاشات الرئيسية (Screen Quality Gate)
              </span>
              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-black px-2.5 py-1 rounded-md">EduPro Enterprise Ver 238</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">اعتماد الشاشات الرئيسية والتطبيق الهندسي والوظيفي الموحد</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              وفق توجيهات لجنة الجودة، يتم تدقيق سلامة واكتمال كل شاشة رئيسية عبر أربعة محاور حاسمة (التدقيق البصري، تجربة المستخدم، التدقيق الوظيفي، والتدقيق الهندسي). تلتزم المنظومة بعدم اعتماد أي واجهة تحتوي على ثغرة محاسبية أو ملاحظة حرجة غير محلولة، وتوفر إمكانية عزل المنطق وعلاج الشفرات تلقائياً عبر واجهات الحقن البرمجية السريعة.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-amber-500/15 border border-amber-500/30 p-4 shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-amber-300 block uppercase">نسبة الشاشات المعتمدة للإنتاج</span>
            <span className="text-3xl font-black text-emerald-400 mt-1 block font-mono">
              {stats.certifiedPercent}%
            </span>
            <p className="text-[10px] text-slate-300 mt-1 font-extrabold flex items-center gap-1 justify-center">
              <span>({stats.certifiedCount} من أصل {stats.total} شاشات)</span>
            </p>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:hidden">
        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right">
          <span className="text-[10px] font-black text-slate-400 block uppercase">إجمالي الشاشات المرصودة</span>
          <span className="text-2xl font-black text-slate-850 dark:text-white mt-1 block font-mono">{stats.total}</span>
          <span className="text-[9.5px] text-amber-500 font-bold block mt-1">تغطي بوابات المنصة كاملة</span>
        </div>

        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right">
          <span className="text-[10px] font-black text-emerald-500 block uppercase">مكتملة بالكامل 🟢</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">{stats.productionCount}</span>
          <span className="text-[9.5px] text-emerald-500 font-bold block mt-1">مطابقة لمعايير الجودة 22/22</span>
        </div>

        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right">
          <span className="text-[10px] font-black text-amber-500 block uppercase">تحسينات محدودة 🟡</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block font-mono">{stats.limitedImprovementCount}</span>
          <span className="text-[9.5px] text-amber-500 font-bold block mt-1">معدل مطابقة &gt;= 90%</span>
        </div>

        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right">
          <span className="text-[10px] font-black text-orange-500 block uppercase">مراجعة مركزة 🟠</span>
          <span className="text-2xl font-black text-orange-600 mt-1 block font-mono">{stats.focusedReviewCount}</span>
          <span className="text-[9.5px] text-orange-500 font-bold block mt-1">تحتاج معالجة هندسية</span>
        </div>

        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right col-span-2 md:col-span-1">
          <span className="text-[10px] font-black text-rose-500 block uppercase">مرفوض / غير مطابق 🔴</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block font-mono">{stats.uncertifiedCount}</span>
          <span className="text-[9.5px] text-rose-500 font-bold block mt-1">ثغرات نشطة أو تقييم دون 75%</span>
        </div>
      </div>

      {/* FILTER & ACTIONS BAR */}
      <div className="dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          
          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input 
              type="text" 
              placeholder="ابحث عن شاشة (مثال: شؤون الطلاب)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-transparent dark:bg-slate-950 dark:border-slate-850 text-xs font-semibold text-right focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-transparent dark:bg-slate-950 dark:border-slate-850 text-xs font-bold"
          >
            <option value="all">كل الأقسام والمجموعات</option>
            <option value="التسجيل والقبول">التسجيل والقبول</option>
            <option value="الشؤون المالية">الشؤون المالية</option>
            <option value="التعليم والأكاديميا">التعليم والأكاديميا</option>
            <option value="الموارد البشرية">الموارد البشرية</option>
            <option value="التحكم والأمان">التحكم والأمان</option>
          </select>

          {/* Status Filter */}
          <div className="flex bg-transparent dark:bg-slate-950 p-1 dark:border-slate-850">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-[10.5px] font-black rounded-lg transition-colors cursor-pointer ${statusFilter === 'all' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('certified')}
              className={`px-3 py-1 text-[10.5px] font-black rounded-lg transition-colors cursor-pointer ${statusFilter === 'certified' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-500/80 hover:text-emerald-600'}`}
            >
              معتمد
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('review')}
              className={`px-3 py-1 text-[10.5px] font-black rounded-lg transition-colors cursor-pointer ${statusFilter === 'review' ? 'bg-orange-600 text-white shadow-xs' : 'text-orange-500/80 hover:text-orange-600'}`}
            >
              مراجعة مركزة
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1 text-[10.5px] font-black rounded-lg transition-colors cursor-pointer ${statusFilter === 'rejected' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-500/80 hover:text-rose-600'}`}
            >
              مرفوض / حرج
            </button>
          </div>
        </div>

        {/* Global Print / Export Actions */}
        <div className="flex gap-2 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={handlePrintCertificationReport}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>طباعة تقرير الاعتماد الشامل</span>
          </button>
          <button
            type="button"
            onClick={handleExportData}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>تصدير ملف التدقيق</span>
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT SPLIT PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* LEFT COLUMN: SCREENS LIST (4 cols) */}
        <div className="lg:col-span-5 space-y-4 print:hidden">
          <div className="flex justify-between items-center px-1">
            <strong className="text-xs font-black text-slate-450 uppercase">قائمة الشاشات المرصودة ({filteredScreens.length}):</strong>
            <span className="text-[10px] text-slate-400 font-bold">اختر شاشة لعرض لوحة التدقيق التفصيلية</span>
          </div>

          <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
            {filteredScreens.length === 0 ? (
              <div className="p-8 text-center dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Info className="w-8 h-8 text-slate-350 mx-auto" />
                <strong className="text-xs font-black text-slate-700 dark:text-slate-300 block">لا توجد نتائج مطابقة</strong>
                <p className="text-[11px] text-slate-400">حاول تعديل فلاتر التصفية أو نصوص البحث بالأعلى.</p>
              </div>
            ) : (
              filteredScreens.map(screen => {
                const calc = screenCalculations[screen.id];
                const isSelected = screen.id === selectedScreenId;
                
                let colorBullet = '';
                if (calc.hasActiveCritical) colorBullet = 'bg-rose-500';
                else if (calc.status === 'production') colorBullet = 'bg-emerald-500';
                else if (calc.status === 'needs_improvement') colorBullet = 'bg-amber-500';
                else if (calc.status === 'needs_review') colorBullet = 'bg-orange-500';
                else colorBullet = 'bg-rose-500';

                return (
                  <div
                    key={screen.id}
                    onClick={() => {
                      setSelectedScreenId(screen.id);
                      setTerminalLogs([]);
                    }}
                    className={`p-4 border transition-all cursor-pointer text-right flex flex-col justify-between gap-3 ${
                      isSelected 
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 dark:border-amber-400/60 shadow-md scale-[1.01]' 
                        : 'dark:bg-slate-900 border-slate-150 dark:border-slate-800/80 hover:border-amber-300 dark:hover:border-amber-800'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md font-extrabold">{screen.category}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorBullet} animate-pulse`} />
                          <span className="text-[11px] font-black font-mono text-slate-700 dark:text-slate-300">
                            {calc.averageScore}% مطابقة
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">{screen.nameArabic}</h4>
                      <p className="text-[10.5px] text-slate-400 leading-relaxed line-clamp-2">{screen.description}</p>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-center text-[9px] font-black text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <div>
                        <span className="block text-slate-500 text-[8px]">مرئي</span>
                        <span className="font-mono text-amber-500">
                          {Object.keys(screen.checklist).filter(k => k.startsWith('visual') && screen.checklist[k as keyof AuditChecklist]).length}/6
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[8px]">UX</span>
                        <span className="font-mono text-amber-500">
                          {Object.keys(screen.checklist).filter(k => k.startsWith('ux') && screen.checklist[k as keyof AuditChecklist]).length}/6
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[8px]">وظيفي</span>
                        <span className="font-mono text-amber-500">
                          {Object.keys(screen.checklist).filter(k => k.startsWith('func') && screen.checklist[k as keyof AuditChecklist]).length}/5
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[8px]">هندسي</span>
                        <span className="font-mono text-amber-500">
                          {Object.keys(screen.checklist).filter(k => k.startsWith('eng') && screen.checklist[k as keyof AuditChecklist]).length}/5
                        </span>
                      </div>
                    </div>

                    {/* Status Indicator Bar */}
                    <div className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black flex items-center justify-between border ${calc.statusColor} ${calc.statusBg}`}>
                      <span>قرار الموثوقية:</span>
                      <strong>{calc.statusText}</strong>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SCREEN DEEP-DIVE AUDIT SHEET (7 cols) */}
        <div className="lg:col-span-7">
          
          {/* AUDIT WORK SHEET CARD */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6 print:p-0 print:border-none print:shadow-none">
            
            {/* Header of Audit Sheet */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Layout className="w-5 h-5 text-amber-500 shrink-0" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{selectedScreen.nameArabic}</h3>
                </div>
                <span className="text-[10.5px] text-slate-400 font-mono block">{selectedScreen.nameEnglish}</span>
              </div>

              {/* Live overall rating for selected */}
              <div className="flex items-center gap-3">
                <div className="text-left font-mono">
                  <span className="text-[10px] text-slate-400 block font-bold">معدل المطابقة</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{selectedScreenCalc.averageScore}%</span>
                </div>
                <div className={`px-3 py-2 border text-center min-w-[130px] ${selectedScreenCalc.statusBg} ${selectedScreenCalc.statusColor}`}>
                  <span className="text-[9px] font-bold block uppercase opacity-75">حالة الشاشة</span>
                  <strong className="text-[10.5px] font-black mt-0.5 block leading-none">{selectedScreenCalc.statusText}</strong>
                </div>
              </div>
            </div>

            {/* CRITICAL BLOCK WARNING IF EXISTS */}
            {selectedScreenCalc.hasActiveCritical && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-1 text-right">
                  <strong className="text-xs font-black block">⛔ حظر الاعتماد الذهبي للشاشة!</strong>
                  <p className="text-[11px] leading-relaxed">
                    لا يمكن منح شهادة الاعتماد لهذه الشاشة على الرغم من جاهزيتها الفنية، نظراً لوجود ملاحظات محاسبية أو أمنية حرجة غير محلولة بالأسفل. يجب حل كافة الملاحظات لتشغيل فك الحظر آلياً.
                  </p>
                </div>
              </div>
            )}

            {/* DESCRIPTION */}
            <div className="p-3 bg-transparent dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850">
              <span className="text-[9.5px] font-black text-slate-450 block uppercase">وظيفة الشاشة والمسؤولية:</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{selectedScreen.description}</p>
            </div>

            {/* INTERACTIVE 4 AUDIT CATEGORIES TABS */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <strong className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span>محاور التدقيق الأربعة المعتمدة (EduPro Standard 4-Audit)</span>
                </strong>
                <span className="text-[10px] text-slate-400 font-mono font-bold">
                  {selectedScreenCalc.checkedCount} / {totalChecklistItems} مكتملة
                </span>
              </div>

              {/* Tab Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'visual', label: '1. التدقيق البصري', count: Object.keys(selectedScreen.checklist).filter(k => k.startsWith('visual') && selectedScreen.checklist[k as keyof AuditChecklist]).length, total: 6, color: 'border-amber-500' },
                  { id: 'ux', label: '2. تدقيق تجربة المستخدم', count: Object.keys(selectedScreen.checklist).filter(k => k.startsWith('ux') && selectedScreen.checklist[k as keyof AuditChecklist]).length, total: 6, color: 'border-purple-500' },
                  { id: 'functional', label: '3. التدقيق الوظيفي', count: Object.keys(selectedScreen.checklist).filter(k => k.startsWith('func') && selectedScreen.checklist[k as keyof AuditChecklist]).length, total: 5, color: 'border-emerald-500' },
                  { id: 'engineering', label: '4. التدقيق الهندسي', count: Object.keys(selectedScreen.checklist).filter(k => k.startsWith('eng') && selectedScreen.checklist[k as keyof AuditChecklist]).length, total: 5, color: 'border-amber-500' }
                ].map(tab => {
                  const isActive = activeAuditTab === tab.id;
                  const isTabComplete = tab.count === tab.total;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveAuditTab(tab.id as any)}
                      className={`p-2.5 border text-right transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-slate-950 border-amber-500 text-white ring-1 ring-amber-500/20' 
                          : 'bg-transparent dark:bg-slate-950/20 border-slate-150 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black">{tab.label}</span>
                        {isTabComplete ? (
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        ) : null}
                      </div>
                      <div className="flex justify-between items-center mt-1.5 text-[9px] font-mono text-slate-400">
                        <span>التقدم المنجز:</span>
                        <strong className="text-amber-600 font-bold">{tab.count} / {tab.total}</strong>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Checklist Items For Selected Tab */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-150 pb-2 mb-2">
                  <h4 className="text-[11px] font-black text-slate-850 dark:text-slate-200">
                    قائمة متطلبات {activeAuditTab === 'visual' ? 'التدقيق البصري والتصميم' : activeAuditTab === 'ux' ? 'تجربة المستخدم والإنتاجية' : activeAuditTab === 'functional' ? 'اكتمال الوظائف وصحة البيانات' : 'التطبيق البرمجي والجودة البرمجية'}
                  </h4>
                  <span className="text-[9px] text-slate-400 font-semibold">* انقر للتحقق من امتثال المطلب بشكل مستقل</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {checklistKeys[activeAuditTab].map(item => {
                    const isChecked = selectedScreen.checklist[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleToggleChecklist(selectedScreen.id, item.key)}
                        className={`p-3 border text-right transition-all flex items-start gap-3 cursor-pointer ${
                          isChecked 
                            ? 'bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' 
                            : 'dark:bg-slate-900 border-slate-150 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-300 dark:bg-slate-950'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="space-y-0.5">
                          <strong className="text-[11px] font-black block">{item.label}</strong>
                          <p className="text-[9.5px] leading-relaxed text-slate-400 dark:text-slate-550">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* REMEDIATION ACTION & TERMINAL */}
            {selectedScreenCalc.averageScore < 100 && (
              <div className="bg-slate-950 border border-slate-800 p-4 space-y-3 text-right">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <strong className="text-xs font-black text-white flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-amber-400 animate-pulse" />
                      معالج الإصلاح الهندسي التلقائي (Remediation Hub)
                    </strong>
                    <p className="text-[10px] text-slate-400">تحليل فوري وحقن تلقائي لعناصر التصميم و منطق قواعد البيانات غير المكتملة.</p>
                  </div>
                  
                  <button
                    type="button"
                    disabled={isRemediating}
                    onClick={runAutoRemediation}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white border border-amber-400/25 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-amber-500/10 shrink-0 self-stretch sm:self-auto justify-center"
                  >
                    <Activity className={`w-4 h-4 ${isRemediating ? 'animate-spin' : ''}`} />
                    <span>{isRemediating ? 'جاري التحليل والمعالجة...' : '⚡ إصلاح الشاشة وإعادة هيكلة الكود'}</span>
                  </button>
                </div>

                {/* Simulated CLI Terminal */}
                {(isRemediating || terminalLogs.length > 0) && (
                  <div className="bg-black/90 border border-slate-800 p-3.5 font-mono text-[10.5px] text-slate-200 space-y-1.5 min-h-[140px] max-h-[220px] overflow-y-auto">
                    <div className="flex justify-between items-center text-slate-500 border-b border-slate-900 pb-1.5 mb-1.5">
                      <span className="flex items-center gap-1"><Terminal className="w-4 h-4 text-emerald-400" /> CLI: /workspace/edupro/refactor_engine</span>
                      <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded uppercase">DIAGNOSTIC</span>
                    </div>
                    {terminalLogs.map((log, index) => (
                      <div key={index} className="leading-relaxed text-left font-mono" style={{ direction: 'ltr' }}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CRITICAL OBSERVATIONS / NOTES MANAGEMENT */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <strong className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>الملاحظات والأخطاء المرصودة لهذه الشاشة ({selectedScreen.criticalObservations.length})</span>
                </strong>
                <span className="text-[10px] text-rose-500 font-bold">* الملاحظات غير المحلولة تحظر الاعتماد</span>
              </div>

              {selectedScreen.criticalObservations.length === 0 ? (
                <div className="p-4 text-center bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>لا توجد أي ملاحظات نشطة أو أخطاء محاسبية مسجلة لهذه الشاشة. الشاشة جاهزة للاعتماد!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedScreen.criticalObservations.map(obs => (
                    <div 
                      key={obs.id} 
                      className={`p-3 border flex items-center justify-between gap-3 text-xs font-semibold ${
                        obs.isResolved 
                          ? 'bg-transparent dark:bg-slate-950/30 border-slate-200 text-slate-450 dark:text-slate-500' 
                          : obs.severity === 'critical'
                            ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-150 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-150 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      <div className="flex items-start gap-2 text-right">
                        {obs.isResolved ? (
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : obs.severity === 'critical' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0 animate-pulse" />
                        ) : (
                          <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        )}
                        <div className="space-y-0.5">
                          <span className={`text-[9.5px] font-black uppercase ${
                            obs.isResolved 
                              ? 'text-slate-400' 
                              : obs.severity === 'critical' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {obs.isResolved ? '[محلولة ✓]' : obs.severity === 'critical' ? '[ملاحظة محاسبية وأمنية ثنائية]' : '[تحذير تنظيمي]'}
                          </span>
                          <p className={`text-[11px] leading-relaxed ${obs.isResolved ? 'line-through opacity-60' : ''}`}>{obs.text}</p>
                        </div>
                      </div>

                      {/* Action buttons on Obs */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleObservationResolve(selectedScreen.id, obs.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors cursor-pointer ${
                            obs.isResolved 
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-750 hover:bg-slate-350' 
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {obs.isResolved ? 'إعادة فتح' : 'اعتماد الحل ✓'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteObservation(selectedScreen.id, obs.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Observation form */}
              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 space-y-3">
                <span className="text-[10px] font-black text-slate-400 block uppercase">تسجيل ملاحظة تدقيق جديدة للجنة الجودة:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500">نص الملاحظة الفنية أو الثغرة المرصودة:</label>
                    <input 
                      type="text" 
                      placeholder="صف الملاحظة، مثلاً: خطأ في تفريغ الذاكرة المؤقتة..." 
                      value={newObsText}
                      onChange={(e) => setNewObsText(e.target.value)}
                      className="w-full px-3 py-1.5 dark:bg-slate-900 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500">مستوى الخطورة والحظر:</label>
                    <select
                      value={newObsSeverity}
                      onChange={(e) => setNewObsSeverity(e.target.value as 'critical' | 'warning')}
                      className="w-full px-2 py-1.5 dark:bg-slate-900 rounded-lg text-xs font-black"
                    >
                      <option value="critical">حرجة ⛔ (تحظر الاعتماد)</option>
                      <option value="warning">تحذيرية ⚠️ (لا تحظر)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddObservation(selectedScreen.id)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>تثبيت الملاحظة بالدفتر الجنائي للجودة</span>
                  </button>
                </div>
              </div>

            </div>

            {/* PREVIEW OF DYNAMIC CERTIFICATION DOCUMENT (printable) */}
            <div className="p-5 border-2 border-dashed border-amber-200 dark:border-amber-900/60 bg-slate-50/50 dark:bg-slate-950/20 space-y-4 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-br-lg uppercase">وثيقة الاعتماد الذهبي الموحد</div>
              
              <div className="space-y-1.5">
                <Award className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">شهادة مطابقة واعتماد الشاشة البرمجية</h4>
                <p className="text-[10px] text-slate-400">تُمنح بموجب تدابير الفحص السحابي والتحقق من قيود الأعمال الأربعة والبروتوكول الهندسي المعتمد</p>
              </div>

              <div className="border-t border-b border-slate-200/60 dark:border-slate-800/60 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-right text-[11px]">
                <div>
                  <span className="text-slate-400 block font-bold">اسم الشاشة:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedScreen.nameArabic}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">القسم التنظيمي:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedScreen.category}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">الموثوقية والامتثال:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedScreenCalc.averageScore}%</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">الملاحظات النشطة:</span>
                  <strong className={selectedScreenCalc.hasActiveCritical ? 'text-rose-500 font-black' : 'text-emerald-500 font-black'}>
                    {selectedScreenCalc.hasActiveCritical ? 'محظورة لوجود ثغرات' : 'لا يوجد ✓'}
                  </strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block font-bold">القرار الإداري النهائي:</span>
                  <strong className={selectedScreenCalc.isCertified ? 'text-emerald-500 font-black' : 'text-rose-500 font-black'}>
                    {selectedScreenCalc.isCertified ? '✓ معتمدة بالكامل للإنتاج السحابي' : '❌ معلقة - تعاد معالجتها برمجياً'}
                  </strong>
                </div>
              </div>

              <div className="flex justify-between items-center text-[9.5px] text-slate-400 font-mono">
                <span>تاريخ التدقيق الرقمي: {new Date().toISOString().slice(0, 19).replace('T', ' ')}</span>
                <span>المُدقق: {localStorage.getItem('currentUserEmail') || 'سلطة الجودة والامتثال'}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
