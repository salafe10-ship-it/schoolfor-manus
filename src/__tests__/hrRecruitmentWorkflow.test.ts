import { describe, expect, it } from 'vitest';
import { canMoveRecruitmentStatus, moveRecruitmentStatus, RecruitmentApplication } from '../modules/hr/domain/RecruitmentWorkflow';

const application: RecruitmentApplication = {
  id: 'APP-001', applicantName: 'مرشح اختبار', phone: '000', email: 'test@example.invalid', jobId: 'JOB-1', departmentId: 'DEP-1', submittedAt: '2026-09-22', status: 'submitted', auditLog: []
};

describe('HR recruitment workflow', () => {
  it('allows only the controlled forward path', () => {
    expect(canMoveRecruitmentStatus('submitted', 'screening')).toBe(true);
    expect(canMoveRecruitmentStatus('submitted', 'approved')).toBe(false);
    expect(canMoveRecruitmentStatus('converted', 'screening')).toBe(false);
  });

  it('records an auditable transition', () => {
    const next = moveRecruitmentStatus(application, 'screening', 'user-1', '2026-09-22T10:00:00Z');
    expect(next.status).toBe('screening');
    expect(next.auditLog).toHaveLength(1);
  });

  it('requires a real employee link before conversion', () => {
    const approved = { ...application, status: 'approved' as const };
    expect(() => moveRecruitmentStatus(approved, 'converted', 'user-1', '2026-09-22T10:00:00Z')).toThrow();
  });
});
