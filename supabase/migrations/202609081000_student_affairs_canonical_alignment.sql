-- Canonical Student Affairs alignment for the central school template.
-- Schema-only: no operational records are copied between schools.

BEGIN;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS national_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_students_national_id_format'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT ck_students_national_id_format CHECK (
        national_id IS NULL
        OR (national_id = btrim(national_id) AND length(national_id) BETWEEN 3 AND 50)
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_students_school_national_id_live
  ON public.students (school_id, national_id)
  WHERE national_id IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN public.students.national_id IS
  'Government identity number; optional during intake and unique within the school while live.';

COMMIT;
