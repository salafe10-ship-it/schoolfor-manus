import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const serviceSource = readFileSync(
  join(process.cwd(), 'src', 'database', 'services', 'StudentAdmissionService.ts'),
  'utf8'
);

describe('Student admission and attendance boundary', () => {
  it('does not create an attendance record during admission', () => {
    expect(serviceSource).not.toContain("from '../repositories/AttendanceRepository'");
    expect(serviceSource).not.toContain('enlistCreateAttendance');
    expect(serviceSource).not.toMatch(/affectedTables:[\s\S]*['"]attendance['"]/);
  });

  it('keeps attendance creation on the canonical attendance application path', () => {
    const attendanceApplicationSource = readFileSync(
      join(process.cwd(), 'src', 'modules', 'student-attendance', 'application', 'AttendanceApplicationService.ts'),
      'utf8'
    );

    expect(attendanceApplicationSource).toContain('recordAttendance');
    expect(attendanceApplicationSource).toContain('assertEligible');
  });
});
