import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createSupabaseTimeoutFetch,
  DEFAULT_SUPABASE_REQUEST_TIMEOUT_MS,
  getSupabaseRequestTimeoutMs,
} from '../database/client';

describe('Supabase startup readiness isolation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('does not use an anonymous SELECT on an RLS-protected table for readiness', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/database/client.ts'), 'utf8');
    expect(source).toContain('tempClient.auth.getSession()');
    expect(source).not.toContain("tempClient.from('schools').select('id').limit(1)");
  });

  it('uses a finite default timeout and accepts a positive override', () => {
    expect(DEFAULT_SUPABASE_REQUEST_TIMEOUT_MS).toBe(3_000);
    expect(getSupabaseRequestTimeoutMs()).toBe(DEFAULT_SUPABASE_REQUEST_TIMEOUT_MS);

    vi.stubEnv('SUPABASE_REQUEST_TIMEOUT_MS', '1250');
    expect(getSupabaseRequestTimeoutMs()).toBe(1250);

    vi.stubEnv('SUPABASE_REQUEST_TIMEOUT_MS', 'invalid');
    expect(getSupabaseRequestTimeoutMs()).toBe(DEFAULT_SUPABASE_REQUEST_TIMEOUT_MS);
  });

  it('passes a successful readiness request through and releases the timeout', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.signal?.aborted).toBe(false);
      return new Response('{}', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await createSupabaseTimeoutFetch(50)('https://example.test/rest/v1/schools');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('aborts a slow readiness request instead of leaving an unresolved promise', async () => {
    let receivedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      receivedSignal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The readiness request timed out.', 'AbortError'));
        }, { once: true });
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createSupabaseTimeoutFetch(10)('https://example.test/rest/v1/schools'),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(receivedSignal?.aborted).toBe(true);
  });

  it('propagates caller cancellation and still cleans up the timeout', async () => {
    const callerController = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      receivedSignal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The caller cancelled the request.', 'AbortError'));
        }, { once: true });
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = createSupabaseTimeoutFetch(1000)(
      'https://example.test/rest/v1/schools',
      { signal: callerController.signal },
    );
    callerController.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(receivedSignal?.aborted).toBe(true);
  });

  it('forwards readiness failures so retry logic can handle them deterministically', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('staging readiness rejected');
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createSupabaseTimeoutFetch(50)('https://example.test/rest/v1/schools'),
    ).rejects.toThrow('staging readiness rejected');
  });
});
