import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  Building2, 
  Coins, 
  CreditCard, 
  Calendar, 
  Bell, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Mail, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Clock, 
  BookOpen, 
  FileBadge2, 
  Grid, 
  Settings, 
  Container, 
  Bus, 
  ArrowLeft, 
  Bot, 
  Award, 
  HelpCircle, 
  PieChart, 
  BarChart2, 
  Cake, 
  UserPlus, 
  AlertTriangle,
  UserCheck,
  Building,
  ShieldCheck,
  FileSpreadsheet,
  Globe,
  Headphones
} from 'lucide-react';
import { Branch, School, UserRole } from '../types';

interface ModernSchoolDashboardProps {
  students: any[];
  teachers: any[];
  invoices: any[];
  setActiveSection: (sec: string) => void;
  selectedSchool: School;
  selectedBranch: Branch | null;
  currentRole: UserRole;
  triggerNotification: (msg: string, type: 'info' | 'warning' | 'success') => void;
  isClientMode?: boolean;
}

export default function ModernSchoolDashboard({
  students = [],
  teachers = [],
  invoices = [],
  setActiveSection,
  selectedSchool,
  selectedBranch,
  currentRole,
  triggerNotification,
  isClientMode = false
}: ModernSchoolDashboardProps) {

  // Live Clock & Date
  const [timeString, setTimeString] = useState('10:30 AM');
  const [dateString, setDateString] = useState('الأحد 25 مايو 2025');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      );
      setDateString(
        now.toLocaleDateString('ar-EG', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate live dynamic counts based on props with fallback enterprise numbers
  const totalStudentsCount = students.length > 0 ? students.length.toLocaleString('ar-EG') : '—';
  const totalTeachersCount = teachers.length > 0 ? teachers.length.toLocaleString('ar-EG') : '—';
  
  // Quick Action Handler
  const handleNav = (section: string, label: string) => {
    setActiveSection(section);
    triggerNotification(`تم الانتقال إلى ${label} بنجاح 🚀`, 'info');
  };

  // Role Badge Translation & Styling
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'SuperAdmin':
        return { label: 'مدير الإدارة المركزية', badge: 'صلاحية فائقة' };
      case 'SchoolAdmin':
        return { label: 'مدير المدرسة العام', badge: 'إدارة شؤون المدرسة' };
      case 'Accountant':
        return { label: 'أمين الحسابات والشؤون المالية', badge: 'صلاحية مالية' };
      case 'Teacher':
        return { label: 'كادر تدريسي وأكاديمي', badge: 'صلاحية أكاديمية' };
      case 'Parent':
        return { label: 'ولي أمر طالب', badge: 'بوابة ولي الأمر' };
      default:
        return { label: 'مستخدم النظام', badge: 'مصرح' };
    }
  };

  const roleInfo = getRoleLabel(currentRole);

  return (
    <div 
      id="edupro-enterprise-erp-dashboard" 
      className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6"
      dir="rtl"
    >

      {/* ==========================================
          TOP HEADER BAR (Luxury Gold Metallic Bevel)
         ========================================== */}
      <div className="bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] text-white rounded-3xl p-3 sm:p-4 border-2 border-[#d4af37]/40 shadow-2xl flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle Gold Ambient Metallic Reflections */}
        <div className="absolute top-0 right-1/4 w-96 h-20 bg-[#d4af37]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-20 bg-[#fce79a]/10 blur-2xl pointer-events-none" />

        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3 relative z-10 cursor-pointer" onClick={() => handleNav('dashboard', 'الرئيسية')}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9a6a1d] via-[#f7d174] to-[#c58a22] p-[2px] shadow-lg shadow-[#d4af37]/20 flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-[#2a1b10] to-[#120a04] flex items-center justify-center font-black text-amber-300 text-xl tracking-tighter border border-[#f7d174]/40">
              EP
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#ffe5a3] via-[#fce79a] to-[#d4af37] bg-clip-text text-transparent drop-shadow-sm">
              SchoolForManus
            </h1>
            <p className="text-[11px] text-amber-200/80 font-bold tracking-wide">
              مركز القيادة وإدارة المدارس
            </p>
          </div>
        </div>

        {/* Center Information Dropdowns / Pills */}
        <div className="hidden lg:flex items-center gap-3 relative z-10">
          {/* Academic Year */}
          <div className="bg-[#2a1d13]/90 border border-[#d4af37]/30 hover:border-[#f7d174] px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-100 shadow-inner transition-all">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>{selectedSchool.academicYear || 'غير محدد'}</span>
            <span className="text-[10px] text-amber-300/70">العام الدراسي</span>
          </div>

          {/* School Name Badge */}
          <div className="bg-[#2a1d13]/90 border border-[#d4af37]/30 hover:border-[#f7d174] px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-100 shadow-inner transition-all">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>{selectedSchool.name || 'المدرسة النموذجية'}</span>
            <span className="text-[10px] text-amber-300/70">{selectedBranch?.name || 'جميع الفروع'}</span>
          </div>

          {/* Date & Live Clock */}
          <div className="bg-[#2a1d13]/90 border border-[#d4af37]/30 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-100 shadow-inner">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{dateString}</span>
            <span className="text-amber-400 font-mono dir-ltr">{timeString}</span>
          </div>
        </div>

        {/* Top Right Action Icons & User Profile Badge */}
        <div className="flex items-center gap-2 sm:gap-3 relative z-10">
          {/* Search Icon */}
          <button 
            type="button"
            onClick={() => triggerNotification('تم فتح محرك البحث الشامل ERP', 'info')}
            className="w-10 h-10 rounded-2xl bg-[#2a1d13] border border-[#d4af37]/30 hover:border-[#f7d174] flex items-center justify-center text-amber-300 hover:scale-105 transition-all cursor-pointer shadow"
            title="البحث الشامل"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notification Bell with Red Badge */}
          <button 
            type="button"
            onClick={() => triggerNotification('لديك 5 تنبيهات هامة بحاجة للمتابعة اليوم', 'warning')}
            className="w-10 h-10 rounded-2xl bg-[#2a1d13] border border-[#d4af37]/30 hover:border-[#f7d174] flex items-center justify-center text-amber-300 hover:scale-105 transition-all relative cursor-pointer shadow"
            title="التنبيهات الإدارية"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-[#1c120c]">
              5
            </span>
          </button>

          {/* Messages Icon */}
          <button 
            type="button"
            onClick={() => handleNav('ai_assistant', 'مركز الرسائل والتواصل')}
            className="w-10 h-10 rounded-2xl bg-[#2a1d13] border border-[#d4af37]/30 hover:border-[#f7d174] flex items-center justify-center text-amber-300 hover:scale-105 transition-all cursor-pointer shadow"
            title="الرسائل المباشرة"
          >
            <Mail className="w-4 h-4" />
          </button>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-[#2a1d13] to-[#1e130a] border border-[#d4af37]/40 px-3 py-1.5 rounded-2xl shadow-md">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#d4af37] to-[#fce79a] p-[1.5px] shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200" 
                alt="Profile" 
                className="w-full h-full rounded-[10px] object-cover"
              />
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-xs font-black text-amber-100 block leading-tight">{roleInfo.label}</span>
              <span className="text-[9.5px] text-amber-300/80 font-bold block">{roleInfo.badge}</span>
            </div>
          </div>
        </div>
      </div>


      {/* ==========================================
          ROW 1: 7 TOP KPI METRIC CARDS
         ========================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        
        {/* Card 1: Daily Attendance Rate */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => handleNav('attendance', 'الحضور والغياب')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700">نسبة الحضور اليوم</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm shrink-0 group-hover:scale-110 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block tracking-tight">96%</span>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#9a6a1d] to-[#d4af37] w-[96%] rounded-full" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 mt-1 block">متوسط الحضور</span>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => handleNav('accounts', 'الحسابات العامة')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700">إجمالي المصروفات</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm shrink-0 group-hover:scale-110 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block tracking-tight">620,000 <span className="text-xs font-bold text-slate-600">ريال</span></span>
            <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3" /> 18% عن الشهر
            </span>
          </div>
        </div>

        {/* Card 3: Total Revenue */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => handleNav('student_accounts', 'الرسوم والأقساط')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700">إجمالي الإيرادات</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm shrink-0 group-hover:scale-110 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                <Coins className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block tracking-tight">850,000 <span className="text-xs font-bold text-slate-600">ريال</span></span>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> 18% عن الشهر
            </span>
          </div>
        </div>

        {/* Card 4: Classrooms */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => handleNav('students', 'شؤون الطلاب')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700">الفصول الدراسية</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm shrink-0 group-hover:scale-110 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block tracking-tight">72</span>
            <span className="text-[10px] font-bold text-slate-500 mt-1 block">فصل دراسي</span>
          </div>
        </div>

        {/* Card 5: Employees */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => handleNav('teachers', 'الموارد البشرية')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700">الموظفون</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm shrink-0 group-hover:scale-110 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block tracking-tight">60</span>
            <span className="text-[10px] font-bold text-slate-500 mt-1 block">موظف إداري</span>
          </div>
        </div>

        {/* Card 6: Teachers */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => handleNav('teachers', 'شؤون المعلمين')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700">المعلمون</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm shrink-0 group-hover:scale-110 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block tracking-tight">{totalTeachersCount}</span>
            <span className="text-[10px] font-bold text-slate-500 mt-1 block">معلم ومعلمة</span>
          </div>
        </div>

        {/* Card 7: Total Students */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => handleNav('students', 'شؤون الطلاب')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700">إجمالي الطلاب</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm shrink-0 group-hover:scale-110 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block tracking-tight">{totalStudentsCount}</span>
            <span className="text-[10px] font-bold text-slate-500 mt-1 block">طالب مسجل</span>
          </div>
        </div>

      </div>


      {/* ==========================================
          ROW 2: TODAY'S ALERTS & PRIMARY SHORTCUTS
         ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: TODAY'S ALERTS (4/12) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-amber-900/10">
              <div className="w-8 h-8 rounded-xl bg-[#2a1a0e] text-amber-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">تنبيهات اليوم</h3>
            </div>

            <div className="space-y-3 mt-4">
              {/* Alert 1 */}
              <div className="bg-white border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between shadow-xs hover:border-[#d4af37] transition-all cursor-pointer" onClick={() => handleNav('student_accounts', 'الأقساط المستحقة')}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow">
                    12
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">أقساط مستحقة</h4>
                    <p className="text-[10px] text-slate-500 font-bold">128 طالب</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-100/60 text-amber-800 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
              </div>

              {/* Alert 2 */}
              <div className="bg-white border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between shadow-xs hover:border-[#d4af37] transition-all cursor-pointer" onClick={() => handleNav('attendance', 'غياب الطلاب')}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow">
                    5
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">غياب الطلاب اليوم</h4>
                    <p className="text-[10px] text-slate-500 font-bold">23 طالب</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-100/60 text-amber-800 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>

              {/* Alert 3 */}
              <div className="bg-white border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between shadow-xs hover:border-[#d4af37] transition-all cursor-pointer" onClick={() => handleNav('students', 'أعياد الميلاد')}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-black text-xs flex items-center justify-center shadow">
                    8
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">أعياد الميلاد هذا الأسبوع</h4>
                    <p className="text-[10px] text-slate-500 font-bold">5 طلاب</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-100/60 text-amber-800 flex items-center justify-center">
                  <Cake className="w-4 h-4" />
                </div>
              </div>

              {/* Alert 4 */}
              <div className="bg-white border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between shadow-xs hover:border-[#d4af37] transition-all cursor-pointer" onClick={() => handleNav('teachers', 'عقود الموظفين')}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">انتهاء عقود الموظفين</h4>
                    <p className="text-[10px] text-slate-500 font-bold">خلال 30 يوم</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-100/60 text-amber-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => handleNav('dashboard', 'جميع التنبيهات')}
            className="w-full mt-4 py-2.5 bg-gradient-to-r from-[#2a1a0e] to-[#1e1208] text-amber-200 hover:text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 border border-[#d4af37]/40 shadow hover:scale-[1.01] transition-all cursor-pointer"
          >
            <span>عرض جميع التنبيهات</span>
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* RIGHT COLUMN: PRIMARY SHORTCUTS (8/12) */}
        <div className="lg:col-span-8 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 border-b border-amber-900/10 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#2a1a0e] text-amber-400 flex items-center justify-center">
              <Grid className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-slate-900">الاختصارات الرئيسية</h3>
          </div>

          {/* 12 Metallic Gold Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            
            {/* Shortcut 1 */}
            <button 
              type="button" 
              onClick={() => handleNav('students', 'شؤون الطلاب')}
              className="p-3.5 bg-gradient-to-b from-white to-[#fbf8f0] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center h-28"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">شؤون الطلاب</span>
            </button>

            {/* Shortcut 2 */}
            <button 
              type="button" 
              onClick={() => handleNav('accounts', 'الحسابات')}
              className="p-3.5 bg-gradient-to-b from-white to-[#fbf8f0] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center h-28"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">الحسابات</span>
            </button>

            {/* Shortcut 3 */}
            <button 
              type="button" 
              onClick={() => handleNav('students', 'الأكاديمية')}
              className="p-3.5 bg-gradient-to-b from-white to-[#fbf8f0] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center h-28"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">الأكاديمية</span>
            </button>

            {/* Shortcut 4 */}
            <button 
              type="button" 
              onClick={() => handleNav('exams', 'الامتحانات والنتائج')}
              className="p-3.5 bg-gradient-to-b from-white to-[#fbf8f0] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center h-28"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                  <FileBadge2 className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">الامتحانات والنتائج</span>
            </button>

            {/* Shortcut 5 */}
            <button 
              type="button" 
              onClick={() => handleNav('teachers', 'الموارد البشرية')}
              className="p-3.5 bg-gradient-to-b from-white to-[#fbf8f0] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center h-28"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">الموارد البشرية</span>
            </button>

            {/* Shortcut 6 */}
            <button 
              type="button" 
              onClick={() => handleNav('financial_reports', 'التقارير')}
              className="p-3.5 bg-gradient-to-b from-white to-[#fbf8f0] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center h-28"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                  <BarChart2 className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">التقارير</span>
            </button>

            {/* Shortcut 7 */}
            <button 
              type="button" 
              onClick={() => handleNav('student_accounts', 'الرسوم الدراسية')}
              className="p-3.5 bg-gradient-to-b from-white to-[#fbf8f0] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center h-28"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">الرسوم الدراسية</span>
            </button>

            {/* Shortcut 8 */}
            <button 
              type="button" 
              onClick={() => handleNav('ai_assistant', 'الرسائل')}
              className="p-3.5 bg-gradient-to-b from-white to-[#fbf8f0] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center h-28 relative"
            >
              <span className="absolute top-2 right-2 w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center border border-white shadow">
                12
              </span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                  <Mail className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">الرسائل</span>
            </button>

            {/* Shortcut 9 */}
            <button 
              type="button" 
              onClick={() => handleNav('inventory', 'المخازن والمشتريات')}
              className="p-3.5 bg-gradient-to-b from-white to-[#fbf8f0] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center h-28"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                  <Container className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">المخازن والمشتريات</span>
            </button>

            {/* Shortcut 10 */}
            <button 
              type="button" 
              onClick={() => handleNav('treasury', 'الخزينة والبنوك')}
              className="p-3.5 bg-gradient-to-b from-white to-[#fbf8f0] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center h-28"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                  <Building className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">الخزينة والبنوك</span>
            </button>

            {/* Shortcut 11 */}
            <button 
              type="button" 
              onClick={() => handleNav('attendance', 'الجداول الدراسية')}
              className="p-3.5 bg-gradient-to-b from-white to-[#fbf8f0] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center h-28"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">الجداول الدراسية</span>
            </button>

            {/* Shortcut 12 */}
            <button 
              type="button" 
              onClick={() => handleNav('permissions_admin', 'الإعدادات')}
              className="p-3.5 bg-gradient-to-b from-white to-[#fbf8f0] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center h-28"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#fce79a] to-[#c58a22] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
                  <Settings className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">الإعدادات</span>
            </button>

          </div>
        </div>

      </div>


      {/* ==========================================
          ROW 3: CHARTS & ANALYTICS PANEL (4 Cards Grid)
         ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CHART 1: الإيرادات والمصروفات (هذا العام) */}
        <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/10 mb-3">
              <h4 className="text-xs font-black text-slate-900">الإيرادات والمصروفات (هذا العام)</h4>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-600" /> الإيرادات</span>
                <span className="flex items-center gap-1 text-rose-700"><span className="w-2 h-2 rounded-full bg-rose-600" /> المصروفات</span>
              </div>
            </div>

            {/* SVG Spline Chart */}
            <div className="h-36 w-full my-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120">
                {/* Grid Lines */}
                <line x1="0" y1="30" x2="300" y2="30" stroke="#e2d8c3" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="#e2d8c3" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="300" y2="90" stroke="#e2d8c3" strokeDasharray="3 3" />

                {/* Green Line (Revenue) */}
                <path 
                  d="M 10 90 Q 50 60 100 70 T 200 40 T 290 20" 
                  fill="none" 
                  stroke="#16a34a" 
                  strokeWidth="3" 
                />
                {/* Red Line (Expenses) */}
                <path 
                  d="M 10 100 Q 50 85 100 80 T 200 65 T 290 50" 
                  fill="none" 
                  stroke="#dc2626" 
                  strokeWidth="3" 
                />

                {/* X-Axis Month Labels */}
                <text x="10" y="115" fontSize="8" fill="#64748b" textAnchor="middle">يناير</text>
                <text x="65" y="115" fontSize="8" fill="#64748b" textAnchor="middle">فبراير</text>
                <text x="120" y="115" fontSize="8" fill="#64748b" textAnchor="middle">مارس</text>
                <text x="175" y="115" fontSize="8" fill="#64748b" textAnchor="middle">أبريل</text>
                <text x="230" y="115" fontSize="8" fill="#64748b" textAnchor="middle">مايو</text>
                <text x="285" y="115" fontSize="8" fill="#64748b" textAnchor="middle">يونيو</text>
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-amber-900/10">
            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-center">
              <span className="text-[9px] text-emerald-700 font-extrabold block">إجمالي الإيرادات</span>
              <span className="text-xs font-black text-emerald-800">5,850,000 ريال</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl text-center">
              <span className="text-[9px] text-rose-700 font-extrabold block">إجمالي المصروفات</span>
              <span className="text-xs font-black text-rose-800">4,250,000 ريال</span>
            </div>
          </div>
        </div>

        {/* CHART 2: توزيع الطلاب حسب المرحلة */}
        <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/10 mb-3">
              <h4 className="text-xs font-black text-slate-900">توزيع الطلاب حسب المرحلة</h4>
              <span className="text-[9.5px] font-bold text-slate-500 bg-amber-100/60 px-2 py-0.5 rounded-full">هذا العام</span>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Segment 1: Navy Kindergarten (15%) */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#1e3a8a" strokeWidth="5" strokeDasharray="15 85" strokeDashoffset="0" />
                  {/* Segment 2: Green Primary (35%) */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#16a34a" strokeWidth="5" strokeDasharray="35 65" strokeDashoffset="-15" />
                  {/* Segment 3: Teal Middle (25%) */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#0d9488" strokeWidth="5" strokeDasharray="25 75" strokeDashoffset="-50" />
                  {/* Segment 4: Navy Secondary (25%) */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="5" strokeDasharray="25 75" strokeDashoffset="-75" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-black text-slate-900">{totalStudentsCount}</span>
                  <span className="text-[8px] font-bold text-slate-500">إجمالي الطلاب</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[9.5px] font-extrabold mt-2 pt-2 border-t border-amber-900/10">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a]" /> روضة أطفال (15%)</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" /> ابتدائي (35%)</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" /> متوسط (25%)</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" /> ثانوي (25%)</div>
          </div>
        </div>

        {/* CHART 3: نسبة التحصيل الكلية */}
        <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-4 shadow-lg flex flex-col justify-between text-center">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/10 mb-3">
              <h4 className="text-xs font-black text-slate-900">نسبة التحصيل الكلية</h4>
              <span className="text-[9.5px] font-bold text-slate-500 bg-amber-100/60 px-2 py-0.5 rounded-full">هذا الشهر</span>
            </div>

            <div className="flex flex-col items-center justify-center my-3">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#e2d8c3" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#9a6a1d" strokeWidth="4" strokeDasharray="87 13" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900">87%</span>
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">ممتاز ↑</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-100/50 border border-amber-200/80 p-2 rounded-2xl text-center mt-2">
            <span className="text-[10px] font-black text-amber-900">نسبة التحصيل الكلية متفوقة عن المستهدف</span>
          </div>
        </div>

        {/* CHART 4: تحصيل الرسوم خلال الأشهر */}
        <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/10 mb-3">
              <h4 className="text-xs font-black text-slate-900">تحصيل الرسوم خلال الأشهر</h4>
              <div className="flex items-center gap-2 text-[9px] font-bold">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#2a1a0e] rounded-xs" /> المحصل</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#c58a22] rounded-xs" /> المستحق</span>
              </div>
            </div>

            <div className="h-32 w-full flex items-end justify-between gap-2 px-2 my-2 border-b border-slate-200 pb-1">
              {/* Month 1 */}
              <div className="flex gap-1 items-end h-full">
                <div className="w-2.5 bg-[#2a1a0e] rounded-t-sm h-[60%]" />
                <div className="w-2.5 bg-[#c58a22] rounded-t-sm h-[80%]" />
              </div>
              {/* Month 2 */}
              <div className="flex gap-1 items-end h-full">
                <div className="w-2.5 bg-[#2a1a0e] rounded-t-sm h-[75%]" />
                <div className="w-2.5 bg-[#c58a22] rounded-t-sm h-[85%]" />
              </div>
              {/* Month 3 */}
              <div className="flex gap-1 items-end h-full">
                <div className="w-2.5 bg-[#2a1a0e] rounded-t-sm h-[50%]" />
                <div className="w-2.5 bg-[#c58a22] rounded-t-sm h-[70%]" />
              </div>
              {/* Month 4 */}
              <div className="flex gap-1 items-end h-full">
                <div className="w-2.5 bg-[#2a1a0e] rounded-t-sm h-[90%]" />
                <div className="w-2.5 bg-[#c58a22] rounded-t-sm h-[95%]" />
              </div>
              {/* Month 5 */}
              <div className="flex gap-1 items-end h-full">
                <div className="w-2.5 bg-[#2a1a0e] rounded-t-sm h-[80%]" />
                <div className="w-2.5 bg-[#c58a22] rounded-t-sm h-[85%]" />
              </div>
            </div>
            <div className="flex justify-between text-[8px] font-bold text-slate-500 px-1">
              <span>يناير</span>
              <span>فبراير</span>
              <span>مارس</span>
              <span>أبريل</span>
              <span>مايو</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl text-center mt-2">
            <span className="text-[10px] font-black text-amber-900">معدل النمو 14% مقارنة بالفصل السابق</span>
          </div>
        </div>

      </div>


      {/* ==========================================
          ROW 4: RECENT OPERATIONS & TODAY'S SCHEDULE
         ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: RECENT OPERATIONS TABLE (8/12) */}
        <div className="lg:col-span-8 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-amber-900/10 mb-4">
            <h3 className="text-sm font-black text-slate-900">آخر العمليات المعتمدة</h3>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full">سجل أحداث الحركات المباشرة</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-amber-900/10 text-slate-600 font-extrabold bg-amber-100/40">
                  <th className="py-2.5 px-3 rounded-r-xl">الحالة</th>
                  <th className="py-2.5 px-3">التفاصيل</th>
                  <th className="py-2.5 px-3">المستخدم</th>
                  <th className="py-2.5 px-3">الوقت</th>
                  <th className="py-2.5 px-3 rounded-l-xl">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/5 font-bold text-slate-800">
                {/* Row 1 */}
                <tr className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> تم بنجاح
                    </span>
                  </td>
                  <td className="py-2.5 px-3">تم تسجيل وتعميد الطالب خالد محمد - الصف الأول الابتدائي</td>
                  <td className="py-2.5 px-3 font-medium text-slate-600">أحمد محمد</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">10:15 AM</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">25/05/2025</td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> تم بنجاح
                    </span>
                  </td>
                  <td className="py-2.5 px-3">سداد رسوم الفصل الدراسي الثاني للطالب أحمد السالم</td>
                  <td className="py-2.5 px-3 font-medium text-slate-600">فاطمة علي</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">09:45 AM</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">25/05/2025</td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> تم بنجاح
                    </span>
                  </td>
                  <td className="py-2.5 px-3">تعديل بيانات الموظف علي حسن - قسم المحاسبة العامة</td>
                  <td className="py-2.5 px-3 font-medium text-slate-600">محمد خالد</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">09:30 AM</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">25/05/2025</td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> تم بنجاح
                    </span>
                  </td>
                  <td className="py-2.5 px-3">اعتماد انضمام المعلم خالد إبراهيم - مادة الرياضيات</td>
                  <td className="py-2.5 px-3 font-medium text-slate-600">سارة أحمد</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">09:10 AM</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">25/05/2025</td>
                </tr>

                {/* Row 5 */}
                <tr className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> تم بنجاح
                    </span>
                  </td>
                  <td className="py-2.5 px-3">جدولة إشعار السداد وتوزيع الكتب للطالبة نور الهدى</td>
                  <td className="py-2.5 px-3 font-medium text-slate-600">أحمد محمد</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">08:50 AM</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">25/05/2025</td>
                </tr>
              </tbody>
            </table>
          </div>

          <button 
            type="button" 
            onClick={() => handleNav('audit_logs', 'سجل العمليات')}
            className="w-full mt-4 py-2 bg-gradient-to-r from-[#2a1a0e] to-[#1e1208] text-amber-200 hover:text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 border border-[#d4af37]/40 shadow hover:scale-[1.01] transition-all cursor-pointer"
          >
            عرض جميع العمليات المعتمدة
          </button>
        </div>

        {/* RIGHT COLUMN: TODAY'S SCHEDULE (4/12) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/10 mb-4">
              <h3 className="text-sm font-black text-slate-900">جدول اليوم</h3>
              <Calendar className="w-4 h-4 text-amber-800" />
            </div>

            <div className="space-y-3">
              {/* Event 1 */}
              <div className="p-3 bg-white border border-amber-200/80 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <h4 className="text-xs font-black text-slate-800">اجتماع الهيئة الإدارية</h4>
                  <p className="text-[10px] text-slate-500 font-bold">قاعة الاجتماعات الرئيسية</p>
                </div>
                <span className="text-xs font-mono font-black text-amber-800 bg-amber-100/80 px-2 py-1 rounded-lg">10:00 AM</span>
              </div>

              {/* Event 2 */}
              <div className="p-3 bg-white border border-amber-200/80 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <h4 className="text-xs font-black text-slate-800">حصة لغة عربية - الصف الثالث</h4>
                  <p className="text-[10px] text-slate-500 font-bold">مبنى أ - قاعة 102</p>
                </div>
                <span className="text-xs font-mono font-black text-amber-800 bg-amber-100/80 px-2 py-1 rounded-lg">11:00 AM</span>
              </div>

              {/* Event 3 */}
              <div className="p-3 bg-white border border-amber-200/80 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <h4 className="text-xs font-black text-slate-800">اختبار نصف الفصل - الرياضيات</h4>
                  <p className="text-[10px] text-slate-500 font-bold">لجنة الكنترول المركزية</p>
                </div>
                <span className="text-xs font-mono font-black text-amber-800 bg-amber-100/80 px-2 py-1 rounded-lg">12:30 PM</span>
              </div>

              {/* Event 4 */}
              <div className="p-3 bg-white border border-amber-200/80 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <h4 className="text-xs font-black text-slate-800">اجتماع أولياء الأمور</h4>
                  <p className="text-[10px] text-slate-500 font-bold">مسرح المدرسة الكلي</p>
                </div>
                <span className="text-xs font-mono font-black text-amber-800 bg-amber-100/80 px-2 py-1 rounded-lg">02:00 PM</span>
              </div>

              {/* Event 5 */}
              <div className="p-3 bg-white border border-amber-200/80 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <h4 className="text-xs font-black text-slate-800">ورشة عمل للمعلمين</h4>
                  <p className="text-[10px] text-slate-500 font-bold">معمل الحاسب الآلي</p>
                </div>
                <span className="text-xs font-mono font-black text-amber-800 bg-amber-100/80 px-2 py-1 rounded-lg">03:30 PM</span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={() => handleNav('attendance', 'الجدول الكامل')}
            className="w-full mt-4 py-2 bg-gradient-to-r from-[#2a1a0e] to-[#1e1208] text-amber-200 hover:text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 border border-[#d4af37]/40 shadow hover:scale-[1.01] transition-all cursor-pointer"
          >
            عرض الجدول الكامل
          </button>
        </div>

      </div>


      {/* ==========================================
          FLOATING SMART AI ASSISTANT BAR
         ========================================== */}
      <div className="bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] text-white rounded-3xl p-4 border-2 border-[#d4af37]/50 shadow-2xl flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#9a6a1d] via-[#f7d174] to-[#c58a22] p-[1.5px] shadow-lg flex-shrink-0 animate-pulse">
            <div className="w-full h-full rounded-[14px] bg-[#2a1a0e] flex items-center justify-center text-amber-300">
              <Bot className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-amber-200 flex items-center gap-1.5">
              المساعد الذكي EduPro AI
              <span className="text-[9px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">AI Active</span>
            </h4>
            <p className="text-xs text-amber-100/80 font-bold mt-0.5">
              جاهز لمساعدتك في إدارة الامتحانات والعمليات المدرسية واكتشاف التعارضات
            </p>
          </div>
        </div>

        {/* AI Interactive Prompt Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            type="button"
            onClick={() => triggerNotification('جاري تحليل اكتشاف التعارضات في الجداول والمراقبين...', 'info')}
            className="px-3 py-1.5 bg-[#2a1d13] border border-[#d4af37]/30 hover:border-[#f7d174] hover:bg-[#38271a] text-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>اقترح التعارضات في الجداول</span>
          </button>

          <button 
            type="button"
            onClick={() => triggerNotification('جاري اقتراح توزيع المراقبات واللجان تلقائياً...', 'info')}
            className="px-3 py-1.5 bg-[#2a1d13] border border-[#d4af37]/30 hover:border-[#f7d174] hover:bg-[#38271a] text-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>اقترح توزيع المراقبين تلقائياً</span>
          </button>

          <button 
            type="button"
            onClick={() => triggerNotification('جاري التدقيق في نتائج الامتحانات لاكتشاف القيم الشاذة...', 'info')}
            className="px-3 py-1.5 bg-[#2a1d13] border border-[#d4af37]/30 hover:border-[#f7d174] hover:bg-[#38271a] text-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>اكتشاف الدرجات الشاذة قبل الاعتماد</span>
          </button>

          <button 
            type="button"
            onClick={() => handleNav('ai_assistant', 'المساعد الذكي')}
            className="px-4 py-1.5 bg-gradient-to-r from-[#d4af37] to-[#c58a22] text-[#1a100a] rounded-xl text-xs font-black shadow hover:brightness-110 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>اطرح سؤالاً</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
