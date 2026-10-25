import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { extractPostgresProjectRef } from '../server/security/SupabaseDatabaseTargetAlignment.js';
import { defaultStagingVaultDirectory } from './staging-secret-store.js';
import { inspectStagingMigrationDataImpact } from './staging-data-impact.js';
import { restrictFilePermissions, validateStagingEnvironmentValues } from './prepare-staging-env.js';
import { resolveStagingBackupTarget } from './staging-backup.js';
import { completeStagingSchemaMigrationFiles } from './staging-schema-migration-rehearsal.js';
import { X509Certificate } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDirectory = path.join(root, 'supabase', 'migrations');
const envPath = path.join(root, '.env.staging');
const projectRef = 'vjcjscqgmijgzagshsca';
const ledger = 'edupro_staging_ops.schema_migration_log';
const { Pool } = pg;

function strictUrl(raw: string): string {
  const url = new URL(raw);
  for (const key of [...url.searchParams.keys()]) {
    if (/^ssl/i.test(key) || key.toLowerCase() === 'uselibpqcompat') url.searchParams.delete(key);
  }
  return url.toString();
}

function migrationBody(filename: string): { version: string; name: string; sql: string; sha256: string } {
  const match = /^(\d{12})_(.+)\.sql$/.exec(filename);
  if (!match) throw new Error('STAGING_MIGRATION_FILENAME_INVALID');
  const sql = fs.readFileSync(path.join(migrationsDirectory, filename), 'utf8');
  const beginCount = [...sql.matchAll(/^[\t ]*BEGIN;[\t ]*\r?$/gm)].length;
  const commitCount = [...sql.matchAll(/^[\t ]*COMMIT;[\t ]*\r?$/gm)].length;
  if ((beginCount !== 0 && beginCount !== 1) || beginCount !== commitCount
    || (commitCount === 1 && !/^[\t ]*COMMIT;\s*$/m.test(sql.slice(sql.lastIndexOf('COMMIT;'))))) {
    throw new Error(`STAGING_MIGRATION_TRANSACTION_WRAPPER_INVALID:${filename}`);
  }
  const body = beginCount === 1
    ? sql.replace(/^[\t ]*BEGIN;[\t ]*\r?$/m, '').replace(/^[\t ]*COMMIT;[\t ]*\r?\n?$/m, '')
    : sql;
  if (/\b(?:CREATE|REINDEX)\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\b|\bVACUUM\b|\bCREATE\s+DATABASE\b/i.test(body)) {
    throw new Error(`STAGING_MIGRATION_NOT_TRANSACTION_SAFE:${filename}`);
  }
  return { version: match[1], name: match[2], sql: body,
    sha256: crypto.createHash('sha256').update(sql, 'utf8').digest('hex') };
}

function assertPreflight(impact: Awaited<ReturnType<typeof inspectStagingMigrationDataImpact>>) {
  const failed: string[] = [];
  if (impact.centralStudentAffairsSeed.centralSchoolCount !== 0
    || impact.centralStudentAffairsSeed.existingAcademicStructureRows !== 0) failed.push('central-school-seed-impact');
  if (impact.customerAcademicBackfill.eligibleCustomerSchoolsAfterDefaultingMissingMetadataToEmptyObject !== 0) {
    failed.push('customer-academic-backfill-impact');
  }
  if (impact.canonicalIdentitySeeds.tenants !== 1 || impact.canonicalIdentitySeeds.existingRoleRowsForCanonicalKeys !== 0
    || impact.canonicalIdentitySeeds.existingPermissionKeys !== 0
    || impact.canonicalIdentitySeeds.existingMappingsThatWouldBeUpserted !== 0) failed.push('canonical-identity-seed-impact');
  if (impact.identityApprovals.requests !== 0 || impact.identityApprovals.approvals !== 0
    || impact.identityApprovals.userPermissionGrantRows !== 0) failed.push('identity-existing-rows');
  if (impact.financialSerialMigrations.presentTargetTablesOutOfFive !== 0) failed.push('financial-target-tables-already-exist');
  if (impact.existingRowConstraintPreflight.studentStatusTransitionRowsViolatingNewCanonicalCheck !== 0
    || impact.existingRowConstraintPreflight.transitionCheckScanSkippedForLargeTable
    || impact.existingRowConstraintPreflight.duplicateLiveCentralDomains !== 0
    || impact.existingRowConstraintPreflight.duplicateLiveCentralSubdomains !== 0
    || impact.existingRowConstraintPreflight.duplicateLiveStudentNationalIds !== 0
    || impact.existingRowConstraintPreflight.duplicateLiveUsernamesCaseInsensitive !== 0
    || impact.existingRowConstraintPreflight.duplicateLiveEmailsCaseInsensitive !== 0) failed.push('existing-row-constraint-conflict');
  if (impact.privateStudentDocumentStorageMigration.targetBucketRows !== 0
    || impact.privateStudentDocumentStorageMigration.targetBucketNameConflictRows !== 0
    || impact.privateStudentDocumentStorageMigration.existingTargetBucketObjectCount !== 0
    || impact.privateStudentDocumentStorageMigration.metadataTableAlreadyExists) failed.push('private-storage-existing-state');
  if (!impact.migrationRegistry.exists || impact.migrationRegistry.recordedRows !== 0
    || !['version', 'statements', 'name'].every((column) => impact.migrationRegistry.columns.some((item) => item.column_name === column))) {
    failed.push('migration-registry-not-empty-or-schema-changed');
  }
  if (failed.length) throw new Error(`STAGING_DATA_IMPACT_GATE_REJECTED:${failed.join(',')}`);
}

function requireRecentBackupAndRehearsal(vault: string) {
  const backupDirectory = path.join(vault, 'backups');
  const rehearsalDirectory = path.join(vault, 'schema-rehearsals');
  if (!fs.existsSync(backupDirectory) || !fs.existsSync(rehearsalDirectory)
    || fs.lstatSync(backupDirectory).isSymbolicLink() || fs.lstatSync(rehearsalDirectory).isSymbolicLink()) {
    throw new Error('STAGING_BACKUP_OR_REHEARSAL_DIRECTORY_INVALID');
  }
  const backups = fs.readdirSync(backupDirectory).filter((name) => /^staging-public-[0-9TZ]+-[a-f0-9-]{36}\.dump\.dpapi$/.test(name))
    .map((name) => path.join(backupDirectory, name))
    .filter((file) => fs.lstatSync(file).isFile() && !fs.lstatSync(file).isSymbolicLink())
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  const latestBackup = backups[0];
  if (!latestBackup || Date.now() - fs.statSync(latestBackup).mtimeMs > 24 * 60 * 60 * 1000) {
    throw new Error('STAGING_BACKUP_NOT_RECENT');
  }
  const backupName = path.basename(latestBackup);
  const rehearsed = fs.readdirSync(rehearsalDirectory).filter((name) => /^edupro_stg_rehearsal_[0-9]{8}_[a-f0-9]{8}\.json$/.test(name))
    .some((name) => {
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(rehearsalDirectory, name), 'utf8')) as Record<string, unknown>;
        return manifest.projectRef === projectRef && manifest.encryptedBackupFile === backupName
          && manifest.archiveType === 'PostgreSQL custom-format schema-only; excludes table data, ACLs, and ownership'
          && [56, 114].includes(Number(manifest.publicTables)) && Number(manifest.copiedRows) === 0
          && manifest.replayStatus === 'passed' && Number(manifest.publicTablesAfterReplay) === 114
          && Array.isArray(manifest.migrationsApplied)
          && JSON.stringify(manifest.migrationsApplied) === JSON.stringify(completeStagingSchemaMigrationFiles);
      } catch { return false; }
    });
  if (!rehearsed) throw new Error('STAGING_BACKUP_RESTORE_REHEARSAL_REQUIRED');
  return { encryptedBackupFile: backupName, restoredSchemaTested: true };
}

async function verifyApplicationRole(connectionString: string, ca: string) {
  const pool = new Pool({ connectionString: strictUrl(connectionString), max: 1, connectionTimeoutMillis: 15_000,
    ssl: { rejectUnauthorized: true, ca }, application_name: 'edupro-staging-app-role-preflight-readonly' });
  try {
    const result = await pool.query(`SELECT current_database() AS database, current_user AS role,
      COALESCE(r.rolsuper, true) AS superuser, COALESCE(r.rolbypassrls, true) AS bypass_rls,
      COALESCE(r.rolcanlogin, false) AS can_login, COALESCE(r.rolcreaterole, true) AS create_role,
      COALESCE(r.rolcreatedb, true) AS create_database, COALESCE(r.rolreplication, true) AS replication
      FROM pg_roles r WHERE r.rolname=current_user`);
    const row = result.rows[0];
    if (row?.database !== 'postgres' || row.role !== 'edupro_staging_app' || row.superuser
      || row.bypass_rls || !row.can_login || row.create_role || row.create_database || row.replication) {
      throw new Error('STAGING_APPLICATION_ROLE_REJECTED');
    }
    return { database: row.database, role: row.role, nonSuperuser: true, bypassRls: false,
      login: true, noRoleCreation: true, noDatabaseCreation: true, noReplication: true };
  } finally { await pool.end(); }
}

export async function applyStagingSchemaMigrations(mode: 'plan' | 'apply') {
  if (!fs.existsSync(envPath)) throw new Error('LOCAL_STAGING_ENV_FILE_MISSING');
  const envStat = fs.lstatSync(envPath);
  if (!envStat.isFile() || envStat.isSymbolicLink()) throw new Error('LOCAL_STAGING_ENV_FILE_INVALID');
  const values = dotenv.parse(fs.readFileSync(envPath));
  validateStagingEnvironmentValues(values);
  if (extractPostgresProjectRef(values.PLATFORM_ADMIN_DATABASE_URL || '') !== projectRef
    || extractPostgresProjectRef(values.DATABASE_URL || '') !== projectRef) throw new Error('STAGING_APPLY_TARGET_REJECTED');
  const adminTarget = resolveStagingBackupTarget(values);
  const vault = defaultStagingVaultDirectory();
  if (!fs.existsSync(vault) || !fs.lstatSync(vault).isDirectory() || fs.lstatSync(vault).isSymbolicLink()) {
    throw new Error('STAGING_VAULT_DIRECTORY_INVALID');
  }
  const caPath = path.join(vault, 'prod-ca-2021.crt');
  if (!fs.existsSync(caPath)) throw new Error('STAGING_CA_CERTIFICATE_MISSING');
  const ca = fs.readFileSync(caPath, 'utf8');
  try { if (!new X509Certificate(ca).ca) throw new Error('invalid'); }
  catch { throw new Error('STAGING_CA_CERTIFICATE_INVALID'); }
  const backup = requireRecentBackupAndRehearsal(vault);
  const migrations = completeStagingSchemaMigrationFiles.map(migrationBody);

  const pool = new Pool({ connectionString: strictUrl(values.PLATFORM_ADMIN_DATABASE_URL || ''), max: 1,
    connectionTimeoutMillis: 15_000, statement_timeout: 300_000,
    ssl: { rejectUnauthorized: true, ca }, application_name: `edupro-staging-schema-${mode}` });
  try {
    const client = await pool.connect();
    client.on('error', () => undefined);
    try {
      const identity = await client.query(`SELECT current_database() AS database, current_user AS role,
          inet_server_port() AS port, current_setting('default_transaction_read_only') AS read_only,
          (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND c.relkind IN ('r','p')) AS public_tables,
          to_regclass('supabase_migrations.schema_migrations') IS NOT NULL AS registry_exists,
          to_regclass('edupro_staging_ops.schema_migration_log') IS NOT NULL AS staging_ledger_exists`);
      const target = identity.rows[0];
      if (target?.database !== 'postgres' || target.role !== 'postgres' || Number(target.port) !== Number(adminTarget.port)
        || target.read_only !== 'off' || ![56, 114].includes(Number(target.public_tables)) || !target.registry_exists) {
        throw new Error('STAGING_APPLY_LIVE_IDENTITY_OR_BASELINE_REJECTED');
      }
      const appRole = await verifyApplicationRole(values.DATABASE_URL || '', ca);
      await client.query('BEGIN READ ONLY');
      const impact = await inspectStagingMigrationDataImpact(client);
      await client.query('COMMIT');
      const existingLedger = target.staging_ledger_exists
        ? await client.query(`SELECT migration_filename, source_sha256, project_ref
            FROM ${ledger}`)
        : { rows: [] as Array<{ migration_filename: string; source_sha256: string; project_ref: string }> };
      const existingRows = existingLedger.rows;
      const migrationByName = new Map(migrations.map((migration) => [
        `${migration.version}_${migration.name}.sql`, migration.sha256,
      ]));
      const expectedPrefixNames = new Set(migrations.slice(0, existingRows.length)
        .map((migration) => `${migration.version}_${migration.name}.sql`));
      if (existingRows.length > migrations.length || existingRows.some((row) =>
        !expectedPrefixNames.has(row.migration_filename)
        || migrationByName.get(row.migration_filename) !== row.source_sha256 || row.project_ref !== projectRef)) {
        throw new Error('STAGING_APPLY_LEDGER_MISMATCH');
      }
      const expectedCurrentTables = existingRows.length === 0 ? 56 : 114;
      if (Number(target.public_tables) !== expectedCurrentTables) throw new Error('STAGING_APPLY_LEDGER_SCHEMA_MISMATCH');
      const pending = migrations.slice(existingRows.length);
      if (existingRows.length === 0) assertPreflight(impact);
      if (mode === 'plan') {
        return { mode, projectRef, database: target.database, publicTablesBefore: Number(target.public_tables),
          migrationCount: migrations.length, alreadyAppliedCount: existingRows.length,
          pendingMigrationFiles: pending.map(({ version, name }) => `${version}_${name}.sql`),
          migrationFiles: migrations.map(({ version, name }) => `${version}_${name}.sql`),
          backup, appRole, impact, liveWritesPerformed: false };
      }
      if (pending.length === 0) {
        return { mode, projectRef, database: target.database, publicTablesBefore: Number(target.public_tables),
          publicTablesAfter: Number(target.public_tables), ledgerEntries: existingRows.length,
          migrationCount: migrations.length, appliedThisRun: 0, alreadyAppliedCount: existingRows.length,
          backup, appRole, liveWritesPerformed: false };
      }

      let activePhase = 'prepare-ledger';
      await client.query('BEGIN');
      try {
        await client.query("SET LOCAL lock_timeout = '10s'");
        await client.query("SET LOCAL statement_timeout = '5min'");
        await client.query("SELECT pg_advisory_xact_lock(hashtext('edupro-staging-schema-repair'))");
        const priorLedger = await client.query(`SELECT to_regclass($1) IS NOT NULL AS exists`, [ledger]);
        if (priorLedger.rows[0]?.exists) {
          const oldRows = await client.query(`SELECT migration_filename, source_sha256, project_ref
            FROM ${ledger}`);
          const normalized = (rows: typeof existingRows) => rows.map((row) => [row.migration_filename,
            row.source_sha256, row.project_ref] as const).sort((a, b) => a[0].localeCompare(b[0]));
          const beforeLock = normalized(existingRows);
          const underLock = normalized(oldRows.rows);
          if (underLock.length !== beforeLock.length || underLock.some((row, index) =>
            row.some((value, column) => value !== beforeLock[index]?.[column]))) {
            throw new Error('STAGING_APPLY_LEDGER_CHANGED_DURING_PREFLIGHT');
          }
        }
        activePhase = 'create-private-ledger-schema';
        await client.query('CREATE SCHEMA IF NOT EXISTS edupro_staging_ops AUTHORIZATION postgres');
        activePhase = 'secure-private-ledger-schema';
        await client.query('REVOKE ALL ON SCHEMA edupro_staging_ops FROM PUBLIC, anon, authenticated, edupro_staging_app');
        await client.query(`DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='edupro_app') THEN
            EXECUTE 'REVOKE ALL ON SCHEMA edupro_staging_ops FROM edupro_app';
          END IF;
        END $$`);
        activePhase = 'create-private-ledger';
        await client.query(`CREATE TABLE IF NOT EXISTS ${ledger} (
          migration_filename text PRIMARY KEY,
          source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
          project_ref text NOT NULL CHECK (project_ref = '${projectRef}'),
          release_id uuid NOT NULL,
          applied_at timestamptz NOT NULL DEFAULT now()
        )`);
        activePhase = 'secure-private-ledger';
        await client.query(`REVOKE ALL ON TABLE ${ledger} FROM PUBLIC, anon, authenticated, edupro_staging_app`);
        await client.query(`DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='edupro_app') THEN
            EXECUTE 'REVOKE ALL ON TABLE ${ledger} FROM edupro_app';
          END IF;
        END $$`);
        await client.query(`ALTER TABLE ${ledger} ENABLE ROW LEVEL SECURITY`);
        const releaseId = crypto.randomUUID();
        for (let index = 0; index < pending.length; index += 1) {
          const migration = pending[index];
          const filename = `${migration.version}_${migration.name}.sql`;
          activePhase = filename;
          try {
            await client.query(migration.sql);
            await client.query(`INSERT INTO ${ledger} (migration_filename, source_sha256, project_ref, release_id)
              VALUES ($1,$2,$3,$4)`, [filename, migration.sha256, projectRef, releaseId]);
          } catch (error) {
            const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'UNKNOWN';
            const position = error && typeof error === 'object' && 'position' in error ? String(error.position) : '0';
            throw new Error(`STAGING_SCHEMA_MIGRATION_FAILED:${filename}:${code}:${position}`);
          }
        }
        activePhase = 'postconditions';
        const final = await client.query(`SELECT count(*)::int AS public_tables,
          (SELECT count(*)::int FROM ${ledger}) AS ledger_entries,
          (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relrowsecurity) AS rls_tables,
          (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity) AS no_rls_tables,
          (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relforcerowsecurity) AS forced_rls_tables,
          (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            CROSS JOIN (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege_type)
            WHERE n.nspname='public' AND c.relkind IN ('r','p')
              AND has_table_privilege('anon',c.oid,p.privilege_type)) AS anon_table_privileges,
          (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            CROSS JOIN (VALUES ('anon'),('authenticated'),('edupro_app'),('edupro_staging_app')) r(role_name)
            CROSS JOIN (VALUES ('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege_type)
            WHERE n.nspname='public' AND c.relkind IN ('r','p')
              AND has_table_privilege(r.role_name,c.oid,p.privilege_type)) AS unsafe_api_table_privileges
          FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname='public' AND c.relkind IN ('r','p')`);
        const verified = final.rows[0];
        if (Number(verified.public_tables) !== 114 || Number(verified.ledger_entries) !== migrations.length
          || Number(verified.rls_tables) !== 114 || Number(verified.no_rls_tables) !== 0
          || Number(verified.anon_table_privileges) !== 0 || Number(verified.unsafe_api_table_privileges) !== 0) {
          // Keep the diagnostic aggregate-only: it helps identify which invariant failed
          // without exposing table contents, SQL text, or connection details.
          throw new Error(`STAGING_APPLY_POSTCONDITION_FAILED:${verified.public_tables}:${verified.ledger_entries}`
            + `:${verified.rls_tables}:${verified.no_rls_tables}:${verified.anon_table_privileges}`
            + `:${verified.unsafe_api_table_privileges}`);
        }
        await client.query('COMMIT');
        return { mode, projectRef, database: target.database, publicTablesBefore: Number(target.public_tables),
          publicTablesAfter: Number(verified.public_tables), ledgerEntries: Number(verified.ledger_entries),
          forcedRlsTables: Number(verified.forced_rls_tables),
          migrationCount: migrations.length, appliedThisRun: pending.length,
          alreadyAppliedCount: existingRows.length, releaseId, backup, appRole, liveWritesPerformed: true };
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        if (error instanceof Error && !error.message.startsWith('STAGING_')) {
          const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'UNKNOWN';
          throw new Error(`STAGING_SCHEMA_APPLY_PHASE_FAILED:${activePhase}:${code}`);
        }
        throw error;
      }
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally { client.release(); }
  } finally { await pool.end(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv.includes('--apply') ? 'apply' : process.argv.includes('--plan') ? 'plan' : null;
  if (!mode || (process.argv.includes('--apply') && process.argv.includes('--plan'))) {
    console.error('USAGE: npm run staging:apply-schema -- --plan | --apply');
    process.exitCode = 2;
  } else {
    applyStagingSchemaMigrations(mode).then((result) => {
      console.info(JSON.stringify(result, null, 2));
      console.info(mode === 'plan' ? 'Read-only Staging apply plan verified; no remote writes performed.'
        : 'Staging schema migrations and per-file SHA-256 ledger committed atomically.');
    }).catch((error) => {
      const message = error instanceof Error ? error.message : '';
      console.error(/^(?:STAGING|LOCAL)_[A-Za-z0-9_.:-]+$/.test(message) ? message : 'STAGING_SCHEMA_APPLY_FAILED');
      process.exitCode = 1;
    });
  }
}
