import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/middleware/auth.ts'), 'utf8');

describe('authorization middleware scope routing', () => {
  it('routes the canonical platform permission to platform middleware', () => {
    expect(source).toContain("import { PERMISSIONS } from '../authorization/PermissionRegistry.js';");
    expect(source).toContain('permission === PERMISSIONS.PLATFORM_ADMIN');
    expect(source).toContain('? authorizePlatformPermission(permission)');
  });

  it('keeps all other permission-only checks on tenant middleware', () => {
    expect(source).toContain(': authorizePermission(permission);');
    expect(source).not.toMatch(/localStorage|sessionStorage|req\.body|req\.query|x-tenant|x-school|x-branch/i);
  });
});
