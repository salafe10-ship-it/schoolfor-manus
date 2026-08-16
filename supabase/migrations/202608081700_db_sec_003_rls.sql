-- DB-SEC-003 — Authenticated request tenant and branch isolation policies.
-- This migration contains no secrets or seed data. It targets the linked
-- SchoolForManus Supabase project and uses Supabase's built-in authenticated role.
-- Scope is derived from the canonical public.users row for auth.uid(); missing
-- scope fails closed. The service-role key is never exposed to the frontend.

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

GRANT SELECT, INSERT ON TABLE public.enrollment_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.enrollment_transfers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.student_documents TO authenticated;
GRANT SELECT, INSERT ON TABLE public.student_document_versions TO authenticated;
GRANT SELECT, INSERT ON TABLE public.student_document_categories TO authenticated;
GRANT SELECT, INSERT ON TABLE public.student_document_access_log TO authenticated;

REVOKE UPDATE, DELETE ON TABLE public.enrollment_history FROM authenticated;
REVOKE DELETE ON TABLE public.enrollment_transfers FROM authenticated;
REVOKE UPDATE, DELETE ON TABLE public.student_status_history FROM authenticated;
REVOKE UPDATE, DELETE ON TABLE public.student_document_versions FROM authenticated;
REVOKE UPDATE, DELETE ON TABLE public.student_document_access_log FROM authenticated;
REVOKE UPDATE, DELETE ON TABLE public.audit_events FROM authenticated;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academic_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_status_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_document_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_dbsec003_students_select ON public.students
  FOR SELECT TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
  );
CREATE POLICY p_dbsec003_students_insert ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (
      SELECT 1 FROM public.users actor
      WHERE actor.id = public.students.created_by
        AND actor.auth_user_id::text = current_setting('app.user_id', true)
        AND actor.tenant_id = public.students.tenant_id
        AND actor.status = 'active' AND actor.deleted_at IS NULL
    )
  );
CREATE POLICY p_dbsec003_students_update ON public.students
  FOR UPDATE TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
  )
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (
      SELECT 1 FROM public.users actor
      WHERE actor.id = public.students.updated_by
        AND actor.auth_user_id::text = current_setting('app.user_id', true)
        AND actor.tenant_id = public.students.tenant_id
        AND actor.status = 'active' AND actor.deleted_at IS NULL
    )
  );
CREATE POLICY p_dbsec003_students_delete ON public.students
  FOR DELETE TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
  );

CREATE POLICY p_dbsec003_guardians_select ON public.guardians
  FOR SELECT TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
  );
CREATE POLICY p_dbsec003_guardians_insert ON public.guardians
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (
      SELECT 1 FROM public.users actor
      WHERE actor.id = public.guardians.created_by
        AND actor.auth_user_id::text = current_setting('app.user_id', true)
        AND actor.tenant_id = public.guardians.tenant_id
        AND actor.status = 'active' AND actor.deleted_at IS NULL
    )
  );
CREATE POLICY p_dbsec003_guardians_update ON public.guardians
  FOR UPDATE TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
  )
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (
      SELECT 1 FROM public.users actor
      WHERE actor.id = public.guardians.updated_by
        AND actor.auth_user_id::text = current_setting('app.user_id', true)
        AND actor.tenant_id = public.guardians.tenant_id
        AND actor.status = 'active' AND actor.deleted_at IS NULL
    )
  );
CREATE POLICY p_dbsec003_guardians_delete ON public.guardians
  FOR DELETE TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
  );

CREATE POLICY p_dbsec003_student_guardians_select ON public.student_guardians
  FOR SELECT TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_guardians.student_id AND s.tenant_id = public.student_guardians.tenant_id AND s.school_id = public.student_guardians.school_id AND (s.branch_id IS NULL OR s.branch_id = public.student_guardians.branch_id))
    AND EXISTS (SELECT 1 FROM public.guardians g WHERE g.id = public.student_guardians.guardian_id AND g.tenant_id = public.student_guardians.tenant_id AND g.school_id = public.student_guardians.school_id AND (g.branch_id IS NULL OR g.branch_id = public.student_guardians.branch_id))
  );
CREATE POLICY p_dbsec003_student_guardians_insert ON public.student_guardians
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_guardians.student_id AND s.tenant_id = public.student_guardians.tenant_id AND s.school_id = public.student_guardians.school_id AND (s.branch_id IS NULL OR s.branch_id = public.student_guardians.branch_id))
    AND EXISTS (SELECT 1 FROM public.guardians g WHERE g.id = public.student_guardians.guardian_id AND g.tenant_id = public.student_guardians.tenant_id AND g.school_id = public.student_guardians.school_id AND (g.branch_id IS NULL OR g.branch_id = public.student_guardians.branch_id))
    AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.student_guardians.created_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.student_guardians.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL)
  );
CREATE POLICY p_dbsec003_student_guardians_update ON public.student_guardians
  FOR UPDATE TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_guardians.student_id AND s.tenant_id = public.student_guardians.tenant_id AND s.school_id = public.student_guardians.school_id AND (s.branch_id IS NULL OR s.branch_id = public.student_guardians.branch_id))
    AND EXISTS (SELECT 1 FROM public.guardians g WHERE g.id = public.student_guardians.guardian_id AND g.tenant_id = public.student_guardians.tenant_id AND g.school_id = public.student_guardians.school_id AND (g.branch_id IS NULL OR g.branch_id = public.student_guardians.branch_id))
  )
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_guardians.student_id AND s.tenant_id = public.student_guardians.tenant_id AND s.school_id = public.student_guardians.school_id AND (s.branch_id IS NULL OR s.branch_id = public.student_guardians.branch_id))
    AND EXISTS (SELECT 1 FROM public.guardians g WHERE g.id = public.student_guardians.guardian_id AND g.tenant_id = public.student_guardians.tenant_id AND g.school_id = public.student_guardians.school_id AND (g.branch_id IS NULL OR g.branch_id = public.student_guardians.branch_id))
    AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.student_guardians.updated_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.student_guardians.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL)
  );
CREATE POLICY p_dbsec003_student_guardians_delete ON public.student_guardians
  FOR DELETE TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
  );

CREATE POLICY p_dbsec003_enrollments_select ON public.enrollments
  FOR SELECT TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.enrollments.student_id AND s.tenant_id = public.enrollments.tenant_id AND s.school_id = public.enrollments.school_id AND (s.branch_id IS NULL OR s.branch_id = public.enrollments.branch_id))
    AND EXISTS (SELECT 1 FROM public.academic_years y WHERE y.id = public.enrollments.academic_year_id AND y.tenant_id = public.enrollments.tenant_id AND y.school_id = public.enrollments.school_id AND (y.branch_id IS NULL OR y.branch_id = public.enrollments.branch_id))
    AND EXISTS (SELECT 1 FROM public.terms t WHERE t.id = public.enrollments.term_id AND t.academic_year_id = public.enrollments.academic_year_id AND t.tenant_id = public.enrollments.tenant_id AND t.school_id = public.enrollments.school_id AND (t.branch_id IS NULL OR t.branch_id = public.enrollments.branch_id))
  );
CREATE POLICY p_dbsec003_enrollments_insert ON public.enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.enrollments.student_id AND s.tenant_id = public.enrollments.tenant_id AND s.school_id = public.enrollments.school_id AND (s.branch_id IS NULL OR s.branch_id = public.enrollments.branch_id))
    AND EXISTS (SELECT 1 FROM public.academic_years y WHERE y.id = public.enrollments.academic_year_id AND y.tenant_id = public.enrollments.tenant_id AND y.school_id = public.enrollments.school_id AND (y.branch_id IS NULL OR y.branch_id = public.enrollments.branch_id))
    AND EXISTS (SELECT 1 FROM public.terms t WHERE t.id = public.enrollments.term_id AND t.academic_year_id = public.enrollments.academic_year_id AND t.tenant_id = public.enrollments.tenant_id AND t.school_id = public.enrollments.school_id AND (t.branch_id IS NULL OR t.branch_id = public.enrollments.branch_id))
    AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.enrollments.created_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.enrollments.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL)
  );
CREATE POLICY p_dbsec003_enrollments_update ON public.enrollments
  FOR UPDATE TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
  )
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.enrollments.updated_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.enrollments.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL)
  );
CREATE POLICY p_dbsec003_enrollments_delete ON public.enrollments
  FOR DELETE TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)));

CREATE POLICY p_dbsec003_enrollment_history_select ON public.enrollment_history
  FOR SELECT TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = public.enrollment_history.enrollment_id AND e.tenant_id = public.enrollment_history.tenant_id AND e.school_id = public.enrollment_history.school_id AND (e.branch_id IS NULL OR e.branch_id = public.enrollment_history.branch_id))
  );
CREATE POLICY p_dbsec003_enrollment_history_insert ON public.enrollment_history
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = public.enrollment_history.enrollment_id AND e.tenant_id = public.enrollment_history.tenant_id AND e.school_id = public.enrollment_history.school_id AND (e.branch_id IS NULL OR e.branch_id = public.enrollment_history.branch_id))
    AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.enrollment_history.created_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.enrollment_history.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL)
  );

CREATE POLICY p_dbsec003_enrollment_transfers_select ON public.enrollment_transfers
  FOR SELECT TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND from_school_id = school_id AND to_school_id = school_id
    AND (from_branch_id = branch_id OR to_branch_id = branch_id)
    AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = public.enrollment_transfers.from_enrollment_id AND e.tenant_id = public.enrollment_transfers.tenant_id)
    AND (public.enrollment_transfers.to_enrollment_id IS NULL OR EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = public.enrollment_transfers.to_enrollment_id AND e.tenant_id = public.enrollment_transfers.tenant_id))
  );
CREATE POLICY p_dbsec003_enrollment_transfers_insert ON public.enrollment_transfers
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND from_school_id = school_id AND to_school_id = school_id
    AND (from_branch_id = branch_id OR to_branch_id = branch_id)
    AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = public.enrollment_transfers.from_enrollment_id AND e.tenant_id = public.enrollment_transfers.tenant_id)
    AND (public.enrollment_transfers.to_enrollment_id IS NULL OR EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = public.enrollment_transfers.to_enrollment_id AND e.tenant_id = public.enrollment_transfers.tenant_id))
    AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.enrollment_transfers.requested_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.enrollment_transfers.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL)
  );
CREATE POLICY p_dbsec003_enrollment_transfers_update ON public.enrollment_transfers
  FOR UPDATE TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)))
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND from_school_id = school_id AND to_school_id = school_id
    AND (from_branch_id = branch_id OR to_branch_id = branch_id)
    AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.enrollment_transfers.updated_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.enrollment_transfers.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL)
  );

CREATE POLICY p_dbsec003_status_select ON public.student_academic_status
  FOR SELECT TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_academic_status.student_id AND s.tenant_id = public.student_academic_status.tenant_id AND s.school_id = public.student_academic_status.school_id AND (s.branch_id IS NULL OR s.branch_id = public.student_academic_status.branch_id))
  );
CREATE POLICY p_dbsec003_status_insert ON public.student_academic_status
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true)
    AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_academic_status.student_id AND s.tenant_id = public.student_academic_status.tenant_id AND s.school_id = public.student_academic_status.school_id AND (s.branch_id IS NULL OR s.branch_id = public.student_academic_status.branch_id))
    AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.student_academic_status.created_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.student_academic_status.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL)
  );
CREATE POLICY p_dbsec003_status_update ON public.student_academic_status
  FOR UPDATE TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)))
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.student_academic_status.updated_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.student_academic_status.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL));
CREATE POLICY p_dbsec003_status_delete ON public.student_academic_status
  FOR DELETE TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)));

CREATE POLICY p_dbsec003_transitions_select ON public.student_status_transitions
  FOR SELECT TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_status_transitions.student_id AND s.tenant_id = public.student_status_transitions.tenant_id AND s.school_id = public.student_status_transitions.school_id AND (s.branch_id IS NULL OR s.branch_id = public.student_status_transitions.branch_id)));
CREATE POLICY p_dbsec003_transitions_insert ON public.student_status_transitions
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_status_transitions.student_id AND s.tenant_id = public.student_status_transitions.tenant_id AND s.school_id = public.student_status_transitions.school_id AND (s.branch_id IS NULL OR s.branch_id = public.student_status_transitions.branch_id)) AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.student_status_transitions.created_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.student_status_transitions.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL));
CREATE POLICY p_dbsec003_transitions_update ON public.student_status_transitions
  FOR UPDATE TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)))
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.student_status_transitions.updated_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.student_status_transitions.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL));
CREATE POLICY p_dbsec003_transitions_delete ON public.student_status_transitions
  FOR DELETE TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)));

CREATE POLICY p_dbsec003_status_history_select ON public.student_status_history
  FOR SELECT TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_status_history.student_id AND s.tenant_id = public.student_status_history.tenant_id AND s.school_id = public.student_status_history.school_id AND (s.branch_id IS NULL OR s.branch_id = public.student_status_history.branch_id)));
CREATE POLICY p_dbsec003_status_history_insert ON public.student_status_history
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_status_history.student_id AND s.tenant_id = public.student_status_history.tenant_id AND s.school_id = public.student_status_history.school_id AND (s.branch_id IS NULL OR s.branch_id = public.student_status_history.branch_id)) AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.student_status_history.created_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.student_status_history.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL));

CREATE POLICY p_dbsec003_documents_select ON public.student_documents
  FOR SELECT TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_documents.student_id AND s.tenant_id = public.student_documents.tenant_id AND s.school_id = public.student_documents.school_id AND (s.branch_id IS NULL OR s.branch_id = public.student_documents.branch_id)) AND EXISTS (SELECT 1 FROM public.student_document_categories c WHERE c.id = public.student_documents.category_id AND c.tenant_id = public.student_documents.tenant_id));
CREATE POLICY p_dbsec003_documents_insert ON public.student_documents
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_documents.student_id AND s.tenant_id = public.student_documents.tenant_id AND s.school_id = public.student_documents.school_id AND (s.branch_id IS NULL OR s.branch_id = public.student_documents.branch_id)) AND EXISTS (SELECT 1 FROM public.student_document_categories c WHERE c.id = public.student_documents.category_id AND c.tenant_id = public.student_documents.tenant_id) AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.student_documents.created_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.student_documents.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL));
CREATE POLICY p_dbsec003_documents_update ON public.student_documents
  FOR UPDATE TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)))
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.student_documents.updated_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.student_documents.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL));
CREATE POLICY p_dbsec003_documents_delete ON public.student_documents
  FOR DELETE TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)));

CREATE POLICY p_dbsec003_document_categories_select ON public.student_document_categories
  FOR SELECT TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY p_dbsec003_document_categories_insert ON public.student_document_categories
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.student_document_categories.created_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.student_document_categories.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL));

CREATE POLICY p_dbsec003_document_versions_select ON public.student_document_versions
  FOR SELECT TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.student_documents d WHERE d.id = public.student_document_versions.document_id AND d.tenant_id = public.student_document_versions.tenant_id AND d.school_id = public.student_document_versions.school_id AND (d.branch_id IS NULL OR d.branch_id = public.student_document_versions.branch_id) AND d.student_id = public.student_document_versions.student_id));
CREATE POLICY p_dbsec003_document_versions_insert ON public.student_document_versions
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.student_documents d WHERE d.id = public.student_document_versions.document_id AND d.tenant_id = public.student_document_versions.tenant_id AND d.school_id = public.student_document_versions.school_id AND (d.branch_id IS NULL OR d.branch_id = public.student_document_versions.branch_id) AND d.student_id = public.student_document_versions.student_id) AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.student_document_versions.created_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.student_document_versions.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL));

CREATE POLICY p_dbsec003_document_access_select ON public.student_document_access_log
  FOR SELECT TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.student_documents d WHERE d.id = public.student_document_access_log.document_id AND d.tenant_id = public.student_document_access_log.tenant_id AND d.school_id = public.student_document_access_log.school_id AND (d.branch_id IS NULL OR d.branch_id = public.student_document_access_log.branch_id) AND d.student_id = public.student_document_access_log.student_id));
CREATE POLICY p_dbsec003_document_access_insert ON public.student_document_access_log
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.student_documents d WHERE d.id = public.student_document_access_log.document_id AND d.tenant_id = public.student_document_access_log.tenant_id AND d.school_id = public.student_document_access_log.school_id AND (d.branch_id IS NULL OR d.branch_id = public.student_document_access_log.branch_id) AND d.student_id = public.student_document_access_log.student_id) AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.student_document_access_log.created_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.student_document_access_log.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL));

CREATE POLICY p_dbsec003_audit_select ON public.audit_events
  FOR SELECT TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND (school_id IS NULL OR school_id::text = current_setting('app.school_id', true)) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)));
CREATE POLICY p_dbsec003_audit_insert ON public.audit_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND (school_id IS NULL OR school_id::text = current_setting('app.school_id', true)) AND (public.dbsec003_is_super_admin() OR branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true)) AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.audit_events.actor_user_id AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.audit_events.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL));

CREATE POLICY p_dbsec003_outbox_select ON public.outbox_events
  FOR SELECT TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY p_dbsec003_outbox_insert ON public.outbox_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.outbox_events.created_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.outbox_events.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL));
CREATE POLICY p_dbsec003_outbox_update ON public.outbox_events
  FOR UPDATE TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND EXISTS (SELECT 1 FROM public.users actor WHERE actor.id = public.outbox_events.updated_by AND actor.auth_user_id::text = current_setting('app.user_id', true) AND actor.tenant_id = public.outbox_events.tenant_id AND actor.status = 'active' AND actor.deleted_at IS NULL));

COMMIT;
