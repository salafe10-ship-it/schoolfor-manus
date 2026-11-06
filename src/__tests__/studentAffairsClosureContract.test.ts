import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/202610171100_student_enrollment_certificates.sql'), 'utf8');
const certificateService = readFileSync(resolve(process.cwd(), 'src/modules/student-affairs/application/CanonicalEnrollmentCertificateService.ts'), 'utf8');
const documentPortal = readFileSync(resolve(process.cwd(), 'src/modules/student-documents/presentation/StudentDocumentsPortal.tsx'), 'utf8');
const studentPortal = readFileSync(resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'), 'utf8');
const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
const uat = readFileSync(resolve(process.cwd(), 'scripts/uat-student-affairs-staging.ts'), 'utf8');
const stagingSafety = readFileSync(resolve(process.cwd(), 'scripts/stagingDatabaseSafety.ts'), 'utf8');

describe('Student Affairs closure contract', () => {
  it('issues an immutable, school-isolated, signed enrollment certificate', () => {
    expect(migration).toContain('CREATE TABLE public.student_enrollment_certificates');
    expect(migration).toContain('FORCE ROW LEVEL SECURITY');
    expect(migration).toContain('actor.auth_user_id::text = current_setting(\'app.user_id\', true)');
    expect(migration).toContain('REVOKE UPDATE, DELETE, TRUNCATE');
    expect(migration).toContain('FROM authenticated, edupro_app');
    expect(certificateService).toContain('createHmac(\'sha256\', secret)');
    expect(certificateService).toContain("source: 'canonical-postgres'");
    expect(server).toContain('/api/students/:id/certificates/enrollment/issue');
    expect(studentPortal).toContain('/certificates/enrollment/issue');
  });

  it('keeps binary documents private and provides signed preview/download access', () => {
    expect(server).toContain('studentDocumentRawUpload');
    expect(server).toContain('STUDENT_DOCUMENT_BUCKET');
    expect(server).toContain('createSignedUrl');
    expect(documentPortal).toContain('/api/students/${normalized.studentId}/document-content');
    expect(studentPortal).toContain('uploadStudentProfilePhoto');
    expect(studentPortal).toContain('loadStudentPhoto');
  });

  it('requires an isolated staging target and exercises import, transfer, promotion, certificate, and binary storage', () => {
    expect(stagingSafety).toContain('assertIsolatedStagingDatabase');
    expect(stagingSafety).toContain('STAGING_SUPABASE_PROJECT_REF');
    expect(uat).toContain('RUN_STUDENT_AFFAIRS_STAGING_UAT');
    expect(uat).toContain("/api/students/import");
    expect(uat).toContain("/transfer");
    expect(uat).toContain("/promote");
    expect(uat).toContain('/certificates/enrollment/issue');
    expect(uat).toContain('/document-content');
    expect(uat).toContain('current_user');
    expect(uat).toContain('rolbypassrls');
  });
  it('does not query a nonexistent soft-delete column on immutable attendance records in the 360 snapshot', () => {
    const attendanceMigration = readFileSync(resolve(process.cwd(), 'supabase/migrations/202608111200_attend_schema_001.sql'), 'utf8');
    const table = attendanceMigration.split('CREATE TABLE attendance_records (')[1].split('CONSTRAINT pk_attendance_records')[0];
    expect(table).not.toContain('deleted_at');
    const snapshot = server.split('app.get("/api/students/:id/360"')[1].split('return result.rows[0]')[0];
    expect(snapshot).toContain('ar.student_id=s.id');
    expect(snapshot).toContain('ar.tenant_id=s.tenant_id AND ar.school_id=s.school_id');
    expect(snapshot).not.toContain('ar.deleted_at');
  });

});
