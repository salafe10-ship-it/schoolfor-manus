import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const portalSource = readFileSync(resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'), 'utf8');
const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
const readRepositorySource = readFileSync(resolve(process.cwd(), 'src/database/repositories/CanonicalStudentReadRepository.ts'), 'utf8');
const writeRepositorySource = readFileSync(resolve(process.cwd(), 'src/database/repositories/CanonicalStudentWriteRepository.ts'), 'utf8');

function saveBlock(): string {
  const start = portalSource.indexOf('const studentPayload: any = {');
  const end = portalSource.indexOf('try {', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return portalSource.slice(start, end);
}

describe('STU-AFFAIRS-P1-006-31 preferredName UI parity', () => {
  it('binds preferredName for both Create and Edit through the shared canonical payload', () => {
    expect(portalSource).toContain("preferredName: '',");
    expect(portalSource).toContain('preferredName: (student as any).preferredName ||');
    expect(saveBlock()).toContain('preferredName: formData.preferredName');
  });

  it('uses the existing canonical server mapping and read projection', () => {
    expect(serverSource).toContain('if (studentData.preferredName !== undefined) patch.preferredName = studentData.preferredName;');
    expect(readRepositorySource).toContain('preferredName: row.preferred_name ||');
    expect(writeRepositorySource).toContain("patch.preferredName !== undefined");
  });

  it('keeps empty preferredName empty and does not synthesize a value', () => {
    expect(portalSource).not.toContain("preferredName || 'طالب'");
    expect(portalSource).not.toContain('preferredName || `');
    expect(portalSource).toContain('value={formData.preferredName}');
  });

  it('keeps success behind a canonical response', () => {
    const persisted = portalSource.indexOf('if (!persistedStudent)');
    const success = portalSource.indexOf('persistenceNotice', persisted);
    expect(persisted).toBeGreaterThan(-1);
    expect(success).toBeGreaterThan(persisted);
  });
});
