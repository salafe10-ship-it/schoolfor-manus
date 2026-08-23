import { UserCheck } from 'lucide-react';
import React from 'react';
interface StudentUniformProps {
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
}

export default function StudentUniform({
  triggerNotification
}: StudentUniformProps) {
  return (
    <div className="space-y-4 text-right" id="student-uniform-section">
      <div className="bg-amber-50 border border-amber-100 p-4 flex items-start gap-3">
        <UserCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-black text-amber-950 font-sans font-semibold">إدارة صرف الزي المدرسي الرسمي والعهدة الشخصية للطلبة 👕</p>
          <p className="text-amber-700 mt-0.5 leading-relaxed font-sans">تحديث مقاسات الزي الرسمي للطالب وتدوين القطع والمجموعات المصروفة له مع موازنة فواتير الصرف مباشرة مع الحسابات العامة للمدرسة.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 space-y-4 text-right">
          <h4 className="text-xs font-black text-slate-800 border-b pb-2">سجل صرف الزي المدرسي المعتمد</h4>
          
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-slate-550 font-black">مقاس الزي المدرسي المعتمد للطالب:</span>
              <span className="bg-slate-100 text-slate-800 font-mono font-black text-[11px] px-2.5 py-0.5 rounded-md">
                غير محدد
              </span>
            </div>
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-slate-550 font-black">عدد القطع المستلمة من المستودع:</span>
              <span className="font-extrabold text-slate-500">غير موثق</span>
            </div>
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-slate-550 font-black">تاريخ ومسؤول الصرف الفعلي:</span>
              <span className="font-semibold text-slate-500">غير موثق</span>
            </div>
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-slate-550 font-black">قيمة رسوم الزي والمستلزمات:</span>
              <span className="font-black text-slate-500 font-mono">غير محددة</span>
            </div>
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-slate-550 font-black">حالة سداد قيمة الزي:</span>
              <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black text-[9.5px]">
                غير متحقق
              </span>
            </div>
          </div>

          <div className="pt-2 border-t flex gap-2">
            <button
              type="button"
              onClick={() => triggerNotification('لا يمكن تعديل المقاس قبل توفر مصدر الزي المركزي.', 'warning')}
              className="flex-1 bg-slate-300 text-slate-500 text-[11px] font-black py-2 cursor-not-allowed"
              disabled
            >
              👕 تعديل المقاس والمواصفات
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col justify-between text-right">
          <div>
            <h4 className="text-xs font-black text-slate-800 border-b pb-2 mb-3">صرف قطع إضافية أو بديلة للطالب</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-650 font-bold text-[10.5px] mb-1">القطعة المطلوب صرفها الآن:</label>
                <select disabled className="w-full bg-transparent border border-slate-250 rounded-lg p-2 text-xs font-black">
                  <option value="">لا توجد أصناف موثقة متاحة</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-655 font-bold text-[10.5px] mb-1">المقاس المطلوب صرفه حالياً:</label>
                <select disabled className="w-full bg-transparent border border-slate-250 rounded-lg p-2 text-xs font-black">
                  <option value="">لا توجد مقاسات موثقة متاحة</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => triggerNotification('لا يمكن صرف قطعة قبل توفر مصدر الزي المركزي.', 'warning')}
            className="w-full bg-slate-300 text-slate-500 font-extrabold text-xs py-2 cursor-not-allowed"
            disabled
          >
            تأكيد صرف وترحيل رسوم القطعة الإضافية
          </button>
        </div>
      </div>
    </div>
  );
}
