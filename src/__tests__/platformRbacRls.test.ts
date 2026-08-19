import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/202608191210_platform_rbac_rls.sql'),
  'utf8',
);

const platformTables = [
  'platform_users',
  'platform_roles',
  'platform_permissions',
  'platform_role_permissions',
  'platform_user_roles',
];

describe('Platform RBAC RLS foundation', () => {
  it('enables RLS on every platform table and keeps tenant RLS untouched', () => {
    for (const table of platformTables) {
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(migration).not.toMatch(/ALTER TABLE public\.(tenants|schools|branches|users)\s/i);
  });

  it('uses auth.uid for self-read and does not add client-controlled authority', () => {
    const executableSql = migration.replace(/--.*$/gm, '');
    expect(migration).toContain('auth_user_id = auth.uid()');
    expect(migration).toContain('FOR SELECT');
    expect(migration).toContain('TO authenticated');
    expect(migration).not.toMatch(/tenant_id|school_id|branch_id|request\.body|localStorage|sessionStorage/i);
    expect(migration).not.toContain("'*'");
    if (/SECURITY DEFINER/i.test(executableSql)) {
      expect(executableSql).toMatch(/SECURITY DEFINER\s+SET search_path = public, auth/i);
      expect(executableSql).not.toMatch(/EXECUTE\s+format\s*\(/i);
    }
    expect(executableSql).not.toMatch(/\b(INSERT|UPDATE|DELETE)\s+INTO\b/i);
    expect(migration).not.toMatch(/CREATE POLICY .* ON public\.(tenants|schools|branches|users)/i);
  });
});
