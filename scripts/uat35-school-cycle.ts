import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';

const MODE = process.argv[2] || 'preflight';
const TARGET = process.env.UAT35_TARGET || '';
const APPLY_CONFIRMATION = 'SCHOOLFORMANUS_UAT35_APPLY';
const CLEANUP_CONFIRMATION = 'SCHOOLFORMANUS_UAT35_CLEANUP';
const SCHOOL_PREFIX = 'UAT35-';
const REQUIRED_TABLES = [
  'tenants', 'schools', 'branches', 'users', 'hr_database', 'roles', 'permissions',
  'role_permissions', 'user_roles', 'inventory_database', 'financial_portal_snapshots',
  'students', 'buses', 'uniforms', 'student_transportation', 'student_uniform_accounts',
] as const;

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('UAT35_DATABASE_URL_MISSING');

const pool = new Pool({
  connectionString,
  max: 1,
  connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
  ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false },
});

type Scope = { tenantId: string; actorId: string };

function assertTarget(mode: string) {
  if (TARGET !== 'schoolfor-manus-staging') throw new Error('UAT35_TARGET_MUST_BE_SCHOOLFORMANUS_STAGING');
  if (mode === 'apply' && process.env.UAT35_CONFIRM !== APPLY_CONFIRMATION) {
    throw new Error('UAT35_APPLY_CONFIRMATION_REQUIRED');
  }
  if (mode === 'cleanup' && process.env.UAT35_CONFIRM !== CLEANUP_CONFIRMATION) {
    throw new Error('UAT35_CLEANUP_CONFIRMATION_REQUIRED');
  }
}

async function verifySchema(client: PoolClient) {
  const result = await client.query<{ table_name: string; rls_enabled: boolean; force_rls: boolean }>(
    `SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = ANY($1::text[])
      ORDER BY c.relname`,
    [REQUIRED_TABLES],
  );
  const missing = REQUIRED_TABLES.filter((table) => !result.rows.some((row) => row.table_name === table));
  const unprotected = result.rows
    .filter((row) => ['buses', 'uniforms', 'student_transportation', 'student_uniform_accounts', 'hr_database'].includes(row.table_name))
    .filter((row) => !row.rls_enabled || !row.force_rls)
    .map((row) => row.table_name);
  if (missing.length > 0) throw new Error(`UAT35_SCHEMA_MISSING:${missing.join(',')}`);
  if (unprotected.length > 0) throw new Error(`UAT35_SCHEMA_NOT_STRICT:${unprotected.join(',')}`);
}

async function resolveScope(client: PoolClient): Promise<Scope> {
  const result = await client.query<{ tenant_id: string; actor_id: string }>(
    `SELECT s.tenant_id::text AS tenant_id, u.id::text AS actor_id
       FROM public.schools s
       JOIN public.users u ON u.tenant_id = s.tenant_id
      WHERE s.display_name ILIKE '%UAT-B%'
        AND s.status = 'active' AND s.deleted_at IS NULL
        AND u.status = 'active' AND u.deleted_at IS NULL
      ORDER BY u.created_at ASC
      LIMIT 1`,
  );
  if (result.rowCount !== 1) throw new Error('UAT35_ANCHOR_SCOPE_NOT_FOUND');
  return { tenantId: result.rows[0].tenant_id, actorId: result.rows[0].actor_id };
}

async function reportCounts(client: PoolClient) {
  const result = await client.query<{ schools: string; branches: string; students: string; hr_rows: string; buses: string; uniforms: string; transports: string; uniform_accounts: string }>(
    `SELECT
       (SELECT COUNT(*) FROM public.schools WHERE school_code LIKE $1) AS schools,
       (SELECT COUNT(*) FROM public.branches b JOIN public.schools s ON s.id = b.school_id WHERE s.school_code LIKE $1) AS branches,
       (SELECT COUNT(*) FROM public.students s WHERE s.student_number LIKE $1) AS students,
       (SELECT COUNT(*) FROM public.hr_database h JOIN public.schools s ON s.id = h.school_id WHERE s.school_code LIKE $1) AS hr_rows,
       (SELECT COUNT(*) FROM public.buses b WHERE b.id LIKE $1) AS buses,
       (SELECT COUNT(*) FROM public.uniforms u WHERE u.id LIKE $1) AS uniforms,
       (SELECT COUNT(*) FROM public.student_transportation t WHERE t.id LIKE $1) AS transports,
       (SELECT COUNT(*) FROM public.student_uniform_accounts a WHERE a.id LIKE $1) AS uniform_accounts`,
    [`${SCHOOL_PREFIX}%`],
  );
  return result.rows[0];
}

async function createUatData(client: PoolClient, scope: Scope) {
  const existing = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM public.schools WHERE school_code LIKE $1`,
    [`${SCHOOL_PREFIX}%`],
  );
  if (Number(existing.rows[0].count) > 0) throw new Error('UAT35_DATA_ALREADY_EXISTS_USE_VERIFY_OR_CLEANUP');

  for (let index = 1; index <= 35; index += 1) {
    const schoolId = randomUUID();
    const branchId = randomUUID();
    const code = `${SCHOOL_PREFIX}${String(index).padStart(2, '0')}`;
    const studentIds = [randomUUID(), randomUUID()];

    await client.query(
      `INSERT INTO public.schools (id, tenant_id, school_code, legal_name, display_name, timezone, locale, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $4, 'Africa/Khartoum', 'ar', 'active', $5, $5)`,
      [schoolId, scope.tenantId, code, `${code} School`, scope.actorId],
    );
    await client.query(
      `INSERT INTO public.branches (id, tenant_id, school_id, branch_code, name, address, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, 'الفرع الرئيسي للاختبار', $5::jsonb, 'active', $6, $6)`,
      [branchId, scope.tenantId, schoolId, `${code}-MAIN`, JSON.stringify({ city: 'الخرطوم', uat: true }), scope.actorId],
    );

    for (let studentIndex = 0; studentIndex < studentIds.length; studentIndex += 1) {
      await client.query(
        `INSERT INTO public.students (id, tenant_id, school_id, branch_id, student_number, legal_first_name, legal_last_name, date_of_birth, gender, nationality, birth_country_code, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'UAT', '2015-01-01', 'other', 'SD', 'SD', 'active', $7, $7)`,
        [studentIds[studentIndex], scope.tenantId, schoolId, branchId, `${code}-ST-${studentIndex + 1}`, `طالب ${code}-${studentIndex + 1}`, scope.actorId],
      );
    }

    const jobs = ['schooladmin', 'finance', 'transport', 'uniform', 'student-affairs'];
    const employeeData = jobs.map((job, jobIndex) => ({
      id: `${code}-EMP-${jobIndex + 1}`,
      employeeNumber: `${code}-EMP-${jobIndex + 1}`,
      name: `موظف اختبار ${code} ${jobIndex + 1}`,
      jobTitle: job,
      department: job === 'finance' ? 'المالية' : job === 'transport' ? 'النقل' : job === 'uniform' ? 'الزي' : 'الإدارة',
      status: 'active',
      permissions: job === 'finance' ? ['Financial.Read', 'Financial.Write'] : [`${job}.Read`],
    }));
    const hrData = {
      jobs: jobs.map((job, jobIndex) => ({ id: `${code}-JOB-${jobIndex + 1}`, code: `${code}-JOB-${jobIndex + 1}`, name: job })),
      employees: employeeData,
      departments: ['الإدارة', 'المالية', 'النقل', 'الزي', 'شؤون الطلاب'],
      contracts: employeeData.map((employee) => ({ id: `${employee.id}-CONTRACT`, employeeId: employee.id, status: 'active' })),
      settings: { source: 'UAT35', schoolCode: code },
    };
    await client.query(
      `INSERT INTO public.hr_database (tenant_id, school_id, country_code, legal_configuration, data, version, updated_by)
       VALUES ($1, $2, 'SD', $3::jsonb, $4::jsonb, 1, $5)`,
      [scope.tenantId, schoolId, JSON.stringify({ source: 'UAT35', country: 'SD' }), JSON.stringify(hrData), scope.actorId],
    );

    const permissionId = randomUUID();
    const roleId = randomUUID();
    await client.query(
      `INSERT INTO public.permissions (id, tenant_id, permission_key, resource, action, description, status, created_by, updated_by)
       VALUES ($1, $2, $3, 'uat35', 'read', 'UAT-35 school permission', 'active', $4, $4)`,
      [permissionId, scope.tenantId, `uat35.${code.toLowerCase()}.read`, scope.actorId],
    );
    await client.query(
      `INSERT INTO public.roles (id, tenant_id, school_id, branch_id, role_key, name, description, is_system, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, 'مدير اختبار المدرسة', 'UAT-35 role', false, 'active', $6, $6)`,
      [roleId, scope.tenantId, schoolId, branchId, `uat35.${code.toLowerCase()}.schooladmin`, scope.actorId],
    );
    await client.query(
      `INSERT INTO public.role_permissions (tenant_id, role_id, permission_id, status, created_by, updated_by)
       VALUES ($1, $2, $3, 'active', $4, $4)`,
      [scope.tenantId, roleId, permissionId, scope.actorId],
    );
    await client.query(
      `INSERT INTO public.user_roles (tenant_id, user_id, role_id, school_id, branch_id, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, 'active', $2, $2)`,
      [scope.tenantId, scope.actorId, roleId, schoolId, branchId],
    );

    const inventoryData = {
      items: [{ id: `${code}-INV-1`, code: `${code}-INV-1`, name: 'دفتر اختبار', quantity: 100, schoolId }],
      purchaseOrders: [{ id: `${code}-PO-1`, status: 'received', total: 1000, schoolId }],
      stockTransactions: [{ id: `${code}-STOCK-1`, type: 'purchase', quantity: 100, schoolId }],
      source: 'UAT35',
    };
    await client.query(
      `INSERT INTO public.inventory_database (tenant_id, school_id, data, version, updated_by)
       VALUES ($1, $2, $3::jsonb, 1, $4)`,
      [scope.tenantId, schoolId, JSON.stringify(inventoryData), scope.actorId],
    );
    const financialData = {
      invoices: [{ id: `${code}-INV-F-1`, amount: 1000, status: 'posted', schoolId }],
      paymentVouchers: [{ id: `${code}-PV-1`, amount: 500, status: 'approved', schoolId }],
      journalEntries: [{ id: `${code}-JE-1`, debit: 1000, credit: 1000, status: 'posted', schoolId }],
      source: 'UAT35',
    };
    await client.query(
      `INSERT INTO public.financial_portal_snapshots (tenant_id, school_id, data, version, updated_by)
       VALUES ($1, $2, $3::jsonb, 1, $4)`,
      [scope.tenantId, schoolId, JSON.stringify(financialData), scope.actorId],
    );

    await client.query(
      `INSERT INTO public.buses (id, tenant_id, school_id, branch_id, route_number, driver_name, capacity, current_students, status, data, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, 'سائق اختبار', 30, 1, 'active', $6::jsonb, $7, $7)`,
      [`${code}-BUS-1`, scope.tenantId, schoolId, branchId, `${code}-R1`, JSON.stringify({ source: 'UAT35' }), scope.actorId],
    );
    await client.query(
      `INSERT INTO public.uniforms (id, tenant_id, school_id, branch_id, code, name, status, data, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, 'زي اختبار', 'active', $6::jsonb, $7, $7)`,
      [`${code}-UNI-1`, scope.tenantId, schoolId, branchId, `${code}-UNI-1`, JSON.stringify({ quantity: 50, source: 'UAT35' }), scope.actorId],
    );
    await client.query(
      `INSERT INTO public.student_transportation (id, tenant_id, school_id, branch_id, student_id, route_number, pickup_point, drop_off_point, status, monthly_fees, data, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'نقطة اختبار 1', 'المدرسة', 'active', 250, $7::jsonb, $8, $8)`,
      [`${code}-TR-1`, scope.tenantId, schoolId, branchId, studentIds[0], `${code}-R1`, JSON.stringify({ source: 'UAT35' }), scope.actorId],
    );
    await client.query(
      `INSERT INTO public.student_uniform_accounts (id, tenant_id, school_id, branch_id, student_id, uniform_size, pieces_received_count, status, payment_status, total_fees, data, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, 'M', 2, 'active', 'unpaid', 350, $6::jsonb, $7, $7)`,
      [`${code}-UA-1`, scope.tenantId, schoolId, branchId, studentIds[1], JSON.stringify({ source: 'UAT35' }), scope.actorId],
    );
  }
}

async function cleanupUatData(client: PoolClient) {
  await client.query(`DELETE FROM public.student_transportation WHERE id LIKE $1`, [`${SCHOOL_PREFIX}%`]);
  await client.query(`DELETE FROM public.student_uniform_accounts WHERE id LIKE $1`, [`${SCHOOL_PREFIX}%`]);
  await client.query(`DELETE FROM public.buses WHERE id LIKE $1`, [`${SCHOOL_PREFIX}%`]);
  await client.query(`DELETE FROM public.uniforms WHERE id LIKE $1`, [`${SCHOOL_PREFIX}%`]);
  await client.query(`DELETE FROM public.inventory_database WHERE school_id IN (SELECT id FROM public.schools WHERE school_code LIKE $1)`, [`${SCHOOL_PREFIX}%`]);
  await client.query(`DELETE FROM public.financial_portal_snapshots WHERE school_id IN (SELECT id FROM public.schools WHERE school_code LIKE $1)`, [`${SCHOOL_PREFIX}%`]);
  await client.query(`DELETE FROM public.hr_database WHERE school_id IN (SELECT id FROM public.schools WHERE school_code LIKE $1)`, [`${SCHOOL_PREFIX}%`]);
  await client.query(`DELETE FROM public.user_roles WHERE school_id IN (SELECT id FROM public.schools WHERE school_code LIKE $1)`, [`${SCHOOL_PREFIX}%`]);
  await client.query(`DELETE FROM public.role_permissions WHERE role_id IN (SELECT id FROM public.roles WHERE role_key LIKE $1)`, ['uat35.%']);
  await client.query(`DELETE FROM public.roles WHERE role_key LIKE $1`, ['uat35.%']);
  await client.query(`DELETE FROM public.permissions WHERE permission_key LIKE $1`, ['uat35.%']);
  await client.query(`DELETE FROM public.students WHERE student_number LIKE $1`, [`${SCHOOL_PREFIX}%`]);
  await client.query(`DELETE FROM public.branches WHERE school_id IN (SELECT id FROM public.schools WHERE school_code LIKE $1)`, [`${SCHOOL_PREFIX}%`]);
  await client.query(`DELETE FROM public.schools WHERE school_code LIKE $1`, [`${SCHOOL_PREFIX}%`]);
}

async function repairUatRoleAssignments(client: PoolClient, scope: Scope) {
  await client.query(
    `INSERT INTO public.user_roles (tenant_id, user_id, role_id, school_id, branch_id, status, created_by, updated_by)
     SELECT r.tenant_id, $1, r.id, r.school_id, r.branch_id, 'active', $1, $1
       FROM public.roles r
      WHERE r.role_key LIKE 'uat35.%'
        AND NOT EXISTS (
          SELECT 1 FROM public.user_roles ur
           WHERE ur.user_id = $1 AND ur.role_id = r.id
             AND ur.school_id = r.school_id AND ur.branch_id = r.branch_id
             AND ur.status = 'active'
        )`,
    [scope.actorId],
  );
}

async function main() {
  assertTarget(MODE);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await verifySchema(client);
    if (MODE === 'preflight') {
      const scope = await resolveScope(client);
      const counts = await reportCounts(client);
      console.log(JSON.stringify({ mode: MODE, anchorAvailable: Boolean(scope.actorId), counts }, null, 2));
    } else if (MODE === 'verify') {
      const counts = await reportCounts(client);
      if (Number(counts.schools) !== 35) throw new Error(`UAT35_EXPECTED_35_SCHOOLS:${counts.schools}`);
      console.log(JSON.stringify({ mode: MODE, counts, passed: true }, null, 2));
    } else if (MODE === 'apply') {
      const scope = await resolveScope(client);
      await createUatData(client, scope);
      const counts = await reportCounts(client);
      if (Number(counts.schools) !== 35 || Number(counts.branches) !== 35 || Number(counts.students) !== 70 || Number(counts.hr_rows) !== 35) {
        throw new Error(`UAT35_POST_APPLY_COUNT_MISMATCH:${JSON.stringify(counts)}`);
      }
      console.log(JSON.stringify({ mode: MODE, counts, passed: true }, null, 2));
    } else if (MODE === 'repair') {
      const scope = await resolveScope(client);
      await repairUatRoleAssignments(client, scope);
      const counts = await reportCounts(client);
      console.log(JSON.stringify({ mode: MODE, counts, passed: true }, null, 2));
    } else if (MODE === 'cleanup') {
      await cleanupUatData(client);
      const counts = await reportCounts(client);
      if (Object.values(counts).some((count) => Number(count) !== 0)) throw new Error(`UAT35_CLEANUP_INCOMPLETE:${JSON.stringify(counts)}`);
      console.log(JSON.stringify({ mode: MODE, counts, passed: true }, null, 2));
    } else {
      throw new Error('UAT35_MODE_MUST_BE_PREFLIGHT_VERIFY_REPAIR_APPLY_OR_CLEANUP');
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('UAT35_CYCLE_FAILED', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
