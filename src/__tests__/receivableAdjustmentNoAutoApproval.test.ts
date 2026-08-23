import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('accounts receivable adjustment approval gate', () => {
  it('creates pending requests and does not auto-approve them', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/database/services/AccountsReceivablePolicyService.ts'),
      'utf8'
    );
    expect(source).toContain("status: 'pending'");
    expect(source).toContain('return adj;');
    expect(source).not.toContain("status: 'approved', // auto-approve");
  });
});
