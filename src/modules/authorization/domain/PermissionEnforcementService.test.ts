import { describe, it, expect, vi } from 'vitest';
import { PermissionEnforcementService } from './PermissionEnforcementService';
import { Resource, Action } from './Permission';
import { PolicyRepository } from '../repository/PolicyRepository';
import { TenantContext } from '../../shared-kernel/types/TenantContext';

describe('PermissionEnforcementService', () => {
  const mockPolicyRepository = {
    findByResourceAction: vi.fn(),
  } as unknown as PolicyRepository;

  const service = new PermissionEnforcementService(mockPolicyRepository);

  it('should throw SecurityException if tenantId is missing', async () => {
    const context = { userId: '1', roles: [], schoolId: 's1' } as TenantContext;
    // @ts-ignore
    await expect(service.checkPermission(context, Resource.STUDENT, Action.VIEW))
      .rejects.toThrow('Tenant context is missing.');
  });
});
