import { BookOpen } from 'lucide-react';
import React from 'react';
interface StudentLibraryProps {
  formStudent: {
    studentCode: string;
  };
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
}

export default function StudentLibrary({
  formStudent,
  triggerNotification
}: StudentLibraryProps) {
  return (
    <div className="space-y-4 text-right" id="student-library-section">
      <div className="bg-yellow-50 border border-yellow-100 p-4 flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-black text-yellow-950 font-sans font-semibold">بيانات عضوية المكتبة وسجل إعارات الكتب والعهدة الثقافية</p>
          <p className="text-yellow-700 mt-0.5 leading-relaxed font-sans">يتتبع هذا التبويب نشاط استعارة الكتب الخارجية للطلبة وغرامات التأخير المعلقة لمنع ضياع ممتلكات المكتبة المدرسية المركزية.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 text-right">
          <p className="text-[10px] text-slate-400 font-bold">رقم بطاقة عضوية المكتبة</p>
          <p className="text-base font-black text-slate-500 mt-1 font-mono">غير موثقة</p>
          <span className="inline-block bg-amber-50 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-black mt-2">بانتظار مصدر المكتبة المركزي</span>
        </div>

        <div className="p-4 text-right">
          <p className="text-[10px] text-slate-400 font-bold">الكتب المستعارة حالياً في عهدته</p>
          <p className="text-base font-black text-slate-500 mt-1">غير معروف</p>
          <span className="inline-block bg-slate-50 text-slate-600 text-[9px] px-1.5 py-0.2 rounded font-black mt-2">لا توجد إعارات موثقة</span>
        </div>

        <div className="p-4 text-right">
          <p className="text-[10px] text-slate-400 font-bold">مجموع غرامات التأخير المعلقة</p>
          <p className="text-base font-black text-emerald-600 mt-1">0.00 ريال</p>
          <span className="inline-block bg-emerald-50 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-black mt-2">لا يوجد غرامات معلقة</span>
        </div>
      </div>

      {/* Borrowed Books Listing */}
      <div className="overflow-hidden shadow-sm">
        <div className="bg-transparent p-4 border-b border-slate-200 flex justify-between items-center flex-row-reverse">
          <h4 className="text-xs font-black text-slate-800">تفاصيل الكتب المستعارة والعهدة الثقافية المدرسية</h4>
          <button
            type="button"
            onClick={() => triggerNotification('لا يمكن تسجيل إعارة قبل توفر مصدر المكتبة المركزي.', 'warning')}
              disabled
              className="bg-slate-300 text-slate-500 text-[11px] font-black px-3 py-1.5 rounded-lg cursor-not-allowed"
          >
            ➕ تسجيل إعارة كتاب جديدة
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-transparent text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">باركود الكتاب</th>
                <th className="p-3">عنوان الكتاب ومؤلفه</th>
                <th className="p-3">تاريخ الاستعارة</th>
                <th className="p-3">تاريخ الاسترجاع المحدد</th>
                <th className="p-3">حالة الإعارة والمطابقة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-mono font-bold text-slate-500">لا توجد بيانات</td>
                <td className="p-3">
                  <p className="font-extrabold text-slate-500">لا توجد إعارات موثقة</p>
                </td>
                <td className="p-3 text-slate-500 font-mono">—</td>
                <td className="p-3 text-slate-500 font-mono">—</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    لا توجد إعارة
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
