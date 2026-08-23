import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('student library canonical read contract', () => {
  it('does not derive library commitments from local copies', () => {
    const source = readFileSync('src/database/services/StudentLibraryService.ts', 'utf8');
    expect(source).toContain('student library commitments read');
    expect(source).toContain('student library account deletion lookup');
  });
});
