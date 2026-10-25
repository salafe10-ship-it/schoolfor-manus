-- STG-DBSEC-ACL-002 — remove table privileges that RLS cannot constrain.
-- Row policies continue to govern scoped CRUD; API roles never need to
-- truncate tables, create triggers, or define foreign-key references.

BEGIN;

REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public
  FROM PUBLIC, anon, authenticated, edupro_app, edupro_staging_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES
  FROM PUBLIC, anon, authenticated, edupro_app, edupro_staging_app;

NOTIFY pgrst, 'reload schema';

COMMIT;
