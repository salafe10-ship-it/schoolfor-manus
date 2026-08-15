import type { SupabaseClient, User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import type { UserRole } from '../types';
import {
  resolveTrustedSchoolPresentation,
  type TrustedSchoolPresentation
} from './trustedSchoolIdentity';

export type TrustedIdentity = {
  id: string;
  email: string;
  name: string;
  schoolId: string;
  role: UserRole;
  school?: TrustedSchoolPresentation;
  /** Optional tenant claims, sourced only from Supabase app_metadata. */
  branchId?: string;
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
  password: unknown
): Promise<TrustedSession> {
  if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
    throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: identifier.trim(),
    password
  });
  if (error || !data.user || !data.session) {
    throw new TrustedAuthenticationError('INVALID_CREDENTIALS');
  }

  const identity = extractTrustedIdentity(data.user);
  const school = await assertTrustedSchoolExists(supabase, identity.schoolId);

  return { identity: { ...identity, school }, session: data.session };
}

async function assertTrustedSchoolExists(
  supabase: SupabaseClient,
  schoolId: string
): Promise<TrustedSchoolPresentation> {
  const school = await resolveTrustedSchoolPresentation(supabase, schoolId);
  if (!school) throw new TrustedAuthenticationError('INVALID_SCHOOL');
  return school;
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
  return { identity: { ...identity, school }, session: data.session };
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
  return { ...identity, school };
}
