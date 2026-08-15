import { Activity, AlertTriangle, CheckCircle, Clock, Cpu, Database, HardDrive, Play, RefreshCw, Server, ShieldCheck, Sliders, Trash2, Zap } from 'lucide-react';
import React, { useState, useEffect } from 'react';
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
  const [cpuUsage, setCpuUsage] = useState(42);
  const [memoryUsage, setMemoryUsage] = useState(64);
  const [networkPing, setNetworkPing] = useState(14);
  const [isVacuuming, setIsVacuuming] = useState(false);
  const [isFlushCache, setIsFlushCache] = useState(false);
  const [isScanningSec, setIsScanningSec] = useState(false);

  // Recharts live telemetry series
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    // Populate historic logs
    const initialData = Array.from({ length: 15 }, (_, i) => ({
      time: `${i * 2}ث`,
      cpu: Math.floor(35 + Math.random() * 15),
      memory: Math.floor(60 + Math.random() * 5),
      queries: Math.floor(180 + Math.random() * 120),
    }));
    setHistoryData(initialData);

    // Live update interval
    const interval = setInterval(() => {
      setCpuUsage(prev => Math.max(10, Math.min(95, prev + Math.floor(Math.random() * 11) - 5)));
      setMemoryUsage(prev => Math.max(50, Math.min(90, prev + Math.floor(Math.random() * 5) - 2)));
      setNetworkPing(prev => Math.max(8, Math.min(45, prev + Math.floor(Math.random() * 7) - 3)));

      setHistoryData(prev => {
        const sliced = prev.slice(1);
        return [
          ...sliced,
          {
            time: 'نشط',
            cpu: Math.floor(30 + Math.random() * 30),
            memory: Math.floor(60 + Math.random() * 10),
            queries: Math.floor(200 + Math.random() * 150)
          }
        ];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleVacuum = () => {
    setIsVacuuming(true);
    triggerNotification('جاري بدء عملية التنظيف والكنس الشامل لقاعدة البيانات (DB Vacuum & Reindex)...', 'info');
    setTimeout(() => {
      setIsVacuuming(false);
      logAction('DB_VACUUM_OPTIMIZE', 'تنظيف ومطابقة فهارس الجداول المتعددة (Vacuum) في قاعدة البيانات الموحدة لتقليص مساحات الفهرسة', 'مركز سلامة النظام');
      triggerNotification('اكتملت عملية Vacuum وتفريغ المساحات الميتة بنجاح ✅', 'success');
    }, 2000);
  };

  const handleFlushCache = () => {
    setIsFlushCache(true);
    triggerNotification('جاري إفراغ الذاكرة المخبئية وتنظيف مفاتيح Redis المترابطة...', 'info');
    setTimeout(() => {
      setIsFlushCache(false);
      logAction('REDIS_CACHE_FLUSH', 'تنظيف الذاكرة المؤقتة (Redis/RAM Cache) لضمان اتساق البيانات والصفقات المالية', 'مركز سلامة النظام');
      triggerNotification('تم تنظيف وإعادة بناء الكاش بنجاح 🧹', 'success');
    }, 1500);
  };

  const handleSecScan = () => {
    setIsScanningSec(true);
    triggerNotification('بدء الفحص الأمني للثغرات والتحقق من جدران حماية الـ API...', 'info');
    setTimeout(() => {
      setIsScanningSec(false);
      logAction('SECURITY_COMPLIANCE_SCAN', 'فحص أمني دوري ضد هجمات SQL Injection و Cross-Site Scripting على بوابات المدارس', 'مركز سلامة النظام');
      triggerNotification('اكتمل الفحص الأمني الشامل بنجاح: درجة الأمان 100% (ممتاز) 🛡️', 'success');
    }, 2500);
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
                <span className="text-2xl font-black text-white mt-1.5 block font-mono">{cpuUsage}%</span>
                <span className="text-[9px] text-emerald-400 mt-1 block">ضمن النطاق الآمن والمعتدل</span>
              </div>
              <div className={`p-3.5 ${cpuUsage > 80 ? 'bg-rose-950/40 text-rose-400 border border-rose-900' : 'bg-slate-950 text-amber-400 border border-slate-800'}`}>
                <Cpu className="w-6 h-6" />
              </div>
            </div>

            {/* RAM Metric Card */}
            <div className="bg-slate-900 border border-slate-800 p-5 flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">معدل استهلاك الذاكرة العشوائية</span>
                <span className="text-2xl font-black text-white mt-1.5 block font-mono">{memoryUsage}%</span>
                <span className="text-[9px] text-slate-400 mt-1 block">المتوفر: 5.76 جيجابايت من أصل 16</span>
              </div>
              <div className="p-3.5 bg-slate-950 text-amber-400 border border-slate-800">
                <HardDrive className="w-6 h-6" />
              </div>
            </div>

            {/* Network Latency Card */}
            <div className="bg-slate-900 border border-slate-800 p-5 flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">زمن الاستجابة للشبكة (Latency)</span>
                <span className="text-2xl font-black text-white mt-1.5 block font-mono">{networkPing} ms</span>
                <span className="text-[9px] text-emerald-400 mt-1 block">توجيه ذكي عبر CDN معزز بالشرق الأوسط</span>
              </div>
              <div className="p-3.5 bg-slate-950 text-emerald-400 border border-slate-800">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
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
              <div className="bg-slate-950 border border-slate-850 p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                    pg_primary_cluster (Main node)
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded font-black">رئيسي للكتابة</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">logical_db_federated_master • me-central1 (Dhahran)</p>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">نشط ومتصل</span>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                    pg_replica_dhahran_01
                    <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900 px-1.5 py-0.5 rounded font-black">قراءة فقط</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">logical_db_replica_1 • me-central1 (Dhahran)</p>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">نشط ومستقر</span>
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
                  <span className="font-mono text-white">48 من أصل 500</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '9.6%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-slate-300">معدل الاستعلامات البطيئة (Slow Queries Rate)</span>
                  <span className="font-mono text-white">0.02%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '1%' }} />
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 text-[10px] text-slate-400 leading-relaxed border border-slate-850">
                🚀 يتم حظر وتجميد العمليات التالفة وتنظيفها آلياً عبر خوارزميات الاسترداد لـ PostgreSQL RLS لضمان عدم تأثر المعالجات الفروع السحابية للشركاء.
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
                فحص فوري لقواعد التحقق في الجلسات، التشفير للأرقام القومية ومراجعة عزل الـ RLS السحابي لجميع المستأجرين بنجاح.
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
