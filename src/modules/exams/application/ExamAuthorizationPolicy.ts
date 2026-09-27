import type { AssessmentWorkflowState } from './AssessmentWorkflowService';

export type ExamDatabaseOperation = 'write' | 'approve' | 'reopen' | 'approve_schedule' | 'reopen_schedule';
export type ExamReadScope = 'full' | 'restricted';

const normalizeRole = (role: unknown): string => String(role ?? '').trim().toLowerCase();
const normalizePermissions = (permissions: Iterable<unknown> | null | undefined): Set<string> => new Set(
  permissions ? Array.from(permissions, permission => String(permission ?? '').trim().toLowerCase()).filter(Boolean) : []
);

const APPROVAL_ROLES = new Set(['admin', 'superadmin', 'schooladmin', 'control']);
const STAFF_READ_ROLES = new Set(['admin', 'superadmin', 'schooladmin', 'control', 'teacher', 'auditor']);
const WRITE_ROLES = new Set(['admin', 'superadmin', 'schooladmin', 'control', 'teacher']);

const hasStaffPermission = (permissions: Iterable<unknown> | null | undefined): boolean => {
  const normalized = normalizePermissions(permissions);
  return normalized.has('*') || normalized.has('exam.write') || normalized.has('audit.read');
};

/**
 * The API uses this policy after trusted RBAC resolution. It is deliberately
 * independent from UI visibility so a forged client role cannot widen scope.
 */
export function canApproveExamOperation(role: unknown, operation: ExamDatabaseOperation): boolean {
  if (operation === 'write') return WRITE_ROLES.has(normalizeRole(role));
  return APPROVAL_ROLES.has(normalizeRole(role));
}

export function canWriteExamOperation(role: unknown, permissions?: Iterable<unknown> | null): boolean {
  return canApproveExamOperation(role, 'write') || normalizePermissions(permissions).has('*') || normalizePermissions(permissions).has('exam.write');
}

export function canViewFullExamDatabase(role: unknown, permissions?: Iterable<unknown> | null): boolean {
  return STAFF_READ_ROLES.has(normalizeRole(role)) || hasStaffPermission(permissions);
}

export function canViewExamAudit(role: unknown, permissions?: Iterable<unknown> | null): boolean {
  return STAFF_READ_ROLES.has(normalizeRole(role)) || hasStaffPermission(permissions);
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

  assertTeacherAssessmentStateScope(
    currentData.exams_assessment_state,
    requestedData.exams_assessment_state
  );
}

/**
 * The assessment state is stored as one versioned document, but a teacher is
 * not allowed to use that document boundary to approve, reopen, publish, or
 * delete an existing online assessment. The UI intentionally gives reviewers
 * access to question authoring, attempts, and marking, so those records remain
 * writable while lifecycle transitions stay server-owned.
 */
function assertTeacherAssessmentStateScope(currentRaw: unknown, requestedRaw: unknown): void {
  if (stableJson(currentRaw) === stableJson(requestedRaw)) return;

  const current = currentRaw && typeof currentRaw === 'object' && !Array.isArray(currentRaw)
    ? currentRaw as Record<string, unknown>
    : {};
  const requested = requestedRaw && typeof requestedRaw === 'object' && !Array.isArray(requestedRaw)
    ? requestedRaw as Record<string, unknown>
    : {};

  const preserveExistingIds = (field: string): void => {
    const currentItems = Array.isArray(current[field]) ? current[field] as Array<Record<string, unknown>> : [];
    const requestedItems = Array.isArray(requested[field]) ? requested[field] as Array<Record<string, unknown>> : [];
    const requestedIds = new Set(requestedItems.map(item => String(item?.id || '').trim()).filter(Boolean));
    const hasUnidentifiedCurrentItem = currentItems.some(item => !String(item?.id || '').trim());
    if (hasUnidentifiedCurrentItem && stableJson(currentItems) !== stableJson(requestedItems)) {
      throw new Error(`دور المعلم لا يملك صلاحية استبدال سجلات ${field} غير المعرفة بمعرفات ثابتة.`);
    }
    const missing = currentItems
      .map(item => String(item?.id || '').trim())
      .filter(id => id && !requestedIds.has(id));
    if (missing.length > 0) {
      throw new Error(`دور المعلم لا يملك صلاحية حذف سجلات ${field}: ${missing.join(', ')}.`);
    }
  };

  for (const field of ['questionBank', 'assessments', 'blueprints', 'attempts', 'objections', 'reports', 'auditEvents']) {
    preserveExistingIds(field);
  }

  const currentLifecycles = new Map<string, Record<string, unknown>>(
    (Array.isArray(current.lifecycles) ? current.lifecycles : [])
      .map(item => [
        String((item as Record<string, unknown>)?.assessmentId || '').trim(),
        item as Record<string, unknown>,
      ] as [string, Record<string, unknown>])
      .filter(([id]) => Boolean(id))
  );
  const requestedLifecycles = Array.isArray(requested.lifecycles)
    ? requested.lifecycles as Array<Record<string, unknown>>
    : [];
  const requestedLifecycleIds = new Set<string>();

  requestedLifecycles.forEach(lifecycle => {
    const assessmentId = String(lifecycle?.assessmentId || '').trim();
    if (!assessmentId) return;
    requestedLifecycleIds.add(assessmentId);
    const previous = currentLifecycles.get(assessmentId);
    if (!previous) {
      if (String(lifecycle.state || '') !== 'draft') {
        throw new Error('إنشاء دورة امتحان إلكتروني جديدة للمعلم يجب أن يبدأ كمسودة.');
      }
      return;
    }
    if (stableJson(previous) !== stableJson(lifecycle)) {
      throw new Error('تغيير دورة الامتحان الإلكتروني أو اعتمادها أو نشرها يتطلب مدير الامتحانات.');
    }
  });

  const deletedLifecycle = [...currentLifecycles.keys()].some(id => !requestedLifecycleIds.has(id));
  if (deletedLifecycle) {
    throw new Error('دور المعلم لا يملك صلاحية حذف دورة امتحان إلكتروني موجودة.');
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
  role: unknown,
  permissions?: Iterable<unknown> | null
): { data: Record<string, unknown>; scope: ExamReadScope } {
  if (canViewFullExamDatabase(role, permissions)) return { data: copy(data), scope: 'full' };

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
