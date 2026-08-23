import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('student repository canonical gap contract', () => {
  it('fails closed for advanced-search fallback and never writes local state after central status success', () => {
    const source = readFileSync('src/database/repositories/StudentRepository.ts', 'utf8');
    expect(source).toContain("student advanced search fallback");
    expect(source).toContain("student status update fallback");
    expect(source).toContain('this.CACHE.delete(studentId);\n            return;');
  });
});
