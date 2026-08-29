-- Forward-only upgrade for HR payroll workflow persistence.
-- The original HR migration is already applied on Staging and remains immutable.

BEGIN;

ALTER TABLE public.hr_database
    ALTER COLUMN data SET DEFAULT '{"employees":[],"departments":[],"jobs":[],"contracts":[],"attendance":[],"leaves":[],"penalties":[],"advances":[],"rewards":[],"performance":[],"documents":[],"payrollRuns":[],"settings":{}}'::jsonb;

WITH upgraded AS (
    UPDATE public.hr_database
       SET data = jsonb_set(data, '{payrollRuns}', '[]'::jsonb, true),
           version = version + 1,
           updated_at = now()
     WHERE NOT (data ? 'payrollRuns')
     RETURNING tenant_id, school_id, updated_by, version
)
INSERT INTO public.audit_events (
    tenant_id,
    school_id,
    branch_id,
    actor_user_id,
    entity_type,
    entity_id,
    action,
    source,
    reason,
    result,
    metadata
)
SELECT
    tenant_id,
    school_id,
    NULL,
    updated_by,
    'hr_database',
    school_id,
    'schema_upgrade',
    '202608291000_hr_payroll_runs_snapshot',
    'إضافة قائمة مسيرات الرواتب إلى سجل الموارد البشرية الكانوني',
    'success',
    jsonb_build_object('version', version, 'collection', 'payrollRuns')
FROM upgraded;

NOTIFY pgrst, 'reload schema';

COMMIT;
