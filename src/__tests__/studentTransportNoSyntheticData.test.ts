import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student transport integrity', () => {
  it('does not display or claim a hard-coded subscription', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/student-affairs/StudentTransport.tsx'),
      'utf8'
    );
    expect(source).toContain('لا توجد بيانات موثقة');
    expect(source).toContain('لا يوجد اشتراك موثق يمكن إلغاؤه');
    expect(source).toContain('disabled className');
    expect(source).not.toContain('Bus-Route #14');
    expect(source).not.toContain('3,200 ريال');
  });
});
