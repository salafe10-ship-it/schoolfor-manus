// src/modules/student-admission/repository/AdmissionInquiryRepository.ts
import { AdmissionInquiry } from '../domain/AdmissionInquiry';
import { Repository } from '../../shared-kernel/domain/Repository';

export interface AdmissionInquiryScope {
  tenantId: string;
  schoolId: string;
  branchId: string;
  search?: string;
}

export interface AdmissionInquiryPage {
  items: AdmissionInquiry[];
  totalCount: number;
}

export interface AdmissionInquiryRepository extends Repository<AdmissionInquiry> {
  findByScope(scope: AdmissionInquiryScope): Promise<AdmissionInquiry[]>;
  findPageByScope(scope: AdmissionInquiryScope, page: number, limit: number, status?: string): Promise<AdmissionInquiryPage>;
  findByIdInScope(id: string, scope: AdmissionInquiryScope): Promise<AdmissionInquiry | null>;
}
