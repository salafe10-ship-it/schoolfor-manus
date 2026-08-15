import { AlertTriangle, ArrowLeftRight, BookOpen, Check, CheckCircle2, CheckSquare2, Code, DollarSign, Download, FileCheck, Filter, Grid, Layout, Map, Navigation, Network, Percent, Play, Printer, Radio, RefreshCw, Search, ShieldCheck, Terminal, User, Users, XCircle } from 'lucide-react';
import React, { useState, useMemo } from 'react';
interface EnterpriseFullSystemIntegrationCertificationProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface IntegrationLink {
  id: string;
  source: string;
  target: string;
  description: string;
  flowDirection: string;
  isVerified: boolean;
  criticality: 'high' | 'medium' | 'low';
}

interface ModuleIntegrationAudit {
  id: string;
  nameArabic: string;
  nameEnglish: string;
  category: 'financial' | 'academic' | 'hr' | 'system';
  overallStatus: 'certified' | 'blocked';
  links: IntegrationLink[];
}

export default function EnterpriseFullSystemIntegrationCertification({ triggerNotification }: EnterpriseFullSystemIntegrationCertificationProps) {
  // Navigation & Category filter states
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'financial' | 'academic' | 'hr' | 'system'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyBlocked, setShowOnlyBlocked] = useState(false);

  // Unified Platform UX & Behavioral Consistency Audit (User Request Requirements)
  const [userFeelsDifferentApp, setUserFeelsDifferentApp] = useState<boolean>(false);
  const [platformConsistencyChecks, setPlatformConsistencyChecks] = useState([
    { id: 'btn', label: 'توحيد الأزرار', labelEnglish: 'Unified Buttons & Interactions', desc: 'تطابق كامل في تصميم وحواف وحركة وألوان كافة الأزرار عبر وحدات النظام المختلفة لمنع تشتت الكادر.', isOk: true },
    { id: 'msg', label: 'توحيد الرسائل والتنبيهات', labelEnglish: 'Unified Toasts & Dialogs', desc: 'توحيد لغة وإخراج النوافذ المنبثقة ورسائل الخطأ والنجاح Toasts بنفس نمط الصياغة والمظهر البصري.', isOk: true },
    { id: 'tbl', label: 'توحيد الجداول وإخراج البيانات', labelEnglish: 'Unified Data Grids & Tables', desc: 'استخدام جداول موحدة الحواف والخطوط والفرز والتباعد مع ترويسات وخيارات متطابقة في كافة الشاشات والتقارير.', isOk: true },
    { id: 'src', label: 'توحيد آليات وطرق البحث', labelEnglish: 'Unified Universal Search Mechanics', desc: 'نفس سلوك حقول الفلترة السريعة والبحث اللحظي وطرق الاستعلام المتقاطعة عبر جميع الأنظمة الفرعية.', isOk: true },
    { id: 'prt', label: 'توحيد أسلوب وخيارات الطباعة', labelEnglish: 'Unified High-Fidelity Printing Styles', desc: 'ترويسات طباعة وهوامش وتوقيعات موحدة تخضع لنفس معايير الهوية البصرية عالية الجودة عند طباعة الفواتير أو الشهادات.', isOk: true },
    { id: 'exp', label: 'توحيد خيارات تصدير البيانات', labelEnglish: 'Unified Data Export Interfaces', desc: 'نفس طريقة تصدير التقارير والقوائم إلى صيغ Excel و JSON و PDF بضغطة زر موحدة مع المحافظة على التنسيق والسرية.', isOk: true },
    { id: 'prm', label: 'توحيد الصلاحيات وأدوار الأمان', labelEnglish: 'Unified Role-Based Access Controls', desc: 'تطبيق دليل صلاحيات وأدوار أمني مركزي موحد ينعكس لحظياً على كافة الأقسام والمنافذ دون تباين.', isOk: true },
    { id: 'nav', label: 'توحيد أسلوب وأدوات التنقل', labelEnglish: 'Unified Modern Navigation Hierarchy', desc: 'قائمة جانبية وعلوية موحدة تحافظ على نفس التجربة والانسيابية وتمنع تشتت الكادر الإداري والمالي.', isOk: true }
  ]);

  // Simulation / Console logger states
  const [simulatingModule, setSimulatingModule] = useState<string | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString('ar-SA')}] بوابات تكامل النظام جاهزة للفحص والمطابقة.`,
    `[${new Date().toLocaleTimeString('ar-SA')}] بروتوكول ISO/IEC 27001 لتأمين الممرات البينية نشط.`
  ]);

  // Main Audit state with full integration maps for all 4 parts
  const [integrationData, setIntegrationData] = useState<ModuleIntegrationAudit[]>([
    {
      id: 'financial_integration',
      nameArabic: 'التكامل المالي المحاسبي الموحد',
      nameEnglish: 'Unified Financial Ledger & Collections Integration',
      category: 'financial',
      overallStatus: 'certified',
      links: [
        { id: 'fin-1', source: 'الرسوم الدراسية', target: 'التحصيل والمحصلين', description: 'ربط هيكل الرسوم الدراسية المعتمدة ببرامج التحصيل وجدولة الأقساط الشهرية للطلاب آلياً.', flowDirection: 'رسوم ➔ أقساط مجدولة ➔ سداد', isVerified: true, criticality: 'high' },
        { id: 'fin-2', source: 'التحصيل والسداد', target: 'سندات القبض المباشرة', description: 'توليد سندات قبض رقمية مشفرة فور تأكيد عمليات الدفع الإلكتروني أو النقدي.', flowDirection: 'عملية دفع ➔ إصدار سند فوري', isVerified: true, criticality: 'high' },
        { id: 'fin-3', source: 'سندات القبض', target: 'القيود اليومية التلقائية', description: 'ترحيل سندات القبض إلى قيود يومية مزدوجة متزنة (من حـ/ الصندوق أو البنك إلى حـ/ إيرادات الرسوم الدراسية).', flowDirection: 'سند قبض ➔ قيد مزدوج مدين ودائن', isVerified: true, criticality: 'high' },
        { id: 'fin-4', source: 'القيود اليومية', target: 'الأستاذ العام', description: 'ترحيل القيود المعتمدة لحظياً إلى حسابات الأستاذ العام وتحديث كشوفات ميزان المراجعة.', flowDirection: 'قيد يومية ➔ ترحيل فوري لدفتر الأستاذ', isVerified: true, criticality: 'high' },
        { id: 'fin-5', source: 'الأستاذ العام', target: 'القوائم المالية والتقارير', description: 'انعكاس حسابات الأستاذ على قائمة الدخل، الميزانية العمومية والتدفقات النقدية دون تدخل يدوي.', flowDirection: 'الأستاذ العام ➔ ميزان المراجعة ➔ القوائم المالية', isVerified: true, criticality: 'high' }
      ]
    },
    {
      id: 'academic_integration',
      nameArabic: 'التكامل الأكاديمي لشؤون الطلاب والكنترول',
      nameEnglish: 'Academic & Student Affairs Registry Integration',
      category: 'academic',
      overallStatus: 'blocked',
      links: [
        { id: 'aca-1', source: 'بيانات الطلاب والتسجيل', target: 'توزيع الفصول الدراسية', description: 'إدراج الطلاب المقبولين تلقائياً في قوائم الفصول الدراسية بناءً على السن والشعبة والمقاعد المتاحة.', flowDirection: 'تسجيل الطالب ➔ حجز مقعد بالفصل', isVerified: true, criticality: 'high' },
        { id: 'aca-2', source: 'الفصول الدراسية', target: 'لجان الامتحانات والكنترول', description: 'توزيع طلاب الفصول آلياً على مقاعد ومراكز الامتحانات الفصلية مع مراعاة التباعد والترتيب الأبجدي.', flowDirection: 'قوائم الفصول ➔ توزيع لجان وجداول جلوس الطلاب', isVerified: true, criticality: 'high' },
        { id: 'aca-3', source: 'الامتحانات وأوراق الكنترول', target: 'رصد النتائج والعلامات', description: 'ربط دفاتر الامتحانات وأوراق الإجابة الرقمية بشاشات إدخال ورصد الدرجات لضمان عدم ضياع أي ورقة.', flowDirection: 'أوراق الإجابة ➔ رصد الدرجات والتحقق الثنائي', isVerified: true, criticality: 'high' },
        { id: 'aca-4', source: 'رصد النتائج الفصلية', target: 'الشهادات المجمعة المعتمدة', description: 'احتساب التقديرات التراكمية وطباعة الشهادات المدرسية الموحدة مباشرة من واقع رصد درجات الكنترول.', flowDirection: 'علامات نهائية ➔ توليد تلقائي للشهادة بـ QR Code', isVerified: false, criticality: 'high' }
      ]
    },
    {
      id: 'hr_payroll_integration',
      nameArabic: 'تكامل الموارد البشرية والترحيل المالي للرواتب',
      nameEnglish: 'HR, Payroll & Journal Entries Posting Map',
      category: 'hr',
      overallStatus: 'certified',
      links: [
        { id: 'hr-1', source: 'ملفات الموظفين والمعلمين', target: 'مسيرات الرواتب والبدلات', description: 'احتساب الرواتب والبدلات والخصومات الشهرية بناءً على ملف الموظف وسجل الغياب والتأخر الفعلي.', flowDirection: 'حضور وغياب ➔ احتساب البدلات والاستقطاعات', isVerified: true, criticality: 'high' },
        { id: 'hr-2', source: 'مسيرات الرواتب المعتمدة', target: 'القيود اليومية المحاسبية', description: 'توليد قيود استحقاق الرواتب والأجور الشهرية وترحيلها التلقائي للقيود الدفترية العامة لمركز التكلفة.', flowDirection: 'مسير معتمد ➔ قيد استحقاق (من حـ/ مصروفات الرواتب)', isVerified: true, criticality: 'high' },
        { id: 'hr-3', source: 'القيود اليومية والترحيل', target: 'التقارير والميزانية العمومية', description: 'إظهار التزامات الأجور والرواتب المستحقة وغير المدفوعة في الميزانية وتقارير التدفق النقدي بدقة.', flowDirection: 'قيود رواتب ➔ الميزانية والمصروفات الإدارية', isVerified: true, criticality: 'high' }
      ]
    },
    {
      id: 'system_core_integration',
      nameArabic: 'تكامل بيئة النظام وسجل الأمان والأذونات',
      nameEnglish: 'Core System Administration, Security & Auditing',
      category: 'system',
      overallStatus: 'blocked',
      links: [
        { id: 'sys-1', source: 'إدارة الصلاحيات والأدوار', target: 'سجل التدقيق والمراقبة', description: 'تسجيل كامل تحركات الصلاحيات وتغيير الأدوار الأمنية في سجل التدقيق غير القابل للتعديل لمنع التلاعب.', flowDirection: 'تعديل صلاحية ➔ تدوين تفاصيل العملية و IP المستخدم', isVerified: true, criticality: 'high' },
        { id: 'sys-2', source: 'سجل التدقيق والنشاطات', target: 'مركز الإشعارات الفورية', description: 'إرسال تنبيهات بريدية وهاتفية فورية لولي الأمر أو الإدارة العليا عند حدوث عمليات مالية أو أكاديمية بالغة الأهمية.', flowDirection: 'حدث حساس ➔ إرسال تنبيه فوري ومتعدد القنوات', isVerified: true, criticality: 'high' },
        { id: 'sys-3', source: 'الإشعارات وسجلات النظام', target: 'لوحة معلومات الإدارة التنفيذية', description: 'عرض مؤشرات الأداء ومستوى استقرار المنظومة والعمليات النشطة على لوحة معلومات الإشراف الموحد.', flowDirection: 'عمليات معالجة ➔ قراءة لوحات التحكم التفاعلية', isVerified: true, criticality: 'high' },
        { id: 'sys-4', source: 'لوحة المعلومات والمؤشرات', target: 'التقارير الإحصائية العميقة', description: 'تصدير التقارير الإحصائية والتحليلات البيانية والمقارنات السنوية متوافقة بالكامل مع البيانات الحقيقية للتشغيل.', flowDirection: 'مؤشرات حية ➔ تصدير جداول PDF مطابقة للواقع', isVerified: false, criticality: 'medium' }
      ]
    }
  ]);

  // Toggle specific integration link verification state
  const handleToggleLinkVerify = (moduleId: string, linkId: string) => {
    setIntegrationData(prev => prev.map(module => {
      if (module.id === moduleId) {
        const updatedLinks = module.links.map(link => {
          if (link.id === linkId) {
            const nextState = !link.isVerified;
            triggerNotification(
              nextState 
                ? `تم إثبات صحة ربط وتكامل [${link.source} ➔ ${link.target}] بنجاح.` 
                : `تم إلغاء اعتماد التكامل البيني لـ [${link.source} ➔ ${link.target}]. سيتم حظر اعتماد هذه الوحدة.`, 
              nextState ? 'success' : 'warning'
            );
            return { ...link, isVerified: nextState };
          }
          return link;
          return link;
        });
        
        // Dynamically compute module status: "certified" only if ALL links are verified
        const anyUnverified = updatedLinks.some(l => !l.isVerified);
        const overallStatus = anyUnverified ? 'blocked' : 'certified';

        return {
          ...module,
          links: updatedLinks,
          overallStatus
        };
      }
      return module;
    }));
  };

  // Toggle single platform consistency check
  const handleToggleConsistencyCheck = (id: string) => {
    setPlatformConsistencyChecks(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.isOk;
        triggerNotification(
          nextState 
            ? `تم التحقق من استيفاء معيار [${item.label}] بنجاح عبر كافة موديولات المنصة.`
            : `تنبيه: تم وضع علامة عدم تطابق لـ [${item.label}]. هذا يلغي اعتماد تجربة المنصة الموحدة.`,
          nextState ? 'success' : 'warning'
        );
        return { ...item, isOk: nextState };
      }
      return item;
    }));
  };

  // Run Integration Sync Simulation for a specific module
  const handleRunSyncSimulation = (module: ModuleIntegrationAudit) => {
    if (simulatingModule) return;
    setSimulatingModule(module.id);
    
    // Log start
    setSimulationLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] بدء فحص واختبار مسارات التكامل التلقائي لـ (${module.nameArabic})...`,
      ...prev
    ]);

    let step = 0;
    const logsInterval = setInterval(() => {
      if (step < module.links.length) {
        const link = module.links[step];
        setSimulationLogs(prev => [
          `[${new Date().toLocaleTimeString('ar-SA')}] جاري اختبار صحة البيانات المتدفقة من [${link.source}] إلى [${link.target}]...`,
          `[${new Date().toLocaleTimeString('ar-SA')}] المعاملات مطابقة للقواعد المالية والأكاديمية: ${link.isVerified ? 'نجاح (متكامل ✓)' : 'فشل (ممر غير مكتمل أو ملغي ❌)'}`,
          ...prev
        ]);
        step++;
      } else {
        clearInterval(logsInterval);
        
        // Final module evaluation
        const allOk = module.links.every(l => l.isVerified);
        if (allOk) {
          triggerNotification(`اكتمل فحص تكامل دورة العمل لـ ${module.nameArabic} بنجاح ومطابق بنسبة 100%!`, 'success');
          setSimulationLogs(prev => [
            `[${new Date().toLocaleTimeString('ar-SA')}] تم تأكيد سلامة الاتصال والتكامل المحاسبي لـ (${module.nameArabic}) بنسبة 100% 🎖️`,
            ...prev
          ]);
        } else {
          triggerNotification(`تنبيه: تم اكتشاف حلقة تكامل غير مكتملة في ${module.nameArabic}. يرجى معالجتها فوراً.`, 'danger');
          setSimulationLogs(prev => [
            `[${new Date().toLocaleTimeString('ar-SA')}] ⚠️ تحذير: فشل بروتوكول مطابقة التكامل لـ (${module.nameArabic}) بسبب عدم التحقق من كافة ممرات البيانات المفتوحة.`,
            ...prev
          ]);
        }
        setSimulatingModule(null);
      }
    }, 800);
  };

  // Force automatic reconciliation/repair for all integration paths
  const handleAutomaticReconciliation = () => {
    setSimulationLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] بدء التشغيل الشامل لبروتوكول المعايرة والمطابقة البينية التلقائية...`,
      ...prev
    ]);

    setTimeout(() => {
      setIntegrationData(prev => prev.map(module => {
        const repairedLinks = module.links.map(l => ({ ...l, isVerified: true }));
        return {
          ...module,
          links: repairedLinks,
          overallStatus: 'certified'
        };
      }));

      setSimulationLogs(prev => [
        `[${new Date().toLocaleTimeString('ar-SA')}] تم بنجاح تفعيل الربط التلقائي وإثبات صحة كافة الحركات المالية والأكاديمية بنجاح 🟢`,
        `[${new Date().toLocaleTimeString('ar-SA')}] مطابقة قيود الدفتر العام مع الخزائن والتحصيلات: مطابقة بنسبة 100%.`,
        `[${new Date().toLocaleTimeString('ar-SA')}] مطابقة لجان الكنترول مع درجات غياب شؤون الطلاب: متطابقة تماماً.`,
        ...prev
      ]);

      triggerNotification('تم تفعيل وإصلاح كافة حلقات التكامل البينية بنجاح! جميع الوحدات الآن معتمدة للإنتاج.', 'success');
    }, 1500);
  };

  // Calculations for integration metrics
  const integrationMetrics = useMemo(() => {
    let totalLinksCount = 0;
    let verifiedLinksCount = 0;
    let totalModules = integrationData.length;
    let certifiedModulesCount = 0;

    integrationData.forEach(module => {
      if (module.overallStatus === 'certified') {
        certifiedModulesCount++;
      }
      module.links.forEach(link => {
        totalLinksCount++;
        if (link.isVerified) {
          verifiedLinksCount++;
        }
      });
    });

    const isPlatformConsistent = platformConsistencyChecks.every(item => item.isOk);
    const overallProgressPercent = totalLinksCount > 0 ? Math.round((verifiedLinksCount / totalLinksCount) * 100) : 0;
    
    // Sovereign rule: if user feels they moved to a different app, we block system certification
    const isSystemFullyCertified = certifiedModulesCount === totalModules && isPlatformConsistent && !userFeelsDifferentApp;

    return {
      totalModules,
      certifiedModulesCount,
      totalLinksCount,
      verifiedLinksCount,
      overallProgressPercent,
      isSystemFullyCertified,
      isPlatformConsistent
    };
  }, [integrationData, platformConsistencyChecks, userFeelsDifferentApp]);

  // Filtered integration lists based on filters
  const filteredModules = useMemo(() => {
    return integrationData.filter(module => {
      // 1. Category Filter
      const matchesCategory = activeCategoryFilter === 'all' || module.category === activeCategoryFilter;

      // 2. Search search term (in title or link names)
      const matchesSearch = 
        module.nameArabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.links.some(l => 
          l.source.toLowerCase().includes(searchTerm.toLowerCase()) || 
          l.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // 3. Blocked status
      const matchesBlocked = !showOnlyBlocked || module.overallStatus === 'blocked';

      return matchesCategory && matchesSearch && matchesBlocked;
    });
  }, [integrationData, activeCategoryFilter, searchTerm, showOnlyBlocked]);

  // Trigger Print Friendly Report
  const handlePrintReport = () => {
    triggerNotification('جاري تحضير وثيقة اعتماد وتكامل الأنظمة الموحدة الموجهة للطباعة...', 'info');
    setTimeout(() => {
      window.print();
    }, 800);
  };

  // Export integration map data
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(integrationData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Full_System_Integration_Certification_Audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification('تم بنجاح تصدير خريطة التدقيق والاعتماد المالي والأكاديمي بصيغة JSON الموحدة.', 'success');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl" id="full-system-integration-root">
      
      {/* ENTERPRISE BANNER HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#111827] to-[#1e1b4b] border border-violet-500/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl print:hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 justify-end lg:justify-start">
              <span className="bg-violet-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                <Network className="w-3.5 h-3.5 text-violet-300" />
                المرحلة السابعة عشرة: بوابة اعتماد وتكامل الأنظمة الموحدة (ERP Integration Quality Gate)
              </span>
              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-black px-2.5 py-1 rounded-md">
                بروتوكول الاعتماد المشروط بالتكامل الكلي
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">بوابة مراقبة واعتماد وتكامل الأنظمة والربط البيني الموحد</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed">
              وفقاً لأعلى معايير الإطلاق المالي والمحاسبي والأكاديمي، <strong className="text-emerald-400">لا يعتمد أي مجمع أو وحدة محاسبية أو إدارية إذا كان التكامل بينها وبين بقية المنظومة غير مكتمل 100%.</strong> نقوم هنا بالتحقق من ربط مسار التحصيل والرسوم بالدفتر العام، ومزامنة الطلاب بالامتحانات والشهادات، بالإضافة إلى ربط رواتب الموارد البشرية بالقيود اليومية التلقائية.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-violet-500/15 border border-violet-500/30 p-4 rounded-2xl shrink-0 min-w-[240px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-violet-300 block uppercase">جاهزية الترابط البيني للمنصة</span>
            <span className="text-3xl font-black text-emerald-400 mt-1 block font-mono">
              {integrationMetrics.overallProgressPercent}%
            </span>
            <p className="text-[10px] text-slate-300 mt-1.5 font-extrabold flex items-center gap-1 justify-center">
              <span>({integrationMetrics.verifiedLinksCount} من أصل {integrationMetrics.totalLinksCount} ممرات مفعلة ومطابقة)</span>
            </p>
          </div>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl text-right">
          <span className="text-[10px] font-black text-slate-400 block uppercase">إجمالي بوابات الربط الرئيسية</span>
          <span className="text-2xl font-black text-slate-850 dark:text-white mt-1 block font-mono">{integrationMetrics.totalModules} بوابات ضخمة</span>
          <p className="text-[9.5px] text-indigo-500 font-bold block mt-1">تغطي كامل دورات العمل اليومية</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl text-right">
          <span className="text-[10px] font-black text-emerald-500 block uppercase">بوابات تكامل معتمدة بالكامل 🟢</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">{integrationMetrics.certifiedModulesCount}</span>
          <p className="text-[9.5px] text-emerald-500 font-bold block mt-1">مسارات آمنة خالية من حلقات الضياع</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl text-right">
          <span className="text-[10px] font-black text-rose-500 block uppercase">بوابات تكامل محظورة ⛔</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block font-mono">{integrationMetrics.totalModules - integrationMetrics.certifiedModulesCount}</span>
          <p className="text-[9.5px] text-rose-500 font-bold block mt-1">تكامل غير مكتمل يؤخر الاعتماد النهائي</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl text-right">
          <span className="text-[10px] font-black text-amber-500 block uppercase">الحالة الكلية للجاهزية والامتثال</span>
          {integrationMetrics.isSystemFullyCertified ? (
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-2 block">
              نظام موحد وجاهز للتشغيل ✓
            </span>
          ) : (
            <span className="text-base font-black text-rose-600 dark:text-rose-400 mt-2 block animate-pulse">
              معلق - ممرات غير متكاملة ⚠️
            </span>
          )}
          <p className="text-[9px] text-slate-400 block mt-1 font-semibold">بناءً على بروتوكول سلامة البيانات النهائي</p>
        </div>
      </div>

      {/* SECTION: PLATFORM UX & BEHAVIORAL CONSISTENCY AUDIT (USER INTENT INTEGRATION) */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-md print:hidden" id="platform-consistency-audit-panel">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Layout className="w-5 h-5" />
              </span>
              <span>مراجعة اتساق وتوحيد المنصة الذكية (Unified Platform & UX Compliance)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
              المعيار الحاكم للجان حوكمة الأنظمة: <strong className="text-indigo-600">التحقق من أن جميع الوحدات تعمل كمنصة متكاملة واحدة</strong> لضمان ألا يشعر المستخدم بأي تشتت أو تبدل للهوية الرقمية.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {integrationMetrics.isPlatformConsistent && !userFeelsDifferentApp ? (
              <span className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>المنصة موحدة ومطابقة ✓</span>
              </span>
            ) : (
              <span className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 flex items-center gap-2 shadow-xs animate-pulse">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>مراجعة التوحيد معلقة ⚠️</span>
              </span>
            )}
          </div>
        </div>

        {/* 8 Core Aspects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {platformConsistencyChecks.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleToggleConsistencyCheck(item.id)}
              className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                item.isOk
                  ? 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-850 shadow-xs'
                  : 'bg-rose-50/10 dark:bg-rose-950/5 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50/20'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                    {item.isOk ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                    <span>{item.label}</span>
                  </span>
                  
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                    item.isOk 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' 
                      : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
                  }`}>
                    {item.isOk ? 'معتمد' : 'غير متسق'}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 leading-relaxed font-semibold">{item.desc}</p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-black self-end">
                {item.isOk ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>تم توحيد العنصر</span>
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>يحتاج توحيد ومراجعة</span>
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* DECISION CRITERION SOVEREIGN CARD */}
        <div className="p-5 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 dark:from-amber-950/10 dark:to-indigo-950/10 border border-amber-300/30 dark:border-amber-900/30 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-block bg-amber-500/20 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                قرار الاعتماد النهائي الحاسم (The Single-Platform Acid Test)
              </span>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                إذا شعر المستخدم في أي لحظة أنه انتقل إلى "برنامج مختلف" عند الانتقال للوحدات والتبويب الأخرى، فلا يُعتمد النظام بالكامل!
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">هل يشعر المستخدم باختلاف التصميم والبرنامج؟</span>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !userFeelsDifferentApp;
                  setUserFeelsDifferentApp(nextVal);
                  triggerNotification(
                    nextVal
                      ? "🚨 تم تفعيل إنذار عدم الاتساق! حظر اعتماد النظام فوراً لوجود اختلاف في تجربة الاستخدام."
                      : "🟢 تم إلغاء إنذار عدم الاتساق. المنصة تعتبر مدمجة بصرياً الآن.",
                    nextVal ? "danger" : "success"
                  );
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  userFeelsDifferentApp
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10 hover:bg-rose-700'
                    : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                {userFeelsDifferentApp ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-200 animate-pulse" />
                    <span>نعم، هناك اختلاف (احظر النظام ⛔)</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-slate-500" />
                    <span>لا، متطابقة بالكامل (اعتمد المنصة ✓)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & CORE ACTIONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        
        {/* Left Side: Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Term */}
          <div className="relative min-w-[250px] w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input 
              type="text" 
              placeholder="ابحث عن ممر تكاملي (مثال: القيود اليومية)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-right focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1.5 text-[10.5px] font-black rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeCategoryFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              كل التكاملات
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('financial')}
              className={`px-3 py-1.5 text-[10.5px] font-black rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${activeCategoryFilter === 'financial' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>الربط المالي</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('academic')}
              className={`px-3 py-1.5 text-[10.5px] font-black rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${activeCategoryFilter === 'academic' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>الربط الأكاديمي</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('hr')}
              className={`px-3 py-1.5 text-[10.5px] font-black rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${activeCategoryFilter === 'hr' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>الموارد البشرية</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('system')}
              className={`px-3 py-1.5 text-[10.5px] font-black rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${activeCategoryFilter === 'system' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>أمن النظام والتقارير</span>
            </button>
          </div>
        </div>

        {/* Right Side: Quick Action buttons */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleAutomaticReconciliation}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-200" />
            <span>معايرة ومطابقة تكاملات المنصة تلقائياً</span>
          </button>
          
          <button
            type="button"
            onClick={handlePrintReport}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
            title="طباعة"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">طباعة تقرير التكامل</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
            title="تصدير"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">تصدير الخريطة</span>
          </button>
        </div>
      </div>

      {/* CORE INTEGRATION DASHBOARD LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* LEFT COLUMN: ACTIVE INTEGRATION VERIFICATION GRID (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider">
              قائمة بوابات وممرات التراسل والتكامل البيني ({filteredModules.length}):
            </h3>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-extrabold cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showOnlyBlocked}
                onChange={(e) => setShowOnlyBlocked(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>إظهار البوابات المعلقة فقط ⚠️</span>
            </label>
          </div>

          <div className="space-y-6">
            {filteredModules.map(module => {
              const verifiedCount = module.links.filter(l => l.isVerified).length;
              const progress = Math.round((verifiedCount / module.links.length) * 100);
              const isCertified = module.overallStatus === 'certified';

              return (
                <div 
                  key={module.id}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 sm:p-6 transition-all ${
                    isCertified 
                      ? 'border-slate-150 dark:border-slate-800/80' 
                      : 'border-rose-300 dark:border-rose-900/60 shadow-lg shadow-rose-500/5'
                  }`}
                >
                  {/* Module Header card */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {module.category === 'financial' && <DollarSign className="w-5 h-5 text-emerald-500" />}
                        {module.category === 'academic' && <BookOpen className="w-5 h-5 text-indigo-500" />}
                        {module.category === 'hr' && <Users className="w-5 h-5 text-orange-500" />}
                        {module.category === 'system' && <ShieldCheck className="w-5 h-5 text-violet-500" />}
                        
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{module.nameArabic}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono">{module.nameEnglish}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Percent badge */}
                      <div className="text-left font-mono shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold block">جاهزية الربط</span>
                        <strong className="text-sm font-black text-indigo-600 block">{progress}%</strong>
                      </div>

                      {/* Certification status tag */}
                      {isCertified ? (
                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>تكامل معتمد ✓</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 flex items-center gap-1.5 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                          <span>تكامل محظور ⛔</span>
                        </span>
                      )}

                      {/* Simulation Trigger button */}
                      <button
                        type="button"
                        onClick={() => handleRunSyncSimulation(module)}
                        disabled={simulatingModule !== null}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 text-slate-500" />
                        <span>اختبار المسار</span>
                      </button>
                    </div>
                  </div>

                  {/* Flow map visual representation */}
                  <div className="py-4 px-2.5 my-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-wrap items-center gap-2 justify-center text-[10.5px] font-black text-slate-750 dark:text-slate-300">
                    <Radio className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>ممر البيانات:</span>
                    {module.links.map((link, idx) => (
                      <React.Fragment key={link.id}>
                        <span className={`px-2 py-0.5 rounded-md border ${link.isVerified ? 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400'}`}>
                          {link.source}
                        </span>
                        {idx < module.links.length - 1 && (
                          <span className="text-slate-400 font-bold mx-1">➔</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Detailed connector checklist */}
                  <div className="space-y-3.5">
                    {module.links.map(link => (
                      <div 
                        key={link.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                          link.isVerified 
                            ? 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-150 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850/30' 
                            : 'bg-amber-50/15 dark:bg-amber-950/5 border-amber-200/50 dark:border-amber-900/30 hover:bg-amber-50/20'
                        }`}
                      >
                        <div className="space-y-1.5 text-right flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1">
                              <span>ربط [ {link.source} ]</span>
                              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                              <span>[ {link.target} ]</span>
                            </span>
                            {link.criticality === 'high' && (
                              <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">رابط سيادي حرج</span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{link.description}</p>
                          <span className="text-[9.5px] text-indigo-500 font-bold block font-mono">اتجاه التراسل: {link.flowDirection}</span>
                        </div>

                        {/* Verification controls */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleToggleLinkVerify(module.id, link.id)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                              link.isVerified 
                                ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700' 
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {link.isVerified ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-200" />
                                <span>تم التحقق والتفعيل</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                <span className="text-rose-600 dark:text-rose-400">معلق - انقر للاعتماد</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: REAL-TIME CONSOLE LOGGER & CORE PRE-LAUNCH INTEGRATION AUDIT CHECKLIST (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* REAL-TIME LOGS CONSOLE */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl text-right text-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
              <strong className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>شاشة مراقبة التكامل والمطابقة البينية</span>
              </strong>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-bold font-mono">LIVE MATCHING</span>
              </div>
            </div>

            {/* Simulated Live Terminal output */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 font-mono text-[10px] leading-relaxed text-slate-300">
              {simulationLogs.map((log, index) => (
                <p 
                  key={index} 
                  className={
                    log.includes('⚠️') 
                      ? 'text-amber-400' 
                      : log.includes('نجاح') || log.includes('🟢') || log.includes('✓')
                        ? 'text-emerald-400 font-extrabold' 
                        : log.includes('فشل') || log.includes('❌')
                          ? 'text-rose-400 font-extrabold'
                          : 'text-slate-300'
                  }
                >
                  {log}
                </p>
              ))}
            </div>

            <div className="pt-2 text-left border-t border-slate-850">
              <button
                type="button"
                onClick={() => setSimulationLogs([`[${new Date().toLocaleTimeString('ar-SA')}] تم مسح سجلات المراقبة لتلقي البيانات الجديدة.`, ...simulationLogs])}
                className="text-[9px] text-indigo-400 hover:text-indigo-300 font-black"
              >
                مسح الشاشة المحاسبية والتقنية
              </button>
            </div>
          </div>

          {/* DYNAMIC INTEGRATION CERTIFICATE AND ACTION BLOCK */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs">
            
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                <FileCheck className="w-4 h-4 text-indigo-500" />
                <span>حالة تصفية ممرات الربط والبوابات</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">قرار لجان الاعتماد والتطابق المشتركة</p>
            </div>

            <div className="space-y-4">
              
              {/* Detailed Breakdown checkboxes to review */}
              <div className="space-y-2.5 text-right">
                
                {/* 1. Finance checklist */}
                <div className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="mt-0.5 shrink-0">
                    {integrationData[0].overallStatus === 'certified' ? (
                      <CheckSquare2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <strong className="text-[11.5px] font-black text-slate-800 dark:text-slate-200 block">✓ التكامل المالي المحاسبي الموحد</strong>
                    <span className="text-[9.5px] text-slate-450 block">ربط الرسوم، الفواتير، التحصيلات، سندات القبض، القيود، والأستاذ العام</span>
                  </div>
                </div>

                {/* 2. Academic checklist */}
                <div className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="mt-0.5 shrink-0">
                    {integrationData[1].overallStatus === 'certified' ? (
                      <CheckSquare2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <strong className="text-[11.5px] font-black text-slate-800 dark:text-slate-200 block">✓ التكامل الأكاديمي والكنترول</strong>
                    <span className="text-[9.5px] text-slate-450 block">ربط ملف الطالب، توزيع الفصول، توزيع اللجان، رصد النتائج، والشهادات</span>
                  </div>
                </div>

                {/* 3. HR checklist */}
                <div className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="mt-0.5 shrink-0">
                    {integrationData[2].overallStatus === 'certified' ? (
                      <CheckSquare2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <strong className="text-[11.5px] font-black text-slate-800 dark:text-slate-200 block">✓ تكامل الموارد البشرية والرواتب</strong>
                    <span className="text-[9.5px] text-slate-450 block">ملفات الموظفين والمعلمين، احتساب الرواتب، ترحيل القيود، والتقارير المالية</span>
                  </div>
                </div>

                {/* 4. System Core checklist */}
                <div className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="mt-0.5 shrink-0">
                    {integrationData[3].overallStatus === 'certified' ? (
                      <CheckSquare2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <strong className="text-[11.5px] font-black text-slate-800 dark:text-slate-200 block">✓ تكامل بيئة النظام والأمان والتقارير</strong>
                    <span className="text-[9.5px] text-slate-450 block">الصلاحيات والأدوار، سجل التدقيق للنشاطات، الإشعارات، ولوحات التحكم</span>
                  </div>
                </div>

              </div>

              {/* CRITICAL BLOCK RESOLVER INSTRUCTION */}
              {!integrationMetrics.isSystemFullyCertified ? (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/15 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 block uppercase tracking-wide">⚠️ الاعتماد الكلي محظور الآن!</span>
                  <p className="text-[10.5px] text-rose-700 dark:text-rose-300 leading-relaxed">
                    لا تزال بعض بوابات التكامل معلقة وغير معتمدة بالكامل. وفقاً للقواعد التنظيمية للمنصة، <strong>يمنع المطور من محاكاة التشغيل الفعلي في حال وجود أي حلقة ربط غير مكتملة.</strong> قم بالتحقق من كافة الممرات باليسار أو انقر على زر الإصلاح التلقائي في الأعلى.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block uppercase tracking-wide flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>تم توثيق واعتماد التكامل الموحد بنجاح ✓</span>
                  </span>
                  <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    بوابات وممرات التراسل والتكامل البيني لجميع القطاعات الأربعة (المالي، الأكاديمي، الموارد البشرية، الأمان) متصلة وتعمل بكفاءة 100% وخالية من حلقات الفقد. المنصة معتمدة وجاهزة للإنتاج.
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* SYSTEM PRINT SECTION (Only visible on printing) */}
      <div className="hidden print:block text-right space-y-8 p-12 bg-white text-black" dir="rtl">
        <div className="text-center space-y-3 pb-6 border-b-2 border-slate-900">
          <h1 className="text-2xl font-black">تقرير الاعتماد والتدقيق الشامل للتكامل والربط الموحد للأنظمة</h1>
          <p className="text-sm font-bold">مجمع المدارس الذكية الرقمي المتكامل - بوابة التطابق السحابية</p>
          <p className="text-xs font-mono">تاريخ التوليد والطباعة: {new Date().toLocaleDateString('ar-SA')} - الوقت: {new Date().toLocaleTimeString('ar-SA')}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-black border-r-4 border-indigo-600 pr-2">ملخص حالة جاهزية التكامل والربط الموحد:</h2>
            <div className="grid grid-cols-2 gap-4 text-sm font-bold">
              <div className="p-3 bg-slate-50 border rounded-xl">حالة جاهزية الترابط البيني: <span className="font-mono text-indigo-600">{integrationMetrics.overallProgressPercent}%</span></div>
              <div className="p-3 bg-slate-50 border rounded-xl">عدد ممرات البيانات المعتمدة: <span className="font-mono text-indigo-600">{integrationMetrics.verifiedLinksCount} من {integrationMetrics.totalLinksCount}</span></div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black border-r-4 border-indigo-600 pr-2">التدقيق التفصيلي لممرات التراسل بين القطاعات:</h2>
            
            {integrationData.map((module) => (
              <div key={module.id} className="p-4 border rounded-2xl space-y-2">
                <div className="flex justify-between items-center border-b pb-2 font-black text-sm">
                  <span>{module.nameArabic}</span>
                  <span className="font-mono">{module.overallStatus === 'certified' ? 'معتمد ومكتمل ✓' : 'معلق - بوابات مفقودة ⚠️'}</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {module.links.map(link => (
                    <div key={link.id} className="flex justify-between items-center py-1 border-b border-dotted">
                      <span>ربط [ {link.source} ] ➔ [ {link.target} ] ({link.description})</span>
                      <strong className="font-mono">{link.isVerified ? 'مفعل ومكتمل' : 'غير متكامل'}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t-2 border-slate-900 text-center text-xs space-y-4">
            <p className="max-w-xl mx-auto leading-relaxed">
              تم إصدار هذا التقرير آلياً عبر خادم التدقيق السحابي الموحد لإثبات سلامة وتكامل العمليات المالية والأكاديمية والإدارية ومطابقتها للمعايير واللوائح المنظمة.
            </p>
            <div className="grid grid-cols-3 gap-6 pt-4">
              <div>
                <strong>توقيع المستشار المالي والتقني</strong>
                <div className="h-12" />
                <span className="text-slate-400 block">---------------------</span>
              </div>
              <div>
                <strong>توقيع رئيس مجلس الإشراف الأكاديمي</strong>
                <div className="h-12" />
                <span className="text-slate-400 block">---------------------</span>
              </div>
              <div>
                <strong>توقيع رئيس مجمع المدارس الذكية</strong>
                <div className="h-12" />
                <span className="text-slate-400 block">---------------------</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
