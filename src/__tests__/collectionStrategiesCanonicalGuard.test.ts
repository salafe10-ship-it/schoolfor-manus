import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('collection allocation strategies canonical guard contract', () => {
  it('guards direct installment schedule lookups in individual strategies', () => {
    const source = readFileSync('src/database/services/CollectionAllocationStrategies.ts', 'utf8');
    expect(source).toContain('collection strategy installment source read');
    expect(source).toContain('collection strategy mixed installment source read');
  });
});
