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
  const migrationPath = resolve(scriptDirectory, '../supabase/migrations/202608271500_hr_canonical_records.sql');
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
    ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false }
  });
  try {
    await pool.query(await readFile(migrationPath, 'utf8'));
    const verification = await pool.query<{ table_name: string; rls_enabled: boolean }>(
      `SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'hr_database'`
    );
    if (verification.rowCount !== 1 || verification.rows[0]?.rls_enabled !== true) {
      throw new Error('HR schema verification failed.');
    }
    console.log('HR canonical schema applied and verified.');
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('HR schema apply failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
