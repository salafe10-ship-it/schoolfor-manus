import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTrustedAccessToken, getTrustedAccessTokenAsync } from '../utils/auth';

const user = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Trusted User',
  school_id: 'school-1',
  role: 'SchoolAdmin'
};

const response = (ok: boolean, body: unknown) => ({
  ok,
  json: async () => body
});

const refreshedSession = {
  success: true,
  data: {
    token: 'refreshed-token',
    refreshToken: 'refresh-2',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    user
  }
};

describe('trusted access token helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns a valid persistent token without network access', () => {
    localStorage.setItem('edupro_token', 'persistent-token');
    localStorage.setItem('edupro_session_expires_at', String(Math.floor(Date.now() / 1000) + 3600));
    sessionStorage.setItem('edupro_token', 'transient-token');
    expect(getTrustedAccessToken()).toBe('persistent-token');
  });

  it('returns a valid transient token when Remember Me is disabled', () => {
    sessionStorage.setItem('edupro_token', 'transient-token');
    sessionStorage.setItem('edupro_session_expires_at', String(Math.floor(Date.now() / 1000) + 3600));
    expect(getTrustedAccessToken()).toBe('transient-token');
  });

  it('does not return an expired token from the synchronous helper', () => {
    localStorage.setItem('edupro_token', 'expired-token');
    localStorage.setItem('edupro_session_expires_at', '1');
    expect(getTrustedAccessToken()).toBe('');
  });

  it('refreshes an expired session through the official refresh endpoint', async () => {
    localStorage.setItem('edupro_token', 'expired-token');
    localStorage.setItem('edupro_refresh_token', 'refresh-1');
    localStorage.setItem('edupro_session_expires_at', '1');
    const fetchMock = vi.fn().mockResolvedValue(response(true, refreshedSession));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTrustedAccessTokenAsync()).resolves.toBe('refreshed-token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/refresh');
    expect(localStorage.getItem('edupro_token')).toBe('refreshed-token');
  });

  it('returns the current token after a successful session validation', async () => {
    localStorage.setItem('edupro_token', 'current-token');
    localStorage.setItem('edupro_session_expires_at', String(Math.floor(Date.now() / 1000) + 3600));
    const fetchMock = vi.fn().mockResolvedValue(response(true, { success: true, data: { user } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTrustedAccessTokenAsync()).resolves.toBe('current-token');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/session');
  });

  it('fails closed after refresh failure and never returns the expired token', async () => {
    localStorage.setItem('edupro_token', 'expired-token');
    localStorage.setItem('edupro_refresh_token', 'refresh-invalid');
    localStorage.setItem('edupro_session_expires_at', '1');
    const fetchMock = vi.fn().mockResolvedValue(response(false, { success: false }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTrustedAccessTokenAsync()).resolves.toBe('');
    expect(localStorage.getItem('edupro_token')).toBeNull();
  });

  it('fails closed when no session is available', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTrustedAccessTokenAsync()).resolves.toBe('');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deduplicates twenty concurrent refresh requests into one network refresh', async () => {
    localStorage.setItem('edupro_token', 'expired-token');
    localStorage.setItem('edupro_refresh_token', 'refresh-1');
    localStorage.setItem('edupro_session_expires_at', '1');
    let resolveRefresh: ((value: unknown) => void) | undefined;
    const fetchMock = vi.fn().mockReturnValue(new Promise(resolve => { resolveRefresh = resolve; }));
    vi.stubGlobal('fetch', fetchMock);

    const requests = Array.from({ length: 20 }, () => getTrustedAccessTokenAsync());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveRefresh?.(response(true, refreshedSession));

    await expect(Promise.all(requests)).resolves.toEqual(Array(20).fill('refreshed-token'));
  });
});
