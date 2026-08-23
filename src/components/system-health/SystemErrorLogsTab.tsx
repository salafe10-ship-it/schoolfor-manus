import { AlertOctagon, AlertTriangle, ArrowUpDown, Building, Calendar, Check, ChevronDown, ChevronUp, Copy, Download, Filter, Layers, PlusCircle, Search, Terminal, Trash2, User } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { EnterpriseErrorLogger, SystemErrorLog } from '../../utils/EnterpriseErrorLogger';

export default function SystemErrorLogsTab() {
  const [logs, setLogs] = useState<SystemErrorLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedSchool, setSelectedSchool] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedStackId, setCopiedStackId] = useState<string | null>(null);
  
  // Simulation fields
  const [simUserName, setSimUserName] = useState('أ. أحمد اليوسف (محاسب)');
  const [simScreenName, setSimScreenName] = useState('بوابة الشؤون المالية (StudentFinancialPortal)');
  const [simOperationName, setSimOperationName] = useState('ترحيل سند القبض للدفاتر العامة');
  const [simErrorMessage, setSimErrorMessage] = useState('DATABASE_LOCK_TIMEOUT: Connection acquired lock timeout after 30000ms.');
  const [simSchoolId, setSimSchoolId] = useState('school_001');
  const [simBranchId, setSimBranchId] = useState('branch_riyadh_01');

  // Load logs and subscribe to real-time additions
  useEffect(() => {
    setLogs(EnterpriseErrorLogger.getAllLogs());
    const unsubscribe = EnterpriseErrorLogger.subscribe(() => {
      setLogs(EnterpriseErrorLogger.getAllLogs());
    });
    return unsubscribe;
  }, []);

  // Filter lists options
  const uniqueUsers = useMemo(() => {
    const users = logs.map(l => l.userName);
    return ['ALL', ...Array.from(new Set(users))];
  }, [logs]);

  const uniqueSchools = useMemo(() => {
    const schools = logs.map(l => l.schoolId);
    return ['ALL', ...Array.from(new Set(schools))];
  }, [logs]);

  const uniqueBranches = useMemo(() => {
    const branches = logs.map(l => l.branchId);
    return ['ALL', ...Array.from(new Set(branches))];
  }, [logs]);

  // Filtered and searched logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = 
        log.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.screenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchUser = selectedUser === 'ALL' || log.userName === selectedUser;
      const matchSchool = selectedSchool === 'ALL' || log.schoolId === selectedSchool;
      const matchBranch = selectedBranch === 'ALL' || log.branchId === selectedBranch;

      return matchSearch && matchUser && matchSchool && matchBranch;
    });
  }, [logs, searchQuery, selectedUser, selectedSchool, selectedBranch]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyStack = (id: string, stack: string) => {
    navigator.clipboard.writeText(stack);
    setCopiedStackId(id);
    setTimeout(() => setCopiedStackId(null), 2000);
  };

  const handleSimulateNewError = () => {
    // لا تُضاف أخطاء اصطناعية إلى سجل التدقيق؛ السجل يُكتب من مسارات الفشل الفعلية فقط.
    window.dispatchEvent(new CustomEvent('erp-notification', {
      detail: { title: 'وضع الاختبار غير متاح', message: 'لم تتم إضافة سجل محاكاة إلى سجل الأخطاء المؤسسي.', type: 'warning' }
    }));
  };

  const handleExportCSV = () => {
    const csvContent = EnterpriseErrorLogger.exportToCSV(filteredLogs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `erp_error_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearLogs = () => {
    if (confirm('هل أنت متأكد من رغبتك في مسح جميع سجلات الأخطاء بشكل نهائي؟')) {
      EnterpriseErrorLogger.clearAll();
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans" id="unified_error_log_dashboard">
      
      {/* Header Info Block */}
      <div className="bg-transparent dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertOctagon className="w-5 h-5 animate-pulse" />
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">سجل الأخطاء والـ Exceptions الموحد للشركة</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              مرصد المراقبة والتحليل الشامل لكافة الأخطاء والاستثناءات البرمجية المسجلة على مستوى نظام إدارة مجمع المدارس. يتم تلقائياً تدوين تفاصيل المستخدم، العمليات الحسابية والمالية الفاشلة، اسم الواجهة، والـ Stack Trace لضمان التتبع الآمن للأخطاء والمطابقة لمتطلبات التدقيق المؤسسي.
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer shadow transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>تصدير السجل (CSV)</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="flex-1 md:flex-none bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 text-xs font-black py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>مسح السجل</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4.5 h-4.5 text-amber-500" />
            <span className="text-xs font-black text-slate-850 dark:text-white">فرز وتصفية السجلات الذكية</span>
          </div>
          <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
            تم العثور على: <span className="text-amber-600 dark:text-amber-400 font-mono font-black">{filteredLogs.length}</span> من أصل {logs.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Search Query */}
          <div className="space-y-1.5 col-span-1 sm:col-span-2 lg:col-span-1">
            <label className="text-[10px] text-slate-400 font-black block">البحث النصي المفتوح (رسالة / عملية / واجهة)</label>
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث برقم المعاملة، المحتوى، الكلمة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs font-bold text-slate-850 dark:text-white bg-transparent dark:bg-slate-850 dark:border-slate-800 pr-10 pl-3 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* User Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">تصفية حسب المستخدم (User Account)</label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full text-xs font-bold text-slate-850 dark:text-white bg-transparent dark:bg-slate-850 dark:border-slate-800 px-3 py-2.5 outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="ALL">جميع المستخدمين (All Users)</option>
              {uniqueUsers.filter(u => u !== 'ALL').map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">رقم المدرسة (Tenant ID)</label>
            <select
              value={selectedSchool}
              onChange={e => setSelectedSchool(e.target.value)}
              className="w-full text-xs font-bold text-slate-850 dark:text-white bg-transparent dark:bg-slate-850 dark:border-slate-800 px-3 py-2.5 outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="ALL">جميع المدارس (All Tenants)</option>
              {uniqueSchools.filter(s => s !== 'ALL').map(school => (
                <option key={school} value={school}>{school}</option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">رقم الفرع (Branch ID)</label>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="w-full text-xs font-bold text-slate-850 dark:text-white bg-transparent dark:bg-slate-850 dark:border-slate-800 px-3 py-2.5 outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="ALL">جميع الفروع والأقسام (All Branches)</option>
              {uniqueBranches.filter(b => b !== 'ALL').map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* NEW EXCEPTION SIMULATION DESK */}
      <div className="bg-transparent dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <PlusCircle className="w-4.5 h-4.5 text-rose-500" />
          <span className="text-xs font-black text-slate-850 dark:text-white">منصة محاكاة وتوليد استثناء جديد لغايات الفحص والتدقيق المالي (QA Simulation)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">المستخدم المحاكي</label>
            <input
              type="text"
              value={simUserName}
              onChange={e => setSimUserName(e.target.value)}
              className="w-full text-xs font-bold text-slate-850 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">الواجهة المستهدفة (اسم الشاشة)</label>
            <input
              type="text"
              value={simScreenName}
              onChange={e => setSimScreenName(e.target.value)}
              className="w-full text-xs font-bold text-slate-850 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black block">العملية البرمجية المنفذة</label>
            <input
              type="text"
              value={simOperationName}
              onChange={e => setSimOperationName(e.target.value)}
              className="w-full text-xs font-bold text-slate-850 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] text-slate-400 font-black block">تفاصيل رسالة الخطأ (ErrorMessage)</label>
            <input
              type="text"
              value={simErrorMessage}
              onChange={e => setSimErrorMessage(e.target.value)}
              className="w-full text-xs font-bold text-slate-850 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-black block">رقم المدرسة</label>
              <input
                type="text"
                value={simSchoolId}
                onChange={e => setSimSchoolId(e.target.value)}
                className="w-full text-xs font-bold text-slate-850 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-black block">رقم الفرع</label>
              <input
                type="text"
                value={simBranchId}
                onChange={e => setSimBranchId(e.target.value)}
                className="w-full text-xs font-bold text-slate-850 dark:text-white dark:bg-slate-850 dark:border-slate-800 px-3 py-2 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSimulateNewError}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black py-2 px-5 flex items-center gap-1.5 cursor-pointer shadow transition-all duration-150"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تسجيل وتوليد استثناء مالي فوري</span>
          </button>
        </div>
      </div>

      {/* EXCEPTION LOGS MAIN TABLE LIST */}
      <div className="dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xs">
        
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-transparent dark:bg-slate-850 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500 font-bold">لا توجد أي سجلات أخطاء مطابقة لخيارات التصفية والبحث الحالية.</p>
            <p className="text-xs text-slate-400">يمكنك تعديل مدخلات التصفية أو توليد استثناء محاكى جديد للتجربة.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-transparent dark:bg-slate-850/60 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 text-[11px] font-black tracking-wider uppercase font-mono w-[100px]">ID الخطأ</th>
                  <th className="p-4 text-[11px] font-black tracking-wider">وقت الخطأ</th>
                  <th className="p-4 text-[11px] font-black tracking-wider">المستخدم والواجهة</th>
                  <th className="p-4 text-[11px] font-black tracking-wider">العملية والرسالة</th>
                  <th className="p-4 text-[11px] font-black tracking-wider">المدرسة والفرع</th>
                  <th className="p-4 text-[11px] font-black tracking-wider text-center w-[120px]">التحكم والـ Stack</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                {filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  
                  return (
                    <React.Fragment key={log.id}>
                      {/* Main Row */}
                      <tr className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors ${isExpanded ? 'bg-amber-50/20 dark:bg-amber-950/5' : ''}`}>
                        
                        {/* ID */}
                        <td className="p-4 font-mono text-xs font-black text-rose-600 dark:text-rose-400">
                          <span className="bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-150">
                            {log.id}
                          </span>
                        </td>

                        {/* Error Time */}
                        <td className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(log.errorTime).toLocaleString('ar-SA', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>

                        {/* User & Screen */}
                        <td className="p-4 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-black text-slate-850 dark:text-white">{log.userName}</span>
                          </div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded inline-block">
                            {log.screenName}
                          </div>
                        </td>

                        {/* Operation & Error Msg */}
                        <td className="p-4 space-y-1 max-w-[300px]">
                          <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            {log.operationName}
                          </div>
                          <div className="text-xs text-rose-650 dark:text-rose-400 font-bold line-clamp-2" title={log.errorMessage}>
                            {log.errorMessage}
                          </div>
                        </td>

                        {/* School & Branch */}
                        <td className="p-4 space-y-1">
                          <div className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              مدرسة: <span className="font-extrabold text-amber-600 dark:text-amber-400">{log.schoolId}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                              فرع: {log.branchId}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <span>{isExpanded ? 'إغلاق التفاصيل' : 'عرض الـ Stack'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                      </tr>

                      {/* Expanded Row for Stack Trace and metadata detail block */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-0 bg-slate-50/50 dark:bg-slate-900/40">
                            <div className="p-5 border-y border-slate-100 dark:border-slate-800/60 space-y-4">
                              
                              {/* Metadata Quick Review Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="dark:bg-slate-850 p-3 border border-slate-150 dark:border-slate-800 text-xs space-y-1">
                                  <span className="text-[10px] text-slate-400 font-bold block">موقع الخطأ (Screen View Context)</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{log.screenName}</span>
                                </div>
                                <div className="dark:bg-slate-850 p-3 border border-slate-150 dark:border-slate-800 text-xs space-y-1">
                                  <span className="text-[10px] text-slate-400 font-bold block">العملية المسببة للاستثناء (Root Cause Operation)</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{log.operationName}</span>
                                </div>
                                <div className="dark:bg-slate-850 p-3 border border-slate-150 dark:border-slate-800 text-xs space-y-1 flex items-center justify-between">
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 font-bold block">رسالة الاستثناء الكاملة (Exception Message)</span>
                                    <span className="font-bold text-rose-600 dark:text-rose-400">{log.errorMessage}</span>
                                  </div>
                                  <button
                                    onClick={() => handleCopyMessage(log.id, log.errorMessage)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg cursor-pointer"
                                    title="نسخ الرسالة"
                                  >
                                    {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              {/* Stack Trace block */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
                                    <Terminal className="w-4 h-4 text-rose-500" />
                                    <span>مخطط استدعاءات المطور والـ Stack Trace للخطأ:</span>
                                  </div>
                                  <button
                                    onClick={() => handleCopyStack(log.id, log.stackTrace)}
                                    className="text-[10px] font-black text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer dark:bg-slate-800 border border-slate-150 dark:border-slate-750 px-2.5 py-1 rounded-md"
                                  >
                                    {copiedStackId === log.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>تم نسخ الـ Stack Trace!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>نسخ كود الـ Stack Trace كامل</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <pre className="p-4 bg-slate-900 text-slate-100 dark:bg-black dark:text-slate-200 text-[11px] font-mono border border-slate-950 overflow-x-auto leading-relaxed text-left dir-ltr">
                                  <code>{log.stackTrace}</code>
                                </pre>
                              </div>

                              <div className="text-[10px] text-slate-400 font-semibold text-center italic">
                                تم توثيق هذا الخطأ من خلال نظام التدقيق البرمجي الآمن لمجموعة المدارس تحت الرقم الفريد: {log.id}
                              </div>

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
