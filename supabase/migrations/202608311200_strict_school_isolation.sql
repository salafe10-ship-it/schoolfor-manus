-- DB-SEC-005 — strict tenant/school isolation for every scoped public table.
-- This migration is intentionally additive: it preserves existing policies,
-- enables RLS on scoped tables that were missed, and forces RLS for all
-- tenant/school-scoped tables. Missing scope always fails closed.

BEGIN;

DO $$
DECLARE
  t record;
  scope_sql text;
  policy_name text;
BEGIN
  FOR t IN
    SELECT c.relname AS table_name,
           c.relrowsecurity AS rls_enabled,
           c.relforcerowsecurity AS rls_forced,
           EXISTS (
             SELECT 1 FROM information_schema.columns col
              WHERE col.table_schema = 'public'
                AND col.table_name = c.relname
                AND col.column_name = 'tenant_id'
           ) AS has_tenant,
           EXISTS (
             SELECT 1 FROM information_schema.columns col
              WHERE col.table_schema = 'public'
                AND col.table_name = c.relname
                AND col.column_name = 'school_id'
           ) AS has_school,
           EXISTS (
             SELECT 1 FROM information_schema.columns col
              WHERE col.table_schema = 'public'
                AND col.table_name = c.relname
                AND col.column_name = 'branch_id'
           ) AS has_branch
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND EXISTS (
         SELECT 1 FROM information_schema.columns col
          WHERE col.table_schema = 'public'
            AND col.table_name = c.relname
            AND col.column_name = 'tenant_id'
       )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t.table_name);

    -- Super-admin is the only cross-tenant path. Normal users must match
    -- tenant, school when present, and branch when present.
    scope_sql := '(
      public.dbsec003_is_super_admin()
      OR (tenant_id = public.dbsec004_current_tenant_id()';
    IF t.has_school THEN
      scope_sql := scope_sql || ' AND school_id = public.dbsec004_current_school_id()';
    END IF;
    IF t.has_branch THEN
      scope_sql := scope_sql || ' AND (branch_id IS NULL OR branch_id = public.dbsec004_current_branch_id())';
    END IF;
    scope_sql := scope_sql || ')
    )';

    IF NOT t.rls_enabled THEN
      policy_name := format('p_dbsec005_%s_select', t.table_name);
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public' AND tablename = t.table_name AND policyname = policy_name
      ) THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING %s',
          policy_name, t.table_name, scope_sql
        );
      END IF;

      policy_name := format('p_dbsec005_%s_insert', t.table_name);
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public' AND tablename = t.table_name AND policyname = policy_name
      ) THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK %s',
          policy_name, t.table_name, scope_sql
        );
      END IF;

      policy_name := format('p_dbsec005_%s_update', t.table_name);
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public' AND tablename = t.table_name AND policyname = policy_name
      ) THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING %s WITH CHECK %s',
          policy_name, t.table_name, scope_sql, scope_sql
        );
      END IF;

      policy_name := format('p_dbsec005_%s_delete', t.table_name);
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public' AND tablename = t.table_name AND policyname = policy_name
      ) THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING %s',
          policy_name, t.table_name, scope_sql
        );
      END IF;
    END IF;
  END LOOP;
END
$$;

COMMIT;
