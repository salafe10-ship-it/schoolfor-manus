import { randomUUID } from 'node:crypto';
import 'dotenv/config';
import { ErpProvisioningService } from '../src/modules/identity/application/ErpProvisioningService.js';
import { SupabaseAdminAuthTargetResolver } from '../src/modules/identity/application/TrustedAuthTargetResolver.js';
import { EnterpriseLogger } from '../src/database/services/EnterpriseLogger.js';
import { UnitOfWork } from '../src/database/UnitOfWork.js';
import { createPostgresTransactionDriverFromEnvironment } from '../server/infrastructure/PostgresTransactionDriver.js';

const correlationId = randomUUID();

async function main(): Promise<void> {
  if (String(process.env.PROVISIONING_ACTIVATION_CONFIRM || '').trim() !== 'PROVISION_PLATFORM_ADMIN') {
    throw new Error('Explicit platform provisioning activation confirmation is required.');
  }
  const targetAuthUserId = String(process.env.TARGET_AUTH_USER_ID || '').trim();
  if (!targetAuthUserId) throw new Error('TARGET_AUTH_USER_ID is required.');

  EnterpriseLogger.info('Platform provisioning activation started', 'ProvisioningActivation', {
    operation: 'FIRST_PLATFORM_ADMIN_BOOTSTRAP', bootstrap_mode: 'first', actor_source: 'deployment_operator',
    target_present: 'YES', correlationId
  });
  const verified = await new SupabaseAdminAuthTargetResolver().verifyTargetAuthUser(targetAuthUserId);
  if (!verified) throw new Error('Target Auth user could not be verified.');
  const transactionDriver = createPostgresTransactionDriverFromEnvironment();
  if (!transactionDriver) throw new Error('PostgreSQL transaction driver is not configured.');
  UnitOfWork.configureTransactionDriver(transactionDriver);
  try {
    await ErpProvisioningService.provisionPlatformIdentity({ authUserId: verified.authUserId });
    EnterpriseLogger.info('Platform provisioning activation committed', 'ProvisioningActivation', {
      operation: 'FIRST_PLATFORM_ADMIN_BOOTSTRAP', success: true, outcome: 'commit', correlationId
    });
  } finally {
    await transactionDriver.close();
    UnitOfWork.configureTransactionDriver(null);
  }
}

main().catch(error => {
  EnterpriseLogger.error('Platform provisioning activation failed', 'ProvisioningActivation', {
    operation: 'FIRST_PLATFORM_ADMIN_BOOTSTRAP', success: false, outcome: 'rollback', correlationId,
    error: error instanceof Error ? error.message : 'unknown'
  });
  process.exitCode = 1;
});
