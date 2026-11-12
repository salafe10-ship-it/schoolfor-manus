import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Building2,
  Calendar,
  Bus,
  Coins,
  Clock,
  Container,
  CreditCard,
  FileBadge2,
  Grid2X2,
  GraduationCap,
  Search,
  Shirt,
  Users,
  Wallet,
} from 'lucide-react';
import { Branch, School, UserRole } from '../types';
import { DashboardMetric, DashboardMetrics, DashboardRepository } from './dashboard/repository/DashboardRepository';

interface ModernSchoolDashboardProps {
  students: any[];
  teachers: any[];
  invoices: any[];
  setActiveSection: (section: string) => void;
  selectedSchool: School;
  selectedBranch: Branch | null;
  currentRole: UserRole;
  triggerNotification: (msg: string, type: 'info' | 'warning' | 'success') => void;
  canAccessSection: (section: string) => boolean;
  isClientMode?: boolean;
  isCustomerProductionPortal?: boolean;
  userName?: string;
}

type QuickAction = {
  section: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function FinancialSummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[104px] items-center justify-between gap-4 rounded-2xl border-2 border-[#d4af37]/25 bg-gradient-to-br from-white to-[#fbf6e9] px-4 py-3 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#d4af37] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#8b6508]/50"
    >
      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-900">{label}</span>
        <span className="mt-1 block truncate text-[11px] font-bold text-slate-500">{detail}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span className="text-2xl font-black tracking-tight text-slate-900">{value}</span>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2a1a0e] text-amber-300 shadow-sm transition-transform group-hover:scale-105"><Icon className="h-5 w-5" aria-hidden="true" /></span>
      </span>
    </button>
  );
}

export default function ModernSchoolDashboard({
  students: _students,
  teachers: _teachers,
  invoices: _invoices,
  setActiveSection,
  selectedSchool,
  selectedBranch,
  currentRole,
  triggerNotification,
  canAccessSection,
  isClientMode: _isClientMode,
  isCustomerProductionPortal = false,
  userName = 'مستخدم المدرسة',
}: ModernSchoolDashboardProps) {
  const [timeString, setTimeString] = useState('—');
  const [dateString, setDateString] = useState('—');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setDateString(now.toLocaleDateString('ar-EG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }));
    };
    updateTime();
    const interval = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    DashboardRepository.getMetrics(controller.signal)
      .then((nextMetrics) => {
        if (!controller.signal.aborted) {
          setMetrics(nextMetrics);
          setMetricsError(null);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setMetrics(null);
          setMetricsError(error instanceof Error ? error.message : 'تعذر تحميل المؤشرات المالية.');
        }
      });
    return () => controller.abort();
  }, []);

  const roleInfo = useMemo(() => {
    switch (currentRole) {
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
  }, [currentRole]);

  const formatMetric = (metric?: DashboardMetric) => (
    metric?.status === 'live' ? (metric.count ?? 0).toLocaleString('ar-EG') : '—'
  );
  const describeMetric = (metric?: DashboardMetric) => {
    if (metric?.status === 'live') return isCustomerProductionPortal || !metric.source ? 'مؤشر محدث من سجلات المدرسة' : `مصدر حي: ${metric.source}`;
    if (metric?.status === 'unavailable') return 'البيانات غير متاحة حالياً.';
    if (metric?.message) return isCustomerProductionPortal ? 'البيانات غير متاحة حالياً.' : metric.message;
    if (metricsError) return isCustomerProductionPortal ? 'تعذر تحديث المؤشر الآن.' : 'تعذر تحميل المؤشر من المصدر الحي';
    return isCustomerProductionPortal ? 'جارٍ تحديث المؤشر' : 'جار التحقق من المصدر الحي';
  };
  const revenueMetric = metrics?.revenue || metrics?.finance;

  const handleNav = (section: string) => {
    if (!canAccessSection(section)) {
      triggerNotification('لا تملك الصلاحية الموثقة لفتح هذه الوحدة.', 'warning');
      return;
    }
    setActiveSection(section);
  };

  const quickActions: QuickAction[] = [
    { section: 'students', label: 'شؤون الطلاب', icon: GraduationCap },
    { section: 'student_accounts', label: 'الرسوم الدراسية', icon: CreditCard },
    { section: 'academic', label: 'الشؤون الأكاديمية', icon: BookOpen },
    { section: 'admissions', label: 'القبول والتسجيل', icon: GraduationCap },
    { section: 'accounts', label: 'الحسابات العامة', icon: Wallet },
    { section: 'exams', label: 'الامتحانات والنتائج', icon: FileBadge2 },
    { section: 'teachers', label: 'المعلمون والموظفون', icon: Users },
    { section: 'inventory', label: 'المخازن والمشتريات', icon: Container },
    { section: 'school_transport', label: 'النقل والترحيل', icon: Bus },
    { section: 'school_uniform', label: 'الزي المدرسي', icon: Shirt },
  ];

  return (
    <div
      id="schoolformanus-dashboard"
      className="w-full min-h-screen space-y-6 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] p-2 text-right font-sans text-slate-900 transition-all duration-300 sm:p-4 md:p-6"
      dir="rtl"
    >
      <header className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-3xl border-2 border-[#d4af37]/40 bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] p-3 text-white shadow-2xl sm:p-4">
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#f7d174]/40 bg-[#120a04] text-xl font-black text-amber-300 shadow-lg">SF</div>
          <div>
            <h1 className="bg-gradient-to-r from-[#ffe5a3] via-[#fce79a] to-[#d4af37] bg-clip-text text-xl font-black text-transparent sm:text-2xl">SchoolForManus</h1>
            <p className="text-[11px] font-bold tracking-wide text-amber-200/80">مركز القيادة وإدارة المدارس</p>
          </div>
        </div>

        <div className="relative z-10 hidden items-center gap-3 lg:flex">
          <div className="flex items-center gap-2 rounded-2xl border border-[#d4af37]/30 bg-[#2a1d13]/90 px-4 py-2 text-xs font-bold text-amber-100 shadow-inner">
            <Calendar className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span>{selectedSchool.academicYear || 'غير محدد'}</span>
            <span className="text-[10px] text-amber-300/70">العام الدراسي</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[#d4af37]/30 bg-[#2a1d13]/90 px-4 py-2 text-xs font-bold text-amber-100 shadow-inner">
            <Building2 className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span>{selectedSchool.name || 'المدرسة الحالية'}</span>
            <span className="text-[10px] text-amber-300/70">{selectedBranch?.name || 'الفرع الموثوق'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[#d4af37]/30 bg-[#2a1d13]/90 px-4 py-2 text-xs font-bold text-amber-100 shadow-inner">
            <Clock className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span>{dateString}</span>
            <span className="font-mono text-amber-400">{timeString}</span>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleNav('students')}
            disabled={!canAccessSection('students')}
            aria-disabled={!canAccessSection('students')}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d4af37]/30 bg-[#2a1d13] text-amber-300 shadow transition-all hover:scale-105 hover:border-[#f7d174] focus:outline-none focus:ring-2 focus:ring-amber-300/60"
            title="البحث في شؤون الطلاب"
            aria-label="البحث في شؤون الطلاب"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2 rounded-2xl border border-[#d4af37]/40 bg-gradient-to-r from-[#2a1d13] to-[#1e130a] px-3 py-1.5 shadow-md">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#d4af37] to-[#fce79a] text-xs font-black text-[#2a1d0f]">{userName.slice(0, 2)}</div>
            <div className="hidden text-right sm:block">
              <span className="block text-xs font-black leading-tight text-amber-100">{userName}</span>
              <span className="block text-[9.5px] font-bold text-amber-300/80">{roleInfo.label}</span>
            </div>
          </div>
        </div>
      </header>

      <section aria-label="المؤشرات المالية المختصرة" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FinancialSummaryCard
          label="الإيرادات والمصروفات"
          value={formatMetric(revenueMetric)}
          detail={describeMetric(revenueMetric)}
          icon={Coins}
          onClick={() => handleNav('accounts')}
        />
        <FinancialSummaryCard
          label="نسبة التحصيل الكلية"
          value="—"
          detail={isCustomerProductionPortal ? 'يظهر المؤشر عند اكتمال بيانات الرسوم.' : 'سيظهر المؤشر عند توفر بيانات التحصيل.'}
          icon={CreditCard}
          onClick={() => handleNav('student_accounts')}
        />
      </section>

      <section aria-labelledby="module-hub-title" className="rounded-3xl border-2 border-[#d4af37]/35 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5ede1] p-4 shadow-xl sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#d4af37]/25 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2a1a0e] text-amber-300 shadow-md"><Grid2X2 className="h-5 w-5" aria-hidden="true" /></div>
            <div>
              <h2 id="module-hub-title" className="text-lg font-black text-slate-900">الوحدات الرئيسية</h2>
              <p className="mt-1 text-xs font-bold text-slate-500">اختر الوحدة المطلوبة لفتح شاشتها وقائمتها الخاصة</p>
            </div>
          </div>
          <span className="rounded-full border border-[#d4af37]/50 bg-[#fff9e9] px-3 py-1 text-xs font-black text-[#7a5608]">10 وحدات</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {quickActions.filter(({ section }) => canAccessSection(section)).map(({ section, label, icon: Icon }) => (
            <button
              key={`${section}-${label}`}
              type="button"
              onClick={() => handleNav(section)}
              className="group flex min-h-[128px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-[#d4af37]/25 bg-white/90 p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-[#d4af37] hover:bg-[#fffaf0] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#8b6508]/50"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2a1a0e] text-amber-300 shadow-sm transition-transform group-hover:scale-105"><Icon className="h-6 w-6" aria-hidden="true" /></span>
              <span className="text-xs font-black leading-relaxed text-slate-800">{label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
