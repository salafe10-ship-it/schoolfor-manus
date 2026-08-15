import dotenv from 'dotenv';
dotenv.config();

import { DatabaseMigration } from '../migrations/init.js';
import { EnterpriseLogger } from '../services/EnterpriseLogger.js';
import { UnitOfWork } from '../UnitOfWork.js';
import { createPostgresTransactionDriverFromEnvironment } from '../../../server/infrastructure/PostgresTransactionDriver.js';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    EnterpriseLogger.error('Production migration CLI is disabled. Use an explicitly approved release procedure.', 'CLI:db:migrate');
    process.exit(1);
  }

  const transactionDriver = createPostgresTransactionDriverFromEnvironment();
  if (!transactionDriver) {
    EnterpriseLogger.error('PostgreSQL transaction driver is not configured. Migration refused to prevent partial writes.', 'CLI:db:migrate');
    process.exit(1);
  }

  UnitOfWork.configureTransactionDriver(transactionDriver);
  EnterpriseLogger.info("Starting explicit database migration CLI...", "CLI:db:migrate");
  try {
    const result = await DatabaseMigration.migrateAll();
    EnterpriseLogger.info(`Migration finished with result: ${JSON.stringify(result)}`, "CLI:db:migrate");
    process.exitCode = result.success ? 0 : 1;
  } finally {
    await transactionDriver.close();
    UnitOfWork.configureTransactionDriver(null);
  }
}

main().catch(err => {
  console.error("Migration CLI failed:", err);
  process.exit(1);
});
