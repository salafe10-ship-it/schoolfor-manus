import { describe, expect, it } from 'vitest';
import { getExamAttendanceStatus, normalizeExamAttendance, withExamAttendance } from '../modules/exams/domain/ExamAttendance';

describe('exam attendance records', () => {
  it('does not infer presence when attendance has not been recorded', () => {
    const student = normalizeExamAttendance({ id: 'student-1', absentSubjects: [] });
    expect(getExamAttendanceStatus(student, 'arabic')).toBeNull();
  });

  it('preserves legacy documented absences without treating legacy grades as presence', () => {
    const student = normalizeExamAttendance({ id: 'student-1', absentSubjects: ['science'] });
    expect(student.examAttendance.science).toBe('absent');
    expect(getExamAttendanceStatus(student, 'science')).toBe('absent');
    expect(getExamAttendanceStatus(student, 'arabic')).toBeNull();
  });

  it('keeps the explicit attendance map and the legacy absence index consistent', () => {
    const absentStudent = withExamAttendance({ id: 'student-1', absentSubjects: [] }, 'science', 'absent');
    expect(absentStudent.examAttendance.science).toBe('absent');
    expect(absentStudent.absentSubjects).toEqual(['science']);

    const presentStudent = withExamAttendance(absentStudent, 'science', 'present');
    expect(presentStudent.examAttendance.science).toBe('present');
    expect(presentStudent.absentSubjects).toEqual([]);

    const cleared = withExamAttendance(presentStudent, 'science', null);
    expect(cleared.examAttendance.science).toBeUndefined();
    expect(getExamAttendanceStatus(cleared, 'science')).toBeNull();
  });
});
