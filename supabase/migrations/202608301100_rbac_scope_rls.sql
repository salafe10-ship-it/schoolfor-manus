-- Tenant/school scope protection for the canonical RBAC tables.
-- Platform administration uses the trusted server path; browser clients only
-- receive rows covered by their established app.* context.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.roles') IS NULL
     OR to_regclass('public.permissions') IS NULL
     OR to_regclass('public.role_permissions') IS NULL
     OR to_regclass('public.user_roles') IS NULL THEN
    RAISE EXCEPTION 'RBAC_SCHEMA_INCOMPLETE';
  END IF;
END;
$$;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.roles, public.permissions, public.role_permissions, public.user_roles FROM anon;
GRANT SELECT ON TABLE public.roles, public.permissions, public.role_permissions, public.user_roles TO authenticated;

DROP POLICY IF EXISTS p_roles_select_scope ON public.roles;
CREATE POLICY p_roles_select_scope ON public.roles
  FOR SELECT TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND (school_id IS NULL OR school_id::text = current_setting('app.school_id', true))
    AND (branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
  );

DROP POLICY IF EXISTS p_permissions_select_scope ON public.permissions;
CREATE POLICY p_permissions_select_scope ON public.permissions
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL
    OR tenant_id::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS p_role_permissions_select_scope ON public.role_permissions;
CREATE POLICY p_role_permissions_select_scope ON public.role_permissions
  FOR SELECT TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND EXISTS (
      SELECT 1 FROM public.roles r
       WHERE r.tenant_id = role_permissions.tenant_id
         AND r.id = role_permissions.role_id
         AND (r.school_id IS NULL OR r.school_id::text = current_setting('app.school_id', true))
    )
  );

DROP POLICY IF EXISTS p_user_roles_select_scope ON public.user_roles;
CREATE POLICY p_user_roles_select_scope ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND (school_id IS NULL OR school_id::text = current_setting('app.school_id', true))
    AND (branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
  );

NOTIFY pgrst, 'reload schema';
COMMIT;
