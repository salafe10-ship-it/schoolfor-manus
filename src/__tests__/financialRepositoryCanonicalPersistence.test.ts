import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('financial invoice repository canonical persistence contract', () => {
  it('guards invoice reads and mutations from local fallback', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/FinancialRepository.ts'), 'utf8');
    expect((file.match(/FallbackStorage\.assertCanonicalPersistence\(/g) || []).length).toBeGreaterThanOrEqual(5);
    expect(file).toContain('invoice create ${id}');
    expect(file).toContain('invoice delete ${id}');
  });
});
