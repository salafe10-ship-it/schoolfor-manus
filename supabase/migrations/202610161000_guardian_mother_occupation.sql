-- Add the mother's occupation to the canonical guardian/family profile.
-- Nullable by design so existing guardian records remain valid until completed.

BEGIN;

ALTER TABLE public.guardians
  ADD COLUMN IF NOT EXISTS mother_occupation text;

COMMENT ON COLUMN public.guardians.mother_occupation IS 'Student mother occupation / وظيفة الأم';

COMMIT;
