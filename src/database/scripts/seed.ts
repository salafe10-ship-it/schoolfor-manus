import dotenv from 'dotenv';
dotenv.config();

import { DatabaseSeeder } from '../seed/init.js';
import { EnterpriseLogger } from '../services/EnterpriseLogger.js';
import { UnitOfWork } from '../UnitOfWork.js';
import { createPostgresTransactionDriverFromEnvironment } from '../../../server/infrastructure/PostgresTransactionDriver.js';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    EnterpriseLogger.error('Production seed CLI is disabled. ALLOW_PRODUCTION_SEED cannot override the CLI safety gate.', 'CLI:db:seed');
    process.exit(1);
  }

  const transactionDriver = createPostgresTransactionDriverFromEnvironment();
  if (!transactionDriver) {
    EnterpriseLogger.error('PostgreSQL transaction driver is not configured. Seeding refused to prevent partial writes.', 'CLI:db:seed');
    process.exit(1);
  }

  UnitOfWork.configureTransactionDriver(transactionDriver);
  EnterpriseLogger.info("Starting explicit database seeding CLI...", "CLI:db:seed");
  try {
    const result = await DatabaseSeeder.seedAll();
    EnterpriseLogger.info(`Seeding finished with result: ${JSON.stringify(result)}`, "CLI:db:seed");
    process.exitCode = result.success ? 0 : 1;
  } finally {
    await transactionDriver.close();
    UnitOfWork.configureTransactionDriver(null);
  }
}

main().catch(err => {
  console.error("Seeding CLI failed:", err);
  process.exit(1);
});
