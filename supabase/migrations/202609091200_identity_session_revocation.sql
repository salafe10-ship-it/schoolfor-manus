-- Central session revocation marker for identity lifecycle controls.
-- Existing JWTs remain cryptographically valid, so the trusted server checks
-- this timestamp against the verified token iat before every request.

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS session_revoked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_auth_session_revoked
  ON public.users (auth_user_id, session_revoked_at)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.users.session_revoked_at IS
  'Server-controlled cutoff for all access and refresh sessions issued before this timestamp.';

NOTIFY pgrst, 'reload schema';
COMMIT;
