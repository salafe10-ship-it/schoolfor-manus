import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import pg from 'pg';

const { Client } = pg;
const EXPECTED_NON_PRODUCTION_PROJECT_REF = 'wjhraxvxvvthxqlpyohh';
const PRODUCTION_PROJECT_REF = 'bwdjnjbexklsrwqbwzmk';
const REQUIRED_CONFIRMATION = 'APPLY_USER_PERMISSION_ALLOW_DENY_STAGING';
const confirmation = process.env.USER_PERMISSION_MIGRATION_CONFIRMATION
  || process.argv.find((arg) => arg.startsWith('--confirm='))?.slice('--confirm='.length);

function fail(message) {
  console.error(JSON.stringify({ success: false, error: message }, null, 2));
  process.exit(1);
}

const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const nodeEnv = String(process.env.NODE_ENV || '').trim().toLowerCase();
const connectionString = String(process.env.PLATFORM_ADMIN_DATABASE_URL || process.env.DATABASE_URL || '').trim();

if (nodeEnv === 'production') fail('PRODUCTION_ENVIRONMENT_REFUSED');
if (!supabaseUrl.includes(EXPECTED_NON_PRODUCTION_PROJECT_REF)) fail('TARGET_PROJECT_REF_MISMATCH');
if (supabaseUrl.includes(PRODUCTION_PROJECT_REF)) fail('PRODUCTION_PROJECT_REFUSED');
if (!connectionString) fail('DATABASE_URL_MISSING');
if (confirmation !== REQUIRED_CONFIRMATION) fail('EXPLICIT_STAGING_CONFIRMATION_REQUIRED');

const backupPath = resolve(
  process.env.USER_PERMISSION_BACKUP_PATH
    || `backups/user_permission_grants-${new Date().toISOString().replaceAll(':', '').replaceAll('.', '')}.json`
);

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  application_name: 'edupro-user-permission-allow-deny-staging'
});

try {
  await client.connect();

  const identity = await client.query(`
    SELECT current_database() AS database_name,
           current_user AS database_role,
           current_setting('server_version') AS server_version
  `);
  const tableCheck = await client.query(`
    SELECT to_regclass('public.user_permission_grants') AS table_name,
           EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name = 'user_permission_grants'
               AND column_name = 'effect'
           ) AS effect_exists
  `);
  if (!tableCheck.rows[0]?.table_name) fail('USER_PERMISSION_GRANTS_TABLE_MISSING');

  const snapshot = await client.query(`
    SELECT jsonb_agg(to_jsonb(t) ORDER BY id) AS rows
    FROM public.user_permission_grants AS t
  `);
  const backupPayload = {
    generatedAt: new Date().toISOString(),
    purpose: 'Pre-migration logical snapshot for user_permission_grants',
    targetProjectRef: EXPECTED_NON_PRODUCTION_PROJECT_REF,
    database: identity.rows[0],
    schemaBefore: tableCheck.rows[0],
    rowCount: Array.isArray(snapshot.rows[0]?.rows) ? snapshot.rows[0].rows.length : 0,
    rows: snapshot.rows[0]?.rows || []
  };
  await mkdir(dirname(backupPath), { recursive: true });
  const serialized = JSON.stringify(backupPayload, null, 2);
  await writeFile(backupPath, serialized, { encoding: 'utf8', flag: 'wx' });
  const backupSha256 = createHash('sha256').update(serialized).digest('hex');

  await client.query('BEGIN');
  try {
    await client.query('LOCK TABLE public.user_permission_grants IN ACCESS EXCLUSIVE MODE');
    await client.query(`
      ALTER TABLE public.user_permission_grants
        ADD COLUMN IF NOT EXISTS effect text NOT NULL DEFAULT 'allow'
    `);
    await client.query(`
      ALTER TABLE public.user_permission_grants
        DROP CONSTRAINT IF EXISTS ck_user_permission_grants_effect
    `);
    await client.query(`
      ALTER TABLE public.user_permission_grants
        ADD CONSTRAINT ck_user_permission_grants_effect
        CHECK (effect IN ('allow', 'deny'))
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_permission_grants_effective
        ON public.user_permission_grants (tenant_id, user_id, effect, status)
        WHERE deleted_at IS NULL
    `);
    await client.query('ALTER TABLE public.user_permission_grants ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE public.user_permission_grants FORCE ROW LEVEL SECURITY');
    await client.query('REVOKE ALL ON TABLE public.user_permission_grants FROM anon');
    await client.query('GRANT SELECT ON TABLE public.user_permission_grants TO authenticated');
    await client.query('DROP POLICY IF EXISTS p_user_permission_grants_select_scope ON public.user_permission_grants');
    await client.query(`
      CREATE POLICY p_user_permission_grants_select_scope ON public.user_permission_grants
        FOR SELECT TO authenticated
        USING (
          tenant_id::text = current_setting('app.tenant_id', true)
          AND school_id::text = current_setting('app.school_id', true)
          AND (branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
        )
    `);
    await client.query("NOTIFY pgrst, 'reload schema'");
    await client.query(`
      COMMENT ON COLUMN public.user_permission_grants.effect IS
        'Explicit allow or deny applied after the employee role baseline; deny wins.'
    `);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }

  const verification = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_permission_grants'
        AND column_name = 'effect'
    ) AS effect_exists,
    EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'ck_user_permission_grants_effect'
    ) AS constraint_exists,
    EXISTS (
      SELECT 1 FROM pg_class c
      WHERE c.oid = 'public.user_permission_grants'::regclass
        AND c.relforcerowsecurity
    ) AS rls_forced,
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'user_permission_grants'
        AND policyname = 'p_user_permission_grants_select_scope'
    ) AS select_policy_exists
  `);
  console.log(JSON.stringify({
    success: true,
    environment: 'staging',
    targetProjectRef: EXPECTED_NON_PRODUCTION_PROJECT_REF,
    backup: { path: backupPath, sha256: backupSha256, rowCount: backupPayload.rowCount },
    verification: verification.rows[0]
  }, null, 2));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await client.end().catch(() => undefined);
}
