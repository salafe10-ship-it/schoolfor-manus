import { AlertOctagon, ArrowLeft, ArrowRight, ArrowUpDown, Calendar, Check, CheckCircle2, Clipboard, Clock, Database, Download, FileText, Filter, HelpCircle, Laptop, Layers, PlayCircle, PlusCircle, Printer, RefreshCw, Search, Trash2, User } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { EnterpriseAuditLogger, EnterpriseAuditLog, AuditActionType } from '../../utils/EnterpriseAuditLogger';

export default function SystemAuditTrailTab() {
  const [logs, setLogs] = useState<EnterpriseAuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulation form states
  const [simAction, setSimAction] = useState<AuditActionType>('تعديل');
  const [simOldValue, setSimOldValue] = useState('الرصيد السابق: 2,500 ريال، حالة العقد: نشط');
  const [simNewValue, setSimNewValue] = useState('الرصيد الحالي: 1,800 ريال، حالة العقد: منتهي الدفع');
  const [simUserName, setSimUserName] = useState('أ. سليمان غازي (المدير المالي)');
  const [simUserRole, setSimUserRole] = useState('المدير المالي التنفيذي');
  const [simDevice, setSimDevice] = useState('Chrome v122 / Windows 11');
  const [simModule, setSimModule] = useState('بوابة الشؤون المالية (StudentFinancialPortal)');
  const [simIpAddress, setSimIpAddress] = useState('192.168.1.15');

  // Load logs on mount and subscribe to changes
  useEffect(() => {
    EnterpriseAuditLogger.initialize();
    setLogs(EnterpriseAuditLogger.getAllLogs());
    
    const unsubscribe = EnterpriseAuditLogger.subscribe(() => {
      setLogs(EnterpriseAuditLogger.getAllLogs());
    });
    return unsubscribe;
  }, []);

  // Sync simulation values when action changes to provide realistic defaults
  useEffect(() => {
    switch (simAction) {
      case 'إضافة':
        setSimOldValue('لا يوجد (سجل جديد)');
        setSimNewValue('إضافة الموظف الجديد: م. ماجد السهلي، الراتب الأساسي: 9,200 ريال، التعيين: قسم تقنية المعلومات');
        setSimModule('بوابة الموارد البشرية (HRPlatform)');
        break;
      case 'تعديل':
        setSimOldValue('الرسوم الدراسية السنوية: 15,000 ريال');
        setSimNewValue('الرسوم الدراسية السنوية: 13,500 ريال (خصم مستحق للأشقاء 10%)');
        setSimModule('بوابة الشؤون المالية (StudentFinancialPortal)');
        break;
      case 'حذف':
        setSimOldValue('ملف تقييم الطالب الفصلي للعام 2025 (مع الشواهد المرفقة)');
        setSimNewValue('تم إزالة السجل نهائياً وتطهير الحاويات السحابية بناءً على طلب الحذف المعتمد');
        setSimModule('شؤون الطلاب والامتحانات (StudentAffairsPortal)');
        break;
      case 'اعتماد':
        setSimOldValue('حالة الفاتورة رقم INV-892: مسودة غير مدفوعة قيد الفحص');
        setSimNewValue('حالة الفاتورة رقم INV-892: معتمدة ومرحلة إلى ميزان المراجعة النهائي بنجاح');
        setSimModule('الحسابات العامة والدفاتر (LedgerBooks)');
        break;
      case 'إلغاء اعتماد':
        setSimOldValue('حالة السند المالي رقم REC-203: معتمد وتأكيد الدفع البنكي فعال');
        setSimNewValue('حالة السند المالي رقم REC-203: إلغاء الاعتماد والتحويل الفوري لحالة التعليق المالي لإعادة التدقيق');
        setSimModule('بوابة الشؤون المالية (StudentFinancialPortal)');
        break;
      case 'طباعة':
        setSimOldValue('طلب استعراض كشف الحساب التحليلي للعميل على الشاشة');
        setSimNewValue('تم إصدار وطباعة نسخة ورقية موقعة ومختومة ومطابقة لمعايير وزارة التعليم');
        setSimModule('التقارير والمطابقات المالية (Financial Reports)');
        break;
      case 'تصدير':
        setSimOldValue('شاشة تصفية غيابات الطلاب خلال الفصل الدراسي الأول');
        setSimNewValue('تصدير التقرير الكلي إلى صيغة ملف CSV مدمج ومحمي برمز تشفير سحابي');
        setSimModule('الحضور والانضباط السلوكي (Attendance Portal)');
        break;
      case 'تسجيل الدخول':
        setSimOldValue('الجلسة: مغلقة');
        setSimNewValue('الجلسة: نشطة ومفتوحة، تم التحقق من المصادقة الثنائية (2FA OTP)');
        setSimModule('بوابة تسجيل الدخول الموحد (SSO Auth)');
        break;
      case 'تسجيل الخروج':
        setSimOldValue('الجلسة: متصل ونشط');
        setSimNewValue('الجلسة: تم إنهاء الاتصال بنجاح وتصفير جلسة المتصفح للأمان');
        setSimModule('بوابة تسجيل الدخول الموحد (SSO Auth)');
        break;
    }
  }, [simAction]);

  // Unique lists for dropdowns
  const uniqueUsers = useMemo(() => {
    const users = logs.map(l => l.userName);
    return ['ALL', ...Array.from(new Set(users))];
  }, [logs]);

  // Filtered lists
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search Box filter
      const matchesSearch = 
        log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.oldValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.newValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ipAddress.toLowerCase().includes(searchQuery.toLowerCase());

      // Action Filter
      const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

      // User Filter
      const matchesUser = selectedUser === 'ALL' || log.userName === selectedUser;

      // Date Filters
      const logDate = new Date(log.date);
      const matchesStartDate = !startDate || logDate >= new Date(startDate);
      const matchesEndDate = !endDate || logDate <= new Date(endDate);

      return matchesSearch && matchesAction && matchesUser && matchesStartDate && matchesEndDate;
    });
  }, [logs, searchQuery, selectedAction, selectedUser, startDate, endDate]);

  const handleSimulateAddLog = () => {
    // لا تُضاف أحداث محاكاة إلى سجل التدقيق؛ الأحداث يجب أن تأتي من العمليات الفعلية.
    window.dispatchEvent(new CustomEvent('erp-notification', {
      detail: { title: 'وضع المحاكاة غير متاح', message: 'لم تتم إضافة سجل تدقيق اصطناعي.', type: 'warning' }
    }));
  };

  const handleExportCSV = () => {
    const csvContent = EnterpriseAuditLogger.exportToCSV(filteredLogs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `erp_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintLogs = () => {
    window.print();
  };

  const handleClearLogs = () => {
    if (confirm('تنبيه أمني أقصى: هل أنت متأكد من مسح جميع سجلات المراجعة بالكامل؟ سيؤدي ذلك لإضافة سجل تدقيق دائم وموثق بعملية الإزالة.')) {
      EnterpriseAuditLogger.clearAll('أ. سليمان غازي (المدير المالي)', 'المدير المالي التنفيذي');
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPI counters
  const stats = useMemo(() => {
    const total = logs.length;
    const additions = logs.filter(l => l.action === 'إضافة').length;
    const edits = logs.filter(l => l.action === 'تعديل').length;
    const deletes = logs.filter(l => l.action === 'حذف').length;
    const approvals = logs.filter(l => l.action === 'اعتماد' || l.action === 'إلغاء اعتماد').length;
    
    return { total, additions, edits, deletes, approvals };
  }, [logs]);

  // Action background badge styles
  const getActionBadgeStyle = (action: AuditActionType) => {
    switch (action) {
      case 'إضافة':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/60';
      case 'تعديل':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/60';
      case 'حذف':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/60';
      case 'اعتماد':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/60';
      case 'إلغاء اعتماد':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/60';
      case 'طباعة':
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      case 'تصدير':
        return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/60';
      case 'تسجيل الدخول':
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/60';
      case 'تسجيل الخروج':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/60';
      default:
        return 'bg-transparent text-slate-600 border-slate-200 dark:bg-slate-850 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans text-right" dir="rtl" id="unified_audit_trail_system">
      
      {/* Title & Top Description Header */}
      <div className="bg-transparent dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-600" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <Database className="w-5 h-5 animate-pulse" />
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">سجل الرقابة والمراجعة الموحد للمنظومة (Unified Audit Trail)</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              النظام المركزي الشامل لتتبع وتدوين كافة العمليات التشغيلية والحركات المالية الحساسة. يقوم النظام تلقائياً بتوثيق وتوثيب تفاصيل التعديلات بالقيم المقارنة (القديمة والجديدة)، مع إثبات هوية المستخدم المنفذ، الجهاز المتصل، عنوان الـ IP، والتوقيت الكامل، محققاً أفضل معايير الامتثال والتدقيق الأمني والمالي الداخلي للمدارس.
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex-1 md:flex-none bg-amber-600 hover:bg-amber-700 text-white text-xs font-black py-2.5 px-4.5 flex items-center justify-center gap-2 cursor-pointer shadow transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>تصدير السجل (CSV)</span>
            </button>
            <button
              onClick={handlePrintLogs}
              className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-black py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكشف</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="flex-1 md:flex-none bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-black py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>تطهير السجل</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI STATS DASHBOARD GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-4.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-black block mb-1">إجمالي الحركات الموثقة</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-mono font-black text-slate-900 dark:text-white">{stats.total}</span>
            <span className="text-[10px] text-amber-500 font-bold">عملية</span>
          </div>
        </div>

        <div className="dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-4.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-black block mb-1">عمليات الإضافة الجديدة</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">{stats.additions}</span>
            <span className="text-[10px] text-emerald-500 font-bold">حركة</span>
          </div>
        </div>

        <div className="dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-4.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-black block mb-1">عمليات التعديل والتغيير</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-mono font-black text-orange-600 dark:text-orange-400">{stats.edits}</span>
            <span className="text-[10px] text-orange-500 font-bold">حركة</span>
          </div>
        </div>

        <div className="dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-4.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-black block mb-1">عمليات الحذف والإزالة</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-mono font-black text-rose-600 dark:text-rose-400">{stats.deletes}</span>
            <span className="text-[10px] text-rose-500 font-bold">حركة</span>
          </div>
        </div>

        <div className="dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 col-span-2 md:col-span-1 p-4.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-black block mb-1">الاعتماد وإلغاء الاعتماد</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-mono font-black text-amber-600 dark:text-amber-400">{stats.approvals}</span>
            <span className="text-[10px] text-amber-500 font-bold">قرار مالي</span>
          </div>
        </div>
      </div>

      {/* FILTER & ADVANCED SEARCH PANEL */}
      <div className="dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4.5 h-4.5 text-amber-600" />
            <span className="text-xs font-black text-slate-800 dark:text-white">منصة تصفية وتحديد نطاق سجل المراجعة</span>
          </div>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold px-3 py-1 rounded-full border border-amber-150">
            الحركات المطابقة: <span className="font-mono font-black">{filteredLogs.length}</span> من أصل {logs.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Full-text query */}
          <div className="space-y-1.5 col-span-1 sm:col-span-2 lg:col-span-1">
            <label className="text-[10px] text-slate-400 font-black block">بحث شامل (القيمة / المستخدم / ID)</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث بقيمة التغيير، المودول، المستخدم..."
                className="w-full text-xs font-bold text-slate-850 dark:text-white bg-transparent dark:bg-slate-850 dark:border-slate-800 pr-9 pl-3 py-2.5 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Action Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">نوع العملية (Audited Action)</label>
            <select
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 dark:text-white bg-transparent dark:bg-slate-850 dark:border-slate-800 px-3 py-2.5 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">جميع العمليات التسعة (All Actions)</option>
              <option value="إضافة">إضافة (Create)</option>
              <option value="تعديل">تعديل (Modify / Edit)</option>
              <option value="حذف">حذف (Delete)</option>
              <option value="اعتماد">اعتماد (Approve)</option>
              <option value="إلغاء اعتماد">إلغاء اعتماد (Unapprove)</option>
              <option value="طباعة">طباعة (Print)</option>
              <option value="تصدير">تصدير (Export)</option>
              <option value="تسجيل الدخول">تسجيل الدخول (Login)</option>
              <option value="تسجيل الخروج">تسجيل الخروج (Logout)</option>
            </select>
          </div>

          {/* User Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">المستخدم المنفذ</label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 dark:text-white bg-transparent dark:bg-slate-850 dark:border-slate-800 px-3 py-2.5 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">جميع المستخدمين</option>
              {uniqueUsers.filter(u => u !== 'ALL').map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">التاريخ من</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 dark:text-white bg-transparent dark:bg-slate-850 dark:border-slate-800 px-3 py-2 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Date to */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">التاريخ إلى</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 dark:text-white bg-transparent dark:bg-slate-850 dark:border-slate-800 px-3 py-2 focus:border-amber-500 outline-none"
            />
          </div>

        </div>
      </div>

      {/* COMPLIANCE SIMULATION & AUDIT DESK FOR TESTING */}
      <div className="bg-transparent dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <PlayCircle className="w-5 h-5 text-amber-600 animate-bounce" />
          <span className="text-xs font-black text-slate-850 dark:text-white">وحدة توليد ومحاكاة العمليات التشغيلية والمالية لتدقيق سجل الرقابة الموحد (Audit Simulation Lab)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Action Choice */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-amber-600 font-black block">اختر نوع العملية البرمجية المراد اختبار تدوينها</label>
            <select
              value={simAction}
              onChange={e => setSimAction(e.target.value as AuditActionType)}
              className="w-full text-xs font-extrabold text-amber-700 dark:bg-slate-850 dark:border-slate-800 px-3 py-2.5 outline-none cursor-pointer focus:border-amber-500"
            >
              <option value="إضافة">إضافة (Add)</option>
              <option value="تعديل">تعديل (Edit)</option>
              <option value="حذف">حذف (Delete)</option>
              <option value="اعتماد">اعتماد (Approve)</option>
              <option value="إلغاء اعتماد">إلغاء اعتماد (Unapprove)</option>
              <option value="طباعة">طباعة (Print)</option>
              <option value="تصدير">تصدير (Export)</option>
              <option value="تسجيل الدخول">تسجيل الدخول (Login)</option>
              <option value="تسجيل الخروج">تسجيل الخروج (Logout)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">المستخدم المحاكي للتنفيذ</label>
            <input
              type="text"
              value={simUserName}
              onChange={e => setSimUserName(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">الدور / الرتبة الوظيفية</label>
            <input
              type="text"
              value={simUserRole}
              onChange={e => setSimUserRole(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] text-rose-500 font-black block">القيمة القديمة الممثلة قبل التغيير (Old Value)</label>
            <input
              type="text"
              value={simOldValue}
              onChange={e => setSimOldValue(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-emerald-500 font-black block">القيمة الجديدة الممثلة بعد التغيير (New Value)</label>
            <input
              type="text"
              value={simNewValue}
              onChange={e => setSimNewValue(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">الجهاز المتصل (Device Info)</label>
            <input
              type="text"
              value={simDevice}
              onChange={e => setSimDevice(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">اسم شاشة النظام / المودول المسبب</label>
            <input
              type="text"
              value={simModule}
              onChange={e => setSimModule(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">عنوان IP</label>
            <input
              type="text"
              value={simIpAddress}
              onChange={e => setSimIpAddress(e.target.value)}
              className="w-full text-xs font-mono font-bold text-slate-800 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2"
            />
          </div>

        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSimulateAddLog}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black py-2.5 px-6 cursor-pointer flex items-center gap-2 shadow-md transition-all duration-150"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تنفيذ وحفظ حركة المراجعة الآن 💾</span>
          </button>
        </div>
      </div>

      {/* MAIN AUDIT TRAILS TABULAR REPRESENTATION */}
      <div className="dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xs">
        
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-14 h-14 bg-transparent dark:bg-slate-850 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-sm font-black text-slate-600 dark:text-slate-300">لم نعثر على أي حركات رقابية مطابقة للفلاتر المعطاة.</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              تأكد من خلو خانات التصفية، أو استعن بقائمة المحاكاة أعلاه لتوليد حركات مراجعة إضافية من الأنواع المختلفة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-transparent dark:bg-slate-850/60 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4.5 text-[11px] font-black tracking-wider w-[120px]">معرف الحركة ID</th>
                  <th className="p-4.5 text-[11px] font-black tracking-wider">التوقيت والتاريخ</th>
                  <th className="p-4.5 text-[11px] font-black tracking-wider">العملية / الحدث</th>
                  <th className="p-4.5 text-[11px] font-black tracking-wider">المستخدم المنفذ</th>
                  <th className="p-4.5 text-[11px] font-black tracking-wider">الشاشة والمودول</th>
                  <th className="p-4.5 text-[11px] font-black tracking-wider">الجهاز والـ IP</th>
                  <th className="p-4.5 text-[11px] font-black tracking-wider text-center w-[130px]">التحكم بالتفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                {filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  
                  return (
                    <React.Fragment key={log.id}>
                      {/* Main Entry Row */}
                      <tr className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors ${isExpanded ? 'bg-amber-50/10 dark:bg-amber-950/5' : ''}`}>
                        
                        {/* ID */}
                        <td className="p-4.5 text-xs font-mono font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          <span className="bg-amber-50 dark:bg-amber-950/40 border border-amber-150 dark:border-amber-900/60 px-2 py-0.5 rounded-lg">
                            {log.id}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="p-4.5 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{log.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                            <Clock className="w-3.1 h-3.1 text-slate-400" />
                            <span>{log.time}</span>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="p-4.5">
                          <span className={`inline-block px-3 py-1 text-xs font-black rounded-full border ${getActionBadgeStyle(log.action)}`}>
                            {log.action}
                          </span>
                        </td>

                        {/* User & Role */}
                        <td className="p-4.5 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-black text-slate-850 dark:text-white">{log.userName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold block max-w-[150px] truncate" title={log.userRole}>
                            {log.userRole}
                          </div>
                        </td>

                        {/* Module Context */}
                        <td className="p-4.5 text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={log.module}>
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span>{log.module}</span>
                          </div>
                        </td>

                        {/* Device & IP */}
                        <td className="p-4.5 space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[150px]" title={log.device}>
                            <Laptop className="w-3.2 h-3.2 text-slate-400" />
                            <span>{log.device}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            IP: {log.ipAddress}
                          </div>
                        </td>

                        {/* Expand Button */}
                        <td className="p-4.5 text-center">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
                          >
                            <span>{isExpanded ? 'طي التفاصيل' : 'عرض التغييرات'}</span>
                          </button>
                        </td>

                      </tr>

                      {/* Expanded View showing Before vs After structured comparative table */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 bg-slate-50/40 dark:bg-slate-900/20">
                            <div className="p-6 border-y border-slate-100 dark:border-slate-800 space-y-5">
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-amber-600" />
                                  <span>مقارنة البيانات المدققة ومطابقة القيم (Value Mutation Audit)</span>
                                </span>
                                <button
                                  onClick={() => handleCopyText(log.id, `ID: ${log.id}\nAction: ${log.action}\nOld: ${log.oldValue}\nNew: ${log.newValue}`)}
                                  className="text-[10px] font-black text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 dark:bg-slate-800 border border-slate-150 dark:border-slate-750 px-2.5 py-1 rounded-md"
                                >
                                  {copiedId === log.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>تم نسخ تفاصيل الحركة!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clipboard className="w-3.5 h-3.5" />
                                      <span>نسخ تفاصيل الحركة للمذكرة</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Comparative Bento Columns */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
                                
                                {/* Old Value */}
                                <div className="bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 p-4 space-y-2">
                                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-black tracking-wider uppercase block">
                                    القيمة السابقة / القديمة (Old Value)
                                  </span>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed min-h-[50px]">
                                    {log.oldValue}
                                  </p>
                                </div>

                                {/* New Value */}
                                <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-150 dark:border-emerald-900/40 p-4 space-y-2">
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black tracking-wider uppercase block">
                                    القيمة الجديدة المستجدة (New Value)
                                  </span>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed min-h-[50px]">
                                    {log.newValue}
                                  </p>
                                </div>

                                {/* Dynamic direction indicator in absolute center */}
                                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 dark:bg-slate-850 dark:border-slate-800 rounded-full items-center justify-center shadow-md">
                                  <ArrowLeft className="w-4 h-4 text-amber-500" />
                                </div>

                              </div>

                              {/* Detailed Metadata Footer Row */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                                <div className="dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800/80 text-xs space-y-1">
                                  <span className="text-[9px] text-slate-400 font-bold block">التوقيت الدقيق للمطابقة</span>
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{log.timestamp}</span>
                                </div>

                                <div className="dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800/80 text-xs space-y-1">
                                  <span className="text-[9px] text-slate-400 font-bold block">الجهاز وعميل الويب</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate block" title={log.device}>{log.device}</span>
                                </div>

                                <div className="dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800/80 text-xs space-y-1">
                                  <span className="text-[9px] text-slate-400 font-bold block">عنوان IP المتصل</span>
                                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{log.ipAddress}</span>
                                </div>

                                <div className="dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800/80 text-xs space-y-1">
                                  <span className="text-[9px] text-slate-400 font-bold block">الحالة الأمنية (Security State)</span>
                                  <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>سليمة وموثقة سحابياً</span>
                                  </span>
                                </div>
                              </div>

                              <p className="text-[9px] text-slate-400 italic text-center font-medium pt-1">
                                تم حفظ وختم هذه العملية آلياً برقم معرّف مشفر من هيئة الرقابة المالية والأمن المعلوماتي لمؤسسة التعليم المفتوح.
                              </p>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
