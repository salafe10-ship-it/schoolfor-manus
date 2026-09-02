-- Allow the server-only Supabase service channel to resolve platform RBAC.
-- This grants access only to the control-plane permission tables; tenant data
-- remains protected by its existing RLS and tenant-scoped policies.

BEGIN;

GRANT EXECUTE ON FUNCTION public.dbsec003_set_request_context() TO service_role;

GRANT SELECT ON TABLE
  public.platform_users,
  public.platform_user_roles,
  public.platform_roles,
  public.platform_role_permissions,
  public.platform_permissions
TO service_role;

COMMIT;
