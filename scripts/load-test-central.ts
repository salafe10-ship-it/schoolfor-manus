import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const baseUrl = String(process.env.EDUPRO_LOADTEST_BASE_URL || 'https://schoolfor-manus-staging.onrender.com').replace(/\/$/, '');
const adminEmail = String(process.env.EDUPRO_LOADTEST_ADMIN_EMAIL || '').trim().toLowerCase();
const adminPassword = String(process.env.EDUPRO_LOADTEST_ADMIN_PASSWORD || '');
const requestedTenantId = String(process.env.EDUPRO_LOADTEST_TENANT_ID || '').trim();
const schoolCount = Number.parseInt(process.env.EDUPRO_LOADTEST_SCHOOLS || '5000', 10);
const userCount = Number.parseInt(process.env.EDUPRO_LOADTEST_USERS || '15000', 10);
const schoolConcurrency = Number.parseInt(process.env.EDUPRO_LOADTEST_SCHOOL_CONCURRENCY || '8', 10);
const userConcurrency = Number.parseInt(process.env.EDUPRO_LOADTEST_USER_CONCURRENCY || '12', 10);
const loginConcurrency = Number.parseInt(process.env.EDUPRO_LOADTEST_LOGIN_CONCURRENCY || '40', 10);
const loadTestMode = String(process.env.EDUPRO_LOADTEST_MODE || 'plan').trim().toLowerCase();
const LOADTEST_APPLY_CONFIRMATION = 'SCHOOLFORMANUS_5000_LOADTEST_APPLY';
const MAX_CERTIFICATION_SCHOOLS = 5000;

type JsonRecord = Record<string, any>;
type SchoolRecord = { id: string; tenant_id: string; branchId: string; name: string; email: string; password: string };

function required(value: string, name: string): string {
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function assertPositive(value: number, name: string): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer.`);
  return value;
}

async function readJson(response: Response): Promise<JsonRecord> {
  return response.json().catch(() => ({}));
}

async function bounded<T, R>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main(): Promise<void> {
  assertPositive(schoolCount, 'EDUPRO_LOADTEST_SCHOOLS');
  assertPositive(userCount, 'EDUPRO_LOADTEST_USERS');
  assertPositive(schoolConcurrency, 'EDUPRO_LOADTEST_SCHOOL_CONCURRENCY');
  assertPositive(userConcurrency, 'EDUPRO_LOADTEST_USER_CONCURRENCY');
  assertPositive(loginConcurrency, 'EDUPRO_LOADTEST_LOGIN_CONCURRENCY');
  if (!['plan', 'apply'].includes(loadTestMode)) throw new Error('EDUPRO_LOADTEST_MODE_MUST_BE_PLAN_OR_APPLY');
  if (schoolCount > MAX_CERTIFICATION_SCHOOLS) throw new Error(`EDUPRO_LOADTEST_SCHOOLS_MUST_BE_AT_MOST_${MAX_CERTIFICATION_SCHOOLS}`);

  if (loadTestMode === 'plan') {
    console.log(JSON.stringify({
      success: true,
      mode: 'plan',
      target: baseUrl,
      requestedSchoolCount: schoolCount,
      requestedUserCount: userCount,
      schoolConcurrency,
      userConcurrency,
      loginConcurrency,
      writesEnabled: false,
      note: `No remote login or data mutation was performed. To run the isolated staging certification, set EDUPRO_LOADTEST_MODE=apply and EDUPRO_LOADTEST_CONFIRM=${LOADTEST_APPLY_CONFIRMATION}.`,
    }, null, 2));
    return;
  }

  if (process.env.EDUPRO_LOADTEST_CONFIRM !== LOADTEST_APPLY_CONFIRMATION) {
    throw new Error(`EDUPRO_LOADTEST_CONFIRM_REQUIRED:${LOADTEST_APPLY_CONFIRMATION}`);
  }
  required(adminEmail, 'EDUPRO_LOADTEST_ADMIN_EMAIL');
  required(adminPassword, 'EDUPRO_LOADTEST_ADMIN_PASSWORD');

  const supabaseUrl = required(String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim(), 'SUPABASE_URL');
  const supabaseAnonKey = required(String(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim(), 'SUPABASE_ANON_KEY');
  const authClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const auth = await authClient.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
  if (auth.error || !auth.data.session) throw new Error(`Central test operator login failed: ${auth.error?.message || 'no session'}`);
  const accessToken = auth.data.session.access_token;
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  const api = async (path: string, init: RequestInit = {}) => fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });

  const tenantsResponse = await api('/api/admin/central/tenants');
  const tenantsPayload = await readJson(tenantsResponse);
  if (!tenantsResponse.ok || !Array.isArray(tenantsPayload.tenants)) throw new Error(`Tenant directory unavailable: HTTP ${tenantsResponse.status}`);
  const tenants = tenantsPayload.tenants.filter((tenant: JsonRecord) => ['active', 'provisioning'].includes(String(tenant.status || '').toLowerCase()));
  if (!tenants.length) throw new Error('No active or provisioning tenant is available for the synthetic load test.');
  const tenant = requestedTenantId
    ? tenants.find((item: JsonRecord) => String(item.id) === requestedTenantId)
    : tenants[0];
  if (!tenant) throw new Error('EDUPRO_LOADTEST_TENANT_ID is not an active tenant in the central directory.');

  // The canonical HR actor FK is tenant-scoped. Keep the synthetic run inside
  // one tenant so the test exercises central control without crossing the
  // data-plane isolation boundary.
  const schoolsResponse = await api(`/api/admin/central/schools?tenantId=${encodeURIComponent(String(tenant.id))}`);
  const schoolsPayload = await readJson(schoolsResponse);
  if (!schoolsResponse.ok || !Array.isArray(schoolsPayload.schools)) throw new Error(`School directory unavailable: HTTP ${schoolsResponse.status}`);
  const existingSchools = new Map<string, SchoolRecord>();
  for (const item of schoolsPayload.schools as JsonRecord[]) {
    const code = String(item.school_code || '').toUpperCase();
    const match = /^LT-(\d{4})$/.exec(code);
    const branchId = String(item.main_branch?.id || item.branch_id || '').trim();
    if (match && branchId) {
      const suffix = match[1];
      existingSchools.set(code, {
        id: String(item.id),
        tenant_id: String(item.tenant_id || tenant.id),
        branchId,
        name: `LOADTEST School ${suffix}`,
        email: `loadtest-user-${suffix}@example.invalid`,
        password: `LoadTest!${suffix}`,
      });
    }
  }
  if (existingSchools.size > schoolCount) throw new Error(`Existing synthetic schools (${existingSchools.size}) exceed requested total (${schoolCount}).`);

  const schoolJobs = Array.from({ length: schoolCount }, (_, offset) => offset + 1)
    .filter((sequence) => !existingSchools.has(`LT-${String(sequence).padStart(4, '0')}`));
  let schoolDone = 0;
  const schools = await bounded(schoolJobs, schoolConcurrency, async (sequence) => {
    const suffix = String(sequence).padStart(4, '0');
    const response = await api('/api/admin/central/schools', {
      method: 'POST',
      body: JSON.stringify({
        targetTenantId: tenant.id,
        name: `LOADTEST School ${suffix}`,
        shortName: `LT-${suffix}`,
        schoolCode: `LT-${suffix}`,
        subdomain: `loadtest-${suffix}`,
        city: 'Khartoum',
        address: 'Synthetic load-test record',
        timezone: 'Africa/Khartoum',
        locale: 'ar',
      }),
    });
    const payload = await readJson(response);
    if (!response.ok || !payload.success || !payload.school?.id || !payload.branch?.id) {
      const detail = typeof payload.details === 'string' ? payload.details : payload.details?.cause || payload.details?.message || '';
      throw new Error(`School ${suffix} failed: HTTP ${response.status} ${String(payload.message || '')} ${String(detail)}`.trim());
    }
    schoolDone += 1;
    if (schoolDone % 25 === 0 || schoolDone === schoolCount) console.log(`SCHOOLS ${schoolDone}/${schoolCount}`);
    return {
      id: String(payload.school.id),
      tenant_id: String(payload.school.tenant_id || tenant.id),
      branchId: String(payload.branch.id),
      name: `LOADTEST School ${suffix}`,
      email: `loadtest-user-${suffix}@example.invalid`,
      password: `LoadTest!${suffix}`,
    } satisfies SchoolRecord;
  });
  const allSchools = Array.from({ length: schoolCount }, (_, offset) => offset + 1)
    .map((sequence) => existingSchools.get(`LT-${String(sequence).padStart(4, '0')}`) || schools.find((item) => item.name.endsWith(String(sequence).padStart(4, '0'))))
    .filter((item): item is SchoolRecord => Boolean(item));
  if (allSchools.length !== schoolCount) throw new Error(`School total mismatch: expected ${schoolCount}, found ${allSchools.length}.`);

  const usersResponse = await api(`/api/admin/central/users?tenantId=${encodeURIComponent(String(tenant.id))}`);
  const usersPayload = await readJson(usersResponse);
  if (!usersResponse.ok || !Array.isArray(usersPayload.users)) throw new Error(`Identity directory unavailable: HTTP ${usersResponse.status}`);
  const existingUsers = new Map((usersPayload.users as JsonRecord[])
    .map((item) => [String(item.email || '').toLowerCase(), item] as const)
    .filter(([email]) => email));

  // Re-assert server-owned claims for resumable synthetic accounts. This is
  // intentionally done through the central identity route, never by trusting
  // browser-provided metadata.
  const existingSyntheticUsers = Array.from(existingUsers.entries())
    .filter(([email]) => /^loadtest-user-\d{4}@example\.invalid$/.test(email));
  await bounded(existingSyntheticUsers, userConcurrency, async ([, item]) => {
    const response = await api(`/api/admin/central/users/${encodeURIComponent(String(item.id))}`, {
      method: 'PATCH',
      body: JSON.stringify({
        targetTenantId: tenant.id,
        operation: 'force_password',
        forcePasswordChange: false,
      }),
    });
    const payload = await readJson(response);
    if (!response.ok || !payload.success) throw new Error(`Existing user claims repair failed: HTTP ${response.status}`);
    return true;
  });

  let userDone = 0;
  const userJobs = Array.from({ length: userCount }, (_, offset) => offset + 1)
    .filter((sequence) => !existingUsers.has(`loadtest-user-${String(sequence).padStart(4, '0')}@example.invalid`));
  const users = await bounded(userJobs, userConcurrency, async (sequence) => {
    const suffix = String(sequence).padStart(4, '0');
    const school = allSchools[(sequence - 1) % allSchools.length];
    const email = `loadtest-user-${suffix}@example.invalid`;
    const password = `LoadTest!${suffix}`;
    const response = await api(`/api/admin/central/schools/${encodeURIComponent(school.id)}/users`, {
      method: 'POST',
      body: JSON.stringify({
        targetTenantId: school.tenant_id,
        branchId: school.branchId,
        name: `LOADTEST User ${suffix}`,
        email,
        password,
        initialRole: 'schooladmin',
      }),
    });
    const payload = await readJson(response);
    if (!response.ok || !payload.success || !payload.user?.id) {
      const detail = typeof payload.details === 'string' ? payload.details : payload.details?.cause || payload.details?.message || payload.error || '';
      throw new Error(`User ${suffix} failed: HTTP ${response.status} ${String(payload.message || '')} ${String(detail)}`.trim());
    }
    userDone += 1;
    if (userDone % 25 === 0 || userDone === userCount) console.log(`USERS ${userDone}/${userCount}`);
    return { email, password, schoolId: school.id };
  });
  const allUsers = Array.from({ length: userCount }, (_, offset) => offset + 1)
    .map((sequence) => {
      const suffix = String(sequence).padStart(4, '0');
      return { email: `loadtest-user-${suffix}@example.invalid`, password: `LoadTest!${suffix}`, schoolId: allSchools[(sequence - 1) % allSchools.length].id };
    });

  let loginDone = 0;
  const loginResults = await bounded(allUsers, loginConcurrency, async (user) => {
    // Use the same trusted login contract as the browser. This verifies Auth,
    // server-owned scope claims, database permissions, and RLS together.
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: user.email, password: user.password }),
    });
    const loginPayload = await readJson(loginResponse);
    const trustedToken = String(loginPayload.data?.token || '').trim();
    if (!loginResponse.ok || !loginPayload.success || !trustedToken) return { ok: false, reason: String(loginPayload.message || `login HTTP ${loginResponse.status}`) };
    const response = await fetch(`${baseUrl}/api/dashboard/metrics`, { headers: { Authorization: `Bearer ${trustedToken}` } });
    loginDone += 1;
    if (loginDone % 25 === 0 || loginDone === allUsers.length) console.log(`CONCURRENT USERS ${loginDone}/${allUsers.length}`);
    return { ok: response.ok, status: response.status, reason: response.ok ? undefined : `metrics HTTP ${response.status}` };
  });

  const successfulLogins = loginResults.filter(result => result.ok).length;
  const failedReasons = loginResults
    .filter(result => !result.ok)
    .reduce<Record<string, number>>((acc, result) => {
      const key = String(result.reason || 'unknown').slice(0, 120);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  console.log(JSON.stringify({
    success: true,
    target: baseUrl,
    syntheticSchoolsCreated: allSchools.length,
    syntheticUsersCreated: allUsers.length,
    concurrentLoginChecks: loginResults.length,
    successfulLoginChecks: successfulLogins,
    failedLoginChecks: loginResults.length - successfulLogins,
    failedLoginReasons: failedReasons,
    note: 'Synthetic records remain available for an explicit cleanup/archive pass by their LOADTEST prefix.',
  }));
}

main().catch(error => {
  console.error(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
});
