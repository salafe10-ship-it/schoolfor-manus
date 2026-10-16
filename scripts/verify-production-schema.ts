import 'dotenv/config';
import { Pool } from 'pg';

const allowNonProductionDatabase = process.env.ALLOW_NON_PRODUCTION_DB === 'true';
const connectionString = process.env.PLATFORM_ADMIN_DATABASE_URL
  || (allowNonProductionDatabase ? (process.env.DIRECT_URL || process.env.DATABASE_URL) : '');

if (!connectionString) throw new Error('PLATFORM_ADMIN_DATABASE_URL_REQUIRED');

const pool = new Pool({
  connectionString,
  max: 1,
  connectionTimeoutMillis: 12_000,
  ssl: { rejectUnauthorized: false },
});

try {
  const client = await pool.connect();
  try {
    const result = await client.query<{
      guardians_table: boolean;
      mother_occupation_columns: number;
      mother_occupation_type: string | null;
      mother_occupation_nullable: string | null;
    }>(`
      SELECT
        to_regclass('public.guardians') IS NOT NULL AS guardians_table,
        (SELECT count(*) FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'guardians'
            AND column_name = 'mother_occupation')::int AS mother_occupation_columns,
        (SELECT data_type FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'guardians'
            AND column_name = 'mother_occupation') AS mother_occupation_type,
        (SELECT is_nullable FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'guardians'
            AND column_name = 'mother_occupation') AS mother_occupation_nullable
    `);

    const verification = result.rows[0];
    const ready = verification.guardians_table
      && verification.mother_occupation_columns === 1
      && verification.mother_occupation_type === 'text'
      && verification.mother_occupation_nullable === 'YES';

    if (!ready) {
      throw new Error(`PRODUCTION_SCHEMA_NOT_READY: ${JSON.stringify(verification)}`);
    }

    console.log(JSON.stringify({ success: true, verification }));
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
