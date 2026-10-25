import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { defaultStagingVaultDirectory } from './staging-secret-store.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDirectory = path.join(root, 'supabase', 'migrations');
const excludedUnapprovedDraft = '202608111200_attend_schema_001.sql';
const finalAclHardeningMigration = '202610251400_staging_table_privilege_hardening.sql';
const localHost = '127.0.0.1';
const localPort = 63991;
export const stagingSchemaMigrationFiles = [
  '202608171200_identity_login_username.sql',
  '202608171300_p0_live_scope_rls.sql',
  '202608191205_platform_rbac_canonical.sql',
  '202608191210_platform_rbac_rls.sql',
  '202608201000_student_finance_module.sql',
  '202608241000_canonical_erp_financial_integration.sql',
  '202608241200_erp_financial_append_only_audit.sql',
  '202608251200_exams_database.sql',
  '202608251700_exams_result_archives.sql',
  '202608271500_hr_canonical_records.sql',
  '202608291500_inventory_procurement_database.sql',
  '202608301000_school_logistics_canonical.sql',
  '202608301100_rbac_scope_rls.sql',
  '202608301200_hr_force_rls.sql',
  '202608301300_strict_school_identity_scope.sql',
  '202608301400_central_school_profile.sql',
  '202608311100_central_domain_uniqueness.sql',
  '202608311400_restricted_app_role.sql',
  '202608311500_student_document_private_storage.sql',
  '202608311600_canonical_student_graduation.sql',
  '202608311700_production_closure_immutability.sql',
  '202609031000_library_canonical.sql',
  '202609031200_fixed_assets_canonical.sql',
  '202609031300_uniform_inventory_sales.sql',
  '202609051100_owner_workspace_releases.sql',
  '202609061000_central_incident_command.sql',
  '202609071000_central_student_affairs_structure.sql',
  '202609071100_guardian_family_profile_fields.sql',
  '202609071200_student_additional_information.sql',
  '202609071700_customer_academic_foundation.sql',
  '202609081000_student_affairs_canonical_alignment.sql',
  '202609081500_canonical_student_fee_operations.sql',
  '202609091100_identity_profile_fields.sql',
  '202609091200_identity_session_revocation.sql',
  '202609091300_identity_password_policy.sql',
  '202609091400_school_identity_directory.sql',
  '202609091500_school_user_permission_grants.sql',
  '202609101000_optional_school_user_email.sql',
  '202609101200_identity_job_reference.sql',
  '202609121000_user_permission_allow_deny.sql',
  '202609121230_school_managed_permission_grants.sql',
  '202609141000_fix_app_role_scope_resolution.sql',
  '202609141100_harden_audit_actor_policy.sql',
  '202609141200_harden_student_fee_audit_actor_policy.sql',
  '202609141200_installment_lifecycle_and_overdue.sql',
  '202609191200_financial_account_groups_cost_centers.sql',
  '202609201800_erp_journal_source_payload.sql',
  '202609211700_hr_advance_repayment_schedule.sql',
  '202609211900_hr_employee_settlements.sql',
  '202609212000_hr_bank_disbursements.sql',
  '202609221000_seed_canonical_school_roles.sql',
  '202609231000_identity_employee_reference.sql',
  '202609231000_identity_access_governance.sql',
  '202609231100_identity_access_governance_hardening.sql',
  '202609231200_identity_review_sod.sql',
  '202609231300_identity_institutional_foundation.sql',
  '202610131000_student_fee_receipt_reversal_audit.sql',
  '202610161000_guardian_mother_occupation.sql',
  '202610171100_student_enrollment_certificates.sql',
  '202610231100_financial_document_serial_numbers.sql',
  '202610241100_financial_voucher_serial_numbers.sql',
];
export const stagingPrerequisiteFiles = [
  '202610251200_staging_rls_helper_prerequisites.sql',
];
export const stagingAccessReconciliationFiles = [
  '202610251210_staging_app_role_grants.sql',
  '202608311200_strict_school_isolation.sql',
  '202608311300_scope_policy_role_hardening.sql',
  '202610251300_staging_access_reconciliation.sql',
  '202610251400_staging_table_privilege_hardening.sql',
];
export const completeStagingSchemaMigrationFiles = [
  ...stagingPrerequisiteFiles,
  ...stagingSchemaMigrationFiles,
  ...stagingAccessReconciliationFiles,
];
const { Pool } = pg;

function runMigration(databaseName: string, migrationPath: string): string {
  const result = spawnSync('psql.exe', [
    '--no-password', '--no-psqlrc', '--quiet', '--host', localHost, '--port', String(localPort),
    '--username', 'postgres', '--dbname', databaseName, '--set', 'ON_ERROR_STOP=1', '--file', migrationPath,
  ], { encoding: 'utf8', windowsHide: true, timeout: 120_000 });
  if (result.error || result.status !== 0) {
    const diagnostic = String(result.stderr || result.error?.message || '').split(/\r?\n/)
      .find((line) => /error:/i.test(line))?.replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]')
      .replace(/[\r\n]/g, ' ').slice(0, 240);
    throw new Error(`MIGRATION_REHEARSAL_FAILED:${path.basename(migrationPath)}${diagnostic ? `:${diagnostic}` : ''}`);
  }
  return result.stdout || '';
}

async function verifyLocalDatabase(pool: pg.Pool, databaseName: string, requireEmpty: boolean): Promise<number> {
  const identity = await pool.query(`SELECT current_database() AS database, current_user AS role,
      (inet_server_addr() <<= inet '127.0.0.0/8') AS loopback, inet_server_port() AS port`);
  const actual = identity.rows[0];
  if (actual.database !== databaseName || actual.role !== 'postgres' || actual.loopback !== true
    || Number(actual.port) !== localPort) throw new Error('LOCAL_SCHEMA_REHEARSAL_DATABASE_TARGET_REJECTED');
  const tables = await pool.query(`SELECT c.relname AS name FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p') ORDER BY c.relname`);
  if (requireEmpty) {
    let rowCount = 0;
    for (const row of tables.rows) {
      const result = await pool.query(`SELECT count(*)::int AS count FROM public.${pg.escapeIdentifier(String(row.name))}`);
      rowCount += Number(result.rows[0].count);
    }
    if (rowCount !== 0) throw new Error('SCHEMA_REHEARSAL_DATABASE_CONTAINS_ROWS');
  }
  return tables.rows.length;
}

export async function replayRepositoryMigrationsOnSchemaRehearsal(databaseName: string) {
  if (!/^edupro_stg_rehearsal_[0-9]{8}_[a-f0-9]{8}$/.test(databaseName)) {
    throw new Error('LOCAL_SCHEMA_REHEARSAL_DATABASE_NAME_REJECTED');
  }
  const rehearsalDirectory = path.join(defaultStagingVaultDirectory(), 'schema-rehearsals');
  const manifestPath = path.join(rehearsalDirectory, `${databaseName}.json`);
  if (!fs.existsSync(manifestPath)) throw new Error('LOCAL_SCHEMA_REHEARSAL_MANIFEST_MISSING');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
  if (manifest.projectRef !== 'vjcjscqgmijgzagshsca' || manifest.databaseName !== databaseName
    || manifest.localEndpoint !== `${localHost}:${localPort}`
    || manifest.archiveType !== 'PostgreSQL custom-format schema-only; excludes table data, ACLs, and ownership'
    || ![56, 114].includes(Number(manifest.publicTables))
    || !Array.isArray(manifest.baselineAppliedMigrations)) throw new Error('LOCAL_SCHEMA_REHEARSAL_MANIFEST_REJECTED');

  const baseline = manifest.baselineAppliedMigrations as Array<{ filename?: unknown; sha256?: unknown }>;
  const expectedBaseline = completeStagingSchemaMigrationFiles.slice(0, baseline.length);
  if (baseline.length > completeStagingSchemaMigrationFiles.length
    || baseline.some((entry, index) => {
      const filename = expectedBaseline[index];
      if (!filename || entry.filename !== filename) return true;
      const source = fs.readFileSync(path.join(migrationsDirectory, filename), 'utf8');
      return entry.sha256 !== crypto.createHash('sha256').update(source, 'utf8').digest('hex');
    })
    || (Number(manifest.publicTables) === 56 && baseline.length !== 0)
    || (Number(manifest.publicTables) === 114 && baseline.length === 0)) {
    throw new Error('LOCAL_SCHEMA_REHEARSAL_BASELINE_MISMATCH');
  }
  const pendingMigrations = new Set(completeStagingSchemaMigrationFiles.slice(baseline.length));
  const rehearsalMigrations = new Set(pendingMigrations);
  // Re-run the final idempotent ACL hardening on every rehearsal after seeding
  // the hosted default-grant shape, even when the backup already includes it.
  rehearsalMigrations.add(finalAclHardeningMigration);

  const pool = new Pool({ connectionString: `postgresql://postgres@${localHost}:${localPort}/${databaseName}`,
    max: 1, connectionTimeoutMillis: 5_000, statement_timeout: 30_000,
    application_name: 'edupro-local-staging-migration-rehearsal' });
  const applied: string[] = [];
  try {
    const tableCount = await verifyLocalDatabase(pool, databaseName, true);
    if (tableCount !== Number(manifest.publicTables)) throw new Error('LOCAL_SCHEMA_REHEARSAL_TABLE_COUNT_MISMATCH');
    if (fs.existsSync(path.join(migrationsDirectory, excludedUnapprovedDraft)) === false
      || completeStagingSchemaMigrationFiles.some((name) => !fs.existsSync(path.join(migrationsDirectory, name)))) {
      throw new Error('REPOSITORY_MIGRATION_INVENTORY_CHANGED');
    }

    const updateManifest = (status: string, extra: Record<string, unknown> = {}) => {
      const next = { ...manifest, replayStatus: status,
        migrationsApplied: completeStagingSchemaMigrationFiles.filter((filename) =>
          baseline.some((entry) => entry.filename === filename) || applied.includes(filename)),
        replayedMigrations: [...applied], updatedAt: new Date().toISOString(), ...extra };
      fs.writeFileSync(manifestPath, JSON.stringify(next, null, 2), { flag: 'w', mode: 0o600 });
    };
    updateManifest('running', { excludedUnapprovedDraft, targetedMigrationSet: [...stagingSchemaMigrationFiles] });
    // pg_dump intentionally excludes ACLs. Seed the hosted API-role grant shape
    // locally so the final hardening migration proves it removes non-RLS DDL
    // powers while preserving the scoped CRUD privileges used by the app.
    await pool.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated, edupro_app, edupro_staging_app');
    await pool.query('ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email text');
    await pool.query('CREATE SCHEMA IF NOT EXISTS storage');
    await pool.query(`CREATE TABLE IF NOT EXISTS storage.buckets (
      id text PRIMARY KEY, name text NOT NULL, public boolean NOT NULL DEFAULT false,
      file_size_limit bigint, allowed_mime_types text[]
    )`);
    for (const name of stagingPrerequisiteFiles.filter((candidate) => rehearsalMigrations.has(candidate))) {
      try {
        runMigration(databaseName, path.join(migrationsDirectory, name));
        applied.push(name);
        updateManifest('running');
      } catch (error) {
        updateManifest('failed', { failedMigration: name,
          failure: error instanceof Error ? error.message : 'MIGRATION_REHEARSAL_FAILED' });
        throw error;
      }
    }
    for (const name of stagingSchemaMigrationFiles.filter((candidate) => rehearsalMigrations.has(candidate))) {
      try {
        runMigration(databaseName, path.join(migrationsDirectory, name));
        applied.push(name);
        updateManifest('running');
      } catch (error) {
        updateManifest('failed', { failedMigration: name,
          failure: error instanceof Error ? error.message : 'MIGRATION_REHEARSAL_FAILED' });
        throw error;
      }
    }
    for (const name of stagingAccessReconciliationFiles.filter((candidate) => rehearsalMigrations.has(candidate))) {
      try {
        runMigration(databaseName, path.join(migrationsDirectory, name));
        applied.push(name);
        updateManifest('running');
      } catch (error) {
        updateManifest('failed', { failedMigration: name,
          failure: error instanceof Error ? error.message : 'MIGRATION_REHEARSAL_FAILED' });
        throw error;
      }
    }
    const finalTableCount = await verifyLocalDatabase(pool, databaseName, false);
    const unsafePrivileges = await pool.query(`SELECT count(*)::int AS count
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      CROSS JOIN (VALUES ('anon'),('authenticated'),('edupro_app'),('edupro_staging_app')) r(role_name)
      CROSS JOIN (VALUES ('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege_type)
      WHERE n.nspname='public' AND c.relkind IN ('r','p')
        AND has_table_privilege(r.role_name,c.oid,p.privilege_type)`);
    if (Number(unsafePrivileges.rows[0]?.count) !== 0) throw new Error('LOCAL_SCHEMA_REHEARSAL_UNSAFE_TABLE_PRIVILEGES');
    const probeName = `staging_acl_probe_${crypto.randomUUID().replaceAll('-', '')}`;
    await pool.query('BEGIN');
    try {
      await pool.query(`CREATE TABLE public.${pg.escapeIdentifier(probeName)} (id integer PRIMARY KEY)`);
      const probeUnsafe = await pool.query(`SELECT
        (SELECT count(*)::int FROM (VALUES ('anon'),('authenticated'),('edupro_app'),('edupro_staging_app')) r(role_name)
          CROSS JOIN (VALUES ('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege_type)
          WHERE has_table_privilege(r.role_name,$1::regclass,p.privilege_type)) AS role_privileges,
        (SELECT count(*)::int FROM pg_class c
          CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) acl
          WHERE c.oid=$1::regclass AND acl.grantee=0
            AND acl.privilege_type IN ('TRUNCATE','REFERENCES','TRIGGER')) AS public_privileges`,
      [`public.${probeName}`]);
      if (Number(probeUnsafe.rows[0]?.role_privileges) !== 0 || Number(probeUnsafe.rows[0]?.public_privileges) !== 0) {
        throw new Error('LOCAL_SCHEMA_REHEARSAL_DEFAULT_ACL_NOT_HARDENED');
      }
      await pool.query(`DROP TABLE public.${pg.escapeIdentifier(probeName)}`);
      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK').catch(() => undefined);
      throw error;
    }
    updateManifest('passed', { publicTablesAfterReplay: finalTableCount, seedDataMayExist: true,
      unsafeApiTablePrivilegeCount: Number(unsafePrivileges.rows[0]?.count) });
    return { databaseName, appliedCount: pendingMigrations.size, replayedCount: applied.length,
      totalMigrationCount: completeStagingSchemaMigrationFiles.length, excludedUnapprovedDraft,
      publicTablesAfterReplay: finalTableCount, manifestPath };
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const databaseName = process.argv[2] || '';
  replayRepositoryMigrationsOnSchemaRehearsal(databaseName).then((result) => {
    console.info(`Migration rehearsal passed on local schema clone ${result.databaseName}: ${result.appliedCount} pending of ${result.totalMigrationCount} migrations (${result.replayedCount} replayed including ACL verification), ${result.publicTablesAfterReplay} public tables.`);
    console.info(`Excluded only the explicitly unapproved draft ${result.excludedUnapprovedDraft}. Staging was not modified.`);
    console.info(`Manifest: ${result.manifestPath}`);
  }).catch((error) => {
    const message = error instanceof Error ? error.message : '';
    console.error(/^LOCAL_SCHEMA_REHEARSAL_[A-Z_]+$|^REPOSITORY_MIGRATION_INVENTORY_CHANGED$|^SCHEMA_REHEARSAL_DATABASE_CONTAINS_ROWS$|^MIGRATION_REHEARSAL_FAILED:/.test(message)
      ? message : 'STAGING_SCHEMA_MIGRATION_REHEARSAL_FAILED');
    process.exitCode = 1;
  });
}
