import dotenv from 'dotenv';
import { applyOnlyStagingEnvironmentValues, assertLocalStagingEnvironment, isConfirmedLoopbackFinancialUat } from './stagingDatabaseSafety.js';

const loaded = dotenv.config({ path: '.env.staging', override: true });
if (loaded.error) {
  throw new Error('LOCAL_STAGING_ENV_FILE_MISSING: create ignored .env.staging from .env.staging.example.');
}

const stagingOnlyKeys = [
  'EDUPRO_ENVIRONMENT', 'UAT35_TARGET', 'DATABASE_ROLE_EXPECTED', 'SUPABASE_URL', 'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL', 'DIRECT_URL', 'PLATFORM_ADMIN_DATABASE_URL',
  'RUNTIME_SCHEMA_BOOTSTRAP', 'UAT_ALLOW_LOCAL_STAGING', 'UAT_STUDENT_FEES_STAGING_CONFIRM',
  'UAT_FINANCIAL_BASE_URL', 'UAT_FINANCIAL_BEARER_TOKEN', 'UAT_FINANCIAL_STUDENT_ID',
  'UAT_FINANCIAL_SECOND_STUDENT_ID', 'UAT_FINANCIAL_FEE_CONFIG_ID', 'UAT_FINANCIAL_FEE_TEMPLATE_ID',
  'UAT_FINANCIAL_RECEIPT_ACCOUNT', 'UAT_FINANCIAL_REVENUE_ACCOUNT', 'UAT_FINANCIAL_COST_CENTER',
  'JWT_SECRET', 'STUDENT_CERTIFICATE_SIGNING_SECRET',
  'EDUPRO_SERVER_APPLICATION_ROOT',
] as const;
// dotenv's override option doesn't remove environment variables omitted from
// the file. Explicitly clear those keys so a developer shell cannot leak a
// production connection or token into this staging process.
applyOnlyStagingEnvironmentValues(process.env, loaded.parsed || {}, stagingOnlyKeys);

assertLocalStagingEnvironment({
  environment: process.env.EDUPRO_ENVIRONMENT || '',
  targetName: process.env.UAT35_TARGET || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  databaseUrl: process.env.DATABASE_URL || '',
  databaseRoleExpected: process.env.DATABASE_ROLE_EXPECTED,
  directUrl: process.env.DIRECT_URL,
  adminDatabaseUrl: process.env.PLATFORM_ADMIN_DATABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  runtimeSchemaBootstrap: process.env.RUNTIME_SCHEMA_BOOTSTRAP,
});

const enableLocalFinancialUatWrites = isConfirmedLoopbackFinancialUat({
  allowLocalStaging: process.env.UAT_ALLOW_LOCAL_STAGING,
  confirmation: process.env.UAT_STUDENT_FEES_STAGING_CONFIRM,
  baseUrl: process.env.UAT_FINANCIAL_BASE_URL,
  expectedPort: String(process.argv[2] || '4179'),
});
const requestedPort = String(process.argv[2] || '4179');
if (!['4179', '4183'].includes(requestedPort)) {
  throw new Error('LOCAL_STAGING_PORT_INVALID');
}

// This marker is consumed by server.ts to keep the temporary local staging
// runtime bound to loopback only. The app rejects cross-project URLs above.
process.env.EDUPRO_LOCAL_STAGING = 'true';
process.env.EDUPRO_SERVER_APPLICATION_ROOT = process.cwd();
process.env.VITE_SUPABASE_URL = process.env.SUPABASE_URL || '';
process.env.VITE_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL || '';
process.env.EDUPRO_CONFIGURED_DATABASE_URL = process.env.DATABASE_URL || '';
process.env.EDUPRO_CONFIGURED_ADMIN_DATABASE_URL = process.env.PLATFORM_ADMIN_DATABASE_URL || '';
process.env.RUNTIME_SCHEMA_BOOTSTRAP = 'false';
process.env.AUTO_MIGRATE = 'false';
process.env.AUTO_SEED = 'false';
process.env.PGSSL_REJECT_UNAUTHORIZED = 'true';
process.env.NODE_ENV = 'development';
// Keep the local review server independent of occupied Vite WebSocket ports.
// This avoids the React refresh preamble race with the already-open app on 4179.
process.env.DISABLE_HMR = 'true';
process.env.PORT = requestedPort;
process.env.PUBLIC_APP_URL = `http://127.0.0.1:${requestedPort}`;
// Financial writes stay closed unless both UAT confirmations explicitly opt
// into the loopback-only runner against the staging target validated above.
process.env.FINANCIAL_WRITES_LOCKED = enableLocalFinancialUatWrites ? 'false' : 'true';
process.env.FINANCIAL_ERP_MODE = enableLocalFinancialUatWrites ? 'canonical' : 'read_only';
// Avoid accidentally inheriting production credentials for paid integrations.
process.env.OPENAI_API_KEY = '';
process.env.GEMINI_API_KEY = '';
process.env.PAYMENT_WEBHOOK_SECRET = '';
process.env.EDUPRO_AI_FORECAST_ENABLED = 'false';

console.info(`Starting isolated local staging runtime on 127.0.0.1:${requestedPort}; financial writes ${enableLocalFinancialUatWrites ? 'enabled for confirmed local UAT' : 'remain locked'}; no schema bootstrap will run.`);
await import('../server.ts');
