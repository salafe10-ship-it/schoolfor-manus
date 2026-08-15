import { Truck } from 'lucide-react';
import React from 'react';
interface StudentTransportProps {
  formStudent: {
    studentCode: string;
  };
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
}

export default function StudentTransport({
  formStudent,
  triggerNotification
}: StudentTransportProps) {
  return (
    <div className="space-y-4 text-right" id="student-transport-section">
      <div className="bg-amber-50 border border-amber-100 p-4 flex items-start gap-3">
        <Truck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-black text-amber-950">تكامل نظام النقل والحافلات المدرسية (Bus Roster Sync) 🚌</p>
          <p className="text-amber-700 mt-0.5 leading-relaxed font-sans font-semibold">تحديث وإدارة اشتراك الطالب بالنقل المدرسي، وتعيين مسار الحافلة والسائق المناسب لموقع الطالب الجغرافي لتأمين سلامة العودة المنزلية.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 space-y-4 text-right">
          <h4 className="text-xs font-black text-slate-800 border-b pb-2">تفاصيل اشتراك الحافلة النشط</h4>
          
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-slate-550 font-black">حالة قيد الاشتراك:</span>
              <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black text-[10px]">
                مشترك نشط
              </span>
            </div>
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-slate-550 font-black">رقم مسار الحافلة المخصصة:</span>
              <span className="font-black text-slate-800 font-mono">Bus-Route #14 (شمال الرياض)</span>
            </div>
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-slate-550 font-black">اسم السائق وهاتفه:</span>
              <span className="font-extrabold text-slate-800">أبو محمد السديري (0503928123)</span>
            </div>
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-slate-550 font-black">نقطة ركوب الطالب الصباحية:</span>
              <span className="font-semibold text-slate-700">أمامي المنزل السكني للمشترك</span>
            </div>
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-slate-550 font-black">رسوم الاشتراك السنوية بالنقل:</span>
              <span className="font-black text-slate-950 font-mono">3,200 ريال</span>
            </div>
          </div>

          <div className="pt-2 border-t flex gap-2">
            <button
              type="button"
              onClick={() => triggerNotification('جاري إعادة حساب أقصر مسار للحافلة ومطابقة نقطة ركوب الطالب...', 'info')}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-black py-2 transition-all cursor-pointer"
            >
              🔄 تحديث ومطابقة المسار
            </button>
            <button
              type="button"
              onClick={() => triggerNotification('تم إيقاف الاشتراك بالنقل وخصم الرسوم التناسبية من حساب الطالب المالي بنجاح', 'success')}
              className="bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-black px-3 py-2 border border-rose-200 transition-colors cursor-pointer"
            >
              إلغاء الاشتراك بالنقل
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col justify-between text-right">
          <div>
            <h4 className="text-xs font-black text-slate-800 border-b pb-2 mb-3">تخصيص مسار حافلة بديل للطالب</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-650 font-bold text-[10.5px] mb-1">المسار المطلوب لتوصيل الطالب:</label>
                <select className="w-full bg-transparent border border-slate-250 rounded-lg p-2 text-xs font-black">
                  <option value="route_north">مسار شمال الرياض - حافلة رقم 14</option>
                  <option value="route_east">مسار شرق الرياض - حافلة رقم 09</option>
                  <option value="route_west">مسار غرب الرياض - حافلة رقم 22</option>
                  <option value="route_south">مسار وسط وجنوب الرياض - حافلة رقم 05</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-650 font-bold text-[10.5px] mb-1">فترة التوصيل والنقل المدرسي:</label>
                <select className="w-full bg-transparent border border-slate-250 rounded-lg p-2 text-xs font-black">
                  <option value="both">الفترتين: الذهاب صباحاً والعودة مساءً</option>
                  <option value="morning">الذهاب للمدرسة فقط (صباحاً)</option>
                  <option value="afternoon">العودة للمنزل فقط (مساءً)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => triggerNotification('تم تغيير مسار الحافلة وتعميم التعديل على جهاز تتبع السائق في الحافلة بنجاح!', 'success')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs py-2 transition-all mt-4 cursor-pointer"
          >
            حفظ ونقل الحافلة المخصصة
          </button>
        </div>
      </div>
    </div>
  );
}
