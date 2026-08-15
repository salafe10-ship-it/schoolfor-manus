import { UserRole, SecurityLog } from './types';

export class ExaminationSecurityEngine {
  private static permissions: Record<UserRole, string[]> = {
    admin: ['create', 'read', 'update', 'delete', 'approve'],
    teacher: ['create', 'read'],
    moderator: ['read', 'approve'],
    auditor: ['read']
  };

  static authorize(role: UserRole, action: string): boolean {
    return this.permissions[role].includes(action);
  }

  static logSecurityEvent(
    userId: string,
    role: UserRole,
    action: string,
    targetId: string,
    targetType: 'mark' | 'result' | 'exam',
    authorized: boolean,
    tenantContext: { tenantId: string, schoolId: string, branchId: string, academicYearId: string }
  ): SecurityLog {
    const log: SecurityLog = {
      id: `sec_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId,
      role,
      action,
      targetId,
      targetType,
      authorized,
      tamperDetected: !authorized,
      ...tenantContext
    };
    console.log('[SecurityAudit]', log);
    return log;
  }
}
