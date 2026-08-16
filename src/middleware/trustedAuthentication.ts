import type { SupabaseClient, User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import type { UserRole } from '../types';
import {
  resolveTrustedSchoolPresentation,
  resolveTrustedBranchPresentation,
  type TrustedSchoolPresentation,
  type TrustedBranchPresentation
} from './trustedSchoolIdentity';

export type TrustedIdentity = {
  id: string;
  email: string;
  name: string;
  schoolId: string;
  role: UserRole;
  school?: TrustedSchoolPresentation;
  branchId?: string;
  branch?: TrustedBranchPresentation;
  /** Optional tenant claims, sourced only from Supabase app_metadata. */
  academicYear?: string;
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
  parent: 'Parent'
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
  resolvedSchoolId?: string;
};

/**
 * Resolve a non-email login identifier without ever handling the password.
 * The username column is intentionally optional at this stage: if the current
 * database does not expose it, the lookup fails closed and the report must
 * classify Username login as requiring a schema/RPC proposal.
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

  const { data, error } = await supabase
    .from('users')
    .select('email, school_id')
    .eq('username', normalized)
    .limit(2);
  if (error || !Array.isArray(data) || data.length !== 1) {
    throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  }
  const row = data[0] as { email?: unknown; school_id?: unknown };
  const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : '';
  if (!email) throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  const resolvedSchoolId = typeof row.school_id === 'string' && row.school_id.trim()
    ? row.school_id.trim()
    : undefined;
  return { email, ...(resolvedSchoolId ? { resolvedSchoolId } : {}) };
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
  const role = normalizeTrustedRole(metadata.role);
  const branchId = String(metadata.branch_id || '').trim();
  const academicYear = String(metadata.academic_year_id || metadata.academic_year || '').trim();
  if (!schoolId) throw new TrustedAuthenticationError('INVALID_SCHOOL');
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
  if (loginIdentifier.resolvedSchoolId && identity.schoolId !== loginIdentifier.resolvedSchoolId) {
    throw new TrustedAuthenticationError('INVALID_SCHOOL');
  }
  if (requestedSchoolId && identity.schoolId !== requestedSchoolId) {
    throw new TrustedAuthenticationError('INVALID_SCHOOL');
  }
  const school = await assertTrustedSchoolExists(supabase, identity.schoolId);

  const scopedIdentity = await assertTrustedBranchScope(supabase, identity);
  return { identity: { ...scopedIdentity, school }, session: data.session };
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
  const school = await assertTrustedSchoolExists(supabase, identity.schoolId);
  const scopedIdentity = await assertTrustedBranchScope(supabase, identity);
  return { identity: { ...scopedIdentity, school }, session: data.session };
}

export async function verifyTrustedSession(
  supabase: SupabaseClient,
  token: string
): Promise<TrustedIdentity> {
  if (!token) throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  const identity = extractTrustedIdentity(user);
  const school = await assertTrustedSchoolExists(supabase, identity.schoolId);
  const scopedIdentity = await assertTrustedBranchScope(supabase, identity);
  return { ...scopedIdentity, school };
}
