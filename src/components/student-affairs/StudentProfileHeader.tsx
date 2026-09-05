import { Hash } from 'lucide-react';
import React from 'react';
import { Student } from '../../types';

interface StudentProfileHeaderProps {
  formStudent: any;
  studentObj: Student;
  status: { bg: string, dot: string, label: string };
  stageName: string;
}

export default function StudentProfileHeader({ formStudent, studentObj, status, stageName }: StudentProfileHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-50 via-amber-50/20 to-slate-50 dark:from-slate-900/60 dark:via-amber-950/10 dark:to-slate-900/60 p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row items-stretch gap-6 select-text">
      {/* Photo & Main Status Column */}
      <div className="flex flex-col sm:flex-row items-center gap-5 xl:w-[35%] shrink-0">
        <div className="relative shrink-0">
          {formStudent.avatarUrl ? (
            <img
              src={formStudent.avatarUrl}
              alt={formStudent.fullNameAr}
              className="w-20 h-20 object-cover border-4 border-white dark:border-slate-800 shadow-md transition-transform hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              aria-label="صورة الطالب غير متاحة"
              className="w-20 h-20 flex items-center justify-center rounded-full bg-amber-100 text-amber-800 text-3xl font-black border-4 border-white dark:border-slate-800 shadow-md"
            >
              {(formStudent.fullNameAr || studentObj?.name || 'ط').trim().slice(0, 1)}
            </div>
          )}
          <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-800 ${status.dot} animate-pulse`}></span>
        </div>
        
        <div className="text-center sm:text-right space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate max-w-[200px] sm:max-w-none">{formStudent.fullNameAr || 'طالب غير مسمى'}</h2>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${status.bg} w-fit`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
              {status.label}
            </span>
          </div>
          
          <p className="text-xs font-semibold text-slate-400 font-mono tracking-wide truncate">{formStudent.fullNameEn || 'No English Name Registered'}</p>
          
          <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
            <span className="text-[10px] bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black px-2 py-0.5 rounded-md">
              {stageName}
            </span>
            <span className="text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-black px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/60">
              {formStudent.gradeName} - شعبة ({formStudent.section})
            </span>
          </div>
        </div>
      </div>
      
      {/* Divider */}
      <div className="hidden xl:block w-px bg-slate-200 dark:bg-slate-800 shrink-0" />
      
      {/* Credentials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 py-1 text-xs">
        <div className="space-y-2 bg-slate-500/5 dark:bg-slate-400/5 p-3 border border-slate-150 dark:border-slate-800">
          <div className="flex justify-between items-center flex-row-reverse border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5">
            <span className="font-extrabold text-slate-850 dark:text-slate-200">البيانات الثبوتية للطلاب</span>
            <Hash className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
            <div className="text-slate-400 font-bold">كود الطالب:</div>
            <div className="font-mono text-slate-900 dark:text-slate-100 font-black text-left">{formStudent.studentCode}</div>
            
            <div className="text-slate-400 font-bold">الرقم الأكاديمي:</div>
            <div className="font-mono text-slate-900 dark:text-slate-100 font-black text-left">{formStudent.academicId}</div>
            
            <div className="text-slate-400 font-bold">العام الدراسي:</div>
            <div className="text-slate-800 dark:text-slate-200 font-bold text-left">{formStudent.academicYear}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
