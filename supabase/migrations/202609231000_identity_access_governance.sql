-- Canonical access governance records. No seed users, roles, or grants are
-- created here; every row is created by an authenticated workflow.
BEGIN;

CREATE TABLE IF NOT EXISTS public.identity_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  branch_id uuid REFERENCES public.branches(id),
  user_id uuid NOT NULL REFERENCES public.users(id),
  requested_by uuid NOT NULL REFERENCES public.users(id),
  permission_keys text[] NOT NULL CHECK (cardinality(permission_keys) > 0),
  reason text NOT NULL CHECK (length(btrim(reason)) >= 10),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  approved_by uuid REFERENCES public.users(id),
  approved_at timestamptz,
  rejected_by uuid REFERENCES public.users(id),
  rejected_at timestamptz,
  decision_reason text,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by uuid REFERENCES public.users(id),
  updated_by uuid REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.identity_access_request_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.identity_access_requests(id) ON DELETE CASCADE,
  sequence_no integer NOT NULL CHECK (sequence_no > 0),
  approver_id uuid NOT NULL REFERENCES public.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_reason text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, sequence_no),
  UNIQUE (request_id, approver_id)
);

CREATE INDEX IF NOT EXISTS idx_identity_access_requests_scope
  ON public.identity_access_requests (tenant_id, school_id, branch_id, status, ends_at)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_identity_access_requests_user
  ON public.identity_access_requests (tenant_id, user_id, status, ends_at)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_identity_access_request_approvals_approver
  ON public.identity_access_request_approvals (approver_id, status);

ALTER TABLE public.identity_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_access_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.identity_access_request_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_access_request_approvals FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.identity_access_requests, public.identity_access_request_approvals FROM anon;
GRANT SELECT ON TABLE public.identity_access_requests, public.identity_access_request_approvals TO authenticated;

DROP POLICY IF EXISTS p_identity_access_requests_select_scope ON public.identity_access_requests;
CREATE POLICY p_identity_access_requests_select_scope ON public.identity_access_requests
  FOR SELECT TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true)
    AND school_id::text = current_setting('app.school_id', true));

DROP POLICY IF EXISTS p_identity_access_request_approvals_select_scope ON public.identity_access_request_approvals;
CREATE POLICY p_identity_access_request_approvals_select_scope ON public.identity_access_request_approvals
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.identity_access_requests r
    WHERE r.id = request_id
      AND r.tenant_id::text = current_setting('app.tenant_id', true)
      AND r.school_id::text = current_setting('app.school_id', true)
  ));

COMMENT ON TABLE public.identity_access_requests IS 'Canonical, time-bound access requests with reason and approval lifecycle.';
COMMENT ON TABLE public.identity_access_request_approvals IS 'Ordered approval decisions for identity access requests.';

COMMIT;
