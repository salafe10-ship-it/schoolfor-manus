import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('closing tab canonical persistence contract', () => {
  it('guards annual close, opening, and reset before localStorage mutation', () => {
    const file = fs.readFileSync(
      path.resolve(process.cwd(), 'src/modules/accounting/presentation/ClosingTab.tsx'),
      'utf8',
    );
    expect(file).toContain("FallbackStorage.isCanonicalPersistenceRequired()");
    expect(file).toContain("عمليات الإقفال وفتح السنة متوقفة حتى يتم ربط حالة الإقفال بمصدر محاسبي مركزي موثوق.");
    expect((file.match(/ensureCanonicalClosingPersistence\(\)/g) || []).length).toBeGreaterThanOrEqual(3);
  });
});
