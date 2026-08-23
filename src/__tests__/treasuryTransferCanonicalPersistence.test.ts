import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('treasury transfer canonical persistence contract', () => {
  it('guards transfer reads and writes outside UnitOfWork transactions', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/TreasuryTransferRepository.ts'), 'utf8');
    expect((file.match(/assertAuthoritativePersistence\(/g) || []).length).toBeGreaterThanOrEqual(4);
    expect(file).toContain("this.assertAuthoritativePersistence('write');");
    expect(file).toContain('UnitOfWork.isTransactionActive()');
  });
});
