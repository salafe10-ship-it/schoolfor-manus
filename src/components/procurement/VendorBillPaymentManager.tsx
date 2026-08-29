import React, { useState } from 'react';
import { 
  DollarSign, FileCheck, ShieldCheck, CheckCircle2, 
  CreditCard, Coins, Calendar, ArrowUpRight, Search, Plus 
} from 'lucide-react';
import { VendorBill, GoodsReceiptNote, PurchaseOrder } from '../../types';

interface VendorBillPaymentManagerProps {
  vendorBills: VendorBill[];
  receipts: GoodsReceiptNote[];
  orders: PurchaseOrder[];
  onSaveBill: (bill: VendorBill) => Promise<void>;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function VendorBillPaymentManager({
  vendorBills,
  receipts,
  orders,
  onSaveBill,
  triggerNotification
}: VendorBillPaymentManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = vendorBills.filter(b => 
    b.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vendorInvoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateBill = async () => {
    const receipt = receipts.find(item => !vendorBills.some(bill => bill.grnId === item.id));
    if (!receipt) { triggerNotification?.('لا يوجد إذن استلام غير مفوتر لإنشاء فاتورة مورد.', 'warning'); return; }
    const po = orders.find(item => item.id === receipt.purchaseOrderId);
    if (!po) { triggerNotification?.('تعذر ربط إذن الاستلام بأمر الشراء.', 'warning'); return; }
    const invoiceNo = prompt('أدخل رقم فاتورة المورد:');
    if (!invoiceNo?.trim()) return;
    const amount = receipt.totalReceivedValue;
    const bill: VendorBill = {
      id: `bill_${Date.now()}`, schoolId: '', billNo: `BILL-${Date.now()}`, vendorInvoiceNo: invoiceNo.trim(),
      billDate: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      vendorId: receipt.vendorId, vendorName: receipt.vendorName, purchaseOrderId: po.id, grnId: receipt.id,
      subtotal: amount, taxAmount: 0, grandTotal: amount, paidAmount: 0, remainingAmount: amount,
      status: 'pending_matching', notes: 'بانتظار المطابقة الثلاثية والاعتماد المالي.', createdAt: new Date().toISOString()
    };
    try { await onSaveBill(bill); triggerNotification?.(`تم حفظ فاتورة المورد ${bill.billNo} مركزياً بحالة انتظار المطابقة.`, 'success'); }
    catch (error: any) { triggerNotification?.(error?.message || 'تعذر حفظ فاتورة المورد', 'danger'); }
  };

  return (
    <div className="space-y-6" id="vendor-bill-payment-manager">
      {/* Top Header Card */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-purple-600" /> مطابقة فواتير الموردين والمدفوعات (Three-Way Matching & AP)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">توثيق فاتورة المورد وربطها بأمر الشراء وإذن الاستلام؛ الدفع والترحيل المالي محجوبان حتى اكتمال التكامل القانوني</p>
        </div>
        <button onClick={handleCreateBill} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs">تسجيل فاتورة مورد</button>
      </div>

      {/* 3-Way Matching Banner */}
      <div className="bg-purple-900 text-white p-5 border border-purple-800 space-y-2">
        <div className="flex items-center gap-2 font-black text-sm">
          <ShieldCheck className="w-5 h-5 text-purple-300" /> ميزة حوكمة المطابقة الثلاثية 3-Way Matching Engine
        </div>
        <p className="text-purple-100 text-xs leading-relaxed">
          تُحفظ الفاتورة بحالة <strong>انتظار المطابقة</strong> مرتبطة بأمر الشراء وإذن الاستلام. لا يُتاح الصرف من هذه الوحدة قبل وجود اعتماد مالي وتكامل خزينة ودفتر أستاذ موثقين.
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الفاتورة، اسم المورد..." 
            className="w-full pr-10 pl-4 py-2 bg-transparent text-sm focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Bills Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#2a1d13] text-[#fce79a] font-bold text-xs uppercase">
              <tr>
                <th className="px-4 py-4">رقم الفاتورة بالنظام</th>
                <th className="px-4 py-4">فاتورة المورد</th>
                <th className="px-4 py-4">المورد</th>
                <th className="px-4 py-4">تاريخ الاستحقاق</th>
                <th className="px-4 py-4">إجمالي المطالبة</th>
                <th className="px-4 py-4">المسدد</th>
                <th className="px-4 py-4">المتبقي للصرف</th>
                <th className="px-4 py-4 text-center">السداد والتسوية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {filtered.map((bill) => (
                <tr key={bill.id} className="hover:bg-transparent transition">
                  <td className="px-4 py-4 font-mono font-bold text-slate-900">{bill.billNo}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-600">{bill.vendorInvoiceNo}</td>
                  <td className="px-4 py-4 font-bold text-slate-900">{bill.vendorName}</td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-700">{bill.dueDate}</td>
                  <td className="px-4 py-4 font-black text-slate-900">{bill.grandTotal.toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-4 font-bold text-emerald-700">{bill.paidAmount.toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-4 font-black text-red-600">{bill.remainingAmount.toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-4 text-center">
                    {bill.remainingAmount > 0 ? (
                      <button
                        onClick={() => triggerNotification?.('الصرف محجوب حتى يتوفر تكامل الخزينة ودفتر الأستاذ؛ لم تُسجل دفعة.', 'warning')}
                        className="px-3 py-1.5 bg-amber-100 text-amber-900 font-bold text-xs inline-flex items-center gap-1"
                      >
                        <Coins className="w-3.5 h-3.5" /> الدفع محجوب بأمان
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200">
                        خالص بالكامل
                      </span>
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
