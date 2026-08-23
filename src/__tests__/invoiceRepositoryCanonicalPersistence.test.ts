import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('invoice repository canonical persistence contract', () => {
  it('guards raw invoice storage and invoice numbering sequences', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/InvoiceRepository.ts'), 'utf8');
    expect((file.match(/FallbackStorage\.assertCanonicalPersistence\(/g) || []).length).toBeGreaterThanOrEqual(4);
    expect(file).toContain("'invoice repository read'");
    expect(file).toContain('invoice sequence write');
  });
});
