import { Activity, ArrowRightLeft, Bell, Building2, CheckCircle, ChevronLeft, ChevronRight, Clock, CreditCard, Database, GitBranch, Globe, HardDrive, HelpCircle, Key, LogOut, Menu, MessageSquare, Moon, RefreshCw, Search, Server, Settings, ShieldAlert, Sliders, Sun, Terminal, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
// Import Modular Components
import SuperAdminOperationsCenter from './super-admin/SuperAdminOperationsCenter';
import SuperAdminDashboard from './super-admin/SuperAdminDashboard';
import SuperAdminSchools from './super-admin/SuperAdminSchools';
import SuperAdminTenants from './super-admin/SuperAdminTenants';
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
import { authenticatedRequest } from '../utils/authenticatedRequest';
import { toDisplayPlan } from '../utils/centralTenantSubscription';

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
    triggerNotification(`دخول الدعم الفني إلى ${school.name} يتطلب جلسة انتحال مركزية قصيرة العمر مع تدقيق السبب (${reason})؛ لم يتم فتح جلسة محلية.`, 'warning');
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

  const [directoryStatus, setDirectoryStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [directoryError, setDirectoryError] = useState('');
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantDirectoryStatus, setTenantDirectoryStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const refreshCentralDirectory = async (showNotice = true) => {
    setDirectoryStatus('loading');
    setDirectoryError('');
    try {
      const [schoolsResponse, branchesResponse] = await Promise.all([
        authenticatedRequest('/api/admin/central/schools'),
        authenticatedRequest('/api/admin/central/branches'),
      ]);
      const schoolsPayload = await schoolsResponse.json().catch(() => ({}));
      const branchesPayload = await branchesResponse.json().catch(() => ({}));
      if (!schoolsResponse.ok || !schoolsPayload?.success || !Array.isArray(schoolsPayload.schools)) {
        throw new Error(schoolsPayload?.message || 'تعذر قراءة دليل المدارس المركزي.');
      }
      if (!branchesResponse.ok || !branchesPayload?.success || !Array.isArray(branchesPayload.branches)) {
        throw new Error(branchesPayload?.message || 'تعذر قراءة دليل الفروع المركزي.');
      }
      const nextSchools = schoolsPayload.schools.map((school: any) => ({
        ...(school.central_metadata && typeof school.central_metadata === 'object' ? school.central_metadata : {}),
        id: school.id,
        tenantId: school.tenant_id,
        name: school.display_name,
        schoolShortName: school.central_metadata?.shortName || school.display_name,
        schoolCode: school.school_code,
        status: school.status,
        tenantStatus: school.tenant_status || undefined,
        archived: school.status === 'archived',
        usersCount: Number(school.users_count || 0),
        studentCount: Number(school.students_count || 0),
        plan: school.subscription?.plan_code ? toDisplayPlan(school.subscription.plan_code) : undefined,
        subscriptionStatus: school.subscription?.status || undefined,
        subscriptionEnd: school.subscription?.ends_at || undefined,
        userLimit: school.subscription?.seat_limit ? Number(school.subscription.seat_limit) : undefined,
        connectedDb: 'canonical-postgres',
      }));
      const nextBranches = branchesPayload.branches.map((branch: any) => ({
        ...branch,
        id: branch.id,
        schoolId: branch.school_id,
        schoolName: branch.school_name,
        name: branch.name,
        branchCode: branch.branch_code,
        status: branch.status === 'closed' ? 'suspended' : branch.status,
        isMain: Boolean(branch.is_main),
        studentsCount: Number(branch.students_count || 0),
        employeesCount: Number(branch.users_count || 0),
      }));
      setSchools(nextSchools);
      setBranches(nextBranches);
      setDirectoryStatus('ready');
      if (showNotice) triggerNotification(`تم تحديث الدليل المركزي: ${nextSchools.length} مدرسة و${nextBranches.length} فرع`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر تحديث الدليل المركزي.';
      setDirectoryStatus('error');
      setDirectoryError(message);
      if (showNotice) triggerNotification(message, 'danger');
    }
  };

  const refreshCentralTenants = async (showNotice = false) => {
    setTenantDirectoryStatus('loading');
    try {
      const response = await authenticatedRequest('/api/admin/central/tenants?includeArchived=true');
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !Array.isArray(payload.tenants)) {
        throw new Error(payload?.message || 'تعذر قراءة دليل المستأجرين المركزي.');
      }
      const nextTenants = payload.tenants.map((tenant: any) => ({
        ...tenant,
        legalName: tenant.legal_name,
        planCode: tenant.plan_code,
        schoolsCount: Number(tenant.schools_count || 0),
        branchesCount: Number(tenant.branches_count || 0),
        usersCount: Number(tenant.users_count || 0),
        studentsCount: Number(tenant.students_count || 0),
        subscription: tenant.subscription ? {
          ...tenant.subscription,
          planCode: tenant.subscription.plan_code,
          startsAt: tenant.subscription.starts_at,
          endsAt: tenant.subscription.ends_at,
          seatLimit: Number(tenant.subscription.seat_limit || 0),
          autoRenew: Boolean(tenant.subscription.auto_renew),
        } : null,
      }));
      setTenants(nextTenants);
      setTenantDirectoryStatus('ready');
      if (showNotice) triggerNotification(`تم تحديث دليل المستأجرين: ${nextTenants.length} مستأجر`, 'success');
    } catch (error) {
      setTenantDirectoryStatus('error');
      if (showNotice) triggerNotification(error instanceof Error ? error.message : 'تعذر تحديث دليل المستأجرين.', 'danger');
    }
  };

  // Right Sidebar collapsed state (RTL Layout)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sa_sidebar_collapsed') === 'true';
  });

  // Local control tab router containing all operational control modules
  const [localTab, setLocalTab] = useState<string>('operations_center');

  useEffect(() => {
    void refreshCentralDirectory(false);
    void refreshCentralTenants(false);
  }, []);

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
        { id: 'tenants', label: 'إدارة المستأجرين', icon: Building2 },
        { id: 'schools', label: 'إدارة المدارس', icon: Server },
        { id: 'branches', label: 'إدارة الفروع', icon: GitBranch },
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
    <div id="super-admin-portal" className="flex h-screen bg-[#f4efe5] dark:bg-[#070D19] text-slate-800 dark:text-slate-100 font-sans overflow-hidden w-full" dir="rtl">
      
      {/* ================= ثانياً : القائمة الجانبية (Right Sidebar) ================= */}
      <aside 
        id="sa-sidebar" 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-[#2a1d13] border-l border-[#d4af37]/20 flex flex-col h-full shrink-0 shadow-2xl relative z-40 transition-all duration-350 ease-in-out`}
      >
        {/* Brand Logo & Title */}
        <div className="p-4 border-b border-[#d4af37]/20 flex items-center justify-between gap-3 bg-[#1c120c]/70">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#f7d174] to-[#c58a22] flex items-center justify-center text-[#2a1a0e] font-black shadow-md cursor-pointer shrink-0">
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
            <span className="text-[10px] bg-[#2a1a0e] text-amber-200 border border-[#d4af37]/40 px-2 py-0.5 rounded-full font-bold">RTL</span>
          )}
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#c58a22]">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              {!isSidebarCollapsed ? (
                <h2 className="text-[10px] font-black text-slate-500 tracking-wider pr-3 uppercase">
                  {group.title}
                </h2>
              ) : (
                <div className="border-t border-[#d4af37]/15 my-2 pt-1" />
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
                          ? 'bg-gradient-to-r from-[#c58a22] to-[#8b6508] text-white font-bold shadow-lg shadow-amber-900/30 border-r-4 border-[#f7d174]'
                          : 'text-[#d6c8b4] hover:bg-[#3b281a] hover:text-white'
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
        <div className="p-3 border-t border-[#d4af37]/20 bg-[#1c120c]/70 space-y-2">
          {!isSidebarCollapsed && (
            <button
              onClick={() => {
                setIsSuperAdminPortalActive(false);
                if (setCurrentPortal) setCurrentPortal('school');
                if (setCurrentRole) setCurrentRole('SchoolAdmin');
                setActiveSection('dashboard');
                triggerNotification('تم الخروج من لوحة الإدارة المركزية والعودة لبوابة المدرسة', 'info');
              }}
              className="w-full bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/70 text-rose-200 px-4 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs rounded-2xl"
            >
              <LogOut className="w-4 h-4" />
              <span>الخروج لبوابة المدرسة</span>
            </button>
          )}

          <button
            onClick={handleToggleSidebar}
            id="sa-sidebar-toggle-btn"
            className="w-full py-2 flex items-center justify-center gap-2 rounded-2xl bg-[#2a1a0e] hover:bg-[#3b281a] border border-[#d4af37]/20 text-[#d6c8b4] hover:text-white transition-all text-[11px] cursor-pointer"
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
        <header id="sa-header" className="bg-[#fffdf8] dark:bg-slate-900 border-b border-[#d4af37]/25 dark:border-slate-800 h-20 px-6 flex items-center justify-between shrink-0 relative z-30 shadow-sm">
          
          {/* Right Side: Welcome greeting & live status info (RTL: right of top screen) */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${directoryStatus === 'ready' ? 'bg-emerald-500' : directoryStatus === 'error' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`} />
                <h2 className="text-sm font-black text-slate-900 dark:text-white">مرحباً بك، المدير العام</h2>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">صلاحيات كاملة • نطاق مركزي موثق</span>
            </div>
            
            {/* School context details */}
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">البيئة السحابية</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{directoryStatus === 'ready' ? `${schools.length} مستأجر • ${branches.length} فرع` : directoryStatus === 'error' ? 'الدليل يحتاج مراجعة' : 'جاري مزامنة الدليل...'}</span>
            </div>
          </div>

          {/* Center: Global Search Input */}
          <div className="relative w-full max-w-md mx-6 hidden sm:block bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl px-10 py-2 shadow-sm transition-all duration-300">
            <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3.5" />
            <input 
              type="text" 
              placeholder="ابحث عن مدرسة، مستخدم، اشتراك... (Ctrl + K)" 
              className="w-full bg-transparent dark:bg-slate-950/80 text-slate-800 dark:text-slate-100 dark:border-slate-800 py-1.5 pl-12 pr-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-sans placeholder-slate-400 dark:placeholder-slate-600"
            />
            <span className="absolute left-3.5 top-2.5 text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">Ctrl + K</span>
          </div>

          {/* Left Side: Notification icons, theme, profile avatar */}
          <div className="flex items-center gap-3">
            
            {/* Button: Refresh cluster data */}
            <button 
              onClick={() => { void refreshCentralDirectory(); void refreshCentralTenants(true); }}
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
            <button type="button" disabled aria-label="اللغة العربية المعتمدة" title="العربية هي اللغة المعتمدة حاليًا" className="p-2 rounded-lg text-slate-400/60 dark:text-slate-500 cursor-not-allowed transition-all relative">
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
            <button type="button" aria-label="الرسائل والتنبيهات المركزية" title="فتح مركز التنبيهات" onClick={() => setLocalTab('broadcast')} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative">
              <MessageSquare className="w-4.5 h-4.5" />
            </button>

            {/* Notification bell opens the canonical broadcast center; no synthetic unread count. */}
            <button aria-label="التنبيهات المركزية" onClick={() => setLocalTab('broadcast')} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative">
              <Bell className="w-4.5 h-4.5" />
            </button>

            {/* Settings Gear */}
            <button type="button" aria-label="الإعدادات العامة" title="فتح الإعدادات العامة" onClick={() => setLocalTab('updates')} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
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
        <main className="flex-1 overflow-y-auto p-6 bg-[#f4efe5] dark:bg-[#070D19] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <div className="max-w-7xl mx-auto space-y-6">

            <section className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-r from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-4 shadow-md" aria-label="حالة الدليل المركزي">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2a1a0e] text-amber-300"><ShieldAlert className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">مركز إدارة المستأجرين والمدارس</h2>
                    <p className="mt-0.5 text-[10px] font-bold text-slate-500">كل تغيير إداري يمر عبر المصدر المركزي ويظهر في سجل التدقيق.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black">
                  <span className={`rounded-full border px-3 py-1 ${directoryStatus === 'ready' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : directoryStatus === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                    {directoryStatus === 'ready' ? 'الدليل متصل' : directoryStatus === 'error' ? 'الدليل غير متاح' : 'جاري الاتصال'}
                  </span>
                  <span className={`rounded-full border px-3 py-1 ${tenantDirectoryStatus === 'ready' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : tenantDirectoryStatus === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{tenants.length} مستأجر{tenants.filter((tenant) => tenant.status === 'archived').length ? ` • ${tenants.filter((tenant) => tenant.status === 'archived').length} مؤرشف` : ''}</span>
                  <span className="rounded-full border border-[#d4af37]/30 bg-white/70 px-3 py-1 text-slate-600">{schools.length} مدرسة</span>
                  <span className="rounded-full border border-[#d4af37]/30 bg-white/70 px-3 py-1 text-slate-600">{branches.length} فرع</span>
                </div>
              </div>
              {directoryStatus === 'error' && <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700">{directoryError || 'تعذر تحميل الدليل المركزي.'} — استخدم زر التحديث بعد التحقق من الجلسة والاتصال.</p>}
            </section>
            
            {/* Router Rendering of the Submodules based on localTab */}
            {localTab === 'tenants' && (
              <SuperAdminTenants
                tenants={tenants}
                setTenants={setTenants}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
                onNavigateToTab={setLocalTab}
              />
            )}

            {localTab === 'operations_center' && (
              <SuperAdminOperationsCenter 
                schools={schools}
                setSchools={setSchools}
                branches={branches}
                tenants={tenants}
                setTenants={setTenants}
                logAction={handleSubmoduleLog}
                triggerNotification={triggerNotification}
                setSelectedSchool={setSelectedSchool!}
                setCurrentRole={setCurrentRole!}
                setIsSuperAdminPortalActive={setIsSuperAdminPortalActive}
                setCurrentPortal={setCurrentPortal}
                onNavigateToTab={setLocalTab}
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
                tenants={tenants}
                setTenants={setTenants}
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
                tenants={tenants}
                setTenants={setTenants}
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
