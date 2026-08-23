import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('exams unlock persistence contract', () => {
  it('announces reopening only after the central save resolves', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    expect(source).toContain('const persisted = await saveToServerDb(');
    expect(source).toContain('تعذر حفظ إعادة فتح الكنترول في المصدر المركزي');
  });
});
