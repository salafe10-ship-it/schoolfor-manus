import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/StudentFinancialPortal.tsx'),
  'utf8',
);

describe('financial write lock is visible and enforced in the student finance UI', () => {
  it('keeps the canonical financial mutation lock enabled', () => {
    expect(source).toContain("const financialWritesLocked = import.meta.env.VITE_FINANCIAL_WRITES_ENABLED !== 'true';");
    expect(source).toContain('المصدر المالي متصل للقراءة فقط — الحفظ والترحيل مقفلان');
  });

  it('guards the receipt posting action with the same lock', () => {
    const posting = source.slice(source.indexOf('onClick={handlePostStudRv}'));
    expect(posting).toContain('disabled={financialWritesLocked || financialPersistence !== \'ready\'');
  });
});
