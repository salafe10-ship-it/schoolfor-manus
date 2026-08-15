import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { UnitOfWork } from '../UnitOfWork';
import type { TransactionSession } from '../transactions/TransactionContracts';
import { 
  schoolsSeed, 
  branchesSeed, 
  teachersSeed, 
  employeesSeed, 
  inventorySeed, 
  busRoutesSeed, 
  auditLogsSeed, 
  initialAttendance 
} from './mockData';

export class DatabaseSeeder {
  private static async countRows(transaction: TransactionSession, table: string): Promise<number> {
    const result = await transaction.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM "${table}"`
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  private static async insertOrThrow(transaction: TransactionSession, table: string, rows: unknown[]): Promise<void> {
    if (rows.length === 0) return;
    await transaction.query(
      `INSERT INTO "${table}" SELECT * FROM jsonb_populate_recordset(NULL::"${table}", $1::jsonb)`,
      [JSON.stringify(rows)]
    );
  }

  /**
   * Seed tables only inside one request-scoped PostgreSQL transaction.
   */
  public static async seedAll(): Promise<{ seededTables: string[]; success: boolean }> {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
      EnterpriseLogger.warn("⛔ [Database Seeder]: Seeding is strictly forbidden in PRODUCTION environment.", "DatabaseSeeder");
      return { seededTables: [], success: false };
    }

    if (!UnitOfWork.hasTransactionDriver()) {
      EnterpriseLogger.error(
        "⛔ [Database Seeder]: A PostgreSQL transaction driver is required; seeding refused to prevent partial writes.",
        "DatabaseSeeder"
      );
      return { seededTables: [], success: false };
    }

    try {
      return await UnitOfWork.runInTransaction(
        process.env.MIGRATION_SCHOOL_ID || 'system',
        {
          operationName: 'Database seed',
          tenantId: process.env.MIGRATION_TENANT_ID || 'system',
          userId: 'system',
          userName: 'Database seed',
          ipAddress: '127.0.0.1',
          affectedTables: ['schools', 'branches', 'teachers', 'employees', 'inventory', 'buses']
        },
        async () => {
          const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
          if (!transaction) throw new Error('Database seed requires an active PostgreSQL transaction session.');
          const seeded: string[] = [];
          const seedIfEmpty = async (table: string, rows: unknown[]): Promise<void> => {
            if (await this.countRows(transaction, table) === 0) {
              await this.insertOrThrow(transaction, table, rows);
              seeded.push(table);
            }
          };

          await seedIfEmpty('schools', schoolsSeed);
          await seedIfEmpty('branches', branchesSeed);
          await seedIfEmpty('teachers', teachersSeed);
          await seedIfEmpty('employees', employeesSeed);
          await seedIfEmpty('inventory', inventorySeed);
          await seedIfEmpty('buses', busRoutesSeed.map(b => ({
            id: b.id,
            route_number: b.routeNumber,
            driver_name: b.driverName,
            driver_phone: b.driverPhone,
            capacity: b.capacity,
            current_students: b.currentStudents,
            status: b.status,
            start_point: b.startPoint,
            end_point: b.endPoint
          })));

          EnterpriseLogger.info(`🎉 [Database Seeder]: Seeding completed successfully. Seeded tables: ${seeded.join(', ')}`, "DatabaseSeeder");
          return { seededTables: seeded, success: true };
        }
      );

    } catch (err: any) {
      EnterpriseLogger.error("❌ [Database Seeder]: Exception occurred during seed operation:", "DatabaseSeeder", { error: err?.message || err });
      return { seededTables: [], success: false };
    }
  }
}
