-- Permit usernames in any language and shape, including spaces and symbols.
-- Authentication still requires a matching active account and password.
BEGIN;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS ck_users_username_format;

NOTIFY pgrst, 'reload schema';
COMMIT;
