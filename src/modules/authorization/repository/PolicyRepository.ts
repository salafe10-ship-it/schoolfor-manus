// src/modules/authorization/repository/PolicyRepository.ts
import { Policy } from '../domain/Policy';
import { Repository } from '../../shared-kernel/domain/Repository';

export interface PolicyRepository extends Repository<Policy> {
  findByTenant(tenantId: string): Promise<Policy[]>;
  findByResourceAction(tenantId: string, resource: string, action: string): Promise<Policy[]>;
}
