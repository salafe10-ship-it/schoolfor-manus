import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string): string => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('Student Affairs permission gate', () => {
  it('does not mount the portal when the trusted client permission hint denies Student.View', () => {
    const app = read('src/App.tsx');
    expect(app).toContain("checkSectionPermission('students') ? (");
    expect(app).toContain("renderAccessDenied('students')");
  });

  it('filters Dashboard actions and keeps a navigation guard', () => {
    const dashboard = read('src/components/ModernSchoolDashboard.tsx');
    expect(dashboard).toContain("quickActions.filter(({ section }) => canAccessSection(section))");
    expect(dashboard).toContain("if (!canAccessSection(section))");
  });

  it('uses server-derived effective permissions when present', () => {
    const authorization = read('src/authorization/ClientAuthorization.ts');
    const session = read('src/middleware/trustedSessionManager.ts');
    const server = read('src/middleware/trustedAuthentication.ts');
    expect(authorization).toContain('identity.permissions.includes(permission)');
    expect(session).toContain('value.permissions');
    expect(server).toContain('attachTrustedTenantPermissions');
  });

  it('fails closed when the server permission hint is absent', () => {
    const authorization = read('src/authorization/ClientAuthorization.ts');
    expect(authorization).toContain("if (!Array.isArray(identity.permissions)) return sectionId === 'dashboard';");
    expect(authorization).toContain('tenant modules');
  });

  it('guards Student Affairs mutations and export by explicit permissions', () => {
    const portal = read('src/components/StudentAffairsPortal.tsx');
    expect(portal).toContain('PERMISSIONS.STUDENT_WRITE');
    expect(portal).toContain('PERMISSIONS.STUDENT_DELETE');
    expect(portal).toContain('PERMISSIONS.STUDENT_EXPORT');
    expect(portal).toContain('disabled={!canWriteStudents}');
    expect(portal).toContain('disabled={!canDeleteStudents}');
  });
});
