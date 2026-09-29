import { describe, expect, it } from 'vitest';
import {
  assertTeacherWriteScope,
  canApproveExamOperation,
  canViewExamAudit,
  canViewFullExamDatabase,
  canWriteExamOperation,
  projectExamDatabaseForRead
} from '../modules/exams/application/ExamAuthorizationPolicy';

describe('exams authorization and read-scope policy', () => {
  it('allows only approval roles to approve or reopen the schedule and results', () => {
    expect(canApproveExamOperation('Admin', 'approve')).toBe(true);
    expect(canApproveExamOperation('SuperAdmin', 'approve')).toBe(true);
    expect(canApproveExamOperation('SchoolAdmin', 'approve_schedule')).toBe(true);
    expect(canApproveExamOperation('control', 'reopen')).toBe(true);
    expect(canApproveExamOperation('Teacher', 'approve')).toBe(false);
    expect(canApproveExamOperation('Parent', 'approve_schedule')).toBe(false);
    expect(canApproveExamOperation('Student', 'reopen_schedule')).toBe(false);
  });

  it('limits teacher writes to grades, appeals, and assessment workflow state', () => {
    expect(() => assertTeacherWriteScope(
      { exams_grades_matrix: { student: { subject: 80 } }, exams_settings: { semester: '2' } },
      { exams_grades_matrix: { student: { subject: 90 } }, exams_settings: { semester: '2' } }
    )).not.toThrow();

    expect(() => assertTeacherWriteScope(
      { exams_schedule: [], exams_settings: { semester: '2' } },
      { exams_schedule: [{ id: 'forbidden-edit' }], exams_settings: { semester: '2' } }
    )).toThrow(/exams_schedule/);
  });

  it('keeps online assessment lifecycle transitions server-owned for teachers', () => {
    const currentState = {
      questionBank: [],
      assessments: [],
      blueprints: [],
      lifecycles: [{ assessmentId: 'assessment-1', state: 'review', version: 2 }],
      attempts: [],
      objections: [],
      reports: [],
      auditEvents: []
    };

    expect(() => assertTeacherWriteScope(
      { exams_assessment_state: currentState },
      { exams_assessment_state: { ...currentState, lifecycles: [{ assessmentId: 'assessment-1', state: 'published', version: 3 }] } }
    )).toThrow(/تغيير دورة الامتحان الإلكتروني/);

    expect(() => assertTeacherWriteScope(
      { exams_assessment_state: currentState },
      { exams_assessment_state: { ...currentState, lifecycles: [{ assessmentId: 'assessment-2', state: 'published', version: 1 }] } }
    )).toThrow(/يجب أن يبدأ كمسودة/);

    expect(() => assertTeacherWriteScope(
      { exams_assessment_state: currentState },
      { exams_assessment_state: { ...currentState, lifecycles: [{ assessmentId: 'assessment-1', state: 'review', version: 2 }], questionBank: [{ id: 'question-1' }] } }
    )).not.toThrow();
  });

  it('uses server-derived permissions for full staff access without trusting a display role', () => {
    const staffPermissions = new Set(['Exam.Write']);
    expect(canWriteExamOperation('employee', staffPermissions)).toBe(true);
    expect(canViewFullExamDatabase('employee', staffPermissions)).toBe(false);
    expect(canViewExamAudit('employee', staffPermissions)).toBe(false);
    expect(canViewExamAudit('employee', new Set(['Audit.Read']))).toBe(true);
    expect(canViewFullExamDatabase('employee', new Set(['Audit.Read']))).toBe(false);
    expect(canViewFullExamDatabase('Teacher', new Set(['Exam.Write']))).toBe(false);
    expect(canWriteExamOperation('student', new Set(['Exam.View']))).toBe(false);
    expect(canViewFullExamDatabase('student', new Set(['Exam.View']))).toBe(false);
  });

  it('keeps audit events and the full control-room snapshot away from student-facing roles', () => {
    expect(canViewExamAudit('Teacher')).toBe(false);
    expect(canViewExamAudit('Parent')).toBe(false);
    expect(canViewFullExamDatabase('Student')).toBe(false);

    const projected = projectExamDatabaseForRead({
      exams_students_enriched: [{ id: 'student-1', name: 'طالب' }],
      exams_grades_matrix: { 'student-1': { arabic: 99 } },
      exams_assessment_state: {
        questionBank: [{ id: 'q1', version: 1, status: 'active', configuration: { options: [{ id: 'a', label: 'أ' }], correctOptionIds: ['a'] } }],
        assessments: [{ id: 'a1' }],
        blueprints: [{ id: 'b1', assessmentId: 'a1', questionRefs: [{ questionId: 'q1', version: 1 }] }],
        lifecycles: [{ assessmentId: 'a1', state: 'published' }],
        attempts: [{ id: 'attempt-1', candidateId: 'student-1' }],
        objections: [{ id: 'objection-1' }],
        reports: [{ id: 'report-1' }],
        auditEvents: [{ id: 'audit-1' }]
      }
    }, 'Parent');

    expect(projected.scope).toBe('restricted');
    expect(projected.data.exams_students_enriched).toBeUndefined();
    expect(projected.data.exams_grades_matrix).toBeUndefined();
    expect((projected.data.exams_assessment_state as any).attempts).toEqual([]);
    expect((projected.data.exams_assessment_state as any).auditEvents).toEqual([]);
    expect((projected.data.exams_assessment_state as any).questionBank[0].configuration.correctOptionIds).toBeUndefined();
  });

  it('projects teacher reads to their active employee scope, assigned class sections and subjects', () => {
    const projected = projectExamDatabaseForRead({
      exams_settings: { academicYear: '2026/2027', semester: 'الأول', secretConfig: 'hidden' },
      exams_subjects: [{ id: 'math', name: 'رياضيات', maxScore: 100 }, { id: 'science', name: 'علوم', maxScore: 100 }],
      exams_classes_list: [{ name: 'أولى متوسط', level: 'middle', sections: ['أ', 'ب'] }],
      exams_teacher_grade_scopes: [
        { id: 'scope-a', employeeId: 'employee-a', subjectId: 'math', classroom: 'أولى متوسط', section: 'أ' },
        { id: 'scope-b', employeeId: 'employee-a', subjectId: 'science', classroom: 'أولى متوسط', section: 'ب' }
      ],
      exams_students_enriched: [
        { id: 'student-a', name: 'أحمد', classroom: 'أولى متوسط', section: 'أ', nationalId: 'private-a', examAttendance: { math: 'present', science: 'absent' } },
        { id: 'student-b', name: 'بشير', classroom: 'أولى متوسط', section: 'ب', nationalId: 'private-b' }
      ],
      exams_grades_matrix: { 'student-a': { math: 80, science: 60 }, 'student-b': { math: 40, science: 90 } },
      exams_control_closures: [{ id: 'private-close' }]
    }, 'Teacher', ['Exam.Write'], 'employee-a');

    expect(projected.scope).toBe('grade_scoped');
    const projectedStudents = projected.data.exams_students_enriched as Array<Record<string, unknown>>;
    expect(projectedStudents).toEqual([
      expect.objectContaining({ id: 'student-a', name: 'أحمد', examAttendance: { math: 'present' } }),
      expect.objectContaining({ id: 'student-b', name: 'بشير' })
    ]);
    expect(projectedStudents[0]).not.toHaveProperty('nationalId');
    expect(projected.data.exams_grades_matrix).toEqual({ 'student-a': { math: 80 }, 'student-b': { science: 90 } });
    expect(projected.data.exams_subjects).toEqual([
      { id: 'math', name: 'رياضيات', maxScore: 100 },
      { id: 'science', name: 'علوم', maxScore: 100 }
    ]);
    expect((projected.data.exams_teacher_grade_scopes as any[])).toHaveLength(2);
    expect(projected.data.exams_settings).not.toHaveProperty('secretConfig');
    expect(projected.data.exams_control_closures).toBeUndefined();
  });

  it('returns the untouched full snapshot to exam staff', () => {
    const data = { exams_grades_matrix: { 'student-1': { arabic: 99 } } };
    expect(canViewExamAudit('Admin')).toBe(true);
    const projected = projectExamDatabaseForRead(data, 'Control');
    expect(projected.scope).toBe('full');
    expect(projected.data).toEqual(data);
    expect(projected.data).not.toBe(data);
  });
});
