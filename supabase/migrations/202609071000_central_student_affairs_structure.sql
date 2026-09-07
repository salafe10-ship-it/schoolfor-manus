-- Student Affairs handoff baseline for the central template school.
-- Keeps the academic placement catalogue and private profile-photo category
-- reproducible when the template database is deployed again.

BEGIN;

WITH target AS (
  SELECT s.id AS school_id, s.tenant_id
    FROM public.schools s
   WHERE s.school_code = 'CENTRAL-SCHOOL'
     AND s.deleted_at IS NULL
   ORDER BY s.created_at ASC
   LIMIT 1
)
INSERT INTO public.school_settings (
  tenant_id, school_id, setting_key, setting_value, effective_from, status, version
)
SELECT
  target.tenant_id,
  target.school_id,
  'academic_structure',
  jsonb_build_object(
    'stages', jsonb_build_array(
      jsonb_build_object('id','stage_kg','code','ST-KG','name','مرحلة رياض الأطفال والتمهيدي','type','kindergarten','order',1,'isActive',true),
      jsonb_build_object('id','stage_primary','code','ST-PRI','name','المرحلة الابتدائية','type','primary','order',2,'isActive',true),
      jsonb_build_object('id','stage_middle','code','ST-MID','name','المرحلة المتوسطة','type','middle','order',3,'isActive',true),
      jsonb_build_object('id','stage_high','code','ST-HIGH','name','المرحلة الثانوية','type','secondary','order',4,'isActive',true)
    ),
    'grades', jsonb_build_array(
      jsonb_build_object('id','grade_kg1','stageId','stage_kg','code','KG1','name','روضة أولى (KG1)','order',1,'isActive',true),
      jsonb_build_object('id','grade_kg2','stageId','stage_kg','code','KG2','name','تمهيدي ثانٍ (KG2)','order',2,'isActive',true),
      jsonb_build_object('id','grade_pri1','stageId','stage_primary','code','PRI1','name','الصف الأول الابتدائي','order',1,'isActive',true),
      jsonb_build_object('id','grade_pri2','stageId','stage_primary','code','PRI2','name','الصف الثاني الابتدائي','order',2,'isActive',true),
      jsonb_build_object('id','grade_pri3','stageId','stage_primary','code','PRI3','name','الصف الثالث الابتدائي','order',3,'isActive',true),
      jsonb_build_object('id','grade_pri4','stageId','stage_primary','code','PRI4','name','الصف الرابع الابتدائي','order',4,'isActive',true),
      jsonb_build_object('id','grade_pri5','stageId','stage_primary','code','PRI5','name','الصف الخامس الابتدائي','order',5,'isActive',true),
      jsonb_build_object('id','grade_pri6','stageId','stage_primary','code','PRI6','name','الصف السادس الابتدائي','order',6,'isActive',true),
      jsonb_build_object('id','grade_mid1','stageId','stage_middle','code','MID1','name','الصف الأول المتوسط','order',1,'isActive',true),
      jsonb_build_object('id','grade_mid2','stageId','stage_middle','code','MID2','name','الصف الثاني المتوسط','order',2,'isActive',true),
      jsonb_build_object('id','grade_mid3','stageId','stage_middle','code','MID3','name','الصف الثالث المتوسط','order',3,'isActive',true),
      jsonb_build_object('id','grade_high1','stageId','stage_high','code','HIGH1','name','الصف الأول الثانوي','order',1,'isActive',true),
      jsonb_build_object('id','grade_high2','stageId','stage_high','code','HIGH2','name','الصف الثاني الثانوي','order',2,'isActive',true),
      jsonb_build_object('id','grade_high3','stageId','stage_high','code','HIGH3','name','الصف الثالث الثانوي','order',3,'isActive',true)
    ),
    'classes', jsonb_build_array(
      jsonb_build_object('id','cls_kg1_a','gradeId','grade_kg1','code','KG1-A','name','بستان أ','capacity',20,'isActive',true),
      jsonb_build_object('id','cls_kg1_b','gradeId','grade_kg1','code','KG1-B','name','بستان ب','capacity',20,'isActive',true),
      jsonb_build_object('id','cls_kg2_a','gradeId','grade_kg2','code','KG2-A','name','تمهيدي أ','capacity',20,'isActive',true),
      jsonb_build_object('id','cls_pri1_a','gradeId','grade_pri1','code','PRI1-A','name','أولى ابتدائي أ','capacity',25,'isActive',true),
      jsonb_build_object('id','cls_pri1_b','gradeId','grade_pri1','code','PRI1-B','name','أولى ابتدائي ب','capacity',25,'isActive',true),
      jsonb_build_object('id','cls_pri2_a','gradeId','grade_pri2','code','PRI2-A','name','ثانية ابتدائي أ','capacity',25,'isActive',true),
      jsonb_build_object('id','cls_pri6_a','gradeId','grade_pri6','code','PRI6-A','name','سادسة ابتدائي أ','capacity',30,'isActive',true),
      jsonb_build_object('id','cls_mid1_a','gradeId','grade_mid1','code','MID1-A','name','أولى متوسط أ','capacity',30,'isActive',true),
      jsonb_build_object('id','cls_mid3_a','gradeId','grade_mid3','code','MID3-A','name','ثالثة متوسط أ','capacity',30,'isActive',true),
      jsonb_build_object('id','cls_high1_a','gradeId','grade_high1','code','HIGH1-A','name','أولى ثانوي علمي أ','capacity',35,'isActive',true),
      jsonb_build_object('id','cls_high3_a','gradeId','grade_high3','code','HIGH3-A','name','ثالثة ثانوي علمي أ','capacity',35,'isActive',true)
    ),
    'sections', jsonb_build_array('أ','ب','ج','د')
  ),
  now(),
  'active',
  1
FROM target;

WITH target AS (
  SELECT DISTINCT s.tenant_id
    FROM public.schools s
   WHERE s.school_code = 'CENTRAL-SCHOOL'
     AND s.deleted_at IS NULL
)
INSERT INTO public.student_document_categories (
  tenant_id, category_code, display_name, description, sort_order, status, version
)
SELECT target.tenant_id, 'STUDENT_PROFILE_PHOTO', 'الصورة الشخصية للطالب',
       'صورة شخصية خاصة تستخدم في ملف الطالب وبطاقاته.', 0, 'active', 1
FROM target
ON CONFLICT (tenant_id, category_code) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      description = EXCLUDED.description,
      status = 'active',
      deleted_at = NULL,
      deleted_by = NULL,
      version = public.student_document_categories.version + 1;

COMMIT;
