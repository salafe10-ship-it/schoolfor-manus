import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (relativePath: string): string => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('Cloudflare API routing contract', () => {
  it('runs the Worker before the SPA fallback for every API route', () => {
    const wrangler = read('wrangler.jsonc');
    expect(wrangler).toContain('"run_worker_first": ["/api/*"]');
  });

  it('keeps the tenant and control-plane Hyperdrive bindings available', () => {
    const wrangler = read('wrangler.jsonc');
    const worker = read('cloudflare-worker.ts');
    expect(wrangler).toContain('"binding": "HYPERDRIVE"');
    expect(wrangler).toContain('"binding": "HYPERDRIVE_ADMIN"');
    expect(worker).toContain('HYPERDRIVE_ADMIN?: { connectionString: string }');
    expect(worker).toContain('processEnvironment.PLATFORM_ADMIN_DATABASE_URL = bindings.HYPERDRIVE_ADMIN.connectionString');
    expect(worker).toContain('processEnvironment.EDUPRO_CONFIGURED_DATABASE_URL = configuredDatabaseUrl');
    expect(worker).toContain('processEnvironment.EDUPRO_CONFIGURED_ADMIN_DATABASE_URL = configuredAdminDatabaseUrl');
    expect(worker).toContain("processEnvironment.EDUPRO_CLOUDFLARE_HYPERDRIVE = 'true'");
  });

  it('does not layer direct Supabase SSL options over Hyperdrive connections', () => {
    const sslConfig = read('server/infrastructure/PostgresSslConfig.ts');
    const server = read('server.ts');
    expect(sslConfig).toContain("process.env.EDUPRO_CLOUDFLARE_HYPERDRIVE === 'true'");
    expect(server).toContain("process.env.EDUPRO_CLOUDFLARE_HYPERDRIVE === 'true'");
  });
});
