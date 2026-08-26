-- Canonical, versioned persistence for the Exams & Results module.
-- One mutable operational snapshot is kept per school. Immutable result
-- closures are normalized by the companion exams_result_archives migration.

BEGIN;

CREATE TABLE IF NOT EXISTS public.exams_database (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    version bigint NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    PRIMARY KEY (school_id),
    CONSTRAINT fk_exams_database_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_exams_database_actor
        FOREIGN KEY (tenant_id, updated_by)
        REFERENCES public.users (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_exams_database_version CHECK (version >= 0),
    CONSTRAINT ck_exams_database_payload_object CHECK (jsonb_typeof(data) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_exams_database_tenant_updated
    ON public.exams_database (tenant_id, updated_at DESC);

ALTER TABLE public.exams_database ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.exams_database FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.exams_database TO authenticated;

DROP POLICY IF EXISTS p_exams_database_select_scope ON public.exams_database;
CREATE POLICY p_exams_database_select_scope
    ON public.exams_database
    FOR SELECT TO authenticated
    USING (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
    );

DROP POLICY IF EXISTS p_exams_database_insert_scope ON public.exams_database;
CREATE POLICY p_exams_database_insert_scope
    ON public.exams_database
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
        AND EXISTS (
            SELECT 1 FROM public.users actor
             WHERE actor.tenant_id = public.exams_database.tenant_id
               AND actor.id = public.exams_database.updated_by
               AND actor.auth_user_id::text = current_setting('app.user_id', true)
               AND actor.status = 'active'
               AND actor.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS p_exams_database_update_scope ON public.exams_database;
CREATE POLICY p_exams_database_update_scope
    ON public.exams_database
    FOR UPDATE TO authenticated
    USING (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
    )
    WITH CHECK (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
        AND EXISTS (
            SELECT 1 FROM public.users actor
             WHERE actor.tenant_id = public.exams_database.tenant_id
               AND actor.id = public.exams_database.updated_by
               AND actor.auth_user_id::text = current_setting('app.user_id', true)
               AND actor.status = 'active'
               AND actor.deleted_at IS NULL
        )
    );

NOTIFY pgrst, 'reload schema';

COMMIT;
