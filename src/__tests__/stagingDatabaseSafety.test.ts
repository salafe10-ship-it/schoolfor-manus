import { describe, expect, it } from 'vitest';
import {
  assertCloudflareStagingWorkerUrl,
  assertIsolatedStagingDatabase,
  assertLocalStagingEnvironment,
  assertStagingSupabaseUrl,
  CLOUDFLARE_STAGING_WORKER_URL,
  STAGING_SUPABASE_PROJECT_REF,
} from '../../scripts/stagingDatabaseSafety.js';
import { getServerListenHost } from '../../server/infrastructure/ServerListenHost.js';

const stagingDatabaseUrl = `postgresql://edupro_staging_app.${STAGING_SUPABASE_PROJECT_REF}:not-a-secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`;
const stagingAdminDatabaseUrl = `postgresql://postgres.${STAGING_SUPABASE_PROJECT_REF}:not-a-secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`;

describe('isolated Cloudflare staging target guard', () => {
  it('accepts only the canonical staging Worker URL', () => {
    expect(() => assertCloudflareStagingWorkerUrl(CLOUDFLARE_STAGING_WORKER_URL)).not.toThrow();
    expect(() => assertCloudflareStagingWorkerUrl(`${CLOUDFLARE_STAGING_WORKER_URL}/`)).not.toThrow();
    expect(() => assertCloudflareStagingWorkerUrl('https://schoolfor-manus.salafe10.workers.dev')).toThrow(
      'TARGET_MUST_BE_THE_ISOLATED_CLOUDFLARE_STAGING_WORKER',
    );
    expect(() => assertCloudflareStagingWorkerUrl('https://schoolfor-manus-staging.salafe10.workers.dev/another-path')).toThrow();
  });

  it('accepts only the dedicated staging Supabase project URL', () => {
    expect(() => assertStagingSupabaseUrl(`https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`)).not.toThrow();
    expect(() => assertStagingSupabaseUrl('https://wjhraxvxvvthxqlpyohh.supabase.co')).toThrow(
      'SUPABASE_URL_MUST_TARGET_THE_ISOLATED_STAGING_PROJECT',
    );
  });

  it('requires the target label, Auth URL, and PostgreSQL URL to identify staging', () => {
    expect(() => assertIsolatedStagingDatabase({
      targetName: 'schoolfor-manus-staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`,
      databaseUrl: stagingDatabaseUrl,
    })).not.toThrow();

    expect(() => assertIsolatedStagingDatabase({
      targetName: 'schoolfor-manus-staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`,
      databaseUrl: 'postgresql://postgres.wjhraxvxvvthxqlpyohh:not-a-secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
    })).toThrow('DATABASE_URL_MUST_TARGET_THE_ISOLATED_STAGING_PROJECT');
  });

  it('allows local staging only when every configured database target is the staging project', () => {
    expect(() => assertLocalStagingEnvironment({
      environment: 'staging',
      targetName: 'schoolfor-manus-staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`,
      databaseUrl: stagingDatabaseUrl,
      databaseRoleExpected: 'edupro_staging_app',
      directUrl: stagingAdminDatabaseUrl,
      adminDatabaseUrl: stagingAdminDatabaseUrl,
      anonKey: 'stage-anon-test-key',
      serviceRoleKey: 'stage-only-test-key',
    })).not.toThrow();

    expect(() => assertLocalStagingEnvironment({
      environment: 'staging',
      targetName: 'schoolfor-manus-staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`,
      databaseUrl: stagingDatabaseUrl,
      databaseRoleExpected: 'edupro_staging_app',
      directUrl: 'postgresql://postgres.wjhraxvxvvthxqlpyohh:not-a-secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
      adminDatabaseUrl: stagingAdminDatabaseUrl,
      anonKey: 'stage-anon-test-key',
      serviceRoleKey: 'stage-only-test-key',
    })).toThrow('DIRECT_URL_MUST_TARGET_THE_ISOLATED_STAGING_PROJECT');

    expect(() => assertLocalStagingEnvironment({
      environment: 'staging',
      targetName: 'schoolfor-manus-staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`,
      databaseUrl: stagingDatabaseUrl,
      databaseRoleExpected: 'edupro_staging_app',
      adminDatabaseUrl: 'postgresql://postgres.wjhraxvxvvthxqlpyohh:not-a-secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
      anonKey: 'stage-anon-test-key',
      serviceRoleKey: 'stage-only-test-key',
    })).toThrow('PLATFORM_ADMIN_DATABASE_URL_MUST_TARGET_THE_ISOLATED_STAGING_PROJECT');
  });

  it('requires staging mode, staging admin access and disabled runtime schema bootstrap', () => {
    const validConfig = {
      environment: 'staging',
      targetName: 'schoolfor-manus-staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`,
      databaseUrl: stagingDatabaseUrl,
      databaseRoleExpected: 'edupro_staging_app',
      adminDatabaseUrl: stagingAdminDatabaseUrl,
      anonKey: 'stage-anon-test-key',
      serviceRoleKey: 'stage-only-test-key',
    };
    expect(() => assertLocalStagingEnvironment({ ...validConfig, environment: 'production' }))
      .toThrow('LOCAL_STAGING_ENVIRONMENT_REQUIRED');
    expect(() => assertLocalStagingEnvironment({ ...validConfig, runtimeSchemaBootstrap: 'true' }))
      .toThrow('RUNTIME_SCHEMA_BOOTSTRAP_MUST_REMAIN_DISABLED_FOR_STAGING_UAT');
    expect(() => assertLocalStagingEnvironment({ ...validConfig, databaseRoleExpected: 'postgres' }))
      .toThrow('STAGING_DATABASE_ROLE_MUST_BE_RESTRICTED_APP_ROLE');
    expect(getServerListenHost(true)).toBe('127.0.0.1');
    expect(getServerListenHost(false)).toBe('0.0.0.0');
  });
});
