-- Canonical school logistics persistence.
-- Scope: buses, uniforms, student transportation and student uniform accounts.
-- No seed data is included. UAT data is created only by the guarded UAT runner.

BEGIN;

CREATE TABLE IF NOT EXISTS public.buses (
  id text NOT NULL,
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid,
  route_number text NOT NULL,
  driver_name text NOT NULL DEFAULT '',
  capacity integer NOT NULL DEFAULT 30,
  current_students integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT pk_buses PRIMARY KEY (id),
  CONSTRAINT fk_buses_school_scope FOREIGN KEY (tenant_id, school_id)
    REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_buses_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
    REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_buses_capacity CHECK (capacity > 0),
  CONSTRAINT ck_buses_current_students CHECK (current_students >= 0 AND current_students <= capacity),
  CONSTRAINT ck_buses_status CHECK (status IN ('active', 'inactive', 'maintenance', 'archived'))
);

CREATE TABLE IF NOT EXISTS public.uniforms (
  id text NOT NULL,
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid,
  code text,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT pk_uniforms PRIMARY KEY (id),
  CONSTRAINT fk_uniforms_school_scope FOREIGN KEY (tenant_id, school_id)
    REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_uniforms_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
    REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_uniforms_status CHECK (status IN ('active', 'inactive', 'archived'))
);

CREATE TABLE IF NOT EXISTS public.student_transportation (
  id text NOT NULL,
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid,
  student_id uuid NOT NULL,
  route_number text NOT NULL,
  pickup_point text,
  drop_off_point text,
  status text NOT NULL DEFAULT 'active',
  monthly_fees numeric(14,2) NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT pk_student_transportation PRIMARY KEY (id),
  CONSTRAINT fk_student_transportation_school_scope FOREIGN KEY (tenant_id, school_id)
    REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_transportation_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
    REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_transportation_student_scope FOREIGN KEY (tenant_id, school_id, student_id)
    REFERENCES public.students (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT uq_student_transportation_student UNIQUE (school_id, student_id),
  CONSTRAINT ck_student_transportation_status CHECK (status IN ('active', 'inactive', 'archived')),
  CONSTRAINT ck_student_transportation_monthly_fees CHECK (monthly_fees >= 0)
);

CREATE TABLE IF NOT EXISTS public.student_uniform_accounts (
  id text NOT NULL,
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid,
  student_id uuid NOT NULL,
  uniform_size text,
  pieces_received_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  payment_status text NOT NULL DEFAULT 'unpaid',
  total_fees numeric(14,2) NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT pk_student_uniform_accounts PRIMARY KEY (id),
  CONSTRAINT fk_student_uniform_accounts_school_scope FOREIGN KEY (tenant_id, school_id)
    REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_uniform_accounts_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
    REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_student_uniform_accounts_student_scope FOREIGN KEY (tenant_id, school_id, student_id)
    REFERENCES public.students (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT uq_student_uniform_accounts_student UNIQUE (school_id, student_id),
  CONSTRAINT ck_student_uniform_accounts_status CHECK (status IN ('active', 'inactive', 'archived')),
  CONSTRAINT ck_student_uniform_accounts_payment_status CHECK (payment_status IN ('paid', 'unpaid', 'partial', 'waived')),
  CONSTRAINT ck_student_uniform_accounts_fees CHECK (total_fees >= 0)
);

CREATE OR REPLACE FUNCTION public.set_school_logistics_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT s.tenant_id INTO NEW.tenant_id
    FROM public.schools s
   WHERE s.id = NEW.school_id
     AND s.deleted_at IS NULL;
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'SCHOOL_SCOPE_NOT_FOUND';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_buses_scope ON public.buses;
CREATE TRIGGER trg_buses_scope BEFORE INSERT OR UPDATE ON public.buses
FOR EACH ROW EXECUTE FUNCTION public.set_school_logistics_tenant();
DROP TRIGGER IF EXISTS trg_uniforms_scope ON public.uniforms;
CREATE TRIGGER trg_uniforms_scope BEFORE INSERT OR UPDATE ON public.uniforms
FOR EACH ROW EXECUTE FUNCTION public.set_school_logistics_tenant();
DROP TRIGGER IF EXISTS trg_student_transportation_scope ON public.student_transportation;
CREATE TRIGGER trg_student_transportation_scope BEFORE INSERT OR UPDATE ON public.student_transportation
FOR EACH ROW EXECUTE FUNCTION public.set_school_logistics_tenant();
DROP TRIGGER IF EXISTS trg_student_uniform_accounts_scope ON public.student_uniform_accounts;
CREATE TRIGGER trg_student_uniform_accounts_scope BEFORE INSERT OR UPDATE ON public.student_uniform_accounts
FOR EACH ROW EXECUTE FUNCTION public.set_school_logistics_tenant();

CREATE INDEX IF NOT EXISTS idx_buses_school_status ON public.buses (school_id, status);
CREATE INDEX IF NOT EXISTS idx_uniforms_school_status ON public.uniforms (school_id, status);
CREATE INDEX IF NOT EXISTS idx_student_transportation_school_status ON public.student_transportation (school_id, status);
CREATE INDEX IF NOT EXISTS idx_student_uniform_accounts_school_status ON public.student_uniform_accounts (school_id, status);

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['buses', 'uniforms', 'student_transportation', 'student_uniform_accounts'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_name);

    EXECUTE format('DROP POLICY IF EXISTS p_%s_select_scope ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY p_%s_select_scope ON public.%I FOR SELECT TO authenticated USING (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true))', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS p_%s_insert_scope ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY p_%s_insert_scope ON public.%I FOR INSERT TO authenticated WITH CHECK (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true))', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS p_%s_update_scope ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY p_%s_update_scope ON public.%I FOR UPDATE TO authenticated USING (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true)) WITH CHECK (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true))', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS p_%s_delete_scope ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY p_%s_delete_scope ON public.%I FOR DELETE TO authenticated USING (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true))', table_name, table_name);
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
COMMIT;
