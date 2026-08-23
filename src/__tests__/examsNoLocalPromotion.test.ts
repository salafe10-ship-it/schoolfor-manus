import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('exams canonical empty-state contract', () => {
  it('does not promote browser/demo fixtures when the central exam store is empty', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    expect(source).toContain('لا يحتوي سجلات امتحانات بعد');
    expect(source).not.toContain('رفع ومزامنة البيانات المحلية كنسخة رئيسية');
  });
});
