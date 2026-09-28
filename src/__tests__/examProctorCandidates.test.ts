import { describe, expect, it } from 'vitest';
import { buildExamProctorCandidates } from '../modules/exams/application/ExamProctorCandidates';

describe('canonical exam staff candidates', () => {
  it('projects only active staff identity fields and a safe display specialization', () => {
    const candidates = buildExamProctorCandidates({
      jobs: [{ id: 'job-teacher', titleAr: 'معلم' }],
      employees: [
        { id: 'emp-active', name: 'أحمد', status: 'active', jobId: 'job-teacher', salary: 9000, nationalId: 'private' },
        { id: 'emp-inactive', name: 'موظف سابق', status: 'inactive' },
        { id: 'missing-name', status: 'active' },
        { id: 'emp-active', name: 'أحمد المحدث', status: 'active', major: 'رياضيات' }
      ]
    });

    expect(candidates).toEqual([
      { id: 'emp-active', name: 'أحمد المحدث', specialization: 'رياضيات' }
    ]);
    expect(JSON.stringify(candidates)).not.toContain('salary');
    expect(JSON.stringify(candidates)).not.toContain('nationalId');
  });

  it('fails closed for an absent or malformed HR snapshot', () => {
    expect(buildExamProctorCandidates(null)).toEqual([]);
    expect(buildExamProctorCandidates({ employees: 'not-an-array' })).toEqual([]);
  });
});
