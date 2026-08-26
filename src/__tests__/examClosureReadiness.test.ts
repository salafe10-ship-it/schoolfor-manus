import { describe, expect, it } from 'vitest';
import { evaluateExamClosureReadiness } from '../modules/exams/domain/ExamClosureReadiness';

const readyInput = {
  students: [
    { id: 'student-1', name: 'طالب أول', hallId: 'hall-1', seatNumber: '1001', absentSubjects: [] },
    { id: 'student-2', name: 'طالب ثان', hallId: 'hall-1', seatNumber: '1002', absentSubjects: ['science'] }
  ],
  subjects: [
    { id: 'arabic', name: 'العربية' },
    { id: 'science', name: 'العلوم' }
  ],
  gradesMatrix: {
    'student-1': { arabic: 80, science: 90 },
    'student-2': { arabic: 75 }
  },
  scheduleApprovalStatus: { approved: true },
  reviewedSubjects: { arabic: true, 'middle-science': true },
  reEvaluationRequests: [{ status: 'completed' }]
};

describe('exam closure readiness gate', () => {
  it('accepts a fully reviewed, seated, graded, and scheduled cycle', () => {
    expect(evaluateExamClosureReadiness(readyInput)).toEqual(expect.objectContaining({
      ready: true,
      blockers: [],
      missingGradesCount: 0,
      unassignedStudentsCount: 0,
      duplicateSeatNumbersCount: 0,
      unreviewedSubjectsCount: 0,
      openAppealsCount: 0
    }));
  });

  it('treats documented absence as complete without inventing a mark', () => {
    const report = evaluateExamClosureReadiness(readyInput);
    expect(report.missingGradesCount).toBe(0);
  });

  it('returns every blocker instead of stopping at the first defect', () => {
    const report = evaluateExamClosureReadiness({
      students: [
        { id: 'student-1', hallId: '', seatNumber: '', absentSubjects: [] },
        { id: 'student-2', hallId: 'hall-1', seatNumber: '1001', absentSubjects: [] },
        { id: 'student-3', hallId: 'hall-2', seatNumber: '1001', absentSubjects: [] }
      ],
      subjects: [{ id: 'arabic' }, { id: 'science' }],
      gradesMatrix: { 'student-2': { arabic: 80 } },
      scheduleApprovalStatus: { approved: false },
      reviewedSubjects: { arabic: true },
      reEvaluationRequests: [{ status: 'pending' }]
    });

    expect(report.ready).toBe(false);
    expect(report.blockers.map(blocker => blocker.code)).toEqual(expect.arrayContaining([
      'schedule_not_approved',
      'student_assignment_incomplete',
      'duplicate_seat_number',
      'missing_grades',
      'subjects_not_reviewed',
      'open_appeals'
    ]));
    expect(report.missingGradesCount).toBe(5);
  });

  it('fails closed when the cycle has no students or subjects', () => {
    const report = evaluateExamClosureReadiness({
      students: [],
      subjects: [],
      gradesMatrix: {},
      scheduleApprovalStatus: { approved: true },
      reviewedSubjects: {},
      reEvaluationRequests: []
    });

    expect(report.ready).toBe(false);
    expect(report.blockers.map(blocker => blocker.code)).toEqual(expect.arrayContaining([
      'missing_students',
      'missing_subjects'
    ]));
  });
});
