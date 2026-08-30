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
  onAuditReport?: (format: 'csv' | 'print') => Promise<void>;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function ProcurementReports({
  orders,
  receipts,
  vendorBills,
  onAuditReport,
  triggerNotification
}: ProcurementReportsProps) {

  const totalSpend = orders.reduce((s, po) => s + po.grandTotal, 0);
  const totalReceived = receipts.reduce((s, r) => s + r.totalReceivedValue, 0);
  const totalUnpaid = vendorBills.reduce((s, b) => s + b.remainingAmount, 0);
  const vendorIds = Array.from(new Set([
    ...orders.map(order => order.vendorId),
    ...receipts.map(receipt => receipt.vendorId),
    ...vendorBills.map(bill => bill.vendorId)
  ].filter(Boolean)));
  const notify = (message: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => triggerNotification?.(message, type);
  const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const handlePrint = async () => {
    try {
      await onAuditReport?.('print');
      window.print();
    } catch (error: any) {
      notify(error?.message || 'تعذر تدقيق التقرير قبل الطباعة.', 'danger');
    }
  };

  const handleExport = async () => {
    try {
      await onAuditReport?.('csv');
      const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [
        ['المورد', 'عدد أوامر الشراء', 'قيمة أوامر الشراء', 'قيمة الاستلام المقبول', 'إجمالي الفواتير', 'المتبقي'],
        ...vendorIds.map(vendorId => {
          const vendorOrders = orders.filter(order => order.vendorId === vendorId);
          const vendorReceipts = receipts.filter(receipt => receipt.vendorId === vendorId);
          const vendorBills = billsForVendor(vendorId);
          return [
            vendorOrders[0]?.vendorName || vendorReceipts[0]?.vendorName || vendorBills[0]?.vendorName || vendorId,
            vendorOrders.length,
            vendorOrders.reduce((sum, order) => sum + order.grandTotal, 0),
            vendorReceipts.reduce((sum, receipt) => sum + receipt.totalReceivedValue, 0),
            vendorBills.reduce((sum, bill) => sum + bill.grandTotal, 0),
            vendorBills.reduce((sum, bill) => sum + bill.remainingAmount, 0)
          ];
        })
      ].map(row => row.map(csvCell).join(',')).join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `edupro_procurement_report_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify('تم تدقيق وتصدير تقرير المشتريات بصيغة CSV.', 'success');
    } catch (error: any) {
      notify(error?.message || 'تعذر تدقيق التقرير قبل التصدير.', 'danger');
    }
  };

  const billsForVendor = (vendorId: string) => vendorBills.filter(bill => bill.vendorId === vendorId);

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
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> طباعة التقارير
          </button>
          <button 
            onClick={handleExport}
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
          <span className="text-[11px] text-slate-500 font-semibold block">إجمالي المستندات المسجلة في المصدر المركزي</span>
        </div>

        <div className="p-5 space-y-1">
          <span className="text-xs font-bold text-slate-500">قيمة التوريدات المستلمة مخزنياً (GRN)</span>
          <h4 className="text-2xl font-black text-emerald-700">{totalReceived.toLocaleString('ar-SA')} د.ل</h4>
          <span className="text-[11px] text-amber-600 font-semibold block">استلام مخزني مقبول؛ قيد المخزون/GRNI يظهر على المستند</span>
        </div>

        <div className="p-5 space-y-1">
          <span className="text-xs font-bold text-slate-500">مستحقات الموردين غير المسددة (AP)</span>
          <h4 className="text-2xl font-black text-red-600">{totalUnpaid.toLocaleString('ar-SA')} د.ل</h4>
          <span className="text-[11px] text-amber-600 font-semibold block">قيد المطابقة؛ السداد يحال إلى وحدة الخزينة</span>
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
              {vendorIds.map((vendorId) => {
                const vendorOrders = orders.filter(order => order.vendorId === vendorId);
                const vendorReceipts = receipts.filter(receipt => receipt.vendorId === vendorId);
                const vendorBills = billsForVendor(vendorId);
                const vendorName = vendorOrders[0]?.vendorName || vendorReceipts[0]?.vendorName || vendorBills[0]?.vendorName || vendorId;
                return (
                <tr key={vendorId} className="hover:bg-transparent transition">
                  <td className="px-4 py-3 font-bold text-slate-900">{vendorName}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-700 text-center">{vendorOrders.length}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{vendorOrders.reduce((sum, order) => sum + order.grandTotal, 0).toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-3 font-bold text-amber-700">{vendorReceipts.reduce((sum, receipt) => sum + receipt.totalReceivedValue, 0).toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-3 font-bold text-emerald-700">{vendorBills.reduce((sum, bill) => sum + bill.paidAmount, 0).toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-3 font-black text-red-600">{vendorBills.reduce((sum, bill) => sum + bill.remainingAmount, 0).toLocaleString('ar-SA')} د.ل</td>
                </tr>
                );
              })}
              {vendorIds.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">لا توجد بيانات موردين في المصدر المركزي.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
