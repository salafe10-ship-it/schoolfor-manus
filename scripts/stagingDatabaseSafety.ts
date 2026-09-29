import {
  extractPostgresProjectRef,
  extractSupabaseProjectRef,
} from '../server/security/SupabaseDatabaseTargetAlignment.js';

export const CLOUDFLARE_STAGING_WORKER_URL = 'https://schoolfor-manus-staging.salafe10.workers.dev';
export const STAGING_SUPABASE_PROJECT_REF = 'vjcjscqgmijgzagshsca';
export const STAGING_TARGET_NAME = 'schoolfor-manus-staging';

export function assertCloudflareStagingWorkerUrl(value: string): void {
  let target: URL;
  try {
    target = new URL(value);
  } catch {
    throw new Error('CLOUDFLARE_STAGING_WORKER_URL_INVALID');
  }

  if (target.origin !== CLOUDFLARE_STAGING_WORKER_URL || target.pathname !== '/' || target.search || target.hash) {
    throw new Error('TARGET_MUST_BE_THE_ISOLATED_CLOUDFLARE_STAGING_WORKER');
  }
}

export function assertStagingSupabaseUrl(value: string): void {
  if (extractSupabaseProjectRef(value) !== STAGING_SUPABASE_PROJECT_REF) {
    throw new Error('SUPABASE_URL_MUST_TARGET_THE_ISOLATED_STAGING_PROJECT');
  }
}

export function assertIsolatedStagingDatabase(input: {
  targetName: string;
  supabaseUrl: string;
  databaseUrl: string;
}): void {
  if (input.targetName !== STAGING_TARGET_NAME) {
    throw new Error('DATABASE_TARGET_MUST_BE_SCHOOLFORMANUS_CLOUDFLARE_STAGING');
  }
  assertStagingSupabaseUrl(input.supabaseUrl);
  if (extractPostgresProjectRef(input.databaseUrl) !== STAGING_SUPABASE_PROJECT_REF) {
    throw new Error('DATABASE_URL_MUST_TARGET_THE_ISOLATED_STAGING_PROJECT');
  }
}

export function assertLocalStagingEnvironment(input: {
  environment: string;
  targetName: string;
  supabaseUrl: string;
  databaseUrl: string;
  databaseRoleExpected?: string;
  directUrl?: string;
  adminDatabaseUrl?: string;
  anonKey?: string;
  serviceRoleKey?: string;
  runtimeSchemaBootstrap?: string;
}): void {
  if (input.environment.trim().toLowerCase() !== 'staging') {
    throw new Error('LOCAL_STAGING_ENVIRONMENT_REQUIRED');
  }

  assertIsolatedStagingDatabase(input);

  if (input.databaseRoleExpected !== 'edupro_staging_app') {
    throw new Error('STAGING_DATABASE_ROLE_MUST_BE_RESTRICTED_APP_ROLE');
  }
  let appRole = '';
  try {
    appRole = decodeURIComponent(new URL(input.databaseUrl).username).split('.')[0];
  } catch {
    // The isolated target guard above reports malformed database URLs.
  }
  if (appRole !== input.databaseRoleExpected) {
    throw new Error('DATABASE_URL_MUST_USE_THE_RESTRICTED_STAGING_APP_ROLE');
  }

  if (!input.adminDatabaseUrl) {
    throw new Error('STAGING_ADMIN_DATABASE_URL_REQUIRED');
  }
  if (extractPostgresProjectRef(input.adminDatabaseUrl) !== STAGING_SUPABASE_PROJECT_REF) {
    throw new Error('PLATFORM_ADMIN_DATABASE_URL_MUST_TARGET_THE_ISOLATED_STAGING_PROJECT');
  }
  if (input.directUrl && extractPostgresProjectRef(input.directUrl) !== STAGING_SUPABASE_PROJECT_REF) {
    throw new Error('DIRECT_URL_MUST_TARGET_THE_ISOLATED_STAGING_PROJECT');
  }
  if (!input.anonKey) {
    throw new Error('STAGING_ANON_KEY_REQUIRED');
  }
  if (!input.serviceRoleKey) {
    throw new Error('STAGING_SERVICE_ROLE_KEY_REQUIRED');
  }
  if (input.runtimeSchemaBootstrap === 'true') {
    throw new Error('RUNTIME_SCHEMA_BOOTSTRAP_MUST_REMAIN_DISABLED_FOR_STAGING_UAT');
  }
}
