import { describe, expect, it, vi } from 'vitest';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  authenticateTrustedUser,
  clearTrustedSession,
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
  app_metadata: { school_id: 'school-1', role: 'SchoolAdmin', ...metadata },
  user_metadata: { school_id: 'client-selected-school', role: 'SuperAdmin' },
  aud: 'authenticated',
  created_at: new Date().toISOString()
});

const fakeClient = ({
  loginError = null,
  user = baseUser(),
  session = { access_token: 'access-token', refresh_token: 'refresh-token', expires_at: 2000 },
  school = { id: 'school-1' },
  schoolError = null
}: any = {}): any => ({
  auth: {
    signInWithPassword: vi.fn().mockResolvedValue({
      data: loginError ? { user: null, session: null } : { user, session },
      error: loginError
    }),
    getUser: vi.fn().mockResolvedValue({ data: { user }, error: loginError }),
    refreshSession: vi.fn().mockResolvedValue({
      data: loginError ? { user: null, session: null } : { user, session },
      error: loginError
    })
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: school, error: schoolError }) }))
    }))
  }))
});

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
