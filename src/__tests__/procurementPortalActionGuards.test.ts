import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('procurement portal action guards', () => {
  it('handles blocked save actions without uncaught exceptions', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/procurement/ProcurementManagementPortal.tsx'), 'utf8');
    expect(source).toContain('تعذر حفظ طلب الشراء.');
    expect(source).toContain('تعذر حفظ أمر الشراء.');
    expect(source).toContain('تعذر حفظ محضر الاستلام.');
    expect(source).toContain('تعذر حفظ فاتورة المورد.');
    expect(source).toContain("catch (error: any)");
  });
});
