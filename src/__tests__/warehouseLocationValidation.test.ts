import { describe, expect, it } from 'vitest';
import { validateWarehouseLocations } from '../modules/inventory/domain/WarehouseLocationValidation';
import { validateInventoryProcurementSnapshot } from '../modules/inventory/domain/InventoryProcurementValidation';

const emptySnapshot = (warehouses: unknown[] = []) => ({
  items: [], categories: [], brands: [], units: [], suppliers: [], warehouses,
  movements: [], stocktakes: [], purchaseRequests: [], rfqs: [], quotations: [],
  purchaseOrders: [], goodsReceipts: [], vendorBills: [], vendorPayments: [],
  settings: {}, procurementSettings: {}
});

describe('warehouse internal locations', () => {
  it('accepts a hierarchical receiving and storage layout', () => {
    expect(validateWarehouseLocations([
      { id: 'loc-receiving', code: 'REC', name: 'منطقة الاستلام', type: 'receiving', capacity: 20 },
      { id: 'loc-a01', code: 'A-01', name: 'رف الأدوات', type: 'storage', parentId: 'loc-receiving', capacity: 100 }
    ])).toHaveLength(2);
  });

  it('rejects duplicate codes, missing parents, invalid capacity, and unexplained blocking', () => {
    expect(() => validateWarehouseLocations([
      { id: 'one', code: 'A-01', name: 'الأول', type: 'storage' },
      { id: 'two', code: 'a-01', name: 'الثاني', type: 'storage' }
    ])).toThrow('رمز الموقع');
    expect(() => validateWarehouseLocations([
      { id: 'one', code: 'A-01', name: 'الأول', type: 'storage', parentId: 'missing' }
    ])).toThrow('الموقع الأب');
    expect(() => validateWarehouseLocations([
      { id: 'one', code: 'A-01', name: 'الأول', type: 'storage', capacity: 0 }
    ])).toThrow('سعة الموقع');
    expect(() => validateWarehouseLocations([
      { id: 'one', code: 'A-01', name: 'الأول', type: 'storage', blocked: true }
    ])).toThrow('سبب حظر الموقع');
    expect(() => validateWarehouseLocations([
      { id: 'one', code: 'A-01', name: 'الأول', type: 'storage', parentId: 'two' },
      { id: 'two', code: 'A-02', name: 'الثاني', type: 'storage', parentId: 'one' }
    ])).toThrow('حلقة');
  });

  it('enforces the same rules at the canonical snapshot boundary', () => {
    expect(() => validateInventoryProcurementSnapshot(emptySnapshot([
      {
        id: 'wh-1', name: 'المستودع الرئيسي', location: 'المقر', manager: 'أمين المستودع',
        locations: [
          { id: 'loc-1', code: 'A-01', name: 'رف أول', type: 'storage' },
          { id: 'loc-2', code: 'a-01', name: 'رف مكرر', type: 'storage' }
        ]
      }
    ]))).toThrow('رمز الموقع');
  });
});
