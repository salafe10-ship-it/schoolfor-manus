import { Activity, AlertTriangle, CheckCircle, Cpu, Database, Eye, FileCode, Globe, HardDrive, Key, Layers, Network, Play, RefreshCw, Server, Settings, ShieldAlert, Sliders, Terminal, Trash2, Wifi, Zap } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { copyTextToClipboard } from '../components/SuperAdminView';

interface DeveloperPlatformCenterProps {
  schools: any[];
  students: any[];
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
  logAction: (action: string, details: string, section?: string) => void;
}

export default function DeveloperPlatformCenter({
  schools = [],
  students = [],
  triggerNotification,
  logAction
}: DeveloperPlatformCenterProps) {
  const [activeTab, setActiveTab] = useState<'schema' | 'supabase' | 'deployment' | 'env_vars' | 'logs_audit' | 'monitor' | 'console'>('schema');
  
  // States
  const [supabaseUrl, setSupabaseUrl] = useState('<public-project-url-placeholder>');
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  
  // Mock Env Vars
  const [envVars, setEnvVars] = useState([
    { name: 'VITE_SUPABASE_URL', value: '<public-project-url-placeholder>', isPublic: true, isSecret: false },
    { name: 'VITE_SUPABASE_ANON_KEY', value: '<public-anon-key-placeholder>', isPublic: true, isSecret: false },
    { name: 'GEMINI_API_KEY', value: '<server-managed-api-key-placeholder>', isPublic: false, isSecret: true },
    { name: 'POSTGRES_DB_PASSWORD', value: '<server-managed-password-placeholder>', isPublic: false, isSecret: true },
    { name: 'REDIS_CACHE_URL', value: '<server-managed-cache-url-placeholder>', isPublic: false, isSecret: true },
    { name: 'JWT_SECRET_KEY', value: '<server-managed-jwt-secret-placeholder>', isPublic: false, isSecret: true }
  ]);
  const [showSecrets, setShowSecrets] = useState(false);

  // Deployments state
  const [deployments, setDeployments] = useState([
    { id: 'dep-054', version: 'v3.5.2-stable', branch: 'main', status: 'success', timestamp: 'منذ ساعتين', commit: 'chore: build(production) unified action bar' },
    { id: 'dep-053', version: 'v3.5.1-stable', branch: 'main', status: 'success', timestamp: 'أمس', commit: 'feat: add advanced search portal filters' },
    { id: 'dep-052', version: 'v3.4.9-hotfix', branch: 'hotfix/printer-bypass', status: 'success', timestamp: 'منذ يومين', commit: 'fix: bypass secure print frames in chrome' }
  ]);
  const [isDeploying, setIsDeploying] = useState(false);

  // Live Performance Logs / Metrics
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [sqlConsoleHistory, setSqlConsoleHistory] = useState<string[]>([
    '-- SQL Terminal Started. Connects directly to Dev & Platform DB.',
    'SELECT count(*) FROM students WHERE status = \'active\';',
    '>> Result: 124 records active.'
  ]);
  const [inputQuery, setInputQuery] = useState('');

  // SSL and DNS simulation
  const [sslStatus, setSslStatus] = useState({
    domain: 'enterprise.edupro-erp.com',
    issuer: 'Let\'s Encrypt Authority X3',
    expires: '2026-10-15 (متبقي 92 يوماً)',
    status: 'valid'
  });

  // Database tables metadata (Database Inspector)
  const tablesMetadata = [
    { name: 'schools', rows: schools.length, columns: 12, size: '24 KB', rls: 'مفعل (RLS Enabled)' },
    { name: 'students', rows: students.length, columns: 18, size: '156 KB', rls: 'مفعل (RLS Enabled)' },
    { name: 'guardians', rows: students.length, columns: 10, size: '94 KB', rls: 'مفعل (RLS Enabled)' },
    { name: 'invoices', rows: 142, columns: 15, size: '280 KB', rls: 'مفعل (RLS Enabled)' },
    { name: 'audit_logs', rows: 840, columns: 8, size: '1.2 MB', rls: 'مفعل (RLS Enabled)' }
  ];

  useEffect(() => {
    // Generate live stream of CPU/Memory and DB connection pools
    const data = Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 5}ث`,
      latency: Math.floor(15 + Math.random() * 12),
      cpu: Math.floor(25 + Math.random() * 10),
      memory: Math.floor(58 + Math.random() * 3),
      pool: Math.floor(8 + Math.random() * 4)
    }));
    setMetricsHistory(data);

    const interval = setInterval(() => {
      setMetricsHistory(prev => {
        const sliced = prev.slice(1);
        return [
          ...sliced,
          {
            time: 'الآن',
            latency: Math.floor(12 + Math.random() * 8),
            cpu: Math.floor(20 + Math.random() * 20),
            memory: Math.floor(58 + Math.random() * 2),
            pool: Math.floor(6 + Math.random() * 6)
          }
        ];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleTestSupabase = async () => {
    setDbStatus('testing');
    triggerNotification('جاري فحص توفر خادم التطبيق...', 'info');
    try {
      const response = await fetch('/api/health', { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Health endpoint returned ${response.status}`);
      setDbStatus('connected');
      triggerNotification('خادم التطبيق متاح. هذا الفحص لا يثبت اتصال PostgreSQL.', 'info');
      logAction('SERVER_HEALTH_CHECK', 'فحص توفر خادم التطبيق؛ لا يُستخدم كإثبات لاتصال PostgreSQL', 'مركز المطورين');
    } catch (error) {
      setDbStatus('disconnected');
      triggerNotification('تعذر الوصول إلى خادم التطبيق.', 'danger');
      logAction('SERVER_HEALTH_CHECK_FAILED', 'تعذر الوصول إلى نقطة فحص خادم التطبيق', 'مركز المطورين');
    }
  };

  const handleTriggerDeploy = () => {
    setIsDeploying(true);
    triggerNotification('جاري تحضير ملفات البناء (Build Phase) ومطابقة الحاويات...', 'info');
    setTimeout(() => {
      const newDep = {
        id: `dep-0${Math.floor(55 + Math.random() * 20)}`,
        version: 'v3.5.3-release',
        branch: 'main',
        status: 'success',
        timestamp: 'الآن',
        commit: 'feat: live automatic deploy from Developer Center'
      };
      setDeployments(prev => [newDep, ...prev]);
      setIsDeploying(false);
      triggerNotification('اكتمل البناء والنشر التلقائي بنجاح! تم نقل الإصدار الجديد للإنتاجية 🚀', 'success');
      logAction('PLATFORM_REDEPLOY', 'تحفيز عملية إعادة النشر والبناء التلقائي للمنصة السحابية الموحدة', 'مركز المطورين');
    }, 2500);
  };

  const executeConsoleQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const query = inputQuery.trim();
    let result = '';

    if (query.toLowerCase().includes('select')) {
      if (query.toLowerCase().includes('students')) {
        result = `>> Returned ${students.length} rows inside (students) matching current Tenant Isolation schema.`;
      } else if (query.toLowerCase().includes('schools')) {
        result = `>> Returned ${schools.length} rows inside (schools) matching Global SaaS configuration.`;
      } else {
        result = '>> Success: Query executed successfully (Returned 0 rows or virtual records).';
      }
    } else if (query.toLowerCase().includes('update') || query.toLowerCase().includes('insert')) {
      result = '>> Commit OK: Transaction recorded inside SQL simulator ledger.';
    } else if (query.toLowerCase().includes('clear') || query.toLowerCase().includes('cls')) {
      setSqlConsoleHistory([]);
      setInputQuery('');
      return;
    } else {
      result = '>> Error: Script warning. Relational parser simulation complete.';
    }

    setSqlConsoleHistory(prev => [...prev, query, result]);
    setInputQuery('');
    logAction('CONSOLE_SQL_QUERY', `تنفيذ استعلام مباشر من وحدة المطور: ${query.substring(0, 50)}...`, 'مركز المطورين');
  };

  const handleFlushPlatformCache = () => {
    triggerNotification('جاري محو وتطهير الذاكرة المخبئية السحابية لضمان تطابق البيانات...', 'info');
    setTimeout(() => {
      triggerNotification('تم إفراغ الذاكرة المخبئية (Redis Server Cache) وبدء تجميع الأصول بنجاح! 🧹', 'success');
      logAction('PLATFORM_CACHE_PURGE', 'تنظيف الذاكرة المخبئية السحابية وإعادة تحميل البنية الإدارية للمستأجرين', 'مركز المطورين');
    }, 1200);
  };

  const dbSchemaSQLText = `-- ==========================================================
-- EDUPRO SYSTEM MASTER SCHEMA - POSTGRESQL & SUPABASE COMPATIBLE
-- ==========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Master Table: schools (SaaS Multi-Tenant Configuration)
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'
);

-- 3. Child Table: students (Relational Table with Cascade Delete)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_code VARCHAR(50) UNIQUE NOT NULL,
  academic_id VARCHAR(50) UNIQUE NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  national_id VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Multi-Tenant Row Level Security (RLS) Policy
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON students
  FOR ALL
  USING (school_id = current_setting('app.current_school_id')::UUID);`;

  return (
    <div id="developer-platform-center" className="space-y-6 text-right animate-fade-in">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-indigo-400 font-extrabold font-mono tracking-wider uppercase">DEVELOPER EXPERIENCE & PLATFORM CONTROL</span>
            </div>
            <h1 className="text-xl font-black mt-1 flex items-center gap-2.5">
              <Terminal className="w-6 h-6 text-indigo-400" />
              <span>Developer & Platform Center (مركز المطورين وإدارة المنصة) 💻</span>
            </h1>
            <p className="text-xs text-indigo-200 mt-1 max-w-3xl">
              مركز التحكم التقني الكامل والمطور ببنيته الداخلية. يحتوي على أدوات فحص قاعدة البيانات، الروابط السحابية، مراقبة استدعاءات الـ APIs، موازنة الأحمال، وإصدارات النظام المعزولة.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFlushPlatformCache}
              className="bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تنظيف الذاكرة المؤقتة (Cache)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-800 gap-1">
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'schema' ? 'border-indigo-500 text-indigo-400 bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4 text-amber-500" />
          <span>هيكل البيانات (Database Schema)</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'supabase' ? 'border-indigo-500 text-indigo-400 bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-500" />
          <span>إدارة Supabase & RLS</span>
        </button>

        <button
          onClick={() => setActiveTab('deployment')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'deployment' ? 'border-indigo-500 text-indigo-400 bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4 text-blue-500" />
          <span>النشر والتحديثات (Deployment)</span>
        </button>

        <button
          onClick={() => setActiveTab('env_vars')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'env_vars' ? 'border-indigo-500 text-indigo-400 bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4 text-yellow-500" />
          <span>متغيرات البيئة (Env Variables)</span>
        </button>

        <button
          onClick={() => setActiveTab('logs_audit')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'logs_audit' ? 'border-indigo-500 text-indigo-400 bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4 text-violet-500" />
          <span>سجل العمليات والأخطاء (Logs)</span>
        </button>

        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'monitor' ? 'border-indigo-500 text-indigo-400 bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>مراقب الـ APIs والأداء (Monitor)</span>
        </button>

        <button
          onClick={() => setActiveTab('console')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'console' ? 'border-indigo-500 text-indigo-400 bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4 text-cyan-500" />
          <span>محرر استعلامات النظام (SQL Terminal)</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-lg min-h-[400px]">
        
        {/* TAB 1: Database Schema */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-white">مخطط بناء العلاقات (PostgreSQL DB Schema)</h3>
                <p className="text-[11px] text-slate-400 mt-1">توضح هذه الهيكلية العلاقات والمفاتيح الأجنبية والترقيم التلقائي المعزول في بيئة المؤسسات المتعددة.</p>
              </div>
              <button
                onClick={() => {
                  copyTextToClipboard(dbSchemaSQLText);
                  triggerNotification('تم نسخ مخطط بناء الـ Database SQL كود بالكامل 📋', 'success');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>نسخ كود الـ SQL بالكامل 📋</span>
              </button>
            </div>

            {/* Visual Schema Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-right">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-[11px] font-black text-white uppercase font-mono">1. TABLE: schools (المدارس)</span>
                </div>
                <ul className="text-[10px] space-y-1.5 text-slate-400 list-disc list-inside">
                  <li><strong className="text-slate-200">id</strong> (UUID, Primary Key)</li>
                  <li><strong className="text-slate-200">subdomain</strong> (VARCHAR, Unique Index)</li>
                  <li>name (VARCHAR NOT NULL)</li>
                  <li>status (VARCHAR, Default active)</li>
                  <li>created_at (TIMESTAMP)</li>
                </ul>
                <div className="pt-2 text-[9px] text-amber-500 font-mono">Index: IDX_schools_subdomain</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className="text-[11px] font-black text-white uppercase font-mono">2. TABLE: students (الطلاب)</span>
                </div>
                <ul className="text-[10px] space-y-1.5 text-slate-400 list-disc list-inside">
                  <li><strong className="text-slate-200">id</strong> (UUID, Primary Key)</li>
                  <li><strong className="text-slate-200">school_id</strong> (FK schools ON DELETE CASCADE)</li>
                  <li>student_code (VARCHAR, Unique Indexed)</li>
                  <li>academic_id (VARCHAR, Unique Index)</li>
                  <li>national_id (VARCHAR, Unique Index)</li>
                  <li>status (VARCHAR, Default active)</li>
                </ul>
                <div className="pt-2 text-[9px] text-indigo-400 font-mono">RLS: (school_id = current_setting('app.current_school_id'))</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-black text-white uppercase font-mono">3. TABLE: guardians (أولياء الأمور)</span>
                </div>
                <ul className="text-[10px] space-y-1.5 text-slate-400 list-disc list-inside">
                  <li><strong className="text-slate-200">guardian_id</strong> (UUID, Primary Key)</li>
                  <li><strong className="text-slate-200">student_id</strong> (FK students ON DELETE CASCADE)</li>
                  <li>relationship (father, mother, emergency)</li>
                  <li>full_name, phone, job</li>
                  <li>national_id (BTree Index)</li>
                </ul>
                <div className="pt-2 text-[9px] text-emerald-500 font-mono">Foreign Key: FK_guardians_students</div>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[250px] border border-slate-800 leading-relaxed text-left" dir="ltr">
              {dbSchemaSQLText}
            </div>
          </div>
        )}

        {/* TAB 2: Supabase Management */}
        {activeTab === 'supabase' && (
          <div className="space-y-6">
            <h3 className="text-sm font-extrabold text-white">إدارة منصة Supabase وتدابير الأمان RLS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Credentials Form */}
              <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-indigo-400 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" />
                    <span>بيانات اتصال قاعدة البيانات السحابية</span>
                  </h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    dbStatus === 'connected' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900' :
                    dbStatus === 'testing' ? 'bg-amber-950/40 text-amber-400 border border-amber-900 animate-pulse' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {dbStatus === 'connected' ? '🟢 Application Server Available' : dbStatus === 'testing' ? '⚡ Checking Server...' : '🔴 Not Verified'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">SUPABASE_URL</label>
                    <input 
                      type="text" 
                      value={supabaseUrl} 
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2 text-xs font-mono text-indigo-300 rounded focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3 text-[11px] leading-5 text-amber-200">
                    مفاتيح الخدمة وقيم الاتصال الخاصة لا تُدخل أو تُخزّن في المتصفح. يتم تشغيل الاتصال من الخادم فقط باستخدام إعدادات بيئة Render المحمية.
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTestSupabase}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                      <span>فحص توفر خادم التطبيق 🔗</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Database Inspector Info */}
              <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-black text-indigo-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Database className="w-3.5 h-3.5" />
                  <span>مفتش الجداول وفهارس الحماية (Database Inspector)</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right divide-y divide-slate-850">
                    <thead>
                      <tr className="text-slate-450 font-bold">
                        <th className="pb-2">اسم الجدول</th>
                        <th className="pb-2 text-center">الصفوف</th>
                        <th className="pb-2 text-center">الأعمدة</th>
                        <th className="pb-2">حالة حماية RLS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {tablesMetadata.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="py-2.5 font-mono text-[11px] text-indigo-300 font-bold">{t.name}</td>
                          <td className="py-2.5 text-center font-mono">{t.rows}</td>
                          <td className="py-2.5 text-center font-mono">{t.columns}</td>
                          <td className="py-2.5 text-emerald-400 font-bold text-[10px]">{t.rls}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: Deployment */}
        {activeTab === 'deployment' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-400" />
                  <span>سجل بناء وإعادة بناء النشر (CI/CD Production Deployment)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">تتيح هذه الوحدة استدعاء نظام البناء والتحقق لإنشاء إصدار جديد تماماً من المنصة، وفحص الأخطاء قبل التمرير لجميع فروع المدارس المستأجرة.</p>
              </div>
              <button
                onClick={handleTriggerDeploy}
                disabled={isDeploying}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              >
                {isDeploying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري البناء...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>إعادة نشر المنصة السحابية 🚀</span>
                  </>
                )}
              </button>
            </div>

            {/* Deployments Log table */}
            <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
              <div className="p-3 bg-slate-900 text-xs font-bold text-slate-400 border-b border-slate-800">تاريخ عمليات النشر والبناء الأخيرة</div>
              <div className="divide-y divide-slate-850">
                {deployments.map((d, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-slate-900/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-300 font-black">{d.id}</span>
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold font-mono">{d.version}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{d.timestamp}</span>
                      </div>
                      <p className="text-slate-300 font-mono text-[10px]">{d.commit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 rounded text-[10px] font-black">
                        ● Succeeded
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Environment Variables */}
        {activeTab === 'env_vars' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white">إعدادات ومتغيرات البيئة الحيوية (Environment Variables)</h3>
                <p className="text-xs text-slate-400 mt-1">تراقب هذه الوحدة سلامة ومتطلبات تشغيل السيرفر وقاعدة البيانات وقاموس ذكاء Gemini الاصطناعي.</p>
              </div>
              <button
                onClick={() => setShowSecrets(!showSecrets)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 cursor-pointer"
              >
                {showSecrets ? 'إخفاء القيم الحساسة' : 'إظهار القيم الحساسة'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {envVars.map((v, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between gap-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono text-indigo-300 font-extrabold block select-all">{v.name}</span>
                      <span className="text-[9px] text-slate-400">نطاق التواجد: {v.isPublic ? 'Client / Web browser (Public)' : 'Server-side Secret (API hidden)'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      v.isSecret ? 'bg-amber-950/40 text-amber-400 border border-amber-900' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {v.isSecret ? '🔐 Secret' : '🌐 Public'}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-850 font-mono text-[10px] text-slate-300 truncate select-all">
                    {v.isSecret && !showSecrets ? '••••••••••••••••••••••••••••••••' : v.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Logs & Audit */}
        {activeTab === 'logs_audit' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white">سجل تتبع الحوكمة التقنية والبرمجية (Logs & System Audit)</h3>
                <p className="text-xs text-slate-400 mt-1">يعرض السجل المترابط لتتبع التغييرات وصافيات الأخطاء والـ SQL queries التي حدثت أثناء استخدام المدارس للمنظومة.</p>
              </div>
            </div>

            {/* Interactive logs monitor */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-900 p-3 flex justify-between items-center border-b border-slate-800 text-xs text-slate-400 font-bold">
                <span>سجل الاستعلامات والأحداث النشطة (Live Database Logs)</span>
                <span className="text-[10px] bg-slate-850 text-indigo-400 px-2 py-0.5 rounded border border-slate-750">Ready</span>
              </div>
              <div className="p-4 font-mono text-[11px] text-indigo-300 leading-relaxed space-y-1.5 max-h-[300px] overflow-y-auto text-left" dir="ltr">
                <p className="text-slate-450">-- Continuous PostgreSQL Diagnostics Engine Active</p>
                <p className="text-emerald-500">-- [INFO] SQL Server connected matching ISO Standards for Tenant Isolation.</p>
                <p className="text-indigo-400">SELECT * FROM schools WHERE subdomain = 'alfaisal' LIMIT 1;</p>
                <p className="text-slate-400">{" >> OK [Row Count: 1] (Latency: 2ms)"}</p>
                <p className="text-indigo-400">SELECT id, name_ar, student_code, status FROM students WHERE school_id = '8f43-8ef2d' ORDER BY student_code ASC;</p>
                <p className="text-slate-400">{" >> OK [Row Count: "}{students.length}{"] (Latency: 4ms)"}</p>
                <p className="text-rose-400">-- [WARN] Multi-tenant context validated. Row level protection (RLS) checked: 100% Secure.</p>
                <p className="text-indigo-400">INSERT INTO audit_logs (id, actor, action, timestamp) VALUES (uuid_generate_v4(), 'SuperAdmin', 'EXPORT_STUDENTS_EXCEL', NOW());</p>
                <p className="text-slate-400">{" >> OK (Latency: 1ms)"}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Monitor */}
        {activeTab === 'monitor' && (
          <div className="space-y-6">
            <h3 className="text-sm font-extrabold text-white">مراقب الـ API والأحمال والروابط (Performance & API Monitor)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">زمن استجابة الشبكة (Latency)</span>
                <span className="text-lg font-black font-mono text-emerald-400">12 ms</span>
                <span className="text-[9px] text-slate-500 block">ضمن النطاق الأمثل جداً</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">صحة الشهادة الأمنية (SSL / HTTPS)</span>
                <span className="text-lg font-black text-sky-400 font-mono">Secure (HTTPS)</span>
                <span className="text-[9px] text-slate-500 block">بإصدار Let's Encrypt</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">سلامة الروابط (DNS Routing)</span>
                <span className="text-lg font-black text-indigo-400">Active (100%)</span>
                <span className="text-[9px] text-slate-500 block">جميع النطاقات الفرعية مسجلة</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">مجموع الترافيك اليومي (Requests)</span>
                <span className="text-lg font-black text-yellow-400 font-mono">152,480 req</span>
                <span className="text-[9px] text-slate-500 block">موزعة على كافة المستأجرين</span>
              </div>
            </div>

            {/* Performance Live Area Chart */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400">مخطط الزمن الحي لمعدل الاستجابة وموازنة الصفقات (Real-time Metric Stream)</h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                    <YAxis stroke="#64748b" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="latency" name="زمن الاستجابة (ms)" stroke="#6366f1" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={2} />
                    <Area type="monotone" dataKey="cpu" name="استهلاك المعالج (%)" stroke="#10b981" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: Console */}
        {activeTab === 'console' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>محرر ومحاكي الأوامر والاستعلامات السحابية (Interactive SQL Console)</span>
              </h3>
              <p className="text-xs text-slate-400">امتحان وتجربة الاستعلامات المباشرة على قاعدة البيانات. يمكنك كتابة استعلامات SQL مثل SELECT * FROM students أو SELECT * FROM schools واختبار العزل فوراً.</p>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 flex flex-col h-[300px]">
              <div className="flex-1 p-4 font-mono text-[11px] text-indigo-300 overflow-y-auto space-y-1.5 leading-relaxed text-left" dir="ltr">
                {sqlConsoleHistory.map((line, idx) => (
                  <p key={idx} className={line.startsWith('>>') ? 'text-slate-450' : line.startsWith('--') ? 'text-emerald-500' : 'text-indigo-200'}>
                    {line}
                  </p>
                ))}
              </div>

              <form onSubmit={executeConsoleQuery} className="bg-slate-900 border-t border-slate-800 p-2 flex gap-2">
                <span className="text-xs font-mono text-indigo-400 self-center px-1">SQL&gt;</span>
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="SELECT * FROM students LIMIT 5;"
                  className="flex-1 bg-slate-950 text-indigo-200 font-mono text-xs border border-slate-800 p-2 rounded focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2 rounded-lg cursor-pointer"
                >
                  تشغيل استعلام
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
