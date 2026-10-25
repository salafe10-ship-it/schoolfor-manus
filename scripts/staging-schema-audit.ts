import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import crypto from 'node:crypto';
import { X509Certificate } from 'node:crypto';
import { extractPostgresProjectRef } from '../server/security/SupabaseDatabaseTargetAlignment.js';
import { restrictFilePermissions, validateStagingEnvironmentValues } from './prepare-staging-env.js';
import { defaultStagingVaultDirectory } from './staging-secret-store.js';
import { completeStagingSchemaMigrationFiles } from './staging-schema-migration-rehearsal.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.staging');
const localCanonicalUrl = 'postgresql://postgres@127.0.0.1:63991/postgres';
const { Pool } = pg;

type Row = Record<string, unknown>;

async function snapshot(pool: pg.Pool) {
  const [tables, columns, constraints, indexes, policies, privileges, functions, triggers, migrationTable,
    roleMemberships, authenticatorPreRequest, schemaUsage] = await Promise.all([
    pool.query(`SELECT c.relname AS name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind IN ('r','p') ORDER BY c.relname`),
    pool.query(`SELECT table_name, column_name, data_type, udt_name, is_nullable,
        column_default, numeric_precision, numeric_scale, character_maximum_length, generation_expression
      FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position`),
    pool.query(`SELECT r.relname AS table_name, c.conname AS name, c.contype AS kind,
        pg_get_constraintdef(c.oid, true) AS definition
      FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid
      JOIN pg_namespace n ON n.oid=r.relnamespace
      WHERE n.nspname='public' ORDER BY r.relname,c.conname`),
    pool.query(`SELECT tablename AS table_name, indexname AS name, indexdef AS definition
      FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname`),
    pool.query(`SELECT tablename AS table_name, policyname AS name, permissive, roles, cmd,
        qual, with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname`),
    pool.query(`SELECT c.relname AS table_name, r.rolname AS role_name, p.privilege_type
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      CROSS JOIN (VALUES ('anon'),('authenticated'),('edupro_app'),('edupro_staging_app')) AS r(rolname)
      CROSS JOIN (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) AS p(privilege_type)
      WHERE n.nspname='public' AND c.relkind IN ('r','p')
        AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r.rolname)
        AND has_table_privilege(r.rolname, c.oid, p.privilege_type)
      ORDER BY c.relname,r.rolname,p.privilege_type`),
    pool.query(`SELECT p.proname AS name, pg_get_function_identity_arguments(p.oid) AS identity_arguments,
        pg_get_function_result(p.oid) AS result_type, l.lanname AS language,
        p.prosecdef AS security_definer, p.provolatile AS volatility, p.proconfig AS settings
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
      WHERE n.nspname='public' ORDER BY p.proname,identity_arguments`),
    pool.query(`SELECT c.relname AS table_name, t.tgname AS name, pg_get_triggerdef(t.oid,true) AS definition
      FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY c.relname,t.tgname`),
    pool.query(`SELECT to_regclass('supabase_migrations.schema_migrations') IS NOT NULL AS exists`),
    pool.query(`SELECT member.rolname AS member, parent.rolname AS parent
      FROM pg_auth_members m JOIN pg_roles member ON member.oid=m.member
      JOIN pg_roles parent ON parent.oid=m.roleid
      WHERE member.rolname IN ('edupro_staging_app','edupro_app')
      ORDER BY member.rolname,parent.rolname`),
    pool.query(`SELECT EXISTS (SELECT 1 FROM pg_roles r, unnest(COALESCE(r.rolconfig, ARRAY[]::text[])) setting
        WHERE r.rolname='authenticator' AND setting LIKE 'pgrst.db_pre_request=%') AS configured,
      EXISTS (SELECT 1 FROM pg_roles r, unnest(COALESCE(r.rolconfig, ARRAY[]::text[])) setting
        WHERE r.rolname='authenticator' AND setting='pgrst.db_pre_request=public.dbsec003_set_request_context') AS expected_function`),
    pool.query(`SELECT role_name, has_schema_privilege(role_name, 'public', 'USAGE') AS public_usage
      FROM unnest(ARRAY['anon','authenticated','edupro_app','edupro_staging_app']) AS role_name
      WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname=role_name) ORDER BY role_name`),
  ]);
  const migrationHistory = migrationTable.rows[0].exists
    ? (await pool.query(`SELECT count(*)::int AS recorded_count FROM supabase_migrations.schema_migrations`)).rows[0]
    : { recorded_count: 0 };
  return {
    tables: tables.rows as Row[], columns: columns.rows as Row[], constraints: constraints.rows as Row[],
    indexes: indexes.rows as Row[], policies: policies.rows as Row[], privileges: privileges.rows as Row[],
    functions: functions.rows as Row[], triggers: triggers.rows as Row[],
    roleMemberships: roleMemberships.rows as Row[],
    authenticatorPreRequest: authenticatorPreRequest.rows[0] as Row,
    schemaUsage: schemaUsage.rows as Row[],
    migrationHistory: { exists: Boolean(migrationTable.rows[0].exists), ...migrationHistory } as Row,
  };
}

function objectMap(rows: Row[], keyFields: string[], valueFields: string[]) {
  return new Map(rows.map((row) => [keyFields.map((key) => String(row[key] ?? '')).join('.'),
    valueFields.map((key) => `${key}=${JSON.stringify(row[key] ?? null)}`).join('|')]));
}

function compareSet(label: string, canonicalRows: Row[], liveRows: Row[], keyFields: string[], valueFields: string[] = []) {
  const canonical = objectMap(canonicalRows, keyFields, valueFields);
  const live = objectMap(liveRows, keyFields, valueFields);
  const missing = [...canonical.keys()].filter((key) => !live.has(key));
  const extra = [...live.keys()].filter((key) => !canonical.has(key));
  const changed = [...canonical.keys()].filter((key) => live.has(key) && canonical.get(key) !== live.get(key));
  return { label, canonicalCount: canonical.size, liveCount: live.size, missing, extra, changed };
}

function compact(comparison: ReturnType<typeof compareSet>, preview = 12) {
  return {
    canonicalCount: comparison.canonicalCount,
    liveCount: comparison.liveCount,
    missingCount: comparison.missing.length,
    extraCount: comparison.extra.length,
    changedCount: comparison.changed.length,
    missingPreview: comparison.missing.slice(0, preview),
    extraPreview: comparison.extra.slice(0, preview),
    changedPreview: comparison.changed.slice(0, preview),
  };
}

function compareSnapshots(canonical: Awaited<ReturnType<typeof snapshot>>, live: Awaited<ReturnType<typeof snapshot>>) {
  const sharedTables = new Set(canonical.tables.map((table) => String(table.name))
    .filter((name) => live.tables.some((table) => table.name === name)));
  const shared = (rows: Row[]) => rows.filter((row) => sharedTables.has(String(row.table_name)));
  const tables = compareSet('tables', canonical.tables, live.tables, ['name']);
  const allColumns = compareSet('columns', canonical.columns, live.columns, ['table_name', 'column_name'],
    ['data_type', 'udt_name', 'is_nullable', 'column_default', 'numeric_precision', 'numeric_scale', 'character_maximum_length', 'generation_expression']);
  const sharedColumns = compareSet('shared columns', shared(canonical.columns), shared(live.columns), ['table_name', 'column_name'],
    ['data_type', 'udt_name', 'is_nullable', 'column_default', 'numeric_precision', 'numeric_scale', 'character_maximum_length', 'generation_expression']);
  const sharedConstraints = compareSet('shared constraints', shared(canonical.constraints), shared(live.constraints), ['table_name', 'name'], ['kind', 'definition']);
  const sharedIndexes = compareSet('shared indexes', shared(canonical.indexes), shared(live.indexes), ['table_name', 'name'], ['definition']);
  const sharedPolicies = compareSet('shared policies', shared(canonical.policies), shared(live.policies), ['table_name', 'name'], ['permissive', 'roles', 'cmd', 'qual', 'with_check']);
  const sharedPrivileges = compareSet('shared privileges', shared(canonical.privileges), shared(live.privileges), ['table_name', 'role_name', 'privilege_type']);
  const unsafeTablePrivileges = Object.fromEntries(['anon', 'authenticated', 'edupro_app', 'edupro_staging_app'].map((role) => [
    role, live.privileges.filter((row) => row.role_name === role
      && ['TRUNCATE', 'REFERENCES', 'TRIGGER'].includes(String(row.privilege_type))).length,
  ]));
  const allFunctions = compareSet('functions', canonical.functions, live.functions, ['name', 'identity_arguments'],
    ['result_type', 'language', 'security_definer', 'volatility', 'settings']);
  const sharedTriggers = compareSet('shared triggers', shared(canonical.triggers), shared(live.triggers), ['table_name', 'name'], ['definition']);
  const livePolicyRows = new Map(live.policies.map((row) => [`${row.table_name}.${row.name}`, row]));
  const canonicalPolicyRows = new Map(canonical.policies.map((row) => [`${row.table_name}.${row.name}`, row]));
  const policyChanged = sharedPolicies.changed.map((key) => {
    const canonicalRow = canonicalPolicyRows.get(key);
    const liveRow = livePolicyRows.get(key);
    const fields = ['permissive', 'roles', 'cmd', 'qual', 'with_check'] as const;
    return {
      policy: key,
      fields: fields.filter((field) => JSON.stringify(canonicalRow?.[field] ?? null) !== JSON.stringify(liveRow?.[field] ?? null)),
      canonical: canonicalRow ? { roles: canonicalRow.roles, cmd: canonicalRow.cmd,
        qual: canonicalRow.qual, with_check: canonicalRow.with_check } : null,
      target: liveRow ? { roles: liveRow.roles, cmd: liveRow.cmd,
        qual: liveRow.qual, with_check: liveRow.with_check } : null,
    };
  });
  return {
    canonicalTables: canonical.tables.length,
    liveTables: live.tables.length,
    sharedTableCount: sharedTables.size,
    tables: { missing: tables.missing, extra: tables.extra },
    columns: {
      sharedMissing: sharedColumns.missing,
      sharedExtra: sharedColumns.extra,
      sharedChanged: sharedColumns.changed,
      allObjectTotals: compact(allColumns),
    },
    sharedConstraints: compact(sharedConstraints, 64),
    sharedIndexes: compact(sharedIndexes, 64),
    sharedPolicies: compact(sharedPolicies, 64),
    policyDriftPreview: policyChanged,
    sharedPrivileges: compact(sharedPrivileges, 64),
    unsafeTablePrivileges,
    allFunctions: compact(allFunctions, 5),
    sharedTriggers: compact(sharedTriggers, 12),
    anonymousTableGrants: [...new Set(live.privileges.filter((row) => row.role_name === 'anon')
      .map((row) => String(row.table_name)))].sort(),
    anonymousGrantCount: live.privileges.filter((row) => row.role_name === 'anon').length,
    applicationGrantTableCount: new Set(live.privileges.filter((row) => row.role_name === 'edupro_staging_app')
      .map((row) => row.table_name)).size,
    stagingRoleMemberships: live.roleMemberships.filter((row) => row.member === 'edupro_staging_app'),
    publicSchemaUsage: live.schemaUsage,
    authenticatorPreRequest: live.authenticatorPreRequest,
    rlsDifferences: canonical.tables.flatMap((table) => {
      const other = live.tables.find((row) => row.name === table.name);
      return other && (table.rls_enabled !== other.rls_enabled || table.force_rls !== other.force_rls)
        ? [{ table: table.name, canonicalRls: table.rls_enabled, liveRls: other.rls_enabled,
          canonicalForceRls: table.force_rls, liveForceRls: other.force_rls }]
        : [];
    }).reduce((summary, diff) => {
      if (diff.canonicalRls && !diff.liveRls) summary.disabledInLive.push(String(diff.table));
      if (diff.canonicalForceRls && !diff.liveForceRls) summary.forceRlsMissing.push(String(diff.table));
      return summary;
    }, { disabledInLive: [] as string[], forceRlsMissing: [] as string[] }),
    migrationHistory: live.migrationHistory,
  };
}

async function main() {
  const isRehearsal = process.argv[2] === '--rehearsal';
  const rehearsalName = isRehearsal ? String(process.argv[3] || '') : '';
  let expectedTargetTables = 56;
  let livePool: pg.Pool;
  if (isRehearsal) {
    if (!/^edupro_stg_rehearsal_[0-9]{8}_[a-f0-9]{8}$/.test(rehearsalName)) {
      throw new Error('LOCAL_SCHEMA_REHEARSAL_DATABASE_NAME_REJECTED');
    }
    const manifestPath = path.join(defaultStagingVaultDirectory(), 'schema-rehearsals', `${rehearsalName}.json`);
    if (!fs.existsSync(manifestPath)) throw new Error('LOCAL_SCHEMA_REHEARSAL_MANIFEST_MISSING');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
    if (manifest.projectRef !== 'vjcjscqgmijgzagshsca' || manifest.databaseName !== rehearsalName
      || Number(manifest.copiedRows) !== 0 || manifest.replayStatus !== 'passed'
      || Number(manifest.publicTablesAfterReplay) !== 114) throw new Error('LOCAL_SCHEMA_REHEARSAL_MANIFEST_REJECTED');
    expectedTargetTables = 114;
    livePool = new Pool({ connectionString: `postgresql://postgres@127.0.0.1:63991/${rehearsalName}`,
      max: 1, connectionTimeoutMillis: 5_000, statement_timeout: 20_000,
      application_name: 'edupro-local-staging-schema-rehearsal-audit' });
  } else {
    if (!fs.existsSync(envPath)) throw new Error('LOCAL_STAGING_ENV_FILE_MISSING');
    const envStat = fs.lstatSync(envPath);
    if (!envStat.isFile() || envStat.isSymbolicLink()) throw new Error('LOCAL_STAGING_ENV_FILE_INVALID');
    const values = dotenv.parse(fs.readFileSync(envPath));
    validateStagingEnvironmentValues(values);
    const adminUrl = values.PLATFORM_ADMIN_DATABASE_URL;
    if (!adminUrl || extractPostgresProjectRef(adminUrl) !== 'vjcjscqgmijgzagshsca') {
      throw new Error('STAGING_SCHEMA_AUDIT_TARGET_REJECTED');
    }
    const caPath = path.join(defaultStagingVaultDirectory(), 'prod-ca-2021.crt');
    if (!fs.existsSync(caPath) || !new X509Certificate(fs.readFileSync(caPath, 'utf8')).ca) {
      throw new Error('STAGING_CA_CERTIFICATE_INVALID');
    }
    livePool = new Pool({ connectionString: adminUrl, max: 1, connectionTimeoutMillis: 15_000,
      statement_timeout: 20_000, ssl: { rejectUnauthorized: true, ca: fs.readFileSync(caPath, 'utf8') },
      application_name: 'edupro-staging-readonly-schema-audit' });
  }
  const canonicalPool = new Pool({ connectionString: localCanonicalUrl, max: 1, connectionTimeoutMillis: 5_000,
    statement_timeout: 20_000, application_name: 'edupro-local-canonical-schema-audit' });
  try {
    const [liveIdentity, canonicalIdentity] = await Promise.all([
      livePool.query(`SELECT current_database() AS database, current_user AS role,
          (inet_server_addr() <<= inet '127.0.0.0/8') AS local_loopback, inet_server_port() AS port,
          (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind IN ('r','p')) AS public_tables`),
      canonicalPool.query(`SELECT current_database() AS database, current_user AS role,
          (inet_server_addr() <<= inet '127.0.0.0/8') AS local_loopback, inet_server_port() AS port,
          (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind IN ('r','p')) AS public_tables`),
    ]);
    const target = liveIdentity.rows[0];
    const source = canonicalIdentity.rows[0];
    let stagingLedgerStatus: { appliedCount: number; expectedCount: number; pendingMigrations: string[] } | null = null;
    if (!isRehearsal && Number(target.public_tables) === 114) {
      const ledgerExists = await livePool.query(`SELECT to_regclass('edupro_staging_ops.schema_migration_log') IS NOT NULL AS exists`);
      if (!ledgerExists.rows[0]?.exists) throw new Error('STAGING_SCHEMA_AUDIT_LEDGER_MISSING');
      const applied = await livePool.query(`SELECT migration_filename, source_sha256, project_ref
        FROM edupro_staging_ops.schema_migration_log`);
      const expected = completeStagingSchemaMigrationFiles.map((filename) => {
        const sql = fs.readFileSync(path.join(root, 'supabase', 'migrations', filename), 'utf8');
        return { migration_filename: filename, source_sha256: crypto.createHash('sha256').update(sql, 'utf8').digest('hex'),
          project_ref: 'vjcjscqgmijgzagshsca' };
      });
      const expectedPrefix = new Set(expected.slice(0, applied.rows.length).map((row) => row.migration_filename));
      const expectedByName = new Map(expected.map((row) => [row.migration_filename, row]));
      if (applied.rows.length > expected.length || applied.rows.some((row) => {
        const expectedRow = expectedByName.get(String(row.migration_filename));
        return !expectedPrefix.has(String(row.migration_filename)) || !expectedRow
          || row.source_sha256 !== expectedRow.source_sha256 || row.project_ref !== expectedRow.project_ref;
      })) {
        throw new Error('STAGING_SCHEMA_AUDIT_LEDGER_MISMATCH');
      }
      stagingLedgerStatus = { appliedCount: applied.rows.length, expectedCount: expected.length,
        pendingMigrations: expected.slice(applied.rows.length).map((row) => row.migration_filename) };
      expectedTargetTables = 114;
    }
    if ((isRehearsal && (target.database !== rehearsalName || target.local_loopback !== true
        || Number(target.port) !== 63991 || Number(target.public_tables) !== expectedTargetTables))
      || (!isRehearsal && (target.database !== 'postgres' || target.role !== 'postgres'
        || Number(target.public_tables) !== expectedTargetTables))) {
      throw new Error('STAGING_SCHEMA_AUDIT_IDENTITY_CHANGED');
    }
    if (source.database !== 'postgres' || source.local_loopback !== true || Number(source.port) !== 63991
      || Number(source.public_tables) !== 114) {
      const failedChecks = [
        source.database !== 'postgres' && 'database',
        source.local_loopback !== true && 'loopback',
        Number(source.port) !== 63991 && 'port',
        Number(source.public_tables) !== 114 && 'table-count',
      ].filter(Boolean).join(',');
      throw new Error(`LOCAL_CANONICAL_SCHEMA_TARGET_REJECTED:${failedChecks}`);
    }
    const [live, canonical] = await Promise.all([snapshot(livePool), snapshot(canonicalPool)]);
    const differences = compareSnapshots(canonical, live);
    const targetSummary = isRehearsal
      ? { kind: 'local-schema-only-rehearsal', database: rehearsalName, publicTables: Number(target.public_tables) }
      : { kind: 'staging', projectRef: 'vjcjscqgmijgzagshsca', publicTables: Number(target.public_tables),
        databaseRole: 'postgres', migrationHistory: live.migrationHistory, migrationLedger: stagingLedgerStatus };
    if (process.argv.includes('--summary')) {
      console.info(JSON.stringify({
        checkedAt: new Date().toISOString(), target: targetSummary,
        schema: {
          canonicalTables: canonical.tables.length, targetTables: live.tables.length,
          missingTables: differences.tables.missing, extraTables: differences.tables.extra,
          sharedMissingColumns: differences.columns.sharedMissing,
          sharedExtraColumns: differences.columns.sharedExtra,
          sharedChangedColumns: differences.columns.sharedChanged,
          sharedConstraints: { missing: differences.sharedConstraints.missingCount,
            extra: differences.sharedConstraints.extraCount, changed: differences.sharedConstraints.changedCount },
          sharedIndexes: { missing: differences.sharedIndexes.missingCount,
            extra: differences.sharedIndexes.extraCount, changed: differences.sharedIndexes.changedCount },
          sharedPolicies: { missing: differences.sharedPolicies.missingCount,
            extra: differences.sharedPolicies.extraCount, changed: differences.sharedPolicies.changedCount },
          anonymousGrantCount: differences.anonymousGrantCount,
          anonymousTables: differences.anonymousTableGrants,
          rlsDisabledInTarget: differences.rlsDifferences.disabledInLive,
          missingForceRls: differences.rlsDifferences.forceRlsMissing,
          unsafeTablePrivileges: differences.unsafeTablePrivileges,
          functions: differences.allFunctions,
          triggers: differences.sharedTriggers,
          privileges: differences.sharedPrivileges,
          appRoleMemberships: differences.stagingRoleMemberships,
          authenticatorPreRequest: differences.authenticatorPreRequest,
        },
      }, null, 2));
    } else console.info(JSON.stringify({
      checkedAt: new Date().toISOString(),
      target: targetSummary,
      canonical: { publicTables: Number(source.public_tables), host: '127.0.0.1', port: 63991 },
      differences,
    }, null, 2));
    console.info(isRehearsal
      ? 'Read-only metadata comparison completed; no Staging rows were read or written.'
      : 'Read-only schema metadata audit completed; no rows or secret values were read or written.');
  } finally {
    await Promise.all([livePool.end(), canonicalPool.end()]);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : '';
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    console.error(/^STAGING_[A-Z0-9_]+$|^LOCAL_[A-Z0-9_]+$|^LOCAL_CANONICAL_SCHEMA_TARGET_REJECTED:[a-z,-]+$/.test(message)
      ? message : /^[0-9A-Z]{5}$/.test(code) ? `STAGING_SCHEMA_AUDIT_SQL_${code}` : 'STAGING_SCHEMA_AUDIT_FAILED');
    process.exitCode = 1;
  });
}

export { compareSnapshots };
