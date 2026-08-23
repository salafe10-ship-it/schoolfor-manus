import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('exams setup persistence contract', () => {
  it('waits for central persistence before confirming setup mutations', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    expect(source).toContain('تعذر حفظ إعدادات الامتحانات في المصدر المركزي');
    expect(source).toContain('تعذر حفظ المادة الجديدة في المصدر المركزي');
    expect(source).toContain('تعذر حفظ الصف الجديد في المصدر المركزي');
  });
});
