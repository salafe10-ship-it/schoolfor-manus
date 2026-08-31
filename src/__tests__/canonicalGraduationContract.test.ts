import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/202608311600_canonical_student_graduation.sql'), 'utf8');
const service = readFileSync(resolve(process.cwd(), 'src/modules/student-affairs/application/CanonicalGraduationService.ts'), 'utf8');
const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');

describe('STU-GRAD-001 canonical graduation contract', () => {
  it('stores immutable school-isolated graduation evidence', () => {
    expect(migration).toContain('CREATE TABLE public.student_graduation_records');
    expect(migration).toContain('FORCE ROW LEVEL SECURITY');
    expect(migration).toContain('tenant_id = public.dbsec004_current_tenant_id()');
    expect(migration).toContain('school_id = public.dbsec004_current_school_id()');
    expect(migration).toContain('branch_id = public.dbsec004_current_branch_id()');
    expect(migration).toContain('REVOKE UPDATE, DELETE, TRUNCATE');
    expect(migration).toContain('FROM authenticated, edupro_app');
    expect(migration).toContain("from_status = 'active' AND to_status = 'graduated'");
  });

  it('requires a passed locked result, active enrollment/status, and zero outstanding balance', () => {
    expect(service).toContain("e.enrollment_status = 'active'");
    expect(service).toContain("AND status = 'active' AND deleted_at IS NULL");
    expect(service).toContain("result.item->>'status' = 'passed'");
    expect(service).toContain("a.payload->'approvalStatus'->>'approved'");
    expect(service).toContain('remaining_amount > 0');
    expect(service).toContain('المخالصة المالية');
  });

  it('atomically completes enrollment and records both academic histories', () => {
    expect(service).toContain("SET enrollment_status = 'completed'");
    expect(service).toContain("SET status = 'graduated'");
    expect(service).toContain('INSERT INTO public.student_status_history');
    expect(service).toContain('INSERT INTO public.enrollment_history');
    expect(service).toContain("'Student.Graduated'");
    expect(server).toContain('canonicalGraduationService.execute');
    expect(server).not.toContain('GRADUATION_NOT_READY');
  });
});
