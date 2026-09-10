import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const moduleSource = readFileSync('src/components/school/SchoolUsersPermissionsModule.tsx', 'utf8');
const serverSource = readFileSync('server.ts', 'utf8');

describe('permissions canonical persistence contract', () => {
  it('uses authenticated APIs and contains no local identity persistence', () => {
    expect(moduleSource).toContain("authenticatedRequest('/api/school/users'");
    expect(moduleSource).toContain("authenticatedRequest('/api/school/identity-roles'");
    expect(moduleSource).not.toContain('localStorage');
    expect(moduleSource).not.toContain('PERMISSIONS_TEST_FIXTURE');
  });

  it('reads the canonical profile email without a missing auth-table alias', () => {
    expect(serverSource).toContain('u.email AS email');
    expect(serverSource).not.toContain("CASE WHEN au.email LIKE '%@no-email.edupro.invalid'");
  });

  it('requires both capabilities for creation and the specific capability per mutation', () => {
    expect(serverSource).toContain('requirePermissionOnly(PERMISSIONS.IDENTITY_USERS_WRITE), requirePermissionOnly(PERMISSIONS.IDENTITY_USERS_ASSIGN)');
    expect(serverSource).toContain("new Set(['assign_role', 'set_permissions'])");
    expect(serverSource).toContain('? PERMISSIONS.IDENTITY_USERS_ASSIGN');
  });
});
