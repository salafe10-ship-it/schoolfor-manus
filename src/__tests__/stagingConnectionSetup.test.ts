// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { createStagingSetupServer, loadStagingCaCertificate } from '../../scripts/staging-connection-setup.js';

const servers: http.Server[] = [];
afterEach(async () => { for (const server of servers.splice(0)) await new Promise<void>((resolve) => server.close(() => resolve())); });
async function start(configure = vi.fn(async () => {})) {
  const server = createStagingSetupServer(configure); servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  const request = (method: string, url: string, headers: Record<string, string> = {}, body = '') =>
    new Promise<{ status: number; body: string; cookie?: string[] }>((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port, path: url, method,
        headers: { Host: '127.0.0.1:4182', ...headers } }, (res) => {
        let text = ''; res.setEncoding('utf8'); res.on('data', (part) => text += part);
        res.on('end', () => resolve({ status: res.statusCode!, body: text, cookie: res.headers['set-cookie'] }));
      }); req.on('error', reject); req.end(body);
    });
  return { request, configure };
}

describe('owner-operated local Staging connection setup', () => {
  it('requires a valid Supabase CA certificate before attempting a database connection', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'staging-ca-'));
    const missing = path.join(directory, 'missing.crt');
    expect(() => loadStagingCaCertificate(missing)).toThrow('STAGING_CA_CERTIFICATE_MISSING');
    const invalid = path.join(directory, 'invalid.crt');
    fs.writeFileSync(invalid, 'not a certificate');
    expect(() => loadStagingCaCertificate(invalid)).toThrow('STAGING_CA_CERTIFICATE_INVALID');
    fs.rmSync(directory, { recursive: true, force: true });
  });
  it('rejects foreign hosts and cross-site writes before touching a database', async () => {
    const f = await start();
    expect((await f.request('GET', '/', { Host: 'malicious.example' })).status).toBe(403);
    const page = await f.request('GET', '/');
    expect(page.status).toBe(200);
    const cookie = page.cookie![0].split(';')[0];
    const result = await f.request('POST', '/configure', { Origin: 'https://malicious.example',
      Cookie: cookie, 'Content-Type': 'application/json' }, '{}');
    expect(result.status).toBe(403);
    expect(f.configure).not.toHaveBeenCalled();
  });
  it('requires the local session and same-origin JSON before accepting the owner action', async () => {
    const f = await start();
    expect((await f.request('POST', '/configure', { Origin: 'http://127.0.0.1:4182',
      'Content-Type': 'application/json' }, '{}')).status).toBe(403);
    const page = await f.request('GET', '/');
    expect(page.body).not.toContain('sb_secret_');
    const result = await f.request('POST', '/configure', { Origin: 'http://127.0.0.1:4182',
      Cookie: page.cookie![0].split(';')[0], 'Content-Type': 'application/json' }, '{"confirmation":"synthetic-owner-action"}');
    expect(result.status).toBe(200);
    expect(f.configure).toHaveBeenCalledWith({ confirmation: 'synthetic-owner-action' });
  });
  it('does not echo database errors or submitted secrets', async () => {
    const f = await start(vi.fn(async () => { throw new Error('password synthetic-private-password failed'); }));
    const page = await f.request('GET', '/');
    const result = await f.request('POST', '/configure', { Origin: 'http://127.0.0.1:4182',
      Cookie: page.cookie![0].split(';')[0], 'Content-Type': 'application/json' }, '{}');
    expect(result.status).toBe(400);
    expect(result.body).toContain('STAGING_DATABASE_AUTH_OR_TLS_FAILED');
    expect(result.body).not.toContain('synthetic-private-password');
  });
  it('returns a safe credential category without exposing PostgreSQL details', async () => {
    const failure = Object.assign(new Error('password synthetic-private-password failed'), { code: '28P01' });
    const f = await start(vi.fn(async () => { throw failure; }));
    const page = await f.request('GET', '/');
    const result = await f.request('POST', '/configure', { Origin: 'http://127.0.0.1:4182',
      Cookie: page.cookie![0].split(';')[0], 'Content-Type': 'application/json' }, '{}');
    expect(result.status).toBe(400);
    expect(result.body).toContain('STAGING_DATABASE_CREDENTIALS_REJECTED');
    expect(result.body).not.toContain('synthetic-private-password');
  });
});
