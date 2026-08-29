import React, { useState } from 'react';
import { 
  ClipboardCheck, AlertTriangle, CheckCircle2, 
  Calculator, DollarSign, FileSpreadsheet, Plus, 
  ShieldCheck, ArrowRightLeft, Layers 
} from 'lucide-react';
import { InventoryItem } from '../../types';

interface StockCountManagerProps {
  items: InventoryItem[];
  stocktakes?: any[];
  settings?: Record<string, any>;
  onSave?: (stocktakes: any[]) => Promise<void>;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function StockCountManager({ items, stocktakes = [], settings = {}, onSave, triggerNotification }: StockCountManagerProps) {
  const [valuationPolicy, setValuationPolicy] = useState<'weighted_average' | 'fifo'>(settings.defaultValuationMethod === 'fifo' ? 'fifo' : 'weighted_average');
  const countAuditRecords = stocktakes;

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleApproveDiscrepancy = (_rec: any) => {
    notify('اعتماد الأثر المالي لتسوية الجرد متوقف حتى يتوفر عقد دفتر أستاذ كانوني؛ لم يُنشأ قيد.', 'warning');
  };

  const handleCreateStocktake = async () => {
    const item = items[0];
    if (!item) { notify('لا يمكن بدء الجرد قبل تسجيل صنف مركزي واحد على الأقل.', 'warning'); return; }
    const entered = prompt(`أدخل الكمية الفعلية للصنف ${item.name} (الرصيد الدفتري ${item.quantity}):`, String(item.quantity));
    if (entered === null) return;
    const actualQty = Number(entered);
    if (!Number.isInteger(actualQty) || actualQty < 0) { notify('الكمية الفعلية يجب أن تكون عدداً صحيحاً غير سالب.', 'warning'); return; }
    const discrepancy = actualQty - item.quantity;
    const record = { id: `STK-${Date.now()}`, itemId: item.id, itemName: item.name, warehouse: item.warehouseId,
      bookQty: item.quantity, actualQty, discrepancy, financialImpact: discrepancy * item.costPrice,
      valuationPolicy, status: 'pending_approval', statusLabel: 'قيد اعتماد التسوية', createdAt: new Date().toISOString() };
    if (!onSave) { notify('حفظ محضر الجرد متوقف حتى يتوفر المصدر المركزي.', 'warning'); return; }
    try { await onSave([record, ...stocktakes]); notify(`تم حفظ محضر الجرد ${record.id} مركزياً.`, 'success'); }
    catch (error: any) { notify(error?.message || 'تعذر حفظ محضر الجرد مركزياً.', 'danger'); }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Valuation Policy Switcher */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-amber-600" /> إدارة الجرد الدوري والتسويات وتقييم المخزون
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">معالجة العجز والزيادة الجردية، وتطبيق سياسة التقييم المحاسبي للمخزون</p>
        </div>

        <button onClick={handleCreateStocktake} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs">
          تسجيل نتيجة جرد جديدة
        </button>

        {/* Policy Selector */}
        <div className="bg-slate-100 p-1.5 flex items-center gap-1 border border-slate-200">
          <button 
            onClick={() => {
              setValuationPolicy('weighted_average');
              notify('تم تفعيل سياسة تقييم المخزون: المتوسط المرجح (Weighted Average)', 'info');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              valuationPolicy === 'weighted_average' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المتوسط المرجح (W.AVG)
          </button>

          <button 
            onClick={() => {
              setValuationPolicy('fifo');
              notify('تم تفعيل سياسة تقييم المخزون: الوارد أولاً يخرج أولاً (FIFO)', 'info');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              valuationPolicy === 'fifo' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FIFO (الأول بدخول الأول بخروج)
          </button>
        </div>
      </div>

      {/* Audit Variance Table */}
      <div className="overflow-hidden space-y-4 p-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" /> نتائج الجرد الفعلي ومطابقة الأرصدة الدفترية
          </h4>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
            سياسة التقييم النشطة: {valuationPolicy === 'weighted_average' ? 'المتوسط المرجح' : 'FIFO'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#2a1d13] text-[#fce79a] font-bold text-xs uppercase">
              <tr>
                <th className="px-5 py-4">رقم محضر الجرد</th>
                <th className="px-5 py-4">المستودع</th>
                <th className="px-5 py-4">الصنف</th>
                <th className="px-5 py-4 text-center">الرصيد الدفتري</th>
                <th className="px-5 py-4 text-center">الجرد الفعلي</th>
                <th className="px-5 py-4 text-center">الفارق (عجز / زيادة)</th>
                <th className="px-5 py-4">الأثر المالي</th>
                <th className="px-5 py-4">الحالة</th>
                <th className="px-5 py-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {countAuditRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-transparent transition">
                  <td className="px-5 py-4 font-mono font-bold text-slate-900">{rec.id}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-600">{rec.warehouse}</td>
                  <td className="px-5 py-4 font-bold text-slate-900">{rec.itemName}</td>
                  <td className="px-5 py-4 text-center font-bold text-slate-800">{rec.bookQty}</td>
                  <td className="px-5 py-4 text-center font-bold text-slate-900">{rec.actualQty}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black inline-block ${
                      rec.discrepancy < 0 ? 'bg-red-100 text-red-800 border border-red-200' :
                      rec.discrepancy > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {rec.discrepancy > 0 ? `+${rec.discrepancy}` : rec.discrepancy}
                    </span>
                  </td>
                  <td className={`px-5 py-4 font-black ${rec.financialImpact < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {rec.financialImpact.toLocaleString('ar-SA')} د.ل
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      rec.status === 'approved_posted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {rec.statusLabel}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {rec.status !== 'approved_posted' && (
                      <button 
                        onClick={() => handleApproveDiscrepancy(rec)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                      >
                        اعتماد وتسوية
                      </button>
                    )}
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
