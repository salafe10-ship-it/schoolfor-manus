import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Archive, Check, CheckCircle, ChevronLeft, Copy, Download, Edit3, FileCheck2, Lock, Play, Plus, Printer, Save, Send, ShieldCheck, Timer, X } from 'lucide-react';
import {
  AssessmentWorkflowError,
  AssessmentWorkflowState,
  assessmentLifecycleLabel,
  assessmentQuestionTypeLabel,
  autoMarkAssessmentAttempt,
  cloneQuestionVersion,
  createAssessment,
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
} from '../../modules/exams/application/AssessmentWorkflowService';
import { AssessmentQuestionType, ASSESSMENT_LIFECYCLE_STATES } from '../../modules/exams/domain/AssessmentLifecycleEngine';

interface ExamsAssessmentPanelProps {
  state: AssessmentWorkflowState;
  actorId: string;
  candidateIds: readonly string[];
  permissionRole?: 'admin' | 'reviewer' | 'officer';
  onChange: (next: AssessmentWorkflowState, reason: string) => Promise<boolean>;
}

const questionTypes: AssessmentQuestionType[] = ['single', 'multiple', 'true_false', 'text', 'numeric', 'matching', 'ordering', 'essay', 'file', 'media', 'equation'];

const initialForm = {
  prompt: '',
  subjectId: '',
  gradeId: '',
  standardId: 'general',
  points: 1,
  difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  type: 'single' as AssessmentQuestionType,
  optionA: '',
  optionB: '',
  optionC: '',
  correctIndex: '0'
};

const errorMessage = (error: unknown): string => {
  if (error instanceof AssessmentWorkflowError) {
    const blockers = error.blockers?.map(blocker => blocker.message).filter(Boolean) || [];
    return [error.message, ...blockers].join(' — ');
  }
  return error instanceof Error ? error.message : 'تعذر تنفيذ العملية.';
};

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export default function ExamsAssessmentPanel({ state, actorId, candidateIds, permissionRole = 'admin', onChange }: ExamsAssessmentPanelProps) {
  const [form, setForm] = useState(initialForm);
  const [assessmentTitle, setAssessmentTitle] = useState('الامتحان الإلكتروني الأول');
  const [assessmentDuration, setAssessmentDuration] = useState(60);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [candidateId, setCandidateId] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, unknown>>({});
  const [manualScores, setManualScores] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [clockMs, setClockMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClockMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const canManageQuestions = permissionRole === 'admin' || permissionRole === 'reviewer';
  const canOperateAttempt = permissionRole === 'admin' || permissionRole === 'reviewer';
  const canMark = canManageQuestions;
  const canAdminister = permissionRole === 'admin';

  const activeQuestions = useMemo(() => state.questionBank.filter(question => question.status === 'active'), [state.questionBank]);
  const activeAssessment = state.assessments[state.assessments.length - 1];
  const assessmentById = (id: string) => state.assessments.find(item => item.id === id);
  const lifecycleById = (id: string) => state.lifecycles.find(item => item.assessmentId === id);
  const questionsForAssessment = (assessmentId: string) => {
    const blueprint = state.blueprints.find(item => item.assessmentId === assessmentId);
    return (blueprint?.questionRefs || []).map(reference => state.questionBank.find(question => question.id === reference.questionId && question.version === reference.version)).filter(Boolean) as typeof state.questionBank;
  };

  const commit = async (operation: string, producer: () => AssessmentWorkflowState) => {
    setBusy(operation);
    setMessage(null);
    try {
      const next = normalizeAssessmentWorkflowState(producer());
      const persisted = await onChange(next, operation);
      if (!persisted) throw new AssessmentWorkflowError('لم يؤكد المصدر المركزي حفظ العملية.');
      setMessage({ tone: 'success', text: 'تم الحفظ في المصدر المركزي ويمكن استئناف العمل بعد انقطاع الجلسة أو الكهرباء.' });
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error) });
    } finally {
      setBusy('');
    }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportRowsFor = (assessment: AssessmentWorkflowState['assessments'][number]) => {
    const lifecycle = lifecycleById(assessment.id);
    const blueprint = state.blueprints.find(item => item.assessmentId === assessment.id);
    const questions = questionsForAssessment(assessment.id);
    const attempts = state.attempts.filter(attempt => attempt.assessmentId === assessment.id);
    return { lifecycle, blueprint, questions, attempts };
  };

  const exportAssessmentCsv = (assessment: AssessmentWorkflowState['assessments'][number]) => {
    const { lifecycle, questions, attempts } = exportRowsFor(assessment);
    const rows = [
      ['نوع السجل', 'معرف الامتحان', 'العنوان', 'الحالة', 'الطالب', 'حالة المحاولة', 'الدرجة', 'النهاية العظمى', 'النسبة', 'التسليم التلقائي'],
      ['الامتحان', assessment.id, assessment.title, lifecycle ? assessmentLifecycleLabel[lifecycle.state] : '', '', '', '', '', '', ''],
      ...attempts.map(attempt => [
        'نتيجة طالب', assessment.id, assessment.title, lifecycle ? assessmentLifecycleLabel[lifecycle.state] : '', attempt.candidateId,
        String(attempt.status || ''), String(attempt.recordedTotal), String(attempt.maximumTotal),
        attempt.maximumTotal > 0 ? `${((attempt.recordedTotal / attempt.maximumTotal) * 100).toFixed(2)}%` : '0%', attempt.autoSubmitted ? 'نعم' : 'لا'
      ]),
      [],
      ['الأسئلة', 'الإصدار', 'نص السؤال', 'النوع', 'الدرجة', 'المادة', 'الصف'],
      ...questions.map(question => [question.id, String(question.version), question.prompt, assessmentQuestionTypeLabel[question.type], String(question.points), question.classification.subjectId, question.classification.gradeId])
    ];
    const csv = `\uFEFF${rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n')}`;
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `نتائج_الامتحان_${assessment.id}.csv`);
    setMessage({ tone: 'success', text: 'تم تنزيل كشف CSV للامتحان والطلاب والأسئلة.' });
  };

  const exportAssessmentXlsx = async (assessment: AssessmentWorkflowState['assessments'][number]) => {
    setBusy(`export.xlsx.${assessment.id}`);
    setMessage(null);
    try {
      const XLSX = await import('xlsx');
      const { lifecycle, blueprint, questions, attempts } = exportRowsFor(assessment);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
        معرف_الامتحان: assessment.id,
        العنوان: assessment.title,
        الحالة: lifecycle ? assessmentLifecycleLabel[lifecycle.state] : '',
        المدة_بالدقائق: assessment.durationMinutes,
        مجموع_الدرجات: blueprint?.totalPoints || 0,
        عدد_الأسئلة: questions.length,
        عدد_المحاولات: attempts.length
      }]), 'الامتحان');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(questions.map(question => ({
        معرف_السؤال: question.id,
        الإصدار: question.version,
        السؤال: question.prompt,
        النوع: assessmentQuestionTypeLabel[question.type],
        الدرجة: question.points,
        المادة: question.classification.subjectId,
        الصف: question.classification.gradeId,
        الحالة: question.status
      }))), 'الأسئلة');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(attempts.map(attempt => ({
        معرف_الطالب: attempt.candidateId,
        حالة_المحاولة: attempt.status || '',
        الدرجة: attempt.recordedTotal,
        النهاية_العظمى: attempt.maximumTotal,
        النسبة: attempt.maximumTotal > 0 ? Number(((attempt.recordedTotal / attempt.maximumTotal) * 100).toFixed(2)) : 0,
        التسليم_التلقائي: attempt.autoSubmitted ? 'نعم' : 'لا',
        وقت_البدء: attempt.startedAt || '',
        وقت_التسليم: attempt.submittedAt || ''
      }))), 'النتائج');
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', compression: true });
      downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `نتائج_الامتحان_${assessment.id}.xlsx`);
      setMessage({ tone: 'success', text: 'تم تنزيل ملف XLSX للامتحان والأسئلة ونتائج الطلاب.' });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'تعذر إنشاء ملف XLSX.' });
    } finally {
      setBusy('');
    }
  };

  const printAssessmentReport = (assessment: AssessmentWorkflowState['assessments'][number]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setMessage({ tone: 'error', text: 'تعذر فتح نافذة التقرير؛ اسمح بالنوافذ المنبثقة ثم أعد المحاولة.' });
      return;
    }
    const { lifecycle, blueprint, questions, attempts } = exportRowsFor(assessment);
    const resultRows = attempts.length > 0
      ? attempts.map(attempt => `<tr><td>${escapeHtml(attempt.candidateId)}</td><td>${escapeHtml(attempt.status)}</td><td>${escapeHtml(attempt.recordedTotal)}</td><td>${escapeHtml(attempt.maximumTotal)}</td><td>${attempt.maximumTotal > 0 ? ((attempt.recordedTotal / attempt.maximumTotal) * 100).toFixed(2) : '0'}%</td><td>${attempt.autoSubmitted ? 'نعم' : 'لا'}</td></tr>`).join('')
      : '<tr><td colspan="6">لا توجد نتائج طلاب بعد.</td></tr>';
    const questionRows = questions.map(question => `<tr><td>${escapeHtml(question.id)}</td><td>v${question.version}</td><td>${escapeHtml(question.prompt)}</td><td>${escapeHtml(assessmentQuestionTypeLabel[question.type])}</td><td>${escapeHtml(question.points)}</td></tr>`).join('');
    printWindow.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${escapeHtml(assessment.title)}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#172033}h1{border-bottom:2px solid #d4af37;padding-bottom:12px}h2{margin-top:28px}table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}th,td{border:1px solid #9ca3af;padding:8px;text-align:right}th{background:#fff8e5}@media print{button{display:none}}</style></head><body><h1>${escapeHtml(assessment.title)}</h1><p>الحالة: ${escapeHtml(lifecycle ? assessmentLifecycleLabel[lifecycle.state] : '')} — المدة: ${assessment.durationMinutes} دقيقة — مجموع الدرجات: ${blueprint?.totalPoints || 0}</p><h2>نتائج الطلاب</h2><table><thead><tr><th>الطالب</th><th>الحالة</th><th>الدرجة</th><th>النهاية العظمى</th><th>النسبة</th><th>تلقائي</th></tr></thead><tbody>${resultRows}</tbody></table><h2>كشف الأسئلة</h2><table><thead><tr><th>المعرف</th><th>الإصدار</th><th>السؤال</th><th>النوع</th><th>الدرجة</th></tr></thead><tbody>${questionRows}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
    printWindow.document.close();
    setMessage({ tone: 'success', text: 'تم فتح تقرير RTL؛ اختر الطباعة أو الحفظ بصيغة PDF.' });
  };

  const createQuestion = () => {
    const options = [form.optionA, form.optionB, form.optionC].map((label, index) => ({ id: `option-${index + 1}`, label: label.trim() })).filter(option => option.label);
    if ((form.type === 'single' || form.type === 'multiple') && options.length < 2) {
      setMessage({ tone: 'error', text: 'أدخل خيارين صحيحين على الأقل للسؤال.' });
      return;
    }
    void commit('question.created', () => createQuestionDraft(state, {
      ownerId: actorId,
      type: form.type,
      prompt: form.prompt,
      points: Number(form.points),
      classification: {
        subjectId: form.subjectId || 'general',
        gradeId: form.gradeId || 'general',
        standardId: form.standardId || 'general',
        bloomLevel: 'understand',
        dokLevel: 2,
        difficulty: form.difficulty,
        language: 'ar'
      },
      configuration: form.type === 'single' || form.type === 'multiple'
        ? { options, correctOptionIds: [options[Number(form.correctIndex)]?.id || options[0]?.id] }
        : form.type === 'true_false'
          ? { correctAnswer: true }
          : form.type === 'numeric'
            ? { correctAnswer: 0, tolerance: 0 }
            : form.type === 'text' || form.type === 'equation' || form.type === 'media'
              ? { acceptedAnswers: ['إجابة نموذجية'], ...(form.type === 'equation' ? { expression: form.prompt, equivalenceMode: 'exact' as const } : {}), ...(form.type === 'media' ? { sourceUrl: 'https://example.com/media', altText: form.prompt } : {}) }
              : form.type === 'essay'
                ? { rubric: 'يُراجع وفق عناصر الإجابة والنحو والاستدلال.' }
                : form.type === 'file'
                  ? { allowedMimeTypes: ['application/pdf'], maxSizeBytes: 10_000_000 }
                  : form.type === 'matching'
                    ? { pairs: [{ left: 'أ', right: '1' }, { left: 'ب', right: '2' }] }
                    : { items: [{ id: 'one', label: 'العنصر الأول' }, { id: 'two', label: 'العنصر الثاني' }], correctOrder: ['one', 'two'] }
    }, actorId));
    setForm(initialForm);
  };

  const createNewAssessment = () => {
    const refs = selectedQuestions.map(key => {
      const [questionId, version] = key.split('@');
      return { questionId, version: Number(version) };
    });
    void commit('assessment.created', () => createAssessment(state, {
      title: assessmentTitle,
      durationMinutes: Number(assessmentDuration),
      actorId,
      questionRefs: refs
    }));
  };

  const nextLifecycleState = (stateName: string) => {
    const index = ASSESSMENT_LIFECYCLE_STATES.indexOf(stateName as typeof ASSESSMENT_LIFECYCLE_STATES[number]);
    return index >= 0 ? ASSESSMENT_LIFECYCLE_STATES[index + 1] : undefined;
  };

  const answerFor = (attemptId: string, questionId: string) => {
    const key = `${attemptId}:${questionId}`;
    const attempt = state.attempts.find(item => item.id === attemptId);
    const current = attempt?.responses.find(item => item.questionId === questionId);
    return Object.prototype.hasOwnProperty.call(answerDrafts, key) ? answerDrafts[key] : current?.answer ?? '';
  };

  const renderAnswerInput = (attemptId: string, question: typeof state.questionBank[number]) => {
    const key = `${attemptId}:${question.id}`;
    const value = answerFor(attemptId, question.id);
    const setAnswer = (next: unknown) => setAnswerDrafts(current => ({ ...current, [key]: next }));
    if (question.type === 'single') {
      return <select value={String(value ?? '')} onChange={event => setAnswer(event.target.value)} className="w-full border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50"><option value="">اختر الإجابة</option>{question.configuration.options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select>;
    }
    if (question.type === 'true_false') {
      return <select value={String(value ?? '')} onChange={event => setAnswer(event.target.value === 'true')} className="w-full border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50"><option value="">اختر الإجابة</option><option value="true">صح</option><option value="false">خطأ</option></select>;
    }
    return <input value={String(value ?? '')} onChange={event => setAnswer(event.target.value)} className="w-full border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50" placeholder="إجابة الطالب" />;
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <section className="border border-[#d4af37]/40 bg-gradient-to-l from-[#1c120c] via-[#2a1d13] to-[#130b04] p-6 text-amber-50 shadow-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f7d174]">ONLINE ASSESSMENT CONTROL</span>
            <h2 className="mt-2 text-2xl font-black text-[#fce79a]">بنك الأسئلة والامتحان الإلكتروني</h2>
            <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-amber-100/70">حفظ تلقائي، نسخ إصدارات غير قابلة للتعديل بعد الاعتماد، دورة تشغيل موثقة، وتصحيح لا يسمح بالنشر قبل اكتماله.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-black sm:grid-cols-4">
            <div className="border border-amber-500/25 bg-black/20 px-3 py-2"><span className="block text-amber-200/60">الأسئلة</span><span className="text-lg text-white">{state.questionBank.length}</span></div>
            <div className="border border-amber-500/25 bg-black/20 px-3 py-2"><span className="block text-amber-200/60">المفعلة</span><span className="text-lg text-emerald-300">{activeQuestions.length}</span></div>
            <div className="border border-amber-500/25 bg-black/20 px-3 py-2"><span className="block text-amber-200/60">الامتحانات</span><span className="text-lg text-white">{state.assessments.length}</span></div>
            <div className="border border-amber-500/25 bg-black/20 px-3 py-2"><span className="block text-amber-200/60">المحاولات</span><span className="text-lg text-[#f7d174]">{state.attempts.length}</span></div>
          </div>
        </div>
      </section>

      {message && <div role="alert" className={`flex items-start gap-2 border p-4 text-xs font-black ${message.tone === 'success' ? 'border-emerald-400/40 bg-emerald-950/40 text-emerald-200' : 'border-rose-400/50 bg-rose-950/40 text-rose-200'}`}>{message.tone === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}{message.text}</div>}

      <section className="flex flex-col gap-2 border border-cyan-400/25 bg-cyan-950/20 p-4 text-xs text-cyan-100 sm:flex-row sm:items-center sm:justify-between">
        <div><span className="font-black">الصلاحية الحالية: </span>{permissionRole === 'admin' ? 'مدير الامتحانات — إنشاء واعتماد ونشر' : permissionRole === 'reviewer' ? 'مراجع/مصحح — إعداد الأسئلة والتصحيح' : 'عرض فقط — لا توجد صلاحية تشغيل إلكتروني'}.</div>
        <span className="text-[10px] font-bold text-cyan-200/70">التحكم الخادمي هو المرجع النهائي، وإخفاء الأزرار ليس بديلاً عن التحقق.</span>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="border border-[#d4af37]/35 bg-[#1c120c] p-5 text-amber-50 shadow-lg">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3"><div><h3 className="text-sm font-black text-white">إضافة سؤال بإصدار جديد</h3><p className="mt-1 text-[10px] text-amber-100/55">الإصدار يبدأ مسودة ثم يحتاج تفعيلاً صريحاً.</p></div><Plus className="h-5 w-5 text-[#f7d174]" /></div>
          <div className="mt-4 space-y-3">
            <textarea value={form.prompt} onChange={event => setForm({ ...form, prompt: event.target.value })} className="min-h-20 w-full border border-[#d4af37]/30 bg-[#130b04] p-3 text-xs text-amber-50" placeholder="نص السؤال" />
            <div className="grid grid-cols-2 gap-2"><input value={form.subjectId} onChange={event => setForm({ ...form, subjectId: event.target.value })} className="border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50" placeholder="معرف المادة" /><input value={form.gradeId} onChange={event => setForm({ ...form, gradeId: event.target.value })} className="border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50" placeholder="معرف الصف" /></div>
            <div className="grid grid-cols-3 gap-2"><select value={form.type} onChange={event => setForm({ ...form, type: event.target.value as AssessmentQuestionType })} className="border border-[#d4af37]/30 bg-[#130b04] px-2 py-2 text-xs text-amber-50">{questionTypes.map(type => <option key={type} value={type}>{assessmentQuestionTypeLabel[type]}</option>)}</select><select value={form.difficulty} onChange={event => setForm({ ...form, difficulty: event.target.value as typeof form.difficulty })} className="border border-[#d4af37]/30 bg-[#130b04] px-2 py-2 text-xs text-amber-50"><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select><input type="number" min="1" value={form.points} onChange={event => setForm({ ...form, points: Number(event.target.value) })} className="border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50" placeholder="الدرجة" /></div>
            {(form.type === 'single' || form.type === 'multiple') && <><div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><input value={form.optionA} onChange={event => setForm({ ...form, optionA: event.target.value })} className="border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50" placeholder="الخيار الأول" /><input value={form.optionB} onChange={event => setForm({ ...form, optionB: event.target.value })} className="border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50" placeholder="الخيار الثاني" /><input value={form.optionC} onChange={event => setForm({ ...form, optionC: event.target.value })} className="border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50" placeholder="خيار ثالث اختياري" /></div><select value={form.correctIndex} onChange={event => setForm({ ...form, correctIndex: event.target.value })} className="w-full border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50"><option value="0">الإجابة الصحيحة: الخيار الأول</option><option value="1">الإجابة الصحيحة: الخيار الثاني</option><option value="2">الإجابة الصحيحة: الخيار الثالث</option></select></>}
            <button type="button" onClick={createQuestion} disabled={!canManageQuestions || Boolean(busy) || !form.prompt.trim()} className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-[#d4af37] via-[#f7d174] to-[#9a6a1d] px-4 py-3 text-xs font-black text-slate-950 disabled:opacity-40"><Save className="h-4 w-4" />{busy === 'question.created' ? 'جارٍ الحفظ...' : 'حفظ السؤال كمسودة'}</button>
          </div>
        </section>

        <section className="border border-[#d4af37]/35 bg-[#1c120c] p-5 text-amber-50 shadow-lg">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3"><div><h3 className="text-sm font-black text-white">بنك الأسئلة والإصدارات</h3><p className="mt-1 text-[10px] text-amber-100/55">لا يسمح النظام بأكثر من إصدار مفعّل للسؤال نفسه.</p></div><Copy className="h-5 w-5 text-[#f7d174]" /></div>
          <div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto">
            {state.questionBank.map(question => (
              <div key={`${question.id}@${question.version}`} className="border border-amber-500/20 bg-black/15 p-3">
                <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-1.5"><span className="text-[10px] font-black text-[#f7d174]">{question.id}@v{question.version}</span><span className={`border px-1.5 py-0.5 text-[9px] font-black ${question.status === 'active' ? 'border-emerald-400/40 text-emerald-300' : question.status === 'archived' ? 'border-slate-500/40 text-slate-400' : 'border-amber-400/40 text-amber-300'}`}>{question.status === 'active' ? 'مفعّل' : question.status === 'archived' ? 'مؤرشف' : 'مسودة'}</span><span className="text-[9px] text-amber-100/50">{assessmentQuestionTypeLabel[question.type]} • {question.points} درجة</span></div><p className="mt-1 text-xs font-bold text-amber-50">{question.prompt}</p></div><ShieldCheck className="h-4 w-4 shrink-0 text-[#d4af37]" /></div>
                <div className="mt-3 flex flex-wrap gap-1.5"><button type="button" disabled={!canManageQuestions || Boolean(busy) || question.status !== 'draft'} onClick={() => void commit('question.updated', () => updateQuestionDraft(state, question.id, question.version, { prompt: `${question.prompt} (مراجعة)` }, actorId))} className="flex items-center gap-1 border border-amber-500/30 px-2 py-1 text-[9px] font-black text-amber-100 disabled:opacity-30"><Edit3 className="h-3 w-3" />تعديل مسودة</button><button type="button" disabled={!canManageQuestions || Boolean(busy) || question.status !== 'draft'} onClick={() => void commit('question.active', () => setQuestionStatus(state, question.id, question.version, 'active', actorId))} className="flex items-center gap-1 border border-emerald-500/30 px-2 py-1 text-[9px] font-black text-emerald-200 disabled:opacity-30"><Check className="h-3 w-3" />تفعيل</button><button type="button" disabled={!canManageQuestions || Boolean(busy) || question.status === 'archived'} onClick={() => void commit('question.version_cloned', () => cloneQuestionVersion(state, question.id, question.version, actorId))} className="flex items-center gap-1 border border-cyan-500/30 px-2 py-1 text-[9px] font-black text-cyan-200 disabled:opacity-30"><Copy className="h-3 w-3" />نسخ إصدار</button><button type="button" disabled={!canManageQuestions || Boolean(busy) || question.status === 'archived'} onClick={() => void commit('question.archived', () => setQuestionStatus(state, question.id, question.version, 'archived', actorId))} className="flex items-center gap-1 border border-rose-500/30 px-2 py-1 text-[9px] font-black text-rose-200 disabled:opacity-30"><Archive className="h-3 w-3" />أرشفة</button></div>
              </div>
            ))}
            {state.questionBank.length === 0 && <div className="border border-dashed border-amber-500/30 p-8 text-center text-xs font-bold text-amber-100/55">لم يُنشأ بنك أسئلة بعد.</div>}
          </div>
        </section>
      </div>

      <section className="border border-[#d4af37]/35 bg-[#1c120c] p-5 text-amber-50 shadow-lg">
        <div className="flex flex-col gap-4 border-b border-amber-500/20 pb-4 lg:flex-row lg:items-end lg:justify-between"><div><h3 className="text-sm font-black text-white">إنشاء نموذج الامتحان الإلكتروني</h3><p className="mt-1 text-[10px] text-amber-100/55">اختر الإصدارات المفعلة فقط؛ نموذج منشور يحتفظ بإصداراته ولا يتغير بتعديل البنك.</p></div><div className="flex flex-wrap gap-2"><input disabled={!canManageQuestions} value={assessmentTitle} onChange={event => setAssessmentTitle(event.target.value)} className="border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50 disabled:opacity-40" placeholder="عنوان الامتحان" /><input disabled={!canManageQuestions} type="number" min="1" value={assessmentDuration} onChange={event => setAssessmentDuration(Number(event.target.value))} className="w-24 border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50 disabled:opacity-40" /><button type="button" onClick={createNewAssessment} disabled={!canManageQuestions || Boolean(busy) || selectedQuestions.length === 0} className="flex items-center gap-2 bg-[#d4af37] px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-40"><Plus className="h-4 w-4" />إنشاء النموذج</button></div></div>
        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">{activeQuestions.map(question => { const key = `${question.id}@${question.version}`; return <label key={key} className={`flex cursor-pointer items-start gap-2 border p-3 ${selectedQuestions.includes(key) ? 'border-[#f7d174] bg-[#2a1d13]' : 'border-amber-500/20 bg-black/15'}`}><input type="checkbox" checked={selectedQuestions.includes(key)} onChange={() => setSelectedQuestions(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key])} className="mt-1 accent-amber-500" /><span><span className="block text-[10px] font-black text-[#f7d174]">v{question.version} • {question.points} درجة</span><span className="mt-1 block text-xs font-bold text-amber-50">{question.prompt}</span></span></label>; })}</div>
        {activeQuestions.length === 0 && <p className="mt-4 border border-dashed border-amber-500/30 p-6 text-center text-xs font-bold text-amber-100/55">فعّل سؤالاً واحداً على الأقل قبل إنشاء النموذج.</p>}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between"><div><h3 className="text-lg font-black text-[#fce79a]">دورة التشغيل والاعتماد</h3><p className="mt-1 text-xs font-semibold text-amber-100/60">كل انتقال يكتب في سجل التدقيق ويحتاج سبباً ثابتاً من الخدمة.</p></div><Lock className="h-5 w-5 text-[#f7d174]" /></div>
        {state.assessments.map(assessment => {
          const lifecycle = lifecycleById(assessment.id);
          const readiness = (() => { try { return getAssessmentPublicationReadiness(state, assessment.id); } catch { return { ready: false, blockers: [] as any[], checkedAttemptCount: 0, expectedTotalPoints: null }; } })();
          const next = lifecycle ? nextLifecycleState(lifecycle.state) : undefined;
          const attempts = state.attempts.filter(attempt => attempt.assessmentId === assessment.id);
          return <div key={assessment.id} className="border border-[#d4af37]/35 bg-[#1c120c] p-5 text-amber-50 shadow-lg"><div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h4 className="text-base font-black text-white">{assessment.title}</h4><span className="border border-[#d4af37]/40 bg-black/20 px-2 py-1 text-[10px] font-black text-[#f7d174]">{lifecycle ? assessmentLifecycleLabel[lifecycle.state] : 'غير مكتمل'}</span><span className="text-[10px] text-amber-100/50">{assessment.durationMinutes} دقيقة • {attempts.length} محاولة</span></div><p className="mt-1 text-[10px] text-amber-100/50">الإصدار التشغيلي {lifecycle?.version ?? 0} • {assessment.id}</p></div><div className="flex flex-wrap gap-1.5">{next && <button type="button" disabled={!canAdminister || Boolean(busy)} onClick={() => void commit(`assessment.${next}`, () => transitionAssessment(state, assessment.id, next, actorId, `انتقال تشغيلي موثق إلى ${assessmentLifecycleLabel[next]}`))} className="flex items-center gap-1 bg-gradient-to-r from-[#d4af37] to-[#9a6a1d] px-3 py-2 text-[10px] font-black text-slate-950 disabled:opacity-30"><ChevronLeft className="h-3 w-3" />{assessmentLifecycleLabel[next]}</button>}{lifecycle?.state === 'open' && <button type="button" disabled={!canOperateAttempt || Boolean(busy) || !candidateId.trim()} onClick={() => void commit('attempt.started', () => startAssessmentAttempt(state, assessment.id, candidateId, actorId, candidateIds))} className="flex items-center gap-1 border border-emerald-500/40 px-3 py-2 text-[10px] font-black text-emerald-200 disabled:opacity-30"><Play className="h-3 w-3" />بدء محاولة</button>}<button type="button" onClick={() => exportAssessmentCsv(assessment)} disabled={Boolean(busy)} className="flex items-center gap-1 border border-cyan-500/30 px-2 py-2 text-[10px] font-black text-cyan-200 disabled:opacity-30" aria-label={`تصدير CSV للامتحان ${assessment.title}`}><Download className="h-3 w-3" />CSV</button><button type="button" onClick={() => void exportAssessmentXlsx(assessment)} disabled={Boolean(busy)} className="flex items-center gap-1 border border-emerald-500/30 px-2 py-2 text-[10px] font-black text-emerald-200 disabled:opacity-30" aria-label={`تصدير XLSX للامتحان ${assessment.title}`}><Download className="h-3 w-3" />XLSX</button><button type="button" onClick={() => printAssessmentReport(assessment)} disabled={Boolean(busy)} className="flex items-center gap-1 border border-amber-500/30 px-2 py-2 text-[10px] font-black text-amber-200 disabled:opacity-30" aria-label={`طباعة أو حفظ PDF للامتحان ${assessment.title}`}><Printer className="h-3 w-3" />PDF/طباعة</button></div></div>
            {lifecycle?.state === 'open' && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-500/20 pt-3"><input disabled={!canOperateAttempt} value={candidateId} onChange={event => setCandidateId(event.target.value)} className="border border-[#d4af37]/30 bg-[#130b04] px-3 py-2 text-xs text-amber-50 disabled:opacity-40" placeholder="معرف الطالب الرسمي" /><span className="text-[10px] font-bold text-amber-100/50">ابدأ المحاولة بعد تحقق هوية الطالب من المصدر المركزي.</span></div>}
            <div className={`mt-4 border p-3 text-xs font-bold ${readiness.ready ? 'border-emerald-400/40 bg-emerald-950/30 text-emerald-200' : 'border-amber-400/30 bg-amber-950/20 text-amber-100/80'}`}><div className="flex items-center gap-2">{readiness.ready ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}<span>{readiness.ready ? 'بوابة النشر مكتملة.' : `بوابة النشر: ${readiness.blockers.length} مانعاً يحتاج معالجة.`}</span></div>{!readiness.ready && readiness.blockers.slice(0, 3).map(blocker => <p key={`${blocker.code}-${blocker.entityId}`} className="mt-1 text-[10px]">• {blocker.message}</p>)}</div>
            <div className="mt-4 flex flex-wrap gap-1.5">{ASSESSMENT_LIFECYCLE_STATES.map(stateName => <span key={stateName} className={`border px-2 py-1 text-[9px] font-black ${stateName === lifecycle?.state ? 'border-[#f7d174] bg-[#2a1d13] text-[#f7d174]' : lifecycle && ASSESSMENT_LIFECYCLE_STATES.indexOf(stateName) < ASSESSMENT_LIFECYCLE_STATES.indexOf(lifecycle.state) ? 'border-emerald-500/20 text-emerald-300/70' : 'border-amber-500/15 text-amber-100/35'}`}>{assessmentLifecycleLabel[stateName]}</span>)}</div>
          </div>;
        })}
        {state.assessments.length === 0 && <div className="border border-dashed border-[#d4af37]/30 p-8 text-center text-xs font-bold text-amber-100/55">أنشئ نموذجاً من الأسئلة المفعلة لبدء دورة التشغيل.</div>}
      </section>

      {activeAssessment && <section className="border border-[#d4af37]/35 bg-[#1c120c] p-5 text-amber-50 shadow-lg"><div className="flex items-center justify-between border-b border-amber-500/20 pb-3"><div><h3 className="text-sm font-black text-white">المحاولات والحفظ والاستئناف</h3><p className="mt-1 text-[10px] text-amber-100/55">الإجابة تُحفظ فورياً في النسخة المركزية، ولا تُحتسب نتيجة نهائية قبل التصحيح والاعتماد.</p></div><Timer className="h-5 w-5 text-[#f7d174]" /></div><div className="mt-4 space-y-4">{state.attempts.filter(attempt => attempt.assessmentId === activeAssessment.id).map(attempt => { const remainingSeconds = attempt.deadlineAt ? Math.max(0, Math.ceil((Date.parse(attempt.deadlineAt) - clockMs) / 1000)) : null; return <div key={attempt.id} className="border border-amber-500/20 bg-black/15 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><span className="text-xs font-black text-[#f7d174]">الطالب: {attempt.candidateId}</span><span className="mr-2 text-[10px] text-amber-100/55">{attempt.id}</span></div><div className="flex items-center gap-2"><span className={`border px-2 py-1 text-[10px] font-black ${remainingSeconds !== null && remainingSeconds <= 60 && attempt.status === 'in_progress' ? 'border-rose-400/50 text-rose-200' : 'border-amber-400/30 text-amber-200'}`}>{attempt.status}</span>{attempt.status === 'in_progress' && remainingSeconds !== null && <span className="text-[10px] font-black text-cyan-200">المتبقي: {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}</span>}</div></div>{attempt.status === 'in_progress' && <div className="mt-3 space-y-2">{questionsForAssessment(activeAssessment.id).map(question => <div key={question.id} className="grid grid-cols-1 gap-2 border border-amber-500/15 p-3 md:grid-cols-[1fr_260px_auto]"><div><p className="text-xs font-bold text-amber-50">{question.prompt}</p><span className="text-[9px] text-amber-100/50">{question.points} درجة</span></div>{renderAnswerInput(attempt.id, question)}<button type="button" disabled={!canOperateAttempt || Boolean(busy) || (remainingSeconds !== null && remainingSeconds <= 0)} onClick={() => void commit('attempt.response_autosaved', () => autosaveAssessmentResponse(state, attempt.id, question.id, answerFor(attempt.id, question.id), actorId))} className="flex items-center justify-center gap-1 border border-cyan-400/30 px-3 py-2 text-[10px] font-black text-cyan-200 disabled:opacity-30"><Save className="h-3 w-3" />حفظ الإجابة</button></div>)}<button type="button" disabled={!canOperateAttempt || Boolean(busy)} onClick={() => void commit('attempt.submitted', () => submitAssessmentAttempt(state, attempt.id, actorId))} className="flex items-center gap-2 bg-[#d4af37] px-4 py-2 text-[10px] font-black text-slate-950 disabled:opacity-30"><Send className="h-3 w-3" />{remainingSeconds === 0 ? 'تسليم تلقائي الآن' : 'تسليم المحاولة'}</button></div>}{['submitted', 'marking'].includes(String(attempt.status)) && <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!canMark || Boolean(busy)} onClick={() => void commit('attempt.auto_marked', () => autoMarkAssessmentAttempt(state, attempt.id, actorId))} className="flex items-center gap-1 border border-cyan-400/30 px-3 py-2 text-[10px] font-black text-cyan-200 disabled:opacity-30"><FileCheck2 className="h-3 w-3" />تصحيح آلي</button>{questionsForAssessment(activeAssessment.id).filter(question => ['essay', 'file'].includes(question.type)).map(question => <div key={question.id} className="flex items-center gap-1"><input disabled={!canMark} value={manualScores[`${attempt.id}:${question.id}`] || ''} onChange={event => setManualScores(current => ({ ...current, [`${attempt.id}:${question.id}`]: event.target.value }))} className="w-16 border border-amber-500/30 bg-[#130b04] px-2 py-2 text-[10px] text-amber-50 disabled:opacity-40" placeholder="درجة" /><button type="button" disabled={!canMark || Boolean(busy)} onClick={() => void commit('attempt.manual_marked', () => markManualAssessmentResponse(state, attempt.id, question.id, Number(manualScores[`${attempt.id}:${question.id}`]), actorId))} className="border border-amber-400/30 px-2 py-2 text-[10px] font-black text-amber-200 disabled:opacity-30">تصحيح مقالي/ملف</button></div>)}<button type="button" disabled={!canMark || Boolean(busy)} onClick={() => void commit('attempt.finalized', () => finalizeAssessmentAttempt(state, attempt.id, actorId))} className="flex items-center gap-1 border border-emerald-400/30 px-3 py-2 text-[10px] font-black text-emerald-200 disabled:opacity-30"><CheckCircle className="h-3 w-3" />إنهاء التصحيح</button></div>}{attempt.status === 'marked' && <div className="mt-3 flex items-center gap-2 text-xs font-black text-emerald-200"><CheckCircle className="h-4 w-4" />نتيجة نهائية: {attempt.recordedTotal} من {attempt.maximumTotal}{attempt.autoSubmitted ? ' • تسليم تلقائي' : ''}</div>}</div>; })}{state.attempts.filter(attempt => attempt.assessmentId === activeAssessment.id).length === 0 && <p className="py-6 text-center text-xs font-bold text-amber-100/55">لا توجد محاولات بعد. افتح الامتحان ثم أدخل معرف طالب رسمي.</p>}</div></section>}
    </div>
  );
}
