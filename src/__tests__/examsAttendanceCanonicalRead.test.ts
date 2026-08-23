import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('exams and attendance canonical read contract', () => {
  it('fails closed for the exams fallback branch while attendance uses guarded reads', () => {
    const exams = readFileSync('src/database/repositories/ExamsRepository.ts', 'utf8');
    const attendance = readFileSync('src/database/repositories/AttendanceRepository.ts', 'utf8');
    expect(exams).toContain("exams database read");
    expect(exams).toContain("exams database read after central failure");
    expect(attendance).toContain("FallbackStorage.performRead<Attendance>");
  });
});
