import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student fees summary integrity', () => {
  it('does not display fabricated invoice or payment totals', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/student-affairs/StudentFeesSummary.tsx'),
      'utf8'
    );
    expect(source).toContain('لا توجد فواتير أو قيود موثقة');
    expect(source).toContain('غير متوفر');
    expect(source).not.toContain('INV-1447-0091');
    expect(source).not.toContain('12500');
  });
});
