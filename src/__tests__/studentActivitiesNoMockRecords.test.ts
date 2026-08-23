import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student activities integrity', () => {
  it('does not display fabricated clubs or awards', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/student-affairs/StudentActivities.tsx'),
      'utf8'
    );
    expect(source).toContain('لا توجد عضويات أو مشاركات موثقة');
    expect(source).toContain('لا توجد جوائز موثقة');
    expect(source).toContain('disabled');
    expect(source).not.toContain('نادي الذكاء الاصطناعي والابتكار');
    expect(source).not.toContain('درع التميز العلمي');
  });
});
