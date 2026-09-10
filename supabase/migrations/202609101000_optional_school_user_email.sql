-- Optional school-user email support.
-- A school user still needs a Supabase Auth identity. When no real email is
-- supplied, the application creates a private internal Auth address and
-- exposes the generated username as the login identifier. The public profile
-- keeps email NULL so the UI never presents a fabricated address as a real one.
BEGIN;

CREATE OR REPLACE FUNCTION public.dbsec004_resolve_login_username(p_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT lower(btrim(au.email))
    FROM public.users AS u
    JOIN auth.users AS au ON au.id = u.auth_user_id
    JOIN public.tenants AS t ON t.id = u.tenant_id
   WHERE lower(btrim(u.username)) = lower(btrim(p_username))
     AND au.email IS NOT NULL
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

GRANT EXECUTE ON FUNCTION public.dbsec004_resolve_login_username(text) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
