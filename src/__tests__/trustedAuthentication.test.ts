import { describe, expect, it, vi } from 'vitest';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  authenticateTrustedUser,
  clearTrustedSession,
  isEmailIdentifier,
  resolveTrustedLoginIdentifier,
  extractBearerToken,
  extractTrustedIdentity,
  isSessionExpired,
  normalizeTrustedRole,
  refreshTrustedSession,
  verifyTrustedSession,
  TrustedAuthenticationError
} from '../middleware/trustedAuthentication';

const baseUser = (metadata: Record<string, unknown> = {}): SupabaseUser => ({
  id: 'user-1',
  email: 'user@example.com',
  app_metadata: { school_id: 'school-1', branch_id: 'branch-1', role: 'SchoolAdmin', ...metadata },
  user_metadata: { school_id: 'client-selected-school', role: 'SuperAdmin' },
  aud: 'authenticated',
  created_at: new Date().toISOString()
});

const fakeClient = ({ loginError = null, user = baseUser(), session = { access_token: 'access-token', refresh_token: 'refresh-token', expires_at: 2000 }, school = { id: 'school-1', display_name: 'Test School', status: 'active' }, schoolError = null, branch = { id: 'branch-1', school_id: 'school-1', name: 'Main Branch', address: { city: 'Riyadh' }, status: 'active', deleted_at: null }, branchError = null }: any = {}): any => ({ auth: { signInWithPassword: vi.fn().mockResolvedValue({ data: loginError ? { user: null, session: null } : { user, session }, error: loginError }), getUser: vi.fn().mockResolvedValue({ data: { user }, error: loginError }), refreshSession: vi.fn().mockResolvedValue({ data: loginError ? { user: null, session: null } : { user, session }, error: loginError }) }, rpc: vi.fn(async (functionName: string) => functionName === 'dbsec004_current_tenant_id' ? { data: 'tenant-1', error: null } : { data: null, error: new Error('unexpected RPC invocation') }), from: vi.fn((table: string) => { const filters: Record<string, unknown> = {}; const query: any = { select: vi.fn(() => query), eq: vi.fn((column: string, value: unknown) => { filters[column] = value; return query; }), is: vi.fn((column: string, value: unknown) => { filters[column] = value; return query; }), maybeSingle: vi.fn().mockImplementation(async () => { if (table === 'schools') return { data: school, error: schoolError }; if (table === 'branches') { const matches = Boolean(branch && branch.id === filters.id && branch.school_id === filters.school_id && branch.status === 'active' && branch.deleted_at === null); return { data: matches ? branch : null, error: branchError }; } return { data: null, error: null }; }) }; return query; }) });

const usernameClient = (row: Record<string, unknown> | null, options: { user?: SupabaseUser; school?: any; branch?: any } = {}): any => {
  const client = fakeClient({ user: options.user || baseUser(), school: options.school, branch: options.branch });
  const rpc = vi.fn(async (functionName: string, args: Record<string, unknown>) => {
    if (functionName !== 'dbsec004_resolve_login_username' || args.p_username !== 'schooladmin') {
      return { data: null, error: new Error('unexpected username RPC invocation') };
    }
    return { data: typeof row?.email === 'string' ? row.email : null, error: null };
  });
  client.rpc = vi.fn(async (functionName: string, args: Record<string, unknown>) => {
    if (functionName === 'dbsec004_current_tenant_id') return { data: 'tenant-1', error: null };
    return rpc(functionName, args);
  });
  return { client, rpc };
};
describe('Wave 1A trusted authentication foundation', () => {
  it('normalizes only supported application roles', () => {
    expect(normalizeTrustedRole('school-admin')).toBe('SchoolAdmin');
    expect(normalizeTrustedRole('not-a-role')).toBeNull();
  });

  it('rejects missing password and wrong password', async () => {
    await expect(authenticateTrustedUser(fakeClient(), 'user@example.com', '')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(authenticateTrustedUser(fakeClient({ loginError: new Error('invalid') }), 'user@example.com', 'wrong'))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('rejects disabled users before creating a trusted identity', () => {
    expect(() => extractTrustedIdentity(baseUser({ status: 'disabled' })))
      .toThrowError(new TrustedAuthenticationError('DISABLED_USER'));
  });

  it('rejects invalid roles and invalid schools', async () => {
    expect(() => extractTrustedIdentity(baseUser({ role: 'Owner' })))
      .toThrowError(new TrustedAuthenticationError('INVALID_ROLE'));
    await expect(authenticateTrustedUser(fakeClient({ school: null }), 'user@example.com', 'correct'))
      .rejects.toMatchObject({ code: 'INVALID_SCHOOL' });
  });

  it('ignores client-editable user_metadata for identity claims', () => {
    const identity = extractTrustedIdentity(baseUser());
    expect(identity.schoolId).toBe('school-1');
    expect(identity.role).toBe('SchoolAdmin');
  });

  it('creates a session only from the Supabase authentication result', async () => {
    const result = await authenticateTrustedUser(fakeClient(), 'user@example.com', 'correct');
    expect(result.session.access_token).toBe('access-token');
    expect(result.session.refresh_token).toBe('refresh-token');
    expect(result.identity.id).toBe('user-1');
  });

  it('rejects expired/invalid sessions and accepts a valid refreshed verification', async () => {
    expect(isSessionExpired(1000, 1000)).toBe(true);
    expect(isSessionExpired(2000, 1000)).toBe(false);
    await expect(verifyTrustedSession(fakeClient({ loginError: new Error('expired') }), 'expired-token'))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(verifyTrustedSession(fakeClient(), 'valid-token')).resolves.toMatchObject({ id: 'user-1' });
    await expect(refreshTrustedSession(fakeClient(), 'refresh-token')).resolves.toMatchObject({
      identity: { id: 'user-1' },
      session: { access_token: 'access-token' }
    });
  });

  it('rejects missing bearer tokens and clears client session state on logout', () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken('Bearer access-token')).toBe('access-token');

    const storage = new Map<string, string>();
    const adapter = { removeItem: (key: string) => storage.delete(key) };
    ['edupro_token', 'edupro_refresh_token', 'edupro_session_school_id'].forEach(key => storage.set(key, 'value'));
    clearTrustedSession(adapter);
    expect(storage.size).toBe(0);
  });
});

describe('Login identifier resolution', () => {
  it('accepts an email identifier and passes only the normalized email to Supabase Auth', async () => {
    expect(isEmailIdentifier('user@example.com')).toBe(true);
    const client = fakeClient();
    await authenticateTrustedUser(client, ' USER@EXAMPLE.COM ', 'correct');
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'user@example.com', password: 'correct' });
  });

  it('resolves a username server-side before Supabase Auth without including password in the lookup', async () => {
    const { client, rpc } = usernameClient({ email: 'user@example.com', school_id: 'school-1' });
    const result = await authenticateTrustedUser(client, 'schooladmin', 'correct');
    expect(result.identity).toMatchObject({ id: 'user-1', schoolId: 'school-1' });
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'user@example.com', password: 'correct' });
    expect(rpc).toHaveBeenCalledWith('dbsec004_resolve_login_username', { p_username: 'schooladmin' });
    expect(rpc.mock.calls[0][1]).not.toHaveProperty('password');
  });

  it('denies a username whose authenticated trusted identity is outside the requested school', async () => {
    const otherSchoolUser = baseUser({ school_id: 'school-2', branch_id: 'branch-2' });
    const { client } = usernameClient(
      { email: 'other@example.com', school_id: 'school-2' },
      {
        user: otherSchoolUser,
        school: { id: 'school-2', display_name: 'Other School', status: 'active' },
        branch: { id: 'branch-2', school_id: 'school-2', name: 'Other Branch', address: {}, status: 'active', deleted_at: null }
      }
    );
    await expect(authenticateTrustedUser(client, 'schooladmin', 'correct', 'school-1'))
      .rejects.toMatchObject({ code: 'INVALID_SCHOOL' });
  });

  it('fails closed for an unknown username without attempting Supabase Auth', async () => {
    const { client } = usernameClient(null);
    await expect(resolveTrustedLoginIdentifier(client, 'missing-user')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(client.auth.signInWithPassword).not.toHaveBeenCalled();
  });
});

describe('Trusted branch scope', () => {
  it('denies a SchoolAdmin without a trusted branch scope', async () => {
    const user = baseUser({ branch_id: undefined });
    await expect(authenticateTrustedUser(fakeClient({ user }), 'user@example.com', 'correct')).rejects.toMatchObject({ code: 'INVALID_BRANCH' });
  });
  it('allows a SchoolAdmin with a valid branch belonging to the same school', async () => {
    const result = await authenticateTrustedUser(fakeClient(), 'user@example.com', 'correct');
    expect(result.identity).toMatchObject({ schoolId: 'school-1', branchId: 'branch-1', role: 'SchoolAdmin', branch: { id: 'branch-1', schoolId: 'school-1' } });
  });
  it('denies a SchoolAdmin whose branch belongs to another school', async () => {
    const user = baseUser({ branch_id: 'branch-2' });
    const client = fakeClient({ user, branch: { id: 'branch-2', school_id: 'school-2', name: 'Other School Branch', address: { city: 'Jeddah' }, status: 'active', deleted_at: null } });
    await expect(authenticateTrustedUser(client, 'user@example.com', 'correct')).rejects.toMatchObject({ code: 'INVALID_BRANCH' });
  });
});
