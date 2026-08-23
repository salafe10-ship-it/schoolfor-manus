import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('exams scheduler persistence contract', () => {
  it('confirms generated schedules only after central persistence', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    expect(source).toContain('const persisted = await saveToServerDb(');
    expect(source).toContain('تعذر حفظ جدول الامتحانات والمراقبين في المصدر المركزي');
  });
});
