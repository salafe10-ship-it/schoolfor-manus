import { Activity, Archive, CheckCircle2, Printer, RotateCw, Server, Sliders, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import React, { useState } from 'react';
interface GovernancePerformanceProps {
  indexesApplied: boolean;
  setIndexesApplied: (val: boolean) => void;
  activeLogsCount: number;
  archivedLogsCount: number;
  readReplicasEnabled: boolean;
  setReadReplicasEnabled: (val: boolean) => void;
  replicaServerHealthy: boolean;
  setReplicaServerHealthy: (val: boolean) => void;
  redisCacheEnabled: boolean;
  setRedisCacheEnabled: (val: boolean) => void;
  cacheMemory: number;
  setCacheMemory: (val: number) => void;
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

export default function GovernancePerformance({
  indexesApplied,
  setIndexesApplied,
  activeLogsCount,
  archivedLogsCount,
  readReplicasEnabled,
  setReadReplicasEnabled,
  replicaServerHealthy,
  setReplicaServerHealthy,
  redisCacheEnabled,
  setRedisCacheEnabled,
  cacheMemory,
  setCacheMemory,
  triggerNotification
}: GovernancePerformanceProps) {

  // Internal states encapsulated within GovernancePerformance
  const [isIndexing, setIsIndexing] = useState<boolean>(false);
  const [indexingProgress, setIndexingProgress] = useState<number>(0);
  const [sampleQueryLatency, setSampleQueryLatency] = useState<{ before: number; after: number; improvement: number } | null>(
    indexesApplied ? { before: 180, after: 12, improvement: 93.3 } : null
  );

  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [archivingProgress, setArchivingProgress] = useState<number>(0);
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [archivedLogs, setArchivedLogs] = useState([
    { id: 'arch_1', action: 'قبول دفع رسوم', user: 'خالد مالي', details: 'سند رقم 1022 - 3,500 ريال', date: 'منذ شهرين' },
    { id: 'arch_2', action: 'تعديل هاتف طالب', user: 'أماني شؤون', details: 'تعديل هاتف الطالب تركي الحربي', date: 'منذ 3 أشهر' },
  ]);

  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupProgress, setBackupProgress] = useState<number>(0);
  const [backupFiles, setBackupFiles] = useState([
    { name: 'backup-full-v12.4.sql', size: '124 MB', date: 'الاستعادة الذكية قبل يومين', auto: true },
    { name: 'backup-ledger-closing.sql', size: '18 MB', date: 'اليوم صباحاً قبل الإغلاق', auto: false },
  ]);

  const [pitrMinutes, setPitrMinutes] = useState<number>(0);
  const [pitrRestoring, setPitrRestoring] = useState<boolean>(false);

  const handleApplyIndexes = () => {
    setIsIndexing(true);
    setIndexingProgress(0);
    const interval = setInterval(() => {
      setIndexingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsIndexing(false);
          setIndexesApplied(true);
          setSampleQueryLatency({ before: 180, after: 12, improvement: 93.3 });
          triggerNotification('تم رصد وتطبيق 7 فهارس مركبة بنجاح في قاعدة البيانات السحابية ⚡', 'success');
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleRunArchiving = () => {
    setIsArchiving(true);
    setArchivingProgress(0);
    const interval = setInterval(() => {
      setArchivingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsArchiving(false);
          triggerNotification('تم ترحيل وضغط سجل العمليات الأقدم من 90 يوم بنجاح للمخزن البارد!', 'success');
          setArchivedLogs(prevLogs => [
            { id: `arch_${Date.now()}`, action: 'تنظيف دوري للأرشيف', user: 'النظام السحابي', details: 'ضغط وأرشفة السجلات غير النشطة', date: 'الالآن' },
            ...prevLogs
          ]);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const handleFlushCache = () => {
    triggerNotification('تم مسح وإفراغ الذاكرة المؤقتة Redis لكافة الجداول والخيارات!', 'success');
    setCacheMemory(0.0);
    setTimeout(() => {
      setCacheMemory(14.2);
    }, 3000);
  };

  const handleBackupNow = () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    const interval = setInterval(() => {
      setBackupProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          setBackupFiles(prev => [
            { name: `backup-manual-${Date.now().toString().slice(-6)}.sql`, size: '42 MB', date: 'الآن', auto: false },
            ...prev
          ]);
          triggerNotification('تم إنشاء نسخة احتياطية كاملة وتشفيرها بنجاح!', 'success');
          return 100;
        }
        return p + 25;
      });
    }, 200);
  };

  const handleRestorePitr = () => {
    if (pitrMinutes <= 0) {
      triggerNotification('يرجى تحديد وقت صالح بالدقائق للعودة بالزمن!', 'warning');
      return;
    }
    setPitrRestoring(true);
    setTimeout(() => {
      setPitrRestoring(false);
      triggerNotification(`تمت العودة بالزمن بمعدل ${pitrMinutes} دقيقة واسترجاع كافة القيود والعمليات بدقة متناهية ✅`, 'success');
    }, 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right">
      {/* Quick Metrics for Enterprise Optimization */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">معدل الفهارس المركبة</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {indexesApplied ? '100% (مفعلة)' : '30% (موصى بالتحسين)'}
            </span>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">
              {indexesApplied ? '7/7 فهارس نشطة للإنتاج' : 'يوجد 7 فهارس مركبة مفقودة'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${indexesApplied ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'}`}>
            <Zap className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">سجل العمليات (Audit Logs)</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block font-mono">
              {activeLogsCount.toLocaleString('ar-EG')}
            </span>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">
              سجل نشط | مؤرشف: {archivedLogsCount.toLocaleString('ar-EG')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Archive className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">خوادم القراءة (Read Replicas)</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {readReplicasEnabled ? (replicaServerHealthy ? 'متصل (نشط)' : 'فشل مؤقت (توجيه للرئيسي)') : 'غير نشط'}
            </span>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">
              {readReplicasEnabled ? (replicaServerHealthy ? 'توجيه التقارير لخوادم القراءة' : 'توجيه الطوارئ للخادم الرئيسي') : 'معطل - تفعيل اختياري'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${readReplicasEnabled ? (replicaServerHealthy ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400') : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
            <Server className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">التخزين المؤقت Redis</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {redisCacheEnabled ? 'مفعّل' : 'معطّل'}
            </span>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">
              {redisCacheEnabled ? `استهلاك الذاكرة: ${cacheMemory} MB` : 'تفعيل اختياري للبيانات الثابتة'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${redisCacheEnabled ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
            <Activity className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Stage-by-Stage grid details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* STAGE 1: Compound Indexes Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between text-right">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="text-right">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-1 rounded-md uppercase">المرحلة الأولى</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2 flex items-center gap-1.5 justify-end">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>تحسين الفهارس المركبة (Compound Indexes)</span>
                </h3>
              </div>
              {indexesApplied && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>مطبق بالكامل</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 text-right">
              مراجعة الجداول الضخمة ومحاكاة إنشاء فهارس مركبة لتفادي عمليات البحث الكاملة (Full Table Scan) وتسريع استعلامات التقارير المحاسبية والطلابية بنسبة هائلة.
            </p>

            <div className="space-y-3 mb-6 text-right">
              <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs text-right">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">الفهارس المقترحة والبنية التحتية:</h4>
                <ul className="space-y-1 font-mono text-[10.5px] text-slate-500 dark:text-slate-400 list-disc list-inside text-right" dir="ltr">
                  <li><strong>students:</strong> (school_id, branch_id, academic_year)</li>
                  <li><strong>journal_entries:</strong> (school_id, cost_center_id, created_at)</li>
                  <li><strong>receipt_vouchers:</strong> (school_id, student_id, voucher_date)</li>
                </ul>
              </div>

              {sampleQueryLatency && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs flex justify-between items-center animate-fade-in">
                  <div className="text-right">
                    <span className="font-bold text-emerald-800 dark:text-emerald-400 block">زمن الاستعلام النموذجي:</span>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-500 mt-1 block">
                      {sampleQueryLatency.before}ms <span className="text-slate-400">←</span> {sampleQueryLatency.after}ms
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">نسبة التحسين</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">+{sampleQueryLatency.improvement}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            {isIndexing ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>جاري بناء الفهارس المركبة...</span>
                  <span>{indexingProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-150" style={{ width: `${indexingProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApplyIndexes}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>تطبيق الفهارس المركبة الآمنة ⚡</span>
                </button>
                
                {indexesApplied && (
                  <button
                    type="button"
                    onClick={() => {
                      setIndexesApplied(false);
                      triggerNotification('تم إلغاء الفهارس الافتراضية للعودة للحالة القياسية.', 'info');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-2.5 px-3 rounded-xl text-xs font-black transition-colors cursor-pointer"
                    title="إعادة التعيين"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* STAGE 2: Audit Log Archiving Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between text-right">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="text-right">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-1 rounded-md uppercase">المرحلة الثانية</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2 flex items-center gap-1.5 justify-end">
                  <Archive className="w-5 h-5 text-blue-500" />
                  <span>أرشفة سجل العمليات التلقائي (Audit Logs Archiving)</span>
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              نقل سجلات النشاط والأحداث القديمة (التي تتجاوز مدتها المحددة) إلى جدول الأرشفة البارد. هذه العملية اختيارية ومستقلة تمامًا ولا تؤثر مطلقًا على أي قيود مالية أو أرصدة.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-right">
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 text-right">فترة الاحتفاظ بالنشاط النشط:</label>
                <select 
                  value={retentionDays} 
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  disabled={isArchiving}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold p-1.5 rounded-lg focus:outline-none text-slate-700 dark:text-slate-300 text-right"
                >
                  <option value={90}>90 يوم (قياسي وموصى به)</option>
                  <option value={180}>180 يوم</option>
                  <option value={365}>سنة كاملة</option>
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between text-right">
                <span className="text-[10px] font-black text-slate-400 block">إجمالي السجلات القابلة للأرشفة حالياً:</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1 block">
                  {Math.floor(activeLogsCount * 0.65).toLocaleString('ar-EG')} سجل (<span className="text-[10px] text-blue-500 font-bold">أكبر من {retentionDays} يوم</span>)
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850/50 border border-slate-150 dark:border-slate-800 p-3 rounded-2xl mb-6">
              <input 
                type="text"
                placeholder="ابحث بالعملية، المدرسة أو المستخدم..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs focus:outline-none text-right"
              />
              <div className="mt-2 space-y-1 max-h-16 overflow-y-auto">
                {archivedLogs.filter(l => l.action.includes(archiveSearch) || l.user.includes(archiveSearch)).map((log) => (
                  <div key={log.id} className="text-[10px] p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex justify-between items-center text-right">
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{log.action}</span>
                      <span className="text-slate-500 mr-2">{log.details}</span>
                    </div>
                    <span className="text-slate-400">{log.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {isArchiving ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>جاري ترحيل السجلات إلى الأرشيف...</span>
                  <span>{archivingProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-150" style={{ width: `${archivingProgress}%` }} />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRunArchiving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                <span>ترحيل وأرشفة السجلات الآن 📦</span>
              </button>
            )}
          </div>
        </div>

        {/* STAGE 3: Read Replicas Router Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between text-right">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="text-right">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-1 rounded-md uppercase">المرحلة الثالثة</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2 flex items-center gap-1.5 justify-end">
                  <Server className="w-5 h-5 text-sky-500" />
                  <span>بنية خوادم القراءة المنفصلة (Read Replicas)</span>
                </h3>
              </div>
              
              <button 
                onClick={() => {
                  setReadReplicasEnabled(!readReplicasEnabled);
                  triggerNotification(readReplicasEnabled ? 'تم تعطيل خوادم القراءة المنفصلة.' : 'تم تمكين توجيه خوادم القراءة المنفصلة للتقارير والتحليلات!', 'info');
                }}
                className="cursor-pointer text-indigo-600 hover:scale-105 transition-transform"
              >
                {readReplicasEnabled ? (
                  <ToggleRight className="w-12 h-8 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-12 h-8 text-slate-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              توجيه استعلامات التقارير والتحليلات الضخمة تلقائياً إلى خوادم قراءة فرعية (ReadOnly Replicas) لتخفيف الضغط عن خادم الكتابة الرئيسي. في حال تعذر الاتصال بخادم القراءة، يرتد النظام تلقائياً للرئيسي.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">الخادم الرئيسي:</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 block">Primary Main</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">خادم القراءة الفرعي:</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 block">Read Replica 1</span>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${readReplicasEnabled ? (replicaServerHealthy ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse') : 'bg-slate-300'}`} />
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              disabled={!readReplicasEnabled}
              onClick={() => {
                setReplicaServerHealthy(!replicaServerHealthy);
                triggerNotification(replicaServerHealthy ? 'محاكاة فشل خادم القراءة بنجاح. تم تحويل الترافيك تلقائياً للخادم الأساسي.' : 'استعادة خادم القراءة بالكامل.', 'warning');
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${readReplicasEnabled ? (replicaServerHealthy ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200') : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}`}
            >
              <Sliders className="w-4 h-4" />
              <span>{replicaServerHealthy ? 'محاكاة فشل خادم القراءة (اختبار التوجيه التلقائي)' : 'استعادة خادم القراءة'}</span>
            </button>
          </div>
        </div>

        {/* STAGE 4: Distributed Caching Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between text-right">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="text-right">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-1 rounded-md uppercase">المرحلة الرابعة</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2 flex items-center gap-1.5 justify-end">
                  <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>التخزين المؤقت الموزع (Distributed Caching)</span>
                </h3>
              </div>

              <button 
                onClick={() => {
                  setRedisCacheEnabled(!redisCacheEnabled);
                  setCacheMemory(redisCacheEnabled ? 0 : 14.2);
                  triggerNotification(redisCacheEnabled ? 'تم تعطيل التخزين المؤقت.' : 'تم تفعيل الذاكرة المؤقتة Redis للبيانات الثابتة!', 'info');
                }}
                className="cursor-pointer text-indigo-600 hover:scale-105 transition-transform"
              >
                {redisCacheEnabled ? (
                  <ToggleRight className="w-12 h-8 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-12 h-8 text-slate-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              تخزين إعدادات المدارس، الصلاحيات، والبيانات المرجعية في ذاكرة Redis فائقة السرعة لتفادي استهلاك الخادم، مع استثناء العمليات المالية الحية لضمان تطابق ودقة الميزانيات والقيود المحاسبية.
            </p>

            <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs mb-4 text-right">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">حالة المفاتيح في الذاكرة:</h4>
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-150 dark:border-slate-850 flex justify-between text-right">
                  <span className="text-emerald-600 font-bold">نشط ✅</span>
                  <span className="font-mono text-slate-500">school_settings</span>
                </div>
                <div className="bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-150 dark:border-slate-850 flex justify-between text-right">
                  <span className="text-emerald-600 font-bold">نشط ✅</span>
                  <span className="font-mono text-slate-500">user_permissions</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              disabled={!redisCacheEnabled || cacheMemory === 0}
              onClick={handleFlushCache}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${redisCacheEnabled && cacheMemory > 0 ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}`}
            >
              <RotateCw className="w-4 h-4" />
              <span>إفراغ الذاكرة المؤقتة (Flush Redis Cache Keys) 🧹</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced PITR & Backup Sandbox Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Backup Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs text-right">
          <div className="flex justify-between items-start mb-4">
            <div className="text-right">
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-1 rounded-md uppercase">أمن قاعدة البيانات</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-2 flex items-center gap-1.5 justify-end">
                <Server className="w-5 h-5 text-indigo-500" />
                <span>النسخ الاحتياطي التلقائي (Hot Backups)</span>
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            تأمين لقطة كاملة من قاعدة البيانات حية بدون تعطيل الخدمة. يوصى بها عند ترقية الوحدات الهيكلية الرئيسية كالحسابات أو شؤون الطلاب.
          </p>

          <div className="space-y-3 mb-6">
            <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">اللقطات الاحتياطية المتوفرة:</h4>
              <div className="space-y-1.5">
                {backupFiles.map((file, idx) => (
                  <div key={idx} className="flex justify-between text-[10px] text-slate-500 bg-white dark:bg-slate-950 p-1.5 rounded-md border border-slate-150 dark:border-slate-850 font-mono">
                    <span>{file.size}</span>
                    <span>{file.name} ({file.date})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {isBackingUp ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>جاري النسخ الاحتياطي...</span>
                  <span>{backupProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-150" style={{ width: `${backupProgress}%` }} />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleBackupNow}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Server className="w-4 h-4" />
                <span>إجراء نسخ احتياطي فوري 💾</span>
              </button>
            )}
          </div>
        </div>

        {/* PITR Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs text-right">
          <div className="flex justify-between items-start mb-4">
            <div className="text-right">
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-1 rounded-md uppercase">العودة بالزمن</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-2 flex items-center gap-1.5 justify-end">
                <RotateCw className="w-5 h-5 text-indigo-500" />
                <span>الاستعادة لنقطة زمنية محددة (PITR)</span>
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            إرجاع قاعدة البيانات بالدقيقة والثانية لمعالجة أي كوارث بشرية أو برمجية على مستوى الداتا.
          </p>

          <div className="space-y-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs">
              <label className="text-[10px] font-black text-slate-400 block mb-2">تحديد عدد الدقائق للعودة بالزمن:</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="0" 
                  max="120"
                  value={pitrMinutes}
                  onChange={(e) => setPitrMinutes(Number(e.target.value))}
                  placeholder="مثال: 5"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-mono text-center"
                />
                <span className="text-xs font-bold flex items-center text-slate-600 dark:text-slate-400">دقيقة</span>
              </div>
            </div>
          </div>

          <div>
            {pitrRestoring ? (
              <div className="text-center text-xs font-bold text-slate-500 animate-pulse py-3">
                جاري مواءمة القيود والملفات للزمن المستهدف...
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRestorePitr}
                className="w-full bg-slate-900 hover:bg-slate-950 dark:bg-slate-800 dark:hover:bg-slate-750 text-white py-2.5 px-4 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>تنفيذ الاسترجاع PITR الآن 🕒</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Master Enterprise Summary Evaluation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs text-right">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
          <div className="text-right">
            <h3 className="text-base font-black text-slate-900 dark:text-white">التقرير التنفيذي الشامل للترقية السحابية والموثوقية</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
              تقييم جاهزية وكفاءة البنية التحتية بعد دمج تقنيات عزل المستأجرين والفهرسة وأرشفة البيانات المتراكمة
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-black px-3 py-2 rounded-xl border border-slate-200/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة وثيقة التحسين</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-right">
          <div className="bg-slate-50/50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-right">
            <span className="text-[10px] font-black text-slate-400 block uppercase">مستوى التحسن المتوقع في سرعة النظام</span>
            <span className="text-2xl font-black text-indigo-600 mt-2 block font-mono">
              {indexesApplied ? '+95.1%' : '+45.0% (مبدئي)'}
            </span>
            <p className="text-[10px] text-slate-500 mt-2 font-medium leading-normal">
              تحسن فوري في جلب بيانات ميزان المراجعة، الأستاذ العام وتصفية كشوفات الرسوم.
            </p>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-right">
            <span className="text-[10px] font-black text-slate-400 block uppercase">سلامة وتكامل البيانات المالية والطلابية</span>
            <span className="text-2xl font-black text-emerald-600 mt-2 block font-mono">
              100% (أمان تام)
            </span>
            <p className="text-[10px] text-slate-500 mt-2 font-medium leading-normal">
              تمت مراجعة جدران عزل البيانات لـ SaaS، مع حظر أرشفة أي بيانات مالية نشطة أو تداول قيود معلقة.
            </p>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-right">
            <span className="text-[10px] font-black text-slate-400 block uppercase">معدل الاستجابة لخادم قاعدة البيانات</span>
            <span className="text-2xl font-black text-sky-600 mt-2 block font-mono">
              {readReplicasEnabled ? '12ms (ممتاز للغاية)' : '48ms (عادي)'}
            </span>
            <p className="text-[10px] text-slate-500 mt-2 font-medium leading-normal">
              تخفيف العبء عن المعالجات الرئيسية بنسبة {readReplicasEnabled ? '45%' : '0%'} بفضل تفعيل قنوات القراءة الجانبية.
            </p>
          </div>
        </div>

        <div className="bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-5 text-right">
          <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-400 mb-2">توصيات المهندسين للمستقبل (Next-Gen Scaling Blueprint):</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-right">
            تطبيق هذه التحسينات على بيئة الإنتاج يمنح النظام مرونة لا متناهية لاستيعاب ما يصل إلى 5000 مدرسة متزامنة. يوصى بترحيل ترحيل سجلات العمليات الأقدم من سنة كاملة إلى Amazon S3 Glacier أو Google Cloud Cold Storage لتقليص نفقات الاستضافة مع الحفاظ على الامتثال لمعايير التدقيق المالي والإداري.
          </p>
        </div>
      </div>
    </div>
  );
}
