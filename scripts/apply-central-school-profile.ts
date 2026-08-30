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
  const migrationPath = resolve(scriptDirectory, '../supabase/migrations/202608301400_central_school_profile.sql');
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
    ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false },
  });

  try {
    await pool.query(await readFile(migrationPath, 'utf8'));
    const verification = await pool.query<{ column_name: string; data_type: string }>(
      `SELECT column_name, data_type
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'schools'
          AND column_name = 'central_metadata'`,
    );
    if (verification.rowCount !== 1 || verification.rows[0].data_type !== 'jsonb') {
      throw new Error('Central school profile verification failed: central_metadata jsonb is missing.');
    }
    console.log('Central school profile schema applied and verified.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Central school profile migration failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
