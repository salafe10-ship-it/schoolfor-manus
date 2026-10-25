import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  assertLocalStagingEnvironment,
  STAGING_SUPABASE_PROJECT_REF,
  STAGING_TARGET_NAME,
} from './stagingDatabaseSafety.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stagingEnvPath = path.join(repositoryRoot, '.env.staging');
const examplePath = path.join(repositoryRoot, '.env.staging.example');

const requiredSecretKeys = [
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'PLATFORM_ADMIN_DATABASE_URL',
  'JWT_SECRET',
] as const;

export function missingStagingSecretKeys(values: Record<string, string | undefined>): string[] {
  return requiredSecretKeys.filter((key) => !String(values[key] || '').trim());
}

export function validateStagingEnvironmentValues(values: Record<string, string | undefined>) {
  const missing = missingStagingSecretKeys(values);
  if (missing.length) {
    throw new Error(`STAGING_ENV_MISSING_KEYS:${missing.join(',')}`);
  }

  if (values.UAT35_TARGET !== STAGING_TARGET_NAME) {
    throw new Error('DATABASE_TARGET_MUST_BE_SCHOOLFORMANUS_CLOUDFLARE_STAGING');
  }
  if (String(values.AUTO_MIGRATE || '').toLowerCase() === 'true') {
    throw new Error('STAGING_AUTO_MIGRATE_MUST_REMAIN_DISABLED');
  }
  if (String(values.AUTO_SEED || '').toLowerCase() === 'true') {
    throw new Error('STAGING_AUTO_SEED_MUST_REMAIN_DISABLED');
  }

  assertLocalStagingEnvironment({
    environment: values.EDUPRO_ENVIRONMENT || '',
    targetName: values.UAT35_TARGET || '',
    supabaseUrl: values.SUPABASE_URL || '',
    databaseUrl: values.DATABASE_URL || '',
    databaseRoleExpected: values.DATABASE_ROLE_EXPECTED,
    directUrl: values.DIRECT_URL,
    adminDatabaseUrl: values.PLATFORM_ADMIN_DATABASE_URL,
    anonKey: values.SUPABASE_ANON_KEY,
    serviceRoleKey: values.SUPABASE_SERVICE_ROLE_KEY,
    runtimeSchemaBootstrap: values.RUNTIME_SCHEMA_BOOTSTRAP,
  });

  return {
    projectRef: STAGING_SUPABASE_PROJECT_REF,
    databaseRole: 'edupro_staging_app',
    financialWritesLocked: values.UAT_ALLOW_LOCAL_STAGING !== 'true'
      || values.UAT_STUDENT_FEES_STAGING_CONFIRM !== 'RUN_STUDENT_FEES_STAGING_UAT'
      || values.UAT_FINANCIAL_BASE_URL !== 'http://127.0.0.1:4179',
  };
}

function restrictFilePermissions(filePath: string): void {
  if (process.platform === 'win32') {
    const currentUser = execFileSync('whoami', { encoding: 'utf8', windowsHide: true }).trim();
    // Remove inherited and prior explicit entries, then grant access only to
    // the current Windows user, SYSTEM, and local Administrators.
    execFileSync('icacls', [filePath, '/reset'], { stdio: 'ignore', windowsHide: true });
    execFileSync('icacls', [filePath, '/inheritance:r'], { stdio: 'ignore', windowsHide: true });
    execFileSync('icacls', [
      filePath,
      '/grant:r',
      `${currentUser}:(F)`,
      '*S-1-5-18:(F)',
      '*S-1-5-32-544:(F)',
    ], { stdio: 'ignore', windowsHide: true });
    return;
  }

  fs.chmodSync(filePath, 0o600);
}

export function initializeStagingEnvFile(): 'created' | 'preserved' {
  if (!fs.existsSync(examplePath)) throw new Error('STAGING_ENV_EXAMPLE_MISSING');
  let result: 'created' | 'preserved' = 'preserved';
  try {
    fs.copyFileSync(examplePath, stagingEnvPath, fs.constants.COPYFILE_EXCL);
    result = 'created';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  restrictFilePermissions(stagingEnvPath);
  return result;
}

export function verifyStagingEnvFile(): void {
  if (!fs.existsSync(stagingEnvPath)) throw new Error('LOCAL_STAGING_ENV_FILE_MISSING');
  restrictFilePermissions(stagingEnvPath);
  const values = dotenv.parse(fs.readFileSync(stagingEnvPath));
  validateStagingEnvironmentValues(values);
}

function main(): void {
  const action = process.argv[2];
  if (action === 'init') {
    const state = initializeStagingEnvFile();
    console.info(`Staging environment file ${state}; private file permissions applied. Values were not printed.`);
    console.info('The template is locked to the dedicated Staging project and disables automatic migrations/seeds.');
    return;
  }
  if (action === 'verify') {
    verifyStagingEnvFile();
    const values = dotenv.parse(fs.readFileSync(stagingEnvPath));
    const summary = validateStagingEnvironmentValues(values);
    console.info(`Staging configuration verified: project ${summary.projectRef}, role ${summary.databaseRole}; secret values were not printed.`);
    if (summary.financialWritesLocked) console.info('Financial writes remain locked until local UAT is explicitly enabled.');
    return;
  }
  throw new Error('USAGE: npm run staging:prepare | npm run staging:verify');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'STAGING_ENV_SETUP_FAILED');
    process.exitCode = 1;
  }
}
