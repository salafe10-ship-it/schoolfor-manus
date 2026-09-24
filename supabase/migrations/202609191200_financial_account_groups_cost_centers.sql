-- Canonical financial dimensions for account groups, cost centers, and stages.
-- This migration creates reference data structures only; it does not seed
-- fictitious balances or transactions.

BEGIN;

CREATE TABLE IF NOT EXISTS public.erp_account_groups (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    group_code text NOT NULL,
    group_name text NOT NULL,
    account_nature text NOT NULL,
    parent_group_code text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    PRIMARY KEY (school_id, group_code),
    FOREIGN KEY (tenant_id, school_id) REFERENCES public.schools (tenant_id, id),
    FOREIGN KEY (updated_by) REFERENCES public.users (id),
    CONSTRAINT ck_erp_account_group_nature CHECK (account_nature IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    CONSTRAINT ck_erp_account_group_name CHECK (length(btrim(group_name)) > 0)
);

CREATE TABLE IF NOT EXISTS public.erp_cost_centers (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    cost_center_code text NOT NULL,
    cost_center_name text NOT NULL,
    academic_stage_code text,
    parent_cost_center_code text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    PRIMARY KEY (school_id, cost_center_code),
    FOREIGN KEY (tenant_id, school_id) REFERENCES public.schools (tenant_id, id),
    FOREIGN KEY (updated_by) REFERENCES public.users (id),
    CONSTRAINT ck_erp_cost_center_name CHECK (length(btrim(cost_center_name)) > 0)
);

ALTER TABLE public.erp_chart_of_accounts
    ADD COLUMN IF NOT EXISTS group_code text,
    ADD COLUMN IF NOT EXISTS parent_account_code text,
    ADD COLUMN IF NOT EXISTS cost_center_required boolean NOT NULL DEFAULT false;

ALTER TABLE public.erp_journal_lines
    ADD COLUMN IF NOT EXISTS cost_center_code text,
    ADD COLUMN IF NOT EXISTS academic_stage_code text;

CREATE INDEX IF NOT EXISTS idx_erp_account_groups_school_nature
    ON public.erp_account_groups (school_id, account_nature, is_active);
CREATE INDEX IF NOT EXISTS idx_erp_cost_centers_school_stage
    ON public.erp_cost_centers (school_id, academic_stage_code, is_active);
CREATE INDEX IF NOT EXISTS idx_erp_journal_lines_cost_center
    ON public.erp_journal_lines (school_id, cost_center_code, academic_stage_code);

ALTER TABLE public.erp_account_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_account_groups FORCE ROW LEVEL SECURITY;
ALTER TABLE public.erp_cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_cost_centers FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE public.erp_account_groups IS
    'School-owned account grouping reference; no synthetic balances are stored here.';
COMMENT ON TABLE public.erp_cost_centers IS
    'School-owned cost-center and academic-stage reference used by financial postings.';

COMMIT;
