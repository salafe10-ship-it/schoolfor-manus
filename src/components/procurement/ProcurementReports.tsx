import React from 'react';
import { 
  FileSpreadsheet, Printer, Download, BarChart3, 
  ShoppingBag, DollarSign, Users, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { PurchaseOrder, GoodsReceiptNote, VendorBill } from '../../types';

interface ProcurementReportsProps {
  orders: PurchaseOrder[];
  receipts: GoodsReceiptNote[];
  vendorBills: VendorBill[];
}

export default function ProcurementReports({
  orders,
  receipts,
  vendorBills
}: ProcurementReportsProps) {

  const totalSpend = orders.reduce((s, po) => s + po.grandTotal, 0);
  const totalReceived = receipts.reduce((s, r) => s + r.totalReceivedValue, 0);
  const totalUnpaid = vendorBills.reduce((s, b) => s + b.remainingAmount, 0);

  return (
    <div className="space-y-6" id="procurement-reports">
      {/* Header */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-600" /> تقارير المشتريات والإنفاق والتزام الموردين
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">تحليلات الميزانيات المخصصة، حجم التعاقدات، ومستحقات الموردين القائمة</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> طباعة التقارير
          </button>
          <button 
            onClick={() => alert('تم تصدير ملف اكسل التقارير المشتريات')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" /> تصدير Excel
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 space-y-1">
          <span className="text-xs font-bold text-slate-500">إجمالي التعاقدات الصادرة (PO)</span>
          <h4 className="text-2xl font-black text-slate-900">{totalSpend.toLocaleString('ar-SA')} د.ل</h4>
          <span className="text-[11px] text-emerald-600 font-semibold block">مغطي بقرارات اعتماد معتمدة</span>
        </div>

        <div className="p-5 space-y-1">
          <span className="text-xs font-bold text-slate-500">قيمة التوريدات المستلمة مخزنياً (GRN)</span>
          <h4 className="text-2xl font-black text-emerald-700">{totalReceived.toLocaleString('ar-SA')} د.ل</h4>
          <span className="text-[11px] text-amber-600 font-semibold block">تمت مطابقتها وفحصها بالكامل</span>
        </div>

        <div className="p-5 space-y-1">
          <span className="text-xs font-bold text-slate-500">مستحقات الموردين غير المسددة (AP)</span>
          <h4 className="text-2xl font-black text-red-600">{totalUnpaid.toLocaleString('ar-SA')} د.ل</h4>
          <span className="text-[11px] text-amber-600 font-semibold block">مدرجة في جدول التدفقات النقدية</span>
        </div>
      </div>

      {/* Vendor Analysis Table */}
      <div className="p-6 space-y-4">
        <h4 className="font-black text-slate-900 text-base border-b border-slate-100 pb-3">كشف تفصيلي بتعاقدات الموردين وحالة السداد</h4>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#2a1d13] text-[#fce79a] font-bold text-xs uppercase">
              <tr>
                <th className="px-4 py-3">المورد</th>
                <th className="px-4 py-3">عدد الأوامر</th>
                <th className="px-4 py-3">إجمالي قيمة العقود</th>
                <th className="px-4 py-3">المستلم مخزنياً</th>
                <th className="px-4 py-3">المبالغ المسددة</th>
                <th className="px-4 py-3">المتبقي للصرف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {vendorBills.map((b) => (
                <tr key={b.id} className="hover:bg-transparent transition">
                  <td className="px-4 py-3 font-bold text-slate-900">{b.vendorName}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-700 text-center">1</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{b.grandTotal.toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-3 font-bold text-amber-700">{b.subtotal.toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-3 font-bold text-emerald-700">{b.paidAmount.toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-3 font-black text-red-600">{b.remainingAmount.toLocaleString('ar-SA')} د.ل</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
