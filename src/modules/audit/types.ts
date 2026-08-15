/**
 * Enterprise Audit Framework
 */

export interface AuditEntry<T = Record<string, unknown>> {
  correlationId: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  academicYearId: string;
  module: string;
  operation: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  previousState?: T;
  newState?: T;
  reason: string;
  source: string;
  ipAddress: string;
  device: string;
}
