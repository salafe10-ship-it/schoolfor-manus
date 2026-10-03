import { AuthorizationError, ConflictError, ValidationError } from '../../../utils/errors.js';

type Row = Record<string, any>;
export type InventoryWriteAuthority = { actorId: string; actorName: string; now: string; approve: boolean; settings: boolean; boardApprove: boolean; financialWrite: boolean };
export function inventoryStableJson(value: any): string {
  const canonical = (entry: any): any => Array.isArray(entry) ? entry.map(canonical)
    : entry && typeof entry === 'object' ? Object.fromEntries(Object.keys(entry).sort().filter(key => entry[key] !== undefined).map(key => [key, canonical(entry[key])])) : entry;
  return JSON.stringify(canonical(value));
}
const rows = (data: Row, key: string): Row[] => Array.isArray(data[key]) ? data[key] : [];
const byId = (data: Row, key: string) => new Map(rows(data, key).map(row => [String(row.id), row]));
const sameExcept = (a: Row, b: Row, excluded: string[]) => {
  const omit = (row: Row) => Object.fromEntries(Object.entries(row).filter(([key]) => !excluded.includes(key)));
  return inventoryStableJson(omit(a)) === inventoryStableJson(omit(b));
};
const money = (value: number) => Number(value.toFixed(2));
const near = (a: number, b: number, tolerance = 0.01) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance + 1e-9;
const approved = (row?: Row) => row && ['approved', 'posted', 'posted_to_gl', 'issued', 'partially_received', 'fully_received', 'closed', 'paid', 'partially_paid'].includes(String(row.status));
const isFinalReceipt = (row?: Row) => row && ['inspected_received', 'partially_accepted', 'rejected', 'posted_to_gl'].includes(String(row.status));
const receiptAffectsStock = (row?: Row) => row && ['inspected_received', 'partially_accepted', 'posted_to_gl'].includes(String(row.status));
const itemFor = (data: Row, reference: any) => rows(data, 'items').find(item => String(item.id) === String(reference) || String(item.sku) === String(reference));
const itemKey = (data: Row, line: Row) => String(itemFor(data, line.itemId || line.itemCode)?.id || line.itemId || line.itemCode);
const balances = (item: Row) => item.warehouseBalances && typeof item.warehouseBalances === 'object' ? item.warehouseBalances : item.warehouseId ? { [item.warehouseId]: Number(item.quantity || 0) } : {};

/** Only these transitions may pass the approved-record lock. No business field is unlocked. */
export function isInventoryWorkflowProgression(key: string, current: Row, next: Row, before: Row, after: Row): boolean {
  if (key === 'goodsReceipts' && current.status === 'pending_approval' && isFinalReceipt(next)) {
    return sameExcept(current, next, ['status', 'approvedByUserId', 'approvedBy', 'approvalDate', 'approvedAt']);
  }
  if (key === 'purchaseRequests' && current.status === 'approved' && next.status === 'converted_to_po') {
    if (!sameExcept(current, next, ['status'])) return false;
    const orders = rows(after, 'purchaseOrders').filter(order => order.purchaseRequestId === current.id);
    const previous = byId(before, 'purchaseOrders');
    if (orders.length !== 1 || previous.has(String(orders[0].id)) || orders[0].status !== 'draft') return false;
    const order = orders[0];
    const sourceLines = (current.lines || []).filter((line: Row) => Number(line.quantityApproved ?? line.quantityRequested) > 0);
    return sourceLines.length > 0 && order.lines?.length === sourceLines.length && sourceLines.every((line: Row, index: number) => {
      const target = order.lines[index];
      return itemKey(after, line) === itemKey(after, target) && Number(target.quantityOrdered) === Number(line.quantityApproved ?? line.quantityRequested)
        && near(Number(target.actualUnitPrice), Number(line.estimatedUnitPrice), 0.0001);
    });
  }
  if (key === 'rfqs' && ['sent', 'responses_received'].includes(String(current.status))) {
    if (['sent', 'responses_received'].includes(String(next.status))) {
      if (!sameExcept(current, next, ['status', 'vendorIds'])) return false;
      const oldVendors = (current.vendorIds || []).map(String);
      const newVendors = (next.vendorIds || []).map(String);
      const oldQuotes = byId(before, 'quotations');
      const additions = rows(after, 'quotations').filter(quote => quote.rfqId === current.id && !oldQuotes.has(String(quote.id)));
      return oldVendors.every((id: string) => newVendors.includes(id))
        && newVendors.every((id: string) => oldVendors.includes(id) || additions.some(quote => String(quote.vendorId) === id))
        && (next.status !== 'responses_received' || rows(after, 'quotations').some(quote => quote.rfqId === current.id));
    }
    if (next.status === 'awarded') {
      if (!sameExcept(current, next, ['status', 'awardedVendorId', 'approvedByUserId', 'approvedBy', 'approvalDate', 'approvedAt'])) return false;
      const orders = rows(after, 'purchaseOrders').filter(order => order.rfqId === current.id);
      const previous = byId(before, 'purchaseOrders');
      if (orders.length !== 1 || previous.has(String(orders[0].id))) return false;
      const order = orders[0];
      const quotation = rows(after, 'quotations').find(quote => quote.id === order.quotationId && quote.rfqId === current.id && quote.vendorId === next.awardedVendorId && quote.status !== 'rejected');
      return Boolean(quotation && order.status === 'pending_approval' && order.vendorId === next.awardedVendorId
        && (order.purchaseRequestId || '') === (current.purchaseRequestId || '') && near(Number(order.grandTotal), Number(quotation.grandTotal))
        && order.lines?.length === quotation.lines?.length && quotation.lines.every((line: Row, index: number) => {
          const target = order.lines[index];
          return itemKey(after, line) === itemKey(after, target) && Number(target.quantityOrdered) === Number(line.quantity)
            && near(Number(target.actualUnitPrice), Number(line.unitPrice), 0.0001)
            && near(Number(target.discountAmount || 0), Number(line.discountAmount || 0)) && near(Number(target.taxAmount || 0), Number(line.taxAmount || 0));
        }));
    }
  }
  return false;
}

/** Validates newly effective operations only; historical valuation is never recomputed. */
export function validateInventoryValuationTransition(before: Row, after: Row): void {
  const effects = new Map<string, { documents: Set<string>; incomingQty: number; incomingValue: number; outgoing: boolean }>();
  const effect = (reference: any, document: string) => {
    const item = itemFor(after, reference);
    const old = itemFor(before, reference);
    if (!item || item.status === 'archived' || old?.status === 'archived') throw new ValidationError(`لا يمكن تشغيل صنف مؤرشف أو غير موجود في ${document}.`);
    const key = String(item.id);
    if (!effects.has(key)) effects.set(key, { documents: new Set(), incomingQty: 0, incomingValue: 0, outgoing: false });
    const value = effects.get(key)!;
    value.documents.add(document);
    return { item, old: old || item, value };
  };
  const oldReceipts = byId(before, 'goodsReceipts');
  for (const receipt of rows(after, 'goodsReceipts')) {
    const previousReceipt = oldReceipts.get(String(receipt.id));
    if (!isFinalReceipt(receipt) || isFinalReceipt(previousReceipt)) continue;
    const order = rows(before, 'purchaseOrders').find(row => row.id === receipt.purchaseOrderId);
    if (!order || !['approved', 'issued', 'partially_received'].includes(String(order.status))) throw new ValidationError('إذن الاستلام يتطلب أمر شراء معتمداً ومفتوحاً مسبقاً.');
    for (const line of receipt.lines || []) {
      const matches = (order.lines || []).filter((candidate: Row) => itemKey(after, candidate) === itemKey(after, line) && (!line.purchaseOrderLineId || line.purchaseOrderLineId === candidate.id));
      if (matches.length !== 1) throw new ValidationError('حدد بند أمر الشراء الصحيح لإذن الاستلام.');
      const source = matches[0];
      const netCost = Number(source.totalAmount) / Number(source.quantityOrdered ?? source.quantityRequested);
      if (!near(Number(line.unitCost), Number(netCost.toFixed(4)), 0.0001)) throw new ValidationError('تكلفة الاستلام لا تطابق صافي سعر بند أمر الشراء.');
      if (!near(Number(line.totalCost), money(Number(line.acceptedQty) * netCost))) throw new ValidationError('قيمة الاستلام لا تطابق صافي الكمية المقبولة بعد الخصم.');
      if (Number(line.rejectedQty) > 0 && !String(line.rejectionReason || '').trim()) throw new ValidationError('رفض كمية واردة يتطلب سبباً موثقاً.');
      if (itemFor(after, line.itemId || line.itemCode)?.status === 'archived') throw new ValidationError('لا يمكن استلام صنف مؤرشف.');
      if (Number(line.acceptedQty) <= 0) continue;
      const { value } = effect(line.itemId || line.itemCode, `GRN:${receipt.id}`);
      value.incomingQty += Number(line.acceptedQty);
      value.incomingValue += Number(line.totalCost);
    }
  }
  const oldMovements = byId(before, 'movements');
  for (const movement of rows(after, 'movements')) {
    if (approved(oldMovements.get(String(movement.id)))) continue;
    const item = itemFor(before, movement.itemId) || itemFor(after, movement.itemId);
    const cost = Number(movement.unitCost ?? item?.costPrice ?? 0);
    if (movement.totalAmount !== undefined && !near(Number(movement.totalAmount), money(Number(movement.quantity) * cost))) {
      throw new ValidationError(`قيمة الحركة ${movement.id} لا تطابق الكمية × تكلفة الوحدة.`);
    }
    if (!approved(movement)) continue;
    const { old, value } = effect(movement.itemId, `MOV:${movement.id}`);
    if (movement.type === 'purchase') {
      value.incomingQty += Number(movement.quantity);
      value.incomingValue += Number(movement.quantity) * cost;
    } else if (movement.type !== 'transfer') {
      if (!near(cost, Number(old.costPrice || 0), 0.0001)) throw new ConflictError(`تغير متوسط تكلفة الصنف قبل اعتماد الحركة ${movement.id}؛ أعد المزامنة والاعتماد.`);
      value.outgoing = true;
    }
    movement.unitCost = cost;
    movement.totalAmount = money(Number(movement.quantity) * cost);
  }
  const oldCounts = byId(before, 'stocktakes');
  for (const count of rows(after, 'stocktakes')) {
    if (count.status !== 'approved' || approved(oldCounts.get(String(count.id)))) continue;
    const { item, old, value } = effect(count.itemId, `COUNT:${count.id}`);
    const warehouse = String(count.warehouseId || old.warehouseId || '');
    if (!near(Number(count.bookQty), Number(balances(old)[warehouse] || 0), 0.0001)) throw new ConflictError('تغير رصيد المستودع الدفتري بعد إنشاء المحضر؛ أعد المطابقة قبل الاعتماد.');
    const delta = Number(count.actualQty) - Number(count.bookQty);
    if (!near(Number(count.discrepancy), delta, 0.0001) || !near(Number(count.financialImpact), money(delta * Number(old.costPrice || 0)))) throw new ValidationError(`فرق أو قيمة محضر الجرد ${count.id} لا يطابق الرصيد والتكلفة الموثوقين.`);
    if (!near(Number(balances(item)[warehouse] || 0), Number(count.actualQty), 0.0001)) throw new ValidationError('رصيد المستودع النهائي لا يطابق الجرد الفعلي.');
    if (count.valuationUnitCost !== undefined && !near(Number(count.valuationUnitCost), Number(old.costPrice || 0), 0.0001)) throw new ValidationError('تكلفة اعتماد الجرد غير صحيحة.');
    count.valuationUnitCost = Number(old.costPrice || 0);
    value.outgoing = true;
  }
  for (const [id, value] of effects) {
    if (value.documents.size > 1) throw new ValidationError('اعتمد مستنداً واحداً للصنف في كل عملية حفظ لتحديد ترتيب التقييم بدقة.');
    if (value.incomingQty > 0) {
      const old = itemFor(before, id);
      const item = itemFor(after, id)!;
      const expected = Number(((Number(old?.quantity || 0) * Number(old?.costPrice || 0) + value.incomingValue) / (Number(old?.quantity || 0) + value.incomingQty)).toFixed(4));
      if (!near(Number(item.costPrice), expected, 0.0001)) throw new ValidationError(`متوسط تكلفة الصنف ${id} لا يطابق قيمة الاستلام المعتمدة.`);
    }
  }
  for (const item of rows(after, 'items')) {
    if (item.status !== 'archived') continue;
    const old = itemFor(before, item.id);
    if (old?.status === 'archived') continue;
    if (Number(item.quantity) !== 0 || Number(old?.quantity || 0) !== 0 || Object.values(balances(item)).some(qty => Number(qty) !== 0) || Object.values(balances(old || {})).some(qty => Number(qty) !== 0) || effects.has(String(item.id))) {
      throw new ValidationError('لا يمكن أرشفة صنف له رصيد؛ سوِّ جميع أرصدة المستودعات أولاً.');
    }
  }
}

export function validateInventoryWriteAuthority(before: Row, after: Row, authority: InventoryWriteAuthority): void {
  if (inventoryStableJson(rows(before, 'vendorPayments')) !== inventoryStableJson(rows(after, 'vendorPayments'))) throw new ValidationError('سداد الموردين يُسجّل حصراً عبر مسار السداد المالي المركزي، وليس تعديل لقطة المخزون.');
  for (const key of ['settings', 'procurementSettings']) {
    // Normalization of first-load defaults is not a settings change. Non-empty persisted settings remain protected.
    if (Object.keys(before[key] || {}).length && inventoryStableJson(before[key]) !== inventoryStableJson(after[key]) && !authority.settings) throw new AuthorizationError('تعديل إعدادات المخزون والمشتريات يتطلب صلاحية Settings.Edit.');
    if (!Object.keys(before[key] || {}).length && Object.keys(after[key] || {}).length && !authority.settings) throw new AuthorizationError('تهيئة إعدادات المخزون تتطلب صلاحية Settings.Edit.');
  }
  const policy = before.procurementSettings || {};
  const managerLimit = Number(policy.managerApprovalLimit || 0);
  const boardLimit = Number(policy.boardApprovalLimit || 0);
  const rfqThreshold = Number(policy.requireRfqThreshold || 0);
  if (after.settings?.defaultValuationMethod && after.settings.defaultValuationMethod !== 'weighted_average') throw new ValidationError('سياسة التقييم المنفذة حالياً هي المتوسط المرجح فقط.');
  if (after.settings?.allowNegativeStock === true) throw new ValidationError('المخزون السالب غير مسموح في مسار الإنتاج.');
  if (Number(after.procurementSettings?.managerApprovalLimit || 0) > 0 && Number(after.procurementSettings?.boardApprovalLimit || 0) > 0
    && Number(after.procurementSettings.managerApprovalLimit) > Number(after.procurementSettings.boardApprovalLimit)) throw new ValidationError('سقف المدير المالي لا يمكن أن يتجاوز سقف مجلس الإدارة.');
  for (const key of ['movements', 'stocktakes', 'purchaseRequests', 'rfqs', 'purchaseOrders', 'goodsReceipts', 'vendorBills']) {
    const previous = byId(before, key);
    for (const row of rows(after, key)) {
      const old = previous.get(String(row.id));
      if (!old) row.createdByUserId = authority.actorId;
      else if (row.createdByUserId !== old.createdByUserId || row.approvedByUserId !== old.approvedByUserId) throw new ValidationError('هوية منشئ المستند والمعتمد لا تقبل التعديل من المتصفح.');
      const isReceiptApproval = key === 'goodsReceipts' && isFinalReceipt(row) && !isFinalReceipt(old);
      if (key === 'goodsReceipts' && !old && isFinalReceipt(row)) {
        throw new ConflictError('يجب حفظ إذن الاستلام قيد الاعتماد أولاً، ثم اعتماده بواسطة مستخدم آخر.');
      }
      const isApproval = (!approved(old) && approved(row)) || (key === 'rfqs' && old?.status !== 'awarded' && row.status === 'awarded') || isReceiptApproval;
      if (isApproval) {
        if (!authority.approve) throw new AuthorizationError('اعتماد المستند أو ترسية العرض يتطلب صلاحية Financial.Approve.');
        if (!old || !old.createdByUserId || old.createdByUserId === authority.actorId) {
          throw new AuthorizationError('فصل الواجبات مطلوب: لا يجوز لمنشئ المستند اعتماده.');
        }
        row.approvedByUserId = authority.actorId;
        row.approvedBy = authority.actorName;
        row.approvalDate = authority.now.slice(0, 10);
        row.approvedAt = authority.now;
        if (['purchaseRequests', 'purchaseOrders'].includes(key)) {
          const amount = Number(key === 'purchaseRequests' ? row.totalEstimatedAmount : row.grandTotal);
          if (boardLimit > 0 && amount > boardLimit) throw new AuthorizationError('المبلغ يتجاوز سقف اعتماد مجلس الإدارة المفعّل.');
          if (managerLimit > 0 && amount > managerLimit && !authority.boardApprove) throw new AuthorizationError('المبلغ يتجاوز سقف المدير المالي ويتطلب صلاحية Inventory.BoardApprove.');
        }
      }
      if (key === 'purchaseRequests' && old?.status === 'approved' && row.status === 'converted_to_po' && rfqThreshold > 0 && Number(row.totalEstimatedAmount) >= rfqThreshold) throw new ValidationError('المبلغ يتطلب ثلاثة عروض موردين؛ استخدم طلب العروض والترسية بدلاً من التحويل المباشر.');
      if (key === 'purchaseRequests' && row.status === 'converted_to_po' && old?.status !== 'converted_to_po'
        && (!old || !isInventoryWorkflowProgression(key, old, row, before, after))) throw new ConflictError('تحويل طلب الشراء يتطلب طلباً معتمداً وأمر شراء جديداً واحداً مطابقاً للبنود.');
      if (key === 'rfqs' && row.status === 'awarded' && old?.status !== 'awarded'
        && (!old || !isInventoryWorkflowProgression(key, old, row, before, after))) throw new ConflictError('ترسية طلب العروض تتطلب عرضاً مطابقاً وأمر شراء مرتبطاً جديداً واحداً.');
      if (key === 'rfqs' && row.status === 'awarded' && old?.status !== 'awarded' && rfqThreshold > 0) {
        const order = rows(after, 'purchaseOrders').find(candidate => candidate.rfqId === row.id);
        if (Number(order?.grandTotal || 0) >= rfqThreshold) {
          const vendors = new Set(rows(after, 'quotations').filter(quote => quote.rfqId === row.id && quote.status !== 'rejected').map(quote => String(quote.vendorId)));
          if (vendors.size < 3) throw new ValidationError('سقف المشتريات المفعّل يتطلب ثلاثة عروض من موردين مختلفين قبل الترسية.');
        }
      }
    }
  }
  const previousOrders = byId(before, 'purchaseOrders');
  for (const order of rows(after, 'purchaseOrders')) {
    const old = previousOrders.get(String(order.id));
    if (!old && order.purchaseRequestId && rows(after, 'purchaseOrders').filter(candidate => candidate.purchaseRequestId === order.purchaseRequestId).length !== 1) throw new ConflictError('طلب الشراء مرتبط بأمر شراء بالفعل؛ لا يمكن تكرار التحويل أو الترسية.');
    if (!old && order.rfqId && rows(after, 'purchaseOrders').filter(candidate => candidate.rfqId === order.rfqId).length !== 1) throw new ConflictError('لا يمكن إنشاء أكثر من أمر شراء لطلب العروض نفسه.');
    if (old && (order.rfqId !== old.rfqId || order.quotationId !== old.quotationId || order.purchaseRequestId !== old.purchaseRequestId)) throw new ConflictError('مراجع مصدر أمر الشراء غير قابلة للتغيير.');
    if (order.rfqId && (!old || (!approved(old) && approved(order)))) {
      const quote = rows(after, 'quotations').find(row => row.id === order.quotationId && row.rfqId === order.rfqId && row.vendorId === order.vendorId && row.status !== 'rejected');
      if (!quote || !near(Number(order.grandTotal), Number(quote.grandTotal)) || order.lines?.length !== quote.lines?.length
        || !quote.lines.every((line: Row, index: number) => itemKey(after, line) === itemKey(after, order.lines[index]) && Number(line.quantity) === Number(order.lines[index].quantityOrdered)
          && near(Number(line.unitPrice), Number(order.lines[index].actualUnitPrice), 0.0001))) throw new ValidationError('أمر الشراء لا يطابق العرض الذي تمت ترسيته.');
    }
    if (old && inventoryStableJson((old.lines || []).map((line: Row) => line.quantityReceived || 0)) === inventoryStableJson((order.lines || []).map((line: Row) => line.quantityReceived || 0)) && old.status === order.status) continue;
    if (['partially_received', 'fully_received'].includes(String(order.status))) {
      const receipts = rows(after, 'goodsReceipts').filter(row => row.purchaseOrderId === order.id && receiptAffectsStock(row));
      const quantities = (order.lines || []).map((line: Row) => receipts.reduce((sum, receipt) => sum + (receipt.lines || []).filter((entry: Row) => entry.purchaseOrderLineId ? entry.purchaseOrderLineId === line.id : itemKey(after, entry) === itemKey(after, line)).reduce((subtotal: number, entry: Row) => subtotal + Number(entry.acceptedQty || 0), 0), 0));
      if (!(quantities.some((qty: number) => qty > 0)) || !quantities.every((qty: number, index: number) => near(qty, Number(order.lines[index].quantityReceived), 0.0001))
        || (order.status === 'fully_received') !== quantities.every((qty: number, index: number) => near(qty, Number(order.lines[index].quantityOrdered), 0.0001))) throw new ValidationError('تقدم استلام أمر الشراء لا يطابق الكميات المقبولة في أذونات الاستلام.');
    }
  }
  const previousQuotations = byId(before, 'quotations');
  for (const quotation of rows(before, 'quotations')) {
    if (!rows(before, 'purchaseOrders').some(order => order.quotationId === quotation.id)) continue;
    const next = rows(after, 'quotations').find(row => row.id === quotation.id);
    if (inventoryStableJson(next) !== inventoryStableJson(quotation)) throw new ConflictError('العرض المرتبط بأمر شراء ناتج عن ترسية غير قابل للتعديل أو الحذف.');
  }
  for (const quotation of rows(after, 'quotations')) {
    if (inventoryStableJson(previousQuotations.get(String(quotation.id))) === inventoryStableJson(quotation)) continue;
    const rfq = rows(after, 'rfqs').find(row => row.id === quotation.rfqId);
    if (!rfq || !['draft', 'sent', 'responses_received'].includes(String(rfq.status))) throw new ConflictError('طلب العروض مغلق؛ لا يمكن إضافة أو تعديل عروض الموردين.');
    if (!Array.isArray(quotation.lines) || quotation.lines.length !== rfq.items?.length || !quotation.lines.every((line: Row, index: number) => itemKey(after, line) === itemKey(after, rfq.items[index]) && Number(line.quantity) === Number(rfq.items[index].quantityRequested))) throw new ValidationError('بنود عرض المورد وكمياته لا تطابق طلب العروض.');
  }
  for (const key of ['purchaseRequests', 'rfqs', 'purchaseOrders', 'quotations', 'movements', 'stocktakes']) {
    const previous = byId(before, key);
    for (const row of rows(after, key)) {
      if (inventoryStableJson(previous.get(String(row.id))) === inventoryStableJson(row)) continue;
      const lines = key === 'rfqs' ? row.items || [] : row.lines || [row];
      if (lines.some((line: Row) => itemFor(after, line.itemId || line.itemCode)?.status === 'archived')) throw new ValidationError('لا يمكن إنشاء أو تغيير مستند تشغيلي لصنف مؤرشف.');
    }
  }
}

/** Never re-post unlinked history as a side effect of saving a directory or draft. */
export function inventoryPostingCandidates(before: Row, after: Row): Row {
  const result: Row = { items: after.items, settings: after.settings, procurementSettings: after.procurementSettings, inventorySales: [] };
  for (const key of ['goodsReceipts', 'vendorBills', 'movements', 'stocktakes']) {
    const previous = byId(before, key);
    result[key] = rows(after, key).filter(row => {
      const old = previous.get(String(row.id));
      if (key === 'goodsReceipts') return ['inspected_received', 'partially_accepted', 'posted_to_gl'].includes(String(row.status)) && !isFinalReceipt(old);
      return !old || (!approved(old) && approved(row));
    });
  }
  return result;
}
export function inventoryHasFinancialEffect(candidates: Row): boolean {
  return rows(candidates, 'goodsReceipts').some(row => isFinalReceipt(row) && Number(row.totalReceivedValue) > 0)
    || rows(candidates, 'vendorBills').some(row => approved(row) && Number(row.grandTotal) > 0)
    || rows(candidates, 'movements').some(row => approved(row) && row.type !== 'transfer' && Number(row.totalAmount ?? Number(row.quantity) * Number(row.unitCost || 0)) > 0)
    || rows(candidates, 'stocktakes').some(row => row.status === 'approved' && Number(row.financialImpact) !== 0);
}
