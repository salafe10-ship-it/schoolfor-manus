// src/modules/student-admission/repository/AdmissionInquiryRepository.ts
import { AdmissionInquiry } from '../domain/AdmissionInquiry';
import { Repository } from '../../shared-kernel/domain/Repository';

export interface AdmissionInquiryScope {
  tenantId: string;
  schoolId: string;
  branchId: string;
}

export interface AdmissionInquiryRepository extends Repository<AdmissionInquiry> {
  findByScope(scope: AdmissionInquiryScope): Promise<AdmissionInquiry[]>;
  findByIdInScope(id: string, scope: AdmissionInquiryScope): Promise<AdmissionInquiry | null>;
}
