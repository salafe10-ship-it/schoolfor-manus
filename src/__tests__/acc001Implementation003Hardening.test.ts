import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('ACC-001-IMPLEMENTATION-003 accounting hardening', () => {
  it('removes the embedded posting capability secret', () => {
    const journalRepository = read('src/database/repositories/JournalRepository.ts');
    const postingEngine = read('src/database/services/PostingEngine.ts');

    expect(journalRepository).not.toContain('POSTING_ENGINE_SECURE_TOKEN_57291');
    expect(postingEngine).not.toContain('POSTING_ENGINE_SECURE_TOKEN_57291');
    expect(journalRepository).toContain('POSTING_ENGINE_CAPABILITY');
  });

  it('fails closed for canonical accounting voucher and invoice paths', () => {
    const receipt = read('src/modules/accounting/presentation/ReceiptVoucherTab.tsx');
    const payment = read('src/modules/accounting/presentation/PaymentVoucherTab.tsx');
    const app = read('src/App.tsx');

    expect(receipt).toContain('FallbackStorage.isCanonicalPersistenceRequired()');
    expect(payment).toContain('FallbackStorage.isCanonicalPersistenceRequired()');
    expect(app).toContain('تعذر إصدار الفاتورة: يلزم ربط مسار الفوترة بالحفظ المحاسبي المركزي أولاً.');
  });

  it('does not use a static tenant or unconditional authorization for chart deletion', () => {
    const portal = read('src/components/GeneralLedgerPortal.tsx');

    expect(portal).not.toContain("tenantId: 'school_1'");
    expect(portal).not.toContain('authorizationBlock: () => ({ authorized: true })');
    expect(portal).toContain('tenantId: selectedSchool.id');
    expect(portal).toContain("hasUserPermission('ledger:delete')");
  });

  it('keeps report navigation on the existing handlers', () => {
    const reports = read('src/modules/accounting/presentation/FinancialReportsTab.tsx');

    expect(reports).toContain("handleSelectReport('trial_balance')");
    expect(reports).toContain('handleDrillDownToAccount(line.accountCode)');
    expect(reports).not.toContain("onClick={() => ('trial_balance')}");
  });
});
