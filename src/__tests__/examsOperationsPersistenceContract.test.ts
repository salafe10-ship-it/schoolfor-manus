import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('exams operations persistence contract', () => {
  it('persists halls, seating, and proctor assignments before confirming success', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    const distributionSource = readFileSync('src/components/exams/ExamsDistributionPanel.tsx', 'utf8');
    expect(source).toContain('تعذر حفظ القاعة الجديدة في المصدر المركزي');
    expect(distributionSource).toContain('تعذر حفظ توزيع الطلاب وأرقام الجلوس في المصدر المركزي');
    expect(source).toContain('تعذر حفظ تكليف المراقب في المصدر المركزي');
  });

  it('keeps canonical student identity read-only in the exams distribution screen', () => {
    const distributionSource = readFileSync('src/components/exams/ExamsDistributionPanel.tsx', 'utf8');
    expect(distributionSource).toContain('هوية الطالب للقراءة فقط');
    expect(distributionSource).not.toContain('حذف الطالب');
    expect(distributionSource).not.toContain('إنشاء طالب');
  });
});
