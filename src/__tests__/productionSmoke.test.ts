// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runProductionSmoke } from '../../scripts/production-smoke.mjs';

const commit = 'a'.repeat(40);
const build = { commit, version: '1.0.0', builtAt: '2026-10-21T12:00:00Z' };
const options = { attempts: 1, timeoutMs: 100, retryDelayMs: 0 };

describe('production release verification', () => {
  afterEach(() => vi.unstubAllGlobals());

  const installResponses = (ready = true) => vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    if (input.includes('/api/health')) return Response.json({ data: { build } });
    if (input.endsWith('/api/ready')) return Response.json({ data: { ready, build } }, { status: ready ? 200 : 503 });
    if (input.includes('/assets/')) return new Response(null, { status: 200 });
    return new Response('<html><script src="/assets/app.js"></script></html>');
  }));

  it('accepts matching healthy backend, ready state, HTML, and application asset', async () => {
    installResponses();
    await expect(runProductionSmoke('https://school.example', commit, options))
      .resolves.toMatchObject({ success: true, health: 200, ready: 200, index: 200, failures: [] });
  });

  it('rejects a release that is live but not ready', async () => {
    installResponses(false);
    const result = await runProductionSmoke('https://school.example', commit, options);
    expect(result.success).toBe(false);
    expect(result.failures).toContain('READY_HTTP_503');
  });

  it('reports transport failures without crashing before it produces evidence', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw Object.assign(new Error('fetch failed'), { cause: { code: 'ECONNRESET' } }); }));
    const result = await runProductionSmoke('https://school.example', commit, options);
    expect(result.success).toBe(false);
    expect(result.failures).toEqual(expect.arrayContaining(['HEALTH_REQUEST_FAILED', 'READY_REQUEST_FAILED', 'INDEX_REQUEST_FAILED']));
    expect(result.networkErrors).toContainEqual({ operation: 'index', code: 'ECONNRESET' });
  });
});
