-- P0 live scope security repair for SchoolForManus Supabase project.
-- No seed data, credentials, service-role access, DROP, TRUNCATE, or RESET.
-- Username resolution is deliberately a narrow SECURITY DEFINER bridge because
-- the login identifier is resolved before a Supabase Auth context exists.

BEGIN;

CREATE OR REPLACE FUNCTION public.dbsec004_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.tenant_id
    FROM public.users AS u
   WHERE u.auth_user_id = auth.uid()
     AND u.status = 'active'
     AND u.deleted_at IS NULL
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.dbsec004_current_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.school_id
    FROM public.users AS u
   WHERE u.auth_user_id = auth.uid()
     AND u.status = 'active'
     AND u.deleted_at IS NULL
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.dbsec004_current_branch_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.branch_id
    FROM public.users AS u
   WHERE u.auth_user_id = auth.uid()
     AND u.status = 'active'
     AND u.deleted_at IS NULL
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.dbsec004_resolve_login_username(p_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT lower(btrim(u.email))
    FROM public.users AS u
   WHERE lower(u.username) = lower(btrim(p_username))
     AND u.email IS NOT NULL
     AND u.status = 'active'
     AND u.deleted_at IS NULL
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.dbsec004_current_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dbsec004_current_school_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dbsec004_current_branch_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dbsec004_resolve_login_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dbsec004_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dbsec004_current_school_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dbsec004_current_branch_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dbsec004_resolve_login_username(text) TO anon, authenticated;

REVOKE ALL ON TABLE public.tenants, public.schools, public.branches, public.users FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.schools TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.branches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'p_dbsec004_tenants_select') THEN
    CREATE POLICY p_dbsec004_tenants_select ON public.tenants
      FOR SELECT TO authenticated
      USING (public.dbsec003_is_super_admin() OR id = public.dbsec004_current_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'p_dbsec004_tenants_insert') THEN
    CREATE POLICY p_dbsec004_tenants_insert ON public.tenants
      FOR INSERT TO authenticated
      WITH CHECK (public.dbsec003_is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'p_dbsec004_tenants_update') THEN
    CREATE POLICY p_dbsec004_tenants_update ON public.tenants
      FOR UPDATE TO authenticated
      USING (public.dbsec003_is_super_admin())
      WITH CHECK (public.dbsec003_is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'p_dbsec004_tenants_delete') THEN
    CREATE POLICY p_dbsec004_tenants_delete ON public.tenants
      FOR DELETE TO authenticated
      USING (public.dbsec003_is_super_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schools' AND policyname = 'p_dbsec004_schools_select') THEN
    CREATE POLICY p_dbsec004_schools_select ON public.schools
      FOR SELECT TO authenticated
      USING (public.dbsec003_is_super_admin() OR tenant_id = public.dbsec004_current_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schools' AND policyname = 'p_dbsec004_schools_insert') THEN
    CREATE POLICY p_dbsec004_schools_insert ON public.schools
      FOR INSERT TO authenticated
      WITH CHECK (public.dbsec003_is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schools' AND policyname = 'p_dbsec004_schools_update') THEN
    CREATE POLICY p_dbsec004_schools_update ON public.schools
      FOR UPDATE TO authenticated
      USING (public.dbsec003_is_super_admin())
      WITH CHECK (public.dbsec003_is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schools' AND policyname = 'p_dbsec004_schools_delete') THEN
    CREATE POLICY p_dbsec004_schools_delete ON public.schools
      FOR DELETE TO authenticated
      USING (public.dbsec003_is_super_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'branches' AND policyname = 'p_dbsec004_branches_select') THEN
    CREATE POLICY p_dbsec004_branches_select ON public.branches
      FOR SELECT TO authenticated
      USING (
        public.dbsec003_is_super_admin()
        OR (tenant_id = public.dbsec004_current_tenant_id() AND school_id = public.dbsec004_current_school_id())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'branches' AND policyname = 'p_dbsec004_branches_insert') THEN
    CREATE POLICY p_dbsec004_branches_insert ON public.branches
      FOR INSERT TO authenticated
      WITH CHECK (public.dbsec003_is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'branches' AND policyname = 'p_dbsec004_branches_update') THEN
    CREATE POLICY p_dbsec004_branches_update ON public.branches
      FOR UPDATE TO authenticated
      USING (public.dbsec003_is_super_admin())
      WITH CHECK (public.dbsec003_is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'branches' AND policyname = 'p_dbsec004_branches_delete') THEN
    CREATE POLICY p_dbsec004_branches_delete ON public.branches
      FOR DELETE TO authenticated
      USING (public.dbsec003_is_super_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'p_dbsec004_users_select') THEN
    CREATE POLICY p_dbsec004_users_select ON public.users
      FOR SELECT TO authenticated
      USING (public.dbsec003_is_super_admin() OR tenant_id = public.dbsec004_current_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'p_dbsec004_users_insert') THEN
    CREATE POLICY p_dbsec004_users_insert ON public.users
      FOR INSERT TO authenticated
      WITH CHECK (public.dbsec003_is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'p_dbsec004_users_update') THEN
    CREATE POLICY p_dbsec004_users_update ON public.users
      FOR UPDATE TO authenticated
      USING (public.dbsec003_is_super_admin())
      WITH CHECK (public.dbsec003_is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'p_dbsec004_users_delete') THEN
    CREATE POLICY p_dbsec004_users_delete ON public.users
      FOR DELETE TO authenticated
      USING (public.dbsec003_is_super_admin());
  END IF;
END
$$;

COMMIT;
