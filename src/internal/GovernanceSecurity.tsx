import { Activity, AlertCircle, AlertTriangle, Check, CheckCircle2, Clock, Cpu, Database, Eye, FileCheck, FileText, Filter, HardDrive, Key, Lock as LockIcon, RefreshCw, RotateCw, Search, Server, Settings, ShieldAlert, ShieldCheck, Sparkles, Terminal, UserCheck, Users, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
interface GovernanceSecurityProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface AuditRecord {
  id: string;
  table: string;
  action: string;
  user: string;
  time: string;
  date: string;
  ip: string;
  before: any;
  after: any;
  details: string;
  critical: boolean;
}

export default function GovernanceSecurity({ triggerNotification }: GovernanceSecurityProps) {
  // --- States ---
  
  // 1. Security States
  const [selectedRbacRole, setSelectedRbacRole] = useState<'super_admin' | 'branch_manager' | 'financial_auditor' | 'teacher'>('super_admin');
  const [tenantId, setTenantId] = useState<string>('school_branch_tripoli');
  const [inputPayload, setInputPayload] = useState<string>("<script>alert('xss')</script>");
  const [encodedOutput, setEncodedOutput] = useState<string>('');
  const [sqlPayload, setSqlPayload] = useState<string>("' OR '1'='1");
  const [sqlSanitized, setSqlSanitized] = useState<string>('');

  // 2. Audit Trail States
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [auditFilterType, setAuditFilterType] = useState<'all' | 'critical' | 'financial' | 'auth'>('all');
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<AuditRecord | null>(null);
  
  const initialAuditRecords: AuditRecord[] = [
    {
      id: 'AUD-9912',
      table: 'FUNDS_LEDGER',
      action: 'تعديل قيمة سند الصرف 142',
      user: 'salafe10@gmail.com',
      time: '10:24:11',
      date: '2026-07-11',
      ip: '197.230.45.12',
      before: { ledger_id: 142, amount: 4500, status: 'approved', notes: 'سداد جزئي' },
      after: { ledger_id: 142, amount: 3200, status: 'pending_revision', notes: 'تعديل القيمة للمراجعة' },
      details: 'المراقب المالي قام بتعديل قيمة السند لمطابقة كشف حساب مصرف الأمان.',
      critical: true
    },
    {
      id: 'AUD-9913',
      table: 'USER_SESSIONS',
      action: 'تسجيل دخول ناجح (Login)',
      user: 'salafe10@gmail.com',
      time: '09:15:30',
      date: '2026-07-11',
      ip: '197.230.45.12',
      before: { session_id: 'sess_abc123', authenticated: false },
      after: { session_id: 'sess_abc123', authenticated: true, role: 'super_admin' },
      details: 'تسجيل دخول اعتيادي للمشرف العام عبر المصادقة الثنائية 2FA.',
      critical: false
    },
    {
      id: 'AUD-9914',
      table: 'EXAM_MARKS',
      action: 'اعتماد درجات الصف الثاني عشر',
      user: 'teacher_ahmed@edupro.ly',
      time: '08:44:02',
      date: '2026-07-11',
      ip: '102.164.22.8',
      before: { marks_status: 'draft', verified_by: null },
      after: { marks_status: 'sealed_and_locked', verified_by: 'teacher_ahmed@edupro.ly' },
      details: 'قفل واعتماد درجات الكنترول النهائي لمادة الفيزياء - فرع بنغازي.',
      critical: true
    },
    {
      id: 'AUD-9915',
      table: 'STUDENT_INFO',
      action: 'تعديل الرقم الوطني للطالبة سارة',
      user: 'registrar_mariam@edupro.ly',
      time: '16:30:15',
      date: '2026-07-10',
      ip: '102.164.88.90',
      before: { student_id: 'S1022', national_id: '220050119881' },
      after: { student_id: 'S1022', national_id: '220050119882' },
      details: 'تصحيح خطأ إملائي في خانة الرقم الوطني بناءً على شهادة الميلاد المرفقة.',
      critical: false
    },
    {
      id: 'AUD-9916',
      table: 'FUNDS_LEDGER',
      action: 'حذف سند القبـض 88',
      user: 'salafe10@gmail.com',
      time: '14:22:11',
      date: '2026-07-10',
      ip: '197.230.45.12',
      before: { receipt_id: 88, value: 1200, category: 'أقساط دراسية' },
      after: null,
      details: 'إلغاء السند وتصفير القيد المحاسبي المزدوج نظراً لرفض الشيك البنكي المرفوع.',
      critical: true
    }
  ];

  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(initialAuditRecords);

  // 3. Production Configuration States
  const [logLevel, setLogLevel] = useState<'info' | 'debug' | 'warn' | 'error'>('info');
  const [secretsLocked, setSecretsLocked] = useState<boolean>(true);
  const [cpuUsage, setCpuUsage] = useState<number>(34);
  const [memoryUsage, setMemoryUsage] = useState<number>(58);
  const [dbLatency, setDbLatency] = useState<number>(14);

  // 4. Backup & Recovery States
  const [pitrMinutes, setPitrMinutes] = useState<number>(0);
  const [pitrRestoring, setPitrRestoring] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupProgress, setBackupProgress] = useState<number>(0);
  const [backupFiles, setBackupFiles] = useState<any[]>([
    { name: 'edupro_prod_db_snapshot_20260711.sql', size: '14.8 MB', date: 'اليوم - 02:00 ص', key: 'AES-256-Encrypted' },
    { name: 'edupro_prod_db_snapshot_20260710.sql', size: '14.5 MB', date: 'أمس - 02:00 ص', key: 'AES-256-Encrypted' },
    { name: 'edupro_prod_db_snapshot_20260709.sql', size: '14.2 MB', date: '9 يوليو 2026', key: 'AES-256-Encrypted' }
  ]);
  const [testRestoreRunning, setTestRestoreRunning] = useState<boolean>(false);
  const [testRestoreStep, setTestRestoreStep] = useState<string>('');

  // 5. Deployment States
  const [healthStatus, setHealthStatus] = useState<any>({
    expressServer: 'healthy',
    postgresDb: 'healthy',
    redisCache: 'healthy',
    dnsResolution: 'healthy'
  });
  const [isRefreshingHealth, setIsRefreshingHealth] = useState<boolean>(false);
  const [startupValidationResults, setStartupValidationResults] = useState<string[]>([
    'VITE_ENV_VALIDATION: OK (production mode detected)',
    'PORT_AVAILABILITY: OK (bound to 3000)',
    'DATABASE_MIGRATIONS: OK (version 12.4.0 verified)',
    'JWT_SECRET_STRENGTH: OK (entropy check passed)',
    'CORS_POLICIES: OK (strictly whitelisted origins only)'
  ]);

  // --- Effects & Simulations ---
  useEffect(() => {
    // Escape XSS payload
    const escaped = inputPayload
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    setEncodedOutput(escaped);
  }, [inputPayload]);

  useEffect(() => {
    // Escape SQL injection payload
    const sanitized = sqlPayload.replace(/'/g, "''");
    setSqlSanitized(`SELECT * FROM students WHERE name = '${sanitized}'`);
  }, [sqlPayload]);

  // Simulate CPU / RAM fluctuation
  useEffect(() => {
    const timer = setInterval(() => {
      setCpuUsage(prev => {
        const offset = Math.floor(Math.random() * 7) - 3;
        const next = prev + offset;
        return Math.min(Math.max(next, 10), 95);
      });
      setMemoryUsage(prev => {
        const offset = Math.floor(Math.random() * 3) - 1;
        const next = prev + offset;
        return Math.min(Math.max(next, 40), 90);
      });
      setDbLatency(prev => {
        const offset = Math.floor(Math.random() * 5) - 2;
        const next = prev + offset;
        return Math.min(Math.max(next, 8), 45);
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // --- Handlers ---
  const handleCreateBackup = () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          const now = new Date();
          const dateString = now.toISOString().slice(0,10).replace(/-/g,'');
          setBackupFiles(prevFiles => [
            {
              name: `edupro_prod_db_snapshot_${dateString}_instant.sql`,
              size: '15.1 MB',
              date: 'الآن (يدوياً)',
              key: 'AES-256-Encrypted'
            },
            ...prevFiles
          ]);
          triggerNotification('تم نسخ قاعدة البيانات بالكامل وتشفير الملف وتخزينه بنجاح!', 'success');
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  const handleTestRestore = () => {
    setTestRestoreRunning(true);
    const steps = [
      'جاري تهيئة حاوية الاختبار المعزولة (Isolated Sandbox Database)...',
      'جاري قراءة ملف النسخة الاحتياطية وتفكيك تشفير AES-256...',
      'جاري ترحيل الجداول وملء البيانات (5,400 سجل مالي وأكاديمي)...',
      'جاري فحص سلامة العلاقات والقيود المحاسبية الثنائية...',
      'التحقق من صحة ميزان المراجعة قبل الاعتماد... OK ✓',
      'تم اختبار استعادة النسخة الاحتياطية عملياً بنجاح وتطابق البيانات 100%!'
    ];
    let idx = 0;
    setTestRestoreStep(steps[0]);
    const interval = setInterval(() => {
      idx++;
      if (idx < steps.length) {
        setTestRestoreStep(steps[idx]);
      } else {
        clearInterval(interval);
        setTestRestoreRunning(false);
        triggerNotification('تم الانتهاء من اختبار الاستعادة بنجاح وتأكيد موثوقية النسخ الاحتياطية!', 'success');
      }
    }, 600);
  };

  const handleRefreshHealth = () => {
    setIsRefreshingHealth(true);
    setTimeout(() => {
      setIsRefreshingHealth(false);
      setHealthStatus({
        expressServer: 'healthy',
        postgresDb: 'healthy',
        redisCache: 'healthy',
        dnsResolution: 'healthy'
      });
      triggerNotification('اكتمل فحص الحالة الذاتي للإنتاج (Production Health Check)!', 'success');
    }, 800);
  };

  const handleRollbackAudit = (record: AuditRecord) => {
    // Simulate DB rollback
    triggerNotification(`تم تطبيق التراجع العكسي لجدول ${record.table} بنجاح! تم استعادة القيمة السابقة بنجاح.`, 'success');
    
    // Add a new audit log about this rollback
    const rollbackLog: AuditRecord = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      table: record.table,
      action: `تراجع عكسي عن العملية ${record.id}`,
      user: 'salafe10@gmail.com',
      time: new Date().toLocaleTimeString('ar-SA'),
      date: new Date().toISOString().slice(0, 10),
      ip: '197.230.45.12',
      before: record.after,
      after: record.before,
      details: `استدعاء طلب تراجع آمن (Rollback Request) للعملية الموثقة برقم ${record.id} وإعادة القيم لأصلها الصادر مسبقاً.`,
      critical: true
    };
    
    setAuditRecords(prev => [rollbackLog, ...prev]);
    setSelectedAuditRecord(null);
  };

  // Filter audit records based on search query & selected category
  const filteredAudits = auditRecords.filter(rec => {
    const matchesSearch = rec.id.includes(auditSearchQuery) || 
                          rec.table.toLowerCase().includes(auditSearchQuery.toLowerCase()) || 
                          rec.action.includes(auditSearchQuery) || 
                          rec.user.toLowerCase().includes(auditSearchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (auditFilterType === 'all') return true;
    if (auditFilterType === 'critical') return rec.critical;
    if (auditFilterType === 'financial') return rec.table === 'FUNDS_LEDGER';
    if (auditFilterType === 'auth') return rec.table === 'USER_SESSIONS';
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* Banner / Title Panel */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#1e1b4b] to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 justify-start">
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">الاعتماد الأمني النهائي</span>
              <span className="bg-[#1e1b4b] text-indigo-200 border border-indigo-500/30 text-[10px] font-black px-2.5 py-1 rounded-md">EduPro Enterprise Standard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">بوابة الأمان والجاهزية والتدقيق السحابي (Security & Audit)</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium max-w-2xl leading-relaxed text-right">
              لوحة الحوكمة والتحكم الأمني المطور للتأكد من جاهزية النظام للعمليات الكثيفة والحرجة في المدارس الكبرى. تضمن هذه الأدوات الالتزام المطلق بـ عزل المستأجرين، حماية البيانات الحساسة، التشفير الصارم، التراجع الفوري بالزمن وسير العمليات الموثق دفترياً.
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-center shrink-0 min-w-[220px]">
            <span className="text-[10px] font-black text-emerald-300 block uppercase">مستوى حماية الخوادم والـ DB</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>مؤمن بالكامل 100%</span>
            </span>
            <p className="text-[9px] text-slate-400 mt-1 font-bold">Encrypted & Audited In Real-Time</p>
          </div>
        </div>
      </div>

      {/* Grid Layout of Security Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* LEFT COLUMN: Controls & Sandboxes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Security Controls (RBAC, Multi-Tenant, Input/Output Sanitization) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50">RBAC & Isolation</span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <LockIcon className="w-5 h-5 text-indigo-500" />
                <span>أولاً: حوكمة الصلاحيات وعزل الفروع (Tenant Isolation)</span>
              </h3>
            </div>

            {/* Interactive RBAC Simulator */}
            <div className="space-y-4 text-xs font-semibold">
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-150 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold mb-2">محاكي اختبار الصلاحيات (Role-Based Access Control):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'super_admin', label: 'مدير النظام (Super Admin)', permissions: 'كامل الصلاحيات الفنية' },
                    { id: 'branch_manager', label: 'مدير فرع (Branch Manager)', permissions: 'تحكم بالفرع فقط RLS' },
                    { id: 'financial_auditor', label: 'مدقق مالي (Financial Auditor)', permissions: 'التقارير المالية والقيود' },
                    { id: 'teacher', label: 'معلم (Teacher)', permissions: 'إدخال الدرجات والغياب' }
                  ].map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setSelectedRbacRole(role.id as any);
                        triggerNotification(`تم تبديل دور المعاينة إلى: ${role.label}`, 'info');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedRbacRole === role.id 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-black text-[11px]">{role.label}</p>
                      <span className={`text-[9px] block mt-1 ${selectedRbacRole === role.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {role.permissions}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Display active RLS statement */}
                <div className="mt-3.5 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10.5px] text-indigo-300 text-left" dir="ltr">
                  <span className="text-slate-500 font-sans block text-right font-bold mb-1">Row-Level Security (RLS) Policy applied in DB:</span>
                  {selectedRbacRole === 'super_admin' && (
                    <span className="text-emerald-400">CREATE POLICY super_admin_all ON * TO super_admin USING (true); -- Full Access</span>
                  )}
                  {selectedRbacRole === 'branch_manager' && (
                    <span className="text-amber-400">CREATE POLICY branch_mgr ON school_records TO branch_mgr USING (branch_id = CURRENT_USER.branch_id); -- Isolated</span>
                  )}
                  {selectedRbacRole === 'financial_auditor' && (
                    <span className="text-sky-400">CREATE POLICY fin_auditor ON funds_ledger TO fin_auditor USING (action_type IN ('view', 'print', 'verify')); -- Restricted</span>
                  )}
                  {selectedRbacRole === 'teacher' && (
                    <span className="text-purple-400">CREATE POLICY teacher_grades ON exam_marks TO teacher USING (class_id IN (SELECT class_id FROM class_assignments WHERE teacher_id = CURRENT_USER.id));</span>
                  )}
                </div>
              </div>

              {/* Multi-Tenant Branch Separator Visualizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold block">معاينة الفصل وعزل الفروع (Tenant Isolation):</label>
                  <select
                    value={tenantId}
                    onChange={(e) => {
                      setTenantId(e.target.value);
                      triggerNotification(`تم تعيين فلتر عزل المستأجر للفرع: ${e.target.value === 'school_branch_tripoli' ? 'فرع طرابلس' : 'فرع بنغازي'}`, 'warning');
                    }}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl"
                  >
                    <option value="school_branch_tripoli">فرع طرابلس الرئيسي (Tenant #01)</option>
                    <option value="school_branch_benghazi">فرع بنغازي (Tenant #02)</option>
                  </select>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/60 text-[10px] leading-relaxed flex items-center justify-start gap-2.5 text-slate-500">
                  <ShieldAlert className="w-5 h-5 text-indigo-500 shrink-0" />
                  <p>
                    <strong>عزل معتمد:</strong> يقوم الخادم بتمرير المعرّف الفريد لكل مستأجر <code className="bg-slate-200 dark:bg-slate-900 px-1 py-0.5 rounded text-indigo-600 font-mono font-black">{tenantId}</code> في الهيدر الرئيسي لضمان استحالة تسريب أو تداخل البيانات.
                  </p>
                </div>
              </div>

              {/* Input Sanitization & Output Encoding Test Box */}
              <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-400">مختبر منع الاختراق XSS & SQL-i</span>
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-300">مطهّر المدخلات التلقائي وحماية البيانات (Sanitization Guard)</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-bold">1. مطهر XSS (Output Encoding HTML)</span>
                    <input 
                      type="text" 
                      value={inputPayload}
                      onChange={(e) => setInputPayload(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-left"
                      dir="ltr"
                    />
                    <div className="bg-slate-950 p-2 rounded-lg text-[9px] font-mono text-slate-300 select-all overflow-x-auto whitespace-pre leading-normal" dir="ltr">
                      {encodedOutput}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-bold">2. حظر حقن SQL (SQL Injection Escaper)</span>
                    <input 
                      type="text" 
                      value={sqlPayload}
                      onChange={(e) => setSqlPayload(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-left"
                      dir="ltr"
                    />
                    <div className="bg-slate-950 p-2 rounded-lg text-[9px] font-mono text-emerald-400 select-all overflow-x-auto whitespace-pre leading-normal" dir="ltr">
                      {sqlSanitized}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Production Configuration & Monitoring (Env vars, Secrets, Logs, Metrics) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/50">Production Vault</span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-500" />
                <span>ثالثاً: تهيئة الإنتاج ومراقبة بيئة العمل السحابية (Prod Environment)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              
              {/* Env Vars & Secrets Indicator */}
              <div className="sm:col-span-6 space-y-3">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">إدارة متغيرات البيئة والأسرار الحساسة (Secrets Management)</span>
                
                <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-150 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <button 
                      type="button"
                      onClick={() => {
                        setSecretsLocked(!secretsLocked);
                        triggerNotification(secretsLocked ? 'تم فتح خزانة الأسرار للمعاينة المعتمدة' : 'تم تشفير وقفل خزانة الأسرار بنجاح!', secretsLocked ? 'warning' : 'success');
                      }}
                      className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg hover:bg-indigo-100 cursor-pointer"
                    >
                      {secretsLocked ? 'عرض البيانات' : 'تشفير وحظر'}
                    </button>
                    <span className="text-slate-500 font-bold">الملف السري: .env.production</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[10px] text-slate-600 dark:text-slate-300 text-left" dir="ltr">
                    <div className="flex justify-between bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                      <span>DATABASE_URL</span>
                      <span className="font-bold text-slate-400">{secretsLocked ? '<server-managed-database-connection>' : '<server-managed-database-connection>'}</span>
                    </div>
                    <div className="flex justify-between bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                      <span>GEMINI_API_KEY</span>
                      <span className="font-bold text-slate-400">{secretsLocked ? '<server-managed-api-key>' : '<server-managed-api-key>'}</span>
                    </div>
                    <div className="flex justify-between bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                      <span>JWT_ACCESS_SECRET</span>
                      <span className="font-bold text-slate-400">{'<server-managed-jwt-secret>'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Log Level Policy */}
              <div className="sm:col-span-6 space-y-3">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">سياسة تسجيل الأحداث والأخطاء (Logging & Error Policy)</span>
                
                <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">مستوى تفاصيل التقارير (Logging Level):</label>
                    <div className="grid grid-cols-4 gap-1">
                      {['info', 'debug', 'warn', 'error'].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => {
                            setLogLevel(level as any);
                            triggerNotification(`تم تعيين مستوى تسجيل الأحداث إلى: ${level.toUpperCase()}`, 'info');
                          }}
                          className={`py-1 rounded-lg text-[9.5px] font-black uppercase text-center cursor-pointer border ${
                            logLevel === level 
                              ? 'bg-emerald-600 border-emerald-500 text-white' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 leading-normal bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    {logLevel === 'info' && <p><strong>مستوى INFO:</strong> يسجل العمليات الناجحة والمالية وتسجيل دخول الكادر بدون إرهاق التخزين السحابي.</p>}
                    {logLevel === 'debug' && <p><strong>مستوى DEBUG:</strong> يسجل جميع التفاعلات والطلبات البرمجية بالتفصيل الممل. (يوصى به للتطوير فقط).</p>}
                    {logLevel === 'warn' && <p><strong>مستوى WARN:</strong> يسجل فقط محاولات الدخول الخاطئة، الفشل في مطابقة قواعد التدقيق، ومشاكل الشبكة.</p>}
                    {logLevel === 'error' && <p><strong>مستوى ERROR:</strong> يسجل فقط الأخطاء الفادحة التي تعوق ترحيل القيود أو تعطل عمل خوادم المدرسة.</p>}
                  </div>
                </div>
              </div>

            </div>

            {/* Live Metrics Monitoring Panel */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-emerald-500 animate-pulse flex items-center gap-1.5 font-mono">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                  <span>Live Telemetry</span>
                </span>
                <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>المراقبة اللحظية للموارد (Cloud Resources Live Monitor)</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/50">
                  <span className="text-[10px] text-slate-400 font-bold block">تحميل وحدة المعالجة (CPU)</span>
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{cpuUsage}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${cpuUsage}%` }} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/50">
                  <span className="text-[10px] text-slate-400 font-bold block">استهلاك الذاكرة (RAM)</span>
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">{memoryUsage}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${memoryUsage}%` }} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/50">
                  <span className="text-[10px] text-slate-400 font-bold block">استجابة الـ Database</span>
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{dbLatency}ms</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(dbLatency * 2, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Section 3: Backup & Recovery, testing recovery, disaster recovery plan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <span className="bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-sky-100 dark:border-sky-900/50">Disaster Recovery</span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-sky-500" />
                <span>رابعاً: النسخ الاحتياطي واستعادة الكوارث (Backup & Restore Testing)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">
              
              {/* Backups List & Instant Snapshot */}
              <div className="space-y-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-2">أرشيف النسخ المشفرة للـ SQL:</span>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {backupFiles.map((file, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800/60 flex justify-between items-center text-xs">
                        <button
                          type="button"
                          onClick={() => triggerNotification(`تم توليد رابط تحميل وتصدير ملف الـ SQL بنجاح للمصرح لهم!`, 'success')}
                          className="text-[10px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 cursor-pointer"
                        >
                          SQL
                        </button>
                        <div className="text-right font-semibold">
                          <p className="font-mono text-[10.5px] font-black text-slate-700 dark:text-slate-300">{file.name}</p>
                          <span className="text-[9px] text-slate-400 block font-bold">الحجم: {file.size} • تاريخ الرفع: {file.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  {isBackingUp ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <span>جاري تجميع وتشفير جداول مدرسة الـ ERP...</span>
                        <span>{backupProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full transition-all duration-150" style={{ width: `${backupProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateBackup}
                      className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <HardDrive className="w-4 h-4" />
                      <span>توليد وأرشفة نسخة احتياطية فورية الآن 💾</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Restore Simulator */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/60 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[9px] font-black px-2 py-0.5 rounded-md">اختبار مجهري</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">الاستعادة التجريبية وعمليات الطوارئ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                    يمنع نظام التصميم المؤسسي النشر دون وجود اختبار دوري ومؤتمت لاستعادة النسخ بصورة حقيقية وتأكيد سلامة القيود.
                  </p>

                  {testRestoreRunning && (
                    <div className="mt-3.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-emerald-400 text-left" dir="ltr">
                      <p className="font-sans font-bold text-slate-400 text-right mb-1">Live Restore Check Console:</p>
                      <p className="animate-pulse">{testRestoreStep}</p>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    disabled={testRestoreRunning || isBackingUp}
                    onClick={handleTestRestore}
                    className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`w-4 h-4 ${testRestoreRunning ? 'animate-spin' : ''}`} />
                    <span>{testRestoreRunning ? 'جاري اختبار استرداد البيانات بمطابقة 100%...' : 'بدء تشغيل اختبار الاستعادة والموثوقية عملياً 🧪'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Disaster Recovery Plan Checklist */}
            <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 p-4 rounded-2xl space-y-3">
              <p className="text-xs font-black text-rose-800 dark:text-rose-400 flex items-center gap-1.5 justify-start">
                <ShieldAlert className="w-4 h-4" />
                <span>خطة الطوارئ والـ Disaster Recovery Plan (DRP):</span>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-right text-slate-600 dark:text-slate-300 font-semibold">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-100 dark:border-rose-900/20">
                  <p className="font-black text-[11px] text-slate-800 dark:text-slate-200">1. النسخ التلقائي (RPO = 15m)</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">يتم مزامنة صور الجداول والملفات السحابية على ثلاث قارات مختلفة في آن واحد لضمان استقرار العمليات.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-100 dark:border-rose-900/20">
                  <p className="font-black text-[11px] text-slate-800 dark:text-slate-200">2. الاستعادة الفورية (RTO = 5m)</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">تفعيل الخوادم البديلة (Failover Cluster) تلقائياً عند انقطاع خادم طرابلس ليدير فرع بنغازي الاتصال.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-100 dark:border-rose-900/20">
                  <p className="font-black text-[11px] text-slate-800 dark:text-slate-200">3. التدقيق اليدوي لسلامة الـ DB</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">فريق الحوكمة والتدقيق يراجع مطابقة القيود اليدوية والمقاولات في ميزان المراجعة لضمان توازن الصندوق.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Searchable Audit Trail & Deployment & Live Diagnostics (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 4: Searchable Audit Trail (ثانياً) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[9.5px] font-black px-2.5 py-0.5 rounded-full">Searchable Logs</span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-500" />
                <span>ثانياً: سجل التدقيق والعمليات المزدوج الموحد (Audit Trail)</span>
              </h3>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث برقم المعاملة، الجدول، أو البريد..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full h-10 px-3 pl-9 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-right font-semibold focus:outline-hidden"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'critical', label: 'الحرجة فقط ⚠️' },
                  { id: 'financial', label: 'الحسابات (FUNDS)' },
                  { id: 'auth', label: 'تسجيلات الدخول' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAuditFilterType(f.id as any)}
                    className={`py-1 px-2.5 rounded-lg text-[10px] font-black cursor-pointer border ${
                      auditFilterType === f.id 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {filteredAudits.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  لم يتم العثور على أي نتائج مطابقة لبحثك في سجل الحوكمة.
                </div>
              ) : (
                filteredAudits.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => {
                      setSelectedAuditRecord(rec);
                      triggerNotification(`عرض تفاصيل التدقيق لـ ${rec.id}`, 'info');
                    }}
                    className={`w-full text-right p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      selectedAuditRecord?.id === rec.id 
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500' 
                        : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 border-slate-150 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {rec.critical && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shrink-0"></span>}
                      <span className="text-[10px] font-mono text-slate-400 font-black">#{rec.id}</span>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-[9px] bg-slate-200 dark:bg-slate-850 px-1.5 py-0.5 rounded font-black text-slate-600 dark:text-slate-300">{rec.table}</span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">{rec.action}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1">بواسطة: {rec.user} • {rec.date} {rec.time}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Audit Details & Visual Before/After JSON Diff */}
            {selectedAuditRecord && (
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-3 text-xs animate-fade-in text-right">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] text-slate-400 font-mono font-bold">IP Adr: {selectedAuditRecord.ip}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">البيانات التاريخية والقيود (Before vs After):</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left font-mono text-[9px]" dir="ltr">
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-2 rounded-xl">
                    <span className="text-[9px] font-black text-rose-700 dark:text-rose-400 block mb-1">Before:</span>
                    {selectedAuditRecord.before ? (
                      <pre className="whitespace-pre-wrap font-bold">{JSON.stringify(selectedAuditRecord.before, null, 1)}</pre>
                    ) : (
                      <span className="text-slate-400 italic">سجل فارغ (جديد)</span>
                    )}
                  </div>

                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-2 rounded-xl">
                    <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 block mb-1">After:</span>
                    {selectedAuditRecord.after ? (
                      <pre className="whitespace-pre-wrap font-bold">{JSON.stringify(selectedAuditRecord.after, null, 1)}</pre>
                    ) : (
                      <span className="text-rose-600 font-black font-sans">محذوف نهائياً ✗</span>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                    <strong>سبب الإجراء:</strong> {selectedAuditRecord.details}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRollbackAudit(selectedAuditRecord)}
                  className="w-full h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>تراجع فوري عن هذا التعديل (Rollback) ↩</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 5: Deployment & CI/CD Readiness (خامساً) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/50">Deployment</span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                <span>خامساً: اختبار جاهزية النشر ومطابقة ميزان المراجعة (Deployment)</span>
              </h3>
            </div>

            {/* Health Checks Indicators */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl text-xs space-y-3 font-semibold text-right">
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  disabled={isRefreshingHealth}
                  onClick={handleRefreshHealth}
                  className="text-[9px] font-black text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingHealth ? 'animate-spin' : ''}`} />
                  <span>تحديث الفحص</span>
                </button>
                <span className="text-slate-700 dark:text-slate-300 font-bold block text-right">فحوصات الجاهزية والخدمات (Production Health Checks)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-right">
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 flex justify-between items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">1. Express Server (Port 3000)</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 flex justify-between items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">2. Postgres DB (Cloud SQL)</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 flex justify-between items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">3. Redis Session Cache</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 flex justify-between items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">4. DNS & SSL Certificate</span>
                </div>
              </div>
            </div>

            {/* Startup Diagnostics Console */}
            <div className="space-y-2">
              <span className="text-[11px] text-slate-400 font-bold block text-right">سجل التحقق عند بدء التشغيل (Startup Diagnostics Log):</span>
              
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 text-left space-y-1.5" dir="ltr">
                {startupValidationResults.map((res, i) => (
                  <p key={i} className="flex justify-between">
                    <span>Passed ✓</span>
                    <span>{res}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Quick CI/CD Deployment Checklist */}
            <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 p-3.5 rounded-2xl text-[11px] leading-relaxed font-semibold text-indigo-950 dark:text-indigo-200 space-y-2 text-right">
              <p className="font-black text-xs text-indigo-700 dark:text-indigo-400 mb-1">قائمة تدقيق الإطلاق السحابي والـ Migrations:</p>
              <div className="space-y-1.5">
                <p className="flex items-center gap-2 justify-start">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>تطبيق الـ DB Migrations بصورة متوافقة رجعياً لمنع فقدان البيانات المحاسبية القديمة.</span>
                </p>
                <p className="flex items-center gap-2 justify-start">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>اختبار خطة التراجع السريع (Rollback Plan) عبر تجميد البناء والعودة لآخر صورة مستقرة.</span>
                </p>
                <p className="flex items-center gap-2 justify-start">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>قنوات الحماية مشفرة تماماً بالـ TLS 1.3 مع حجب المنافذ غير الآمنة من الجدار الناري.</span>
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
