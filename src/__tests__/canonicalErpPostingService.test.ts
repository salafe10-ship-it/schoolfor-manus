import { describe, expect, it } from 'vitest';
import { buildCanonicalPosting } from '../modules/financial/application/CanonicalErpPostingService';

describe('canonical ERP accounting mappings', () => {
  it('uses school/module mappings instead of limiting the integration to example accounts', () => {
    const mappings = new Map([
      ['student_fees.receivable', '1290'],
      ['student_fees.revenue', '4200'],
      ['treasury.cash', '1110'],
      ['expenses.default', '5300'],
      ['liabilities.accrued_expense', '2300']
    ]);

    const invoice = buildCanonicalPosting('student_fee_invoice', {
      id: 'INV-100', amount: 1250, invoiceDate: '2026-08-24', status: 'unpaid', item: 'رسوم فصلية'
    }, mappings);
    const receipt = buildCanonicalPosting('student_receipt', {
      id: 'RV-100', amount: 500, date: '2026-08-24', status: 'posted'
    }, mappings);
    const accrual = buildCanonicalPosting('expense_accrual', {
      id: 'EXP-100', amount: 700, date: '2026-08-24', status: 'accrued', description: 'فاتورة كهرباء'
    }, mappings);

    expect(invoice?.lines.map(line => line.accountCode)).toEqual(['1290', '4200']);
    expect(receipt?.lines.map(line => line.accountCode)).toEqual(['1110', '1290']);
    expect(accrual?.lines.map(line => line.accountCode)).toEqual(['5300', '2300']);
    expect(invoice?.lines.reduce((sum, line) => sum + line.debit, 0)).toBe(1250);
    expect(invoice?.lines.reduce((sum, line) => sum + line.credit, 0)).toBe(1250);
  });

  it('does not post drafts or cancelled documents', () => {
    expect(buildCanonicalPosting('student_fee_invoice', { id: 'INV-D', amount: 10, status: 'draft' })).toBeNull();
    expect(buildCanonicalPosting('student_receipt', { id: 'RV-C', amount: 10, status: 'cancelled' })).toBeNull();
    expect(buildCanonicalPosting('payment_voucher', { id: 'PV-D', amount: 10, status: 'saved' })).toBeNull();
  });

  it('supports explicit per-document account links for modules such as inventory and assets', () => {
    const posting = buildCanonicalPosting('payment_voucher', {
      id: 'PV-ASSET-1', amount: 900, date: '2026-08-24', status: 'posted',
      paidToAccount: '1505', paidFromAccount: '1120', against: 'شراء أصل ثابت'
    });

    expect(posting?.lines.map(line => line.accountCode)).toEqual(['1505', '1120']);
    expect(posting?.description).toBe('شراء أصل ثابت');
  });

  it('keeps student fee invoice and receipt links explicit across the AR workflow', () => {
    const invoice = buildCanonicalPosting('student_fee_invoice', {
      id: 'INV-EXPLICIT-1', amount: 300, invoiceDate: '2026-08-24', status: 'unpaid',
      revenueAccount: '4301', receivableAccount: '1290', item: 'رسوم نقل'
    }, new Map([
      ['student_fees.receivable', '1201'],
      ['student_fees.revenue', '4101']
    ]));
    const receipt = buildCanonicalPosting('student_receipt', {
      id: 'RV-EXPLICIT-1', amount: 100, date: '2026-08-24', status: 'posted',
      receivingAccount: '1110', receivableAccount: '1290'
    }, new Map([
      ['student_fees.receivable', '1201'],
      ['treasury.cash', '1101']
    ]));

    expect(invoice?.lines.map(line => line.accountCode)).toEqual(['1290', '4301']);
    expect(receipt?.lines.map(line => line.accountCode)).toEqual(['1110', '1290']);
  });

  it('maps balanced manual journal entries to the canonical ledger contract', () => {
    const posting = buildCanonicalPosting('journal_entry', {
      id: 'JV-MANUAL-1', date: '2026-08-24', status: 'posted', description: 'قيد تسوية يدوي',
      lines: [
        { id: 'D1', accountCode: '5270', accountName: 'مصروف تشغيلي', debit: 250, credit: 0 },
        { id: 'C1', accountCode: '2101', accountName: 'التزام مورد', debit: 0, credit: 250 }
      ]
    });

    expect(posting?.sourceType).toBe('journal_entry');
    expect(posting?.lines.map(line => line.accountCode)).toEqual(['5270', '2101']);
    expect(posting?.lines.reduce((sum, line) => sum + line.debit, 0)).toBe(250);
    expect(posting?.lines.reduce((sum, line) => sum + line.credit, 0)).toBe(250);
  });

  it('rejects an unbalanced manual journal entry', () => {
    expect(() => buildCanonicalPosting('journal_entry', {
      id: 'JV-UNBALANCED', date: '2026-08-24', status: 'posted',
      lines: [
        { accountCode: '5270', debit: 250, credit: 0 },
        { accountCode: '2101', debit: 0, credit: 200 }
      ]
    })).toThrow('غير متوازن');
  });
});
