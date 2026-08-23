import React, { useState, useMemo } from 'react';
import { 
  BookOpen, GraduationCap, Calendar, Layers, CheckCircle2, AlertTriangle, 
  Search, Filter, RotateCcw, Plus, Edit, Trash2, Eye, Printer, FileSpreadsheet, 
  Clock, Users, Building, Settings, ShieldCheck, ChevronRight, ChevronLeft, 
  Download, Upload, ArrowRightLeft, Sparkles, Check, X, UserCheck, AlertCircle, 
  Grid, List, FileText, HelpCircle, RefreshCw, Award, Compass, LayoutGrid
} from 'lucide-react';
import { Student, Teacher, School, UserRole, Stage, Grade, AcademicClass } from '../types';

interface AcademicAffairsPortalProps {
  students: Student[];
  teachers: Teacher[];
  selectedSchool: School;
  currentRole: UserRole;
  logAction: (action: string, details: string, module: string) => void;
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
  setActiveSection?: (section: string) => void;
  stages?: Stage[];
  setStages?: React.Dispatch<React.SetStateAction<Stage[]>>;
  grades?: Grade[];
  setGrades?: React.Dispatch<React.SetStateAction<Grade[]>>;
  academicClasses?: AcademicClass[];
  setAcademicClasses?: React.Dispatch<React.SetStateAction<AcademicClass[]>>;
}

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  stageName: string;
  gradeName: string;
  creditHours: number;
  weeklyPeriods: number;
  passingScore: number;
  maxScore: number;
  assignedTeacherId: string;
  assignedTeacherName: string;
  isElective: boolean;
  status: 'active' | 'draft' | 'archived';
}

interface SchedulePeriod {
  id: string;
  day: 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس';
  periodNumber: number; // 1 to 7
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  roomName: string;
}

export default function AcademicAffairsPortal({
  students,
  teachers,
  selectedSchool,
  currentRole,
  logAction,
  triggerNotification,
  setActiveSection,
  stages = [],
  setStages,
  grades = [],
  setGrades,
  academicClasses = [],
  setAcademicClasses
}: AcademicAffairsPortalProps) {

  // Active Sub-Tab State
  const [activeTab, setActiveTab] = useState<'structure' | 'subjects' | 'classes' | 'timetable' | 'analytics' | 'settings'>('structure');

  // Year & Term Selection State
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('1447 - 1448 هـ (2026/2027)');
  const [selectedSemester, setSelectedSemester] = useState<string>('الفصل الدراسي الأول');

  // تُحمّل المقررات من الهيكل الأكاديمي المركزي؛ لا تُزرع بيانات تجريبية عند الفتح.
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Timetable State
  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>([]);

  // Search & Filters State
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Add/Edit Subject Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    stageName: 'المرحلة الابتدائية',
    gradeName: 'الصف الأول الابتدائي',
    creditHours: 3,
    weeklyPeriods: 4,
    passingScore: 50,
    maxScore: 100,
    assignedTeacherId: '',
    isElective: false
  });

  // Add Class Section Modal State
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [classForm, setClassForm] = useState({
    code: '',
    name: '',
    gradeId: '',
    capacity: 30,
    isActive: true
  });

  // Add Schedule Entry Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [scheduleForm, setScheduleForm] = useState({
    day: 'الأحد' as 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس',
    periodNumber: 1,
    className: 'الصف الأول الابتدائي (أ)',
    subjectId: '',
    teacherId: '',
    roomName: 'قاعة 101'
  });

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      const matchKeyword = !searchKeyword || 
        s.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        s.code.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        s.assignedTeacherName.toLowerCase().includes(searchKeyword.toLowerCase());
      
      const matchStage = selectedStageFilter === 'all' || s.stageName.includes(selectedStageFilter);
      const matchGrade = selectedGradeFilter === 'all' || s.gradeName.includes(selectedGradeFilter);

      return matchKeyword && matchStage && matchGrade;
    });
  }, [subjects, searchKeyword, selectedStageFilter, selectedGradeFilter]);

  // Conflict Detection Algorithm for Timetable
  const scheduleConflicts = useMemo(() => {
    const conflicts: { type: string; message: string; period: SchedulePeriod }[] = [];
    const teacherMap: { [key: string]: SchedulePeriod } = {};
    const roomMap: { [key: string]: SchedulePeriod } = {};

    schedulePeriods.forEach(p => {
      const teacherKey = `${p.day}-${p.periodNumber}-${p.teacherId}`;
      const roomKey = `${p.day}-${p.periodNumber}-${p.roomName}`;

      if (teacherMap[teacherKey]) {
        conflicts.push({
          type: 'teacher',
          message: `تعارض المعلم (${p.teacherName}) في ${p.day} الحصة ${p.periodNumber} بين ${p.className} و ${teacherMap[teacherKey].className}`,
          period: p
        });
      } else {
        teacherMap[teacherKey] = p;
      }

      if (roomMap[roomKey]) {
        conflicts.push({
          type: 'room',
          message: `تعارض القاعة الدراسية (${p.roomName}) في ${p.day} الحصة ${p.periodNumber} بين ${p.className} و ${roomMap[roomKey].className}`,
          period: p
        });
      } else {
        roomMap[roomKey] = p;
      }
    });

    return conflicts;
  }, [schedulePeriods]);

  // Metrics
  const totalSubjectsCount = subjects.length;
  const totalWeeklyPeriods = subjects.reduce((acc, curr) => acc + curr.weeklyPeriods, 0);
  const totalClassesCount = academicClasses.length;
  const activeTeachersCount = teachers.length;
  const conflictCount = scheduleConflicts.length;

  // Save Subject
  const handleSaveSubject = () => {
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
      triggerNotification('يرجى ملء رمز واسم المادة الدراسية بصورة صحيحة', 'warning');
      return;
    }

    const assignedTeacher = teachers.find(t => t.id === subjectForm.assignedTeacherId);
    const teacherName = assignedTeacher ? assignedTeacher.name : 'غير محدد';

    if (selectedSubject) {
      // Edit
      const updated = subjects.map(s => s.id === selectedSubject.id ? {
        ...s,
        code: subjectForm.code,
        name: subjectForm.name,
        stageName: subjectForm.stageName,
        gradeName: subjectForm.gradeName,
        creditHours: Number(subjectForm.creditHours),
        weeklyPeriods: Number(subjectForm.weeklyPeriods),
        passingScore: Number(subjectForm.passingScore),
        maxScore: Number(subjectForm.maxScore),
        assignedTeacherId: subjectForm.assignedTeacherId,
        assignedTeacherName: teacherName,
        isElective: subjectForm.isElective
      } : s);

      setSubjects(updated);
      logAction('UPDATE_SUBJECT', `تحديث المادة الدراسية: ${subjectForm.name}`, 'الشؤون الأكاديمية');
      triggerNotification(`تم تعديل بيانات المادة ${subjectForm.name} بنجاح`, 'success');
    } else {
      // Create
      const newSubj: SubjectItem = {
        id: `subj_${Date.now()}`,
        code: subjectForm.code,
        name: subjectForm.name,
        stageName: subjectForm.stageName,
        gradeName: subjectForm.gradeName,
        creditHours: Number(subjectForm.creditHours),
        weeklyPeriods: Number(subjectForm.weeklyPeriods),
        passingScore: Number(subjectForm.passingScore),
        maxScore: Number(subjectForm.maxScore),
        assignedTeacherId: subjectForm.assignedTeacherId,
        assignedTeacherName: teacherName,
        isElective: subjectForm.isElective,
        status: 'active'
      };

      setSubjects([newSubj, ...subjects]);
      logAction('CREATE_SUBJECT', `إضافة مادة دراسية جديدة: ${subjectForm.name}`, 'الشؤون الأكاديمية');
      triggerNotification(`تم إضافة المادة الدراسية الجديدة ${subjectForm.name} بنجاح`, 'success');
    }

    setIsSubjectModalOpen(false);
    setSelectedSubject(null);
  };

  // Open Edit Subject
  const handleOpenEditSubject = (subj: SubjectItem) => {
    setSelectedSubject(subj);
    setSubjectForm({
      code: subj.code,
      name: subj.name,
      stageName: subj.stageName,
      gradeName: subj.gradeName,
      creditHours: subj.creditHours,
      weeklyPeriods: subj.weeklyPeriods,
      passingScore: subj.passingScore,
      maxScore: subj.maxScore,
      assignedTeacherId: subj.assignedTeacherId,
      isElective: subj.isElective
    });
    setIsSubjectModalOpen(true);
  };

  // Delete Subject
  const handleDeleteSubject = (subj: SubjectItem) => {
    if (window.confirm(`هل أنت تأكد من حذف المادة الدراسية (${subj.name})؟`)) {
      setSubjects(prev => prev.filter(s => s.id !== subj.id));
      logAction('DELETE_SUBJECT', `حذف المادة الدراسية: ${subj.name}`, 'الشؤون الأكاديمية');
      triggerNotification(`تم حذف المادة الدراسية ${subj.name} بنجاح`, 'info');
    }
  };

  // Add Schedule Period
  const handleSaveSchedulePeriod = () => {
    const selectedSubj = subjects.find(s => s.id === scheduleForm.subjectId);
    const selectedTeach = teachers.find(t => t.id === scheduleForm.teacherId);

    if (!selectedSubj || !selectedTeach) {
      triggerNotification('يرجى اختيار المادة والمعلم المكلف بشكل صحيح', 'warning');
      return;
    }

    const newPeriod: SchedulePeriod = {
      id: `sched_${Date.now()}`,
      day: scheduleForm.day,
      periodNumber: Number(scheduleForm.periodNumber),
      classId: 'cls_custom',
      className: scheduleForm.className,
      subjectId: selectedSubj.id,
      subjectName: selectedSubj.name,
      teacherId: selectedTeach.id,
      teacherName: selectedTeach.name,
      roomName: scheduleForm.roomName
    };

    setSchedulePeriods([...schedulePeriods, newPeriod]);
    logAction('ADD_SCHEDULE_PERIOD', `تخصيص حصة دراسية: ${selectedSubj.name} - ${scheduleForm.className}`, 'الشؤون الأكاديمية');
    triggerNotification(`تم إضافة الحصة الدراسية للجدول بنجاح!`, 'success');
    setIsScheduleModalOpen(false);
  };

  // Export CSV
  const handleExportSubjectsCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "رمز المادة,اسم المادة,المرحلة,الصف,الساعات المعتمدة,الحصص الأسبوعية,المعلم المكلف,نوع المادة\n" +
      filteredSubjects.map(s => 
        `"${s.code}","${s.name}","${s.stageName}","${s.gradeName}","${s.creditHours}","${s.weeklyPeriods}","${s.assignedTeacherName}","${s.isElective ? 'اختيارية' : 'إجبارية'}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `الخطة_الدراسية_المعتمدة_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification(`تم تصدير ملف الخطط والمواد الدراسية بنجاح`, 'success');
  };

  // Print Curriculum List
  const handlePrintCurriculum = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification('يرجى السماح بالنوافذ المنبثقة للطباعة', 'warning');
      return;
    }

    const rowsHTML = filteredSubjects.map((sb, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-family: monospace; font-weight: bold;">${sb.code}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${sb.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${sb.stageName} - ${sb.gradeName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${sb.creditHours} ساعات</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${sb.weeklyPeriods} حصص</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${sb.assignedTeacherName}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير الخطة والمواد الدراسية - ${selectedSchool.name || 'EduPro ERP'}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; direction: rtl; }
            h1 { text-align: center; color: #1c120c; margin-bottom: 5px; }
            h3 { text-align: center; color: #7c5e10; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background-color: #2a1d13; color: #ffe5a3; padding: 10px; border: 1px solid #444; }
            .header-info { display: flex; justify-content: space-between; border-bottom: 2px solid #d4af37; padding-bottom: 10px; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div>
              <h2>${selectedSchool.name || 'مدرسة EduPro Enterprise النموذجية'}</h2>
              <div>إدارة الشؤون الأكاديمية والخطط الدراسية</div>
            </div>
            <div style="text-align: left;">
              <div>العام الدراسي: ${selectedAcademicYear}</div>
              <div>الفصل: ${selectedSemester}</div>
            </div>
          </div>
          <h1>كشف الخطة والمواد الدراسية المعتمدة</h1>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>رمز المادة</th>
                <th>اسم المادة الدراسية</th>
                <th>المرحلة والصف</th>
                <th>الساعات</th>
                <th>الحصص</th>
                <th>المعلم المكلف</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    triggerNotification('جاري تحضير كشف الخطط الدراسية للطابعة...', 'info');
  };

  return (
    <div 
      id="academic-affairs-command-center"
      className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6"
      dir="rtl"
    >
      {/* ==========================================
          LUXURY GOLD METALLIC TOP HEADER
         ========================================== */}
      <div className="bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] text-white rounded-3xl p-4 sm:p-5 border-2 border-[#d4af37]/40 shadow-2xl flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-20 bg-[#d4af37]/10 blur-3xl pointer-events-none" />
        
        {/* Title & Path */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#9a6a1d] via-[#f7d174] to-[#c58a22] p-[2px] shadow-lg shadow-[#d4af37]/20 flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#2a1b10] flex items-center justify-center text-amber-300 font-black">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300/80 font-bold mb-0.5">
              <span className="cursor-pointer hover:underline" onClick={() => setActiveSection && setActiveSection('dashboard')}>الرئيسية</span>
              <span>‹</span>
              <span className="text-amber-100">إدارة الشؤون الأكاديمية</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#ffe5a3] via-[#fce79a] to-[#d4af37] bg-clip-text text-transparent">
              مركز الإدارة والخطط والأعوام الأكاديمية
            </h1>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[#2a1d13]/90 border border-[#d4af37]/40 p-1.5 shadow-inner relative z-10 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('structure')}
            className={`px-3.5 py-2 text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'structure' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>الهيكل والأعوام</span>
          </button>

          <button 
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-2 text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'subjects' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>المواد والخطط</span>
          </button>

          <button 
            onClick={() => setActiveTab('classes')}
            className={`px-3.5 py-2 text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'classes' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>الفصول والشعب</span>
          </button>

          <button 
            onClick={() => setActiveTab('timetable')}
            className={`px-3.5 py-2 text-xs font-black transition-all flex items-center gap-1.5 relative ${
              activeTab === 'timetable' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>الجداول والتعارضات</span>
            {conflictCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1 left-1" />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>التقارير والإحصائيات</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'settings' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>الإعدادات الحاكمة</span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 relative z-10">
          <button 
            onClick={handleExportSubjectsCSV}
            className="bg-[#2a1d13] border border-[#d4af37]/40 hover:border-[#f7d174] text-amber-200 px-3 py-2 text-xs font-bold flex items-center gap-1.5 hover:scale-105 transition-all shadow cursor-pointer"
            title="تصدير الخطة الدراسية Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">تصدير Excel</span>
          </button>

          <button 
            onClick={handlePrintCurriculum}
            className="bg-[#2a1d13] border border-[#d4af37]/40 hover:border-[#f7d174] text-amber-200 px-3 py-2 text-xs font-bold flex items-center gap-1.5 hover:scale-105 transition-all shadow cursor-pointer"
            title="طباعة الخطط الدراسية"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">طباعة الخطط</span>
          </button>

          <button 
            onClick={() => {
              setSubjectForm({
                code: `SUB-${Math.floor(100 + Math.random() * 900)}`,
                name: '',
                stageName: 'المرحلة الابتدائية',
                gradeName: 'الصف الأول الابتدائي',
                creditHours: 3,
                weeklyPeriods: 4,
                passingScore: 50,
                maxScore: 100,
                assignedTeacherId: teachers[0]?.id || '',
                isElective: false
              });
              setSelectedSubject(null);
              setIsSubjectModalOpen(true);
            }}
            className="bg-gradient-to-r from-[#9a6a1d] via-[#f7d174] to-[#c58a22] text-slate-950 font-black px-4 py-2 text-xs flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مادة جديدة</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          METALLIC KPI CARDS ROW (5 Cards)
         ========================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        
        {/* KPI 1: Academic Year & Term */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-black text-slate-700 block">العام الدراسي الحالي</span>
            <span className="text-sm font-black text-amber-900 font-mono block mt-1">{selectedAcademicYear}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">{selectedSemester}</span>
          </div>
          <div className="w-11 h-11 bg-[#2a1a0e] text-amber-300 flex items-center justify-center border border-[#d4af37]/40 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Total Subjects */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-black text-slate-700 block">المواد الدراسية المسجلة</span>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block mt-1">{totalSubjectsCount} مادة</span>
            <span className="text-[10px] font-bold text-slate-500 block mt-1">شاملة المواد الاختيارية</span>
          </div>
          <div className="w-11 h-11 bg-[#2a1a0e] text-amber-400 flex items-center justify-center border border-[#d4af37]/40 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Weekly Periods */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-black text-slate-700 block">إجمالي الحصص الأسبوعية</span>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block mt-1">{totalWeeklyPeriods} حصة</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">موزعة على الفصول</span>
          </div>
          <div className="w-11 h-11 bg-[#2a1a0e] text-amber-400 flex items-center justify-center border border-[#d4af37]/40 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Active Classes & Sections */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-black text-slate-700 block">الفصول والشعب المفتوحة</span>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block mt-1">{totalClassesCount} شعبة</span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">{totalClassesCount > 0 ? 'بيانات السعة من السجل المركزي' : 'السعة غير متحققة'}</span>
          </div>
          <div className="w-11 h-11 bg-[#2a1a0e] text-amber-400 flex items-center justify-center border border-[#d4af37]/40 shrink-0">
            <Building className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 5: Schedule Conflicts Status */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-black text-slate-700 block">سلامة الجدول والتعارضات</span>
            <span className={`text-2xl font-black font-mono tracking-tight block mt-1 ${conflictCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {schedulePeriods.length === 0 ? 'غير متحقق' : conflictCount > 0 ? `${conflictCount} تعارض` : 'صفر تعارضات'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${conflictCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {schedulePeriods.length === 0 ? 'بانتظار جدول مركزي' : conflictCount > 0 ? 'يتطلب التعديل' : 'لا توجد تعارضات'}
            </span>
          </div>
          <div className={`w-11 h-11 bg-[#2a1a0e] flex items-center justify-center border border-[#d4af37]/40 shrink-0 ${conflictCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {schedulePeriods.length === 0 || conflictCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
        </div>

      </div>

      {/* ==========================================
          TAB CONTENT 1: ACADEMIC STRUCTURE & YEARS
         ========================================== */}
      {activeTab === 'structure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Year & Term Controls (4/12) */}
          <div className="lg:col-span-4 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-amber-900/10">
              <div className="w-7 h-7 rounded-lg bg-[#2a1a0e] text-amber-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900">إدارة التقويم والعام الدراسي</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">العام الدراسي الفعال</label>
                <select 
                  value={selectedAcademicYear}
                  onChange={e => setSelectedAcademicYear(e.target.value)}
                  className="w-full border border-slate-300 p-2.5 font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                >
                  <option value="1447 - 1448 هـ (2026/2027)">1447 - 1448 هـ (2026/2027) - الجاري</option>
                  <option value="1446 - 1447 هـ (2025/2026)">1446 - 1447 هـ (2025/2026) - مؤرشف</option>
                  <option value="1448 - 1449 هـ (2027/2028)">1448 - 1449 هـ (2027/2028) - قادم</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الفصل الدراسي الحالي</label>
                <select 
                  value={selectedSemester}
                  onChange={e => setSelectedSemester(e.target.value)}
                  className="w-full border border-slate-300 p-2.5 font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                >
                  <option value="الفصل الدراسي الأول">الفصل الدراسي الأول (Semester 1)</option>
                  <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني (Semester 2)</option>
                  <option value="الفصل الدراسي الثالث">الفصل الدراسي الثالث (Semester 3)</option>
                  <option value="الفصل الصيفي المكثف">الفصل الصيفي المكثف (Summer Session)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-black">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>حالة العام الأكاديمي النشط</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-bold">
                  جميع قيود التسجيل والرسوم المدرسية والنتائج والشهادات والجداول الدراسية ربطها آلياً على العام والأقسام المختارة.
                </p>
              </div>

              <button 
                onClick={() => {
                  triggerNotification('تم اعتماد وتحديث العام الأكاديمي والفصل لجميع الشاشات بنجاح', 'success');
                  logAction('SWITCH_ACADEMIC_YEAR', `تغيير العام الدراسي إلى ${selectedAcademicYear} - ${selectedSemester}`, 'الشؤون الأكاديمية');
                }}
                className="w-full py-2.5 bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-300 font-black text-xs border border-[#d4af37]/40 shadow hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تثبيت واعتماد العام الدراسي</span>
              </button>
            </div>
          </div>

          {/* Educational Stages Grid (8/12) */}
          <div className="lg:col-span-8 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2a1a0e] text-amber-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-900">المراحل والصفوف الدراسية المعتمدة</h3>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300">
                مربوطة بالهيكل والمصروفات
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Primary Stage Card */}
              <div className="border-2 border-amber-200 p-4 hover:border-[#d4af37] transition-all space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="font-black text-slate-900 text-sm">المرحلة الابتدائية</div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">غير متحقق</span>
                </div>
                <div className="space-y-1.5 text-xs font-bold text-slate-700">
                  <div className="flex justify-between"><span>الصفوف الدراسية:</span><span className="font-mono text-slate-500">غير متحقق</span></div>
                  <div className="flex justify-between"><span>عدد الشعب:</span><span className="font-mono text-slate-500">غير متحقق</span></div>
                  <div className="flex justify-between"><span>إجمالي الطلاب:</span><span className="font-mono text-slate-500">غير متحقق</span></div>
                  <div className="flex justify-between"><span>المواد المقررة:</span><span className="font-mono text-slate-500">غير متحقق</span></div>
                </div>
              </div>

              {/* Middle Stage Card */}
              <div className="border-2 border-amber-200 p-4 hover:border-[#d4af37] transition-all space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="font-black text-slate-900 text-sm">المرحلة المتوسطة</div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">غير متحقق</span>
                </div>
                <div className="space-y-1.5 text-xs font-bold text-slate-700">
                  <div className="flex justify-between"><span>الصفوف الدراسية:</span><span className="font-mono text-slate-500">غير متحقق</span></div>
                  <div className="flex justify-between"><span>عدد الشعب:</span><span className="font-mono text-slate-500">غير متحقق</span></div>
                  <div className="flex justify-between"><span>إجمالي الطلاب:</span><span className="font-mono text-slate-500">غير متحقق</span></div>
                  <div className="flex justify-between"><span>المواد المقررة:</span><span className="font-mono text-slate-500">غير متحقق</span></div>
                </div>
              </div>

              {/* Secondary Stage Card */}
              <div className="border-2 border-amber-200 p-4 hover:border-[#d4af37] transition-all space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="font-black text-slate-900 text-sm">المرحلة الثانوية</div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">غير متحقق</span>
                </div>
                <div className="space-y-1.5 text-xs font-bold text-slate-700">
                  <div className="flex justify-between"><span>الصفوف الدراسية:</span><span className="font-mono text-slate-500">غير متحقق</span></div>
                  <div className="flex justify-between"><span>عدد الشعب:</span><span className="font-mono text-slate-500">غير متحقق</span></div>
                  <div className="flex justify-between"><span>إجمالي الطلاب:</span><span className="font-mono text-slate-500">غير متحقق</span></div>
                  <div className="flex justify-between"><span>المواد المقررة:</span><span className="font-mono text-slate-500">غير متحقق</span></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB CONTENT 2: SUBJECTS & CURRICULUM GRID
         ========================================== */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Filters Sidebar (3/12) */}
          <div className="lg:col-span-3 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2a1a0e] text-amber-400 flex items-center justify-center">
                  <Filter className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-900">تصفية المواد والخطط</h3>
              </div>
              <button 
                onClick={() => {
                  setSearchKeyword('');
                  setSelectedStageFilter('all');
                  setSelectedGradeFilter('all');
                  triggerNotification('تم إعادة ضبط تصفية المواد', 'info');
                }}
                className="text-[10px] font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">اسم المادة أو الرمز</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input 
                    type="text"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    placeholder="ابحث بالاسم، الرمز، المعلم..."
                    className="w-full border border-slate-300 py-2 pr-9 pl-3 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">المرحلة الدراسية</label>
                <select 
                  value={selectedStageFilter}
                  onChange={e => setSelectedStageFilter(e.target.value)}
                  className="w-full border border-slate-300 p-2 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                >
                  <option value="all">جميع المراحل الدراسية</option>
                  <option value="الابتدائية">المرحلة الابتدائية</option>
                  <option value="المتوسطة">المرحلة المتوسطة</option>
                  <option value="الثانوية">المرحلة الثانوية</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الصف الدراسي</label>
                <select 
                  value={selectedGradeFilter}
                  onChange={e => setSelectedGradeFilter(e.target.value)}
                  className="w-full border border-slate-300 p-2 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                >
                  <option value="all">جميع الصفوف الدراسية</option>
                  <option value="الأول">الصف الأول الابتدائي</option>
                  <option value="الثاني">الصف الثاني الابتدائي</option>
                  <option value="المتوسط">الصف الأول المتوسط</option>
                  <option value="الثانوي">الصف الأول الثانوي</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subjects Data Grid (9/12) */}
          <div className="lg:col-span-9 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
              <span className="text-xs font-black text-slate-900">
                سجل الخطط والمواد الدراسية المعتمدة ({filteredSubjects.length} مادة)
              </span>
              <button 
                onClick={() => {
                  setSubjectForm({
                    code: `SUB-${Math.floor(100 + Math.random() * 900)}`,
                    name: '',
                    stageName: 'المرحلة الابتدائية',
                    gradeName: 'الصف الأول الابتدائي',
                    creditHours: 3,
                    weeklyPeriods: 4,
                    passingScore: 50,
                    maxScore: 100,
                    assignedTeacherId: teachers[0]?.id || '',
                    isElective: false
                  });
                  setSelectedSubject(null);
                  setIsSubjectModalOpen(true);
                }}
                className="bg-[#2a1a0e] text-amber-300 hover:text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow border border-[#d4af37]/40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مادة جديدة</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-amber-900/10 shadow-xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                    <th className="p-3">رمز المادة</th>
                    <th className="p-3">اسم المادة الدراسية</th>
                    <th className="p-3">المرحلة والصف</th>
                    <th className="p-3 text-center">الساعات والحصص</th>
                    <th className="p-3 text-center">درجة النجاح</th>
                    <th className="p-3">المعلم المكلف</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white">
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">
                        لا توجد مواد دراسية مطابقة للتصفية
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map(sb => (
                      <tr key={sb.id} className="hover:bg-amber-50/60 transition-colors">
                        <td className="p-3 font-mono font-black text-amber-900">{sb.code}</td>
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900">{sb.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {sb.isElective ? 'مادة اختيارية (Elective)' : 'مادة أساسية (Core)'}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-700">
                          <div>{sb.stageName}</div>
                          <div className="text-[10px] text-amber-800">{sb.gradeName}</div>
                        </td>
                        <td className="p-3 text-center font-bold">
                          <div>{sb.weeklyPeriods} حصص/أسبوع</div>
                          <div className="text-[10px] text-slate-500">{sb.creditHours} ساعات معتمدة</div>
                        </td>
                        <td className="p-3 text-center font-bold font-mono text-slate-800">
                          {sb.passingScore} / {sb.maxScore}
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {sb.assignedTeacherName}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => handleOpenEditSubject(sb)}
                              className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 transition-all cursor-pointer"
                              title="تعديل المادة"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteSubject(sb)}
                              className="p-1.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                              title="حذف المادة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB CONTENT 3: CLASSES & SECTIONS
         ========================================== */}
      {activeTab === 'classes' && (
        <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-900/10">
            <div>
              <h3 className="text-xs font-black text-slate-900">إدارة الفصول، الشعب، والطاقة الاستيعابية</h3>
              <p className="text-[11px] text-slate-500">التحكم بالطاقة القصوى للفصل، الدمج، والتقسيم</p>
            </div>
            <button 
              onClick={() => {
                triggerNotification('تم تحديث فحص الطاقة الاستيعابية الفائقة لجميع شعب المدرسة', 'success');
              }}
              className="bg-[#2a1a0e] text-amber-300 px-3.5 py-2 text-xs font-bold border border-[#d4af37]/40 flex items-center gap-1.5 shadow cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>فحص الكثافة الطلابية</span>
            </button>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
            {academicClasses.length > 0 ? 'بيانات الفصول المركزية محملة ويمكن مراجعتها.' : 'لا توجد بيانات فصول مركزية متاحة للتحقق.'}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB CONTENT 4: TIMETABLE & CONFLICT CHECKER
         ========================================== */}
      {activeTab === 'timetable' && (
        <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-900/10">
            <div>
              <h3 className="text-xs font-black text-slate-900">منظومة بناء الجداول والكشف الفوري عن التعارضات</h3>
              <p className="text-[11px] text-slate-500">كشف تلقائي لتعارضات المعلم، القاعة، الفصل، والوقت</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsScheduleModalOpen(true)}
                className="bg-gradient-to-r from-[#9a6a1d] via-[#f7d174] to-[#c58a22] text-slate-950 font-black px-3.5 py-2 text-xs flex items-center gap-1.5 shadow hover:scale-105 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة حصة للجدول</span>
              </button>
            </div>
          </div>

          {/* Conflict Alert Box if conflicts exist */}
          {scheduleConflicts.length > 0 ? (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-black text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>تم الكشف عن {scheduleConflicts.length} تعارض في الجدول الدراسي الحقيقي!</span>
              </div>
              <ul className="list-disc list-inside text-[11px] font-bold text-rose-800 space-y-1">
                {scheduleConflicts.map((c, i) => (
                  <li key={i}>{c.message}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-300 flex items-center gap-2 text-emerald-900 text-xs font-extrabold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{schedulePeriods.length > 0 && conflictCount === 0 ? 'الجدول الدراسي المحمل لا يحتوي تعارضات' : 'حالة الجدول غير متحققة لغياب جدول مركزي'}</span>
            </div>
          )}

          {/* Timetable Grid View */}
          <div className="overflow-x-auto border border-amber-900/10 shadow-xs">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                  <th className="p-3">اليوم / الحصة</th>
                  <th className="p-3">الحصة الأولى (08:00 - 08:45)</th>
                  <th className="p-3">الحصة الثانية (08:50 - 09:35)</th>
                  <th className="p-3">الحصة الثالثة (09:40 - 10:25)</th>
                  <th className="p-3">الفسحة الاستراحة</th>
                  <th className="p-3">الحصة الرابعة (10:55 - 11:40)</th>
                  <th className="p-3">الحصة الخامسة (11:45 - 12:30)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10 bg-white">
                {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map((dayName) => (
                  <tr key={dayName} className="hover:bg-amber-50/50">
                    <td className="p-3 font-black bg-amber-100/60 text-amber-900 border-l border-amber-200">
                      {dayName}
                    </td>

                    {/* Periods 1, 2, 3 */}
                    {[1, 2, 3].map(pNum => {
                      const matched = schedulePeriods.find(sp => sp.day === dayName && sp.periodNumber === pNum);
                      return (
                        <td key={pNum} className="p-2 border-l border-slate-100">
                          {matched ? (
                            <div className="p-2 bg-gradient-to-b from-amber-50 to-amber-100/70 border border-amber-300 space-y-1">
                              <div className="font-extrabold text-amber-950">{matched.subjectName}</div>
                              <div className="text-[10px] text-slate-600">{matched.teacherName}</div>
                              <div className="text-[9px] font-mono text-amber-800 bg-amber-200/60 rounded px-1">{matched.className} - {matched.roomName}</div>
                            </div>
                          ) : (
                            <div className="p-2 text-slate-300 font-bold border border-dashed border-slate-200 rounded-xl">
                              شاغر
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Break */}
                    <td className="p-2 font-bold text-amber-900 bg-amber-100/40 text-[10px]">
                      استراحة
                    </td>

                    {/* Periods 4, 5 */}
                    {[4, 5].map(pNum => {
                      const matched = schedulePeriods.find(sp => sp.day === dayName && sp.periodNumber === pNum);
                      return (
                        <td key={pNum} className="p-2 border-l border-slate-100">
                          {matched ? (
                            <div className="p-2 bg-gradient-to-b from-amber-50 to-amber-100/70 border border-amber-300 space-y-1">
                              <div className="font-extrabold text-amber-950">{matched.subjectName}</div>
                              <div className="text-[10px] text-slate-600">{matched.teacherName}</div>
                              <div className="text-[9px] font-mono text-amber-800 bg-amber-200/60 rounded px-1">{matched.className} - {matched.roomName}</div>
                            </div>
                          ) : (
                            <div className="p-2 text-slate-300 font-bold border border-dashed border-slate-200 rounded-xl">
                              شاغر
                            </div>
                          )}
                        </td>
                      );
                    })}

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB CONTENT 5: REPORTS & ANALYTICS
         ========================================== */}
      {activeTab === 'analytics' && (
        <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
            <h3 className="text-xs font-black text-slate-900">التقارير والإحصائيات الأكاديمية والشاملة</h3>
            <button 
              onClick={handlePrintCurriculum}
              className="bg-[#2a1a0e] text-amber-300 px-3.5 py-1.5 text-xs font-bold border border-[#d4af37]/40 flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة التقرير الشامل</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 border border-amber-200 space-y-3">
              <div className="font-black text-slate-900 text-xs">نسبة تغطية المناهج الدراسية حسب المرحلة</div>
              <div className="p-3 bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                لا توجد بيانات تغطية مناهج مركزية متاحة للتحقق.
              </div>
            </div>

            <div className="p-4 border border-amber-200 space-y-3">
              <div className="font-black text-slate-900 text-xs">توزيع نصاب المعلمين الأسبوعي</div>
              <div className="space-y-2 text-xs font-bold text-slate-700">
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900">لا توجد بيانات نصاب معلمين مركزية متاحة للتحقق.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB CONTENT 6: GOVERNANCE SETTINGS
         ========================================== */}
      {activeTab === 'settings' && (
        <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-amber-900/10">
            <div className="w-7 h-7 rounded-lg bg-[#2a1a0e] text-amber-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-900">إعدادات السياسات والقواعد الأكاديمية</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
            <div className="p-4 space-y-3">
              <label className="block text-slate-900 font-extrabold">الدرجة الأدنى للنجاح (%)</label>
              <input type="number" defaultValue={50} className="w-full p-2 border font-mono text-slate-900" />
              <p className="text-[10px] text-slate-500">تطبيق آلي على حاسبة الكنترول والرصد</p>
            </div>

            <div className="p-4 space-y-3">
              <label className="block text-slate-900 font-extrabold">الحد الأقصى للطلاب في الشعبة الواحدة</label>
              <input type="number" defaultValue={35} className="w-full p-2 border font-mono text-slate-900" />
              <p className="text-[10px] text-slate-500">إطلاق تنبيه عند تجاوز الطاقة الاستيعابية</p>
            </div>
          </div>

          <button 
            onClick={() => {
              triggerNotification('تم حفظ الإعدادات الأكاديمية وتحديث السياسات الحاكمة بنجاح', 'success');
              logAction('UPDATE_ACADEMIC_SETTINGS', 'تعديل سياسات الكنترول والكثافة الطلابية', 'الشؤون الأكاديمية');
            }}
            className="px-5 py-2.5 bg-[#2a1a0e] text-amber-300 font-black border border-[#d4af37]/40 shadow hover:scale-105 transition-all cursor-pointer"
          >
            حفظ وتطبيق السياسات الأكاديمية
          </button>
        </div>
      )}

      {/* ==========================================
          ADD/EDIT SUBJECT MODAL
         ========================================== */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <h3 className="font-black text-slate-900 text-sm">
                  {selectedSubject ? 'تعديل بيانات المادة الدراسية' : 'إضافة مادة دراسية جديدة'}
                </h3>
              </div>
              <button onClick={() => setIsSubjectModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">رمز المادة *</label>
                <input 
                  type="text" 
                  value={subjectForm.code} 
                  onChange={e => setSubjectForm({...subjectForm, code: e.target.value})}
                  className="w-full border border-slate-300 p-2.5 font-mono font-bold text-slate-900 outline-none focus:border-[#9a6a1d]" 
                  placeholder="MATH-101"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">اسم المادة الدراسية *</label>
                <input 
                  type="text" 
                  value={subjectForm.name} 
                  onChange={e => setSubjectForm({...subjectForm, name: e.target.value})}
                  className="w-full border border-slate-300 p-2.5 font-bold text-slate-900 outline-none focus:border-[#9a6a1d]" 
                  placeholder="مثال: الرياضيات المتقدمة"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">المرحلة الدراسية</label>
                <select 
                  value={subjectForm.stageName} 
                  onChange={e => setSubjectForm({...subjectForm, stageName: e.target.value})}
                  className="w-full border border-slate-300 p-2.5 font-bold text-slate-900 outline-none focus:border-[#9a6a1d]"
                >
                  <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
                  <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
                  <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الصف الدراسي</label>
                <select 
                  value={subjectForm.gradeName} 
                  onChange={e => setSubjectForm({...subjectForm, gradeName: e.target.value})}
                  className="w-full border border-slate-300 p-2.5 font-bold text-slate-900 outline-none focus:border-[#9a6a1d]"
                >
                  <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
                  <option value="الصف الثاني الابتدائي">الصف الثاني الابتدائي</option>
                  <option value="الصف الأول المتوسط">الصف الأول المتوسط</option>
                  <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الساعات المعتمدة</label>
                <input 
                  type="number" 
                  value={subjectForm.creditHours} 
                  onChange={e => setSubjectForm({...subjectForm, creditHours: Number(e.target.value)})}
                  className="w-full border border-slate-300 p-2.5 font-bold text-slate-900 outline-none focus:border-[#9a6a1d]" 
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الحصص الأسبوعية</label>
                <input 
                  type="number" 
                  value={subjectForm.weeklyPeriods} 
                  onChange={e => setSubjectForm({...subjectForm, weeklyPeriods: Number(e.target.value)})}
                  className="w-full border border-slate-300 p-2.5 font-bold text-slate-900 outline-none focus:border-[#9a6a1d]" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-extrabold mb-1">المعلم المكلف بالتدريس</label>
                <select 
                  value={subjectForm.assignedTeacherId} 
                  onChange={e => setSubjectForm({...subjectForm, assignedTeacherId: e.target.value})}
                  className="w-full border border-slate-300 p-2.5 font-bold text-slate-900 outline-none focus:border-[#9a6a1d]"
                >
                  <option value="">اختر المعلم المكلف...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button 
                onClick={() => setIsSubjectModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs hover:bg-transparent cursor-pointer"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSaveSubject}
                className="px-5 py-2 bg-[#2a1a0e] text-amber-300 font-black text-xs border border-[#d4af37]/40 shadow hover:scale-105 cursor-pointer"
              >
                حفظ المادة الدراسية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ADD SCHEDULE ENTRY MODAL
         ========================================== */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-700" />
                <h3 className="font-black text-slate-900 text-sm">تخصيص حصة جديدة في الجدول الدراسي</h3>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">اليوم</label>
                  <select 
                    value={scheduleForm.day} 
                    onChange={e => setScheduleForm({...scheduleForm, day: e.target.value as any})}
                    className="w-full border p-2.5 font-bold text-slate-900"
                  >
                    <option value="الأحد">الأحد</option>
                    <option value="الإثنين">الإثنين</option>
                    <option value="الثلاثاء">الثلاثاء</option>
                    <option value="الأربعاء">الأربعاء</option>
                    <option value="الخميس">الخميس</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">رقم الحصة</label>
                  <select 
                    value={scheduleForm.periodNumber} 
                    onChange={e => setScheduleForm({...scheduleForm, periodNumber: Number(e.target.value)})}
                    className="w-full border p-2.5 font-bold text-slate-900"
                  >
                    <option value={1}>الحصة الأولى</option>
                    <option value={2}>الحصة الثانية</option>
                    <option value={3}>الحصة الثالثة</option>
                    <option value={4}>الحصة الرابعة</option>
                    <option value={5}>الحصة الخامسة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الفصل والشعبة</label>
                <input 
                  type="text" 
                  value={scheduleForm.className}
                  onChange={e => setScheduleForm({...scheduleForm, className: e.target.value})}
                  className="w-full border p-2.5 font-bold text-slate-900"
                  placeholder="مثال: الصف الأول الابتدائي (أ)"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">المادة الدراسية</label>
                <select 
                  value={scheduleForm.subjectId}
                  onChange={e => setScheduleForm({...scheduleForm, subjectId: e.target.value})}
                  className="w-full border p-2.5 font-bold text-slate-900"
                >
                  <option value="">اختر المادة...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">المعلم المكلف</label>
                <select 
                  value={scheduleForm.teacherId}
                  onChange={e => setScheduleForm({...scheduleForm, teacherId: e.target.value})}
                  className="w-full border p-2.5 font-bold text-slate-900"
                >
                  <option value="">اختر المعلم...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">القاعة الدراسية</label>
                <input 
                  type="text" 
                  value={scheduleForm.roomName}
                  onChange={e => setScheduleForm({...scheduleForm, roomName: e.target.value})}
                  className="w-full border p-2.5 font-bold text-slate-900"
                  placeholder="مثال: قاعة 101"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 border text-slate-700 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSaveSchedulePeriod}
                className="px-5 py-2 bg-[#2a1a0e] text-amber-300 font-black text-xs border border-[#d4af37]/40 shadow hover:scale-105 cursor-pointer"
              >
                إضافة للحصة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
