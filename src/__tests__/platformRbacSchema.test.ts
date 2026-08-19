import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');
const migration = readFileSync(resolve(root, 'supabase/migrations/202608191205_platform_rbac_canonical.sql'), 'utf8');

describe('Platform RBAC foundation migration', () => {
  it('defines separate platform tables and explicit constraints', () => {
    for (const table of ['platform_users', 'platform_roles', 'platform_permissions', 'platform_role_permissions', 'platform_user_roles']) {
      expect(migration).toContain(`public.${table}`);
    }
    expect(migration).toContain('uq_platform_users_auth_user');
    expect(migration).toContain('uq_platform_roles_key');
    expect(migration).toContain('uq_platform_permissions_key');
    expect(migration).toContain('uq_platform_user_roles_assignment');
    expect(migration).toContain('uq_platform_user_roles_active_assignment');
    expect(migration).toContain('updated_at timestamptz NOT NULL DEFAULT now()');
    expect(migration).toContain('REFERENCES auth.users');
    expect(migration).toContain("CHECK (ends_at IS NULL OR starts_at < ends_at)");
  });

  it('does not modify tenant RBAC or introduce wildcard permissions', () => {
    expect(migration).not.toContain('ALTER TABLE public.users');
    expect(migration).not.toContain('ALTER TABLE public.roles');
    expect(migration).not.toContain('ALTER TABLE public.user_roles');
    expect(migration).not.toContain("'*'");
    expect(migration).not.toContain('INSERT INTO');
    expect(migration).not.toMatch(/\b(INSERT|UPDATE|DELETE)\s+INTO\b/);
  });
});
