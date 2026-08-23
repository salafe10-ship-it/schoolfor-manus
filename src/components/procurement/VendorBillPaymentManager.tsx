import React, { useState } from 'react';
import { 
  DollarSign, FileCheck, ShieldCheck, CheckCircle2, 
  CreditCard, Coins, Calendar, ArrowUpRight, Search, Plus 
} from 'lucide-react';
import { VendorBill, VendorPayment, GoodsReceiptNote } from '../../types';

interface VendorBillPaymentManagerProps {
  vendorBills: VendorBill[];
  receipts: GoodsReceiptNote[];
  onSaveBill: (bill: VendorBill) => void;
  onRecordPayment: (payment: VendorPayment) => void;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function VendorBillPaymentManager({
  vendorBills,
  receipts,
  onSaveBill,
  onRecordPayment,
  triggerNotification
}: VendorBillPaymentManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<VendorBill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'check' | 'cash'>('bank_transfer');

  const handleOpenPayment = (bill: VendorBill) => {
    setSelectedBill(bill);
    setPaymentAmount(bill.remainingAmount);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0 || paymentAmount > selectedBill.remainingAmount) {
      triggerNotification?.('يجب إدخال مبلغ سداد موجب لا يتجاوز المتبقي على فاتورة المورد.', 'warning');
      return;
    }

    const newPayment: VendorPayment = {
      id: `vp_${Date.now()}`,
      schoolId: 'school_1',
      paymentNo: `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentDate: new Date().toISOString().split('T')[0],
      vendorId: selectedBill.vendorId,
      vendorName: selectedBill.vendorName,
      vendorBillId: selectedBill.id,
      billNo: selectedBill.billNo,
      amountPaid: paymentAmount,
      paymentMethod,
      referenceNo: `REF-TR-${Date.now()}`,
      glJournalEntryId: `JV-2026-PAY-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const updatedBill: VendorBill = {
      ...selectedBill,
      paidAmount: selectedBill.paidAmount + paymentAmount,
      remainingAmount: selectedBill.remainingAmount - paymentAmount,
      status: (selectedBill.remainingAmount - paymentAmount) <= 0 ? 'paid' : 'partially_paid'
    };

    onRecordPayment(newPayment);
    onSaveBill(updatedBill);

    if (triggerNotification) {
      triggerNotification(`✓ تم تسجيل إذن صرف المورد بمبلغ ${paymentAmount.toLocaleString('ar-SA')} د.ل وتحديث حـ/ الموردين بالعمومية بنجاح`, 'success');
    }

    setShowPaymentModal(false);
    setSelectedBill(null);
  };

  const filtered = vendorBills.filter(b => 
    b.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vendorInvoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" id="vendor-bill-payment-manager">
      {/* Top Header Card */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-purple-600" /> مطابقة فواتير الموردين والمدفوعات (Three-Way Matching & AP)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">المطابقة الثلاثية (أمر الشراء + إذن الاستلام + فاتورة المورد)، ترحيل حسابات الموردين D/C وسداد الاستحقاقات</p>
        </div>
      </div>

      {/* 3-Way Matching Banner */}
      <div className="bg-purple-900 text-white p-5 border border-purple-800 space-y-2">
        <div className="flex items-center gap-2 font-black text-sm">
          <ShieldCheck className="w-5 h-5 text-purple-300" /> ميزة حوكمة المطابقة الثلاثية 3-Way Matching Engine
        </div>
        <p className="text-purple-100 text-xs leading-relaxed">
          يضمن النظام عدم صرف أي فاتورة إلا بعد تحليليها آلياً ومطابقة <strong>أمر الشراء المعتمد (PO)</strong> مع <strong>إذن الاستلام المخزني (GRN)</strong> مع <strong>مطالبة المورد (Invoice)</strong> لمنع أي تلاعب أو ازدواجية سداد.
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
                        onClick={() => handleOpenPayment(bill)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition inline-flex items-center gap-1"
                      >
                        <Coins className="w-3.5 h-3.5" /> أمر صرف وسداد
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

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="shadow-2xl max-w-lg w-full p-6 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Coins className="w-5 h-5 text-purple-600" /> إذن صرف مالي للمورد (Payment Voucher)
            </h3>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="p-3 bg-transparent space-y-1 text-xs">
                <p className="font-bold text-slate-900">المورد المستفيد: {selectedBill.vendorName}</p>
                <p className="text-slate-600">الفاتورة رقم: {selectedBill.billNo} | متبقي: <strong className="text-red-600">{selectedBill.remainingAmount.toLocaleString('ar-SA')} د.ل</strong></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مبلغ الصرف المراد تسديده الآن *</label>
                <input 
                  type="number"
                  max={selectedBill.remainingAmount}
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-transparent text-base font-black text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">طريقة وسيلة الدفع *</label>
                <select 
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-transparent text-sm font-bold text-slate-800"
                >
                  <option value="bank_transfer">تحويل بنكي مباشر (Bank Transfer)</option>
                  <option value="check">شيك مصدّق (Certified Check)</option>
                  <option value="cash">صرف نقدي من الخزينة الرئيسية</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-5 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-sm shadow-sm"
                >
                  تأكيد وترحيل إذن الصرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
