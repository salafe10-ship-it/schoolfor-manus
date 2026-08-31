import { AlertTriangle, CheckCircle2, Clock, Database, Download, HardDrive, HelpCircle, Play, RefreshCw, Server, ShieldAlert, Sliders, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';
interface SuperAdminBackupsProps {
  schools: any[];
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function SuperAdminBackups({
  schools = [],
  logAction,
  triggerNotification
}: SuperAdminBackupsProps) {

  // لا تُعرض لقطات أو بصمات قبل اتصال موثق بخدمة النسخ المركزية.
  const backups: any[] = [];

  // Modal and wizard states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [showDrillModal, setShowDrillModal] = useState(false);

  // Active snapshot target
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);

  // New Backup manual state
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');
  const [backupNote, setBackupNote] = useState('');

  // Schedule automated backup state
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: '',
    retentionCount: '',
    destination: '',
    encryptKey: ''
  });

  // Integrity Check report state
  const [integrityReport, setIntegrityReport] = useState<any | null>(null);

  // Disaster Recovery Drill state
  const [drillState, setDrillState] = useState({
    status: 'idle', // idle, active, completed
    step: 0,
    logs: [] as string[]
  });

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  // إنشاء النسخة يتطلب مهمة خادم ومخزنًا مركزيًا موثقًا.
  const handleCreateBackup = (e: React.FormEvent) => {
    e.preventDefault();
    triggerNotification('لم يتم إنشاء النسخة: خدمة التخزين المركزية غير متصلة أو غير موثقة.', 'warning');
  };

  // Run integrity verification check
  const handleCheckIntegrity = (snapshot: any) => {
    void snapshot;
    triggerNotification('فحص سلامة النسخ يحتاج قراءة فعلية من مخزن مركزي؛ لم تُعرض نتيجة محاكاة.', 'warning');
  };

  // الاستعادة تتطلب مهمة خادم وموافقة مزدوجة.
  const handleRestoreBackup = () => {
    if (!selectedSnapshot) return;

    triggerNotification(`استعادة النسخة [${selectedSnapshot.createdAt}] تحتاج مهمة خادم مركزية وموافقة مزدوجة؛ لم يتم تغيير قاعدة البيانات.`, 'warning');
  };

  // Schedule configuration save
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    void scheduleConfig;
    triggerNotification('جدولة النسخ تحتاج موصل مهام خادم مركزي؛ لم يتم حفظ إعداد محلي.', 'warning');
  };

  // التنزيل يتطلب رابطًا موقّعًا قصير العمر.
  const handleDownloadBackup = (snapshot: any) => {
    void snapshot;
    triggerNotification('تنزيل النسخة يحتاج رابطًا موقّعًا يصدره مخزن مركزي؛ لم يتم توليد رابط وهمي.', 'warning');
  };

  // اختبار التعافي يتطلب بيئة احتياطية حقيقية ونافذة صيانة.
  const handleRunDrill = () => {
    triggerNotification('اختبار التعافي من الكوارث يحتاج بنية احتياطية حقيقية ونافذة صيانة معتمدة؛ لم تُعلن نتيجة محاكاة.', 'warning');
  };

  const resetDrillState = () => {
    setDrillState({ status: 'idle', step: 0, logs: [] });
  };

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-200" dir="rtl">
      
      {/* Search and Action Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Actions button */}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex-1 md:flex-initial bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 font-extrabold text-xs px-4 py-2.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
          >
            <Clock className="w-4 h-4" />
            <span>جدولة النسخ والتدوير السحابي</span>
          </button>

          <button
            onClick={() => setShowDrillModal(true)}
            className="flex-1 md:flex-initial bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900 text-rose-400 font-extrabold text-xs px-4 py-2.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>خطة التعافي من الكوارث</span>
          </button>
        </div>

        {/* Manual Instant Backup Wizard Form */}
        <form onSubmit={handleCreateBackup} className="flex flex-col sm:flex-row items-center gap-2 w-full md:max-w-xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="w-full sm:w-1/3 bg-slate-950 border border-slate-800 px-2.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-bold"
          >
            <option value="all">كل السحابة والمستأجرين</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>{s.schoolShortName}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="ملاحظة أو سبب النسخ اليدوي العاجل..."
            value={backupNote}
            required
            onChange={(e) => setBackupNote(e.target.value)}
            className="w-full sm:w-1/2 bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
          />

          <button
            type="submit"
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>طلب لقطة فورية</span>
          </button>
        </form>

      </div>

      {/* Snapshots Table List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="font-black text-white">سجل لقطات حفظ قواعد البيانات (Database Snapshots Directory)</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded text-slate-400 font-mono font-bold">
            العدد الإجمالي: {backups.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
              <tr>
                <th className="p-4 text-center w-8">#</th>
                <th className="p-4">اسم لقطة الحفظ / الملاحظة</th>
                <th className="p-4">المنشأة التعليمية المستهدفة</th>
                <th className="p-4 text-center">نوع النسخة</th>
                <th className="p-4 font-mono text-center">حجم الملف</th>
                <th className="p-4">التوقيع الرقمي (SHA256)</th>
                <th className="p-4">تاريخ ووقت النسخ</th>
                <th className="p-4 text-center w-52">العمليات والتعافي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {backups.map((snap, idx) => (
                <tr key={snap.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="p-4 text-center text-slate-500 font-mono font-bold w-8">{idx + 1}</td>
                  
                  {/* Name */}
                  <td className="p-4 font-extrabold text-white">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{snap.name}</span>
                    </div>
                  </td>

                  {/* School */}
                  <td className="p-4 font-bold text-slate-400">
                    {snap.schoolName}
                  </td>

                  {/* Type */}
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black inline-block ${
                      snap.type === 'scheduled' 
                        ? 'bg-amber-950 text-amber-400 border border-amber-900/40' 
                        : 'bg-amber-950 text-amber-400 border border-amber-900/40'
                    }`}>
                      {snap.type === 'scheduled' ? 'تلقائي مجدول' : 'يدوي طارئ'}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="p-4 text-center font-mono font-bold text-slate-300">
                    {snap.size}
                  </td>

                  {/* SHA Hash */}
                  <td className="p-4 font-mono text-[10px] text-slate-500 select-all">
                    {snap.hash}
                  </td>

                  {/* Time */}
                  <td className="p-4 text-slate-400">
                    {snap.createdAt}
                  </td>

                  {/* Operations */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      
                      {/* Check Integrity */}
                      <button
                        onClick={() => handleCheckIntegrity(snap)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 font-bold transition-all text-[10px] cursor-pointer"
                        title="فحص سلامة النسخة والمطابقة"
                      >
                        فحص السلامة
                      </button>

                      {/* Download */}
                      <button
                        onClick={() => handleDownloadBackup(snap)}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="توليد رابط تحميل آمن"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Restore */}
                      <button
                        onClick={() => {
                          setSelectedSnapshot(snap);
                          setShowRestoreModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-900/50 hover:bg-amber-950 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        title="استعادة قاعدة البيانات"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODALS & WIZARDS DECLARATIONS
      ------------------------------------------------------------- */}

      {/* Modal A: Schedule Config */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-slate-850 p-5 flex justify-between items-center">
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 bg-slate-900 p-1.5 rounded-lg border border-slate-800"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black text-white">إعداد وجدولة تدوير النسخ التلقائي</h3>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
              <div className="space-y-3">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1">دورية النسخ التلقائي المتكرر:</label>
                  <select
                    value={scheduleConfig.frequency}
                    onChange={(e) => setScheduleConfig({...scheduleConfig, frequency: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="" disabled>غير متحقق من إعداد مركزي</option>
                    <option value="hourly">كل ساعة (لقطات المعاملات المستمرة Transaction Logs)</option>
                    <option value="daily">كل يوم (النسخ الليلي العام)</option>
                    <option value="weekly">كل أسبوع (عزل أسبوعي تاريخي)</option>
                    <option value="monthly">شهرياً (شؤون الامتثال والتقارير الختامية)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1">عدد نسخ الحفظ التاريخية للاحتفاظ بها (Retention Count):</label>
                  <input
                    type="number"
                    value={scheduleConfig.retentionCount}
                    onChange={(e) => setScheduleConfig({...scheduleConfig, retentionCount: e.target.value})}
                    placeholder="غير متحقق"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-[9px] text-slate-500 block">لا يُحفظ أو يُطبّق هذا الإعداد قبل توفر موصل مهام مركزي.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1">مستودع التخزين السحابي المستهدف (Target S3 bucket):</label>
                  <select
                    value={scheduleConfig.destination}
                    onChange={(e) => setScheduleConfig({...scheduleConfig, destination: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="" disabled>غير متحقق من مخزن مركزي</option>
                    <option value="AWS S3 (Riyadh)">سحابة الرياض AWS Riyadh - bucket_primary_b2</option>
                    <option value="AWS S3 (Jeddah)">سحابة جدة AWS Jeddah - bucket_secondary_b3</option>
                    <option value="GCP Cloud Storage (Dhahran)">سحابة الظهران جوجل - bucket_gcp_me_central1</option>
                  </select>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400">إلغاء</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-2 rounded-xl">طلب اعتماد الجدولة ⚡</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal B: Safe Restore Backup with strict confirmation */}
      {showRestoreModal && selectedSnapshot && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-rose-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-950/30 border-b border-rose-900/40 p-5 flex justify-between items-center text-rose-400">
              <button onClick={() => setShowRestoreModal(false)} className="text-slate-400 hover:text-white bg-slate-950 p-1.5 rounded-lg border border-slate-850"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
                تحذير حرج: استعادة قاعدة البيانات
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                أنت على وشك استبدال وتجاوز قاعدة البيانات الحية الحالية لمستأجر المنشأة وإعادتها لنقطة الحفظ <strong className="text-white">[{selectedSnapshot.createdAt}]</strong>. سيؤدي هذا لمحو التغييرات اللاحقة المأسسة بعد هذا التاريخ للفرع.
              </p>

              <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-[10px] text-rose-300">
                ⚠️ يتطلب هذا الخيار تدوين وتخويل مدير النظام المركزي للتأكيد.
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowRestoreModal(false)} className="px-4 py-2 border border-slate-850 hover:bg-slate-800 text-slate-400">إلغاء الأمر</button>
                <button 
                  type="button" 
                  onClick={handleRestoreBackup}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-5 py-2 shadow-md"
                >
                  تأكيد واستعادة قاعدة البيانات 🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal C: Integrity Check Report view */}
      {showIntegrityModal && selectedSnapshot && integrityReport && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-slate-850 p-5 flex justify-between items-center">
              <button onClick={() => { setSelectedSnapshot(null); setShowIntegrityModal(false); }} className="text-slate-400 bg-slate-900 p-1.5 rounded-lg border border-slate-800"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                تقرير سلامة وفحص نسخة الحفظ
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">لقطة الحفظ المفحوصة:</span>
                <p className="text-xs font-bold text-white bg-slate-950 px-3.5 py-2.5 rounded-lg border border-slate-850">{selectedSnapshot.name}</p>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 space-y-1.5 text-left font-mono text-[10px] text-slate-300 h-40 overflow-y-auto select-text" dir="ltr">
                {integrityReport.logs.map((log: string, i: number) => (
                  <div key={i} className={log.includes('النتيجة الكلية:') ? 'text-emerald-400 font-black' : ''}>{log}</div>
                ))}
              </div>

              {integrityReport.status === 'success' && (
                <div className="grid grid-cols-3 gap-3 pt-2.5">
                  <div className="p-2 bg-slate-950/40 border border-slate-850 rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold block">مجموع التوقيع</span>
                    <p className="text-[10px] text-amber-400 font-mono font-bold mt-1">من تقرير المزود فقط</p>
                  </div>
                  <div className="p-2 bg-slate-950/40 border border-slate-850 rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold block">الجداول المفحوصة</span>
                    <p className="text-[10px] text-amber-400 font-mono font-bold mt-1">غير متحقق</p>
                  </div>
                  <div className="p-2 bg-slate-950/40 border border-slate-850 rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold block">نسبة الموثوقية</span>
                    <p className="text-[10px] text-amber-400 font-mono font-bold mt-1">غير متحقق</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => { setSelectedSnapshot(null); setShowIntegrityModal(false); }}
                  className="bg-slate-950 hover:bg-slate-800 text-white border border-slate-800 px-5 py-2 text-xs font-bold"
                >
                  إغلاق التقرير المرجعي
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal D: Disaster Recovery readiness */}
      {showDrillModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-rose-900 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-950/30 border-b border-rose-900/40 p-5 flex justify-between items-center text-rose-400">
              <button onClick={() => { resetDrillState(); setShowDrillModal(false); }} className="text-slate-400 hover:text-white bg-slate-950 p-1.5 rounded-lg border border-slate-850"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                جاهزية اختبار التعافي من كوارث انقطاع الخوادم
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                يتطلب اختبار التحويل موقعًا احتياطيًا موثقًا، وخطة تشغيل معتمدة، ونافذة صيانة، وقياسات RPO/RTO فعلية. لا توجد حاليًا بنية متصلة تسمح بتنفيذ الاختبار أو إعلان عدم فقدان البيانات.
              </p>

              {drillState.status !== 'idle' && (
                <div className="bg-slate-950 border border-slate-850 p-4 space-y-1.5 text-left font-mono text-[10px] text-rose-300 h-44 overflow-y-auto" dir="ltr">
                  {drillState.logs.map((log, i) => (
                    <div key={i} className={log.includes('النتيجة:') || log.includes('اكتمل') ? 'text-emerald-400 font-black' : ''}>{log}</div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => { resetDrillState(); setShowDrillModal(false); }} 
                  disabled={drillState.status === 'active'}
                  className="px-4 py-2 border border-slate-850 hover:bg-slate-800 text-slate-400"
                >
                  إغلاق النافذة
                </button>
                
                {drillState.status === 'idle' ? (
                  <button 
                    type="button" 
                    onClick={handleRunDrill}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-black px-6 py-2 shadow-md"
                  >
                    طلب اختبار التعافي
                  </button>
                ) : drillState.status === 'completed' ? (
                  <div className="bg-emerald-950 text-emerald-400 border border-emerald-900/60 px-3 py-2 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>لا تُعتمد النتيجة إلا من سجل اختبار مركزي موثق</span>
                  </div>
                ) : (
                  <div className="bg-slate-950 text-slate-400 border border-slate-850 px-4 py-2 font-mono flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                    <span>بانتظار موصل التعافي المركزي...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
