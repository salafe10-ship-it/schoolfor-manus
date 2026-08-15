/**
 * Examination Domain - Enterprise Bounded Contexts
 */

export type ExamStatus = 'planned' | 'scheduled' | 'active' | 'completed' | 'moderated' | 'approved' | 'published' | 'archived';
export type AssessmentType = 'continuous' | 'homework' | 'assignment' | 'project' | 'practical' | 'oral' | 'midterm' | 'final' | 'behavior' | 'attendance';
export type ApprovalStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface BaseTenantEntity {
  tenantId: string;
  schoolId: string;
  branchId: string;
  academicYearId: string;
}

export interface ExamPlanning extends BaseTenantEntity {
  id: string;
  semesterId: string;
  subjectId: string;
  title: string;
  code: string;
  maxScore: number;
  passScore: number;
}

export interface ExamSchedule extends BaseTenantEntity {
  id: string;
  examPlanningId: string;
  startTime: string;
  endTime: string;
  venueId: string;
  proctorId: string;
}

export interface QuestionBank extends BaseTenantEntity {
  id: string;
  subjectId: string;
  topic: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'essay' | 'short_answer';
  marks: number;
}

export interface ExamSession extends BaseTenantEntity {
  id: string;
  examScheduleId: string;
  studentId: string;
  status: 'pending' | 'present' | 'absent' | 'finished';
  attendanceTime?: string;
  submissionTime?: string;
}

// Reconstructed Mark Interface
export interface Mark extends BaseTenantEntity {
  id: string;
  studentId: string;
  subjectId: string;
  assessmentType: AssessmentType;
  marksObtained: number;
  maxScore: number;
  teacherId: string;
  departmentId: string;
  semesterId: string;
  classId: string;
  status: ApprovalStatus;
  entryTimestamp: string;
  approvalTimestamp?: string;
  auditHistory: MarkAuditEntry[];
}

export interface MarkAuditEntry<T = unknown> {
  timestamp: string;
  userId: string;
  action: string;
  previousValue?: T;
  newValue?: T;
}

export interface Result extends BaseTenantEntity {
  id: string;
  studentId: string;
  semesterId: string;
  classId: string;
  totalMarks: number;
  percentage: number;
  grade: string;
  gpa: number;
  status: 'passed' | 'failed';
  calculationLog: CalculationStep[];
}

export interface CalculationStep {
  description: string;
  formula: string;
  value: number;
  timestamp: string;
}

export interface GradingScale extends BaseTenantEntity {
  id: string;
  minPercentage: number;
  maxPercentage: number;
  letterGrade: string;
  gpaPoint: number;
}

export interface AssessmentWeight {
  assessmentType: AssessmentType;
  weight: number; // 0 to 1
}

export interface Certificate extends BaseTenantEntity {
  id: string;
  studentId: string;
  resultId: string;
  issueDate: string;
  version: number;
  status: 'active' | 'revoked' | 'reissued';
  digitalSignature: string; // Simulated SHA-256 hash of record
  qrCodeData: string; // Data for verification
  metadata: Record<string, unknown>;
}

export type WorkflowState = 'planned' | 'scheduled' | 'hall_allocated' | 'invigilator_assigned' | 'attendance_collected' | 'marks_entered' | 'validated' | 'approved' | 'published' | 'appealed' | 'certified';

export interface WorkflowInstance extends BaseTenantEntity {
  id: string;
  examId: string;
  currentState: WorkflowState;
  history: WorkflowLog[];
}

export interface WorkflowLog {
  state: WorkflowState;
  timestamp: string;
  userId: string;
  action: string;
}

export type UserRole = 'admin' | 'teacher' | 'moderator' | 'auditor';

export interface SecurityLog extends BaseTenantEntity {
  id: string;
  timestamp: string;
  userId: string;
  role: UserRole;
  action: string;
  targetId: string;
  targetType: 'mark' | 'result' | 'exam';
  authorized: boolean;
  tamperDetected: boolean;
}

export interface StudentMarks extends BaseTenantEntity {
  id: string;
  examSessionId: string;
  marksObtained: number;
}
