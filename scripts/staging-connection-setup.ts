import http from 'node:http';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { restrictFilePermissions, validateStagingEnvironmentValues } from './prepare-staging-env.js';
import { saveStagingSecrets } from './staging-secret-store.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'http://127.0.0.1:4182';
const host = '127.0.0.1:4182';
const projectRef = 'vjcjscqgmijgzagshsca';
const poolerHost = 'aws-1-eu-west-1.pooler.supabase.com';
const confirmation = 'SET_STAGING_APP_PASSWORD_AND_SAVE';

export async function configureStagingConnection(input: Record<string, unknown>): Promise<void> {
  if (input.confirmation !== confirmation || typeof input.adminPassword !== 'string'
    || !input.adminPassword || input.adminPassword.length > 1024
    || typeof input.appPassword !== 'string' || input.appPassword.length < 20 || input.appPassword.length > 256
    || input.appPassword !== input.appPasswordConfirmation) throw new Error('STAGING_SETUP_INPUT_INVALID');
  const envFile = path.join(root, '.env.staging');
  const original = fs.readFileSync(envFile, 'utf8');
  const values = dotenv.parse(original);
  if (values.SUPABASE_URL !== `https://${projectRef}.supabase.co`
    || !values.SUPABASE_ANON_KEY || !values.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('STAGING_API_KEYS_MUST_BE_RESTORED_FIRST');
  }
  const makeUrl = (role: string, password: string) => {
    const url = new URL(`postgresql://${poolerHost}:5432/postgres`);
    url.username = `${role}.${projectRef}`;
    url.password = password;
    return url.toString();
  };
  const next = { ...values, EDUPRO_ENVIRONMENT: 'staging', UAT35_TARGET: 'schoolfor-manus-staging',
    DATABASE_ROLE_EXPECTED: 'edupro_staging_app',
    DATABASE_URL: makeUrl('edupro_staging_app', input.appPassword),
    PLATFORM_ADMIN_DATABASE_URL: makeUrl('postgres', input.adminPassword),
    DIRECT_URL: '', JWT_SECRET: values.JWT_SECRET || randomBytes(48).toString('base64url'),
    UAT_ALLOW_LOCAL_STAGING: 'false', UAT_STUDENT_FEES_STAGING_CONFIRM: '',
    AUTO_MIGRATE: 'false', AUTO_SEED: 'false', RUNTIME_SCHEMA_BOOTSTRAP: 'false',
    FINANCIAL_WRITES_LOCKED: 'true', FINANCIAL_ERP_MODE: 'read_only' };
  validateStagingEnvironmentValues(next);
  const admin = new Pool({ connectionString: next.PLATFORM_ADMIN_DATABASE_URL, max: 1,
    connectionTimeoutMillis: 12_000, statement_timeout: 12_000, ssl: { rejectUnauthorized: true },
    application_name: 'edupro-staging-owner-connection-setup' });
  try {
    const identity = await admin.query(`SELECT current_user, current_database(), rolcanlogin, rolsuper, rolbypassrls,
      EXISTS (SELECT 1 FROM pg_roles elevated WHERE (elevated.rolsuper OR elevated.rolbypassrls)
        AND pg_has_role('edupro_staging_app', elevated.oid, 'MEMBER')) AS elevated_membership
      FROM pg_roles WHERE rolname='edupro_staging_app'`);
    const role = identity.rows[0];
    if (!role || role.current_user !== 'postgres' || role.current_database !== 'postgres'
      || !role.rolcanlogin || role.rolsuper || role.rolbypassrls || role.elevated_membership) throw new Error('STAGING_DATABASE_ROLE_NOT_RESTRICTED');
    // This action is submitted by the owner in the local form. It changes
    // only this existing Staging role's password and grants no new privileges.
    const statement = await admin.query<{ command: string }>(
      "SELECT format('ALTER ROLE edupro_staging_app PASSWORD %L', $1::text) AS command", [input.appPassword]);
    await admin.query(statement.rows[0].command);
    statement.rows[0].command = '';
    const app = new Pool({ connectionString: next.DATABASE_URL, max: 1, connectionTimeoutMillis: 12_000,
      ssl: { rejectUnauthorized: true }, application_name: 'edupro-staging-role-verification' });
    try {
      const actual = await app.query('SELECT current_user, rolsuper, rolbypassrls FROM pg_roles WHERE rolname=current_user');
      if (actual.rows[0]?.current_user !== 'edupro_staging_app'
        || actual.rows[0]?.rolsuper || actual.rows[0]?.rolbypassrls) throw new Error('STAGING_APP_LOGIN_VERIFICATION_FAILED');
    } finally { await app.end(); }
    // Preserve comments and encode values for dotenv without writing them to logs.
    let updated = original;
    for (const [key, value] of Object.entries(next)) {
      const line = `${key}=${JSON.stringify(value)}`;
      const pattern = new RegExp(`^${key}=.*$`, 'm');
      updated = pattern.test(updated) ? updated.replace(pattern, () => line) : `${updated}\n${line}\n`;
    }
    fs.writeFileSync(envFile, updated);
    restrictFilePermissions(envFile);
    saveStagingSecrets(envFile);
  } finally { await admin.end(); }
}

function setupHtml(): string {
  return `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>إكمال اتصال Staging الآمن</title><style>body{font:17px system-ui;background:#f3f6fa;color:#142c45;margin:0;padding:30px}main{max-width:700px;margin:auto;background:white;padding:32px;border-radius:18px;box-shadow:0 12px 40px #142c4512}h1{font-size:26px}p{line-height:1.8}code{direction:ltr;display:inline-block}label{display:block;margin:22px 0 8px}input[type=password]{box-sizing:border-box;width:100%;padding:14px;border:1px solid #aebdcd;border-radius:8px;font-size:18px;direction:ltr}button{background:#126052;color:white;border:0;border-radius:9px;padding:16px;font:inherit;cursor:pointer;width:100%;margin-top:24px}small{color:#526477}#status{padding:12px;line-height:1.7;white-space:pre-wrap}</style>
  <main><h1>إكمال اتصال بيئة الاختبار المعزولة</h1><p>المشروع: <code>edupro-school-erp-staging</code><br>المعرّف: <code>${projectRef}</code><br>الحفظ: مخزن Windows مشفّر خارج المستودع، وملف خادم محلي مستثنى من Git.</p>
  <p>هذه الخطوة ينجزها مالك الحساب مباشرة. الضغط على الزر يعيّن كلمة المرور الجديدة لدور الاختبار الموجود <code>edupro_staging_app</code>، ويتحقق من الدخول بصلاحياته المحدودة، ثم يحفظ الاتصال مشفّرًا. قد تحتاج خدمات الاختبار القديمة إلى كلمة المرور الجديدة. الكتابة المالية تبقى مقفلة.</p>
  <form id="setup"><label for="admin">كلمة مرور قاعدة Staging الحالية — دور postgres</label><input id="admin" type="password" autocomplete="off" required maxlength="1024">
  <label for="app">كلمة مرور جديدة لدور الاختبار المحدود — 20 حرفًا على الأقل</label><input id="app" type="password" autocomplete="new-password" required minlength="20" maxlength="256">
  <label for="again">تأكيد كلمة مرور دور الاختبار</label><input id="again" type="password" autocomplete="new-password" required minlength="20" maxlength="256">
  <label><input id="confirm" type="checkbox" required> أؤكد تعيين كلمة مرور دور الاختبار المحدود وحفظ الاتصال محليًا مشفّرًا.</label>
  <small>أدخل القيم هنا فقط. لا ترسل كلمة مرور في المحادثة. هذه الصفحة على جهازك ولا تعرِض أي مفتاح خادم.</small>
  <button id="submit">تعيين كلمة مرور الاختبار والتحقق والحفظ المشفّر</button></form><div id="status" role="status"></div></main>
  <script>document.getElementById('setup').onsubmit=async(e)=>{e.preventDefault();let b=document.getElementById('submit'),s=document.getElementById('status');if(document.getElementById('app').value!==document.getElementById('again').value){s.textContent='كلمتا مرور الاختبار غير متطابقتين.';return;}b.disabled=true;s.textContent='جارٍ التحقق من اتصال Staging وحفظ الإعدادات…';try{let r=await fetch('/configure',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({adminPassword:document.getElementById('admin').value,appPassword:document.getElementById('app').value,appPasswordConfirmation:document.getElementById('again').value,confirmation:'${confirmation}'})});let j=await r.json();s.textContent=j.ok?'تم التحقق من الدخول وحفظ الاتصال مشفّرًا. يمكن الآن استكمال الترحيلات والاختبارات.':'تعذر إكمال الاتصال: '+j.error;if(j.ok){document.getElementById('setup').reset();b.textContent='تم الحفظ والتحقق';}else b.disabled=false;}catch{s.textContent='تعذر الاتصال بخادم الإعداد المحلي.';b.disabled=false;}};</script></html>`;
}

export function createStagingSetupServer(configure = configureStagingConnection) {
  const session = randomBytes(32).toString('hex');
  let busy = false;
  const server = http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'");
    const send = (status: number, body: object) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(body)); };
    if (request.headers.host !== host) { send(403, { error: 'STAGING_SETUP_HOST_REJECTED' }); return; }
    if (request.method === 'GET' && request.url === '/') {
      response.setHeader('Set-Cookie', `staging_setup=${session}; HttpOnly; SameSite=Strict; Path=/`);
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(setupHtml()); return;
    }
    if (request.method !== 'POST' || request.url !== '/configure') { send(404, { error: 'NOT_FOUND' }); return; }
    if (request.headers.origin !== origin || request.headers['content-type'] !== 'application/json'
      || !request.headers.cookie?.split(';').some((part) => part.trim() === `staging_setup=${session}`)) {
      send(403, { error: 'STAGING_SETUP_ORIGIN_OR_SESSION_REJECTED' }); return;
    }
    if (busy) { send(409, { error: 'STAGING_SETUP_IN_PROGRESS' }); return; }
    busy = true;
    try {
      let body = '';
      for await (const chunk of request) { body += chunk.toString(); if (body.length > 8192) throw new Error('STAGING_SETUP_INPUT_TOO_LARGE'); }
      await configure(JSON.parse(body)); body = '';
      send(200, { ok: true });
      server.close();
    } catch (error) {
      // Never send a PostgreSQL, URI, filesystem, or supplied-secret error back.
      const code = error instanceof Error && /^STAGING_[A-Z_]+$/.test(error.message)
        ? error.message : 'STAGING_DATABASE_AUTH_OR_TLS_FAILED';
      send(400, { ok: false, error: code });
    } finally { busy = false; }
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createStagingSetupServer();
  server.listen(4182, '127.0.0.1', () => console.info('Staging owner setup ready at http://127.0.0.1:4182 — enter credentials directly in the local form.'));
  server.on('error', () => { console.error('STAGING_SETUP_SERVER_UNAVAILABLE'); process.exitCode = 1; });
}
