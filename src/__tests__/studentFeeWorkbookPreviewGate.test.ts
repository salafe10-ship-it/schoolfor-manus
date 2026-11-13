import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('student fee workbook import preview gate', () => {
  it('returns from read-only preview before the first financial write request', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/StudentFinancialPortal.tsx'), 'utf8');
    const handlerStart = source.indexOf('const handleStudentFeeWorkbookFileChange = async (');
    const handlerEnd = source.indexOf('const handleExportExcel = async () =>', handlerStart);
    const handler = source.slice(handlerStart, handlerEnd);

    expect(handlerStart).toBeGreaterThanOrEqual(0);
    const previewGate = handler.indexOf('if (!commitRequested) {');
    const firstFinancialWrite = handler.indexOf("authenticatedRequest('/api/financial/invoices/issue-batch'");

    expect(previewGate).toBeGreaterThanOrEqual(0);
    expect(firstFinancialWrite).toBeGreaterThan(previewGate);
    expect(handler.slice(previewGate, firstFinancialWrite)).toContain('setStudentFeeWorkbookPendingFile(file)');
    expect(handler.slice(previewGate, firstFinancialWrite)).toContain('return;');
  });

  it('requires a separate explicit approval button to start writing', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/StudentFinancialPortal.tsx'), 'utf8');
    expect(source).toContain('studentFeeWorkbookPendingFile, true');
    expect(source).toContain('اعتماد الاستيراد المالي');
    expect(source).toContain('معاينة الشيت المالي والتحقق من المطابقة قبل أي حفظ أو ترحيل');
  });
});
