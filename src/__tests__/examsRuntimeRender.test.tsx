import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ExamsResultsModule from '../components/ExamsResultsModule';

describe('ExamsResultsModule runtime', () => {
  const tabs = [
    'control-center', 'exams-guide', 'quality-governance', 'settings', 'classes',
    'halls', 'distribution', 'seating', 'proctors', 'schedule', 'grades-entry',
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
});
