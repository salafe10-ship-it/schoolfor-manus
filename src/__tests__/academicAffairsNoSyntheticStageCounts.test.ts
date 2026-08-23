import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/AcademicAffairsPortal.tsx'), 'utf8');

describe('academic affairs evidence safety', () => {
  it('does not present fixed stage counts as school data', () => {
    expect(source).toContain('إجمالي الطلاب:</span><span className="font-mono text-slate-500">غير متحقق');
    expect(source).not.toContain('840 طالب');
    expect(source).not.toContain('560 طالب');
    expect(source).not.toContain('420 طالب');
  });
});
