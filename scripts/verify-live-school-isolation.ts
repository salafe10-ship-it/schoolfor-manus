import 'dotenv/config';
import { Pool, type PoolClient } from 'pg';

/**
 * Read-only live isolation check. It never inserts, updates, deletes, or
 * commits data: every scope probe runs inside a transaction that is rolled
 * back. It requires two school-scoped active identities so it can simulate
 * both sides of the tenant boundary.
 */
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('LIVE_ISOLATION_DATABASE_URL_MISSING');

const pool = new Pool({ connectionString, max: 1, ssl: { rejectUnauthorized: false } });
const scopes = [
  ['schools', 'id'],
  ['branches', 'school_id'],
  ['students', 'school_id'],
  ['hr_database', 'school_id'],
  ['inventory_database', 'school_id'],
  ['financial_portal_snapshots', 'school_id'],
  ['buses', 'school_id'],
  ['uniforms', 'school_id'],
  ['student_transportation', 'school_id'],
  ['student_uniform_accounts', 'school_id'],
  ['roles', 'school_id'],
  ['user_roles', 'school_id'],
] as const;

type ScopeRow = { id: string; tenant_id: string; auth_user_id: string; branch_id: string };

async function countScoped(client: PoolClient, table: string, column: string, schoolId: string): Promise<number> {
  const result = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM public.${table} WHERE ${column} = $1`,
    [schoolId],
  );
  return Number(result.rows[0]?.count || 0);
}

async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<ScopeRow>(
      `WITH candidates AS (
       SELECT DISTINCT ON (s.id)
                s.id::text, s.tenant_id::text, u.auth_user_id::text, b.id::text AS branch_id,
                s.created_at, s.school_code
           FROM public.schools s
           JOIN public.branches b ON b.school_id = s.id AND b.status = 'active'
           JOIN public.users u ON u.school_id = s.id
                              AND u.status = 'active'
                              AND u.deleted_at IS NULL
          WHERE s.status = 'active' AND s.deleted_at IS NULL
          ORDER BY s.id, b.created_at NULLS LAST
       )
       SELECT id, tenant_id, auth_user_id, branch_id
         FROM candidates
        ORDER BY created_at, school_code
        LIMIT 2`,
    );

    if (result.rowCount !== 2) {
      console.log(JSON.stringify({
        passed: false,
        blocked: true,
        reason: 'TWO_SCHOOL_SCOPED_ACTIVE_IDENTITIES_REQUIRED',
        availableContexts: result.rowCount || 0,
      }, null, 2));
      await client.query('ROLLBACK');
      return;
    }

    const [schoolA, schoolB] = result.rows;
    const foreignVisible: Record<string, number> = {};
    const visibleCounts: Record<string, Record<string, number>> = {};
    const failures: string[] = [];

    await client.query('SET LOCAL ROLE authenticated');
    const contextRows: Array<['schoolA' | 'schoolB', ScopeRow]> = [
      ['schoolA', schoolA],
      ['schoolB', schoolB],
    ];
    for (const [label, scope] of contextRows) {
      await client.query(
        `SELECT set_config('request.jwt.claims', $5, true),
                set_config('app.tenant_id', $2, true),
                set_config('app.school_id', $3, true),
                set_config('app.branch_id', $4, true),
                set_config('app.user_id', $1, true)`,
        [scope.auth_user_id, scope.tenant_id, scope.id, scope.branch_id, JSON.stringify({
          sub: scope.auth_user_id,
          app_metadata: { role: 'schooladmin' },
        })],
      );

      visibleCounts[label] = {};
      for (const [table, column] of scopes) {
        visibleCounts[label][table] = await countScoped(client, table, column, scope.id);
        const foreignSchoolId = label === 'schoolA' ? schoolB.id : schoolA.id;
        const foreignCount = await countScoped(client, table, column, foreignSchoolId);
        foreignVisible[`${label}.${table}`] = foreignCount;
        if (foreignCount !== 0) failures.push(`${label}.${table}:foreign_rows_visible:${foreignCount}`);
      }
    }

    console.log(JSON.stringify({
      passed: failures.length === 0,
      blocked: false,
      failures,
      visibleCounts,
      foreignRowsVisible: foreignVisible,
    }, null, 2));
    await client.query('ROLLBACK');
    if (failures.length > 0) process.exitCode = 1;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* preserve original error */ }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('LIVE_ISOLATION_FAILED', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
