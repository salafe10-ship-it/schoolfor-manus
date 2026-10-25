-- Reconcile the isolated Staging project's live access controls with the
-- repository schema. The migration is a no-op on projects without the
-- dedicated edupro_staging_app role, so it cannot change Production access.
-- Existing tenant/school/branch predicates are preserved verbatim.

BEGIN;

DO $$
DECLARE
  p record;
  app_role record;
BEGIN
  SELECT r.rolsuper, r.rolbypassrls, r.rolinherit
    INTO app_role
    FROM pg_roles r
   WHERE r.rolname = 'edupro_staging_app';

  IF NOT FOUND THEN
    RAISE NOTICE 'Staging-only access reconciliation skipped: dedicated role is absent.';
    RETURN;
  END IF;

  IF app_role.rolsuper OR app_role.rolbypassrls OR NOT app_role.rolinherit
     OR NOT pg_has_role('edupro_staging_app', 'authenticated', 'member') THEN
    RAISE EXCEPTION 'EDUPRO_STAGING_APP_ROLE_IS_NOT_RESTRICTED_OR_AUTHENTICATED_MEMBER';
  END IF;

  -- These existing policies deliberately keep their stricter Staging branch
  -- scope while serving authenticated PostgREST requests as well as the
  -- restricted server role (which inherits authenticated).
  FOR p IN
    SELECT * FROM (VALUES
      ('audit_events','p_dbsec003_audit_insert'),
      ('audit_events','p_dbsec003_audit_select'),
      ('enrollment_history','p_dbsec003_enrollment_history_insert'),
      ('enrollment_history','p_dbsec003_enrollment_history_select'),
      ('enrollment_transfers','p_dbsec003_enrollment_transfers_insert'),
      ('enrollment_transfers','p_dbsec003_enrollment_transfers_select'),
      ('enrollment_transfers','p_dbsec003_enrollment_transfers_update'),
      ('enrollments','p_dbsec003_enrollments_delete'),
      ('enrollments','p_dbsec003_enrollments_insert'),
      ('enrollments','p_dbsec003_enrollments_select'),
      ('enrollments','p_dbsec003_enrollments_update'),
      ('guardians','p_dbsec003_guardians_delete'),
      ('guardians','p_dbsec003_guardians_insert'),
      ('guardians','p_dbsec003_guardians_select'),
      ('guardians','p_dbsec003_guardians_update'),
      ('outbox_events','p_dbsec003_outbox_insert'),
      ('outbox_events','p_dbsec003_outbox_select'),
      ('outbox_events','p_dbsec003_outbox_update'),
      ('student_academic_status','p_dbsec003_status_delete'),
      ('student_academic_status','p_dbsec003_status_insert'),
      ('student_academic_status','p_dbsec003_status_select'),
      ('student_academic_status','p_dbsec003_status_update'),
      ('student_document_access_log','p_dbsec003_document_access_insert'),
      ('student_document_access_log','p_dbsec003_document_access_select'),
      ('student_document_categories','p_dbsec003_document_categories_insert'),
      ('student_document_categories','p_dbsec003_document_categories_select'),
      ('student_document_versions','p_dbsec003_document_versions_insert'),
      ('student_document_versions','p_dbsec003_document_versions_select'),
      ('student_documents','p_dbsec003_documents_delete'),
      ('student_documents','p_dbsec003_documents_insert'),
      ('student_documents','p_dbsec003_documents_select'),
      ('student_documents','p_dbsec003_documents_update'),
      ('student_guardians','p_dbsec003_student_guardians_delete'),
      ('student_guardians','p_dbsec003_student_guardians_insert'),
      ('student_guardians','p_dbsec003_student_guardians_select'),
      ('student_guardians','p_dbsec003_student_guardians_update'),
      ('student_status_history','p_dbsec003_status_history_insert'),
      ('student_status_history','p_dbsec003_status_history_select'),
      ('student_status_transitions','p_dbsec003_transitions_delete'),
      ('student_status_transitions','p_dbsec003_transitions_insert'),
      ('student_status_transitions','p_dbsec003_transitions_select'),
      ('student_status_transitions','p_dbsec003_transitions_update'),
      ('students','p_dbsec003_students_delete'),
      ('students','p_dbsec003_students_insert'),
      ('students','p_dbsec003_students_select'),
      ('students','p_dbsec003_students_update')
    ) AS expected(table_name, policy_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = p.table_name
         AND policyname = p.policy_name
    ) THEN
      RAISE EXCEPTION 'EXPECTED_STAGING_POLICY_MISSING:%.%', p.table_name, p.policy_name;
    END IF;
    EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated', p.policy_name, p.table_name);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc proc JOIN pg_namespace n ON n.oid = proc.pronamespace
     WHERE n.nspname = 'public' AND proc.proname = 'dbsec003_set_request_context'
       AND pg_get_function_identity_arguments(proc.oid) = ''
  ) THEN
    RAISE EXCEPTION 'STAGING_REQUEST_CONTEXT_FUNCTION_MISSING';
  END IF;

  -- The current Staging identity tables are empty (verified by the read-only
  -- data-impact preflight), so these canonical integrity rules can be restored
  -- without rewriting existing requests or grants. Guards below also make a
  -- future run fail before adding a constraint if inconsistent rows appear.
  IF EXISTS (SELECT 1 FROM public.identity_access_requests
              WHERE ends_at IS NULL OR ends_at <= starts_at) THEN
    RAISE EXCEPTION 'STAGING_IDENTITY_REQUEST_EXPIRY_DATA_INVALID';
  END IF;
  ALTER TABLE public.identity_access_requests ALTER COLUMN ends_at SET NOT NULL;
  ALTER TABLE public.identity_access_requests
    DROP CONSTRAINT IF EXISTS identity_access_requests_check;
  ALTER TABLE public.identity_access_requests
    ADD CONSTRAINT identity_access_requests_check CHECK (ends_at > starts_at);

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.identity_access_requests'::regclass
                  AND conname = 'identity_access_requests_approved_by_fkey') THEN
    ALTER TABLE public.identity_access_requests ADD CONSTRAINT identity_access_requests_approved_by_fkey
      FOREIGN KEY (approved_by) REFERENCES public.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.identity_access_requests'::regclass
                  AND conname = 'identity_access_requests_created_by_fkey') THEN
    ALTER TABLE public.identity_access_requests ADD CONSTRAINT identity_access_requests_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.identity_access_requests'::regclass
                  AND conname = 'identity_access_requests_rejected_by_fkey') THEN
    ALTER TABLE public.identity_access_requests ADD CONSTRAINT identity_access_requests_rejected_by_fkey
      FOREIGN KEY (rejected_by) REFERENCES public.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.identity_access_requests'::regclass
                  AND conname = 'identity_access_requests_updated_by_fkey') THEN
    ALTER TABLE public.identity_access_requests ADD CONSTRAINT identity_access_requests_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES public.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.identity_access_requests'::regclass
                  AND conname = 'identity_access_requests_version_check') THEN
    ALTER TABLE public.identity_access_requests ADD CONSTRAINT identity_access_requests_version_check
      CHECK (version > 0);
  END IF;

  IF EXISTS (SELECT 1 FROM public.identity_access_request_approvals
              WHERE status NOT IN ('pending','approved','rejected')) THEN
    RAISE EXCEPTION 'STAGING_IDENTITY_APPROVAL_STATUS_INVALID';
  END IF;
  IF EXISTS (SELECT 1 FROM public.identity_access_request_approvals
              GROUP BY request_id, approver_id HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'STAGING_IDENTITY_APPROVAL_DUPLICATE_APPROVER';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.identity_access_request_approvals'::regclass
                    AND conname = 'identity_access_request_approvals_approver_id_fkey') THEN
    ALTER TABLE public.identity_access_request_approvals
      ADD CONSTRAINT identity_access_request_approvals_approver_id_fkey
      FOREIGN KEY (approver_id) REFERENCES public.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.identity_access_request_approvals'::regclass
                    AND conname = 'identity_access_request_approvals_status_check') THEN
    ALTER TABLE public.identity_access_request_approvals
      ADD CONSTRAINT identity_access_request_approvals_status_check
      CHECK (status IN ('pending','approved','rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.identity_access_request_approvals'::regclass
                    AND conname = 'identity_access_request_approvals_request_id_approver_id_key') THEN
    IF EXISTS (SELECT 1 FROM pg_class i JOIN pg_namespace n ON n.oid=i.relnamespace
                WHERE n.nspname='public' AND i.relname='uq_identity_access_request_approver') THEN
      ALTER TABLE public.identity_access_request_approvals
        ADD CONSTRAINT identity_access_request_approvals_request_id_approver_id_key
        UNIQUE USING INDEX uq_identity_access_request_approver;
    ELSE
      ALTER TABLE public.identity_access_request_approvals
        ADD CONSTRAINT identity_access_request_approvals_request_id_approver_id_key
        UNIQUE (request_id, approver_id);
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_permission_grants g
    LEFT JOIN public.users u ON u.tenant_id=g.tenant_id AND u.id=g.user_id
    WHERE u.id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.user_permission_grants g
    LEFT JOIN public.schools s ON s.tenant_id=g.tenant_id AND s.id=g.school_id
    WHERE s.id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.user_permission_grants g
    LEFT JOIN public.branches b ON b.tenant_id=g.tenant_id AND b.school_id=g.school_id AND b.id=g.branch_id
    WHERE g.branch_id IS NOT NULL AND b.id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.user_permission_grants
     WHERE (deleted_at IS NULL) <> (deleted_by IS NULL)
        OR (branch_id IS NOT NULL AND school_id IS NULL)
  ) THEN
    RAISE EXCEPTION 'STAGING_USER_PERMISSION_GRANT_INTEGRITY_CHECK_FAILED';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_permission_grants WHERE version < 1) THEN
    RAISE EXCEPTION 'STAGING_USER_PERMISSION_GRANT_VERSION_INVALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
                  AND conname='pk_user_permission_grants')
     AND EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
                  AND conname='user_permission_grants_pkey') THEN
    ALTER TABLE public.user_permission_grants
      RENAME CONSTRAINT user_permission_grants_pkey TO pk_user_permission_grants;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
                  AND conname='ck_user_permission_grants_status')
     AND EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
                  AND conname='user_permission_grants_status_check') THEN
    ALTER TABLE public.user_permission_grants
      RENAME CONSTRAINT user_permission_grants_status_check TO ck_user_permission_grants_status;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
                  AND conname='ck_user_permission_grants_version') THEN
    ALTER TABLE public.user_permission_grants
      DROP CONSTRAINT IF EXISTS user_permission_grants_version_check;
    ALTER TABLE public.user_permission_grants
      ADD CONSTRAINT ck_user_permission_grants_version CHECK (version >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
                  AND conname='fk_user_permission_grants_permission') THEN
    ALTER TABLE public.user_permission_grants
      DROP CONSTRAINT IF EXISTS user_permission_grants_permission_fk;
    ALTER TABLE public.user_permission_grants
      ADD CONSTRAINT fk_user_permission_grants_permission FOREIGN KEY (permission_id)
      REFERENCES public.permissions(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
              AND conname='user_permission_grants_user_id_permission_id_source_key'
              AND pg_get_constraintdef(oid, true) <> 'UNIQUE (user_id, permission_id, source)') THEN
    RAISE EXCEPTION 'STAGING_USER_PERMISSION_DUPLICATE_CONSTRAINT_NOT_EQUIVALENT';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
              AND conname='user_permission_grants_user_id_permission_id_source_key') THEN
    ALTER TABLE public.user_permission_grants
      DROP CONSTRAINT user_permission_grants_user_id_permission_id_source_key;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
                  AND conname='uq_user_permission_grants_tenant_id') THEN
    ALTER TABLE public.user_permission_grants ADD CONSTRAINT uq_user_permission_grants_tenant_id
      UNIQUE (tenant_id, id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
                  AND conname='fk_user_permission_grants_user_scope') THEN
    ALTER TABLE public.user_permission_grants ADD CONSTRAINT fk_user_permission_grants_user_scope
      FOREIGN KEY (tenant_id,user_id) REFERENCES public.users(tenant_id,id) ON UPDATE RESTRICT ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
                  AND conname='fk_user_permission_grants_school_scope') THEN
    ALTER TABLE public.user_permission_grants ADD CONSTRAINT fk_user_permission_grants_school_scope
      FOREIGN KEY (tenant_id,school_id) REFERENCES public.schools(tenant_id,id) ON UPDATE RESTRICT ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
                  AND conname='fk_user_permission_grants_branch_scope') THEN
    ALTER TABLE public.user_permission_grants ADD CONSTRAINT fk_user_permission_grants_branch_scope
      FOREIGN KEY (tenant_id,school_id,branch_id)
      REFERENCES public.branches(tenant_id,school_id,id) ON UPDATE RESTRICT ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
                  AND conname='ck_user_permission_grants_branch_requires_school') THEN
    ALTER TABLE public.user_permission_grants ADD CONSTRAINT ck_user_permission_grants_branch_requires_school
      CHECK (branch_id IS NULL OR school_id IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_permission_grants'::regclass
                  AND conname='ck_user_permission_grants_soft_delete_pair') THEN
    ALTER TABLE public.user_permission_grants ADD CONSTRAINT ck_user_permission_grants_soft_delete_pair
      CHECK ((deleted_at IS NULL AND deleted_by IS NULL)
          OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL));
  END IF;

  EXECUTE 'ALTER ROLE authenticator SET pgrst.db_pre_request = ''public.dbsec003_set_request_context''';

  -- Only the narrow username-resolution RPC is intentionally available
  -- before authentication. Remove direct table and sequence access from anon
  -- and PUBLIC while retaining public-schema function access.
  EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon';
  EXECUTE 'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon';
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, anon';
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, anon';

  -- Restore the source migration's explicit write surface for documented
  -- Student Affairs operations without granting table access to anon.
  GRANT SELECT, INSERT ON public.enrollment_history TO authenticated;
  GRANT SELECT, INSERT, UPDATE ON public.enrollment_transfers TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_documents TO authenticated;
  GRANT SELECT, INSERT ON public.student_document_versions TO authenticated;
  GRANT SELECT, INSERT ON public.student_document_categories TO authenticated;
  GRANT SELECT, INSERT ON public.student_document_access_log TO authenticated;
  -- The document RLS predicates validate the linked student in a scoped
  -- subquery, so authenticated requests need SELECT under the students RLS.
  GRANT SELECT ON public.students TO authenticated;

  -- Financial audit and ledger rows are append-only evidence.
  REVOKE UPDATE, DELETE, TRUNCATE ON public.erp_financial_audit_events,
    public.erp_general_ledger FROM authenticated, edupro_app, edupro_staging_app;
  GRANT SELECT, INSERT ON public.erp_financial_audit_events,
    public.erp_general_ledger TO authenticated, edupro_app, edupro_staging_app;
END
$$;

NOTIFY pgrst, 'reload schema';
COMMIT;
