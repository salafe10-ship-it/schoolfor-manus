import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StudentDocumentsPortal from '../modules/student-documents/presentation/StudentDocumentsPortal';
import type { Student } from '../types';

const student = { id: '44444444-4444-4444-8444-444444444444', name: 'طالب الاختبار' } as Student;
const notify = vi.fn();

function response(data: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => data } as Response;
}

function fillValidRegistration(dialog: HTMLElement, reference = 'DOC-REGISTRATION', title = 'هوية الطالب') {
  fireEvent.change(within(dialog).getByLabelText('الطالب'), { target: { value: student.id } });
  fireEvent.change(within(dialog).getAllByLabelText('التصنيف')[0], { target: { value: 'cat-1' } });
  fireEvent.change(within(dialog).getByLabelText('المرجع'), { target: { value: reference } });
  fireEvent.change(within(dialog).getByLabelText('العنوان'), { target: { value: title } });
  fireEvent.change(within(dialog).getByLabelText('اسم الملف الوصفي'), { target: { value: 'id.pdf' } });
  fireEvent.change(within(dialog).getByLabelText('نوع المحتوى'), { target: { value: 'application/pdf' } });
  fireEvent.change(within(dialog).getByLabelText('الحجم بالبايت'), { target: { value: '12' } });
  fireEvent.change(within(dialog).getByLabelText('مرجع سلامة المحتوى'), { target: { value: 'a'.repeat(32) } });
}

function canonicalRegisteredDocument(documentId: string, reference = 'DOC-REGISTRATION', title = 'هوية الطالب') {
  return {
    id: documentId,
    student_id: student.id,
    title,
    document_reference: reference,
    category_id: 'cat-1',
    lifecycle_status: 'pending_verification',
    verification_status: 'pending',
    classification: 'confidential',
    current_version_number: 1,
    retention_until: null,
    legal_hold: false,
    archive_eligible_on: null,
    version: 1
  };
}

afterEach(() => { vi.restoreAllMocks(); notify.mockReset(); });

describe('DOC-003 StudentDocumentsPortal', () => {
  it('renders an explicit empty state when the trusted API returns no records', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(url.includes('categories') ? response({ data: [] }) : response({ data: [], meta: { total: 0 } }))));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    expect(await screen.findByText('لا توجد مستندات ضمن النطاق والفلاتر الحالية.')).not.toBeNull();
  });

  it('treats filtered no-match results as a distinct empty state and restores canonical results when filters clear', async () => {
    const row = { id: 'doc-filter', student_id: student.id, title: 'مستند قابل للبحث', document_reference: 'DOC-FILTER', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 };
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) {
        return Promise.resolve(new URL(url, 'http://test').searchParams.get('search') === 'غير موجود' ? response({ data: [], meta: { total: 0 } }) : response({ data: [row], meta: { total: 1 } }));
      }
      return Promise.resolve(response({ data: [] }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    expect(await screen.findByText('مستند قابل للبحث')).not.toBeNull();
    fireEvent.change(screen.getByPlaceholderText('العنوان أو المرجع'), { target: { value: 'غير موجود' } });
    expect(await screen.findByText('لا توجد مستندات تطابق البحث والفلاتر الحالية.')).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(fetchMock.mock.calls.some(([url]) => new URL(String(url), 'http://test').searchParams.get('search') === 'غير موجود')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'مسح الفلاتر وعرض القائمة' }));
    expect(await screen.findByText('مستند قابل للبحث')).not.toBeNull();
  });

  it('ignores an older filtered response after a newer filter request completes', async () => {
    let resolveOld!: (value: Response) => void;
    const oldResponse = new Promise<Response>(resolve => { resolveOld = resolve; });
    const row = (id: string, title: string) => ({ id, student_id: student.id, title, document_reference: id.toUpperCase(), category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 });
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      const search = new URL(url, 'http://test').searchParams.get('search');
      if (search === 'قديم') return oldResponse;
      if (search === 'جديد') return Promise.resolve(response({ data: [row('doc-new', 'نتيجة جديدة')], meta: { total: 1 } }));
      return Promise.resolve(response({ data: [row('doc-initial', 'نتيجة أولية')], meta: { total: 1 } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    expect(await screen.findByText('نتيجة أولية')).not.toBeNull();
    fireEvent.change(screen.getByPlaceholderText('العنوان أو المرجع'), { target: { value: 'قديم' } });
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => new URL(String(url), 'http://test').searchParams.get('search') === 'قديم')).toBe(true));
    fireEvent.change(screen.getByPlaceholderText('العنوان أو المرجع'), { target: { value: 'جديد' } });
    expect(await screen.findByText('نتيجة جديدة')).not.toBeNull();
    resolveOld(response({ data: [row('doc-old', 'نتيجة قديمة')], meta: { total: 1 } }));
    await waitFor(() => expect(screen.queryByText('نتيجة قديمة')).toBeNull());
  });

  it('sorts only the current loaded results deterministically and keeps details bound to document id', async () => {
    const row = (id: string, title: string, version: number) => ({ id, student_id: student.id, title, document_reference: id.toUpperCase(), category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: version, retention_until: null, legal_hold: false, version: 1 });
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents/')) return Promise.resolve(response({ data: { document: row('doc-a', 'عنوان أ', 1), versions: [] } }));
      return Promise.resolve(response({ data: [row('doc-b', 'عنوان ب', 2), row('doc-a', 'عنوان أ', 1)], meta: { total: 2 } }));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    expect(await screen.findByText('عنوان ب')).not.toBeNull();
    expect(screen.getByText('يطبق على النتائج المعروضة حاليًا فقط.')).not.toBeNull();
    fireEvent.change(screen.getByLabelText('ترتيب النتائج'), { target: { value: 'title_asc' } });
    await waitFor(() => {
      const resultRows = screen.getAllByRole('row').filter(rowElement => rowElement.querySelector('td'));
      expect(resultRows[0]?.textContent).toContain('عنوان أ');
      expect(resultRows[1]?.textContent).toContain('عنوان ب');
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'فتح التفاصيل' })[0]);
    expect(await screen.findByRole('heading', { name: 'عنوان أ' })).not.toBeNull();
    fireEvent.change(screen.getByLabelText('ترتيب النتائج'), { target: { value: 'version_desc' } });
    expect(screen.getByRole('heading', { name: 'عنوان أ' })).not.toBeNull();
  });

  it('renders canonical identifiers and explicit unavailable values instead of synthetic metadata', async () => {
    const row = { id: 'doc-truthful', student_id: 'student-outside-scope', title: 'مستند حقيقي', document_reference: 'DOC-TRUTHFUL', category_id: 'cat-missing-label', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 };
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(url.includes('categories') ? response({ data: [] }) : response({ data: [row], meta: { total: 1 } }))));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    expect(await screen.findByText('معرّف الطالب: student-outside-scope')).not.toBeNull();
    expect(screen.getByText('غير متوفر')).not.toBeNull();
    expect(screen.queryByText('طالب غير معروض في النطاق الحالي')).toBeNull();
  });

  it('does not derive the list student identity from the parent students prop', async () => {
    const row = { id: 'doc-parent-label', student_id: student.id, title: 'مستند مصدر الهوية', document_reference: 'DOC-PARENT-LABEL', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 };
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(url.includes('categories') ? response({ data: [] }) : response({ data: [row], meta: { total: 1 } }))));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    await screen.findByText(`معرّف الطالب: ${student.id}`);
    const resultRow = screen.getAllByRole('row').find(rowElement => rowElement.querySelector('td'));
    expect(resultRow?.textContent).toContain(`معرّف الطالب: ${student.id}`);
    expect(resultRow?.textContent).not.toContain(student.name);
  });

  it('does not claim a complete list when canonical total metadata is absent', async () => {
    const row = { id: 'doc-partial', student_id: student.id, title: 'نتيجة جزئية', document_reference: 'DOC-PARTIAL', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 };
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(url.includes('categories') ? response({ data: [] }) : response({ data: [row] }))));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    expect(await screen.findByText('النتائج المعروضة: 1')).not.toBeNull();
    expect(screen.getByText('العدد الكلي غير متاح من العقد الحالي.')).not.toBeNull();
    expect((screen.getByRole('button', { name: 'الصفحة السابقة' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'الصفحة التالية' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText('لا توجد مستندات ضمن النطاق والفلاتر الحالية.')).toBeNull();
  });

  it('renders scoped metadata and opens the read-only version details', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [{ id: 'cat-1', category_code: 'ID', display_name: 'هوية', status: 'active' }] }));
      if (url.includes('/api/student-documents/doc-1')) return Promise.resolve(response({ data: { document: { id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', category_name: 'هوية', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: null, version: 1 }, versions: [{ id: 'ver-1', version_number: 1, original_file_name: 'id.pdf', media_type: 'application/pdf', byte_size: 12, is_current: true }] } }));
      return Promise.resolve(response({ data: [{ id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', category_name: 'هوية', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: null, version: 1 }], meta: { total: 1 } }));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    expect(await screen.findByText('سجل الإصدارات')).not.toBeNull();
    expect(screen.getByText('id.pdf')).not.toBeNull();
  });

  it('keeps detail identity and nullable metadata truthful to the canonical response', async () => {
    const canonicalStudentId = 'student-canonical-id';
    const row = { id: 'doc-detail-truth', student_id: canonicalStudentId, title: 'العنوان الكانوني', document_reference: 'DOC-DETAIL-TRUTH', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 2, retention_until: null, legal_hold: false, archive_eligible_on: null, version: 4 };
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents/doc-detail-truth')) return Promise.resolve(response({ data: { document: row, versions: [{ id: 'version-2', version_number: 2, original_file_name: 'canonical.pdf', media_type: 'application/pdf', byte_size: 12, is_current: true, revision_reason: null }] } }));
      return Promise.resolve(response({ data: [row], meta: { total: 1 } }));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    expect(await screen.findByRole('heading', { name: 'العنوان الكانوني' })).not.toBeNull();
    expect(screen.getByText(`معرّف الطالب: ${canonicalStudentId} • DOC-DETAIL-TRUTH`)).not.toBeNull();
    expect(screen.getAllByText('غير متوفر').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('الإصدار v2 • الحالي')).not.toBeNull();
  });

  it('clears stale detail while switching documents and ignores an older detail response', async () => {
    let resolveB!: (value: Response) => void;
    const pendingB = new Promise<Response>(resolve => { resolveB = resolve; });
    const row = (id: string, title: string) => ({ id, student_id: student.id, title, document_reference: id.toUpperCase(), category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: null, version: 1 });
    const details = (id: string, title: string) => response({ data: { document: row(id, title), versions: [] } });
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) return Promise.resolve(response({ data: [row('doc-a', 'مستند أ'), row('doc-b', 'مستند ب')], meta: { total: 2 } }));
      if (url.includes('/api/student-documents/doc-a')) return Promise.resolve(details('doc-a', 'مستند أ'));
      if (url.includes('/api/student-documents/doc-b')) return pendingB;
      return Promise.resolve(response({ data: [] }));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    const openButtons = await screen.findAllByRole('button', { name: 'فتح التفاصيل' });
    fireEvent.click(openButtons[0]);
    expect(await screen.findByRole('heading', { name: 'مستند أ' })).not.toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'فتح التفاصيل' })[1]);
    expect(screen.queryByRole('heading', { name: 'مستند أ' })).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('جاري تحميل بيانات المستند الكانونية');
    resolveB(await details('doc-b', 'مستند ب'));
    expect(await screen.findByRole('heading', { name: 'مستند ب' })).not.toBeNull();
  });

  it('shows detail errors without converting them into an empty state', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) return Promise.resolve(response({ data: [{ id: 'doc-a', student_id: student.id, title: 'مستند أ', document_reference: 'DOC-A', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: null, version: 1 }], meta: { total: 1 } }));
      return Promise.resolve(response({ message: 'Forbidden' }, 403));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('ليست لديك صلاحية فتح هذا السجل.'));
    expect(screen.queryByText('لا توجد مستندات ضمن النطاق والفلاتر الحالية.')).toBeNull();
  });

  it('does not reveal records when the API denies the view permission', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(url.includes('categories') ? response({ data: [] }) : response({ message: 'Forbidden' }, 403))));
    render(<StudentDocumentsPortal students={[student]} currentRole="Teacher" triggerNotification={notify} />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('ليست لديك صلاحية عرض مستندات الطلاب.'));
    expect(screen.queryByText('هوية الطالب')).toBeNull();
  });

  it('shows a recoverable conflict message when opening a stale document', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) return Promise.resolve(response({ data: [{ id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: null, version: 1 }], meta: { total: 1 } }));
      return Promise.resolve(response({ message: 'الإصدار قديم' }, 409));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    expect((await screen.findByRole('alert')).textContent).toContain('الإصدار قديم');
  });

  it('shows a retry action for server failures instead of an empty-success state', async () => {
    const fetchMock = vi.fn((url: string) => Promise.resolve(url.includes('categories')
      ? response({ data: [] })
      : response({ message: 'تعذر الوصول إلى الخدمة' }, 500)));
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="Teacher" triggerNotification={notify} />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('تعذر إكمال العملية بسبب خطأ مؤقت في الخادم');
    expect(screen.queryByText('لا توجد مستندات ضمن النطاق والفلاتر الحالية.')).toBeNull();
    expect(screen.getByText('تعذر عرض القائمة الحالية. استخدم إعادة المحاولة.')).not.toBeNull();
    const callsBeforeRetry = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'إعادة المحاولة' }));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBeforeRetry));
  });

  it('does not show a success notification when the canonical API explicitly returns success false', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) return Promise.resolve(response({ data: [{ id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: null, version: 1 }], meta: { total: 1 } }));
      if (url.includes('/api/student-documents/doc-1') && (!init?.method || init.method === 'GET')) return Promise.resolve(response({ data: { document: { id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: null, version: 1 }, versions: [] } }));
      if (init?.method === 'POST') return Promise.resolve(response({ success: false, message: 'العملية مرفوضة' }, 200));
      return Promise.resolve(response({ success: false, message: 'العملية مرفوضة' }, 200));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    expect(await screen.findByText('سجل الإصدارات')).not.toBeNull();

    fireEvent.change(screen.getByLabelText('سبب الإجراء (إلزامي)'), { target: { value: 'تصحيح موثق' } });
    fireEvent.click(screen.getByRole('button', { name: 'توثيق' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('العملية مرفوضة', 'warning'));
    expect(notify).not.toHaveBeenCalledWith('تم حفظ قرار المستند وتسجيله تدقيقيًا.', 'success');
  });

  it.each([
    [400, 'بيانات غير صالحة'],
    [500, 'خطأ مؤقت']
  ])('does not show success for mutation HTTP %s', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) return Promise.resolve(response({ data: [{ id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }], meta: { total: 1 } }));
      if (url.includes('/api/student-documents/doc-1') && (!init?.method || init.method === 'GET')) return Promise.resolve(response({ data: { document: { id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }, versions: [] } }));
      return Promise.resolve(response({ message, errorCode: status === 409 ? 'CONFLICT_ERROR' : 'REQUEST_FAILED' }, status));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await screen.findByText('سجل الإصدارات');
    fireEvent.change(screen.getByLabelText('سبب الإجراء (إلزامي)'), { target: { value: 'مراجعة موثقة' } });
    fireEvent.click(screen.getByRole('button', { name: 'توثيق' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.any(String), 'warning'));
    expect(notify).not.toHaveBeenCalledWith('تم حفظ قرار المستند وتسجيله تدقيقيًا.', 'success');
  });

  it('does not retry a conflicted mutation and resynchronizes with read-only requests', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) return Promise.resolve(response({ data: [{ id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }], meta: { total: 1 } }));
      if (url.includes('/api/student-documents/doc-1') && (!init?.method || init.method === 'GET')) return Promise.resolve(response({ data: { document: { id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 2 }, versions: [] } }));
      return Promise.resolve(response({ message: 'Document version is stale.', errorCode: 'CONFLICT_ERROR' }, 409));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await screen.findByText('سجل الإصدارات');
    fireEvent.change(screen.getByLabelText('سبب الإجراء (إلزامي)'), { target: { value: 'مراجعة موثقة' } });
    fireEvent.click(screen.getByRole('button', { name: 'توثيق' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Document version is stale.', 'warning'));
    const mutationCalls = () => fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST').length;
    expect(mutationCalls()).toBe(1);
    const callsBeforeReadRetry = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'إعادة المحاولة' }));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBeforeReadRetry));
    expect(mutationCalls()).toBe(1);
  });

  it('shows an unknown outcome for network failure without success notification', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) return Promise.resolve(response({ data: [{ id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }], meta: { total: 1 } }));
      if (url.includes('/api/student-documents/doc-1') && (!init?.method || init.method === 'GET')) return Promise.resolve(response({ data: { document: { id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }, versions: [] } }));
      return Promise.reject(new TypeError('Failed to fetch'));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await screen.findByText('سجل الإصدارات');
    fireEvent.change(screen.getByLabelText('سبب الإجراء (إلزامي)'), { target: { value: 'مراجعة موثقة' } });
    fireEvent.click(screen.getByRole('button', { name: 'توثيق' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.stringContaining('تعذر الاتصال بالخادم'), 'warning'));
    expect(notify).not.toHaveBeenCalledWith('تم حفظ قرار المستند وتسجيله تدقيقيًا.', 'success');
  });

  it('renders only allowlisted access-history metadata and hides internal fields', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) return Promise.resolve(response({ data: [{ id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }], meta: { total: 1 } }));
      if (url.includes('/access-log')) return Promise.resolve(response({ data: [{ id: 'access-1', access_type: 'view', access_result: 'allowed', occurred_at: '2026-08-12T10:00:00Z', actor_user_id: 'internal-actor', request_id: 'request-internal', correlation_id: 'correlation-internal', reason_code: 'internal-reason' }] }));
      if (url.includes('/api/student-documents/doc-1') && (!init?.method || init.method === 'GET')) return Promise.resolve(response({ data: { document: { id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }, versions: [] } }));
      return Promise.resolve(response({ data: { success: true } }));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await screen.findByText('سجل الإصدارات');
    fireEvent.click(screen.getByRole('button', { name: 'تحميل' }));
    expect(await screen.findByText('view')).not.toBeNull();
    expect(screen.getByText(/allowed/)).not.toBeNull();
    expect(screen.queryByText('internal-actor')).toBeNull();
    expect(screen.queryByText('request-internal')).toBeNull();
    expect(screen.queryByText('internal-reason')).toBeNull();
  });

  it('treats empty access history as an explicit empty state, not an error', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) return Promise.resolve(response({ data: [{ id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }], meta: { total: 1 } }));
      if (url.includes('/access-log')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents/doc-1') && (!init?.method || init.method === 'GET')) return Promise.resolve(response({ data: { document: { id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }, versions: [] } }));
      return Promise.resolve(response({ data: { success: true } }));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await screen.findByText('سجل الإصدارات');
    fireEvent.click(screen.getByRole('button', { name: 'تحميل' }));
    expect(await screen.findByText('لا توجد أحداث وصول ضمن النطاق الحالي.')).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('keeps access-history read failures explicit and retries with GET only', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) return Promise.resolve(response({ data: [{ id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }], meta: { total: 1 } }));
      if (url.includes('/access-log')) return Promise.resolve(response({ message: 'Forbidden' }, 403));
      if (url.includes('/api/student-documents/doc-1') && (!init?.method || init.method === 'GET')) return Promise.resolve(response({ data: { document: { id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }, versions: [] } }));
      return Promise.resolve(response({ data: { success: true } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await screen.findByText('سجل الإصدارات');
    fireEvent.click(screen.getByRole('button', { name: 'تحميل' }));
    expect(await screen.findByText('ليست لديك صلاحية عرض سجل الوصول.')).not.toBeNull();
    expect(screen.queryByText('لا توجد أحداث وصول ضمن النطاق الحالي.')).toBeNull();
    const callsBeforeRetry = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'إعادة المحاولة' }));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBeforeRetry));
    const retryCalls = fetchMock.mock.calls.slice(callsBeforeRetry);
    expect(retryCalls.every(([, init]) => (init as RequestInit | undefined)?.method !== 'POST')).toBe(true);
  });

  it('shows success only after verification mutation and canonical list/detail refresh', async () => {
    let listCalls = 0;
    let detailCalls = 0;
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) {
        listCalls += 1;
        const verified = listCalls > 1;
        return Promise.resolve(response({ data: [{ id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: verified ? 'verified' : 'pending_verification', verification_status: verified ? 'verified' : 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: verified ? 2 : 1 }], meta: { total: 1 } }));
      }
      if (url.includes('/api/student-documents/doc-1') && (!init?.method || init.method === 'GET')) {
        detailCalls += 1;
        const verified = detailCalls > 1;
        return Promise.resolve(response({ data: { document: { id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: verified ? 'verified' : 'pending_verification', verification_status: verified ? 'verified' : 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: verified ? 2 : 1 }, versions: [] } }));
      }
      return Promise.resolve(response({ success: true, data: { document: { id: 'doc-1', version: 2 } } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await screen.findByText('سجل الإصدارات');
    fireEvent.change(screen.getByLabelText('سبب الإجراء (إلزامي)'), { target: { value: 'توثيق نهائي' } });
    fireEvent.click(screen.getByRole('button', { name: 'توثيق' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('تم حفظ قرار المستند وتسجيله تدقيقيًا.', 'success'));
    expect(listCalls).toBeGreaterThanOrEqual(2);
    expect(detailCalls).toBeGreaterThanOrEqual(2);
  });

  it('does not show success when canonical refresh fails after a successful mutation response', async () => {
    let listCalls = 0;
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) {
        listCalls += 1;
        return listCalls > 1 ? Promise.resolve(response({ message: 'تعذر تحديث القائمة' }, 500)) : Promise.resolve(response({ data: [{ id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }], meta: { total: 1 } }));
      }
      if (url.includes('/api/student-documents/doc-1') && (!init?.method || init.method === 'GET')) return Promise.resolve(response({ data: { document: { id: 'doc-1', student_id: student.id, title: 'هوية الطالب', document_reference: 'DOC-1', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, version: 1 }, versions: [] } }));
      return Promise.resolve(response({ success: true, data: { document: { id: 'doc-1', version: 2 } } }));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await screen.findByText('سجل الإصدارات');
    fireEvent.change(screen.getByLabelText('سبب الإجراء (إلزامي)'), { target: { value: 'توثيق نهائي' } });
    fireEvent.click(screen.getByRole('button', { name: 'توثيق' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.stringContaining('تم تنفيذ العملية الكانونية'), 'warning'));
    expect(notify).not.toHaveBeenCalledWith('تم حفظ قرار المستند وتسجيله تدقيقيًا.', 'success');
  });

  it('does not treat HTTP 2xx as success when the canonical postcondition is not proven', async () => {
    const document = { id: 'doc-postcondition', student_id: student.id, title: 'مستند نتيجة غير مثبتة', document_reference: 'DOC-POSTCONDITION', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: null, version: 1 };
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents?')) return Promise.resolve(response({ data: [document], meta: { total: 1 } }));
      if (url.includes('/api/student-documents/doc-postcondition') && (!init?.method || init.method === 'GET')) return Promise.resolve(response({ data: { document, versions: [{ id: 'version-1', version_number: 1, is_current: true }] } }));
      return Promise.resolve(response({ success: true, data: { documentId: document.id } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await screen.findByRole('heading', { name: 'مستند نتيجة غير مثبتة' });
    fireEvent.change(screen.getByLabelText('سبب الإجراء (إلزامي)'), { target: { value: 'توثيق' } });
    fireEvent.click(screen.getByRole('button', { name: 'توثيق' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.stringContaining('لم تُثبت النتيجة النهائية'), 'warning'));
    expect(notify).not.toHaveBeenCalledWith('تم حفظ قرار المستند وتسجيله تدقيقيًا.', 'success');
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(1);
  });

  it('blocks unchanged and invalid registration metadata before any mutation request', async () => {
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [{ id: 'cat-1', category_code: 'ID', display_name: 'هوية', status: 'active' }] }));
      if (url.includes('/api/student-documents?')) return Promise.resolve(response({ data: [], meta: { total: 0 } }));
      return Promise.resolve(response({ success: true, data: { documentId: 'doc-1' } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'تسجيل بيانات مستند جديد' }));
    const dialog = screen.getByRole('dialog');
    const save = within(dialog).getByRole('button', { name: 'حفظ metadata' });
    expect((save as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(save);
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(0);

    fireEvent.change(within(dialog).getAllByLabelText('التصنيف')[0], { target: { value: 'cat-1' } });
    fireEvent.change(within(dialog).getByLabelText('المرجع'), { target: { value: 'DOC-NEW' } });
    fireEvent.change(within(dialog).getByLabelText('العنوان'), { target: { value: 'هوية الطالب' } });
    fireEvent.change(within(dialog).getByLabelText('اسم الملف الوصفي'), { target: { value: 'id.pdf' } });
    fireEvent.change(within(dialog).getByLabelText('نوع المحتوى'), { target: { value: 'application/pdf' } });
    fireEvent.change(within(dialog).getByLabelText('الحجم بالبايت'), { target: { value: '12' } });
    fireEvent.change(within(dialog).getByLabelText('مرجع سلامة المحتوى'), { target: { value: 'bad-hash' } });
    expect((save as HTMLButtonElement).disabled).toBe(false);
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(notify).toHaveBeenCalledWith('راجع الحقول المطلوبة وقيم metadata غير الصالحة قبل الحفظ.', 'warning'));
    expect(document.activeElement?.id).toBe('student-document-contentHash');
    expect(document.getElementById('student-document-contentHash')?.getAttribute('aria-describedby')).toBe('contentHash-error');
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(0);
  });

  it('announces registration success only after matching canonical detail and list refresh', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [{ id: 'cat-1', category_code: 'ID', display_name: 'هوية', status: 'active' }] }));
      if (init?.method === 'POST') return Promise.resolve(response({ success: true, data: { documentId: 'doc-registered' } }));
      if (url.includes('/api/student-documents/doc-registered')) return Promise.resolve(response({ data: { document: canonicalRegisteredDocument('doc-registered'), versions: [] } }));
      return Promise.resolve(response({ data: [canonicalRegisteredDocument('doc-registered')], meta: { total: 1 } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'تسجيل بيانات مستند جديد' }));
    const dialog = screen.getByRole('dialog');
    fillValidRegistration(dialog);
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(notify).toHaveBeenCalledWith('تم تسجيل بيانات المستند بنجاح.', 'success'));
    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls.some(url => url.includes('/api/student-documents/doc-registered'))).toBe(true);
    expect(await screen.findByText('DOC-REGISTRATION')).not.toBeNull();
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(1);
  });

  it('does not announce success when canonical detail is missing after registration', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [{ id: 'cat-1', category_code: 'ID', display_name: 'هوية', status: 'active' }] }));
      if (init?.method === 'POST') return Promise.resolve(response({ success: true, data: { documentId: 'doc-missing' } }));
      if (url.includes('/api/student-documents/doc-missing')) return Promise.resolve(response({ message: 'Document not found.' }, 404));
      return Promise.resolve(response({ data: [], meta: { total: 0 } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'تسجيل بيانات مستند جديد' }));
    const dialog = screen.getByRole('dialog');
    fillValidRegistration(dialog, 'DOC-MISSING');
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Document not found.', 'warning'));
    expect(notify).not.toHaveBeenCalledWith('تم تسجيل بيانات المستند بنجاح.', 'success');
    expect(screen.getByRole('dialog')).not.toBeNull();
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(1);
  });

  it('does not announce success when canonical detail returns a server error', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [{ id: 'cat-1', category_code: 'ID', display_name: 'هوية', status: 'active' }] }));
      if (init?.method === 'POST') return Promise.resolve(response({ success: true, data: { documentId: 'doc-error' } }));
      if (url.includes('/api/student-documents/doc-error')) return Promise.resolve(response({ message: 'Temporary failure.' }, 500));
      return Promise.resolve(response({ data: [], meta: { total: 0 } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'تسجيل بيانات مستند جديد' }));
    const dialog = screen.getByRole('dialog');
    fillValidRegistration(dialog, 'DOC-ERROR');
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.stringContaining('تعذر'), 'warning'));
    expect(notify).not.toHaveBeenCalledWith('تم تسجيل بيانات المستند بنجاح.', 'success');
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(1);
  });

  it('does not announce success when canonical detail belongs to another document', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [{ id: 'cat-1', category_code: 'ID', display_name: 'هوية', status: 'active' }] }));
      if (init?.method === 'POST') return Promise.resolve(response({ success: true, data: { documentId: 'doc-expected' } }));
      if (url.includes('/api/student-documents/doc-expected')) return Promise.resolve(response({ data: { document: canonicalRegisteredDocument('doc-other'), versions: [] } }));
      return Promise.resolve(response({ data: [], meta: { total: 0 } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'تسجيل بيانات مستند جديد' }));
    const dialog = screen.getByRole('dialog');
    fillValidRegistration(dialog, 'DOC-MISMATCH');
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.stringContaining('لم يُثبت السجل المطابق'), 'warning'));
    expect(notify).not.toHaveBeenCalledWith('تم تسجيل بيانات المستند بنجاح.', 'success');
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(1);
  });

  it('reports unknown outcome on canonical detail network failure without retrying or losing dirty metadata', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [{ id: 'cat-1', category_code: 'ID', display_name: 'هوية', status: 'active' }] }));
      if (init?.method === 'POST') return Promise.resolve(response({ success: true, data: { documentId: 'doc-timeout' } }));
      if (url.includes('/api/student-documents/doc-timeout')) return Promise.reject(new TypeError('Failed to fetch'));
      return Promise.resolve(response({ data: [], meta: { total: 0 } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'تسجيل بيانات مستند جديد' }));
    const dialog = screen.getByRole('dialog');
    fillValidRegistration(dialog, 'DOC-TIMEOUT');
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.stringContaining('لم يتم تأكيد نتيجة العملية'), 'warning'));
    expect(notify).not.toHaveBeenCalledWith('تم تسجيل بيانات المستند بنجاح.', 'success');
    expect((within(screen.getByRole('dialog')).getByLabelText('المرجع') as HTMLInputElement).value).toBe('DOC-TIMEOUT');
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(1);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/student-documents/doc-timeout'))).toHaveLength(1);
  });

  it('allows only one in-flight registration submission and re-enables after canonical completion', async () => {
    let resolvePost!: (value: Response) => void;
    const pendingPost = new Promise<Response>(resolve => { resolvePost = resolve; });
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [{ id: 'cat-1', category_code: 'ID', display_name: 'هوية', status: 'active' }] }));
      if (init?.method === 'POST') return pendingPost;
      if (url.includes('/api/student-documents/doc-1')) return Promise.resolve(response({ data: { document: canonicalRegisteredDocument('doc-1', 'DOC-CONCURRENT'), versions: [] } }));
      return Promise.resolve(response({ data: [], meta: { total: 0 } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'تسجيل بيانات مستند جديد' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('الطالب'), { target: { value: student.id } });
    fireEvent.change(within(dialog).getAllByLabelText('التصنيف')[0], { target: { value: 'cat-1' } });
    fireEvent.change(within(dialog).getByLabelText('المرجع'), { target: { value: 'DOC-CONCURRENT' } });
    fireEvent.change(within(dialog).getByLabelText('العنوان'), { target: { value: 'هوية الطالب' } });
    fireEvent.change(within(dialog).getByLabelText('اسم الملف الوصفي'), { target: { value: 'id.pdf' } });
    fireEvent.change(within(dialog).getByLabelText('نوع المحتوى'), { target: { value: 'application/pdf' } });
    fireEvent.change(within(dialog).getByLabelText('الحجم بالبايت'), { target: { value: '12' } });
    fireEvent.change(within(dialog).getByLabelText('مرجع سلامة المحتوى'), { target: { value: 'a'.repeat(32) } });
    const form = dialog.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(1));
    expect((within(dialog).getByRole('button', { name: 'جارٍ الحفظ…' }) as HTMLButtonElement).disabled).toBe(true);

    resolvePost(response({ success: true, data: { documentId: 'doc-1' } }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('تم تسجيل بيانات المستند بنجاح.', 'success'));
  });

  it('starts a new registration with canonical empty metadata instead of prior form values', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [{ id: 'cat-1', category_code: 'ID', display_name: 'هوية', status: 'active' }] }));
      if (init?.method === 'POST') return Promise.resolve(response({ success: true, data: { documentId: 'doc-1' } }));
      if (url.includes('/api/student-documents/doc-1')) return Promise.resolve(response({ data: { document: canonicalRegisteredDocument('doc-1', 'DOC-RESET', 'قيمة سابقة'), versions: [] } }));
      return Promise.resolve(response({ data: [], meta: { total: 0 } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'تسجيل بيانات مستند جديد' }));
    let dialog = screen.getByRole('dialog');
    fireEvent.change(document.getElementById('student-document-categoryId') as HTMLSelectElement, { target: { value: 'cat-1' } });
    fireEvent.change(document.getElementById('student-document-documentReference') as HTMLInputElement, { target: { value: 'DOC-RESET' } });
    fireEvent.change(document.getElementById('student-document-title') as HTMLInputElement, { target: { value: 'قيمة سابقة' } });
    fireEvent.change(document.getElementById('student-document-originalFileName') as HTMLInputElement, { target: { value: 'old.pdf' } });
    fireEvent.change(document.getElementById('student-document-mediaType') as HTMLInputElement, { target: { value: 'application/pdf' } });
    fireEvent.change(document.getElementById('student-document-byteSize') as HTMLInputElement, { target: { value: '12' } });
    fireEvent.change(document.getElementById('student-document-contentHash') as HTMLInputElement, { target: { value: 'b'.repeat(32) } });
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(notify).toHaveBeenCalledWith('تم تسجيل بيانات المستند بنجاح.', 'success'));
    fireEvent.click(screen.getByRole('button', { name: 'تسجيل بيانات مستند جديد' }));
    dialog = screen.getByRole('dialog');
    expect((document.getElementById('student-document-categoryId') as HTMLSelectElement).value).toBe('');
    expect((document.getElementById('student-document-title') as HTMLInputElement).value).toBe('');
    expect((document.getElementById('student-document-originalFileName') as HTMLInputElement).value).toBe('');
  });

  it('does not discard dirty registration metadata silently', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(url.includes('categories') ? response({ data: [] }) : response({ data: [], meta: { total: 0 } }))));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'تسجيل بيانات مستند جديد' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('العنوان'), { target: { value: 'تعديل غير محفوظ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'إلغاء' }));
    expect(await within(dialog).findByText('لديك تغييرات غير محفوظة. هل تريد إغلاق النموذج وفقدانها؟')).not.toBeNull();
    expect(within(dialog).getByRole('button', { name: 'متابعة التحرير' })).not.toBeNull();
  });

  it('shows only lifecycle actions proven by the canonical pending state', async () => {
    const document = { id: 'doc-actions', student_id: student.id, title: 'مستند الإجراءات', document_reference: 'DOC-ACTIONS', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: null, version: 1 };
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents/doc-actions') && (!init?.method || init.method === 'GET')) return Promise.resolve(response({ data: { document, versions: [{ id: 'version-1', version_number: 1, is_current: true }] } }));
      return Promise.resolve(response({ data: [document], meta: { total: 1 } }));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    expect(await screen.findByRole('heading', { name: 'مستند الإجراءات' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'توثيق' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'رفض' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'إنهاء' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'أرشفة' })).toBeNull();
    expect(screen.getByRole('button', { name: 'إصدار جديد' })).not.toBeNull();
  });

  it('shows restore only for archived documents and hides conflicting lifecycle actions', async () => {
    const document = { id: 'doc-archived', student_id: student.id, title: 'مستند مؤرشف', document_reference: 'DOC-ARCHIVED', category_id: 'cat-1', lifecycle_status: 'archived', verification_status: 'verified', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: '2026-01-01', version: 3 };
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents/doc-archived') && (!init?.method || init.method === 'GET')) return Promise.resolve(response({ data: { document, versions: [{ id: 'version-1', version_number: 1, is_current: true }] } }));
      return Promise.resolve(response({ data: [document], meta: { total: 1 } }));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    expect(await screen.findByRole('heading', { name: 'مستند مؤرشف' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'استعادة المستند' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'توثيق' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'رفض' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'إنهاء' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'أرشفة' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'إصدار جديد' })).toBeNull();
  });

  it('prevents parallel document actions while a mutation is in flight', async () => {
    let resolveMutation!: (value: Response) => void;
    const pendingMutation = new Promise<Response>(resolve => { resolveMutation = resolve; });
    const document = { id: 'doc-busy', student_id: student.id, title: 'مستند قيد التنفيذ', document_reference: 'DOC-BUSY', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: null, version: 1 };
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (init?.method === 'POST') return pendingMutation;
      if (url.includes('/api/student-documents/doc-busy')) return Promise.resolve(response({ data: { document, versions: [{ id: 'version-1', version_number: 1, is_current: true }] } }));
      return Promise.resolve(response({ data: [document], meta: { total: 1 } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await screen.findByRole('heading', { name: 'مستند قيد التنفيذ' });
    fireEvent.change(screen.getByLabelText('سبب الإجراء (إلزامي)'), { target: { value: 'مراجعة موثقة' } });
    fireEvent.click(screen.getByRole('button', { name: 'توثيق' }));
    await waitFor(() => expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(1));
    expect((screen.getByRole('button', { name: 'توثيق' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'رفض' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'إصدار جديد' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'رفض' }));
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(1);
    resolveMutation(response({ success: true, data: { documentId: document.id } }));
  });

  it('requires cancellable confirmation for archive and binds it to the selected document', async () => {
    let resolveMutation!: (value: Response) => void;
    const pendingMutation = new Promise<Response>(resolve => { resolveMutation = resolve; });
    const document = { id: 'doc-confirm', student_id: student.id, title: 'مستند يحتاج تأكيدًا', document_reference: 'DOC-CONFIRM', category_id: 'cat-1', lifecycle_status: 'verified', verification_status: 'verified', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: '2026-01-01', version: 1 };
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (init?.method === 'POST') return pendingMutation;
      if (url.includes('/api/student-documents/doc-confirm')) return Promise.resolve(response({ data: { document, versions: [{ id: 'version-1', version_number: 1, is_current: true }] } }));
      return Promise.resolve(response({ data: [document], meta: { total: 1 } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await screen.findByRole('heading', { name: 'مستند يحتاج تأكيدًا' });
    fireEvent.change(screen.getByLabelText('سبب الإجراء (إلزامي)'), { target: { value: 'حفظ مؤرشف' } });
    fireEvent.click(screen.getByRole('button', { name: 'أرشفة' }));
    expect(screen.getByRole('dialog', { name: 'أرشفة المستند' })).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }));
    expect(screen.queryByRole('dialog', { name: 'أرشفة المستند' })).toBeNull();
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'أرشفة' }));
    fireEvent.keyDown(screen.getByRole('presentation'), { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'أرشفة المستند' })).toBeNull();
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'أرشفة' }));
    const confirm = screen.getByRole('button', { name: 'تأكيد العملية' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(1));
    resolveMutation(response({ success: true, data: { documentId: document.id } }));
  });

  it('cancels a destructive confirmation when the target is cleared by a filter change', async () => {
    const document = { id: 'doc-filter-confirm', student_id: student.id, title: 'مستند الفلتر', document_reference: 'DOC-FILTER-CONFIRM', category_id: 'cat-1', lifecycle_status: 'verified', verification_status: 'verified', classification: 'confidential', current_version_number: 1, retention_until: null, legal_hold: false, archive_eligible_on: '2026-01-01', version: 1 };
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (init?.method === 'POST') return Promise.resolve(response({ success: true, data: { documentId: document.id } }));
      if (url.includes('/api/student-documents/') && !url.includes('?')) return Promise.resolve(response({ data: { document, versions: [{ id: 'version-1', version_number: 1, is_current: true }] } }));
      return Promise.resolve(response({ data: [document], meta: { total: 1 } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    await screen.findByRole('heading', { name: 'مستند الفلتر' });
    fireEvent.change(screen.getByLabelText('سبب الإجراء (إلزامي)'), { target: { value: 'حفظ مؤرشف' } });
    fireEvent.click(screen.getByRole('button', { name: 'أرشفة' }));
    fireEvent.change(screen.getByPlaceholderText('العنوان أو المرجع'), { target: { value: 'تغيير النطاق' } });
    expect(screen.queryByRole('dialog', { name: 'أرشفة المستند' })).toBeNull();
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(0);
  });

  it('does not expose mutation capabilities for a legal-hold document', async () => {
    const document = { id: 'doc-held', student_id: student.id, title: 'مستند قيد قانوني', document_reference: 'DOC-HELD', category_id: 'cat-1', lifecycle_status: 'pending_verification', verification_status: 'pending', classification: 'restricted', current_version_number: 1, retention_until: '2026-01-01', legal_hold: true, archive_eligible_on: '2026-01-01', version: 2 };
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('categories')) return Promise.resolve(response({ data: [] }));
      if (url.includes('/api/student-documents/doc-held') && (!init?.method || init.method === 'GET')) return Promise.resolve(response({ data: { document, versions: [{ id: 'version-1', version_number: 1, is_current: true }] } }));
      return Promise.resolve(response({ data: [document], meta: { total: 1 } }));
    }));
    render(<StudentDocumentsPortal students={[student]} currentRole="SchoolAdmin" triggerNotification={notify} />);
    fireEvent.click(await screen.findByRole('button', { name: 'فتح التفاصيل' }));
    expect(await screen.findByRole('heading', { name: 'مستند قيد قانوني' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'توثيق' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'رفض' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'إنهاء' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'أرشفة' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'إصدار جديد' })).toBeNull();
  });
});
