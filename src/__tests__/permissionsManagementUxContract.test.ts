import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('canonical users and permissions workspace', () => {
  it('has one school route and no retired local interface', () => {
    expect(existsSync('src/components/PermissionsManagementModule.tsx')).toBe(false);
    expect(read('src/components/ModernSchoolDashboard.tsx')).toContain("section: 'school_users_admin'");
    expect(read('src/components/GeneralLedgerPortal.tsx')).toContain("setActiveSection('school_users_admin')");
    expect(read('src/App.tsx')).not.toContain("activeSection === 'permissions_admin'");
    expect(read('src/components/Sidebar.tsx')).not.toContain("{ id: 'permissions_admin'");
  });

  it('separates profile writes from access assignment in the UI', () => {
    const source = read('src/components/school/SchoolUsersPermissionsModule.tsx');
    expect(source).toContain('canManage?: boolean');
    expect(source).toContain('canAssign?: boolean');
    expect(source).toContain('const canCreate = canManage && canAssign');
    expect(source).toContain("operation === 'assign_role' || operation === 'set_permissions'");
    expect(source).toContain('if (saved) setEditing(null)');
    expect(source).toContain('aria-modal="true"');
  });
});
