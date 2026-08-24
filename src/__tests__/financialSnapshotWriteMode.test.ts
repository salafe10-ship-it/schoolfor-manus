import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('UAT central financial writer boundary', () => {
  it('exposes snapshot_write only behind an explicit non-production flag and Financial.Write', () => {
    const server = read('server.ts');

    expect(server).toContain("process.env.NODE_ENV !== 'production'");
    expect(server).toContain("process.env.FINANCIAL_SNAPSHOT_WRITE_MODE === 'snapshot_write'");
    expect(server).toContain('authorizationEngine.authorizeTenant');
    expect(server).toContain("writeMode: resolveFinancialWriteMode(req)");
  });

  it('keeps the client distinction between central UAT writes and a real GL writer', () => {
    const portal = read('src/components/GeneralLedgerPortal.tsx');
    const reports = read('src/modules/accounting/presentation/FinancialReportsTab.tsx');
    const closing = read('src/modules/accounting/presentation/ClosingTab.tsx');

    expect(portal).toContain("'snapshot_write'");
    expect(portal).toContain('canonicalLedgerReady');
    expect(portal).toContain('غير معتمد كترحيل GL نهائي');
    expect(reports).toContain("canonicalFinancialWriteMode === 'ledger_ready'");
    expect(closing).toContain("canonicalFinancialWriteMode === 'ledger_ready'");
  });

  it('enables voucher persistence only for the explicit central writer mode', () => {
    const receipt = read('src/modules/accounting/presentation/ReceiptVoucherTab.tsx');
    const payment = read('src/modules/accounting/presentation/PaymentVoucherTab.tsx');
    const journal = read('src/modules/accounting/presentation/JournalEntriesTab.tsx');

    expect(receipt).toContain("const snapshotWriteReady = canonicalFinancialWriteMode === 'snapshot_write';");
    expect(payment).toContain("const snapshotWriteReady = canonicalFinancialWriteMode === 'snapshot_write';");
    expect(journal).toContain('journalWritesAreAvailable');
    expect(journal).toContain('غير معتمد كترحيل GL');
  });
});
