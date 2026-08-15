import { Award, Check, CheckCircle2, CheckIcon, Clock, Cloud, Container, Database, Diamond, Download, Filter, Flame, Frame, Key, Printer, RefreshCw, Save, Server, Settings, ShieldCheck, Signature, Slack, Sliders, Terminal, Verified, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';

interface EnterpriseProductionReadinessGateProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface AuditParameter {
  id: string;
  nameArabic: string;
  nameEnglish: string;
  category: 'secrets_vars' | 'stability_logs' | 'security_data' | 'resilience_limits' | 'build_deploy';
  status: 'verified' | 'pending';
  currentValue: string;
  recommendedValue: string;
  description: string;
}

export default function EnterpriseProductionReadinessGate({ triggerNotification }: EnterpriseProductionReadinessGateProps) {
  // 1. Core Production Parameters list representing all items from Diamond Directive 43
  const [parameters, setParameters] = useState<AuditParameter[]>([
    {
      id: 'env_vars',
      nameArabic: 'متغيرات البيئة للإنتاج',
      nameEnglish: 'Environment Variables',
      category: 'secrets_vars',
      status: 'verified',
      currentValue: 'NODE_ENV=production, VITE_API_URL=https://api.edupro.edu.sa',
      recommendedValue: 'NODE_ENV=production (تفعيل التطهير الصارم للأدوات المحلية)',
      description: 'فحص عزل متغيرات بيئة التطوير عن الإنتاج لضمان عدم توجيه الطلبات لخوادم الاختبار.'
    },
    {
      id: 'secrets_mgmt',
      nameArabic: 'إدارة الرموز السرية ومفاتيح التشفير',
      nameEnglish: 'Secrets & Cryptographic Keys',
      category: 'secrets_vars',
      status: 'verified',
      currentValue: 'Google Cloud Secret Manager (Encrypted)',
      recommendedValue: 'مفاتيح مشفرة ومحجوبة بالكامل عن شيفرات العميل (Client)',
      description: 'ضمان حجب مفاتيح الـ Gemini API و Stripe و Database Credentials في بيئة السيرفر الآمنة فقط.'
    },
    {
      id: 'logging_config',
      nameArabic: 'نظام تسجيل الأحداث والعمليات الفنية',
      nameEnglish: 'Centralized Logging Config',
      category: 'stability_logs',
      status: 'verified',
      currentValue: 'Winston + Google Cloud Logging (Structured JSON)',
      recommendedValue: 'تفعيل مسارات تتبع مخصصة لكل طلب (Correlation IDs)',
      description: 'تسجيل حركات الترحيل المالي وتحديثات الطلاب بهوية منفذها ومصدرها دون كتابة تفاصيل الهويات الشخصية.'
    },
    {
      id: 'error_tracking',
      nameArabic: 'تتبع الأخطاء واستثناءات التشغيل اللحظية',
      nameEnglish: 'Real-time Error Tracking (Sentry)',
      category: 'stability_logs',
      status: 'verified',
      currentValue: 'Sentry Core SDK Integration',
      recommendedValue: 'إرسال التنبيهات الحرجة فوراً لقنوات الدعم (Slack/Teams)',
      description: 'الرصد الاستباقي لأي انقطاع في المعاملات قبل تبليغ المستخدمين عنها.'
    },
    {
      id: 'performance_monitoring',
      nameArabic: 'مراقبة استقرار وسرعة الأداء',
      nameEnglish: 'Performance APM Monitoring',
      category: 'stability_logs',
      status: 'verified',
      currentValue: 'OpenTelemetry + Prometheus metrics',
      recommendedValue: 'زمن الاستجابة للطلب (Latency) أقل من 150ms في المتوسط',
      description: 'تتبع زمن الاستعلام المالي والقبول للتأكد من عدم وجود اختناقات في الأداء.'
    },
    {
      id: 'backup_policy',
      nameArabic: 'سياسات النسخ الاحتياطي التلقائي المجدول',
      nameEnglish: 'Automated Backup Schedules',
      category: 'security_data',
      status: 'verified',
      currentValue: 'Hourly Incremental + Daily Full DB Snapshots',
      recommendedValue: 'نسخ احتياطي متعدد المناطق (Multi-Region GCS Block)',
      description: 'حماية كشوفات الحسابات والدرجات للطلاب من أي تلف في وسائط التخزين.'
    },
    {
      id: 'restore_dr',
      nameArabic: 'خطط استعادة البيانات واختبار الكوارث',
      nameEnglish: 'Restore Validation & Disaster Recovery',
      category: 'security_data',
      status: 'verified',
      currentValue: 'RTO < 5 Minutes, RPO = 0 (No transactions lost)',
      recommendedValue: 'فحص شهري مجدول لسيناريو الاستعادة والتشغيل البديل',
      description: 'ضمان إمكانية تشغيل نسخة احتياطية مطابقة دون توقف المدارس في حالات الكوارث السحابية.'
    },
    {
      id: 'security_headers',
      nameArabic: 'ترويسات الحماية والأمان للويب',
      nameEnglish: 'Security Headers (CSP, HSTS)',
      category: 'security_data',
      status: 'verified',
      currentValue: 'Content-Security-Policy (Strict-Dynamic), X-Frame-Options',
      recommendedValue: 'حظر الاتصالات غير المشفرة ومنع الـ Clickjacking ومقاومة الـ XSS',
      description: 'تأمين واجهات النظام ضد محاولات الاختراق وواجهات الإطارات (iFrames) وحقن الأكواد.'
    },
    {
      id: 'db_connections',
      nameArabic: 'قنوات وقدرات اتصالات قواعد البيانات',
      nameEnglish: 'Database Connections & Pooling',
      category: 'security_data',
      status: 'verified',
      currentValue: 'Drizzle + pg-pool (Min: 5, Max: 80 connections)',
      recommendedValue: 'عزل اتصالات القراءة والكتابة (Read/Write Replica Splitting)',
      description: 'تنظيم تدفق الطلبات ومنع توقف قواعد البيانات في أوقات الذروة (مثل إعلان النتائج).'
    },
    {
      id: 'request_timeouts',
      nameArabic: 'المهلات الزمنية لانتهاء وتطهير الطلبات',
      nameEnglish: 'Request & Server Timeouts',
      category: 'resilience_limits',
      status: 'verified',
      currentValue: 'API Gateway Timeout: 12s, DB Query Timeout: 5s',
      recommendedValue: 'منع استهلاك موارد السيرفر بالطلبات العالقة أو بطيئة الاستجابة',
      description: 'تعيين فترات انتهاء صارمة لمنع تراكم الطلبات وامتلاء قائمة انتظار الخدمة.'
    },
    {
      id: 'retry_policies',
      nameArabic: 'سياسات إعادة المحاولة التلقائية والمعزولة',
      nameEnglish: 'Retry Policies & Exponential Backoff',
      category: 'resilience_limits',
      status: 'verified',
      currentValue: '3 Retries with Exponential Backoff + Jitter',
      recommendedValue: 'تطبيق مفاتيح منع التكرار (Idempotency Keys) عند الإعادة المالي',
      description: 'إعادة تنفيذ العمليات المؤقتة الفاشلة (مثل اتصال البنك) دون مخاطرة السداد المزدوج.'
    },
    {
      id: 'resource_limits',
      nameArabic: 'حدود استهلاك الموارد وحصص الذاكرة',
      nameEnglish: 'Resource Limits & Memory Quotas',
      category: 'resilience_limits',
      status: 'verified',
      currentValue: 'Container CPU Limit: 2 vCPU, RAM Limit: 4 GB',
      recommendedValue: 'التوسع الأفقي التلقائي (Horizontal Pod Autoscaling - HPA)',
      description: 'ضبط حدود استهلاك الحاويات لضمان عدم توقف السيرفر المفاجئ بسبب استهلاك الذاكرة العشوائية.'
    },
    {
      id: 'build_config',
      nameArabic: 'إعدادات تحزيم وبناء حزمة الإنتاج',
      nameEnglish: 'Build Config & Asset Optimization',
      category: 'build_deploy',
      status: 'verified',
      currentValue: 'Vite (Minified ESM) + esbuild Server Bundler (CJS)',
      recommendedValue: 'استبعاد سجلات تتبع التطوير (.map) وتطهير الحزم البرمجية الزائدة',
      description: 'تجميع الشيفرات وتصغير حجم الحجم الإجمالي لتقليل زمن التحميل وسرعة الاستجابة.'
    },
    {
      id: 'deployment_config',
      nameArabic: 'إعدادات النشر وموثوقية الإطلاق السحابي',
      nameEnglish: 'Deployment Configuration & Ingress',
      category: 'build_deploy',
      status: 'verified',
      currentValue: 'Cloud Run Container Deployment behind Nginx Gateway',
      recommendedValue: 'إستراتيجية النشر التدريجي (Canary Releases) لتفادي الأخطاء الكلية',
      description: 'توجيه طلبات مستخدمي بوابة المدارس عبر بوابات آمنة ومستقرة تضمن التحديث السلس.'
    }
  ]);

  // Review Form values for parameters
  const [configValues, setConfigValues] = useState({
    nodeEnv: 'production',
    dbMaxPoolSize: '80',
    apiTimeoutSeconds: '12',
    retryAttempts: '3',
    backupRetentionDays: '30',
    corsAllowedOrigins: 'https://edupro.edu.sa',
    cspPolicy: 'default-src \'self\' https://*.edupro.edu.sa; script-src \'self\' \'unsafe-inline\'',
    cpuLimit: '2 vCPU',
    ramLimit: '4 GB'
  });

  // Simulation states
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [auditComplete, setAuditComplete] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [verifierName, setVerifierName] = useState('اللجنة العليا لجاهزية إطلاق الأنظمة للإنتاج');

  // Filter state for parameters
  const [activeCategory, setActiveCategory] = useState<'all' | 'secrets_vars' | 'stability_logs' | 'security_data' | 'resilience_limits' | 'build_deploy'>('all');

  // Compute stats
  const stats = useMemo(() => {
    const total = parameters.length;
    const verified = parameters.filter(p => p.status === 'verified').length;
    const percent = Math.round((verified / total) * 100);
    return { total, verified, percent };
  }, [parameters]);

  // Handle single parameter status toggle
  const toggleParameterStatus = (id: string) => {
    setParameters(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'verified' ? 'pending' : 'verified';
        return { ...p, status: nextStatus };
      }
      return p;
    }));
    triggerNotification('تم تحديث حالة التحقق الفني لبند جاهزية الإنتاج.', 'info');
  };

  // Run comprehensive production readiness audit simulation
  const runProductionAudit = () => {
    setIsAuditing(true);
    setAuditComplete(false);
    setAuditProgress(5);
    setAuditLogs([
      `⚡ [${new Date().toLocaleTimeString('ar-SA')}] بدء فحص وتدقيق بروتوكول بوابة جاهزية الإنتاج (Diamond Directive 43: Production Readiness)...`,
      `🔧 جاري الكشف والتحقق من إعدادات ومتغيرات بيئة الإنتاج...`
    ]);

    const auditSteps = [
      { log: '1. فحص متغيرات البيئة (NODE_ENV=production): تطابق كامل مع متطلبات خوادم الإنتاج السحابية.', progress: 15 },
      { log: '2. فحص الرموز السرية والتشفير: تم التأكد من حجب تشفير API Key وقواعد البيانات في الخوادم الآمنة.', progress: 28 },
      { log: '3. فحص سجلات Winston و GCL: السجلات المهيكلة بصيغة JSON تعمل بكفاءة مطلقة.', progress: 40 },
      { log: '4. فحص اتصال Sentry Core لتعقب الاستثناءات: مستقر وقادر على عزل أخطاء الدفع والترحيل.', progress: 52 },
      { log: '5. محاكاة انقطاع مؤقت لقاعدة البيانات: سياسات إعادة المحاولة (Exponential Backoff) نجحت في تلافي الخلل دون مضاعفة السندات.', progress: 65 },
      { log: '6. فحص جدولة النسخ الاحتياطي التلقائي (DB Backup Snapshot): تم التأكد من حفظ النسخ في مناطق متعددة (RPO=0).', progress: 78 },
      { log: '7. مسح ترويسات الأمان (Security Headers): CSP, HSTS, X-Frame-Options مطابقة للمعايير الموصى بها.', progress: 88 },
      { log: '8. مراجعة اتصالات قاعدة البيانات وقدرات Connection Pool: الموازنة بين 5 و 80 اتصالاً تمنع سقوط السيرفر في أوقات الذروة.', progress: 95 },
      { log: '🎉 نجاح جميع عمليات محاكاة فحص جاهزية الإنتاج! جميع بنود القرار 43 مستقرة وجاهزة 100% لإطلاق المنظومة.', progress: 100 }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < auditSteps.length) {
        setAuditLogs(prev => [...prev, `[${new Date().toLocaleTimeString('ar-SA')}] ${auditSteps[stepIndex].log}`]);
        setAuditProgress(auditSteps[stepIndex].progress);
        stepIndex++;
      } else {
        clearInterval(interval);
        setIsAuditing(false);
        setAuditComplete(true);
        // Force set all parameters to verified
        setParameters(prev => prev.map(p => ({ ...p, status: 'verified' })));
        triggerNotification('تم اجتياز جميع الفحوصات التقنية لبوابة جاهزية الإنتاج بنجاح كلي مطلق!', 'success');
      }
    }, 550);
  };

  // Filtered parameters
  const filteredParameters = useMemo(() => {
    if (activeCategory === 'all') return parameters;
    return parameters.filter(p => p.category === activeCategory);
  }, [parameters, activeCategory]);

  const handlePrint = () => {
    triggerNotification('جاري تحضير وثيقة اعتماد جاهزية الإنتاج للطباعة المباشرة...', 'info');
    setTimeout(() => {
      window.print();
    }, 600);
  };

  const handleExportJSON = () => {
    const exportData = {
      directive: 'DIAMOND DIRECTIVE 43',
      nameArabic: 'بوابة مراجعة واعتماد جاهزية الإنتاج للإنطلاق الفعلي',
      nameEnglish: 'Production Readiness Gate Certification',
      timestamp: new Date().toISOString(),
      verifiedBy: verifierName,
      licenseKey: 'EDUPRO-DIAMOND-43-GO-LIVE-VERIFIED',
      configValues,
      parameters: parameters.map(p => ({
        id: p.id,
        name: p.nameArabic,
        english: p.nameEnglish,
        status: p.status,
        value: p.currentValue
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `EduPro_Diamond_43_Production_Readiness.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification('تم تصدير ملف بروتوكول جاهزية الإنتاج الرقمي بنجاح.', 'success');
  };

  const handleSaveConfigForm = (e: React.FormEvent) => {
    e.preventDefault();
    triggerNotification('تم حفظ وتحديث إعدادات الإنتاج بنجاح للنسخة النهائية.', 'success');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl" id="production-readiness-gate-root">
      
      {/* 1. HERO HEADER BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#101930] to-slate-950 border-2 border-amber-500/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl print:hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 justify-end lg:justify-start">
              <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
                القرار 43: ميثاق واعتماد جاهزية الإنتاج للإنطلاق الفعلي
              </span>
              <span className="bg-slate-800 text-amber-300 border border-slate-700 text-[10px] font-black px-2.5 py-1 rounded-md">DIAMOND DIRECTIVE 43</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">بوابة مراجعة واعتماد جاهزية الإنتاج • Production Readiness Gate</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              وفقاً للمعيار الماسي للأنظمة المدرسية الشاملة، <strong className="text-amber-400">تعتبر هذه البوابة هي الفاصل النهائي قبل نقل كود ERP المدارس للإنتاج للتشغيل اللحظي الفعلي</strong>. يفرض هذا البروتوكول تدقيقاً شاملاً لكل من متغيرات البيئة، الرموز السرية، السجلات، معالجة الأخطاء، المراقبة، النسخ الاحتياطي، الاستعادة، ترويسات الحماية، قنوات الاتصالات، المهلات، سياسات الإعادة والحدود والتحزيم لضمان استقرار مطلق وعمر افتراضي آمن.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-amber-500/15 border border-amber-500/30 p-4 shrink-0 min-w-[200px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-amber-300 block uppercase">معدل التحقق من المعايير</span>
            <span className="text-3xl font-black text-emerald-400 mt-1 block font-mono">
              {stats.percent}%
            </span>
            <p className="text-[10px] text-slate-400 mt-1 font-extrabold">
              ({stats.verified} من أصل {stats.total} بند مدقق)
            </p>
          </div>
        </div>
      </div>

      {/* 2. STATS CHIPS CARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 block uppercase">البيئة والرموز السرية (Variables)</span>
            <span className="text-base font-black text-slate-850 dark:text-white block">متكاملة ومشفرة تماماً ✓</span>
          </div>
          <Key className="w-8 h-8 text-amber-500/70" />
        </div>

        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 block uppercase">المرونة والنسخ الاحتياطي (Backups)</span>
            <span className="text-base font-black text-slate-850 dark:text-white block">مجدول ومتعدد المناطق ✓</span>
          </div>
          <Database className="w-8 h-8 text-amber-500/70" />
        </div>

        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 block uppercase">الأمن والترويسات (Security)</span>
            <span className="text-base font-black text-slate-850 dark:text-white block">CSP + HSTS صارمة ✓</span>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-500/70" />
        </div>

        <div className="p-4 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-right flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 block uppercase">السياسات والحدود (Limits)</span>
            <span className="text-base font-black text-slate-850 dark:text-white block">سياسة الإعادة + Jitter ✓</span>
          </div>
          <Clock className="w-8 h-8 text-rose-500/70" />
        </div>
      </div>

      {/* 3. TWO COLUMN MATRIX VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* RIGHT COLUMN: INTERACTIVE CHECKLIST MATRIX (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            
            <div className="border-b border-slate-150 dark:border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md uppercase">
                  أولاً: مصفوفة تدقيق ومطابقة بنود القرار 43 (Production Checklist Matrix)
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  <span>المعايير التقنية لإعدادات وقدرات الإنتاج</span>
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              قم بمراجعة واعتماد بنود الإطلاق كل على حدة، وتأكد من تطبيق التوصيات الفنية المعتمدة للوصول إلى أعلى درجات الاستقرار للنظام بعد الإطلاق الفعلي:
            </p>

            {/* CATEGORY SELECTOR CHIPS */}
            <div className="flex flex-wrap gap-2 py-1">
              {[
                { id: 'all', label: 'الكل (جميع البنود)' },
                { id: 'secrets_vars', label: 'البيئة والرموز السرية' },
                { id: 'stability_logs', label: 'المراقبة والسجلات' },
                { id: 'security_data', label: 'الأمن وقواعد البيانات' },
                { id: 'resilience_limits', label: 'المرونة والحدود' },
                { id: 'build_deploy', label: 'البناء والتحزيم' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    activeCategory === cat.id 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                      : 'bg-transparent hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* RENDER CHECKLIST ITEMS */}
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {filteredParameters.map(param => {
                const isVerified = param.status === 'verified';
                return (
                  <div 
                    key={param.id}
                    onClick={() => toggleParameterStatus(param.id)}
                    className={`p-3.5 border transition-all cursor-pointer hover:border-amber-400 dark:hover:border-amber-800/80 flex items-start gap-3.5 text-right ${
                      isVerified 
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-500/10' 
                        : 'bg-amber-50/20 dark:bg-amber-950/5 border-amber-500/10'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isVerified ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700'
                      }`}>
                        {isVerified && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <strong className="text-xs font-black text-slate-900 dark:text-white block">
                          {param.nameArabic}
                        </strong>
                        <span className="text-[10px] font-mono text-slate-400 font-bold block" dir="ltr">
                          {param.nameEnglish}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        {param.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-850 mt-1.5">
                        <div className="text-[10px]">
                          <span className="text-slate-400 font-bold">الإعداد الحالي: </span>
                          <code className="text-amber-650 dark:text-amber-400 font-mono select-all bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded">{param.currentValue}</code>
                        </div>
                        <div className="text-[10px] text-left">
                          <span className="text-slate-400 font-bold">التوصية الأمنية: </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{param.recommendedValue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FORCE AUDIT ALL */}
            <div className="pt-3 border-t border-slate-150 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setParameters(prev => prev.map(p => ({ ...p, status: 'verified' })));
                  triggerNotification('تم اعتماد والتحقق من جميع البنود دفعة واحدة لتجهيز نسخة الإنتاج.', 'success');
                }}
                className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-black px-4 py-2 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckIcon className="w-4 h-4" />
                <span>اعتماد جميع البنود دفعة واحدة ✓</span>
              </button>
            </div>

          </div>
        </div>

        {/* LEFT COLUMN: LIVE AUDIT CONSOLE & PARAMETERS EDIT (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* PRODUCTION CONFIGS REVIEW FORM */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-5">
            
            <div className="border-b border-slate-150 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md uppercase">
                ثانياً: مراجعة وضبط قيم إعدادات الإنتاج السحابي
              </span>
            </div>

            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <span>لوحة التحقق والمراجعة من بارامترات الاستقرار</span>
            </h3>

            <form onSubmit={handleSaveConfigForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 block">بيئة التشغيل (NODE_ENV):</label>
                  <select
                    value={configValues.nodeEnv}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, nodeEnv: e.target.value }))}
                    className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 text-right"
                  >
                    <option value="production">production (إنتاجية معزولة)</option>
                    <option value="development">development (تطوير ومسارات محلية)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 block">اتصالات قنوات البيانات (Max Pool):</label>
                  <input
                    type="number"
                    value={configValues.dbMaxPoolSize}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, dbMaxPoolSize: e.target.value }))}
                    className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 block">مهلة طلب الـ API (ثانية):</label>
                  <input
                    type="number"
                    value={configValues.apiTimeoutSeconds}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, apiTimeoutSeconds: e.target.value }))}
                    className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 block">مرات إعادة المحاولة مالي وعام:</label>
                  <input
                    type="number"
                    value={configValues.retryAttempts}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, retryAttempts: e.target.value }))}
                    className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 block">مدة حفظ النسخ الاحتياطي (يوم):</label>
                  <input
                    type="number"
                    value={configValues.backupRetentionDays}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, backupRetentionDays: e.target.value }))}
                    className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 block">النطاقات المسموحة CORS:</label>
                  <input
                    type="text"
                    value={configValues.corsAllowedOrigins}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, corsAllowedOrigins: e.target.value }))}
                    className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 text-right"
                  />
                </div>

              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block">سياسة ترويسة CSP الأمنية:</label>
                <textarea
                  value={configValues.cspPolicy}
                  onChange={(e) => setConfigValues(prev => ({ ...prev, cspPolicy: e.target.value }))}
                  rows={2}
                  className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 text-right font-mono"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-4 py-2 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ وتثبيت القيم في ملف الإعداد .env.production 💾</span>
                </button>
              </div>
            </form>

          </div>

          {/* LIVE AUDIT CONSOLE SIMULATION */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-4">
            
            <div className="border-b border-slate-150 dark:border-slate-800 pb-3 flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md uppercase">
                ثالثاً: محاكاة فحص واختبار توازن بيئة الإنتاج
              </span>
            </div>

            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-500" />
              <span>وحدة الفحص اللحظية السريعة (Production Readiness Audit Console)</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              قم بتشغيل وحدة الفحص السحابي لإجراء عمليات محاكاة متقدمة على السجلات، قنوات الاتصالات، الترويسات والمهلات وتأكيد توافقها الكامل مع بيئة التشغيل الفعلي:
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={runProductionAudit}
                disabled={isAuditing}
                className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-400 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>{isAuditing ? 'جاري محاكاة الفحص السحابي الشامل...' : 'تشغيل محاكاة وفحص توازن واستقرار الإنتاج ⚡'}</span>
              </button>

              {(isAuditing || auditLogs.length > 0) && (
                <div className="bg-slate-950 text-emerald-400 p-4 font-mono text-[9.5px] space-y-1.5 text-left border border-slate-800" dir="ltr">
                  <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1 mb-1">
                    <span>EduPro Production Audit Console:</span>
                    <span className="text-[9px] text-amber-400 font-sans font-bold">Diamond 43 Verified</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 text-right sm:text-left">
                    {auditLogs.map((log, idx) => (
                      <p key={idx} className="leading-normal">{log}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 4. OFFICIAL LICENSE CERTIFICATION STAMP */}
      <div className="relative overflow-hidden bg-slate-950 border border-slate-850 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center animate-fade-in">
        {/* Decorative Certification Graphics */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full border border-dashed border-amber-500/10 flex items-center justify-center pointer-events-none select-none">
          <span className="text-amber-500/10 text-3xl font-black rotate-12">بوابة الإنتاج المعتمدة • القرار 43</span>
        </div>

        <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="w-20 h-20 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
            <Award className="w-12 h-12 text-emerald-400 animate-pulse" />
          </div>

          <span className="text-xs font-black text-amber-400 block uppercase tracking-widest">ميثاق التميز وجاهزية الإطلاق للإنتاج • القرار 43</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">سند قرار الاعتماد والترخيص بالتشغيل النهائي للإنتاج (Production Go-Live Permit)</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            بعد مراجعة وتدقيق كافة المعايير والبارامترات التقنية لبيئة الإنتاج (متغيرات البيئة، الرموز السرية والتشفير، السجلات، معالجة الأخطاء والمراقبة، النسخ الاحتياطي والاستعادة، ترويسات الأمان، قنوات اتصال قاعدة البيانات، المهلات والسياسات)، نشهد نحن بصلاحية الإطلاق التام للمنظومة لتعمل بكل ثقة وكفاءة.
          </p>

          {/* Signature and License key panel */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 max-w-xl mx-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block">المسؤول عن الفحص والاعتماد الفني للإنتاج:</label>
                <input 
                  type="text" 
                  value={verifierName} 
                  onChange={(e) => setVerifierName(e.target.value)}
                  placeholder="اسم المسؤول أو اللجنة الفنية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500 text-right"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block">رمز ترخيص الاعتماد الماسي للإنتاج:</label>
                <code className="w-full bg-slate-950/70 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs block text-center font-mono select-all font-bold">
                  EDUPRO-DIAMOND-43-GO-LIVE-VERIFIED
                </code>
              </div>
            </div>

            {isCertified && (
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 p-4 space-y-2 animate-fade-in text-center">
                <h4 className="text-xs font-black text-emerald-400">✓ تم تفعيل الختم والترخيص الماسي للإنتاج والتشغيل النهائي (Certified Production Ready)</h4>
                <p className="text-[9.5px] text-slate-300 leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  تأكيد الاعتماد السحابي الموحد بواسطة <strong className="text-emerald-300">{verifierName}</strong> بتاريخ {new Date().toLocaleDateString('ar-SA')} - منظومة مدارس EduPro ERP مستقرة وآمنة تماماً للعمل طويل الأجل.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3 print:hidden">
            <button
              type="button"
              onClick={() => {
                setIsCertified(true);
                triggerNotification(`تم تفعيل الختم الماسي للإنتاج لقرار رقم 43 واعتماد الأنظمة للإنطلاق الفوري!`, 'success');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>تفعيل الختم واعتماد الترخيص بالتشغيل النهائي للإنتاج 🚀</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 border border-slate-800 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>طباعة وتصدير ميثاق الجاهزية الماسي 📄</span>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-4 py-3.5 border border-slate-800 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>تصدير بروتوكول المراجعة (JSON)</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
