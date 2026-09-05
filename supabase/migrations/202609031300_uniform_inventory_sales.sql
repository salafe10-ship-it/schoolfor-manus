-- Canonical uniform variants, stock ledger and student sales.
BEGIN;

-- The legacy uniform catalogue is keyed by its own identifier.  The
-- canonical inventory records are school-scoped, so expose the same scope as
-- a unique referenced key before adding their composite foreign keys.
CREATE UNIQUE INDEX IF NOT EXISTS uq_uniforms_school_id
  ON public.uniforms (school_id, id);

CREATE TABLE IF NOT EXISTS public.uniform_item_variants (
  id text NOT NULL,
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid,
  item_id text NOT NULL,
  size_code text NOT NULL DEFAULT '',
  color_code text NOT NULL DEFAULT '',
  sku text NOT NULL,
  stock_qty integer NOT NULL DEFAULT 0,
  buy_price numeric(14,2) NOT NULL DEFAULT 0,
  sell_price numeric(14,2) NOT NULL DEFAULT 0,
  alert_limit integer NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  updated_by uuid NOT NULL,
  PRIMARY KEY (school_id, id),
  CONSTRAINT fk_uniform_variants_item FOREIGN KEY (school_id, item_id) REFERENCES public.uniforms (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_uniform_variants_school FOREIGN KEY (tenant_id, school_id) REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_uniform_variants_branch FOREIGN KEY (tenant_id, school_id, branch_id) REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_uniform_variants_creator FOREIGN KEY (created_by) REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_uniform_variants_updater FOREIGN KEY (updated_by) REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_uniform_variants_stock CHECK (stock_qty >= 0),
  CONSTRAINT ck_uniform_variants_prices CHECK (buy_price >= 0 AND sell_price >= buy_price),
  CONSTRAINT ck_uniform_variants_data CHECK (jsonb_typeof(data) = 'object')
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_uniform_variants_sku ON public.uniform_item_variants (school_id, sku);
CREATE INDEX IF NOT EXISTS idx_uniform_variants_item ON public.uniform_item_variants (school_id, item_id);

CREATE TABLE IF NOT EXISTS public.uniform_sales (
  id text NOT NULL,
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid,
  student_id uuid NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  subtotal numeric(14,2) NOT NULL,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  tax numeric(14,2) NOT NULL DEFAULT 0,
  grand_total numeric(14,2) NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'posted',
  journal_entry_id text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  PRIMARY KEY (school_id, id),
  CONSTRAINT fk_uniform_sales_school FOREIGN KEY (tenant_id, school_id) REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_uniform_sales_branch FOREIGN KEY (tenant_id, school_id, branch_id) REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_uniform_sales_student FOREIGN KEY (tenant_id, school_id, student_id) REFERENCES public.students (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_uniform_sales_creator FOREIGN KEY (created_by) REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_uniform_sales_payment CHECK (payment_method IN ('Cash', 'Card', 'BankTransfer', 'StudentAccount')),
  CONSTRAINT ck_uniform_sales_status CHECK (status IN ('posted', 'cancelled')),
  CONSTRAINT ck_uniform_sales_amounts CHECK (subtotal >= 0 AND discount >= 0 AND tax >= 0 AND grand_total >= 0)
);

CREATE TABLE IF NOT EXISTS public.uniform_sale_lines (
  id text NOT NULL,
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  sale_id text NOT NULL,
  variant_id text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(14,2) NOT NULL,
  unit_cost numeric(14,2) NOT NULL,
  line_total numeric(14,2) NOT NULL,
  PRIMARY KEY (school_id, id),
  CONSTRAINT fk_uniform_sale_lines_sale FOREIGN KEY (school_id, sale_id) REFERENCES public.uniform_sales (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_uniform_sale_lines_variant FOREIGN KEY (school_id, variant_id) REFERENCES public.uniform_item_variants (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_uniform_sale_lines_qty CHECK (quantity > 0),
  CONSTRAINT ck_uniform_sale_lines_amounts CHECK (unit_price >= 0 AND unit_cost >= 0 AND line_total = round(quantity * unit_price, 2))
);

CREATE TABLE IF NOT EXISTS public.uniform_stock_movements (
  id text NOT NULL,
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid,
  variant_id text NOT NULL,
  movement_type text NOT NULL,
  quantity_delta integer NOT NULL,
  unit_cost numeric(14,2) NOT NULL DEFAULT 0,
  reference_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (school_id, id),
  CONSTRAINT fk_uniform_stock_variant FOREIGN KEY (school_id, variant_id) REFERENCES public.uniform_item_variants (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_uniform_stock_school FOREIGN KEY (tenant_id, school_id) REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_uniform_stock_branch FOREIGN KEY (tenant_id, school_id, branch_id) REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_uniform_stock_creator FOREIGN KEY (created_by) REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_uniform_stock_type CHECK (movement_type IN ('purchase', 'sale', 'return', 'adjustment')),
  CONSTRAINT ck_uniform_stock_delta CHECK (quantity_delta <> 0)
);
CREATE INDEX IF NOT EXISTS idx_uniform_stock_variant_created ON public.uniform_stock_movements (school_id, variant_id, created_at DESC);

DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['uniform_item_variants', 'uniform_sales', 'uniform_sale_lines', 'uniform_stock_movements'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_name);
    EXECUTE format('DROP POLICY IF EXISTS p_%s_scope ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY p_%s_scope ON public.%I FOR ALL TO authenticated USING (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true)) WITH CHECK (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true))', table_name, table_name);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.prevent_uniform_stock_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Uniform stock movements are append-only; use a compensating movement.'; END;
$$;
DROP TRIGGER IF EXISTS trg_uniform_stock_immutable ON public.uniform_stock_movements;
CREATE TRIGGER trg_uniform_stock_immutable BEFORE UPDATE OR DELETE ON public.uniform_stock_movements FOR EACH ROW EXECUTE FUNCTION public.prevent_uniform_stock_mutation();

NOTIFY pgrst, 'reload schema';
COMMIT;
