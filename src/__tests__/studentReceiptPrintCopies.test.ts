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
    expect(handler).not.toContain('window.open(');
    expect(handler).not.toContain('window.print();');
    expect(source).toContain('aria-label="معاينة سند القبض قبل الطباعة"');
    expect(source).toContain('printFrame.print();');
    expect(source).toContain('طباعة الآن');
  });
});
