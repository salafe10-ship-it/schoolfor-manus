-- Canonical posted journals must retain the complete source document.
-- This is schema-owned and must not be created from the request transaction.
ALTER TABLE public.erp_journal_entries
  ADD COLUMN IF NOT EXISTS source_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.erp_journal_entries.source_payload IS
  'Immutable source payload captured when the canonical journal is posted.';
