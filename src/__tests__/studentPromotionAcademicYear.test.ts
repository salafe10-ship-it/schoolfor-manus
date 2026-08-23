import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('student promotion academic year', () => {
  it('derives the next academic year from the student record', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/database/services/StudentPromotionService.ts'), 'utf8');
    expect(source).toContain("student.academicYear?.match(/^(\\d{4})\\/(\\d{4})$/)");
    expect(source).toContain('academicYear: nextAcademicYear');
    expect(source).not.toContain('academicYear: "2027/2028"');
    expect(source).toContain('promotion.carryOverFees < 0');
    expect(source).toContain('promotion.targetClassroom?.trim()');
  });
});
