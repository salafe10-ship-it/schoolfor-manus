import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { UnitOfWork } from '../UnitOfWork';
import type { TransactionSession } from '../transactions/TransactionContracts';

export class StudentAffairsMigration {
  /**
   * Migrate student affairs auxiliary tables data from FallbackStorage to Supabase
   */
  public static async migrateAll(): Promise<{ success: boolean; migratedCounts: Record<string, number> }> {
    const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
    if (!transaction) throw new Error('Student Affairs migration requires the parent PostgreSQL transaction.');

    const migratedCounts: Record<string, number> = {};

    const countRows = async (table: string): Promise<number> => {
      const result = await transaction.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM "${table}"`
      );
      return Number(result.rows[0]?.count ?? 0);
    };

    const insertIfEmpty = async (table: string, rows: unknown[]): Promise<void> => {
      if (rows.length === 0 || await countRows(table) !== 0) return;
      await transaction.query(
        `INSERT INTO "${table}" SELECT * FROM jsonb_populate_recordset(NULL::"${table}", $1::jsonb)`,
        [JSON.stringify(rows)]
      );
      migratedCounts[table] = rows.length;
    };

    try {
      EnterpriseLogger.info("🚀 [Student Affairs Migration]: Checking and migrating auxiliary tables to live Supabase...", "StudentAffairsMigration");

      // Guardian and student_guardians migration is permanently blocked here.
      // Legacy FallbackStorage data must never become a production Guardian write;
      // canonical registration/update workflows are the only approved writers.
      const legacyGuardianRecords = FallbackStorage.getGuardians().length + FallbackStorage.getStudentGuardians().length;
      if (legacyGuardianRecords > 0) {
        EnterpriseLogger.warn(
          "⛔ [Student Affairs Migration]: Guardian migration is blocked; use the canonical Guardian workflow.",
          "StudentAffairsMigration",
          { reason: "LEGACY_GUARDIAN_WRITER_BLOCKED", recordsDetected: legacyGuardianRecords }
        );
        throw new Error('Legacy Guardian migration is blocked; canonical Guardian workflows are required.');
      }

      // 3. student_medical_records
      const localMed = FallbackStorage.getStudentMedicalRecords();
      await insertIfEmpty('student_medical_records', localMed);

      // 4. student_transportation
      const localTrans = FallbackStorage.getStudentTransportation();
      await insertIfEmpty('student_transportation', localTrans);

      // 5. student_library_accounts
      const localLib = FallbackStorage.getStudentLibraryAccounts();
      await insertIfEmpty('student_library_accounts', localLib);

      // 6. student_uniform_accounts
      const localUniAcc = FallbackStorage.getStudentUniformAccounts();
      await insertIfEmpty('student_uniform_accounts', localUniAcc);

      // 7. student_assets
      const localAssets = FallbackStorage.getStudentAssets();
      await insertIfEmpty('student_assets', localAssets);

      // 8. student_documents
      const localDocs = FallbackStorage.getStudentDocuments();
      await insertIfEmpty('student_documents', localDocs);

      // 9. student_contacts
      const localContacts = FallbackStorage.getStudentContacts();
      await insertIfEmpty('student_contacts', localContacts);

    } catch (err: any) {
      EnterpriseLogger.error("❌ [Student Affairs Migration]: Exception during migration:", "StudentAffairsMigration", { error: err?.message || err });
      throw err;
    }

    return { success: true, migratedCounts };
  }
}
