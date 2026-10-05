import { describe, expect, it, vi } from 'vitest';
import {
  TrustedSessionManager,
  TrustedSessionError,
  trustedSessionStorageKeys,
  type SessionResponse,
  type SessionStorage
} from '../middleware/trustedSessionManager';

const user = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Trusted User',
  school_id: 'school-1',
  role: 'SchoolAdmin'
};

const response = (ok: boolean, body: unknown): SessionResponse => ({
  ok,
  json: async () => body
});

const responseWithStatus = (status: number, body: unknown): SessionResponse => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body
});

const sessionBody = (suffix = '1') => ({
  success: true,
  data: {
    token: `access-${suffix}`,
    refreshToken: `refresh-${suffix}`,
    expiresAt: 4102444800,
    user
  }
});

const sessionResponseBody = {
  success: true,
  data: { user }
};

function storageWith(values: Record<string, string> = {}): SessionStorage {
  const valuesMap = new Map(Object.entries(values));
  return {
    getItem: key => valuesMap.get(key) || null,
    setItem: (key, value) => valuesMap.set(key, value),
    removeItem: key => valuesMap.delete(key)
  };
}

describe('Wave 1B trusted session manager', () => {
  it.each([9, -9])('uses server time with a device clock offset of %i hours, including after reload', async (hours) => {
    vi.useFakeTimers();
    try {
      const serverTime = Date.parse('2026-10-05T09:00:00Z') / 1000;
      vi.setSystemTime((serverTime + hours * 3600) * 1000);
      const storage = storageWith();
      const request = vi.fn().mockResolvedValueOnce({
        ...response(true, { ...sessionBody(), data: { ...sessionBody().data, expiresAt: serverTime + 3600 } }),
        headers: new Headers({ date: new Date(serverTime * 1000).toUTCString() }),
      }).mockResolvedValue(response(true, sessionResponseBody));
      const manager = new TrustedSessionManager(storage, request);
      await manager.login('user@example.com', 'correct');
      expect(manager.isAccessTokenExpiringSoon()).toBe(false);
      expect(storage.getItem(trustedSessionStorageKeys.expiresAt)).toBe(String(serverTime + 3600));
      const reloaded = new TrustedSessionManager(storage, request);
      await reloaded.restore();
      expect(request.mock.calls.map(call => call[0])).toEqual(['/api/auth/login', '/api/auth/session']);
      expect(reloaded.isAccessTokenExpiringSoon()).toBe(false);
      vi.setSystemTime((serverTime + hours * 3600 + 3570) * 1000);
      expect(reloaded.isAccessTokenExpiringSoon()).toBe(true);
      reloaded.logout();
      expect(storage.getItem(trustedSessionStorageKeys.clockOffset)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('repairs legacy session clock skew during refresh using the server-time body fallback', async () => {
    vi.useFakeTimers();
    try {
      const serverTime = Date.parse('2026-10-05T09:00:00Z') / 1000;
      vi.setSystemTime((serverTime + 9 * 3600) * 1000);
      const storage = storageWith({ edupro_token: 'legacy-token', edupro_refresh_token: 'legacy-refresh', edupro_session_expires_at: String(serverTime + 1000) });
      const request = vi.fn().mockResolvedValue(response(true, {
        success: true, data: { ...sessionBody('2').data, expiresAt: serverTime + 3600, serverTime },
      }));
      const manager = new TrustedSessionManager(storage, request);
      await manager.restore();
      expect(manager.isAccessTokenExpiringSoon()).toBe(false);
      expect(request).toHaveBeenCalledTimes(1);
      expect(storage.getItem(trustedSessionStorageKeys.clockOffset)).toBe(String(9 * 3600));
    } finally {
      vi.useRealTimers();
    }
  });

  it('selects sessionStorage for a direct refresh when remember-me is disabled', async () => {
    const persistent = storageWith();
    const transient = storageWith({ edupro_token: 'access-1', edupro_refresh_token: 'refresh-1' });
    const request = vi.fn().mockResolvedValue(response(true, sessionBody('2')));
    const manager = new TrustedSessionManager(persistent, transient, request);
    await manager.refresh();
    expect(transient.getItem(trustedSessionStorageKeys.accessToken)).toBe('access-2');
    expect(persistent.getItem(trustedSessionStorageKeys.accessToken)).toBeNull();
  });

  it.each([408, 429, 502, 503, 504])('preserves tokens after a session rejection followed by refresh HTTP %i, then recovers', async (status) => {
    const storage = storageWith({ edupro_token: 'access-1', edupro_refresh_token: 'refresh-1' });
    const request = vi.fn()
      .mockResolvedValueOnce(responseWithStatus(401, { success: false }))
      .mockResolvedValueOnce({ ok: false, status, json: async () => { throw new Error('gateway returned HTML'); } })
      .mockResolvedValueOnce(response(true, sessionResponseBody));
    const manager = new TrustedSessionManager(storage, request);
    await expect(manager.restore()).rejects.toMatchObject({ code: 'REQUEST_FAILED' });
    expect(storage.getItem(trustedSessionStorageKeys.accessToken)).toBe('access-1');
    expect(storage.getItem(trustedSessionStorageKeys.refreshToken)).toBe('refresh-1');
    await expect(manager.restore()).resolves.toMatchObject({ id: 'user-1' });
  });

  it('does not leave a persisted session in an infinite restoring state when the session endpoint hangs', async () => {
    vi.useFakeTimers();
    const storage = storageWith({ edupro_token: 'stale-token', edupro_refresh_token: 'stale-refresh' });
    const request = vi.fn(() => new Promise<never>(() => undefined));
    const manager = new TrustedSessionManager(storage, request);
    const restore = manager.restore();
    const rejection = expect(restore).rejects.toMatchObject({ code: 'REQUEST_FAILED' });
    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;
    vi.useRealTimers();
  });
  it('creates and stores one trusted session', async () => {
    const request = vi.fn().mockResolvedValue(response(true, sessionBody()));
    const storage = storageWith();
    const manager = new TrustedSessionManager(storage, request);

    await expect(manager.login('user@example.com', 'correct')).resolves.toMatchObject({ schoolId: 'school-1' });
    expect(request).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      body: JSON.stringify({ identifier: 'user@example.com', password: 'correct' })
    }));
    expect(storage.getItem(trustedSessionStorageKeys.accessToken)).toBe('access-1');
    expect(storage.getItem(trustedSessionStorageKeys.refreshToken)).toBe('refresh-1');
    expect(storage.getItem(trustedSessionStorageKeys.expiresAt)).toBe('4102444800');
  });

  it('restores only after backend validation and works across browser refresh', async () => {
    const storage = storageWith({ [trustedSessionStorageKeys.accessToken]: 'access-1' });
    const request = vi.fn().mockResolvedValue(response(true, sessionResponseBody));
    const firstManager = new TrustedSessionManager(storage, request);
    await expect(firstManager.restore()).resolves.toMatchObject({ id: 'user-1' });

    const secondManager = new TrustedSessionManager(storage, request);
    await expect(secondManager.restore()).resolves.toMatchObject({ email: 'user@example.com' });
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0][0]).toBe('/api/auth/session');
    expect(request.mock.calls[0][1].headers.Authorization).toBe('Bearer access-1');
  });

  it('refreshes an expired access session and rotates stored tokens', async () => {
    const storage = storageWith({
      [trustedSessionStorageKeys.accessToken]: 'expired-access',
      [trustedSessionStorageKeys.refreshToken]: 'refresh-0',
      [trustedSessionStorageKeys.expiresAt]: '1'
    });
    const request = vi.fn().mockResolvedValue(response(true, sessionBody('2')));
    const manager = new TrustedSessionManager(storage, request);

    await expect(manager.restore()).resolves.toMatchObject({ id: 'user-1' });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toBe('/api/auth/refresh');
    expect(storage.getItem(trustedSessionStorageKeys.accessToken)).toBe('access-2');
    expect(storage.getItem(trustedSessionStorageKeys.refreshToken)).toBe('refresh-2');
  });

  it('preserves an expired session when refresh temporarily fails over the network', async () => {
    const storage = storageWith({
      [trustedSessionStorageKeys.accessToken]: 'expired-access',
      [trustedSessionStorageKeys.refreshToken]: 'refresh-0',
      [trustedSessionStorageKeys.expiresAt]: '1'
    });
    const request = vi.fn(() => Promise.reject(new Error('network unavailable')));
    const manager = new TrustedSessionManager(storage, request);

    await expect(manager.restore()).rejects.toMatchObject({ code: 'REQUEST_FAILED' });
    expect(storage.getItem(trustedSessionStorageKeys.accessToken)).toBe('expired-access');
    expect(storage.getItem(trustedSessionStorageKeys.refreshToken)).toBe('refresh-0');
  });

  it('classifies upstream 503 responses as temporary failures instead of bad credentials', async () => {
    const storage = storageWith();
    const manager = new TrustedSessionManager(
      storage,
      vi.fn().mockResolvedValue(responseWithStatus(503, { success: false }))
    );

    await expect(manager.login('user@example.com', 'correct')).rejects.toMatchObject({ code: 'REQUEST_FAILED' });
  });

  it('rejects invalid refresh tokens and clears the corrupted session', async () => {
    const storage = storageWith({
      [trustedSessionStorageKeys.accessToken]: 'corrupt-access',
      [trustedSessionStorageKeys.refreshToken]: 'invalid-refresh'
    });
    const request = vi.fn()
      .mockResolvedValueOnce(response(false, { success: false }))
      .mockResolvedValueOnce(response(false, { success: false }));
    const manager = new TrustedSessionManager(storage, request);

    await expect(manager.restore()).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
    expect(storage.getItem(trustedSessionStorageKeys.accessToken)).toBeNull();
    expect(storage.getItem(trustedSessionStorageKeys.refreshToken)).toBeNull();
  });

  it('rejects missing and corrupted sessions', async () => {
    const missing = new TrustedSessionManager(storageWith(), vi.fn());
    await expect(missing.restore()).rejects.toMatchObject({ code: 'MISSING_SESSION' });

    const corruptedStorage = storageWith({ [trustedSessionStorageKeys.accessToken]: 'corrupt-access' });
    const corrupted = new TrustedSessionManager(
      corruptedStorage,
      vi.fn().mockResolvedValue(response(true, { success: true, data: { user: { id: 'missing-claims' } } }))
    );
    await expect(corrupted.restore()).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
    expect(corruptedStorage.getItem(trustedSessionStorageKeys.accessToken)).toBeNull();
  });

  it('rejects a direct invalid refresh request', async () => {
    const manager = new TrustedSessionManager(storageWith(), vi.fn());
    await expect(manager.refresh()).rejects.toMatchObject({ code: 'INVALID_REFRESH' });
  });

  it('deduplicates concurrent restore calls and keeps one lifecycle', async () => {
    const storage = storageWith({ [trustedSessionStorageKeys.accessToken]: 'access-1' });
    let resolveRequest: ((value: SessionResponse) => void) | undefined;
    const request = vi.fn().mockReturnValue(new Promise<SessionResponse>(resolve => { resolveRequest = resolve; }));
    const manager = new TrustedSessionManager(storage, request);
    const first = manager.restore();
    const second = manager.restore();
    expect(request).toHaveBeenCalledTimes(1);
    resolveRequest?.(response(true, sessionResponseBody));
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
  });

  it('logout invalidates the lifecycle and clears every local session value', async () => {
    const storage = storageWith({
      [trustedSessionStorageKeys.accessToken]: 'access-1',
      [trustedSessionStorageKeys.refreshToken]: 'refresh-1',
      [trustedSessionStorageKeys.expiresAt]: '100'
    });
    const manager = new TrustedSessionManager(storage, vi.fn());
    manager.logout();
    expect(manager.getAccessToken()).toBeNull();
    expect(manager.getRefreshToken()).toBeNull();
    expect(storage.getItem(trustedSessionStorageKeys.expiresAt)).toBeNull();
  });

  it('does not restore a session after logout races an in-flight request', async () => {
    const storage = storageWith({ [trustedSessionStorageKeys.accessToken]: 'access-1' });
    let resolveRequest: ((value: SessionResponse) => void) | undefined;
    const request = vi.fn().mockReturnValue(new Promise<SessionResponse>(resolve => { resolveRequest = resolve; }));
    const manager = new TrustedSessionManager(storage, request);
    const restore = manager.restore();
    manager.logout();
    resolveRequest?.(response(true, sessionResponseBody));
    await expect(restore).rejects.toMatchObject({ code: 'LOGGED_OUT' });
    expect(manager.getAccessToken()).toBeNull();
  });
});
