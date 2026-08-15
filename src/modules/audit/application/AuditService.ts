import { AuditRepository } from '../../../database/repositories/AuditRepository';
import { UnitOfWork } from '../../../database/UnitOfWork';

export interface AuditLogEntry<T = Record<string, unknown>> {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  ipAddress: string;
  device: string;
  details: string;
  valuesBefore?: T;
  valuesAfter?: T;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AuditService {
  public static async logAction(tenantId: string, entry: AuditLogEntry): Promise<void> {
    const logId = `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Use the parameterized version of the repository method
    AuditRepository.enlistCreateAuditLogParameterized(
        logId,
        tenantId,
        entry
    );
  }
}
