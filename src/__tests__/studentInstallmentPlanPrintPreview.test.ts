import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/StudentFinancialPortal.tsx'),
  'utf8'
);

describe('student installment plan print preview', () => {
  it('uses an in-page preview instead of a popup-only print window', () => {
    const handlerStart = source.indexOf('const handlePrintInstallmentPlan');
    const handlerEnd = source.indexOf('// Format Libyan Dinar', handlerStart);
    const handler = source.slice(handlerStart, handlerEnd);

    expect(handler).toContain('setInstallmentPlanPrintPreview({ plan, student });');
    expect(handler).not.toContain("window.open('', '_blank')");
    expect(source).toContain('student-installment-print-preview-overlay');
    expect(source).toContain('student-installment-print-sheet');
    expect(source).toContain('طباعة هذه المعاينة');
  });
});
