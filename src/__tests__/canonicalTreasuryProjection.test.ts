import { describe, expect, it } from 'vitest';
import { buildCanonicalTreasuryProjection } from '../modules/accounting/domain/canonicalTreasuryProjection';

describe('canonical treasury read projection', () => {
  it('projects canonical cash ledger lines without creating a second financial write', () => {
    const result = buildCanonicalTreasuryProjection({
      erpChartOfAccounts: [
        { code: '1101', name: 'الصندوق', isActive: true, isLeaf: true, balance: 100 },
        { code: '1201', name: 'ذمم الطلاب', isActive: true, isLeaf: true, balance: 0 },
      ],
      erpLedgerEntries: [
        {
          id: 'gl-cash-1',
          journalEntryId: 'ERP-JV-student_receipt-RV-1',
          accountCode: '1101',
          entryDate: '2026-10-04',
          debit: 100,
          credit: 0,
          sourceType: 'student_receipt',
          sourceId: 'RV-1',
          description: 'سداد رسوم طالب',
          createdAt: '2026-10-04T10:00:00.000Z',
        },
        {
          id: 'gl-receivable-1',
          journalEntryId: 'ERP-JV-student_receipt-RV-1',
          accountCode: '1201',
          entryDate: '2026-10-04',
          debit: 0,
          credit: 100,
        },
      ],
    }, 'school-1');

    expect(result).not.toBeNull();
    expect(result?.accounts).toEqual([
      expect.objectContaining({ code: '1101', balance: 100, type: 'Main Chest' }),
    ]);
    expect(result?.transactions).toEqual([
      expect.objectContaining({
        type: 'Deposit',
        status: 'Posted',
        amount: 100,
        destinationAccountId: '1101',
        referenceType: 'student_receipt',
        referenceId: 'RV-1',
        journalEntryId: 'ERP-JV-student_receipt-RV-1',
      }),
    ]);
    expect(result?.transactions[0].notes).toContain('لا تُنشئ نسخة خزينة ثانية');
  });

  it('falls back to the legacy treasury repository when canonical data is unavailable', () => {
    expect(buildCanonicalTreasuryProjection({ invoices: [] }, 'school-1')).toBeNull();
    expect(buildCanonicalTreasuryProjection(undefined, 'school-1')).toBeNull();
  });
});
