-- Canonical identity profile fields used by the central directory.
-- These are identity attributes only; school operational records remain tenant-scoped.

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS department text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'ck_users_job_title_length'
       AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT ck_users_job_title_length
      CHECK (job_title IS NULL OR length(btrim(job_title)) BETWEEN 1 AND 160);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'ck_users_department_length'
       AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT ck_users_department_length
      CHECK (department IS NULL OR length(btrim(department)) BETWEEN 1 AND 160);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_tenant_department
  ON public.users (tenant_id, department, status);

COMMENT ON COLUMN public.users.job_title IS 'Institutional job title for identity directory and lifecycle governance.';
COMMENT ON COLUMN public.users.department IS 'Institutional department for identity directory and lifecycle governance.';

NOTIFY pgrst, 'reload schema';
COMMIT;
