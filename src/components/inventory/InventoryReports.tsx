import React, { useState } from 'react';
import { 
  FileSpreadsheet, Printer, Download, Search, 
  TrendingUp, AlertTriangle, Package, Layers, BarChart3 
} from 'lucide-react';
import { InventoryItem, InventoryWarehouse } from '../../types';
import { getTrustedAccessToken } from '../../utils/auth';
import { getItemWarehouseBalances } from './inventoryCanonical';

interface InventoryReportsProps {
  items: InventoryItem[];
  movements?: any[];
  receipts?: any[];
  stocktakes?: any[];
  warehouses?: InventoryWarehouse[];
  canonicalVersion: number;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function InventoryReports({ items, movements = [], receipts = [], stocktakes = [], warehouses = [], canonicalVersion, triggerNotification }: InventoryReportsProps) {
  const [activeReport, setActiveReport] = useState<'valuation' | 'reorder' | 'turnover' | 'variances'>('valuation');
  const activeItems = items.filter(item => item.status !== 'archived');
  const reorderItems = activeItems.filter(item => item.quantity <= (item.reorderLevel || item.minLevel || 0));
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

  const auditReport = async (format: 'csv' | 'print') => {
    const token = getTrustedAccessToken();
    if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
    const response = await fetch('/api/inventory/reports/audit', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportType: activeReport, format, expectedVersion: canonicalVersion })
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر تدقيق مصدر التقرير.');
  };

  const handleExportCSV = async () => {
    try { await auditReport('csv'); } catch (error: any) { notify(error?.message || 'تعذر تصدير التقرير.', 'danger'); return; }
    const rows: unknown[][] = activeReport === 'valuation'
      ? [['رمز الصنف', 'اسم الصنف', 'الفئة', 'الرصيد بالمستودع', 'تكلفة الوحدة', 'إجمالي التقييم', 'المستودع'],
        ...valuationRows.map(({ item, warehouseId, quantity }) => [item.sku || item.id, item.name, item.categoryId, quantity, item.costPrice, quantity * item.costPrice,
          warehouses.find(warehouse => warehouse.id === warehouseId)?.name || warehouseId || 'غير محدد'])]
      : activeReport === 'reorder'
        ? [['رمز الصنف', 'اسم الصنف', 'الرصيد', 'نقطة إعادة الطلب', 'الحد الأعلى'],
          ...reorderItems.map(item => [item.sku, item.name, item.quantity, item.reorderLevel || item.minLevel, item.maxLevel])]
        : activeReport === 'turnover'
          ? [['رمز الصنف', 'اسم الصنف', 'الوارد المرصود خلال 90 يوماً', 'الصرف المرصود خلال 90 يوماً', 'عدد المستندات'],
            ...turnoverRows.map(row => [row.item?.sku, row.item?.name, row.received, row.issued, row.docs])]
          : [['رقم محضر الجرد', 'الصنف', 'المستودع', 'الرصيد الدفتري', 'الفعلي', 'الفارق', 'الأثر المالي', 'الحالة'],
            ...stocktakes.map(row => [row.id, row.itemName, warehouses.find(warehouse => warehouse.id === (row.warehouseId || row.warehouse))?.name || row.warehouse,
              row.bookQty, row.actualQty, row.discrepancy, row.financialImpact, row.statusLabel || row.status])];
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
    try { await auditReport('print'); } catch (error: any) { notify(error?.message || 'تعذر طباعة التقرير.', 'danger'); return; }
    window.print();
    notify('تم تجهيز التقرير وإرساله للطباعة 🖨️', 'info');
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
            <Printer className="w-4 h-4" /> طباعة / PDF
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
      </div>

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
                  <th className="px-4 py-3 text-center">الحد الأدنى</th>
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
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{item.minLevel}</td>
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
