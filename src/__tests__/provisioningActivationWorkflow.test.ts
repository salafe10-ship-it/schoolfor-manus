import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');
const bootstrap = readFileSync(resolve(root, 'scripts/provisioning-bootstrap.ts'), 'utf8');
const admin = readFileSync(resolve(root, 'scripts/provisioning-admin.ts'), 'utf8');
const packageJson = readFileSync(resolve(root, 'package.json'), 'utf8');
const server = readFileSync(resolve(root, 'server.ts'), 'utf8');

describe('Provisioning P1 activation workflow', () => {
  it('is explicit, deployment-controlled, and not an HTTP/frontend entry point', () => {
    expect(packageJson).toContain('provisioning:bootstrap');
    expect(packageJson).toContain('provisioning:admin');
    expect(bootstrap).toContain('BOOTSTRAP_RBAC_CATALOG');
    expect(admin).toContain('PROVISION_ADMIN_IDENTITY');
    expect(bootstrap).not.toContain('express');
    expect(admin).not.toContain('express');
    expect(admin).not.toContain('signInWithPassword');
  });

  it('passes only deployment-controlled context to the service and audits outcomes', () => {
    for (const source of [bootstrap, admin]) {
      expect(source).toContain('ErpProvisioningService');
      expect(source).toContain('correlationId');
      expect(source).toContain('outcome: \'rollback\'');
      expect(source).not.toContain('service_role');
      expect(source).not.toContain('permissions:');
    }
    expect(admin).toContain('PROVISIONING_AUTH_USER_ID');
    expect(admin).toContain('PROVISIONING_TENANT_ID');
    expect(admin).toContain('PROVISIONING_SCHOOL_ID');
    expect(admin).toContain('PROVISIONING_BRANCH_ID');
  });

  it('protects the single runtime endpoint and fails closed for unresolved targets', () => {
    expect(server).toContain("app.post('/api/admin/provisioning'");
    expect(server).toContain('authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)');
    expect(server).toContain("operation !== 'bootstrap_catalog' && operation !== 'provision_identity'");
    expect(server).toContain('لا يوجد مسار موثوق لتحديد مستخدم Auth المستهدف حاليًا');
    expect(server).not.toContain('PROVISIONING_AUTH_USER_ID');
  });
});
