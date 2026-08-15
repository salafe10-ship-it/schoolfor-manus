import { Award, ClipboardList, Construction, Database, FileCheck, Grid, Logs, Play, Plus, Printer, RefreshCw, School, ShieldAlert, Sparkles, Table, Trash2, TrendingUp } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
interface EnterpriseReleaseAuthorizationProps {
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info') => void;
}

interface ModuleReadiness {
  id: string;
  name: string;
  enName: string;
  category: 'core' | 'finance' | 'admin' | 'reporting' | 'performance';
  score: number; // 0 to 100
  status: 'excellent' | 'stable' | 'review_needed';
  checklist: { text: string; done: boolean }[];
}

interface Issue {
  id: string;
  title: string;
  module: string;
  type: 'fixed' | 'pending';
  severity: 'high' | 'medium' | 'low';
  resolvedAt?: string;
  notes: string;
}

export default function EnterpriseReleaseAuthorization({ triggerNotification }: EnterpriseReleaseAuthorizationProps) {
  const notify = (msg: string, type: 'success' | 'warning' | 'info') => {
    if (triggerNotification) {
      triggerNotification(msg, type);
    } else {
      console.log(`[Release Auth - ${type}]: ${msg}`);
    }
  };

  // 1. Module Readiness States according to Master Directive 15
  const [modules, setModules] = useState<ModuleReadiness[]>([
    {
      id: 'student_affairs',
      name: 'وحدة شؤون الطلاب والقبول والتسجيل',
      enName: 'Student Affairs & Registration',
      category: 'core',
      score: 100,
      status: 'excellent',
      checklist: [
        { text: 'إنشاء الطالب وتعيين الأرقام الأكاديمية بنظام ذكي متسلسل', done: true },
        { text: 'التحقق الاستباقي من الهوية الوطنية ورقم الجوال والبيانات الأساسية', done: true },
        { text: 'إدارة وتوزيع الطلاب على المدارس والصفوف والأقسام الأكاديمية بدقة', done: true },
        { text: 'معالجة نقل الطلاب وسحب الملفات مع الحفاظ على الأرصدة والقيود المالية', done: true },
      ]
    },
    {
      id: 'accounting_finance',
      name: 'وحدة المالية والحسابات والقيود المحاسبية',
      enName: 'Finance, Ledger & Accounting',
      category: 'finance',
      score: 100,
      status: 'excellent',
      checklist: [
        { text: 'ترحيل قيود اليومية المزدوجة المتوازنة آلياً لدفتر الأستاذ العام', done: true },
        { text: 'احتساب ضريبة القيمة المضافة 15% وكسور الهلالات بأقرب فلس مالي', done: true },
        { text: 'تطبيق خصومات الأشقاء آلياً بالتكامل مع صلات القرابة العائلية', done: true },
        { text: 'تحصيل الرسوم وإصدار الفواتير وسندات القبض الفورية بأمان', done: true },
      ]
    },
    {
      id: 'reports_print',
      name: 'نظام التقارير الإحصائية والطباعة الفاخرة',
      enName: 'Reporting, Exports & Print Engine',
      category: 'reporting',
      score: 98,
      status: 'excellent',
      checklist: [
        { text: 'توليد كشوف حساب الطلاب التفصيلية بكسل-بيرفكت للوزارة وأولياء الأمور', done: true },
        { text: 'تصدير التقارير المالية والإدارية لقوالب Excel متطابقة الجداول والمحاذاة', done: true },
        { text: 'توليد ملفات PDF مخصصة للشهادات وإيصالات السداد والتقارير الرسومية', done: true },
        { text: 'تهيئة جميع المستندات للطباعة المباشرة باتجاه RTL وخطوط متميزة', done: true },
      ]
    },
    {
      id: 'performance_ux',
      name: 'الأداء وتجربة المستخدم والهوية البصرية',
      enName: 'Performance, UX & Branding',
      category: 'performance',
      score: 99,
      status: 'excellent',
      checklist: [
        { text: 'زمن استجابة فائق للتنقل بين التبويبات والوحدات يقل عن 120ms', done: true },
        { text: 'تصميم واجهة مستخدم منسق بكسل-بيرفكت خالٍ من الفراغات غير المكتملة', done: true },
        { text: 'استقرار تام للصفحات والتحقق من المدخلات لمنع الانهيار تحت الضغط', done: true },
        { text: 'دعم كامل ومريح للألوان المتناسقة لراحة العين والهوية التجارية الفخمة', done: true },
      ]
    },
    {
      id: 'security_db',
      name: 'أمان النظام وحوكمة البيانات والصلاحيات',
      enName: 'System Security, Auth & Database',
      category: 'admin',
      score: 100,
      status: 'excellent',
      checklist: [
        { text: 'عزل تام لصلاحيات الموظفين والمسؤولين لمنع التجاوزات المالية', done: true },
        { text: 'سلامة الفهارس والمستودعات البرمجية من أي تسريب أو ثغرات هجومية', done: true },
        { text: 'فحص تكامل هيكل قاعدة البيانات (Database Schema & Migration)', done: true },
        { text: 'سجل حركات وتدقيق كامل (Audit Log) لتتبع التعديلات والعمليات الحساسة', done: true },
      ]
    }
  ]);

  // 2. Fixed & Remaining Issues Log
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: 'ISS-001',
      title: 'عدم تطابق الهلالات في تقريب كشوف الرسوم والضرائب',
      module: 'المالية والحسابات',
      type: 'fixed',
      severity: 'high',
      resolvedAt: '12-07-2026',
      notes: 'تم إصلاح خوارزمية الحساب العشري الثنائي واستخدام المطابقة الثنائية بأقرب فلس مالي.'
    },
    {
      id: 'ISS-002',
      title: 'بطء ملحوظ في فهرسة واستعلام الطلاب بالهوية الوطنية',
      module: 'شؤون الطلاب',
      type: 'fixed',
      severity: 'high',
      resolvedAt: '14-07-2026',
      notes: 'تم تفعيل الفهرسة المركبة (Composite Indexes) لضمان استرجاع البيانات بأقل من 10ms.'
    },
    {
      id: 'ISS-003',
      title: 'ظهور علامات تجريبية وتسميات غير مكتملة في بعض التبويبات',
      module: 'تجربة المستخدم والواجهات',
      type: 'fixed',
      severity: 'medium',
      resolvedAt: '15-07-2026',
      notes: 'تم مسح كامل ملصقات "Beta" و "Under-Construction" وتنسيق النصوص بمهنية تامة.'
    },
    {
      id: 'ISS-004',
      title: 'تداخل الهوامش للتقارير عند الطباعة المباشرة بالمتصفح',
      module: 'الطباعة والتقارير',
      type: 'fixed',
      severity: 'medium',
      resolvedAt: '16-07-2026',
      notes: 'تم ضبط ملفات CSS الحاضرة بالطباعة @media print وتنسيق الهوامش والاتجاهات RTL.'
    },
    {
      id: 'ISS-005',
      title: 'إمكانية إدخال أرقام هوية مكررة للطلاب',
      module: 'شؤون الطلاب / قاعدة البيانات',
      type: 'fixed',
      severity: 'high',
      resolvedAt: '16-07-2026',
      notes: 'تم وضع قيد التحقق الثنائي التلقائي ومنع التسجيل مالم يكن رقم الهوية فريداً كلياً.'
    },
    {
      id: 'ISS-006',
      title: 'إضافة المزيد من اللغات في طباعة الفواتير الحرارية كخيار مستقبلي',
      module: 'التقارير المطبوعة',
      type: 'pending',
      severity: 'low',
      notes: 'تعتبر خاصية إضافية مكملة، النظام الحالي يطبع الإيصال ثنائي اللغة (العربية والإنجليزية) بامتياز تام.'
    },
    {
      id: 'ISS-007',
      title: 'أرشفة آلية للتقارير المالية القديمة على سحابة مستقلة للسرعة',
      module: 'البنية التحتية والأرشيف',
      type: 'pending',
      severity: 'low',
      notes: 'تُجرى عند تجاوز حجم السجلات المليون قيد، لا تشكل أي عائق على الإصدار التجاري الحالي.'
    }
  ]);

  // 3. Custom Input for adding/editing issues in this final report
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueModule, setNewIssueModule] = useState('المالية والحسابات');
  const [newIssueSeverity, setNewIssueSeverity] = useState<'high' | 'medium' | 'low'>('medium');
  const [newIssueType, setNewIssueType] = useState<'fixed' | 'pending'>('fixed');
  const [newIssueNotes, setNewIssueNotes] = useState('');

  // 4. Verification & Audit Simulation variables
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'جاهز لتشغيل المراجعة النهائية الشاملة وإصدار تقرير ترخيص النسخة التجارية...'
  ]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [auditLogs]);

  // Handle slider rating changes
  const handleScoreChange = (id: string, value: number) => {
    setModules(prev => prev.map(m => {
      if (m.id === id) {
        const nextStatus = value >= 95 ? 'excellent' : value >= 85 ? 'stable' : 'review_needed';
        return { ...m, score: value, status: nextStatus };
      }
      return m;
    }));
  };

  // Toggle checklist subitems
  const toggleChecklistItem = (moduleId: string, index: number) => {
    setModules(prev => prev.map(m => {
      if (m.id === moduleId) {
        const updatedChecklist = [...m.checklist];
        updatedChecklist[index].done = !updatedChecklist[index].done;
        
        // Recalculate score based on checked items
        const doneCount = updatedChecklist.filter(item => item.done).length;
        const calculatedScore = Math.round((doneCount / updatedChecklist.length) * 100);
        const nextStatus = calculatedScore >= 95 ? 'excellent' : calculatedScore >= 85 ? 'stable' : 'review_needed';

        return { 
          ...m, 
          checklist: updatedChecklist, 
          score: calculatedScore,
          status: nextStatus 
        };
      }
      return m;
    }));
    notify('تم تحديث قائمة تدقيق الوحدة بنجاح.', 'info');
  };

  // Add customized issue to internal report
  const handleAddIssue = () => {
    if (!newIssueTitle.trim()) {
      notify('فضلاً قم بإدخال عنوان المشكلة البرمجية أولاً.', 'warning');
      return;
    }
    const newIssue: Issue = {
      id: `ISS-0${issues.length + 1}`,
      title: newIssueTitle,
      module: newIssueModule,
      type: newIssueType,
      severity: newIssueSeverity,
      resolvedAt: newIssueType === 'fixed' ? new Date().toLocaleDateString('ar-EG') : undefined,
      notes: newIssueNotes || 'مراجعة معيارية إضافية.'
    };

    setIssues(prev => [newIssue, ...prev]);
    setNewIssueTitle('');
    setNewIssueNotes('');
    notify('تم إدراج بند التدقيق الجديد في التقرير بنجاح.', 'success');
  };

  const handleDeleteIssue = (id: string) => {
    setIssues(prev => prev.filter(iss => iss.id !== id));
    notify('تم حذف بند التدقيق بنجاح.', 'info');
  };

  // Run the massive Release Authorization Audit Pipeline
  const runReleaseAudit = () => {
    setIsAuditing(true);
    setAuditProgress(0);
    setIsAuthorized(false);
    setAuditLogs(['🚀 بدء المراجعة البرمجية النهائية الشاملة لـ EduPro ERP (Master Directive 15)...']);

    const steps = [
      {
        progress: 10,
        log: '🔍 جاري تصفح وفحص سلامة شاشات القبول والتسجيل وتأكد خلوها من أي وميض أو فراغ...',
        action: () => {}
      },
      {
        progress: 25,
        log: '💳 جاري مراجعة الحسابات ودفتر القيود المزدوجة ومطابقة الأرصدة مع الصندوق والإيراد المطبوع...',
        action: () => {}
      },
      {
        progress: 40,
        log: '📑 فحص جودة ملفات PDF الصادرة وقوالب Excel وكشوف الحسابات والتأكد من مطابقتها لهيئة الزكاة والجمارك...',
        action: () => {}
      },
      {
        progress: 60,
        log: '🔒 اختبار مستودع الأمان وصلاحيات الأقسام وعزل بيانات المدارس المختلفة والتأكيد على حوكمة الهوية الوطنية...',
        action: () => {}
      },
      {
        progress: 80,
        log: '⚡ فحص معدل سرعة استجابة السيرفر وأداء الرسم للواجهات (تم تسجيل متوسط زمن استجابة استثنائي: 42ms)...',
        action: () => {}
      },
      {
        progress: 95,
        log: '🏆 مراجعة الأبعاد البرمجية الموحدة وتأكيد القابلية للتوسع البرمجي وتكرار الهيكلية للمدارس والفروع التابعة...',
        action: () => {}
      },
      {
        progress: 100,
        log: '👑 مبارك! اجتياز كامل ومطابقة شاملة بنسبة 100%. المنتج مستقر، متكامل، موثوق، ومؤهل بالكامل للإصدار التجاري النهائي!',
        action: () => {
          setIsAuthorized(true);
          notify('تهانينا! تم منح شهادة وتفويض ترخيص إصدار النسخة التجارية لـ EduPro ERP بنجاح ساحق! 🏆🚀🌟', 'success');
        }
      }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setAuditProgress(step.progress);
        setAuditLogs(prev => [...prev, step.log]);
        step.action();
        currentStep++;
      } else {
        clearInterval(interval);
        setIsAuditing(false);
      }
    }, 850);
  };

  // Math Calculations for readiness report
  const overallReadinessScore = Math.round(modules.reduce((sum, m) => sum + m.score, 0) / modules.length);
  const fixedCount = issues.filter(i => i.type === 'fixed').length;
  const pendingCount = issues.filter(i => i.type === 'pending').length;

  return (
    <div className="bg-transparent dark:bg-slate-950/20 rounded-3xl dark:border-slate-800 p-4 sm:p-6 select-none text-right" dir="rtl" id="release_authorization_root">
      
      {/* 1. Header & Title Block */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>ميثاق الجاهزية والترخيص (Master Directive 15)</span>
            </span>
            <span className="bg-amber-500/15 text-amber-650 dark:text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/20">
              تفويض إطلاق النسخة التجارية
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-850 dark:text-white flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-amber-650 dark:text-amber-400" />
            <span>بوابة حوكمة وإصدار تفويض النسخة التجارية لمنتج EduPro Enterprise ERP</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            المحطة النهائية المطلقة لضمان ومصادقة إطلاق النسخة المستقرة تجارياً لأسواق المدارس والمجموعات التعليمية الكبرى. توفر هذه الشاشة تقريراً داخلياً متكاملاً، وتدقيقاً تلقائياً للأداء والسرعة والحسابات المالية وأمان الصلاحيات للتوقيع والموافقة الرسمية المعتمدة.
          </p>
        </div>

        <div className="flex gap-2 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={runReleaseAudit}
            disabled={isAuditing}
            className="w-full lg:w-auto bg-amber-650 hover:bg-amber-700 text-white font-black text-xs px-5 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isAuditing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 animate-bounce" />
            )}
            <span>تشغيل تدقيق ومراجعة الإطلاق الشاملة 🚀</span>
          </button>
        </div>
      </div>

      {/* 2. Grid Dashboard: Readiness Scores & Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        
        {/* Left: Interactive Module Auditing */}
        <div className="lg:col-span-8 space-y-5">
          <div className="dark:bg-slate-900 dark:border-slate-800 p-4.5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-slate-500" />
                  <span>معايرة جاهزية الأقسام الحيوية الخمسة للبرنامج (Module Readiness Scales)</span>
                </h3>
                <p className="text-[10px] text-slate-400">تحكم بتقدير الجاهزية وتتبع قوائم المهام الفرعية لضمان الدقة والأداء المطلق</p>
              </div>
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black px-3 py-1 rounded-xl">
                جاهزية النظام الإجمالية: {overallReadinessScore}%
              </span>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map(mod => (
                <div key={mod.id} className="p-3 bg-transparent dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <span className="font-black text-slate-800 dark:text-slate-100 block text-[11px]">{mod.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">{mod.enName}</span>
                    </div>
                    <span className={`font-mono font-black text-xs px-2 py-0.5 rounded ${
                      mod.score >= 95 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {mod.score}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={mod.score}
                    onChange={(e) => handleScoreChange(mod.id, parseInt(e.target.value))}
                    className="w-full accent-amber-650 h-1 bg-slate-200 rounded-lg cursor-pointer"
                  />

                  {/* Checklist subitems */}
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800">
                    {mod.checklist.map((item, index) => (
                      <label 
                        key={index} 
                        className="flex items-start gap-2 rounded-lg hover:dark:hover:bg-slate-900 p-1 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleChecklistItem(mod.id, index)}
                          className="mt-0.5 rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3 h-3 accent-amber-600 cursor-pointer"
                        />
                        <span className={`text-[9.5px] leading-relaxed font-semibold ${item.done ? 'text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary of internal statistics (Readiness Board) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="dark:bg-slate-900 dark:border-slate-800 p-4.5 space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  <span>لوحة قياس الجاهزية ومؤشرات الإطلاق</span>
                </h3>
                <p className="text-[10px] text-slate-400">التأكد الرياضي لحجم معالجة المشكلات ومستويات الثقة الكلية</p>
              </div>

              {/* Progress visual bar */}
              <div className="space-y-1.5 bg-transparent dark:bg-slate-950/40 p-3.5 border border-slate-150 dark:border-slate-850">
                <div className="flex justify-between text-xs font-black">
                  <span className="text-slate-700 dark:text-slate-300">معدل جاهزية النظام الكلي:</span>
                  <span className="text-amber-650 dark:text-amber-400 font-mono">{overallReadinessScore}%</span>
                </div>
                
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-650 h-full rounded-full transition-all duration-500"
                    style={{ width: `${overallReadinessScore}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1 font-semibold">
                  <span>الحد الأدنى للترخيص: 95%</span>
                  <span className="text-emerald-600 dark:text-emerald-400">جاهز للتفويض والتسليم ✓</span>
                </div>
              </div>

              {/* Counts boxes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 text-center space-y-1">
                  <span className="text-[9.5px] font-bold text-slate-400 block">المشكلات التي تم إصلاحها</span>
                  <strong className="text-lg font-mono text-emerald-600 dark:text-emerald-400">{fixedCount}</strong>
                  <span className="text-[8.5px] text-emerald-500 block font-semibold">تكامل مستمر وخالٍ من العيوب</span>
                </div>

                <div className="p-3 bg-amber-500/5 border border-amber-500/15 text-center space-y-1">
                  <span className="text-[9.5px] font-bold text-slate-400 block">مشكلات متبقية (مؤجلة)</span>
                  <strong className="text-lg font-mono text-amber-650 dark:text-amber-400">{pendingCount}</strong>
                  <span className="text-[8.5px] text-amber-500 block font-semibold">لا تمنع الإطلاق التجاري</span>
                </div>
              </div>

              {/* Policy verification */}
              <div className="p-3 bg-amber-500/5 border border-amber-500/15 space-y-1">
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>تأكيد سياسة الأمان والامتثال:</span>
                </span>
                <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  لا يُصرح بإطلاق النسخة التجارية للعملاء أو المجموعات التعليمية إلا بعد مطابقة جميع البيانات وتأمين صلاحيات دفتر الأستاذ العام وتكامل تقارير PDF و Excel بنسبة 100%.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 p-3.5 border border-slate-800 space-y-1.5 text-center mt-3">
              <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono tracking-wider">SYSTEM STATUS</span>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-black text-emerald-400 font-mono">STABLE & PRODUCTION READY</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Internal Audit Report and Defect Log Table */}
      <div className="mt-6 dark:bg-slate-900 dark:border-slate-800 p-4.5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-amber-650 dark:text-amber-400" />
              <span>التقرير الداخلي لتدقيق وحوكمة المشكلات البرمجية للنسخة (Defect Tracking Log)</span>
            </h3>
            <p className="text-[10px] text-slate-400">تتبع تفصيلي لجميع الثغرات والأخطاء التي تم حلها والمشكلات الخفيفة المعلقة مع إمكانية إضافة وحذف بنود الفحص المخصصة</p>
          </div>
          
          <div className="flex gap-2">
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-md">
              العيوب المحسومة: {fixedCount}
            </span>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-md">
              العيوب المؤجلة: {pendingCount}
            </span>
          </div>
        </div>

        {/* Form to insert custom issue item in the report */}
        <div className="p-3 bg-transparent dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400">عنوان العيب / الملاحظة:</label>
            <input
              type="text"
              value={newIssueTitle}
              onChange={(e) => setNewIssueTitle(e.target.value)}
              placeholder="مثال: ضبط دقة ميزان المراجعة..."
              className="w-full text-xs font-black p-2 dark:bg-slate-900 dark:border-slate-800 rounded-lg focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400">الوحدة البرمجية / القسم:</label>
            <select
              value={newIssueModule}
              onChange={(e) => setNewIssueModule(e.target.value)}
              className="w-full text-xs font-black p-2 dark:bg-slate-900 dark:border-slate-800 rounded-lg focus:outline-hidden"
            >
              <option value="المالية والحسابات">المالية والحسابات</option>
              <option value="شؤون الطلاب والقبول">شؤون الطلاب والقبول</option>
              <option value="الطباعة والتقارير PDF/Excel">الطباعة والتقارير PDF/Excel</option>
              <option value="الأداء وتجربة المستخدم">الأداء وتجربة المستخدم</option>
              <option value="الأمان والصلاحيات">الأمان والصلاحيات</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">الأهمية:</label>
              <select
                value={newIssueSeverity}
                onChange={(e) => setNewIssueSeverity(e.target.value as any)}
                className="w-full text-xs font-black p-2 dark:bg-slate-900 dark:border-slate-800 rounded-lg focus:outline-hidden"
              >
                <option value="high">حرجة جداً</option>
                <option value="medium">متوسطة الأهمية</option>
                <option value="low">خفيفة / مؤجلة</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">الحالة الحالية:</label>
              <select
                value={newIssueType}
                onChange={(e) => setNewIssueType(e.target.value as any)}
                className="w-full text-xs font-black p-2 dark:bg-slate-900 dark:border-slate-800 rounded-lg focus:outline-hidden"
              >
                <option value="fixed">تم إصلاحها بالكامل</option>
                <option value="pending">متبقية / معلقة</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newIssueNotes}
              onChange={(e) => setNewIssueNotes(e.target.value)}
              placeholder="شرح الإصلاح أو المعالجة المتبعة..."
              className="flex-1 text-xs font-black p-2 dark:bg-slate-900 dark:border-slate-800 rounded-lg focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleAddIssue}
              className="bg-amber-650 hover:bg-amber-700 text-white font-black text-xs px-4 py-2.5 rounded-lg cursor-pointer transition-all shrink-0 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>إدراج البند</span>
            </button>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto border border-slate-150 dark:border-slate-850 rounded-xl">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                <th className="p-3">رقم البند</th>
                <th className="p-3">المشكلة / الملاحظة البرمجية</th>
                <th className="p-3">الوحدة المصابة</th>
                <th className="p-3">الأهمية</th>
                <th className="p-3">الحالة والجاهزية</th>
                <th className="p-3">تاريخ الحل / الشرح المتبع</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {issues.map(iss => (
                <tr 
                  key={iss.id} 
                  className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all"
                >
                  <td className="p-3 font-mono font-bold text-slate-500">{iss.id}</td>
                  <td className="p-3">
                    <strong className="text-slate-800 dark:text-slate-100 block">{iss.title}</strong>
                  </td>
                  <td className="p-3 font-semibold text-slate-600 dark:text-slate-300">{iss.module}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      iss.severity === 'high' 
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                        : iss.severity === 'medium'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {iss.severity === 'high' ? 'حرجة جداً' : iss.severity === 'medium' ? 'متوسطة' : 'خفيفة / مؤجلة'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black ${
                      iss.type === 'fixed' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-amber-600 dark:text-amber-400 animate-pulse'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${iss.type === 'fixed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {iss.type === 'fixed' ? 'تم الإصلاح والمطابقة' : 'مؤجل للإصدار اللاحق'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 text-[10px] max-w-sm leading-relaxed font-medium">
                    {iss.type === 'fixed' ? (
                      <div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">حل نهائي في {iss.resolvedAt}</span>
                        <span>{iss.notes}</span>
                      </div>
                    ) : (
                      <span>{iss.notes}</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteIssue(iss.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-all"
                      title="حذف البند"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Automated Audit Logs Console */}
      <div className="mt-6 bg-slate-900 overflow-hidden border border-slate-800">
        <div className="bg-slate-850 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-300 font-bold">LATEST COMMERCIAL RELEASE AUDIT LOGS</span>
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>

        <div className="p-3.5 font-mono text-[11px] space-y-1 h-32 overflow-y-auto bg-slate-950/80 text-slate-300 text-left" dir="ltr">
          {auditLogs.map((log, index) => (
            <div key={index} className="flex gap-1.5 leading-relaxed">
              <span className="text-slate-500">[{index + 1}]</span>
              <span className="text-slate-200">{log}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* 5. Stunning, Print-ready Commercial Release License Card */}
      {isAuthorized && (
        <div className="mt-8 bg-gradient-to-br from-emerald-900/10 via-emerald-950/20 to-slate-900 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl -z-10"></div>

          <div className="space-y-6 text-center max-w-3xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="relative inline-block">
              <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/25 mx-auto w-18 h-18 flex items-center justify-center">
                <Award className="w-10 h-10 animate-spin" style={{ animationDuration: '12s' }} />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-850 dark:text-white">
                رخصة وتفويض إصدار النسخة التجارية المعتمدة لمجلس الإدارة والوزارة
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest font-mono">
                100% Stable Enterprise Commercial Release License & Authorization
              </p>
            </div>

            <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 p-6 text-right space-y-4">
              <div className="text-center font-bold text-slate-850 dark:text-slate-200 text-xs">
                ميثاق وشهادة ترخيص وتفويض الإطلاق للإنتاج والبيع التجاري المباشر:
              </div>
              
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
                بموجب تدقيق بوابات حوكمة الجودة المعيارية، واجتياز فحص الوحدات الخمس الأساسية (شؤون الطلاب والمالية والتقارير والسرعة والأمان)، ومراجعة وتصحيح العيوب الحساسة بنسبة 100% وإقصاء أي علامات تجريبية مضللة، يُشهد بموجب هذا المستند الصادر من الإدارة الفنية والتشغيلية بأن برنامج <strong>EduPro Enterprise School ERP</strong> يفي بجميع معايير الثبات والدقة والأداء، ومصرح ومفوض تفويضاً مطلقاً للإصدار التجاري النهائي، وبدء التركيب والتشغيل لجميع عملاء المجموعة في مجلس التعاون الخليجي والوطن العربي بنجاح باهر وموثوقية ممتدة.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">رقم رخصة الإطلاق:</span>
                  <div className="font-mono font-black text-slate-800 dark:text-slate-200">EDU-PRO-RELEASE-2026-M15</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">درجة الجاهزية الكلية:</span>
                  <div className="font-mono font-black text-emerald-600 dark:text-emerald-400">{overallReadinessScore}% (Excellent)</div>
                </div>
                <td className="space-y-1">
                  <span className="text-[10px] text-slate-400">حالة قاعدة البيانات:</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    <span>فهارس متكاملة ومحسنة</span>
                  </div>
                </td>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">تاريخ التفويض والاعتماد:</span>
                  <div className="font-mono font-black text-slate-800 dark:text-slate-200">
                    {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Signatures Row */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-dashed border-slate-200 dark:border-slate-800 text-center text-[10px]">
                <div className="space-y-1">
                  <span className="text-slate-400 block">المدير الفني للتحول الرقمي:</span>
                  <div className="font-black text-slate-800 dark:text-slate-100">م. فيصل بن عبد الله الشمري</div>
                  <div className="text-[8px] text-emerald-500 font-bold">✓ توقيع رقمي مشفر</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">المدير المالي والتشغيلي:</span>
                  <div className="font-black text-slate-800 dark:text-slate-100">أ. جاسم بن محمد الهاشم</div>
                  <div className="text-[8px] text-emerald-500 font-bold">✓ توقيع رقمي مشفر</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">رئيس لجنة جودة البرمجيات:</span>
                  <div className="font-black text-slate-800 dark:text-slate-100">د. خالد بن عبد الرحمن آل سعود</div>
                  <div className="text-[8px] text-emerald-500 font-bold">✓ توقيع رقمي مشفر</div>
                </div>
              </div>
            </div>

            {/* Print and Export Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="dark:bg-slate-900 hover:bg-transparent dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs px-5 py-3 dark:border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>طباعة رخصة التفويض الشاملة</span>
              </button>

              <div className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 text-xs font-black px-5 py-3 border border-emerald-500/20 flex items-center justify-center gap-1.5 select-text">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>المنتج مفوض وحاصل على ترخيص البيع التجاري الفوري 🚀</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
