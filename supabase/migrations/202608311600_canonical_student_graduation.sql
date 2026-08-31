-- STU-GRAD-001 — immutable, evidence-backed canonical graduation.

BEGIN;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.exams_result_archives'::regclass
      AND conname = 'uq_exams_result_archives_scope_id'
  ) THEN
    ALTER TABLE public.exams_result_archives
      ADD CONSTRAINT uq_exams_result_archives_scope_id UNIQUE (tenant_id, school_id, id);
  END IF;
END
$migration$;

CREATE TABLE public.student_graduation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  student_id uuid NOT NULL,
  enrollment_id uuid NOT NULL,
  result_archive_id uuid NOT NULL,
  academic_year text NOT NULL,
  semester text NOT NULL,
  result_percentage numeric(7,3) NOT NULL,
  grade_symbol text NOT NULL,
  cohort_rank integer,
  approval_status text NOT NULL DEFAULT 'approved',
  approval_reason text NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid NOT NULL,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  audit_id uuid NOT NULL,
  request_id uuid NOT NULL,
  correlation_id uuid NOT NULL,
  CONSTRAINT fk_student_graduation_school FOREIGN KEY (tenant_id, school_id)
    REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_graduation_branch FOREIGN KEY (tenant_id, school_id, branch_id)
    REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_graduation_student FOREIGN KEY (tenant_id, student_id)
    REFERENCES public.students (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_graduation_enrollment FOREIGN KEY (tenant_id, enrollment_id)
    REFERENCES public.enrollments (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_graduation_result_archive FOREIGN KEY (tenant_id, school_id, result_archive_id)
    REFERENCES public.exams_result_archives (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_graduation_approver FOREIGN KEY (tenant_id, approved_by)
    REFERENCES public.users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_graduation_creator FOREIGN KEY (tenant_id, created_by)
    REFERENCES public.users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_graduation_audit FOREIGN KEY (tenant_id, audit_id)
    REFERENCES public.audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT uq_student_graduation_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_student_graduation_student_enrollment UNIQUE (tenant_id, student_id, enrollment_id),
  CONSTRAINT uq_student_graduation_idempotency UNIQUE (tenant_id, idempotency_key),
  CONSTRAINT ck_student_graduation_result CHECK (result_percentage >= 0 AND result_percentage <= 100),
  CONSTRAINT ck_student_graduation_rank CHECK (cohort_rank IS NULL OR cohort_rank > 0),
  CONSTRAINT ck_student_graduation_approved CHECK (approval_status = 'approved'),
  CONSTRAINT ck_student_graduation_reason CHECK (length(btrim(approval_reason)) >= 3),
  CONSTRAINT ck_student_graduation_year CHECK (length(btrim(academic_year)) > 0),
  CONSTRAINT ck_student_graduation_semester CHECK (length(btrim(semester)) > 0),
  CONSTRAINT ck_student_graduation_grade CHECK (length(btrim(grade_symbol)) > 0),
  CONSTRAINT ck_student_graduation_idempotency CHECK (length(btrim(idempotency_key)) > 0)
);

CREATE INDEX idx_student_graduation_school_year
  ON public.student_graduation_records (tenant_id, school_id, branch_id, academic_year, approved_at DESC);

ALTER TABLE public.student_graduation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_graduation_records FORCE ROW LEVEL SECURITY;

CREATE POLICY p_student_graduation_select
  ON public.student_graduation_records FOR SELECT TO authenticated
  USING (
    public.dbsec003_is_super_admin()
    OR (
      tenant_id = public.dbsec004_current_tenant_id()
      AND school_id = public.dbsec004_current_school_id()
      AND branch_id = public.dbsec004_current_branch_id()
    )
  );

CREATE POLICY p_student_graduation_insert
  ON public.student_graduation_records FOR INSERT TO authenticated
  WITH CHECK (
    public.dbsec003_is_super_admin()
    OR (
      tenant_id = public.dbsec004_current_tenant_id()
      AND school_id = public.dbsec004_current_school_id()
      AND branch_id = public.dbsec004_current_branch_id()
      AND EXISTS (
        SELECT 1 FROM public.users actor
         WHERE actor.tenant_id = student_graduation_records.tenant_id
           AND actor.id = student_graduation_records.created_by
           AND actor.auth_user_id::text = current_setting('app.user_id', true)
           AND actor.status = 'active' AND actor.deleted_at IS NULL
      )
    )
  );

REVOKE ALL ON public.student_graduation_records FROM PUBLIC, anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.student_graduation_records FROM authenticated, edupro_app;
GRANT SELECT, INSERT ON public.student_graduation_records TO authenticated;
GRANT SELECT, INSERT ON public.student_graduation_records TO edupro_app;

ALTER TABLE public.student_status_transitions
  DROP CONSTRAINT IF EXISTS ck_student_status_transitions_allowed;

ALTER TABLE public.student_status_transitions
  ADD CONSTRAINT ck_student_status_transitions_allowed CHECK (
    (transition_kind = 'initial' AND from_status IS NULL AND to_status = 'applicant')
    OR (
      transition_kind = 'ordinary' AND (
        (from_status = 'applicant' AND to_status = 'admitted')
        OR (from_status = 'admitted' AND to_status = 'active')
        OR (from_status = 'active' AND to_status = 'suspended')
        OR (from_status = 'active' AND to_status = 'withdrawn')
        OR (from_status = 'active' AND to_status = 'graduated')
        OR (from_status = 'suspended' AND to_status = 'withdrawn')
        OR (from_status = 'withdrawn' AND to_status = 'graduated')
        OR (from_status = 'graduated' AND to_status = 'archived')
      )
    )
    OR (
      transition_kind = 'correction'
      AND correction_reference IS NOT NULL
      AND length(btrim(correction_reference)) > 0
      AND approval_status IN ('approved', 'completed')
    )
  );

COMMIT;
