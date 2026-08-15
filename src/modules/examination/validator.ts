import { ExamPlanning, ExamSession, StudentMarks } from './types';

export interface IntegrityIssue {
  type: 'orphan' | 'invalid_score' | 'missing_proctor' | 'inconsistent_attendance';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export class ExaminationValidator {
  static validate(planning: ExamPlanning[], sessions: ExamSession[], marks: StudentMarks[]): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];

    // Check for orphan marks (marks without a valid session)
    marks.forEach(mark => {
      const session = sessions.find(s => s.id === mark.examSessionId);
      if (!session) {
        issues.push({
          type: 'orphan',
          message: `Orphan mark found: ${mark.id} has no valid exam session.`,
          severity: 'high'
        });
      }
    });

    // Check for marks exceeding max score
    marks.forEach(mark => {
      const session = sessions.find(s => s.id === mark.examSessionId);
      if (session) {
        const exam = planning.find(e => e.id === session.examScheduleId); // Simplified relationship
        if (exam && mark.marksObtained > exam.maxScore) {
          issues.push({
            type: 'invalid_score',
            message: `Invalid mark in session ${session.id}: ${mark.marksObtained} exceeds max score ${exam.maxScore}`,
            severity: 'high'
          });
        }
      }
    });

    return issues;
  }
}
