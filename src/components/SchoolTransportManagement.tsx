import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bus,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { BusRoute, Student, StudentTransportation } from '../types';
import { StudentTransportationRepository } from '../database/repositories/StudentTransportationRepository';
import { TransportationRepository } from '../database/repositories/TransportationRepository';
import EnterpriseActionToolbar from './shared/EnterpriseActionToolbar';
import { FallbackStorage } from '../database/repositories/FallbackStorage';
import { authenticatedRequest } from '../utils/authenticatedRequest';

type TransportTab = 'dashboard' | 'routes' | 'assignments' | 'safety' | 'reports';

interface SchoolTransportManagementProps {
  students: Student[];
  selectedSchoolId?: string;
  selectedSchoolName?: string;
  triggerNotification: (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  setActiveSection?: (section: string) => void;
}

const statusLabel: Record<BusRoute['status'], string> = {
  active: 'نشط في الخدمة',
  maintenance: 'قيد الصيانة',
  inactive: 'متوقف مؤقتاً',
};

const statusClass: Record<BusRoute['status'], string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  maintenance: 'bg-amber-50 text-amber-800 border-amber-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function SchoolTransportManagement({
  students,
  selectedSchoolId,
  selectedSchoolName,
  triggerNotification,
  setActiveSection,
}: SchoolTransportManagementProps) {
  const studentTransportationRepository = useMemo(() => new StudentTransportationRepository(), []);
  const transportationRepository = useMemo(() => new TransportationRepository(), []);
  const [activeTab, setActiveTab] = useState<TransportTab>('dashboard');
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  const [transportations, setTransportations] = useState<StudentTransportation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    studentId: '',
    routeNumber: '',
    pickupPoint: '',
    dropoffPoint: '',
    monthlyFees: '',
  });

  const schoolStudentIds = useMemo(() => new Set(students.map(student => student.id)), [students]);

  const mapRoute = (row: any): BusRoute => ({
    ...row,
    id: String(row.id),
    routeNumber: row.routeNumber ?? row.route_number ?? '',
    driverName: row.driverName ?? row.driver_name ?? '',
    currentStudents: Number(row.currentStudents ?? row.current_students ?? 0),
    capacity: Number(row.capacity ?? 0),
    status: row.status || 'active'
  });

  const mapAssignment = (row: any): StudentTransportation => ({
    ...row,
    id: String(row.id),
    studentId: row.studentId ?? row.student_id ?? '',
    routeNumber: row.routeNumber ?? row.route_number ?? '',
    pickupPoint: row.pickupPoint ?? row.pickup_point ?? undefined,
    dropoffPoint: row.dropoffPoint ?? row.drop_off_point ?? undefined,
    monthlyFees: Number(row.monthlyFees ?? row.monthly_fees ?? 0),
    status: row.status || 'active'
  });

  const loadTransportations = useCallback(async () => {
    if (!selectedSchoolId) {
      setTransportations([]);
      setBusRoutes([]);
      setLoadError('لا يمكن قراءة اشتراكات النقل قبل تحديد المدرسة النشطة.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError('');
    try {
      let transportationRows: StudentTransportation[];
      let routeRows: BusRoute[];
      if (FallbackStorage.isCanonicalPersistenceRequired()) {
        const [assignmentsResponse, routesResponse] = await Promise.all([
          authenticatedRequest('/api/transport/assignments'),
          authenticatedRequest('/api/transport/routes'),
        ]);
        const assignmentsPayload = await assignmentsResponse.json().catch(() => ({}));
        const routesPayload = await routesResponse.json().catch(() => ({}));
        if (!assignmentsResponse.ok || !assignmentsPayload?.success) throw new Error(assignmentsPayload?.message || 'تعذر تحميل اشتراكات النقل.');
        if (!routesResponse.ok || !routesPayload?.success) throw new Error(routesPayload?.message || 'تعذر تحميل مسارات النقل.');
        transportationRows = Array.isArray(assignmentsPayload.data) ? assignmentsPayload.data.map(mapAssignment) : [];
        routeRows = Array.isArray(routesPayload.data) ? routesPayload.data.map(mapRoute) : [];
      } else {
        const [transportationResult, routes] = await Promise.all([
          studentTransportationRepository.getAll(selectedSchoolId),
          transportationRepository.getAll(selectedSchoolId),
        ]);
        transportationRows = transportationResult.data;
        routeRows = routes;
      }
      // StudentTransportation is linked to the student master. Limit the operational
      // register to students already loaded for the active school.
      setTransportations(transportationRows.filter(record => schoolStudentIds.has(record.studentId)));
      setBusRoutes(routeRows);
    } catch (error) {
      setTransportations([]);
      setLoadError('تعذر تحميل سجل اشتراكات النقل من المصدر المركزي. أعد المحاولة بعد التحقق من الاتصال.');
    } finally {
      setIsLoading(false);
    }
  }, [schoolStudentIds, selectedSchoolId, studentTransportationRepository, transportationRepository]);

  useEffect(() => {
    void loadTransportations();
  }, [loadTransportations]);

  const routeByNumber = useMemo(
    () => new Map(busRoutes.map(route => [route.routeNumber, route])),
    [busRoutes],
  );

  const transportByStudentId = useMemo(
    () => new Map(transportations.map(record => [record.studentId, record])),
    [transportations],
  );

  const dashboard = useMemo(() => {
    const activeRoutes = busRoutes.filter(route => route.status === 'active');
    const totalCapacity = activeRoutes.reduce((total, route) => total + route.capacity, 0);
    const occupiedSeats = activeRoutes.reduce((total, route) => total + route.currentStudents, 0);
    const utilization = totalCapacity === 0 ? 0 : Math.round((occupiedSeats / totalCapacity) * 100);
    return {
      activeRoutes: activeRoutes.length,
      totalCapacity,
      occupiedSeats,
      utilization,
      subscriptions: transportations.filter(record => record.status !== 'inactive').length,
      maintenance: busRoutes.filter(route => route.status === 'maintenance').length,
    };
  }, [busRoutes, transportations]);

  const filteredAssignments = useMemo(() => {
    const normalized = searchTerm.trim().toLocaleLowerCase('ar');
    if (!normalized) return transportations;
    return transportations.filter(record => {
      const student = students.find(item => item.id === record.studentId);
      return [student?.name, student?.studentCode, student?.classroom, record.routeNumber, record.pickupPoint, record.dropoffPoint]
        .filter(Boolean)
        .some(value => String(value).toLocaleLowerCase('ar').includes(normalized));
    });
  }, [searchTerm, students, transportations]);

  const selectStudent = (studentId: string) => {
    const existing = transportByStudentId.get(studentId);
    setForm({
      studentId,
      routeNumber: existing?.routeNumber || '',
      pickupPoint: existing?.pickupPoint || '',
      dropoffPoint: existing?.dropoffPoint || '',
      monthlyFees: existing?.monthlyFees?.toString() || '',
    });
  };

  const saveAssignment = async () => {
    if (!selectedSchoolId) {
      triggerNotification('لم يتم الحفظ', 'اختر المدرسة النشطة أولاً قبل تسجيل اشتراك النقل.', 'warning');
      return;
    }
    if (!form.studentId || !form.routeNumber) {
      triggerNotification('بيانات غير مكتملة', 'حدد الطالب ومسار النقل قبل الحفظ.', 'warning');
      return;
    }

    const route = routeByNumber.get(form.routeNumber);
    if (!route || route.status !== 'active') {
      triggerNotification('المسار غير متاح', 'اختر مساراً نشطاً في الخدمة اليومية.', 'warning');
      return;
    }
    const existing = transportByStudentId.get(form.studentId);
    const assignedToRoute = transportations.filter(record => record.routeNumber === route.routeNumber && record.status !== 'inactive').length;
    if (!existing && assignedToRoute >= route.capacity) {
      triggerNotification('لا توجد مقاعد متاحة', `اكتملت السعة المسجلة للمسار ${route.routeNumber}.`, 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<StudentTransportation> = {
        studentId: form.studentId,
        routeNumber: form.routeNumber,
        pickupPoint: form.pickupPoint.trim() || undefined,
        dropoffPoint: form.dropoffPoint.trim() || undefined,
        monthlyFees: form.monthlyFees === '' ? 0 : Number(form.monthlyFees),
        status: 'active',
      };
      if (FallbackStorage.isCanonicalPersistenceRequired()) {
        const response = await authenticatedRequest(existing ? `/api/transport/assignments/${encodeURIComponent(existing.id)}` : '/api/transport/assignments', {
          method: existing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.success) throw new Error(result?.message || 'تعذر حفظ اشتراك النقل مركزيًا.');
      } else if (existing) {
        await studentTransportationRepository.update(selectedSchoolId, existing.id, payload);
      } else {
        await studentTransportationRepository.create(selectedSchoolId, payload);
      }
      triggerNotification(
        existing ? 'تم تحديث اشتراك النقل' : 'تم تسجيل اشتراك النقل',
        'تم حفظ بيانات الطالب في سجل النقل المركزي.',
        'success',
      );
      setForm({ studentId: '', routeNumber: '', pickupPoint: '', dropoffPoint: '', monthlyFees: '' });
      await loadTransportations();
    } catch (error) {
      triggerNotification('تعذر حفظ الاشتراك', 'لم يتم تغيير السجل. تحقق من اتصال المصدر المركزي ثم أعد المحاولة.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: Array<{ id: TransportTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'المؤشرات التشغيلية', icon: ClipboardList },
    { id: 'routes', label: 'الأسطول والمسارات', icon: Bus },
    { id: 'assignments', label: 'اشتراكات الطلاب', icon: UserCheck },
    { id: 'safety', label: 'السلامة والالتزام', icon: ShieldCheck },
    { id: 'reports', label: 'المتابعة والتقارير', icon: CalendarCheck },
  ];

  return (
    <div className="w-full space-y-0 text-right" dir="rtl" id="school_transport_management">
      <EnterpriseActionToolbar
        title="إدارة النقل والترحيل المدرسي"
        stats={
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] sm:text-xs">
            <span className="font-extrabold text-white">{selectedSchoolName || 'المدرسة النشطة'}</span>
            <span className="font-black text-slate-500">|</span>
            <span className="text-slate-300">مسارات نشطة: {dashboard.activeRoutes}</span>
            <span className="font-black text-slate-500">|</span>
            <span className="text-slate-300">اشتراكات مثبتة: {dashboard.subscriptions}</span>
          </div>
        }
        onNew={() => setActiveTab('assignments')}
        onRefresh={() => void loadTransportations()}
        isLoading={isLoading}
        isSaving={isSaving}
        onExit={setActiveSection ? () => setActiveSection('dashboard') : undefined}
      />

      <div className="space-y-4 p-3 sm:p-4">
        <div className="rounded-2xl border border-sky-100 bg-gradient-to-l from-sky-50 via-white to-emerald-50 px-4 py-3 text-xs text-slate-700 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>من مركز تشغيل واحد: المسار والسعة، قائمة الطلاب، نقطة الالتقاء، الرسوم، ومؤشرات السلامة.</span>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">تعرض هذه الشاشة سجلات اشتراكات الطلاب المحفوظة فقط؛ لا تُنشأ بيانات تجريبية أو حجوزات افتراضية.</p>
        </div>

        {loadError && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">
            <span>{loadError}</span>
            <button type="button" onClick={() => void loadTransportations()} className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] hover:bg-amber-100">
              <RefreshCw className="h-3.5 w-3.5" /> إعادة المحاولة
            </button>
          </div>
        )}

        <div className="flex overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition-colors ${active ? 'border-sky-600 bg-sky-50 text-sky-800' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: 'المسارات النشطة', value: dashboard.activeRoutes, note: `إجمالي المسارات: ${busRoutes.length}`, icon: Bus, tone: 'text-sky-700 bg-sky-50 border-sky-100' },
                { label: 'إشغال المقاعد', value: `${dashboard.utilization}%`, note: `${dashboard.occupiedSeats} من ${dashboard.totalCapacity} مقعد`, icon: Users, tone: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
                { label: 'اشتراكات النقل', value: dashboard.subscriptions, note: 'مرتبطة بسجل الطالب', icon: UserCheck, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
                { label: 'تنبيهات صيانة', value: dashboard.maintenance, note: dashboard.maintenance ? 'تحتاج متابعة قبل التشغيل' : 'لا توجد حافلات قيد الصيانة', icon: AlertTriangle, tone: 'text-amber-800 bg-amber-50 border-amber-100' },
              ].map(card => (
                <div key={card.label} className={`rounded-2xl border p-4 ${card.tone}`}>
                  <div className="flex items-start justify-between gap-2"><span className="text-[11px] font-black">{card.label}</span><card.icon className="h-4 w-4" /></div>
                  <div className="mt-3 text-2xl font-black">{card.value}</div>
                  <p className="mt-1 text-[10px] font-bold opacity-75">{card.note}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-black text-slate-900">جاهزية الأسطول والمسارات</h3><button type="button" onClick={() => setActiveTab('routes')} className="text-xs font-bold text-sky-700 hover:underline">عرض التفاصيل</button></div>
                <div className="space-y-3">
                  {busRoutes.length ? busRoutes.map(route => {
                    const usage = route.capacity ? Math.min(100, Math.round((route.currentStudents / route.capacity) * 100)) : 0;
                    return <div key={route.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-black text-slate-800">{route.routeNumber}</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass[route.status]}`}>{statusLabel[route.status]}</span></div>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-500"><span>{route.startPoint} ← {route.endPoint}</span><span>{route.currentStudents}/{route.capacity} مقعد</span></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className={route.status === 'active' ? 'h-full bg-sky-600' : 'h-full bg-amber-500'} style={{ width: `${usage}%` }} /></div>
                    </div>;
                  }) : <p className="py-8 text-center text-xs font-bold text-slate-400">لا توجد مسارات مسجلة في سجل الأسطول.</p>}
                </div>
              </section>
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-black text-emerald-900"><CheckCircle2 className="h-4 w-4" /> دورة تشغيل مكتملة</div>
                <ol className="mt-4 space-y-3 text-[11px] font-bold leading-5 text-emerald-900/80">
                  <li>1. اعتماد الحافلة والسائق والمسار.</li>
                  <li>2. ربط الطالب بنقطة الالتقاء والرسوم.</li>
                  <li>3. مراجعة السعة قبل بدء الرحلة.</li>
                  <li>4. توثيق السلامة والتنبيه عند الصيانة.</li>
                </ol>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-black text-slate-900">سجل الحافلات والمسارات</h3><p className="mt-1 text-[11px] font-bold text-slate-500">التحقق من السائق، نقاط الانطلاق والوصول، والسعة قبل اعتماد اشتراكات جديدة.</p></div>
            <div className="overflow-x-auto"><table className="min-w-[850px] w-full text-right text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['المسار', 'السائق والتواصل', 'خط السير', 'الإشغال', 'الحالة'].map(head => <th key={head} className="px-4 py-3 font-black">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
              {busRoutes.map(route => <tr key={route.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-black text-slate-900">{route.routeNumber}</td><td className="px-4 py-3"><div className="font-bold text-slate-800">{route.driverName}</div><div className="mt-1 font-mono text-[10px] text-slate-500">{route.driverPhone}</div></td><td className="px-4 py-3 text-slate-600"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-sky-600" />{route.startPoint} ← {route.endPoint}</span></td><td className="px-4 py-3 font-bold text-slate-700">{route.currentStudents} / {route.capacity}</td><td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass[route.status]}`}>{statusLabel[route.status]}</span></td></tr>)}
              {!busRoutes.length && <tr><td colSpan={5} className="px-4 py-10 text-center font-bold text-slate-400">لا توجد حافلات أو مسارات معتمدة حتى الآن.</td></tr>}
            </tbody></table></div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="grid gap-4 xl:grid-cols-[390px_1fr]">
            <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900"><UserCheck className="h-4 w-4 text-sky-600" /> ربط أو تعديل اشتراك طالب</div>
              <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">اختيار طالب سبق ربطه يعرض بياناته الحالية للتعديل، دون إنشاء سجل مكرر.</p>
              <div className="mt-4 space-y-3">
                <label className="block text-[11px] font-black text-slate-700">الطالب<select value={form.studentId} onChange={event => selectStudent(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-sky-500"><option value="">اختر الطالب</option>{students.map(student => <option key={student.id} value={student.id}>{student.name} — {student.classroom || 'بدون فصل'}</option>)}</select></label>
                <label className="block text-[11px] font-black text-slate-700">مسار النقل<select value={form.routeNumber} onChange={event => setForm(current => ({ ...current, routeNumber: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-sky-500"><option value="">اختر مساراً نشطاً</option>{busRoutes.filter(route => route.status === 'active').map(route => <option key={route.id} value={route.routeNumber}>{route.routeNumber} — {route.currentStudents}/{route.capacity} مقعد</option>)}</select></label>
                <label className="block text-[11px] font-black text-slate-700">نقطة الالتقاء<input value={form.pickupPoint} onChange={event => setForm(current => ({ ...current, pickupPoint: event.target.value }))} placeholder="مثال: البوابة الشمالية" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-sky-500" /></label>
                <label className="block text-[11px] font-black text-slate-700">نقطة النزول<input value={form.dropoffPoint} onChange={event => setForm(current => ({ ...current, dropoffPoint: event.target.value }))} placeholder="مثال: المدرسة الرئيسية" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-sky-500" /></label>
                <label className="block text-[11px] font-black text-slate-700">رسوم النقل الشهرية<input value={form.monthlyFees} onChange={event => setForm(current => ({ ...current, monthlyFees: event.target.value }))} type="number" min="0" placeholder="0" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-sky-500" /></label>
                <button type="button" disabled={isSaving} onClick={() => void saveAssignment()} className="w-full rounded-xl bg-sky-700 px-4 py-3 text-xs font-black text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? 'جارٍ حفظ الاشتراك...' : transportByStudentId.has(form.studentId) ? 'تحديث اشتراك النقل' : 'حفظ اشتراك النقل'}</button>
              </div>
            </section>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h3 className="text-sm font-black text-slate-900">كشف الطلاب المشتركين</h3><p className="mt-1 text-[11px] font-bold text-slate-500">{isLoading ? 'جارٍ تحميل السجل...' : `${filteredAssignments.length} سجل ظاهر من المصدر المركزي`}</p></div><label className="relative block"><Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" /><input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="بحث طالب أو مسار" className="w-52 rounded-xl border border-slate-200 py-2 pr-9 pl-3 text-xs outline-none focus:border-sky-500" /></label></div>
              <div className="overflow-x-auto"><table className="min-w-[800px] w-full text-right text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['الطالب', 'المسار', 'الالتقاء والنزول', 'الرسوم', 'الحالة'].map(head => <th key={head} className="px-4 py-3 font-black">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredAssignments.map(record => { const student = students.find(item => item.id === record.studentId); return <tr key={record.id} className="hover:bg-slate-50"><td className="px-4 py-3"><div className="font-black text-slate-900">{student?.name || 'طالب غير متاح في المدرسة النشطة'}</div><div className="mt-1 text-[10px] font-bold text-slate-500">{student?.studentCode || student?.classroom || record.studentId}</div></td><td className="px-4 py-3 font-bold text-sky-800">{record.routeNumber || 'غير محدد'}</td><td className="px-4 py-3 text-slate-600">{record.pickupPoint || '—'} <span className="px-1 text-slate-300">←</span> {record.dropoffPoint || '—'}</td><td className="px-4 py-3 font-bold text-slate-700">{(record.monthlyFees || 0).toLocaleString('ar-EG')}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${record.status === 'inactive' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>{record.status === 'inactive' ? 'غير نشط' : 'نشط'}</span></td></tr>; })}{!isLoading && !filteredAssignments.length && <tr><td colSpan={5} className="px-4 py-12 text-center font-bold text-slate-400">لا توجد اشتراكات نقل مطابقة. استخدم النموذج لإضافة أول اشتراك.</td></tr>}</tbody></table></div>
            </section>
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 lg:col-span-2"><div className="flex items-center gap-2 text-sm font-black text-amber-900"><AlertTriangle className="h-4 w-4" /> تنبيهات جاهزية الأسطول</div><p className="mt-1 text-[11px] font-bold text-amber-800/75">يُمنع اعتماد اشتراك جديد في مسار متوقف أو قيد الصيانة.</p><div className="mt-4 space-y-2">{busRoutes.filter(route => route.status !== 'active').map(route => <div key={route.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-xs"><span className="font-black text-slate-800">{route.routeNumber} — {route.driverName}</span><span className="font-bold text-amber-800">{statusLabel[route.status]}</span></div>)}{!busRoutes.some(route => route.status !== 'active') && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs font-bold text-emerald-800">لا توجد مسارات متوقفة أو قيد الصيانة في سجل الأسطول الحالي.</div>}</div></section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm font-black text-slate-900"><ShieldCheck className="h-4 w-4 text-emerald-600" /> قائمة اعتماد الرحلة</div><ul className="mt-4 space-y-3 text-[11px] font-bold leading-5 text-slate-600"><li>• توثيق رخصة السائق وصلاحية المركبة.</li><li>• فحص المقاعد وأحزمة الأمان قبل الانطلاق.</li><li>• مراجعة كشف الركاب ونقاط الالتقاء.</li><li>• تسجيل الاستثناءات والحوادث في سجل معتمد.</li></ul><p className="mt-4 border-t border-slate-100 pt-3 text-[10px] leading-5 text-slate-400">هذه متطلبات تشغيل مرئية؛ لا تدّعي إثبات فحص أو تكامل GPS ما لم يُربط مصدره المركزي لاحقاً.</p></section>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid gap-4 lg:grid-cols-3">
            {[{ title: 'ملخص الإشغال', value: `${dashboard.utilization}%`, note: 'السعة المعروضة مقابل المقاعد المشغولة في المسارات النشطة', icon: Users }, { title: 'قائمة الركاب', value: dashboard.subscriptions, note: 'الاشتراكات المرتبطة بسجل طالب في المدرسة النشطة', icon: ClipboardList }, { title: 'مرجع الرسوم', value: `${transportations.reduce((total, record) => total + (record.monthlyFees || 0), 0).toLocaleString('ar-EG')}`, note: 'إجمالي الرسوم الشهرية المسجلة؛ يعتمد التحصيل المالي من وحدة الحسابات', icon: CreditCard }].map(report => <section key={report.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><h3 className="text-sm font-black text-slate-900">{report.title}</h3><report.icon className="h-5 w-5 text-sky-600" /></div><div className="mt-5 text-3xl font-black text-sky-800">{report.value}</div><p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">{report.note}</p></section>)}
          </div>
        )}
      </div>
    </div>
  );
}
