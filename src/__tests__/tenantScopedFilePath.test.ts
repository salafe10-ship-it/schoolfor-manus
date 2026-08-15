import { describe, expect, it } from 'vitest';
import { tenantScopedDatabaseFilePath } from '../security/tenantScopedFilePath';

describe('tenant-scoped fallback persistence paths', () => {
  it('creates a distinct file for each trusted school', () => {
    expect(tenantScopedDatabaseFilePath('src/db', 'financial_portal_database', 'school_a'))
      .toContain('financial_portal_database_school_a.json');
    expect(tenantScopedDatabaseFilePath('src/db', 'financial_portal_database', 'school_b'))
      .toContain('financial_portal_database_school_b.json');
  });

  it('rejects path traversal and unsafe tenant keys', () => {
    expect(() => tenantScopedDatabaseFilePath('src/db', 'financial_portal_database', '../school_a'))
      .toThrow('Invalid tenant-scoped database file path.');
    expect(() => tenantScopedDatabaseFilePath('src/db', 'financial_portal_database', 'school/a'))
      .toThrow('Invalid tenant-scoped database file path.');
  });
});
