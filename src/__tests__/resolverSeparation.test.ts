import { describe, expect, it, vi } from 'vitest';
import { RoleResolver } from '../authorization/RoleResolver';
import { PERMISSIONS } from '../authorization/PermissionRegistry';

describe('Platform/Tenant resolver separation', () => {
  it('resolves each permission domain only through its matching loader', async () => {
    const resolver = new RoleResolver();
    const tenantLoader = vi.fn(async () => [{ roleKey: 'schooladmin', permissionKey: PERMISSIONS.STUDENT_READ }]);
    const platformLoader = vi.fn(async () => [{ roleKey: 'platformadmin', permissionKey: PERMISSIONS.PLATFORM_ADMIN }]);
    resolver.configureDatabaseLoader(tenantLoader);
    resolver.configurePlatformDatabaseLoader(platformLoader);

    const tenant = await resolver.resolveTenantPermissions({ id: 'u1', schoolId: 's1', tenantId: 't1' });
    const platform = await resolver.resolvePlatformPermissions({ id: 'u1' });

    expect(tenant.has(PERMISSIONS.STUDENT_READ)).toBe(true);
    expect(tenant.has(PERMISSIONS.PLATFORM_ADMIN)).toBe(false);
    expect(platform.has(PERMISSIONS.PLATFORM_ADMIN)).toBe(true);
    expect(platform.has(PERMISSIONS.STUDENT_READ)).toBe(false);
    expect(tenantLoader).toHaveBeenCalledTimes(1);
    expect(platformLoader).toHaveBeenCalledTimes(1);
  });

  it('fails closed when the matching assignment is absent', async () => {
    const resolver = new RoleResolver();
    resolver.configureDatabaseLoader(async () => []);
    resolver.configurePlatformDatabaseLoader(async () => []);

    await expect(resolver.resolveTenantPermissions({ id: 'u1', schoolId: 's1' })).rejects.toThrow();
    await expect(resolver.resolvePlatformPermissions({ id: 'u1' })).rejects.toThrow();
  });
});
