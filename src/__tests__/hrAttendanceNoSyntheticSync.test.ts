import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('HR attendance synchronization integrity', () => {
  it('does not generate random attendance records without a verified source', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/hr/AttendanceTab.tsx'), 'utf8');
    expect(source).toContain('لم تصل بيانات بصمة موثقة من مصدر مركزي');
    expect(source).toContain('const newAttendanceList = [...attendance];');
    expect(source).not.toContain('const rand = Math.random();');
    expect(source).not.toContain('between 08:05 and 08:45');
  });
});
