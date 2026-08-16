// src/modules/student-admission/domain/AdmissionInquiry.ts
import { Entity } from '../../shared-kernel/domain/Entity';

export enum AdmissionStatus {
  INQUIRY = 'INQUIRY',
  VERIFIED = 'VERIFIED',
  FEE_PAID = 'FEE_PAID',
  ENROLLED = 'ENROLLED',
  REJECTED = 'REJECTED'
}

interface AdmissionInquiryProps {
  tenantId: string;
  schoolId: string;
  branchId: string;
  studentName: string;
  dateOfBirth: Date;
  status: AdmissionStatus;
  createdAt: Date;
}

export class AdmissionInquiry extends Entity<AdmissionInquiryProps> {
  constructor(props: AdmissionInquiryProps, id?: string) {
    super(props, id);
  }

  public static create(props: Omit<AdmissionInquiryProps, 'status' | 'createdAt'>): AdmissionInquiry {
    return new AdmissionInquiry({
      ...props,
      status: AdmissionStatus.INQUIRY,
      createdAt: new Date(),
    });
  }
  public transitionTo(nextStatus: AdmissionStatus): void {
    const allowedTransitions: Record<AdmissionStatus, readonly AdmissionStatus[]> = {
      [AdmissionStatus.INQUIRY]: [AdmissionStatus.VERIFIED, AdmissionStatus.REJECTED],
      [AdmissionStatus.VERIFIED]: [AdmissionStatus.FEE_PAID, AdmissionStatus.REJECTED],
      [AdmissionStatus.FEE_PAID]: [AdmissionStatus.ENROLLED, AdmissionStatus.REJECTED],
      [AdmissionStatus.ENROLLED]: [],
      [AdmissionStatus.REJECTED]: []
    };
    if (!allowedTransitions[this.props.status].includes(nextStatus)) {
      throw new Error('Invalid admission transition from ' + this.props.status + ' to ' + nextStatus + '.');
    }
    this.props.status = nextStatus;
  }
}
