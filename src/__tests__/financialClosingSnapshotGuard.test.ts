import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('financial closing snapshot canonical guard contract', () => {
  it('does not snapshot or restore local periods in canonical mode', () => {
    const source = readFileSync('src/database/services/FinancialClosingEngine.ts', 'utf8');
    expect(source).toContain("financial closing local transaction snapshot");
    expect(source).toContain("financial closing local rollback");
  });
});
