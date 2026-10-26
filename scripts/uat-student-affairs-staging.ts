import dotenv from 'dotenv';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import {
  assertCloudflareStagingWorkerUrl,
  assertIsolatedStagingDatabase,
  STAGING_TARGET_NAME,
} from './stagingDatabaseSafety.js';

dotenv.config({ path: '.env.staging', override: false });

const EXPECTED_CONFIRMATION = 'RUN_STUDENT_AFFAIRS_STAGING_UAT';
const BASE_URL = String(process.env.UAT_STUDENT_AFFAIRS_BASE_URL || '').trim().replace(/\/$/, '');
const TOKEN = String(process.env.UAT_STUDENT_AFFAIRS_BEARER_TOKEN || '').trim();
const TRANSFER_CLASS_ID = String(process.env.UAT_STUDENT_AFFAIRS_TRANSFER_CLASS_ID || '').trim();
const TRANSFER_GRADE_ID = String(process.env.UAT_STUDENT_AFFAIRS_TRANSFER_GRADE_ID || '').trim();
const TRANSFER_SECTION = String(process.env.UAT_STUDENT_AFFAIRS_TRANSFER_SECTION || '').trim();
const PROMOTION_CLASS_ID = String(process.env.UAT_STUDENT_AFFAIRS_PROMOTION_CLASS_ID || '').trim();
const PROMOTION_GRADE_ID = String(process.env.UAT_STUDENT_AFFAIRS_PROMOTION_GRADE_ID || '').trim();
const PROMOTION_SECTION = String(process.env.UAT_STUDENT_AFFAIRS_PROMOTION_SECTION || '').trim();
const PHOTO_CATEGORY_ID = String(process.env.UAT_STUDENT_AFFAIRS_PHOTO_CATEGORY_ID || '').trim();
const databaseUrl = String(process.env.DATABASE_URL || '').trim();
const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
const targetName = String(process.env.UAT_STUDENT_AFFAIRS_TARGET || '').trim();
const { Pool } = pg;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`STUDENT_AFFAIRS_UAT_ASSERTION_FAILED:${message}`);
}

function requireEnvironment(): void {
  if (process.env.UAT_STUDENT_AFFAIRS_STAGING_CONFIRM !== EXPECTED_CONFIRMATION) {
    throw new Error('STUDENT_AFFAIRS_STAGING_CONFIRMATION_REQUIRED');
  }
  if (!BASE_URL || !TOKEN || !TRANSFER_CLASS_ID || !TRANSFER_GRADE_ID || !TRANSFER_SECTION
    || !PROMOTION_CLASS_ID || !PROMOTION_GRADE_ID || !PROMOTION_SECTION || !PHOTO_CATEGORY_ID) {
    throw new Error('STUDENT_AFFAIRS_STAGING_FIXTURE_ENVIRONMENT_INCOMPLETE');
  }
  const url = new URL(BASE_URL);
  if (url.origin === 'https://schoolfor-manus-staging.salafe10.workers.dev' && url.pathname === '/') {
    assertCloudflareStagingWorkerUrl(`${url.origin}/`);
  } else if (!['127.0.0.1', 'localhost'].includes(url.hostname)
    || !['4179', '4183'].includes(url.port)
    || process.env.UAT_ALLOW_LOCAL_STAGING !== 'true'
    || process.env.EDUPRO_ENVIRONMENT !== 'staging') {
    throw new Error('STUDENT_AFFAIRS_UAT_TARGET_MUST_BE_ISOLATED_STAGING');
  }
  if (!databaseUrl || !supabaseUrl || targetName !== STAGING_TARGET_NAME) {
    throw new Error('STUDENT_AFFAIRS_UAT_DATABASE_PREFLIGHT_REQUIRED');
  }
  assertIsolatedStagingDatabase({ targetName, supabaseUrl, databaseUrl });
  const dbRole = decodeURIComponent(new URL(databaseUrl).username).split('.')[0];
  if (dbRole !== 'edupro_staging_app' || dbRole !== String(process.env.DATABASE_ROLE_EXPECTED || '')) {
    throw new Error('STUDENT_AFFAIRS_UAT_DATABASE_ROLE_MUST_BE_RESTRICTED_STAGING_APP');
  }
}

async function api(path: string, init: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({})) as any;
  return { response, body };
}

async function requireApi(path: string, init: RequestInit = {}) {
  const result = await api(path, init);
  if (!result.response.ok || result.body?.success !== true) {
    throw new Error(`STUDENT_AFFAIRS_UAT_API_FAILED:${path}:${result.response.status}:${String(result.body?.message || result.body?.error || 'unknown')}`);
  }
  return result;
}

async function main(): Promise<void> {
  requireEnvironment();
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: true },
    application_name: 'edupro-student-affairs-staging-uat',
  });
  const runId = randomUUID();
  const completed: string[] = [];
  let importedStudentId = '';
  let writesStarted = false;

  try {
    const client = await pool.connect();
    try {
      const identity = await client.query<{ current_user: string; rolsuper: boolean; rolbypassrls: boolean }>(
        `SELECT current_user, r.rolsuper, r.rolbypassrls
           FROM pg_roles r WHERE r.rolname = current_user`,
      );
      assert(identity.rows[0]?.current_user === 'edupro_staging_app', 'database connection is not the restricted staging role');
      assert(identity.rows[0]?.rolsuper === false && identity.rows[0]?.rolbypassrls === false, 'staging role bypasses database isolation');

      const requiredTables = [
        'students', 'enrollments', 'academic_years', 'terms', 'school_settings',
        'student_documents', 'student_document_versions', 'student_document_storage_objects',
        'student_enrollment_certificates', 'audit_events', 'outbox_events',
      ];
      const tableCheck = await client.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
        [requiredTables],
      );
      const present = new Set(tableCheck.rows.map(row => row.table_name));
      assert(requiredTables.every(table => present.has(table)), 'required Student Affairs migrations are not installed');

      const rlsCheck = await client.query<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }>(
        `SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
           FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = ANY($1::text[])`,
        [['student_documents', 'student_document_storage_objects', 'student_enrollment_certificates']],
      );
      assert(rlsCheck.rows.length === 3 && rlsCheck.rows.every(row => row.relrowsecurity && row.relforcerowsecurity), 'Student Affairs sensitive tables are not FORCE RLS protected');
      completed.push('preflight: isolated database, restricted role, required schema, and FORCE RLS');
    } finally {
      client.release();
    }

    const setup = await requireApi('/api/academic/setup');
    assert(setup.body.data?.year?.id && Array.isArray(setup.body.data?.terms), 'canonical active academic year/terms are unavailable');
    const structure = setup.body.data?.structure || {};
    assert(Array.isArray(structure.stages) && Array.isArray(structure.grades) && Array.isArray(structure.classes) && Array.isArray(structure.sections), 'canonical academic structure is incomplete');
    completed.push('canonical source: active academic year, term, stage, grade, class, and section catalog read successfully');

    const importIdempotencyKey = `student-affairs-uat:${runId}:import`;
    const importRow = {
      fullName: `UAT Student ${runId.slice(0, 8)}`,
      birthDate: '2012-01-15',
      gender: 'ذكر',
      nationality: 'SA',
      parentName: 'UAT Guardian',
      parentPhone: `050${String(Date.now()).slice(-7)}`,
      admissionReference: 'STUDENT-AFFAIRS-STAGING-UAT',
    };
    writesStarted = true;
    const imported = await requireApi('/api/students/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': importIdempotencyKey },
      body: JSON.stringify({ rows: [importRow] }),
    });
    const importedStudent = imported.body.data?.students?.[0];
    importedStudentId = String(importedStudent?.studentId || importedStudent?.id || '');
    assert(importedStudentId, 'atomic import did not return the canonical student id');
    const importedReplay = await requireApi('/api/students/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': importIdempotencyKey },
      body: JSON.stringify({ rows: [importRow] }),
    });
    assert(Number(importedReplay.body.data?.idempotentCount) === 1, 'import retry was not idempotent');
    completed.push('import: one canonical row committed atomically and the exact retry returned the same identity');

    const transferKey = `student-affairs-uat:${runId}:transfer`;
    const transferPayload = {
      targetClassId: TRANSFER_CLASS_ID,
      targetGradeId: TRANSFER_GRADE_ID,
      targetSection: TRANSFER_SECTION,
      reason: `UAT نقل طالب داخل بيئة Staging ${runId}`,
    };
    const transfer = await requireApi(`/api/students/${encodeURIComponent(importedStudentId)}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': transferKey },
      body: JSON.stringify(transferPayload),
    });
    assert(Number(transfer.body.data?.processedCount) === 1, 'canonical transfer did not process the imported student');
    const transferReplay = await requireApi(`/api/students/${encodeURIComponent(importedStudentId)}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': transferKey },
      body: JSON.stringify(transferPayload),
    });
    assert(transferReplay.body.data?.idempotent === true, 'transfer retry was not idempotent');
    completed.push('transfer: canonical class/section move committed atomically with stable retry');

    const promotion = await requireApi(`/api/students/${encodeURIComponent(importedStudentId)}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `student-affairs-uat:${runId}:promotion` },
      body: JSON.stringify({
        targetClassId: PROMOTION_CLASS_ID,
        targetGradeId: PROMOTION_GRADE_ID,
        targetSection: PROMOTION_SECTION,
        reason: `UAT ترقية طالب داخل بيئة Staging ${runId}`,
      }),
    });
    assert(Number(promotion.body.data?.processedCount) === 1, 'canonical promotion did not process the imported student');
    completed.push('promotion: canonical grade/class/section promotion committed with audit/outbox evidence');

    const certificate = await requireApi(`/api/students/${encodeURIComponent(importedStudentId)}/certificates/enrollment/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `student-affairs-uat:${runId}:certificate` },
      body: JSON.stringify({ reason: `UAT شهادة قيد ${runId}` }),
    });
    assert(certificate.body.data?.signed === true && certificate.body.data?.signatureStatus === 'approved', 'enrollment certificate was not cryptographically approved');
    completed.push('certificate: signed canonical enrollment certificate issued for preview/print');

    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    const photo = await requireApi(`/api/students/${encodeURIComponent(importedStudentId)}/document-content?${new URLSearchParams({
      categoryId: PHOTO_CATEGORY_ID,
      documentReference: `STUDENT-PHOTO-UAT-${runId}`,
      title: 'UAT student profile photo',
      description: 'Staging UAT binary storage fixture',
      classification: 'confidential',
      verificationStatus: 'not_required',
      originalFileName: 'uat-profile.png',
    })}`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/png', 'Idempotency-Key': `student-affairs-uat:${runId}:photo` },
      body: png,
    });
    const documentId = String(photo.body.data?.documentId || photo.body.data?.id || '');
    assert(documentId, 'profile photo upload did not return a canonical document id');
    const signed = await requireApi(`/api/student-documents/${encodeURIComponent(documentId)}/content`);
    assert(typeof signed.body.data?.url === 'string' && signed.body.data.url.startsWith('http'), 'private document preview/download URL was not issued');
    completed.push('binary storage: student photo persisted privately and signed preview/download URL returned');

    await requireApi(`/api/students/${encodeURIComponent(importedStudentId)}?action=soft&reason=${encodeURIComponent(`UAT cleanup ${runId}`)}`, { method: 'DELETE' });
    importedStudentId = '';
    completed.push('cleanup: imported UAT student archived after all assertions');
    console.log(JSON.stringify({ success: true, target: STAGING_TARGET_NAME, runId, completed }, null, 2));
  } catch (error) {
    if (writesStarted && importedStudentId) {
      try {
        await api(`/api/students/${encodeURIComponent(importedStudentId)}?action=soft&reason=${encodeURIComponent(`UAT cleanup ${runId}`)}`, { method: 'DELETE' });
      } catch {
        // The final error remains the authoritative result; the operator must inspect the run id.
      }
    }
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error(JSON.stringify({ success: false, target: STAGING_TARGET_NAME, error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
