-- Idempotent hardening for identity access governance.
-- Repairs older/manual deployments without deleting or seeding data.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.identity_access_requests') IS NULL OR to_regclass('public.identity_access_request_approvals') IS NULL THEN
    RAISE EXCEPTION 'Identity governance base migration must run first';
  END IF;
END $$;

ALTER TABLE public.identity_access_requests
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS decision_reason text;

ALTER TABLE public.identity_access_request_approvals
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS decision_reason text;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='identity_access_request_approvals' AND column_name='decision') THEN
    EXECUTE $migration$UPDATE public.identity_access_request_approvals SET status = COALESCE(status, decision, 'pending') WHERE status IS NULL$migration$;
  ELSE
    UPDATE public.identity_access_request_approvals SET status = COALESCE(status, 'pending') WHERE status IS NULL;
  END IF;
END $$;
ALTER TABLE public.identity_access_request_approvals ALTER COLUMN status SET DEFAULT 'pending', ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'identity_access_requests_tenant_fk') THEN
    ALTER TABLE public.identity_access_requests ADD CONSTRAINT identity_access_requests_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'identity_access_requests_school_fk') THEN
    ALTER TABLE public.identity_access_requests ADD CONSTRAINT identity_access_requests_school_fk FOREIGN KEY (school_id) REFERENCES public.schools(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'identity_access_requests_branch_fk') THEN
    ALTER TABLE public.identity_access_requests ADD CONSTRAINT identity_access_requests_branch_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'identity_access_requests_user_fk') THEN
    ALTER TABLE public.identity_access_requests ADD CONSTRAINT identity_access_requests_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'identity_access_requests_requested_by_fk') THEN
    ALTER TABLE public.identity_access_requests ADD CONSTRAINT identity_access_requests_requested_by_fk FOREIGN KEY (requested_by) REFERENCES public.users(id);
  END IF;
END $$;

ALTER TABLE public.identity_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_access_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.identity_access_request_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_access_request_approvals FORCE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS uq_identity_access_request_approver ON public.identity_access_request_approvals(request_id, approver_id);
CREATE INDEX IF NOT EXISTS idx_identity_access_requests_lifecycle ON public.identity_access_requests(tenant_id, school_id, status, starts_at, ends_at) WHERE deleted_at IS NULL;
COMMIT;
