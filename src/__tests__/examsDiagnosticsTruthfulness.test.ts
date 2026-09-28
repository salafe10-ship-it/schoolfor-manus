import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');

describe('exams diagnostics truthfulness contract', () => {
  it('does not report 100% success when diagnostics contain warnings', () => {
    expect(source).toContain('const allChecksPassed = areExamReadinessChecksPassing(finalResults)');
    expect(source).toContain('includeCentralSourceCheck');
    expect(source).toContain('توجد تنبيهات تمنع اعتبار الجاهزية مكتملة');
    expect(source).not.toContain('جاهز للإغلاق');
    expect(source).not.toContain('بنجاح وبنسبة 100%');
  });

  it('does not label an empty schedule as conflict-free or balanced', () => {
    expect(source).toContain('لا يوجد جدول لفحصه');
    expect(source).toContain('لا يمكن التحقق من التعارضات قبل ذلك.');
    expect(source).toContain('لا يوجد جدول مكتمل لفحص التباعد');
  });

  it('uses the result engine rank and leaves incomplete students unranked', () => {
    expect(source).toContain('rank: result.rank');
    expect(source).toContain('st.rank === null');
    expect(source).toContain('غير مصنف — النتيجة غير مكتملة');
    expect(source).not.toContain('{idx + 1 === 1 ?');
  });

  it('does not classify students when the exam has no configured subjects', () => {
    expect(source).toContain('let hasUnfinishedGrade = subjects.length === 0');
    expect(source).toContain("if (totalPossibleMax <= 0) {");
    expect(source).toContain("gradeLabel = 'بانتظار إعداد المواد'");
    expect(source).toContain("resultText = 'غير مكتمل ⏳'");
  });
});
