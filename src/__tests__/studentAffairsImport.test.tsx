import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StudentAffairsPortal from '../components/StudentAffairsPortal';
import type { School, Student } from '../types';

vi.mock('../modules/student-documents/presentation/StudentDocumentsPortal', () => ({
  default: () => null,
}));

const student = {
  id: 'student-1',
  schoolId: 'school-1',
  branchId: 'branch-1',
  name: 'طالب الاختبار',
  nationalId: '1000000000',
  classroom: 'المرحلة الابتدائية',
  section: 'أ',
  parentName: 'ولي الاختبار',
  parentPhone: '0500000000',
  registrationDate: '2026-01-01',
  status: 'active',
  feesPaid: 0,
  feesRemaining: 0,
  version: 1,
  isDeleted: false,
} as Student;

const school = {
  id: 'school-1',
  name: 'مدرسة الاختبار',
} as School;

describe('Student Affairs Excel import contract', () => {
  it('exposes a real preview-first import path without claiming success before commit', () => {
    const notify = vi.fn();
    render(
      <StudentAffairsPortal
        students={[student]}
        setStudents={vi.fn()}
        selectedSchool={school}
        currentRole="SchoolAdmin"
        logAction={vi.fn()}
        triggerNotification={notify}
        canUseTrustedPermission={() => true}
      />,
    );

    const importButton = screen.getByRole('button', { name: 'استيراد Excel / CSV' });

    expect((importButton as HTMLButtonElement).disabled).toBe(false);
    expect(importButton.getAttribute('title')).toContain('معاينة واعتماد دفعة ذرية');
    expect(screen.queryByRole('button', { name: 'اعتماد الاستيراد الذري' })).toBeNull();
    expect(notify).not.toHaveBeenCalledWith(expect.stringContaining('تم استيراد'), 'success');
  });
});
