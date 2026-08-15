import { AlertTriangle, CheckCircle, Clock, DatabaseZap, HardDrive, Layers, RefreshCw, Server, Settings, ShieldAlert, Sliders, Sparkles, Users } from 'lucide-react';
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';

interface SuperAdminResourcesProps {
  schools: any[];
  setSchools: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function SuperAdminResources({
  schools = [],
  setSchools,
  logAction,
  triggerNotification
}: SuperAdminResourcesProps) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [isOptimizing, setIsOptimizing] = useState<string | null>(null);

  // Parse resources
  const getStorageDetails = (school: any) => {
    const used = parseFloat(school.storageUsed || '0');
    const limit = parseFloat(school.storageLimit || '500');
    const percent = Math.min(100, Math.round((used / limit) * 100));
    return { used, limit, percent };
  };

  // Aggregated data across all schools
  const totalStorageUsed = schools.reduce((acc, s) => acc + parseFloat(s.storageUsed || '0'), 0);
  const totalStorageLimit = schools.reduce((acc, s) => acc + parseFloat(s.storageLimit || '500'), 0);
  const totalStudents = 245000; // Simulated global
  const totalActiveUsers = schools.reduce((acc, s) => acc + (s.usersCount || 120), 0);
  
  // Chart 1 Data: Storage Consumption per School (Top 5)
  const schoolStorageChartData = schools.slice(0, 5).map(s => {
    const { used, limit } = getStorageDetails(s);
    return {
      name: s.name.substring(0, 15) + '...',
      used: used,
      limit: limit
    };
  });

  // Chart 2 Data: DB query consumption / storage history
  const historyData = [
    { month: 'يناير', dbSize: 45, storageSize: 320, activeQueries: 8900 },
    { month: 'فبراير', dbSize: 48, storageSize: 360, activeQueries: 9400 },
    { month: 'مارس', dbSize: 52, storageSize: 410, activeQueries: 10500 },
    { month: 'أبريل', dbSize: 58, storageSize: 480, activeQueries: 12100 },
    { month: 'مايو', dbSize: 64, storageSize: 560, activeQueries: 13400 },
    { month: 'يونيو', dbSize: 72, storageSize: 642, activeQueries: 14800 }
  ];

  // Action: Vacuum & Optimize DB Space
  const handleOptimizeDb = (schoolId: string, schoolName: string) => {
    setIsOptimizing(schoolId);
    triggerNotification(`جاري جدولة وإجراء فحص وصيانة الخادم الفيدرالي لـ ${schoolName}...`, 'info');
    
    setTimeout(() => {
      // If single school, we slightly decrease their database storage as a visual feedback
      if (schoolId !== 'all') {
        setSchools(prev => prev.map(s => {
          if (s.id === schoolId) {
            const used = parseFloat(s.storageUsed || '0');
            const optimizedUsed = Math.max(1, Number((used * 0.95).toFixed(2))); // reduce by 5%
            return { ...s, storageUsed: `${optimizedUsed} GB` };
          }
          return s;
        }));
      }

      logAction(
        'DB_VACUUM_OPTIMIZE',
        `تنفيذ عملية تنظيف البيانات الميتة (VACUUM FULL & REINDEX) لقاعدة بيانات مستأجر: ${schoolName}`,
        'مراقبة استهلاك الموارد'
      );
      
      triggerNotification(`اكتمل تنظيف وصيانة خادم مدرسة ${schoolName} بنجاح • تم تحرير مساحات التخزين المؤقتة ✅`, 'success');
      setIsOptimizing(null);
    }, 2000);
  };

  // Action: Clear S3 temp logs
  const handleClearS3Temp = (schoolId: string, schoolName: string) => {
    setIsOptimizing(schoolId + '_s3');
    triggerNotification(`جاري مسح الملفات غير النشطة واللقطات المؤقتة لـ ${schoolName}...`, 'info');
    
    setTimeout(() => {
      logAction(
        'CLEAR_S3_TEMP_FILES',
        `مسح اللقطات والملفات المؤقتة التالفة في سلة S3 للمستأجر: ${schoolName}`,
        'مراقبة استهلاك الموارد'
      );
      triggerNotification(`تم تطهير مجلدات المؤقتات بنجاح وحفظ مساحات تخزين إضافية ✅`, 'success');
      setIsOptimizing(null);
    }, 1800);
  };

  const selectedSchoolObj = schools.find(s => s.id === selectedSchoolId);

  return (
    <div id="super-admin-resources" className="space-y-6 text-right">
      
      {/* Bento Layout Resource Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Global Storage */}
        <div className="bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition-all shadow-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-600" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">سعة تخزين S3 الفيدرالية</p>
              <h3 className="text-xl font-black text-white mt-1.5 font-mono">{totalStorageUsed.toFixed(1)} GB</h3>
            </div>
            <div className="p-2 bg-orange-950/50 text-orange-400 border border-orange-900 group-hover:scale-110 transition-transform">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-3 font-semibold">إجمالي المسموح به: {totalStorageLimit} GB • نسبة الاستهلاك {(totalStorageUsed / (totalStorageLimit || 1) * 100).toFixed(1)}%</p>
        </div>

        {/* Metric 2: Global Users Activity */}
        <div className="bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition-all shadow-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">الحسابات والكوادر النشطة</p>
              <h3 className="text-xl font-black text-white mt-1.5 font-mono">{totalActiveUsers} مستخدم</h3>
            </div>
            <div className="p-2 bg-emerald-950/50 text-emerald-400 border border-emerald-900 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-3 font-semibold">يقابله {totalStudents} طالب مسجل بقواعد المدارس</p>
        </div>

        {/* Metric 3: Active Postgres Connections */}
        <div className="bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition-all shadow-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">خادمي الاتصال المباشر PostgreSQL</p>
              <h3 className="text-xl font-black text-white mt-1.5 font-mono">148 متصل</h3>
            </div>
            <div className="p-2 bg-purple-950/50 text-purple-400 border border-purple-900 group-hover:scale-110 transition-transform">
              <DatabaseZap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-3 font-semibold">تجمع الاتصالات (Connection Pool): 18/100 مستخدم بنجاح</p>
        </div>

        {/* Metric 4: Backup Health status */}
        <div className="bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition-all shadow-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">جدولة النسخ الاحتياطية المؤتمتة</p>
              <h3 className="text-xl font-black text-emerald-400 mt-1.5 font-mono">100% سليم</h3>
            </div>
            <div className="p-2 bg-amber-950/50 text-amber-400 border border-amber-900 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-3 font-semibold">آخر لقطة تزامنية ناجحة لجميع المستأجرين: منذ ٣ ساعات</p>
        </div>

      </div>

      {/* Consumption Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        
        {/* Chart 1: S3 Storage per Tenant */}
        <div className="bg-slate-900 border border-slate-800 p-5 space-y-4">
          <h3 className="text-xs font-black text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-orange-400" />
            توزيع استهلاك تخزين S3 بين المدارس الأكثر نشاطاً (GB)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schoolStorageChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '11px', textAlign: 'right' }}
                  labelStyle={{ fontWeight: 'bold', color: '#fbbf24' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="used" name="المساحة المستخدمة" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="limit" name="الحد الممنوح" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Database Size History */}
        <div className="bg-slate-900 border border-slate-800 p-5 space-y-4">
          <h3 className="text-xs font-black text-white flex items-center gap-2">
            <DatabaseZap className="w-4 h-4 text-purple-400" />
            رصد نمو أحجام قواعد البيانات (DB) وتراكم الاستهلاك السنوي
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '11px', textAlign: 'right' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="dbSize" name="حجم قواعد البيانات (MB)" stroke="#a855f7" fillOpacity={1} fill="url(#colorDb)" />
                <Area type="monotone" dataKey="storageSize" name="مجلد التخزين S3 (GB)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStorage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Dynamic Resource Monitoring Panel */}
      <div className="bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-black text-white">تفصيل استهلاك الموارد وخادمات كل مدرسة</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400">تصفية المدرسة المستهدفة:</label>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-100 text-[11px] font-black rounded-lg p-1 px-3 focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">عرض جميع المستأجرين الفيدراليين</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="p-4 font-black text-center w-8">#</th>
                <th className="p-4 font-black">اسم المدرسة والمستأجر</th>
                <th className="p-4 font-black">استهلاك تخزين S3</th>
                <th className="p-4 font-black">الحد الممنوح S3</th>
                <th className="p-4 font-black">رسم الاستهلاك</th>
                <th className="p-4 font-black">عدد الملفات السحابية</th>
                <th className="p-4 font-black">حجم قاعدة البيانات (DB)</th>
                <th className="p-4 font-black text-center">أدوات تحرير المساحة والصيانة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {schools
                .filter(s => selectedSchoolId === 'all' || s.id === selectedSchoolId)
                .map((school, idx) => {
                  const { used, limit, percent } = getStorageDetails(school);
                  
                  // Simulated file counts and DB table counts
                  const fileCount = Math.round(used * 240);
                  const dbSize = Math.round(4.5 + (used * 0.45)); // MB

                  return (
                    <tr key={school.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-4 text-center text-slate-500 font-mono font-bold w-8">{idx + 1}</td>
                      <td className="p-4 font-bold text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{school.logo || '🏫'}</span>
                          <span>{school.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-200">
                        {school.storageUsed || '0 GB'}
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {school.storageLimit || '500 GB'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                percent > 85 ? 'bg-red-500' : percent > 60 ? 'bg-amber-500' : 'bg-orange-500'
                              }`} 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-300">{percent}%</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {fileCount.toLocaleString('ar-EG')} ملف مرفق
                      </td>
                      <td className="p-4 font-mono font-bold text-purple-400">
                        {dbSize} MB
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOptimizeDb(school.id, school.name)}
                            disabled={isOptimizing !== null}
                            className="bg-slate-850 hover:bg-slate-800 text-purple-400 border border-slate-750 p-1.5 rounded-lg text-[10px] font-black cursor-pointer inline-flex items-center gap-1 transition-all"
                          >
                            <DatabaseZap className={`w-3.5 h-3.5 ${isOptimizing === school.id ? 'animate-spin' : ''}`} />
                            صيانة وتنظيف DB
                          </button>
                          <button
                            onClick={() => handleClearS3Temp(school.id, school.name)}
                            disabled={isOptimizing !== null}
                            className="bg-slate-850 hover:bg-slate-800 text-amber-500 border border-slate-750 p-1.5 rounded-lg text-[10px] font-black cursor-pointer inline-flex items-center gap-1 transition-all"
                          >
                            <HardDrive className={`w-3.5 h-3.5 ${isOptimizing === school.id + '_s3' ? 'animate-pulse' : ''}`} />
                            تفريغ المؤقتات S3
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
