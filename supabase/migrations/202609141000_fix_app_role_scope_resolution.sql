-- DB-SEC-009 — resolve trusted app scope after a transaction-local role switch.
--
-- The application connection may authenticate through a pooler transport role
-- and then SET LOCAL ROLE to edupro_staging_app/edupro_app. PostgreSQL keeps
-- session_user as the transport identity while current_user becomes the
-- policy-matched application role. The previous scope functions checked only
-- session_user, so legitimate tenant rows became invisible and writes failed
-- with an RLS violation. Keep the scope fail-closed and accept only the two
-- explicitly provisioned non-bypass application roles.

BEGIN;

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
    WHERE (current_setting('role', true) IN ('edupro_app', 'edupro_staging_app')
            OR current_user IN ('edupro_app', 'edupro_staging_app')
            OR session_user IN ('edupro_app', 'edupro_staging_app'))
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
    WHERE (current_setting('role', true) IN ('edupro_app', 'edupro_staging_app')
            OR current_user IN ('edupro_app', 'edupro_staging_app')
            OR session_user IN ('edupro_app', 'edupro_staging_app'))
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
    WHERE (current_setting('role', true) IN ('edupro_app', 'edupro_staging_app')
            OR current_user IN ('edupro_app', 'edupro_staging_app')
            OR session_user IN ('edupro_app', 'edupro_staging_app'))
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

-- The canonical registration boundary may provision the local actor bridge
-- when the central identity has no tenant-side users row yet. Keep this
-- narrow: the inserted row must be the authenticated actor and exactly match
-- the trusted tenant/school/branch transaction context.
DROP POLICY IF EXISTS p_dbsec009_users_insert_self ON public.users;
CREATE POLICY p_dbsec009_users_insert_self ON public.users
  FOR INSERT TO edupro_app, edupro_staging_app
  WITH CHECK (
    auth_user_id::text = NULLIF(current_setting('app.user_id', true), '')
    AND tenant_id::text = NULLIF(current_setting('app.tenant_id', true), '')
    AND school_id::text = NULLIF(current_setting('app.school_id', true), '')
    AND branch_id::text = NULLIF(current_setting('app.branch_id', true), '')
    AND status = 'active'
    AND deleted_at IS NULL
  );

-- Audit rows use the canonical actor id resolved by the platform boundary.
-- Referencing public.users from an RLS policy can hide the actor again under a
-- restricted server role, so validate the trusted transaction-local actor id
-- directly while keeping tenant/school/branch scope mandatory.
DROP POLICY IF EXISTS p_dbsec009_audit_insert_app ON public.audit_events;
CREATE POLICY p_dbsec009_audit_insert_app ON public.audit_events
  FOR INSERT TO edupro_app, edupro_staging_app
  WITH CHECK (
    tenant_id::text = NULLIF(current_setting('app.tenant_id', true), '')
    AND (school_id IS NULL OR school_id::text = NULLIF(current_setting('app.school_id', true), ''))
    AND (branch_id IS NULL OR branch_id::text = NULLIF(current_setting('app.branch_id', true), ''))
    AND actor_user_id::text = NULLIF(current_setting('app.actor_user_id', true), '')
  );

COMMIT;
