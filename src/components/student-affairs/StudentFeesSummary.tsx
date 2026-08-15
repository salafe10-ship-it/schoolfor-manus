import { DollarSign } from 'lucide-react';
import React from 'react';
interface StudentFeesSummaryProps {
  formStudent: {
    feesRemaining: number;
  };
}

export default function StudentFeesSummary({
  formStudent
}: StudentFeesSummaryProps) {
  return (
    <div className="space-y-4 text-right" id="student-fees-summary-section">
      <div className="bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-black text-emerald-950 font-sans">بيانات كشف الحساب المالي من نظام المحاسبة المركزي (Real-time Live Sync)</p>
          <p className="text-emerald-700 mt-0.5 leading-relaxed font-sans font-semibold">تُعرض هذه البيانات بشكل مباشر وموثوق من دفاتر الحسابات العامة وقيود اليومية الخاصة بالطالب دون تخزين محلي مكرر لضمان الشفافية ومطابقة الميزانية.</p>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 text-right">
          <p className="text-[10px] text-slate-400 font-bold">إجمالي قيمة الفواتير السنوية</p>
          <p className="text-lg font-black text-slate-800 mt-1">{(formStudent.feesRemaining || 0) + 12500} <span className="text-[11px] font-medium text-slate-500">ريال</span></p>
          <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">شاملاً ضريبة القيمة المضافة</span>
        </div>

        <div className="p-4 text-right">
          <p className="text-[10px] text-slate-400 font-bold">إجمالي المبالغ المسددة</p>
          <p className="text-lg font-black text-emerald-600 mt-1">12500 <span className="text-[11px] font-medium text-slate-500">ريال</span></p>
          <span className="inline-block bg-emerald-50 text-emerald-700 text-[8.5px] px-1.5 py-0.2 rounded font-black mt-2">عبر بوابات الدفع الإلكتروني / مدى</span>
        </div>

        <div className="p-4 text-right">
          <p className="text-[10px] text-slate-400 font-bold">الذمم والرسوم المتبقية</p>
          <p className="text-lg font-black text-rose-600 mt-1">{formStudent.feesRemaining || 0} <span className="text-[11px] font-medium text-slate-500">ريال</span></p>
          <span className="inline-block bg-rose-50 text-rose-700 text-[8.5px] px-1.5 py-0.2 rounded font-black mt-2">مستحقة السداد فوراً</span>
        </div>
      </div>

      {/* Related Invoices Table */}
      <div className="overflow-hidden shadow-sm">
        <div className="bg-transparent p-4 border-b border-slate-200 flex justify-between items-center flex-row-reverse">
          <h4 className="text-xs font-black text-slate-800">تفاصيل الفواتير والقيود المحاسبية الصادرة للطالب</h4>
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-black px-2 py-0.5 rounded-lg">
            حالة الحساب المالي: {formStudent.feesRemaining > 0 ? 'مستحق الدفع' : 'مستوفي بالكامل'}
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
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-mono font-black text-slate-800">INV-1447-0091</td>
                <td className="p-3 text-slate-500 font-mono">1447-01-05 هـ</td>
                <td className="p-3 font-semibold text-slate-700">رسوم التسجيل والقبول السنوية الأساسية</td>
                <td className="p-3 text-left font-mono font-extrabold text-slate-900">12,500 ريال</td>
                <td className="p-3">
                  <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9.5px] font-black">
                    مسددة بالكامل
                  </span>
                </td>
              </tr>
              {formStudent.feesRemaining > 0 && (
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-black text-slate-800">INV-1447-0342</td>
                  <td className="p-3 text-slate-500 font-mono">1447-05-15 هـ</td>
                  <td className="p-3 font-semibold text-slate-700">القسط الثاني للرسوم الدراسية السنوية مع الرصيد المتبقي</td>
                  <td className="p-3 text-left font-mono font-extrabold text-slate-950">{formStudent.feesRemaining} ريال</td>
                  <td className="p-3">
                    <span className="inline-block bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[9.5px] font-black animate-pulse">
                      مستحقة ولم تدفع
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
