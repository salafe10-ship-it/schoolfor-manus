import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('procurement and inventory canonical contract', () => {
  it('guards operational reads and writes against local fallback', () => {
    const procurement = readFileSync('src/database/repositories/ProcurementRepository.ts', 'utf8');
    const inventory = readFileSync('src/database/repositories/InventoryRepository.ts', 'utf8');
    expect(procurement).toContain('assertCanonicalPersistence');
    expect(inventory).toContain('FallbackStorage.performRead');
    expect(inventory).toContain('inventory save');
    expect(inventory).toContain('inventory delete');
  });
});
