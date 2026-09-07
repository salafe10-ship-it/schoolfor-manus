import dotenv from 'dotenv';
dotenv.config();

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Pool } from 'pg';

const expectedColumns = [
  'academic_previous_school', 'academic_previous_grade', 'academic_previous_year',
  'academic_performance_level', 'academic_writing_level', 'academic_reading_level',
  'academic_spelling_level', 'academic_average', 'academic_notes', 'health_chronic_diseases',
  'health_medications', 'health_allergies', 'health_notes', 'social_living_with',
  'social_birth_order', 'social_family_view', 'social_outside_traits'
];

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('Production schema changes require the approved release pipeline.');
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL is required.');
  const migrationPath = resolve(dirname(fileURLToPath(import.meta.url)), '../supabase/migrations/202609071200_student_additional_information.sql');
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
    ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false }
  });
  try {
    await pool.query(await readFile(migrationPath, 'utf8'));
    const result = await pool.query<{ column_name: string }>(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'students'
          AND column_name = ANY($1::text[])`,
      [expectedColumns]
    );
    const actual = new Set(result.rows.map(row => row.column_name));
    const missing = expectedColumns.filter(column => !actual.has(column));
    if (missing.length) throw new Error(`Student additional information columns missing: ${missing.join(', ')}`);
    console.log(`Student additional information schema applied and verified (${expectedColumns.length} columns).`);
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('Student additional information migration failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
