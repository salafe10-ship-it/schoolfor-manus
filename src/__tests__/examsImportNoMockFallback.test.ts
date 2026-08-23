import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('exams import integrity contract', () => {
  it('does not generate random grades when CSV input is invalid or empty', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    expect(source).toContain('ملف الاستيراد غير صالح أو لا يحتوي صفوفاً كافية');
    expect(source).toContain('لم يتم العثور على درجات صالحة قابلة للاستيراد');
    expect(source).not.toContain('Math.random() * (99 - 75 + 1)');
  });
});
