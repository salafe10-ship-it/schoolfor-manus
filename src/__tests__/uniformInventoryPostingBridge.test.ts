import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const server = fs.readFileSync('server.ts', 'utf8');
const uniformRoutes = server.slice(server.indexOf("app.get('/api/uniform/items'"), server.indexOf("app.get('/api/library/books'"));
const posting = fs.readFileSync('src/modules/financial/application/CanonicalErpPostingService.ts', 'utf8');

describe('uniform inventory accounting bridge', () => {
  it('routes opening stock, stock movements, and sales through inventory procurement posting', () => {
    expect(uniformRoutes).toContain('syncInventoryProcurementSnapshot(transaction, tenantId, schoolId, actorId');
    expect(uniformRoutes).toContain('uniform-opening:${variantId}');
    expect(uniformRoutes).toContain('inventorySales: [{ id: sourceId');
  });

  it('supports inventory sales as a canonical inventory posting source', () => {
    expect(posting).toContain('const addInventorySale = (raw: unknown)');
    expect(posting).toContain('payload.inventorySales');
    expect(posting).toContain("sourceType: 'inventory_movement'");
  });
});
