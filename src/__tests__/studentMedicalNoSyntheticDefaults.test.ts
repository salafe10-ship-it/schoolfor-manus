import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student medical and behavior integrity', () => {
  it('does not invent blood type, vaccination, or behavior score', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/student-affairs/hooks/useStudentMedical.ts'),
      'utf8'
    );
    expect(source).toContain("healthBloodType: ''");
    expect(source).toContain('healthVaccines: undefined');
    expect(source).toContain('behaviorPoints: 0');
    expect(source).not.toContain("healthBloodType: 'O+'");
    expect(source).not.toContain('behaviorPoints: 100');
  });
});
