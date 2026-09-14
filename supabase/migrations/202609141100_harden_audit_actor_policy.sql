-- DB-SEC-010 — make the restricted application audit boundary resilient.
--
-- Student registration writes through the restricted application role.  The
-- audit row must still point to the canonical public.users primary key, but
-- policy evaluation must not depend on a single optional session setting or
-- on a users SELECT policy that can hide the actor from the application role.
-- This definer function performs the narrow, server-established scope check
-- with the table owner privileges, while the policy remains restricted to the
-- explicitly provisioned application roles.

BEGIN;

CREATE OR REPLACE FUNCTION public.dbsec010_audit_actor_allowed(
  p_tenant_id uuid,
  p_school_id uuid,
  p_branch_id uuid,
  p_actor_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  configured_tenant text := NULLIF(current_setting('app.tenant_id', true), '');
  configured_school text := NULLIF(current_setting('app.school_id', true), '');
  configured_branch text := NULLIF(current_setting('app.branch_id', true), '');
  configured_actor text := NULLIF(current_setting('app.actor_user_id', true), '');
  configured_auth_user text := NULLIF(current_setting('app.user_id', true), '');
BEGIN
  IF p_tenant_id IS NULL OR p_school_id IS NULL OR p_actor_user_id IS NULL
     OR configured_tenant IS NULL OR configured_school IS NULL THEN
    RETURN false;
  END IF;

  IF p_tenant_id::text <> configured_tenant
     OR p_school_id::text <> configured_school THEN
    RETURN false;
  END IF;

  IF p_branch_id IS NOT NULL
     AND (configured_branch IS NULL OR p_branch_id::text <> configured_branch) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
      FROM public.users AS actor
     WHERE actor.id = p_actor_user_id
       AND actor.tenant_id = p_tenant_id
       AND actor.school_id = p_school_id
       AND actor.status = 'active'
       AND actor.deleted_at IS NULL
       AND (
         (configured_actor IS NOT NULL AND actor.id::text = configured_actor)
         OR (configured_auth_user IS NOT NULL AND actor.auth_user_id::text = configured_auth_user)
       )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.dbsec010_audit_actor_allowed(uuid, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dbsec010_audit_actor_allowed(uuid, uuid, uuid, uuid)
  TO authenticated, edupro_app, edupro_staging_app;

DROP POLICY IF EXISTS p_dbsec009_audit_insert_app ON public.audit_events;
CREATE POLICY p_dbsec009_audit_insert_app ON public.audit_events
  FOR INSERT TO edupro_app, edupro_staging_app
  WITH CHECK (
    public.dbsec010_audit_actor_allowed(tenant_id, school_id, branch_id, actor_user_id)
  );

-- Some pooler paths expose the Supabase authenticated role instead of the
-- application role for the transaction. Keep that path equally narrow: the
-- trusted server settings and canonical actor validation remain mandatory.
DROP POLICY IF EXISTS p_dbsec010_audit_insert_authenticated ON public.audit_events;
CREATE POLICY p_dbsec010_audit_insert_authenticated ON public.audit_events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.dbsec010_audit_actor_allowed(tenant_id, school_id, branch_id, actor_user_id)
  );

COMMIT;
