-- Gate 1.8R: platform-scoped RLS design only.
-- This file is not executed in this phase. It never derives authority from tenant/school/branch input.

BEGIN;

CREATE OR REPLACE FUNCTION public.dbsec_platform_has_permission(p_permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    lower(btrim(p_permission_key)) = 'platform.admin'
    AND EXISTS (
      SELECT 1
        FROM public.platform_users pu
        JOIN public.platform_user_roles pur
          ON pur.platform_user_id = pu.id
        JOIN public.platform_roles pr
          ON pr.id = pur.role_id
        JOIN public.platform_role_permissions prp
          ON prp.role_id = pr.id
        JOIN public.platform_permissions pp
          ON pp.id = prp.permission_id
       WHERE pu.auth_user_id = auth.uid()
         AND pu.status = 'active'
         AND pu.deleted_at IS NULL
         AND pur.status = 'active'
         AND pur.deleted_at IS NULL
         AND pur.starts_at <= now()
         AND (pur.ends_at IS NULL OR pur.ends_at > now())
         AND pr.role_key = 'platformadmin'
         AND pr.status = 'active'
         AND pr.deleted_at IS NULL
         AND pp.permission_key = 'Platform.Admin'
         AND pp.status = 'active'
         AND pp.deleted_at IS NULL
         AND prp.status = 'active'
         AND prp.deleted_at IS NULL
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.dbsec_platform_has_permission(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dbsec_platform_has_permission(text) TO authenticated;

ALTER TABLE public.platform_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_user_roles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.platform_users FROM anon;
REVOKE ALL ON TABLE public.platform_roles FROM anon;
REVOKE ALL ON TABLE public.platform_permissions FROM anon;
REVOKE ALL ON TABLE public.platform_role_permissions FROM anon;
REVOKE ALL ON TABLE public.platform_user_roles FROM anon;

GRANT SELECT ON TABLE public.platform_users TO authenticated;
GRANT SELECT ON TABLE public.platform_roles TO authenticated;
GRANT SELECT ON TABLE public.platform_permissions TO authenticated;
GRANT SELECT ON TABLE public.platform_role_permissions TO authenticated;
GRANT SELECT ON TABLE public.platform_user_roles TO authenticated;

DROP POLICY IF EXISTS p_platform_users_self_select ON public.platform_users;
DROP POLICY IF EXISTS p_platform_users_select_self ON public.platform_users;
CREATE POLICY p_platform_users_select_self ON public.platform_users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() AND status = 'active' AND deleted_at IS NULL);

DROP POLICY IF EXISTS p_platform_users_select_admin ON public.platform_users;
CREATE POLICY p_platform_users_select_admin ON public.platform_users
  FOR SELECT TO authenticated
  USING (public.dbsec_platform_has_permission('Platform.Admin'));

DROP POLICY IF EXISTS p_platform_roles_select_admin ON public.platform_roles;
CREATE POLICY p_platform_roles_select_admin ON public.platform_roles
  FOR SELECT TO authenticated
  USING (public.dbsec_platform_has_permission('Platform.Admin'));

DROP POLICY IF EXISTS p_platform_permissions_select_admin ON public.platform_permissions;
CREATE POLICY p_platform_permissions_select_admin ON public.platform_permissions
  FOR SELECT TO authenticated
  USING (public.dbsec_platform_has_permission('Platform.Admin'));

DROP POLICY IF EXISTS p_platform_role_permissions_select_admin ON public.platform_role_permissions;
CREATE POLICY p_platform_role_permissions_select_admin ON public.platform_role_permissions
  FOR SELECT TO authenticated
  USING (public.dbsec_platform_has_permission('Platform.Admin'));

DROP POLICY IF EXISTS p_platform_user_roles_select_self_or_admin ON public.platform_user_roles;
CREATE POLICY p_platform_user_roles_select_self_or_admin ON public.platform_user_roles
  FOR SELECT TO authenticated
  USING (
    public.dbsec_platform_has_permission('Platform.Admin')
    OR EXISTS (
      SELECT 1
        FROM public.platform_users pu
       WHERE pu.id = platform_user_roles.platform_user_id
         AND pu.auth_user_id = auth.uid()
         AND pu.status = 'active'
         AND pu.deleted_at IS NULL
    )
  );

-- No INSERT/UPDATE/DELETE policies are defined for authenticated users.
-- Database-owned deployment activation must use a controlled server credential.
-- Tenant-table RLS policies are intentionally not changed in this migration.

COMMENT ON TABLE public.platform_users IS
    'Platform identity records; client self-read is limited to auth.uid().';
COMMENT ON TABLE public.platform_roles IS
    'Platform-scoped roles; catalog management is deployment-controlled.';
COMMENT ON TABLE public.platform_permissions IS
    'Platform-scoped permissions; catalog management is deployment-controlled and wildcard-free.';
COMMENT ON TABLE public.platform_role_permissions IS
    'Platform role-to-permission links; client writes are denied by default.';
COMMENT ON TABLE public.platform_user_roles IS
    'Platform user-to-role links; client writes are denied by default.';

COMMIT;

-- Rollback design (manual review only; never run automatically):
-- DROP POLICY IF EXISTS p_platform_user_roles_select_self_or_admin ON public.platform_user_roles;
-- DROP POLICY IF EXISTS p_platform_role_permissions_select_admin ON public.platform_role_permissions;
-- DROP POLICY IF EXISTS p_platform_permissions_select_admin ON public.platform_permissions;
-- DROP POLICY IF EXISTS p_platform_roles_select_admin ON public.platform_roles;
-- DROP POLICY IF EXISTS p_platform_users_select_admin ON public.platform_users;
-- DROP POLICY IF EXISTS p_platform_users_select_self ON public.platform_users;
-- DROP FUNCTION public.dbsec_platform_has_permission(text);
