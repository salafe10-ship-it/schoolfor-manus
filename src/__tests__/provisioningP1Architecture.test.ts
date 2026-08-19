import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PERMISSIONS, permissionRegistry } from '../authorization/PermissionRegistry';
import { CANONICAL_ROLE_KEY, CANONICAL_ROLE_NAME } from '../modules/identity/application/ErpProvisioningService';

const source = readFileSync(resolve(__dirname, '../modules/identity/application/ErpProvisioningService.ts'), 'utf8');

describe('Provisioning P1 architecture', () => {
  it('uses the canonical role and permission catalog', () => {
    expect(CANONICAL_ROLE_KEY).toBe('schooladmin');
    expect(CANONICAL_ROLE_NAME).toBe('SchoolAdmin');
    expect(PERMISSIONS.STUDENT_READ).toBe('Student.View');
    expect(permissionRegistry.isKnown('Student.View')).toBe(true);
  });

  it('keeps bootstrap and identity provisioning transaction-scoped and idempotent', () => {
    expect(source).toContain('bootstrapCatalog');
    expect(source).toContain('provisionIdentity');
    expect(source).toContain('UnitOfWork.runInTransaction');
    expect(source).toContain('ON CONFLICT (tenant_id, role_key) DO NOTHING');
    expect(source).toContain('ON CONFLICT (permission_key) DO NOTHING');
    expect(source).toContain('ON CONFLICT (role_id, permission_id) DO NOTHING');
    expect(source).toContain('WHERE NOT EXISTS');
    expect(source).not.toContain("permissions: ['*']");
  });

  it('does not expose a frontend or login entry point', () => {
    expect(source).not.toContain('express');
    expect(source).not.toContain('signInWithPassword');
    expect(source).not.toContain('service_role');
  });
});
