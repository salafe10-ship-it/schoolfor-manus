import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ExamsResultsModule from '../components/ExamsResultsModule';

vi.mock('../utils/authenticatedRequest', () => ({
  authenticatedRequest: (...args: Parameters<typeof fetch>) => fetch(...args),
}));

afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });

function renderProctors() {
  localStorage.setItem('exams_active_tab', 'proctors');
  return render(<ExamsResultsModule students={[]} classes={[]}
    teachers={[{ id: 'untrusted', name: 'معلم قديم خارج المصدر' } as any]}
    selectedSchool={{ id: 'school-test', name: 'مدرسة اختبار' }}
    triggerNotification={vi.fn()} />);
}

describe('live exams proctor source', () => {
  it('hydrates the proctor selector from the canonical catalogue, not shell fixtures', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => ({
      ok: true,
      json: async () => String(input).includes('/proctor-candidates')
        ? { success: true, data: [{ id: 'staff-1', name: 'مراقب اختبار', specialization: 'رياضيات' }] }
        : { success: true, data: [], meta: { hasNext: false, version: 0 } },
    })));
    renderProctors();
    expect(await screen.findByRole('option', { name: 'مراقب اختبار (رياضيات)' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: /معلم قديم/ })).toBeNull();
  });

  it('shows a recoverable source error instead of treating a failed request as empty staff', async () => {
    let fail = true;
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const proctors = String(input).includes('/proctor-candidates');
      return { ok: !proctors || !fail, json: async () => ({ success: !proctors || !fail, data: [], meta: { hasNext: false } }) };
    }));
    renderProctors();
    expect(await screen.findByText('تعذر تحميل المراقبين. أعد المحاولة قبل تكوين الجدول.')).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'تحديث قائمة المراقبين' }));
    expect(await screen.findByText(/لا يوجد موظفون نشطون في سجل المدرسة/)).toBeTruthy();
  });
});
