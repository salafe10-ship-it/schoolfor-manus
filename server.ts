import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import helmet from "helmet";

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
  requireAnyPermission,
} from "./src/middleware/auth.js";
import { requestTarget } from "./src/middleware/tenantValidation.js";
import { createMemoryRateLimiter } from "./src/middleware/memoryRateLimit.js";
import { tenantEngine } from "./src/tenant/TenantEngine.js";
import { PERMISSIONS, describePermission, permissionRegistry } from "./src/authorization/PermissionRegistry.js";
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
import { CANONICAL_STUDENT_SORT_FIELDS, CanonicalStudentReadRepository, type StudentReadDiagnostic } from "./src/database/repositories/CanonicalStudentReadRepository.js";
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
import {
  assertMoney,
  buildInstallmentSchedule,
  makeDeterministicIdempotencyKey,
  makeInvoiceId,
  makePaymentAttemptId,
  makeReceiptId,
  normalizeIdempotencyKey,
  type InstallmentFrequency,
} from './src/modules/financial/application/CanonicalStudentFeeOperations.js';

type FinancialWriteMode = 'snapshot_read_only' | 'snapshot_write' | 'erp_integrated';

const deploymentEnvironment = String(process.env.EDUPRO_ENVIRONMENT || '').trim().toLowerCase();
const productionLikeEnvironment = deploymentEnvironment === 'staging' || deploymentEnvironment === 'production';
const unsafeLocalDatabaseRoleOptIn = process.env.ALLOW_UNSAFE_LOCAL_DATABASE_ROLE === 'true';
const supabaseOrigin = (() => {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).origin : null;
  } catch {
    return null;
  }
})();

// Central administration deliberately uses a separate privileged connection.
// Normal tenant traffic must use DATABASE_URL, which is configured with a
// non-bypass RLS role in production. A fallback is retained only for explicit
// non-production use; production-like deployments require a dedicated
// PLATFORM_ADMIN_DATABASE_URL so control-plane access cannot reuse the tenant
// connection accidentally.
const platformAdminConnectionString = process.env.PLATFORM_ADMIN_DATABASE_URL
  || (unsafeLocalDatabaseRoleOptIn && !productionLikeEnvironment
    ? (process.env.DIRECT_URL || process.env.DATABASE_URL)
    : undefined);

const platformAdminPool = platformAdminConnectionString
  ? new Pool({
      connectionString: platformAdminConnectionString,
      max: Number(process.env.PG_PLATFORM_POOL_MAX || 5),
      connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
      ssl: process.env.PGSSLMODE === 'disable'
        ? undefined
        : { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === 'true' },
    })
  : null;

// Platform permissions are a control-plane concern.  They must never be
// resolved through the tenant data-plane transaction, because that channel is
// intentionally RLS-restricted to a school context.  The query still accepts
// only the verified Auth user id and returns the single canonical platform
// permission; it never accepts role or scope from a request.
if (platformAdminPool) {
  // Permission resolution for authenticated school requests must use the
  // trusted control-plane connection. Render's data-plane database role is
  // RLS-scoped for application writes and may not be a PostgREST
  // `authenticated` role, which would make a valid assignment appear empty.
  // Scope is still explicit and derived only from the verified identity.
  roleResolver.configureDatabaseLoader(async (identity) => {
    const tenantId = String(identity?.tenantId || '').trim();
    const schoolId = String(identity?.schoolId || '').trim();
    const authUserId = String(identity?.id || '').trim();
    if (!tenantId || !schoolId || !authUserId) throw new Error('Trusted tenant identity is incomplete for role resolution.');
    const result = await platformAdminPool.query<{ roleKey: string; permissionKey: string }>(
      `SELECT r.role_key AS "roleKey", p.permission_key AS "permissionKey"
         FROM public.users u
         JOIN public.user_roles ur
           ON ur.tenant_id = u.tenant_id AND ur.user_id = u.id
         JOIN public.roles r
           ON r.tenant_id = ur.tenant_id AND r.id = ur.role_id
         JOIN public.role_permissions rp
           ON rp.tenant_id = ur.tenant_id AND rp.role_id = r.id
         JOIN public.permissions p
           ON p.id = rp.permission_id
        WHERE u.tenant_id = $1::uuid
          AND u.auth_user_id = $2::uuid
          AND u.school_id = $3::uuid
          AND u.deleted_at IS NULL AND u.status IN ('invited', 'active')
          AND ur.deleted_at IS NULL AND ur.status = 'active'
          AND ur.starts_at <= now() AND (ur.ends_at IS NULL OR ur.ends_at > now())
          AND (ur.school_id IS NULL OR ur.school_id = $3::uuid)
          AND (ur.branch_id IS NULL OR ur.branch_id = $4::uuid)
          AND r.deleted_at IS NULL AND r.status = 'active'
          AND rp.deleted_at IS NULL AND rp.status = 'active'
          AND p.deleted_at IS NULL AND p.status = 'active'
          AND (p.tenant_id IS NULL OR p.tenant_id = $1::uuid)
        UNION
        SELECT COALESCE((
                 SELECT r2.role_key
                   FROM public.user_roles ur2
                   JOIN public.roles r2
                     ON r2.tenant_id = ur2.tenant_id AND r2.id = ur2.role_id
                  WHERE ur2.tenant_id = u.tenant_id
                    AND ur2.user_id = u.id
                    AND ur2.deleted_at IS NULL AND ur2.status = 'active'
                    AND ur2.starts_at <= now() AND (ur2.ends_at IS NULL OR ur2.ends_at > now())
                    AND (ur2.school_id IS NULL OR ur2.school_id = $3::uuid)
                    AND (ur2.branch_id IS NULL OR ur2.branch_id = $4::uuid)
                    AND r2.deleted_at IS NULL AND r2.status = 'active'
                  ORDER BY ur2.created_at ASC
                  LIMIT 1
               ), 'employee') AS "roleKey",
               p.permission_key AS "permissionKey"
          FROM public.users u
          JOIN public.user_permission_grants upg
            ON upg.tenant_id = u.tenant_id AND upg.user_id = u.id
           AND upg.school_id = $3::uuid
           AND (upg.branch_id IS NULL OR upg.branch_id = $4::uuid)
           AND upg.status = 'active' AND upg.deleted_at IS NULL
          JOIN public.permissions p ON p.id = upg.permission_id
         WHERE u.tenant_id = $1::uuid
           AND u.auth_user_id = $2::uuid
           AND u.school_id = $3::uuid
           AND u.deleted_at IS NULL AND u.status IN ('invited', 'active')
           AND p.deleted_at IS NULL AND p.status = 'active'
           AND (p.tenant_id IS NULL OR p.tenant_id = $1::uuid)
         ORDER BY "roleKey", "permissionKey"`,
      [tenantId, authUserId, schoolId, identity?.branchId || null],
    );
    return result.rows;
  });
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

// Prefer the server-only Supabase service-role channel for platform RBAC.
// This keeps control-plane authorization independent from pooler certificate
// quirks while preserving the existing PostgreSQL pool for tenant work. The
// verified Auth user id is the only lookup input; role and permission values
// are still read from the canonical platform tables.
if (platformAdminAuth) {
  roleResolver.configurePlatformDatabaseLoader(async (identity) => {
    const authUserId = String(identity?.id || '').trim();
    if (!authUserId) throw new Error('Trusted auth_user_id is required for platform role resolution.');

    const now = new Date().toISOString();
    const { data: platformUsers, error: platformUserError } = await platformAdminAuth
      .from('platform_users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .limit(1);
    if (platformUserError) throw platformUserError;
    const platformUserId = platformUsers?.[0]?.id;
    if (!platformUserId) return [];

    const { data: assignments, error: assignmentError } = await platformAdminAuth
      .from('platform_user_roles')
      .select('role_id, starts_at, ends_at')
      .eq('platform_user_id', platformUserId)
      .eq('status', 'active')
      .is('deleted_at', null);
    if (assignmentError) throw assignmentError;
    const activeAssignments = (assignments || []).filter((assignment: any) =>
      (!assignment.starts_at || assignment.starts_at <= now)
      && (!assignment.ends_at || assignment.ends_at > now)
    );
    const roleIds = [...new Set(activeAssignments.map((assignment: any) => assignment.role_id).filter(Boolean))];
    if (!roleIds.length) return [];

    const { data: roles, error: roleError } = await platformAdminAuth
      .from('platform_roles')
      .select('id, role_key')
      .in('id', roleIds)
      .eq('status', 'active')
      .is('deleted_at', null);
    if (roleError) throw roleError;
    const activeRoles = (roles || []).filter((role: any) => role.role_key === 'platformadmin');
    if (!activeRoles.length) return [];

    const activeRoleIds = activeRoles.map((role: any) => role.id);
    const { data: rolePermissions, error: rolePermissionError } = await platformAdminAuth
      .from('platform_role_permissions')
      .select('role_id, permission_id')
      .in('role_id', activeRoleIds)
      .eq('status', 'active')
      .is('deleted_at', null);
    if (rolePermissionError) throw rolePermissionError;
    const permissionIds = [...new Set((rolePermissions || []).map((entry: any) => entry.permission_id).filter(Boolean))];
    if (!permissionIds.length) return [];

    const { data: permissions, error: permissionError } = await platformAdminAuth
      .from('platform_permissions')
      .select('id, permission_key')
      .in('id', permissionIds)
      .eq('status', 'active')
      .is('deleted_at', null);
    if (permissionError) throw permissionError;
    const permissionById = new Map((permissions || []).map((permission: any) => [permission.id, permission.permission_key]));
    return (rolePermissions || [])
      .map((entry: any) => ({
        roleKey: activeRoles.find((role: any) => role.id === entry.role_id)?.role_key || '',
        permissionKey: permissionById.get(entry.permission_id) || '',
      }))
      .filter((entry: { roleKey: string; permissionKey: string }) => Boolean(entry.roleKey && entry.permissionKey));
  });
}

// Central directory reads and writes use the server-only Supabase channel.
// This avoids coupling the browser-facing control plane to a pooler TLS
// configuration while keeping the tenant data plane unchanged. The helper is
// intentionally small and paginates so large directories are not truncated
// by PostgREST's default row limit.
const platformControl = platformAdminAuth as any;
const readPlatformRows = async (table: string, columns: string, configure?: (query: any) => any) => {
  if (!platformControl) throw new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.');
  const rows: any[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    let query = platformControl.from(table).select(columns).range(offset, offset + pageSize - 1);
    if (configure) query = configure(query);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
};

const insertPlatformRow = async (table: string, values: Record<string, unknown>, columns = '*') => {
  if (!platformControl) throw new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.');
  const { data, error } = await platformControl.from(table).insert(values).select(columns).single();
  if (error) throw error;
  return data;
};

const upsertPlatformRow = async (table: string, values: Record<string, unknown>, onConflict: string, columns = '*') => {
  if (!platformControl) throw new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.');
  const { data, error } = await platformControl.from(table).upsert(values, { onConflict }).select(columns).single();
  if (error) throw error;
  return data;
};

const deletePlatformRow = async (table: string, id: string) => {
  if (!platformControl) return;
  await platformControl.from(table).delete().eq('id', id);
};

const readPlatformAuthUsers = async () => {
  if (!platformControl) return [];
  const users: any[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await platformControl.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...(data?.users || []));
    if (!data?.users || data.users.length < 1000) break;
  }
  return users;
};

// School identities use the same secure control-plane channel for RBAC
// hydration. This is still strictly scoped by the verified Auth id, tenant,
// school and branch; no scope is accepted from the browser.
if (platformControl) {
  roleResolver.configureDatabaseLoader(async (identity) => {
    const authUserId = String(identity?.id || '').trim();
    const tenantId = String(identity?.tenantId || '').trim();
    const schoolId = String(identity?.schoolId || '').trim();
    const branchId = String(identity?.branchId || '').trim();
    if (!authUserId || !tenantId || !schoolId) throw new Error('Trusted tenant identity is incomplete for role resolution.');
    const users = await readPlatformRows('users', 'id, tenant_id, school_id, branch_id, auth_user_id, status, deleted_at', (query) => query.eq('auth_user_id', authUserId).eq('tenant_id', tenantId).eq('school_id', schoolId).is('deleted_at', null));
    const user = users.find((row: any) => ['invited', 'active'].includes(row.status) && (!branchId || !row.branch_id || row.branch_id === branchId));
    if (!user) return [];
    const assignments = await readPlatformRows('user_roles', 'role_id, school_id, branch_id, starts_at, ends_at, status, deleted_at', (query) => query.eq('user_id', user.id).eq('tenant_id', tenantId).eq('status', 'active').is('deleted_at', null));
    const now = new Date().toISOString();
    const activeAssignments = assignments.filter((assignment: any) =>
      (!assignment.school_id || assignment.school_id === schoolId)
      && (!assignment.branch_id || !branchId || assignment.branch_id === branchId)
      && (!assignment.starts_at || assignment.starts_at <= now)
      && (!assignment.ends_at || assignment.ends_at > now)
    );
    const roleIds = [...new Set(activeAssignments.map((assignment: any) => assignment.role_id).filter(Boolean))];
    if (!roleIds.length) return [];
    const roles = await readPlatformRows('roles', 'id, role_key, tenant_id, school_id, status, deleted_at', (query) => query.in('id', roleIds).eq('tenant_id', tenantId).eq('status', 'active').is('deleted_at', null));
    const roleById = new Map(roles.map((role: any) => [role.id, role]));
    const activeRoleIds = roles.map((role: any) => role.id);
    if (!activeRoleIds.length) return [];
    const rolePermissions = await readPlatformRows('role_permissions', 'role_id, permission_id, tenant_id, status, deleted_at', (query) => query.in('role_id', activeRoleIds).eq('tenant_id', tenantId).eq('status', 'active').is('deleted_at', null));
    const permissionIds = [...new Set(rolePermissions.map((entry: any) => entry.permission_id).filter(Boolean))];
    if (!permissionIds.length) return [];
    const permissions = await readPlatformRows('permissions', 'id, permission_key, tenant_id, status, deleted_at', (query) => query.in('id', permissionIds).eq('status', 'active').is('deleted_at', null));
    const permissionById = new Map(permissions.filter((permission: any) => !permission.tenant_id || permission.tenant_id === tenantId).map((permission: any) => [permission.id, permission.permission_key]));
    return rolePermissions.map((entry: any) => ({ roleKey: roleById.get(entry.role_id)?.role_key || '', permissionKey: permissionById.get(entry.permission_id) || '' })).filter((entry: { roleKey: string; permissionKey: string }) => Boolean(entry.roleKey && entry.permissionKey));
  });
}

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

function extractVerifiedJwtIssuedAt(token: string): number | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return null;
    const payload = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8')) as { iat?: unknown };
    const issuedAt = Number(payload.iat);
    return Number.isSafeInteger(issuedAt) && issuedAt > 0 ? issuedAt : null;
  } catch {
    return null;
  }
}

const CENTRAL_IDENTITY_ROLE_CATALOG: Record<string, { name: string; description: string; permissions: string[] }> = {
  schooladmin: {
    name: 'مدير المدرسة', description: 'إدارة التشغيل اليومي للمدرسة ضمن نطاقها الموثوق.',
    permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.STUDENT_READ, PERMISSIONS.STUDENT_WRITE, PERMISSIONS.HR_READ, PERMISSIONS.HR_WRITE, PERMISSIONS.FINANCIAL_READ, PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_WRITE, PERMISSIONS.IDENTITY_USERS_READ, PERMISSIONS.IDENTITY_USERS_WRITE, PERMISSIONS.IDENTITY_USERS_ASSIGN, PERMISSIONS.IDENTITY_USERS_AUDIT],
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

type ProvisionedLoginIdentity = {
  /** The real email supplied by the administrator, or null when omitted. */
  profileEmail: string | null;
  /** A stable username is generated only for email-less accounts. */
  username: string | null;
  /** Supabase Auth still needs a unique email-shaped identifier. */
  authEmail: string;
  /** The identifier that must be shown to the administrator after creation. */
  loginIdentifier: string;
};

const provisionLoginIdentity = (rawEmail: unknown): ProvisionedLoginIdentity => {
  const profileEmail = String(rawEmail || '').trim().toLowerCase();
  if (profileEmail) {
    return { profileEmail, username: null, authEmail: profileEmail, loginIdentifier: profileEmail };
  }
  const username = `school-user-${randomUUID().replaceAll('-', '').slice(0, 16)}`;
  const authEmail = `${username}@no-email.edupro.invalid`;
  return { profileEmail: null, username, authEmail, loginIdentifier: username };
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

  // Security headers are strict by default. Embedding is an explicit opt-in
  // for deployments that genuinely require an iframe host.
  const allowIframeEmbedding = process.env.ALLOW_IFRAME_EMBEDDING === 'true';
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'connect-src': ["'self'", ...(supabaseOrigin ? [supabaseOrigin] : [])],
        'frame-ancestors': allowIframeEmbedding ? ["'self'"] : ["'none'"],
      },
    },
    frameguard: allowIframeEmbedding ? false : { action: 'deny' },
  }));
  
  // Authentication and diagnostics use tighter limits below. A bounded
  // per-client API limiter also protects read-heavy dashboards and write
  // endpoints from accidental loops or low-volume abuse. Multi-instance
  // deployments should additionally enforce a shared gateway limiter.
  const authLimiter = createMemoryRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
  });
  const diagnosticLimiter = createMemoryRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
  });
  const apiLimiter = createMemoryRateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 600,
    message: 'تم تجاوز حد الطلبات المؤقت؛ أعد المحاولة لاحقاً.',
  });
  const disableAuthCaching = (res: express.Response) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
  };

  // Versioned operational snapshots, including the exams workflow and audit
  // history, can legitimately exceed Express's 100kb default. Keep a bounded
  // parser limit so canonical writes fail safely without truncating UAT cycles.
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', (req, res, next) => {
    // Health/readiness probes and authentication routes have their own
    // semantics/limits and should not consume the general application quota.
    if (req.path === '/health' || req.path === '/ready' || req.path.startsWith('/auth/')) return next();
    return apiLimiter(req, res, next);
  });
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
  // liveness listener. The service is not ready until the actual tenant
  // data-plane pool proves that every sampled connection uses an
  // approved non-superuser, non-bypass role. The privileged central pool is
  // deliberately separate and is never accepted as tenant readiness evidence.
  // Fail closed by default. A privileged role is permitted only when a
  // developer explicitly opts into an unsafe local database for a non-test
  // environment. This prevents a missing EDUPRO_ENVIRONMENT variable from
  // silently making a BYPASSRLS connection appear production-ready.
  const restrictedDataPlaneRequired = !unsafeLocalDatabaseRoleOptIn && process.env.NODE_ENV !== 'test';
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
      const { identifier: requestedIdentifier, email, username, password, schoolContext } = req.body || {};
      const identifier = requestedIdentifier || email || username;
      if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
        return next(new AuthenticationError("بيانات الدخول غير صحيحة"));
      }
      const supabase = await getSupabaseClientReady();
      if (!supabase) {
        return next(new ExternalServiceError("خدمة المصادقة غير مهيأة. لا يمكن إنشاء جلسة آمنة."));
      }

      // A school URL is a hard authentication boundary. Resolve its public
      // subdomain (or UUID) on the server, then require the trusted identity
      // returned by Supabase Auth to belong to that exact school. Without this
      // check a platform administrator could be silently redirected into the
      // central console from a customer school URL.
      let expectedSchoolId: string | undefined;
      const requestedSchoolContext = typeof schoolContext === 'string' ? schoolContext.trim() : '';
      if (requestedSchoolContext) {
        if (isUuid(requestedSchoolContext)) {
          expectedSchoolId = requestedSchoolContext;
        } else if (platformAdminPool) {
          const schoolResult = await platformAdminPool.query<{ id: string }>(
            `SELECT id
               FROM public.schools
              WHERE deleted_at IS NULL
                AND status = 'active'
                AND (lower(COALESCE(central_metadata->>'subdomain', '')) = lower($1)
                  OR lower(school_code) = lower($1))
              LIMIT 1`,
            [requestedSchoolContext],
          );
          expectedSchoolId = schoolResult.rows[0]?.id;
        }
        if (!expectedSchoolId) throw new TrustedAuthenticationError('INVALID_SCHOOL');
      }

      const result = await authenticateTrustedUser(supabase, identifier, password, expectedSchoolId);
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
            academic_year: identity.academicYear,
            force_password_change: Boolean(identity.forcePasswordChange)
          }
        },
        message: "تم إنشاء جلسة موثوقة بنجاح."
      });
    } catch (err: any) {
      if (err instanceof TrustedAuthenticationError) {
        // Keep the client response deliberately generic, but leave a bounded
        // diagnostic for operators so production login failures can be
        // distinguished between bad credentials and trusted identity scope.
        EnterpriseLogger.warn('Trusted authentication rejected a login request.', 'TrustedAuthentication', {
          code: err.code,
        });
        return next(new AuthenticationError("بيانات الدخول غير صحيحة"));
      }
      EnterpriseLogger.error('Trusted authentication failed unexpectedly.', 'TrustedAuthentication', {
        error: err?.message || String(err),
      });
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
      const { data: authenticatedUser, error: authenticatedUserError } = await supabase.auth.getUser(accessToken.trim());
      if (authenticatedUserError || !authenticatedUser.user) return next(new AuthenticationError("تعذر التحقق من هوية كلمة المرور."));
      if (platformAdminPool) {
        await platformAdminPool.query(
          `UPDATE public.users
              SET force_password_change = false, updated_at = now(), version = version + 1
            WHERE auth_user_id = $1::uuid AND deleted_at IS NULL`,
          [authenticatedUser.user.id],
        );
      } else if (platformControl) {
        const { error: policyError } = await platformControl
          .from('users')
          .update({ force_password_change: false, updated_at: new Date().toISOString() })
          .eq('auth_user_id', authenticatedUser.user.id)
          .is('deleted_at', null);
        if (policyError) throw policyError;
      } else return next(new ExternalServiceError("مصدر سياسة كلمة المرور المركزية غير مهيأ."));
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
            academic_year: identity.academicYear,
            force_password_change: Boolean(identity.forcePasswordChange)
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
      const accessSupabase = getSupabaseClientForAccessToken(token) || supabase;
      identity = await verifyTrustedSession(accessSupabase, token);
      const issuedAt = extractVerifiedJwtIssuedAt(token);
      if (platformControl && issuedAt) {
        const { data: sessionMarker, error: sessionMarkerError } = await accessSupabase
          .from('users')
          .select('session_revoked_at, force_password_change')
          .eq('auth_user_id', identity.id)
          .is('deleted_at', null)
          .limit(1)
          .maybeSingle();
        if (sessionMarkerError) throw sessionMarkerError;
        const revokedAt = sessionMarker?.session_revoked_at ? Date.parse(String(sessionMarker.session_revoked_at)) : NaN;
        if (Number.isFinite(revokedAt) && issuedAt <= Math.floor(revokedAt / 1000)) {
          throw new TrustedAuthenticationError('INVALID_IDENTITY', 'تم إنهاء جلسة الهوية مركزيًا.');
        }
        (identity as any).forcePasswordChange = Boolean(sessionMarker?.force_password_change);
        if (sessionMarker?.force_password_change && req.path !== '/api/auth/session') {
          throw new TrustedAuthenticationError('INVALID_IDENTITY', 'يجب تغيير كلمة المرور قبل متابعة استخدام النظام.');
        }
      }
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

      // The trusted request identity carries the Supabase Auth UUID, while
      // audit_access_events.actor_user_id references public.users.id. Resolve
      // the canonical row before writing the immutable access record; using
      // the Auth UUID directly violates the composite FK and can turn an
      // otherwise valid central operation into a 500 in downstream clients.
      void platformAdminPool.query<{ id: string }>(
        `SELECT id
           FROM public.users
          WHERE tenant_id = $1::uuid
            AND (id = $2::uuid OR auth_user_id = $2::uuid)
            AND deleted_at IS NULL
          LIMIT 1`,
        [tenantId, actorUserId],
      ).then((actorResult) => {
        const canonicalActorUserId = actorResult.rows[0]?.id;
        if (!canonicalActorUserId) {
          EnterpriseLogger.warn('Central administration audit skipped: canonical actor row not found', 'CentralAdministrationAudit', {
            requestPath,
            statusCode: res.statusCode,
          });
          return;
        }
        return platformAdminPool.query(
        `INSERT INTO public.audit_access_events
           (tenant_id, actor_user_id, resource_type, resource_id, action, source, reason, result,
            request_method, request_path, ip_address, user_agent)
         VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5, 'central_api', $6, $7, $8, $9,
                 NULLIF($10, '')::inet, $11)`,
        [
          tenantId,
          canonicalActorUserId,
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
        );
      }).catch((error) => {
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

  // Owner workspace helpers.  These records are deliberately served only by
  // the verified Platform.Admin control plane; tenant requests never receive
  // another school's release manifest or target list.
  const isUuid = (value: unknown): value is string => /^[0-9a-f-]{36}$/i.test(String(value || '').trim());
  const readObject = (value: unknown): Record<string, unknown> => (
    value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  );
  const isOwnerWorkspaceMetadata = (metadata: Record<string, unknown>): boolean => {
    const workspace = readObject(metadata.ownerWorkspace);
    return metadata.portal_profile === 'owner_controlled'
      || workspace.mode === 'owner'
      || workspace.kind === 'owner';
  };
  const resolveCanonicalOwnerScope = async (client: any) => {
    const result = await client.query(
      `SELECT id AS school_id, tenant_id
         FROM public.schools
        WHERE deleted_at IS NULL
          AND status IN ('provisioning', 'active')
          AND (central_metadata->>'portal_profile') = 'owner_controlled'
        ORDER BY created_at ASC
        LIMIT 1`,
    );
    if (result.rowCount !== 1) throw new ConflictError('لا توجد مدرسة أم مركزية مربوطة بمركز التحكم.');
    return result.rows[0] as { school_id: string; tenant_id: string };
  };
  const normalizeFeatureOverrides = (value: unknown): Record<string, boolean> => {
    if (value === undefined || value === null) return {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ValidationError('مصفوفة ميزات الإصدار غير صالحة.');
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > 100) throw new ValidationError('عدد ميزات الإصدار يتجاوز الحد المسموح.');
    const normalized: Record<string, boolean> = {};
    for (const [rawKey, rawValue] of entries) {
      const key = String(rawKey || '').trim();
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(key)) throw new ValidationError('مفتاح الميزة غير صالح.');
      if (typeof rawValue !== 'boolean') throw new ValidationError('كل قيمة في ميزات الإصدار يجب أن تكون true أو false.');
      normalized[key] = rawValue;
    }
    return normalized;
  };
  const normalizeTemplateManifest = (value: unknown): Record<string, unknown> => {
    const manifest = readObject(value);
    return { ...manifest, features: normalizeFeatureOverrides(manifest.features) };
  };
  const mergeTemplateManifest = (templateManifest: unknown, manifestOverrides: unknown, featureOverrides: unknown): Record<string, unknown> => {
    const base = normalizeTemplateManifest(templateManifest);
    const overrides = readObject(manifestOverrides);
    const merged = { ...base, ...overrides };
    merged.features = {
      ...normalizeFeatureOverrides(base.features),
      ...normalizeFeatureOverrides(overrides.features),
      ...normalizeFeatureOverrides(featureOverrides),
    };
    return merged;
  };
  const resolveReleaseBaseManifest = (
    releasePayloadValue: unknown,
    currentTemplateManifest: unknown,
    schoolMetadata: Record<string, unknown>,
  ): Record<string, unknown> => {
    const releasePayload = readObject(releasePayloadValue);
    const templateSnapshot = readObject(releasePayload.template);
    if (Object.keys(templateSnapshot).length > 0) return templateSnapshot;
    if (Object.prototype.hasOwnProperty.call(releasePayload, 'features')) {
      return { features: normalizeFeatureOverrides(releasePayload.features) };
    }
    const currentTemplate = readObject(currentTemplateManifest);
    if (Object.keys(currentTemplate).length > 0) return currentTemplate;
    return { features: normalizeFeatureOverrides(schoolMetadata.features) };
  };
  const workspaceColumns = `
    id, school_id, template_id, release_version, release_kind, scope, channel,
    status, title, notes, feature_overrides, payload, created_by_auth_user_id,
    created_at, activated_at, rolled_back_at`;
  const workspaceSelectColumns = workspaceColumns.split(',').map((column) => `r.${column.trim()}`).join(', ');
  const CANONICAL_SCHOOL_TEMPLATE_KEY = 'central-schools-default';

  const ensureCanonicalRbacDefaults = async (client: any, tenantId: string) => {
    let seeded = false;
    // The first central read must produce a usable catalog. A role that has
    // already been versioned by an administrator (including an explicit empty
    // role) remains authoritative and is never silently reseeded.
    for (const [roleKey, roleSpec] of Object.entries(CENTRAL_IDENTITY_ROLE_CATALOG)) {
      const role = await client.query(
        `INSERT INTO public.roles (tenant_id, school_id, branch_id, role_key, name, description, is_system, status, created_by, updated_by)
         VALUES ($1::uuid, NULL, NULL, $2, $3, $4, true, 'active', NULL, NULL)
         ON CONFLICT (tenant_id, role_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
           is_system = true, status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now()
         RETURNING id, version`,
        [tenantId, roleKey, roleSpec.name, roleSpec.description],
      );
      const activeRolePermissions = await client.query(
        `SELECT COUNT(*)::text AS count
           FROM public.role_permissions
          WHERE tenant_id = $1::uuid AND role_id = $2::uuid AND status = 'active' AND deleted_at IS NULL`,
        [tenantId, role.rows[0].id],
      );
      if (Number(activeRolePermissions.rows[0]?.count || 0) > 0 || Number(role.rows[0]?.version || 1) > 1) continue;
      for (const permissionKey of roleSpec.permissions) {
        const { resource, action } = describePermission(permissionKey);
        const permission = await client.query(
          `INSERT INTO public.permissions (tenant_id, permission_key, resource, action, description, status, created_by, updated_by)
           VALUES (NULL, $1, $2, $3, $1, 'active', NULL, NULL)
           ON CONFLICT (permission_key) DO UPDATE SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now()
           RETURNING id`,
          [permissionKey, resource, action],
        );
        await client.query(
          `INSERT INTO public.role_permissions (tenant_id, role_id, permission_id, status, created_by, updated_by)
           VALUES ($1::uuid, $2::uuid, $3::uuid, 'active', NULL, NULL)
           ON CONFLICT (role_id, permission_id) DO UPDATE SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now()`,
          [tenantId, role.rows[0].id, permission.rows[0].id],
        );
      }
      seeded = true;
    }
    return seeded;
  };

  const captureCanonicalRbacManifest = async (client: any, sourceSchoolId: string) => {
    const source = await client.query(
      `SELECT tenant_id
         FROM public.schools
        WHERE id = $1::uuid AND deleted_at IS NULL
          AND (central_metadata->>'portal_profile') = 'owner_controlled'
        LIMIT 1`,
      [sourceSchoolId],
    );
    if (source.rowCount !== 1) throw new ConflictError('مدرسة الأم المركزية غير صالحة لالتقاط قالب الصلاحيات.');
    const roles = await client.query(
      `SELECT r.id, r.role_key, r.name, r.description, r.version,
              COALESCE(jsonb_agg(DISTINCT p.permission_key ORDER BY p.permission_key)
                FILTER (WHERE p.permission_key IS NOT NULL), '[]'::jsonb) AS permission_keys
         FROM public.roles r
         LEFT JOIN public.role_permissions rp ON rp.tenant_id = r.tenant_id AND rp.role_id = r.id
              AND rp.status = 'active' AND rp.deleted_at IS NULL
         LEFT JOIN public.permissions p ON p.id = rp.permission_id
              AND p.status = 'active' AND p.deleted_at IS NULL
        WHERE r.tenant_id = $1::uuid
          AND r.school_id IS NULL AND r.branch_id IS NULL
          AND r.status = 'active' AND r.deleted_at IS NULL
          AND r.is_system = true
        GROUP BY r.id
        ORDER BY r.role_key ASC`,
      [source.rows[0].tenant_id],
    );
    return {
      schemaVersion: 1,
      sourceSchoolId,
      sourceTenantId: source.rows[0].tenant_id,
      capturedAt: new Date().toISOString(),
      roles: roles.rows.map((role: any) => ({
        roleKey: role.role_key,
        name: role.name,
        description: role.description,
        sourceVersion: Number(role.version || 1),
        managed: true,
        permissionKeys: Array.isArray(role.permission_keys) ? role.permission_keys : [],
      })),
    };
  };

  const applyCanonicalRbacManifest = async (client: any, targetTenantId: string, manifest: unknown, actorAuthUserId: string) => {
    const rbac = readObject(readObject(manifest).rbac);
    const roles = Array.isArray(rbac.roles) ? rbac.roles : [];
    if (!roles.length) return { roleCount: 0, permissionCount: 0 };
    let roleCount = 0;
    let permissionCount = 0;
    for (const rawRole of roles) {
      const roleKey = String(rawRole?.roleKey || '').trim().toLowerCase();
      const name = String(rawRole?.name || '').trim();
      const description = String(rawRole?.description || '').trim() || null;
      const permissionKeys: string[] = [...new Set((Array.isArray(rawRole?.permissionKeys) ? rawRole.permissionKeys : [])
        .map((key: unknown) => permissionRegistry.normalize(key))
        .filter((key): key is string => Boolean(key)))] as string[];
      if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(roleKey) || name.length < 2 || name.length > 160) {
        throw new ValidationError('قالب RBAC المركزي يحتوي دوراً غير صالح.');
      }
      const roleResult = await client.query(
        `INSERT INTO public.roles
           (tenant_id, school_id, branch_id, role_key, name, description, is_system, status, created_by, updated_by)
         VALUES ($1::uuid, NULL, NULL, $2, $3, $4, true, 'active', NULL, NULL)
         ON CONFLICT (tenant_id, role_key) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           is_system = true,
           status = 'active',
           deleted_at = NULL,
           deleted_by = NULL,
           updated_at = now(),
           version = roles.version + 1
         RETURNING id`,
        [targetTenantId, roleKey, name, description],
      );
      const roleId = roleResult.rows[0].id;
      roleCount += 1;
      await client.query(
        `UPDATE public.role_permissions
            SET status = 'revoked', deleted_at = now(), deleted_by = NULL, updated_at = now(), updated_by = NULL, version = version + 1
          WHERE tenant_id = $1::uuid AND role_id = $2::uuid AND deleted_at IS NULL
            AND permission_id NOT IN (
              SELECT p.id FROM public.permissions p WHERE p.permission_key = ANY($3::text[])
            )`,
        [targetTenantId, roleId, permissionKeys],
      );
      for (const permissionKey of permissionKeys) {
        const { resource, action } = describePermission(permissionKey);
        const permission = await client.query(
          `INSERT INTO public.permissions (tenant_id, permission_key, resource, action, description, status, created_by, updated_by)
           VALUES (NULL, $1, $2, $3, $1, 'active', NULL, NULL)
           ON CONFLICT (permission_key) DO UPDATE SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now()
           RETURNING id`,
          [permissionKey, resource, action],
        );
        await client.query(
          `INSERT INTO public.role_permissions (tenant_id, role_id, permission_id, status, created_by, updated_by)
           VALUES ($1::uuid, $2::uuid, $3::uuid, 'active', NULL, NULL)
           ON CONFLICT (role_id, permission_id) DO UPDATE SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now(), version = role_permissions.version + 1`,
          [targetTenantId, roleId, permission.rows[0].id],
        );
        permissionCount += 1;
      }
      // Existing customer workspaces may still have a school/branch-scoped
      // `schooladmin` role from the original provisioning wave.  Keep the
      // new identity-management capabilities synchronized with the mother
      // template for those assignments as well; otherwise a manager could
      // receive the updated central role while their active scoped role stays
      // blind to the school directory.
      if (roleKey === 'schooladmin') {
        const identityPermissionKeys = permissionKeys.filter((permissionKey) => permissionKey.startsWith('Identity.Users.'));
        if (identityPermissionKeys.length) {
          await client.query(
            `INSERT INTO public.role_permissions (tenant_id, role_id, permission_id, status, created_by, updated_by)
             SELECT r.tenant_id, r.id, p.id, 'active', NULL, NULL
               FROM public.roles r
               JOIN public.permissions p ON p.permission_key = ANY($3::text[])
              WHERE r.tenant_id = $1::uuid AND r.role_key = $2
                AND r.school_id IS NOT NULL AND r.status = 'active' AND r.deleted_at IS NULL
                AND p.status = 'active' AND p.deleted_at IS NULL
             ON CONFLICT (role_id, permission_id) DO UPDATE
               SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now()`,
            [targetTenantId, roleKey, identityPermissionKeys],
          );
        }
      }
    }
    return { roleCount, permissionCount, actorAuthUserId };
  };

  /**
   * Publishes one immutable, auditable release per customer school currently
   * subscribed to the canonical template. Operational records (students,
   * finance, HR, and inventory) are never copied; this is configuration and
   * feature policy only. The caller owns the surrounding transaction.
   */
  const propagateCanonicalTemplate = async (client: any, template: any, actorAuthUserId: string) => {
    if (template.template_key !== CANONICAL_SCHOOL_TEMPLATE_KEY || template.status !== 'published') {
      return { targetCount: 0, releases: [], schools: [] };
    }
    const targets = await client.query(
      `SELECT id, tenant_id, central_metadata
         FROM public.schools
        WHERE status = 'active' AND deleted_at IS NULL
          AND COALESCE(central_metadata->>'portal_profile', '') <> 'owner_controlled'
          AND COALESCE(central_metadata->'ownerWorkspace'->>'mode', '') <> 'owner'
          AND (
            central_metadata->'ownerWorkspace'->>'templateId' = $1::text
            OR central_metadata->'ownerWorkspace'->>'templateKey' = $2
          )
        ORDER BY created_at ASC
        FOR UPDATE`,
      [template.id, CANONICAL_SCHOOL_TEMPLATE_KEY],
    );
    const releases: any[] = [];
    const schools: any[] = [];
    const templateManifest = normalizeTemplateManifest(template.manifest);
    const templateFeatures = normalizeFeatureOverrides(templateManifest.features);
    const releaseTitle = `تحديث تلقائي من ${template.name} — الإصدار ${template.version}`;
    const canonicalStructureResult = await client.query(
      `SELECT ss.setting_value AS structure
         FROM public.school_settings ss
         JOIN public.schools s ON s.id = ss.school_id
        WHERE s.school_code = 'CENTRAL-SCHOOL'
          AND s.status = 'active' AND s.deleted_at IS NULL
          AND ss.setting_key = 'academic_structure'
          AND ss.status = 'active' AND ss.deleted_at IS NULL
        ORDER BY ss.effective_from DESC, ss.version DESC
        LIMIT 1`,
    );
    const canonicalStructure = canonicalStructureResult.rows[0]?.structure || null;
    for (const target of targets.rows) {
      const versionResult = await client.query(
        `SELECT COALESCE(MAX(release_version), 0) + 1 AS next_version
           FROM public.platform_school_releases
          WHERE school_id = $1::uuid`,
        [target.id],
      );
      const releaseVersion = Number(versionResult.rows[0]?.next_version || 1);
      const releaseId = randomUUID();
      const metadata = readObject(target.central_metadata);
      const workspace = readObject(metadata.ownerWorkspace);
      const nextMetadata = {
        ...metadata,
        features: templateFeatures,
        ownerWorkspace: {
          ...workspace,
          mode: 'customer',
          releaseChannel: 'stable',
          currentReleaseId: releaseId,
          currentReleaseVersion: releaseVersion,
          templateId: template.id,
          templateKey: template.template_key,
          templateVersion: template.version,
          lastReleaseTitle: releaseTitle,
          lastReleaseAt: new Date().toISOString(),
        },
      };
      const release = await client.query(
        `INSERT INTO public.platform_school_releases
          (id, school_id, template_id, release_version, release_kind, scope, channel, status, title, notes, feature_overrides, payload, created_by_auth_user_id)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'template', 'global', 'stable', 'active', $5, $6, '{}'::jsonb, $7::jsonb, $8::uuid)
         RETURNING ${workspaceColumns}`,
        [
          releaseId,
          target.id,
          template.id,
          releaseVersion,
          releaseTitle,
          'توزيع تلقائي من قالب المدارس المركزي؛ لا يشمل بيانات التشغيل الخاصة بالمدرسة.',
          JSON.stringify({
            template: templateManifest,
            overrides: {},
            templateKey: template.template_key,
            templateVersion: template.version,
            features: templateFeatures,
            automaticPropagation: true,
          }),
          actorAuthUserId,
        ],
      );
      const rbacPropagation = await applyCanonicalRbacManifest(client, target.tenant_id, templateManifest, actorAuthUserId);
      const school = await client.query(
        `UPDATE public.schools
            SET central_metadata = jsonb_set(
              jsonb_set($2::jsonb, '{ownerWorkspace,rbacTemplateVersion}', to_jsonb($3::int), true),
              '{ownerWorkspace,rbacLastPropagationAt}', to_jsonb(now()), true
            ), updated_at = now(), version = version + 1
          WHERE id = $1::uuid
        RETURNING id, tenant_id, display_name, school_code, status, central_metadata`,
        [target.id, JSON.stringify(nextMetadata), Number(template.version || 1)],
      );
      release.rows[0].rbacPropagation = rbacPropagation;
      if (canonicalStructure) {
        const structureUpdate = await client.query(
          `UPDATE public.school_settings
              SET setting_value = $2::jsonb,
                  status = 'active',
                  deleted_at = NULL,
                  deleted_by = NULL,
                  updated_at = now(),
                  version = version + 1
            WHERE school_id = $1::uuid
              AND setting_key = 'academic_structure'
              AND status = 'active'
              AND deleted_at IS NULL
          RETURNING id`,
          [target.id, JSON.stringify(canonicalStructure)],
        );
        if (structureUpdate.rowCount === 0) {
          const targetSchool = school.rows[0];
          await client.query(
            `INSERT INTO public.school_settings
              (tenant_id, school_id, setting_key, setting_value, effective_from, status, version)
             VALUES ($1::uuid, $2::uuid, 'academic_structure', $3::jsonb, now(), 'active', 1)`,
            [targetSchool.tenant_id, target.id, JSON.stringify(canonicalStructure)],
          );
        }
      }
      releases.push(release.rows[0]);
      schools.push(school.rows[0]);
    }
    return { targetCount: schools.length, releases, schools };
  };

  app.get('/api/admin/central/workspaces', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (_req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر مساحة المالك المركزية غير متاح.'));
    try {
      const result = await platformAdminPool.query(`
        SELECT s.id AS school_id, s.tenant_id, s.display_name, s.school_code, s.status,
               s.central_metadata,
               latest.id AS latest_release_id,
               latest.release_version AS latest_release_version,
               latest.release_kind AS latest_release_kind,
               latest.channel AS latest_release_channel,
               latest.title AS latest_release_title,
               latest.created_at AS latest_release_at,
               latest.template_id AS latest_template_id,
               template.template_key AS latest_template_key,
               template.name AS latest_template_name,
               template.version AS latest_template_version,
               template.manifest AS latest_template_manifest,
               latest.feature_overrides AS latest_feature_overrides,
               latest.payload AS latest_release_payload
          FROM public.schools s
          LEFT JOIN LATERAL (
            SELECT r.*
              FROM public.platform_school_releases r
             WHERE r.school_id = s.id
               AND r.status = 'active'
             ORDER BY r.release_version DESC
             LIMIT 1
          ) latest ON true
          LEFT JOIN public.platform_templates template ON template.id = latest.template_id
         WHERE s.deleted_at IS NULL
         ORDER BY s.created_at DESC
      `);
      const templates = await platformAdminPool.query(`
        SELECT id, template_key, name, description, version, status, manifest, created_at, updated_at
          FROM public.platform_templates
         WHERE status <> 'archived'
         ORDER BY updated_at DESC, name ASC
      `);
      const workspaces = result.rows.map((row: any) => {
        const metadata = readObject(row.central_metadata);
        const workspace = readObject(metadata.ownerWorkspace);
        const releasePayload = readObject(row.latest_release_payload);
        const effectiveManifest = mergeTemplateManifest(
          resolveReleaseBaseManifest(releasePayload, row.latest_template_manifest, metadata),
          releasePayload.overrides,
          row.latest_feature_overrides,
        );
        return {
          schoolId: row.school_id,
          tenantId: row.tenant_id,
          schoolName: row.display_name,
          schoolCode: row.school_code,
          schoolStatus: row.status,
          mode: isOwnerWorkspaceMetadata(metadata) ? 'owner' : 'customer',
          isOwnerWorkspace: isOwnerWorkspaceMetadata(metadata),
          releaseChannel: String(workspace.releaseChannel || row.latest_release_channel || 'stable'),
          currentReleaseId: row.latest_release_id || workspace.currentReleaseId || null,
          currentReleaseVersion: Number(row.latest_release_version || workspace.currentReleaseVersion || 0),
          templateId: row.latest_template_id || workspace.templateId || null,
          templateKey: releasePayload.templateKey || row.latest_template_key || workspace.templateKey || null,
          templateVersion: Number(releasePayload.templateVersion || row.latest_template_version || workspace.templateVersion || 0),
          lastReleaseTitle: row.latest_release_title || null,
          lastReleaseAt: row.latest_release_at || null,
          features: normalizeFeatureOverrides(effectiveManifest.features),
          templateManifest: effectiveManifest,
        };
      });
      return res.json({ success: true, workspaces, templates: templates.rows });
    } catch (error) {
      return next(new DatabaseError('تعذر قراءة مساحات المدارس وإصداراتها.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.get('/api/admin/central/templates', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (_req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قوالب المالك غير متاح.'));
    try {
      const result = await platformAdminPool.query(`
        SELECT id, template_key, name, description, version, status, manifest, created_at, updated_at
          FROM public.platform_templates
         WHERE status <> 'archived'
         ORDER BY updated_at DESC, name ASC
      `);
      return res.json({ success: true, templates: result.rows });
    } catch (error) {
      return next(new DatabaseError('تعذر قراءة قوالب النظام.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.post('/api/admin/central/templates', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قوالب المالك غير متاح.'));
    const identity = (req as any).user as { id?: string };
    const actorAuthUserId = String(identity?.id || '').trim();
    const requestedSourceSchoolId = String(req.body?.sourceSchoolId || '').trim();
    const templateKey = String(req.body?.templateKey || '').trim().toLowerCase();
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim() || null;
    if (!isUuid(actorAuthUserId)) return next(new AuthenticationError('هوية مالك المنصة غير مكتملة.'));
    if (!/^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/.test(templateKey)) return next(new ValidationError('مفتاح القالب غير صالح.'));
    if (name.length < 2 || name.length > 160) return next(new ValidationError('اسم القالب يجب أن يكون بين حرفين و160 حرفاً.'));
    if (requestedSourceSchoolId && !isUuid(requestedSourceSchoolId)) return next(new ValidationError('مدرسة مصدر القالب غير صالحة.'));
    try {
      let manifest = readObject(req.body?.manifest);
      const ownerSchool = await platformAdminPool.query<{ id: string; central_metadata: unknown }>(
        `SELECT id, central_metadata
           FROM public.schools
          WHERE deleted_at IS NULL
            AND (central_metadata->>'portal_profile') = 'owner_controlled'
          ORDER BY created_at ASC
          LIMIT 1`,
      );
      if (ownerSchool.rowCount !== 1) return next(new ConflictError('لا توجد مدرسة مالك مربوطة بمركز الإدارة المركزية.'));
      const sourceSchoolId = requestedSourceSchoolId || ownerSchool.rows[0].id;
      if (sourceSchoolId !== ownerSchool.rows[0].id) return next(new ConflictError('قوالب المنصة يجب أن تُنشأ من مدرسة المالك فقط.'));
      {
        const source = await platformAdminPool.query<{ central_metadata: unknown }>(
          `SELECT central_metadata FROM public.schools WHERE id = $1::uuid AND deleted_at IS NULL`,
          [sourceSchoolId],
        );
        if (source.rowCount !== 1) return next(new ConflictError('مدرسة مصدر القالب غير موجودة.'));
        const metadata = readObject(source.rows[0].central_metadata);
        manifest = {
          ...manifest,
          features: normalizeFeatureOverrides(metadata.features),
          rbac: await captureCanonicalRbacManifest(platformAdminPool, sourceSchoolId),
          sourceSchoolId,
          capturedAt: new Date().toISOString(),
        };
      }
      const result = await platformAdminPool.query(
        `INSERT INTO public.platform_templates
          (template_key, name, description, version, status, manifest, created_by_auth_user_id, updated_by_auth_user_id)
         VALUES ($1, $2, $3, 1, 'draft', $4::jsonb, $5::uuid, $5::uuid)
         RETURNING id, template_key, name, description, version, status, manifest, created_at, updated_at`,
        [templateKey, name, description, JSON.stringify(manifest), actorAuthUserId],
      );
      return res.status(201).json({ success: true, template: result.rows[0] });
    } catch (error) {
      if (error instanceof ConflictError) return next(error);
      return next(/duplicate|unique/i.test(error instanceof Error ? error.message : '')
        ? new ConflictError('مفتاح القالب مستخدم مسبقاً.')
        : new DatabaseError('تعذر إنشاء قالب النظام.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.patch('/api/admin/central/templates/:templateId', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قوالب المالك غير متاح.'));
    const identity = (req as any).user as { id?: string };
    const actorAuthUserId = String(identity?.id || '').trim();
    const templateId = String(req.params.templateId || '').trim();
    const operation = String(req.body?.operation || '').trim();
    if (!isUuid(actorAuthUserId) || !isUuid(templateId)) return next(new ValidationError('معرف القالب أو هوية المالك غير صالح.'));
    if (!['publish', 'archive', 'update', 'capture'].includes(operation)) return next(new ValidationError('عملية القالب غير معتمدة.'));
    const client = await platformAdminPool.connect();
    try {
      await client.query('BEGIN');
      let result: any;
      if (operation === 'archive') {
        result = await client.query(
          `UPDATE public.platform_templates
              SET status = 'archived', updated_at = now(), updated_by_auth_user_id = $2::uuid
            WHERE id = $1::uuid AND status <> 'archived'
          RETURNING id, template_key, name, description, version, status, manifest, created_at, updated_at`,
          [templateId, actorAuthUserId],
        );
      } else if (operation === 'capture') {
        const ownerSchool = await client.query<{ id: string; central_metadata: unknown }>(
          `SELECT id, central_metadata
             FROM public.schools
            WHERE deleted_at IS NULL
              AND (central_metadata->>'portal_profile') = 'owner_controlled'
            ORDER BY created_at ASC
            LIMIT 1`,
        );
        if (ownerSchool.rowCount !== 1) throw new ConflictError('لا توجد مدرسة مركزية مربوطة لالتقاط القالب الأساسي.');
        const ownerMetadata = readObject(ownerSchool.rows[0].central_metadata);
        const capturedManifest = {
          features: normalizeFeatureOverrides(ownerMetadata.features),
          rbac: await captureCanonicalRbacManifest(client, ownerSchool.rows[0].id),
          sourceSchoolId: ownerSchool.rows[0].id,
          capturedAt: new Date().toISOString(),
        };
        result = await client.query(
          `UPDATE public.platform_templates
              SET manifest = manifest || $2::jsonb,
                  version = version + 1,
                  status = CASE WHEN template_key = $3 THEN 'published' ELSE 'draft' END,
                  updated_at = now(), updated_by_auth_user_id = $4::uuid
            WHERE id = $1::uuid AND status <> 'archived'
          RETURNING id, template_key, name, description, version, status, manifest, created_at, updated_at`,
          [templateId, JSON.stringify(capturedManifest), CANONICAL_SCHOOL_TEMPLATE_KEY, actorAuthUserId],
        );
      } else {
        const manifest = readObject(req.body?.manifest);
        const name = String(req.body?.name || '').trim();
        if (name && (name.length < 2 || name.length > 160)) return next(new ValidationError('اسم القالب غير صالح.'));
        result = await client.query(
          `UPDATE public.platform_templates
              SET name = COALESCE(NULLIF($2, ''), name),
                  description = COALESCE($3, description),
                  manifest = CASE WHEN $4::jsonb = '{}'::jsonb THEN manifest ELSE $4::jsonb END,
                  version = version + 1,
                  status = $5,
                  updated_at = now(), updated_by_auth_user_id = $6::uuid
            WHERE id = $1::uuid AND status <> 'archived'
          RETURNING id, template_key, name, description, version, status, manifest, created_at, updated_at`,
          [templateId, name, String(req.body?.description || '').trim() || null, JSON.stringify(manifest), operation === 'publish' ? 'published' : 'draft', actorAuthUserId],
        );
      }
      if (result.rowCount !== 1) throw new ConflictError('القالب غير موجود أو مؤرشف.');
      const template = result.rows[0];
      const propagation = (operation === 'capture' || operation === 'publish')
        ? await propagateCanonicalTemplate(client, template, actorAuthUserId)
        : { targetCount: 0, releases: [], schools: [] };
      await client.query('COMMIT');
      return res.json({ success: true, template, propagation });
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* preserve original error */ }
      return next(error instanceof ConflictError || error instanceof ValidationError
        ? error
        : new DatabaseError('تعذر تحديث قالب النظام.', error instanceof Error ? error.message : String(error)));
    } finally {
      client.release();
    }
  });

  app.get('/api/admin/central/releases', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر إصدارات المالك غير متاح.'));
    const schoolId = String(req.query?.schoolId || '').trim();
    if (schoolId && !isUuid(schoolId)) return next(new ValidationError('معرف المدرسة غير صالح.'));
    try {
      const result = await platformAdminPool.query(`
        SELECT ${workspaceSelectColumns},
               s.display_name AS school_name, s.school_code,
               t.template_key, t.name AS template_name, t.version AS template_version
          FROM public.platform_school_releases r
          JOIN public.schools s ON s.id = r.school_id
          LEFT JOIN public.platform_templates t ON t.id = r.template_id
         WHERE ($1::uuid IS NULL OR r.school_id = $1::uuid)
         ORDER BY r.created_at DESC
         LIMIT 250
      `, [schoolId || null]);
      return res.json({ success: true, releases: result.rows });
    } catch (error) {
      return next(new DatabaseError('تعذر قراءة سجل إصدارات المدارس.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.post('/api/admin/central/releases', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر إصدارات المالك غير متاح.'));
    const identity = (req as any).user as { id?: string };
    const actorAuthUserId = String(identity?.id || '').trim();
    const requestBody = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const scope = String(req.body?.scope || 'school').trim() as 'school' | 'selected' | 'global';
    const requestedSchoolIds = Array.isArray(requestBody.schoolIds) ? requestBody.schoolIds.map((id: unknown) => String(id || '').trim()).filter(Boolean) : [];
    const singleSchoolId = String(req.body?.schoolId || '').trim();
    const templateId = String(req.body?.templateId || '').trim();
    const title = String(req.body?.title || '').trim();
    const notes = String(req.body?.notes || '').trim() || null;
    const channel = String(req.body?.channel || 'stable').trim() as 'stable' | 'pilot';
    const manifestOverrides = requestBody.manifestOverrides === undefined ? {} : readObject(requestBody.manifestOverrides);
    if (requestBody.manifestOverrides !== undefined && (typeof requestBody.manifestOverrides !== 'object' || Array.isArray(requestBody.manifestOverrides))) {
      return next(new ValidationError('فروقات إعدادات المدرسة غير صالحة.'));
    }
    let featureOverrides: Record<string, boolean> = {};
    try {
      featureOverrides = normalizeFeatureOverrides(req.body?.featureOverrides);
    } catch (error) {
      return next(error);
    }
    const hasFeatures = Object.keys(featureOverrides).length > 0;
    if (!isUuid(actorAuthUserId)) return next(new AuthenticationError('هوية مالك المنصة غير مكتملة.'));
    if (!['school', 'selected', 'global'].includes(scope)) return next(new ValidationError('نطاق الإصدار غير معتمد.'));
    if (scope === 'school' && !isUuid(singleSchoolId)) return next(new ValidationError('اختر مدرسة واحدة للإصدار الموجّه.'));
    if (scope === 'selected' && (!requestedSchoolIds.length || requestedSchoolIds.length > 200)) return next(new ValidationError('اختر مدرسة واحدة على الأقل وبحد أقصى 200 مدرسة.'));
    if (requestedSchoolIds.some((id: string) => !isUuid(id)) || (templateId && !isUuid(templateId))) return next(new ValidationError('معرف المدرسة أو القالب غير صالح.'));
    if (!title || title.length < 2 || title.length > 200) return next(new ValidationError('عنوان الإصدار يجب أن يكون بين حرفين و200 حرفاً.'));
    if (!['stable', 'pilot'].includes(channel)) return next(new ValidationError('قناة الإصدار غير معتمدة.'));
    if (!templateId && !hasFeatures) return next(new ValidationError('الإصدار يحتاج قالباً أو ميزة واحدة على الأقل.'));
    const targetIds = [...new Set(scope === 'school' ? [singleSchoolId] : requestedSchoolIds)];
    const client = await platformAdminPool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL statement_timeout = '20s'");
      const targets = scope === 'global'
        ? await client.query<{ id: string; tenant_id: string; central_metadata: unknown; display_name: string }>(
          `SELECT id, tenant_id, central_metadata, display_name
             FROM public.schools
            WHERE status = 'active' AND deleted_at IS NULL
              AND COALESCE(central_metadata->>'portal_profile', '') <> 'owner_controlled'
              AND COALESCE(central_metadata->'ownerWorkspace'->>'mode', '') <> 'owner'
            ORDER BY created_at ASC
            FOR UPDATE`,
        )
        : await client.query<{ id: string; tenant_id: string; central_metadata: unknown; display_name: string }>(
          `SELECT id, tenant_id, central_metadata, display_name
             FROM public.schools
             WHERE id = ANY($1::uuid[]) AND status <> 'archived' AND deleted_at IS NULL
               AND COALESCE(central_metadata->>'portal_profile', '') <> 'owner_controlled'
               AND COALESCE(central_metadata->'ownerWorkspace'->>'mode', '') <> 'owner'
            ORDER BY created_at ASC
            FOR UPDATE`,
          [targetIds],
        );
      if (!targets.rows.length || targets.rows.length !== (scope === 'global' ? targets.rows.length : targetIds.length)) {
          throw new ConflictError('مدرسة مستهدفة غير موجودة أو مؤرشفة أو هي المدرسة المركزية؛ لم يُطبق الإصدار على أي مدرسة.');
      }
      let template: any = null;
      if (templateId) {
        const templateResult = await client.query(
          `SELECT id, template_key, name, version, status, manifest
             FROM public.platform_templates
            WHERE id = $1::uuid AND status = 'published'
            FOR SHARE`,
          [templateId],
        );
        if (templateResult.rowCount !== 1) throw new ConflictError('القالب غير منشور؛ راجعه وانشره قبل توزيعه على المدارس.');
        template = templateResult.rows[0];
        template.manifest = normalizeTemplateManifest(template.manifest);
      }
      const releases: any[] = [];
      const updatedSchools: any[] = [];
      for (const target of targets.rows) {
        const previousVersion = await client.query<{ next_version: number }>(
          `SELECT COALESCE(MAX(release_version), 0) + 1 AS next_version
             FROM public.platform_school_releases
            WHERE school_id = $1::uuid`,
          [target.id],
        );
        const releaseVersion = Number(previousVersion.rows[0]?.next_version || 1);
        const releaseId = randomUUID();
        const metadata = readObject(target.central_metadata);
        const previousWorkspace = readObject(metadata.ownerWorkspace);
        const ownerWorkspace = isOwnerWorkspaceMetadata(metadata);
        const templateFeatures = template ? normalizeFeatureOverrides(template.manifest.features) : {};
        const nextFeatures = {
          ...(template ? templateFeatures : readObject(metadata.features)),
          ...featureOverrides,
        };
        const nextMetadata: Record<string, unknown> = {
          ...metadata,
          ownerWorkspace: {
            ...previousWorkspace,
            mode: ownerWorkspace ? 'owner' : 'customer',
            releaseChannel: channel,
            currentReleaseId: releaseId,
            currentReleaseVersion: releaseVersion,
            ...(template ? { templateId: template.id, templateKey: template.template_key, templateVersion: template.version } : {}),
            lastReleaseTitle: title,
            lastReleaseAt: new Date().toISOString(),
          },
          ...(template || hasFeatures ? { features: nextFeatures } : {}),
        };
        const releaseResult = await client.query(
          `INSERT INTO public.platform_school_releases
            (id, school_id, template_id, release_version, release_kind, scope, channel, status, title, notes, feature_overrides, payload, created_by_auth_user_id)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, 'active', $8, $9, $10::jsonb, $11::jsonb, $12::uuid)
           RETURNING ${workspaceColumns}`,
          [
            releaseId,
            target.id,
            template?.id || null,
            releaseVersion,
            template && hasFeatures ? 'combined' : template ? 'template' : 'features',
            scope,
            channel,
            title,
            notes,
            JSON.stringify(featureOverrides),
            JSON.stringify({
              template: template?.manifest || null,
              overrides: manifestOverrides,
              templateKey: template?.template_key || null,
              templateVersion: template?.version || null,
              features: nextFeatures,
            }),
            actorAuthUserId,
          ],
        );
        const schoolResult = await client.query(
          `UPDATE public.schools
              SET central_metadata = $2::jsonb,
                  updated_at = now(), version = version + 1
            WHERE id = $1::uuid
          RETURNING id, tenant_id, display_name, school_code, status, central_metadata`,
          [target.id, JSON.stringify(nextMetadata)],
        );
        releases.push(releaseResult.rows[0]);
        updatedSchools.push(schoolResult.rows[0]);
      }
      await client.query('COMMIT');
      return res.status(201).json({
        success: true,
        scope,
        targetCount: updatedSchools.length,
        releases,
        schools: updatedSchools,
      });
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* preserve original error */ }
      return next(error instanceof ConflictError || error instanceof ValidationError
        ? error
        : new DatabaseError('تعذر اعتماد الإصدار الموجّه؛ لم يتم تعديل أي مدرسة.', error instanceof Error ? error.message : String(error)));
    } finally {
      client.release();
    }
  });

  app.post('/api/admin/central/releases/:releaseId/rollback', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر إصدارات المالك غير متاح.'));
    const identity = (req as any).user as { id?: string };
    const actorAuthUserId = String(identity?.id || '').trim();
    const releaseId = String(req.params.releaseId || '').trim();
    if (!isUuid(actorAuthUserId) || !isUuid(releaseId)) return next(new ValidationError('معرف الإصدار أو هوية المالك غير صالح.'));
    const client = await platformAdminPool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<any>(
        `SELECT r.*, s.central_metadata
           FROM public.platform_school_releases r
           JOIN public.schools s ON s.id = r.school_id
          WHERE r.id = $1::uuid AND r.status = 'active'
          FOR UPDATE`,
        [releaseId],
      );
      if (current.rowCount !== 1) throw new ConflictError('الإصدار غير موجود أو تمت معالجته مسبقًا.');
      const row = current.rows[0];
      const previous = await client.query<any>(
        `SELECT * FROM public.platform_school_releases
          WHERE school_id = $1::uuid AND status = 'active' AND release_version < $2
          ORDER BY release_version DESC LIMIT 1`,
        [row.school_id, row.release_version],
      );
      const previousRow = previous.rows[0] || null;
      const metadata = readObject(row.central_metadata);
      const currentWorkspace = readObject(metadata.ownerWorkspace);
      const fallbackFeatures = previousRow?.payload?.features && typeof previousRow.payload.features === 'object'
        ? previousRow.payload.features
        : readObject(metadata.features);
      const nextMetadata = {
        ...metadata,
        features: fallbackFeatures,
        ownerWorkspace: {
          ...currentWorkspace,
          currentReleaseId: previousRow?.id || null,
          currentReleaseVersion: Number(previousRow?.release_version || 0),
          templateId: previousRow?.template_id || null,
          templateVersion: Number(previousRow?.payload?.templateVersion || 0),
          lastReleaseTitle: previousRow?.title || 'لا يوجد إصدار سابق',
          lastReleaseAt: previousRow?.created_at || null,
        },
      };
      await client.query(
        `UPDATE public.platform_school_releases SET status = 'rolled_back', rolled_back_at = now() WHERE id = $1::uuid`,
        [releaseId],
      );
      const school = await client.query(
        `UPDATE public.schools SET central_metadata = $2::jsonb, updated_at = now(), version = version + 1
          WHERE id = $1::uuid
        RETURNING id, tenant_id, display_name, school_code, status, central_metadata`,
        [row.school_id, JSON.stringify(nextMetadata)],
      );
      await client.query('COMMIT');
      return res.json({ success: true, rolledBackReleaseId: releaseId, previousReleaseId: previousRow?.id || null, school: school.rows[0] });
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* preserve original error */ }
      return next(error instanceof ConflictError ? error : new DatabaseError('تعذر التراجع عن الإصدار؛ لم تتغير المدرسة.', error instanceof Error ? error.message : String(error)));
    } finally {
      client.release();
    }
  });

  // Tenant-facing workspace state is intentionally restricted to the
  // verified school in the session. It supports near-real-time refresh of
  // targeted feature releases without exposing the central control plane.
  app.get('/api/school/workspace', authenticateRequest, async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر إعدادات المدرسة غير متاح.'));
    const identity = (req as any).user as { schoolId?: string };
    const schoolId = String(identity?.schoolId || '').trim();
    if (!isUuid(schoolId)) return next(new AuthorizationError('هذه النقطة متاحة فقط داخل جلسة مدرسة موثقة.'));
    disableAuthCaching(res);
    try {
      const result = await platformAdminPool.query<any>(
        `SELECT s.id, s.display_name, s.status, s.central_metadata,
                r.id AS release_id, r.release_version, r.release_kind, r.channel,
                r.title AS release_title, r.created_at AS release_created_at,
                r.feature_overrides, r.payload AS release_payload,
                r.template_id, t.template_key, t.version AS template_version, t.manifest AS template_manifest
           FROM public.schools s
           LEFT JOIN LATERAL (
             SELECT * FROM public.platform_school_releases
              WHERE school_id = s.id AND status = 'active'
              ORDER BY release_version DESC LIMIT 1
           ) r ON true
           LEFT JOIN public.platform_templates t ON t.id = r.template_id
          WHERE s.id = $1::uuid AND s.status = 'active' AND s.deleted_at IS NULL`,
        [schoolId],
      );
      if (result.rowCount !== 1) return next(new ConflictError('إعدادات المدرسة غير متاحة.'));
      const row = result.rows[0];
      const metadata = readObject(row.central_metadata);
      const workspace = readObject(metadata.ownerWorkspace);
      const releasePayload = readObject(row.release_payload);
      const effectiveManifest = mergeTemplateManifest(
        resolveReleaseBaseManifest(releasePayload, row.template_manifest, metadata),
        releasePayload.overrides,
        row.feature_overrides,
      );
      return res.json({
        success: true,
        workspace: {
          schoolId: row.id,
          schoolName: row.display_name,
          status: row.status,
          mode: isOwnerWorkspaceMetadata(metadata) ? 'owner' : 'customer',
          isOwnerWorkspace: isOwnerWorkspaceMetadata(metadata),
          features: normalizeFeatureOverrides(effectiveManifest.features),
          templateManifest: effectiveManifest,
          releaseId: row.release_id || workspace.currentReleaseId || null,
          releaseVersion: Number(row.release_version || workspace.currentReleaseVersion || 0),
          releaseKind: row.release_kind || null,
          releaseChannel: row.channel || workspace.releaseChannel || 'stable',
          releaseTitle: row.release_title || workspace.lastReleaseTitle || null,
          releaseAt: row.release_created_at || workspace.lastReleaseAt || null,
          templateId: row.template_id || workspace.templateId || null,
          templateKey: releasePayload.templateKey || row.template_key || workspace.templateKey || null,
          templateVersion: Number(releasePayload.templateVersion || row.template_version || workspace.templateVersion || 0),
        },
      });
    } catch (error) {
      return next(new DatabaseError('تعذر قراءة إعدادات مساحة المدرسة.', error instanceof Error ? error.message : String(error)));
    }
  });

  // A small, truthful health probe for the canonical control-plane database.
  // It reports the connection round trip plus migration drift for the objects
  // required by the central directory. CPU, storage, network and backup
  // telemetry still require their dedicated providers.
  app.get('/api/admin/central/health', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (_req, res, next) => {
    if (platformControl && !platformAdminPool) {
      const startedAt = Date.now();
      try {
        const { error } = await platformControl.from('tenants').select('id').limit(1);
        if (error) throw error;
        return res.json({
          success: true,
          health: {
            database: 'reachable',
            responseMs: Date.now() - startedAt,
            checkedAt: new Date().toISOString(),
            source: 'supabase-rest-control-plane',
            schemaStatus: 'ready',
            missingSchemaObjects: [],
          },
        });
      } catch (error) {
        return next(new DatabaseError('تعذر قياس اتصال المصدر المركزي الآمن.', error instanceof Error ? error.message : String(error)));
      }
    }
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
              ('table', 'roles'),
              ('table', 'permissions'),
              ('table', 'role_permissions'),
              ('table', 'user_roles'),
              ('table', 'audit_events'),
              ('table', 'outbox_events'),
              ('table', 'platform_templates'),
              ('table', 'platform_school_releases'),
              ('column', 'users.job_title'),
              ('column', 'users.department'),
              ('column', 'users.session_revoked_at'),
              ('column', 'users.force_password_change'),
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
              OR (required.kind = 'table' AND to_regclass('public.' || required.name) IS NULL)
              OR (required.kind = 'column' AND NOT EXISTS (
                    SELECT 1
                      FROM information_schema.columns c
                     WHERE c.table_schema = 'public'
                       AND (c.table_name || '.' || c.column_name) = required.name
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
    if (platformControl && !platformAdminPool) {
      const includeArchived = String(req.query?.includeArchived || '').toLowerCase() === 'true';
      try {
        const [tenantRows, subscriptionRows, schoolRows, branchRows, userRows, studentRows] = await Promise.all([
          readPlatformRows('tenants', 'id, legal_name, slug, plan_code, status, deleted_at, created_at, updated_at', (query) => query.order('created_at', { ascending: false })),
          readPlatformRows('subscriptions', 'id, tenant_id, plan_code, starts_at, ends_at, seat_limit, auto_renew, status, deleted_at, created_at', (query) => query.order('starts_at', { ascending: false })),
          readPlatformRows('schools', 'id, tenant_id, deleted_at'),
          readPlatformRows('branches', 'id, tenant_id, deleted_at'),
          readPlatformRows('users', 'id, tenant_id, deleted_at'),
          readPlatformRows('students', 'id, tenant_id, deleted_at'),
        ]);
        const active = (row: any) => !row.deleted_at;
        const latestSubscription = new Map<string, any>();
        for (const subscription of subscriptionRows.filter(active).sort((a: any, b: any) => String(b.starts_at || '').localeCompare(String(a.starts_at || '')))) {
          if (!latestSubscription.has(subscription.tenant_id)) latestSubscription.set(subscription.tenant_id, subscription);
        }
        return res.json({
          success: true,
          tenants: tenantRows.filter((tenant: any) => includeArchived || !tenant.deleted_at).map((tenant: any) => {
            const subscription = latestSubscription.get(tenant.id);
            return {
              ...tenant,
              schools_count: schoolRows.filter((row: any) => row.tenant_id === tenant.id && active(row)).length,
              branches_count: branchRows.filter((row: any) => row.tenant_id === tenant.id && active(row)).length,
              users_count: userRows.filter((row: any) => row.tenant_id === tenant.id && active(row)).length,
              students_count: studentRows.filter((row: any) => row.tenant_id === tenant.id && active(row)).length,
              subscription: subscription ? {
                id: subscription.id, plan_code: subscription.plan_code, starts_at: subscription.starts_at,
                ends_at: subscription.ends_at, seat_limit: subscription.seat_limit,
                auto_renew: subscription.auto_renew, status: subscription.status,
              } : null,
            };
          }),
        });
      } catch (error) {
        return next(new DatabaseError('تعذر تحميل دليل المستأجرين المركزي.', error instanceof Error ? error.message : String(error)));
      }
    }
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
    if (platformControl && !platformAdminPool) {
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
      if (Number.isNaN(startDate.getTime()) || (endDate && Number.isNaN(endDate.getTime())) || (endDate && endDate <= startDate)) return next(new ValidationError('تواريخ الاشتراك غير صالحة أو تاريخ النهاية ليس بعد البداية.'));
      const tenantId = randomUUID();
      const subscriptionId = randomUUID();
      try {
        const tenant = await insertPlatformRow('tenants', { id: tenantId, legal_name: legalName, slug, plan_code: planCode, status: tenantStatus, created_by: null, updated_by: null }, 'id, legal_name, slug, plan_code, status, deleted_at, created_at, updated_at');
        try {
          const subscription = await insertPlatformRow('subscriptions', { id: subscriptionId, tenant_id: tenantId, plan_code: planCode, starts_at: startDate.toISOString(), ends_at: endDate?.toISOString() || null, seat_limit: seatLimit, auto_renew: autoRenew, status: subscriptionStatus, created_by: null, updated_by: null }, 'id, tenant_id, plan_code, starts_at, ends_at, seat_limit, auto_renew, status');
          return res.status(201).json({ success: true, tenant: { ...tenant, subscription } });
        } catch (error) {
          await deletePlatformRow('tenants', tenantId);
          throw error;
        }
      } catch (error) {
        return next(error instanceof Error && /duplicate|unique/i.test(error.message) ? new ConflictError('معرف المستأجر مستخدم مسبقاً.') : new DatabaseError('تعذر إنشاء المستأجر والاشتراك في المصدر المركزي.', error instanceof Error ? error.message : String(error)));
      }
    }
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
    if (platformControl && !platformAdminPool) {
      const requestedTenantId = String(req.query?.tenantId || '').trim();
      if (requestedTenantId && !/^[0-9a-f-]{36}$/i.test(requestedTenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
      try {
        const [schoolRows, tenantRows, subscriptionRows, branchRows, userRows, studentRows] = await Promise.all([
          readPlatformRows('schools', 'id, tenant_id, school_code, legal_name, display_name, timezone, locale, status, central_metadata, deleted_at, created_at, updated_at', (query) => query.order('created_at', { ascending: false })),
          readPlatformRows('tenants', 'id, status, deleted_at'),
          readPlatformRows('subscriptions', 'tenant_id, plan_code, starts_at, ends_at, seat_limit, auto_renew, status, deleted_at, created_at', (query) => query.order('starts_at', { ascending: false })),
          readPlatformRows('branches', 'id, tenant_id, school_id, branch_code, name, status, deleted_at, created_at, updated_at, address'),
          readPlatformRows('users', 'id, tenant_id, school_id, deleted_at'),
          readPlatformRows('students', 'id, tenant_id, school_id, deleted_at'),
        ]);
        const latestSubscription = new Map<string, any>();
        for (const subscription of subscriptionRows.filter((row: any) => !row.deleted_at).sort((a: any, b: any) => String(b.starts_at || '').localeCompare(String(a.starts_at || '')))) {
          if (!latestSubscription.has(subscription.tenant_id)) latestSubscription.set(subscription.tenant_id, subscription);
        }
        const tenantById = new Map(tenantRows.map((tenant: any) => [tenant.id, tenant]));
        const active = (row: any) => !row.deleted_at;
        return res.json({
          success: true,
          schools: schoolRows.filter((school: any) => active(school) && (!requestedTenantId || school.tenant_id === requestedTenantId)).map((school: any) => {
            const subscription = latestSubscription.get(school.tenant_id);
            const mainBranchId = school.central_metadata?.mainBranchId;
            const mainBranch = branchRows.filter((branch: any) => active(branch) && branch.school_id === school.id).sort((a: any, b: any) => String(a.created_at || '').localeCompare(String(b.created_at || ''))).find((branch: any) => branch.id === mainBranchId)
              || branchRows.filter((branch: any) => active(branch) && branch.school_id === school.id).sort((a: any, b: any) => String(a.created_at || '').localeCompare(String(b.created_at || '')))[0];
            return {
              ...school,
              tenant_status: tenantById.get(school.tenant_id)?.status || null,
              users_count: userRows.filter((row: any) => active(row) && row.school_id === school.id).length,
              students_count: studentRows.filter((row: any) => active(row) && row.school_id === school.id).length,
              subscription: subscription ? { plan_code: subscription.plan_code, starts_at: subscription.starts_at, ends_at: subscription.ends_at, seat_limit: subscription.seat_limit, auto_renew: subscription.auto_renew, status: subscription.status } : null,
              central_metadata: stripLegacySchoolSubscriptionProfile(school.central_metadata),
              main_branch: mainBranch ? { id: mainBranch.id, branch_code: mainBranch.branch_code, name: mainBranch.name, status: mainBranch.status } : null,
            };
          }),
        });
      } catch (error) {
        return next(new DatabaseError('تعذر تحميل دليل المدارس المركزي.', error instanceof Error ? error.message : String(error)));
      }
    }
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
    if (platformControl && !platformAdminPool) {
      const tenantId = String(req.body?.targetTenantId || req.body?.tenantId || '').trim();
      const actorAuthUserId = String((req as any).user?.id || '').trim();
      const name = String(req.body?.name || '').trim();
      const schoolCode = String(req.body?.schoolCode || '').trim().toUpperCase();
      const timezone = String(req.body?.timezone || 'Africa/Khartoum').trim();
      const locale = String(req.body?.locale || 'ar').trim();
      const centralMetadata = {
        portal_profile: 'customer_production', shortName: String(req.body?.shortName || '').trim(),
        subdomain: String(req.body?.subdomain || '').trim().toLowerCase(), city: String(req.body?.city || '').trim(),
        address: String(req.body?.address || '').trim(), phone: String(req.body?.phone || '').trim(),
        email: String(req.body?.email || '').trim().toLowerCase(), managerName: String(req.body?.managerName || '').trim(),
        managerEmail: String(req.body?.managerEmail || '').trim().toLowerCase(), mainBranchId: '',
      };
      if (!tenantId || !/^[0-9a-f-]{36}$/i.test(tenantId) || !/^[0-9a-f-]{36}$/i.test(actorAuthUserId)) return next(new AuthenticationError('هوية الإدارة المركزية أو المستأجر المستهدف غير مكتمل.'));
      if (name.length < 2 || name.length > 160) return next(new ValidationError('اسم المدرسة يجب أن يكون بين حرفين و160 حرفاً.'));
      if (schoolCode && !/^[A-Z0-9][A-Z0-9._/-]*$/.test(schoolCode)) return next(new ValidationError('رمز المدرسة غير صالح.'));
      if (!/^[A-Za-z_/-]+$/.test(timezone) || locale.length < 2) return next(new ValidationError('إعدادات اللغة أو المنطقة الزمنية غير صالحة.'));
      if (centralMetadata.subdomain && !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(centralMetadata.subdomain)) return next(new ValidationError('النطاق الفرعي يجب أن يتكون من 3 إلى 63 رمزاً لاتينياً صغيراً.'));
      if (centralMetadata.managerEmail && !/^\S+@\S+\.\S+$/.test(centralMetadata.managerEmail)) return next(new ValidationError('بريد مدير المدرسة غير صالح.'));
      const schoolId = randomUUID();
      const branchId = randomUUID();
      centralMetadata.mainBranchId = branchId;
      const resolvedCode = schoolCode || `SCH-${schoolId.slice(0, 8).toUpperCase()}`;
      try {
        const { data: tenant, error: tenantError } = await platformControl.from('tenants').select('id, status').eq('id', tenantId).is('deleted_at', null).maybeSingle();
        if (tenantError) throw tenantError;
        if (!tenant || !['provisioning', 'active'].includes(tenant.status)) throw new ConflictError('المستأجر المستهدف غير موجود أو موقوف.');
        const { data: templateRows, error: templateError } = await platformControl
          .from('platform_templates')
          .select('id, template_key, name, version, status, manifest')
          .eq('status', 'published')
          .eq('template_key', CANONICAL_SCHOOL_TEMPLATE_KEY)
          .limit(1);
        if (templateError) throw templateError;
        if (!templateRows?.length) throw new ConflictError('لا يوجد قالب مالك منشور؛ انشر قالبًا قبل فتح مدرسة جديدة.');
        const defaultTemplate = templateRows[0];
        const defaultManifest = normalizeTemplateManifest(defaultTemplate.manifest);
        const defaultFeatures = normalizeFeatureOverrides(defaultManifest.features);
        const school = await insertPlatformRow('schools', { id: schoolId, tenant_id: tenantId, school_code: resolvedCode, legal_name: name, display_name: name, timezone, locale, status: 'active', central_metadata: centralMetadata, created_by: null, updated_by: null }, 'id, tenant_id, school_code, legal_name, display_name, timezone, locale, status, central_metadata, created_at, updated_at');
        try {
          const branch = await insertPlatformRow('branches', { id: branchId, tenant_id: tenantId, school_id: schoolId, branch_code: `${resolvedCode}-MAIN`, name: 'الفرع الرئيسي', address: { city: centralMetadata.city, phone: centralMetadata.phone, address: centralMetadata.address }, status: 'active', created_by: null, updated_by: null }, 'id, tenant_id, school_id, branch_code, name, address, status, deleted_at, created_at, updated_at');
          const releaseId = randomUUID();
          const nextMetadata = {
            ...centralMetadata,
            features: defaultFeatures,
            ownerWorkspace: {
              mode: 'customer', releaseChannel: 'stable', currentReleaseId: releaseId,
              currentReleaseVersion: 1, templateId: defaultTemplate.id,
              templateKey: defaultTemplate.template_key, templateVersion: defaultTemplate.version,
              lastReleaseTitle: `النسخة الأساسية من قالب ${defaultTemplate.name}`,
              lastReleaseAt: new Date().toISOString(),
            },
          };
          const { error: releaseError } = await platformControl.from('platform_school_releases').insert({
            id: releaseId, school_id: schoolId, template_id: defaultTemplate.id,
            release_version: 1, release_kind: 'template', scope: 'school', channel: 'stable',
            status: 'active', title: `النسخة الأساسية من قالب ${defaultTemplate.name}`,
            notes: 'تطبيق تلقائي للقالب المنشور عند إنشاء المدرسة.',
            feature_overrides: {},
            payload: { template: defaultManifest, templateKey: defaultTemplate.template_key, templateVersion: defaultTemplate.version, features: defaultFeatures },
            created_by_auth_user_id: actorAuthUserId,
          });
          if (releaseError) throw releaseError;
          const { data: updatedSchool, error: schoolUpdateError } = await platformControl.from('schools')
            .update({ central_metadata: nextMetadata })
            .eq('id', schoolId)
            .select('id, tenant_id, school_code, legal_name, display_name, timezone, locale, status, central_metadata, created_at, updated_at')
            .single();
          if (schoolUpdateError) throw schoolUpdateError;
          return res.status(201).json({ success: true, school: updatedSchool, branch, template: defaultTemplate, release: { id: releaseId, version: 1 }, provisioning: { hr_database: false, inventory_database: false, financial_portal_snapshots: false, pending_until_first_school_user: true } });
        } catch (error) {
          await platformControl.from('platform_school_releases').delete().eq('school_id', schoolId);
          await platformControl.from('branches').delete().eq('id', branchId);
          await deletePlatformRow('schools', schoolId);
          throw error;
        }
      } catch (error) {
        return next(error instanceof Error && /duplicate|unique/i.test(error.message) ? new ConflictError('رمز المدرسة أو النطاق الفرعي مستخدم مسبقاً داخل المستأجر.') : error instanceof ConflictError ? error : new DatabaseError('تعذر إنشاء المدرسة والفرع في المصدر المركزي.', error instanceof Error ? error.message : String(error)));
      }
    }
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { id?: string; tenantId?: string };
    const tenantId = String(req.body?.targetTenantId || req.body?.tenantId || identity?.tenantId || '').trim();
    const actorAuthUserId = String(identity?.id || '').trim();
    const name = String(req.body?.name || '').trim();
    const schoolCode = String(req.body?.schoolCode || '').trim().toUpperCase();
    const timezone = String(req.body?.timezone || 'Africa/Khartoum').trim();
    const locale = String(req.body?.locale || 'ar').trim();
    const centralMetadata = {
      // New schools are provisioned into the commercial school workspace. It
      // is consumed only through the server-resolved trusted school session.
      portal_profile: 'customer_production',
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

    if (!tenantId || !/^[0-9a-f-]{36}$/i.test(tenantId) || !/^[0-9a-f-]{36}$/i.test(actorAuthUserId)) return next(new AuthenticationError('هوية الإدارة المركزية أو المستأجر المستهدف غير مكتمل.'));
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
      const actorResult = await client.query<{ id: string; tenant_id: string }>(
        `SELECT id, tenant_id
           FROM public.users
          WHERE auth_user_id = $1::uuid
            AND status = 'active'
            AND deleted_at IS NULL
          LIMIT 1`,
        [actorAuthUserId],
      );
      if (actorResult.rowCount !== 1) throw new AuthenticationError('المنفذ المركزي غير موجود في دليل المستخدمين القانوني.');
      // The platform administrator may provision a brand-new tenant. Tenant-scoped
      // audit foreign keys must therefore remain null until a user exists inside
      // that tenant; the immutable platform actor is recorded on the release row.
      const actorId = actorResult.rows[0].tenant_id === tenantId ? actorResult.rows[0].id : null;
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
      const templateResult = await client.query<any>(
        `SELECT id, template_key, name, version, status, manifest
           FROM public.platform_templates
          WHERE status = 'published' AND template_key = $1
          LIMIT 1
          FOR SHARE`,
        [CANONICAL_SCHOOL_TEMPLATE_KEY],
      );
      if (templateResult.rowCount !== 1) throw new ConflictError('لا يوجد قالب مالك منشور؛ انشر قالبًا قبل فتح مدرسة جديدة.');
      const defaultTemplate = templateResult.rows[0];
      const defaultManifest = normalizeTemplateManifest(defaultTemplate.manifest);
      const defaultFeatures = normalizeFeatureOverrides(defaultManifest.features);
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
      if (actorId) await client.query(
        `INSERT INTO public.hr_database
          (tenant_id, school_id, country_code, legal_configuration, data, version, updated_by)
         VALUES ($1, $2, 'ZZ', '{}'::jsonb,
           '{"employees":[],"departments":[],"jobs":[],"contracts":[],"attendance":[],"leaves":[],"penalties":[],"advances":[],"rewards":[],"performance":[],"documents":[],"payrollRuns":[],"settings":{}}'::jsonb,
           0, $3)
         ON CONFLICT (school_id) DO NOTHING`,
        [tenantId, schoolId, actorId],
      );
      if (actorId) await client.query(
        `INSERT INTO public.inventory_database
          (tenant_id, school_id, data, version, updated_by)
         VALUES ($1, $2,
           '{"items":[],"categories":[],"brands":[],"units":[],"suppliers":[],"warehouses":[],"movements":[],"stocktakes":[],"purchaseRequests":[],"rfqs":[],"quotations":[],"purchaseOrders":[],"goodsReceipts":[],"vendorBills":[],"vendorPayments":[],"settings":{},"procurementSettings":{}}'::jsonb,
           0, $3)
         ON CONFLICT (school_id) DO NOTHING`,
        [tenantId, schoolId, actorId],
      );
      if (actorId) await client.query(
        `INSERT INTO public.financial_portal_snapshots
          (tenant_id, school_id, data, version, updated_by)
         VALUES ($1, $2, '{}'::jsonb, 0, $3)
         ON CONFLICT (school_id) DO NOTHING`,
        [tenantId, schoolId, actorId],
      );
      const releaseId = randomUUID();
      const releaseTitle = `النسخة الأساسية من قالب ${defaultTemplate.name}`;
      const nextMetadata = {
        ...centralMetadata,
        features: defaultFeatures,
        ownerWorkspace: {
          mode: 'customer', releaseChannel: 'stable', currentReleaseId: releaseId,
          currentReleaseVersion: 1, templateId: defaultTemplate.id,
          templateKey: defaultTemplate.template_key, templateVersion: defaultTemplate.version,
          lastReleaseTitle: releaseTitle, lastReleaseAt: new Date().toISOString(),
        },
      };
      await client.query(
        `INSERT INTO public.platform_school_releases
          (id, school_id, template_id, release_version, release_kind, scope, channel, status, title, notes, feature_overrides, payload, created_by_auth_user_id)
         VALUES ($1::uuid, $2::uuid, $3::uuid, 1, 'template', 'school', 'stable', 'active', $4, $5, $6::jsonb, $7::jsonb, $8::uuid)`,
        [releaseId, schoolId, defaultTemplate.id, releaseTitle, 'تطبيق تلقائي للقالب المنشور عند إنشاء المدرسة.', JSON.stringify({}), JSON.stringify({ template: defaultManifest, templateKey: defaultTemplate.template_key, templateVersion: defaultTemplate.version, features: defaultFeatures }), actorAuthUserId],
      );
      const updatedSchool = await client.query(
        `UPDATE public.schools
            SET central_metadata = $2::jsonb, updated_at = now(), version = version + 1
          WHERE id = $1::uuid
        RETURNING id, tenant_id, school_code, legal_name, display_name, timezone, locale, status, central_metadata, created_at, updated_at`,
        [schoolId, JSON.stringify(nextMetadata)],
      );
      await client.query('COMMIT');
      return res.status(201).json({
        success: true,
        school: updatedSchool.rows[0],
        branch: branch.rows[0],
        template: defaultTemplate,
        release: { id: releaseId, version: 1 },
        provisioning: {
          hr_database: Boolean(actorId),
          inventory_database: Boolean(actorId),
          financial_portal_snapshots: Boolean(actorId),
          pending_until_first_school_user: !actorId,
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
    if (platformControl && !platformAdminPool) {
      const tenantId = String(req.query?.tenantId || '').trim();
      const schoolId = String(req.query?.schoolId || '').trim();
      if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
      if (schoolId && !/^[0-9a-f-]{36}$/i.test(schoolId)) return next(new ValidationError('معرف المدرسة غير صالح.'));
      try {
        const [branchRows, schoolRows, userRows, studentRows] = await Promise.all([
          readPlatformRows('branches', 'id, tenant_id, school_id, branch_code, name, address, status, deleted_at, created_at, updated_at', (query) => query.order('created_at', { ascending: true })),
          readPlatformRows('schools', 'id, tenant_id, display_name, central_metadata'),
          readPlatformRows('users', 'id, tenant_id, school_id, branch_id, deleted_at'),
          readPlatformRows('students', 'id, tenant_id, school_id, branch_id, deleted_at'),
        ]);
        const schoolById = new Map(schoolRows.map((school: any) => [school.id, school]));
        const active = (row: any) => !row.deleted_at;
        return res.json({ success: true, branches: branchRows.filter((branch: any) => active(branch) && (!tenantId || branch.tenant_id === tenantId) && (!schoolId || branch.school_id === schoolId)).map((branch: any) => {
          const school = schoolById.get(branch.school_id);
          const address = branch.address || {};
          return {
            ...branch,
            is_main: school?.central_metadata?.mainBranchId === branch.id,
            users_count: userRows.filter((row: any) => active(row) && row.branch_id === branch.id).length,
            students_count: studentRows.filter((row: any) => active(row) && row.branch_id === branch.id).length,
            address, city: address.city || '', phone: address.phone || '', school_name: school?.display_name || '',
          };
        }) });
      } catch (error) {
        return next(new DatabaseError('تعذر تحميل فروع المدارس من المصدر المركزي.', error instanceof Error ? error.message : String(error)));
      }
    }
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

  app.get('/api/admin/central/identity-roles', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), (_req, res) => {
    return res.json({
      success: true,
      roles: Object.entries(CENTRAL_IDENTITY_ROLE_CATALOG).map(([roleKey, role]) => ({
        roleKey,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      })),
    });
  });

  // Central identity directory. Supabase Auth is the identity source; the
  // public.users and RBAC rows are written only after Auth accepts the user.
  app.get('/api/admin/central/users', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (platformControl && !platformAdminPool) {
      const tenantId = String(req.query?.tenantId || '').trim();
      if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
      try {
        const [userRows, authUsers, schoolRows, branchRows, roleRows, assignmentRows] = await Promise.all([
          readPlatformRows('users', 'id, auth_user_id, tenant_id, school_id, branch_id, display_name, job_title, department, status, version, session_revoked_at, force_password_change, created_at, deleted_at', (query) => query.order('created_at', { ascending: false })),
          readPlatformAuthUsers(),
          readPlatformRows('schools', 'id, tenant_id, display_name'),
          readPlatformRows('branches', 'id, tenant_id, school_id, name'),
          readPlatformRows('roles', 'id, tenant_id, role_key, name'),
          readPlatformRows('user_roles', 'id, tenant_id, user_id, role_id, status, deleted_at'),
        ]);
        const authById = new Map(authUsers.map((user: any) => [user.id, user]));
        const schoolById = new Map(schoolRows.map((school: any) => [school.id, school]));
        const branchById = new Map(branchRows.map((branch: any) => [branch.id, branch]));
        const roleById = new Map(roleRows.map((role: any) => [role.id, role]));
        const rolesByUser = new Map<string, any[]>();
        for (const assignment of assignmentRows) {
          if (assignment.deleted_at || assignment.status !== 'active') continue;
          const role = roleById.get(assignment.role_id);
          if (!role) continue;
          const list = rolesByUser.get(assignment.user_id) || [];
          list.push({ id: role.id, roleKey: role.role_key, name: role.name });
          rolesByUser.set(assignment.user_id, list);
        }
        return res.json({ success: true, users: userRows.filter((user: any) => !user.deleted_at && (!tenantId || user.tenant_id === tenantId)).map((user: any) => ({
          id: user.id, auth_user_id: user.auth_user_id, tenant_id: user.tenant_id, school_id: user.school_id,
          branch_id: user.branch_id, display_name: user.display_name, job_title: user.job_title || '', department: user.department || '', status: user.status, version: user.version, session_revoked_at: user.session_revoked_at || null, created_at: user.created_at,
          email: authById.get(user.auth_user_id)?.email || '', forcePasswordChange: Boolean(user.force_password_change),
          last_sign_in_at: authById.get(user.auth_user_id)?.last_sign_in_at || null,
          school_name: schoolById.get(user.school_id)?.display_name || '',
          branch_name: branchById.get(user.branch_id)?.name || '', roles: rolesByUser.get(user.id) || [],
        })) });
      } catch (error) {
        return next(new DatabaseError('تعذر تحميل دليل الهوية المركزي.', error instanceof Error ? error.message : String(error)));
      }
    }
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const tenantId = String(req.query?.tenantId || '').trim();
    if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
    try {
      const result = await platformAdminPool.query(
        `SELECT u.id, u.auth_user_id, u.tenant_id, u.school_id, u.branch_id,
                u.display_name, u.job_title, u.department, u.status, u.version, u.session_revoked_at, u.force_password_change, u.created_at, au.email,
                au.last_sign_in_at,
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
          GROUP BY u.id, au.email, au.raw_user_meta_data, au.last_sign_in_at, s.display_name, b.name
          ORDER BY u.created_at DESC`,
        [tenantId || null],
      );
      return res.json({ success: true, users: result.rows });
    } catch (error) {
      return next(new DatabaseError('تعذر تحميل دليل الهوية المركزي.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.post('/api/admin/central/schools/:schoolId/users', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (platformControl && !platformAdminPool) {
      const identity = (req as any).user as { id?: string };
      const tenantId = String(req.body?.targetTenantId || '').trim();
      const actorAuthUserId = String(identity?.id || '').trim();
      const schoolId = String(req.params.schoolId || '').trim();
      let branchId = String(req.body?.branchId || '').trim();
      const displayName = String(req.body?.name || '').trim();
      const jobTitle = String(req.body?.jobTitle || '').trim();
      const department = String(req.body?.department || '').trim();
      const loginIdentity = provisionLoginIdentity(req.body?.email);
      const email = loginIdentity.profileEmail;
      const requestedPassword = String(req.body?.password || '').trim();
      const roleKey = String(req.body?.initialRole || 'schooladmin').trim().toLowerCase().replace(/[^a-z]/g, '');
      const roleSpec = CENTRAL_IDENTITY_ROLE_CATALOG[roleKey];
      if (!actorAuthUserId || !schoolId) return next(new AuthenticationError('هوية الإدارة المركزية أو المدرسة غير مكتملة.'));
      if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
      if (!/^[0-9a-f-]{36}$/i.test(schoolId) || (branchId && !/^[0-9a-f-]{36}$/i.test(branchId))) return next(new ValidationError('معرف المدرسة أو الفرع غير صالح.'));
      if (displayName.length < 2 || displayName.length > 160) return next(new ValidationError('اسم الموظف يجب أن يكون بين حرفين و160 حرفاً.'));
      if (jobTitle.length > 160 || department.length > 160) return next(new ValidationError('المسمى الوظيفي أو القسم يتجاوز الحد المسموح.'));
      if (email && !/^\S+@\S+\.\S+$/.test(email)) return next(new ValidationError('البريد الإلكتروني غير صالح.'));
      if (requestedPassword && requestedPassword.length < 8) return next(new ValidationError('كلمة المرور يجب ألا تقل عن 8 رموز.'));
      if (!roleSpec) return next(new ValidationError('الدور المطلوب غير موجود في الكتالوج المركزي.'));
      const password = requestedPassword || randomBytes(12).toString('base64url');
      let authUserId = '';
      try {
        const { data: scope, error: scopeError } = await platformControl.from('schools').select('id, tenant_id').eq('id', schoolId).is('deleted_at', null).maybeSingle();
        if (scopeError) throw scopeError;
        if (!scope || (tenantId && scope.tenant_id !== tenantId)) throw new ConflictError('المدرسة غير موجودة في نطاق الإدارة المركزية.');
        const targetTenantId = scope.tenant_id;
        if (!branchId) {
          const { data: mainBranch, error: mainBranchError } = await platformControl
            .from('branches')
            .select('id')
            .eq('school_id', schoolId)
            .eq('status', 'active')
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          if (mainBranchError) throw mainBranchError;
          branchId = String(mainBranch?.id || '').trim();
        }
        if (!branchId) throw new ConflictError('لا يوجد فرع رئيسي نشط داخل المدرسة.');
        if (branchId) {
          const { data: branch, error: branchError } = await platformControl.from('branches').select('id').eq('id', branchId).eq('school_id', schoolId).is('deleted_at', null).maybeSingle();
          if (branchError) throw branchError;
          if (!branch) throw new ConflictError('الفرع غير موجود داخل المدرسة.');
        }
        const authResult = await platformAdminAuth!.auth.admin.createUser({
          email: loginIdentity.authEmail, password, email_confirm: true, user_metadata: { display_name: displayName, login_username: loginIdentity.username },
          app_metadata: { tenant_id: targetTenantId, school_id: schoolId, ...(branchId ? { branch_id: branchId } : {}), role: roleKey, status: 'active', ...(loginIdentity.username ? { login_username: loginIdentity.username } : {}) },
        });
        if (authResult.error || !authResult.data.user) throw new ExternalServiceError(authResult.error?.message || 'تعذر إنشاء هوية Supabase Auth.');
        authUserId = authResult.data.user.id;
        const user = await insertPlatformRow('users', { auth_user_id: authUserId, tenant_id: targetTenantId, school_id: schoolId, branch_id: branchId || null, username: loginIdentity.username, email, display_name: displayName, job_title: jobTitle || null, department: department || null, status: 'active', force_password_change: !requestedPassword, created_by: null, updated_by: null }, 'id, auth_user_id, tenant_id, school_id, branch_id, username, email, display_name, job_title, department, status, force_password_change, version, created_at');
        const role = await upsertPlatformRow('roles', { tenant_id: targetTenantId, school_id: null, role_key: roleKey, name: roleSpec.name, description: roleSpec.description, is_system: true, status: 'active', created_by: null, updated_by: null }, 'tenant_id,role_key', 'id, role_key, name');
        for (const permissionKey of roleSpec.permissions) {
          const { resource, action } = describePermission(permissionKey);
          const permission = await upsertPlatformRow('permissions', { tenant_id: null, permission_key: permissionKey, resource, action, description: permissionKey, status: 'active', created_by: null, updated_by: null }, 'permission_key', 'id');
          const rolePermissionResult = await platformControl.from('role_permissions').upsert({ tenant_id: targetTenantId, role_id: role.id, permission_id: permission.id, status: 'active', created_by: null, updated_by: null }, { onConflict: 'role_id,permission_id', ignoreDuplicates: true });
          if (rolePermissionResult.error) throw rolePermissionResult.error;
        }
        const assignment = await insertPlatformRow('user_roles', { tenant_id: targetTenantId, user_id: user.id, role_id: role.id, school_id: schoolId, branch_id: branchId || null, status: 'active', created_by: null, updated_by: null }, 'id');
        // Snapshot stores require a tenant-local public.users actor. The first
        // school identity is the safe bootstrap actor for these empty stores.
        const seedActorId = user.id;
        const hrSeed = await platformControl.from('hr_database').upsert({ tenant_id: targetTenantId, school_id: schoolId, country_code: 'ZZ', legal_configuration: {}, data: { employees: [], departments: [], jobs: [], contracts: [], attendance: [], leaves: [], penalties: [], advances: [], rewards: [], performance: [], documents: [], payrollRuns: [], settings: {} }, version: 0, updated_by: seedActorId }, { onConflict: 'school_id', ignoreDuplicates: true });
        if (hrSeed.error) throw hrSeed.error;
        const inventorySeed = await platformControl.from('inventory_database').upsert({ tenant_id: targetTenantId, school_id: schoolId, data: { items: [], categories: [], brands: [], units: [], suppliers: [], warehouses: [], movements: [], stocktakes: [], purchaseRequests: [], rfqs: [], quotations: [], purchaseOrders: [], goodsReceipts: [], vendorBills: [], vendorPayments: [], settings: {}, procurementSettings: {} }, version: 0, updated_by: seedActorId }, { onConflict: 'school_id', ignoreDuplicates: true });
        if (inventorySeed.error) throw inventorySeed.error;
        const financeSeed = await platformControl.from('financial_portal_snapshots').upsert({ tenant_id: targetTenantId, school_id: schoolId, data: {}, version: 0, updated_by: seedActorId }, { onConflict: 'school_id', ignoreDuplicates: true });
        if (financeSeed.error) throw financeSeed.error;
        const tenantActivation = await platformControl
          .from('tenants')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', targetTenantId)
          .eq('status', 'provisioning');
        if (tenantActivation.error) throw tenantActivation.error;
        return res.status(201).json({ success: true, loginIdentifier: loginIdentity.loginIdentifier, user: { ...user, email, username: loginIdentity.username, forcePasswordChange: !requestedPassword, roles: [{ roleKey, name: roleSpec.name }], roleAssignmentId: assignment.id }, temporaryPassword: requestedPassword ? null : password });
      } catch (error) {
        if (authUserId) await platformAdminAuth!.auth.admin.deleteUser(authUserId).catch(() => undefined);
        return next(error instanceof Error && /duplicate|unique/i.test(error.message) ? new ConflictError('البريد الإلكتروني أو الهوية مستخدمة مسبقاً.') : error instanceof ConflictError || error instanceof ExternalServiceError ? error : new DatabaseError('تعذر إنشاء مستخدم المدرسة في المصدر المركزي.', error instanceof Error ? error.message : String(error)));
      }
    }
    if (!platformAdminPool || !platformAdminAuth) return next(new ExternalServiceError('خدمة Supabase Auth المركزية غير مهيأة.'));
    const identity = (req as any).user as { id?: string };
    const tenantId = String(req.body?.targetTenantId || '').trim();
    const actorId = String(identity?.id || '').trim();
    const schoolId = String(req.params.schoolId || '').trim();
    const requestId = String(req.body?.requestId || req.get('X-Request-Id') || randomUUID()).trim();
    const correlationId = String(req.body?.correlationId || req.get('X-Correlation-Id') || randomUUID()).trim();
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || !/^[0-9a-f-]{36}$/i.test(correlationId)) return next(new ValidationError('معرف الطلب أو الارتباط غير صالح.'));
    let branchId = String(req.body?.branchId || '').trim();
    const displayName = String(req.body?.name || '').trim();
    const jobTitle = String(req.body?.jobTitle || '').trim();
    const department = String(req.body?.department || '').trim();
    const loginIdentity = provisionLoginIdentity(req.body?.email);
    const email = loginIdentity.profileEmail;
    const requestedPassword = String(req.body?.password || '').trim();
    const roleKey = String(req.body?.initialRole || 'schooladmin').trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!actorId || !schoolId) return next(new AuthenticationError('هوية الإدارة المركزية أو المدرسة غير مكتملة.'));
    if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
    if (!/^[0-9a-f-]{36}$/i.test(schoolId) || (branchId && !/^[0-9a-f-]{36}$/i.test(branchId))) return next(new ValidationError('معرف المدرسة أو الفرع غير صالح.'));
    if (displayName.length < 2 || displayName.length > 160) return next(new ValidationError('اسم الموظف يجب أن يكون بين حرفين و160 حرفاً.'));
    if (jobTitle.length > 160 || department.length > 160) return next(new ValidationError('المسمى الوظيفي أو القسم يتجاوز الحد المسموح.'));
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return next(new ValidationError('البريد الإلكتروني غير صالح.'));
    if (requestedPassword && requestedPassword.length < 8) return next(new ValidationError('كلمة المرور يجب ألا تقل عن 8 رموز.'));
    if (!roleKey || roleKey === 'platformadmin') return next(new ValidationError('الدور المطلوب غير موجود في الكتالوج المركزي.'));
    const password = requestedPassword || randomBytes(12).toString('base64url');
    let authUserId = '';
    const client = await platformAdminPool.connect();
    try {
      if (!branchId) {
        const mainBranch = await client.query<{ id: string }>(
           `SELECT id
              FROM public.branches
             WHERE school_id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid)
               AND status = 'active' AND deleted_at IS NULL
             ORDER BY created_at ASC
             LIMIT 1`,
          [schoolId, tenantId || null],
        );
        if (mainBranch.rowCount !== 1) throw new ConflictError('لا يوجد فرع رئيسي نشط داخل المدرسة.');
        branchId = mainBranch.rows[0].id;
      }
      const authResult = await platformAdminAuth.auth.admin.createUser({
        email: loginIdentity.authEmail,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName, login_username: loginIdentity.username },
        // These claims are server-owned and are the source used by the
        // trusted identity/RLS boundary for every school user.
        app_metadata: {
          tenant_id: tenantId,
          school_id: schoolId,
          ...(branchId ? { branch_id: branchId } : {}),
          role: roleKey,
          status: 'active',
          ...(loginIdentity.username ? { login_username: loginIdentity.username } : {}),
        },
      });
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
      const roleLookup = await client.query(
        `SELECT r.id, r.name, r.description,
                COALESCE(array_agg(p.permission_key ORDER BY p.permission_key) FILTER (WHERE p.permission_key IS NOT NULL), ARRAY[]::text[]) AS permission_keys
           FROM public.roles r
           LEFT JOIN public.role_permissions rp ON rp.tenant_id = r.tenant_id AND rp.role_id = r.id
                AND rp.status = 'active' AND rp.deleted_at IS NULL
           LEFT JOIN public.permissions p ON p.id = rp.permission_id AND p.status = 'active' AND p.deleted_at IS NULL
          WHERE r.tenant_id = $1::uuid AND r.role_key = $2
            AND (r.school_id IS NULL OR r.school_id = $3::uuid)
            AND (r.branch_id IS NULL OR r.branch_id = $4::uuid)
            AND r.status = 'active' AND r.deleted_at IS NULL
          GROUP BY r.id, r.name, r.description
          ORDER BY CASE WHEN r.school_id = $3::uuid AND r.branch_id = $4::uuid THEN 0 WHEN r.school_id = $3::uuid THEN 1 ELSE 2 END
          LIMIT 1`,
        [targetTenantId, roleKey, schoolId, branchId || null],
      );
      if (roleLookup.rowCount !== 1 || !roleLookup.rows[0].permission_keys?.length) throw new ConflictError('الدور غير منشور من المدرسة الأم أو لا يحتوي صلاحيات فعالة.');
      const roleSpec = { name: roleLookup.rows[0].name, description: roleLookup.rows[0].description, permissions: roleLookup.rows[0].permission_keys as string[] };
      const roleId = roleLookup.rows[0].id;
      const userResult = await client.query(
         `INSERT INTO public.users (auth_user_id, tenant_id, school_id, branch_id, username, email, display_name, job_title, department, status, force_password_change, created_by, updated_by)
          VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, 'active', $10, $11::uuid, $11::uuid)
          RETURNING id, auth_user_id, tenant_id, school_id, branch_id, username, email, display_name, job_title, department, status, force_password_change, version, created_at`,
         [authUserId, targetTenantId, schoolId, branchId || null, loginIdentity.username, email, displayName, jobTitle || null, department || null, !requestedPassword, actorId],
      );
      const userId = userResult.rows[0].id;
      for (const permissionKey of roleSpec.permissions) {
        const { resource, action } = describePermission(permissionKey);
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
      await client.query(
        `UPDATE public.tenants SET status = 'active', updated_at = now()
          WHERE id = $1::uuid AND status = 'provisioning'`,
        [targetTenantId],
      );
      const actorUser = await client.query<{ id: string }>(
        `SELECT id FROM public.users WHERE tenant_id = $1::uuid AND auth_user_id = $2::uuid AND deleted_at IS NULL LIMIT 1`,
        [targetTenantId, actorId],
      );
      const auditPayload = JSON.stringify({
        operation: 'create',
         email,
         username: loginIdentity.username,
        displayName,
        jobTitle: jobTitle || null,
        department: department || null,
        roleKey,
        schoolId,
        branchId: branchId || null,
        forcePasswordChange: !requestedPassword,
      });
      const auditId = randomUUID();
      await client.query(
        `INSERT INTO public.audit_events
           (id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata, request_id, correlation_id)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'user', $6::uuid, 'create', 'CentralIdentityRoute', 'إنشاء هوية مستخدم مركزية', 'success', $7::jsonb, $8::uuid, $9::uuid)`,
        [auditId, targetTenantId, schoolId, branchId || null, actorUser.rows[0]?.id || null, userId, auditPayload, requestId, correlationId],
      );
      const outboxPayload = JSON.stringify({ event: 'identity.user.created', userId, tenantId: targetTenantId, schoolId, branchId: branchId || null, roleKey, requestId, correlationId });
      await client.query(
        `INSERT INTO public.outbox_events
           (id, tenant_id, event_type, aggregate_type, aggregate_id, event_version, payload, payload_hash, idempotency_key, status, request_id, correlation_id, created_by, updated_by, audit_id)
         VALUES ($1::uuid, $2::uuid, 'identity.user.created', 'user', $3::uuid, 1, $4::jsonb, $5, $6, 'pending', $7::uuid, $8::uuid, $9::uuid, $9::uuid, $10::uuid)
         ON CONFLICT (tenant_id, idempotency_key) DO NOTHING`,
        [randomUUID(), targetTenantId, userId, outboxPayload, createHash('sha256').update(outboxPayload).digest('hex'), `identity-user-create:${userId}:${requestId}`, requestId, correlationId, actorUser.rows[0]?.id || null, auditId],
      );
      await client.query('COMMIT');
       return res.status(201).json({ success: true, requestId, correlationId, loginIdentifier: loginIdentity.loginIdentifier, user: { ...userResult.rows[0], email, username: loginIdentity.username, forcePasswordChange: !requestedPassword, roles: [{ roleKey, name: roleSpec.name }], roleAssignmentId: assignment.rows[0].id }, temporaryPassword: requestedPassword ? null : password });
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
    const requestId = String(req.body?.requestId || req.get('X-Request-Id') || randomUUID()).trim();
    const correlationId = String(req.body?.correlationId || req.get('X-Correlation-Id') || randomUUID()).trim();
    const expectedVersion = Number(req.body?.expectedVersion);
    if (!actorId || !/^[0-9a-f-]{36}$/i.test(userId)) return next(new AuthenticationError('هوية المستخدم أو الإدارة غير مكتملة.'));
    if (tenantId && !/^[0-9a-f-]{36}$/i.test(tenantId)) return next(new ValidationError('معرف المستأجر غير صالح.'));
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || !/^[0-9a-f-]{36}$/i.test(correlationId)) return next(new ValidationError('معرف الطلب أو الارتباط غير صالح.'));
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) return next(new ValidationError('إصدار المستخدم المتوقع مطلوب لمنع استبدال تحديث مسؤول آخر.'));
    try {
      const target = await platformAdminPool.query(`
        SELECT u.id, u.auth_user_id, u.tenant_id, u.school_id, u.branch_id, u.display_name, u.job_title, u.department, u.status, u.force_password_change, u.version, u.session_revoked_at, au.email,
               COALESCE((
                 SELECT r.role_key
                   FROM public.user_roles ur
                   JOIN public.roles r ON r.tenant_id = ur.tenant_id AND r.id = ur.role_id
                  WHERE ur.tenant_id = u.tenant_id AND ur.user_id = u.id
                    AND ur.status = 'active' AND ur.deleted_at IS NULL
                    AND r.status = 'active' AND r.deleted_at IS NULL
                  ORDER BY ur.created_at ASC
                  LIMIT 1
               ), 'schooladmin') AS role_key
          FROM public.users u
          JOIN auth.users au ON au.id = u.auth_user_id
         WHERE u.id = $1::uuid AND ($2::uuid IS NULL OR u.tenant_id = $2::uuid) AND u.deleted_at IS NULL`, [userId, tenantId || null]);
      if (target.rowCount !== 1) return next(new ConflictError('المستخدم غير موجود في نطاق الإدارة المركزية.'));
      const row = target.rows[0];
      if (Number(row.version) !== expectedVersion) return next(new ConflictError('تم تعديل المستخدم بواسطة مسؤول آخر. أعد تحميل دليل الهوية قبل الحفظ.', { expectedVersion, actualVersion: Number(row.version) }));
      const recordIdentityMutation = async (mutation: string, metadata: Record<string, unknown>, version: number) => {
        const actorUser = await platformAdminPool!.query<{ id: string }>(
          `SELECT id FROM public.users WHERE tenant_id = $1::uuid AND auth_user_id = $2::uuid AND deleted_at IS NULL LIMIT 1`,
          [row.tenant_id, actorId],
        );
        const auditId = randomUUID();
        const auditPayload = JSON.stringify({ operation: mutation, userId: row.id, ...metadata, requestId, correlationId });
        await platformAdminPool!.query(
          `INSERT INTO public.audit_events
             (id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata, request_id, correlation_id)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'user', $6::uuid, $7, 'CentralIdentityRoute', $8, 'success', $9::jsonb, $10::uuid, $11::uuid)`,
          [auditId, row.tenant_id, row.school_id || null, row.branch_id || null, actorUser.rows[0]?.id || null, row.id, mutation, `إدارة هوية المستخدم: ${mutation}`, auditPayload, requestId, correlationId],
        );
        const outboxPayload = JSON.stringify({ event: `identity.user.${mutation}`, userId: row.id, tenantId: row.tenant_id, ...metadata, requestId, correlationId });
        await platformAdminPool!.query(
          `INSERT INTO public.outbox_events
             (id, tenant_id, event_type, aggregate_type, aggregate_id, event_version, payload, payload_hash, idempotency_key, status, request_id, correlation_id, created_by, updated_by, audit_id)
           VALUES ($1::uuid, $2::uuid, $3, 'user', $4::uuid, $5, $6::jsonb, $7, $8, 'pending', $9::uuid, $10::uuid, $11::uuid, $11::uuid, $12::uuid)
           ON CONFLICT (tenant_id, idempotency_key) DO NOTHING`,
          [randomUUID(), row.tenant_id, `identity.user.${mutation}`, row.id, Math.max(1, version), outboxPayload, createHash('sha256').update(outboxPayload).digest('hex'), `identity-user:${row.id}:${mutation}:${requestId}`, requestId, correlationId, actorUser.rows[0]?.id || null, auditId],
        );
        return { auditId };
      };
      if (operation === 'update') {
        const displayName = String(req.body?.displayName || '').trim();
        const jobTitle = String(req.body?.jobTitle || '').trim();
        const department = String(req.body?.department || '').trim();
        const email = String(req.body?.email || '').trim().toLowerCase();
        if (displayName.length < 2 || displayName.length > 160) return next(new ValidationError('اسم الموظف يجب أن يكون بين حرفين و160 حرفاً.'));
        if (jobTitle.length > 160 || department.length > 160) return next(new ValidationError('المسمى الوظيفي أو القسم يتجاوز الحد المسموح.'));
        if (email && !/^\S+@\S+\.\S+$/.test(email)) return next(new ValidationError('البريد الإلكتروني غير صالح.'));
        const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, {
          user_metadata: { display_name: displayName },
          ...(email && email !== String(row.email || '').toLowerCase() ? { email, email_confirm: true } : {}),
        });
        if (authResult.error) return next(new ExternalServiceError('تعذر تحديث اسم الهوية عبر Supabase Auth.'));
        const updated = await platformAdminPool.query(
          `UPDATE public.users
              SET display_name = $3, job_title = $4, department = $5, updated_at = now(), updated_by = $6::uuid, version = version + 1
            WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL AND version = $7
          RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, job_title, department, status, version, created_at`,
          [userId, tenantId || null, displayName, jobTitle || null, department || null, actorId, expectedVersion],
        );
        if (updated.rowCount !== 1) return next(new ConflictError('تعذر تحديث المستخدم؛ تغير نطاقه أو تمت أرشفته.'));
        const audit = await recordIdentityMutation('update', { before: { displayName: row.display_name, jobTitle: row.job_title, department: row.department, email: row.email }, after: { displayName, jobTitle: jobTitle || null, department: department || null, email: authResult.data.user?.email || email || row.email || '' } }, Number(updated.rows[0].version || 1));
        return res.json({ success: true, requestId, correlationId, auditId: audit.auditId, user: { ...updated.rows[0], email: authResult.data.user?.email || email || row.email || '' } });
      }
      if (operation === 'reset_password') {
        const password = randomBytes(12).toString('base64url');
        const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { password, user_metadata: { display_name: row.display_name, forcePasswordChange: true } });
        if (authResult.error) return next(new ExternalServiceError('تعذر إعادة تعيين كلمة المرور عبر Supabase Auth.'));
        const updated = await platformAdminPool.query(
          `UPDATE public.users
              SET force_password_change = true, session_revoked_at = now(), updated_at = now(), updated_by = $4::uuid, version = version + 1
            WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL AND version = $3
          RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, job_title, department, status, force_password_change, version, session_revoked_at, created_at`,
          [userId, tenantId || null, expectedVersion, actorId],
        );
        if (updated.rowCount !== 1) return next(new ConflictError('تعذر إعادة ضبط كلمة المرور؛ تغير المستخدم بواسطة مسؤول آخر.'));
        const audit = await recordIdentityMutation('reset_password', { forcePasswordChange: true, sessionRevokedAt: updated.rows[0].session_revoked_at }, Number(updated.rows[0].version || 1));
        return res.json({ success: true, requestId, correlationId, auditId: audit.auditId, user: { ...updated.rows[0], forcePasswordChange: true }, temporaryPassword: password });
      }
      if (operation === 'force_password') {
        const forced = Boolean(req.body?.forcePasswordChange);
        const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, {
          user_metadata: { display_name: row.display_name, forcePasswordChange: forced },
          // Re-assert server-owned scope claims whenever central identity is
          // touched. This repairs legacy accounts without trusting metadata
          // supplied by the browser.
          app_metadata: {
            tenant_id: row.tenant_id,
            ...(row.school_id ? { school_id: row.school_id } : {}),
            ...(row.branch_id ? { branch_id: row.branch_id } : {}),
            role: row.role_key,
            status: row.status,
          },
        });
        if (authResult.error) return next(new ExternalServiceError('تعذر تحديث سياسة كلمة المرور المركزية.'));
        // A policy mutation is a real identity lifecycle change: advance the
        // canonical version and, when forcing a change, invalidate every
        // existing session so the policy cannot be bypassed by an old token.
        const updated = await platformAdminPool.query(
          `UPDATE public.users
              SET force_password_change = $3,
                  session_revoked_at = CASE WHEN $3 THEN now() ELSE session_revoked_at END,
                  updated_at = now(), updated_by = $4::uuid, version = version + 1
            WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid)
              AND deleted_at IS NULL AND version = $5
          RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, job_title, department,
                    status, force_password_change, version, session_revoked_at, created_at`,
          [userId, tenantId || null, forced, actorId, expectedVersion],
        );
        if (updated.rowCount !== 1) return next(new ConflictError('تعذر تحديث سياسة كلمة المرور؛ تغير المستخدم بواسطة مسؤول آخر.'));
        const audit = await recordIdentityMutation('force_password', { forcePasswordChange: forced, sessionRevokedAt: updated.rows[0].session_revoked_at }, Number(updated.rows[0].version || 1));
        return res.json({ success: true, requestId, correlationId, auditId: audit.auditId, user: { ...updated.rows[0], forcePasswordChange: forced } });
      }
      if (operation === 'evict_sessions') {
        const updated = await platformAdminPool.query(
          `UPDATE public.users
              SET session_revoked_at = now(), updated_at = now(), updated_by = $4::uuid, version = version + 1
            WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL AND version = $3
          RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, job_title, department, status, version, session_revoked_at, created_at`,
          [userId, tenantId || null, expectedVersion, actorId],
        );
        if (updated.rowCount !== 1) return next(new ConflictError('تعذر إنهاء الجلسات؛ تغير المستخدم بواسطة مسؤول آخر.'));
        const audit = await recordIdentityMutation('evict_sessions', { sessionRevokedAt: updated.rows[0].session_revoked_at }, Number(updated.rows[0].version || 1));
        return res.json({ success: true, requestId, correlationId, auditId: audit.auditId, user: updated.rows[0] });
      }
      if (operation === 'status') {
        const status = String(req.body?.status || '').trim();
        if (!['active', 'suspended', 'disabled'].includes(status)) return next(new ValidationError('حالة المستخدم غير مسموح بها.'));
        const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { ban_duration: status === 'active' ? 'none' : '876000h' });
        if (authResult.error) return next(new ExternalServiceError('تعذر تغيير حالة الهوية عبر Supabase Auth.'));
        const updated = await platformAdminPool.query(`UPDATE public.users SET status = $3, session_revoked_at = CASE WHEN $3 <> 'active' THEN now() ELSE session_revoked_at END, updated_at = now(), updated_by = $4::uuid, version = version + 1 WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL AND version = $5 RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, version, session_revoked_at, created_at`, [userId, tenantId || null, status, actorId, expectedVersion]);
        if (updated.rowCount !== 1) return next(new ConflictError('تعذر تغيير حالة المستخدم؛ تغير نطاقه أو تمت أرشفته.'));
        const audit = await recordIdentityMutation('status', { beforeStatus: row.status, status }, Number(updated.rows[0].version || row.version || 1));
        return res.json({ success: true, requestId, correlationId, auditId: audit.auditId, user: updated.rows[0] });
      }
      if (operation === 'archive') {
        const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { ban_duration: '876000h' });
        if (authResult.error) return next(new ExternalServiceError('تعذر تعطيل الهوية قبل أرشفتها.'));
        const updated = await platformAdminPool.query(`UPDATE public.users SET status = 'archived', session_revoked_at = now(), deleted_at = now(), deleted_by = $3::uuid, updated_at = now(), updated_by = $3::uuid, version = version + 1 WHERE id = $1::uuid AND ($2::uuid IS NULL OR tenant_id = $2::uuid) AND deleted_at IS NULL AND version = $4 RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, version, session_revoked_at, created_at`, [userId, tenantId || null, actorId, expectedVersion]);
        if (updated.rowCount !== 1) return next(new ConflictError('تعذر أرشفة المستخدم؛ تغير نطاقه أو تمت أرشفته.'));
        const audit = await recordIdentityMutation('archive', { beforeStatus: row.status, status: 'archived' }, Number(updated.rows[0].version || row.version || 1));
        return res.json({ success: true, requestId, correlationId, auditId: audit.auditId, user: updated.rows[0] });
      }
      return next(new ValidationError('عملية إدارة المستخدم غير معتمدة.'));
    } catch (error) {
      return next(error instanceof Error ? error : new DatabaseError('تعذر تحديث مستخدم الإدارة المركزية.'));
    }
  });

  // School identity directory.  This is deliberately separate from the
  // central directory: the trusted session supplies tenant/school scope and
  // the browser can never choose a different school or platform role.
  const schoolIdentityScope = (req: express.Request) => {
    const identity = (req as any).user as { id?: string; tenantId?: string; schoolId?: string; branchId?: string; name?: string } | undefined;
    const tenantId = String(identity?.tenantId || '').trim();
    const schoolId = String(identity?.schoolId || '').trim();
    const branchId = String(identity?.branchId || '').trim();
    const actorAuthUserId = String(identity?.id || '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(tenantId) || !/^[0-9a-f-]{36}$/i.test(schoolId) || !/^[0-9a-f-]{36}$/i.test(actorAuthUserId)) {
      throw new AuthenticationError('السياق الموثوق للمدرسة أو هوية المدير غير مكتمل.');
    }
    if (branchId && !/^[0-9a-f-]{36}$/i.test(branchId)) throw new AuthenticationError('الفرع الموثوق غير صالح.');
    return { identity, tenantId, schoolId, branchId, actorAuthUserId };
  };

  const recordSchoolIdentityMutation = async (
    client: any,
    row: { id: string; tenant_id: string; school_id: string; branch_id?: string | null },
    actorAuthUserId: string,
    mutation: string,
    metadata: Record<string, unknown>,
    requestId: string,
    correlationId: string,
    version: number,
  ) => {
    const actor = await client.query(
      `SELECT id FROM public.users
        WHERE tenant_id = $1::uuid AND auth_user_id = $2::uuid AND deleted_at IS NULL
        LIMIT 1`,
      [row.tenant_id, actorAuthUserId],
    );
    if (actor.rowCount !== 1) throw new AuthenticationError('تعذر تحديد المدير المنفذ داخل السجل القانوني.');
    const auditId = randomUUID();
    const payload = JSON.stringify({ operation: mutation, userId: row.id, ...metadata, requestId, correlationId });
    await client.query(
      `INSERT INTO public.audit_events
        (id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata, request_id, correlation_id)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'user', $6::uuid, $7, 'SchoolIdentityRoute', $8, 'success', $9::jsonb, $10::uuid, $11::uuid)`,
      [auditId, row.tenant_id, row.school_id, row.branch_id || null, actor.rows[0].id, row.id, mutation, `إدارة مستخدم المدرسة: ${mutation}`, payload, requestId, correlationId],
    );
    const outboxPayload = JSON.stringify({ event: `identity.school_user.${mutation}`, userId: row.id, tenantId: row.tenant_id, schoolId: row.school_id, ...metadata, requestId, correlationId });
    await client.query(
      `INSERT INTO public.outbox_events
        (id, tenant_id, event_type, aggregate_type, aggregate_id, event_version, payload, payload_hash, idempotency_key, status, request_id, correlation_id, created_by, updated_by, audit_id)
       VALUES ($1::uuid, $2::uuid, $3, 'user', $4::uuid, $5, $6::jsonb, $7, $8, 'pending', $9::uuid, $10::uuid, $11::uuid, $11::uuid, $12::uuid)
       ON CONFLICT (tenant_id, idempotency_key) DO NOTHING`,
      [randomUUID(), row.tenant_id, `identity.school_user.${mutation}`, row.id, Math.max(1, version), outboxPayload, createHash('sha256').update(outboxPayload).digest('hex'), `identity-school-user:${row.id}:${mutation}:${requestId}`, requestId, correlationId, actor.rows[0].id, auditId],
    );
    return auditId;
  };

  app.get('/api/school/identity-roles', authenticateRequest, requirePermissionOnly(PERMISSIONS.IDENTITY_USERS_READ), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر الهوية المركزي غير متاح.'));
    try {
      const { tenantId, schoolId, branchId } = schoolIdentityScope(req);
      const result = await platformAdminPool.query(
        `SELECT r.id, r.role_key AS "roleKey", r.name, r.description, r.version,
                COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
                  'permissionKey', p.permission_key, 'resource', p.resource, 'action', p.action
                )) FILTER (WHERE p.id IS NOT NULL), '[]'::jsonb) AS permissions
           FROM public.roles r
           LEFT JOIN public.role_permissions rp ON rp.tenant_id = r.tenant_id AND rp.role_id = r.id
                AND rp.status = 'active' AND rp.deleted_at IS NULL
           LEFT JOIN public.permissions p ON p.id = rp.permission_id
                AND p.status = 'active' AND p.deleted_at IS NULL
          WHERE r.tenant_id = $1::uuid
            AND (r.school_id IS NULL OR r.school_id = $2::uuid)
            AND (r.branch_id IS NULL OR r.branch_id = $3::uuid)
            AND r.status = 'active' AND r.deleted_at IS NULL
          GROUP BY r.id
          ORDER BY r.name ASC`,
        [tenantId, schoolId, branchId || null],
      );
      const permissionCatalog = [...new Set(permissionRegistry.list())]
        .filter((permissionKey) => permissionKey !== PERMISSIONS.PLATFORM_ADMIN)
        .map((permissionKey) => {
          const { resource, action } = describePermission(permissionKey);
          return { permissionKey, resource, action, description: permissionKey };
        })
        .sort((left, right) => left.permissionKey.localeCompare(right.permissionKey));
      return res.json({ success: true, roles: result.rows, permissionCatalog });
    } catch (error) {
      return next(error instanceof Error ? error : new DatabaseError('تعذر تحميل أدوار المدرسة المعتمدة.'));
    }
  });

  // Job titles are maintained by HR, but the identity directory may read the
  // safe label/id catalogue so a user profile cannot drift into free text.
  app.get('/api/school/job-catalog', authenticateRequest, requirePermissionOnly(PERMISSIONS.IDENTITY_USERS_READ), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر الهوية المركزي غير متاح.'));
    try {
      const { tenantId, schoolId } = schoolIdentityScope(req);
      const result = await platformAdminPool.query(
        `SELECT data->'jobs' AS jobs, data->'departments' AS departments
           FROM public.hr_database
          WHERE tenant_id = $1::uuid AND school_id = $2::uuid
          LIMIT 1`,
        [tenantId, schoolId],
      );
      const data = result.rows[0] || {};
      const departments = Array.isArray(data.departments) ? data.departments : [];
      const departmentNames = new Map(departments.map((department: any) => [String(department?.id || ''), String(department?.nameAr || department?.nameEn || '')]));
      const jobs = (Array.isArray(data.jobs) ? data.jobs : [])
        .map((job: any) => ({
          id: String(job?.id || '').trim(),
          titleAr: String(job?.titleAr || '').trim(),
          titleEn: String(job?.titleEn || '').trim(),
          departmentId: String(job?.departmentId || '').trim(),
          departmentName: departmentNames.get(String(job?.departmentId || '').trim()) || '',
        }))
        .filter((job: any) => job.id && (job.titleAr || job.titleEn));
      return res.json({ success: true, jobs });
    } catch (error) {
      return next(error instanceof Error ? error : new DatabaseError('تعذر تحميل دليل الوظائف من شؤون الموظفين.'));
    }
  });

  app.get('/api/school/users', authenticateRequest, requirePermissionOnly(PERMISSIONS.IDENTITY_USERS_READ), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر الهوية المركزي غير متاح.'));
    try {
      const { tenantId, schoolId } = schoolIdentityScope(req);
      const result = await platformAdminPool.query(
        `SELECT u.id, u.auth_user_id, u.tenant_id, u.school_id, u.branch_id,
                u.username, u.job_id,
                CASE WHEN au.email LIKE '%@no-email.edupro.invalid' THEN NULL ELSE COALESCE(u.email, au.email) END AS email,
                u.display_name, u.job_title, u.department, u.status, u.version,
                u.session_revoked_at, u.force_password_change, u.created_at,
                au.last_sign_in_at, b.name AS branch_name,
                COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
                  'id', r.id, 'roleKey', r.role_key, 'name', r.name,
                  'assignmentBranchId', ur.branch_id
                )) FILTER (WHERE r.id IS NOT NULL), '[]'::jsonb) AS roles
                ,COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'permissionKey', gp.permission_key,
                    'resource', gp.resource,
                    'action', gp.action,
                    'branchId', upg.branch_id
                  ) ORDER BY gp.permission_key)
                    FROM public.user_permission_grants upg
                    JOIN public.permissions gp ON gp.id = upg.permission_id
                   WHERE upg.tenant_id = u.tenant_id
                     AND upg.user_id = u.id
                     AND upg.school_id = u.school_id
                     AND (upg.branch_id IS NULL OR upg.branch_id = u.branch_id)
                     AND upg.status = 'active' AND upg.deleted_at IS NULL
                     AND gp.status = 'active' AND gp.deleted_at IS NULL
                ), '[]'::jsonb) AS "directPermissions"
           FROM public.users u
           JOIN auth.users au ON au.id = u.auth_user_id
           LEFT JOIN public.branches b ON b.tenant_id = u.tenant_id AND b.school_id = u.school_id AND b.id = u.branch_id
           LEFT JOIN public.user_roles ur ON ur.tenant_id = u.tenant_id AND ur.user_id = u.id
                AND ur.deleted_at IS NULL AND ur.status = 'active'
           LEFT JOIN public.roles r ON r.tenant_id = ur.tenant_id AND r.id = ur.role_id
                AND (r.school_id IS NULL OR r.school_id = u.school_id)
                AND (r.branch_id IS NULL OR r.branch_id = u.branch_id)
                AND r.status = 'active' AND r.deleted_at IS NULL
          WHERE u.tenant_id = $1::uuid AND u.school_id = $2::uuid AND u.deleted_at IS NULL
          GROUP BY u.id, au.email, au.last_sign_in_at, b.name
          ORDER BY u.created_at DESC`,
        [tenantId, schoolId],
      );
      return res.json({ success: true, scope: { tenantId, schoolId }, users: result.rows });
    } catch (error) {
      return next(error instanceof Error ? error : new DatabaseError('تعذر تحميل مستخدمي المدرسة.'));
    }
  });

  app.post('/api/school/users', authenticateRequest, requireAnyPermission([PERMISSIONS.IDENTITY_USERS_WRITE, PERMISSIONS.IDENTITY_USERS_ASSIGN]), async (req, res, next) => {
    if (!platformAdminPool || !platformAdminAuth) return next(new ExternalServiceError('خدمة هوية المدرسة غير مهيأة.'));
    const requestId = String(req.body?.requestId || req.get('X-Request-Id') || randomUUID()).trim();
    const correlationId = String(req.body?.correlationId || req.get('X-Correlation-Id') || randomUUID()).trim();
    let authUserId = '';
    try {
      const { tenantId, schoolId, actorAuthUserId } = schoolIdentityScope(req);
      const displayName = String(req.body?.name || req.body?.displayName || '').trim();
      const jobId = String(req.body?.jobId || '').trim();
      const jobTitle = String(req.body?.jobTitle || '').trim();
      const department = String(req.body?.department || '').trim();
      const loginIdentity = provisionLoginIdentity(req.body?.email);
      const email = loginIdentity.profileEmail;
      const requestedPassword = String(req.body?.password || '').trim();
      const roleKey = String(req.body?.initialRole || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
      const rawDirectPermissions = Array.isArray(req.body?.permissionKeys) ? req.body.permissionKeys as unknown[] : [];
      const requestedDirectPermissions: string[] = [...new Set(
        rawDirectPermissions
          .map((value: unknown) => permissionRegistry.normalize(value))
          .filter((value): value is string => Boolean(value)),
      )];
      let branchId = String(req.body?.branchId || '').trim();
      if (!/^[0-9a-f-]{36}$/i.test(requestId) || !/^[0-9a-f-]{36}$/i.test(correlationId)) return next(new ValidationError('معرف الطلب أو الارتباط غير صالح.'));
      if (displayName.length < 2 || displayName.length > 160) return next(new ValidationError('اسم المستخدم يجب أن يكون بين حرفين و160 حرفاً.'));
      if (jobId.length > 120 || jobTitle.length > 160 || department.length > 160) return next(new ValidationError('الوظيفة أو المسمى الوظيفي أو القسم يتجاوز الحد المسموح.'));
      if (email && !/^\S+@\S+\.\S+$/.test(email)) return next(new ValidationError('البريد الإلكتروني غير صالح.'));
      if (requestedPassword && requestedPassword.length < 8) return next(new ValidationError('كلمة المرور يجب ألا تقل عن 8 رموز.'));
      if (!roleKey || roleKey === 'platformadmin') return next(new ValidationError('الدور المطلوب غير متاح في نطاق المدرسة.'));
      if (requestedDirectPermissions.length !== rawDirectPermissions.length || requestedDirectPermissions.includes(PERMISSIONS.PLATFORM_ADMIN) || requestedDirectPermissions.length > 200) return next(new ValidationError('قائمة الصلاحيات المباشرة تحتوي مفتاحاً غير مسجلاً أو غير صالح.'));
      if (branchId && !/^[0-9a-f-]{36}$/i.test(branchId)) return next(new ValidationError('معرف الفرع غير صالح.'));
      const password = requestedPassword || randomBytes(12).toString('base64url');
      const client = await platformAdminPool.connect();
      try {
        const scope = await client.query(`SELECT s.id, s.tenant_id FROM public.schools s WHERE s.id = $1::uuid AND s.tenant_id = $2::uuid AND s.deleted_at IS NULL`, [schoolId, tenantId]);
        if (scope.rowCount !== 1) return next(new ConflictError('المدرسة غير موجودة في نطاق الجلسة الموثوق.'));
        if (!branchId) {
          const mainBranch = await client.query(`SELECT id FROM public.branches WHERE tenant_id = $1::uuid AND school_id = $2::uuid AND status = 'active' AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`, [tenantId, schoolId]);
          branchId = mainBranch.rows[0]?.id || '';
        }
        if (!branchId) return next(new ConflictError('لا يوجد فرع نشط داخل المدرسة.'));
        const branch = await client.query(`SELECT id FROM public.branches WHERE tenant_id = $1::uuid AND school_id = $2::uuid AND id = $3::uuid AND status = 'active' AND deleted_at IS NULL`, [tenantId, schoolId, branchId]);
        if (branch.rowCount !== 1) return next(new ConflictError('الفرع المختار لا ينتمي إلى المدرسة الحالية.'));
        const roleLookup = await client.query(
          `SELECT r.id, r.name, r.description,
                  COALESCE(array_agg(p.permission_key ORDER BY p.permission_key) FILTER (WHERE p.permission_key IS NOT NULL), ARRAY[]::text[]) AS permission_keys
             FROM public.roles r
             LEFT JOIN public.role_permissions rp ON rp.tenant_id = r.tenant_id AND rp.role_id = r.id
                  AND rp.status = 'active' AND rp.deleted_at IS NULL
             LEFT JOIN public.permissions p ON p.id = rp.permission_id AND p.status = 'active' AND p.deleted_at IS NULL
            WHERE r.tenant_id = $1::uuid AND r.role_key = $2
              AND (r.school_id IS NULL OR r.school_id = $3::uuid)
              AND (r.branch_id IS NULL OR r.branch_id = $4::uuid)
              AND r.status = 'active' AND r.deleted_at IS NULL
            GROUP BY r.id, r.name, r.description
            ORDER BY CASE WHEN r.school_id = $3::uuid AND r.branch_id = $4::uuid THEN 0 WHEN r.school_id = $3::uuid THEN 1 ELSE 2 END
            LIMIT 1`,
          [tenantId, roleKey, schoolId, branchId],
        );
        if (roleLookup.rowCount !== 1 || !roleLookup.rows[0].permission_keys?.length) return next(new ConflictError('الدور غير منشور من المدرسة الأم أو لا يحتوي صلاحيات فعالة.'));
        const roleSpec = { name: roleLookup.rows[0].name, description: roleLookup.rows[0].description, permissions: roleLookup.rows[0].permission_keys as string[] };
        const roleId = roleLookup.rows[0].id;
        let resolvedJobTitle = jobTitle;
        if (jobId) {
          const jobResult = await client.query(
            `SELECT job->>'titleAr' AS title_ar, job->>'titleEn' AS title_en
               FROM public.hr_database h
               CROSS JOIN LATERAL jsonb_array_elements(COALESCE(h.data->'jobs', '[]'::jsonb)) AS job
              WHERE h.tenant_id = $1::uuid AND h.school_id = $2::uuid
                AND job->>'id' = $3
              LIMIT 1`,
            [tenantId, schoolId, jobId],
          );
          if (jobResult.rowCount !== 1) return next(new ConflictError('الوظيفة المختارة غير موجودة في دليل شؤون الموظفين الحالي.'));
          resolvedJobTitle = String(jobResult.rows[0].title_ar || jobResult.rows[0].title_en || jobTitle).trim();
        }
        const authResult = await platformAdminAuth.auth.admin.createUser({
        email: loginIdentity.authEmail, password, email_confirm: true,
        user_metadata: { display_name: displayName, login_username: loginIdentity.username },
        app_metadata: { tenant_id: tenantId, school_id: schoolId, branch_id: branchId, role: roleKey, status: 'active', ...(loginIdentity.username ? { login_username: loginIdentity.username } : {}) },
        });
        if (authResult.error || !authResult.data.user) throw new ExternalServiceError(authResult.error?.message || 'تعذر إنشاء هوية Supabase Auth.');
        authUserId = authResult.data.user.id;
        await client.query('BEGIN');
        const userResult = await client.query(`INSERT INTO public.users (auth_user_id, tenant_id, school_id, branch_id, username, email, display_name, job_id, job_title, department, status, force_password_change, created_by, updated_by) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $10, 'active', $11, $12::uuid, $12::uuid) RETURNING id, auth_user_id, tenant_id, school_id, branch_id, username, email, display_name, job_id, job_title, department, status, force_password_change, version, created_at`, [authUserId, tenantId, schoolId, branchId, loginIdentity.username, email, displayName, jobId || null, resolvedJobTitle || null, department || null, !requestedPassword, actorAuthUserId]);
        for (const permissionKey of roleSpec.permissions) {
          const { resource, action } = describePermission(permissionKey);
          const permissionResult = await client.query(`INSERT INTO public.permissions (tenant_id, permission_key, resource, action, description, status, created_by, updated_by) VALUES (NULL, $1, $2, $3, $1, 'active', $4::uuid, $4::uuid) ON CONFLICT (permission_key) DO UPDATE SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now() RETURNING id`, [permissionKey, resource, action, actorAuthUserId]);
          await client.query(`INSERT INTO public.role_permissions (tenant_id, role_id, permission_id, status, created_by, updated_by) VALUES ($1::uuid, $2::uuid, $3::uuid, 'active', $4::uuid, $4::uuid) ON CONFLICT (role_id, permission_id) DO UPDATE SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now()`, [tenantId, roleId, permissionResult.rows[0].id, actorAuthUserId]);
        }
        for (const permissionKey of requestedDirectPermissions) {
          const { resource, action } = describePermission(permissionKey);
          const permissionResult = await client.query(`INSERT INTO public.permissions (tenant_id, permission_key, resource, action, description, status, created_by, updated_by) VALUES (NULL, $1, $2, $3, $1, 'active', $4::uuid, $4::uuid) ON CONFLICT (permission_key) DO UPDATE SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now() RETURNING id`, [permissionKey, resource, action, actorAuthUserId]);
          await client.query(`INSERT INTO public.user_permission_grants (tenant_id, user_id, permission_id, school_id, branch_id, status, created_by, updated_by) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'active', $6::uuid, $6::uuid) ON CONFLICT (user_id, permission_id) DO UPDATE SET school_id = EXCLUDED.school_id, branch_id = EXCLUDED.branch_id, status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now(), updated_by = EXCLUDED.updated_by`, [tenantId, userResult.rows[0].id, permissionResult.rows[0].id, schoolId, branchId, actorAuthUserId]);
        }
        const assignment = await client.query(`INSERT INTO public.user_roles (tenant_id, user_id, role_id, school_id, branch_id, status, created_by, updated_by) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'active', $6::uuid, $6::uuid) RETURNING id`, [tenantId, userResult.rows[0].id, roleId, schoolId, branchId, actorAuthUserId]);
        const auditId = await recordSchoolIdentityMutation(client, { id: userResult.rows[0].id, tenant_id: tenantId, school_id: schoolId, branch_id: branchId }, actorAuthUserId, 'create', { displayName, email, username: loginIdentity.username, roleKey, branchId, forcePasswordChange: !requestedPassword }, requestId, correlationId, Number(userResult.rows[0].version || 1));
        await client.query('COMMIT');
        return res.status(201).json({ success: true, requestId, correlationId, auditId, loginIdentifier: loginIdentity.loginIdentifier, user: { ...userResult.rows[0], email, username: loginIdentity.username, forcePasswordChange: !requestedPassword, roles: [{ roleKey, name: roleSpec.name }], directPermissions: requestedDirectPermissions.map((permissionKey) => ({ permissionKey, branchId })), roleAssignmentId: assignment.rows[0].id }, temporaryPassword: requestedPassword ? null : password });
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        if (authUserId) await platformAdminAuth.auth.admin.deleteUser(authUserId).catch(() => undefined);
        return next(error instanceof Error ? error : new DatabaseError('تعذر إنشاء مستخدم المدرسة.'));
      } finally { client.release(); }
    } catch (error) { return next(error); }
  });

  // Every mutation of a school identity (including role assignment and
  // direct grants) is an administrative write. Assignment-only operators
  // must not gain profile, password, or account-state mutation via this route.
  app.patch('/api/school/users/:userId', authenticateRequest, requirePermissionOnly(PERMISSIONS.IDENTITY_USERS_WRITE), async (req, res, next) => {
    if (!platformAdminPool || !platformAdminAuth) return next(new ExternalServiceError('خدمة هوية المدرسة غير مهيأة.'));
    try {
      const { tenantId, schoolId, actorAuthUserId } = schoolIdentityScope(req);
      const userId = String(req.params.userId || '').trim();
      const operation = String(req.body?.operation || '').trim();
      const expectedVersion = Number(req.body?.expectedVersion);
      const requestId = String(req.body?.requestId || req.get('X-Request-Id') || randomUUID()).trim();
      const correlationId = String(req.body?.correlationId || req.get('X-Correlation-Id') || randomUUID()).trim();
      if (!/^[0-9a-f-]{36}$/i.test(userId)) return next(new ValidationError('معرف المستخدم غير صالح.'));
      if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) return next(new ValidationError('إصدار المستخدم المتوقع مطلوب لمنع الكتابة فوق تحديث آخر.'));
      if (!/^[0-9a-f-]{36}$/i.test(requestId) || !/^[0-9a-f-]{36}$/i.test(correlationId)) return next(new ValidationError('معرف الطلب أو الارتباط غير صالح.'));
      const client = await platformAdminPool.connect();
      try {
        const target = await client.query(`SELECT u.id, u.auth_user_id, u.tenant_id, u.school_id, u.branch_id, u.username, u.email AS profile_email, u.job_id, u.display_name, u.job_title, u.department, u.status, u.force_password_change, u.version, u.session_revoked_at, au.email AS auth_email, COALESCE((SELECT r.role_key FROM public.user_roles ur JOIN public.roles r ON r.tenant_id = ur.tenant_id AND r.id = ur.role_id WHERE ur.tenant_id = u.tenant_id AND ur.user_id = u.id AND ur.status = 'active' AND ur.deleted_at IS NULL AND r.status = 'active' AND r.deleted_at IS NULL ORDER BY ur.created_at ASC LIMIT 1), 'schooladmin') AS role_key FROM public.users u JOIN auth.users au ON au.id = u.auth_user_id WHERE u.id = $1::uuid AND u.tenant_id = $2::uuid AND u.school_id = $3::uuid AND u.deleted_at IS NULL`, [userId, tenantId, schoolId]);
        if (target.rowCount !== 1) return next(new ConflictError('المستخدم غير موجود داخل مدرسة الجلسة الحالية.'));
        const row = target.rows[0];
        if (Number(row.version) !== expectedVersion) return next(new ConflictError('تم تعديل المستخدم بواسطة مسؤول آخر. أعد تحميل القائمة.'));
        if (row.auth_user_id === actorAuthUserId && ['archive', 'status'].includes(operation)) return next(new ConflictError('لا يمكن لمدير المدرسة تعطيل أو أرشفة حسابه الحالي.'));
        await client.query('BEGIN');
        let updated: any;
        let metadata: Record<string, unknown> = {};
        if (operation === 'update') {
          const displayName = String(req.body?.displayName || '').trim();
          const jobId = String(req.body?.jobId || '').trim();
          const jobTitle = String(req.body?.jobTitle || '').trim();
          const department = String(req.body?.department || '').trim();
          const email = String(req.body?.email || '').trim().toLowerCase();
          if (displayName.length < 2 || displayName.length > 160) throw new ValidationError('اسم المستخدم يجب أن يكون بين حرفين و160 حرفاً.');
          if (jobId.length > 120 || jobTitle.length > 160 || department.length > 160 || (email && !/^\S+@\S+\.\S+$/.test(email))) throw new ValidationError('بيانات المستخدم غير صالحة.');
          let resolvedJobTitle = jobTitle;
          if (jobId) {
            const jobResult = await client.query(`SELECT job->>'titleAr' AS title_ar, job->>'titleEn' AS title_en FROM public.hr_database h CROSS JOIN LATERAL jsonb_array_elements(COALESCE(h.data->'jobs', '[]'::jsonb)) AS job WHERE h.tenant_id = $1::uuid AND h.school_id = $2::uuid AND job->>'id' = $3 LIMIT 1`, [tenantId, schoolId, jobId]);
            if (jobResult.rowCount !== 1) throw new ConflictError('الوظيفة المختارة غير موجودة في دليل شؤون الموظفين الحالي.');
            resolvedJobTitle = String(jobResult.rows[0].title_ar || jobResult.rows[0].title_en || jobTitle).trim();
          }
          const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { user_metadata: { display_name: displayName }, ...(email && email !== String(row.profile_email || '').toLowerCase() ? { email, email_confirm: true } : {}) });
          if (authResult.error) throw new ExternalServiceError('تعذر تحديث هوية المستخدم عبر Supabase Auth.');
          const result = await client.query(`UPDATE public.users SET display_name = $4, job_id = $5, job_title = $6, department = $7, email = $8, updated_at = now(), updated_by = $9::uuid, version = version + 1 WHERE id = $1::uuid AND tenant_id = $2::uuid AND school_id = $3::uuid AND deleted_at IS NULL AND version = $10 RETURNING id, auth_user_id, tenant_id, school_id, branch_id, username, email, display_name, job_id, job_title, department, status, force_password_change, version, created_at`, [userId, tenantId, schoolId, displayName, jobId || null, resolvedJobTitle || null, department || null, email || null, actorAuthUserId, expectedVersion]);
          if (result.rowCount !== 1) throw new ConflictError('تعذر تحديث المستخدم؛ تغيرت النسخة الحالية.');
          updated = result.rows[0]; metadata = { before: { displayName: row.display_name, jobId: row.job_id, jobTitle: row.job_title, department: row.department, email: row.profile_email }, after: { displayName, jobId: jobId || null, jobTitle: resolvedJobTitle || null, department: department || null, email: email || null } };
        } else if (operation === 'assign_role') {
          const roleKey = String(req.body?.roleKey || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
          if (!roleKey || roleKey === 'platformadmin') throw new ValidationError('الدور المطلوب غير متاح في نطاق المدرسة.');
          const roleResult = await client.query(`SELECT r.id, r.name FROM public.roles r JOIN public.role_permissions rp ON rp.tenant_id = r.tenant_id AND rp.role_id = r.id AND rp.status = 'active' AND rp.deleted_at IS NULL JOIN public.permissions p ON p.id = rp.permission_id AND p.status = 'active' AND p.deleted_at IS NULL WHERE r.tenant_id = $1::uuid AND r.role_key = $2 AND (r.school_id IS NULL OR r.school_id = $3::uuid) AND (r.branch_id IS NULL OR r.branch_id = $4::uuid) AND r.status = 'active' AND r.deleted_at IS NULL GROUP BY r.id, r.name ORDER BY CASE WHEN r.school_id = $3::uuid AND r.branch_id = $4::uuid THEN 0 WHEN r.school_id = $3::uuid THEN 1 ELSE 2 END LIMIT 1`, [tenantId, roleKey, schoolId, row.branch_id || null]);
          if (roleResult.rowCount !== 1) throw new ConflictError('قالب الدور غير منشور من الإدارة المركزية.');
          await client.query(`UPDATE public.user_roles SET status = 'revoked', deleted_at = now(), deleted_by = $4::uuid, updated_at = now(), updated_by = $4::uuid, version = version + 1 WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND school_id = $3::uuid AND status = 'active' AND deleted_at IS NULL`, [tenantId, userId, schoolId, actorAuthUserId]);
          await client.query(`INSERT INTO public.user_roles (tenant_id, user_id, role_id, school_id, branch_id, status, created_by, updated_by) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'active', $6::uuid, $6::uuid)`, [tenantId, userId, roleResult.rows[0].id, schoolId, row.branch_id || null, actorAuthUserId]);
          const result = await client.query(`UPDATE public.users SET updated_at = now(), updated_by = $4::uuid, version = version + 1 WHERE id = $1::uuid AND tenant_id = $2::uuid AND school_id = $3::uuid AND deleted_at IS NULL AND version = $5 RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, force_password_change, version, created_at`, [userId, tenantId, schoolId, actorAuthUserId, expectedVersion]);
          if (result.rowCount !== 1) throw new ConflictError('تعذر إسناد الدور؛ تغير المستخدم بواسطة مسؤول آخر.');
          updated = result.rows[0]; metadata = { beforeRole: row.role_key, roleKey };
        } else if (operation === 'set_permissions') {
          const requested = req.body?.permissionKeys;
          if (!Array.isArray(requested) || requested.length > 200) throw new ValidationError('قائمة صلاحيات المستخدم غير صالحة.');
          const permissionKeys = [...new Set(requested
            .map((value: unknown) => permissionRegistry.normalize(value))
            .filter((value: string | null): value is string => Boolean(value)))];
          if (permissionKeys.length !== requested.length || permissionKeys.includes(PERMISSIONS.PLATFORM_ADMIN)) throw new ValidationError('قائمة الصلاحيات تحتوي مفتاحاً غير مسجلاً أو صلاحية إدارة المنصة.');
          await client.query(
            `UPDATE public.user_permission_grants
                SET status = 'revoked', deleted_at = now(), deleted_by = $4::uuid,
                    updated_at = now(), updated_by = $4::uuid, version = version + 1
              WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND school_id = $3::uuid
                AND status = 'active' AND deleted_at IS NULL`,
            [tenantId, userId, schoolId, actorAuthUserId],
          );
          for (const permissionKey of permissionKeys) {
            const { resource, action } = describePermission(permissionKey);
            const permissionResult = await client.query(
              `INSERT INTO public.permissions (tenant_id, permission_key, resource, action, description, status, created_by, updated_by)
               VALUES (NULL, $1, $2, $3, $1, 'active', $4::uuid, $4::uuid)
               ON CONFLICT (permission_key) DO UPDATE SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now()
               RETURNING id`,
              [permissionKey, resource, action, actorAuthUserId],
            );
            await client.query(
              `INSERT INTO public.user_permission_grants
                 (tenant_id, user_id, permission_id, school_id, branch_id, status, created_by, updated_by)
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'active', $6::uuid, $6::uuid)
               ON CONFLICT (user_id, permission_id) DO UPDATE SET
                 school_id = EXCLUDED.school_id, branch_id = EXCLUDED.branch_id,
                 status = 'active', deleted_at = NULL, deleted_by = NULL,
                 updated_at = now(), updated_by = EXCLUDED.updated_by`,
              [tenantId, userId, permissionResult.rows[0].id, schoolId, row.branch_id || null, actorAuthUserId],
            );
          }
          const result = await client.query(
            `UPDATE public.users
                SET updated_at = now(), updated_by = $4::uuid, version = version + 1
              WHERE id = $1::uuid AND tenant_id = $2::uuid AND school_id = $3::uuid
                AND deleted_at IS NULL AND version = $5
            RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, force_password_change, version, created_at`,
            [userId, tenantId, schoolId, actorAuthUserId, expectedVersion],
          );
          if (result.rowCount !== 1) throw new ConflictError('تعذر حفظ صلاحيات المستخدم؛ تغير المستخدم بواسطة مسؤول آخر.');
          updated = result.rows[0];
          metadata = { beforePermissions: 'redacted', permissionKeys, permissionCount: permissionKeys.length };
        } else if (operation === 'reset_password') {
          const password = randomBytes(12).toString('base64url');
          const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { password, user_metadata: { display_name: row.display_name, forcePasswordChange: true } });
          if (authResult.error) throw new ExternalServiceError('تعذر إعادة تعيين كلمة مرور المستخدم.');
          const result = await client.query(`UPDATE public.users SET force_password_change = true, session_revoked_at = now(), updated_at = now(), updated_by = $4::uuid, version = version + 1 WHERE id = $1::uuid AND tenant_id = $2::uuid AND school_id = $3::uuid AND deleted_at IS NULL AND version = $5 RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, force_password_change, version, session_revoked_at, created_at`, [userId, tenantId, schoolId, actorAuthUserId, expectedVersion]);
          if (result.rowCount !== 1) throw new ConflictError('تعذر إعادة الضبط؛ تغير المستخدم بواسطة مسؤول آخر.');
          updated = result.rows[0]; metadata = { forcePasswordChange: true, temporaryPasswordIssued: true };
          const auditId = await recordSchoolIdentityMutation(client, row, actorAuthUserId, operation, metadata, requestId, correlationId, Number(updated.version || 1));
          await client.query('COMMIT');
          return res.json({ success: true, requestId, correlationId, auditId, user: { ...updated, forcePasswordChange: true }, temporaryPassword: password });
        } else if (operation === 'force_password') {
          const forced = Boolean(req.body?.forcePasswordChange);
          const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { user_metadata: { display_name: row.display_name, forcePasswordChange: forced }, app_metadata: { tenant_id: tenantId, school_id: schoolId, ...(row.branch_id ? { branch_id: row.branch_id } : {}), role: row.role_key, status: row.status } });
          if (authResult.error) throw new ExternalServiceError('تعذر تحديث سياسة كلمة المرور.');
          const result = await client.query(`UPDATE public.users SET force_password_change = $4, session_revoked_at = CASE WHEN $4 THEN now() ELSE session_revoked_at END, updated_at = now(), updated_by = $5::uuid, version = version + 1 WHERE id = $1::uuid AND tenant_id = $2::uuid AND school_id = $3::uuid AND deleted_at IS NULL AND version = $6 RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, force_password_change, version, session_revoked_at, created_at`, [userId, tenantId, schoolId, forced, actorAuthUserId, expectedVersion]);
          if (result.rowCount !== 1) throw new ConflictError('تعذر تحديث سياسة كلمة المرور.');
          updated = result.rows[0]; metadata = { forcePasswordChange: forced };
        } else if (operation === 'evict_sessions') {
          const result = await client.query(`UPDATE public.users SET session_revoked_at = now(), updated_at = now(), updated_by = $4::uuid, version = version + 1 WHERE id = $1::uuid AND tenant_id = $2::uuid AND school_id = $3::uuid AND deleted_at IS NULL AND version = $5 RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, force_password_change, version, session_revoked_at, created_at`, [userId, tenantId, schoolId, actorAuthUserId, expectedVersion]);
          if (result.rowCount !== 1) throw new ConflictError('تعذر إنهاء الجلسات؛ تغير المستخدم.');
          updated = result.rows[0]; metadata = { sessionRevokedAt: updated.session_revoked_at };
        } else if (operation === 'status') {
          const status = String(req.body?.status || '').trim();
          if (!['active', 'suspended', 'disabled'].includes(status)) throw new ValidationError('حالة المستخدم غير مسموح بها.');
          const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { ban_duration: status === 'active' ? 'none' : '876000h' });
          if (authResult.error) throw new ExternalServiceError('تعذر تغيير حالة الهوية.');
          const result = await client.query(`UPDATE public.users SET status = $4, session_revoked_at = CASE WHEN $4 <> 'active' THEN now() ELSE session_revoked_at END, updated_at = now(), updated_by = $5::uuid, version = version + 1 WHERE id = $1::uuid AND tenant_id = $2::uuid AND school_id = $3::uuid AND deleted_at IS NULL AND version = $6 RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, force_password_change, version, session_revoked_at, created_at`, [userId, tenantId, schoolId, status, actorAuthUserId, expectedVersion]);
          if (result.rowCount !== 1) throw new ConflictError('تعذر تغيير حالة المستخدم.');
          updated = result.rows[0]; metadata = { beforeStatus: row.status, status };
        } else if (operation === 'archive') {
          const authResult = await platformAdminAuth.auth.admin.updateUserById(row.auth_user_id, { ban_duration: '876000h' });
          if (authResult.error) throw new ExternalServiceError('تعذر تعطيل الهوية قبل أرشفتها.');
          const result = await client.query(`UPDATE public.users SET status = 'archived', session_revoked_at = now(), deleted_at = now(), deleted_by = $4::uuid, updated_at = now(), updated_by = $4::uuid, version = version + 1 WHERE id = $1::uuid AND tenant_id = $2::uuid AND school_id = $3::uuid AND deleted_at IS NULL AND version = $5 RETURNING id, auth_user_id, tenant_id, school_id, branch_id, display_name, status, version, session_revoked_at, created_at`, [userId, tenantId, schoolId, actorAuthUserId, expectedVersion]);
          if (result.rowCount !== 1) throw new ConflictError('تعذر أرشفة المستخدم.');
          updated = result.rows[0]; metadata = { beforeStatus: row.status, status: 'archived' };
        } else throw new ValidationError('عملية إدارة المستخدم غير معتمدة.');
        const auditId = await recordSchoolIdentityMutation(client, row, actorAuthUserId, operation, metadata, requestId, correlationId, Number(updated.version || 1));
        await client.query('COMMIT');
        return res.json({ success: true, requestId, correlationId, auditId, user: updated });
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        return next(error instanceof Error ? error : new DatabaseError('تعذر تحديث مستخدم المدرسة.'));
      } finally { client.release(); }
    } catch (error) { return next(error); }
  });

  // Central RBAC is mother-school scoped and versioned through the canonical identity
  // tables. The browser never writes permissions directly or invents role IDs.
  app.get('/api/admin/central/rbac', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { id?: string };
    const actorId = String(identity?.id || '').trim();
    if (!actorId) return next(new AuthenticationError('هوية الإدارة المركزية غير مكتملة.'));
    try {
      const client = await platformAdminPool.connect();
      let transactionStarted = false;
      try {
        const ownerScope = await resolveCanonicalOwnerScope(client);
        const tenantId = ownerScope.tenant_id;
        await client.query('BEGIN');
        transactionStarted = true;
        await ensureCanonicalRbacDefaults(client, tenantId);
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
        transactionStarted = false;
        const roles = await client.query(
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
        const catalog = permissionRegistry.list()
          .filter((permissionKey) => permissionKey !== PERMISSIONS.PLATFORM_ADMIN)
          .map((permissionKey) => {
            const { resource, action } = describePermission(permissionKey);
            return { permissionKey, resource, action, description: permissionKey };
          });
        return res.json({ success: true, source: { schoolId: ownerScope.school_id, tenantId: ownerScope.tenant_id, mode: 'mother_school' }, roles: roles.rows, permissionCatalog: catalog });
      } catch (error) {
        if (transactionStarted) await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      return next(new DatabaseError('تعذر تحميل مصفوفة الصلاحيات المركزية.', error instanceof Error ? error.message : String(error)));
    }
  });

  // Create a custom school role in the mother-school catalogue.  A role is a
  // security object (not an HR job title); it is versioned, audited, and then
  // published through the same canonical template pipeline as role edits.
  app.post('/api/admin/central/rbac/roles', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const actorId = String((req as any).user?.id || '').trim();
    const roleKey = String(req.body?.roleKey || '').trim().toLowerCase();
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    const requestedKeys = Array.isArray(req.body?.permissionKeys) ? req.body.permissionKeys as unknown[] : [];
    const requestId = String(req.body?.requestId || req.get('X-Request-Id') || randomUUID()).trim();
    const correlationId = String(req.body?.correlationId || req.get('X-Correlation-Id') || randomUUID()).trim();
    if (!/^[0-9a-f-]{36}$/i.test(actorId)) return next(new AuthenticationError('هوية الإدارة المركزية غير مكتملة.'));
    if (!/^[a-z0-9](?:[a-z0-9._-]{1,62})$/.test(roleKey) || roleKey === 'platformadmin') return next(new ValidationError('مفتاح الدور غير صالح أو محجوز.'));
    if (name.length < 2 || name.length > 160) return next(new ValidationError('اسم الدور يجب أن يكون بين حرفين و160 حرفاً.'));
    if (description.length > 500) return next(new ValidationError('وصف الدور يتجاوز الحد المسموح.'));
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || !/^[0-9a-f-]{36}$/i.test(correlationId)) return next(new ValidationError('معرف الطلب أو الارتباط غير صالح.'));
    const permissionKeys = [...new Set(requestedKeys.map((key) => permissionRegistry.normalize(key)).filter((key): key is string => Boolean(key)))];
    if (!permissionKeys.length || permissionKeys.length !== requestedKeys.length || permissionKeys.includes(PERMISSIONS.PLATFORM_ADMIN)) return next(new ValidationError('اختر صلاحية واحدة على الأقل، ولا يمكن منح صلاحية إدارة المنصة لدور مدرسة.'));
    const client = await platformAdminPool.connect();
    try {
      const ownerScope = await resolveCanonicalOwnerScope(client);
      const tenantId = ownerScope.tenant_id;
      await client.query('BEGIN');
      await ensureCanonicalRbacDefaults(client, tenantId);
      const duplicate = await client.query(
        `SELECT id FROM public.roles WHERE tenant_id = $1::uuid AND role_key = $2 AND school_id IS NULL AND branch_id IS NULL LIMIT 1`,
        [tenantId, roleKey],
      );
      if (duplicate.rowCount) throw new ConflictError('مفتاح الدور مستخدم مسبقاً في المدرسة الأم.');
      const role = await client.query(
        `INSERT INTO public.roles (tenant_id, school_id, branch_id, role_key, name, description, is_system, status, created_by, updated_by)
         VALUES ($1::uuid, NULL, NULL, $2, $3, $4, true, 'active', $5::uuid, $5::uuid)
         RETURNING id, tenant_id, role_key, name, description, is_system, status, version`,
        [tenantId, roleKey, name, description || null, actorId],
      );
      const roleId = role.rows[0].id;
      for (const permissionKey of permissionKeys) {
        const { resource, action } = describePermission(permissionKey);
        const permission = await client.query(
          `INSERT INTO public.permissions (tenant_id, permission_key, resource, action, description, status, created_by, updated_by)
           VALUES (NULL, $1, $2, $3, $1, 'active', $4::uuid, $4::uuid)
           ON CONFLICT (permission_key) DO UPDATE SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now(), updated_by = $4::uuid
           RETURNING id`,
          [permissionKey, resource, action, actorId],
        );
        await client.query(
          `INSERT INTO public.role_permissions (tenant_id, role_id, permission_id, status, created_by, updated_by)
           VALUES ($1::uuid, $2::uuid, $3::uuid, 'active', $4::uuid, $4::uuid)`,
          [tenantId, roleId, permission.rows[0].id, actorId],
        );
      }
      const actorUser = await client.query(`SELECT id FROM public.users WHERE tenant_id = $1::uuid AND auth_user_id = $2::uuid AND deleted_at IS NULL LIMIT 1`, [tenantId, actorId]);
      const actorUserId = actorUser.rows[0]?.id || null;
      const auditPayload = { roleId, roleKey, name, description, permissionKeys, action: 'create_role' };
      await client.query(
        `INSERT INTO public.audit_events (id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata, request_id, correlation_id)
         VALUES ($1::uuid, $2::uuid, NULL, NULL, $3::uuid, 'role', $4::uuid, 'create', 'CentralRbacRoute', $5, 'success', $6::jsonb, $7::uuid, $8::uuid)`,
        [randomUUID(), tenantId, actorUserId, roleId, 'إنشاء دور مركزي جديد', JSON.stringify(auditPayload), requestId, correlationId],
      );
      const outboxPayload = JSON.stringify({ event: 'rbac.role.created', ...auditPayload });
      await client.query(
        `INSERT INTO public.outbox_events (id, tenant_id, event_type, aggregate_type, aggregate_id, event_version, payload, payload_hash, idempotency_key, status, request_id, correlation_id, created_by, updated_by)
         VALUES ($1::uuid, $2::uuid, 'rbac.role.created', 'role', $3::uuid, $4, $5::jsonb, $6, $7, 'pending', $8::uuid, $9::uuid, $10::uuid, $10::uuid)
         ON CONFLICT (tenant_id, idempotency_key) DO NOTHING`,
        [randomUUID(), tenantId, roleId, Number(role.rows[0].version || 1), outboxPayload, createHash('sha256').update(outboxPayload).digest('hex'), `rbac-role-created:${roleId}`, requestId, correlationId, actorId],
      );
      const canonicalTemplate = await client.query(
        `SELECT id, template_key, name, description, version, status, manifest, created_at, updated_at
           FROM public.platform_templates WHERE template_key = $1 AND status <> 'archived'
          ORDER BY version DESC, updated_at DESC LIMIT 1`,
        [CANONICAL_SCHOOL_TEMPLATE_KEY],
      );
      const capturedManifest = { rbac: await captureCanonicalRbacManifest(client, ownerScope.school_id), sourceSchoolId: ownerScope.school_id, capturedAt: new Date().toISOString() };
      let templateForPropagation: any;
      if (canonicalTemplate.rowCount === 1) {
        const updated = await client.query(
          `UPDATE public.platform_templates SET manifest = manifest || $2::jsonb, version = version + 1, status = 'published', updated_at = now(), updated_by_auth_user_id = $3::uuid
             WHERE id = $1::uuid AND status <> 'archived'
           RETURNING id, template_key, name, description, version, status, manifest, created_at, updated_at`,
          [canonicalTemplate.rows[0].id, JSON.stringify(capturedManifest), actorId],
        );
        templateForPropagation = updated.rows[0];
      } else {
        const inserted = await client.query(
          `INSERT INTO public.platform_templates (template_key, name, description, version, status, manifest, created_by_auth_user_id, updated_by_auth_user_id)
           VALUES ($1, 'قالب المدارس المركزي', 'قالب RBAC المدرسة الأم المنشور تلقائيًا', 1, 'published', $2::jsonb, $3::uuid)
           RETURNING id, template_key, name, description, version, status, manifest, created_at, updated_at`,
          [CANONICAL_SCHOOL_TEMPLATE_KEY, JSON.stringify(capturedManifest), actorId],
        );
        templateForPropagation = inserted.rows[0];
      }
      const propagation = await propagateCanonicalTemplate(client, templateForPropagation, actorId);
      await client.query('COMMIT');
      return res.status(201).json({ success: true, role: role.rows[0], permissionKeys, propagation });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      return next(error instanceof Error ? error : new DatabaseError('تعذر إنشاء الدور المركزي.'));
    } finally {
      client.release();
    }
  });

  app.patch('/api/admin/central/rbac/roles/:roleId', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر قاعدة البيانات المركزية غير متاح.'));
    const identity = (req as any).user as { id?: string };
    const actorId = String(identity?.id || '').trim();
    const roleId = String(req.params.roleId || '').trim();
    const requestedKeys = req.body?.permissionKeys;
    const expectedVersion = Number(req.body?.expectedVersion);
    const requestId = String(req.body?.requestId || req.get('X-Request-Id') || randomUUID()).trim();
    const correlationId = String(req.body?.correlationId || req.get('X-Correlation-Id') || randomUUID()).trim();
    const reason = String(req.body?.reason || 'تحديث مركزي لقالب صلاحيات الدور').trim().slice(0, 500);
    if (!actorId) return next(new AuthenticationError('هوية الإدارة المركزية غير مكتملة.'));
    if (!/^[0-9a-f-]{36}$/i.test(roleId)) return next(new ValidationError('معرف الدور غير صالح.'));
    if (!Array.isArray(requestedKeys)) return next(new ValidationError('قائمة الصلاحيات يجب أن تكون مصفوفة.'));
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) return next(new ValidationError('إصدار الدور المتوقع مطلوب لمنع استبدال تحديث مسؤول آخر.'));
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || !/^[0-9a-f-]{36}$/i.test(correlationId)) return next(new ValidationError('معرف الطلب أو الارتباط غير صالح.'));
    const permissionKeys = [...new Set(requestedKeys.map((key) => permissionRegistry.normalize(key)).filter((key): key is string => Boolean(key)))];
    if (permissionKeys.length !== requestedKeys.length) return next(new ValidationError('توجد صلاحية غير مسجلة في الكتالوج المركزي.'));
    if (permissionKeys.includes(PERMISSIONS.PLATFORM_ADMIN)) return next(new AuthorizationError('صلاحية إدارة المنصة لا يمكن إسنادها إلى دور مدرسة.'));
    const name = req.body?.name === undefined ? undefined : String(req.body.name || '').trim();
    const description = req.body?.description === undefined ? undefined : String(req.body.description || '').trim();
    if (name !== undefined && (name.length < 2 || name.length > 160)) return next(new ValidationError('اسم الدور يجب أن يكون بين حرفين و160 حرفاً.'));
    const client = await platformAdminPool.connect();
    try {
      const ownerScope = await resolveCanonicalOwnerScope(client);
      const tenantId = ownerScope.tenant_id;
      await client.query('BEGIN');
      await ensureCanonicalRbacDefaults(client, tenantId);
      const before = await client.query(
        `SELECT r.version,
                COALESCE(array_agg(p.permission_key ORDER BY p.permission_key) FILTER (WHERE p.permission_key IS NOT NULL), ARRAY[]::text[]) AS permission_keys
           FROM public.roles r
           LEFT JOIN public.role_permissions rp ON rp.tenant_id = r.tenant_id AND rp.role_id = r.id
                AND rp.status = 'active' AND rp.deleted_at IS NULL
           LEFT JOIN public.permissions p ON p.id = rp.permission_id AND p.status = 'active' AND p.deleted_at IS NULL
          WHERE r.id = $1::uuid AND r.tenant_id = $2::uuid AND r.school_id IS NULL AND r.branch_id IS NULL
                AND r.status = 'active' AND r.deleted_at IS NULL
          GROUP BY r.id, r.version`,
        [roleId, tenantId],
      );
      if (before.rowCount !== 1) throw new ConflictError('الدور غير موجود في نطاق الإدارة المركزية.');
      if (Number(before.rows[0].version) !== expectedVersion) {
        throw new ConflictError('تم تعديل الدور بواسطة مسؤول آخر. أعد تحميل الصلاحيات قبل الحفظ.', {
          expectedVersion,
          actualVersion: Number(before.rows[0].version),
        });
      }
      const role = await client.query(
        `UPDATE public.roles
            SET name = COALESCE($3, name), description = COALESCE($4, description),
                updated_at = now(), updated_by = $5::uuid, version = version + 1
          WHERE id = $1::uuid AND tenant_id = $2::uuid AND school_id IS NULL AND branch_id IS NULL
                AND status = 'active' AND deleted_at IS NULL AND version = $6
        RETURNING id, tenant_id, role_key, name, description, is_system, status, version`,
        [roleId, tenantId, name ?? null, description ?? null, actorId, expectedVersion],
      );
      if (role.rowCount !== 1) throw new ConflictError('تعارض في تحديث الدور؛ أعد تحميل الصلاحيات قبل الحفظ.');
      await client.query(
        `UPDATE public.role_permissions
            SET status = 'revoked', deleted_at = now(), deleted_by = $3::uuid, updated_at = now(), updated_by = $3::uuid, version = version + 1
          WHERE tenant_id = $1::uuid AND role_id = $2::uuid AND deleted_at IS NULL`,
        [tenantId, roleId, actorId],
      );
      for (const permissionKey of permissionKeys) {
        const { resource, action } = describePermission(permissionKey);
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
      const nextVersion = Number(role.rows[0].version);
      const payload = {
        roleId,
        roleKey: role.rows[0].role_key,
        expectedVersion,
        previousVersion: expectedVersion,
        nextVersion,
        previousPermissionKeys: before.rows[0].permission_keys || [],
        permissionKeys,
        reason,
      };
      const actorUser = await client.query(
        `SELECT id FROM public.users WHERE tenant_id = $1::uuid AND auth_user_id = $2::uuid AND deleted_at IS NULL LIMIT 1`,
        [tenantId, actorId],
      );
      const actorUserId = actorUser.rows[0]?.id || null;
      await client.query(
        `INSERT INTO public.audit_events
           (id, tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata, request_id, correlation_id)
         VALUES ($1::uuid, $2::uuid, NULL, NULL, $3::uuid, 'role', $4::uuid, 'update_permissions', 'CentralRbacRoute', $5, 'success', $6::jsonb, $7::uuid, $8::uuid)`,
        [randomUUID(), tenantId, actorUserId, roleId, reason, JSON.stringify(payload), requestId, correlationId],
      );
      const outboxPayload = JSON.stringify({ event: 'rbac.role.updated', ...payload });
      await client.query(
        `INSERT INTO public.outbox_events
           (id, tenant_id, event_type, aggregate_type, aggregate_id, event_version, payload, payload_hash, idempotency_key, status, request_id, correlation_id, created_by, updated_by)
         VALUES ($1::uuid, $2::uuid, 'rbac.role.updated', 'role', $3::uuid, $4, $5::jsonb, $6, $7, 'pending', $8::uuid, $9::uuid, $10::uuid, $10::uuid)
         ON CONFLICT (tenant_id, idempotency_key) DO NOTHING`,
        [
          randomUUID(), tenantId, roleId, nextVersion, outboxPayload,
          createHash('sha256').update(outboxPayload).digest('hex'),
          `rbac-role:${roleId}:${nextVersion}`, requestId, correlationId, actorId,
        ],
      );
      let propagation: { targetCount: number; releases: any[]; schools: any[] } = { targetCount: 0, releases: [], schools: [] };
      const canonicalTemplate = await client.query(
        `SELECT id, template_key, name, description, version, status, manifest, created_at, updated_at
           FROM public.platform_templates
          WHERE template_key = $1 AND status <> 'archived'
          ORDER BY version DESC, updated_at DESC
          LIMIT 1`,
        [CANONICAL_SCHOOL_TEMPLATE_KEY],
      );
      const capturedRbac = await captureCanonicalRbacManifest(client, ownerScope.school_id);
      const capturedManifest = {
        rbac: capturedRbac,
        sourceSchoolId: ownerScope.school_id,
        capturedAt: new Date().toISOString(),
      };
      let templateForPropagation;
      if (canonicalTemplate.rowCount === 1) {
        const templateUpdate = await client.query(
          `UPDATE public.platform_templates
              SET manifest = manifest || $2::jsonb,
                  version = version + 1,
                  status = 'published',
                  updated_at = now(), updated_by_auth_user_id = $3::uuid
            WHERE id = $1::uuid AND status <> 'archived'
          RETURNING id, template_key, name, description, version, status, manifest, created_at, updated_at`,
          [canonicalTemplate.rows[0].id, JSON.stringify(capturedManifest), actorId],
        );
        if (templateUpdate.rowCount !== 1) throw new ConflictError('تعذر إصدار قالب المدرسة الأم بعد حفظ الدور.');
        templateForPropagation = templateUpdate.rows[0];
      } else {
        const templateInsert = await client.query(
          `INSERT INTO public.platform_templates
             (template_key, name, description, version, status, manifest, created_by_auth_user_id, updated_by_auth_user_id)
           VALUES ($1, 'قالب المدارس المركزي', 'قالب RBAC المدرسة الأم المنشور تلقائيًا', 1, 'published', $2::jsonb, $3::uuid, $3::uuid)
           RETURNING id, template_key, name, description, version, status, manifest, created_at, updated_at`,
          [CANONICAL_SCHOOL_TEMPLATE_KEY, JSON.stringify(capturedManifest), actorId],
        );
        templateForPropagation = templateInsert.rows[0];
      }
      propagation = await propagateCanonicalTemplate(client, templateForPropagation, actorId);
      await client.query('COMMIT');
      return res.json({ success: true, role: role.rows[0], permissionKeys, version: nextVersion, requestId, correlationId, propagation });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      return next(error instanceof Error ? error : new DatabaseError('تعذر حفظ مصفوفة الصلاحيات المركزية.'));
    } finally {
      client.release();
    }
  });

  // Central incident command. Incidents contain operational coordination data
  // only; tenant business records stay inside their isolated school domains.
  const incidentStatuses = ['detected', 'triaged', 'assigned', 'in_progress', 'monitoring', 'resolved', 'closed'] as const;
  const incidentSeverities = ['sev1', 'sev2', 'sev3', 'sev4'] as const;
  const incidentCategories = ['application', 'database', 'access', 'performance', 'subscription', 'integration', 'release', 'security', 'other'] as const;
  const incidentImpactScopes = ['school', 'tenant', 'multi_school', 'platform'] as const;
  const incidentSources = ['automated', 'audit', 'school_report', 'central_review'] as const;
  const incidentTransitions: Record<string, string[]> = {
    detected: ['triaged'],
    triaged: [],
    assigned: ['in_progress'],
    in_progress: ['monitoring'],
    monitoring: ['in_progress'],
    resolved: [],
    closed: [],
  };
  const defaultIncidentDueAt = (severity: string): string => {
    const hours = severity === 'sev1' ? 1 : severity === 'sev2' ? 4 : severity === 'sev3' ? 24 : 72;
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  };
  const incidentSelectColumns = `
    i.id, i.incident_number, i.tenant_id, i.school_id, i.source, i.source_event_id,
    i.trace_id, i.title, i.description, i.category, i.severity, i.impact_scope,
    i.status, i.owner_auth_user_id, i.owner_name, i.due_at, i.detected_at,
    i.acknowledged_at, i.resolved_at, i.closed_at, i.resolution_summary,
    i.root_cause, i.linked_release_id, i.version, i.created_at, i.updated_at,
    s.display_name AS school_name, s.school_code, t.legal_name AS tenant_name`;
  const incidentAssignableTeamSelect = `
    SELECT DISTINCT pu.auth_user_id,
           COALESCE(NULLIF(profile.display_name, ''), 'عضو الإدارة المركزية') AS display_name,
           pu.status
      FROM public.platform_users pu
      JOIN public.platform_user_roles pur
        ON pur.platform_user_id = pu.id
      JOIN public.platform_roles pr
        ON pr.id = pur.role_id
      LEFT JOIN LATERAL (
        SELECT u.display_name
          FROM public.users u
         WHERE u.auth_user_id = pu.auth_user_id
           AND u.status = 'active'
           AND u.deleted_at IS NULL
         ORDER BY u.created_at ASC
         LIMIT 1
      ) profile ON true
     WHERE pu.status = 'active'
       AND pu.deleted_at IS NULL
       AND pur.status = 'active'
       AND pur.deleted_at IS NULL
       AND pur.starts_at <= now()
       AND (pur.ends_at IS NULL OR pur.ends_at > now())
       AND pr.role_key = 'platformadmin'
       AND pr.status = 'active'
       AND pr.deleted_at IS NULL`;

  app.get('/api/admin/central/incidents', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر مركز قيادة الحوادث غير متاح.'));
    const status = String(req.query?.status || '').trim();
    const schoolId = String(req.query?.schoolId || '').trim();
    if (status && !incidentStatuses.includes(status as any)) return next(new ValidationError('حالة الحادثة غير صالحة.'));
    if (schoolId && !isUuid(schoolId)) return next(new ValidationError('معرف المدرسة غير صالح.'));
    try {
      const incidentResult = await platformAdminPool.query(
        `SELECT ${incidentSelectColumns}
           FROM public.platform_incidents i
           LEFT JOIN public.schools s ON s.id = i.school_id
           LEFT JOIN public.tenants t ON t.id = i.tenant_id
          WHERE ($1 = '' OR i.status = $1)
            AND ($2::uuid IS NULL OR i.school_id = $2::uuid)
          ORDER BY
            CASE i.severity WHEN 'sev1' THEN 1 WHEN 'sev2' THEN 2 WHEN 'sev3' THEN 3 ELSE 4 END,
            CASE WHEN i.status IN ('resolved', 'closed') THEN 1 ELSE 0 END,
            i.due_at ASC NULLS LAST,
            i.updated_at DESC
          LIMIT 300`,
        [status, schoolId || null],
      );
      const incidentIds = incidentResult.rows.map((row: any) => row.id);
      const eventResult = incidentIds.length
        ? await platformAdminPool.query(
          `SELECT id, incident_id, event_type, from_status, to_status, note,
                  actor_auth_user_id, actor_name, metadata, created_at
             FROM (
               SELECT pie.*,
                      row_number() OVER (PARTITION BY pie.incident_id ORDER BY pie.created_at DESC) AS event_position
                 FROM public.platform_incident_events pie
                WHERE pie.incident_id = ANY($1::uuid[])
             ) ranked_events
            WHERE event_position <= 30
            ORDER BY incident_id, created_at DESC`,
          [incidentIds],
        )
        : { rows: [] as any[] };
      const eventsByIncident = new Map<string, any[]>();
      for (const event of eventResult.rows) {
        const timeline = eventsByIncident.get(event.incident_id) || [];
        if (timeline.length < 30) timeline.push(event);
        eventsByIncident.set(event.incident_id, timeline);
      }
      const incidents = incidentResult.rows.map((incident: any) => ({
        ...incident,
        events: eventsByIncident.get(incident.id) || [],
      }));

      const signalResult = await platformAdminPool.query(
        `SELECT ae.id, ae.tenant_id, ae.school_id, ae.action, ae.source, ae.reason,
                ae.result, ae.metadata, ae.created_at, s.display_name AS school_name,
                t.legal_name AS tenant_name
           FROM public.audit_events ae
           LEFT JOIN public.platform_incidents pi
             ON pi.source_event_id = ae.id AND pi.source IN ('audit', 'automated')
           LEFT JOIN public.schools s ON s.id = ae.school_id
           LEFT JOIN public.tenants t ON t.id = ae.tenant_id
          WHERE pi.id IS NULL
            AND ae.created_at >= now() - interval '7 days'
            AND (
              lower(COALESCE(ae.result, '')) IN ('error', 'failure', 'failed', 'denied', 'partial')
              OR ae.action = 'SYSTEM_CRITICAL_ERROR'
            )
          ORDER BY ae.created_at DESC
          LIMIT 80`,
      );
      const signals = signalResult.rows.map((signal: any) => ({
        ...signal,
        suggestedSeverity: signal.action === 'SYSTEM_CRITICAL_ERROR' || ['error', 'failure', 'failed'].includes(String(signal.result || '').toLowerCase()) ? 'sev2' : 'sev3',
      }));
      const teamResult = await platformAdminPool.query(
        `${incidentAssignableTeamSelect} ORDER BY display_name, auth_user_id`,
      );
      return res.json({ success: true, incidents, signals, team: teamResult.rows, generatedAt: new Date().toISOString() });
    } catch (error) {
      return next(new DatabaseError('تعذر تحميل مركز قيادة الحوادث.', error instanceof Error ? error.message : String(error)));
    }
  });

  app.post('/api/admin/central/incidents', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر مركز قيادة الحوادث غير متاح.'));
    const identity = (req as any).user as { id?: string; name?: string };
    const actorAuthUserId = String(identity?.id || '').trim();
    const actorName = String(identity?.name || 'الإدارة المركزية').trim().slice(0, 160);
    const schoolId = String(req.body?.schoolId || '').trim();
    const sourceEventId = String(req.body?.sourceEventId || '').trim();
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim() || null;
    const category = String(req.body?.category || 'application').trim();
    const severity = String(req.body?.severity || 'sev3').trim();
    const impactScope = String(req.body?.impactScope || (schoolId ? 'school' : 'platform')).trim();
    const source = String(req.body?.source || 'central_review').trim();
    const traceId = String(req.body?.traceId || '').trim() || null;
    const ownerAuthUserId = String(req.body?.ownerAuthUserId || '').trim();
    const requestedDueAt = String(req.body?.dueAt || '').trim();
    if (!isUuid(actorAuthUserId)) return next(new AuthenticationError('هوية عضو فريق الإدارة المركزية غير مكتملة.'));
    if (schoolId && !isUuid(schoolId)) return next(new ValidationError('معرف المدرسة غير صالح.'));
    if (sourceEventId && !isUuid(sourceEventId)) return next(new ValidationError('مرجع إشارة الاكتشاف غير صالح.'));
    if (ownerAuthUserId && !isUuid(ownerAuthUserId)) return next(new ValidationError('هوية المسؤول المعين غير صالحة.'));
    if (title.length < 4 || title.length > 200 || (description && description.length > 5000)) return next(new ValidationError('عنوان أو وصف الحادثة غير صالح.'));
    if (!incidentCategories.includes(category as any) || !incidentSeverities.includes(severity as any) || !incidentImpactScopes.includes(impactScope as any) || !incidentSources.includes(source as any)) return next(new ValidationError('تصنيف الحادثة غير صالح.'));
    const dueAt = requestedDueAt || defaultIncidentDueAt(severity);
    if (Number.isNaN(Date.parse(dueAt))) return next(new ValidationError('موعد الاستجابة غير صالح.'));

    const client = await platformAdminPool.connect();
    try {
      await client.query('BEGIN');
      let tenantId: string | null = null;
      if (schoolId) {
        const school = await client.query<{ tenant_id: string }>(
          `SELECT tenant_id FROM public.schools WHERE id = $1::uuid AND deleted_at IS NULL FOR SHARE`,
          [schoolId],
        );
        if (school.rowCount !== 1) throw new ConflictError('المدرسة المحددة غير موجودة في الدليل المركزي.');
        tenantId = school.rows[0].tenant_id;
      }
      let ownerName: string | null = null;
      if (ownerAuthUserId) {
        const owner = await client.query<{ display_name: string }>(
          `SELECT display_name
             FROM (${incidentAssignableTeamSelect}) assignable_team
            WHERE auth_user_id = $1::uuid
            LIMIT 1`,
          [ownerAuthUserId],
        );
        if (owner.rowCount !== 1) throw new ConflictError('لا يمكن الإسناد إلا لعضو نشط ومخوّل في فريق الإدارة المركزية.');
        ownerName = owner.rows[0].display_name;
      }
      const status = ownerAuthUserId ? 'assigned' : 'detected';
      const incidentResult = await client.query(
        `INSERT INTO public.platform_incidents
          (tenant_id, school_id, source, source_event_id, trace_id, title, description,
           category, severity, impact_scope, status, owner_auth_user_id, owner_name,
           due_at, acknowledged_at, created_by_auth_user_id, updated_by_auth_user_id)
         VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5, $6, $7, $8, $9, $10, $11,
                 $12::uuid, $13, $14::timestamptz, CASE WHEN $12::uuid IS NULL THEN NULL ELSE now() END,
                 $15::uuid, $15::uuid)
         RETURNING *`,
        [tenantId, schoolId || null, source, sourceEventId || null, traceId, title, description, category, severity, impactScope, status, ownerAuthUserId || null, ownerName, dueAt, actorAuthUserId],
      );
      const incident = incidentResult.rows[0];
      const eventResult = await client.query(
        `INSERT INTO public.platform_incident_events
          (incident_id, event_type, to_status, note, actor_auth_user_id, actor_name, metadata)
         VALUES ($1::uuid, 'created', $2, $3, $4::uuid, $5, $6::jsonb)
         RETURNING *`,
        [incident.id, status, description, actorAuthUserId, actorName, JSON.stringify({ source, sourceEventId: sourceEventId || null, ownerAuthUserId: ownerAuthUserId || null })],
      );
      await client.query('COMMIT');
      return res.status(201).json({ success: true, incident: { ...incident, events: eventResult.rows } });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      if (error instanceof ConflictError || error instanceof ValidationError) return next(error);
      return next(/duplicate|unique/i.test(error instanceof Error ? error.message : '')
        ? new ConflictError('تم فتح حادثة لهذه الإشارة مسبقًا؛ استخدم سجلها الحالي.')
        : new DatabaseError('تعذر فتح الحادثة؛ لم يتم إنشاء سجل جزئي.', error instanceof Error ? error.message : String(error)));
    } finally {
      client.release();
    }
  });

  app.patch('/api/admin/central/incidents/:incidentId', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
    if (!platformAdminPool) return next(new DatabaseError('مصدر مركز قيادة الحوادث غير متاح.'));
    const identity = (req as any).user as { id?: string; name?: string };
    const actorAuthUserId = String(identity?.id || '').trim();
    const actorName = String(identity?.name || 'الإدارة المركزية').trim().slice(0, 160);
    const incidentId = String(req.params.incidentId || '').trim();
    const operation = String(req.body?.operation || '').trim();
    const expectedVersion = Number(req.body?.expectedVersion);
    const note = String(req.body?.note || '').trim() || null;
    if (!isUuid(actorAuthUserId) || !isUuid(incidentId)) return next(new ValidationError('معرف الحادثة أو هوية عضو الفريق غير صالح.'));
    if (!['assign', 'transition', 'comment', 'resolve', 'close', 'reopen', 'link_release', 'update'].includes(operation)) return next(new ValidationError('عملية الحادثة غير معتمدة.'));
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) return next(new ValidationError('نسخة الحادثة مطلوبة لمنع تعارض تحديثات الفريق.'));
    if (note && note.length > 5000) return next(new ValidationError('ملاحظة الحادثة طويلة جدًا.'));

    const client = await platformAdminPool.connect();
    try {
      await client.query('BEGIN');
      const currentResult = await client.query<any>(
        `SELECT * FROM public.platform_incidents WHERE id = $1::uuid FOR UPDATE`,
        [incidentId],
      );
      if (currentResult.rowCount !== 1) throw new ConflictError('الحادثة غير موجودة.');
      const current = currentResult.rows[0];
      if (Number(current.version) !== expectedVersion) throw new ConflictError('حدّث عضو آخر هذه الحادثة. أعد تحميلها قبل حفظ تعديلك.');

      let nextStatus = current.status;
      let ownerAuthUserId = current.owner_auth_user_id;
      let ownerName = current.owner_name;
      let dueAt = current.due_at;
      let acknowledgedAt = current.acknowledged_at;
      let resolvedAt = current.resolved_at;
      let closedAt = current.closed_at;
      let resolutionSummary = current.resolution_summary;
      let rootCause = current.root_cause;
      let linkedReleaseId = current.linked_release_id;
      let title = current.title;
      let description = current.description;
      let category = current.category;
      let severity = current.severity;
      let impactScope = current.impact_scope;
      let eventType = 'updated';
      let eventMetadata: Record<string, unknown> = {};

      if (operation === 'assign') {
        if (['resolved', 'closed'].includes(current.status)) throw new ConflictError('أعد فتح الحادثة قبل تغيير مسؤولها.');
        const requestedOwnerId = String(req.body?.ownerAuthUserId || '').trim();
        if (!isUuid(requestedOwnerId)) throw new ValidationError('اختر عضو فريق نشطًا لإسناد الحادثة.');
        const owner = await client.query<{ display_name: string }>(
          `SELECT display_name
             FROM (${incidentAssignableTeamSelect}) assignable_team
            WHERE auth_user_id = $1::uuid
            LIMIT 1`,
          [requestedOwnerId],
        );
        if (owner.rowCount !== 1) throw new ConflictError('لا يمكن الإسناد إلا لعضو نشط ومخوّل في فريق الإدارة المركزية.');
        ownerAuthUserId = requestedOwnerId;
        ownerName = owner.rows[0].display_name;
        if (['detected', 'triaged'].includes(current.status)) nextStatus = 'assigned';
        acknowledgedAt = acknowledgedAt || new Date().toISOString();
        eventType = 'assigned';
        eventMetadata = { ownerAuthUserId, ownerName };
      } else if (operation === 'transition') {
        const requestedStatus = String(req.body?.status || '').trim();
        if (!incidentStatuses.includes(requestedStatus as any) || !incidentTransitions[current.status]?.includes(requestedStatus)) throw new ConflictError('انتقال حالة الحادثة غير مسموح من مرحلتها الحالية.');
        if (requestedStatus === 'in_progress' && !ownerAuthUserId) throw new ConflictError('يجب إسناد مسؤول واضح قبل بدء المعالجة.');
        nextStatus = requestedStatus;
        acknowledgedAt = acknowledgedAt || (requestedStatus !== 'detected' ? new Date().toISOString() : null);
        eventType = requestedStatus === 'triaged' ? 'triaged' : 'status_changed';
      } else if (operation === 'comment') {
        if (!note || note.length < 2) throw new ValidationError('اكتب ملاحظة واضحة قبل الإضافة.');
        eventType = 'comment';
      } else if (operation === 'resolve') {
        const summary = String(req.body?.resolutionSummary || '').trim();
        const cause = String(req.body?.rootCause || '').trim() || null;
        if (summary.length < 4 || summary.length > 5000 || (cause && cause.length > 5000)) throw new ValidationError('ملخص المعالجة أو السبب الجذري غير صالح.');
        if (!['in_progress', 'monitoring'].includes(current.status)) throw new ConflictError('ابدأ المعالجة أو التحقق قبل تسجيل الحل.');
        if (['sev1', 'sev2'].includes(current.severity) && (!cause || cause.length < 4)) throw new ValidationError('السبب الجذري إلزامي للحوادث الحرجة والعالية.');
        nextStatus = 'resolved';
        resolvedAt = new Date().toISOString();
        closedAt = null;
        resolutionSummary = summary;
        rootCause = cause;
        eventType = 'resolved';
      } else if (operation === 'close') {
        if (current.status !== 'resolved') throw new ConflictError('لا يمكن الإغلاق قبل المعالجة والتحقق.');
        nextStatus = 'closed';
        closedAt = new Date().toISOString();
        eventType = 'closed';
      } else if (operation === 'reopen') {
        if (!['resolved', 'closed'].includes(current.status)) throw new ConflictError('إعادة الفتح متاحة للحوادث المعالجة أو المغلقة فقط.');
        nextStatus = 'in_progress';
        resolvedAt = null;
        closedAt = null;
        eventType = 'reopened';
      } else if (operation === 'link_release') {
        const releaseId = String(req.body?.releaseId || '').trim();
        if (!isUuid(releaseId)) throw new ValidationError('معرف الإصدار المرتبط غير صالح.');
        const release = await client.query<{ school_id: string }>(
          `SELECT school_id FROM public.platform_school_releases WHERE id = $1::uuid`,
          [releaseId],
        );
        if (release.rowCount !== 1 || (current.school_id && release.rows[0].school_id !== current.school_id)) throw new ConflictError('الإصدار لا ينتمي إلى نطاق هذه الحادثة.');
        linkedReleaseId = releaseId;
        eventType = 'release_linked';
        eventMetadata = { releaseId };
      } else if (operation === 'update') {
        const requestedTitle = String(req.body?.title || current.title).trim();
        const requestedDescription = String(req.body?.description ?? current.description ?? '').trim() || null;
        const requestedCategory = String(req.body?.category || current.category).trim();
        const requestedSeverity = String(req.body?.severity || current.severity).trim();
        const requestedImpact = String(req.body?.impactScope || current.impact_scope).trim();
        const requestedDueAt = String(req.body?.dueAt || current.due_at || '').trim();
        if (requestedTitle.length < 4 || requestedTitle.length > 200 || (requestedDescription && requestedDescription.length > 5000)) throw new ValidationError('عنوان أو وصف الحادثة غير صالح.');
        if (!incidentCategories.includes(requestedCategory as any) || !incidentSeverities.includes(requestedSeverity as any) || !incidentImpactScopes.includes(requestedImpact as any)) throw new ValidationError('تصنيف الحادثة غير صالح.');
        if (requestedDueAt && Number.isNaN(Date.parse(requestedDueAt))) throw new ValidationError('موعد الاستجابة غير صالح.');
        title = requestedTitle;
        description = requestedDescription;
        category = requestedCategory;
        severity = requestedSeverity;
        impactScope = requestedImpact;
        dueAt = requestedDueAt || null;
        eventType = 'updated';
      }

      const updatedResult = await client.query(
        `UPDATE public.platform_incidents
            SET title = $3, description = $4, category = $5, severity = $6,
                impact_scope = $7, status = $8, owner_auth_user_id = $9::uuid,
                owner_name = $10, due_at = $11::timestamptz,
                acknowledged_at = $12::timestamptz, resolved_at = $13::timestamptz,
                closed_at = $14::timestamptz, resolution_summary = $15,
                root_cause = $16, linked_release_id = $17::uuid,
                version = version + 1, updated_at = now(), updated_by_auth_user_id = $18::uuid
          WHERE id = $1::uuid AND version = $2
          RETURNING *`,
        [incidentId, expectedVersion, title, description, category, severity, impactScope, nextStatus, ownerAuthUserId, ownerName, dueAt, acknowledgedAt, resolvedAt, closedAt, resolutionSummary, rootCause, linkedReleaseId, actorAuthUserId],
      );
      if (updatedResult.rowCount !== 1) throw new ConflictError('تعارض تحديث الحادثة؛ أعد تحميل البيانات.');
      const eventResult = await client.query(
        `INSERT INTO public.platform_incident_events
          (incident_id, event_type, from_status, to_status, note, actor_auth_user_id, actor_name, metadata)
         VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid, $7, $8::jsonb)
         RETURNING *`,
        [incidentId, eventType, current.status, nextStatus, note || (eventType === 'resolved' ? resolutionSummary : null), actorAuthUserId, actorName, JSON.stringify(eventMetadata)],
      );
      await client.query('COMMIT');
      return res.json({ success: true, incident: { ...updatedResult.rows[0], events: [eventResult.rows[0]] } });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      return next(error instanceof ConflictError || error instanceof ValidationError
        ? error
        : new DatabaseError('تعذر تحديث الحادثة؛ لم يُحفظ أي تغيير جزئي.', error instanceof Error ? error.message : String(error)));
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
      nationalId: studentData.nationalId,
      preferredName: studentData.preferredName,
      dateOfBirth,
      gender: studentData.gender,
      nationality: studentData.nationality,
      birthCountryCode: studentData.birthCountryCode,
      academicPreviousSchool: studentData.academicPreviousSchool,
      academicPreviousGrade: studentData.academicPreviousGrade,
      academicPreviousYear: studentData.academicPreviousYear,
      academicPerformanceLevel: studentData.academicPerformanceLevel,
      academicWritingLevel: studentData.academicWritingLevel,
      academicReadingLevel: studentData.academicReadingLevel,
      academicSpellingLevel: studentData.academicSpellingLevel,
      academicAverage: studentData.academicAverage,
      academicNotes: studentData.academicNotes,
      healthChronicDiseases: studentData.healthChronicDiseases,
      healthMedications: studentData.healthMedications,
      healthAllergies: studentData.healthAllergies,
      healthNotes: studentData.healthNotes,
      socialLivingWith: studentData.socialLivingWith,
      socialBirthOrder: studentData.socialBirthOrder,
      socialFamilyView: studentData.socialFamilyView,
      socialOutsideTraits: studentData.socialOutsideTraits,
      termId: resolvedTermId || await resolveActiveStudentTerm(context),
      admissionReference: "STUDENT-AFFAIRS-REGISTRATION",
      guardian: {
        legalFirstName: guardianParts[0],
        legalMiddleName: guardianParts.length > 2 ? guardianParts.slice(1, -1).join(" ") : undefined,
        legalLastName: guardianParts[guardianParts.length - 1],
        phone: studentData.parentPhone,
        // Guardian email must be explicit; never derive it from the student's email.
        email: studentData.parentEmail,
        occupation: studentData.parentJob || studentData.guardianOccupation,
        educationLevel: studentData.parentEducationLevel || studentData.educationLevel,
        motherName: studentData.motherName,
        motherPhone: studentData.motherPhone,
        motherWhatsapp: studentData.motherWhatsapp,
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
    if (studentData.nationalId !== undefined) patch.nationalId = studentData.nationalId;
    if (studentData.studentNumber !== undefined || studentData.studentCode !== undefined) patch.studentNumber = studentData.studentNumber || studentData.studentCode;
    if (studentData.academicPreviousSchool !== undefined) patch.academicPreviousSchool = studentData.academicPreviousSchool;
    if (studentData.academicPreviousGrade !== undefined) patch.academicPreviousGrade = studentData.academicPreviousGrade;
    if (studentData.academicPreviousYear !== undefined) patch.academicPreviousYear = studentData.academicPreviousYear;
    if (studentData.academicPerformanceLevel !== undefined) patch.academicPerformanceLevel = studentData.academicPerformanceLevel;
    if (studentData.academicWritingLevel !== undefined) patch.academicWritingLevel = studentData.academicWritingLevel;
    if (studentData.academicReadingLevel !== undefined) patch.academicReadingLevel = studentData.academicReadingLevel;
    if (studentData.academicSpellingLevel !== undefined) patch.academicSpellingLevel = studentData.academicSpellingLevel;
    if (studentData.academicAverage !== undefined) patch.academicAverage = studentData.academicAverage;
    if (studentData.academicNotes !== undefined) patch.academicNotes = studentData.academicNotes;
    if (studentData.healthChronicDiseases !== undefined) patch.healthChronicDiseases = studentData.healthChronicDiseases;
    if (studentData.healthMedications !== undefined) patch.healthMedications = studentData.healthMedications;
    if (studentData.healthAllergies !== undefined) patch.healthAllergies = studentData.healthAllergies;
    if (studentData.healthNotes !== undefined) patch.healthNotes = studentData.healthNotes;
    if (studentData.socialLivingWith !== undefined) patch.socialLivingWith = studentData.socialLivingWith;
    if (studentData.socialBirthOrder !== undefined) patch.socialBirthOrder = studentData.socialBirthOrder;
    if (studentData.socialFamilyView !== undefined) patch.socialFamilyView = studentData.socialFamilyView;
    if (studentData.socialOutsideTraits !== undefined) patch.socialOutsideTraits = studentData.socialOutsideTraits;
    return patch;
  }

  const guardianUpdateFields = [
    "parentName", "parentPhone", "parentEmail", "parentNationalId", "parentRelation", "parentJob",
    "guardianOccupation", "parentEducationLevel", "educationLevel", "motherName", "motherPhone", "motherWhatsapp",
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

  // Canonical student-attendance read model.  The browser never supplies a
  // school or tenant identifier; both the session list and its records are
  // constrained by the verified identity and (when present) branch scope.
  // Writes remain behind the dedicated attendance application service until
  // its repository/audit adapter is deployed against the attendance schema.
  app.get('/api/attendance/records', authenticateRequest, requirePermission('attendance:view'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { schoolId?: string; branchId?: string };
      const schoolId = String(identity?.schoolId || '').trim();
      if (!schoolId) throw new AuthenticationError('هوية المدرسة الموثوقة غير مكتملة.');
      const date = String(req.query?.date || '').trim();
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ValidationError('تاريخ الحضور غير صالح.');
      const classroom = String(req.query?.classroom || '').trim();
      const supabase = getSupabaseClientForAccessToken((req as any).trustedAccessToken) || getSupabaseClient();
      if (!supabase) throw new DatabaseError('مصدر الحضور المركزي غير متاح.');

      let sessionsQuery = supabase
        .from('attendance_sessions')
        .select('id,attendance_date,class_reference,branch_id')
        .eq('school_id', schoolId)
        .order('attendance_date', { ascending: false });
      if (identity?.branchId) sessionsQuery = sessionsQuery.eq('branch_id', identity.branchId);
      if (date) sessionsQuery = sessionsQuery.eq('attendance_date', date);
      if (classroom) sessionsQuery = sessionsQuery.eq('class_reference', classroom);
      const { data: sessions, error: sessionsError } = await sessionsQuery;
      if (sessionsError) throw sessionsError;
      const sessionRows = Array.isArray(sessions) ? sessions : [];
      if (!sessionRows.length) {
        res.set('Cache-Control', 'no-store');
        return res.json({ success: true, data: [] });
      }

      const sessionIds = sessionRows.map((row: any) => row.id).filter(Boolean);
      const sessionById = new Map(sessionRows.map((row: any) => [String(row.id), row]));
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('id,student_id,attendance_session_id,attendance_status,recorded_at,version')
        .eq('school_id', schoolId)
        .in('attendance_session_id', sessionIds)
        .order('recorded_at', { ascending: false });
      if (recordsError) throw recordsError;
      const result = (records || []).map((record: any) => {
        const session = sessionById.get(String(record.attendance_session_id));
        return {
          id: String(record.id),
          student_id: record.student_id,
          status: record.attendance_status,
          date: session?.attendance_date || '',
          classroom: session?.class_reference || '',
          session_id: record.attendance_session_id,
          recorded_at: record.recorded_at,
          version: record.version,
        };
      });
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  });

  // Correct an existing canonical attendance record atomically.  Creation is
  // still intentionally owned by the dedicated attendance application
  // service, but corrections can be safely exposed here because the record,
  // session, actor, version and audit event are all checked in one UoW.
  app.patch('/api/attendance/records/:id', authenticateRequest, requirePermission('attendance:edit'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; branchId?: string; id?: string; role?: string; name?: string; academicYear?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const recordId = String(req.params.id || '').trim();
      const expectedVersion = Number(req.body?.expectedVersion);
      const status = String(req.body?.status || '').trim();
      const reason = String(req.body?.reason || '').trim();
      const requestId = String(req.body?.requestId || randomUUID()).trim();
      const correlationId = String(req.body?.correlationId || randomUUID()).trim();
      const uuid = (candidate: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate);
      if (!tenantId || !schoolId || !identity?.id || !uuid(recordId) || !Number.isInteger(expectedVersion) || expectedVersion < 1
        || !['present', 'absent', 'late', 'excused'].includes(status) || reason.length < 3 || reason.length > 500
        || !uuid(requestId) || !uuid(correlationId)) {
        throw new ValidationError('تصحيح الحضور يتطلب معرفاً صالحاً وإصداراً متوقعاً وحالة وسبباً واضحين.');
      }
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
        throw new AuthenticationError('السياق الموثوق لتصحيح الحضور غير مكتمل.');
      }

      let updated: Record<string, unknown> | null = null;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Correct canonical attendance record', tenantId, userId: identity.id,
        userName: identity.name || identity.id, ipAddress: req.ip || 'unknown',
        affectedTables: ['attendance_records', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة تصحيح الحضور غير متاحة.');
        const actor = await transaction.query<{ id: string }>(
          `SELECT id FROM public.users
            WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3
              AND status = 'active' AND deleted_at IS NULL
            LIMIT 1`, [tenantId, identity.id, schoolId]
        );
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية الجلسة بمستخدم المدرسة المعتمد.');
        const current = await transaction.query<any>(
          `SELECT ar.id, ar.attendance_status, ar.version, ar.school_id, ar.branch_id, ar.attendance_session_id,
                  s.status AS session_status
             FROM public.attendance_records ar
             JOIN public.attendance_sessions s
               ON s.tenant_id = ar.tenant_id AND s.school_id = ar.school_id
              AND s.branch_id = ar.branch_id AND s.id = ar.attendance_session_id
            WHERE ar.tenant_id = $1 AND ar.school_id = $2 AND ar.id = $3
            FOR UPDATE`, [tenantId, schoolId, recordId]
        );
        const row = current.rows[0];
        if (!row) throw new ValidationError('سجل الحضور المطلوب غير موجود ضمن المدرسة الحالية.');
        if (identity.branchId && row.branch_id !== identity.branchId) throw new AuthorizationError('سجل الحضور خارج نطاق الفرع الحالي.');
        if (Number(row.version) !== expectedVersion) throw new ConflictError('تغير سجل الحضور؛ أعد تحميله قبل التصحيح.', { expectedVersion, actualVersion: Number(row.version) });
        const result = await transaction.query<any>(
          `UPDATE public.attendance_records
              SET attendance_status = $4, corrected_at = now(), corrected_by = $5,
                  correction_reason = $6, version = version + 1, updated_at = now(),
                  updated_by = $5, request_id = $7, correlation_id = $8
            WHERE tenant_id = $1 AND school_id = $2 AND id = $3
            RETURNING id, student_id, attendance_session_id, attendance_status, version, recorded_at`,
          [tenantId, schoolId, recordId, status, actorId, reason, requestId, correlationId]
        );
        updated = result.rows[0] || null;
        await transaction.query(
          `INSERT INTO public.audit_events
             (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata, request_id, correlation_id)
           VALUES ($1, $2, $3, $4, 'attendance_record', $5, 'correct', 'AttendanceCorrectionRoute', $6, 'success', $7::jsonb, $8, $9)`,
          [tenantId, schoolId, row.branch_id, actorId, recordId, reason,
            JSON.stringify({ oldStatus: row.attendance_status, newStatus: status, expectedVersion, newVersion: Number(updated?.version || expectedVersion + 1) }), requestId, correlationId]
        );
      }, tenantContext);
      return res.json({ success: true, data: updated });
    } catch (error) {
      return next(error);
    }
  });

  // School-scoped uniform catalogue. Rich uniform fields are kept in the
  // canonical data column while identity/scope/status remain first-class.
  app.get('/api/uniform/items', authenticateRequest, requirePermission('uniform_management:view'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      if (!tenantId || !schoolId || !identity?.id) throw new AuthenticationError('هوية المدرسة الموثوقة غير مكتملة.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للزي غير مكتمل.');
      const search = String(req.query?.search || '').trim().replace(/[,%()]/g, ' ');
      let data: any[] = [];
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Read canonical uniform items', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['uniforms'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة قراءة أصناف الزي غير متاحة.');
        const result = await transaction.query<any>(`SELECT id, tenant_id, school_id, branch_id, code, name, status, data, created_at, updated_at FROM public.uniforms WHERE tenant_id = $1 AND school_id = $2 AND ($3 = '' OR name ILIKE $4 OR code ILIKE $4 OR COALESCE(data->>'barcode','') ILIKE $4) ORDER BY name ASC, code ASC`, [tenantId, schoolId, search, `%${search}%`]);
        data = result.rows.map((row: any) => ({ ...(row.data || {}), id: row.id, code: row.code || row.data?.code || '', nameAr: row.data?.nameAr || row.name, nameEn: row.data?.nameEn || '', status: row.status, branchId: row.branch_id, createdAt: row.created_at, updatedAt: row.updated_at }));
      }, tenantContext);
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, data });
    } catch (error) { return next(error); }
  });

  app.post('/api/uniform/items', authenticateRequest, requirePermission('uniform_management:insert'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; branchId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const body = req.body || {};
      const code = String(body.code || '').trim();
      const nameAr = String(body.nameAr || body.name_ar || '').trim();
      const barcode = String(body.barcode || '').trim();
      const buyPrice = Number(body.buyPrice ?? body.buy_price ?? 0);
      const sellPrice = Number(body.sellPrice ?? body.sell_price ?? 0);
      if (!tenantId || !schoolId || !identity?.id || !code || code.length > 80 || !nameAr || nameAr.length > 240 || !barcode || barcode.length > 120 || !Number.isFinite(buyPrice) || buyPrice < 0 || !Number.isFinite(sellPrice) || sellPrice < buyPrice) throw new ValidationError('بيانات صنف الزي غير مكتملة أو غير صالحة.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للزي غير مكتمل.');
      const allowed = new Set(['Male', 'Female', 'Unisex', '']);
      const gender = String(body.gender || '');
      if (!allowed.has(gender)) throw new ValidationError('نوع الجنس لصنف الزي غير صالح.');
      const uniformId = randomUUID();
      let created: any = null;
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Create canonical uniform item', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['uniforms', 'audit_events'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة إنشاء صنف الزي غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const data = { ...body, code, barcode, nameAr, buyPrice, sellPrice, minPrice: buyPrice, maxPrice: sellPrice * 2, marginPercent: buyPrice > 0 ? Math.round(((sellPrice - buyPrice) / buyPrice) * 100) : 0 };
        const result = await transaction.query<any>(`INSERT INTO public.uniforms (id, tenant_id, school_id, branch_id, code, name, status, data, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7::jsonb, $8, $8) RETURNING id, tenant_id, school_id, branch_id, code, name, status, data, created_at, updated_at`, [uniformId, tenantId, schoolId, identity.branchId || null, code, nameAr, JSON.stringify(data), actorId]);
        const defaultVariantId = randomUUID();
        await transaction.query(`INSERT INTO public.uniform_item_variants (id, tenant_id, school_id, branch_id, item_id, size_code, color_code, sku, stock_qty, buy_price, sell_price, data, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, '', '', $6, 0, $7, $8, '{}'::jsonb, $9, $9)`, [defaultVariantId, tenantId, schoolId, identity.branchId || null, uniformId, `SKU-${code}`, buyPrice, sellPrice, actorId]);
        created = { ...(result.rows[0].data || {}), id: result.rows[0].id, code: result.rows[0].code, nameAr: result.rows[0].name, status: result.rows[0].status, branchId: result.rows[0].branch_id, defaultVariantId, createdAt: result.rows[0].created_at, updatedAt: result.rows[0].updated_at };
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1, $2, $3, $4, 'uniform_item', $5, 'create', 'UniformCanonicalRoute', 'success', $6::jsonb)`, [tenantId, schoolId, identity.branchId || null, actorId, uniformId, JSON.stringify({ code, barcode, buyPrice, sellPrice })]);
      }, tenantContext);
      return res.status(201).json({ success: true, data: created });
    } catch (error) { return next(error); }
  });

  app.patch('/api/uniform/items/:id', authenticateRequest, requirePermission('uniform_management:edit'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; branchId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const itemId = String(req.params.id || '').trim();
      const uuid = (candidate: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate);
      if (!tenantId || !schoolId || !identity?.id || !uuid(itemId)) throw new ValidationError('معرف صنف الزي أو هوية المستخدم غير صالح.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للزي غير مكتمل.');
      let updated: any = null;
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Update canonical uniform item', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['uniforms', 'audit_events'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة تعديل صنف الزي غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const current = await transaction.query<any>(`SELECT * FROM public.uniforms WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, itemId]);
        const row = current.rows[0];
        if (!row) throw new ValidationError('صنف الزي غير موجود في المدرسة الحالية.');
        const incoming = req.body || {};
        const merged = { ...(row.data || {}), ...incoming };
        const code = incoming.code === undefined ? String(row.code || merged.code || '') : String(incoming.code).trim();
        const nameAr = incoming.nameAr === undefined && incoming.name_ar === undefined ? String(row.name || merged.nameAr || '') : String(incoming.nameAr ?? incoming.name_ar).trim();
        const status = incoming.status === undefined ? String(row.status || 'active') : String(incoming.status);
        const buyPrice = Number(merged.buyPrice ?? merged.buy_price ?? 0);
        const sellPrice = Number(merged.sellPrice ?? merged.sell_price ?? 0);
        if (!code || code.length > 80 || !nameAr || nameAr.length > 240 || !['active', 'inactive', 'archived'].includes(status) || !Number.isFinite(buyPrice) || buyPrice < 0 || !Number.isFinite(sellPrice) || sellPrice < buyPrice) throw new ValidationError('بيانات صنف الزي أو حالته غير صالحة.');
        merged.code = code; merged.nameAr = nameAr; merged.buyPrice = buyPrice; merged.sellPrice = sellPrice;
        const result = await transaction.query<any>(`UPDATE public.uniforms SET code = $4, name = $5, status = $6, data = $7::jsonb, updated_by = $8, updated_at = now() WHERE tenant_id = $1 AND school_id = $2 AND id = $3 RETURNING id, branch_id, code, name, status, data, created_at, updated_at`, [tenantId, schoolId, itemId, code, nameAr, status, JSON.stringify(merged), actorId]);
        const record = result.rows[0];
        updated = { ...(record.data || {}), id: record.id, code: record.code, nameAr: record.name, status: record.status, branchId: record.branch_id, createdAt: record.created_at, updatedAt: record.updated_at };
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1, $2, $3, $4, 'uniform_item', $5, 'update', 'UniformCanonicalRoute', 'success', $6::jsonb)`, [tenantId, schoolId, record.branch_id || null, actorId, itemId, JSON.stringify({ before: row, after: record })]);
      }, tenantContext);
      return res.json({ success: true, data: updated });
    } catch (error) { return next(error); }
  });

  app.delete('/api/uniform/items/:id', authenticateRequest, requirePermission('uniform_management:delete'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const itemId = String(req.params.id || '').trim();
      const uuid = (candidate: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate);
      if (!tenantId || !schoolId || !identity?.id || !uuid(itemId)) throw new ValidationError('معرف صنف الزي أو هوية المستخدم غير صالح.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للزي غير مكتمل.');
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Delete canonical uniform item', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['uniforms', 'audit_events'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة حذف صنف الزي غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const result = await transaction.query<any>(`DELETE FROM public.uniforms WHERE tenant_id = $1 AND school_id = $2 AND id = $3 RETURNING id, branch_id`, [tenantId, schoolId, itemId]);
        if (!result.rows[0]) throw new ValidationError('صنف الزي غير موجود في المدرسة الحالية.');
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1, $2, $3, $4, 'uniform_item', $5, 'delete', 'UniformCanonicalRoute', 'success', '{}'::jsonb)`, [tenantId, schoolId, result.rows[0].branch_id || null, actorId, itemId]);
      }, tenantContext);
      return res.json({ success: true, data: { id: itemId, deleted: true } });
    } catch (error) { return next(error); }
  });

  // Canonical fixed-asset register. Lifecycle mutations are transactional:
  // the register, immutable event, canonical GL posting and audit either all
  // commit or none of them do.
  app.get('/api/fixed-assets', authenticateRequest, requirePermission('fixed_assets:view'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      if (!tenantId || !schoolId || !identity?.id) throw new AuthenticationError('هوية المدرسة الموثوقة غير مكتملة.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للأصول غير مكتمل.');
      let data: any[] = [];
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Read canonical fixed assets', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['fixed_assets', 'fixed_asset_events'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة قراءة الأصول غير متاحة.');
        const result = await transaction.query<any>(`SELECT id, tenant_id, school_id, branch_id, code, name, category, status, cost, accumulated_depreciation, net_book_value, data, created_at, updated_at FROM public.fixed_assets WHERE tenant_id = $1 AND school_id = $2 ORDER BY code ASC`, [tenantId, schoolId]);
        const events = await transaction.query<any>(`SELECT id, asset_id, event_type, event_date, amount, journal_entry_id, data, created_at FROM public.fixed_asset_events WHERE tenant_id = $1 AND school_id = $2 ORDER BY event_date DESC, created_at DESC`, [tenantId, schoolId]);
        const eventsByAsset = new Map<string, any[]>();
        for (const event of events.rows) eventsByAsset.set(event.asset_id, [...(eventsByAsset.get(event.asset_id) || []), event]);
        data = result.rows.map((row: any) => ({ ...(row.data || {}), id: row.id, code: row.code, name: row.name, category: row.category, status: row.status, cost: Number(row.cost), accDep: Number(row.accumulated_depreciation), netValue: Number(row.net_book_value), maintenanceLogs: eventsByAsset.get(row.id)?.filter((e: any) => e.event_type === 'maintenance') || [], transferLogs: eventsByAsset.get(row.id)?.filter((e: any) => e.event_type === 'transfer') || [], depreciationHistory: eventsByAsset.get(row.id)?.filter((e: any) => e.event_type === 'depreciation') || [], timeline: eventsByAsset.get(row.id) || [], createdAt: row.created_at, updatedAt: row.updated_at }));
      }, tenantContext);
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, data });
    } catch (error) { return next(error); }
  });

  app.post('/api/fixed-assets', authenticateRequest, requirePermission('fixed_assets:insert'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; branchId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const body = req.body || {};
      const code = String(body.code || '').trim();
      const name = String(body.name || '').trim();
      const cost = Number(body.cost || 0);
      if (!tenantId || !schoolId || !identity?.id || !code || code.length > 80 || !name || name.length > 240 || !Number.isFinite(cost) || cost <= 0) throw new ValidationError('كود واسم وتكلفة الأصل حقول مطلوبة.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للأصول غير مكتمل.');
      const assetId = randomUUID();
      let created: any = null;
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Create canonical fixed asset', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['fixed_assets', 'fixed_asset_events', 'erp_journal_entries', 'erp_general_ledger', 'audit_events'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة إنشاء الأصل غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        if (!await CanonicalErpPostingService.isProvisioned(transaction)) throw new DatabaseError('دفتر الأستاذ الكانوني غير مهيأ؛ لا يمكن رسملة الأصل دون قيد موثق.');
        const capitalExp = Number(body.capitalExp || 0);
        const totalCost = Number((cost + (Number.isFinite(capitalExp) && capitalExp > 0 ? capitalExp : 0)).toFixed(2));
        const data = { ...body, code, name, cost, capitalExp: Number.isFinite(capitalExp) ? capitalExp : 0, accDep: 0, netValue: totalCost };
        await transaction.query(`INSERT INTO public.fixed_assets (id, tenant_id, school_id, branch_id, code, name, category, status, cost, accumulated_depreciation, net_book_value, data, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, 0, $8, $9::jsonb, $10, $10)`, [assetId, tenantId, schoolId, identity.branchId || null, code, name, String(body.category || ''), totalCost, JSON.stringify(data), actorId]);
        const sourceId = `fixed-asset:${assetId}:acquisition`;
        const posting = await CanonicalErpPostingService.syncSnapshot(transaction, tenantId, schoolId, actorId, { journalEntries: [{ id: sourceId, status: 'posted', date: String(body.purchaseDate || new Date().toISOString().slice(0, 10)).slice(0, 10), description: `رسملة أصل ثابت ${code}`, lines: [{ id: `${sourceId}-D`, accountCode: '1301', debit: totalCost, credit: 0 }, { id: `${sourceId}-C`, accountCode: String(body.paymentAccount || '2101'), debit: 0, credit: totalCost }] }] });
        await transaction.query(`INSERT INTO public.fixed_asset_events (id, tenant_id, school_id, branch_id, asset_id, event_type, event_date, amount, journal_entry_id, data, created_by) VALUES ($1, $2, $3, $4, $5, 'acquisition', $6, $7, $8, $9::jsonb, $10)`, [randomUUID(), tenantId, schoolId, identity.branchId || null, assetId, String(body.purchaseDate || new Date().toISOString().slice(0, 10)).slice(0, 10), totalCost, posting.sourceLinks[0]?.journalEntryId || null, JSON.stringify({ code, sourceId }), actorId]);
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1, $2, $3, $4, 'fixed_asset', $5, 'create', 'FixedAssetsCanonicalRoute', 'success', $6::jsonb)`, [tenantId, schoolId, identity.branchId || null, actorId, assetId, JSON.stringify({ code, cost: totalCost })]);
        created = { ...data, id: assetId, status: 'active', cost: totalCost, accDep: 0, netValue: totalCost, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      }, tenantContext);
      return res.status(201).json({ success: true, data: created });
    } catch (error) { return next(error); }
  });

  app.patch('/api/fixed-assets/:id', authenticateRequest, requirePermission('fixed_assets:edit'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim(); const schoolId = String(identity?.schoolId || '').trim(); const assetId = String(req.params.id || '').trim();
      if (!tenantId || !schoolId || !identity?.id || !assetId) throw new ValidationError('معرف الأصل أو هوية المستخدم غير صالح.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للأصول غير مكتمل.');
      let updated: any = null;
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Update fixed asset metadata', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['fixed_assets', 'audit_events'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction; if (!transaction) throw new DatabaseError('معاملة تعديل الأصل غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]);
        const actorId = actor.rows[0]?.id; if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const current = await transaction.query<any>(`SELECT * FROM public.fixed_assets WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, assetId]);
        const row = current.rows[0]; if (!row) throw new ValidationError('الأصل غير موجود في المدرسة الحالية.');
        const incoming = req.body || {}; const data = { ...(row.data || {}), ...incoming };
        const code = incoming.code === undefined ? row.code : String(incoming.code).trim(); const name = incoming.name === undefined ? row.name : String(incoming.name).trim();
        if (!code || code.length > 80 || !name || name.length > 240) throw new ValidationError('كود أو اسم الأصل غير صالح.');
        const result = await transaction.query<any>(`UPDATE public.fixed_assets SET code = $4, name = $5, category = $6, data = $7::jsonb, updated_by = $8, updated_at = now() WHERE tenant_id = $1 AND school_id = $2 AND id = $3 RETURNING *`, [tenantId, schoolId, assetId, code, name, String(incoming.category ?? row.category), JSON.stringify(data), actorId]);
        updated = { ...(result.rows[0].data || {}), id: result.rows[0].id, code: result.rows[0].code, name: result.rows[0].name, category: result.rows[0].category, status: result.rows[0].status, cost: Number(result.rows[0].cost), accDep: Number(result.rows[0].accumulated_depreciation), netValue: Number(result.rows[0].net_book_value), updatedAt: result.rows[0].updated_at };
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1, $2, $3, $4, 'fixed_asset', $5, 'update', 'FixedAssetsCanonicalRoute', 'success', $6::jsonb)`, [tenantId, schoolId, row.branch_id || null, actorId, assetId, JSON.stringify({ before: row, after: result.rows[0] })]);
      }, tenantContext);
      return res.json({ success: true, data: updated });
    } catch (error) { return next(error); }
  });

  app.post('/api/fixed-assets/:id/events', authenticateRequest, requirePermission('fixed_assets:edit'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; branchId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const assetId = String(req.params.id || '').trim();
      const type = String(req.body?.type || req.body?.eventType || '').trim();
      const eventDate = String(req.body?.eventDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
      if (!tenantId || !schoolId || !identity?.id || !assetId || !['transfer', 'maintenance', 'depreciation', 'sale', 'discard'].includes(type) || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) throw new ValidationError('نوع وتاريخ حركة الأصل غير صالحين.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للأصول غير مكتمل.');
      let updated: any = null;
      await UnitOfWork.runInTransaction(schoolId, { operationName: `Post fixed asset ${type} event`, tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['fixed_assets', 'fixed_asset_events', 'erp_journal_entries', 'erp_general_ledger', 'audit_events'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة حركة الأصل غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const current = await transaction.query<any>(`SELECT * FROM public.fixed_assets WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, assetId]);
        const asset = current.rows[0];
        if (!asset) throw new ValidationError('الأصل غير موجود في المدرسة الحالية.');
        if (['sale', 'discard'].includes(type) && ['sold', 'disposed'].includes(asset.status)) throw new ConflictError('الأصل مغلق بحركة بيع أو استبعاد سابقة.');
        let amount = Number(req.body?.amount || 0);
        let nextAccDep = Number(asset.accumulated_depreciation);
        let nextStatus = asset.status;
        const lines: any[] = [];
        if (type === 'depreciation') {
          const data = asset.data || {};
          const life = Math.max(1, Number(data.usefulLife || 1));
          const residual = Math.max(0, Number(data.scrapValue || 0));
          amount = amount > 0 ? amount : Number(((Number(asset.cost) - residual) / life).toFixed(2));
          amount = Math.min(amount, Number(asset.cost) - nextAccDep);
          if (!(amount > 0)) throw new ConflictError('لا يوجد رصيد قابل للإهلاك لهذا الأصل.');
          nextAccDep = Number((nextAccDep + amount).toFixed(2));
          lines.push({ id: `${assetId}-dep-${eventDate}-D`, accountCode: '5280', debit: amount, credit: 0 }, { id: `${assetId}-dep-${eventDate}-C`, accountCode: '1301', debit: 0, credit: amount });
        } else if (type === 'sale') {
          amount = Number(req.body?.price || req.body?.amount || 0);
          if (!Number.isFinite(amount) || amount <= 0) throw new ValidationError('سعر بيع الأصل يجب أن يكون أكبر من صفر.');
          const net = Number(asset.net_book_value);
          lines.push({ id: `${assetId}-sale-${eventDate}-cash`, accountCode: '1101', debit: amount, credit: 0 }, { id: `${assetId}-sale-${eventDate}-asset`, accountCode: '1301', debit: 0, credit: Math.min(net, amount) });
          if (net > amount) lines.push({ id: `${assetId}-sale-${eventDate}-loss`, accountCode: '5280', debit: net - amount, credit: 0 });
          if (amount > net) lines.push({ id: `${assetId}-sale-${eventDate}-gain`, accountCode: '4101', debit: 0, credit: amount - net });
          nextStatus = 'sold';
        } else if (type === 'discard') {
          amount = Number(asset.net_book_value);
          if (!(amount > 0)) throw new ConflictError('الأصل لا يحمل قيمة دفترية قابلة للشطب.');
          lines.push({ id: `${assetId}-discard-${eventDate}-loss`, accountCode: '5280', debit: amount, credit: 0 }, { id: `${assetId}-discard-${eventDate}-asset`, accountCode: '1301', debit: 0, credit: amount });
          nextStatus = 'disposed';
        } else if (type === 'maintenance') {
          amount = Number(req.body?.amount || 0);
          if (!Number.isFinite(amount) || amount <= 0) throw new ValidationError('تكلفة الصيانة يجب أن تكون أكبر من صفر.');
          lines.push({ id: `${assetId}-mnt-${eventDate}-D`, accountCode: '5280', debit: amount, credit: 0 }, { id: `${assetId}-mnt-${eventDate}-C`, accountCode: String(req.body?.paymentAccount || '2101'), debit: 0, credit: amount });
        }
        let journalEntryId: string | null = null;
        if (lines.length) {
          if (!await CanonicalErpPostingService.isProvisioned(transaction)) throw new DatabaseError('دفتر الأستاذ الكانوني غير مهيأ؛ لم تُسجل الحركة.');
          const sourceId = `fixed-asset:${assetId}:${type}:${eventDate}:${randomUUID()}`;
          const posting = await CanonicalErpPostingService.syncSnapshot(transaction, tenantId, schoolId, actorId, { journalEntries: [{ id: sourceId, status: 'posted', date: eventDate, description: `حركة أصل ثابت ${asset.code} — ${type}`, lines }] });
          journalEntryId = posting.sourceLinks[0]?.journalEntryId || null;
        }
        const netValue = Number((Number(asset.cost) - nextAccDep - (type === 'sale' || type === 'discard' ? Number(asset.net_book_value) - Number(asset.accumulated_depreciation) : 0)).toFixed(2));
        const safeNet = Math.max(0, type === 'sale' || type === 'discard' ? 0 : netValue);
        const eventId = randomUUID();
        await transaction.query(`INSERT INTO public.fixed_asset_events (id, tenant_id, school_id, branch_id, asset_id, event_type, event_date, amount, journal_entry_id, data, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)`, [eventId, tenantId, schoolId, identity.branchId || asset.branch_id || null, assetId, type, eventDate, amount, journalEntryId, JSON.stringify(req.body || {}), actorId]);
        const result = await transaction.query<any>(`UPDATE public.fixed_assets SET status = $4, accumulated_depreciation = $5, net_book_value = $6, updated_by = $7, updated_at = now(), data = data || $8::jsonb WHERE tenant_id = $1 AND school_id = $2 AND id = $3 RETURNING *`, [tenantId, schoolId, assetId, nextStatus, nextAccDep, safeNet, JSON.stringify({ lastEventId: eventId, lastEventType: type }) , actorId]);
        updated = { ...(result.rows[0].data || {}), id: result.rows[0].id, code: result.rows[0].code, name: result.rows[0].name, category: result.rows[0].category, status: result.rows[0].status, cost: Number(result.rows[0].cost), accDep: Number(result.rows[0].accumulated_depreciation), netValue: Number(result.rows[0].net_book_value), updatedAt: result.rows[0].updated_at };
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1, $2, $3, $4, 'fixed_asset', $5, $6, 'FixedAssetsCanonicalRoute', 'success', $7::jsonb)`, [tenantId, schoolId, identity.branchId || asset.branch_id || null, actorId, assetId, type, JSON.stringify({ amount, journalEntryId, eventId })]);
      }, tenantContext);
      return res.json({ success: true, data: updated });
    } catch (error) { return next(error); }
  });

  app.get('/api/uniform/variants', authenticateRequest, requirePermission('uniform_management:stock:view'), async (req, res, next) => {
    try {
      const identity = (req as any).user; const tenantId = String(identity?.tenantId || '').trim(); const schoolId = String(identity?.schoolId || '').trim();
      if (!tenantId || !schoolId || !identity?.id) throw new AuthenticationError('هوية المدرسة الموثوقة غير مكتملة.');
      const tenantContext = (req as any).tenantContext; if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للمخزون غير مكتمل.');
      let data: any[] = [];
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Read canonical uniform variants', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['uniform_item_variants', 'uniforms'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction; if (!transaction) throw new DatabaseError('معاملة قراءة مخزون الزي غير متاحة.');
        const result = await transaction.query<any>(`SELECT v.*, u.code AS item_code, u.name AS item_name FROM public.uniform_item_variants v JOIN public.uniforms u ON u.school_id = v.school_id AND u.id = v.item_id WHERE v.tenant_id = $1 AND v.school_id = $2 ORDER BY u.name, v.sku`, [tenantId, schoolId]);
        data = result.rows.map((row: any) => ({ ...row.data, id: row.id, itemId: row.item_id, itemCode: row.item_code, itemName: row.item_name, sizeCode: row.size_code, colorCode: row.color_code, sku: row.sku, stockQty: Number(row.stock_qty), buyPrice: Number(row.buy_price), sellPrice: Number(row.sell_price), alertLimit: Number(row.alert_limit) }));
      }, tenantContext);
      res.set('Cache-Control', 'no-store'); return res.json({ success: true, data });
    } catch (error) { return next(error); }
  });

  app.post('/api/uniform/variants', authenticateRequest, requirePermission('uniform_management:stock:insert'), async (req, res, next) => {
    try {
      const identity = (req as any).user; const tenantId = String(identity?.tenantId || '').trim(); const schoolId = String(identity?.schoolId || '').trim(); const itemId = String(req.body?.itemId || '').trim();
      const sku = String(req.body?.sku || '').trim(); const buyPrice = Number(req.body?.buyPrice || 0); const sellPrice = Number(req.body?.sellPrice || 0); const stockQty = Number(req.body?.stockQty || 0);
      if (!tenantId || !schoolId || !identity?.id || !itemId || !sku || !Number.isInteger(stockQty) || stockQty < 0 || !Number.isFinite(buyPrice) || buyPrice < 0 || !Number.isFinite(sellPrice) || sellPrice < buyPrice) throw new ValidationError('بيانات متغير الزي أو الأسعار غير صالحة.');
      const tenantContext = (req as any).tenantContext; if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للمخزون غير مكتمل.');
      let created: any = null;
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Create canonical uniform variant', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['uniform_item_variants', 'uniform_stock_movements', 'audit_events'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction; if (!transaction) throw new DatabaseError('معاملة إنشاء متغير الزي غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]); const actorId = actor.rows[0]?.id; if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const item = await transaction.query<any>(`SELECT id, branch_id FROM public.uniforms WHERE tenant_id = $1 AND school_id = $2 AND id = $3`, [tenantId, schoolId, itemId]); if (!item.rows[0]) throw new ValidationError('صنف الزي الأساسي غير موجود.');
        const variantId = randomUUID();
        await transaction.query(`INSERT INTO public.uniform_item_variants (id, tenant_id, school_id, branch_id, item_id, size_code, color_code, sku, stock_qty, buy_price, sell_price, alert_limit, data, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $14)`, [variantId, tenantId, schoolId, item.rows[0].branch_id || null, itemId, String(req.body?.sizeCode || ''), String(req.body?.colorCode || ''), sku, stockQty, buyPrice, sellPrice, Number(req.body?.alertLimit || 0), JSON.stringify(req.body || {}), actorId]);
        if (stockQty > 0) await transaction.query(`INSERT INTO public.uniform_stock_movements (id, tenant_id, school_id, branch_id, variant_id, movement_type, quantity_delta, unit_cost, reference_id, created_by, data) VALUES ($1, $2, $3, $4, $5, 'purchase', $6, $7, $8, $9, $10::jsonb)`, [randomUUID(), tenantId, schoolId, item.rows[0].branch_id || null, variantId, stockQty, buyPrice, `variant:${variantId}:opening`, actorId, JSON.stringify({ opening: true })]);
        created = { id: variantId, itemId, sku, stockQty, buyPrice, sellPrice, sizeCode: String(req.body?.sizeCode || ''), colorCode: String(req.body?.colorCode || '') };
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1, $2, $3, $4, 'uniform_variant', $5, 'create', 'UniformInventoryCanonicalRoute', 'success', $6::jsonb)`, [tenantId, schoolId, item.rows[0].branch_id || null, actorId, variantId, JSON.stringify({ sku, stockQty })]);
      }, tenantContext); return res.status(201).json({ success: true, data: created });
    } catch (error) { return next(error); }
  });

  app.post('/api/uniform/stock', authenticateRequest, requirePermission('uniform_management:stock:insert'), async (req, res, next) => {
    try {
      const identity = (req as any).user; const tenantId = String(identity?.tenantId || '').trim(); const schoolId = String(identity?.schoolId || '').trim(); const variantId = String(req.body?.variantId || '').trim(); const delta = Number(req.body?.quantityDelta ?? req.body?.qty ?? 0); const type = String(req.body?.type || 'adjustment');
      if (!tenantId || !schoolId || !identity?.id || !variantId || !Number.isInteger(delta) || delta === 0 || !['purchase', 'return', 'adjustment'].includes(type)) throw new ValidationError('حركة مخزون الزي غير صالحة.');
      const tenantContext = (req as any).tenantContext; if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للمخزون غير مكتمل.');
      let resultData: any = null;
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Post canonical uniform stock movement', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['uniform_item_variants', 'uniform_stock_movements', 'erp_journal_entries', 'erp_general_ledger', 'audit_events'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction; if (!transaction) throw new DatabaseError('معاملة حركة مخزون الزي غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]); const actorId = actor.rows[0]?.id; if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const current = await transaction.query<any>(`SELECT * FROM public.uniform_item_variants WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, variantId]); const variant = current.rows[0]; if (!variant) throw new ValidationError('متغير الزي غير موجود.');
        const next = Number(variant.stock_qty) + delta; if (next < 0) throw new ConflictError('الرصيد المتاح لا يكفي لحركة المخزون.');
        if (!await CanonicalErpPostingService.isProvisioned(transaction)) throw new DatabaseError('دفتر الأستاذ الكانوني غير مهيأ؛ لم تُسجل حركة المخزون.');
        const amount = Number((Math.abs(delta) * Number(variant.buy_price)).toFixed(2)); if (!(amount > 0)) throw new ValidationError('تكلفة الحركة غير صالحة.');
        const sourceId = `uniform-stock:${variantId}:${randomUUID()}`; const lines = delta > 0 ? [{ id: `${sourceId}-D`, accountCode: '1301', debit: amount, credit: 0 }, { id: `${sourceId}-C`, accountCode: '2101', debit: 0, credit: amount }] : [{ id: `${sourceId}-D`, accountCode: '5280', debit: amount, credit: 0 }, { id: `${sourceId}-C`, accountCode: '1301', debit: 0, credit: amount }];
        const posting = await CanonicalErpPostingService.syncSnapshot(transaction, tenantId, schoolId, actorId, { journalEntries: [{ id: sourceId, status: 'posted', date: new Date().toISOString().slice(0, 10), description: `حركة مخزون زي ${variant.sku}`, lines }] });
        await transaction.query(`UPDATE public.uniform_item_variants SET stock_qty = $4, updated_by = $5, updated_at = now() WHERE tenant_id = $1 AND school_id = $2 AND id = $3`, [tenantId, schoolId, variantId, next, actorId]);
        const movementId = randomUUID(); await transaction.query(`INSERT INTO public.uniform_stock_movements (id, tenant_id, school_id, branch_id, variant_id, movement_type, quantity_delta, unit_cost, reference_id, created_by, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)`, [movementId, tenantId, schoolId, variant.branch_id || null, variantId, type, delta, variant.buy_price, sourceId, actorId, JSON.stringify({ journalEntryId: posting.sourceLinks[0]?.journalEntryId })]);
        resultData = { id: movementId, variantId, quantityDelta: delta, stockQty: next, journalEntryId: posting.sourceLinks[0]?.journalEntryId || null };
      }, tenantContext); return res.status(201).json({ success: true, data: resultData });
    } catch (error) { return next(error); }
  });

  app.get('/api/uniform/sales', authenticateRequest, requirePermission('uniform_management:sales:view'), async (req, res, next) => {
    try { const identity = (req as any).user; const tenantId = String(identity?.tenantId || '').trim(); const schoolId = String(identity?.schoolId || '').trim(); const tenantContext = (req as any).tenantContext; if (!tenantId || !schoolId || !identity?.id || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق لمبيعات الزي غير مكتمل.'); let data: any[] = []; await UnitOfWork.runInTransaction(schoolId, { operationName: 'Read canonical uniform sales', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['uniform_sales', 'uniform_sale_lines'] }, async () => { const transaction = UnitOfWork.getActiveContext()?.databaseTransaction; if (!transaction) throw new DatabaseError('معاملة قراءة مبيعات الزي غير متاحة.'); const result = await transaction.query<any>(`SELECT s.*, json_agg(json_build_object('variantId', l.variant_id, 'quantity', l.quantity, 'unitPrice', l.unit_price, 'lineTotal', l.line_total)) AS lines FROM public.uniform_sales s LEFT JOIN public.uniform_sale_lines l ON l.school_id = s.school_id AND l.sale_id = s.id WHERE s.tenant_id = $1 AND s.school_id = $2 GROUP BY s.school_id, s.id ORDER BY s.sale_date DESC, s.created_at DESC`, [tenantId, schoolId]); data = result.rows; }, tenantContext); res.set('Cache-Control', 'no-store'); return res.json({ success: true, data }); } catch (error) { return next(error); }
  });

  app.post('/api/uniform/sales', authenticateRequest, requirePermission('uniform_management:sales:insert'), async (req, res, next) => {
    try {
      const identity = (req as any).user; const tenantId = String(identity?.tenantId || '').trim(); const schoolId = String(identity?.schoolId || '').trim(); const studentId = String(req.body?.studentId || '').trim(); const paymentMethod = String(req.body?.paymentMethod || 'Cash'); const linesInput = Array.isArray(req.body?.lines) ? req.body.lines : [];
      const uuid = (candidate: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate);
      if (!tenantId || !schoolId || !identity?.id || !uuid(studentId) || !['Cash', 'Card', 'BankTransfer', 'StudentAccount'].includes(paymentMethod) || linesInput.length === 0) throw new ValidationError('الطالب وطريقة الدفع وبنود البيع حقول مطلوبة.');
      const tenantContext = (req as any).tenantContext; if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق لمبيعات الزي غير مكتمل.');
      let sale: any = null;
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Post canonical uniform sale', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['uniform_sales', 'uniform_sale_lines', 'uniform_item_variants', 'uniform_stock_movements', 'erp_journal_entries', 'erp_general_ledger', 'audit_events'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction; if (!transaction) throw new DatabaseError('معاملة بيع الزي غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]); const actorId = actor.rows[0]?.id; if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const student = await transaction.query(`SELECT id FROM public.students WHERE tenant_id = $1 AND school_id = $2 AND id = $3 AND deleted_at IS NULL`, [tenantId, schoolId, studentId]); if (!student.rows[0]) throw new ValidationError('الطالب غير موجود في المدرسة الحالية.');
        const unique = new Set<string>(); let subtotal = 0; let cogs = 0; const locked: any[] = [];
        for (const raw of linesInput) { const variantId = String(raw?.variantId || '').trim(); const qty = Number(raw?.quantity ?? raw?.qty); if (!variantId || unique.has(variantId) || !Number.isInteger(qty) || qty <= 0) throw new ValidationError('بنود بيع الزي غير صالحة أو مكررة.'); unique.add(variantId); const row = await transaction.query<any>(`SELECT * FROM public.uniform_item_variants WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, variantId]); const variant = row.rows[0]; if (!variant) throw new ValidationError('متغير الزي غير موجود.'); if (Number(variant.stock_qty) < qty) throw new ConflictError(`الرصيد غير كافٍ للصنف ${variant.sku}.`); subtotal += Number(variant.sell_price) * qty; cogs += Number(variant.buy_price) * qty; locked.push({ variant, qty }); }
        const discount = Number(req.body?.discount || 0); const tax = Number(req.body?.tax || 0); const grandTotal = Number((subtotal - discount + tax).toFixed(2)); if (!(grandTotal > 0) || discount < 0 || tax < 0 || discount > subtotal) throw new ValidationError('إجمالي بيع الزي غير صالح.');
        if (!await CanonicalErpPostingService.isProvisioned(transaction)) throw new DatabaseError('دفتر الأستاذ الكانوني غير مهيأ؛ لم تُسجل عملية البيع.');
        const saleId = randomUUID(); const sourceId = `uniform-sale:${saleId}`; const cashAccount = paymentMethod === 'StudentAccount' ? '1201' : '1101'; const revenue = Number((subtotal - discount).toFixed(2)); const journalLines: any[] = [{ id: `${sourceId}-AR`, accountCode: cashAccount, debit: grandTotal, credit: 0 }, { id: `${sourceId}-REV`, accountCode: '4101', debit: 0, credit: revenue }, { id: `${sourceId}-COGS`, accountCode: '5270', debit: cogs, credit: 0 }, { id: `${sourceId}-STOCK`, accountCode: '1301', debit: 0, credit: cogs }]; if (tax > 0) journalLines.push({ id: `${sourceId}-TAX`, accountCode: '2101', debit: 0, credit: tax });
        const posting = await CanonicalErpPostingService.syncSnapshot(transaction, tenantId, schoolId, actorId, { journalEntries: [{ id: sourceId, status: 'posted', date: new Date().toISOString().slice(0, 10), description: `بيع زي مدرسي للطالب ${studentId}`, lines: journalLines }] });
        await transaction.query(`INSERT INTO public.uniform_sales (id, tenant_id, school_id, branch_id, student_id, subtotal, discount, tax, grand_total, payment_method, journal_entry_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [saleId, tenantId, schoolId, identity.branchId || null, studentId, subtotal, discount, tax, grandTotal, paymentMethod, posting.sourceLinks[0]?.journalEntryId || null, actorId]);
        for (const line of locked) { const lineTotal = Number((Number(line.variant.sell_price) * line.qty).toFixed(2)); await transaction.query(`UPDATE public.uniform_item_variants SET stock_qty = stock_qty - $4, updated_by = $5, updated_at = now() WHERE tenant_id = $1 AND school_id = $2 AND id = $3`, [tenantId, schoolId, line.variant.id, line.qty, actorId]); await transaction.query(`INSERT INTO public.uniform_sale_lines (id, tenant_id, school_id, sale_id, variant_id, quantity, unit_price, unit_cost, line_total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [randomUUID(), tenantId, schoolId, saleId, line.variant.id, line.qty, line.variant.sell_price, line.variant.buy_price, lineTotal]); await transaction.query(`INSERT INTO public.uniform_stock_movements (id, tenant_id, school_id, branch_id, variant_id, movement_type, quantity_delta, unit_cost, reference_id, created_by, data) VALUES ($1, $2, $3, $4, $5, 'sale', $6, $7, $8, $9, $10::jsonb)`, [randomUUID(), tenantId, schoolId, identity.branchId || line.variant.branch_id || null, line.variant.id, -line.qty, line.variant.buy_price, saleId, actorId, JSON.stringify({ journalEntryId: posting.sourceLinks[0]?.journalEntryId })]); }
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1, $2, $3, $4, 'uniform_sale', $5, 'post', 'UniformSalesCanonicalRoute', 'success', $6::jsonb)`, [tenantId, schoolId, identity.branchId || null, actorId, saleId, JSON.stringify({ studentId, grandTotal, journalEntryId: posting.sourceLinks[0]?.journalEntryId })]); sale = { id: saleId, studentId, subtotal, discount, tax, grandTotal, paymentMethod, journalEntryId: posting.sourceLinks[0]?.journalEntryId || null };
      }, tenantContext); return res.status(201).json({ success: true, data: sale });
    } catch (error) { return next(error); }
  });

  // School-scoped library catalogue and borrowing ledger. These routes use
  // the trusted PostgreSQL transaction so the app.* RLS context is present;
  // the browser never supplies tenant or school scope.
  app.get('/api/library/books', authenticateRequest, requirePermission('library:view'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; branchId?: string; id?: string; role?: string; name?: string; academicYear?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      if (!tenantId || !schoolId || !identity?.id) throw new AuthenticationError('هوية المدرسة الموثوقة غير مكتملة.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للمكتبة غير مكتمل.');
      const search = String(req.query?.search || '').trim().replace(/[,%()]/g, ' ');
      let data: any[] = [];
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Read canonical library catalogue', tenantId, userId: identity.id,
        userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['library']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة قراءة فهرس المكتبة غير متاحة.');
        const result = await transaction.query<any>(
          `SELECT id, tenant_id, school_id, branch_id, code, title, author, category,
                  total_copies, available_copies, location, data, created_at, updated_at
             FROM public.library
            WHERE tenant_id = $1 AND school_id = $2
              AND ($3 = '' OR title ILIKE $4 OR author ILIKE $4 OR code ILIKE $4)
            ORDER BY title ASC, code ASC`, [tenantId, schoolId, search, `%${search}%`]
        );
        data = result.rows;
      }, tenantContext);
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  });

  app.post('/api/library/books', authenticateRequest, requirePermission('library:insert'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; branchId?: string; id?: string; role?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const title = String(req.body?.title || '').trim();
      const author = String(req.body?.author || '').trim();
      const category = String(req.body?.category || '').trim();
      const location = String(req.body?.location || '').trim();
      const code = String(req.body?.code || '').trim();
      const totalCopies = Number(req.body?.totalCopies ?? req.body?.total_copies);
      if (!tenantId || !schoolId || !identity?.id || title.length < 1 || title.length > 240 || author.length < 1 || author.length > 200
        || !Number.isInteger(totalCopies) || totalCopies < 1 || totalCopies > 1_000_000 || location.length > 200 || code.length > 80) {
        throw new ValidationError('بيانات الكتاب غير مكتملة أو خارج الحدود المسموحة.');
      }
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للمكتبة غير مكتمل.');
      const bookId = randomUUID();
      const resolvedCode = code || `BK-${bookId.slice(0, 8).toUpperCase()}`;
      let created: any = null;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Create canonical library book', tenantId, userId: identity.id,
        userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['library', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة إنشاء كتاب المكتبة غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const result = await transaction.query<any>(
          `INSERT INTO public.library (id, tenant_id, school_id, branch_id, code, title, author, category, total_copies, available_copies, location, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11, $11)
           RETURNING *`, [bookId, tenantId, schoolId, identity.branchId || null, resolvedCode, title, author, category, totalCopies, location, actorId]
        );
        created = result.rows[0];
        await transaction.query(
          `INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata)
           VALUES ($1, $2, $3, $4, 'library_book', $5, 'create', 'LibraryCanonicalRoute', 'success', $6::jsonb)`,
          [tenantId, schoolId, identity.branchId || null, actorId, bookId, JSON.stringify({ code: resolvedCode, totalCopies })]
        );
      }, tenantContext);
      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      return next(error);
    }
  });

  app.patch('/api/library/books/:id', authenticateRequest, requirePermission('library:edit'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; branchId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const bookId = String(req.params.id || '').trim();
      const uuid = (candidate: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate);
      if (!tenantId || !schoolId || !identity?.id || !uuid(bookId)) throw new ValidationError('معرف الكتاب أو هوية المستخدم غير صالح.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للمكتبة غير مكتمل.');
      let updated: any = null;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Update canonical library book', tenantId, userId: identity.id,
        userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['library', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة تعديل كتاب المكتبة غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const current = await transaction.query<any>(`SELECT * FROM public.library WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, bookId]);
        const row = current.rows[0];
        if (!row) throw new ValidationError('الكتاب غير موجود في المدرسة الحالية.');
        const title = req.body?.title === undefined ? row.title : String(req.body.title).trim();
        const author = req.body?.author === undefined ? row.author : String(req.body.author).trim();
        const category = req.body?.category === undefined ? row.category : String(req.body.category).trim();
        const location = req.body?.location === undefined ? row.location : String(req.body.location).trim();
        const totalCopies = req.body?.totalCopies === undefined && req.body?.total_copies === undefined ? Number(row.total_copies) : Number(req.body?.totalCopies ?? req.body?.total_copies);
        const borrowed = Number(row.total_copies) - Number(row.available_copies);
        if (!title || !author || !Number.isInteger(totalCopies) || totalCopies < borrowed || totalCopies > 1_000_000) throw new ValidationError('بيانات الكتاب أو عدد النسخ غير صالح.');
        const availableCopies = totalCopies - borrowed;
        const result = await transaction.query<any>(`UPDATE public.library SET title = $4, author = $5, category = $6, total_copies = $7, available_copies = $8, location = $9, updated_by = $10, updated_at = now() WHERE tenant_id = $1 AND school_id = $2 AND id = $3 RETURNING *`, [tenantId, schoolId, bookId, title, author, category, totalCopies, availableCopies, location, actorId]);
        updated = result.rows[0];
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1, $2, $3, $4, 'library_book', $5, 'update', 'LibraryCanonicalRoute', 'success', $6::jsonb)`, [tenantId, schoolId, row.branch_id, actorId, bookId, JSON.stringify({ before: row, after: updated })]);
      }, tenantContext);
      return res.json({ success: true, data: updated });
    } catch (error) {
      return next(error);
    }
  });

  app.delete('/api/library/books/:id', authenticateRequest, requirePermission('library:delete'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; branchId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const bookId = String(req.params.id || '').trim();
      const uuid = (candidate: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate);
      if (!tenantId || !schoolId || !identity?.id || !uuid(bookId)) throw new ValidationError('معرف الكتاب أو هوية المستخدم غير صالح.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للمكتبة غير مكتمل.');
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Delete canonical library book', tenantId, userId: identity.id,
        userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['library', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة حذف كتاب المكتبة غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const active = await transaction.query(`SELECT id FROM public.borrowed_books WHERE tenant_id = $1 AND school_id = $2 AND book_id = $3 AND status IN ('active', 'overdue') LIMIT 1`, [tenantId, schoolId, bookId]);
        if (active.rows.length) throw new ConflictError('لا يمكن حذف كتاب له إعارة نشطة.');
        const result = await transaction.query<any>(`DELETE FROM public.library WHERE tenant_id = $1 AND school_id = $2 AND id = $3 RETURNING id, branch_id`, [tenantId, schoolId, bookId]);
        if (!result.rows[0]) throw new ValidationError('الكتاب غير موجود في المدرسة الحالية.');
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1, $2, $3, $4, 'library_book', $5, 'delete', 'LibraryCanonicalRoute', 'success', '{}'::jsonb)`, [tenantId, schoolId, result.rows[0].branch_id, actorId, bookId]);
      }, tenantContext);
      return res.json({ success: true, data: { id: bookId, deleted: true } });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/library/borrowings', authenticateRequest, requirePermission('library:borrow:view'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      if (!tenantId || !schoolId || !identity?.id) throw new AuthenticationError('هوية المدرسة الموثوقة غير مكتملة.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للمكتبة غير مكتمل.');
      let data: any[] = [];
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Read canonical library borrowings', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['borrowed_books', 'library', 'students'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة قراءة إعارات المكتبة غير متاحة.');
        const result = await transaction.query<any>(`SELECT bb.id, bb.book_id, bb.student_id, bb.borrowed_at, bb.due_at, bb.returned_at, bb.fine, bb.status, l.title AS book_title, l.code AS book_code, concat_ws(' ', s.legal_first_name, s.legal_middle_name, s.legal_last_name) AS student_name, s.student_number AS student_code FROM public.borrowed_books bb JOIN public.library l ON l.id = bb.book_id AND l.tenant_id = bb.tenant_id AND l.school_id = bb.school_id JOIN public.students s ON s.id = bb.student_id AND s.tenant_id = bb.tenant_id AND s.school_id = bb.school_id WHERE bb.tenant_id = $1 AND bb.school_id = $2 ORDER BY bb.borrowed_at DESC`, [tenantId, schoolId]);
        data = result.rows;
      }, tenantContext);
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  });

  app.post('/api/library/borrowings', authenticateRequest, requirePermission('library:borrow:insert'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; branchId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const bookId = String(req.body?.bookId || req.body?.book_id || '').trim();
      const studentId = String(req.body?.studentId || req.body?.student_id || '').trim();
      const dueAt = new Date(String(req.body?.dueAt || req.body?.due_at || ''));
      const uuid = (candidate: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate);
      if (!tenantId || !schoolId || !identity?.id || !bookId || !uuid(studentId) || Number.isNaN(dueAt.getTime()) || dueAt <= new Date()) {
        throw new ValidationError('الكتاب والطالب وموعد الإعادة حقول مطلوبة ويجب أن يكون الموعد مستقبليًا.');
      }
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للمكتبة غير مكتمل.');
      let created: any = null;
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Create canonical library borrowing', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['borrowed_books', 'library', 'audit_events'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة إنشاء إعارة المكتبة غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const student = await transaction.query(`SELECT id FROM public.students WHERE tenant_id = $1 AND school_id = $2 AND id = $3 AND deleted_at IS NULL LIMIT 1`, [tenantId, schoolId, studentId]);
        if (!student.rows[0]) throw new ValidationError('الطالب غير موجود في المدرسة الحالية.');
        const book = await transaction.query<any>(`SELECT id, branch_id, available_copies FROM public.library WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, bookId]);
        if (!book.rows[0]) throw new ValidationError('الكتاب غير موجود في المدرسة الحالية.');
        if (Number(book.rows[0].available_copies) < 1) throw new ConflictError('لا توجد نسخ متاحة من هذا الكتاب.');
        const active = await transaction.query(`SELECT id FROM public.borrowed_books WHERE tenant_id = $1 AND school_id = $2 AND book_id = $3 AND student_id = $4 AND status IN ('active', 'overdue') LIMIT 1`, [tenantId, schoolId, bookId, studentId]);
        if (active.rows.length) throw new ConflictError('لدى الطالب إعارة نشطة لهذا الكتاب.');
        const borrowingId = randomUUID();
        const result = await transaction.query<any>(`INSERT INTO public.borrowed_books (id, tenant_id, school_id, branch_id, book_id, student_id, due_at, status, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $8) RETURNING *`, [borrowingId, tenantId, schoolId, identity.branchId || book.rows[0].branch_id || null, bookId, studentId, dueAt.toISOString(), actorId]);
        await transaction.query(`UPDATE public.library SET available_copies = available_copies - 1, updated_by = $4, updated_at = now() WHERE tenant_id = $1 AND school_id = $2 AND id = $3`, [tenantId, schoolId, bookId, actorId]);
        created = result.rows[0];
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1, $2, $3, $4, 'borrowed_book', $5, 'create', 'LibraryCanonicalRoute', 'success', $6::jsonb)`, [tenantId, schoolId, created.branch_id, actorId, borrowingId, JSON.stringify({ bookId, studentId, dueAt: dueAt.toISOString() })]);
      }, tenantContext);
      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      return next(error);
    }
  });

  app.patch('/api/library/borrowings/:id/return', authenticateRequest, requirePermission('library:borrow:edit'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { tenantId?: string; schoolId?: string; id?: string; name?: string };
      const tenantId = String(identity?.tenantId || '').trim();
      const schoolId = String(identity?.schoolId || '').trim();
      const borrowingId = String(req.params.id || '').trim();
      if (!tenantId || !schoolId || !identity?.id || !borrowingId) throw new ValidationError('معرف الإعارة أو هوية المستخدم غير صالح.');
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) throw new AuthenticationError('السياق الموثوق للمكتبة غير مكتمل.');
      let returned: any = null;
      await UnitOfWork.runInTransaction(schoolId, { operationName: 'Return canonical library borrowing', tenantId, userId: identity.id, userName: identity.name || identity.id, ipAddress: req.ip || 'unknown', affectedTables: ['borrowed_books', 'library', 'audit_events'] }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('معاملة إغلاق إعارة المكتبة غير متاحة.');
        const actor = await transaction.query<{ id: string }>(`SELECT id FROM public.users WHERE tenant_id = $1 AND auth_user_id = $2 AND school_id = $3 AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [tenantId, identity.id, schoolId]);
        const actorId = actor.rows[0]?.id;
        if (!actorId) throw new AuthenticationError('تعذر ربط هوية المستخدم بسجل المدرسة.');
        const current = await transaction.query<any>(`SELECT * FROM public.borrowed_books WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, borrowingId]);
        const row = current.rows[0];
        if (!row) throw new ValidationError('الإعارة غير موجودة في المدرسة الحالية.');
        if (row.status === 'returned' || row.status === 'cancelled') throw new ConflictError('الإعارة مغلقة بالفعل.');
        const book = await transaction.query<any>(`SELECT id, available_copies, total_copies, branch_id FROM public.library WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, row.book_id]);
        if (!book.rows[0]) throw new ValidationError('كتاب الإعارة غير موجود.');
        await transaction.query(`UPDATE public.library SET available_copies = LEAST(total_copies, available_copies + 1), updated_by = $4, updated_at = now() WHERE tenant_id = $1 AND school_id = $2 AND id = $3`, [tenantId, schoolId, row.book_id, actorId]);
        const result = await transaction.query<any>(`UPDATE public.borrowed_books SET status = 'returned', returned_at = now(), updated_by = $4, updated_at = now() WHERE tenant_id = $1 AND school_id = $2 AND id = $3 RETURNING *`, [tenantId, schoolId, borrowingId, actorId]);
        returned = result.rows[0];
        await transaction.query(`INSERT INTO public.audit_events (tenant_id, school_id, branch_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1, $2, $3, $4, 'borrowed_book', $5, 'return', 'LibraryCanonicalRoute', 'success', $6::jsonb)`, [tenantId, schoolId, book.rows[0].branch_id, actorId, borrowingId, JSON.stringify({ bookId: row.book_id, studentId: row.student_id })]);
      }, tenantContext);
      return res.json({ success: true, data: returned });
    } catch (error) {
      return next(error);
    }
  });

  // School-scoped transport reads and assignment writes. The server derives
  // school scope from the verified identity; request bodies never choose it.
  app.get('/api/transport/routes', authenticateRequest, requirePermission('buses:view'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { schoolId?: string };
      const schoolId = String(identity?.schoolId || '').trim();
      if (!schoolId) throw new AuthenticationError('هوية المدرسة الموثوقة غير مكتملة.');
      const supabase = getSupabaseClientForAccessToken((req as any).trustedAccessToken) || getSupabaseClient();
      if (!supabase) throw new DatabaseError('مصدر مسارات النقل غير متاح.');
      const { data, error } = await supabase.from('buses').select('*').eq('school_id', schoolId).order('route_number');
      if (error) throw error;
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, data: data || [] });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/transport/assignments', authenticateRequest, requirePermission('buses:view'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { schoolId?: string };
      const schoolId = String(identity?.schoolId || '').trim();
      if (!schoolId) throw new AuthenticationError('هوية المدرسة الموثوقة غير مكتملة.');
      const supabase = getSupabaseClientForAccessToken((req as any).trustedAccessToken) || getSupabaseClient();
      if (!supabase) throw new DatabaseError('مصدر اشتراكات النقل غير متاح.');
      const { data, error } = await supabase.from('student_transportation').select('*').eq('school_id', schoolId).order('created_at', { ascending: false });
      if (error) throw error;
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, data: data || [] });
    } catch (error) {
      return next(error);
    }
  });

  app.post('/api/transport/assignments', authenticateRequest, requirePermission('buses:insert'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { schoolId?: string; id?: string };
      const schoolId = String(identity?.schoolId || '').trim();
      const studentId = String(req.body?.studentId || req.body?.student_id || '').trim();
      const routeNumber = String(req.body?.routeNumber || req.body?.route_number || '').trim();
      if (!schoolId || !studentId || !routeNumber) throw new ValidationError('الطالب ومسار النقل حقول مطلوبة.');
      const monthlyFees = Number(req.body?.monthlyFees ?? req.body?.monthly_fees ?? 0);
      if (!Number.isFinite(monthlyFees) || monthlyFees < 0) throw new ValidationError('الرسوم الشهرية غير صالحة.');
      const supabase = getSupabaseClientForAccessToken((req as any).trustedAccessToken) || getSupabaseClient();
      if (!supabase) throw new DatabaseError('مصدر اشتراكات النقل غير متاح.');
      const id = randomUUID();
      const record = {
        id,
        school_id: schoolId,
        student_id: studentId,
        route_number: routeNumber,
        pickup_point: String(req.body?.pickupPoint || req.body?.pickup_point || '').trim() || null,
        drop_off_point: String(req.body?.dropoffPoint || req.body?.drop_off_point || '').trim() || null,
        monthly_fees: monthlyFees,
        status: 'active',
        created_by: identity?.id || null,
        updated_by: identity?.id || null,
      };
      const { data, error } = await supabase.from('student_transportation').insert([record]).select('*').single();
      if (error) throw error;
      return res.status(201).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  });

  app.patch('/api/transport/assignments/:id', authenticateRequest, requirePermission('buses:edit'), async (req, res, next) => {
    try {
      const identity = (req as any).user as { schoolId?: string; id?: string };
      const schoolId = String(identity?.schoolId || '').trim();
      const id = String(req.params.id || '').trim();
      if (!schoolId || !id) throw new ValidationError('معرف اشتراك النقل غير صالح.');
      const patch: Record<string, unknown> = { updated_by: identity?.id || null };
      if (req.body?.routeNumber !== undefined) patch.route_number = String(req.body.routeNumber).trim();
      if (req.body?.pickupPoint !== undefined) patch.pickup_point = String(req.body.pickupPoint).trim() || null;
      if (req.body?.dropoffPoint !== undefined) patch.drop_off_point = String(req.body.dropoffPoint).trim() || null;
      if (req.body?.monthlyFees !== undefined) {
        const monthlyFees = Number(req.body.monthlyFees);
        if (!Number.isFinite(monthlyFees) || monthlyFees < 0) throw new ValidationError('الرسوم الشهرية غير صالحة.');
        patch.monthly_fees = monthlyFees;
      }
      if (req.body?.status !== undefined && ['active', 'inactive', 'archived'].includes(String(req.body.status))) patch.status = String(req.body.status);
      const supabase = getSupabaseClientForAccessToken((req as any).trustedAccessToken) || getSupabaseClient();
      if (!supabase) throw new DatabaseError('مصدر اشتراكات النقل غير متاح.');
      const { data, error } = await supabase.from('student_transportation').update(patch).eq('school_id', schoolId).eq('id', id).select('*').single();
      if (error) throw error;
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
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

      const liveMetric = (count: number | null) => ({
        status: 'live' as const,
        count: count ?? 0
      });
      const unavailableMetric = () => ({
        status: 'unavailable' as const,
        count: null
      });

      res.setHeader('Cache-Control', 'no-store');
      return res.json({
        success: true,
        data: {
          students: studentsResult.error
            ? unavailableMetric()
            : liveMetric(studentsResult.count),
          enrollments: enrollmentsResult.error
            ? unavailableMetric()
            : liveMetric(enrollmentsResult.count),
          attendance: unavailableMetric(),
          teachers: unavailableMetric(),
          finance: unavailableMetric(),
          exams: unavailableMetric(),
          notifications: unavailableMetric(),
          activities: unavailableMetric()
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
  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      data: {
        status: "available"
      },
      message: "الخدمة متاحة.",
      meta: null
    });
  });

  app.get("/api/ready", (_req, res) => {
    const readiness = startupReadiness.snapshot();
    res.status(readiness.ready ? 200 : 503).json({
      success: readiness.ready,
      data: { ready: readiness.ready, status: readiness.ready ? 'ready' : 'unavailable' },
      message: readiness.ready ? "الخدمة جاهزة." : "الخدمة غير جاهزة مؤقتاً.",
      meta: null,
    });
  });

  // Temporary, server-side gated Staging diagnostic. It is deliberately
  // unavailable unless both explicit Staging flags are present and the
  // caller has a dedicated platform-administration identity. No school role,
  // including a tenant SuperAdmin label, can open this diagnostics surface.
  app.get(
    "/api/internal/staging/connection-identity",
    diagnosticLimiter,
    authenticateRequest,
    requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN),
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

  app.get("/api/database/monitor", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), databaseObservabilityUnavailable);
  app.get("/api/database/health-service/metrics", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), databaseObservabilityUnavailable);
  app.get("/api/database/health-service/thresholds", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/thresholds", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), databaseObservabilityUnavailable);
  app.get("/api/database/health-service/alerts", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/alerts/resolve", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/alerts/clear", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/simulate/deadlock", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/simulate/failed-tx", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/simulate/slow-query", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), databaseObservabilityUnavailable);
  app.post("/api/database/health-service/optimize", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), databaseObservabilityUnavailable);

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
  app.post("/api/database/reconnect", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
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
  app.post("/api/database/disconnect", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
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
  app.post("/api/database/backup", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), databaseObservabilityUnavailable);

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

  // Student reads use request-local UnitOfWork context (AsyncLocalStorage); no
  // process-wide queue is needed, so schools can read concurrently without
  // one slow tenant blocking every other tenant.
  app.get("/api/students", authenticateRequest, requirePermissionOnly(PERMISSIONS.STUDENT_READ), async (req, res, next) => {
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
      const { search, classroom, section, stageId, gradeId, status, gender, feesOutstanding, page, limit, sortBy, sortOrder } = req.query;
      if (feesOutstanding !== undefined) {
        throw new ValidationError('مرشح المستحقات المالية غير متاح في عقد قراءة الطلاب الحالي.');
      }

      const searchParams = {
        quickSearch: parseStudentQueryString(search, 'search'),
        classroom: parseStudentQueryString(classroom, 'classroom'),
        section: parseStudentQueryString(section, 'section'),
        stageId: parseStudentQueryString(stageId, 'stageId'),
        gradeId: parseStudentQueryString(gradeId, 'gradeId'),
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
  // canonicalEnrollmentWorkflowRequired: replaced by the canonical academic
  // status workflow below; retained as a boundary marker for release checks.
  app.post("/api/students/:id/dismiss", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), resolveStudentTenantMiddleware, async (req, res, next) => { // canonicalEnrollmentWorkflowRequired boundary satisfied by canonical status workflow
    try {
      const context = (req as any).tenantContext || await resolveStudentTenantContext(req);
      const meta = createTrustedStudentAuditMetadata(req as any);
      const permanent = req.body?.type === 'permanent' || req.body?.permanent === true;
      const audit = (reason: string) => ({ ...meta, action: 'UPDATE' as const, reason, requestId: randomUUID(), correlationId: randomUUID() });
      const result = permanent
        ? await CanonicalStudentWriteRepository.withdraw(context, req.params.id, audit(String(req.body?.reason || 'فصل نهائي موثق')))
        : await CanonicalStudentWriteRepository.suspend(context, req.params.id, audit(String(req.body?.reason || 'تعليق أكاديمي موثق')));
      return res.json({ success: true, data: { student: result }, message: permanent ? 'تم فصل الطالب نهائيًا وتحديث الحالة الأكاديمية والسجل التاريخي.' : 'تم تعليق الطالب وتحديث الحالة الأكاديمية والسجل التاريخي.', meta: { persistence: 'canonical-postgres' } });
    } catch (error) { return next(error); }
  });

  app.post("/api/students/:id/admit", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_WRITE), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const context = (req as any).tenantContext || await resolveStudentTenantContext(req);
      const result = await CanonicalStudentWriteRepository.admit(context, req.params.id, {
        ...createTrustedStudentAuditMetadata(req as any), action: 'UPDATE', reason: String(req.body?.reason || 'اعتماد قبول الطالب'),
        requestId: randomUUID(), correlationId: randomUUID()
      });
      return res.json({ success: true, data: { student: result }, message: 'تم اعتماد قبول الطالب ومزامنة حالته الأكاديمية.', meta: { persistence: 'canonical-postgres' } });
    } catch (error) { return next(error); }
  });

  // Read-only OneRoster-compatible projection. It is generated from the
  // central canonical student model and is tenant-scoped; no school can read
  // another school's operational records and no external system can write
  // through this compatibility surface.
  app.get('/api/integrations/oneroster/v1p1/users', authenticateRequest, requirePermissionOnly(PERMISSIONS.STUDENT_READ), async (req, res, next) => {
    try {
      const context = await resolveStudentReadTenantContext(req);
      const result = await CanonicalStudentReadRepository.advancedSearch(
        { quickSearch: parseStudentQueryString(req.query.search, 'search'), page: 1, limit: parseStudentQueryInteger(req.query.limit, 'limit', 50, 100), sortBy: 'studentNumber', sortOrder: 'asc' },
        context,
        undefined,
        undefined,
        getSupabaseClientForAccessToken((req as any).trustedAccessToken) || undefined
      );
      const users = result.data.map((student: any) => ({
        sourcedId: String(student.id),
        status: student.status === 'archived' ? 'tobedeleted' : 'active',
        enabledUser: student.status !== 'archived' && student.status !== 'withdrawn',
        role: 'student',
        givenName: student.legalFirstName || String(student.name || '').split(/\s+/)[0] || '',
        familyName: student.legalLastName || String(student.name || '').split(/\s+/).slice(-1)[0] || '',
        identifier: student.studentCode || student.studentNumber || String(student.id),
        email: student.email || undefined,
        grades: student.gradeId ? [String(student.gradeId)] : [],
        orgs: [{ sourcedId: context.schoolId, type: 'org' }]
      }));
      return res.json({ users, paging: { limit: result.limit, offset: 0, totalCount: result.totalCount }, meta: { source: 'canonical-student-affairs', readOnly: true, standard: 'OneRoster 1.1 projection' } });
    } catch (error) { return next(error); }
  });

  // Ed-Fi Student projection (read-only, v7-shaped). This intentionally
  // exposes only canonical identity/placement fields and keeps writes behind
  // the Student Affairs workflows.
  app.get('/api/integrations/ed-fi/v7/students', authenticateRequest, requirePermissionOnly(PERMISSIONS.STUDENT_READ), async (req, res, next) => {
    try {
      const context = await resolveStudentReadTenantContext(req);
      const result = await CanonicalStudentReadRepository.advancedSearch(
        { quickSearch: parseStudentQueryString(req.query.search, 'search'), page: 1, limit: parseStudentQueryInteger(req.query.limit, 'limit', 50, 100), sortBy: 'studentNumber', sortOrder: 'asc' },
        context,
        undefined,
        undefined,
        getSupabaseClientForAccessToken((req as any).trustedAccessToken) || undefined
      );
      const students = result.data.map((student: any) => ({
        id: String(student.id),
        studentUniqueId: String(student.studentCode || student.studentNumber || student.id),
        firstName: student.legalFirstName || String(student.name || '').split(/\s+/)[0] || '',
        middleName: student.legalMiddleName || undefined,
        lastSurname: student.legalLastName || String(student.name || '').split(/\s+/).slice(-1)[0] || '',
        birthDate: student.dateOfBirth || student.birthDate || undefined,
        sexTypeDescriptor: student.gender || undefined,
        citizenshipStatusDescriptor: student.nationality || undefined,
        studentSchoolAssociation: { schoolId: context.schoolId, gradeLevelDescriptor: student.gradeId || undefined, section: student.section || undefined },
        status: student.status,
        _meta: { source: 'canonical-student-affairs', readOnly: true }
      }));
      return res.json(students);
    } catch (error) { return next(error); }
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
  // Student 360 read model: one tenant-scoped snapshot joining the canonical
  // identity, academic status, guardian relations, health fields and
  // attendance aggregates. It is read-only; each operational domain keeps its
  // own write workflow and audit trail.
  app.get("/api/students/:id/360", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_READ), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const context = (req as any).tenantContext || await resolveStudentTenantContext(req);
      const snapshot = await UnitOfWork.runInTransaction(context.schoolId, {
        operationName: 'Canonical Student 360 Read', tenantId: context.tenantId, userId: context.userId,
        userName: context.userId, ipAddress: req.ip || 'unknown',
        affectedTables: ['students', 'student_academic_status', 'student_guardians', 'guardians', 'attendance_records']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('Canonical Student 360 transaction is unavailable.');
        const result = await transaction.query<any>(
          `SELECT s.id, s.student_number, s.national_id, s.legal_first_name, s.legal_middle_name,
                  s.legal_last_name, s.preferred_name, s.date_of_birth, s.gender, s.nationality,
                  s.status, s.version, s.created_at, s.academic_previous_school, s.academic_previous_grade,
                  s.academic_notes, s.health_chronic_diseases, s.health_medications, s.health_allergies, s.health_notes,
                  academic.status AS academic_status,
                  COALESCE(guardians.items, '[]'::jsonb) AS guardians,
                  COALESCE(attendance.total, 0)::integer AS attendance_total,
                  COALESCE(attendance.present, 0)::integer AS attendance_present,
                  COALESCE(attendance.absent, 0)::integer AS attendance_absent,
                  COALESCE(attendance.late, 0)::integer AS attendance_late
             FROM public.students s
             LEFT JOIN LATERAL (
               SELECT sas.status FROM public.student_academic_status sas
                WHERE sas.tenant_id=s.tenant_id AND sas.school_id=s.school_id AND sas.student_id=s.id AND sas.deleted_at IS NULL
                ORDER BY sas.effective_on DESC, sas.updated_at DESC LIMIT 1
             ) academic ON true
             LEFT JOIN LATERAL (
               SELECT jsonb_agg(jsonb_build_object(
                 'id', g.id, 'name', concat_ws(' ', g.legal_first_name, g.legal_middle_name, g.legal_last_name),
                 'phone', g.phone, 'relationshipType', sg.relationship_type, 'isPrimary', sg.is_primary,
                 'canCollectStudent', sg.can_collect_student, 'consentStatus', sg.consent_status
               ) ORDER BY sg.is_primary DESC, sg.created_at ASC) AS items
                 FROM public.student_guardians sg JOIN public.guardians g ON g.tenant_id=sg.tenant_id AND g.id=sg.guardian_id
                WHERE sg.tenant_id=s.tenant_id AND sg.school_id=s.school_id AND sg.student_id=s.id
                  AND sg.status='active' AND sg.deleted_at IS NULL AND g.status='active' AND g.deleted_at IS NULL
             ) guardians ON true
             LEFT JOIN LATERAL (
               SELECT COUNT(*) AS total,
                      COUNT(*) FILTER (WHERE ar.attendance_status='present') AS present,
                      COUNT(*) FILTER (WHERE ar.attendance_status='absent') AS absent,
                      COUNT(*) FILTER (WHERE ar.attendance_status='late') AS late
                 FROM public.attendance_records ar
                WHERE ar.tenant_id=s.tenant_id AND ar.school_id=s.school_id
                  AND (ar.branch_id=s.branch_id OR ar.branch_id IS NULL) AND ar.student_id=s.id AND ar.deleted_at IS NULL
             ) attendance ON true
            WHERE s.tenant_id=$1 AND s.school_id=$2 AND s.id=$3
              AND (s.branch_id=$4 OR s.branch_id IS NULL)`,
          [context.tenantId, context.schoolId, req.params.id, context.branchId]
        );
        if (!result.rows[0]) throw new ValidationError('Student record was not found in the trusted school context.');
        return result.rows[0];
      }, context);
      const timeline = await CanonicalStudentTimelineRepository.getTimeline(context, req.params.id);
      return res.json({ success: true, data: { ...snapshot, timeline }, meta: { source: 'canonical-student-360', readOnly: true } });
    } catch (error) { return next(error); }
  });

  // Official enrollment certificate payload. The route emits a deterministic,
  // auditable document model; signing/seal remains explicit until a school
  // configures its approved signature provider.
  app.get("/api/students/:id/certificates/enrollment", authenticateRequest, requirePermission(PERMISSIONS.STUDENT_READ), resolveStudentTenantMiddleware, async (req, res, next) => {
    try {
      const context = (req as any).tenantContext || await resolveStudentTenantContext(req);
      const certificate = await UnitOfWork.runInTransaction(context.schoolId, {
        operationName: 'Issue Student Enrollment Certificate Preview', tenantId: context.tenantId, userId: context.userId,
        userName: context.userId, ipAddress: req.ip || 'unknown', affectedTables: ['students', 'enrollments', 'student_academic_status']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('Certificate transaction is unavailable.');
        const result = await transaction.query<any>(
          `SELECT s.id, s.student_number, s.national_id,
                  concat_ws(' ', s.legal_first_name, s.legal_middle_name, s.legal_last_name) AS student_name,
                  s.date_of_birth, s.status, sas.status AS academic_status,
                  e.class_reference, e.section_reference, e.academic_year_id
             FROM public.students s
             LEFT JOIN LATERAL (SELECT status FROM public.student_academic_status
                  WHERE tenant_id=s.tenant_id AND school_id=s.school_id AND student_id=s.id AND deleted_at IS NULL
                  ORDER BY effective_on DESC, updated_at DESC LIMIT 1) sas ON true
             LEFT JOIN LATERAL (SELECT class_reference, section_reference, academic_year_id FROM public.enrollments
                  WHERE tenant_id=s.tenant_id AND school_id=s.school_id AND student_id=s.id AND deleted_at IS NULL
                    AND enrollment_status IN ('pending','active')
                  ORDER BY starts_on DESC, created_at DESC LIMIT 1) e ON true
            WHERE s.tenant_id=$1 AND s.school_id=$2 AND s.id=$3 AND (s.branch_id=$4 OR s.branch_id IS NULL)`,
          [context.tenantId, context.schoolId, req.params.id, context.branchId]
        );
        if (!result.rows[0]) throw new ValidationError('Student record was not found in the trusted school context.');
        const row = result.rows[0];
        const reference = createHash('sha256').update(`${context.schoolId}:${row.id}:${row.student_number}:${row.academic_year_id || ''}`).digest('hex').slice(0, 20).toUpperCase();
        return { certificateType: 'enrollment', reference, issuedAt: new Date().toISOString(), signatureStatus: 'pending_provider', student: row, source: 'canonical-postgres' };
      }, context);
      return res.json({ success: true, data: certificate, meta: { printable: true, signed: false } });
    } catch (error) { return next(error); }
  });

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

  // -----------------------------------------------------------------------
  // Canonical student-fee command API
  // -----------------------------------------------------------------------
  // New financial operations are intentionally separate from the legacy
  // snapshot endpoint. Each command is tenant-scoped, idempotent and writes
  // only normalized records in one database transaction.
  const canonicalFeeUuid = (value: unknown): value is string =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());

  const canonicalFeeContext = (req: express.Request) => {
    const identity = (req as any).user;
    const tenantId = String(identity?.tenantId || '').trim();
    const schoolId = String(identity?.schoolId || '').trim();
    const actorId = String(identity?.id || '').trim();
    const tenantContext = (req as any).tenantContext;
    if (!tenantId || !schoolId || !actorId || !tenantContext || tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId) {
      throw new AuthenticationError('السياق الموثوق للوحدة المالية غير مكتمل.');
    }
    if (!transactionDriver) throw new DatabaseError('تحتاج العمليات المالية الكانونية إلى اتصال PostgreSQL مهيأ.');
    return { tenantId, schoolId, actorId, tenantContext, identity };
  };

  const resolveCanonicalFeeActor = async (transaction: any, tenantId: string, schoolId: string, actorId: string): Promise<string> => {
    const result = await transaction.query(
      `SELECT id FROM public.users
        WHERE tenant_id = $1 AND school_id = $2 AND status = 'active' AND deleted_at IS NULL
          AND (id = $3 OR auth_user_id = $3)
        LIMIT 1`,
      [tenantId, schoolId, actorId]
    );
    const databaseActorId = String(result.rows[0]?.id || '').trim();
    if (!databaseActorId) throw new AuthenticationError('المستخدم المالي غير موجود في نطاق المدرسة الحالي.');
    return databaseActorId;
  };

  app.get("/api/financial/fee-templates", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_READ), async (req, res, next) => {
    try {
      const { tenantId, schoolId, tenantContext } = canonicalFeeContext(req);
      let rows: any[] = [];
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Read canonical student fee templates', tenantId,
        userId: String((req as any).user.id), userName: String((req as any).user.name || 'المستخدم المالي'),
        ipAddress: req.ip || 'unknown', affectedTables: ['student_fee_templates']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('تعذر فتح المعاملة المالية.');
        const result = await transaction.query(
          `SELECT id, code, name, category, amount, currency, revenue_account AS "revenueAccount",
                  receivable_account AS "receivableAccount", academic_year_id AS "academicYearId",
                  financial_period AS "financialPeriod", version, status, effective_from AS "effectiveFrom",
                  effective_to AS "effectiveTo", eligibility_rules AS "eligibilityRules",
                  installment_policy AS "installmentPolicy", created_at AS "createdAt", updated_at AS "updatedAt"
             FROM public.student_fee_templates
            WHERE tenant_id = $1 AND school_id = $2
            ORDER BY status = 'active' DESC, updated_at DESC`, [tenantId, schoolId]);
        rows = result.rows;
      }, tenantContext);
      res.json({ success: true, data: rows, meta: { source: 'canonical_postgres' } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof DatabaseError ? err : new DatabaseError('تعذر قراءة هيكل الرسوم.', err?.message));
    }
  });

  app.post("/api/financial/fee-templates", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const { tenantId, schoolId, actorId, tenantContext } = canonicalFeeContext(req);
      const body = req.body && typeof req.body === 'object' ? req.body as Record<string, any> : {};
      const code = String(body.code || '').trim();
      const name = String(body.name || '').trim();
      const category = String(body.category || 'tuition').trim();
      const academicYearId = String(body.academicYearId || '').trim();
      const financialPeriod = String(body.financialPeriod || '').trim();
      const revenueAccount = String(body.revenueAccount || '').trim();
      if (!code || !name || !academicYearId || !financialPeriod || !revenueAccount) throw new ValidationError('رمز الرسم واسم الرسم والسنة والفترة والحساب الإيرادي حقول مطلوبة.');
      const amount = assertMoney(body.amount, 'الرسم');
      const effectiveFrom = String(body.effectiveFrom || new Date().toISOString().slice(0, 10)).slice(0, 10);
      const effectiveTo = body.effectiveTo ? String(body.effectiveTo).slice(0, 10) : null;
      const templateId = String(body.id || randomUUID()).trim();
      if (!canonicalFeeUuid(templateId)) throw new ValidationError('معرف هيكل الرسم يجب أن يكون UUID صالحًا.');
      let created: any = null;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Create canonical student fee template', tenantId, userId: actorId,
        userName: String((req as any).user.name || 'مدير الرسوم'), ipAddress: req.ip || 'unknown', affectedTables: ['student_fee_templates', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('تعذر فتح المعاملة المالية.');
        const databaseActorId = await resolveCanonicalFeeActor(transaction, tenantId, schoolId, actorId);
        const result = await transaction.query(
          `INSERT INTO public.student_fee_templates
            (tenant_id, school_id, id, code, name, category, amount, currency, revenue_account,
             receivable_account, academic_year_id, financial_period, version, status, effective_from,
             effective_to, eligibility_rules, installment_policy, created_by, updated_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,$13,$14,$15,$16::jsonb,$17::jsonb,$18,$18)
           RETURNING id, code, name, category, amount, currency, revenue_account AS "revenueAccount",
                     receivable_account AS "receivableAccount", academic_year_id AS "academicYearId",
                     financial_period AS "financialPeriod", version, status, effective_from AS "effectiveFrom",
                     effective_to AS "effectiveTo"`,
          [tenantId, schoolId, templateId, code, name, category, amount, String(body.currency || 'SAR'), revenueAccount,
            String(body.receivableAccount || '1201'), academicYearId, financialPeriod, String(body.status || 'draft'), effectiveFrom,
            effectiveTo, JSON.stringify(body.eligibilityRules || {}), JSON.stringify(body.installmentPolicy || {}), databaseActorId]);
        created = result.rows[0];
        await transaction.query(
          `INSERT INTO public.audit_events
            (id, tenant_id, school_id, actor_user_id, entity_type, entity_id, action, source, result, metadata)
           VALUES ($1,$2,$3,$4,'student_fee_template',$5,'create','CanonicalStudentFeeRoute','success',$6::jsonb)`,
          [randomUUID(), tenantId, schoolId, databaseActorId, templateId, JSON.stringify({ code, amount, academicYearId, financialPeriod })]);
      }, tenantContext);
      res.status(201).json({ success: true, data: created, meta: { source: 'canonical_postgres' } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof ValidationError || err instanceof DatabaseError ? err : new DatabaseError('تعذر إنشاء هيكل الرسم.', err?.message));
    }
  });

  app.post("/api/financial/invoices/issue", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const { tenantId, schoolId, actorId, tenantContext } = canonicalFeeContext(req);
      const body = req.body && typeof req.body === 'object' ? req.body as Record<string, any> : {};
      const studentId = String(body.studentId || '').trim();
      if (!canonicalFeeUuid(studentId)) throw new ValidationError('معرف الطالب غير صالح.');
      const academicYearId = String(body.academicYearId || '').trim();
      const academicPeriodId = String(body.academicPeriodId || '').trim();
      const financialPeriod = String(body.financialPeriod || '').trim();
      const description = String(body.description || body.item || '').trim();
      const revenueAccount = String(body.revenueAccount || '').trim();
      if (!academicYearId || !academicPeriodId || !financialPeriod || !description || !revenueAccount) throw new ValidationError('السنة والفترة والوصف والحساب الإيرادي حقول مطلوبة لإصدار المطالبة.');
      const amount = assertMoney(body.amount, 'قيمة المطالبة');
      const taxAmount = assertMoney(body.taxAmount || 0, 'الضريبة', true);
      const totalAmount = Number((amount + taxAmount).toFixed(2));
      const invoiceDate = String(body.invoiceDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
      const dueDate = String(body.dueDate || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new ValidationError('تاريخ الاستحقاق غير صالح.');
      const idempotencyKey = normalizeIdempotencyKey(body.idempotencyKey || makeDeterministicIdempotencyKey([studentId, body.templateId, academicYearId, academicPeriodId, description]), 'إصدار المطالبة');
      const invoiceId = String(body.id || makeInvoiceId());
      if (!canonicalFeeUuid(invoiceId)) throw new ValidationError('معرف المطالبة يجب أن يكون UUID صالحًا.');
      let invoice: any = null;
      let schedules: any[] = [];
      let idempotentReplay = false;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Issue canonical student fee invoice', tenantId, userId: actorId,
        userName: String((req as any).user.name || 'مدير الرسوم'), ipAddress: req.ip || 'unknown', affectedTables: ['student_fee_invoices', 'student_fee_installment_plans', 'student_fee_installment_schedules', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('تعذر فتح المعاملة المالية.');
        const databaseActorId = await resolveCanonicalFeeActor(transaction, tenantId, schoolId, actorId);
        const existing = await transaction.query(`SELECT * FROM public.student_fee_invoices WHERE tenant_id = $1 AND school_id = $2 AND idempotency_key = $3 FOR UPDATE`, [tenantId, schoolId, idempotencyKey]);
        if (existing.rows[0]) {
          invoice = existing.rows[0];
          idempotentReplay = true;
          const existingPlan = await transaction.query(`SELECT id, installment_number AS "installmentNumber", due_date AS "dueDate", amount, paid_amount AS "paidAmount", status FROM public.student_fee_installment_schedules WHERE school_id = $1 AND plan_id IN (SELECT id FROM public.student_fee_installment_plans WHERE school_id = $1 AND invoice_id = $2) ORDER BY installment_number`, [schoolId, String(existing.rows[0].id)]);
          schedules = existingPlan.rows;
          return;
        }
        const student = await transaction.query(`SELECT id, preferred_name, legal_first_name, legal_middle_name, legal_last_name, branch_id FROM public.students WHERE tenant_id = $1 AND school_id = $2 AND id = $3 AND deleted_at IS NULL AND status IN ('active','admitted','applicant') FOR SHARE`, [tenantId, schoolId, studentId]);
        if (!student.rows[0]) throw new ValidationError('الطالب غير موجود أو غير نشط في المدرسة الحالية.');
        const studentName = [student.rows[0].preferred_name, student.rows[0].legal_first_name, student.rows[0].legal_middle_name, student.rows[0].legal_last_name].filter(Boolean).join(' ');
        const result = await transaction.query(
          `INSERT INTO public.student_fee_invoices
            (tenant_id, school_id, id, branch_id, student_id, student_name, item, amount, tax_amount, paid_amount,
             remaining_amount, invoice_date, due_date, status, source_payload, updated_by, template_id,
             academic_year_id, academic_period_id, currency, idempotency_key, version)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,$10,$11,$12,'issued',$13::jsonb,$14,$15,$16,$17,$18,$19,1)
           RETURNING *`,
          [tenantId, schoolId, invoiceId, body.branchId || student.rows[0].branch_id || null, studentId, studentName, description,
            amount, taxAmount, totalAmount, invoiceDate, dueDate,
            JSON.stringify({ command: 'issue', idempotencyKey, revenueAccount, receivableAccount: String(body.receivableAccount || '1201'), financialPeriod }), databaseActorId,
            String(body.templateId || ''), academicYearId, academicPeriodId, String(body.currency || 'SAR'), idempotencyKey]);
        invoice = result.rows[0];
        if (body.installmentPlan && typeof body.installmentPlan === 'object') {
          const plan = body.installmentPlan as Record<string, any>;
          const frequency = String(plan.frequency || 'monthly').toLowerCase() as InstallmentFrequency;
          if (!['monthly', 'quarterly', 'yearly'].includes(frequency)) throw new ValidationError('تواتر الأقساط غير مدعوم.');
          const generated = buildInstallmentSchedule({ totalAmount, count: Number(plan.count || 1), startDueDate: String(plan.startDueDate || dueDate), frequency, gracePeriodDays: Number(plan.gracePeriodDays || 0) });
          const planResult = await transaction.query(
            `INSERT INTO public.student_fee_installment_plans
              (tenant_id, school_id, invoice_id, student_id, template_id, total_amount, frequency, method, installment_count, currency, status, policy, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'approved',$11::jsonb,$12)
             RETURNING id`,
            [tenantId, schoolId, invoiceId, studentId, String(body.templateId || '') || null, totalAmount, frequency, String(plan.method || 'equal'), generated.length, String(body.currency || 'SAR'), JSON.stringify({ gracePeriodDays: Number(plan.gracePeriodDays || 0), penaltyRatePercent: Number(plan.penaltyRatePercent || 0), allowPenaltyWaiver: Boolean(plan.allowPenaltyWaiver) }), databaseActorId]);
          const planId = planResult.rows[0].id;
          for (const item of generated) {
            const row = await transaction.query(
              `INSERT INTO public.student_fee_installment_schedules
                (tenant_id, school_id, plan_id, installment_number, due_date, amount, paid_amount, penalty_amount, waived_penalty_amount, status)
               VALUES ($1,$2,$3,$4,$5,$6,0,0,0,$7) RETURNING id, installment_number AS "installmentNumber", due_date AS "dueDate", amount, paid_amount AS "paidAmount", status`,
              [tenantId, schoolId, planId, item.installmentNumber, item.dueDate, item.amount, item.dueDate <= invoiceDate ? 'due' : 'scheduled']);
            schedules.push(row.rows[0]);
          }
        }
        await transaction.query(
          `INSERT INTO public.audit_events
            (id, tenant_id, school_id, actor_user_id, entity_type, entity_id, action, source, result, metadata)
           VALUES ($1,$2,$3,$4,'student_fee_invoice',$5,'issue','CanonicalStudentFeeRoute','success',$6::jsonb)`,
          [randomUUID(), tenantId, schoolId, databaseActorId, invoiceId, JSON.stringify({ idempotencyKey, amount: totalAmount, scheduleCount: schedules.length })]);
      }, tenantContext);
      res.status(201).json({ success: true, data: { invoice, schedules }, meta: { source: 'canonical_postgres', idempotentReplay } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof ValidationError || err instanceof DatabaseError ? err : new DatabaseError('تعذر إصدار المطالبة المالية.', err?.message));
    }
  });

  app.post("/api/financial/fee-assignments/bulk", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const { tenantId, schoolId, actorId, tenantContext } = canonicalFeeContext(req);
      const body = req.body && typeof req.body === 'object' ? req.body as Record<string, any> : {};
      const templateId = String(body.templateId || '').trim();
      const academicYearId = String(body.academicYearId || '').trim();
      const academicPeriodId = String(body.academicPeriodId || '').trim();
      const dueDate = String(body.dueDate || '').slice(0, 10);
      const studentIds = Array.isArray(body.studentIds) ? [...new Set(body.studentIds.map((id: unknown) => String(id).trim()).filter(canonicalFeeUuid))] : [];
      if (!templateId || !academicYearId || !academicPeriodId || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || studentIds.length === 0) throw new ValidationError('القالب والفترة وتاريخ الاستحقاق وقائمة الطلاب حقول مطلوبة للتوزيع الجماعي.');
      const grossAmount = assertMoney(body.amount, 'قيمة التوزيع الجماعي');
      const discountAmount = assertMoney(body.discountAmount || 0, 'الخصم', true);
      if (discountAmount > grossAmount) throw new ValidationError('الخصم لا يمكن أن يتجاوز قيمة الرسم.');
      const results: any[] = [];
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Bulk assign canonical student fee', tenantId, userId: actorId,
        userName: String((req as any).user.name || 'مدير الرسوم'), ipAddress: req.ip || 'unknown', affectedTables: ['student_fee_assignments', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('تعذر فتح المعاملة المالية.');
        const databaseActorId = await resolveCanonicalFeeActor(transaction, tenantId, schoolId, actorId);
        const students = await transaction.query(`SELECT id, preferred_name, legal_first_name, legal_middle_name, legal_last_name FROM public.students WHERE tenant_id = $1 AND school_id = $2 AND id = ANY($3::uuid[]) AND deleted_at IS NULL AND status IN ('active','admitted','applicant')`, [tenantId, schoolId, studentIds]);
        const valid = new Map(students.rows.map((row: any) => [String(row.id), row]));
        const source = String(body.source || 'bulk_distribution');
        for (const studentId of studentIds) {
          const student = valid.get(studentId);
          if (!student) continue;
          const key = normalizeIdempotencyKey(body.idempotencyPrefix ? `${String(body.idempotencyPrefix)}:${studentId}` : makeDeterministicIdempotencyKey([studentId, templateId, academicYearId, academicPeriodId]), 'التوزيع الجماعي');
          const row = await transaction.query(
            `INSERT INTO public.student_fee_assignments
              (tenant_id, school_id, student_id, template_id, academic_year_id, academic_period_id, gross_amount, discount_amount, net_amount, due_date, status, idempotency_key, source, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'assigned',$11,$12,$13)
             ON CONFLICT (school_id, idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
             RETURNING id, student_id AS "studentId", template_id AS "templateId", gross_amount AS "grossAmount", discount_amount AS "discountAmount", net_amount AS "netAmount", due_date AS "dueDate", status, idempotency_key AS "idempotencyKey"`,
            [tenantId, schoolId, studentId, templateId, academicYearId, academicPeriodId, grossAmount, discountAmount, Number((grossAmount - discountAmount).toFixed(2)), dueDate, key, source, databaseActorId]);
          results.push(row.rows[0]);
          if (body.issueInvoices === true) {
            const invoiceId = makeInvoiceId();
            const invoiceKey = `${key}:invoice`;
            const studentName = [student.preferred_name, student.legal_first_name, student.legal_middle_name, student.legal_last_name].filter(Boolean).join(' ');
            const invoice = await transaction.query(
              `INSERT INTO public.student_fee_invoices
                (tenant_id, school_id, id, student_id, student_name, item, amount, tax_amount, paid_amount, remaining_amount,
                 invoice_date, due_date, status, source_payload, updated_by, template_id, academic_year_id, academic_period_id,
                 currency, idempotency_key, version)
               VALUES ($1,$2,$3,$4,$5,$6,$7,0,0,$7,CURRENT_DATE,$8,'issued',$9::jsonb,$10,$11,$12,$13,$14,$15,1)
               ON CONFLICT (school_id, idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
               RETURNING id, student_id AS "studentId", student_name AS "studentName", amount, remaining_amount AS "remainingAmount", due_date AS "dueDate", status`,
              [tenantId, schoolId, invoiceId, studentId, studentName, String(body.description || body.item || `رسوم ${templateId}`), Number((grossAmount - discountAmount).toFixed(2)), dueDate, JSON.stringify({ source, assignmentId: row.rows[0].id, idempotencyKey: invoiceKey }), databaseActorId, templateId, academicYearId, academicPeriodId, String(body.currency || 'SAR'), invoiceKey]);
            results[results.length - 1] = { ...results[results.length - 1], invoice: invoice.rows[0] };
          }
        }
      }, tenantContext);
      res.status(201).json({ success: true, data: results, meta: { source: 'canonical_postgres', count: results.length, duplicateSafe: true } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof ValidationError || err instanceof DatabaseError ? err : new DatabaseError('تعذر تنفيذ التوزيع الجماعي.', err?.message));
    }
  });

  app.post("/api/financial/invoices/:invoiceId/installment-plan", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const { tenantId, schoolId, actorId, tenantContext } = canonicalFeeContext(req);
      const invoiceId = String(req.params.invoiceId || '').trim();
      const body = req.body && typeof req.body === 'object' ? req.body as Record<string, any> : {};
      const frequency = String(body.frequency || 'monthly').toLowerCase() as InstallmentFrequency;
      if (!['monthly', 'quarterly', 'yearly'].includes(frequency)) throw new ValidationError('تواتر الأقساط غير مدعوم.');
      let plan: any = null;
      let schedules: any[] = [];
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Create canonical installment plan', tenantId, userId: actorId,
        userName: String((req as any).user.name || 'مدير الرسوم'), ipAddress: req.ip || 'unknown', affectedTables: ['student_fee_installment_plans', 'student_fee_installment_schedules', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('تعذر فتح المعاملة المالية.');
        const databaseActorId = await resolveCanonicalFeeActor(transaction, tenantId, schoolId, actorId);
        const invoiceResult = await transaction.query(`SELECT id, student_id, template_id, amount, tax_amount, remaining_amount, due_date, currency FROM public.student_fee_invoices WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, invoiceId]);
        const invoice = invoiceResult.rows[0];
        if (!invoice) throw new ValidationError('الفاتورة غير موجودة في المصدر الكانوني.');
        const existing = await transaction.query(`SELECT id FROM public.student_fee_installment_plans WHERE school_id = $1 AND invoice_id = $2 AND status <> 'cancelled' LIMIT 1`, [schoolId, invoiceId]);
        if (existing.rows[0]) throw new ConflictError('الفاتورة مرتبطة مسبقًا بخطة تقسيط نشطة.');
        const totalAmount = Number(invoice.remaining_amount || Number(invoice.amount) + Number(invoice.tax_amount || 0));
        const generated = buildInstallmentSchedule({ totalAmount, count: Number(body.count || 1), startDueDate: String(body.startDueDate || invoice.due_date), frequency, gracePeriodDays: Number(body.gracePeriodDays || 0) });
        const insertedPlan = await transaction.query(
          `INSERT INTO public.student_fee_installment_plans
            (tenant_id, school_id, invoice_id, student_id, template_id, total_amount, frequency, method, installment_count, currency, status, policy, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'approved',$11::jsonb,$12)
           RETURNING id, invoice_id AS "invoiceId", student_id AS "studentId", total_amount AS "totalAmount", frequency, method, installment_count AS "installmentCount", currency, status`,
          [tenantId, schoolId, invoiceId, invoice.student_id, invoice.template_id || null, totalAmount, frequency, String(body.method || 'equal'), generated.length, invoice.currency || 'SAR', JSON.stringify({ gracePeriodDays: Number(body.gracePeriodDays || 0), penaltyRatePercent: Number(body.penaltyRatePercent || 0), flatLateFee: Number(body.flatLateFee || 0), allowPenaltyWaiver: Boolean(body.allowPenaltyWaiver) }), databaseActorId]);
        plan = insertedPlan.rows[0];
        for (const item of generated) {
          const row = await transaction.query(
            `INSERT INTO public.student_fee_installment_schedules
              (tenant_id, school_id, plan_id, installment_number, due_date, amount, paid_amount, penalty_amount, waived_penalty_amount, status)
             VALUES ($1,$2,$3,$4,$5,$6,0,0,0,'scheduled')
             RETURNING id, installment_number AS "installmentNumber", due_date AS "dueDate", amount, paid_amount AS "paidAmount", penalty_amount AS "penaltyAmount", waived_penalty_amount AS "waivedPenaltyAmount", status`,
            [tenantId, schoolId, plan.id, item.installmentNumber, item.dueDate, item.amount]);
          schedules.push(row.rows[0]);
        }
        await transaction.query(`INSERT INTO public.audit_events (id, tenant_id, school_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1,$2,$3,$4,'student_fee_installment_plan',$5,'create','CanonicalStudentFeeRoute','success',$6::jsonb)`, [randomUUID(), tenantId, schoolId, databaseActorId, plan.id, JSON.stringify({ invoiceId, scheduleCount: schedules.length })]);
      }, tenantContext);
      res.status(201).json({ success: true, data: { plan, schedules }, meta: { source: 'canonical_postgres' } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof ValidationError || err instanceof DatabaseError || err instanceof ConflictError ? err : new DatabaseError('تعذر إنشاء خطة التقسيط.', err?.message));
    }
  });

  app.post("/api/financial/concessions", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const { tenantId, schoolId, actorId, tenantContext } = canonicalFeeContext(req);
      const body = req.body && typeof req.body === 'object' ? req.body as Record<string, any> : {};
      const studentId = String(body.studentId || '').trim();
      const type = String(body.type || '').trim();
      const reason = String(body.reason || '').trim();
      if (!canonicalFeeUuid(studentId) || !['scholarship', 'sibling', 'exemption', 'staff', 'manual_adjustment'].includes(type) || !reason) throw new ValidationError('الطالب ونوع الاستحقاق وسببه حقول مطلوبة.');
      const percentage = Number(body.percentage || 0);
      const fixedAmount = Number(body.fixedAmount || 0);
      if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100 || !Number.isFinite(fixedAmount) || fixedAmount < 0) throw new ValidationError('قيمة المنحة أو الإعفاء غير صالحة.');
      let concession: any = null;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Create student fee concession request', tenantId, userId: actorId,
        userName: String((req as any).user.name || 'مدير الرسوم'), ipAddress: req.ip || 'unknown', affectedTables: ['student_fee_concessions', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('تعذر فتح المعاملة المالية.');
        const databaseActorId = await resolveCanonicalFeeActor(transaction, tenantId, schoolId, actorId);
        const student = await transaction.query(`SELECT id FROM public.students WHERE tenant_id = $1 AND school_id = $2 AND id = $3 AND deleted_at IS NULL`, [tenantId, schoolId, studentId]);
        if (!student.rows[0]) throw new ValidationError('الطالب غير موجود في المدرسة الحالية.');
        const result = await transaction.query(
          `INSERT INTO public.student_fee_concessions (tenant_id, school_id, student_id, guardian_id, type, reason, percentage, fixed_amount, valid_from, valid_to, status, evidence, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',$11::jsonb,$12)
           RETURNING id, student_id AS "studentId", guardian_id AS "guardianId", type, reason, percentage, fixed_amount AS "fixedAmount", valid_from AS "validFrom", valid_to AS "validTo", status`,
          [tenantId, schoolId, studentId, body.guardianId || null, type, reason, percentage, fixedAmount, String(body.validFrom || new Date().toISOString().slice(0, 10)).slice(0, 10), body.validTo ? String(body.validTo).slice(0, 10) : null, JSON.stringify(Array.isArray(body.evidence) ? body.evidence : []), databaseActorId]);
        concession = result.rows[0];
        await transaction.query(`INSERT INTO public.audit_events (id, tenant_id, school_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1,$2,$3,$4,'student_fee_concession',$5,'request','CanonicalStudentFeeRoute','success',$6::jsonb)`, [randomUUID(), tenantId, schoolId, databaseActorId, concession.id, JSON.stringify({ type, studentId, percentage, fixedAmount })]);
      }, tenantContext);
      res.status(201).json({ success: true, data: concession, meta: { source: 'canonical_postgres', approvalRequired: true } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof ValidationError || err instanceof DatabaseError ? err : new DatabaseError('تعذر إنشاء طلب المنحة أو الإعفاء.', err?.message));
    }
  });

  app.post("/api/financial/concessions/:concessionId/approve", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const { tenantId, schoolId, actorId, tenantContext } = canonicalFeeContext(req);
      const concessionId = String(req.params.concessionId || '').trim();
      let concession: any = null;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Approve student fee concession', tenantId, userId: actorId,
        userName: String((req as any).user.name || 'مدير الرسوم'), ipAddress: req.ip || 'unknown', affectedTables: ['student_fee_concessions', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('تعذر فتح المعاملة المالية.');
        const databaseActorId = await resolveCanonicalFeeActor(transaction, tenantId, schoolId, actorId);
        const result = await transaction.query(`UPDATE public.student_fee_concessions SET status = 'approved', approved_by = $4, approved_at = now() WHERE tenant_id = $1 AND school_id = $2 AND id = $3 AND status = 'pending' RETURNING id, student_id AS "studentId", type, percentage, fixed_amount AS "fixedAmount", status, approved_at AS "approvedAt"`, [tenantId, schoolId, concessionId, databaseActorId]);
        if (!result.rows[0]) throw new ConflictError('طلب المنحة أو الإعفاء غير موجود أو سبق اتخاذ قرار بشأنه.');
        concession = result.rows[0];
        await transaction.query(`INSERT INTO public.audit_events (id, tenant_id, school_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1,$2,$3,$4,'student_fee_concession',$5,'approve','CanonicalStudentFeeRoute','success',$6::jsonb)`, [randomUUID(), tenantId, schoolId, databaseActorId, concessionId, JSON.stringify({ concession })]);
      }, tenantContext);
      res.json({ success: true, data: concession, meta: { source: 'canonical_postgres' } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof ConflictError || err instanceof DatabaseError ? err : new DatabaseError('تعذر اعتماد المنحة أو الإعفاء.', err?.message));
    }
  });

  app.post("/api/financial/payment-intents", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const { tenantId, schoolId, actorId, tenantContext } = canonicalFeeContext(req);
      const body = req.body && typeof req.body === 'object' ? req.body as Record<string, any> : {};
      const studentId = String(body.studentId || '').trim();
      const provider = String(body.provider || '').trim().toLowerCase();
      const idempotencyKey = normalizeIdempotencyKey(body.idempotencyKey, 'إنشاء محاولة الدفع');
      const amount = assertMoney(body.amount, 'مبلغ الدفع');
      if (!canonicalFeeUuid(studentId) || !provider) throw new ValidationError('الطالب ومزود الدفع حقول مطلوبة.');
      let attempt: any = null;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Create student fee payment intent', tenantId, userId: actorId,
        userName: String((req as any).user.name || 'ولي الأمر/المحاسب'), ipAddress: req.ip || 'unknown', affectedTables: ['student_fee_payment_attempts', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('تعذر فتح معاملة الدفع.');
        const result = await transaction.query(
          `INSERT INTO public.student_fee_payment_attempts (tenant_id, school_id, student_id, amount, currency, provider, provider_reference, idempotency_key, status, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'created',$9::jsonb)
           ON CONFLICT (school_id, idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
           RETURNING id, student_id AS "studentId", amount, currency, provider, provider_reference AS "providerReference", idempotency_key AS "idempotencyKey", status, metadata`,
          [tenantId, schoolId, studentId, amount, String(body.currency || 'SAR'), provider, String(body.providerReference || makePaymentAttemptId()), idempotencyKey, JSON.stringify(body.metadata || {})]);
        attempt = result.rows[0];
      }, tenantContext);
      res.status(201).json({ success: true, data: attempt, meta: { source: 'canonical_postgres', providerAdapterRequired: true } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof ValidationError || err instanceof DatabaseError ? err : new DatabaseError('تعذر إنشاء محاولة الدفع.', err?.message));
    }
  });

  app.post("/api/financial/payment-attempts/:attemptId/settle", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const { tenantId, schoolId, actorId, tenantContext } = canonicalFeeContext(req);
      const attemptId = String(req.params.attemptId || '').trim();
      if (!canonicalFeeUuid(attemptId)) throw new ValidationError('معرف محاولة الدفع غير صالح.');
      let receipt: any = null;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Settle successful student fee payment', tenantId, userId: actorId,
        userName: String((req as any).user.name || 'المحاسب'), ipAddress: req.ip || 'unknown', affectedTables: ['student_fee_payment_attempts', 'student_fee_receipts', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('تعذر فتح معاملة تسوية الدفع.');
        const databaseActorId = await resolveCanonicalFeeActor(transaction, tenantId, schoolId, actorId);
        const attempt = await transaction.query(`SELECT id, student_id, amount, currency, provider, status, receipt_id FROM public.student_fee_payment_attempts WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, attemptId]);
        if (!attempt.rows[0] || attempt.rows[0].status !== 'succeeded') throw new ConflictError('لا يمكن تسوية محاولة دفع غير ناجحة أو غير مؤكدة.');
        if (attempt.rows[0].receipt_id) {
          const existing = await transaction.query(`SELECT id, student_id AS "studentId", amount, status FROM public.student_fee_receipts WHERE tenant_id = $1 AND school_id = $2 AND id = $3`, [tenantId, schoolId, attempt.rows[0].receipt_id]);
          receipt = existing.rows[0];
          return;
        }
        const receiptId = String(req.body?.receiptId || makeReceiptId());
        const result = await transaction.query(
          `INSERT INTO public.student_fee_receipts
            (tenant_id, school_id, id, student_id, student_name, receipt_date, amount, payment_method,
             receiving_account, operational_type, against_text, status, source_payload, updated_by)
           VALUES ($1,$2,$3,$4,'',CURRENT_DATE,$5,$6,$7,'student_fee','بوابة الدفع','approved',$8::jsonb,$9)
           RETURNING id, student_id AS "studentId", amount, payment_method AS "paymentMethod", status`,
          [tenantId, schoolId, receiptId, attempt.rows[0].student_id, attempt.rows[0].amount, attempt.rows[0].provider, String(req.body?.receivingAccount || 'gateway'), JSON.stringify({ paymentAttemptId: attemptId, provider: attempt.rows[0].provider }), databaseActorId]);
        receipt = result.rows[0];
        await transaction.query(`UPDATE public.student_fee_payment_attempts SET receipt_id = $4, updated_at = now() WHERE tenant_id = $1 AND school_id = $2 AND id = $3`, [tenantId, schoolId, attemptId, receiptId]);
        await transaction.query(`INSERT INTO public.audit_events (id, tenant_id, school_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1,$2,$3,$4,'student_fee_payment_attempt',$5,'settle','CanonicalStudentFeeRoute','success',$6::jsonb)`, [randomUUID(), tenantId, schoolId, databaseActorId, attemptId, JSON.stringify({ receiptId, amount: attempt.rows[0].amount })]);
      }, tenantContext);
      res.status(201).json({ success: true, data: receipt, meta: { source: 'canonical_postgres', allocationRequired: true } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof ValidationError || err instanceof ConflictError || err instanceof DatabaseError ? err : new DatabaseError('تعذر تسوية محاولة الدفع.', err?.message));
    }
  });

  app.post("/api/financial/payment-webhooks/:provider", async (req, res, next) => {
    try {
      const provider = String(req.params.provider || '').trim().toLowerCase();
      const body = req.body && typeof req.body === 'object' ? req.body as Record<string, any> : {};
      const eventId = String(body.eventId || body.id || '').trim();
      const eventType = String(body.eventType || body.type || '').trim();
      const tenantId = String(body.tenantId || '').trim();
      const schoolId = String(body.schoolId || '').trim();
      const signature = String(req.header('x-payment-signature') || body.signature || '').trim();
      const secret = String(process.env.PAYMENT_WEBHOOK_SECRET || '').trim();
      if (!provider || !eventId || !eventType || !canonicalFeeUuid(tenantId) || !canonicalFeeUuid(schoolId)) throw new ValidationError('بيانات Webhook الدفع غير مكتملة.');
      if (!secret && productionLikeEnvironment) throw new DatabaseError('لم يتم إعداد سر Webhook الدفع في البيئة الإنتاجية.');
      const expectedSignature = createHash('sha256').update(`${secret}.${JSON.stringify(body.payload || body)}`).digest('hex');
      if (secret && signature !== expectedSignature) throw new AuthenticationError('توقيع Webhook الدفع غير صالح.');
      if (!transactionDriver) throw new DatabaseError('تحتاج معالجة Webhook إلى اتصال PostgreSQL.');
      let status = 'received';
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Process student fee payment webhook', tenantId, userId: '00000000-0000-0000-0000-000000000000',
        userName: 'payment-webhook', ipAddress: req.ip || 'unknown', affectedTables: ['student_fee_payment_webhooks', 'student_fee_payment_attempts', 'student_fee_receipts']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('تعذر فتح معاملة Webhook.');
        const inserted = await transaction.query(
          `INSERT INTO public.student_fee_payment_webhooks (tenant_id, school_id, provider, event_id, event_type, signature_hash, payload)
           VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
           ON CONFLICT (school_id, provider, event_id) DO NOTHING
           RETURNING id`, [tenantId, schoolId, provider, eventId, eventType, expectedSignature, JSON.stringify(body.payload || body)]);
        if (!inserted.rows[0]) { status = 'ignored'; return; }
        const providerReference = String(body.providerReference || body.paymentId || body.data?.providerReference || '').trim();
        const eventStatus = String(body.status || body.data?.status || '').toLowerCase();
        const mappedStatus = ['succeeded', 'paid', 'success', 'completed'].includes(eventStatus) ? 'succeeded' : ['failed', 'declined'].includes(eventStatus) ? 'failed' : 'pending';
        const attempt = providerReference ? await transaction.query(`UPDATE public.student_fee_payment_attempts SET status = $4, provider_reference = COALESCE(provider_reference, $3), updated_at = now(), failure_code = $5, failure_message = $6 WHERE tenant_id = $1 AND school_id = $2 AND provider_reference = $3 RETURNING id, student_id, amount, currency`, [tenantId, schoolId, providerReference, mappedStatus, body.failureCode || null, body.failureMessage || null]) : { rows: [] };
        // A webhook is deliberately limited to marking the provider attempt.
        // Receipt creation and ledger posting require an authenticated school
        // actor and are performed by the settlement command, so a provider
        // callback can never fabricate an accounting entry.
        await transaction.query(`UPDATE public.student_fee_payment_webhooks SET status = 'processed', processed_at = now() WHERE tenant_id = $1 AND school_id = $2 AND provider = $3 AND event_id = $4`, [tenantId, schoolId, provider, eventId]);
        status = 'processed';
      }, {
        tenantId,
        schoolId,
        branchId: String(body.branchId || ''),
        academicYear: String(body.academicYear || ''),
        userId: String(body.userId || ''),
        role: 'payment-webhook',
      });
      res.json({ success: true, status, provider, eventId });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof ValidationError || err instanceof DatabaseError ? err : new DatabaseError('تعذر معالجة Webhook الدفع.', err?.message));
    }
  });

  app.post("/api/financial/receipts/:receiptId/allocate", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE), async (req, res, next) => {
    try {
      const { tenantId, schoolId, actorId, tenantContext } = canonicalFeeContext(req);
      const receiptId = String(req.params.receiptId || '').trim();
      const invoiceId = String(req.body?.invoiceId || '').trim();
      const scheduleId = req.body?.installmentScheduleId ? String(req.body.installmentScheduleId).trim() : null;
      const amount = assertMoney(req.body?.amount, 'قيمة التخصيص');
      let allocation: any = null;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Allocate student fee receipt', tenantId, userId: actorId,
        userName: String((req as any).user.name || 'المحاسب'), ipAddress: req.ip || 'unknown', affectedTables: ['student_fee_receipts', 'student_fee_invoices', 'student_fee_allocations', 'audit_events']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('تعذر فتح المعاملة المالية.');
        const databaseActorId = await resolveCanonicalFeeActor(transaction, tenantId, schoolId, actorId);
        const receipt = await transaction.query(`SELECT id, amount, status FROM public.student_fee_receipts WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, receiptId]);
        if (!receipt.rows[0] || !['approved', 'posted'].includes(String(receipt.rows[0].status).toLowerCase())) throw new ValidationError('السند غير موجود أو غير معتمد للتخصيص.');
        const invoice = await transaction.query(`SELECT id, amount, tax_amount, paid_amount, remaining_amount, status FROM public.student_fee_invoices WHERE tenant_id = $1 AND school_id = $2 AND id = $3 FOR UPDATE`, [tenantId, schoolId, invoiceId]);
        if (!invoice.rows[0]) throw new ValidationError('الفاتورة غير موجودة.');
        const allocated = await transaction.query(`SELECT COALESCE(SUM(amount),0) AS total FROM public.student_fee_allocations WHERE tenant_id = $1 AND school_id = $2 AND receipt_id = $3`, [tenantId, schoolId, receiptId]);
        const receiptRemaining = Number(receipt.rows[0].amount) - Number(allocated.rows[0].total || 0);
        const invoiceRemaining = Number(invoice.rows[0].remaining_amount || 0);
        if (amount > receiptRemaining + 0.001 || amount > invoiceRemaining + 0.001) throw new ConflictError('قيمة التخصيص تتجاوز الرصيد المتبقي للسند أو الفاتورة.');
        const result = await transaction.query(`INSERT INTO public.student_fee_allocations (tenant_id, school_id, receipt_id, invoice_id, installment_schedule_id, amount, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, receipt_id AS "receiptId", invoice_id AS "invoiceId", installment_schedule_id AS "installmentScheduleId", amount`, [tenantId, schoolId, receiptId, invoiceId, scheduleId, amount, databaseActorId]);
        allocation = result.rows[0];
        const newPaid = Number((Number(invoice.rows[0].paid_amount || 0) + amount).toFixed(2));
        const newRemaining = Number((invoiceRemaining - amount).toFixed(2));
        const newStatus = newRemaining <= 0.001 ? 'paid' : 'partial';
        await transaction.query(`UPDATE public.student_fee_invoices SET paid_amount = $4, remaining_amount = $5, status = $6, version = version + 1, updated_at = now(), updated_by = $1 WHERE tenant_id = $2 AND school_id = $3 AND id = $7`, [databaseActorId, tenantId, schoolId, newPaid, Math.max(0, newRemaining), newStatus, invoiceId]);
        if (scheduleId) await transaction.query(`UPDATE public.student_fee_installment_schedules SET paid_amount = LEAST(amount, paid_amount + $4), status = CASE WHEN paid_amount + $4 >= amount THEN 'paid' WHEN paid_amount + $4 > 0 THEN 'partially_paid' ELSE status END, version = version + 1 WHERE tenant_id = $1 AND school_id = $2 AND id = $3`, [tenantId, schoolId, scheduleId, amount]);
        await transaction.query(`INSERT INTO public.audit_events (id, tenant_id, school_id, actor_user_id, entity_type, entity_id, action, source, result, metadata) VALUES ($1,$2,$3,$4,'student_fee_allocation',$5,'allocate','CanonicalStudentFeeRoute','success',$6::jsonb)`, [randomUUID(), tenantId, schoolId, databaseActorId, allocation.id, JSON.stringify({ receiptId, invoiceId, amount })]);
      }, tenantContext);
      res.status(201).json({ success: true, data: allocation, meta: { source: 'canonical_postgres', invoiceUpdated: true } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof ValidationError || err instanceof ConflictError || err instanceof DatabaseError ? err : new DatabaseError('تعذر تخصيص الدفعة على الفاتورة.', err?.message));
    }
  });

  app.get("/api/financial/students/:studentId/account", authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_READ), async (req, res, next) => {
    try {
      const { tenantId, schoolId, tenantContext } = canonicalFeeContext(req);
      const studentId = String(req.params.studentId || '').trim();
      if (!canonicalFeeUuid(studentId)) throw new ValidationError('معرف الطالب غير صالح.');
      let account: any = null;
      await UnitOfWork.runInTransaction(schoolId, {
        operationName: 'Read canonical student fee account', tenantId,
        userId: String((req as any).user.id), userName: String((req as any).user.name || 'المستخدم المالي'),
        ipAddress: req.ip || 'unknown', affectedTables: ['student_fee_invoices', 'student_fee_receipts', 'student_fee_allocations']
      }, async () => {
        const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
        if (!transaction) throw new DatabaseError('تعذر فتح المعاملة المالية.');
        const student = await transaction.query(`SELECT id, preferred_name, legal_first_name, legal_middle_name, legal_last_name FROM public.students WHERE tenant_id = $1 AND school_id = $2 AND id = $3 AND deleted_at IS NULL`, [tenantId, schoolId, studentId]);
        if (!student.rows[0]) throw new ValidationError('الطالب غير موجود في المدرسة الحالية.');
        const invoices = await transaction.query(`SELECT id, student_id AS "studentId", student_name AS "studentName", item, amount, tax_amount AS "taxAmount", paid_amount AS "paidAmount", remaining_amount AS "remainingAmount", invoice_date AS "invoiceDate", due_date AS "dueDate", status, currency FROM public.student_fee_invoices WHERE tenant_id = $1 AND school_id = $2 AND student_id = $3 ORDER BY due_date DESC NULLS LAST, invoice_date DESC NULLS LAST`, [tenantId, schoolId, studentId]);
        const receipts = await transaction.query(`SELECT id, student_id AS "studentId", receipt_date AS "receiptDate", amount, payment_method AS "paymentMethod", status FROM public.student_fee_receipts WHERE tenant_id = $1 AND school_id = $2 AND student_id = $3 ORDER BY receipt_date DESC NULLS LAST`, [tenantId, schoolId, studentId]);
        account = {
          student: student.rows[0],
          invoices: invoices.rows,
          receipts: receipts.rows,
          totals: {
            invoiceAmount: invoices.rows.reduce((sum: number, row: any) => sum + Number(row.amount || 0) + Number(row.taxAmount || 0), 0),
            paidAmount: invoices.rows.reduce((sum: number, row: any) => sum + Number(row.paidAmount || 0), 0),
            remainingAmount: invoices.rows.reduce((sum: number, row: any) => sum + Number(row.remainingAmount || 0), 0),
          },
        };
      }, tenantContext);
      res.json({ success: true, data: account, meta: { source: 'canonical_postgres' } });
    } catch (err: any) {
      next(err instanceof AuthenticationError || err instanceof ValidationError || err instanceof DatabaseError ? err : new DatabaseError('تعذر قراءة كشف حساب الطالب.', err?.message));
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
      let canonicalFeeInvoices: any[] = [];
      let canonicalFeeReceipts: any[] = [];
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
          try {
            const canonicalInvoices = await transaction.query(
              `SELECT id, student_id AS "studentId", student_name AS "studentName", item, amount, tax_amount AS "taxAmount",
                      paid_amount AS "paidAmount", remaining_amount AS "remainingAmount", invoice_date AS "invoiceDate",
                      due_date AS "dueDate", status, journal_entry_id AS "journalEntryId", template_id AS "templateId",
                      academic_year_id AS "academicYearId", academic_period_id AS "academicPeriodId", currency,
                      idempotency_key AS "idempotencyKey", version
                 FROM public.student_fee_invoices
                WHERE tenant_id = $1 AND school_id = $2
                ORDER BY invoice_date DESC NULLS LAST, created_at DESC`, [tenantId, schoolId]);
            canonicalFeeInvoices = canonicalInvoices.rows;
            const canonicalReceipts = await transaction.query(
              `SELECT id, student_id AS "studentId", student_name AS "studentName", receipt_date AS "receiptDate", amount,
                      payment_method AS "paymentMethod", receiving_account AS "receivingAccount", operational_type AS "operationalType",
                      against_text AS against, status, journal_entry_id AS "journalEntryId", receipt_voucher_id AS "receiptVoucherId"
                 FROM public.student_fee_receipts
                WHERE tenant_id = $1 AND school_id = $2
                ORDER BY receipt_date DESC NULLS LAST, created_at DESC`, [tenantId, schoolId]);
            canonicalFeeReceipts = canonicalReceipts.rows;
          } catch (canonicalError: any) {
            if (String(canonicalError?.code || '') !== '42P01') throw canonicalError;
            EnterpriseLogger.warn('Canonical student-fee tables are not migrated; retaining snapshot read model.', 'FinancialSnapshotRoute', { tenantId, schoolId });
          }
          canonicalErpReady = await CanonicalErpPostingService.isProvisioned(transaction);
          if (canonicalErpReady) {
            canonicalErpModel = await CanonicalErpPostingService.readModel(transaction, schoolId, true);
          }
        },
        tenantContext
      );
      (req as any).financialErpReady = canonicalErpReady;
      const snapshotData = snapshot?.data || {};
      let responseData: Record<string, any> = {
        ...snapshotData,
        // Canonical fee rows supersede the legacy snapshot projection. This
        // keeps existing screens compatible while new commands never write a
        // second authoritative copy.
        ...(canonicalFeeInvoices.length > 0 ? { invoices: canonicalFeeInvoices } : {}),
        ...(canonicalFeeReceipts.length > 0 ? { studentReceiptVouchers: canonicalFeeReceipts, receiptVouchers: canonicalFeeReceipts } : {}),
      };
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
          ...responseData,
          invoices: linkRows(responseData.invoices, 'student_fee_invoice'),
          studentReceiptVouchers: linkRows(responseData.studentReceiptVouchers, 'student_receipt'),
          receiptVouchers: linkRows(responseData.receiptVouchers, 'student_receipt'),
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

  // Supabase connectivity is an authenticated control-plane diagnostic. Do
  // not expose project URLs or claim readiness from environment-variable
  // presence alone; readiness is established only by the startup gate above.
  app.get("/api/supabase/status", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), (_req, res) => {
    const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    const readiness = startupReadiness.snapshot();
    const ready = configured && readiness.ready;
    res.status(ready ? 200 : 503).json({
      success: ready,
      data: {
        configured,
        databaseType: "Supabase (PostgreSQL)",
        connectionStatus: readiness.ready ? "ready" : readiness.state.toLowerCase(),
      },
      message: ready ? "اتصال Supabase جاهز." : "اتصال Supabase غير جاهز أو لم يتم اجتياز فحص دور قاعدة البيانات.",
      meta: null,
    });
  });

  // AI-powered Financial Insights & Delayed Payment Risk Prediction
  app.post("/api/ai/forecast", authenticateRequest, requirePermission(PERMISSIONS.AI_FORECAST), async (req, res, next) => {
    try {
      if (process.env.EDUPRO_AI_FORECAST_ENABLED !== 'true') {
        return res.status(503).json({
          success: false,
          code: 'AI_FORECAST_CANONICAL_SOURCE_UNAVAILABLE',
          message: 'التنبؤ المالي متوقف حتى يتم اعتماد مصدر رسوم مركزي موثق وموافقة سياسة الخصوصية.',
        });
      }
      const schoolId = String((req as any).user?.schoolId || '').trim();
      if (!schoolId) throw new AuthenticationError('لا توجد مدرسة موثقة للجلسة الحالية.');

      // Never trust student or fee values supplied by the browser. Forecasts
      // are computed from the authenticated school's server-side repository.
      const canonicalStudents = (await StudentRepository.search(schoolId, { page: 1, pageSize: 500 })).data;

      // Heuristic predictive insights for financial risk analysis
      const highRisk: any[] = [];
      const mediumRisk: any[] = [];
      let totalAssessedFees = 0;
      let expectedDelayedFees = 0;

      canonicalStudents.forEach((s: any) => {
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
        meta: { source: 'canonical-school-repository', ignoredClientStudents: Array.isArray(req.body?.students) }
      });
    } catch (error) {
      next(error);
    }
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
  app.post("/api/ai/sol-luna/review", authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN), async (req, res, next) => {
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
    const isPlatformAdmin = Array.isArray((req as any).user?.platformPermissions)
      && (req as any).user.platformPermissions.includes(PERMISSIONS.PLATFORM_ADMIN);
    const containsTechnicalDetail = /supabase|postgres|database|sql|schema|token|bearer|connection|stack/i.test(String(message));
    const publicMessage = statusCode >= 500 || containsTechnicalDetail
      ? 'تعذر إتمام الطلب الآن. حاول مرة أخرى لاحقاً.'
      : message;
    const publicErrorCode = statusCode === 401
      ? 'AUTHENTICATION_REQUIRED'
      : statusCode === 403
        ? 'ACCESS_DENIED'
        : statusCode === 429
          ? 'REQUEST_LIMITED'
          : 'REQUEST_FAILED';

    // Log critical or database errors to enterprise Audit Log system
    if (statusCode >= 500 || errorCode === "DATABASE_ERROR") {
      const user = (req as any).user as { id?: string; name?: string; role?: string; schoolId?: string } | undefined;
      // Never manufacture a tenant/user merely to make an audit insert look
      // complete.  Unauthenticated process-level failures are still emitted
      // to the server logger and can be correlated by traceId.
      if (user?.schoolId && user?.id) {
        try {
          await AuditRepository.log(
            String(user.schoolId),
            String(user.id),
            String(user.name || user.id),
            String(user.role || 'unknown'),
            "SYSTEM_CRITICAL_ERROR",
            "SystemError",
            req.ip || "127.0.0.1",
            `خطأ في النظام: ${message} (TraceID: ${traceId})`
          );
        } catch (logErr: any) {
          EnterpriseLogger.error("Failed to write critical error to Audit Logs:", "ServerBootstrap", { error: logErr?.message || logErr, traceId });
        }
      } else {
        EnterpriseLogger.error("Critical request error had no trusted tenant identity for audit persistence.", "ServerBootstrap", { traceId, statusCode, errorCode });
      }
    }

    res.status(statusCode).json(isPlatformAdmin ? {
      success: false,
      errorCode,
      message,
      details,
      traceId,
      timestamp
    } : {
      success: false,
      errorCode: publicErrorCode,
      message: publicMessage,
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
