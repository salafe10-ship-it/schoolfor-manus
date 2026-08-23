import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('exams schedule reopen persistence contract', () => {
  it('reopens the schedule only after central persistence', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    expect(source).toContain('تعذر حفظ إلغاء اعتماد الجدول في المصدر المركزي');
    expect(source).toContain('const nextApprovalStatus = { approved: false');
  });
});
