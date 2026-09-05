-- DB-SEC-008 — provision the isolated Staging data-plane role.
--
-- Production uses edupro_app.  Staging uses a distinct login so a staging
-- connection string can never be mistaken for the production data-plane
-- identity.  The role inherits the already-reviewed edupro_app grants; no
-- superuser, createdb, createrole, replication, or RLS bypass capability is
-- introduced.  Passwords remain deployment-secret-manager concerns.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'edupro_staging_app') THEN
    CREATE ROLE edupro_staging_app
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS
      INHERIT
      CONNECTION LIMIT 40;
  ELSE
    ALTER ROLE edupro_staging_app
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS
      INHERIT
      CONNECTION LIMIT 40;
  END IF;
END
$$;

-- Reuse the reviewed least-privilege grant surface and future default grants.
GRANT edupro_app TO edupro_staging_app;
GRANT USAGE ON SCHEMA public TO edupro_staging_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO edupro_staging_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO edupro_staging_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO edupro_staging_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO edupro_staging_app;

-- Direct server transactions establish these settings after authentication.
-- Both isolated application identities are valid; neither is a bypass role.
CREATE OR REPLACE FUNCTION public.dbsec004_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH auth_scope AS (
    SELECT u.tenant_id
      FROM public.users AS u
      JOIN public.tenants AS t ON t.id = u.tenant_id
     WHERE u.auth_user_id = auth.uid()
       AND u.status = 'active' AND u.deleted_at IS NULL
       AND t.deleted_at IS NULL
       AND (t.status = 'active' OR EXISTS (
         SELECT 1 FROM public.platform_users pu
          WHERE pu.auth_user_id = u.auth_user_id AND pu.status = 'active' AND pu.deleted_at IS NULL
       ))
     LIMIT 1
  ), app_scope AS (
    SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid AS tenant_id
     WHERE session_user IN ('edupro_app', 'edupro_staging_app')
       AND EXISTS (
         SELECT 1 FROM public.tenants t
          WHERE t.id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
            AND t.deleted_at IS NULL AND t.status = 'active'
       )
  )
  SELECT COALESCE((SELECT tenant_id FROM auth_scope), (SELECT tenant_id FROM app_scope));
$$;

CREATE OR REPLACE FUNCTION public.dbsec004_current_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH auth_scope AS (
    SELECT u.school_id
      FROM public.users AS u
      JOIN public.tenants AS t ON t.id = u.tenant_id
      JOIN public.schools AS s ON s.id = u.school_id AND s.tenant_id = u.tenant_id
     WHERE u.auth_user_id = auth.uid()
       AND u.status = 'active' AND u.deleted_at IS NULL
       AND s.status = 'active' AND s.deleted_at IS NULL AND t.deleted_at IS NULL
       AND (t.status = 'active' OR EXISTS (
         SELECT 1 FROM public.platform_users pu
          WHERE pu.auth_user_id = u.auth_user_id AND pu.status = 'active' AND pu.deleted_at IS NULL
       ))
     LIMIT 1
  ), app_scope AS (
    SELECT s.id AS school_id
      FROM public.schools s
      JOIN public.tenants t ON t.id = s.tenant_id
     WHERE session_user IN ('edupro_app', 'edupro_staging_app')
       AND s.id = NULLIF(current_setting('app.school_id', true), '')::uuid
       AND s.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
       AND s.status = 'active' AND s.deleted_at IS NULL
       AND t.status = 'active' AND t.deleted_at IS NULL
     LIMIT 1
  )
  SELECT COALESCE((SELECT school_id FROM auth_scope), (SELECT school_id FROM app_scope));
$$;

CREATE OR REPLACE FUNCTION public.dbsec004_current_branch_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH auth_scope AS (
    SELECT u.branch_id
      FROM public.users AS u
      JOIN public.tenants AS t ON t.id = u.tenant_id
      JOIN public.schools AS s ON s.id = u.school_id AND s.tenant_id = u.tenant_id
      JOIN public.branches AS b ON b.id = u.branch_id AND b.tenant_id = u.tenant_id AND b.school_id = u.school_id
     WHERE u.auth_user_id = auth.uid()
       AND u.status = 'active' AND u.deleted_at IS NULL
       AND s.status = 'active' AND s.deleted_at IS NULL
       AND b.status = 'active' AND b.deleted_at IS NULL AND t.deleted_at IS NULL
       AND (t.status = 'active' OR EXISTS (
         SELECT 1 FROM public.platform_users pu
          WHERE pu.auth_user_id = u.auth_user_id AND pu.status = 'active' AND pu.deleted_at IS NULL
       ))
     LIMIT 1
  ), app_scope AS (
    SELECT b.id AS branch_id
      FROM public.branches b
      JOIN public.schools s ON s.id = b.school_id AND s.tenant_id = b.tenant_id
      JOIN public.tenants t ON t.id = b.tenant_id
     WHERE session_user IN ('edupro_app', 'edupro_staging_app')
       AND b.id = NULLIF(current_setting('app.branch_id', true), '')::uuid
       AND b.school_id = NULLIF(current_setting('app.school_id', true), '')::uuid
       AND b.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
       AND b.status = 'active' AND b.deleted_at IS NULL
       AND s.status = 'active' AND s.deleted_at IS NULL
       AND t.status = 'active' AND t.deleted_at IS NULL
     LIMIT 1
  )
  SELECT COALESCE((SELECT branch_id FROM auth_scope), (SELECT branch_id FROM app_scope));
$$;

REVOKE ALL ON FUNCTION public.dbsec004_current_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dbsec004_current_school_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dbsec004_current_branch_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dbsec004_current_tenant_id() TO authenticated, edupro_app, edupro_staging_app;
GRANT EXECUTE ON FUNCTION public.dbsec004_current_school_id() TO authenticated, edupro_app, edupro_staging_app;
GRANT EXECUTE ON FUNCTION public.dbsec004_current_branch_id() TO authenticated, edupro_app, edupro_staging_app;

COMMIT;
