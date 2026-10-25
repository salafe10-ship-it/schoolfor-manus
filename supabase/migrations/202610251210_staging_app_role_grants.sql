-- STG-DBSEC-ROLE-GRANTS-001 — attach the existing restricted Staging login
-- to the canonical least-privilege role without changing the login itself.
-- The hosted role is externally provisioned and its attributes were verified;
-- this migration only grants the application role's RLS-constrained surface.

BEGIN;

DO $$
DECLARE
  staging_role record;
BEGIN
  SELECT rolsuper, rolbypassrls, rolinherit, rolcanlogin,
         rolcreaterole, rolcreatedb, rolreplication
    INTO staging_role
    FROM pg_roles WHERE rolname='edupro_staging_app';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EDUPRO_STAGING_APP_ROLE_MISSING';
  END IF;
  IF staging_role.rolsuper OR staging_role.rolbypassrls OR NOT staging_role.rolinherit
     OR NOT staging_role.rolcanlogin OR staging_role.rolcreaterole
     OR staging_role.rolcreatedb OR staging_role.rolreplication THEN
    RAISE EXCEPTION 'EDUPRO_STAGING_APP_ROLE_ATTRIBUTES_UNSAFE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='edupro_app') THEN
    RAISE EXCEPTION 'EDUPRO_CANONICAL_APP_ROLE_MISSING';
  END IF;
END
$$;

GRANT edupro_app TO edupro_staging_app;
GRANT USAGE ON SCHEMA public TO edupro_staging_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO edupro_staging_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO edupro_staging_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO edupro_staging_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO edupro_staging_app;

COMMIT;
