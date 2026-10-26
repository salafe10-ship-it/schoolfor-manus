-- Store human-facing invoice and journal serials separately from immutable IDs.
-- Allocation happens inside the same transaction as the financial document.
BEGIN;

ALTER TABLE public.student_fee_invoices
    ADD COLUMN IF NOT EXISTS invoice_number text;

ALTER TABLE public.erp_journal_entries
    ADD COLUMN IF NOT EXISTS journal_number text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_fee_invoice_official_number
    ON public.student_fee_invoices (school_id, invoice_number)
    WHERE invoice_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_erp_journal_official_number
    ON public.erp_journal_entries (school_id, journal_number)
    WHERE journal_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.erp_financial_document_sequences (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    document_kind text NOT NULL,
    fiscal_year integer NOT NULL,
    last_number bigint NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (school_id, document_kind, fiscal_year),
    CONSTRAINT fk_erp_financial_document_sequence_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_erp_financial_document_sequence_kind
        CHECK (document_kind IN ('invoice', 'journal')),
    CONSTRAINT ck_erp_financial_document_sequence_year
        CHECK (fiscal_year BETWEEN 2000 AND 9999),
    CONSTRAINT ck_erp_financial_document_sequence_last_number
        CHECK (last_number >= 0)
);

-- Continue from any official serials already present; do not invent numbers
-- for historical documents whose only reference is an internal database ID.
INSERT INTO public.erp_financial_document_sequences
    (tenant_id, school_id, document_kind, fiscal_year, last_number)
SELECT tenant_id, school_id, 'invoice', substring(invoice_number from 5 for 4)::integer,
       max(substring(invoice_number from 10)::bigint)
  FROM public.student_fee_invoices
 WHERE invoice_number ~ '^INV-[0-9]{4}-[0-9]{3,}$'
 GROUP BY tenant_id, school_id, substring(invoice_number from 5 for 4)::integer
ON CONFLICT (school_id, document_kind, fiscal_year) DO UPDATE
    SET last_number = GREATEST(public.erp_financial_document_sequences.last_number, EXCLUDED.last_number),
        updated_at = now();

INSERT INTO public.erp_financial_document_sequences
    (tenant_id, school_id, document_kind, fiscal_year, last_number)
SELECT tenant_id, school_id, 'journal', substring(journal_number from 4 for 4)::integer,
       max(substring(journal_number from 9)::bigint)
  FROM public.erp_journal_entries
 WHERE journal_number ~ '^JV-[0-9]{4}-[0-9]{3,}$'
 GROUP BY tenant_id, school_id, substring(journal_number from 4 for 4)::integer
ON CONFLICT (school_id, document_kind, fiscal_year) DO UPDATE
    SET last_number = GREATEST(public.erp_financial_document_sequences.last_number, EXCLUDED.last_number),
        updated_at = now();

-- Allow one narrowly scoped metadata-only update on a posted journal: assign
-- its missing human-facing serial while requiring every other stored field to
-- remain byte-for-byte equivalent as JSON. Posting content and status remain
-- protected by the existing immutable-journal trigger.
CREATE OR REPLACE FUNCTION public.prevent_erp_posted_journal_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Posted canonical journals are immutable; use approval or reversal workflow.';
    END IF;
    IF OLD.status IN ('posted', 'reversed') AND NEW.status <> 'reversed' THEN
        IF OLD.journal_number IS NULL
           AND NEW.journal_number IS NOT NULL
           AND (to_jsonb(NEW) - 'journal_number') = (to_jsonb(OLD) - 'journal_number') THEN
            RETURN NEW;
        END IF;
        RAISE EXCEPTION 'Posted canonical journals are immutable; use approval or reversal workflow.';
    END IF;
    RETURN NEW;
END;
$$;

-- Backfill deterministic official numbers by school, document date, creation
-- time, then ID. Existing financial values and posting rows are not rewritten.
WITH missing AS (
    SELECT invoice.id,
           invoice.school_id,
           EXTRACT(YEAR FROM COALESCE(invoice.invoice_date::date, invoice.created_at::date))::integer AS fiscal_year,
           COALESCE(sequence.last_number, 0)
             + ROW_NUMBER() OVER (
                 PARTITION BY invoice.school_id,
                   EXTRACT(YEAR FROM COALESCE(invoice.invoice_date::date, invoice.created_at::date))
                 ORDER BY invoice.invoice_date NULLS LAST, invoice.created_at, invoice.id
               ) AS assigned_number
      FROM public.student_fee_invoices invoice
      LEFT JOIN public.erp_financial_document_sequences sequence
        ON sequence.school_id = invoice.school_id
       AND sequence.document_kind = 'invoice'
       AND sequence.fiscal_year = EXTRACT(YEAR FROM COALESCE(invoice.invoice_date::date, invoice.created_at::date))::integer
     WHERE invoice.invoice_number IS NULL
)
UPDATE public.student_fee_invoices invoice
   SET invoice_number = 'INV-' || missing.fiscal_year::text || '-' || LPAD(missing.assigned_number::text, 6, '0')
  FROM missing
 WHERE invoice.id = missing.id
   AND invoice.school_id = missing.school_id
   AND invoice.invoice_number IS NULL;

WITH missing AS (
    SELECT journal.id,
           journal.school_id,
           EXTRACT(YEAR FROM journal.entry_date)::integer AS fiscal_year,
           COALESCE(sequence.last_number, 0)
             + ROW_NUMBER() OVER (
                 PARTITION BY journal.school_id, EXTRACT(YEAR FROM journal.entry_date)
                 ORDER BY journal.entry_date, journal.created_at, journal.id
               ) AS assigned_number
      FROM public.erp_journal_entries journal
      LEFT JOIN public.erp_financial_document_sequences sequence
        ON sequence.school_id = journal.school_id
       AND sequence.document_kind = 'journal'
       AND sequence.fiscal_year = EXTRACT(YEAR FROM journal.entry_date)::integer
     WHERE journal.journal_number IS NULL
)
UPDATE public.erp_journal_entries journal
   SET journal_number = 'JV-' || missing.fiscal_year::text || '-' || LPAD(missing.assigned_number::text, 6, '0')
  FROM missing
 WHERE journal.id = missing.id
   AND journal.school_id = missing.school_id
   AND journal.journal_number IS NULL;

-- Align transactional counters with the historical backfill before new writes.
INSERT INTO public.erp_financial_document_sequences
    (tenant_id, school_id, document_kind, fiscal_year, last_number)
SELECT tenant_id, school_id, 'invoice', substring(invoice_number from 5 for 4)::integer,
       max(substring(invoice_number from 10)::bigint)
  FROM public.student_fee_invoices
 WHERE invoice_number ~ '^INV-[0-9]{4}-[0-9]{3,}$'
 GROUP BY tenant_id, school_id, substring(invoice_number from 5 for 4)::integer
ON CONFLICT (school_id, document_kind, fiscal_year) DO UPDATE
    SET last_number = GREATEST(public.erp_financial_document_sequences.last_number, EXCLUDED.last_number),
        updated_at = now();

INSERT INTO public.erp_financial_document_sequences
    (tenant_id, school_id, document_kind, fiscal_year, last_number)
SELECT tenant_id, school_id, 'journal', substring(journal_number from 4 for 4)::integer,
       max(substring(journal_number from 9)::bigint)
  FROM public.erp_journal_entries
 WHERE journal_number ~ '^JV-[0-9]{4}-[0-9]{3,}$'
 GROUP BY tenant_id, school_id, substring(journal_number from 4 for 4)::integer
ON CONFLICT (school_id, document_kind, fiscal_year) DO UPDATE
    SET last_number = GREATEST(public.erp_financial_document_sequences.last_number, EXCLUDED.last_number),
        updated_at = now();

ALTER TABLE public.erp_financial_document_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS erp_financial_document_sequences_school_scope
    ON public.erp_financial_document_sequences;
CREATE POLICY erp_financial_document_sequences_school_scope
    ON public.erp_financial_document_sequences
    FOR ALL TO authenticated
    USING (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
    )
    WITH CHECK (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
    );

GRANT SELECT, INSERT, UPDATE ON public.erp_financial_document_sequences TO authenticated;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'edupro_app') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.erp_financial_document_sequences TO edupro_app';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'edupro_staging_app') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.erp_financial_document_sequences TO edupro_staging_app';
    END IF;
END $$;

COMMENT ON COLUMN public.student_fee_invoices.invoice_number IS
    'School-issued invoice serial, distinct from the internal invoice primary key.';
COMMENT ON COLUMN public.erp_journal_entries.journal_number IS
    'School-issued journal serial, distinct from the immutable canonical journal key.';
COMMENT ON TABLE public.erp_financial_document_sequences IS
    'Transactional per-school fiscal-year counters for official fee invoice and journal serials.';

COMMIT;
