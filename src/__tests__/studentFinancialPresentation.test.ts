import { describe, expect, it } from 'vitest';
import { aggregateStudentFinancialSnapshot, buildStudentLedgerRows, classifyAcademicStage, createInstallmentPreview, findFeeConfigurationForStage, formatFinancialReference, isFeeConfigurationCompatibleWithStage, resolveReceiptTenders, toLocalDateInputValue } from '../utils/studentFinancialPresentation';

describe('student financial presentation helpers', () => {
  it('keeps a paid invoice in debit and displays its receipt as a positive credit with a running balance', () => {
    const rows = buildStudentLedgerRows([
      { id: 'RV-STUD-30', date: '2026-10-23', description: 'سداد كامل', amount: 2400, kind: 'receipt', status: 'posted' },
      { id: 'INV-STUD-30', date: '2026-10-23', description: 'رسوم دراسية', amount: 2400, kind: 'invoice', status: 'paid' },
    ]);

    expect(rows).toEqual([
      expect.objectContaining({ id: 'INV-STUD-30', debit: 2400, credit: 0, balance: 2400, isCancelled: false }),
      expect.objectContaining({ id: 'RV-STUD-30', debit: 0, credit: 2400, balance: 0, isCancelled: false }),
    ]);
  });

  it('aggregates a verified invoice snapshot independently of operational write readiness', () => {
    const snapshot = aggregateStudentFinancialSnapshot([
      { studentId: 'paid', studentName: 'طالب مكتمل', amount: 1200, paidAmount: 1200, remainingAmount: 0, status: 'paid' },
      { studentId: 'partial', studentName: 'طالب جزئي', amount: 1800, paidAmount: 900, remainingAmount: 900, status: 'partially_paid' },
      { studentId: 'cancelled', amount: 500, paidAmount: 0, remainingAmount: 500, status: 'cancelled' }
    ]);

    expect(snapshot).toMatchObject({
      totalInvoiced: 3000,
      totalPaid: 2100,
      totalRemaining: 900,
      collectionRate: 70
    });
    expect(snapshot.students).toEqual([
      expect.objectContaining({ studentId: 'paid', studentName: 'طالب مكتمل', remaining: 0 }),
      expect.objectContaining({ studentId: 'partial', studentName: 'طالب جزئي', remaining: 900 })
    ]);
  });

  it('keeps a verified empty invoice snapshot at zero instead of reporting unavailable', () => {
    expect(aggregateStudentFinancialSnapshot([])).toMatchObject({
      totalInvoiced: 0,
      totalPaid: 0,
      totalRemaining: 0,
      collectionRate: null,
      students: []
    });
  });

  it('formats calendar dates from local date fields without a UTC day shift', () => {
    expect(toLocalDateInputValue(new Date(2026, 9, 23, 23, 45))).toBe('2026-10-23');
    expect(toLocalDateInputValue(new Date(Number.NaN))).toBe('');
  });

  it('keeps cancelled invoices visible without changing the running student balance', () => {
    const rows = buildStudentLedgerRows([
      { id: 'INV-CANCELLED', date: '2026-10-23', description: 'مطالبة ملغاة', amount: 1800, kind: 'invoice', status: 'cancelled' },
      { id: 'INV-OPEN', date: '2026-10-24', description: 'مطالبة قائمة', amount: 1200, kind: 'invoice', status: 'unpaid' },
    ]);

    expect(rows[0]).toMatchObject({ id: 'INV-CANCELLED', debit: 1800, balance: null, isCancelled: true });
    expect(rows[1]).toMatchObject({ id: 'INV-OPEN', debit: 1200, balance: 1200, isCancelled: false });
  });

  it('distributes every cent and assigns the rounding remainder to the last installment', () => {
    const rows = createInstallmentPreview(100, 'monthly', 3, '2026-01-31', 0);

    expect(rows.map(row => row.amount)).toEqual([33.33, 33.33, 33.34]);
    expect(rows.reduce((sum, row) => sum + row.amount, 0)).toBe(100);
  });

  it('keeps month ends valid across leap years and applies grace days after the due date', () => {
    const rows = createInstallmentPreview(200, 'monthly', 3, '2028-01-31', 2);

    expect(rows.map(row => row.date)).toEqual(['2028-02-02', '2028-03-02', '2028-04-02']);
  });

  it('rejects impossible calendar dates instead of previewing a normalized date', () => {
    expect(createInstallmentPreview(100, 'monthly', 2, '2026-02-31', 0)).toEqual([]);
  });

  it('supports quarterly and yearly due dates and caps the schedule at sixty installments', () => {
    expect(createInstallmentPreview(300, 'quarterly', 3, '2026-10-15', 0).map(row => row.date))
      .toEqual(['2026-10-15', '2027-01-15', '2027-04-15']);
    expect(createInstallmentPreview(600, 'yearly', 61, '2026-02-28', 0)).toHaveLength(60);
  });

  it('classifies Arabic and English stages and prevents cross-stage fee distribution', () => {
    expect(classifyAcademicStage('الابتدائي')).toBe('primary');
    expect(classifyAcademicStage('Middle School')).toBe('middle');
    expect(classifyAcademicStage('الثانوي')).toBe('secondary');
    expect(isFeeConfigurationCompatibleWithStage('رسوم اختبار — ابتدائي', 'الثانوي')).toBe(false);
    expect(isFeeConfigurationCompatibleWithStage('رسوم كتب عامة', 'الثانوي')).toBe(true);
    expect(isFeeConfigurationCompatibleWithStage('رسوم اختبار — ثانوي', 'الثانوي')).toBe(true);
  });

  it('prefers the matching stage tariff and falls back only to a general tariff', () => {
    const configurations = [
      { id: 'primary', type: 'رسوم دراسية — ابتدائي' },
      { id: 'general', type: 'رسوم زي مدرسي' },
      { id: 'secondary', type: 'رسوم دراسية — ثانوي' },
    ];

    expect(findFeeConfigurationForStage(configurations, 'الثانوي')?.id).toBe('secondary');
    expect(findFeeConfigurationForStage(configurations, 'متوسط')?.id).toBe('general');
    expect(findFeeConfigurationForStage(configurations, 'مرحلة غير معروفة')).toBeNull();
  });

  it('shortens opaque identifiers without changing concise receipt references', () => {
    const invoiceId = '09db8b69-a86d-4f8a-95a0-7398ced32e31';

    expect(formatFinancialReference(invoiceId)).toBe('…ced32e31');
    expect(formatFinancialReference(`RV-STUD-${invoiceId}`)).toBe('RV-STUD-…ced32e31');
    expect(formatFinancialReference('RV-2026-0002')).toBe('RV-2026-0002');
  });

  it('uses canonical journal debit lines when a legacy receipt only stores the first tender', () => {
    const voucher = {
      id: 'RV-STUD-test',
      amount: 2400,
      receivingAccount: '1101',
      paymentMethod: 'نقدي',
      journalEntryId: 'ERP-JV-student_receipt-RV-STUD-test'
    };
    const journals = [{
      id: voucher.journalEntryId,
      sourceType: 'student_receipt',
      sourceId: voucher.id,
      lines: [
        { accountCode: '1101', debit: 1200, credit: 0 },
        { accountCode: '110201', debit: 1200, credit: 0 },
        { accountCode: '1201', debit: 0, credit: 2400 }
      ]
    }];

    expect(resolveReceiptTenders(voucher, journals)).toEqual([
      { accountCode: '1101', amount: 1200, paymentMethod: 'غير محددة' },
      { accountCode: '110201', amount: 1200, paymentMethod: 'غير محددة' }
    ]);
    expect(resolveReceiptTenders({ ...voucher, canonicalJournalEntry: journals[0] })).toEqual([
      { accountCode: '1101', amount: 1200, paymentMethod: 'غير محددة' },
      { accountCode: '110201', amount: 1200, paymentMethod: 'غير محددة' }
    ]);
  });
});
