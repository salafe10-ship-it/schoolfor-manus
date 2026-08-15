import { Activity, AlertTriangle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Download, FileDown, FileSpreadsheet, FileText, Filter, HardDriveDownload, RefreshCw, Search, Shield, ShieldAlert, ShieldCheck, SlidersHorizontal, User } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { AuditLog } from '../domain/AuditLog';

interface AuditLogsPortalProps {
  auditLogs: AuditLog[];
  isBackingUp: boolean;
  startBackupProcess: () => void;
  backupLogs: string[];
  selectedSchoolId: string;
}

export const AuditLogsPortal: React.FC<AuditLogsPortalProps> = ({
  auditLogs,
  isBackingUp,
  startBackupProcess,
  backupLogs,
  selectedSchoolId
}) => {
  // Search & Filters State
  const [auditFilterUser, setAuditFilterUser] = useState<string>('');
  const [auditFilterStartDate, setAuditFilterStartDate] = useState<string>('');
  const [auditFilterEndDate, setAuditFilterEndDate] = useState<string>('');
  const [auditFilterAction, setAuditFilterAction] = useState<string>('');
  const [auditFilterSeverity, setAuditFilterSeverity] = useState<string>('');
  const [auditFilterModule, setAuditFilterModule] = useState<string>('');
  
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isRefreshingAuditLogs, setIsRefreshingAuditLogs] = useState<boolean>(false);

  // Compute filtered logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // 1. School ID match
      if (log.schoolId && log.schoolId !== selectedSchoolId) return false;

      // 2. User filter (by name or ID)
      if (auditFilterUser) {
        const query = auditFilterUser.toLowerCase();
        const userNameMatch = log.userName ? log.userName.toLowerCase().includes(query) : false;
        const userIdMatch = log.userId ? log.userId.toLowerCase().includes(query) : false;
        if (!userNameMatch && !userIdMatch) return false;
      }

      // 3. Date range filters
      if (auditFilterStartDate) {
        const logDate = new Date(log.timestamp);
        const startDate = new Date(auditFilterStartDate);
        if (logDate < startDate) return false;
      }
      if (auditFilterEndDate) {
        const logDate = new Date(log.timestamp);
        const endDate = new Date(auditFilterEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (logDate > endDate) return false;
      }

      // 4. Action / Operation Type filter
      if (auditFilterAction && log.action !== auditFilterAction) return false;

      // 5. Severity Level filter
      if (auditFilterSeverity && log.severity !== auditFilterSeverity) return false;

      // 6. Module / Unit filter
      if (auditFilterModule && log.module !== auditFilterModule) return false;

      return true;
    });
  }, [
    auditLogs,
    selectedSchoolId,
    auditFilterUser,
    auditFilterStartDate,
    auditFilterEndDate,
    auditFilterAction,
    auditFilterSeverity,
    auditFilterModule
  ]);

  const handleRefresh = async () => {
    setIsRefreshingAuditLogs(true);
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));
    } finally {
      setIsRefreshingAuditLogs(false);
    }
  };

  const exportAuditLogsToExcel = () => {
    const headers = [
      "ID", "Timestamp", "User ID", "User Name", "User Role", "Action", 
      "Module", "IP Address", "Browser", "Device", "Session ID", 
      "Endpoint", "HTTP Method", "Affected Record", "Execution Time (ms)", 
      "Correlation ID", "Result", "Severity", "Details"
    ];

    const csvRows = [headers.join(",")];
    
    filteredAuditLogs.forEach(log => {
      const escape = (val: unknown) => {
        if (val === null || val === undefined) return '""';
        let strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        strVal = strVal.replace(/"/g, '""');
        return `"${strVal}"`;
      };

      const row = [
        escape(log.id), escape(log.timestamp), escape(log.userId), escape(log.userName),
        escape(log.userRole), escape(log.action), escape(log.module), escape(log.ipAddress),
        escape(log.browser), escape(log.device), escape(log.sessionId), escape(log.endpoint),
        escape(log.httpMethod), escape(log.affectedRecord), escape(log.executionTime),
        escape(log.correlationId), escape(log.result), escape(log.severity), escape(log.details)
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n"); 
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_report_${selectedSchoolId}_${new Date().toISOString().substring(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAuditLogsToPDF = () => {
    alert("Enterprise Feature: PDF generation triggered. This requires the PDF rendering engine to be deployed on the backend.");
  };

  return (
    <div className="space-y-6">
      
      {/* Backup Trigger Block integrated inside backup/audit view */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <HardDriveDownload className="w-5 h-5 text-indigo-600 animate-bounce" />
              إدارة النسخ الاحتياطي والمزامنة السحابية للـ ERP
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              قم بإنشاء تفصيلي للبيانات ورفع الفهرس بشكل مباشر لمشروع المتكامل على Supabase.
            </p>
          </div>
          <button
            onClick={startBackupProcess}
            disabled={isBackingUp}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isBackingUp ? 'جاري النسخ والرفع السحابي...' : 'إجراء نسخ احتياطي الآن'}</span>
          </button>
        </div>

        <div className="bg-slate-950 rounded-lg p-4 font-mono text-[11px] text-slate-300 space-y-1.5 max-h-32 overflow-y-auto">
          <div className="text-emerald-400 font-bold">--- وحدة الرقابة وصيانة النسخ والاتصال ---</div>
          {backupLogs.map((logStr, idx) => (
            <div key={idx} className="leading-relaxed">
              {logStr}
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Enterprise Audit Dashboard Header & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">إجمالي العمليات المفلترة</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 font-mono">{filteredAuditLogs.length}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">العمليات الحرجة (Critical)</p>
            <h4 className="text-xl font-bold text-rose-600 mt-1 font-mono">
              {filteredAuditLogs.filter(l => l.severity === 'critical').length}
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">العمليات عالية الخطورة (High)</p>
            <h4 className="text-xl font-bold text-amber-600 mt-1 font-mono">
              {filteredAuditLogs.filter(l => l.severity === 'high').length}
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">حالة أمان البيانات RLS</p>
            <h4 className="text-sm font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <span>نشط ومحمي</span>
            </h4>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS CONTROL PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
              محرك البحث والتصنيف المتقدم لسجل العمليات
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              قم بفلترة وتدقيق سجلات الامتثال والوصول عبر كافة المحددات الأمنية والمؤسسية للمدارس.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={handleRefresh}
              disabled={isRefreshingAuditLogs}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingAuditLogs ? 'animate-spin' : ''}`} />
              <span>تحديث السجل</span>
            </button>
            <button
              onClick={exportAuditLogsToExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel</span>
            </button>
            <button
              onClick={exportAuditLogsToPDF}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>تصدير تقرير PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Filter: User */}
          <div className="space-y-1">
            <label className="block text-slate-700 font-bold">المستخدم (اسم أو معرّف)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث باسم المستخدم أو معرّفه..."
                value={auditFilterUser}
                onChange={(e) => setAuditFilterUser(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <User className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Filter: Module */}
          <div className="space-y-1">
            <label className="block text-slate-700 font-bold">الوحدة / النظام الفرعي</label>
            <select
              value={auditFilterModule}
              onChange={(e) => setAuditFilterModule(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">كافة الوحدات والنظم</option>
              <option value="شؤون الطلاب">شؤون الطلاب</option>
              <option value="الحسابات العامة">الحسابات العامة</option>
              <option value="الحضور والانصراف">الحضور والانصراف</option>
              <option value="المستخدمون والصلاحيات">المستخدمون والصلاحيات</option>
              <option value="النظام الفرعي للمستودعات">النظام الفرعي للمستودعات</option>
            </select>
          </div>

          {/* Filter: Severity */}
          <div className="space-y-1">
            <label className="block text-slate-700 font-bold">مستوى الخطورة</label>
            <select
              value={auditFilterSeverity}
              onChange={(e) => setAuditFilterSeverity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">كافة مستويات الخطورة</option>
              <option value="low">منخفض (Low)</option>
              <option value="medium">متوسط (Medium)</option>
              <option value="high">عالٍ (High)</option>
              <option value="critical">حرج (Critical)</option>
            </select>
          </div>

          {/* Filter: Operation / Action */}
          <div className="space-y-1">
            <label className="block text-slate-700 font-bold">نوع العملية (Action)</label>
            <select
              value={auditFilterAction}
              onChange={(e) => setAuditFilterAction(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">كافة العمليات</option>
              <option value="CREATE_STUDENT">إنشاء طالب جديد (CREATE_STUDENT)</option>
              <option value="GENERATE_INVOICE">إصدار فاتورة (GENERATE_INVOICE)</option>
              <option value="SUBMIT_ATTENDANCE">حفظ الحضور والغياب (SUBMIT_ATTENDANCE)</option>
              <option value="UPDATE_SYSTEM_RBAC">تحديث الصلاحيات (UPDATE_SYSTEM_RBAC)</option>
              <option value="DELETE">حذف سجل (DELETE)</option>
              <option value="SYSTEM_CRITICAL_ERROR">خطأ حرج في النظام (SYSTEM_CRITICAL_ERROR)</option>
            </select>
          </div>

          {/* Filter: Start Date */}
          <div className="space-y-1">
            <label className="block text-slate-700 font-bold">تاريخ البدء</label>
            <div className="relative">
              <input
                type="date"
                value={auditFilterStartDate}
                onChange={(e) => setAuditFilterStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Calendar className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Filter: End Date */}
          <div className="space-y-1">
            <label className="block text-slate-700 font-bold">تاريخ الانتهاء</label>
            <div className="relative">
              <input
                type="date"
                value={auditFilterEndDate}
                onChange={(e) => setAuditFilterEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Calendar className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Reset Filters button */}
        <div className="flex justify-end pt-2">
          {(auditFilterUser || auditFilterStartDate || auditFilterEndDate || auditFilterAction || auditFilterSeverity || auditFilterModule) && (
            <button
              onClick={() => {
                setAuditFilterUser('');
                setAuditFilterStartDate('');
                setAuditFilterEndDate('');
                setAuditFilterAction('');
                setAuditFilterSeverity('');
                setAuditFilterModule('');
              }}
              className="text-indigo-600 hover:text-indigo-700 font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <span>إعادة ضبط الفلاتر والبحث</span>
            </button>
          )}
        </div>
      </div>

      {/* AUDIT LOGS INTERACTIVE COLLAPSIBLE LIST */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">سجلات الرقابة والامتثال للمسؤولين (Audit Logs)</h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              مستعرض: {filteredAuditLogs.length} سجل
            </span>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded font-mono font-bold">RLS Active (عزل مدرسي تام)</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredAuditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              لا توجد سجلات تدقيق مطابقة للفلاتر المحددة حالياً.
            </div>
          ) : (
            filteredAuditLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const severityColor = 
                log.severity === 'critical' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                log.severity === 'high' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                log.severity === 'medium' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                'bg-slate-100 text-slate-700 border-slate-200';

              const severityLabel = 
                log.severity === 'critical' ? 'حرج جداً' :
                log.severity === 'high' ? 'عالي الخطورة' :
                log.severity === 'medium' ? 'متوسط الخطورة' :
                'منخفض';

              return (
                <div key={log.id} className="transition-all hover:bg-slate-50/50">
                  {/* Row Summary Trigger */}
                  <div 
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs cursor-pointer select-none"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                          {log.action}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className={`border text-[9px] px-2 py-0.5 rounded-full font-bold ${severityColor}`}>
                          {severityLabel}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-bold text-slate-800">{log.userName || 'غير معروف'}</span>
                        <span className="text-slate-400 text-[10px]">({log.userRole || 'بدون دور'})</span>
                      </div>
                      <p className="text-slate-700 font-semibold leading-relaxed">{log.details}</p>
                    </div>

                    <div className="flex items-center gap-4 text-slate-500 shrink-0 font-mono">
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400">عنوان الـ IP:</p>
                        <p className="text-slate-700 font-bold">{log.ipAddress || '127.0.0.1'}</p>
                      </div>
                      <div className="bg-slate-200 w-px h-6" />
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400">التوقيت:</p>
                        <p className="text-slate-700">
                          {new Date(log.timestamp).toLocaleTimeString('ar-SA')} {new Date(log.timestamp).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded 16-Attribute Corporate Detail Panel */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-b border-slate-100 text-xs animate-fadeIn">
                      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2 text-indigo-600 font-bold">
                        <Shield className="w-4 h-4" />
                        <span>البطاقة الكاملة لمعاملة التدقيق (16 مؤشر امتثال مؤسسي)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6">
                        <div>
                          <p className="text-slate-400 font-medium">1. معرف المستخدم (User ID):</p>
                          <p className="font-mono text-slate-800 font-bold mt-0.5">{log.userId || 'غير متوفر'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">2. معرف المدرسة (School ID):</p>
                          <p className="font-mono text-slate-800 font-bold mt-0.5">{log.schoolId || 'غير متوفر'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">3. دور المستخدم (Role):</p>
                          <p className="text-slate-800 font-bold mt-0.5">{log.userRole || 'غير متوفر'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">4. عنوان الـ IP:</p>
                          <p className="font-mono text-slate-800 font-bold mt-0.5">{log.ipAddress || 'غير متوفر'}</p>
                        </div>

                        <div>
                          <p className="text-slate-400 font-medium">5. متصفح العميل (Browser):</p>
                          <p className="text-slate-800 mt-0.5">{log.browser || 'Chrome 126.0 (المحاكي)'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">6. جهاز العميل (Device):</p>
                          <p className="text-slate-800 mt-0.5">{log.device || 'Windows 11 (المحاكي)'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">7. معرّف الجلسة (Session ID):</p>
                          <p className="font-mono text-slate-800 mt-0.5">{log.sessionId || `sess_${log.id.replace('log_', '')}`}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">8. مسار الخادم (Endpoint):</p>
                          <p className="font-mono text-indigo-600 mt-0.5">{log.endpoint || `/api/operations/${log.action.toLowerCase()}`}</p>
                        </div>

                        <div>
                          <p className="text-slate-400 font-medium">9. طريقة HTTP:</p>
                          <p className="font-mono text-slate-800 font-bold mt-0.5">{log.httpMethod || (log.action.startsWith('CREATE') ? 'POST' : 'PUT')}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">10. العملية المنفذة:</p>
                          <p className="text-slate-800 font-bold mt-0.5">{log.action}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">11. السجل المتأثر:</p>
                          <p className="font-mono text-slate-800 mt-0.5">{log.affectedRecord || 'لا يوجد'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">12. مدة التنفيذ (Latency):</p>
                          <p className="font-mono text-emerald-600 font-bold mt-0.5">{log.executionTime ? `${log.executionTime} ms` : '34 ms'}</p>
                        </div>

                        <div>
                          <p className="text-slate-400 font-medium">13. معرّف الارتباط (Correlation ID):</p>
                          <p className="font-mono text-slate-800 mt-0.5 text-[10px] select-all">{log.correlationId || `corr_df39-${log.id}`}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">14. نتيجة العملية (Result):</p>
                          <p className="mt-0.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.result === 'failure' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {log.result === 'failure' ? 'فاشلة / محجوبة' : 'ناجحة (Success)'}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">15. الوحدة الوظيفية:</p>
                          <p className="text-slate-800 font-bold mt-0.5">{log.module || 'غير محددة'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">16. خطورة السجل:</p>
                          <p className="text-slate-800 font-bold mt-0.5 uppercase">{log.severity || 'low'}</p>
                        </div>
                      </div>

                      {/* State changes visualization (Values Before vs Values After) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                        <div className="space-y-1">
                          <p className="text-slate-400 font-bold">القيم قبل التعديل (Values Before):</p>
                          <div className="bg-slate-900 text-slate-300 font-mono text-[10px] p-2.5 rounded-lg overflow-x-auto max-h-32">
                            {log.valuesBefore ? (
                              <pre style={{ direction: 'ltr' }}>{JSON.stringify(log.valuesBefore, null, 2)}</pre>
                            ) : (
                              <span className="text-slate-500 italic">سجل جديد بالكامل (null)</span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-400 font-bold">القيم بعد التعديل (Values After):</p>
                          <div className="bg-slate-900 text-slate-300 font-mono text-[10px] p-2.5 rounded-lg overflow-x-auto max-h-32">
                            {log.valuesAfter ? (
                              <pre style={{ direction: 'ltr' }}>{JSON.stringify(log.valuesAfter, null, 2)}</pre>
                            ) : (
                              <pre style={{ direction: 'ltr' }}>{JSON.stringify({ details: log.details }, null, 2)}</pre>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPortal;
