-- Link identity profiles to the canonical HR job catalogue without creating a
-- cross-table foreign key: HR jobs are versioned inside hr_database.data.jobs.
BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS job_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'ck_users_job_id_length'
       AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT ck_users_job_id_length
      CHECK (job_id IS NULL OR length(btrim(job_id)) BETWEEN 1 AND 120);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_school_job_id
  ON public.users (tenant_id, school_id, job_id)
  WHERE deleted_at IS NULL AND job_id IS NOT NULL;

COMMENT ON COLUMN public.users.job_id IS 'Canonical HR job identifier snapshot; source catalogue lives in hr_database.data.jobs.';

NOTIFY pgrst, 'reload schema';
COMMIT;
