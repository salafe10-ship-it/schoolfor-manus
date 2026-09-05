-- Canonical fixed-asset register and append-only lifecycle events.
-- Financial impact is posted by the server through the canonical ERP ledger.
BEGIN;

CREATE TABLE IF NOT EXISTS public.fixed_assets (
  id text NOT NULL,
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid,
  code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  cost numeric(14,2) NOT NULL DEFAULT 0,
  accumulated_depreciation numeric(14,2) NOT NULL DEFAULT 0,
  net_book_value numeric(14,2) NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  updated_by uuid NOT NULL,
  PRIMARY KEY (school_id, id),
  CONSTRAINT fk_fixed_assets_school FOREIGN KEY (tenant_id, school_id) REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_fixed_assets_branch FOREIGN KEY (tenant_id, school_id, branch_id) REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_fixed_assets_creator FOREIGN KEY (created_by) REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_fixed_assets_updater FOREIGN KEY (updated_by) REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_fixed_assets_status CHECK (status IN ('active', 'maintenance', 'loaned', 'disposed', 'sold')),
  CONSTRAINT ck_fixed_assets_amounts CHECK (cost >= 0 AND accumulated_depreciation >= 0 AND net_book_value >= 0 AND accumulated_depreciation <= cost AND (status IN ('disposed', 'sold') OR net_book_value = round(cost - accumulated_depreciation, 2))),
  CONSTRAINT ck_fixed_assets_data_object CHECK (jsonb_typeof(data) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_fixed_assets_school_code ON public.fixed_assets (school_id, code);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_school_status ON public.fixed_assets (tenant_id, school_id, status);

CREATE TABLE IF NOT EXISTS public.fixed_asset_events (
  id text NOT NULL,
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid,
  asset_id text NOT NULL,
  event_type text NOT NULL,
  event_date date NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  journal_entry_id text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  PRIMARY KEY (school_id, id),
  CONSTRAINT fk_fixed_asset_events_asset FOREIGN KEY (school_id, asset_id) REFERENCES public.fixed_assets (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_fixed_asset_events_school FOREIGN KEY (tenant_id, school_id) REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_fixed_asset_events_branch FOREIGN KEY (tenant_id, school_id, branch_id) REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_fixed_asset_events_creator FOREIGN KEY (created_by) REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_fixed_asset_events_type CHECK (event_type IN ('acquisition', 'maintenance', 'transfer', 'depreciation', 'sale', 'discard')),
  CONSTRAINT ck_fixed_asset_events_amount CHECK (amount >= 0),
  CONSTRAINT ck_fixed_asset_events_data_object CHECK (jsonb_typeof(data) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_fixed_asset_events_asset_date ON public.fixed_asset_events (school_id, asset_id, event_date DESC);

DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['fixed_assets', 'fixed_asset_events'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_name);
    EXECUTE format('DROP POLICY IF EXISTS p_%s_scope ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY p_%s_scope ON public.%I FOR ALL TO authenticated USING (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true)) WITH CHECK (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true))', table_name, table_name);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.prevent_fixed_asset_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Fixed asset lifecycle events are append-only; use a reversal event.'; END;
$$;
DROP TRIGGER IF EXISTS trg_fixed_asset_events_immutable ON public.fixed_asset_events;
CREATE TRIGGER trg_fixed_asset_events_immutable BEFORE UPDATE OR DELETE ON public.fixed_asset_events FOR EACH ROW EXECUTE FUNCTION public.prevent_fixed_asset_event_mutation();

NOTIFY pgrst, 'reload schema';
COMMIT;
