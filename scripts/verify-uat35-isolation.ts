import 'dotenv/config';
import { Pool, type PoolClient } from 'pg';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('UAT35_DATABASE_URL_MISSING');
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

async function readScopedCount(client: PoolClient, table: string, column: string, schoolId: string) {
  const result = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM public.${table} WHERE ${column} = $1`,
    [schoolId],
  );
  return Number(result.rows[0].count);
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const schools = await client.query<{ id: string; tenant_id: string; auth_user_id: string; branch_id: string }>(
      `SELECT s.id::text, s.tenant_id::text, u.auth_user_id::text, b.id::text AS branch_id
         FROM public.schools s
         JOIN public.users u ON u.tenant_id = s.tenant_id
         JOIN public.branches b ON b.school_id = s.id AND b.status = 'active'
        WHERE s.school_code LIKE 'UAT35-%'
          AND u.status = 'active' AND u.deleted_at IS NULL
        ORDER BY s.school_code, u.created_at
        LIMIT 2`,
    );
    if (schools.rowCount !== 2) throw new Error(`UAT35_TWO_SCHOOLS_REQUIRED:${schools.rowCount}`);
    const [schoolA, schoolB] = schools.rows;
    const allCounts: Record<string, number> = {};
    for (const [table, column] of scopes) {
      const count = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM public.${table} WHERE ${column} IN ($1, $2)`,
        [schoolA.id, schoolB.id],
      );
      allCounts[table] = Number(count.rows[0].count);
    }

    await client.query('SET LOCAL ROLE authenticated');
    const perSchool: Record<string, Record<string, number>> = {};
    const leakage: Record<string, number> = {};
    for (const [label, scope] of [['schoolA', schoolA], ['schoolB', schoolB]] as const) {
      await client.query(
        `SELECT set_config('request.jwt.claims', $5, true),
                set_config('app.tenant_id', $2, true),
                set_config('app.school_id', $3, true),
                set_config('app.branch_id', $4, true),
                set_config('app.user_id', $1, true)`,
        [scope.auth_user_id, scope.tenant_id, scope.id, scope.branch_id, JSON.stringify({ sub: scope.auth_user_id, app_metadata: { role: 'schooladmin' } })],
      );
      perSchool[label] = {};
      for (const [table, column] of scopes) {
        perSchool[label][table] = await readScopedCount(client, table, column, scope.id);
        const foreign = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM public.${table} WHERE ${column} = $1`,
          [label === 'schoolA' ? schoolB.id : schoolA.id],
        );
        leakage[`${label}.${table}`] = Number(foreign.rows[0].count);
      }
    }

    const failures: string[] = [];
    for (const [table, count] of Object.entries(allCounts)) {
      if (table === 'students' && count !== 4) failures.push(`${table}:expected4:actual${count}`);
      else if (['schools', 'branches', 'hr_database', 'inventory_database', 'financial_portal_snapshots', 'buses', 'uniforms', 'student_transportation', 'student_uniform_accounts', 'roles', 'user_roles'].includes(table) && count !== 2) failures.push(`${table}:expected2:actual${count}`);
    }
    for (const [key, count] of Object.entries(leakage)) if (count !== 0) failures.push(`${key}:foreignRowsVisible:${count}`);
    for (const label of ['schoolA', 'schoolB']) {
      // Schools/branches derive scope from auth.uid(); students also require
      // the trusted application context, which is established above.
      for (const table of ['schools', 'branches']) {
        if (perSchool[label][table] !== 0) failures.push(`${label}.${table}:spoofed_scope_visible:${perSchool[label][table]}`);
      }
      if (perSchool[label].students !== 2) failures.push(`${label}.students:expected2:actual${perSchool[label].students}`);
      for (const table of ['hr_database', 'inventory_database', 'financial_portal_snapshots', 'buses', 'uniforms', 'student_transportation', 'student_uniform_accounts', 'roles', 'user_roles']) {
        if (perSchool[label][table] !== 1) failures.push(`${label}.${table}:expected1:actual${perSchool[label][table]}`);
      }
    }
    if (failures.length > 0) throw new Error(`UAT35_ISOLATION_FAILURE:${failures.join('|')}`);
    console.log(JSON.stringify({ passed: true, allCounts, perSchool, foreignRowsVisible: leakage }, null, 2));
    await client.query('ROLLBACK');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* keep original failure */ }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('UAT35_ISOLATION_FAILED', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
