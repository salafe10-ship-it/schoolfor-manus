import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ExamsResultsModule from '../components/ExamsResultsModule';

vi.mock('../utils/auth', async importOriginal => {
  const actual = await importOriginal<typeof import('../utils/auth')>();
  return {
    ...actual,
    getTrustedAccessToken: () => 'exams-settings-test-token',
    getTrustedAccessTokenAsync: async () => 'exams-settings-test-token',
    refreshTrustedAccessToken: async () => 'exams-settings-test-token',
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

const persistedSettings = {
  academicYear: '2026-2027',
  semester: 'الفصل الدراسي الثاني',
  examType: 'الاختبارات النهائية',
  roundingPolicy: 'التقريب لأقرب نصف درجة',
  passPolicy: 'سياسة اختبار',
  passMarkPercent: 50,
  minFinalMarkPercent: 20,
};

describe('exam settings save feedback', () => {
  it('does not write or claim success when settings have not changed', async () => {
    localStorage.setItem('exams_active_tab', 'settings');
    const notify = vi.fn();
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [], meta: { hasNext: false } }) };
      }
      if (url.includes('/api/exams/audit-events')) {
        return { ok: true, json: async () => ({ success: true, data: [] }) };
      }
      if (url === '/api/exams/database' && init?.method === 'POST') {
        return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 5 } }) };
      }
      return {
        ok: true,
        json: async () => ({ success: true, data: { exams_settings: persistedSettings }, meta: { version: 4 } }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={notify}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-test-1', name: 'مدرسة الاختبار', academicYear: '2026-2027' }}
        currentRole="SchoolAdmin"
      />,
    );

    const saveButton = await screen.findByRole('button', { name: 'لا توجد تغييرات للحفظ' });
    await waitFor(() => expect(notify).toHaveBeenCalledWith(
      'تم الاتصال بقاعدة البيانات واسترجاع كافة السجلات بنجاح',
      'success',
    ));
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(saveButton);

    expect(fetchMock.mock.calls.some(([input, init]) => (
      String(input) === '/api/exams/database' && init?.method === 'POST'
    ))).toBe(false);
    expect(notify).not.toHaveBeenCalledWith('تم حفظ إعدادات وثوابت الامتحانات بنجاح', 'success');
  });

  it('persists a real settings change and only confirms after server acknowledgment', async () => {
    localStorage.setItem('exams_active_tab', 'settings');
    const notify = vi.fn();
    let postedSettings: Record<string, unknown> | null = null;
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [], meta: { hasNext: false } }) };
      }
      if (url.includes('/api/exams/audit-events')) {
        return { ok: true, json: async () => ({ success: true, data: [] }) };
      }
      if (url === '/api/exams/database' && init?.method === 'POST') {
        const payload = JSON.parse(String(init.body));
        postedSettings = payload.exams_settings;
        return { ok: true, json: async () => ({ success: true, data: {}, meta: { version: 5 } }) };
      }
      return {
        ok: true,
        json: async () => ({ success: true, data: { exams_settings: persistedSettings }, meta: { version: 4 } }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ExamsResultsModule
        students={[]}
        teachers={[]}
        classes={[]}
        triggerNotification={notify}
        setActiveSection={vi.fn()}
        selectedSchool={{ id: 'school-test-1', name: 'مدرسة الاختبار', academicYear: '2026-2027' }}
        currentRole="SchoolAdmin"
      />,
    );

    const saveButton = await screen.findByRole('button', { name: 'لا توجد تغييرات للحفظ' });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'الفصل الدراسي الأول' } });
    await waitFor(() => expect((saveButton as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(saveButton);

    await waitFor(() => expect(postedSettings).toEqual(expect.objectContaining({ semester: 'الفصل الدراسي الأول' })));
    expect(notify).toHaveBeenCalledWith('تم حفظ إعدادات وثوابت الامتحانات بنجاح', 'success');
  });
});
