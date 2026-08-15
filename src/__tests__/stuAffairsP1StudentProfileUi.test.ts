import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'), 'utf8');

describe('STU-AFFAIRS-P1-006-64 Student List/Profile UI readiness', () => {
  it('keeps loading, error, and empty/no-match states semantically distinct', () => {
    expect(source).toContain('role="status" aria-live="polite"');
    expect(source).toContain('role="alert" className="text-rose-800"');
    expect(source).toContain('لا توجد سجلات طلاب محفوظة لهذا النطاق.');
    expect(source).toContain('لا توجد نتائج مطابقة لخيارات التصفية الحالية');
  });

  it('clears selections when the canonical page/filter context changes', () => {
    expect(source).toContain('setSelectedStudentIds([]);');
    expect(source).toContain('selectedSchool.id, searchKeyword, searchStatus, searchClass, currentPage, rowsPerPage, sortColumn, sortDirection');
  });

  it('renders only approved canonical student profile fields', () => {
    expect(source).toContain('البيانات الكانونية للطالب');
    expect(source).toContain('الاسم الكامل');
    expect(source).toContain('الاسم المفضل');
    expect(source).toContain('تاريخ الميلاد');
    expect(source).toContain('الجنسية');
    expect(source).not.toContain('ولي الأمر: {viewStudent.parentName');
    expect(source).not.toContain('{viewStudent.classroom ||');
    expect(source).not.toContain('{viewStudent.section ||');
  });

  it('does not expose national ID or guardian phone in the profile surface', () => {
    expect(source).not.toContain('viewStudent.nationalId');
    expect(source).not.toContain('viewStudent.parentPhone');
  });
});
