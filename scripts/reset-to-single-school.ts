import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool, type PoolClient } from 'pg';
import { permissionRegistry, PERMISSIONS } from '../src/authorization/PermissionRegistry.js';

/**
 * Destructive production hand-over bootstrap.
 *
 * This intentionally clears application and Auth data while retaining the
 * database schema, then creates the two accounts and the one school requested
 * by the owner.  It is guarded by both an explicit confirmation phrase and
 * the immutable project reference so it cannot be reused accidentally.
 */
const EXPECTED_PROJECT_REF = 'wjhraxvxvvthxqlpyohh';
const REQUIRED_CONFIRMATION = 'RESET_TO_SINGLE_SCHOOL';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123456789admin';
const MAHA_USERNAME = 'مها صالح';
const MAHA_PASSWORD = '123';
const SCHOOL_NAME = 'مدارس الاسرة الحديثة';

type MigrationResult = { file: string; applied: boolean };

function required(value: string | undefined, code: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function withoutTransactionEnvelope(sql: string): string {
  return sql
    .replace(/^\s*BEGIN\s*;\s*/im, '')
    .replace(/\s*COMMIT\s*;\s*$/im, '');
}

function permissionParts(permission: string): { resource: string; action: string } {
  const [resource, ...actions] = permission.split('.');
  return { resource, action: actions.join('.') || 'Access' };
}

async function applyMigration(client: PoolClient, relativePath: string): Promise<MigrationResult> {
  const sql = withoutTransactionEnvelope(await readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8'));
  await client.query(sql);
  return { file: relativePath, applied: true };
}

async function main() {
  const confirmation = required(process.env.RESET_TO_SINGLE_SCHOOL_CONFIRMATION, 'RESET_CONFIRMATION_REQUIRED');
  if (confirmation !== REQUIRED_CONFIRMATION) throw new Error('RESET_CONFIRMATION_INVALID');

  const supabaseUrl = required(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, 'SUPABASE_URL_REQUIRED');
  const connectionString = required(
    process.env.PLATFORM_ADMIN_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL,
    'DATABASE_CONNECTION_REQUIRED',
  );
  if (!supabaseUrl.includes(EXPECTED_PROJECT_REF) || !connectionString.includes(EXPECTED_PROJECT_REF)) {
    throw new Error('TARGET_PROJECT_REF_MISMATCH');
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 15_000,
    ssl: connectionString.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });

  console.error('RESET_STARTED');
  const client = await pool.connect();
  console.error('RESET_CONNECTED');
  let stage = 'start';
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '10s'");
    // Keep diagnostics below the desktop command watchdog; any blocked
    // statement rolls back instead of leaving a partially known operation.
    await client.query("SET LOCAL statement_timeout = '20s'");
    try {
      stage = 'read-auth-instance';
      // Some older Supabase projects have no auth.instances row even though
      // their existing Auth records use the conventional zero instance id.
      // Reuse the live convention before clearing Auth, then use that safe
      // conventional value only when the legacy project has neither source.
      const instance = await client.query<{ id: string }>(`
        SELECT id FROM auth.instances ORDER BY created_at ASC LIMIT 1
      `);
      const inheritedInstance = await client.query<{ instance_id: string | null }>(`
        SELECT instance_id FROM auth.users WHERE instance_id IS NOT NULL LIMIT 1
      `);
      const instanceId = instance.rows[0]?.id
        || inheritedInstance.rows[0]?.instance_id
        || '00000000-0000-0000-0000-000000000000';

      stage = 'discover-public-tables';
      const publicTables = await client.query<{ table_name: string }>(`
        SELECT c.relname AS table_name
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relkind IN ('r', 'p')
           AND c.relname NOT IN ('schema_migrations', 'supabase_migrations', 'spatial_ref_sys')
         ORDER BY c.relname
      `);
      if (publicTables.rows.length) {
        stage = 'clear-public-data';
        const tables = publicTables.rows.map(({ table_name }) => `public.${quoteIdentifier(table_name)}`).join(', ');
        await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
      }

      stage = 'verify-storage-is-empty';
      const storageObjects = await client.query<{ count: string }>('SELECT count(*)::text AS count FROM storage.objects');
      // Supabase Storage deliberately rejects direct SQL deletion. A project
      // with stored files must be cleaned through its privileged Storage API;
      // do not claim a clean hand-over if that API credential is absent.
      if (Number(storageObjects.rows[0]?.count || 0) > 0) {
        throw new Error('STORAGE_OBJECTS_REQUIRE_SERVICE_ROLE_CLEANUP');
      }
      // The managed Auth schema owns some sequences, so PostgreSQL correctly
      // rejects TRUNCATE ... RESTART IDENTITY for this maintenance role. A
      // row delete follows the Auth foreign-key cascades without requiring
      // sequence ownership and leaves the managed schema intact.
      stage = 'clear-auth-users';
      await client.query('DELETE FROM auth.users');
      await client.query('DELETE FROM auth.audit_log_entries');

      stage = 'apply-canonical-migrations';
      const migrations: MigrationResult[] = [];
      for (const migration of [
        'supabase/migrations/202609031000_library_canonical.sql',
        'supabase/migrations/202609031200_fixed_assets_canonical.sql',
        'supabase/migrations/202609031300_uniform_inventory_sales.sql',
        'supabase/migrations/202609031400_arabic_username_login.sql',
        'supabase/migrations/202609051000_unrestricted_username_login.sql',
        'supabase/migrations/202609051100_owner_workspace_releases.sql',
      ]) migrations.push(await applyMigration(client, migration));

      const tenantId = randomUUID();
      const schoolId = randomUUID();
      const branchId = randomUUID();
      const adminAuthId = randomUUID();
      const mahaAuthId = randomUUID();
      const adminUserId = randomUUID();
      const mahaUserId = randomUUID();
      const platformRoleId = randomUUID();
      const platformPermissionId = randomUUID();
      const platformUserId = randomUUID();
      const schoolAdminRoleId = randomUUID();
      const schoolOwnerRoleId = randomUUID();

      stage = 'create-tenant-and-school';
      await client.query(`
        INSERT INTO public.tenants (id, legal_name, slug, plan_code, status)
        VALUES ($1, $2, 'modern-family-schools', 'enterprise', 'active')
      `, [tenantId, SCHOOL_NAME]);
      await client.query(`
        INSERT INTO public.subscriptions (tenant_id, plan_code, starts_at, seat_limit, auto_renew, status)
        VALUES ($1, 'enterprise', now(), 1000, true, 'active')
      `, [tenantId]);
      await client.query(`
        INSERT INTO public.schools (id, tenant_id, school_code, legal_name, display_name, timezone, locale, status)
        VALUES ($1, $2, 'MODERN-FAMILY', $3, $3, 'Africa/Khartoum', 'ar', 'active')
      `, [schoolId, tenantId, SCHOOL_NAME]);
      await client.query(`
        INSERT INTO public.branches (id, tenant_id, school_id, branch_code, name, address, status)
        VALUES ($1, $2, $3, 'MODERN-FAMILY-MAIN', 'الفرع الرئيسي', '{}'::jsonb, 'active')
      `, [branchId, tenantId, schoolId]);

      const createAuthUser = async (input: {
        authId: string; email: string; password: string; displayName: string; role: 'superadmin' | 'schooladmin'; includePlatformScope: boolean;
      }) => {
        const appMetadata = {
          provider: 'email', providers: ['email'], role: input.role, status: 'active',
          school_id: schoolId, branch_id: branchId, display_name: input.displayName,
          ...(input.includePlatformScope ? { platform_owner: true } : {}),
        };
        await client.query(`
          INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
          ) VALUES (
            $1, $2, 'authenticated', 'authenticated', $3, crypt($4, gen_salt('bf', 10)), now(),
            $5::jsonb, jsonb_build_object('full_name', $6::text), now(), now()
          )
        `, [instanceId, input.authId, input.email, input.password, JSON.stringify(appMetadata), input.displayName]);
        await client.query(`
          INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
          VALUES ($1, $2, $3, $4::jsonb, 'email', now(), now())
        `, [randomUUID(), input.email, input.authId, JSON.stringify({ sub: input.authId, email: input.email, email_verified: true, phone_verified: false })]);
      };

      stage = 'create-auth-users';
      await createAuthUser({
        authId: adminAuthId, email: 'admin@modern-family.local', password: ADMIN_PASSWORD,
        displayName: 'المالك', role: 'superadmin', includePlatformScope: true,
      });
      await createAuthUser({
        authId: mahaAuthId, email: 'maha.saleh@modern-family.local', password: MAHA_PASSWORD,
        displayName: MAHA_USERNAME, role: 'schooladmin', includePlatformScope: false,
      });

      stage = 'create-application-users';
      await client.query(`
        INSERT INTO public.users (id, auth_user_id, tenant_id, school_id, branch_id, display_name, username, email, status, created_by, updated_by)
        VALUES
          ($1, $2, $3, $4, $5, 'المالك', $6, 'admin@modern-family.local', 'active', $1, $1),
          ($7, $8, $3, $4, $5, $9, $10, 'maha.saleh@modern-family.local', 'active', $1, $1)
      `, [adminUserId, adminAuthId, tenantId, schoolId, branchId, ADMIN_USERNAME, mahaUserId, mahaAuthId, MAHA_USERNAME, MAHA_USERNAME]);
      await client.query('UPDATE public.schools SET created_by = $1, updated_by = $1 WHERE id = $2', [adminUserId, schoolId]);
      await client.query('UPDATE public.branches SET created_by = $1, updated_by = $1 WHERE id = $2', [adminUserId, branchId]);

      stage = 'create-platform-rbac';
      await client.query(`
        INSERT INTO public.platform_permissions (id, permission_key, resource, action, status)
        VALUES ($1, $2, 'Platform', 'Admin', 'active')
      `, [platformPermissionId, PERMISSIONS.PLATFORM_ADMIN]);
      stage = 'create-school-rbac';
      await client.query(`
        INSERT INTO public.platform_roles (id, role_key, name, is_system, status)
        VALUES ($1, 'platformadmin', 'Platform Administrator', true, 'active')
      `, [platformRoleId]);
      stage = 'create-clean-module-snapshots';
      await client.query(`
        INSERT INTO public.platform_role_permissions (role_id, permission_id, status)
        VALUES ($1, $2, 'active')
      `, [platformRoleId, platformPermissionId]);
      await client.query(`
        INSERT INTO public.platform_users (id, auth_user_id, status)
        VALUES ($1, $2, 'active')
      `, [platformUserId, adminAuthId]);
      await client.query(`
        INSERT INTO public.platform_user_roles (platform_user_id, role_id, starts_at, status)
        VALUES ($1, $2, now(), 'active')
      `, [platformUserId, platformRoleId]);

      await client.query(`
        INSERT INTO public.roles (id, tenant_id, school_id, branch_id, role_key, name, description, is_system, status, created_by, updated_by)
        VALUES
          ($1, $2, $3, $4, 'schooladmin', 'مدير المدرسة', 'صلاحيات مدرسية كاملة.', true, 'active', $5, $5),
          ($6, $2, $3, $4, 'owner', 'مالك المدرسة', 'صلاحيات مدرسية كاملة للمالك.', true, 'active', $5, $5)
      `, [schoolAdminRoleId, tenantId, schoolId, branchId, adminUserId, schoolOwnerRoleId]);

      const schoolPermissions = [...new Set(permissionRegistry.list()
        .map(permission => permissionRegistry.normalize(permission))
        .filter((permission): permission is string => Boolean(permission) && permission !== PERMISSIONS.PLATFORM_ADMIN))];
      // One remote round-trip for the complete catalog and both full-access
      // roles.  Per-permission inserts make a clean hand-over needlessly slow
      // over the managed database connection.
      await client.query(`
        WITH input AS (
          SELECT permission_key, resource, action
            FROM jsonb_to_recordset($1::jsonb)
              AS item(permission_key text, resource text, action text)
        ), inserted AS (
          INSERT INTO public.permissions (id, permission_key, resource, action, status, created_by, updated_by)
          SELECT gen_random_uuid(), permission_key, resource, action, 'active', $2, $2
            FROM input
          RETURNING id
        )
        INSERT INTO public.role_permissions (id, tenant_id, role_id, permission_id, status, created_by, updated_by)
        SELECT gen_random_uuid(), $3, role_ids.role_id, inserted.id, 'active', $2, $2
          FROM inserted
          CROSS JOIN (VALUES ($4::uuid), ($5::uuid)) AS role_ids(role_id)
      `, [
        JSON.stringify(schoolPermissions.map(permission => ({ permission_key: permission, ...permissionParts(permission) }))),
        adminUserId,
        tenantId,
        schoolAdminRoleId,
        schoolOwnerRoleId,
      ]);
      await client.query(`
        INSERT INTO public.user_roles (tenant_id, user_id, role_id, school_id, branch_id, starts_at, status, created_by, updated_by)
        VALUES
          ($1, $2, $3, $4, $5, now(), 'active', $2, $2),
          ($1, $2, $6, $4, $5, now(), 'active', $2, $2),
          ($1, $7, $3, $4, $5, now(), 'active', $2, $2)
      `, [tenantId, adminUserId, schoolAdminRoleId, schoolId, branchId, schoolOwnerRoleId, mahaUserId]);

      await client.query(`
        INSERT INTO public.academic_years (tenant_id, school_id, branch_id, code, name, starts_on, ends_on, is_current, status, created_by, updated_by)
        VALUES ($1, $2, $3, '2026-2027', 'العام الدراسي 2026-2027', DATE '2026-09-01', DATE '2027-06-30', true, 'active', $4, $4)
      `, [tenantId, schoolId, branchId, adminUserId]);
      await client.query(`
        INSERT INTO public.school_settings (tenant_id, school_id, setting_key, setting_value, status, created_by, updated_by)
        VALUES ($1, $2, 'school_profile', jsonb_build_object('displayName', $3::text, 'primaryBranchId', $4::text, 'productionReady', true), 'active', $5, $5)
      `, [tenantId, schoolId, SCHOOL_NAME, branchId, adminUserId]);

      // Empty, versioned records let these modules start cleanly without a
      // first-write special case.
      await client.query(`
        INSERT INTO public.financial_portal_snapshots (tenant_id, school_id, data, version, updated_by)
        VALUES ($1, $2, '{}'::jsonb, 0, $3)
      `, [tenantId, schoolId, adminUserId]);
      await client.query(`
        INSERT INTO public.hr_database (tenant_id, school_id, country_code, legal_configuration, data, version, updated_by)
        VALUES ($1, $2, 'SD', '{}'::jsonb, '{"employees":[],"departments":[],"jobs":[],"contracts":[],"attendance":[],"leaves":[],"penalties":[],"advances":[],"rewards":[],"performance":[],"documents":[],"settings":{}}'::jsonb, 0, $3)
      `, [tenantId, schoolId, adminUserId]);
      await client.query(`
        INSERT INTO public.inventory_database (tenant_id, school_id, data, version, updated_by)
        VALUES ($1, $2, '{"items":[],"categories":[],"brands":[],"units":[],"suppliers":[],"warehouses":[],"movements":[],"stocktakes":[],"purchaseRequests":[],"rfqs":[],"quotations":[],"purchaseOrders":[],"goodsReceipts":[],"vendorBills":[],"vendorPayments":[],"settings":{},"procurementSettings":{}}'::jsonb, 0, $3)
      `, [tenantId, schoolId, adminUserId]);

      stage = 'verify-handover';
      const verification = await client.query<{
        tenants: string; schools: string; branches: string; public_users: string; auth_users: string; storage_objects: string;
        admin_password_valid: boolean; maha_password_valid: boolean; admin_platform: boolean; maha_platform: boolean; maha_permissions: string;
      }>(`
        SELECT
          (SELECT count(*)::text FROM public.tenants WHERE status = 'active' AND deleted_at IS NULL) AS tenants,
          (SELECT count(*)::text FROM public.schools WHERE legal_name = $1 AND status = 'active' AND deleted_at IS NULL) AS schools,
          (SELECT count(*)::text FROM public.branches WHERE school_id = $2 AND status = 'active' AND deleted_at IS NULL) AS branches,
          (SELECT count(*)::text FROM public.users WHERE status = 'active' AND deleted_at IS NULL) AS public_users,
          (SELECT count(*)::text FROM auth.users) AS auth_users,
          (SELECT count(*)::text FROM storage.objects) AS storage_objects,
          (SELECT crypt($3, encrypted_password) = encrypted_password FROM auth.users WHERE id = $4) AS admin_password_valid,
          (SELECT crypt($5, encrypted_password) = encrypted_password FROM auth.users WHERE id = $6) AS maha_password_valid,
          EXISTS (SELECT 1 FROM public.platform_users pu JOIN public.platform_user_roles pur ON pur.platform_user_id = pu.id AND pur.status = 'active' AND pur.deleted_at IS NULL WHERE pu.auth_user_id = $4 AND pu.status = 'active' AND pu.deleted_at IS NULL) AS admin_platform,
          EXISTS (SELECT 1 FROM public.platform_users WHERE auth_user_id = $6 AND status = 'active' AND deleted_at IS NULL) AS maha_platform,
          (SELECT count(DISTINCT rp.permission_id)::text FROM public.user_roles ur JOIN public.role_permissions rp ON rp.role_id = ur.role_id AND rp.status = 'active' AND rp.deleted_at IS NULL WHERE ur.user_id = $7 AND ur.status = 'active' AND ur.deleted_at IS NULL) AS maha_permissions
      `, [SCHOOL_NAME, schoolId, ADMIN_PASSWORD, adminAuthId, MAHA_PASSWORD, mahaAuthId, mahaUserId]);
      const state = verification.rows[0];
      if (!state || state.tenants !== '1' || state.schools !== '1' || state.branches !== '1' || state.public_users !== '2'
        || state.auth_users !== '2' || state.storage_objects !== '0' || !state.admin_password_valid || !state.maha_password_valid
        || !state.admin_platform || state.maha_platform || state.maha_permissions !== String(schoolPermissions.length)) {
        throw new Error('RESET_VERIFICATION_FAILED');
      }

      stage = 'commit';
      await client.query('COMMIT');
      console.error('RESET_COMMITTED');
      console.log(JSON.stringify({
        success: true,
        projectRef: EXPECTED_PROJECT_REF,
        cleanup: { publicTablesCleared: publicTables.rows.length, storageObjectsRemoved: Number(storageObjects.rows[0]?.count || 0) },
        school: { name: SCHOOL_NAME, activeSchools: 1, activeBranches: 1 },
        accounts: {
          admin: { username: ADMIN_USERNAME, centralPlatformAccess: true, fullSchoolPermissions: schoolPermissions.length },
          maha: { username: MAHA_USERNAME, centralPlatformAccess: false, fullSchoolPermissions: schoolPermissions.length },
        },
        migrations,
      }));
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`RESET_FAILED_AT:${stage}`);
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
