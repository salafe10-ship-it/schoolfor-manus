import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/authorization/PlatformRolePermissionSource.ts'), 'utf8');
const schema = readFileSync(resolve(process.cwd(), 'supabase/migrations/202608191205_platform_rbac_canonical.sql'), 'utf8');

describe('Platform permission source contract', () => {
  it('is platform-only, transaction-bound, and fail-closed', () => {
    expect(source).toContain('UnitOfWork.runPlatformInTransaction');
    expect(source).toContain('platform_users');
    expect(source).toContain('platform_user_roles');
    expect(source).toContain('platform_roles');
    expect(source).toContain('platform_role_permissions');
    expect(source).toContain('platform_permissions');
    expect(source).toContain("pu.auth_user_id = $1::uuid");
    expect(source).not.toMatch(/public\.(users|user_roles|roles|role_permissions|permissions)\b/);
    expect(source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')).not.toMatch(/tenant_id|school_id|branch_id/i);
    expect(source).toContain("pu.status = 'active'");
    expect(source).toContain("pur.status = 'active'");
    expect(source).toContain("pr.status = 'active'");
    expect(source).toContain("pp.status = 'active'");
    expect(source).toContain("prp.status = 'active'");
    expect(source).toContain("pur.starts_at <= now()");
    expect(source).toContain("pur.ends_at IS NULL OR pur.ends_at > now()");
  });

  it('models role-permission link activity without wildcard catalog entries', () => {
    expect(schema).toContain('status text NOT NULL DEFAULT \'active\'');
    expect(schema).toContain('deleted_at timestamptz');
    expect(source).not.toContain("permissionKey: '*'");
    expect(source).not.toContain("permissionKey = '*'");
  });
});
