import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ExamsResultsModule from '../components/ExamsResultsModule';
import { readSpreadsheetMatrix } from '../utils/ExcelWorkbookUtils';

vi.mock('../utils/auth', async importOriginal => {
  const actual = await importOriginal<typeof import('../utils/auth')>();
  return {
    ...actual,
    getTrustedAccessToken: () => 'exams-runtime-test-token',
    getTrustedAccessTokenAsync: async () => 'exams-runtime-test-token',
    refreshTrustedAccessToken: async () => 'exams-runtime-test-token',
  };
});

const examTabSectionById: Record<string, string> = {
  'control-center': 'setup', settings: 'setup', classes: 'setup', assessment: 'setup',
  halls: 'committees', distribution: 'committees', seating: 'committees', proctors: 'committees', schedule: 'committees',
  'grades-entry': 'results', processing: 'results',
  'quality-governance': 'release', review: 'release', reports: 'release', certificates: 'release',
  'system-settings': 'admin', 'exams-guide': 'admin'
};

const openExamTab = async (container: HTMLElement, tabId: string) => {
  let button = container.querySelector<HTMLButtonElement>(`#exam-tab-btn-${tabId}`);
  if (!button) {
    const section = examTabSectionById[tabId];
    const sectionToggle = container.querySelector<HTMLButtonElement>(`#exam-nav-section-toggle-${section}`);
    expect(sectionToggle, `missing navigation section ${section}`).not.toBeNull();
    fireEvent.click(sectionToggle!);
    button = await waitFor(() => {
      const revealedButton = container.querySelector<HTMLButtonElement>(`#exam-tab-btn-${tabId}`);
      expect(revealedButton, `navigation section ${section} did not reveal ${tabId}`).not.toBeNull();
      return revealedButton!;
    });
  }
  fireEvent.click(button);
  await waitFor(() => expect(button?.getAttribute('aria-current')).toBe('page'));
  return button;
};

describe('ExamsResultsModule runtime', () => {
  const tabs = [
    'control-center', 'exams-guide', 'quality-governance', 'settings', 'classes',
    'assessment', 'halls', 'distribution', 'seating', 'proctors', 'schedule', 'grades-entry',
    'review', 'processing', 'reports', 'certificates', 'system-settings'
  ];

  it('renders the control center without crashing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    }));

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
      />,
    );

    expect((await screen.findAllByText(/مركز عمليات الكنترول الموحد/)).length).toBeGreaterThan(0);
  });

  it.each(tabs)('renders the %s tab safely with a canonical empty database', async tabId => {
    cleanup();
    localStorage.setItem('exams_active_tab', tabId);
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [], meta: { hasNext: false } }) };
      }
      return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 0 } }) };
    }));

    const { container, unmount } = render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    await waitFor(() => expect(container.querySelector('#exams-module-content')).not.toBeNull());
    expect(container.textContent).not.toBe('');
    unmount();
  });

  it('opens every sidebar screen and updates the current-page state', async () => {
    localStorage.setItem('exams_active_tab', 'control-center');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {}, meta: { version: 0 } }),
    }));

    const { container } = render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    await waitFor(() => expect(container.querySelector('#exam-tab-btn-control-center')).not.toBeNull());
    for (const tabId of tabs) {
      const button = await openExamTab(container, tabId);
      expect(button, `missing sidebar button for ${tabId}`).not.toBeNull();
      expect(button?.getAttribute('aria-current')).toBe('page');
      expect(container.querySelector('#exams-module-content')?.textContent).not.toBe('');
    }
  });

  it('disables final results approval until an empty cycle passes the shared readiness gate', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'review');
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [], meta: { hasNext: false } }) };
      }
      return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 0 } }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    const approveButton = await screen.findByRole('button', { name: 'اعتماد النتائج والدرجات وقفل الكنترول' });
    expect((approveButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(approveButton);
    expect(fetchMock.mock.calls.some(([input, init]) => String(input) === '/api/exams/database' && init?.method === 'POST')).toBe(false);
    const blockerStatus = screen.getByRole('status', { name: 'المتطلبات المتبقية لاعتماد النتائج' });
    expect(blockerStatus.textContent).toContain('بلا طلاب موثقين');
    expect(blockerStatus.textContent).toContain('بلا مواد موثقة');
    expect(blockerStatus.textContent).toContain('اعتماد جدول الامتحانات');
  });

  it('keeps approval disabled for a populated test cohort with no subjects, halls, or approved schedule', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'review');
    const students = Array.from({ length: 4 }, (_, index) => ({
      id: `student-test-${index + 1}`,
      name: `طالب اختبار ${index + 1}`,
      classroom: 'بستان أ',
      academicYear: '2026/2027',
      status: 'active',
      absentSubjects: [],
      hallId: '',
      seatNumber: ''
    }));
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: students, meta: { hasNext: false } }) };
      }
      if (String(input).includes('/api/exams/audit-events')) {
        return { ok: true, json: async () => ({ success: true, data: [] }) };
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            exams_settings: { academicYear: '2026/2027' },
            exams_classes_list: [{ id: 'class-test-1', name: 'بستان أ', capacity: 25 }],
            exams_subjects: [],
            exams_halls: [],
            exams_students_enriched: students,
            exams_grades_matrix: {},
            exams_schedule: [],
            exams_schedule_approval_status: { approved: false },
            exams_reviewed_stages_subjects: {},
            exams_re_evaluation_requests: []
          },
          meta: { version: 2 }
        })
      };
    }));

    render(
      <ExamsResultsModule
        students={students as any}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2026-2027' }}
        currentRole="SchoolAdmin"
      />,
    );

    const approveButton = await screen.findByRole('button', { name: 'اعتماد النتائج والدرجات وقفل الكنترول' });
    expect((approveButton as HTMLButtonElement).disabled).toBe(true);
    const blockerStatus = screen.getByRole('status', { name: 'المتطلبات المتبقية لاعتماد النتائج' });
    expect(blockerStatus.textContent).toContain('بلا مواد موثقة');
    expect(blockerStatus.textContent).toContain('اعتماد جدول الامتحانات');
    expect(blockerStatus.textContent).toContain('دون قاعة أو رقم جلوس');
  });

  it('does not label an empty schedule safe or send an approval request', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'schedule');
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [], meta: { hasNext: false } }) };
      }
      if (String(input).includes('/api/exams/audit-events')) {
        return { ok: true, json: async () => ({ success: true, data: [] }) };
      }
      return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 0 } }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /التبويب الثالث: مراجعة واعتماد جدول الامتحانات/ }));
    expect(screen.getAllByText('لا يوجد جدول لفحصه').length).toBeGreaterThan(0);
    const approveButton = await screen.findByRole('button', { name: 'الموافقة واعتماد الجدول نهائياً 🔒' });
    expect((approveButton as HTMLButtonElement).disabled).toBe(true);
    const blockerStatus = screen.getByRole('status', { name: 'المتطلبات المتبقية لاعتماد الجدول' });
    expect(blockerStatus.textContent).toContain('لا توجد اختبارات مستهدفة');
    expect(blockerStatus.textContent).toContain('لا يوجد جدول لفحصه');
    fireEvent.click(approveButton);
    expect(fetchMock.mock.calls.some(([input, init]) => String(input) === '/api/exams/database' && init?.method === 'POST')).toBe(false);
  });

  it('does not call a partially scheduled exam cycle safe or enable approval', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'schedule');
    const student = {
      id: 'student-schedule-test-1', name: 'طالب جدولة اختبار', classroom: 'صف جدولة اختبار', section: 'أ',
      academicYear: '2025-2026', status: 'active', seatNumber: 41001, hallId: 'hall-schedule-test-1'
    };
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [student], meta: { hasNext: false } }) };
      }
      if (url.includes('/api/exams/audit-events')) return { ok: true, json: async () => ({ success: true, data: [] }) };
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            exams_classes_list: [{ id: 'class-schedule-test-1', name: 'صف جدولة اختبار', level: 'primary', sections: ['أ'], capacity: 20 }],
            exams_subjects: [
              { id: 'subject-schedule-test-1', name: 'مادة اختبار 1', maxScore: 100, passScore: 50 },
              { id: 'subject-schedule-test-2', name: 'مادة اختبار 2', maxScore: 100, passScore: 50 }
            ],
            exams_halls: [{ id: 'hall-schedule-test-1', name: 'قاعة اختبار', capacity: 20, status: 'active' }],
            exams_students_enriched: [student],
            exams_schedule: [{
              id: 'exam-schedule-test-1', classroom: 'صف جدولة اختبار', subjectId: 'subject-schedule-test-1',
              date: '2025-10-05', startTime: '08:30', endTime: '10:30', hallId: 'hall-schedule-test-1', proctorId: 'teacher-test-1'
            }],
            exams_schedule_approval_status: { approved: false }
          },
          meta: { version: 1 }
        })
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ExamsResultsModule
        students={[student] as any}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /التبويب الثالث: مراجعة واعتماد جدول الامتحانات/ }));
    expect((await screen.findAllByText('الجدول غير مكتمل')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/تمت جدولة 1 من 2 اختباراً مطلوباً/).length).toBeGreaterThan(0);
    expect(screen.queryByText('الجدول آمن وخالٍ من التعارضات تماماً!')).toBeNull();
    const approveButton = screen.getByRole('button', { name: 'الموافقة واعتماد الجدول نهائياً 🔒' });
    expect((approveButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(approveButton);
    expect(fetchMock.mock.calls.some(([input, init]) => String(input) === '/api/exams/database' && init?.method === 'POST')).toBe(false);
  });

  it('opens the selected navigation group from a direct screen link', async () => {
    localStorage.setItem('exams_active_tab', 'classes');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {}, meta: { version: 0 } }),
    }));

    const { container } = render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    const setupGroup = await screen.findByRole('button', { name: /١\. البدء والتهيئة/ });
    expect(setupGroup.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('#exam-tab-btn-classes')).not.toBeNull();
    expect(container.querySelector('#exam-tab-btn-control-center')).not.toBeNull();
    expect(container.querySelector('#exam-tab-btn-halls')).toBeNull();
  });

  it('keeps the classrooms screen readable and makes filtering states clear', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'classes');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [], meta: { hasNext: false } }) };
      }
      return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 0 } }) };
    }));

    const { container } = render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[{ id: 'class-test-1', name: 'صف اختبار', level: 'primary', sections: ['أ', 'ب'], capacity: 25 }]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /الصفوف والشعب الدراسية/ }));

    const classHeading = await screen.findByRole('heading', { name: 'صف اختبار' });
    expect(classHeading.className).toContain('text-[#fce79a]');
    expect(classHeading.closest('div[class*="bg-gradient-to-br"]')).not.toBeNull();
    expect(screen.getByText('عرض 1 من 1')).toBeTruthy();
    expect(screen.getByText('شعبة أ')).toBeTruthy();
    expect(screen.getByText('شعبة ب')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'حذف الصف صف اختبار' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'تعديل الصف صف اختبار' }).getAttribute('aria-label')).toBe('تعديل الصف صف اختبار');
    expect(screen.getByRole('button', { name: /الصفوف والشعب الدراسية/ }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.change(screen.getByPlaceholderText('البحث عن صف أو صف دراسي محدد...'), { target: { value: 'غير موجود' } });
    expect(screen.getByText('عرض 0 من 1')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('لا توجد صفوف تطابق البحث');

    fireEvent.change(screen.getByPlaceholderText('البحث عن صف أو صف دراسي محدد...'), { target: { value: '' } });
    expect(screen.getByText('عرض 1 من 1')).toBeTruthy();
    expect(container.querySelector('#exams-module-content')?.textContent).toContain('صف اختبار');
  });

  it('covers classroom create/read/update/delete, reload, duplicate guards, and unsafe references', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'classes');
    let version = 3;
    let database: Record<string, any> = {
      exams_classes_list: [{ id: 'class-test-1', name: 'صف اختبار', level: 'primary', sections: ['أ', 'ب'], capacity: 25 }],
    };
    const writePayloads: Record<string, any>[] = [];
    const notify = vi.fn();
    const canonicalStudents = [
      { id: 'student-test-1', name: 'طالب اختبار 1', classroom: 'صف اختبار', section: 'أ', academicYear: '2025-2026', status: 'active' },
      { id: 'student-test-2', name: 'طالب اختبار 2', classroom: 'صف اختبار', section: 'أ', academicYear: '2025-2026', status: 'active' },
    ];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: canonicalStudents, meta: { hasNext: false } }) };
      }
      if (url.includes('/api/exams/audit-events')) {
        return { ok: true, json: async () => ({ success: true, data: [] }) };
      }
      if (url === '/api/exams/database' && init?.method === 'POST') {
        const payload = JSON.parse(String(init.body));
        writePayloads.push(payload);
        database = payload;
        version += 1;
        return { ok: true, json: async () => ({ success: true, data: {}, meta: { version } }) };
      }
      return { ok: true, json: async () => ({ success: true, data: database, meta: { version } }) };
    }));

    const renderModule = () => render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={notify}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    const firstView = renderModule();
    fireEvent.click(await screen.findByRole('button', { name: /الصفوف والشعب الدراسية/ }));
    fireEvent.change(screen.getByLabelText('اسم الصف الدراسي'), { target: { value: 'صف اختبار احتياطي' } });
    fireEvent.change(screen.getByLabelText('السعة الكلية'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('الشعب الدراسية'), { target: { value: 'أ, ب' } });
    fireEvent.click(screen.getByRole('button', { name: 'إضافة الصف ومزامنته' }));

    await waitFor(() => expect(writePayloads).toHaveLength(1));
    expect(database.exams_classes_list).toHaveLength(2);
    expect(database.exams_classes_list).toContainEqual(expect.objectContaining({ name: 'صف اختبار احتياطي', capacity: 8, sections: ['أ', 'ب'] }));
    expect(await screen.findByRole('heading', { name: 'صف اختبار احتياطي' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('اسم الصف الدراسي'), { target: { value: 'صف اختبار احتياطي' } });
    fireEvent.click(screen.getByRole('button', { name: 'إضافة الصف ومزامنته' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('اسم الصف صف اختبار احتياطي موجود بالفعل. اختر اسماً مختلفاً.', 'warning'));
    expect(writePayloads).toHaveLength(1);
    expect(database.exams_classes_list).toHaveLength(2);

    fireEvent.click(await screen.findByRole('button', { name: 'تعديل الصف صف اختبار' }));
    fireEvent.change(screen.getByLabelText('السعة'), { target: { value: '28' } });
    fireEvent.change(screen.getByLabelText('الشعب (افصل بينها بفاصلة)'), { target: { value: 'أ, ب, ج' } });
    fireEvent.click(screen.getByRole('button', { name: 'حفظ التعديل' }));

    await waitFor(() => expect(writePayloads).toHaveLength(2));
    expect(database.exams_classes_list).toContainEqual(
      expect.objectContaining({ id: 'class-test-1', name: 'صف اختبار', level: 'primary', capacity: 28, sections: ['أ', 'ب', 'ج'] }),
    );
    expect(database.exams_classes_list).toHaveLength(2);
    expect(await screen.findByText('شعبة ج')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'تعديل الصف صف اختبار' }));
    fireEvent.change(screen.getByLabelText('اسم الصف'), { target: { value: 'اسم صف جديد' } });
    fireEvent.click(screen.getByRole('button', { name: 'حفظ التعديل' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('لا يمكن تغيير اسم صف مرتبط بطلاب أو جدول امتحانات؛ عالج المراجع الأكاديمية أولاً.', 'warning'));
    expect(writePayloads).toHaveLength(2);
    expect(database.exams_classes_list[0].name).toBe('صف اختبار');

    firstView.unmount();
    cleanup();
    localStorage.setItem('exams_active_tab', 'classes');
    const reloadedView = renderModule();
    fireEvent.click(await screen.findByRole('button', { name: /الصفوف والشعب الدراسية/ }));
    expect(await screen.findByText('شعبة ج')).toBeTruthy();
    expect(screen.getByText('28 طالب')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'حذف الصف صف اختبار احتياطي' }));
    await waitFor(() => expect(writePayloads).toHaveLength(3));
    expect(database.exams_classes_list).toHaveLength(1);
    expect(screen.queryByRole('heading', { name: 'صف اختبار احتياطي' })).toBeNull();

    reloadedView.unmount();
    cleanup();
    localStorage.setItem('exams_active_tab', 'classes');
    const afterDeleteReload = renderModule();
    fireEvent.click(await screen.findByRole('button', { name: /الصفوف والشعب الدراسية/ }));
    expect(await screen.findByText('شعبة ج')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'صف اختبار احتياطي' })).toBeNull();
    afterDeleteReload.unmount();
  });

  it('reports a successful central sync for an empty canonical exam database', async () => {
    localStorage.setItem('exams_active_tab', 'classes');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [], meta: { hasNext: false } }) };
      }
      return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 0 } }) };
    }));

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    expect(await screen.findByText(/آخر مزامنة ناجحة مع السيرفر:/)).toBeTruthy();
    expect(screen.queryByText('لم يتم الاتصال بالسيرفر بعد، البيانات تحفظ مؤقتاً في المتصفح')).toBeNull();
  });

  it('preserves hostile student names as literal text in printable reports', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'reports');
    const hostileName = 'طالب <img src=x onerror=alert(1)> اختبار';
    const hostileClass = 'صف <svg onload=alert(1)> اختبار';
    const notify = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: [{ id: 'student-test-1', name: hostileName, classroom: hostileClass, section: 'أ', academicYear: '2025-2026', status: 'active' }],
            meta: { hasNext: false }
          })
        };
      }
      if (url.includes('/api/exams/audit-events')) {
        return { ok: true, json: async () => ({ success: true, data: [] }) };
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            exams_settings: { academicYear: '2025-2026', semester: 'الفصل الدراسي الثاني', examType: 'الاختبارات النهائية' },
            exams_subjects: [{ id: 'subject-test-1', name: 'مادة اختبار 1', maxScore: 100, passScore: 50 }],
            exams_classes_list: [{ id: 'class-test-1', name: hostileClass, level: 'primary', sections: ['أ'], capacity: 10 }],
            exams_grades_matrix: { 'student-test-1': { 'subject-test-1': 90 } }
          },
          meta: { version: 1 }
        })
      };
    }));

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={notify}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    await waitFor(() => expect(notify).toHaveBeenCalledWith(
      'تم الاتصال بقاعدة البيانات واسترجاع كافة السجلات بنجاح',
      'success',
    ));
    vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue({
      focus: vi.fn(),
      print: vi.fn(),
      addEventListener: vi.fn(),
    } as unknown as Window);
    fireEvent.click(screen.getByRole('button', { name: 'تصدير وطباعة التقرير العام الشامل' }));

    const printFrame = await waitFor(() => {
      const frame = document.querySelector<HTMLIFrameElement>('iframe[data-exam-print-frame]');
      expect(frame?.srcdoc).toBeTruthy();
      return frame!;
    });
    const printDocument = new DOMParser().parseFromString(printFrame.srcdoc, 'text/html');
    const reportRow = printDocument.querySelector('tbody tr');
    expect(reportRow?.querySelector('td:nth-child(2)')?.textContent).toBe(hostileName);
    expect(reportRow?.querySelector('td:nth-child(3)')?.textContent).toBe(hostileClass);
    expect(printDocument.querySelector('img, svg, script')).toBeNull();
    printFrame.remove();
    vi.restoreAllMocks();
  });

  it('protects general Excel exports from formulas after leading control characters', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'halls');
    const maliciousHallName = '\t=HYPERLINK("https://bad.example")';
    const notify = vi.fn();
    const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    let exportedBlob: Blob | null = null;
    let exportedFilename = '';
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: (blob: Blob) => {
        exportedBlob = blob;
        return 'blob:exam-export-test';
      }
    });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      exportedFilename = this.download;
    });
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [], meta: { hasNext: false } }) };
      }
      if (url.includes('/api/exams/audit-events')) {
        return { ok: true, json: async () => ({ success: true, data: [] }) };
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { exams_halls: [{ id: 'hall-test-1', name: maliciousHallName, capacity: 10, location: 'مبنى الاختبار' }] },
          meta: { version: 1 }
        })
      };
    }));

    try {
      render(
        <ExamsResultsModule
          students={[]}
          teachers={[]}
          classes={[]}
          triggerNotification={notify}
          setActiveSection={vi.fn()}
          selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
          currentRole="SchoolAdmin"
        />,
      );

      await waitFor(() => expect(notify).toHaveBeenCalledWith(
        'تم الاتصال بقاعدة البيانات واسترجاع كافة السجلات بنجاح',
        'success',
      ));
      fireEvent.click(screen.getByRole('button', { name: 'تصدير Excel' }));
      await waitFor(() => expect(exportedBlob).not.toBeNull());
      expect(exportedFilename).toBe('halls_list.xlsx');
      expect(exportedBlob!.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const exportedBytes = new Uint8Array(await exportedBlob!.arrayBuffer());
      expect(Array.from(exportedBytes.slice(0, 2))).toEqual([0x50, 0x4b]);
      const workbookRows = await readSpreadsheetMatrix(await exportedBlob!.arrayBuffer());
      expect(workbookRows[1][1]).toBe(`'\t=HYPERLINK("https://bad.example")`);
    } finally {
      anchorClick.mockRestore();
      if (originalCreateObjectUrl) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectUrl);
      else Reflect.deleteProperty(URL, 'createObjectURL');
    }
  });

  it('downloads the classrooms Excel action as a real XLSX workbook', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'classes');
    const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    let exportedBlob: Blob | null = null;
    let exportedFilename = '';
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: (blob: Blob) => {
        exportedBlob = blob;
        return 'blob:class-export-test';
      }
    });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      exportedFilename = this.download;
    });

    try {
      vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        if (String(input).startsWith('/api/students')) {
          return { ok: true, json: async () => ({ success: true, data: [], meta: { hasNext: false } }) };
        }
        return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 0 } }) };
      }));

      render(
        <ExamsResultsModule
          students={[]}
          teachers={[]}
          classes={[{ id: 'class-export-test-1', name: 'صف اختبار', level: 'primary', sections: ['أ'], capacity: 25 }]}
          triggerNotification={vi.fn()}
          setActiveSection={vi.fn()}
          selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
          currentRole="SchoolAdmin"
        />,
      );

      fireEvent.click(await screen.findByRole('button', { name: /الصفوف والشعب الدراسية/ }));
      fireEvent.click(screen.getByRole('button', { name: 'تصدير Excel' }));
      await waitFor(() => expect(exportedBlob).not.toBeNull());
      expect(exportedFilename).toBe('الفصول والصفوف المسجلة.xlsx');
      const workbookRows = await readSpreadsheetMatrix(await exportedBlob!.arrayBuffer());
      expect(workbookRows[0]).toEqual(['ID', 'اسم الصف', 'المستوى', 'السعة', 'الشعب']);
      expect(workbookRows[1]).toEqual(['class-export-test-1', 'صف اختبار', 'primary', 25, 'أ']);
    } finally {
      anchorClick.mockRestore();
      if (originalCreateObjectUrl) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectUrl);
      else Reflect.deleteProperty(URL, 'createObjectURL');
    }
  });

  it('distinguishes server-side data validation rejection from a connection failure', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'classes');
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [], meta: { hasNext: false } }) };
      }
      if (url === '/api/exams/database' && init?.method === 'POST') {
        return { ok: false, status: 422, json: async () => ({ message: 'بيانات الاختبار غير متوافقة.' }) };
      }
      return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 0 } }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    const saveButton = await screen.findByRole('button', { name: 'حفظ ومزامنة فورية' });
    await waitFor(() => expect((saveButton as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(saveButton);
    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) => (
      String(input) === '/api/exams/database' && init?.method === 'POST'
    ))).toBe(true));
    expect(await screen.findByText(/رفض المصدر البيانات — راجع رسالة التحقق/)).toBeTruthy();
    expect((await screen.findByRole('alert')).textContent).toContain('بيانات الاختبار غير متوافقة.');
    expect(screen.queryByText('فشل طلب المصدر المركزي')).toBeNull();
  });

  it('keeps the server rejection reason visible when a save handler emits a generic toast', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'classes');
    const notify = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [], meta: { hasNext: false } }) };
      }
      if (url === '/api/exams/database' && init?.method === 'POST') {
        return {
          ok: false,
          status: 403,
          json: async () => ({
            message: 'الدور الحالي لا يملك صلاحية تعديل بيانات الامتحانات.',
            traceId: 'exams-write-denied-test',
            details: 'internal database details must not be shown'
          })
        };
      }
      return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 0 } }) };
    }));

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={notify}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    fireEvent.change(await screen.findByPlaceholderText('مثال: لغة عربية، فيزياء كمية...'), {
      target: { value: 'CODEX-TEST مادة 1' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'إضافة المادة ودفعها للسيرفر' }));

    const error = await screen.findByText(/آخر محاولة حفظ لم تنجح/);
    const errorText = error.closest('[role="alert"]')?.textContent || '';
    expect(errorText).toContain('الدور الحالي لا يملك صلاحية تعديل بيانات الامتحانات.');
    expect(errorText).toContain('exams-write-denied-test');
    expect(errorText).not.toContain('internal database details');
    expect(notify).toHaveBeenCalledWith('تعذر حفظ المادة الجديدة في المصدر المركزي.', 'warning');
    expect(screen.queryByText('CODEX-TEST مادة 1')).toBeNull();
  });

  it('surfaces a canonical class-reference rejection instead of reporting the source as offline', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'classes');
    const notify = vi.fn();
    const classReferenceError = 'صفوف طلاب نشطة غير معرفة في الهيكل الأكاديمي: بستان أ.';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: [{ id: 'student-test-1', name: 'طالب اختبار', classroom: 'بستان أ', section: 'أ', academicYear: '2025-2026', status: 'active' }],
            meta: { hasNext: false }
          })
        };
      }
      if (url === '/api/exams/sync-canonical-classes' && init?.method === 'POST') {
        return { ok: false, status: 422, json: async () => ({ message: classReferenceError }) };
      }
      if (url === '/api/exams/audit-events') {
        return { ok: true, json: async () => ({ success: true, data: [] }) };
      }
      return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 4 } }) };
    }));

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={notify}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'مطابقة صفوف الهيكل' }));

    expect(await screen.findByText('رفض المصدر البيانات — راجع رسالة التحقق')).toBeTruthy();
    await waitFor(() => expect(notify).toHaveBeenCalledWith(classReferenceError, 'warning'));
    expect(screen.queryByText('فشل طلب المصدر المركزي')).toBeNull();
  });

  it('keeps an unconfigured grade sheet incomplete and blocks grade actions without a subject', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'grades-entry');
    const canonicalStudents = Array.from({ length: 4 }, (_, index) => ({
      id: `student-test-${index + 1}`,
      name: `طالب اختبار ${index + 1}`,
      classroom: 'صف اختبار',
      section: 'أ',
      academicYear: '2025-2026',
      status: 'active'
    }));
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: canonicalStudents, meta: { hasNext: false } }) };
      }
      return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 0 } }) };
    }));

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    expect((await screen.findAllByText('غير مكتمل ⏳')).length).toBe(4);
    expect(screen.queryByText('راسب')).toBeNull();
    expect(screen.queryByText('ضعيف')).toBeNull();
    const attendanceChoices = screen.getAllByRole('checkbox', { name: /حاضر/ });
    expect(attendanceChoices).toHaveLength(4);
    expect(attendanceChoices.every(choice => (choice as HTMLInputElement).disabled && !(choice as HTMLInputElement).checked)).toBe(true);
    expect((screen.getByRole('button', { name: 'حفظ الكشف' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'اعتماد الدرجات' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('finds students by their displayed student number and blocks empty grade approval honestly', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'grades-entry');
    const student = {
      id: 'internal-student-test-1', studentNumber: 'ID-TEST-2026-004', name: 'طالب اختبار 4',
      classroom: 'بستان أ', section: 'أ', academicYear: '2026-2027', status: 'active',
      seatNumber: 40001, hallId: 'hall-test-1', absentSubjects: []
    };
    let postCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [student], meta: { hasNext: false } }) };
      }
      if (url === '/api/exams/database' && init?.method === 'POST') {
        postCount += 1;
        return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 2 } }) };
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            exams_settings: { academicYear: '2026-2027', semester: 'الفصل الدراسي الثاني', examType: 'الاختبارات النهائية' },
            exams_classes_list: [{ id: 'class-grade-test-1', name: 'بستان أ', level: 'kindergarten', sections: ['أ'], capacity: 10 }],
            exams_subjects: [{ id: 'subject-grade-test-1', name: 'مادة اختبار 1', maxScore: 100, passScore: 50 }],
            exams_students_enriched: [student],
            exams_grades_matrix: {},
            exams_halls: [{ id: 'hall-test-1', name: 'قاعة اختبار', capacity: 10 }],
            exams_schedule: [],
            exams_schedule_approval_status: { approved: false }
          },
          meta: { version: 1 }
        })
      };
    }));

    render(
      <ExamsResultsModule
        students={[student] as any}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2026-2027' }}
        currentRole="SchoolAdmin"
      />,
    );

    expect(await screen.findByText('طالب اختبار 4')).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('بحث سريع برقم الجلوس، رقم الطالب، أو اسم الطالب...'), {
      target: { value: 'ID-TEST-2026-004' }
    });
    expect(await screen.findByText('طالب اختبار 4')).toBeTruthy();

    const saveButton = screen.getByRole('button', { name: 'حفظ الكشف' }) as HTMLButtonElement;
    const approveButton = screen.getByRole('button', { name: 'اعتماد الدرجات' }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
    expect(saveButton.hasAttribute('data-no-save-toast')).toBe(true);
    expect(approveButton.disabled).toBe(true);
    fireEvent.click(saveButton);
    expect(postCount).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'مراجعة الدرجات' }));
    expect(await screen.findByText('لا توجد درجات مرصودة بعد؛ ستظهر الإحصاءات بعد تسجيل أول درجة.')).toBeTruthy();
    expect(screen.queryByText('0 / 100')).toBeNull();
    expect((screen.getByRole('button', { name: 'اعتماد هذا الكشف نهائياً' }) as HTMLButtonElement).disabled).toBe(true);
    expect(postCount).toBe(0);
  });

  it('does not claim the grade sheet was saved when the central source is unavailable', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'grades-entry');
    let rejectExamDatabase = false;
    const canonicalStudents = [{
      id: 'student-test-1',
      name: 'طالب اختبار',
      classroom: 'صف اختبار',
      section: 'أ',
      academicYear: '2025-2026',
      status: 'active'
    }];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: canonicalStudents, meta: { hasNext: false } }) };
      }
      if (url.includes('/api/exams/database')) {
        if (rejectExamDatabase) {
          return { ok: false, status: 503, json: async () => ({ message: 'central source unavailable' }) };
        }
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              exams_settings: { academicYear: '2025-2026', semester: 'الفصل الدراسي الثاني', examType: 'الاختبارات النهائية' },
              exams_subjects: [{ id: 'subject-test-1', name: 'مادة اختبار 1', maxScore: 100, passingScore: 50 }],
              exams_classes_list: [{ id: 'class-test-1', name: 'صف اختبار', level: 'primary', sections: ['أ'], capacity: 10 }]
            },
            meta: { version: 1 }
          })
        };
      }
      if (url.includes('/api/exams/audit-events')) {
        return { ok: true, json: async () => ({ success: true, data: [] }) };
      }
      return { ok: true, json: async () => ({ success: true, data: [] }) };
    }));

    const { container } = render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    expect(await screen.findByText('طالب اختبار')).toBeTruthy();
    rejectExamDatabase = true;
    await openExamTab(container, 'classes');
    fireEvent.click(await screen.findByRole('button', { name: 'استرجاع وتحديث' }));
    expect((await screen.findAllByText('فشل طلب المصدر المركزي')).length).toBeGreaterThan(0);
    await openExamTab(container, 'grades-entry');
    fireEvent.click(await screen.findByRole('button', { name: 'كشف الدرجات العام (شامل المجموعات)' }));
    expect(await screen.findByText('⚠️ تعذر الاتصال بالمصدر المركزي؛ حالة حفظ الدرجات غير مؤكدة.')).toBeTruthy();
    expect(screen.queryByText('✓ لا توجد مسودات درجات معلقة؛')).toBeNull();
  });

  it('does not report a clean warning scan or enable formal review before exam subjects exist', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'quality-governance');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [], meta: { hasNext: false } }) };
      }
      return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 0 } }) };
    }));

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    expect(await screen.findByText('لا يمكن إصدار مؤشرات خطر قبل تهيئة مادة امتحانية ورصد النتائج.')).toBeTruthy();
    expect(screen.queryByText('لا توجد أي إنذارات مبكرة أو مؤشرات خطر مكتشفة حالياً في الكنترول ✓')).toBeNull();
    expect((screen.getByRole('button', { name: 'توقيع وتصدير مطابقة المادة المحددة رسمياً' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('explains exactly which input is missing before results processing', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'processing');
    const notify = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: [{ id: 'student-test-1', name: 'طالب اختبار', classroom: 'صف اختبار', section: 'أ', academicYear: '2025-2026', status: 'active' }],
            meta: { hasNext: false }
          })
        };
      }
      return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 0 } }) };
    }));

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={notify}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    expect((await screen.findAllByText('غير مصنف — النتيجة غير مكتملة')).length).toBe(1);
    expect(screen.queryByText('🥇 الأول')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'تحديث ومعالجة النتائج الكلية' }));
    expect(notify).toHaveBeenCalledWith('تعذر معالجة النتائج: يلزم توفير مادة امتحانية موثقة أولاً.', 'warning');
  });

  it('reports incomplete results as excluded from ranking without implying a save', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'processing');
    const notify = vi.fn();
    const student = {
      id: 'student-process-test-1', name: 'طالب معالجة اختبار', classroom: 'صف معالجة اختبار', section: 'أ',
      academicYear: '2025-2026', status: 'active', absentSubjects: []
    };
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [student], meta: { hasNext: false } }) };
      }
      if (url.includes('/api/exams/audit-events')) return { ok: true, json: async () => ({ success: true, data: [] }) };
      if (url === '/api/exams/database' && init?.method === 'POST') {
        return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 2 } }) };
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            exams_classes_list: [{ id: 'class-process-test-1', name: 'صف معالجة اختبار', level: 'primary', sections: ['أ'], capacity: 10 }],
            exams_subjects: [{ id: 'subject-process-test-1', name: 'مادة معالجة اختبار', maxScore: 100, passScore: 50 }],
            exams_students_enriched: [student],
            exams_grades_matrix: {}
          },
          meta: { version: 1 }
        })
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ExamsResultsModule
        students={[student] as any}
        teachers={[]}
        classes={[]}
        triggerNotification={notify}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    expect(await screen.findByText('غير مصنف — النتيجة غير مكتملة')).toBeTruthy();
    expect(screen.queryByText('🥇 الأول')).toBeNull();
    expect(screen.queryByText('0 / 100')).toBeNull();
    expect(screen.queryByText('0%')).toBeNull();
    const processButton = screen.getByRole('button', { name: 'تحديث ومعالجة النتائج الكلية' });
    expect(processButton.hasAttribute('data-no-save-toast')).toBe(true);
    fireEvent.click(processButton);
    await waitFor(() => expect(notify).toHaveBeenCalledWith(
      expect.stringContaining('استُبعد 1 طالباً غير مكتمل من ترتيب الأوائل'),
      'warning'
    ));
    expect(fetchMock.mock.calls.some(([input, init]) => String(input) === '/api/exams/database' && init?.method === 'POST')).toBe(false);
  });

  it('persists setup edits only after server acknowledgment and restores them after reload', async () => {
    cleanup();
    localStorage.setItem('exams_active_tab', 'classes');
    let database: Record<string, any> = {
      exams_classes_list: [{ id: 'class-test-1', name: 'صف اختبار', level: 'primary', sections: ['أ'], capacity: 10 }],
      exams_schedule_config: {
        startDate: '2025-10-05',
        examsPerWeek: 5,
        subjectsPerDay: 1,
        minGapDays: 1,
        dailySlots: [{ id: 'slot-test-1', start: '08:30', end: '10:30', label: 'الفترة الأولى' }],
        holidayDays: [5, 6],
        customHolidays: [],
      },
    };
    let version = 1;
    let rejectFirstWrite = true;
    const writePayloads: Record<string, any>[] = [];
    const canonicalStudents = [
      { id: 'student-test-1', name: 'طالب اختبار 1', classroom: 'صف اختبار', section: 'أ', academicYear: '2025-2026', status: 'active' },
      { id: 'student-test-2', name: 'طالب اختبار 2', classroom: 'صف اختبار', section: 'أ', academicYear: '2025-2026', status: 'active' },
    ];
    const apiFetch = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: canonicalStudents, meta: { hasNext: false } }) };
      }
      if (url.includes('/api/exams/audit-events')) {
        return { ok: true, json: async () => ({ success: true, data: [] }) };
      }
      if (url.includes('/api/exams/result-archives/')) {
        return { ok: true, json: async () => ({ success: true, data: { valid: true, studentId: 'student-test-1', studentName: 'طالب اختبار 1' } }) };
      }
      if (url.includes('/api/exams/database')) {
        if (init?.method === 'POST') {
          const payload = JSON.parse(String(init.body));
          writePayloads.push(payload);
          if (rejectFirstWrite) {
            rejectFirstWrite = false;
            return { ok: false, status: 503, json: async () => ({ message: 'central source unavailable' }) };
          }
          if (payload.operation === 'approve' && (
            payload.exams_schedule_approval_status?.approved !== true
            || !payload.exams_students_enriched?.every((student: any) => student.hallId && student.seatNumber)
            || !payload.exams_students_enriched?.every((student: any) => ['present', 'absent'].includes(student.examAttendance?.[payload.exams_subjects?.[0]?.id]))
            || !payload.exams_students_enriched?.every((student: any) => student.examAttendance?.[payload.exams_subjects?.[0]?.id] === 'absent'
              || payload.exams_grades_matrix?.[student.id]?.[payload.exams_subjects?.[0]?.id] !== undefined)
          )) {
            return { ok: false, status: 422, json: async () => ({ message: 'test archive rejected incomplete cycle' }) };
          }
          if (payload.operation === 'approve') {
            const archive = {
              archiveId: 'archive-test-1',
              isImmutableArchive: true,
              attendanceSchemaVersion: 1,
              signatureHash: 'a'.repeat(64),
              approvedBy: 'مدير اختبار',
              serverSignedAt: '2025-10-06T12:00:00.000Z',
              closedAt: '2025-10-06T12:00:00.000Z',
              totalStudents: canonicalStudents.length,
              passedCount: canonicalStudents.length,
              failedCount: 0,
              passRate: 100,
            };
            database = {
              ...payload,
              exams_approval_status: { approved: true, approvedBy: archive.approvedBy, approvedAt: archive.serverSignedAt },
              exams_control_closures: [archive],
            };
            version += 1;
            return { ok: true, json: async () => ({ success: true, data: { archive }, meta: { version } }) };
          }
          database = payload;
          version += 1;
          return { ok: true, json: async () => ({ success: true, data: {}, meta: { version } }) };
        }
        return { ok: true, json: async () => ({ success: true, data: database, meta: { version } }) };
      }
      return { ok: true, json: async () => ({ success: true, data: [] }) };
    });
    vi.stubGlobal('fetch', apiFetch);

    const renderModule = () => render(
      <ExamsResultsModule
        students={[]}
        teachers={[{
          id: 'teacher-test-1', schoolId: 'school-1', branchId: 'branch-1', name: 'معلم اختبار', specialization: 'اختبار',
          email: 'teacher-test@example.invalid', phone: '0000000', hiringDate: '2020-01-01', salary: 0,
          status: 'active', assignedClasses: ['صف اختبار']
        }]}
        classes={[]}
        triggerNotification={vi.fn()}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-1', name: 'مدرسة الاختبار', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />,
    );

    const firstView = renderModule();
    const subjectName = await screen.findByPlaceholderText('مثال: لغة عربية، فيزياء كمية...');
    fireEvent.change(subjectName, { target: { value: 'مادة اختبار 1' } });
    fireEvent.click(screen.getByRole('button', { name: 'إضافة المادة ودفعها للسيرفر' }));

    await waitFor(() => expect(writePayloads).toHaveLength(1));
    expect(database.exams_subjects).toBeUndefined();
    expect(screen.queryByText('مادة اختبار 1')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'إضافة المادة ودفعها للسيرفر' }));
    expect(await screen.findByText('مادة اختبار 1')).toBeTruthy();
    expect(database.exams_subjects).toEqual([
      expect.objectContaining({ name: 'مادة اختبار 1', maxScore: 100, passScore: 50 }),
    ]);

    await openExamTab(firstView.container, 'halls');
    fireEvent.change(await screen.findByPlaceholderText('مثال: قاعة ابن حيان الكبرى'), { target: { value: 'قاعة اختبار 1' } });
    fireEvent.change(screen.getByPlaceholderText('مثال: مبنى البنين - الطابق الأول'), { target: { value: 'مبنى الاختبار' } });
    fireEvent.click(screen.getByRole('button', { name: 'تسجيل القاعة الجديدة' }));

    expect(await screen.findByText('قاعة اختبار 1')).toBeTruthy();
    expect(database.exams_halls).toEqual([
      expect.objectContaining({ name: 'قاعة اختبار 1', capacity: 25, location: 'مبنى الاختبار' }),
    ]);
    expect(database.exams_subjects).toEqual([
      expect.objectContaining({ name: 'مادة اختبار 1' }),
    ]);

    await openExamTab(firstView.container, 'proctors');
    const proctorForm = screen.getByRole('button', { name: 'تأكيد التكليف والملاحظة' }).closest('form')!;
    fireEvent.change(proctorForm.querySelector('select')!, { target: { value: 'معلم اختبار' } });
    fireEvent.click(screen.getByRole('button', { name: 'تأكيد التكليف والملاحظة' }));
    await waitFor(() => expect(database.exams_proctors).toHaveLength(1));

    await openExamTab(firstView.container, 'distribution');
    fireEvent.click(await screen.findByRole('button', { name: 'التوزيع التلقائي وتوليد الجلوس' }));
    expect(await screen.findByText('40001')).toBeTruthy();
    expect(database.exams_students_enriched).toHaveLength(2);
    expect(database.exams_students_enriched.map((student: any) => student.seatNumber)).toEqual([40001, 40002]);
    expect(database.exams_students_enriched.every((student: any) => student.hallId === database.exams_halls[0].id)).toBe(true);

    await openExamTab(firstView.container, 'schedule');
    fireEvent.click(await screen.findByRole('button', { name: /التبويب الثاني: محرك الجدولة/ }));
    const scheduleFormButton = await screen.findByRole('button', { name: 'إضافة الامتحان للجدول وتأكيد المتطلبات' });
    const scheduleForm = scheduleFormButton.closest('form')!;
    const scheduleSelects = scheduleForm.querySelectorAll('select');
    fireEvent.change(scheduleSelects[0], { target: { value: 'صف اختبار' } });
    fireEvent.change(scheduleSelects[1], { target: { value: database.exams_subjects[0].id } });
    fireEvent.change(scheduleForm.querySelector('input[type="date"]')!, { target: { value: '2025-10-05' } });
    fireEvent.change(screen.getByPlaceholderText('08:30'), { target: { value: '08:30' } });
    fireEvent.change(screen.getByPlaceholderText('10:30'), { target: { value: '10:30' } });
    fireEvent.change(scheduleSelects[2], { target: { value: database.exams_halls[0].id } });
    fireEvent.change(scheduleSelects[3], { target: { value: 'teacher-test-1' } });
    fireEvent.click(scheduleFormButton);
    await waitFor(() => expect(database.exams_schedule).toHaveLength(1));
    expect(database.exams_schedule[0]).toMatchObject({ classroom: 'صف اختبار', date: '2025-10-05', proctorId: 'teacher-test-1' });

    const scheduleApprovalTab = Array.from(firstView.container.querySelectorAll('button'))
      .find(button => button.textContent?.includes('التبويب الثالث: مراجعة واعتماد جدول الامتحانات'));
    expect(scheduleApprovalTab).toBeDefined();
    fireEvent.click(scheduleApprovalTab!);
    const approveScheduleButton = screen.getByRole('button', { name: 'الموافقة واعتماد الجدول نهائياً 🔒' });
    expect((approveScheduleButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('سبب اعتماد جدول الامتحانات'), { target: { value: 'اعتماد دورة اختبار محلية معزولة' } });
    expect((approveScheduleButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(approveScheduleButton);
    await waitFor(() => expect(database.exams_schedule_approval_status.approved).toBe(true));

    firstView.unmount();
    cleanup();
    localStorage.setItem('exams_active_tab', 'classes');
    const reloadedView = renderModule();
    expect(await screen.findByText('مادة اختبار 1')).toBeTruthy();
    await openExamTab(reloadedView.container, 'halls');
    expect(await screen.findByText('قاعة اختبار 1')).toBeTruthy();
    await openExamTab(reloadedView.container, 'distribution');
    expect(await screen.findByText('40001')).toBeTruthy();
    expect(await screen.findByText('طالب اختبار 1')).toBeTruthy();

    await openExamTab(reloadedView.container, 'grades-entry');
    const gradeInputs = await screen.findAllByPlaceholderText('بانتظار الرصد');
    expect(gradeInputs).toHaveLength(2);
    expect((gradeInputs[0] as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'حاضر — طالب اختبار 1 — مادة اختبار 1' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'غائب — طالب اختبار 2 — مادة اختبار 1' }));
    await waitFor(() => {
      expect((gradeInputs[0] as HTMLInputElement).disabled).toBe(false);
      expect((gradeInputs[1] as HTMLInputElement).disabled).toBe(true);
    });
    fireEvent.change(gradeInputs[0], { target: { value: '90' } });
    fireEvent.change(gradeInputs[1], { target: { value: '80' } });
    fireEvent.click(screen.getByRole('button', { name: 'حفظ الكشف' }));
    const savedSubjectId = database.exams_subjects[0].id;
    await waitFor(() => {
      expect(database.exams_grades_matrix['student-test-1']?.[savedSubjectId]).toBe(90);
      expect(database.exams_grades_matrix['student-test-2']?.[savedSubjectId]).toBeUndefined();
      expect(database.exams_students_enriched[0].examAttendance?.[savedSubjectId]).toBe('present');
      expect(database.exams_students_enriched[1].examAttendance?.[savedSubjectId]).toBe('absent');
    });
    expect((await screen.findAllByText('ناجح')).length).toBeGreaterThan(0);

    await openExamTab(reloadedView.container, 'quality-governance');
    const reviewedSubject = reloadedView.container.querySelector<HTMLSelectElement>('#review-subject-select');
    expect(reviewedSubject).not.toBeNull();
    fireEvent.change(reviewedSubject!, { target: { value: savedSubjectId } });
    fireEvent.click(screen.getByRole('button', { name: 'توقيع وتصدير مطابقة المادة المحددة رسمياً' }));
    await waitFor(() => expect(database.exams_reviewed_stages_subjects?.[savedSubjectId]).toBe(true));

    await openExamTab(reloadedView.container, 'certificates');
    expect(await screen.findByText('الإصدار المعتمد مقفل')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'طباعة إفادة النتيجة المعتمدة' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'تصدير كشف الدرجات CSV' })).toBeTruthy();

    await openExamTab(reloadedView.container, 'review');
    fireEvent.change(screen.getByLabelText('سبب اعتماد النتائج وقفل الكنترول'), { target: { value: 'اعتماد دورة اختبار محلية معزولة' } });
    const approveResultsButton = screen.getByRole('button', { name: 'اعتماد النتائج والدرجات وقفل الكنترول' });
    expect((approveResultsButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(approveResultsButton);
    await waitFor(() => expect(database.exams_approval_status.approved).toBe(true));
    expect(database.exams_control_closures[0]).toMatchObject({ archiveId: 'archive-test-1', isImmutableArchive: true });

    await openExamTab(reloadedView.container, 'certificates');
    expect(await screen.findByText('جاهز للإصدار المعتمد')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'طباعة إفادة النتيجة المعتمدة' }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.change(screen.getByPlaceholderText('معرف الأرشيف:معرف الطالب'), { target: { value: 'archive-test-1:student-test-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'تحقق' }));
    expect(await screen.findByText(/تمت مطابقة الرمز بختم الخادم للطالب طالب اختبار 1/)).toBeTruthy();
    expect(writePayloads).toHaveLength(10);
  });
});
