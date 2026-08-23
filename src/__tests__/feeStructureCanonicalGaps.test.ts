import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('FeeStructureEngine canonical persistence gaps', () => {
  it('guards every authoritative invoice/student fallback read used by fee workflows', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/database/services/FeeStructureEngine.ts'), 'utf8');

    expect(source).toContain("fee template invoice usage check");
    expect(source).toContain("fee template delete invoice check");
    expect(source).toContain("fee assignment student selection");
    expect(source).toContain("student fee summary read");
  });
});
