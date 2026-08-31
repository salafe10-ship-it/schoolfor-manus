-- Enforce tenant lifecycle state at the trusted identity boundary.
-- Platform operators remain able to recover a tenant because their platform
-- identity is independent from tenant RBAC; ordinary tenant users do not.

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
    JOIN public.tenants AS t ON t.id = u.tenant_id
   WHERE u.auth_user_id = auth.uid()
     AND u.status = 'active'
     AND u.deleted_at IS NULL
     AND t.deleted_at IS NULL
     AND (
       t.status = 'active'
       OR EXISTS (
         SELECT 1
           FROM public.platform_users AS pu
          WHERE pu.auth_user_id = u.auth_user_id
            AND pu.status = 'active'
            AND pu.deleted_at IS NULL
       )
     )
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
    JOIN public.tenants AS t ON t.id = u.tenant_id
    JOIN public.schools AS s ON s.id = u.school_id AND s.tenant_id = u.tenant_id
   WHERE u.auth_user_id = auth.uid()
     AND u.status = 'active'
     AND u.deleted_at IS NULL
     AND s.status = 'active'
     AND s.deleted_at IS NULL
     AND t.deleted_at IS NULL
     AND (
       t.status = 'active'
       OR EXISTS (
         SELECT 1
           FROM public.platform_users AS pu
          WHERE pu.auth_user_id = u.auth_user_id
            AND pu.status = 'active'
            AND pu.deleted_at IS NULL
       )
     )
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
    JOIN public.tenants AS t ON t.id = u.tenant_id
    JOIN public.schools AS s ON s.id = u.school_id AND s.tenant_id = u.tenant_id
    JOIN public.branches AS b ON b.id = u.branch_id
      AND b.tenant_id = u.tenant_id
      AND b.school_id = u.school_id
   WHERE u.auth_user_id = auth.uid()
     AND u.status = 'active'
     AND u.deleted_at IS NULL
     AND s.status = 'active'
     AND s.deleted_at IS NULL
     AND b.status = 'active'
     AND b.deleted_at IS NULL
     AND t.deleted_at IS NULL
     AND (
       t.status = 'active'
       OR EXISTS (
         SELECT 1
           FROM public.platform_users AS pu
          WHERE pu.auth_user_id = u.auth_user_id
            AND pu.status = 'active'
            AND pu.deleted_at IS NULL
       )
     )
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
    JOIN public.tenants AS t ON t.id = u.tenant_id
   WHERE lower(u.username) = lower(btrim(p_username))
     AND u.email IS NOT NULL
     AND u.status = 'active'
     AND u.deleted_at IS NULL
     AND t.deleted_at IS NULL
     AND (
       t.status = 'active'
       OR EXISTS (
         SELECT 1
           FROM public.platform_users AS pu
          WHERE pu.auth_user_id = u.auth_user_id
            AND pu.status = 'active'
            AND pu.deleted_at IS NULL
       )
     )
   LIMIT 1;
$$;

COMMIT;
