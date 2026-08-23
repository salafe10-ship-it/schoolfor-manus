import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('student lifecycle canonical guard contract', () => {
  it('does not derive withdrawal or name propagation from local collections', () => {
    const medical = readFileSync('src/database/services/StudentMedicalService.ts', 'utf8');
    const withdrawal = readFileSync('src/database/services/StudentWithdrawalService.ts', 'utf8');
    const student = readFileSync('src/database/services/StudentService.ts', 'utf8');
    expect(medical).toContain('student medical record deletion lookup');
    expect(withdrawal).toContain('student withdrawal documents read');
    expect(withdrawal).toContain('student withdrawal contacts read');
    expect(student).toContain('student name invoice synchronization read');
    expect(student).toContain('student name attendance synchronization read');
  });
});
