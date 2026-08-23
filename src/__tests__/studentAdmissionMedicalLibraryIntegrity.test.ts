import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('student medical and library admission integrity', () => {
  it('does not fabricate medical facts or random library identifiers', () => {
    const medical = readFileSync(resolve(process.cwd(), 'src/database/services/StudentMedicalService.ts'), 'utf8');
    const library = readFileSync(resolve(process.cwd(), 'src/database/services/StudentLibraryService.ts'), 'utf8');
    expect(medical).not.toContain("healthBloodType || 'O+'");
    expect(medical).not.toContain("healthVaccines !== undefined ? studentData.healthVaccines : true");
    expect(medical).not.toContain("parentPhone || '000000000'");
    expect(library).toContain('libraryCardNumber: `LC-${libraryId}`');
    expect(library).not.toContain('Math.random()');
  });
});
