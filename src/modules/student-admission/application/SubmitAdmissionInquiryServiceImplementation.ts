// src/modules/student-admission/application/SubmitAdmissionInquiryServiceImplementation.ts
import { AdmissionInquiry } from '../domain/AdmissionInquiry';
import { AdmissionInquiryRepository } from '../repository/AdmissionInquiryRepository';
import { SubmitAdmissionInquiryCommand, SubmitAdmissionInquiryService } from './SubmitAdmissionInquiry';
import { LoggerService } from '../../logging/domain/LoggerService';
import { AuditRepository } from '../../audit/repository/AuditRepository';
import { AuditLog } from '../../audit/domain/AuditLog';
import { PermissionEnforcementService, SecurityException } from '../../authorization/domain/PermissionEnforcementService';
import { TenantContext } from '../../shared-kernel/types/TenantContext';
import { Resource, Action } from '../../authorization/domain/Permission';

export class SubmitAdmissionInquiryServiceImplementation implements SubmitAdmissionInquiryService {
  constructor(
    private readonly repository: AdmissionInquiryRepository,
    private readonly auditRepository: AuditRepository,
    private readonly logger: LoggerService,
    private readonly permissionService: PermissionEnforcementService
  ) {}

  async execute(command: SubmitAdmissionInquiryCommand, context: TenantContext): Promise<AdmissionInquiry> {
    // 1. Authorization
    await this.permissionService.checkPermission(context, Resource.ADMISSION_INQUIRY, Action.CREATE);

    // 2. Validation (Business Rules)
    if (!command.studentName || command.studentName.trim().length === 0) {
      throw new Error('Student name is required.');
    }
    
    // Age check: Basic implementation for now
    const age = new Date().getFullYear() - command.dateOfBirth.getFullYear();
    if (age < 3 || age > 18) {
      throw new Error('Student age is not eligible for admission.');
    }

    this.logger.info('Submitting admission inquiry', { studentName: command.studentName }, command.tenantId);

    const inquiry = AdmissionInquiry.create({
      tenantId: command.tenantId,
      schoolId: command.schoolId,
      studentName: command.studentName,
      dateOfBirth: command.dateOfBirth
    });

    await this.repository.save(inquiry);

    // Audit the action
    const auditLog = AuditLog.create({
      tenantId: command.tenantId,
      schoolId: command.schoolId,
      userId: context.userId,
      action: 'SUBMIT_INQUIRY',
      resource: 'ADMISSION_INQUIRY',
      resourceId: inquiry.id,
      newData: { studentName: command.studentName }
    });
    
    await this.auditRepository.save(auditLog);

    return inquiry;
  }
}
