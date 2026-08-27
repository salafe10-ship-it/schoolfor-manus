import { describe, expect, it } from 'vitest';
import {
  assertTeacherWriteScope,
  canApproveExamOperation,
  canViewExamAudit,
  canViewFullExamDatabase,
  projectExamDatabaseForRead
} from '../modules/exams/application/ExamAuthorizationPolicy';

describe('exams authorization and read-scope policy', () => {
  it('allows only approval roles to approve or reopen the schedule and results', () => {
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

  it('keeps audit events and the full control-room snapshot away from student-facing roles', () => {
    expect(canViewExamAudit('Teacher')).toBe(true);
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

  it('returns the untouched full snapshot to exam staff', () => {
    const data = { exams_grades_matrix: { 'student-1': { arabic: 99 } } };
    const projected = projectExamDatabaseForRead(data, 'Control');
    expect(projected.scope).toBe('full');
    expect(projected.data).toEqual(data);
    expect(projected.data).not.toBe(data);
  });
});
