import { BarChart3, BookOpen, Building2, Bus, CalendarCheck, ChevronDown, Container, DatabaseZap, FileBadge2, FileSpreadsheet, Globe2, GraduationCap, HardDriveDownload, MessageSquareDot, Settings2, ShieldCheck, Shirt, UserSquare, Users, WalletCards, Workflow } from 'lucide-react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { School, UserRole } from '../types';

interface TopNavigationProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  activeSchool: School;
  currentRole: UserRole;
  isSupabaseConnected: boolean;
  isSuperAdminPortalActive: boolean;
  setIsSuperAdminPortalActive: (v: boolean) => void;
}

export default function TopNavigation({ 
  activeSection, 
  setActiveSection, 
  activeSchool, 
  currentRole,
  isSupabaseConnected,
  isSuperAdminPortalActive,
  setIsSuperAdminPortalActive
}: TopNavigationProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Navigation groupings resembling a professional administrative console
  const navGroups = [
    {
      title: 'الرئيسية والإشراف',
      items: [
        { id: 'dashboard', label: 'لوحة التحكم العامة', icon: BarChart3 },
        { id: 'branches', label: 'الفروع والمدارس', icon: Building2 },
      ]
    },
    {
      title: 'الخدمات الطلابية والتعليمية',
      items: [
        { id: 'students', label: 'شؤون الطلاب', icon: GraduationCap },
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
        { id: 'accounts', label: 'الحسابات العامة والدفع', icon: WalletCards },
      ]
    },
    {
      title: 'التشغيل والمرافق',
      items: [
        { id: 'inventory', label: 'إدارة المخزون والعهد', icon: Container },
        { id: 'school_transport', label: 'إدارة النقل والترحيل المدرسي', icon: Bus },
        { id: 'school_uniform', label: 'إدارة الزي المدرسي', icon: Shirt },
      ]
    },
    {
      title: 'الرقابة والسحابة',
      items: [
        { id: 'audit_logs', label: 'سجلات الرقابة والعمليات', icon: Workflow },
        { id: 'general_review', label: 'المراجعة العامة — قيد التجهيز', icon: ShieldCheck },
        { id: 'settings', label: 'إعدادات النظام العامة', icon: Settings2 },
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
        { id: 'super_finance', label: 'علاقات الخطط والاستحقاق المالي', icon: WalletCards },
        { id: 'super_infra', label: 'البنية السحابية والمؤشرات الحية', icon: DatabaseZap },
      ]
    }
  ];

  const activeNavGroupsRaw = isSuperAdminPortalActive && currentRole === 'SuperAdmin' 
    ? superAdminNavGroups 
    : navGroups;

  // Filter out system configurations if not in central SaaS portal or if not SuperAdmin
  const activeNavGroups = (currentRole === 'SuperAdmin' && isSuperAdminPortalActive)
    ? activeNavGroupsRaw
    : activeNavGroupsRaw.map(group => {
        return {
          ...group,
          items: group.items.filter(item => {
            // Strictly exclude developer-centric and database-centric tools from the school workspace
            if (!isSuperAdminPortalActive && (item.id === 'db_schema' || item.id === 'system_health')) {
              return false;
            }
            // For non-SuperAdmins, filter out system configurations from "الرقابة والسحابة"
            if (currentRole !== 'SuperAdmin' && group.title === 'الرقابة والسحابة') {
              return item.id === 'audit_logs' || item.id === 'general_review';
            }
            return true;
          })
        };
      }).filter(group => group.items.length > 0);

  const getRoleBadgeColor = (role: UserRole) => {
    switch(role) {
      case 'SuperAdmin': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'SchoolAdmin': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Teacher': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Accountant': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Parent': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Control': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Auditor': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Student': return 'bg-slate-100 text-slate-700 border-slate-200';
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
    <nav id="top-navigation-panel" className="bg-slate-900 text-slate-200 border-b border-slate-800 flex flex-col w-full shadow-lg shrink-0 transition-all duration-300 z-30">
      
      {/* Tier 1: Brand Info, Portal Switches, and Status Badges */}
      <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Brand identity on the right */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-xl shadow-md cursor-pointer group hover:rotate-6 transition-all">
            {activeSchool.logo}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-yellow-400 font-bold tracking-wide flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5 animate-pulse" />
                نظام سحاب السحابي
              </span>
              <span className="text-[9px] text-slate-500 font-semibold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">v4.2</span>
            </div>
            <h1 className="text-sm font-bold text-white truncate max-w-[200px]" title={activeSchool.name}>
              {activeSchool.name}
            </h1>
          </div>
        </div>

        {/* Portal Switching for SuperAdmins (Middle Area) */}
        {currentRole === 'SuperAdmin' && (
          <div className="flex items-center bg-slate-900 p-1 border border-slate-800 shrink-0">
            <button
              onClick={() => {
                setIsSuperAdminPortalActive(true);
                setActiveSection('super_stats');
              }}
              className={`py-1.5 px-4 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                isSuperAdminPortalActive 
                  ? 'bg-yellow-600 text-white shadow-md font-bold' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              🚀 الرقابة السحابية SaaS
            </button>
            <button
              onClick={() => {
                setIsSuperAdminPortalActive(false);
                setActiveSection('dashboard');
              }}
              className={`py-1.5 px-4 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                !isSuperAdminPortalActive 
                  ? 'bg-yellow-600 text-white shadow-md font-bold' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              🏫 إدارة المدرسة الحالية
            </button>
          </div>
        )}

        {/* Status Indicators & Impersonation on the left */}
        <div className="flex items-center gap-3.5">
          {/* Impersonation Indicator */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg">
            <span className="text-[11px] text-slate-400 font-medium">النمط:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getRoleBadgeColor(currentRole)}`}>
              {currentRole}
            </span>
            <span className="text-xs text-white font-bold hidden sm:inline">({getRoleNameArabic(currentRole)})</span>
          </div>

          {/* Cloud Connection (Only shown in central Super Admin/SaaS portal view) */}
          {isSuperAdminPortalActive && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg text-[11px]">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-300 font-medium">
                {isSupabaseConnected ? 'متصل سحابياً بـ Supabase' : 'غير متصل بالبيانات'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tier 2: Inline Horizontal Categories with Divider Strips & Seamless Scroll */}
      <div className="px-6 py-2 bg-[#1c120c] border-b border-[#d4af37]/30 flex items-center gap-6 overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth">
        {activeNavGroups.map((group, groupIdx) => (
          <div key={group.title} className="flex items-center gap-2 shrink-0">
            
            {/* Category header inside the line */}
            <span className="text-[11px] font-black text-[#d4af37] px-2 py-1 rounded bg-[#130b04] border border-[#d4af37]/30 uppercase select-none tracking-wider font-mono">
              {group.title}
            </span>

            {/* Icons list for this category */}
            <div className="flex items-center gap-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-right transition-all group ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#9a6a1d] via-[#c58a22] to-[#8b6113] text-[#fff8d6] font-bold shadow-md hover:scale-[1.01] border border-[#f7d174]/40' 
                        : 'text-amber-100/70 hover:bg-[#2e1f13] hover:text-[#fce79a]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-[#fce79a]' : 'text-amber-300/60 group-hover:text-amber-200 group-hover:scale-105'
                    }`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Separator between categories */}
            {groupIdx < activeNavGroups.length - 1 && (
              <div className="h-5 w-px bg-[#d4af37]/20 mx-1 select-none" />
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
