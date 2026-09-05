-- Remove the legacy username shape restriction.
-- Usernames remain account identifiers only; password verification and the
-- trusted identity/scope checks still gate every login.
BEGIN;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS ck_users_username_format;

-- Normalize only the comparison edges so identifiers with surrounding
-- whitespace still resolve consistently. The stored username itself is not
-- rewritten, allowing any Unicode text, punctuation, or internal whitespace.
CREATE OR REPLACE FUNCTION public.dbsec004_resolve_login_username(p_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT lower(btrim(u.email))
    FROM public.users AS u
    JOIN public.tenants AS t ON t.id = u.tenant_id
   WHERE lower(btrim(u.username)) = lower(btrim(p_username))
     AND u.email IS NOT NULL
     AND u.status = 'active'
     AND u.deleted_at IS NULL
     AND t.deleted_at IS NULL
     AND (
       t.status = 'active'
       OR EXISTS (
         SELECT 1
           FROM public.platform_users AS pu
          WHERE pu.auth_user_id = u.auth_user_id
            AND pu.status = 'active'
            AND pu.deleted_at IS NULL
       )
     )
   LIMIT 1;
$$;

NOTIFY pgrst, 'reload schema';
COMMIT;
