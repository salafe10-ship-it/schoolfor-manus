import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StudentFinancialPortal from '../components/StudentFinancialPortal';
import { authenticatedRequest } from '../utils/authenticatedRequest';

vi.mock('../utils/authenticatedRequest', () => ({ authenticatedRequest: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('financial reports while the canonical read is loading', () => {
  it('survives immediate navigation and enables reports only after the verified read completes', async () => {
    let finishDatabaseRead!: (response: Response) => void;
    const databaseRead = new Promise<Response>(resolve => { finishDatabaseRead = resolve; });
    const response = (data: unknown) => ({ ok: true, json: async () => data }) as Response;
    vi.mocked(authenticatedRequest).mockImplementation(async input => {
      if (String(input) === '/api/financial/database') return databaseRead;
      if (String(input) === '/api/financial/operational-context') return response({
        success: true, data: { academicYearId: 'year-test', academicPeriodId: 'term-test' },
      });
      throw new Error(`Unexpected request: ${String(input)}`);
    });

    render(<StudentFinancialPortal
      students={[]} setStudents={vi.fn()} invoices={[]} setInvoices={vi.fn()} filteredStudents={[]}
      handleStudentPaymentSubmit={vi.fn()} currentRole="SchoolAdmin" setActiveSection={vi.fn()}
      logAction={vi.fn()} triggerNotification={vi.fn()} selectedSchool={{ id: 'school-test', name: 'مدرسة اختبار' }}
    />);
    fireEvent.click(screen.getByRole('button', { name: 'التقارير المالية' }));
    expect(screen.getByText('📊 تقارير الحسابات الشاملة وحوكمة المحفظة السحابية')).toBeVisible();
    expect(screen.getAllByText('غير متاح').length).toBeGreaterThanOrEqual(3);
    for (const title of ['طباعة التقرير', 'تصدير بصيغة PDF', 'تصدير بصيغة Excel']) {
      expect(screen.getByTitle(title)).toBeDisabled();
    }

    await act(async () => finishDatabaseRead(response({
      success: true,
      meta: { writeMode: 'snapshot_read_only', version: 1 },
      data: {
        invoices: [{ id: 'invoice-test', invoiceNumber: 'INV-2026-000001', studentId: 'student-test',
          studentName: 'طالب اختبار', amount: 1200, paidAmount: 300, remainingAmount: 900,
          invoiceDate: '2026-10-24', status: 'partially_paid', item: 'رسوم دراسية' }],
        studentReceiptVouchers: [], chartOfAccounts: [],
      },
    })));
    await waitFor(() => expect(screen.getByTitle('تصدير بصيغة PDF')).toBeEnabled());
    expect(screen.getByTitle('طباعة التقرير')).toBeEnabled();
    expect(screen.getByTitle('تصدير بصيغة Excel')).toBeEnabled();
    fireEvent.click(screen.getByTitle('تصدير بصيغة PDF'));
    const preview = screen.getByRole('dialog');
    expect(within(preview).getByText('INV-2026-000001')).toBeVisible();
    expect(within(preview).getAllByText(/1,200\.00/).length).toBeGreaterThan(0);
  });
});
