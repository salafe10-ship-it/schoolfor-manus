import React, { useState } from 'react';
import { 
  ClipboardCheck, AlertTriangle, CheckCircle2, 
  Calculator, DollarSign, FileSpreadsheet, Plus, 
  ShieldCheck, ArrowRightLeft, Layers 
} from 'lucide-react';
import { InventoryItem } from '../../types';

interface StockCountManagerProps {
  items: InventoryItem[];
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function StockCountManager({ items, triggerNotification }: StockCountManagerProps) {
  const [valuationPolicy, setValuationPolicy] = useState<'weighted_average' | 'fifo'>('weighted_average');
  const [countAuditRecords, setCountAuditRecords] = useState<any[]>([
    {
      id: 'AUD-2026-01',
      date: '2026-08-01',
      warehouse: 'المستودع الرئيسي - الرياض',
      itemCode: 'SKU-E-001',
      itemName: 'أجهزة بروجكتور فائقة الجودة سوني UHD',
      bookQty: 45,
      actualQty: 44,
      discrepancy: -1,
      unitCost: 3000,
      financialImpact: -3000,
      status: 'pending_approval',
      statusLabel: 'قيد الاعتماد من المراجع المالي'
    },
    {
      id: 'AUD-2026-02',
      date: '2026-08-01',
      warehouse: 'مستودع الكتب والقرطاسية',
      itemCode: 'SKU-B-001',
      itemName: 'كتب المناهج البريطانية المعتمدة',
      bookQty: 1200,
      actualQty: 1205,
      discrepancy: +5,
      unitCost: 50,
      financialImpact: +250,
      status: 'approved_posted',
      statusLabel: 'تم اعتماد وتسوية الزيادة في الدفاتر',
    }
  ]);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleApproveDiscrepancy = (rec: any) => {
    setCountAuditRecords(countAuditRecords.map(r => 
      r.id === rec.id ? { ...r, status: 'approved_posted', statusLabel: 'تم اعتماد وتسوية الفروقات بالدفاتر' } : r
    ));
    notify(`✓ تم ترحيل تسوية الجرد رقم (${rec.id}) واعتماد الفروق المالية بالدفاتر بنجاح`, 'success');
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
