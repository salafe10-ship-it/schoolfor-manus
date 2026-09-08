import { DollarSign } from 'lucide-react';
import React from 'react';
interface StudentFeesSummaryProps {
  formStudent: {
    feesRemaining: number;
  };
  invoices?: Array<{
    id: string;
    invoiceDate?: string;
    dueDate?: string;
    item?: string;
    amount?: number;
    paidAmount?: number;
    remainingAmount?: number;
    status?: string;
  }>;
  receipts?: Array<{ amount?: number }>;
  lastSyncAt?: string | null;
}

export default function StudentFeesSummary({
  formStudent,
  invoices = [],
  receipts = [],
  lastSyncAt = null
}: StudentFeesSummaryProps) {
  const hasCanonicalData = invoices.length > 0;
  const totalInvoices = invoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const totalPaid = invoices.reduce((sum, invoice) => sum + Number(invoice.paidAmount || 0), 0) || receipts.reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
  const totalRemaining = invoices.reduce((sum, invoice) => sum + Number(invoice.remainingAmount || 0), 0);
  const money = (value: number) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال`;
  return (
    <div className="space-y-4 text-right" id="student-fees-summary-section">
      <div className="bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-black text-emerald-950 font-sans">بيانات كشف الحساب من المصدر المالي المركزي</p>
          <p className="text-emerald-700 mt-0.5 leading-relaxed font-sans font-semibold">
            {hasCanonicalData ? `بيانات موثقة${lastSyncAt ? ` — آخر مزامنة: ${new Date(lastSyncAt).toLocaleString('ar')}` : ''}.` : 'لم يتم العثور على فواتير مركزية موثقة لهذا الطالب؛ لن يتم تحويل الرصيد العام إلى مطالبة مالية.'}
          </p>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 text-right">
          <p className="text-[10px] text-slate-400 font-bold">إجمالي قيمة الفواتير السنوية</p>
          <p className="text-lg font-black text-slate-700 mt-1">{hasCanonicalData ? money(totalInvoices) : 'غير متوفر'}</p>
          <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">{hasCanonicalData ? `${invoices.length} فاتورة موثقة` : 'بانتظار تفاصيل الفواتير المركزية'}</span>
        </div>

        <div className="p-4 text-right">
          <p className="text-[10px] text-slate-400 font-bold">إجمالي المبالغ المسددة</p>
          <p className="text-lg font-black text-slate-700 mt-1">{hasCanonicalData ? money(totalPaid) : 'غير متوفر'}</p>
          <span className="inline-block bg-slate-50 text-slate-600 text-[8.5px] px-1.5 py-0.2 rounded font-black mt-2">{hasCanonicalData ? 'مدفوعات مرتبطة بفواتير' : 'لا توجد مدفوعات موثقة'}</span>
        </div>

        <div className="p-4 text-right">
          <p className="text-[10px] text-slate-400 font-bold">الذمم والرسوم المتبقية</p>
          <p className="text-lg font-black text-rose-600 mt-1">{hasCanonicalData ? money(totalRemaining) : 'غير متوفر'}</p>
          <span className="inline-block bg-rose-50 text-rose-700 text-[8.5px] px-1.5 py-0.2 rounded font-black mt-2">{hasCanonicalData ? 'الرصيد المتبقي حسب الفواتير' : 'لا يوجد استحقاق مؤكد'}</span>
        </div>
      </div>

      {/* Related Invoices Table */}
      <div className="overflow-hidden shadow-sm">
        <div className="bg-transparent p-4 border-b border-slate-200 flex justify-between items-center flex-row-reverse">
          <h4 className="text-xs font-black text-slate-800">تفاصيل الفواتير والقيود المحاسبية الصادرة للطالب</h4>
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-black px-2 py-0.5 rounded-lg">
            حالة الحساب المالي: {hasCanonicalData ? 'موثق من الفواتير المركزية' : 'غير متحقق لغياب تفاصيل الفواتير'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-transparent text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">البيان / الوصف</th>
                <th className="p-3 text-left">المبلغ</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {invoices.length === 0 ? (
                <tr><td colSpan={5} className="p-5 text-center text-slate-500 font-bold">لا توجد فواتير أو قيود موثقة للعرض.</td></tr>
              ) : invoices.map(invoice => (
                <tr key={invoice.id}>
                  <td className="p-3 font-mono">{invoice.id}</td>
                  <td className="p-3">{invoice.invoiceDate || '—'}</td>
                  <td className="p-3">{invoice.item || '—'}</td>
                  <td className="p-3 text-left font-bold">{money(Number(invoice.amount || 0))}</td>
                  <td className="p-3">{invoice.status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
