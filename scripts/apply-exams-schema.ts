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
  const migrationPaths = [
    resolve(scriptDirectory, '../supabase/migrations/202608251200_exams_database.sql'),
    resolve(scriptDirectory, '../supabase/migrations/202608251700_exams_result_archives.sql')
  ];
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
    ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false }
  });
  try {
    for (const migrationPath of migrationPaths) {
      await pool.query(await readFile(migrationPath, 'utf8'));
    }
    const verification = await pool.query<{ table_name: string }>(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('exams_database', 'exams_result_archives')`
    );
    if (verification.rowCount !== 2) throw new Error('Exams schema verification failed.');
    console.log('Exams schema applied and verified.');
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('Exams schema migration failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
