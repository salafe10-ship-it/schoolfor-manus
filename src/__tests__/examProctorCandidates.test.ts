import { describe, expect, it } from 'vitest';
import { buildExamProctorCandidates } from '../modules/exams/application/ExamProctorCandidates';

describe('exam proctor catalogue projection', () => {
  it('returns only active identified staff and excludes private HR fields', () => {
    const result = buildExamProctorCandidates({
      jobs: [{ id: 'job-1', titleAr: 'معلم' }],
      employees: [
        { id: 'active', name: 'مراقب اختبار', status: 'active', jobId: 'job-1', basicSalary: 123, nationalId: 'private-id', iban: 'private-bank', phone: 'private-phone' },
        { id: 'leave', name: 'في إجازة', status: 'on_leave' },
        { id: 'resigned', name: 'مستقيل', status: 'resigned' },
        { id: 'suspended', name: 'موقوف', status: 'suspended' },
        { id: 'unknown', name: 'حالة مجهولة' },
        { id: '', name: 'بلا معرف', status: 'active' },
      ],
    });
    expect(result).toEqual([{ id: 'active', name: 'مراقب اختبار', specialization: 'معلم' }]);
    expect(JSON.stringify(result)).not.toContain('private');
  });

  it('does not invent candidates for an empty or invalid HR snapshot', () => {
    expect(buildExamProctorCandidates(undefined)).toEqual([]);
    expect(buildExamProctorCandidates({ employees: {} })).toEqual([]);
  });

  it('keeps distinct staff with equal names and removes duplicate identifiers', () => {
    expect(buildExamProctorCandidates({ employees: [
      { id: '1', name: 'اسم مشترك', status: 'active', major: 'رياضيات' },
      { id: '1', name: 'اسم مشترك', status: 'active', major: 'رياضيات' },
      { id: '2', name: 'اسم مشترك', status: 'active', major: 'علوم' },
    ] })).toHaveLength(2);
  });
});
