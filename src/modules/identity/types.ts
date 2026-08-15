/**
 * Identity & Access Management Domain
 */

export interface EnterpriseIdentity {
  id: string;
  email: string;
  tenantId: string; // School/Branch isolation
  roles: UserRole[];
  policies: AccessPolicy[];
  status: 'active' | 'suspended' | 'archived';
}

export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';

export interface AuthorizationContext {
  tenantId: string;
  schoolId: string;
  branchId: string;
  academicYearId: string;
  departmentId?: string;
  isOwner: boolean;
  workflowState?: string;
}

export interface AccessPolicy {
  id: string;
  resourceType: string;
  action: 'read' | 'write' | 'delete' | 'approve';
  // Now supports condition for deep evaluation
  condition?: (context: AuthorizationContext) => boolean;
}

export interface Session {
  id: string;
  identityId: string;
  deviceId: string;
  expiresAt: string;
  lastActivity: string;
  ipAddress: string;
  location?: string;
  context: {
    academicYearId: string;
    branchId: string;
  };
}
