import dotenv from 'dotenv';
import { assertLocalStagingEnvironment } from './stagingDatabaseSafety.js';

const loaded = dotenv.config({ path: '.env.staging', override: true });
if (loaded.error) {
  throw new Error('LOCAL_STAGING_ENV_FILE_MISSING: create ignored .env.staging from .env.staging.example.');
}

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

// This marker is consumed by server.ts to keep the temporary local staging
// runtime bound to loopback only. The app rejects cross-project URLs above.
process.env.EDUPRO_LOCAL_STAGING = 'true';
process.env.VITE_SUPABASE_URL = process.env.SUPABASE_URL || '';
process.env.VITE_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL || '';
process.env.NODE_ENV = 'development';
process.env.PORT = '4179';
process.env.PUBLIC_APP_URL = 'http://127.0.0.1:4179';
// Avoid accidentally inheriting production credentials for paid integrations.
process.env.OPENAI_API_KEY = '';
process.env.GEMINI_API_KEY = '';
process.env.PAYMENT_WEBHOOK_SECRET = '';
process.env.EDUPRO_AI_FORECAST_ENABLED = 'false';

console.info('Starting isolated local staging runtime on 127.0.0.1; no schema bootstrap will run.');
await import('../server.ts');
