import { clearTrustedSession } from './trustedAuthentication';
import type { TrustedBranchPresentation, TrustedSchoolPresentation } from './trustedSchoolIdentity';

export type SessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type TrustedSessionUser = {
  id: string;
  email: string;
  name: string;
  schoolId?: string;
  role: string;
  school?: TrustedSchoolPresentation;
  branchId?: string;
  branch?: TrustedBranchPresentation;
  academicYear?: string;
  permissions?: string[];
  platformPermissions?: string[];
  forcePasswordChange?: boolean;
};

export type SessionResponse = {
  ok: boolean;
  status?: number;
  headers?: Pick<Headers, 'get'>;
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
const CLOCK_OFFSET_KEY = 'edupro_session_clock_offset_seconds';
const ACCESS_TOKEN_EXPIRY_SKEW_SECONDS = 30;
const SESSION_REQUEST_TIMEOUT_MS = 10_000;

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

function normalizeUser(value: unknown): TrustedSessionUser {
  if (!isRecord(value)) throw new TrustedSessionError('INVALID_SESSION');
  const id = String(value.id || '').trim();
  const email = String(value.email || '').trim();
  const schoolId = String(value.schoolId || value.school_id || '').trim();
  const role = String(value.role || '').trim();
  const branchId = String(value.branchId || value.branch_id || '').trim();
  const academicYear = String(value.academicYear || value.academic_year || '').trim();
  const permissions = Array.isArray(value.permissions)
    ? value.permissions.filter((permission: unknown): permission is string => typeof permission === 'string' && Boolean(permission.trim())).map((permission: string) => permission.trim())
    : undefined;
  const platformPermissions = Array.isArray(value.platformPermissions || value.platform_permissions)
    ? (value.platformPermissions || value.platform_permissions)
      .filter((permission: unknown): permission is string => typeof permission === 'string' && Boolean(permission.trim()))
      .map((permission: string) => permission.trim())
    : undefined;
  const forcePasswordChange = Boolean(value.forcePasswordChange || value.force_password_change);
  const name = String(value.name || email).trim();
  const isPlatformAdmin = Array.isArray(platformPermissions) && platformPermissions.includes('Platform.Admin');
  if (!id || !email || !role || (!schoolId && !isPlatformAdmin)) throw new TrustedSessionError('INVALID_SESSION');
  const school = schoolId && isRecord(value.school) && String(value.school.id || '').trim() === schoolId
    ? value.school as TrustedSchoolPresentation
    : undefined;
  const branch = isRecord(value.branch)
    && String(value.branch.id || '').trim() === branchId
    && String(value.branch.schoolId || value.branch.school_id || '').trim() === schoolId
    ? value.branch as TrustedBranchPresentation
    : undefined;
  return {
    id,
    email,
    name,
    ...(schoolId ? { schoolId } : {}),
    role,
    ...(school ? { school } : {}),
    ...(branchId ? { branchId } : {}),
    ...(branch ? { branch } : {}),
    ...(academicYear ? { academicYear } : {}),
    ...(permissions ? { permissions } : {}),
    ...(platformPermissions ? { platformPermissions } : {}),
    forcePasswordChange
  };
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

function isTransientHttpStatus(status: number | undefined): boolean {
  return typeof status === 'number' && (status === 408 || status === 425 || status === 429 || status >= 500);
}

function responseServerTime(response: SessionResponse, payload: unknown): number | undefined {
  const headerDate = response.headers?.get('date');
  const headerTime = headerDate ? Date.parse(headerDate) / 1000 : NaN;
  const bodyTime = isRecord(payload) && isRecord(payload.data) ? payload.data.serverTime : undefined;
  if (Number.isFinite(headerTime)) return headerTime;
  return typeof bodyTime === 'number' && Number.isFinite(bodyTime) && bodyTime > 0 ? bodyTime : undefined;
}

export class TrustedSessionManager {
  private restoreFlight: Promise<TrustedSessionUser> | null = null;
  private refreshFlight: Promise<TrustedSessionUser> | null = null;
  private lifecycleVersion = 0;

  private readonly persistentStorage: SessionStorage;
  private readonly transientStorage: SessionStorage;
  private activeStorage: SessionStorage;
  private readonly request: SessionRequest;
  constructor(persistentStorage: SessionStorage, request: unknown);
  constructor(persistentStorage: SessionStorage, transientStorage: SessionStorage, request?: SessionRequest);
  constructor(
    persistentStorage: SessionStorage,
    transientStorageOrRequest: unknown = persistentStorage,
    request: SessionRequest = (input, init) => fetch(input, init)
  ) {
    this.persistentStorage = persistentStorage;
    if (typeof transientStorageOrRequest === 'function') {
      this.transientStorage = persistentStorage;
      this.request = transientStorageOrRequest as SessionRequest;
    } else {
      this.transientStorage = transientStorageOrRequest as SessionStorage;
      this.request = request;
    }
    this.activeStorage = persistentStorage;
  }
  private get storage(): SessionStorage {
    return this.activeStorage;
  }

  private requestWithTimeout(path: string, init?: RequestInit): Promise<SessionResponse> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<SessionResponse>((_, reject) => {
      timeoutId = setTimeout(() => reject(new TrustedSessionError('REQUEST_FAILED', 'انتهت مهلة التحقق من جلسة المدرسة.')), SESSION_REQUEST_TIMEOUT_MS);
    });
    return Promise.race([this.request(path, init), timeout]).finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });
  }

  getAccessToken(): string | null {
    const persistentToken = this.persistentStorage.getItem(ACCESS_TOKEN_KEY);
    if (persistentToken && persistentToken.trim()) {
      this.activeStorage = this.persistentStorage;
      return persistentToken;
    }
    const transientToken = this.transientStorage.getItem(ACCESS_TOKEN_KEY);
    if (transientToken && transientToken.trim()) {
      this.activeStorage = this.transientStorage;
      return transientToken;
    }
    return null;
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

  isAccessTokenExpiringSoon(now = Math.floor(Date.now() / 1000)): boolean {
    const expiresAt = this.getExpiresAt();
    const rawOffset = this.storage.getItem(CLOCK_OFFSET_KEY);
    const offset = rawOffset ? Number(rawOffset) : 0;
    const serverNow = now - (Number.isFinite(offset) ? offset : 0);
    return typeof expiresAt === 'number' && serverNow + ACCESS_TOKEN_EXPIRY_SKEW_SECONDS >= expiresAt;
  }

  private saveSession(token: string, refreshToken: string | undefined, expiresAt: number | undefined, version: number, serverTime?: number): void {
    if (version !== this.lifecycleVersion) throw new TrustedSessionError('LOGGED_OUT');
    if (!token.trim()) throw new TrustedSessionError('INVALID_SESSION');
    this.storage.setItem(ACCESS_TOKEN_KEY, token);
    if (refreshToken) this.storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (typeof expiresAt === 'number') this.storage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    // Supabase expiry is server-based. A fast/slow device clock must not make
    // every newly issued session look expired and create a refresh loop.
    if (typeof serverTime === 'number') {
      this.storage.setItem(CLOCK_OFFSET_KEY, String(Math.floor(Date.now() / 1000) - serverTime));
    }
  }

  private async postJson(path: string, body: Record<string, unknown>): Promise<{ payload: unknown; serverTime?: number }> {
    let response: SessionResponse;
    try {
      response = await this.requestWithTimeout(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch {
      throw new TrustedSessionError('REQUEST_FAILED');
    }
    if (!response.ok && isTransientHttpStatus(response.status)) {
      throw new TrustedSessionError('REQUEST_FAILED', 'خدمة المصادقة غير متاحة مؤقتًا.');
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
    return { payload, serverTime: responseServerTime(response, payload) };
  }

  private async getSession(token: string): Promise<TrustedSessionUser> {
    let response: SessionResponse;
    try {
      response = await this.requestWithTimeout('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      throw new TrustedSessionError('REQUEST_FAILED');
    }
    if (!response.ok && isTransientHttpStatus(response.status)) {
      throw new TrustedSessionError('REQUEST_FAILED', 'خدمة المصادقة غير متاحة مؤقتًا.');
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new TrustedSessionError('INVALID_SESSION');
    }
    if (!response.ok) {
      throw new TrustedSessionError('INVALID_SESSION');
    }
    return responseUser(payload);
  }

  async login(identifier: string, password: string, rememberMe = false, schoolContext?: string): Promise<TrustedSessionUser> {
    if (!identifier.trim() || !password) throw new TrustedSessionError('INVALID_SESSION');
    this.activeStorage = rememberMe ? this.persistentStorage : this.transientStorage;
    clearTrustedSession(rememberMe ? this.transientStorage : this.persistentStorage);
    const version = this.lifecycleVersion;
    const normalizedSchoolContext = typeof schoolContext === 'string' ? schoolContext.trim() : '';
    const { payload, serverTime } = await this.postJson('/api/auth/login', {
      identifier,
      password,
      ...(normalizedSchoolContext ? { schoolContext: normalizedSchoolContext } : {}),
    });
    const session = responseSession(payload);
    this.saveSession(session.token, session.refreshToken, session.expiresAt, version, serverTime);
    return session.user;
  }

  private async refreshInternal(version: number): Promise<TrustedSessionUser> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      clearTrustedSession(this.storage);
      throw new TrustedSessionError('INVALID_REFRESH');
    }
    const { payload, serverTime } = await this.postJson('/api/auth/refresh', { refreshToken });
    const session = responseSession(payload);
    this.saveSession(session.token, session.refreshToken, session.expiresAt, version, serverTime);
    return session.user;
  }

  private async refreshForVersion(version: number): Promise<TrustedSessionUser> {
    if (this.refreshFlight) return this.refreshFlight;
    this.refreshFlight = this.refreshInternal(version).catch(error => {
      const normalizedError = error instanceof TrustedSessionError
        ? error
        : new TrustedSessionError('INVALID_REFRESH');
      // A timeout or transport failure does not prove that the refresh token
      // is invalid. Preserve the local session so a later request can retry
      // instead of logging the user out and blanking every module.
      if (normalizedError.code !== 'REQUEST_FAILED' && normalizedError.code !== 'LOGGED_OUT') {
        clearTrustedSession(this.storage);
      }
      throw normalizedError;
    }).finally(() => {
      this.refreshFlight = null;
    });
    return this.refreshFlight;
  }

  async refresh(): Promise<TrustedSessionUser> {
    // Resolve the selected storage before a direct refresh without restore.
    this.getAccessToken();
    return this.refreshForVersion(this.lifecycleVersion);
  }

  private async restoreInternal(version: number): Promise<TrustedSessionUser> {
    const token = this.getAccessToken();
    if (!token) throw new TrustedSessionError('MISSING_SESSION');

    if (this.isAccessTokenExpiringSoon()) {
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
      } catch (refreshError) {
        if (refreshError instanceof TrustedSessionError && (refreshError.code === 'REQUEST_FAILED' || refreshError.code === 'LOGGED_OUT')) throw refreshError;
        clearTrustedSession(this.storage);
        throw new TrustedSessionError('SESSION_EXPIRED');
      }
    }
  }

  async restore(): Promise<TrustedSessionUser> {
    if (this.restoreFlight) return this.restoreFlight;
    const version = this.lifecycleVersion;
    this.restoreFlight = this.restoreInternal(version).catch(error => {
      if (version === this.lifecycleVersion && error instanceof TrustedSessionError && error.code !== 'REQUEST_FAILED' && error.code !== 'LOGGED_OUT') {
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
  expiresAt: EXPIRES_AT_KEY,
  clockOffset: CLOCK_OFFSET_KEY
} as const;
