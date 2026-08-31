-- STU-AFFAIRS-STORAGE-001 — private, tenant/school/branch isolated binary storage.
-- Binary objects are never exposed through public storage policies. The trusted
-- server uploads with the service role and issues short-lived signed URLs only
-- after authorizing the canonical metadata row below.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents-private',
  'student-documents-private',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg']::text[]
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE public.student_document_storage_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  student_id uuid NOT NULL,
  document_id uuid NOT NULL,
  document_version_id uuid NOT NULL,
  bucket_id text NOT NULL DEFAULT 'student-documents-private',
  object_key text NOT NULL,
  media_type text NOT NULL,
  byte_size bigint NOT NULL,
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  audit_id uuid NOT NULL,
  request_id uuid NOT NULL,
  correlation_id uuid NOT NULL,
  CONSTRAINT fk_student_document_storage_tenant FOREIGN KEY (tenant_id)
    REFERENCES public.tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_document_storage_school FOREIGN KEY (tenant_id, school_id)
    REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_document_storage_branch FOREIGN KEY (tenant_id, school_id, branch_id)
    REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_document_storage_student FOREIGN KEY (tenant_id, student_id)
    REFERENCES public.students (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_document_storage_document FOREIGN KEY (tenant_id, document_id)
    REFERENCES public.student_documents (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_document_storage_version FOREIGN KEY (tenant_id, document_id, document_version_id)
    REFERENCES public.student_document_versions (tenant_id, document_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_document_storage_actor FOREIGN KEY (tenant_id, created_by)
    REFERENCES public.users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_document_storage_audit FOREIGN KEY (tenant_id, audit_id)
    REFERENCES public.audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT uq_student_document_storage_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_student_document_storage_version UNIQUE (tenant_id, document_version_id),
  CONSTRAINT uq_student_document_storage_object UNIQUE (bucket_id, object_key),
  CONSTRAINT ck_student_document_storage_bucket CHECK (bucket_id = 'student-documents-private'),
  CONSTRAINT ck_student_document_storage_key CHECK (
    object_key = btrim(object_key)
    AND object_key !~ '(^|/)\.\.(/|$)'
    AND object_key ~ '^[0-9a-f-]+/[0-9a-f-]+/[0-9a-f-]+/[0-9a-f-]+/[0-9a-f]{64}\.(pdf|png|jpg)$'
  ),
  CONSTRAINT ck_student_document_storage_media CHECK (media_type IN ('application/pdf', 'image/png', 'image/jpeg')),
  CONSTRAINT ck_student_document_storage_size CHECK (byte_size > 0 AND byte_size <= 10485760),
  CONSTRAINT ck_student_document_storage_hash CHECK (content_hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX idx_student_document_storage_document
  ON public.student_document_storage_objects (tenant_id, school_id, branch_id, document_id, created_at DESC);

ALTER TABLE public.student_document_storage_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_document_storage_objects FORCE ROW LEVEL SECURITY;

CREATE POLICY p_student_document_storage_select
  ON public.student_document_storage_objects
  FOR SELECT TO authenticated
  USING (
    public.dbsec003_is_super_admin()
    OR (
      tenant_id = public.dbsec004_current_tenant_id()
      AND school_id = public.dbsec004_current_school_id()
      AND branch_id = public.dbsec004_current_branch_id()
      AND EXISTS (
        SELECT 1
          FROM public.student_documents d
         WHERE d.tenant_id = student_document_storage_objects.tenant_id
           AND d.school_id = student_document_storage_objects.school_id
           AND d.branch_id = student_document_storage_objects.branch_id
           AND d.student_id = student_document_storage_objects.student_id
           AND d.id = student_document_storage_objects.document_id
      )
    )
  );

CREATE POLICY p_student_document_storage_insert
  ON public.student_document_storage_objects
  FOR INSERT TO authenticated
  WITH CHECK (
    public.dbsec003_is_super_admin()
    OR (
      tenant_id = public.dbsec004_current_tenant_id()
      AND school_id = public.dbsec004_current_school_id()
      AND branch_id = public.dbsec004_current_branch_id()
      AND EXISTS (
        SELECT 1
          FROM public.student_document_versions v
         WHERE v.tenant_id = student_document_storage_objects.tenant_id
           AND v.school_id = student_document_storage_objects.school_id
           AND v.branch_id = student_document_storage_objects.branch_id
           AND v.student_id = student_document_storage_objects.student_id
           AND v.document_id = student_document_storage_objects.document_id
           AND v.id = student_document_storage_objects.document_version_id
      )
      AND EXISTS (
        SELECT 1
          FROM public.users actor
         WHERE actor.tenant_id = student_document_storage_objects.tenant_id
           AND actor.id = student_document_storage_objects.created_by
           AND actor.auth_user_id::text = current_setting('app.user_id', true)
           AND actor.status = 'active'
           AND actor.deleted_at IS NULL
      )
    )
  );

REVOKE ALL ON public.student_document_storage_objects FROM PUBLIC, anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.student_document_storage_objects FROM authenticated, edupro_app;
GRANT SELECT, INSERT ON public.student_document_storage_objects TO authenticated;
GRANT SELECT, INSERT ON public.student_document_storage_objects TO edupro_app;

-- No policies are created on storage.objects. Browser clients therefore cannot
-- list, read, insert, update, or delete these private objects directly.

COMMIT;
