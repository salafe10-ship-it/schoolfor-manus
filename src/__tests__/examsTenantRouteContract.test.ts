import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');

const routeDeclaration = (method: 'get' | 'post', path: string) =>
  serverSource.split('\n').find(line => line.includes(`app.${method}("${path}"`) || line.includes(`app.${method}('${path}'`)) || '';

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

  it('loads proctor candidates from the authenticated school HR snapshot only', () => {
    const routeStart = serverSource.indexOf("app.get('/api/exams/proctor-candidates'");
    const routeEnd = serverSource.indexOf('app.get("/api/exams/database"', routeStart);
    const route = serverSource.slice(routeStart, routeEnd);

    expect(route).toContain('authenticateRequest');
    expect(route).toContain('requirePermission(PERMISSIONS.EXAM_READ)');
    expect(route).toContain('resolveStudentReadTenantMiddleware');
    expect(route).toContain("if (!canApproveExamOperation(actorRole, 'approve'))");
    expect(route).toContain("from('hr_database').select('data')");
    expect(route).toContain('buildExamProctorCandidates(snapshot?.data)');
  });

  it('requires exact grade scopes for every non-approver writing the versioned exam document', () => {
    const route = serverSource.slice(serverSource.indexOf('app.post("/api/exams/database"'));
    expect(route).toContain("if (!canApproveExamOperation(actorRole, 'approve'))");
    expect(route).toContain('assertTeacherWriteScope(currentData, payload as Record<string, unknown>)');
    expect(route).toContain('assertTeacherGradeMatrixScope(currentData, payload as Record<string, unknown>, canonicalEmployeeId)');
    expect(route).toContain('assertTeacherStudentAttendanceScope(currentData, payload as Record<string, unknown>, canonicalEmployeeId)');
    expect(route).toContain('mergeTeacherGradeMatrixPatch(currentData, payload as Record<string, unknown>)');
    expect(route).toContain('mergeTeacherStudentAttendancePatch(currentData, payload as Record<string, unknown>)');
    expect(route).toContain('buildTeacherGradeHistoryEntries(');
    expect(route).toContain('(payload as any).exams_grade_history = [...gradeHistoryEntries, ...existingGradeHistory]');
  });

  it('resolves teacher reads to a trusted linked employee before projecting the grade scope', () => {
    const route = serverSource.slice(serverSource.indexOf('app.get("/api/exams/database"'), serverSource.indexOf('app.post("/api/exams/sync-canonical-classes"'));
    expect(route).toContain('isExamGradeScopedUser(actorRole, actorPermissions)');
    expect(route).toContain(".select('employee_id')");
    expect(route).toContain('.eq(\'auth_user_id\', identity.id)');
    expect(route).toContain('projectExamDatabaseForRead(snapshot.data || {}, actorRole, actorPermissions, employeeId)');
  });

  it('keeps write and read tenant resolution backed by their canonical resolvers', () => {
    expect(serverSource).toContain('async function resolveStudentTenantMiddleware');
    expect(serverSource).toContain('await resolveStudentTenantContext(req);');
    expect(serverSource).toContain('async function resolveStudentReadTenantMiddleware');
    expect(serverSource).toContain('await resolveStudentReadTenantContext(req);');
  });
});
