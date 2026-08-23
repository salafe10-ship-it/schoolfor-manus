import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student uniform integrity', () => {
  it('does not display fabricated issue or payment records', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/student-affairs/StudentUniform.tsx'),
      'utf8'
    );
    expect(source).toContain('غير محدد');
    expect(source).toContain('لا توجد أصناف موثقة متاحة');
    expect(source).toContain('disabled');
    expect(source).not.toContain('3 قطع');
    expect(source).not.toContain('450 ريال');
    expect(source).not.toContain('تم السداد بالكامل');
  });
});
