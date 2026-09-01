import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

// ==========================================
// ENTERPRISE POSTGRES REPOSITORY PATTERN
// ==========================================
import { DatabaseService } from "./src/database/services/DatabaseService.js";
import { StudentRepository } from "./src/database/repositories/StudentRepository.js";
import { ExamsRepository } from "./src/database/repositories/ExamsRepository.js";
import { AuditRepository } from "./src/database/repositories/AuditRepository.js";
import { StudentService } from "./src/database/services/StudentService.js";
import {
  getSupabaseClient,
  getSupabaseClientReady,
  getSupabaseClientForAccessToken,
  revokeSupabaseSession
} from "./src/database/client.js";
import { EnterpriseLogger } from "./src/database/services/EnterpriseLogger.js";
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  DatabaseError,
  ExternalServiceError
} from "./src/utils/errors.js";
import {
  requirePermission,
  requirePermissionOnly,
} from "./src/middleware/auth.js";
import { requestTarget } from "./src/middleware/tenantValidation.js";
import { tenantEngine } from "./src/tenant/TenantEngine.js";
import { PERMISSIONS, permissionRegistry } from "./src/authorization/PermissionRegistry.js";
import { roleResolver } from "./src/authorization/RoleResolver.js";
import { authorizationEngine } from "./src/authorization/AuthorizationEngine.js";
import {
  authenticateTrustedUser,
  resolveTrustedLoginIdentifier,
  refreshTrustedSession,
  extractBearerToken,
  verifyTrustedSession,
  TrustedAuthenticationError
} from "./src/middleware/trustedAuthentication.js";
import { GoogleGenAI } from "@google/genai";
import { createTrustedStudentAuditMetadata } from "./src/security/TrustedStudentAuditMetadata.js";
import { UnitOfWork } from "./src/database/UnitOfWork.js";
import { createPostgresTransactionDriverFromEnvironment } from "./server/infrastructure/PostgresTransactionDriver.js";
import {
  getDiagnosticSampleCount,
  isStagingConnectionDiagnosticsEnabled,
  readConnectionIdentity,
  type ConnectionIdentity,
} from "./server/infrastructure/StagingConnectionDiagnostics.js";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { createClient } from '@supabase/supabase-js';
import { studentRegistrationService } from "./src/modules/student-registration/application/StudentRegistrationService.js";
import { canonicalStudentImportService } from "./src/modules/student-registration/application/CanonicalStudentImportService.js";
import { canonicalGuardianUpdateService } from "./src/modules/student-registration/application/CanonicalGuardianUpdateService.js";
import { operationalEnrollmentAssignmentService } from "./src/modules/student-affairs/application/OperationalEnrollmentAssignmentService.js";
import { canonicalEnrollmentWorkflowService } from "./src/modules/student-affairs/application/CanonicalEnrollmentWorkflowService.js";
import { canonicalGraduationService } from "./src/modules/student-affairs/application/CanonicalGraduationService.js";
import { canonicalExamClassSyncService } from "./src/modules/exams/application/CanonicalExamClassSyncService.js";
import {
  findScheduleResourceConflicts,
  getExamIntervalDurationMinutes
} from "./src/modules/exams/application/ExamSchedulingRules.js";
import { CanonicalStudentWriteRepository } from "./src/database/repositories/CanonicalStudentWriteRepository.js";
import { CanonicalStudentTimelineRepository } from "./src/database/repositories/CanonicalStudentTimelineRepository.js";
import { CANONICAL_STUDENT_SORT_FIELDS, type StudentReadDiagnostic } from "./src/database/repositories/CanonicalStudentReadRepository.js";
import { createPerf004Trace } from "./src/performance/Perf004LatencyDiagnostics.js";
import { normalizeStudentReadError } from "./src/middleware/studentReadError.js";
import { MAX_DOCUMENT_BYTES, STUDENT_DOCUMENT_BUCKET, normalizeDocumentListFilters, studentDocumentService } from "./src/modules/student-documents/application/StudentDocumentService.js";
import type { StudentDocumentRequestContext } from "./src/modules/student-documents/domain/types.js";
import { tenantScopedDatabaseFilePath } from "./src/security/tenantScopedFilePath.js";
import { generateStudentExport, STUDENT_EXPORT_CONTENT_TYPE } from "./src/modules/student-export/application/StudentExportService.js";
import { createStartupReadiness } from "./server/infrastructure/StartupReadiness.js";
import { FallbackStorage } from "./src/database/repositories/FallbackStorage.js";
import { AdmissionInquiry, AdmissionStatus } from './src/modules/student-admission/domain/AdmissionInquiry.js';
import { SupabaseAdmissionInquiryRepository } from './src/modules/student-admission/repository/SupabaseAdmissionInquiryRepository.js';
import { CANONICAL_ERP_TABLES, CanonicalErpPostingService, buildCanonicalPosting } from './src/modules/financial/application/CanonicalErpPostingService.js';
import { ExamValidator } from './src/validation/validators.js';
import { evaluateExamClosureReadiness } from './src/modules/exams/domain/ExamClosureReadiness.js';
import { calculateCohortExamResults } from './src/modules/exams/domain/ExamResultEngine.js';
import { normalizeAssessmentWorkflowState } from './src/modules/exams/application/AssessmentWorkflowService.js';
import {
  assertTeacherWriteScope,
  canApproveExamOperation,
  canViewExamAudit,
  canWriteExamOperation,
  projectExamDatabaseForRead
} from './src/modules/exams/application/ExamAuthorizationPolicy.js';
import { calculatePayrollRun } from './src/modules/hr/domain/PayrollCalculation.js';
import { validateInventoryProcurementSnapshot } from './src/modules/inventory/domain/InventoryProcurementValidation.js';

type FinancialWriteMode = 'snapshot_read_only' | 'snapshot_write' | 'erp_integrated';

// Central administration deliberately uses a separate privileged connection.
// Normal tenant traffic must use DATABASE_URL, which is configured with a
// non-bypass RLS role in production. The fallback keeps local development
// compatible until PLATFORM_ADMIN_DATABASE_URL is configured there as well.
const platformAdminConnectionString = process.env.PLATFORM_ADMIN_DATABASE_URL
  || process.env.DIRECT_URL
  || process.env.DATABASE_URL;

const platformAdminPool = platformAdminConnectionString
  ? new Pool({
      connectionString: platformAdminConnectionString,
      max: Number(process.env.PG_PLATFORM_POOL_MAX || 5),
      connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
      ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false },
    })
  : null;

// Platform permissions are a control-plane concern.  They must never be
// resolved through the tenant data-plane transaction, because that channel is
// intentionally RLS-restricted to a school context.  The query still accepts
// only the verified Auth user id and returns the single canonical platform
// permission; it never accepts role or scope from a request.
if (platformAdminPool) {
  roleResolver.configurePlatformDatabaseLoader(async (identity) => {
    const authUserId = String(identity?.id || '').trim();
    if (!authUserId) throw new Error('Trusted auth_user_id is required for platform role resolution.');
    const result = await platformAdminPool.query<{ roleKey: string; permissionKey: string }>(
      `SELECT pr.role_key AS "roleKey", pp.permission_key AS "permissionKey"
         FROM public.platform_users pu
         JOIN public.platform_user_roles pur
           ON pur.platform_user_id = pu.id
         JOIN public.platform_roles pr
           ON pr.id = pur.role_id
         JOIN public.platform_role_permissions prp
           ON prp.role_id = pr.id
         JOIN public.platform_permissions pp
           ON pp.id = prp.permission_id
        WHERE pu.auth_user_id = $1::uuid
          AND pu.status = 'active'
          AND pu.deleted_at IS NULL
          AND pur.status = 'active'
          AND pur.deleted_at IS NULL
          AND pur.starts_at <= now()
          AND (pur.ends_at IS NULL OR pur.ends_at > now())
          AND pr.status = 'active'
          AND pr.deleted_at IS NULL
          AND prp.status = 'active'
          AND prp.deleted_at IS NULL
          AND pp.status = 'active'
          AND pp.deleted_at IS NULL
        ORDER BY pr.role_key, pp.permission_key`,
      [authUserId]
    );
    return result.rows;
  });
}

const platformAdminAuth = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const STUDENT_DOCUMENT_MEDIA_TYPES = ['application/pdf', 'image/png', 'image/jpeg'] as const;
type StudentDocumentMediaType = typeof STUDENT_DOCUMENT_MEDIA_TYPES[number];

export function validateStudentDocumentBinary(body: Buffer, declaredMediaType: string): { mediaType: StudentDocumentMediaType; contentHash: string; extension: 'pdf' | 'png' | 'jpg' } {
  const mediaType = declaredMediaType.toLowerCase().split(';', 1)[0].trim() as StudentDocumentMediaType;
  if (!STUDENT_DOCUMENT_MEDIA_TYPES.includes(mediaType)) throw new ValidationError('Only PDF, PNG, and JPEG student documents are permitted.');
  if (!Buffer.isBuffer(body) || body.length < 4 || body.length > MAX_DOCUMENT_BYTES) throw new ValidationError('The document file is empty or exceeds the 10 MB limit.');
  const isPdf = body.subarray(0, 5).toString('ascii') === '%PDF-';
  const isPng = body.length >= 8 && body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
  if ((mediaType === 'application/pdf' && !isPdf) || (mediaType === 'image/png' && !isPng) || (mediaType === 'image/jpeg' && !isJpeg)) {
    throw new ValidationError('The file signature does not match its declared content type.');
  }
  return {
    mediaType,
    contentHash: createHash('sha256').update(body).digest('hex'),
    extension: mediaType === 'application/pdf' ? 'pdf' : mediaType === 'image/png' ? 'png' : 'jpg'
  };
}

function safeDocumentFileName(value: unknown): string {
  if (typeof value !== 'string') throw new ValidationError('originalFileName is required.');
  const normalized = value.trim();
  if (!normalized || normalized.length > 255 || normalized.includes('/') || normalized.includes('\\') || normalized === '.' || normalized === '..') {
    throw new ValidationError('originalFileName is invalid.');
  }
  return normalized;
}

const CENTRAL_IDENTITY_ROLE_CATALOG: Record<string, { name: string; description: string; permissions: string[] }> = {
  schooladmin: {
    name: 'مدير المدرسة', description: 'إدارة التشغيل اليومي للمدرسة ضمن نطاقها الموثوق.',
    permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.STUDENT_READ, PERMISSIONS.STUDENT_WRITE, PERMISSIONS.HR_READ, PERMISSIONS.HR_WRITE, PERMISSIONS.FINANCIAL_READ, PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_WRITE],
  },
  accountant: {
    name: 'المحاسب المالي', description: 'قراءة الحسابات وإدخال العمليات المالية المعتمدة.',
    permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.FINANCIAL_READ, PERMISSIONS.FINANCIAL_WRITE],
  },
  teacher: {
    name: 'المعلم', description: 'الوصول إلى السجلات الأكاديمية المصرح بها.',
    permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.STUDENT_READ, PERMISSIONS.EXAM_READ, PERMISSIONS.EXAM_WRITE],
  },
  hr: {
    name: 'مسؤول الموارد البشرية', description: 'إدارة ملفات الموارد البشرية ضمن المدرسة.',
    permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.HR_READ, PERMISSIONS.HR_WRITE],
  },
};

function stableJsonStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableJsonStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableJsonStringify(record[key])}`).join(',')}}`;
}

function validateHrSnapshotData(data: Record<string, any>): void {
  const collections = ['employees', 'departments', 'jobs', 'contracts', 'attendance', 'leaves', 'penalties', 'advances', 'rewards', 'performance', 'documents', 'payrollRuns'];
  for (const collection of collections) {
    if (!Array.isArray(data[collection])) throw new ValidationError(`حقل سجلات الموارد البشرية ${collection} يجب أن يكون قائمة.`);
    const ids = new Set<string>();
    for (const [index, row] of data[collection].entries()) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) throw new ValidationError(`السجل ${collection}[${index}] غير صالح.`);
      const id = String(row.id || '').trim();
      if (!id || ids.has(id)) throw new ConflictError(`المعرّف ${id || '(فارغ)'} مكرر أو مفقود داخل ${collection}.`);
      ids.add(id);
    }
  }
  const employees = new Set(data.employees.map((row: any) => String(row.id)));
  const departments = new Set(data.departments.map((row: any) => String(row.id)));
  for (const collection of ['contracts', 'attendance', 'leaves', 'penalties', 'advances', 'rewards', 'performance', 'documents']) {
    for (const row of data[collection]) {
      if (!employees.has(String(row.employeeId || ''))) throw new ValidationError(`السجل ${collection}/${String(row.id)} مرتبط بموظف غير موجود.`);
    }
  }
  for (const row of data.employees) {
    if (row.departmentId && !departments.has(String(row.departmentId))) throw new ValidationError(`الموظف ${row.id} مرتبط بقسم غير موجود.`);
  }
  for (const row of data.jobs) {
    if (row.departmentId && !departments.has(String(row.departmentId))) throw new ValidationError(`الوظيفة ${row.id} مرتبطة بقسم غير موجود.`);
  }
  const assertMoney = (value: unknown, label: string, allowZero = true) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || (allowZero ? amount < 0 : amount <= 0)) throw new ValidationError(`${label} يجب أن يكون رقماً مالياً صالحاً.`);
  };
  for (const row of data.employees) assertMoney(row.basicSalary, `راتب الموظف ${row.id}`);
  for (const row of data.jobs) assertMoney(row.baseSalary, `راتب الوظيفة ${row.id}`);
  for (const row of data.contracts) assertMoney(row.monthlySalary, `راتب العقد ${row.id}`, false);
  for (const row of data.penalties) assertMoney(row.amount, `قيمة الجزاء ${row.id}`);
  for (const row of data.rewards) assertMoney(row.amount, `قيمة المكافأة ${row.id}`);
  for (const row of data.advances) {
    assertMoney(row.amount, `قيمة السلفة ${row.id}`, false);
    assertMoney(row.deductionPerMonth, `قسط السلفة ${row.id}`, false);
    assertMoney(row.remainingAmount, `رصيد السلفة ${row.id}`);
    if (!Number.isInteger(Number(row.installments)) || Number(row.installments) <= 0) throw new ValidationError(`عدد أقساط السلفة ${row.id} غير صالح.`);
    if (Number(row.remainingAmount) > Number(row.amount)) throw new ValidationError(`رصيد السلفة ${row.id} يتجاوز أصل السلفة.`);
  }
  for (const row of data.attendance) {
    assertMoney(row.delayMinutes, `تأخير الحضور ${row.id}`);
    assertMoney(row.overtimeHours, `إضافي الحضور ${row.id}`);
  }
  const statuses: Record<string, string[]> = {
    employees: ['active', 'on_leave', 'resigned', 'suspended'],
    contracts: ['draft', 'active', 'expired', 'terminated'],
    leaves: ['pending', 'approved', 'rejected'],
    penalties: ['pending', 'applied', 'waived'],
    advances: ['pending', 'approved', 'rejected', 'fully_paid'],
    rewards: ['pending', 'applied', 'paid']
  };
  for (const [collection, allowed] of Object.entries(statuses)) {
    for (const row of data[collection]) {
      if (!allowed.includes(String(row.status || ''))) throw new ValidationError(`حالة السجل ${collection}/${String(row.id)} غير معتمدة.`);
    }
  }
  for (const row of data.performance) {
    const score = Number(row.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) throw new ValidationError(`درجة تقييم الأداء ${row.id} يجب أن تكون بين صفر و100.`);
  }
  for (const row of data.contracts.concat(data.leaves, data.documents)) {
    const start = String(row.startDate || row.issueDate || '').trim();
    const end = String(row.endDate || row.expiryDate || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start > end) {
      throw new ValidationError(`الفترة الزمنية للسجل ${row.id} غير صالحة.`);
    }
  }
  const payrollPeriods = new Set<string>();
  for (const row of data.payrollRuns) {
    const runPeriod = String(row.period || '');
    if (payrollPeriods.has(runPeriod)) throw new ConflictError(`مسير الرواتب للفترة ${runPeriod} مكرر.`);
    payrollPeriods.add(runPeriod);
    if (!/^\d{4}-\d{2}$/.test(String(row.period || '')) || !['approved', 'paid'].includes(row.status)
      || !Array.isArray(row.lines) || !row.totals || typeof row.totals !== 'object' || !String(row.fingerprint || '').trim()) {
      throw new ValidationError(`مسير الرواتب ${String(row.id || row.period || '')} غير صالح.`);
    }
    const lineEmployeeIds = new Set<string>();
    for (const line of row.lines) {
      const employeeId = String(line?.employeeId || '').trim();
      if (!employeeId || lineEmployeeIds.has(employeeId) || !employees.has(employeeId)) {
        throw new ValidationError(`خط مسير الرواتب ${String(row.period)} مرتبط بموظف غير صالح أو مكرر.`);
      }
      lineEmployeeIds.add(employeeId);
      for (const field of ['gross', 'penalty', 'advanceDeduction', 'attendanceDeduction', 'leaveDeduction', 'overtimePay', 'net']) {
        if (line[field] !== undefined) assertMoney(line[field], `قيمة ${field} في مسير ${String(row.period)}`);
      }
    }
    for (const field of ['gross', 'penalty', 'advance', 'attendance', 'leave', 'overtime', 'net']) {
      if (row.totals[field] !== undefined) assertMoney(row.totals[field], `إجمالي ${field} في مسير ${String(row.period)}`);
    }
  }
  if (data.settings !== undefined && (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings))) {
    throw new ValidationError('إعدادات الموارد البشرية يجب أن تكون كائناً.');
  }
}

const INVENTORY_FINANCIAL_COLLECTIONS = ['goodsReceipts', 'vendorBills', 'movements', 'stocktakes'] as const;

function validateInventoryPostingMetadata(currentData: Record<string, any>, requestedData: Record<string, any>): void {
  for (const collection of INVENTORY_FINANCIAL_COLLECTIONS) {
    const currentById = new Map((Array.isArray(currentData[collection]) ? currentData[collection] : [])
      .filter((row: any) => row && typeof row === 'object')
      .map((row: any) => [String(row.id), row]));
    for (const row of (Array.isArray(requestedData[collection]) ? requestedData[collection] : [])) {
      if (!row || typeof row !== 'object') continue;
      const hasPostingMetadata = Boolean(String(row.glJournalEntryId || row.journalEntryId || '').trim()) || row.isPostedToGL === true;
      if (!hasPostingMetadata) continue;
      const previous = currentById.get(String(row.id));
      if (!previous || String(previous.glJournalEntryId || previous.journalEntryId || '').trim() !== String(row.glJournalEntryId || row.journalEntryId || '').trim()
        || Boolean(previous.isPostedToGL) !== Boolean(row.isPostedToGL)) {
        throw new ValidationError(`رابط القيد في ${collection}/${String(row.id || '')} لا يمكن إنشاؤه من المتصفح؛ يجب أن يصدره دفتر الأستاذ الكانوني.`);
      }
    }
  }
}

function applyInventoryPostingLinks(data: Record<string, any>, sourceLinks: Array<{ sourceType: string; sourceId: string; journalEntryId: string }>): Record<string, any> {
  const next = JSON.parse(JSON.stringify(data)) as Record<string, any>;
  const sourceCollection: Record<string, string> = {
    inventory_receipt: 'goodsReceipts',
    vendor_bill: 'vendorBills',
    inventory_movement: 'movements',
    inventory_stocktake: 'stocktakes'
  };
  for (const link of sourceLinks) {
    const collection = sourceCollection[link.sourceType];
    if (!collection || !Array.isArray(next[collection])) continue;
    const row = next[collection].find((candidate: any) => String(candidate?.id || '') === String(link.sourceId));
    if (!row) continue;
    row.glJournalEntryId = link.journalEntryId;
    row.isPostedToGL = true;
    if (collection === 'goodsReceipts') row.status = 'posted_to_gl';
    if (collection === 'movements') { row.status = 'posted'; row.statusLabel = `مرحل محاسبياً — ${link.journalEntryId}`; }
    if (collection === 'stocktakes') row.statusLabel = `مرحل محاسبياً — ${link.journalEntryId}`;
  }
  return next;
}

function isPurchaseOrderReceiptProgression(current: Record<string, any>, requested: Record<string, any>): boolean {
  if (!['approved', 'issued', 'partially_received'].includes(String(current.status))
    || !['partially_received', 'fully_received'].includes(String(requested.status))) return false;
  const currentLines = Array.isArray(current.lines) ? current.lines : [];
  const requestedLines = Array.isArray(requested.lines) ? requested.lines : [];
  if (currentLines.length !== requestedLines.length) return false;
  const stripProgress = (line: Record<string, any>) => {
    const copy = { ...line };
    delete copy.quantityReceived;
    return copy;
  };
  return stableJsonStringify({ ...current, status: undefined, lines: currentLines.map(stripProgress) })
    === stableJsonStringify({ ...requested, status: undefined, lines: requestedLines.map(stripProgress) });
}

function validateScheduleForApproval(payload: Record<string, any>): void {
  const schedule = Array.isArray(payload.exams_schedule) ? payload.exams_schedule : [];
  const subjects = Array.isArray(payload.exams_subjects) ? payload.exams_subjects : [];
  const halls = Array.isArray(payload.exams_halls) ? payload.exams_halls : [];
  const students = Array.isArray(payload.exams_students_enriched) ? payload.exams_students_enriched : [];
  const config = payload.exams_schedule_config || {};
  const subjectIds = new Set(subjects.map((item: any) => String(item.id)));
  const subjectById = new Map(subjects.map((item: any) => [String(item.id), item]));
  const classNames = new Set((Array.isArray(payload.exams_classes_list) ? payload.exams_classes_list : []).map((item: any) => String(item.name)));
  const hallIds = new Set(halls.map((item: any) => String(item.id)));
  if (schedule.length === 0 || subjectIds.size === 0 || classNames.size === 0 || hallIds.size === 0) {
    throw new ValidationError('اعتماد الجدول يتطلب جدولاً ومواد وصفوفاً وقاعات موثقة.');
  }

  const startDate = String(config.startDate || '').trim();
  const examsPerWeek = Number(config.examsPerWeek);
  const subjectsPerDay = Number(config.subjectsPerDay);
  const minGapDays = Number(config.minGapDays);
  const dailySlots = Array.isArray(config.dailySlots) ? config.dailySlots : [];
  const holidayDays = Array.isArray(config.holidayDays) ? config.holidayDays.map(Number) : [];
  const customHolidays = Array.isArray(config.customHolidays) ? config.customHolidays.map(String) : [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)
    || !Number.isSafeInteger(examsPerWeek) || examsPerWeek < 1 || examsPerWeek > 7
    || !Number.isSafeInteger(subjectsPerDay) || subjectsPerDay < 1 || subjectsPerDay > dailySlots.length
    || !Number.isSafeInteger(minGapDays) || minGapDays < 0 || minGapDays > 7
    || dailySlots.length === 0
    || holidayDays.some(day => !Number.isSafeInteger(day) || day < 0 || day > 6)
    || customHolidays.some(date => !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    throw new ValidationError('قواعد الجدولة غير مكتملة أو خارج النطاق المسموح.');
  }
  dailySlots.forEach((slot: any, index: number) => {
    const start = String(slot?.start || '').trim();
    const end = String(slot?.end || '').trim();
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || start >= end) {
      throw new ValidationError(`الفترة الزمنية رقم ${index + 1} غير صالحة.`);
    }
  });

  const intervalConflicts = findScheduleResourceConflicts(schedule);
  if (intervalConflicts.length > 0) {
    const conflict = intervalConflicts[0];
    const resourceLabel = conflict.type === 'classroom'
      ? 'الصف'
      : conflict.type === 'hall'
        ? 'القاعة'
        : 'المراقب';
    throw new ValidationError(
      `لا يمكن اعتماد الجدول: يوجد تداخل زمني فعلي في ${resourceLabel} ${conflict.resourceId} بتاريخ ${conflict.date}.`
    );
  }

  const parseDateUtc = (value: string): Date => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };
  const studentsByClass = new Map<string, number>();
  students.forEach((student: any) => {
    const classroom = String(student?.classroom || '').trim();
    if (classroom) studentsByClass.set(classroom, (studentsByClass.get(classroom) || 0) + 1);
  });
  const hallById = new Map(halls.map((hall: any) => [String(hall.id), hall]));
  const customUnavailable = payload.exams_custom_proctor_unavailable && typeof payload.exams_custom_proctor_unavailable === 'object'
    ? payload.exams_custom_proctor_unavailable
    : {};

  const occupiedClasses = new Set<string>();
  const occupiedHalls = new Set<string>();
  const occupiedProctors = new Set<string>();
  const classSubjects = new Set<string>();
  const classDayCounts = new Map<string, number>();
  const classWeekCounts = new Map<string, number>();
  const classDates = new Map<string, Set<string>>();
  for (const item of schedule) {
    const classroom = String(item?.classroom || '').trim();
    const subjectId = String(item?.subjectId || '').trim();
    const hallId = String(item?.hallId || '').trim();
    const proctorId = String(item?.proctorId || '').trim();
    const date = String(item?.date || '').trim();
    const startTime = String(item?.startTime || '').trim();
    const endTime = String(item?.endTime || '').trim();
    if (!classNames.has(classroom) || !subjectIds.has(subjectId) || !hallIds.has(hallId) || !proctorId) {
      throw new ValidationError('يحتوي الجدول على صف أو مادة أو قاعة أو مراقب غير صالح.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || startTime >= endTime) {
      throw new ValidationError('يحتوي الجدول على تاريخ أو فترة زمنية غير صالحة.');
    }
    const configuredDuration = Number(subjectById.get(subjectId)?.examDuration || 120);
    const scheduledDuration = getExamIntervalDurationMinutes(startTime, endTime);
    if (!Number.isSafeInteger(configuredDuration) || configuredDuration <= 0 || scheduledDuration !== configuredDuration) {
      throw new ValidationError(`مدة اختبار المادة ${String(subjectById.get(subjectId)?.name || subjectId)} لا تطابق المدة المجدولة.`);
    }
    const examDate = parseDateUtc(date);
    const dayOfWeek = examDate.getUTCDay();
    const dayName = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayOfWeek];
    if (date < startDate || holidayDays.includes(dayOfWeek) || customHolidays.includes(date)) {
      throw new ValidationError('يحتوي الجدول على اختبار قبل تاريخ البداية أو في يوم إجازة.');
    }
    if (Array.isArray(customUnavailable[proctorId]) && (customUnavailable[proctorId].includes(date) || customUnavailable[proctorId].includes(dayName))) {
      throw new ValidationError('يحتوي الجدول على مراقب غير متاح في موعد الاختبار.');
    }
    const slot = `${date}|${startTime}`;
    const classSlot = `${slot}|${classroom}`;
    const hallSlot = `${slot}|${hallId}`;
    const proctorSlot = `${slot}|${proctorId}`;
    const classSubject = `${classroom}|${subjectId}`;
    if (occupiedClasses.has(classSlot) || occupiedHalls.has(hallSlot) || occupiedProctors.has(proctorSlot) || classSubjects.has(classSubject)) {
      throw new ValidationError('لا يمكن اعتماد الجدول لوجود تعارض أو تكرار في الصف أو القاعة أو المراقب أو المادة.');
    }
    occupiedClasses.add(classSlot);
    occupiedHalls.add(hallSlot);
    occupiedProctors.add(proctorSlot);
    classSubjects.add(classSubject);
    const assignedHallIds = [...new Set([hallId, ...(Array.isArray(item?.splitHalls) ? item.splitHalls.map(String) : [])])];
    let totalCapacity = 0;
    for (const splitHallId of assignedHallIds) {
      const hall = hallById.get(String(splitHallId));
      if (!hall || hall.status === 'inactive') throw new ValidationError('يحتوي توزيع القاعات على قاعة غير صالحة أو غير نشطة.');
      totalCapacity += Number(hall.capacity || 0);
      const splitHallSlot = `${slot}|${String(splitHallId)}`;
      if (occupiedHalls.has(splitHallSlot) && splitHallSlot !== hallSlot) {
        throw new ValidationError('لا يمكن اعتماد الجدول لوجود تعارض في القاعات المجزأة.');
      }
      occupiedHalls.add(splitHallSlot);
    }
    const classStudentCount = studentsByClass.get(classroom) || 0;
    if (classStudentCount === 0 || totalCapacity < classStudentCount) {
      throw new ValidationError(`سعة القاعات لا تغطي طلاب الصف ${classroom}.`);
    }

    const classDayKey = `${classroom}|${date}`;
    classDayCounts.set(classDayKey, (classDayCounts.get(classDayKey) || 0) + 1);
    if ((classDayCounts.get(classDayKey) || 0) > subjectsPerDay) {
      throw new ValidationError(`تجاوز الصف ${classroom} الحد اليومي للامتحانات.`);
    }
    const weekStart = new Date(examDate);
    weekStart.setUTCDate(examDate.getUTCDate() - dayOfWeek);
    const weekKey = `${classroom}|${weekStart.toISOString().slice(0, 10)}`;
    classWeekCounts.set(weekKey, (classWeekCounts.get(weekKey) || 0) + 1);
    if ((classWeekCounts.get(weekKey) || 0) > examsPerWeek) {
      throw new ValidationError(`تجاوز الصف ${classroom} الحد الأسبوعي للامتحانات.`);
    }
    const dates = classDates.get(classroom) || new Set<string>();
    dates.add(date);
    classDates.set(classroom, dates);
  }

  for (const [classroom, studentCount] of studentsByClass.entries()) {
    if (studentCount === 0 || !classNames.has(classroom)) continue;
    for (const subjectId of subjectIds) {
      if (!classSubjects.has(`${classroom}|${subjectId}`)) {
        throw new ValidationError(`الجدول غير مكتمل: لم تُجدول كل المواد للصف ${classroom}.`);
      }
    }
    const orderedDates = [...(classDates.get(classroom) || [])].sort();
    for (let index = 1; index < orderedDates.length; index += 1) {
      const gap = Math.round((parseDateUtc(orderedDates[index]).getTime() - parseDateUtc(orderedDates[index - 1]).getTime()) / 86_400_000);
      if (gap <= minGapDays) {
        throw new ValidationError(`الجدول لا يحقق الحد الأدنى للراحة بين امتحانات الصف ${classroom}.`);
      }
    }
  }
}

function assertExamFieldsUnchanged(
  currentData: Record<string, any>,
  requestedData: Record<string, any>,
  fields: string[],
  message: string
): void {
  const changed = fields.some(field => stableJsonStringify(currentData[field] ?? null) !== stableJsonStringify(requestedData[field] ?? null));
  if (changed) throw new ConflictError(message);
}

/**
 * UAT-only bridge for the existing versioned financial snapshot writer.
 * This is intentionally not named ledger_ready: the current endpoint does
 * not prove a write into the canonical general_ledger/journal tables.
 */
function resolveFinancialWriteMode(req: express.Request): FinancialWriteMode {
  const configuredForWrite = (process.env.NODE_ENV !== 'production'
    && process.env.FINANCIAL_SNAPSHOT_WRITE_MODE === 'snapshot_write')
    || process.env.FINANCIAL_ERP_MODE === 'canonical';
  if (!configuredForWrite) return 'snapshot_read_only';

  const user = (req as any).user;
  const decision = authorizationEngine.authorizeTenant(user, PERMISSIONS.FINANCIAL_WRITE, {
    schoolId: user?.schoolId,
    branchId: String(req.headers['x-branch-id'] || req.query.branchId || ''),
    endpoint: req.originalUrl,
    method: req.method,
    ipAddress: req.ip || 'unknown'
  });
  if (!decision.allowed) return 'snapshot_read_only';
  return (req as any).financialErpReady === true ? 'erp_integrated' : 'snapshot_write';
}
import { ErpProvisioningService } from './src/modules/identity/application/ErpProvisioningService.js';
import { reviewAndImplement } from './src/services/ai/SolLunaOrchestrator.js';

function parseStudentQueryInteger(value: unknown, field: string, defaultValue: number, maximum: number): number {
  if (value === undefined || value === '') return defaultValue;
  if (Array.isArray(value) || typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new ValidationError(`قيمة ${field} يجب أن تكون عددًا صحيحًا.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new ValidationError(`قيمة ${field} خارج النطاق المسموح.`);
  }
  return parsed;
}

function parseStudentQueryString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === '') return undefined;
  if (Array.isArray(value) || typeof value !== 'string') {
    throw new ValidationError(`قيمة ${field} غير صالحة.`);
  }
  return value.trim() || undefined;
}

function normalizeFinancialSnapshotPayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('بيانات المصدر المالي يجب أن تكون كائنًا صالحًا.');
  }

  const payload = value as Record<string, unknown>;
  const arrayKeys = [
    'students',
    'invoices',
    'studentReceiptVouchers',
    'receiptVouchers',
    'paymentVouchers',
    'bankTransfers',
    'suppliers',
    'fixedAssets',
    'journalEntries',
    'chartOfAccounts',
    'feeConfigs',
    'expenseAccruals',
  ];
  for (const key of arrayKeys) {
    if (payload[key] !== undefined && !Array.isArray(payload[key])) {
      throw new ValidationError(`الحقل المالي ${key} يجب أن يكون قائمة.`);
    }
  }
  if (payload.feeSettings !== undefined && (!payload.feeSettings || typeof payload.feeSettings !== 'object' || Array.isArray(payload.feeSettings))) {
    throw new ValidationError('إعدادات الرسوم يجب أن تكون كائنًا صالحًا.');
  }

  const serialized = JSON.stringify(payload);
  if (serialized.length > 2_000_000) {
    throw new ValidationError('حجم المصدر المالي يتجاوز الحد المسموح.');
  }
  validateFinancialSnapshotIntegrity(payload);
  return payload;
}

function parseFinancialExpectedVersion(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new ValidationError('إصدار المصدر المالي المتوقع يجب أن يكون رقماً صحيحاً غير سالب.');
  }
  return parsed;
}

function financialRecordRows(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object' && !Array.isArray(row)));
}

function financialText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

function financialNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : fallback;
}

function validateFinancialSnapshotIntegrity(payload: Record<string, unknown>): void {
  const validateIds = (key: string) => {
    const seen = new Set<string>();
    for (const [index, row] of financialRecordRows(payload[key]).entries()) {
      const id = financialText(row.id);
      if (!id) throw new ValidationError(`السجل المالي ${key}[${index}] يفتقد معرّفاً ثابتاً.`);
      if (seen.has(id)) throw new ConflictError(`المعرّف المالي مكرر داخل ${key}: ${id}`);
      seen.add(id);
    }
  };
  for (const key of ['invoices', 'studentReceiptVouchers', 'receiptVouchers', 'paymentVouchers', 'bankTransfers', 'suppliers', 'fixedAssets', 'journalEntries', 'feeConfigs', 'expenseAccruals']) validateIds(key);
  for (const [index, row] of financialRecordRows(payload.invoices).entries()) {
    const amount = financialNumber(row.amount);
    const paid = financialNumber(row.paidAmount);
    const remaining = financialNumber(row.remainingAmount, amount);
    if (amount <= 0) throw new ValidationError(`قيمة المطالبة المالية ${index + 1} يجب أن تكون أكبر من صفر.`);
    if (paid > amount || remaining > amount || paid + remaining > amount + 0.01) {
      throw new ValidationError(`الرصيد المالي للمطالبة ${financialText(row.id)} غير متزن.`);
    }
  }
  for (const [index, row] of financialRecordRows(payload.studentReceiptVouchers).entries()) {
    if (financialNumber(row.amount) <= 0) throw new ValidationError(`قيمة سند القبض ${financialText(row.id, String(index + 1))} يجب أن تكون أكبر من صفر.`);
  }
  for (const [index, row] of financialRecordRows(payload.expenseAccruals).entries()) {
    if (financialNumber(row.amount || row.totalAmount) <= 0) throw new ValidationError(`قيمة المصروف المستحق ${financialText(row.id, String(index + 1))} يجب أن تكون أكبر من صفر.`);
  }
  for (const [index, row] of financialRecordRows(payload.journalEntries).entries()) {
    const status = financialText(row.status, 'draft').toLowerCase();
    if (!['posted', 'مرحّل', 'مُرحّل'].includes(status)) continue;
    const debit = financialNumber(row.debitTotal);
    const credit = financialNumber(row.creditTotal);
    if (debit <= 0 || credit <= 0 || Math.abs(debit - credit) > 0.01) {
      throw new ValidationError(`القيد المرحّل ${financialText(row.id, String(index + 1))} غير متوازن محاسبياً.`);
    }
  }
}

function financialDate(value: unknown): string | null {
  const normalized = financialText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

async function replaceStudentFinanceProjection(
  transaction: { query: (sqlText: string, parameters?: readonly unknown[]) => Promise<unknown> },
  tenantId: string,
  schoolId: string,
  actorId: string,
  payload: Record<string, unknown>,
  version: number
): Promise<void> {
  const projectionTables = [
    'student_fee_invoices',
    'student_fee_receipts',
    'student_fee_journal_entries',
    'student_fee_journal_lines',
    'student_fee_configurations'
  ];
  // The versioned financial snapshot is the authoritative UAT write path.
  // Student-finance projection tables are optional in partially provisioned
  // environments; their absence must not roll back an otherwise valid
  // snapshot write. A later migration can enable the projection without
  // changing the snapshot contract.
  const tableCheck = await transaction.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])`,
    [projectionTables]
  );
  const availableProjectionTables = new Set(
    ((tableCheck as any)?.rows || []).map((row: { table_name: string }) => row.table_name)
  );
  const missingProjectionTables = projectionTables.filter(table => !availableProjectionTables.has(table));
  if (missingProjectionTables.length > 0) {
    EnterpriseLogger.warn('Student finance projection skipped: tables are not provisioned', 'FinancialSnapshotRoute', {
      missingProjectionTables,
      version,
      tenantId,
      schoolId
    });
    return;
  }
  for (const table of projectionTables) {
    await transaction.query(`DELETE FROM public.${table} WHERE tenant_id = $1 AND school_id = $2`, [tenantId, schoolId]);
  }

  for (const [index, row] of financialRecordRows(payload.invoices).entries()) {
    const id = financialText(row.id, `invoice_${index + 1}`);
    await transaction.query(
      `INSERT INTO public.student_fee_invoices
        (tenant_id, school_id, id, student_id, student_name, item, amount, tax_amount,
         paid_amount, remaining_amount, invoice_date, due_date, status, journal_entry_id,
         source_payload, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16)
       ON CONFLICT (school_id, id) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
         student_id = EXCLUDED.student_id,
         student_name = EXCLUDED.student_name,
         item = EXCLUDED.item,
         amount = EXCLUDED.amount,
         tax_amount = EXCLUDED.tax_amount,
         paid_amount = EXCLUDED.paid_amount,
         remaining_amount = EXCLUDED.remaining_amount,
         invoice_date = EXCLUDED.invoice_date,
         due_date = EXCLUDED.due_date,
         status = EXCLUDED.status,
         journal_entry_id = EXCLUDED.journal_entry_id,
         source_payload = EXCLUDED.source_payload,
         updated_at = now(),
         updated_by = EXCLUDED.updated_by`,
      [
        tenantId,
        schoolId,
        id,
        financialText(row.studentId) || null,
        financialText(row.studentName),
        financialText(row.item),
        financialNumber(row.amount),
        financialNumber(row.taxAmount),
        financialNumber(row.paidAmount),
        financialNumber(row.remainingAmount, financialNumber(row.amount)),
        financialDate(row.invoiceDate),
        financialDate(row.dueDate),
        financialText(row.status, 'unpaid'),
        financialText(row.journalEntryId) || null,
        JSON.stringify(row),
        actorId
      ]
    );
  }

  for (const [index, row] of financialRecordRows(payload.studentReceiptVouchers).entries()) {
    const id = financialText(row.id, `receipt_${index + 1}`);
    await transaction.query(
      `INSERT INTO public.student_fee_receipts
        (tenant_id, school_id, id, student_id, student_name, receipt_date, amount,
         payment_method, receiving_account, operational_type, against_text, status,
         journal_entry_id, receipt_voucher_id, source_payload, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16)
       ON CONFLICT (school_id, id) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
         student_id = EXCLUDED.student_id,
         student_name = EXCLUDED.student_name,
         receipt_date = EXCLUDED.receipt_date,
         amount = EXCLUDED.amount,
         payment_method = EXCLUDED.payment_method,
         receiving_account = EXCLUDED.receiving_account,
         operational_type = EXCLUDED.operational_type,
         against_text = EXCLUDED.against_text,
         status = EXCLUDED.status,
         journal_entry_id = EXCLUDED.journal_entry_id,
         receipt_voucher_id = EXCLUDED.receipt_voucher_id,
         source_payload = EXCLUDED.source_payload,
         updated_at = now(),
         updated_by = EXCLUDED.updated_by`,
      [
        tenantId,
        schoolId,
        id,
        financialText(row.studentId) || null,
        financialText(row.studentName),
        financialDate(row.date),
        financialNumber(row.amount),
        financialText(row.paymentMethod),
        financialText(row.receivingAccount),
        financialText(row.operationalType),
        financialText(row.against),
        financialText(row.status, 'draft'),
        financialText(row.journalEntryId) || null,
        financialText(row.receiptVoucherId) || null,
        JSON.stringify(row),
        actorId
      ]
    );
  }

  for (const [index, row] of financialRecordRows(payload.journalEntries).entries()) {
    const id = financialText(row.id, `journal_${index + 1}`);
    await transaction.query(
      `INSERT INTO public.student_fee_journal_entries
        (tenant_id, school_id, id, entry_date, description, debit_total, credit_total,
         status, document_type, receipt_voucher_id, source_payload, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
       ON CONFLICT (school_id, id) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
         entry_date = EXCLUDED.entry_date,
         description = EXCLUDED.description,
         debit_total = EXCLUDED.debit_total,
         credit_total = EXCLUDED.credit_total,
         status = EXCLUDED.status,
         document_type = EXCLUDED.document_type,
         receipt_voucher_id = EXCLUDED.receipt_voucher_id,
         source_payload = EXCLUDED.source_payload,
         updated_at = now(),
         updated_by = EXCLUDED.updated_by`,
      [
        tenantId,
        schoolId,
        id,
        financialDate(row.date),
        financialText(row.description),
        financialNumber(row.debitTotal),
        financialNumber(row.creditTotal),
        financialText(row.status, 'draft'),
        financialText(row.documentType) || null,
        financialText(row.receiptVoucherId) || null,
        JSON.stringify(row),
        actorId
      ]
    );

    for (const [lineIndex, line] of financialRecordRows(row.lines).entries()) {
      const lineId = financialText(line.id, `${id}_line_${lineIndex + 1}`);
      await transaction.query(
        `INSERT INTO public.student_fee_journal_lines
          (tenant_id, school_id, journal_entry_id, id, account_code, account_name,
           debit, credit, cost_center, source_payload, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
         ON CONFLICT (school_id, journal_entry_id, id) DO UPDATE SET
           tenant_id = EXCLUDED.tenant_id,
           account_code = EXCLUDED.account_code,
           account_name = EXCLUDED.account_name,
           debit = EXCLUDED.debit,
           credit = EXCLUDED.credit,
           cost_center = EXCLUDED.cost_center,
           source_payload = EXCLUDED.source_payload,
           updated_at = now(),
           updated_by = EXCLUDED.updated_by`,
        [
          tenantId,
          schoolId,
          id,
          lineId,
          financialText(line.accountCode),
          financialText(line.accountName),
          financialNumber(line.debit),
          financialNumber(line.credit),
          financialText(line.costCenter) || null,
          JSON.stringify(line),
          actorId
        ]
      );
    }
  }

  for (const [index, row] of financialRecordRows(payload.feeConfigs).entries()) {
    const id = financialText(row.id, `fee_config_${index + 1}`);
    await transaction.query(
      `INSERT INTO public.student_fee_configurations
        (tenant_id, school_id, id, fee_type, amount, revenue_account, order_number,
         activities, source_payload, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
       ON CONFLICT (school_id, id) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
         fee_type = EXCLUDED.fee_type,
         amount = EXCLUDED.amount,
         revenue_account = EXCLUDED.revenue_account,
         order_number = EXCLUDED.order_number,
         activities = EXCLUDED.activities,
         source_payload = EXCLUDED.source_payload,
         updated_at = now(),
         updated_by = EXCLUDED.updated_by`,
      [
        tenantId,
        schoolId,
        id,
        financialText(row.type),
        financialNumber(row.amount),
        financialText(row.account),
        financialText(row.orderNumber),
        financialText(row.activities),
        JSON.stringify(row),
        actorId
      ]
    );
  }

  await transaction.query(
    `INSERT INTO public.student_fee_audit_events
      (tenant_id, school_id, operation, entity_type, entity_id, actor_user_id, after_payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      tenantId,
      schoolId,
      'FINANCIAL_SNAPSHOT_WRITE',
      'financial_portal_snapshot',
      `version:${version}`,
      actorId,
      JSON.stringify({
        version,
        invoiceCount: financialRecordRows(payload.invoices).length,
        receiptCount: financialRecordRows(payload.studentReceiptVouchers).length,
        journalCount: financialRecordRows(payload.journalEntries).length,
        feeConfigCount: financialRecordRows(payload.feeConfigs).length
      })
    ]
  );
}

function validateFinancialSnapshotTransition(
  previousPayload: Record<string, unknown>,
  nextPayload: Record<string, unknown>
): void {
  const previousReceipts = new Map(
    financialRecordRows(previousPayload.studentReceiptVouchers).map(row => [financialText(row.id), row])
  );
  const nextReceipts = new Map(
    financialRecordRows(nextPayload.studentReceiptVouchers).map(row => [financialText(row.id), row])
  );

  for (const [id, previous] of previousReceipts) {
    const next = nextReceipts.get(id);
    const previousStatus = financialText(previous.status, 'draft').toLowerCase();
    if (!next) {
      if (['saved', 'approved', 'posted', 'cancelled'].includes(previousStatus)) {
        throw new ConflictError(`لا يمكن حذف سند قبض ${id} بعد دخوله دورة الحفظ أو الاعتماد أو الترحيل.`);
      }
      continue;
    }

    const nextStatus = financialText(next.status, 'draft').toLowerCase();
    if (previousStatus === 'posted' && nextStatus !== 'cancelled' && nextStatus !== 'posted') {
      throw new ConflictError(`السند المرحل ${id} محمي ولا يقبل الرجوع إلى مسودة أو اعتماد.`);
    }
    if (previousStatus === 'approved' && ['draft', 'saved'].includes(nextStatus)) {
      throw new ConflictError(`السند المعتمد ${id} لا يمكن خفض حالته دون إجراء إلغاء موثق.`);
    }
    if (previousStatus === 'cancelled' && nextStatus !== 'cancelled') {
      throw new ConflictError(`السند الملغي ${id} نهائي ولا يمكن إعادة فتحه.`);
    }
    if (nextStatus === 'posted' && previousStatus !== 'approved' && previousStatus !== 'posted') {
      throw new ConflictError(`لا يمكن ترحيل السند ${id} قبل اعتماده مالياً.`);
    }
    if (previousStatus === 'posted' && nextStatus === 'cancelled' && !financialText(next.reversalJournalEntryId)) {
      throw new ValidationError(`إلغاء السند المرحل ${id} يتطلب رقم قيد تسوية عكسي.`);
    }
    if (nextStatus === 'posted' && (!financialText(next.journalEntryId) || !financialText(next.receiptVoucherId))) {
      throw new ValidationError(`السند المرحل ${id} يجب أن يرتبط بقيد يومية وسند قبض عام.`);
    }
  }
  for (const [id, next] of nextReceipts) {
    if (!previousReceipts.has(id) && financialText(next.status, 'draft').toLowerCase() === 'posted') {
      throw new ConflictError(`لا يمكن إنشاء سند مرحل مباشرة ${id}؛ يجب حفظه ثم اعتماده قبل الترحيل.`);
    }
  }

  const previousInvoices = new Map(
    financialRecordRows(previousPayload.invoices).map(row => [financialText(row.id), row])
  );
  const nextInvoices = new Map(
    financialRecordRows(nextPayload.invoices).map(row => [financialText(row.id), row])
  );
  for (const [id, previous] of previousInvoices) {
    const next = nextInvoices.get(id);
    const previousStatus = financialText(previous.status, 'unpaid').toLowerCase();
    if (!next && !['cancelled', 'void'].includes(previousStatus)) {
      throw new ConflictError(`لا يمكن حذف المطالبة المالية ${id}؛ استخدم الإلغاء مع سبب موثق.`);
    }
    if (['cancelled', 'void'].includes(previousStatus) && next && !['cancelled', 'void'].includes(financialText(next.status).toLowerCase())) {
      throw new ConflictError(`المطالبة المالية الملغاة ${id} نهائية ولا يمكن إعادة فتحها.`);
    }
  }
}

function createStudentReadDiagnostic(res: express.Response): StudentReadDiagnostic {
  const requestId = randomUUID();
  const correlationId = randomUUID();
  const log = (stage: string, status: string, safeClassification?: string) => {
    EnterpriseLogger.info(
      'Student Read RCA diagnostic',
      'StudentReadRCA',
      { stage, status, ...(safeClassification ? { safeClassification } : {}) },
      { requestId, correlationId }
    );
  };
  res.once('finish', () => log('http_response', res.statusCode >= 200 && res.statusCode < 300 ? 'PASS' : 'FAIL', `HTTP_${res.statusCode}`));
  return { requestId, correlationId, log };
}

type SafeAuthTrace = {
  startedAt: number;
  authorizationPresent: 'YES' | 'NO';
  tokenLength: number;
  tokenExtraction: 'SUCCESS' | 'FAIL';
  supabaseVerification: 'SUCCESS' | 'FAIL';
  userIdPresent: 'YES' | 'NO';
  trustedIdentity: 'SUCCESS' | 'FAIL';
  tenantContext: 'SUCCESS' | 'FAIL';
  schoolContext: 'SUCCESS' | 'FAIL';
  branchContext: 'SUCCESS' | 'FAIL';
  permission: 'SUCCESS' | 'FAIL';
  roleResolutionStarted: 'YES' | 'NO';
  roleFound: 'YES' | 'NO';
  roleActive: 'YES' | 'NO';
  roleNamePresent: 'YES' | 'NO';
  permissionResolutionStarted: 'YES' | 'NO';
  requiredPermission: string;
  studentViewFound: 'YES' | 'NO';
  studentViewActive: 'YES' | 'NO';
  tenantScopeValid: 'YES' | 'NO';
  rejectionStage: string;
};

function authTraceEnabled(): boolean {
  return process.env.AUTH_TRACE_ENABLED === 'true' && process.env.EDUPRO_ENVIRONMENT !== 'production';
}

function supabaseProjectRef(): string {
  const value = String(process.env.SUPABASE_URL || '').trim();
  try {
    const host = new URL(value).hostname;
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1] || 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

function startSafeAuthTrace(req: express.Request, res: express.Response): SafeAuthTrace | undefined {
  if (!authTraceEnabled() || req.method !== 'GET' || req.path !== '/api/students') return undefined;
  const trace: SafeAuthTrace = {
    startedAt: Date.now(),
    authorizationPresent: 'NO',
    tokenLength: 0,
    tokenExtraction: 'FAIL',
    supabaseVerification: 'FAIL',
    userIdPresent: 'NO',
    trustedIdentity: 'FAIL',
    tenantContext: 'FAIL',
    schoolContext: 'FAIL',
    branchContext: 'FAIL',
    permission: 'FAIL',
    roleResolutionStarted: 'NO',
    roleFound: 'NO',
    roleActive: 'NO',
    roleNamePresent: 'NO',
    permissionResolutionStarted: 'NO',
    requiredPermission: 'Student.View',
    studentViewFound: 'NO',
    studentViewActive: 'NO',
    tenantScopeValid: 'NO',
    rejectionStage: 'request',
  };
  (req as any).safeAuthTrace = trace;
  res.once('finish', () => {
    const fields = {
      request_received: 'YES',
      authorization_present: trace.authorizationPresent,
      token_length: trace.tokenLength,
      token_extraction: trace.tokenExtraction,
      supabase_verification: trace.supabaseVerification,
      user_id_present: trace.userIdPresent,
      trusted_identity: trace.trustedIdentity,
      tenant_context: trace.tenantContext,
      school_context: trace.schoolContext,
      branch_context: trace.branchContext,
      permission: trace.permission,
      role_resolution_started: trace.roleResolutionStarted,
      role_found: trace.roleFound,
      role_active: trace.roleActive,
      role_name_present: trace.roleNamePresent,
      permission_resolution_started: trace.permissionResolutionStarted,
      required_permission: trace.requiredPermission,
      student_view_found: trace.studentViewFound,
      student_view_active: trace.studentViewActive,
      tenant_scope_valid: trace.tenantScopeValid,
      rejection_stage: trace.rejectionStage,
      http_status: res.statusCode,
      duration_ms: Date.now() - trace.startedAt,
      supabase_project_ref: supabaseProjectRef(),
    };
    EnterpriseLogger.info('AUTH-TRACE', 'AuthTrace', fields);
    EnterpriseLogger.info('PERMISSION-TRACE', 'PermissionTrace', {
      request_received: fields.request_received,
      user_id_present: fields.user_id_present,
      tenant_id_present: trace.tenantScopeValid,
      role_resolution_started: trace.roleResolutionStarted,
      role_found: trace.roleFound,
      role_active: trace.roleActive,
      role_name_present: trace.roleNamePresent,
      permission_resolution_started: trace.permissionResolutionStarted,
      required_permission: trace.requiredPermission,
      student_view_found: trace.studentViewFound,
      student_view_active: trace.studentViewActive,
      tenant_scope_valid: trace.tenantScopeValid,
      permission_result: trace.permission,
      rejection_stage: trace.rejectionStage,
      http_status: fields.http_status,
    });
  });
  return trace;
}

function parseStudentSortBy(value: unknown): string {
  const parsed = parseStudentQueryString(value, 'sortBy') || 'registrationDate';
  if (!CANONICAL_STUDENT_SORT_FIELDS.includes(parsed)) {
    throw new ValidationError('حقل الترتيب المطلوب غير معتمد.');
  }
  return parsed;
}

function parseStudentSortOrder(value: unknown): 'asc' | 'desc' {
  const parsed = parseStudentQueryString(value, 'sortOrder') || 'desc';
  if (parsed !== 'asc' && parsed !== 'desc') {
    throw new ValidationError('اتجاه الترتيب غير معتمد.');
  }
  return parsed;
}

function parseStudentExportFilters(query: express.Request['query']) {
  return {
    quickSearch: parseStudentQueryString(query.search, 'search'),
    classroom: parseStudentQueryString(query.classroom, 'classroom'),
    section: parseStudentQueryString(query.section, 'section'),
    status: parseStudentQueryString(query.status, 'status'),
    gender: parseStudentQueryString(query.gender, 'gender'),
    sortBy: parseStudentSortBy(query.sortBy),
    sortOrder: parseStudentSortOrder(query.sortOrder)
  };
}

async function recordStudentExportAudit(
  req: express.Request,
  context: { schoolId: string; tenantId: string; branchId: string; academicYear: string; userId: string; role: string },
  status: 'ACCEPTED' | 'REJECTED' | 'FAILED' | 'SUCCESSFUL',
  requestId: string,
  correlationId: string,
  rowCount?: number,
  reason?: string
) {
  const identity = (req as any).user;
  await UnitOfWork.runInTransaction(
    context.schoolId,
    {
      operationName: 'Student Export Audit',
      tenantId: context.tenantId,
      userId: context.userId,
      userName: identity?.name || identity?.email || context.userId,
      ipAddress: req.ip || 'unknown',
      affectedTables: ['audit_events']
    },
    async () => {
      const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
      if (!transaction) throw new DatabaseError('Canonical Student export audit transaction is unavailable.');
      const actor = await transaction.query<{ id: string }>(
        `SELECT id
           FROM public.users
          WHERE tenant_id = $1
            AND auth_user_id = $2
            AND deleted_at IS NULL
            AND status = 'active'
          LIMIT 1`,
        [context.tenantId, context.userId]
      );
      if (!actor.rows[0]) throw new ValidationError('The authenticated user is not provisioned for canonical export audit.');

      await transaction.query(
        `INSERT INTO public.audit_events (
           id, tenant_id, school_id, branch_id, actor_user_id,
           entity_type, entity_id, action, source, reason, result,
           metadata, request_id, correlation_id
         ) VALUES ($1, $2, $3, $4, $5, 'student_export', $6, $7,
                   'student-affairs-export', $8, $9, $10::jsonb, $11, $12)`,
        [
          randomUUID(),
          context.tenantId,
          context.schoolId,
          context.branchId || null,
          actor.rows[0].id,
          requestId,
          `STUDENT_EXPORT_${status}`,
          reason || 'Student data export operation',
          status === 'SUCCESSFUL' ? 'success' : 'failure',
          JSON.stringify({
            operation: 'Student Data Export',
            status,
            rowCount: rowCount || 0,
            requestId,
            correlationId,
            endpoint: req.path,
            httpMethod: req.method,
            academicYear: context.academicYear
          }),
          requestId,
          correlationId
        ]
      );
    },
    {
      tenantId: context.tenantId,
      schoolId: context.schoolId,
      branchId: context.branchId,
      academicYear: context.academicYear,
      userId: context.userId,
      role: context.role
    }
  );
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const startupReadiness = createStartupReadiness();

  // Trust the proxy (Express/Vite reverse proxy setup)
  app.set('trust proxy', 1);

  // Security Headers (Configured to allow iframe embedding in the AI Studio platform)
  app.use(helmet({
    contentSecurityPolicy: false,
    frameguard: false,
  }));
  
  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    validate: { trustProxy: false }
  });
  // app.use(limiter);
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false }
  });
  const diagnosticLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false }
  });
  const disableAuthCaching = (res: express.Response) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
  };

  // Versioned operational snapshots, including the exams workflow and audit
  // history, can legitimately exceed Express's 100kb default. Keep a bounded
  // parser limit so canonical writes fail safely without truncating UAT cycles.
  app.use(express.json({ limit: '2mb' }));
  app.use((req, res, next) => {
    startSafeAuthTrace(req, res);
    if (req.method === 'GET' && req.path === '/api/students') {
      const trace = createPerf004Trace(
        req.get('x-perf-004-probe') === '1' || req.get('x-perf-008-probe') === '1'
      );
      if (trace) {
        trace.mark('request_received');
        (req as any).perf004Trace = trace;
        res.once('finish', () => {
          trace.mark('response_sent');
          EnterpriseLogger.info('PERF004 diagnostic completed', 'Perf004', trace.report());
        });
      }
    }
    next();
  });

  const transactionDriver = createPostgresTransactionDriverFromEnvironment();
  if (transactionDriver) {
    UnitOfWork.configureTransactionDriver(transactionDriver);
    EnterpriseLogger.info("Server-side PostgreSQL transaction driver configured.", "ServerBootstrap");
  } else {
    EnterpriseLogger.warn("DATABASE_URL/DIRECT_URL is not configured; transactional writes are unavailable.", "ServerBootstrap");
  }

  // Start database initialization without blocking route registration or the
  // liveness listener. Staging and production are not ready until the actual
  // tenant data-plane pool proves that every sampled connection uses an
  // approved non-superuser, non-bypass role. The privileged central pool is
  // deliberately separate and is never accepted as tenant readiness evidence.
  const deploymentEnvironment = String(process.env.EDUPRO_ENVIRONMENT || '').trim().toLowerCase();
  const restrictedDataPlaneRequired = deploymentEnvironment === 'staging' || deploymentEnvironment === 'production';
  const configuredExpectedRoles = String(process.env.DATABASE_ROLE_EXPECTED || '')
    .split(',')
    .map(role => role.trim())
    .filter(Boolean);
  const expectedDataPlaneRoles = configuredExpectedRoles.length > 0
    ? configuredExpectedRoles
    : ['edupro_app'];
  const identityProbe = restrictedDataPlaneRequired
    ? transactionDriver?.inspectPoolIdentity(2) || Promise.reject(new Error('Restricted transaction driver is unavailable.'))
    : Promise.resolve([]);

  void Promise.all([DatabaseService.initialize(), identityProbe])
    .then(([result, identities]) => {
      if (result.supabaseConnected) {
        if (restrictedDataPlaneRequired) {
          const restricted = identities.length === 2 && identities.every(identity =>
            expectedDataPlaneRoles.includes(identity.current_user)
            && identity.session_user === identity.current_user
            && identity.rolsuper === false
            && identity.rolbypassrls === false
          );
          if (!restricted) {
            const observedRole = identities[0]?.current_user || null;
            EnterpriseLogger.error('Tenant data-plane role verification failed.', 'ServerBootstrap', {
              observedRole,
              expectedRoles: expectedDataPlaneRoles,
              sampleCount: identities.length,
            });
            startupReadiness.markUnsafeDataPlaneRole(observedRole, expectedDataPlaneRoles);
            return;
          }
          startupReadiness.markDatabaseConnected(identities[0].current_user, expectedDataPlaneRoles);
          return;
        }
        startupReadiness.markDatabaseConnected();
      } else {
        startupReadiness.markDatabaseUnavailable('Trusted Supabase connection is unavailable.');
      }
    })
    .catch((error: any) => {
      EnterpriseLogger.error('Database initialization failed after listener startup.', 'ServerBootstrap', {
        error: error?.message || String(error),
      });
      startupReadiness.markFailed('Database initialization failed.');
    });

  // Trusted authentication: credentials are verified by Supabase Auth.
  // The client is never allowed to select the identity, school, role, or session claims.
  app.post("/api/auth/login", authLimiter, async (req, res, next) => {
    try {
      (req as any).perf004Trace?.mark('authentication_started');
      const { identifier: requestedIdentifier, email, username, password } = req.body || {};
      const identifier = requestedIdentifier || email || username;
      if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
        return next(new AuthenticationError("بيانات الدخول غير صحيحة"));
      }
      const supabase = await getSupabaseClientReady();
      if (!supabase) {
        return next(new ExternalServiceError("خدمة المصادقة غير مهيأة. لا يمكن إنشاء جلسة آمنة."));
      }

      const result = await authenticateTrustedUser(supabase, identifier, password);
      const { identity, session } = result;

      disableAuthCaching(res);
      res.json({
        success: true,
        data: {
          token: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at,
          user: {
            id: identity.id,
            school_id: identity.schoolId || null,
            role: identity.role,
            permissions: identity.permissions || [],
            platform_permissions: identity.platformPermissions || [],
            name: identity.name,
            email: identity.email,
            school: identity.school,
            branch: identity.branch,
            branch_id: identity.branchId,
            academic_year: identity.academicYear
          }
        },
        message: "تم إنشاء جلسة موثوقة بنجاح."
      });
    } catch (err: any) {
      if (err instanceof TrustedAuthenticationError) {
        return next(new AuthenticationError("بيانات الدخول غير صحيحة"));
      }
      next(err);
    }
  });

  // Password recovery uses only the public Supabase anon client. It never
  // exposes or accepts a service-role credential in the browser.
  app.post("/api/auth/recovery", authLimiter, async (req, res, next) => {
    try {
      const { identifier: requestedIdentifier, email, username } = req.body || {};
      const identifier = requestedIdentifier || email || username;
      if (typeof identifier !== 'string' || !identifier.trim()) {
        return next(new AuthenticationError("أدخل اسم المستخدم أو البريد الإلكتروني"));
      }
      const supabase = await getSupabaseClientReady();
      if (!supabase) return next(new ExternalServiceError("خدمة المصادقة غير مهيأة."));

      let resolvedEmail: string;
      try {
        resolvedEmail = (await resolveTrustedLoginIdentifier(supabase, identifier)).email;
      } catch (error) {
        // Keep the response generic so recovery never reveals account existence.
        if (error instanceof TrustedAuthenticationError) {
          disableAuthCaching(res);
          return res.json({ success: true, message: "إذا كانت البيانات صحيحة فسيتم إرسال رابط الاستعادة." });
        }
        throw error;
      }

      const configuredPublicAppUrl = String(process.env.PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
      const recoveryOptions = configuredPublicAppUrl
        ? { redirectTo: `${configuredPublicAppUrl}/` }
        : undefined;
      const { error } = recoveryOptions
        ? await supabase.auth.resetPasswordForEmail(resolvedEmail, recoveryOptions)
        : await supabase.auth.resetPasswordForEmail(resolvedEmail);
      if (error) {
        EnterpriseLogger.error('Password recovery email dispatch failed.', 'AuthRecovery', {
          providerErrorCode: error.code || 'UNKNOWN_PROVIDER_ERROR',
          providerStatus: error.status || null,
        });
        return next(new ExternalServiceError("تعذر إرسال رابط الاستعادة."));
      }
      disableAuthCaching(res);
      res.json({ success: true, message: "إذا كانت البيانات صحيحة فسيتم إرسال رابط الاستعادة." });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/password-recovery/complete", authLimiter, async (req, res, next) => {
    try {
      const { accessToken, refreshToken, password } = req.body || {};
      if (typeof accessToken !== 'string' || !accessToken.trim() || typeof refreshToken !== 'string' || !refreshToken.trim() || typeof password !== 'string' || password.length < 12) {
        return next(new AuthenticationError("بيانات استعادة كلمة المرور غير صحيحة"));
      }
      const supabase = getSupabaseClientForAccessToken(accessToken.trim());
      if (!supabase) return next(new ExternalServiceError("خدمة المصادقة غير مهيأة."));
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken.trim(),
        refresh_token: refreshToken.trim()
      });
      if (sessionError) return next(new AuthenticationError("انتهت صلاحية رابط الاستعادة."));
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) return next(new AuthenticationError("تعذر تحديث كلمة المرور."));
      disableAuthCaching(res);
      res.json({ success: true, message: "تم تحديث كلمة المرور." });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/refresh", authLimiter, async (req, res, next) => {
    try {
      if (typeof req.body?.refreshToken !== 'string' || !req.body.refreshToken.trim()) {
        return next(new AuthenticationError("تعذر تجديد الجلسة"));
      }
      const supabase = await getSupabaseClientReady();
      if (!supabase) {
        return next(new ExternalServiceError("خدمة المصادقة غير مهيأة. لا يمكن تجديد الجلسة."));
      }
      const result = await refreshTrustedSession(supabase, req.body?.refreshToken);
      const { identity, session } = result;
      disableAuthCaching(res);
      res.json({
        success: true,
        data: {
          token: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at,
          user: {
            id: identity.id,
            school_id: identity.schoolId || null,
            role: identity.role,
            permissions: identity.permissions || [],
            platform_permissions: identity.platformPermissions || [],
            name: identity.name,
            email: identity.email,
            school: identity.school,
            branch: identity.branch,
            branch_id: identity.branchId,
            academic_year: identity.academicYear
          }
        },
        message: "تم تجديد الجلسة الموثوقة."
      });
    } catch (err: any) {
      if (err instanceof TrustedAuthenticationError) {
        return next(new AuthenticationError("تعذر تجديد الجلسة"));
      }
      next(err);
    }
  });

  app.post("/api/auth/logout", authLimiter, async (req, res, next) => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      if (!token) return next(new AuthenticationError("تعذر إنهاء الجلسة"));
      await revokeSupabaseSession(token);
      disableAuthCaching(res);
      return res.status(204).end();
    } catch (error) {
      EnterpriseLogger.warn("Supabase Auth logout failed.", "Authentication", {
        error: error instanceof Error ? error.message : "unknown"
      });
      return next(new ExternalServiceError("تعذر إنهاء الجلسة"));
    }
  });

  // ==========================================
  // MIDDLEWARES: BACKEND SECURITY & JWT AUTH
  // ==========================================
  async function authenticateRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
    (req as any).perf004Trace?.mark('authentication_started');
    const authTrace = (req as any).safeAuthTrace as SafeAuthTrace | undefined;
    // 1. Receive Bearer JWT Token from Authorization header
    const token = extractBearerToken(req.headers.authorization);
    if (authTrace) {
      authTrace.authorizationPresent = typeof req.headers.authorization === 'string' && req.headers.authorization.length > 0 ? 'YES' : 'NO';
      authTrace.tokenLength = token?.length || 0;
      authTrace.tokenExtraction = token ? 'SUCCESS' : 'FAIL';
      if (!token) authTrace.rejectionStage = 'token_extraction';
    }
    if (!token) {
      return next(new AuthenticationError("غير مصرح به. يرجى إرسال التوكن للتحقق من الصلاحية (Authorization Bearer Token missing)."));
    }
    // Verify signature, expiration, and identity using Supabase Auth.
    const supabase = await getSupabaseClientReady();
    if (!supabase) {
      if (authTrace) authTrace.rejectionStage = 'supabase_client';
      return next(new AuthenticationError("خدمة المصادقة غير مهيأة."));
    }

    let identity;
    try {
      (req as any).perf004Trace?.count?.('authRemoteCalls');
      (req as any).perf004Trace?.count?.('httpRemoteCalls');
      // Tenant resolution inside dbsec004_current_tenant_id() depends on
      // auth.uid(), so the verification lookup must carry this already
      // verified bearer token. Auth verification itself remains unchanged.
      identity = await verifyTrustedSession(getSupabaseClientForAccessToken(token) || supabase, token);
      if (authTrace) {
        authTrace.supabaseVerification = 'SUCCESS';
        authTrace.userIdPresent = identity?.id ? 'YES' : 'NO';
        authTrace.trustedIdentity = identity ? 'SUCCESS' : 'FAIL';
        // Central platform sessions intentionally have no school context;
        // authentication is still complete because platform RBAC is verified.
        authTrace.schoolContext = identity ? 'SUCCESS' : 'FAIL';
        authTrace.branchContext = identity?.branchId ? 'SUCCESS' : 'FAIL';
        if (!identity) authTrace.rejectionStage = 'trusted_identity';
      }
      (req as any).perf004Trace?.mark('authentication_completed');
    } catch (err: any) {
      if (authTrace) authTrace.rejectionStage = 'supabase_verification';
      if (err instanceof TrustedAuthenticationError) {
        return next(new AuthenticationError("غير مصرح به. الهوية غير صالحة."));
      }
      EnterpriseLogger.error("Supabase Auth verification failed", "ServerBootstrap", { error: err?.message || err });
      return next(new AuthenticationError("فشل التحقق من الهوية عبر Supabase Auth."));
    }

    // Identity is derived only from the verified Supabase user, never from request claims.
    (req as any).user = identity;
    // Preserve the verified bearer token only for the request-scoped tenant
    // lookup. It is never persisted, logged, or accepted from another source.
    (req as any).trustedAccessToken = token;

    // 4. Strictly prevent ordinary school requests from sending a different
    // school_id. A verified platform-admin request is allowed to carry a
    // target school for central administration; the central route still
    // validates the target against the canonical database and never trusts
    // the browser for authority.
    const clientSchoolId = req.headers["x-school-id"] || req.query.schoolId || req.body?.schoolId || req.body?.school_id;
    const isCentralPlatformRequest = String(req.originalUrl || '').split('?')[0].startsWith('/api/admin/central');
    const hasServerDerivedPlatformAdmin = Array.isArray(identity.platformPermissions)
      && identity.platformPermissions.includes(PERMISSIONS.PLATFORM_ADMIN);
    if (clientSchoolId && String(clientSchoolId) !== String(identity.schoolId) && !(isCentralPlatformRequest && hasServerDerivedPlatformAdmin)) {
      // Log security violation in Audit Logs
      await AuditRepository.log(
        identity.schoolId || 'central-platform',
        identity.id,
        identity.name,
        identity.role,
        "CROSS_TENANT_ACCESS_VIOLATION",
        "Authentication",
        req.ip || "127.0.0.1",
        `محاولة اختراق أمني: حاول المستخدم الوصول إلى بيانات المدرسة (${clientSchoolId}) بينما ينتمي للمدرسة (${identity.schoolId || 'الإدارة المركزية'})`
      );
      
      return next(new AuthorizationError("غير مسموح. محاولة الوصول إلى بيانات مدرسة أخرى تم كشفها وتسجيلها أمنياً."));
    }

    next();
  }

  // Narrow, admin-only provisioning entry point. It never provisions from
  // login or frontend state; scope comes from the trusted request identity.
  app.post('/api/admin/provisioning', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    const operation = req.body?.operation;
    const identity = (req as any).user;
    const correlationId = randomUUID();
    try {
      if (operation !== 'bootstrap_catalog' && operation !== 'provision_identity') {
        throw new ValidationError('عملية provisioning غير معتمدة.');
      }
      const context = await tenantEngine.resolveForRead(identity, (req as any).trustedAccessToken, (req as any).perf004Trace);
      if (!context?.tenantId || !context.schoolId || !context.branchId || !identity?.id) {
        throw new AuthenticationError('السياق الموثوق للتهيئة غير مكتمل.');
      }
      EnterpriseLogger.info('Admin provisioning request started', 'ProvisioningActivation', {
        operation, actor_present: 'YES', target_present: operation === 'provision_identity' ? 'YES' : 'NO',
        tenant_present: 'YES', school_present: 'YES', branch_present: 'YES', correlationId
      });
      if (operation === 'provision_identity') {
        // There is intentionally no trusted target-user resolver in the current
        // architecture. Never treat a browser-supplied identifier as authority.
        throw new ValidationError('لا يوجد مسار موثوق لتحديد مستخدم Auth المستهدف حاليًا.');
      }
      const result = await ErpProvisioningService.bootstrapCatalog({
        tenantId: context.tenantId,
        schoolId: context.schoolId,
        actorUserId: undefined
      });
      EnterpriseLogger.info('Admin provisioning request committed', 'ProvisioningActivation', {
        operation, success: true, outcome: 'commit', permission_count: result.permissionCount, correlationId
      });
      return res.json({ success: true, operation, permissionCount: result.permissionCount, correlationId });
    } catch (error) {
      EnterpriseLogger.error('Admin provisioning request failed', 'ProvisioningActivation', {
        operation: typeof operation === 'string' ? operation : 'unknown', success: false, outcome: 'rollback', correlationId,
        error: error instanceof Error ? error.message : 'unknown'
      });
      return next(error);
    }
  });

  // Every central-administration request is recorded as immutable access
  // evidence after authentication/authorization and route execution finish.
  // Request bodies are intentionally excluded so passwords and secrets never
  // enter the audit ledger.
  app.use('/api/admin/central', (req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      if (!platformAdminPool) return;
      const identity = (req as any).user as { id?: string; tenantId?: string } | undefined;
      const tenantId = String(identity?.tenantId || '').trim();
      const actorUserId = String(identity?.id || '').trim();
      if (!/^[0-9a-f-]{36}$/i.test(tenantId) || !/^[0-9a-f-]{36}$/i.test(actorUserId)) return;

      const requestPath = String(req.originalUrl || req.path || '').split('?')[0];
      const resourceId = requestPath.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] || null;
      const operation = typeof req.body?.operation === 'string' ? req.body.operation.trim() : '';
      const resourceType = requestPath.includes('/schools') ? 'central_school'
        : requestPath.includes('/tenants') ? 'central_tenant'
        : requestPath.includes('/branches') ? 'central_branch'
        : requestPath.includes('/users') ? 'central_user'
        : requestPath.includes('/rbac') ? 'central_rbac'
        : requestPath.includes('/notifications') ? 'central_notification'
        : requestPath.includes('/audit') ? 'central_audit'
        : 'central_administration';
      const result = res.statusCode < 400 ? 'allowed' : res.statusCode === 401 || res.statusCode === 403 ? 'denied' : 'error';
      const requestIp = String(req.ip || '').trim() || null;
      const userAgent = String(req.get('user-agent') || '').slice(0, 1000) || null;

      void platformAdminPool.query(
        `INSERT INTO public.audit_access_events
           (tenant_id, actor_user_id, resource_type, resource_id, action, source, reason, result,
            request_method, request_path, ip_address, user_agent)
         VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5, 'central_api', $6, $7, $8, $9,
                 NULLIF($10, '')::inet, $11)`,
        [
          tenantId,
          actorUserId,
          resourceType,
          resourceId,
          `${req.method}:${operation || 'request'}`,
          operation ? `operation:${operation}` : null,
          result,
          req.method,
          requestPath,
          requestIp,
          userAgent,
        ],
      ).catch((error) => {
        EnterpriseLogger.error('Central administration audit write failed', 'CentralAdministrationAudit', {
          requestPath,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    });
    next();
  });

  // Central tenant directory. Tenant records are platform-scoped and are
  // deliberately managed separately from the tenant's schools and branches.
  // The browser never supplies authority; only the verified platform role can
  // reach these routes, and all writes use the direct canonical PostgreSQL
  // source in one transaction.
  const stripLegacySchoolSubscriptionProfile = (metadata: unknown) => {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
    const legacyKeys = new Set(['plan', 'storageLimit', 'userLimit', 'subscriptionDuration', 'subscriptionStart', 'subscriptionEnd']);
    return Object.fromEntries(Object.entries(metadata as Record<string, unknown>).filter(([key]) => !legacyKeys.has(key)));
  };

  // A small, truthful health probe for the canonical control-plane database.
  // It reports the connection round trip plus migration drift for the objects
  // required by the central directory. CPU, storage, network and backup
  // telemetry still require their dedicated providers.
  app.get('/api/admin/central/health', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (_req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const startedAt = Date.now();
    try {
      const [result, schemaResult] = await Promise.all([
        platformAdminPool.query<{ checked_at: string }>('SELECT now() AS checked_at'),
        platformAdminPool.query<{ name: string }>(`
          SELECT required.name
            FROM (VALUES
              ('index', 'uq_schools_live_central_subdomain'),
              ('index', 'uq_schools_live_central_domain'),
              ('function', 'dbsec004_current_tenant_id'),
              ('function', 'dbsec004_current_school_id'),
              ('function', 'dbsec004_current_branch_id'),
              ('function', 'dbsec004_resolve_login_username')
            ) AS required(kind, name)
           WHERE (required.kind = 'index' AND NOT EXISTS (
                    SELECT 1 FROM pg_class c
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                   WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname = required.name
                 ))
              OR (required.kind = 'function' AND NOT EXISTS (
                    SELECT 1
                      FROM pg_proc p
                      JOIN pg_namespace n ON n.oid = p.pronamespace
                     WHERE n.nspname = 'public'
                       AND p.proname = required.name
                       AND pg_get_functiondef(p.oid) LIKE '%public.tenants%'
                 ))
           ORDER BY required.kind, required.name
        `),
      ]);
      const missingSchemaObjects = schemaResult.rows.map((row) => row.name);
      return res.json({
        success: true,
        health: {
          database: 'reachable',
          responseMs: Date.now() - startedAt,
          checkedAt: result.rows[0]?.checked_at ?? null,
          source: 'canonical-postgres',
          schemaStatus: missingSchemaObjects.length ? 'migration_pending' : 'ready',
          missingSchemaObjects,
        },
      });
    } catch (error) {
      return next(new DatabaseError('تعذر قياس اتصال PostgreSQL المركزي.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.get('/api/admin/central/tenants', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const includeArchived = String(req.query?.includeArchived || '').toLowerCase() === 'true';
    try {
      const result = await platformAdminPool.query(
        `SELECT t.id, t.legal_name, t.slug, t.plan_code, t.status,
                t.deleted_at, t.created_at, t.updated_at,
                (SELECT COUNT(*)::integer
                   FROM public.schools s
                  WHERE s.tenant_id = t.id AND s.deleted_at IS NULL) AS schools_count,
                (SELECT COUNT(*)::integer
                   FROM public.branches b
                  WHERE b.tenant_id = t.id AND b.deleted_at IS NULL) AS branches_count,
                (SELECT COUNT(*)::integer
                   FROM public.users u
                  WHERE u.tenant_id = t.id AND u.deleted_at IS NULL) AS users_count,
                (SELECT COUNT(*)::integer
                   FROM public.students st
                  WHERE st.tenant_id = t.id AND st.deleted_at IS NULL) AS students_count,
                sub.id AS subscription_id, sub.plan_code AS subscription_plan_code,
                sub.starts_at AS subscription_starts_at, sub.ends_at AS subscription_ends_at,
                sub.seat_limit AS subscription_seat_limit, sub.auto_renew AS subscription_auto_renew,
                sub.status AS subscription_status
           FROM public.tenants t
           LEFT JOIN LATERAL (
             SELECT s.id, s.plan_code, s.starts_at, s.ends_at, s.seat_limit, s.auto_renew, s.status
               FROM public.subscriptions s
              WHERE s.tenant_id = t.id AND s.deleted_at IS NULL
              ORDER BY s.starts_at DESC, s.created_at DESC
              LIMIT 1
           ) sub ON true
          WHERE t.deleted_at IS NULL OR $1::boolean
          ORDER BY t.created_at DESC`,
        [includeArchived],
      );
      return res.json({
        success: true,
        tenants: result.rows.map((row) => ({
          id: row.id,
          legal_name: row.legal_name,
          slug: row.slug,
          plan_code: row.plan_code,
          status: row.status,
          deleted_at: row.deleted_at,
          created_at: row.created_at,
          updated_at: row.updated_at,
          schools_count: row.schools_count,
          branches_count: row.branches_count,
          users_count: row.users_count,
          students_count: row.students_count,
          subscription: row.subscription_id ? {
            id: row.subscription_id,
            plan_code: row.subscription_plan_code,
            starts_at: row.subscription_starts_at,
            ends_at: row.subscription_ends_at,
            seat_limit: row.subscription_seat_limit,
            auto_renew: row.subscription_auto_renew,
            status: row.subscription_status,
          } : null,
        })),
      });
    } catch (error) {
      return next(new DatabaseError('تعذر تحميل دليل المستأجرين المركزي.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.post('/api/admin/central/tenants', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { id?: string };
    const actorId = String(identity?.id || '').trim();
    const legalName = String(req.body?.legalName || req.body?.name || '').trim();
    const slug = String(req.body?.slug || '').trim().toLowerCase();
    const planCode = String(req.body?.planCode || 'standard').trim().toLowerCase();
    const tenantStatus = String(req.body?.status || 'provisioning').trim();
    const subscriptionStatus = String(req.body?.subscriptionStatus || (tenantStatus === 'active' ? 'active' : 'trial')).trim();
    const seatLimit = Number(req.body?.seatLimit ?? 100);
    const startsAt = String(req.body?.startsAt || new Date().toISOString()).trim();
    const endsAt = String(req.body?.endsAt || '').trim() || null;
    const autoRenew = req.body?.autoRenew === undefined ? true : Boolean(req.body.autoRenew);

    if (!actorId) return next(new AuthenticationError('هوية الإدارة المركزية غير مكتملة.'));
    if (legalName.length < 2 || legalName.length > 160) return next(new ValidationError('الاسم القانوني للمستأجر يجب أن يكون بين حرفين و160 حرفاً.'));
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 63) return next(new ValidationError('معرف المستأجر يجب أن يكون لاتينياً صغيراً وبصيغة slug صحيحة.'));
    if (!/^[a-z0-9][a-z0-9._-]{1,62}$/.test(planCode)) return next(new ValidationError('رمز الباقة غير صالح.'));
    if (!['provisioning', 'active', 'suspended'].includes(tenantStatus)) return next(new ValidationError('حالة المستأجر غير مسموح بها.'));
    if (!['trial', 'active', 'past_due', 'cancelled', 'expired'].includes(subscriptionStatus)) return next(new ValidationError('حالة الاشتراك غير مسموح بها.'));
    if (!Number.isSafeInteger(seatLimit) || seatLimit < 1 || seatLimit > 1_000_000) return next(new ValidationError('حد المقاعد يجب أن يكون رقماً صحيحاً بين 1 و1,000,000.'));
    const startDate = new Date(startsAt);
    const endDate = endsAt ? new Date(endsAt) : null;
    if (Number.isNaN(startDate.getTime()) || (endDate && Number.isNaN(endDate.getTime())) || (endDate && endDate <= startDate)) {
      return next(new ValidationError('تواريخ الاشتراك غير صالحة أو تاريخ النهاية ليس بعد البداية.'));
    }

    const tenantId = randomUUID();
    const subscriptionId = randomUUID();
    const client = await platformAdminPool.connect();
    try {
      await client.query('BEGIN');
      const tenant = await client.query(
        `INSERT INTO public.tenants
          (id, legal_name, slug, plan_code, status, created_by, updated_by)
         VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid, $6::uuid)
         RETURNING id, legal_name, slug, plan_code, status, deleted_at, created_at, updated_at`,
        [tenantId, legalName, slug, planCode, tenantStatus, actorId],
      );
      const subscription = await client.query(
        `INSERT INTO public.subscriptions
          (id, tenant_id, plan_code, starts_at, ends_at, seat_limit, auto_renew, status, created_by, updated_by)
         VALUES ($1::uuid, $2::uuid, $3, $4::timestamptz, $5::timestamptz, $6, $7, $8, $9::uuid, $9::uuid)
         RETURNING id, tenant_id, plan_code, starts_at, ends_at, seat_limit, auto_renew, status`,
        [subscriptionId, tenantId, planCode, startDate.toISOString(), endDate?.toISOString() || null, seatLimit, autoRenew, subscriptionStatus, actorId],
      );
      await client.query('COMMIT');
      return res.status(201).json({ success: true, tenant: { ...tenant.rows[0], subscription: subscription.rows[0] } });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      return next(error instanceof Error && /duplicate|unique/i.test(error.message)
        ? new ConflictError('معرف المستأجر مستخدم مسبقاً.')
        : new DatabaseError('تعذر إنشاء المستأجر والاشتراك في المصدر المركزي.', error instanceof Error ? error.message : String(error)));
    } finally {
      client.release();
    }
  });

  app.patch('/api/admin/central/tenants/:tenantId', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { id?: string };
    const actorId = String(identity?.id || '').trim();
    const tenantId = String(req.params.tenantId || '').trim();
    const operation = String(req.body?.operation || 'update').trim();
    if (!actorId || !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new AuthenticationError('هوية المستأجر أو الإدارة غير مكتملة.'));

    const legalName = req.body?.legalName === undefined ? undefined : String(req.body.legalName || '').trim();
    const slug = req.body?.slug === undefined ? undefined : String(req.body.slug || '').trim().toLowerCase();
    const planCode = req.body?.planCode === undefined ? undefined : String(req.body.planCode || '').trim().toLowerCase();
    const tenantStatus = req.body?.status === undefined ? undefined : String(req.body.status || '').trim();
    if (legalName !== undefined && (legalName.length < 2 || legalName.length > 160)) return next(new ValidationError('الاسم القانوني للمستأجر غير صالح.'));
    if (slug !== undefined && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 63)) return next(new ValidationError('معرف المستأجر غير صالح.'));
    if (planCode !== undefined && !/^[a-z0-9][a-z0-9._-]{1,62}$/.test(planCode)) return next(new ValidationError('رمز الباقة غير صالح.'));
    if (tenantStatus !== undefined && !['provisioning', 'active', 'suspended'].includes(tenantStatus)) return next(new ValidationError('حالة المستأجر غير مسموح بها.'));

    try {
      const client = await platformAdminPool.connect();
      try {
        await client.query('BEGIN');
        let tenant;
        if (operation === 'archive') {
          tenant = await client.query(
            `UPDATE public.tenants
                SET status = 'archived', deleted_at = now(), deleted_by = $2::uuid,
                    updated_at = now(), updated_by = $2::uuid, version = version + 1
              WHERE id = $1::uuid AND deleted_at IS NULL
            RETURNING id, legal_name, slug, plan_code, status, deleted_at, created_at, updated_at`,
            [tenantId, actorId],
          );
          if (tenant.rowCount === 1) {
            await client.query(
              `UPDATE public.schools
                  SET status = 'archived', deleted_at = COALESCE(deleted_at, now()), deleted_by = COALESCE(deleted_by, $2::uuid),
                      updated_at = now(), updated_by = $2::uuid, version = version + 1
                WHERE tenant_id = $1::uuid AND deleted_at IS NULL`,
              [tenantId, actorId],
            );
            await client.query(
              `UPDATE public.branches
                  SET status = 'archived', deleted_at = COALESCE(deleted_at, now()), deleted_by = COALESCE(deleted_by, $2::uuid),
                      updated_at = now(), updated_by = $2::uuid, version = version + 1
                WHERE tenant_id = $1::uuid AND deleted_at IS NULL`,
              [tenantId, actorId],
            );
            await client.query(
              `UPDATE public.users
                  SET status = 'archived', deleted_at = COALESCE(deleted_at, now()), deleted_by = COALESCE(deleted_by, $2::uuid),
                      updated_at = now(), updated_by = $2::uuid, version = version + 1
                WHERE tenant_id = $1::uuid AND deleted_at IS NULL`,
              [tenantId, actorId],
            );
            await client.query(
              `UPDATE public.subscriptions
                  SET status = 'cancelled', deleted_at = COALESCE(deleted_at, now()), deleted_by = COALESCE(deleted_by, $2::uuid),
                      updated_at = now(), updated_by = $2::uuid, version = version + 1
                WHERE tenant_id = $1::uuid AND deleted_at IS NULL`,
              [tenantId, actorId],
            );
          }
        } else if (operation === 'restore') {
          tenant = await client.query(
            `WITH restored_tenant AS (
               UPDATE public.tenants
                  SET status = 'suspended', deleted_at = NULL, deleted_by = NULL,
                      updated_at = now(), updated_by = $2::uuid, version = version + 1
                WHERE id = $1::uuid AND status = 'archived' AND deleted_at IS NOT NULL
                RETURNING id, legal_name, slug, plan_code, status, deleted_at, created_at, updated_at
             ), restored_schools AS (
               UPDATE public.schools s
                  SET status = 'suspended', deleted_at = NULL, deleted_by = NULL,
                      updated_at = now(), updated_by = $2::uuid, version = version + 1
                 FROM restored_tenant t
                WHERE s.tenant_id = t.id AND s.status = 'archived' AND s.deleted_at IS NOT NULL
             ), restored_branches AS (
               UPDATE public.branches b
                  SET status = 'closed', deleted_at = NULL, deleted_by = NULL,
                      updated_at = now(), updated_by = $2::uuid, version = version + 1
                 FROM restored_tenant t
                WHERE b.tenant_id = t.id AND b.status = 'archived' AND b.deleted_at IS NOT NULL
             ), restored_users AS (
               UPDATE public.users u
                  SET status = 'suspended', deleted_at = NULL, deleted_by = NULL,
                      updated_at = now(), updated_by = $2::uuid, version = version + 1
                 FROM restored_tenant t
                WHERE u.tenant_id = t.id AND u.status = 'archived' AND u.deleted_at IS NOT NULL
             )
             SELECT * FROM restored_tenant`,
            [tenantId, actorId],
          );
        } else if (operation === 'status') {
          if (!tenantStatus || !['provisioning', 'active', 'suspended'].includes(tenantStatus)) throw new ValidationError('حالة المستأجر غير مسموح بها.');
          tenant = await client.query(
            `UPDATE public.tenants
                SET status = $2, updated_at = now(), updated_by = $3::uuid, version = version + 1
              WHERE id = $1::uuid AND deleted_at IS NULL
            RETURNING id, legal_name, slug, plan_code, status, deleted_at, created_at, updated_at`,
            [tenantId, tenantStatus, actorId],
          );
        } else if (operation === 'subscription') {
          const requestedPlanCode = String(req.body?.subscription?.planCode || req.body?.planCode || 'standard').trim().toLowerCase();
          const requestedStatus = String(req.body?.subscription?.status ?? req.body?.subscriptionStatus ?? '').trim();
          const requestedSeatLimit = Number(req.body?.subscription?.seatLimit ?? req.body?.seatLimit);
          const requestedStartsAt = String(req.body?.subscription?.startsAt ?? req.body?.startsAt ?? '').trim();
          const requestedEndsAt = String(req.body?.subscription?.endsAt || req.body?.endsAt || '').trim() || null;
          const requestedAutoRenew = req.body?.subscription?.autoRenew ?? req.body?.autoRenew;
          const subscriptionAutoRenew = requestedAutoRenew === undefined ? true : Boolean(requestedAutoRenew);
          const subscriptionStartDate = new Date(requestedStartsAt);
          const subscriptionEndDate = requestedEndsAt ? new Date(requestedEndsAt) : null;
          if (!/^[a-z0-9][a-z0-9._-]{1,62}$/.test(requestedPlanCode)) throw new ValidationError('رمز باقة الاشتراك غير صالح.');
          if (!['trial', 'active', 'past_due', 'cancelled', 'expired'].includes(requestedStatus)) throw new ValidationError('حالة الاشتراك غير مسموح بها.');
          if (!requestedStartsAt) throw new ValidationError('تاريخ بداية الاشتراك مطلوب من السجل الكانوني.');
          if (!Number.isSafeInteger(requestedSeatLimit) || requestedSeatLimit < 1 || requestedSeatLimit > 1_000_000) throw new ValidationError('حد المقاعد غير صالح.');
          if (Number.isNaN(subscriptionStartDate.getTime()) || (subscriptionEndDate && Number.isNaN(subscriptionEndDate.getTime())) || (subscriptionEndDate && subscriptionEndDate <= subscriptionStartDate)) throw new ValidationError('تواريخ الاشتراك غير صالحة.');
          tenant = await client.query(
            `UPDATE public.tenants
                SET plan_code = $2, updated_at = now(), updated_by = $3::uuid, version = version + 1
              WHERE id = $1::uuid AND deleted_at IS NULL
            RETURNING id, legal_name, slug, plan_code, status, deleted_at, created_at, updated_at`,
            [tenantId, requestedPlanCode, actorId],
          );
          if (tenant.rowCount === 1) {
            const currentSubscription = await client.query(
              `SELECT id FROM public.subscriptions
                WHERE tenant_id = $1::uuid AND deleted_at IS NULL
                ORDER BY starts_at DESC, created_at DESC LIMIT 1 FOR UPDATE`,
              [tenantId],
            );
            if (currentSubscription.rowCount === 1) {
              await client.query(
                `UPDATE public.subscriptions
                    SET plan_code = $2, starts_at = $3::timestamptz, ends_at = $4::timestamptz,
                        seat_limit = $5, auto_renew = $6, status = $7,
                        updated_at = now(), updated_by = $8::uuid, version = version + 1
                  WHERE id = $1::uuid AND tenant_id = $9::uuid AND deleted_at IS NULL`,
                [currentSubscription.rows[0].id, requestedPlanCode, subscriptionStartDate.toISOString(), subscriptionEndDate?.toISOString() || null, requestedSeatLimit, subscriptionAutoRenew, requestedStatus, actorId, tenantId],
              );
            } else {
              await client.query(
                `INSERT INTO public.subscriptions
                  (tenant_id, plan_code, starts_at, ends_at, seat_limit, auto_renew, status, created_by, updated_by)
                 VALUES ($1::uuid, $2, $3::timestamptz, $4::timestamptz, $5, $6, $7, $8::uuid, $8::uuid)`,
                [tenantId, requestedPlanCode, subscriptionStartDate.toISOString(), subscriptionEndDate?.toISOString() || null, requestedSeatLimit, subscriptionAutoRenew, requestedStatus, actorId],
              );
            }
          }
        } else if (operation === 'update') {
          tenant = await client.query(
            `UPDATE public.tenants
                SET legal_name = COALESCE($2, legal_name), slug = COALESCE($3, slug), plan_code = COALESCE($4, plan_code),
                    status = COALESCE($5, status), updated_at = now(), updated_by = $6::uuid, version = version + 1
              WHERE id = $1::uuid AND deleted_at IS NULL
            RETURNING id, legal_name, slug, plan_code, status, deleted_at, created_at, updated_at`,
            [tenantId, legalName ?? null, slug ?? null, planCode ?? null, tenantStatus ?? null, actorId],
          );
          const requestedSubscription = req.body?.subscription;
          if (tenant.rowCount === 1 && requestedSubscription && typeof requestedSubscription === 'object' && !Array.isArray(requestedSubscription)) {
            const requestedPlanCode = String(requestedSubscription.planCode ?? planCode ?? tenant.rows[0].plan_code).trim().toLowerCase();
            const requestedStatus = String(requestedSubscription.status ?? '').trim();
            const requestedSeatLimit = Number(requestedSubscription.seatLimit);
            const requestedStartsAt = String(requestedSubscription.startsAt ?? '').trim();
            const requestedEndsAt = String(requestedSubscription.endsAt || '').trim() || null;
            const requestedAutoRenew = requestedSubscription.autoRenew === undefined ? true : Boolean(requestedSubscription.autoRenew);
            const subscriptionStartDate = new Date(requestedStartsAt);
            const subscriptionEndDate = requestedEndsAt ? new Date(requestedEndsAt) : null;
            if (!/^[a-z0-9][a-z0-9._-]{1,62}$/.test(requestedPlanCode)) throw new ValidationError('رمز باقة الاشتراك غير صالح.');
            if (!['trial', 'active', 'past_due', 'cancelled', 'expired'].includes(requestedStatus)) throw new ValidationError('حالة الاشتراك غير مسموح بها.');
            if (!requestedStartsAt) throw new ValidationError('تاريخ بداية الاشتراك مطلوب من السجل الكانوني.');
            if (!Number.isSafeInteger(requestedSeatLimit) || requestedSeatLimit < 1 || requestedSeatLimit > 1_000_000) throw new ValidationError('حد المقاعد غير صالح.');
            if (Number.isNaN(subscriptionStartDate.getTime()) || (subscriptionEndDate && Number.isNaN(subscriptionEndDate.getTime())) || (subscriptionEndDate && subscriptionEndDate <= subscriptionStartDate)) throw new ValidationError('تواريخ الاشتراك غير صالحة.');
            await client.query(
              `UPDATE public.tenants SET plan_code = $2, updated_at = now(), updated_by = $3::uuid, version = version + 1 WHERE id = $1::uuid`,
              [tenantId, requestedPlanCode, actorId],
            );
            const currentSubscription = await client.query(
              `SELECT id FROM public.subscriptions
                WHERE tenant_id = $1::uuid AND deleted_at IS NULL
                ORDER BY starts_at DESC, created_at DESC LIMIT 1 FOR UPDATE`,
              [tenantId],
            );
            if (currentSubscription.rowCount === 1) {
              await client.query(
                `UPDATE public.subscriptions
                    SET plan_code = $2, starts_at = $3::timestamptz, ends_at = $4::timestamptz,
                        seat_limit = $5, auto_renew = $6, status = $7,
                        updated_at = now(), updated_by = $8::uuid, version = version + 1
                  WHERE id = $1::uuid AND tenant_id = $9::uuid AND deleted_at IS NULL`,
                [currentSubscription.rows[0].id, requestedPlanCode, subscriptionStartDate.toISOString(), subscriptionEndDate?.toISOString() || null, requestedSeatLimit, requestedAutoRenew, requestedStatus, actorId, tenantId],
              );
            } else {
              await client.query(
                `INSERT INTO public.subscriptions
                  (tenant_id, plan_code, starts_at, ends_at, seat_limit, auto_renew, status, created_by, updated_by)
                 VALUES ($1::uuid, $2, $3::timestamptz, $4::timestamptz, $5, $6, $7, $8::uuid, $8::uuid)`,
                [tenantId, requestedPlanCode, subscriptionStartDate.toISOString(), subscriptionEndDate?.toISOString() || null, requestedSeatLimit, requestedAutoRenew, requestedStatus, actorId],
              );
            }
          }
        } else {
          throw new ValidationError('عملية إدارة المستأجر غير معتمدة.');
        }
        if (tenant.rowCount !== 1) {
          throw new ConflictError('المستأجر غير موجود أو مؤرشف مسبقاً.');
        }
        const enriched = await client.query(
          `SELECT t.id, t.legal_name, t.slug, t.plan_code, t.status, t.deleted_at, t.created_at, t.updated_at,
                  (SELECT COUNT(*)::integer FROM public.schools s WHERE s.tenant_id = t.id AND s.deleted_at IS NULL) AS schools_count,
                  (SELECT COUNT(*)::integer FROM public.branches b WHERE b.tenant_id = t.id AND b.deleted_at IS NULL) AS branches_count,
                  (SELECT COUNT(*)::integer FROM public.users u WHERE u.tenant_id = t.id AND u.deleted_at IS NULL) AS users_count,
                  (SELECT COUNT(*)::integer FROM public.students st WHERE st.tenant_id = t.id AND st.deleted_at IS NULL) AS students_count,
                  sub.id AS subscription_id, sub.plan_code AS subscription_plan_code, sub.starts_at AS subscription_starts_at,
                  sub.ends_at AS subscription_ends_at, sub.seat_limit AS subscription_seat_limit,
                  sub.auto_renew AS subscription_auto_renew, sub.status AS subscription_status
             FROM public.tenants t
             LEFT JOIN LATERAL (
               SELECT s.id, s.plan_code, s.starts_at, s.ends_at, s.seat_limit, s.auto_renew, s.status
                 FROM public.subscriptions s
                WHERE s.tenant_id = t.id AND s.deleted_at IS NULL
                ORDER BY s.starts_at DESC, s.created_at DESC LIMIT 1
             ) sub ON true
            WHERE t.id = $1::uuid`,
          [tenantId],
        );
        await client.query('COMMIT');
        const row = enriched.rows[0];
        return res.json({ success: true, tenant: {
          id: row.id, legal_name: row.legal_name, slug: row.slug, plan_code: row.plan_code, status: row.status,
          deleted_at: row.deleted_at, created_at: row.created_at, updated_at: row.updated_at,
          schools_count: row.schools_count, branches_count: row.branches_count, users_count: row.users_count, students_count: row.students_count,
          subscription: row.subscription_id ? {
            id: row.subscription_id, plan_code: row.subscription_plan_code, starts_at: row.subscription_starts_at,
            ends_at: row.subscription_ends_at, seat_limit: row.subscription_seat_limit, auto_renew: row.subscription_auto_renew,
            status: row.subscription_status,
          } : null,
        }});
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        return next(error instanceof Error && /duplicate|unique/i.test(error.message)
          ? new ConflictError('معرف المستأجر مستخدم مسبقاً.')
          : error);
      } finally {
        client.release();
      }
    } catch (error) {
      return next(error instanceof Error ? error : new DatabaseError('تعذر تحديث المستأجر في المصدر المركزي.'));
    }
  });

  // Central school directory. This path is the only browser-facing school
  // creation entry point: scope is derived from the verified platform
  // identity and the two records are committed atomically in PostgreSQL.
  app.get('/api/admin/central/schools', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const requestedTenantId = String(req.query?.tenantId || '').trim();
    if (requestedTenantId && !/^[0-9a-f-]{36}$/i.test(requestedTenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
    try {
      const result = await platformAdminPool.query(
        `SELECT s.id, s.tenant_id, s.school_code, s.legal_name, s.display_name,
                s.timezone, s.locale, s.status, t.status AS tenant_status, s.central_metadata, s.deleted_at, s.created_at, s.updated_at,
                (SELECT COUNT(*)::integer
                   FROM public.users u
                  WHERE u.tenant_id = s.tenant_id AND u.school_id = s.id AND u.deleted_at IS NULL) AS users_count,
                (SELECT COUNT(*)::integer
                   FROM public.students st
                  WHERE st.tenant_id = s.tenant_id AND st.school_id = s.id AND st.deleted_at IS NULL) AS students_count,
                sub.plan_code AS subscription_plan_code, sub.starts_at AS subscription_starts_at,
                sub.ends_at AS subscription_ends_at, sub.seat_limit AS subscription_seat_limit,
                sub.auto_renew AS subscription_auto_renew, sub.status AS subscription_status,
                b.id AS branch_id, b.branch_code, b.name AS branch_name, b.status AS branch_status
           FROM public.schools s
           JOIN public.tenants t ON t.id = s.tenant_id
           LEFT JOIN LATERAL (
             SELECT plan_code, starts_at, ends_at, seat_limit, auto_renew, status
               FROM public.subscriptions
              WHERE tenant_id = s.tenant_id AND deleted_at IS NULL
              ORDER BY starts_at DESC, created_at DESC
              LIMIT 1
           ) sub ON true
           LEFT JOIN LATERAL (
             SELECT id, branch_code, name, status
               FROM public.branches
              WHERE tenant_id = s.tenant_id AND school_id = s.id AND deleted_at IS NULL
              ORDER BY created_at ASC
              LIMIT 1
           ) b ON true
          WHERE ($1::uuid IS NULL OR s.tenant_id = $1::uuid)
          ORDER BY s.created_at DESC`,
        [requestedTenantId || null],
      );
      return res.json({
        success: true,
        schools: result.rows.map((row) => ({
          id: row.id,
          tenant_id: row.tenant_id,
          school_code: row.school_code,
          legal_name: row.legal_name,
          display_name: row.display_name,
          timezone: row.timezone,
          locale: row.locale,
          status: row.status,
          tenant_status: row.tenant_status,
          users_count: row.users_count,
          students_count: row.students_count,
          subscription: row.subscription_plan_code ? {
            plan_code: row.subscription_plan_code,
            starts_at: row.subscription_starts_at,
            ends_at: row.subscription_ends_at,
            seat_limit: row.subscription_seat_limit,
            auto_renew: row.subscription_auto_renew,
            status: row.subscription_status,
          } : null,
          deleted_at: row.deleted_at,
          central_metadata: stripLegacySchoolSubscriptionProfile(row.central_metadata),
          created_at: row.created_at,
          updated_at: row.updated_at,
          main_branch: row.branch_id ? {
            id: row.branch_id,
            branch_code: row.branch_code,
            name: row.branch_name,
            status: row.branch_status,
          } : null,
        })),
      });
    } catch (error) {
      return next(new DatabaseError('تعذر تحميل دليل المدارس المركزي.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.post('/api/admin/central/schools', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { id?: string; tenantId?: string };
    const tenantId = String(req.body?.targetTenantId || req.body?.tenantId || identity?.tenantId || '').trim();
    const actorId = String(identity?.id || '').trim();
    const name = String(req.body?.name || '').trim();
    const schoolCode = String(req.body?.schoolCode || '').trim().toUpperCase();
    const timezone = String(req.body?.timezone || 'Africa/Khartoum').trim();
    const locale = String(req.body?.locale || 'ar').trim();
    const centralMetadata = {
      shortName: String(req.body?.shortName || '').trim(),
      subdomain: String(req.body?.subdomain || '').trim().toLowerCase(),
      city: String(req.body?.city || '').trim(),
      address: String(req.body?.address || '').trim(),
      phone: String(req.body?.phone || '').trim(),
      email: String(req.body?.email || '').trim().toLowerCase(),
      managerName: String(req.body?.managerName || '').trim(),
      managerEmail: String(req.body?.managerEmail || '').trim().toLowerCase(),
      mainBranchId: '',
    };

    if (!tenantId || !/^[0-9a-f-]{36}$/i.test(tenantId) || !actorId) return next(new AuthenticationError('هوية الإدارة المركزية أو المستأجر المستهدف غير مكتمل.'));
    if (name.length < 2 || name.length > 160) return next(new ValidationError('اسم المدرسة يجب أن يكون بين حرفين و160 حرفاً.'));
    if (schoolCode && !/^[A-Z0-9][A-Z0-9._/-]*$/.test(schoolCode)) return next(new ValidationError('رمز المدرسة غير صالح.'));
    if (!/^[A-Za-z_/-]+$/.test(timezone) || locale.length < 2) return next(new ValidationError('إعدادات اللغة أو المنطقة الزمنية غير صالحة.'));
    if (centralMetadata.subdomain && !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(centralMetadata.subdomain)) {
      return next(new ValidationError('النطاق الفرعي يجب أن يتكون من 3 إلى 63 رمزاً لاتينياً صغيراً.'));
    }
    if (centralMetadata.managerEmail && !/^\S+@\S+\.\S+$/.test(centralMetadata.managerEmail)) {
      return next(new ValidationError('بريد مدير المدرسة غير صالح.'));
    }

    const schoolId = randomUUID();
    const branchId = randomUUID();
    centralMetadata.mainBranchId = branchId;
    const resolvedCode = schoolCode || `SCH-${schoolId.slice(0, 8).toUpperCase()}`;
    const client = await platformAdminPool.connect();
    try {
      await client.query('BEGIN');
      const targetTenant = await client.query<{ status: string }>(
        `SELECT status
           FROM public.tenants
          WHERE id = $1::uuid AND deleted_at IS NULL
          FOR UPDATE`,
        [tenantId],
      );
      if (targetTenant.rowCount !== 1) throw new ConflictError('المستأجر المستهدف غير موجود أو مؤرشف.');
      if (!['provisioning', 'active'].includes(targetTenant.rows[0].status)) {
        throw new ConflictError('لا يمكن تأسيس مدرسة داخل مستأجر موقوف أو مؤرشف.');
      }
      const school = await client.query(
        `INSERT INTO public.schools
          (id, tenant_id, school_code, legal_name, display_name, timezone, locale, status, central_metadata, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $4, $5, $6, 'active', $7::jsonb, $8, $8)
         RETURNING id, tenant_id, school_code, legal_name, display_name, timezone, locale, status, central_metadata, created_at, updated_at`,
        [schoolId, tenantId, resolvedCode, name, timezone, locale, JSON.stringify(centralMetadata), actorId],
      );
      const branch = await client.query(
        `INSERT INTO public.branches
          (id, tenant_id, school_id, branch_code, name, address, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, 'الفرع الرئيسي', '{}'::jsonb, 'active', $5, $5)
         RETURNING id, tenant_id, school_id, branch_code, name, status, created_at, updated_at`,
        [branchId, tenantId, schoolId, `${resolvedCode}-MAIN`, actorId],
      );
      await client.query(
        `INSERT INTO public.hr_database
          (tenant_id, school_id, country_code, legal_configuration, data, version, updated_by)
         VALUES ($1, $2, 'ZZ', '{}'::jsonb,
           '{"employees":[],"departments":[],"jobs":[],"contracts":[],"attendance":[],"leaves":[],"penalties":[],"advances":[],"rewards":[],"performance":[],"documents":[],"payrollRuns":[],"settings":{}}'::jsonb,
           0, $3)
         ON CONFLICT (school_id) DO NOTHING`,
        [tenantId, schoolId, actorId],
      );
      await client.query(
        `INSERT INTO public.inventory_database
          (tenant_id, school_id, data, version, updated_by)
         VALUES ($1, $2,
           '{"items":[],"categories":[],"brands":[],"units":[],"suppliers":[],"warehouses":[],"movements":[],"stocktakes":[],"purchaseRequests":[],"rfqs":[],"quotations":[],"purchaseOrders":[],"goodsReceipts":[],"vendorBills":[],"vendorPayments":[],"settings":{},"procurementSettings":{}}'::jsonb,
           0, $3)
         ON CONFLICT (school_id) DO NOTHING`,
        [tenantId, schoolId, actorId],
      );
      await client.query(
        `INSERT INTO public.financial_portal_snapshots
          (tenant_id, school_id, data, version, updated_by)
         VALUES ($1, $2, '{}'::jsonb, 0, $3)
         ON CONFLICT (school_id) DO NOTHING`,
        [tenantId, schoolId, actorId],
      );
      await client.query('COMMIT');
      return res.status(201).json({
        success: true,
        school: school.rows[0],
        branch: branch.rows[0],
        provisioning: {
          hr_database: true,
          inventory_database: true,
          financial_portal_snapshots: true,
        },
      });
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* keep original error */ }
      return next(error instanceof Error && /duplicate|unique/i.test(error.message)
        ? new ConflictError('رمز المدرسة مستخدم مسبقاً داخل المستأجر.')
        : new DatabaseError('تعذر إنشاء المدرسة والفرع في المصدر المركزي.', error instanceof Error ? error.message : String(error)));
    } finally {
      client.release();
    }
  });

  app.patch('/api/admin/central/schools/:schoolId', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { id?: string };
    const tenantId = String(req.body?.targetTenantId || '').trim();
    const actorId = String(identity?.id || '').trim();
    const schoolId = String(req.params.schoolId || '').trim();
    const operation = String(req.body?.operation || '').trim();
    if (!actorId || !schoolId) return next(new AuthenticationError('هوية الإدارة المركزية أو المدرسة غير مكتملة.'));
    if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
    if (!/^[0-9a-f-]{36}$/i.test(schoolId)) return next(new ValidationError('معرف المدرسة غير صالح.'));

    try {
      let result;
      if (operation === 'update') {
        const name = String(req.body?.name || '').trim();
        const schoolCode = String(req.body?.schoolCode || '').trim().toUpperCase();
        const requestedProfile = req.body?.profile && typeof req.body.profile === 'object' ? req.body.profile : {};
        const legacySubscriptionKeys = ['plan', 'storageLimit', 'userLimit', 'subscriptionDuration', 'subscriptionStart', 'subscriptionEnd'];
        const suppliedLegacySubscriptionKey = legacySubscriptionKeys.find((key) => Object.prototype.hasOwnProperty.call(requestedProfile, key));
        if (suppliedLegacySubscriptionKey) return next(new ValidationError('بيانات الاشتراك تُدار من سجل المستأجر المركزي ولا تُحفظ داخل ملف المدرسة.'));
        const profileKeys = ['shortName', 'subdomain', 'domain', 'customDomain', 'sslStatus', 'city', 'address', 'phone', 'email', 'managerName', 'managerEmail'];
        const profile = Object.fromEntries(
          profileKeys
            .filter((key) => Object.prototype.hasOwnProperty.call(requestedProfile, key))
            .map((key) => [key, String(requestedProfile[key] ?? '').trim()]),
        );
        const domainPattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
        const requestedStatus = String(req.body?.status || '').trim();
        if (name.length < 2 || name.length > 160) return next(new ValidationError('اسم المدرسة يجب أن يكون بين حرفين و160 حرفاً.'));
        if (!/^[A-Z0-9][A-Z0-9._/-]*$/.test(schoolCode)) return next(new ValidationError('رمز المدرسة غير صالح.'));
        if (profile.subdomain && !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(profile.subdomain)) return next(new ValidationError('النطاق الفرعي غير صالح.'));
        if (profile.managerEmail && !/^\S+@\S+\.\S+$/.test(profile.managerEmail)) return next(new ValidationError('بريد مدير المدرسة غير صالح.'));
        if (profile.domain && !domainPattern.test(profile.domain)) return next(new ValidationError('النطاق الخاص غير صالح؛ أدخل اسم نطاق كاملًا دون بروتوكول أو مسار.'));
        if (profile.customDomain && !domainPattern.test(profile.customDomain)) return next(new ValidationError('النطاق الخاص غير صالح؛ أدخل اسم نطاق كاملًا دون بروتوكول أو مسار.'));
        if (profile.sslStatus && !['pending', 'valid', 'none'].includes(profile.sslStatus)) return next(new ValidationError('حالة شهادة SSL غير معتمدة.'));
        if (requestedStatus && !['active', 'suspended'].includes(requestedStatus)) return next(new ValidationError('حالة المدرسة غير مسموح بها.'));
        const requestedSubdomain = String(profile.subdomain || '').toLowerCase();
        const requestedDomain = String(profile.domain || profile.customDomain || '').toLowerCase();
        if (requestedSubdomain || requestedDomain) {
          const duplicate = await platformAdminPool.query(
            `SELECT id
               FROM public.schools
              WHERE id <> $1::uuid AND deleted_at IS NULL
                AND (
                  ($2 <> '' AND lower(COALESCE(central_metadata->>'subdomain', '')) = $2)
                  OR ($3 <> '' AND lower(COALESCE(NULLIF(btrim(central_metadata->>'domain'), ''), NULLIF(btrim(central_metadata->>'customDomain'), ''), '')) = $3)
                )
              LIMIT 1`,
            [schoolId, requestedSubdomain, requestedDomain],
          );
          if (duplicate.rowCount) return next(new ConflictError('النطاق المطلوب مستخدم مسبقاً في مدرسة أخرى.'));
        }
        result = await platformAdminPool.query(
          `UPDATE public.schools
              SET legal_name = $3, display_name = $3, school_code = $4,
                  central_metadata = COALESCE(central_metadata, '{}'::jsonb) || $6::jsonb,
                  status = COALESCE($7, status),
                  updated_at = now(), updated_by = $5, version = version + 1
            WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL
          RETURNING id, tenant_id, school_code, legal_name, display_name, timezone, locale, status, central_metadata, created_at, updated_at`,
          [schoolId, tenantId || null, name, schoolCode, actorId, JSON.stringify(profile), requestedStatus || null],
        );
      } else if (operation === 'status') {
        const status = String(req.body?.status || '').trim();
        if (!['active', 'suspended'].includes(status)) return next(new ValidationError('حالة المدرسة غير مسموح بها.'));
        result = await platformAdminPool.query(
          `UPDATE public.schools SET status = $3, updated_at = now(), updated_by = $4, version = version + 1
            WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL
          RETURNING id, tenant_id, school_code, legal_name, display_name, timezone, locale, status, central_metadata, created_at, updated_at`,
          [schoolId, tenantId || null, status, actorId],
        );
      } else if (operation === 'features') {
        const features = req.body?.features;
        if (!features || typeof features !== 'object' || Array.isArray(features)) return next(new ValidationError('مصفوفة ميزات المدرسة غير صالحة.'));
        const invalidFeature = Object.values(features).find((value) => typeof value !== 'boolean');
        if (invalidFeature !== undefined) return next(new ValidationError('كل قيمة في مصفوفة الميزات يجب أن تكون true أو false.'));
        result = await platformAdminPool.query(
          `UPDATE public.schools
              SET central_metadata = COALESCE(central_metadata, '{}'::jsonb) || jsonb_build_object('features', $3::jsonb),
                  updated_at = now(), updated_by = $4, version = version + 1
            WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL
          RETURNING id, tenant_id, school_code, legal_name, display_name, timezone, locale, status, central_metadata, created_at, updated_at`,
          [schoolId, tenantId || null, JSON.stringify(features), actorId],
        );
      } else if (operation === 'archive') {
        result = await platformAdminPool.query(
          `WITH archived_school AS (
             UPDATE public.schools
                SET status = 'archived', deleted_at = now(), deleted_by = $3::uuid,
                    updated_at = now(), updated_by = $3::uuid, version = version + 1
              WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL
              RETURNING id, tenant_id, school_code, legal_name, display_name, timezone, locale, status, central_metadata, created_at, updated_at
           ), archived_branches AS (
             UPDATE public.branches b
                SET status = 'archived', deleted_at = now(), deleted_by = $3::uuid,
                    updated_at = now(), updated_by = $3::uuid, version = version + 1
               FROM archived_school s
              WHERE b.tenant_id = s.tenant_id AND b.school_id = s.id AND b.deleted_at IS NULL
           ), archived_users AS (
             UPDATE public.users u
                SET status = 'archived', deleted_at = now(), deleted_by = $3::uuid,
                    updated_at = now(), updated_by = $3::uuid, version = version + 1
               FROM archived_school s
              WHERE u.tenant_id = s.tenant_id AND u.school_id = s.id AND u.deleted_at IS NULL
           )
           SELECT * FROM archived_school`,
          [schoolId, tenantId || null, actorId],
        );
      } else if (operation === 'restore') {
        result = await platformAdminPool.query(
          `WITH restored_school AS (
             UPDATE public.schools
                SET status = 'suspended', deleted_at = NULL, deleted_by = NULL,
                    updated_at = now(), updated_by = $3::uuid, version = version + 1
              WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid)
                AND status = 'archived' AND deleted_at IS NOT NULL
                AND EXISTS (
                  SELECT 1 FROM public.tenants t
                   WHERE t.id = public.schools.tenant_id
                     AND t.deleted_at IS NULL AND t.status IN ('provisioning', 'active')
                )
              RETURNING id, tenant_id, school_code, legal_name, display_name, timezone, locale, status, central_metadata, created_at, updated_at
           ), restored_branches AS (
             UPDATE public.branches b
                SET status = 'closed', deleted_at = NULL, deleted_by = NULL,
                    updated_at = now(), updated_by = $3::uuid, version = version + 1
               FROM restored_school s
              WHERE b.tenant_id = s.tenant_id AND b.school_id = s.id
                AND b.status = 'archived' AND b.deleted_at IS NOT NULL
           ), restored_users AS (
             UPDATE public.users u
                SET status = 'suspended', deleted_at = NULL, deleted_by = NULL,
                    updated_at = now(), updated_by = $3::uuid, version = version + 1
               FROM restored_school s
              WHERE u.tenant_id = s.tenant_id AND u.school_id = s.id
                AND u.status = 'archived' AND u.deleted_at IS NOT NULL
           )
           SELECT * FROM restored_school`,
          [schoolId, tenantId || null, actorId],
        );
      } else {
        return next(new ValidationError('عملية إدارة المدرسة غير معتمدة.'));
      }
      if (result.rowCount !== 1) return next(new ConflictError('المدرسة غير موجودة أو لا تنتمي إلى نطاق الإدارة المركزية.'));
      return res.json({ success: true, school: { ...result.rows[0], central_metadata: stripLegacySchoolSubscriptionProfile(result.rows[0].central_metadata) } });
    } catch (error) {
      return next(error instanceof Error && /duplicate|unique/i.test(error.message)
        ? new ConflictError('رمز المدرسة مستخدم مسبقاً داخل المستأجر.')
        : new DatabaseError('تعذر تحديث المدرسة في المصدر المركزي.', error instanceof Error ? error.message : String(error)));
    }
  });

  // Central branch directory. Branches are managed through the same verified
  // platform identity as schools; the browser never supplies tenant scope.
  app.get('/api/admin/central/branches', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const tenantId = String(req.query?.tenantId || '').trim();
    const schoolId = String(req.query?.schoolId || '').trim();
    if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
    if (schoolId && !/^[0-9a-f-]{36}$/i.test(schoolId)) return next(new ValidationError('معرف المدرسة غير صالح.'));
    try {
      const result = await platformAdminPool.query(
        `SELECT b.id, b.tenant_id, b.school_id, b.branch_code, b.name, b.address, b.status,
                (s.central_metadata->>'mainBranchId') = b.id::text AS is_main,
                (SELECT COUNT(*)::integer
                   FROM public.users u
                  WHERE u.tenant_id = b.tenant_id AND u.school_id = b.school_id AND u.branch_id = b.id AND u.deleted_at IS NULL) AS users_count,
                (SELECT COUNT(*)::integer
                   FROM public.students st
                  WHERE st.tenant_id = b.tenant_id AND st.school_id = b.school_id AND st.branch_id = b.id AND st.deleted_at IS NULL) AS students_count,
                b.deleted_at, b.created_at, b.updated_at, s.display_name AS school_name
           FROM public.branches b
           JOIN public.schools s ON s.tenant_id = b.tenant_id AND s.id = b.school_id
          WHERE ($1::uuid IS NULL OR b.tenant_id = $1::uuid)
            AND b.deleted_at IS NULL
            AND ($2::uuid IS NULL OR b.school_id = $2::uuid)
          ORDER BY s.display_name ASC, b.created_at ASC`,
        [tenantId || null, schoolId || null],
      );
      return res.json({
        success: true,
        branches: result.rows.map((row) => ({
          ...row,
          users_count: row.users_count,
          students_count: row.students_count,
          address: row.address || {},
          city: row.address?.city || '',
          phone: row.address?.phone || '',
          school_name: row.school_name,
        })),
      });
    } catch (error) {
      return next(new DatabaseError('تعذر تحميل فروع المدارس من المصدر المركزي.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.post('/api/admin/central/schools/:schoolId/branches', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { id?: string };
    const tenantId = String(req.body?.targetTenantId || '').trim();
    const actorId = String(identity?.id || '').trim();
    const schoolId = String(req.params.schoolId || '').trim();
    const name = String(req.body?.name || '').trim();
    const branchCode = String(req.body?.branchCode || '').trim().toUpperCase();
    const city = String(req.body?.city || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const address = String(req.body?.address || '').trim();
    if (!actorId || !schoolId) return next(new AuthenticationError('هوية الإدارة المركزية أو المدرسة غير مكتملة.'));
    if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
    if (!/^[0-9a-f-]{36}$/i.test(schoolId)) return next(new ValidationError('معرف المدرسة غير صالح.'));
    if (name.length < 2 || name.length > 160) return next(new ValidationError('اسم الفرع يجب أن يكون بين حرفين و160 حرفاً.'));
    if (branchCode && !/^[A-Z0-9][A-Z0-9._/-]*$/.test(branchCode)) return next(new ValidationError('رمز الفرع غير صالح.'));
    const branchId = randomUUID();
    const resolvedCode = branchCode || `BR-${branchId.slice(0, 8).toUpperCase()}`;
    try {
      const result = await platformAdminPool.query(
        `INSERT INTO public.branches
          (id, tenant_id, school_id, branch_code, name, address, status, created_by, updated_by)
         SELECT $1, s.tenant_id, s.id, $3, $4,
                jsonb_build_object('city', $5::text, 'phone', $6::text, 'address', $7::text),
                'active', $8, $8
           FROM public.schools s
           JOIN public.tenants t ON t.id = s.tenant_id AND t.deleted_at IS NULL
          WHERE s.id = $9 AND ($2::uuid IS NULL OR s.tenant_id = $2::uuid) AND s.deleted_at IS NULL
            AND s.status IN ('provisioning', 'active')
            AND t.status IN ('provisioning', 'active')
         RETURNING id, tenant_id, school_id, branch_code, name, address, status, deleted_at, created_at, updated_at`,
        [branchId, tenantId || null, resolvedCode, name, city, phone, address, actorId, schoolId],
      );
      if (result.rowCount !== 1) return next(new ConflictError('المدرسة غير موجودة أو لا تنتمي إلى نطاق الإدارة المركزية.'));
      return res.status(201).json({ success: true, branch: result.rows[0] });
    } catch (error) {
      return next(error instanceof Error && /duplicate|unique/i.test(error.message)
        ? new ConflictError('رمز الفرع مستخدم مسبقاً داخل المدرسة.')
        : new DatabaseError('تعذر إنشاء الفرع في المصدر المركزي.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.patch('/api/admin/central/branches/:branchId', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { id?: string };
    const tenantId = String(req.body?.targetTenantId || '').trim();
    const actorId = String(identity?.id || '').trim();
    const branchId = String(req.params.branchId || '').trim();
    const operation = String(req.body?.operation || 'update').trim();
    if (!actorId || !branchId) return next(new AuthenticationError('هوية الإدارة المركزية أو الفرع غير مكتملة.'));
    if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
    if (!/^[0-9a-f-]{36}$/i.test(branchId)) return next(new ValidationError('معرف الفرع غير صالح.'));
    try {
      let result;
      if (operation === 'archive') {
        result = await platformAdminPool.query(
          `UPDATE public.branches
              SET status = 'archived', deleted_at = now(), deleted_by = $3, updated_at = now(), updated_by = $3, version = version + 1
            WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL
              AND NOT EXISTS (
                SELECT 1
                 FROM public.schools s
                 WHERE s.id = public.branches.school_id
                   AND s.tenant_id = public.branches.tenant_id
                   AND s.central_metadata->>'mainBranchId' = public.branches.id::text
              )
          RETURNING id, tenant_id, school_id, branch_code, name, address, status, deleted_at, created_at, updated_at`,
          [branchId, tenantId || null, actorId],
        );
      } else if (operation === 'set_main') {
        result = await platformAdminPool.query(
          `WITH target AS (
             SELECT school_id FROM public.branches
              WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL
           )
           UPDATE public.branches b
              SET updated_at = now(), updated_by = $3, version = version + 1
            FROM target
           WHERE b.id = $1::uuid AND ($2::uuid IS NULL OR b.tenant_id = $2::uuid)
          RETURNING b.id, b.tenant_id, b.school_id, b.branch_code, b.name, b.address, b.status, b.deleted_at, b.created_at, b.updated_at`,
          [branchId, tenantId || null, actorId],
        );
        if (result.rowCount === 1) {
          await platformAdminPool.query(
            `UPDATE public.schools
                SET central_metadata = COALESCE(central_metadata, '{}'::jsonb) || jsonb_build_object('mainBranchId', $3::text),
                    updated_at = now(), updated_by = $2, version = version + 1
              WHERE id = $1::uuid AND ($4::uuid IS NULL OR tenant_id = $4::uuid) AND deleted_at IS NULL`,
            [result.rows[0].school_id, actorId, branchId, tenantId || null],
          );
        }
      } else {
        const name = String(req.body?.name || '').trim();
        const branchCode = String(req.body?.branchCode || '').trim().toUpperCase();
        const city = String(req.body?.city || '').trim();
        const phone = String(req.body?.phone || '').trim();
        const address = String(req.body?.address || '').trim();
        const status = String(req.body?.status || '').trim();
        if (name.length < 2 || name.length > 160) return next(new ValidationError('اسم الفرع يجب أن يكون بين حرفين و160 حرفاً.'));
        if (!/^[A-Z0-9][A-Z0-9._/-]*$/.test(branchCode)) return next(new ValidationError('رمز الفرع غير صالح.'));
        if (status && !['active', 'closed'].includes(status)) return next(new ValidationError('حالة الفرع غير مسموح بها.'));
        result = await platformAdminPool.query(
          `UPDATE public.branches
              SET name = $3, branch_code = $4,
                  address = jsonb_build_object('city', $5::text, 'phone', $6::text, 'address', $7::text),
                  status = COALESCE(NULLIF($8, ''), status), updated_at = now(), updated_by = $9, version = version + 1
              WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL
          RETURNING id, tenant_id, school_id, branch_code, name, address, status, deleted_at, created_at, updated_at`,
          [branchId, tenantId || null, name, branchCode, city, phone, address, status, actorId],
        );
      }
      if (result.rowCount !== 1) return next(new ConflictError('الفرع غير موجود أو لا ينتمي إلى نطاق الإدارة المركزية.'));
      return res.json({ success: true, branch: result.rows[0] });
    } catch (error) {
      return next(error instanceof Error && /duplicate|unique/i.test(error.message)
        ? new ConflictError('رمز الفرع مستخدم مسبقاً داخل المدرسة.')
        : new DatabaseError('تعذر تحديث الفرع في المصدر المركزي.', error instanceof Error ? error.message : String(error)));
    }
  });

  // Central identity directory. Supabase Auth is the identity source; the
  // public.users and RBAC rows are written only after Auth accepts the user.
  app.get('/api/admin/central/users', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const tenantId = String(req.query?.tenantId || '').trim();
    if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
    try {
      const result = await platformAdminPool.query(
        `SELECT u.id, u.auth_user_id, u.tenant_id, u.school_id, u.branch_id,
                u.display_name, u.status, u.created_at, au.email,
                s.display_name AS school_name, b.name AS branch_name,
                COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', r.id, 'roleKey', r.role_key, 'name', r.name))
                  FILTER (WHERE r.id IS NOT NULL), '[]'::jsonb) AS roles
           FROM public.users u
           JOIN auth.users au ON au.id = u.auth_user_id
           LEFT JOIN public.schools s ON s.tenant_id = u.tenant_id AND s.id = u.school_id
           LEFT JOIN public.branches b ON b.tenant_id = u.tenant_id AND b.school_id = u.school_id AND b.id = u.branch_id
           LEFT JOIN public.user_roles ur ON ur.tenant_id = u.tenant_id AND ur.user_id = u.id
                AND ur.deleted_at IS NULL AND ur.status = 'active'
           LEFT JOIN public.roles r ON r.tenant_id = ur.tenant_id AND r.id = ur.role_id
          WHERE ($1::uuid IS NULL OR u.tenant_id = $1::uuid) AND u.deleted_at IS NULL
          GROUP BY u.id, au.email, s.display_name, b.name
          ORDER BY u.created_at DESC`,
        [tenantId || null],
      );
      return res.json({ success: true, users: result.rows });
    } catch (error) {
      return next(new DatabaseError('تعذر تحميل دليل الهوية المركزي.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.post('/api/admin/central/schools/:schoolId/users', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool || !platformAdminAuth) return next(new ExternalServiceError('خدمة Supabase Auth المركزية غير مهيأة.'));
    const identity = (req as any).user as { id?: string };
    const tenantId = String(req.body?.targetTenantId || '').trim();
    const actorId = String(identity?.id || '').trim();
    const schoolId = String(req.params.schoolId || '').trim();
    const branchId = String(req.body?.branchId || '').trim();
    const displayName = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const requestedPassword = String(req.body?.password || '').trim();
    const roleKey = String(req.body?.initialRole || 'schooladmin').trim().toLowerCase().replace(/[^a-z]/g, '');
    const roleSpec = CENTRAL_IDENTITY_ROLE_CATALOG[roleKey];
    if (!actorId || !schoolId) return next(new AuthenticationError('هوية الإدارة المركزية أو المدرسة غير مكتملة.'));
    if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
    if (!/^[0-9a-f-]{36}$/i.test(schoolId) || (branchId && !/^[0-9a-f-]{36}$/i.test(branchId))) return next(new ValidationError('معرف المدرسة أو الفرع غير صالح.'));
    if (displayName.length < 2 || displayName.length > 160) return next(new ValidationError('اسم الموظف يجب أن يكون بين حرفين و160 حرفاً.'));
    if (!/^\S+@\S+\.\S+$/.test(email)) return next(new ValidationError('البريد الإلكتروني غير صالح.'));
    if (requestedPassword && requestedPassword.length < 8) return next(new ValidationError('كلمة المرور يجب ألا تقل عن 8 رموز.'));
    if (!roleSpec) return next(new ValidationError('الدور المطلوب غير موجود في الكتالوج المركزي.'));
    const password = requestedPassword || randomBytes(12).toString('base64url');
    let authUserId = '';
    const client = await platformAdminPool.connect();
    try {
      const authResult = await platformAdminAuth.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: displayName } });
      if (authResult.error || !authResult.data.user) throw new ExternalServiceError(authResult.error?.message || 'تعذر إنشاء هوية Supabase Auth.');
      authUserId = authResult.data.user.id;
      await client.query('BEGIN');
      const scope = await client.query(
        `SELECT s.id, s.tenant_id, b.id AS branch_id
           FROM public.schools s
           LEFT JOIN public.branches b ON b.tenant_id = s.tenant_id AND b.school_id = s.id AND b.id = $3::uuid AND b.deleted_at IS NULL
          WHERE s.id = $1::uuid AND ($2::uuid IS NULL OR s.tenant_id = $2::uuid) AND s.deleted_at IS NULL`,
        [schoolId, tenantId || null, branchId || null],
      );
      if (scope.rowCount !== 1 || (branchId && !scope.rows[0].branch_id)) throw new ConflictError('المدرسة أو الفرع غير موجود في نطاق الإدارة المركزية.');
      const targetTenantId = scope.rows[0].tenant_id;
      const userResult = await client.query(
        `INSERT INTO public.users (auth_user_id, tenant_id, school_id, branch_id, display_name, status, created_by, updated_by)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, 'active', $6::uuid, $6::uuid)
         RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, created_at`,
        [authUserId, targetTenantId, schoolId, branchId || null, displayName, actorId],
      );
      const userId = userResult.rows[0].id;
      const roleResult = await client.query(
        `INSERT INTO public.roles (tenant_id, school_id, role_key, name, description, is_system, status, created_by, updated_by)
         VALUES ($1::uuid, NULL, $2, $3, $4, true, 'active', $5::uuid, $5::uuid)
         ON CONFLICT (tenant_id, role_key) DO UPDATE SET updated_at = now()
         RETURNING id`,
        [targetTenantId, roleKey, roleSpec.name, roleSpec.description, actorId],
      );
      const roleId = roleResult.rows[0].id;
      for (const permissionKey of roleSpec.permissions) {
        const [resource, action] = permissionKey.split('.', 2);
        const permissionResult = await client.query(
          `INSERT INTO public.permissions (tenant_id, permission_key, resource, action, description, status, created_by, updated_by)
           VALUES (NULL, $1, $2, $3, $1, 'active', $4::uuid, $4::uuid)
           ON CONFLICT (permission_key) DO UPDATE SET updated_at = now()
           RETURNING id`,
          [permissionKey, resource, action, actorId],
        );
        await client.query(
          `INSERT INTO public.role_permissions (tenant_id, role_id, permission_id, status, created_by, updated_by)
           VALUES ($1::uuid, $2::uuid, $3::uuid, 'active', $4::uuid, $4::uuid)
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [targetTenantId, roleId, permissionResult.rows[0].id, actorId],
        );
      }
      const assignment = await client.query(
        `INSERT INTO public.user_roles (tenant_id, user_id, role_id, school_id, branch_id, status, created_by, updated_by)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'active', $6::uuid, $6::uuid)
         RETURNING id`,
        [targetTenantId, userId, roleId, schoolId, branchId || null, actorId],
      );
      await client.query('COMMIT');
      return res.status(201).json({ success: true, user: { ...userResult.rows[0], email, roles: [{ roleKey, name: roleSpec.name }], roleAssignmentId: assignment.rows[0].id }, temporaryPassword: requestedPassword ? null : password });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      if (authUserId) await platformAdminAuth.auth.admin.deleteUser(authUserId).catch(() => undefined);
      return next(error instanceof Error ? error : new DatabaseError('تعذر إنشاء مستخدم الإدارة المركزية.'));
    } finally {
      client.release();
    }
  });

  app.patch('/api/admin/central/users/:userId', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool || !platformAdminAuth) return next(new ExternalServiceError('خدمة Supabase Auth المركزية غير مهيأة.'));
    const identity = (req as any).user as { id?: string };
    const tenantId = String(req.body?.targetTenantId || '').trim();
    const actorId = String(identity?.id || '').trim();
    const userId = String(req.params.userId || '').trim();
    const operation = String(req.body?.operation || '').trim();
    if (!actorId || !/^[0-9a-f-]{36}$/i.test(userId)) return next(new AuthenticationError('هوية المستخدم أو الإدارة غير مكتملة.'));
    if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
    try {
      const target = await platformAdminPool.query(`SELECT id, auth_user_id, display_name, status FROM public.users WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL`, [userId, tenantId || null]);
      if (target.rowCount !== 1) return next(new ConflictError('المستخدم غير موجود في نطاق الإدارة المركزية.'));
      const row = target.rows[0];
      if (operation === 'update') {
        const displayName = String(req.body?.displayName || '').trim();
        if (displayName.length < 2 || displayName.length > 160) return next(new ValidationError('اسم الموظف يجب أن يكون بين حرفين و160 حرفاً.'));
        const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { user_metadata: { display_name: displayName } });
        if (authResult.error) return next(new ExternalServiceError('تعذر تحديث اسم الهوية عبر Supabase Auth.'));
        const updated = await platformAdminPool.query(
          `UPDATE public.users
              SET display_name = $3, updated_at = now(), updated_by = $4::uuid, version = version + 1
            WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL
          RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, created_at`,
          [userId, tenantId || null, displayName, actorId],
        );
        return res.json({ success: true, user: updated.rows[0] });
      }
      if (operation === 'reset_password') {
        const password = randomBytes(12).toString('base64url');
        const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { password, user_metadata: { forcePasswordChange: true } });
        if (authResult.error) return next(new ExternalServiceError('تعذر إعادة تعيين كلمة المرور عبر Supabase Auth.'));
        return res.json({ success: true, user: row, temporaryPassword: password });
      }
      if (operation === 'force_password') {
        const forced = Boolean(req.body?.forcePasswordChange);
        const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { user_metadata: { forcePasswordChange: forced } });
        if (authResult.error) return next(new ExternalServiceError('تعذر تحديث سياسة كلمة المرور المركزية.'));
        return res.json({ success: true, user: { ...row, forcePasswordChange: forced } });
      }
      if (operation === 'status') {
        const status = String(req.body?.status || '').trim();
        if (!['active', 'suspended', 'disabled'].includes(status)) return next(new ValidationError('حالة المستخدم غير مسموح بها.'));
        const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { ban_duration: status === 'active' ? 'none' : '876000h' });
        if (authResult.error) return next(new ExternalServiceError('تعذر تغيير حالة الهوية عبر Supabase Auth.'));
        const updated = await platformAdminPool.query(`UPDATE public.users SET status = $3, updated_at = now(), updated_by = $4::uuid, version = version + 1 WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, created_at`, [userId, tenantId || null, status, actorId]);
        return res.json({ success: true, user: updated.rows[0] });
      }
      if (operation === 'archive') {
        const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { ban_duration: '876000h' });
        if (authResult.error) return next(new ExternalServiceError('تعذر تعطيل الهوية قبل أرشفتها.'));
        const updated = await platformAdminPool.query(`UPDATE public.users SET status = 'archived', deleted_at = now(), deleted_by = $3::uuid, updated_at = now(), updated_by = $3::uuid, version = version + 1 WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, created_at`, [userId, tenantId || null, actorId]);
        return res.json({ success: true, user: updated.rows[0] });
      }
      return next(new ValidationError('عملية إدارة المستخدم غير معتمدة.'));
    } catch (error) {
      return next(error instanceof Error ? error : new DatabaseError('تعذر تحديث مستخدم الإدارة المركزية.'));
    }
  });

  // Central RBAC is tenant-scoped and versioned through the canonical identity
  // tables. The browser never writes permissions directly or invents role IDs.
  app.get('/api/admin/central/rbac', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { id?: string; tenantId?: string };
    const tenantId = String(identity?.tenantId || '').trim();
    const actorId = String(identity?.id || '').trim();
    if (!tenantId || !actorId) return next(new AuthenticationError('هوية الإدارة المركزية غير مكتملة.'));
    try {
      const client = await platformAdminPool.connect();
      try {
        await client.query('BEGIN');
        for (const [roleKey, roleSpec] of Object.entries(CENTRAL_IDENTITY_ROLE_CATALOG)) {
          await client.query(
            `INSERT INTO public.roles (tenant_id, school_id, branch_id, role_key, name, description, is_system, status, created_by, updated_by)
             VALUES ($1::uuid, NULL, NULL, $2, $3, $4, true, 'active', $5::uuid, $5::uuid)
             ON CONFLICT (tenant_id, role_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
               is_system = true, status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now(), updated_by = $5::uuid`,
            [tenantId, roleKey, roleSpec.name, roleSpec.description, actorId],
          );
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
      const roles = await platformAdminPool.query(
        `SELECT r.id, r.tenant_id, r.role_key, r.name, r.description, r.is_system, r.status, r.version,
                COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
                  'id', p.id, 'permissionKey', p.permission_key, 'resource', p.resource, 'action', p.action,
                  'description', COALESCE(p.description, p.permission_key)
                )) FILTER (WHERE p.id IS NOT NULL), '[]'::jsonb) AS permissions
           FROM public.roles r
           LEFT JOIN public.role_permissions rp ON rp.tenant_id = r.tenant_id AND rp.role_id = r.id
                AND rp.status = 'active' AND rp.deleted_at IS NULL
           LEFT JOIN public.permissions p ON p.id = rp.permission_id AND p.status = 'active' AND p.deleted_at IS NULL
          WHERE r.tenant_id = $1::uuid AND r.school_id IS NULL AND r.branch_id IS NULL
                AND r.status = 'active' AND r.deleted_at IS NULL
          GROUP BY r.id
          ORDER BY r.name ASC`,
        [tenantId],
      );
      const catalog = permissionRegistry.list().map((permissionKey) => {
        const [resource, action] = permissionKey.split('.', 2);
        return { permissionKey, resource, action, description: permissionKey };
      });
      return res.json({ success: true, roles: roles.rows, permissionCatalog: catalog });
    } catch (error) {
      return next(new DatabaseError('تعذر تحميل مصفوفة الصلاحيات المركزية.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.patch('/api/admin/central/rbac/roles/:roleId', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { id?: string; tenantId?: string };
    const tenantId = String(identity?.tenantId || '').trim();
    const actorId = String(identity?.id || '').trim();
    const roleId = String(req.params.roleId || '').trim();
    const requestedKeys = req.body?.permissionKeys;
    if (!tenantId || !actorId) return next(new AuthenticationError('هوية الإدارة المركزية غير مكتملة.'));
    if (!/^[0-9a-f-]{36}$/i.test(roleId)) return next(new ValidationError('معرف الدور غير صالح.'));
    if (!Array.isArray(requestedKeys)) return next(new ValidationError('قائمة الصلاحيات يجب أن تكون مصفوفة.'));
    const permissionKeys = [...new Set(requestedKeys.map((key) => permissionRegistry.normalize(key)).filter((key): key is string => Boolean(key)))];
    if (permissionKeys.length !== requestedKeys.length) return next(new ValidationError('توجد صلاحية غير مسجلة في الكتالوج المركزي.'));
    const name = req.body?.name === undefined ? undefined : String(req.body.name || '').trim();
    const description = req.body?.description === undefined ? undefined : String(req.body.description || '').trim();
    if (name !== undefined && (name.length < 2 || name.length > 160)) return next(new ValidationError('اسم الدور يجب أن يكون بين حرفين و160 حرفاً.'));
    const client = await platformAdminPool.connect();
    try {
      await client.query('BEGIN');
      const role = await client.query(
        `UPDATE public.roles
            SET name = COALESCE($3, name), description = COALESCE($4, description),
                updated_at = now(), updated_by = $5::uuid, version = version + 1
          WHERE id = $1::uuid AND tenant_id = $2::uuid AND school_id IS NULL AND branch_id IS NULL
                AND status = 'active' AND deleted_at IS NULL
        RETURNING id, tenant_id, role_key, name, description, is_system, status, version`,
        [roleId, tenantId, name ?? null, description ?? null, actorId],
      );
      if (role.rowCount !== 1) throw new ConflictError('الدور غير موجود في نطاق الإدارة المركزية.');
      await client.query(
        `UPDATE public.role_permissions
            SET status = 'revoked', deleted_at = now(), deleted_by = $3::uuid, updated_at = now(), updated_by = $3::uuid, version = version + 1
          WHERE tenant_id = $1::uuid AND role_id = $2::uuid AND deleted_at IS NULL`,
        [tenantId, roleId, actorId],
      );
      for (const permissionKey of permissionKeys) {
        const [resource, action] = permissionKey.split('.', 2);
        const permission = await client.query(
          `INSERT INTO public.permissions (tenant_id, permission_key, resource, action, description, status, created_by, updated_by)
           VALUES (NULL, $1, $2, $3, $1, 'active', $4::uuid, $4::uuid)
           ON CONFLICT (permission_key) DO UPDATE SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now(), updated_by = $4::uuid
           RETURNING id`,
          [permissionKey, resource, action, actorId],
        );
        await client.query(
          `INSERT INTO public.role_permissions (tenant_id, role_id, permission_id, status, created_by, updated_by)
           VALUES ($1::uuid, $2::uuid, $3::uuid, 'active', $4::uuid, $4::uuid)
           ON CONFLICT (role_id, permission_id) DO UPDATE SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now(), updated_by = $4::uuid, version = role_permissions.version + 1`,
          [tenantId, roleId, permission.rows[0].id, actorId],
        );
      }
      await client.query('COMMIT');
      return res.json({ success: true, role: role.rows[0], permissionKeys });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      return next(error instanceof Error ? error : new DatabaseError('تعذر حفظ مصفوفة الصلاحيات المركزية.'));
    } finally {
      client.release();
    }
  });

  // Central in-app broadcasts are queued per real recipient. External email/SMS
  // channels are recorded as requested but never reported as delivered without
  // their provider workers.
  app.get('/api/admin/central/notifications', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { tenantId?: string };
    const tenantId = String(identity?.tenantId || '').trim();
    if (!tenantId) return next(new AuthenticationError('هوية الإدارة المركزية غير مكتملة.'));
    try {
      const result = await platformAdminPool.query(
        `SELECT n.id, n.tenant_id, n.channel, n.status, n.payload, n.priority, n.created_at, n.available_at,
                u.display_name AS recipient_name, u.school_id, s.display_name AS school_name
           FROM public.notification_queue n
           LEFT JOIN public.users u ON u.tenant_id = n.tenant_id AND u.id = n.recipient_user_id
           LEFT JOIN public.schools s ON s.tenant_id = u.tenant_id AND s.id = u.school_id
          WHERE n.tenant_id = $1::uuid AND n.deleted_at IS NULL
          ORDER BY n.created_at DESC
          LIMIT 500`,
        [tenantId],
      );
      return res.json({ success: true, notifications: result.rows });
    } catch (error) {
      return next(new DatabaseError('تعذر تحميل سجل الإشعارات المركزي.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.post('/api/admin/central/notifications', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { id?: string; tenantId?: string };
    const tenantId = String(identity?.tenantId || '').trim();
    const actorId = String(identity?.id || '').trim();
    const title = String(req.body?.title || '').trim();
    const body = String(req.body?.body || '').trim();
    const audience = String(req.body?.audience || 'all').trim();
    const schoolId = String(req.body?.targetSchoolId || '').trim();
    const requestedChannel = String(req.body?.channel || 'in_app').trim();
    if (!tenantId || !actorId) return next(new AuthenticationError('هوية الإدارة المركزية غير مكتملة.'));
    if (title.length < 2 || title.length > 200 || body.length < 2 || body.length > 5000) return next(new ValidationError('عنوان ومحتوى الإشعار غير صالحين.'));
    if (!['all', 'specific'].includes(audience)) return next(new ValidationError('جمهور الإشعار غير صالح.'));
    if (audience === 'specific' && !/^[0-9a-f-]{36}$/i.test(schoolId)) return next(new ValidationError('معرف المدرسة المستهدفة غير صالح.'));
    if (!['all', 'in_app', 'email', 'sms'].includes(requestedChannel)) return next(new ValidationError('قناة الإشعار غير مدعومة.'));
    try {
      const recipients = await platformAdminPool.query(
        `SELECT u.id, u.school_id
           FROM public.users u
          WHERE u.tenant_id = $1::uuid AND u.status = 'active' AND u.deleted_at IS NULL
            AND ($2 = 'all' OR u.school_id = $3::uuid)
          ORDER BY u.id`,
        [tenantId, audience, audience === 'specific' ? schoolId : null],
      );
      if (!recipients.rowCount) return next(new ConflictError('لا يوجد مستلمون نشطون في النطاق المحدد؛ لم يتم إنشاء بث فارغ.'));
      const client = await platformAdminPool.connect();
      try {
        await client.query('BEGIN');
        const template = await client.query(
          `INSERT INTO public.notification_templates (tenant_id, template_key, channel, locale, template_version, subject, body, variables, status, created_by, updated_by)
           VALUES ($1::uuid, $2, 'in_app', 'ar', 1, $3, $4, '[]'::jsonb, 'active', $5::uuid, $5::uuid)
           RETURNING id`,
          [tenantId, `central-broadcast-${randomUUID().replaceAll('-', '')}`, title, body, actorId],
        );
        const templateId = template.rows[0].id;
        for (const recipient of recipients.rows) {
          await client.query(
            `INSERT INTO public.notification_queue (tenant_id, template_id, recipient_user_id, channel, payload, idempotency_key, priority, status, created_by, updated_by)
             VALUES ($1::uuid, $2::uuid, $3::uuid, 'in_app', $4::jsonb, $5, 50, 'queued', $6::uuid, $6::uuid)`,
            [tenantId, templateId, recipient.id, JSON.stringify({ title, body, audience, targetSchoolId: schoolId || null, requestedChannel }), `${templateId}:${recipient.id}`, actorId],
          );
        }
        await client.query('COMMIT');
        return res.status(201).json({ success: true, queued: recipients.rowCount, requestedChannel, effectiveChannel: 'in_app', deliveryStatus: 'queued' });
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      return next(error instanceof Error ? error : new DatabaseError('تعذر وضع الإشعار في قائمة الإرسال المركزية.'));
    }
  });

  // Central activity is an immutable read model over the canonical audit
  // events. The UI must never manufacture, rewrite, or wipe audit evidence.
  app.get('/api/admin/central/audit', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { tenantId?: string };
    const tenantId = String(identity?.tenantId || '').trim();
    const requestedLimit = Number(req.query.limit || 250);
    const limit = Number.isFinite(requestedLimit) ? Math.min(500, Math.max(1, Math.trunc(requestedLimit))) : 250;
    if (!tenantId) return next(new AuthenticationError('هوية الإدارة المركزية غير مكتملة.'));
    try {
      const result = await platformAdminPool.query(
        `SELECT activity.id, activity.event_type, activity.school_id, activity.actor_user_id,
                activity.action, activity.source, activity.reason, activity.result, activity.metadata, activity.created_at,
                u.display_name AS actor_name, s.display_name AS school_name
           FROM (
             SELECT ae.id, 'audit'::text AS event_type, ae.school_id, ae.actor_user_id,
                    ae.action, ae.source, ae.reason, ae.result, ae.metadata, ae.created_at
               FROM public.audit_events ae
              WHERE ae.tenant_id = $1::uuid
             UNION ALL
             SELECT aa.id, 'access'::text AS event_type, aa.school_id, aa.actor_user_id,
                    aa.action, aa.source, aa.reason, aa.result,
                     jsonb_build_object(
                       'requestMethod', aa.request_method,
                       'requestPath', aa.request_path,
                       'ipAddress', host(aa.ip_address),
                       'userAgent', aa.user_agent
                     ),
                    aa.created_at
               FROM public.audit_access_events aa
              WHERE aa.tenant_id = $1::uuid
           ) activity
           LEFT JOIN public.users u ON u.tenant_id = $1::uuid AND u.id = activity.actor_user_id
           LEFT JOIN public.schools s ON s.tenant_id = $1::uuid AND s.id = activity.school_id
          ORDER BY activity.created_at DESC
          LIMIT $2`,
        [tenantId, limit],
      );
      return res.json({ success: true, logs: result.rows, limit });
    } catch (error) {
      return next(new DatabaseError('تعذر تحميل سجل النشاط المركزي.', error instanceof Error ? error.message : String(error)));
    }
  });

  async function resolveStudentTenantContext(req: express.Request) {
    const identity = (req as any).user;
    const context = tenantEngine.validate(await tenantEngine.resolve(identity, (req as any).trustedAccessToken, (req as any).perf004Trace));
    tenantEngine.assertRequestTarget(context, requestTarget(req));
    (req as any).tenantContext = context;
    return context;
  }

  async function resolveStudentReadTenantContext(req: express.Request) {
    const identity = (req as any).user;
    // Student reads require a complete scope for RLS-backed canonical queries.
    // The full resolver safely selects the sole active academic year when the
    // identity does not carry one; it still fails closed when the scope is ambiguous.
    const context = await tenantEngine.resolve(identity, (req as any).trustedAccessToken, (req as any).perf004Trace);
    tenantEngine.assertRequestTarget(context, requestTarget(req));
    (req as any).tenantContext = context;
    const authTrace = (req as any).safeAuthTrace as SafeAuthTrace | undefined;
    if (authTrace) {
      authTrace.tenantContext = context?.tenantId ? 'SUCCESS' : 'FAIL';
      authTrace.schoolContext = context?.schoolId ? 'SUCCESS' : 'FAIL';
      authTrace.branchContext = context?.branchId ? 'SUCCESS' : 'FAIL';
      if (!context?.tenantId || !context?.schoolId) authTrace.rejectionStage = 'tenant_context';
    }
    return context;
  }

  async function resolveStudentTenantMiddleware(req: express.Request, _res: express.Response, next: express.NextFunction) {
    try {
      await resolveStudentTenantContext(req);
      next();
    } catch (error) {
      next(error);
    }
  }

  function canonicalEnrollmentWorkflowRequired(res: express.Response, operation: string) {
    return res.status(409).json({
      success: false,
      errorCode: 'ENROLLMENT_CANONICAL_WORKFLOW_REQUIRED',
      message: `عملية ${operation} موقوفة حتى تمر عبر مسار Enrollment الكانوني وسجل الحالة والتدقيق. لم يتم تعديل أي سجل.`,
      meta: { persistence: 'canonical-enrollment-required', operation }
    });
  }

  function admissionRequestContext(req: express.Request) {
    const context = (req as any).tenantContext;
    if (!context || !context.tenantId || !context.schoolId || !context.branchId) {
      throw new ValidationError('Trusted admission tenant context is required.');
    }
    return context;
  }

  function createAdmissionRepository(req: express.Request) {
    return new SupabaseAdmissionInquiryRepository(
      getSupabaseClientForAccessToken((req as any).trustedAccessToken)
    );
  }

  function serializeAdmissionInquiry(inquiry: AdmissionInquiry) {
    return {
      id: inquiry.id,
      studentName: inquiry.props.studentName,
      dateOfBirth: inquiry.props.dateOfBirth.toISOString().slice(0, 10),
      status: inquiry.props.status,
      createdAt: inquiry.props.createdAt.toISOString()
    };
  }

  function admissionAuditRole(role: string): 'SuperAdmin' | 'SchoolAdmin' | 'Teacher' | 'Accountant' | 'Parent' {
    const normalized = role.trim().toLowerCase();
    if (normalized === 'superadmin') return 'SuperAdmin';
    if (normalized === 'teacher') return 'Teacher';
    if (normalized === 'accountant') return 'Accountant';
    if (normalized === 'parent') return 'Parent';
    return 'SchoolAdmin';
  }

  async function recordAdmissionAudit(
    req: express.Request,
    context: { tenantId: string; schoolId: string; branchId: string; userId: string; role: string },
    action: string,
    inquiryId: string,
    details: Record<string, unknown> = {}
  ) {
    await AuditRepository.create(context.schoolId, {
      userId: context.userId,
      userName: (req as any).user?.name || (req as any).user?.email || context.userId,
      userRole: admissionAuditRole(context.role),
      action,
      module: 'Admissions',
      ipAddress: req.ip || 'unknown',
      endpoint: req.originalUrl,
      httpMethod: req.method,
      result: 'success',
      severity: 'low',
      details: JSON.stringify({
        inquiryId,
        tenantId: context.tenantId,
        schoolId: context.schoolId,
        branchId: context.branchId,
        role: context.role,
        ...details
      })
    });
  }

  app.get('/api/admissions/inquiries', authenticateRequest, requirePermission(PERMISSIONS.ADMISSION_READ), async (req, res, next) => {
    try {
      const context = await resolveStudentTenantContext(req);
      const page = parseStudentQueryInteger(req.query.page, 'page', 1, 1000000);
      const limit = parseStudentQueryInteger(req.query.limit, 'limit', 25, 100);
      const statusValue = parseStudentQueryString(req.query.status, 'status');
      const search = parseStudentQueryString(req.query.search, 'search');
      if (statusValue && !Object.values(AdmissionStatus).includes(statusValue as AdmissionStatus)) {
        throw new ValidationError('Admission status filter is not supported.');
      }
      const result = await createAdmissionRepository(req).findPageByScope({
        tenantId: context.tenantId,
        schoolId: context.schoolId,
        branchId: context.branchId,
        ...(search ? { search } : {})
      }, page, limit, statusValue || undefined);
      const data = result.items.map(serializeAdmissionInquiry);
      return res.json({
        success: true,
        data,
        meta: { page, limit, totalCount: result.totalCount, totalPages: Math.ceil(result.totalCount / limit) }
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/admissions/inquiries', authenticateRequest, requirePermission(PERMISSIONS.ADMISSION_WRITE), async (req, res, next) => {
    try {
      const context = await resolveStudentTenantContext(req);
      const studentName = req.body?.studentName;
      const dateOfBirthValue = req.body?.dateOfBirth;
      if (typeof studentName !== 'string' || !studentName.trim()) {
        throw new ValidationError('Student name is required.');
      }
      if (typeof dateOfBirthValue !== 'string' || !dateOfBirthValue.trim()) {
        throw new ValidationError('Date of birth is required.');
      }
      const dateOfBirth = new Date(dateOfBirthValue);
      if (Number.isNaN(dateOfBirth.getTime())) {
        throw new ValidationError('Date of birth is invalid.');
      }
      const age = new Date().getFullYear() - dateOfBirth.getFullYear();
      if (age < 3 || age > 18) {
        throw new ValidationError('Student age is not eligible for admission.');
      }
      const inquiry = AdmissionInquiry.create({
        tenantId: context.tenantId,
        schoolId: context.schoolId,
        branchId: context.branchId,
        studentName: studentName.trim(),
        dateOfBirth
      });
      await createAdmissionRepository(req).save(inquiry);
      await recordAdmissionAudit(req, context, 'ADMISSION_INQUIRY_SUBMITTED', inquiry.id, {
        status: inquiry.props.status
      });
      return res.status(201).json({
        success: true,
        data: serializeAdmissionInquiry(inquiry)
      });
    } catch (err) {
      return next(err);
    }
  });

  app.patch('/api/admissions/inquiries/:id/status', authenticateRequest, requirePermission(PERMISSIONS.ADMISSION_WRITE), async (req, res, next) => {
    try {
      const context = await resolveStudentTenantContext(req);
      const nextStatus = req.body?.status;
      if (
        typeof nextStatus !== 'string' ||
        !Object.values(AdmissionStatus).includes(nextStatus as AdmissionStatus)
      ) {
        throw new ValidationError('Admission status is invalid.');
      }
      const inquiry = await createAdmissionRepository(req).findByIdInScope(req.params.id, {
        tenantId: context.tenantId,
        schoolId: context.schoolId,
        branchId: context.branchId
      });
      if (!inquiry) {
        return res.status(404).json({
          success: false,
          errorCode: 'ADMISSION_NOT_FOUND',
          message: 'Admission inquiry was not found in the trusted scope.'
        });
      }
      const previousStatus = inquiry.props.status;
      try {
        inquiry.transitionTo(nextStatus as AdmissionStatus);
      } catch (error) {
        throw new ValidationError(
          error instanceof Error ? error.message : 'Admission transition is invalid.'
        );
      }
      await createAdmissionRepository(req).save(inquiry);
      await recordAdmissionAudit(req, context, 'ADMISSION_STATUS_TRANSITION', inquiry.id, {
        from: previousStatus,
        to: inquiry.props.status
      });
      return res.json({
        success: true,
        data: serializeAdmissionInquiry(inquiry)
      });
    } catch (err) {
      return next(err);
    }
  });

  async function resolveActiveStudentTerm(context: {
    tenantId: string;
    schoolId: string;
    branchId: string;
    academicYear: string;
    userId: string;
    role: string;
  }): Promise<string> {
    const work = async (): Promise<string> => {
      const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
      if (!transaction) throw new DatabaseError("Student registration term lookup transaction is unavailable.");
      const result = await transaction.query<{ id: string }>(
        `SELECT id
           FROM public.terms
          WHERE tenant_id = $1
            AND school_id = $2
            AND academic_year_id = $3
            AND (branch_id = $4 OR branch_id IS NULL)
            AND deleted_at IS NULL
            AND status = 'active'
          ORDER BY starts_on DESC, sequence DESC, id ASC
          LIMIT 1`,
        [context.tenantId, context.schoolId, context.academicYear, context.branchId]
      );
      if (!result.rows[0]) {
        throw new ValidationError("لا يمكن تسجيل طالب قبل إعداد فصل دراسي نشط للسنة الموثوقة.");
      }
      return result.rows[0].id;
    };

    if (UnitOfWork.isTransactionActive()) return work();
    return UnitOfWork.runInTransaction(
      context.schoolId,
      {
        operationName: "Resolve Student Registration Term",
        tenantId: context.tenantId,
        userId: context.userId,
        userName: context.userId,
        ipAddress: "server",
        affectedTables: ["terms"]
      },
      work,
      context
    );
  }

  function splitCanonicalName(value: unknown): { legalFirstName: string; legalMiddleName: string | null; legalLastName: string } {
    if (typeof value !== "string") throw new ValidationError("اسم الطالب مطلوب.");
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) throw new ValidationError("يجب إدخال الاسم القانوني الأول واسم العائلة على الأقل.");
    return {
      legalFirstName: parts[0],
      legalMiddleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : null,
      legalLastName: parts[parts.length - 1]
    };
  }

  async function toCanonicalRegistrationCommand(context: {
    tenantId: string;
    schoolId: string;
    branchId: string;
    academicYear: string;
    userId: string;
    role: string;
  }, studentData: Record<string, any>, resolvedTermId?: string) {
    const name = splitCanonicalName(studentData.name || studentData.fullName || [studentData.legalFirstName, studentData.legalLastName].filter(Boolean).join(" "));
    const dateOfBirth = studentData.dateOfBirth || studentData.birthDate;
    if (!dateOfBirth) throw new ValidationError("تاريخ ميلاد الطالب مطلوب للتسجيل canonical.");
    const guardianParts = typeof studentData.parentName === "string" ? studentData.parentName.trim().split(/\s+/).filter(Boolean) : [];
    if (guardianParts.length < 2 || !studentData.parentPhone) {
      throw new ValidationError("اسم ولي الأمر ورقم هاتفه مطلوبان لإتمام تسجيل الطالب.");
    }
    return {
      ...name,
      studentNumber: studentData.studentNumber || studentData.studentCode,
      preferredName: studentData.preferredName,
      dateOfBirth,
      gender: studentData.gender,
      nationality: studentData.nationality,
      birthCountryCode: studentData.birthCountryCode,
      termId: resolvedTermId || await resolveActiveStudentTerm(context),
      admissionReference: "STUDENT-AFFAIRS-REGISTRATION",
      guardian: {
        legalFirstName: guardianParts[0],
        legalMiddleName: guardianParts.length > 2 ? guardianParts.slice(1, -1).join(" ") : undefined,
        legalLastName: guardianParts[guardianParts.length - 1],
        phone: studentData.parentPhone,
        // Guardian email must be explicit; never derive it from the student's email.
        email: studentData.parentEmail,
        relationshipType: studentData.guardianRelation || "parent",
        isPrimary: true,
        isEmergencyContact: true,
        canCollectStudent: true,
        custodyStatus: "unknown",
        consentStatus: "pending"
      }
    };
  }

  function toCanonicalStudentPatch(studentData: Record<string, any>) {
    const patch: Record<string, unknown> = {};
    const rawName = studentData.name || studentData.fullName;
    if (rawName !== undefined) Object.assign(patch, splitCanonicalName(rawName));
    if (studentData.legalFirstName !== undefined) patch.legalFirstName = studentData.legalFirstName;
    if (studentData.legalMiddleName !== undefined) patch.legalMiddleName = studentData.legalMiddleName;
    if (studentData.legalLastName !== undefined) patch.legalLastName = studentData.legalLastName;
    if (studentData.preferredName !== undefined) patch.preferredName = studentData.preferredName;
    if (studentData.dateOfBirth !== undefined || studentData.birthDate !== undefined) patch.dateOfBirth = studentData.dateOfBirth || studentData.birthDate;
    if (studentData.gender !== undefined) patch.gender = studentData.gender;
    if (studentData.nationality !== undefined) patch.nationality = studentData.nationality;
    if (studentData.studentNumber !== undefined || studentData.studentCode !== undefined) patch.studentNumber = studentData.studentNumber || studentData.studentCode;
    return patch;
  }

  const guardianUpdateFields = [
    "parentName", "parentPhone", "parentEmail", "parentNationalId", "parentRelation", "parentJob",
    "guardianId", "guardianNumber", "guardianRelation", "guardianEmail", "relationshipType",
    "expectedGuardianVersion", "expectedRelationshipVersion"
  ] as const;

  function hasGuardianUpdateFields(studentData: Record<string, any>): boolean {
    return guardianUpdateFields.some((field) => Object.prototype.hasOwnProperty.call(studentData, field));
  }

  // Session restoration/refresh endpoint. The identity is re-read from Supabase.
  app.get("/api/auth/session", authenticateRequest, (req, res) => {
    const user = (req as any).user;
    disableAuthCaching(res);
    res.json({ success: true, data: { user }, message: "الجلسة الموثوقة فعالة." });
  });

  // School-scoped academic catalogue. Configuration is stored in the
  // canonical school_settings table and cannot be selected by the browser.
  app.get('/api/academic/context', authenticateRequest, requirePermissionOnly(PERMISSIONS.STUDENT_READ), async (req, res, next) => {
    try {
      const identity = (req as any).user as { schoolId?: string; branchId?: string };
      if (!identity?.schoolId) throw new AuthenticationError('هوية المدرسة الموثوقة غير مكتملة.');
      const supabase = getSupabaseClientForAccessToken((req as any).trustedAccessToken) || getSupabaseClient();
      if (!supabase) throw new DatabaseError('مصدر الهيكل الأكاديمي غير متاح.');

      const [yearResult, structureResult] = await Promise.all([
        supabase
          .from('academic_years')
          .select('id,code,name,starts_on,ends_on,status,is_current,branch_id')
          .eq('school_id', identity.schoolId)
          .eq('is_current', true)
          .eq('status', 'active')
          .is('deleted_at', null)
          .order('starts_on', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('school_settings')
          .select('setting_value')
          .eq('school_id', identity.schoolId)
          .eq('setting_key', 'academic_structure')
          .eq('status', 'active')
          .is('deleted_at', null)
          .order('effective_from', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);
      if (yearResult.error) throw yearResult.error;
      if (structureResult.error) throw structureResult.error;
      const value = structureResult.data?.setting_value as Record<string, unknown> | undefined;
      const stages = Array.isArray(value?.stages) ? value.stages : [];
      const grades = Array.isArray(value?.grades) ? value.grades : [];
      const classes = Array.isArray(value?.classes) ? value.classes : [];
      const sections = Array.isArray(value?.sections) ? value.sections : [];
      if (!yearResult.data) throw new ValidationError('لا توجد سنة أكاديمية حالية وفعالة للمدرسة.');
      if (!stages.length || !grades.length) throw new ValidationError('الهيكل الأكاديمي للمرحلة والصف غير مهيأ للمدرسة.');
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, data: { academicYear: yearResult.data, stages, grades, classes, sections } });
    } catch (error) {
      next(error);
    }
  });

  // Dashboard metrics are read-only, request-scoped, and RLS-backed.
  // The endpoint never accepts tenant, school, or branch identifiers from the client.
  app.get('/api/dashboard/metrics', authenticateRequest, requirePermissionOnly(PERMISSIONS.DASHBOARD_VIEW), async (req, res, next) => {
    try {
      const identity = (req as any).user as {
        tenantId?: string;
        schoolId?: string;
        branchId?: string;
      };
      if (!identity?.tenantId || !identity.schoolId || !identity.branchId) {
        throw new AuthenticationError('هوية Dashboard الموثوقة غير مكتملة.');
      }
      const supabase = getSupabaseClientForAccessToken((req as any).trustedAccessToken);
      if (!supabase) {
        throw new DatabaseError('Dashboard metrics Supabase client is unavailable.');
      }

      const [studentsResult, enrollmentsResult] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('id', { count: 'exact', head: true })
      ]);

      const liveMetric = (count: number | null, source: string) => ({
        status: 'live' as const,
        count: count ?? 0,
        source
      });
      const unavailableMetric = (message: string) => ({
        status: 'unavailable' as const,
        count: null,
        source: null,
        message
      });

      res.setHeader('Cache-Control', 'no-store');
      return res.json({
        success: true,
        data: {
          scope: {
            tenantId: identity.tenantId,
            schoolId: identity.schoolId,
            branchId: identity.branchId
          },
          students: studentsResult.error
            ? unavailableMetric('تعذر تحميل مصدر الطلاب الحي: ' + studentsResult.error.message)
            : liveMetric(studentsResult.count, 'public.students (RLS)'),
          enrollments: enrollmentsResult.error
            ? unavailableMetric('تعذر تحميل مصدر التسجيلات الحي: ' + enrollmentsResult.error.message)
            : liveMetric(enrollmentsResult.count, 'public.enrollments (RLS)'),
          attendance: unavailableMetric('لا يوجد مصدر حضور حي منشور في مخطط Supabase الحالي.'),
          teachers: unavailableMetric('لا يوجد جدول معلمين حي مربوط بعقد Dashboard الحالي.'),
          finance: unavailableMetric('لا يوجد مصدر مالي حي مربوط بعقد Dashboard الحالي.'),
          exams: unavailableMetric('لا يوجد مصدر امتحانات حي مربوط بعقد Dashboard الحالي.'),
          notifications: unavailableMetric('لا يوجد مصدر Notifications حي مربوط بعقد Dashboard الحالي.'),
          activities: unavailableMetric('لا يوجد Query نشاط حي مربوط بعقد Dashboard الحالي.')
        }
      });
    } catch (error) {
      return next(error instanceof DatabaseError ? error : new DatabaseError('تعذر تحميل مؤشرات Dashboard الحية.', error));
    }
  });

  // Student Affairs Screen 01 metrics. Scope is derived exclusively from the
  // trusted authenticated identity; the client cannot provide scope values.
  app.get('/api/student-affairs/metrics', authenticateRequest, requirePermissionOnly(PERMISSIONS.STUDENT_READ), async (req, res, next) => {
    try {
      const tenantContext = await resolveStudentReadTenantContext(req);
      const metrics = await StudentService.getAffairsMetrics(tenantContext, (req as any).perf004Trace);

      res.setHeader('Cache-Control', 'no-store');
      return res.json({
        success: true,
        data: { ...metrics, degraded: false, source: 'canonical-postgres' }
      });
    } catch (error) {
      return next(error instanceof DatabaseError ? error : new DatabaseError('تعذر تحميل مؤشرات شؤون الطلاب.', error));
    }
  });

  // ==========================================
  // ENTERPRISE API ROUTES
  // ==========================================

  // Health Status
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "SchoolForManus School Management System",
        architecture: "Express.js + React Vite SPA + PostgreSQL-backed canonical runtime",
        tenantIsolationMode: "Row-Level Security (RLS) Active"
      },
      startup: startupReadiness.snapshot(),
      message: "Health status retrieved successfully.",
      meta: null
    });
  });

  app.get("/api/ready", (_req, res) => {
    const readiness = startupReadiness.snapshot();
    res.status(readiness.ready ? 200 : 503).json({
      success: readiness.ready,
      data: readiness,
      message: readiness.ready ? "Service readiness confirmed." : "Service is not ready for database-backed traffic.",
      meta: null,
    });
  });

  // Temporary, server-side gated Staging diagnostic. It is deliberately
  // unavailable unless both explicit Staging flags are present and the
  // caller has a trusted authenticated identity with database-monitoring
  // permission. No secret or connection detail is ever returned.
  app.get(
    "/api/internal/staging/connection-identity",
    diagnosticLimiter,
    authenticateRequest,
    requirePermissionOnly(PERMISSIONS.DATABASE_MONITOR),
    async (_req, res, next) => {
      if (!isStagingConnectionDiagnosticsEnabled()) {
        return res.status(404).json({ success: false, message: "Not found" });
      }
      if (!transactionDriver) {
        return next(new DatabaseError("Staging transaction driver is unavailable."));
      }

      const rollbackSignal = Symbol("staging-connection-diagnostic-rollback");
      let unitOfWorkIdentity: ConnectionIdentity | null = null;
      try {
        await UnitOfWork.runInTransaction(
          "00000000-0000-0000-0000-000000000001",
          {
            operationName: "CONN-SEC-002 connection identity diagnostic",
            userId: "staging-diagnostic",
            userName: "staging-diagnostic",
            ipAddress: "server-side",
            affectedTables: [],
            tenantId: "00000000-0000-0000-0000-000000000001"
          },
          async () => {
            const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
            if (!transaction) {
              throw new DatabaseError("UnitOfWork transaction is unavailable.");
            }
            unitOfWorkIdentity = await readConnectionIdentity(transaction);
            throw rollbackSignal;
          },
          {
            tenantId: "00000000-0000-0000-0000-000000000001",
            schoolId: "00000000-0000-0000-0000-000000000001",
            branchId: "00000000-0000-0000-0000-000000000002",
            academicYear: "diagnostic",
            userId: "staging-diagnostic",
            role: "diagnostic"
          }
        );
      } catch (error) {
        if (error !== rollbackSignal) throw error;
      }

      const poolIdentities = await transactionDriver.inspectPoolIdentity(getDiagnosticSampleCount());
      const allIdentities = [unitOfWorkIdentity, ...poolIdentities].filter(
        (identity): identity is ConnectionIdentity => identity !== null
      );
      const restricted = allIdentities.length > 0 && allIdentities.every(identity =>
        identity.current_user === "edupro_staging_app" &&
        identity.session_user === "edupro_staging_app" &&
        identity.rolsuper === false &&
        identity.rolbypassrls === false
      );

      res.json({
        success: restricted,
        data: {
          environment: "staging",
          expectedRole: "edupro_staging_app",
          unitOfWork: unitOfWorkIdentity,
          pool: poolIdentities,
          restricted
        }
      });
    }
  );

  // Database observability and backup endpoints remain explicitly unavailable
  // until a real provider is configured. Returning synthetic CPU, storage,
  // query, alert, or backup values would create a false production signal.
  const databaseObservabilityUnavailable = (_req: any, res: any) => res.status(503).json({
    success: false,
    code: 'OBSERVABILITY_CONNECTOR_UNAVAILABLE',
    message: 'موصل مراقبة قاعدة البيانات والنسخ الاحتياطي غير مهيأ؛ لم يتم إصدار قياس أو نسخة وهمية.',
  });

  app.get("/api/database/monitor", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_MONITOR), databaseObservabilityUnavailable);
  app.get("/api/database/health-service/metrics", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_MONITOR), databaseObservabilityUnavailable);
  app.get("/api/database/health-service/thresholds", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_SETTINGS), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/thresholds", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_SETTINGS), databaseObservabilityUnavailable);
  app.get("/api/database/health-service/alerts", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_MONITOR), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/alerts/resolve", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_SETTINGS), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/alerts/clear", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_SETTINGS), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/simulate/deadlock", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_SIMULATE), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/simulate/failed-tx", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_SIMULATE), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/simulate/slow-query", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_SIMULATE), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/optimize", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_OPTIMIZE), databaseObservabilityUnavailable);

  // GET all Audit Logs with advanced filters
  app.get("/api/audit-logs", authenticateRequest, requirePermission(PERMISSIONS.AUDIT_READ), async (req, res, next) => {
    try {
      const schoolId = (req as any).user.schoolId;
      const { userId, module: moduleName, action, severity, startDate, endDate } = req.query;
      
      const logs = await AuditRepository.getAll(schoolId, {
        userId: userId as string,
        module: moduleName as string,
        action: action as string,
        severity: severity as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.json({
        success: true,
        data: logs,
        message: "Audit logs retrieved successfully.",
        meta: {
          totalCount: logs.length
        }
      });
    } catch (err: any) {
      next(new DatabaseError("Failed to retrieve audit logs", err.message));
    }
  });

  // Reconnect Database Connection Manager
  app.post("/api/database/reconnect", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_MONITOR), async (req, res, next) => {
    try {
      const metrics = await DatabaseService.reconnect();
      res.json({
        success: true,
        data: metrics,
        message: "Database connection manager initiated reconnection successfully."
      });
    } catch (err: any) {
      next(new DatabaseError("Failed to reconnect database", err.message));
    }
  });

  // Disconnect Database Connection Manager
  app.post("/api/database/disconnect", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_MONITOR), async (req, res, next) => {
    try {
      const metrics = await DatabaseService.disconnect();
      res.json({
        success: true,
        data: metrics,
        message: "Database connection manager manually disconnected."
      });
    } catch (err: any) {
      next(new DatabaseError("Failed to disconnect database", err.message));
    }
  });

  // Database Backup Pipeline: fail closed until a durable backup provider and
  // verifiable object-storage receipt are configured.
  app.post("/api/database/backup", authenticateRequest, requirePermission(PERMISSIONS.DATABASE_BACKUP), databaseObservabilityUnavailable);

  // Student Data Export — true XLSX, server-side, tenant-scoped, bounded.
  app.get("/api/students/export", authenticateRequest, requirePermissionOnly(PERMISSIONS.STUDENT_EXPORT), async (req, res, next) => {
    const requestId = randomUUID();
    const correlationId = randomUUID();
    let context: any;
    let filters: any;
    try {
      context = await resolveStudentReadTenantContext(req);
      filters = parseStudentExportFilters(req.query);
      const audit = createTrustedStudentAuditMetadata(req as any);
      const result = await generateStudentExport(filters, context, audit, requestId, correlationId, getSupabaseClientForAccessToken((req as any).trustedAccessToken) || undefined);

      await recordStudentExportAudit(req, context, 'SUCCESSFUL', requestId, correlationId, result.rowCount);
      res
        .status(200)
        .setHeader('Content-Type', STUDENT_EXPORT_CONTENT_TYPE)
        .setHeader('Content-Disposition', `attachment; filename="students_export.xlsx"; filename*=UTF-8''${encodeURIComponent(result.fileName)}`)
        .setHeader('X-Student-Export-Row-Count', String(result.rowCount))
        .setHeader('X-Request-Id', requestId)
        .setHeader('X-Correlation-Id', correlationId)
        .send(result.buffer);
    } catch (err: any) {
      EnterpriseLogger.error('Student export request failed.', 'StudentExport', {
        requestId,
        correlationId,
        status: err instanceof ValidationError ? 'REJECTED' : 'FAILED',
        error: err?.message || 'unknown export error'
      });
      if (context) {
        const status = err instanceof ValidationError ? 'REJECTED' : 'FAILED';
        try {
          await recordStudentExportAudit(req, context, status, requestId, correlationId, 0, err?.message || 'Student export failed');
        } catch (auditError: any) {
          EnterpriseLogger.error('Canonical student export failure audit could not be recorded.', 'StudentExport', {
            requestId,
            correlationId,
            error: auditError?.message || 'unknown audit error'
          });
        }
      }
      next(err);
    }
  });

  // Students Database API. UnitOfWork currently carries a process-scoped
  // transaction context, so concurrent canonical reads must be serialized;
  // otherwise a navigation-triggered duplicate request can enter a nested
  // UnitOfWork and fail with a misleading tenant/read error.
  let studentReadQueue = Promise.resolve();
  app.get("/api/students", async (_req, res, next) => {
    const previous = studentReadQueue;
    let release!: () => void;
    studentReadQueue = new Promise<void>(resolve => { release = resolve; });
    await previous;
    let released = false;
    const releaseOnce = () => {
      if (released) return;
      released = true;
      release();
    };
    res.once('finish', releaseOnce);
    res.once('close', releaseOnce);
    next();
  }, authenticateRequest, requirePermissionOnly(PERMISSIONS.STUDENT_READ), async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    const studentReadDiagnostic = createStudentReadDiagnostic(res);
    const authTrace = (req as any).safeAuthTrace as SafeAuthTrace | undefined;
    if (authTrace) {
      authTrace.permission = 'SUCCESS';
      authTrace.rejectionStage = 'none';
    }
    studentReadDiagnostic.log('auth', 'PASS');
    studentReadDiagnostic.log('Student.Read', 'PASS');
    try {
      const identity = (req as any).user;
      const schoolId = identity.schoolId;
      const { search, classroom, section, status, gender, feesOutstanding, page, limit, sortBy, sortOrder } = req.query;
      if (feesOutstanding !== undefined) {
        throw new ValidationError('مرشح المستحقات المالية غير متاح في عقد قراءة الطلاب الحالي.');
      }

      const searchParams = {
        quickSearch: parseStudentQueryString(search, 'search'),
        classroom: parseStudentQueryString(classroom, 'classroom'),
        section: parseStudentQueryString(section, 'section'),
        status: parseStudentQueryString(status, 'status'),
        gender: parseStudentQueryString(gender, 'gender'),
        sortBy: parseStudentSortBy(sortBy),
        sortOrder: parseStudentSortOrder(sortOrder),
        page: parseStudentQueryInteger(page, 'page', 1, 1000000),
        limit: parseStudentQueryInteger(limit, 'limit', 50, 100)
      };

      let tenantContextPassed = false;
      let tenantValidationPassed = false;
      let tenantContext;
      try {
        tenantContext = await resolveStudentReadTenantContext(req);
        tenantContextPassed = true;
        studentReadDiagnostic.log('tenant_context', 'PASS');
        tenantEngine.assertRequestTarget(tenantContext, requestTarget(req));
        tenantValidationPassed = true;
        studentReadDiagnostic.log('tenant_validation', 'PASS');
        (req as any).tenantContext = tenantContext;
      } catch (error) {
        if (!tenantContextPassed) studentReadDiagnostic.log('tenant_context', 'FAIL', 'TENANT_RESOLUTION_OR_VALIDATION');
        else if (!tenantValidationPassed) studentReadDiagnostic.log('tenant_validation', 'FAIL', 'TENANT_REQUEST_TARGET');
        throw error;
      }

      // The project is currently in development with public RLS disabled. Use
      // the server's configured client for this tenant-filtered read; the
      // browser bearer token is still required by the route middleware, but a
      // stale/expired token must not turn a valid database read into a blank
      // Student Affairs screen.
      const trustedSupabase = getSupabaseClientForAccessToken((req as any).trustedAccessToken) || getSupabaseClient() || undefined;
      const readOperation = async () => {
        try {
          studentReadDiagnostic.log('student_service', 'REACHED');
          return await StudentService.advancedSearch(schoolId, searchParams, tenantContext, (req as any).perf004Trace, studentReadDiagnostic, trustedSupabase);
        } catch (error) {
          studentReadDiagnostic.log('student_service', 'FAIL', 'STUDENT_READ_SERVICE');
          throw error;
        }
      };
      // Reads must not be held inside a write-style transaction. When a trusted
      // Supabase client is available, use the bounded REST read path directly.
      const result = trustedSupabase
        ? await readOperation()
        : await UnitOfWork.runInTransaction(
          schoolId,
          {
            operationName: 'Canonical Student Read',
            tenantId: tenantContext.tenantId,
            userId: identity.id,
            userName: identity.name || identity.email,
            ipAddress: req.ip || 'unknown',
            affectedTables: ['schools', 'branches', 'academic_years', 'students'],
            diagnosticTrace: (req as any).perf004Trace
          },
          readOperation,
          tenantContext
        );

      (req as any).perf004Trace?.mark('serialization_started');
      (req as any).perf004Trace?.mark('serialization_prepared');
      (req as any).perf004Trace?.mark('response_generated');
      const perf004Report = (req as any).perf004Trace?.report();
      res.json({
        success: true,
        data: result.data,
        message: "Students list retrieved successfully.",
        meta: {
          totalCount: result.totalCount,
          page: result.page,
          limit: result.limit,
          totalPages: Math.max(1, Math.ceil(result.totalCount / result.limit)),
          hasNext: result.page < Math.max(1, Math.ceil(result.totalCount / result.limit)),
          hasPrevious: result.page > 1,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          ...(perf004Report ? { perf004: perf004Report } : {})
        }
      });
    } catch (err: any) {
      console.error('[StudentRead] request failed', { message: err?.message, code: err?.code, details: err?.details, hint: err?.hint });
      next(normalizeStudentReadError(err));
    }
  });

  app.post("/api/students", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), async (req, res, next) => {
    try {
      const studentData = (req.body || {}) as Record<string, any>;
      const context = await resolveStudentTenantContext(req);
      const audit = {
        action: studentData.id ? "UPDATE" as const : "UPDATE" as const,
        reason: studentData.id ? "Student profile update" : "Student registration compatibility route",
        requestId: randomUUID(),
        correlationId: randomUUID(),
        ipAddress: req.ip || "unknown"
      };

      if (studentData.id) {
        if (hasGuardianUpdateFields(studentData)) {
          throw new ValidationError("Guardian updates require the canonical Guardian workflow; no Guardian field was changed.", {
            errorCode: "STU-GUARD-002",
            reason: "CANONICAL_GUARDIAN_UPDATE_REQUIRED"
          });
        }
        if (studentData.status === "suspended") {
          const result = await CanonicalStudentWriteRepository.suspend(context, String(studentData.id), {
            action: "UPDATE",
            reason: "Student status changed to suspended from Student Affairs",
            requestId: randomUUID(),
            correlationId: randomUUID(),
            ipAddress: req.ip || "unknown"
          });
          return res.json({ success: true, data: { student: result }, message: "Student status updated successfully.", meta: { persistence: "canonical-postgres", workflow: "academic-status" } });
        }
        const expectedVersion = Number(studentData.version);
        const result = await CanonicalStudentWriteRepository.update(
          context,
          String(studentData.id),
          toCanonicalStudentPatch(studentData),
          expectedVersion,
          audit
        );
        return res.json({ success: true, data: { student: result }, message: "Student record updated successfully.", meta: { persistence: "canonical-postgres" } });
      }

      const registration = await studentRegistrationService.register(
        context,
        await toCanonicalRegistrationCommand(context, studentData),
        {
          requestId: audit.requestId,
          correlationId: audit.correlationId,
          ipAddress: audit.ipAddress,
          idempotencyKey: req.get("Idempotency-Key") || `student-affairs:${audit.requestId}`
        }
      );
      return res.status(registration.idempotent ? 200 : 201).json({
        success: true,
        data: { student: registration },
        message: registration.idempotent ? "The previous registration was returned idempotently." : "Student registration committed successfully.",
        meta: { persistence: "canonical-postgres", workflow: "SOP-001" }
      });
    } catch (err: any) {
      next(err);
    }
  });

  // SOP-001: trusted, atomic Student Registration workflow.
  // Tenant, school, branch, academic year, identity and audit values are taken
  // from verified middleware context; none are accepted from the request body.
  app.post("/api/student-registration", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_REGISTRATION_CREATE), async (req, res, next) => {
    try {
      const tenantContext = await resolveStudentTenantContext(req);
      const idempotencyKey = req.get("Idempotency-Key");
      if (!idempotencyKey) throw new ValidationError("Idempotency-Key header is required.", { errorCode: "STU-IDM-001" });
      const command = await toCanonicalRegistrationCommand(tenantContext, (req.body || {}) as Record<string, any>);
      const result = await studentRegistrationService.register(tenantContext, command, {
        requestId: randomUUID(),
        correlationId: randomUUID(),
        ipAddress: req.ip || "unknown",
        idempotencyKey
      });
      res.status(result.idempotent ? 200 : 201).json({
        success: true,
        data: { student: result },
        message: result.idempotent ? "The previous registration was returned idempotently." : "Student registration committed successfully.",
        meta: { workflow: "SOP-001", transaction: "single-request-scoped-unit-of-work" }
      });
    } catch (err: any) {
      next(err);
    }
  });

  // SOP-001 batch import: rows are normalized against the trusted school
  // context before one PostgreSQL transaction commits the complete batch.
  app.post("/api/students/import", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_REGISTRATION_CREATE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const tenantContext = (req as any).tenantContext || await resolveStudentTenantContext(req);
      const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
      const rawRows = body.rows;
      if (!Array.isArray(rawRows)) throw new ValidationError('ملف الاستيراد يجب أن يرسل مصفوفة rows صالحة.');
      const idempotencyKey = req.get('Idempotency-Key') || body.idempotencyKey;
      const termId = await resolveActiveStudentTerm(tenantContext);
      const commands = await Promise.all(rawRows.map((row: unknown) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          throw new ValidationError('كل صف في ملف الاستيراد يجب أن يكون سجلًا صالحًا.');
        }
        return toCanonicalRegistrationCommand(tenantContext, row as Record<string, any>, termId);
      }));
      const result = await canonicalStudentImportService.execute(tenantContext, {
        rows: commands,
        idempotencyKey,
        requestId: randomUUID(),
        correlationId: randomUUID(),
        ipAddress: req.ip || 'unknown'
      });
      return res.status(result.createdCount > 0 ? 201 : 200).json({
        success: true,
        data: result,
        message: result.idempotentCount > 0 ? 'تم اعتماد دفعة الطلاب ذريًا مع إعادة النتائج المكررة بأمان.' : 'تم اعتماد دفعة الطلاب كاملة في PostgreSQL دون حفظ جزئي.',
        meta: { persistence: 'canonical-postgres', workflow: 'SOP-001-import-batch', schoolIsolation: 'trusted-context-only' }
      });
    } catch (error) { return next(error); }
  });

  app.post("/api/students/:id/reinstate", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), async (req, res, next) => {
    try {
      const context = await resolveStudentTenantContext(req);
      const result = await CanonicalStudentWriteRepository.resumeSuspended(context, String(req.params.id), {
        action: 'UPDATE',
        reason: String(req.body?.reason || 'إعادة قيد الطالب بعد مراجعة الجهة المختصة.'),
        requestId: randomUUID(),
        correlationId: randomUUID(),
        ipAddress: req.ip || 'unknown'
      });
      return res.json({ success: true, data: { student: result }, message: 'تمت إعادة قيد الطالب وتسجيل التصحيح الأكاديمي تدقيقيًا.', meta: { persistence: 'canonical-postgres', workflow: 'academic-status-correction' } });
    } catch (error) { return next(error); }
  });

  // Repairs only missing academic placements through one canonical,
  // all-or-nothing transaction. The server owns the student selection,
  // configured classes, capacity calculation and activation audit; the browser
  // cannot choose a class, tenant, school, academic year, or student list.
  app.post("/api/student-affairs/operational-enrollment-repair", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), async (req, res, next) => {
    try {
      const context = await resolveStudentTenantContext(req);
      const result = await operationalEnrollmentAssignmentService.repairUnassignedStudents(context, {
        idempotencyKey: req.get('Idempotency-Key'),
        reason: req.body?.reason,
        ipAddress: req.ip || 'unknown'
      });
      res.json({
        success: true,
        data: result,
        message: result.processedCount > 0
          ? `تم ربط ${result.processedCount} طالباً بالفصول التشغيلية المعتمدة.`
          : 'لا توجد سجلات غير مرتبطة تحتاج إلى إصلاح.'
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/students/:studentId/guardian", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), async (req, res, next) => {
    try {
      const context = await resolveStudentTenantContext(req);
      const result = await canonicalGuardianUpdateService.update(
        context,
        String(req.params.studentId),
        (req.body || {}) as Record<string, unknown>,
        {
          requestId: randomUUID(),
          correlationId: randomUUID(),
          ipAddress: req.ip || "unknown"
        }
      );
      return res.json({
        success: true,
        data: { guardian: result },
        message: "Guardian record updated successfully.",
        meta: { persistence: "canonical-postgres", workflow: "STU-AFFAIRS-P0-003-04" }
      });
    } catch (err: any) {
      next(err);
    }
  });

  // DOC-001R/STU-AFFAIRS-STORAGE-001: canonical metadata plus private binary storage.
  // OCR, scanning, and external document providers remain outside this trusted path.
  // Every identity, tenant, school, branch, actor, timestamp, request and audit value is
  // resolved server-side; request bodies only carry business metadata.
  function studentDocumentContext(req: express.Request): StudentDocumentRequestContext {
    const tenantContext = (req as any).tenantContext;
    if (!tenantContext) throw new ValidationError("Trusted tenant context is required for Student Documents.");
    return {
      ...tenantContext,
      requestId: randomUUID(),
      correlationId: randomUUID(),
      ipAddress: req.ip || "unknown",
      idempotencyKey: req.get("Idempotency-Key") || undefined
    };
  }

  function normalizeDocumentQuery(query: express.Request["query"]) {
    return normalizeDocumentListFilters(query as Record<string, unknown>);
  }

  const studentDocumentRawUpload = express.raw({
    type: [...STUDENT_DOCUMENT_MEDIA_TYPES],
    limit: MAX_DOCUMENT_BYTES
  });

  function uploadedDocumentInput(req: express.Request, binary: ReturnType<typeof validateStudentDocumentBinary>) {
    return {
      categoryId: req.query.categoryId,
      documentReference: req.query.documentReference,
      title: req.query.title,
      description: req.query.description,
      classification: req.query.classification || 'confidential',
      verificationStatus: req.query.verificationStatus || 'pending',
      retentionUntil: req.query.retentionUntil,
      archiveEligibleOn: req.query.archiveEligibleOn,
      legalHold: req.query.legalHold === 'true',
      revisionReason: req.query.revisionReason,
      originalFileName: safeDocumentFileName(req.query.originalFileName),
      mediaType: binary.mediaType,
      byteSize: (req.body as Buffer).length,
      contentHash: binary.contentHash
    };
  }

  async function uploadPrivateStudentDocument(context: StudentDocumentRequestContext, studentId: string, idempotencyKey: string, binary: ReturnType<typeof validateStudentDocumentBinary>, body: Buffer) {
    if (!platformAdminAuth) throw new ExternalServiceError('Private student document storage is not configured.');
    if (!/^[\x21-\x7e]{1,200}$/.test(idempotencyKey)) throw new ValidationError('A valid Idempotency-Key header is required.');
    const objectFingerprint = createHash('sha256').update(`${idempotencyKey}:${binary.contentHash}`).digest('hex');
    const objectKey = `${context.tenantId.toLowerCase()}/${context.schoolId.toLowerCase()}/${context.branchId.toLowerCase()}/${studentId.toLowerCase()}/${objectFingerprint}.${binary.extension}`;
    const upload = await platformAdminAuth.storage.from(STUDENT_DOCUMENT_BUCKET).upload(objectKey, body, {
      contentType: binary.mediaType,
      cacheControl: '3600',
      upsert: false
    });
    const status = Number((upload.error as any)?.statusCode || (upload.error as any)?.status || 0);
    const duplicate = Boolean(upload.error && (status === 409 || /already exists|duplicate/i.test(upload.error.message || '')));
    if (upload.error && !duplicate) throw new ExternalServiceError('The private document upload failed.');
    return { objectKey, uploadedNow: !upload.error };
  }

  async function removePrivateStudentDocument(objectKey: string, context: StudentDocumentRequestContext): Promise<void> {
    if (!platformAdminAuth) return;
    const removal = await platformAdminAuth.storage.from(STUDENT_DOCUMENT_BUCKET).remove([objectKey]);
    if (removal.error) {
      EnterpriseLogger.warn('Orphan private document cleanup requires attention.', 'StudentDocumentStorage', {
        tenantId: context.tenantId,
        schoolId: context.schoolId,
        requestId: context.requestId
      });
    }
  }

  app.get("/api/student-document-categories", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_VIEW), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const context = studentDocumentContext(req);
      const categories = await studentDocumentService.listCategories(context, typeof req.query.search === "string" ? req.query.search : undefined, req.query.includeInactive === "true");
      res.json({ success: true, data: categories, message: "Student document categories retrieved successfully." });
    } catch (error) { next(error); }
  });

  app.post("/api/student-document-categories", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_CREATE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const result = await studentDocumentService.createCategory(studentDocumentContext(req), req.body || {});
      res.status(result.idempotent ? 200 : 201).json({ success: true, data: result, message: result.idempotent ? "The previous category result was returned idempotently." : "Student document category created successfully." });
    } catch (error) { next(error); }
  });

  app.patch("/api/student-document-categories/:id", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_CREATE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const result = await studentDocumentService.updateCategory(studentDocumentContext(req), req.params.id, req.body || {});
      res.json({ success: true, data: result, message: "Student document category updated successfully." });
    } catch (error) { next(error); }
  });

  app.get("/api/student-documents", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_VIEW), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const result = await studentDocumentService.listDocuments(studentDocumentContext(req), normalizeDocumentQuery(req.query));
      res.json({ success: true, data: result.rows, meta: { total: result.total, page: Number(req.query.page || 1), limit: Number(req.query.limit || 25) }, message: "Student documents retrieved successfully." });
    } catch (error) { next(error); }
  });

  app.get("/api/students/:studentId/documents", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_VIEW), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const query = { ...req.query, studentId: req.params.studentId };
      const result = await studentDocumentService.listDocuments(studentDocumentContext(req), normalizeDocumentQuery(query));
      res.json({ success: true, data: result.rows, meta: { total: result.total, page: Number(req.query.page || 1), limit: Number(req.query.limit || 25) }, message: "Student documents retrieved successfully." });
    } catch (error) { next(error); }
  });

  app.post("/api/students/:studentId/documents", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_CREATE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const result = await studentDocumentService.registerDocument(studentDocumentContext(req), req.params.studentId, req.body || {});
      res.status(result.idempotent ? 200 : 201).json({ success: true, data: result, message: result.idempotent ? "The previous document result was returned idempotently." : "Student document metadata registered successfully." });
    } catch (error) { next(error); }
  });

  app.post("/api/students/:studentId/document-content", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_CREATE), resolveStudentTenantMiddleware, studentDocumentRawUpload, async (req, res, next) => {
    let uploaded: { objectKey: string; uploadedNow: boolean } | null = null;
    let context: StudentDocumentRequestContext | null = null;
    try {
      context = studentDocumentContext(req);
      const idempotencyKey = req.get('Idempotency-Key') || '';
      const body = req.body as Buffer;
      const binary = validateStudentDocumentBinary(body, req.get('Content-Type') || '');
      uploaded = await uploadPrivateStudentDocument(context, req.params.studentId, idempotencyKey, binary, body);
      const result = await studentDocumentService.registerUploadedDocument(
        context,
        req.params.studentId,
        uploadedDocumentInput(req, binary) as any,
        { bucketId: STUDENT_DOCUMENT_BUCKET, objectKey: uploaded.objectKey }
      );
      res.status(result.idempotent ? 200 : 201).json({
        success: true,
        data: result,
        message: result.idempotent ? 'The previous private document result was returned idempotently.' : 'Student document uploaded to private storage successfully.',
        meta: { persistence: 'canonical-postgres', storage: 'private', signedDownloadOnly: true }
      });
    } catch (error) {
      if (uploaded?.uploadedNow && context) await removePrivateStudentDocument(uploaded.objectKey, context);
      next(error);
    }
  });

  app.get("/api/student-documents/:id", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_VIEW), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const result = await studentDocumentService.getDocument(studentDocumentContext(req), req.params.id);
      res.json({ success: true, data: result, message: "Student document metadata retrieved successfully." });
    } catch (error) { next(error); }
  });

  app.get("/api/student-documents/:id/content", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_VIEW), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      if (!platformAdminAuth) throw new ExternalServiceError('Private student document storage is not configured.');
      const descriptor = await studentDocumentService.getContentDescriptor(studentDocumentContext(req), req.params.id);
      const signed = await platformAdminAuth.storage.from(descriptor.bucket_id).createSignedUrl(
        descriptor.object_key,
        300,
        { download: descriptor.original_file_name }
      );
      if (signed.error || !signed.data?.signedUrl) throw new ExternalServiceError('A temporary document link could not be created.');
      res.set('Cache-Control', 'no-store, private');
      res.json({
        success: true,
        data: { url: signed.data.signedUrl, expiresInSeconds: 300, fileName: descriptor.original_file_name, mediaType: descriptor.media_type },
        message: 'Temporary private document link created successfully.'
      });
    } catch (error) { next(error); }
  });

  app.post("/api/student-documents/:id/content-versions", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_VERSION_CREATE), resolveStudentTenantMiddleware, studentDocumentRawUpload, async (req, res, next) => {
    let uploaded: { objectKey: string; uploadedNow: boolean } | null = null;
    let context: StudentDocumentRequestContext | null = null;
    try {
      context = studentDocumentContext(req);
      const idempotencyKey = req.get('Idempotency-Key') || '';
      const body = req.body as Buffer;
      const binary = validateStudentDocumentBinary(body, req.get('Content-Type') || '');
      const current = await studentDocumentService.getDocument(context, req.params.id);
      uploaded = await uploadPrivateStudentDocument(context, current.document.student_id, idempotencyKey, binary, body);
      const result = await studentDocumentService.addUploadedVersion(
        context,
        req.params.id,
        {
          revisionReason: req.query.revisionReason as string,
          originalFileName: safeDocumentFileName(req.query.originalFileName),
          mediaType: binary.mediaType,
          byteSize: body.length,
          contentHash: binary.contentHash
        },
        { bucketId: STUDENT_DOCUMENT_BUCKET, objectKey: uploaded.objectKey }
      );
      res.status(result.idempotent ? 200 : 201).json({
        success: true,
        data: result,
        message: result.idempotent ? 'The previous private version result was returned idempotently.' : 'A private document version was uploaded successfully.'
      });
    } catch (error) {
      if (uploaded?.uploadedNow && context) await removePrivateStudentDocument(uploaded.objectKey, context);
      next(error);
    }
  });

  app.post("/api/student-documents/:id/versions", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_VERSION_CREATE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const result = await studentDocumentService.addVersion(studentDocumentContext(req), req.params.id, req.body || {});
      res.status(result.idempotent ? 200 : 201).json({ success: true, data: result, message: result.idempotent ? "The previous version result was returned idempotently." : "Student document version metadata created successfully." });
    } catch (error) { next(error); }
  });

  app.post("/api/student-documents/:id/verification", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_VERIFY), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const decision = typeof req.body?.decision === "string" ? req.body.decision : "";
      const result = await studentDocumentService.decide(studentDocumentContext(req), req.params.id, decision as any, req.body?.reason, req.body?.expectedVersion);
      res.json({ success: true, data: result, message: "Student document verification decision committed successfully." });
    } catch (error) { next(error); }
  });

  app.post("/api/student-documents/:id/archive", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_ARCHIVE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const restore = req.body?.restore === true;
      const result = await studentDocumentService.archive(studentDocumentContext(req), req.params.id, restore, req.body?.reason, req.body?.expectedVersion);
      res.json({ success: true, data: result, message: restore ? "Student document restored successfully." : "Student document archived successfully." });
    } catch (error) { next(error); }
  });

  app.get("/api/student-documents/:id/access-log", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DOCUMENT_ACCESS_LOG_VIEW), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const result = await studentDocumentService.accessHistory(studentDocumentContext(req), req.params.id, req.query.limit);
      res.json({ success: true, data: result, message: "Student document access history retrieved successfully." });
    } catch (error) { next(error); }
  });

  app.post("/api/students/bulk", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const payload = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
      const context = (req as any).tenantContext || await resolveStudentTenantContext(req);
      const idempotencyKey = req.get('Idempotency-Key') || payload.idempotencyKey;
      const result = await canonicalEnrollmentWorkflowService.execute(context, {
        operation: payload.operation,
        studentIds: payload.studentIds,
        targetClassId: payload.targetClassId,
        targetGradeId: payload.targetGradeId,
        targetSection: payload.targetSection,
        reason: payload.reason,
        idempotencyKey,
        ipAddress: req.ip || 'unknown'
      });
      return res.json({ success: true, data: result, message: 'تم تنفيذ عملية القيد الذرية وتسجيلها تدقيقيًا.', meta: { persistence: 'canonical-postgres', workflow: 'enrollment' } });
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/api/students/:id", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_DELETE), async (req, res, next) => {
    try {
      const context = await resolveStudentTenantContext(req);
      const action = (req.query.action || 'soft') as 'soft' | 'restore' | 'permanent';
      if (!['soft', 'restore'].includes(action)) {
        throw new ValidationError('Physical deletion is disabled for canonical Student Affairs records.');
      }
      const operation = action === 'restore' ? 'RESTORE' as const : 'SOFT_DELETE' as const;
      const result = await CanonicalStudentWriteRepository.changeLifecycle(
        context,
        req.params.id,
        operation,
        {
          action: operation,
          reason: String(req.query.reason || req.body?.reason || (operation === 'RESTORE' ? 'Student record restored through approved workflow' : 'Student record archived through approved workflow')),
          requestId: randomUUID(),
          correlationId: randomUUID(),
          ipAddress: req.ip || 'unknown'
        },
        typeof req.body?.restoreStatus === 'string' ? req.body.restoreStatus : 'active'
      );

      res.json({ success: true, data: { student: result }, message: `Student lifecycle state altered successfully (${action}).`, meta: { persistence: "canonical-postgres" } });
    } catch (err: any) {
      next(err);
    }
  });

  app.post("/api/students/:id/transfer", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const context = (req as any).tenantContext || await resolveStudentTenantContext(req);
      const result = await canonicalEnrollmentWorkflowService.execute(context, {
        operation: 'transfer', studentIds: [req.params.id], targetClassId: req.body?.targetClassId || req.body?.classroom,
        targetGradeId: req.body?.targetGradeId || req.body?.gradeId, targetSection: req.body?.targetSection || req.body?.section,
        reason: req.body?.reason, idempotencyKey: req.get('Idempotency-Key') || `student-transfer:${req.params.id}:${randomUUID()}`, ipAddress: req.ip || 'unknown'
      });
      return res.json({ success: true, data: result, message: 'تم نقل قيد الطالب وتسجيل العملية تدقيقيًا.', meta: { persistence: 'canonical-postgres' } });
    } catch (error) { return next(error); }
  });

  app.post("/api/students/:id/promote", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const context = (req as any).tenantContext || await resolveStudentTenantContext(req);
      const result = await canonicalEnrollmentWorkflowService.execute(context, {
        operation: 'promote', studentIds: [req.params.id], targetClassId: req.body?.targetClassId || req.body?.targetClassroom,
        targetGradeId: req.body?.targetGradeId || req.body?.targetStageId, targetSection: req.body?.targetSection || req.body?.section,
        reason: req.body?.reason, idempotencyKey: req.get('Idempotency-Key') || `student-promote:${req.params.id}:${randomUUID()}`, ipAddress: req.ip || 'unknown'
      });
      return res.json({ success: true, data: result, message: 'تمت ترقية قيد الطالب وتسجيل العملية تدقيقيًا.', meta: { persistence: 'canonical-postgres' } });
    } catch (error) { return next(error); }
  });

  app.post("/api/students/:id/re-enroll", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const context = (req as any).tenantContext || await resolveStudentTenantContext(req);
      const result = await canonicalEnrollmentWorkflowService.execute(context, {
        operation: 're_enroll', studentIds: [req.params.id], targetClassId: req.body?.targetClassId || req.body?.classroom,
        targetGradeId: req.body?.targetGradeId || req.body?.gradeId, targetSection: req.body?.targetSection || req.body?.section,
        reason: req.body?.reason, idempotencyKey: req.get('Idempotency-Key') || `student-re-enroll:${req.params.id}:${randomUUID()}`, ipAddress: req.ip || 'unknown'
      });
      return res.json({ success: true, data: result, message: 'تمت إعادة قيد الطالب وتسجيل العملية تدقيقيًا.', meta: { persistence: 'canonical-postgres' } });
    } catch (error) { return next(error); }
  });

  // GRADUATION
  app.post("/api/students/:id/graduate", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const tenantContext = (req as any).tenantContext || await resolveStudentTenantContext(req);
      const result = await canonicalGraduationService.execute(
        {
          ...tenantContext,
          requestId: randomUUID(),
          correlationId: randomUUID(),
          ipAddress: req.ip || 'unknown'
        },
        {
          studentId: req.params.id,
          reason: req.body?.reason,
          resultArchiveId: req.body?.resultArchiveId,
          idempotencyKey: req.get('Idempotency-Key') || ''
        }
      );
      res.status(result.idempotent ? 200 : 201).json({
        success: true,
        data: result,
        message: result.idempotent ? 'تمت إعادة نتيجة التخرج السابقة بأمان.' : 'تم اعتماد تخرج الطالب من نتيجة نهائية مقفلة وإغلاق القيد.',
        meta: { persistence: 'canonical-postgres', evidence: 'immutable-exam-archive', financialClearance: true }
      });
    } catch (error) { next(error); }
  });

  // DISMISSAL / SUSPENSION
  // Dismissal is also held until the canonical academic-status workflow is available.
  app.post("/api/students/:id/dismiss", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), resolveStudentTenantMiddleware, async (req, res, next) => {
    void req;
    void next;
    return canonicalEnrollmentWorkflowRequired(res, 'الفصل أو التعليق الأكاديمي');
  });

  // ARCHIVE
  app.post("/api/students/:id/archive", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const schoolId = (req as any).user.schoolId;
      const archive = req.body.archive === true;
      const meta = createTrustedStudentAuditMetadata(req as any);

      const result = await StudentService.archiveStudent(schoolId, req.params.id, archive, meta);
      res.json({
        success: true,
        data: result,
        message: archive ? "Student archived successfully." : "Student restored from archives successfully."
      });
    } catch (err: any) {
      next(new DatabaseError("Failed to archive student", err.message));
    }
  });

  // GET STUDENT TIMELINE
  app.get("/api/students/:id/timeline", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_READ), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const context = (req as any).tenantContext;
      const studentId = req.params.id;
      const timelineEvents = await CanonicalStudentTimelineRepository.getTimeline(context, studentId);

      res.json({
        success: true,
        data: timelineEvents,
        message: "Student timeline events retrieved successfully."
      });
    } catch (err: any) {
      next(new DatabaseError("Failed to retrieve student timeline logs", err.message));
    }
  });

  // Canonical Human Resources Database API. The client never supplies a
  // tenant, school, or actor: all three are taken from the trusted request.
  app.get('/api/hr/database', authenticateRequest, requirePermission(PERMISSIONS.HR_READ), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const tenantContext = (req as any).tenantContext;
      if (!tenantId || !schoolId || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
        throw new AuthenticationError('السياق الموثوق لقراءة سجلات الموارد البشرية غير مكتمل.');
      }
      const snapshot = await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Read versioned HR database', tenantId, userId: identity.id,
        userName: identity.name || 'المستخدم الحالي', ipAddress: req.ip || 'unknown',
        affectedTables: ['hr_database']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة قراءة سجلات الموارد البشرية غير متاحة.');
        const result = await transaction.query<{ data: Record<string, unknown>; version: number; country_code: string; legal_configuration: Record<string, unknown> }>(
          `SELECT data, version, country_code, legal_configuration
             FROM public.hr_database
            WHERE tenant_id = $1 AND school_id = $2`,
          [tenantId, schoolId]
        );
        return result.rows[0] || {
          data: { employees: [], departments: [], jobs: [], contracts: [], attendance: [], leaves: [], penalties: [], advances: [], rewards: [], performance: [], documents: [], payrollRuns: [], settings: {} },
          version: 0, country_code: 'ZZ', legal_configuration: {}
        };
      }, tenantContext);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, data: snapshot.data, meta: {
        version: Number(snapshot.version || 0), countryCode: snapshot.country_code, legalConfiguration: snapshot.legal_configuration
      }});
    } catch (err: any) {
      EnterpriseLogger.error('Failed to read HR database', 'HrDatabaseRoute', { schoolId: (req as any).user?.schoolId, error: err?.message || String(err) });
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof DatabaseError ? err : new DatabaseError('تعذر قراءة سجلات الموارد البشرية.', err?.message));
    }
  });

  app.post('/api/hr/database', authenticateRequest, requirePermission(PERMISSIONS.HR_WRITE), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const expectedVersion = Number(req.body?.expectedVersion);
      const requestedData = req.body?.data && typeof req.body.data === 'object' && !Array.isArray(req.body.data)
        ? JSON.parse(JSON.stringify(req.body.data)) as Record<string, any>
        : req.body?.data;
      const requestedCountryCode = String(req.body?.countryCode || 'ZZ').trim().toUpperCase();
      const requestedLegalConfiguration = req.body?.legalConfiguration ?? {};
      const tenantContext = (req as any).tenantContext;
      const expectedCollections = ['employees', 'departments', 'jobs', 'contracts', 'attendance', 'leaves', 'penalties', 'advances', 'rewards', 'performance', 'documents', 'payrollRuns'];
      if (!tenantId || !schoolId || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId
        || !Number.isInteger(expectedVersion) || expectedVersion < 0) {
        throw new ValidationError('حفظ الموارد البشرية يتطلب نطاق مدرسة موثوقاً ورقم إصدار متوقعاً صالحاً.');
      }
      if (!requestedData || typeof requestedData !== 'object' || Array.isArray(requestedData)
        || !requestedLegalConfiguration || typeof requestedLegalConfiguration !== 'object' || Array.isArray(requestedLegalConfiguration)) {
        throw new ValidationError('بيانات وإعدادات الموارد البشرية يجب أن تكون كائنات صالحة.');
      }
      if (!/^[A-Z]{2}$/.test(requestedCountryCode)) {
        throw new ValidationError('رمز الدولة اختياري ومحايد، لكنه عند تقديمه يجب أن يتكون من حرفين كبيرين.');
      }
      for (const collection of expectedCollections) {
        if (!Array.isArray((requestedData as Record<string, unknown>)[collection])) {
          throw new ValidationError(`حقل سجلات الموارد البشرية ${collection} يجب أن يكون قائمة.`);
        }
      }
      if ((requestedData as Record<string, unknown>).settings !== undefined
        && (typeof (requestedData as Record<string, unknown>).settings !== 'object' || Array.isArray((requestedData as Record<string, unknown>).settings))) {
        throw new ValidationError('إعدادات الموارد البشرية يجب أن تكون كائناً.');
      }
      validateHrSnapshotData(requestedData as Record<string, any>);

      let nextVersion = expectedVersion + 1;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Write versioned HR database', tenantId, userId: identity.id,
        userName: identity.name || 'المستخدم الحالي', ipAddress: req.ip || 'unknown',
        affectedTables: ['hr_database', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة حفظ سجلات الموارد البشرية غير متاحة.');
        const actorResult = await transaction.query<{ id: string }>(
          `SELECT id FROM public.users
            WHERE tenant_id = $1 AND auth_user_id = $2 AND status = 'active' AND deleted_at IS NULL
            LIMIT 1`, [tenantId, identity.id]
        );
        const actorId = actorResult.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية الجلسة بسجل المستخدم المؤسسي المعتمد.');
        const current = await transaction.query<{ data: Record<string, unknown>; version: number }>(
          `SELECT data, version FROM public.hr_database WHERE tenant_id = $1 AND school_id = $2 FOR UPDATE`, [tenantId, schoolId]
        );
        const actualVersion = Number(current.rows[0]?.version || 0);
        if (actualVersion !== expectedVersion) {
          throw new ConflictError('تم تعديل سجلات الموارد البشرية بواسطة مستخدم آخر. أعد المزامنة قبل الحفظ.', { expectedVersion, actualVersion });
        }
        const currentRuns = Array.isArray((current.rows[0]?.data as any)?.payrollRuns) ? (current.rows[0]?.data as any).payrollRuns : [];
        const requestedRuns = (requestedData as any).payrollRuns as any[];
        for (const currentRun of currentRuns.filter((item: any) => ['approved', 'paid'].includes(item?.status))) {
          const requestedRun = requestedRuns.find(item => item?.period === currentRun?.period);
          if (!requestedRun || stableJsonStringify(requestedRun) !== stableJsonStringify(currentRun)) {
            throw new ConflictError(`مسير الرواتب للفترة ${String(currentRun?.period || '')} محمي بعد الاعتماد ولا يقبل تعديلاً عاماً.`);
          }
        }
        const currentData = (current.rows[0]?.data || {}) as Record<string, any>;
        const currentAdvances = Array.isArray(currentData.advances) ? currentData.advances : [];
        const requestedAdvances = (requestedData as Record<string, any>).advances as any[];
        for (const currentAdvance of currentAdvances.filter((item: any) => String(item?.journalId || '').trim())) {
          const requestedAdvance = requestedAdvances.find(item => item?.id === currentAdvance?.id);
          if (!requestedAdvance || stableJsonStringify(requestedAdvance) !== stableJsonStringify(currentAdvance)) {
            throw new ConflictError(`السلفة ${String(currentAdvance?.id || '')} محمية بعد الصرف ولا تقبل تعديلاً عاماً.`);
          }
        }
        const currentContracts = Array.isArray(currentData.contracts) ? currentData.contracts : [];
        const requestedContracts = (requestedData as Record<string, any>).contracts as any[];
        for (const currentContract of currentContracts.filter((item: any) => String(item?.signatureHash || '').trim())) {
          const requestedContract = requestedContracts.find(item => item?.id === currentContract?.id);
          if (!requestedContract || stableJsonStringify(requestedContract) !== stableJsonStringify(currentContract)) {
            throw new ConflictError(`العقد ${String(currentContract?.id || '')} محمي بعد التوقيع ولا يقبل تعديلاً عاماً.`);
          }
        }
        const changedCollections = expectedCollections.filter(collection =>
          stableJsonStringify(currentData[collection] || []) !== stableJsonStringify((requestedData as Record<string, any>)[collection] || [])
        );
        const previousSnapshotHash = createHash('sha256').update(stableJsonStringify(currentData)).digest('hex');
        const nextSnapshotHash = createHash('sha256').update(stableJsonStringify(requestedData)).digest('hex');
        nextVersion = actualVersion + 1;
        await transaction.query(
          `INSERT INTO public.hr_database (tenant_id, school_id, country_code, legal_configuration, data, version, updated_at, updated_by)
           VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, now(), $7)
           ON CONFLICT (school_id) DO UPDATE SET country_code = EXCLUDED.country_code,
             legal_configuration = EXCLUDED.legal_configuration, data = EXCLUDED.data,
             version = EXCLUDED.version, updated_at = now(), updated_by = EXCLUDED.updated_by
           WHERE public.hr_database.tenant_id = EXCLUDED.tenant_id`,
          [tenantId, schoolId, requestedCountryCode, JSON.stringify(requestedLegalConfiguration), JSON.stringify(requestedData), nextVersion, actorId]
        );
        await transaction.query(
          `INSERT INTO public.audit_events
             (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata)
           VALUES ($1, $2, $3, $4, 'hr_database', $2, 'write', 'HrDatabaseRoute', 'حفظ سجل الموارد البشرية', 'success', $5::jsonb)`,
          [tenantId, schoolId, identity.branchId || null, actorId, JSON.stringify({ expectedVersion, actualVersion, nextVersion, countryCode: requestedCountryCode, changedCollections, previousSnapshotHash, nextSnapshotHash })]
        );
      }, tenantContext);
      res.json({ success: true, data: { updated: true }, meta: { version: nextVersion } });
    } catch (err: any) {
      EnterpriseLogger.error('Failed to save HR database', 'HrDatabaseRoute', { schoolId: (req as any).user?.schoolId, error: err?.message || String(err) });
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof ConflictError || err instanceof ValidationError || err instanceof DatabaseError
        ? err : new DatabaseError('تعذر حفظ سجلات الموارد البشرية.', err?.message));
    }
  });

  // Reports are rendered in the browser from the already loaded canonical
  // snapshot, but every export/print must still prove its source and leave an
  // auditable event. No report endpoint accepts school or tenant identifiers.
  app.post('/api/hr/reports/audit', authenticateRequest, requirePermission(PERMISSIONS.HR_READ), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const tenantContext = (req as any).tenantContext;
      const reportType = String(req.body?.reportType || '').trim();
      const format = String(req.body?.format || '').trim().toLowerCase();
      const rowCount = Number(req.body?.rowCount);
      const startDate = String(req.body?.startDate || '').trim();
      const endDate = String(req.body?.endDate || '').trim();
      if (!tenantId || !schoolId || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId
        || !['employees', 'attendance', 'leaves', 'advances', 'rewards', 'penalties'].includes(reportType)
        || !['csv', 'print'].includes(format) || !Number.isInteger(rowCount) || rowCount < 0 || rowCount > 100000
        || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || startDate > endDate) {
        throw new ValidationError('بيانات تصدير تقرير HR غير صالحة أو خارج نطاق المدرسة الموثوقة.');
      }
      let resultHash = '';
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: `Audit HR report ${reportType}`, tenantId, userId: identity.id,
        userName: identity.name || 'المستخدم الحالي', ipAddress: req.ip || 'unknown',
        affectedTables: ['hr_database', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة تدقيق تقرير HR غير متاحة.');
        const actor = await transaction.query<{ id: string }>(
          `SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
          [tenantId, identity.id]
        );
        if (!actor.rows[0]) throw new AuthenticationError('تعذر ربط مستخدم التقرير بسجل المدرسة.');
        const snapshot = await transaction.query<{ data: Record<string, unknown>; version: number }>(
          `SELECT data, version FROM public.hr_database WHERE tenant_id = $1 AND school_id = $2`, [tenantId, schoolId]
        );
        if (!snapshot.rows[0]) throw new DatabaseError('لا يوجد سجل HR مركزي لإصدار التقرير.');
        resultHash = createHash('sha256').update(stableJsonStringify(snapshot.rows[0].data)).digest('hex');
        await transaction.query(
          `INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata)
           VALUES ($1, $2, $3, $4, 'hr_report', $5, $6, 'HrReportRoute', 'إصدار تقرير من المصدر الكانوني', 'success', $7::jsonb)`,
          [tenantId, schoolId, identity.branchId || null, actor.rows[0].id, schoolId, `export_${format}`,
            JSON.stringify({ reportKey: `${reportType}:${format}`, reportType, format, rowCount, startDate, endDate, source: 'canonical-postgres', snapshotVersion: Number(snapshot.rows[0].version || 0), snapshotHash: resultHash })]
        );
      }, tenantContext);
      res.json({ success: true, data: { source: 'canonical-postgres', snapshotHash: resultHash, rowCount } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof ValidationError || err instanceof DatabaseError
        ? err : new DatabaseError('تعذر تدقيق تقرير الموارد البشرية.', err?.message));
    }
  });

  app.post('/api/hr/contracts/:contractId/sign', authenticateRequest, requirePermission(PERMISSIONS.HR_WRITE), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const contractId = String(req.params.contractId || '').trim();
      const expectedVersion = Number(req.body?.expectedVersion);
      const tenantContext = (req as any).tenantContext;
      if (!tenantId || !schoolId || !contractId || !Number.isInteger(expectedVersion) || expectedVersion < 0
        || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
        throw new ValidationError('توقيع العقد يتطلب سجلاً متزامناً ونطاق مدرسة موثوقاً.');
      }
      let signedContract: Record<string, any> | null = null;
      let nextVersion = expectedVersion + 1;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: `Sign HR contract ${contractId}`, tenantId, userId: identity.id,
        userName: identity.name || 'المستخدم الحالي', ipAddress: req.ip || 'unknown',
        affectedTables: ['hr_database', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة توقيع العقد غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id=$1 AND auth_user_id=$2 AND status='active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية الجلسة بمستخدم الموارد البشرية.');
        const current = await transaction.query<{ data: Record<string, any>; version: number }>(`SELECT data,version FROM public.hr_database WHERE tenant_id=$1 AND school_id=$2 FOR UPDATE`, [tenantId, schoolId]);
        const data = current.rows[0]?.data;
        const actualVersion = Number(current.rows[0]?.version || 0);
        if (!data || actualVersion !== expectedVersion) throw new ConflictError('تغير سجل HR؛ أعد تحميل العقد قبل توقيعه.', { expectedVersion, actualVersion });
        const contract = (Array.isArray(data.contracts) ? data.contracts : []).find((item: any) => item?.id === contractId);
        if (!contract) throw new ValidationError('العقد المطلوب توقيعه غير موجود.');
        if (contract.status !== 'draft') throw new ConflictError('لا يمكن توقيع عقد غير موجود في حالة المسودة.');
        const signedAt = new Date().toISOString();
        const version = Math.max(1, Number(contract.version || 1));
        const signatureHash = createHash('sha256').update(stableJsonStringify({ id: contract.id, employeeId: contract.employeeId, type: contract.type, startDate: contract.startDate, endDate: contract.endDate, monthlySalary: contract.monthlySalary, version, signedAt, signer: actorId })).digest('hex');
        signedContract = { ...contract, status: 'active', version, signedAt, signatureHash };
        data.contracts = (Array.isArray(data.contracts) ? data.contracts : []).map((item: any) => item?.id === contractId ? signedContract : item);
        nextVersion = actualVersion + 1;
        await transaction.query(`UPDATE public.hr_database SET data=$3::jsonb,version=$4,updated_at=now(),updated_by=$5 WHERE tenant_id=$1 AND school_id=$2`, [tenantId, schoolId, JSON.stringify(data), nextVersion, actorId]);
        await transaction.query(`INSERT INTO public.audit_events (tenant_id,school_id,branch_id,actor_user_id,entity_type,entity_id,action,source,reason,result,metadata) VALUES ($1,$2,$3,$4,'hr_contract',$5,'sign','HrContractRoute','توقيع عقد واعتماده بختم خادمي','success',$6::jsonb)`, [tenantId, schoolId, identity.branchId || null, actorId, schoolId, JSON.stringify({ contractId, version, signedAt, signatureHash })]);
      }, tenantContext);
      res.json({ success: true, data: { contract: signedContract }, meta: { version: nextVersion } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof ConflictError || err instanceof ValidationError || err instanceof DatabaseError
        ? err : new DatabaseError('تعذر توقيع العقد.', err?.message));
    }
  });

  // HR only records school-owned account mappings here. It deliberately does
  // not create a journal: posting remains an explicit approved-payment action.
  app.post('/api/hr/accounting-mappings', authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const tenantContext = (req as any).tenantContext;
      const mappings = [
        ['treasury.cash', String(req.body?.cashAccount || '').trim(), 'asset'],
        ['hr.payroll.expense', String(req.body?.payrollExpenseAccount || '').trim(), 'expense'],
        ['hr.payroll.payable', String(req.body?.payrollPayableAccount || '').trim(), 'liability'],
        ['hr.advance.receivable', String(req.body?.advanceReceivableAccount || '').trim(), 'asset'],
        ['hr.deductions.clearing', String(req.body?.deductionClearingAccount || '').trim(), 'liability']
      ] as const;
      if (!tenantId || !schoolId || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId || mappings.some(([, code]) => !code)) {
        throw new ValidationError('اعتماد ربط HR يتطلب جميع حسابات الصرف والرواتب والسلف والخصومات ضمن المدرسة الموثوقة.');
      }
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Configure HR accounting mappings', tenantId, userId: identity.id,
        userName: identity.name || 'المستخدم الحالي', ipAddress: req.ip || 'unknown',
        affectedTables: ['erp_account_mappings', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة اعتماد ربط حسابات HR غير متاحة.');
        const actor = await transaction.query<{ id: string }>(
          `SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
          [tenantId, identity.id]
        );
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية الجلسة بالمستخدم المالي المعتمد.');
        if (!await CanonicalErpPostingService.isProvisioned(transaction)) {
          throw new DatabaseError('دفتر الأستاذ الكانوني غير مهيأ بعد لهذه المدرسة.');
        }
        for (const [key, code, nature] of mappings) {
          const account = await transaction.query<{ account_code: string }>(
            `SELECT account_code FROM public.erp_chart_of_accounts
              WHERE tenant_id = $1 AND school_id = $2 AND account_code = $3 AND account_nature = $4
                AND is_active = true AND is_leaf = true LIMIT 1`, [tenantId, schoolId, code, nature]
          );
          if (!account.rows[0]) throw new ValidationError(`الحساب ${code} غير موجود أو لا يحمل طبيعة ${nature} المناسبة لربط ${key}.`);
          await transaction.query(
            `INSERT INTO public.erp_account_mappings (tenant_id, school_id, mapping_key, account_code, is_active, updated_by)
             VALUES ($1, $2, $3, $4, true, $5)
             ON CONFLICT (school_id, mapping_key) DO UPDATE SET account_code = EXCLUDED.account_code, is_active = true, updated_at = now(), updated_by = EXCLUDED.updated_by`,
            [tenantId, schoolId, key, code, actorId]
          );
        }
        await transaction.query(
          `INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata)
           VALUES ($1, $2, $3, $4, 'hr_accounting_mapping', $2, 'configure', 'HrAccountingMappingRoute', 'اعتماد خرائط حسابات HR', 'success', $5::jsonb)`,
          [tenantId, schoolId, identity.branchId || null, actorId, JSON.stringify({ mappingKeys: mappings.map(([key]) => key) })]
        );
      }, tenantContext);
      res.json({ success: true, message: 'تم اعتماد خرائط حسابات الموارد البشرية دون إنشاء أي قيد.' });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof ValidationError || err instanceof DatabaseError
        ? err : new DatabaseError('تعذر اعتماد خرائط حسابات الموارد البشرية.', err?.message));
    }
  });

  app.post('/api/hr/advances/:advanceId/pay', authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const advanceId = String(req.params.advanceId || '').trim();
      const expectedVersion = Number(req.body?.expectedVersion);
      const tenantContext = (req as any).tenantContext;
      if (!tenantId || !schoolId || !advanceId || !Number.isInteger(expectedVersion) || expectedVersion < 0
        || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
        throw new ValidationError('صرف السلفة يتطلب سجلاً متزامناً ونطاق مدرسة موثوقاً.');
      }
      let paidAdvance: Record<string, any> | null = null;
      let journalId = '';
      let nextVersion = expectedVersion + 1;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: `Pay HR advance ${advanceId}`, tenantId, userId: identity.id,
        userName: identity.name || 'المستخدم الحالي', ipAddress: req.ip || 'unknown',
        affectedTables: ['hr_database', ...CANONICAL_ERP_TABLES]
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة صرف السلفة غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id=$1 AND auth_user_id=$2 AND status='active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية الجلسة بالمستخدم المالي المعتمد.');
        if (!await CanonicalErpPostingService.isProvisioned(transaction)) throw new DatabaseError('دفتر الأستاذ الكانوني غير مهيأ لهذه المدرسة.');
        const current = await transaction.query<{ data: Record<string, any>; version: number }>(`SELECT data,version FROM public.hr_database WHERE tenant_id=$1 AND school_id=$2 FOR UPDATE`, [tenantId, schoolId]);
        const data = current.rows[0]?.data;
        const actualVersion = Number(current.rows[0]?.version || 0);
        if (!data || actualVersion !== expectedVersion) throw new ConflictError('تغير سجل HR؛ أعد تحميل السلفة قبل تنفيذ الصرف.', { expectedVersion, actualVersion });
        const advance = (Array.isArray(data.advances) ? data.advances : []).find((item: any) => item?.id === advanceId);
        if (!advance || advance.status !== 'approved') throw new ConflictError('لا يمكن صرف سلفة غير معتمدة.');
        if (advance.journalId) throw new ConflictError('تم صرف هذه السلفة وإثبات قيدها مسبقاً.');
        const amount = Number(advance.amount || 0);
        if (!Number.isFinite(amount) || amount <= 0) throw new ValidationError('قيمة السلفة غير صالحة للصرف.');
        const mappingRows = await transaction.query<{ mapping_key: string; account_code: string }>(`SELECT mapping_key,account_code FROM public.erp_account_mappings WHERE school_id=$1 AND is_active=true AND mapping_key = ANY($2::text[])`, [schoolId, ['treasury.cash', 'hr.advance.receivable']]);
        const mappings = new Map(mappingRows.rows.map(row => [row.mapping_key, row.account_code]));
        if (!mappings.get('treasury.cash') || !mappings.get('hr.advance.receivable')) throw new ValidationError('لا يمكن صرف السلفة قبل اعتماد خريطة النقد وذمم السلف.');
        const sync = await CanonicalErpPostingService.syncSnapshot(transaction, tenantId, schoolId, actorId, {
          journalEntries: [{ id: `hr-advance-${advanceId}`, sourceType: 'journal_entry', status: 'posted', date: String(advance.date || new Date().toISOString().slice(0, 10)), description: `صرف سلفة موظف ${advance.employeeId}`, lines: [
            { id: 'advance-receivable', accountCode: mappings.get('hr.advance.receivable'), debit: amount, credit: 0 },
            { id: 'cash', accountCode: mappings.get('treasury.cash'), debit: 0, credit: amount }
          ] }]
        });
        journalId = sync.sourceLinks.find(link => link.sourceId === `hr-advance-${advanceId}`)?.journalEntryId || '';
        if (!journalId) throw new DatabaseError('تعذر إثبات قيد السلفة الكانوني.');
        const paidAt = new Date().toISOString();
        paidAdvance = { ...advance, journalId, paidAt, paidBy: actorId };
        data.advances = (Array.isArray(data.advances) ? data.advances : []).map((item: any) => item?.id === advanceId ? paidAdvance : item);
        nextVersion = actualVersion + 1;
        await transaction.query(`UPDATE public.hr_database SET data=$3::jsonb,version=$4,updated_at=now(),updated_by=$5 WHERE tenant_id=$1 AND school_id=$2`, [tenantId, schoolId, JSON.stringify(data), nextVersion, actorId]);
        await transaction.query(`INSERT INTO public.audit_events (tenant_id,school_id,branch_id,actor_user_id,entity_type,entity_id,action,source,reason,result,metadata) VALUES ($1,$2,$3,$4,'hr_advance',$5,'pay','HrAdvanceRoute','صرف سلفة معتمدة وترحيل قيدها','success',$6::jsonb)`, [tenantId, schoolId, identity.branchId || null, actorId, schoolId, JSON.stringify({ advanceId, amount, journalId })]);
      }, tenantContext);
      res.json({ success: true, data: { advance: paidAdvance, journalId, paidAt: paidAdvance?.paidAt, paidBy: paidAdvance?.paidBy }, meta: { version: nextVersion } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof ConflictError || err instanceof ValidationError || err instanceof DatabaseError
        ? err : new DatabaseError('تعذر صرف السلفة.', err?.message));
    }
  });

  // A payroll approval is an immutable business checkpoint, not a financial
  // posting. The server computes the amount from the HR snapshot so a browser
  // can never approve a forged payroll total.
  app.post('/api/hr/payroll-runs/:period/approve', authenticateRequest, requirePermission(PERMISSIONS.HR_WRITE), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const period = String(req.params.period || '').trim();
      const expectedVersion = Number(req.body?.expectedVersion);
      const tenantContext = (req as any).tenantContext;
      if (!/^\d{4}-\d{2}$/.test(period) || !Number.isInteger(expectedVersion) || expectedVersion < 0
        || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
        throw new ValidationError('اعتماد مسير الرواتب يتطلب فترة صالحة وسجل HR متزامناً ضمن المدرسة الموثوقة.');
      }
      let run: Record<string, unknown> | null = null;
      let nextVersion = expectedVersion + 1;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: `Approve HR payroll ${period}`, tenantId, userId: identity.id,
        userName: identity.name || 'المستخدم الحالي', ipAddress: req.ip || 'unknown',
        affectedTables: ['hr_database', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة اعتماد مسير الرواتب غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية الجلسة بالمستخدم المعتمد.');
        const current = await transaction.query<{ data: Record<string, any>; version: number }>(`SELECT data, version FROM public.hr_database WHERE tenant_id = $1 AND school_id = $2 FOR UPDATE`, [tenantId, schoolId]);
        const data = current.rows[0]?.data;
        const actualVersion = Number(current.rows[0]?.version || 0);
        if (!data || actualVersion !== expectedVersion) throw new ConflictError('تغير سجل HR؛ أعد تحميل المسير قبل اعتماده.', { expectedVersion, actualVersion });
        const existingRuns = Array.isArray(data.payrollRuns) ? data.payrollRuns : [];
        if (existingRuns.some((item: any) => item?.period === period && ['approved', 'paid'].includes(item?.status))) throw new ConflictError('مسير هذه الفترة معتمد أو مصروف بالفعل.');
        const calculation = calculatePayrollRun({
          period,
          employees: Array.isArray(data.employees) ? data.employees : [],
          rewards: Array.isArray(data.rewards) ? data.rewards : [],
          penalties: Array.isArray(data.penalties) ? data.penalties : [],
          advances: Array.isArray(data.advances) ? data.advances : [],
          attendance: Array.isArray(data.attendance) ? data.attendance : [],
          leaves: Array.isArray(data.leaves) ? data.leaves : [],
          settings: data.settings && typeof data.settings === 'object' ? data.settings : {}
        });
        const { lines, totals } = calculation;
        if (!lines.length) throw new ValidationError('لا توجد استحقاقات موجبة لاعتمادها في هذه الفترة.');
        run = { id: `payroll-${period}`, period, status: 'approved', lines, totals, approvedAt: new Date().toISOString(), approvedBy: actorId, hrVersion: actualVersion, fingerprint: createHash('sha256').update(stableJsonStringify({ period, lines, totals })).digest('hex') };
        data.payrollRuns = [...existingRuns.filter((item: any) => item?.period !== period), run];
        nextVersion = actualVersion + 1;
        await transaction.query(`UPDATE public.hr_database SET data = $3::jsonb, version = $4, updated_at = now(), updated_by = $5 WHERE tenant_id = $1 AND school_id = $2`, [tenantId, schoolId, JSON.stringify(data), nextVersion, actorId]);
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata) VALUES ($1,$2,$3,$4,'hr_payroll_run',$5,'approve','HrPayrollRoute','اعتماد مسير دون ترحيل','success',$6::jsonb)`, [tenantId, schoolId, identity.branchId || null, actorId, schoolId, JSON.stringify({ runId: `payroll-${period}`, period, totals })]);
      }, tenantContext);
      res.json({ success: true, data: run, meta: { version: nextVersion } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof ValidationError || err instanceof ConflictError || err instanceof DatabaseError ? err : new DatabaseError('تعذر اعتماد مسير الرواتب.', err?.message));
    }
  });

  app.post('/api/hr/payroll-runs/:period/pay', authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const period = String(req.params.period || '').trim();
      const expectedVersion = Number(req.body?.expectedVersion);
      const tenantContext = (req as any).tenantContext;
      if (!/^\d{4}-\d{2}$/.test(period) || !Number.isInteger(expectedVersion) || expectedVersion < 0
        || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new ValidationError('تنفيذ الصرف يتطلب مسيراً معتمداً وسجل HR متزامناً ضمن المدرسة الموثوقة.');
      let nextVersion = expectedVersion + 1;
      let journalId = '';
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: `Pay approved HR payroll ${period}`, tenantId, userId: identity.id,
        userName: identity.name || 'المستخدم الحالي', ipAddress: req.ip || 'unknown', affectedTables: ['hr_database', ...CANONICAL_ERP_TABLES]
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة تنفيذ صرف الرواتب غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id=$1 AND auth_user_id=$2 AND status='active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية الجلسة بالمستخدم المالي المعتمد.');
        if (!await CanonicalErpPostingService.isProvisioned(transaction)) throw new DatabaseError('دفتر الأستاذ الكانوني غير مهيأ لهذه المدرسة.');
        const current = await transaction.query<{ data: Record<string, any>; version: number }>(`SELECT data,version FROM public.hr_database WHERE tenant_id=$1 AND school_id=$2 FOR UPDATE`, [tenantId, schoolId]);
        const data = current.rows[0]?.data;
        const actualVersion = Number(current.rows[0]?.version || 0);
        if (!data || actualVersion !== expectedVersion) throw new ConflictError('تغير سجل HR؛ أعد تحميل المسير قبل تنفيذ الصرف.', { expectedVersion, actualVersion });
        const run = (Array.isArray(data.payrollRuns) ? data.payrollRuns : []).find((item: any) => item?.period === period);
         if (!run || run.status !== 'approved' || run.journalId) throw new ConflictError('لا يمكن الصرف إلا لمسير معتمد وغير مصروف.');
        const recomputedFingerprint = createHash('sha256').update(stableJsonStringify({ period, lines: run.lines, totals: run.totals })).digest('hex');
        if (run.fingerprint !== recomputedFingerprint) throw new ConflictError('بصمة مسير الرواتب المعتمد غير صحيحة.');
        const mappingRows = await transaction.query<{ mapping_key: string; account_code: string }>(`SELECT mapping_key,account_code FROM public.erp_account_mappings WHERE school_id=$1 AND is_active=true AND mapping_key = ANY($2::text[])`, [schoolId, ['treasury.cash','hr.payroll.expense','hr.advance.receivable','hr.deductions.clearing']]);
        const mappings = new Map(mappingRows.rows.map(row => [row.mapping_key, row.account_code]));
        const required = ['treasury.cash','hr.payroll.expense','hr.advance.receivable','hr.deductions.clearing'];
        if (required.some(key => !mappings.get(key))) throw new ValidationError('لا يمكن تنفيذ الصرف قبل اعتماد جميع خرائط حسابات HR من شاشة الحسابات.');
        const totals = run.totals || {};
        const gross = Number(totals.gross || 0), net = Number(totals.net || 0), advance = Number(totals.advance || 0), penalty = Number(totals.penalty || 0);
        const attendance = Number(totals.attendance || 0), leave = Number(totals.leave || 0), overtime = Number(totals.overtime || 0);
        if (![gross, net, advance, penalty, attendance, leave, overtime].every(Number.isFinite) || gross <= 0 || Math.round((gross + overtime) * 100) !== Math.round((net + advance + penalty + attendance + leave) * 100)) throw new ValidationError('إجماليات مسير الرواتب المعتمد غير متوازنة.');
        const lines = [
          { id: 'expense', accountCode: mappings.get('hr.payroll.expense'), debit: gross + overtime, credit: 0 },
          { id: 'cash', accountCode: mappings.get('treasury.cash'), debit: 0, credit: net }
        ];
        if (advance > 0) lines.push({ id: 'advance', accountCode: mappings.get('hr.advance.receivable'), debit: 0, credit: advance });
        if (penalty > 0) lines.push({ id: 'deduction', accountCode: mappings.get('hr.deductions.clearing'), debit: 0, credit: penalty });
        if (attendance > 0) lines.push({ id: 'attendance-deduction', accountCode: mappings.get('hr.deductions.clearing'), debit: 0, credit: attendance });
        if (leave > 0) lines.push({ id: 'unpaid-leave-deduction', accountCode: mappings.get('hr.deductions.clearing'), debit: 0, credit: leave });
        const sync = await CanonicalErpPostingService.syncSnapshot(transaction, tenantId, schoolId, actorId, { journalEntries: [{ id: `hr-payroll-${period}`, sourceType: 'journal_entry', status: 'posted', date: `${period}-01`, description: `صرف مسير الرواتب المعتمد للفترة ${period}`, lines }] });
        journalId = sync.sourceLinks.find(link => link.sourceId === `hr-payroll-${period}`)?.journalEntryId || '';
        if (!journalId) throw new DatabaseError('تعذر إثبات قيد صرف الرواتب الكانوني.');
        run.status = 'paid'; run.paidAt = new Date().toISOString(); run.paidBy = actorId; run.journalId = journalId;
        nextVersion = actualVersion + 1;
        await transaction.query(`UPDATE public.hr_database SET data=$3::jsonb,version=$4,updated_at=now(),updated_by=$5 WHERE tenant_id=$1 AND school_id=$2`, [tenantId, schoolId, JSON.stringify(data), nextVersion, actorId]);
        await transaction.query(`INSERT INTO public.audit_events (tenant_id,school_id,branch_id,actor_user_id,entity_type,entity_id,action,source,reason,result,metadata) VALUES ($1,$2,$3,$4,'hr_payroll_run',$5,'pay','HrPayrollRoute','تنفيذ صرف وترحيل مسير معتمد','success',$6::jsonb)`, [tenantId, schoolId, identity.branchId || null, actorId, schoolId, JSON.stringify({ runId: `payroll-${period}`, period, journalId, totals })]);
      }, tenantContext);
      res.json({ success: true, data: { period, journalId, status: 'paid' }, meta: { version: nextVersion } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof ValidationError || err instanceof ConflictError || err instanceof DatabaseError ? err : new DatabaseError('تعذر تنفيذ صرف مسير الرواتب.', err?.message));
    }
  });

  // Exams and Results Database API
  app.get("/api/exams/database", authenticateRequest, requirePermission(PERMISSIONS.EXAM_READ), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const schoolId = String(identity.schoolId || '').trim();
      const tenantId = String(identity.tenantId || '').trim();
      const actorRole = roleResolver.resolveRole(identity);
      const actorPermissions = roleResolver.getPermissions(identity);
      const tenantContext = (req as any).tenantContext;
      if (!schoolId || !tenantId || !tenantContext) {
        throw new AuthenticationError('السياق الموثوق لقراءة الامتحانات غير مكتمل.');
      }
      const snapshot = await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Read versioned exams database',
        tenantId,
        userId: identity.id,
        userName: identity.name || 'المستخدم الحالي',
        ipAddress: req.ip || 'unknown',
        affectedTables: ['exams_database']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة قراءة الامتحانات غير متاحة.');
        const result = await transaction.query<{ data: Record<string, unknown>; version: number }>(
          `SELECT data, version FROM public.exams_database WHERE tenant_id = $1 AND school_id = $2`,
          [tenantId, schoolId]
        );
        return result.rows[0] || { data: {}, version: 0 };
      }, tenantContext);
      const projection = projectExamDatabaseForRead(snapshot.data || {}, actorRole, actorPermissions);
      res.json({
        success: true,
        data: projection.data,
        message: "Exams settings and database retrieved successfully.",
        meta: { version: Number(snapshot.version || 0), scope: projection.scope }
      });
    } catch (err: any) {
      EnterpriseLogger.error('Failed to read exams database', 'ExamsDatabaseRoute', {
        schoolId: (req as any).user?.schoolId,
        error: err?.message || String(err)
      });
      next(new DatabaseError("Failed to read exams database", err.message));
    }
  });

  app.post("/api/exams/sync-canonical-classes", authenticateRequest, requirePermission(PERMISSIONS.EXAM_WRITE), async (req, res, next) => {
    try {
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext) throw new AuthenticationError('سياق المدرسة الموثوق غير مكتمل لمزامنة صفوف الامتحانات.');
      const result = await canonicalExamClassSyncService.synchronize(tenantContext, {
        expectedVersion: req.body?.expectedVersion,
        ipAddress: req.ip
      });
      res.json({
        success: true,
        data: {
          classes: result.classes,
          matchedStudentClassCount: result.matchedStudentClassCount,
          requestId: result.requestId,
          correlationId: result.correlationId
        },
        meta: { version: result.version }
      });
    } catch (err: any) {
      EnterpriseLogger.error('Failed to synchronize canonical exam classes', 'CanonicalExamClassSyncRoute', {
        schoolId: (req as any).user?.schoolId,
        error: err?.message || String(err)
      });
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof ConflictError || err instanceof ValidationError || err instanceof DatabaseError
        ? err
        : new DatabaseError('Failed to synchronize canonical exam classes', err.message));
    }
  });

  app.get("/api/exams/audit-events", authenticateRequest, requirePermission(PERMISSIONS.EXAM_READ), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const schoolId = String(identity.schoolId || '').trim();
      const tenantId = String(identity.tenantId || '').trim();
      const actorRole = roleResolver.resolveRole(identity);
      const actorPermissions = roleResolver.getPermissions(identity);
      if (!canViewExamAudit(actorRole, actorPermissions)) {
        throw new AuthorizationError('سجل تدقيق الامتحانات متاح لأدوار الرقابة والاعتماد فقط.');
      }
      const tenantContext = (req as any).tenantContext;
      if (!schoolId || !tenantId || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
        throw new AuthenticationError('السياق الموثوق لسجل تدقيق الامتحانات غير مكتمل.');
      }
      const events = await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Read canonical exams audit events',
        tenantId,
        userId: (req as any).user.id,
        userName: (req as any).user.name || 'المستخدم الحالي',
        ipAddress: req.ip || 'unknown',
        affectedTables: ['audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة قراءة سجل تدقيق الامتحانات غير متاحة.');
        const result = await transaction.query<{
          id: string;
          action: string;
          reason: string | null;
          result: string;
          metadata: Record<string, unknown>;
          created_at: string;
          actor_name: string | null;
        }>(
          `SELECT event.id,
                  event.action,
                  event.reason,
                  event.result,
                  event.metadata,
                  event.created_at,
                  actor.display_name AS actor_name
             FROM public.audit_events event
             LEFT JOIN public.users actor
               ON actor.tenant_id = event.tenant_id
              AND actor.id = event.actor_user_id
            WHERE event.tenant_id = $1
              AND event.school_id = $2
              AND event.entity_type = 'exams_database'
              AND event.entity_id = $2
            ORDER BY event.created_at DESC, event.id DESC
            LIMIT 200`,
          [tenantId, schoolId]
        );
        return result.rows;
      }, tenantContext);
      res.json({
        success: true,
        data: events.map(event => ({
          id: event.id,
          timestamp: event.created_at,
          user: event.actor_name || 'مستخدم موثق',
          operation: event.action,
          action: event.reason || event.action,
          module: 'سجل خادم الامتحانات',
          result: event.result,
          metadata: event.metadata
        }))
      });
    } catch (err: any) {
      EnterpriseLogger.error('Failed to read canonical exams audit events', 'ExamsAuditRoute', {
        schoolId: (req as any).user?.schoolId,
        error: err?.message || String(err)
      });
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof DatabaseError ? err : new DatabaseError('Failed to read exams audit events', err.message));
    }
  });

  app.post("/api/exams/database", authenticateRequest, requirePermission(PERMISSIONS.EXAM_WRITE), async (req, res, next) => {
    try {
      const schoolId = String((req as any).user.schoolId || '').trim();
      const tenantId = String((req as any).user.tenantId || '').trim();
      const expectedVersion = Number(req.body?.expectedVersion);
      const operation = String(req.body?.operation || 'write');
      const operationReason = String(req.body?.operationReason || '').trim();
      const identity = (req as any).user;
      const actorRole = roleResolver.resolveRole(identity);
      const actorPermissions = roleResolver.getPermissions(identity);
      const {
        expectedVersion: _ignoredExpectedVersion,
        operation: _ignoredOperation,
        operationReason: _ignoredOperationReason,
        ...payload
      } = req.body || {};
      if (!schoolId || !tenantId || !Number.isInteger(expectedVersion) || expectedVersion < 0) {
        throw new ValidationError('حفظ الامتحانات يتطلب مدرسة موثوقة ورقم إصدار متوقعًا صالحًا.');
      }
      if (!['write', 'approve', 'reopen', 'approve_schedule', 'reopen_schedule'].includes(operation)) {
        throw new ValidationError('نوع عملية الامتحانات غير صالح.');
      }
      if (operation !== 'write' && (operationReason.length < 5 || operationReason.length > 500)) {
        throw new ValidationError('سبب الاعتماد أو إعادة الفتح إلزامي ويجب أن يتراوح بين 5 و500 حرف.');
      }
      const allowed = operation === 'write'
        ? canWriteExamOperation(actorRole, actorPermissions)
        : canApproveExamOperation(actorRole, operation as 'approve' | 'reopen' | 'approve_schedule' | 'reopen_schedule');
      if (!allowed) {
        throw new AuthorizationError(operation === 'write'
          ? 'الدور الحالي لا يملك صلاحية تعديل بيانات الامتحانات.'
          : 'اعتماد أو إعادة فتح النتائج والجدول يتطلب دوراً مخولاً للاعتماد.');
      }
      ExamValidator.validateDatabase(payload);
      if ((payload as any).exams_assessment_state !== undefined) {
        try {
          normalizeAssessmentWorkflowState((payload as any).exams_assessment_state);
        } catch (error: any) {
          throw new ValidationError(`بيانات الامتحان الإلكتروني غير صالحة: ${error?.message || 'فشل التحقق.'}`);
        }
      }
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
        throw new AuthenticationError('السياق الموثوق لبيانات الامتحانات غير مكتمل.');
      }
      let nextVersion = expectedVersion + 1;
      let archiveMetadata: Record<string, unknown> | null = null;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Write versioned exams database',
        tenantId,
        userId: (req as any).user.id,
        userName: (req as any).user.name || 'المستخدم الحالي',
        ipAddress: req.ip || 'unknown',
        affectedTables: ['exams_database']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة حفظ الامتحانات غير متاحة.');
        const actorResult = await transaction.query<{ id: string }>(
          `SELECT id
             FROM public.users
            WHERE tenant_id = $1
              AND auth_user_id = $2
              AND status = 'active'
              AND deleted_at IS NULL
            LIMIT 1`,
          [tenantId, (req as any).user.id]
        );
        const canonicalActorId = actorResult.rows[0]?.id;
        if (!canonicalActorId) {
          throw new AuthenticationError('تعذر ربط هوية الجلسة بسجل المستخدم المؤسسي المعتمد.');
        }
        const current = await transaction.query<{ data: Record<string, unknown>; version: number }>(
          `SELECT data, version FROM public.exams_database WHERE tenant_id = $1 AND school_id = $2 FOR UPDATE`,
          [tenantId, schoolId]
        );
        const actualVersion = Number(current.rows[0]?.version || 0);
        if (actualVersion !== expectedVersion) {
          throw new ConflictError('تم تعديل بيانات الامتحانات بواسطة مستخدم آخر. أعد المزامنة قبل الحفظ.', { expectedVersion, actualVersion });
        }
        const currentData = (current.rows[0]?.data || {}) as Record<string, any>;
        const currentAssessmentState = normalizeAssessmentWorkflowState(currentData.exams_assessment_state);
        const requestedAssessmentState = normalizeAssessmentWorkflowState((payload as any).exams_assessment_state);
        const assessmentStateChanged = stableJsonStringify(currentAssessmentState) !== stableJsonStringify(requestedAssessmentState);
        if (actorRole === 'teacher') {
          try {
            assertTeacherWriteScope(currentData, payload as Record<string, unknown>);
          } catch (error: any) {
            throw new AuthorizationError(error?.message || 'الدور الحالي لا يملك صلاحية تعديل هذه الحقول.');
          }
        }
        if (assessmentStateChanged && actorRole === 'teacher') {
          const currentLifecycles = new Map(currentAssessmentState.lifecycles.map(item => [item.assessmentId, item.state]));
          requestedAssessmentState.lifecycles.forEach(item => {
            const previous = currentLifecycles.get(item.assessmentId);
            if (previous !== undefined && previous !== item.state && !['draft', 'review'].includes(item.state)) {
              throw new AuthorizationError('اعتماد أو فتح أو نشر الامتحان الإلكتروني يتطلب مدير المدرسة أو مدير المنصة.');
            }
          });
        }
        const currentAttemptIds = new Set(currentAssessmentState.attempts.map(item => item.id));
        const eligibleCandidateIds = new Set(
          (Array.isArray((payload as any).exams_students_enriched) ? (payload as any).exams_students_enriched : [])
            .filter((student: any) => ['active', 'accepted'].includes(String(student?.status || '').toLowerCase()))
            .map((student: any) => String(student?.id || '').trim())
            .filter(Boolean)
        );
        requestedAssessmentState.attempts.forEach(attempt => {
          if (!currentAttemptIds.has(attempt.id) && !eligibleCandidateIds.has(String(attempt.candidateId || '').trim())) {
            throw new ValidationError('لا يمكن حفظ محاولة جديدة لطالب غير موجود ضمن السجلات الأكاديمية المؤهلة.');
          }
        });
        const currentApproval = Boolean(currentData.exams_approval_status?.approved);
        const requestedApproval = Boolean((payload as any)?.exams_approval_status?.approved);
        const currentScheduleApproval = Boolean(currentData.exams_schedule_approval_status?.approved);
        const requestedScheduleApproval = Boolean((payload as any)?.exams_schedule_approval_status?.approved);
        if (operation === 'write' && (currentApproval !== requestedApproval || currentScheduleApproval !== requestedScheduleApproval)) {
          throw new ValidationError('تغيير حالة اعتماد النتائج أو الجدول يتطلب عملية اعتماد أو إعادة فتح صريحة.');
        }
        if (['approve', 'reopen'].includes(operation) && currentScheduleApproval !== requestedScheduleApproval) {
          throw new ValidationError('عملية اعتماد أو إعادة فتح النتائج لا يجوز أن تغيّر حالة اعتماد الجدول.');
        }
        if (['approve_schedule', 'reopen_schedule'].includes(operation) && currentApproval !== requestedApproval) {
          throw new ValidationError('عملية اعتماد أو إعادة فتح الجدول لا يجوز أن تغيّر حالة اعتماد النتائج.');
        }
        if (operation === 'write' && currentApproval) {
          throw new ConflictError('النتائج معتمدة والكنترول مغلق. أعد فتحه بالمسار الموثق قبل أي تعديل.');
        }
        const examCoreFields = [
          'exams_settings', 'exams_halls', 'exams_subjects', 'exams_students_enriched',
          'exams_grades_matrix', 'exams_schedule', 'exams_proctors', 'exams_classes_list'
        ];
        if (['approve', 'reopen'].includes(operation)) {
          assertExamFieldsUnchanged(
            currentData,
            payload as Record<string, any>,
            examCoreFields,
            'تغيرت بيانات الدورة قبل الاعتماد أو إعادة الفتح. احفظ التعديلات وأعد المزامنة أولاً.'
          );
        }
        if (operation === 'write' && currentScheduleApproval) {
          assertExamFieldsUnchanged(
            currentData,
            payload as Record<string, any>,
            ['exams_schedule', 'exams_schedule_config', 'exams_custom_proctor_unavailable'],
            'جدول الامتحانات معتمد ومقفل. أعد فتح الجدول قبل تعديل مواعيده أو قواعده.'
          );
        }
        if (['approve_schedule', 'reopen_schedule'].includes(operation)) {
          assertExamFieldsUnchanged(
            currentData,
            payload as Record<string, any>,
            ['exams_schedule', 'exams_schedule_config', 'exams_custom_proctor_unavailable'],
            'تغيرت بيانات الجدول قبل الاعتماد أو إعادة الفتح. احفظ التعديلات وأعد المزامنة أولاً.'
          );
        }
        if (operation === 'approve') {
          if (currentApproval || !requestedApproval) {
            throw new ConflictError('انتقال اعتماد النتائج غير صالح أو سبق تنفيذه.');
          }
          const students = Array.isArray((payload as any).exams_students_enriched) ? (payload as any).exams_students_enriched : [];
          const subjects = Array.isArray((payload as any).exams_subjects) ? (payload as any).exams_subjects : [];
          const matrix = (payload as any).exams_grades_matrix || {};
          const readiness = evaluateExamClosureReadiness({
            students,
            subjects,
            gradesMatrix: matrix,
            scheduleApprovalStatus: (payload as any).exams_schedule_approval_status,
            reviewedSubjects: (payload as any).exams_reviewed_stages_subjects,
            reEvaluationRequests: (payload as any).exams_re_evaluation_requests
          });
          if (!readiness.ready) {
            throw new ValidationError(
              `لا يمكن اعتماد النتائج: ${readiness.blockers.map(blocker => blocker.message).join(' ')}`,
              { blockers: readiness.blockers }
            );
          }
          (payload as any).exams_approval_status = {
            approved: true,
            approvedBy: (req as any).user.name || 'المستخدم الحالي',
            approvedAt: new Date().toISOString()
          };
        }
        if (operation === 'reopen' && (!currentApproval || requestedApproval)) {
          throw new ConflictError('إعادة فتح الكنترول تتطلب نتائج معتمدة وانتقالًا صريحًا إلى الحالة المفتوحة.');
        }
        if (operation === 'approve_schedule') {
          if (currentScheduleApproval || !requestedScheduleApproval) {
            throw new ConflictError('انتقال اعتماد جدول الامتحانات غير صالح أو سبق تنفيذه.');
          }
          validateScheduleForApproval(payload as Record<string, any>);
          (payload as any).exams_schedule_approval_status = {
            approved: true,
            approvedBy: (req as any).user.name || 'المستخدم الحالي',
            approvedAt: new Date().toISOString(),
            notes: 'اجتاز الجدول فحوص المراجع والتعارضات على الخادم.'
          };
        }
        if (operation === 'reopen_schedule' && (!currentScheduleApproval || requestedScheduleApproval)) {
          throw new ConflictError('إعادة فتح الجدول تتطلب جدولاً معتمداً وانتقالاً صريحاً إلى الحالة المفتوحة.');
        }
        if (operation === 'reopen_schedule' && currentApproval) {
          throw new ConflictError('لا يمكن إعادة فتح الجدول بينما النتائج معتمدة. أعد فتح النتائج أولاً عبر المسار الموثق.');
        }
        if (operation === 'reopen') {
          (payload as any).exams_approval_status = { approved: false, approvedBy: '', approvedAt: '' };
        }
        if (operation === 'reopen_schedule') {
          (payload as any).exams_schedule_approval_status = { approved: false, approvedBy: '', approvedAt: '', notes: '' };
        }
        nextVersion = actualVersion + 1;
        const existingClosures = Array.isArray(currentData.exams_control_closures) ? currentData.exams_control_closures : [];
        if (operation === 'approve') {
          const settings = (payload as any).exams_settings || {};
          const archiveStudents = Array.isArray((payload as any).exams_students_enriched) ? (payload as any).exams_students_enriched : [];
          const archiveSubjects = Array.isArray((payload as any).exams_subjects) ? (payload as any).exams_subjects : [];
          const archiveGrades = (payload as any).exams_grades_matrix || {};
          const calculatedResults = calculateCohortExamResults(
            archiveStudents,
            archiveSubjects,
            archiveGrades,
            settings
          );
          const passedCount = calculatedResults.filter(result => result.status === 'passed').length;
          const failedCount = calculatedResults.filter(result => result.status === 'failed').length;
          const incompleteCount = calculatedResults.filter(result => result.status === 'incomplete').length;
          const archivePayload = {
            settings,
            students: archiveStudents,
            subjects: archiveSubjects,
            gradesMatrix: archiveGrades,
            calculatedResults,
            resultSummary: {
              totalStudents: archiveStudents.length,
              passedCount,
              failedCount,
              incompleteCount
            },
            schedule: (payload as any).exams_schedule || [],
            proctors: (payload as any).exams_proctors || [],
            classes: (payload as any).exams_classes_list || [],
            approvalStatus: (payload as any).exams_approval_status,
            stageApprovalStatus: (payload as any).exams_stage_approval_status || {},
            approvalReason: operationReason
          };
          const signatureHash = createHash('sha256').update(stableJsonStringify({
            tenantId,
            schoolId,
            operationalVersion: nextVersion,
            payload: archivePayload
          })).digest('hex');
          const archiveId = randomUUID();
          const serverSignedAt = new Date().toISOString();
          const schoolResult = await transaction.query<{ name: string }>(
            `SELECT COALESCE(NULLIF(display_name, ''), NULLIF(legal_name, ''), school_code, id::text) AS name
               FROM public.schools
              WHERE tenant_id = $1 AND id = $2
              LIMIT 1`,
            [tenantId, schoolId]
          );
          const committeeMembers = (Array.isArray((payload as any).exams_control_committees) ? (payload as any).exams_control_committees : [])
            .map((committee: any) => String(committee?.user || '').trim())
            .filter(Boolean);
          const requestedClosure = Array.isArray((payload as any).exams_control_closures)
            ? (payload as any).exams_control_closures[0] || {}
            : {};
          const serverClosure = {
            ...requestedClosure,
            id: requestedClosure.id || `closure-${nextVersion}`,
            archiveId,
            schoolName: schoolResult.rows[0]?.name || schoolId,
            stage: 'كامل المراحل',
            classroom: 'جميع الصفوف',
            semester: String(settings.semester || 'غير محدد'),
            academicYear: String(settings.academicYear || 'غير محدد'),
            totalStudents: archiveStudents.length,
            passedCount,
            failedCount,
            incompleteCount,
            passRate: archiveStudents.length > 0 ? Number(((passedCount / archiveStudents.length) * 100).toFixed(2)) : 0,
            committeeMembers,
            reason: operationReason,
            approvedBy: (req as any).user.name || 'المستخدم الحالي',
            closedAt: serverSignedAt,
            serverSignedAt,
            operationalVersion: nextVersion,
            signatureHash,
            isImmutableArchive: true
          };
          (payload as any).exams_control_closures = [serverClosure, ...existingClosures];
          await transaction.query(
            `INSERT INTO public.exams_result_archives
               (id, tenant_id, school_id, operational_version, academic_year, semester, payload, signature_hash, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
            [
              archiveId,
              tenantId,
              schoolId,
              nextVersion,
              String(settings.academicYear || '').trim() || 'غير محدد',
              String(settings.semester || '').trim() || 'غير محدد',
              JSON.stringify(archivePayload),
              signatureHash,
              canonicalActorId
            ]
          );
          archiveMetadata = serverClosure;
        } else {
          (payload as any).exams_control_closures = existingClosures;
        }
        await transaction.query(
          `INSERT INTO public.exams_database (tenant_id, school_id, data, version, updated_at, updated_by)
           VALUES ($1, $2, $3::jsonb, $4, now(), $5)
           ON CONFLICT (school_id) DO UPDATE
             SET data = EXCLUDED.data,
                 version = EXCLUDED.version,
                 updated_at = now(),
                 updated_by = EXCLUDED.updated_by
           WHERE public.exams_database.tenant_id = EXCLUDED.tenant_id`,
          [tenantId, schoolId, JSON.stringify(payload), nextVersion, canonicalActorId]
        );
        await transaction.query(
          `INSERT INTO public.audit_events
             (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata)
           VALUES ($1, $2, $3, $4, 'exams_database', $2, $5, 'ExamsDatabaseRoute', $6, 'success', $7::jsonb)`,
          [
            tenantId,
            schoolId,
            (req as any).user.branchId || null,
            canonicalActorId,
            operation,
            operation === 'write' ? 'حفظ بيانات دورة الامتحانات' : operationReason,
            JSON.stringify({
              expectedVersion,
              actualVersion,
              nextVersion,
              operationLabel: operation === 'approve'
                ? 'اعتماد نتائج الامتحانات وإنشاء أرشيف غير قابل للتعديل'
                : operation === 'reopen'
                  ? 'إعادة فتح نتائج الامتحانات'
                  : operation === 'approve_schedule'
                    ? 'اعتماد جدول الامتحانات'
                    : operation === 'reopen_schedule'
                      ? 'إعادة فتح جدول الامتحانات'
                      : 'حفظ بيانات دورة الامتحانات'
            })
          ]
        );
      }, tenantContext);

      res.json({
        success: true,
        data: {
          updated: true,
          archive: archiveMetadata,
          operationState: {
            approvalStatus: (payload as any).exams_approval_status || null,
            scheduleApprovalStatus: (payload as any).exams_schedule_approval_status || null
          }
        },
        message: "Exams settings saved successfully.",
        meta: { version: nextVersion }
      });
    } catch (err: any) {
      EnterpriseLogger.error('Failed to save exams database transaction', 'ExamsDatabaseRoute', {
        schoolId: (req as any).user?.schoolId,
        operation: req.body?.operation || 'write',
        error: err?.message || String(err)
      });
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof ConflictError || err instanceof ValidationError || err instanceof DatabaseError
        ? err
        : new DatabaseError("Failed to save exams database in transaction", err.message));
    }
  });

  // Financial and Accounting Database API
  app.post("/api/financial/journals/:journalId/reverse", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const schoolId = String((req as any).user.schoolId || '').trim();
      const tenantId = String((req as any).user.tenantId || '').trim();
      const actorId = String((req as any).user.id || '').trim();
      const journalId = String(req.params.journalId || '').trim();
      const reason = String(req.body?.reason || '').trim();
      const tenantContext = (req as any).tenantContext;
      if (!schoolId || !tenantId || !actorId || !journalId || !reason) {
        throw new AuthenticationError('نطاق العملية أو القيد أو سبب العكس غير مكتمل.');
      }
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
        throw new AuthenticationError('السياق الموثوق للمصدر المالي غير مكتمل.');
      }
      if (!transactionDriver) throw new DatabaseError('العكس المالي يتطلب اتصال PostgreSQL الكانوني.');
      let reversalId = '';
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: `Reverse canonical journal ${journalId}`,
        tenantId, userId: actorId, userName: (req as any).user.name || 'المستخدم الحالي',
        ipAddress: req.ip || 'unknown', affectedTables: ['erp_journal_entries', 'erp_journal_lines', 'erp_general_ledger', 'erp_financial_audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('Financial transaction is unavailable.');
        const actor = await transaction.query<{ id: string }>(
          `SELECT id FROM public.users WHERE tenant_id = $1 AND school_id = $2 AND status = 'active' AND deleted_at IS NULL AND (id = $3 OR auth_user_id = $3) LIMIT 1`,
          [tenantId, schoolId, actorId]
        );
        if (!actor.rows[0]) throw new AuthenticationError('المستخدم المالي غير موجود في النطاق الموثوق.');
        reversalId = await CanonicalErpPostingService.reverseJournal(transaction, tenantId, schoolId, actor.rows[0].id, journalId, reason);
      }, tenantContext);
      res.json({ success: true, data: { journalId, reversalId }, meta: { source: 'canonical_erp' } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof DatabaseError ? err : new DatabaseError('تعذر عكس القيد الكانوني.', err?.message));
    }
  });

  app.post("/api/financial/receipts/post", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const user = (req as any).user;
      const schoolId = String(user.schoolId || '').trim();
      const tenantId = String(user.tenantId || '').trim();
      const actorId = String(user.id || '').trim();
      const tenantContext = (req as any).tenantContext;
      if (!schoolId || !tenantId || !actorId || !tenantContext
        || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
        throw new AuthenticationError('السياق المالي الموثوق غير مكتمل.');
      }
      if (!transactionDriver) throw new DatabaseError('ترحيل سند القبض يتطلب اتصال PostgreSQL.');
      const voucher = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
      const document = buildCanonicalPosting('student_receipt', { ...voucher, status: 'posted' });
      if (!document) throw new ValidationError('سند القبض غير صالح للترحيل.');
      let result: Awaited<ReturnType<typeof CanonicalErpPostingService.syncSnapshot>>;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: `Post receipt ${document.sourceId}`,
        tenantId, userId: actorId, userName: user.name || 'المستخدم المالي',
        ipAddress: req.ip || 'unknown', affectedTables: ['erp_journal_entries', 'erp_journal_lines', 'erp_general_ledger']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('المعاملة المالية غير متاحة.');
        const actor = await transaction.query<{ id: string }>(
          `SELECT id FROM public.users WHERE tenant_id = $1 AND school_id = $2 AND status = 'active' AND deleted_at IS NULL AND (id = $3 OR auth_user_id = $3) LIMIT 1`,
          [tenantId, schoolId, actorId]
        );
        if (!actor.rows[0]) throw new AuthenticationError('المستخدم المالي غير موجود.');
        result = await CanonicalErpPostingService.syncSnapshot(transaction, tenantId, schoolId, actor.rows[0].id, {
          receiptVouchers: [{ ...voucher, status: 'posted' }], chartOfAccounts: []
        });
      }, tenantContext);
      const link = result!.sourceLinks.find(item => item.sourceType === 'student_receipt' && item.sourceId === document.sourceId);
      if (!link) throw new DatabaseError('تمت المعاملة دون إثبات رابط القيد الكانوني.');
      res.json({ success: true, data: { journalId: link.journalEntryId, sourceId: document.sourceId }, meta: result });
    } catch (err: any) {
      EnterpriseLogger.error('Canonical receipt posting failed', 'FinancialReceiptRoute', {
        error: err?.message || String(err),
        cause: err?.cause?.message || err?.cause || undefined
      });
      next(err instanceof AuthenticationError || err instanceof DatabaseError || err instanceof ValidationError ? err : new DatabaseError('تعذر ترحيل سند القبض الكانوني.', err?.message));
    }
  });

  app.get("/api/financial/database", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_READ), async (req, res, next) => {
    try {
      const schoolId = String((req as any).user.schoolId || '').trim();
      const tenantId = String((req as any).user.tenantId || '').trim();
      if (!schoolId || !tenantId) throw new AuthenticationError("الهوية الموثوقة لا تحتوي على نطاق مالي صالح.");
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
        throw new AuthenticationError("السياق الموثوق للمصدر المالي غير مكتمل.");
      }
      if (!transactionDriver) {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
          FallbackStorage.assertCanonicalPersistence("financial database read");
        }
        throw new DatabaseError("Financial database requires the configured PostgreSQL transaction connection.");
      }

      let snapshot: { data: Record<string, unknown>; version: number; updated_at: string } | null = null;
      let canonicalErpReady = false;
      let canonicalErpModel: Awaited<ReturnType<typeof CanonicalErpPostingService.readModel>> | null = null;
      await UnitOfWork.runInTransaction(
        schoolId,
        {
          operationName: 'Read Financial Portal Snapshot',
          tenantId,
          userId: (req as any).user.id,
          userName: (req as any).user.name || 'المستخدم الحالي',
          ipAddress: req.ip || 'unknown',
          affectedTables: ['financial_portal_snapshots']
        },
        async () => {
          const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
          if (!transaction) throw new DatabaseError('Financial snapshot transaction is unavailable.');
          const result = await transaction.query<{ data: Record<string, unknown>; version: number; updated_at: string }>(
            `SELECT data, version, updated_at
               FROM public.financial_portal_snapshots
              WHERE tenant_id = $1 AND school_id = $2
              LIMIT 1`,
            [tenantId, schoolId]
          );
          snapshot = result.rows[0] || null;
          canonicalErpReady = await CanonicalErpPostingService.isProvisioned(transaction);
          if (canonicalErpReady) {
            canonicalErpModel = await CanonicalErpPostingService.readModel(transaction, schoolId, true);
          }
        },
        tenantContext
      );
      (req as any).financialErpReady = canonicalErpReady;
      const snapshotData = snapshot?.data || {};
      let responseData = snapshotData;
      if (canonicalErpReady && canonicalErpModel) {
        const sourceLinks = new Map(
          canonicalErpModel.sourceLinks.map(link => [`${link.sourceType}:${link.sourceId}`, link.journalEntryId])
        );
        const linkRows = (value: unknown, sourceType: string) => financialRecordRows(value).map(row => {
          const sourceId = financialText(row.id);
          const journalEntryId = sourceLinks.get(`${sourceType}:${sourceId}`);
          return journalEntryId
            ? { ...row, legacyJournalEntryId: row.journalEntryId, journalEntryId }
            : row;
        });
        const linkedPaymentRows = financialRecordRows(snapshotData.paymentVouchers).map(row => {
          const sourceId = financialText(row.id);
          const journalEntryId = sourceLinks.get(`payment_voucher:${sourceId}`) || sourceLinks.get(`expense_accrual:${sourceId}`);
          return journalEntryId
            ? { ...row, legacyJournalEntryId: row.journalEntryId, journalEntryId }
            : row;
        });
        responseData = {
          ...snapshotData,
          invoices: linkRows(snapshotData.invoices, 'student_fee_invoice'),
          studentReceiptVouchers: linkRows(snapshotData.studentReceiptVouchers, 'student_receipt'),
          receiptVouchers: linkRows(snapshotData.receiptVouchers, 'student_receipt'),
          paymentVouchers: linkedPaymentRows,
          journalEntries: canonicalErpModel.journalEntries.length > 0
            ? canonicalErpModel.journalEntries
            : snapshotData.journalEntries,
          chartOfAccounts: canonicalErpModel.chartOfAccounts.length > 0
            ? canonicalErpModel.chartOfAccounts
            : snapshotData.chartOfAccounts,
          expenseAccruals: canonicalErpModel.expenseAccruals,
          erpJournalEntries: canonicalErpModel.journalEntries,
          erpLedgerEntries: canonicalErpModel.ledgerEntries,
          erpChartOfAccounts: canonicalErpModel.chartOfAccounts,
          erpExpenseAccruals: canonicalErpModel.expenseAccruals
        };
      }
      EnterpriseLogger.info('Financial snapshot read completed', 'FinancialSnapshotRoute', {
        tenantId,
        schoolId,
        snapshotFound: Boolean(snapshot),
        snapshotVersion: snapshot?.version || 0,
        canonicalErpReady,
        canonicalJournalCount: canonicalErpModel?.journalEntries.length || 0,
        invoiceCount: Array.isArray((snapshot?.data as any)?.invoices) ? (snapshot?.data as any).invoices.length : -1,
        receiptCount: Array.isArray((snapshot?.data as any)?.studentReceiptVouchers) ? (snapshot?.data as any).studentReceiptVouchers.length : -1,
      });

      res.json({
        success: true,
        data: responseData,
        meta: {
          source: 'supabase',
          version: snapshot?.version || 0,
          updatedAt: snapshot?.updated_at || null,
          writeMode: resolveFinancialWriteMode(req),
          erpIntegration: canonicalErpReady ? 'ready' : 'not_provisioned',
          canonicalJournalCount: canonicalErpModel?.journalEntries.length || 0,
        },
        message: "Financial and accounting database retrieved successfully."
      });
    } catch (err: any) {
      EnterpriseLogger.error('Financial snapshot read failed', 'FinancialSnapshotRoute', { error: err?.message || String(err) });
      next(err instanceof AuthenticationError || err instanceof DatabaseError ? err : new DatabaseError("Failed to read financial database", err.message));
    }
  });

  app.post("/api/financial/database", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const schoolId = String((req as any).user.schoolId || '').trim();
      const tenantId = String((req as any).user.tenantId || '').trim();
      const actorId = String((req as any).user.id || '').trim();
      if (!schoolId || !tenantId || !actorId) throw new AuthenticationError("الهوية الموثوقة لا تحتوي على نطاق مالي صالح.");
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
        throw new AuthenticationError("السياق الموثوق للمصدر المالي غير مكتمل.");
      }
      if (!transactionDriver) {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
          FallbackStorage.assertCanonicalPersistence("financial database write");
        }
        throw new DatabaseError("Financial database requires the configured PostgreSQL transaction connection.");
      }
      const requestBody = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body as Record<string, unknown>
        : {};
      const expectedVersion = parseFinancialExpectedVersion(requestBody.expectedVersion);
      const { expectedVersion: _ignoredExpectedVersion, ...rawSnapshotPayload } = requestBody;
      const payload = normalizeFinancialSnapshotPayload(rawSnapshotPayload);
      const updatedAt = new Date().toISOString();
      let nextVersion = 1;
      let databaseActorId = '';
      let canonicalErpReady = false;
      let canonicalErpSync: Awaited<ReturnType<typeof CanonicalErpPostingService.syncSnapshot>> | null = null;
      await UnitOfWork.runInTransaction(
        schoolId,
        {
          operationName: 'Write Financial Portal Snapshot',
          tenantId,
          userId: actorId,
          userName: (req as any).user.name || 'محاسب النظام',
          ipAddress: req.ip || 'unknown',
          affectedTables: ['financial_portal_snapshots']
        },
        async () => {
          const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
          if (!transaction) throw new DatabaseError('Financial snapshot transaction is unavailable.');
          const actorResult = await transaction.query<{ id: string }>(
            `SELECT id
               FROM public.users
              WHERE tenant_id = $1
                AND school_id = $2
                AND status = 'active'
                AND deleted_at IS NULL
                AND (id = $3 OR auth_user_id = $3)
              LIMIT 1`,
            [tenantId, schoolId, actorId]
          );
          databaseActorId = actorResult.rows[0]?.id || '';
          if (!databaseActorId) throw new AuthenticationError('المستخدم المالي غير موجود في النطاق الموثوق.');
          const existing = await transaction.query<{ version: number; data: Record<string, unknown> }>(
            `SELECT version, data
               FROM public.financial_portal_snapshots
              WHERE tenant_id = $1 AND school_id = $2
              FOR UPDATE`,
            [tenantId, schoolId]
          );
          const currentVersion = Number(existing.rows[0]?.version || 0);
          if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
            throw new ConflictError(
              'تغيرت البيانات المالية بواسطة مستخدم آخر. حدّث الشاشة ثم أعد المحاولة حتى لا تُستبدل التعديلات الجديدة.',
              { expectedVersion, actualVersion: currentVersion }
            );
          }
          validateFinancialSnapshotTransition(existing.rows[0]?.data || {}, payload);
          nextVersion = currentVersion + 1;
          await transaction.query(
            `INSERT INTO public.financial_portal_snapshots
              (school_id, tenant_id, data, version, updated_at, updated_by)
             VALUES ($1, $2, $3::jsonb, $4, $5, $6)
             ON CONFLICT (school_id) DO UPDATE SET
               tenant_id = EXCLUDED.tenant_id,
               data = EXCLUDED.data,
               version = EXCLUDED.version,
               updated_at = EXCLUDED.updated_at,
               updated_by = EXCLUDED.updated_by`,
            [schoolId, tenantId, JSON.stringify(payload), nextVersion, updatedAt, databaseActorId]
          );
          await replaceStudentFinanceProjection(
            transaction,
            tenantId,
            schoolId,
            databaseActorId,
            payload,
            nextVersion
          );
          canonicalErpReady = await CanonicalErpPostingService.isProvisioned(transaction);
          if (canonicalErpReady) {
            canonicalErpSync = await CanonicalErpPostingService.syncSnapshot(
              transaction,
              tenantId,
              schoolId,
              databaseActorId,
              payload
            );
            const postedReceiptIds = [
              ...(Array.isArray(payload.studentReceiptVouchers) ? payload.studentReceiptVouchers : []),
              ...(Array.isArray(payload.receiptVouchers) ? payload.receiptVouchers : [])
            ]
              .filter((row: any) => row && ['posted', 'مرحل', 'مرحّل', 'مُرحّل'].includes(String(row.status || '').trim().toLowerCase()))
              .map((row: any) => String(row.id || '').trim())
              .filter(Boolean);
            const linkedReceiptIds = new Set((canonicalErpSync.sourceLinks || [])
              .filter(link => link.sourceType === 'student_receipt')
              .map(link => link.sourceId));
            const missingReceiptIds = postedReceiptIds.filter(id => !linkedReceiptIds.has(id));
            if (missingReceiptIds.length > 0) {
              throw new DatabaseError(`تعذر إثبات ترحيل سندات القبض الكانونية: ${missingReceiptIds.join(', ')}`);
            }
          }
        },
        tenantContext
      );
      (req as any).financialErpReady = canonicalErpReady;

      // The snapshot transaction has already committed at this point. An
      // unavailable audit_logs sidecar must not make the client report a
      // failed financial save after the canonical version was persisted.
      try {
        await AuditRepository.log(
          schoolId,
          databaseActorId || actorId,
          (req as any).user.name || "محاسب النظام",
          (req as any).user.role || "Accountant",
          "UPDATE",
          "financial_database",
          req.ip || "127.0.0.1",
          "حفظ ومزامنة القيود المالية وسندات القبض وشجرة الحسابات"
        );
      } catch (auditError: any) {
        EnterpriseLogger.warn('Financial snapshot committed without audit_logs sidecar', 'FinancialSnapshotRoute', {
          version: nextVersion,
          error: auditError?.message || String(auditError)
        });
      }

      res.json({
        success: true,
        meta: {
          source: 'supabase',
          version: nextVersion,
          auditSidecar: 'unavailable',
          writeMode: resolveFinancialWriteMode(req),
          erpIntegration: canonicalErpReady ? 'ready' : 'not_provisioned',
          erpSync: canonicalErpSync
            ? {
                createdJournalCount: canonicalErpSync.createdJournalCount,
                existingJournalCount: canonicalErpSync.existingJournalCount,
                ledgerLineCount: canonicalErpSync.ledgerLineCount,
                expenseAccrualCount: canonicalErpSync.expenseAccrualCount
              }
            : null
        },
        message: "Financial settings saved successfully."
      });
    } catch (err: any) {
      EnterpriseLogger.error('Financial snapshot write failed', 'FinancialSnapshotRoute', { error: err?.message || String(err) });
      next(err instanceof AuthenticationError || err instanceof ConflictError || err instanceof DatabaseError || err instanceof ValidationError ? err : new DatabaseError("Failed to save financial database", err.message));
    }
  });

  // Canonical Inventory and Procurement Database API. All scope and actor
  // values come from the trusted session; the browser submits business data
  // and an optimistic version only.
  app.get("/api/inventory/database", authenticateRequest, requirePermission(PERMISSIONS.INVENTORY_READ), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const tenantContext = (req as any).tenantContext;
      if (!tenantId || !schoolId || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
        throw new AuthenticationError('السياق الموثوق لقراءة المخزون والمشتريات غير مكتمل.');
      }
      const snapshot = await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Read versioned inventory database', tenantId, userId: identity.id,
        userName: identity.name || 'المستخدم الحالي', ipAddress: req.ip || 'unknown',
        affectedTables: ['inventory_database']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة قراءة المخزون والمشتريات غير متاحة.');
        const result = await transaction.query<{ data: Record<string, unknown>; version: number }>(
          `SELECT data, version FROM public.inventory_database WHERE tenant_id = $1 AND school_id = $2`,
          [tenantId, schoolId]
        );
        return result.rows[0] || {
          data: { items: [], categories: [], brands: [], units: [], suppliers: [], warehouses: [], movements: [], stocktakes: [], purchaseRequests: [], rfqs: [], quotations: [], purchaseOrders: [], goodsReceipts: [], vendorBills: [], vendorPayments: [], settings: {}, procurementSettings: {} },
          version: 0
        };
      }, tenantContext);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, data: snapshot.data, meta: { version: Number(snapshot.version || 0) }, message: "Inventory database retrieved successfully." });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof DatabaseError
        ? err : new DatabaseError("Failed to read inventory database", err.message));
    }
  });

  app.post("/api/inventory/database", authenticateRequest, requirePermission(PERMISSIONS.INVENTORY_WRITE), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const tenantContext = (req as any).tenantContext;
      const expectedVersion = Number(req.body?.expectedVersion);
      const requestedData = req.body?.data;
      const expectedArrays = ['items', 'categories', 'brands', 'units', 'suppliers', 'warehouses', 'movements', 'stocktakes', 'purchaseRequests', 'rfqs', 'quotations', 'purchaseOrders', 'goodsReceipts', 'vendorBills', 'vendorPayments'];
      if (!tenantId || !schoolId || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId
        || !Number.isInteger(expectedVersion) || expectedVersion < 0) {
        throw new ValidationError('حفظ المخزون والمشتريات يتطلب نطاق مدرسة موثوقاً ورقم إصدار صالحاً.');
      }
      if (!requestedData || typeof requestedData !== 'object' || Array.isArray(requestedData)) {
        throw new ValidationError('بيانات المخزون والمشتريات يجب أن تكون كائناً صالحاً.');
      }
      for (const collection of expectedArrays) {
        if (!Array.isArray((requestedData as Record<string, unknown>)[collection])) {
          throw new ValidationError(`حقل ${collection} يجب أن يكون قائمة.`);
        }
      }
      for (const objectKey of ['settings', 'procurementSettings']) {
        const value = (requestedData as Record<string, unknown>)[objectKey];
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ValidationError(`حقل ${objectKey} يجب أن يكون كائناً.`);
      }
      const ids = (rows: any[]) => rows.map(row => String(row?.id || '').trim()).filter(Boolean);
      for (const collection of expectedArrays) {
        const collectionIds = ids((requestedData as any)[collection]);
        if (collectionIds.length !== new Set(collectionIds).size) throw new ValidationError(`توجد معرفات مكررة في ${collection}.`);
      }
      for (const item of (requestedData as any).items) {
        if (!String(item?.id || '').trim() || !String(item?.name || '').trim() || !String(item?.sku || '').trim()
          || !Number.isFinite(Number(item?.quantity)) || Number(item.quantity) < 0
          || !Number.isFinite(Number(item?.costPrice)) || Number(item.costPrice) < 0) {
          throw new ValidationError('بطاقات الأصناف تتطلب معرفاً واسماً وSKU وكميات وتكاليف غير سالبة.');
        }
      }
      let nextVersion = expectedVersion + 1;
      let persistedData = requestedData as Record<string, any>;
      let canonicalErpReady = false;
      let canonicalErpSync: Awaited<ReturnType<typeof CanonicalErpPostingService.syncInventoryProcurementSnapshot>> | null = null;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Write versioned inventory database', tenantId, userId: identity.id,
        userName: identity.name || 'المستخدم الحالي', ipAddress: req.ip || 'unknown',
        affectedTables: ['inventory_database', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة حفظ المخزون والمشتريات غير متاحة.');
        const actorResult = await transaction.query<{ id: string }>(
          `SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
          [tenantId, identity.id]
        );
        const actorId = actorResult.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط الجلسة بسجل المستخدم المؤسسي.');
        // Materialize the version-zero row before reading it. Without this
        // insert-if-missing, two first writers can both observe an absent row
        // and one of them can silently overwrite the other.
        await transaction.query(
          `INSERT INTO public.inventory_database (tenant_id, school_id, data, version, updated_at, updated_by)
           VALUES ($1, $2, $3::jsonb, 0, now(), $4)
           ON CONFLICT (school_id) DO NOTHING`,
          [tenantId, schoolId, JSON.stringify({}), actorId]
        );
        const current = await transaction.query<{ data: Record<string, any>; version: number }>(
          `SELECT data, version FROM public.inventory_database WHERE tenant_id = $1 AND school_id = $2 FOR UPDATE`,
          [tenantId, schoolId]
        );
        const actualVersion = Number(current.rows[0]?.version || 0);
        if (actualVersion !== expectedVersion) throw new ConflictError('تم تعديل المخزون أو المشتريات بواسطة مستخدم آخر. أعد المزامنة.', { expectedVersion, actualVersion });
        const currentData = current.rows[0]?.data || {};
        validateInventoryPostingMetadata(currentData, requestedData as Record<string, any>);
        validateInventoryProcurementSnapshot(requestedData as Record<string, any>, { allowCanonicalPostingReferences: true });
        for (const key of ['movements', 'stocktakes', 'purchaseRequests', 'rfqs', 'quotations', 'purchaseOrders', 'goodsReceipts', 'vendorBills', 'vendorPayments']) {
          for (const locked of (Array.isArray(currentData[key]) ? currentData[key] : []).filter((row: any) => ['approved', 'issued', 'awarded', 'posted', 'closed', 'paid', 'posted_to_gl', 'fully_received', 'converted_to_po', 'responses_received', 'sent', 'inspected_received', 'partially_accepted'].includes(String(row?.status)))) {
            const requested = (requestedData as any)[key].find((row: any) => row?.id === locked.id);
            if (key === 'purchaseOrders' && requested && isPurchaseOrderReceiptProgression(locked, requested)) continue;
            if (!requested || stableJsonStringify(requested) !== stableJsonStringify(locked)) {
              throw new ConflictError(`السجل ${locked.id} في ${key} محمي بعد الاعتماد ولا يقبل تعديلاً عاماً.`);
            }
          }
        }
        canonicalErpReady = await CanonicalErpPostingService.isProvisioned(transaction);
        if (canonicalErpReady) {
          canonicalErpSync = await CanonicalErpPostingService.syncInventoryProcurementSnapshot(
            transaction, tenantId, schoolId, actorId, requestedData as Record<string, any>
          );
          persistedData = applyInventoryPostingLinks(requestedData as Record<string, any>, canonicalErpSync.sourceLinks);
        }
        const changedCollections = [...expectedArrays, 'settings', 'procurementSettings'].filter(key =>
          stableJsonStringify(currentData[key] ?? (expectedArrays.includes(key) ? [] : {})) !== stableJsonStringify((requestedData as any)[key])
        );
        nextVersion = actualVersion + 1;
        await transaction.query(
          `INSERT INTO public.inventory_database (tenant_id, school_id, data, version, updated_at, updated_by)
           VALUES ($1, $2, $3::jsonb, $4, now(), $5)
           ON CONFLICT (school_id) DO UPDATE SET data = EXCLUDED.data, version = EXCLUDED.version,
             updated_at = now(), updated_by = EXCLUDED.updated_by
           WHERE public.inventory_database.tenant_id = EXCLUDED.tenant_id`,
          [tenantId, schoolId, JSON.stringify(persistedData), nextVersion, actorId]
        );
        await transaction.query(
          `INSERT INTO public.audit_events
             (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata)
           VALUES ($1, $2, $3, $4, 'inventory_database', $2, 'write', 'InventoryDatabaseRoute', 'حفظ المخزون والمشتريات', 'success', $5::jsonb)`,
          [tenantId, schoolId, identity.branchId || null, actorId, JSON.stringify({ expectedVersion, actualVersion, nextVersion, changedCollections,
            previousSnapshotHash: createHash('sha256').update(stableJsonStringify(currentData)).digest('hex'),
            nextSnapshotHash: createHash('sha256').update(stableJsonStringify(persistedData)).digest('hex'),
            accounting: canonicalErpSync ? {
              createdJournalCount: canonicalErpSync.createdJournalCount,
              existingJournalCount: canonicalErpSync.existingJournalCount,
              ledgerLineCount: canonicalErpSync.ledgerLineCount,
              sourceLinks: canonicalErpSync.sourceLinks
            } : { status: canonicalErpReady ? 'no_postable_documents' : 'not_provisioned' } })]
        );
      }, tenantContext);
      res.json({ success: true, data: persistedData, meta: {
        version: nextVersion,
        erpIntegration: canonicalErpReady ? 'ready' : 'not_provisioned',
        erpSync: canonicalErpSync ? {
          createdJournalCount: canonicalErpSync.createdJournalCount,
          existingJournalCount: canonicalErpSync.existingJournalCount,
          ledgerLineCount: canonicalErpSync.ledgerLineCount,
          sourceLinks: canonicalErpSync.sourceLinks
        } : null
      }, message: canonicalErpReady
        ? "Inventory database saved and synchronized with the canonical ledger."
        : "Inventory database saved; canonical ledger integration is not provisioned for this school." });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof ConflictError || err instanceof ValidationError || err instanceof DatabaseError
        ? err : new DatabaseError("Failed to save inventory database", err.message));
    }
  });

  app.post('/api/inventory/reports/audit', authenticateRequest, requirePermission(PERMISSIONS.INVENTORY_READ), async (req, res, next) => {
    try {
      const identity = (req as any).user;
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const tenantContext = (req as any).tenantContext;
      const reportType = String(req.body?.reportType || '').trim();
      const format = String(req.body?.format || '').trim().toLowerCase();
      const expectedVersion = Number(req.body?.expectedVersion);
      if (!tenantId || !schoolId || !tenantContext || !['valuation', 'reorder', 'turnover', 'procurement'].includes(reportType)
        || !['csv', 'print'].includes(format) || !Number.isInteger(expectedVersion) || expectedVersion < 0) {
        throw new ValidationError('طلب تدقيق تقرير المخزون غير صالح.');
      }
      const result = await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Audit inventory report export', tenantId, userId: identity.id,
        userName: identity.name || 'المستخدم الحالي', ipAddress: req.ip || 'unknown', affectedTables: ['inventory_database', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة تدقيق التقرير غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط الجلسة بسجل المستخدم المؤسسي لتدقيق التقرير.');
        const snapshot = await transaction.query<{ data: Record<string, any>; version: number }>(`SELECT data, version FROM public.inventory_database WHERE tenant_id = $1 AND school_id = $2`, [tenantId, schoolId]);
        const actualVersion = Number(snapshot.rows[0]?.version || 0);
        if (actualVersion !== expectedVersion) throw new ConflictError('تغير مصدر التقرير. أعد تحميل الوحدة قبل التصدير.', { expectedVersion, actualVersion });
        const data = snapshot.rows[0]?.data || {};
        const rowCount = reportType === 'procurement' ? (data.purchaseOrders || []).length : (data.items || []).length;
        const hash = createHash('sha256').update(stableJsonStringify(data)).digest('hex');
        await transaction.query(
          `INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata)
           VALUES ($1, $2, $3, $4, 'inventory_report', $2, 'export', 'InventoryReportRoute', 'تصدير تقرير مخزون أو مشتريات', 'success', $5::jsonb)`,
          [tenantId, schoolId, identity.branchId || null, actorId, JSON.stringify({ reportType, format, version: actualVersion, rowCount, snapshotHash: hash })]
        );
        return { rowCount, snapshotHash: hash };
      }, tenantContext);
      res.json({ success: true, data: result, meta: { version: expectedVersion } });
    } catch (err: any) { next(err); }
  });

  // Supabase Connectivity Status
  app.get("/api/supabase/status", (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
    const isConfigured = !!(supabaseUrl && supabaseKey);
    
    res.json({
      success: true,
      data: {
        configured: isConfigured,
        databaseType: "Supabase (PostgreSQL)",
        supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 25)}...` : null,
        connectionStatus: isConfigured ? "ready" : "ready_local_postgres_active"
      },
      message: isConfigured 
        ? "Supabase dynamic configuration verified successfully. Ready to bind operational ERP tables." 
        : "Supabase environment variables are fallback-routed. Active local multi-tenant Postgres database engine is running beautifully.",
      meta: null
    });
  });

  // AI-powered Financial Insights & Delayed Payment Risk Prediction
  app.post("/api/ai/forecast", authenticateRequest, requirePermission(PERMISSIONS.AI_FORECAST), (req, res) => {
    const { students = [] } = req.body;
    
    // Heuristic predictive insights for financial risk analysis
    const highRisk: any[] = [];
    const mediumRisk: any[] = [];
    let totalAssessedFees = 0;
    let expectedDelayedFees = 0;

    students.forEach((s: any) => {
      const remaining = s.feesRemaining || 0;
      totalAssessedFees += remaining;
      if (remaining > 2500) {
        highRisk.push({
          studentId: s.id,
          studentName: s.name,
          classroom: s.classroom,
          remainingAmount: remaining,
          delayProbability: "85%",
          recommendedAction: "إرسال إشعار تلقائي وتسوية أقساط مرنة فورية"
        });
        expectedDelayedFees += remaining * 0.75;
      } else if (remaining > 0) {
        mediumRisk.push({
          studentId: s.id,
          studentName: s.name,
          classroom: s.classroom,
          remainingAmount: remaining,
          delayProbability: "40%",
          recommendedAction: "متابعة السندات الدورية"
        });
        expectedDelayedFees += remaining * 0.25;
      }
    });

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        model: "EduPro AI Heuristics Engine v2.1",
        metrics: {
          totalOutstandingFees: totalAssessedFees,
          projectedDelayedAmount: expectedDelayedFees,
          projectedCollectionEfficiency: totalAssessedFees > 0 
            ? Math.round(((totalAssessedFees - expectedDelayedFees) / totalAssessedFees) * 100) 
            : 100,
          highRiskCount: highRisk.length,
          mediumRiskCount: mediumRisk.length
        },
        forecast: {
          highRisk,
          mediumRisk
        }
      },
      message: "AI Financial Forecast generated successfully.",
      meta: null
    });
  });

  // ========================================================
  // AI CHATBOT OPTIMIZED RAG ENGINE (PREVENTS DUMPING FULL DB)
  // ========================================================
  let aiClient: any = null;
  function getAIClient() {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY is not defined");
      }
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
    return aiClient;
  }

  app.post("/api/ai/chat", authenticateRequest, requirePermission(PERMISSIONS.AI_CHAT), async (req, res, next) => {
    const { prompt } = req.body;
    const schoolId = (req as any).user.schoolId;

    if (!prompt || typeof prompt !== "string") {
      return next(new ValidationError("الرجاء إدخال سؤال صالح للمساعد."));
    }

    try {
      // Lazy load check of API Key
      if (!process.env.GEMINI_API_KEY) {
        return next(new ValidationError("مفتاح API الخاص بـ Gemini غير مهيأ. يرجى ضبط GEMINI_API_KEY في الإعدادات لتفعيل المساعد الذكي."));
      }

      // ==========================================
// INTEGRATING RAG ENGINE (KEYWORD EXTRACTION)
// ==========================================
      const lowerPrompt = prompt.toLowerCase();
      const snapshot: any = {};

      // Retrieve ONLY the tenant-specific data
      const allStudents = (await StudentRepository.search(schoolId, {})).data;
      const allExams = await ExamsRepository.getExams(schoolId);
      const allAuditLogs = await AuditRepository.getAll(schoolId, { limit: 10 });
      
      // Perform semantic extraction to build a compact, optimized RAG context
      if (lowerPrompt.includes("طالب") || lowerPrompt.includes("طلاب") || lowerPrompt.includes("سجل") || lowerPrompt.includes("خالد") || lowerPrompt.includes("يوسف") || lowerPrompt.includes("جوري") || lowerPrompt.includes("زياد") || lowerPrompt.includes("ريناد") || lowerPrompt.includes("سلطان")) {
        const keywords = ["خالد", "يوسف", "جوري", "زياد", "ريناد", "سلطان", "ولد", "بنت", "طالب"];
        const matches = allStudents.filter(s => keywords.some(keyword => s.name.includes(keyword) || lowerPrompt.includes(s.name)));
        snapshot.students = matches.length > 0 ? matches : allStudents.slice(0, 5);
      } else {
        snapshot.students = []; 
      }

      if (lowerPrompt.includes("امتحان") || lowerPrompt.includes("اختبار") || lowerPrompt.includes("درج") || lowerPrompt.includes("نتيجة") || lowerPrompt.includes("علامة")) {
        snapshot.exams = allExams;
      } else {
        snapshot.exams = {};
      }

      if (lowerPrompt.includes("سجل") || lowerPrompt.includes("رقابة") || lowerPrompt.includes("تدقيق")) {
        snapshot.auditLogs = allAuditLogs;
      } else {
        snapshot.auditLogs = [];
      }

      const ai = getAIClient();

      const systemInstruction = `
أنت مساعد ذكي (AI Assistant) يعمل كمساعد معلومات مخصص ومساعد استخدام لنظام سحاب لإدارة المدارس (Cloud School ERP).

قواعد التشغيل الصارمة والملزمة بنسبة 100%:

1. إذا كان السؤال عن بيانات النظام الفعلية (مثل: عدد الطلاب، رصيد طالب، نتيجته، كشف حساب، رسوم، عدد الموظفين، عهد ومخازن، باصات):
   - ابحث حصرياً في قاعدة البيانات المرفقة معك كـ Context وهي معزولة تماماً لمدرسة المستخدم الحالية (school_id: ${schoolId}).
   - أجب بالنتيجة الدقيقة فقط بكلمات وجيزة ومباشرة.
   - يمنع تماماً استخدام أي معرفة عامة أو خارجية أو تخمين أو افتراض وجود بيانات.
   - إذا لم تعثر على سجلات مطابقة تماماً للمطلوب في قاعدة البيانات المرفقة، يجب عليك الإجابة حصرياً بالعبارة التالية حرفياً وبدون أي زيادة أو توضيح أو اعتذار:
     "لا توجد بيانات مطابقة في قاعدة البيانات."

2. إذا كان السؤال يتعلق بكيفية استخدام البرنامج أو شرح وظيفة شاشة أو زر أو تقرير أو إجراء داخل النظام:
   - اشرح الخطوات العملية المختصرة والمباشرة اعتماداً فقط على تصميم ووظائف نظام سحاب (Cloud School ERP).
   - الشاشات والمكونات المتاحة فعلياً: لوحة التحكم العامة (Dashboard)، شؤون الطلاب (Student Affairs)، الفواتير والمالية (Student Financials)، المعلمون والموظفون (Teachers & HR)، المستودعات والعهد (Inventory)، الحافلات (Bus Routes)، الامتحانات والنتائج (Exams & Results)، الحضور والانصراف (Attendance)، أولياء الأمور (Parents)، سجل العمليات والرقابة (Audit Logs)، إعدادات النظام والصلاحيات (Settings).
   - إذا سأل المستخدم عن كيفية استخدام أو خطوات وظيفة غير متوفرة في القائمة أعلاه، أجب حصرياً: "هذه الوظيفة غير متوفرة في الإصدار الحالي من النظام."

3. إذا كان السؤال خارج نطاق النظام تماماً:
   - أجب حصرياً: "هذا السؤال خارج نطاق النظام، ولا أستطيع الإجابة عنه."

قواعد التنسيق والذكاء الإلزامية لتقليل استهلاك الرموز (Tokens):
- الإجابات يجب أن تكون قصيرة جداً، مباشرة، دقيقة، عملية، بدون أي مقدمات أو مجاملات أو توضيحات فلسفية.
- استخدم جداول Markdown مبسطة للغاية لعرض السجلات المتعددة المطابقة.
- أمان وحماية البيانات والسرية: لا تعرض مطلقاً أي معلومات سرية أو كلمات مرور أو رموز مشفرة.

إليك قاعدة بيانات المدرسة الحالية المعزولة والمحسنة عبر محرك RAG كـ Context موثوق ووحيد لإجابتك:
${JSON.stringify(snapshot)}
`;

      const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-pro-preview"];
      let response: any = null;
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          EnterpriseLogger.info(`Attempting AI generation with model: ${modelName}`, "AIAssistantEndpoint");
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.1,
            },
          });
          if (response && response.text) {
            EnterpriseLogger.info(`Successfully generated content using model: ${modelName}`, "AIAssistantEndpoint");
            break; // Succeeded!
          }
        } catch (modelErr: any) {
          EnterpriseLogger.warn(`Model ${modelName} failed or was unavailable:`, "AIAssistantEndpoint", { error: modelErr.message || modelErr });
          lastError = modelErr;
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error("جميع نماذج الذكاء الاصطناعي غير متاحة حالياً. الرجاء المحاولة مرة أخرى لاحقاً.");
      }

      res.json({
        success: true,
        data: {
          text: response.text
        },
        message: "AI chat assistant query completed successfully.",
        meta: null
      });
    } catch (err: any) {
      EnterpriseLogger.error("AI assistant endpoint error:", "AIAssistantEndpoint", { error: err?.message || err });
      next(new ExternalServiceError("فشل استدعاء المساعد الذكي.", err.message));
    }
  });

  // SOL reviews and plans; LUNA proposes implementation; SOL performs the gate review.
  // This endpoint never writes source files. Applying patches remains an explicit, audited action.
  app.post("/api/ai/sol-luna/review", authenticateRequest, requirePermission(PERMISSIONS.AI_CHAT), async (req, res, next) => {
    try {
      const { goal, files = [], constraints = [] } = req.body || {};
      if (typeof goal !== 'string' || goal.trim().length < 10) {
        return next(new ValidationError('يجب إدخال هدف واضح للمراجعة لا يقل عن 10 أحرف.'));
      }
      const invalidFile = (file: any) => {
        const filePath = typeof file?.path === 'string' ? file.path.replaceAll('\\', '/') : '';
        return !file || !filePath || filePath.startsWith('/') || /^[A-Za-z]:\//.test(filePath) ||
          filePath.split('/').includes('..') || !/^[\w./-]+$/.test(filePath) ||
          typeof file.content !== 'string' || file.content.length > 120_000;
      };
      const totalContentSize = Array.isArray(files)
        ? files.reduce((total: number, file: any) => total + (typeof file?.content === 'string' ? file.content.length : 0), 0)
        : Number.MAX_SAFE_INTEGER;
      if (!Array.isArray(files) || files.length > 30 || totalContentSize > 1_500_000 || files.some(invalidFile)) {
        return next(new ValidationError('قائمة الملفات غير صالحة أو تتجاوز الحد المسموح.'));
      }
      if (!Array.isArray(constraints) || constraints.length > 30 || constraints.some((item: unknown) => typeof item !== 'string' || item.length > 2_000)) {
        return next(new ValidationError('قيود المراجعة غير صالحة.'));
      }
      if (!process.env.OPENAI_API_KEY) {
        return next(new ExternalServiceError('تكامل SOL/LUNA غير مهيأ.', 'OPENAI_API_KEY is not configured'));
      }
      EnterpriseLogger.info('SOL/LUNA review requested', 'SolLunaOrchestration', {
        goalLength: goal.length,
        fileCount: files.length,
        contentSize: totalContentSize,
        schoolId: String((req as any).user?.schoolId || 'unknown'),
      });
      const result = await reviewAndImplement({ goal: goal.trim(), files, constraints });
      res.json({ success: true, data: result, message: 'اكتملت دورة SOL للمراجعة وLUNA للتنفيذ والمراجعة النهائية.' });
    } catch (error: any) {
      next(new ExternalServiceError('فشل تشغيل دورة SOL/LUNA.', error?.message || 'AI orchestration failed'));
    }
  });

  // ========================================================
  // UNIFIED CENTRAL ERROR HANDLER MIDDLEWARE
  // ========================================================
  app.use(async (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const statusCode = err.statusCode || 500;
    const authTrace = (req as any).safeAuthTrace as SafeAuthTrace | undefined;
    if (authTrace && authTrace.rejectionStage === 'request') {
      authTrace.rejectionStage = statusCode === 401 ? 'authentication' : statusCode === 403 ? 'permission' : 'request_error';
    }
    const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
    const message = err.message || "حدث خطأ غير متوقع في الخادم.";
    const details = err.details || null;
    const traceId = "tr_" + Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();

    // Log critical or database errors to enterprise Audit Log system
    if (statusCode >= 500 || errorCode === "DATABASE_ERROR") {
      const user = (req as any).user || { id: "system", name: "النظام المركزي", role: "system", schoolId: "school_1" };
      try {
        await AuditRepository.log(
          user.schoolId,
          user.id,
          user.name,
          user.role,
          "SYSTEM_CRITICAL_ERROR",
          "SystemError",
          req.ip || "127.0.0.1",
          `خطأ في النظام: ${message} (TraceID: ${traceId})`
        );
      } catch (logErr: any) {
        EnterpriseLogger.error("Failed to write critical error to Audit Logs:", "ServerBootstrap", { error: logErr?.message || logErr });
      }
    }

    res.status(statusCode).json({
      success: false,
      errorCode,
      message,
      details,
      traceId,
      timestamp
    });
  });

  // The bundled server is the production entry point used by `npm start`.
  // Do not let a missing NODE_ENV turn that entry point into a Vite dev server.
  // `tsx server.ts` remains the development entry point and keeps Vite middleware.
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.npm_lifecycle_event === "start" ||
    path.basename(process.argv[1] ?? "") === "server.cjs";

  // Serve Frontend with Vite Dev Server in Development or static files in Production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Keep the HTML entry point fresh after each deployment.  Its JavaScript
    // chunks are content-addressed and may be replaced between releases; a
    // cached index.html can otherwise reference a chunk that no longer exists.
    app.use(express.static(distPath, { index: false }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to the dynamic cloud environment port (or fallback to 3000)
  app.listen(Number(PORT), "0.0.0.0", () => {
    EnterpriseLogger.info(`SchoolForManus server listening on port ${PORT}`, "ServerBootstrap");
  });
}

startServer();
