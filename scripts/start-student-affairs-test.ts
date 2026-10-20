// Deliberately replaces all inherited database/provider credentials before
// importing the server. This process is loopback-only and cannot reach a
// production or staging Supabase project.
process.env.NODE_ENV = 'test';
// Serve the already-built SPA so the test tab is independent of Vite HMR and
// does not need to compile the full application in the browser session.
process.env.npm_lifecycle_event = 'start';
process.env.EDUPRO_ENVIRONMENT = 'test';
process.env.EDUPRO_LOCAL_STUDENT_AFFAIRS_TEST = 'true';
process.env.EDUPRO_TEST_FAULT = 'supabase-exhausted';
process.env.EDUPRO_TEST_FAULT_PATHS = '/api/students,/api/student-affairs/metrics,/api/academic/context,/api/academic/setup';
process.env.EDUPRO_LOCAL_STAGING = 'true';
process.env.PORT = '4180';
process.env.PUBLIC_APP_URL = 'http://127.0.0.1:4180';
process.env.VITE_STUDENT_AFFAIRS_TEST_MODE = 'true';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_ANON_KEY = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.VITE_SUPABASE_URL = '';
process.env.VITE_SUPABASE_ANON_KEY = '';
process.env.DATABASE_URL = '';
process.env.DIRECT_URL = '';
process.env.PLATFORM_ADMIN_DATABASE_URL = '';
process.env.EDUPRO_CONFIGURED_DATABASE_URL = '';
process.env.EDUPRO_CONFIGURED_ADMIN_DATABASE_URL = '';
process.env.OPENAI_API_KEY = '';
process.env.GEMINI_API_KEY = '';
process.env.RUNTIME_SCHEMA_BOOTSTRAP = 'false';
process.env.AUTO_MIGRATE = 'false';
process.env.AUTO_SEED = 'false';
process.env.FINANCIAL_WRITES_LOCKED = 'true';

console.info('Starting isolated Student Affairs test environment on http://127.0.0.1:4180');
console.info('Test login: student-affairs-test / student-affairs-test-password');
console.info('Fault scenario: Supabase database resource exhaustion; no database credentials are loaded.');

await import('../server.ts');
