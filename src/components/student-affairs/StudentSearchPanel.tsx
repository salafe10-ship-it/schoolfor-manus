import { AlertTriangle, Calendar, ChevronDown, ChevronUp, Filter, Hash, HelpCircle, Layers, RefreshCw, Search } from 'lucide-react';
import React from 'react';
import { Stage, Grade } from '../../types';
import { EnterpriseLogger } from '../../database/services/EnterpriseLogger';
import { getTrustedAccessToken } from '../../utils/auth';

interface StudentSearchPanelProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterStage: string;
  setFilterStage: (val: string) => void;
  filterGrade: string;
  setFilterGrade: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  
  // Extended criteria
  filterSection: string;
  setFilterSection: (val: string) => void;
  filterAcademicYear: string;
  setFilterAcademicYear: (val: string) => void;
  
  // Advanced Targeted criteria
  advancedMode: boolean;
  setAdvancedMode: (val: boolean) => void;
  targetName: string;
  setTargetName: (val: string) => void;
  targetNationalId: string;
  setTargetNationalId: (val: string) => void;
  targetPhone: string;
  setTargetPhone: (val: string) => void;
  targetParentName: string;
  setTargetParentName: (val: string) => void;
  targetAcademicId: string;
  setTargetAcademicId: (val: string) => void;
  targetStudentCode: string;
  setTargetStudentCode: (val: string) => void;

  currentPage: number;
  setCurrentPage: (val: number) => void;
  totalPages: number;
  actualStages: Stage[];
  actualGrades: Grade[];
  sortedList: any[];
  paginatedList: any[];
  selectedStudentId: string;
  handleStudentSelect: (student: any) => void;
  selectedIds: Record<string, boolean>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setIsLoading: (val: boolean) => void;
  setStudents: React.Dispatch<React.SetStateAction<any[]>>;
  selectedSchool: { name: string };
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
  resetFilters: () => void;
}

export default function StudentSearchPanel({
  searchQuery,
  setSearchQuery,
  filterStage,
  setFilterStage,
  filterGrade,
  setFilterGrade,
  filterStatus,
  setFilterStatus,
  filterSection,
  setFilterSection,
  filterAcademicYear,
  setFilterAcademicYear,
  advancedMode,
  setAdvancedMode,
  targetName,
  setTargetName,
  targetNationalId,
  setTargetNationalId,
  targetPhone,
  setTargetPhone,
  targetParentName,
  setTargetParentName,
  targetAcademicId,
  setTargetAcademicId,
  targetStudentCode,
  setTargetStudentCode,
  currentPage,
  setCurrentPage,
  totalPages,
  actualStages,
  actualGrades,
  sortedList,
  paginatedList,
  selectedStudentId,
  handleStudentSelect,
  selectedIds,
  setSelectedIds,
  setIsLoading,
  setStudents,
  selectedSchool,
  triggerNotification,
  resetFilters
}: StudentSearchPanelProps) {
  return (
    <div className="lg:col-span-1 dark:bg-slate-900 dark:border-slate-800 flex flex-col h-[750px] overflow-hidden" id="student-search-panel">
      {/* Grid Headers and Filters */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3 shrink-0">
        <div className="flex justify-between items-center flex-row-reverse">
          <div className="text-right">
            <h3 className="font-black text-slate-900 dark:text-white text-sm tracking-tight">محرك البحث المؤسسي</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">فرز وتصفية البيانات المتقاطعة</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAdvancedMode(!advancedMode);
              triggerNotification(advancedMode ? 'تم تعطيل البحث المتقدم' : 'تم تفعيل معايير البحث المركب المتقدم', 'info');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-black transition-all ${
              advancedMode 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {advancedMode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>البحث المتقدم</span>
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick search input (Always Visible) */}
        {!advancedMode && (
          <div className="relative">
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="ابحث بالاسم، الكود، أو رقم الهاتف..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white pr-10 pl-4 py-2.5 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none font-bold text-right transition-all bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300"
            />
          </div>
        )}

        {/* Advanced Compound / Multi-criteria Form */}
        {advancedMode && (
          <div className="border border-slate-200/80 p-3 shadow-inner space-y-2.5 animate-fade-in text-right">
            <div className="flex justify-between items-center pb-1 border-b border-slate-100 flex-row-reverse">
              <span className="text-[10px] font-extrabold text-amber-950">تحديد حقول البحث المستهدفة:</span>
              <button 
                type="button" 
                onClick={resetFilters} 
                className="text-[9px] text-rose-600 font-black flex items-center gap-1 hover:underline"
              >
                تفريغ الحقول <RefreshCw className="w-2.5 h-2.5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {/* Name */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 mb-0.5">اسم الطالب الجزئي</label>
                <input
                  type="text"
                  placeholder="مثال: أحمد"
                  value={targetName}
                  onChange={(e) => { setTargetName(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50/50 rounded px-2 py-1 text-[10px] font-bold text-right focus:bg-white"
                />
              </div>
              {/* National ID */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 mb-0.5">رقم الهوية الوطنية / الإقامة</label>
                <input
                  type="text"
                  placeholder="10 أرقام"
                  value={targetNationalId}
                  onChange={(e) => { setTargetNationalId(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50/50 rounded px-2 py-1 text-[10px] font-bold text-right focus:bg-white"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 mb-0.5">هاتف الجوال (ولي الأمر/الأم)</label>
                <input
                  type="text"
                  placeholder="مثال: 059..."
                  value={targetPhone}
                  onChange={(e) => { setTargetPhone(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50/50 rounded px-2 py-1 text-[10px] font-bold text-right focus:bg-white"
                />
              </div>
              {/* Parent Name */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 mb-0.5">اسم ولي الأمر / الأب / الأم</label>
                <input
                  type="text"
                  placeholder="اسم ولي الأمر"
                  value={targetParentName}
                  onChange={(e) => { setTargetParentName(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50/50 rounded px-2 py-1 text-[10px] font-bold text-right focus:bg-white"
                />
              </div>

              {/* Academic ID */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 mb-0.5">الرقم الأكاديمي</label>
                <input
                  type="text"
                  placeholder="رقم القيد أو السجل الأكاديمي"
                  value={targetAcademicId}
                  onChange={(e) => { setTargetAcademicId(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50/50 rounded px-2 py-1 text-[10px] font-bold text-right focus:bg-white"
                />
              </div>
              {/* Student Code */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 mb-0.5">رمز الكود الموحد للطالب</label>
                <input
                  type="text"
                  placeholder="كود الطالب"
                  value={targetStudentCode}
                  onChange={(e) => { setTargetStudentCode(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50/50 rounded px-2 py-1 text-[10px] font-bold text-right focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Filters Grid (Stage, Section, Academic Year, Status) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Stage Filter */}
          <div>
            <select
              value={filterStage}
              onChange={(e) => {
                setFilterStage(e.target.value);
                setFilterGrade('');
                setCurrentPage(1);
              }}
              className="w-full border border-slate-250 text-slate-700 py-1.5 px-2 text-[10px] font-bold text-right focus:ring-1 focus:ring-amber-500"
            >
              <option value="">كل المراحل</option>
              {actualStages.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-slate-250 text-slate-700 py-1.5 px-2 text-[10px] font-bold text-right focus:ring-1 focus:ring-amber-500"
            >
              <option value="">كل حالات القيد</option>
              <option value="active">نشط</option>
              <option value="suspended">موقوف مؤقتاً</option>
              <option value="frozen">مؤجل القيد</option>
              <option value="graduated">متخرج</option>
              <option value="withdrawn">منسحب</option>
              <option value="dismissed">مفصول تأديبياً</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <input
              type="text"
              placeholder="شعبة (أ، ب، ج...)"
              value={filterSection}
              onChange={(e) => {
                setFilterSection(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-slate-250 text-slate-700 py-1.5 px-2.5 text-[10px] font-bold text-right placeholder-slate-400 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Academic Year Filter */}
          <div>
            <select
              value={filterAcademicYear}
              onChange={(e) => {
                setFilterAcademicYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-slate-250 text-slate-700 py-1.5 px-2 text-[10px] font-bold text-right focus:ring-1 focus:ring-amber-500"
            >
              <option value="">كل الأعوام الدراسية</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
              <option value="2027-2028">2027-2028</option>
            </select>
          </div>
        </div>

        {/* Optional Grade select */}
        {filterStage && (
          <div className="animate-fade-in">
            <select
              value={filterGrade}
              onChange={(e) => {
                setFilterGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-amber-50/60 border border-amber-200 text-amber-900 py-1.5 px-2 text-[10px] font-black text-right focus:ring-1 focus:ring-amber-500"
            >
              <option value="">اختر الصف المعني للتصفية</option>
              {actualGrades.filter(g => g.stageId === filterStage).map(g => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Active filters summary */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border border-slate-100 px-3 py-1.5 flex-row-reverse shadow-2xs">
          <span className="flex items-center gap-1 text-slate-700">
            تم العثور على: <strong>{sortedList.length}</strong> سجل طالب
          </span>
          { (searchQuery || filterStage || filterGrade || filterStatus || filterSection || filterAcademicYear || targetName || targetNationalId || targetPhone || targetParentName || targetAcademicId || targetStudentCode) && (
            <button
              type="button"
              onClick={() => {
                resetFilters();
                triggerNotification('تم تصفير عوامل الفرز بالكامل', 'info');
              }}
              className="text-rose-600 font-extrabold hover:underline text-[9px] flex items-center gap-0.5"
            >
              إلغاء التصفية ✕
            </button>
          )}
        </div>
      </div>

      {/* Directory Student list */}
      <div className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
        {paginatedList.length === 0 ? (
          <div className="text-center py-20 text-slate-400 px-4">
            <AlertTriangle className="w-10 h-10 mx-auto text-slate-300 mb-2 animate-pulse" />
            <p className="text-xs font-black">لا توجد سجلات مطابقة لمعايير البحث</p>
            <p className="text-[10px] text-slate-400 mt-1">يرجى التحقق من المدخلات أو إزالة بعض الفلاتر المركبة</p>
          </div>
        ) : (
          paginatedList.map((student) => {
            const isActive = student.id === selectedStudentId;
            const isSelectedCheckbox = !!selectedIds[student.id];
            return (
              <div
                key={student.id}
                onClick={() => handleStudentSelect(student)}
                className={`p-3.5 cursor-pointer transition-all duration-200 text-right flex gap-3 border-r-4 ${
                  isActive 
                    ? 'bg-gradient-to-l from-amber-50/70 to-amber-100/30 border-amber-600 shadow-xs' 
                    : 'hover:bg-slate-50/80 border-transparent'
                }`}
              >
                {/* Checkbox for Multi-select mapping */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIds(prev => ({ ...prev, [student.id]: !prev[student.id] }));
                  }}
                  className="flex items-center justify-center p-1 cursor-pointer"
                >
                  <input 
                    type="checkbox"
                    checked={isSelectedCheckbox}
                    onChange={() => {}} // Controlled by outer div click handle
                    className="w-4 h-4 text-amber-600  border-slate-300  rounded  focus:ring-[#9a6a1d] "
                  />
                </div>

                <img
                  src={student.avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face`}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover shrink-0 shadow-xs mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1 flex-row-reverse">
                    <h4 className="font-extrabold text-slate-900 text-xs truncate text-right">{student.name}</h4>
                    {student.status === 'active' && (
                      <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-250">نشط</span>
                    )}
                    {student.status === 'suspended' && (
                      <span className="bg-amber-50 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-250">موقوف مؤقتاً</span>
                    )}
                    {student.status === 'frozen' && (
                      <span className="bg-yellow-50 text-yellow-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-yellow-250">مؤجل القيد</span>
                    )}
                    {student.status === 'graduated' && (
                      <span className="bg-amber-50 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-250">متخرج</span>
                    )}
                    {student.status === 'withdrawn' && (
                      <span className="bg-transparent text-slate-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-250">منسحب</span>
                    )}
                    {student.status === 'dismissed' && (
                      <span className="bg-rose-50 text-rose-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-rose-250">مفصول</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate text-right">
                    {student.classroom} {student.section ? `- شعبة (${student.section})` : ''} 
                    {student.academicYear ? ` [${student.academicYear}]` : ''}
                  </p>
                  
                  <div className="flex items-center justify-between text-[9px] font-black mt-1.5 font-mono text-slate-400">
                    <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5 text-slate-300" />{student.academicId || 'ID_PENDING'}</span>
                    <span className="text-amber-600 font-bold">كود: {student.studentCode || '#' + student.id.replace(/\D/g, '').slice(-4) || '7291'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Directory Footer with Multi-Select Actions and Pagination */}
      <div className="p-3 bg-transparent border-t border-slate-100 flex flex-col gap-2 shrink-0">
        {/* Batch Action of multiselect */}
        {Object.values(selectedIds).filter(Boolean).length > 0 && (
          <div className="flex items-center justify-between bg-amber-50 p-1.5 rounded-lg border border-amber-200 animate-fade-in text-[10px]">
            <span className="font-bold text-amber-900">
              تم تحديد ({Object.values(selectedIds).filter(Boolean).length}) طالب
            </span>
            <button
              type="button"
              onClick={() => {
                const selectedCount = Object.values(selectedIds).filter(Boolean).length;
                if (confirm(`هل تريد بالتأكيد ترحيل إجراء الحذف الجماعي لـ ${selectedCount} طلاب محددين؟`)) {
                  setIsLoading(true);
                  const token = getTrustedAccessToken();
                  const deletePromises = Object.keys(selectedIds)
                    .filter(id => selectedIds[id])
                    .map(id => fetch(`/api/students/${id}`, { 
                      method: 'DELETE',
                      headers: {
                        'Authorization': token ? `Bearer ${token}` : ""
                      }
                    }));
                  
                  Promise.all(deletePromises)
                    .then(() => {
                      setStudents(prev => prev.filter(s => !selectedIds[s.id]));
                      setSelectedIds({});
                      setIsLoading(false);
                      triggerNotification(`تم الحذف الجماعي لـ ${selectedCount} طلاب بنجاح من قاعدة البيانات`, 'success');
                    })
                    .catch(err => {
                      setIsLoading(false);
                      EnterpriseLogger.error("An error occurred", "StudentAffairsPortal", { error: err });
                      triggerNotification("فشل الحذف الجماعي من الخادم", "warning");
                    });
                }
              }}
              className="bg-rose-600 text-white font-black px-2 py-1 rounded text-[9px] hover:bg-rose-700"
            >
              حذف المحدد جماعياً ✕
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="p-1 px-2.5 rounded border border-slate-250 hover:bg-slate-100 disabled:opacity-40"
          >
            السابق
          </button>
          <span className="font-bold">الصفحة {currentPage} من {totalPages}</span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            className="p-1 px-2.5 rounded border border-slate-250 hover:bg-slate-100 disabled:opacity-40"
          >
            التالي
          </button>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-200/50 flex items-center justify-center gap-1 flex-row-reverse">
          <span>عرض {sortedList.length} طالب بفرع {selectedSchool.name}</span>
          <span className="text-slate-300">|</span>
          <span className="text-[9px] text-slate-400">مؤرشف ومفهرس بالكامل</span>
        </div>
      </div>
    </div>
  );
}
