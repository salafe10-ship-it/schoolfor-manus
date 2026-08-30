import dotenv from 'dotenv';
dotenv.config();

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Pool } from 'pg';

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Production schema changes require the approved release pipeline.');
  }
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL is required.');

  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const migrationPath = resolve(scriptDirectory, '../supabase/migrations/202608301000_school_logistics_canonical.sql');
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
    ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false },
  });

  try {
    await pool.query(await readFile(migrationPath, 'utf8'));
    const verification = await pool.query<{ table_name: string; rls_enabled: boolean; force_rls: boolean }>(
      `SELECT c.relname AS table_name,
              c.relrowsecurity AS rls_enabled,
              c.relforcerowsecurity AS force_rls
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = ANY($1::text[])
        ORDER BY c.relname`,
      [['buses', 'uniforms', 'student_transportation', 'student_uniform_accounts']],
    );
    if (verification.rowCount !== 4 || verification.rows.some((row) => !row.rls_enabled || !row.force_rls)) {
      throw new Error('School logistics schema verification failed: RLS is not enabled and forced for every table.');
    }
    console.log('School logistics canonical schema applied and verified.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('School logistics schema migration failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
