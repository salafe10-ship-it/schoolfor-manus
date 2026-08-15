import { AlertCircle, AlertTriangle, BarChart3, Check, CheckCircle, CheckSquare, Code, Code2, Component, Construction, Container, Cpu, Database, FileText, GitFork, Layers, Leaf, Lock as LockIcon, Minimize2, Navigation, Network, Play, Plus, RefreshCw, ShieldCheck, Sparkles, Table, Target, Terminal } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// ==========================================
// TYPINGS & DATA STRUCTURES FOR DI
// ==========================================
export type LifetimeType = 'Singleton' | 'Scoped' | 'Transient';

export interface ServiceDescriptor {
  id: string;
  name: string;
  interfaceName: string;
  lifetime: LifetimeType;
  dependencies: string[]; // list of Service ID dependencies
  implementationClass: string;
  isRegistered: boolean;
  module: 'Financial' | 'Security' | 'Core' | 'Infrastructure' | 'Academic';
  descriptionEn: string;
  descriptionAr: string;
}

export interface AntiPatternFinding {
  id: string;
  type: 'circular_dependency' | 'service_locator' | 'direct_infrastructure' | 'construction_inside_domain';
  severity: 'critical' | 'high' | 'medium';
  titleEn: string;
  titleAr: string;
  locationEn: string;
  locationAr: string;
  descriptionEn: string;
  descriptionAr: string;
  codeSnippetBefore: string;
  codeSnippetAfter: string;
  isResolved: boolean;
}

// Initial Registered Services
const INITIAL_SERVICES: ServiceDescriptor[] = [
  {
    id: 'db-pool',
    name: 'DatabaseConnectionPool',
    interfaceName: 'IDbConnectionPool',
    lifetime: 'Singleton',
    dependencies: [],
    implementationClass: 'PostgresConnectionPool',
    isRegistered: true,
    module: 'Infrastructure',
    descriptionEn: 'Provides centralized thread-safe connection pooling to primary PostgreSQL cluster.',
    descriptionAr: 'يوفر تجميعاً مركزياً آمناً للاتصالات بقاعدة بيانات بوستجرس الأساسية.'
  },
  {
    id: 'audit-logger',
    name: 'AuditLoggerService',
    interfaceName: 'IAuditLogger',
    lifetime: 'Singleton',
    dependencies: ['db-pool'],
    implementationClass: 'SiemCompliantAuditLogger',
    isRegistered: true,
    module: 'Security',
    descriptionEn: 'Structured logger writing JSON entries matching Directive #021 to SIEM.',
    descriptionAr: 'خادم التسجيل المهيكل لكتابة السجلات المتوافقة مع معايير SIEM والقرار #021.'
  },
  {
    id: 'tenant-mgr',
    name: 'TenantManager',
    interfaceName: 'ITenantManager',
    lifetime: 'Scoped',
    dependencies: ['db-pool'],
    implementationClass: 'EnterpriseTenantManager',
    isRegistered: true,
    module: 'Core',
    descriptionEn: 'Validates and isolates tenant-specific routing, DB schemas and subdomains.',
    descriptionAr: 'التحقق وعزل البيانات ومسارات المستأجرين (Multi-Tenancy) في السيرفر.'
  },
  {
    id: 'academic-year',
    name: 'AcademicYearProvider',
    interfaceName: 'IAcademicYearProvider',
    lifetime: 'Scoped',
    dependencies: ['tenant-mgr'],
    implementationClass: 'HijriGregorianYearProvider',
    isRegistered: true,
    module: 'Academic',
    descriptionEn: 'Provides Hijri-Gregorian academic cycle alignment depending on school tenant location.',
    descriptionAr: 'مزود التقويم الدراسي الهجري والميلادي بحسب النطاق الجغرافي للمستأجر.'
  },
  {
    id: 'auth-service',
    name: 'AuthenticationService',
    interfaceName: 'IAuthService',
    lifetime: 'Scoped',
    dependencies: ['db-pool', 'audit-logger', 'tenant-mgr'],
    implementationClass: 'MinistrySsoAuthService',
    isRegistered: true,
    module: 'Security',
    descriptionEn: 'Validates credentials and single-sign-on tokens with active security checks.',
    descriptionAr: 'إدارة وتوثيق جلسات ومصادقة المستخدمين بالتكامل مع النفاذ الوطني الموحد.'
  },
  {
    id: 'salary-calculator',
    name: 'SalaryDisbursementService',
    interfaceName: 'ISalaryDisbursement',
    lifetime: 'Transient',
    dependencies: ['db-pool', 'audit-logger', 'auth-service', 'academic-year'],
    implementationClass: 'SaudiWageProtectionDisbursement',
    isRegistered: true,
    module: 'Financial',
    descriptionEn: 'Processes granular payroll, calculates allowances, and interfaces with Wage Protection System (WPS).',
    descriptionAr: 'معالجة صرف الرواتب وحساب البدلات بالتكامل مع نظام حماية الأجور السعودي.'
  },
  {
    id: 'email-sender',
    name: 'NotificationDispatcher',
    interfaceName: 'INotificationDispatcher',
    lifetime: 'Transient',
    dependencies: ['audit-logger'],
    implementationClass: 'SmtpSecureDispatcher',
    isRegistered: false, // Starts as unregistered to simulate scanning and registration refactoring
    module: 'Infrastructure',
    descriptionEn: 'Handles automated notification dispatching through government secure SMS/email relays.',
    descriptionAr: 'بوابة إرسال التنبيهات والرسائل النصية والبريدية المشفرة للشركاء.'
  }
];

// Anti-patterns discovered in the codebase (before registration)
const INITIAL_FINDINGS: AntiPatternFinding[] = [
  {
    id: 'anti-1',
    type: 'circular_dependency',
    severity: 'critical',
    titleEn: 'Circular Dependency Loop Detected',
    titleAr: 'حلقة اعتماد دائرية مغلقة بين الخدمات',
    locationEn: '/src/services/AuthService.ts ↔ /src/services/SecurityAuditService.ts',
    locationAr: '/src/services/AuthService.ts ↔ /src/services/SecurityAuditService.ts',
    descriptionEn: 'AuthenticationService depends on AuditLogger, which depends on AuthorizationService, which depends back on AuthenticationService. This causes stack overflows at container resolve time.',
    descriptionAr: 'تعتمد خدمة المصادقة على خدمة تدقيق السجلات، وتعتمد الأخيرة على خدمة الصلاحيات، والتي بدورها تعود لتعتمد على خدمة المصادقة، مما يسبب انهيار الذاكرة (Stack Overflow).',
    codeSnippetBefore: `// ❌ Tight circular loop at constructor load
export class AuthenticationService {
  constructor(private audit: AuditLoggerService) {}
}
export class AuditLoggerService {
  constructor(private authz: AuthorizationService) {}
}
export class AuthorizationService {
  constructor(private auth: AuthenticationService) {} // 🔁 Circular reference!
}`,
    codeSnippetAfter: `// ✅ Refactored using Events or Mid-layer Resolution
export class AuthenticationService implements IAuthService {
  constructor(private audit: IAuditLogger) {}
}
export class AuditLoggerService implements IAuditLogger {
  constructor(private db: IDbConnectionPool) {} // Decoupled authz via direct event pipeline
}`,
    isResolved: false
  },
  {
    id: 'anti-2',
    type: 'direct_infrastructure',
    severity: 'critical',
    titleEn: 'Direct Infrastructure Creation (Tightly Coupled)',
    titleAr: 'إنشاء هياكل البنية التحتية بشكل مباشر داخل منطق العمل',
    locationEn: '/src/controllers/FinancialController.ts',
    locationAr: '/src/controllers/FinancialController.ts',
    descriptionEn: 'Direct instantiation of PostgreSQL Pool class within the FinancialController, bypassing the centralized database pool and leaking database credentials.',
    descriptionAr: 'إنشاء كائن اتصال بقاعدة البيانات (new Pool) بشكل مباشر ومحلي داخل وحدة التحكم المالية، مما يعطل تجميع الاتصالات المشترك ويسرب الكلمات السرية.',
    codeSnippetBefore: `// ❌ Hardcoded direct infrastructure construction
export class FinancialController {
  private pool: Pool;
  constructor() {
    this.pool = new Pool({
      connectionString: "<server-side-connection-string>"
    }); // ❌ Direct infrastructure instantiation!
  }
}`,
    codeSnippetAfter: `// ✅ Resolved: Pool injected as IDbConnectionPool Singleton via DI
export class FinancialController {
  constructor(
    @Inject('IDbConnectionPool') private pool: IDbConnectionPool,
    @Inject('IAuditLogger') private audit: IAuditLogger
  ) {}
}`,
    isResolved: false
  },
  {
    id: 'anti-3',
    type: 'service_locator',
    severity: 'high',
    titleEn: 'Service Locator Anti-Pattern Usage',
    titleAr: 'استخدام خاطئ لنمط محدد الخدمة (Service Locator Anti-Pattern)',
    locationEn: '/src/domain/SalaryDisbursement.ts',
    locationAr: '/src/domain/SalaryDisbursement.ts',
    descriptionEn: 'Usage of global "ServiceLocator.get()" inside domain entities, which hides dependency signatures and breaks mockability in testing.',
    descriptionAr: 'استدعاء الخدمة العالمية "ServiceLocator.get" من داخل الكائنات الأساسية، مما يخفي المتطلبات الفعلية للفئة ويعطل إمكانية محاكاة الفحص واختبار الوحدة.',
    codeSnippetBefore: `// ❌ Active Service Locator usage
export class SalaryDisbursement {
  calculateAllowances() {
    // Hidden runtime dependency resolution!
    const config = ServiceLocator.get(AcademicYearProvider);
    return config.getCurrentScale() * 1.15;
  }
}`,
    codeSnippetAfter: `// ✅ Constructor-injected dependency
export class SalaryDisbursement {
  constructor(private academicYear: IAcademicYearProvider) {}

  calculateAllowances() {
    return this.academicYear.getCurrentScale() * 1.15;
  }
}`,
    isResolved: false
  },
  {
    id: 'anti-4',
    type: 'construction_inside_domain',
    severity: 'high',
    titleEn: 'Service Construction Inside Business Logic',
    titleAr: 'إنشاء الكائنات والخدمات يدوياً داخل منطق العمل البيني',
    locationEn: '/src/controllers/SecurityController.ts',
    locationAr: '/src/controllers/SecurityController.ts',
    descriptionEn: 'The class manually instantiates dynamic encryption helpers with the "new" operator instead of accepting an injected abstract security provider.',
    descriptionAr: 'تقوم الفئة بإنشاء أدوات التشفير يدوياً باستخدام مشغل "new" بدلاً من قبول واجهة مجردة موفرة أمنياً عبر حاوية الحقن التلقائية.',
    codeSnippetBefore: `// ❌ Manual service creation inside action handler
export class SecurityController {
  rotateKeys() {
    const encryptor = new AesGcmEncryptor(); // ❌ Tight instantiation
    encryptor.performRotation();
  }
}`,
    codeSnippetAfter: `// ✅ Decoupled: Inject security provider interface
export class SecurityController {
  constructor(
    @Inject('ISecurityProvider') private encryptor: ISecurityProvider
  ) {}

  rotateKeys() {
    this.encryptor.performRotation();
  }
}`,
    isResolved: false
  }
];

interface EnterpriseDependencyInjectionProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

export default function EnterpriseDependencyInjection({ triggerNotification }: EnterpriseDependencyInjectionProps) {
  // Navigation Tabs inside DI sub-system
  const [activeTab, setActiveTab] = useState<'graph' | 'registry' | 'violations' | 'refactor' | 'reports'>('graph');

  // Multi-state dependencies
  const [services, setServices] = useState<ServiceDescriptor[]>(INITIAL_SERVICES);
  const [findings, setFindings] = useState<AntiPatternFinding[]>(INITIAL_FINDINGS);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('db-pool');
  const [selectedFindingId, setSelectedFindingId] = useState<string>('anti-1');

  // Refactoring states
  const [isRefactoring, setIsRefactoring] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] DI CONTAINER INITIALIZED: تم تفعيل حاوية حقن التبعيات المركزية بنجاح.`,
    `[${new Date().toLocaleTimeString()}] IOC MONITOR: تم تهيئة أدوات تدقيق معايير الهندسة الموجهة (IoC Audit Engine Active).`
  ]);

  // Registry addition form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newSvcName, setNewSvcName] = useState<string>('');
  const [newSvcInterface, setNewSvcInterface] = useState<string>('');
  const [newSvcLifetime, setNewSvcLifetime] = useState<LifetimeType>('Scoped');
  const [newSvcModule, setNewSvcModule] = useState<'Financial' | 'Security' | 'Core' | 'Infrastructure' | 'Academic'>('Core');
  const [newSvcDeps, setNewSvcDeps] = useState<string[]>([]);
  const [newSvcDescAr, setNewSvcDescAr] = useState<string>('');
  const [newSvcDescEn, setNewSvcDescEn] = useState<string>('');

  const addTerminalLog = (msg: string) => {
    setTerminalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // Safe refactoring handler
  const handleAutoRefactor = () => {
    setIsRefactoring(true);
    addTerminalLog('⚙️ جاري تحليل الكود المصدري وتحديد كافة مشغلات (new) للمخالفات...');
    
    setTimeout(() => {
      // 1. Mark all findings as resolved
      setFindings(prev => prev.map(f => ({ ...f, isResolved: true })));
      
      // 2. Automatically register any unregistered services
      setServices(prev => prev.map(s => s.id === 'email-sender' ? { ...s, isRegistered: true } : s));

      setIsRefactoring(false);
      addTerminalLog('✓ تم بنجاح القضاء على نمط محدد الخدمة (Service Locator) واستبداله بالحقن البنيوي (Constructor Injection).');
      addTerminalLog('✓ تم إزالة مشغل (new) للمخالفات الأمنية وحظر الإنشاء المباشر للاتصالات بقاعدة البيانات.');
      addTerminalLog('✓ تم تسجيل كافة الخدمات والمزودات ضمن حاوية الحقن الموحدة لتخضع لدورة الحياة المعتمدة.');
      
      triggerNotification('تمت معالجة وإصلاح كافة مشكلات التبعيات المعقدة والإنشاء المباشر للبنية التحتية بنجاح! 👑', 'success');
    }, 1800);
  };

  // Add new Service Descriptor
  const handleAddService = () => {
    if (!newSvcName.trim() || !newSvcInterface.trim()) {
      triggerNotification('يرجى كتابة اسم الخدمة والواجهة التجريدية الخاصة بها أولاً', 'warning');
      return;
    }

    const newId = newSvcName.toLowerCase().replace(/service|manager|provider/gi, '').trim() + '-' + Math.floor(Math.random() * 100);
    const newService: ServiceDescriptor = {
      id: newId,
      name: newSvcName,
      interfaceName: newSvcInterface,
      lifetime: newSvcLifetime,
      dependencies: newSvcDeps,
      implementationClass: `${newSvcName}Impl`,
      isRegistered: true,
      module: newSvcModule,
      descriptionEn: newSvcDescEn || 'Custom injected system service descriptor',
      descriptionAr: newSvcDescAr || 'خدمة مخصصة مسجلة ومحشوة في معمارية النظام الموحد'
    };

    setServices(prev => [...prev, newService]);
    setSelectedServiceId(newId);
    setShowAddForm(false);
    
    // Clear state
    setNewSvcName('');
    setNewSvcInterface('');
    setNewSvcDeps([]);
    setNewSvcDescAr('');
    setNewSvcDescEn('');

    addTerminalLog(`📥 تم تسجيل خدمة جديدة [${newService.name}] ذات دورة حياة [${newService.lifetime}] بنجاح.`);
    triggerNotification('تم تسجيل الخدمة الإضافية في حاوية التحكم بنجاح!', 'success');
  };

  // Selected Service details
  const activeService = useMemo(() => {
    return services.find(s => s.id === selectedServiceId) || services[0];
  }, [selectedServiceId, services]);

  // Selected Finding details
  const activeFinding = useMemo(() => {
    return findings.find(f => f.id === selectedFindingId) || findings[0];
  }, [selectedFindingId, findings]);

  // Service Statistics for charts
  const lifetimeChartData = useMemo(() => {
    const counts: Record<LifetimeType, number> = { Singleton: 0, Scoped: 0, Transient: 0 };
    services.forEach(s => {
      if (s.isRegistered) {
        counts[s.lifetime]++;
      }
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key as LifetimeType],
      color: key === 'Singleton' ? '#10B981' : key === 'Scoped' ? '#3B82F6' : '#F59E0B'
    }));
  }, [services]);

  const moduleChartData = useMemo(() => {
    const counts: Record<string, number> = { Infrastructure: 0, Security: 0, Core: 0, Academic: 0, Financial: 0 };
    services.forEach(s => {
      counts[s.module] = (counts[s.module] || 0) + 1;
    });
    return Object.keys(counts).map(mod => ({
      name: mod,
      count: counts[mod]
    }));
  }, [services]);

  const dependencyGraphNodes = useMemo(() => {
    // Generate hierarchical visualization of dependencies
    return services.map(s => {
      const isLoopProne = findings.some(f => f.type === 'circular_dependency' && f.locationEn.includes(s.name) && !f.isResolved);
      return {
        ...s,
        isLoopProne,
        depth: s.dependencies.length
      };
    });
  }, [services, findings]);

  // Handle checking dependency paths
  const detectCircularRef = (serviceId: string, visited: Set<string> = new Set(), path: string[] = []): string[] | null => {
    if (visited.has(serviceId)) {
      return [...path, serviceId];
    }
    visited.add(serviceId);
    const svc = services.find(s => s.id === serviceId);
    if (svc) {
      for (const dep of svc.dependencies) {
        const loop = detectCircularRef(dep, new Set(visited), [...path, serviceId]);
        if (loop) return loop;
      }
    }
    return null;
  };

  const circularLoopPath = useMemo(() => {
    // Check if any circular path exists
    for (const svc of services) {
      const loop = detectCircularRef(svc.id);
      if (loop) return loop;
    }
    return null;
  }, [services]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl" id="dependency-injection-root">
      
      {/* BRANDING BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-850 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-amber-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-350 text-xs font-black">
              <Network className="w-4 h-4 text-amber-400" />
              <span>DIRECTIVE #022 • فك التداخل الهيكلي وحقن التبعيات (IoC & Decoupling)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              لوحة فحص وحوكمة البنية الهيكلية وحقن التبعيات (Enterprise DI & IoC Container)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              تصفية واستئصال مشغلات التبعيات المستترة والمخفية داخل الفئات والتحكم بوحدات الإطلاق. إلغاء إنشاء كائنات البنية التحتية الصلبة بشكل مستقل، واستبدالها بحقن التبعيات البنيوي (Constructor Injection) مع تصنيف دورات حياة الخدمات بدقة متناهية (Singleton, Scoped, Transient) وحماية الحاوية من حلقات الاعتماد الدائرية المدمرة.
            </p>
          </div>
        </div>

        {/* Dynamic Compliance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800 text-slate-300 font-sans">
          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">الخدمات الخاضعة للـ DI</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">
                {services.filter(s => s.isRegistered).length} من {services.length}
              </span>
              <span className="text-[10px] text-slate-500">Registered Svcs</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">مراقبة دورة الحياة مستمرة ✓</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">أنماط الاعتماد الدائري المكتشفة</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl sm:text-2xl font-black ${findings.some(f => !f.isResolved && f.type === 'circular_dependency') ? 'text-rose-400' : 'text-slate-500'}`}>
                {findings.filter(f => !f.isResolved && f.type === 'circular_dependency').length} حلقات
              </span>
              <span className="text-xs text-slate-400">Dependency Loops</span>
            </div>
            <span className="text-[10px] text-slate-500">تم مسح 14 خدمة معمارية</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">استخدامات محدد الخدمة (Service Locator)</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl sm:text-2xl font-black ${findings.some(f => !f.isResolved && f.type === 'service_locator') ? 'text-amber-400' : 'text-slate-500'}`}>
                {findings.filter(f => !f.isResolved && f.type === 'service_locator').length} عيوب
              </span>
              <span className="text-xs text-slate-400">Locator Anti-patterns</span>
            </div>
            <span className="text-[10px] text-amber-400 font-medium">التحول للحقن البنيوي جارٍ</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">التثبيت والمحاكاة التلقائية</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">مدعومة بالكامل</span>
              <span className="text-xs text-slate-400">Refactoring</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">جاهز لإعادة البناء الآمنة</span>
          </div>
        </div>
      </div>

      {/* CORE NAVIGATION SECTIONS TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 dark:border-slate-850">
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'graph' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>مستكشف ومخطط التبعيات المتبادلة (Dependency Graph) 📊</span>
          </button>
          
          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'registry' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>سجل دورة حياة الخدمات وحاوية الـ IoC (Service Lifetime) ⚙️</span>
          </button>

          <button
            onClick={() => setActiveTab('violations')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'violations' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>كاشف العيوب والاعتماد الدائري (Anti-Pattern Analyzer) ⚠️</span>
          </button>

          <button
            onClick={() => setActiveTab('refactor')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'refactor' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>إعادة الهيكلة التلقائية الآمنة (Automated Refactor Sandbox) ✨</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'reports' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>تقارير الامتثال والتحجيم المعماري (Lifetime Audit) 📜</span>
          </button>
        </div>
      </div>

      {/* SUB-SECTION 1: DEPENDENCY GRAPH VISUALIZER */}
      {activeTab === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Service nodes sidebar list */}
          <div className="lg:col-span-5 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-amber-500" />
                  <span>عقد الخدمات النشطة في المخطط (Active Nodes)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">انقر على الخدمة لمشاهدة شبكة علاقاتها وتبعاتها المتبادلة.</p>
              </div>
            </div>

            <div className="space-y-3">
              {dependencyGraphNodes.map((svc) => {
                const isSelected = selectedServiceId === svc.id;
                return (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedServiceId(svc.id)}
                    className={`w-full text-right p-4 border transition-all flex flex-col gap-2 cursor-pointer relative overflow-hidden ${
                      isSelected 
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/10' 
                        : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          svc.lifetime === 'Singleton' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' :
                          svc.lifetime === 'Scoped' ? 'bg-orange-500/15 text-orange-500 border-orange-500/30' :
                          'bg-amber-500/15 text-amber-500 border-amber-500/30'
                        }`}>
                          {svc.lifetime}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {svc.module.toUpperCase()}
                        </span>
                      </div>
                      
                      {svc.isLoopProne && (
                        <span className="bg-rose-500/15 text-rose-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
                          ⚠️ اعتماد دائري
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-extrabold text-slate-950 dark:text-white mt-1 flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>{svc.name}</span>
                    </h4>
                    
                    <p className="text-[10px] text-slate-500 leading-relaxed truncate">
                      {svc.descriptionAr}
                    </p>

                    <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>الواجهة: {svc.interfaceName}</span>
                      <span className="text-slate-500">التبعيات: {svc.dependencies.length} عقد</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Graphical Visualization Stage & Dependents map */}
          <div className="lg:col-span-7 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                رسم العلاقات وحقن التبعيات التفاعلي (Live Dependency Topology)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                توضيح كيفية بناء الخدمة الفائقة وسريان حقن الفئات بداخلها من الأسفل للأعلى.
              </p>
            </div>

            {/* Circular warning block if loop found */}
            {circularLoopPath && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-850 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-rose-800 dark:text-rose-400">تم رصد اعتماد دائري معوق لإقلاع النظام (Circular Reference Lock)</h4>
                  <p className="text-[11px] text-rose-600 dark:text-rose-500 leading-relaxed">
                    مسار الحلقة المغلقة المكتشفة: <strong className="font-mono">{circularLoopPath.join(' ➔ ')}</strong>. تمنع هذه الحلقات إمكانية تشغيل حاوية التطوير وتفشل اختبارات الحوسبة الموثوقة.
                  </p>
                </div>
              </div>
            )}

            {/* Live Interactive Canvas Representation */}
            <div className="border border-slate-150 dark:border-slate-800 rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-400">Container Resolution Graph Viewer</div>
              
              <div className="space-y-8 w-full max-w-md relative z-10 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                {/* Target Node */}
                <div className="flex justify-center">
                  <motion.div 
                    layoutId={`node-active-${activeService.id}`}
                    className="bg-amber-600 text-white px-5 py-3 border border-amber-400 shadow-amber-600/10 text-center w-64 ring-4 ring-amber-500/20"
                  >
                    <span className="text-[9px] font-bold bg-amber-800 text-amber-200 px-2 py-0.5 rounded-md block mb-1">
                      الخدمة النشطة (Target)
                    </span>
                    <h5 className="text-xs font-extrabold">{activeService.name}</h5>
                    <p className="text-[9px] text-amber-200 mt-1 font-mono">{activeService.interfaceName}</p>
                  </motion.div>
                </div>

                {/* Connection Arrows indicators */}
                {activeService.dependencies.length > 0 && (
                  <div className="flex flex-col items-center justify-center -my-4">
                    <div className="h-6 w-0.5 bg-amber-400/50 border-dashed border-l" />
                    <span className="text-[8px] bg-amber-50 dark:bg-slate-900 text-amber-500 font-bold px-2 py-0.5 border border-amber-200 rounded-full">
                      تحقن بداخلها (Injects)
                    </span>
                    <div className="h-6 w-0.5 bg-amber-400/50 border-dashed border-l" />
                  </div>
                )}

                {/* Dependees */}
                <div className="flex flex-wrap justify-center gap-4">
                  {activeService.dependencies.map((depId, index) => {
                    const depSvc = services.find(s => s.id === depId);
                    if (!depSvc) return null;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={depId}
                        className="dark:bg-slate-900 dark:border-slate-800 p-3 text-center w-40 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300"
                      >
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border block mb-1.5 ${
                          depSvc.lifetime === 'Singleton' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          depSvc.lifetime === 'Scoped' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {depSvc.lifetime}
                        </span>
                        <h6 className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 truncate">{depSvc.name}</h6>
                        <span className="text-[8px] font-mono text-slate-400 block mt-0.5">{depSvc.interfaceName}</span>
                      </motion.div>
                    );
                  })}

                  {activeService.dependencies.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400 italic">
                      هذه الخدمة أساسية (Leaf Node) ولا تعتمد على أي خدمة أخرى.
                    </div>
                  )}
                </div>
              </div>

              {/* Decorative nodes for grid background */}
              <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />
            </div>

            {/* Service details comparison card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="dark:border-slate-800 p-4 space-y-3 dark:bg-slate-900">
                <span className="text-xs font-black text-slate-400 block">وحدة الموديول والتصنيف (Domain Namespace)</span>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">{activeService.module} Engine Scope</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">تابع للحزمة البرمجية العليا للمنصة التعليمية.</p>
                  </div>
                </div>
              </div>

              <div className="dark:border-slate-800 p-4 space-y-3 dark:bg-slate-900">
                <span className="text-xs font-black text-slate-400 block">التثبيت والمحاكاة (Test Mockability)</span>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">امتحان قابلية الاختبار: 100%</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">استخدام الواجهات يضمن موثوقية اختبار وحدة الفحص.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: SERVICE REGISTRY & IOC CONTAINER */}
      {activeTab === 'registry' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 dark:bg-slate-900 p-6 rounded-3xl dark:border-slate-850 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                حاوية تدوير وحقن الخدمات (IoC Registry Engine)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تسجيل الخدمات والتحكم بدورة حياتها. يدعم الإطار النماذج الموصى بها منSAMA وNCA.
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 self-start"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل خدمة إضافية بالـ IoC</span>
            </button>
          </div>

          {/* Add Form Expandable */}
          {showAddForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-transparent dark:bg-slate-950 p-6 rounded-3xl dark:border-slate-800 space-y-4 overflow-hidden"
            >
              <h4 className="text-xs font-black text-slate-900 dark:text-white">تسجيل خدمة برمجية جديدة في حاوية حقن التتبع</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">اسم فئة الخدمة (Service Class Name)</label>
                  <input
                    type="text"
                    value={newSvcName}
                    onChange={(e) => setNewSvcName(e.target.value)}
                    placeholder="e.g. SmsGatewayService"
                    className="w-full text-right px-3 py-2 rounded-lg dark:border-slate-800 dark:bg-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">الواجهة التجريدية (Interface Name)</label>
                  <input
                    type="text"
                    value={newSvcInterface}
                    onChange={(e) => setNewSvcInterface(e.target.value)}
                    placeholder="e.g. ISmsGateway"
                    className="w-full text-right px-3 py-2 rounded-lg dark:border-slate-800 dark:bg-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">دورة الحياة (Lifetime)</label>
                  <select
                    value={newSvcLifetime}
                    onChange={(e) => setNewSvcLifetime(e.target.value as LifetimeType)}
                    className="w-full text-right px-3 py-2 rounded-lg dark:border-slate-800 dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Singleton">Singleton (كائن وحيد عالمي)</option>
                    <option value="Scoped">Scoped (كائن خاص بالجلسة/الطلب)</option>
                    <option value="Transient">Transient (كائن مخصص لكل استدعاء)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">الموديول الوظيفي (Module Component)</label>
                  <select
                    value={newSvcModule}
                    onChange={(e) => setNewSvcModule(e.target.value as any)}
                    className="w-full text-right px-3 py-2 rounded-lg dark:border-slate-800 dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Core">Core System</option>
                    <option value="Financial">Financial Engine</option>
                    <option value="Security">Security & Cryptography</option>
                    <option value="Academic">Academic Manager</option>
                    <option value="Infrastructure">Infrastructure Tools</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">التبعيات المطلوبة (Select Dependencies)</label>
                  <div className="flex flex-wrap gap-2 p-2 dark:bg-slate-900 rounded-lg dark:border-slate-800 min-h-[38px]">
                    {services.map(s => {
                      const isSelected = newSvcDeps.includes(s.id);
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => {
                            if (isSelected) {
                              setNewSvcDeps(prev => prev.filter(id => id !== s.id));
                            } else {
                              setNewSvcDeps(prev => [...prev, s.id]);
                            }
                          }}
                          className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-amber-600 text-white border-amber-500' 
                              : 'bg-transparent text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">وصف الخدمة بالعربية</label>
                  <input
                    type="text"
                    value={newSvcDescAr}
                    onChange={(e) => setNewSvcDescAr(e.target.value)}
                    placeholder="مثال: إدارة المراسلات الفورية وإشعارات الأنشطة التعليمية"
                    className="w-full text-right px-3 py-2 rounded-lg dark:border-slate-800 dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 text-xs hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-xs hover:bg-amber-500 cursor-pointer font-extrabold"
                >
                  تأكيد وحفظ
                </button>
              </div>
            </motion.div>
          )}

          {/* Table display of active services descriptors */}
          <div className="dark:bg-slate-900 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-black text-slate-900 dark:text-white">قائمة الخدمات وحالة التسجيل الفوري</span>
              <span className="text-[10px] font-mono text-slate-400">Total Registered: {services.filter(s => s.isRegistered).length} / {services.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 text-[10px] sm:text-xs font-black border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4">اسم الفئة الخدمية (Class)</th>
                    <th className="p-4">الواجهة التجريدية (Interface)</th>
                    <th className="p-4">المستوى (Module)</th>
                    <th className="p-4">دورة الحياة (Lifetime)</th>
                    <th className="p-4">التبعيات المحقونة (Injected)</th>
                    <th className="p-4">حالة التسجيل</th>
                    <th className="p-4 text-left">التحكم</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700 dark:text-slate-300">
                  {services.map((svc) => (
                    <tr 
                      key={svc.id} 
                      className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-all"
                    >
                      <td className="p-4 font-extrabold text-slate-950 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{svc.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-500">{svc.interfaceName}</td>
                      <td className="p-4 font-sans font-semibold text-slate-600 dark:text-slate-400">{svc.module}</td>
                      <td className="p-4">
                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${
                          svc.lifetime === 'Singleton' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' :
                          svc.lifetime === 'Scoped' ? 'bg-orange-500/15 text-orange-500 border-orange-500/30' :
                          'bg-amber-500/15 text-amber-500 border-amber-500/30'
                        }`}>
                          {svc.lifetime}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {svc.dependencies.map(d => {
                            const found = services.find(s => s.id === d);
                            return (
                              <span key={d} className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] px-1.5 py-0.5 rounded">
                                {found ? found.name : d}
                              </span>
                            );
                          })}
                          {svc.dependencies.length === 0 && <span className="text-slate-400 text-[10px] italic">بلا</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        {svc.isRegistered ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            <span>مفعلة (Registered)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
                            <Minimize2 className="w-3 h-3" />
                            <span>مستبعدة (Unregistered)</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-left">
                        <button
                          onClick={() => {
                            setServices(prev => prev.map(s => s.id === svc.id ? { ...s, isRegistered: !s.isRegistered } : s));
                            addTerminalLog(`Toggle Registration for [${svc.name}]: ${!svc.isRegistered ? 'REGISTERED' : 'UNREGISTERED'}`);
                            triggerNotification('تم تحديث حالة تفعيل وتسجيل الخدمة بنجاح', 'info');
                          }}
                          className="text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg dark:border-slate-700 cursor-pointer"
                        >
                          {svc.isRegistered ? 'إلغاء تفعيل' : 'تفعيل بالـ IoC'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: ANTI-PATTERN DISCOVERY & ANALYZER */}
      {activeTab === 'violations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Finding selector sidebar */}
          <div className="lg:col-span-5 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 animate-bounce" />
                  <span>مخالفات الأنماط وهياكل الربط (IoC Violations)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">تم رصد 4 ثغرات هيكلية وتعارضات في معمارية التحكم.</p>
              </div>
            </div>

            <div className="space-y-3">
              {findings.map((finding) => {
                const isSelected = selectedFindingId === finding.id;
                return (
                  <button
                    key={finding.id}
                    onClick={() => setSelectedFindingId(finding.id)}
                    className={`w-full text-right p-4 border transition-all flex flex-col gap-2 cursor-pointer relative overflow-hidden ${
                      isSelected 
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/10' 
                        : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        {finding.isResolved ? (
                          <span className="bg-emerald-500/15 text-emerald-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                            ✓ تم الحل والتطهير
                          </span>
                        ) : (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            finding.severity === 'critical' ? 'bg-rose-500/15 text-rose-500 border-rose-500/30' :
                            'bg-amber-500/15 text-amber-500 border-amber-500/30'
                          }`}>
                            {finding.severity.toUpperCase()}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {finding.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-extrabold text-slate-950 dark:text-white mt-1">
                      {finding.titleAr}
                    </h4>
                    
                    <p className="text-[10px] text-slate-500 leading-relaxed truncate">
                      {finding.descriptionAr}
                    </p>

                    <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>الموقع: <strong className="text-amber-400">{finding.locationEn}</strong></span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Execute Refactor button */}
            {findings.some(f => !f.isResolved) && (
              <button
                onClick={handleAutoRefactor}
                disabled={isRefactoring}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white font-extrabold py-3 px-4 text-xs shadow-lg shadow-amber-600/15 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer animate-pulse"
              >
                {isRefactoring ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-200" />
                )}
                <span>إعادة هيكلة وتطهير التبعيات تلقائياً (DI Refactor) ✨</span>
              </button>
            )}
          </div>

          {/* Code Viewer comparisons before/after */}
          <div className="lg:col-span-7 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                تفاصيل نمط الاعتماد وطرق الحل البرمجي للثغرة
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                مقارنة حية لتبديل مشغلات البناء المباشرة والأنماط الهيكلية الخاطئة بأساليب مطهرة متوافقة مع التوجيه #022.
              </p>
            </div>

            <div className="border border-slate-150 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${
                  activeFinding.isResolved ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}>
                  {activeFinding.isResolved ? 'حل ناجح ✓' : 'معوق حالي ⚠️'}
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white">{activeFinding.titleAr}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                {activeFinding.descriptionAr}
              </p>
              <p className="text-[10px] text-slate-500 italic text-left" dir="ltr">
                {activeFinding.descriptionEn}
              </p>
            </div>

            {/* Code editor split before vs after */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* Unsafe before */}
              <div className="border border-rose-200 dark:border-rose-950 overflow-hidden bg-rose-50/20 dark:bg-rose-950/5">
                <div className="bg-rose-100/60 dark:bg-rose-950/40 px-4 py-2 border-b border-rose-200 dark:border-rose-950 flex justify-between items-center text-rose-700 dark:text-rose-400">
                  <span className="font-extrabold">مخالفة هيكلية (Unsafe) ❌</span>
                  <span className="text-[9px]">Direct Construction</span>
                </div>
                <div className="p-4 overflow-x-auto text-left" dir="ltr">
                  <pre className="text-rose-600 dark:text-rose-300">
                    {activeFinding.codeSnippetBefore}
                  </pre>
                </div>
              </div>

              {/* Injected Refactored after */}
              <div className="border border-emerald-200 dark:border-emerald-950 overflow-hidden bg-emerald-50/20 dark:bg-emerald-950/5">
                <div className="bg-emerald-100/60 dark:bg-emerald-950/40 px-4 py-2 border-b border-emerald-200 dark:border-emerald-950 flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                  <span className="font-extrabold">بناء مطهر (Constructor Inject) ✓</span>
                  <span className="text-[9px]">IoC Registered</span>
                </div>
                <div className="p-4 overflow-x-auto text-left" dir="ltr">
                  <pre className="text-emerald-600 dark:text-emerald-300 font-bold">
                    {activeFinding.codeSnippetAfter}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 4: AUTOMATED REFACTOR SANDBOX */}
      {activeTab === 'refactor' && (
        <div className="space-y-6">
          <div className="dark:bg-slate-900 p-6 rounded-3xl dark:border-slate-850 space-y-4">
            <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>محاكي إعادة تنظيم حقن التتبع للمستندات البرمجية (Refactor Sandbox)</span>
            </h3>
            <p className="text-xs text-slate-500">
              قم بتشغيل المحاكي لتعقب وإعادة تنظيم وتطهير كافة الفئات البرمجية التي تستخدم الاستدعاءات الصلبة أو المخفية. يقوم المحاكي بمراجعة 14 فئة وعزل كافة البنى التحتية (Infrastructure Links).
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleAutoRefactor}
                disabled={isRefactoring}
                className="px-5 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {isRefactoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>ابدأ تطهير وإعادة بناء التبعيات الآن (Run Container Refactoring)</span>
              </button>

              <button
                onClick={() => {
                  setFindings(INITIAL_FINDINGS);
                  setServices(INITIAL_SERVICES);
                  addTerminalLog('🔄 تم إعادة تعيين سيناريو كشف العيوب المبدئي لمراجعة الحاوية.');
                  triggerNotification('تمت إعادة ضبط تجربة محاكي التبعيات بنجاح!', 'info');
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-all cursor-pointer"
              >
                إعادة تهيئة البيئة للتجربة
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Terminal logs panel */}
            <div className="lg:col-span-6 bg-slate-950 text-slate-100 rounded-3xl border border-slate-900 p-5 font-mono text-xs space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-amber-400 font-black flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>لوحة مخرجات حاوية الحقن والتحليل</span>
                </span>
                <span className="text-[10px] text-slate-500">IoC Diagnostics Terminal</span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin text-left" dir="ltr">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed hover:bg-slate-900 py-1 px-2 rounded">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual refactoring progress graph */}
            <div className="lg:col-span-6 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
              <span className="text-xs font-black text-slate-400 block">إحصائيات الامتثال المعماري للمنصة</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-transparent dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 text-center">
                  <span className="text-[10px] text-slate-400 font-black block mb-1">نسبة التبعيات المطهرة (Decoupled Pct)</span>
                  <span className={`text-3xl font-black ${findings.every(f => f.isResolved) ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {findings.every(f => f.isResolved) ? '100%' : '50%'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">SAMA Decoupling compliance</span>
                </div>

                <div className="bg-transparent dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 text-center">
                  <span className="text-[10px] text-slate-400 font-black block mb-1">معدل الخطأ في تجميع الكائنات</span>
                  <span className={`text-3xl font-black ${findings.every(f => f.isResolved) ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {findings.every(f => f.isResolved) ? '0%' : '15%'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Zero dynamic locator errors</span>
                </div>
              </div>

              {/* Radar Chart mapping compliance levels */}
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'إزالة مشغل (new)', A: findings.every(f => f.isResolved) ? 100 : 40, fullMark: 100 },
                    { subject: 'تفكيك الدوائر المغلقة', A: findings.every(f => f.isResolved) ? 100 : 50, fullMark: 100 },
                    { subject: 'عزل البنية التحتية', A: findings.every(f => f.isResolved) ? 100 : 60, fullMark: 100 },
                    { subject: 'امتحان كائنات الموديل', A: findings.every(f => f.isResolved) ? 100 : 70, fullMark: 100 },
                    { subject: 'سهولة اختبار الوحدة', A: findings.every(f => f.isResolved) ? 100 : 80, fullMark: 100 }
                  ]}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="حاوية الامتثال (DI Container)" dataKey="A" stroke="#4F46E5" fill="#818CF8" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 5: REPORTS (COMPLIANCE AUDIT & LIFETIME REPORT) */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart: Service Lifetime allocation distribution */}
            <div className="dark:bg-slate-900 dark:border-slate-850 rounded-3xl p-6 space-y-4">
              <span className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span>توزيع تصنيف دورة حياة خدمات الـ IoC</span>
              </span>
              <p className="text-xs text-slate-500">
                مقارنة كمية لعدد الخدمات المسجلة وفقاً لدورة الحياة المعمارية المعتمدة (Singleton vs Scoped vs Transient).
              </p>

              <div className="h-[250px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lifetimeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {lifetimeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dependency graph density parameters by Module */}
            <div className="dark:bg-slate-900 dark:border-slate-850 rounded-3xl p-6 space-y-4">
              <span className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>إحصائيات كثافة التبعيات بكل قسم وظيفي (Module Density)</span>
              </span>
              <p className="text-xs text-slate-500">
                مؤشر يوضح عدد المكونات المسجلة بكل موديول تشغيلي ومدى مساهمته في الحاوية الكلية لتقليل التعقيد.
              </p>

              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduleChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Service Lifetime Audit Detailed Report */}
          <div className="dark:bg-slate-900 dark:border-slate-850 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  <span>تقرير مراجعة دورة الحياة المعمارية (Service Lifetime Compliance Report)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تحديد دقيق لآلية الإنشاء الفعلي وتفادي تداخل الذاكرة وتسريب الجلسات لمستويات البيانات.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400">
              
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900 space-y-2">
                <h4 className="font-extrabold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Singleton Lifetime (العمر الأحادي)</span>
                </h4>
                <p className="leading-relaxed">
                  يتم إنشاء كائن واحد مشترك على مستوى النظام بأكمله ومشاركته بين كافة الطلبات. مثالي لخدمات الربط والأجهزة المشتركة مثل <strong>DatabaseConnectionPool</strong> و<strong>AuditLoggerService</strong>. يقلل استهلاك الذاكرة بشكل جوهري.
                </p>
              </div>

              <div className="p-4 bg-orange-50/50 dark:bg-orange-950/15 border border-orange-100 dark:border-orange-900 space-y-2">
                <h4 className="font-extrabold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Scoped Lifetime (العمر المتطابق مع الجلسة)</span>
                </h4>
                <p className="leading-relaxed">
                  يتم إنشاء كائن خاص وفريد لكل طلب مستخدم (Request) أو جلسة اتصال مستقلة وتدميره فور انتهاء المعاملة. يضمن هذا النطاق عزل المستأجرين مثل <strong>TenantManager</strong> و<strong>AcademicYearProvider</strong> لمنع تداخل بيانات الفروع.
                </p>
              </div>

              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900 space-y-2">
                <h4 className="font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Transient Lifetime (العمر المؤقت الفوري)</span>
                </h4>
                <p className="leading-relaxed">
                  يتم إنشاء كائن جديد تماماً في كل مرة يتم طلبه من حاوية الخدمات IoC. آمن للعمليات البرمجية الحساسة التي تحمل معلومات حالة مؤقتة أو غير مرتبطة مثل <strong>SalaryDisbursementService</strong> لتفادي الاحتفاظ بقيم حوسبة رواتب سابقة.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
