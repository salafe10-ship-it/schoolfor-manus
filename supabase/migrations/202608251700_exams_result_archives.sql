-- Immutable, server-signed archives created when exam results are approved.
-- Application roles can insert and read archives, but cannot update or delete them.

BEGIN;

CREATE TABLE IF NOT EXISTS public.exams_result_archives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    operational_version bigint NOT NULL,
    academic_year text NOT NULL,
    semester text NOT NULL,
    payload jsonb NOT NULL,
    signature_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    CONSTRAINT uq_exams_result_archives_school_version UNIQUE (school_id, operational_version),
    CONSTRAINT fk_exams_result_archives_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_exams_result_archives_actor
        FOREIGN KEY (tenant_id, created_by)
        REFERENCES public.users (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_exams_result_archives_version CHECK (operational_version > 0),
    CONSTRAINT ck_exams_result_archives_payload_object CHECK (jsonb_typeof(payload) = 'object'),
    CONSTRAINT ck_exams_result_archives_signature CHECK (signature_hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX IF NOT EXISTS idx_exams_result_archives_scope_created
    ON public.exams_result_archives (tenant_id, school_id, created_at DESC);

ALTER TABLE public.exams_result_archives ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.exams_result_archives FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.exams_result_archives TO authenticated;

DROP POLICY IF EXISTS p_exams_result_archives_select_scope ON public.exams_result_archives;
CREATE POLICY p_exams_result_archives_select_scope
    ON public.exams_result_archives
    FOR SELECT TO authenticated
    USING (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
    );

DROP POLICY IF EXISTS p_exams_result_archives_insert_scope ON public.exams_result_archives;
CREATE POLICY p_exams_result_archives_insert_scope
    ON public.exams_result_archives
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
        AND EXISTS (
            SELECT 1 FROM public.users actor
             WHERE actor.tenant_id = public.exams_result_archives.tenant_id
               AND actor.id = public.exams_result_archives.created_by
               AND actor.auth_user_id::text = current_setting('app.user_id', true)
               AND actor.status = 'active'
               AND actor.deleted_at IS NULL
        )
    );

NOTIFY pgrst, 'reload schema';

COMMIT;
