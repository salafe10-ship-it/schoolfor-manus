import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/database/repositories/FixedAssetsRepository.ts', 'utf8');

describe('fixed assets canonical persistence contract', () => {
  it('does not treat localStorage as authoritative in canonical mode', () => {
    expect(source).toContain('FallbackStorage.assertCanonicalPersistence(`fixed assets ${operation}`)');
    expect(source).toContain('لا تُزرع أصول أو تكاليف أو سجلات إهلاك محليًا');
    expect(source).toContain('return [];');
    expect(source).not.toContain('localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ASSETS));');
    expect(source).toContain("this.assertAuthoritativePersistence('read')");
    expect(source).toContain("this.assertAuthoritativePersistence('write')");
  });
});
