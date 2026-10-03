import React, { useState } from 'react';
import { 
  FileSpreadsheet, Printer, Download, Search, 
  TrendingUp, AlertTriangle, Package, Layers, BarChart3, BookOpen, CalendarDays, FilterX
} from 'lucide-react';
import { InventoryItem, InventoryUnit, InventoryWarehouse } from '../../types';
import { getTrustedAccessToken } from '../../utils/auth';
import { getItemWarehouseBalances } from './inventoryCanonical';
import { inventoryReorderThreshold } from './inventoryUiPolicy';
import { useInventoryPrint } from './InventoryPrintProvider';
import { buildInventoryStockCard } from '../../modules/inventory/domain/InventoryStockCard';

interface InventoryReportsProps {
  items: InventoryItem[];
  movements?: any[];
  receipts?: any[];
  stocktakes?: any[];
  warehouses?: InventoryWarehouse[];
  units?: InventoryUnit[];
  canonicalVersion: number;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

const localDate = (date = new Date()) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const displayNumber = (value: number) => Number(value || 0).toLocaleString('ar-LY', { maximumFractionDigits: 4 });

export default function InventoryReports({ items, movements = [], receipts = [], stocktakes = [], warehouses = [], units = [], canonicalVersion, triggerNotification }: InventoryReportsProps) {
  const [activeReport, setActiveReport] = useState<'valuation' | 'reorder' | 'turnover' | 'variances' | 'stock-card'>('valuation');
  const [stockCardFilters, setStockCardFilters] = useState(() => {
    const today = localDate();
    return { fromDate: `${today.slice(0, 8)}01`, toDate: today, itemId: '', warehouseId: '' };
  });
  const print = useInventoryPrint();
  const stockCard = buildInventoryStockCard({ items, movements, receipts, stocktakes, warehouses, units, filters: stockCardFilters });
  const activeItems = items.filter(item => item.status !== 'archived');
  const reorderItems = activeItems.filter(item => item.quantity <= inventoryReorderThreshold(item));
  const valuationRows = activeItems.flatMap(item => {
    const balances = getItemWarehouseBalances(item);
    const locations = Object.entries(balances);
    return (locations.length ? locations : [[item.warehouseId || '', Number(item.quantity || 0)] as [string, number]])
      .map(([warehouseId, quantity]) => ({ item, warehouseId, quantity: Number(quantity || 0) }));
  });
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const periodMovements = movements.filter(movement => {
    if (!['approved', 'posted'].includes(String(movement.status))) return false;
    const timestamp = Date.parse(String(movement.date || movement.createdAt || ''));
    return Number.isFinite(timestamp) && timestamp >= cutoff && movement.type !== 'transfer';
  });
  const movementSummary = new Map<string, { received: number; issued: number; docs: number }>();
  for (const movement of periodMovements) {
    const itemId = String(movement.itemId || '');
    const summary = movementSummary.get(itemId) || { received: 0, issued: 0, docs: 0 };
    const quantity = Number(movement.quantity || 0);
    if (movement.type === 'purchase' || (movement.type === 'adjustment' && movement.direction !== 'decrease')) summary.received += quantity;
    if (movement.type === 'issue' || movement.type === 'sale' || (movement.type === 'adjustment' && movement.direction === 'decrease')) summary.issued += quantity;
    summary.docs += 1;
    movementSummary.set(itemId, summary);
  }
  for (const receipt of receipts) {
    const timestamp = Date.parse(String(receipt.grnDate || receipt.createdAt || ''));
    if ((!receipt.isPostedToGL && receipt.status !== 'posted_to_gl') || !Number.isFinite(timestamp) || timestamp < cutoff) continue;
    const acceptedByItem = new Map<string, number>();
    for (const line of Array.isArray(receipt.lines) ? receipt.lines : []) {
      const itemId = String(line.itemId || line.itemCode || '');
      const quantity = Number(line.acceptedQty || 0);
      if (itemId && quantity > 0) acceptedByItem.set(itemId, (acceptedByItem.get(itemId) || 0) + quantity);
    }
    for (const [itemReference, quantity] of acceptedByItem) {
      const item = items.find(candidate => candidate.id === itemReference || candidate.sku === itemReference);
      if (!item) continue;
      const summary = movementSummary.get(item.id) || { received: 0, issued: 0, docs: 0 };
      summary.received += quantity;
      summary.docs += 1;
      movementSummary.set(item.id, summary);
    }
  }
  const turnoverRows = [...movementSummary.entries()].map(([itemId, summary]) => ({
    item: items.find(candidate => candidate.id === itemId), itemId, ...summary
  })).filter(row => row.item).sort((left, right) => right.issued - left.issued);
  const slowMovingItems = activeItems.filter(item => item.quantity > 0 && !(movementSummary.get(item.id)?.issued)).slice(0, 10);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const auditReport = async (format: 'csv' | 'print', filters?: typeof stockCardFilters) => {
    const token = getTrustedAccessToken();
    if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
    const response = await fetch('/api/inventory/reports/audit', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportType: activeReport, format, expectedVersion: canonicalVersion, ...(filters ? { filters } : {}) })
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر تدقيق مصدر التقرير.');
  };

  const handleExportCSV = async () => {
    try { await auditReport('csv', activeReport === 'stock-card' ? stockCardFilters : undefined); } catch (error: any) { notify(error?.message || 'تعذر تصدير التقرير.', 'danger'); return; }
    const rows: unknown[][] = activeReport === 'valuation'
      ? [['رمز الصنف', 'اسم الصنف', 'الفئة', 'الرصيد بالمستودع', 'تكلفة الوحدة', 'إجمالي التقييم', 'المستودع'],
        ...valuationRows.map(({ item, warehouseId, quantity }) => [item.sku || item.id, item.name, item.categoryId, quantity, item.costPrice, quantity * item.costPrice,
          warehouses.find(warehouse => warehouse.id === warehouseId)?.name || warehouseId || 'غير محدد'])]
      : activeReport === 'reorder'
        ? [['رمز الصنف', 'اسم الصنف', 'الرصيد', 'نقطة إعادة الطلب', 'الحد الأعلى'],
           ...reorderItems.map(item => [item.sku, item.name, item.quantity, inventoryReorderThreshold(item), item.maxLevel])]
        : activeReport === 'turnover'
          ? [['رمز الصنف', 'اسم الصنف', 'الوارد المرصود خلال 90 يوماً', 'الصرف المرصود خلال 90 يوماً', 'عدد المستندات'],
            ...turnoverRows.map(row => [row.item?.sku, row.item?.name, row.received, row.issued, row.docs])]
          : activeReport === 'variances'
            ? [['رقم محضر الجرد', 'الصنف', 'المستودع', 'الرصيد الدفتري', 'الفعلي', 'الفارق', 'الأثر المالي', 'الحالة'],
            ...stocktakes.map(row => [row.id, row.itemName, warehouses.find(warehouse => warehouse.id === (row.warehouseId || row.warehouse))?.name || row.warehouse,
              row.bookQty, row.actualQty, row.discrepancy, row.financialImpact, row.statusLabel || row.status])]
            : stockCardFilters.itemId
              ? [['التاريخ', 'رقم العملية المخزنية', 'النوع', 'المستودع', 'الوارد', 'المنصرف', 'تحويل داخلي', 'الرصيد بعد الحركة', 'قيمة الحركة', 'رقم قيد اليومية', 'حالة الربط'],
                ...stockCard.events.map(event => [event.date, event.operationNo, event.typeLabel,
                  event.type === 'transfer' ? `${warehouses.find(row => row.id === event.warehouseFromId)?.name || event.warehouseFromId} ← ${warehouses.find(row => row.id === event.warehouseToId)?.name || event.warehouseToId}` : warehouses.find(row => row.id === event.warehouseId)?.name || event.warehouseId || 'غير محدد',
                  event.incoming, event.outgoing, event.transfer, event.balanceAfter, event.amount, event.journalEntryId || '', event.postingStatus])]
              : [['رمز الصنف', 'اسم الصنف', 'الوحدة', 'النطاق', 'رصيد أول المدة', 'الوارد', 'المنصرف', 'التحويلات الداخلية', 'رصيد آخر المدة', 'الرصيد الحالي', 'التقييم الحالي'],
                ...stockCard.summaryRows.map(row => [row.sku, row.itemName, row.unitName,
                  stockCardFilters.warehouseId ? warehouses.find(value => value.id === stockCardFilters.warehouseId)?.name : 'كل المستودعات',
                  row.openingBalance, row.incoming, row.outgoing, row.transfer, row.closingBalance, row.currentBalance, row.currentValuation])];
    const escape = (value: unknown) => {
      const raw = String(value ?? '');
      const safe = typeof value === 'string' && /^[\t\r ]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const csvContent = `\uFEFF${rows.map(row => row.map(escape).join(',')).join('\r\n')}`;
    const objectUrl = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `edupro_inventory_${activeReport}_${Date.now()}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(objectUrl);
    notify('تم تصدير التقرير الحالي بصيغة CSV بنجاح 📊', 'success');
  };

  const handlePrint = async () => {
    if (!print) { notify('مسار الطباعة غير متاح.', 'warning'); return; }
    if (activeReport === 'stock-card') {
      const detailed = Boolean(stockCardFilters.itemId);
      await print({ title: detailed ? 'بطاقة حركة صنف مخزني' : 'ملخص حركة المخزون',
        number: detailed ? stockCardFilters.itemId : undefined, date: `${stockCardFilters.fromDate} — ${stockCardFilters.toDate}`,
        status: 'بيانات من السجل المخزني المركزي', reportType: 'stock-card', reportFilters: stockCardFilters,
        columns: detailed ? ['التاريخ', 'رقم العملية المخزنية', 'النوع', 'المستودع / التحويل', 'الوارد', 'المنصرف', 'التحويل', 'الرصيد بعد الحركة', 'قيمة الحركة', 'رقم قيد اليومية']
          : ['SKU', 'الصنف', 'الوحدة', 'رصيد أول المدة', 'الوارد', 'المنصرف', 'التحويلات', 'رصيد آخر المدة'],
        rows: detailed ? stockCard.events.map(event => [event.date, event.operationNo, event.typeLabel,
          event.type === 'transfer' ? `${warehouses.find(row => row.id === event.warehouseFromId)?.name || event.warehouseFromId} ← ${warehouses.find(row => row.id === event.warehouseToId)?.name || event.warehouseToId}` : warehouses.find(row => row.id === event.warehouseId)?.name || event.warehouseId || 'غير محدد',
          event.incoming, event.outgoing, event.transfer, event.balanceAfter, `${event.amount.toLocaleString('ar-LY')} د.ل`, event.journalEntryId || (event.postingStatus === 'not_required' ? 'لا يتطلب قيداً مالياً' : 'قيد غير مربوط')])
          : stockCard.summaryRows.map(row => [row.sku, row.itemName, row.unitName, row.openingBalance, row.incoming, row.outgoing, row.transfer, row.closingBalance]),
        summary: `${stockCardFilters.fromDate} إلى ${stockCardFilters.toDate} • ${stockCardFilters.warehouseId ? warehouses.find(row => row.id === stockCardFilters.warehouseId)?.name || 'المستودع المحدد' : 'كل المستودعات'}` });
      return;
    }
    const model = activeReport === 'valuation'
      ? { title: 'تقييم المخزون حسب المستودع', columns: ['الكود', 'الصنف', 'المستودع', 'الرصيد', 'تكلفة الوحدة', 'القيمة'],
          rows: valuationRows.map(({ item, warehouseId, quantity }) => [item.sku, item.name, warehouses.find(row => row.id === warehouseId)?.name || warehouseId, quantity, item.costPrice, quantity * item.costPrice]) }
      : activeReport === 'reorder'
        ? { title: 'أصناف إعادة الطلب', columns: ['الكود', 'الصنف', 'الرصيد', 'نقطة إعادة الطلب', 'الحد الأعلى'], rows: reorderItems.map(item => [item.sku, item.name, item.quantity, inventoryReorderThreshold(item), item.maxLevel]) }
        : activeReport === 'turnover'
          ? { title: 'حركة المخزون خلال 90 يوماً', columns: ['الكود', 'الصنف', 'الوارد', 'الصرف', 'عدد المستندات'], rows: turnoverRows.map(row => [row.item?.sku, row.item?.name, row.received, row.issued, row.docs]) }
          : { title: 'فروق الجرد', columns: ['المحضر', 'الصنف', 'المستودع', 'الدفتري', 'الفعلي', 'الفرق', 'الأثر المالي', 'الحالة'], rows: stocktakes.map(row => [row.id, row.itemName, row.warehouse, row.bookQty, row.actualQty, row.discrepancy, row.financialImpact, row.statusLabel || row.status]) };
    await print({ ...model, reportType: activeReport });
  };

  return (
    <div className="space-y-6">
      {/* Report Switcher & Toolbar */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-600" /> تقارير وتحليلات المخزون والمستودعات
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">تقارير التقييم المالي، الأصناف الحرجة، حركة المخزون، والربط مع الأستاذ العام</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> تصدير CSV
          </button>
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" /> طباعة / حفظ PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-4 flex flex-wrap gap-2">
        <button 
          onClick={() => setActiveReport('valuation')}
          className={`px-5 py-2.5 font-bold text-sm transition flex items-center gap-2 ${
            activeReport === 'valuation' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'bg-transparent text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> تقرير تقييم المخزون المالي
        </button>

        <button 
          onClick={() => setActiveReport('reorder')}
          className={`px-5 py-2.5 font-bold text-sm transition flex items-center gap-2 ${
            activeReport === 'reorder' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'bg-transparent text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> الأصناف الحرجة وإعادة الطلب
        </button>

        <button 
          onClick={() => setActiveReport('turnover')}
          className={`px-5 py-2.5 font-bold text-sm transition flex items-center gap-2 ${
            activeReport === 'turnover' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'bg-transparent text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> حركة الأصناف خلال 90 يوماً
        </button>
        <button
          onClick={() => setActiveReport('variances')}
          className={`px-5 py-2.5 font-bold text-sm transition flex items-center gap-2 ${
            activeReport === 'variances' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'bg-transparent text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> فروقات الجرد
        </button>
        <button
          onClick={() => setActiveReport('stock-card')}
          className={`px-5 py-2.5 font-bold text-sm transition flex items-center gap-2 ${
            activeReport === 'stock-card' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'bg-transparent text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'
          }`}
        >
          <BookOpen className="w-4 h-4" /> بطاقة الصنف وحركة المخزون
        </button>
      </div>

      {activeReport === 'stock-card' && (
        <section className="overflow-hidden rounded-2xl border border-amber-900/15 bg-white/70 shadow-sm" dir="rtl" aria-label="بطاقة الصنف وحركة المخزون">
          <header className="flex flex-col gap-2 border-b border-amber-900/10 bg-gradient-to-l from-[#2a1d13] to-[#4a321d] p-5 text-amber-50 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-amber-300/15 p-3 text-amber-200"><BookOpen className="h-5 w-5" /></span>
              <div><h4 className="text-base font-black">بطاقة حركة الصنف والأرصدة حسب الفترة</h4>
                <p className="mt-1 text-xs text-amber-100/75">اختر فترة وصنفاً ومستودعاً، أو اعرض ملخص المخزون بالكامل.</p></div>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-100/80"><CalendarDays className="h-4 w-4" />
              <span>{stockCardFilters.fromDate} — {stockCardFilters.toDate}</span></div>
          </header>

          <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <label className="text-xs font-bold text-slate-700">من تاريخ
              <input aria-label="من تاريخ" type="date" value={stockCardFilters.fromDate} onChange={event => setStockCardFilters(current => ({ ...current, fromDate: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-bold text-slate-700">إلى تاريخ
              <input aria-label="إلى تاريخ" type="date" value={stockCardFilters.toDate} onChange={event => setStockCardFilters(current => ({ ...current, toDate: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-bold text-slate-700">الصنف
              <select aria-label="الصنف" value={stockCardFilters.itemId} onChange={event => setStockCardFilters(current => ({ ...current, itemId: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">كل الأصناف</option>
                {items.map(item => <option key={item.id} value={item.id}>{item.sku ? `${item.sku} — ` : ''}{item.name}{item.status === 'archived' ? ' (مؤرشف)' : ''}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">المستودع
              <select aria-label="المستودع" value={stockCardFilters.warehouseId} onChange={event => setStockCardFilters(current => ({ ...current, warehouseId: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">كل المستودعات</option>
                {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => {
              const today = localDate();
              setStockCardFilters({ fromDate: `${today.slice(0, 8)}01`, toDate: today, itemId: '', warehouseId: '' });
            }} className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              <FilterX className="h-4 w-4" /> إعادة الضبط
            </button>
          </div>

          {!stockCard.validDateRange && <p role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">تحقق من تاريخ البداية والنهاية؛ نطاق الفترة غير صالح.</p>}
          {stockCard.missingJournalCount > 0 && <p role="alert" className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
            توجد {stockCard.missingJournalCount} حركة ذات قيمة مالية بلا مرجع قيد يومية؛ هذه تحتاج مراجعة قبل اعتماد التقرير المالي.
          </p>}
          {(stockCard.undatedOperationCount > 0 || stockCard.inconsistentItemBalanceCount > 0) && <p role="alert" className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">
            تحقق من جودة المصدر: {stockCard.undatedOperationCount > 0 ? `${stockCard.undatedOperationCount} مستند بلا تاريخ صالح. ` : ''}
            {stockCard.inconsistentItemBalanceCount > 0 ? `${stockCard.inconsistentItemBalanceCount} بطاقة لا يطابق إجماليها مجموع أرصدة المستودعات.` : ''}
          </p>}

          {stockCard.validDateRange && <>
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['رصيد أول المدة', stockCard.totals.openingBalance, 'text-slate-900'],
              ['الوارد خلال الفترة', stockCard.totals.incoming, 'text-emerald-700'],
              ['المنصرف خلال الفترة', stockCard.totals.outgoing, 'text-rose-700'],
              ['رصيد آخر المدة', stockCard.totals.closingBalance, 'text-amber-800']
            ].map(([label, value, color]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold text-slate-500">{label}</p><p className={`mt-2 text-2xl font-black ${color}`}>{displayNumber(Number(value))}</p>
              <p className="mt-1 text-[10px] text-slate-400">وحدة مخزنية</p>
            </div>)}
          </div>

          <p className="mx-4 rounded-lg bg-slate-50 p-3 text-[11px] leading-6 text-slate-600">
            رصيد أول المدة يُعاد بناؤه من الرصيد المركزي مطروحاً منه صافي الحركات المسجلة من تاريخ البداية فصاعداً. رقم قيد اليومية هو مرجع القيد الكانوني نفسه الظاهر في الأستاذ العام؛ التحويل بين مستودعين لا ينشئ قيداً لأنه لا يغيّر إجمالي المخزون.
          </p>

          {stockCardFilters.itemId ? (
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div><h5 className="font-black text-slate-900">{items.find(item => item.id === stockCardFilters.itemId)?.name || 'بطاقة الصنف'}</h5>
                  <p className="mt-1 font-mono text-xs text-slate-500">{items.find(item => item.id === stockCardFilters.itemId)?.sku || stockCardFilters.itemId}</p></div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">{stockCard.events.length} حركة مسجلة • {stockCardFilters.warehouseId ? warehouses.find(row => row.id === stockCardFilters.warehouseId)?.name || 'المستودع المحدد' : 'كل المستودعات'}</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[1100px] text-right text-xs">
                  <thead className="bg-[#2a1d13] text-[#fce79a]"><tr>
                    <th className="px-3 py-3">التاريخ</th><th className="px-3 py-3">رقم العملية المخزنية</th><th className="px-3 py-3">نوع الحركة</th>
                    <th className="px-3 py-3">المستودع / المسار</th><th className="px-3 py-3">الوارد</th><th className="px-3 py-3">المنصرف</th>
                    <th className="px-3 py-3">تحويل داخلي</th><th className="px-3 py-3">الرصيد بعد الحركة</th><th className="px-3 py-3">القيمة</th><th className="px-3 py-3">رقم قيد اليومية</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {stockCard.events.map(event => <tr key={event.id} className="align-top hover:bg-amber-50/40">
                      <td className="px-3 py-3 whitespace-nowrap">{event.date}</td>
                      <td className="px-3 py-3"><bdi className="font-mono font-bold text-slate-900">{event.operationNo}</bdi>{event.referenceNo && <small className="block mt-1 text-slate-500">مرجع: {event.referenceNo}</small>}</td>
                      <td className="px-3 py-3 font-bold">{event.typeLabel}</td>
                      <td className="px-3 py-3">{event.type === 'transfer'
                        ? `${warehouses.find(row => row.id === event.warehouseFromId)?.name || event.warehouseFromId} ← ${warehouses.find(row => row.id === event.warehouseToId)?.name || event.warehouseToId}`
                        : warehouses.find(row => row.id === event.warehouseId)?.name || event.warehouseId || 'غير محدد'}</td>
                      <td className="px-3 py-3 font-bold text-emerald-700">{event.incoming ? displayNumber(event.incoming) : '—'}</td>
                      <td className="px-3 py-3 font-bold text-rose-700">{event.outgoing ? displayNumber(event.outgoing) : '—'}</td>
                      <td className="px-3 py-3 text-indigo-700">{event.transfer ? displayNumber(event.transfer) : '—'}</td>
                      <td className="px-3 py-3 font-black">{displayNumber(Number(event.balanceAfter || 0))}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{displayNumber(event.amount)} د.ل</td>
                      <td className="max-w-64 break-all px-3 py-3 font-mono text-[10px]">{event.journalEntryId
                        ? <span dir="ltr">{event.journalEntryId}</span>
                        : event.postingStatus === 'not_required' ? <span className="font-sans text-slate-500">لا يتطلب قيداً مالياً</span>
                          : <span className="font-sans font-bold text-red-700">قيد غير مربوط</span>}</td>
                    </tr>)}
                    {stockCard.events.length === 0 && <tr><td colSpan={10} className="py-10 text-center text-slate-500">لا توجد حركات معتمدة ضمن هذه الفترة والنطاق.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[850px] text-right text-sm">
                <thead className="bg-[#2a1d13] text-[#fce79a]"><tr>
                  <th className="px-3 py-3">SKU</th><th className="px-3 py-3">الصنف</th><th className="px-3 py-3">الوحدة</th><th className="px-3 py-3">النطاق</th>
                  <th className="px-3 py-3">رصيد أول المدة</th><th className="px-3 py-3">الوارد</th><th className="px-3 py-3">المنصرف</th><th className="px-3 py-3">التحويل</th><th className="px-3 py-3">رصيد آخر المدة</th><th className="px-3 py-3">فتح البطاقة</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {stockCard.summaryRows.map(row => <tr key={`${row.itemId}:${row.warehouseId || '*'}`}>
                    <td className="px-3 py-3 font-mono">{row.sku}</td><td className="px-3 py-3 font-bold">{row.itemName}</td><td className="px-3 py-3">{row.unitName || '—'}</td>
                    <td className="px-3 py-3">{stockCardFilters.warehouseId ? warehouses.find(value => value.id === stockCardFilters.warehouseId)?.name || stockCardFilters.warehouseId : 'كل المستودعات'}</td>
                    <td className="px-3 py-3">{displayNumber(row.openingBalance)}</td><td className="px-3 py-3 text-emerald-700">{displayNumber(row.incoming)}</td>
                    <td className="px-3 py-3 text-rose-700">{displayNumber(row.outgoing)}</td><td className="px-3 py-3 text-indigo-700">{displayNumber(row.transfer)}</td>
                    <td className="px-3 py-3 font-black">{displayNumber(row.closingBalance)}</td>
                    <td className="px-3 py-3"><button type="button" onClick={() => setStockCardFilters(current => ({ ...current, itemId: row.itemId }))}
                      className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-950 hover:bg-amber-200">عرض الحركات</button></td>
                  </tr>)}
                  {stockCard.summaryRows.length === 0 && <tr><td colSpan={10} className="py-10 text-center text-slate-500">لا توجد أصناف في النطاق المحدد.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          </>}
        </section>
      )}

      {/* Valuation Report View */}
      {activeReport === 'valuation' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base">كشف التقييم المالي الشامل للمخزون حسب التكلفة</h4>
            <span className="text-xs font-bold text-slate-500">سجلات صنف/مستودع: {valuationRows.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#2a1d13] text-[#fce79a] font-bold text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">الكود / SKU</th>
                  <th className="px-4 py-3">اسم الصنف</th>
                  <th className="px-4 py-3 text-center">الكمية المتوفرة</th>
                  <th className="px-4 py-3">تكلفة الوحدة</th>
                  <th className="px-4 py-3">سعر الصرف/البيع</th>
                  <th className="px-4 py-3">إجمالي القيمة التقييمية</th>
                  <th className="px-4 py-3">المستودع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                {valuationRows.map(({ item, warehouseId, quantity }) => (
                  <tr key={`${item.id}:${warehouseId}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{item.sku || item.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-center font-black">{quantity}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{item.costPrice.toLocaleString('ar-SA')} د.ل</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">{item.salePrice.toLocaleString('ar-SA')} د.ل</td>
                    <td className="px-4 py-3 font-black text-amber-700">
                      {(quantity * item.costPrice).toLocaleString('ar-SA')} د.ل
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-semibold">{warehouses.find(warehouse => warehouse.id === warehouseId)?.name || warehouseId || 'غير محدد'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reorder Report View */}
      {activeReport === 'reorder' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base">تقرير الأصناف المنخفضة البالغة حد الطلب</h4>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              تتطلب إصدار طلبات توفير عاجلة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#2a1d13] text-[#fce79a] font-bold text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">اسم الصنف</th>
                  <th className="px-4 py-3 text-center">الكمية الحالية</th>
                  <th className="px-4 py-3 text-center">نقطة إعادة الطلب</th>
                  <th className="px-4 py-3 text-center">الكمية المقترحة للطلب</th>
                  <th className="px-4 py-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  {reorderItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                      لا توجد أصناف متجاوزة لحد الأدنى حالياً 👍
                    </td>
                  </tr>
                ) : (
                  reorderItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-center font-black text-red-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{inventoryReorderThreshold(item)}</td>
                      <td className="px-4 py-3 text-center font-black text-emerald-700">{item.maxLevel > 0 ? Math.max(0, item.maxLevel - item.quantity) : 'غير محدد'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-bold">
                          طلب توريد عاجل
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Turnover Report View */}
      {activeReport === 'turnover' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base">حركة الأصناف المرصودة خلال آخر 90 يوماً</h4>
          </div>
          <p className="text-xs text-slate-600">يعرض هذا الكشف مستندات الحركة المعتمدة فقط. لا نحسب نسبة دوران مخزون معيارية لأن متوسط الرصيد التاريخي غير متاح في نموذج البيانات الحالي.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 space-y-2">
              <h5 className="font-black text-emerald-900 text-sm">الأكثر صرفاً بحسب مستندات هذه المدرسة</h5>
              {turnoverRows.filter(row => row.issued > 0).slice(0, 5).map(row => <p key={row.itemId} className="text-xs text-emerald-800">{row.item?.name} — {row.issued} وحدة صرف</p>)}
              {turnoverRows.filter(row => row.issued > 0).length === 0 && <p className="text-xs text-slate-600">لا توجد حركات صرف معتمدة في الفترة.</p>}
            </div>

            <div className="p-4 bg-transparent space-y-2">
              <h5 className="font-black text-slate-900 text-sm">أصناف برصيد لم يظهر لها صرف في الفترة</h5>
              {slowMovingItems.slice(0, 5).map(item => <p key={item.id} className="text-xs text-slate-600">{item.name} — رصيد {item.quantity}</p>)}
              {slowMovingItems.length === 0 && <p className="text-xs text-slate-600">لا توجد أصناف راكدة ذات رصيد بناءً على الحركات المرصودة.</p>}
            </div>
          </div>
        </div>
      )}

      {activeReport === 'variances' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base">محاضر الجرد وفروقات الرصيد</h4>
            <span className="text-xs font-bold text-slate-500">{stocktakes.length} محضر</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#2a1d13] text-[#fce79a] font-bold text-xs"><tr>
                <th className="px-4 py-3">المحضر</th><th className="px-4 py-3">الصنف</th><th className="px-4 py-3">المستودع</th>
                <th className="px-4 py-3">دفترى</th><th className="px-4 py-3">فعلي</th><th className="px-4 py-3">الفارق</th><th className="px-4 py-3">الحالة</th>
              </tr></thead>
              <tbody className="divide-y divide-amber-900/10 bg-white/60">
                {stocktakes.map(row => <tr key={row.id}>
                  <td className="px-4 py-3 font-mono">{row.id}</td><td className="px-4 py-3 font-bold">{row.itemName || items.find(item => item.id === row.itemId)?.name || 'غير متاح'}</td>
                  <td className="px-4 py-3">{warehouses.find(warehouse => warehouse.id === (row.warehouseId || row.warehouse))?.name || row.warehouse || 'غير محدد'}</td>
                  <td className="px-4 py-3">{Number(row.bookQty || 0)}</td><td className="px-4 py-3">{Number(row.actualQty || 0)}</td>
                  <td className="px-4 py-3 font-bold">{Number(row.discrepancy ?? Number(row.actualQty || 0) - Number(row.bookQty || 0))}</td>
                  <td className="px-4 py-3">{row.statusLabel || row.status}</td>
                </tr>)}
                {stocktakes.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-500">لا توجد محاضر جرد مسجلة.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
