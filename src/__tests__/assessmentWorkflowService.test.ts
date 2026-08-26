import { describe, expect, it } from 'vitest';
import {
  AssessmentWorkflowError,
  AssessmentWorkflowState,
  autoMarkAssessmentAttempt,
  cloneQuestionVersion,
  createAssessment,
  createEmptyAssessmentWorkflowState,
  createQuestionDraft,
  finalizeAssessmentAttempt,
  getAssessmentPublicationReadiness,
  markManualAssessmentResponse,
  normalizeAssessmentWorkflowState,
  setQuestionStatus,
  startAssessmentAttempt,
  submitAssessmentAttempt,
  transitionAssessment,
  updateQuestionDraft,
  autosaveAssessmentResponse
} from '../modules/exams/application/AssessmentWorkflowService';

const singleQuestion = {
  ownerId: 'admin-1',
  type: 'single' as const,
  prompt: 'ما عاصمة السودان؟',
  points: 10,
  classification: {
    subjectId: 'arabic',
    gradeId: 'grade-1',
    standardId: 'std-1',
    bloomLevel: 'remember' as const,
    dokLevel: 1 as const,
    difficulty: 'easy' as const,
    language: 'ar'
  },
  configuration: {
    options: [{ id: 'kh', label: 'الخرطوم' }, { id: 'om', label: 'أم درمان' }],
    correctOptionIds: ['kh']
  }
};

const essayQuestion = {
  ownerId: 'admin-1',
  type: 'essay' as const,
  prompt: 'اشرح أهمية القراءة.',
  points: 5,
  classification: {
    subjectId: 'arabic',
    gradeId: 'grade-1',
    standardId: 'std-2',
    bloomLevel: 'create' as const,
    dokLevel: 3 as const,
    difficulty: 'medium' as const,
    language: 'ar'
  },
  configuration: { rubric: 'وضوح الفكرة والاستدلال.' }
};

const activate = (state: AssessmentWorkflowState, questionId: string, version = 1) =>
  setQuestionStatus(state, questionId, version, 'active', 'admin-1');

const openAssessment = (state: AssessmentWorkflowState, assessmentId: string) => {
  let next = state;
  (['review', 'approved', 'scheduled', 'open'] as const).forEach(target => {
    next = transitionAssessment(next, assessmentId, target, 'admin-1', `انتقال إلى ${target}`);
  });
  return next;
};

describe('online assessment workflow and closure gates', () => {
  it('preserves question versions and prevents mutation of an active/published reference', () => {
    let state = createEmptyAssessmentWorkflowState();
    state = createQuestionDraft(state, { ...singleQuestion, id: 'q-1', bankId: 'bank-1' });
    state = activate(state, 'q-1');
    const firstAssessment = createAssessment(state, {
      id: 'assessment-1',
      title: 'اختبار القراءة',
      durationMinutes: 30,
      actorId: 'admin-1',
      questionRefs: [{ questionId: 'q-1', version: 1 }]
    });
    const cloned = cloneQuestionVersion(firstAssessment, 'q-1', 1, 'admin-1');
    expect(cloned.questionBank.find(q => q.id === 'q-1' && q.version === 1)?.prompt).toBe(singleQuestion.prompt);
    expect(cloned.questionBank.find(q => q.id === 'q-1' && q.version === 2)?.status).toBe('draft');
    expect(() => updateQuestionDraft(cloned, 'q-1', 1, { prompt: 'تغيير غير مسموح' }, 'admin-1')).toThrow(AssessmentWorkflowError);
    const versioned = setQuestionStatus(cloned, 'q-1', 2, 'active', 'admin-1');
    expect(versioned.questionBank.find(q => q.id === 'q-1' && q.version === 1)?.status).toBe('archived');
    expect(() => normalizeAssessmentWorkflowState(versioned)).not.toThrow();
  });

  it('runs autosave, submission, automatic marking, finalization and publication', () => {
    let state = createEmptyAssessmentWorkflowState();
    state = createQuestionDraft(state, { ...singleQuestion, id: 'q-1', bankId: 'bank-1' });
    state = activate(state, 'q-1');
    state = createAssessment(state, {
      id: 'assessment-1',
      title: 'اختبار القراءة',
      durationMinutes: 30,
      actorId: 'admin-1',
      questionRefs: [{ questionId: 'q-1', version: 1 }]
    });
    state = openAssessment(state, 'assessment-1');
    state = startAssessmentAttempt(state, 'assessment-1', 'student-1', 'admin-1');
    const attemptId = state.attempts[0].id;
    expect(state.attempts[0].startedAt).toBeTruthy();
    expect(Date.parse(state.attempts[0].deadlineAt || '')).toBeGreaterThan(Date.parse(state.attempts[0].startedAt || ''));
    state = autosaveAssessmentResponse(state, attemptId, 'q-1', 'kh', 'student-1');
    expect(state.attempts[0].responses[0].answer).toBe('kh');
    const reloaded = normalizeAssessmentWorkflowState(JSON.parse(JSON.stringify(state)));
    state = submitAssessmentAttempt(reloaded, attemptId, 'student-1');
    state = transitionAssessment(state, 'assessment-1', 'closed', 'admin-1', 'انتهاء زمن الامتحان');
    state = transitionAssessment(state, 'assessment-1', 'marking', 'admin-1', 'بدء التصحيح');
    state = autoMarkAssessmentAttempt(state, attemptId, 'admin-1');
    state = finalizeAssessmentAttempt(state, attemptId, 'admin-1');
    expect(state.attempts[0].recordedTotal).toBe(10);
    state = transitionAssessment(state, 'assessment-1', 'results_approved', 'admin-1', 'اعتماد النتائج');
    state = transitionAssessment(state, 'assessment-1', 'published', 'admin-1', 'نشر النتائج');
    expect(state.lifecycles[0].state).toBe('published');
    expect(getAssessmentPublicationReadiness(state, 'assessment-1').ready).toBe(true);

    const expiredAttempt = {
      ...reloaded.attempts[0],
      deadlineAt: '2000-01-01T00:00:00.000Z'
    };
    const expiredState = { ...reloaded, attempts: [expiredAttempt] };
    expect(() => autosaveAssessmentResponse(expiredState, attemptId, 'q-1', 'kh', 'student-1')).toThrow(/انتهى زمن المحاولة/);
    const autoSubmittedState = submitAssessmentAttempt(expiredState, attemptId, 'student-1');
    expect(autoSubmittedState.attempts[0].autoSubmitted).toBe(true);
  });

  it('blocks results approval until an essay answer is manually marked', () => {
    let state = createEmptyAssessmentWorkflowState();
    state = createQuestionDraft(state, { ...essayQuestion, id: 'q-essay', bankId: 'bank-essay' });
    state = activate(state, 'q-essay');
    state = createAssessment(state, {
      id: 'assessment-essay',
      title: 'اختبار مقالي',
      durationMinutes: 45,
      actorId: 'admin-1',
      questionRefs: [{ questionId: 'q-essay', version: 1 }]
    });
    state = openAssessment(state, 'assessment-essay');
    state = startAssessmentAttempt(state, 'assessment-essay', 'student-essay', 'admin-1');
    const attemptId = state.attempts[0].id;
    state = autosaveAssessmentResponse(state, attemptId, 'q-essay', 'إجابة الطالب', 'student-essay');
    state = submitAssessmentAttempt(state, attemptId, 'student-essay');
    state = transitionAssessment(state, 'assessment-essay', 'closed', 'admin-1', 'إغلاق');
    state = transitionAssessment(state, 'assessment-essay', 'marking', 'admin-1', 'تصحيح');
    state = autoMarkAssessmentAttempt(state, attemptId, 'admin-1');
    expect(() => finalizeAssessmentAttempt(state, attemptId, 'admin-1')).toThrow(AssessmentWorkflowError);
    expect(getAssessmentPublicationReadiness(state, 'assessment-essay').ready).toBe(false);
    state = markManualAssessmentResponse(state, attemptId, 'q-essay', 4, 'reviewer-1');
    state = finalizeAssessmentAttempt(state, attemptId, 'reviewer-1');
    state = transitionAssessment(state, 'assessment-essay', 'results_approved', 'admin-1', 'اعتماد بعد المراجعة');
    expect(getAssessmentPublicationReadiness(state, 'assessment-essay').ready).toBe(true);
  });

  it('rejects skipped lifecycle transitions and keeps an audit trail', () => {
    let state = createEmptyAssessmentWorkflowState();
    state = createQuestionDraft(state, { ...singleQuestion, id: 'q-2', bankId: 'bank-2' });
    state = activate(state, 'q-2');
    state = createAssessment(state, { id: 'assessment-2', title: 'اختبار', durationMinutes: 20, actorId: 'admin-1', questionRefs: [{ questionId: 'q-2', version: 1 }] });
    expect(() => transitionAssessment(state, 'assessment-2', 'open', 'admin-1', 'تجاوز المراحل')).toThrow(AssessmentWorkflowError);
    expect(state.auditEvents.some(event => event.action === 'assessment.created')).toBe(true);
  });

  it('requires a candidate to exist in the authoritative eligible-student list when supplied', () => {
    let state = createEmptyAssessmentWorkflowState();
    state = createQuestionDraft(state, { ...singleQuestion, id: 'q-3', bankId: 'bank-3' });
    state = activate(state, 'q-3');
    state = createAssessment(state, { id: 'assessment-3', title: 'اختبار الهوية', durationMinutes: 20, actorId: 'admin-1', questionRefs: [{ questionId: 'q-3', version: 1 }] });
    state = openAssessment(state, 'assessment-3');
    expect(() => startAssessmentAttempt(state, 'assessment-3', 'unknown-student', 'admin-1', ['student-1'])).toThrow(/السجلات الأكاديمية/);
  });
});
