import { Activity, AlertTriangle, CheckCircle, Clock, Cpu, Database, HardDrive, Play, RefreshCw, Server, ShieldCheck, Sliders, Trash2, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface SuperAdminHealthProps {
  schools: any[];
  branches: any[];
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function SuperAdminHealth({
  schools = [],
  branches = [],
  logAction,
  triggerNotification
}: SuperAdminHealthProps) {
  const [activeTab, setActiveTab] = useState<'realtime' | 'db_perf' | 'optimization'>('realtime');
  const [isVacuuming, setIsVacuuming] = useState(false);
  const [isFlushCache, setIsFlushCache] = useState(false);
  const [isScanningSec, setIsScanningSec] = useState(false);
  const [databaseHealth, setDatabaseHealth] = useState<{ responseMs: number; checkedAt: string | null; schemaStatus: 'ready' | 'migration_pending'; missingSchemaObjects: string[] } | null>(null);
  const [isLoadingDatabaseHealth, setIsLoadingDatabaseHealth] = useState(false);
  const [databaseHealthError, setDatabaseHealthError] = useState('');

  const refreshDatabaseHealth = async () => {
    setIsLoadingDatabaseHealth(true);
    setDatabaseHealthError('');
    try {
      const response = await authenticatedRequest('/api/admin/central/health');
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || payload?.health?.database !== 'reachable') {
        throw new Error(payload?.message || 'تعذر الوصول إلى PostgreSQL المركزي.');
      }
      setDatabaseHealth({
        responseMs: Number(payload.health.responseMs),
        checkedAt: payload.health.checkedAt || null,
        schemaStatus: payload.health.schemaStatus === 'ready' ? 'ready' : 'migration_pending',
        missingSchemaObjects: Array.isArray(payload.health.missingSchemaObjects) ? payload.health.missingSchemaObjects : [],
      });
    } catch (error) {
      setDatabaseHealth(null);
      setDatabaseHealthError(error instanceof Error ? error.message : 'تعذر الوصول إلى PostgreSQL المركزي.');
    } finally {
      setIsLoadingDatabaseHealth(false);
    }
  };

  useEffect(() => { void refreshDatabaseHealth(); }, []);

  // Recharts live telemetry series
  const historyData: any[] = [];

  const handleVacuum = () => {
    setIsVacuuming(false);
    triggerNotification('تنظيف قاعدة البيانات يحتاج مهمة خادم مركزية؛ لم يتم تنفيذ Vacuum محلي.', 'warning');
  };

  const handleFlushCache = () => {
    setIsFlushCache(false);
    triggerNotification('تنظيف الذاكرة المؤقتة يحتاج موصل Redis مركزي؛ لم يتم تنفيذ العملية.', 'warning');
  };

  const handleSecScan = () => {
    setIsScanningSec(false);
    triggerNotification('الفحص الأمني يحتاج تشغيلًا من خدمة مراقبة مركزية؛ لم تُعرض درجة أمان مصطنعة.', 'warning');
  };

  return (
    <div id="super-admin-health" className="space-y-6 text-right">
      
      {/* Sub tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('realtime')}
          className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'realtime' ? 'border-amber-500 text-white bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>المراقبة الحية ومؤشرات الأداء</span>
        </button>
        <button
          onClick={() => setActiveTab('db_perf')}
          className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'db_perf' ? 'border-amber-500 text-white bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4 text-amber-400" />
          <span>إحصاءات خوادم قواعد البيانات</span>
        </button>
        <button
          onClick={() => setActiveTab('optimization')}
          className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'optimization' ? 'border-amber-500 text-white bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>أدوات تحسين وصيانة السحابة</span>
        </button>
      </div>

      {/* Realtime Telemetry Dashboard */}
      {activeTab === 'realtime' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CPU Metric Card */}
            <div className="bg-slate-900 border border-slate-800 p-5 flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">معدل استهلاك المعالج (CPU)</span>
                <span className="text-lg font-black text-amber-400 mt-1.5 block">غير متحقق</span>
                <span className="text-[9px] text-slate-400 mt-1 block">موصل القياس المركزي غير متصل</span>
              </div>
              <div className="p-3.5 bg-slate-950 text-amber-400 border border-slate-800">
                <Cpu className="w-6 h-6" />
              </div>
            </div>

            {/* RAM Metric Card */}
            <div className="bg-slate-900 border border-slate-800 p-5 flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">معدل استهلاك الذاكرة العشوائية</span>
                <span className="text-lg font-black text-amber-400 mt-1.5 block">غير متحقق</span>
                <span className="text-[9px] text-slate-400 mt-1 block">لا توجد قراءة ذاكرة موثقة</span>
              </div>
              <div className="p-3.5 bg-slate-950 text-amber-400 border border-slate-800">
                <HardDrive className="w-6 h-6" />
              </div>
            </div>

            {/* Canonical database round-trip card */}
            <div className="bg-slate-900 border border-slate-800 p-5 flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">زمن استجابة PostgreSQL المركزي</span>
                <span className="text-lg font-black text-amber-400 mt-1.5 block">{databaseHealth ? `${databaseHealth.responseMs} ms` : 'غير متحقق'}</span>
                <span className="text-[9px] text-slate-400 mt-1 block">{databaseHealth?.checkedAt ? `آخر قياس: ${new Date(databaseHealth.checkedAt).toLocaleString('ar-EG')}` : databaseHealthError || 'قراءة اتصال مركزية فقط'}</span>
                {databaseHealth?.schemaStatus === 'migration_pending' && <span className="text-[9px] text-amber-300 mt-1 block">ترحيلات الإدارة المركزية غير مكتملة ({databaseHealth.missingSchemaObjects.length} كائن)</span>}
              </div>
              <button type="button" onClick={() => void refreshDatabaseHealth()} disabled={isLoadingDatabaseHealth} title="قياس اتصال PostgreSQL المركزي" className="p-3.5 bg-slate-950 text-emerald-400 border border-slate-800 disabled:opacity-45">
                <Database className={`w-6 h-6 ${isLoadingDatabaseHealth ? 'animate-spin' : ''}`} />
              </button>
            </div>

          </div>

          {/* Graphical Area Chart */}
          <div className="bg-slate-900 border border-slate-800 p-5 shadow-xl">
            <h3 className="text-xs font-black text-white mb-4 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
              مخطط الأحمال المباشر واستقرار الخادم الفيدرالي
            </h3>
            
            <div className="h-[260px] w-full text-slate-300 font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} />
                  <Area type="monotone" dataKey="cpu" stroke="#6366f1" fillOpacity={1} fill="url(#colorCpu)" name="جهد المعالج %" />
                  <Area type="monotone" dataKey="queries" stroke="#10b981" fillOpacity={1} fill="url(#colorQueries)" name="الاستعلامات/ث" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* DB Performance Health */}
      {activeTab === 'db_perf' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Active DB Nodes */}
          <div className="bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-black text-white border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              عقد وخوادم قواعد البيانات النشطة (Database Cluster)
            </h3>

            <div className="space-y-3">
              <div className={`border p-4 text-xs leading-relaxed ${databaseHealth ? 'border-emerald-900/40 bg-emerald-950/20 text-emerald-300' : 'border-amber-900/40 bg-slate-950 text-amber-400'}`}>
                {databaseHealth
                  ? `PostgreSQL المركزي قابل للوصول؛ زمن القياس ${databaseHealth.responseMs} ms. ${databaseHealth.schemaStatus === 'ready' ? 'مخطط الإدارة المركزية متحقق.' : `مخطط الإدارة المركزية يحتاج ترحيلات (${databaseHealth.missingSchemaObjects.length} كائن).`} لا تتوفر بعد بيانات العقد أو النسخ المقروءة من مزود قاعدة البيانات.`
                  : 'بيانات العقد والنسخ المقروءة غير متاحة من مزود قاعدة البيانات. لا يمكن إعلان عقدة رئيسية أو نسخة احتياطية نشطة دون جرد مركزي موثق.'}
              </div>
            </div>
          </div>

          {/* Connection Pool Telemetry */}
          <div className="bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-black text-white border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              أداء حزم الاتصال (Connection Pool Status)
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-slate-300">الاتصالات المستغلة (Active Connections)</span>
                  <span className="font-mono text-amber-400">غير متحقق</span>
                </div>
                <div className="text-[9px] text-slate-500 border border-dashed border-slate-700 rounded px-2 py-1 text-center">
                  لا توجد قراءة موثقة
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-slate-300">معدل الاستعلامات البطيئة (Slow Queries Rate)</span>
                  <span className="font-mono text-amber-400">غير متحقق</span>
                </div>
                <div className="text-[9px] text-slate-500 border border-dashed border-slate-700 rounded px-2 py-1 text-center">
                  لا توجد قراءة موثقة
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 text-[10px] text-slate-400 leading-relaxed border border-slate-850">
                لا توجد بيانات تشغيلية موثقة عن تجميد العمليات أو التنظيف الآلي. يلزم ربط موصل PostgreSQL قبل عرض هذه الحالة.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Optimizations tab */}
      {activeTab === 'optimization' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Database Vacuum card */}
          <div className="bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-md flex flex-col justify-between">
            <div className="space-y-2">
              <Database className="w-6 h-6 text-amber-400" />
              <h4 className="text-xs font-black text-white">تنظيف قاعدة البيانات Vacuum</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                تنظيف السجلات المحذوفة والمساحات المهدرة في جداول PostgreSQL وتحديث إحصاءات الاستعلام الذكية لتسريع التقارير.
              </p>
            </div>
            <button
              onClick={handleVacuum}
              disabled={isVacuuming}
              className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-amber-400 py-2 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVacuuming && 'animate-spin'}`} />
              <span>{isVacuuming ? 'جاري التنظيف...' : 'تنظيف وإعادة فهرسة ⚡'}</span>
            </button>
          </div>

          {/* Flush Cache card */}
          <div className="bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-md flex flex-col justify-between">
            <div className="space-y-2">
              <HardDrive className="w-6 h-6 text-amber-400" />
              <h4 className="text-xs font-black text-white">تصفية الكاش Redis Cache</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                إفراغ وتطهير مخازن الذاكرة المؤقتة لـ Redis لاسترداد أحدث بيانات التراخيص وصلاحيات الفروع مباشرة من خادم الحسابات الرئيسي.
              </p>
            </div>
            <button
              onClick={handleFlushCache}
              disabled={isFlushCache}
              className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-amber-400 py-2 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isFlushCache ? 'جاري التصفية...' : 'إفراغ ذاكرة الكاش 🧹'}</span>
            </button>
          </div>

          {/* Penetration scan card */}
          <div className="bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-md flex flex-col justify-between">
            <div className="space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xs font-black text-white">فحص الأمان والامتثال</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                طلب فحص لقواعد الجلسات والتشفير وعزل المستأجرين. لا تُعرض نتيجة نجاح إلا بعد تشغيل خدمة فحص مركزية موثقة.
              </p>
            </div>
            <button
              onClick={handleSecScan}
              disabled={isScanningSec}
              className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-emerald-400 py-2 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isScanningSec ? 'جاري الفحص...' : 'تشغيل فحص الامتثال الآمن 🛡️'}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
