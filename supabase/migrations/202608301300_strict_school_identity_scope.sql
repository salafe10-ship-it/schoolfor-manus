-- Strict school visibility for ordinary school identities.
-- Platform administration is deliberately handled by the trusted server path.

BEGIN;

DROP POLICY IF EXISTS p_dbsec004_schools_select ON public.schools;
CREATE POLICY p_dbsec004_schools_select ON public.schools
  FOR SELECT TO authenticated
  USING (
    public.dbsec003_is_super_admin()
    OR (
      tenant_id = public.dbsec004_current_tenant_id()
      AND id = public.dbsec004_current_school_id()
    )
  );

DROP POLICY IF EXISTS p_dbsec004_users_select ON public.users;
CREATE POLICY p_dbsec004_users_select ON public.users
  FOR SELECT TO authenticated
  USING (
    public.dbsec003_is_super_admin()
    OR (
      tenant_id = public.dbsec004_current_tenant_id()
      AND (school_id IS NULL OR school_id = public.dbsec004_current_school_id())
    )
  );

COMMIT;
