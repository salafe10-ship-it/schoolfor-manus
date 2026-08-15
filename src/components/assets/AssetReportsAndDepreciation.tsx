import React, { useState } from 'react';
import { 
  FileSpreadsheet, Printer, Search, Filter, Building2, 
  TrendingDown, Wrench, ArrowRightLeft, DollarSign, Layers, CheckCircle2 
} from 'lucide-react';
import { FixedAsset } from '../../types';

interface AssetReportsAndDepreciationProps {
  assets: FixedAsset[];
}

export default function AssetReportsAndDepreciation({ assets }: AssetReportsAndDepreciationProps) {
  const [reportType, setReportType] = useState<'ledger' | 'depreciation_schedule' | 'custody_movement' | 'maintenance' | 'disposals'>('ledger');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = Array.from(new Set(assets.map(a => a.category).filter(Boolean)));

  const filteredAssets = assets.filter(a => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      a.name.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      (a.department && a.department.toLowerCase().includes(q));

    const matchesCat = categoryFilter === 'all' || a.category === categoryFilter;

    return matchesSearch && matchesCat;
  });

  const totalCost = filteredAssets.reduce((sum, a) => sum + Number(a.cost || 0) + Number(a.capitalExp || 0), 0);
  const totalAccDep = filteredAssets.reduce((sum, a) => sum + Number(a.accDep || 0), 0);
  const totalNetValue = filteredAssets.reduce((sum, a) => sum + Number(a.netValue || 0), 0);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'الكود,اسم الأصل,التصنيف,القسم,التكلفة التاريخية,مجمع الإهلاك,صافي القيمة الدفترية,الحالة\n';

    filteredAssets.forEach(a => {
      csvContent += `"${a.code}","${a.name}","${a.category}","${a.department}",${a.cost + a.capitalExp},${a.accDep},${a.netValue},"${a.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fixed_Assets_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl" id="asset-reports-and-depreciation">
      {/* Report Selection Header */}
      <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base">التقارير التحليلية وجداول الإهلاك للأصول الثابتة</h3>
            <p className="text-xs text-slate-500">تقارير جرد الأصول، مصفوفة الإهلاك الدفتري، وحركات العهد والصيانة</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> تصدير Excel (CSV)
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> طباعة التقرير
          </button>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div className="bg-slate-100 p-1.5 flex flex-wrap gap-1">
        {[
          { id: 'ledger', label: 'دفتر أستاذ وجرد الأصول', icon: Building2 },
          { id: 'depreciation_schedule', label: 'مصفوفة الإهلاك الدفتري السنوي', icon: TrendingDown },
          { id: 'custody_movement', label: 'حركة ونقل العهد بين الأقسام', icon: ArrowRightLeft },
          { id: 'maintenance', label: 'تكاليف ومصاريف الصيانة', icon: Wrench },
          { id: 'disposals', label: 'بيانات البيع والتكهين', icon: DollarSign },
        ].map(t => {
          const Icon = t.icon;
          const isActive = reportType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setReportType(t.id as any)}
              className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
                isActive ? 'text-amber-700 shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="تصفية بالاسم، الكود، أو القسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent p-2 pr-9 font-bold text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500">التصنيف:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent p-2 font-bold text-slate-800"
          >
            <option value="all">جميع التصنيفات ({assets.length})</option>
            {categories.map((c, idx) => (
              <option key={idx} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Table Display */}
      <div className="overflow-hidden p-6 space-y-4">
        
        {/* Table Summary Top Ribbon */}
        <div className="p-4 bg-transparent grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-right">
          <div>
            <span className="text-slate-400 block mb-0.5">عدد الأصول المدرجة:</span>
            <span className="font-mono text-sm text-slate-900">{filteredAssets.length} أصل</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">إجمالي التكلفة التاريخية:</span>
            <span className="font-mono text-sm text-slate-900">{totalCost.toLocaleString()} د.ل</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">إجمالي مجمع الإهلاك:</span>
            <span className="font-mono text-sm text-rose-600">-{totalAccDep.toLocaleString()} د.ل</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">إجمالي صافي القيمة الدفترية:</span>
            <span className="font-mono text-sm text-emerald-700 font-black">{totalNetValue.toLocaleString()} د.ل</span>
          </div>
        </div>

        {/* Dynamic Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-transparent text-slate-700 font-bold border-y border-slate-200">
                <th className="p-3">الكود</th>
                <th className="p-3">اسم الأصل الثابت</th>
                <th className="p-3">التصنيف</th>
                <th className="p-3">القسم والمسؤول</th>
                <th className="p-3 text-left">التكلفة التاريخية</th>
                <th className="p-3 text-left">مجمع الإهلاك</th>
                <th className="p-3 text-left">صافي الدفتري</th>
                <th className="p-3 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-transparent transition">
                  <td className="p-3 font-mono font-bold text-slate-900">{asset.code}</td>
                  <td className="p-3 font-bold text-slate-900">{asset.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md">
                      {asset.category}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-800 font-bold">{asset.department}</div>
                    <div className="text-[10px] text-slate-400">{asset.responsible}</div>
                  </td>
                  <td className="p-3 text-left font-mono font-bold text-slate-800">
                    {(asset.cost + asset.capitalExp).toLocaleString()} د.ل
                  </td>
                  <td className="p-3 text-left font-mono font-bold text-rose-600">
                    -{asset.accDep.toLocaleString()} د.ل
                  </td>
                  <td className="p-3 text-left font-mono font-black text-emerald-700">
                    {asset.netValue.toLocaleString()} د.ل
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-md border border-emerald-200">
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
