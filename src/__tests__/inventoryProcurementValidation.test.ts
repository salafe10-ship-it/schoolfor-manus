import { describe, expect, it } from 'vitest';
import { validateInventoryProcurementSnapshot } from '../modules/inventory/domain/InventoryProcurementValidation';

const emptySnapshot = (): any => ({
  items: [], categories: [], brands: [], units: [], suppliers: [], warehouses: [],
  movements: [], stocktakes: [], purchaseRequests: [], rfqs: [], quotations: [],
  purchaseOrders: [], goodsReceipts: [], vendorBills: [], vendorPayments: [],
  settings: { autoPostingToGL: true },
  procurementSettings: { grniGlAccount: '2101', apGlAccount: '2101', inputVatGlAccount: '1401' }
});

describe('inventory and procurement snapshot validation', () => {
  it('permits a draft PO to be completed from the canonical procurement screen', () => {
    const snapshot = emptySnapshot();
    snapshot.suppliers.push({ id: 'sup-1', name: 'مورد تجريبي', phone: '000', email: 'supplier@example.test', address: 'الخرطوم' });
    snapshot.warehouses.push({ id: 'wh-1', name: 'المستودع الرئيسي', location: 'المقر', manager: 'أمين المستودع' });
    snapshot.items.push({ id: 'item-1', name: 'صنف تجريبي', sku: 'SKU-1', quantity: 0, minLevel: 0, maxLevel: 10, reorderLevel: 1, costPrice: 10, salePrice: 15, vatRate: 0, status: 'active', categoryId: '', unitId: '', supplierId: '', warehouseId: '' });
    snapshot.purchaseRequests.push({
      id: 'pr-1', requestNo: 'PR-1', requestDate: '2026-08-30', requiredDate: '2026-09-01', requesterName: 'مستخدم', department: 'إدارة', purpose: 'توريد', status: 'converted_to_po',
      lines: [{ id: 'line-1', itemCode: 'SKU-1', itemName: 'صنف تجريبي', unit: 'وحدة', quantityRequested: 2, estimatedUnitPrice: 10, totalAmount: 20 }], totalEstimatedAmount: 20
    });
    snapshot.purchaseOrders.push({
      id: 'po-1', poNo: 'PO-1', poDate: '2026-08-30', expectedDeliveryDate: '2026-09-01', purchaseRequestId: 'pr-1', vendorId: '', vendorName: '', warehouseId: '', paymentTerms: '', deliveryTerms: '', status: 'draft',
      lines: [{ id: 'pol-1', itemId: 'item-1', itemCode: 'SKU-1', itemName: 'صنف تجريبي', unit: 'وحدة', quantityRequested: 2, quantityOrdered: 2, quantityReceived: 0, estimatedUnitPrice: 10, actualUnitPrice: 10, totalAmount: 20 }], subtotal: 20, taxAmount: 0, discountAmount: 0, grandTotal: 20
    });

    expect(() => validateInventoryProcurementSnapshot(snapshot)).not.toThrow();
  });

  it('rejects a receipt that exceeds the cumulative PO quantity', () => {
    const snapshot = emptySnapshot();
    snapshot.items.push({ id: 'item-1', name: 'صنف تجريبي', sku: 'SKU-1', quantity: 0, minLevel: 0, maxLevel: 10, reorderLevel: 1, costPrice: 10, salePrice: 15, vatRate: 0, status: 'active', categoryId: '', unitId: '', supplierId: '', warehouseId: '' });
    snapshot.suppliers.push({ id: 'sup-1', name: 'مورد تجريبي', phone: '000', email: 'supplier@example.test', address: 'الخرطوم' });
    snapshot.warehouses.push({ id: 'wh-1', name: 'المستودع الرئيسي', location: 'المقر', manager: 'أمين المستودع' });
    snapshot.purchaseOrders.push({
      id: 'po-1', poNo: 'PO-1', poDate: '2026-08-30', expectedDeliveryDate: '2026-09-01', vendorId: 'sup-1', vendorName: 'مورد تجريبي', warehouseId: 'wh-1', paymentTerms: '', deliveryTerms: '', status: 'approved',
      lines: [{ id: 'pol-1', itemId: 'item-1', itemCode: 'SKU-1', itemName: 'صنف تجريبي', unit: 'وحدة', quantityRequested: 2, quantityOrdered: 2, quantityReceived: 0, estimatedUnitPrice: 10, actualUnitPrice: 10, totalAmount: 20 }], subtotal: 20, taxAmount: 0, discountAmount: 0, grandTotal: 20
    });
    snapshot.goodsReceipts.push({
      id: 'grn-1', grnNo: 'GRN-1', grnDate: '2026-08-30', purchaseOrderId: 'po-1', poNo: 'PO-1', vendorId: 'sup-1', vendorName: 'مورد تجريبي', deliveryNoteNo: 'DN-1', warehouseId: 'wh-1', inspectorName: 'مفتش', inspectionResult: 'passed', status: 'inspected_received', isPostedToGL: false,
      lines: [{ lineId: 'grnl-1', itemId: 'item-1', itemCode: 'SKU-1', itemName: 'صنف تجريبي', orderedQty: 2, receivedQty: 3, acceptedQty: 3, rejectedQty: 0, unitCost: 10, totalCost: 30 }], totalReceivedValue: 30, createdAt: '2026-08-30T00:00:00.000Z'
    });

    expect(() => validateInventoryProcurementSnapshot(snapshot)).toThrow('يتجاوز كمية أمر الشراء');
  });

  it('validates RFQ items using the canonical RequestForQuotation field', () => {
    const snapshot = emptySnapshot();
    snapshot.items.push({ id: 'item-1', name: 'صنف تجريبي', sku: 'SKU-1', quantity: 0, minLevel: 0, maxLevel: 10, reorderLevel: 1, costPrice: 10, salePrice: 15, vatRate: 0, status: 'active', categoryId: '', unitId: '', supplierId: '', warehouseId: '' });
    snapshot.rfqs.push({
      id: 'rfq-1', schoolId: '', rfqNo: 'RFQ-1', title: 'توريد تجريبي', issueDate: '2026-08-30', deadlineDate: '2026-09-06', vendorIds: [],
      items: [{ id: 'line-1', itemId: 'item-1', itemCode: 'SKU-1', itemName: 'صنف تجريبي', unit: 'وحدة', quantityRequested: 2, estimatedUnitPrice: 10, totalAmount: 20 }],
      status: 'draft', createdAt: '2026-08-30T00:00:00.000Z'
    });

    expect(() => validateInventoryProcurementSnapshot(snapshot)).not.toThrow();
  });

  it('accepts legacy SKU references while validating inventory links', () => {
    const snapshot = emptySnapshot();
    snapshot.items.push({ id: 'item-1', name: 'صنف تجريبي', sku: 'SKU-1', quantity: 0, minLevel: 0, maxLevel: 10, reorderLevel: 1, costPrice: 10, salePrice: 15, vatRate: 0, status: 'active', categoryId: '', unitId: '', supplierId: '', warehouseId: '' });
    snapshot.suppliers.push({ id: 'sup-1', name: 'مورد تجريبي', phone: '000', email: 'supplier@example.test', address: 'الخرطوم' });
    snapshot.warehouses.push({ id: 'wh-1', name: 'المستودع الرئيسي', location: 'المقر', manager: 'أمين المستودع' });
    snapshot.purchaseOrders.push({
      id: 'po-1', poNo: 'PO-1', poDate: '2026-08-30', expectedDeliveryDate: '2026-09-01', vendorId: 'sup-1', vendorName: 'مورد تجريبي', warehouseId: 'wh-1', paymentTerms: '', deliveryTerms: '', status: 'approved',
      lines: [{ id: 'pol-1', itemId: 'SKU-1', itemCode: 'SKU-1', itemName: 'صنف تجريبي', unit: 'وحدة', quantityRequested: 1, quantityOrdered: 1, quantityReceived: 0, estimatedUnitPrice: 10, actualUnitPrice: 10, totalAmount: 10 }], subtotal: 10, taxAmount: 0, discountAmount: 0, grandTotal: 10
    });

    expect(() => validateInventoryProcurementSnapshot(snapshot)).not.toThrow();
  });
});
