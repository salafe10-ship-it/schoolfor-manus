import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student affairs form integrity', () => {
  it('does not invent gender or active status and requires them before save', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'), 'utf8');
    expect(source).toContain("gender: ''");
    expect(source).toContain("status: ''");
    expect(source).toContain('الجنس والحالة الدراسية حقول مطلوبة');
    expect(source).not.toContain("gender: 'ذكر'");
    expect(source).not.toContain("status: 'active'");
  });
});
