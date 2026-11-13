export interface FinancialSourceReadRetryOptions {
  /** Total attempts, including the first request. */
  attempts?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
}

function errorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const status = Number((error as { status?: unknown; statusCode?: unknown }).status
    ?? (error as { statusCode?: unknown }).statusCode);
  return Number.isInteger(status) ? status : null;
}

export function createFinancialSourceReadHttpError(message: string, status: number): Error & { status: number } {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}

export function isTransientFinancialSourceReadError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error && typeof error === 'object') {
    const name = String((error as { name?: unknown }).name || '');
    if (name === 'AbortError' || name === 'TimeoutError') return true;
  }
  return [408, 425, 429, 500, 502, 503, 504].includes(errorStatus(error) ?? -1);
}

function abortError(): DOMException {
  return new DOMException('The financial source request was cancelled.', 'AbortError');
}

function waitForRetry(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(signal.reason ?? abortError());
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(signal?.reason ?? abortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Runs a bounded, abortable financial-source read. Only network failures,
 * timeouts, and transient server/gateway/rate-limit responses are retried. The
 * caller's abort signal always stops both the active request and retry wait.
 */
export async function retryTransientFinancialSourceRead<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  {
    attempts = 2,
    timeoutMs = 15_000,
    retryDelayMs = 500,
    signal,
  }: FinancialSourceReadRetryOptions = {},
): Promise<T> {
  const boundedAttempts = Math.min(3, Math.max(1, Math.floor(Number(attempts) || 1)));
  const boundedTimeoutMs = Math.min(60_000, Math.max(1, Math.floor(Number(timeoutMs) || 15_000)));
  let lastError: unknown;

  for (let attempt = 0; attempt < boundedAttempts; attempt += 1) {
    if (signal?.aborted) throw signal.reason ?? abortError();

    const attemptController = new AbortController();
    const abortFromCaller = () => attemptController.abort(signal?.reason ?? abortError());
    signal?.addEventListener('abort', abortFromCaller, { once: true });
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      attemptController.abort();
    }, boundedTimeoutMs);

    try {
      const result = await operation(attemptController.signal);
      if (timedOut) throw new DOMException('The financial source request timed out.', 'AbortError');
      if (signal?.aborted) throw signal.reason ?? abortError();
      return result;
    } catch (error) {
      lastError = timedOut
        ? new DOMException('The financial source request timed out.', 'AbortError')
        : error;
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortFromCaller);
    }

    if (signal?.aborted
      || attempt + 1 >= boundedAttempts
      || !isTransientFinancialSourceReadError(lastError)) {
      throw lastError;
    }

    await waitForRetry(Math.max(0, retryDelayMs) * (attempt + 1), signal);
  }

  throw lastError;
}
