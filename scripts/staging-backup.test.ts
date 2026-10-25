import { describe, expect, it } from 'vitest';
import { resolveStagingBackupTarget } from './staging-backup.js';

const projectRef = 'vjcjscqgmijgzagshsca';
const pooler = 'aws-1-eu-west-1.pooler.supabase.com';

function databaseUrl(username: string, password: string, host = pooler): string {
  const url = new URL('postgresql://placeholder.invalid/');
  url.username = username;
  url.password = password;
  url.hostname = host;
  url.port = '5432';
  url.pathname = '/postgres';
  return url.toString();
}

function stagingValues(): Record<string, string> {
  return {
    EDUPRO_ENVIRONMENT: 'staging',
    UAT35_TARGET: 'schoolfor-manus-staging',
    SUPABASE_URL: `https://${projectRef}.supabase.co`,
    SUPABASE_ANON_KEY: 'synthetic-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'synthetic-server-only-key',
    DATABASE_ROLE_EXPECTED: 'edupro_staging_app',
    DATABASE_URL: databaseUrl(`edupro_staging_app.${projectRef}`, 'app-password'),
    PLATFORM_ADMIN_DATABASE_URL: databaseUrl(`postgres.${projectRef}`, 'admin-password'),
    JWT_SECRET: 'synthetic-jwt-secret',
    AUTO_MIGRATE: 'false',
    AUTO_SEED: 'false',
  };
}

describe('Staging backup target guard', () => {
  it('accepts the dedicated Staging project through its Supabase pooler', () => {
    expect(resolveStagingBackupTarget(stagingValues())).toMatchObject({
      host: pooler,
      port: '5432',
      database: 'postgres',
      username: `postgres.${projectRef}`,
      password: 'admin-password',
    });
  });

  it('rejects an admin URL whose project differs from the validated Staging project', () => {
    const values = stagingValues();
    values.PLATFORM_ADMIN_DATABASE_URL = databaseUrl('postgres.prod0000000000000000', 'placeholder-secret');
    expect(() => resolveStagingBackupTarget(values)).toThrow('PLATFORM_ADMIN_DATABASE_URL_MUST_TARGET_THE_ISOLATED_STAGING_PROJECT');
  });

  it('rejects an admin URL using a host outside Supabase database endpoints', () => {
    const values = stagingValues();
    values.PLATFORM_ADMIN_DATABASE_URL = databaseUrl(`postgres.${projectRef}`, 'admin-password', 'db.example.invalid');
    expect(() => resolveStagingBackupTarget(values)).toThrow('STAGING_BACKUP_TARGET_REJECTED');
  });

  it('rejects backups that try to use the restricted application role', () => {
    const values = stagingValues();
    values.PLATFORM_ADMIN_DATABASE_URL = databaseUrl(`edupro_staging_app.${projectRef}`, 'app-password');
    expect(() => resolveStagingBackupTarget(values)).toThrow('STAGING_BACKUP_TARGET_REJECTED');
  });
});
