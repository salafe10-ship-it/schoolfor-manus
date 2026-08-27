import { Activity, Award, BarChart3, BookOpen, BrainCircuit, Building2, Bus, CalendarCheck, ChevronLeft, ChevronRight, Coins, Container, Cpu, CreditCard, DatabaseZap, FileBadge2, FileSpreadsheet, Globe, Globe2, GraduationCap, HardDriveDownload, HeartHandshake, LayoutTemplate, Menu, MessageSquareDot, Network, Receipt, Server, Settings2, ShieldCheck, Shirt, ShoppingBag, Sparkles, Target, UserPlus, UserSquare, Users, WalletCards, Workflow, Zap } from 'lucide-react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { School, UserRole } from '../types';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  activeSchool: School;
  currentRole: UserRole;
  isSupabaseConnected: boolean;
  isSuperAdminPortalActive: boolean;
  setIsSuperAdminPortalActive: (v: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

export default function Sidebar({ 
  activeSection, 
  setActiveSection, 
  activeSchool, 
  currentRole,
  isSupabaseConnected,
  isSuperAdminPortalActive,
  setIsSuperAdminPortalActive,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  
  const [activeEmployeeId, setActiveEmployeeId] = React.useState(() => {
    return localStorage.getItem('active_employee_id') || '';
  });

  const [modulesVer, setModulesVer] = React.useState(0);

  React.useEffect(() => {
    const handleStorageChange = () => {
      setActiveEmployeeId(localStorage.getItem('active_employee_id') || '');
      setModulesVer(v => v + 1);
    };
    const handleModulesChanged = () => {
      setModulesVer(v => v + 1);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('active-employee-changed', handleStorageChange);
    window.addEventListener('erp_modules_config_changed', handleModulesChanged);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('active-employee-changed', handleStorageChange);
      window.removeEventListener('erp_modules_config_changed', handleModulesChanged);
    };
  }, []);

  // Navigation groupings resembling a professional administrative console
  const navGroups = [
    {
      title: 'الرئيسية والإشراف',
      items: [
        { id: 'dashboard', label: 'لوحة التحكم العامة', icon: BarChart3 },
        { id: 'ai_assistant', label: 'المساعد الذكي (AI)', icon: Sparkles },
        { id: 'branches', label: 'الفروع والمدارس', icon: Building2 },
      ]
    },
    {
      title: 'الخدمات الطلابية والتعليمية',
      items: [
        { id: 'academic', label: 'الشؤون الأكاديمية والخطط', icon: BookOpen },
        { id: 'students', label: 'شؤون الطلاب', icon: GraduationCap },
        { id: 'admissions', label: 'القبول والتسجيل', icon: UserPlus },
        { id: 'parents', label: 'أولياء الأمور', icon: UserSquare },
        { id: 'attendance', label: 'الحضور والانصراف', icon: CalendarCheck },
        { id: 'exams', label: 'الامتحانات والنتائج', icon: FileBadge2 },
        { id: 'library', label: 'المكتبة المدرسية', icon: BookOpen },
      ]
    },
    {
      title: 'الموظفون والمالية',
      items: [
        { id: 'teachers', label: 'المعلمون والموظفون', icon: Users },
        { id: 'accounts', label: 'الحسابات العامة', icon: WalletCards },
        { id: 'treasury', label: 'الخزانة والمدفوعات البنكية', icon: Coins },
        { id: 'financial_reports', label: 'التقارير المالية', icon: FileSpreadsheet },
        { id: 'student_accounts', label: 'الرسوم والأقساط', icon: CreditCard },
      ]
    },
    {
      title: 'التشغيل والمرافق',
      items: [
        { id: 'inventory', label: 'إدارة المخزون والعهد', icon: Container },
        { id: 'procurement', label: 'إدارة المشتريات والتوريدات', icon: ShoppingBag },
        { id: 'fixed_assets', label: 'إدارة الأصول الثابتة والعهد', icon: Building2 },
        { id: 'buses', label: 'باصات النقل والمواصلات', icon: Bus },
        { id: 'uniform_management', label: 'إدارة الزي والملابس المدرسية', icon: Shirt },
      ]
    },
    {
      title: 'بوابات الاعتماد والمطابقة (Certifications)',
      items: [
        { id: 'fixed_assets_cert', label: 'اعتماد جودة إدارة الأصول الثابتة', icon: ShieldCheck },
        { id: 'procurement_cert', label: 'اعتماد جودة المشتريات والتوريدات', icon: ShieldCheck },
        { id: 'business_logic_audit', label: 'شهادة منطق الأعمال الكامل', icon: BrainCircuit },
        { id: 'accounting_integrity', label: 'الشهادة المحاسبية', icon: Receipt },
        { id: 'security_permissions_cert', label: 'اعتماد الأمان والرقابة والصلاحيات', icon: ShieldCheck },
        { id: 'uiux_golden_standard_cert', label: 'اعتماد المعايير الذهبية وتوحيد الواجهات (UI/UX)', icon: Sparkles },
        { id: 'performance_stability_cert', label: 'اعتماد الأداء والاستقرار وسرعة الاستجابة', icon: Activity },
        { id: 'maintainability_scalability_cert', label: 'اعتماد موثوقية الأكواد وقابلية التوسع', icon: Cpu },
        { id: 'zero_regression_cert', label: 'اعتماد جودة الاختبارات والحد من التراجعات البرمجية', icon: FileBadge2 },
        { id: 'production_readiness_gate', label: 'اعتماد جاهزية الإنتاج والتشغيل السحابي (القرار 43)', icon: Server },
        { id: 'docs_hardening', label: 'اعتماد التوثيق الهندسي والأرشفة التقنية (القرار 44)', icon: BookOpen },
        { id: 'wave1_certification', label: 'الاعتماد النهائي للمرحلة الأولى', icon: ShieldCheck },
        { id: 'core_system_cert', label: 'اعتماد جودة البنية والتشغيل الكامل', icon: ShieldCheck },
        { id: 'operational_excellence_cert', label: 'اعتماد الجودة والتميز التشغيلي الكلي', icon: Zap },
        { id: 'user_trust_cert', label: 'اعتماد ثقة العميل والجماليات المؤسسية', icon: HeartHandshake },
        { id: 'commercial_release', label: 'شهادة الجودة للإصدار التجاري', icon: Globe },
        { id: 'commercial_competitiveness', label: 'اعتماد التنافسية التجارية والقوة المؤسسية', icon: Sparkles },
        { id: 'product_maturity', label: 'شهادة نضج المنتج والصلابة المؤسسية', icon: Target },
        { id: 'golden_release_exec', label: 'بوابة الإصدار الذهبي الحي', icon: Award },
        { id: 'ddd_reconstruction', label: 'إعادة الهيكلة وتصميم النطاقات (DDD)', icon: Network },
        { id: 'core_certification', label: 'اعتماد البنية الأساسية', icon: LayoutTemplate },
      ]
    },
    {
      title: 'الرقابة والسحابة',
      items: [
        { id: 'audit_logs', label: 'سجلات الرقابة والعمليات', icon: Workflow },
        { id: 'permissions_admin', label: 'إدارة المستخدمين والصلاحيات', icon: ShieldCheck },
        { id: 'system_health', label: 'مركز مراقبة أداء النظام', icon: Settings2 },
        { id: 'db_schema', label: 'مخطط Supabase SQL', icon: DatabaseZap },
      ]
    }
  ];

  // Super Admin SaaS navigation groups for global control tower
  const superAdminNavGroups = [
    {
      title: 'العمليات السحابية الفائقة (SaaS)',
      items: [
        { id: 'super_stats', label: 'الرقابة المركزية وتدفق الموارد', icon: BarChart3 },
        { id: 'super_schools', label: 'إدارة المدارس والـ Tenants', icon: Building2 },
        { id: 'super_rbac', label: 'مصفوفة الحوكمة والـ RBAC', icon: ShieldCheck },
      ]
    },
    {
      title: 'الرقمنة والأمن المتقدم',
      items: [
        { id: 'super_security', label: 'الأمان المطور والتهديدات', icon: Globe2 },
        { id: 'super_backups', label: 'مستودع النسخ ومكافحة الكوارث', icon: HardDriveDownload },
      ]
    },
    {
      title: 'الباقات والتحكم والعتاد',
      items: [
        { id: 'super_finance', label: 'علاقات الخطط والاستحقاق', icon: WalletCards },
        { id: 'super_infra', label: 'البنية السحابية والمؤشرات', icon: DatabaseZap },
      ]
    }
  ];

  const isFeatureEnabled = (itemId: string, school: School) => {
    // 1. Check operations center central registry first
    try {
      const savedModules = localStorage.getItem('erp_tenant_modules_v1');
      if (savedModules) {
        const schoolModules = JSON.parse(savedModules);
        const mapToCenterKey: Record<string, string> = {
          'students': 'students',
          'admissions': 'students',
          'parents': 'students',
          'attendance': 'students',
          'exams': 'exams',
          'teachers': 'employees',
          'accounts': 'accounts',
          'treasury': 'accounts',
          'financial_reports': 'accounts',
          'student_accounts': 'accounts',
          'inventory': 'inventory',
          'buses': 'transport',
        };
        const centerKey = mapToCenterKey[itemId];
        if (centerKey) {
          const compositeKey = `${school.id}_${centerKey}`;
          const config = schoolModules[compositeKey];
          if (config) {
            // If active is false or visible is false, it's completely hidden or inactive
            if (config.active === false || config.visible === false) {
              return false;
            }
          }
        }
      }
    } catch (e) {
      console.error('Error parsing central tenant modules:', e);
    }

    // 2. Fallback to school level feature toggles
    const features = (school as any).features;
    if (!features) return true;

    const map: Record<string, string> = {
      'students': 'students',
      'admissions': 'students',
      'parents': 'students',
      'attendance': 'students',
      'exams': 'exams',
      'library': 'library',
      'teachers': 'teachers',
      'accounts': 'accounts',
      'treasury': 'accounts',
      'financial_reports': 'accounts',
      'student_accounts': 'student_accounts',
      'inventory': 'inventory',
      'buses': 'buses',
      'uniform_management': 'uniform_management',
      'db_schema': 'db_schema',
      'permissions_admin': 'permissions_admin',
    };

    const featureKey = map[itemId];
    if (!featureKey) return true;
    return features[featureKey] !== false;
  };

  const activeNavGroupsRaw = isSuperAdminPortalActive && currentRole === 'SuperAdmin' 
    ? superAdminNavGroups 
    : navGroups;

  // Filter navigation items based on the simulation permissions and school features
  const activeNavGroups = currentRole === 'SuperAdmin' && isSuperAdminPortalActive
    ? activeNavGroupsRaw
    : activeNavGroupsRaw.map(group => {
        return {
          ...group,
          items: group.items.filter(item => {
            // Strictly exclude developer-centric, certification, and database-centric tools from the school workspace
            const technicalOrCertIds = [
              'system_health', 'db_schema', 'core_certification', 'business_logic_audit', 
              'accounting_integrity', 'security_permissions_cert', 'uiux_golden_standard_cert', 
              'performance_stability_cert', 'maintainability_scalability_cert', 'zero_regression_cert', 
              'production_readiness_gate', 'docs_hardening', 'wave1_certification', 
              'core_system_cert', 'operational_excellence_cert', 'user_trust_cert', 
              'commercial_release', 'commercial_competitiveness', 'product_maturity', 
              'golden_release_exec', 'ddd_reconstruction'
            ];
            if (!isSuperAdminPortalActive && technicalOrCertIds.includes(item.id)) {
              return false;
            }

            // First check if the feature is enabled for this school
            if (!isSuperAdminPortalActive && !isFeatureEnabled(item.id, activeSchool)) {
              return false;
            }

            // SuperAdmin bypasses all restriction unless simulating normal roles
            if (currentRole === 'SuperAdmin' && !localStorage.getItem('active_employee_id')) return true;

            const savedEmployees = localStorage.getItem('edupro_employees_permissions_v1');
            const activeEmpId = localStorage.getItem('active_employee_id') || '';
            
            if (!savedEmployees) return true; // Default to true if not initialized yet
            
            try {
              const employeesList = JSON.parse(savedEmployees);
              const activeEmp = employeesList.find((e: any) => e.id === activeEmpId);
              if (!activeEmp) return true;
              if (activeEmp.permissions.includes('*')) return true;

              // Map sidebar itemId to permission matrix Category and Screen IDs
              const mapper: Record<string, { catId: string, scrId: string }> = {
                'dashboard': { catId: 'dashboard', scrId: 'main' },
                'ai_assistant': { catId: 'dashboard', scrId: 'ai_assistant' },
                'branches': { catId: 'dashboard', scrId: 'branches' },
                'students': { catId: 'students', scrId: 'browse_students' },
                'admissions': { catId: 'students', scrId: 'admissions_inbox' },
                'parents': { catId: 'parent', scrId: 'parent_directory' },
                'attendance': { catId: 'attendance', scrId: 'daily_roll' },
                'exams': { catId: 'exams', scrId: 'exams_dashboard' },
                'library': { catId: 'library', scrId: 'book_catalog' },
                'teachers': { catId: 'teachers', scrId: 'teachers_directory' },
                'accounts': { catId: 'accounts', scrId: 'chart_of_accounts' },
                'treasury': { catId: 'treasury', scrId: 'treasury_vault' },
                'financial_reports': { catId: 'financial_reports', scrId: 'trial_balance' },
                'student_accounts': { catId: 'fees', scrId: 'define_fees' },
                'inventory': { catId: 'inventory', scrId: 'inventory_stock' },
                'buses': { catId: 'buses', scrId: 'bus_routes' },
                'uniform_management': { catId: 'uniform_management', scrId: 'uniform_sales' },
                'audit_logs': { catId: 'audit_logs', scrId: 'audit_logs' },
                'permissions_admin': { catId: 'permissions_admin', scrId: 'permissions_matrix' },
                'system_health': { catId: 'system_health', scrId: 'system_monitoring' },
                'db_schema': { catId: 'db_schema', scrId: 'database_editor' },
              };

              const map = mapper[item.id];
              if (!map) return true; // Allow system defaults if unmapped

              const visibilityKey = `${map.catId}:${map.scrId}:visibility`;
              const viewKey = `${map.catId}:${map.scrId}:view`;

              return activeEmp.permissions.includes(visibilityKey) || activeEmp.permissions.includes(viewKey);
            } catch (e) {
              return true;
            }
          })
        };
      }).filter(group => group.items.length > 0);

  const getRoleBadgeColor = (role: UserRole) => {
    switch(role) {
      case 'SuperAdmin': return 'bg-rose-950/60 text-rose-300 border-rose-900/60';
      case 'SchoolAdmin': return 'bg-orange-950/60 text-orange-300 border-orange-900/60';
      case 'Teacher': return 'bg-emerald-950/60 text-emerald-300 border-emerald-900/60';
      case 'Accountant': return 'bg-amber-950/60 text-amber-300 border-amber-900/60';
      case 'Parent': return 'bg-amber-950/60 text-amber-300 border-amber-900/60';
      case 'Control': return 'bg-rose-950/60 text-rose-300 border-rose-900/60';
      case 'Auditor': return 'bg-cyan-950/60 text-cyan-300 border-cyan-900/60';
      case 'Student': return 'bg-slate-950/60 text-slate-300 border-slate-900/60';
    }
  };

  const getRoleNameArabic = (role: UserRole) => {
    switch(role) {
      case 'SuperAdmin': return 'المدير الفائق للنظام';
      case 'SchoolAdmin': return 'مدير المدرسة الرئيسي';
      case 'Teacher': return 'عضو هيئة التدريس';
      case 'Accountant': return 'المدير المالي والرواتب';
      case 'Parent': return 'ولي أمر الطالب';
      case 'Control': return 'لجنة الامتحانات';
      case 'Auditor': return 'المراجع الرقابي';
      case 'Student': return 'الطالب';
    }
  };

  return (
    <aside 
      id="sidebar-container" 
      className={`${
        isCollapsed ? 'w-20' : 'w-72'
      } bg-gradient-to-b from-[#181008] via-[#24170d] to-[#120a04] text-amber-100/90 border-l border-[#d4af37]/30 flex flex-col h-screen shrink-0 shadow-2xl transition-all duration-300 ease-in-out relative select-none`}
    >
      
      {/* Upper Brand / School Info */}
      <div id="sidebar-brand-section" className="p-4 border-b border-[#d4af37]/30 bg-[#130b04] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#9a6a1d] via-[#f7d174] to-[#c58a22] p-[1.5px] shadow-md shadow-[#d4af37]/20 flex items-center justify-center text-lg cursor-pointer group hover:rotate-6 transition-all shrink-0 border border-[#f7d174]/40">
              <div className="w-full h-full rounded-[10px] bg-[#1f130a] flex items-center justify-center text-amber-300 font-black">
                {activeSchool.logo}
              </div>
            </div>
            {!isCollapsed && (
              <div className="transition-all duration-300">
                <span className="text-[10px] text-amber-300 font-black tracking-wide flex items-center gap-1">
                  <Globe2 className="w-3 h-3 text-[#fce79a] animate-pulse" />
                  عبدالسلام سوفت ERP
                </span>
                <h1 className="text-sm font-black text-[#fce79a] truncate max-w-[150px]" title={activeSchool.name}>
                  {activeSchool.name}
                </h1>
              </div>
            )}
          </div>

          <button 
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-[#2a1d13] hover:bg-[#3d2b1c] border border-[#d4af37]/30 text-amber-300 hover:text-amber-100 transition-all cursor-pointer"
            title={isCollapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Portal Switching Panel for SuperAdmins */}
        {currentRole === 'SuperAdmin' && !isCollapsed && (
          <div className="grid grid-cols-2 gap-1 bg-[#1a1108] p-1 rounded-lg border border-[#d4af37]/30 transition-all">
            <button
              type="button"
              onClick={() => {
                setIsSuperAdminPortalActive(true);
                setActiveSection('super_stats');
              }}
              className={`py-1 px-1 rounded text-[9px] font-black transition-all ${
                isSuperAdminPortalActive 
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#9a6a1d] text-[#1a100a] shadow font-black' 
                  : 'text-amber-200/70 hover:text-amber-100 hover:bg-[#2d1e12]/60'
              }`}
            >
              الرقابة السحابية 🚀
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSuperAdminPortalActive(false);
                setActiveSection('dashboard');
              }}
              className={`py-1 px-1 rounded text-[9px] font-black transition-all ${
                !isSuperAdminPortalActive 
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#9a6a1d] text-[#1a100a] shadow font-black' 
                  : 'text-amber-200/70 hover:text-amber-100 hover:bg-[#2d1e12]/60'
              }`}
            >
              إدارة المدرسة 🏫
            </button>
          </div>
        )}

        {/* Impersonation Indicator (Current User / Role Mode) */}
        {!isCollapsed && (
          <div className="mt-1 bg-[#1a1108] border border-[#d4af37]/30 p-2.5 rounded-lg flex flex-col gap-1.5 transition-all">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-amber-200/70">الدور الفعلي:</span>
              <span className={`px-2 py-0.2 rounded-full text-[9px] font-black border ${getRoleBadgeColor(currentRole)}`}>
                {currentRole}
              </span>
            </div>
            <div className="text-xs text-[#fce79a] font-bold">
              {getRoleNameArabic(currentRole)}
            </div>
            
            {/* Cloud Sync Status (Only visible to central Super Admin Portal) */}
            {isSuperAdminPortalActive && (
              <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-[#d4af37]/20 text-[10px]">
                <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-amber-200/80 truncate">
                  {isSupabaseConnected ? 'سحاب مستقر Supabase' : 'سلسلة محلية منقطعة'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Navigation Items */}
      <div id="sidebar-nav-groups" className="flex-1 px-3 py-4 space-y-5 overflow-y-auto overflow-x-hidden">
        {activeNavGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            {!isCollapsed ? (
              <h2 className="text-[10px] font-black text-[#d4af37] tracking-wider pr-2 uppercase">
                {group.title}
              </h2>
            ) : (
              <div className="border-t border-[#d4af37]/20 my-2 pt-1" />
            )}
            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'
                    } text-xs text-right transition-all group ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#9a6a1d] via-[#c58a22] to-[#8b6113] text-[#fff8d6] font-black shadow-lg shadow-[#d4af37]/20 border border-[#f7d174]/40' 
                        : 'text-amber-100/70 hover:bg-[#2d1f14]/80 hover:text-[#fce79a] hover:border-[#d4af37]/30 border border-transparent'
                    }`}
                    title={item.label}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-[#fce79a] scale-110' : 'text-amber-300/60 group-hover:text-amber-200 group-hover:scale-110'
                    }`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {!isCollapsed && (
        <div className="mx-3 my-4 p-3.5 bg-gradient-to-br from-[#2a1d13] to-[#170e07] border border-[#d4af37]/30 text-right relative overflow-hidden select-none">
          <div className="absolute top-0 left-0 w-20 h-20 bg-[#d4af37]/10 rounded-full blur-xl pointer-events-none" />
          <h4 className="text-xs font-black text-[#fce79a] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            الدعم الفني المباشر
          </h4>
          <p className="text-[10px] text-amber-200/70 mt-1 leading-normal font-medium">
            هل تحتاج لمساعدة؟ فريق عبدالسلام سوفت جاهز لخدمتك على مدار الساعة
          </p>
          <button
            type="button"
            className="mt-3 w-full bg-gradient-to-r from-[#f7d174] to-[#d4af37] hover:from-[#ffe29a] hover:to-[#f7d174] text-slate-950 text-[10px] font-black py-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>تواصل الآن</span>
          </button>
        </div>
      )}

      {/* Footer Legal & Info */}
      <div id="sidebar-footer-info" className="p-3 border-t border-[#d4af37]/20 bg-[#0f0702] text-center text-[10px] text-amber-300/60 leading-tight">
        {isCollapsed ? (
          <span className="font-bold text-amber-400">v4.5</span>
        ) : (
          <>
            <p className="text-amber-200/80 font-bold">عبدالسلام سوفت • v4.5 ERP</p>
            <p className="text-[9px] text-amber-300/50 mt-0.5">حقوق النشر &copy; ٢٠٢٦</p>
          </>
        )}
      </div>
    </aside>
  );
}
