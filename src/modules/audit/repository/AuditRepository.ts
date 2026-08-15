// src/modules/audit/repository/AuditRepository.ts
import { AuditLog } from '../domain/AuditLog';
import { Repository } from '../../shared-kernel/domain/Repository';

export interface AuditRepository extends Repository<AuditLog> {
  findByResource(resource: string, resourceId: string): Promise<AuditLog[]>;
  findByTenant(tenantId: string): Promise<AuditLog[]>;
}
