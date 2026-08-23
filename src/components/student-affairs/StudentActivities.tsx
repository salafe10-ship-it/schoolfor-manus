import { Award } from 'lucide-react';
import React from 'react';
interface StudentActivitiesProps {
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
}

export default function StudentActivities({
  triggerNotification
}: StudentActivitiesProps) {
  return (
    <div className="space-y-4 text-right" id="student-activities-section">
      <div className="bg-violet-50 border border-violet-100 p-4 flex items-start gap-3">
        <Award className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-black text-violet-950 font-sans font-semibold">الأثر اللامنهجي والجوائز والمشاركات الفعالة للطلبة</p>
          <p className="text-violet-700 mt-0.5 leading-relaxed font-sans">سجل كامل ببطولات ومسابقات الطالب اللامنهجية، الأندية المدرسية المسجل بها، ورصيد التميز الطلابي والجوائز الحاصل عليها كأثر أكاديمي سلوكي إيجابي.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Clubs */}
        <div className="p-5 text-right space-y-3">
          <h4 className="text-xs font-black text-slate-800 border-b pb-2">الأندية الطلابية والمواهب المشترك بها</h4>
          <p className="text-xs text-slate-500 p-2 border rounded-lg">لا توجد عضويات أو مشاركات موثقة من المصدر المركزي.</p>
          <button
            type="button"
            onClick={() => triggerNotification('لا يمكن تسجيل النادي قبل توفر مصدر الأنشطة المركزي.', 'warning')}
            className="w-full bg-slate-300 text-slate-500 text-xs font-black py-2 cursor-not-allowed"
            disabled
          >
            ➕ تسجيل الطالب في نادي إضافي
          </button>
        </div>

        {/* Awards Received */}
        <div className="p-5 text-right space-y-3">
          <h4 className="text-xs font-black text-slate-800 border-b pb-2">الجوائز وشهادات التميز وبطولات الأثر</h4>
          <p className="text-xs text-slate-500 p-2 border rounded-lg">لا توجد جوائز موثقة من المصدر المركزي.</p>
        </div>
      </div>
    </div>
  );
}
