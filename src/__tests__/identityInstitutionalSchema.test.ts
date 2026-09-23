import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('institutional identity foundation schema', () => {
  it('defines durable sessions, service accounts, and hashed API keys without seed data', () => {
    const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/202609231300_identity_institutional_foundation.sql'), 'utf8');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.identity_sessions');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.identity_service_accounts');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.identity_api_keys');
    expect(migration).toContain("CHECK (issued_at < expires_at)");
    expect(migration).toContain('key_hash text NOT NULL UNIQUE');
    expect(migration).toContain('FORCE ROW LEVEL SECURITY');
    expect(migration).not.toContain('refresh_token');
    expect(migration).not.toContain('INSERT INTO');
  });

  it('keeps institutional migrations on the explicit platform-admin connection', () => {
    const runner = readFileSync(resolve(process.cwd(), 'scripts/apply-identity-structure-migrations.ts'), 'utf8');
    expect(runner).toContain('202609231300_identity_institutional_foundation.sql');
    expect(runner).toContain('process.env.PLATFORM_ADMIN_DATABASE_URL');
    expect(runner).not.toContain('process.env.DIRECT_URL');
    expect(runner).not.toContain('process.env.DATABASE_URL');
    expect(runner).toContain('institutional_api_keys');
  });
});
