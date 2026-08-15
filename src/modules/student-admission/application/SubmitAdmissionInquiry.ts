// src/modules/student-admission/application/SubmitAdmissionInquiry.ts
import { AdmissionInquiry } from '../domain/AdmissionInquiry';
import { TenantContext } from '../../shared-kernel/types/TenantContext';

export interface SubmitAdmissionInquiryCommand {
  tenantId: string;
  schoolId: string;
  studentName: string;
  dateOfBirth: Date;
}

export interface SubmitAdmissionInquiryService {
  execute(command: SubmitAdmissionInquiryCommand, context: TenantContext): Promise<AdmissionInquiry>;
}
