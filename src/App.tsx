import { Activity, AlertTriangle, ArrowRightLeft, BarChart3, BookOpen, Building2, Bus, Calendar, CalendarCheck, Check, CheckCircle2, ChevronDown, ChevronUp, Container, CreditCard, Database, DatabaseZap, DollarSign, Download, Edit3, FileBadge2, FileCode, FileDown, FileSpreadsheet, FileText, Gauge, Globe2, GraduationCap, HardDriveDownload, KeyRound, Lock as LockIcon, LogOut, MessageSquareDot, Plus, Printer, RefreshCw, Search, Settings, Settings2, Shield, ShieldAlert, ShieldCheck, Shirt, Sliders, SlidersHorizontal, Sparkles, Trash2, User, UserSquare, Users, WalletCards, Workflow, X } from 'lucide-react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { storageService } from './services/storage/StorageService';
import { EnterpriseLogger } from './database/services/EnterpriseLogger';
import { NotificationEngine, NotificationType, NotificationCategory } from './database/services/NotificationEngine';
import * as React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import EnterpriseActionToolbar from './components/shared/EnterpriseActionToolbar';
import TopNavigation from './components/TopNavigation';
import Topbar from './components/Topbar';
import SuperAdminView from './components/SuperAdminView';
const StudentFinancialPortal = React.lazy(() => import('./components/StudentFinancialPortal'));
const GeneralLedgerPortal = React.lazy(() => import('./components/GeneralLedgerPortal'));
import AccountingErrorBoundary from './components/AccountingErrorBoundary';
const StudentAffairsPortal = React.lazy(() => import('./components/StudentAffairsPortal'));
const AdmissionsPortal = React.lazy(() => import('./components/AdmissionsPortal'));
const AcademicAffairsPortal = React.lazy(() => import('./components/AcademicAffairsPortal'));
import SmartPortalGateway from './components/SmartPortalGateway';
import SchoolClientLogin from './components/SchoolClientLogin';
import PasswordRecoveryScreen from './components/PasswordRecoveryScreen';
const HumanResourcesPortal = React.lazy(() => import('./components/hr/HumanResourcesPortal'));
const ExamsResultsModule = React.lazy(() => import('./components/ExamsResultsModule'));
const ExamsErrorBoundary = React.lazy(() => import('./components/ExamsErrorBoundary'));
import AIAssistantPortal from './components/AIAssistantPortal';
const SystemHealthCenter = React.lazy(() => import('./components/SystemHealthCenter'));
const SchoolUniformManagement = React.lazy(() => import('./components/SchoolUniformManagement'));
const SchoolTransportManagement = React.lazy(() => import('./components/SchoolTransportManagement'));
const LibraryPortal = React.lazy(() => import('./components/LibraryPortal'));
const InventoryManagementPortal = React.lazy(() => import('./components/inventory/InventoryManagementPortal'));
const FixedAssetsPortal = React.lazy(() => import('./components/assets/FixedAssetsPortal'));
import EnterpriseProcurementQualityAudit from './certification/EnterpriseProcurementQualityAudit';
import ModernSchoolDashboard from './components/ModernSchoolDashboard';
const AuditLogsPortal = React.lazy(() => import('./modules/audit/presentation/AuditLogsPortal'));
import { PermissionsManagementModule, DEFAULT_ROLES, INITIAL_USERS } from './components/PermissionsManagementModule';
import EnterpriseCoreCertificationDashboard from './certification/EnterpriseCoreCertificationDashboard';
import EnterpriseBusinessLogicAudit from './certification/EnterpriseBusinessLogicAudit';
import AccountingIntegrityCertification from './certification/AccountingIntegrityCertification';
import EnterpriseSecurityPermissionsCert from './certification/EnterpriseSecurityPermissionsCert';
import EnterpriseUIUXGoldenStandardCert from './certification/EnterpriseUIUXGoldenStandardCert';
import EnterprisePerformanceStabilityCertification from './certification/EnterprisePerformanceStabilityCertification';
import EnterpriseMaintainabilityScalabilityCertification from './certification/EnterpriseMaintainabilityScalabilityCertification';
import EnterpriseZeroRegressionCert from './certification/EnterpriseZeroRegressionCert';
import EnterpriseProductionReadinessGate from './certification/EnterpriseProductionReadinessGate';
import EnterpriseDocumentationHardening from './certification/EnterpriseDocumentationHardening';
import EnterpriseWave1FinalCertification from './certification/EnterpriseWave1FinalCertification';
import EnterpriseCommercialReleaseQualityCertification from './certification/EnterpriseCommercialReleaseQualityCertification';
import EnterpriseCommercialCompetitivenessCertification from './certification/EnterpriseCommercialCompetitivenessCertification';
import EnterpriseProductMaturityCertification from './certification/EnterpriseProductMaturityCertification';
import EnterpriseCoreSystemCertification from './certification/EnterpriseCoreSystemCertification';
import EnterpriseOperationalExcellenceCertification from './certification/EnterpriseOperationalExcellenceCertification';
import EnterpriseUserTrustCertification from './certification/EnterpriseUserTrustCertification';
import EnterpriseGoldenReleaseExecutionProgram from './certification/EnterpriseGoldenReleaseExecutionProgram';
import EnterpriseDDDReconstruction from './certification/EnterpriseDDDReconstruction';
import SystemSettingsPortal from './components/SystemSettingsPortal';
import { 
  branchesSeed, 
  teachersSeed, 
  employeesSeed, 
  examTemplates, 
  initialAttendance, 
  invoicesSeed, 
  inventorySeed, 
  auditLogsSeed, 
  defaultPermissions,
  supabaseSchemaSQL,
  initialSupabaseConfig,
  classesSeed,
  stagesSeed,
  gradesSeed,
  academicClassesSeed,
  costCentersSeed
} from './database/seed/mockData';
import { StudentRepository as StudentApiRepository } from './components/student-affairs/repository/StudentRepository';
import { AuditRepository } from './database/repositories/AuditRepository';
import { FallbackStorage } from './database/repositories/FallbackStorage';
import { 
  School, 
  Branch, 
  Student, 
  Teacher, 
  Employee, 
  Invoice, 
  InventoryItem, 
  AuditLog, 
  UserRole, 
  Permission, 
  SchoolClass,
  Stage,
  Grade,
  AcademicClass,
  CostCenter
} from './types';
import { TransactionService } from './database/transactions/TransactionService';
import { useCurrency, saveCurrencyConfig, formatAmount } from './utils/currency';
import { TrustedSessionManager, TrustedSessionUser } from './middleware/trustedSessionManager';
import { canAccessSection } from './authorization/ClientAuthorization';
import { PERMISSIONS } from './authorization/PermissionRegistry';

const UNRESOLVED_SCHOOL: School = {
  id: '',
  name: 'بيانات المدرسة غير متاحة',
  logo: '🏫',
  type: 'private',
  licenseNumber: '',
  address: '',
  phone: '',
  email: '',
  academicYear: '',
  status: 'frozen'
};

function hasTrustedPlatformAdminAccess(user: TrustedSessionUser | null | undefined): boolean {
  if (Array.isArray(user?.platformPermissions)) {
    return user.platformPermissions.includes(PERMISSIONS.PLATFORM_ADMIN);
  }
  // Backward-compatible fallback for legacy SuperAdmin sessions issued before
  // the platform permission projection was added to the trusted session.
  return user?.role === 'SuperAdmin';
}

// Bulletproof copy-to-clipboard function supporting sandboxed frames and secure/non-secure origins
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err: any) {
      EnterpriseLogger.warn('Clipboard API failed, trying fallback...', "App", { details: err });
    }
  }

  // Fallback to traditional execCommand method
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Prevent scrolling and position offscreen
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
    EnterpriseLogger.error('Fallback copying failed:', "App", { error: err });
    document.body.removeChild(textArea);
    return false;
  }
};

export default function App() {
  const { currencyConfig, format: formatCurrency, saveCurrency } = useCurrency();
  const sessionManager = useMemo(() => new TrustedSessionManager(window.localStorage, window.sessionStorage), []);
  const [passwordRecovery, setPasswordRecovery] = useState<{ accessToken: string; refreshToken: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hash.get('type') !== 'recovery' || !hash.get('access_token')) return null;
    return {
      accessToken: hash.get('access_token') || '',
      refreshToken: hash.get('refresh_token') || ''
    };
  });
  
  // Theme Engine (Dark / Light Mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return storageService.getItem<'light' | 'dark'>('theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    storageService.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    triggerNotification(
      nextTheme === 'dark' ? 'تم تفعيل الوضع الداكن الهادئ 🌙' : 'تم تفعيل الوضع الفاتح المشرق ☀️',
      'info'
    );
  };

  // Multi-Tenant Core State
  const [selectedSchool, setSelectedSchool] = useState<School>(UNRESOLVED_SCHOOL);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('SchoolAdmin');
  const [trustedSessionUser, setTrustedSessionUser] = useState<TrustedSessionUser | null>(null);

  // Portal & Session Separation
  const [currentPortal, setCurrentPortalState] = useState<'login' | 'school' | 'admin'>('login');
  const setCurrentPortal = (val: 'login' | 'school' | 'admin') => {
    setCurrentPortalState(val);
  };

  // Client Mode isolation detector
  const isClientMode = useMemo(() => {
    if (hasTrustedPlatformAdminAccess(trustedSessionUser)) return false;
    if (currentPortal === 'school') return true;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const schoolParam = params.get('school') || params.get('tenant') || params.get('schoolId');
      if (schoolParam) return true;
    }
    return false;
  }, [currentPortal, trustedSessionUser]);

  const checkSectionPermission = (sectionId: string): boolean => canAccessSection(
    trustedSessionUser,
    sectionId,
    { currentPortal }
  );

  const canUseTrustedPermission = (permission: string): boolean => {
    if (!Array.isArray(trustedSessionUser?.permissions)) return false;
    return trustedSessionUser.permissions.includes('*') || trustedSessionUser.permissions.includes(permission);
  };

  const renderAccessDenied = (sectionId: string) => {
    const isCentralAdminSection = sectionId.startsWith('super_') || [
      'system_health', 'db_schema', 'core_certification', 'business_logic_audit', 
      'accounting_integrity', 'security_permissions_cert', 'uiux_golden_standard_cert', 
      'performance_stability_cert', 'maintainability_scalability_cert', 'zero_regression_cert', 
      'production_readiness_gate', 'docs_hardening', 'wave1_certification', 
      'core_system_cert', 'operational_excellence_cert', 'user_trust_cert', 
      'commercial_release', 'commercial_competitiveness', 'product_maturity', 
      'golden_release_exec', 'ddd_reconstruction'
    ].includes(sectionId);

    if (isCentralAdminSection && isClientMode) {
      return (
        <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-900 text-white rounded-3xl border border-rose-900/60 shadow-2xl m-4" dir="rtl">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center bg-rose-950/80 rounded-3xl border border-rose-800/80 shadow-xl">
              <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
              <LockIcon className="absolute -top-1 -right-1 w-6 h-6 text-amber-400 bg-slate-950 rounded-full p-1 border border-amber-500/50" />
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono font-black tracking-widest text-rose-400 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-900/60">
                403 FORBIDDEN • CENTRAL_ADMIN_ROUTE
              </span>
              <h2 className="text-xl font-black text-white">مسار مخصص للإدارة المركزية فقط</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                هذه الشاشة مخصصة للإدارة المركزية للمنظومة (SuperAdmin). تم توجيهك إلى شاشة الأمان لأن هذا المسار غير متاح للوصول المباشر من منصة المدرسة.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => setActiveSection('dashboard')}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-lg hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/30"
              >
                <span>العودة للوحة تحكم المدرسة 🏠</span>
              </button>

              {checkSectionPermission('super_dashboard') && (
                <button
                  onClick={() => {
                    setIsSuperAdminPortalActive(true);
                    setCurrentPortal('admin');
                    setActiveSection('super_dashboard');
                    triggerNotification('تم الانتقال إلى لوحة التحكم للإدارة المركزية 🚀', 'success');
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3 rounded-xl transition-all border border-slate-700 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>دخول لوحة الإدارة المركزية (SuperAdmin) 🏛️</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    const sectionNames: Record<string, string> = {
      'dashboard': 'لوحة التحكم العامة',
      'ai_assistant': 'المساعد الذكي (AI)',
      'branches': 'إدارة الفروع والمدارس',
      'students': 'شؤون الطلاب',
      'parents': 'أولياء الأمور',
      'attendance': 'الحضور والانصراف',
      'exams': 'الامتحانات والنتائج',
      'library': 'المكتبة المدرسية',
      'teachers': 'المعلمون والموظفون',
      'accounts': 'الحسابات العامة',
      'treasury': 'الحسابات العامة — الخزينة والمدفوعات البنكية',
      'financial_reports': 'التقارير المالية',
      'student_accounts': 'الرسوم والأقساط',
      'inventory': 'إدارة المخزون والعهد',
      'buses': 'باصات النقل والمواصلات',
      'school_transport': 'إدارة النقل والترحيل المدرسي',
      'uniform_management': 'إدارة الزي والملابس المدرسية',
      'school_uniform': 'إدارة الزي المدرسي',
      'audit_logs': 'سجلات الرقابة والعمليات',
      'general_review': 'المراجعة العامة — قيد التجهيز',
      'permissions_admin': 'المستخدمون والصلاحيات',
      'system_health': 'مركز مراقبة أداء النظام',
      'db_schema': 'مخطط Supabase SQL'
    };
    const sectionName = sectionNames[sectionId] || sectionId;

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs" dir="rtl">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-rose-50 dark:bg-rose-950/30 rounded-3xl border border-rose-100 dark:border-rose-900/50 animate-pulse">
            <LockIcon className="w-12 h-12 text-rose-600 dark:text-rose-400" />
            <Shield className="absolute -top-1 -right-1 w-6 h-6 text-indigo-600 bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm" />
          </div>
          
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-900/30">أمن النظام والحوكمة (RBAC)</span>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">عذراً، صلاحياتك غير كافية للدخول</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              حسابك الحالي لا يمتلك الصلاحيات الأمنية المطلوبة للوصول إلى شاشة <span className="font-bold text-indigo-600 dark:text-indigo-400">"{sectionName}"</span>. يرجى مراجعة إدارة المدرسة لمنح الصلاحية المطلوب.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-right text-xs space-y-2.5 shadow-2xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-400">
              <span className="font-bold">تفاصيل طلب الصلاحية:</span>
              <span className="font-mono text-[10px]">CODE: 403_FORBIDDEN</span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>الدور الحادث:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {currentRole === 'SchoolAdmin' ? 'مدير المدرسة' :
                 currentRole === 'Teacher' ? 'معلم / أكاديمي' :
                 currentRole === 'Accountant' ? 'محاسب مالي' :
                 currentRole === 'Parent' ? 'ولي أمر' : currentRole}
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setActiveSection('dashboard')}
              className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              العودة للوحة المدرسة الرئيسية 🏠
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Login flow state is intentionally limited to the portal mode. Identity,
  // role, school, and branch are all supplied by the trusted server session.
  const [loginPortalMode, setLoginPortalMode] = useState<'school' | 'gateway'>('school');
  
  useEffect(() => {
    if (trustedSessionUser?.schoolId && selectedSchool.id === trustedSessionUser.schoolId) {
      localStorage.setItem('active_school_id', selectedSchool.id);
      window.dispatchEvent(new Event('active_school_changed'));
      return;
    }
    localStorage.removeItem('active_school_id');
  }, [selectedSchool, trustedSessionUser?.schoolId]);

  // The central school catalogue is empty until a canonical, authorized
  // source hydrates it. Local seed records must never define tenant scope.
  const [saasSchools, setSaasSchools] = useState<any[]>([]);

  const applyTrustedSessionUser = useCallback((user: TrustedSessionUser): School => {
    const trustedSchool = user.school && user.school.id === user.schoolId ? user.school : null;
    const validRoles: UserRole[] = ['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Accountant', 'Parent', 'Control', 'Auditor', 'Student'];
    if (!trustedSchool || !validRoles.includes(user.role as UserRole)) {
      throw new Error('Invalid trusted session identity');
    }

    const targetSchool: School = {
      id: trustedSchool.id,
      name: trustedSchool.name,
      logo: trustedSchool.logo,
      type: trustedSchool.type,
      licenseNumber: trustedSchool.licenseNumber,
      address: trustedSchool.address,
      phone: trustedSchool.phone,
      email: trustedSchool.email,
      academicYear: trustedSchool.academicYear || user.academicYear || '',
      status: trustedSchool.status,
      connectedDb: trustedSchool.connectedDb
    };

    const trustedRole = user.role as UserRole;
    const hasPlatformAdmin = hasTrustedPlatformAdminAccess(user);
    setTrustedSessionUser(user);
    setSelectedSchool(targetSchool);
    setCurrentRole(hasPlatformAdmin ? 'SuperAdmin' : trustedRole);
    const trustedBranch = user.branch && user.branch.schoolId === user.schoolId
      ? { id: user.branch.id, schoolId: user.branch.schoolId, name: user.branch.name, city: user.branch.city, manager: '', studentCount: 0, teacherCount: 0 }
      : null;
    setSelectedBranch(trustedBranch);
    setIsSuperAdminPortalActive(hasPlatformAdmin);
    setActiveSection(hasPlatformAdmin ? 'super_stats' : 'dashboard');
    return targetSchool;
  }, []);

  // MANDATORY SECURITY GATEWAY GUARD: Protect all school pages & routes against unauthorized access
  useEffect(() => {
    if (currentPortal === 'school' || currentPortal === 'admin') {
      if (!sessionManager.getAccessToken()) {
        setCurrentPortal('login');
        setLoginPortalMode('school');
        setIsSuperAdminPortalActive(false);
        setActiveSection('login');
        return;
      }

      sessionManager.restore()
        .catch(() => {
          sessionManager.logout();
          setCurrentPortal('login');
          setLoginPortalMode('school');
          setIsSuperAdminPortalActive(false);
          setActiveSection('login');
        });
    }
  }, [currentPortal, selectedSchool, sessionManager]);

  // Restore a session only after the backend re-verifies the Supabase token and identity.
  useEffect(() => {
    if (!sessionManager.getAccessToken()) return;

    sessionManager.restore()
      .then(user => {
        applyTrustedSessionUser(user);
        setCurrentPortal(hasTrustedPlatformAdminAccess(user) ? 'admin' : 'school');
      })
      .catch(() => {
        sessionManager.logout();
        setCurrentPortal('login');
        setLoginPortalMode('school');
        setIsSuperAdminPortalActive(false);
        setActiveSection('login');
      });
  }, [applyTrustedSessionUser, saasSchools, sessionManager]);

  // App General Navigation
  const [isSuperAdminPortalActive, setIsSuperAdminPortalActive] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('super_dashboard');

  // Student Affairs owns its canonical paginated read. Do not hydrate the
  // shared collection here as well: doing so duplicates GET /api/students
  // during navigation and can overlap the server transaction context.
  useEffect(() => {
    if (activeSection !== 'students' ||
      !canAccessSection(trustedSessionUser, 'students', { currentPortal })) {
      return;
    }
    return undefined;
  }, [activeSection, currentPortal, trustedSessionUser]);

  // A trusted non-SuperAdmin identity must always land on the school dashboard.
  // Do not rely only on the portal flag here: the central login form can finish
  // with a school-scoped role while the portal state is still settling, leaving
  // the initial `super_dashboard` route visible and producing a false 403.
  useEffect(() => {
    if (!hasTrustedPlatformAdminAccess(trustedSessionUser) && (activeSection.startsWith('super_') || activeSection === 'system_health' || activeSection === 'db_schema')) {
      setActiveSection('dashboard');
    }
  }, [trustedSessionUser, activeSection]);

  // Shared Central Permissions and Users states (Single Source of Truth)
  const [simulatedUsers, setSimulatedUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('erp_users_list_v1');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [roles, setRoles] = useState<any[]>(() => {
    const saved = localStorage.getItem('erp_roles_list_v1');
    return saved ? JSON.parse(saved) : DEFAULT_ROLES;
  });

  const [permissionsAuditLog, setPermissionsAuditLog] = useState<any[]>(() => {
    const saved = localStorage.getItem('erp_permissions_audit_log_v1');
    return saved ? JSON.parse(saved) : [
      { id: 'audit_0', modifier: 'سليمان غازي', targetUser: 'منصور خلف', date: '2026-06-30 08:30:12', action: 'إنشاء حساب وتخصيص صلاحيات ترحيل الحسابات العامة' },
      { id: 'audit_1', modifier: 'سليمان غازي', targetUser: 'سالم الوحيشي', date: '2026-06-30 09:15:44', action: 'منح صلاحيات التدقيق المالي وعرض ميزان المراجعة' }
    ];
  });

  const [drillDownUser, setDrillDownUser] = useState<any>(() => {
    const saved = localStorage.getItem('erp_users_list_v1');
    const initial = saved ? JSON.parse(saved) : INITIAL_USERS;
    return initial[0];
  });
  const [gatewaySearchQuery, setGatewaySearchQuery] = useState<string>('');
  const [gatewayCategory, setGatewayCategory] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'rbac' | 'currency' | 'comprehensive'>('comprehensive');
  const [currencyForm, setCurrencyForm] = useState<any>(currencyConfig);
  
  useEffect(() => {
    setCurrencyForm(currencyConfig);
  }, [currencyConfig]);

  // Branch dynamic list state
  const [branches, setBranches] = useState<any[]>(branchesSeed);

  // Supabase Configuration State
  const [supabaseConfig, setSupabaseConfig] = useState(initialSupabaseConfig);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempUrl, setTempUrl] = useState(initialSupabaseConfig.url);
  const [tempKey, setTempKey] = useState(initialSupabaseConfig.anonKey);

  // Student Affairs is database-backed. The shell starts empty and the portal
  // hydrates this collection from the authenticated server session.
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>(teachersSeed);
  const [employees, setEmployees] = useState<Employee[]>(employeesSeed);
  const [invoices, setInvoices] = useState<Invoice[]>(invoicesSeed);
  const [inventory, setInventory] = useState<InventoryItem[]>(inventorySeed);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(auditLogsSeed);
  const [attendance, setAttendance] = useState(initialAttendance);

  // Multi-Stage Academic & Cost Centers States
  const [stages, setStages] = useState<Stage[]>(stagesSeed);
  const [grades, setGrades] = useState<Grade[]>(gradesSeed);
  const [academicClasses, setAcademicClasses] = useState<AcademicClass[]>(academicClassesSeed);
  const [costCenters, setCostCenters] = useState<CostCenter[]>(costCentersSeed);

  // Expanded Student Enterprise States
  const [selectedStudentEnterpriseId, setSelectedStudentEnterpriseId] = useState<string>('stud_1');
  const [activeStudentTab, setActiveStudentTab] = useState<string>('gap_analysis');
  const [autosaveIndicator, setAutosaveIndicator] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [softDeletedStudentIds, setSoftDeletedStudentIds] = useState<string[]>([]);
  const [showSoftTrashOnly, setShowSoftTrashOnly] = useState<boolean>(false);
  const [gateBarcodeSimulatorVal, setGateBarcodeSimulatorVal] = useState<string>('stud_1');
  const [gateScanDirection, setGateScanDirection] = useState<'check_in' | 'check_out'>('check_in');
  const [attendanceSmsLog, setAttendanceSmsLog] = useState<{timestamp: string; phone: string; message: string}[]>([]);
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);
  const [newDocumentCategory, setNewDocumentCategory] = useState<'national_id' | 'passport' | 'birth_cert' | 'transcript' | 'medical'>('national_id');
  const [newDocumentFileName, setNewDocumentFileName] = useState<string>('');
  
  // States corresponding to the uploaded screenshot
  const [admissionsSubTab, setAdmissionsSubTab] = useState<'general' | 'medical' | 'attachments'>('general');
  const [selectedInterfaceMode, setSelectedInterfaceMode] = useState<'advanced' | 'standard'>('advanced');
  const [selectedThemeName, setSelectedThemeName] = useState<'premium' | 'classic' | 'modern'>('premium');
  const [admissionsFormEditable, setAdmissionsFormEditable] = useState<boolean>(true);
  const [admissionsSearchTerm, setAdmissionsSearchTerm] = useState<string>('');

  // Uniform & Dress Code Management States
  const [showUniformModal, setShowUniformModal] = useState<boolean>(false);
  const [uniformInventory, setUniformInventory] = useState([
    { id: 'uni_1', name: 'زي مدرسي بنين - أساسي (كافة المقاسات)', category: 'بنين', size: 'M, L, XL', stock: 140, price: 45, alertLimit: 20 },
    { id: 'uni_2', name: 'زي مدرسي بنات - أساسي (كافة المقاسات)', category: 'بنات', size: 'S, M, L', stock: 185, price: 45, alertLimit: 25 },
    { id: 'uni_3', name: 'بدلة رياضة مدرسية - بنين وبنات', category: 'رياضة', size: 'S, M, L, XL', stock: 95, price: 35, alertLimit: 15 },
    { id: 'uni_4', name: 'سترة شتوية فاخرة (Blazer) - ثانوي', category: 'شتاء', size: 'M, L, XL', stock: 60, price: 120, alertLimit: 10 },
    { id: 'uni_5', name: 'قميص قطني إضافي - أبيض ناصع', category: 'قمصان', size: 'S, M, L', stock: 210, price: 15, alertLimit: 30 }
  ]);
  const [selectedUniformToAllocate, setSelectedUniformToAllocate] = useState<string>('uni_1');
  const [allocateToStudentId, setAllocateToStudentId] = useState<string>('stud_1');
  const [allocateUniformSize, setAllocateUniformSize] = useState<string>('M');
  const [allocateUniformQty, setAllocateUniformQty] = useState<number>(1);
  const [uniformAllocationHistory, setUniformAllocationHistory] = useState([
    { id: 'alloc_1', studentName: 'أحمد محمود العريبي', uniformName: 'زي مدرسي بنين - أساسي (كافة المقاسات)', size: 'L', date: '2026-05-15', qty: 1, total: 45 },
    { id: 'alloc_2', studentName: 'فاطمة محمد الورفلي', uniformName: 'زي مدرسي بنات - أساسي (كافة المقاسات)', size: 'M', date: '2026-05-18', qty: 1, total: 45 },
    { id: 'alloc_3', studentName: 'عبد الرحمن صالح التاجوري', uniformName: 'سترة شتوية فاخرة (Blazer) - ثانوي', size: 'XL', date: '2026-05-20', qty: 1, total: 120 }
  ]);
  
  // Simulated school subjects/grades state specifically for the academcial tab
  const [academicGrades, setAcademicGrades] = useState<{ [studentId: string]: { subject: string; score: number; maxScore: number; behaviorRating: 'ممتاز' | 'جيد جداً' | 'مقبول' | 'يحتاج توجيه'; achievements: string[] }[] }>({
    'stud_1': [
      { subject: 'الرياضيات المتقدمة', score: 48, maxScore: 50, behaviorRating: 'ممتاز', achievements: ['دروع التميز الرياضي 🏆', 'أولمبياد العلوم'] },
      { subject: 'الفيزياء الكونية', score: 92, maxScore: 100, behaviorRating: 'ممتاز', achievements: ['مبتكر الغد الأخضر 🌱'] },
      { subject: 'اللغة العربية والإنشاء', score: 28, maxScore: 30, behaviorRating: 'ممتاز', achievements: ['مسابقة الخط العربي'] }
    ],
    'stud_2': [
      { subject: 'الرياضيات المتقدمة', score: 45, maxScore: 50, behaviorRating: 'ممتاز', achievements: ['أداء مثالي فرعي'] },
      { subject: 'الفيزياء الكونية', score: 85, maxScore: 100, behaviorRating: 'جيد جداً', achievements: [] },
      { subject: 'اللغة العربية والإنشاء', score: 29, maxScore: 30, behaviorRating: 'ممتاز', achievements: ['حافظ القرآن الكريم'] }
    ],
    'stud_3': [
      { subject: 'العلوم العامة', score: 25, maxScore: 30, behaviorRating: 'جيد جداً', achievements: ['المعرض العلمي السنوي'] },
      { subject: 'اللغة العربية', score: 27, maxScore: 30, behaviorRating: 'ممتاز', achievements: [] }
    ]
  });

  // Synchronized Transactions log history state
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Note: TransactionService now handles the backend/UoW orchestration. 
  // UI history needs a new mechanism or to be connected to the audit logs.

  const [permissions, setPermissions] = useState<Permission[]>(defaultPermissions);

  // Filtering lists by Tenant (Active School & Branch)
  const filteredStudents = useMemo(() => {
    return students.filter(s => s.schoolId === selectedSchool.id && (!selectedBranch || s.branchId === selectedBranch.id));
  }, [students, selectedSchool, selectedBranch]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => t.schoolId === selectedSchool.id && (!selectedBranch || t.branchId === selectedBranch.id));
  }, [teachers, selectedSchool, selectedBranch]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => i.schoolId === selectedSchool.id && (!selectedBranch || i.branchId === selectedBranch.id));
  }, [inventory, selectedSchool, selectedBranch]);


  // Notifications State
  const [notifications, setNotifications] = useState([
    { id: '1', text: 'تم إجراء مزامنة تلقائية ناجحة للبيانات مع مستودع Supabase السحابي', time: 'منذ دقيقة', type: 'success' as const },
    { id: '2', text: 'تنبيه لقرب نفاذ مخزون الزي المدرسي والكتب المعتمدة للمرحلة الابتدائية', time: 'منذ ١٢ دقيقة', type: 'warning' as const },
    { id: '3', text: 'تم مراجعة الميزانية وإصدار التقارير الضريبية السنوية لمدير النظام المعين', time: 'منذ ساعة', type: 'info' as const }
  ]);

  // Form states for creating/editing records
  const [showSmartHeader, setShowSmartHeader] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    nationalId: '',
    classroom: 'الصف الأول الثانوي',
    section: 'أ',
    parentName: '',
    parentPhone: '',
    feesPaid: 0,
    feesRemaining: 0,
    status: 'active' as const
  });

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    studentId: '',
    amount: 5000,
    item: 'رسوم الفصل الدراسي الأول المقسطة',
    dueDate: '2026-11-01',
    status: 'unpaid' as const
  });

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    specialization: 'الرياضيات',
    email: '',
    phone: '',
    salary: 12000,
    status: 'active' as const,
    assignedClasses: 'الصف الأول الثانوي'
  });

  const backupLogs: string[] = [];
  const isBackingUp = false;

  // Active searching terms
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');

  // Student Accounts Custom States
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('بطاقة مدى البنكية (Mada)');

  // Top Statistics based on filtered records
  const statsOverview = useMemo(() => {
    const totalSCount = filteredStudents.length;
    const totalTCount = filteredTeachers.length;
    const totalFeesCollected = filteredStudents.reduce((sum, s) => sum + Number(s.feesPaid || 0), 0);
    const activeStaffCount = filteredTeachers.filter(t => t.status === 'active').length;
    const avgAttendance = 0;

    return {
      totalStudents: totalSCount,
      totalTeachers: totalTCount,
      totalAttendance: avgAttendance,
      collectedFees: totalFeesCollected,
      activeStaff: activeStaffCount
    };
  }, [filteredStudents, filteredTeachers]);

  // Handle active school change, reset specific branch filter
  const handleSchoolChange = (school: School) => {
    setSelectedSchool(school);
    const relatedBranches = branches.filter(b => b.schoolId === school.id);
    if (relatedBranches.length > 0) {
      setSelectedBranch(relatedBranches[0]);
    } else {
      setSelectedBranch(null);
    }
    
    // Log the tenant switch
    logAction('SWAP_TENANT', `تم تبديل السحابة النشطة للمستأجر: ${school.name}`, 'شؤون النظام');
  };

  const handleBranchChange = (branch: Branch | null) => {
    setSelectedBranch(branch);
    logAction('SWAP_BRANCH', branch ? `تم تصفية العرض للفرع: ${branch.name}` : 'تم إزالة فلتر الفروع وعرض الإحصائيات المشتركة', 'شؤون النظام');
  };

  const logAction = (action: string, details: string, module: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      schoolId: selectedSchool.id,
      timestamp: new Date().toISOString(),
      userId: 'user_001',
      userName: 'سليمان غازي',
      userRole: currentRole,
      action,
      module,
      ipAddress: '192.168.1.144',
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Helper to trigger automated notifications occasionally
  const triggerNotification = async (arg1: string, arg2: string, arg3?: 'info' | 'warning' | 'success' | 'error') => {
    let message = arg1;
    let type = arg2 as NotificationType;
    let title = undefined;

    if (arg3) {
      title = arg1;
      message = arg2;
      type = arg3 as NotificationType;
    }

    await NotificationEngine.notify({
      message: title ? `${title}: ${message}` : message,
      type: type,
      channels: ['ui']
    }, (msg, t) => {
      setNotifications(prev => [
        { id: Date.now().toString(), text: msg, time: 'الآن', type: t },
        ...prev
      ]);
    });
  };

  // Portal Authentication Controllers
  const authenticateAndOpenSession = async (identifier: string, password: string, rememberMe = true) => {
    if (!identifier.trim() || !password) {
      triggerNotification('يرجى إدخال بيانات الدخول كاملة', 'warning');
      return;
    }

    try {
      const user = await sessionManager.login(identifier, password, rememberMe);
      const targetSchool = applyTrustedSessionUser(user);
      setCurrentPortal(hasTrustedPlatformAdminAccess(user) ? 'admin' : 'school');

      logAction('PORTAL_LOGIN', `تم تسجيل الدخول الموثوق إلى ${targetSchool.name}`, 'المصادقة والأمان');
      triggerNotification(`تم تسجيل الدخول إلى ${targetSchool.name} بنجاح`, 'success');
    } catch {
      sessionManager.logout();
      triggerNotification('بيانات الدخول غير صحيحة أو أن الحساب غير متاح', 'warning');
    }
  };

  const handleSchoolLogin = (username: string, password: string, rememberMe = true) => {
    return authenticateAndOpenSession(username, password, rememberMe);
  };

  const handleForgotPassword = async (identifier: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر إرسال رابط الاستعادة.');
      triggerNotification('إذا كانت البيانات صحيحة فسيتم إرسال رابط الاستعادة بأمان. الرابط صالح لمدة 60 دقيقة.', 'success');
      return true;
    } catch (error: any) {
      triggerNotification('تعذر إرسال رابط الاستعادة.', 'warning');
      return false;
    }
  };

  const handleAdminLogin = (username: string, password: string) => {
    void authenticateAndOpenSession(username, password);
  };

  const handleLogout = async () => {
    // Revoke the server-side Supabase Auth session before clearing local state.
    // Local logout still runs when the network is unavailable so protected UI
    // cannot remain accessible from the current browser context.
    const accessToken = sessionManager.getAccessToken();
    if (accessToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } catch {
        // The local session is still cleared below; no internal error is shown.
      }
    }

    // Terminate Session, clear Tokens and Auth cache
    sessionManager.logout();
    setTrustedSessionUser(null);
    localStorage.removeItem('impersonation_active');
    localStorage.removeItem('impersonated_school_id');
    localStorage.removeItem('impersonated_school_name');
    localStorage.removeItem('impersonation_reason');
    
    // Redirect user strictly to mandatory school Login Screen
    setCurrentPortal('login');
    setLoginPortalMode('school');
    setIsSuperAdminPortalActive(false);
    setCurrentRole('SchoolAdmin');
    setActiveSection('login');

    // Prevent browser back button navigation to protected screens
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.pathname + (selectedSchool ? `?school=${selectedSchool.subdomain || selectedSchool.id}` : ''));
    }

    logAction('PORTAL_LOGOUT', `تم إنهاء الجلسة وإغلاق التوكن لـ ${selectedSchool?.name || 'المدرسة'}`, 'المصادقة والأمان');
    triggerNotification('تم تسجيل الخروج بنجاح وإغلاق التوكن. الجلسة منتهية ولا يمكن الرجوع بالمتصفح.', 'info');
  };

  // Enterprise Student Affairs Helper Methods
  const updateStudentField = (studentId: string, field: string, value: any) => {
    // Implement autosave simulation
    setAutosaveIndicator('saving');
    
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return { ...s, [field]: value };
      }
      return s;
    }));

    // Reset indicator after a brief simulated delay
    setTimeout(() => {
      setAutosaveIndicator('saved');
      setTimeout(() => setAutosaveIndicator('idle'), 1500);
    }, 800);
  };

  const handleEnterpriseSoftDelete = async (id: string, name: string) => {
    try {
      await StudentApiRepository.softDeleteStudent(id);
      setSoftDeletedStudentIds(prev => [...prev, id]);
      setStudents(prev => prev.filter(student => student.id !== id));
      logAction('SOFT_DELETE', `أرشفة الطالب مؤقتاً: ${name}`, 'شؤون الطلاب');
      await triggerNotification(`تم نقل ملف الطالب ${name} إلى سلة المحذوفات المؤقتة`, 'warning');
    } catch (error: any) {
      await triggerNotification(error?.message || 'تعذر أرشفة الطالب من قاعدة البيانات.', 'warning');
    }
  };

  const handleEnterpriseRestore = async (id: string, name: string) => {
    try {
      await StudentApiRepository.restoreStudent(id);
      setSoftDeletedStudentIds(prev => prev.filter(item => item !== id));
      logAction('RESTORE_STUDENT', `استعادة قيد الطالب النشط: ${name}`, 'شؤون الطلاب');
      await triggerNotification(`تم تعافي قيد الطالب ${name} وإعادة تفعيله بنشاط`, 'success');
    } catch (error: any) {
      await triggerNotification(error?.message || 'تعذر استعادة الطالب من قاعدة البيانات.', 'warning');
    }
  };

  const handleEnterpriseSave = async (student: Student) => {
    try {
      const response = await StudentApiRepository.saveStudent({ ...student, schoolId: undefined, tenantId: undefined });
      const persistedStudent = response?.data?.student || response?.student;
      if (!persistedStudent) throw new Error('لم يُرجع الخادم سجل الطالب بعد الحفظ.');
      setStudents(prev => prev.map(current => current.id === student.id ? persistedStudent : current));
      logAction('COMMIT_STUDENT', `حفظ المعاملات واعتماد ملف الطالب: ${student.name}`, 'شؤون الطلاب');
      await triggerNotification(`تم ترحيل وحفظ بيانات الطالب ${student.name} بالكامل`, 'success');
    } catch (error: any) {
      await triggerNotification(error?.message || 'تعذر حفظ ملف الطالب في قاعدة البيانات.', 'warning');
    }
  };

  // Student Actions
  const handleStudentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let guardianUpdateResult: any = null;
    
    try {
      if (editingStudent && (
        studentForm.parentName !== editingStudent.parentName ||
        studentForm.parentPhone !== editingStudent.parentPhone
      )) {
        const guardianId = (editingStudent as any).guardianId;
        const guardianVersion = (editingStudent as any).guardianVersion;
        const relationshipVersion = (editingStudent as any).guardianRelationshipVersion;
        if (!guardianId || !Number.isInteger(Number(guardianVersion)) || !Number.isInteger(Number(relationshipVersion))) {
          throw new Error('تعذر تحديث ولي الأمر لأن بيانات الإصدار الكانوني غير موجودة. أعد تحميل سجل الطالب ثم حاول مرة أخرى.');
        }
        const parts = studentForm.parentName.trim().split(/\s+/).filter(Boolean);
        if (parts.length < 2 || !studentForm.parentPhone.trim()) {
          throw new Error('يجب إدخال اسم ولي الأمر واسم العائلة ورقم الهاتف.');
        }
        guardianUpdateResult = await StudentApiRepository.updateGuardian(editingStudent.id, {
          guardianId,
          expectedGuardianVersion: guardianVersion,
          expectedRelationshipVersion: relationshipVersion,
          legalFirstName: parts[0],
          legalMiddleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : null,
          legalLastName: parts[parts.length - 1],
          phone: studentForm.parentPhone.trim()
        });
      }
      const response = await StudentApiRepository.saveStudent({
        ...(editingStudent ? { id: editingStudent.id, version: editingStudent.version } : {}),
        name: studentForm.name,
        nationalId: studentForm.nationalId,
        classroom: studentForm.classroom,
        section: studentForm.section,
        ...(editingStudent ? {} : {
          parentName: studentForm.parentName,
          parentPhone: studentForm.parentPhone
        }),
        feesPaid: Number(studentForm.feesPaid),
        feesRemaining: Number(studentForm.feesRemaining),
        status: studentForm.status
      });
      const persistedStudent = response?.data?.student || response?.student;
      if (!persistedStudent) throw new Error('لم يُرجع الخادم سجل الطالب بعد الحفظ.');
      if (editingStudent) {
        const updatedGuardian = guardianUpdateResult?.data?.guardian;
        const mergedStudent = updatedGuardian ? {
          ...persistedStudent,
          parentName: studentForm.parentName,
          parentPhone: studentForm.parentPhone,
          guardianId: updatedGuardian.guardianId,
          guardianVersion: updatedGuardian.guardianVersion,
          guardianRelationshipId: updatedGuardian.relationshipId,
          guardianRelationshipVersion: updatedGuardian.relationshipVersion
        } : persistedStudent;
        setStudents(prev => prev.map(s => s.id === editingStudent.id ? mergedStudent : s));
        logAction('UPDATE_STUDENT', `تم تحديث ملف الطالب: ${studentForm.name}`, 'شؤون الطلاب');
        await triggerNotification(`تم تحديث بيانات الطالب ${studentForm.name} بنجاح`, 'success');
      } else {
        setStudents(prev => [persistedStudent, ...prev]);
        logAction('CREATE_STUDENT', `إضافة طالب جديد: ${persistedStudent.name}`, 'شؤون الطلاب');
        await triggerNotification(`تم تسجيل الطالب الجديد ${persistedStudent.name}`, 'success');
      }
    } catch (error: any) {
      await triggerNotification(error?.message || 'تعذر حفظ الطالب في قاعدة البيانات.', 'warning');
      return;
    }
    
    // Reset form
    setStudentForm({
      name: '',
      nationalId: '',
      classroom: 'الصف الأول الثانوي',
      section: 'أ',
      parentName: '',
      parentPhone: '',
      feesPaid: 0,
      feesRemaining: 0,
      status: 'active'
    });
    setEditingStudent(null);
    setShowStudentModal(false);
  };

  const deleteStudent = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف وحذف قيد الطالب (${name}) نهائياً؟`)) {
      return;
    }

    try {
      await StudentApiRepository.permanentDeleteStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      setInvoices(prev => prev.filter(inv => inv.studentId !== id));
      logAction('DELETE_STUDENT', `حذف قيد الطالب: ${name}`, 'شؤون الطلاب');
      await triggerNotification(`تم حذف قيد الطالب ${name}`, 'warning');
    } catch (error: any) {
      await triggerNotification(error?.message || 'تعذر حذف قيد الطالب من قاعدة البيانات.', 'warning');
    }
  };

  const startEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.name,
      nationalId: student.nationalId,
      classroom: student.classroom,
      section: student.section,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      feesPaid: student.feesPaid,
      feesRemaining: student.feesRemaining,
      status: student.status
    });
    setShowStudentModal(true);
  };

  // Invoice creation action
  const handleInvoiceCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (FallbackStorage.isCanonicalPersistenceRequired()) {
      triggerNotification('تعذر إصدار الفاتورة: يلزم ربط مسار الفوترة بالحفظ المحاسبي المركزي أولاً.', 'warning');
      return;
    }

    const relatedStudent = students.find(s => s.id === invoiceForm.studentId);
    if (!relatedStudent) return;

    const newInv: Invoice = {
      id: `inv_${Date.now()}`,
      studentId: invoiceForm.studentId,
      studentName: relatedStudent.name,
      amount: Number(invoiceForm.amount),
      dueDate: invoiceForm.dueDate,
      status: invoiceForm.status,
      item: invoiceForm.item,
      taxAmount: Number((invoiceForm.amount * 0.15).toFixed(2)),
      invoiceDate: new Date().toISOString().split('T')[0]
    };

    setInvoices(prev => [newInv, ...prev]);
    logAction('CREATE_INVOICE', `تم إصدار فاتورة مالية للطالب ${relatedStudent.name} بقيمة ${invoiceForm.amount} ريال شاملة الضريبة المضافة.`, 'الحسابات العامة');
    triggerNotification(`تم إصدار فاتورة الفوترة والدورة المالية للطالب ${relatedStudent.name}`, 'success');
    setShowInvoiceModal(false);
  };

  // Teacher Action
  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newT: Teacher = {
      id: `teach_${Date.now()}`,
      schoolId: selectedSchool.id,
      branchId: selectedBranch?.id || branches.filter(b => b.schoolId === selectedSchool.id)[0]?.id || 'branch_1_1',
      name: teacherForm.name,
      specialization: teacherForm.specialization,
      email: teacherForm.email,
      phone: teacherForm.phone,
      hiringDate: new Date().toISOString().split('T')[0],
      salary: Number(teacherForm.salary),
      status: teacherForm.status,
      assignedClasses: [teacherForm.assignedClasses]
    };

    setTeachers(prev => [...prev, newT]);
    logAction('CREATE_TEACHER', `تعيين المعلم الجديد بالتخصص ${teacherForm.specialization}: ${teacherForm.name}`, 'شؤون المعلمين والموظفين');
    triggerNotification(`تم تسجيل المعيار الوظيفي وإدراج الأستاذ ${teacherForm.name}`, 'success');
    setShowTeacherModal(false);
    setTeacherForm({
      name: '',
      specialization: 'الرياضيات',
      email: '',
      phone: '',
      salary: 12000,
      status: 'active',
      assignedClasses: 'الصف الأول الثانوي'
    });
  };

  // The UI stays fail-closed until a durable backup provider is configured.
  const startBackupProcess = () => {
    triggerNotification('خدمة النسخ الاحتياطي المركزية غير مهيأة؛ لم يتم إنشاء أو رفع نسخة احتياطية.', 'warning');
  };

  // Update Supabase configuration endpoint patterns
  const saveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseConfig({
      ...supabaseConfig,
      url: tempUrl,
      anonKey: tempKey,
      status: 'connected'
    });
    setShowConfigModal(false);
    logAction('CONFIG_SUPABASE', 'تحديث معالم وعناوين الإتصال ببوابات Supabase API ورمز التحقق الأصلي', 'إعدادات النظام');
    triggerNotification('تم الاتصال ببوابات الدخول السحابية لفرعك وربط الـ Schema الكلي', 'success');
  };

  const handleStudentPaymentSubmit = (e: React.FormEvent, studentId: string, amount: number, method: string) => {
    e.preventDefault();

    // This legacy UI path only writes receipt/journal/account state to
    // browser localStorage. Once Supabase is configured, fail closed instead
    // of presenting a financial success that has no canonical persistence.
    if (FallbackStorage.isCanonicalPersistenceRequired()) {
      EnterpriseLogger.warn(
        'Financial payment blocked: canonical Supabase persistence is not wired to this legacy UI path.',
        'App'
      );
      triggerNotification('تعذر اعتماد التحصيل: يلزم حفظ العملية في قاعدة البيانات المركزية قبل إتمامها.', 'warning');
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (amount <= 0) {
      triggerNotification('يرجى إدخال مبلغ صحيح للتحصيل', 'warning');
      return;
    }

    if (amount > student.feesRemaining) {
      triggerNotification('المبلغ أكبر من المتبقي على الطالب', 'warning');
      return;
    }

    const tenantId = selectedSchool.id;
    const invId = `receipt_${Date.now()}`;

    // 1. Generate unique sequential IDs for cross-referencing
    const studentPaymentId = `STP-2026-${String(invoices.length + 1).padStart(6, '0')}`;
    const receiptVoucherId = `RCV-2026-${String(invoices.length + 1).padStart(6, '0')}`;
    
    // Read current JVs to determine length for safe sequencing
    const storedJvsRaw = localStorage.getItem('erp_journal_entries_v2');
    let jvsLength = 0;
    if (storedJvsRaw) {
      try { jvsLength = JSON.parse(storedJvsRaw).length; } catch (e: any) {}
    }
    const journalEntryId = `JV-2026-${String(jvsLength + 1).padStart(6, '0')}`;

    // Determine costCenter & stage label from student's classroom
    const classroom = student.classroom || '';
    const costCenter = classroom.includes('روضة') || classroom.includes('تمهيدي') ? 'kindergarten' :
                       classroom.includes('ابتدائي') || classroom.includes('الأول') || classroom.includes('الثاني') || classroom.includes('الثالث') || classroom.includes('الرابع') || classroom.includes('الخامس') || classroom.includes('السادس') ? 'primary' :
                       classroom.includes('إعدادي') || classroom.includes('متوسط') || classroom.includes('السابع') || classroom.includes('الثامن') || classroom.includes('التاسع') ? 'middle' :
                       classroom.includes('ثانوي') || classroom.includes('العاشر') || classroom.includes('الحادي عشر') || classroom.includes('الثاني عشر') ? 'secondary' : 'primary';
    
    const stageLabel = costCenter === 'kindergarten' ? 'الروضة' :
                       costCenter === 'primary' ? 'الابتدائي' :
                       costCenter === 'middle' ? 'الإعدادي' : 'الثانوي';

    const debitAccountCode = (method === 'كاش' || method === 'نقدي') ? '1101' : '1102';
    const debitAccountName = debitAccountCode === '1101' ? 'صندوق الخزينة الرئيسي (كاش)' : 'حساب مصرف الوحدة الجاري';

    const meta = { userId: 'mgr_sulaiman', userName: 'سليمان غازي', userRole: currentRole, ipAddress: '192.168.1.144' };
    
    // Perform state update
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          feesPaid: s.feesPaid + amount,
          feesRemaining: s.feesRemaining - amount
        };
      }
      return s;
    }));
    logAction('RECEIVE_PAYMENT', `استلام قسط مالي من الطالب: ${student.name}`, 'شؤون الطلاب');
    triggerNotification(`تم تسجيل مبلغ ${amount} بنجاح`, 'success');

        // Register invoice receipts with reference IDs
        const newInv: Invoice = {
          id: invId,
          studentId: studentId,
          studentName: student.name,
          amount: amount,
          dueDate: new Date().toISOString().split('T')[0],
          status: 'paid',
          item: `إيصال استلام دفعة مالية بقيمة ${amount} د.ل - طريقة التحصيل: ${method}`,
          taxAmount: Number((amount * 0.15).toFixed(2)),
          invoiceDate: new Date().toISOString().split('T')[0],
          studentPaymentId,
          receiptVoucherId,
          journalEntryId,
          costCenter,
          financialPeriod: 'السنة المالية 2026',
          user: 'سليمان غازي',
          createdAt: new Date().toISOString().split('T')[0]
        };
        setInvoices(prev => [newInv, ...prev]);

        // Create Official Receipt Voucher
        const newReceiptVoucher = {
          id: receiptVoucherId,
          date: new Date().toISOString().split('T')[0],
          school: selectedSchool.name || 'مدرسة الأسرة الحديثة - فرع طرابلس',
          stage: stageLabel,
          costCenter: costCenter,
          receivedFrom: student.name,
          operationType: 'رسوم دراسية',
          paymentMethod: method,
          receivingAccount: debitAccountCode,
          amount: amount,
          against: `سداد قيمة الرسوم الدراسية للطالب: ${student.name} - رقم عملية السداد ${studentPaymentId}`,
          attachmentName: null,
          user: 'سليمان غازي',
          status: 'معتمد' as const,
          notes: `تم التوليد تلقائياً من شاشة حسابات الطلاب عبر عملية السداد ${studentPaymentId}`,
          studentPaymentId,
          studentId,
          studentName: student.name,
          receiptVoucherId,
          journalEntryId,
          financialPeriod: 'السنة المالية 2026',
          createdAt: new Date().toLocaleString('ar-LY')
        };

        const storedRvsRaw = localStorage.getItem('erp_receipt_vouchers_v2');
        let rvs = [];
        if (storedRvsRaw) {
          try { rvs = JSON.parse(storedRvsRaw); } catch (e: any) {}
        } else {
          rvs = [
            {
              id: 'RV-2026-0001',
              date: '2026-06-15',
              school: 'مدرسة الأسرة الحديثة - فرع طرابلس',
              stage: 'الابتدائي',
              costCenter: 'primary',
              receivedFrom: 'الشرادي نوري الهدار',
              operationType: 'رسوم دراسية',
              paymentMethod: 'نقدي',
              receivingAccount: '1101',
              amount: 4500,
              against: 'سداد القسط الأول من الرسوم الدراسية السنوية',
              attachmentName: 'receipt_transfer_stamp.pdf',
              user: 'سليمان غازي',
              status: 'معتمد',
              notes: 'تمت مطابقتها من الإدارة المالية للمدارس'
            },
            {
              id: 'RV-2026-0002',
              date: '2026-06-18',
              school: 'مدرسة الأسرة الحديثة - فرع طرابلس',
              stage: 'الروضة',
              costCenter: 'kindergarten',
              receivedFrom: 'منى عادل القماطي',
              operationType: 'رسوم حافلة',
              paymentMethod: 'تحويل',
              receivingAccount: '1102',
              amount: 1200,
              against: 'رسوم اشتراك حافلة النقل المدرسي للفصل الأول',
              attachmentName: 'bank_receipt_copy.png',
              user: 'سليمان غازي',
              status: 'معتمد',
              notes: 'محولة لحساب مصرف الوحدة المباشر'
            },
            {
              id: 'RV-2026-0003',
              date: '2026-06-22',
              school: 'مدرسة الأسرة الحديثة - فرع طرابلس',
              stage: 'الثانوي',
              costCenter: 'secondary',
              receivedFrom: 'عبد الرحمن طارق الشيباني',
              operationType: 'رسوم دراسية',
              paymentMethod: 'نقاط بيع',
              receivingAccount: '1102',
              amount: 6000,
              against: 'سداد رسوم تسجيل الفصل الثاني الثانوي',
              attachmentName: null,
              user: 'سليمان غازي',
              status: 'معلق',
              notes: 'تحت المراجعة والتدقيق المحاسبي'
            }
          ];
        }
        rvs = [newReceiptVoucher, ...rvs];
        localStorage.setItem('erp_receipt_vouchers_v2', JSON.stringify(rvs));

        // Create balancing Double Entry Journal Entry
        const newJournalEntry = {
          id: journalEntryId,
          date: new Date().toISOString().split('T')[0],
          description: `قيد ترحيل تلقائي: سداد رسوم دراسية للطالب ${student.name} - عملية سداد رقم ${studentPaymentId}`,
          debitTotal: amount,
          creditTotal: amount,
          status: 'مرحل',
          type: 'بسيط',
          createdByUser: 'سليمان غازي',
          createdAt: new Date().toLocaleTimeString('ar-LY') + ' ' + new Date().toLocaleDateString('ar-LY'),
          updatedAt: new Date().toLocaleTimeString('ar-LY') + ' ' + new Date().toLocaleDateString('ar-LY'),
          documentType: 'سند قبض',
          receiptVoucherId,
          studentPaymentId,
          studentName: student.name,
          stage: stageLabel,
          costCenter: costCenter,
          lines: [
            {
              id: 'l-1',
              accountCode: debitAccountCode,
              accountName: debitAccountName,
              description: `الجانب المدين - استلام النقدية بالـ ${debitAccountName}`,
              debit: amount,
              credit: 0,
              costCenter
            },
            {
              id: 'l-2',
              accountCode: '4101',
              accountName: 'إيرادات الرسوم الدراسية الموحدة',
              description: `الجانب الدائن - إثبات إيراد الرسوم الدراسية للمرحلة ${stageLabel}`,
              debit: 0,
              credit: amount,
              costCenter
            }
          ],
          attachments: []
        };

        let currentJvs = [];
        if (storedJvsRaw) {
          try { currentJvs = JSON.parse(storedJvsRaw); } catch (e: any) {}
        } else {
          currentJvs = [
            {
              id: 'JV-2026-001',
              date: '2026-06-20',
              description: 'إثبات قيد رواتب موظفي شهر مايو إدارياً',
              debitTotal: 12500.00,
              creditTotal: 12500.00,
              status: 'مرحل',
              type: 'مركب',
              createdByUser: 'سليمان غازي',
              createdAt: '2026-06-20 10:30',
              updatedAt: '2026-06-20 10:32',
              lines: [
                { accountCode: '5101', accountName: 'رواتب وأجور تدريس', description: 'رواتب التدريس مايو', debit: 12500.00, credit: 0, costCenter: 'primary' },
                { accountCode: '2101', accountName: 'موظفين ومستحقات', description: 'أمانات رواتب مايو', debit: 0, credit: 12500.00, costCenter: 'primary' }
              ],
              attachments: []
            }
          ];
        }
        currentJvs = [newJournalEntry, ...currentJvs];
        localStorage.setItem('erp_journal_entries_v2', JSON.stringify(currentJvs));

        // Update Chart of Accounts balances
        const storedAccountsRaw = localStorage.getItem('erp_chart_of_accounts_v2');
        if (storedAccountsRaw) {
          try {
            const currentAccounts = JSON.parse(storedAccountsRaw);
            const updatedAccounts = currentAccounts.map((acc: any) => {
              if (acc.code === debitAccountCode) {
                return { ...acc, balance: (acc.balance || 0) + amount };
              }
              if (acc.code === '4101') {
                return { ...acc, balance: (acc.balance || 0) + amount };
              }
              return acc;
            });
            localStorage.setItem('erp_chart_of_accounts_v2', JSON.stringify(updatedAccounts));
          } catch (err: any) {
            EnterpriseLogger.error('Failed to update accounts balance:', "App", { error: err });
          }
        }

        logAction('RECEIVE_PAYMENT', `استلام دفعة مالية من الطالب ${student.name} بقيمة ${amount} د.ل عبر ${method}. تم ترحيل قيد محاسبي وسند قبض تلقائياً.`, 'حسابات الطلاب');
        triggerNotification(`تم تسجيل دفعة مالية بقيمة ${amount} د.ل للطالب ${student.name} وتوطين القيد المزدوج رقم ${journalEntryId} تلقائياً`, 'success');
        return true;
      }

  // Dynamic filter lists for specific school elements
  const currentBranchesOfSchool = branches.filter(b => b.schoolId === selectedSchool.id);

  if (currentPortal === 'login') {
    if (passwordRecovery) {
      return (
        <PasswordRecoveryScreen
          accessToken={passwordRecovery.accessToken}
          refreshToken={passwordRecovery.refreshToken}
          onCompleted={() => setPasswordRecovery(null)}
        />
      );
    }
    if (loginPortalMode === 'school') {
      return (
        <SchoolClientLogin
          selectedSchool={selectedSchool}
          onSchoolLogin={handleSchoolLogin}
          onForgotPassword={handleForgotPassword}
          onSwitchToSuperAdminLogin={() => setLoginPortalMode('gateway')}
          triggerNotification={triggerNotification}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
      );
    } else {
      return (
        <SmartPortalGateway
          schools={saasSchools}
          onSchoolLogin={handleSchoolLogin}
          onAdminLogin={handleAdminLogin}
          triggerNotification={triggerNotification}
          theme={theme}
          onThemeToggle={toggleTheme}
          initialTab="admin"
        />
      );
    }
  }

  const isSuperAdminViewActive = !isClientMode && hasTrustedPlatformAdminAccess(trustedSessionUser) && isSuperAdminPortalActive && activeSection !== 'system_health';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-sky-500 selection:text-white w-full" dir="rtl">
      
      {/* Sidebar removed completely as requested */}

      {/* Main Area Wrapping Topbar and Dynamic Subview Stage */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        
        {/* Top Header Actions Bar */}
        {!isSuperAdminViewActive && activeSection !== 'system_health' && activeSection !== 'student_accounts' && (
          <Topbar 
            schools={saasSchools}
            selectedSchool={selectedSchool}
            onSchoolChange={handleSchoolChange}
            branches={currentBranchesOfSchool}
            selectedBranch={selectedBranch}
            onBranchChange={handleBranchChange}
            currentRole={currentRole}
            notifications={notifications}
            clearNotifications={() => setNotifications([])}
            userName={trustedSessionUser?.name || 'مستخدم المدرسة'}
            onLogout={handleLogout}
            theme={theme}
            onThemeToggle={toggleTheme}
            isClientMode={isClientMode}
            onOpenSuperAdminPortal={hasTrustedPlatformAdminAccess(trustedSessionUser) ? () => {
              setIsSuperAdminPortalActive(true);
              setCurrentPortal('admin');
              setActiveSection('super_dashboard');
              triggerNotification('تم فتح لوحة الإدارة المركزية والتشغيل الفوقي 🏛️', 'success');
            } : undefined}
          />
        )}

        {/* Outer view frame enclosing the interactive visual content of ERP */}
        <main className={`flex-1 overflow-y-auto bg-gradient-to-br from-[#130b04] via-[#1a1108] to-[#100903] text-[#f7eee1] ${activeSection === 'dashboard' ? 'p-4 sm:p-6' : 'p-0'}`}>
          {isSuperAdminViewActive ? (
            <SuperAdminView
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              selectedSchool={selectedSchool}
              triggerNotification={triggerNotification}
              schools={saasSchools}
              setSchools={setSaasSchools}
              logAction={logAction}
              setIsSuperAdminPortalActive={setIsSuperAdminPortalActive}
              branches={branches}
              setBranches={setBranches}
              setSelectedSchool={setSelectedSchool}
              setCurrentRole={setCurrentRole}
              setCurrentPortal={setCurrentPortal}
              currentRole={currentRole}
              theme={theme}
              onThemeToggle={toggleTheme}
              students={students}
            />
          ) : activeSection === 'system_health' ? (
            !checkSectionPermission('system_health') ? (
              renderAccessDenied('system_health')
            ) : (
              <SystemHealthCenter
                schools={saasSchools}
                students={students}
                invoices={invoices}
                branches={branches}
                activeSchool={selectedSchool}
                currentRole={currentRole}
                triggerNotification={triggerNotification}
                setActiveSection={setActiveSection}
              />
            )
          ) : !checkSectionPermission(activeSection) ? (
            renderAccessDenied(activeSection)
          ) : (
            <>
              {/* Compact Smart Header Toggle & Action Bar conforming to the Enterprise Workspace Policy */}
              {!isClientMode && (
                <div className="bg-[#1c120c] border-b border-[#d4af37]/30 p-2.5 px-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 select-none transition-all text-amber-100">
                  {/* Left: Operational Quick Actions (No repeated school/branch/connection info) */}
                  <div className="flex flex-wrap items-center gap-2">
                    {currentRole === 'SuperAdmin' && (
                      <button 
                        onClick={() => {
                          setIsSuperAdminPortalActive(true);
                          setActiveSection('super_stats');
                          triggerNotification('تم الانتقال إلى لوحة الرقابة السحابية العامة (SaaS) بنجاح 🚀', 'success');
                        }}
                        className="bg-gradient-to-r from-[#9a6a1d] to-[#c58a22] hover:from-[#b07d25] hover:to-[#da9f2c] text-amber-950 font-black text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-[#d4af37]/10 hover:-translate-y-0.5 transition-all cursor-pointer border border-[#fce79a]/40"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-950 animate-pulse" />
                        <span>الرقابة السحابية العامة (SaaS) 🚀</span>
                      </button>
                    )}

                    {activeSection !== 'dashboard' && (
                      <button 
                        onClick={() => setActiveSection('dashboard')}
                        className="bg-gradient-to-r from-[#f7d174] to-[#d4af37] text-slate-950 text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                      >
                        <Gauge className="w-3.5 h-3.5" />
                        <span>العودة للرئيسية 🏠</span>
                      </button>
                    )}

                    {isSuperAdminPortalActive && (
                      <>
                        <button 
                          onClick={() => {
                            setTempUrl(supabaseConfig.url);
                            setTempKey(supabaseConfig.anonKey);
                            setShowConfigModal(true);
                          }} 
                          className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer border border-emerald-500/40"
                        >
                          <DatabaseZap className="w-3.5 h-3.5" />
                          <span>تهيئة Supabase</span>
                        </button>
                        
                        <button 
                          onClick={() => {
                            setActiveSection('db_schema');
                            triggerNotification('تم فتح صفحة استعراض الـ SQL لتركيبه مباشرة في لوحة Supabase', 'info');
                          }}
                          className="bg-[#2a1d13] hover:bg-[#38271a] text-amber-200 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors border border-[#d4af37]/30 cursor-pointer"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>تصدير الـ Schema</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Right: Active Section Indicator & Toggle for Optional Compact Smart Header */}
                  <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
                    <span className="text-[11px] font-bold text-amber-200/80">
                      المنطقة الحالية: <b className="text-[#fce79a] font-black">
                        {activeSection === 'dashboard' ? 'لوحة التحكم والمؤشرات' :
                         activeSection === 'academic' ? 'إدارة الشؤون الأكاديمية والخطط' :
                          activeSection === 'students' ? 'شؤون الطلاب والأكاديمية' :
                          activeSection === 'admissions' ? 'القبول والتسجيل وصندوق الاستفسارات' :
                          activeSection === 'teachers' ? 'شؤون المعلمين والموظفين' :
                         activeSection === 'accounts' ? 'الحسابات العامة والقيود' :
                         activeSection === 'treasury' ? 'الحسابات العامة — الخزينة والمدفوعات البنكية' :
                         activeSection === 'student_accounts' ? 'حسابات الطلاب المالية' :
                         activeSection === 'financial_reports' ? 'التقارير المالية والختامية' :
                         activeSection === 'exams' ? 'الامتحانات والكنترول والنتائج' :
                         activeSection === 'hr' ? 'شؤون الموظفين والرواتب' :
                         activeSection === 'library' ? 'المكتبة المدرسية المركزية' :
                         activeSection === 'inventory' ? 'إدارة المستودعات والعهدة' :
                         (activeSection === 'buses' || activeSection === 'school_transport') ? 'إدارة النقل والترحيل المدرسي' :
                         (activeSection === 'uniform_management' || activeSection === 'school_uniform') ? 'إدارة الزي المدرسي' :
                         activeSection === 'general_review' ? 'المراجعة العامة — قيد التجهيز' :
                         activeSection === 'permissions_admin' ? 'المستخدمون والصلاحيات' :
                         activeSection === 'db_schema' ? 'إدارة النسخ الاحتياطي' :
                         activeSection === 'security_permissions_cert' ? 'اعتماد الأمان والرقابة والصلاحيات' :
                         activeSection === 'uiux_golden_standard_cert' ? 'اعتماد المعايير الذهبية وتوحيد الواجهات (UI/UX)' :
                          activeSection === 'performance_stability_cert' ? 'اعتماد الأداء والاستقرار وسرعة الاستجابة' :
                          activeSection === 'maintainability_scalability_cert' ? 'اعتماد موثوقية الأكواد وقابلية التوسع' :
                         activeSection === 'zero_regression_cert' ? 'اعتماد جودة الاختبارات والحد من التراجعات البرمجية' :
                         activeSection === 'production_readiness_gate' ? 'اعتماد جاهزية الإنتاج والتشغيل السحابي (القرار 43)' :
                         activeSection === 'docs_hardening' ? 'اعتماد التوثيق الهندسي والأرشفة التقنية (القرار 44)' :
                         'شاشة العمليات والتشغيل'}
                      </b>
                    </span>
                    
                    <button 
                      onClick={() => setShowSmartHeader(!showSmartHeader)}
                      className="text-[10px] bg-[#2a1d13] hover:bg-[#38271a] text-amber-200 font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-all border border-[#d4af37]/30 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-[#fce79a]" />
                      <span>{showSmartHeader ? 'طي دليل الشاشة' : 'دليل الشاشة المساعد ℹ️'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Collapsible Smart Header Card (Hidden by default, can be toggled on demand) */}
              {showSmartHeader && !isClientMode && (
                <div className="bg-[#24170d]/90 border-b border-[#d4af37]/40 p-4 px-6 text-right animate-fade-in relative overflow-hidden transition-all text-amber-100">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#fce79a]/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="relative z-10 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-amber-300 font-black">
                      <span className="px-2 py-0.5 bg-[#170e07] rounded border border-[#d4af37]/40 text-[#fce79a]">
                        دليل التوجيه المؤسسي الذكي • SchoolForManus
                      </span>
                      <span>•</span>
                      <span>                        منصة SchoolForManus لإدارة المدارس والمؤسسات التعليمية المتكاملة</span>
                    </div>
                    <h3 className="text-sm font-black text-[#fce79a]">
                      بوابة ومحاكي {selectedSchool.name} الموحدة • رخصة رقم {selectedSchool.licenseNumber}
                    </h3>
                    <p className="text-[11px] text-amber-200/80 max-w-4xl leading-relaxed">
                      أنت الآن في منطقة العمل التشغيلية عالية الكفاءة (Workspace Engine). تم ضبط واجهات التشغيل وفق سياسة استغلال البكسلات والمساحات، وإلغاء بطاقات الترحيب الكبيرة لتسريع أداء المهام اليومية مثل تحرير شجرة الحسابات، ضبط قيود التسويات المركبة، مراقبة ملاءة ميزان الأرصدة، وإدارة الكشوفات المالية والطلابية بدقة متناهية متوافقة مع الأنظمة العالمية.
                    </p>
                  </div>
                </div>
              )}

          <React.Suspense fallback={<div className="flex h-[400px] items-center justify-center text-slate-500 font-bold">جاري تحميل واجهة الوحدة السحابية... 🚀</div>}>
            {activeSection === 'dashboard' && (
              <ModernSchoolDashboard
                students={students}
                teachers={teachers}
                invoices={invoices}
                setActiveSection={setActiveSection}
                selectedSchool={selectedSchool}
                selectedBranch={selectedBranch}
                currentRole={currentRole}
                triggerNotification={triggerNotification}
                canAccessSection={checkSectionPermission}
                isClientMode={isClientMode}
              />
            )}

            {activeSection === 'core_certification' && (
              <EnterpriseCoreCertificationDashboard />
            )}

            {activeSection === 'fixed_assets_cert' && (
              <FixedAssetsPortal />
            )}

            {activeSection === 'procurement_cert' && (
              <EnterpriseProcurementQualityAudit />
            )}

            {activeSection === 'business_logic_audit' && (
              <EnterpriseBusinessLogicAudit />
            )}

            {activeSection === 'accounting_integrity' && (
              <AccountingIntegrityCertification />
            )}

            {activeSection === 'security_permissions_cert' && (
              <EnterpriseSecurityPermissionsCert triggerNotification={triggerNotification} />
            )}

            {activeSection === 'uiux_golden_standard_cert' && (
              <EnterpriseUIUXGoldenStandardCert triggerNotification={triggerNotification} />
            )}

            {activeSection === 'performance_stability_cert' && (
              <EnterprisePerformanceStabilityCertification />
            )}

            {activeSection === 'maintainability_scalability_cert' && (
              <EnterpriseMaintainabilityScalabilityCertification triggerNotification={triggerNotification} />
            )}

            {activeSection === 'zero_regression_cert' && (
              <EnterpriseZeroRegressionCert triggerNotification={triggerNotification} />
            )}

            {activeSection === 'production_readiness_gate' && (
              <EnterpriseProductionReadinessGate triggerNotification={triggerNotification} />
            )}

            {activeSection === 'docs_hardening' && (
              <EnterpriseDocumentationHardening triggerNotification={triggerNotification} />
            )}

            {activeSection === 'wave1_certification' && (
              <EnterpriseWave1FinalCertification />
            )}

            {activeSection === 'core_system_cert' && (
              <EnterpriseCoreSystemCertification />
            )}

            {activeSection === 'operational_excellence_cert' && (
              <EnterpriseOperationalExcellenceCertification 
                triggerNotification={triggerNotification}
              />
            )}

            {activeSection === 'user_trust_cert' && (
              <EnterpriseUserTrustCertification />
            )}

            {activeSection === 'commercial_release' && (
              <EnterpriseCommercialReleaseQualityCertification />
            )}

            {activeSection === 'commercial_competitiveness' && (
              <EnterpriseCommercialCompetitivenessCertification />
            )}

            {activeSection === 'product_maturity' && (
              <EnterpriseProductMaturityCertification />
            )}

            {activeSection === 'golden_release_exec' && (
              <EnterpriseGoldenReleaseExecutionProgram 
                 triggerNotification={triggerNotification}
              />
            )}

            {activeSection === 'ddd_reconstruction' && (
              <EnterpriseDDDReconstruction 
                 triggerNotification={triggerNotification}
              />
            )}

            {activeSection === 'academic' && (
              <React.Suspense fallback={
                <div className="p-12 text-center text-amber-200 font-bold bg-[#1c120c] rounded-3xl border border-[#d4af37]/30 shadow-2xl">
                  جاري تحميل مركز إدارة الشؤون والخطط الأكاديمية...
                </div>
              }>
                <AcademicAffairsPortal
                  students={students}
                  teachers={teachers}
                  selectedSchool={selectedSchool}
                  currentRole={currentRole}
                  logAction={logAction}
                  triggerNotification={triggerNotification}
                  setActiveSection={setActiveSection}
                  stages={stages}
                  setStages={setStages}
                  grades={grades}
                  setGrades={setGrades}
                  academicClasses={academicClasses}
                  setAcademicClasses={setAcademicClasses}
                />
              </React.Suspense>
            )}

            {activeSection === 'students' && (
              checkSectionPermission('students') ? (
                <StudentAffairsPortal
                  students={students}
                  setStudents={setStudents}
                  selectedSchool={selectedSchool}
                  currentRole={currentRole}
                  logAction={logAction}
                  triggerNotification={triggerNotification}
                  setActiveSection={setActiveSection}
                  canUseTrustedPermission={canUseTrustedPermission}
                  stages={stages}
                  setStages={setStages}
                  grades={grades}
                  setGrades={setGrades}
                  academicClasses={academicClasses}
                  setAcademicClasses={setAcademicClasses}
                  costCenters={costCenters}
                  setCostCenters={setCostCenters}
                  invoices={invoices}
                  setInvoices={setInvoices}
                />
              ) : renderAccessDenied('students')
            )}

            {activeSection === 'admissions' && (
              <React.Suspense fallback={<div className="p-8 text-center text-slate-500">جاري تحميل صندوق القبول والتسجيل...</div>}>
                <AdmissionsPortal
                  selectedSchool={selectedSchool}
                  selectedBranch={selectedBranch}
                  currentRole={currentRole}
                  triggerNotification={triggerNotification}
                  onExit={() => setActiveSection('dashboard')}
                />
              </React.Suspense>
            )}

            {/* ========================================================== */}
            {/* VIEW: ACCOUNTS SECTION (الحسابات العامة) & FINANCIAL REPORTS */}
            {/* ========================================================== */}
            {(activeSection === 'accounts' || activeSection === 'financial_reports' || activeSection === 'treasury') && (
              <React.Suspense fallback={<div>جاري تحميل وحدة المحاسبة...</div>}>
                <AccountingErrorBoundary>
                  <GeneralLedgerPortal
                    students={students}
                    invoices={invoices}
                    setInvoices={setInvoices}
                    selectedSchool={selectedSchool}
                    setActiveSection={setActiveSection}
                    logAction={logAction}
                    triggerNotification={triggerNotification}
                    stages={stages}
                    setStages={setStages}
                    grades={grades}
                    setGrades={setGrades}
                    academicClasses={academicClasses}
                    setAcademicClasses={setAcademicClasses}
                    costCenters={costCenters}
                    setCostCenters={setCostCenters}
                    currentRole={currentRole}
                    initialTab={activeSection === 'financial_reports' ? 'financial_reports' : activeSection === 'treasury' ? 'treasury' : 'dashboard'}
                    users={simulatedUsers}
                    setUsers={setSimulatedUsers}
                    roles={roles}
                    setRoles={setRoles}
                    permissionsAuditLog={permissionsAuditLog}
                    setPermissionsAuditLog={setPermissionsAuditLog}
                    currentDrillDownUser={drillDownUser}
                    setDrillDownUser={setDrillDownUser}
                  />
                </AccountingErrorBoundary>
              </React.Suspense>
            )}

            {/* ========================================================== */}
            {/* VIEW: TEACHERS & EMPLOYEES SECTION (المعلمون والموظفون) */}
            {/* ========================================================== */}
            {(activeSection === 'teachers' || activeSection === 'hr') && (
              <HumanResourcesPortal setActiveSection={setActiveSection} selectedSchool={selectedSchool} />
            )}

            {/* ========================================================== */}
            {/* VIEW: INVENTORY & STORES (إدارة المخزون والعهد المدرسية) */}
            {/* ========================================================== */}
            {activeSection === 'inventory' && (
              <InventoryManagementPortal
                selectedSchool={selectedSchool}
                triggerNotification={triggerNotification}
              />
            )}

            {/* ========================================================== */}
            {/* VIEW: PROCUREMENT & PURCHASING (إدارة المشتريات والتوريدات) */}
            {/* ========================================================== */}
            {activeSection === 'procurement' && (
              <InventoryManagementPortal
                selectedSchool={selectedSchool}
                initialTab="procurement"
                triggerNotification={triggerNotification}
              />
            )}

            {/* ========================================================== */}
            {/* VIEW: FIXED ASSETS PORTAL (إدارة الأصول الثابتة والعهد) */}
            {/* ========================================================== */}
            {activeSection === 'fixed_assets' && (
              <FixedAssetsPortal />
            )}

            {/* ========================================================== */}
            {/* VIEW: SCHOOL UNIFORM MANAGEMENT (إدارة الزي المدرسي) */}
            {/* ========================================================== */}
            {(activeSection === 'uniform_management' || activeSection === 'school_uniform') && (
              <SchoolUniformManagement
                students={students}
                setStudents={setStudents}
                invoices={invoices}
                setInvoices={setInvoices}
                selectedSchoolId={selectedSchool?.id}
                triggerNotification={triggerNotification}
                logAction={logAction}
                currentRole={currentRole}
                setActiveSection={setActiveSection}
                selectedSchool={selectedSchool}
              />
            )}

            {/* ========================================================== */}
            {/* VIEW: LIBRARY PORTAL (إدارة المكتبة المدرسية المركزية) */}
            {/* ========================================================== */}
            {activeSection === 'library' && (
              <LibraryPortal
                selectedSchool={selectedSchool}
                setActiveSection={setActiveSection}
                triggerNotification={triggerNotification}
              />
            )}

          {/* ========================================================== */}
          {/* VIEW: SCHOOL TRANSPORTATION MANAGEMENT (إدارة النقل والترحيل المدرسي) */}
          {/* ========================================================== */}
          {(activeSection === 'buses' || activeSection === 'school_transport') && (
            <SchoolTransportManagement
              students={students}
              selectedSchoolId={selectedSchool?.id}
              selectedSchoolName={selectedSchool?.name}
              triggerNotification={triggerNotification}
              setActiveSection={setActiveSection}
            />
          )}

          {/* ========================================================== */}
          {/* VIEW: EXAMS & RESULTS (الامتحانات والنتائج) */}
          {/* ========================================================== */}
          {activeSection === 'exams' && (
            <React.Suspense fallback={<div className="p-8 text-center text-sm font-bold text-slate-500">جارٍ تحميل وحدة الامتحانات...</div>}>
              <ExamsErrorBoundary onExit={() => setActiveSection('dashboard')}>
                <ExamsResultsModule
                  students={students}
                  teachers={teachers}
                  classes={classesSeed}
                  triggerNotification={triggerNotification}
                  setActiveSection={setActiveSection}
                  selectedSchool={selectedSchool}
                  currentRole={currentRole}
                />
              </ExamsErrorBoundary>
            </React.Suspense>
          )}

          {/* ========================================================== */}
          {/* VIEW: ATTENDANCE (الحضور والانصراف المباشر) */}
          {/* ========================================================== */}
          {activeSection === 'attendance' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">سجل التحضير اليومي للطلاب - {new Date().toLocaleDateString('ar-SA')}</h3>
                  <button 
                    onClick={() => {
                      triggerNotification('تم حفظ وتثبيت جدول التحضير بنجاح وإرسال الرقابة المباشرة', 'success');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
                  >
                    اعتماد التحضير الفوري للفصول
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">اسم الطالب</th>
                        <th className="px-6 py-3">الصف الدراسي المسجل</th>
                        <th className="px-6 py-3 text-center">تاريخ المعاينة</th>
                        <th className="px-6 py-3 text-center">حالة الحضور والتحضير</th>
                        <th className="px-6 py-3 text-center">تعديل الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendance.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-800">{att.studentName}</td>
                          <td className="px-6 py-4 text-slate-500">{att.classroom}</td>
                          <td className="px-6 py-4 text-center font-mono text-slate-400">{att.date}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-black ${
                              att.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                              att.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {att.status === 'present' ? 'حاضر' :
                               att.status === 'absent' ? 'غائب اليوم' : 'غائب بعذر مقبول'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-1">
                              <button 
                                onClick={() => {
                                  setAttendance(prev => prev.map(a => a.id === att.id ? { ...a, status: 'present' } : a));
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded text-[10px] font-bold"
                              >
                                تحضير
                              </button>
                              <button 
                                onClick={() => {
                                  setAttendance(prev => prev.map(a => a.id === att.id ? { ...a, status: 'absent' } : a));
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded text-[10px] font-bold"
                              >
                                غياب
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: PARENTS SECTION (أولياء الأمور) */}
          {/* ========================================================== */}
          {activeSection === 'parents' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-2">منصة تواصل ومتابعة أولياء الأمور</h3>
                <p className="text-xs text-slate-500 mb-4">قائمة المسجلين لمتابعة الأنشطة للطلاب بما يتوافق مع معايير الوزارات الرسمية</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {students.map((st) => (
                    <div key={st.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">ولي أمر الطالب: {st.name}</span>
                        <h4 className="font-bold text-slate-900 mt-2">{st.parentName}</h4>
                        <p className="text-xs text-slate-600 font-mono mt-1">الهاتف المسجل: {st.parentPhone}</p>
                      </div>

                      <button 
                        onClick={() => triggerNotification(`تم إشعال رسالة نصية دولية فورية برابط الدخول لولي الأمر: ${st.parentName}`, 'success')}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <MessageSquareDot className="w-4 h-4" />
                        <span>مراسلة</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: AUDIT LOGS SECTION (سجل الرقابة والعمليات) */}
          {/* ========================================================== */}
          {activeSection === 'audit_logs' && (
            <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل وحدة السجلات والتدقيق المؤسسي...</div>}>
              <AuditLogsPortal 
                auditLogs={auditLogs} 
                isBackingUp={isBackingUp} 
                startBackupProcess={startBackupProcess} 
                backupLogs={backupLogs} 
                selectedSchoolId={selectedSchool.id}
              />
            </React.Suspense>
          )}

          {/* ========================================================== */}
          {/* VIEW: GENERAL REVIEW — RESERVED BY BUSINESS OWNER */}
          {/* ========================================================== */}
          {activeSection === 'general_review' && (
            <div className="mx-auto max-w-4xl space-y-5 text-right" dir="rtl">
              <div className="overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm">
                <div className="bg-gradient-to-l from-violet-900 via-slate-900 to-indigo-900 p-7 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-white/10 px-3 py-1 text-[11px] font-black text-violet-100">
                        <ShieldCheck className="h-3.5 w-3.5" /> وحدة محجوزة للتخطيط
                      </div>
                      <h2 className="mt-4 text-xl font-black">المراجعة العامة</h2>
                      <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-violet-100/85">أُضيفت الوحدة إلى هيكل المنظومة والتنقل فقط. لم يبدأ بناء إجراءاتها أو نماذجها أو تقاريرها، التزاماً بخطة العمل التي تحددها لاحقاً.</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center">
                      <div className="text-[10px] font-bold text-violet-200">حالة التنفيذ</div>
                      <div className="mt-1 text-sm font-black text-white">قيد التجهيز</div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 p-6 sm:grid-cols-3">
                  {[
                    ['النطاق', 'سيُحدد لاحقاً مع مالك الوحدة'],
                    ['الصلاحيات', 'محكومة مؤقتاً بصلاحية الرقابة'],
                    ['البيانات', 'لم تُنشأ أي جداول أو سجلات جديدة'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-[10px] font-black text-slate-400">{label}</div>
                      <div className="mt-2 text-xs font-black leading-5 text-slate-700">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: BRACES & SCHOOLS (إدارة الفروع) */}
          {/* ========================================================== */}
          {activeSection === 'branches' && (
            <div className="space-y-6">
              
              {/* Branches Seed Showcase block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {branches.map((br) => (
                  <div key={br.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-teal-400 to-sky-600" />
                    
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">الفرع المسجل للمدارس</span>
                          <h4 className="font-bold text-slate-900 text-base mt-1">{br.name}</h4>
                          <span className="text-xs text-sky-600 font-medium">📍 فرع {br.city} الكلي</span>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-full">
                          معرف السحابة: {br.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-5 bg-slate-50 p-3 rounded-lg text-xs">
                        <div>
                          <p className="text-slate-500 font-medium">المسؤول الإداري:</p>
                          <p className="font-bold text-slate-800 mt-0.5">{br.manager}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">عدد كادر التدريس:</p>
                          <p className="font-bold text-slate-800 mt-0.5">{br.teacherCount} معلّم معتمد</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-500">إجمالي طلاب الفرع:</span>
                      <span className="font-black text-indigo-600">{br.studentCount} طالب وطالبة</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}


          {/* ========================================================== */}
          {/* VIEW: GENERAL SYSTEM SETTINGS (separate from Users & Permissions) */}
          {/* ========================================================== */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              
              {/* Sub tabs for general settings */}
              <div className="flex border-b border-slate-200 gap-6 pb-2 text-sm font-bold text-right" dir="rtl">
                <button
                  onClick={() => setSettingsTab('comprehensive')}
                  className={`pb-2 px-1 transition-all border-b-2 ${
                    settingsTab === 'comprehensive'
                      ? 'border-sky-600 text-sky-700 font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⚙️ إدارة الإعدادات العامة والبيانات المرجعية (Audit 016)
                </button>
                <button
                  onClick={() => setSettingsTab('rbac')}
                  className={`pb-2 px-1 transition-all border-b-2 ${
                    settingsTab === 'rbac'
                      ? 'border-sky-600 text-sky-700 font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🔒 إعدادات الهوية وسير الصلاحيات (RBAC)
                </button>
                <button
                  onClick={() => setSettingsTab('currency')}
                  className={`pb-2 px-1 transition-all border-b-2 ${
                    settingsTab === 'currency'
                      ? 'border-sky-600 text-sky-700 font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🪙 إعدادات العملة المخصصة
                </button>
              </div>

              {settingsTab === 'comprehensive' ? (
                <SystemSettingsPortal
                  formatCurrency={formatCurrency}
                  triggerNotification={triggerNotification}
                  logAction={logAction}
                  currentRole={currentRole}
                />
              ) : settingsTab === 'rbac' ? (
                <>
                  {/* RBAC Role controls demo block */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-2">إعدادات الهوية وسير الصلاحيات المتقدمة (RBAC Model)</h3>
                    <p className="text-xs text-slate-500 mb-4">قم بتجربة التحكم بمستوى الصلاحيات وتغيير نمط العرض لمعاينة قيود الأمان في جداول قاعدة البيانات</p>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {(['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Accountant', 'Parent', 'Control', 'Auditor', 'Student'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            triggerNotification('الدور والصلاحيات مصدرهما الهوية الموثوقة. سجّل الدخول بالحساب المطلوب لاختبار دور آخر.', 'info');
                          }}
                          className={`p-4 rounded-xl border text-center transition-all flex flex-col justify-between h-40 ${
                            currentRole === r 
                              ? 'border-sky-600 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20' 
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-[10px] text-slate-400 font-black uppercase">{r}</span>
                          <div className="text-sm font-bold text-slate-800 my-2">
                            {r === 'SuperAdmin' ? 'المشرف الكلي' :
                             r === 'SchoolAdmin' ? 'مدير عام الفرع' :
                             r === 'Teacher' ? 'الأستاذ المدرس' :
                             r === 'Accountant' ? 'المدير المالي' : 'ولي الأمر'}
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">يتطلب جلسة موثوقة</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Strict Permissions configuration listing */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                      <h3 className="font-bold text-slate-900 text-sm">تفصيل جداول الصلاحيات المعقدة المحقونة في الـ SaaS</h3>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      {permissions.map((p) => (
                        <div key={p.code} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded">{p.code}</span>
                              <span className="bg-sky-50 text-sky-600 px-2 py-0.5 rounded text-[10px] font-bold">{p.module}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 mt-2">{p.title}</h4>
                            <p className="text-slate-500 mt-1">{p.description}</p>
                          </div>

                          <div className="text-left">
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-bold">مسموح</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right" dir="rtl">
                  {/* Left Column: Settings Form */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">لوحة تحكم وتخصيص العملة المرنة</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        تتيح لك هذه الشاشة تعديل وتخصيص تفاصيل العملة النشطة في المنظومة بالكامل. يتم حفظ التعديلات في جدول الإعدادات وتطبيقها حياً على جميع التقارير والمطبوعات.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">اسم العملة المخصصة:</label>
                        <input
                          type="text"
                          value={currencyForm?.name || ''}
                          onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
                          placeholder="مثال: الريال السعودي، الجنيه السوداني، د.ل"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">رمز العملة (الرمز المختصر):</label>
                        <input
                          type="text"
                          value={currencyForm?.symbol || ''}
                          onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                          placeholder="مثال: ر.س، ج.س، د.ل، $"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">اسم الجزء العشري (الكسر):</label>
                        <input
                          type="text"
                          value={currencyForm?.fractionName || ''}
                          onChange={(e) => setCurrencyForm({ ...currencyForm, fractionName: e.target.value })}
                          placeholder="مثال: هللة، قرش، درهم، سنت"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">عدد الخانات والمنازل العشرية:</label>
                        <select
                          value={currencyForm?.decimalPlaces ?? 2}
                          onChange={(e) => setCurrencyForm({ ...currencyForm, decimalPlaces: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-bold"
                        >
                          <option value="0">0 (بدون أجزاء عشرية)</option>
                          <option value="1">1 (منزلة عشرية واحدة)</option>
                          <option value="2">2 (منزلتين عشريتين)</option>
                          <option value="3">3 (ثلاث منازل عشرية)</option>
                          <option value="4">4 (أربع منازل عشرية)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">موضع رمز العملة:</label>
                        <select
                          value={currencyForm?.symbolPosition || 'after'}
                          onChange={(e) => setCurrencyForm({ ...currencyForm, symbolPosition: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-bold"
                        >
                          <option value="after">بعد المبلغ المالي (مثال: 1,250.00 {currencyForm?.symbol || 'ر.س'})</option>
                          <option value="before">قبل المبلغ المالي (مثال: {currencyForm?.symbol || 'ر.س'} 1,250.00)</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-6">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currencyForm?.showSymbolInReports ?? true}
                            onChange={(e) => setCurrencyForm({ ...currencyForm, showSymbolInReports: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                          <span className="mr-3 text-xs font-bold text-slate-700 select-none">إظهار رمز العملة في التقارير والمطبوعات والمستندات الرسمية</span>
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                      <button
                        onClick={() => {
                          saveCurrency(currencyForm);
                          logAction('UPDATE_CURRENCY_SETTINGS', `تحديث تهيئة العملة المخصصة لتكون: ${currencyForm.name} (${currencyForm.symbol}) بـ ${currencyForm.decimalPlaces} خانات عشرية`, 'إعدادات النظام');
                          triggerNotification('✓ تم حفظ إعدادات العملة الجديدة وتحديث النظام بالكامل تلقائياً!', 'success');
                        }}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 shadow transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <span>حفظ التعديلات وتحديث المنظومة الحية 💾</span>
                      </button>

                      <button
                        onClick={() => {
                          const def = {
                            name: 'الريال السعودي',
                            symbol: 'ر.س',
                            fractionName: 'هللة',
                            decimalPlaces: 2,
                            symbolPosition: 'after' as const,
                            showSymbolInReports: true,
                          };
                          setCurrencyForm(def);
                          saveCurrency(def);
                          triggerNotification('✓ تم إعادة تعيين إعدادات العملة الافتراضية للبلد.', 'info');
                        }}
                        className="border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs px-4 py-2.5 rounded-lg"
                      >
                        استعادة الافتراضي 🔄
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Live Preview & Simulated SQL */}
                  <div className="space-y-6">
                    {/* Live Preview Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        <span>👁️</span>
                        <span>معاينة حية ومحاكاة فورية للقيم المالية</span>
                      </h4>

                      <div className="space-y-3">
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-extrabold block mb-1">شاشات العمل اليومية والجداول (بدون رمز):</span>
                          <span className="text-xl font-black text-slate-900 font-mono">
                            {formatCurrency(1250.5, false)}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-1">تظهر كأرقام مجردة لتوفير واجهة مستخدم نظيفة وخالية من التراكم البصري.</p>
                        </div>

                        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-extrabold block mb-1">المستندات الرسمية والتقارير والفواتير:</span>
                          <span className="text-xl font-black text-emerald-700 font-mono">
                            {formatCurrency(1250.5, true)}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-1">يُطبع رمز العملة في الفواتير والشهادات وتقارير الميزانية وفقاً لتفضيلات المدير.</p>
                        </div>
                      </div>
                    </div>

                    {/* SQL Logs simulation box */}
                    <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-sm space-y-3 font-mono text-[10px]">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-slate-400 font-bold">SQL DATABASE ENGINE LOG</span>
                        <span className="text-emerald-400 animate-pulse">● LIVE</span>
                      </div>
                      <div className="space-y-1.5 text-left" style={{ direction: 'ltr' }}>
                        <p className="text-slate-500">-- استعلام التحديث المنفذ حياً في جدول الإعدادات</p>
                        <p className="text-indigo-400">UPDATE system_settings</p>
                        <p className="text-slate-300">SET value = <span className="text-amber-300">'{JSON.stringify({
                          name: currencyForm?.name,
                          symbol: currencyForm?.symbol,
                          fractionName: currencyForm?.fractionName,
                          decimalPlaces: currencyForm?.decimalPlaces,
                          symbolPosition: currencyForm?.symbolPosition,
                          showSymbolInReports: currencyForm?.showSymbolInReports
                        })}'</span>,</p>
                        <p className="text-slate-300">    updated_at = NOW()</p>
                        <p className="text-indigo-400">WHERE key = 'currency_config';</p>
                        <p className="text-emerald-500">-- Query executed successfully: 1 row affected.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: CENTRAL USER AND PERMISSIONS MODULE (إدارة المستخدمين والصلاحيات) */}
          {/* ========================================================== */}
          {activeSection === 'permissions_admin' && (
            <div className="space-y-6" dir="rtl">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">مركز المستخدمين والصلاحيات</h2>
                    <p className="text-xs text-slate-500 mt-1">إدارة واضحة وشاملة للمستخدمين والأدوار والوحدات والشاشات وأزرار العمليات وفق سياسات RBAC الموثوقة</p>
                  </div>
                  <button
                    onClick={() => setActiveSection('super_dashboard')}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-[#0284c7] hover:bg-sky-50 hover:text-[#0369a1] transition-all duration-200 shadow-sm"
                  >
                    <span>العودة إلى الشاشة الرئيسية</span>
                    <span className="text-lg">←</span>
                  </button>
                </div>

                <PermissionsManagementModule
                  users={simulatedUsers}
                  setUsers={setSimulatedUsers}
                  roles={roles}
                  setRoles={setRoles}
                  permissionsAuditLog={permissionsAuditLog}
                  setPermissionsAuditLog={setPermissionsAuditLog}
                  currentDrillDownUser={drillDownUser}
                  setDrillDownUser={setDrillDownUser}
                  triggerNotification={(text, type) => triggerNotification(text, type)}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: STUDENT ACCOUNTS SECTION (حسابات الطلاب والرسوم) */}
          {/* ========================================================== */}
            {activeSection === 'student_accounts' && (
              <AccountingErrorBoundary
                title="تعذر تحميل وحدة رسوم الطلاب"
                description="توقف تحميل واجهة الرسوم قبل عرضها. أعد المحاولة لتجديد ملف الوحدة أو ارجع للوحة المدرسة."
                retryLabel="إعادة تحميل وحدة الرسوم"
                onRetry={() => window.location.reload()}
              >
                <React.Suspense fallback={<div className="flex h-[400px] items-center justify-center text-slate-500 font-bold" role="status">جاري تحميل وحدة الرسوم والأقساط...</div>}>
                  <StudentFinancialPortal
                    students={students}
                    setStudents={setStudents}
                    invoices={invoices}
                    setInvoices={setInvoices}
                    filteredStudents={filteredStudents}
                    handleStudentPaymentSubmit={handleStudentPaymentSubmit}
                    currentRole={currentRole}
                    setActiveSection={setActiveSection}
                    logAction={logAction}
                    triggerNotification={triggerNotification}
                    stages={stages}
                    setStages={setStages}
                    grades={grades}
                    setGrades={setGrades}
                    academicClasses={academicClasses}
                    setAcademicClasses={setAcademicClasses}
                    costCenters={costCenters}
                    setCostCenters={setCostCenters}
                    selectedSchool={selectedSchool}
                    selectedBranch={selectedBranch}
                  />
                </React.Suspense>
              </AccountingErrorBoundary>
            )}

          {/* ========================================================== */}
          {/* VIEW: DB SCHEMA SECTION (مخطط قاعدة البيانات والربط) */}
          {/* ========================================================== */}
          {activeSection === 'db_schema' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm text-right">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded font-bold">مخطط الهيكل البرمجي (Database Schema)</span>
                    <h3 className="font-extrabold text-slate-900 text-lg mt-1 flex items-center gap-2">
                      <DatabaseZap className="w-5 h-5 text-indigo-600" />
                      مستند الـ SQL لتجهيز مشروع Supabase الخاص بك
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      انسخ كود SQL البرمجي والصقه مباشرة في محرِّر الاستعلامات (SQL Editor) داخل لوحة تحكم Supabase لبناء المنظومة السحابية المتكاملة وفروعها بضغطة زر واحدة.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      copyTextToClipboard(supabaseSchemaSQL);
                      triggerNotification('تم نسخ كود الـ SQL بنجاح! جاهز للصق في Supabase', 'success');
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow hover:scale-105 transition-all"
                  >
                    <span>نسخ كود الـ SQL بالكامل 📋</span>
                  </button>
                </div>

                <div className="bg-slate-950 rounded-xl p-5 font-mono text-xs text-slate-300 space-y-1.5 overflow-x-auto max-h-[500px] leading-relaxed relative border border-slate-800">
                  <div className="absolute top-3 left-3 bg-slate-800/80 text-slate-400 px-2 py-1 rounded text-[10px] font-bold">
                    POSTGRESQL DIALECT
                  </div>
                  <pre className="text-left text-indigo-350 font-mono text-indigo-300" style={{ direction: 'ltr' }}>{supabaseSchemaSQL}</pre>
                </div>
              </div>
            </div>
          )}
            </React.Suspense>
            </>
          )}
        </main>
      </div>

      {/* ========================================================== */}
      {/* DIALOGS / MODALS STAGE FOR SYSTEM CONTROL */}
      {/* ========================================================== */}
      
      {/* 1. Supabase credentials configurations drawer */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <DatabaseZap className="text-amber-400 w-5 h-5 animate-pulse" />
ربط النظام بمشروعك السحابي في Supabase
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveSupabaseConfig} className="p-6 space-y-4 text-xs">
              <p className="text-slate-500 leading-relaxed mb-2">
                تخطى الحدود والقيود الافتراضية عبر وضع رابط الـ API والمفتاح العام لمشروعك المستضاف على Supabase لتمكين الربط الفعلي مع سيرفر تتبع الفروع.
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5" htmlFor="supabase-url">رابط السيرفر السحابي (Supabase Project URL):</label>
                <input
                  id="supabase-url"
                  type="url"
                  required
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  placeholder="https://your-project-id.supabase.co"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5" htmlFor="supabase-anon-key">المفتاح العام للمصادقة (Anon public API key):</label>
                <textarea
                  id="supabase-anon-key"
                  rows={3}
                  required
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  placeholder="<jwt-placeholder>"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-slate-600 leading-relaxed">
                🚀 يتم إرسال كافة الاستعلامات وتخزين السجلات على نفس السكيما المعزولة لـ Multi-Tenant RLS تلقائياً لراحة كادر التقارير لديناميكية الاستخدام.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowConfigModal(false)} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  تحديث وحفظ الاتصال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Create/Edit Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">
                {editingStudent ? 'تعديل وتدقيق ملف الطالب' : 'استمارة تدوين قيد طالب جديد'}
              </h3>
              <button onClick={() => setShowStudentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStudentFormSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="student-name">الاسم الثلاثي واللقب:</label>
                  <input
                    id="student-name"
                    type="text"
                    required
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none font-bold"
                    placeholder="مثال: محمد بن علي الشبيلي"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="student-nid">الهوية الوطنية / الإقامة:</label>
                  <input
                    id="student-nid"
                    type="text"
                    required
                    pattern="[0-9]{10}"
                    value={studentForm.nationalId}
                    onChange={(e) => setStudentForm({ ...studentForm, nationalId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    placeholder="مكونة من ١٠ خانات للتحقق"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="student-class">المستوى / الصف الدراسي:</label>
                  <select
                    id="student-class"
                    value={studentForm.classroom}
                    onChange={(e) => setStudentForm({ ...studentForm, classroom: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
                    <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
                    <option value="الصف الثالث المتوسط">الصف الثالث المتوسط</option>
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                    <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="student-section">شعبة الفصل الدراسي:</label>
                  <input
                    id="student-section"
                    type="text"
                    required
                    value={studentForm.section}
                    onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    placeholder="مثال: أ أو ب أو ج"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="student-pname">اسم ولي الأمر بالكامل:</label>
                  <input
                    id="student-pname"
                    type="text"
                    required
                    value={studentForm.parentName}
                    onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    placeholder="مثال: علي بن ناصر الشبيلي"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="student-pphone">هاتف اتصال ولي الأمر الواتس:</label>
                  <input
                    id="student-pphone"
                    type="tel"
                    required
                    value={studentForm.parentPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    placeholder="مثال: +966 50 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="student-paid">الرسوم المسددة مقدماً:</label>
                  <input
                    id="student-paid"
                    type="number"
                    required
                    value={studentForm.feesPaid}
                    onChange={(e) => setStudentForm({ ...studentForm, feesPaid: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="student-rem">الأقساط المتبقية (المستحقة):</label>
                  <input
                    id="student-rem"
                    type="number"
                    required
                    value={studentForm.feesRemaining}
                    onChange={(e) => setStudentForm({ ...studentForm, feesRemaining: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="student-status">حالة القيد والمسوغ الدراسي:</label>
                  <select
                    id="student-status"
                    value={studentForm.status}
                    onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="active">نشط ومنتظم في الدراسة</option>
                    <option value="suspended">موقوف مؤقتاً بسبب مستندات أو مبالغ</option>
                    <option value="graduated">متخرج من سلك المدرسة الأكاديمي</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  إلغاء الاستمارة
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold"
                >
                  حفظ وتسجيل البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Create Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">إصدار مطالبة مالية وفاتورة قيد</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvoiceCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1" htmlFor="invoice-student">الطالب المستهدف بالمطالبة:</label>
                <select
                  id="invoice-student"
                  required
                  value={invoiceForm.studentId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">تحديد طالب من فهارس السحابة ...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.classroom})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1" htmlFor="invoice-item">بيان ووصف المطالبة (رسوم/ ملابس/ كتب):</label>
                <input
                  id="invoice-item"
                  type="text"
                  required
                  value={invoiceForm.item}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, item: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  placeholder="مثال: رسوم باص الترم الأول"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="invoice-amount">المبلغ الأساسي:</label>
                  <input
                    id="invoice-amount"
                    type="number"
                    required
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="invoice-due">تاريخ الاستحقاق الأخير:</label>
                  <input
                    id="invoice-due"
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1" htmlFor="invoice-status">حالة الفاتورة المبدئية عند الإصدار:</label>
                <select
                  id="invoice-status"
                  value={invoiceForm.status}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="unpaid">تحتاج سداد (Unpaid)</option>
                  <option value="partial">مسددة جزئياً (Partial)</option>
                  <option value="paid">مسددة بالكامل وفوراً (Paid)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold"
                >
                  إصدار الفاتورة وتثبيتها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Create Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">تسجيل كادر تدريس وخدمة أكاديمية</h3>
              <button onClick={() => setShowTeacherModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTeacherSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1" htmlFor="teacher-name">أكاديمي/ اسم المعلم بالكامل:</label>
                <input
                  id="teacher-name"
                  type="text"
                  required
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  placeholder="مثال: أ. يوسف بن أحمد السلمي"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="teacher-spec">التخصص الأكاديمي الرئيسي:</label>
                  <input
                    id="teacher-spec"
                    type="text"
                    required
                    value={teacherForm.specialization}
                    onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    placeholder="مثال: علم الأحياء والكيمياء"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="teacher-salary">الراتب الشهري الأساسي:</label>
                  <input
                    id="teacher-salary"
                    type="number"
                    required
                    value={teacherForm.salary}
                    onChange={(e) => setTeacherForm({ ...teacherForm, salary: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="teacher-email">البريد الإلكتروني المهني:</label>
                  <input
                    id="teacher-email"
                    type="email"
                    required
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    placeholder="name@alnoor.edu.sa"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="teacher-phone">رقم الاتصال المباشر:</label>
                  <input
                    id="teacher-phone"
                    type="tel"
                    required
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    placeholder="+966 5x xxx xxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="teacher-classes">الفصل الرئيسي المسند له:</label>
                  <input
                    id="teacher-classes"
                    type="text"
                    required
                    value={teacherForm.assignedClasses}
                    onChange={(e) => setTeacherForm({ ...teacherForm, assignedClasses: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none font-semibold"
                    placeholder="الجدول الأكاديمي مثال: الصف الأول الثانوي"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1" htmlFor="teacher-status">حالة التعاقد والمباشرة كلياً:</label>
                  <select
                    id="teacher-status"
                    value={teacherForm.status}
                    onChange={(e) => setTeacherForm({ ...teacherForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="active">على رأس العمل / مباشر بالكامل</option>
                    <option value="on_leave">مستفيد من إجازة مع تفرغ مؤقت</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  تعيين وتأمين القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. School Uniform Management Modal */}
      {showUniformModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-800 to-slate-950 text-white px-6 py-4.5 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-[#fce29a]">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">البوابة المتطورة لإدارة الزي المدرسي واللبس الموحد</h3>
                  <p className="text-[10px] text-slate-400 font-medium">مستودع الألبسة المدرسية الموحدة وتوزيع الأطقم على الطلبة حياً</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUniformModal(false)} 
                className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              
              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">إجمالي المخزون المتوفر</span>
                  <span className="text-lg font-black text-slate-900 mt-1 block">
                    {uniformInventory.reduce((acc, u) => acc + u.stock, 0).toLocaleString('ar-EG')} قطعة لباس
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">الأصناف المنخفضة المخزون</span>
                  <span className="text-lg font-black text-rose-600 mt-1 block">
                    {uniformInventory.filter(u => u.stock <= u.alertLimit).length} أصناف حرجة
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">إجمالي مبيعات/صرف الزي</span>
                  <span className="text-lg font-black text-emerald-600 mt-1 block">
                    {uniformAllocationHistory.reduce((acc, u) => acc + u.total, 0).toLocaleString('ar-EG')} د.ل
                  </span>
                </div>
              </div>

              {/* Grid content: Inventory list & Allocation Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Right Area: Inventory Table (7 columns) */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-amber-500 rounded-sm" />
                    مستودع الألبسة والزي الموحد بالفرع
                  </h4>

                  <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                    <table className="w-full text-right border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <th className="p-3">صنف الزي الموحد</th>
                          <th className="p-3 text-center">الفئة</th>
                          <th className="p-3 text-center">سعر البيع</th>
                          <th className="p-3 text-center">المقاسات المتاحة</th>
                          <th className="p-3 text-center">المخزون الحالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {uniformInventory.map((item) => {
                          const isLow = item.stock <= item.alertLimit;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3 font-bold text-slate-800">{item.name}</td>
                              <td className="p-3 text-center text-slate-500 font-medium">{item.category}</td>
                              <td className="p-3 text-center text-slate-800 font-bold">{item.price} د.ل</td>
                              <td className="p-3 text-center font-mono text-slate-600">{item.size}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                                  isLow ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                  {item.stock} قطعة {isLow && '⚠️'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Left Area: Allocation Form (5 columns) */}
                <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 p-4.5 rounded-xl space-y-4">
                  <h4 className="font-black text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-indigo-500 rounded-sm" />
                    صرف وتسليم زي لطالب
                  </h4>

                  <div className="space-y-3.5 text-[11px]">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">اختر صنف الزي المعتمد:</label>
                      <select 
                        value={selectedUniformToAllocate}
                        onChange={(e) => setSelectedUniformToAllocate(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold"
                      >
                        {uniformInventory.map(item => (
                          <option key={item.id} value={item.id}>{item.name} ({item.price} د.ل)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">اختر الطالب المستلم:</label>
                      <select 
                        value={allocateToStudentId}
                        onChange={(e) => setAllocateToStudentId(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold"
                      >
                        {students.slice(0, 15).map(stud => (
                          <option key={stud.id} value={stud.id}>{stud.fullName} - {stud.nationalId ? 'وطني' : 'أجنبي'}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">المقاس المطلوب:</label>
                        <select 
                          value={allocateUniformSize}
                          onChange={(e) => setAllocateUniformSize(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="S">S (صغير)</option>
                          <option value="M">M (وسط)</option>
                          <option value="L">L (كبير)</option>
                          <option value="XL">XL (كبير جداً)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">الكمية المصروفة:</label>
                        <input 
                          type="number"
                          min="1"
                          max="5"
                          value={allocateUniformQty}
                          onChange={(e) => setAllocateUniformQty(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        const item = uniformInventory.find(u => u.id === selectedUniformToAllocate);
                        const stud = students.find(s => s.id === allocateToStudentId);
                        if (item && stud) {
                          if (item.stock < allocateUniformQty) {
                            triggerNotification('المخزون الحالي غير كافٍ لصرف هذه الكمية!', 'warning');
                            return;
                          }
                          // Deduct Stock
                          setUniformInventory(uniformInventory.map(u => u.id === item.id ? { ...u, stock: u.stock - allocateUniformQty } : u));
                          // Append history
                          const total = item.price * allocateUniformQty;
                          setUniformAllocationHistory([
                            {
                              id: `alloc_${Date.now()}`,
                              studentName: stud.fullName,
                              uniformName: item.name,
                              size: allocateUniformSize,
                              date: new Date().toISOString().split('T')[0],
                              qty: allocateUniformQty,
                              total: total
                            },
                            ...uniformAllocationHistory
                          ]);
                          triggerNotification(`تم تسجيل صرف وتسليم الزي المدرسي للطالب ${stud.fullName} بنجاح ✅`, 'success');
                          logAction('صرف زي مدرسي', `تم صرف زي مدرسي (${item.name}) لصالح الطالب ${stud.fullName}`, 'إدارة المخزون واللبس');
                        }
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold hover:shadow-md transition-all cursor-pointer text-center"
                    >
                      تسجيل عملية الصرف وحسم المخزون 👕
                    </button>
                  </div>
                </div>

              </div>

              {/* Allocation History Log */}
              <div className="space-y-3.5 pt-2">
                <h4 className="font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-500 rounded-sm" />
                  سجل عمليات التسليم والصرف الأخيرة
                </h4>

                <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                  <table className="w-full text-right border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-2.5">الطالب المستلم</th>
                        <th className="p-2.5">صنف الزي</th>
                        <th className="p-2.5 text-center">المقاس</th>
                        <th className="p-2.5 text-center">الكمية</th>
                        <th className="p-2.5 text-center">الإجمالي</th>
                        <th className="p-2.5 text-center">تاريخ الصرف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {uniformAllocationHistory.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-800">{log.studentName}</td>
                          <td className="p-2.5 text-slate-600">{log.uniformName}</td>
                          <td className="p-2.5 text-center font-mono">{log.size}</td>
                          <td className="p-2.5 text-center font-bold text-slate-800">{log.qty} طقم</td>
                          <td className="p-2.5 text-center font-black text-slate-900">{log.total} د.ل</td>
                          <td className="p-2.5 text-center font-mono text-slate-400">{log.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-200">
              <button 
                type="button" 
                onClick={() => setShowUniformModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Floating AI Assistant */}
      <AIAssistantPortal />
    </div>
  );
}
