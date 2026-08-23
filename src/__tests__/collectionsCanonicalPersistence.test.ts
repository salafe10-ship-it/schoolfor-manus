import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('collections canonical persistence contract', () => {
  it('guards collection receipts and allocations from direct local fallback', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/CollectionsRepository.ts'), 'utf8');
    expect(file).toContain('FallbackStorage.assertCanonicalPersistence');
    expect((file.match(/assertAuthoritativePersistence\(/g) || []).length).toBeGreaterThanOrEqual(8);
    expect(file).toContain("this.assertAuthoritativePersistence('receipt write');");
  });
});
