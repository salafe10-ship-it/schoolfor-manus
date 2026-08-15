import { Award, Bell, BookOpen, Building, Calendar, ChevronDown, Command, DatabaseZap, Layers, LogOut, Moon, Search, Settings, ShieldAlert, Sparkles, Sun, Trophy, UserCircle2 } from 'lucide-react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { School, Branch, UserRole } from '../types';

interface TopbarProps {
  schools: School[];
  selectedSchool: School;
  onSchoolChange: (school: School) => void;
  branches: Branch[];
  selectedBranch: Branch | null;
  onBranchChange: (branch: Branch | null) => void;
  currentRole: UserRole;
  notifications: Array<{ id: string; text: string; time: string; type: 'info' | 'warning' | 'success' }>;
  clearNotifications: () => void;
  userName: string;
  onLogout?: () => void;
  onSettingsClick?: () => void;
  students?: any[];
  onStudentSelect?: (student: any) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  isClientMode?: boolean;
  onOpenSuperAdminPortal?: () => void;
}

export default function Topbar({
  schools,
  selectedSchool,
  onSchoolChange,
  branches,
  selectedBranch,
  onBranchChange,
  currentRole,
  notifications,
  clearNotifications,
  userName,
  onLogout,
  onSettingsClick,
  students = [],
  onStudentSelect,
  theme,
  onThemeToggle,
  isClientMode = false,
  onOpenSuperAdminPortal
}: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeEmpId, setActiveEmpId] = useState('');
  const [roleMenuTab, setRoleMenuTab] = useState<'roles' | 'employees'>('employees');

  useEffect(() => {
    const loadEmps = () => {
      const saved = localStorage.getItem('edupro_employees_permissions_v1');
      if (saved) {
        try {
          setEmployees(JSON.parse(saved));
        } catch (e) {}
      }
      setActiveEmpId(localStorage.getItem('active_employee_id') || 'emp_11');
    };
    loadEmps();
    window.addEventListener('storage', loadEmps);
    window.addEventListener('active-employee-changed', loadEmps);
    return () => {
      window.removeEventListener('storage', loadEmps);
      window.removeEventListener('active-employee-changed', loadEmps);
    };
  }, []);
  
  // Real-time clock and date state
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
      setDateString(
        now.toLocaleDateString('ar-EG', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time student quick search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const getRoleLabel = (role: UserRole) => {
    switch(role) {
      case 'SuperAdmin': return 'المطور العام (SaaS)';
      case 'SchoolAdmin': return 'مدير النظام (Admin)';
      case 'Teacher': return 'أستاذ المادة (Teacher)';
      case 'Accountant': return 'المحاسب المالي (Accountant)';
      case 'Parent': return 'ولي الأمر (Parent)';
    }
  };

  // Close search results if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle searching students in real-time
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const filtered = students.filter(student => {
      const nameMatch = student.fullName?.toLowerCase().includes(query.toLowerCase());
      const nationalIdMatch = student.nationalId?.includes(query);
      const studentIdMatch = student.id?.toLowerCase().includes(query.toLowerCase());
      return nameMatch || nationalIdMatch || studentIdMatch;
    });

    setSearchResults(filtered.slice(0, 5)); // cap at 5 results for speed
    setShowSearchResults(true);
  };

  return (
    <header id="top-navigation-bar" className="bg-[#1a1108]/90 backdrop-blur-md border-b-2 border-[#d4af37]/40 h-16 flex items-center justify-between px-6 shrink-0 relative z-40 text-amber-100 transition-colors duration-300" dir="rtl">
      
      {/* Right side: School Logo and Multi-Tenant inputs */}
      <div className="flex items-center gap-4 text-right">
        
        {/* School Premium Logo Emblem */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#9a6a1d] via-[#f7d174] to-[#c58a22] p-0.5 shadow-md shadow-[#d4af37]/20 flex items-center justify-center shrink-0 border border-[#f7d174]/40">
            <div className="w-full h-full bg-[#130a04] rounded-[10px] flex items-center justify-center font-black text-amber-300 text-sm shadow-inner tracking-tight">
              <Trophy className="w-5 h-5 text-[#fce79a]" />
            </div>
          </div>
          <div className="hidden lg:block leading-tight">
            <h1 className="text-sm font-black text-[#fce79a] flex items-center gap-1.5 leading-none">
              {selectedSchool.name}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <span className="text-[10px] text-amber-300 font-extrabold flex items-center gap-1 mt-1">
              منظومة عبدالسلام سوفت ERP ✦
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-[#d4af37]/30 hidden md:block" />

        {/* Tenant Selection Dropdown (Select Active School) */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            {currentRole === 'SuperAdmin' && !isClientMode ? (
              <>
                <select
                  id="tenant-school-selector"
                  value={selectedSchool.id}
                  onChange={(e) => {
                    const s = schools.find(sh => sh.id === e.target.value);
                    if (s) onSchoolChange(s);
                  }}
                  className="appearance-none bg-[#2a1d13] border border-[#d4af37]/30 text-amber-100 text-xs font-black pr-8 pl-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 cursor-pointer text-right transition-all hover:bg-[#38271a]"
                >
                  {schools.map((school) => (
                    <option key={school.id} value={school.id} className="bg-[#1c120c] text-amber-100">
                      🏫 {school.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-amber-400">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-amber-300/60">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-[#2a1d13] border border-[#d4af37]/30 px-4 py-2 text-xs font-black text-amber-100 select-none shadow-2xs">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>{selectedSchool.name}</span>
                <span className="text-[9px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 font-black mr-1.5">بيئة معزولة ✅</span>
              </div>
            )}
          </div>
        </div>

        {/* Branch Selector Dropdown */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="relative">
            <select
              id="branch-selector"
              value={selectedBranch ? selectedBranch.id : 'all'}
              onChange={(e) => {
                if (e.target.value === 'all') {
                  onBranchChange(null);
                } else {
                  const b = branches.find(br => br.id === e.target.value);
                  if (b) onBranchChange(b);
                }
              }}
              className="appearance-none bg-[#2a1d13] border border-[#d4af37]/30 text-amber-100 text-xs font-bold pr-8 pl-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 cursor-pointer text-right transition-all hover:bg-[#38271a]"
            >
              <option value="all" className="bg-[#1c120c] text-amber-100">📍 كل فروع المدرسة</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#1c120c] text-amber-100">
                  📍 {b.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-amber-400">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-amber-300/60">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Academic Year Selector Dropdown */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="relative">
            <select
              id="academic-year-selector"
              defaultValue={selectedSchool.academicYear || '2026/2027'}
              className="appearance-none bg-[#2a1d13] border border-[#d4af37]/30 text-amber-100 text-xs font-bold pr-8 pl-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 cursor-pointer text-right transition-all hover:bg-[#38271a]"
            >
              <option value="2026/2027" className="bg-[#1c120c] text-amber-100">📅 العام الدراسي 2026/2027</option>
              <option value="2025/2026" className="bg-[#1c120c] text-amber-100">📅 العام الدراسي 2025/2026</option>
              <option value="2024/2025" className="bg-[#1c120c] text-amber-100">📅 العام الدراسي 2024/2025</option>
            </select>
            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-amber-400">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-amber-300/60">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Center: Live Clock & Date Info + Quick Smart Search (Hidden in Client Mode for maximum simplicity) */}
      {!isClientMode && (
        <div className="hidden md:flex items-center gap-4 flex-1 max-w-xl justify-center mx-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          
          {/* Ticking Arabic Clock Widget */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-transparent dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 select-none shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#dfb55a] animate-pulse" />
            <div className="text-right leading-none">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{dateString}</p>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight mt-0.5">{timeString}</p>
            </div>
          </div>

          {/* Omni Search Box */}
          <div ref={searchContainerRef} className="relative w-full max-w-xs lg:max-w-sm">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                placeholder="البحث الذكي عن الطلاب... 🔍"
                className="w-full bg-transparent dark:hover:bg-slate-100 dark:hover:bg-slate-900 dark:border-slate-800 focus:border-amber-500 focus:dark:focus:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-200 pr-9 pl-10 py-2 focus:outline-none transition-all shadow-inner text-right"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="absolute inset-y-0 left-3 flex items-center gap-1 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-lg my-1.5 text-[9px] font-black text-slate-500 dark:text-slate-400 leading-none pointer-events-none">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </div>
            </div>

            {/* Dropdown with instant student suggestions */}
            {showSearchResults && (
              <div className="absolute right-0 left-0 mt-2 dark:bg-slate-950 dark:border-slate-800 z-50 text-right overflow-hidden">
                <div className="px-3.5 py-2 bg-transparent dark:bg-slate-900 text-[10px] font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span>نتائج البحث الفورية المربوطة بالـ DB ({searchResults.length})</span>
                  <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full font-black">نشط</span>
                </div>
                
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                    لم يتم العثور على طلاب مطابقين للبحث.
                  </div>
                ) : (
                  <div className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                    {searchResults.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => {
                          if (onStudentSelect) {
                            onStudentSelect(student);
                          }
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                        className="w-full text-right px-4 py-2.5 hover:bg-transparent dark:hover:bg-slate-900/60 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-black">
                            {student.gender === 'أنثى' ? '👩‍🎓' : '👨‍🎓'}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {student.fullName}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              رقم الهوية: {student.nationalId}
                            </p>
                          </div>
                        </div>
                        <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                          الصف {student.grade}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Left side: Role impersonation, Notifications, Settings Gear, User Profile, Logout */}
      <div className="flex items-center gap-3">

        {/* Central Admin Portal Button (Always accessible for SuperAdmin or if handler provided) */}
        {onOpenSuperAdminPortal && (
          <button
            type="button"
            id="superadmin-portal-header-btn"
            onClick={onOpenSuperAdminPortal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-400/40 transition-all shadow-md shadow-amber-600/20 hover:scale-105 cursor-pointer shrink-0"
            title="انتقال مباشر للوحة الإدارة المركزية والتشغيل الفوقي (SuperAdmin)"
          >
            <Award className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="hidden md:inline">الإدارة المركزية</span>
          </button>
        )}
        
        {/* Trusted role display. Role changes require a new authenticated session. */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 bg-transparent dark:bg-slate-900 dark:border-slate-800 font-bold">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline text-[10px] text-slate-600 dark:text-slate-300">
            {getRoleLabel(currentRole)}
          </span>
        </div>

        {/* Notifications Icon with Counter */}
        <div className="relative">
          <button
            id="notifications-bell"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleMenu(false);
            }}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer relative transition-colors dark:border-slate-800"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-bounce">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 mt-2 w-80 dark:bg-slate-950 dark:border-slate-800 py-1 z-50 overflow-hidden text-right">
              <div className="px-4 py-2.5 bg-transparent dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-[11px]">التنبيهات السحابية الواردة</span>
                {notifications.length > 0 && (
                  <button onClick={clearNotifications} className="text-[10px] text-red-600 hover:underline font-black">
                    تصفير التنبيهات
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">لا توجد تنبيهات واردة حاليًا.</p>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-900/60 hover:bg-transparent dark:hover:bg-slate-900 flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.type === 'warning' ? 'bg-amber-500' : notif.type === 'success' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                      <div className="flex-1">
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">{notif.text}</p>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">{notif.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings Direct Action Shortcut */}
        {onSettingsClick && !isClientMode && (
          <button
            onClick={onSettingsClick}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-colors dark:border-slate-800"
            title="الإعدادات العامة والربط البرمجي"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Theme Toggle Button (Light / Dark Mode Engine) */}
        <button
          id="theme-mode-toggle"
          onClick={onThemeToggle}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-all duration-300 dark:border-slate-800 flex items-center justify-center relative"
          title={theme === 'dark' ? "التبديل للوضع الفاتح" : "التبديل للوضع الداكن"}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
          ) : (
            <Moon className="w-4 h-4 text-amber-500 hover:rotate-12 transition-transform" />
          )}
          <span className="sr-only">تبديل المظهر</span>
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />

        {/* User Badge Details */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-100 to-yellow-100 dark:from-amber-950 dark:to-yellow-950 border border-yellow-300 dark:border-yellow-800 flex items-center justify-center text-yellow-800 dark:text-yellow-300 font-extrabold text-xs shadow-2xs select-none">
            {userName.charAt(0)}
          </div>
          <div className="hidden lg:block text-right select-none leading-tight">
            <p className="text-xs font-black text-slate-800 dark:text-slate-200">{userName}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500">المرجع: {selectedSchool.licenseNumber}</p>
          </div>
        </div>

        {/* Luxury Logout button */}
        {onLogout && (
          <button 
            type="button"
            onClick={onLogout}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-950/20 rounded-lg flex items-center gap-1 border border-red-100/60 dark:border-red-950/40 transition-all shadow-2xs cursor-pointer font-extrabold text-[11px]"
            title="تسجيل الخروج والعودة لبوابة المداخل"
          >
            <LogOut className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
            <span className="hidden md:inline">خروج</span>
          </button>
        )}

      </div>

    </header>
  );
}
