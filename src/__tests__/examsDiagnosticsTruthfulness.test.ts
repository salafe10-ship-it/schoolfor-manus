import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');

describe('exams diagnostics truthfulness contract', () => {
  it('does not report 100% success when diagnostics contain warnings', () => {
    expect(source).toContain('const allChecksPassed = finalResults.every(result => result.status === \'success\')');
    expect(source).toContain('توجد تنبيهات تحتاج إلى معالجة');
    expect(source).not.toContain('بنجاح وبنسبة 100%');
  });
});
