import dotenv from 'dotenv';
dotenv.config();

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const EXPECTED_PROJECT_REF = 'wjhraxvxvvthxqlpyohh';
const FOUNDATION_MIGRATIONS = [
  '202608311500_student_document_private_storage.sql',
  '202608311600_canonical_student_graduation.sql'
] as const;
const HARDENING_MIGRATION = '202608311700_production_closure_immutability.sql';

async function main() {
  const supabaseUrl = String(process.env.SUPABASE_URL || '');
  if (!supabaseUrl.includes(EXPECTED_PROJECT_REF)) throw new Error('TARGET_PROJECT_REF_MISMATCH');
  const connectionString = process.env.PLATFORM_ADMIN_DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) throw new Error('ADMIN_DATABASE_CONNECTION_REQUIRED');

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 8_000),
    ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false }
  });

  try {
    const before = await pool.query<{ storage_table: string | null; graduation_table: string | null }>(
      `SELECT to_regclass('public.student_document_storage_objects')::text AS storage_table,
              to_regclass('public.student_graduation_records')::text AS graduation_table`
    );
    const existingCount = Number(Boolean(before.rows[0]?.storage_table)) + Number(Boolean(before.rows[0]?.graduation_table));
    if (existingCount === 1) throw new Error('PARTIAL_CLOSURE_SCHEMA_DETECTED');

    if (existingCount === 0) {
      for (const migration of FOUNDATION_MIGRATIONS) {
        const sql = await readFile(resolve(process.cwd(), 'supabase/migrations', migration), 'utf8');
        await pool.query(sql);
      }
    }
    const hardeningSql = await readFile(resolve(process.cwd(), 'supabase/migrations', HARDENING_MIGRATION), 'utf8');
    await pool.query(hardeningSql);

    const posture = await pool.query<{
      table_name: string;
      rls_enabled: boolean;
      force_rls: boolean;
      update_allowed: boolean;
      delete_allowed: boolean;
      truncate_allowed: boolean;
    }>(
      `SELECT c.relname AS table_name,
              c.relrowsecurity AS rls_enabled,
              c.relforcerowsecurity AS force_rls,
              has_table_privilege('edupro_app', format('public.%I', c.relname), 'UPDATE') AS update_allowed,
              has_table_privilege('edupro_app', format('public.%I', c.relname), 'DELETE') AS delete_allowed,
              has_table_privilege('edupro_app', format('public.%I', c.relname), 'TRUNCATE') AS truncate_allowed
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = ANY($1::text[])
        ORDER BY c.relname`,
      [['student_document_storage_objects', 'student_graduation_records']]
    );
    if (posture.rowCount !== 2 || posture.rows.some(row => !row.rls_enabled || !row.force_rls || row.update_allowed || row.delete_allowed || row.truncate_allowed)) {
      throw new Error('CLOSURE_TABLE_SECURITY_POSTURE_FAILED');
    }

    const bucket = await pool.query<{ public: boolean; file_size_limit: number; allowed_mime_types: string[] }>(
      `SELECT public, file_size_limit, allowed_mime_types
         FROM storage.buckets WHERE id = 'student-documents-private'`
    );
    const bucketRow = bucket.rows[0];
    if (!bucketRow || bucketRow.public || Number(bucketRow.file_size_limit) !== 10_485_760
      || JSON.stringify(bucketRow.allowed_mime_types) !== JSON.stringify(['application/pdf', 'image/png', 'image/jpeg'])) {
      throw new Error('PRIVATE_BUCKET_POSTURE_FAILED');
    }

    const directStoragePolicies = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
         FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
          AND (COALESCE(qual, '') ILIKE '%student-documents-private%'
            OR COALESCE(with_check, '') ILIKE '%student-documents-private%')`
    );
    if (Number(directStoragePolicies.rows[0]?.total || 0) !== 0) throw new Error('DIRECT_BROWSER_STORAGE_POLICY_DETECTED');

    const role = await pool.query<{ rolbypassrls: boolean; rolsuper: boolean }>(
      `SELECT rolbypassrls, rolsuper FROM pg_roles WHERE rolname = 'edupro_app'`
    );
    if (!role.rows[0] || role.rows[0].rolbypassrls || role.rows[0].rolsuper) throw new Error('RESTRICTED_APP_ROLE_POSTURE_FAILED');

    const transition = await pool.query<{ definition: string }>(
      `SELECT pg_get_constraintdef(oid) AS definition
         FROM pg_constraint
        WHERE conrelid = 'public.student_status_transitions'::regclass
          AND conname = 'ck_student_status_transitions_allowed'`
    );
    if (!transition.rows[0]?.definition.includes("from_status = 'active'::text")
      || !transition.rows[0]?.definition.includes("to_status = 'graduated'::text")) {
      throw new Error('GRADUATION_TRANSITION_CONSTRAINT_FAILED');
    }

    const scopeMatrix = await pool.query<{ missing: string }>(`
      WITH scoped_tables AS (
        SELECT c.oid, c.relrowsecurity, c.relforcerowsecurity
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
           AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'tenant_id' AND a.attnum > 0 AND NOT a.attisdropped)
           AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'school_id' AND a.attnum > 0 AND NOT a.attisdropped)
      )
      SELECT COUNT(*) FILTER (
        WHERE NOT relrowsecurity OR NOT relforcerowsecurity
           OR NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = scoped_tables.oid AND p.polcmd IN ('r', '*'))
      )::text AS missing
      FROM scoped_tables
    `);
    if (Number(scopeMatrix.rows[0]?.missing || 0) !== 0) throw new Error('SCHOOL_SCOPE_MATRIX_FAILED');

    console.log(JSON.stringify({
      success: true,
      projectRef: EXPECTED_PROJECT_REF,
      tables: posture.rows.map(row => ({ table: row.table_name, rls: row.rls_enabled, forceRls: row.force_rls, immutable: !row.update_allowed && !row.delete_allowed && !row.truncate_allowed })),
      bucket: { private: !bucketRow.public, fileSizeLimit: Number(bucketRow.file_size_limit), mimeTypes: bucketRow.allowed_mime_types },
      directBrowserStoragePolicies: 0,
      appRole: { bypassRls: role.rows[0].rolbypassrls, superuser: role.rows[0].rolsuper },
      schoolScopeMatrix: 'complete',
      runtimeRoleProof: 'enforced by /api/ready'
    }));
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
