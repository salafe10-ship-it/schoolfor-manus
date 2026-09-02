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

-- The central administration API is server-only and reaches these control
-- plane records through the Supabase service channel. Tenant-facing requests
-- continue to use the normal RLS-scoped data plane.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.tenants,
  public.subscriptions,
  public.schools,
  public.branches,
  public.users,
  public.roles,
  public.permissions,
  public.role_permissions,
  public.user_roles,
  public.students,
  public.hr_database,
  public.inventory_database,
  public.financial_portal_snapshots
TO service_role;

COMMIT;
