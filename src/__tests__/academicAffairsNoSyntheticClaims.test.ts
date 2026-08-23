import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AcademicAffairsPortal authoritative KPI contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/AcademicAffairsPortal.tsx'), 'utf8');

  it('does not claim capacity or schedule approval without source records', () => {
    expect(source).toContain("'السعة غير متحققة'");
    expect(source).toContain("'بانتظار جدول مركزي'");
    expect(source).not.toContain('طاقة استيعابية 100%');
    expect(source).not.toContain('معتمد بنسبة 100%');
    expect(source).toContain('لا توجد بيانات تغطية مناهج مركزية متاحة للتحقق.');
    expect(source).not.toContain('94%');
    expect(source).not.toContain('92%');
    expect(source).toContain('لا توجد بيانات فصول مركزية متاحة للتحقق.');
    expect(source).not.toContain('32 / 35 طالب');
    expect(source).not.toContain('د. أحمد المحمود');
  });
});
