import type { SupabaseClient, User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import type { UserRole } from '../types';
import {
  resolveTrustedSchoolPresentation,
  resolveTrustedBranchPresentation,
  type TrustedSchoolPresentation,
  type TrustedBranchPresentation
} from './trustedSchoolIdentity';
import { roleResolver } from '../authorization/RoleResolver';

export type TrustedIdentity = {
  id: string;
  email: string;
  name: string;
  /** Server-resolved from public.users after Auth; absent on raw claims by design. */
  tenantId?: string;
  /** Absent only for a canonical platform administrator; school users must have it. */
  schoolId?: string;
  role: UserRole;
  school?: TrustedSchoolPresentation;
  branchId?: string;
  branch?: TrustedBranchPresentation;
  /** Optional academic-year claim; final scope is validated server-side. */
  academicYear?: string;
  /** Effective tenant permissions are server-derived and are only a client-side visibility hint. */
  permissions?: string[];
  /** Effective platform permissions are server-derived and never come from client claims. */
  platformPermissions?: string[];
};

export type TrustedSession = {
  identity: TrustedIdentity;
  session: SupabaseSession;
};

export class TrustedAuthenticationError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_CREDENTIALS'
      | 'DISABLED_USER'
      | 'INVALID_SCHOOL'
      | 'INVALID_ROLE'
      | 'INVALID_BRANCH'
      | 'INVALID_IDENTITY',
    message = 'Authentication failed'
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const ROLE_ALIASES: Record<string, UserRole> = {
  superadmin: 'SuperAdmin',
  'super-admin': 'SuperAdmin',
  schooladmin: 'SchoolAdmin',
  'school-admin': 'SchoolAdmin',
  teacher: 'Teacher',
  accountant: 'Accountant',
  parent: 'Parent',
  control: 'Control',
  examiner: 'Control',
  auditor: 'Auditor',
  student: 'Student'
};

export function normalizeTrustedRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;
  return ROLE_ALIASES[value.trim().toLowerCase()] || null;
}

const EMAIL_IDENTIFIER_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailIdentifier(value: string): boolean {
  return EMAIL_IDENTIFIER_PATTERN.test(value.trim());
}

export type TrustedLoginIdentifier = {
  email: string;
};

/**
 * Resolve a non-email login identifier without ever handling the password.
 * The pre-Auth lookup crosses the database boundary only through the narrow
 * SECURITY DEFINER RPC; public.users is never opened to anon for direct reads.
 */
export async function resolveTrustedLoginIdentifier(
  supabase: SupabaseClient,
  identifier: unknown
): Promise<TrustedLoginIdentifier> {
  if (typeof identifier !== 'string' || !identifier.trim()) {
    throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  }
  const normalized = identifier.trim();
  if (isEmailIdentifier(normalized)) return { email: normalized.toLowerCase() };

  const { data, error } = await supabase.rpc('dbsec004_resolve_login_username', {
    p_username: normalized
  });
  if (error || typeof data !== 'string' || !data.trim()) {
    throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  }
  return { email: data.trim().toLowerCase() };
}

async function resolveTrustedTenantId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.rpc('dbsec004_current_tenant_id');
  const tenantId = typeof data === 'string' ? data.trim() : '';
  if (error || !tenantId) {
    throw new TrustedAuthenticationError('INVALID_IDENTITY', 'المستأجر الموثوق غير متاح لهذه الجلسة.');
  }
  return tenantId;
}

export function extractBearerToken(authHeader: unknown): string | null {
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  return token || null;
}

export function isSessionExpired(expiresAt: number | null | undefined, now = Math.floor(Date.now() / 1000)): boolean {
  return typeof expiresAt === 'number' && now >= expiresAt;
}

export function clearTrustedSession(storage: Pick<Storage, 'removeItem'>): void {
  storage.removeItem('edupro_token');
  storage.removeItem('edupro_refresh_token');
  storage.removeItem('edupro_session_school_id');
  storage.removeItem('edupro_session_role');
  storage.removeItem('edupro_session_username');
  storage.removeItem('edupro_session_branch_id');
  storage.removeItem('edupro_session_expires_at');
}

function isDisabledUser(user: SupabaseUser): boolean {
  const metadata = user.app_metadata || {};
  const status = String(metadata.status || metadata.account_status || '').trim().toLowerCase();
  const disabledStatuses = new Set(['disabled', 'inactive', 'locked', 'suspended', 'archived']);
  const bannedUntil = user.banned_until ? Date.parse(user.banned_until) : NaN;
  return disabledStatuses.has(status) || Number.isFinite(bannedUntil) && bannedUntil > Date.now();
}

export function extractTrustedIdentity(user: SupabaseUser): TrustedIdentity {
  if (!user?.id || !user.email) {
    throw new TrustedAuthenticationError('INVALID_IDENTITY');
  }
  if (isDisabledUser(user)) {
    throw new TrustedAuthenticationError('DISABLED_USER');
  }

  // Security claims come only from server-controlled app_metadata. user_metadata is user-editable.
  const metadata = user.app_metadata || {};
  const schoolId = String(metadata.school_id || '').trim();
  const declaredRole = normalizeTrustedRole(metadata.role);
  // Platform identities are intentionally schoolless.  Their authority is
  // never inferred from this fallback: finalizeTrustedIdentity subsequently
  // requires the canonical Platform.Admin assignment from the platform RBAC
  // tables.  This allows a correctly provisioned platform identity to sign
  // in even if an older Auth record was created before the role claim existed.
  const role = declaredRole || (!schoolId ? 'SuperAdmin' : null);
  const branchId = String(metadata.branch_id || '').trim();
  const academicYear = String(metadata.academic_year_id || metadata.academic_year || '').trim();
  // A central platform administrator is intentionally not attached to any
  // school. The canonical platform RBAC assignment is checked immediately
  // after this claim extraction; all other roles remain school-bound.
  if (!schoolId && role !== 'SuperAdmin') throw new TrustedAuthenticationError('INVALID_SCHOOL');
  if (!role) throw new TrustedAuthenticationError('INVALID_ROLE');

  return {
    id: user.id,
    email: user.email,
    name: String(metadata.display_name || metadata.full_name || user.user_metadata?.full_name || user.email),
    schoolId,
    role,
    ...(branchId ? { branchId } : {}),
    ...(academicYear ? { academicYear } : {})
  };
}

async function attachTrustedTenantPermissions(identity: TrustedIdentity): Promise<TrustedIdentity> {
  try {
    const permissions = await roleResolver.resolveTenantPermissions(identity);
    return { ...identity, permissions: [...permissions] };
  } catch {
    // The server remains the authorization authority. An unavailable or
    // incomplete assignment must fail closed in the client visibility hint.
    return { ...identity, permissions: [] };
  }
}

async function attachTrustedPlatformPermissions(identity: TrustedIdentity): Promise<TrustedIdentity> {
  try {
    const permissions = await roleResolver.resolvePlatformPermissions(identity);
    return { ...identity, platformPermissions: [...permissions] };
  } catch {
    // Platform access is independent from tenant RBAC and fails closed when
    // the canonical platform assignment cannot be resolved.
    return { ...identity, platformPermissions: [] };
  }
}

async function attachTrustedEffectivePermissions(identity: TrustedIdentity): Promise<TrustedIdentity> {
  const tenantIdentity = await attachTrustedTenantPermissions(identity);
  return attachTrustedPlatformPermissions(tenantIdentity);
}

function hasPlatformAdminPermission(identity: TrustedIdentity): boolean {
  return Array.isArray(identity.platformPermissions)
    && identity.platformPermissions.includes('Platform.Admin');
}

async function resolveTrustedScope(
  supabase: SupabaseClient,
  identity: TrustedIdentity,
): Promise<{ identity: TrustedIdentity; school?: TrustedSchoolPresentation }> {
  if (!identity.schoolId) {
    // A central identity may not carry a branch or a school. Its platform
    // assignment is resolved from the canonical platform RBAC tables, never
    // from browser claims or user-editable metadata.
    if (identity.branchId) throw new TrustedAuthenticationError('INVALID_BRANCH');
    return { identity };
  }

  const school = await assertTrustedSchoolExists(supabase, identity.schoolId);
  const scopedIdentity = await assertTrustedBranchScope(supabase, identity);
  return { identity: scopedIdentity, school };
}

async function finalizeTrustedIdentity(
  supabase: SupabaseClient,
  identity: TrustedIdentity,
  tenantId: string,
): Promise<TrustedIdentity> {
  const scoped = await resolveTrustedScope(supabase, identity);
  const trustedIdentity = await attachTrustedEffectivePermissions({ ...scoped.identity, tenantId, ...(scoped.school ? { school: scoped.school } : {}) });
  if (!trustedIdentity.schoolId && !hasPlatformAdminPermission(trustedIdentity)) {
    throw new TrustedAuthenticationError('INVALID_SCHOOL');
  }
  return trustedIdentity;
}

export async function authenticateTrustedUser(
  supabase: SupabaseClient,
  identifier: unknown,
  password: unknown,
  expectedSchoolId?: unknown
): Promise<TrustedSession> {
  if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
    throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  }

  const loginIdentifier = await resolveTrustedLoginIdentifier(supabase, identifier);
  const requestedSchoolId = typeof expectedSchoolId === 'string' && expectedSchoolId.trim()
    ? expectedSchoolId.trim()
    : undefined;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginIdentifier.email,
    password
  });
  if (error || !data.user || !data.session) {
    throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  }

  const identity = extractTrustedIdentity(data.user);
  const tenantId = await resolveTrustedTenantId(supabase);
  if (requestedSchoolId && identity.schoolId !== requestedSchoolId) {
    throw new TrustedAuthenticationError('INVALID_SCHOOL');
  }
  const trustedIdentity = await finalizeTrustedIdentity(supabase, identity, tenantId);
  return { identity: trustedIdentity, session: data.session };
}

async function assertTrustedSchoolExists(
  supabase: SupabaseClient,
  schoolId: string
): Promise<TrustedSchoolPresentation> {
  const school = await resolveTrustedSchoolPresentation(supabase, schoolId);
  if (!school) throw new TrustedAuthenticationError('INVALID_SCHOOL');
  return school;
}

async function assertTrustedBranchScope(supabase: SupabaseClient, identity: TrustedIdentity): Promise<TrustedIdentity> {
  if (!identity.branchId) {
    if (identity.role === 'SuperAdmin') return identity;
    throw new TrustedAuthenticationError('INVALID_BRANCH');
  }
  const branch = await resolveTrustedBranchPresentation(supabase, identity.branchId, identity.schoolId);
  if (!branch) throw new TrustedAuthenticationError('INVALID_BRANCH');
  return { ...identity, branch };
}

export async function refreshTrustedSession(
  supabase: SupabaseClient,
  refreshToken: unknown
): Promise<TrustedSession> {
  if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
    throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  }
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken.trim() });
  if (error || !data.user || !data.session) {
    throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  }
  const identity = extractTrustedIdentity(data.user);
  const tenantId = await resolveTrustedTenantId(supabase);
  const trustedIdentity = await finalizeTrustedIdentity(supabase, identity, tenantId);
  return { identity: trustedIdentity, session: data.session };
}

export async function verifyTrustedSession(
  supabase: SupabaseClient,
  token: string
): Promise<TrustedIdentity> {
  if (!token) throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  const identity = extractTrustedIdentity(user);
  const tenantId = await resolveTrustedTenantId(supabase);
  return finalizeTrustedIdentity(supabase, identity, tenantId);
}
