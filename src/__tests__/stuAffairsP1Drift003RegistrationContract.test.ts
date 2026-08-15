import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
const portalSource = readFileSync(resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'), 'utf8');
const registrationSource = readFileSync(
  resolve(process.cwd(), 'src/modules/student-registration/application/StudentRegistrationService.ts'),
  'utf8'
);
const repositorySource = readFileSync(
  resolve(process.cwd(), 'src/modules/student-registration/infrastructure/StudentRegistrationRepositories.ts'),
  'utf8'
);

function registrationBlock(): string {
  const start = serverSource.indexOf('async function toCanonicalRegistrationCommand');
  const end = serverSource.indexOf('function toCanonicalStudentPatch', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return serverSource.slice(start, end);
}

describe('STU-AFFAIRS-P1-DRIFT-003 registration field integrity', () => {
  it('preserves only approved canonical registration mappings', () => {
    const block = registrationBlock();
    expect(block).toContain('nationality: studentData.nationality');
    expect(block).toContain('birthCountryCode: studentData.birthCountryCode');
    expect(block).toContain('admissionReference: "STUDENT-AFFAIRS-REGISTRATION"');
    expect(block).toContain('legalFirstName: guardianParts[0]');
    expect(block).toContain('phone: studentData.parentPhone');
  });

  it('never derives guardian email from student email', () => {
    const block = registrationBlock();
    expect(block).toContain('email: studentData.parentEmail');
    expect(block).not.toMatch(/email:\s*studentData\.parentEmail\s*\|\|\s*studentData\.email/);
  });

  it('does not introduce placement or lifecycle fields into canonical registration', () => {
    const block = registrationBlock();
    expect(block).not.toContain('classroom:');
    expect(block).not.toContain('section:');
    expect(block).not.toContain('stage:');
    expect(block).not.toContain('status: studentData.status');
  });

  it('has explicit UI guardian identity inputs and canonical service persistence fields', () => {
    expect(portalSource).toContain('parentName: formData.parentName');
    expect(portalSource).toContain('parentPhone: formData.parentPhone');
    expect(registrationSource).toContain('birthCountryCode: stringValue(command.birthCountryCode');
    expect(repositorySource).toContain('birth_country_code');
    expect(repositorySource).toContain('admission_reference');
  });
});
