import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { createMemoryRateLimiter } from '../middleware/memoryRateLimit';

function responseDouble() {
  const response = {
    headers: new Map<string, string>(),
    statusCode: 200,
    body: undefined as unknown,
    set(name: string, value: string) {
      this.headers.set(name, value);
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return response as unknown as Response & typeof response;
}

function requestDouble(ip: string) {
  return { ip, socket: { remoteAddress: ip } } as unknown as Request;
}

describe('createMemoryRateLimiter', () => {
  it('allows requests within the configured window and exposes standard headers', () => {
    const limiter = createMemoryRateLimiter({ windowMs: 60_000, max: 2 });
    const response = responseDouble();
    const next = vi.fn();

    limiter(requestDouble('10.0.0.1'), response, next);
    limiter(requestDouble('10.0.0.1'), response, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(response.headers.get('RateLimit-Limit')).toBe('2');
    expect(response.headers.get('RateLimit-Remaining')).toBe('0');
  });

  it('returns 429 after the per-key limit is exceeded', () => {
    const limiter = createMemoryRateLimiter({ windowMs: 60_000, max: 1 });
    const response = responseDouble();
    const next = vi.fn();

    limiter(requestDouble('10.0.0.2'), response, next);
    limiter(requestDouble('10.0.0.2'), response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(429);
    expect(response.body).toMatchObject({ success: false, code: 'RATE_LIMITED' });
  });

  it('fails safely when the bounded counter map is at capacity', () => {
    const limiter = createMemoryRateLimiter({ windowMs: 60_000, max: 10, maxKeys: 1 });
    const firstResponse = responseDouble();
    const secondResponse = responseDouble();
    const next = vi.fn();

    limiter(requestDouble('10.0.0.3'), firstResponse, next);
    limiter(requestDouble('10.0.0.4'), secondResponse, next);

    expect(secondResponse.statusCode).toBe(503);
    expect(secondResponse.body).toMatchObject({ success: false, code: 'RATE_LIMITER_CAPACITY' });
  });

  it('reclaims expired keys before rejecting a new key at capacity', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const limiter = createMemoryRateLimiter({ windowMs: 1_000, max: 10, maxKeys: 1 });
    const firstResponse = responseDouble();
    const secondResponse = responseDouble();
    const next = vi.fn();

    limiter(requestDouble('10.0.0.5'), firstResponse, next);
    vi.mocked(Date.now).mockReturnValue(now + 1_001);
    limiter(requestDouble('10.0.0.6'), secondResponse, next);

    expect(secondResponse.statusCode).toBe(200);
    expect(next).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });
});
