import { FallbackStorage } from '../repositories/FallbackStorage';
import { StudentAffairsMigration } from './student_affairs_tables';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { UnitOfWork } from '../UnitOfWork';
import type { TransactionSession } from '../transactions/TransactionContracts';

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
