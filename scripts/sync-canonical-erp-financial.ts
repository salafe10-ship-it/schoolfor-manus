import 'dotenv/config';
import pg from 'pg';
import { CanonicalErpPostingService } from '../src/modules/financial/application/CanonicalErpPostingService.js';

const confirmation = String(process.env.FINANCIAL_ERP_SYNC_CONFIRM || '').trim();
const schoolId = String(process.env.FINANCIAL_ERP_SYNC_SCHOOL_ID || '').trim();

if (confirmation !== 'SYNC_EXISTING_UAT_FINANCE') {
  throw new Error('Explicit confirmation is required: FINANCIAL_ERP_SYNC_CONFIRM=SYNC_EXISTING_UAT_FINANCE');
}
if (!schoolId) throw new Error('FINANCIAL_ERP_SYNC_SCHOOL_ID is required.');

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL or DIRECT_URL is required.');

const pool = new pg.Pool({
  connectionString,
  max: 1,
  ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false }
});

try {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const school = await client.query<{ tenant_id: string }>(
      'SELECT tenant_id::text AS tenant_id FROM public.schools WHERE id = $1::uuid',
      [schoolId]
    );
    const tenantId = school.rows[0]?.tenant_id;
    if (!tenantId) throw new Error(`School was not found: ${schoolId}`);

    const actor = await client.query<{ id: string }>(
      `SELECT id::text AS id
         FROM public.users
        WHERE tenant_id = $1::uuid AND school_id = $2::uuid
          AND status = 'active' AND deleted_at IS NULL
        ORDER BY created_at
        LIMIT 1`,
      [tenantId, schoolId]
    );
    const actorId = actor.rows[0]?.id;
    if (!actorId) throw new Error(`No active ERP user exists for school: ${schoolId}`);

    await client.query(
      `SELECT set_config('app.tenant_id', $1, true), set_config('app.school_id', $2, true), set_config('app.user_id', $3, true)`,
      [tenantId, schoolId, actorId]
    );
    const snapshot = await client.query<{ data: Record<string, unknown> }>(
      `SELECT data FROM public.financial_portal_snapshots
        WHERE tenant_id = $1::uuid AND school_id = $2::uuid
        FOR UPDATE`,
      [tenantId, schoolId]
    );
    const payload = snapshot.rows[0]?.data;
    if (!payload) throw new Error(`No financial snapshot exists for school: ${schoolId}`);

    const transaction = {
      query: async <Row extends Record<string, unknown> = Record<string, unknown>>(sqlText: string, parameters: readonly unknown[] = []) => {
        const result = await client.query<Row>(sqlText, [...parameters]);
        return { rows: result.rows, rowCount: result.rowCount ?? 0 };
      }
    };
    const result = await CanonicalErpPostingService.syncSnapshot(transaction, tenantId, schoolId, actorId, payload);
    const inTransactionCount = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM public.erp_journal_entries WHERE school_id = $1::uuid',
      [schoolId]
    );
    await client.query('COMMIT');
    const afterCommitCount = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM public.erp_journal_entries WHERE school_id = $1::uuid',
      [schoolId]
    );
    console.log(JSON.stringify({ success: true, schoolId, inTransactionCount: inTransactionCount.rows[0]?.count, afterCommitCount: afterCommitCount.rows[0]?.count, ...result }));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
