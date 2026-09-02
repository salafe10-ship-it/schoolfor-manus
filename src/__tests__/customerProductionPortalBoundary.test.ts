import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { canAccessSection } from '../authorization/ClientAuthorization';
import {
  canAccessCustomerProductionSection,
  isCustomerProductionPortal,
} from '../security/CustomerProductionPortalPolicy';

describe('customer-production portal boundary', () => {
  const customerIdentity = {
    id: 'school-user',
    role: 'SchoolAdmin',
    permissions: ['*'],
    school: { portalProfile: 'customer_production' },
  };

  it('recognizes only the server-projected profile and never a browser role label', () => {
    expect(isCustomerProductionPortal(customerIdentity)).toBe(true);
    expect(isCustomerProductionPortal({ ...customerIdentity, school: { portalProfile: 'standard' } })).toBe(false);
    expect(isCustomerProductionPortal({ ...customerIdentity, platformPermissions: ['Platform.Admin'] })).toBe(false);
  });

  it('removes every central, diagnostic, certification, and demonstration surface from a customer school', () => {
    for (const section of ['super_stats', 'system_health', 'db_schema', 'core_certification', 'fixed_assets_cert', 'ai_assistant', 'audit_logs', 'permissions_admin', 'settings']) {
      expect(canAccessCustomerProductionSection(section)).toBe(false);
    }
    expect(canAccessCustomerProductionSection('students')).toBe(true);
    expect(canAccessCustomerProductionSection('school_transport')).toBe(true);
  });

  it('requires the explicit platform permission for central navigation even when a tenant role says SuperAdmin', () => {
    expect(canAccessSection({ role: 'SuperAdmin', permissions: ['*'] }, 'super_stats', { currentPortal: 'admin' })).toBe(false);
    expect(canAccessSection({ role: 'SuperAdmin', platformPermissions: ['Platform.Admin'] }, 'super_stats', { currentPortal: 'admin' })).toBe(true);
    expect(canAccessSection({ ...customerIdentity, platformPermissions: ['Platform.Admin'] }, 'super_stats', { currentPortal: 'school' })).toBe(false);
  });

  it('provisions the profile centrally and returns it only through the trusted school projection', () => {
    const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
    const identity = readFileSync(resolve(process.cwd(), 'src/middleware/trustedSchoolIdentity.ts'), 'utf8');
    expect(server).toContain("portal_profile: 'customer_production'");
    expect(server).toContain("app.post('/api/admin/central/schools', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)");
    expect(identity).toContain(".select('id, school_code, legal_name, display_name, status, central_metadata')");
    expect(identity).toContain("portalProfile: normalizePortalProfile(record.central_metadata?.portal_profile)");
  });
});
