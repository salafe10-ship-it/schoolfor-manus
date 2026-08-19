import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/modules/identity/application/ErpProvisioningService.ts'), 'utf8');

describe('Platform provisioning contract', () => {
  it('uses only trusted auth identity and platform catalog', () => {
    const platformMethod = source.split('public static async provisionPlatformIdentity')[1].split('public static async bootstrapCatalog')[0];
    expect(platformMethod).toContain('UnitOfWork.runPlatformInTransaction');
    expect(platformMethod).toContain("role_key = $1");
    expect(platformMethod).toContain('platformadmin');
    expect(platformMethod).toContain('PERMISSIONS.PLATFORM_ADMIN');
    expect(platformMethod).toContain('platform_users');
    expect(platformMethod).toContain('platform_user_roles');
    expect(platformMethod).not.toMatch(/tenantId|schoolId|branchId/);
    expect(platformMethod).not.toMatch(/role:|permission:|permissions:/);
    expect(platformMethod).not.toMatch(/\*['"]|['"]\*/);
  });

  it('is atomic and idempotent at the existing-row boundaries', () => {
    expect(source).toContain('ON CONFLICT (auth_user_id) DO NOTHING');
    expect(source).toContain('ORDER BY starts_at DESC LIMIT 1');
    expect(source).toContain('runPlatformInTransaction');
    expect(source).toContain("status = 'active'");
  });

  it('uses a conflict target matching the active-assignment partial index', () => {
    expect(source).toContain('ON CONFLICT (platform_user_id, role_id)');
    expect(source).toContain("WHERE status = 'active' AND deleted_at IS NULL");
    expect(source).toContain('DO UPDATE SET');
  });
});
