import { describe, expect, it } from 'vitest';
import { resolveFinancialDocumentReference } from '../utils/financialDocumentReference';

describe('financial document references', () => {
  it('uses the official receipt voucher number and keeps its internal key available', () => {
    expect(resolveFinancialDocumentReference({
      id: '5a987b85-11e2-4b7f-b416-123456789abc',
      receiptVoucherId: 'RCV-2026-00000127',
    }, 'receipt')).toEqual({
      value: 'RCV-2026-00000127',
      fullId: '5a987b85-11e2-4b7f-b416-123456789abc',
      isDocumentNumber: true,
      label: 'رقم المستند',
    });
  });

  it('recognizes existing payment and legacy receipt serials without changing them', () => {
    expect(resolveFinancialDocumentReference({ id: 'PV-2026-0024' }, 'payment').value).toBe('PV-2026-0024');
    expect(resolveFinancialDocumentReference({ id: 'RV-2026-0025' }, 'receipt').value).toBe('RV-2026-0025');
    expect(resolveFinancialDocumentReference({ id: 'JV-2026-000042' }, 'journal'))
      .toMatchObject({ value: 'JV-2026-000042', isDocumentNumber: true, label: 'رقم القيد' });
    expect(resolveFinancialDocumentReference({ id: 'INV-2026-000042' }, 'invoice'))
      .toMatchObject({ value: 'INV-2026-000042', isDocumentNumber: true, label: 'رقم المستند' });
  });

  it('never presents a canonical journal key as a sequential journal number', () => {
    const reference = resolveFinancialDocumentReference({ id: 'ERP-JV-payment_voucher-PV-2026-0024' }, 'journal');
    expect(reference.isDocumentNumber).toBe(false);
    expect(reference.label).toBe('معرّف القيد بالنظام');
    expect(reference.value).toContain('معرّف النظام');
    expect(reference.fullId).toBe('ERP-JV-payment_voucher-PV-2026-0024');
  });

  it('prefers a stored journal number when one exists', () => {
    expect(resolveFinancialDocumentReference({ id: 'ERP-JV-manual-uuid', journalNumber: 'JV-2026-000018' }, 'journal'))
      .toMatchObject({ value: 'JV-2026-000018', isDocumentNumber: true, label: 'رقم القيد' });
  });

  it('resolves the official journal number from a linked canonical entry', () => {
    expect(resolveFinancialDocumentReference({
      id: 'RCV-2026-000031',
      journalEntryId: 'ERP-JV-student_receipt-RCV-2026-000031',
      canonicalJournalEntry: {
        id: 'ERP-JV-student_receipt-RCV-2026-000031',
        journalNumber: 'JV-2026-000080',
      },
    }, 'journal')).toEqual({
      value: 'JV-2026-000080',
      fullId: 'ERP-JV-student_receipt-RCV-2026-000031',
      isDocumentNumber: true,
      label: 'رقم القيد',
    });
  });

  it('resolves the receipt serial stored on a linked canonical entry', () => {
    expect(resolveFinancialDocumentReference({
      id: 'internal-receipt-key',
      canonicalJournalEntry: {
        id: 'ERP-JV-student_receipt-internal-receipt-key',
        sourceDocumentNumber: 'RCV-2026-00000033'
      }
    }, 'receipt')).toMatchObject({ value: 'RCV-2026-00000033', isDocumentNumber: true });
  });

  it('labels a UUID claim identifier as a system ID when no invoice number is stored', () => {
    const reference = resolveFinancialDocumentReference({ id: '5a987b85-11e2-4b7f-b416-123456789abc' }, 'invoice');
    expect(reference.isDocumentNumber).toBe(false);
    expect(reference.value).toMatch(/^معرّف النظام · /);
    expect(reference.fullId).toBe('5a987b85-11e2-4b7f-b416-123456789abc');
  });
});
