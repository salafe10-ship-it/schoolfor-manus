import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('exams approval persistence contract', () => {
  it('announces approval success only after the server save resolves', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    expect(source).toContain('const persisted = await saveToServerDb(');
    expect(source).toContain('تعذر حفظ اعتماد النتائج في المصدر المركزي');
  });
});
