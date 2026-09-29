import type { AssessmentWorkflowState } from './AssessmentWorkflowService';

export type ExamDatabaseOperation = 'write' | 'approve' | 'reopen' | 'approve_schedule' | 'reopen_schedule';
export type ExamReadScope = 'full' | 'restricted' | 'grade_scoped';

const normalizeRole = (role: unknown): string => String(role ?? '').trim().toLowerCase();
const normalizePermissions = (permissions: Iterable<unknown> | null | undefined): Set<string> => new Set(
  permissions ? Array.from(permissions, permission => String(permission ?? '').trim().toLowerCase()).filter(Boolean) : []
);

const APPROVAL_ROLES = new Set(['admin', 'superadmin', 'schooladmin', 'control']);
const STAFF_READ_ROLES = new Set(['admin', 'superadmin', 'schooladmin', 'control', 'auditor']);
const WRITE_ROLES = new Set(['admin', 'superadmin', 'schooladmin', 'control', 'teacher']);

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

export function canViewFullExamDatabase(role: unknown, _permissions?: Iterable<unknown> | null): boolean {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'teacher') return false;
  return STAFF_READ_ROLES.has(normalizedRole);
}

export function canViewExamAudit(role: unknown, permissions?: Iterable<unknown> | null): boolean {
  const normalizedRole = normalizeRole(role);
  const normalized = normalizePermissions(permissions);
  return APPROVAL_ROLES.has(normalizedRole) || normalizedRole === 'auditor' || normalized.has('*') || normalized.has('audit.read');
}

export function isExamGradeScopedUser(role: unknown, permissions?: Iterable<unknown> | null): boolean {
  const normalizedRole = normalizeRole(role);
  if (APPROVAL_ROLES.has(normalizedRole) || normalizedRole === 'auditor') return false;
  return normalizedRole === 'teacher' || normalizePermissions(permissions).has('exam.write');
}

const TEACHER_ALLOWED_FIELDS = new Set([
  'exams_grades_matrix',
  'exams_students_enriched',
  'exams_assessment_state'
]);

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
}

/**
 * Returns the fields a teacher is allowed to change in a scoped, partial
 * versioned-exam patch. Missing fields are intentionally unchanged.
 */
export function assertTeacherWriteScope(
  currentData: Record<string, unknown>,
  requestedData: Record<string, unknown>
): void {
  const changedFields = new Set<string>();
  Object.keys(requestedData).forEach(key => {
    if (stableJson(currentData[key]) !== stableJson(requestedData[key])) changedFields.add(key);
  });
  const unauthorized = [...changedFields].filter(field => !TEACHER_ALLOWED_FIELDS.has(field));
  if (unauthorized.length > 0) {
    throw new Error(`دور المعلم لا يملك صلاحية تعديل حقول الامتحان: ${unauthorized.join(', ')}.`);
  }

  if (Object.hasOwn(requestedData, 'exams_assessment_state')) {
    assertTeacherAssessmentStateScope(
      currentData.exams_assessment_state,
      requestedData.exams_assessment_state
    );
  }
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
  permissions?: Iterable<unknown> | null,
  employeeId?: unknown
): { data: Record<string, unknown>; scope: ExamReadScope } {
  if (canViewFullExamDatabase(role, permissions)) return { data: copy(data), scope: 'full' };

  if (isExamGradeScopedUser(role, permissions)) {
    const canonicalEmployeeId = String(employeeId ?? '').trim();
    const ownScopes = (Array.isArray(data.exams_teacher_grade_scopes) ? data.exams_teacher_grade_scopes : [])
      .filter((scope: any) => canonicalEmployeeId && String(scope?.employeeId ?? '').trim() === canonicalEmployeeId)
      .map((scope: any) => ({
        id: String(scope?.id ?? ''),
        employeeId: canonicalEmployeeId,
        subjectId: String(scope?.subjectId ?? ''),
        classroom: String(scope?.classroom ?? ''),
        section: String(scope?.section ?? '')
      }));
    const assignedSubjects = new Set(ownScopes.map((scope: any) => scope.subjectId));
    const assignedClasses = new Map<string, Set<string>>();
    const assignedSubjectsByClassSection = new Map<string, Set<string>>();
    ownScopes.forEach((scope: any) => {
      if (!assignedClasses.has(scope.classroom)) assignedClasses.set(scope.classroom, new Set());
      assignedClasses.get(scope.classroom)!.add(scope.section);
      const classSectionKey = `${scope.classroom}\u0000${scope.section}`;
      if (!assignedSubjectsByClassSection.has(classSectionKey)) assignedSubjectsByClassSection.set(classSectionKey, new Set());
      assignedSubjectsByClassSection.get(classSectionKey)!.add(scope.subjectId);
    });
    const sourceStudents = Array.isArray(data.exams_students_enriched) ? data.exams_students_enriched as Array<Record<string, any>> : [];
    const visibleStudents = sourceStudents
      .filter(student => assignedClasses.get(String(student.classroom ?? ''))?.has(String(student.section ?? '')))
      .map(student => {
        const studentAssignedSubjects = assignedSubjectsByClassSection.get(`${String(student.classroom ?? '')}\u0000${String(student.section ?? '')}`) || new Set<string>();
        const attendance = student.examAttendance && typeof student.examAttendance === 'object' && !Array.isArray(student.examAttendance)
          ? student.examAttendance as Record<string, unknown>
          : {};
        const scopedAttendance = Object.fromEntries(Object.entries(attendance).filter(([subjectId]) => studentAssignedSubjects.has(subjectId)));
        const safeStudent: Record<string, unknown> = {};
        for (const key of ['id', 'name', 'classroom', 'section', 'academicYear', 'status', 'studentCode', 'studentNumber', 'seatNumber', 'hallId']) {
          if (student[key] !== undefined) safeStudent[key] = copy(student[key]);
        }
        safeStudent.examAttendance = scopedAttendance;
        safeStudent.absentSubjects = Object.entries(scopedAttendance)
          .filter(([, status]) => status === 'absent')
          .map(([subjectId]) => subjectId);
        return safeStudent;
      });
    const visibleStudentIds = new Set(visibleStudents.map(student => String(student.id ?? '')));
    const visibleStudentById = new Map(visibleStudents.map(student => [String(student.id ?? ''), student]));
    const sourceGrades = data.exams_grades_matrix && typeof data.exams_grades_matrix === 'object' && !Array.isArray(data.exams_grades_matrix)
      ? data.exams_grades_matrix as Record<string, Record<string, unknown>>
      : {};
    const gradesMatrix: Record<string, Record<string, unknown>> = {};
    visibleStudentIds.forEach(studentId => {
      const grades = sourceGrades[studentId] && typeof sourceGrades[studentId] === 'object' ? sourceGrades[studentId] : {};
      const student = visibleStudentById.get(studentId);
      const studentAssignedSubjects = assignedSubjectsByClassSection.get(`${String(student?.classroom ?? '')}\u0000${String(student?.section ?? '')}`) || new Set<string>();
      const visibleGrades = Object.fromEntries(Object.entries(grades).filter(([subjectId]) => studentAssignedSubjects.has(subjectId)));
      if (Object.keys(visibleGrades).length) gradesMatrix[studentId] = copy(visibleGrades);
    });
    const subjects = (Array.isArray(data.exams_subjects) ? data.exams_subjects : [])
      .filter((subject: any) => assignedSubjects.has(String(subject?.id ?? '')))
      .map((subject: any) => {
        const safeSubject: Record<string, unknown> = {};
        for (const key of ['id', 'name', 'maxScore', 'passScore']) {
          if (subject[key] !== undefined) safeSubject[key] = copy(subject[key]);
        }
        return safeSubject;
      });
    const classes = (Array.isArray(data.exams_classes_list) ? data.exams_classes_list : [])
      .filter((classroom: any) => assignedClasses.has(String(classroom?.name ?? '')))
      .map((classroom: any) => ({
        name: String(classroom.name),
        ...(classroom.level === undefined ? {} : { level: copy(classroom.level) }),
        sections: [...(assignedClasses.get(String(classroom.name)) || [])]
      }));
    const sourceSettings = data.exams_settings && typeof data.exams_settings === 'object' && !Array.isArray(data.exams_settings)
      ? data.exams_settings as Record<string, unknown>
      : {};
    const settings: Record<string, unknown> = {};
    for (const key of ['academicYear', 'semester', 'examType', 'passPolicy', 'passMarkPercent', 'minFinalMarkPercent', 'roundingPolicy']) {
      if (sourceSettings[key] !== undefined) settings[key] = copy(sourceSettings[key]);
    }

    return {
      data: {
        exams_settings: settings,
        exams_subjects: subjects,
        exams_classes_list: classes,
        exams_students_enriched: visibleStudents,
        exams_grades_matrix: gradesMatrix,
        exams_teacher_grade_scopes: ownScopes
      },
      scope: 'grade_scoped'
    };
  }

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
