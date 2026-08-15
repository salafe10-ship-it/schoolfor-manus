import { AlertTriangle, Check, CheckCircle2, Eye, HelpCircle, MessageSquare, Palette, Plus, Printer, Sparkles, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
interface GovernanceScreenExcellenceAuditProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

export default function GovernanceScreenExcellenceAudit({
  triggerNotification
}: GovernanceScreenExcellenceAuditProps) {

  // Local state for screen audit
  const [ux75CertApproved, setUx75CertApproved] = useState<boolean>(false);
  const [ux75SelectedScreen, setUx75SelectedScreen] = useState<string>('all');
  const [ux75NewNoteText, setUx75NewNoteText] = useState<string>('');
  const [ux75NewNoteSeverity, setUx75NewNoteSeverity] = useState<'critical' | 'medium' | 'cosmetic'>('critical');
  const [ux75NewNoteScreenId, setUx75NewNoteScreenId] = useState<string>('daily_entries');

  const [ux75Screens, setUx75Screens] = useState([
    {
      id: 'dashboard',
      name: 'لوحة التحكم الرئيسية',
      engName: 'Main Dashboard',
      goal: 'عرض ملخص فوري لأداء المدرسة المالي والأكاديمي والعمليات الإدارية النشطة في شاشة واحدة.',
      priorityOrder: 'مؤشرات الأداء المباشرة (KPIs) -> الإشعارات الحرجة -> الاختصارات السريعة -> المخططات البيانية التفاعلية.',
      mainActions: 'فلترة المدى الزمني، مراجعة التنبيهات، طباعة تقرير الأداء اليومي.',
      clickCount: 'نقرة واحدة للفلترة، نقرة واحدة لعرض تفاصيل الإشعار السريع.',
      messagesClarity: 'رسائل تأكيد فورية واضحة باللون الأخضر والأحمر وفق نظام التصميم الموحد.',
      searchFiltering: 'شريط تصفية فوري للفرز حسب الفروع أو العام الدراسي الحالي.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: true,
    },
    {
      id: 'students',
      name: 'شؤون الطلاب',
      engName: 'Student Affairs',
      goal: 'إدارة ملفات الطلاب الأكاديمية والشخصية، وتسجيل الحضور والغياب والانتقالات العامة.',
      priorityOrder: 'البحث السريع الموحد -> قائمة الطلاب المصفاة -> إجراءات التعديل والقبول السريع والذكي.',
      mainActions: 'تسجيل طالب جديد، ترحيل الفصول، تصدير ملفات الطلاب المعتمدين.',
      clickCount: 'أقل من 3 نقرات لإنشاء وتفعيل ملف الطالب بالكامل بنجاح.',
      messagesClarity: 'إشعارات ملونة واضحة بحالة الطالب (نشط، منسحب، معلق) ونوع التسجيل المعتمد.',
      searchFiltering: 'بحث متقدم بالاسم، السجل المدني، الفصل الدراسي، أو حالة سداد الرسوم.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: true,
    },
    {
      id: 'tuition',
      name: 'الرسوم الدراسية',
      engName: 'Tuition Fees',
      goal: 'تخصيص الرسوم المالية، متابعة مديونيات الطلاب، وحساب نسب الخصم والمنح الدراسية المعتمدة سلفاً.',
      priorityOrder: 'إجمالي الرسوم المستحقة -> الفئات والصفوف المستهدفة -> تفاصيل التخفيضات والمدفوعات المتأخرة.',
      mainActions: 'إسناد رسوم لصف دراسي، تطبيق خصم الأخوة، تصدير قائمة المتأخرات المشتملة على مديونيات.',
      clickCount: 'نقرة متبوعة بخطوة تأكيد واحدة في الشريط الجانبي لتفعيل الرسوم المخصصة.',
      messagesClarity: 'تنبيهات مالية دقيقة بترميز لوني أحمر للمتأخرات وأخضر للمدفوع بالكامل.',
      searchFiltering: 'فرز متقدم حسب الصف الدراسي، حالة السداد (مسدد جزئياً، غير مسدد، مسدد بالكامل).',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: true,
    },
    {
      id: 'receipts',
      name: 'سندات القبض',
      engName: 'Receipt Vouchers',
      goal: 'تحرير وتوثيق المقبوضات المالية من أولياء الأمور والجهات الراعية وتوزيعها آلياً على بنود الرسوم الدراسية.',
      priorityOrder: 'رقم السند الفوري التسلسلي -> تفاصيل المستلم والمدفوع -> الترحيل المحاسبي التلقائي للقيود.',
      mainActions: 'تحرير سند قبض جديد، طباعة فورية للمستند، ترحيل القيود اليومية بنقرة واحدة سريعة.',
      clickCount: 'نقرتان فقط للتحرير والطباعة المباشرة مع المعالجة الجانبية النشطة في شريط المهام.',
      messagesClarity: 'رسالة إتخاذ المعاملة المالية مطابقة للقيمة المدفوعة وإظهار الرصيد المتبقي بدقة متناهية.',
      searchFiltering: 'بحث برقم السند، اسم الطالب، أو من خلال محدد النطاق المالي للمقبوضات اليومية.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: true,
    },
    {
      id: 'daily_entries',
      name: 'القيود اليومية',
      engName: 'Daily Journal Entries',
      goal: 'تسجيل القيود المحاسبية المزدوجة ومطابقة الحسابات الدائنة والمدينة لضمان التوازن المالي الكامل.',
      priorityOrder: 'رقم القيد وحالته وحسابه المعتمد -> البنود الدائنة والمدينة -> إجمالي التوازن (الفرق الصفرى المالي).',
      mainActions: 'إضافة سطر قيد جديد، التحقق الفوري من التوازن، ترحيل قيود اليومية إلى دفاتر الأستاذ العام.',
      clickCount: 'سهولة إدخال البنود والمبالغ بسلاسة وسرعة فائقة دون مغادرة حقول الإدخال النشطة.',
      messagesClarity: 'تنبيه أحمر صارخ في حال عدم توازن القيد، وتنبيه أخضر ساطع بمطابقة التوازن الصفرى فوراً.',
      searchFiltering: 'بحث برقم القيد، التاريخ الفعلي للترحيل، أو حالة الترحيل المعتمدة بالنظام.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: false,
    },
    {
      id: 'general_accounts',
      name: 'الحسابات العامة',
      engName: 'General Accounts',
      goal: 'إدارة شجرة الحسابات (دليل الحسابات الموحد) واستخراج ميزان المراجعة وقائمة الدخل والميزانية العمومية.',
      priorityOrder: 'مستوى الحساب الهيكلي العام -> الحسابات الأبناء والآباء -> الأرصدة الافتتاحية والختامية الموثقة.',
      mainActions: 'إضافة حساب فرعي جديد، تحديث الأرصدة الافتتاحية، تصدير دليل الحسابات الموحد.',
      clickCount: 'أقل من نقرتين لاستعراض وتعديل أي حساب فرعي من شجرة الحسابات التفاعلية المريحة.',
      messagesClarity: 'عرض وتأكيد الإضافة لشجرة الحسابات برموز وأكواد محاسبية واضحة وخاضعة للتدقيق المالي الفوري.',
      searchFiltering: 'بحث سريع بكود الحساب الهيكلي أو الاسم العربي والإنجليزي الموحد في شجرة الحسابات.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: true,
    },
    {
      id: 'exams',
      name: 'الامتحانات والنتائج',
      engName: 'Exams & Grading',
      goal: 'تصميم لجان الامتحانات، جدولة مواعيد الاختبارات، رصد درجات الطلاب، واستخراج الشهادات الرسمية المعتمدة.',
      priorityOrder: 'الجدول الزمني للامتحانات -> رصد الدرجات حسب المادة والصف -> تقارير الرسوب والنجاح الفورية.',
      mainActions: 'إنشاء لجنة امتحان، إدخال جماعي وسلس للدرجات، اعتماد وإغلاق النتائج السنوية.',
      clickCount: 'معالجة ورصد درجات الفصول بنقرات ذكية واختصارات لوحة المفاتيح الفعالة لسرعة الإنتاجية.',
      messagesClarity: 'تنبيهات واضحة بتمام الرصد، ورسائل نجاح وتفوق محددة حسب نظام التقييم الموحد.',
      searchFiltering: 'فلترة دقيقة حسب المادة، الفصل الدراسي، المعلم المرخص، أو نسب النجاح العامة للفصل.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: true,
    },
    {
      id: 'hr',
      name: 'الموارد البشرية والرواتب',
      engName: 'Human Resources',
      goal: 'إدارة ملفات الكادر التعليمي والإداري، ومتابعة الرواتب الشهرية، الإجازات، والتقييم السنوي الموحد.',
      priorityOrder: 'البحث السريع عن الموظف -> الحالة الوظيفية والنشاط الفعلي -> مستندات الصرف والتوثيق المالي الموحد.',
      mainActions: 'إدخل ملف موظف جديد، تسجيل طلب إجازة رسمي، احتساب مسير الرواتب الموحد والمطابق للميزانية.',
      clickCount: 'موافقة فورية على الطلبات الموثقة بنقرة واحدة من شريط التنبيهات الجانبي لمدير الموارد.',
      messagesClarity: 'تحديثات مباشرة لحالات الطلبات مع رسائل توجيهية واضحة وموثقة للاتساق البصري.',
      searchFiltering: 'فرز حسب القسم (إداري، معلم، تشغيلي)، أو من خلال حالة تصاريح العمل والنشاط الميداني.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: false,
    }
  ]);

  const [ux75Notes, setUx75Notes] = useState([
    {
      id: 'note-1',
      screenId: 'daily_entries',
      text: 'شاشة القيود اليومية تتطلب نقرتين إضافيتين لعرض زر الحفظ التلقائي عند مطابقة التوازن المحاسبي الصفرى في النظام.',
      severity: 'critical',
      status: 'pending',
      createdAt: '2026/07/08'
    },
    {
      id: 'note-2',
      screenId: 'hr',
      text: 'مسير الرواتب الشهري يحتاج إلى زر تصدير مباشر وسريع في شريط المهام الموحد بدلاً من وجوده داخل القائمة المنسدلة الملتوية.',
      severity: 'medium',
      status: 'pending',
      createdAt: '2026/07/08'
    },
    {
      id: 'note-3',
      screenId: 'tuition',
      text: 'تعديل وتوحيد درجات اللون الأحمر لمديونيات الرسوم الدراسية لتكون متسقة تماماً مع لوحة ألوان نظام التصميم المؤسسي المعتمد (Enterprise Palette).',
      severity: 'cosmetic',
      status: 'resolved',
      createdAt: '2026/07/07'
    }
  ]);

  const activeScreen = ux75Screens.find(s => s.id === ux75SelectedScreen);

  const handleAddNote = () => {
    if (!ux75NewNoteText.trim()) {
      triggerNotification('يرجى كتابة نص الملاحظة أولاً قبل الإضافة!', 'warning');
      return;
    }
    const newNote = {
      id: `note-${Date.now()}`,
      screenId: ux75NewNoteScreenId,
      text: ux75NewNoteText.trim(),
      severity: ux75NewNoteSeverity,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0].replace(/-/g, '/')
    };
    setUx75Notes(prev => [newNote, ...prev]);
    setUx75NewNoteText('');
    triggerNotification(`تم تسجيل الملاحظة الجديدة بنجاح للشاشة المستهدفة وتصنيفها كـ ${ux75NewNoteSeverity === 'critical' ? '🔴 حرجة' : ux75NewNoteSeverity === 'medium' ? '🟡 متوسطة' : '🟢 تجميلية'}.`, 'success');
  };

  const toggleNoteStatus = (noteId: string) => {
    setUx75Notes(prev => prev.map(n => {
      if (n.id === noteId) {
        const nextStatus = n.status === 'resolved' ? 'pending' : 'resolved';
        triggerNotification(`تم تحديث حالة الملاحظة إلى: ${nextStatus === 'resolved' ? '✓ تم الإصلاح والاعتماد' : '● قيد المتابعة والتدقيق'}`, 'info');
        return { ...n, status: nextStatus };
      }
      return n;
    }));
  };

  const deleteNote = (noteId: string) => {
    setUx75Notes(prev => prev.filter(n => n.id !== noteId));
    triggerNotification('تم حذف الملاحظة بنجاح من قائمة التدقيق النشطة.', 'danger');
  };

  const toggleScreenApproval = (screenId: string) => {
    setUx75Screens(prev => prev.map(s => {
      if (s.id === screenId) {
        const nextState = !s.isApproved;
        triggerNotification(`تم تحديث حالة اعتماد شاشة (${s.name}) إلى: ${nextState ? '✓ معتمدة وجاهزة بالكامل' : '● قيد التدقيق والمراجعة'}`, 'info');
        return { ...s, isApproved: nextState };
      }
      return s;
    }));
  };

  const toggleScreenConsistency = (screenId: string, field: 'buttonsConsistent' | 'tablesConsistent' | 'modalsConsistent' | 'colorsFontsConsistent' | 'marginsSpacingsConsistent' | 'iconsConsistent') => {
    setUx75Screens(prev => prev.map(s => {
      if (s.id === screenId) {
        return { ...s, [field]: !s[field] };
      }
      return s;
    }));
  };

  // Calculations
  const totalScreensCount = ux75Screens.length;
  const approvedScreensCount = ux75Screens.filter(s => s.isApproved).length;
  const pendingScreensCount = totalScreensCount - approvedScreensCount;
  
  const criticalNotesCount = ux75Notes.filter(n => n.severity === 'critical' && n.status === 'pending').length;
  const mediumNotesCount = ux75Notes.filter(n => n.severity === 'medium' && n.status === 'pending').length;
  const cosmeticNotesCount = ux75Notes.filter(n => n.severity === 'cosmetic' && n.status === 'pending').length;

  // Auto validation for decision:
  const allApproved = approvedScreensCount === totalScreensCount;
  const noCriticalPending = criticalNotesCount === 0;

  return (
    <div id="ux75-audit-container" className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* Header Banner */}
      <div id="ux75-header-banner" className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end md:justify-start">
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">التدقيق الفني للشاشات الحرجة</span>
              <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-500/20 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة السابعة 7.5</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">7.5 تدقيق واجهات الشاشات الحرجة – Enterprise UI Audit</h2>
            <p className="text-xs text-slate-300 mt-2 font-medium max-w-2xl leading-relaxed">
              تحليل ومطابقة جودة التفاعل والاتساق البصري للشاشات الـ 8 الرئيسية للمنصة. يهدف هذا التدقيق الميداني للتأكد من انسيابية وسرعة تجربة المستخدم لإدخال الحركات المالية والقيود وشؤون الطلاب بأقل عدد نقرات، مع توحيد الرسائل والجداول بدقة تامة.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-emerald-500/15 border border-emerald-500/30 p-5 rounded-2xl shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-emerald-300 block uppercase">مؤشر جاهزية الشاشات الكلية</span>
            <span className="text-3xl font-black text-emerald-400 mt-1 block font-mono">
              {Math.round((approvedScreensCount / totalScreensCount) * 100)}%
            </span>
            <p className="text-[10px] text-slate-400 mt-2 font-bold">{approvedScreensCount} من {totalScreensCount} شاشات معتمدة بالكامل</p>
          </div>
        </div>
      </div>

      {/* Overview Statistics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Approved Screens count card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 flex justify-between items-center shadow-xs text-right">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">شاشات معتمدة للإنتاج</span>
            <span className="text-xl font-black text-emerald-600 mt-1.5 block font-mono">{approvedScreensCount} / {totalScreensCount}</span>
            <span className="text-[9px] text-slate-400 mt-1 font-bold block">متبقي {pendingScreensCount} شاشات تحت المراجعة</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Critical notes widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 flex justify-between items-center shadow-xs text-right">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">ملاحظات واجهة حرجة</span>
            <span className="text-xl font-black text-rose-600 mt-1.5 block font-mono">{criticalNotesCount} ملاحظات</span>
            <span className="text-[9px] text-rose-500 font-extrabold mt-1 block">تمنع الإطلاق والترخيص النهائي</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>
        </div>

        {/* Medium notes widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 flex justify-between items-center shadow-xs text-right">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">ملاحظات واجهة متوسطة</span>
            <span className="text-xl font-black text-amber-600 mt-1.5 block font-mono">{mediumNotesCount} معلقة</span>
            <span className="text-[9px] text-slate-400 mt-1 font-bold block">موصى بمعالجتها وصقلها فوراً</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Cosmetic notes widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 flex justify-between items-center shadow-xs text-right">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">ملاحظات تجميلية</span>
            <span className="text-xl font-black text-sky-600 mt-1.5 block font-mono">{cosmeticNotesCount} بسيطة</span>
            <span className="text-[9px] text-slate-400 mt-1 font-bold block">تحسينات غير حرجة لسلوك الأبعاد</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Core Audit Matrix UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Right Column: Screen selector and check items (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 text-right">
          <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
            <select
              value={ux75SelectedScreen}
              onChange={(e) => setUx75SelectedScreen(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer text-right"
            >
              <option value="all">كل الشاشات الـ 8 الموحدة</option>
              {ux75Screens.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
            <h3 className="text-base font-black text-slate-900 dark:text-white">المصفوفة الفنية التفصيلية واعتماد الشاشات</h3>
          </div>

          <div className="space-y-4">
            {ux75SelectedScreen === 'all' ? (
              /* Grid showing overview of all screens for rapid approval */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ux75Screens.map((sc) => {
                  const screenNotes = ux75Notes.filter(n => n.screenId === sc.id && n.status === 'pending');
                  return (
                    <div 
                      key={sc.id}
                      onClick={() => setUx75SelectedScreen(sc.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-right flex flex-col justify-between h-44 hover:shadow-xs ${
                        sc.isApproved 
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/40 border-emerald-500/20 dark:border-emerald-500/10' 
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            sc.isApproved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {sc.isApproved ? '✓ معتمدة ومطابقة بالكامل' : '● قيد التدقيق والمتابعة'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{sc.engName}</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2">{sc.name}</h4>
                        <p className="text-[10.5px] text-slate-500 line-clamp-2 mt-1 leading-relaxed font-semibold">{sc.goal}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-[10px]">
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">انقر للتفاصيل والتدقيق 👁️</span>
                        <span className="font-bold text-slate-400">
                          {screenNotes.length === 0 ? '🟢 خالية من الملاحظات' : `🔴 متبقي ${screenNotes.length} ملاحظات`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single Selected Screen Detailed Audit Sandbox UI */
              activeScreen && (
                <div className="space-y-6">
                  {/* Screen Summary Card info */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <button 
                        type="button"
                        onClick={() => toggleScreenApproval(activeScreen.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102 ${
                          activeScreen.isApproved 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {activeScreen.isApproved ? <CheckCircle2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span>{activeScreen.isApproved ? 'إلغاء الاعتماد المؤقت' : 'تأكيد اعتماد ومطابقة هذه الشاشة الآن ✓'}</span>
                      </button>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">{activeScreen.engName}</span>
                        <h4 className="text-base font-black text-slate-900 dark:text-white">{activeScreen.name}</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/50 rounded-xl space-y-1 text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">الهدف الاستراتيجي من الشاشة:</span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-bold">{activeScreen.goal}</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/50 rounded-xl space-y-1 text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">تسلسل ترتيب الأهمية البصرية للمحتويات:</span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-bold">{activeScreen.priorityOrder}</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/50 rounded-xl space-y-1 text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">أهم الإجراءات والعمليات الفورية:</span>
                        <p className="text-indigo-600 dark:text-indigo-400 leading-relaxed font-bold">{activeScreen.mainActions}</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/50 rounded-xl space-y-1 text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">معدل النقرات المطلوب للإنتاجية (Clicks):</span>
                        <p className="text-emerald-600 dark:text-emerald-500 leading-relaxed font-bold">{activeScreen.clickCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Checklist of 6 Design System Consistency Rules for the selected screen */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 block text-right">قائمة التحقق من الاتساق البصري والجمالي (Consistency Audit checklist):</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { key: 'buttonsConsistent', label: '1. توحيد الأزرار وحالاتها التفاعلية', desc: 'تعتمد rounded-xl وزر أساسي ملون وحيد' },
                        { key: 'tablesConsistent', label: '2. توحيد الجداول وهوامش البيانات', desc: 'هوامش 16px وتناوب الصفوف وخطوط واضحة' },
                        { key: 'modalsConsistent', label: '3. توحيد النوافذ المنبثقة والصناديق', desc: 'تعتمد rounded-3xl وخلفيات ضبابية مريحة' },
                        { key: 'colorsFontsConsistent', label: '4. الاتساق التام للخطوط والألوان المؤسسية', desc: 'مطابقة لوحة ألوان هادئة وخط Inter/Space' },
                        { key: 'marginsSpacingsConsistent', label: '5. الهوامش الداخلية ومسافات الفراغات', desc: 'فراغات متناسبة p-4/p-6 غير متلاصقة' },
                        { key: 'iconsConsistent', label: '6. توحيد مكتبة الأيقونات المعتمدة', desc: 'استخدام lucide-react فقط بأحجام متناسقة' }
                      ].map((item) => {
                        const isChecked = (activeScreen as any)[item.key];
                        return (
                          <div 
                            key={item.key}
                            onClick={() => toggleScreenConsistency(activeScreen.id, item.key as any)}
                            className={`p-3 rounded-xl border cursor-pointer text-right flex items-start gap-3 transition-colors ${
                              isChecked 
                                ? 'bg-emerald-50/20 border-emerald-500/20 dark:border-emerald-500/10' 
                                : 'bg-rose-50/10 border-rose-500/15'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 text-transparent'
                              }`}>
                                <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                            </div>
                            <div>
                              <span className={`text-xs font-black block ${isChecked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500'}`}>
                                {item.label}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold block leading-relaxed mt-0.5">{item.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Back button */}
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={() => setUx75SelectedScreen('all')}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-black transition-colors cursor-pointer"
                    >
                      ← العودة لقائمة كل الشاشات الـ 8 الموحدة
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Left Column: Log of notes and adding new ones (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 text-right">
          <h3 className="text-base font-black text-slate-900 dark:text-white pb-3 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
            <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-black px-2 py-0.5 rounded-md">
              {ux75Notes.filter(n => n.status === 'pending').length} متبقية
            </span>
            <span>قائمة حصر الملاحظات المعلقة والمحلولة</span>
          </h3>

          {/* Form to log a new note */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 rounded-2xl text-right space-y-4">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">تسجيل ملاحظة تدقيق فني جديدة:</h4>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 block font-bold">الشاشة المستهدفة بالملاحظة:</label>
              <select
                value={ux75NewNoteScreenId}
                onChange={(e) => setUx75NewNoteScreenId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-hidden text-right cursor-pointer"
              >
                {ux75Screens.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 block font-bold">درجة الخطورة والتصنيف:</label>
                <select
                  value={ux75NewNoteSeverity}
                  onChange={(e) => setUx75NewNoteSeverity(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-hidden text-right cursor-pointer"
                >
                  <option value="critical">🔴 حرجة (تمنع الترحيل)</option>
                  <option value="medium">🟡 متوسطة (صقل واجهة)</option>
                  <option value="cosmetic">🟢 تجميلية (بسيطة جداً)</option>
                </select>
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة الملاحظة</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <textarea
                value={ux75NewNoteText}
                onChange={(e) => setUx75NewNoteText(e.target.value)}
                placeholder="اكتب تفاصيل الملاحظة والحل المقترح بالتفصيل هنا..."
                rows={3}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-right focus:outline-hidden font-semibold"
              />
            </div>
          </div>

          {/* List of active and resolved notes */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto">
            {ux75Notes.map((note) => {
              const screenObj = ux75Screens.find(s => s.id === note.screenId);
              return (
                <div 
                  key={note.id}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between h-auto min-h-[110px] ${
                    note.status === 'resolved' 
                      ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-150 dark:border-slate-850 opacity-60' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center text-[9px] font-bold">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => toggleNoteStatus(note.id)}
                          className={`px-1.5 py-0.5 rounded-md font-black cursor-pointer transition-colors ${
                            note.status === 'resolved' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {note.status === 'resolved' ? '● إرجاع للتحقق' : '✓ حل الملاحظة'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteNote(note.id)}
                          className="p-0.5 text-rose-500 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="flex gap-1 items-center">
                        <span className={`px-1.5 py-0.5 rounded font-black ${
                          note.severity === 'critical' ? 'bg-rose-50 text-rose-700' : note.severity === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'
                        }`}>
                          {note.severity === 'critical' ? '🔴 حرجة' : note.severity === 'medium' ? '🟡 متوسطة' : '🟢 تجميلية'}
                        </span>
                        <span className="text-slate-400 font-semibold">{screenObj ? screenObj.name : 'شاشة مجهولة'}</span>
                      </div>
                    </div>

                    <p className={`text-[11px] leading-relaxed mt-2.5 font-bold ${note.status === 'resolved' ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                      {note.text}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-50 dark:border-slate-850/50 mt-2.5 flex justify-between items-center text-[9px] text-slate-400 font-semibold">
                    <span>{note.createdAt}</span>
                    <span>{note.status === 'resolved' ? '✓ تم الحل والاعتماد' : '● قيد المعالجة'}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Footer Audit decision checklist & certificate */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs text-right space-y-6">
        <h3 className="text-base font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
          قرار واستحقاق التدقيق الفني لواجهات الاستخدام (UI Audit Decision)
        </h3>

        {/* Requirements Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { key: 'productivity', label: '1. إنتاجية عالية (High Productivity)', desc: 'أقل عدد نقرات ممكن للمهام الحساسة' },
            { key: 'consistency', label: '2. اتساق كامل (Full Consistency)', desc: 'تطابق تام مع الجداول والخطوط والأبعاد' },
            { key: 'usability', label: '3. سهولة الاستخدام (Usability)', desc: 'واجهة واضحة تقلل الجهد المعرفي والمشتتات' },
            { key: 'actionsClarity', label: '4. وضوح الإجراءات (Action Clarity)', desc: 'أزرار ومسارات عمل واضحة غير مخفية' },
            { key: 'readiness', label: '5. جاهزية للعمل اليومي (Daily Readiness)', desc: 'الشاشة آمنة ومختبرة ومستقرة للإنتاج' }
          ].map((item) => (
            <div
              key={item.key}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 text-right space-y-1.5 font-bold"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 block uppercase">معيار الجودة المالي</span>
                <span className="text-xs">
                  {allApproved && noCriticalPending ? '🟢 مستوفي' : '🟡 مراجع'}
                </span>
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">{item.label}</span>
              <span className="text-[9px] text-slate-400 font-bold block leading-relaxed">{item.desc}</span>
            </div>
          ))}
        </div>

        {/* Certification Stamp */}
        {ux75CertApproved && (
          <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 p-5 rounded-2xl space-y-3 animate-fade-in text-center font-bold">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">قرار الاعتماد والترخيص الفني رقم ERP-UI-7.5-AUDIT</span>
            <h4 className="text-xs font-black text-amber-400">✓ تم توثيق قرار التدقيق الشامل للشاشات الثمانية الحرجة بنجاح مذهل</h4>
            <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-xl mx-auto">
              بموجب المراجعة الصارمة التي تم إجراؤها للشاشات الحرجة (لوحة التحكم الرئيسية، شؤون الطلاب، الرسوم الدراسية، سندات القبض، القيود اليومية، الحسابات العامة، الامتحانات، والموارد البشرية)، نشهد بمطابقة هذه الواجهات بنسبة 100% لمعايير التفاعل والأبعاد والإنتاجية العالية، وجاهزيتها التامة للاستخدام الميداني اليومي.
            </p>
            <div className="pt-2 border-t border-slate-800/40 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400">
              <div>
                <span>المدقق التقني والمشرف العام:</span>
                <strong className="text-slate-200 block mt-0.5">salafe10@gmail.com</strong>
              </div>
              <div>
                <span>تاريخ وموثوقية الترخيص السحابي:</span>
                <strong className="text-slate-200 block mt-0.5">{new Date().toISOString().split('T')[0]} • مرخص وناضج تقنياً بالكامل 📜</strong>
              </div>
            </div>
          </div>
        )}

        {/* Decision Controls */}
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setUx75CertApproved(true);
              triggerNotification('تم تسجيل وثيقة اعتماد جودة الواجهات وتدقيق الشاشات الـ 8 بنجاح وتوثيقها بالمرجع الفني! 🌟', 'success');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>إصدار وتوقيع قرار التدقيق النهائي الشامل 🚀</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Printer className="w-4 h-4" />
            <span>تصدير شهادة التدقيق والجاهزية للطباعة 📄</span>
          </button>
        </div>

      </div>

    </div>
  );
}
