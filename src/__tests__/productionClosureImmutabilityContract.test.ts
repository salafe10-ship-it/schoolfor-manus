import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const hardening = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/202608311700_production_closure_immutability.sql'),
  'utf8',
);
const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');

describe('production closure immutability and connection-role gate', () => {
  it('removes inherited mutation rights from both application roles', () => {
    expect(hardening).toContain('FROM authenticated, edupro_app');
    expect(hardening).toContain('public.student_document_storage_objects');
    expect(hardening).toContain('public.student_graduation_records');
    expect(hardening).toContain('GRANT SELECT, INSERT');
    expect(hardening).not.toMatch(/GRANT[^;]*(UPDATE|DELETE|TRUNCATE)/s);
  });

  it('fails readiness unless the deployed tenant pool proves the restricted role', () => {
    expect(server).toContain("const expectedDataPlaneRoles = configuredExpectedRoles.length > 0");
    expect(server).toContain("['edupro_app']");
    expect(server).toContain('identity.session_user === identity.current_user');
    expect(server).toContain('identity.rolsuper === false');
    expect(server).toContain('identity.rolbypassrls === false');
    expect(server).toContain('startupReadiness.markUnsafeDataPlaneRole');
  });
});
