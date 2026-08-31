-- DB-SEC-006 — do not expose scoped financial snapshot policies to anon/public.
-- The existing predicates fail closed without request context, but the policy
-- role is tightened as defense in depth and to keep the contract explicit.

BEGIN;

ALTER POLICY p_financial_portal_snapshots_select
  ON public.financial_portal_snapshots TO authenticated;
ALTER POLICY p_financial_portal_snapshots_insert
  ON public.financial_portal_snapshots TO authenticated;
ALTER POLICY p_financial_portal_snapshots_update
  ON public.financial_portal_snapshots TO authenticated;

COMMIT;
