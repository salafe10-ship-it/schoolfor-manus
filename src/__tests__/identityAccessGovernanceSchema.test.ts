import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('identity access governance schema', () => {
  it('uses canonical database records without seeded or synthetic access', () => {
    const migration = read('supabase/migrations/202609231000_identity_access_governance.sql');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.identity_access_requests');
    expect(migration).toContain('reason text NOT NULL');
    expect(migration).toContain("status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')");
    expect(migration).toContain('starts_at timestamptz NOT NULL');
    expect(migration).toContain('ends_at timestamptz NOT NULL');
    expect(migration).toContain('identity_access_request_approvals');
    expect(migration).toContain('ENABLE ROW LEVEL SECURITY');
    expect(migration).not.toContain('INSERT INTO public.identity_access_requests');
    expect(read('scripts/apply-identity-structure-migrations.ts')).toContain('202609231000_identity_access_governance.sql');
  });

  it('ships idempotent hardening for older manual deployments', () => {
    const migration = read('supabase/migrations/202609231100_identity_access_governance_hardening.sql');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS created_by uuid');
    expect(migration).toContain('FORCE ROW LEVEL SECURITY');
    expect(migration).toContain('CREATE UNIQUE INDEX IF NOT EXISTS uq_identity_access_request_approver');
    expect(migration).not.toContain('DROP TABLE');
    expect(read('scripts/apply-identity-structure-migrations.ts')).toContain('202609231100_identity_access_governance_hardening.sql');
  });
});
