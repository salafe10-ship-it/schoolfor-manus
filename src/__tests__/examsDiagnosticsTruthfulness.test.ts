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

  it('uses canonical results and distinguishes a recorded absence from an unmarked grade', () => {
    expect(source).toContain('const canonicalResult = processedStudentsById.get(String(st.id))');
    expect(source).toContain("canonicalResult?.status === 'ناجح'");
    expect(source).toContain("canonicalResult?.failedSubjects.some(subject => subject.reason === 'absent') === true");
    expect(source).toContain("placeholder={isAbsent ? 'غياب' : 'بانتظار الرصد'}");
    expect(source).toContain("'راسب (بسبب الغياب)'");
    expect(source).toContain("'غير مكتمل ⏳'");
    expect(source).toContain("'بانتظار إعداد المواد'");
  });
});
