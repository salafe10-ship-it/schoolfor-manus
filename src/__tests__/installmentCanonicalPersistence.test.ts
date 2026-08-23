import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('installment canonical persistence contract', () => {
  it('guards plans and all related schedules, items, payments, history, and versions', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/InstallmentRepository.ts'), 'utf8');
    expect(file).toContain('FallbackStorage.assertCanonicalPersistence');
    expect((file.match(/assertAuthoritativePersistence\(/g) || []).length).toBeGreaterThanOrEqual(17);
    expect(file).toContain("this.assertAuthoritativePersistence('payment write');");
  });
});
