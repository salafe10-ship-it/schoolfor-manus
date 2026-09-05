import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.PLATFORM_ADMIN_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_CONNECTION_MISSING');
const pool = new Pool({ connectionString, max: 1, ssl: connectionString.includes('localhost') ? undefined : { rejectUnauthorized: false } });

try {
  const result = await pool.query<{
    active_tenants: string; active_schools: string; active_branches: string; active_users: string; auth_users: string;
    school_name: string; admin_platform_access: boolean; maha_platform_access: boolean; admin_permissions: string; maha_permissions: string;
    admin_username_resolves: boolean; maha_username_resolves: boolean; storage_objects: string;
  }>(`
    SELECT
      (SELECT count(*)::text FROM public.tenants WHERE status = 'active' AND deleted_at IS NULL) AS active_tenants,
      (SELECT count(*)::text FROM public.schools WHERE status = 'active' AND deleted_at IS NULL) AS active_schools,
      (SELECT count(*)::text FROM public.branches WHERE status = 'active' AND deleted_at IS NULL) AS active_branches,
      (SELECT count(*)::text FROM public.users WHERE status = 'active' AND deleted_at IS NULL) AS active_users,
      (SELECT count(*)::text FROM auth.users) AS auth_users,
      (SELECT legal_name FROM public.schools WHERE status = 'active' AND deleted_at IS NULL LIMIT 1) AS school_name,
      EXISTS (
        SELECT 1 FROM public.platform_users pu
        JOIN public.platform_user_roles pur ON pur.platform_user_id = pu.id AND pur.status = 'active' AND pur.deleted_at IS NULL
        JOIN public.platform_roles pr ON pr.id = pur.role_id AND pr.role_key = 'platformadmin' AND pr.status = 'active' AND pr.deleted_at IS NULL
        WHERE pu.auth_user_id = (SELECT auth_user_id FROM public.users WHERE username = 'admin' AND deleted_at IS NULL)
          AND pu.status = 'active' AND pu.deleted_at IS NULL
      ) AS admin_platform_access,
      EXISTS (
        SELECT 1 FROM public.platform_users pu
        WHERE pu.auth_user_id = (SELECT auth_user_id FROM public.users WHERE username = 'مها صالح' AND deleted_at IS NULL)
          AND pu.status = 'active' AND pu.deleted_at IS NULL
      ) AS maha_platform_access,
      (SELECT count(DISTINCT rp.permission_id)::text FROM public.user_roles ur JOIN public.role_permissions rp ON rp.role_id = ur.role_id AND rp.status = 'active' AND rp.deleted_at IS NULL WHERE ur.user_id = (SELECT id FROM public.users WHERE username = 'admin' AND deleted_at IS NULL) AND ur.status = 'active' AND ur.deleted_at IS NULL) AS admin_permissions,
      (SELECT count(DISTINCT rp.permission_id)::text FROM public.user_roles ur JOIN public.role_permissions rp ON rp.role_id = ur.role_id AND rp.status = 'active' AND rp.deleted_at IS NULL WHERE ur.user_id = (SELECT id FROM public.users WHERE username = 'مها صالح' AND deleted_at IS NULL) AND ur.status = 'active' AND ur.deleted_at IS NULL) AS maha_permissions,
      public.dbsec004_resolve_login_username('admin') = 'admin@modern-family.local' AS admin_username_resolves,
      public.dbsec004_resolve_login_username('مها صالح') = 'maha.saleh@modern-family.local' AS maha_username_resolves,
      (SELECT count(*)::text FROM storage.objects) AS storage_objects
  `);
  const state = result.rows[0];
  const valid = state?.active_tenants === '1' && state.active_schools === '1' && state.active_branches === '1'
    && state.active_users === '2' && state.auth_users === '2' && state.school_name === 'مدارس الاسرة الحديثة'
    && state.admin_platform_access && !state.maha_platform_access && state.admin_permissions === state.maha_permissions
    && Number(state.maha_permissions) > 0 && state.admin_username_resolves && state.maha_username_resolves && state.storage_objects === '0';
  console.log(JSON.stringify({ success: valid, ...state }));
  if (!valid) process.exitCode = 1;
} finally {
  await pool.end();
}
