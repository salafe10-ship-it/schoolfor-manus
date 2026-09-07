-- Student Affairs: academic, health, and social profile information.
-- All fields are kept on the canonical student row so registration and
-- concurrent profile updates remain atomic and tenant-scoped.
BEGIN;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS academic_previous_school text,
  ADD COLUMN IF NOT EXISTS academic_previous_grade text,
  ADD COLUMN IF NOT EXISTS academic_previous_year text,
  ADD COLUMN IF NOT EXISTS academic_performance_level text,
  ADD COLUMN IF NOT EXISTS academic_writing_level text,
  ADD COLUMN IF NOT EXISTS academic_reading_level text,
  ADD COLUMN IF NOT EXISTS academic_spelling_level text,
  ADD COLUMN IF NOT EXISTS academic_average text,
  ADD COLUMN IF NOT EXISTS academic_notes text,
  ADD COLUMN IF NOT EXISTS health_chronic_diseases text,
  ADD COLUMN IF NOT EXISTS health_medications text,
  ADD COLUMN IF NOT EXISTS health_allergies text,
  ADD COLUMN IF NOT EXISTS health_notes text,
  ADD COLUMN IF NOT EXISTS social_living_with text,
  ADD COLUMN IF NOT EXISTS social_birth_order text,
  ADD COLUMN IF NOT EXISTS social_family_view text,
  ADD COLUMN IF NOT EXISTS social_outside_traits text;

COMMENT ON COLUMN public.students.academic_previous_school IS 'Previous school / المدرسة السابقة';
COMMENT ON COLUMN public.students.academic_previous_grade IS 'Previous academic grade / آخر صف دراسي';
COMMENT ON COLUMN public.students.academic_previous_year IS 'Previous academic year / العام الدراسي السابق';
COMMENT ON COLUMN public.students.academic_performance_level IS 'Academic performance level / مستوى التحصيل الدراسي';
COMMENT ON COLUMN public.students.academic_writing_level IS 'Writing level / مستوى الكتابة';
COMMENT ON COLUMN public.students.academic_reading_level IS 'Reading level / مستوى القراءة';
COMMENT ON COLUMN public.students.academic_spelling_level IS 'Spelling level / مستوى الإملاء';
COMMENT ON COLUMN public.students.academic_average IS 'Academic average / المعدل الدراسي';
COMMENT ON COLUMN public.students.academic_notes IS 'Academic notes / ملاحظات أكاديمية';
COMMENT ON COLUMN public.students.health_chronic_diseases IS 'Chronic diseases / الأمراض المزمنة';
COMMENT ON COLUMN public.students.health_medications IS 'Current medications / الأدوية التي يتناولها';
COMMENT ON COLUMN public.students.health_allergies IS 'Food or other allergies / الأطعمة التي تسبب التحسس';
COMMENT ON COLUMN public.students.health_notes IS 'Important medical notes / ملاحظات طبية مهمة';
COMMENT ON COLUMN public.students.social_living_with IS 'Who the student lives with / مع من يسكن الطالب';
COMMENT ON COLUMN public.students.social_birth_order IS 'Student order among siblings / ترتيب الطالب في الأسرة';
COMMENT ON COLUMN public.students.social_family_view IS 'Family view of sociality / اجتماعي في نظر الأسرة';
COMMENT ON COLUMN public.students.social_outside_traits IS 'Social traits outside the family / اجتماعيات الطالب خارج الأسرة';

COMMIT;
