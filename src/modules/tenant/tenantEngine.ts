import { TenantContext } from './types';

export class TenantEngine {
  static validateContext(context: TenantContext): boolean {
    // Ensure all required fields are present and not empty
    return !!(
      context.tenantId && 
      context.schoolId && 
      context.branchId && 
      context.academicYearId
    );
  }

  static applyIsolationFilter<T extends { tenantId: string }>(data: T[], context: TenantContext): T[] {
    return data.filter(item => item.tenantId === context.tenantId);
  }
}
