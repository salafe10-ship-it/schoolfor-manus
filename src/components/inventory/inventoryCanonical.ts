import type {
  GoodsReceiptNote, InventoryCategory, InventoryItem, InventorySupplier,
  InventoryUnit, InventoryWarehouse, PurchaseOrder, PurchaseRequest,
  RequestForQuotation, VendorBill, VendorPayment, VendorQuotation
} from '../../types';

export interface InventoryCanonicalDatabase {
  items: InventoryItem[];
  categories: InventoryCategory[];
  brands: Array<{ id: string; name: string; origin?: string }>;
  units: InventoryUnit[];
  suppliers: InventorySupplier[];
  warehouses: InventoryWarehouse[];
  movements: any[];
  stocktakes: any[];
  purchaseRequests: PurchaseRequest[];
  rfqs: RequestForQuotation[];
  quotations: VendorQuotation[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceiptNote[];
  vendorBills: VendorBill[];
  vendorPayments: VendorPayment[];
  settings: Record<string, any>;
  procurementSettings: Record<string, any>;
}

export const emptyInventoryCanonicalDatabase = (): InventoryCanonicalDatabase => ({
  items: [], categories: [], brands: [], units: [], suppliers: [], warehouses: [],
  movements: [], stocktakes: [], purchaseRequests: [], rfqs: [], quotations: [],
  purchaseOrders: [], goodsReceipts: [], vendorBills: [], vendorPayments: [],
  settings: {
    allowNegativeStock: false,
    defaultValuationMethod: 'weighted_average',
    autoPostingToGL: true,
    enableLowStockAlerts: true,
    requireApprovalForAdjustments: true,
    inventoryAccountPrefix: '',
    cogsAccountPrefix: '',
    adjustmentAccountPrefix: ''
  },
  procurementSettings: {
    managerApprovalLimit: 0,
    boardApprovalLimit: 0,
    requireRfqThreshold: 0,
    apGlAccount: '',
    grniGlAccount: '',
    inputVatGlAccount: '',
    purchaseExpenseAccount: ''
  }
});

export function getItemWarehouseBalances(item: InventoryItem): Record<string, number> {
  if (item.warehouseBalances && typeof item.warehouseBalances === 'object' && !Array.isArray(item.warehouseBalances)) {
    return Object.fromEntries(Object.entries(item.warehouseBalances).map(([warehouseId, quantity]) => [warehouseId, Number(quantity)]));
  }
  return item.warehouseId ? { [item.warehouseId]: Number(item.quantity || 0) } : {};
}

export function getItemWarehouseQuantity(item: InventoryItem, warehouseId: string): number {
  const balances = getItemWarehouseBalances(item);
  return Object.prototype.hasOwnProperty.call(balances, warehouseId)
    ? Number(balances[warehouseId] || 0)
    : (!item.warehouseBalances && item.warehouseId === warehouseId ? Number(item.quantity || 0) : 0);
}

export function withUpdatedWarehouseBalances(item: InventoryItem, warehouseBalances: Record<string, number>): InventoryItem {
  const normalized = Object.fromEntries(Object.entries(warehouseBalances)
    .filter(([warehouseId]) => Boolean(warehouseId))
    .map(([warehouseId, quantity]) => [warehouseId, Number(quantity)]));
  return {
    ...item,
    warehouseBalances: normalized,
    quantity: Number(Object.values(normalized).reduce((sum, quantity) => sum + quantity, 0).toFixed(4))
  };
}

const canonicalItemId = (reference: unknown, items: InventoryItem[]) => {
  const normalized = String(reference || '').trim();
  if (!normalized) return '';
  return items.find(item => item.id === normalized || item.sku === normalized)?.id || normalized;
};

/**
 * Rebuild PO receipt progress from the immutable receipt documents. This keeps
 * older snapshots that stored a SKU in the PO line compatible with the newer
 * canonical item IDs and prevents the UI from showing an already received PO
 * as ready for receipt after a reload.
 */
export const reconcilePurchaseOrderReceiptProgress = (database: InventoryCanonicalDatabase): InventoryCanonicalDatabase => {
  const purchaseOrders = database.purchaseOrders.map(order => {
    const orderReceipts = database.goodsReceipts.filter(receipt => receipt.purchaseOrderId === order.id
      && ['inspected_received', 'partially_accepted', 'rejected', 'posted_to_gl'].includes(String(receipt.status)));
    if (orderReceipts.length === 0 || order.status === 'closed' || order.status === 'cancelled') return order;

    const lines = order.lines.map(orderLine => {
      const itemId = canonicalItemId(orderLine.itemId || orderLine.itemCode, database.items);
      const quantityReceived = orderReceipts.reduce((sum, receipt) => sum + receipt.lines
        .filter(line => line.purchaseOrderLineId ? line.purchaseOrderLineId === orderLine.id : canonicalItemId(line.itemId || line.itemCode, database.items) === itemId)
        .reduce((lineSum, line) => lineSum + Number(line.acceptedQty || 0), 0), 0);
      return { ...orderLine, itemId, quantityReceived };
    });
    const ordered = lines.reduce((sum, line) => sum + Number(line.quantityOrdered ?? line.quantityRequested ?? 0), 0);
    const received = lines.reduce((sum, line) => sum + Number(line.quantityReceived || 0), 0);
    const status = received >= ordered && ordered > 0 ? 'fully_received' as const : received > 0 ? 'partially_received' as const : order.status;
    return { ...order, lines, status };
  });

  return { ...database, purchaseOrders };
};

export const normalizeInventoryCanonicalDatabase = (value: unknown): InventoryCanonicalDatabase => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const defaults = emptyInventoryCanonicalDatabase();
  const array = <T,>(key: keyof InventoryCanonicalDatabase): T[] => Array.isArray(source[key]) ? source[key] as T[] : [];
  const normalized: InventoryCanonicalDatabase = {
    items: array<InventoryItem>('items').map(item => item.warehouseBalances === undefined
      ? { ...item, warehouseBalances: item.warehouseId ? { [item.warehouseId]: Number(item.quantity || 0) } : {} }
      : item), categories: array('categories'), brands: array('brands'), units: array('units'),
    suppliers: array('suppliers'), warehouses: array('warehouses'), movements: array('movements'),
    stocktakes: array('stocktakes'), purchaseRequests: array('purchaseRequests'), rfqs: array('rfqs'),
    quotations: array('quotations'), purchaseOrders: array('purchaseOrders'), goodsReceipts: array('goodsReceipts'),
    vendorBills: array('vendorBills'), vendorPayments: array('vendorPayments'),
    settings: source.settings && typeof source.settings === 'object' && !Array.isArray(source.settings)
      ? { ...defaults.settings, ...source.settings as Record<string, unknown> } : defaults.settings,
    procurementSettings: source.procurementSettings && typeof source.procurementSettings === 'object' && !Array.isArray(source.procurementSettings)
      ? { ...defaults.procurementSettings, ...source.procurementSettings as Record<string, unknown> } : defaults.procurementSettings
  };
  return reconcilePurchaseOrderReceiptProgress(normalized);
};
