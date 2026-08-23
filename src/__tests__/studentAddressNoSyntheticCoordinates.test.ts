import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student address integrity', () => {
  it('does not display fabricated map coordinates or claim GIS integration', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/student-affairs/StudentAddressInformation.tsx'),
      'utf8'
    );
    expect(source).toContain('الإحداثيات: غير موثقة');
    expect(source).toContain('مطابقة الخرائط غير متاحة');
    expect(source).toContain('disabled');
    expect(source).not.toContain('24.7136');
    expect(source).not.toContain('46.6753');
  });
});
