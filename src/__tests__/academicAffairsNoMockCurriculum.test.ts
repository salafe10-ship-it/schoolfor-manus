import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('academic affairs integrity', () => {
  it('does not seed subjects or schedules without central data', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/AcademicAffairsPortal.tsx'),
      'utf8'
    );
    expect(source).toContain('useState<SubjectItem[]>([]);');
    expect(source).toContain('useState<SchedulePeriod[]>([]);');
    expect(source).toContain('const totalClassesCount = academicClasses.length;');
    expect(source).toContain('const activeTeachersCount = teachers.length;');
  });
});
