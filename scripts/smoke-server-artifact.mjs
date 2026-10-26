import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const serverPath = path.resolve(process.cwd(), 'dist', 'server.cjs');
if (!fs.existsSync(serverPath)) {
  console.error('SERVER_ARTIFACT_SMOKE_FAILED:DIST_SERVER_MISSING');
  process.exit(1);
}

function reserveLocalPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = address && typeof address === 'object' ? address.port : 0;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function main() {
  const port = await reserveLocalPort();
  const temporaryRoot = path.resolve(os.tmpdir());
  const isolatedCwd = fs.mkdtempSync(path.join(temporaryRoot, 'edupro-server-smoke-'));
  const resolvedCwd = path.resolve(isolatedCwd);
  const rootPrefix = `${temporaryRoot}${path.sep}`.toLowerCase();
  if (!resolvedCwd.toLowerCase().startsWith(rootPrefix)
    || !path.basename(resolvedCwd).startsWith('edupro-server-smoke-')) {
    throw new Error('SERVER_ARTIFACT_SMOKE_TEMP_PATH_INVALID');
  }

  const environment = {
    PATH: process.env.PATH || '',
    SYSTEMROOT: process.env.SYSTEMROOT || '',
    WINDIR: process.env.WINDIR || '',
    TEMP: process.env.TEMP || temporaryRoot,
    TMP: process.env.TMP || temporaryRoot,
    NODE_ENV: 'test',
    APP_ENV: 'test',
    EDUPRO_ENVIRONMENT: 'test',
    EDUPRO_LOCAL_STAGING: 'true',
    FINANCIAL_WRITES_LOCKED: 'true',
    FINANCIAL_ERP_MODE: 'read_only',
    RUNTIME_SCHEMA_BOOTSTRAP: 'false',
    AUTO_MIGRATE: 'false',
    AUTO_SEED: 'false',
    PGSSL_REJECT_UNAUTHORIZED: 'true',
    PORT: String(port),
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
    DATABASE_URL: '',
    DIRECT_URL: '',
    PLATFORM_ADMIN_DATABASE_URL: '',
    JWT_SECRET: '',
    UAT_FINANCIAL_BEARER_TOKEN: '',
    OPENAI_API_KEY: '',
    GEMINI_API_KEY: '',
    CLOUDFLARE_API_TOKEN: '',
    CF_API_TOKEN: '',
  };

  let child;
  try {
    child = spawn(process.execPath, [serverPath], {
      cwd: resolvedCwd,
      env: environment,
      stdio: 'ignore',
      windowsHide: true,
    });

    let homepage;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      if (child.exitCode !== null) break;
      try {
        homepage = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1_000) });
        if (homepage.status === 200) break;
      } catch {
        // Retry while the isolated child starts; no external endpoint is used.
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    if (!homepage || homepage.status !== 200) throw new Error('SERVER_STARTUP_OR_HOMEPAGE_FAILED');
    const html = await homepage.text();
    const assetPath = html.match(/(?:src|href)="(\/assets\/[^\"]+\.(?:js|css))"/)?.[1];
    if (!assetPath) throw new Error('SERVER_HOMEPAGE_ASSET_REFERENCE_MISSING');
    const asset = await fetch(`http://127.0.0.1:${port}${assetPath}`, { signal: AbortSignal.timeout(2_000) });
    if (asset.status !== 200) throw new Error('SERVER_STATIC_ASSET_FAILED');

    const unknownApi = await fetch(`http://127.0.0.1:${port}/api/__artifact-smoke-missing-route`, {
      signal: AbortSignal.timeout(2_000),
    });
    const unknownApiBody = await unknownApi.json().catch(() => ({}));
    if (unknownApi.status !== 404 || unknownApiBody.errorCode !== 'API_NOT_FOUND') {
      throw new Error('SERVER_UNKNOWN_API_ROUTE_FALLBACK_FAILED');
    }

    console.log('SERVER_ARTIFACT_SMOKE_OK: homepage=200; asset=200; unknownApi=404; financialWrites=locked.');
  } catch (error) {
    console.error(`SERVER_ARTIFACT_SMOKE_FAILED:${error instanceof Error ? error.message : 'UNKNOWN'}`);
    process.exitCode = 1;
  } finally {
    if (child && child.exitCode === null) child.kill();
    if (child) {
      await new Promise(resolve => {
        if (child.exitCode !== null) return resolve(undefined);
        child.once('exit', resolve);
        setTimeout(resolve, 2_000).unref?.();
      });
    }
    fs.rmSync(resolvedCwd, { recursive: true, force: true });
  }
}

await main();
