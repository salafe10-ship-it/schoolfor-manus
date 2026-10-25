-- STG-DBSEC-PREREQ-001 — restore the two canonical request helpers missing
-- from the isolated Staging baseline without replaying the older policy file.
-- The legacy 202608081700 migration also creates policies already present in
-- this project, so this forward repair intentionally changes functions only.

BEGIN;

CREATE OR REPLACE FUNCTION public.dbsec003_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT lower(COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', ''))
    IN ('superadmin', 'super-admin');
$$;

CREATE OR REPLACE FUNCTION public.dbsec003_set_request_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_tenant_id text;
  v_school_id text;
  v_branch_id text;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM set_config('app.user_id', v_auth_user_id::text, true);

  SELECT u.tenant_id::text, u.school_id::text, u.branch_id::text
    INTO v_tenant_id, v_school_id, v_branch_id
    FROM public.users AS u
   WHERE u.auth_user_id = v_auth_user_id
     AND u.status = 'active'
     AND u.deleted_at IS NULL
   LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM set_config('app.tenant_id', v_tenant_id, true);
  PERFORM set_config('app.school_id', COALESCE(v_school_id, ''), true);
  PERFORM set_config('app.branch_id', COALESCE(v_branch_id, ''), true);
END;
$$;

REVOKE ALL ON FUNCTION public.dbsec003_is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dbsec003_is_super_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.dbsec003_set_request_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dbsec003_set_request_context() TO authenticator, authenticated;
ALTER ROLE authenticator SET pgrst.db_pre_request = 'public.dbsec003_set_request_context';

COMMIT;
