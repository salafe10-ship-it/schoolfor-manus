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
    autoPostingToGL: false,
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
    purchaseExpenseAccount: ''
  }
});

export const normalizeInventoryCanonicalDatabase = (value: unknown): InventoryCanonicalDatabase => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const defaults = emptyInventoryCanonicalDatabase();
  const array = <T,>(key: keyof InventoryCanonicalDatabase): T[] => Array.isArray(source[key]) ? source[key] as T[] : [];
  return {
    items: array('items'), categories: array('categories'), brands: array('brands'), units: array('units'),
    suppliers: array('suppliers'), warehouses: array('warehouses'), movements: array('movements'),
    stocktakes: array('stocktakes'), purchaseRequests: array('purchaseRequests'), rfqs: array('rfqs'),
    quotations: array('quotations'), purchaseOrders: array('purchaseOrders'), goodsReceipts: array('goodsReceipts'),
    vendorBills: array('vendorBills'), vendorPayments: array('vendorPayments'),
    settings: source.settings && typeof source.settings === 'object' && !Array.isArray(source.settings)
      ? { ...defaults.settings, ...source.settings as Record<string, unknown> } : defaults.settings,
    procurementSettings: source.procurementSettings && typeof source.procurementSettings === 'object' && !Array.isArray(source.procurementSettings)
      ? { ...defaults.procurementSettings, ...source.procurementSettings as Record<string, unknown> } : defaults.procurementSettings
  };
};
