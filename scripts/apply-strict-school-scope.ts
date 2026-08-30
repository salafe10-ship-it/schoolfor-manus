import dotenv from 'dotenv';
dotenv.config();

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Pool } from 'pg';

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('Production schema changes require the approved release pipeline.');
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL is required.');
  const pool = new Pool({ connectionString, max: 1, ssl: { rejectUnauthorized: false } });
  try {
    const migrationPath = resolve(dirname(fileURLToPath(import.meta.url)), '../supabase/migrations/202608301300_strict_school_identity_scope.sql');
    await pool.query(await readFile(migrationPath, 'utf8'));
    const result = await pool.query<{ policyname: string }>(
      `SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = ANY($1::text[])
          AND policyname = ANY($2::text[])`,
      [['schools', 'users'], ['p_dbsec004_schools_select', 'p_dbsec004_users_select']],
    );
    if (result.rowCount !== 2) throw new Error('STRICT_SCHOOL_SCOPE_POLICY_VERIFICATION_FAILED');
    console.log('Strict school identity scope applied and verified.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Strict school scope migration failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
