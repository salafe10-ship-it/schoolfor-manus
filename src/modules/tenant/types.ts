/**
 * Multi-Tenant Isolation Domain
 */

export interface TenantContext {
  tenantId: string;
  schoolId: string;
  branchId: string;
  academicYearId: string;
}

export interface TenantAware {
  tenantContext: TenantContext;
}
