-- Identity login bridge for the canonical Supabase Auth user.
-- Adds nullable lookup fields only; no secrets, seed data, or RLS changes.
-- Email is stored as a normalized public.users reference because the trusted
-- login resolver intentionally queries public.users before password verification.

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS email text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'ck_users_username_format'
       AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT ck_users_username_format
      CHECK (
        username IS NULL
        OR (
          username = btrim(username)
          AND length(username) BETWEEN 3 AND 80
          AND username !~ '[[:space:]]'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'ck_users_email_format'
       AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT ck_users_email_format
      CHECK (
        email IS NULL
        OR (
          email = btrim(email)
          AND position('@' IN email) > 1
          AND position('.' IN split_part(email, '@', 2)) > 1
        )
      );
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_ci
  ON public.users (lower(username))
  WHERE username IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_ci
  ON public.users (lower(email))
  WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_username_lookup
  ON public.users (username)
  WHERE username IS NOT NULL AND deleted_at IS NULL;

COMMIT;
