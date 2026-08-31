import { AlertTriangle, CheckCircle, Download, Filter, Info, Lock as LockIcon, Printer, RefreshCw, Search, Server, ShieldAlert, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';
interface SuperAdminAuditProps {
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function SuperAdminAudit({
  logAction,
  triggerNotification
}: SuperAdminAuditProps) {

  // Audit evidence is read-only and comes from the canonical central audit API.
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadAudit = async () => {
      setIsLoading(true);
      try {
        const response = await authenticatedRequest('/api/admin/central/audit?limit=500');
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success || !Array.isArray(payload.logs)) throw new Error(payload?.message || 'تعذر تحميل سجل النشاط المركزي.');
        if (!mounted) return;
        setLogs(payload.logs.map((entry: any) => ({
          ...entry,
          level: ['denied', 'error', 'failure'].includes(entry.result) ? 'critical' : entry.result === 'partial' ? 'warning' : 'info',
          user: entry.actor_name || entry.actor_user_id || 'خدمة مركزية',
          details: entry.reason || `${entry.source || 'مصدر مركزي'} / ${entry.event_type || 'activity'}`,
          ip: entry.metadata?.ipAddress || 'غير متاح',
          timestamp: entry.created_at,
          section: entry.school_name || 'الإدارة المركزية',
        })));
      } catch (error) {
        if (mounted) triggerNotification(error instanceof Error ? error.message : 'تعذر تحميل سجل النشاط المركزي.', 'danger');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void loadAudit();
    return () => { mounted = false; };
  }, []);

  // State for filters
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  // Clear logs modal state
  const [showClearModal, setShowClearModal] = useState(false);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  // Clear all system audit logs (highly audited action itself)
  const handleConfirmClearLogs = (e: React.FormEvent) => {
    e.preventDefault();
    setShowClearModal(false);
    void logAction;
    triggerNotification('سجل التدقيق المركزي غير قابل للمحو من الواجهة؛ لم يتم حذف أي دليل.', 'warning');
  };

  // Export the currently loaded canonical evidence; this does not mutate it.
  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `edupro_compliance_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logAction('EXPORT_COMPLIANCE_LOGS', 'تصدير وتحميل حزمة ملفات التدقيق الأمني بصيغة JSON لغايات الامتثال', 'الأمان والرقابة');
    triggerNotification('تم تصدير دليل التدقيق المحمّل من المصدر المركزي 💾', 'success');
  };

  // Print logs template
  const handlePrintLogs = () => {
    window.print();
    logAction('PRINT_AUDIT_LOGS', 'طباعة كشف ومخرجات سجلات الرقابة ورقياً للجهات الرقابية', 'الأمان والرقابة');
  };

  // Filter logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.ip.toLowerCase().includes(search.toLowerCase());

    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesSection = sectionFilter === 'all' || log.section === sectionFilter;

    return matchesSearch && matchesLevel && matchesSection;
  });

  // Security Incident counters for upper metrics panel
  const criticalCount = logs.filter(l => l.level === 'critical').length;
  const warningCount = logs.filter(l => l.level === 'warning').length;

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-200" dir="rtl">
      
      {/* Upper Security Threat KPI dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block mb-1">إجمالي سجلات العمليات</span>
            <span className="text-xl font-mono font-black text-white">{isLoading ? '...' : logs.length}</span>
          </div>
          <div className="p-2 bg-amber-950/40 text-amber-400">
            <Server className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block mb-1">التهديدات والحوادث الحرجة</span>
            <span className="text-xl font-mono font-black text-rose-500">{isLoading ? '...' : criticalCount}</span>
          </div>
          <div className="p-2 bg-rose-950/40 text-rose-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block mb-1">مخالفات وسياسات معلقة</span>
            <span className="text-xl font-mono font-black text-amber-500">{isLoading ? '...' : warningCount}</span>
          </div>
          <div className="p-2 bg-amber-950/40 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block mb-1">حالة الجدار الناري الموحد (WAF)</span>
            <span className="text-xs font-black text-amber-400 bg-amber-950/40 border border-amber-900 px-2 py-0.5 rounded mt-1 inline-block">غير متحقق</span>
          </div>
          <div className="p-2 bg-emerald-950/40 text-emerald-400">
            <LockIcon className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Control Actions & Filters panel */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col lg:flex-row justify-between items-center gap-4 shadow-md">
        
        {/* Compliance Buttons */}
        <div className="flex gap-2 w-full lg:w-auto">
          <button
            onClick={handleExportLogs}
            className="flex-1 lg:flex-initial bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 font-extrabold text-xs px-3.5 py-2.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
          >
            <Download className="w-4 h-4" />
            <span>تصدير ملف الامتثال (JSON)</span>
          </button>

          <button
            onClick={handlePrintLogs}
            className="flex-1 lg:flex-initial bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-extrabold text-xs px-3.5 py-2.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة كشف الرقابة الموحد</span>
          </button>

          <button
            onClick={() => setShowClearModal(true)}
            className="bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/60 text-rose-400 font-extrabold text-xs px-3.5 py-2.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            title="سياسة الاحتفاظ بسجلات التدقيق"
          >
            <Trash2 className="w-4 h-4" />
            <span>سياسة عدم الحذف</span>
          </button>
        </div>

        {/* Dynamic Multi-Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:max-w-3xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          
          {/* Level filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">المستوى الأمني:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 px-2 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            >
              <option value="all">كل المستويات</option>
              <option value="info">معلومات اعتيادية (Info)</option>
              <option value="warning">تحذيرات (Warning)</option>
              <option value="critical">حوادث حرجة (Critical)</option>
            </select>
          </div>

          {/* Module Section filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">القسم / النظام:</span>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 px-2 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            >
              <option value="all">كل الأنظمة</option>
              <option value="الإدارة المركزية">الإدارة المركزية</option>
              <option value="الأمان والرقابة">الأمان والرقابة</option>
              <option value="شؤون الطلاب">شؤون الطلاب</option>
              <option value="الشؤون المالية">الشؤون المالية</option>
            </select>
          </div>

          {/* Federal search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute top-2.5 right-3" />
            <input
              type="text"
              placeholder="بحث في السجلات والعمليات وعناوين IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 pr-8 pl-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

        </div>

      </div>

      {/* Audit Log Ledger table view */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden print:print:border-black">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs print:hidden">
          <span className="font-black text-white">دفتر الرقابة والتدقيق الأمني العام والامتثال للأنظمة</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded text-slate-400 font-mono font-bold">
            العمليات المفلتَرة: {filteredLogs.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
              <tr>
                <th className="p-4 text-center w-8">#</th>
                <th className="p-4 w-12 text-center">المستوى</th>
                <th className="p-4">اسم الفاعل / الموظف</th>
                <th className="p-4">العملية المنفذة (Action)</th>
                <th className="p-4">التفاصيل الكاملة للحدث</th>
                <th className="p-4">النظام المستهدف</th>
                <th className="p-4 font-mono">عنوان IP للولوج</th>
                <th className="p-4">تاريخ ووقت العملية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <CheckCircle className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" />
                    <p className="font-bold text-slate-400">لا توجد سجلات تدقيق تطابق التصفية الحالية</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  
                  // Icon according to severity level
                  const levelIcon = 
                    log.level === 'critical' ? <ShieldAlert className="w-4 h-4 text-rose-400" /> :
                    log.level === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                    <Info className="w-4 h-4 text-amber-400" />;

                  return (
                    <tr key={log.id} className="hover:bg-slate-950/40 transition-colors border-r-2 border-r-transparent hover:border-r-amber-500">
                      
                      {/* Index */}
                      <td className="p-4 text-center text-slate-500 font-mono font-bold w-8">{idx + 1}</td>
                      
                      {/* Level icon */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center">
                          {levelIcon}
                        </div>
                      </td>

                      {/* User agent */}
                      <td className="p-4 font-bold text-white">
                        {log.user}
                      </td>

                      {/* Action label */}
                      <td className="p-4">
                        <span className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 border border-slate-850 rounded text-slate-400">
                          {log.action}
                        </span>
                      </td>

                      {/* Details text */}
                      <td className="p-4 text-slate-200 font-semibold leading-relaxed">
                        {log.details}
                      </td>

                      {/* Targeted Module */}
                      <td className="p-4">
                        <span className="text-[10px] text-amber-400 font-extrabold bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/30">
                          {log.section}
                        </span>
                      </td>

                      {/* IP address */}
                      <td className="p-4 font-mono text-slate-400 select-all" dir="ltr">
                        {log.ip}
                      </td>

                      {/* Exact time */}
                      <td className="p-4 font-medium text-slate-500">
                        {log.timestamp}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODALS
      ------------------------------------------------------------- */}

      {/* Modal A: Immutable audit policy */}
      {showClearModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-rose-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-950/30 border-b border-rose-900/40 p-5 flex justify-between items-center text-rose-400">
              <button onClick={() => setShowClearModal(false)} className="text-slate-400 hover:text-white bg-slate-950 p-1.5 rounded-lg border border-slate-850"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
                سياسة الاحتفاظ بسجل المراقبة
              </h3>
            </div>

            <form onSubmit={handleConfirmClearLogs} className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                سجل التدقيق المركزي غير قابل للمحو من الواجهة. تُدار مدد الاحتفاظ والحذف القانوني من سياسة خادم معتمدة وبصلاحية مستقلة، مع تسجيل كل إجراء.
              </p>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button 
                  type="submit" 
                  className="bg-slate-800 hover:bg-slate-700 text-white font-black px-5 py-2 rounded-xl"
                >
                  فهمت السياسة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
