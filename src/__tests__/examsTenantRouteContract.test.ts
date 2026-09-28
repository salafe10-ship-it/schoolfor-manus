import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');

const routeDeclaration = (method: 'get' | 'post', path: string) =>
  serverSource.split('\n').find(line => line.includes(`app.${method}("${path}"`)) || '';

describe('EXAMS-API trusted tenant route contract', () => {
  it('resolves the trusted write context before saving the exams database', () => {
    const route = routeDeclaration('post', '/api/exams/database');

    expect(route).toContain('authenticateRequest');
    expect(route).toContain('requirePermission(PERMISSIONS.EXAM_WRITE)');
    expect(route).toContain('resolveStudentTenantMiddleware');
    expect(route).toContain('async (req, res, next)');
  });

  it('resolves the trusted write context before syncing canonical classes', () => {
    const route = routeDeclaration('post', '/api/exams/sync-canonical-classes');

    expect(route).toContain('authenticateRequest');
    expect(route).toContain('requirePermission(PERMISSIONS.EXAM_WRITE)');
    expect(route).toContain('resolveStudentTenantMiddleware');
    expect(route).toContain('async (req, res, next)');
  });

  it('uses the read-only tenant resolver for the exams database projection', () => {
    const route = routeDeclaration('get', '/api/exams/database');

    expect(route).toContain('authenticateRequest');
    expect(route).toContain('requirePermission(PERMISSIONS.EXAM_READ)');
    expect(route).toContain('resolveStudentReadTenantMiddleware');
    expect(route).toContain('async (req, res, next)');
  });

  it('keeps write and read tenant resolution backed by their canonical resolvers', () => {
    expect(serverSource).toContain('async function resolveStudentTenantMiddleware');
    expect(serverSource).toContain('await resolveStudentTenantContext(req);');
    expect(serverSource).toContain('async function resolveStudentReadTenantMiddleware');
    expect(serverSource).toContain('await resolveStudentReadTenantContext(req);');
  });
});
