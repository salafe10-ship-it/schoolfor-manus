import 'dotenv/config';
import pg from 'pg';

/**
 * Read-only schema preflight for the controlled 35-school UAT cycle.
 * It deliberately prints structure only: no connection strings, identities,
 * school names, or business records are emitted.
 */
const REQUIRED_TABLES = [
  'tenants',
  'schools',
  'branches',
  'users',
  'hr_database',
  'roles',
  'permissions',
  'role_permissions',
  'user_roles',
  'inventory_database',
  'financial_portal_snapshots',
  'buses',
  'uniforms',
  'student_transportation',
  'students',
  'student_uniform_accounts',
  'audit_events',
] as const;

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('UAT35_PREFLIGHT_DATABASE_URL_MISSING');
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function main() {
  const client = await pool.connect();
  try {
    const tablesResult = await client.query<{ table_name: string }>(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name`,
    );
    const existingTables = new Set(tablesResult.rows.map(({ table_name }) => table_name));
    const presentTables = REQUIRED_TABLES.filter((table) => existingTables.has(table));

    const columnsResult = await client.query<{
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(
      `SELECT table_name, column_name, data_type, is_nullable
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
        ORDER BY table_name, ordinal_position`,
      [presentTables],
    );

    const rlsResult = await client.query<{
      table_name: string;
      row_security_enabled: boolean;
      row_security_forced: boolean;
    }>(
      `SELECT c.relname AS table_name,
              c.relrowsecurity AS row_security_enabled,
              c.relforcerowsecurity AS row_security_forced
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relname = ANY($1::text[])
        ORDER BY c.relname`,
      [presentTables],
    );

    const policiesResult = await client.query<{
      table_name: string;
      policy_name: string;
      command: string;
    }>(
      `SELECT tablename AS table_name,
              policyname AS policy_name,
              cmd AS command
         FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = ANY($1::text[])
        ORDER BY tablename, policyname`,
      [presentTables],
    );

    const columnsByTable = Object.fromEntries(
      presentTables.map((table) => [
        table,
        columnsResult.rows
          .filter((column) => column.table_name === table)
          .map(({ column_name, data_type, is_nullable }) => ({ column_name, data_type, is_nullable })),
      ]),
    );

    const policiesByTable = Object.fromEntries(
      presentTables.map((table) => [
        table,
        policiesResult.rows
          .filter((policy) => policy.table_name === table)
          .map(({ policy_name, command }) => ({ policy_name, command })),
      ]),
    );

    const uatAnchor = existingTables.has('users')
      ? await client.query<{ active_actor_count: string }>(
        `SELECT COUNT(u.id)::text AS active_actor_count
           FROM public.schools s
           JOIN public.users u ON u.tenant_id = s.tenant_id
          WHERE s.display_name ILIKE '%UAT-B%'
            AND s.status = 'active'
            AND s.deleted_at IS NULL
            AND u.status = 'active'
            AND u.deleted_at IS NULL`,
      )
      : { rows: [] as Array<{ active_actor_count: string }> };

    console.log(JSON.stringify({
      mode: 'read-only-schema-preflight',
      requiredTables: REQUIRED_TABLES,
      presentTables,
      missingTables: REQUIRED_TABLES.filter((table) => !existingTables.has(table)),
      columnsByTable,
      rls: rlsResult.rows,
      policiesByTable,
      uatAnchor: {
        detected: uatAnchor.rows.length > 0 && Number(uatAnchor.rows[0]?.active_actor_count || 0) > 0,
        activeActorCount: Number(uatAnchor.rows[0]?.active_actor_count || 0),
      },
    }, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('UAT35_PREFLIGHT_FAILED', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
});
