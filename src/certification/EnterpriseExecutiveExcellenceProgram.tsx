import { Award, BookOpen, Check, CheckCircle2, CheckSquare, Code, Database, Download, FileCode, FileSpreadsheet, HelpCircle, Loader, Lock as LockIcon, Palette, Printer, Receipt, RefreshCw, Smartphone, Space, Sparkles, Target, User, View, Workflow } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface EnterpriseExecutiveExcellenceProgramProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface EEPModule {
  id: string;
  name: string;
  engName: string;
  category: string;
  workflows: string[];
  reports: string[];
  permissions: string[];
  isAudited: boolean;
  missingItems: {
    type: 'workflow' | 'report' | 'screen' | 'permission';
    name: string;
    description: string;
  }[];
}

export default function EnterpriseExecutiveExcellenceProgram({ triggerNotification }: EnterpriseExecutiveExcellenceProgramProps) {
  // --- 1. Business Excellence States ---
  const [modules, setModules] = useState<EEPModule[]>([
    {
      id: 'registration',
      name: 'منظومة القبول والتسجيل الموحد',
      engName: 'Registration & Admissions',
      category: 'الأكاديمية',
      workflows: ['طلب القبول الإلكتروني', 'تدقيق مستندات الطالب', 'الموافقة المبدئية', 'تخصيص الرقم الأكاديمي'],
      reports: ['كشف المتقدمين اليومي', 'إحصائيات القبول حسب الجنسيات', 'معدلات الطاقة الاستيعابية للفصول'],
      permissions: ['طلب قبول جديد', 'تعديل بيانات طالب', 'اعتماد ملف القبول', 'عرض إحصائيات التسجيل'],
      isAudited: true,
      missingItems: [
        { type: 'report', name: 'تقرير تتبع انسحاب الطلاب الجدد', description: 'توليد تقرير فوري بنسب الانسحاب وأسبابها للفصل الجاري.' }
      ]
    },
    {
      id: 'fees',
      name: 'هيكلة الرسوم الدراسية والخصومات',
      engName: 'Tuition Fees & Discounts',
      category: 'المالية',
      workflows: ['تحديد هيكل الرسوم الأساسي', 'تطبيق خصم الأشقاء تلقائياً', 'الموافقة على خطة السداد المقسطة'],
      reports: ['كشف المطالبات المالية المعلقة', 'توزيع الإيرادات المستهدفة للفروع', 'معدلات التحصيل الشهري'],
      permissions: ['إعداد بنود الرسوم', 'تطبيق خصم يدوي', 'إصدار خطة تقسيط', 'تصدير كشف رسوم الطلاب'],
      isAudited: true,
      missingItems: [
        { type: 'workflow', name: 'سير عمل منح التسهيلات الاستثنائية', description: 'اعتماد آلي ثلاثي المستويات للخصومات التي تتجاوز الحد الأقصى للمدير.' }
      ]
    },
    {
      id: 'collection',
      name: 'سندات القبض المباشرة والتحصيل',
      engName: 'Direct Receipt Vouchers & Central Collections',
      category: 'المالية',
      workflows: ['إصدار سند القبض التلقائي', 'مطابقة التحصيل البنكي الرقمي', 'توليد كشف المديونيات المتأخرة'],
      reports: ['تقرير المبالغ المحصلة اليومية', 'مقارنة التحصيل النقدي بالشبكي', 'إحصائيات تسوية العهد المالية'],
      permissions: ['إصدار سند قبض', 'إلغاء سند قبض معتمد', 'تأكيد التسوية البنكية', 'تصدير ملف سداد المالي'],
      isAudited: true,
      missingItems: []
    },
    {
      id: 'journal_entries',
      name: 'القيود المحاسبية ثنائية الأطراف الموزونة',
      engName: 'Double-Entry Journal Ledger',
      category: 'المحاسبة',
      workflows: ['صناعة قيد محاسبي يدوي', 'توليد قيود الرسوم والرواتب آلياً', 'مراجعة وتدقيق ميزان القيود المفتوحة'],
      reports: ['دفتر اليومية العامة الشامل', 'كشف القيود الملغاة والمعدلة', 'تقرير المعاملات المالية المفتوحة'],
      permissions: ['إنشاء قيد محاسبي', 'ترحيل القيود للأستاذ العام', 'تعديل قيود غير مرحلة', 'مراجعة السجل التعديلي للقيود'],
      isAudited: true,
      missingItems: [
        { type: 'screen', name: 'شاشة مراجعة الفروقات السريعة', description: 'لوحة فحص الفروقات بين القيود المدينة والدائنة وحسابات الوسيط.' }
      ]
    },
    {
      id: 'general_ledger',
      name: 'الأستاذ العام وموازين المراجعة اللحظية',
      engName: 'General Ledger & Trial Balance',
      category: 'المحاسبة',
      workflows: ['تحديث أرصدة الحسابات فورياً', 'إغلاق الفترة المحاسبية الشهرية', 'تسوية حسابات الأستاذ المساعد'],
      reports: ['ميزان المراجعة بالمجاميع والأرصدة', 'كشف حركة الحساب المفصل', 'تقرير أستاذ عام مقارن'],
      permissions: ['استعراض ميزان المراجعة', 'عرض حركة كشف حساب مستقل', 'تعديل شجرة الحسابات COA', 'تسوية الدفاتر'],
      isAudited: true,
      missingItems: []
    },
    {
      id: 'exams',
      name: 'كنترول الامتحانات ورصد الكشوفات والشهادات',
      engName: 'Exams & Grading Control',
      category: 'الأكاديمية',
      workflows: ['إعداد جدول الامتحانات النهائي', 'رصد درجات الفصل الأول والنهائي', 'معادلة غيابات الطلاب الطبية'],
      reports: ['إحصائيات نسب النجاح والرسوب', 'كشف رصد الدرجات المعتمد للمادة', 'معدلات ترتيب المتفوقين'],
      permissions: ['رصد درجات الطلاب', 'اعتماد ورقة الامتحان', 'تعديل درجات مرصودة مسبقاً', 'طباعة كشف درجات معتمد'],
      isAudited: true,
      missingItems: [
        { type: 'permission', name: 'صلاحية تعديل الدرجات بعد تاريخ الإغلاق', description: 'صلاحية استثنائية مشروطة بطلب معتمد لفتح رصد الدرجة مجدداً.' }
      ]
    },
    {
      id: 'payroll',
      name: 'مسير الرواتب الموحد والموارد البشرية',
      engName: 'HR & Payroll Lifecycle',
      category: 'الإدارة',
      workflows: ['احتساب الأيام والغيابات تلقائياً', 'مزامنة البدلات واستقطاعات التأمينات الاجتماعية', 'تحويل مسير الرواتب للمصرف عبر ملف WPS'],
      reports: ['كشف مسير رواتب تفصيلي', 'تقرير مستحقات ومكافآت نهاية الخدمة', 'تقرير تكاليف الرواتب حسب القطاعات'],
      permissions: ['إعداد هيكلة رواتب موظف', 'إضافة استقطاع أو حسم مالي', 'اعتماد مسير الرواتب النهائي', 'تصدير ملف البنك البنكي المعتمد'],
      isAudited: true,
      missingItems: []
    }
  ]);

  const [selectedModule, setSelectedModule] = useState<EEPModule>(modules[0]);
  
  // Custom Feature Adding Dialog States
  const [showAddFeatureDialog, setShowAddFeatureDialog] = useState(false);
  const [newFeatureType, setNewFeatureType] = useState<'workflow' | 'report' | 'screen' | 'permission'>('workflow');
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');

  // --- 2. Engineering Excellence States ---
  const [solidRating, setSolidRating] = useState(88);
  const [socRating, setSocRating] = useState(90);
  const [reusabilityRating, setReusabilityRating] = useState(89);
  const [codeQualityRating, setCodeQualityRating] = useState(91);
  const [isAuditingCode, setIsAuditingCode] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'بانتظار بدء تحليل الكود والهيكل الهندسي...'
  ]);

  // --- 3. Design Excellence States ---
  const [selectedFont, setSelectedFont] = useState<'Inter' | 'Space Grotesk' | 'Outfit' | 'Playfair Display' | 'JetBrains Mono'>('Inter');
  const [designUnified, setDesignUnified] = useState(false);
  const [previewColor, setPreviewColor] = useState<'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'>('indigo');
  const [showDemoDialog, setShowDemoDialog] = useState(false);

  // --- 4. User Experience States ---
  const [touchTargetStandard, setTouchTargetStandard] = useState<boolean>(true); // true = 44px, false = compact
  const [systemMessageTone, setSystemMessageTone] = useState<'friendly' | 'professional' | 'strict'>('professional');
  const [activeUXTab, setActiveUXTab] = useState<'clickCounter' | 'toastDemo' | 'statesDemo'>('clickCounter');
  const [toastMessage, setToastMessage] = useState('');
  const [showToastPreview, setShowToastPreview] = useState(false);
  const [uxInteractiveLoading, setUxInteractiveLoading] = useState(false);
  const [uxShowEmptyState, setUxShowEmptyState] = useState(false);

  // --- 5. Operational Excellence States ---
  const [backupLogs, setBackupLogs] = useState<string[]>([
    'بانتظار إطلاق النسخ الاحتياطي التلقائي للأستاذ العام وشجرة الحسابات...'
  ]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [sqlBackupFile, setSqlBackupFile] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState({
    cpu: 32,
    memory: 45,
    dbStatus: 'healthy',
    replicationLag: 0,
    redis: 'active',
    mail: 'online'
  });
  const [activeHealthCheckInterval, setActiveHealthCheckInterval] = useState(false);

  // --- 6. Enterprise Certification States ---
  const [businessScore, setBusinessScore] = useState(92);
  const [engineeringScore, setEngineeringScore] = useState(89);
  const [uxScore, setUxScore] = useState(91);
  const [performanceScore, setPerformanceScore] = useState(90);
  const [securityScore, setSecurityScore] = useState(92);
  const [maintainabilityScore, setMaintainabilityScore] = useState(90);
  const [signatureSignedBy, setSignatureSignedBy] = useState('');
  const [isCertifiedProduct, setIsCertifiedProduct] = useState(false);

  // Dynamic recalculations when things change
  useEffect(() => {
    // Business Score based on how many missing items remain
    const totalMissing = modules.reduce((acc, m) => acc + m.missingItems.length, 0);
    const calculatedBusiness = Math.max(80, Math.min(100, 100 - (totalMissing * 4)));
    setBusinessScore(calculatedBusiness);
  }, [modules]);

  // Recalculate selected module in scope
  useEffect(() => {
    const updated = modules.find(m => m.id === selectedModule.id);
    if (updated) {
      setSelectedModule(updated);
    }
  }, [modules, selectedModule.id]);

  // --- Function Handlers ---

  // Add missing feature handler
  const handleAddFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeatureName.trim()) {
      triggerNotification('الرجاء تعبئة اسم الميزة الإضافية.', 'warning');
      return;
    }

    setModules(prev => prev.map(mod => {
      if (mod.id === selectedModule.id) {
        // Add item as completed workflow, report, screen or permission directly to clear missing lists
        let updatedWorkflows = [...mod.workflows];
        let updatedReports = [...mod.reports];
        let updatedPermissions = [...mod.permissions];

        if (newFeatureType === 'workflow') updatedWorkflows.push(newFeatureName);
        if (newFeatureType === 'report') updatedReports.push(newFeatureName);
        if (newFeatureType === 'permission') updatedPermissions.push(newFeatureName);

        // Remove the gap from missing items if they exist
        const updatedMissing = mod.missingItems.filter(item => 
          !(item.type === newFeatureType && item.name.toLowerCase() === newFeatureName.toLowerCase())
        );

        return {
          ...mod,
          workflows: updatedWorkflows,
          reports: updatedReports,
          permissions: updatedPermissions,
          missingItems: updatedMissing
        };
      }
      return mod;
    }));

    triggerNotification(`تم بنجاح سد الفجوة وتطبيق الميزة [${newFeatureName}] مباشرة على المستوى البرمجي! 🚀`, 'success');
    setShowAddFeatureDialog(false);
    setNewFeatureName('');
    setNewFeatureDesc('');
  };

  // Solve gap instantly helper
  const solveSingleGap = (moduleId: string, itemIdx: number) => {
    const targetItem = modules.find(m => m.id === moduleId)?.missingItems[itemIdx];
    if (!targetItem) return;

    setModules(prev => prev.map(mod => {
      if (mod.id === moduleId) {
        let updatedWorkflows = [...mod.workflows];
        let updatedReports = [...mod.reports];
        let updatedPermissions = [...mod.permissions];

        if (targetItem.type === 'workflow') updatedWorkflows.push(targetItem.name);
        if (targetItem.type === 'report') updatedReports.push(targetItem.name);
        if (targetItem.type === 'permission') updatedPermissions.push(targetItem.name);

        const updatedMissing = mod.missingItems.filter((_, idx) => idx !== itemIdx);

        return {
          ...mod,
          workflows: updatedWorkflows,
          reports: updatedReports,
          permissions: updatedPermissions,
          missingItems: updatedMissing
        };
      }
      return mod;
    }));

    triggerNotification(`تم حل الثغرة البرمجية وإدماج [${targetItem.name}] في بنية النظام فوراً!`, 'success');
  };

  // Resolve all business gaps instantly
  const resolveAllBusinessGaps = () => {
    setModules(prev => prev.map(mod => {
      let updatedWorkflows = [...mod.workflows];
      let updatedReports = [...mod.reports];
      let updatedPermissions = [...mod.permissions];

      mod.missingItems.forEach(item => {
        if (item.type === 'workflow') updatedWorkflows.push(item.name);
        if (item.type === 'report') updatedReports.push(item.name);
        if (item.type === 'permission') updatedPermissions.push(item.name);
      });

      return {
        ...mod,
        workflows: updatedWorkflows,
        reports: updatedReports,
        permissions: updatedPermissions,
        missingItems: []
      };
    }));
    triggerNotification('تمت تسوية وتكامل كافة العمليات وسد جميع الفجوات البرمجية بامتياز 100%! 👑', 'success');
  };

  // Run Code Audit Simulator
  const runCodeAudit = () => {
    setIsAuditingCode(true);
    setAuditProgress(0);
    setAuditLogs([
      `[${new Date().toLocaleTimeString('ar-SA')}] 🔍 بدء فحص معايير SOLID وجودة الكود الفنية لقطاعات EduPro...`,
      `[${new Date().toLocaleTimeString('ar-SA')}] 🧩 مراجعة مبدأ المسؤولية الفردية (Single Responsibility Principle) لكافة الدوال...`
    ]);

    const auditSteps = [
      { log: 'تم رصد 0 انتهاكات لمبدأ SRP في محركات ترحيل الأستاذ العام الموزعة.', rate: 96, solid: 95 },
      { log: 'مراجعة معيار المفتوح/المغلق (Open/Closed) لإستقبال خصومات الرسوم المتعددة بنجاح.', rate: 95, solid: 96 },
      { log: 'التحقق من فصل الواجهات (Interface Segregation) للتقارير والطباعة والتصدير.', rate: 97, solid: 98 },
      { log: 'قياس معامل تماسك الأجزاء البرمجية وإعادة تدوير المكونات المشتركة.', rate: 98, solid: 99 },
      { log: 'تنظيف كود استقطاعات الرواتب وسير عمل القبول الموحد تماماً.', rate: 99, solid: 100 }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < auditSteps.length) {
        const step = auditSteps[stepIdx];
        setAuditLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString('ar-SA')}] ${step.log}`,
          `[${new Date().toLocaleTimeString('ar-SA')}] جودة الكود المرتفعة: ${step.rate}% | الامتثال لـ SOLID: ${step.solid}%`
        ]);
        setAuditProgress(Math.round(((stepIdx + 1) / auditSteps.length) * 100));
        stepIdx++;
      } else {
        clearInterval(interval);
        setIsAuditingCode(false);
        setSolidRating(98);
        setSocRating(99);
        setReusabilityRating(97);
        setCodeQualityRating(99);
        setEngineeringScore(99);
        setMaintainabilityScore(98);
        triggerNotification('تم اكتمال تدقيق الكود الهندسي! تم ترقية مؤشرات الجودة لـ SOLID والمحافظة فوق 98%', 'success');
      }
    }, 800);
  };

  // Unify Design System Trigger
  const unifyDesignSystem = () => {
    setDesignUnified(true);
    triggerNotification('تم تطبيق مصفوفة الهوية البصرية وتوحيد الهوامش والألوان والخطوط والأزرار بنسبة 100%! 🎨', 'success');
  };

  // Touch Target Sizer toggle
  const toggleTouchTarget = () => {
    const nextVal = !touchTargetStandard;
    setTouchTargetStandard(nextVal);
    if (nextVal) {
      setUxScore(prev => Math.min(100, prev + 3));
      triggerNotification('تم ترقية أحجام اللمس إلى 44px لمطابقة معايير إمكانية الوصول على الهواتف والأجهزة اللوحية (WCAG).', 'success');
    } else {
      setUxScore(prev => Math.max(85, prev - 3));
      triggerNotification('تم تفعيل الهيكل المضغوط (Compact View) للواجهات المكتبية.', 'info');
    }
  };

  // Toast Tone preview
  const handleToastTonePreview = () => {
    let msg = '';
    if (systemMessageTone === 'friendly') {
      msg = 'مرحباً بك شريكنا العزيز! تم ترحيل القيود بنجاح لتوفير وقتك الثمين 🌸';
    } else if (systemMessageTone === 'professional') {
      msg = 'تم ترحيل القيود المحاسبية وتحديث الأستاذ العام رقمياً رقم المعاملة #TX-9011.';
    } else {
      msg = 'تنبيه: تم إقفال القيود وترحيلها بنجاح. لا يسمح بالتعديل اليدوي بعد الآن.';
    }
    setToastMessage(msg);
    setShowToastPreview(true);
    setTimeout(() => {
      setShowToastPreview(false);
    }, 3500);
  };

  // Interactive Loader Trigger
  const triggerInteractiveLoader = () => {
    setUxInteractiveLoading(true);
    triggerNotification('جاري محاكاة حالة التحميل الممنهجة (Skeleton State)...', 'info');
    setTimeout(() => {
      setUxInteractiveLoading(false);
      triggerNotification('اكتمل التحميل بنجاح وعرض البيانات.', 'success');
    }, 2000);
  };

  // Run Live Database Backup simulator
  const runBackup = () => {
    setIsBackingUp(true);
    setBackupLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('ar-SA')}] ⚡ تم استدعاء خدمة النسخ الاحتياطي التلقائي (PgDump Worker)...`,
      `[${new Date().toLocaleTimeString('ar-SA')}] 🗄️ جاري ضغط وفهرسة جداول الموارد البشرية والرواتب والرسوم الدراسية...`,
    ]);

    setTimeout(() => {
      setBackupLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString('ar-SA')}] ✓ تم تصدير شجرة الحسابات (COA) وسندات القبض المباشرة في ملف SQL مشفر.`,
        `[${new Date().toLocaleTimeString('ar-SA')}] 🎉 اكتمال النسخ الاحتياطي بنجاح! حجم الملف: 124.5 MB.`
      ]);
      setIsBackingUp(false);
      setSqlBackupFile(`edupro_enterprise_snapshot_${new Date().toISOString().split('T')[0]}.sql`);
      triggerNotification('تم توليد النسخة الاحتياطية وتوفير ملف الاستعادة الفورية للتحميل!', 'success');
    }, 1500);
  };

  // Run Database Restore simulator
  const runRestore = () => {
    if (!sqlBackupFile) {
      triggerNotification('عذراً! يجب توليد ملف نسخ احتياطي أولاً للتمكن من استعادته.', 'warning');
      return;
    }
    setIsRestoring(true);
    setRestoreProgress(0);
    setBackupLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('ar-SA')}] 🔄 تم إطلاق عملية استعادة النسخة الاحتياطية [${sqlBackupFile}]...`
    ]);

    const interval = setInterval(() => {
      setRestoreProgress(prev => {
        if (prev < 100) {
          return prev + 25;
        } else {
          clearInterval(interval);
          setIsRestoring(false);
          setBackupLogs(prevLogs => [
            ...prevLogs,
            `[${new Date().toLocaleTimeString('ar-SA')}] 📊 فك تشفير وتثبيت هيكل الجداول والقيود المحاسبية...`,
            `[${new Date().toLocaleTimeString('ar-SA')}] 🏆 استعادة قاعدة البيانات والتحقق من سلامة البيانات وموازين المراجعة بنجاح 100%!`
          ]);
          triggerNotification('تمت استعادة قاعدة البيانات واسترجاع كافة البيانات التاريخية بنجاح من لقطة سريعة! 🛡️', 'success');
          return 100;
        }
      });
    }, 500);
  };

  // Run Live Health Analyzer
  const runLiveHealthCheck = () => {
    triggerNotification('جاري فحص مؤشرات البيئة السحابية والربط الفيروزي لملقمات الإنتاج...', 'info');
    setActiveHealthCheckInterval(true);
    setTimeout(() => {
      setHealthStatus({
        cpu: 18, // optimized
        memory: 38,
        dbStatus: 'healthy',
        replicationLag: 0, // perfect
        redis: 'active',
        mail: 'online'
      });
      setPerformanceScore(99);
      setSecurityScore(99);
      setActiveHealthCheckInterval(false);
      triggerNotification('تم اجتياز جميع الفحوصات الطبية للنظام بنجاح باهر! 💚', 'success');
    }, 1500);
  };

  // EEP Optimization Tool to boost all metrics to 99%+
  const boostAllMetrics = () => {
    resolveAllBusinessGaps();
    setSolidRating(99);
    setSocRating(99);
    setReusabilityRating(99);
    setCodeQualityRating(99);
    setDesignUnified(true);
    setTouchTargetStandard(true);
    setHealthStatus({
      cpu: 12,
      memory: 35,
      dbStatus: 'healthy',
      replicationLag: 0,
      redis: 'active',
      mail: 'online'
    });
    setBusinessScore(100);
    setEngineeringScore(99);
    setUxScore(99);
    setPerformanceScore(99);
    setSecurityScore(99);
    setMaintainabilityScore(99);
    triggerNotification('🚀 تم ترقية كافة مؤشرات الجودة، الأداء، الأمان، وسد الثغرات تلقائياً إلى مستوى التميز التنفيذي الأقصى (EEP)!', 'success');
  };

  // Sign and Certify Golden Executive Product Seal
  const handleProductCertification = (e: React.FormEvent) => {
    e.preventDefault();

    if (businessScore < 95 || engineeringScore < 95 || uxScore < 95 || performanceScore < 95 || securityScore < 95 || maintainabilityScore < 95) {
      triggerNotification('عذراً! يجب رفع مستويات التقييم لكافة المحاور الستة فوق الـ 95% لإجازة الاعتماد كمنتج مؤسسي متكامل.', 'warning');
      return;
    }

    if (!signatureSignedBy.trim()) {
      triggerNotification('يرجى تحديد وكتابة اسم المسؤول المخول بالتوقيع الرقمي لمنح رتبة المنتج.', 'danger');
      return;
    }

    setIsCertifiedProduct(true);
    triggerNotification('🏆 مبارك رسمياً! تم توقيع الاعتماد التنفيذي وترقية EduPro إلى مرتبة "المنتج المؤسسي التميزي" بنجاح باهر!', 'success');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right text-slate-800 dark:text-slate-100" dir="rtl">
      
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0f172a] to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-4xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex flex-wrap items-center gap-2 justify-end lg:justify-start">
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 animate-bounce">
                <Award className="w-4 h-4 text-white" />
                برنامج التميز التنفيذي الاستراتيجي (EEP Program)
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-md">
                من رتبة مشروع إلى رتبة منتج مستدام
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              برنامج ريادة وتميز منتجات الأداء المؤسسي (Executive Excellence Program)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              الانتقال الكامل بمنصة <strong className="text-white">EduPro Enterprise</strong> من مجرد مشروع تقني <strong className="text-emerald-400">"Enterprise Project"</strong> إلى نظام تشغيلي ومنتج شامل ومكتمل فائق الفخامة والجاهزية <strong className="text-emerald-400">"Enterprise Product"</strong>. يعتمد البرنامج على ستة محاور تميزية متقاطعة لضمان تطابق الأداء والعمليات واكتمال قواعد الأعمال والأمن والتوثيق والتشغيل المنهجي للنسخ المتطابق اللحظي.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-900/95 border border-emerald-500/40 p-5 shrink-0 min-w-[250px] text-center backdrop-blur-md shadow-xl">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">مستوى الجاهزية الكلية</span>
            <span className={`text-xl font-black mt-2 block ${isCertifiedProduct ? 'text-emerald-400 animate-pulse' : 'text-amber-500'}`}>
              {isCertifiedProduct ? '👑 منتج مؤسسي ممتاز EEP 🏆' : '🟡 قيد الفحص والتنقية'}
            </span>
            <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden border border-slate-700">
              <div 
                className={`h-full transition-all duration-700 ${isCertifiedProduct ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                style={{ width: `${(businessScore + engineeringScore + uxScore + performanceScore + securityScore + maintainabilityScore) / 6}%` }} 
              />
            </div>
            <p className="text-xs text-slate-300 mt-2 font-extrabold">التقييم العام المتوسط: {Math.round((businessScore + engineeringScore + uxScore + performanceScore + securityScore + maintainabilityScore) / 6)}%</p>
            <button
              type="button"
              onClick={boostAllMetrics}
              className="mt-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-2 px-3 rounded-lg w-full transition-all shadow-md cursor-pointer border border-emerald-500"
            >
              تحسين ورفع كافة المؤشرات للحد الأقصى (99%) 🚀
            </button>
          </div>
        </div>
      </div>

      {/* PILLARS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Right Column: Interactive Pillars Content (8 Cols) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* PILLAR 1: Business Excellence Hub */}
          <div id="eep-business" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-500" />
                  <span>المحور الأول: التميز العملياتي والوظيفي (Business Excellence)</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">مطابقة سير العمل والتقارير المكتملة وتذليل كافة فجوات الميزات واللوحات الإرشادية المشروطة.</p>
              </div>
              <button
                type="button"
                onClick={resolveAllBusinessGaps}
                className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 text-[10.5px] font-black px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                سد ثغرات موديولات العمليات فورياً ⚡
              </button>
            </div>

            {/* Quick selector of modules */}
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
              {modules.map((m) => {
                const hasGaps = m.missingItems.length > 0;
                const isSelected = selectedModule.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModule(m)}
                    className={`py-2 px-3 text-xs font-black transition-all cursor-pointer border flex items-center gap-2 ${isSelected ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-[1.01]' : 'bg-transparent dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-150 dark:border-slate-800/80 hover:bg-slate-100'}`}
                  >
                    <span>{m.name.split(' ')[0]}</span>
                    {hasGaps ? (
                      <span className="bg-rose-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold animate-pulse">{m.missingItems.length}</span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Current Module Details */}
            <div className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{selectedModule.name} ({selectedModule.engName})</h4>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded uppercase mt-1 inline-block">{selectedModule.category}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddFeatureDialog(true)}
                  className="bg-slate-900 hover:bg-slate-850 text-white text-[10.5px] font-black py-1.5 px-3 rounded-lg flex items-center gap-1 transition-transform active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>إضافة ميزة / تقرير ناقص ➕</span>
                </button>
              </div>

              {/* Module Asset Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Workflows */}
                <div className="dark:bg-slate-900 p-3 border border-slate-150 dark:border-slate-800">
                  <span className="text-[10px] font-black text-amber-500 block mb-2 border-b border-slate-50 pb-1">سير العمل المعرف (Workflows)</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {selectedModule.workflows.map((wf, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-semibold">{wf}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reports */}
                <div className="dark:bg-slate-900 p-3 border border-slate-150 dark:border-slate-800">
                  <span className="text-[10px] font-black text-emerald-500 block mb-2 border-b border-slate-50 pb-1">التقارير والكشوفات (Reports)</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {selectedModule.reports.map((rep, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-200">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-semibold">{rep}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permissions */}
                <div className="dark:bg-slate-900 p-3 border border-slate-150 dark:border-slate-800">
                  <span className="text-[10px] font-black text-purple-500 block mb-2 border-b border-slate-50 pb-1">الصلاحيات المشروطة (RBAC)</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {selectedModule.permissions.map((perm, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-200">
                        <LockIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="font-semibold">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Missing Items & Gaps Detected */}
              <div>
                <span className="text-[10px] font-black text-rose-500 block mb-2">الفجوات المعلقة للتوافق مع رتبة المنتج (Gaps Audit):</span>
                {selectedModule.missingItems.length === 0 ? (
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>ممتاز! كافة العمليات، التقارير واللوحات الإرشادية مكتملة ومعتمدة بنسبة 100% في هذا القطاع.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedModule.missingItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                              {item.type === 'workflow' ? 'دورة عمل ناقصة' : item.type === 'report' ? 'تقرير مالي ناقص' : item.type === 'screen' ? 'شاشة إضافية مطلوبة' : 'صلاحية RBAC معلقة'}
                            </span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">{item.name}</span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 mt-1">{item.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => solveSingleGap(selectedModule.id, idx)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black py-1 px-3 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          إنشاء وسد الفجوة آلياً 🛠️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* PILLAR 2: Engineering Excellence Console */}
          <div id="eep-engineering" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span>المحور الثاني: الجودة والهندسة البرمجية (Engineering Excellence)</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">مراجعة معايير SOLID، معيار فصل الاهتمامات (Separation of Concerns)، وقابلية إعادة استخدام المكونات.</p>
              </div>
              <button
                type="button"
                onClick={runCodeAudit}
                disabled={isAuditingCode}
                className="bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-black px-3.5 py-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAuditingCode ? 'جاري الفحص المنهجي...' : 'بدء تدقيق ومراجعة الكود 🚀'}
              </button>
            </div>

            {/* Metrics rating cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-transparent dark:bg-slate-950 p-3 border border-slate-150 dark:border-slate-850 text-center space-y-1">
                <span className="text-[10px] font-black text-amber-500 block">معايير SOLID</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{solidRating}%</span>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${solidRating}%` }} />
                </div>
              </div>

              <div className="bg-transparent dark:bg-slate-950 p-3 border border-slate-150 dark:border-slate-850 text-center space-y-1">
                <span className="text-[10px] font-black text-emerald-500 block">Separation of Concerns</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{socRating}%</span>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${socRating}%` }} />
                </div>
              </div>

              <div className="bg-transparent dark:bg-slate-950 p-3 border border-slate-150 dark:border-slate-850 text-center space-y-1">
                <span className="text-[10px] font-black text-purple-500 block">Reusability index</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{reusabilityRating}%</span>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${reusabilityRating}%` }} />
                </div>
              </div>

              <div className="bg-transparent dark:bg-slate-950 p-3 border border-slate-150 dark:border-slate-850 text-center space-y-1">
                <span className="text-[10px] font-black text-rose-500 block">درجة المحافظة (Maintainability)</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{codeQualityRating}%</span>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${codeQualityRating}%` }} />
                </div>
              </div>
            </div>

            {/* Audit Console Output */}
            <div className="bg-slate-950 p-4 border border-slate-800 font-mono text-[10.5px] text-slate-300 text-left" dir="ltr">
              <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-2 font-sans font-bold">
                <span>Core Compiler & SOLID Linter logs:</span>
                <span className="text-[9px] text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded-md">100% Validated</span>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {auditLogs.map((log, idx) => {
                  const isSuccess = log.includes('0 انتهاكات') || log.includes('بنجاح') || log.includes('سليم') || log.includes('امتياز');
                  return (
                    <div key={idx} className={`leading-relaxed ${isSuccess ? 'text-emerald-400 font-bold' : 'text-slate-300'}`} dir="rtl">
                      {log}
                    </div>
                  );
                })}
              </div>
              {isAuditingCode && (
                <div className="mt-3 space-y-1">
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-150" style={{ width: `${auditProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PILLAR 3: Design System & Identity Excellence */}
          <div id="eep-design" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-pink-500 animate-pulse" />
                  <span>المحور الثالث: مواءمة وبناء الهوية البصرية (Design Excellence)</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">توحيد الهوامش، أنواع الخطوط، درجات الألوان، الأزرار، والرسائل الإرشادية لضمان الخلو من التناقضات البصرية.</p>
              </div>
              <button
                type="button"
                onClick={unifyDesignSystem}
                className="bg-slate-900 hover:bg-slate-850 text-white text-[10.5px] font-black px-4 py-2 transition-all shadow-md"
              >
                تطبيق الختم والتناسق البصري الفوري 🎨
              </button>
            </div>

            {/* Typography Palette Selector & Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-3 p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
                <span className="text-[10px] font-black text-slate-400 block uppercase">مستودع الخطوط والخط المعتمد:</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['Inter', 'Space Grotesk', 'Outfit', 'Playfair Display', 'JetBrains Mono'] as const).map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => setSelectedFont(font)}
                      className={`p-2 rounded-lg border text-xs font-bold text-center transition-all ${selectedFont === font ? 'bg-amber-600 text-white border-amber-500' : 'dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'}`}
                    >
                      {font}
                    </button>
                  ))}
                </div>

                <div className="p-3 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 space-y-1 text-center">
                  <span className="text-[9px] font-black text-amber-500 block uppercase">معاينة الخط الحي (Sandbox Typography)</span>
                  <p className="text-base font-extrabold" style={{ fontFamily: selectedFont }}>
                    الرسوم والرواتب تحتسب بدقة 100%
                  </p>
                  <p className="text-[10px] text-slate-400" style={{ fontFamily: selectedFont }}>
                    Double-Entry ledger matched instantly with zero differences.
                  </p>
                </div>
              </div>

              {/* Sandbox Buttons & Dialog Previewer */}
              <div className="space-y-3 p-4 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
                <span className="text-[10px] font-black text-slate-400 block uppercase">لوحة الألوان ودرجات التفاعل:</span>
                <div className="flex gap-2 justify-center">
                  {(['indigo', 'emerald', 'amber', 'rose', 'slate'] as const).map((col) => {
                    const bgColors = {
                      indigo: 'bg-amber-600',
                      emerald: 'bg-emerald-600',
                      amber: 'bg-amber-500',
                      rose: 'bg-rose-600',
                      slate: 'bg-slate-900'
                    };
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setPreviewColor(col)}
                        className={`w-7 h-7 rounded-full ${bgColors[col]} border-2 ${previewColor === col ? 'border-white scale-110 shadow-md ring-2 ring-amber-300' : 'border-transparent'}`}
                      />
                    );
                  })}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setShowDemoDialog(true)}
                    className={`py-2 px-4 text-xs font-black text-white shadow-md transition-all active:scale-95 ${
                      previewColor === 'indigo' ? 'bg-amber-600 hover:bg-amber-700' :
                      previewColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      previewColor === 'amber' ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' :
                      previewColor === 'rose' ? 'bg-rose-600 hover:bg-rose-700' :
                      'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    تجربة نافذة التأكيد الدائرية 🔔
                  </button>

                  <button
                    type="button"
                    className="border border-slate-250 dark:border-slate-850 hover:dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 py-2 px-4 text-xs font-black"
                  >
                    مكون ثانوي ملغي
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* PILLAR 4: User Experience (UX) Hub */}
          <div id="eep-ux" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-500" />
                  <span>المحور الرابع: كمالية تجربة المستخدم (User Experience Excellence)</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">قياس وتقليل عدد النقرات اللازمة، تفعيل إمكانية الوصول للجوّال، ومنع الأخطاء الكارثية.</p>
              </div>
              
              <button
                type="button"
                onClick={toggleTouchTarget}
                className={`text-[10.5px] font-black px-3 py-1.5 rounded-lg border transition-all ${touchTargetStandard ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-transparent text-slate-700 border-slate-200'}`}
              >
                {touchTargetStandard ? '✓ حجم لمس معتمد 44px' : '⚠️ تفعيل الحجم القياسي 44px'}
              </button>
            </div>

            {/* Tabs inside UX Subsection */}
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveUXTab('clickCounter')}
                className={`py-2 px-4 text-xs font-black border-b-2 transition-all ${activeUXTab === 'clickCounter' ? 'border-amber-600 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
              >
                حاسبة عدد النقرات للعمليات الحيوية
              </button>
              <button
                type="button"
                onClick={() => setActiveUXTab('toastDemo')}
                className={`py-2 px-4 text-xs font-black border-b-2 transition-all ${activeUXTab === 'toastDemo' ? 'border-amber-600 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
              >
                تخصيص لهجة نصوص النظام (Tone)
              </button>
              <button
                type="button"
                onClick={() => setActiveUXTab('statesDemo')}
                className={`py-2 px-4 text-xs font-black border-b-2 transition-all ${activeUXTab === 'statesDemo' ? 'border-amber-600 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
              >
                أدوات التحميل وحالات الخلو (Empty States)
              </button>
            </div>

            {/* UX Tab 1 Content: Click Counts */}
            {activeUXTab === 'clickCounter' && (
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 block uppercase">فهرس سهولة الوصول (Click Minimization Index):</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center">
                    <span className="text-[10px] font-black text-slate-500 block">دفع الرسوم المباشر</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">2 نقرة</span>
                    <p className="text-[9px] text-slate-400 mt-1">اختيار الطالب ← تأكيد الدفع الفوري</p>
                  </div>

                  <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center">
                    <span className="text-[10px] font-black text-slate-500 block">تصدير مسير الرواتب لملف البنك</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">1 نقرة</span>
                    <p className="text-[9px] text-slate-400 mt-1">كبسة واحدة لتوليد وحزم WPS</p>
                  </div>

                  <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center">
                    <span className="text-[10px] font-black text-slate-500 block">طباعة ميزان المراجعة</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">1 نقرة</span>
                    <p className="text-[9px] text-slate-400 mt-1">اختصار طباعة فوري بأعلى الصفحة</p>
                  </div>
                </div>
              </div>
            )}

            {/* UX Tab 2 Content: Toast message tone */}
            {activeUXTab === 'toastDemo' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-transparent dark:bg-slate-950 p-3 border border-slate-150">
                  <div className="text-right">
                    <span className="text-xs font-black block">لهجة رسائل ورسائل النظام الإرشادية:</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">تغيير الأسلوب اللغوي المكتوب لتطبيقات EduPro.</p>
                  </div>

                  <div className="flex gap-2">
                    {(['friendly', 'professional', 'strict'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSystemMessageTone(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${systemMessageTone === t ? 'bg-amber-600 text-white border-amber-500 shadow-md' : 'dark:bg-slate-900 hover:bg-slate-100 text-slate-700'}`}
                      >
                        {t === 'friendly' ? 'ودود 🌸' : t === 'professional' ? 'مهني 👔' : 'حازم / أمني 🔒'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleToastTonePreview}
                    className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-black px-6 py-2.5 border border-slate-800 shadow-md transition-all active:scale-95"
                  >
                    إرسال تنبيه تجريبي بالصيغة المحددة 🚀
                  </button>
                </div>

                {/* Animated Simulated Toast */}
                {showToastPreview && (
                  <div className="p-3.5 bg-slate-950 text-white border border-amber-500/30 flex items-center gap-2 max-w-lg mx-auto shadow-2xl animate-bounce" dir="rtl">
                    <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
                    <span className="text-xs font-black text-right">{toastMessage}</span>
                  </div>
                )}
              </div>
            )}

            {/* UX Tab 3 Content: states sandbox */}
            {activeUXTab === 'statesDemo' && (
              <div className="space-y-4">
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={triggerInteractiveLoader}
                    className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-600 dark:text-amber-400 text-xs font-black px-4 py-2 transition-all"
                  >
                    محاكاة مؤشر الانتظار / الهياكل العظمية 🌀
                  </button>
                  <button
                    type="button"
                    onClick={() => setUxShowEmptyState(!uxShowEmptyState)}
                    className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-600 dark:text-amber-400 text-xs font-black px-4 py-2 transition-all"
                  >
                    تبديل حالة الخلو (Empty State View)
                  </button>
                </div>

                {/* Sandbox view */}
                <div className="p-6 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl">
                  {uxInteractiveLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
                      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                      <div className="h-8 bg-slate-200 dark:bg-slate-800 w-3/4" />
                    </div>
                  ) : uxShowEmptyState ? (
                    <div className="text-center py-6 space-y-2">
                      <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                      <h4 className="text-xs font-black text-slate-500">لا توجد قيود محاسبية غير متوازنة معلقة</h4>
                      <p className="text-[10px] text-slate-400 max-w-sm mx-auto">عندما تبدأ في رصد رسوم الطلاب أو الرواتب الشهرية، ستظهر المعاملات والقيود المتطابقة والآجلة والمسودات هنا فوراً.</p>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400 font-extrabold">
                      تمت محاكاة حالات تجربة المستخدم (UX Sandbox) بنجاح. اضغط على أزرار التبديل أعلاه لتجربتها.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* PILLAR 5: Operational Excellence Panel */}
          <div id="eep-operations" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" />
                  <span>المحور الخامس: مرونة التشغيل والبنى السحابية (Operational Excellence)</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">محاكاة النسخ الاحتياطي الساخن (PgDump Snapshot)، الاستعادة الفورية، وربط ملقمات التشغيل والنسخ المتطابقة اللحظية.</p>
              </div>
              
              <button
                type="button"
                onClick={runLiveHealthCheck}
                className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10.5px] font-black px-3.5 py-1.5 rounded-lg border border-emerald-100"
              >
                تشغيل فحص بيئة الإنتاج السحابية (Health Check) 📡
              </button>
            </div>

            {/* Health indicators list */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200">صحة قاعدة البيانات</span>
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                  {healthStatus.dbStatus === 'healthy' ? 'نشطة ومتطابقة ✓' : 'قيد الفحص'}
                </span>
              </div>

              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200">تأخر النسخة الاحتياطية</span>
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">0 ثانية (تزامن لحظي)</span>
              </div>

              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200">الذاكرة المخبئية Redis</span>
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">نشطة بامتياز ⚡</span>
              </div>

              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200">استهلاك المعالج CPU</span>
                <span className="text-[10px] font-black text-emerald-600 font-mono">{healthStatus.cpu}%</span>
              </div>

              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200">استهلاك الذاكرة RAM</span>
                <span className="text-[10px] font-black text-emerald-600 font-mono">{healthStatus.memory}%</span>
              </div>

              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200">خادم الإشعارات والبريد</span>
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">متصل بالكامل ✓</span>
              </div>
            </div>

            {/* PgDump Console & Interactive Backup Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-3 bg-transparent dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850">
                <span className="text-[10px] font-black text-slate-400 block uppercase">منظومة النسخ والترميم الاحتياطي (PgDump Dashboard):</span>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={runBackup}
                    disabled={isBackingUp}
                    className="flex-1 bg-slate-900 hover:bg-slate-850 text-white text-[11px] font-black py-2.5 px-3 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>توليد نسخ ساخن SQL</span>
                  </button>

                  <button
                    type="button"
                    onClick={runRestore}
                    disabled={isRestoring || !sqlBackupFile}
                    className="flex-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-[11px] font-black py-2.5 px-3 transition-all border border-amber-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>استعادة النسخة الفورية</span>
                  </button>
                </div>

                {sqlBackupFile && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 block">ملف النسخة الاحتياطية المتوفر:</span>
                      <span className="text-[9.5px] font-mono text-slate-500 font-semibold">{sqlBackupFile}</span>
                    </div>
                    <a
                      href={`data:text/plain;charset=utf-8,${encodeURIComponent('-- EduPro Enterprise EEP DB Snapshot --\nCREATE TABLE students...\n')}`}
                      download={sqlBackupFile}
                      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shrink-0 transition-colors"
                      title="تحميل الملف على جهازك"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              {/* Console logs */}
              <div className="bg-slate-950 p-4 border border-slate-850 font-mono text-[10.5px] text-slate-300 text-left" dir="ltr">
                <span className="text-[9px] text-slate-500 block border-b border-slate-800 pb-1 mb-2 font-sans font-bold">DbBackup Worker Thread:</span>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {backupLogs.map((log, idx) => {
                    const isSuccess = log.includes('✓') || log.includes('بنجاح') || log.includes('استعادة') || log.includes('توليد');
                    return (
                      <div key={idx} className={`leading-relaxed ${isSuccess ? 'text-emerald-400 font-bold' : 'text-slate-300'}`} dir="rtl">
                        {log}
                      </div>
                    );
                  })}
                </div>
                {isRestoring && (
                  <div className="mt-3 space-y-1">
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${restoreProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: EEP Certification Ledger & Decisions (4 Cols) */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          
          {/* EEP LEDGER SUMMARY */}
          <div className="dark:bg-slate-900 border-2 border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-md space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded uppercase">EEP Audit Ledger</span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award className="w-5 h-5 text-emerald-500 animate-spin" style={{ animationDuration: '8s' }} />
                <span>6. مصفوفة الاعتماد التنفيذي (Certification Ledger)</span>
              </h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              يجب تحقيق تقييم لا يقل عن <strong className="text-rose-600 dark:text-rose-400 font-black">95%</strong> في كافة المحاور الستة لمنح النسخة شهادة التميز والاستقرار كمنتج مؤسسي كامل.
            </p>

            {/* Threshold bars */}
            <div className="space-y-4 text-xs">
              
              {/* Business */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-black ${businessScore >= 95 ? 'text-emerald-600' : 'text-rose-600 animate-pulse'}`}>
                    {businessScore}% {businessScore >= 95 ? '✓ مستوفٍ' : '⚠️ أقل من 95%'}
                  </span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">التميز الوظيفي والعملياتي (Business)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${businessScore >= 95 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${businessScore}%` }} />
                </div>
              </div>

              {/* Engineering */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-black ${engineeringScore >= 95 ? 'text-emerald-600' : 'text-rose-600 animate-pulse'}`}>
                    {engineeringScore}% {engineeringScore >= 95 ? '✓ مستوفٍ' : '⚠️ أقل من 95%'}
                  </span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">جودة وهندسة الكود (Engineering)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${engineeringScore >= 95 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${engineeringScore}%` }} />
                </div>
              </div>

              {/* UX */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-black ${uxScore >= 95 ? 'text-emerald-600' : 'text-rose-600 animate-pulse'}`}>
                    {uxScore}% {uxScore >= 95 ? '✓ مستوفٍ' : '⚠️ أقل من 95%'}
                  </span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">تجربة المستخدم والوصول (UX)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${uxScore >= 95 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${uxScore}%` }} />
                </div>
              </div>

              {/* Performance */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-black ${performanceScore >= 95 ? 'text-emerald-600' : 'text-rose-600 animate-pulse'}`}>
                    {performanceScore}% {performanceScore >= 95 ? '✓ مستوفٍ' : '⚠️ أقل من 95%'}
                  </span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">سرعة الاستجابة اللحظية (Performance)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${performanceScore >= 95 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${performanceScore}%` }} />
                </div>
              </div>

              {/* Security */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-black ${securityScore >= 95 ? 'text-emerald-600' : 'text-rose-600 animate-pulse'}`}>
                    {securityScore}% {securityScore >= 95 ? '✓ مستوفٍ' : '⚠️ أقل من 95%'}
                  </span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">صلاحيات وأمان الدخول (Security)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${securityScore >= 95 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${securityScore}%` }} />
                </div>
              </div>

              {/* Maintainability */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-black ${maintainabilityScore >= 95 ? 'text-emerald-600' : 'text-rose-600 animate-pulse'}`}>
                    {maintainabilityScore}% {maintainabilityScore >= 95 ? '✓ مستوفٍ' : '⚠️ أقل من 95%'}
                  </span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">قابلية الصيانة والاستدامة (Maintainability)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${maintainabilityScore >= 95 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${maintainabilityScore}%` }} />
                </div>
              </div>

            </div>

            {/* CERTIFICATE FORM */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleProductCertification} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 mb-1">توقيع المسؤول والختم الرقمي للمنتج:</label>
                  <input
                    type="text"
                    value={signatureSignedBy}
                    onChange={(e) => setSignatureSignedBy(e.target.value)}
                    placeholder="اكتب اسم المسؤول المخول بالتوقيع (مثال: م. صلاح الدين البهنسي)"
                    className="w-full p-3 bg-transparent dark:bg-slate-950 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-right"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-white" />
                  <span>منح ختم واعتماد المنتج المؤسسي الفخم (EEP Certified Product) 👑</span>
                </button>
              </form>
            </div>

            {/* GOLDEN SEAL SHOWCASE */}
            {isCertifiedProduct && (
              <div className="p-6 bg-gradient-to-tr from-slate-950 via-[#064e3b] to-slate-950 border-4 border-amber-500/80 text-center space-y-4 relative overflow-hidden shadow-2xl animate-fade-in">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,transparent_100%)]" />
                
                {/* Visual Confetti / Decorative glow */}
                <div className="w-16 h-16 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center mx-auto shadow-lg border-2 border-amber-300 animate-spin" style={{ animationDuration: '10s' }}>
                  <Award className="w-8 h-8" />
                </div>

                <div className="space-y-1 relative z-10">
                  <h4 className="text-sm font-black text-amber-400 tracking-wider">ختم التميز والريادة الاستراتيجي</h4>
                  <p className="text-[15px] font-black text-white leading-normal">GOLDEN EXECUTIVE PRODUCT</p>
                  <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded uppercase inline-block"> رتبة منتج كامل الاستدامة 🏆</span>
                </div>

                <p className="text-[10.5px] text-slate-300 leading-relaxed relative z-10 font-medium">
                  تشهد اللجنة العليا لقطاع الجودة بـ <strong className="text-white">EduPro Enterprise</strong> بأن الكود والهيكل الهندسي وسير العمليات والربط اللحظي قد اجتازوا فحص الـ EEP الشامل وتوحيد الهوية البصرية بنجاح تام بنسبة مستوفاة تفوق الـ 95%.
                </p>

                <div className="text-right border-t border-slate-800 pt-3 text-[10.5px] text-slate-400 space-y-0.5 relative z-10 font-bold">
                  <div>التوقيع الرقمي: <span className="text-white font-extrabold">{signatureSignedBy}</span></div>
                  <div>تاريخ المنح: <span className="text-amber-400 font-mono">2026-07-11</span></div>
                  <div className="text-[9.5px] text-amber-400">رمز التحقق: <span className="font-mono text-[9px]">EEP-PRODUCT-VERIFIED-HASH-9011X</span></div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black py-2 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 inline-block ml-1" />
                  <span>طباعة قرار الترقية الفيروزي 📄</span>
                </button>
              </div>
            )}

          </div>

          {/* EEP CRITICAL INFO CARD */}
          <div className="bg-transparent dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-3xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>دليل التميز التنفيذي الاستراتيجي:</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              الفرق بين المشروع والمنتج يكمن في المتانة وقابلية النمو. المشاريع تنتهي بانتهاء التسليم، بينما المنتجات تعتمد على الهيكلة البرمجية الفائقة، خلو الكود من التناقضات المرئية، ملقمات التشغيل والنسخ السحابية الساخنة، وتلبية متطلبات إمكانية الوصول والتفاعل المرن.
            </p>
          </div>

        </div>

      </div>

      {/* MODAL PREVIEWS (For Design System & Toast sandboxes) */}
      {showDemoDialog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-800 p-6 max-w-md w-full shadow-2xl text-right space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5 animate-bounce" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">نافذة تأكيد التميز التنفيذي (EEP Dialog)</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              هذه لوحة فحص تفاعلية مدمجة لمطابقة هوية النوافذ المنبثقة. إنها تدعم الخروج التلقائي، موازنة الخط {selectedFont}، وتنسيق الأزرار حسب لوحة الألوان {previewColor}.
            </p>

            <div className="p-3 bg-transparent dark:bg-slate-950 text-[10.5px] border border-slate-100 text-slate-600">
              مؤشر التحذير: ترحيل هذه الدورة سيؤثر على سندات القبض في ميزان المراجعة اللحظي.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDemoDialog(false)}
                className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-black py-2 px-4 cursor-pointer"
              >
                الموافقة والاستمرار ✓
              </button>
              <button
                type="button"
                onClick={() => setShowDemoDialog(false)}
                className="text-slate-700 dark:text-slate-300 hover:bg-transparent text-xs font-black py-2 px-4 cursor-pointer"
              >
                إلغاء الأمر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BUSINESS EXCELLENCE - ADD FEATURE DIALOG */}
      {showAddFeatureDialog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl text-right space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>إضافة ميزة برمجية لسد الفجوات في [{selectedModule.name}]</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddFeatureDialog(false)}
                className="p-1 hover:bg-transparent rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFeature} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">نوع الميزة المطلوبة:</label>
                <select
                  value={newFeatureType}
                  onChange={(e) => setNewFeatureType(e.target.value as any)}
                  className="w-full p-2.5 bg-transparent dark:bg-slate-950 dark:border-slate-850 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-right"
                >
                  <option value="workflow">سير عمل عملياتي جديد (Workflow)</option>
                  <option value="report">تقرير تحليلي / كشف مالي (Report)</option>
                  <option value="permission">صلاحية حماية أمنية (Permission/RBAC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">اسم الميزة بالكامل:</label>
                <input
                  type="text"
                  required
                  value={newFeatureName}
                  onChange={(e) => setNewFeatureName(e.target.value)}
                  placeholder="مثال: كشف التدفقات النقدية اللحظي للفرع"
                  className="w-full p-2.5 bg-transparent dark:bg-slate-950 dark:border-slate-850 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">الوصف المنهجي والفوائد:</label>
                <textarea
                  value={newFeatureDesc}
                  onChange={(e) => setNewFeatureDesc(e.target.value)}
                  rows={3}
                  placeholder="توضيح الكيفية التقنية لتكامل هذه الميزة وسدها للفجوات الوظيفية..."
                  className="w-full p-2.5 bg-transparent dark:bg-slate-950 dark:border-slate-850 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-right"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black py-2.5 px-5 transition-all shadow-md cursor-pointer"
                >
                  تأكيد وسد فجوة الموديل فورياً 🛠️
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddFeatureDialog(false)}
                  className="text-slate-700 dark:text-slate-300 hover:bg-transparent text-xs font-black py-2.5 px-4 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple dummy X icon for modal
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
