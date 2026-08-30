import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
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
  ShieldCheck,
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
  userName?: string;
}

type QuickAction = {
  section: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#c5a059]/50 bg-[#fffdf8]/70 p-5 text-center">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#2a1a0e] text-amber-300">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
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
      className="group flex min-h-[132px] flex-col justify-between rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-3.5 text-right shadow-md transition-all hover:-translate-y-0.5 hover:border-[#d4af37] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#8b6508]/50"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black text-slate-700">{label}</span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2a1a0e] text-amber-300 shadow-sm transition-transform group-hover:scale-105">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </span>
      <span className="mt-2 block text-right">
        <span className="block text-2xl font-black tracking-tight text-slate-900">{value}</span>
        <span className="mt-1 block text-[10px] font-bold text-slate-500">{detail}</span>
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
          setMetricsError(error instanceof Error ? error.message : 'تعذر تحميل المؤشرات الحية.');
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
    if (metric?.status === 'live') return `مصدر حي: ${metric.source}`;
    if (metric?.message) return metric.message;
    if (metricsError) return 'تعذر تحميل المؤشر من المصدر الحي';
    return 'جار التحقق من المصدر الحي';
  };
  const studentCount = formatMetric(metrics?.students);
  const studentDetail = describeMetric(metrics?.students);
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
    { section: 'academic', label: 'الجداول الدراسية', icon: Calendar },
    { section: 'permissions_admin', label: 'المستخدمون والصلاحيات', icon: ShieldCheck },
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

      <section aria-label="مؤشرات لوحة المدرسة" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-7">
        <MetricCard label="نسبة الحضور اليوم" value={formatMetric(metrics?.attendance)} detail={describeMetric(metrics?.attendance)} icon={UserCheck} onClick={() => handleNav('attendance')} />
        <MetricCard label="إجمالي المصروفات" value={formatMetric(metrics?.finance)} detail={describeMetric(metrics?.finance)} icon={Wallet} onClick={() => handleNav('accounts')} />
        <MetricCard label="إجمالي الإيرادات" value={formatMetric(metrics?.finance)} detail={describeMetric(metrics?.finance)} icon={Coins} onClick={() => handleNav('student_accounts')} />
        <MetricCard label="الفصول الدراسية" value={formatMetric(metrics?.enrollments)} detail={describeMetric(metrics?.enrollments)} icon={GraduationCap} onClick={() => handleNav('academic')} />
        <MetricCard label="الموظفون" value={formatMetric(metrics?.teachers)} detail={describeMetric(metrics?.teachers)} icon={Users} onClick={() => handleNav('teachers')} />
        <MetricCard label="المعلمون" value={formatMetric(metrics?.teachers)} detail={describeMetric(metrics?.teachers)} icon={UserCheck} onClick={() => handleNav('teachers')} />
        <MetricCard label="إجمالي الطلاب" value={studentCount} detail={studentDetail} icon={Users} onClick={() => handleNav('students')} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] p-5 shadow-lg lg:col-span-4">
          <div className="mb-4 flex items-center gap-2 border-b border-amber-900/10 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2a1a0e] text-amber-400"><ShieldCheck className="h-4 w-4" aria-hidden="true" /></div>
            <h3 className="text-sm font-black text-slate-900">تنبيهات اليوم</h3>
          </div>
          <EmptyPanel title="لا توجد تنبيهات موثقة" description="لم يتم تمرير مصدر Notifications حي إلى Dashboard، لذلك لا تُعرض أرقام أو تنبيهات ثابتة." />
        </div>

        <div className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] p-5 shadow-lg lg:col-span-8">
          <div className="mb-4 flex items-center gap-2 border-b border-amber-900/10 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2a1a0e] text-amber-400"><Grid2X2 className="h-4 w-4" aria-hidden="true" /></div>
            <h3 className="text-sm font-black text-slate-900">الاختصارات الرئيسية</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {quickActions.filter(({ section }) => canAccessSection(section)).map(({ section, label, icon: Icon }) => (
              <button
                key={`${section}-${label}`}
                type="button"
                onClick={() => handleNav(section)}
                className="flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-white to-[#fbf8f0] p-3.5 text-center transition-all hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#8b6508]/50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a1a0e] text-amber-300"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="text-xs font-black text-slate-800">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="تحليلات Dashboard" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] p-4 shadow-lg"><h4 className="mb-3 border-b border-amber-900/10 pb-2 text-xs font-black text-slate-900">الإيرادات والمصروفات</h4><EmptyPanel title="الرسم غير متاح" description={describeMetric(metrics?.finance)} /></div>
        <div className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] p-4 shadow-lg"><h4 className="mb-3 border-b border-amber-900/10 pb-2 text-xs font-black text-slate-900">توزيع الطلاب حسب المرحلة</h4><EmptyPanel title="الرسم غير متاح" description="لا يوجد Query حي لتوزيع المراحل والصفوف في عقد Dashboard الحالي." /></div>
        <div className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] p-4 shadow-lg"><h4 className="mb-3 border-b border-amber-900/10 pb-2 text-xs font-black text-slate-900">نسبة التحصيل الكلية</h4><EmptyPanel title="المؤشر غير متاح" description="لا تُعرض نسبة ثابتة دون إثبات Query وRLS ومصدرها في قاعدة البيانات." /></div>
        <div className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] p-4 shadow-lg"><h4 className="mb-3 border-b border-amber-900/10 pb-2 text-xs font-black text-slate-900">تحصيل الرسوم خلال الأشهر</h4><EmptyPanel title="الرسم غير متاح" description="لا يوجد مصدر مالي حي مربوط بهذه الشاشة حاليًا." /></div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] p-5 shadow-lg lg:col-span-8">
          <div className="mb-4 flex items-center justify-between border-b border-amber-900/10 pb-3"><h3 className="text-sm font-black text-slate-900">آخر العمليات المعتمدة</h3><span className="text-[10px] font-bold text-amber-800">مصدر Audit حي مطلوب</span></div>
          <EmptyPanel title="لا توجد عمليات موثقة للعرض" description="تم إخفاء السجلات التجريبية القديمة حتى لا تظهر كأنها عمليات حقيقية للمستخدم الحالي." />
        </div>
        <div className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] p-5 shadow-lg lg:col-span-4">
          <div className="mb-4 flex items-center justify-between border-b border-amber-900/10 pb-3"><h3 className="text-sm font-black text-slate-900">جدول اليوم</h3><Calendar className="h-4 w-4 text-amber-800" aria-hidden="true" /></div>
          <EmptyPanel title="لا يوجد جدول موثق" description="لم يتم ربط جدول اليوم بجدول أكاديمي حي ضمن نطاق Dashboard." />
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-[#d4af37]/50 bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] p-4 text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2a1a0e] text-amber-300"><Sparkles className="h-6 w-6" aria-hidden="true" /></div>
          <div><h4 className="flex items-center gap-1.5 text-sm font-black text-amber-200">المساعد الذكي SchoolForManus</h4><p className="mt-0.5 text-xs font-bold text-amber-100/80">يفتح المسار المخصص للمساعد دون ادعاء تنفيذ تحليل غير مربوط بمصدر.</p></div>
        </div>
        <button type="button" onClick={() => handleNav('ai_assistant')} className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c58a22] px-4 py-1.5 text-xs font-black text-[#1a100a] shadow transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-amber-200/70"><span>فتح المساعد</span><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /></button>
      </section>
    </div>
  );
}
