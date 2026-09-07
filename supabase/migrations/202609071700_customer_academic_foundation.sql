-- Automatically activate the academic foundation for every customer school.
--
-- This copies configuration only: the central school's academic structure,
-- academic year and terms are copied, while students, guardians, finance,
-- HR and inventory remain strictly isolated per school.

BEGIN;

CREATE OR REPLACE FUNCTION public.provision_customer_academic_foundation(
  p_school_id uuid,
  p_tenant_id uuid,
  p_branch_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  central_school_id uuid;
  central_year_id uuid;
  central_code text;
  central_name text;
  central_starts_on date;
  central_ends_on date;
  target_year_id uuid;
  structure jsonb;
  start_year integer;
BEGIN
  IF p_school_id IS NULL OR p_tenant_id IS NULL THEN
    RETURN;
  END IF;

  IF p_branch_id IS NULL THEN
    SELECT b.id
      INTO p_branch_id
      FROM public.branches b
     WHERE b.school_id = p_school_id
       AND b.status = 'active'
       AND b.deleted_at IS NULL
     ORDER BY b.created_at ASC, b.id ASC
     LIMIT 1;
  END IF;

  SELECT s.id
    INTO central_school_id
    FROM public.schools s
   WHERE s.school_code = 'CENTRAL-SCHOOL'
     AND s.status = 'active'
     AND s.deleted_at IS NULL
   ORDER BY s.created_at ASC, s.id ASC
   LIMIT 1;

  SELECT y.id, y.code, y.name, y.starts_on, y.ends_on
    INTO central_year_id, central_code, central_name, central_starts_on, central_ends_on
    FROM public.academic_years y
   WHERE y.school_id = central_school_id
     AND y.is_current = true
     AND y.status = 'active'
     AND y.deleted_at IS NULL
   ORDER BY y.starts_on DESC, y.id ASC
   LIMIT 1;

  IF central_code IS NULL THEN
    start_year := CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 9
                       THEN EXTRACT(YEAR FROM CURRENT_DATE)::integer
                       ELSE EXTRACT(YEAR FROM CURRENT_DATE)::integer - 1
                  END;
    central_code := format('%s-%s', start_year, start_year + 1);
    central_name := format('العام الدراسي %s', central_code);
    central_starts_on := make_date(start_year, 9, 1);
    central_ends_on := make_date(start_year + 1, 6, 30);
  END IF;

  INSERT INTO public.academic_years (
    id, tenant_id, school_id, branch_id, code, name, starts_on, ends_on,
    is_current, status, created_by, updated_by
  )
  VALUES (
    gen_random_uuid(), p_tenant_id, p_school_id, p_branch_id, central_code,
    central_name, central_starts_on, central_ends_on, true, 'active', NULL, NULL
  )
  ON CONFLICT (school_id, code) DO UPDATE
    SET is_current = true,
        status = 'active',
        branch_id = COALESCE(public.academic_years.branch_id, EXCLUDED.branch_id),
        updated_at = now(),
        version = public.academic_years.version + 1;

  SELECT y.id
    INTO target_year_id
    FROM public.academic_years y
   WHERE y.school_id = p_school_id
     AND y.code = central_code
     AND y.deleted_at IS NULL
   LIMIT 1;

  UPDATE public.academic_years
     SET is_current = false,
         updated_at = now(),
         version = version + 1
   WHERE school_id = p_school_id
     AND id <> target_year_id
     AND deleted_at IS NULL;

  SELECT ss.setting_value
    INTO structure
    FROM public.school_settings ss
   WHERE ss.school_id = central_school_id
     AND ss.setting_key = 'academic_structure'
     AND ss.status = 'active'
     AND ss.deleted_at IS NULL
   ORDER BY ss.effective_from DESC, ss.version DESC
   LIMIT 1;

  IF structure IS NULL OR jsonb_typeof(structure) <> 'object'
     OR jsonb_array_length(COALESCE(structure->'stages', '[]'::jsonb)) = 0
     OR jsonb_array_length(COALESCE(structure->'grades', '[]'::jsonb)) = 0 THEN
    structure := '{
      "stages":[
        {"id":"stage_kg","code":"ST-KG","name":"مرحلة رياض الأطفال والتمهيدي","type":"kindergarten","order":1,"isActive":true},
        {"id":"stage_primary","code":"ST-PRI","name":"المرحلة الابتدائية","type":"primary","order":2,"isActive":true},
        {"id":"stage_middle","code":"ST-MID","name":"المرحلة المتوسطة","type":"middle","order":3,"isActive":true},
        {"id":"stage_high","code":"ST-HIGH","name":"المرحلة الثانوية","type":"secondary","order":4,"isActive":true}
      ],
      "grades":[
        {"id":"grade_pri1","stageId":"stage_primary","code":"PRI1","name":"الصف الأول الابتدائي","order":1,"isActive":true},
        {"id":"grade_pri2","stageId":"stage_primary","code":"PRI2","name":"الصف الثاني الابتدائي","order":2,"isActive":true},
        {"id":"grade_mid1","stageId":"stage_middle","code":"MID1","name":"الصف الأول المتوسط","order":1,"isActive":true},
        {"id":"grade_high1","stageId":"stage_high","code":"HIGH1","name":"الصف الأول الثانوي","order":1,"isActive":true}
      ],
      "classes":[
        {"id":"cls_pri1_a","gradeId":"grade_pri1","code":"PRI1-A","name":"أولى ابتدائي أ","capacity":25,"isActive":true},
        {"id":"cls_pri2_a","gradeId":"grade_pri2","code":"PRI2-A","name":"ثانية ابتدائي أ","capacity":25,"isActive":true},
        {"id":"cls_mid1_a","gradeId":"grade_mid1","code":"MID1-A","name":"أولى متوسط أ","capacity":30,"isActive":true},
        {"id":"cls_high1_a","gradeId":"grade_high1","code":"HIGH1-A","name":"أولى ثانوي أ","capacity":35,"isActive":true}
      ],
      "sections":["أ","ب","ج","د"]
    }'::jsonb;
  END IF;

  UPDATE public.school_settings
     SET setting_value = structure,
         status = 'active',
         deleted_at = NULL,
         deleted_by = NULL,
         updated_at = now(),
         version = version + 1
   WHERE school_id = p_school_id
     AND setting_key = 'academic_structure'
     AND status = 'active'
     AND deleted_at IS NULL;
  IF NOT FOUND THEN
    INSERT INTO public.school_settings (
      tenant_id, school_id, setting_key, setting_value, effective_from,
      status, created_by, updated_by, version
    ) VALUES (
      p_tenant_id, p_school_id, 'academic_structure', structure, now(),
      'active', NULL, NULL, 1
    );
  END IF;

  IF central_year_id IS NOT NULL THEN
    INSERT INTO public.terms (
      id, tenant_id, school_id, branch_id, academic_year_id, code, name,
      sequence, starts_on, ends_on, status, created_by, updated_by
    )
    SELECT gen_random_uuid(), p_tenant_id, p_school_id, p_branch_id,
           target_year_id, t.code, t.name, t.sequence, t.starts_on, t.ends_on,
           CASE WHEN t.sequence = 1 THEN 'active' ELSE 'planned' END,
           NULL, NULL
      FROM public.terms t
     WHERE t.academic_year_id = central_year_id
       AND t.deleted_at IS NULL
     ON CONFLICT (academic_year_id, code) DO NOTHING;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.terms t
     WHERE t.academic_year_id = target_year_id
       AND t.deleted_at IS NULL
  ) THEN
    INSERT INTO public.terms (
      id, tenant_id, school_id, branch_id, academic_year_id, code, name,
      sequence, starts_on, ends_on, status, created_by, updated_by
    ) VALUES (
      gen_random_uuid(), p_tenant_id, p_school_id, p_branch_id, target_year_id,
      'TERM-1', 'الفصل الدراسي الأول', 1, central_starts_on,
      LEAST(central_ends_on, make_date(EXTRACT(YEAR FROM central_starts_on)::integer, 12, 31)),
      'active', NULL, NULL
    );
  END IF;

  UPDATE public.terms
     SET status = CASE WHEN sequence = 1 THEN 'active' ELSE 'planned' END,
         branch_id = COALESCE(branch_id, p_branch_id),
         updated_at = now(),
         version = version + 1
   WHERE academic_year_id = target_year_id
     AND deleted_at IS NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.provision_customer_academic_foundation_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.school_code <> 'CENTRAL-SCHOOL'
     AND NEW.status = 'active'
     AND NEW.deleted_at IS NULL
     AND COALESCE(NEW.central_metadata->>'portal_profile', '') = 'customer_production' THEN
    PERFORM public.provision_customer_academic_foundation(NEW.id, NEW.tenant_id, NULL);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.bind_customer_academic_branch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.academic_years
     SET branch_id = NEW.id, updated_at = now(), version = version + 1
   WHERE school_id = NEW.school_id
     AND branch_id IS NULL
     AND deleted_at IS NULL
     AND is_current = true;
  UPDATE public.terms
     SET branch_id = NEW.id, updated_at = now(), version = version + 1
   WHERE school_id = NEW.school_id
     AND branch_id IS NULL
     AND deleted_at IS NULL;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_provision_customer_academic_foundation ON public.schools;
CREATE TRIGGER trg_provision_customer_academic_foundation
AFTER INSERT ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.provision_customer_academic_foundation_trigger();

DROP TRIGGER IF EXISTS trg_bind_customer_academic_branch ON public.branches;
CREATE TRIGGER trg_bind_customer_academic_branch
AFTER INSERT ON public.branches
FOR EACH ROW EXECUTE FUNCTION public.bind_customer_academic_branch();

-- Backfill existing customer schools without touching operational records.
DO $backfill$
DECLARE
  school_row record;
BEGIN
  FOR school_row IN
    SELECT s.id, s.tenant_id
      FROM public.schools s
     WHERE s.status = 'active'
       AND s.deleted_at IS NULL
       AND s.school_code <> 'CENTRAL-SCHOOL'
       AND COALESCE(s.central_metadata->>'portal_profile', '') = 'customer_production'
  LOOP
    PERFORM public.provision_customer_academic_foundation(school_row.id, school_row.tenant_id, NULL);
  END LOOP;
END;
$backfill$;

COMMIT;
