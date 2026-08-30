import { ValidationError } from '../../../utils/errors.js';

const COLLECTIONS = [
  'items', 'categories', 'brands', 'units', 'suppliers', 'warehouses', 'movements', 'stocktakes',
  'purchaseRequests', 'rfqs', 'quotations', 'purchaseOrders', 'goodsReceipts', 'vendorBills', 'vendorPayments'
] as const;

const PURCHASE_REQUEST_STATUSES = ['draft', 'pending_approval', 'approved', 'rejected', 'converted_to_po', 'cancelled'];
const PURCHASE_ORDER_STATUSES = ['draft', 'pending_approval', 'approved', 'issued', 'partially_received', 'fully_received', 'closed', 'cancelled'];
const RFQ_STATUSES = ['draft', 'sent', 'responses_received', 'awarded', 'closed'];
const QUOTATION_STATUSES = ['received', 'under_review', 'accepted', 'rejected'];
const GRN_STATUSES = ['inspected_received', 'partially_accepted', 'rejected', 'posted_to_gl'];
const BILL_STATUSES = ['draft', 'pending_matching', 'approved', 'partially_paid', 'paid', 'voided'];

type Snapshot = Record<string, any>;

function record(value: unknown, label: string): Snapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(`${label} يجب أن يكون سجلاً صالحاً.`);
  }
  return value as Snapshot;
}

function requiredId(value: unknown, label: string): string {
  const id = String(value || '').trim();
  if (!id) throw new ValidationError(`${label} يتطلب معرفاً صالحاً.`);
  return id;
}

function text(value: unknown, label: string): string {
  const result = String(value || '').trim();
  if (!result) throw new ValidationError(`${label} مطلوب.`);
  return result;
}

function numberValue(value: unknown, label: string, options: { integer?: boolean; min?: number; max?: number } = {}): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new ValidationError(`${label} يجب أن يكون رقماً صالحاً.`);
  if (options.integer && !Number.isInteger(value)) throw new ValidationError(`${label} يجب أن يكون عدداً صحيحاً.`);
  if (options.min !== undefined && value < options.min) throw new ValidationError(`${label} لا يمكن أن يقل عن ${options.min}.`);
  if (options.max !== undefined && value > options.max) throw new ValidationError(`${label} لا يمكن أن يتجاوز ${options.max}.`);
  return value;
}

function dateValue(value: unknown, label: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) throw new ValidationError(`${label} يجب أن يكون تاريخاً بصيغة YYYY-MM-DD.`);
}

function closeEnough(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= 0.01;
}

function assertUniqueIds(rows: unknown[], collection: string): Map<string, Snapshot> {
  const byId = new Map<string, Snapshot>();
  rows.forEach((value, index) => {
    const row = record(value, `${collection}[${index}]`);
    const id = requiredId(row.id, `${collection}[${index}]`);
    if (byId.has(id)) throw new ValidationError(`المعرف ${id} مكرر داخل ${collection}.`);
    byId.set(id, row);
  });
  return byId;
}

function lineRows(row: Snapshot, label: string): Snapshot[] {
  if (!Array.isArray(row.lines)) throw new ValidationError(`${label} يتطلب قائمة بنود.`);
  if (row.lines.length === 0) throw new ValidationError(`${label} يتطلب بنداً واحداً على الأقل.`);
  const ids = new Set<string>();
  return row.lines.map((value: unknown, index: number) => {
    const line = record(value, `${label}.lines[${index}]`);
    const id = requiredId(line.id || line.lineId || `${index}`, `${label}.lines[${index}]`);
    if (ids.has(id)) throw new ValidationError(`المعرف ${id} مكرر داخل بنود ${label}.`);
    ids.add(id);
    return line;
  });
}

function assertProcurementLine(line: Snapshot, label: string, quantityField: string): void {
  text(line.itemCode || line.itemId, `${label} رمز الصنف`);
  text(line.itemName, `${label} اسم الصنف`);
  text(line.unit, `${label} الوحدة`);
  const quantity = numberValue(line[quantityField], `${label} الكمية`, { integer: true, min: 1 });
  const unitPrice = numberValue(line.actualUnitPrice ?? line.estimatedUnitPrice, `${label} سعر الوحدة`, { min: 0 });
  const discount = numberValue(line.discountAmount ?? 0, `${label} الخصم`, { min: 0, max: quantity * unitPrice });
  const total = numberValue(line.totalAmount, `${label} الإجمالي`, { min: 0 });
  if (!closeEnough(total, quantity * unitPrice - discount)) throw new ValidationError(`${label} لا يساوي صافي الكمية بعد الخصم.`);
  if (line.quantityApproved !== undefined) numberValue(line.quantityApproved, `${label} الكمية المعتمدة`, { integer: true, min: 0, max: line.quantityRequested });
  if (line.quantityReceived !== undefined) numberValue(line.quantityReceived, `${label} الكمية المستلمة`, { integer: true, min: 0, max: quantity });
  if (line.taxRate !== undefined) numberValue(line.taxRate, `${label} الضريبة`, { min: 0, max: 100 });
  if (line.taxAmount !== undefined) numberValue(line.taxAmount, `${label} قيمة الضريبة`, { min: 0 });
}

function assertInventoryLineReference(line: Snapshot, label: string, items: Map<string, Snapshot>): void {
  if (!line.itemId) return;
  const item = items.get(String(line.itemId));
  if (!item) throw new ValidationError(`${label} مرتبط بصنف مخزون غير موجود.`);
  if (line.itemCode && item.sku && String(line.itemCode) !== String(item.sku)) throw new ValidationError(`${label} يحمل SKU لا يطابق بطاقة الصنف.`);
}

function assertNoJournalReference(row: Snapshot, label: string, allowCanonicalPostingReferences: boolean): void {
  if (!allowCanonicalPostingReferences && (String(row.glJournalEntryId || '').trim() || String(row.journalEntryId || '').trim() || row.isPostedToGL === true)) {
    throw new ValidationError(`${label} لا يقبل رقماً أو حالة ترحيل محاسبي قبل توفر تكامل دفتر الأستاذ القانوني.`);
  }
}

export function validateInventoryProcurementSnapshot(data: Snapshot, options: { allowCanonicalPostingReferences?: boolean } = {}): void {
  const allowCanonicalPostingReferences = options.allowCanonicalPostingReferences === true;
  for (const collection of COLLECTIONS) {
    if (!Array.isArray(data[collection])) throw new ValidationError(`حقل ${collection} يجب أن يكون قائمة.`);
  }
  for (const key of ['settings', 'procurementSettings']) {
    if (!data[key] || typeof data[key] !== 'object' || Array.isArray(data[key])) throw new ValidationError(`حقل ${key} يجب أن يكون كائناً.`);
  }

  const maps = Object.fromEntries(COLLECTIONS.map(collection => [collection, assertUniqueIds(data[collection], collection)])) as Record<string, Map<string, Snapshot>>;
  const items = maps.items;
  const categories = maps.categories;
  const units = maps.units;
  const suppliers = maps.suppliers;
  const warehouses = maps.warehouses;

  for (const [id, item] of items) {
    text(item.name, `الصنف ${id} اسمه`);
    text(item.sku, `الصنف ${id} رمزه SKU`);
    numberValue(item.quantity, `كمية الصنف ${id}`, { min: 0 });
    for (const field of ['minLevel', 'maxLevel', 'reorderLevel', 'costPrice', 'salePrice']) numberValue(item[field], `${field} للصنف ${id}`, { min: 0 });
    numberValue(item.vatRate, `ضريبة الصنف ${id}`, { min: 0, max: 100 });
    if (!['active', 'inactive', 'archived'].includes(String(item.status))) throw new ValidationError(`حالة الصنف ${id} غير معتمدة.`);
    if (item.categoryId && !categories.has(String(item.categoryId))) throw new ValidationError(`الصنف ${id} مرتبط بتصنيف غير موجود.`);
    if (item.unitId && !units.has(String(item.unitId))) throw new ValidationError(`الصنف ${id} مرتبط بوحدة غير موجودة.`);
    if (item.supplierId && !suppliers.has(String(item.supplierId))) throw new ValidationError(`الصنف ${id} مرتبط بمورد غير موجود.`);
    if (item.warehouseId && !warehouses.has(String(item.warehouseId))) throw new ValidationError(`الصنف ${id} مرتبط بمستودع غير موجود.`);
  }
  for (const [id, category] of categories) text(category.name, `التصنيف ${id}`);
  for (const [id, unit] of units) { text(unit.name, `الوحدة ${id}`); text(unit.symbol, `رمز الوحدة ${id}`); }
  for (const [id, supplier] of suppliers) { text(supplier.name, `المورد ${id}`); text(supplier.phone, `هاتف المورد ${id}`); }
  for (const [id, warehouse] of warehouses) { text(warehouse.name, `المستودع ${id}`); text(warehouse.location, `موقع المستودع ${id}`); text(warehouse.manager, `أمين المستودع ${id}`); }

  for (const field of ['managerApprovalLimit', 'boardApprovalLimit', 'requireRfqThreshold']) {
    if (data.procurementSettings[field] !== undefined) numberValue(data.procurementSettings[field], `إعداد ${field}`, { min: 0 });
  }

  const requests = maps.purchaseRequests;
  for (const [id, request] of requests) {
    dateValue(request.requestDate, `تاريخ طلب الشراء ${id}`);
    dateValue(request.requiredDate, `تاريخ الاحتياج ${id}`);
    text(request.requestNo, `رقم طلب الشراء ${id}`); text(request.requesterName, `مقدم طلب الشراء ${id}`); text(request.department, `قسم طلب الشراء ${id}`); text(request.purpose, `غرض طلب الشراء ${id}`);
    if (!PURCHASE_REQUEST_STATUSES.includes(String(request.status))) throw new ValidationError(`حالة طلب الشراء ${id} غير معتمدة.`);
    const lines = lineRows(request, `طلب الشراء ${id}`);
    lines.forEach((line, index) => { assertProcurementLine(line, `طلب الشراء ${id} البند ${index + 1}`, 'quantityRequested'); assertInventoryLineReference(line, `طلب الشراء ${id} البند ${index + 1}`, items); });
    const total = numberValue(request.totalEstimatedAmount, `إجمالي طلب الشراء ${id}`, { min: 0 });
    if (!closeEnough(total, lines.reduce((sum, line) => sum + Number(line.totalAmount), 0))) throw new ValidationError(`إجمالي طلب الشراء ${id} لا يطابق بنوده.`);
    if (request.status === 'approved' && (!String(request.approvedBy || '').trim() || !String(request.approvalDate || '').trim())) throw new ValidationError(`طلب الشراء ${id} معتمد دون بيانات اعتماد مكتملة.`);
    if (request.status === 'rejected' && !String(request.rejectionReason || '').trim()) throw new ValidationError(`طلب الشراء ${id} مرفوض دون سبب موثق.`);
  }

  const rfqs = maps.rfqs;
  for (const [id, rfq] of rfqs) {
    text(rfq.rfqNo, `رقم طلب العروض ${id}`); text(rfq.title, `عنوان طلب العروض ${id}`); dateValue(rfq.issueDate, `تاريخ طلب العروض ${id}`); dateValue(rfq.deadlineDate, `موعد طلب العروض ${id}`);
    if (!RFQ_STATUSES.includes(String(rfq.status))) throw new ValidationError(`حالة طلب العروض ${id} غير معتمدة.`);
    if (rfq.purchaseRequestId && !requests.has(String(rfq.purchaseRequestId))) throw new ValidationError(`طلب العروض ${id} مرتبط بطلب شراء غير موجود.`);
    if (!Array.isArray(rfq.vendorIds) || new Set(rfq.vendorIds.map(String)).size !== rfq.vendorIds.length || rfq.vendorIds.some((vendorId: unknown) => !suppliers.has(String(vendorId)))) throw new ValidationError(`قائمة موردي طلب العروض ${id} غير صالحة أو تحتوي مورداً غير مسجل.`);
    lineRows(rfq, `طلب العروض ${id}`).forEach((line, index) => { assertProcurementLine(line, `طلب العروض ${id} البند ${index + 1}`, 'quantityRequested'); assertInventoryLineReference(line, `طلب العروض ${id} البند ${index + 1}`, items); });
  }

  for (const [id, quotation] of maps.quotations) {
    text(quotation.quotationNo, `رقم عرض المورد ${id}`); text(quotation.vendorName, `اسم مورد العرض ${id}`);
    if (!rfqs.has(String(quotation.rfqId))) throw new ValidationError(`عرض المورد ${id} مرتبط بطلب عروض غير موجود.`);
    if (!suppliers.has(String(quotation.vendorId))) throw new ValidationError(`عرض المورد ${id} مرتبط بمورد غير موجود.`);
    if (!((rfqs.get(String(quotation.rfqId))?.vendorIds || []).map(String).includes(String(quotation.vendorId)))) throw new ValidationError(`عرض المورد ${id} لا يخص مورداً مدرجاً في طلب العروض.`);
    if (!QUOTATION_STATUSES.includes(String(quotation.status))) throw new ValidationError(`حالة عرض المورد ${id} غير معتمدة.`);
    numberValue(quotation.deliveryDays, `مدة تسليم العرض ${id}`, { integer: true, min: 1 });
    if (!Array.isArray(quotation.lines) || quotation.lines.length === 0) throw new ValidationError(`عرض المورد ${id} يتطلب بنوداً.`);
    const total = quotation.lines.reduce((sum: number, lineValue: unknown, index: number) => {
      const line = record(lineValue, `عرض المورد ${id}.lines[${index}]`);
      const quantity = numberValue(line.quantity, `كمية عرض المورد ${id} البند ${index + 1}`, { integer: true, min: 1 });
      const unitPrice = numberValue(line.unitPrice, `سعر عرض المورد ${id} البند ${index + 1}`, { min: 0 });
      const discount = numberValue(line.discountAmount, `خصم عرض المورد ${id} البند ${index + 1}`, { min: 0 });
      const tax = numberValue(line.taxAmount, `ضريبة عرض المورد ${id} البند ${index + 1}`, { min: 0 });
      const lineTotal = numberValue(line.totalAmount, `إجمالي عرض المورد ${id} البند ${index + 1}`, { min: 0 });
      if (!closeEnough(lineTotal, quantity * unitPrice - discount + tax)) throw new ValidationError(`إجمالي عرض المورد ${id} لا يطابق البند ${index + 1}.`);
      return sum + lineTotal;
    }, 0);
    if (!closeEnough(numberValue(quotation.grandTotal, `إجمالي عرض المورد ${id}`, { min: 0 }), total)) throw new ValidationError(`إجمالي عرض المورد ${id} لا يطابق بنوده.`);
  }

  const orders = maps.purchaseOrders;
  for (const [id, order] of orders) {
    text(order.poNo, `رقم أمر الشراء ${id}`);
    dateValue(order.poDate, `تاريخ أمر الشراء ${id}`); dateValue(order.expectedDeliveryDate, `موعد أمر الشراء ${id}`);
    if (!PURCHASE_ORDER_STATUSES.includes(String(order.status))) throw new ValidationError(`حالة أمر الشراء ${id} غير معتمدة.`);
    const isDraft = String(order.status) === 'draft';
    if (!isDraft) {
      text(order.vendorId, `مورد أمر الشراء ${id}`); text(order.vendorName, `اسم مورد أمر الشراء ${id}`); text(order.warehouseId, `مستودع أمر الشراء ${id}`);
      if (!suppliers.has(String(order.vendorId))) throw new ValidationError(`أمر الشراء ${id} مرتبط بمورد غير موجود.`);
      if (!warehouses.has(String(order.warehouseId))) throw new ValidationError(`أمر الشراء ${id} مرتبط بمستودع غير موجود.`);
    } else {
      if (order.vendorId && !suppliers.has(String(order.vendorId))) throw new ValidationError(`أمر الشراء ${id} مرتبط بمورد غير موجود.`);
      if (order.warehouseId && !warehouses.has(String(order.warehouseId))) throw new ValidationError(`أمر الشراء ${id} مرتبط بمستودع غير موجود.`);
    }
    if (order.purchaseRequestId && (!requests.has(String(order.purchaseRequestId)) || !['approved', 'converted_to_po'].includes(String(requests.get(String(order.purchaseRequestId))?.status)))) throw new ValidationError(`أمر الشراء ${id} مرتبط بطلب شراء غير معتمد.`);
    const lines = lineRows(order, `أمر الشراء ${id}`);
    lines.forEach((line, index) => { assertProcurementLine(line, `أمر الشراء ${id} البند ${index + 1}`, 'quantityOrdered'); assertInventoryLineReference(line, `أمر الشراء ${id} البند ${index + 1}`, items); });
    const subtotal = numberValue(order.subtotal, `الإجمالي قبل الضريبة لأمر الشراء ${id}`, { min: 0 });
    const tax = numberValue(order.taxAmount, `ضريبة أمر الشراء ${id}`, { min: 0 });
    const discount = numberValue(order.discountAmount, `خصم أمر الشراء ${id}`, { min: 0 });
    const grandTotal = numberValue(order.grandTotal, `إجمالي أمر الشراء ${id}`, { min: 0 });
    if (!closeEnough(grandTotal, subtotal + tax - discount)) throw new ValidationError(`إجمالي أمر الشراء ${id} لا يطابق ملخصه المالي.`);
  }

  const receipts = maps.goodsReceipts;
  const receivedByOrderLine = new Map<string, number>();
  for (const [id, receipt] of receipts) {
    text(receipt.grnNo, `رقم إذن الاستلام ${id}`); text(receipt.purchaseOrderId, `أمر إذن الاستلام ${id}`); text(receipt.vendorId, `مورد إذن الاستلام ${id}`); text(receipt.warehouseId, `مستودع إذن الاستلام ${id}`); text(receipt.inspectorName, `مفتش إذن الاستلام ${id}`);
    dateValue(receipt.grnDate, `تاريخ إذن الاستلام ${id}`);
    const order = orders.get(String(receipt.purchaseOrderId));
    if (!order) throw new ValidationError(`إذن الاستلام ${id} مرتبط بأمر شراء غير موجود.`);
    if (String(receipt.vendorId) !== String(order.vendorId) || String(receipt.warehouseId) !== String(order.warehouseId)) throw new ValidationError(`بيانات المورد أو المستودع في إذن الاستلام ${id} لا تطابق أمر الشراء.`);
    if (!GRN_STATUSES.includes(String(receipt.status))) throw new ValidationError(`حالة إذن الاستلام ${id} غير معتمدة.`);
    assertNoJournalReference(receipt, `إذن الاستلام ${id}`, allowCanonicalPostingReferences);
    if (receipt.inspectionResult === 'failed' && receipt.lines.some((line: Snapshot) => Number(line.acceptedQty) !== 0)) throw new ValidationError(`إذن الاستلام المرفوض ${id} لا يمكن أن يحتوي كمية مقبولة.`);
    const lines = lineRows(receipt, `إذن الاستلام ${id}`);
    let total = 0;
    for (const [index, line] of lines.entries()) {
      const received = numberValue(line.receivedQty, `إذن الاستلام ${id} الكمية الواردة ${index + 1}`, { integer: true, min: 0 });
      const accepted = numberValue(line.acceptedQty, `إذن الاستلام ${id} الكمية المقبولة ${index + 1}`, { integer: true, min: 0, max: received });
      const rejected = numberValue(line.rejectedQty, `إذن الاستلام ${id} الكمية المرفوضة ${index + 1}`, { integer: true, min: 0, max: received });
      if (accepted + rejected !== received) throw new ValidationError(`كميات إذن الاستلام ${id} غير متوازنة في البند ${index + 1}.`);
      const cost = numberValue(line.unitCost, `تكلفة إذن الاستلام ${id} البند ${index + 1}`, { min: 0 });
      const lineTotal = numberValue(line.totalCost, `قيمة إذن الاستلام ${id} البند ${index + 1}`, { min: 0 });
      if (!closeEnough(lineTotal, accepted * cost)) throw new ValidationError(`قيمة إذن الاستلام ${id} لا تطابق الكمية المقبولة.`);
      const orderLine = (order.lines || []).find((candidate: Snapshot) => String(candidate.itemId || candidate.itemCode) === String(line.itemId || line.itemCode));
      if (!orderLine) throw new ValidationError(`بند إذن الاستلام ${id} غير موجود في أمر الشراء.`);
      if (!items.has(String(line.itemId))) throw new ValidationError(`بند إذن الاستلام ${id} غير مربوط ببطاقة صنف مركزية.`);
      const lineKey = `${order.id}:${String(line.itemId || line.itemCode)}`;
      receivedByOrderLine.set(lineKey, (receivedByOrderLine.get(lineKey) || 0) + received);
      if ((receivedByOrderLine.get(lineKey) || 0) > Number(orderLine.quantityOrdered ?? orderLine.quantityRequested)) throw new ValidationError(`إذن الاستلام ${id} يتجاوز كمية أمر الشراء.`);
      total += lineTotal;
    }
    if (!closeEnough(numberValue(receipt.totalReceivedValue, `إجمالي إذن الاستلام ${id}`, { min: 0 }), total)) throw new ValidationError(`إجمالي إذن الاستلام ${id} لا يطابق بنوده.`);
  }

  const billedReceipts = new Set<string>();
  for (const [id, bill] of maps.vendorBills) {
    text(bill.billNo, `رقم فاتورة المورد ${id}`); text(bill.vendorInvoiceNo, `رقم فاتورة المورد الخارجية ${id}`); text(bill.vendorId, `مورد الفاتورة ${id}`);
    if (!BILL_STATUSES.includes(String(bill.status))) throw new ValidationError(`حالة فاتورة المورد ${id} غير معتمدة.`);
    assertNoJournalReference(bill, `فاتورة المورد ${id}`, allowCanonicalPostingReferences);
    const receipt = bill.grnId ? receipts.get(String(bill.grnId)) : undefined;
    if (!receipt) throw new ValidationError(`فاتورة المورد ${id} يجب أن ترتبط بإذن استلام موجود.`);
    if (billedReceipts.has(String(bill.grnId))) throw new ValidationError(`إذن الاستلام ${bill.grnId} مرتبط بأكثر من فاتورة مورد.`);
    billedReceipts.add(String(bill.grnId));
    if (String(bill.vendorId) !== String(receipt.vendorId)) throw new ValidationError(`مورد فاتورة ${id} لا يطابق إذن الاستلام.`);
    const subtotal = numberValue(bill.subtotal, `إجمالي الفاتورة قبل الضريبة ${id}`, { min: 0 });
    const tax = numberValue(bill.taxAmount, `ضريبة الفاتورة ${id}`, { min: 0 });
    const grandTotal = numberValue(bill.grandTotal, `إجمالي الفاتورة ${id}`, { min: 0 });
    const paid = numberValue(bill.paidAmount, `المدفوع من الفاتورة ${id}`, { min: 0 });
    const remaining = numberValue(bill.remainingAmount, `المتبقي من الفاتورة ${id}`, { min: 0 });
    if (!closeEnough(grandTotal, subtotal + tax) || !closeEnough(paid, 0) || !closeEnough(remaining, grandTotal) || ['partially_paid', 'paid'].includes(String(bill.status))) throw new ValidationError(`فاتورة المورد ${id} لا يمكن اعتماد سداد أو ترحيل مالي داخل هذه الوحدة.`);
  }

  if (data.vendorPayments.length > 0) throw new ValidationError('مدفوعات الموردين تُدار من وحدة الخزينة ولا تُسجل داخل snapshot المشتريات.');
  for (const [id, movement] of maps.movements) {
    text(movement.itemId, `الصنف في الحركة ${id}`);
    if (!items.has(String(movement.itemId))) throw new ValidationError(`الحركة ${id} مرتبطة بصنف غير موجود.`);
    if (!['purchase', 'sale', 'transfer', 'adjustment', 'stocktake'].includes(String(movement.type))) throw new ValidationError(`نوع الحركة ${id} غير معتمد.`);
    numberValue(movement.quantity, `كمية الحركة ${id}`, { integer: true, min: 1 });
    if (movement.unitCost !== undefined) numberValue(movement.unitCost, `تكلفة الحركة ${id}`, { min: 0 });
    if (movement.totalAmount !== undefined) numberValue(movement.totalAmount, `قيمة الحركة ${id}`, { min: 0 });
    if (movement.status && !['draft', 'pending_approval', 'approved', 'posted'].includes(String(movement.status))) throw new ValidationError(`حالة الحركة ${id} غير معتمدة.`);
    assertNoJournalReference(movement, `الحركة ${id}`, allowCanonicalPostingReferences);
  }
  for (const [id, stocktake] of maps.stocktakes) {
    text(stocktake.itemId, `الصنف في محضر الجرد ${id}`);
    if (!items.has(String(stocktake.itemId))) throw new ValidationError(`محضر الجرد ${id} مرتبط بصنف غير موجود.`);
    numberValue(stocktake.bookQty, `الرصيد الدفتري في محضر الجرد ${id}`, { min: 0 });
    numberValue(stocktake.actualQty, `الجرد الفعلي في محضر الجرد ${id}`, { integer: true, min: 0 });
    if (stocktake.status && !['pending_approval', 'approved'].includes(String(stocktake.status))) throw new ValidationError(`حالة محضر الجرد ${id} غير معتمدة.`);
    assertNoJournalReference(stocktake, `محضر الجرد ${id}`, allowCanonicalPostingReferences);
  }
}
