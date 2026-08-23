import { BookOpen, ChevronRight, FileSpreadsheet, Settings, UserPlus } from 'lucide-react';
import React, { useMemo } from 'react';
interface StudentStatisticsCardsProps {
  filteredList: any[];
  activeMainView: 'directory' | 'academic_setup';
  setActiveMainView: React.Dispatch<React.SetStateAction<any>>;
  setActiveSection?: (val: any) => void;
  handleNewRecordInit: () => void;
  downloadExcel: () => void;
  selectedSchool: { name: string };
}

export default function StudentStatisticsCards({
  filteredList,
  activeMainView,
  setActiveMainView,
  setActiveSection,
  handleNewRecordInit,
  downloadExcel,
  selectedSchool
}: StudentStatisticsCardsProps) {
  const averageAge = useMemo(() => {
    const ages = filteredList
      .map(student => student.birthDate ? new Date(student.birthDate) : null)
      .filter((birth): birth is Date => Boolean(birth && !Number.isNaN(birth.getTime())))
      .map(birth => {
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
        return age;
      })
      .filter(age => age >= 0);
    return ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : null;
  }, [filteredList]);

  return (
    <div className="dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden" id="student-statistics-cards">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span>إدارة شؤون الطلاب</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">
            نظام متكامل لإدارة سجلات الطلاب، الملفات الأكاديمية، والبيانات الأسرية.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 shrink-0">
          {setActiveSection && (
            <button
              type="button"
              onClick={() => setActiveSection('dashboard')}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2.5 flex items-center gap-2 dark:border-slate-700 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveMainView(prev => prev === 'directory' ? 'academic_setup' : 'directory');
            }}
            className={`text-xs font-black px-4 py-2.5 flex items-center gap-2 border transition-all cursor-pointer ${
              activeMainView === 'academic_setup'
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : 'bg-transparent dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{activeMainView === 'directory' ? 'إعدادات الهيكل الأكاديمي' : 'بطاقات الطلاب'}</span>
          </button>

          <button
            type="button"
            onClick={handleNewRecordInit}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>تسجيل طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Statistics panels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-transparent dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">الطلاب</p>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono">{filteredList.length}</p>
        </div>
        <div className="bg-transparent dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">نشط</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{filteredList.filter(s => s.status === 'active').length}</p>
        </div>
        <div className="bg-transparent dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">متوسط العمر</p>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono">{averageAge ?? 'غير متحقق'} {averageAge !== null && <span className="text-[10px] font-bold text-slate-400">سنة</span>}</p>
        </div>
        <div className="bg-transparent dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">دقة البيانات</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">غير متحقق</p>
        </div>
      </div>
    </div>
  );
}
