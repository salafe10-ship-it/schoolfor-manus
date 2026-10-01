import { describe, expect, it } from 'vitest';
import { inventoryHasFinancialEffect, inventoryPostingCandidates, isInventoryWorkflowProgression, validateInventoryValuationTransition, validateInventoryWriteAuthority } from '../modules/inventory/domain/InventoryWritePolicy';
import { validateInventoryProcurementSnapshot } from '../modules/inventory/domain/InventoryProcurementValidation';

const clone = <T,>(value: T): T => structuredClone(value);
const authority = { actorId: 'trusted-user', actorName: 'معتمد', now: '2026-10-01T12:00:00.000Z', approve: true, settings: true, boardApprove: false, financialWrite: true };
function fixture(): any {
  return { items: [{ id: 'i', name: 'صنف اختبار', sku: 'S', quantity: 5, warehouseId: 'w', warehouseBalances: { w: 5 }, costPrice: 10, salePrice: 15, minLevel: 1, maxLevel: 100, reorderLevel: 2, vatRate: 0, status: 'active' }],
    warehouses: [{ id: 'w', name: 'مستودع', location: 'موقع', manager: 'أمين' }], categories: [], units: [], brands: [], suppliers: [{ id: 'v', name: 'مورد', phone: '000' }],
    movements: [], stocktakes: [], purchaseRequests: [], rfqs: [], quotations: [], purchaseOrders: [], goodsReceipts: [], vendorBills: [], vendorPayments: [],
    settings: { defaultValuationMethod: 'weighted_average', allowNegativeStock: false }, procurementSettings: { managerApprovalLimit: 0, boardApprovalLimit: 0, requireRfqThreshold: 0 } };
}
const line = () => ({ id: 'l', itemId: 'i', itemCode: 'S', itemName: 'صنف اختبار', unit: 'قطعة', quantityRequested: 2, quantityOrdered: 2, estimatedUnitPrice: 10, actualUnitPrice: 10, quantityReceived: 0, totalAmount: 20 });
function conversion() {
  const before = fixture();
  before.purchaseRequests = [{ id: 'pr', status: 'approved', lines: [line()], totalEstimatedAmount: 20, approvedBy: 'معتمد سابق', approvalDate: '2026-09-30' }];
  const after = clone(before);
  after.purchaseRequests[0].status = 'converted_to_po';
  after.purchaseOrders = [{ id: 'po', status: 'draft', purchaseRequestId: 'pr', lines: [line()], subtotal: 20, taxAmount: 0, discountAmount: 0, grandTotal: 20 }];
  return { before, after };
}
function issue() {
  const before = fixture(); const after = clone(before);
  after.movements = [{ id: 'm', itemId: 'i', type: 'issue', direction: 'decrease', quantity: 2, unitCost: 10, totalAmount: 20, warehouseFrom: 'w', status: 'approved' }];
  after.items[0].quantity = 3; after.items[0].warehouseBalances.w = 3;
  return { before, after };
}
function count() {
  const before = fixture(); const after = clone(before);
  after.stocktakes = [{ id: 'c', status: 'approved', itemId: 'i', warehouseId: 'w', bookQty: 5, actualQty: 4, discrepancy: -1, financialImpact: -10 }];
  after.items[0].quantity = 4; after.items[0].warehouseBalances.w = 4;
  return { before, after };
}
function receipt() {
  const before = fixture();
  before.purchaseOrders = [{ id: 'po', status: 'approved', poNo: 'PO', poDate: '2026-10-01', expectedDeliveryDate: '2026-10-02', vendorId: 'v', vendorName: 'مورد', warehouseId: 'w', lines: [{ ...line(), actualUnitPrice: 20, estimatedUnitPrice: 20, totalAmount: 40 }], subtotal: 40, taxAmount: 0, discountAmount: 0, grandTotal: 40 }];
  const after = clone(before);
  after.goodsReceipts = [{ id: 'grn', grnNo: 'GRN', grnDate: '2026-10-01', purchaseOrderId: 'po', vendorId: 'v', warehouseId: 'w', inspectorName: 'فاحص', inspectionResult: 'passed', status: 'inspected_received', totalReceivedValue: 40,
    lines: [{ lineId: 'r', purchaseOrderLineId: 'l', itemId: 'i', itemCode: 'S', receivedQty: 2, acceptedQty: 2, rejectedQty: 0, unitCost: 20, totalCost: 40 }] }];
  after.items[0].quantity = 7; after.items[0].warehouseBalances.w = 7; after.items[0].costPrice = 12.8571;
  after.purchaseOrders[0].status = 'fully_received'; after.purchaseOrders[0].lines[0].quantityReceived = 2;
  return { before, after };
}
describe('inventory closure server policy', () => {
  it('converts exactly one matching approved request without unlocking its fields', () => {
    const { before, after } = conversion();
    validateInventoryWriteAuthority(before, after, authority);
    expect(isInventoryWorkflowProgression('purchaseRequests', before.purchaseRequests[0], after.purchaseRequests[0], before, after)).toBe(true);
    after.purchaseRequests[0].totalEstimatedAmount = 1;
    expect(isInventoryWorkflowProgression('purchaseRequests', before.purchaseRequests[0], after.purchaseRequests[0], before, after)).toBe(false);
  });
  it.each(['missing', 'duplicate', 'wrong quantity', 'zero approved'])('rejects invalid conversion: %s', mode => {
    const { before, after } = conversion();
    if (mode === 'missing') after.purchaseOrders = [];
    if (mode === 'duplicate') after.purchaseOrders.push({ ...after.purchaseOrders[0], id: 'po2' });
    if (mode === 'wrong quantity') after.purchaseOrders[0].lines[0].quantityOrdered = 3;
    if (mode === 'zero approved') { before.purchaseRequests[0].lines[0].quantityApproved = 0; after.purchaseRequests[0].lines[0].quantityApproved = 0; }
    expect(() => validateInventoryWriteAuthority(before, after, authority)).toThrow();
  });
  it('prevents a second order even if the converted PR is unchanged', () => {
    const { after: before } = conversion(); const after = clone(before);
    after.purchaseOrders.push({ ...after.purchaseOrders[0], id: 'po2' });
    expect(() => validateInventoryWriteAuthority(before, after, authority)).toThrow('تكرار');
  });
  it('allows sent RFQ additive vendors only when backed by a new quotation', () => {
    const before = fixture(); before.rfqs = [{ id: 'rfq', status: 'sent', vendorIds: [], items: [line()] }];
    const after = clone(before); after.rfqs[0].vendorIds = ['v']; after.quotations = [{ id: 'q', rfqId: 'rfq', vendorId: 'v' }];
    expect(isInventoryWorkflowProgression('rfqs', before.rfqs[0], after.rfqs[0], before, after)).toBe(true);
    after.quotations = [];
    expect(isInventoryWorkflowProgression('rfqs', before.rfqs[0], after.rfqs[0], before, after)).toBe(false);
  });
  it('allows award only with matching immutable quotation/PO provenance', () => {
    const before = fixture(); before.rfqs = [{ id: 'rfq', status: 'sent', vendorIds: ['v'], items: [line()] }];
    before.quotations = [{ id: 'q', rfqId: 'rfq', vendorId: 'v', status: 'received', grandTotal: 20, lines: [{ itemId: 'i', quantity: 2, unitPrice: 10, discountAmount: 0, taxAmount: 0 }] }];
    const after = clone(before); after.rfqs[0] = { ...after.rfqs[0], status: 'awarded', awardedVendorId: 'v' };
    after.purchaseOrders = [{ id: 'po', rfqId: 'rfq', quotationId: 'q', vendorId: 'v', status: 'pending_approval', grandTotal: 20, lines: [line()] }];
    validateInventoryWriteAuthority(before, after, authority);
    expect(isInventoryWorkflowProgression('rfqs', before.rfqs[0], after.rfqs[0], before, after)).toBe(true);
    after.purchaseOrders[0].quotationId = 'forged';
    expect(isInventoryWorkflowProgression('rfqs', before.rfqs[0], after.rfqs[0], before, after)).toBe(false);
  });
  it('validates issue amount and current average then selects its financial effect', () => {
    const { before, after } = issue(); validateInventoryValuationTransition(before, after);
    expect(inventoryHasFinancialEffect(inventoryPostingCandidates(before, after))).toBe(true);
  });
  it('rejects forged total despite balanced future ledger lines', () => {
    const { before, after } = issue(); after.movements[0].totalAmount = 1;
    expect(() => validateInventoryValuationTransition(before, after)).toThrow('الكمية ×');
  });
  it('rejects stale issue unit cost', () => {
    const { before, after } = issue(); after.movements[0].unitCost = 5; after.movements[0].totalAmount = 10;
    expect(() => validateInventoryValuationTransition(before, after)).toThrow('تغير متوسط');
  });
  it('accepts current weighted average but rejects arbitrary receipt cost', () => {
    const { before, after } = receipt(); validateInventoryValuationTransition(before, after);
    validateInventoryWriteAuthority(before, after, authority); validateInventoryProcurementSnapshot(after, { allowCanonicalPostingReferences: true });
    after.items[0].costPrice = 999;
    expect(() => validateInventoryValuationTransition(before, after)).toThrow('متوسط تكلفة');
  });
  it('rejects unapproved PO receipts and altered purchase prices', () => {
    const { before, after } = receipt(); before.purchaseOrders[0].status = 'draft';
    expect(() => validateInventoryValuationTransition(before, after)).toThrow('معتمداً');
    before.purchaseOrders[0].status = 'approved'; after.goodsReceipts[0].lines[0].unitCost = 1;
    expect(() => validateInventoryValuationTransition(before, after)).toThrow('صافي سعر');
  });
  it('freezes count cost and excludes zero-difference counts from GL posting', () => {
    const { before, after } = count(); validateInventoryValuationTransition(before, after);
    expect(after.stocktakes[0].valuationUnitCost).toBe(10);
    const zero = clone(before); zero.stocktakes = [{ ...after.stocktakes[0], actualQty: 5, discrepancy: 0, financialImpact: 0 }];
    validateInventoryValuationTransition(before, zero);
    expect(inventoryHasFinancialEffect(inventoryPostingCandidates(before, zero))).toBe(false);
  });
  it.each(['stale', 'discrepancy', 'amount', 'final balance', 'unit cost'])('rejects inconsistent stocktake: %s', mode => {
    const { before, after } = count();
    if (mode === 'stale') after.stocktakes[0].bookQty = 4;
    if (mode === 'discrepancy') after.stocktakes[0].discrepancy = 999;
    if (mode === 'amount') after.stocktakes[0].financialImpact = 999;
    if (mode === 'final balance') after.items[0].warehouseBalances.w = 6;
    if (mode === 'unit cost') after.stocktakes[0].valuationUnitCost = 999;
    expect(() => validateInventoryValuationTransition(before, after)).toThrow();
  });
  it('rejects multiple simultaneous valuations for the same item', () => {
    const { before, after } = count(); after.movements = issue().after.movements;
    expect(() => validateInventoryValuationTransition(before, after)).toThrow('مستنداً واحداً');
  });
  it('blocks archive with balance and operations on archived items', () => {
    const { before, after } = issue(); after.items[0].status = 'archived';
    expect(() => validateInventoryValuationTransition(before, after)).toThrow('مؤرشف');
    const archive = clone(before); archive.items[0].status = 'archived';
    expect(() => validateInventoryValuationTransition(before, archive)).toThrow('له رصيد');
  });
  it('does not re-post historical unlinked approvals on a directory save', () => {
    const { after: before } = issue(); const after = clone(before); after.categories.push({ id: 'new', name: 'تصنيف' });
    const candidates = inventoryPostingCandidates(before, after);
    expect(candidates.movements).toEqual([]); expect(inventoryHasFinancialEffect(candidates)).toBe(false);
  });
  it('requires approval and settings authorities independently of write access', () => {
    const { before, after } = issue();
    expect(() => validateInventoryWriteAuthority(before, after, { ...authority, approve: false })).toThrow('Financial.Approve');
    const settings = clone(before); settings.settings.autoPostingToGL = false;
    expect(() => validateInventoryWriteAuthority(before, settings, { ...authority, settings: false })).toThrow('Settings.Edit');
  });
  it('stamps trusted actor/time and rejects tampering with existing attribution', () => {
    const { before, after } = issue(); after.movements[0].approvedBy = 'forged';
    validateInventoryWriteAuthority(before, after, authority);
    expect(after.movements[0]).toMatchObject({ createdByUserId: 'trusted-user', approvedByUserId: 'trusted-user', approvedBy: 'معتمد', approvedAt: authority.now });
    const forged = clone(after); forged.movements[0].approvedByUserId = 'another';
    expect(() => validateInventoryWriteAuthority(after, forged, authority)).toThrow('هوية');
  });
  it('evaluates approval ceilings from previous settings, not same-request overrides', () => {
    const before = fixture(); before.procurementSettings = { managerApprovalLimit: 10, boardApprovalLimit: 100 };
    const after = clone(before); after.procurementSettings.managerApprovalLimit = 100;
    after.purchaseRequests = [{ id: 'pr', status: 'approved', totalEstimatedAmount: 20, lines: [line()] }];
    expect(() => validateInventoryWriteAuthority(before, after, authority)).toThrow('Inventory.BoardApprove');
    after.procurementSettings.managerApprovalLimit = 10;
    expect(() => validateInventoryWriteAuthority(before, after, { ...authority, boardApprove: true })).not.toThrow();
    after.purchaseRequests[0].totalEstimatedAmount = 101;
    expect(() => validateInventoryWriteAuthority(before, after, { ...authority, boardApprove: true })).toThrow('سقف اعتماد مجلس');
  });
  it('enforces enabled three-quote policy instead of allowing direct conversion', () => {
    const { before, after } = conversion(); before.procurementSettings.requireRfqThreshold = 10; after.procurementSettings.requireRfqThreshold = 10;
    expect(() => validateInventoryWriteAuthority(before, after, authority)).toThrow('ثلاثة عروض');
  });
  it('prevents inventorySales injection through snapshot posting candidates', () => {
    const before = fixture(); const after = clone(before); after.inventorySales = [{ id: 'injected' }];
    expect(inventoryPostingCandidates(before, after).inventorySales).toEqual([]);
  });
  it('requires receipt evidence for claimed PO progress', () => {
    const { before, after } = receipt(); after.goodsReceipts = [];
    expect(() => validateInventoryWriteAuthority(before, after, authority)).toThrow('تقدم استلام');
  });
});
