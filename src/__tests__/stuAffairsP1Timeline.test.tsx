import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StudentAffairsPortal from '../components/StudentAffairsPortal';
import { StudentRepository } from '../components/student-affairs/repository/StudentRepository';
import type { School, Student } from '../types';

vi.mock('../modules/student-documents/presentation/StudentDocumentsPortal', () => ({ default: () => null }));

const student = {
  id: 'student-1', schoolId: 'school-1', branchId: 'branch-1', name: 'طالب الخط الزمني',
  studentCode: 'ST-001', classroom: 'الرابع', section: '1', parentName: 'ولي الاختبار',
  parentPhone: '0500000000', registrationDate: '2026-01-01', status: 'active', version: 1,
} as Student;
const school = { id: 'school-1', name: 'مدرسة الاختبار' } as School;

function renderPortal() {
  vi.spyOn(StudentRepository, 'list').mockResolvedValue({ data: [student], meta: { page: 1, limit: 50, totalCount: 1, totalPages: 1 } });
  localStorage.setItem('edupro_token', 'trusted-test-token');
  render(
    <StudentAffairsPortal
      students={[student]}
      setStudents={vi.fn()}
      selectedSchool={school}
      currentRole="SchoolAdmin"
      logAction={vi.fn()}
      triggerNotification={vi.fn()}
    />,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('STU-AFFAIRS-P1-006-05 Student Timeline UI', () => {
  it('shows a loading state and calls only the canonical student timeline endpoint', async () => {
    let resolveTimeline!: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { resolveTimeline = resolve; })));
    renderPortal();
    fireEvent.click(await screen.findByTitle('عرض الملف والبطاقة'));
    fireEvent.click(screen.getByRole('button', { name: 'عرض الخط الزمني' }));

    expect(screen.getByRole('status')).not.toBeNull();
    expect(fetch).toHaveBeenCalledWith('/api/students/student-1/timeline', expect.objectContaining({ method: 'GET' }));
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toMatch(/tenant|school|branch/i);

    resolveTimeline({ ok: true, status: 200, json: async () => ({ data: [] }) } as Response);
    await waitFor(() => expect(screen.getByText('لا توجد أحداث زمنية لهذا الطالب ضمن النطاق الحالي.')).not.toBeNull());
  });

  it('renders the server events only after a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => ({ data: [{ id: 'event-1', title: 'تسجيل القيد', description: 'تم إنشاء السجل', date: '2026-08-12T10:00:00Z', user: 'المستخدم الموثوق' }] }) } as Response)));
    renderPortal();
    fireEvent.click(await screen.findByTitle('عرض الملف والبطاقة'));
    fireEvent.click(screen.getByRole('button', { name: 'عرض الخط الزمني' }));
    expect(await screen.findByText('تسجيل القيد')).not.toBeNull();
    expect(screen.getByText('تم إنشاء السجل')).not.toBeNull();
  });

  it('renders an explicit error and retry action without fake success', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 500, json: async () => ({ message: 'تعذر تحميل الخط الزمني' }) } as Response)));
    renderPortal();
    fireEvent.click(await screen.findByTitle('عرض الملف والبطاقة'));
    fireEvent.click(screen.getByRole('button', { name: 'عرض الخط الزمني' }));
    expect((await screen.findByRole('alert')).textContent).toContain('تعذر تحميل الخط الزمني');
    expect(screen.getByRole('button', { name: 'إعادة المحاولة' })).not.toBeNull();
    expect(screen.queryByText('تم تحميل الخط الزمني بنجاح')).toBeNull();
  });
});
