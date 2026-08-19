import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  getTrustedAccessTokenAsync: vi.fn(),
  refreshTrustedAccessToken: vi.fn()
}));

vi.mock('../utils/auth', () => authMock);

import { AuthenticationRequestError, authenticatedRequest } from '../utils/authenticatedRequest';

function response(status: number): Response {
  return { status, ok: status >= 200 && status < 300 } as Response;
}

describe('authenticatedRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('uses the current token for a successful request', async () => {
    authMock.getTrustedAccessTokenAsync.mockResolvedValue('current-token');
    const fetchMock = vi.mocked(fetch).mockResolvedValue(response(200));

    await expect(authenticatedRequest('/api/students')).resolves.toMatchObject({ status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0][1]?.headers as Headers).get('Authorization')).toBe('Bearer current-token');
    expect(authMock.refreshTrustedAccessToken).not.toHaveBeenCalled();
  });

  it('refreshes once and retries once after a 401', async () => {
    authMock.getTrustedAccessTokenAsync.mockResolvedValue('current-token');
    authMock.refreshTrustedAccessToken.mockResolvedValue('new-token');
    const fetchMock = vi.mocked(fetch)
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(200));

    await expect(authenticatedRequest('/api/students', { method: 'POST' })).resolves.toMatchObject({ status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authMock.refreshTrustedAccessToken).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[1][1]?.headers as Headers).get('Authorization')).toBe('Bearer new-token');
  });

  it('stops after one retry when the second response is 401', async () => {
    authMock.getTrustedAccessTokenAsync.mockResolvedValue('current-token');
    authMock.refreshTrustedAccessToken.mockResolvedValue('new-token');
    const fetchMock = vi.mocked(fetch)
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(401));

    await expect(authenticatedRequest('/api/students')).rejects.toBeInstanceOf(AuthenticationRequestError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authMock.refreshTrustedAccessToken).toHaveBeenCalledTimes(1);
  });

  it('does not send a request when the initial session cannot be acquired', async () => {
    authMock.getTrustedAccessTokenAsync.mockResolvedValue('');
    const fetchMock = vi.mocked(fetch);

    await expect(authenticatedRequest('/api/students')).rejects.toBeInstanceOf(AuthenticationRequestError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not retry or send a request when refresh fails after 401', async () => {
    authMock.getTrustedAccessTokenAsync.mockResolvedValue('current-token');
    authMock.refreshTrustedAccessToken.mockResolvedValue('');
    const fetchMock = vi.mocked(fetch).mockResolvedValueOnce(response(401));

    await expect(authenticatedRequest('/api/students')).rejects.toBeInstanceOf(AuthenticationRequestError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(authMock.refreshTrustedAccessToken).toHaveBeenCalledTimes(1);
  });
});
