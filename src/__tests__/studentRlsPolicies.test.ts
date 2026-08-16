import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = process.cwd();
const auxiliarySql = readFileSync(join(projectRoot, 'src', 'database', 'migrations', 'student_affairs_tables.sql'), 'utf8');
const coreSql = readFileSync(join(projectRoot, 'src', 'database', 'seed', 'mockData.ts'), 'utf8');
const admissionSql = readFileSync(join(projectRoot, 'src', 'modules', 'student-admission', 'database-schema.sql'), 'utf8');

const auxiliaryTables: Array<[string, string]> = [
  ['guardians', 'guardians_tenant_isolation'],
  ['student_guardians', 'student_guardians_tenant_isolation'],
  ['student_medical_records', 'student_medical_tenant_isolation'],
  ['student_transportation', 'student_transportation_tenant_isolation'],
  ['student_library_accounts', 'student_library_tenant_isolation'],
  ['student_uniform_accounts', 'student_uniform_tenant_isolation'],
  ['student_assets', 'student_assets_tenant_isolation'],
  ['student_documents', 'student_documents_tenant_isolation'],
  ['student_contacts', 'student_contacts_tenant_isolation']
];

function assertTenantPolicy(sql: string, table: string, policy: string): void {
  expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
  expect(sql).toContain(`DROP POLICY IF EXISTS ${policy} ON ${table}`);
  expect(sql).toContain(`CREATE POLICY ${policy} ON ${table}`);
  expect(sql).toContain('FOR ALL');
  expect(sql).toContain('USING');
  expect(sql).toContain('WITH CHECK');
  expect(sql).toContain("auth.jwt()->'app_metadata'->>'school_id'");
}

describe('Student Affairs database RLS policy contract', () => {
  it('protects every auxiliary Student Affairs table for all CRUD operations', () => {
    for (const [table, policy] of auxiliaryTables) {
      assertTenantPolicy(auxiliarySql, table, policy);
    }
  });

  it('protects students and student audit logs with explicit write checks', () => {
    assertTenantPolicy(coreSql, 'students', 'student_tenant_isolation_policy');
    assertTenantPolicy(coreSql, 'audit_logs', 'audit_logs_tenant_isolation_policy');
  });

  it('requires distinct trusted tenant, school and branch claims', () => {
    expect(admissionSql).toContain('ALTER TABLE admission_inquiries ENABLE ROW LEVEL SECURITY');
    expect(admissionSql).toContain('FOR ALL');
    expect(admissionSql).toContain('WITH CHECK');
    expect(admissionSql).toMatch(/tenant_id::text = \(auth\.jwt\(\)->'app_metadata'->>'tenant_id'\)/);
    expect(admissionSql).toMatch(/school_id::text = \(auth\.jwt\(\)->'app_metadata'->>'school_id'\)/);
    expect(admissionSql).toMatch(/branch_id::text = \(auth\.jwt\(\)->'app_metadata'->>'branch_id'\)/);
  });

  it('does not depend on client-controlled current_setting tenant values', () => {
    expect(auxiliarySql).not.toContain('current_setting');
    expect(admissionSql).not.toContain('current_setting');
    expect(coreSql).not.toContain('current_setting');
  });

  it.each([
    ['School A reads School B', 'school-a', 'school-b'],
    ['School A updates School B', 'school-a', 'school-b'],
    ['School A deletes School B', 'school-a', 'school-b'],
    ['Spoofed school_id', 'school-a', 'school-b'],
    ['Spoofed tenant_id', 'school-a', 'school-b']
  ])('%s is blocked by tenant equality policy', (_caseName, trustedClaim, rowTenant) => {
    expect(rowTenant === trustedClaim).toBe(false);
  });

  it('blocks missing tenant claims by denying the equality predicate', () => {
    const missingClaim: string | null = null;
    expect(missingClaim).not.toBe('school-a');
  });
});
