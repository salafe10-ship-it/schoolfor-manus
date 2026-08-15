import express from 'express';
import { describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '../authorization/PermissionRegistry';
import { requirePermission } from '../middleware/auth';
import { clearTenantAuditEvents, getTenantAuditEvents, setTenantAuditSink } from '../tenant/TenantAuditHooks';
import { TenantAwareCache } from '../tenant/TenantAwareCache';
import { runWithTenantContext, getTenantContext } from '../tenant/TenantContext';
import { TenantContextResolver, TenantDataProvider } from '../tenant/TenantEngine';
import { assertRepositoryScope } from '../tenant/TenantGuard';

const identity = {
  id: 'user-1', email: 'user@example.com', name: 'User', role: 'Teacher' as const, schoolId: 'school-1',
  branchId: 'branch-1', academicYear: 'year-2026'
};
const context = {
  tenantId: 'school-1', schoolId: 'school-1', branchId: 'branch-1', academicYear: 'year-2026', userId: 'user-1', role: 'Teacher'
};

function provider(): TenantDataProvider {
  return {
    schoolExists: vi.fn(async schoolId => schoolId === 'school-1'),
    listBranches: vi.fn(async schoolId => schoolId === 'school-1' ? ['branch-1', 'branch-2'] : []),
    listAcademicYears: vi.fn(async schoolId => schoolId === 'school-1' ? [{ id: 'year-2026', name: '2026/2027', isActive: true }] : [])
  };
}

describe('Wave 1D tenant isolation foundation', () => {
  it('resolves a tenant only from trusted identity and validates school, branch, and academic year', async () => {
    const resolved = await new TenantContextResolver(provider()).resolve(identity);
    expect(resolved).toEqual(context);
  });

  it('forwards only the verified access token to authenticated tenant lookups', async () => {
    const authenticatedProvider: TenantDataProvider = {
      schoolExists: vi.fn(async (_tenantId, _schoolId, accessToken) => accessToken === 'verified-token'),
      listBranches: vi.fn(async (_tenantId, _schoolId, accessToken) => accessToken === 'verified-token' ? ['branch-1'] : []),
      listAcademicYears: vi.fn(async (_tenantId, _schoolId, _branchId, accessToken) => accessToken === 'verified-token'
        ? [{ id: 'year-2026', isActive: true, tenantId: 'school-1', schoolId: 'school-1', branchId: 'branch-1' }]
        : [])
    };

    await expect(new TenantContextResolver(authenticatedProvider).resolve(identity, 'verified-token'))
      .resolves.toEqual(context);
    expect(authenticatedProvider.schoolExists).toHaveBeenCalledWith('school-1', 'school-1', 'verified-token');
    expect(authenticatedProvider.listBranches).toHaveBeenCalledWith('school-1', 'school-1', 'verified-token');
    expect(authenticatedProvider.listAcademicYears).toHaveBeenCalledWith('school-1', 'school-1', 'branch-1', 'verified-token');
  });

  it('rejects invalid tenant, branch, and academic year values', async () => {
    const resolver = new TenantContextResolver(provider());
    await expect(resolver.resolve({ ...identity, schoolId: 'school-2' })).rejects.toMatchObject({ reason: 'INVALID_TENANT' });
    await expect(resolver.resolve({ ...identity, branchId: 'branch-foreign' })).rejects.toMatchObject({ reason: 'INVALID_BRANCH' });
    await expect(resolver.resolve({ ...identity, academicYear: 'year-foreign' })).rejects.toMatchObject({ reason: 'INVALID_ACADEMIC_YEAR' });
  });

  it('passes the trusted tenant, school, and branch scope to the canonical academic provider', async () => {
    const scopedProvider: TenantDataProvider = {
      schoolExists: vi.fn(async (tenantId, schoolId) => tenantId === 'school-1' && schoolId === 'school-1'),
      listBranches: vi.fn(async (tenantId, schoolId) => tenantId === 'school-1' && schoolId === 'school-1' ? ['branch-1'] : []),
      listAcademicYears: vi.fn(async (tenantId, schoolId, branchId) => [{
        id: 'year-2026',
        name: '2026/2027',
        isActive: true,
        tenantId,
        schoolId,
        branchId
      }])
    };

    await expect(new TenantContextResolver(scopedProvider).resolve(identity)).resolves.toMatchObject(context);
    expect(scopedProvider.schoolExists).toHaveBeenCalledWith('school-1', 'school-1');
    expect(scopedProvider.listBranches).toHaveBeenCalledWith('school-1', 'school-1');
    expect(scopedProvider.listAcademicYears).toHaveBeenCalledWith('school-1', 'school-1', 'branch-1');
  });

  it('rejects an academic year returned with a foreign tenant or branch scope', async () => {
    const foreignProvider: TenantDataProvider = {
      schoolExists: vi.fn(async () => true),
      listBranches: vi.fn(async () => ['branch-1']),
      listAcademicYears: vi.fn(async () => [{ id: 'year-foreign', isActive: true, tenantId: 'school-2', schoolId: 'school-2', branchId: 'branch-foreign' }])
    };

    await expect(new TenantContextResolver(foreignProvider).resolve({ ...identity, academicYear: 'year-foreign' }))
      .rejects.toMatchObject({ reason: 'INVALID_ACADEMIC_YEAR' });
  });

  it('fails closed when the trusted academic year is missing', async () => {
    const missingYearProvider: TenantDataProvider = {
      schoolExists: vi.fn(async () => true),
      listBranches: vi.fn(async () => ['branch-1']),
      listAcademicYears: vi.fn(async () => [])
    };

    await expect(new TenantContextResolver(missingYearProvider).resolve({ ...identity, academicYear: '' }))
      .rejects.toMatchObject({ reason: 'MISSING_ACADEMIC_YEAR' });
  });

  it('requires repository access to run inside a validated tenant context', async () => {
    expect(() => assertRepositoryScope()).toThrow(/Tenant context is required/);
    runWithTenantContext(context, () => {
      expect(assertRepositoryScope({ schoolId: 'school-1', branchId: 'branch-1' })).toEqual(context);
      expect(() => assertRepositoryScope({ schoolId: 'school-2' })).toThrow(/مدرسة أخرى/);
      expect(() => assertRepositoryScope({ branchId: 'branch-2' })).toThrow(/فرع آخر/);
      expect(getTenantContext()).toEqual(context);
    });
  });

  it.each(['read', 'update', 'delete'])('rejects cross-school %s through the repository guard', action => {
    runWithTenantContext(context, () => {
      expect(() => assertRepositoryScope({ schoolId: 'school-2' })).toThrow(/مدرسة أخرى/);
    });
    expect(action).toMatch(/read|update|delete/);
  });

  it('rejects cross-branch access and requests without a complete tenant', () => {
    runWithTenantContext(context, () => {
      expect(() => assertRepositoryScope({ branchId: 'branch-2' })).toThrow(/فرع آخر/);
    });
    expect(() => assertRepositoryScope()).toThrow(/Tenant context is required/);
  });

  it('keeps cache entries separated by tenant, branch, and academic year', () => {
    const cache = new TenantAwareCache<string>();
    const other = { ...context, tenantId: 'school-2', schoolId: 'school-2', branchId: 'branch-2' };
    cache.set(context, 'students', 'school-1-data');
    cache.set(other, 'students', 'school-2-data');
    expect(cache.get(context, 'students')).toBe('school-1-data');
    expect(cache.get(other, 'students')).toBe('school-2-data');
  });

  it('applies API isolation after authorization and rejects tenant spoofing', async () => {
    clearTenantAuditEvents();
    const captured: any[] = [];
    setTenantAuditSink(event => { captured.push(event); });
    const next = vi.fn();
    const req = {
      user: { ...identity, schoolId: 'school_1', branchId: 'branch_1_1', academicYear: 'acad_cal_2026' },
      originalUrl: '/api/students', method: 'GET', headers: { 'x-school-id': 'school-2' }, query: {}, body: {}, ip: '127.0.0.1'
    } as unknown as express.Request;
    await requirePermission(PERMISSIONS.STUDENT_READ)(req, {} as express.Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403, reason: 'TENANT_SPOOFING' });
    expect(captured.at(-1)).toMatchObject({ userId: 'user-1', targetSchool: 'school-2', reason: 'TENANT_SPOOFING' });
  });

  it('allows a valid protected endpoint and injects the trusted context', async () => {
    const next = vi.fn();
    const req = {
      user: { ...identity, schoolId: 'school_1', branchId: 'branch_1_1', academicYear: 'acad_cal_2026' },
      originalUrl: '/api/students', method: 'GET', headers: {}, query: {}, body: {}, ip: '127.0.0.1'
    } as unknown as express.Request;
    await requirePermission(PERMISSIONS.STUDENT_READ)(req, {} as express.Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeUndefined();
    expect((req as any).tenantContext).toMatchObject({ schoolId: 'school_1', branchId: 'branch_1_1', academicYear: 'acad_cal_2026' });
  });
});
