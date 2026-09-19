import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('tenant authentication control-plane isolation', () => {
  it('does not resolve platform RBAC for school-bound identities', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/middleware/trustedAuthentication.ts'), 'utf8');
    expect(source).toContain('if (tenantIdentity.schoolId) return { ...tenantIdentity, platformPermissions: [] };');
  });
});
