// src/modules/student-admission/repository/AdmissionInquiryRepository.ts
import { AdmissionInquiry } from '../domain/AdmissionInquiry';
import { Repository } from '../../shared-kernel/domain/Repository';

export interface AdmissionInquiryRepository extends Repository<AdmissionInquiry> {
  findByTenant(tenantId: string): Promise<AdmissionInquiry[]>;
  findBySchool(schoolId: string): Promise<AdmissionInquiry[]>;
}
