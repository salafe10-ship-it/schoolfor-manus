import { describe, expect, it } from 'vitest';
import { buildCapacityAwareOperationalEnrollmentPlan } from '../modules/student-affairs/application/OperationalEnrollmentAssignmentService';

describe('operational enrollment assignment', () => {
  const classes = [
    { id: 'class-a', code: 'PRI1-A', name: 'أولى ابتدائي أ', capacity: 2, section: 'أ' },
    { id: 'class-b', code: 'PRI1-B', name: 'أولى ابتدائي ب', capacity: 2, section: 'ب' }
  ];

  it('uses only approved classes, balances deterministically, and keeps the matching section', () => {
    const assignments = buildCapacityAwareOperationalEnrollmentPlan([
      { id: '00000000-0000-4000-8000-000000000003', studentNumber: 'STU-003', status: 'applicant' },
      { id: '00000000-0000-4000-8000-000000000001', studentNumber: 'STU-001', status: 'active' },
      { id: '00000000-0000-4000-8000-000000000002', studentNumber: 'STU-002', status: 'active' }
    ], classes, new Map([['أولى ابتدائي أ', 1]]));

    expect(assignments).toEqual([
      { studentId: '00000000-0000-4000-8000-000000000001', classReference: 'أولى ابتدائي ب', sectionReference: 'ب' },
      { studentId: '00000000-0000-4000-8000-000000000002', classReference: 'أولى ابتدائي أ', sectionReference: 'أ' },
      { studentId: '00000000-0000-4000-8000-000000000003', classReference: 'أولى ابتدائي ب', sectionReference: 'ب' }
    ]);
  });

  it('fails before writing when the configured capacity cannot hold the full batch', () => {
    expect(() => buildCapacityAwareOperationalEnrollmentPlan([
      { id: 'student-1', studentNumber: 'STU-001', status: 'active' },
      { id: 'student-2', studentNumber: 'STU-002', status: 'active' },
      { id: 'student-3', studentNumber: 'STU-003', status: 'active' },
      { id: 'student-4', studentNumber: 'STU-004', status: 'active' }
    ], classes, new Map([['أولى ابتدائي أ', 1], ['أولى ابتدائي ب', 1]]))).toThrow('السعات المعتمدة للفصول لا تكفي');
  });
});
