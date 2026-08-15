import { Activity, ArrowRightLeft, Bell, CheckCircle, ChevronLeft, ChevronRight, Clock, CreditCard, Database, GitBranch, Globe, HardDrive, HelpCircle, Key, LogOut, Menu, MessageSquare, Moon, RefreshCw, Search, Server, Settings, ShieldAlert, Sliders, Sun, Terminal, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
// Import Modular Components
import SuperAdminOperationsCenter from './super-admin/SuperAdminOperationsCenter';
import SuperAdminDashboard from './super-admin/SuperAdminDashboard';
import SuperAdminSchools from './super-admin/SuperAdminSchools';
import SuperAdminBranches from './super-admin/SuperAdminBranches';
import SuperAdminUsers from './super-admin/SuperAdminUsers';
import SuperAdminRbac from './super-admin/SuperAdminRbac';
import SuperAdminBackups from './super-admin/SuperAdminBackups';
import SuperAdminAudit from './super-admin/SuperAdminAudit';

// New SaaS Control Center Modules (14-21)
import SuperAdminSubscriptions from './super-admin/SuperAdminSubscriptions';
import SuperAdminDomains from './super-admin/SuperAdminDomains';
import SuperAdminResources from './super-admin/SuperAdminResources';
import SuperAdminImpersonation from './super-admin/SuperAdminImpersonation';
import SuperAdminHealth from './super-admin/SuperAdminHealth';
import SuperAdminUpdates from './super-admin/SuperAdminUpdates';
import SuperAdminCentralNotifications from './super-admin/SuperAdminCentralNotifications';
import SuperAdminFeatures from './super-admin/SuperAdminFeatures';
import DeveloperPlatformCenter from '../developer/DeveloperPlatformCenter';

import { EnterpriseLogger } from '../database/services/EnterpriseLogger';

interface SuperAdminViewProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  selectedSchool: any;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
  schools: any[];
  setSchools: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, details: string, module: string) => void;
  setIsSuperAdminPortalActive: (v: boolean) => void;
  branches: any[];
  setBranches: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedSchool?: (school: any) => void;
  setCurrentRole?: (role: any) => void;
  setCurrentPortal?: (portal: any) => void;
  currentRole?: string;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  students?: any[];
}

// Bulletproof copy-to-clipboard function supporting sandboxed frames and secure/non-secure origins
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err: any) {
      EnterpriseLogger.warn('Clipboard API failed, trying fallback...', "SuperAdminView", { details: err });
    }
  }

  // Fallback to traditional execCommand method
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err: any) {
    EnterpriseLogger.error('Fallback copying failed:', "SuperAdminView", { error: err });
    document.body.removeChild(textArea);
    return false;
  }
};

export default function SuperAdminView({
  activeSection,
  setActiveSection,
  selectedSchool,
  triggerNotification,
  schools = [],
  setSchools,
  logAction,
  setIsSuperAdminPortalActive,
  branches = [],
  setBranches,
  setSelectedSchool,
  setCurrentRole,
  setCurrentPortal,
  currentRole = 'SuperAdmin',
  theme = 'light',
  onThemeToggle,
  students = []
}: SuperAdminViewProps) {

  const handleImpersonateSchool = (school: any, reason: string) => {
    localStorage.setItem('impersonation_active', 'true');
    localStorage.setItem('impersonated_school_id', school.id);
    localStorage.setItem('impersonated_school_name', school.name);
    localStorage.setItem('impersonator_name', 'سليمان بن غازي (SuperAdmin)');
    localStorage.setItem('impersonation_reason', reason);
    localStorage.setItem('impersonation_start_time', new Date().toISOString());

    if (setSelectedSchool) setSelectedSchool(school);
    if (setCurrentRole) setCurrentRole('SchoolAdmin');
    setIsSuperAdminPortalActive(false);
    if (setCurrentPortal) setCurrentPortal('school');

    logAction(
      'IMPERSONATION_START',
      `بدء جلسة دخول الدعم الفني والمحاكاة لـ ${school.name}. السبب: ${reason}`,
      'التحكم المركزي والحوكمة'
    );

    triggerNotification(`تم بدء جلسة الدعم الفني بمحاكاة مشرف لـ ${school.name} بنجاح 🚀`, 'success');
  };

  const handleOpenSchoolLogin = (school: any) => {
    if (setSelectedSchool) setSelectedSchool(school);
    setIsSuperAdminPortalActive(false);
    if (setCurrentPortal) setCurrentPortal('login');

    logAction(
      'OPEN_SCHOOL_LOGIN_GATEWAY',
      `توجيه مسئول النظام لبوابة دخول المدرسة: ${school.name} (تطلب المصادقة بكلمة المرور)`,
      'المصادقة والأمان'
    );

    triggerNotification(`فتح بوابة تسجيل الدخول المباشرة لـ ${school.name}`, 'info');
  };

  // Right Sidebar collapsed state (RTL Layout)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sa_sidebar_collapsed') === 'true';
  });

  // Local control tab router containing all operational control modules
  const [localTab, setLocalTab] = useState<string>('operations_center');

  // Dynamic Live Arabic Clock & Date State
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      // Format in elegant Arabic locale
      setCurrentTime(now.toLocaleDateString('ar-EG', options));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sa_sidebar_collapsed', String(next));
      return next;
    });
  };

  const navGroups = [
    {
      title: 'العمليات والرقابة',
      items: [
        { id: 'operations_center', label: 'لوحة العمليات', icon: Activity },
        { id: 'schools', label: 'إدارة المدارس', icon: Server },
        { id: 'users', label: 'إدارة المستخدمين', icon: Users },
        { id: 'subscriptions', label: 'إدارة الاشتراكات', icon: CreditCard },
        { id: 'features', label: 'إدارة الوحدات', icon: Sliders },
        { id: 'domains', label: 'الروابط السحابية', icon: Globe },
      ]
    },
    {
      title: 'الأمن والموارد السحابية',
      items: [
        { id: 'developer_center', label: 'Developer & Platform Center', icon: Terminal },
        { id: 'dashboard', label: 'مركز العمليات', icon: Terminal },
        { id: 'resources', label: 'التقارير والإحصائيات', icon: HardDrive },
        { id: 'backups', label: 'النسخ الاحتياطية', icon: Database },
        { id: 'broadcast', label: 'مركز التنبيهات', icon: Bell },
        { id: 'impersonate', label: 'الدعم الفني المؤقت', icon: Key },
      ]
    },
    {
      title: 'الحوكمة والترقيات',
      items: [
        { id: 'rbac', label: 'إدارة التراخيص', icon: ShieldAlert },
        { id: 'updates', label: 'الإعدادات العامة', icon: Settings },
        { id: 'audit', label: 'سجل النشاط', icon: Clock },
        { id: 'health', label: 'سلامة النظام', icon: Activity },
      ]
    }
  ];

  // Custom log wrapper to pass to submodules
  const handleSubmoduleLog = (action: string, details: string, section: string = 'الإدارة المركزية') => {
    logAction(action, details, section);
  };

  return (
    <div id="super-admin-portal" className="flex h-screen bg-transparent dark:bg-[#070D19] text-slate-800 dark:text-slate-100 font-sans overflow-hidden w-full" dir="rtl">
      
      {/* ================= ثانياً : القائمة الجانبية (Right Sidebar) ================= */}
      <aside 
        id="sa-sidebar" 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-[#0F172A] border-l border-slate-800 flex flex-col h-full shrink-0 shadow-2xl relative z-40 transition-all duration-350 ease-in-out`}
      >
        {/* Brand Logo & Title */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-white font-black shadow-md cursor-pointer shrink-0">
              <Server className="w-5 h-5 text-amber-100 animate-pulse" />
            </div>
            {!isSidebarCollapsed && (
              <div className="transition-all duration-300">
                <span className="text-[10px] text-amber-400 font-black tracking-wider block uppercase">EduPro Enterprise</span>
                <h1 className="text-sm font-black text-white truncate max-w-[150px]">الإدارة المركزية</h1>
              </div>
            )}
          </div>
          
          {!isSidebarCollapsed && (
            <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-900 px-2 py-0.5 rounded-full font-bold">RTL</span>
          )}
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-850">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              {!isSidebarCollapsed ? (
                <h2 className="text-[10px] font-black text-slate-500 tracking-wider pr-3 uppercase">
                  {group.title}
                </h2>
              ) : (
                <div className="border-t border-slate-800 my-2 pt-1" />
              )}
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = localTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`sidebar-tab-${item.id}`}
                      onClick={() => setLocalTab(item.id)}
                      className={`w-full flex items-center ${
                        isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                      } text-xs text-right transition-all duration-150 group relative ${
                        isActive 
                          ? 'bg-gradient-to-r from-amber-600/90 to-amber-700/90 text-white font-bold shadow-lg shadow-amber-600/20 border-r-4 border-amber-400' 
                          : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                      }`}
                      title={item.label}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-all ${
                        isActive ? 'text-white scale-110' : 'text-slate-505 group-hover:text-slate-200 group-hover:scale-115'
                      }`} />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                      
                      {/* Active indicator dot when collapsed */}
                      {isSidebarCollapsed && isActive && (
                        <span className="absolute left-2 w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Back to normal School Portal & Collapse Button at bottom */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          {!isSidebarCollapsed && (
            <button
              onClick={() => {
                setIsSuperAdminPortalActive(false);
                if (setCurrentPortal) setCurrentPortal('school');
                if (setCurrentRole) setCurrentRole('SchoolAdmin');
                triggerNotification('تم الخروج من لوحة الإدارة المركزية والعودة لبوابة المدرسة', 'info');
              }}
              className="w-full bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900 text-rose-300 px-4 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>الخروج لبوابة المدرسة</span>
            </button>
          )}

          <button
            onClick={handleToggleSidebar}
            id="sa-sidebar-toggle-btn"
            className="w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-white transition-all text-[11px] cursor-pointer"
            title={isSidebarCollapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            {isSidebarCollapsed ? <ChevronLeft className="w-4 h-4 animate-pulse" /> : <ChevronRight className="w-4 h-4" />}
            {!isSidebarCollapsed && <span className="font-bold">طي القائمة الجانبية</span>}
          </button>
        </div>
      </aside>

      {/* ================= Left content frame (Header + Workspace) ================= */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        
        {/* ================= ثالثاً : Header ================= */}
        <header id="sa-header" className="dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-20 px-6 flex items-center justify-between shrink-0 relative z-30 shadow-xs">
          
          {/* Right Side: Welcome greeting & live status info (RTL: right of top screen) */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <h2 className="text-sm font-black text-slate-900 dark:text-white">مرحباً بك، المدير العام</h2>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">صلاحيات كاملة • EduPro Cloud</span>
            </div>
            
            {/* School context details */}
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">البيئة السحابية</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">cluster-01-me-central</span>
            </div>
          </div>

          {/* Center: Global Search Input */}
          <div className="relative w-full max-w-md mx-6 hidden sm:block bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3.5" />
            <input 
              type="text" 
              placeholder="ابحث عن مدرسة، مستخدم، اشتراك... (Ctrl + K)" 
              className="w-full bg-transparent dark:bg-slate-950/80 text-slate-800 dark:text-slate-100 dark:border-slate-800 py-2.5 pl-12 pr-10 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-sans placeholder-slate-400 dark:placeholder-slate-600"
            />
            <span className="absolute left-3.5 top-2.5 text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">Ctrl + K</span>
          </div>

          {/* Left Side: Notification icons, theme, profile avatar */}
          <div className="flex items-center gap-3">
            
            {/* Button: Refresh cluster data */}
            <button 
              onClick={() => {
                triggerNotification('تم تحديث البيانات وجلب تفاصيل الاتصال بالـ Cluster بنجاح.', 'success');
              }}
              className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-950/80 transition-all cursor-pointer flex items-center gap-1 text-xs font-black"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
              <span className="hidden xl:inline">تحديث البيانات</span>
            </button>

            {/* Time Indicator */}
            <div className="hidden lg:flex flex-col text-left font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-transparent dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-3 py-1.5 rounded-xl">
              <span className="font-sans font-bold text-slate-600 dark:text-slate-300">{currentTime || 'جاري التحميل...'}</span>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Language Selection */}
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative">
              <Globe className="w-4.5 h-4.5" />
            </button>

            {/* Theme Toggle Button */}
            {onThemeToggle && (
              <button 
                onClick={onThemeToggle}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                title={theme === 'dark' ? 'التحويل للوضع المشرق' : 'التحويل للوضع الداكن'}
              >
                {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-amber-600" />}
              </button>
            )}

            {/* Mail icon */}
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative">
              <MessageSquare className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
            </button>

            {/* Notification bell with red badge '12' */}
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md">12</span>
            </button>

            {/* Settings Gear */}
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <Settings className="w-4.5 h-4.5" />
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Profile Avatar with online green dot */}
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <div className="w-9.5 h-9.5 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-xs border-2 border-white dark:border-slate-800 group-hover:border-amber-400 transition-all">
                  SA
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
              </div>
            </div>

          </div>
        </header>

        {/* ================= Main Sub-Stage Workspace Area ================= */}
        <main className="flex-1 overflow-y-auto p-6 bg-transparent dark:bg-[#070D19] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Router Rendering of the Submodules based on localTab */}
            {localTab === 'operations_center' && (
              <SuperAdminOperationsCenter 
                schools={schools}
                setSchools={setSchools}
                branches={branches}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
                setSelectedSchool={setSelectedSchool!}
                setCurrentRole={setCurrentRole!}
                setIsSuperAdminPortalActive={setIsSuperAdminPortalActive}
                setCurrentPortal={setCurrentPortal}
              />
            )}

            {localTab === 'dashboard' && (
              <SuperAdminDashboard 
                schools={schools}
                branches={branches}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'resources' && (
              <SuperAdminResources 
                schools={schools}
                setSchools={setSchools}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'health' && (
              <SuperAdminHealth 
                schools={schools}
                branches={branches}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'schools' && (
              <SuperAdminSchools 
                schools={schools}
                setSchools={setSchools}
                branches={branches}
                setBranches={setBranches}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
                onOpenSchoolLogin={handleOpenSchoolLogin}
                onImpersonateSchool={handleImpersonateSchool}
                currentRole={currentRole}
              />
            )}

            {localTab === 'branches' && (
              <SuperAdminBranches 
                schools={schools}
                branches={branches}
                setBranches={setBranches}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'domains' && (
              <SuperAdminDomains 
                schools={schools}
                setSchools={setSchools}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'features' && (
              <SuperAdminFeatures 
                schools={schools}
                setSchools={setSchools}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'subscriptions' && (
              <SuperAdminSubscriptions 
                schools={schools}
                setSchools={setSchools}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'impersonate' && (
              <SuperAdminImpersonation 
                schools={schools}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
                setSelectedSchool={setSelectedSchool!}
                setCurrentRole={setCurrentRole!}
                setIsSuperAdminPortalActive={setIsSuperAdminPortalActive}
                setCurrentPortal={setCurrentPortal}
              />
            )}

            {localTab === 'users' && (
              <SuperAdminUsers 
                schools={schools}
                branches={branches}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'rbac' && (
              <SuperAdminRbac 
                schools={schools}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'updates' && (
              <SuperAdminUpdates 
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'broadcast' && (
              <SuperAdminCentralNotifications 
                schools={schools}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'backups' && (
              <SuperAdminBackups 
                schools={schools}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'audit' && (
              <SuperAdminAudit 
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
              />
            )}

            {localTab === 'developer_center' && (
              <DeveloperPlatformCenter 
                schools={schools}
                students={students}
                triggerNotification={triggerNotification}
                logAction={handleSubmoduleLog}
              />
            )}

          </div>
        </main>
      </div>

    </div>
  );
}
