import { AlertTriangle, Ban, CheckCircle, Clock, FileText, HelpCircle, Key, Play, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import React, { useState } from 'react';
interface SuperAdminImpersonationProps {
  schools: any[];
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
  setSelectedSchool: (school: any) => void;
  setCurrentRole: (role: any) => void;
  setIsSuperAdminPortalActive: (v: boolean) => void;
  setCurrentPortal?: (portal: any) => void;
}

export default function SuperAdminImpersonation({
  schools = [],
  logAction,
  triggerNotification,
  setSelectedSchool,
  setCurrentRole,
  setIsSuperAdminPortalActive,
  setCurrentPortal
}: SuperAdminImpersonationProps) {
  const [targetSchoolId, setTargetSchoolId] = useState('');
  const [reason, setReason] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState('30');

  // Impersonation Log History
  const [logs, setLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('edupro_impersonation_logs_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const handleStartImpersonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSchoolId || !reason || !agreedToTerms) {
      triggerNotification('يرجى اختيار المدرسة وتوضيح سبب الولوج الفني الفيدرالي', 'warning');
      return;
    }

    const school = schools.find(s => s.id === targetSchoolId);
    if (!school) return;

    triggerNotification('خدمة الولوج الآمن المركزية غير متاحة؛ لم تبدأ جلسة محاكاة ولم يُسجل نجاح.', 'warning');
    return;

    // Log the secure impersonation action
    const newLog = {
      id: `imp_${Date.now()}`,
      adminName: 'سليمان بن غازي (SuperAdmin)',
      schoolName: school.name,
      reason: reason,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      duration: `${durationMinutes} دقيقة`,
      status: 'active'
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('edupro_impersonation_logs_v1', JSON.stringify(updatedLogs));

    // Save impersonation session state for global UI warning banner
    localStorage.setItem('impersonating_school_id', school.id);
    localStorage.setItem('impersonation_school_name', school.name);
    localStorage.setItem('impersonation_reason', reason);
    localStorage.setItem('impersonation_active', 'true');

    logAction(
      'IMPERSONATE_SESSION_START',
      `ولوج ومحاكاة دخول الدعم الفني لمدرسة ${school.name}. السبب: ${reason}`,
      'المحاكاة والولوج الآمن'
    );

    triggerNotification(`تم بنجاح محاكاة الدخول الفني لـ ${school.name} 🚀 أنت في وضع الدعم المباشر الآن.`, 'success');

    // Switch view context in App.tsx
    setSelectedSchool(school);
    setCurrentRole('SchoolAdmin'); // Act as school administrator
    setIsSuperAdminPortalActive(false); // Hide central portal
    if (setCurrentPortal) setCurrentPortal('school');
  };

  return (
    <div id="super-admin-impersonation" className="space-y-6 text-right">
      
      {/* Impersonation Warnings & Security Rules */}
      <div className="bg-slate-900 border border-rose-500/20 p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-slate-100">تحذير أمني صارم: محاكاة دخول الكوادر الفنية</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            يُحظر استخدام ميزة المحاكاة (Impersonation) إلا في حالات الدعم الفني الحقيقية المصدق عليها من المدارس المستضيفة. كافة العمليات، وحركات السجلات المباشرة، وحذف المرفقات التي تقوم بها أثناء الولوج سيتم تسجيلها وحفظها بالكامل تحت هويتك الحقيقية لغايات الامتثال والأمان القانوني.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Wizard Form Side */}
        <form onSubmit={handleStartImpersonation} className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h3 className="text-xs font-black text-white flex items-center gap-1.5 pb-2 border-b border-slate-800">
            <Key className="w-4 h-4 text-rose-500" />
            بدء جلسة ولوج دعم فني مباشر
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">اختر مدرسة المستأجر المستهدفة</label>
              <select
                required
                value={targetSchoolId}
                onChange={(e) => setTargetSchoolId(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-rose-500"
              >
                <option value="">تحديد مدرسة لولوج خوادمها ...</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.subdomain})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">السبب الصريح لطلب ولوج الدعم الفني</label>
              <textarea
                required
                rows={3}
                placeholder="توضيح المشكلة الفنية، كود التذكرة الداعمة أو رقم تذكرة Jira لمتابعة تدقيق الاستخدام..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">فترة سماح الولوج (جلسة تلقائية الموت)</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-rose-500"
              >
                <option value="15">15 دقيقة (فحص سريع)</option>
                <option value="30">30 دقيقة (جلسة صيانة معتدلة)</option>
                <option value="60">ساعة كاملة (استكشاف أخطاء معقدة)</option>
                <option value="120">ساعتين (إعادة ترحيل البيانات الكبرى)</option>
              </select>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms_agree"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5"
              />
              <label htmlFor="terms_agree" className="text-[9px] text-slate-400 select-none leading-relaxed">
                أوافق وأؤكد أنني سأتحمل المسؤولية القانونية الكاملة عن كافة الإجراءات والعمليات وتعديل الحسابات التي ستجرى خلال هذه المحاكاة الفنية.
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={!agreedToTerms || !targetSchoolId || !reason}
            className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-40 text-white text-xs font-black py-3 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <Play className="w-4 h-4" />
            بدء محاكاة ولوج مستأجر المدرسة 🚀
          </button>
        </form>

        {/* History Audit Side */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
            <h3 className="text-xs font-black text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-rose-500" />
              سجل تراخيص وتدقيق عمليات الدعم والمحاكاة
            </h3>
            <span className="text-[9px] bg-rose-950/40 text-rose-400 border border-rose-900 px-2 py-0.5 rounded">
              أمان البيانات التام
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px]">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3 font-black text-center w-8">#</th>
                  <th className="p-3 font-black">اسم المسؤول</th>
                  <th className="p-3 font-black">المدرسة المستهدفة</th>
                  <th className="p-3 font-black">سبب الجلسة</th>
                  <th className="p-3 font-black">التاريخ والوقت</th>
                  <th className="p-3 font-black">المدة</th>
                  <th className="p-3 font-black">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-slate-850/40 transition-colors text-[11px]">
                    <td className="p-3 text-center text-slate-500 font-mono font-bold w-8">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-200">
                      {log.adminName}
                    </td>
                    <td className="p-3 text-slate-300 font-semibold">
                      {log.schoolName}
                    </td>
                    <td className="p-3 text-slate-400 leading-relaxed max-w-[200px] truncate" title={log.reason}>
                      {log.reason}
                    </td>
                    <td className="p-3 font-mono text-slate-500">
                      {log.date}
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {log.duration}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border ${
                        log.status === 'active' 
                          ? 'bg-rose-950/40 text-rose-400 border-rose-900 animate-pulse' 
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}>
                        {log.status === 'active' ? 'نشطة الآن' : 'مكتملة ومؤرشفة'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
