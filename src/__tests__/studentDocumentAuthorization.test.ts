import { describe, expect, it } from 'vitest';
import { AuthorizationEngine } from '../authorization/AuthorizationEngine';
import { PERMISSIONS, permissionRegistry } from '../authorization/PermissionRegistry';

describe('DOC-001A student document permissions', () => {
  const documentPermissions = [
    PERMISSIONS.STUDENT_DOCUMENT_VIEW,
    PERMISSIONS.STUDENT_DOCUMENT_CREATE,
    PERMISSIONS.STUDENT_DOCUMENT_VERIFY,
    PERMISSIONS.STUDENT_DOCUMENT_ARCHIVE,
    PERMISSIONS.STUDENT_DOCUMENT_ACCESS_LOG_VIEW,
    PERMISSIONS.STUDENT_DOCUMENT_VERSION_CREATE,
  ];

  it('registers exactly the six approved StudentDocument permissions', () => {
    expect(documentPermissions.every(permission => permissionRegistry.isKnown(permission))).toBe(true);
    expect(permissionRegistry.isKnown('StudentDocument.Delete')).toBe(false);
  });

  it('allows the approved permissions through the existing school-admin wildcard', () => {
    const engine = new AuthorizationEngine();
    const identity = { id: 'school-admin-1', role: 'SchoolAdmin', schoolId: 'school-1' };
    expect(documentPermissions.map(permission => engine.authorize(identity, permission).allowed))
      .toEqual([true, true, true, true, true, true]);
  });

  it('continues to reject unregistered document permissions', () => {
    const engine = new AuthorizationEngine();
    const decision = engine.authorize({ id: 'school-admin-1', role: 'SchoolAdmin' }, 'StudentDocument.Delete');
    expect(decision.reason).toBe('UNKNOWN_PERMISSION');
    expect(decision.allowed).toBe(false);
  });
});
