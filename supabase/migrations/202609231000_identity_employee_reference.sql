-- Link school identity profiles to the canonical HR employee record.
BEGIN;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS employee_id text;
CREATE INDEX IF NOT EXISTS idx_users_school_employee_id ON public.users (tenant_id, school_id, employee_id) WHERE deleted_at IS NULL AND employee_id IS NOT NULL;
COMMENT ON COLUMN public.users.employee_id IS 'Canonical HR employee identifier; source record lives in hr_database.data.employees.';
NOTIFY pgrst, 'reload schema';
COMMIT;
