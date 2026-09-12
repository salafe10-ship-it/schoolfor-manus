-- Explicit per-user permission decisions.
-- Role permissions remain the baseline. A direct allow adds a narrow exception,
-- while a direct deny removes an inherited permission for one user only.
ALTER TABLE public.user_permission_grants
  ADD COLUMN IF NOT EXISTS effect text NOT NULL DEFAULT 'allow';

ALTER TABLE public.user_permission_grants
  DROP CONSTRAINT IF EXISTS ck_user_permission_grants_effect;

ALTER TABLE public.user_permission_grants
  ADD CONSTRAINT ck_user_permission_grants_effect
  CHECK (effect IN ('allow', 'deny'));

CREATE INDEX IF NOT EXISTS idx_user_permission_grants_effective
  ON public.user_permission_grants (tenant_id, user_id, effect, status)
  WHERE deleted_at IS NULL;

-- Browser clients may read only the active school scope. Platform administration
-- continues through the trusted server path, which is deliberately outside this policy.
ALTER TABLE public.user_permission_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_grants FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_permission_grants FROM anon;
GRANT SELECT ON TABLE public.user_permission_grants TO authenticated;

DROP POLICY IF EXISTS p_user_permission_grants_select_scope ON public.user_permission_grants;
CREATE POLICY p_user_permission_grants_select_scope ON public.user_permission_grants
  FOR SELECT TO authenticated
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true)
    AND (branch_id IS NULL OR branch_id::text = current_setting('app.branch_id', true))
  );

NOTIFY pgrst, 'reload schema';

COMMENT ON COLUMN public.user_permission_grants.effect IS
  'Explicit allow or deny applied after the employee role baseline; deny wins.';
