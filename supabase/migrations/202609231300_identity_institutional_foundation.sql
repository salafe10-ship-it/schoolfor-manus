-- Phase 3 institutional identity foundation. No synthetic sessions or keys.
BEGIN;
CREATE TABLE IF NOT EXISTS public.identity_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id), user_id uuid NOT NULL REFERENCES public.users(id),
  school_id uuid REFERENCES public.schools(id), branch_id uuid REFERENCES public.branches(id), auth_session_id uuid NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz, expires_at timestamptz NOT NULL, revoked_at timestamptz,
  client_platform text, ip_address inet, user_agent text, status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked','archived')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK (issued_at < expires_at), CHECK (branch_id IS NULL OR school_id IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS public.identity_service_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id), school_id uuid REFERENCES public.schools(id), branch_id uuid REFERENCES public.branches(id),
  account_key text NOT NULL, name text NOT NULL, description text, status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','expired','revoked','archived')),
  expires_at timestamptz, last_used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (tenant_id, account_key), CHECK (length(btrim(account_key)) > 0), CHECK (length(btrim(name)) > 0), CHECK (branch_id IS NULL OR school_id IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS public.identity_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id), service_account_id uuid NOT NULL REFERENCES public.identity_service_accounts(id), school_id uuid REFERENCES public.schools(id), branch_id uuid REFERENCES public.branches(id),
  key_prefix text NOT NULL, key_hash text NOT NULL UNIQUE, scopes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(scopes) = 'array'), issued_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz, last_used_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked','archived')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (service_account_id, key_prefix), CHECK (length(btrim(key_prefix)) >= 4), CHECK (expires_at IS NULL OR issued_at < expires_at), CHECK (branch_id IS NULL OR school_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_identity_sessions_scope ON public.identity_sessions(tenant_id, user_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_identity_service_accounts_scope ON public.identity_service_accounts(tenant_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_identity_api_keys_scope ON public.identity_api_keys(tenant_id, service_account_id, status, expires_at);
ALTER TABLE public.identity_sessions ENABLE ROW LEVEL SECURITY; ALTER TABLE public.identity_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.identity_service_accounts ENABLE ROW LEVEL SECURITY; ALTER TABLE public.identity_service_accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.identity_api_keys ENABLE ROW LEVEL SECURITY; ALTER TABLE public.identity_api_keys FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.identity_sessions, public.identity_service_accounts, public.identity_api_keys FROM anon;
GRANT SELECT ON public.identity_sessions, public.identity_service_accounts, public.identity_api_keys TO authenticated;
DROP POLICY IF EXISTS identity_sessions_select_scope ON public.identity_sessions;
CREATE POLICY identity_sessions_select_scope ON public.identity_sessions FOR SELECT TO authenticated USING (tenant_id::text = current_setting('app.tenant_id', true) AND (school_id IS NULL OR school_id::text = current_setting('app.school_id', true)));
DROP POLICY IF EXISTS identity_service_accounts_select_scope ON public.identity_service_accounts;
CREATE POLICY identity_service_accounts_select_scope ON public.identity_service_accounts FOR SELECT TO authenticated USING (tenant_id::text = current_setting('app.tenant_id', true) AND (school_id IS NULL OR school_id::text = current_setting('app.school_id', true)));
DROP POLICY IF EXISTS identity_api_keys_select_scope ON public.identity_api_keys;
CREATE POLICY identity_api_keys_select_scope ON public.identity_api_keys FOR SELECT TO authenticated USING (tenant_id::text = current_setting('app.tenant_id', true) AND (school_id IS NULL OR school_id::text = current_setting('app.school_id', true)));
COMMIT;
