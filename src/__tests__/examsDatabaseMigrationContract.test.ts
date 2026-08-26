import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('versioned exams database contract', () => {
  const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
  const migration = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/202608251200_exams_database.sql'),
    'utf8'
  );
  const archiveMigration = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/202608251700_exams_result_archives.sql'),
    'utf8'
  );

  it('creates a tenant-scoped versioned snapshot with RLS', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.exams_database');
    expect(migration).toContain('version bigint NOT NULL DEFAULT 0');
    expect(migration).toContain('ALTER TABLE public.exams_database ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain("tenant_id::text = current_setting('app.tenant_id', true)");
    expect(migration).toContain("school_id::text = current_setting('app.school_id', true)");
  });

  it('locks the snapshot, detects stale versions and audits in the same transaction', () => {
    expect(server).toContain('SELECT data, version FROM public.exams_database');
    expect(server).toContain('FOR UPDATE');
    expect(server).toContain('actualVersion !== expectedVersion');
    expect(server).toContain('INSERT INTO public.audit_events');
    expect(server).toContain('auth_user_id = $2');
  });

  it('creates append-only result archives signed by the server', () => {
    expect(archiveMigration).toContain('CREATE TABLE IF NOT EXISTS public.exams_result_archives');
    expect(archiveMigration).toContain('ALTER TABLE public.exams_result_archives ENABLE ROW LEVEL SECURITY');
    expect(archiveMigration).toContain('REVOKE ALL ON TABLE public.exams_result_archives FROM anon, authenticated');
    expect(archiveMigration).toContain('GRANT SELECT, INSERT ON TABLE public.exams_result_archives TO authenticated');
    expect(server).toContain("createHash('sha256')");
    expect(server).toContain('INSERT INTO public.exams_result_archives');
    expect(server).toContain('isImmutableArchive: true');
  });

  it('requires explicit privileged transitions, reasons, and server schedule validation', () => {
    expect(server).toContain("operationReason.length < 5");
    expect(server).toContain("operation === 'approve_schedule'");
    expect(server).toContain('validateScheduleForApproval(payload as Record<string, any>)');
    expect(server).toContain('تغيير حالة اعتماد النتائج أو الجدول يتطلب عملية اعتماد أو إعادة فتح صريحة');
  });
});
