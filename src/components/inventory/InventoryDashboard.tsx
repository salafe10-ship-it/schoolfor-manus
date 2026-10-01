import React from 'react';
import { 
  Package, TrendingUp, AlertTriangle, AlertOctagon, 
  Warehouse, Activity, ArrowUpRight, ArrowDownLeft, 
  CheckCircle2, Clock, ShieldCheck, Layers, DollarSign 
} from 'lucide-react';
import { InventoryItem, InventoryWarehouse } from '../../types';
import { getItemWarehouseQuantity } from './inventoryCanonical';
import { inventoryReorderThreshold } from './inventoryUiPolicy';

interface InventoryDashboardProps {
  items?: InventoryItem[];
  warehouses?: InventoryWarehouse[];
  movements?: any[];
  receipts?: any[];
  onNavigateTab?: (tab: string, statusFilter?: string) => void;
}

export default function InventoryDashboard({ items = [], warehouses = [], movements = [], receipts = [], onNavigateTab }: InventoryDashboardProps) {
  // لا تُستبدل البيانات الفارغة بأرقام تجريبية؛ المصدر المركزي هو المرجع الوحيد.
  const activeItems = items.filter(item => item.status !== 'archived');
  const totalItemsCount = activeItems.length;
  const totalQuantity = activeItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalValuation = activeItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.costPrice || 0)), 0);
  const lowStockItems = activeItems.filter(i => i.quantity <= inventoryReorderThreshold(i));
  const lowStockCount = lowStockItems.length;
  const outOfStockCount = activeItems.filter(i => i.quantity === 0).length;
  const warehouseCount = warehouses.length;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const receiptMovements = receipts.filter(receipt => (receipt.isPostedToGL === true || receipt.status === 'posted_to_gl')
    && Array.isArray(receipt.lines) && receipt.lines.some((line: any) => Number(line.acceptedQty || 0) > 0)).map(receipt => {
    const acceptedLines = receipt.lines.filter((line: any) => Number(line.acceptedQty || 0) > 0);
    return {
      id: receipt.grnNo || receipt.id, date: receipt.grnDate, createdAt: receipt.createdAt, type: 'purchase', typeLabel: 'استلام مشتريات',
      itemId: acceptedLines.length === 1 ? acceptedLines[0].itemId : '',
      itemName: acceptedLines.length === 1 ? acceptedLines[0].itemName : `استلام ${acceptedLines.length} بنود`,
      quantity: acceptedLines.reduce((sum: number, line: any) => sum + Number(line.acceptedQty || 0), 0),
      warehouseTo: receipt.warehouseId, createdBy: receipt.inspectorName || 'غير مسجل', status: receipt.status,
      statusLabel: receipt.statusLabel || receipt.status
    };
  });
  const stockActivity = [...movements.filter(movement => ['approved', 'posted'].includes(String(movement.status))), ...receiptMovements];
  const dailyMovementsCount = stockActivity.filter(movement => String(movement.date || movement.createdAt || '').slice(0, 10) === todayKey).length;
  const recentTransactions = [...stockActivity]
    .sort((left, right) => String(right.date || right.createdAt || '').localeCompare(String(left.date || left.createdAt || '')))
    .slice(0, 5)
    .map(movement => {
      const item = items.find(candidate => candidate.id === movement.itemId);
      const typeLabels: Record<string, string> = {
        purchase: movement.typeLabel || 'إضافة مخزنية', issue: 'صرف داخلي', sale: 'بيع', transfer: 'تحويل بين مستودعات', adjustment: 'تسوية مخزنية'
      };
      const warehouseFrom = warehouses.find(candidate => candidate.id === movement.warehouseFrom)?.name || movement.warehouseFrom;
      const warehouseTo = warehouses.find(candidate => candidate.id === movement.warehouseTo)?.name || movement.warehouseTo;
      const warehouse = movement.type === 'transfer' && warehouseFrom && warehouseTo ? `من ${warehouseFrom} إلى ${warehouseTo}`
        : (movement.type === 'purchase' ? warehouseTo : warehouseFrom) || warehouseTo || 'غير محدد';
      const signedQuantity = movement.type === 'purchase' || (movement.type === 'adjustment' && movement.direction !== 'decrease') ? `+${movement.quantity}`
        : movement.type === 'issue' || movement.type === 'sale' || (movement.type === 'adjustment' && movement.direction === 'decrease')
          ? `-${movement.quantity}` : String(movement.quantity || 0);
      return {
        id: String(movement.id || '—'), kind: String(movement.type || ''), item: String(movement.itemName || item?.name || 'صنف غير متاح'),
        type: typeLabels[String(movement.type)] || 'حركة مخزنية', warehouse,
        user: String(movement.createdBy || 'غير مسجل'), qty: signedQuantity,
        status: String(movement.statusLabel || movement.status || 'غير محدد'), date: String(movement.date || movement.createdAt || '').slice(0, 10)
      };
    });
  const warehousesList = warehouses.map(warehouse => {
    const warehouseItems = activeItems.filter(item => getItemWarehouseQuantity(item, warehouse.id) > 0);
    const quantity = warehouseItems.reduce((sum, item) => sum + getItemWarehouseQuantity(item, warehouse.id), 0);
    const value = warehouseItems.reduce((sum, item) => sum + getItemWarehouseQuantity(item, warehouse.id) * (item.costPrice || 0), 0);
    return { name: warehouse.name, code: warehouse.id, location: warehouse.location, manager: warehouse.manager,
      itemsCount: warehouseItems.length, quantity, value, status: quantity > 0 ? 'به رصيد' : 'لا يوجد رصيد مسجل' };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-[22px] bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] p-6 text-white shadow-xl border border-[#d4af37]/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> نظام إدارة المخزون والمستودعات المعتمد
            </span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
              تقييم المخزون: المتوسط المرجح (Weighted Average)
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">لوحة مؤشرات المخزون وضبط الأصول الاستهلاكية</h2>
          <p className="text-slate-300 text-sm mt-1">متابعة فورية للكميات، حد إعادة الطلب، حركة التحويلات، والجرد الدوري للمستودعات</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigateTab && onNavigateTab('movements')}
            className="rounded-xl px-4 py-2.5 bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] hover:brightness-110 text-slate-950 text-sm font-black transition flex items-center gap-2 shadow-md"
          >
            <ArrowUpRight className="w-4 h-4" /> حركة جديدة
          </button>
          <button 
            onClick={() => onNavigateTab && onNavigateTab('reports')}
            className="rounded-xl px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-black backdrop-blur-sm transition flex items-center gap-2 border border-[#d4af37]/30"
          >
            <Layers className="w-4 h-4" /> تقارير الجرد
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="min-h-[142px] rounded-[22px] border-[1.5px] border-[#d4af37]/45 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-5 flex items-center space-x-4 space-x-reverse shadow-[0_6px_18px_rgba(91,61,16,0.12)] hover:shadow-[0_9px_24px_rgba(91,61,16,0.18)] transition">
          <div className="p-3.5 bg-orange-50 text-orange-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">إجمالي الأصناف</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalItemsCount.toLocaleString('ar-SA')}</p>
            <p className="text-[11px] text-slate-400 font-semibold">{totalQuantity.toLocaleString('ar-SA')} وحدة مخزنية</p>
          </div>
        </div>

        <div className="min-h-[142px] rounded-[22px] border-[1.5px] border-[#d4af37]/45 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-5 flex items-center space-x-4 space-x-reverse shadow-[0_6px_18px_rgba(91,61,16,0.12)] hover:shadow-[0_9px_24px_rgba(91,61,16,0.18)] transition">
          <div className="p-3.5 bg-emerald-50 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">إجمالي تقييم المخزون</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{totalValuation.toLocaleString('ar-SA')} د.ل</p>
            <p className="text-[11px] text-amber-600 font-semibold">تقييم تشغيلي؛ تظهر هوية القيد الكانوني على مستندات الترحيل</p>
          </div>
        </div>

        <div className="min-h-[142px] rounded-[22px] border-[1.5px] border-[#d4af37]/45 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-5 flex items-center space-x-4 space-x-reverse shadow-[0_6px_18px_rgba(91,61,16,0.12)]">
          <div className="p-3.5 bg-amber-100 text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-amber-900 font-bold">حد إعادة الطلب</p>
            <p className="text-xl font-black text-amber-800 mt-0.5">{lowStockCount}</p>
            <p className="text-[11px] text-amber-700 font-semibold">تتطلب طلب توريد عاجل</p>
          </div>
        </div>

        <div className="min-h-[142px] rounded-[22px] border-[1.5px] border-[#d4af37]/45 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-5 flex items-center space-x-4 space-x-reverse shadow-[0_6px_18px_rgba(91,61,16,0.12)]">
          <div className="p-3.5 bg-red-100 text-red-700">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-red-900 font-bold">أصناف منتهية / صفرية</p>
            <p className="text-xl font-black text-red-800 mt-0.5">{outOfStockCount}</p>
            <p className="text-[11px] text-red-700 font-semibold">رصيد صفري متاح</p>
          </div>
        </div>

        <div className="min-h-[142px] rounded-[22px] border-[1.5px] border-[#d4af37]/45 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-5 flex items-center space-x-4 space-x-reverse shadow-[0_6px_18px_rgba(91,61,16,0.12)]">
          <div className="p-3.5 bg-amber-50 text-amber-600">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">عدد المستودعات</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{warehouseCount}</p>
            <p className="text-[11px] text-amber-600 font-semibold">مواقع الجرد المعتمدة</p>
          </div>
        </div>

        <div className="min-h-[142px] rounded-[22px] border-[1.5px] border-[#d4af37]/45 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-5 flex items-center space-x-4 space-x-reverse shadow-[0_6px_18px_rgba(91,61,16,0.12)]">
          <div className="p-3.5 bg-slate-100 text-slate-800">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">حركات اليوم</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{dailyMovementsCount}</p>
              <p className="text-[11px] text-emerald-600 font-semibold">مستند حركة محفوظ اليوم</p>
          </div>
        </div>
      </div>

      {/* Middle Grid: Warehouses & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Warehouse Status Overview */}
        <div className="lg:col-span-6 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-amber-600" /> أرصدة المستودعات المسجلة
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">كميات وقيم محسوبة من بطاقات الأصناف وأرصدة كل مستودع؛ لا توجد سعة مادية مسجلة</p>
            </div>
            <button 
              onClick={() => onNavigateTab && onNavigateTab('warehouses')}
              className="text-xs font-bold text-amber-600 hover:text-amber-800 hover:underline"
            >
              إدارة المستودعات ⬅️
            </button>
          </div>

          <div className="space-y-3">
            {warehousesList.length === 0 && <p className="p-4 text-sm text-slate-500">لا توجد مستودعات مسجلة في المصدر المركزي.</p>}
            {warehousesList.map((wh) => (
              <div key={wh.code} className="p-3.5 bg-transparent border border-slate-100 hover:border-slate-300 transition">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-slate-800 text-sm">{wh.name} ({wh.code})</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    wh.quantity > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {wh.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{wh.location || 'الموقع غير مسجل'} • أمين المستودع: {wh.manager || 'غير محدد'}</span>
                  <span className="font-bold text-slate-700">{wh.itemsCount} صنف • {wh.quantity} وحدة • {wh.value.toLocaleString('ar-SA')} د.ل</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-6 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" /> أحدث الحركات والتحويلات المخزنية
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">سجل فوري بآخر عمليات الاستلام والصرف والتحويل</p>
            </div>
            <button 
              onClick={() => onNavigateTab && onNavigateTab('movements')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
            >
              عرض الكل ⬅️
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.length === 0 && <p className="p-4 text-sm text-slate-500">لا توجد حركات مخزنية محفوظة بعد.</p>}
            {recentTransactions.map((tr) => (
              <div key={tr.id} className="p-3.5 bg-transparent border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${
                    tr.kind === 'purchase' ? 'bg-emerald-100 text-emerald-700' :
                    tr.kind === 'issue' || tr.kind === 'sale' ? 'bg-orange-100 text-orange-700' :
                    tr.kind === 'transfer' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {tr.kind === 'purchase' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{tr.item}</span>
                      <span className="text-xs font-mono text-slate-400">({tr.id})</span>
                    </div>
                    <p className="text-xs text-slate-500">{tr.date || 'دون تاريخ'} • {tr.type} • {tr.warehouse} • بواسطة {tr.user}</p>
                  </div>
                </div>

                <div className="text-left">
                  <span className={`block font-black text-sm ${
                    tr.qty.startsWith('+') ? 'text-emerald-600' : tr.qty.startsWith('-') ? 'text-red-600' : 'text-slate-800'
                  }`}>
                    {tr.qty}
                  </span>
                  <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded mt-1">
                    {tr.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Warning Alert */}
      <div className="bg-amber-50 border border-amber-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-base">تنبيه النقص والوصول لحد إعادة الطلب!</h4>
            <p className="text-xs text-amber-800 mt-0.5">هناك {lowStockCount} أصناف بلغت أو تجاوزت الحد الأدنى المسموح به في المخزون. يرجى مراجعة المشتريات التوريدية.</p>
          </div>
        </div>
        <button 
          onClick={() => onNavigateTab && onNavigateTab('items', 'LOW')}
          className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition whitespace-nowrap"
        >
          عرض أصناف إعادة الطلب
        </button>
      </div>
    </div>
  );
}
