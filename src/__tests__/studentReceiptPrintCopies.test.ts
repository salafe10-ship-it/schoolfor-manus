import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/StudentFinancialPortal.tsx'),
  'utf8'
);

describe('student receipt print layout', () => {
  it('prints two clearly identified half-page copies on one A4 page', () => {
    const handlerStart = source.indexOf('const handlePrintSingleVoucher');
    const handlerEnd = source.indexOf('// 9. Toolbar - EXPORT PDF', handlerStart);
    const handler = source.slice(handlerStart, handlerEnd);

    expect(handler).toContain('@page { size: A4 portrait; margin: 0; }');
    expect(handler).toContain('height: 139mm;');
    expect(handler).toContain('min-height: 139mm;');
    expect(handler).toContain('نسخة ولي الأمر');
    expect(handler).toContain('cloneNode');
    expect(handler).toContain('نسخة الحسابات العامة');
    expect(handler).toContain('window.onload = function()');
    expect(handler).toContain('setReceiptPrintPreviewHtml(`');
    expect(handler).toContain('voucherStudentContext?.costCenter || receiptStudent?.stageId || receiptStudent?.name');
    expect(handler).toContain('شعار مرحلة ${STUDENT_COST_CENTER_LABELS[stageLogoKey] || stageLogoKey}');
    expect(handler).toContain("receiptStudent?.academicId || receiptStudent?.studentCode || 'غير مسجل'");
    expect(handler).not.toContain('receiptReference.fullId');
    expect(handler).not.toContain('receiptStudentNumber || v.studentId');
    expect(handler).not.toContain('window.open(');
    expect(handler).not.toContain('window.print();');
    expect(source).toContain('aria-label={documentPrintPreviewTitle}');
    expect(source).toContain('printFrame.print();');
    expect(source).toContain('طباعة الآن');
  });

  it('opens fee settings, account ledgers, and filtered receipt reports in an in-page preview', () => {
    const settingsStart = source.indexOf("logAction('PRINT_FEE_SETTINGS'");
    const settingsEnd = source.indexOf('</button>', settingsStart);
    const settings = source.slice(source.lastIndexOf('onClick={() => {', settingsStart), settingsEnd);
    expect(settings).toContain('setReceiptPrintPreviewHtml(htmlContent)');
    expect(settings).toContain('setDocumentPrintPreviewTitle');
    expect(settings).not.toContain('window.open(');
    expect(settings).toContain('escapePrintHtml(item.type)');
    expect(settings).toContain("buildPrintStageLogos(['primary', 'middle', 'secondary'])");

    const ledgerStart = source.indexOf('const handlePrintStudentLedger');
    const ledgerEnd = source.indexOf('// Helper to print a single voucher', ledgerStart);
    const ledger = source.slice(ledgerStart, ledgerEnd);
    expect(ledger).toContain('setReceiptPrintPreviewHtml(`');
    expect(ledger).not.toContain('window.open(');
    expect(ledger).not.toContain('window.print();');

    expect(source).toContain('معاينة كشف سندات القبض قبل الطباعة');
    expect(source).toContain('student.academicId || student.studentCode || \'غير مسجل\'');
  });
});
