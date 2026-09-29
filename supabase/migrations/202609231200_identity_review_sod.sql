-- Phase 2 governance foundation. Schema only; no seed or synthetic decisions.
BEGIN;

CREATE TABLE IF NOT EXISTS public.identity_access_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  branch_id uuid REFERENCES public.branches(id),
  user_id uuid NOT NULL REFERENCES public.users(id),
  reviewer_id uuid REFERENCES public.users(id),
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','revoked','waived')),
  reviewed_at timestamptz,
  decision_reason text,
  permission_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id),
  updated_by uuid REFERENCES public.users(id),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.identity_sod_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  rule_key text NOT NULL,
  permission_a text NOT NULL,
  permission_b text NOT NULL,
  severity text NOT NULL DEFAULT 'high' CHECK (severity IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, rule_key),
  CHECK (permission_a < permission_b)
);

CREATE INDEX IF NOT EXISTS idx_identity_reviews_due ON public.identity_access_reviews(tenant_id, school_id, status, due_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_identity_reviews_user ON public.identity_access_reviews(tenant_id, user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_identity_sod_rules_scope ON public.identity_sod_rules(tenant_id, status);

ALTER TABLE public.identity_access_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_access_reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE public.identity_sod_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_sod_rules FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.identity_access_reviews, public.identity_sod_rules FROM anon;
GRANT SELECT ON public.identity_access_reviews, public.identity_sod_rules TO authenticated;

DROP POLICY IF EXISTS identity_reviews_select_scope ON public.identity_access_reviews;
CREATE POLICY identity_reviews_select_scope ON public.identity_access_reviews FOR SELECT TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true));

DROP POLICY IF EXISTS identity_sod_rules_select_scope ON public.identity_sod_rules;
CREATE POLICY identity_sod_rules_select_scope ON public.identity_sod_rules FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR tenant_id::text = current_setting('app.tenant_id', true));

COMMIT;
