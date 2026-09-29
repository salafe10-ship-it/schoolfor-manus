import { FallbackStorage } from '../repositories/FallbackStorage';
import { StudentAffairsMigration } from './student_affairs_tables';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { UnitOfWork } from '../UnitOfWork';
import type { TransactionSession } from '../transactions/TransactionContracts';

const ACADEMIC_CANONICAL_SCHEMA = `
CREATE TABLE IF NOT EXISTS academic_stages (id TEXT PRIMARY KEY, tenant_id UUID NOT NULL, school_id UUID NOT NULL, code VARCHAR(50) NOT NULL, name VARCHAR(120) NOT NULL, sort_order INTEGER NOT NULL DEFAULT 1, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (school_id, code));
CREATE TABLE IF NOT EXISTS academic_grades (id TEXT PRIMARY KEY, tenant_id UUID NOT NULL, school_id UUID NOT NULL, stage_id TEXT NOT NULL REFERENCES academic_stages(id), code VARCHAR(50) NOT NULL, name VARCHAR(120) NOT NULL, sort_order INTEGER NOT NULL DEFAULT 1, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (school_id, code));
CREATE TABLE IF NOT EXISTS academic_classes (id TEXT PRIMARY KEY, tenant_id UUID NOT NULL, school_id UUID NOT NULL, grade_id TEXT NOT NULL REFERENCES academic_grades(id), code VARCHAR(50) NOT NULL, name VARCHAR(120) NOT NULL, capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 500), is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (school_id, code));
CREATE TABLE IF NOT EXISTS academic_subjects (id TEXT PRIMARY KEY, tenant_id UUID NOT NULL, school_id UUID NOT NULL, academic_year_id UUID REFERENCES academic_years(id), grade_id TEXT REFERENCES academic_grades(id), code VARCHAR(50) NOT NULL, name VARCHAR(255) NOT NULL, credit_hours NUMERIC(5,2) NOT NULL DEFAULT 0, weekly_periods INTEGER NOT NULL DEFAULT 0 CHECK (weekly_periods BETWEEN 0 AND 60), passing_score NUMERIC(5,2) NOT NULL DEFAULT 50, max_score NUMERIC(5,2) NOT NULL DEFAULT 100, assigned_teacher_id UUID, is_elective BOOLEAN NOT NULL DEFAULT FALSE, status VARCHAR(20) NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (school_id, academic_year_id, code), UNIQUE (school_id, academic_year_id, grade_id, name));
CREATE TABLE IF NOT EXISTS academic_timetable_entries (id TEXT PRIMARY KEY, tenant_id UUID NOT NULL, school_id UUID NOT NULL, academic_year_id UUID NOT NULL REFERENCES academic_years(id), class_id TEXT NOT NULL REFERENCES academic_classes(id), subject_id TEXT NOT NULL REFERENCES academic_subjects(id), teacher_id UUID NOT NULL, day_of_week VARCHAR(20) NOT NULL, period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 20), room_name VARCHAR(120), status VARCHAR(20) NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (school_id, academic_year_id, class_id, day_of_week, period_number));
CREATE INDEX IF NOT EXISTS idx_academic_grades_school ON academic_grades(school_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_academic_classes_school ON academic_classes(school_id, grade_id);
CREATE INDEX IF NOT EXISTS idx_academic_subjects_school_year ON academic_subjects(school_id, academic_year_id, grade_id);
CREATE INDEX IF NOT EXISTS idx_academic_timetable_school_year ON academic_timetable_entries(school_id, academic_year_id, day_of_week, period_number);
`;

export class DatabaseMigration {
  private static async countRows(transaction: TransactionSession, table: string): Promise<number> {
    const result = await transaction.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM "${table}"`
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  private static async insertRows(transaction: TransactionSession, table: string, rows: unknown[]): Promise<void> {
    if (rows.length === 0) return;
    await transaction.query(
      `INSERT INTO "${table}" SELECT * FROM jsonb_populate_recordset(NULL::"${table}", $1::jsonb)`,
      [JSON.stringify(rows)]
    );
  }

  /**
   * Run the fallback-to-PostgreSQL transfer inside one request-scoped transaction.
   * The engine fails closed when a real PostgreSQL transaction driver is unavailable.
   */
  public static async migrateAll(): Promise<{ migratedStudents: number; migratedExams: boolean; success: boolean }> {
    if (!UnitOfWork.hasTransactionDriver()) {
      EnterpriseLogger.error(
        "⛔ [Migration Engine]: A PostgreSQL transaction driver is required; migration refused to prevent partial writes.",
        "DatabaseMigration"
      );
      return { migratedStudents: 0, migratedExams: false, success: false };
    }

    try {
      return await UnitOfWork.runInTransaction(
        process.env.MIGRATION_SCHOOL_ID || 'system',
        {
          operationName: 'Database migration',
          tenantId: process.env.MIGRATION_TENANT_ID || 'system',
          userId: 'system',
          userName: 'Database migration',
          ipAddress: '127.0.0.1',
          affectedTables: [
            'students', 'exams_database', 'student_medical_records',
            'student_transportation', 'student_library_accounts',
            'student_uniform_accounts', 'student_assets', 'student_documents',
            'student_contacts'
          ]
        },
        async () => {
          const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
          if (!transaction) throw new Error('Database migration requires an active PostgreSQL transaction session.');

          // Establish the canonical academic write model before migrating feature data.
          // The IF NOT EXISTS form keeps this safe for existing installations.
          await transaction.query(ACADEMIC_CANONICAL_SCHEMA);

          let migratedStudents = 0;
          let migratedExams = false;
          const localStudents = FallbackStorage.getStudents();
          if (localStudents.length > 0 && await this.countRows(transaction, 'students') === 0) {
            await this.insertRows(transaction, 'students', localStudents);
            migratedStudents = localStudents.length;
          }

          const localExams = FallbackStorage.getExams();
          if (localExams && Object.keys(localExams).length > 0 && await this.countRows(transaction, 'exams_database') === 0) {
            await this.insertRows(transaction, 'exams_database', [{ school_id: 'school_1', data: localExams }]);
            migratedExams = true;
          }

          const studentAffairsResult = await StudentAffairsMigration.migrateAll();
          if (!studentAffairsResult.success) {
            throw new Error('Student Affairs migration did not complete; transaction will be rolled back.');
          }

          return { migratedStudents, migratedExams, success: true };
        }
      );

    } catch (err: any) {
      EnterpriseLogger.error("❌ [Migration Engine]: Exception occurred during database migration:", "DatabaseMigration", { error: err?.message || err });
      return { migratedStudents: 0, migratedExams: false, success: false };
    }
  }
}
