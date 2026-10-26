import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { CanonicalErpPostingService } from '../modules/financial/application/CanonicalErpPostingService';

const serialMigration = readFileSync(path.resolve(process.cwd(), 'supabase/migrations/202610231100_financial_document_serial_numbers.sql'), 'utf8');
const voucherSerialMigration = readFileSync(path.resolve(process.cwd(), 'supabase/migrations/202610241100_financial_voucher_serial_numbers.sql'), 'utf8');
const appRoleMigration = readFileSync(path.resolve(process.cwd(), 'supabase/migrations/202608311400_restricted_app_role.sql'), 'utf8');
const stagingRoleMigration = readFileSync(path.resolve(process.cwd(), 'supabase/migrations/202609031100_staging_app_role.sql'), 'utf8');

describe('canonical financial document serial allocation', () => {
  it('returns a stable-format serial from the transactional school/year counter', async () => {
    let invoiceCounter = 41;
    let journalCounter = 8;
    let paymentCounter = 24;
    const query = vi.fn(async (_sql: string, values: unknown[] = []) => {
      const kind = values[2];
      const next = kind === 'invoice' ? ++invoiceCounter : kind === 'payment' ? ++paymentCounter : ++journalCounter;
      return { rows: [{ last_number: String(next) }] } as any;
    });
    const transaction = { query } as any;

    const invoiceNumber = await CanonicalErpPostingService.allocateDocumentNumber(
      transaction, 'tenant-id', 'school-id', 'invoice', '2026-10-23'
    );
    const journalNumber = await CanonicalErpPostingService.allocateDocumentNumber(
      transaction, 'tenant-id', 'school-id', 'journal', '2026-10-23'
    );
    const paymentNumber = await CanonicalErpPostingService.allocateDocumentNumber(
      transaction, 'tenant-id', 'school-id', 'payment', '2026-10-23'
    );

    expect(invoiceNumber).toBe('INV-2026-000042');
    expect(journalNumber).toBe('JV-2026-000009');
    expect(paymentNumber).toBe('PV-2026-0025');
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('ON CONFLICT (school_id, document_kind, fiscal_year)'),
      ['tenant-id', 'school-id', 'invoice', 2026]);
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining('ON CONFLICT (school_id, document_kind, fiscal_year)'),
      ['tenant-id', 'school-id', 'journal', 2026]);
    expect(query).toHaveBeenNthCalledWith(3, expect.stringContaining('ON CONFLICT (school_id, document_kind, fiscal_year)'),
      ['tenant-id', 'school-id', 'payment', 2026]);
  });

  it('rejects malformed dates before requesting a number', async () => {
    const query = vi.fn();
    await expect(CanonicalErpPostingService.allocateDocumentNumber(
      { query } as any, 'tenant-id', 'school-id', 'invoice', '23/10/2026'
    )).rejects.toThrow('التاريخ المالي غير صالح');
    expect(query).not.toHaveBeenCalled();
  });

  it('backfills historical invoice and journal references without changing journal accounting data', () => {
    expect(serialMigration).toContain('ROW_NUMBER() OVER');
    expect(serialMigration).toContain("OLD.journal_number IS NULL");
    expect(serialMigration).toContain("NEW.journal_number IS NOT NULL");
    expect(serialMigration).toContain("(to_jsonb(NEW) - 'journal_number') = (to_jsonb(OLD) - 'journal_number')");
    expect(serialMigration).toContain("SET invoice_number = 'INV-'");
    expect(serialMigration).toContain("SET journal_number = 'JV-'");
  });

  it('keeps sequence-table RLS scoped while using the established inherited app roles', () => {
    expect(serialMigration).toContain('CREATE POLICY erp_financial_document_sequences_school_scope');
    expect(serialMigration).toContain('FOR ALL TO authenticated');
    expect(serialMigration).toContain("tenant_id::text = current_setting('app.tenant_id', true)");
    expect(serialMigration).toContain("school_id::text = current_setting('app.school_id', true)");
    expect(appRoleMigration).toContain('GRANT authenticated TO edupro_app');
    expect(stagingRoleMigration).toContain('GRANT edupro_app TO edupro_staging_app');
  });

  it('keeps receipt and payment serials unique and only permits metadata-only serial backfills on posted journals', () => {
    expect(voucherSerialMigration).toContain("CHECK (document_kind IN ('invoice', 'journal', 'payment'))");
    expect(voucherSerialMigration).toContain('ADD COLUMN IF NOT EXISTS source_document_number text');
    expect(voucherSerialMigration).toContain('uq_student_fee_receipt_official_number');
    expect(voucherSerialMigration).toContain('uq_erp_journal_source_document_number');
    expect(voucherSerialMigration).toContain("IF NEW.status = OLD.status");
    expect(voucherSerialMigration).toContain("source_type = 'payment_voucher'");
    expect(voucherSerialMigration).toContain('student_fee_receipt_sequences');
  });
});
