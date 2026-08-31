import { Activity, AlertCircle, AlertTriangle, CheckCircle, Clock, Cpu, Globe, HardDrive, HelpCircle, RefreshCw, Server, ShieldAlert, Terminal, UserCheck, Users } from 'lucide-react';
import React from 'react';
interface SuperAdminDashboardProps {
  schools?: any[];
  branches?: any[];
  employees?: any[];
  alerts?: any[];
  onDismissAlert?: (id: string) => void;
  onResolveAlert?: (id: string) => void;
  triggerNotification?: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
  logAction?: (action: string, details: string, section?: string) => void;
}

export default function SuperAdminDashboard({
  schools = [],
  branches = [],
  employees = [],
  alerts: propAlerts,
  onDismissAlert,
  onResolveAlert,
  triggerNotification
}: SuperAdminDashboardProps) {

  const alerts = propAlerts || [];

  // Alerts are actionable only when supplied by a canonical incident source.
  const handleDismiss = (id: string) => {
    void id; void onDismissAlert;
    if (triggerNotification) triggerNotification('لا يوجد مصدر حوادث مركزي موثق للحذف؛ لم يتم تغيير سجل التنبيهات.', 'warning');
  };

  // Handle resolve cleanly
  const handleResolve = (id: string) => {
    void id; void onResolveAlert;
    if (triggerNotification) triggerNotification('معالجة الحوادث تحتاج مسار Incident مركزي موثق؛ لم يتم تسجيل معالجة وهمية.', 'warning');
  };
  
  // لا تُنشأ سجلات تشغيل محلية؛ تُقرأ من سجل النظام المركزي.
  const logs: string[] = [];

  // Compute stats counters
  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => s.status === 'active').length;
  const suspendedSchools = schools.filter(s => s.status === 'suspended').length;
  const totalBranches = branches.length;
  const userCounts = schools
    .map(school => Number(school.usersCount))
    .filter(count => Number.isFinite(count) && count >= 0);
  const totalEmployees = userCounts.length ? userCounts.reduce((total, count) => total + count, 0) : employees.length;
  const studentCounts = schools
    .map(school => Number(school.studentCount))
    .filter(count => Number.isFinite(count) && count >= 0);
  const totalStudentsCount = studentCounts.reduce((total, count) => total + count, 0);

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl">
      
      {/* 1. TOP STATS CARDS GRID - BENTO LAYOUT */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Schools */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-4 shadow-md transition-all hover:border-[#d4af37] hover:shadow-lg sm:p-5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">إجمالي المدارس والمستأجرين</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1.5 font-mono">{totalSchools}</h3>
            </div>
            <div className="rounded-2xl bg-[#2a1a0e] p-2 text-amber-300 border border-[#d4af37]/30 group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex gap-2 text-[9px] font-bold text-slate-500">
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">نشطة: {activeSchools}</span>
            {suspendedSchools > 0 && (
              <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">موقوفة: {suspendedSchools}</span>
            )}
          </div>
        </div>

        {/* Card 2: Branches */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-4 shadow-md transition-all hover:border-[#d4af37] hover:shadow-lg sm:p-5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">إجمالي الفروع النشطة</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1.5 font-mono">{totalBranches}</h3>
            </div>
            <div className="rounded-2xl bg-[#2a1a0e] p-2 text-amber-300 border border-[#d4af37]/30 group-hover:scale-110 transition-transform">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-3 font-semibold">متوسط {Number(totalBranches / (totalSchools || 1)).toFixed(1)} فرع لكل مستأجر</p>
        </div>

        {/* Card 3: Users */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-4 shadow-md transition-all hover:border-[#d4af37] hover:shadow-lg sm:p-5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">الحسابات والكوادر الإدارية</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">{userCounts.length ? totalEmployees : 'غير متحقق'}</h3>
            </div>
            <div className="rounded-2xl bg-[#2a1a0e] p-2 text-emerald-300 border border-[#d4af37]/30 group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>المستخدمون المتصلون: غير متحقق</span>
          </div>
        </div>

        {/* Card 4: Students */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-4 shadow-md transition-all hover:border-[#d4af37] hover:shadow-lg sm:p-5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">إجمالي الطلاب المخدومين</p>
              <h3 className="text-xl font-black text-slate-900 mt-1.5 font-mono">{studentCounts.length ? totalStudentsCount.toLocaleString('ar-EG') : 'غير متحقق'}</h3>
            </div>
            <div className="rounded-2xl bg-[#2a1a0e] p-2 text-amber-300 border border-[#d4af37]/30 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-3 font-semibold">النمو الشهري: غير متحقق من مصدر تحليلات مركزي</p>
        </div>

      </div>

      {/* 2. DUAL LAYOUT: TELEMETRY & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Telemetry & Monitoring (2/3 width) */}
        <div className="rounded-3xl border-2 border-[#d4af37]/25 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-6 shadow-md space-y-6 lg:col-span-2">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-black text-slate-900">رقابة الأداء وحالة موارد المخدمات</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">تظهر القياسات فقط بعد ربط مصدر المراقبة المركزي الموثق</p>
            </div>
            <Activity className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CPU Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-300">استهلاك المعالجة المركزية Cluster CPU</span>
                <span className="font-mono text-amber-400 font-extrabold">غير متحقق</span>
              </div>
              <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-slate-700 rounded-full"
                  style={{ width: '0%' }}
                />
              </div>
              <p className="text-[9px] text-slate-500">القياس يحتاج موصل مراقبة مركزي موثق</p>
            </div>

            {/* RAM Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-300">استهلاك الذاكرة العشوائية Memory Allocation</span>
                <span className="font-mono text-amber-400 font-extrabold">غير متحقق</span>
              </div>
              <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-amber-500 transition-all duration-1000 rounded-full"
                  style={{ width: '0%' }}
                />
              </div>
              <p className="text-[9px] text-slate-500">لا توجد قراءة ذاكرة أو حالة كاش موثقة</p>
            </div>

            {/* Storage Metric */}
            <div className="bg-slate-950/60 p-4 border border-slate-850 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">مساحة التخزين المشتركة S3</span>
                <h5 className="text-md font-black text-slate-900 mt-1">غير متحقق</h5>
              </div>
              <div className="text-left font-mono text-[10px] text-slate-400 bg-slate-900 border border-slate-800 rounded px-2 py-1">
                السعة: غير متحقق
              </div>
            </div>

            {/* API Latency Metric */}
            <div className="bg-slate-950/60 p-4 border border-slate-850 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">متوسط زمن استجابة الـ API Gateway</span>
                <h5 className="text-md font-black text-slate-900 mt-1">غير متحقق</h5>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-900/60 rounded px-2.5 py-1">
                <span>غير متحقق</span>
              </div>
            </div>

          </div>

          {/* Database connections & background jobs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-3 bg-slate-950/30 border border-slate-850/70 text-center">
              <span className="text-[9px] text-slate-500 font-bold">اتصالات PostgreSQL</span>
              <p className="text-sm font-extrabold text-amber-400 mt-1 font-mono">غير متحقق</p>
            </div>
            <div className="p-3 bg-slate-950/30 border border-slate-850/70 text-center">
              <span className="text-[9px] text-slate-500 font-bold">مهام الطابور الجارية</span>
              <p className="text-sm font-extrabold text-amber-400 mt-1 font-mono">غير متحقق</p>
            </div>
            <div className="p-3 bg-slate-950/30 border border-slate-850/70 text-center">
              <span className="text-[9px] text-slate-500 font-bold">صحة نظام المزامنة</span>
              <p className="text-sm font-extrabold text-amber-400 mt-1">غير متحقق</p>
            </div>
            <div className="p-3 bg-slate-950/30 border border-slate-850/70 text-center">
              <span className="text-[9px] text-slate-500 font-bold">حالة الـ SSL</span>
              <p className="text-sm font-extrabold text-amber-400 mt-1">غير متحقق</p>
            </div>
          </div>

          {/* Scrolling live system log console */}
          <div className="bg-slate-950 border border-slate-850 p-4.5 space-y-3 shadow-inner">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                سجل تشغيل مركزي موثق (Canonical Operations Log)
              </span>
              <span className="text-slate-600 font-mono">المصدر: غير متصل</span>
            </div>
            <div className="space-y-1 text-left font-mono text-[10px] text-slate-300 h-36 overflow-y-auto select-text scrollbar-thin" dir="ltr">
              {logs.map((log, i) => (
                <div key={i} className={`p-0.5 leading-relaxed ${
                  log.includes('[SECURITY]') ? 'text-rose-400 bg-rose-950/20' :
                  log.includes('[REDIS]') || log.includes('[INIT]') ? 'text-amber-300' :
                  log.includes('[BACKUP]') ? 'text-emerald-300' : 'text-slate-300'
                }`}>
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Central Actionable Alerts & Incidents Center (1/3 width) */}
        <div className="rounded-3xl border-2 border-[#d4af37]/25 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  مركز الإنذارات العاجلة ({alerts.length})
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">الإنذارات الحرجة التي تتطلب رعاية إدارية فورية</p>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-900/60 flex items-center justify-center text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                        <h5 className="text-xs font-bold text-slate-900">لا توجد بيانات حوادث موثقة</h5>
                <p className="text-[10px] text-slate-500 leading-relaxed">لم يتم تحميل مصدر Incident مركزي، لذلك لا يمكن إعلان سلامة كل المدارس من هذه الشاشة.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-3.5 border text-right space-y-2.5 transition-all hover:scale-[1.01] ${
                      alert.severity === 'danger' 
                        ? 'bg-rose-950/20 border-rose-900/40' 
                        : alert.severity === 'warning'
                        ? 'bg-amber-950/20 border-amber-900/40'
                        : 'bg-amber-950/20 border-amber-900/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                        alert.severity === 'danger' 
                          ? 'text-rose-400 bg-rose-950/40 border-rose-900/30' 
                          : 'text-amber-400 bg-amber-950/40 border-amber-900/30'
                      }`}>
                        {alert.severity === 'danger' ? 'حرج جداً' : 'تنبيه هام'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">{alert.time}</span>
                    </div>

                    <div className="space-y-1">
                      <h5 className="text-xs font-black text-white">{alert.title}</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{alert.details}</p>
                    </div>

                    <div className="flex gap-2 justify-end pt-1.5 border-t border-slate-800/40 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleDismiss(alert.id)}
                        className="px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer font-bold"
                      >
                        تجاهل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        معالجة فورية
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[9px] text-slate-500 leading-relaxed text-right">
            تتم مراجعة ومعالجة كافة الأحداث الأمنية في غضون ٢٤ ساعة لضمان الامتثال لضوابط الهيئة الوطنية للأمن السيبراني NCA.
          </div>
        </div>

      </div>

    </div>
  );
}
