import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student library integrity', () => {
  it('does not display a fabricated membership or active loan', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/student-affairs/StudentLibrary.tsx'),
      'utf8'
    );
    expect(source).toContain('لا توجد إعارات موثقة');
    expect(source).toContain('لا توجد بيانات');
    expect(source).toContain('disabled');
    expect(source).not.toContain('BK-9284-01');
    expect(source).not.toContain('1 كتاب ثقافي');
  });
});
