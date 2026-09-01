import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const baseUrl = String(process.env.EDUPRO_LOADTEST_BASE_URL || 'https://schoolfor-manus-staging.onrender.com').replace(/\/$/, '');
const adminEmail = String(process.env.EDUPRO_LOADTEST_ADMIN_EMAIL || '').trim().toLowerCase();
const adminPassword = String(process.env.EDUPRO_LOADTEST_ADMIN_PASSWORD || '');
const schoolCount = Number.parseInt(process.env.EDUPRO_LOADTEST_SCHOOLS || '500', 10);
const userCount = Number.parseInt(process.env.EDUPRO_LOADTEST_USERS || '200', 10);
const schoolConcurrency = Number.parseInt(process.env.EDUPRO_LOADTEST_SCHOOL_CONCURRENCY || '8', 10);
const userConcurrency = Number.parseInt(process.env.EDUPRO_LOADTEST_USER_CONCURRENCY || '12', 10);
const loginConcurrency = Number.parseInt(process.env.EDUPRO_LOADTEST_LOGIN_CONCURRENCY || '40', 10);

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
  required(adminEmail, 'EDUPRO_LOADTEST_ADMIN_EMAIL');
  required(adminPassword, 'EDUPRO_LOADTEST_ADMIN_PASSWORD');
  assertPositive(schoolCount, 'EDUPRO_LOADTEST_SCHOOLS');
  assertPositive(userCount, 'EDUPRO_LOADTEST_USERS');
  assertPositive(schoolConcurrency, 'EDUPRO_LOADTEST_SCHOOL_CONCURRENCY');
  assertPositive(userConcurrency, 'EDUPRO_LOADTEST_USER_CONCURRENCY');
  assertPositive(loginConcurrency, 'EDUPRO_LOADTEST_LOGIN_CONCURRENCY');

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

  const schoolJobs = Array.from({ length: schoolCount }, (_, offset) => offset + 1);
  let schoolDone = 0;
  const schools = await bounded(schoolJobs, schoolConcurrency, async (sequence) => {
    const suffix = String(sequence).padStart(4, '0');
    const tenant = tenants[(sequence - 1) % tenants.length];
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

  let userDone = 0;
  const userJobs = Array.from({ length: userCount }, (_, offset) => offset + 1);
  const users = await bounded(userJobs, userConcurrency, async (sequence) => {
    const suffix = String(sequence).padStart(4, '0');
    const school = schools[(sequence - 1) % schools.length];
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
      throw new Error(`User ${suffix} failed: HTTP ${response.status} ${String(payload.message || '')}`.trim());
    }
    userDone += 1;
    if (userDone % 25 === 0 || userDone === userCount) console.log(`USERS ${userDone}/${userCount}`);
    return { email, password, schoolId: school.id };
  });

  let loginDone = 0;
  const loginResults = await bounded(users, loginConcurrency, async (user) => {
    const client = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const signedIn = await client.auth.signInWithPassword({ email: user.email, password: user.password });
    if (signedIn.error || !signedIn.data.session) return { ok: false, reason: signedIn.error?.message || 'no session' };
    const response = await fetch(`${baseUrl}/api/dashboard/metrics`, { headers: { Authorization: `Bearer ${signedIn.data.session.access_token}` } });
    loginDone += 1;
    if (loginDone % 25 === 0 || loginDone === users.length) console.log(`CONCURRENT USERS ${loginDone}/${users.length}`);
    return { ok: response.ok, status: response.status };
  });

  const successfulLogins = loginResults.filter(result => result.ok).length;
  console.log(JSON.stringify({
    success: true,
    target: baseUrl,
    syntheticSchoolsCreated: schools.length,
    syntheticUsersCreated: users.length,
    concurrentLoginChecks: loginResults.length,
    successfulLoginChecks: successfulLogins,
    failedLoginChecks: loginResults.length - successfulLogins,
    note: 'Synthetic records remain available for an explicit cleanup/archive pass by their LOADTEST prefix.',
  }));
}

main().catch(error => {
  console.error(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
});
