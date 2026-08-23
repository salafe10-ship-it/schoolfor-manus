import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/database/repositories/ProcurementRepository.ts', 'utf8');

describe('procurement canonical persistence contract', () => {
  it('does not treat browser storage as authoritative in canonical mode', () => {
    expect(source).toContain('FallbackStorage.assertCanonicalPersistence(`procurement ${operation}`)');
    expect(source).toContain("this.assertAuthoritativePersistence('read')");
    expect(source).toContain("this.assertAuthoritativePersistence('write')");
    expect(source).toContain('if (!data) return [];');
    expect(source).not.toContain('localStorage.setItem(key, JSON.stringify(defaultValue));');
    expect(source).not.toContain('return defaultValue;');
  });
});
