import React from 'react';
import { 
  Building2, DollarSign, TrendingUp, TrendingDown, Wrench, 
  ArrowRightLeft, AlertTriangle, CheckCircle2, ShieldCheck, 
  BarChart3, Layers, Plus, Calendar, FileSpreadsheet, RefreshCw 
} from 'lucide-react';
import { FixedAsset } from '../../types';

interface FixedAssetsDashboardProps {
  assets: FixedAsset[];
  onNavigateTab: (tab: string) => void;
  onOpenNewAsset: () => void;
  onOpenDepreciation: () => void;
}

export default function FixedAssetsDashboard({
  assets,
  onNavigateTab,
  onOpenNewAsset,
  onOpenDepreciation
}: FixedAssetsDashboardProps) {
  const totalAssets = assets.length;
  const totalCost = assets.reduce((sum, a) => sum + Number(a.cost || 0) + Number(a.capitalExp || 0), 0);
  const totalAccDep = assets.reduce((sum, a) => sum + Number(a.accDep || 0), 0);
  const totalNetValue = assets.reduce((sum, a) => sum + Number(a.netValue || 0), 0);

  const activeAssets = assets.filter(a => a.status === 'نشط / قيد التشغيل');
  const maintenanceAssets = assets.filter(a => a.status === 'تحت الصيانة' || (a.maintenanceLogs && a.maintenanceLogs.length > 0));
  const soldOrDisposed = assets.filter(a => a.status === 'تم بيعه' || a.status === 'مستبعد / كلي');

  // Categories breakdown
  const categoryStats: Record<string, { count: number; cost: number; netValue: number }> = {};
  assets.forEach(a => {
    const cat = a.category || 'أخرى';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, cost: 0, netValue: 0 };
    }
    categoryStats[cat].count += 1;
    categoryStats[cat].cost += Number(a.cost || 0) + Number(a.capitalExp || 0);
    categoryStats[cat].netValue += Number(a.netValue || 0);
  });

  return (
    <div className="space-y-6 text-right" dir="rtl" id="fixed-assets-dashboard">
      {/* Top Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets Card */}
        <div className="p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي عدد الأصول بالمدرسة</span>
              <h3 className="text-2xl font-black text-slate-900 font-mono">{totalAssets} <span className="text-xs font-normal text-slate-500">أصل</span></h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px]">
            <span className="text-slate-500 font-bold">نشط في الخدمة:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{activeAssets.length} أصل</span>
          </div>
        </div>

        {/* Historical Cost Card */}
        <div className="p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">القيمة التاريخية + التحسينات</span>
              <h3 className="text-xl font-black text-slate-900 font-mono">{totalCost.toLocaleString()} <span className="text-xs font-normal text-slate-500">د.ل</span></h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px]">
            <span className="text-slate-500 font-bold">نسبة التحسينات الرأسمالية:</span>
            <span className="font-bold text-amber-700 font-mono">
              {totalCost > 0 ? Math.round((assets.reduce((sum, a) => sum + Number(a.capitalExp || 0), 0) / totalCost) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Accumulated Depreciation Card */}
        <div className="p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">مجمع الاستهلاك المتراكم</span>
              <h3 className="text-xl font-black text-rose-600 font-mono">-{totalAccDep.toLocaleString()} <span className="text-xs font-normal text-slate-500">د.ل</span></h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px]">
            <span className="text-slate-500 font-bold">نسبة استهلاك المحفظة:</span>
            <span className="font-bold text-rose-700 font-mono">
              {totalCost > 0 ? Math.round((totalAccDep / totalCost) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Net Book Value Card */}
        <div className="bg-gradient-to-br from-slate-900 to-amber-950 text-white p-5 border border-slate-800 shadow-md relative overflow-hidden bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-1">صافي القيمة الدفترية المباشرة</span>
              <h3 className="text-xl font-black text-emerald-400 font-mono">{totalNetValue.toLocaleString()} <span className="text-xs font-normal text-slate-300">د.ل</span></h3>
            </div>
            <div className="p-3 bg-white/10 text-emerald-400 backdrop-blur-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-[11px]">
            <span className="text-slate-300 font-bold">حالة السلامة المالية:</span>
            <span className="font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">100% مطابقة</span>
          </div>
        </div>
      </div>

      {/* Action Banner & Quick Operations Shortcuts */}
      <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1">
          <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" /> الإجراءات التشغيلية والمالية السريعة للأصول
          </h4>
          <p className="text-xs text-slate-500">إضافة أصل جديد، ترحيل قسط الإهلاك السنوي، أو استعراض التقارير التحليلية</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenNewAsset}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> تسجيل ورسملة أصل جديد
          </button>

          <button
            onClick={onOpenDepreciation}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-amber-400" /> احتساب وقيد الإهلاك المحاسبي
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" /> تقارير الأصول والإهلاك
          </button>
        </div>
      </div>

      {/* Category Distribution & Maintenance Alert Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Table */}
        <div className="lg:col-span-2 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" /> توزيع الأصول حسب التصنيفات الرئيسية
            </h4>
            <span className="text-xs font-bold text-slate-500">{Object.keys(categoryStats).length} تصنيفات</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-transparent text-slate-700 font-bold border-y border-slate-200">
                  <th className="p-3">التصنيف الرئيسي</th>
                  <th className="p-3 text-center">عدد الأصول</th>
                  <th className="p-3 text-left">التكلفة التاريخية</th>
                  <th className="p-3 text-left">صافي القيمة الدفترية</th>
                  <th className="p-3 text-center">النسبة من الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                {Object.entries(categoryStats).map(([cat, stat], idx) => {
                  const sharePct = totalCost > 0 ? Math.round((stat.cost / totalCost) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900">{cat}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">{stat.count}</td>
                      <td className="p-3 text-left font-mono text-slate-800">{stat.cost.toLocaleString()} د.ل</td>
                      <td className="p-3 text-left font-mono font-bold text-emerald-700">{stat.netValue.toLocaleString()} د.ل</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-600 h-full rounded-full" style={{ width: `${sharePct}%` }}></div>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-600">{sharePct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance & Warranty Alerts Box */}
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-600" /> تنبيهات الصيانة والعمر الإنتاجي
            </h4>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md">مراقبة فورية</span>
          </div>

          <div className="space-y-3">
            {assets.slice(0, 3).map((a, idx) => {
              const depPct = a.cost > 0 ? Math.round((a.accDep / a.cost) * 100) : 0;
              return (
                <div key={idx} className="p-3.5 bg-transparent space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{a.code}</span>
                      <h5 className="font-bold text-slate-900 text-xs line-clamp-1">{a.name}</h5>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded">
                      {a.category}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>نسبة الاستهلاك الدفتري:</span>
                      <span className={`font-mono font-bold ${depPct >= 75 ? 'text-rose-600' : 'text-slate-800'}`}>{depPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${depPct >= 75 ? 'bg-rose-500' : 'bg-amber-600'}`} style={{ width: `${depPct}%` }}></div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 pt-1 flex justify-between">
                    <span>المسؤول: {a.responsible || 'غير محدد'}</span>
                    <span className="text-emerald-700 font-bold">{a.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
