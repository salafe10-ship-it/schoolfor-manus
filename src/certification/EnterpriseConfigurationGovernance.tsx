import { AlertTriangle, BarChart3, Check, CheckCircle2, CheckSquare, Cloud, Code, Component, Container, Copy, Database, Download, Eye, EyeOff, File, FileText, Key, Lock as LockIcon, Logs, Monitor, Navigation, Play, Plus, RefreshCw, Scan, Server, Shield, ShieldAlert, ShieldCheck, Signature, Sparkles, Target, Terminal, Trash2, Unlock, User, Variable } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// ==========================================
// CONFIGURATION TYPINGS & DATA STRUCTURES
// ==========================================
export type ConfigEnvironment = 'development' | 'testing' | 'staging' | 'production';
export type ConfigCategory = 'Database' | 'Security' | 'API' | 'Caching' | 'System';

export interface EnvVariable {
  key: string;
  value: string;
  isSensitive: boolean;
  isEncrypted: boolean;
  category: ConfigCategory;
  descriptionEn: string;
  descriptionAr: string;
  required: boolean;
  defaultValue: string;
}

export interface AuditFinding {
  id: string;
  type: 'hardcoded_secret' | 'duplicated_key' | 'environment_mismatch' | 'exposed_secret' | 'insecure_default';
  severity: 'critical' | 'high' | 'medium' | 'low';
  titleEn: string;
  titleAr: string;
  detailsEn: string;
  detailsAr: string;
  fileEn: string;
  fileAr: string;
  canAutoRepair: boolean;
  isRepaired: boolean;
}

// Initial Mock Environment variables for audit and play
const INITIAL_VARIABLES: Record<ConfigEnvironment, EnvVariable[]> = {
  development: [
    { key: 'DATABASE_URL', value: '<server-side-development-connection-string>', isSensitive: true, isEncrypted: false, category: 'Database', descriptionEn: 'Primary PostgreSQL storage link', descriptionAr: 'رابط الاتصال المباشر بقاعدة البيانات الأساسية للفرع', required: true, defaultValue: '' },
    { key: 'JWT_SECRET', value: '<server-managed-jwt-secret-placeholder>', isSensitive: true, isEncrypted: false, category: 'Security', descriptionEn: 'Signature secret key for user tokens', descriptionAr: 'مفتاح التوقيع والتشفير لرموز مصادقة المستخدمين', required: true, defaultValue: '' },
    { key: 'REDIS_HOST', value: '127.0.0.1', isSensitive: false, isEncrypted: false, category: 'Caching', descriptionEn: 'Redis server hostname', descriptionAr: 'عنوان خادم الرديس لتخزين الكاش المؤقت', required: false, defaultValue: 'localhost' },
    { key: 'REDIS_PORT', value: '6379', isSensitive: false, isEncrypted: false, category: 'Caching', descriptionEn: 'Redis connection port', descriptionAr: 'منفذ الاتصال بخادم رديس المؤقت', required: false, defaultValue: '6379' },
    { key: 'GEMINI_API_KEY', value: '<server-managed-api-key-placeholder>', isSensitive: true, isEncrypted: false, category: 'API', descriptionEn: 'Google Gemini SDK authorization key', descriptionAr: 'مفتاح الاتصال والتخويل لـ SDK الذكاء الاصطناعي جميناي', required: true, defaultValue: '' },
    { key: 'DEBUG_MODE', value: 'true', isSensitive: false, isEncrypted: false, category: 'System', descriptionEn: 'Toggle extensive developer logging logs', descriptionAr: 'تفعيل طباعة تفاصيل الأخطاء التشخيصية المكثفة للمطورين', required: false, defaultValue: 'false' },
    { key: 'COOKIE_SECURE', value: 'false', isSensitive: false, isEncrypted: false, category: 'Security', descriptionEn: 'Enforce SSL-only transport on cookies', descriptionAr: 'إلزام نقل ملفات الكوكيز عبر الاتصالات الآمنة المشفرة فقط', required: false, defaultValue: 'true' }
  ],
  testing: [
    { key: 'DATABASE_URL', value: '<server-side-test-connection-string>', isSensitive: true, isEncrypted: false, category: 'Database', descriptionEn: 'Primary PostgreSQL storage link', descriptionAr: 'رابط الاتصال المباشر بقاعدة البيانات الأساسية للفرع', required: true, defaultValue: '' },
    { key: 'JWT_SECRET', value: '<server-managed-jwt-secret-placeholder>', isSensitive: true, isEncrypted: false, category: 'Security', descriptionEn: 'Signature secret key for user tokens', descriptionAr: 'مفتاح التوقيع والتشفير لرموز مصادقة المستخدمين', required: true, defaultValue: '' },
    { key: 'REDIS_HOST', value: '127.0.0.1', isSensitive: false, isEncrypted: false, category: 'Caching', descriptionEn: 'Redis server hostname', descriptionAr: 'عنوان خادم الرديس لتخزين الكاش المؤقت', required: false, defaultValue: 'localhost' },
    { key: 'REDIS_PORT', value: '6379', isSensitive: false, isEncrypted: false, category: 'Caching', descriptionEn: 'Redis connection port', descriptionAr: 'منفذ الاتصال بخادم رديس المؤقت', required: false, defaultValue: '6379' },
    { key: 'GEMINI_API_KEY', value: '', isSensitive: true, isEncrypted: false, category: 'API', descriptionEn: 'Google Gemini SDK authorization key', descriptionAr: 'مفتاح الاتصال والتخويل لـ SDK الذكاء الاصطناعي جميناي', required: true, defaultValue: '' },
    { key: 'DEBUG_MODE', value: 'true', isSensitive: false, isEncrypted: false, category: 'System', descriptionEn: 'Toggle extensive developer logging logs', descriptionAr: 'تفعيل طباعة تفاصيل الأخطاء التشخيصية المكثفة للمطورين', required: false, defaultValue: 'false' },
    { key: 'COOKIE_SECURE', value: 'false', isSensitive: false, isEncrypted: false, category: 'Security', descriptionEn: 'Enforce SSL-only transport on cookies', descriptionAr: 'إلزام نقل ملفات الكوكيز عبر الاتصالات الآمنة المشفرة فقط', required: false, defaultValue: 'true' }
  ],
  staging: [
    { key: 'DATABASE_URL', value: '<server-side-staging-connection-string>', isSensitive: true, isEncrypted: false, category: 'Database', descriptionEn: 'Primary PostgreSQL storage link', descriptionAr: 'رابط الاتصال المباشر بقاعدة البيانات الأساسية للفرع', required: true, defaultValue: '' },
    { key: 'JWT_SECRET', value: '<server-managed-jwt-secret-placeholder>', isSensitive: true, isEncrypted: false, category: 'Security', descriptionEn: 'Signature secret key for user tokens', descriptionAr: 'مفتاح التوقيع والتشفير لرموز مصادقة المستخدمين', required: true, defaultValue: '' },
    { key: 'REDIS_HOST', value: 'redis-staging-cluster.internal', isSensitive: false, isEncrypted: false, category: 'Caching', descriptionEn: 'Redis server hostname', descriptionAr: 'عنوان خادم الرديس لتخزين الكاش المؤقت', required: false, defaultValue: 'localhost' },
    { key: 'REDIS_PORT', value: '6379', isSensitive: false, isEncrypted: false, category: 'Caching', descriptionEn: 'Redis connection port', descriptionAr: 'منفذ الاتصال بخادم رديس المؤقت', required: false, defaultValue: '6379' },
    { key: 'GEMINI_API_KEY', value: '<server-managed-api-key-placeholder>', isSensitive: true, isEncrypted: false, category: 'API', descriptionEn: 'Google Gemini SDK authorization key', descriptionAr: 'مفتاح الاتصال والتخويل لـ SDK الذكاء الاصطناعي جميناي', required: true, defaultValue: '' },
    { key: 'DEBUG_MODE', value: 'false', isSensitive: false, isEncrypted: false, category: 'System', descriptionEn: 'Toggle extensive developer logging logs', descriptionAr: 'تفعيل طباعة تفاصيل الأخطاء التشخيصية المكثفة للمطورين', required: false, defaultValue: 'false' },
    { key: 'COOKIE_SECURE', value: 'true', isSensitive: false, isEncrypted: false, category: 'Security', descriptionEn: 'Enforce SSL-only transport on cookies', descriptionAr: 'إلزام نقل ملفات الكوكيز عبر الاتصالات الآمنة المشفرة فقط', required: false, defaultValue: 'true' }
  ],
  production: [
    { key: 'DATABASE_URL', value: '<server-side-production-connection-string>', isSensitive: true, isEncrypted: false, category: 'Database', descriptionEn: 'Primary PostgreSQL storage link', descriptionAr: 'رابط الاتصال المباشر بقاعدة البيانات الأساسية للفرع', required: true, defaultValue: '' },
    { key: 'JWT_SECRET', value: '<server-managed-jwt-secret-placeholder>', isSensitive: true, isEncrypted: false, category: 'Security', descriptionEn: 'Signature secret key for user tokens', descriptionAr: 'مفتاح التوقيع والتشفير لرموز مصادقة المستخدمين', required: true, defaultValue: '' },
    { key: 'REDIS_HOST', value: 'redis-prod.vpc.internal', isSensitive: false, isEncrypted: false, category: 'Caching', descriptionEn: 'Redis server hostname', descriptionAr: 'عنوان خادم الرديس لتخزين الكاش المؤقت', required: false, defaultValue: 'localhost' },
    { key: 'REDIS_PORT', value: '6379', isSensitive: false, isEncrypted: false, category: 'Caching', descriptionEn: 'Redis connection port', descriptionAr: 'منفذ الاتصال بخادم رديس المؤقت', required: false, defaultValue: '6379' },
    { key: 'GEMINI_API_KEY', value: '<server-managed-api-key-placeholder>', isSensitive: true, isEncrypted: false, category: 'API', descriptionEn: 'Google Gemini SDK authorization key', descriptionAr: 'مفتاح الاتصال والتخويل لـ SDK الذكاء الاصطناعي جميناي', required: true, defaultValue: '' },
    { key: 'DEBUG_MODE', value: 'true', isSensitive: false, isEncrypted: false, category: 'System', descriptionEn: 'Toggle extensive developer logging logs', descriptionAr: 'تفعيل طباعة تفاصيل الأخطاء التشخيصية المكثفة للمطورين', required: false, defaultValue: 'false' },
    { key: 'COOKIE_SECURE', value: 'false', isSensitive: false, isEncrypted: false, category: 'Security', descriptionEn: 'Enforce SSL-only transport on cookies', descriptionAr: 'إلزام نقل ملفات الكوكيز عبر الاتصالات الآمنة المشفرة فقط', required: false, defaultValue: 'true' }
  ]
};

// Findings list of configuration issues to audit and auto-repair
const INITIAL_FINDINGS: AuditFinding[] = [
  {
    id: 'find_hardcoded',
    type: 'hardcoded_secret',
    severity: 'critical',
    titleEn: 'Hardcoded DB Credentials In Codebase',
    titleAr: 'تضمين بيانات الاتصال بقاعدة البيانات بشكل مباشر داخل الكود',
    detailsEn: 'A plain-text postgresql password string was detected hardcoded directly inside "/src/db/connection.ts". This leaks database ownership to unauthorized personnel.',
    detailsAr: 'تم رصد كتابة كلمة مرور قاعدة البيانات بصيغة نصية واضحة ومباشرة في الملف "/src/db/connection.ts" مما يعرض البيانات للتسريب الكامل.',
    fileEn: '/src/db/connection.ts (Line 14)',
    fileAr: '/src/db/connection.ts (السطر 14)',
    canAutoRepair: true,
    isRepaired: false
  },
  {
    id: 'find_exposed_gemini',
    type: 'exposed_secret',
    severity: 'high',
    titleEn: 'Exposed Gemini API Key in Client Component',
    titleAr: 'مفتاح ذكاء اصطناعي (Gemini Key) مكشوف في الكود الأمامي',
    detailsEn: 'A live Gemini API key beginning with "AIzaSy..." is exposed in a React component frontend layout, allowing attackers to hijack AI compute limits.',
    detailsAr: 'مفتاح الربط الفعال لـ Gemini مكتوب داخل واجهات العميل الأمامية بشكل مباشر، مما يمكن المهاجمين من استهلاك حصة الذكاء الاصطناعي واختراقها.',
    fileEn: '/src/components/AIPredictor.tsx (Line 8)',
    fileAr: '/src/components/AIPredictor.tsx (السطر 8)',
    canAutoRepair: true,
    isRepaired: false
  },
  {
    id: 'find_insecure_defaults',
    type: 'insecure_default',
    severity: 'high',
    titleEn: 'Insecure System Defaults Active in Production',
    titleAr: 'تنشيط خيارات الأمان الضعيفة والافتراضية في الإنتاج',
    detailsEn: 'The variable COOKIE_SECURE is set to false, and DEBUG_MODE is set to true in production. This allows session highjacking and verbose server tracing exposure.',
    detailsAr: 'تفعيل وضع التنقيح البرمجي DEBUG_MODE في بيئة الإنتاج، مع إلغاء تشفير ملفات الارتباط COOKIE_SECURE، مما يسهل رصد خريطة السيرفر بالكامل وسرقة الجلسات.',
    fileEn: '/package.json & production.env',
    fileAr: '/package.json & production.env',
    canAutoRepair: true,
    isRepaired: false
  },
  {
    id: 'find_duplicated',
    type: 'duplicated_key',
    severity: 'medium',
    titleEn: 'Duplicated Configuration Key Overwrites',
    titleAr: 'تكرار وتعريف مزدوج لنفس المتغير الإعدادي',
    detailsEn: 'REDIS_HOST is defined twice in "production.env", resulting in race conditions and unpredictable caching clusters usage during runtime.',
    detailsAr: 'تم تعريف متغير اتصال رديس REDIS_HOST مرتين في ملف الإعدادات للإنتاج بقيم مختلفة مما يسبب سلوك كاش غير متوقع.',
    fileEn: '/config/production.env (Lines 4 & 18)',
    fileAr: '/config/production.env (الأسطر 4 و 18)',
    canAutoRepair: true,
    isRepaired: false
  },
  {
    id: 'find_mismatch',
    type: 'environment_mismatch',
    severity: 'medium',
    titleEn: 'Critical Variable Environment Inconsistency',
    titleAr: 'عدم تطابق المتغيرات الحيوية بين البيئات البرمجية',
    detailsEn: 'The required token "GEMINI_API_KEY" is absent in the Testing environment setup, causing integration unit tests to collapse on startup.',
    detailsAr: 'المتغير الإلزامي لتشغيل الذكاء الاصطناعي "GEMINI_API_KEY" غائب تماماً من بيئة الاختبار (Testing)، مما يتسبب بانهيار الاختبارات الدورية وتوقف التثبيت.',
    fileEn: '/config/testing.env (Missing Variable)',
    fileAr: '/config/testing.env (متغير مفقود)',
    canAutoRepair: true,
    isRepaired: false
  }
];

interface EnterpriseConfigurationGovernanceProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

export default function EnterpriseConfigurationGovernance({ triggerNotification }: EnterpriseConfigurationGovernanceProps) {
  // Navigation inside configuration sub-system
  const [activeSubSection, setActiveSubSection] = useState<'audit' | 'manager' | 'validator' | 'encryption' | 'report'>('audit');
  
  // Variables & Audit States
  const [environmentsData, setEnvironmentsData] = useState<Record<ConfigEnvironment, EnvVariable[]>>(INITIAL_VARIABLES);
  const [findings, setFindings] = useState<AuditFinding[]>(INITIAL_FINDINGS);
  const [selectedEnv, setSelectedEnv] = useState<ConfigEnvironment>('production');
  const [selectedAuditFinding, setSelectedAuditFinding] = useState<string>('find_hardcoded');

  // Interactive Resiliency metrics for Directive #020
  const [resiliencyScore, setResiliencyScore] = useState<number>(55);
  const [repairedCount, setRepairedCount] = useState<number>(0);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isRepairingAll, setIsRepairingAll] = useState<boolean>(false);

  // Variable manager CRUD States
  const [isAddingVar, setIsAddingVar] = useState<boolean>(false);
  const [newVarKey, setNewVarKey] = useState<string>('');
  const [newVarVal, setNewVarVal] = useState<string>('');
  const [newVarCat, setNewVarCat] = useState<ConfigCategory>('System');
  const [newVarSensitive, setNewVarSensitive] = useState<boolean>(false);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  // Startup Validator Simulator States
  const [isSimulatingStartup, setIsSimulatingStartup] = useState<boolean>(false);
  const [startupLogs, setStartupLogs] = useState<string[]>([]);
  const [startupStatus, setStartupStatus] = useState<'idle' | 'success' | 'failure'>('idle');
  const [validatorTargetEnv, setValidatorTargetEnv] = useState<ConfigEnvironment>('production');

  // Encryption Tool States
  const [rawTextToEncrypt, setRawTextToEncrypt] = useState<string>('<example-secret-text>');
  const [encryptionAlgorithm, setEncryptionAlgorithm] = useState<'AES-256-GCM' | 'ChaCha20-Poly1305'>('AES-256-GCM');
  const [encryptedOutput, setEncryptedOutput] = useState<string>('');
  const [decryptionSuccess, setDecryptionSuccess] = useState<boolean | null>(null);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);

  // Console log list
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] GOVERNANCE ENGINE: تم تنشيط مراقب حوكمة تهيئة البيئة (Enterprise Config Monitor Initialized).`,
    `[${new Date().toLocaleTimeString()}] Ready to scan files for hardcoded secrets & environment parity.`
  ]);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const toggleShowValue = (key: string) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. RUN AUDIT DISCOVERY
  const handleTriggerAudit = () => {
    setIsAuditing(true);
    addLog('🔍 جاري تشغيل مسح شامل على كامل الملفات البرمجية لتتبع تسريب الإعدادات...');
    
    setTimeout(() => {
      setIsAuditing(false);
      addLog('✓ تم إنجاز المسح التلقائي. تم العثور على 5 مخالفات لمعايير حوكمة الحوسبة المؤسسية.');
      addLog('⚠️ تنبيه: تم الكشف عن مفاتيح ربط حساسة وهياكل بيانات اتصال مكشوفة داخل مستندات الكلاينت.');
      triggerNotification('اكتمل مسح الحوكمة وإعدادات البيئة بنجاح!', 'warning');
    }, 1200);
  };

  // 2. AUTOMATICALLY REPAIR SAFE CONFIGURATION ISSUES
  const handleRepairAll = () => {
    setIsRepairingAll(true);
    addLog('⚙️ جاري بدء تطهير وتصحيح الإعدادات وهياكل الحوسبة...');
    
    setTimeout(() => {
      // 1. Mark all findings as repaired
      setFindings(prev => prev.map(f => ({ ...f, isRepaired: true })));
      
      // 2. Clean and synchronize the env variables
      setEnvironmentsData(prev => {
        const updated = JSON.parse(JSON.stringify(prev)) as Record<ConfigEnvironment, EnvVariable[]>;
        
        // Loop over each environment to enforce secure defaults & remove plaintext
        Object.keys(updated).forEach((envKey) => {
          const env = envKey as ConfigEnvironment;
          updated[env] = updated[env].map(v => {
            // Fix COOKIE_SECURE for staging and production
            if (v.key === 'COOKIE_SECURE' && (env === 'production' || env === 'staging')) {
              return { ...v, value: 'true' };
            }
            // Fix DEBUG_MODE to false in production
            if (v.key === 'DEBUG_MODE' && env === 'production') {
              return { ...v, value: 'false' };
            }
            // Fix missing GEMINI_API_KEY in testing by synchronizing from development placeholder
            if (v.key === 'GEMINI_API_KEY' && env === 'testing' && !v.value) {
              return { ...v, value: '<server-managed-api-key-placeholder>' };
            }
            // Encrypt production databases and tokens automatically
            if (v.isSensitive && env === 'production' && !v.isEncrypted) {
              const mockedCipher = `enc_gcm_sha256_${v.value.substring(0, 6)}_${Math.random().toString(36).substring(2, 8)}`;
              return { ...v, value: mockedCipher, isEncrypted: true };
            }
            return v;
          });
        });
        return updated;
      });

      setResiliencyScore(100);
      setRepairedCount(5);
      setIsRepairingAll(false);
      
      addLog('✓ تم تشفير البيانات الحساسة لبيئة الإنتاج بنجاح باستخدام خوارزمية AES-256-GCM.');
      addLog('✓ تم بنجاح استبدال الرموز النصية المباشرة في الكود بالمتغيرات البيئية process.env.');
      addLog('✓ تم حظر خيارات المطورين غير الآمنة (DEBUG_MODE -> false, COOKIE_SECURE -> true) لبيئة الإنتاج.');
      
      triggerNotification('تمت معالجة وإصلاح جميع مشاكل حوكمة الإعدادات تلقائياً وتأمين بيئة الإنتاج بنجاح! 👑', 'success');
    }, 1500);
  };

  // 3. STARTUP VALIDATOR SIMULATOR
  const handleSimulateStartup = () => {
    setIsSimulatingStartup(true);
    setStartupLogs([]);
    setStartupStatus('idle');
    
    addLog(`🚀 جاري التحضير لإقلاع محاكاة النظام للبيئة المختارة: [${validatorTargetEnv.toUpperCase()}]`);

    const logMessages = [
      { text: 'SYSTEM: Initializing Riyadh Educational Platform Kernel Bootstrapper...', delay: 150 },
      { text: 'SYSTEM: Loading application metadata and workspace configuration matrices...', delay: 400 },
      { text: 'SYSTEM: Initiating environment variable safety and integrity validation...', delay: 700 },
    ];

    let currentTimeout = 0;
    logMessages.forEach((log) => {
      currentTimeout += log.delay;
      setTimeout(() => {
        setStartupLogs(prev => [...prev, `[INFO] ${log.text}`]);
      }, currentTimeout);
    });

    // Check variables validation status for the selected environment
    setTimeout(() => {
      const activeVars = environmentsData[validatorTargetEnv];
      const missingRequired: string[] = [];
      const unencryptedSensitive: string[] = [];
      const insecureFlags: string[] = [];

      activeVars.forEach(v => {
        if (v.required && !v.value) {
          missingRequired.push(v.key);
        }
        if (v.isSensitive && !v.isEncrypted && validatorTargetEnv === 'production') {
          unencryptedSensitive.push(v.key);
        }
        if (v.key === 'DEBUG_MODE' && v.value === 'true' && validatorTargetEnv === 'production') {
          insecureFlags.push('DEBUG_MODE is enabled in production');
        }
        if (v.key === 'COOKIE_SECURE' && v.value === 'false' && validatorTargetEnv === 'production') {
          insecureFlags.push('COOKIE_SECURE is disabled in production');
        }
      });

      // Show validator outcome logs
      if (missingRequired.length > 0) {
        setStartupLogs(prev => [
          ...prev,
          `[CRITICAL] 🛑 SHUTDOWN ERROR: Missing mandatory environment variables! System startup rejected.`,
          ...missingRequired.map(key => `[ERROR] Required environment variable "${key}" is UNDEFINED.`),
          `[CRITICAL] System entered safe shutdown. Process terminated with exit code 1.`
        ]);
        setStartupStatus('failure');
        addLog(`❌ فشل إقلاع النظام في بيئة [${validatorTargetEnv.toUpperCase()}]: توجد إعدادات مفقودة.`);
        triggerNotification('فشل بدء التشغيل: توجد متغيرات حيوية إلزامية مفقودة!', 'danger');
      } else if (validatorTargetEnv === 'production' && (unencryptedSensitive.length > 0 || insecureFlags.length > 0)) {
        // If production has unencrypted secrets or insecure defaults, it may start but with heavy warnings or reject depending on strictness
        setStartupLogs(prev => [
          ...prev,
          `[WARN] ⚠️ GOVERNANCE ALERT: Non-compliant configuration detected for production environment!`,
          ...unencryptedSensitive.map(key => `[WARN] Exposed plaintext secret: "${key}" is sensitive but NOT encrypted.`),
          ...insecureFlags.map(msg => `[WARN] Insecure default flag: ${msg}.`),
          `[INFO] System started but triggered high security telemetry alerts to Saudi Gov compliance board.`
        ]);
        setStartupStatus('success');
        addLog(`⚠️ تم تشغيل النظام لبيئة [${validatorTargetEnv.toUpperCase()}] ولكن مع وجود خروقات أمان وحوكمة.`);
        triggerNotification('تم تشغيل النظام ولكن رصدت ثغرات غير ممتثلة لمعايير الأمان!', 'warning');
      } else {
        setStartupLogs(prev => [
          ...prev,
          `[INFO] ✓ All ${activeVars.length} variables validated successfully.`,
          `[INFO] ✓ Database and cryptography engines checked. JWT token integrity verified.`,
          `[INFO] ✓ Centralized Riyadh educational node successfully bounded on port 3000.`,
          `[SUCCESS] 🎉 Riyadh Platform initialized stable. Running securely in [${validatorTargetEnv.toUpperCase()}] mode.`
        ]);
        setStartupStatus('success');
        addLog(`✓ تم إقلاع نظام بيئة [${validatorTargetEnv.toUpperCase()}] بنجاح تام وبأقصى درجات الحماية.`);
        triggerNotification('اكتمل فحص إقلاع النظام بنجاح! جميع شروط الأمان مطبقة.', 'success');
      }
      setIsSimulatingStartup(false);
    }, 1800);
  };

  // 4. CONFIG ENCRYPTION ENGINE SIMULATOR (AES-256-GCM)
  const handleRunEncryption = () => {
    if (!rawTextToEncrypt.trim()) return;
    setIsEncrypting(true);
    addLog(`🔐 جاري تشفير المعطيات الحساسة بطلب يدوي... الخوارزمية: ${encryptionAlgorithm}`);
    
    setTimeout(() => {
      const encoder = new TextEncoder();
      const encoded = encoder.encode(rawTextToEncrypt);
      // Simulated robust hash to represent real cipher block
      let hash = 0;
      for (let i = 0; i < rawTextToEncrypt.length; i++) {
        hash = (hash << 5) - hash + rawTextToEncrypt.charCodeAt(i);
        hash |= 0;
      }
      const cipherHex = Math.abs(hash).toString(16).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
      const output = `enc_${encryptionAlgorithm.toLowerCase().replace(/-/g, '_')}_key_sa_${cipherHex}`;
      
      setEncryptedOutput(output);
      setDecryptionSuccess(true);
      setIsEncrypting(false);
      addLog(`✓ تم التشفير بنجاح. القيمة الناتجة: ${output}`);
      triggerNotification('تم تشفير البيانات الحساسة بنجاح وعزلها عن الملاحظة!', 'success');
    }, 800);
  };

  // 5. MANAGE VARIABLE MUTATION (ADD NEW)
  const handleAddNewVariable = () => {
    if (!newVarKey.trim() || !newVarVal.trim()) {
      triggerNotification('يرجى تعبئة اسم المتغير وقيمته أولاً', 'warning');
      return;
    }

    const newVar: EnvVariable = {
      key: newVarKey.toUpperCase().replace(/\s+/g, '_'),
      value: newVarVal,
      isSensitive: newVarSensitive,
      isEncrypted: false,
      category: newVarCat,
      descriptionEn: 'User added custom governance property',
      descriptionAr: 'متغير مدخل مخصص مضاف من مسؤول النظام',
      required: false,
      defaultValue: ''
    };

    setEnvironmentsData(prev => {
      const updated = { ...prev };
      // Add to selected environment
      updated[selectedEnv] = [newVar, ...updated[selectedEnv]];
      return updated;
    });

    setNewVarKey('');
    setNewVarVal('');
    setIsAddingVar(false);
    addLog(`✓ تم إضافة المتغير الإعدادي الجديد [${newVar.key}] بنجاح إلى بيئة [${selectedEnv.toUpperCase()}].`);
    triggerNotification('تم حفظ وإضافة المتغير الجديد بنجاح!', 'success');
  };

  const handleDeleteVariable = (key: string) => {
    setEnvironmentsData(prev => {
      const updated = { ...prev };
      updated[selectedEnv] = updated[selectedEnv].filter(v => v.key !== key);
      return updated;
    });
    addLog(`✗ تم حذف المتغير الإعدادي [${key}] من بيئة [${selectedEnv.toUpperCase()}].`);
    triggerNotification('تم حذف المتغير بنجاح.', 'info');
  };

  // Memoized variables for finding overview
  const activeFinding = useMemo(() => {
    return findings.find(f => f.id === selectedAuditFinding) || findings[0];
  }, [selectedAuditFinding, findings]);

  // Statistics for charts
  const categoryChartData = useMemo(() => {
    const counts: Record<ConfigCategory, number> = { Database: 0, Security: 0, API: 0, Caching: 0, System: 0 };
    environmentsData[selectedEnv].forEach(v => {
      counts[v.category] = (counts[v.category] || 0) + 1;
    });
    return Object.keys(counts).map(cat => ({
      name: cat,
      value: counts[cat as ConfigCategory],
    }));
  }, [environmentsData, selectedEnv]);

  const envVariablesComparisonData = useMemo(() => {
    return [
      { name: 'Dev', counts: environmentsData.development.length, critical: 1 },
      { name: 'Test', counts: environmentsData.testing.length, critical: 2 },
      { name: 'Staging', counts: environmentsData.staging.length, critical: 1 },
      { name: 'Prod', counts: environmentsData.production.length, critical: 3 }
    ];
  }, [environmentsData]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl" id="configuration-governance-root">
      
      {/* BRANDING BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-850 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-amber-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-350 text-xs font-black">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>DIRECTIVE #020 • حوكمة وتشفير البيئات البرمجية المتعددة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              لوحة حوكمة وتأمين الإعدادات الكلية (Enterprise Configuration Governance)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              مسح وتطهير فوري للملفات البرمجية للكشف والوقاية من تسريب الكلمات السرية (Exposed Secrets)، تكرار المتغيرات الإعدادية وتعارضها (Duplicate Config)، حظر إعدادات المطورين غير الآمنة في بيئة الإنتاج الفعلي، مع فصل معزول لبيئات التطوير، الفحص، ما قبل الإطلاق، والإنتاج المعتمد بالكامل ومحاكاة التثبيت الصارم.
            </p>
          </div>
        </div>

        {/* Bento Board Compliance Status Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800 text-slate-300 font-sans">
          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">نقاط امتثال وحماية الإعدادات</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl sm:text-2xl font-black ${resiliencyScore === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {resiliencyScore}%
              </span>
              <span className="text-[10px] text-slate-500">Parity Score</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">مراقبة التشفير مستمرة ✓</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">إعدادات مكشوفة أو غير آمنة</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl sm:text-2xl font-black ${resiliencyScore === 100 ? 'text-slate-500' : 'text-rose-400'}`}>
                {findings.filter(f => !f.isRepaired).length} ثغرات
              </span>
              <span className="text-xs text-slate-400">Leaked Keys</span>
            </div>
            <span className="text-[10px] text-slate-500">تم مسح 47 ملف برمي</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">المعالجة التلقائية والتعزيز</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-400">{repairedCount} معدلة</span>
              <span className="text-xs text-slate-400">Auto-Healed</span>
            </div>
            <span className="text-[10px] text-amber-400 font-medium">سحب process.env تلقائي</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">تشفير التخزين المؤقت والـ DB</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">AES-256-GCM</span>
              <span className="text-xs text-slate-400">Hardware Crypto</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">تجزئة المفاتيح مفعلة</span>
          </div>
        </div>
      </div>

      {/* CORE NAVIGATION SECTIONS TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 dark:border-slate-850">
          <button
            onClick={() => setActiveSubSection('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeSubSection === 'audit' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>تدقيق وفحص الكود (Exposed Secrets Audit) 🔍</span>
          </button>
          
          <button
            onClick={() => setActiveSubSection('manager')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeSubSection === 'manager' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>مدير البيئات المتعددة (Environment Manager) ⚙️</span>
          </button>

          <button
            onClick={() => setActiveSubSection('validator')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeSubSection === 'validator' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>محاكي إقلاع وفحص النظام (Startup Validator) 🚀</span>
          </button>

          <button
            onClick={() => setActiveSubSection('encryption')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeSubSection === 'encryption' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>تشفير المتغيرات الحساسة (Config Encryptor) 🔐</span>
          </button>

          <button
            onClick={() => setActiveSubSection('report')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeSubSection === 'report' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>تقرير الأمان وحوكمة التهيئة (Governance Report) 📊</span>
          </button>
        </div>
      </div>

      {/* SUB-SECTION 1: EXPOSED SECRETS AUDIT SCREEN */}
      {activeSubSection === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Finding list selector sidebar */}
          <div className="lg:col-span-5 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>نتائج فحص التدقيق الأمني (Audit Violations)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">تم العثور على مخالفات يجب تصحيحها أو تشفيرها.</p>
              </div>

              <button
                onClick={handleTriggerAudit}
                disabled={isAuditing}
                className="text-[10px] font-black bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200/50 cursor-pointer"
              >
                {isAuditing ? 'جاري الفحص...' : 'إعادة مسح الكود'}
              </button>
            </div>

            <div className="space-y-3">
              {findings.map((finding) => {
                const isSelected = selectedAuditFinding === finding.id;
                return (
                  <button
                    key={finding.id}
                    onClick={() => setSelectedAuditFinding(finding.id)}
                    className={`w-full text-right p-4 border transition-all flex flex-col gap-2 cursor-pointer relative overflow-hidden ${
                      isSelected 
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/10' 
                        : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        {finding.isRepaired ? (
                          <span className="bg-emerald-500/15 text-emerald-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                            ✓ تم الإصلاح
                          </span>
                        ) : (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            finding.severity === 'critical' ? 'bg-rose-500/15 text-rose-500 border-rose-500/30' :
                            finding.severity === 'high' ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' :
                            'bg-orange-500/15 text-orange-500 border-orange-500/30'
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
                      {finding.detailsAr}
                    </p>

                    <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>الملف: {finding.fileEn}</span>
                      {finding.canAutoRepair && !finding.isRepaired && (
                        <span className="text-amber-500 font-extrabold animate-pulse">إصلاح تلقائي متاح ⚙️</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* General Autoclean action */}
            {findings.some(f => !f.isRepaired) && (
              <button
                onClick={handleRepairAll}
                disabled={isRepairingAll}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white font-extrabold py-3 px-4 text-xs shadow-lg shadow-amber-600/15 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                {isRepairingAll ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-200" />
                )}
                <span>تطهير ومعالجة جميع المشاكل تلقائياً (Auto-Heal) ✨</span>
              </button>
            )}
          </div>

          {/* Finding detailed view and interactive comparisons */}
          <div className="lg:col-span-7 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                تفاصيل المخالفة ومعاينة الإصلاح البرمجي المقترح
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                توضيح كيفية تأثير الإعداد الحالي وسيناريو استبداله بالمتغيرات الممتثلة لمعايير الأمان السعودية.
              </p>
            </div>

            <div className="border border-slate-150 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${activeFinding.isRepaired ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}>
                  {activeFinding.isRepaired ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6 animate-pulse" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black text-slate-950 dark:text-white">{activeFinding.titleAr}</span>
                    <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                      {activeFinding.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                    {activeFinding.detailsAr}
                  </p>
                  <p className="text-[11px] text-slate-500 italic text-left" dir="ltr">
                    {activeFinding.detailsEn}
                  </p>
                </div>
              </div>

              <div className="dark:bg-slate-900 p-3 dark:border-slate-800 text-xs font-mono text-slate-500 flex justify-between items-center">
                <span>مسار الملف البرمجي المستهدف: <strong className="text-amber-500">{activeFinding.fileEn}</strong></span>
                <span className="text-[10px] text-slate-400">Governance Scope: Direct File Scan</span>
              </div>
            </div>

            {/* Code comparisons (Unsafe vs Safe) based on finding type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unsafe Code */}
              <div className="border border-rose-200 dark:border-rose-950 overflow-hidden bg-rose-50/30 dark:bg-rose-950/5 font-mono text-xs">
                <div className="bg-rose-100/60 dark:bg-rose-950/40 px-4 py-2 border-b border-rose-200 dark:border-rose-950 flex justify-between items-center text-rose-700 dark:text-rose-400">
                  <span className="font-extrabold">كود مكشوف أو غير آمن ❌</span>
                  <span className="text-[10px]">Unsafe Code</span>
                </div>
                <div className="p-4 overflow-x-auto text-left" dir="ltr">
                  {activeFinding.id === 'find_hardcoded' && (
                    <pre className="text-rose-600 dark:text-rose-300">
{`// /src/db/connection.ts
import { Pool } from 'pg';

export const dbPool = new Pool({
  host: '<server-managed-host>',
  user: '<server-managed-user>',
  password: '<not-stored-in-source>',
  database: '<server-managed-database>'
});`}
                    </pre>
                  )}
                  {activeFinding.id === 'find_exposed_gemini' && (
                    <pre className="text-rose-600 dark:text-rose-300">
{`// /src/components/AIPredictor.tsx
import { GoogleGenAI } from '@google/genai';

// ❌ Exposing key on frontend components!
const ai = new GoogleGenAI({
  apiKey: "<not-stored-in-source>"
});`}
                    </pre>
                  )}
                  {activeFinding.id === 'find_insecure_defaults' && (
                    <pre className="text-rose-600 dark:text-rose-300">
{`// /config/production.env
COOKIE_SECURE=false
DEBUG_MODE=true // ❌ Server traces exposed to users
TOKEN_EXPIRY=never`}
                    </pre>
                  )}
                  {activeFinding.id === 'find_duplicated' && (
                    <pre className="text-rose-600 dark:text-rose-300">
{`// /config/production.env
REDIS_HOST=redis-prod.vpc.internal
# ... other lines ...
REDIS_HOST=localhost # ❌ Overwriting production path!`}
                    </pre>
                  )}
                  {activeFinding.id === 'find_mismatch' && (
                    <pre className="text-rose-600 dark:text-rose-300">
{`// /config/testing.env
DATABASE_URL=<server-side-test-connection-string>
# Missing GEMINI_API_KEY declaration!`}
                    </pre>
                  )}
                </div>
              </div>

              {/* Safe Secure Code */}
              <div className="border border-emerald-200 dark:border-emerald-950 overflow-hidden bg-emerald-50/30 dark:bg-emerald-950/5 font-mono text-xs">
                <div className="bg-emerald-100/60 dark:bg-emerald-950/40 px-4 py-2 border-b border-emerald-200 dark:border-emerald-950 flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                  <span className="font-extrabold">الترميز الممتثل والآمن ✓</span>
                  <span className="text-[10px]">Secure Encrypted State</span>
                </div>
                <div className="p-4 overflow-x-auto text-left" dir="ltr">
                  {activeFinding.id === 'find_hardcoded' && (
                    <pre className="text-emerald-600 dark:text-emerald-300">
{`// /src/db/connection.ts
import { Pool } from 'pg';

export const dbPool = new Pool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  // ✅ Resolved from process.env via CJS bundle
  password: process.env.DATABASE_PASSWORD, 
  database: process.env.DATABASE_NAME
});`}
                    </pre>
                  )}
                  {activeFinding.id === 'find_exposed_gemini' && (
                    <pre className="text-emerald-600 dark:text-emerald-300">
{`// /src/server/gemini.ts (Moved Backend Only)
import { GoogleGenAI } from '@google/genai';

// ✅ Key read only on secure server-side Express runtime
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});`}
                    </pre>
                  )}
                  {activeFinding.id === 'find_insecure_defaults' && (
                    <pre className="text-emerald-600 dark:text-emerald-300">
{`// /config/production.env (Autocorrected)
COOKIE_SECURE=true // ✅ Enforced SSL Transfer
DEBUG_MODE=false // ✅ Disabled tracing in production
TOKEN_EXPIRY=15m`}
                    </pre>
                  )}
                  {activeFinding.id === 'find_duplicated' && (
                    <pre className="text-emerald-600 dark:text-emerald-300">
{`// /config/production.env (Unified)
# ✅ Kept single accurate cluster entry
REDIS_HOST=redis-prod.vpc.internal`}
                    </pre>
                  )}
                  {activeFinding.id === 'find_mismatch' && (
                    <pre className="text-emerald-600 dark:text-emerald-300">
{`// /config/testing.env (Synchronized)
DATABASE_URL=<server-side-test-connection-string>
# ✅ Auto synchronized with dummy testing credentials
GEMINI_API_KEY=<not-stored-in-source>`}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* Repair specific item action */}
            {!activeFinding.isRepaired && (
              <div className="bg-transparent dark:bg-slate-950 p-4 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-950 dark:text-white">إصلاح فوري لهذه المشكلة الفردية</span>
                  <p className="text-[11px] text-slate-400">سوف يقوم النظام بنقل القيمة لملف .env المناسب واستبدالها برمجياً.</p>
                </div>
                <button
                  onClick={() => {
                    setFindings(prev => prev.map(f => f.id === activeFinding.id ? { ...f, isRepaired: true } : f));
                    setRepairedCount(prev => prev + 1);
                    setResiliencyScore(prev => Math.min(prev + 9, 100));
                    addLog(`✓ تم إصلاح المشكلة الفردية [${activeFinding.titleEn}] تلقائياً وتحصين الملف.`);
                    triggerNotification(`تم بنجاح إصلاح وترحيل المتغير لـ ${activeFinding.fileEn}`, 'success');
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-black px-4 py-2 cursor-pointer shrink-0 transition-all active:scale-95"
                >
                  تطبيق الإصلاح البرمجي المقترح ⚙️
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: ENVIRONMENT VARIABLE MANAGER SCREEN */}
      {activeSubSection === 'manager' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main environment explorer & variables table */}
          <div className="lg:col-span-8 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">
                  مستكشف ومحرر متغيرات البيئة (Environment Matrix Manager)
                </h3>
                <p className="text-xs text-slate-500 mt-1">تعديل قيم المتغيرات البيئية وفحصها لكل نطاق بشكل معزول كلياً.</p>
              </div>

              {/* Add custom parameter button */}
              <button
                onClick={() => setIsAddingVar(!isAddingVar)}
                className="flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 text-xs font-black transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة متغير جديد ➕</span>
              </button>
            </div>

            {/* Add custom variables overlay form */}
            {isAddingVar && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-transparent dark:bg-slate-950 p-4 dark:border-slate-800 space-y-4"
              >
                <h4 className="text-xs font-black text-slate-950 dark:text-white">إضافة إعداد مالي أو تقني مخصص للبيئة المختارة:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">مفتاح المتغير (UPPERCASE_ONLY)</label>
                    <input
                      type="text"
                      placeholder="e.g. SMTP_HOST"
                      value={newVarKey}
                      onChange={(e) => setNewVarKey(e.target.value)}
                      className="w-full dark:bg-slate-900 dark:border-slate-800 p-2.5 font-mono text-left text-slate-900 dark:text-white"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">قيمة المتغير</label>
                    <input
                      type="text"
                      placeholder="e.g. mail.riyadh.edu.sa"
                      value={newVarVal}
                      onChange={(e) => setNewVarVal(e.target.value)}
                      className="w-full dark:bg-slate-900 dark:border-slate-800 p-2.5 font-mono text-left text-slate-900 dark:text-white"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">التصنيف الإداري</label>
                    <select
                      value={newVarCat}
                      onChange={(e) => setNewVarCat(e.target.value as ConfigCategory)}
                      className="w-full dark:bg-slate-900 dark:border-slate-800 p-2.5 text-slate-900 dark:text-white"
                    >
                      <option value="System">System (النظام)</option>
                      <option value="Database">Database (قاعدة البيانات)</option>
                      <option value="Security">Security (الأمان)</option>
                      <option value="API">API (الربط الخارجي)</option>
                      <option value="Caching">Caching (الذاكرة المؤقتة)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={newVarSensitive}
                      onChange={(e) => setNewVarSensitive(e.target.checked)}
                      className="rounded border-slate-350 accent-amber-600"
                    />
                    <span>هل يحتوي على بيانات حساسة أو كلمات مرور؟ (تشفير تلقائي متاح)</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAddingVar(false)}
                      className="px-3.5 py-1.5 rounded-lg dark:border-slate-800 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleAddNewVariable}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-black px-4 py-1.5 rounded-lg cursor-pointer"
                    >
                      حفظ وإضافة المتغير
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Env selector tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 dark:border-slate-850">
              {(['development', 'testing', 'staging', 'production'] as ConfigEnvironment[]).map((env) => (
                <button
                  key={env}
                  onClick={() => setSelectedEnv(env)}
                  className={`flex-1 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                    selectedEnv === env 
                      ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 dark:border-slate-800' 
                      : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'
                  }`}
                >
                  {env === 'development' ? 'بيئة التطوير (Development)' :
                   env === 'testing' ? 'بيئة الاختبار (Testing)' :
                   env === 'staging' ? 'بيئة ما قبل الإطلاق (Staging)' :
                   'بيئة الإنتاج المباشر (Production)'}
                </button>
              ))}
            </div>

            {/* Environment Variable list list-table */}
            <div className="overflow-hidden dark:border-slate-850 rounded-2xl">
              <table className="w-full text-xs text-right">
                <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                  <tr>
                    <th className="p-4">اسم المفتاح (KEY)</th>
                    <th className="p-4">القيمة الفعالة (Value)</th>
                    <th className="p-4">التصنيف</th>
                    <th className="p-4">مستوى الحماية</th>
                    <th className="p-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                  {environmentsData[selectedEnv].map((v) => (
                    <tr key={v.key} className="dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                      <td className="p-4 font-mono font-black text-slate-950 dark:text-white" dir="ltr">
                        {v.key}
                      </td>
                      <td className="p-4 font-mono">
                        {v.isSensitive && !showValues[v.key] ? (
                          <span className="text-slate-400 font-black">••••••••••••••••</span>
                        ) : (
                          <span className={`${v.isEncrypted ? 'text-amber-500 font-extrabold' : 'text-slate-600 dark:text-slate-350'}`}>
                            {v.value || <em className="text-rose-400">مفقود (UNDEFINED)</em>}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                          {v.category}
                        </span>
                      </td>
                      <td className="p-4">
                        {v.isSensitive ? (
                          <div className="flex items-center gap-1">
                            {v.isEncrypted ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                                <LockIcon className="w-3 h-3" />
                                <span>مخفي ومحمي</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
                                <Unlock className="w-3 h-3" />
                                <span>نص واضح (Plain)</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">عام (Public)</span>
                        )}
                      </td>
                      <td className="p-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          {v.isSensitive && (
                            <button
                              onClick={() => toggleShowValue(v.key)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              title="عرض/إخفاء القيمة"
                            >
                              {showValues[v.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteVariable(v.key)}
                            className="text-rose-400 hover:text-rose-600 cursor-pointer"
                            title="حذف المتغير"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right sidebar with env-specific stats & warnings */}
          <div className="lg:col-span-4 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-5 space-y-6 shadow-sm">
            <div>
              <h4 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span>إحصائيات البيئة الحالية: [{selectedEnv.toUpperCase()}]</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">توزيع المتغيرات حسب تصنيفات الحوكمة المعيارية.</p>
            </div>

            {/* Recharts Pie showing category counts */}
            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => {
                      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} متغير`, 'العدد']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-slate-950 dark:text-white">{environmentsData[selectedEnv].length}</span>
                <span className="text-[9px] text-slate-400">إجمالي المدخلات</span>
              </div>
            </div>

            {/* Category breakdown legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              {categoryChartData.map((d, idx) => {
                const colors = ['bg-amber-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-orange-500'];
                return (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`} />
                    <span className="truncate">{d.name} ({d.value})</span>
                  </div>
                );
              })}
            </div>

            {/* Security Notice for production environment */}
            {selectedEnv === 'production' && (
              <div className="bg-rose-500/5 p-4 border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-500 text-xs font-black">
                  <ShieldAlert className="w-4 h-4" />
                  <span>تنبيه أمان بيئة الإنتاج:</span>
                </div>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 leading-relaxed font-semibold">
                  تحتوي بيئة الإنتاج الفعلي على مفاتيح ربط مخصصة. احرص دائماً على تشفير كلمات السر وعدم تمرير أي متغير خارجي بصيغة نص عادي لتفادي الإيقاف من الهيئة الوطنية للأمن السيبراني.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: STARTUP VALIDATOR SIMULATOR SCREEN */}
      {activeSubSection === 'validator' && (
        <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-150 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>إطار محاكاة إقلاع وصلاحية النظام (Application Startup Validator)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تطبيق اختبار صارم لقوانين الإعدادات. النظام سوف يرفض الإقلاع كلياً (Hard Crash) عند عدم توفر أي متغير حيوي كـ <code className="text-amber-500">JWT_SECRET</code> أو <code className="text-amber-500">DATABASE_URL</code>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Target environment selector for startup simulation */}
              <div className="text-xs">
                <span className="text-slate-400 font-bold ml-2">البيئة المستهدفة للفحص:</span>
                <select
                  value={validatorTargetEnv}
                  onChange={(e) => setValidatorTargetEnv(e.target.value as ConfigEnvironment)}
                  className="bg-slate-100 dark:bg-slate-950 dark:border-slate-800 p-2 rounded-lg text-slate-900 dark:text-white text-xs"
                >
                  <option value="development">التطوير (Development)</option>
                  <option value="testing">الاختبار (Testing)</option>
                  <option value="staging">ما قبل الإطلاق (Staging)</option>
                  <option value="production">الإنتاج الفعلي (Production)</option>
                </select>
              </div>

              <button
                onClick={handleSimulateStartup}
                disabled={isSimulatingStartup}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-2.5 text-xs shadow-lg shadow-amber-600/10 cursor-pointer"
              >
                {isSimulatingStartup ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>فحص إقلاع السيرفر 🚀</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Startup Requirements Checklist */}
            <div className="bg-transparent dark:bg-slate-950/45 p-5 border border-slate-150 dark:border-slate-850 space-y-4">
              <h4 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span>شروط ومعايير التثبيت وقبول الإقلاع:</span>
              </h4>

              <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-350">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold block text-slate-900 dark:text-white">DATABASE_URL</span>
                    <span className="text-[10px] text-slate-500">مطلوب وحيوي للاتصال بمخزن المعاملات المحاسبية والأكاديمية.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold block text-slate-900 dark:text-white">JWT_SECRET</span>
                    <span className="text-[10px] text-slate-500">إجباري لتشغيل آلية مصادقة الموظفين والطلاب في بوابات الدخول.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold block text-slate-900 dark:text-white">GEMINI_API_KEY</span>
                    <span className="text-[10px] text-slate-500">إجباري لتفعيل توقعات الأداء ومحركات الأتمتة المعتمدة.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 text-amber-500">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold block text-slate-900 dark:text-white">تشفير بيئة الإنتاج الفعلي (Prod Encryption)</span>
                    <span className="text-[10px] text-slate-500">يجب تشفير جميع الـ Secrets الحساسة عند محاولة الإقلاع بالإنتاج.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Virtual SSH terminal emulation with logs */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-850 overflow-hidden font-mono text-xs flex flex-col h-72">
              <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-850 flex justify-between items-center text-slate-400 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span>riyadh_platform_startup_agent.sh</span>
                <span className="text-amber-400 font-bold">PORT: 3000 ✓</span>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-2 text-left text-slate-350" dir="ltr">
                {startupLogs.length === 0 ? (
                  <div className="text-slate-500 h-full flex items-center justify-center text-center italic">
                    [System Idle] Click "فحص إقلاع السيرفر" above to trigger a simulated application boots.
                  </div>
                ) : (
                  startupLogs.map((log, idx) => {
                    let color = 'text-slate-350';
                    if (log.includes('[SUCCESS]')) color = 'text-emerald-400 font-black';
                    if (log.includes('[ERROR]') || log.includes('[CRITICAL]')) color = 'text-rose-400 font-bold';
                    if (log.includes('[WARN]')) color = 'text-amber-400 font-semibold';
                    return (
                      <div key={idx} className={`${color} leading-relaxed`}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Status footer for console screen */}
              {startupStatus !== 'idle' && (
                <div className={`px-4 py-3 text-xs font-black flex items-center gap-2 ${
                  startupStatus === 'success' ? 'bg-emerald-900/30 text-emerald-400 border-t border-emerald-800/40' :
                  'bg-rose-900/30 text-rose-400 border-t border-rose-800/40'
                }`}>
                  {startupStatus === 'success' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4 animate-bounce" />}
                  <span>
                    {startupStatus === 'success' ? '✓ تم إجازة فحص الإقلاع. النظام آمن ومطابق للمواصفات.' : '❌ تم رفض إقلاع التطبيق (Startup Blocked) لحين سد الثغرات.'}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SUB-SECTION 4: CONFIG ENCRYPTION ENGINE SCREEN */}
      {activeSubSection === 'encryption' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main encryptor sandbox tools */}
          <div className="lg:col-span-7 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <LockIcon className="w-4 h-4 text-amber-500" />
                <span>محرك تشفير وتعمية البيانات الحساسة (Config Cryptography Engine)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تطبيق خوارزميات التشفير المعتمدة على كلمات المرور، والروابط السرية، والـ API Keys قبل تخزينها في ملفات الإعدادات.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">النص السري المراد تشفيره (Plaintext Secret Key):</label>
                <textarea
                  value={rawTextToEncrypt}
                  onChange={(e) => setRawTextToEncrypt(e.target.value)}
                  className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 p-3.5 font-mono text-left text-xs text-slate-900 dark:text-white"
                  rows={3}
                  dir="ltr"
                  placeholder="Enter passwords, tokens, API keys here to see standard AES cipher..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400 font-bold">خوارزمية التشفير المتماثل:</span>
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg dark:border-slate-850">
                    {['AES-256-GCM', 'ChaCha20-Poly1305'].map((algo) => (
                      <button
                        key={algo}
                        onClick={() => setEncryptionAlgorithm(algo as any)}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-black cursor-pointer transition-all ${
                          encryptionAlgorithm === algo 
                            ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'
                        }`}
                      >
                        {algo}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRunEncryption}
                  disabled={isEncrypting}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-2.5 text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  {isEncrypting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LockIcon className="w-3.5 h-3.5" />}
                  <span>تشفير النص الآن 🔐</span>
                </button>
              </div>

              {/* Show encrypted output cipher results */}
              {encryptedOutput && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800"
                >
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">النص المشفر الممتص والآمن (Secure Ciphertext output):</span>
                  
                  <div className="bg-amber-950/20 text-amber-400 border border-amber-500/20 p-4 font-mono text-xs text-left relative flex items-center justify-between" dir="ltr">
                    <span className="break-all pr-8 font-black">{encryptedOutput}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(encryptedOutput);
                        triggerNotification('تم نسخ النص المشفر إلى الحافظة!', 'success');
                      }}
                      className="absolute right-4 text-amber-400 hover:text-amber-200 cursor-pointer"
                      title="نسخ النص المشفر"
                    >
                      <Copy className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    ✓ هذا النص المشفر آمن تماماً للكتابة المباشرة في ملفات التكوين. يقوم نظام فك التشفير التلقائي (Configuration Decryptor Bootstrapper) باستعادة القيمة الأصلية للذاكرة فقط عند الإقلاع دون تسريبها للمتصفح أو الكود.
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Cryptography details explanation sidebar */}
          <div className="lg:col-span-5 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-5 space-y-6 shadow-sm">
            <div>
              <h4 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>بروتوكولات التشفير وحماية البيانات</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">تفاصيل حول كيفية عمل نظام تأمين الإعدادات في Riyadh Cloud node.</p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
              <div className="p-3.5 bg-transparent dark:bg-slate-950 dark:border-slate-800 space-y-1">
                <span className="text-slate-900 dark:text-white font-black block">1. آلية AES-256-GCM المشفرة:</span>
                <p className="text-[11px] text-slate-500">
                  خوارزمية تشفير متناظر تضمن السرية المطلقة وسلامة البيانات (Authenticated Encryption with Associated Data). تمنع المهاجمين من التلاعب بالنصوص المشفرة وتضمن عدم استخدام كلمات مرور مكشوفة.
                </p>
              </div>

              <div className="p-3.5 bg-transparent dark:bg-slate-950 dark:border-slate-800 space-y-1">
                <span className="text-slate-900 dark:text-white font-black block">2. مفاتيح الأجهزة القوية (KMS):</span>
                <p className="text-[11px] text-slate-500">
                  يتم فك تشفير النصوص عبر استدعاء آمن لخدمات إدارة المفاتيح السحابية (Cloud Key Management Service) المعزولة والمرتبطة فقط بعنوان السيرفر المعين في شبكة الـ VPC الخاصة بالوزارة.
                </p>
              </div>

              <div className="p-3.5 bg-transparent dark:bg-slate-950 border border-rose-500/10 space-y-1">
                <span className="text-rose-600 dark:text-rose-400 font-black block">🚨 منع التمرير إلى الـ JavaScript:</span>
                <p className="text-[11px] text-rose-500/80">
                  تأكد من عدم استخدام بادئة <code className="text-rose-600">VITE_</code> للمتغيرات الحساسة؛ حيث أن كتابتها بهذا الشكل يتيح قراءتها وملاحظتها عبر المتصفحات.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUB-SECTION 5: FORMAL GOVERNANCE REPORT */}
      {activeSubSection === 'report' && (
        <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 sm:p-8 space-y-8">
          
          {/* Action buttons on top of document */}
          <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                وثيقة تدقيق واعتماد حوكمة إعدادات البيئة (Governance Configuration Report)
              </h3>
              <p className="text-xs text-slate-500 mt-1">مستند رسمي ممتثل لشروط هيئة الأمن السيبراني السعودية والتحقق الشامل من الأمان.</p>
            </div>

            <button
              onClick={() => {
                triggerNotification('جاري توليد نسخة PDF مهيأة للطباعة...', 'info');
                window.print();
              }}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-850 text-white font-extrabold px-4 py-2 text-xs transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير وطباعة التقرير 📄</span>
            </button>
          </div>

          {/* Actual Printable Document Container */}
          <div className="border-4 border-double border-slate-200 dark:border-slate-800 p-6 sm:p-10 dark:bg-slate-950 text-slate-900 dark:text-slate-100 space-y-8 print:border-none print:print:text-black">
            
            {/* Header Logos */}
            <div className="flex justify-between items-start gap-4 pb-6 border-b-2 border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-bold block">المملكة العربية السعودية (KSA)</span>
                <span className="text-xs font-black block text-slate-950 dark:text-white">برنامج مواءمة التحول الرقمي والامتثال السيبراني</span>
                <span className="text-[10px] text-slate-500 font-semibold block">إدارة الحوكمة والمخاطر والامتثال (GRC)</span>
              </div>

              <div className="text-center font-serif">
                <div className="text-xl font-black text-amber-600 dark:text-amber-400">RIYADH PLATFORM</div>
                <div className="text-[8px] text-slate-400 tracking-widest uppercase">Configuration Audit Protocol</div>
              </div>

              <div className="text-left space-y-1" dir="ltr">
                <span className="text-[10px] text-slate-400 font-bold block">Date: {new Date().toLocaleDateString('en-US')}</span>
                <span className="text-[10px] text-slate-400 font-bold block">Doc ID: CONFIG-GOV-2026-020</span>
                <span className="text-[10px] text-emerald-500 font-black block">Status: COMPLIANT APPROVED</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">تقرير الحوكمة والامتثال لمتغيرات البيئات المتعددة (Directive #020)</h1>
              <p className="text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                يشهد ممثلو الأمان الرقمي في الرياض لبرمجيات التعليم، بأنه قد تم فحص إعدادات النظام ومواقع تخزين المفاتيح، وتأكيد التزام جميع البيئات بأعلى مستويات الحوكمة.
              </p>
            </div>

            {/* Audit metrics and ratings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
              <div className="dark:border-slate-800 p-4 text-center space-y-1 bg-transparent dark:bg-slate-900/50">
                <span className="text-[10px] text-slate-400 block font-bold">نقاط الأمان والامتثال الإجمالية</span>
                <div className="text-2xl font-black text-emerald-500">{resiliencyScore}%</div>
                <span className="text-[9px] text-slate-500 block">Governance Compliance Grade</span>
              </div>

              <div className="dark:border-slate-800 p-4 text-center space-y-1 bg-transparent dark:bg-slate-900/50">
                <span className="text-[10px] text-slate-400 block font-bold">مجموع المتغيرات المحصنة</span>
                <div className="text-2xl font-black text-amber-500">
                  {environmentsData.production.filter(v => v.isEncrypted).length} / {environmentsData.production.filter(v => v.isSensitive).length}
                </div>
                <span className="text-[9px] text-slate-500 block">Encrypted / Total Sensitive Keys</span>
              </div>

              <div className="dark:border-slate-800 p-4 text-center space-y-1 bg-transparent dark:bg-slate-900/50">
                <span className="text-[10px] text-slate-400 block font-bold">مستوى الفحص والتدقيق التلقائي</span>
                <div className="text-2xl font-black text-amber-500">شامل (Full Scan)</div>
                <span className="text-[9px] text-slate-500 block">Strict Startup Guard Enabled</span>
              </div>
            </div>

            {/* Detailed Environment Analysis & Parity checklist */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-950 dark:text-white border-r-4 border-amber-500 pr-3">
                نتائج مطابقة وتوافق البيئات البرمجية (Environment Parity Analysis)
              </h3>

              <div className="overflow-hidden dark:border-slate-800 rounded-xl">
                <table className="w-full text-xs text-right">
                  <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                    <tr>
                      <th className="p-3">البيئة البرمجية</th>
                      <th className="p-3">مجموع المتغيرات</th>
                      <th className="p-3">حظر وضع التطوير والـ Debug</th>
                      <th className="p-3">تشفير كلمات المرور والرموز</th>
                      <th className="p-3">مستوى الامتثال الكلي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                    <tr>
                      <td className="p-3 font-bold">التطوير (Development)</td>
                      <td className="p-3 font-mono">{environmentsData.development.length} متغيرات</td>
                      <td className="p-3 text-rose-500">غير مطلوب (مسموح بالتتبع)</td>
                      <td className="p-3 text-slate-400">غير مستخدم</td>
                      <td className="p-3 font-bold text-slate-500">تحت التطوير (80%)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">الاختبار (Testing)</td>
                      <td className="p-3 font-mono">{environmentsData.testing.length} متغيرات</td>
                      <td className="p-3 text-rose-500">غير مطلوب (مسموح بالتتبع)</td>
                      <td className="p-3 text-slate-400">غير مستخدم</td>
                      <td className="p-3 font-bold text-slate-500">تحت الاختبار (85%)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">ما قبل الإطلاق (Staging)</td>
                      <td className="p-3 font-mono">{environmentsData.staging.length} متغيرات</td>
                      <td className="p-3 text-emerald-500">مغلق وآمن ✓</td>
                      <td className="p-3 text-slate-400">تشفير جزئي</td>
                      <td className="p-3 font-bold text-amber-500">شبه مكتمل (92%)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">الإنتاج الفعلي (Production)</td>
                      <td className="p-3 font-mono">{environmentsData.production.length} متغيرات</td>
                      <td className="p-3 text-emerald-500">مغلق وآمن ومحجوب ✓</td>
                      <td className="p-3 text-emerald-500">تشفير كامل بـ GCM ✓</td>
                      <td className="p-3 font-bold text-emerald-500">امتثال تام (100% Approved)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="space-y-4">
                <span>مسؤول الأمن السيبراني والحوكمة (GRC Officer):</span>
                <div className="h-16 flex items-end">
                  <div className="border-b border-slate-350 w-48 text-center pb-1 font-serif text-slate-500 italic">Dean of Riyadh Academic Platform</div>
                </div>
                <span className="text-[10px] text-slate-400 block">التوقيع والختم الرسمي للجنة الرقمية</span>
              </div>

              <div className="space-y-4">
                <span>رئيس المهندسين ومدير العمليات (DevOps Director):</span>
                <div className="h-16 flex items-end">
                  <div className="border-b border-slate-350 w-48 text-center pb-1 font-serif text-slate-500 italic">Riyadh Principal GRC Auditor</div>
                </div>
                <span className="text-[10px] text-slate-400 block">مطابق لتعليمات الأمن السيبراني NCA</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER TERMINAL MONITORING */}
      <div className="bg-slate-950 border border-slate-850 p-4 space-y-3 font-mono text-[11px] text-slate-400 shadow-xl">
        <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-900">
          <span className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>وحدة مراقبة حوكمة الإعدادات (Live Configuration Audit Logs)</span>
          </span>
          <span className="text-[10px] text-slate-600">Enterprise Node active</span>
        </div>
        <div className="space-y-1 max-h-36 overflow-y-auto text-left" dir="ltr">
          {terminalLogs.map((log, idx) => (
            <div key={idx} className="hover:text-white transition-all text-slate-400">
              {log}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
