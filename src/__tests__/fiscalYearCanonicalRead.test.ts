import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('fiscal year canonical read contract', () => {
  it('does not return local fiscal years after an authoritative query failure', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/FiscalYearRepository.ts'), 'utf8');
    expect((file.match(/FallbackStorage\.assertCanonicalPersistence\(/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(file).toContain('fiscal year read ${id}');
    expect(file).toContain('fiscal years list for ${schoolId}');
  });
});
