require('dotenv/config');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const EXPECTED_PROJECT_REF = 'wjhraxvxvvthxqlpyohh';
const CENTRAL_SCHOOL_CODE = 'CENTRAL-SCHOOL';
const MIGRATION_FILE = 'supabase/migrations/202609081500_canonical_student_fee_operations.sql';
const connectionString = process.env.PLATFORM_ADMIN_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_CONNECTION_REQUIRED');
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
if (!supabaseUrl.includes(EXPECTED_PROJECT_REF)) throw new Error('TARGET_PROJECT_REF_MISMATCH');

const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10000, ssl: { rejectUnauthorized: false }, application_name: 'edupro-central-canonical-fee-migration' });

(async () => {
  const client = await pool.connect();
  try {
    const target = await client.query(`
      SELECT id, tenant_id, display_name, school_code, central_metadata
        FROM public.schools
       WHERE school_code = $1
         AND status = 'active'
         AND deleted_at IS NULL
       LIMIT 1
    `, [CENTRAL_SCHOOL_CODE]);
    const school = target.rows[0];
    const metadata = school && school.central_metadata && typeof school.central_metadata === 'object' ? school.central_metadata : {};
    const workspace = metadata.ownerWorkspace && typeof metadata.ownerWorkspace === 'object' ? metadata.ownerWorkspace : {};
    if (!school || metadata.portal_profile !== 'owner_controlled' || workspace.mode !== 'owner' || workspace.templateKey !== 'central-schools-default') {
      throw new Error('CENTRAL_SCHOOL_IDENTITY_CHECK_FAILED');
    }

    const migration = fs.readFileSync(path.resolve(process.cwd(), MIGRATION_FILE), 'utf8');
    await client.query(migration);
    const verification = await client.query(`
      SELECT
        $1::uuid AS central_school_id,
        $2::uuid AS central_tenant_id,
        (SELECT COUNT(*)::int FROM information_schema.tables
          WHERE table_schema='public' AND table_name IN (
            'student_fee_templates','student_fee_assignments','student_fee_installment_plans',
            'student_fee_installment_schedules','student_fee_concessions','student_fee_allocations',
            'student_fee_payment_attempts','student_fee_payment_webhooks')) AS canonical_table_count,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='student_fee_invoices' AND column_name='idempotency_key') AS invoice_idempotency_column,
        EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='uq_student_fee_invoice_idempotency') AS invoice_idempotency_index,
        EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='student_fee_templates' AND policyname='p_student_fee_templates_scope') AS template_scope_policy
    `, [school.id, school.tenant_id]);
    console.log(JSON.stringify({ success: true, migration: MIGRATION_FILE, target: { id: school.id, tenantId: school.tenant_id, displayName: school.display_name, schoolCode: school.school_code }, verification: verification.rows[0] }, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
})().catch((error) => { console.error(error.message || String(error)); process.exitCode = 1; });
