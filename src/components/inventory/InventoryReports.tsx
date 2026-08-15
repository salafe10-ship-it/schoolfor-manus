import React, { useState } from 'react';
import { 
  FileSpreadsheet, Printer, Download, Search, 
  TrendingUp, AlertTriangle, Package, Layers, BarChart3 
} from 'lucide-react';
import { InventoryItem } from '../../types';

interface InventoryReportsProps {
  items: InventoryItem[];
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function InventoryReports({ items, triggerNotification }: InventoryReportsProps) {
  const [activeReport, setActiveReport] = useState<'valuation' | 'reorder' | 'turnover' | 'variances'>('valuation');

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
      "كود الصنف,اسم الصنف,الفئة,الكمية الحالية,تكلفة الوحدة,إجمالي التقييم,المستودع\n" +
      items.map(i => `${i.sku || i.id},${i.name},${i.categoryId},${i.quantity},${i.costPrice},${i.quantity * i.costPrice},${i.warehouseId}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `edupro_inventory_report_${activeReport}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('تم تصدير التقرير الحالي بصيغة CSV بنجاح 📊', 'success');
  };

  const handlePrint = () => {
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
            <Download className="w-4 h-4" /> تصدير Excel / CSV
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
          <BarChart3 className="w-4 h-4" /> تحليل حركة ومعدل دوران المخزون
        </button>
      </div>

      {/* Valuation Report View */}
      {activeReport === 'valuation' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base">كشف التقييم المالي الشامل للمخزون حسب التكلفة</h4>
            <span className="text-xs font-bold text-slate-500">إجمالي الأصناف: {items.length}</span>
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
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{item.sku || item.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-center font-black">{item.quantity}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{item.costPrice.toLocaleString('ar-SA')} د.ل</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">{item.salePrice.toLocaleString('ar-SA')} د.ل</td>
                    <td className="px-4 py-3 font-black text-amber-700">
                      {(item.quantity * item.costPrice).toLocaleString('ar-SA')} د.ل
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-semibold">{item.warehouseId}</td>
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
                {items.filter(i => i.quantity <= i.minLevel).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                      لا توجد أصناف متجاوزة لحد الأدنى حالياً 👍
                    </td>
                  </tr>
                ) : (
                  items.filter(i => i.quantity <= i.minLevel).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-center font-black text-red-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{item.minLevel}</td>
                      <td className="px-4 py-3 text-center font-black text-emerald-700">{item.maxLevel - item.quantity}</td>
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
            <h4 className="font-bold text-slate-900 text-base">تحليل معدل دوران الحركة للأصناف (Fast / Slow Moving)</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 space-y-2">
              <h5 className="font-black text-emerald-900 text-sm">🔥 الأكثر حراكاً واستهلاكاً (Fast-Moving)</h5>
              <p className="text-xs text-emerald-800">1. كتب المناهج البريطانية المعتمدة (1200 وحدة)</p>
              <p className="text-xs text-emerald-800">2. مقاعد دراسية مدمجة (380 وحدة)</p>
            </div>

            <div className="p-4 bg-transparent space-y-2">
              <h5 className="font-black text-slate-900 text-sm">❄️ الأصناف بطيئة الحركة (Slow-Moving)</h5>
              <p className="text-xs text-slate-600">1. أدوات ومجاهر كيميائية ثلاثية الأبعاد (30 وحدة)</p>
              <p className="text-xs text-slate-600">2. أجهزة بروجكتور فائقة الجودة سوني UHD (45 وحدة)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
