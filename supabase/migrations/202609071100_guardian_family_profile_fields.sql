-- Additional Student Affairs guardian/family profile fields requested for handoff.
-- Nullable by design: existing guardian records remain valid and can be completed
-- from the Student Affairs guardian tab without fabricating data.

BEGIN;

ALTER TABLE public.guardians
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS education_level text,
  ADD COLUMN IF NOT EXISTS mother_name text,
  ADD COLUMN IF NOT EXISTS mother_phone text,
  ADD COLUMN IF NOT EXISTS mother_whatsapp text;

COMMENT ON COLUMN public.guardians.occupation IS 'Guardian occupation / وظيفة ولي الأمر';
COMMENT ON COLUMN public.guardians.education_level IS 'Guardian education level / المستوى التعليمي لولي الأمر';
COMMENT ON COLUMN public.guardians.mother_name IS 'Student mother full name / اسم الأم';
COMMENT ON COLUMN public.guardians.mother_phone IS 'Student mother phone / رقم هاتف الأم';
COMMENT ON COLUMN public.guardians.mother_whatsapp IS 'Student mother WhatsApp phone / واتساب الأم';

COMMIT;
