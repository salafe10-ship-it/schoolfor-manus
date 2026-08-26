import { describe, expect, it } from 'vitest';
import {
  applyExamRoundingPolicy,
  calculateCohortExamResults,
  calculateStudentExamResult
} from '../modules/exams/domain/ExamResultEngine';

const subjects = [
  { id: 'arabic', name: 'اللغة العربية', maxScore: 100, passScore: 50, isCore: true },
  { id: 'science', name: 'العلوم', maxScore: 50, passScore: 25 }
];

describe('canonical exam result engine', () => {
  it('applies every configured rounding policy deterministically', () => {
    expect(applyExamRoundingPolicy(79.26, 'التقريب لأقرب نصف درجة')).toBe(79.5);
    expect(applyExamRoundingPolicy(79.01, 'جبر الكسور لأقرب عدد صحيح')).toBe(80);
    expect(applyExamRoundingPolicy(79.99, 'إلغاء الكسور واحتساب العدد الصحيح الأدنى')).toBe(79);
  });

  it('does not rank or award a completed result to a student with a missing mark', () => {
    const result = calculateStudentExamResult(
      { id: 'student-1', absentSubjects: [] },
      subjects,
      { 'student-1': { arabic: 95 } },
      { passMarkPercent: 50, minFinalMarkPercent: 20 }
    );
    expect(result.status).toBe('incomplete');
    expect(result.incompleteSubjectsCount).toBe(1);
    expect(result.gradeSymbol).toBe('غير مكتمل');
    expect(result.rank).toBeNull();
  });

  it('treats absence as zero and as an explicit failed subject', () => {
    const result = calculateStudentExamResult(
      { id: 'student-1', absentSubjects: ['science'] },
      subjects,
      { 'student-1': { arabic: 80 } },
      { passMarkPercent: 50, minFinalMarkPercent: 20 }
    );
    expect(result.status).toBe('failed');
    expect(result.incompleteSubjectsCount).toBe(0);
    expect(result.failedSubjects).toEqual(expect.arrayContaining([
      expect.objectContaining({ subjectId: 'science', reason: 'absent', mark: 0 })
    ]));
  });

  it('enforces the global pass threshold and the minimum final-exam percentage', () => {
    const belowGlobal = calculateStudentExamResult(
      { id: 'student-1' },
      subjects,
      { 'student-1': { arabic: 60, science: 30 } },
      { passMarkPercent: 70, minFinalMarkPercent: 20, roundingPolicy: 'التقريب لأقرب نصف درجة' }
    );
    expect(belowGlobal.percentage).toBe(60);
    expect(belowGlobal.status).toBe('failed');

    const belowFinalMinimum = calculateStudentExamResult(
      { id: 'student-2' },
      [{ id: 'project', name: 'المشروع', maxScore: 100, passScore: 10 }],
      { 'student-2': { project: 15 } },
      { passMarkPercent: 10, minFinalMarkPercent: 20 }
    );
    expect(belowFinalMinimum.failedSubjects[0]?.reason).toBe('below_final_exam_minimum');
    expect(belowFinalMinimum.status).toBe('failed');
  });

  it('assigns deterministic competition ranks, including ties, and excludes incomplete students', () => {
    const results = calculateCohortExamResults(
      [
        { id: 'student-b' },
        { id: 'student-a' },
        { id: 'student-c' },
        { id: 'student-d' }
      ],
      subjects,
      {
        'student-a': { arabic: 90, science: 45 },
        'student-b': { arabic: 90, science: 45 },
        'student-c': { arabic: 80, science: 40 },
        'student-d': { arabic: 99 }
      },
      { passMarkPercent: 50, minFinalMarkPercent: 20 }
    );
    expect(results.map(result => [result.studentId, result.rank])).toEqual([
      ['student-a', 1],
      ['student-b', 1],
      ['student-c', 3],
      ['student-d', null]
    ]);
  });
});
