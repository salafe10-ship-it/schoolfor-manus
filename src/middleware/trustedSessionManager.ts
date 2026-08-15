import { clearTrustedSession, isSessionExpired } from './trustedAuthentication';
import type { TrustedSchoolPresentation } from './trustedSchoolIdentity';

export type SessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type TrustedSessionUser = {
  id: string;
  email: string;
  name: string;
  schoolId: string;
  role: string;
  school?: TrustedSchoolPresentation;
};

export type SessionResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

export type SessionRequest = (input: RequestInfo | URL, init?: RequestInit) => Promise<SessionResponse>;

export class TrustedSessionError extends Error {
  constructor(
    public readonly code: 'MISSING_SESSION' | 'INVALID_SESSION' | 'INVALID_REFRESH' | 'SESSION_EXPIRED' | 'REQUEST_FAILED' | 'LOGGED_OUT',
    message = 'Trusted session is not available'
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const ACCESS_TOKEN_KEY = 'edupro_token';
const REFRESH_TOKEN_KEY = 'edupro_refresh_token';
const EXPIRES_AT_KEY = 'edupro_session_expires_at';

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

function normalizeUser(value: unknown): TrustedSessionUser {
  if (!isRecord(value)) throw new TrustedSessionError('INVALID_SESSION');
  const id = String(value.id || '').trim();
  const email = String(value.email || '').trim();
  const schoolId = String(value.schoolId || value.school_id || '').trim();
  const role = String(value.role || '').trim();
  const name = String(value.name || email).trim();
  if (!id || !email || !schoolId || !role) throw new TrustedSessionError('INVALID_SESSION');
  const school = isRecord(value.school) && String(value.school.id || '').trim() === schoolId
    ? value.school as TrustedSchoolPresentation
    : undefined;
  return { id, email, name, schoolId, role, ...(school ? { school } : {}) };
}

function readResponseBody(value: unknown): Record<string, any> {
  if (!isRecord(value) || value.success !== true || !isRecord(value.data)) {
    throw new TrustedSessionError('INVALID_SESSION');
  }
  return value;
}

function responseUser(value: unknown): TrustedSessionUser {
  const body = readResponseBody(value);
  return normalizeUser(body.data.user);
}

function responseSession(value: unknown): { user: TrustedSessionUser; token: string; refreshToken?: string; expiresAt?: number } {
  const body = readResponseBody(value);
  const token = String(body.data.token || '').trim();
  if (!token) throw new TrustedSessionError('INVALID_SESSION');
  const expiresAt = typeof body.data.expiresAt === 'number' ? body.data.expiresAt : undefined;
  const refreshToken = typeof body.data.refreshToken === 'string' && body.data.refreshToken.trim()
    ? body.data.refreshToken.trim()
    : undefined;
  return { user: normalizeUser(body.data.user), token, refreshToken, expiresAt };
}

export class TrustedSessionManager {
  private restoreFlight: Promise<TrustedSessionUser> | null = null;
  private refreshFlight: Promise<TrustedSessionUser> | null = null;
  private lifecycleVersion = 0;

  constructor(
    private readonly storage: SessionStorage,
    private readonly request: SessionRequest = (input, init) => fetch(input, init)
  ) {}

  getAccessToken(): string | null {
    const token = this.storage.getItem(ACCESS_TOKEN_KEY);
    return token && token.trim() ? token : null;
  }

  getRefreshToken(): string | null {
    const token = this.storage.getItem(REFRESH_TOKEN_KEY);
    return token && token.trim() ? token : null;
  }

  private getExpiresAt(): number | undefined {
    const raw = this.storage.getItem(EXPIRES_AT_KEY);
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : undefined;
  }

  private saveSession(token: string, refreshToken: string | undefined, expiresAt: number | undefined, version: number): void {
    if (version !== this.lifecycleVersion) throw new TrustedSessionError('LOGGED_OUT');
    if (!token.trim()) throw new TrustedSessionError('INVALID_SESSION');
    this.storage.setItem(ACCESS_TOKEN_KEY, token);
    if (refreshToken) this.storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (typeof expiresAt === 'number') this.storage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  }

  private async postJson(path: string, body: Record<string, unknown>): Promise<unknown> {
    let response: SessionResponse;
    try {
      response = await this.request(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch {
      throw new TrustedSessionError('REQUEST_FAILED');
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new TrustedSessionError('INVALID_SESSION');
    }
    if (!response.ok) {
      throw new TrustedSessionError(path === '/api/auth/refresh' ? 'INVALID_REFRESH' : 'INVALID_SESSION');
    }
    return payload;
  }

  private async getSession(token: string): Promise<TrustedSessionUser> {
    let response: SessionResponse;
    try {
      response = await this.request('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      throw new TrustedSessionError('REQUEST_FAILED');
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new TrustedSessionError('INVALID_SESSION');
    }
    if (!response.ok) throw new TrustedSessionError('INVALID_SESSION');
    return responseUser(payload);
  }

  async login(identifier: string, password: string): Promise<TrustedSessionUser> {
    if (!identifier.trim() || !password) throw new TrustedSessionError('INVALID_SESSION');
    const version = this.lifecycleVersion;
    const payload = await this.postJson('/api/auth/login', { email: identifier, password });
    const session = responseSession(payload);
    this.saveSession(session.token, session.refreshToken, session.expiresAt, version);
    return session.user;
  }

  private async refreshInternal(version: number): Promise<TrustedSessionUser> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      clearTrustedSession(this.storage);
      throw new TrustedSessionError('INVALID_REFRESH');
    }
    const payload = await this.postJson('/api/auth/refresh', { refreshToken });
    const session = responseSession(payload);
    this.saveSession(session.token, session.refreshToken, session.expiresAt, version);
    return session.user;
  }

  private async refreshForVersion(version: number): Promise<TrustedSessionUser> {
    if (this.refreshFlight) return this.refreshFlight;
    this.refreshFlight = this.refreshInternal(version).catch(error => {
      clearTrustedSession(this.storage);
      throw error instanceof TrustedSessionError ? error : new TrustedSessionError('INVALID_REFRESH');
    }).finally(() => {
      this.refreshFlight = null;
    });
    return this.refreshFlight;
  }

  async refresh(): Promise<TrustedSessionUser> {
    return this.refreshForVersion(this.lifecycleVersion);
  }

  private async restoreInternal(version: number): Promise<TrustedSessionUser> {
    const token = this.getAccessToken();
    if (!token) throw new TrustedSessionError('MISSING_SESSION');

    if (isSessionExpired(this.getExpiresAt())) {
      return this.refreshForVersion(version);
    }

    try {
      const user = await this.getSession(token);
      if (version !== this.lifecycleVersion) throw new TrustedSessionError('LOGGED_OUT');
      return user;
    } catch (error) {
      if (error instanceof TrustedSessionError && (error.code === 'REQUEST_FAILED' || error.code === 'LOGGED_OUT')) throw error;
      try {
        return await this.refreshForVersion(version);
      } catch {
        clearTrustedSession(this.storage);
        throw new TrustedSessionError('SESSION_EXPIRED');
      }
    }
  }

  async restore(): Promise<TrustedSessionUser> {
    if (this.restoreFlight) return this.restoreFlight;
    const version = this.lifecycleVersion;
    this.restoreFlight = this.restoreInternal(version).catch(error => {
      if (error instanceof TrustedSessionError && error.code !== 'REQUEST_FAILED') {
        clearTrustedSession(this.storage);
      }
      throw error instanceof TrustedSessionError ? error : new TrustedSessionError('INVALID_SESSION');
    }).finally(() => {
      this.restoreFlight = null;
    });
    return this.restoreFlight;
  }

  logout(): void {
    this.lifecycleVersion += 1;
    this.restoreFlight = null;
    this.refreshFlight = null;
    clearTrustedSession(this.storage);
  }
}

export const trustedSessionStorageKeys = {
  accessToken: ACCESS_TOKEN_KEY,
  refreshToken: REFRESH_TOKEN_KEY,
  expiresAt: EXPIRES_AT_KEY
} as const;
