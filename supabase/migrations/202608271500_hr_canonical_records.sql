-- Canonical, country-neutral Human Resources record store.
-- Labour, payroll and leave rules are deliberately data/configuration, not
-- hard-coded assumptions. Each school owns one versioned HR snapshot.

BEGIN;

CREATE TABLE IF NOT EXISTS public.hr_database (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    country_code text NOT NULL DEFAULT 'ZZ',
    legal_configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
    data jsonb NOT NULL DEFAULT '{"employees":[],"departments":[],"jobs":[],"contracts":[],"attendance":[],"leaves":[],"penalties":[],"advances":[],"rewards":[],"performance":[],"documents":[],"settings":{}}'::jsonb,
    version bigint NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    PRIMARY KEY (school_id),
    CONSTRAINT fk_hr_database_school FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_hr_database_actor FOREIGN KEY (tenant_id, updated_by)
        REFERENCES public.users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_hr_database_country_code CHECK (country_code ~ '^[A-Z]{2}$'),
    CONSTRAINT ck_hr_database_data_object CHECK (jsonb_typeof(data) = 'object'),
    CONSTRAINT ck_hr_database_legal_configuration_object CHECK (jsonb_typeof(legal_configuration) = 'object'),
    CONSTRAINT ck_hr_database_version CHECK (version >= 0)
);

CREATE INDEX IF NOT EXISTS idx_hr_database_tenant_updated
    ON public.hr_database (tenant_id, updated_at DESC);

ALTER TABLE public.hr_database ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.hr_database FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.hr_database TO authenticated;

DROP POLICY IF EXISTS p_hr_database_select_scope ON public.hr_database;
CREATE POLICY p_hr_database_select_scope ON public.hr_database FOR SELECT TO authenticated
    USING (tenant_id::text = current_setting('app.tenant_id', true)
       AND school_id::text = current_setting('app.school_id', true));

DROP POLICY IF EXISTS p_hr_database_insert_scope ON public.hr_database;
CREATE POLICY p_hr_database_insert_scope ON public.hr_database FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
        AND EXISTS (
          SELECT 1 FROM public.users actor
           WHERE actor.tenant_id = public.hr_database.tenant_id
             AND actor.id = public.hr_database.updated_by
             AND actor.auth_user_id::text = current_setting('app.user_id', true)
             AND actor.status = 'active' AND actor.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS p_hr_database_update_scope ON public.hr_database;
CREATE POLICY p_hr_database_update_scope ON public.hr_database FOR UPDATE TO authenticated
    USING (tenant_id::text = current_setting('app.tenant_id', true)
       AND school_id::text = current_setting('app.school_id', true))
    WITH CHECK (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
        AND EXISTS (
          SELECT 1 FROM public.users actor
           WHERE actor.tenant_id = public.hr_database.tenant_id
             AND actor.id = public.hr_database.updated_by
             AND actor.auth_user_id::text = current_setting('app.user_id', true)
             AND actor.status = 'active' AND actor.deleted_at IS NULL
        )
    );

NOTIFY pgrst, 'reload schema';
COMMIT;
