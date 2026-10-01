type Row = Record<string, any>;

export type InventoryStockCardSource = 'movement' | 'receipt' | 'stocktake';
export type InventoryStockCardPostingStatus = 'posted' | 'missing' | 'not_required';

export interface InventoryStockCardFilters {
  fromDate: string;
  toDate: string;
  itemId?: string;
  warehouseId?: string;
}
export interface InventoryStockCardEvent {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  source: InventoryStockCardSource;
  type: string;
  typeLabel: string;
  date: string;
  operationNo: string;
  referenceNo?: string;
  warehouseId?: string;
  warehouseFromId?: string;
  warehouseToId?: string;
  incoming: number;
  outgoing: number;
  transfer: number;
  unitCost: number;
  amount: number;
  journalEntryId?: string;
  postingStatus: InventoryStockCardPostingStatus;
  balanceAfter?: number;
}

export interface InventoryStockCardSummary {
  itemId: string;
  sku: string;
  itemName: string;
  unitName: string;
  warehouseId: string;
  openingBalance: number;
  incoming: number;
  outgoing: number;
  transfer: number;
  closingBalance: number;
  currentBalance: number;
  currentUnitCost: number;
  currentValuation: number;
}

export interface InventoryStockCardResult {
  validDateRange: boolean;
  summaryRows: InventoryStockCardSummary[];
  events: InventoryStockCardEvent[];
  totals: Omit<InventoryStockCardSummary, 'itemId' | 'sku' | 'itemName' | 'unitName' | 'warehouseId' | 'currentUnitCost'>;
  missingJournalCount: number;
  undatedOperationCount: number;
  inconsistentItemBalanceCount: number;
}

const finite = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
const roundQuantity = (value: number) => Number(value.toFixed(4));
const roundMoney = (value: number) => Number(value.toFixed(2));
const rowList = (value: unknown): Row[] => Array.isArray(value)
  ? value.filter((row): row is Row => Boolean(row && typeof row === 'object' && !Array.isArray(row)))
  : [];
const dateOnly = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const direct = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (direct) {
    const directTimestamp = Date.parse(`${direct}T00:00:00Z`);
    if (Number.isFinite(directTimestamp) && new Date(directTimestamp).toISOString().slice(0, 10) === direct) return direct;
  }
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : '';
};
const journalId = (row: Row) => String(row.glJournalEntryId || row.journalEntryId || '').trim();
const posted = (row: Row) => ['approved', 'posted', 'posted_to_gl'].includes(String(row.status || '').toLowerCase())
  || row.isPostedToGL === true;

/**
 * Build an auditable stock card from the same central snapshot used by the
 * inventory module. Opening balances are reconstructed from current balances
 * and dated, approved documents; every financial row retains its canonical GL
 * reference. Internal warehouse transfers remain non-financial at company
 * level and are shown separately in the all-warehouse view.
 */
export function buildInventoryStockCard(input: {
  items: unknown;
  movements?: unknown;
  receipts?: unknown;
  stocktakes?: unknown;
  units?: unknown;
  warehouses?: unknown;
  filters: InventoryStockCardFilters;
}): InventoryStockCardResult {
  const items = rowList(input.items);
  const movements = rowList(input.movements);
  const receipts = rowList(input.receipts);
  const stocktakes = rowList(input.stocktakes);
  const units = rowList(input.units);
  const warehouses = rowList(input.warehouses);
  const { fromDate, toDate } = input.filters;
  const validDateRange = Boolean(dateOnly(fromDate) && dateOnly(toDate) && dateOnly(fromDate) <= dateOnly(toDate));
  const itemByReference = new Map<string, Row>();
  for (const item of items) {
    if (item.id) itemByReference.set(String(item.id), item);
    if (item.sku) itemByReference.set(String(item.sku), item);
  }
  const itemFor = (reference: unknown) => itemByReference.get(String(reference ?? '').trim());
  const events: InventoryStockCardEvent[] = [];
  let undatedOperationCount = 0;

  const addEvent = (event: Omit<InventoryStockCardEvent, 'balanceAfter'>) => {
    if (!event.date) { undatedOperationCount += 1; return; }
    events.push({ ...event, date: dateOnly(event.date) });
  };

  for (const movement of movements) {
    if (!posted(movement)) continue;
    const type = String(movement.type || '').toLowerCase();
    if (!['purchase', 'issue', 'sale', 'adjustment', 'transfer', 'opening_balance'].includes(type)) continue;
    const item = itemFor(movement.itemId || movement.itemCode);
    const itemId = String(item?.id || movement.itemId || movement.itemCode || '').trim();
    if (!itemId) continue;
    const quantity = Math.abs(finite(movement.quantity));
    if (quantity <= 0) continue;
    const unitCost = Math.max(0, finite(movement.unitCost, finite(item?.costPrice)));
    const amount = Math.abs(finite(movement.totalAmount, roundMoney(quantity * unitCost)));
    const warehouseFromId = String(movement.warehouseFrom || '').trim();
    const warehouseToId = String(movement.warehouseTo || '').trim();
    const warehouseId = String(movement.warehouseId || (type === 'purchase' || type === 'opening_balance' ? warehouseToId : warehouseFromId) || '').trim();
    let incoming = 0;
    let outgoing = 0;
    let transfer = 0;
    if (type === 'purchase' || type === 'opening_balance' || (type === 'adjustment' && String(movement.direction || '').toLowerCase() !== 'decrease')) incoming = quantity;
    else if (type === 'transfer') transfer = quantity;
    else outgoing = quantity;
    const requiresJournal = type !== 'transfer' && amount > 0;
    const id = String(movement.id || movement.operationNo || `${itemId}-${movement.date}-${events.length}`);
    addEvent({ id: `movement:${id}`, itemId, itemName: String(movement.itemName || item?.name || itemId), sku: String(item?.sku || movement.itemCode || ''),
      source: 'movement', type, typeLabel: String(movement.typeLabel || ({ purchase: 'وارد', opening_balance: 'رصيد افتتاحي', issue: 'منصرف', sale: 'بيع مخزني', transfer: 'تحويل داخلي', adjustment: 'تسوية مخزنية' } as Record<string, string>)[type] || type),
      date: String(movement.date || movement.movementDate || movement.createdAt || ''), operationNo: String(movement.operationNo || movement.movementNo || movement.id || id),
      referenceNo: String(movement.refNo || movement.referenceNo || ''), warehouseId, warehouseFromId, warehouseToId,
      incoming: type === 'transfer' ? 0 : incoming, outgoing: type === 'transfer' ? 0 : outgoing, transfer, unitCost, amount,
      journalEntryId: journalId(movement) || undefined,
      postingStatus: requiresJournal ? (journalId(movement) ? 'posted' : 'missing') : 'not_required' });
  }

  for (const receipt of receipts) {
    if (!posted(receipt)) continue;
    const receiptDate = String(receipt.grnDate || receipt.date || receipt.createdAt || '');
    const receiptLines = Array.isArray(receipt.lines) ? receipt.lines : [];
    for (const [index, rawLine] of receiptLines.entries()) {
      if (!rawLine || typeof rawLine !== 'object' || Array.isArray(rawLine)) continue;
      const line = rawLine as Row;
      const item = itemFor(line.itemId || line.itemCode);
      const itemId = String(item?.id || line.itemId || line.itemCode || '').trim();
      const quantity = Math.max(0, finite(line.acceptedQty));
      if (!itemId || quantity <= 0) continue;
      const unitCost = Math.max(0, finite(line.unitCost, finite(item?.costPrice)));
      const amount = Math.abs(finite(line.totalCost, roundMoney(quantity * unitCost)));
      const requiresJournal = amount > 0;
      const id = String(receipt.id || receipt.grnNo || `receipt-${index}`);
      addEvent({ id: `receipt:${id}:${String(line.lineId || index)}`, itemId, itemName: String(line.itemName || item?.name || itemId), sku: String(item?.sku || line.itemCode || ''),
        source: 'receipt', type: 'receipt', typeLabel: 'استلام توريد', date: receiptDate,
        operationNo: String(receipt.grnNo || receipt.operationNo || receipt.id || id),
        referenceNo: String(receipt.deliveryNoteNo || receipt.poNo || ''), warehouseId: String(receipt.warehouseId || '').trim(),
        incoming: quantity, outgoing: 0, transfer: 0, unitCost, amount,
        journalEntryId: journalId(receipt) || undefined,
        postingStatus: requiresJournal ? (journalId(receipt) ? 'posted' : 'missing') : 'not_required' });
    }
  }

  for (const count of stocktakes) {
    if (!posted(count)) continue;
    const item = itemFor(count.itemId || count.itemCode);
    const itemId = String(item?.id || count.itemId || count.itemCode || '').trim();
    if (!itemId) continue;
    const delta = roundQuantity(finite(count.actualQty) - finite(count.bookQty));
    if (delta === 0) continue;
    const unitCost = Math.max(0, finite(count.valuationUnitCost, finite(item?.costPrice)));
    const amount = Math.abs(finite(count.financialImpact, roundMoney(Math.abs(delta) * unitCost)));
    const requiresJournal = amount > 0;
    const id = String(count.id || count.stocktakeNo || `stocktake-${events.length}`);
    addEvent({ id: `stocktake:${id}`, itemId, itemName: String(count.itemName || item?.name || itemId), sku: String(item?.sku || count.itemCode || ''),
      source: 'stocktake', type: 'stocktake', typeLabel: delta > 0 ? 'زيادة جردية' : 'عجز جردي',
      date: String(count.date || count.stocktakeDate || count.createdAt || ''), operationNo: String(count.stocktakeNo || count.id || id),
      warehouseId: String(count.warehouseId || count.warehouse || '').trim(), incoming: delta > 0 ? delta : 0,
      outgoing: delta < 0 ? Math.abs(delta) : 0, transfer: 0, unitCost, amount,
      journalEntryId: journalId(count) || undefined,
      postingStatus: requiresJournal ? (journalId(count) ? 'posted' : 'missing') : 'not_required' });
  }

  events.sort((left, right) => left.date.localeCompare(right.date) || left.operationNo.localeCompare(right.operationNo, 'en') || left.id.localeCompare(right.id, 'en'));
  const selectedItemId = String(input.filters.itemId || '').trim();
  const selectedWarehouseId = String(input.filters.warehouseId || '').trim();
  const scopeEvents = events.flatMap(event => {
    if (selectedItemId && event.itemId !== selectedItemId) return [];
    if (event.type !== 'transfer') return !selectedWarehouseId || event.warehouseId === selectedWarehouseId ? [event] : [];
    if (!selectedWarehouseId) return [event];
    if (event.warehouseFromId === selectedWarehouseId) return [{ ...event, warehouseId: selectedWarehouseId, incoming: 0, outgoing: event.transfer, transfer: 0 }];
    if (event.warehouseToId === selectedWarehouseId) return [{ ...event, warehouseId: selectedWarehouseId, incoming: event.transfer, outgoing: 0, transfer: 0 }];
    return [];
  });
  const filteredEvents = validDateRange ? scopeEvents.filter(event => event.date >= fromDate && event.date <= toDate) : [];
  const groupKey = (itemId: string, warehouseId = '') => `${itemId}\u0000${warehouseId || '*'}`;
  const itemRows = validDateRange ? items.filter(item => !selectedItemId || String(item.id) === selectedItemId) : [];
  const summaries: InventoryStockCardSummary[] = [];

  for (const item of itemRows) {
    const itemId = String(item.id || '');
    const balances = item.warehouseBalances && typeof item.warehouseBalances === 'object' && !Array.isArray(item.warehouseBalances)
      ? Object.entries(item.warehouseBalances as Record<string, unknown>).map(([warehouseId, quantity]) => [warehouseId, finite(quantity)] as const)
      : item.warehouseId ? [[String(item.warehouseId), finite(item.quantity)] as const] : [['', finite(item.quantity)] as const];
    const balanceMap = new Map<string, number>(balances);
    const hasBalances = balanceMap.size > 0;
    if (!hasBalances && finite(item.quantity) !== 0) balanceMap.set('', finite(item.quantity));
    if (selectedWarehouseId) {
      const currentBalance = finite(balanceMap.get(selectedWarehouseId));
      summaries.push(makeSummary(item, selectedWarehouseId, currentBalance, scopeEvents, filteredEvents, fromDate, units));
    } else {
      const currentBalance = roundQuantity([...balanceMap.values()].reduce((sum, value) => sum + value, 0));
      summaries.push(makeSummary(item, '', currentBalance, scopeEvents, filteredEvents, fromDate, units));
    }
  }

  let running = new Map<string, number>(summaries.map(summary => [groupKey(summary.itemId, selectedWarehouseId), summary.openingBalance]));
  const eventsWithBalances = filteredEvents.map(event => {
    const key = groupKey(event.itemId, selectedWarehouseId);
    const before = finite(running.get(key));
    const after = roundQuantity(before + event.incoming - event.outgoing);
    running.set(key, after);
    return { ...event, balanceAfter: after };
  });
  const total = (key: 'openingBalance' | 'incoming' | 'outgoing' | 'transfer' | 'closingBalance' | 'currentBalance' | 'currentValuation') =>
    roundQuantity(summaries.reduce((sum, row) => sum + finite(row[key]), 0));

  return {
    validDateRange,
    summaryRows: summaries,
    events: eventsWithBalances,
    totals: { openingBalance: total('openingBalance'), incoming: total('incoming'), outgoing: total('outgoing'), transfer: total('transfer'),
      closingBalance: total('closingBalance'), currentBalance: total('currentBalance'), currentValuation: roundMoney(summaries.reduce((sum, row) => sum + row.currentValuation, 0)) },
    missingJournalCount: scopeEvents.filter(event => event.postingStatus === 'missing').length,
    undatedOperationCount,
    inconsistentItemBalanceCount: items.filter(item => {
      if (!item.warehouseBalances || typeof item.warehouseBalances !== 'object' || Array.isArray(item.warehouseBalances)) return false;
      const sum = Object.values(item.warehouseBalances as Record<string, unknown>).reduce<number>((total, value) => total + finite(value), 0);
      return Math.abs(roundQuantity(sum) - roundQuantity(finite(item.quantity))) > 0.01;
    }).length
  };
}

function makeSummary(
  item: Row,
  warehouseId: string,
  currentBalance: number,
  allScopeEvents: InventoryStockCardEvent[],
  periodEvents: InventoryStockCardEvent[],
  fromDate: string,
  units: Row[]
): InventoryStockCardSummary {
  const itemId = String(item.id || '');
  const changesSinceStart = allScopeEvents.filter(event => event.itemId === itemId && event.date >= fromDate)
    .reduce((sum, event) => sum + event.incoming - event.outgoing, 0);
  const openingBalance = roundQuantity(currentBalance - changesSinceStart);
  const relevant = periodEvents.filter(event => event.itemId === itemId);
  const incoming = roundQuantity(relevant.reduce((sum, event) => sum + event.incoming, 0));
  const outgoing = roundQuantity(relevant.reduce((sum, event) => sum + event.outgoing, 0));
  const transfer = roundQuantity(relevant.reduce((sum, event) => sum + event.transfer, 0));
  const closingBalance = roundQuantity(openingBalance + incoming - outgoing);
  const currentUnitCost = Math.max(0, finite(item.costPrice));
  const unit = units.find(candidate => String(candidate.id) === String(item.unitId));
  return {
    itemId, sku: String(item.sku || itemId), itemName: String(item.name || itemId), unitName: String(unit?.symbol || unit?.name || ''),
    warehouseId, openingBalance, incoming, outgoing, transfer, closingBalance, currentBalance: roundQuantity(currentBalance),
    currentUnitCost, currentValuation: roundMoney(currentBalance * currentUnitCost)
  };
}
