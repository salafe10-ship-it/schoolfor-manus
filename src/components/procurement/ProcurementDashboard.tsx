import React from 'react';
import { 
  ShoppingBag, FileText, CheckCircle2, Clock, 
  Truck, ArrowUpRight, DollarSign, AlertCircle, 
  TrendingUp, ShieldCheck, FileCheck, Layers, ChevronLeft 
} from 'lucide-react';
import { PurchaseRequest, PurchaseOrder, GoodsReceiptNote, VendorBill } from '../../types';

interface ProcurementDashboardProps {
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceiptNote[];
  vendorBills: VendorBill[];
  onNavigateTab: (tab: string) => void;
}

export default function ProcurementDashboard({
  purchaseRequests,
  purchaseOrders,
  goodsReceipts,
  vendorBills,
  onNavigateTab
}: ProcurementDashboardProps) {

  const pendingPRs = purchaseRequests.filter(pr => pr.status === 'pending_approval').length;
  const activePOs = purchaseOrders.filter(po => po.status === 'approved' || po.status === 'issued' || po.status === 'partially_received').length;
  const totalPOSpend = purchaseOrders.reduce((sum, po) => sum + po.grandTotal, 0);
  const totalUnpaidBills = vendorBills.reduce((sum, b) => sum + b.remainingAmount, 0);

  return (
    <div className="space-y-6" id="procurement-dashboard">
      {/* Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute left-0 top-0 w-96 h-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold rounded-full border border-emerald-500/30 inline-flex items-center gap-1 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> النظام المؤسسي المعتمد لحوكمة المشتريات 2026
            </span>
            <h2 className="text-2xl font-black tracking-tight">منظومة المشتريات والتوريدات والعقود (Procurement ERP)</h2>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              إدارة الدورة المستندية الكاملة من طلب الشراء، مقارنة عروض الموردين، إصدار أمر الشراء، الفحص والتسليم بالمستودع، والمطابقة المحاسبية الثلاثية (Three-Way Matching)
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => onNavigateTab('requests')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
            >
              <FileText className="w-4 h-4" /> تقديم طلب شراء
            </button>
            <button 
              onClick={() => onNavigateTab('orders')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1 border border-white/20"
            >
              <ShoppingBag className="w-4 h-4" /> أوامر الشراء
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div 
          onClick={() => onNavigateTab('requests')}
          className="p-5 hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              {pendingPRs} بانتظار الاعتماد
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold">إجمالي طلبات الشراء (PR)</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{purchaseRequests.length}</h3>
          <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-0.5 mt-2">
            استعراض طلبات الشراء والاعتمادات <ChevronLeft className="w-3 h-3" />
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('orders')}
          className="p-5 hover:border-emerald-400 transition cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {activePOs} أوامر نشطة
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold">إجمالي أوامر الشراء الصادرة</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{purchaseOrders.length}</h3>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-2">
            متابعة الاستلامات وعقود التوريد <ChevronLeft className="w-3 h-3" />
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('bills')}
          className="p-5 hover:border-orange-400 transition cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-orange-50 text-orange-700 group-hover:bg-orange-600 group-hover:text-white transition">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
              {totalPOSpend.toLocaleString('ar-SA')} د.ل
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold">إجمالي قيمة التوريدات المعقودة</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{totalPOSpend.toLocaleString('ar-SA')} د.ل</h3>
          <span className="text-[11px] text-orange-600 font-semibold flex items-center gap-0.5 mt-2">
            كشف الحسابات ومطابقة الفواتير <ChevronLeft className="w-3 h-3" />
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('bills')}
          className="p-5 hover:border-purple-400 transition cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
              مطلوب السداد
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold">المستحقات المتبقية للموردين (AP)</p>
          <h3 className="text-2xl font-black text-red-600 mt-1">{totalUnpaidBills.toLocaleString('ar-SA')} د.ل</h3>
          <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-0.5 mt-2">
            جدولة المدفوعات والخزينة <ChevronLeft className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Procurement Process Workflow Diagram */}
      <div className="p-6 space-y-4">
        <h3 className="font-black text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="w-5 h-5 text-amber-600" /> خريطة دورة الشراء والمطابقة المحاسبية المؤسسية
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
          <div className="p-3 bg-transparent space-y-1">
            <span className="w-6 h-6 bg-[#2a1d13] text-[#fce79a] font-mono font-bold text-xs rounded-full inline-flex items-center justify-center">1</span>
            <h4 className="font-bold text-slate-900 text-xs">طلب شراء (PR)</h4>
            <p className="text-[11px] text-slate-500">تقديم الاحتياج وتحديد الميزانية المعتمدة</p>
          </div>

          <div className="p-3 bg-transparent space-y-1">
            <span className="w-6 h-6 bg-amber-600 text-white font-mono font-bold text-xs rounded-full inline-flex items-center justify-center">2</span>
            <h4 className="font-bold text-slate-900 text-xs">مناقصة عروض (RFQ)</h4>
            <p className="text-[11px] text-slate-500">مقارنة الأسعار والجودة من الموردين</p>
          </div>

          <div className="p-3 bg-transparent space-y-1">
            <span className="w-6 h-6 bg-emerald-600 text-white font-mono font-bold text-xs rounded-full inline-flex items-center justify-center">3</span>
            <h4 className="font-bold text-slate-900 text-xs">أمر شراء (PO)</h4>
            <p className="text-[11px] text-slate-500">التعاقد مع المورد الفائز بالترسية</p>
          </div>

          <div className="p-3 bg-transparent space-y-1">
            <span className="w-6 h-6 bg-orange-600 text-white font-mono font-bold text-xs rounded-full inline-flex items-center justify-center">4</span>
            <h4 className="font-bold text-slate-900 text-xs">فحص واستلام (GRN)</h4>
            <p className="text-[11px] text-slate-500">إدخال الأصناف المخزن وترحيل القيود</p>
          </div>

          <div className="p-3 bg-transparent space-y-1">
            <span className="w-6 h-6 bg-purple-600 text-white font-mono font-bold text-xs rounded-full inline-flex items-center justify-center">5</span>
            <h4 className="font-bold text-slate-900 text-xs">مطابقة وفاتورة المورد</h4>
            <p className="text-[11px] text-slate-500">مطابقة 3-Way وسداد مستحقات المورد</p>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-black text-slate-900 text-base">آخر أوامر الشراء واستلامات التوريد</h3>
          <button 
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-amber-600 hover:underline"
          >
            عرض جميع الأوامر ←
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#2a1d13] text-[#fce79a] font-bold text-xs uppercase">
              <tr>
                <th className="px-4 py-3">رقم الأمر</th>
                <th className="px-4 py-3">تاريخ الأمر</th>
                <th className="px-4 py-3">المورد</th>
                <th className="px-4 py-3">شروط الدفع</th>
                <th className="px-4 py-3">إجمالي القيمة</th>
                <th className="px-4 py-3">حالة الأمر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-transparent transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{po.poNo}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-semibold">{po.poDate}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{po.vendorName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{po.paymentTerms}</td>
                  <td className="px-4 py-3 font-black text-emerald-700">{po.grandTotal.toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> معتمد ومستلم جزئياً
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
