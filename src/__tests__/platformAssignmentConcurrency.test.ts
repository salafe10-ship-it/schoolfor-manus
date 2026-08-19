import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/202608191205_platform_rbac_canonical.sql'), 'utf8');
const service = readFileSync(resolve(process.cwd(), 'src/modules/identity/application/ErpProvisioningService.ts'), 'utf8');
const platformService = service.split('public static async provisionPlatformIdentity')[1].split('public static async bootstrapCatalog')[0];

describe('platform assignment concurrency contract', () => {
  it('enforces one live assignment while preserving historical rows', () => {
    expect(migration).toContain('ON public.platform_user_roles (platform_user_id, role_id)');
    expect(migration).toContain("WHERE status = 'active' AND deleted_at IS NULL");
    expect(platformService).toContain('ON CONFLICT (platform_user_id, role_id)');
  });

  it('keeps the strategy platform-only and transaction-bound', () => {
    expect(platformService).toContain('UnitOfWork.runPlatformInTransaction');
    expect(platformService).not.toContain('tenantId');
    expect(platformService).not.toContain('schoolId');
    expect(platformService).not.toContain('branchId');
  });
});
