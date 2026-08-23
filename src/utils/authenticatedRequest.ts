import * as auth from './auth';

export class AuthenticationRequestError extends Error {
  constructor(message = 'Authentication session expired. Please sign in again.') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function withAuthorization(init: RequestInit, token: string): RequestInit {
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

/**
 * Sends an authenticated request using the official trusted session lifecycle.
 * A server-side 401 may trigger one explicit refresh and one retry only.
 */
export async function authenticatedRequest(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  // The namespace access is intentionally optional so lightweight unit-test
  // mocks that only provide the async lifecycle still exercise this layer.
  let locallySafeToken = '';
  try {
    locallySafeToken = typeof (auth as any).getTrustedAccessToken === 'function'
      ? (auth as any).getTrustedAccessToken()
      : '';
  } catch {
    // Some isolated test/runtime adapters expose only the async contract.
  }
  let token = locallySafeToken || await auth.getTrustedAccessTokenAsync();
  if (!token) throw new AuthenticationRequestError();

  let response = await fetch(input, withAuthorization(init, token));
  if (response.status !== 401) return response;

  token = await auth.refreshTrustedAccessToken();
  if (!token) throw new AuthenticationRequestError();

  response = await fetch(input, withAuthorization(init, token));
  if (response.status === 401) throw new AuthenticationRequestError();
  return response;
}
