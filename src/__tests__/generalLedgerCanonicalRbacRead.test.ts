import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('general ledger canonical RBAC read contract', () => {
  it('uses only the trusted session identity for drill-down authorization', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/components/GeneralLedgerPortal.tsx'), 'utf8');
    expect(file).toContain('trustedSessionUser');
    expect(file).toContain('currentUserIdentity: drillDownUser');
    expect(file).not.toContain("erp_roles_list_v1");
    expect(file).not.toContain("erp_users_list_v1");
    expect(file).not.toContain("erp_permissions_audit_log_v1");
    expect(file).not.toContain('const [localDrillDownUser');
  });
});
