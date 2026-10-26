import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StudentFinancialPortal from '../components/StudentFinancialPortal';
import type { Student } from '../types';
import { authenticatedRequest } from '../utils/authenticatedRequest';

vi.mock('../utils/authenticatedRequest', () => ({ authenticatedRequest: vi.fn() }));

const makeStudent = (index: number, schoolId = 'school-test'): Student => ({
  id: `student-${index}`,
  schoolId,
  branchId: 'branch-test',
  name: index >= 101 ? `طالب اختبار ثانوي ${index}` : `طالب اختبار ${index}`,
  nationalId: `national-${index}`,
  classroom: index >= 101 ? 'صف اختبار 1 الثانوي' : 'صف اختبار ابتدائي',
  section: 'أ',
  parentName: `ولي أمر ${index}`,
  parentPhone: '',
  registrationDate: '2026-10-01',
  status: 'active',
  feesPaid: 0,
  feesRemaining: 0,
  version: 1,
  isDeleted: false,
  academicId: String(index).padStart(5, '0')
});

const response = (payload: unknown) => ({
  ok: true,
  status: 200,
  json: async () => payload
}) as Response;

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('student selection data in the fees module', () => {
  it('hydrates every canonical student page even when the app already holds a partial school list', async () => {
    const canonicalStudents = Array.from({ length: 120 }, (_, index) => makeStudent(index + 1));
    const initialStudents = canonicalStudents.slice(0, 20);
    let updatedStudents: Student[] = initialStudents;
    const setStudents = vi.fn((update: React.SetStateAction<Student[]>) => {
      updatedStudents = typeof update === 'function' ? update(updatedStudents) : update;
    });

    vi.mocked(authenticatedRequest).mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith('/api/students?')) {
        const page = Number(new URL(url, 'http://localhost').searchParams.get('page'));
        const data = page === 1 ? canonicalStudents.slice(0, 100) : canonicalStudents.slice(100);
        return response({
          success: true,
          data,
          meta: { page, limit: 100, totalCount: canonicalStudents.length, totalPages: 2, hasNext: page < 2 }
        });
      }
      if (url === '/api/financial/database') {
        return response({
          success: true,
          meta: { writeMode: 'snapshot_read_only', version: 1 },
          data: { invoices: [], feeConfigs: [], studentReceiptVouchers: [], receiptVouchers: [], journalEntries: [], chartOfAccounts: [] }
        });
      }
      if (url === '/api/financial/operational-context') {
        return response({ success: true, data: { academicYearId: 'year-test', academicPeriodId: 'term-test' } });
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    render(<StudentFinancialPortal
      students={initialStudents}
      setStudents={setStudents}
      invoices={[]}
      setInvoices={vi.fn()}
      filteredStudents={initialStudents}
      handleStudentPaymentSubmit={vi.fn()}
      currentRole="SchoolAdmin"
      setActiveSection={vi.fn()}
      logAction={vi.fn()}
      triggerNotification={vi.fn()}
      selectedSchool={{ id: 'school-test', name: 'مدرسة اختبار' }}
    />);

    await waitFor(() => expect(updatedStudents).toHaveLength(120));
    expect(vi.mocked(authenticatedRequest).mock.calls.map(([input]) => String(input)).filter(url => url.startsWith('/api/students?')))
      .toEqual([
        '/api/students?page=1&limit=100&sortBy=name&sortOrder=asc',
        '/api/students?page=2&limit=100&sortBy=name&sortOrder=asc'
      ]);
    expect(updatedStudents.some(student => student.name === 'طالب اختبار ثانوي 120')).toBe(true);
    expect(setStudents).toHaveBeenCalledTimes(1);
  });
});
