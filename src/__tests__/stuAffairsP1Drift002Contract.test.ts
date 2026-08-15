import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const portalSource = readFileSync(resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'), 'utf8');
const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
const writeRepositorySource = readFileSync(
  resolve(process.cwd(), 'src/database/repositories/CanonicalStudentWriteRepository.ts'),
  'utf8'
);
const studentMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/202608051500_student_platform_foundation.sql'),
  'utf8'
);
const enrollmentMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/202608051700_enrollment_engine.sql'),
  'utf8'
);

describe('STU-AFFAIRS-P1-DRIFT-002 student edit contract boundary', () => {
  it('keeps Enrollment-owned placement fields out of the Student save payload', () => {
    expect(portalSource).not.toContain('classroom: formData.grade');
    expect(portalSource).not.toContain('section: formData.classSection');
    expect(portalSource).toContain('الصف الدراسي <span className="text-slate-500">(يُدار عبر الالتحاق)</span>');
    expect(portalSource).toContain('الشعبة / الفصل <span className="text-slate-500">(يُدار عبر الالتحاق)</span>');
    expect(portalSource).toContain('status: formData.status');
  });

  it('keeps unsupported class and section fields outside the Student aggregate', () => {
    expect(writeRepositorySource).not.toContain('classroom?:');
    expect(writeRepositorySource).not.toContain('section?:');
    expect(studentMigration).not.toMatch(/\bclassroom\b/);
    expect(studentMigration).not.toMatch(/\bsection\b/);
    expect(enrollmentMigration).toContain('class_reference');
    expect(enrollmentMigration).toContain('section_reference');
  });

  it('keeps general status transitions out of the incomplete edit mapping', () => {
    const patchStart = serverSource.indexOf('function toCanonicalStudentPatch');
    const patchEnd = serverSource.indexOf('const guardianUpdateFields', patchStart);
    const patchBlock = serverSource.slice(patchStart, patchEnd);
    expect(patchBlock).not.toContain('patch.status');
    expect(serverSource).toContain('if (studentData.status === "suspended")');
    expect(serverSource).toContain('CanonicalStudentWriteRepository.suspend');
  });
});
