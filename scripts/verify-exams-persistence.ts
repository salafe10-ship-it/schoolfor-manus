import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

async function main(): Promise<void> {
  const schoolId = String(process.argv[2] || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(schoolId)) throw new Error('A valid school UUID is required.');
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL is required.');
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
    ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false }
  });
  try {
    const snapshot = await pool.query<{
      version: string;
      academic_year: string | null;
      semester: string | null;
      exam_type: string | null;
      updated_at: Date;
      audit_count: string;
      archive_count: string;
      archive_rls_enabled: boolean;
      archive_mutation_grant_count: string;
      student_count: number;
      subject_count: number;
      hall_count: number;
      schedule_count: number;
      results_approved: boolean;
      schedule_approved: boolean;
    }>(
      `SELECT e.version::text,
              e.data -> 'exams_settings' ->> 'academicYear' AS academic_year,
              e.data -> 'exams_settings' ->> 'semester' AS semester,
              e.data -> 'exams_settings' ->> 'examType' AS exam_type,
              jsonb_array_length(COALESCE(e.data -> 'exams_students_enriched', '[]'::jsonb)) AS student_count,
              jsonb_array_length(COALESCE(e.data -> 'exams_subjects', '[]'::jsonb)) AS subject_count,
              jsonb_array_length(COALESCE(e.data -> 'exams_halls', '[]'::jsonb)) AS hall_count,
              jsonb_array_length(COALESCE(e.data -> 'exams_schedule', '[]'::jsonb)) AS schedule_count,
              COALESCE((e.data -> 'exams_approval_status' ->> 'approved')::boolean, false) AS results_approved,
              COALESCE((e.data -> 'exams_schedule_approval_status' ->> 'approved')::boolean, false) AS schedule_approved,
              e.updated_at,
              (SELECT COUNT(*)::text
                 FROM public.audit_events a
                WHERE a.tenant_id = e.tenant_id
                  AND a.school_id = e.school_id
                  AND a.entity_type = 'exams_database') AS audit_count,
              (SELECT COUNT(*)::text
                 FROM public.exams_result_archives archive
                WHERE archive.tenant_id = e.tenant_id
                  AND archive.school_id = e.school_id) AS archive_count,
              (SELECT relrowsecurity
                 FROM pg_class
                WHERE oid = 'public.exams_result_archives'::regclass) AS archive_rls_enabled,
              (SELECT COUNT(*)::text
                 FROM information_schema.role_table_grants grant_row
                WHERE grant_row.table_schema = 'public'
                  AND grant_row.table_name = 'exams_result_archives'
                  AND grant_row.grantee = 'authenticated'
                  AND grant_row.privilege_type IN ('UPDATE', 'DELETE')) AS archive_mutation_grant_count
         FROM public.exams_database e
        WHERE e.school_id = $1`,
      [schoolId]
    );
    const row = snapshot.rows[0];
    if (!row) throw new Error('No exams snapshot exists for the requested school.');
    console.log(JSON.stringify({
      version: Number(row.version),
      academicYear: row.academic_year,
      semester: row.semester,
      examType: row.exam_type,
      studentCount: row.student_count,
      subjectCount: row.subject_count,
      hallCount: row.hall_count,
      scheduleCount: row.schedule_count,
      resultsApproved: row.results_approved,
      scheduleApproved: row.schedule_approved,
      auditCount: Number(row.audit_count),
      archiveCount: Number(row.archive_count),
      archiveRlsEnabled: row.archive_rls_enabled,
      archiveMutationGrantCount: Number(row.archive_mutation_grant_count),
      persisted: true
    }));
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('Exams persistence verification failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
