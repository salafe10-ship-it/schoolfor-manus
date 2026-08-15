import type { TenantContext } from '../../tenant/TenantContext';
import { assertRepositoryScope } from '../../tenant/TenantGuard';

export function requireRepositoryTenantContext(expected: { schoolId?: string; branchId?: string; academicYear?: string } = {}): TenantContext {
  return assertRepositoryScope(expected);
}
export async function withRepositoryTenant<T>(operation: (context: TenantContext) => Promise<T>, expected: { schoolId?: string; branchId?: string; academicYear?: string } = {}): Promise<T> {
  return operation(requireRepositoryTenantContext(expected));
}
