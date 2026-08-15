import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('ACC-001 IMPLEMENTATION-004E server authorization and canonical reads', () => {
  it('does not expose financial file persistence in canonical mode', () => {
    const source = read('server.ts');
    expect(source).toContain('FallbackStorage.assertCanonicalPersistence("financial database read")');
    expect(source).toContain('FallbackStorage.assertCanonicalPersistence("financial database write")');
    expect(source).toContain('const schoolId = String((req as any).user.schoolId || \'\').trim()');
    expect(source).not.toContain('req.body.schoolId');
    expect(source).not.toContain('req.body.school_id');
  });

  it('fails closed instead of returning local journal/account data in canonical mode', () => {
    const journal = read('src/database/repositories/JournalRepository.ts');
    const accounts = read('src/database/repositories/AccountRepository.ts');
    const posting = read('src/database/services/PostingEngine.ts');

    expect(journal).toContain('FallbackStorage.assertCanonicalPersistence(`journal entry read ${id}`)');
    expect(journal).toContain('FallbackStorage.assertCanonicalPersistence(`journal entries list for ${schoolId}`)');
    expect(journal).toContain('FallbackStorage.assertCanonicalPersistence(`journal validation for ${schoolId}`)');
    expect(accounts).toContain('FallbackStorage.assertCanonicalPersistence(`account read ${id}`)');
    expect(accounts).toContain('FallbackStorage.assertCanonicalPersistence(`accounts list for ${schoolId}`)');
    expect(posting).toContain('FallbackStorage.assertCanonicalPersistence(`trial balance read for ${schoolId}`)');
    expect(posting).toContain('FallbackStorage.assertCanonicalPersistence(`journal audit read for ${schoolId}`)');
    expect(posting).toContain('FallbackStorage.assertCanonicalPersistence(`accounting period validation for ${schoolId}`)');
  });
});
