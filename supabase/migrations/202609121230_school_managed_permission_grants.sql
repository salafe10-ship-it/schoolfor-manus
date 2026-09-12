-- Allow each school to manage its own per-user decisions without overwriting
-- central decisions. Central grants remain the published baseline; school
-- decisions (allow/deny) are strictly scoped to the authenticated school.
ALTER TABLE public.user_permission_grants
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'central';

ALTER TABLE public.user_permission_grants
  DROP CONSTRAINT IF EXISTS ck_user_permission_grants_source;

ALTER TABLE public.user_permission_grants
  ADD CONSTRAINT ck_user_permission_grants_source
  CHECK (source IN ('central', 'school'));

ALTER TABLE public.user_permission_grants
  DROP CONSTRAINT IF EXISTS uq_user_permission_grants_user_permission;

ALTER TABLE public.user_permission_grants
  DROP CONSTRAINT IF EXISTS uq_user_permission_grants_user_permission_source;

ALTER TABLE public.user_permission_grants
  ADD CONSTRAINT uq_user_permission_grants_user_permission_source
  UNIQUE (user_id, permission_id, source);

CREATE INDEX IF NOT EXISTS idx_user_permission_grants_source
  ON public.user_permission_grants (tenant_id, school_id, source, status);

COMMENT ON COLUMN public.user_permission_grants.source IS
  'central decisions are published by the control plane; school decisions are local allow/deny overrides.';

NOTIFY pgrst, 'reload schema';
