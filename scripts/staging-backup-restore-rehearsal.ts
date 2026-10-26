import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomUUID, X509Certificate } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { extractPostgresProjectRef } from '../server/security/SupabaseDatabaseTargetAlignment.js';
import { restrictFilePermissions, validateStagingEnvironmentValues } from './prepare-staging-env.js';
import { resolveStagingBackupTarget } from './staging-backup.js';
import { defaultStagingVaultDirectory } from './staging-secret-store.js';
import { completeStagingSchemaMigrationFiles } from './staging-schema-migration-rehearsal.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.staging');
const dpapiScript = path.join(root, 'scripts', 'staging-dpapi.ps1');
const localHost = '127.0.0.1';
const localPort = 63991;
const projectRef = 'vjcjscqgmijgzagshsca';
const { Pool } = pg;

async function inspectRemoteMigrationBaseline(connectionString: string, ca: string) {
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 15_000,
    statement_timeout: 15_000, ssl: { rejectUnauthorized: true, ca },
    application_name: 'edupro-staging-backup-baseline-readonly' });
  try {
    const identity = await pool.query(`SELECT current_database() AS database, current_user AS role,
      (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind IN ('r','p')) AS public_tables,
      to_regclass('edupro_staging_ops.schema_migration_log') IS NOT NULL AS ledger_exists`);
    const row = identity.rows[0];
    if (row?.database !== 'postgres' || row.role !== 'postgres') throw new Error('STAGING_BACKUP_BASELINE_IDENTITY_REJECTED');
    const expectedMigrations = completeStagingSchemaMigrationFiles.map((filename) => {
      const sourcePath = path.join(root, 'supabase', 'migrations', filename);
      const source = fs.readFileSync(sourcePath, 'utf8');
      return { filename, sha256: createHash('sha256').update(source, 'utf8').digest('hex') };
    });
    let baseline: Array<{ filename: string; sha256: string }> = [];
    if (row.ledger_exists) {
      const entries = await pool.query(`SELECT migration_filename, source_sha256, project_ref
        FROM edupro_staging_ops.schema_migration_log`);
      const expectedByName = new Map(expectedMigrations.map((entry) => [entry.filename, entry.sha256]));
      const expectedPrefix = expectedMigrations.slice(0, entries.rows.length);
      const prefixNames = new Set(expectedPrefix.map((entry) => entry.filename));
      if (entries.rows.length > expectedMigrations.length || entries.rows.some((entry) =>
        !prefixNames.has(String(entry.migration_filename))
        || expectedByName.get(String(entry.migration_filename)) !== entry.source_sha256
        || entry.project_ref !== projectRef)) {
        throw new Error('STAGING_BACKUP_BASELINE_LEDGER_MISMATCH');
      }
      baseline = expectedPrefix;
    }
    const tableCount = Number(row.public_tables);
    if ((tableCount === 56 && baseline.length !== 0)
      || (tableCount === 114 && baseline.length === 0)
      || ![56, 114].includes(tableCount)) {
      throw new Error('STAGING_BACKUP_BASELINE_STATE_REJECTED');
    }
    return { tableCount, baseline };
  } finally { await pool.end(); }
}

function runDpapiOpen(source: string, destination: string): void {
  try {
    const sourceText = fs.readFileSync(dpapiScript, 'utf8');
    const command = `& { ${sourceText} } -Action $env:EDUPRO_DPAPI_ACTION -Source $env:EDUPRO_DPAPI_SOURCE -Destination $env:EDUPRO_DPAPI_DESTINATION`;
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      windowsHide: true, stdio: 'ignore', timeout: 30_000,
      env: { ...process.env, EDUPRO_DPAPI_ACTION: 'open', EDUPRO_DPAPI_SOURCE: source,
        EDUPRO_DPAPI_DESTINATION: destination },
    });
  } catch {
    throw new Error('STAGING_BACKUP_DECRYPT_FAILED');
  }
}

function runRestore(args: string[], env: NodeJS.ProcessEnv): void {
  const result = spawnSync('pg_restore.exe', args, { env, windowsHide: true, timeout: 60 * 60 * 1000, stdio: 'ignore' });
  if (result.error || result.status !== 0) throw new Error('STAGING_BACKUP_SCHEMA_RESTORE_FAILED');
}

export async function rehearseEncryptedStagingBackupSchemaRestore() {
  if (process.platform !== 'win32') throw new Error('STAGING_BACKUP_RESTORE_REQUIRES_WINDOWS_DPAPI');
  if (!fs.existsSync(envPath)) throw new Error('LOCAL_STAGING_ENV_FILE_MISSING');
  const envStat = fs.lstatSync(envPath);
  if (!envStat.isFile() || envStat.isSymbolicLink()) throw new Error('LOCAL_STAGING_ENV_FILE_INVALID');
  const values = dotenv.parse(fs.readFileSync(envPath));
  validateStagingEnvironmentValues(values);
  resolveStagingBackupTarget(values);
  if (extractPostgresProjectRef(values.PLATFORM_ADMIN_DATABASE_URL || '') !== projectRef) {
    throw new Error('STAGING_BACKUP_RESTORE_PROJECT_REJECTED');
  }

  const vault = defaultStagingVaultDirectory();
  const backupDirectory = path.join(vault, 'backups');
  if (!fs.existsSync(vault) || !fs.lstatSync(vault).isDirectory() || fs.lstatSync(vault).isSymbolicLink()) {
    throw new Error('STAGING_VAULT_DIRECTORY_INVALID');
  }
  if (!fs.existsSync(backupDirectory) || fs.lstatSync(backupDirectory).isSymbolicLink()) {
    throw new Error('STAGING_BACKUP_DIRECTORY_INVALID');
  }
  restrictFilePermissions(vault);
  restrictFilePermissions(backupDirectory);
  const caPath = path.join(vault, 'prod-ca-2021.crt');
  if (!fs.existsSync(caPath) || !new X509Certificate(fs.readFileSync(caPath, 'utf8')).ca) {
    throw new Error('STAGING_CA_CERTIFICATE_INVALID');
  }
  const candidates = fs.readdirSync(backupDirectory).filter((name) => /^staging-public-[0-9TZ]+-[a-f0-9-]{36}\.dump\.dpapi$/.test(name))
    .map((name) => path.join(backupDirectory, name))
    .filter((candidate) => fs.lstatSync(candidate).isFile() && !fs.lstatSync(candidate).isSymbolicLink())
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  const encryptedArchive = candidates[0];
  if (!encryptedArchive) throw new Error('STAGING_ENCRYPTED_BACKUP_MISSING');

  const nonce = randomUUID();
  const stamp = new Date().toISOString().replaceAll(/[-:]/g, '').replace('.', '');
  const databaseName = `edupro_stg_rehearsal_${stamp.slice(0, 8)}_${nonce.replaceAll('-', '').slice(0, 8)}`;
  const archivePath = path.join(backupDirectory, `.restore-schema-${nonce}.dump`);
  const manifestPath = path.join(vault, 'schema-rehearsals', `${databaseName}.json`);
  const localPool = new Pool({ connectionString: `postgresql://postgres@${localHost}:${localPort}/postgres`,
    max: 1, connectionTimeoutMillis: 5_000, statement_timeout: 15_000,
    application_name: 'edupro-staging-backup-restore-rehearsal' });
  let created = false;
  let remoteBaseline: Awaited<ReturnType<typeof inspectRemoteMigrationBaseline>> | null = null;
  const cleanupDatabase = async () => {
    if (!created) return;
    const cleanup = new Pool({ connectionString: `postgresql://postgres@${localHost}:${localPort}/postgres`,
      max: 1, connectionTimeoutMillis: 5_000, application_name: 'edupro-staging-local-rehearsal-cleanup' });
    try {
      await cleanup.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid <> pg_backend_pid()', [databaseName]);
      await cleanup.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      created = false;
    } catch { /* Keep the primary restore diagnostic. */ }
    finally { await cleanup.end(); }
  };
  try {
    runDpapiOpen(encryptedArchive, archivePath);
    restrictFilePermissions(archivePath);
    const list = spawnSync('pg_restore.exe', ['--list', archivePath], {
      env: { ...process.env, PGAPPNAME: 'edupro-staging-backup-restore-archive-check' },
      windowsHide: true, timeout: 60_000, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
    const archiveList = list.stdout || '';
    const archivePublicTables = [...archiveList.matchAll(/^\d+;\s+\d+\s+\d+\s+TABLE\s+public\s+/gm)].length;
    if (list.error || list.status !== 0 || ![56, 114].includes(archivePublicTables)) {
      throw new Error('STAGING_BACKUP_ARCHIVE_INVALID');
    }
    remoteBaseline = await inspectRemoteMigrationBaseline(values.PLATFORM_ADMIN_DATABASE_URL || '',
      fs.readFileSync(caPath, 'utf8'));
    if (archivePublicTables !== remoteBaseline.tableCount) throw new Error('STAGING_BACKUP_ARCHIVE_NOT_CURRENT');

    const identity = await localPool.query(`SELECT current_database() AS database, current_user AS role,
      (inet_server_addr() <<= inet '127.0.0.0/8') AS loopback, inet_server_port() AS port,
      EXISTS (SELECT 1 FROM pg_database WHERE datname=$1) AS database_exists`, [databaseName]);
    const local = identity.rows[0];
    if (local.database !== 'postgres' || local.role !== 'postgres' || local.loopback !== true
      || Number(local.port) !== localPort || local.database_exists) {
      throw new Error('LOCAL_SCHEMA_REHEARSAL_DATABASE_TARGET_REJECTED');
    }
    const requiredRoles = await localPool.query(`SELECT role_name,
      EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) AS exists
      FROM unnest(ARRAY['anon','authenticated','edupro_app','edupro_staging_app','service_role']) AS role_name`);
    if (requiredRoles.rows.some((row) => !row.exists)) throw new Error('LOCAL_SCHEMA_REHEARSAL_ROLES_MISSING');
    await localPool.query(`CREATE DATABASE "${databaseName}"`);
    created = true;
  } catch (error) {
    await cleanupDatabase();
    throw error;
  } finally {
    await localPool.end();
  }
  if (!remoteBaseline) throw new Error('STAGING_BACKUP_BASELINE_UNAVAILABLE');

  const localDatabase = `postgresql://postgres@${localHost}:${localPort}/${databaseName}`;
  try {
    const preparePool = new Pool({ connectionString: localDatabase, max: 1, connectionTimeoutMillis: 5_000,
      statement_timeout: 30_000, application_name: 'edupro-staging-backup-schema-only-restore' });
    try {
      await preparePool.query('CREATE SCHEMA auth');
      await preparePool.query('CREATE TABLE auth.users (id uuid PRIMARY KEY)');
      await preparePool.query(`CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$`);
      await preparePool.query(`CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$`);
      await preparePool.query('CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public');
    } finally {
      await preparePool.end();
    }

    runRestore(['--no-password', '--host', localHost, '--port', String(localPort), '--username', 'postgres',
      '--dbname', databaseName, '--no-owner', '--no-acl', '--exit-on-error', '--schema-only', '--schema=public', archivePath],
    { ...process.env, PGAPPNAME: 'edupro-staging-backup-schema-only-restore' });

    const verifyPool = new Pool({ connectionString: localDatabase, max: 1, connectionTimeoutMillis: 5_000,
      application_name: 'edupro-staging-backup-schema-only-verify' });
    let tableCount: number;
    let copiedRows = 0;
    try {
      const tables = await verifyPool.query(`SELECT c.relname AS name FROM pg_class c
        JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind IN ('r','p') ORDER BY c.relname`);
      tableCount = tables.rows.length;
      for (const row of tables.rows) {
        const result = await verifyPool.query(`SELECT count(*)::int AS count FROM public.${pg.escapeIdentifier(String(row.name))}`);
        copiedRows += Number(result.rows[0]?.count || 0);
      }
    } finally {
      await verifyPool.end();
    }
    if (tableCount !== remoteBaseline.tableCount || copiedRows !== 0) throw new Error('LOCAL_SCHEMA_REHEARSAL_VERIFICATION_FAILED');

    const rehearsalDirectory = path.dirname(manifestPath);
    fs.mkdirSync(rehearsalDirectory, { recursive: true });
    if (fs.lstatSync(rehearsalDirectory).isSymbolicLink()) throw new Error('STAGING_SCHEMA_REHEARSAL_DIRECTORY_SYMLINK_REFUSED');
    restrictFilePermissions(rehearsalDirectory);
    fs.writeFileSync(manifestPath, JSON.stringify({
      createdAt: new Date().toISOString(), projectRef, databaseName,
      localEndpoint: `${localHost}:${localPort}`, publicTables: tableCount!, copiedRows: 0,
      baselineAppliedMigrations: remoteBaseline.baseline,
      archiveType: 'PostgreSQL custom-format schema-only; excludes table data, ACLs, and ownership',
      restoreSource: 'DPAPI-encrypted Staging public-schema backup; restored with pg_restore --schema-only',
      encryptedBackupFile: path.basename(encryptedArchive),
      archivePath: '[deleted after restore rehearsal]',
    }, null, 2), { flag: 'wx', mode: 0o600 });
    restrictFilePermissions(manifestPath);
    return { databaseName, tableCount: tableCount!, copiedRows, manifestPath,
      encryptedBackupFile: path.basename(encryptedArchive) };
  } catch (error) {
    await cleanupDatabase();
    throw error;
  } finally {
    fs.rmSync(archivePath, { force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  rehearseEncryptedStagingBackupSchemaRestore().then((result) => {
    console.info(`Encrypted Staging backup schema restore passed: ${result.tableCount} public tables, ${result.copiedRows} copied rows.`);
    console.info(`Isolated local rehearsal database: ${result.databaseName}`);
    console.info(`Manifest: ${result.manifestPath}`);
    console.info('The encrypted source is retained; its temporary plaintext archive and all row data were excluded from the local restore.');
  }).catch((error) => {
    const message = error instanceof Error ? error.message : '';
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    console.error(/^(?:STAGING|LOCAL_SCHEMA_REHEARSAL)_[A-Z_]+$/.test(message)
      ? message : /^[0-9A-Z]{5}$/.test(code) ? `STAGING_BACKUP_RESTORE_REHEARSAL_FAILED:${code}`
        : 'STAGING_BACKUP_RESTORE_REHEARSAL_FAILED');
    process.exitCode = 1;
  });
}
