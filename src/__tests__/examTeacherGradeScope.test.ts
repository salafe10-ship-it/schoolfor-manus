import { describe, expect, it } from 'vitest';
import {
  assertTeacherStudentAttendanceScope,
  assertTeacherGradeMatrixScope,
  hasExamStudentAttendanceChanges,
  hasExamGradeMatrixChanges,
  buildTeacherGradeHistoryEntries,
  mergeTeacherGradeMatrixPatch,
  mergeTeacherStudentAttendancePatch,
  validateTeacherGradeScopes
} from '../modules/exams/application/ExamTeacherGradeScope';

const current = {
  exams_students_enriched: [
    { id: 'student-a', classroom: 'أولى متوسط', section: 'أ' },
    { id: 'student-b', classroom: 'أولى متوسط', section: 'ب' }
  ],
  exams_teacher_grade_scopes: [
    { id: 'scope-1', employeeId: 'employee-1', subjectId: 'math', classroom: 'أولى متوسط', section: 'أ' }
  ],
  exams_subjects: [{ id: 'math', name: 'الرياضيات' }],
  exams_grades_matrix: { 'student-a': { math: 70 }, 'student-b': { math: 80 } }
};

describe('teacher exam grade scopes', () => {
  it('detects changed cells and distinguishes an explicit null from an omitted cell', () => {
    expect(hasExamGradeMatrixChanges(current, current)).toBe(false);
    expect(hasExamGradeMatrixChanges(current, {
      ...current,
      exams_grades_matrix: { ...current.exams_grades_matrix, 'student-a': { math: null } }
    })).toBe(true);
  });

  it('allows only a changed grade belonging to the teacher assigned to its exact class section and subject', () => {
    expect(() => assertTeacherGradeMatrixScope(
      current,
      { ...current, exams_grades_matrix: { ...current.exams_grades_matrix, 'student-a': { math: 75 } } },
      'employee-1'
    )).not.toThrow();
  });

  it('merges partial grade writes and preserves all omitted students and subjects', () => {
    const merged = mergeTeacherGradeMatrixPatch(current, {
      exams_grades_matrix: { 'student-a': { math: 75 } }
    });
    expect(merged).toEqual({ 'student-a': { math: 75 }, 'student-b': { math: 80 } });
    expect(mergeTeacherGradeMatrixPatch(current, {
      exams_grades_matrix: { 'student-a': { math: null } }
    })).toEqual({ 'student-b': { math: 80 } });
  });

  it('creates trusted, cell-level grade history for a scoped teacher patch only', () => {
    let nextId = 0;
    const entries = buildTeacherGradeHistoryEntries(current, {
      exams_grades_matrix: { 'student-a': { math: 75 } }
    }, { employeeId: 'employee-1', name: 'المعلمة الموثقة' }, {
      timestamp: '2026-09-28T10:00:00.000Z',
      createId: () => `history-${++nextId}`
    });

    expect(entries).toEqual([{
      id: 'history-1',
      studentName: 'student-a',
      classroom: 'أولى متوسط',
      subjectName: 'الرياضيات',
      oldGrade: 70,
      newGrade: 75,
      modifiedBy: 'المعلمة الموثقة',
      employeeId: 'employee-1',
      reason: 'تعديل رصد الدرجة ضمن نطاق تصحيح موثق',
      source: 'teacher_scoped_entry',
      timestamp: '2026-09-28T10:00:00.000Z'
    }]);
  });

  it('does not emit false grade history for unchanged cells or tombstones of empty grades', () => {
    expect(buildTeacherGradeHistoryEntries(current, {
      exams_grades_matrix: { 'student-a': { math: 70 }, 'student-c': { math: null } }
    }, { employeeId: 'employee-1', name: 'موظف' }, {
      timestamp: '2026-09-28T10:00:00.000Z', createId: () => 'unused'
    })).toEqual([]);
  });

  it('records clearing a real grade as a transition to an unrecorded value', () => {
    const entries = buildTeacherGradeHistoryEntries(current, {
      exams_grades_matrix: { 'student-a': { math: null } }
    }, { employeeId: 'employee-1', name: 'موظف' }, {
      timestamp: '2026-09-28T10:00:00.000Z', createId: () => 'history-clear'
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ oldGrade: 70, newGrade: null, source: 'teacher_scoped_entry' });
  });

  it('allows attendance patches only for assigned exam cells and preserves unrelated attendance', () => {
    const withAttendance = {
      ...current,
      exams_students_enriched: [
        { id: 'student-a', classroom: 'أولى متوسط', section: 'أ', examAttendance: { math: 'present', science: 'absent' }, absentSubjects: ['science'] },
        current.exams_students_enriched[1]
      ]
    };
    const patch = { exams_students_enriched: [{ id: 'student-a', examAttendance: { math: 'absent' } }] };
    expect(hasExamStudentAttendanceChanges(withAttendance, patch)).toBe(true);
    expect(() => assertTeacherStudentAttendanceScope(withAttendance, patch, 'employee-1')).not.toThrow();
    expect(mergeTeacherStudentAttendancePatch(withAttendance, patch)[0]).toMatchObject({
      examAttendance: { math: 'absent', science: 'absent' },
      absentSubjects: ['math', 'science']
    });
    expect(() => assertTeacherStudentAttendanceScope(withAttendance, {
      exams_students_enriched: [{ id: 'student-b', examAttendance: { math: 'absent' } }]
    }, 'employee-1')).toThrow(/نطاق حضور موثق/);
    expect(() => assertTeacherStudentAttendanceScope(withAttendance, {
      exams_students_enriched: [{ id: 'student-a', examAttendance: { science: 'present' } }]
    }, 'employee-1')).toThrow(/نطاق حضور موثق/);
    expect(() => assertTeacherStudentAttendanceScope(withAttendance, {
      exams_students_enriched: [{ id: 'student-a', classroom: 'ثانية متوسط', examAttendance: { math: 'present' } }]
    }, 'employee-1')).toThrow(/بيانات الطالب أو توزيعه/);
  });

  it('denies cross-section, cross-subject, unidentified-employee and unassigned grade edits', () => {
    const edit = (studentId: string, subjectId: string) => ({
      ...current,
      exams_grades_matrix: {
        ...current.exams_grades_matrix,
        [studentId]: { ...current.exams_grades_matrix[studentId], [subjectId]: 95 }
      }
    });
    expect(() => assertTeacherGradeMatrixScope(current, edit('student-b', 'math'), 'employee-1')).toThrow(/نطاق تصحيح موثق/);
    expect(() => assertTeacherGradeMatrixScope(current, edit('student-a', 'science'), 'employee-1')).toThrow(/نطاق تصحيح موثق/);
    expect(() => assertTeacherGradeMatrixScope(current, edit('student-a', 'math'), '')).toThrow(/نطاق تصحيح موثق/);
  });

  it('validates manager-authored scopes against active staff, current subjects and class sections', () => {
    const scopes = [{ id: 'scope-1', employeeId: 'employee-1', subjectId: 'math', classroom: 'أولى متوسط', section: 'أ' }];
    expect(() => validateTeacherGradeScopes(scopes, ['employee-1'], ['math'], [{ name: 'أولى متوسط', sections: ['أ', 'ب'] }])).not.toThrow();
    expect(() => validateTeacherGradeScopes(scopes, [], ['math'], [{ name: 'أولى متوسط', sections: ['أ'] }])).toThrow(/غير نشط/);
    expect(() => validateTeacherGradeScopes(scopes, ['employee-1'], ['science'], [{ name: 'أولى متوسط', sections: ['أ'] }])).toThrow(/غير موجودة/);
    expect(() => validateTeacherGradeScopes(scopes, ['employee-1'], ['math'], [{ name: 'أولى متوسط', sections: ['ب'] }])).toThrow(/الصف أو الشعبة/);
  });
});
