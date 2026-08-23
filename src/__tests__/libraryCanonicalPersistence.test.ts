import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('library canonical persistence contract', () => {
  it('guards library reads, saves, deletes, and borrowed-book checks', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/LibraryRepository.ts'), 'utf8');
    expect((file.match(/FallbackStorage\.assertCanonicalPersistence\(/g) || []).length).toBeGreaterThanOrEqual(5);
    expect(file).toContain('library book write ${id}');
    expect(file).toContain('borrowed books read ${studentId}');
  });
});
