import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const migrations = [
  '202609101200_identity_job_reference.sql',
  '202609231000_identity_access_governance.sql',
  '202609141100_harden_audit_actor_policy.sql',
  '202609141200_harden_student_fee_audit_actor_policy.sql',
];

const connectionString = process.env.PLATFORM_ADMIN_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('ADMIN_DATABASE_CONNECTION_REQUIRED');

const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 12_000, ssl: { rejectUnauthorized: false } });
try {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const migration of migrations) {
      const sql = await readFile(resolve(process.cwd(), 'supabase', 'migrations', migration), 'utf8');
      await client.query(sql);
    }
    const verification = await client.query<{ job_id: boolean; access_requests: boolean; access_request_approvals: boolean; actor_guard: boolean; fee_policy: boolean }>(`
    SELECT
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='job_id') AS job_id,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='identity_access_requests') AS access_requests,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='identity_access_request_approvals') AS access_request_approvals,
        EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='dbsec010_audit_actor_allowed') AS actor_guard,
        EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='student_fee_audit_events' AND policyname='p_student_fee_audit_events_insert') AS fee_policy
    `);
    if (!verification.rows[0]?.job_id || !verification.rows[0]?.access_requests || !verification.rows[0]?.access_request_approvals || !verification.rows[0]?.actor_guard || !verification.rows[0]?.fee_policy) {
      throw new Error('IDENTITY_STRUCTURE_VERIFICATION_FAILED');
    }
    await client.query('COMMIT');
    console.log(JSON.stringify({ success: true, migrations, verification: verification.rows[0] }));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
} finally { await pool.end(); }
