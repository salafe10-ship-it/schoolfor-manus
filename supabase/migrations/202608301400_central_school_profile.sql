-- Central school profile metadata owned by the canonical schools directory.
-- Authentication credentials are intentionally excluded from this payload.

BEGIN;

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS central_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'ck_schools_central_metadata_object'
       AND conrelid = 'public.schools'::regclass
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT ck_schools_central_metadata_object
      CHECK (jsonb_typeof(central_metadata) = 'object');
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_schools_central_metadata_gin
  ON public.schools USING gin (central_metadata);

NOTIFY pgrst, 'reload schema';
COMMIT;
