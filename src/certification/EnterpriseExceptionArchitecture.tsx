import { AlertCircle, AlertOctagon, AlertTriangle, BarChart3, Binary, Blocks, Box, Check, CheckCircle2, CheckSquare, Code, Code2, Cross, Database, Diff, Filter, Grid, Handshake, HelpCircle, Inspect, LayoutList, List, Logs, Map, Play, Pointer, RefreshCw, Search, Shield, Sidebar, Sliders, Split, Terminal, Type, User, Wrench, ZapOff } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// ==========================================
// ENTERPRISE EXCEPTION HIERARCHY DEFINITION
// ==========================================
export type ExceptionSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ExceptionMetadata {
  correlationId: string;
  tenantId: string;
  userId: string;
  timestamp: string;
  module: string;
  operation: string;
  severity: ExceptionSeverity;
  recoveryRecommendationEn: string;
  recoveryRecommendationAr: string;
}

// Base Enterprise Exception class representation
export abstract class BaseEnterpriseException extends Error {
  public abstract readonly category: 'Business' | 'Validation' | 'Security' | 'Infrastructure' | 'Database' | 'Concurrency' | 'Integration' | 'Unexpected';
  public readonly correlationId: string;
  public readonly tenantId: string;
  public readonly userId: string;
  public readonly timestamp: string;
  public readonly module: string;
  public readonly operation: string;
  public readonly severity: ExceptionSeverity;
  public readonly recoveryRecommendationEn: string;
  public readonly recoveryRecommendationAr: string;
  public readonly messageEn: string;
  public readonly messageAr: string;
  public readonly originalError?: any;

  constructor(
    messageEn: string,
    messageAr: string,
    metadata: ExceptionMetadata,
    originalError?: any
  ) {
    super(messageEn);
    this.name = this.constructor.name;
    this.messageEn = messageEn;
    this.messageAr = messageAr;
    this.correlationId = metadata.correlationId;
    this.tenantId = metadata.tenantId;
    this.userId = metadata.userId;
    this.timestamp = metadata.timestamp;
    this.module = metadata.module;
    this.operation = metadata.operation;
    this.severity = metadata.severity;
    this.recoveryRecommendationEn = metadata.recoveryRecommendationEn;
    this.recoveryRecommendationAr = metadata.recoveryRecommendationAr;
    this.originalError = originalError;

    // Capture standard stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      category: this.category,
      messageEn: this.messageEn,
      messageAr: this.messageAr,
      correlationId: this.correlationId,
      tenantId: this.tenantId,
      userId: this.userId,
      timestamp: this.timestamp,
      module: this.module,
      operation: this.operation,
      severity: this.severity,
      recoveryRecommendationEn: this.recoveryRecommendationEn,
      recoveryRecommendationAr: this.recoveryRecommendationAr,
      originalError: this.originalError ? String(this.originalError) : undefined,
      stack: this.stack
    };
  }
}

// Specialized Enterprise Exceptions
export class BusinessException extends BaseEnterpriseException {
  public readonly category = 'Business';
}

export class ValidationException extends BaseEnterpriseException {
  public readonly category = 'Validation';
}

export class SecurityException extends BaseEnterpriseException {
  public readonly category = 'Security';
}

export class InfrastructureException extends BaseEnterpriseException {
  public readonly category = 'Infrastructure';
}

export class DatabaseException extends BaseEnterpriseException {
  public readonly category = 'Database';
}

export class ConcurrencyException extends BaseEnterpriseException {
  public readonly category = 'Concurrency';
}

export class IntegrationException extends BaseEnterpriseException {
  public readonly category = 'Integration';
}

export class UnexpectedException extends BaseEnterpriseException {
  public readonly category = 'Unexpected';
}

// Helper factory to quickly spawn simulated exceptions
const generateSimulatedException = (
  category: BaseEnterpriseException['category'],
  module: string,
  operation: string,
  tenantId: string = 'TEN_RIYADH_01',
  userId: string = 'USR_DEAN_99'
): BaseEnterpriseException => {
  const correlationId = `corr_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  switch (category) {
    case 'Business':
      return new BusinessException(
        'The student has exceeded the maximum limit for installment payment delays.',
        'لقد تجاوز الطالب الحد الأقصى المسموح به لتأخير تسديد الأقساط الدراسية.',
        {
          correlationId,
          tenantId,
          userId,
          timestamp,
          module,
          operation,
          severity: 'high',
          recoveryRecommendationEn: 'Request an official waiver from the Dean or process an immediate partial settlement.',
          recoveryRecommendationAr: 'يرجى تقديم طلب إعفاء رسمي معتمد من عميد القبول أو إجراء تسوية مالية جزئية فورية.'
        }
      );
    case 'Validation':
      return new ValidationException(
        'The input national identity number does not conform to Riyadh regional validation regex.',
        'رقم الهوية الوطنية المدخل لا يطابق التنسيق المعتمد لمنطقة الرياض.',
        {
          correlationId,
          tenantId,
          userId,
          timestamp,
          module,
          operation,
          severity: 'medium',
          recoveryRecommendationEn: 'Re-enter a valid 10-digit national ID starting with 1 or 2.',
          recoveryRecommendationAr: 'أعد إدخال الهوية الوطنية بشكل صحيح مكونة من 10 خانات رقمية تبدأ بـ 1 أو 2.'
        }
      );
    case 'Security':
      return new SecurityException(
        'Cross-tenant data mutation attempt blocked. Authorized tenant does not match record owner.',
        'محاولة تعديل بيانات متقاطعة بين المستأجرين تم حظرها. فرع الصلاحية لا يطابق مالك السجل.',
        {
          correlationId,
          tenantId,
          userId,
          timestamp,
          module,
          operation,
          severity: 'critical',
          recoveryRecommendationEn: 'Log in with credentials matching the target tenant organization scope.',
          recoveryRecommendationAr: 'يرجى تسجيل الدخول بالحساب التابع للفرع أو المؤسسة المالكة لهذا السجل.'
        }
      );
    case 'Infrastructure':
      return new InfrastructureException(
        'The primary API gateway socket timed out after 5000ms under high payload load.',
        'انتهت مهلة اتصال مأخذ بوابة الربط الأساسية بعد 5000 ملّي ثانية نتيجة الضغط العالي.',
        {
          correlationId,
          tenantId,
          userId,
          timestamp,
          module,
          operation,
          severity: 'high',
          recoveryRecommendationEn: 'Check system gateway health status or retry request during lower traffic period.',
          recoveryRecommendationAr: 'يرجى التحقق من حالة اتصال البوابة الموحدة، أو إعادة المحاولة في وقت لاحق.'
        }
      );
    case 'Database':
      return new DatabaseException(
        'Transaction deadlock detected on student ledger write locks. Row locked by session #3829.',
        'تم الكشف عن تعليق معاملة (Deadlock) في سجلات الحسابات. الصف مقفل بواسطة جلسة أخرى رقم #3829.',
        {
          correlationId,
          tenantId,
          userId,
          timestamp,
          module,
          operation,
          severity: 'critical',
          recoveryRecommendationEn: 'The transaction was safely rolled back. Retry after a progressive back-off delay.',
          recoveryRecommendationAr: 'تم التراجع عن المعاملة المحاسبية بأمان لتفادي تلف السجلات. يرجى الانتظار وإعادة المحاولة.'
        }
      );
    case 'Concurrency':
      return new ConcurrencyException(
        'The academic program contract was updated in the background. Your local version is stale.',
        'تم تعديل العقد الدراسي لهذا البرنامج في الخلفية مسبقاً. النسخة المحلية لديك غير محدثة.',
        {
          correlationId,
          tenantId,
          userId,
          timestamp,
          module,
          operation,
          severity: 'high',
          recoveryRecommendationEn: 'Refresh the academic program detail sheet and apply your edits to the newest state.',
          recoveryRecommendationAr: 'أعد تحميل صفحة تفاصيل البرنامج الدراسي ثم أعد تطبيق تعديلاتك على أحدث نسخة.'
        }
      );
    case 'Integration':
      return new IntegrationException(
        'National Education Portal (Noor System) returned a bad gateway response status 502.',
        'بوابة التعليم الوطنية (نظام نور) أعادت رمز استجابة خاطئ 502 (بوابة اتصال سيئة).',
        {
          correlationId,
          tenantId,
          userId,
          timestamp,
          module,
          operation,
          severity: 'medium',
          recoveryRecommendationEn: 'Verify integration API credentials or check external government service status.',
          recoveryRecommendationAr: 'يرجى مراجعة إعدادات الربط مع نظام نور الحكومي أو التحقق من جاهزية الخدمة الخارجية.'
        }
      );
    default:
      return new UnexpectedException(
        'An unhandled null pointer dereference occurred in memory buffer stack allocation.',
        'حدث خطأ غير متوقع وقراءة غير صالحة لمؤشر فارغ (Null Pointer) في ذاكرة التخزين المؤقت.',
        {
          correlationId,
          tenantId,
          userId,
          timestamp,
          module,
          operation,
          severity: 'critical',
          recoveryRecommendationEn: 'Please contact system administrators with the correlation ID for stack trace inspection.',
          recoveryRecommendationAr: 'يرجى إرسال رقم الارتباط الذاتي (Correlation ID) إلى مسؤولي النظام لمراجعة سجل الأخطاء.'
        }
      );
  }
};

// ==========================================
// CENTRALIZED ERROR CATALOG DECLARATIONS
// ==========================================
interface CatalogError {
  code: string;
  category: BaseEnterpriseException['category'];
  nameEn: string;
  nameAr: string;
  messageEn: string;
  messageAr: string;
  severity: ExceptionSeverity;
  module: string;
  remedyEn: string;
  remedyAr: string;
}

const CENTRALIZED_ERROR_CATALOG: CatalogError[] = [
  {
    code: 'ERR_BUS_4201',
    category: 'Business',
    nameEn: 'Maximum Discount Ceiling Exceeded',
    nameAr: 'تجاوز السقف الأعلى المسموح للخصومات والمنح',
    messageEn: 'Total assigned discounts exceed 100% of the active student base tuition cost.',
    messageAr: 'إجمالي الخصومات والمنح المقررة يتجاوز 100% من قيمة الرسوم الدراسية المعتمدة للطالب.',
    severity: 'high',
    module: 'Finances & Billing',
    remedyEn: 'Recalculate and scale back discounts to prevent negative invoice aggregates.',
    remedyAr: 'يرجى مراجعة وتعديل نسب التخفيض لمنع تدوير فواتير محاسبية بقيمة سالبة.'
  },
  {
    code: 'ERR_VAL_3102',
    category: 'Validation',
    nameEn: 'Saudi VAT Conformity Constraint Broken',
    nameAr: 'مخالفة النسبة الوطنية لضريبة القيمة المضافة السعودية',
    messageEn: 'The calculated tax must exactly match Saudi standard VAT rate of 15% for educational products.',
    messageAr: 'يجب احتساب ضريبة القيمة المضافة طبقاً للنسبة المحددة وطنياً بـ 15% على الرسوم التعليمية الخاضعة.',
    severity: 'medium',
    module: 'Double-Entry Ledger',
    remedyEn: 'Verify base invoice values and recalculate VAT with the standard 0.15 modifier.',
    remedyAr: 'تأكد من قيمة الفاتورة الأساسية ثم أعد احتساب مبلغ الضريبة بضرب الأساس في المعامل 0.15.'
  },
  {
    code: 'ERR_SEC_1003',
    category: 'Security',
    nameEn: 'Cross-Tenant Access Leak Prevention Triggered',
    nameAr: 'تنشيط مانع تسريب البيانات وعزل المستأجرين',
    messageEn: 'User identity lacks authentication tokens associated with target record regional tenant ID.',
    messageAr: 'هوية المستخدم لا تمتلك رمز المصادقة المرتبط بمعرف الفرع الإقليمي لمالك هذا السجل.',
    severity: 'critical',
    module: 'IAM Isolation Shield',
    remedyEn: 'System locked access. Relog into the correct tenant node environment.',
    remedyAr: 'تم قفل الوصول بالكامل لمنع التداخل. أعد تسجيل الدخول بالنطاق الجغرافي المطابق.'
  },
  {
    code: 'ERR_INF_9011',
    category: 'Infrastructure',
    nameEn: 'Redis Memory Capacity Overflow',
    nameAr: 'امتلاء وتجاوز سعة ذاكرة التخزين المؤقت للرديس',
    messageEn: 'The distributed Redis database cache hit maximum allocation threshold, causing eviction lock.',
    messageAr: 'مخزن الذاكرة المشتركة للرديس وصل للحد الأقصى للتخصيص مما سبب تجميد كتابة المفاتيح المؤقتة.',
    severity: 'high',
    module: 'Cache System',
    remedyEn: 'Trigger automatic eviction routines or temporarily expand virtual machine RAM.',
    remedyAr: 'يرجى تشغيل بروتوكول تصفير الكاش غير النشط أو توسيع مساحة الذاكرة الافتراضية بشكل فوري.'
  },
  {
    code: 'ERR_DB_5510',
    category: 'Database',
    nameEn: 'Transaction Rollback Incomplete',
    nameAr: 'عدم اكتمال التراجع عن المعاملة في قاعدة البيانات',
    messageEn: 'Unsaved database logs failed to roll back cleanly after thread interrupt.',
    messageAr: 'فشل التراجع النظيف عن تعديلات قاعدة البيانات بعد انقطاع مفاجئ في تيار الاتصال للطلب.',
    severity: 'critical',
    module: 'PostgreSQL Pool',
    remedyEn: 'Execute database pool sanity check or safely drain orphaned connection sockets.',
    remedyAr: 'قم بإجراء فحص أمان على كتل قاعدة البيانات وقنوات الاتصال للتخلص من الاتصالات اليتيمة.'
  },
  {
    code: 'ERR_CON_2105',
    category: 'Concurrency',
    nameEn: 'Stale State Conflict Check Failure',
    nameAr: 'فشل فحص النسخة في التعديل المتزامن',
    messageEn: 'The version number check mismatch detected. Another process updated this row during execution.',
    messageAr: 'تم رصد اختلاف في رقم نسخة السجل. قام مستخدم آخر بتحديث هذا السجل أثناء كتابة بياناتك.',
    severity: 'high',
    module: 'Optimistic Locking Engine',
    remedyEn: 'Fetch the latest database version state before executing local save pipeline.',
    remedyAr: 'اسحب أحدث نسخة من قاعدة البيانات أولاً لدمج الفوارق قبل إعادة محاولة الحفظ.'
  },
  {
    code: 'ERR_INT_6612',
    category: 'Integration',
    nameEn: 'Saudi Payment Gateway API Handshake Failure',
    nameAr: 'فشل الربط الأولي والمصافحة مع بوابة الدفع السعودية (مدى)',
    messageEn: 'Unable to establish TLS handshake with the central payment processing API server.',
    messageAr: 'لم يتمكن النظام من إتمام المصافحة المشفرة TLS مع خوادم بوابة معالجة بطاقات الدفع الوطنية (مدى).',
    severity: 'high',
    module: 'Mada Gateway integration',
    remedyEn: 'Check gateway SSL certification status or ensure payment provider APIs are online.',
    remedyAr: 'تحقق من صلاحية شهادات الحماية المشفرة SSL أو جاهزية خادم مزود الخدمة الخارجي.'
  },
  {
    code: 'ERR_UNX_0000',
    category: 'Unexpected',
    nameEn: 'Internal Memory Leak Corruption Alert',
    nameAr: 'تنبيه بتسرب الذاكرة أو تلف كتل الذاكرة المؤقتة',
    messageEn: 'The runtime environment heap usage exceeded safe margins, forcing garbage collector pressure.',
    messageAr: 'تجاوز استخدام ذاكرة الوصول العشوائي للبيئة التشغيلية الحدود الآمنة، مما تطلب تدخلاً عاجلاً.',
    severity: 'critical',
    module: 'V8 Runtime Stack',
    remedyEn: 'Safely dump worker processes heap files and initiate graceful pod recycling.',
    remedyAr: 'يرجى مراجعة سجلات الذاكرة للكومبوننت المعني والقيام بإعادة تشغيل الخدمة بشكل آمن.'
  }
];

// ==========================================
// UNSAFE VS ENTERPRISE REWRITTEN CODE COMPARISONS
// ==========================================
interface CodeSnippet {
  id: string;
  nameEn: string;
  nameAr: string;
  flawDescriptionEn: string;
  flawDescriptionAr: string;
  flawType: 'silent' | 'generic' | 'swallowed' | 'inconsistent';
  unsafeCode: string;
  safeCode: string;
  detectedIssues: string[];
}

const UNSAFE_SNIPPETS: CodeSnippet[] = [
  {
    id: 'snip_swallowed',
    nameEn: 'Swallowed Try-Catch Exception (Silent Collapse)',
    nameAr: 'ابتلاع الأخطاء بالكامل (صمت وتجميد النظام)',
    flawDescriptionEn: 'A try-catch block swallows the exception with an empty catch body. The UI gets stuck with an infinite spinner and no logging exists.',
    flawDescriptionAr: 'كتلة catch فارغة تماماً تبتلع الخطأ دون تتبع أو إعادة رمي. يتعطل الكود بالخلفية وتتوقف الواجهة للأبد دون إشعار.',
    flawType: 'swallowed',
    unsafeCode: `// ❌ UNSAFE: Error is completely swallowed!
async function saveInvoiceData(invoice) {
  try {
    const response = await api.post('/invoices', invoice);
    return response.data;
  } catch (error) {
    // Silent catch, nothing is rethrown or reported. 
    // User sees infinitely spinning loaders.
  }
}`,
    safeCode: `// ✅ SAFE: Properly wrapped in Enterprise Exception Hierarchy
async function saveInvoiceData(invoice) {
  try {
    const response = await api.post('/invoices', invoice);
    return response.data;
  } catch (error) {
    // 1. Map generic error to specific Database/Integration Exception
    // 2. Automatically inject correlation, tenant context & localized remedy
    throw new DatabaseException(
      "Failed to commit invoice transaction to database ledger.",
      "فشل في ترحيل معاملة الفاتورة المحاسبية إلى دفتر الأستاذ بقاعدة البيانات.",
      {
        correlationId: generateCorrelationId(),
        tenantId: getActiveTenantContext(),
        userId: getCurrentUserSession(),
        timestamp: new Date().toISOString(),
        module: "Billing & Accounts",
        operation: "COMMIT_INVOICE_TRANSACTION",
        severity: "critical",
        recoveryRecommendationEn: "Inspect database pool connectivity and transaction lock conditions.",
        recoveryRecommendationAr: "يرجى فحص اتصالات قاعدة البيانات وحالة قفل الجداول المالية المتزامنة."
      },
      error // Retain original error stack trace! No swallowing!
    );
  }
}`,
    detectedIssues: [
      'امتصاص كامل ومخفي للأخطاء (Silent Swallowing)',
      'تجميد كامل لواجهة المستخدم (Infinite Spinner)',
      'فقدان كامل لسياق التتبع ومقاييس النظام (Loss of Stack Trace)',
      'انعدام الهوية الوطنية والفرعية للعملية (No Correlation or Tenant context)'
    ]
  },
  {
    id: 'snip_generic',
    nameEn: 'Generic Untyped Throwing (Loss of Context)',
    nameAr: 'رمي الأخطاء العامة غامضة المصدر (فقدان التفاصيل)',
    flawDescriptionEn: 'Throwing generic Error objects strips type safety and localization, making recovery impossible.',
    flawDescriptionAr: 'استخدام throw new Error("مخالفة") عشوائي يزيل أي إمكانية للفرز الآمن، وغالباً ما يفشل في توضيح التوصية بالإصلاح.',
    flawType: 'generic',
    unsafeCode: `// ❌ UNSAFE: Generic text error is thrown!
function validateSaudiId(id) {
  if (!/^[12]\\d{9}$/.test(id)) {
    throw new Error("Invalid Saudi National ID format.");
  }
}`,
    safeCode: `// ✅ SAFE: Throwing specialized typed validation exceptions
function validateSaudiId(id) {
  if (!/^[12]\\d{9}$/.test(id)) {
    throw new ValidationException(
      "Invalid Saudi National ID format. Must start with 1 or 2 and have exactly 10 digits.",
      "رقم الهوية الوطنية/الإقامة غير صالح. يجب أن يتكون من 10 خانات ويبدأ بـ 1 أو 2.",
      {
        correlationId: generateCorrelationId(),
        tenantId: getActiveTenantContext(),
        userId: getCurrentUserSession(),
        timestamp: new Date().toISOString(),
        module: "Security & IAM Verification",
        operation: "VALIDATE_IDENTITY",
        severity: "medium",
        recoveryRecommendationEn: "Please recheck official national ID card and enter 10 digits.",
        recoveryRecommendationAr: "يرجى مراجعة بطاقة الهوية الوطنية المدخلة والتأكد من كتابة 10 خانات رقمية."
      }
    );
  }
}`,
    detectedIssues: [
      'استخدام استثناء عام بدلاً من صنف مخصص (Generic Type Loss)',
      'عدم توافق اللغات واقتصار الرسالة على لغة واحدة (No Translation Support)',
      'غياب توصية الإصلاح للمستخدم النهائي (No Recovery Strategy)',
      'فقدان معرفات الارتباط للحوكمة والتحليل (Missing Telemetry Keys)'
    ]
  },
  {
    id: 'snip_silent',
    nameEn: 'Silent Log-Only Catch (Console Slop)',
    nameAr: 'سجل الكونسول الصامت (تجاهل الخطأ في الإنتاج)',
    flawDescriptionEn: 'Catching and logging to console.log is completely invisible to monitoring systems and yields silent user failures.',
    flawDescriptionAr: 'معالجة الخطأ بطباعة console.log فقط دون حفظ أو إرسال للخوادم المشتركة، تترك التطبيق غامض السلوك لفرق الأمان والمساندة.',
    flawType: 'silent',
    unsafeCode: `// ❌ UNSAFE: Console logging doesn't register with monitors!
function executeSecurityLock(role) {
  try {
    if (role !== 'Admin') {
      throw new Error("Forbidden access.");
    }
  } catch (err) {
    // Slop print to browser developer tools. 
    // Invisible to security logs and monitoring agents.
    console.log("Error logic: " + err);
  }
}`,
    safeCode: `// ✅ SAFE: Captured by Enterprise Audit and security exception routing
function executeSecurityLock(role) {
  try {
    if (role !== 'Admin') {
      throw new SecurityException(
        "User role unauthorized to change global system locks.",
        "دور المستخدم غير مخول بإحداث تغييرات على حالات القفل العامة للنظام.",
        {
          correlationId: generateCorrelationId(),
          tenantId: getActiveTenantContext(),
          userId: getCurrentUserSession(),
          timestamp: new Date().toISOString(),
          module: "IAM Core Guard",
          operation: "GLOBAL_SYSTEM_FREEZE",
          severity: "critical",
          recoveryRecommendationEn: "Action reported to security auditors. Upgrade credentials or escalate role.",
          recoveryRecommendationAr: "تم الإبلاغ في سجلات التدقيق الأمني. يرجى تسجيل الدخول بحساب مسؤول ذي صلاحية."
        }
      );
    }
  } catch (err) {
    // 1. Audit log in security repository with full correlation tracing
    SecurityAuditService.logAlert(err);
    // 2. Propagate up the stack to prevent silent logical continuation
    throw err;
  }
}`,
    detectedIssues: [
      'طباعة عابرة للكونسول تختفي بتحديث الصفحة (Ephemeral Console Slop)',
      'غياب أي تنبيه لمسؤول الأمان (Security Audit Blindspot)',
      'متابعة تنفيذ الكود بالرغم من وقوع ثغرة صلاحيات (Permissive Flow Failure)',
      'رسائل أخطاء بالإنجليزية فقط غامضة الدلالة (No Arabic Equivalents)'
    ]
  }
];

interface EnterpriseExceptionArchitectureProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

export default function EnterpriseExceptionArchitecture({ triggerNotification }: EnterpriseExceptionArchitectureProps) {
  const [activeTab, setActiveTab] = useState<'playground' | 'repair' | 'catalog' | 'report'>('playground');
  
  // Playground simulation states
  const [selectedCategory, setSelectedCategory] = useState<BaseEnterpriseException['category']>('Business');
  const [simulatedException, setSimulatedException] = useState<BaseEnterpriseException | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  
  // Code Scanner and Repair States
  const [selectedSnippetId, setSelectedSnippetId] = useState<string>('snip_swallowed');
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [repairedSuccessfully, setRepairedSuccessfully] = useState<boolean>(false);
  const [rawEditableCode, setRawEditableCode] = useState<string>('');

  // Search in Centralized Catalog
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('All');

  // Interactive Resiliency metrics
  const [projectResiliencyScore, setProjectResiliencyScore] = useState<number>(68); // Starts low, increases on repair!
  const [silentFailuresDetected, setSilentFailuresDetected] = useState<number>(4);
  const [repairedFailuresCount, setRepairedFailuresCount] = useState<number>(0);

  // Terminal Logs Stack
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] ARCHITECTURE ENGINE: تم تحميل خريطة الحوكمة لخطوط معالجة الاستثناءات الكلية (Enterprise Hierarchy Enabled).`,
    `[${new Date().toLocaleTimeString()}] Telemetry initialized. Ready to route exception structures with zero footprint loss.`
  ]);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // Sync selected code snippet
  const activeSnippet = useMemo(() => {
    return UNSAFE_SNIPPETS.find(s => s.id === selectedSnippetId) || UNSAFE_SNIPPETS[0];
  }, [selectedSnippetId]);

  useEffect(() => {
    setRawEditableCode(activeSnippet.unsafeCode);
    setRepairedSuccessfully(false);
  }, [activeSnippet]);

  // Handle Simulated Trigger
  const handleTriggerSimulation = () => {
    setIsSimulating(true);
    addLog(`⚠️ استدعاء محاكاة وقوع استثناء من فئة: ${selectedCategory}...`);
    
    setTimeout(() => {
      const exc = generateSimulatedException(selectedCategory, 'Registration-Portal', 'REGISTER_NEW_STUDENT');
      setSimulatedException(exc);
      setIsSimulating(false);
      
      addLog(`🔥 [EXC_DETECTED] تم رصد وتعبئة الكائن الهيكلي بنجاح! رمز التتبع: ${exc.correlationId}`);
      addLog(`🔍 تفاصيل المعالجة: تم عزل الخطأ في طبقة [${exc.module}] - مستوى الأمان [${exc.severity.toUpperCase()}].`);
      
      triggerNotification(
        `تم التقاط استثناء هيكلي مخصص: ${exc.messageAr}`,
        exc.severity === 'critical' ? 'danger' : exc.severity === 'high' ? 'warning' : 'info'
      );
    }, 800);
  };

  // Handle Repair Automation Trigger
  const handleRepairSnippet = () => {
    setIsRepairing(true);
    addLog(`⚙️ تشغيل محلل الكود الثنائي (Binary Abstract Syntax Tree Analyser)...`);
    addLog(`⚙️ جاري اكتشاف مكررات ابتلاع الأخطاء والأكواد الصامتة...`);

    setTimeout(() => {
      setIsRepairing(false);
      setRepairedSuccessfully(true);
      setProjectResiliencyScore(prev => Math.min(prev + 10, 100));
      setSilentFailuresDetected(prev => Math.max(prev - 1, 0));
      setRepairedFailuresCount(prev => prev + 1);
      
      addLog(`✓ تم كشف الثغرة: تم إلغاء كتلة Catch صامتة وتوليد محاذاة حوكمية استثنائية.`);
      addLog(`✓ تم بنجاح استبدال وتمرير الكائنات المتسلسلة لخدمة التتبع والمراقبة للتدقيق الأمني.`);
      triggerNotification('تم إصلاح الكود البرمجي الصامت وربطه بمعمارية الاستثناءات الموحدة بنجاح!', 'success');
    }, 1500);
  };

  // Re-generate standard correlation uuid for visual display
  const freshCorrelationId = useMemo(() => {
    return `corr_SA_${Math.floor(100000 + Math.random() * 900000)}`;
  }, [simulatedException]);

  // Catalog filtered list
  const filteredCatalog = useMemo(() => {
    return CENTRALIZED_ERROR_CATALOG.filter(err => {
      const matchSearch = 
        err.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        err.nameEn.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        err.nameAr.includes(catalogSearch) ||
        err.module.toLowerCase().includes(catalogSearch.toLowerCase());
      
      const matchCategory = catalogCategoryFilter === 'All' || err.category === catalogCategoryFilter;
      
      return matchSearch && matchCategory;
    });
  }, [catalogSearch, catalogCategoryFilter]);

  // Charts Mock Data
  const severityChartData = [
    { name: 'Critical (حرج)', value: 3, color: '#f43f5e' },
    { name: 'High (مرتفع)', value: 5, color: '#f59e0b' },
    { name: 'Medium (متوسط)', value: 6, color: '#6366f1' },
    { name: 'Low (منخفض)', value: 4, color: '#10b981' }
  ];

  const complianceTimelineData = [
    { date: 'Phase 1', score: 40, failures: 18 },
    { date: 'Phase 2', score: 55, failures: 12 },
    { date: 'Phase 3', score: 68, failures: 8 },
    { date: 'Current (اليوم)', score: projectResiliencyScore, failures: silentFailuresDetected }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl" id="exception-architecture-root">
      
      {/* BRANDING BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-850 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-rose-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-350 text-xs font-black">
              <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>TRANSFORMATION DIRECTIVE #019 • معمارية الأخطاء والاستثناءات الموحدة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              إطار عمل معالجة واستبعاد الاستثناءات (Enterprise Exception Architecture)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              إلغاء كامل ومكافحة صارمة لابتلاع الأخطاء البرمجية (Swallowed Catch Blocks) والسكوت عنها (Silent Failures) أو استخدام الأخطاء العامة غير الصالحة للتصنيف والترجمة. يوفر هذا الإطار معمارية متوارثة للتحقق من أمن العمليات، وتدقيق الحسابات، وقفل الجداول المتزامنة، وتمرير معرفات التتبع (Correlation IDs) والتعرف التلقائي على هوية الفرع والفرع المالي للطلب.
            </p>
          </div>
        </div>

        {/* Bento Board Resiliency Status metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800 text-slate-300">
          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">معدل مرونة النظام وصلاحية الأكواد</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl sm:text-2xl font-black ${projectResiliencyScore === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {projectResiliencyScore}%
              </span>
              <span className="text-[10px] text-slate-500">Resiliency Score</span>
            </div>
            <span className="text-[10px] text-rose-400 font-semibold">تحسين شامل للرمي المتتالي ✓</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">ثغرات صامتة تم اكتشافها</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-rose-400">{silentFailuresDetected} ثغرات</span>
              <span className="text-xs text-slate-400">Silent Error</span>
            </div>
            <span className="text-[10px] text-slate-500">جاري مسح ومعالجة الملفات</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">أكواد استثنائية تم تطهيرها</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-400">{repairedFailuresCount} دالة</span>
              <span className="text-xs text-slate-400">Refactored Catch</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">تم تطبيق الترجمة المزدوجة</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">معرفات الربط التلقائي للتدقيق</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">مفعل 100%</span>
              <span className="text-xs text-slate-400">Correlation Tracing</span>
            </div>
            <span className="text-[10px] text-amber-400 font-medium">سلسلة البيانات متطابقة</span>
          </div>
        </div>
      </div>

      {/* CORE SECTIONS TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 dark:border-slate-850">
          <button
            onClick={() => setActiveTab('playground')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'playground' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>محاكي وقوع واستعراض الاستثناءات 🧪</span>
          </button>
          
          <button
            onClick={() => setActiveTab('repair')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'repair' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>ماسح ومصلح الأكواد الصامتة تلقائياً ⚙️</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'catalog' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>الدليل الموحد لرموز الأخطاء (Error Catalog) 📚</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'report' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>تقرير الأمان ومعمارية الاستثناءات 📊</span>
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* TAB 1: INTERACTIVE EXCEPTION SIMULATOR */}
        {activeTab === 'playground' && (
          <>
            {/* Sidebar exception classes selector */}
            <div className="lg:col-span-4 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <LayoutList className="w-4 h-4 text-rose-500" />
                  <span>تدرج هرم الاستثناءات المؤسسي</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  اختر صنفاً من الاستثناءات الهيكلية المتوارثة من الكلاس الأساسي لتوليد محاكاة حية له وملاحظة التزام البيانات بالترجمة الفورية ومفاتيح الأمان.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'Business Exception', type: 'Business', descAr: 'استثناءات منطق العمل المالي والأكاديمي والتحقق من الشروط المسبقة', color: 'border-amber-500 hover:bg-amber-500/5' },
                  { name: 'Validation Exception', type: 'Validation', descAr: 'استثناءات مراجعة الصيغ والمدخلات وقوانين تعبئة النماذج', color: 'border-yellow-500 hover:bg-yellow-500/5' },
                  { name: 'Security Exception', type: 'Security', descAr: 'استثناءات محاولات خرق الصلاحيات وتداخل بيانات المستأجرين والفروع', color: 'border-rose-500 hover:bg-rose-500/5' },
                  { name: 'Infrastructure Exception', type: 'Infrastructure', descAr: 'استثناءات انقطاع خدمات الذاكرة المؤقتة أو البوابات الرقمية أو السيرفر', color: 'border-amber-500 hover:bg-amber-500/5' },
                  { name: 'Database Exception', type: 'Database', descAr: 'استثناءات قفل الجداول وتعارض الصفقات وفشل الإدخال في البولينج', color: 'border-emerald-500 hover:bg-emerald-500/5' },
                  { name: 'Concurrency Exception', type: 'Concurrency', descAr: 'استثناءات تعديل السجلات القديمة وحفظ التحديثات المتزامنة المتداخلة', color: 'border-teal-500 hover:bg-teal-500/5' },
                  { name: 'Integration Exception', type: 'Integration', descAr: 'استثناءات فشل قنوات الربط الخارجية والـ APIs الحكومية المتقاطعة', color: 'border-purple-500 hover:bg-purple-500/5' },
                  { name: 'Unexpected Exception', type: 'Unexpected', descAr: 'استثناءات الأخطاء البرمجية المباشرة والمصادر غير الموثوقة للتنفيذ', color: 'border-slate-500 hover:bg-slate-500/5' }
                ].map((item) => {
                  const isSelected = selectedCategory === item.type;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        setSelectedCategory(item.type as any);
                        setSimulatedException(null);
                      }}
                      className={`w-full text-right p-3.5 border transition-all text-xs flex flex-col gap-2 cursor-pointer ${
                        isSelected 
                          ? 'bg-rose-50/75 dark:bg-rose-950/20 border-rose-500 ring-2 ring-rose-500/10' 
                          : `dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${item.color}`
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-extrabold text-slate-950 dark:text-white">
                          {item.name}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {item.descAr}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sandbox main action screen */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Trigger panel */}
              <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-150 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-rose-500" />
                      <span>بيئة تشغيل ومحاكاة الوقوع الآمن للاستثناءات</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">توليد نموذج حي للخطأ بناء على الكلاس المختار للتحقق من المخرجات المتسلسلة.</p>
                  </div>

                  <button
                    onClick={handleTriggerSimulation}
                    disabled={isSimulating}
                    className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white px-5 py-2.5 text-xs font-black shadow-lg shadow-rose-600/10 transition-all active:scale-95 cursor-pointer"
                  >
                    {isSimulating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 text-rose-200" />
                    )}
                    <span>إطلاق ومحاكاة وقوع الاستثناء 🔥</span>
                  </button>
                </div>

                {/* Show simulation outcome if triggered */}
                <AnimatePresence mode="wait">
                  {simulatedException ? (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-6"
                    >
                      {/* UI Error Notification Box mimicking a real application UI error boundary */}
                      <div className="border border-rose-350 bg-rose-500/5 p-5 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 bg-rose-600 text-white text-[9px] font-black px-3 py-1 rounded-br-xl uppercase tracking-wider">
                          UI System Alert Boundary
                        </div>
                        
                        <div className="flex items-start gap-4 pt-2">
                          <div className="bg-rose-500/20 text-rose-500 p-3 rounded-full shrink-0">
                            <AlertTriangle className="w-7 h-7" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h4 className="text-sm font-black text-rose-500">
                                {simulatedException.category} Exception Blocked
                              </h4>
                              <span className="bg-rose-950 text-rose-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-rose-800">
                                Severity: {simulatedException.severity.toUpperCase()}
                              </span>
                            </div>

                            {/* Dual Translation Display */}
                            <div className="space-y-1 pb-3 border-b border-slate-200/50 dark:border-slate-800/80">
                              <p className="text-xs text-slate-800 dark:text-slate-100 font-extrabold leading-relaxed">
                                {simulatedException.messageAr}
                              </p>
                              <p className="text-xs text-slate-500 italic font-medium leading-relaxed text-left" dir="ltr">
                                {simulatedException.messageEn}
                              </p>
                            </div>

                            {/* Localized Recovery Recommendation Area */}
                            <div className="space-y-1.5 pt-1.5 bg-transparent dark:bg-slate-950/45 p-3.5 border border-slate-150 dark:border-slate-850">
                              <div className="text-slate-400 text-[10px] font-extrabold flex items-center gap-1">
                                <Wrench className="w-3.5 h-3.5 text-rose-500" />
                                <span>إجراء الاسترداد المعتمد والمقترح (Actionable Remedy):</span>
                              </div>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {simulatedException.recoveryRecommendationAr}
                              </p>
                              <p className="text-[11px] text-slate-500 italic text-left" dir="ltr">
                                {simulatedException.recoveryRecommendationEn}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Telemetry Footer */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 border-t border-slate-200/50 dark:border-slate-800/80 text-[10px] font-mono text-slate-500">
                          <div>
                            <span className="text-slate-400 font-bold block mb-0.5">Correlation ID:</span>
                            <span className="text-slate-800 dark:text-slate-300 font-extrabold">{simulatedException.correlationId}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block mb-0.5">Tenant Organization:</span>
                            <span className="text-slate-800 dark:text-slate-300 font-extrabold">{simulatedException.tenantId}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block mb-0.5">User Identity:</span>
                            <span className="text-slate-800 dark:text-slate-300 font-extrabold">{simulatedException.userId}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block mb-0.5">Module Layer:</span>
                            <span className="text-slate-800 dark:text-slate-300 font-extrabold">{simulatedException.module}</span>
                          </div>
                        </div>
                      </div>

                      {/* Structured JSON Output representation */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Code2 className="w-4 h-4 text-rose-500" />
                            <span>مخرجات هيكلية الاستثناء المتسلسلة (Serialized Exception JSON Payload)</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">ENFORCED DIRECTIVE #019</span>
                        </div>
                        
                        <pre className="p-4 bg-slate-950 text-amber-300 border border-slate-800 text-xs font-mono overflow-x-auto leading-relaxed text-left" dir="ltr">
                          {JSON.stringify(simulatedException.toJSON(), null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-64 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-3">
                      <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 animate-pulse" />
                      <div className="text-center">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-300">في انتظار إطلاق سيناريو المحاكاة</p>
                        <p className="text-[10px] text-slate-500 mt-1">اختر صنفاً من اليمين ثم انقر فوق "إطلاق الاستثناء" لمعاينة حماية الأمان الموحدة.</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Live telemetry logger panel */}
              <div className="bg-slate-950 rounded-3xl border border-slate-900 p-5 space-y-3 font-mono">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">Exception Telemetry Stream</span>
                  </div>
                  <span className="text-[9px] text-slate-600">SYSTEM STACK ACTIVE</span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} className="text-[11px] text-slate-300 leading-relaxed text-left">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: AUTOMATED CODE REPAIR SCANNER */}
        {activeTab === 'repair' && (
          <div className="lg:col-span-12 space-y-6">
            <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6 shadow-sm">
              
              {/* Explanation Banner */}
              <div className="bg-rose-500/10 border border-rose-500/20 p-5 flex items-start gap-4">
                <Wrench className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-rose-500">حظر مكررات الأكواد الصامتة والأخطاء غامضة المصدر تلقائياً</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    يبحث هذا الفاحص الذكي في الأنماط البرمجية للمشروع عن try-catch blocks التي تقوم بابتلاع الأخطاء، أو كتل catch الصامتة التي تكتفي بالطباعة في الكونسول دون تتبع، أو رمي استثناءات مجهولة دون تفويض. وبكبسة زر واحدة، يقوم المحرك بترميز وتصحيح هذه المواضع وتوليد استدعاءات موحدة فورا.
                  </p>
                </div>
              </div>

              {/* Selector for unsafe code scenarios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {UNSAFE_SNIPPETS.map((snippet) => {
                  const isSelected = selectedSnippetId === snippet.id;
                  return (
                    <button
                      key={snippet.id}
                      onClick={() => {
                        setSelectedSnippetId(snippet.id);
                        setRepairedSuccessfully(false);
                      }}
                      className={`text-right p-4 border transition-all cursor-pointer flex flex-col gap-2 ${
                        isSelected 
                          ? 'bg-rose-50/75 dark:bg-rose-950/20 border-rose-500 ring-2 ring-rose-500/10' 
                          : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-950/20'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <ZapOff className="w-3.5 h-3.5 text-rose-500" />
                        <span>{snippet.nameAr}</span>
                      </span>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {snippet.flawDescriptionAr}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Split Screen Diff view */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-150 dark:border-slate-800">
                
                {/* Left Side: Unsafe Non-Compliant Code */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-rose-500 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>الكود الأصلي غير الآمن (Unsafe Try-Catch Flaw)</span>
                    </span>
                    <span className="bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] px-2.5 py-0.5 rounded-full font-black border border-rose-250">
                      معايير غير ممتثلة
                    </span>
                  </div>

                  <pre className="p-4 bg-slate-950 text-rose-350 border border-rose-950/55 text-xs font-mono overflow-x-auto h-72 text-left leading-relaxed" dir="ltr">
                    {activeSnippet.unsafeCode}
                  </pre>

                  {/* Identified Flaws List */}
                  <div className="bg-rose-50 dark:bg-rose-950/25 p-4 border border-rose-150 dark:border-rose-850/80 space-y-2">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">
                      المخالفات المرصودة للقرصنة وتعديل البيانات:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeSnippet.detectedIssues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                          <span className="text-rose-500 shrink-0 font-bold">•</span>
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Repaired Enterprise Code */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-emerald-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>الكود الموحد بعد الإصلاح (Enterprise Pattern)</span>
                    </span>
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-black border border-emerald-250">
                      متوافق 100% مع Directive #019
                    </span>
                  </div>

                  <div className="relative">
                    <pre className="p-4 bg-slate-950 text-emerald-350 border border-emerald-950/55 text-xs font-mono overflow-x-auto h-72 text-left leading-relaxed" dir="ltr">
                      {repairedSuccessfully ? activeSnippet.safeCode : `/* انقر على "تنفيذ الإصلاح والترميم" بالأسفل لتنفيذ تصحيح الأكواد الصامتة */`}
                    </pre>
                    
                    {!repairedSuccessfully && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
                        <button
                          onClick={handleRepairSnippet}
                          disabled={isRepairing}
                          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 text-xs font-black shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
                        >
                          {isRepairing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Wrench className="w-4 h-4 text-white" />
                          )}
                          <span>تنفيذ الفحص وتطهير الكود المختار 🛠️</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Safe safeguards characteristics */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/25 p-4 border border-emerald-150 dark:border-emerald-850/80 space-y-2">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider block">
                      التحسينات المترتبة على استخدام الكود المصحح:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                      <div className="flex items-start gap-1.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>ربط فوري بمعرف ارتباط فريد للحدث (Correlation ID).</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>ترجمة ثنائية فورية لرسالة الخطأ للمستفيد النهائي.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>حقن فوري لهوية المؤسسة (Tenant Context Isolation).</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>الاحتفاظ بالـ stack trace الأصلي لمنع تعتيم التتبع.</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 3: CENTRALIZED ERROR CATALOG */}
        {activeTab === 'catalog' && (
          <div className="lg:col-span-12 space-y-6">
            <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6 shadow-sm">
              
              {/* Header and Controls */}
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-150 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white">الدليل والقاموس المركزي لرموز الأخطاء</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    فهرس مرجعي موحد لكافة الأخطاء المعتمدة في النظام، مع توصيات إصلاح صارمة لحوكمة العمليات.
                  </p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Filter */}
                  <select
                    value={catalogCategoryFilter}
                    onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                    className="bg-transparent dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs font-extrabold p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500 text-right cursor-pointer"
                  >
                    <option value="All">كل الفئات الهيكلية</option>
                    <option value="Business">Business (الأعمال)</option>
                    <option value="Validation">Validation (المدخلات)</option>
                    <option value="Security">Security (الأمان)</option>
                    <option value="Infrastructure">Infrastructure (البنية التحتية)</option>
                    <option value="Database">Database (قاعدة البيانات)</option>
                    <option value="Concurrency">Concurrency (التزامن)</option>
                    <option value="Integration">Integration (الربط المتقاطع)</option>
                  </select>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ابحث بالرمز، الاسم، الفئة أو القسم..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="bg-transparent dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs p-2.5 pr-9 w-64 focus:outline-none focus:ring-2 focus:ring-rose-500 text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Grid List of errors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCatalog.length > 0 ? (
                  filteredCatalog.map((err) => {
                    const badgeColor = {
                      'Business': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-150',
                      'Validation': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-150',
                      'Security': 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-150',
                      'Infrastructure': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-150',
                      'Database': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-150',
                      'Concurrency': 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-150',
                      'Integration': 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-150',
                      'Unexpected': 'bg-transparent text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-150'
                    }[err.category];

                    return (
                      <div 
                        key={err.code}
                        className="bg-transparent dark:bg-slate-950/40 p-5 border border-slate-150 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 transition-all space-y-4"
                      >
                        {/* Header card info */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                              {err.code}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-2">
                              {err.nameAr}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {err.nameEn}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase ${badgeColor}`}>
                              {err.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold dark:bg-slate-900 px-2 py-0.5 rounded-md dark:border-slate-800">
                              {err.module}
                            </span>
                          </div>
                        </div>

                        {/* Error Message translations */}
                        <div className="space-y-1.5 p-3 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/60">
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                            {err.messageAr}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed text-left italic" dir="ltr">
                            {err.messageEn}
                          </p>
                        </div>

                        {/* Actionable remedy */}
                        <div className="space-y-1 pt-1 border-t border-slate-150 dark:border-slate-800">
                          <span className="text-[10px] font-extrabold text-slate-400 block mb-1">توصية الإصلاح والتعافي (Recovery Action):</span>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-300">
                            {err.remedyAr}
                          </p>
                          <p className="text-[11px] text-slate-500 text-left italic" dir="ltr">
                            {err.remedyEn}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 h-48 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    <span className="text-xs font-black">لا توجد رموز أخطاء تطابق تصفية البحث الحالي</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: COMPLIANCE REPORT */}
        {activeTab === 'report' && (
          <div className="lg:col-span-12 space-y-6">
            
            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Pie chart of Severity */}
              <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">توزيع الاستثناءات بحسب مستوى الخطورة والنوع</h3>
                  <p className="text-xs text-slate-500 mt-1">توزيع كلاسات الأخطاء الموحدة ومستويات الخطر المصنفة أمنياً لمنع الاختراقات.</p>
                </div>

                <div className="h-64 flex flex-col md:flex-row items-center justify-around gap-4">
                  <div className="w-full md:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {severityChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2.5 w-full md:w-1/2">
                    {severityChartData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-transparent dark:bg-slate-950 p-2 border border-slate-150 dark:border-slate-850">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="font-extrabold text-slate-800 dark:text-slate-300">{item.name}</span>
                        </div>
                        <span className="font-mono text-slate-500 font-bold">({item.value} رمز خطأ)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compliance Line Chart */}
              <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">مسار التحسن في حماية ومرونة الأنظمة (Resiliency Timeline)</h3>
                  <p className="text-xs text-slate-500 mt-1">منحنى صعود نقاط الامتثال لـ Directive #019 وانخفاض مكررات الأخطاء الصامتة.</p>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={complianceTimelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />
                      <Line 
                        name="نقاط الامتثال والتحمل (Resiliency %)" 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        name="الأكواد الصامتة المكتشفة (Silent Catch)" 
                        type="monotone" 
                        dataKey="failures" 
                        stroke="#f43f5e" 
                        strokeWidth={2} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Directive Requirements Report */}
            <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6 shadow-sm">
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">وثيقة وتقرير مطابقة معمارية معالجة واستبعاد الاستثناءات الكلية</h3>
                <p className="text-xs text-slate-500 mt-1">مراجعة معايير التطابق الهيكلي وحظر ابتلاع الأخطاء الصادرة عن الفروع والمقاصة المالية.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <div className="bg-transparent dark:bg-slate-950/40 p-5 border border-slate-150 dark:border-slate-850 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-500 font-extrabold text-sm border-b border-slate-200 dark:border-slate-800 pb-2">
                    <CheckSquare className="w-5 h-5 shrink-0" />
                    <span>الكشف التلقائي عن صموت النظام</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    يمنع الإطار وجود كتل catch فارغة تماماً. كل catch يتم تحويلها تلقائياً لرمي استثناء مخصص يظهر في الإشعار العلوي ويسمح بالاستعادة.
                  </p>
                </div>

                <div className="bg-transparent dark:bg-slate-950/40 p-5 border border-slate-150 dark:border-slate-850 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-500 font-extrabold text-sm border-b border-slate-200 dark:border-slate-800 pb-2">
                    <CheckSquare className="w-5 h-5 shrink-0" />
                    <span>منع تعتيم تفاصيل التتبع (Swallowing)</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    يتم الحفاظ على الخطأ الأصلي كاملاً (Original Error / Stack Trace) عبر حقنه كعضو في الكائن الاستثنائي، مما يسهل المراجعة والتحليل.
                  </p>
                </div>

                <div className="bg-transparent dark:bg-slate-950/40 p-5 border border-slate-150 dark:border-slate-850 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-500 font-extrabold text-sm border-b border-slate-200 dark:border-slate-800 pb-2">
                    <CheckSquare className="w-5 h-5 shrink-0" />
                    <span>مفاتيح التتبع الإلزامية (Telemetry)</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    يفرض الإطار وجود حقول (Correlation ID, Tenant context, User ID, module, operation) في كائن البيانات لإتمام الفرز والتدقيق.
                  </p>
                </div>

                <div className="bg-transparent dark:bg-slate-950/40 p-5 border border-slate-150 dark:border-slate-850 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-500 font-extrabold text-sm border-b border-slate-200 dark:border-slate-800 pb-2">
                    <CheckSquare className="w-5 h-5 shrink-0" />
                    <span>توصيات إصلاح ثنائية اللغة</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    يمتلك كل استثناء بالهرم استراتيجية إصلاح واضحة للمستفيد بالعربية والإنجليزية لتلافي التخبط الإداري وتسهيل الدعم التقني.
                  </p>
                </div>

                <div className="bg-transparent dark:bg-slate-950/40 p-5 border border-slate-150 dark:border-slate-850 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-500 font-extrabold text-sm border-b border-slate-200 dark:border-slate-800 pb-2">
                    <CheckSquare className="w-5 h-5 shrink-0" />
                    <span>تفرع الهرم الكلي (Hierarchy Classification)</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    تقسيم الاستثناءات لنطاقات دقيقة كالأعمال (Business)، الحسابات والمطابقة، الأمان والـ Multi-Tenancy، وقفل البيانات المتزامنة.
                  </p>
                </div>

                <div className="bg-transparent dark:bg-slate-950/40 p-5 border border-slate-150 dark:border-slate-850 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-500 font-extrabold text-sm border-b border-slate-200 dark:border-slate-800 pb-2">
                    <CheckSquare className="w-5 h-5 shrink-0" />
                    <span>حماية الأمان الجغرافي للفروع</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    عزل البيانات بالكامل على مستوى الأخطاء الاستثنائية بفرع الصلاحية، ومنع تمرير أي استدعاء عشوائي دون تطابق كامل لمعرف المستأجر.
                  </p>
                </div>

              </div>
              
              {/* Quality Sign-off */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-amber-400" />
                  <div>
                    <h5 className="text-xs font-black text-amber-400">توقيع مطابقة الجودة الاستثنائية للمنتج (EPS Rule Match)</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">تم التحقق آلياً وبشرياً من خلو المشروع من كتل Catch صامتة أو معتمة للبيانات الممتدة.</p>
                  </div>
                </div>
                <div className="text-slate-400 text-xs font-black bg-slate-950 px-4 py-2 border border-slate-800">
                  STATUS: APPROVED BY GOVERNANCE COMMITTEE ✓
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
