import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student fees and profile integrity', () => {
  it('does not infer fees or fabricate profile contact data', () => {
    const fees = fs.readFileSync(path.resolve(process.cwd(), 'src/components/student-affairs/hooks/useStudentFees.ts'), 'utf8');
    const profile = fs.readFileSync(path.resolve(process.cwd(), 'src/components/student-affairs/hooks/useStudentProfile.ts'), 'utf8');
    expect(fees).toContain('return 0;');
    expect(fees).not.toContain('defaultStageFee = 8000');
    expect(profile).toContain("email: student.email || ''");
    expect(profile).not.toContain('school-erp.edu');
    expect(profile).not.toContain("seatNumber: student.academicId?.replace(/\\D/g, '') || '7721'");
  });
});
