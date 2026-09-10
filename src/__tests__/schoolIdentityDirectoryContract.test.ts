import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('school-scoped identity directory contracts', () => {
  it('keeps school identity routes scoped to the trusted tenant and school', () => {
    const server = read('server.ts');
    expect(server).toContain("app.get('/api/school/users'");
    expect(server).toContain("app.post('/api/school/users'");
    expect(server).toContain("app.patch('/api/school/users/:userId'");
    expect(server).toContain("requirePermissionOnly(PERMISSIONS.IDENTITY_USERS_READ)");
    expect(server).toContain('requireAnyPermission([PERMISSIONS.IDENTITY_USERS_WRITE, PERMISSIONS.IDENTITY_USERS_ASSIGN])');
    expect(server).toContain('u.tenant_id = $1::uuid AND u.school_id = $2::uuid');
    expect(server).toContain('platformAdminAuth.auth.admin.createUser');
    expect(server).toContain("roleKey === 'platformadmin'");
    expect(server).toContain("'SchoolIdentityRoute'");
    expect(server).toContain('identity.school_user.');
    expect(server).toContain('user_permission_grants');
    expect(server).toContain("operation === 'set_permissions'");
    expect(server).toContain('permissionCatalog');
  });

  it('registers the identity capability catalog without Platform.Admin', () => {
    const registry = read('src/authorization/PermissionRegistry.ts');
    const migration = read('supabase/migrations/202609091400_school_identity_directory.sql');
    expect(registry).toContain("IDENTITY_USERS_READ: 'Identity.Users.Read'");
    expect(registry).toContain("IDENTITY_USERS_WRITE: 'Identity.Users.Write'");
    expect(registry).toContain("IDENTITY_USERS_ASSIGN: 'Identity.Users.Assign'");
    expect(migration).toContain("'Identity.Users.Audit'");
    expect(migration).toContain("r.role_key = 'schooladmin'");
    expect(migration).not.toContain("'Platform.Admin'");
  });

  it('exposes a canonical, server-backed school UI and header entry point', () => {
    const module = read('src/components/school/SchoolUsersPermissionsModule.tsx');
    const app = read('src/App.tsx');
    const topbar = read('src/components/Topbar.tsx');
    expect(module).toContain("authenticatedRequest('/api/school/users'");
    expect(module).toContain("authenticatedRequest('/api/school/identity-roles'");
    expect(module).toContain("operation, expectedVersion: user.version");
    expect(module).toContain('إدارة الصلاحيات');
    expect(module).toContain("'set_permissions'");
    expect(module).not.toContain('localStorage');
    expect(app).toContain("activeSection === 'school_users_admin'");
    expect(read('src/components/ModernSchoolDashboard.tsx')).toContain("section: 'school_users_admin'");
    expect(topbar).toContain('school-users-permissions-header-btn');
  });
});
