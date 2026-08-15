import express from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AuthorizationEngine } from '../authorization/AuthorizationEngine';
import { clearAuthorizationAuditEvents, recordAuthorizationDenial, setAuthorizationAuditSink } from '../authorization/AuthorizationAuditHooks';
import { PermissionCache } from '../authorization/PermissionCache';
import { PERMISSIONS, permissionRegistry } from '../authorization/PermissionRegistry';
import { RoleResolver } from '../authorization/RoleResolver';
import { requirePermission } from '../middleware/authorization';

const teacher = { id: 'teacher-1', email: 'teacher@example.com', name: 'Teacher', role: 'Teacher', schoolId: 'school-1' };
const accountant = { id: 'accountant-1', email: 'accountant@example.com', name: 'Accountant', role: 'Accountant', schoolId: 'school-1' };
const superadmin = { id: 'admin-1', email: 'admin@example.com', name: 'Admin', role: 'SuperAdmin', schoolId: 'school-1' };

describe('Wave 1C authorization foundation', () => {
  it('allows a registered permission and denies a missing permission', () => {
    const engine = new AuthorizationEngine();
    expect(engine.authorize(teacher, PERMISSIONS.STUDENT_READ).allowed).toBe(true);
    expect(engine.authorize(teacher, PERMISSIONS.FINANCIAL_WRITE).reason).toBe('MISSING_PERMISSION');
    expect(engine.authorize(accountant, PERMISSIONS.FINANCIAL_WRITE).allowed).toBe(true);
  });

  it('rejects invalid roles and unknown permissions', () => {
    const engine = new AuthorizationEngine();
    expect(engine.authorize({ ...teacher, role: 'ForgedRole' }, PERMISSIONS.STUDENT_READ).reason).toBe('INVALID_ROLE');
    expect(engine.authorize(teacher, 'Unknown.Resource.Action').reason).toBe('UNKNOWN_PERMISSION');
    expect(permissionRegistry.isKnown('student:read')).toBe(true);
    expect(permissionRegistry.isKnown('Unknown.Resource.Action')).toBe(false);
  });

  it('keeps platform authorization separate from school-admin wildcard access', () => {
    const engine = new AuthorizationEngine();
    expect(engine.can(superadmin, PERMISSIONS.PLATFORM_ADMIN)).toBe(true);
    expect(engine.can({ ...teacher, role: 'SchoolAdmin' }, PERMISSIONS.PLATFORM_ADMIN)).toBe(false);
  });

  it('uses the lightweight permission cache for repeated checks', () => {
    const resolver = new RoleResolver();
    const getPermissions = vi.spyOn(resolver, 'getPermissions');
    const engine = new AuthorizationEngine(resolver, new PermissionCache(60_000));
    engine.can(teacher, PERMISSIONS.STUDENT_READ);
    engine.can(teacher, PERMISSIONS.EXAM_READ);
    engine.can(teacher, PERMISSIONS.AI_CHAT);
    expect(getPermissions).toHaveBeenCalledTimes(1);
  });

  it('supports multiple independent permission checks through one engine', () => {
    const engine = new AuthorizationEngine();
    const decisions = [PERMISSIONS.STUDENT_READ, PERMISSIONS.EXAM_READ, PERMISSIONS.FINANCIAL_READ]
      .map(permission => engine.authorize(teacher, permission));
    expect(decisions.map(decision => decision.allowed)).toEqual([true, true, false]);
  });

  it('generates a complete authorization denial audit event', async () => {
    clearAuthorizationAuditEvents();
    const captured: any[] = [];
    setAuthorizationAuditSink(event => { captured.push(event); });
    const engine = new AuthorizationEngine();
    const decision = engine.authorize(teacher, PERMISSIONS.FINANCIAL_WRITE);
    await recordAuthorizationDenial(teacher, decision, {
      schoolId: 'school-1', branchId: 'branch-1', endpoint: '/api/financial/database', method: 'POST', ipAddress: '127.0.0.1'
    });
    expect(captured[0]).toMatchObject({
      userId: 'teacher-1', role: 'Teacher', permission: 'Financial.Write', resource: 'Financial',
      schoolId: 'school-1', branchId: 'branch-1', endpoint: '/api/financial/database', method: 'POST', reason: 'MISSING_PERMISSION'
    });
  });

  it('returns 403 and audits an unauthorized endpoint middleware decision', async () => {
    const captured: any[] = [];
    setAuthorizationAuditSink(event => { captured.push(event); });
    const next = vi.fn();
    const req = {
      user: teacher,
      originalUrl: '/api/financial/database',
      method: 'GET',
      headers: {},
      query: {},
      body: {},
      ip: '127.0.0.1'
    } as unknown as express.Request;
    await requirePermission(PERMISSIONS.FINANCIAL_WRITE)(req, {} as express.Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
    expect(captured.at(-1)).toMatchObject({ permission: 'Financial.Write', userId: 'teacher-1' });
  });
});
