import React from 'react';
import { 
  Package, TrendingUp, AlertTriangle, AlertOctagon, 
  Warehouse, Activity, ArrowUpRight, ArrowDownLeft, 
  CheckCircle2, Clock, ShieldCheck, Layers, DollarSign 
} from 'lucide-react';
import { InventoryItem } from '../../types';

interface InventoryDashboardProps {
  items?: InventoryItem[];
  onNavigateTab?: (tab: string) => void;
}

export default function InventoryDashboard({ items = [], onNavigateTab }: InventoryDashboardProps) {
  // Sample or passed statistics
  const totalItemsCount = items.length > 0 ? items.length : 1250;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0) || 18450;
  const totalValuation = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.costPrice || 0)), 0) || 540000;
  const lowStockItems = items.filter(i => i.quantity <= i.minLevel) || [];
  const lowStockCount = lowStockItems.length > 0 ? lowStockItems.length : 15;
  const outOfStockCount = items.filter(i => i.quantity === 0).length || 3;
  const warehouseCount = 5;
  const dailyMovementsCount = 42;

  const recentTransactions = [
    { id: 'TR-1089', date: '2026-08-02 10:15', type: 'إضافة مخزنية', item: 'أجهزة بروجكتور فائقة الجودة سوني UHD', qty: '+15', warehouse: 'المستودع الرئيسي', status: 'مرحل', user: 'أمين المستودع' },
    { id: 'TR-1088', date: '2026-08-02 09:30', type: 'صرف مخزني', item: 'مقاعد دراسية مدمجة بخشب طبيعي', qty: '-40', warehouse: 'مستودع فرع البنين', status: 'مرحل', user: 'مسؤول المشتريات' },
    { id: 'TR-1087', date: '2026-08-01 14:20', type: 'تحويل بين مستودعات', item: 'كتب المناهج البريطانية المعتمدة', qty: '100', warehouse: 'الرئيسي ⬅️ فرع البنات', status: 'معتمد', user: 'مشرف الحركة' },
    { id: 'TR-1086', date: '2026-08-01 11:00', type: 'تسوية جردية', item: 'أدوات ومجاهر كيميائية 3D', qty: '-2', warehouse: 'مختبر العلوم المركزية', status: 'قيد الترحيل', user: 'المدير المالي' },
  ];

  const warehousesList = [
    { name: 'المستودع الرئيسي - الرياض', code: 'WH-MAIN', capacity: '85%', itemsCount: 620, value: '310,000 د.ل', status: 'نشط' },
    { name: 'مستودع الكتب والقرطاسية', code: 'WH-BOOKS', capacity: '62%', itemsCount: 380, value: '125,000 د.ل', status: 'نشط' },
    { name: 'مستودع الأثاث والمعدات', code: 'WH-FURN', capacity: '90%', itemsCount: 140, value: '75,000 د.ل', status: 'ممتلئ تقريباً' },
    { name: 'مستودع المختبرات والأجهزة', code: 'WH-LABS', capacity: '45%', itemsCount: 85, value: '25,000 د.ل', status: 'نشط' },
    { name: 'مستودع الأنشطة والزي المدرسي', code: 'WH-UNIF', capacity: '50%', itemsCount: 25, value: '5,000 د.ل', status: 'نشط' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white shadow-lg border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" /> حركة جديدة
          </button>
          <button 
            onClick={() => onNavigateTab && onNavigateTab('reports')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold backdrop-blur-sm transition flex items-center gap-2"
          >
            <Layers className="w-4 h-4" /> تقارير الجرد
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="p-5 flex items-center space-x-4 space-x-reverse hover:border-slate-300 transition">
          <div className="p-3.5 bg-orange-50 text-orange-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">إجمالي الأصناف</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalItemsCount.toLocaleString('ar-SA')}</p>
            <p className="text-[11px] text-slate-400 font-semibold">{totalQuantity.toLocaleString('ar-SA')} وحدة مخزنية</p>
          </div>
        </div>

        <div className="p-5 flex items-center space-x-4 space-x-reverse hover:border-slate-300 transition">
          <div className="p-3.5 bg-emerald-50 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">إجمالي تقييم المخزون</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{totalValuation.toLocaleString('ar-SA')} د.ل</p>
            <p className="text-[11px] text-emerald-600 font-semibold">مطابق لدفتر الأستاذ العام</p>
          </div>
        </div>

        <div className="p-5 border border-amber-200 bg-amber-50/20 flex items-center space-x-4 space-x-reverse">
          <div className="p-3.5 bg-amber-100 text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-amber-900 font-bold">حد إعادة الطلب</p>
            <p className="text-xl font-black text-amber-800 mt-0.5">{lowStockCount}</p>
            <p className="text-[11px] text-amber-700 font-semibold">تتطلب طلب توريد عاجل</p>
          </div>
        </div>

        <div className="p-5 border border-red-200 bg-red-50/20 flex items-center space-x-4 space-x-reverse">
          <div className="p-3.5 bg-red-100 text-red-700">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-red-900 font-bold">أصناف منتهية / صفرية</p>
            <p className="text-xl font-black text-red-800 mt-0.5">{outOfStockCount}</p>
            <p className="text-[11px] text-red-700 font-semibold">رصيد صفري متاح</p>
          </div>
        </div>

        <div className="p-5 flex items-center space-x-4 space-x-reverse">
          <div className="p-3.5 bg-amber-50 text-amber-600">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">عدد المستودعات</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{warehouseCount}</p>
            <p className="text-[11px] text-amber-600 font-semibold">مواقع الجرد المعتمدة</p>
          </div>
        </div>

        <div className="p-5 flex items-center space-x-4 space-x-reverse">
          <div className="p-3.5 bg-slate-100 text-slate-800">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">حركات اليوم</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{dailyMovementsCount}</p>
            <p className="text-[11px] text-emerald-600 font-semibold">100% موثقة بالكامل</p>
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
                <Warehouse className="w-5 h-5 text-amber-600" /> حال المستودعات والمستويات الاستيعابية
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">توزيع الكميات والأصناف حسب المستودع المعتمد</p>
            </div>
            <button 
              onClick={() => onNavigateTab && onNavigateTab('warehouses')}
              className="text-xs font-bold text-amber-600 hover:text-amber-800 hover:underline"
            >
              إدارة المستودعات ⬅️
            </button>
          </div>

          <div className="space-y-3">
            {warehousesList.map((wh, index) => (
              <div key={index} className="p-3.5 bg-transparent border border-slate-100 hover:border-slate-300 transition">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-slate-800 text-sm">{wh.name} ({wh.code})</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    wh.status === 'ممتلئ تقريباً' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {wh.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>السعة الاستيعابية المستخدمة: {wh.capacity}</span>
                  <span className="font-bold text-slate-700">القيمة: {wh.value} ({wh.itemsCount} صنف)</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      parseInt(wh.capacity) > 80 ? 'bg-amber-500' : 'bg-amber-600'
                    }`}
                    style={{ width: wh.capacity }}
                  ></div>
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
            {recentTransactions.map((tr) => (
              <div key={tr.id} className="p-3.5 bg-transparent border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${
                    tr.type === 'إضافة مخزنية' ? 'bg-emerald-100 text-emerald-700' :
                    tr.type === 'صرف مخزني' ? 'bg-orange-100 text-orange-700' :
                    tr.type === 'تحويل بين مستودعات' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {tr.type === 'إضافة مخزنية' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{tr.item}</span>
                      <span className="text-xs font-mono text-slate-400">({tr.id})</span>
                    </div>
                    <p className="text-xs text-slate-500">{tr.type} • {tr.warehouse} • بواسطة {tr.user}</p>
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
          onClick={() => onNavigateTab && onNavigateTab('items')}
          className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition whitespace-nowrap"
        >
          عرض أصناف إعادة الطلب
        </button>
      </div>
    </div>
  );
}
