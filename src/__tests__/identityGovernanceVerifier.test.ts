import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('identity governance database verifier', () => {
  it('checks the complete production contract without mutating data', () => {
    const script = readFileSync(resolve(process.cwd(), 'scripts/verify-identity-access-governance.ts'), 'utf8');
    expect(script).toContain('relforcerowsecurity');
    expect(script).toContain('identity_access_request_approvals_request_fk');
    expect(script).toContain('user_permission_grants_permission_fk');
    expect(script).toContain("identity_access_reviews");
    expect(script).toContain("identity_sod_rules");
    expect(script).toContain('review_columns === 7');
    expect(script).toContain('sod_rule_columns === 6');
    expect(script).not.toContain('INSERT INTO');
    expect(script).not.toContain('ALTER TABLE');
    expect(script).not.toContain('DROP ');
  });
});
