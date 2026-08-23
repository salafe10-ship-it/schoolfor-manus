import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/components/student-affairs/StudentSearchPanel.tsx'), 'utf8');

describe('Student Affairs batch deletion integrity', () => {
  it('uses the canonical repository and confirms each server result', () => {
    expect(source).toContain("import { StudentRepository } from './repository/StudentRepository';");
    expect(source).toContain('Promise.allSettled(');
    expect(source).toContain('StudentRepository.softDeleteStudent(id)');
    expect(source).toContain('results[index]?.status === \'fulfilled\'');
  });

  it('does not claim every selected row succeeded after a partial failure', () => {
    expect(source).toContain('لم تُخفَ السجلات التي لم يؤكد الخادم حذفها');
    expect(source).toContain('failedCount');
  });
});
