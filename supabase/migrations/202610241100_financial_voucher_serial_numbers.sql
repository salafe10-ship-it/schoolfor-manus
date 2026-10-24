-- Keep public receipt/payment serials transactional and distinct from the
-- internal IDs used to connect source records to canonical journals.
BEGIN;

ALTER TABLE public.erp_financial_document_sequences
    DROP CONSTRAINT IF EXISTS ck_erp_financial_document_sequence_kind;
ALTER TABLE public.erp_financial_document_sequences
    ADD CONSTRAINT ck_erp_financial_document_sequence_kind
    CHECK (document_kind IN ('invoice', 'journal', 'payment'));

ALTER TABLE public.erp_journal_entries
    ADD COLUMN IF NOT EXISTS source_document_number text;

-- A one-time assignment of a source-document number is metadata only. Keep
-- every posted accounting field immutable, just as for journal_number.
CREATE OR REPLACE FUNCTION public.prevent_erp_posted_journal_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Posted canonical journals are immutable; use approval or reversal workflow.';
    END IF;
    IF OLD.status = 'reversed' OR (OLD.status = 'posted' AND NEW.status <> 'reversed') THEN
        IF NEW.status = OLD.status
           AND ((OLD.journal_number IS NULL AND NEW.journal_number IS NOT NULL)
            OR (OLD.source_document_number IS NULL AND NEW.source_document_number IS NOT NULL))
           AND (to_jsonb(NEW) - ARRAY['journal_number', 'source_document_number'])
               = (to_jsonb(OLD) - ARRAY['journal_number', 'source_document_number'])
           AND (OLD.journal_number IS NULL OR NEW.journal_number = OLD.journal_number)
           AND (OLD.source_document_number IS NULL OR NEW.source_document_number = OLD.source_document_number) THEN
            RETURN NEW;
        END IF;
        RAISE EXCEPTION 'Posted canonical journals are immutable; use approval or reversal workflow.';
    END IF;
    RETURN NEW;
END;
$$;

-- Preserve student receipt numbers already assigned by the receipt counter.
UPDATE public.erp_journal_entries journal
   SET source_document_number = receipt.receipt_voucher_id
  FROM public.student_fee_receipts receipt
 WHERE journal.school_id = receipt.school_id
   AND journal.source_type = 'student_receipt'
   AND journal.source_id = receipt.id
   AND journal.source_document_number IS NULL
   AND receipt.receipt_voucher_id IS NOT NULL;

UPDATE public.erp_journal_entries journal
   SET source_document_number = COALESCE(
       NULLIF(journal.source_payload->>'receiptVoucherId', ''),
       NULLIF(journal.source_payload->>'voucherNumber', ''),
       CASE WHEN journal.source_id ~ '^RCV-[0-9]{4}-[0-9]{3,}$' THEN journal.source_id END
   )
 WHERE journal.source_type = 'student_receipt'
   AND journal.source_document_number IS NULL
   AND (
       journal.source_payload->>'receiptVoucherId' ~ '^RCV-[0-9]{4}-[0-9]{3,}$'
       OR journal.source_payload->>'voucherNumber' ~ '^RCV-[0-9]{4}-[0-9]{3,}$'
       OR journal.source_id ~ '^RCV-[0-9]{4}-[0-9]{3,}$'
   );

-- Historical payment IDs were the visible PV serials. Keep those references
-- stable while new payments receive a number from the transactional counter.
UPDATE public.erp_journal_entries journal
   SET source_document_number = COALESCE(
       NULLIF(journal.source_payload->>'paymentVoucherNumber', ''),
       NULLIF(journal.source_payload->>'voucherNumber', ''),
       CASE WHEN journal.source_id ~ '^PV-[0-9]{4}-[0-9]{3,}$' THEN journal.source_id END
   )
 WHERE journal.source_type = 'payment_voucher'
   AND journal.source_document_number IS NULL
   AND (
       journal.source_payload->>'paymentVoucherNumber' ~ '^PV-[0-9]{4}-[0-9]{3,}$'
       OR journal.source_payload->>'voucherNumber' ~ '^PV-[0-9]{4}-[0-9]{3,}$'
       OR journal.source_id ~ '^PV-[0-9]{4}-[0-9]{3,}$'
   );

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM public.student_fee_receipts
         WHERE receipt_voucher_id IS NOT NULL
         GROUP BY school_id, receipt_voucher_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate official student receipt numbers exist; resolve them before applying voucher serial constraints.';
    END IF;
    IF EXISTS (
        SELECT 1
          FROM public.erp_journal_entries
         WHERE source_document_number IS NOT NULL
           AND source_type IN ('student_receipt', 'payment_voucher')
         GROUP BY school_id, source_type, source_document_number
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate official receipt/payment numbers exist in canonical journals; resolve them before applying voucher serial constraints.';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_fee_receipt_official_number
    ON public.student_fee_receipts (school_id, receipt_voucher_id)
    WHERE receipt_voucher_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_erp_journal_source_document_number
    ON public.erp_journal_entries (school_id, source_type, source_document_number)
    WHERE source_document_number IS NOT NULL
      AND source_type IN ('student_receipt', 'payment_voucher');

-- Bring the shared RCV allocator forward from all previously issued receipts.
INSERT INTO public.student_fee_receipt_sequences (tenant_id, school_id, next_number)
SELECT tenant_id, school_id, MAX(split_part(receipt_voucher_id, '-', 3)::bigint) + 1
  FROM public.student_fee_receipts
 WHERE receipt_voucher_id ~ '^RCV-[0-9]{4}-[0-9]{8}$'
 GROUP BY tenant_id, school_id
ON CONFLICT (school_id) DO UPDATE
    SET next_number = GREATEST(public.student_fee_receipt_sequences.next_number, EXCLUDED.next_number),
        updated_at = now();

-- Resume PV counters from numbers already committed to canonical journals.
INSERT INTO public.erp_financial_document_sequences
    (tenant_id, school_id, document_kind, fiscal_year, last_number)
SELECT tenant_id, school_id, 'payment', substring(source_document_number from 4 for 4)::integer,
       MAX(substring(source_document_number from 9)::bigint)
  FROM public.erp_journal_entries
 WHERE source_type = 'payment_voucher'
   AND source_document_number ~ '^PV-[0-9]{4}-[0-9]{3,}$'
 GROUP BY tenant_id, school_id, substring(source_document_number from 4 for 4)::integer
ON CONFLICT (school_id, document_kind, fiscal_year) DO UPDATE
    SET last_number = GREATEST(public.erp_financial_document_sequences.last_number, EXCLUDED.last_number),
        updated_at = now();

COMMENT ON COLUMN public.erp_journal_entries.source_document_number IS
    'Official human-facing receipt/payment source number; distinct from both journal_number and the internal source ID.';
COMMENT ON TABLE public.erp_financial_document_sequences IS
    'Transactional per-school fiscal-year counters for official invoice, journal, and payment serials.';

COMMIT;
