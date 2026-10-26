import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { defaultStagingVaultDirectory } from './staging-secret-store.js';

const { Pool } = pg;
const host = '127.0.0.1';
const port = 63991;
const databaseName = process.argv[2] || '';

async function expectDenied(client: pg.PoolClient, savepoint: string, query: () => Promise<unknown>, label: string) {
  await client.query(`SAVEPOINT ${savepoint}`);
  let error: unknown;
  try { await query(); } catch (caught) { error = caught; }
  await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
  if (!error || typeof error !== 'object' || !('code' in error) || error.code !== '42501') {
    throw new Error(`${label}_NOT_DENIED`);
  }
}

export async function runLocalStagingRlsRehearsal(name: string) {
  if (!/^edupro_stg_rehearsal_[0-9]{8}_[a-f0-9]{8}$/.test(name)) {
    throw new Error('LOCAL_RLS_REHEARSAL_DATABASE_NAME_REJECTED');
  }
  const manifestPath = path.join(defaultStagingVaultDirectory(), 'schema-rehearsals', `${name}.json`);
  if (!fs.existsSync(manifestPath)) throw new Error('LOCAL_RLS_REHEARSAL_MANIFEST_MISSING');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
  if (manifest.projectRef !== 'vjcjscqgmijgzagshsca' || manifest.databaseName !== name
    || Number(manifest.copiedRows) !== 0 || Number(manifest.publicTablesAfterReplay) !== 114
    || manifest.replayStatus !== 'passed') throw new Error('LOCAL_RLS_REHEARSAL_MANIFEST_REJECTED');

  const pool = new Pool({ connectionString: `postgresql://postgres@${host}:${port}/${name}`,
    max: 1, connectionTimeoutMillis: 5_000, statement_timeout: 20_000,
    application_name: 'edupro-local-staging-rls-rehearsal' });
  const client = await pool.connect();
  try {
    const identity = await client.query(`SELECT current_database() AS database, current_user AS role,
      (inet_server_addr() <<= inet '127.0.0.0/8') AS loopback, inet_server_port() AS port,
      (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind IN ('r','p')) AS public_tables`);
    const current = identity.rows[0];
    if (current.database !== name || current.role !== 'postgres' || current.loopback !== true
      || Number(current.port) !== port || Number(current.public_tables) !== 114) {
      throw new Error('LOCAL_RLS_REHEARSAL_DATABASE_TARGET_REJECTED');
    }

    await client.query('BEGIN');
    const tenantId = crypto.randomUUID();
    const schoolA = crypto.randomUUID();
    const schoolB = crypto.randomUUID();
    const authUserA = crypto.randomUUID();
    const authUserB = crypto.randomUUID();
    const userA = crypto.randomUUID();
    const userB = crypto.randomUUID();
    const studentA = crypto.randomUUID();
    const studentB = crypto.randomUUID();
    const categoryId = crypto.randomUUID();
    const documentA = crypto.randomUUID();
    const documentB = crypto.randomUUID();

    // Local-only auth stub: exercise the same request hook the API uses without
    // contacting Supabase Auth or creating a remote identity.
    await client.query(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
      LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$`);
    await client.query('INSERT INTO auth.users(id) VALUES ($1),($2)', [authUserA, authUserB]);
    await client.query(`INSERT INTO public.tenants(id,legal_name,slug,status)
      VALUES ($1,'Synthetic isolation test','synthetic-rls-test','active')`, [tenantId]);
    await client.query(`INSERT INTO public.schools(id,tenant_id,school_code,legal_name,display_name,status)
      VALUES ($1,$3,'SYN-A','Synthetic A','Synthetic A','active'),
             ($2,$3,'SYN-B','Synthetic B','Synthetic B','active')`, [schoolA, schoolB, tenantId]);
    await client.query(`INSERT INTO public.users(id,auth_user_id,tenant_id,school_id,display_name,status)
      VALUES ($1,$3,$5,$7,'Synthetic User A','active'),
             ($2,$4,$6,$8,'Synthetic User B','active')`,
      [userA, userB, authUserA, authUserB, tenantId, tenantId, schoolA, schoolB]);
    await client.query(`INSERT INTO public.students
      (id,tenant_id,school_id,student_number,legal_first_name,legal_last_name,date_of_birth,status,created_by)
      VALUES ($1,$3,$5,'SYN-A-1','Synthetic','Student A','2015-01-01','active',$7),
             ($2,$4,$6,'SYN-B-1','Synthetic','Student B','2015-01-01','active',$8)`,
      [studentA, studentB, tenantId, tenantId, schoolA, schoolB, userA, userB]);
    await client.query(`INSERT INTO public.student_document_categories(id,tenant_id,category_code,display_name,status)
      VALUES ($1,$2,'SYNTHETIC_RLS','Synthetic RLS category','active')`, [categoryId, tenantId]);
    await client.query(`INSERT INTO public.student_documents
      (id,tenant_id,school_id,student_id,category_id,document_reference,title,created_by)
      VALUES ($1,$3,$5,$7,$9,'SYN-A-DOC','Synthetic A document',$11),
             ($2,$4,$6,$8,$10,'SYN-B-DOC','Synthetic B document',$12)`,
      [documentA, documentB, tenantId, tenantId, schoolA, schoolB, studentA, studentB,
        categoryId, categoryId, userA, userB]);

    await client.query('SET LOCAL ROLE authenticated');
    await client.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [authUserA]);
    await client.query('SELECT public.dbsec003_set_request_context()');
    let result = await client.query('SELECT count(*)::int AS count FROM public.student_documents');
    if (Number(result.rows[0].count) !== 1) throw new Error('AUTHENTICATED_SCHOOL_A_READ_ISOLATION_FAILED');
    result = await client.query('SELECT count(*)::int AS count FROM public.student_documents WHERE id=$1', [documentB]);
    if (Number(result.rows[0].count) !== 0) throw new Error('AUTHENTICATED_CROSS_SCHOOL_READ_FAILED');
    const authenticatedInsertId = crypto.randomUUID();
    await client.query(`INSERT INTO public.student_documents
      (id,tenant_id,school_id,student_id,category_id,document_reference,title,created_by)
      VALUES ($1,$2,$3,$4,$5,'SYN-A-AUTH-INSERT','Scoped authenticated insert',$6)`,
      [authenticatedInsertId, tenantId, schoolA, studentA, categoryId, userA]);
    result = await client.query('SELECT count(*)::int AS count FROM public.student_documents WHERE id=$1', [authenticatedInsertId]);
    if (Number(result.rows[0].count) !== 1) throw new Error('AUTHENTICATED_SCHOOL_SCOPED_INSERT_FAILED');
    await expectDenied(client, 'blocked_cross_school_insert', () => client.query(`INSERT INTO public.student_documents
      (id,tenant_id,school_id,student_id,category_id,document_reference,title,created_by)
      VALUES ($1,$2,$3,$4,$5,'SYN-B-ATTACK','Blocked document',$6)`,
      [crypto.randomUUID(), tenantId, schoolB, studentB, categoryId, userA]), 'AUTHENTICATED_CROSS_SCHOOL_INSERT');

    await client.query('SET LOCAL ROLE edupro_staging_app');
    await client.query(`SELECT set_config('app.tenant_id',$1,true), set_config('app.school_id',$2,true),
      set_config('app.branch_id','',true), set_config('app.user_id',$3,true),
      set_config('app.actor_user_id',$4,true)`, [tenantId, schoolA, authUserA, userA]);
    result = await client.query('SELECT count(*)::int AS count FROM public.students');
    if (Number(result.rows[0].count) !== 1) throw new Error('APP_ROLE_SCHOOL_A_READ_ISOLATION_FAILED');
    const appRoleInsertId = crypto.randomUUID();
    await client.query(`INSERT INTO public.student_documents
      (id,tenant_id,school_id,student_id,category_id,document_reference,title,created_by)
      VALUES ($1,$2,$3,$4,$5,'SYN-A-APP-INSERT','Scoped app-role insert',$6)`,
      [appRoleInsertId, tenantId, schoolA, studentA, categoryId, userA]);
    result = await client.query('SELECT count(*)::int AS count FROM public.student_documents WHERE id=$1', [appRoleInsertId]);
    if (Number(result.rows[0].count) !== 1) throw new Error('APP_ROLE_SCHOOL_SCOPED_INSERT_FAILED');

    await client.query('SET LOCAL ROLE anon');
    await expectDenied(client, 'blocked_anon_read', () => client.query('SELECT count(*) FROM public.student_documents'),
      'ANON_STUDENT_DOCUMENT_READ');

    await client.query('ROLLBACK');
    return {
      databaseName: name,
      authenticatedSchoolIsolation: 'passed',
      appRoleSchoolIsolation: 'passed',
      authenticatedSchoolScopedInsert: 'passed',
      appRoleSchoolScopedInsert: 'passed',
      crossSchoolInsert: 'denied',
      anonymousStudentDocumentRead: 'denied',
      syntheticRowsPersisted: false,
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runLocalStagingRlsRehearsal(databaseName).then((result) => {
    console.info(JSON.stringify(result, null, 2));
    console.info('Synthetic records were rolled back; no remote Staging data was read or changed.');
  }).catch((error) => {
    const message = error instanceof Error ? error.message : '';
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    console.error(/^(LOCAL_RLS_REHEARSAL_[A-Z_]+|AUTHENTICATED_[A-Z_]+|APP_ROLE_[A-Z_]+|ANON_[A-Z_]+)$/.test(message)
      ? message : code ? `LOCAL_RLS_SQL_FAILED:${code}:${message.slice(0, 180)}` : 'LOCAL_RLS_REHEARSAL_FAILED');
    process.exitCode = 1;
  });
}
