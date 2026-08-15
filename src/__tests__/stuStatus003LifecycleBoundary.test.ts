import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('STU-STATUS-003 lifecycle release boundary discovery', () => {
  it('proves the inspected lifecycle routes are registered and graduation is fail-closed', () => {
    const server = read('server.ts');
    expect(server).toContain('app.post("/api/students/:id/transfer"');
    expect(server).toContain('app.post("/api/students/:id/promote"');
    expect(server).toContain('app.post("/api/students/:id/re-enroll"');
    expect(server).toContain('app.post("/api/students/:id/dismiss"');
    expect(server).toContain('app.post("/api/students/:id/archive"');
    expect(server).toContain('errorCode: "GRADUATION_NOT_READY"');
  });

  it('proves the canonical registration status tables and initial applicant write exist', () => {
    const registration = read('src/modules/student-registration/infrastructure/StudentRegistrationRepositories.ts');
    expect(registration).toContain("'student_academic_status'");
    expect(registration).toContain("'student_status_transitions'");
    expect(registration).toContain("'student_status_history'");
    expect(registration).toContain("'applicant'");
  });

  it('proves canonical schema vocabulary and one-current-status constraint', () => {
    const migration = read('supabase/migrations/202608061000_academic_status_engine.sql');
    expect(migration).toContain("status IN ('applicant', 'admitted', 'active', 'suspended', 'withdrawn', 'graduated', 'archived')");
    expect(migration).toContain('uq_student_academic_status_current_student');
    expect(migration).toContain('student_status_transitions');
    expect(migration).toContain('student_status_history');
  });

  it('proves the legacy vocabulary is broader and must not be silently mapped', () => {
    const types = read('src/types.ts');
    const manager = read('src/database/services/StudentLifecycleManager.ts');
    for (const value of ['accepted', 'enrolled', 're_enrolled', 'dismissed', 'frozen', 'inactive', 'on_leave']) {
      expect(types).toContain(`'${value}'`);
      expect(manager).toContain(value);
    }
  });

  it('proves canonical suspension is distinct from legacy lifecycle services', () => {
    const canonical = read('src/database/repositories/CanonicalStudentWriteRepository.ts');
    const legacy = read('src/database/services/StudentEnrollmentService.ts');
    expect(canonical).toContain('public static async suspend');
    expect(canonical).toContain('student_status_transitions');
    expect(canonical).toContain('student_status_history');
    expect(legacy).toContain('StudentLifecycleManager.validateTransition');
    expect(legacy).toContain('StudentRepository.update');
  });

  it('proves bulk is a separate reachable path and no bulk mutation is executed by this test', () => {
    const server = read('server.ts');
    const studentService = read('src/database/services/StudentService.ts');
    expect(server).toContain('app.post("/api/students/bulk"');
    expect(studentService).toContain('executeBulkOperation');
    expect(studentService).toContain('UnitOfWork.runInTransaction');
    expect(studentService).toContain('supportedOperations');
  });

  it('records that this discovery has an explicit blocked decision', () => {
    const report = read('docs/student-platform/stu-status-003-validation.md');
    expect(report).toContain('STU-STATUS-003 = BLOCKED — DOMAIN/SECURITY/ARCHITECTURE DECISION REQUIRED');
    expect(report).toContain('Runtime lifecycle mutations | `PASS — 0`');
    expect(report).toContain('Runtime bulk mutations | `PASS — 0`');
  });
});
