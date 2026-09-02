import { describe, expect, it } from 'vitest';
import { TenantAwareCache } from '../tenant/TenantAwareCache';
import { TenantContextResolver } from '../tenant/TenantEngine';

type CapacityScope = {
  tenantId: string;
  schoolId: string;
  branchId: string;
  academicYear: string;
};

const scopes: CapacityScope[] = Array.from({ length: 500 }, (_, index) => {
  const suffix = String(index + 1).padStart(4, '0');
  return {
    tenantId: `tenant-${suffix}`,
    schoolId: `school-${suffix}`,
    branchId: `branch-${suffix}`,
    academicYear: `year-${suffix}`,
  };
});

const scopeBySchool = new Map(scopes.map(scope => [scope.schoolId, scope]));

function identityFor(scope: CapacityScope) {
  return {
    id: `user-${scope.schoolId}`,
    email: `${scope.schoolId}@example.invalid`,
    name: `Capacity ${scope.schoolId}`,
    role: 'SchoolAdmin' as const,
    tenantId: scope.tenantId,
    schoolId: scope.schoolId,
    branchId: scope.branchId,
    academicYear: scope.academicYear,
  };
}

describe('500-school tenant capacity contract', () => {
  it('resolves 500 independent tenant contexts concurrently without scope collisions', async () => {
    const resolver = new TenantContextResolver({
      schoolExists: async (tenantId, schoolId) => scopeBySchool.get(schoolId)?.tenantId === tenantId,
      listBranches: async (_tenantId, schoolId) => {
        const scope = scopeBySchool.get(schoolId);
        return scope ? [scope.branchId] : [];
      },
      listAcademicYears: async (_tenantId, schoolId) => {
        const scope = scopeBySchool.get(schoolId);
        return scope ? [{ id: scope.academicYear, isActive: true, tenantId: scope.tenantId, schoolId: scope.schoolId, branchId: scope.branchId }] : [];
      },
    });

    const resolved = await Promise.all(scopes.map(scope => resolver.resolve(identityFor(scope))));

    expect(resolved).toHaveLength(500);
    expect(new Set(resolved.map(context => context.tenantId)).size).toBe(500);
    expect(new Set(resolved.map(context => context.schoolId)).size).toBe(500);
    expect(resolved).toEqual(scopes.map(scope => ({
      ...scope,
      userId: `user-${scope.schoolId}`,
      role: 'SchoolAdmin',
    })));
  });

  it('rejects a cross-school identity even when both schools are valid', async () => {
    const resolver = new TenantContextResolver({
      schoolExists: async (tenantId, schoolId) => scopeBySchool.get(schoolId)?.tenantId === tenantId,
      listBranches: async (_tenantId, schoolId) => [scopeBySchool.get(schoolId)?.branchId || ''],
      listAcademicYears: async (_tenantId, schoolId) => {
        const scope = scopeBySchool.get(schoolId);
        return scope ? [{ id: scope.academicYear, isActive: true, tenantId: scope.tenantId, schoolId: scope.schoolId, branchId: scope.branchId }] : [];
      },
    });
    const source = scopes[0];
    const foreign = scopes[1];

    await expect(resolver.resolve({
      ...identityFor(source),
      schoolId: foreign.schoolId,
      branchId: foreign.branchId,
      academicYear: foreign.academicYear,
    })).rejects.toMatchObject({ reason: 'INVALID_TENANT' });
  });

  it('keeps 500 tenant cache keys distinct and clears only the selected scope', () => {
    const cache = new TenantAwareCache<string>(60_000, 1_000);
    const contexts = scopes.map(scope => ({ ...scope, userId: `user-${scope.schoolId}`, role: 'SchoolAdmin' }));

    contexts.forEach(context => cache.set(context, 'dashboard', `${context.schoolId}-data`));

    expect(contexts.every(context => cache.get(context, 'dashboard') === `${context.schoolId}-data`)).toBe(true);
    cache.clearTenant(contexts[0]);
    expect(cache.get(contexts[0], 'dashboard')).toBeUndefined();
    expect(cache.get(contexts[1], 'dashboard')).toBe('school-0002-data');
  });
});
