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
}
