-- Close the owner-bypass gap discovered by the UAT-35 preflight.
BEGIN;
ALTER TABLE public.hr_database FORCE ROW LEVEL SECURITY;
COMMIT;
