import { describe, expect, it } from 'vitest';
import { AdmissionInquiry, AdmissionStatus } from '../modules/student-admission/domain/AdmissionInquiry';

const makeInquiry = () => AdmissionInquiry.create({
  tenantId: 'tenant-a',
  schoolId: 'school-a',
  branchId: 'branch-a',
  studentName: 'Student A',
  dateOfBirth: new Date('2015-01-01')
});

describe('AdmissionInquiry state transitions', () => {
  it('allows the verified, fee-paid and enrolled path in order', () => {
    const inquiry = makeInquiry();
    expect(inquiry.props.status).toBe(AdmissionStatus.INQUIRY);
    inquiry.transitionTo(AdmissionStatus.VERIFIED);
    inquiry.transitionTo(AdmissionStatus.FEE_PAID);
    inquiry.transitionTo(AdmissionStatus.ENROLLED);
    expect(inquiry.props.status).toBe(AdmissionStatus.ENROLLED);
  });

  it('rejects an illegal transition and preserves the current state', () => {
    const inquiry = makeInquiry();
    expect(() => inquiry.transitionTo(AdmissionStatus.FEE_PAID)).toThrow(/Invalid admission transition/);
    expect(inquiry.props.status).toBe(AdmissionStatus.INQUIRY);
  });

  it('keeps enrolled and rejected terminal', () => {
    const enrolled = makeInquiry();
    enrolled.transitionTo(AdmissionStatus.VERIFIED);
    enrolled.transitionTo(AdmissionStatus.FEE_PAID);
    enrolled.transitionTo(AdmissionStatus.ENROLLED);
    expect(() => enrolled.transitionTo(AdmissionStatus.REJECTED)).toThrow(/Invalid admission transition/);
    const rejected = makeInquiry();
    rejected.transitionTo(AdmissionStatus.REJECTED);
    expect(() => rejected.transitionTo(AdmissionStatus.VERIFIED)).toThrow(/Invalid admission transition/);
  });
});
