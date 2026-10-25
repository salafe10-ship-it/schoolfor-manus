import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { restoreStagingSecrets, saveStagingSecrets } from '../../scripts/staging-secret-store.js';

const directories: string[] = [];
function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'edupro-vault-test-'));
  directories.push(directory);
  const source = path.join(directory, '.env.staging');
  const text = [
    'EDUPRO_ENVIRONMENT=staging', 'UAT35_TARGET=schoolfor-manus-staging',
    'DATABASE_ROLE_EXPECTED=edupro_staging_app',
    'SUPABASE_URL=https://vjcjscqgmijgzagshsca.supabase.co',
    'SUPABASE_ANON_KEY=synthetic-public-key', 'SUPABASE_SERVICE_ROLE_KEY=synthetic-private-key',
    'DATABASE_URL=postgresql://edupro_staging_app.vjcjscqgmijgzagshsca:synthetic-password@aws-1-eu-west-1.pooler.supabase.com:5432/postgres',
    'PLATFORM_ADMIN_DATABASE_URL=postgresql://postgres.vjcjscqgmijgzagshsca:synthetic-admin-password@aws-1-eu-west-1.pooler.supabase.com:5432/postgres',
    'JWT_SECRET=synthetic-jwt-secret', 'AUTO_MIGRATE=false', 'AUTO_SEED=false',
    'RUNTIME_SCHEMA_BOOTSTRAP=false', 'FINANCIAL_WRITES_LOCKED=true',
  ].join('\n');
  fs.writeFileSync(source, text);
  return { directory, source, text, vault: path.join(directory, 'private-vault') };
}
afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe('persistent Staging credential store', () => {
  it('refuses production credentials before saving any vault data', () => {
    const f = fixture();
    fs.writeFileSync(f.source, f.text.replace('SUPABASE_URL=https://vjcjscqgmijgzagshsca', 'SUPABASE_URL=https://wjhraxvxvvthxqlpyohh'));
    expect(() => saveStagingSecrets(f.source, f.vault)).toThrow('SUPABASE_URL_MUST_TARGET_THE_ISOLATED_STAGING_PROJECT');
    expect(fs.existsSync(f.vault)).toBe(false);
  });

  it.skipIf(process.platform !== 'win32')('restores exact credentials after removing the workspace copy', () => {
    const f = fixture();
    saveStagingSecrets(f.source, f.vault);
    const ciphertext = fs.readFileSync(path.join(f.vault, 'environment.dpapi'));
    expect(ciphertext.includes(Buffer.from('synthetic-password'))).toBe(false);
    fs.unlinkSync(f.source);
    expect(restoreStagingSecrets(f.source, f.vault)).toBe('restored');
    expect(fs.readFileSync(f.source, 'utf8')).toBe(f.text);
    expect(restoreStagingSecrets(f.source, f.vault)).toBe('preserved');
    expect(fs.readdirSync(f.vault)).toEqual(['environment.dpapi']);
  });

  it.skipIf(process.platform !== 'win32')('rejects altered ciphertext without replacing local credentials', () => {
    const f = fixture();
    saveStagingSecrets(f.source, f.vault);
    const encrypted = path.join(f.vault, 'environment.dpapi');
    const bytes = fs.readFileSync(encrypted);
    bytes[bytes.length - 1] ^= 0xff;
    fs.writeFileSync(encrypted, bytes);
    expect(() => restoreStagingSecrets(f.source, f.vault)).toThrow('STAGING_VAULT_ENCRYPTION_OR_ACCOUNT_CHECK_FAILED');
    expect(fs.readFileSync(f.source, 'utf8')).toBe(f.text);
    expect(fs.readdirSync(f.vault)).toEqual(['environment.dpapi']);
  });

  it.skipIf(process.platform !== 'win32')('preserves changed local credentials rather than replacing them silently', () => {
    const f = fixture();
    saveStagingSecrets(f.source, f.vault);
    const changed = f.text.replace('synthetic-jwt-secret', 'synthetic-rotated-secret');
    fs.writeFileSync(f.source, changed);
    expect(() => restoreStagingSecrets(f.source, f.vault)).toThrow('STAGING_LOCAL_ENV_DIFFERS_FROM_VAULT');
    expect(fs.readFileSync(f.source, 'utf8')).toBe(changed);
  });
});
