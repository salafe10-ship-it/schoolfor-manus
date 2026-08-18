import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EnterpriseLogger } from './services/EnterpriseLogger';

export const DEFAULT_SUPABASE_REQUEST_TIMEOUT_MS = 3_000;

export function getSupabaseRequestTimeoutMs(): number {
  const configuredTimeout = Number(process.env.SUPABASE_REQUEST_TIMEOUT_MS);

  if (Number.isFinite(configuredTimeout) && configuredTimeout > 0) {
    return configuredTimeout;
  }

  return DEFAULT_SUPABASE_REQUEST_TIMEOUT_MS;
}

/**
 * Adds a real AbortController timeout to Supabase's fetch requests.
 * This avoids an unresolved Promise race: the underlying request is aborted
 * and all listeners/timers are released when the request settles.
 */
export function createSupabaseTimeoutFetch(timeoutMs: number): typeof fetch {
  return async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const callerSignal = init.signal;
    const abortFromCaller = () => controller.abort();

    if (callerSignal?.aborted) {
      controller.abort();
    } else {
      callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
    }

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
      callerSignal?.removeEventListener('abort', abortFromCaller);
    }
  };
}

export interface ConnectionMetrics {
  connectionCount: number;
  connectionTime: number; // in ms
  lastError: string | null;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  reconnectAttempts: number;
}

export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager | null = null;
  private client: SupabaseClient | null = null;
  private metrics: ConnectionMetrics = {
    connectionCount: 0,
    connectionTime: 0,
    lastError: null,
    status: 'DISCONNECTED',
    reconnectAttempts: 0
  };
  private isInitializing = false;

  private constructor() {}

  public static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  public getClient(): SupabaseClient | null {
    if (this.client) {
      return this.client;
    }
    
    // Trigger lazy init but do not block synchronous call
    this.connectWithRetry().catch(err => {
      EnterpriseLogger.error("Lazy background connection failed:", "DBConnectionManager", { error: err?.message || err });
    });
    
    return this.client;
  }

  /**
   * Connect to Supabase using Exponential Backoff retry strategy
   */
  public async connectWithRetry(maxAttempts = 5, baseDelayMs = 500, maxDelayMs = 8000): Promise<SupabaseClient | null> {
    if (this.client) {
      return this.client;
    }

    if (this.isInitializing) {
      // Prevent multiple parallel initializations
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.client;
    }

    this.isInitializing = true;
    this.metrics.status = 'CONNECTING';

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    const isUrlValid = (url: string | undefined): boolean => {
      if (!url) return false;
      try {
        const parsed = new URL(url);
        return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !url.includes('your-project');
      } catch {
        return false;
      }
    };

    if (!supabaseUrl || !supabaseKey || !isUrlValid(supabaseUrl) || supabaseKey.includes('your-anon-key')) {
      const errorMsg = "SUPABASE_URL or SUPABASE_ANON_KEY is missing, invalid, or using placeholder values. Gracefully falling back to local storage.";
      this.metrics.lastError = errorMsg;
      this.metrics.status = 'DISCONNECTED';
      this.isInitializing = false;
      return null;
    }

    const startTime = Date.now();
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        EnterpriseLogger.info(`🔌 [DB Connection Manager]: Attempting connection (Attempt ${attempt + 1}/${maxAttempts})...`, "DBConnectionManager");
        
        const tempClient = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false
          },
          global: {
            fetch: createSupabaseTimeoutFetch(getSupabaseRequestTimeoutMs())
          }
        });

        // Verify Supabase/Auth reachability without querying a protected table.
        // Anonymous readiness probes must not depend on RLS-scoped data rows.
        const { error } = await tempClient.auth.getSession();
        if (error) {
          throw error;
        }

        // Success!
        const endTime = Date.now();
        this.metrics.connectionTime = endTime - startTime;
        this.metrics.connectionCount++;
        this.metrics.status = 'CONNECTED';
        this.metrics.lastError = null;
        this.metrics.reconnectAttempts = 0;
        this.client = tempClient;
        this.isInitializing = false;

        EnterpriseLogger.info(`⚡ [DB Connection Manager]: Connection established successfully in ${this.metrics.connectionTime}ms.`, "DBConnectionManager");
        return this.client;

      } catch (err: any) {
        attempt++;
        this.metrics.reconnectAttempts = attempt;
        const errorMsg = err?.message || String(err);
        const causeMessage = err?.cause?.message ? String(err.cause.message) : '';
        this.metrics.lastError = causeMessage ? `${errorMsg} (${causeMessage})` : errorMsg;
        EnterpriseLogger.warn(`⚠️ [DB Connection Manager]: Attempt ${attempt} failed: ${errorMsg}`, "DBConnectionManager", {
          cause: causeMessage || undefined
        });

        if (attempt >= maxAttempts) {
          break;
        }

        // Exponential backoff delay
        const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
        EnterpriseLogger.info(`⏳ [DB Connection Manager]: Retrying in ${delay}ms...`, "DBConnectionManager");
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.metrics.status = 'DISCONNECTED';
    this.isInitializing = false;
    return null;
  }

  /**
   * Force disconnect to simulate or reset connection
   */
  public disconnect() {
    this.client = null;
    this.metrics.status = 'DISCONNECTED';
    this.metrics.reconnectAttempts = 0;
    EnterpriseLogger.info("🔌 [DB Connection Manager]: Client disconnected manually.", "DBConnectionManager");
  }
}

/**
 * Lazily retrieves the Supabase PostgreSQL client.
 * Returns null if environment variables are not configured,
 * allowing the application to fall back gracefully to mock operations.
 */
export function getSupabaseClient(): SupabaseClient | null {
  return DatabaseConnectionManager.getInstance().getClient();
}

/**
 * Waits for the shared Supabase connection to become ready before serving
 * authentication or trusted-session requests. The synchronous getter above is
 * intentionally retained for legacy read paths; security-sensitive routes
 * must use this readiness-aware accessor so a startup race cannot become a
 * false "service unavailable" response.
 */
export async function getSupabaseClientReady(): Promise<SupabaseClient | null> {
  return DatabaseConnectionManager.getInstance().connectWithRetry(5, 300, 2000);
}

/**
 * Revokes the current Supabase Auth session using only the public anon key and
 * the caller's bearer token. The service-role key is never required or exposed.
 */
export async function revokeSupabaseSession(accessToken: string): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_ANON_KEY?.trim();
  const token = accessToken.trim();
  if (!token || !supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon-key')) {
    throw new Error('Supabase Auth is not configured.');
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/logout`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${token}`
    },
    signal: AbortSignal.timeout(getSupabaseRequestTimeoutMs())
  });
  if (!response.ok && response.status !== 204) {
    throw new Error('Supabase Auth logout failed.');
  }
}

/**
 * Creates a request-scoped Supabase client carrying the already verified
 * bearer token. This is intentionally anon-key based: it never exposes or
 * uses the service-role key, and it does not persist a session.
 */
export function getSupabaseClientForAccessToken(accessToken: string | undefined): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!accessToken || !supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon-key')) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
      fetch: createSupabaseTimeoutFetch(getSupabaseRequestTimeoutMs())
    }
  });
}
