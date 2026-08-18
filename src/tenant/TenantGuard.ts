import { requireTenantContext } from './TenantContext';
import { TenantIsolationError } from './TenantEngine';
import type { TenantContext } from './TenantContext';

export function assertTenantContext(context?: TenantContext): TenantContext {
  const resolved = context || requireTenantContext();
  if (!resolved.tenantId || !resolved.schoolId || !resolved.branchId || !resolved.academicYear) {
    throw new TenantIsolationError('MISSING_TENANT', 'لا يسمح بتنفيذ العملية بدون سياق مستأجر كامل.');
  }
  // A tenant may own multiple schools. Membership is validated upstream by
  // TenantEngine against trusted database scope; equality is not required.
  return resolved;
}

export function assertRepositoryScope(expected: { schoolId?: string; branchId?: string; academicYear?: string } = {}): TenantContext {
  const context = assertTenantContext();
  if (expected.schoolId && expected.schoolId !== context.schoolId) throw new TenantIsolationError('CROSS_SCHOOL_ACCESS', 'الوصول إلى مدرسة أخرى مرفوض.');
  if (expected.branchId && expected.branchId !== context.branchId) throw new TenantIsolationError('CROSS_BRANCH_ACCESS', 'الوصول إلى فرع آخر مرفوض.');
  if (expected.academicYear && expected.academicYear !== context.academicYear) throw new TenantIsolationError('CROSS_ACADEMIC_YEAR_ACCESS', 'الوصول إلى سنة دراسية أخرى مرفوض.');
  return context;
}
