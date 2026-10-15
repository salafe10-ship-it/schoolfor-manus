import React from 'react';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StudentFinancialPortal from '../components/StudentFinancialPortal';
import type { Grade, Stage, Student } from '../types';

vi.mock('../utils/authenticatedRequest', () => ({
  authenticatedRequest: vi.fn(async (url: string) => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: url.includes('operational-context')
        ? { academicYearId: 'year-test', academicPeriodId: 'period-test' }
        : {},
    }),
  })),
}));

describe('bulk fee distribution grade selection', () => {
  it('lists students in a registered grade even when their section has a different name', async () => {
    const students = [
      { id: 'student-a', name: 'QA-2026-student-A', schoolId: 'school-test', stageId: 'stage-primary', gradeId: 'grade-1', classroom: 'أولى ابتدائي أ' },
      { id: 'student-b', name: 'QA-2026-student-B', schoolId: 'school-test', stageId: 'stage-primary', gradeId: 'grade-2', classroom: 'ثانية ابتدائي أ' },
      { id: 'student-other-school', name: 'QA-2026-other-school', schoolId: 'school-other', stageId: 'stage-primary', gradeId: 'grade-1', classroom: 'أولى ابتدائي أ' },
    ] as Student[];
    const stages = [{ id: 'stage-primary', name: 'المرحلة الابتدائية', type: 'primary', order: 1, isActive: true }] as Stage[];
    const grades = [
      { id: 'grade-1', stageId: 'stage-primary', name: 'الصف الأول الابتدائي', order: 1, isActive: true },
      { id: 'grade-2', stageId: 'stage-primary', name: 'الصف الثاني الابتدائي', order: 2, isActive: true },
    ] as Grade[];

    render(<StudentFinancialPortal
      students={students}
      filteredStudents={students}
      setStudents={vi.fn()}
      invoices={[]}
      setInvoices={vi.fn()}
      handleStudentPaymentSubmit={vi.fn()}
      currentRole="SchoolAdmin"
      setActiveSection={vi.fn()}
      logAction={vi.fn()}
      triggerNotification={vi.fn()}
      selectedSchool={{ id: 'school-test' }}
      stages={stages}
      grades={grades}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'التوزيع الجماعي للرسوم' }));
    expect(await screen.findByRole('row', { name: /QA-2026-student-A/ })).toBeInTheDocument();
    const table = within(screen.getByRole('table'));
    expect(table.queryByText('QA-2026-student-B')).not.toBeInTheDocument();
    expect(table.queryByText('QA-2026-other-school')).not.toBeInTheDocument();
  });
});
