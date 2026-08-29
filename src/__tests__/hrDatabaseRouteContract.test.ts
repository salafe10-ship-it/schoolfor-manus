import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');

describe('HR canonical database route contract', () => {
  it('uses trusted scope, optimistic versioning, and an audit event', () => {
    expect(source).toContain("app.get('/api/hr/database', authenticateRequest, requirePermission(PERMISSIONS.HR_READ)");
    expect(source).toContain("app.post('/api/hr/database', authenticateRequest, requirePermission(PERMISSIONS.HR_WRITE)");
    expect(source).toContain('SELECT data,version FROM public.hr_database WHERE tenant_id=$1 AND school_id=$2 FOR UPDATE');
    expect(source).toContain('ON CONFLICT (school_id) DO UPDATE');
    expect(source).toContain("'hr_database', $2, 'write', 'HrDatabaseRoute'");
    expect(source).toContain('رمز الدولة اختياري ومحايد');
    expect(source).toContain('validateHrSnapshotData');
    expect(source).toContain('previousSnapshotHash');
  });

  it('audits reports against the canonical snapshot before export or print', () => {
    expect(source).toContain("app.post('/api/hr/reports/audit'");
    expect(source).toContain("source: 'canonical-postgres'");
    expect(source).toContain("entity_type, entity_id, action, source, reason, result, metadata");
  });

  it('keeps contract signing and advance payment on trusted server transactions', () => {
    expect(source).toContain("app.post('/api/hr/contracts/:contractId/sign'");
    expect(source).toContain('signatureHash');
    expect(source).toContain("app.post('/api/hr/advances/:advanceId/pay'");
    expect(source).toContain('hr-advance-${advanceId}');
  });

  it('keeps HR audit entity identifiers compatible with the canonical UUID column', () => {
    expect(source).toContain("actor.rows[0].id, schoolId, `export_${format}`");
    expect(source).toContain('actorId, schoolId, JSON.stringify({ contractId, version, signedAt, signatureHash })');
    expect(source).toContain('actorId, schoolId, JSON.stringify({ advanceId, amount, journalId })');
    expect(source).toContain('actorId, schoolId, JSON.stringify({ runId: `payroll-${period}`, period, totals })');
    expect(source).toContain('actorId, schoolId, JSON.stringify({ runId: `payroll-${period}`, period, journalId, totals })');
  });

  it('configures school-owned HR accounting mappings without posting a journal', () => {
    expect(source).toContain("app.post('/api/hr/accounting-mappings', authenticateRequest, requirePermission(PERMISSIONS.FINANCIAL_WRITE)");
    expect(source).toContain("['hr.payroll.expense'");
    expect(source).toContain("['hr.advance.receivable'");
    expect(source).toContain('erp_account_mappings');
    expect(source).toContain('دون إنشاء أي قيد');
  });
});
