-- DB-SEC-011 — align the student-fee audit RLS boundary with the canonical
-- public.users actor written by the financial snapshot transaction.
-- The old policy compared actor_user_id with app.user_id (the auth user id),
-- which is a different identifier and caused valid fee saves to roll back.

BEGIN;

DO $$
DECLARE
  role_list text;
BEGIN
  IF to_regclass('public.student_fee_audit_events') IS NULL THEN
    RETURN;
  END IF;

  DROP POLICY IF EXISTS p_student_fee_audit_events_insert ON public.student_fee_audit_events;

  SELECT string_agg(quote_ident(rolname), ', ' ORDER BY rolname)
    INTO role_list
    FROM pg_roles
   WHERE rolname = ANY (ARRAY['authenticated', 'edupro_app', 'edupro_staging_app']);

  IF role_list IS NOT NULL THEN
    EXECUTE format(
      'CREATE POLICY p_student_fee_audit_events_insert ON public.student_fee_audit_events
         FOR INSERT TO %s
         WITH CHECK (public.dbsec010_audit_actor_allowed(tenant_id, school_id, NULL, actor_user_id))',
      role_list
    );
  END IF;
END;
$$;

COMMIT;
