import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudentFinancialPortal from '../components/StudentFinancialPortal';
import { authenticatedRequest } from '../utils/authenticatedRequest';

vi.mock('../utils/authenticatedRequest', () => ({ authenticatedRequest: vi.fn() }));

const response = (payload: unknown) => ({
  ok: true,
  status: 200,
  json: async () => payload
}) as Response;

let createObjectUrlDescriptor: PropertyDescriptor | undefined;
let revokeObjectUrlDescriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  createObjectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  revokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
});

afterEach(() => {
  vi.restoreAllMocks();
  if (createObjectUrlDescriptor) Object.defineProperty(URL, 'createObjectURL', createObjectUrlDescriptor);
  else delete (URL as typeof URL & { createObjectURL?: typeof URL.createObjectURL }).createObjectURL;
  if (revokeObjectUrlDescriptor) Object.defineProperty(URL, 'revokeObjectURL', revokeObjectUrlDescriptor);
  else delete (URL as typeof URL & { revokeObjectURL?: typeof URL.revokeObjectURL }).revokeObjectURL;
});

describe('student fee workbook review report', () => {
  it('keeps preview issues available for a user-initiated re-download without writing financial data', async () => {
    vi.mocked(authenticatedRequest).mockImplementation(async input => {
      if (String(input) === '/api/financial/database') {
        return response({
          success: true,
          meta: { writeMode: 'snapshot_read_only', version: 1 },
          data: { invoices: [], studentReceiptVouchers: [], chartOfAccounts: [] }
        });
      }
      if (String(input) === '/api/financial/operational-context') {
        return response({
          success: true,
          data: {
            academicYearId: 'year-test',
            academicYearName: '2026/2027',
            academicYearStartDate: '2026-09-01',
            academicPeriodId: 'term-test',
            academicPeriodName: 'الفصل الأول',
            branchId: 'branch-test',
            financialPeriod: '2026-2027'
          }
        });
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });

    const createObjectUrl = vi.fn(() => 'blob:student-fee-review');
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(<StudentFinancialPortal
      students={[]}
      setStudents={vi.fn()}
      invoices={[]}
      setInvoices={vi.fn()}
      filteredStudents={[]}
      handleStudentPaymentSubmit={vi.fn()}
      currentRole="SchoolAdmin"
      setActiveSection={vi.fn()}
      logAction={vi.fn()}
      triggerNotification={vi.fn()}
    />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'إعدادات مبالغ الرسوم' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'إعدادات مبالغ الرسوم' }));
    await waitFor(() => expect(screen.getByTitle('معاينة الشيت المالي والتحقق من المطابقة قبل أي حفظ أو ترحيل')).toBeEnabled());

    const header = Array(63).fill('');
    header[1] = 'الاسم الكامل';
    header[7] = 'المرحلة الدراسية';
    header[20] = 'قيمة المطالبة';
    const row = Array(63).fill('');
    row[1] = 'طالب للمراجعة';
    row[7] = 'ثانوي';
    row[8] = 'الأول';
    row[9] = '1';
    row[20] = '100';
    row[21] = '0';
    row[22] = '100';
    const csv = `${header.join(',')}\r\n${row.join(',')}`;
    const file = new File([csv], 'student-fees.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('استيراد الشيت الموحد المالي') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    const reviewButton = await screen.findByRole('button', { name: 'تنزيل تقرير مراجعة الاستيراد، 1 ملاحظة' });
    expect(screen.getByText(/لم تُعالج أي مطالبة؛ جميع الصفوف تحتاج مراجعة \(1\)/)).toBeVisible();
    expect(anchorClick).toHaveBeenCalledTimes(1);

    fireEvent.click(reviewButton);

    expect(anchorClick).toHaveBeenCalledTimes(2);
    expect(createObjectUrl).toHaveBeenCalledTimes(2);
    expect(revokeObjectUrl).not.toHaveBeenCalled();
    expect(vi.mocked(authenticatedRequest).mock.calls.map(([url]) => String(url)))
      .not.toContain('/api/financial/invoices/issue-batch');
    expect(vi.mocked(authenticatedRequest).mock.calls.map(([url]) => String(url)))
      .not.toContain('/api/financial/receipts/manual-settle');

    anchorClick.mockRestore();
  });
});
