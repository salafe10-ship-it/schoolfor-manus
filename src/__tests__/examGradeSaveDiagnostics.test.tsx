import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ExamsResultsModule from '../components/ExamsResultsModule';

vi.mock('../utils/auth', async importOriginal => {
  const actual = await importOriginal<typeof import('../utils/auth')>();
  return {
    ...actual,
    getTrustedAccessToken: () => 'exam-save-diagnostic-test-token',
    getTrustedAccessTokenAsync: async () => 'exam-save-diagnostic-test-token',
    refreshTrustedAccessToken: async () => 'exam-save-diagnostic-test-token',
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('exam grade save diagnostics', () => {
  it('shows the safe server trace reference beside the grade sheet after a failed save', async () => {
    localStorage.setItem('exams_active_tab', 'grades-entry');
    const student = {
      id: 'student-diagnostic-1',
      name: 'طالب اختبار التشخيص',
      classroom: 'صف الاختبار',
      section: 'أ',
      academicYear: '2025-2026',
      status: 'active',
      examAttendance: { 'subject-diagnostic-1': 'present' }
    };
    const traceId = 'tr_exam_write_failure';
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/students')) {
        return { ok: true, json: async () => ({ success: true, data: [student], meta: { hasNext: false } }) };
      }
      if (url === '/api/exams/database' && init?.method === 'POST') {
        return {
          ok: false,
          status: 500,
          json: async () => ({
            success: false,
            message: 'تعذر إتمام الطلب الآن. حاول مرة أخرى لاحقاً.',
            traceId,
            details: 'internal database error must remain private'
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
            exams_settings: { academicYear: '2025-2026', semester: 'الفصل الثاني', examType: 'الاختبارات النهائية' },
            exams_subjects: [{ id: 'subject-diagnostic-1', name: 'مادة اختبار التشخيص', maxScore: 100, passScore: 50 }],
            exams_classes_list: [{ id: 'class-diagnostic-1', name: 'صف الاختبار', sections: ['أ'] }],
            exams_students_enriched: [student],
            exams_grades_matrix: { 'student-diagnostic-1': { 'subject-diagnostic-1': 86 } },
            exams_approval_status: { approved: false, approvedBy: '', approvedAt: '' }
          },
          meta: { version: 4 }
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
        selectedSchool={{ id: 'school-diagnostic-1', name: 'مدرسة اختبار التشخيص', academicYear: '2025-2026' }}
        currentRole="SchoolAdmin"
      />
    );

    const grade = await screen.findByDisplayValue('86');
    fireEvent.change(grade, { target: { value: '85' } });
    fireEvent.click(screen.getByRole('button', { name: 'حفظ الكشف' }));

    const alert = await screen.findByRole('alert');
    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) => (
      String(input) === '/api/exams/database' && init?.method === 'POST'
    ))).toBe(true));
    expect(alert.textContent).toContain(traceId);
    expect(alert.textContent).toContain('لم يثبت حفظ كشف الدرجات');
    expect(alert.textContent).not.toContain('internal database error');
  });
});
