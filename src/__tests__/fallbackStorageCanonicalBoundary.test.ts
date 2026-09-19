import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('fallback storage canonical boundary', () => {
  it('keeps production fallback access fail-closed', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/database/repositories/FallbackStorage.ts'), 'utf8');
    expect(source).toContain('public static isCanonicalPersistenceRequired()');
    expect(source).toContain('public static assertCanonicalPersistence(operation: string): void');
    expect(source).toContain("'PERSISTENCE_UNKNOWN'");
    expect(source).toContain('this.assertCanonicalPersistence(`read ${table}`)');
    expect(source).toContain('this.assertCanonicalPersistence(`write ${operation} ${table}/${recordId}`)');
  });
});
