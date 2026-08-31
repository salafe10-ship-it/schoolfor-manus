import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
const graduationServiceSource = readFileSync(
  resolve(process.cwd(), 'src/database/services/StudentGraduationService.ts'),
  'utf8'
);

function graduationRouteBlock(): string {
  const start = serverSource.indexOf('app.post("/api/students/:id/graduate"');
  expect(start).toBeGreaterThan(-1);
  const end = serverSource.indexOf('// DISMISSAL / SUSPENSION', start);
  expect(end).toBeGreaterThan(start);
  return serverSource.slice(start, end);
}

describe('STU-AFFAIRS-P0-DATA-001 graduation false-success containment', () => {
  it('fails closed in the legacy graduation service', () => {
    expect(graduationServiceSource).toContain('Promise<never>');
    expect(graduationServiceSource).toContain('BusinessRuleError');
    expect(graduationServiceSource).not.toContain('graduateRegistry');
    expect(graduationServiceSource).not.toContain('2026/2027');
    expect(graduationServiceSource).not.toContain('3.92 / 4.00');
    expect(graduationServiceSource).not.toContain('certificationStatus');
    expect(graduationServiceSource).not.toContain('success: true');
  });

  it('executes only the authenticated, authorized, tenant-scoped canonical workflow', () => {
    const route = graduationRouteBlock();
    expect(route).toContain('authenticateRequest');
    expect(route).toContain('requirePermission(PERMISSIONS.STUDENT_WRITE)');
    expect(route).toContain('resolveStudentTenantMiddleware');
    expect(route).toContain('canonicalGraduationService.execute');
    expect(route).toContain("evidence: 'immutable-exam-archive'");
    expect(route).toContain('financialClearance: true');
    expect(route).not.toContain('StudentService.graduateStudent');
    expect(route).toContain('success: true');
  });
});
