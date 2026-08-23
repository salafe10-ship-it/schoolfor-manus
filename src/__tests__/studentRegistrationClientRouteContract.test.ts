import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const portalSource = readFileSync('src/components/StudentAffairsPortal.tsx', 'utf8');
const repositorySource = readFileSync('src/components/student-affairs/repository/StudentRepository.ts', 'utf8');
const serverSource = readFileSync('server.ts', 'utf8');

describe('STU-SOL-015 canonical registration route boundary', () => {
  it('uses the canonical registration endpoint and a stable idempotency key for new records', () => {
    expect(repositorySource).toContain('async registerStudent(studentData: any, idempotencyKey: string)');
    expect(repositorySource).toContain('"/api/student-registration"');
    expect(repositorySource).toContain('"Idempotency-Key": idempotencyKey');
    expect(portalSource).toContain('setRegistrationIdempotencyKey(`student-affairs-registration-${crypto.randomUUID()}`)');
    expect(portalSource).toContain('await StudentRepository.registerStudent(studentPayload, registrationIdempotencyKey || \'\')');
  });

  it('keeps canonical permission, tenant-derived mapping, and response shape on the server', () => {
    const routeStart = serverSource.indexOf('app.post("/api/student-registration"');
    const routeEnd = serverSource.indexOf('app.patch("/api/students/:studentId/guardian"', routeStart);
    expect(routeStart).toBeGreaterThan(-1);
    expect(routeEnd).toBeGreaterThan(routeStart);
    const route = serverSource.slice(routeStart, routeEnd);
    expect(route).toContain('PERMISSIONS.STUDENT_REGISTRATION_CREATE');
    expect(route).toContain('resolveStudentTenantContext(req)');
    expect(route).toContain('toCanonicalRegistrationCommand(tenantContext, (req.body || {}) as Record<string, any>)');
    expect(route).toContain('data: { student: result }');
  });
});
