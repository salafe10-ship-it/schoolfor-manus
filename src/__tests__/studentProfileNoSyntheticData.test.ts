import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('student profile truthfulness', () => {
  it('does not display synthetic birth, nationality, or religion values', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/student-affairs/hooks/useStudentProfile.ts'), 'utf8');
    expect(source).toContain("birthDate: ''");
    expect(source).toContain("nationality: ''");
    expect(source).toContain("religion: ''");
    expect(source).not.toContain("student.birthDate || '2015-06-15'");
    expect(source).not.toContain("student.nationality || 'سعودي'");
    expect(source).not.toContain("student.religion || 'مسلم'");
    expect(source).toContain("gender: ''");
    expect(source).toContain("student.gender === 'male' || student.gender === 'female' ? student.gender : ''");
  });
});
