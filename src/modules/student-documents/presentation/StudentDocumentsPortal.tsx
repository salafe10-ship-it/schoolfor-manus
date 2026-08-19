import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Archive, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, FilePlus2, FileText, History, Loader2, LockKeyhole, RefreshCw, Search, ShieldAlert, X, XCircle } from 'lucide-react';
import type { Student, UserRole } from '../../../types';
import { getTrustedAccessToken } from '../../../utils/auth';

type StudentDocumentRow = {
  id: string;
  student_id: string;
  category_id: string;
  category_code?: string;
  category_name?: string;
  document_reference: string;
  title: string;
  description: string | null;
  lifecycle_status: string;
  verification_status: string;
  classification: string;
  current_version_number: number;
  retention_until: string | null;
  legal_hold: boolean;
  archive_eligible_on: string | null;
  version: number;
};
type DocumentSort = 'canonical' | 'title_asc' | 'reference_asc' | 'version_desc';

type Category = { id: string; category_code: string; display_name: string; status: string };
type DocumentDetails = { document: StudentDocumentRow; versions: Array<Record<string, any>> };
type AccessHistoryRow = { access_type: string; access_result: string; occurred_at: string };
type AccessHistory = { rows: AccessHistoryRow[] };
type DocumentRequestError = Error & { status?: number; errorCode?: string; outcome?: 'failure' | 'unknown' };
type DocumentRegistrationResult = { documentId?: unknown; documentReference?: unknown; versionNumber?: unknown };
type ConfirmedDocumentAction = 'reject' | 'expire' | 'archive' | 'restore';
type PendingDocumentConfirmation = { documentId: string; action: ConfirmedDocumentAction };
type CanonicalMutationExpectation =
  | { operation: 'decision'; decision: 'verify' | 'reject' | 'expire' }
  | { operation: 'archive'; restore: boolean }
  | { operation: 'add_version'; previousVersion: number };

type Props = {
  students: Student[];
  currentRole?: UserRole;
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
};

type MetadataField = 'studentId' | 'categoryId' | 'documentReference' | 'title' | 'originalFileName' | 'mediaType' | 'byteSize' | 'contentHash' | 'retentionUntil' | 'archiveEligibleOn';

const lifecycleLabels: Record<string, string> = {
  draft: 'مسودة', pending_verification: 'بانتظار التحقق', verified: 'موثق', expired: 'منتهي', archived: 'مؤرشف'
};
const verificationLabels: Record<string, string> = {
  not_required: 'غير مطلوب', pending: 'قيد المراجعة', verified: 'موثق', rejected: 'مرفوض', expired: 'منتهي'
};

function authHeaders(idempotency = false): Record<string, string> {
  const token = getTrustedAccessToken();
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(idempotency ? { 'Idempotency-Key': crypto.randomUUID() } : {})
  };
}

async function request<T>(url: string, init: RequestInit = {}, idempotency = false): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: init.signal || controller.signal,
      headers: { ...authHeaders(idempotency), ...(init.headers || {}) }
    });
  } catch (cause: any) {
    const timedOut = cause?.name === 'AbortError';
    const error = new Error(timedOut
      ? 'انتهت مهلة الاتصال ولم يتم تأكيد نتيجة العملية. أعد تحميل البيانات؛ لن تتم إعادة العملية تلقائيًا.'
      : 'تعذر الاتصال بالخادم ولم يتم تأكيد نتيجة العملية. أعد تحميل البيانات؛ لن تتم إعادة العملية تلقائيًا.') as DocumentRequestError;
    error.errorCode = timedOut ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR';
    error.outcome = 'unknown';
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
  const payload = await response.json().catch(() => null) as { data?: T; message?: string; error?: string; errorCode?: string; success?: boolean } | null;
  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || payload?.error || (response.status === 403 ? 'ليس لديك صلاحية لهذا الإجراء.' : 'تعذر إكمال العملية.')) as DocumentRequestError;
    error.status = response.status;
    error.errorCode = payload?.errorCode;
    error.outcome = 'failure';
    throw error;
  }
  const result = payload?.data ?? payload;
  if (result == null) {
    const error = new Error('استجاب الخادم دون نتيجة كانونـية مؤكدة. لم يتم اعتبار العملية ناجحة.') as DocumentRequestError;
    error.errorCode = 'CANONICAL_RESULT_MISSING';
    error.outcome = 'unknown';
    throw error;
  }
  return result as T;
}

function documentErrorMessage(error: any, fallback: string, forbidden = 'ليست لديك الصلاحية لهذا الإجراء.'): string {
  if (error?.status === 401) return 'انتهت جلسة الدخول. أعد تسجيل الدخول ثم أعد المحاولة.';
  if (error?.status === 403) return forbidden;
  if (error?.status === 409 || error?.errorCode === 'CONFLICT_ERROR') return error?.message || 'تغيرت بيانات المستند. حدّث البيانات ثم أعد المحاولة دون الكتابة فوق النسخة الجديدة.';
  if (error?.status === 400 || error?.status === 422) return error?.message || 'راجع البيانات المدخلة ثم أعد المحاولة.';
  if (error?.status >= 500) return 'تعذر إكمال العملية بسبب خطأ مؤقت في الخادم. أعد المحاولة.';
  return error?.message || fallback;
}

function isConflict(error: any): boolean {
  return error?.status === 409 || error?.errorCode === 'CONFLICT_ERROR';
}

function canonicalStudentLabel(id: string): string {
  return `معرّف الطالب: ${id}`;
}

function statusClass(status: string): string {
  if (status === 'verified') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'rejected' || status === 'expired') return 'bg-rose-100 text-rose-800 border-rose-200';
  if (status === 'archived') return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-amber-100 text-amber-900 border-amber-200';
}

function confirmsCanonicalMutation(document: StudentDocumentRow, expectation: CanonicalMutationExpectation): boolean {
  if (expectation.operation === 'decision') {
    if (expectation.decision === 'verify') return document.lifecycle_status === 'verified' && document.verification_status === 'verified';
    if (expectation.decision === 'reject') return document.lifecycle_status === 'draft' && document.verification_status === 'rejected';
    return document.lifecycle_status === 'expired' && document.verification_status === 'expired';
  }
  if (expectation.operation === 'archive') return expectation.restore
    ? document.lifecycle_status === 'draft' && document.verification_status === 'not_required'
    : document.lifecycle_status === 'archived';
  return Number(document.current_version_number) > expectation.previousVersion;
}

function unknownOutcomeError(message: string, errorCode: string): DocumentRequestError {
  const error = new Error(message) as DocumentRequestError;
  error.errorCode = errorCode;
  error.outcome = 'unknown';
  return error;
}

export default function StudentDocumentsPortal({ students, currentRole, triggerNotification }: Props) {
  const [rows, setRows] = useState<StudentDocumentRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lifecycleStatus, setLifecycleStatus] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [classification, setClassification] = useState('');
  const [retention, setRetention] = useState('');
  const [sortKey, setSortKey] = useState<DocumentSort>('canonical');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalKnown, setTotalKnown] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<DocumentDetails | null>(null);
  const [accessHistory, setAccessHistory] = useState<AccessHistory | null>(null);
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [detailBusy, setDetailBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingDocumentConfirmation | null>(null);
  const confirmationCancelRef = useRef<HTMLButtonElement>(null);
  const [showVersion, setShowVersion] = useState(false);
  const [form, setForm] = useState({
    studentId: '', categoryId: '', documentReference: '', title: '', description: '', classification: 'confidential',
    verificationStatus: 'pending', originalFileName: '', mediaType: 'application/pdf', byteSize: '', contentHash: '',
    retentionUntil: '', archiveEligibleOn: '', legalHold: false
  });
  const [formBaseline, setFormBaseline] = useState(form);
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const metadataSubmissionInFlight = useRef(false);
  const actionConfirmationInFlight = useRef(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<MetadataField, string>>>({});
  const [submissionError, setSubmissionError] = useState('');
  const [mutationAnnouncement, setMutationAnnouncement] = useState('');
  const fieldRefs = useRef<Partial<Record<MetadataField, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>>({});
  const formErrorRef = useRef<HTMLDivElement>(null);
  const selectedDocumentIdRef = useRef<string | null>(null);
  const detailRequestSequence = useRef(0);
  const listRequestSequence = useRef(0);

  const canMutate = currentRole === 'SchoolAdmin' || currentRole === 'SuperAdmin';
  const pageCount = totalKnown ? Math.max(1, Math.ceil(total / 25)) : 1;
  const hasActiveFilters = Boolean(search.trim() || studentId || categoryId || lifecycleStatus || verificationStatus || classification || retention);
  const displayedRows = useMemo(() => {
    if (sortKey === 'canonical') return rows;
    const collator = new Intl.Collator('ar', { numeric: true, sensitivity: 'base' });
    return [...rows].sort((left, right) => {
      const primary = sortKey === 'title_asc'
        ? collator.compare(left.title, right.title)
        : sortKey === 'reference_asc'
          ? collator.compare(left.document_reference, right.document_reference)
          : Number(right.current_version_number) - Number(left.current_version_number);
      return primary || left.id.localeCompare(right.id);
    });
  }, [rows, sortKey]);
  const formDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(formBaseline), [form, formBaseline]);
  const selectedLifecycle = selected?.document.lifecycle_status;
  const selectedToday = new Date().toISOString().slice(0, 10);
  const selectedHasCurrentVersion = Boolean(selected
    && Number(selected.document.current_version_number) > 0
    && selected.document.lifecycle_status !== 'archived'
    && selected.document.lifecycle_status !== 'expired'
    && !selected.document.legal_hold);
  const canVerifySelected = canMutate && selectedLifecycle === 'pending_verification' && selectedHasCurrentVersion;
  const canExpireSelected = canMutate && selectedLifecycle !== 'archived' && selectedLifecycle !== 'expired'
    && selectedHasCurrentVersion && !selected?.document.legal_hold
    && Boolean(selected?.document.retention_until && selected.document.retention_until <= selectedToday);
  const canArchiveSelected = canMutate && selectedLifecycle !== 'archived' && !selected?.document.legal_hold
    && Boolean(selected?.document.archive_eligible_on && selected.document.archive_eligible_on <= selectedToday);
  const confirmationTargetIsCurrent = Boolean(pendingConfirmation && selected && selected.document.id === pendingConfirmation.documentId);
  const confirmationActionLabels: Record<ConfirmedDocumentAction, string> = { reject: 'رفض المستند', expire: 'إنهاء المستند', archive: 'أرشفة المستند', restore: 'استعادة المستند' };
  const confirmationActionDescription = pendingConfirmation?.action === 'restore'
    ? 'ستُعاد حالة المستند وفق العقد الحالي للخدمة.'
    : 'سيتم تغيير حالة المستند بعد تأكيدك، ولن تُنفذ العملية عند الإلغاء.';

  const focusFormField = (field: MetadataField) => {
    setTimeout(() => fieldRefs.current[field]?.focus(), 0);
  };

  const loadCategories = useCallback(async () => {
    try { setCategories(await request<Category[]>('/api/student-document-categories')); }
    catch (err) { setError(documentErrorMessage(err, 'تعذر تحميل تصنيفات المستندات.', 'ليست لديك صلاحية عرض تصنيفات المستندات.')); }
  }, []);

  const loadDocuments = useCallback(async () => {
    const requestSequence = ++listRequestSequence.current;
    setBusy(true); setError('');
    const query = new URLSearchParams({ page: String(page), limit: '25' });
    if (search.trim()) query.set('search', search.trim());
    if (studentId) query.set('studentId', studentId);
    if (categoryId) query.set('categoryId', categoryId);
    if (lifecycleStatus) query.set('lifecycleStatus', lifecycleStatus);
    if (verificationStatus) query.set('verificationStatus', verificationStatus);
    if (classification) query.set('classification', classification);
    if (retention) query.set('retention', retention);
    try {
      const response = await fetch(`/api/student-documents?${query.toString()}`, { headers: authHeaders() });
      const payload = await response.json().catch(() => null) as { data?: StudentDocumentRow[]; meta?: { total?: number }; message?: string; errorCode?: string; success?: boolean } | null;
      if (!response.ok || payload?.success === false) throw Object.assign(new Error(payload?.message || 'تعذر تحميل مستندات الطلاب.'), { status: response.status, errorCode: payload?.errorCode });
      if (requestSequence !== listRequestSequence.current) return true;
      const nextRows = payload?.data || [];
      const serverTotal = payload?.meta?.total;
      const hasKnownTotal = typeof serverTotal === 'number' && Number.isFinite(serverTotal);
      setRows(nextRows); setTotalKnown(hasKnownTotal); setTotal(hasKnownTotal ? Number(serverTotal) : nextRows.length);
      if (selectedDocumentIdRef.current && !nextRows.some(row => row.id === selectedDocumentIdRef.current)) {
        selectedDocumentIdRef.current = null;
        setSelected(null); setAccessHistory(null); setAccessError(''); setActionReason(''); setShowVersion(false);
      }
      return true;
    } catch (err: any) {
      if (requestSequence !== listRequestSequence.current) return true;
      setRows([]); setTotal(0); setTotalKnown(true);
      selectedDocumentIdRef.current = null;
      setSelected(null); setAccessHistory(null); setAccessError(''); setActionReason(''); setShowVersion(false);
      setError(documentErrorMessage(err, 'تعذر تحميل مستندات الطلاب.', 'ليست لديك صلاحية عرض مستندات الطلاب.'));
      return false;
    } finally { if (requestSequence === listRequestSequence.current) setBusy(false); }
  }, [categoryId, classification, lifecycleStatus, page, retention, search, studentId, verificationStatus]);

  const refreshCanonicalAfterMutation = async (documentId: string, expectation: CanonicalMutationExpectation): Promise<void> => {
    const listRefreshed = await loadDocuments();
    if (!listRefreshed) {
      closeDetail();
      throw new Error('تم تنفيذ العملية الكانونية، لكن تعذر تحديث قائمة المستندات. أعد تحميل البيانات للتحقق من الحالة.');
    }
    try {
      const canonicalDetails = await request<DocumentDetails>(`/api/student-documents/${documentId}`);
      selectedDocumentIdRef.current = documentId;
      setSelected(canonicalDetails);
      setAccessHistory(null);
      setAccessError('');
      if (!confirmsCanonicalMutation(canonicalDetails.document, expectation)) {
        const outcomeError = new Error('تم تنفيذ الطلب، لكن لم تُثبت النتيجة النهائية من الحالة الكانونية. لم يتم إعلان النجاح.') as DocumentRequestError & { canonicalMismatch?: boolean };
        outcomeError.outcome = 'unknown';
        outcomeError.canonicalMismatch = true;
        throw outcomeError;
      }
    } catch (err: any) {
      if (err?.canonicalMismatch) throw err;
      closeDetail();
      throw new Error('تم تنفيذ العملية الكانونية، لكن تعذر تحديث تفاصيل المستند. أعد فتح السجل للتحقق من الحالة.');
    }
  };

  const retryMetadata = useCallback(async () => {
    await Promise.all([loadCategories(), loadDocuments()]);
    if (selected) {
      try {
        const canonicalDetails = await request<DocumentDetails>(`/api/student-documents/${selected.document.id}`);
        selectedDocumentIdRef.current = selected.document.id;
        setSelected(canonicalDetails);
        setAccessHistory(null);
        setAccessError('');
        setError('');
      } catch (err: any) {
        setError(documentErrorMessage(err, 'تعذر إعادة مزامنة تفاصيل المستند.', 'ليست لديك صلاحية إعادة مزامنة هذا السجل.'));
      }
    }
  }, [loadCategories, loadDocuments, selected]);

  useEffect(() => { void loadCategories(); }, [loadCategories]);
  useEffect(() => { void loadDocuments(); }, [loadDocuments]);
  useEffect(() => {
    if (!pendingConfirmation || !selected || selected.document.id !== pendingConfirmation.documentId) setPendingConfirmation(null);
  }, [pendingConfirmation, selected]);
  useEffect(() => {
    if (pendingConfirmation && confirmationTargetIsCurrent) setTimeout(() => confirmationCancelRef.current?.focus(), 0);
  }, [pendingConfirmation, confirmationTargetIsCurrent]);

  const openDetails = async (id: string) => {
    const requestSequence = ++detailRequestSequence.current;
    selectedDocumentIdRef.current = null;
    setSelected(null); setPendingConfirmation(null); setDetailBusy(true); setAccessHistory(null); setAccessError(''); setActionReason(''); setShowVersion(false); setError('');
    try {
      const data = await request<DocumentDetails>(`/api/student-documents/${id}`);
      if (requestSequence !== detailRequestSequence.current) return;
      selectedDocumentIdRef.current = id;
      setSelected(data);
    } catch (err: any) {
      if (requestSequence === detailRequestSequence.current) setError(documentErrorMessage(err, 'تعذر فتح السجل.', 'ليست لديك صلاحية فتح هذا السجل.'));
    }
    finally { if (requestSequence === detailRequestSequence.current) setDetailBusy(false); }
  };

  const loadAccessHistory = async () => {
    if (!selected) return;
    setAccessBusy(true); setAccessError('');
    try {
      const data = await request<AccessHistoryRow[]>(`/api/student-documents/${selected.document.id}/access-log`);
      const rows = Array.isArray(data) ? data.map(log => ({
        access_type: String(log.access_type || 'غير محدد'),
        access_result: String(log.access_result || 'غير محدد'),
        occurred_at: String(log.occurred_at || '')
      })) : [];
      setAccessHistory({ rows });
    } catch (err: any) {
      setAccessHistory(null);
      setAccessError(documentErrorMessage(err, 'تعذر تحميل سجل الوصول.', 'ليست لديك صلاحية عرض سجل الوصول.'));
    } finally { setAccessBusy(false); }
  };

  const closeDetail = () => { detailRequestSequence.current += 1; selectedDocumentIdRef.current = null; setSelected(null); setPendingConfirmation(null); setAccessHistory(null); setAccessError(''); setActionReason(''); setShowVersion(false); };

  const requestActionConfirmation = (action: ConfirmedDocumentAction) => {
    if (!selected || actionBusy || !canMutate) return;
    setPendingConfirmation({ documentId: selected.document.id, action });
  };

  const confirmPendingAction = async () => {
    if (!pendingConfirmation || !confirmationTargetIsCurrent || actionBusy || actionConfirmationInFlight.current) return;
    const { action, documentId } = pendingConfirmation;
    if (!selected || selected.document.id !== documentId) { setPendingConfirmation(null); return; }
    setPendingConfirmation(null);
    actionConfirmationInFlight.current = true;
    try {
      if (action === 'reject' || action === 'expire') await decide(action);
      else await archive(action === 'restore');
    } finally {
      actionConfirmationInFlight.current = false;
    }
  };

  const requestCloseCreate = () => {
    if (formDirty) { setDiscardPrompt(true); return; }
    setShowCreate(false);
  };

  const discardCreate = () => {
    setForm(formBaseline);
    setDiscardPrompt(false);
    setShowCreate(false);
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!canMutate) return;
    setSubmissionError('');
    if (!formDirty) {
      triggerNotification('لا توجد تغييرات metadata لإرسالها.', 'warning');
      return;
    }
    const normalized = {
      ...form,
      studentId: form.studentId.trim(),
      categoryId: form.categoryId.trim(),
      documentReference: form.documentReference.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      originalFileName: form.originalFileName.trim(),
      mediaType: form.mediaType.trim().toLowerCase(),
      byteSize: form.byteSize.trim(),
      contentHash: form.contentHash.trim(),
      retentionUntil: form.retentionUntil.trim(),
      archiveEligibleOn: form.archiveEligibleOn.trim()
    };
    const required = [normalized.studentId, normalized.categoryId, normalized.documentReference, normalized.title, normalized.originalFileName, normalized.mediaType, normalized.byteSize, normalized.contentHash];
    const mediaTypeValid = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/.test(normalized.mediaType);
    const byteSize = Number(normalized.byteSize);
    const datesValid = (!normalized.retentionUntil || /^\d{4}-\d{2}-\d{2}$/.test(normalized.retentionUntil)) && (!normalized.archiveEligibleOn || /^\d{4}-\d{2}-\d{2}$/.test(normalized.archiveEligibleOn));
    const datesOrdered = !normalized.retentionUntil || !normalized.archiveEligibleOn || normalized.archiveEligibleOn <= normalized.retentionUntil;
    const nextErrors: Partial<Record<MetadataField, string>> = {};
    if (!normalized.studentId) nextErrors.studentId = 'اختر الطالب.';
    if (!normalized.categoryId) nextErrors.categoryId = 'اختر التصنيف.';
    if (!normalized.documentReference) nextErrors.documentReference = 'أدخل المرجع.';
    else if (normalized.documentReference.length > 160) nextErrors.documentReference = 'المرجع أطول من الحد المسموح.';
    if (!normalized.title) nextErrors.title = 'أدخل العنوان.';
    else if (normalized.title.length > 250) nextErrors.title = 'العنوان أطول من الحد المسموح.';
    if (!normalized.originalFileName) nextErrors.originalFileName = 'أدخل اسم الملف الوصفي.';
    else if (normalized.originalFileName.length > 255 || normalized.originalFileName.includes('/') || normalized.originalFileName.includes('\\') || normalized.originalFileName === '.' || normalized.originalFileName === '..') nextErrors.originalFileName = 'اسم الملف الوصفي غير صالح.';
    if (!normalized.mediaType || !mediaTypeValid) nextErrors.mediaType = 'أدخل نوع محتوى صالحًا.';
    if (!normalized.byteSize || !Number.isInteger(byteSize) || byteSize < 0 || byteSize > 500 * 1024 * 1024) nextErrors.byteSize = 'أدخل حجمًا صحيحًا ضمن الحد المسموح.';
    if (!normalized.contentHash || normalized.contentHash.length < 32 || !/^[a-z0-9:_-]+$/i.test(normalized.contentHash)) nextErrors.contentHash = 'مرجع سلامة المحتوى غير صالح.';
    if (normalized.retentionUntil && !/^\d{4}-\d{2}-\d{2}$/.test(normalized.retentionUntil)) nextErrors.retentionUntil = 'تاريخ الاحتفاظ غير صالح.';
    if (normalized.archiveEligibleOn && !/^\d{4}-\d{2}-\d{2}$/.test(normalized.archiveEligibleOn)) nextErrors.archiveEligibleOn = 'تاريخ الأرشفة غير صالح.';
    if (!nextErrors.retentionUntil && !nextErrors.archiveEligibleOn && !datesOrdered) nextErrors.archiveEligibleOn = 'يجب ألا يسبق تاريخ الأرشفة تاريخ الاحتفاظ.';
    if (Object.keys(nextErrors).length) {
      setFormErrors(nextErrors);
      setMutationAnnouncement('يوجد خطأ في بيانات metadata. راجع الحقول المحددة.');
      triggerNotification('راجع الحقول المطلوبة وقيم metadata غير الصالحة قبل الحفظ.', 'warning');
      focusFormField(Object.keys(nextErrors)[0] as MetadataField);
      return;
    }
    setFormErrors({});
    if (metadataSubmissionInFlight.current) return;
    metadataSubmissionInFlight.current = true;
    setMutationAnnouncement('جارٍ حفظ metadata…');
    setActionBusy(true);
    try {
      const registration = await request<DocumentRegistrationResult>(`/api/students/${normalized.studentId}/documents`, {
        method: 'POST', body: JSON.stringify({ ...normalized, byteSize, retentionUntil: normalized.retentionUntil || null, archiveEligibleOn: normalized.archiveEligibleOn || null })
      }, true);
      const documentId = typeof registration?.documentId === 'string' ? registration.documentId.trim() : '';
      if (!documentId) throw unknownOutcomeError('تم حفظ الطلب مبدئيًا، لكن الخادم لم يُرجع معرّف المستند الكانوني. لم يتم إعلان العملية ناجحة.', 'CANONICAL_DOCUMENT_ID_MISSING');
      const canonicalDetails = await request<DocumentDetails>(`/api/student-documents/${documentId}`);
      const canonicalDocument = canonicalDetails?.document;
      const canonicalMatches = Boolean(canonicalDocument)
        && canonicalDocument.id === documentId
        && canonicalDocument.student_id === normalized.studentId
        && canonicalDocument.document_reference === normalized.documentReference
        && canonicalDocument.title === normalized.title
        && Number(canonicalDocument.current_version_number) === 1;
      if (!canonicalMatches) throw unknownOutcomeError('تم حفظ الطلب مبدئيًا، لكن لم يُثبت السجل المطابق من التفاصيل الكانونية. لم يتم إعلان العملية ناجحة.', 'CANONICAL_DOCUMENT_MISMATCH');
      await loadDocuments();
      const nextForm = { ...normalized, byteSize: '', documentReference: '', title: '', description: '', originalFileName: '', contentHash: '' };
      setShowCreate(false); setDiscardPrompt(false); setPage(1); setForm(nextForm); setFormBaseline(nextForm);
      setSubmissionError('');
      setMutationAnnouncement('تم حفظ metadata بنجاح.');
      triggerNotification('تم تسجيل بيانات المستند بنجاح.', 'success');
    } catch (err: any) { const message = documentErrorMessage(err, 'تعذر تسجيل المستند.', 'ليست لديك صلاحية إنشاء مستندات.'); setSubmissionError(message); setMutationAnnouncement(message); triggerNotification(message, 'warning'); if (isConflict(err)) setError(message); setTimeout(() => formErrorRef.current?.focus(), 0); }
    finally { metadataSubmissionInFlight.current = false; setActionBusy(false); }
  };

  const decide = async (decision: 'verify' | 'reject' | 'expire') => {
    if (!selected || !actionReason.trim() || !canMutate) return;
    setActionBusy(true);
    try {
      await request(`/api/student-documents/${selected.document.id}/verification`, { method: 'POST', body: JSON.stringify({ decision, reason: actionReason, expectedVersion: selected.document.version }) }, true);
      await refreshCanonicalAfterMutation(selected.document.id, { operation: 'decision', decision });
      triggerNotification('تم حفظ قرار المستند وتسجيله تدقيقيًا.', 'success'); closeDetail();
    } catch (err: any) { const message = documentErrorMessage(err, 'تعذر حفظ القرار.', 'ليست لديك صلاحية اتخاذ هذا القرار.'); setMutationAnnouncement(message); triggerNotification(message, 'warning'); if (isConflict(err)) setError(message); }
    finally { setActionBusy(false); }
  };

  const archive = async (restore = false) => {
    if (!selected || !actionReason.trim() || !canMutate) return;
    setActionBusy(true);
    try {
      await request(`/api/student-documents/${selected.document.id}/archive`, { method: 'POST', body: JSON.stringify({ restore, reason: actionReason, expectedVersion: selected.document.version }) }, true);
      await refreshCanonicalAfterMutation(selected.document.id, { operation: 'archive', restore });
      triggerNotification(restore ? 'تمت استعادة المستند.' : 'تمت أرشفة المستند.', 'success'); closeDetail();
    } catch (err: any) { const message = documentErrorMessage(err, 'تعذر تغيير حالة الأرشفة.', 'ليست لديك صلاحية تغيير حالة الأرشفة.'); setMutationAnnouncement(message); triggerNotification(message, 'warning'); if (isConflict(err)) setError(message); }
    finally { setActionBusy(false); }
  };

  const addVersion = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !canMutate) return;
    const target = event.currentTarget as HTMLFormElement;
    const data = new FormData(target);
    setActionBusy(true);
    try {
      await request(`/api/student-documents/${selected.document.id}/versions`, { method: 'POST', body: JSON.stringify({ revisionReason: data.get('revisionReason'), originalFileName: data.get('originalFileName'), mediaType: data.get('mediaType'), byteSize: Number(data.get('byteSize')), contentHash: data.get('contentHash') }) }, true);
      await refreshCanonicalAfterMutation(selected.document.id, { operation: 'add_version', previousVersion: selected.document.current_version_number });
      triggerNotification('تم إنشاء إصدار جديد للمستند.', 'success'); closeDetail();
    } catch (err: any) { const message = documentErrorMessage(err, 'تعذر إنشاء الإصدار.', 'ليست لديك صلاحية إنشاء إصدار.'); setMutationAnnouncement(message); triggerNotification(message, 'warning'); if (isConflict(err)) setError(message); }
    finally { setActionBusy(false); }
  };

  const resetSelectedForFilterChange = () => { detailRequestSequence.current += 1; selectedDocumentIdRef.current = null; setSelected(null); setPendingConfirmation(null); setAccessHistory(null); setAccessError(''); setActionReason(''); setShowVersion(false); };
  const resetFilters = () => { resetSelectedForFilterChange(); setSearch(''); setStudentId(''); setCategoryId(''); setLifecycleStatus(''); setVerificationStatus(''); setClassification(''); setRetention(''); setPage(1); };

  return <section className="min-h-full overflow-x-hidden bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] text-slate-900 p-4 sm:p-6" dir="rtl" aria-labelledby="student-documents-title">
    <div className="max-w-7xl min-w-0 mx-auto space-y-5">
      <div className="sr-only" aria-live="polite" aria-atomic="true">{mutationAnnouncement}</div>
      <header className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between border-b border-amber-200 pb-4">
        <div><div className="flex items-center gap-2 text-amber-800 text-xs font-black"><FileText className="w-4 h-4" /> شؤون الطلاب / المستندات</div><h2 id="student-documents-title" className="text-2xl font-black mt-1">مركز مستندات الطلاب</h2><p className="text-sm text-slate-500 mt-1">بيانات وصفية وإصدارات وسجل وصول ضمن النطاق الموثوق. رفع الملفات الثنائية وتنزيلها ومعاينتها وOCR والمسح الضوئي غير متاحة في هذا المسار.</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => void loadDocuments()} className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-black text-amber-900 hover:bg-amber-50" aria-label="تحديث قائمة المستندات"><RefreshCw className={`w-4 h-4 inline ml-1 ${busy ? 'animate-spin' : ''}`} /> تحديث</button>{canMutate && <button type="button" onClick={() => { const nextForm = { studentId: studentId || students[0]?.id || '', categoryId: '', documentReference: '', title: '', description: '', classification: 'confidential', verificationStatus: 'pending', originalFileName: '', mediaType: 'application/pdf', byteSize: '', contentHash: '', retentionUntil: '', archiveEligibleOn: '', legalHold: false }; setForm(nextForm); setFormBaseline(nextForm); setFormErrors({}); setSubmissionError(''); setDiscardPrompt(false); setShowCreate(true); }} className="rounded-xl bg-[#2a1a0e] px-4 py-2 text-xs font-black text-amber-200 hover:bg-[#422914]" aria-label="تسجيل بيانات مستند جديد"><FilePlus2 className="w-4 h-4 inline ml-1" /> تسجيل مستند</button>}</div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-white border border-amber-200 rounded-2xl p-4 shadow-sm">
        <label className="text-xs font-bold">بحث<input value={search} onChange={e => { resetSelectedForFilterChange(); setSearch(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="العنوان أو المرجع" /></label>
        <label className="text-xs font-bold">الطالب<select value={studentId} onChange={e => { resetSelectedForFilterChange(); setStudentId(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">كل الطلاب</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="text-xs font-bold">التصنيف<select value={categoryId} onChange={e => { resetSelectedForFilterChange(); setCategoryId(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">كل التصنيفات</option>{categories.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}</select></label>
        <label className="text-xs font-bold">الحالة<select value={lifecycleStatus} onChange={e => { resetSelectedForFilterChange(); setLifecycleStatus(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">كل الحالات</option>{Object.entries(lifecycleLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
        <label className="text-xs font-bold">التحقق<select value={verificationStatus} onChange={e => { resetSelectedForFilterChange(); setVerificationStatus(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">كل حالات التحقق</option>{Object.entries(verificationLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
        <label className="text-xs font-bold">السرية<select value={classification} onChange={e => { resetSelectedForFilterChange(); setClassification(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">كل التصنيفات</option>{['public', 'internal', 'confidential', 'restricted', 'highly_confidential'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="text-xs font-bold">الاحتفاظ<select value={retention} onChange={e => { resetSelectedForFilterChange(); setRetention(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">كل السجلات</option><option value="due">مستحق الأرشفة</option><option value="held">قيد قانوني</option><option value="eligible">مؤهل للأرشفة</option></select></label>
        <label className="text-xs font-bold">ترتيب النتائج<select aria-label="ترتيب النتائج" value={sortKey} onChange={e => setSortKey(e.target.value as DocumentSort)} aria-describedby="student-documents-sort-help" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="canonical">الترتيب الكانوني الحالي</option><option value="title_asc">العنوان تصاعديًا</option><option value="reference_asc">المرجع تصاعديًا</option><option value="version_desc">الإصدار تنازليًا</option></select><span id="student-documents-sort-help" className="mt-1 block text-[11px] font-normal text-slate-500">يطبق على النتائج المعروضة حاليًا فقط.</span></label>
        <button type="button" onClick={resetFilters} className="self-end rounded-lg border border-slate-300 px-3 py-2 text-xs font-black hover:bg-slate-50">مسح الفلاتر</button>
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800"><span><ShieldAlert className="w-4 h-4 inline ml-1" />{error}</span><button type="button" onClick={() => void retryMetadata()} disabled={busy} className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-black text-rose-900 disabled:opacity-50">إعادة المحاولة</button></div>}
      {detailBusy && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900"><Loader2 className="w-4 h-4 inline ml-1 animate-spin" />جاري تحميل بيانات المستند الكانونية…</div>}
      <div className="rounded-2xl border border-amber-200 bg-white overflow-x-auto shadow-sm">
        <table className="w-full min-w-[900px] text-sm"><caption className="sr-only">قائمة مستندات الطلاب</caption><thead className="bg-amber-50 text-slate-700"><tr>{['العنوان والمرجع', 'الطالب / المعرّف', 'التصنيف', 'الحالة', 'التحقق', 'الإصدار', 'الإجراء'].map(label => <th key={label} scope="col" className="px-4 py-3 text-right font-black">{label}</th>)}</tr></thead><tbody>
          {busy ? <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="mx-auto animate-spin text-amber-700" /><span className="block mt-2 text-sm font-bold">جاري تحميل المستندات…</span></td></tr> : error ? <tr><td colSpan={7} className="p-12 text-center text-rose-700"><span className="font-bold">تعذر عرض القائمة الحالية. استخدم إعادة المحاولة.</span></td></tr> : rows.length === 0 ? <tr><td colSpan={7} className="p-12 text-center text-slate-500"><FileText className="mx-auto mb-2" />{hasActiveFilters ? <><span className="block font-bold">لا توجد مستندات تطابق البحث والفلاتر الحالية.</span><button type="button" onClick={resetFilters} className="mt-3 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-black text-amber-900 hover:bg-amber-50">مسح الفلاتر وعرض القائمة</button></> : <span className="font-bold">لا توجد مستندات ضمن النطاق والفلاتر الحالية.</span>}</td></tr> : displayedRows.map(row => <tr key={row.id} className="border-t border-slate-100 hover:bg-amber-50/40"><td className="px-4 py-3"><div className="font-black">{row.title}</div><div className="text-xs text-slate-500 font-mono">{row.document_reference}</div></td><td className="px-4 py-3 font-bold">{canonicalStudentLabel(row.student_id)}</td><td className="px-4 py-3">{row.category_name || row.category_code || 'غير متوفر'}</td><td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-xs font-bold ${statusClass(row.lifecycle_status)}`}>{lifecycleLabels[row.lifecycle_status] || row.lifecycle_status}</span></td><td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-xs font-bold ${statusClass(row.verification_status)}`}>{verificationLabels[row.verification_status] || row.verification_status}</span></td><td className="px-4 py-3 font-mono">v{row.current_version_number}</td><td className="px-4 py-3"><button type="button" onClick={() => void openDetails(row.id)} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-black text-amber-900 hover:bg-amber-50"><Eye className="w-3.5 h-3.5 inline ml-1" /> فتح التفاصيل</button></td></tr>)}</tbody></table>
      </div>
      <div className="flex items-center justify-between text-xs font-bold text-slate-600"><span>{totalKnown ? 'إجمالي السجلات' : 'النتائج المعروضة'}: {total}{!totalKnown && <span className="mr-2 text-amber-800">العدد الكلي غير متاح من العقد الحالي.</span>}</span><div className="flex items-center gap-2"><button type="button" aria-label="الصفحة السابقة" disabled={page <= 1 || busy || !totalKnown} onClick={() => setPage(p => p - 1)} className="rounded-lg border px-2 py-1 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button><span>صفحة {page} من {pageCount}</span><button type="button" aria-label="الصفحة التالية" disabled={page >= pageCount || busy || !totalKnown} onClick={() => setPage(p => p + 1)} className="rounded-lg border px-2 py-1 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button></div></div>
    </div>

    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="document-detail-title"><div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between border-b pb-3"><div><h3 id="document-detail-title" className="text-xl font-black">{selected.document.title}</h3><p className="text-xs text-slate-500">معرّف الطالب: {selected.document.student_id} • {selected.document.document_reference}</p></div><button type="button" onClick={closeDetail} className="rounded-lg p-2 hover:bg-slate-100" aria-label="إغلاق التفاصيل"><X /></button></div><div className="grid gap-3 py-4 md:grid-cols-3 text-sm"><div><b>الحالة:</b> {lifecycleLabels[selected.document.lifecycle_status] || selected.document.lifecycle_status}</div><div><b>التحقق:</b> {verificationLabels[selected.document.verification_status] || selected.document.verification_status}</div><div><b>التصنيف:</b> {selected.document.classification}</div><div><b>الإصدار الحالي:</b> v{selected.document.current_version_number}</div><div><b>الاحتفاظ حتى:</b> {selected.document.retention_until || 'غير متوفر'}</div><div><b>القفل القانوني:</b> {selected.document.legal_hold ? 'نعم' : 'لا'}</div></div><div className="grid gap-4 lg:grid-cols-2"><div className="rounded-xl border p-4"><h4 className="mb-3 flex items-center gap-2 font-black"><History className="w-4 h-4" /> سجل الإصدارات</h4>{selected.versions.length ? <ul className="space-y-2">{selected.versions.map(version => <li key={version.id} className="rounded-lg bg-slate-50 p-3 text-xs"><div className="flex justify-between font-bold"><span>الإصدار v{version.version_number} {version.is_current ? '• الحالي' : ''}</span><span>{version.original_file_name}</span></div><div className="mt-1 text-slate-500">{version.media_type} • {Number(version.byte_size || 0).toLocaleString()} bytes • {version.revision_reason || 'غير متوفر'}</div></li>)}</ul> : <p className="text-sm text-slate-500">لا توجد إصدارات.</p>}</div><div className="rounded-xl border p-4"><div className="flex items-center justify-between mb-3"><h4 className="flex items-center gap-2 font-black"><Clock3 className="w-4 h-4" /> سجل الوصول</h4><button type="button" disabled={accessBusy || actionBusy} onClick={() => void loadAccessHistory()} className="text-xs font-black text-amber-800 hover:underline disabled:opacity-50">{accessBusy ? 'جاري التحميل…' : 'تحميل'}</button></div>{accessBusy ? <div role="status" className="text-sm text-slate-500">جاري تحميل سجل الوصول…</div> : accessError ? <div role="alert" className="space-y-2 text-sm text-rose-700"><div>{accessError}</div><button type="button" disabled={actionBusy} onClick={() => void loadAccessHistory()} className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-black disabled:opacity-50">إعادة المحاولة</button></div> : accessHistory ? (accessHistory.rows.length ? <ul className="space-y-2 max-h-56 overflow-y-auto">{accessHistory.rows.map((log, index) => <li key={`${log.occurred_at}-${log.access_type}-${index}`} className="rounded-lg bg-slate-50 p-2 text-xs"><b>{log.access_type}</b> • {log.access_result}<div className="text-slate-500">{log.occurred_at ? new Date(log.occurred_at).toLocaleString('ar') : 'وقت غير متاح'}</div></li>)}</ul> : <p className="text-sm text-slate-500">لا توجد أحداث وصول ضمن النطاق الحالي.</p>) : <p className="text-sm text-slate-500">سجل الوصول مخفي حتى طلبه صراحة.</p>}</div></div>{canMutate && selectedLifecycle !== 'archived' && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><label className="text-xs font-black">سبب الإجراء (إلزامي)<textarea value={actionReason} onChange={e => setActionReason(e.target.value)} className="mt-1 w-full rounded-lg border border-amber-300 p-2 text-sm" rows={2} /></label><div className="mt-3 flex flex-wrap gap-2">{canVerifySelected && <><button type="button" disabled={actionBusy || !actionReason.trim()} onClick={() => void decide('verify')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white disabled:opacity-40"><CheckCircle2 className="w-4 h-4 inline ml-1" /> توثيق</button><button type="button" disabled={actionBusy || !actionReason.trim()} onClick={() => requestActionConfirmation('reject')} className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-black text-white disabled:opacity-40"><XCircle className="w-4 h-4 inline ml-1" /> رفض</button></>}{canExpireSelected && <button type="button" disabled={actionBusy || !actionReason.trim()} onClick={() => requestActionConfirmation('expire')} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-black text-white disabled:opacity-40">إنهاء</button>}{canArchiveSelected && <button type="button" disabled={actionBusy || !actionReason.trim()} onClick={() => requestActionConfirmation('archive')} className="rounded-lg border border-slate-400 px-3 py-2 text-xs font-black disabled:opacity-40"><Archive className="w-4 h-4 inline ml-1" /> أرشفة</button>}{selectedHasCurrentVersion && <button type="button" disabled={actionBusy} onClick={() => setShowVersion(true)} className="rounded-lg border border-amber-400 px-3 py-2 text-xs font-black disabled:opacity-40">إصدار جديد</button>}</div></div>}{canMutate && selected.document.lifecycle_status === 'archived' && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><label className="text-xs font-black">سبب الاستعادة<textarea value={actionReason} onChange={e => setActionReason(e.target.value)} className="mt-1 w-full rounded-lg border border-amber-300 p-2 text-sm" rows={2} /></label><button type="button" disabled={actionBusy || !actionReason.trim()} onClick={() => requestActionConfirmation('restore')} className="mt-2 rounded-lg bg-amber-700 px-3 py-2 text-xs font-black text-white disabled:opacity-40">استعادة المستند</button></div>}{showVersion && <form onSubmit={addVersion} className="mt-4 grid gap-2 rounded-xl border border-slate-200 p-4 md:grid-cols-2"><input name="originalFileName" required placeholder="اسم الملف الوصفي" className="rounded-lg border p-2 text-sm" /><input name="mediaType" required defaultValue="application/pdf" placeholder="MIME type" className="rounded-lg border p-2 text-sm" /><input name="byteSize" required type="number" min="0" placeholder="الحجم بالبايت" className="rounded-lg border p-2 text-sm" /><input name="contentHash" required minLength={32} placeholder="مرجع سلامة المحتوى" className="rounded-lg border p-2 text-sm" /><input name="revisionReason" required placeholder="سبب الإصدار" className="rounded-lg border p-2 text-sm md:col-span-2" /><button disabled={actionBusy} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white md:col-span-2">حفظ الإصدار</button></form>}</div></div>}
{confirmationTargetIsCurrent && pendingConfirmation && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4" role="presentation" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setPendingConfirmation(null); } }}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="document-action-confirmation-title" aria-describedby="document-action-confirmation-description"><h3 id="document-action-confirmation-title" className="text-lg font-black">{confirmationActionLabels[pendingConfirmation.action]}</h3><p id="document-action-confirmation-description" className="mt-2 text-sm text-slate-700">{confirmationActionDescription}</p><div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs"><div className="font-black">{selected.document.title}</div><div className="mt-1 font-mono text-slate-600">{selected.document.document_reference}</div></div><div className="mt-4 flex justify-end gap-2"><button ref={confirmationCancelRef} type="button" onClick={() => setPendingConfirmation(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black">إلغاء</button><button type="button" disabled={actionBusy} onClick={() => void confirmPendingAction()} className="rounded-lg bg-[#2a1a0e] px-3 py-2 text-xs font-black text-amber-200 disabled:opacity-40">تأكيد العملية</button></div></div></div>}    {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="create-document-title"><form onSubmit={submitCreate} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between border-b pb-3"><h3 id="create-document-title" className="text-xl font-black">تسجيل بيانات مستند</h3><button type="button" onClick={requestCloseCreate} aria-label="إغلاق النموذج"><X /></button></div><p className="my-3 rounded-lg bg-sky-50 p-3 text-xs font-bold text-sky-900">هذا النموذج يسجل metadata فقط. لا يتم إرسال محتوى ملف أو رابط تخزين.</p>{formDirty && <div role="status" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-black text-amber-900">لديك بيانات غير محفوظة. لن يتم إرسالها إلا بعد نجاح الحفظ الكانوني.</div>}{discardPrompt && <div role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-black text-rose-900"><div>لديك تغييرات غير محفوظة. هل تريد إغلاق النموذج وفقدانها؟</div><div className="mt-2 flex gap-2"><button type="button" onClick={() => setDiscardPrompt(false)} className="rounded-lg border px-3 py-1">متابعة التحرير</button><button type="button" onClick={discardCreate} className="rounded-lg bg-rose-700 px-3 py-1 text-white">إغلاق دون حفظ</button></div></div>}{(Object.keys(formErrors).length > 0 || submissionError) && <div ref={formErrorRef} tabIndex={-1} role="alert" aria-live="assertive" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-black text-rose-900">{submissionError || `راجع الحقول المحددة قبل الحفظ: ${Object.values(formErrors).join(" ")}`}</div>}<div className="grid gap-3 py-2 md:grid-cols-2">{[['الطالب','studentId',form.studentId, (value: string) => setForm(f => ({ ...f, studentId: value }))],['التصنيف','categoryId',form.categoryId, (value: string) => setForm(f => ({ ...f, categoryId: value }))]].map(([label, name, value, onChange]) => <label key={name as string} className="text-xs font-black">{label as string}<select id={`student-document-${name}`} ref={element => { fieldRefs.current[name as MetadataField] = element; }} required value={value as string} onChange={e => { const nextValue = e.target.value; if (name === 'categoryId') { setFormErrors({}); setSubmissionError(''); } (onChange as (value: string) => void)(nextValue); }} aria-invalid={Boolean(formErrors[name as MetadataField])} aria-describedby={formErrors[name as MetadataField] ? `${name}-error` : undefined} className="mt-1 w-full rounded-lg border p-2 text-sm"><option value="">اختر</option>{name === 'studentId' ? students.map(s => <option key={s.id} value={s.id}>{s.name}</option>) : categories.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}</select>{formErrors[name as MetadataField] && <span id={`${name}-error`} className="mt-1 block text-[11px] font-bold text-rose-700">{formErrors[name as MetadataField]}</span>}</label>)}<label htmlFor="student-document-documentReference" className="text-xs font-black">المرجع<input id="student-document-documentReference" ref={element => { fieldRefs.current.documentReference = element; }} required value={form.documentReference} onChange={e => setForm(f => ({ ...f, documentReference: e.target.value }))} aria-invalid={Boolean(formErrors.documentReference)} aria-describedby={formErrors.documentReference ? "documentReference-error" : undefined} className="mt-1 w-full rounded-lg border p-2 text-sm" />{formErrors.documentReference && <span id="documentReference-error" className="mt-1 block text-[11px] font-bold text-rose-700">{formErrors.documentReference}</span>}</label><label htmlFor="student-document-title" className="text-xs font-black">العنوان<input id="student-document-title" ref={element => { fieldRefs.current.title = element; }} required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} aria-invalid={Boolean(formErrors.title)} aria-describedby={formErrors.title ? "title-error" : undefined} className="mt-1 w-full rounded-lg border p-2 text-sm" />{formErrors.title && <span id="title-error" className="mt-1 block text-[11px] font-bold text-rose-700">{formErrors.title}</span>}</label><label htmlFor="student-document-originalFileName" className="text-xs font-black">اسم الملف الوصفي<input id="student-document-originalFileName" ref={element => { fieldRefs.current.originalFileName = element; }} required value={form.originalFileName} onChange={e => setForm(f => ({ ...f, originalFileName: e.target.value }))} aria-invalid={Boolean(formErrors.originalFileName)} aria-describedby={formErrors.originalFileName ? "originalFileName-error" : undefined} className="mt-1 w-full rounded-lg border p-2 text-sm" />{formErrors.originalFileName && <span id="originalFileName-error" className="mt-1 block text-[11px] font-bold text-rose-700">{formErrors.originalFileName}</span>}</label><label htmlFor="student-document-mediaType" className="text-xs font-black">نوع المحتوى<input id="student-document-mediaType" ref={element => { fieldRefs.current.mediaType = element; }} required value={form.mediaType} onChange={e => setForm(f => ({ ...f, mediaType: e.target.value }))} aria-invalid={Boolean(formErrors.mediaType)} aria-describedby={formErrors.mediaType ? "mediaType-error" : undefined} className="mt-1 w-full rounded-lg border p-2 text-sm" />{formErrors.mediaType && <span id="mediaType-error" className="mt-1 block text-[11px] font-bold text-rose-700">{formErrors.mediaType}</span>}</label><label htmlFor="student-document-byteSize" className="text-xs font-black">الحجم بالبايت<input id="student-document-byteSize" ref={element => { fieldRefs.current.byteSize = element; }} required type="number" min="0" value={form.byteSize} onChange={e => setForm(f => ({ ...f, byteSize: e.target.value }))} aria-invalid={Boolean(formErrors.byteSize)} aria-describedby={formErrors.byteSize ? "byteSize-error" : undefined} className="mt-1 w-full rounded-lg border p-2 text-sm" />{formErrors.byteSize && <span id="byteSize-error" className="mt-1 block text-[11px] font-bold text-rose-700">{formErrors.byteSize}</span>}</label><label htmlFor="student-document-contentHash" className="text-xs font-black">مرجع سلامة المحتوى<input id="student-document-contentHash" ref={element => { fieldRefs.current.contentHash = element; }} required minLength={32} value={form.contentHash} onChange={e => setForm(f => ({ ...f, contentHash: e.target.value }))} aria-invalid={Boolean(formErrors.contentHash)} aria-describedby={formErrors.contentHash ? "contentHash-error" : undefined} className="mt-1 w-full rounded-lg border p-2 text-sm" />{formErrors.contentHash && <span id="contentHash-error" className="mt-1 block text-[11px] font-bold text-rose-700">{formErrors.contentHash}</span>}</label><label className="text-xs font-black">التصنيف<select value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm">{['public','internal','confidential','restricted','highly_confidential'].map(v => <option key={v}>{v}</option>)}</select></label><label className="text-xs font-black">حالة التحقق<select value={form.verificationStatus} onChange={e => setForm(f => ({ ...f, verificationStatus: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm"><option value="pending">قيد المراجعة</option><option value="not_required">غير مطلوب</option></select></label><label htmlFor="student-document-retentionUntil" className="text-xs font-black">الاحتفاظ حتى<input id="student-document-retentionUntil" ref={element => { fieldRefs.current.retentionUntil = element; }} type="date" value={form.retentionUntil} onChange={e => setForm(f => ({ ...f, retentionUntil: e.target.value }))} aria-invalid={Boolean(formErrors.retentionUntil)} aria-describedby={formErrors.retentionUntil ? "retentionUntil-error" : undefined} className="mt-1 w-full rounded-lg border p-2 text-sm" />{formErrors.retentionUntil && <span id="retentionUntil-error" className="mt-1 block text-[11px] font-bold text-rose-700">{formErrors.retentionUntil}</span>}</label><label htmlFor="student-document-archiveEligibleOn" className="text-xs font-black">الأهلية للأرشفة<input id="student-document-archiveEligibleOn" ref={element => { fieldRefs.current.archiveEligibleOn = element; }} type="date" value={form.archiveEligibleOn} onChange={e => setForm(f => ({ ...f, archiveEligibleOn: e.target.value }))} aria-invalid={Boolean(formErrors.archiveEligibleOn)} aria-describedby={formErrors.archiveEligibleOn ? "archiveEligibleOn-error" : undefined} className="mt-1 w-full rounded-lg border p-2 text-sm" />{formErrors.archiveEligibleOn && <span id="archiveEligibleOn-error" className="mt-1 block text-[11px] font-bold text-rose-700">{formErrors.archiveEligibleOn}</span>}</label><label className="text-xs font-black md:col-span-2">الوصف<textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" rows={2} /></label><label className="flex items-center gap-2 text-xs font-black md:col-span-2"><input type="checkbox" checked={form.legalHold} onChange={e => setForm(f => ({ ...f, legalHold: e.target.checked }))} /> قفل قانوني</label></div><div className="flex flex-wrap justify-end gap-2 border-t pt-3"><button type="button" onClick={requestCloseCreate} className="rounded-lg border px-4 py-2 text-xs font-black">إلغاء</button><button disabled={actionBusy || !formDirty} className="rounded-lg bg-[#2a1a0e] px-4 py-2 text-xs font-black text-amber-200">{actionBusy ? 'جارٍ الحفظ…' : 'حفظ metadata'}</button></div></form></div>}
  </section>;
}
