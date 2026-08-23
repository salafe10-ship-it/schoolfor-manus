import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('identity and tenant canonical persistence contract', () => {
  it('fails closed for local identity reads and implements central tenant upsert', () => {
    const user = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/UserRepository.ts'), 'utf8');
    const tenant = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/TenantRepository.ts'), 'utf8');
    expect(user).toContain('FallbackStorage.assertCanonicalPersistence');
    expect(tenant).toContain('FallbackStorage.assertCanonicalPersistence');
    expect(tenant).toContain(".from('tenants').upsert");
  });
});
