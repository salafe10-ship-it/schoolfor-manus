import { randomUUID } from 'node:crypto';
import 'dotenv/config';
import { ErpProvisioningService } from '../src/modules/identity/application/ErpProvisioningService.js';
import { EnterpriseLogger } from '../src/database/services/EnterpriseLogger.js';
import { UnitOfWork } from '../src/database/UnitOfWork.js';
import { createPostgresTransactionDriverFromEnvironment } from '../server/infrastructure/PostgresTransactionDriver.js';

function required(name: string): string {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const correlationId = randomUUID();

async function main(): Promise<void> {
  if (required('PROVISIONING_ACTIVATION_CONFIRM') !== 'BOOTSTRAP_RBAC_CATALOG') {
    throw new Error('Explicit provisioning activation confirmation is required.');
  }
  const tenantId = required('PROVISIONING_TENANT_ID');
  const schoolId = required('PROVISIONING_SCHOOL_ID');
  const actorUserId = required('PROVISIONING_ACTOR_USER_ID');
  EnterpriseLogger.info('ERP provisioning activation started', 'ProvisioningActivation', {
    operation: 'bootstrap_catalog', actor_present: 'YES', tenant_present: 'YES', school_present: 'YES', correlationId
  });
  const transactionDriver = createPostgresTransactionDriverFromEnvironment();
  if (!transactionDriver) throw new Error('PostgreSQL transaction driver is not configured.');
  UnitOfWork.configureTransactionDriver(transactionDriver);
  try {
    const result = await ErpProvisioningService.bootstrapCatalog({ tenantId, schoolId, actorUserId });
    EnterpriseLogger.info('ERP provisioning activation committed', 'ProvisioningActivation', {
      operation: 'bootstrap_catalog', success: true, role_present: 'YES', permission_count: result.permissionCount, correlationId
    });
  } finally {
    await transactionDriver.close();
    UnitOfWork.configureTransactionDriver(null);
  }
}

main().catch(error => {
  EnterpriseLogger.error('ERP provisioning activation failed; transaction rolled back', 'ProvisioningActivation', {
    operation: 'bootstrap_catalog', success: false, outcome: 'rollback', correlationId, error: error instanceof Error ? error.message : 'unknown'
  });
  process.exitCode = 1;
});
