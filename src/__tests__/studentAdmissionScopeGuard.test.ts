import { describe, expect, it, vi } from 'vitest';
import { SubmitAdmissionInquiryServiceImplementation } from '../modules/student-admission/application/SubmitAdmissionInquiryServiceImplementation';
import { SecurityException } from '../modules/authorization/domain/PermissionEnforcementService';
import type { AdmissionInquiryRepository } from '../modules/student-admission/repository/AdmissionInquiryRepository';
import type { AuditRepository } from '../modules/audit/repository/AuditRepository';
import type { LoggerService } from '../modules/logging/domain/LoggerService';
import type { PermissionEnforcementService } from '../modules/authorization/domain/PermissionEnforcementService';
import type { TenantContext } from '../modules/shared-kernel/types/TenantContext';

const makeHarness = () => {
  const repository = { save: vi.fn().mockResolvedValue(undefined) } as unknown as AdmissionInquiryRepository;
  const auditRepository = { save: vi.fn().mockResolvedValue(undefined) } as unknown as AuditRepository;
  const logger = { info: vi.fn() } as unknown as LoggerService;
  const permissionService = { checkPermission: vi.fn().mockResolvedValue(undefined) } as unknown as PermissionEnforcementService;
  const service = new SubmitAdmissionInquiryServiceImplementation(repository, auditRepository, logger, permissionService);
  return { service, repository, auditRepository };
};

const context: TenantContext & { branchId: string } = { tenantId: 'tenant-a', schoolId: 'school-a', branchId: 'branch-a', userId: 'user-a', roles: ['schooladmin'] };
const command = { tenantId: 'tenant-a', schoolId: 'school-a', branchId: 'branch-a', studentName: 'Student A', dateOfBirth: new Date('2015-01-01') };

describe('Student admission trusted scope guard', () => {
  it('denies a command whose tenant or school differs from trusted context', async () => {
    const { service, repository, auditRepository } = makeHarness();
    await expect(service.execute({ ...command, schoolId: 'school-b' }, context)).rejects.toBeInstanceOf(SecurityException);
    expect(repository.save).not.toHaveBeenCalled();
    expect(auditRepository.save).not.toHaveBeenCalled();
  });

  it('persists and audits a command matching trusted context', async () => {
    const { service, repository, auditRepository } = makeHarness();
    const result = await service.execute(command, context);
    expect(result.props.tenantId).toBe(context.tenantId);
    expect(result.props.schoolId).toBe(context.schoolId);
    expect(result.props.branchId).toBe(context.branchId);
    expect(repository.save).toHaveBeenCalledOnce();
    expect(auditRepository.save).toHaveBeenCalledOnce();
  });

  it('denies when trusted context has no branch', async () => {
    const { service, repository, auditRepository } = makeHarness();
    const contextWithoutBranch = { ...context, branchId: undefined } as TenantContext;
    await expect(service.execute(command, contextWithoutBranch)).rejects.toBeInstanceOf(SecurityException);
    expect(repository.save).not.toHaveBeenCalled();
    expect(auditRepository.save).not.toHaveBeenCalled();
  });
});
