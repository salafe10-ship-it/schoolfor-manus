import { describe, expect, it } from 'vitest';
import { buildInventoryStockCard } from '../modules/inventory/domain/InventoryStockCard';

const item = { id: 'item-1', sku: 'TEST-01', name: 'صنف اختبار', unitId: 'unit-1', quantity: 15,
  warehouseId: 'wh-1', warehouseBalances: { 'wh-1': 3, 'wh-2': 12 }, costPrice: 10, status: 'active' };
const filters = { fromDate: '2026-01-01', toDate: '2026-01-31' };

function fixture() {
  return {
    items: [item],
    units: [{ id: 'unit-1', name: 'قطعة', symbol: 'قطعة' }],
    warehouses: [{ id: 'wh-1', name: 'المستودع الأول' }, { id: 'wh-2', name: 'المستودع الثاني' }],
    receipts: [{ id: 'grn-1', grnNo: 'GRN-0001', grnDate: '2026-01-04', warehouseId: 'wh-1', status: 'posted_to_gl',
      glJournalEntryId: 'ERP-JV-inventory_receipt-grn-1', lines: [{ lineId: 'line-1', itemId: 'item-1', acceptedQty: 5, unitCost: 2, totalCost: 10 }] }],
    movements: [
      { id: 'MV-0001', date: '2026-01-10', type: 'purchase', itemId: 'item-1', quantity: 3, unitCost: 2, totalAmount: 6,
        warehouseTo: 'wh-1', status: 'posted', glJournalEntryId: 'ERP-JV-inventory_movement-MV-0001' },
      { id: 'MV-0002', date: '2026-01-20', type: 'issue', itemId: 'item-1', quantity: 2, unitCost: 2, totalAmount: 4,
        warehouseFrom: 'wh-1', status: 'posted', glJournalEntryId: 'ERP-JV-inventory_movement-MV-0002' },
      { id: 'MV-0003', date: '2026-01-25', type: 'transfer', itemId: 'item-1', quantity: 2, unitCost: 2, totalAmount: 4,
        warehouseFrom: 'wh-1', warehouseTo: 'wh-2', status: 'approved' },
      { id: 'MV-0004', date: '2026-02-05', type: 'issue', itemId: 'item-1', quantity: 1, unitCost: 2, totalAmount: 2,
        warehouseFrom: 'wh-1', status: 'posted', glJournalEntryId: 'ERP-JV-inventory_movement-MV-0004' }
    ],
    stocktakes: [{ id: 'STK-0001', date: '2026-01-30', itemId: 'item-1', warehouseId: 'wh-1', bookQty: 6, actualQty: 5,
      discrepancy: -1, valuationUnitCost: 2, financialImpact: -2, status: 'approved', glJournalEntryId: 'ERP-JV-inventory_stocktake-STK-0001' }]
  };
}

describe('inventory stock card', () => {
  it('reconstructs opening and closing balances for a warehouse and the whole inventory', () => {
    const data: any = fixture();
    const warehouse = buildInventoryStockCard({ ...data, filters: { ...filters, itemId: 'item-1', warehouseId: 'wh-1' } });
    expect(warehouse.validDateRange).toBe(true);
    expect(warehouse.summaryRows[0]).toMatchObject({ openingBalance: 1, incoming: 8, outgoing: 5, closingBalance: 4, currentBalance: 3 });
    expect(warehouse.events.find(event => event.operationNo === 'MV-0003')).toMatchObject({ incoming: 0, outgoing: 2, postingStatus: 'not_required' });

    const allWarehouses = buildInventoryStockCard({ ...data, filters: { ...filters, itemId: 'item-1' } });
    expect(allWarehouses.summaryRows[0]).toMatchObject({ openingBalance: 11, incoming: 8, outgoing: 3, transfer: 2, closingBalance: 16, currentBalance: 15 });
    expect(allWarehouses.events.find(event => event.operationNo === 'MV-0003')).toMatchObject({ incoming: 0, outgoing: 0, transfer: 2 });
  });

  it('keeps the stock operation number and its journal reference together and flags a missing posting link', () => {
    const data: any = fixture();
    data.movements.push({ id: 'MV-0005', date: '2026-01-28', type: 'issue', itemId: 'item-1', quantity: 1, unitCost: 10,
      totalAmount: 10, warehouseFrom: 'wh-1', status: 'approved' });
    const result = buildInventoryStockCard({ ...data, filters: { ...filters, itemId: 'item-1', warehouseId: 'wh-1' } });
    const row = result.events.find(event => event.operationNo === 'MV-0002');
    expect(row).toMatchObject({ operationNo: 'MV-0002', journalEntryId: 'ERP-JV-inventory_movement-MV-0002', postingStatus: 'posted' });
    expect(result.missingJournalCount).toBe(1);
  });

  it('rejects reversed date ranges and does not count pending documents as stock movement', () => {
    const data: any = fixture();
    data.movements.push({ id: 'MV-PENDING', date: '2026-01-12', type: 'purchase', itemId: 'item-1', quantity: 50,
      unitCost: 100, totalAmount: 5000, warehouseTo: 'wh-1', status: 'pending_approval' });
    const result = buildInventoryStockCard({ ...data, filters: { fromDate: '2026-02-01', toDate: '2026-01-01' } });
    expect(result.validDateRange).toBe(false);
    expect(result.events).toHaveLength(0);
    expect(result.summaryRows).toHaveLength(0);
  });

  it('does not treat an explicit null amount as a real zero when a source unit cost exists', () => {
    const data: any = fixture();
    data.movements[0].totalAmount = null;
    const result = buildInventoryStockCard({ ...data, filters: { ...filters, itemId: 'item-1' } });
    expect(result.events.find(event => event.operationNo === 'MV-0001')?.amount).toBe(6);
  });
});
