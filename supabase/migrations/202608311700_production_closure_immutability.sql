-- Production closure hardening — remove write privileges inherited from the
-- restricted application's default table grants on immutable evidence tables.

BEGIN;

REVOKE UPDATE, DELETE, TRUNCATE
  ON public.student_document_storage_objects
  FROM authenticated, edupro_app;

REVOKE UPDATE, DELETE, TRUNCATE
  ON public.student_graduation_records
  FROM authenticated, edupro_app;

GRANT SELECT, INSERT
  ON public.student_document_storage_objects, public.student_graduation_records
  TO authenticated, edupro_app;

COMMIT;
