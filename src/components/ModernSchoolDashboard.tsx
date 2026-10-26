import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  Bus,
  CheckCircle2,
  Clock,
  Coins,
  Container,
  CreditCard,
  FileBadge2,
  Grid2X2,
  GraduationCap,
  Mail,
  Search,
  Settings,
  ShieldCheck,
  Shirt,
  Sparkles,
  UserCheck,
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

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#c5a059]/50 bg-[#fffdf8]/70 p-3 text-center">
      <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#2a1a0e] text-amber-300">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <h4 className="text-xs font-black text-slate-800">{title}</h4>
      <p className="mt-1 text-[10px] font-bold leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

function MetricCard({
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
      className="group flex min-h-[96px] flex-col justify-between rounded-xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-2.5 text-right shadow-md transition-all hover:-translate-y-0.5 hover:border-[#d4af37] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#8b6508]/50"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black text-slate-700">{label}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2a1a0e] text-amber-300 shadow-sm transition-transform group-hover:scale-105">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </span>
      <span className="mt-1 block text-right">
        <span className="block text-xl font-black tracking-tight text-slate-900">{value}</span>
        <span className="mt-0.5 block text-[10px] font-bold text-slate-500">{detail}</span>
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
    setMetrics(null);
    setMetricsError(null);
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
          setMetricsError(error instanceof Error ? error.message : 'تعذر تحميل المؤشرات الحية.');
        }
      });
    return () => controller.abort();
  }, [selectedSchool.id, selectedBranch?.id]);

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
  const expenseMetric = metrics?.expenses || metrics?.finance;
  const revenueExpenseValue = `${formatMetric(revenueMetric)} / ${formatMetric(expenseMetric)}`;
  const collectionRateMetric = metrics?.collectionRate;
  const collectionRateValue = collectionRateMetric?.status === 'live' && collectionRateMetric.count !== null
    ? `${collectionRateMetric.count.toLocaleString('ar-EG', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
    : '—';
  const collectionRateDetail = collectionRateMetric?.status === 'live'
    ? 'نسبة المسدد من المطالبات النشطة'
    : isCustomerProductionPortal
      ? 'بيانات التحصيل غير متاحة حالياً.'
      : collectionRateMetric?.message || (metricsError ? 'تعذر تحميل مؤشر التحصيل الآن.' : 'جار التحقق من مصدر التحصيل الحي.');
  const handleNav = (section: string) => {
    if (!canAccessSection(section)) {
      triggerNotification('لا تملك الصلاحية الموثقة لفتح هذه الوحدة.', 'warning');
      return;
    }
    setActiveSection(section);
  };

  const quickActions: QuickAction[] = [
    { section: 'students', label: 'شؤون الطلاب', icon: GraduationCap },
    { section: 'accounts', label: 'الحسابات', icon: Wallet },
    { section: 'academic', label: 'الأكاديمية', icon: BookOpen },
    { section: 'exams', label: 'الامتحانات والنتائج', icon: FileBadge2 },
    { section: 'teachers', label: 'الموارد البشرية', icon: Users },
    { section: 'student_accounts', label: 'الرسوم الدراسية', icon: CreditCard },
    { section: 'ai_assistant', label: 'المساعد الذكي', icon: Mail },
    { section: 'inventory', label: 'المخازن والمشتريات', icon: Container },
    { section: 'academic_timetable', label: 'الجداول الدراسية', icon: Calendar },
    { section: 'school_transport', label: 'النقل والترحيل', icon: Bus },
    { section: 'school_uniform', label: 'الزي المدرسي', icon: Shirt },
    { section: 'school_users_admin', label: 'المستخدمون والصلاحيات', icon: ShieldCheck },
    { section: 'school_branding', label: 'هوية المدرسة والشعار', icon: Settings },
  ];

  return (
    <div
      id="schoolformanus-dashboard"
      className="w-full min-h-full space-y-3 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] p-2 text-right font-sans text-slate-900 transition-all duration-300 sm:p-3"
      dir="rtl"
    >
      <header className="relative -mt-1 grid grid-cols-1 items-center gap-2.5 overflow-hidden rounded-xl border border-[#d4af37]/35 bg-[#fffdf8]/95 p-2.5 text-slate-900 shadow-md sm:p-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-3">
        <div className="relative z-10 flex items-center gap-2.5 lg:min-w-[188px]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#2a1a0e] text-sm font-black text-amber-300 shadow">SF</div>
          <div>
            <h1 className="text-base font-black text-slate-900 sm:text-lg">لوحة القيادة</h1>
            <p className="text-[11px] font-bold tracking-wide text-slate-500">مركز القيادة وإدارة المدارس</p>
          </div>
        </div>

        <div className="relative z-10 flex min-w-0 flex-wrap items-center justify-center gap-1.5 sm:gap-2 lg:justify-start">
          <div className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/25 bg-[#f7f0df] px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-inner">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[#8b6508]" aria-hidden="true" />
            <span>{selectedSchool.academicYear || 'غير محدد'}</span>
            <span className="text-[10px] text-slate-500">العام الدراسي</span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-[#d4af37]/25 bg-[#f7f0df] px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-inner">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-[#8b6508]" aria-hidden="true" />
            <span>{selectedSchool.name || 'المدرسة الحالية'}</span>
            <span className="truncate text-[10px] text-slate-500">{selectedBranch?.name || 'الفرع الموثوق'}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/25 bg-[#f7f0df] px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-inner">
            <Clock className="h-3.5 w-3.5 shrink-0 text-[#8b6508]" aria-hidden="true" />
            <span>{dateString}</span>
            <span className="font-mono text-[10px] text-[#8b6508]">{timeString}</span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-end gap-1.5 sm:gap-2 lg:min-w-[188px]">
          <button
            type="button"
            onClick={() => handleNav('students')}
            disabled={!canAccessSection('students')}
            aria-disabled={!canAccessSection('students')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#2a1a0e] text-[#8b6508] shadow transition-all hover:scale-105 hover:border-[#8b6508] focus:outline-none focus:ring-2 focus:ring-[#8b6508]/50"
            title="البحث في شؤون الطلاب"
            aria-label="البحث في شؤون الطلاب"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/40 bg-[#f7f0df] px-2.5 py-1 shadow-md">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#d4af37] to-[#fce79a] text-[11px] font-black text-[#2a1d0f]">{userName.slice(0, 2)}</div>
            <div className="hidden text-right sm:block">
              <span className="block text-xs font-black leading-tight text-slate-900">{userName}</span>
              <span className="block text-[10px] font-bold text-slate-500">{roleInfo.label}</span>
            </div>
          </div>
        </div>
      </header>

      <section aria-label="مؤشرات لوحة المدرسة" className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-5">
        <MetricCard label="نسبة الحضور اليوم" value={formatMetric(metrics?.attendance)} detail={describeMetric(metrics?.attendance)} icon={UserCheck} onClick={() => handleNav('attendance')} />
        <MetricCard label="إجمالي المصروفات" value={formatMetric(expenseMetric)} detail={describeMetric(expenseMetric)} icon={Wallet} onClick={() => handleNav('accounts')} />
        <MetricCard label="إجمالي الإيرادات" value={formatMetric(revenueMetric)} detail={describeMetric(revenueMetric)} icon={Coins} onClick={() => handleNav('student_accounts')} />
        <MetricCard label="الإيرادات والمصروفات" value={revenueExpenseValue} detail="الإيرادات / المصروفات" icon={Wallet} onClick={() => handleNav('accounts')} />
        <MetricCard label="نسبة التحصيل الكلية" value={collectionRateValue} detail={collectionRateDetail} icon={CheckCircle2} onClick={() => handleNav('student_accounts')} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="rounded-2xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] p-2.5 shadow-lg lg:col-span-3">
          <div className="mb-2 flex items-center gap-2 border-b border-amber-900/10 pb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#2a1a0e] text-amber-400"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /></div>
            <h3 className="text-sm font-black text-slate-900">تنبيهات اليوم</h3>
          </div>
          <EmptyPanel title="لا توجد تنبيهات موثقة" description={isCustomerProductionPortal ? 'لا توجد تنبيهات تستدعي المتابعة اليوم.' : 'لم يتم تمرير مصدر Notifications حي إلى Dashboard، لذلك لا تُعرض أرقام أو تنبيهات ثابتة.'} />
        </div>

        <div className="rounded-2xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] p-3 shadow-lg lg:col-span-9">
          <div className="mb-3 flex items-center gap-2 border-b border-amber-900/10 pb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#2a1a0e] text-amber-400"><Grid2X2 className="h-3.5 w-3.5" aria-hidden="true" /></div>
            <h3 className="text-sm font-black text-slate-900">الوحدات الرئيسية</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {quickActions.filter(({ section }) => canAccessSection(section)).map(({ section, label, icon: Icon }) => (
              <button
                key={`${section}-${label}`}
                type="button"
                onClick={() => handleNav(section)}
                className="flex h-[78px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-white to-[#fbf8f0] p-2 text-center transition-all hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#8b6508]/50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2a1a0e] text-amber-300"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                <span className="text-[10px] font-black text-slate-800">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {canAccessSection('ai_assistant') && <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#d4af37]/50 bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] p-3 text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2a1a0e] text-amber-300"><Sparkles className="h-6 w-6" aria-hidden="true" /></div>
          <div><h4 className="flex items-center gap-1.5 text-sm font-black text-amber-200">المساعد الذكي SchoolForManus</h4><p className="mt-0.5 text-xs font-bold text-amber-100/80">يفتح المسار المخصص للمساعد دون ادعاء تنفيذ تحليل غير مربوط بمصدر.</p></div>
        </div>
        <button type="button" onClick={() => handleNav('ai_assistant')} className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c58a22] px-4 py-1.5 text-xs font-black text-[#1a100a] shadow transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-amber-200/70"><span>فتح المساعد</span><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /></button>
      </section>}
    </div>
  );
}
