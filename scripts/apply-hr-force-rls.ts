import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Production schema changes require the approved release pipeline.');
  }
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL is required.');
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
    ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false },
  });
  try {
    await pool.query('ALTER TABLE public.hr_database FORCE ROW LEVEL SECURITY');
    const result = await pool.query<{ force_rls: boolean }>(
      `SELECT c.relforcerowsecurity AS force_rls
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'hr_database'`,
    );
    if (result.rows[0]?.force_rls !== true) throw new Error('HR_FORCE_RLS_VERIFICATION_FAILED');
    console.log('HR FORCE RLS applied and verified.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('HR FORCE RLS migration failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
