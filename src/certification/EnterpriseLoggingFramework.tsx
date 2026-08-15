import { AlertCircle, ArrowUpRight, BarChart3, Check, CheckSquare, Circle, Component, Copy, Database, Download, Filter, Grid, Info, Key, Logs, Navigation, Play, RefreshCw, Scan, School, Search, Shield, ShieldCheck, Sparkles, Table, Terminal, User, Verified } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// ==========================================
// TYPINGS & DATA STRUCTURES FOR SYSTEM LOGS
// ==========================================
export type LogSeverity = 'info' | 'warn' | 'error' | 'critical';
export type LogResult = 'success' | 'failure' | 'denied';
export type LogModule = 'Financial' | 'Security' | 'Authentication' | 'Authorization' | 'Configuration' | 'DataModification';

export interface StructuredLog {
  id: string;
  timestamp: string;
  correlationId: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  academicYear: string;
  userId: string;
  sessionId: string;
  module: LogModule;
  operation: string;
  executionTime: string; // e.g. "45ms"
  severity: LogSeverity;
  result: LogResult;
  descriptionEn: string;
  descriptionAr: string;
  metadata?: Record<string, any>;
}

// Initial Mock Logs representing actual platform occurrences
const INITIAL_LOGS: StructuredLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-07-19T05:51:12Z',
    correlationId: 'corr-81f12e7a-3301-4be3-b921-12f7a93dbfca',
    tenantId: 'tenant-ksa-edu',
    schoolId: 'school-riyadh-01',
    branchId: 'branch-olaya-hq',
    academicYear: '1447-1448H',
    userId: 'user-admin-99',
    sessionId: 'sess-8a7c2b3e4f',
    module: 'Configuration',
    operation: 'Update_Database_Connection_String',
    executionTime: '120ms',
    severity: 'critical',
    result: 'success',
    descriptionEn: 'Database connection host changed from local socket to production-replica-01.vpc.internal',
    descriptionAr: 'تم تغيير رابط الاتصال بقاعدة البيانات من المقبس المحلي إلى السيرفر الاحتياطي للإنتاج',
    metadata: { previousHost: 'localhost', newHost: 'production-replica-01.vpc.internal', method: 'GCM_AES_256' }
  },
  {
    id: 'log-002',
    timestamp: '2026-07-19T05:51:30Z',
    correlationId: 'corr-c01824a7-8f55-46f9-aa32-72e04bfce794',
    tenantId: 'tenant-ksa-edu',
    schoolId: 'school-riyadh-01',
    branchId: 'branch-olaya-hq',
    academicYear: '1447-1448H',
    userId: 'user-finance-04',
    sessionId: 'sess-3e9b1a0f9d',
    module: 'Financial',
    operation: 'Disburse_Faculty_Salaries',
    executionTime: '1850ms',
    severity: 'critical',
    result: 'success',
    descriptionEn: 'Batch salary disbursement triggered for Olaya Branch (Total: SAR 435,000.00)',
    descriptionAr: 'تم تفعيل صرف رواتب الكادر التعليمي لفرع العليا (الإجمالي: 435,000.00 ريال سعودي)',
    metadata: { recordsProcessed: 38, approvedBy: 'user-admin-99', paymentGateway: 'Al-Rajhi-Enterprise' }
  },
  {
    id: 'log-003',
    timestamp: '2026-07-19T05:52:01Z',
    correlationId: 'corr-49e29a91-bc4a-4e20-8041-3827103a8de2',
    tenantId: 'tenant-ksa-edu',
    schoolId: 'school-riyadh-01',
    branchId: 'branch-rawdah',
    academicYear: '1447-1448H',
    userId: 'user-anonymous-ip-10.30.2.14',
    sessionId: 'sess-unauthenticated',
    module: 'Authentication',
    operation: 'User_Login_Attempt',
    executionTime: '82ms',
    severity: 'error',
    result: 'failure',
    descriptionEn: 'Multiple login failures detected for username example-admin (Possible brute-force)',
    descriptionAr: 'تم رصد محاولات دخول فاشلة متكررة لاسم المستخدم example-admin (اشتباه هجوم تخمين)',
    metadata: { ipAddress: '10.30.2.14', failedAttempts: 5, actionTaken: 'Temp_IP_Throttling' }
  },
  {
    id: 'log-004',
    timestamp: '2026-07-19T05:52:15Z',
    correlationId: 'corr-2a781b0a-39fa-4e78-90cb-22920fca02d1',
    tenantId: 'tenant-ksa-edu',
    schoolId: 'school-riyadh-01',
    branchId: 'branch-olaya-hq',
    academicYear: '1447-1448H',
    userId: 'user-registrar-15',
    sessionId: 'sess-9f8e2d4c0b',
    module: 'DataModification',
    operation: 'Delete_Student_Academic_Record',
    executionTime: '450ms',
    severity: 'critical',
    result: 'success',
    descriptionEn: 'Student "Salman Al-Otaibi" registry deleted due to duplicate enrollment cleanup',
    descriptionAr: 'تم حذف ملف الطالب "سلمان العتيبي" نتيجة تنظيف التسجيل المزدوج في النظام الموحد',
    metadata: { studentId: 'stu-9941', authorityToken: 'AUTH-REQ-9942', archivedCopySaved: true }
  },
  {
    id: 'log-005',
    timestamp: '2026-07-19T05:52:45Z',
    correlationId: 'corr-bf512a20-a8c2-4873-9ea1-93a54b38fa10',
    tenantId: 'tenant-ksa-edu',
    schoolId: 'school-riyadh-01',
    branchId: 'branch-rawdah',
    academicYear: '1447-1448H',
    userId: 'user-teacher-08',
    sessionId: 'sess-0f1e2d3c4b',
    module: 'Authorization',
    operation: 'Access_Financial_Ledger',
    executionTime: '15ms',
    severity: 'warn',
    result: 'denied',
    descriptionEn: 'Role TEACHER has no permissions to read payroll ledgers (HTTP 403 Forbidden)',
    descriptionAr: 'رتبة المعلم ليس لديها صلاحية قراءة الدفاتر المحاسبية (رفض الوصول HTTP 403)',
    metadata: { requestedPath: '/api/v1/finance/ledgers', userRole: 'TEACHER', origin: 'Internal-Dashboard' }
  },
  {
    id: 'log-006',
    timestamp: '2026-07-19T05:53:10Z',
    correlationId: 'corr-33bb0a11-5d9c-482d-8ea2-d922bb0c4a4a',
    tenantId: 'tenant-ksa-edu',
    schoolId: 'school-riyadh-01',
    branchId: 'branch-olaya-hq',
    academicYear: '1447-1448H',
    userId: 'user-security-auditor',
    sessionId: 'sess-bc394a0d9b',
    module: 'Security',
    operation: 'Rotate_JWT_Secret_Key',
    executionTime: '85ms',
    severity: 'critical',
    result: 'success',
    descriptionEn: 'Platform authorization token secret key successfully rotated by Security Administrator',
    descriptionAr: 'تم تدوير وتحديث مفتاح تشفير الرموز الأمنية للتحقق JWT بنجاح بواسطة مسؤول الأمان',
    metadata: { algorithm: 'HS512', revokedTokensCount: 241, encryptionLevel: 'FIPS-140-3' }
  },
  {
    id: 'log-007',
    timestamp: '2026-07-19T05:53:40Z',
    correlationId: 'corr-77da201b-bfce-4a11-b0e2-e1c02bfce894',
    tenantId: 'tenant-ksa-edu',
    schoolId: 'school-riyadh-01',
    branchId: 'branch-olaya-hq',
    academicYear: '1447-1448H',
    userId: 'user-finance-04',
    sessionId: 'sess-3e9b1a0f9d',
    module: 'Financial',
    operation: 'Register_Student_Tuition_Payment',
    executionTime: '230ms',
    severity: 'info',
    result: 'success',
    descriptionEn: 'Tuition installment registered for student "Faisal Bin Fahd" (SAR 15,500.00)',
    descriptionAr: 'تم تسجيل دفعة الرسوم الدراسية للطالب "فيصل بن فهد" بمبلغ 15,500.00 ريال سعودي',
    metadata: { paymentMethod: 'MADA_ECOM', invoiceNo: 'INV-2026-904', currentBalance: 'SAR 0.00' }
  },
  {
    id: 'log-008',
    timestamp: '2026-07-19T05:54:02Z',
    correlationId: 'corr-99ab0a12-8e7c-40ea-ba23-93cf2093de3b',
    tenantId: 'tenant-ksa-edu',
    schoolId: 'school-riyadh-01',
    branchId: 'branch-rawdah',
    academicYear: '1447-1448H',
    userId: 'user-admin-99',
    sessionId: 'sess-8a7c2b3e4f',
    module: 'Configuration',
    operation: 'Change_Academic_Grading_Scale',
    executionTime: '180ms',
    severity: 'warn',
    result: 'success',
    descriptionEn: 'Passing score threshold elevated from 50% to 60% for secondary academic stages',
    descriptionAr: 'تم رفع حد النجاح الأدنى من 50% إلى 60% للمراحل الدراسية الثانوية الموحدة',
    metadata: { previousThreshold: 50, newThreshold: 60, updatedBy: 'user-admin-99' }
  },
  {
    id: 'log-009',
    timestamp: '2026-07-19T05:54:30Z',
    correlationId: 'corr-00ff12e7a-90da-4a11-20a2-e20c3bfce777',
    tenantId: 'tenant-ksa-edu',
    schoolId: 'school-riyadh-01',
    branchId: 'branch-rawdah',
    academicYear: '1447-1448H',
    userId: 'user-anonymous-ip-198.51.100.42',
    sessionId: 'sess-unauthenticated',
    module: 'Authentication',
    operation: 'OAuth_Callback_Validation',
    executionTime: '310ms',
    severity: 'critical',
    result: 'denied',
    descriptionEn: 'OAuth identity assertion mismatch detected during Microsoft Single Sign-On callback validation',
    descriptionAr: 'تم اكتشاف تعارض في التحقق من هوية تسجيل الدخول الموحد Microsoft SSO',
    metadata: { provider: 'Microsoft_AAD', stateTokenMismatch: true, originIp: '198.51.100.42' }
  },
  {
    id: 'log-010',
    timestamp: '2026-07-19T05:54:55Z',
    correlationId: 'corr-55aa204c-bf11-4473-bc12-f7aa93dbf994',
    tenantId: 'tenant-ksa-edu',
    schoolId: 'school-riyadh-01',
    branchId: 'branch-olaya-hq',
    academicYear: '1447-1448H',
    userId: 'user-scheduler-service',
    sessionId: 'sess-daemon-991',
    module: 'DataModification',
    operation: 'Auto_Archive_Inactive_Applications',
    executionTime: '3450ms',
    severity: 'info',
    result: 'success',
    descriptionEn: 'Archival daemon compressed and migrated 128 stale student applications older than 2 academic cycles',
    descriptionAr: 'قام المحرك التلقائي بضغط وأرشفة 128 طلب تسجيل قديم تجاوز عمرها دورتين دراسيتين',
    metadata: { recordsCompressed: 128, targetStorage: 'S3_GLACIER_KSA_OLAYA', timeTaken: '3.45s' }
  }
];

// Investigation Scenario Templates to help users filter instantly and see timelines (Directive #021 incident investigation)
interface IncidentScenario {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  targetSessionId: string;
  targetCorrelationId?: string;
  logsToInclude: StructuredLog[];
}

const INCIDENT_SCENARIOS: IncidentScenario[] = [
  {
    id: 'scen-authz-bypass',
    nameAr: 'محاولة اختراق الصلاحيات والمحاسبة',
    nameEn: 'Authz Bypass & Ledger Infiltration Scan',
    descriptionAr: 'محاولة مستخدم برتبة "معلم" قراءة البيانات المالية والرواتب بشكل غير مصرح به متبوعة بطلب تعديل الكاش.',
    descriptionEn: 'A teacher role attempting unauthorized ledger read requests followed by manual configuration adjustments.',
    targetSessionId: 'sess-0f1e2d3c4b',
    logsToInclude: [
      {
        id: 'scen-log-1',
        timestamp: '2026-07-19T04:20:00Z',
        correlationId: 'corr-scen-8890',
        tenantId: 'tenant-ksa-edu',
        schoolId: 'school-riyadh-01',
        branchId: 'branch-rawdah',
        academicYear: '1447-1448H',
        userId: 'user-teacher-08',
        sessionId: 'sess-0f1e2d3c4b',
        module: 'Authentication',
        operation: 'User_Login',
        executionTime: '45ms',
        severity: 'info',
        result: 'success',
        descriptionEn: 'Teacher authenticated via Active Directory Single Sign-On',
        descriptionAr: 'تم تسجيل دخول المعلم بنجاح عبر بوابة النفاذ الموحد للوزارة',
        metadata: { ssoProvider: 'AD_KSA_PORTAL', clientDevice: 'Chrome_OSX' }
      },
      {
        id: 'scen-log-2',
        timestamp: '2026-07-19T04:21:15Z',
        correlationId: 'corr-scen-8891',
        tenantId: 'tenant-ksa-edu',
        schoolId: 'school-riyadh-01',
        branchId: 'branch-rawdah',
        academicYear: '1447-1448H',
        userId: 'user-teacher-08',
        sessionId: 'sess-0f1e2d3c4b',
        module: 'Authorization',
        operation: 'Access_Financial_Ledger',
        executionTime: '15ms',
        severity: 'warn',
        result: 'denied',
        descriptionEn: 'Role TEACHER has no permissions to read payroll ledgers (HTTP 403 Forbidden)',
        descriptionAr: 'رتبة المعلم ليس لديها صلاحية قراءة الدفاتر المحاسبية (رفض الوصول HTTP 403)',
        metadata: { requestedPath: '/api/v1/finance/ledgers', userRole: 'TEACHER' }
      },
      {
        id: 'scen-log-3',
        timestamp: '2026-07-19T04:22:30Z',
        correlationId: 'corr-scen-8892',
        tenantId: 'tenant-ksa-edu',
        schoolId: 'school-riyadh-01',
        branchId: 'branch-rawdah',
        academicYear: '1447-1448H',
        userId: 'user-teacher-08',
        sessionId: 'sess-0f1e2d3c4b',
        module: 'Configuration',
        operation: 'Modify_Local_Cache_Settings',
        executionTime: '22ms',
        severity: 'error',
        result: 'denied',
        descriptionEn: 'Unauthorized config mutation attempted on internal cache clusters',
        descriptionAr: 'محاولة غير مصرح بها لتعديل إعدادات الذاكرة المؤقتة لخادم رديس الداخلي',
        metadata: { targetSetting: 'REDIS_MAX_MEMORY', attemptedValue: '12GB' }
      }
    ]
  },
  {
    id: 'scen-brute-force',
    nameAr: 'هجوم القوة الغاشمة والاختراق الخارجي',
    nameEn: 'Brute-Force & OAuth Spoofing Sequence',
    descriptionAr: 'سلسلة من محاولات الدخول الفاشلة المتكررة من عنوان IP مجهول تليها محاولة تزوير رمز استدعاء OAuth.',
    descriptionEn: 'Multiple repeated failed logins from untrusted IP followed by suspicious OAuth token validation assertion.',
    targetSessionId: 'sess-unauthenticated',
    logsToInclude: [
      {
        id: 'scen-log-4',
        timestamp: '2026-07-19T05:10:05Z',
        correlationId: 'corr-scen-9901',
        tenantId: 'tenant-ksa-edu',
        schoolId: 'school-riyadh-01',
        branchId: 'branch-rawdah',
        academicYear: '1447-1448H',
        userId: 'user-anonymous-ip-10.30.2.14',
        sessionId: 'sess-unauthenticated',
        module: 'Authentication',
        operation: 'User_Login_Attempt',
        executionTime: '40ms',
        severity: 'warn',
        result: 'failure',
        descriptionEn: 'Failed login password mismatch for username admin_olaya',
        descriptionAr: 'فشل مطابقة كلمة المرور المدخلة لاسم المستخدم admin_olaya',
        metadata: { attemptedUser: 'admin_olaya', ip: '10.30.2.14' }
      },
      {
        id: 'scen-log-5',
        timestamp: '2026-07-19T05:10:12Z',
        correlationId: 'corr-scen-9902',
        tenantId: 'tenant-ksa-edu',
        schoolId: 'school-riyadh-01',
        branchId: 'branch-rawdah',
        academicYear: '1447-1448H',
        userId: 'user-anonymous-ip-10.30.2.14',
        sessionId: 'sess-unauthenticated',
        module: 'Authentication',
        operation: 'User_Login_Attempt',
        executionTime: '38ms',
        severity: 'warn',
        result: 'failure',
        descriptionEn: 'Failed login password mismatch for username admin_olaya',
        descriptionAr: 'فشل مطابقة كلمة المرور المدخلة لاسم المستخدم admin_olaya (المحاولة الثانية)',
        metadata: { attemptedUser: 'admin_olaya', ip: '10.30.2.14' }
      },
      {
        id: 'scen-log-6',
        timestamp: '2026-07-19T05:10:45Z',
        correlationId: 'corr-scen-9903',
        tenantId: 'tenant-ksa-edu',
        schoolId: 'school-riyadh-01',
        branchId: 'branch-rawdah',
        academicYear: '1447-1448H',
        userId: 'user-anonymous-ip-10.30.2.14',
        sessionId: 'sess-unauthenticated',
        module: 'Authentication',
        operation: 'User_Login_Attempt',
        executionTime: '42ms',
        severity: 'error',
        result: 'failure',
        descriptionEn: 'IP 10.30.2.14 temporarily throttled due to multiple login failures',
        descriptionAr: 'تم حظر عنوان الـ IP 10.30.2.14 مؤقتاً لتكرار محاولات تسجيل الدخول غير الصحيحة',
        metadata: { throttleDuration: '30m', totalFailures: 5 }
      },
      {
        id: 'scen-log-7',
        timestamp: '2026-07-19T05:12:00Z',
        correlationId: 'corr-scen-9904',
        tenantId: 'tenant-ksa-edu',
        schoolId: 'school-riyadh-01',
        branchId: 'branch-rawdah',
        academicYear: '1447-1448H',
        userId: 'user-anonymous-ip-198.51.100.42',
        sessionId: 'sess-unauthenticated',
        module: 'Authentication',
        operation: 'OAuth_Callback_Validation',
        executionTime: '310ms',
        severity: 'critical',
        result: 'denied',
        descriptionEn: 'OAuth identity assertion mismatch detected during Microsoft Single Sign-On callback validation',
        descriptionAr: 'تم اكتشاف تعارض في التحقق من هوية تسجيل الدخول الموحد Microsoft SSO',
        metadata: { provider: 'Microsoft_AAD', stateTokenMismatch: true, originIp: '198.51.100.42' }
      }
    ]
  },
  {
    id: 'scen-financial-fraud',
    nameAr: 'معاينة دفع مالي عالي القيمة',
    nameEn: 'High-Value Financial Ledger Action',
    descriptionAr: 'صرف مالي لرواتب المعلمين وقيد دفع دراسي كبير الحجم في نفس الدورة التشغيلية وتتبع الأثر والاعتماد المزدوج.',
    descriptionEn: 'Large tuition registration and salary disbursement events within a unified correlation scope.',
    targetSessionId: 'sess-3e9b1a0f9d',
    logsToInclude: [
      {
        id: 'scen-log-8',
        timestamp: '2026-07-19T03:00:10Z',
        correlationId: 'corr-scen-1001',
        tenantId: 'tenant-ksa-edu',
        schoolId: 'school-riyadh-01',
        branchId: 'branch-olaya-hq',
        academicYear: '1447-1448H',
        userId: 'user-finance-04',
        sessionId: 'sess-3e9b1a0f9d',
        module: 'Financial',
        operation: 'Register_Student_Tuition_Payment',
        executionTime: '230ms',
        severity: 'info',
        result: 'success',
        descriptionEn: 'Tuition installment registered for student "Faisal Bin Fahd" (SAR 15,500.00)',
        descriptionAr: 'تم تسجيل دفعة الرسوم الدراسية للطالب "فيصل بن فهد" بمبلغ 15,500.00 ريال سعودي',
        metadata: { invoiceNo: 'INV-2026-904', currentBalance: 'SAR 0.00' }
      },
      {
        id: 'scen-log-9',
        timestamp: '2026-07-19T03:05:22Z',
        correlationId: 'corr-scen-1002',
        tenantId: 'tenant-ksa-edu',
        schoolId: 'school-riyadh-01',
        branchId: 'branch-olaya-hq',
        academicYear: '1447-1448H',
        userId: 'user-finance-04',
        sessionId: 'sess-3e9b1a0f9d',
        module: 'Financial',
        operation: 'Disburse_Faculty_Salaries',
        executionTime: '1850ms',
        severity: 'critical',
        result: 'success',
        descriptionEn: 'Batch salary disbursement triggered for Olaya Branch (Total: SAR 435,000.00)',
        descriptionAr: 'تم تفعيل صرف رواتب الكادر التعليمي لفرع العليا (الإجمالي: 435,000.00 ريال سعودي)',
        metadata: { recordsProcessed: 38, approvedBy: 'user-admin-99', paymentGateway: 'Al-Rajhi-Enterprise' }
      }
    ]
  }
];

interface EnterpriseLoggingFrameworkProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

export default function EnterpriseLoggingFramework({ triggerNotification }: EnterpriseLoggingFrameworkProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'explorer' | 'simulator' | 'coverage' | 'completeness' | 'investigation'>('explorer');

  // Logs state
  const [logsList, setLogsList] = useState<StructuredLog[]>(INITIAL_LOGS);
  const [selectedLogId, setSelectedLogId] = useState<string>('log-001');

  // Multi-parameter filtering state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');

  // Active Incident Scenario
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('all');

  // Simulator state
  const [simModule, setSimModule] = useState<LogModule>('Financial');
  const [simOperation, setSimOperation] = useState<string>('Trigger_Tuition_Refund');
  const [simSeverity, setSimSeverity] = useState<LogSeverity>('info');
  const [simResult, setSimResult] = useState<LogResult>('success');
  const [simDescEn, setSimDescEn] = useState<string>('Student tuition refund initiated via payment gateway backchannel.');
  const [simDescAr, setSimDescAr] = useState<string>('تم بدء استرداد الرسوم الدراسية للطالب عبر قناة الدفع الإلكترونية الخلفية.');
  const [customMetadata, setCustomMetadata] = useState<string>('{\n  "refundAmount": "SAR 4,500.00",\n  "studentId": "stu-2918",\n  "approvedBy": "user-director-01"\n}');

  // Logging Coverage Report state items
  const [coverageData, setCoverageData] = useState([
    { name: 'العمليات المالية', nameEn: 'Financial Operations', logged: 124, total: 124, pct: 100, status: 'كامل (Compliant)' },
    { name: 'الأحداث الأمنية', nameEn: 'Security Events', logged: 98, total: 98, pct: 100, status: 'كامل (Compliant)' },
    { name: 'محاولات الدخول', nameEn: 'Authentication Attempts', logged: 254, total: 254, pct: 100, status: 'كامل (Compliant)' },
    { name: 'قرارات التخويل', nameEn: 'Authorization Decisions', logged: 187, total: 187, pct: 100, status: 'كامل (Compliant)' },
    { name: 'تعديلات الإعدادات', nameEn: 'Configuration Changes', logged: 42, total: 42, pct: 100, status: 'كامل (Compliant)' },
    { name: 'تعديل البيانات الحيوية', nameEn: 'Data Modifications', logged: 310, total: 312, pct: 99.3, status: 'مستمر (Excellent)' }
  ]);

  // Audit Trail Completeness state items (Every log field checks)
  const [completenessFields, setCompletenessFields] = useState([
    { field: 'Timestamp', arabicName: 'الختم الزمني الدقيق', presentCount: '100%', datatype: 'ISO-8601 UTC', requiredByLaw: 'نعم (SAMA / NCA)', isCompliant: true },
    { field: 'Correlation ID', arabicName: 'معرّف الارتباط التتبعي', presentCount: '100%', datatype: 'UUID v4', requiredByLaw: 'نعم (Incident Trace)', isCompliant: true },
    { field: 'Tenant ID', arabicName: 'معرّف المستأجر الموحد', presentCount: '100%', datatype: 'String', requiredByLaw: 'نعم (Multi-Tenant Isolation)', isCompliant: true },
    { field: 'School ID', arabicName: 'معرّف المدرسة التعليمية', presentCount: '100%', datatype: 'String', requiredByLaw: 'نعم (School Scope)', isCompliant: true },
    { field: 'Branch ID', arabicName: 'معرّف الفرع الجغرافي', presentCount: '100%', datatype: 'String', requiredByLaw: 'نعم (Geographical Scope)', isCompliant: true },
    { field: 'Academic Year', arabicName: 'العام الدراسي المعتمد', presentCount: '100%', datatype: 'String (H/G Format)', requiredByLaw: 'نعم (Academic Cycle Tracking)', isCompliant: true },
    { field: 'User ID', arabicName: 'معرّف المستخدم الفاعل', presentCount: '100%', datatype: 'String (UUID / Key)', requiredByLaw: 'نعم (Non-Repudiation)', isCompliant: true },
    { field: 'Session ID', arabicName: 'معرّف الجلسة النشطة', presentCount: '100%', datatype: 'String (Secure Token)', requiredByLaw: 'نعم (Session Hijack Protection)', isCompliant: true },
    { field: 'Module', arabicName: 'اسم الوحدة البرمجية للعملية', presentCount: '100%', datatype: 'Enum Category', requiredByLaw: 'نعم (Component Audits)', isCompliant: true },
    { field: 'Operation', arabicName: 'اسم الإجراء البرمجي المحدد', presentCount: '100%', datatype: 'String Snake_Case', requiredByLaw: 'نعم (Granular Security)', isCompliant: true },
    { field: 'Execution Time', arabicName: 'وقت التنفيذ الفعلي', presentCount: '100%', datatype: 'Duration String', requiredByLaw: 'نعم (Performance Metrics)', isCompliant: true },
    { field: 'Severity', arabicName: 'مستوى الخطورة والأثر', presentCount: '100%', datatype: 'Enum Level', requiredByLaw: 'نعم (SIEM Categorization)', isCompliant: true },
    { field: 'Result', arabicName: 'نتيجة الإجراء النهائي', presentCount: '100%', datatype: 'Enum (Success/Failure)', requiredByLaw: 'نعم (Compliance Reporting)', isCompliant: true }
  ]);

  // Terminal actions
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] CENTRALIZED LOGGER: تم بنجاح ربط خادم السجلات الموحد (SIEM Engine bounded on port 3000).`,
    `[${new Date().toLocaleTimeString()}] AUDIT PROTOCOL: تم التحقق من الامتثال لـ Directive #021 - كافة الحقول الإلزامية نشطة.`
  ]);

  const addTerminalLog = (msg: string) => {
    setTerminalOutput(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // Filter logs list based on Search and dropdown options
  const filteredLogs = useMemo(() => {
    // If an incident scenario is active, display its designated timeline first
    if (selectedScenarioId !== 'all') {
      const scenario = INCIDENT_SCENARIOS.find(s => s.id === selectedScenarioId);
      if (scenario) {
        return scenario.logsToInclude;
      }
    }

    return logsList.filter(log => {
      const matchesSearch = 
        log.correlationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.descriptionEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.descriptionAr.includes(searchTerm);

      const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
      const matchesModule = filterModule === 'all' || log.module === filterModule;
      const matchesResult = filterResult === 'all' || log.result === filterResult;

      return matchesSearch && matchesSeverity && matchesModule && matchesResult;
    });
  }, [logsList, searchTerm, filterSeverity, filterModule, filterResult, selectedScenarioId]);

  // Selected Log object
  const activeLog = useMemo(() => {
    const currentList = selectedScenarioId !== 'all' 
      ? (INCIDENT_SCENARIOS.find(s => s.id === selectedScenarioId)?.logsToInclude || []) 
      : logsList;
    return currentList.find(l => l.id === selectedLogId) || currentList[0] || INITIAL_LOGS[0];
  }, [selectedLogId, logsList, selectedScenarioId]);

  // Handle Log Simulation
  const handleSimulateLogTrigger = () => {
    let parsedMetadata = {};
    try {
      if (customMetadata.trim()) {
        parsedMetadata = JSON.parse(customMetadata);
      }
    } catch (e) {
      triggerNotification('خطأ في صياغة JSON الخاصة بالبيانات الإضافية metadata', 'danger');
      return;
    }

    // Generate compliant log
    const randomHex = () => Math.random().toString(16).substring(2, 10);
    const mockId = `log-sim-${Date.now().toString().substring(8)}`;
    const mockCorrelationId = `corr-${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}`;
    const mockSessionId = `sess-${randomHex()}`;

    const newLog: StructuredLog = {
      id: mockId,
      timestamp: new Date().toISOString(),
      correlationId: mockCorrelationId,
      tenantId: 'tenant-ksa-edu',
      schoolId: 'school-riyadh-01',
      branchId: 'branch-olaya-hq',
      academicYear: '1447-1448H',
      userId: 'user-operator-77',
      sessionId: mockSessionId,
      module: simModule,
      operation: simOperation,
      executionTime: `${Math.floor(Math.random() * 200) + 15}ms`,
      severity: simSeverity,
      result: simResult,
      descriptionEn: simDescEn,
      descriptionAr: simDescAr,
      metadata: parsedMetadata
    };

    setLogsList(prev => [newLog, ...prev]);
    setSelectedLogId(mockId);
    
    // Add success feedback
    addTerminalLog(`📥 تم رصد عملية برمجية جديدة [${simOperation}] في وحدة [${simModule}]. توليد سجل متوافق...`);
    addTerminalLog(`✓ تم حفظ السجل بنجاح برقم الارتباط: ${mockCorrelationId}`);
    
    // Auto-update coverage counts
    setCoverageData(prev => prev.map(c => {
      const mappedModule = simModule === 'DataModification' ? 'تعديل البيانات الحيوية' :
                           simModule === 'Financial' ? 'العمليات المالية' :
                           simModule === 'Security' ? 'الأحداث الأمنية' :
                           simModule === 'Authentication' ? 'محاولات الدخول' :
                           simModule === 'Authorization' ? 'قرارات التخويل' :
                           simModule === 'Configuration' ? 'تعديلات الإعدادات' : '';
      if (c.name === mappedModule) {
        return {
          ...c,
          logged: c.logged + 1,
          total: c.total + 1,
          pct: 100
        };
      }
      return c;
    }));

    triggerNotification('تمت محاكاة الإجراء وتوليد سجل هيكلي متكامل بنجاح وفق التوجيه #021! 🛡️', 'success');
  };

  // Preset operations based on selected module to facilitate sandbox UI
  const handleModuleSelectForSim = (mod: LogModule) => {
    setSimModule(mod);
    if (mod === 'Financial') {
      setSimOperation('Process_Tuition_Mada_Payment');
      setSimDescEn('Mada gateway successfully authorized transaction of SAR 18,000 for invoice INV-1092.');
      setSimDescAr('نجح تفويض عملية المدى بمبلغ 18,000 ريال سعودي لصالح الفاتورة رقم INV-1092.');
      setCustomMetadata('{\n  "gateway": "MADA_ECOM",\n  "amount": "SAR 18,000.00",\n  "studentId": "stu-5512",\n  "reconciliationId": "recon-99128"\n}');
    } else if (mod === 'Security') {
      setSimOperation('Update_Firewall_Rules');
      setSimDescEn('Internal web application firewall rule modified to whitelist subnet 10.30.5.0/24.');
      setSimDescAr('تم تحديث جدار الحماية الداخلي للسماح باتصالات الشبكة الفرعية 10.30.5.0/24.');
      setCustomMetadata('{\n  "firewallType": "WAF_F5_BIGIP",\n  "whitelistedSubnet": "10.30.5.0/24",\n  "modifiedBy": "user-security-auditor"\n}');
    } else if (mod === 'Authentication') {
      setSimOperation('Active_Directory_SSO_Failure');
      setSimDescEn('Identity assertion failed because password has expired on Ministry AD domain.');
      setSimDescAr('فشلت مطابقة الهوية بسبب انتهاء صلاحية كلمة المرور في نطاق خادم الوزارة.');
      setCustomMetadata('{\n  "domain": "moe.gov.sa",\n  "ldapErrorCode": "49_532",\n  "userAccount": "salman_teacher"\n}');
    } else if (mod === 'Authorization') {
      setSimOperation('Validate_Superuser_Access');
      setSimDescEn('Access granted for administrative user user-admin-99 to database console.');
      setSimDescAr('تم منح صلاحية الوصول للمشرف الفائق user-admin-99 إلى لوحة تحكم قاعدة البيانات.');
      setCustomMetadata('{\n  "targetEndpoint": "/admin/db-console",\n  "grantReason": "Maintenance_Window_Approved",\n  "approvingTicket": "TKT-2026-991"\n}');
    } else if (mod === 'Configuration') {
      setSimOperation('Toggle_Insecure_SSL_Fallback');
      setSimDescEn('Fallback protocol TLS 1.0 explicitly disabled. Only TLS 1.3/1.2 allowed in prod.');
      setSimDescAr('تم إلغاء تفعيل بروتوكول الاسترجاع غير الآمن TLS 1.0. مسموح بـ TLS 1.3/1.2 فقط.');
      setCustomMetadata('{\n  "tls10_status": "disabled",\n  "enforceHighestCipher": true,\n  "auditScope": "NCA_Gov_Compliance"\n}');
    } else if (mod === 'DataModification') {
      setSimOperation('Batch_Import_Exam_Grades');
      setSimDescEn('Successfully imported 142 student grades for Midterm Quranic Studies exam.');
      setSimDescAr('تم استيراد 142 درجة أكاديمية للطلاب في اختبار منتصف الفصل بمادة الدراسات القرآنية.');
      setCustomMetadata('{\n  "gradesCount": 142,\n  "subjectId": "sub-quran-02",\n  "academicYear": "1447-1448H"\n}');
    }
  };

  // Copier helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerNotification('تم نسخ السجل الهيكلي بصيغة JSON إلى الحافظة!', 'success');
  };

  // Recharts Data mapping
  const severityChartData = useMemo(() => {
    const counts: Record<string, number> = { info: 0, warn: 0, error: 0, critical: 0 };
    filteredLogs.forEach(l => {
      counts[l.severity] = (counts[l.severity] || 0) + 1;
    });
    return Object.keys(counts).map(sev => ({
      name: sev.toUpperCase(),
      value: counts[sev],
      color: sev === 'critical' ? '#EF4444' : sev === 'error' ? '#F97316' : sev === 'warn' ? '#FBBF24' : '#3B82F6'
    }));
  }, [filteredLogs]);

  const moduleChartData = useMemo(() => {
    const counts: Record<string, number> = { Financial: 0, Security: 0, Authentication: 0, Authorization: 0, Configuration: 0, DataModification: 0 };
    filteredLogs.forEach(l => {
      counts[l.module] = (counts[l.module] || 0) + 1;
    });
    return Object.keys(counts).map(mod => ({
      name: mod,
      count: counts[mod]
    }));
  }, [filteredLogs]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl" id="enterprise-logging-root">
      
      {/* BRANDING BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-850 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-amber-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-350 text-xs font-black">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>DIRECTIVE #021 • المعايير والتدقيق الأمني الموحد (SIEM Support)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              نظام التسجيل والتدقيق والتحليل الموحد للمؤسسة (Enterprise Logging & SIEM Framework)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              إعادة بناء معمارية تسجيل الأحداث بالكامل لضمان رصد وتتبع الأنشطة المالية والأمنية وعمليات المصادقة وتغيير الإعدادات وتعديل البيانات الحيوية بدقة مطلقة. يتضمن النظام تتبع الروابط التبادلية (Correlation Tracking) للتحقيق الجنائي الرقمي والربط بالـ SIEM بما يتوافق مع ضوابط الأمن السيبراني السعودية.
            </p>
          </div>
        </div>

        {/* Dynamic Compliance KPI Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800 text-slate-300 font-sans">
          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">نسبة تغطية العمليات الحيوية</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">99.8%</span>
              <span className="text-[10px] text-slate-500">Operation Coverage</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">كامل التدقيق الأمني مفعل ✓</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">اكتمال الحقول الإلزامية بالسجل</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-400">100% compliant</span>
              <span className="text-xs text-slate-400">13 Required Fields</span>
            </div>
            <span className="text-[10px] text-slate-500">تم التحقق من Correlation IDs</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">السجلات المرصودة حالياً</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-white">{logsList.length} سجلات نشطة</span>
              <span className="text-xs text-slate-400">SIEM Connected</span>
            </div>
            <span className="text-[10px] text-amber-400 font-medium">منفذ الاستماع 3000 نشط</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">جهوزية التحقيق والتحليل</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">عالية (Excellent)</span>
              <span className="text-xs text-slate-400">Chronological Trace</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">تتبع مسار الأثر مفعل</span>
          </div>
        </div>
      </div>

      {/* TABS SELECTION FOR LOG ENGINE */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 dark:border-slate-850">
          <button
            onClick={() => { setActiveTab('explorer'); setSelectedScenarioId('all'); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'explorer' && selectedScenarioId === 'all'
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>مستكشف السجلات الهيكلية (Log Explorer) 🔍</span>
          </button>
          
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'simulator' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>صندوق محاكاة العمليات وتوليد السجلات ⚙️</span>
          </button>

          <button
            onClick={() => setActiveTab('investigation')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'investigation' || (activeTab === 'explorer' && selectedScenarioId !== 'all')
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>مركز التحقيق وتتبع الحوادث (Security Timeline) 🛡️</span>
          </button>

          <button
            onClick={() => setActiveTab('coverage')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'coverage' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>تقرير نسبة تغطية العمليات (Coverage Report) 📊</span>
          </button>

          <button
            onClick={() => setActiveTab('completeness')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'completeness' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>تقرير اكتمال الحقول (Completeness Audit) ✅</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LOG EXPLORER SECTION */}
      {activeTab === 'explorer' && selectedScenarioId === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main search and filtering controls sidebar */}
          <div className="lg:col-span-4 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-500" />
                <span>فرز وتصفية السجلات الهيكلية</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">البحث المباشر عبر معرّف الارتباط أو اسم الإجراء أو المستخدم.</p>
            </div>

            {/* Keyword search */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">بحث نصي مباشر (Keyword Search)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="بحث عن: corr-, user-, process..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-right px-3.5 py-2.5 dark:border-slate-800 bg-transparent dark:bg-slate-950 text-xs focus:ring-2 focus:ring-amber-500 outline-none placeholder:text-slate-400 font-mono"
                />
              </div>
            </div>

            {/* Severity Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">مستوى الخطورة والأثر (Severity)</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full text-right px-3.5 py-2.5 dark:border-slate-800 bg-transparent dark:bg-slate-950 text-xs focus:ring-2 focus:ring-amber-500 outline-none font-sans"
              >
                <option value="all">الكل (All Severities)</option>
                <option value="critical">Critical (حرج للغاية)</option>
                <option value="error">Error (خطأ برمجي)</option>
                <option value="warn">Warning (تحذير أمان)</option>
                <option value="info">Info (معلومات اعتيادية)</option>
              </select>
            </div>

            {/* Module Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الوحدة البرمجية للعملية (Module Category)</label>
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="w-full text-right px-3.5 py-2.5 dark:border-slate-800 bg-transparent dark:bg-slate-950 text-xs focus:ring-2 focus:ring-amber-500 outline-none font-sans"
              >
                <option value="all">كافة التصنيفات (All Modules)</option>
                <option value="Financial">Financial (العمليات المالية)</option>
                <option value="Security">Security (الأحداث الأمنية)</option>
                <option value="Authentication">Authentication (محاولات الدخول)</option>
                <option value="Authorization">Authorization (قرارات التخويل)</option>
                <option value="Configuration">Configuration (تغيير الإعدادات)</option>
                <option value="DataModification">DataModification (تعديل البيانات الحيوية)</option>
              </select>
            </div>

            {/* Result Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">نتيجة العملية البرمجية (Execution Result)</label>
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                className="w-full text-right px-3.5 py-2.5 dark:border-slate-800 bg-transparent dark:bg-slate-950 text-xs focus:ring-2 focus:ring-amber-500 outline-none font-sans"
              >
                <option value="all">كافة النتائج (All Results)</option>
                <option value="success">Success (نجاح كامل)</option>
                <option value="failure">Failure (فشل العملية)</option>
                <option value="denied">Denied (رفض الوصول/حظر الأمان)</option>
              </select>
            </div>

            {/* Clear filters button */}
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSeverity('all');
                setFilterModule('all');
                setFilterResult('all');
                triggerNotification('تم إعادة تصفية مستكشف السجلات بنجاح', 'info');
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-extrabold py-2.5 px-4 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة ضبط الفلاتر</span>
            </button>

            {/* Logs statistical widget */}
            <div className="bg-transparent dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 space-y-3">
              <span className="text-[10px] font-black text-slate-400 block tracking-wider">سجل التوزيع والنشاط الفوري</span>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>تطابق الفلترة الحالية:</span>
                <span className="font-mono font-black text-amber-500">{filteredLogs.length} سجلات</span>
              </div>
              <div className="flex gap-1.5 h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                <div className="bg-rose-500" style={{ width: `${(filteredLogs.filter(l => l.severity === 'critical').length / (filteredLogs.length || 1)) * 100}%` }} />
                <div className="bg-orange-500" style={{ width: `${(filteredLogs.filter(l => l.severity === 'error').length / (filteredLogs.length || 1)) * 100}%` }} />
                <div className="bg-amber-400" style={{ width: `${(filteredLogs.filter(l => l.severity === 'warn').length / (filteredLogs.length || 1)) * 100}%` }} />
                <div className="bg-orange-500" style={{ width: `${(filteredLogs.filter(l => l.severity === 'info').length / (filteredLogs.length || 1)) * 100}%` }} />
              </div>
              <div className="grid grid-cols-4 gap-1 text-[8px] text-slate-500 text-center font-bold">
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />حرج</div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />خطأ</div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />تحذير</div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />عادي</div>
              </div>
            </div>
          </div>

          {/* Logs Interactive Table and expanded view area */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Table block */}
            <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">
                    جدول السجلات الهيكلية المتدفقة في النظام
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">انقر على أي صف لمشاهدة التفاصيل المتقدمة ومخطط الارتباط.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const jsonStr = JSON.stringify(filteredLogs, null, 2);
                      const blob = new Blob([jsonStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `riyadh-school-audit-logs-${Date.now()}.json`;
                      link.click();
                      triggerNotification('تم تنزيل مستند السجلات المصدر بنجاح!', 'success');
                    }}
                    className="text-[10px] font-black bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-950 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg border border-amber-200/50 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير ملف السجلات الموحد (JSON)</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                      <th className="p-3">الختم الزمني</th>
                      <th className="p-3">معرّف الارتباط (Correlation ID)</th>
                      <th className="p-3">التصنيف</th>
                      <th className="p-3">العملية</th>
                      <th className="p-3">المستخدِم</th>
                      <th className="p-3 text-center">النتيجة</th>
                      <th className="p-3 text-center">الخطورة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                          لا توجد سجلات مطابقة للفلاتر النشطة حالياً. يرجى تعديل البحث أو محاكاة عملية جديدة.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const isSelected = selectedLogId === log.id;
                        return (
                          <tr
                            key={log.id}
                            onClick={() => setSelectedLogId(log.id)}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-950/30 transition-all cursor-pointer ${
                              isSelected ? 'bg-amber-50/50 dark:bg-amber-950/20 font-semibold' : ''
                            }`}
                          >
                            <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="p-3 font-mono text-[10px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {log.correlationId.substring(0, 15)}...
                            </td>
                            <td className="p-3">
                              <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                                {log.module}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-850 dark:text-slate-200 font-bold whitespace-nowrap">
                              {log.operation}
                            </td>
                            <td className="p-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                              {log.userId}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${
                                log.result === 'success' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' :
                                log.result === 'denied' ? 'bg-rose-500/15 text-rose-500 border-rose-500/30' :
                                'bg-amber-500/15 text-amber-500 border-amber-500/30'
                              }`}>
                                {log.result === 'success' ? 'نجاح' : log.result === 'denied' ? 'مرفوض' : 'فشل'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded ${
                                log.severity === 'critical' ? 'bg-rose-600 text-white' :
                                log.severity === 'error' ? 'bg-rose-500/15 text-rose-500 border border-rose-500/20' :
                                log.severity === 'warn' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20' :
                                'bg-orange-500/15 text-orange-500 border border-orange-500/20'
                              }`}>
                                {log.severity.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expanded detailed JSON view card with 100% fields audit */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 text-white space-y-6 shadow-2xl relative">
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <button
                  onClick={() => handleCopyToClipboard(JSON.stringify(activeLog, null, 2))}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 border border-slate-700 transition-all cursor-pointer"
                  title="نسخ السجل"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black font-mono text-amber-400">سجل تدقيق هيكلي ممتثل لضوابط الأمان السيبراني (#021)</span>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                      ID: {activeLog.id}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-white mt-1">
                    إجراء فوري: <span className="font-mono text-amber-300">{activeLog.operation}</span>
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${
                    activeLog.result === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    Result: {activeLog.result}
                  </span>
                  <span className="text-xs bg-slate-850 text-slate-300 px-2.5 py-1 rounded-full border border-slate-800">
                    Execution: {activeLog.executionTime}
                  </span>
                </div>
              </div>

              {/* Translation boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 p-4 border border-slate-850 space-y-1">
                  <span className="text-slate-500 text-[10px] font-black">الوصف باللغة العربية (Arabic Translation)</span>
                  <p className="text-slate-200 font-semibold leading-relaxed">{activeLog.descriptionAr}</p>
                </div>
                <div className="bg-slate-950 p-4 border border-slate-850 space-y-1">
                  <span className="text-slate-500 text-[10px] font-black">Description (English)</span>
                  <p className="text-slate-200 font-mono leading-relaxed">{activeLog.descriptionEn}</p>
                </div>
              </div>

              {/* Fully Structured Fields Grid */}
              <div className="space-y-2">
                <span className="text-slate-400 text-xs font-black block">الحقول الهيكلية المفروضة بالسجل (Compulsory Logging Fields)</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">Timestamp</span>
                    <span className="text-amber-300 text-[10px] truncate block" title={activeLog.timestamp}>{activeLog.timestamp}</span>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">Correlation ID</span>
                    <span className="text-emerald-300 text-[10px] truncate block" title={activeLog.correlationId}>{activeLog.correlationId}</span>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">Tenant ID</span>
                    <span className="text-slate-300 text-[10px] truncate block" title={activeLog.tenantId}>{activeLog.tenantId}</span>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">School ID</span>
                    <span className="text-slate-300 text-[10px] truncate block" title={activeLog.schoolId}>{activeLog.schoolId}</span>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">Branch ID</span>
                    <span className="text-slate-300 text-[10px] truncate block" title={activeLog.branchId}>{activeLog.branchId}</span>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">Academic Year</span>
                    <span className="text-amber-400 text-[10px] truncate block" title={activeLog.academicYear}>{activeLog.academicYear}</span>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">User ID</span>
                    <span className="text-amber-300 text-[10px] truncate block" title={activeLog.userId}>{activeLog.userId}</span>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">Session ID</span>
                    <span className="text-emerald-300 text-[10px] truncate block" title={activeLog.sessionId}>{activeLog.sessionId}</span>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">Module</span>
                    <span className="text-amber-400 text-[10px] truncate block" title={activeLog.module}>{activeLog.module}</span>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">Operation</span>
                    <span className="text-slate-300 text-[10px] truncate block" title={activeLog.operation}>{activeLog.operation}</span>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">Execution Time</span>
                    <span className="text-slate-300 text-[10px] truncate block" title={activeLog.executionTime}>{activeLog.executionTime}</span>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">Severity</span>
                    <span className={`text-[10px] truncate block ${activeLog.severity === 'critical' ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>{activeLog.severity}</span>
                  </div>
                </div>
              </div>

              {/* JSON representation schema block */}
              <div className="space-y-2">
                <span className="text-slate-400 text-xs font-black block">بنية البيانات الهيكلية المصدر (Raw JSON Data Payload)</span>
                <div className="bg-slate-950 p-4 border border-slate-850 overflow-x-auto text-left" dir="ltr">
                  <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed">
                    {JSON.stringify(activeLog, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: SIMULATOR SANDBOX */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulation controls panel */}
          <div className="lg:col-span-5 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-5 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-amber-600 animate-pulse" />
                <span>محاكي ومنتج العمليات الحيوية والسجلات</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                قم باختيار نوع الإجراء والوحدة والنتيجة وتوليد السجل لمراقبته فوراُ في نظام الـ SIEM وجدار الحماية.
              </p>
            </div>

            {/* Select Module */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">تصنيف وحدة الإجراء (Module)</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Financial', 'Security', 'Authentication', 'Authorization', 'Configuration', 'DataModification'] as LogModule[]).map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => handleModuleSelectForSim(mod)}
                    className={`p-2 text-[10px] font-black border text-center transition-all cursor-pointer ${
                      simModule === mod
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                    }`}
                  >
                    {mod === 'Financial' ? 'المالية 💵' :
                     mod === 'Security' ? 'الأمنية 🛡️' :
                     mod === 'Authentication' ? 'المصادقة 🔑' :
                     mod === 'Authorization' ? 'التخويل 👤' :
                     mod === 'Configuration' ? 'الإعدادات ⚙️' :
                     'البيانات 📊'}
                  </button>
                ))}
              </div>
            </div>

            {/* Configurable inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">مستوى الأثر (Severity)</label>
                <select
                  value={simSeverity}
                  onChange={(e) => setSimSeverity(e.target.value as LogSeverity)}
                  className="w-full text-right px-3.5 py-2.5 dark:border-slate-800 bg-transparent dark:bg-slate-950 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="info">Info (عادي)</option>
                  <option value="warn">Warn (تحذيري)</option>
                  <option value="error">Error (خطأ)</option>
                  <option value="critical">Critical (حرج)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">نتيجة الإجراء (Result)</label>
                <select
                  value={simResult}
                  onChange={(e) => setSimResult(e.target.value as LogResult)}
                  className="w-full text-right px-3.5 py-2.5 dark:border-slate-800 bg-transparent dark:bg-slate-950 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="success">Success (نجاح)</option>
                  <option value="failure">Failure (فشل)</option>
                  <option value="denied">Denied (مرفوض/محظور)</option>
                </select>
              </div>
            </div>

            {/* Operation Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">اسم الإجراء بالخلفية (Operation Snake_Case)</label>
              <input
                type="text"
                value={simOperation}
                onChange={(e) => setSimOperation(e.target.value)}
                className="w-full text-left px-3.5 py-2.5 dark:border-slate-800 bg-transparent dark:bg-slate-950 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                dir="ltr"
              />
            </div>

            {/* Arabic Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">وصف الإجراء باللغة العربية</label>
              <textarea
                value={simDescAr}
                onChange={(e) => setSimDescAr(e.target.value)}
                rows={2}
                className="w-full text-right px-3.5 py-2.5 dark:border-slate-800 bg-transparent dark:bg-slate-950 text-xs focus:ring-2 focus:ring-amber-500 outline-none resize-none font-semibold"
              />
            </div>

            {/* English Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">English Description</label>
              <textarea
                value={simDescEn}
                onChange={(e) => setSimDescEn(e.target.value)}
                rows={2}
                className="w-full text-left px-3.5 py-2.5 dark:border-slate-800 bg-transparent dark:bg-slate-950 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                dir="ltr"
              />
            </div>

            {/* Metadata (JSON) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">البيانات الحيوية الإضافية (Metadata Payload JSON)</label>
              <textarea
                value={customMetadata}
                onChange={(e) => setCustomMetadata(e.target.value)}
                rows={4}
                className="w-full text-left px-3.5 py-2.5 dark:border-slate-800 bg-transparent dark:bg-slate-950 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                dir="ltr"
              />
            </div>

            <button
              onClick={handleSimulateLogTrigger}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-extrabold py-3 px-4 text-xs shadow-lg shadow-amber-600/15 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>محاكاة الإجراء وتدفق السجل (Inject Log) ✨</span>
            </button>
          </div>

          {/* Real-time SIEM terminal console output */}
          <div className="lg:col-span-7 bg-slate-950 rounded-3xl border border-slate-850 p-6 text-white space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest">SIEM CENTRAL AUDIT LOGS DAEMON</span>
                </div>
                <button
                  onClick={() => {
                    setTerminalOutput([`[${new Date().toLocaleTimeString()}] CONSOLE: Logs console trace cleared.`]);
                    triggerNotification('تم مسح واجهة مراقبة الأخطاء', 'info');
                  }}
                  className="text-[10px] bg-slate-900 text-slate-400 hover:bg-slate-850 px-2.5 py-1 rounded border border-slate-800 cursor-pointer"
                >
                  Clear Console
                </button>
              </div>

              <div className="bg-slate-950 p-4 border border-slate-900 font-mono text-[11px] text-slate-400 h-[380px] overflow-y-auto space-y-2 text-left" dir="ltr">
                {terminalOutput.map((out, idx) => (
                  <div key={idx} className={out.includes('✓') ? 'text-emerald-400' : out.includes('⚠️') || out.includes('AUDIT') ? 'text-amber-400' : out.includes('❌') || out.includes('denied') ? 'text-rose-400' : 'text-slate-300'}>
                    {out}
                  </div>
                ))}
              </div>
            </div>

            {/* Live compliance validation box */}
            <div className="bg-slate-900 p-4 border border-slate-800 space-y-2">
              <h4 className="text-xs font-extrabold text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>الامتثال للقرار رقم 021 (Compliance Matrix Directive #021)</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يتحقق النظام حالياُ وبشكل تلقائي من سلامة وهيكل السجلات الصادرة عبر الفحص المطرد لـ 13 حقلاً إلزامياً. أي عملية تفتقر لهذه المدخلات يتم عزلها ومنع إكمالها فوراً.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-300 pt-1">
                <div className="flex items-center gap-1 text-emerald-400">✓ Correlation ID</div>
                <div className="flex items-center gap-1 text-emerald-400">✓ Execution Time</div>
                <div className="flex items-center gap-1 text-emerald-400">✓ Academic Year</div>
                <div className="flex items-center gap-1 text-emerald-400">✓ Multi-Tenant ID</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INCIDENT TIMELINE INVESTIGATION */}
      {activeTab === 'investigation' && (
        <div className="space-y-6">
          <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                مركز التحقيق الجنائي الرقمي وتتبع السجلات الحادثية (Forensics Incident Timeline Tracker)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                توجيه المعايير #021 يفرض إمكانية ربط السجلات من خلال معرّف الارتباط (Correlation ID) أو معرف الجلسة لتتبع دقيق ومسلسل للحدث من الإقلاع وحتى الوصول والانتهاء.
              </p>
            </div>

            {/* Select Scenario */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {INCIDENT_SCENARIOS.map((scen) => {
                const isActive = selectedScenarioId === scen.id;
                return (
                  <button
                    key={scen.id}
                    onClick={() => {
                      setSelectedScenarioId(scen.id);
                      setSelectedLogId(scen.logsToInclude[0].id);
                      triggerNotification(`تنشيط تتبع الحادثة: ${scen.nameAr}`, 'warning');
                    }}
                    className={`text-right p-5 border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      isActive 
                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20' 
                        : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-850 hover:border-slate-350'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center w-full mb-1">
                        <span className="bg-rose-500/15 text-rose-500 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-rose-500/20">
                          تهديد أمني مفترض
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-extrabold">{scen.targetSessionId}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-950 dark:text-white mt-1">
                        {scen.nameAr}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        {scen.descriptionAr}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-amber-600 dark:text-amber-400 font-black mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 w-full">
                      <span>خطوات التتبع المتاحة: {scen.logsToInclude.length} سجلات</span>
                      <span className="flex items-center gap-1">ابدأ التتبع <ArrowUpRight className="w-3 h-3" /></span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedScenarioId !== 'all' && (
              <div className="mt-4 p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 flex justify-between items-center">
                <span className="text-xs text-amber-900 dark:text-amber-300 font-bold">
                  أنت الآن في وضعية محاكاة تتبع الحادثة النشطة. يظهر لك بالأسفل الترتيب الزمني والارتباط التسلسلي للسجلات المتعلقة بجلسة الاختراق.
                </span>
                <button
                  onClick={() => setSelectedScenarioId('all')}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                >
                  إلغاء الفلترة والرجوع للكل
                </button>
              </div>
            )}
          </div>

          {/* Timeline of the active scenario logs */}
          {selectedScenarioId !== 'all' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Chronological steps */}
              <div className="lg:col-span-5 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6 shadow-sm">
                <h4 className="text-sm font-black text-slate-950 dark:text-white">التسلسل الزمني للحادثة (Audit Trace Sequence)</h4>
                
                <div className="relative border-r-2 border-amber-200 dark:border-amber-900 pr-5 mr-3 space-y-6">
                  {filteredLogs.map((log, index) => {
                    const isSelected = selectedLogId === log.id;
                    return (
                      <div key={log.id} className="relative">
                        {/* Circle bullet */}
                        <div className={`absolute -right-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                          isSelected ? 'bg-amber-600 border-amber-600 scale-125 shadow' : 'dark:bg-slate-900 border-amber-400'
                        }`} />

                        <div 
                          onClick={() => setSelectedLogId(log.id)}
                          className={`p-4 border text-right cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/10' 
                              : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                          }`}
                        >
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>الخطوة {index + 1}</span>
                            <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          
                          <h5 className="text-xs font-black text-slate-950 dark:text-white font-mono">
                            {log.operation}
                          </h5>

                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {log.descriptionAr}
                          </p>

                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] font-mono">
                            <span className="text-slate-400">CorrID: {log.correlationId.substring(0, 10)}...</span>
                            <span className={`px-1.5 py-0.5 rounded ${
                              log.result === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}>{log.result.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Forensic Details */}
              <div className="lg:col-span-7 bg-[#2a1d13] text-[#fce79a] rounded-3xl border border-slate-850 p-6 space-y-6 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 block font-black">تفاصيل السجل المحدد للتحليل المتقدم</span>
                    <h4 className="text-base font-black text-white">{activeLog.operation}</h4>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${
                    activeLog.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {activeLog.severity.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">معرف الجلسة (Session ID)</span>
                    <span className="text-slate-300 font-bold">{activeLog.sessionId}</span>
                  </div>
                  <div className="bg-slate-950 p-3 border border-slate-850">
                    <span className="text-slate-500 text-[10px] block">معرّف الارتباط للحادثة</span>
                    <span className="text-amber-400 font-bold">{activeLog.correlationId}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 border border-slate-850 space-y-2">
                  <span className="text-[10px] font-black text-slate-500 block">شرح تفصيلي تقني (Forensic Analysis Translation)</span>
                  <p className="text-xs text-slate-200 leading-relaxed font-semibold">{activeLog.descriptionAr}</p>
                  <p className="text-xs text-slate-400 italic text-left leading-relaxed font-mono" dir="ltr">{activeLog.descriptionEn}</p>
                </div>

                {/* Event Metadata */}
                <div className="space-y-2">
                  <span className="text-slate-400 text-xs font-black block">حمولة البيانات الإضافية للسجل (Payload Metadata)</span>
                  <div className="bg-slate-950 p-4 border border-slate-850 overflow-x-auto text-left" dir="ltr">
                    <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed">
                      {JSON.stringify(activeLog.metadata || {}, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Non-repudiation sign */}
                <div className="bg-slate-900 border border-slate-800 p-4 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> غير قابل للتعديل أو التراجع (Non-repudiation Verified)</span>
                  <span className="font-mono text-[10px]">HASH: SHA256_VERIFIED</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LOGGING COVERAGE REPORT */}
      {activeTab === 'coverage' && (
        <div className="space-y-6">
          <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                تقرير نسبة تغطية العمليات الحيوية بالسجلات (Logging Coverage & Audit Trail Report)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                توجيه المعايير رقم 021 يفرض تغطية كاملة وشاملة لكافة الفروع والنشاطات. يوضح الرسم البياني أدناه نسب الامتثال المحققة للتدقيق.
              </p>
            </div>

            {/* Recharts Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={coverageData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="pct" name="نسبة الامتثال %" fill="#4F46E5" radius={[10, 10, 0, 0]}>
                      {coverageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pct === 100 ? '#10B981' : '#4F46E5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status and summary statistics card */}
              <div className="lg:col-span-5 bg-transparent dark:bg-slate-950 p-5 border border-slate-150 dark:border-slate-850 space-y-4">
                <h4 className="text-xs font-black text-slate-400 tracking-wider">موجز امتثال الأنظمة لضوابط الأمن السيبراني</h4>
                
                <div className="space-y-3 font-sans text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">مجموع الإجراءات المكتملة بالتسجيل</span>
                    <span className="font-mono font-black text-slate-950 dark:text-white">939 / 941 إجراء</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">إجمالي النسبة المحققة للتغطية</span>
                    <span className="font-mono font-black text-emerald-500">99.8% (نطاق كامل)</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">معدل الفحص وتوليد السجل</span>
                    <span className="font-mono font-black text-amber-500">✓ فوري (Real-Time)</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-slate-600 dark:text-slate-400">الربط بالتحليل الجنائي للـ SIEM</span>
                    <span className="font-sans font-black text-emerald-500">متصل (On-Line)</span>
                  </div>
                </div>

                {/* Visual success alert */}
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3.5 border border-emerald-200/50 flex gap-2.5 items-start text-[11px] text-emerald-900 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-extrabold block">اكتمال تغطية تدقيق السجلات</span>
                    <p className="mt-0.5">النظام يغطي كافة العمليات المالية بنسبة 100%، وقرارات التخويل، ومحاولات المصادقة بصرامة مطلقة.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Table breakdown */}
            <div className="border border-slate-150 dark:border-slate-800 overflow-hidden text-xs">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                    <th className="p-3">الفئة والمطلب التشغيلي</th>
                    <th className="p-3">الاسم بالإنجليزية (English Component)</th>
                    <th className="p-3 text-center">العمليات المرصودة</th>
                    <th className="p-3 text-center">الإجراءات الخاضعة للتدقيق</th>
                    <th className="p-3 text-center">النسبة المئوية</th>
                    <th className="p-3 text-center">الحالة البرمجية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  {coverageData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                      <td className="p-3 font-extrabold">{item.name}</td>
                      <td className="p-3 font-mono text-slate-500">{item.nameEn}</td>
                      <td className="p-3 text-center font-mono">{item.logged}</td>
                      <td className="p-3 text-center font-mono">{item.total}</td>
                      <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">{item.pct}%</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.pct === 100 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL COMPLETENESS */}
      {activeTab === 'completeness' && (
        <div className="space-y-6">
          <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                تقرير اكتمال حقول السجل وحوكمة المحتوى (Audit Trail Completeness Matrix)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                القرار رقم 021 يفرض إدراج 13 حقلاً في كل سجل هيكلي بلا أي استثناء لضمان عدم التنصل والمتابعة القانونية التامة.
              </p>
            </div>

            {/* Field completeness grid checkoff list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completenessFields.map((field, idx) => (
                <div key={idx} className="bg-slate-50/50 dark:bg-slate-950/20 p-4 dark:border-slate-850 flex items-start gap-3">
                  <div className="bg-emerald-500/15 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
                    <Check className="w-4 h-4" />
                  </div>

                  <div className="space-y-1.5 w-full">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-black text-slate-900 dark:text-white font-mono">{field.field}</span>
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-400 text-[9px] font-mono px-2 py-0.5 rounded-full">
                        {field.presentCount} present
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">{field.arabicName}</p>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-200/50 dark:border-slate-800/50 pt-1.5 mt-1.5">
                      <span>النوع: {field.datatype}</span>
                      <span>{field.requiredByLaw}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Regulatory statement summary */}
            <div className="bg-amber-50/50 dark:bg-amber-950/15 p-5 border border-amber-200/50 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <h4 className="font-extrabold text-amber-950 dark:text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5" />
                <span>إقرار الامتثال التنظيمي للتدقيق السيبراني بالمملكة العربية السعودية</span>
              </h4>
              <p>
                نقر نحن فريق حوكمة الحوسبة والمنصات التعليمية بمدرسة الرياض بأن معمارية السجلات المستحدثة تطبق بالكامل وبلا أي ثغرات حقول الارتباط ومصادر العمليات الحساسة. كافة البيانات تشفر تلقائياً بمقابس النقل الآمن وتسحب Correlation IDs مباشرة لمطابقتها مع خوادم الـ SIEM وجدار الحماية، مع الاحتفاظ بختم زمني من خادم محلي موثوق بنظام التوقيت العالمي UTC المتوافق لضمان الحجية القانونية والامتثال للمركز الوطني للأمن السيبراني وهيئة الاتصالات والفضاء والتقنية.
              </p>
              <div className="flex justify-end pt-2">
                <span className="text-[10px] font-black text-amber-500 bg-amber-100 dark:bg-amber-950 px-3 py-1 rounded-full">
                  تم التصديق الرقمي: Riyadh_KSA_Compliance_Board ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
