import { AlertTriangle, CheckCircle, Download, Filter, Info, Lock as LockIcon, Printer, RefreshCw, Search, Server, ShieldAlert, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
interface SuperAdminAuditProps {
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function SuperAdminAudit({
  logAction,
  triggerNotification
}: SuperAdminAuditProps) {

  // Load audit logs from localStorage if they exist, otherwise generate realistic defaults
  const [logs, setLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('edupro_central_system_logs_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fall back
      }
    }
    
    // Default audit records
    return [
      { id: 'log_01', level: 'info', user: 'مدير المنصة العام', action: 'CREATE_TENANT', details: 'تأسيس وترخيص مدرسة النور الأكاديمية بنجاح على خادم جدة', section: 'الإدارة المركزية', ip: '192.168.1.15', timestamp: '2026-06-26 14:10' },
      { id: 'log_02', level: 'warning', user: 'المحاسب المالي (النور)', action: 'LEDGER_MODIFIED', details: 'تعديل يدوي في كشوفات القيود الصباحية للرسوم', section: 'الشؤون المالية', ip: '192.168.12.80', timestamp: '2026-06-26 13:42' },
      { id: 'log_03', level: 'critical', user: 'بوابة تسجيل الطلاب', action: 'BRUTEFORCE_BLOCKED', details: 'رصد محاولات تخمين متكررة من عنوان IP خارجي وتم الحظر', section: 'الأمان والرقابة', ip: '185.220.101.44', timestamp: '2026-06-26 11:15' },
      { id: 'log_04', level: 'info', user: 'مقرر التسجيل والقبول', action: 'BATCH_STUDENT_IMPORT', details: 'استيراد جماعي لعدد ٢٤٠ ملف طالب جديد من نموذج اكسل الكلي', section: 'شؤون الطلاب', ip: '192.168.30.22', timestamp: '2026-06-25 10:05' },
      { id: 'log_05', level: 'critical', user: 'مجهول (نظام آلي)', action: 'UNAUTHORIZED_API_ACCESS', details: 'طلب وصول برأس تالف لـ /api/admin/billing من توكن منتهي الصلاحية', section: 'الأمان والرقابة', ip: '93.115.95.201', timestamp: '2026-06-25 09:12' }
    ];
  });

  // State for filters
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  // Clear logs modal state
  const [showClearModal, setShowClearModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  // Save updated log bank
  const saveLogs = (updatedLogs: any[]) => {
    setLogs(updatedLogs);
    localStorage.setItem('edupro_central_system_logs_v1', JSON.stringify(updatedLogs));
  };

  // Clear all system audit logs (highly audited action itself)
  const handleConfirmClearLogs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword || adminPassword.trim().length < 4) {
      triggerNotification('يرجى إدخال رمز التأكيد المركزي المعتمد', 'danger');
      return;
    }

    // Keep only the new audit record indicating logs were wiped
    const wipedEntry = {
      id: `log_wipe_${Date.now()}`,
      level: 'critical',
      user: 'مدير المنصة العام',
      action: 'AUDIT_LOG_WIPED',
      details: 'تم إجراء مسح وتصفير كلي لسجلات التدقيق والرقابة وتطهير الذاكرة',
      section: 'الأمان والرقابة',
      ip: '127.0.0.1',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    saveLogs([wipedEntry]);
    setShowClearModal(false);
    setAdminPassword('');
    
    logAction('AUDIT_LOG_WIPED', 'تم إجراء تصفير كلي ومحو لسجلات التدقيق المعتمدة من لوحة الإدارة', 'الأمان والرقابة');
    triggerNotification('تم تصفير وإفراغ سجلات المراقبة والرقابة بنجاح 🗑️', 'warning');
  };

  // Export to JSON/CSV simulation
  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `edupro_compliance_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logAction('EXPORT_COMPLIANCE_LOGS', 'تصدير وتحميل حزمة ملفات التدقيق الأمني بصيغة JSON لغايات الامتثال', 'الأمان والرقابة');
    triggerNotification('تم تجهيز وتصدير ملف سجلات التدقيق بنجاح 💾', 'success');
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
            <span className="text-xl font-mono font-black text-white">{logs.length}</span>
          </div>
          <div className="p-2 bg-amber-950/40 text-amber-400">
            <Server className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block mb-1">التهديدات والحوادث الحرجة</span>
            <span className="text-xl font-mono font-black text-rose-500">{criticalCount}</span>
          </div>
          <div className="p-2 bg-rose-950/40 text-rose-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block mb-1">مخالفات وسياسات معلقة</span>
            <span className="text-xl font-mono font-black text-amber-500">{warningCount}</span>
          </div>
          <div className="p-2 bg-amber-950/40 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block mb-1">حالة الجدار الناري الموحد (WAF)</span>
            <span className="text-xs font-black text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 rounded mt-1 inline-block">حماية قصوى ON</span>
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
            title="تصفير ومحو سجلات التدقيق"
          >
            <Trash2 className="w-4 h-4" />
            <span>تصفير كلي للوج</span>
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

      {/* Modal A: Safe verification wipe logs */}
      {showClearModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-rose-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-950/30 border-b border-rose-900/40 p-5 flex justify-between items-center text-rose-400">
              <button onClick={() => setShowClearModal(false)} className="text-slate-400 hover:text-white bg-slate-950 p-1.5 rounded-lg border border-slate-850"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
                تحذير حرج للغاية: مسح دفتر المراقبة والرقابة
              </h3>
            </div>

            <form onSubmit={handleConfirmClearLogs} className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                مسح وحذف سجلات الرقابة هو إجراء حساس جداً وقد يخالف متطلبات الامتثال السحابي. بمجرد تأكيد الإجراء، لن يتمكن مدققي الحماية من تعقب الأحداث السابقة.
              </p>

              <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-[10px] text-rose-300">
                للمتابعة، أدخل كلمة المرور الخاصة بحساب الإدارة المركزية المعتمد لتأكيد الموثوقية الأمنية.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">رمز تأكيد الموثوقية الموحد:</label>
                <input
                  type="password"
                  required
                  placeholder="أدخل كلمة المرور هنا..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-lg px-3 py-2 text-xs text-white font-mono text-center"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowClearModal(false)} className="px-4 py-2 border border-slate-850 hover:bg-slate-800 text-slate-400">تراجع وإلغاء</button>
                <button 
                  type="submit" 
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black px-5 py-2 rounded-xl"
                >
                  تأكيد مسح وتطهير السجلات 🧹
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
