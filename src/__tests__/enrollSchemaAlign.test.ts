import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = resolve(process.cwd(), 'supabase/migrations/202608111000_enroll_schema_align_001.sql');
const migration = readFileSync(migrationPath, 'utf8');

describe('ENROLL-SCHEMA-ALIGN-001 migration contract', () => {
  it('adds only the approved active-to-withdrawn ordinary transition', () => {
    expect(migration).toContain('DROP CONSTRAINT IF EXISTS ck_student_status_transitions_allowed');
    expect(migration).toContain("(from_status = 'active' AND to_status = 'withdrawn')");
    expect(migration).toContain("(from_status = 'active' AND to_status = 'suspended')");
    expect(migration).toContain("(from_status = 'suspended' AND to_status = 'withdrawn')");
    expect(migration).not.toContain('CREATE TABLE');
    expect(migration).not.toContain('CREATE FUNCTION');
    expect(migration).not.toContain('CREATE TRIGGER');
    expect(migration).not.toContain('CREATE POLICY');
  });

  it('preserves the existing ordinary transition set', () => {
    const ordinaryTransitions = [
      "(from_status = 'applicant' AND to_status = 'admitted')",
      "(from_status = 'admitted' AND to_status = 'active')",
      "(from_status = 'active' AND to_status = 'suspended')",
      "(from_status = 'active' AND to_status = 'withdrawn')",
      "(from_status = 'suspended' AND to_status = 'withdrawn')",
      "(from_status = 'withdrawn' AND to_status = 'graduated')",
      "(from_status = 'graduated' AND to_status = 'archived')"
    ];

    for (const transition of ordinaryTransitions) expect(migration).toContain(transition);
    expect(migration.match(/from_status = '[a-z]+'/g)?.length).toBe(7);
  });

  it('uses transactional DDL so a failed replacement does not leave a partial constraint', () => {
    expect(migration.slice(migration.indexOf('BEGIN;')).startsWith('BEGIN;')).toBe(true);
    expect(migration.trimEnd().endsWith('COMMIT;')).toBe(true);
  });
});
