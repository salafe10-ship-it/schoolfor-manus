import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/202608311500_student_document_private_storage.sql'), 'utf8');
const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
const service = readFileSync(resolve(process.cwd(), 'src/modules/student-documents/application/StudentDocumentService.ts'), 'utf8');

describe('STU-AFFAIRS-STORAGE-001 private storage contract', () => {
  it('creates a non-public bounded bucket without client storage object policies', () => {
    expect(migration).toContain("'student-documents-private'");
    expect(migration).toContain('public = false');
    expect(migration).toContain('10485760');
    expect(migration).toContain("ARRAY['application/pdf', 'image/png', 'image/jpeg']");
    expect(migration).toContain('No policies are created on storage.objects');
    expect(migration).not.toMatch(/^\s*ON\s+storage\.objects/gim);
  });

  it('forces tenant, school, and branch RLS on the immutable storage registry', () => {
    expect(migration).toContain('ALTER TABLE public.student_document_storage_objects FORCE ROW LEVEL SECURITY');
    expect(migration).toContain('tenant_id = public.dbsec004_current_tenant_id()');
    expect(migration).toContain('school_id = public.dbsec004_current_school_id()');
    expect(migration).toContain('branch_id = public.dbsec004_current_branch_id()');
    expect(migration).toContain('REVOKE UPDATE, DELETE, TRUNCATE');
    expect(migration).toContain('FROM authenticated, edupro_app');
  });

  it('validates magic bytes, computes hashes server-side, and issues five-minute signed links', () => {
    expect(server).toContain("body.subarray(0, 5).toString('ascii') === '%PDF-'");
    expect(server).toContain("createHash('sha256').update(body).digest('hex')");
    expect(server).toContain('createSignedUrl(');
    expect(server).toContain('300,');
    expect(service).toContain('getCurrentStorageObject(context, documentId)');
    expect(service).toContain("this.recordAccess(context, actorUserId, document, 'download'");
  });
});
