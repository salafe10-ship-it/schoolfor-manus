import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useStudentProfile authoritative identity contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/student-affairs/hooks/useStudentProfile.ts'), 'utf8');

  it('does not invent academic, seat, or translated identity fields', () => {
    expect(source).toContain("studentCode: student.studentCode || ''");
    expect(source).toContain("academicId: student.academicId || ''");
    expect(source).toContain("fullNameEn: (student as any).nameEn || ''");
    expect(source).toContain("seatNumber: (student as any).seatNumber || ''");
    expect(source).not.toContain('SAH-${student.id}');
    expect(source).not.toContain("slice(-4) || '0001'");
  });
});
