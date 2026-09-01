import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';

/**
 * Rebuild the deliberately empty, dedicated production database from the
 * reviewed SQL migration history. This command is intentionally guarded:
 * it is only valid for the named production project, and refuses a target
 * that contains any tenant, school, user, auth, or storage data.
 *
 * Do not point this at staging or a live tenant database. It removes the
 * existing public schema inside one transaction before applying the schema.
 */
const EXPECTED_PRODUCTION_PROJECT_REF = 'bwdjnjbexklsrwqbwzmk';
const REQUIRED_CONFIRMATION = 'REBUILD_EMPTY_PRODUCTION_SCHEMA';

const MIGRATIONS = [
  '202608051200_core_foundation.sql',
  '202608051300_identity_platform.sql',
  '202608051400_governance_platform.sql',
  '202608051500_student_platform_foundation.sql',
  '202608051600_guardian_platform.sql',
  '202608051700_enrollment_engine.sql',
  '202608061000_academic_status_engine.sql',
  '202608061100_student_documents_platform.sql',
  '202608081700_db_sec_003_rls.sql',
  '202608111000_enroll_schema_align_001.sql',
  // 202608111200_attend_schema_001.sql remains excluded because its own
  // header explicitly marks it as an unapproved schema-preparation draft.
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
  '202608291000_hr_payroll_runs_snapshot.sql',
  '202608291500_inventory_procurement_database.sql',
  '202608301000_school_logistics_canonical.sql',
  '202608301100_rbac_scope_rls.sql',
  '202608301200_hr_force_rls.sql',
  '202608301300_strict_school_identity_scope.sql',
  '202608301400_central_school_profile.sql',
  '202608311000_tenant_lifecycle_guard.sql',
  '202608311100_central_domain_uniqueness.sql',
  '202608311200_strict_school_isolation.sql',
  '202608311300_scope_policy_role_hardening.sql',
  '202608311400_restricted_app_role.sql',
  '202608311500_student_document_private_storage.sql',
  '202608311600_canonical_student_graduation.sql',
  '202608311700_production_closure_immutability.sql',
  '202609011000_platform_rbac_catalog_seed.sql',
] as const;

function requireExact(value: string | undefined, code: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function removeTopLevelTransactionControls(sql: string): string {
  // Several historical migrations wrap themselves in BEGIN/COMMIT. The
  // rebuild owns one outer transaction, so those top-level statements must
  // not terminate it midway through a clean schema deployment.
  return sql.replace(
    /^\s*(?:BEGIN(?:\s+(?:WORK|TRANSACTION))?|COMMIT(?:\s+(?:WORK|TRANSACTION))?|ROLLBACK(?:\s+(?:WORK|TRANSACTION))?)\s*;\s*$/gim,
    '',
  );
}

async function main() {
  const connectionString = requireExact(process.env.PRODUCTION_PLATFORM_ADMIN_DATABASE_URL, 'PRODUCTION_DATABASE_URL_REQUIRED');
  const confirmation = requireExact(process.env.PRODUCTION_SCHEMA_REBUILD_CONFIRMATION, 'PRODUCTION_SCHEMA_REBUILD_CONFIRMATION_REQUIRED');

  if (confirmation !== REQUIRED_CONFIRMATION) throw new Error('PRODUCTION_SCHEMA_REBUILD_CONFIRMATION_INVALID');
  if (!connectionString.includes(EXPECTED_PRODUCTION_PROJECT_REF)) throw new Error('TARGET_PROJECT_REF_MISMATCH');

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 12_000,
    ssl: connectionString.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    try {
      const dataCheck = await client.query<{
        public_tables: string;
        tenant_rows: string;
        school_rows: string;
        branch_rows: string;
        user_rows: string;
        auth_rows: string;
        storage_buckets: string;
      }>(`
        SELECT
          (SELECT COUNT(*)::text FROM pg_tables WHERE schemaname = 'public') AS public_tables,
          (SELECT COUNT(*)::text FROM public.tenants) AS tenant_rows,
          (SELECT COUNT(*)::text FROM public.schools) AS school_rows,
          (SELECT COUNT(*)::text FROM public.branches) AS branch_rows,
          (SELECT COUNT(*)::text FROM public.users) AS user_rows,
          (SELECT COUNT(*)::text FROM auth.users) AS auth_rows,
          (SELECT COUNT(*)::text FROM storage.buckets) AS storage_buckets
      `);
      const initial = dataCheck.rows[0];
      if (!initial || [initial.tenant_rows, initial.school_rows, initial.branch_rows, initial.user_rows, initial.auth_rows, initial.storage_buckets]
        .some((value) => Number(value) !== 0)) {
        throw new Error('TARGET_IS_NOT_EMPTY_REFUSING_SCHEMA_REBUILD');
      }

      const sqlByMigration = await Promise.all(MIGRATIONS.map(async (name) => ({
        name,
        sql: removeTopLevelTransactionControls(await readFile(resolve(process.cwd(), 'supabase', 'migrations', name), 'utf8')),
      })));

      await client.query('BEGIN');
      try {
        // The empty legacy schema is intentionally removed as a single
        // transactional operation. A migration failure rolls everything back.
        await client.query('DROP SCHEMA public CASCADE');
        await client.query('CREATE SCHEMA public AUTHORIZATION postgres');
        await client.query('GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role');

        for (const migration of sqlByMigration) {
          await client.query(migration.sql);
        }

        const verification = await client.query<{
          public_tables: string;
          missing_required: string;
          rls_gaps: string;
          forced_rls_gaps: string;
          bucket_count: string;
          restricted_role_exists: boolean;
          restricted_role_bypass: boolean;
          restricted_role_superuser: boolean;
        }>(`
          WITH required(name) AS (
            VALUES
              ('tenants'), ('schools'), ('branches'), ('users'), ('platform_users'),
              ('students'), ('enrollments'), ('student_document_storage_objects'),
              ('student_graduation_records')
          ), scoped AS (
            SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
              FROM pg_class c
              JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
               AND EXISTS (
                 SELECT 1 FROM pg_attribute a
                  WHERE a.attrelid = c.oid AND a.attname = 'tenant_id'
                    AND a.attnum > 0 AND NOT a.attisdropped
               )
               AND EXISTS (
                 SELECT 1 FROM pg_attribute a
                  WHERE a.attrelid = c.oid AND a.attname = 'school_id'
                    AND a.attnum > 0 AND NOT a.attisdropped
               )
          )
          SELECT
            (SELECT COUNT(*)::text FROM pg_tables WHERE schemaname = 'public') AS public_tables,
            (SELECT COUNT(*)::text FROM required r
              WHERE to_regclass(format('public.%I', r.name)) IS NULL) AS missing_required,
            (SELECT COUNT(*)::text FROM scoped WHERE NOT relrowsecurity) AS rls_gaps,
            (SELECT COUNT(*)::text FROM scoped WHERE NOT relforcerowsecurity) AS forced_rls_gaps,
            (SELECT COUNT(*)::text FROM storage.buckets WHERE id = 'student-documents-private' AND public = false) AS bucket_count,
            COALESCE((SELECT true FROM pg_roles WHERE rolname = 'edupro_app'), false) AS restricted_role_exists,
            COALESCE((SELECT rolbypassrls FROM pg_roles WHERE rolname = 'edupro_app'), true) AS restricted_role_bypass,
            COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname = 'edupro_app'), true) AS restricted_role_superuser
        `);
        const result = verification.rows[0];
        const checksPassed = Boolean(result)
          && Number(result.missing_required) === 0
          && Number(result.rls_gaps) === 0
          && Number(result.forced_rls_gaps) === 0
          && Number(result.bucket_count) === 1
          && result.restricted_role_exists
          && !result.restricted_role_bypass
          && !result.restricted_role_superuser;
        if (!checksPassed) throw new Error('PRODUCTION_SCHEMA_POSTURE_VERIFICATION_FAILED');

        await client.query('COMMIT');
        console.log(JSON.stringify({
          success: true,
          projectRef: EXPECTED_PRODUCTION_PROJECT_REF,
          rebuiltLegacyPublicTables: Number(initial.public_tables),
          appliedMigrations: MIGRATIONS.length,
          publicTables: Number(result.public_tables),
          schoolScopedRls: 'forced',
          privateStudentDocumentsBucket: true,
          restrictedApplicationRole: true,
        }));
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
