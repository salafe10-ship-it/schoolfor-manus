import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../authorization/PermissionRegistry';
import { InvalidRoleError, RoleResolver } from '../authorization/RoleResolver';

const identity = {
  id: 'auth-user-1',
  email: 'operator@example.com',
  name: 'Operator',
  role: 'ForgedRole',
  schoolId: 'school-1',
  branchId: 'branch-1'
};

const studentDocumentAssignments = [
  { roleKey: 'student_affairs', permissionKey: PERMISSIONS.STUDENT_DOCUMENT_VIEW },
  { roleKey: 'student_affairs', permissionKey: PERMISSIONS.STUDENT_DOCUMENT_CREATE },
  { roleKey: 'student_affairs', permissionKey: PERMISSIONS.STUDENT_DOCUMENT_VERIFY },
  { roleKey: 'student_affairs', permissionKey: PERMISSIONS.STUDENT_DOCUMENT_ARCHIVE },
  { roleKey: 'student_affairs', permissionKey: PERMISSIONS.STUDENT_DOCUMENT_ACCESS_LOG_VIEW },
  { roleKey: 'student_affairs', permissionKey: PERMISSIONS.STUDENT_DOCUMENT_VERSION_CREATE },
  { roleKey: 'student_affairs', permissionKey: PERMISSIONS.STUDENT_DOCUMENT_VIEW }
];

describe('AUTH-004 database role-permission resolution', () => {
  it('resolves the trusted database role and deduplicates effective permissions', async () => {
    const resolver = new RoleResolver();
    resolver.configureDatabaseLoader(async loadedIdentity => {
      expect(loadedIdentity.role).toBe('ForgedRole');
      expect(loadedIdentity.schoolId).toBe('school-1');
      return studentDocumentAssignments;
    });

    await resolver.ensureDatabasePermissions(identity);

    expect(resolver.resolveRole(identity)).toBe('student_affairs');
    expect(resolver.getPermissions(identity)).toEqual(new Set([
      PERMISSIONS.STUDENT_DOCUMENT_VIEW,
      PERMISSIONS.STUDENT_DOCUMENT_CREATE,
      PERMISSIONS.STUDENT_DOCUMENT_VERIFY,
      PERMISSIONS.STUDENT_DOCUMENT_ARCHIVE,
      PERMISSIONS.STUDENT_DOCUMENT_ACCESS_LOG_VIEW,
      PERMISSIONS.STUDENT_DOCUMENT_VERSION_CREATE
    ]));
  });

  it('keeps the six StudentDocument capabilities separate', async () => {
    const resolver = new RoleResolver();
    resolver.configureDatabaseLoader(async () => [
      { roleKey: 'student_affairs', permissionKey: PERMISSIONS.STUDENT_DOCUMENT_VIEW },
      { roleKey: 'student_affairs', permissionKey: PERMISSIONS.STUDENT_DOCUMENT_VERIFY }
    ]);

    await resolver.ensureDatabasePermissions(identity);

    expect(resolver.getPermissions(identity).has(PERMISSIONS.STUDENT_DOCUMENT_VIEW)).toBe(true);
    expect(resolver.getPermissions(identity).has(PERMISSIONS.STUDENT_DOCUMENT_VERIFY)).toBe(true);
    expect(resolver.getPermissions(identity).has(PERMISSIONS.STUDENT_DOCUMENT_CREATE)).toBe(false);
    expect(resolver.getPermissions(identity).has(PERMISSIONS.STUDENT_DOCUMENT_ARCHIVE)).toBe(false);
    expect(resolver.getPermissions(identity).has(PERMISSIONS.STUDENT_DOCUMENT_ACCESS_LOG_VIEW)).toBe(false);
    expect(resolver.getPermissions(identity).has(PERMISSIONS.STUDENT_DOCUMENT_VERSION_CREATE)).toBe(false);
  });

  it('fails closed for no assignment, an unknown role, and an unknown or wildcard permission', async () => {
    const noAssignment = new RoleResolver();
    noAssignment.configureDatabaseLoader(async () => []);
    await expect(noAssignment.ensureDatabasePermissions(identity)).rejects.toBeInstanceOf(InvalidRoleError);

    const unknownRole = new RoleResolver();
    unknownRole.configureDatabaseLoader(async () => [{ roleKey: 'not_registered', permissionKey: PERMISSIONS.STUDENT_DOCUMENT_VIEW }]);
    await expect(unknownRole.ensureDatabasePermissions(identity)).rejects.toBeInstanceOf(InvalidRoleError);

    const unknownPermission = new RoleResolver();
    unknownPermission.configureDatabaseLoader(async () => [{ roleKey: 'student_affairs', permissionKey: 'StudentDocument.Delete' }]);
    await expect(unknownPermission.ensureDatabasePermissions(identity)).rejects.toBeInstanceOf(InvalidRoleError);

    const wildcard = new RoleResolver();
    wildcard.configureDatabaseLoader(async () => [{ roleKey: 'student_affairs', permissionKey: '*' }]);
    await expect(wildcard.ensureDatabasePermissions(identity)).rejects.toBeInstanceOf(InvalidRoleError);
  });

  it('fails closed when trusted identity is incomplete and does not use its client role', async () => {
    const resolver = new RoleResolver();
    resolver.configureDatabaseLoader(async () => studentDocumentAssignments);

    await expect(resolver.ensureDatabasePermissions({ ...identity, id: undefined })).rejects.toBeInstanceOf(InvalidRoleError);
    await expect(resolver.ensureDatabasePermissions({ ...identity, schoolId: undefined })).rejects.toBeInstanceOf(InvalidRoleError);
    await expect(resolver.ensureDatabasePermissions({ ...identity, role: 'superadmin' })).resolves.toBeUndefined();
    expect(resolver.resolveRole({ ...identity, role: 'superadmin' })).toBe('student_affairs');
  });
});
