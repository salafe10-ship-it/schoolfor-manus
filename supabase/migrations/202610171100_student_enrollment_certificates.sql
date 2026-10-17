-- STU-CERT-001 — immutable, signed enrollment certificates.
-- The certificate payload is derived from canonical student/enrollment records
-- and can be verified without trusting browser state.

BEGIN;

CREATE TABLE public.student_enrollment_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  student_id uuid NOT NULL,
  enrollment_id uuid NOT NULL,
  certificate_number text NOT NULL,
  certificate_reference text NOT NULL,
  certificate_payload jsonb NOT NULL,
  payload_hash text NOT NULL,
  signature_algorithm text NOT NULL DEFAULT 'hmac-sha256',
  signature text NOT NULL,
  status text NOT NULL DEFAULT 'issued',
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid NOT NULL,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  audit_id uuid NOT NULL,
  request_id uuid NOT NULL,
  correlation_id uuid NOT NULL,
  CONSTRAINT fk_student_certificate_school FOREIGN KEY (tenant_id, school_id)
    REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_certificate_branch FOREIGN KEY (tenant_id, school_id, branch_id)
    REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_certificate_student FOREIGN KEY (tenant_id, student_id)
    REFERENCES public.students (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_certificate_enrollment FOREIGN KEY (tenant_id, enrollment_id)
    REFERENCES public.enrollments (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_certificate_issuer FOREIGN KEY (tenant_id, issued_by)
    REFERENCES public.users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_certificate_creator FOREIGN KEY (tenant_id, created_by)
    REFERENCES public.users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_certificate_audit FOREIGN KEY (tenant_id, audit_id)
    REFERENCES public.audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT uq_student_certificate_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_student_certificate_number UNIQUE (tenant_id, certificate_number),
  CONSTRAINT uq_student_certificate_reference UNIQUE (tenant_id, certificate_reference),
  CONSTRAINT uq_student_certificate_idempotency UNIQUE (tenant_id, idempotency_key),
  CONSTRAINT ck_student_certificate_hash CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT ck_student_certificate_algorithm CHECK (signature_algorithm = 'hmac-sha256'),
  CONSTRAINT ck_student_certificate_status CHECK (status IN ('issued', 'revoked')),
  CONSTRAINT ck_student_certificate_text CHECK (
    length(btrim(certificate_number)) > 0
    AND length(btrim(certificate_reference)) > 0
    AND length(btrim(signature)) > 0
    AND length(btrim(idempotency_key)) > 0
  )
);

CREATE INDEX idx_student_certificate_student
  ON public.student_enrollment_certificates (tenant_id, school_id, branch_id, student_id, issued_at DESC);

ALTER TABLE public.student_enrollment_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollment_certificates FORCE ROW LEVEL SECURITY;

CREATE POLICY p_student_certificate_select
  ON public.student_enrollment_certificates FOR SELECT TO authenticated
  USING (
    public.dbsec003_is_super_admin()
    OR (
      tenant_id = public.dbsec004_current_tenant_id()
      AND school_id = public.dbsec004_current_school_id()
      AND branch_id = public.dbsec004_current_branch_id()
    )
  );

CREATE POLICY p_student_certificate_insert
  ON public.student_enrollment_certificates FOR INSERT TO authenticated
  WITH CHECK (
    public.dbsec003_is_super_admin()
    OR (
      tenant_id = public.dbsec004_current_tenant_id()
      AND school_id = public.dbsec004_current_school_id()
      AND branch_id = public.dbsec004_current_branch_id()
      AND EXISTS (
        SELECT 1
          FROM public.users actor
         WHERE actor.id = student_enrollment_certificates.created_by
           AND actor.auth_user_id::text = current_setting('app.user_id', true)
           AND actor.tenant_id = student_enrollment_certificates.tenant_id
           AND actor.status = 'active'
           AND actor.deleted_at IS NULL
      )
    )
  );

REVOKE ALL ON public.student_enrollment_certificates FROM PUBLIC, anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.student_enrollment_certificates FROM authenticated, edupro_app;
GRANT SELECT, INSERT ON public.student_enrollment_certificates TO authenticated, edupro_app;

COMMIT;
