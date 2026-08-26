import {
  AssessmentAttemptRecord,
  AssessmentBlueprint,
  AssessmentDomainValidationError,
  AssessmentLifecycle,
  AssessmentQuestionBankItem,
  AssessmentQuestionType,
  AssessmentReportGenerationRecord,
  AssessmentResponseMark,
  AssessmentObjectionRecord,
  AssessmentLifecycleState,
  AssessmentLifecycleTransitionCommand,
  BloomLevel,
  DokLevel,
  QuestionDifficulty,
  createAssessmentLifecycle,
  evaluateAssessmentPublicationReadiness,
  transitionAssessmentLifecycle,
  validateAssessmentBlueprint,
  validateAssessmentLifecycle,
  validateQuestionBank,
  validateQuestionBankItem
} from '../domain/AssessmentLifecycleEngine';

/**
 * The online-assessment slice is deliberately persisted as one versioned
 * document with the canonical exams record. This keeps autosave/resume and
 * publication gates in the same optimistic-concurrency boundary as the
 * existing control-room results workflow.
 */
export interface AssessmentRecord {
  id: string;
  title: string;
  durationMinutes: number;
  createdBy: string;
  createdAt: string;
  blueprintId: string;
}

export interface AssessmentAuditEvent {
  id: string;
  occurredAt: string;
  actorId: string;
  action: string;
  entityType: 'question' | 'assessment' | 'attempt' | 'publication';
  entityId: string;
  details?: Record<string, unknown>;
}

export interface AssessmentWorkflowState {
  questionBank: AssessmentQuestionBankItem[];
  assessments: AssessmentRecord[];
  blueprints: AssessmentBlueprint[];
  lifecycles: AssessmentLifecycle[];
  attempts: AssessmentAttemptRecord[];
  objections: AssessmentObjectionRecord[];
  reports: AssessmentReportGenerationRecord[];
  auditEvents: AssessmentAuditEvent[];
}

export interface CreateQuestionInput {
  id?: string;
  bankId?: string;
  ownerId: string;
  type: AssessmentQuestionType;
  prompt: string;
  points: number;
  classification: {
    subjectId: string;
    gradeId: string;
    standardId: string;
    bloomLevel: BloomLevel;
    dokLevel: DokLevel;
    difficulty: QuestionDifficulty;
    language: string;
  };
  configuration: AssessmentQuestionBankItem['configuration'];
}

export interface CreateAssessmentInput {
  id?: string;
  title: string;
  durationMinutes: number;
  actorId: string;
  questionRefs: { questionId: string; version: number }[];
  createdAt?: string;
}

export interface AssessmentPublicationGateError {
  blockers: ReturnType<typeof evaluateAssessmentPublicationReadiness>['blockers'];
}

export class AssessmentWorkflowError extends Error {
  readonly blockers?: AssessmentPublicationGateError['blockers'];

  constructor(message: string, blockers?: AssessmentPublicationGateError['blockers']) {
    super(message);
    this.name = 'AssessmentWorkflowError';
    this.blockers = blockers;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const copy = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

const makeId = (prefix: string): string => {
  const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${uuid}`;
};

const now = (): string => new Date().toISOString();

const addAudit = (
  state: AssessmentWorkflowState,
  actorId: string,
  action: string,
  entityType: AssessmentAuditEvent['entityType'],
  entityId: string,
  details?: Record<string, unknown>
): AssessmentWorkflowState => ({
  ...state,
  auditEvents: [
    {
      id: makeId('audit'),
      occurredAt: now(),
      actorId,
      action,
      entityType,
      entityId,
      details
    },
    ...state.auditEvents
  ]
});

export const createEmptyAssessmentWorkflowState = (): AssessmentWorkflowState => ({
  questionBank: [],
  assessments: [],
  blueprints: [],
  lifecycles: [],
  attempts: [],
  objections: [],
  reports: [],
  auditEvents: []
});

export function validateAssessmentWorkflowState(value: unknown): AssessmentWorkflowState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AssessmentWorkflowError('بيانات الامتحان الإلكتروني غير صالحة.');
  }
  const candidate = value as Partial<AssessmentWorkflowState>;
  const questionBank = validateQuestionBank(Array.isArray(candidate.questionBank) ? candidate.questionBank : []);
  const assessments = Array.isArray(candidate.assessments) ? candidate.assessments : [];
  const blueprints = Array.isArray(candidate.blueprints) ? candidate.blueprints : [];
  const lifecycles = Array.isArray(candidate.lifecycles) ? candidate.lifecycles : [];
  const attempts = Array.isArray(candidate.attempts) ? candidate.attempts : [];
  const objections = Array.isArray(candidate.objections) ? candidate.objections : [];
  const reports = Array.isArray(candidate.reports) ? candidate.reports : [];
  const auditEvents = Array.isArray(candidate.auditEvents) ? candidate.auditEvents : [];

  const unique = (items: Array<{ id?: unknown }>, label: string) => {
    const ids = new Set<string>();
    items.forEach((item, index) => {
      const id = String(item?.id || '').trim();
      if (!id || ids.has(id)) throw new AssessmentWorkflowError(`${label}: معرف مفقود أو مكرر في السجل ${index + 1}.`);
      ids.add(id);
    });
  };
  unique(assessments, 'الامتحانات الإلكترونية');
  unique(blueprints, 'نماذج الامتحانات');
  const lifecycleIds = new Set<string>();
  lifecycles.forEach((lifecycle, index) => {
    const id = String(lifecycle?.assessmentId || '').trim();
    if (!id || lifecycleIds.has(id)) throw new AssessmentWorkflowError(`دورات الامتحانات: معرف مفقود أو مكرر في السجل ${index + 1}.`);
    lifecycleIds.add(id);
  });
  unique(attempts, 'المحاولات');

  assessments.forEach(item => {
    if (!item || typeof item !== 'object' || !String(item.title || '').trim() || !String(item.blueprintId || '').trim()) {
      throw new AssessmentWorkflowError('كل امتحان إلكتروني يحتاج عنواناً ونموذجاً صالحاً.');
    }
    if (!Number.isSafeInteger(Number(item.durationMinutes)) || Number(item.durationMinutes) <= 0) {
      throw new AssessmentWorkflowError('مدة الامتحان الإلكتروني يجب أن تكون عدداً صحيحاً موجباً.');
    }
  });
  blueprints.forEach(blueprint => validateAssessmentBlueprint(blueprint, questionBank));
  lifecycles.forEach(lifecycle => validateAssessmentLifecycle(lifecycle));

  return {
    questionBank,
    assessments: copy(assessments) as AssessmentRecord[],
    blueprints: copy(blueprints) as AssessmentBlueprint[],
    lifecycles: copy(lifecycles) as AssessmentLifecycle[],
    attempts: copy(attempts) as AssessmentAttemptRecord[],
    objections: copy(objections) as AssessmentObjectionRecord[],
    reports: copy(reports) as AssessmentReportGenerationRecord[],
    auditEvents: copy(auditEvents) as AssessmentAuditEvent[]
  };
}

export function normalizeAssessmentWorkflowState(value: unknown): AssessmentWorkflowState {
  if (value === undefined || value === null) return createEmptyAssessmentWorkflowState();
  return validateAssessmentWorkflowState(value);
}

export function createQuestionDraft(
  state: AssessmentWorkflowState,
  input: CreateQuestionInput,
  actorId = input.ownerId
): AssessmentWorkflowState {
  const question = validateQuestionBankItem({
    ...copy(input),
    id: input.id || makeId('question'),
    bankId: input.bankId || makeId('bank'),
    version: 1,
    status: 'draft'
  });
  if (state.questionBank.some(item => item.id === question.id && item.version === question.version)) {
    throw new AssessmentWorkflowError('إصدار السؤال موجود بالفعل ولا يمكن استبداله.');
  }
  return addAudit(
    { ...state, questionBank: [...state.questionBank, copy(question)] },
    actorId,
    'question.created',
    'question',
    question.id,
    { version: question.version }
  );
}

export function cloneQuestionVersion(
  state: AssessmentWorkflowState,
  questionId: string,
  version: number,
  actorId: string
): AssessmentWorkflowState {
  const source = state.questionBank.find(item => item.id === questionId && item.version === version);
  if (!source) throw new AssessmentWorkflowError('إصدار السؤال المطلوب نسخه غير موجود.');
  const nextVersion = Math.max(...state.questionBank.filter(item => item.id === questionId).map(item => item.version), 0) + 1;
  const cloned = validateQuestionBankItem({ ...copy(source), version: nextVersion, status: 'draft' });
  return addAudit(
    { ...state, questionBank: [...state.questionBank, copy(cloned)] },
    actorId,
    'question.version_cloned',
    'question',
    questionId,
    { fromVersion: version, version: nextVersion }
  );
}

export function updateQuestionDraft(
  state: AssessmentWorkflowState,
  questionId: string,
  version: number,
  patch: Record<string, unknown>,
  actorId: string
): AssessmentWorkflowState {
  const index = state.questionBank.findIndex(item => item.id === questionId && item.version === version);
  if (index < 0) throw new AssessmentWorkflowError('إصدار السؤال المطلوب تعديله غير موجود.');
  const source = state.questionBank[index];
  if (source.status !== 'draft') throw new AssessmentWorkflowError('لا يمكن تعديل سؤال مُفعّل أو مؤرشف؛ أنشئ إصداراً جديداً.');
  const next = validateQuestionBankItem({ ...copy(source), ...copy(patch), id: questionId, version, status: 'draft' });
  const questionBank = [...state.questionBank];
  questionBank[index] = copy(next);
  return addAudit({ ...state, questionBank }, actorId, 'question.updated', 'question', questionId, { version });
}

export function setQuestionStatus(
  state: AssessmentWorkflowState,
  questionId: string,
  version: number,
  status: 'active' | 'archived',
  actorId: string
): AssessmentWorkflowState {
  const index = state.questionBank.findIndex(item => item.id === questionId && item.version === version);
  if (index < 0) throw new AssessmentWorkflowError('إصدار السؤال المطلوب غير موجود.');
  const source = state.questionBank[index];
  const next = validateQuestionBankItem({ ...copy(source), status });
  const questionBank = state.questionBank.map((item, itemIndex) => {
    if (status === 'active' && itemIndex !== index && item.id === questionId && item.status === 'active') {
      return { ...item, status: 'archived' as const };
    }
    return itemIndex === index ? next : item;
  });
  return addAudit({ ...state, questionBank }, actorId, `question.${status}`, 'question', questionId, {
    version,
    archivedPreviousActiveVersion: status === 'active'
  });
}

const blueprintDistribution = (questions: AssessmentQuestionBankItem[]) => {
  const groups = new Map<string, { points: number; questionCount: number }>();
  questions.forEach(question => {
    const current = groups.get(question.type) || { points: 0, questionCount: 0 };
    current.points += question.points;
    current.questionCount += 1;
    groups.set(question.type, current);
  });
  return [...groups.entries()].map(([value, target]) => ({ dimension: 'questionType' as const, value, ...target }));
};

export function createAssessment(
  state: AssessmentWorkflowState,
  input: CreateAssessmentInput
): AssessmentWorkflowState {
  if (!String(input.title || '').trim()) throw new AssessmentWorkflowError('عنوان الامتحان الإلكتروني مطلوب.');
  if (!Number.isSafeInteger(input.durationMinutes) || input.durationMinutes <= 0) throw new AssessmentWorkflowError('مدة الامتحان الإلكتروني غير صالحة.');
  if (state.assessments.some(item => item.id === input.id)) throw new AssessmentWorkflowError('معرف الامتحان الإلكتروني موجود بالفعل.');
  const selected = input.questionRefs.map(ref => {
    const question = state.questionBank.find(item => item.id === ref.questionId && item.version === ref.version && item.status === 'active');
    if (!question) throw new AssessmentWorkflowError(`السؤال ${ref.questionId}@${ref.version} غير مفعّل أو غير موجود.`);
    return question;
  });
  if (selected.length === 0) throw new AssessmentWorkflowError('يجب اختيار سؤال مفعّل واحداً على الأقل.');
  const assessmentId = input.id || makeId('assessment');
  const blueprintId = makeId('blueprint');
  const blueprint: AssessmentBlueprint = {
    id: blueprintId,
    assessmentId,
    totalPoints: selected.reduce((sum, question) => sum + question.points, 0),
    questionRefs: copy(input.questionRefs),
    distribution: blueprintDistribution(selected)
  };
  validateAssessmentBlueprint(blueprint, state.questionBank);
  const createdAt = input.createdAt || now();
  const assessment: AssessmentRecord = {
    id: assessmentId,
    title: input.title.trim(),
    durationMinutes: input.durationMinutes,
    createdBy: input.actorId.trim(),
    createdAt,
    blueprintId
  };
  const lifecycle = createAssessmentLifecycle(assessmentId, input.actorId, createdAt);
  const next = {
    ...state,
    assessments: [...state.assessments, assessment],
    blueprints: [...state.blueprints, blueprint],
    lifecycles: [...state.lifecycles, lifecycle]
  };
  return addAudit(next, input.actorId, 'assessment.created', 'assessment', assessmentId, { questionCount: selected.length });
}

const getContext = (state: AssessmentWorkflowState, assessmentId: string) => {
  const assessment = state.assessments.find(item => item.id === assessmentId);
  const blueprint = state.blueprints.find(item => item.assessmentId === assessmentId);
  const lifecycle = state.lifecycles.find(item => item.assessmentId === assessmentId);
  if (!assessment || !blueprint || !lifecycle) throw new AssessmentWorkflowError('بيانات الامتحان الإلكتروني غير مكتملة.');
  return { assessment, blueprint, lifecycle };
};

const gate = (state: AssessmentWorkflowState, assessmentId: string, lifecycleState: AssessmentLifecycleState) => {
  const { blueprint } = getContext(state, assessmentId);
  return evaluateAssessmentPublicationReadiness({
    lifecycleState,
    blueprint,
    questionBank: state.questionBank,
    attempts: state.attempts.filter(attempt => attempt.assessmentId === assessmentId),
    objections: state.objections.filter(objection => state.attempts.some(attempt => attempt.id === objection.attemptId && attempt.assessmentId === assessmentId)),
    reports: state.reports
  });
};

export function transitionAssessment(
  state: AssessmentWorkflowState,
  assessmentId: string,
  to: AssessmentLifecycleState,
  actorId: string,
  reason: string
): AssessmentWorkflowState {
  const { lifecycle } = getContext(state, assessmentId);
  const attempts = state.attempts.filter(attempt => attempt.assessmentId === assessmentId && attempt.status !== 'voided');
  if (to === 'closed' && attempts.some(attempt => attempt.status === 'in_progress')) {
    throw new AssessmentWorkflowError('لا يمكن إغلاق الامتحان مع وجود محاولات لم تُسلّم بعد.');
  }
  if (to === 'marking' && attempts.some(attempt => !['submitted', 'marking', 'marked'].includes(String(attempt.status)))) {
    throw new AssessmentWorkflowError('لا يمكن فتح التصحيح قبل تسليم جميع المحاولات النشطة.');
  }
  if (to === 'results_approved' || to === 'published') {
    const readiness = gate(state, assessmentId, 'results_approved');
    if (!readiness.ready) throw new AssessmentWorkflowError('توجد موانع تمنع اعتماد أو نشر النتائج.', readiness.blockers);
  }
  const command: AssessmentLifecycleTransitionCommand = {
    to,
    actorId,
    reason,
    occurredAt: now(),
    expectedVersion: lifecycle.version
  };
  let nextLifecycle: AssessmentLifecycle;
  try {
    nextLifecycle = transitionAssessmentLifecycle(lifecycle, command);
  } catch (error) {
    throw new AssessmentWorkflowError(error instanceof Error ? error.message : 'تعذر انتقال دورة الامتحان إلى المرحلة المطلوبة.');
  }
  const lifecycles = state.lifecycles.map(item => item.assessmentId === assessmentId ? nextLifecycle : item);
  const next = { ...state, lifecycles };
  return addAudit(next, actorId, `assessment.${to}`, 'assessment', assessmentId, { from: lifecycle.state, to });
}

export function startAssessmentAttempt(
  state: AssessmentWorkflowState,
  assessmentId: string,
  candidateId: string,
  actorId: string
): AssessmentWorkflowState {
  const { blueprint, lifecycle } = getContext(state, assessmentId);
  if (lifecycle.state !== 'open') throw new AssessmentWorkflowError('الامتحان ليس مفتوحاً للمحاولات حالياً.');
  if (!String(candidateId || '').trim()) throw new AssessmentWorkflowError('معرف الطالب مطلوب لبدء المحاولة.');
  if (state.attempts.some(item => item.assessmentId === assessmentId && item.candidateId === candidateId && !['marked', 'voided'].includes(String(item.status)))) {
    throw new AssessmentWorkflowError('للطالب محاولة مفتوحة بالفعل لهذا الامتحان.');
  }
  const attempt: AssessmentAttemptRecord = {
    id: makeId('attempt'),
    assessmentId,
    candidateId: candidateId.trim(),
    status: 'in_progress',
    responses: [],
    recordedTotal: 0,
    maximumTotal: blueprint.totalPoints
  };
  return addAudit({ ...state, attempts: [...state.attempts, attempt] }, actorId, 'attempt.started', 'attempt', attempt.id, { candidateId });
}

export function autosaveAssessmentResponse(
  state: AssessmentWorkflowState,
  attemptId: string,
  questionId: string,
  answer: unknown,
  actorId: string
): AssessmentWorkflowState {
  const attemptIndex = state.attempts.findIndex(item => item.id === attemptId);
  if (attemptIndex < 0) throw new AssessmentWorkflowError('المحاولة غير موجودة.');
  const attempt = state.attempts[attemptIndex];
  if (attempt.status !== 'in_progress') throw new AssessmentWorkflowError('لا يمكن تعديل إجابة بعد تسليم المحاولة.');
  const { blueprint } = getContext(state, String(attempt.assessmentId || ''));
  const reference = blueprint.questionRefs.find(item => item.questionId === questionId);
  if (!reference) throw new AssessmentWorkflowError('السؤال لا ينتمي إلى نموذج الامتحان.');
  const response: AssessmentResponseMark = {
    questionId,
    questionVersion: reference.version,
    answer: copy(answer),
    savedAt: now(),
    awardedPoints: null,
    markingStatus: 'pending'
  };
  const responses = [...attempt.responses];
  const index = responses.findIndex(item => item.questionId === questionId && item.questionVersion === reference.version);
  if (index >= 0) responses[index] = response;
  else responses.push(response);
  const attempts = [...state.attempts];
  attempts[attemptIndex] = { ...attempt, responses };
  return addAudit({ ...state, attempts }, actorId, 'attempt.response_autosaved', 'attempt', attemptId, { questionId });
}

const normalized = (value: unknown): string => String(value ?? '').trim().toLocaleLowerCase('ar');
const asList = (value: unknown): string[] => Array.isArray(value) ? value.map(item => String(item)) : value === undefined || value === null ? [] : [String(value)];
const sameSet = (left: string[], right: string[]): boolean => left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]);

const objectiveScore = (question: AssessmentQuestionBankItem, answer: unknown): number | null => {
  if (question.type === 'essay' || question.type === 'file') return null;
  let correct = false;
  if (question.type === 'single' || question.type === 'multiple') {
    correct = sameSet(asList(answer), question.configuration.correctOptionIds);
  } else if (question.type === 'true_false') {
    const parsed = typeof answer === 'boolean' ? answer : normalized(answer) === 'true' ? true : normalized(answer) === 'false' ? false : null;
    correct = parsed !== null && parsed === question.configuration.correctAnswer;
  } else if (question.type === 'text' || question.type === 'equation' || question.type === 'media') {
    const value = normalized(answer);
    correct = question.configuration.acceptedAnswers.some(item => normalized(item) === value);
  } else if (question.type === 'numeric') {
    const value = Number(answer);
    const tolerance = question.configuration.tolerance || 0;
    correct = Number.isFinite(value) && Math.abs(value - question.configuration.correctAnswer) <= tolerance;
  } else if (question.type === 'matching') {
    const record = answer && typeof answer === 'object' && !Array.isArray(answer) ? answer as Record<string, unknown> : {};
    correct = question.configuration.pairs.every(pair => normalized(record[pair.left]) === normalized(pair.right));
  } else if (question.type === 'ordering') {
    correct = sameSet(asList(answer), question.configuration.correctOrder) && asList(answer).every((value, index) => value === question.configuration.correctOrder[index]);
  }
  return correct ? question.points : 0;
};

export function submitAssessmentAttempt(
  state: AssessmentWorkflowState,
  attemptId: string,
  actorId: string
): AssessmentWorkflowState {
  const attempt = state.attempts.find(item => item.id === attemptId);
  if (!attempt) throw new AssessmentWorkflowError('المحاولة غير موجودة.');
  if (attempt.status !== 'in_progress') throw new AssessmentWorkflowError('المحاولة سُلّمت بالفعل أو لم تعد قابلة للتسليم.');
  const attempts = state.attempts.map(item => item.id === attemptId ? { ...item, status: 'submitted' as const } : item);
  return addAudit({ ...state, attempts }, actorId, 'attempt.submitted', 'attempt', attemptId);
}

export function autoMarkAssessmentAttempt(
  state: AssessmentWorkflowState,
  attemptId: string,
  actorId: string
): AssessmentWorkflowState {
  const attemptIndex = state.attempts.findIndex(item => item.id === attemptId);
  if (attemptIndex < 0) throw new AssessmentWorkflowError('المحاولة غير موجودة.');
  const attempt = state.attempts[attemptIndex];
  if (!['submitted', 'marking'].includes(String(attempt.status))) throw new AssessmentWorkflowError('المحاولة ليست في حالة التصحيح.');
  const { blueprint } = getContext(state, String(attempt.assessmentId || ''));
  const existing = new Map(attempt.responses.map(response => [`${response.questionId}@${response.questionVersion}`, response]));
  const responses: AssessmentResponseMark[] = blueprint.questionRefs.map(reference => {
    const question = state.questionBank.find(item => item.id === reference.questionId && item.version === reference.version);
    if (!question) throw new AssessmentWorkflowError(`السؤال ${reference.questionId}@${reference.version} غير موجود.`);
    const current = existing.get(`${reference.questionId}@${reference.version}`);
    const score = objectiveScore(question, current?.answer);
    return {
      questionId: reference.questionId,
      questionVersion: reference.version,
      answer: current?.answer,
      savedAt: current?.savedAt || now(),
      awardedPoints: score,
      markingStatus: score === null ? 'pending' : 'marked'
    };
  });
  const attempts = [...state.attempts];
  attempts[attemptIndex] = { ...attempt, status: 'marking', responses, recordedTotal: responses.reduce((sum, item) => sum + (typeof item.awardedPoints === 'number' ? item.awardedPoints : 0), 0) };
  return addAudit({ ...state, attempts }, actorId, 'attempt.auto_marked', 'attempt', attemptId);
}

export function markManualAssessmentResponse(
  state: AssessmentWorkflowState,
  attemptId: string,
  questionId: string,
  awardedPoints: number,
  actorId: string
): AssessmentWorkflowState {
  const attemptIndex = state.attempts.findIndex(item => item.id === attemptId);
  if (attemptIndex < 0) throw new AssessmentWorkflowError('المحاولة غير موجودة.');
  const attempt = state.attempts[attemptIndex];
  if (!['submitted', 'marking'].includes(String(attempt.status))) throw new AssessmentWorkflowError('المحاولة ليست في حالة التصحيح.');
  const { blueprint } = getContext(state, String(attempt.assessmentId || ''));
  const reference = blueprint.questionRefs.find(item => item.questionId === questionId);
  const question = state.questionBank.find(item => item.id === questionId && item.version === reference?.version);
  if (!question || !reference) throw new AssessmentWorkflowError('السؤال المطلوب تصحيحه غير موجود في النموذج.');
  if (!Number.isFinite(awardedPoints) || awardedPoints < 0 || awardedPoints > question.points) throw new AssessmentWorkflowError('الدرجة اليدوية خارج نطاق السؤال.');
  const responses = [...attempt.responses];
  const index = responses.findIndex(item => item.questionId === questionId && item.questionVersion === reference.version);
  const response: AssessmentResponseMark = { ...(index >= 0 ? responses[index] : { questionId, questionVersion: reference.version }), awardedPoints, markingStatus: 'marked', savedAt: now() };
  if (index >= 0) responses[index] = response;
  else responses.push(response);
  const attempts = [...state.attempts];
  attempts[attemptIndex] = { ...attempt, status: 'marking', responses, recordedTotal: responses.reduce((sum, item) => sum + (typeof item.awardedPoints === 'number' ? item.awardedPoints : 0), 0) };
  return addAudit({ ...state, attempts }, actorId, 'attempt.manual_marked', 'attempt', attemptId, { questionId, awardedPoints });
}

export function finalizeAssessmentAttempt(
  state: AssessmentWorkflowState,
  attemptId: string,
  actorId: string
): AssessmentWorkflowState {
  const attempt = state.attempts.find(item => item.id === attemptId);
  if (!attempt) throw new AssessmentWorkflowError('المحاولة غير موجودة.');
  const assessmentId = String(attempt.assessmentId || '');
  const readiness = gate({ ...state, attempts: state.attempts }, assessmentId, 'results_approved');
  const blockers = readiness.blockers.filter(blocker => blocker.entityId === attemptId && !['LIFECYCLE_NOT_READY_FOR_PUBLICATION', 'REPORT_NOT_READY', 'ATTEMPT_STATUS_NOT_FINAL'].includes(blocker.code));
  if (blockers.length > 0) throw new AssessmentWorkflowError('لا يمكن إنهاء المحاولة قبل اكتمال الإجابات والتصحيح.', blockers);
  const finalized: AssessmentAttemptRecord = { ...attempt, status: 'marked', recordedTotal: attempt.responses.reduce((sum, item) => sum + Number(item.awardedPoints || 0), 0) };
  return addAudit({ ...state, attempts: state.attempts.map(item => item.id === attemptId ? finalized : item) }, actorId, 'attempt.finalized', 'attempt', attemptId);
}

export function getAssessmentPublicationReadiness(state: AssessmentWorkflowState, assessmentId: string) {
  return gate(state, assessmentId, 'results_approved');
}

export const assessmentQuestionTypeLabel: Record<AssessmentQuestionType, string> = {
  single: 'اختيار واحد',
  multiple: 'اختيارات متعددة',
  true_false: 'صح أو خطأ',
  text: 'إجابة نصية',
  numeric: 'إجابة رقمية',
  matching: 'مطابقة',
  ordering: 'ترتيب',
  essay: 'مقالي',
  file: 'ملف مرفق',
  media: 'وسائط',
  equation: 'معادلة'
};

export const assessmentLifecycleLabel: Record<AssessmentLifecycleState, string> = {
  draft: 'مسودة',
  review: 'مراجعة',
  approved: 'معتمد',
  scheduled: 'مجدول',
  open: 'مفتوح',
  closed: 'مغلق',
  marking: 'قيد التصحيح',
  results_approved: 'نتائج معتمدة',
  published: 'منشور',
  archived: 'مؤرشف'
};

export { AssessmentDomainValidationError };
