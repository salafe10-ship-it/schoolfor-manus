import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { X509Certificate } from 'node:crypto';
import { extractPostgresProjectRef } from '../server/security/SupabaseDatabaseTargetAlignment.js';
import { resolveStagingBackupTarget } from './staging-backup.js';
import { defaultStagingVaultDirectory } from './staging-secret-store.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.staging');
const projectRef = 'vjcjscqgmijgzagshsca';
const { Pool } = pg;

async function hasTable(client: pg.PoolClient, name: string): Promise<boolean> {
  const result = await client.query('SELECT to_regclass($1) IS NOT NULL AS found', [`public.${name}`]);
  return Boolean(result.rows[0]?.found);
}

async function hasQualifiedTable(client: pg.PoolClient, schema: string, name: string): Promise<boolean> {
  const result = await client.query('SELECT to_regclass($1) IS NOT NULL AS found', [`${schema}.${name}`]);
  return Boolean(result.rows[0]?.found);
}

async function hasColumn(client: pg.PoolClient, table: string, column: string): Promise<boolean> {
  const result = await client.query(`SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=$1 AND column_name=$2
  ) AS found`, [table, column]);
  return Boolean(result.rows[0]?.found);
}

async function count(client: pg.PoolClient, sql: string): Promise<number> {
  const result = await client.query(sql);
  return Number(result.rows[0]?.count || 0);
}

async function countedTable(client: pg.PoolClient, table: string, sql: string): Promise<number | null> {
  return await hasTable(client, table) ? count(client, sql) : null;
}

export async function inspectStagingMigrationDataImpact(client: pg.PoolClient) {
  const securityHelperFunctions = (await client.query(`SELECT proc.proname AS name,
      pg_get_function_identity_arguments(proc.oid) AS arguments
    FROM pg_proc proc JOIN pg_namespace n ON n.oid=proc.pronamespace
    WHERE n.nspname='public' AND proc.proname = ANY(ARRAY[
      'dbsec003_is_super_admin','dbsec003_set_request_context',
      'dbsec004_current_tenant_id','dbsec004_current_school_id','dbsec004_current_branch_id',
      'dbsec004_resolve_login_username'
    ]) ORDER BY proc.proname`)).rows;
  const roleProfiles = (await client.query(`SELECT rolname, rolsuper, rolbypassrls, rolinherit, rolcanlogin,
      rolcreaterole, rolcreatedb, rolreplication, rolconnlimit
    FROM pg_roles WHERE rolname = ANY(ARRAY['postgres','anon','authenticated','edupro_app','edupro_staging_app'])
    ORDER BY rolname`)).rows;
  const tableOwnerSummary = (await client.query(`SELECT pg_get_userbyid(c.relowner) AS owner,
      count(*)::int AS tables
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p')
    GROUP BY c.relowner ORDER BY owner`)).rows;
  const migrationRegistryExists = Boolean((await client.query(
    `SELECT to_regclass('supabase_migrations.schema_migrations') IS NOT NULL AS found`)).rows[0]?.found);
  const migrationRegistryColumns = migrationRegistryExists
    ? (await client.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns
        WHERE table_schema='supabase_migrations' AND table_name='schema_migrations'
        ORDER BY ordinal_position`)).rows
    : [];
  const migrationRegistryRows = migrationRegistryExists
    ? await count(client, 'SELECT count(*)::int AS count FROM supabase_migrations.schema_migrations')
    : null;
  const studentStorageTableExists = await hasTable(client, 'student_document_storage_objects');
  const storageBucketsExists = await hasQualifiedTable(client, 'storage', 'buckets');
  const storageObjectsExists = await hasQualifiedTable(client, 'storage', 'objects');
  const privateBucket = storageBucketsExists
    ? await client.query(`SELECT count(*) FILTER (WHERE id='student-documents-private')::int AS matches,
        count(*) FILTER (WHERE name='student-documents-private' AND id<>'student-documents-private')::int AS name_conflicts,
        COALESCE(bool_and(public = false) FILTER (WHERE id='student-documents-private'), true) AS already_private,
        COALESCE(bool_and(name = 'student-documents-private') FILTER (WHERE id='student-documents-private'), true) AS name_matches,
        COALESCE(bool_and(file_size_limit = 10485760) FILTER (WHERE id='student-documents-private'), true) AS size_limit_matches,
        COALESCE(bool_and(allowed_mime_types = ARRAY['application/pdf','image/png','image/jpeg']::text[])
          FILTER (WHERE id='student-documents-private'), true) AS mime_types_match
      FROM storage.buckets WHERE id='student-documents-private' OR name='student-documents-private'`)
    : null;
  const existingPrivateBucketObjects = storageObjectsExists
    ? await client.query(`SELECT count(*)::int AS count FROM storage.objects WHERE bucket_id='student-documents-private'`)
    : null;
  const existingStudentStorageRows = studentStorageTableExists
    ? await count(client, 'SELECT count(*)::int AS count FROM public.student_document_storage_objects')
    : null;
  const centralMetadataExists = await hasColumn(client, 'schools', 'central_metadata');
  const centralSchoolCount = await count(client, `SELECT count(*)::int AS count FROM public.schools
    WHERE school_code='CENTRAL-SCHOOL' AND deleted_at IS NULL`);
  const centralAcademicStructureRows = await count(client, `SELECT count(*)::int AS count
    FROM public.school_settings ss JOIN public.schools s ON s.id=ss.school_id
    WHERE s.school_code='CENTRAL-SCHOOL' AND s.deleted_at IS NULL
      AND ss.setting_key='academic_structure'`);
  const centralPhotoCategoryConflicts = await count(client, `SELECT count(*)::int AS count
    FROM public.student_document_categories c
    WHERE c.category_code='STUDENT_PROFILE_PHOTO'
      AND EXISTS (SELECT 1 FROM public.schools s WHERE s.tenant_id=c.tenant_id
        AND s.school_code='CENTRAL-SCHOOL' AND s.deleted_at IS NULL)`);
  const customerProvisionCandidates = centralMetadataExists
    ? await count(client, `SELECT count(*)::int AS count FROM public.schools
        WHERE status='active' AND deleted_at IS NULL AND school_code <> 'CENTRAL-SCHOOL'
          AND COALESCE(central_metadata->>'portal_profile','')='customer_production'`)
    : 0;

  const tenantCount = await count(client, `SELECT count(*)::int AS count FROM public.tenants WHERE deleted_at IS NULL`);
  const canonicalRoleSlots = await count(client, `WITH role_keys(role_key) AS (
      VALUES ('schooladmin'),('accountant'),('teacher'),('hr')
    ) SELECT (SELECT count(*) FROM public.tenants WHERE deleted_at IS NULL)
        * (SELECT count(*) FROM role_keys) AS count`);
  const existingCanonicalRoles = await count(client, `SELECT count(*)::int AS count FROM public.roles r
    JOIN public.tenants t ON t.id=r.tenant_id AND t.deleted_at IS NULL
    WHERE r.role_key IN ('schooladmin','accountant','teacher','hr')`);
  const permissionKeys = [
    'Dashboard.View','School.Branding.Write','Student.View','Student.Write','Exam.View','Exam.Write',
    'Hr.View','Hr.Edit','Financial.Read','Financial.Write','Inventory.View','Inventory.Write',
    'Identity.Users.Read','Identity.Users.Write','Identity.Users.Assign','Identity.Users.Audit',
  ];
  const existingPermissionKeys = await count(client, `SELECT count(*)::int AS count FROM public.permissions
    WHERE permission_key = ANY(ARRAY[${permissionKeys.map((key) => `'${key}'`).join(',')}]::text[])`);
  const desiredMappingsSql = `WITH desired(role_key, permission_key) AS (
      VALUES
        ('schooladmin','Dashboard.View'),('schooladmin','Student.View'),('schooladmin','Student.Write'),
        ('schooladmin','Hr.View'),('schooladmin','Hr.Edit'),('schooladmin','Financial.Read'),
        ('schooladmin','Inventory.View'),('schooladmin','Inventory.Write'),('schooladmin','Identity.Users.Read'),
        ('schooladmin','Identity.Users.Write'),('schooladmin','Identity.Users.Assign'),('schooladmin','Identity.Users.Audit'),
        ('schooladmin','School.Branding.Write'),('accountant','Dashboard.View'),('accountant','Financial.Read'),
        ('accountant','Financial.Write'),('teacher','Dashboard.View'),('teacher','Student.View'),
        ('teacher','Exam.View'),('teacher','Exam.Write'),('hr','Dashboard.View'),('hr','Hr.View'),('hr','Hr.Edit')
    ), eligible AS (
      SELECT r.id AS role_id,p.id AS permission_id FROM public.roles r
      JOIN public.tenants t ON t.id=r.tenant_id AND t.deleted_at IS NULL
      JOIN desired d ON d.role_key=r.role_key
      JOIN public.permissions p ON p.permission_key=d.permission_key
      WHERE r.school_id IS NULL AND r.branch_id IS NULL AND r.status='active' AND r.deleted_at IS NULL
        AND p.status='active' AND p.deleted_at IS NULL
    )`;
  const currentEligibleRoleMappings = await count(client, `${desiredMappingsSql}
    SELECT count(*)::int AS count FROM eligible`);
  const existingRoleMappings = await count(client, `${desiredMappingsSql}
    SELECT count(*)::int AS count FROM eligible e JOIN public.role_permissions rp
      ON rp.role_id=e.role_id AND rp.permission_id=e.permission_id`);

  const approvalRowsNeedingStatus = await countedTable(client, 'identity_access_request_approvals',
    'SELECT count(*)::int AS count FROM public.identity_access_request_approvals WHERE status IS NULL');
  const identityRequestRows = await countedTable(client, 'identity_access_requests',
    'SELECT count(*)::int AS count FROM public.identity_access_requests');
  const identityApprovalRows = await countedTable(client, 'identity_access_request_approvals',
    'SELECT count(*)::int AS count FROM public.identity_access_request_approvals');
  const userPermissionGrantRows = await countedTable(client, 'user_permission_grants',
    'SELECT count(*)::int AS count FROM public.user_permission_grants');
  const schoolRows = await count(client, 'SELECT count(*)::int AS count FROM public.schools');
  const invoiceNumbersToBackfill = await countedTable(client, 'student_fee_invoices',
    'SELECT count(*)::int AS count FROM public.student_fee_invoices WHERE invoice_number IS NULL');
  const journalNumbersToBackfill = await countedTable(client, 'erp_journal_entries',
    'SELECT count(*)::int AS count FROM public.erp_journal_entries WHERE journal_number IS NULL');
  const receiptNumberConflicts = await countedTable(client, 'student_fee_receipts',
    `SELECT count(*)::int AS count FROM (SELECT school_id,receipt_voucher_id FROM public.student_fee_receipts
      WHERE receipt_voucher_id IS NOT NULL GROUP BY school_id,receipt_voucher_id HAVING count(*) > 1) d`);
  const invoiceNumberConflicts = await countedTable(client, 'student_fee_invoices',
    `SELECT count(*)::int AS count FROM (SELECT school_id,invoice_number FROM public.student_fee_invoices
      WHERE invoice_number IS NOT NULL GROUP BY school_id,invoice_number HAVING count(*) > 1) d`);
  const journalNumberConflicts = await countedTable(client, 'erp_journal_entries',
    `SELECT count(*)::int AS count FROM (SELECT school_id,journal_number FROM public.erp_journal_entries
      WHERE journal_number IS NOT NULL GROUP BY school_id,journal_number HAVING count(*) > 1) d`);
  const transitionEstimatedRows = await hasTable(client, 'student_status_transitions')
    ? Number((await client.query(`SELECT greatest(c.reltuples, 0)::bigint AS estimate
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relname='student_status_transitions'`)).rows[0]?.estimate || 0)
    : null;
  const transitionConstraintViolations = transitionEstimatedRows === null || transitionEstimatedRows > 100_000
    ? null : await countedTable(client, 'student_status_transitions', `
    SELECT count(*)::int AS count FROM public.student_status_transitions
    WHERE ((transition_kind = 'initial' AND from_status IS NULL AND to_status = 'applicant')
      OR (transition_kind = 'ordinary' AND (
        (from_status = 'applicant' AND to_status = 'admitted')
        OR (from_status = 'admitted' AND to_status = 'active')
        OR (from_status = 'active' AND to_status = 'suspended')
        OR (from_status = 'active' AND to_status = 'withdrawn')
        OR (from_status = 'active' AND to_status = 'graduated')
        OR (from_status = 'suspended' AND to_status = 'withdrawn')
        OR (from_status = 'withdrawn' AND to_status = 'graduated')
        OR (from_status = 'graduated' AND to_status = 'archived')
      ))
      OR (transition_kind = 'correction' AND correction_reference IS NOT NULL
        AND length(btrim(correction_reference)) > 0
        AND approval_status IN ('approved', 'completed'))) IS FALSE`);
  const centralDomainDuplicates = centralMetadataExists ? await count(client, `SELECT count(*)::int AS count FROM (
    SELECT lower(COALESCE(NULLIF(btrim(central_metadata->>'domain'), ''),
      NULLIF(btrim(central_metadata->>'customDomain'), ''))) AS domain_key
    FROM public.schools WHERE deleted_at IS NULL
      AND COALESCE(NULLIF(btrim(central_metadata->>'domain'), ''), NULLIF(btrim(central_metadata->>'customDomain'), '')) IS NOT NULL
    GROUP BY 1 HAVING count(*) > 1) duplicates`) : 0;
  const centralSubdomainDuplicates = centralMetadataExists ? await count(client, `SELECT count(*)::int AS count FROM (
    SELECT lower(NULLIF(btrim(central_metadata->>'subdomain'), '')) AS subdomain_key
    FROM public.schools WHERE deleted_at IS NULL AND NULLIF(btrim(central_metadata->>'subdomain'), '') IS NOT NULL
    GROUP BY 1 HAVING count(*) > 1) duplicates`) : 0;
  const nationalIdExists = await hasColumn(client, 'students', 'national_id');
  const nationalIdDuplicates = nationalIdExists ? await count(client, `SELECT count(*)::int AS count FROM (
    SELECT school_id, national_id FROM public.students WHERE deleted_at IS NULL AND national_id IS NOT NULL
    GROUP BY school_id, national_id HAVING count(*) > 1) duplicates`) : 0;
  const usernameExists = await hasColumn(client, 'users', 'username');
  const emailExists = await hasColumn(client, 'users', 'email');
  const usernameDuplicates = usernameExists ? await count(client, `SELECT count(*)::int AS count FROM (
    SELECT lower(username) AS normalized FROM public.users WHERE deleted_at IS NULL AND username IS NOT NULL
    GROUP BY 1 HAVING count(*) > 1) duplicates`) : 0;
  const emailDuplicates = emailExists ? await count(client, `SELECT count(*)::int AS count FROM (
    SELECT lower(email) AS normalized FROM public.users WHERE deleted_at IS NULL AND email IS NOT NULL
    GROUP BY 1 HAVING count(*) > 1) duplicates`) : 0;
  let financialTablesPresent = 0;
  for (const name of [
    'student_fee_invoices','student_fee_receipts','student_fee_receipt_sequences','erp_journal_entries',
    'erp_financial_document_sequences',
  ]) {
    if (await hasTable(client, name)) financialTablesPresent += 1;
  }

  return {
    centralStudentAffairsSeed: {
      centralSchoolCount, existingAcademicStructureRows: centralAcademicStructureRows,
      photoCategoryUpserts: centralPhotoCategoryConflicts,
      note: 'academic_structure is inserted as a new settings row; the migration does not upsert it.',
    },
    customerAcademicBackfill: {
      centralMetadataColumnPresent: centralMetadataExists,
      eligibleCustomerSchoolsAfterDefaultingMissingMetadataToEmptyObject: customerProvisionCandidates,
      schoolRows,
    },
    canonicalIdentitySeeds: {
      tenants: tenantCount, expectedRoleSlots: canonicalRoleSlots,
      existingRoleRowsForCanonicalKeys: existingCanonicalRoles,
      desiredPermissionKeys: permissionKeys.length, existingPermissionKeys,
      currentEligibleRolePermissionMappings: currentEligibleRoleMappings,
      existingMappingsThatWouldBeUpserted: existingRoleMappings,
      rolePermissionMappingsExpectedAfterCanonicalRoleSeed: tenantCount * 23,
    },
    identityApprovals: {
      requests: identityRequestRows, approvals: identityApprovalRows,
      rowsNeedingStatusBackfill: approvalRowsNeedingStatus,
      userPermissionGrantRows,
    },
    financialSerialMigrations: {
      presentTargetTablesOutOfFive: financialTablesPresent,
      invoicesNeedingSerial: invoiceNumbersToBackfill,
      journalsNeedingSerial: journalNumbersToBackfill,
      duplicateReceiptNumbers: receiptNumberConflicts,
      duplicateInvoiceNumbers: invoiceNumberConflicts,
      duplicateJournalNumbers: journalNumberConflicts,
    },
    existingRowConstraintPreflight: {
      approximateStudentStatusTransitionRows: transitionEstimatedRows,
      studentStatusTransitionRowsViolatingNewCanonicalCheck: transitionConstraintViolations,
      transitionCheckScanSkippedForLargeTable: transitionEstimatedRows !== null && transitionEstimatedRows > 100_000,
      centralMetadataColumnPresent: centralMetadataExists,
      duplicateLiveCentralDomains: centralDomainDuplicates,
      duplicateLiveCentralSubdomains: centralSubdomainDuplicates,
      studentNationalIdColumnPresent: nationalIdExists,
      duplicateLiveStudentNationalIds: nationalIdDuplicates,
      usernameColumnPresent: usernameExists,
      duplicateLiveUsernamesCaseInsensitive: usernameDuplicates,
      emailColumnPresent: emailExists,
      duplicateLiveEmailsCaseInsensitive: emailDuplicates,
      note: 'Only aggregate counts are returned; no customer row values are read or emitted.',
    },
    privateStudentDocumentStorageMigration: {
      storageBucketsCatalogPresent: storageBucketsExists,
      targetBucketRows: privateBucket ? Number(privateBucket.rows[0]?.matches || 0) : null,
      targetBucketNameConflictRows: privateBucket ? Number(privateBucket.rows[0]?.name_conflicts || 0) : null,
      targetBucketAlreadyPrivate: privateBucket?.rows[0]?.already_private ?? null,
      targetBucketNameMatches: privateBucket?.rows[0]?.name_matches ?? null,
      targetBucketSizeLimitMatches: privateBucket?.rows[0]?.size_limit_matches ?? null,
      targetBucketMimeTypesMatch: privateBucket?.rows[0]?.mime_types_match ?? null,
      existingTargetBucketObjectCount: existingPrivateBucketObjects ? Number(existingPrivateBucketObjects.rows[0]?.count || 0) : null,
      storageObjectCatalogPresent: storageObjectsExists,
      metadataTableAlreadyExists: studentStorageTableExists,
      metadataRowsIfPresent: existingStudentStorageRows,
      migrationEffect: 'upserts the target bucket as private and creates the metadata table; it does not alter storage.objects rows or policies',
    },
    migrationRegistry: {
      exists: migrationRegistryExists,
      columns: migrationRegistryColumns,
      recordedRows: migrationRegistryRows,
      note: 'Empty history is not baselined; only successful executions may be recorded.',
    },
    databaseRoleProfiles: roleProfiles,
    publicTableOwnerSummary: tableOwnerSummary,
    securityHelperFunctions,
    readOnly: true,
  };
}

async function main() {
  if (!fs.existsSync(envPath)) throw new Error('LOCAL_STAGING_ENV_FILE_MISSING');
  const values = dotenv.parse(fs.readFileSync(envPath));
  const target = resolveStagingBackupTarget(values);
  if (extractPostgresProjectRef(values.PLATFORM_ADMIN_DATABASE_URL || '') !== projectRef) {
    throw new Error('STAGING_DATA_IMPACT_TARGET_REJECTED');
  }
  const caPath = path.join(defaultStagingVaultDirectory(), 'prod-ca-2021.crt');
  if (!fs.existsSync(caPath) || !new X509Certificate(fs.readFileSync(caPath, 'utf8')).ca) {
    throw new Error('STAGING_CA_CERTIFICATE_INVALID');
  }
  const pool = new Pool({ connectionString: values.PLATFORM_ADMIN_DATABASE_URL, max: 1,
    connectionTimeoutMillis: 15_000, ssl: { rejectUnauthorized: true, ca: fs.readFileSync(caPath, 'utf8') },
    options: '-c default_transaction_read_only=on -c statement_timeout=15000',
    application_name: 'edupro-staging-migration-data-impact-readonly' });
  try {
    const client = await pool.connect();
    client.on('error', () => undefined);
    try {
      await client.query('BEGIN READ ONLY');
      const identity = await client.query(`SELECT current_database() AS database, current_user AS role,
        inet_server_port() AS port`);
      if (identity.rows[0]?.database !== 'postgres' || identity.rows[0]?.role !== 'postgres'
        || target.database !== 'postgres') throw new Error('STAGING_DATA_IMPACT_DATABASE_IDENTITY_REJECTED');
      const impact = await inspectStagingMigrationDataImpact(client);
      await client.query('COMMIT');
      console.info(JSON.stringify({ checkedAt: new Date().toISOString(), projectRef,
        database: 'postgres', port: Number(identity.rows[0].port), impact }, null, 2));
      console.info('Read-only migration impact preflight completed; row contents and secrets were not read.');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally { client.release(); }
  } finally { await pool.end(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : '';
    console.error(/^[A-Z][A-Z0-9_]+$/.test(message) ? message : 'STAGING_DATA_IMPACT_PREFLIGHT_FAILED');
    process.exitCode = 1;
  });
}
