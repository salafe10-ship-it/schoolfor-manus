-- Durable HR settlement register for approved end-of-service calculations.
BEGIN;
CREATE TABLE IF NOT EXISTS public.hr_employee_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  employee_id text NOT NULL,
  cost_center text NOT NULL CHECK (cost_center IN ('kindergarten','primary','middle','secondary','admin')),
  termination_date date NOT NULL,
  reason text NOT NULL,
  service_days integer NOT NULL CHECK (service_days >= 0),
  base_salary numeric(14,2) NOT NULL CHECK (base_salary >= 0),
  end_of_service_amount numeric(14,2) NOT NULL CHECK (end_of_service_amount >= 0),
  leave_balance_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (leave_balance_amount >= 0),
  other_dues numeric(14,2) NOT NULL DEFAULT 0 CHECK (other_dues >= 0),
  advance_balance numeric(14,2) NOT NULL DEFAULT 0 CHECK (advance_balance >= 0),
  net_amount numeric(14,2) NOT NULL CHECK (net_amount >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','paid','cancelled')),
  journal_id uuid,
  approved_at timestamptz,
  paid_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, employee_id, termination_date)
);
CREATE INDEX IF NOT EXISTS idx_hr_employee_settlements_scope ON public.hr_employee_settlements(tenant_id, school_id, status, cost_center);
ALTER TABLE public.hr_employee_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_settlements FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_employee_settlements FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hr_employee_settlements TO authenticated;
DROP POLICY IF EXISTS hr_employee_settlements_scope ON public.hr_employee_settlements;
CREATE POLICY hr_employee_settlements_scope ON public.hr_employee_settlements FOR ALL TO authenticated USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true)) WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true));
NOTIFY pgrst, 'reload schema';
COMMIT;
