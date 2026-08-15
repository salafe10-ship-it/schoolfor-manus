import React from 'react';

interface StudentBasicInformationProps {
  formStudent: {
    studentCode: string;
    academicId: string;
    fullNameAr: string;
    gender: 'male' | 'female';
    birthDate: string;
    nationality: string;
    nationalId: string;
    religion: string;
    socialStatus: string;
  };
  setFormStudent: React.Dispatch<React.SetStateAction<any>>;
  calculatedAge: number;
}

const NATIONALITIES = ['سعودي', 'أردني', 'مصري', 'سوري', 'ليبي', 'تونسي', 'مغربي', 'يمني'];
const RELIGIONS = ['مسلم', 'أخرى'];
const SOCIAL_STATUSES = ['أعزب / يعيش مع الوالدين', 'أخرى'];

export default function StudentBasicInformation({
  formStudent,
  setFormStudent,
  calculatedAge
}: StudentBasicInformationProps) {
  return (
    <div className="space-y-4" id="student-basic-info-section">
      <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <span className="w-1 h-5 bg-amber-600 rounded-full"></span>
        البيانات الأساسية للطالب
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Student Code */}
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold text-xs mb-1.5 flex items-center justify-between">
            <span>رقم الطالب (كود فريد):</span>
            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">تلقائيّ ذكي</span>
          </label>
          <input
            type="text"
            required
            value={formStudent.studentCode}
            onChange={(e) => setFormStudent((prev: any) => ({ ...prev, studentCode: e.target.value }))}
            className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-100 p-3 text-xs text-left font-mono font-black focus:ring-2 focus:ring-emerald-500/20 transition-all"
            placeholder="0001"
          />
        </div>

        {/* Academic ID */}
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold text-xs mb-1.5">الرقم الأكاديمي:</label>
          <input
            type="text"
            required
            value={formStudent.academicId}
            onChange={(e) => setFormStudent((prev: any) => ({ ...prev, academicId: e.target.value }))}
            className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 p-3 text-xs text-left font-mono font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 focus:ring-2 focus:ring-amber-500/20 transition-all"
            placeholder="مثال: SAH-1447-101"
          />
        </div>

        {/* Arabic Full name */}
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold text-xs mb-1.5">الاسم رباعي (بالعربي):</label>
          <input
            type="text"
            required
            value={formStudent.fullNameAr}
            onChange={(e) => setFormStudent((prev: any) => ({ ...prev, fullNameAr: e.target.value }))}
            className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 p-3 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 focus:ring-2 focus:ring-amber-500/20 transition-all"
            placeholder="مثال: فواز بن عبدالله السبهان"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold text-xs mb-1.5">الجنس:</label>
          <select
            value={formStudent.gender}
            onChange={(e) => setFormStudent((prev: any) => ({ ...prev, gender: e.target.value as any }))}
            className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 p-3 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 transition-all"
          >
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </div>

        {/* Birth Date */}
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold text-xs mb-1.5">تاريخ الميلاد:</label>
          <input
            type="date"
            value={formStudent.birthDate}
            onChange={(e) => setFormStudent((prev: any) => ({ ...prev, birthDate: e.target.value }))}
            className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 p-3 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 transition-all text-left"
          />
        </div>

        {/* Age calculated automatically */}
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold text-xs mb-1.5">العمر:</label>
          <div className="w-full bg-slate-100 dark:bg-slate-900 dark:border-slate-800 p-3 text-xs font-mono font-black text-amber-700 dark:text-amber-400">
            {calculatedAge} سنة
          </div>
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold text-xs mb-1.5">الجنسية:</label>
          <select
            value={formStudent.nationality}
            onChange={(e) => setFormStudent((prev: any) => ({ ...prev, nationality: e.target.value }))}
            className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 p-3 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 transition-all"
          >
            {NATIONALITIES.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* National ID */}
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold text-xs mb-1.5">الرقم الوطني / الإقامة:</label>
          <input
            type="text"
            required
            value={formStudent.nationalId}
            onChange={(e) => setFormStudent((prev: any) => ({ ...prev, nationalId: e.target.value }))}
            className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 p-3 text-xs font-bold text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-amber-500/20 transition-all"
            placeholder="مثال: 1029384756"
          />
        </div>

        {/* Religion */}
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold text-xs mb-1.5">الديانة:</label>
          <select
            value={formStudent.religion}
            onChange={(e) => setFormStudent((prev: any) => ({ ...prev, religion: e.target.value }))}
            className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 p-3 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 transition-all"
          >
            {RELIGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Social Status */}
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold text-xs mb-1.5">الحالة الاجتماعية:</label>
          <select
            value={formStudent.socialStatus}
            onChange={(e) => setFormStudent((prev: any) => ({ ...prev, socialStatus: e.target.value }))}
            className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 p-3 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 transition-all"
          >
            {SOCIAL_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
