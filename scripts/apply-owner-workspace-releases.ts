import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const EXPECTED_PROJECT_REF = 'wjhraxvxvvthxqlpyohh';
const REQUIRED_CONFIRMATION = 'APPLY_OWNER_WORKSPACE_RELEASES';

function required(value: string | undefined, code: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('Production schema changes require the approved release pipeline.');
  if (required(process.env.OWNER_WORKSPACE_MIGRATION_CONFIRMATION, 'OWNER_WORKSPACE_CONFIRMATION_REQUIRED') !== REQUIRED_CONFIRMATION) {
    throw new Error('OWNER_WORKSPACE_CONFIRMATION_INVALID');
  }
  const connectionString = required(
    process.env.PLATFORM_ADMIN_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL,
    'DATABASE_CONNECTION_REQUIRED',
  );
  const supabaseUrl = required(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, 'SUPABASE_URL_REQUIRED');
  if (!supabaseUrl.includes(EXPECTED_PROJECT_REF)) throw new Error('TARGET_PROJECT_REF_MISMATCH');

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 8_000),
    ssl: connectionString.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });
  try {
    const migration = await readFile(resolve(process.cwd(), 'supabase/migrations/202609051100_owner_workspace_releases.sql'), 'utf8');
    await pool.query(migration);
    const verification = await pool.query<{ templates: string | null; releases: string | null }>(`
      SELECT to_regclass('public.platform_templates')::text AS templates,
             to_regclass('public.platform_school_releases')::text AS releases
    `);
    if (verification.rows[0]?.templates !== 'platform_templates' || verification.rows[0]?.releases !== 'platform_school_releases') {
      throw new Error('OWNER_WORKSPACE_SCHEMA_VERIFICATION_FAILED');
    }
    console.log(JSON.stringify({ success: true, projectRef: EXPECTED_PROJECT_REF, tables: ['platform_templates', 'platform_school_releases'] }));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
