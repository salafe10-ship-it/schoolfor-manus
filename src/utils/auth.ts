import { TrustedSessionManager } from '../middleware/trustedSessionManager';

let trustedSessionManager: TrustedSessionManager | null = null;
let managerWindow: Window | null = null;

function getTrustedSessionManager(): TrustedSessionManager | null {
  if (typeof window === 'undefined') return null;
  if (trustedSessionManager && managerWindow === window) return trustedSessionManager;
  trustedSessionManager = new TrustedSessionManager(window.localStorage, window.sessionStorage);
  managerWindow = window;
  return trustedSessionManager;
}

/**
 * Returns the currently stored token only when its locally known expiry is safe.
 * Network-backed validation/refresh belongs to getTrustedAccessTokenAsync().
 */
export function getTrustedAccessToken(): string {
  const manager = getTrustedSessionManager();
  if (!manager) return '';
  const token = manager.getAccessToken();
  if (!token || manager.isAccessTokenExpiringSoon()) return '';
  return token;
}

/**
 * Restores the official trusted session before an API request. The session
 * manager performs expiry-aware validation and refreshes through the existing
 * backend auth endpoints when needed. An unusable session fails closed.
 */
export async function getTrustedAccessTokenAsync(): Promise<string> {
  const manager = getTrustedSessionManager();
  if (!manager) return '';
  try {
    // This helper owns the explicit restore/validation contract. The shared
    // request layer checks the locally safe token first, so normal API calls do
    // not add a session round-trip; direct callers still get authoritative
    // session validation here.
    await manager.restore();
    const token = manager.getAccessToken();
    return token && !manager.isAccessTokenExpiringSoon() ? token : '';
  } catch {
    return '';
  }
}

/**
 * Performs one explicit refresh through the existing TrustedSessionManager.
 * Callers receive an empty string on failure and must fail closed.
 */
export async function refreshTrustedAccessToken(): Promise<string> {
  const manager = getTrustedSessionManager();
  if (!manager) return '';
  try {
    await manager.refresh();
    const token = manager.getAccessToken();
    return token && !manager.isAccessTokenExpiringSoon() ? token : '';
  } catch {
    return '';
  }
}
