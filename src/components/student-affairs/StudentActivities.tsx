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
          <ul className="text-xs space-y-2.5 text-slate-700">
            <li className="flex justify-between items-center bg-transparent p-2 rounded-lg border flex-row-reverse">
              <span className="font-extrabold">نادي الذكاء الاصطناعي والابتكار</span>
              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded">عضو مبدع</span>
            </li>
            <li className="flex justify-between items-center bg-transparent p-2 rounded-lg border flex-row-reverse">
              <span className="font-extrabold">الجمعية الرياضية المدرسية (فريق كرة القدم)</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">كابتن الفريق</span>
            </li>
          </ul>
          <button
            type="button"
            onClick={() => triggerNotification('جاري فتح معالج الاشتراك بالأندية المدرسية اللامنهجية ومسابقات الموهبة...', 'info')}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-black py-2 transition-all cursor-pointer"
          >
            ➕ تسجيل الطالب في نادي إضافي
          </button>
        </div>

        {/* Awards Received */}
        <div className="p-5 text-right space-y-3">
          <h4 className="text-xs font-black text-slate-800 border-b pb-2">الجوائز وشهادات التميز وبطولات الأثر</h4>
          <ul className="text-xs space-y-2 text-slate-700 text-right">
            <li className="flex justify-between items-start bg-amber-50/50 p-2 rounded-lg border border-amber-200 flex-row-reverse">
              <span className="text-[9.5px] text-slate-450 font-mono font-bold">1447-02-15 هـ</span>
              <div>
                <p className="font-black text-amber-950 text-right">🏆 درع التميز العلمي على مستوى المدرسة</p>
                <p className="text-[9.5px] text-slate-500 mt-0.5 text-right">الفوز بالمركز الأول في مسابقة البحوث العلمية الشابة 1447 هـ</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
