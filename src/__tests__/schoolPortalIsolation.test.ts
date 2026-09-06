import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('school portal isolation', () => {
  it('does not expose a central-admin switch inside the school login form', () => {
    const source = read('src/components/SchoolClientLogin.tsx');
    expect(source).not.toContain('onSwitchToSuperAdminLogin');
    expect(source).not.toContain('الإدارة المركزية');
  });

  it('keeps a school URL in client mode even for a platform-capable identity', () => {
    const source = read('src/App.tsx');
    expect(source).toContain('const schoolPortalContext = useMemo');
    expect(source).toContain('currentPortal === \'school\' || Boolean(schoolPortalContext)');
    expect(source).toContain('setCurrentPortal(schoolPortalContext ? \'school\'');
  });

  it('binds login credentials to the requested school on the server', () => {
    const source = read('server.ts');
    expect(source).toContain('const { identifier: requestedIdentifier, email, username, password, schoolContext }');
    expect(source).toContain('authenticateTrustedUser(supabase, identifier, password, expectedSchoolId)');
  });
});
