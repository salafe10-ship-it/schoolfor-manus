import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string): string => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('LOGIN USERNAME/EMAIL contract', () => {
  it('uses a text identifier field with accessible Username-or-Email semantics', () => {
    const source = read('src/components/SchoolClientLogin.tsx');
    expect(source).toContain("htmlFor='login-identifier'");
    expect(source).toContain("id='login-identifier'");
    expect(source).toContain("name='identifier'");
    expect(source).toContain('type="text"');
    expect(source).toContain("autoComplete='username'");
    expect(source).toContain('اسم المستخدم أو البريد الإلكتروني');
    expect(source).not.toContain("id='login-email'");
  });

  it('sends identifier to the server and keeps recovery identifier-based', () => {
    const appSource = read('src/App.tsx');
    const serverSource = read('server.ts');
    expect(appSource).toContain('body: JSON.stringify({ identifier })');
    expect(serverSource).toContain('const { identifier: requestedIdentifier, email, username, password } = req.body || {};');
    expect(serverSource).toContain('authenticateTrustedUser(supabase, identifier, password)');
    expect(serverSource).toContain('resolveTrustedLoginIdentifier(supabase, identifier)');
    expect(serverSource).toContain('PUBLIC_APP_URL');
    expect(serverSource).toContain('redirectTo');
    expect(serverSource).not.toContain('password_hash');
  });

  it('does not embed the historical test username or password in the Login component', () => {
    const source = read('src/components/SchoolClientLogin.tsx');
    expect(source).not.toContain('schooladmin');
    expect(source).not.toContain('School@2026#Test');
  });

  it('keeps username shape unrestricted while preserving trusted lookup normalization', () => {
    const migration = read('supabase/migrations/202609051000_unrestricted_username_login.sql');
    expect(migration).toContain('DROP CONSTRAINT IF EXISTS ck_users_username_format');
    expect(migration).toContain('lower(btrim(u.username)) = lower(btrim(p_username))');
    expect(migration).not.toContain("username !~");
  });

  it('shows a visible login error when the trusted server rejects credentials', () => {
    const source = read('src/components/SchoolClientLogin.tsx');
    expect(source).toContain('role="alert"');
    expect(source).toContain('authenticated === false');
  });
});
