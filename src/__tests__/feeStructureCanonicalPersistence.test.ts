import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('fee structure canonical persistence contract', () => {
  it('does not seed or persist authoritative fee data from the browser in canonical mode', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/services/FeeStructureEngine.ts'), 'utf8');
    expect(file).toContain('FallbackStorage.isCanonicalPersistenceRequired()');
    expect(file).toContain('this.categories = [];');
    expect(file).toContain("throw new Error('Canonical fee persistence is unavailable in browser mode.')");
  });
});
