import { AuditEngine } from '../audit/auditEngine';
import { AuditEntry } from '../audit/types';

export class ExaminationAuditor {
  static log(
    action: string, 
    affectedRecordId: string, 
    userId: string, 
    context: {
        tenantId: string;
        schoolId: string;
        branchId: string;
        academicYearId: string;
        sessionId: string;
        ipAddress: string;
        device: string;
    },
    previousState?: any,
    newState?: any,
    reason: string = 'none'
  ) {
    return AuditEngine.log({
      correlationId: `corr-${Date.now()}`,
      ...context,
      module: 'examination',
      operation: action,
      userId,
      reason,
      source: 'examination_module',
      previousState,
      newState
    });
  }
}
