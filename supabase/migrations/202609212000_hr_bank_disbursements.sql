-- Canonical bank disbursement register for HR payments.
-- Journal entries remain the accounting source of truth; this register is the
-- operational matching surface used by bank reconciliation.
BEGIN;
CREATE TABLE IF NOT EXISTS public.hr_bank_disbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('advance','payroll','settlement')),
  source_id text NOT NULL,
  employee_id text,
  period text,
  cost_center text,
  bank_account text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  journal_id uuid NOT NULL,
  external_reference text,
  reconciliation_status text NOT NULL DEFAULT 'unreconciled' CHECK (reconciliation_status IN ('unreconciled','matched','discrepancy')),
  matched_at timestamptz,
  matched_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, source_type, source_id)
);
CREATE INDEX IF NOT EXISTS idx_hr_bank_disbursements_scope
  ON public.hr_bank_disbursements(tenant_id, school_id, reconciliation_status, payment_date DESC);
ALTER TABLE public.hr_bank_disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_bank_disbursements FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_bank_disbursements FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hr_bank_disbursements TO authenticated;
DROP POLICY IF EXISTS hr_bank_disbursements_scope ON public.hr_bank_disbursements;
CREATE POLICY hr_bank_disbursements_scope ON public.hr_bank_disbursements
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true));
NOTIFY pgrst, 'reload schema';
COMMIT;
