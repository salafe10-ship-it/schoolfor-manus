import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ExamsResultsModule authoritative teacher contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/ExamsResultsModule.tsx'), 'utf8');

  it('does not ship named mock proctors', () => {
    expect(source).toContain('const availableTeachers = initialTeachers;');
    expect(source).not.toContain('INITIAL_TEACHERS_MOCK');
    expect(source).not.toContain("id: 't-1', name: 'أ. عبد الرحمن اليوسف'");
    expect(source).not.toContain("id: 't-2', name: 'أ. خالد الشهري'");
  });
});
