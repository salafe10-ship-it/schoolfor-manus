import { randomUUID } from 'node:crypto';
import { ErpProvisioningService } from '../src/modules/identity/application/ErpProvisioningService.js';
import { EnterpriseLogger } from '../src/database/services/EnterpriseLogger.js';

function required(name: string): string {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const correlationId = randomUUID();

async function main(): Promise<void> {
  if (required('PROVISIONING_ACTIVATION_CONFIRM') !== 'PROVISION_ADMIN_IDENTITY') {
    throw new Error('Explicit provisioning activation confirmation is required.');
  }
  const authUserId = required('PROVISIONING_AUTH_USER_ID');
  const tenantId = required('PROVISIONING_TENANT_ID');
  const schoolId = required('PROVISIONING_SCHOOL_ID');
  const displayName = required('PROVISIONING_DISPLAY_NAME');
  const branchId = String(process.env.PROVISIONING_BRANCH_ID || '').trim() || undefined;
  const actorUserId = required('PROVISIONING_ACTOR_USER_ID');
  EnterpriseLogger.info('ERP provisioning activation started', 'ProvisioningActivation', {
    operation: 'provision_admin_identity', actor_present: 'YES', target_present: 'YES', tenant_present: 'YES', school_present: 'YES', branch_present: branchId ? 'YES' : 'NO', correlationId
  });
  const result = await ErpProvisioningService.provisionIdentity({ authUserId, tenantId, schoolId, branchId, displayName, actorUserId });
  EnterpriseLogger.info('ERP provisioning activation committed', 'ProvisioningActivation', {
    operation: 'provision_admin_identity', success: true, permission_count: result.permissionCount, role_assignment_present: 'YES', correlationId
  });
}

main().catch(error => {
  EnterpriseLogger.error('ERP provisioning activation failed; transaction rolled back', 'ProvisioningActivation', {
    operation: 'provision_admin_identity', success: false, outcome: 'rollback', correlationId, error: error instanceof Error ? error.message : 'unknown'
  });
  process.exitCode = 1;
});
