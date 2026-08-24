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
  if (required('PROVISIONING_ACTIVATION_CONFIRM') !== 'PROVISION_SCHOOL_OWNER') {
    throw new Error('Explicit school owner provisioning activation confirmation is required.');
  }
  const authUserId = required('PROVISIONING_AUTH_USER_ID');
  const tenantId = required('PROVISIONING_TENANT_ID');
  const schoolId = required('PROVISIONING_SCHOOL_ID');
  const displayName = required('PROVISIONING_DISPLAY_NAME');
  const branchId = String(process.env.PROVISIONING_BRANCH_ID || '').trim() || undefined;
  const actorUserId = required('PROVISIONING_ACTOR_USER_ID');
  EnterpriseLogger.info('ERP school owner activation started', 'ProvisioningActivation', {
    operation: 'provision_school_owner', actor_present: 'YES', target_present: 'YES', tenant_present: 'YES', school_present: 'YES', branch_present: branchId ? 'YES' : 'NO', correlationId
  });
  const transactionDriver = createPostgresTransactionDriverFromEnvironment();
  if (!transactionDriver) throw new Error('PostgreSQL transaction driver is not configured.');
  UnitOfWork.configureTransactionDriver(transactionDriver);
  try {
    const result = await ErpProvisioningService.provisionSchoolOwnerIdentity({ authUserId, tenantId, schoolId, branchId, displayName, actorUserId });
    EnterpriseLogger.info('ERP school owner activation committed', 'ProvisioningActivation', {
      operation: 'provision_school_owner', success: true, permission_count: result.permissionCount, role_assignment_present: 'YES', correlationId
    });
  } finally {
    await transactionDriver.close();
    UnitOfWork.configureTransactionDriver(null);
  }
}

main().catch(error => {
  EnterpriseLogger.error('ERP school owner activation failed; transaction rolled back', 'ProvisioningActivation', {
    operation: 'provision_school_owner', success: false, outcome: 'rollback', correlationId, error: error instanceof Error ? error.message : 'unknown'
  });
  process.exitCode = 1;
});
