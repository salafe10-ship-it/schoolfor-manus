import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('collections validator canonical guard contract', () => {
  it('does not validate receipts or allocations against local financial copies', () => {
    const source = readFileSync('src/database/services/CollectionsValidator.ts', 'utf8');
    expect(source).toContain('collection receipt validation source read');
    expect(source).toContain('collection allocation validation source read');
  });
});
