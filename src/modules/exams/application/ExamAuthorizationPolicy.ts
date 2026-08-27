import type { AssessmentWorkflowState } from './AssessmentWorkflowService';

export type ExamDatabaseOperation = 'write' | 'approve' | 'reopen' | 'approve_schedule' | 'reopen_schedule';
export type ExamReadScope = 'full' | 'restricted';

const normalizeRole = (role: unknown): string => String(role ?? '').trim().toLowerCase();

const APPROVAL_ROLES = new Set(['superadmin', 'schooladmin', 'control']);
const STAFF_READ_ROLES = new Set(['superadmin', 'schooladmin', 'control', 'teacher', 'auditor']);
const WRITE_ROLES = new Set(['superadmin', 'schooladmin', 'control', 'teacher']);

/**
 * The API uses this policy after trusted RBAC resolution. It is deliberately
 * independent from UI visibility so a forged client role cannot widen scope.
 */
export function canApproveExamOperation(role: unknown, operation: ExamDatabaseOperation): boolean {
  if (operation === 'write') return WRITE_ROLES.has(normalizeRole(role));
  return APPROVAL_ROLES.has(normalizeRole(role));
}

export function canViewFullExamDatabase(role: unknown): boolean {
  return STAFF_READ_ROLES.has(normalizeRole(role));
}

export function canViewExamAudit(role: unknown): boolean {
  return STAFF_READ_ROLES.has(normalizeRole(role));
}

const TEACHER_ALLOWED_FIELDS = new Set([
  'exams_grades_matrix',
  'exams_re_evaluation_requests',
  'exams_assessment_state'
]);

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
}

/**
 * Returns the fields a teacher is allowed to change in the versioned exam
 * document. Missing fields are treated as unchanged because the client sends
 * a complete snapshot on every optimistic-concurrency write.
 */
export function assertTeacherWriteScope(
  currentData: Record<string, unknown>,
  requestedData: Record<string, unknown>
): void {
  const changedFields = new Set<string>();
  const keys = new Set([...Object.keys(currentData), ...Object.keys(requestedData)]);
  keys.forEach(key => {
    if (stableJson(currentData[key]) !== stableJson(requestedData[key])) changedFields.add(key);
  });
  const unauthorized = [...changedFields].filter(field => !TEACHER_ALLOWED_FIELDS.has(field));
  if (unauthorized.length > 0) {
    throw new Error(`دور المعلم لا يملك صلاحية تعديل حقول الامتحان: ${unauthorized.join(', ')}.`);
  }
}

const copy = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

function publicQuestion(question: Record<string, unknown>): Record<string, unknown> {
  const configuration = question.configuration;
  if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) {
    return { ...question, configuration: {} };
  }
  const publicConfiguration = { ...(configuration as Record<string, unknown>) };
  delete publicConfiguration.correctOptionIds;
  delete publicConfiguration.correctAnswer;
  delete publicConfiguration.acceptedAnswers;
  delete publicConfiguration.tolerance;
  delete publicConfiguration.rubric;
  delete publicConfiguration.correctOrder;
  return { ...question, configuration: publicConfiguration };
}

/**
 * Removes academic results, other candidates, audit events, and answer keys
 * from the read response for student-facing roles. The caller still receives
 * the same tenant-scoped version, but never the staff control-room payload.
 */
export function projectExamDatabaseForRead(
  data: Record<string, unknown>,
  role: unknown
): { data: Record<string, unknown>; scope: ExamReadScope } {
  if (canViewFullExamDatabase(role)) return { data: copy(data), scope: 'full' };

  const rawState = data.exams_assessment_state;
  const state = rawState && typeof rawState === 'object' && !Array.isArray(rawState)
    ? rawState as Partial<AssessmentWorkflowState>
    : null;
  const publicAssessments = Array.isArray(state?.assessments)
    ? state.assessments.map(copy)
    : [];
  const publicAssessmentIds = new Set(publicAssessments.map(item => String((item as { id?: unknown }).id || '')));
  const publicLifecycles = Array.isArray(state?.lifecycles)
    ? state.lifecycles.filter(item => ['open', 'closed', 'marking', 'results_approved', 'published'].includes(String(item?.state))).map(copy)
    : [];
  const allowedAssessmentIds = new Set(publicLifecycles.map(item => String((item as { assessmentId?: unknown }).assessmentId || '')));
  const publicBlueprints = Array.isArray(state?.blueprints)
    ? state.blueprints
      .filter(item => allowedAssessmentIds.has(String((item as { assessmentId?: unknown }).assessmentId || '')))
      .map(copy)
    : [];
  const publicQuestionVersions = new Set(
    publicBlueprints.flatMap(item => Array.isArray(item?.questionRefs)
      ? item.questionRefs.map(reference => `${String(reference?.questionId || '')}@${String(reference?.version || '')}`)
      : [])
  );
  const questionBank = Array.isArray(state?.questionBank)
    ? state.questionBank
      .filter(item => item?.status === 'active' && publicQuestionVersions.has(`${String(item.id || '')}@${String(item.version || '')}`))
      .map(item => publicQuestion(copy(item) as unknown as Record<string, unknown>))
    : [];
  const questionIds = new Set(questionBank.map(item => String(item.id || '')));

  const publicState: Record<string, unknown> = {
    questionBank,
    assessments: publicAssessments.filter(item => allowedAssessmentIds.has(String((item as { id?: unknown }).id || '')) && publicAssessmentIds.has(String((item as { id?: unknown }).id || ''))),
    blueprints: publicBlueprints.map(item => ({
      ...item,
      questionRefs: Array.isArray(item?.questionRefs)
        ? item.questionRefs.filter(reference => questionIds.has(String(reference?.questionId || ''))).map(copy)
        : []
    })),
    lifecycles: publicLifecycles,
    attempts: [],
    objections: [],
    reports: [],
    auditEvents: []
  };

  return {
    data: {
      exams_settings: data.exams_settings && typeof data.exams_settings === 'object' ? copy(data.exams_settings) : {},
      exams_subjects: Array.isArray(data.exams_subjects) ? copy(data.exams_subjects) : [],
      exams_schedule: Array.isArray(data.exams_schedule) ? copy(data.exams_schedule) : [],
      exams_assessment_state: publicState
    },
    scope: 'restricted'
  };
}
