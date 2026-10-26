import 'dotenv/config';
import { Pool } from 'pg';
import { secureDatabaseOptions, verifyFinancialSerialSchema } from './financialDocumentSerialRelease.mjs';

const allowNonProductionDatabase = process.env.ALLOW_NON_PRODUCTION_DB === 'true';
const connectionString = process.env.PLATFORM_ADMIN_DATABASE_URL
  || (allowNonProductionDatabase ? (process.env.DIRECT_URL || process.env.DATABASE_URL) : '');

if (!connectionString) throw new Error('PLATFORM_ADMIN_DATABASE_URL_REQUIRED');

const pool = new Pool({
  ...secureDatabaseOptions(connectionString),
  max: 1,
  connectionTimeoutMillis: 12_000,
});

try {
  const client = await pool.connect();
  try {
    const result = await client.query<{
      guardians_table: boolean;
      mother_occupation_columns: number;
      mother_occupation_type: string | null;
      mother_occupation_nullable: string | null;
      canonical_fee_invoices_table: boolean;
      invoice_number_columns: number;
      invoice_number_type: string | null;
      invoices_missing_official_number: number;
      canonical_journals_table: boolean;
      journal_number_columns: number;
      journal_number_type: string | null;
      journals_missing_official_number: number;
      financial_document_sequences_table: boolean;
      financial_document_sequences_rls: boolean;
      financial_document_sequences_policy: boolean;
      invoice_number_unique_index: boolean;
      journal_number_unique_index: boolean;
    }>(`
      SELECT
        to_regclass('public.guardians') IS NOT NULL AS guardians_table,
        (SELECT count(*) FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'guardians'
            AND column_name = 'mother_occupation')::int AS mother_occupation_columns,
        (SELECT data_type FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'guardians'
            AND column_name = 'mother_occupation') AS mother_occupation_type,
        (SELECT is_nullable FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'guardians'
            AND column_name = 'mother_occupation') AS mother_occupation_nullable
        ,to_regclass('public.student_fee_invoices') IS NOT NULL AS canonical_fee_invoices_table
        ,(SELECT count(*) FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'student_fee_invoices'
            AND column_name = 'invoice_number')::int AS invoice_number_columns
        ,(SELECT data_type FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'student_fee_invoices'
            AND column_name = 'invoice_number') AS invoice_number_type
        ,to_regclass('public.erp_journal_entries') IS NOT NULL AS canonical_journals_table
        ,(SELECT count(*) FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'erp_journal_entries'
            AND column_name = 'journal_number')::int AS journal_number_columns
        ,(SELECT data_type FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'erp_journal_entries'
            AND column_name = 'journal_number') AS journal_number_type
        ,to_regclass('public.erp_financial_document_sequences') IS NOT NULL AS financial_document_sequences_table
        ,COALESCE((SELECT relrowsecurity FROM pg_class
          WHERE oid = to_regclass('public.erp_financial_document_sequences')), false) AS financial_document_sequences_rls
        ,EXISTS (SELECT 1 FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'erp_financial_document_sequences'
            AND policyname = 'erp_financial_document_sequences_school_scope') AS financial_document_sequences_policy
        ,to_regclass('public.uq_student_fee_invoice_official_number') IS NOT NULL AS invoice_number_unique_index
        ,to_regclass('public.uq_erp_journal_official_number') IS NOT NULL AS journal_number_unique_index
    `);

    const verification = result.rows[0];
    verification.invoices_missing_official_number = -1;
    verification.journals_missing_official_number = -1;
    if (verification.canonical_fee_invoices_table && verification.invoice_number_columns === 1
      && verification.canonical_journals_table && verification.journal_number_columns === 1) {
      const missingNumbers = await client.query<{
        invoices_missing_official_number: number;
        journals_missing_official_number: number;
      }>(`
        SELECT (SELECT count(*) FROM public.student_fee_invoices WHERE invoice_number IS NULL)::int AS invoices_missing_official_number,
               (SELECT count(*) FROM public.erp_journal_entries WHERE journal_number IS NULL)::int AS journals_missing_official_number
      `);
      verification.invoices_missing_official_number = missingNumbers.rows[0].invoices_missing_official_number;
      verification.journals_missing_official_number = missingNumbers.rows[0].journals_missing_official_number;
    }
    const ready = verification.guardians_table
      && verification.mother_occupation_columns === 1
      && verification.mother_occupation_type === 'text'
      && verification.mother_occupation_nullable === 'YES'
      && verification.canonical_fee_invoices_table
      && verification.invoice_number_columns === 1
      && verification.invoice_number_type === 'text'
      && verification.invoices_missing_official_number === 0
      && verification.canonical_journals_table
      && verification.journal_number_columns === 1
      && verification.journal_number_type === 'text'
      && verification.journals_missing_official_number === 0
      && verification.financial_document_sequences_table
      && verification.financial_document_sequences_rls
      && verification.financial_document_sequences_policy
      && verification.invoice_number_unique_index
      && verification.journal_number_unique_index;

    if (!ready) {
      throw new Error(`PRODUCTION_SCHEMA_NOT_READY: ${JSON.stringify(verification)}`);
    }

    const financialSerials = await verifyFinancialSerialSchema(client);
    console.log(JSON.stringify({ success: true, verification, financialSerials }));
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
