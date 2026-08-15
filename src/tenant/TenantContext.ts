import { AsyncLocalStorage } from 'node:async_hooks';

export type TenantContext = {
  tenantId: string;
  schoolId: string;
  branchId: string;
  academicYear: string;
  userId: string;
  role: string;
};

const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

export function runWithTenantContext<T>(context: TenantContext, operation: () => T): T {
  return tenantContextStorage.run(context, operation);
}

export function getTenantContext(): TenantContext | undefined {
  return tenantContextStorage.getStore();
}

export function requireTenantContext(): TenantContext {
  const context = getTenantContext();
  if (!context) throw new Error('Tenant context is required before repository access');
  return context;
}

export function clearTenantContext(): void {
  // AsyncLocalStorage scopes are immutable from outside their request chain.
  // This function exists as an explicit lifecycle hook for callers and tests.
}
