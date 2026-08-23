import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('closing tab canonical persistence contract', () => {
  it('guards annual close, opening, and reset before localStorage mutation', () => {
    const file = fs.readFileSync(
      path.resolve(process.cwd(), 'src/modules/accounting/presentation/ClosingTab.tsx'),
      'utf8',
    );
    expect(file).toContain("canonicalFinancialWriteMode === 'ledger_ready'");
    expect(file).toContain('الإقفال السنوي متوقف: المصدر الحالي snapshot للقراءة فقط');
    expect(file).toContain('عمليات الإقفال وفتح السنة متوقفة: المصدر الحالي snapshot للقراءة فقط');
    expect((file.match(/ensureCanonicalClosingPersistence\(\)/g) || []).length).toBeGreaterThanOrEqual(3);
  });
});
