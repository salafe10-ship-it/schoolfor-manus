import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student affairs form integrity', () => {
  it('keeps the required gender/status validation and uses an explicit Arabic default for gender', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'), 'utf8');
    expect(source).toContain("gender: 'ذكر'");
    expect(source).toContain("status: ''");
    expect(source).toContain('الجنس والحالة الدراسية حقول مطلوبة');
    expect(source).not.toContain("status: 'active'");
  });
});
