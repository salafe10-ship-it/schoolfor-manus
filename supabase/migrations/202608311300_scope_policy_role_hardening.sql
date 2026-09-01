-- DB-SEC-006 — do not expose scoped financial snapshot policies to anon/public.
-- The existing predicates fail closed without request context, but the policy
-- role is tightened as defense in depth and to keep the contract explicit.

BEGIN;

-- The canonical finance migration creates one FOR ALL policy named
-- p_financial_portal_snapshots_scope. Older deployed databases may contain
-- the split read/write policy names. Harden whichever version exists so a
-- fresh production rebuild and a legacy upgrade both remain safe.
DO $$
DECLARE
  policy_name text;
BEGIN
  FOREACH policy_name IN ARRAY ARRAY[
    'p_financial_portal_snapshots_scope',
    'p_financial_portal_snapshots_select',
    'p_financial_portal_snapshots_insert',
    'p_financial_portal_snapshots_update'
  ] LOOP
    IF EXISTS (
      SELECT 1
        FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'financial_portal_snapshots'
         AND policyname = policy_name
    ) THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.financial_portal_snapshots TO authenticated',
        policy_name
      );
    END IF;
  END LOOP;
END $$;

COMMIT;
