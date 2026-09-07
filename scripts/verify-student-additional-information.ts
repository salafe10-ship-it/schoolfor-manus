import dotenv from 'dotenv';
dotenv.config();

import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

const columns = [
  'academic_writing_level', 'academic_reading_level', 'academic_spelling_level',
  'academic_average', 'academic_previous_school', 'academic_previous_grade',
  'health_chronic_diseases', 'health_medications', 'health_allergies', 'health_notes',
  'social_living_with', 'social_birth_order', 'social_family_view', 'social_outside_traits'
];

async function main(): Promise<void> {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL is required.');
  const pool = new Pool({ connectionString, max: 1, ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false } });
  const client = await pool.connect();
  const studentId = randomUUID();
  const auditId = randomUUID();
  try {
    await client.query('BEGIN');
    const school = await client.query<{ tenant_id: string; id: string }>(
      'SELECT tenant_id, id FROM public.schools WHERE id = $1 LIMIT 1',
      ['92e4d8c8-7cd5-42d8-b850-dfcf12c2da37']
    );
    if (!school.rows[0]) throw new Error('Central school was not found.');
    const { tenant_id: tenantId, id: schoolId } = school.rows[0];
    await client.query(
      `INSERT INTO public.audit_events (id, tenant_id, school_id, entity_type, entity_id, action, source, result, metadata)
       VALUES ($1, $2, $3, 'student', $4, 'CREATE', 'student-affairs-smoke-test', 'success', '{}'::jsonb)`,
      [auditId, tenantId, schoolId, studentId]
    );
    await client.query(
      `INSERT INTO public.students (
         id, tenant_id, school_id, student_number, legal_first_name, legal_last_name, date_of_birth,
         status, version, audit_id,
         academic_writing_level, academic_reading_level, academic_spelling_level, academic_average,
         academic_previous_school, academic_previous_grade,
         health_chronic_diseases, health_medications, health_allergies, health_notes,
         social_living_with, social_birth_order, social_family_view, social_outside_traits
       ) VALUES ($1, $2, $3, $4, 'Smoke', 'Student', DATE '2010-01-01', 'applicant', 1, $5,
                 'ممتاز', 'جيد', 'متوسط', '85%', 'مدرسة تحقق', 'الصف السادس',
                 'لا يوجد', 'لا يوجد', 'الفول السوداني', 'تنبيه تجريبي',
                 'الأم والأب', '2 من 4', 'نعم', 'هادئ، مشارك')`,
      [studentId, tenantId, schoolId, `SMOKE-${studentId.slice(0, 8).toUpperCase()}`, auditId]
    );
    const result = await client.query<Record<string, string>>(
      `SELECT ${columns.join(', ')} FROM public.students WHERE id = $1 AND tenant_id = $2 AND school_id = $3`,
      [studentId, tenantId, schoolId]
    );
    if (result.rowCount !== 1 || result.rows[0].academic_writing_level !== 'ممتاز' || result.rows[0].academic_average !== '85%' || result.rows[0].social_outside_traits !== 'هادئ، مشارك') {
      throw new Error('Additional information round-trip verification failed.');
    }
    console.log(`Student additional information round-trip verified (${columns.length} fields); transaction rolled back.`);
    await client.query('ROLLBACK');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('Student additional information verification failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
