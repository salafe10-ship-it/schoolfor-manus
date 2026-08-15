import { 
  PurchaseRequest, RequestForQuotation, VendorQuotation, 
  PurchaseOrder, GoodsReceiptNote, VendorBill, VendorPayment 
} from '../../types';

const STORAGE_KEYS = {
  PURCHASE_REQUESTS: 'edupro_procurement_purchase_requests',
  RFQS: 'edupro_procurement_rfqs',
  QUOTATIONS: 'edupro_procurement_quotations',
  PURCHASE_ORDERS: 'edupro_procurement_purchase_orders',
  GOODS_RECEIPTS: 'edupro_procurement_goods_receipts',
  VENDOR_BILLS: 'edupro_procurement_vendor_bills',
  VENDOR_PAYMENTS: 'edupro_procurement_vendor_payments',
};

const DEFAULT_PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    id: 'pr_101',
    schoolId: 'school_1',
    requestNo: 'PR-2026-001',
    requestDate: '2026-08-01',
    requiredDate: '2026-08-15',
    requesterName: 'د. خالد الزهراني',
    department: 'قسم الحاسوب والتقنية',
    priority: 'high',
    purpose: 'تجهيز معمل الذكاء الاصطناعي بشاشات تفاعلية وأجهزة عرض عالية الدقة',
    status: 'approved',
    totalEstimatedAmount: 45000,
    approvedBy: 'أ. عبد الله العتيبي (المدير المالي)',
    approvalDate: '2026-08-01',
    lines: [
      {
        id: 'prl_1',
        itemCode: 'SKU-E-001',
        itemName: 'أجهزة بروجكتور فائقة الجودة سوني UHD',
        unit: 'دستة/جهاز',
        quantityRequested: 10,
        quantityApproved: 10,
        estimatedUnitPrice: 3000,
        totalAmount: 30000,
        warehouseId: 'branch_1_1'
      },
      {
        id: 'prl_2',
        itemCode: 'SKU-E-002',
        itemName: 'شاشات لمس تفاعلية 75 بوصة 4K Smart Board',
        unit: 'جهاز',
        quantityRequested: 3,
        quantityApproved: 3,
        estimatedUnitPrice: 5000,
        totalAmount: 15000,
        warehouseId: 'branch_1_1'
      }
    ],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T10:30:00Z'
  },
  {
    id: 'pr_102',
    schoolId: 'school_1',
    requestNo: 'PR-2026-002',
    requestDate: '2026-08-02',
    requiredDate: '2026-08-20',
    requesterName: 'أ. مريم العتيبي',
    department: 'قسم الكتب والمناهج',
    priority: 'medium',
    purpose: 'توفير المناهج البريطانية المعتمدة للدفعة الجديدة للعام الدراسي 2026/2027',
    status: 'pending_approval',
    totalEstimatedAmount: 25000,
    lines: [
      {
        id: 'prl_3',
        itemCode: 'SKU-B-001',
        itemName: 'كتب المناهج البريطانية المعتمدة للأطفال Oxford Stage 1',
        unit: 'نسخة/كتاب',
        quantityRequested: 500,
        estimatedUnitPrice: 50,
        totalAmount: 25000,
        warehouseId: 'branch_1_2'
      }
    ],
    createdAt: '2026-08-02T09:15:00Z',
    updatedAt: '2026-08-02T09:15:00Z'
  }
];

const DEFAULT_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po_201',
    schoolId: 'school_1',
    poNo: 'PO-2026-8801',
    poDate: '2026-08-01',
    expectedDeliveryDate: '2026-08-10',
    purchaseRequestId: 'pr_101',
    vendorId: 'sup_sony',
    vendorName: 'شركة سوني العالمية - التوريدات التعليمية',
    vendorContact: '+966 11 445 8899',
    warehouseId: 'branch_1_1',
    paymentTerms: 'الدفع بعد 30 يوماً من الفحص والاستلام المعتمد',
    deliveryTerms: 'تسليم أرض المستودع الرئيسي مع التركيب والضمان',
    status: 'partially_received',
    lines: [
      {
        id: 'pol_1',
        itemCode: 'SKU-E-001',
        itemName: 'أجهزة بروجكتور فائقة الجودة سوني UHD',
        unit: 'جهاز',
        quantityRequested: 10,
        quantityOrdered: 10,
        quantityReceived: 8,
        estimatedUnitPrice: 3000,
        actualUnitPrice: 3000,
        taxRate: 15,
        taxAmount: 4500,
        totalAmount: 34500
      }
    ],
    subtotal: 30000,
    taxAmount: 4500,
    discountAmount: 0,
    grandTotal: 34500,
    approvedBy: 'المدير العام',
    approvalDate: '2026-08-01',
    createdAt: '2026-08-01T11:00:00Z',
    updatedAt: '2026-08-02T07:00:00Z'
  }
];

const DEFAULT_GOODS_RECEIPTS: GoodsReceiptNote[] = [
  {
    id: 'grn_301',
    schoolId: 'school_1',
    grnNo: 'GRN-2026-901',
    grnDate: '2026-08-02',
    purchaseOrderId: 'po_201',
    poNo: 'PO-2026-8801',
    vendorId: 'sup_sony',
    vendorName: 'شركة سوني العالمية - التوريدات التعليمية',
    deliveryNoteNo: 'DN-SONY-7712',
    warehouseId: 'branch_1_1',
    inspectorName: 'أ. يحيى الشهري (أمين المستودع)',
    inspectionResult: 'passed',
    status: 'posted_to_gl',
    lines: [
      {
        lineId: 'grnl_1',
        itemId: 'inv_item_1',
        itemCode: 'SKU-E-001',
        itemName: 'أجهزة بروجكتور فائقة الجودة سوني UHD',
        orderedQty: 10,
        receivedQty: 8,
        acceptedQty: 8,
        rejectedQty: 0,
        unitCost: 3000,
        totalCost: 24000
      }
    ],
    totalReceivedValue: 24000,
    glJournalEntryId: 'JV-2026-080211',
    isPostedToGL: true,
    notes: 'تم فحص الشحنة الأولى وتجربة التشغيل المبدئية بنجاح دون عيوب تصنيع',
    createdAt: '2026-08-02T10:00:00Z'
  }
];

const DEFAULT_VENDOR_BILLS: VendorBill[] = [
  {
    id: 'vb_401',
    schoolId: 'school_1',
    billNo: 'BILL-2026-501',
    vendorInvoiceNo: 'INV-SONY-9981',
    billDate: '2026-08-02',
    dueDate: '2026-09-01',
    vendorId: 'sup_sony',
    vendorName: 'شركة سوني العالمية - التوريدات التعليمية',
    purchaseOrderId: 'po_201',
    grnId: 'grn_301',
    subtotal: 24000,
    taxAmount: 3600,
    grandTotal: 27600,
    paidAmount: 10000,
    remainingAmount: 17600,
    status: 'partially_paid',
    glJournalEntryId: 'JV-2026-080212',
    notes: 'موافقة المراجعة المالية الثلاثية (PO + GRN + Invoice)',
    createdAt: '2026-08-02T11:00:00Z'
  }
];

export class ProcurementRepository {
  private static getStored<T>(key: string, defaultValue: T[]): T[] {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  private static setStored<T>(key: string, value: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // --- Purchase Requests ---
  static getPurchaseRequests(schoolId: string = 'school_1'): PurchaseRequest[] {
    return this.getStored<PurchaseRequest>(STORAGE_KEYS.PURCHASE_REQUESTS, DEFAULT_PURCHASE_REQUESTS);
  }

  static savePurchaseRequest(pr: PurchaseRequest): void {
    const list = this.getPurchaseRequests();
    const index = list.findIndex(i => i.id === pr.id);
    if (index >= 0) {
      list[index] = { ...pr, updatedAt: new Date().toISOString() };
    } else {
      list.unshift(pr);
    }
    this.setStored(STORAGE_KEYS.PURCHASE_REQUESTS, list);
  }

  static deletePurchaseRequest(id: string): void {
    const list = this.getPurchaseRequests().filter(i => i.id !== id);
    this.setStored(STORAGE_KEYS.PURCHASE_REQUESTS, list);
  }

  // --- Purchase Orders ---
  static getPurchaseOrders(schoolId: string = 'school_1'): PurchaseOrder[] {
    return this.getStored<PurchaseOrder>(STORAGE_KEYS.PURCHASE_ORDERS, DEFAULT_PURCHASE_ORDERS);
  }

  static savePurchaseOrder(po: PurchaseOrder): void {
    const list = this.getPurchaseOrders();
    const index = list.findIndex(i => i.id === po.id);
    if (index >= 0) {
      list[index] = { ...po, updatedAt: new Date().toISOString() };
    } else {
      list.unshift(po);
    }
    this.setStored(STORAGE_KEYS.PURCHASE_ORDERS, list);
  }

  // --- Goods Receipts ---
  static getGoodsReceipts(schoolId: string = 'school_1'): GoodsReceiptNote[] {
    return this.getStored<GoodsReceiptNote>(STORAGE_KEYS.GOODS_RECEIPTS, DEFAULT_GOODS_RECEIPTS);
  }

  static saveGoodsReceipt(grn: GoodsReceiptNote): void {
    const list = this.getGoodsReceipts();
    const index = list.findIndex(i => i.id === grn.id);
    if (index >= 0) {
      list[index] = grn;
    } else {
      list.unshift(grn);
    }
    this.setStored(STORAGE_KEYS.GOODS_RECEIPTS, list);
  }

  // --- Vendor Bills ---
  static getVendorBills(schoolId: string = 'school_1'): VendorBill[] {
    return this.getStored<VendorBill>(STORAGE_KEYS.VENDOR_BILLS, DEFAULT_VENDOR_BILLS);
  }

  static saveVendorBill(bill: VendorBill): void {
    const list = this.getVendorBills();
    const index = list.findIndex(i => i.id === bill.id);
    if (index >= 0) {
      list[index] = bill;
    } else {
      list.unshift(bill);
    }
    this.setStored(STORAGE_KEYS.VENDOR_BILLS, list);
  }
}
