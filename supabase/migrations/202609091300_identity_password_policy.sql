-- Canonical server-owned password policy flag for the identity directory.
-- Auth metadata remains a compatibility mirror only; authorization and login
-- policy decisions must read this tenant identity record.

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS force_password_change boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_force_password_change
  ON public.users (tenant_id, status, force_password_change)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.users.force_password_change IS
  'Server-owned policy requiring a password change before the identity can continue.';

NOTIFY pgrst, 'reload schema';
COMMIT;
