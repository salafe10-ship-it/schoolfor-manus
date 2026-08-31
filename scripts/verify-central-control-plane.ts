import 'dotenv/config';
import { Pool } from 'pg';

const requiredTables = ['tenants', 'subscriptions', 'schools', 'branches', 'users', 'platform_users'];
const requiredIndexes = ['uq_schools_live_central_subdomain', 'uq_schools_live_central_domain'];
const requiredLifecycleFunctions = [
  'dbsec004_current_tenant_id',
  'dbsec004_current_school_id',
  'dbsec004_current_branch_id',
  'dbsec004_resolve_login_username',
];

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error(JSON.stringify({ success: false, code: 'DATABASE_URL_MISSING' }));
  process.exit(2);
}

const pool = new Pool({ connectionString, connectionTimeoutMillis: 8_000, max: 1 });

try {
  const client = await pool.connect();
  try {
    const identity = await client.query<{
      database_name: string;
      current_user: string;
      rolsuper: boolean;
      rolbypassrls: boolean;
    }>(`
      SELECT current_database() AS database_name,
             current_user,
             COALESCE(r.rolsuper, false) AS rolsuper,
             COALESCE(r.rolbypassrls, false) AS rolbypassrls
        FROM pg_roles r
       WHERE r.rolname = current_user
    `);

    const tables = await client.query<{ table_name: string }>(`
      SELECT table_name
        FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])
       ORDER BY table_name
    `, [requiredTables]);

    const indexes = await client.query<{ indexname: string }>(`
      SELECT indexname
        FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname = ANY($1::text[])
       ORDER BY indexname
    `, [requiredIndexes]);

    const duplicateRoutes = await client.query<{ route_type: string; duplicate_groups: number }>(`
      WITH routes AS (
        SELECT 'subdomain'::text AS route_type,
               lower(NULLIF(btrim(central_metadata->>'subdomain'), '')) AS route_value
          FROM public.schools
         WHERE deleted_at IS NULL
        UNION ALL
        SELECT 'domain'::text AS route_type,
               lower(COALESCE(NULLIF(btrim(central_metadata->>'domain'), ''), NULLIF(btrim(central_metadata->>'customDomain'), '')))
          FROM public.schools
         WHERE deleted_at IS NULL
      ), duplicate_groups AS (
        SELECT route_type, route_value
          FROM routes
         WHERE route_value IS NOT NULL
         GROUP BY route_type, route_value
        HAVING COUNT(*) > 1
      )
      SELECT route_type, COUNT(*)::integer AS duplicate_groups
        FROM duplicate_groups
       GROUP BY route_type
       ORDER BY route_type
    `);

    const functions = await client.query<{ proname: string; definition: string }>(`
      SELECT p.proname, pg_get_functiondef(p.oid) AS definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND p.proname = ANY($1::text[])
    `, [requiredLifecycleFunctions]);

    const scopedSecurity = await client.query<{
      table_name: string;
      rls_enabled: boolean;
      rls_forced: boolean;
      has_select_policy: boolean;
    }>(`
      SELECT c.relname AS table_name,
             c.relrowsecurity AS rls_enabled,
             c.relforcerowsecurity AS rls_forced,
             EXISTS (
               SELECT 1
                 FROM pg_policies p
                WHERE p.schemaname = 'public'
                  AND p.tablename = c.relname
                  AND p.cmd IN ('SELECT', 'ALL', '*')
                  AND 'authenticated' = ANY(p.roles)
             ) AS has_select_policy
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relkind = 'r'
         AND EXISTS (
           SELECT 1
             FROM information_schema.columns col
            WHERE col.table_schema = 'public'
              AND col.table_name = c.relname
              AND col.column_name = 'tenant_id'
         )
       ORDER BY c.relname
    `);

    const presentTables = tables.rows.map((row) => row.table_name);
    const presentIndexes = indexes.rows.map((row) => row.indexname);
    const guardedFunctions = functions.rows
      .filter((row) => row.definition.includes('public.tenants') && row.definition.includes('public.platform_users'))
      .map((row) => row.proname);
    const duplicateGroupNames = duplicateRoutes.rows.map((row) => `duplicate_${row.route_type}`);
    const rlsMissing = scopedSecurity.rows.flatMap((row) => [
      ...(!row.rls_enabled ? [`rls_disabled:${row.table_name}`] : []),
      ...(row.rls_enabled && !row.rls_forced ? [`rls_not_forced:${row.table_name}`] : []),
      ...(!row.has_select_policy ? [`rls_select_policy_missing:${row.table_name}`] : []),
    ]);
    const missing = [
      ...requiredTables.filter((name) => !presentTables.includes(name)).map((name) => `table:${name}`),
      ...requiredIndexes.filter((name) => !presentIndexes.includes(name)).map((name) => `index:${name}`),
      ...requiredLifecycleFunctions.filter((name) => !guardedFunctions.includes(name)).map((name) => `lifecycle_function:${name}`),
      ...duplicateGroupNames.map((name) => `route_conflict:${name}`),
      ...rlsMissing,
    ];
    const role = identity.rows[0] || null;
    const restrictedRole = Boolean(role && !role.rolsuper && !role.rolbypassrls);
    const success = missing.length === 0 && restrictedRole;

    console.log(JSON.stringify({
      success,
      identity: role ? {
        database: role.database_name,
        role: role.current_user,
        superuser: role.rolsuper,
        bypassRls: role.rolbypassrls,
      } : null,
      objects: {
        tables: presentTables,
        indexes: presentIndexes,
        lifecycleFunctions: guardedFunctions,
        duplicateRoutes: duplicateRoutes.rows,
        scopedRls: scopedSecurity.rows,
      },
      missing,
      roleCheck: restrictedRole ? 'restricted_non_bypass_role' : 'unsafe_or_unresolved_role',
    }));

    if (!success) process.exitCode = 2;
  } finally {
    client.release();
  }
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    code: 'CENTRAL_CONTROL_PLANE_UNREACHABLE',
    errorCategory: error instanceof Error && 'code' in error ? String((error as Error & { code?: unknown }).code) : 'query_failed',
  }));
  process.exitCode = 2;
} finally {
  await pool.end();
}
