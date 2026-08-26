import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

async function main(): Promise<void> {
  const schoolId = String(process.argv[2] || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(schoolId)) throw new Error('A valid school UUID is required.');
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL is required.');
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
    ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false }
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const context = await client.query<{ tenant_id: string; user_id: string }>(
      `SELECT s.tenant_id, u.id AS user_id
         FROM public.schools s
         JOIN public.users u ON u.tenant_id = s.tenant_id AND u.school_id = s.id
        WHERE s.id = $1 AND u.status = 'active' AND u.deleted_at IS NULL
        ORDER BY u.created_at
        LIMIT 1`,
      [schoolId]
    );
    const row = context.rows[0];
    if (!row) throw new Error('No active canonical user was found for the school.');
    const updated = await client.query<{ version: string }>(
      `UPDATE public.exams_database
          SET version = version + 1, updated_at = now(), updated_by = $2
        WHERE tenant_id = $1 AND school_id = $3
        RETURNING version::text`,
      [row.tenant_id, row.user_id, schoolId]
    );
    const version = Number(updated.rows[0]?.version);
    if (!Number.isInteger(version)) throw new Error('No exams snapshot was available for the concurrency probe.');
    await client.query(
      `INSERT INTO public.audit_events
         (tenant_id, school_id, actor_user_id, entity_type, entity_id, action, source, reason, result, metadata)
       VALUES ($1, $2, $3, 'exams_database', $2, 'uat-concurrency-probe',
               'simulate-exams-concurrent-update', 'اختبار منع تعارض الحفظ في بيئة UAT',
               'success', jsonb_build_object('version', $4::bigint))`,
      [row.tenant_id, schoolId, row.user_id, version]
    );
    await client.query('COMMIT');
    console.log(JSON.stringify({ concurrentVersion: version, committed: true }));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('Exams concurrency probe failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
