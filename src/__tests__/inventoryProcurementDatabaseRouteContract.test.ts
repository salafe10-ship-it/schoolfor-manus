import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('inventory and procurement canonical database contract', () => {
  const server = readFileSync('server.ts', 'utf8');
  const migration = readFileSync('supabase/migrations/202608291500_inventory_procurement_database.sql', 'utf8');

  it('uses authenticated, permissioned, versioned PostgreSQL routes', () => {
    expect(server).toContain('app.get("/api/inventory/database", authenticateRequest, requirePermission(PERMISSIONS.INVENTORY_READ)');
    expect(server).toContain('app.post("/api/inventory/database", authenticateRequest, requirePermission(PERMISSIONS.INVENTORY_WRITE)');
    expect(server).toContain('SELECT data, version FROM public.inventory_database');
    expect(server).toContain("'inventory_database', $2, 'write', 'InventoryDatabaseRoute'");
    expect(server).toContain("throw new ConflictError('تم تعديل المخزون أو المشتريات بواسطة مستخدم آخر");
    expect(server).toContain('validateInventoryProcurementSnapshot');
    expect(server).toContain('syncInventoryProcurementSnapshot');
    expect(server).toContain("erpIntegration: canonicalErpReady ? 'ready' : 'not_provisioned'");
    expect(server).not.toContain('tenantScopedDatabaseFilePath(dataDir, "inventory_database"');
  });

  it('enforces RLS and trusted actor ownership in the schema', () => {
    expect(migration).toContain('ALTER TABLE public.inventory_database ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain("current_setting('app.tenant_id', true)");
    expect(migration).toContain("current_setting('app.school_id', true)");
    expect(migration).toContain("actor.auth_user_id::text = current_setting('app.user_id', true)");
  });

  it('audits reports before export or print', () => {
    expect(server).toContain("app.post('/api/inventory/reports/audit'");
    expect(server).toContain("'inventory_report', $2, 'export', 'InventoryReportRoute'");
  });
});
