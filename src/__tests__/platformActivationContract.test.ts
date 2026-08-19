import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = readFileSync(resolve(process.cwd(), 'scripts/provisioning-platform-admin.ts'), 'utf8');
const resolver = readFileSync(resolve(process.cwd(), 'src/modules/identity/application/TrustedAuthTargetResolver.ts'), 'utf8');

describe('first platform admin activation contract', () => {
  it('requires explicit deployment confirmation and verifies Auth identity server-side', () => {
    expect(script).toContain('PROVISION_PLATFORM_ADMIN');
    expect(script).toContain('TARGET_AUTH_USER_ID');
    expect(script).toContain('verifyTargetAuthUser');
    expect(script).toContain('provisionPlatformIdentity');
    expect(script).not.toMatch(/tenantId|schoolId|branchId|permissions|role/);
    expect(script).not.toMatch(/UAT-B|email|displayName|superadmin|\*/i);
  });

  it('keeps Auth Admin credentials deployment-controlled and out of source', () => {
    expect(resolver).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(resolver).toContain('auth.admin.getUserById');
    expect(resolver).not.toContain('service_role_key =');
    expect(resolver).not.toMatch(/eyJ[A-Za-z0-9_-]+\./);
  });
});
