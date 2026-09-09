import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { MODERN_FAMILY_SCHOOL_ID, sectionPresentationOptions, sectionTermForSchool } from '../components/student-affairs/sectionPresentation';

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

  it('keeps the batch import atomic and scoped to the trusted school context', () => {
    expect(repositorySource).toContain("async importStudents(rows: any[], idempotencyKey: string)");
    expect(repositorySource).toContain("'/api/students/import'");
    const routeStart = serverSource.indexOf('app.post("/api/students/import"');
    const routeEnd = serverSource.indexOf('app.post("/api/students/:id/reinstate"', routeStart);
    expect(routeStart).toBeGreaterThan(-1);
    expect(routeEnd).toBeGreaterThan(routeStart);
    const route = serverSource.slice(routeStart, routeEnd);
    expect(route).toContain('PERMISSIONS.STUDENT_REGISTRATION_CREATE');
    expect(route).toContain('resolveStudentTenantMiddleware');
    expect(route).toContain('canonicalStudentImportService.execute');
    expect(route).toContain('toCanonicalRegistrationCommand(tenantContext, row as Record<string, any>, termId)');
  });

  it('keeps stage, grade, and section selectors interactive and cascaded from the trusted structure', () => {
    expect(portalSource).toContain('disabled={activeStageOptions.length === 0}');
    expect(portalSource).toContain('disabled={formGradeOptions.length === 0}');
    expect(portalSource).toContain('disabled={formSectionOptions.length === 0}');
    expect(portalSource).toContain('const formSectionOptions = useMemo');
    expect(portalSource).toContain('setFormData(current => ({ ...current, stage: stageId, grade: nextGradeId, classSection: section }))');
    expect(portalSource).toContain('setFormData(current => ({ ...current, grade: gradeId, classSection: section }))');
    expect(portalSource).toContain('student-affairs-placement-${persistedStudent.id}-${crypto.randomUUID()}');
    expect(portalSource).not.toMatch(/value=\{formData\.stage\}[\s\S]{0,80}disabled\s+aria-disabled="true"/);
  });

  it('scopes the modern-family section wording and numeric labels without changing canonical values', () => {
    expect(MODERN_FAMILY_SCHOOL_ID).toBe('be687819-4d8d-427f-8479-81c0b70c35e1');
    expect(sectionTermForSchool(MODERN_FAMILY_SCHOOL_ID)).toBe('الفصل');
    expect(sectionTermForSchool('92e4d8c8-7cd5-42d8-b850-dfcf12c2da37')).toBe('الشعبة');
    expect(sectionPresentationOptions(['أ', 'ب', 'ج', 'د'], true)).toEqual([
      { value: 'أ', label: '1' },
      { value: 'ب', label: '2' },
      { value: 'ج', label: '3' },
      { value: 'د', label: '4' }
    ]);
    expect(sectionPresentationOptions(['أ', 'ب'], false)).toEqual([
      { value: 'أ', label: 'شعبة أ' },
      { value: 'ب', label: 'شعبة ب' }
    ]);
    expect(portalSource).toContain('sectionTermForSchool(selectedSchool.id)');
    expect(portalSource).toContain('formSectionPresentationOptions.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)');
  });
});
