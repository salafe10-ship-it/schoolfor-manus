import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('fee eligibility and receivables canonical guards', () => {
  it('guards student and receivable authoritative validation reads', () => {
    const eligibility = readFileSync(resolve(process.cwd(), 'src/database/services/FeeEligibilityEngine.ts'), 'utf8');
    const receivables = readFileSync(resolve(process.cwd(), 'src/database/services/AccountsReceivableValidator.ts'), 'utf8');
    expect(eligibility).toContain('fee eligibility sibling lookup');
    expect(receivables).toContain('receivable account validation reads');
    expect(receivables).toContain('receivable transaction validation reads');
  });
});
