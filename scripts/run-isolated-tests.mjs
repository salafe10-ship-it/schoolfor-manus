import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = existsSync(packageJsonPath)
  ? JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  : null;

if (packageJson?.name !== 'edupro-school-erp' || !existsSync(path.join(projectRoot, '.git'))) {
  console.error('ISOLATED_TEST_BLOCKED: run this command from the SchoolForManus Git project root.');
  process.exit(2);
}

const protectedEnvironmentKeys = [
  'DATABASE_URL',
  'DIRECT_URL',
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'EDUPRO_CONFIGURED_DATABASE_URL',
  'EDUPRO_CONFIGURED_ADMIN_DATABASE_URL',
  'PLATFORM_ADMIN_DATABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'UAT_FINANCIAL_BASE_URL',
  'UAT_FINANCIAL_BEARER_TOKEN',
  'UAT_STUDENT_FEES_STAGING_CONFIRM',
  'UAT_ALLOW_LOCAL_STAGING',
  'PAYMENT_WEBHOOK_SECRET',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'CLOUDFLARE_API_TOKEN',
  'CF_API_TOKEN',
  'GITHUB_TOKEN',
  'GH_TOKEN',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
];

const inheritedExternalConfiguration = protectedEnvironmentKeys
  .filter((key) => String(process.env[key] || '').trim().length > 0);

if (inheritedExternalConfiguration.length > 0) {
  console.error(
    `ISOLATED_TEST_BLOCKED: external service configuration is present in the process environment (${inheritedExternalConfiguration.join(', ')}). Values are intentionally not printed.`,
  );
  process.exit(2);
}

const mode = process.argv.slice(2);
const supportedModes = new Set(['--check-only', '--fees', '--typecheck', '--build']);
if (mode.length > 1 || mode.some((argument) => !supportedModes.has(argument))) {
  console.error('Usage: node scripts/run-isolated-tests.mjs [--check-only|--fees|--typecheck|--build]');
  process.exit(2);
}

const isolatedEnvironment = { ...process.env };
for (const key of protectedEnvironmentKeys) isolatedEnvironment[key] = '';
Object.assign(isolatedEnvironment, {
  APP_ENV: 'test',
  NODE_ENV: 'test',
  EDUPRO_ENVIRONMENT: 'test',
  EDUPRO_LOCAL_STAGING: 'true',
  FINANCIAL_WRITES_LOCKED: 'true',
  FINANCIAL_ERP_MODE: 'read_only',
  RUNTIME_SCHEMA_BOOTSTRAP: 'false',
  AUTO_MIGRATE: 'false',
  AUTO_SEED: 'false',
});

if (mode[0] === '--check-only') {
  console.log('ISOLATED_TEST_GUARD_OK: project root verified; external credentials absent; financial writes locked.');
  process.exit(0);
}

const vitestCli = path.join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');
const tscCli = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

let command;
let args;
if (mode[0] === '--typecheck') {
  command = tscCli;
  args = ['--noEmit'];
} else if (mode[0] === '--build') {
  command = viteCli;
  args = ['build', '--configLoader', 'runner', '--outDir', '.artifacts/isolated-test-build', '--emptyOutDir'];
} else {
  command = vitestCli;
  args = ['run', '--configLoader', 'runner'];
  if (mode[0] === '--fees') {
    const testDirectory = path.join(projectRoot, 'src', '__tests__');
    const feeTestPattern = /(fee|invoice|receipt|schoolBranding|acc001Implementation003Hardening|studentFeesVisualContracts|financialDocumentReference|financialDocumentSerial|studentFinancialPresentation|financialWritesLocked|financialSnapshotWriteMode|stagingDatabaseSafety|canonicalErpPostingService|dashboardMetrics)/i;
    const files = readdirSync(testDirectory)
      .filter((name) => feeTestPattern.test(name) && /\.test\.[cm]?[jt]sx?$/.test(name))
      .map((name) => path.join('src', '__tests__', name));
    if (files.length === 0) {
      console.error('ISOLATED_TEST_BLOCKED: no fee-related test files were found.');
      process.exit(2);
    }
    console.log(`Running ${files.length} isolated fee and financial test files.`);
    args.push(...files);
  }
}

if (!existsSync(command)) {
  console.error('ISOLATED_TEST_BLOCKED: project dependencies are not installed; install from the existing lockfile first.');
  process.exit(2);
}

const result = spawnSync(process.execPath, [command, ...args], {
  cwd: projectRoot,
  env: isolatedEnvironment,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`ISOLATED_TEST_FAILED_TO_START: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
