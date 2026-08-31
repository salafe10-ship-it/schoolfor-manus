import { Archive, Building2, CheckCircle2, CreditCard, Edit3, GitBranch, GraduationCap, PauseCircle, Plus, RefreshCw, RotateCcw, Search, ShieldAlert, Users, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';

interface SuperAdminTenantsProps {
  tenants: any[];
  setTenants: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
  onNavigateToTab?: (tab: string) => void;
}

type TenantForm = {
  legalName: string;
  slug: string;
  planCode: string;
  status: 'provisioning' | 'active' | 'suspended';
  subscriptionStatus: '' | 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  seatLimit: string;
  startsAt: string;
  endsAt: string;
  autoRenew: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): TenantForm => ({
  legalName: '',
  slug: '',
  planCode: 'standard',
  status: 'provisioning',
  subscriptionStatus: 'trial',
  seatLimit: '100',
  startsAt: today(),
  endsAt: '',
  autoRenew: true,
});

function normalizeTenant(raw: any): any {
  const subscription = raw?.subscription && typeof raw.subscription === 'object' ? raw.subscription : null;
  return {
    ...raw,
    id: raw.id,
    legalName: raw.legal_name,
    slug: raw.slug,
    planCode: raw.plan_code,
    status: raw.status,
    schoolsCount: Number(raw.schools_count || 0),
    branchesCount: Number(raw.branches_count || 0),
    usersCount: Number(raw.users_count || 0),
    studentsCount: Number(raw.students_count || 0),
    subscription: subscription ? {
      ...subscription,
      planCode: subscription.plan_code,
      startsAt: subscription.starts_at,
      endsAt: subscription.ends_at,
      seatLimit: Number(subscription.seat_limit || 0),
      autoRenew: Boolean(subscription.auto_renew),
    } : null,
  };
}

function formFromTenant(tenant: any): TenantForm {
  const subscription = tenant.subscription && typeof tenant.subscription === 'object' ? tenant.subscription : null;
  return {
    legalName: tenant.legalName || tenant.legal_name || '',
    slug: tenant.slug || '',
    planCode: tenant.planCode || tenant.plan_code || tenant.subscription?.planCode || 'standard',
    status: ['provisioning', 'active', 'suspended'].includes(tenant.status) ? tenant.status : 'provisioning',
    subscriptionStatus: subscription && ['trial', 'active', 'past_due', 'cancelled', 'expired'].includes(subscription.status) ? subscription.status : '',
    seatLimit: subscription?.seatLimit ? String(subscription.seatLimit) : '',
    startsAt: subscription?.startsAt ? String(subscription.startsAt).slice(0, 10) : '',
    endsAt: subscription?.endsAt ? String(subscription.endsAt).slice(0, 10) : '',
    autoRenew: subscription ? subscription.autoRenew !== false : false,
  };
}

export default function SuperAdminTenants({
  tenants = [],
  setTenants,
  logAction,
  triggerNotification,
  onNavigateToTab,
}: SuperAdminTenantsProps) {
  const [directoryStatus, setDirectoryStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'provisioning' | 'suspended' | 'archived'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [form, setForm] = useState<TenantForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [busyTenantId, setBusyTenantId] = useState('');

  const loadTenants = async (showNotice = false) => {
    setDirectoryStatus('loading');
    try {
      const response = await authenticatedRequest('/api/admin/central/tenants?includeArchived=true');
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !Array.isArray(payload.tenants)) {
        throw new Error(payload?.message || 'تعذر تحميل دليل المستأجرين المركزي.');
      }
      setTenants(payload.tenants.map(normalizeTenant));
      setDirectoryStatus('ready');
      if (showNotice) triggerNotification(`تم تحديث دليل المستأجرين: ${payload.tenants.length} مستأجر`, 'success');
    } catch (error) {
      setDirectoryStatus('error');
      if (showNotice) triggerNotification(error instanceof Error ? error.message : 'تعذر تحميل دليل المستأجرين المركزي.', 'danger');
    }
  };

  useEffect(() => {
    if (!tenants.length) void loadTenants(false);
    else setDirectoryStatus('ready');
    // The parent owns the central directory; this effect only fills a cold entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTenants = useMemo(() => tenants.filter((tenant) => {
    const haystack = `${tenant.legalName || ''} ${tenant.slug || ''} ${tenant.planCode || ''}`.toLowerCase();
    return (!searchTerm.trim() || haystack.includes(searchTerm.trim().toLowerCase()))
      && (statusFilter === 'all' || tenant.status === statusFilter);
  }), [searchTerm, statusFilter, tenants]);

  const openCreate = () => {
    setEditingTenant(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (tenant: any) => {
    setEditingTenant(tenant);
    setForm(formFromTenant(tenant));
    setShowModal(true);
  };

  const applyTenant = (raw: any) => {
    const next = normalizeTenant(raw);
    setTenants((current) => {
      const exists = current.some((tenant) => tenant.id === next.id);
      return exists ? current.map((tenant) => tenant.id === next.id ? { ...tenant, ...next } : tenant) : [next, ...current];
    });
    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.legalName.trim() || !form.slug.trim()) {
      triggerNotification('أدخل الاسم القانوني ومعرف المستأجر قبل الحفظ.', 'warning');
      return;
    }
    const seatLimit = Number(form.seatLimit);
    if (!form.planCode.trim() || !form.subscriptionStatus || !form.startsAt || !Number.isSafeInteger(seatLimit) || seatLimit < 1) {
      triggerNotification('بيانات الاشتراك الكانوني غير مكتملة؛ أدخل الباقة والحالة والحد وبداية الاشتراك صراحةً.', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      const path = editingTenant
        ? `/api/admin/central/tenants/${encodeURIComponent(editingTenant.id)}`
        : '/api/admin/central/tenants';
      const response = await authenticatedRequest(path, {
        method: editingTenant ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTenant ? {
          operation: 'update',
          legalName: form.legalName,
          slug: form.slug,
          planCode: form.planCode,
          status: form.status,
          subscription: {
            planCode: form.planCode,
            status: form.subscriptionStatus,
            seatLimit,
            startsAt: form.startsAt,
            endsAt: form.endsAt || null,
            autoRenew: form.autoRenew,
          },
        } : {
          legalName: form.legalName,
          slug: form.slug,
          planCode: form.planCode,
          status: form.status,
          subscriptionStatus: form.subscriptionStatus,
          seatLimit,
          startsAt: form.startsAt,
          endsAt: form.endsAt || null,
          autoRenew: form.autoRenew,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload?.tenant) throw new Error(payload?.message || 'تعذر حفظ المستأجر مركزياً.');
      const saved = applyTenant(payload.tenant);
      logAction(editingTenant ? 'UPDATE_TENANT' : 'CREATE_TENANT', `${editingTenant ? 'تحديث' : 'إنشاء'} المستأجر ${saved.legalName}`, 'إدارة المستأجرين');
      triggerNotification(editingTenant ? 'تم حفظ بيانات المستأجر والاشتراك مركزياً ✅' : 'تم إنشاء المستأجر والاشتراك في المصدر المركزي ✅', 'success');
      setShowModal(false);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر حفظ المستأجر؛ لم يتم تعديل البيانات.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatus = async (tenant: any) => {
    const nextStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
    setBusyTenantId(tenant.id);
    try {
      const response = await authenticatedRequest(`/api/admin/central/tenants/${encodeURIComponent(tenant.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'status', status: nextStatus }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload?.tenant) throw new Error(payload?.message || 'تعذر تغيير حالة المستأجر.');
      const saved = applyTenant(payload.tenant);
      logAction(nextStatus === 'active' ? 'ACTIVATE_TENANT' : 'SUSPEND_TENANT', `${nextStatus === 'active' ? 'تفعيل' : 'تعليق'} المستأجر ${saved.legalName}`, 'إدارة المستأجرين');
      triggerNotification(nextStatus === 'active' ? 'تم تفعيل المستأجر مركزياً ✅' : 'تم تعليق المستأجر مركزياً 🔒', nextStatus === 'active' ? 'success' : 'warning');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تغيير حالة المستأجر؛ لم يتم تعديل البيانات.', 'danger');
    } finally {
      setBusyTenantId('');
    }
  };

  const handleArchive = async (tenant: any) => {
    if (!window.confirm(`سيتم أرشفة المستأجر ${tenant.legalName} ومدارسه وفروعه. هل تريد المتابعة؟`)) return;
    setBusyTenantId(tenant.id);
    try {
      const response = await authenticatedRequest(`/api/admin/central/tenants/${encodeURIComponent(tenant.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'archive' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload?.tenant) throw new Error(payload?.message || 'تعذر أرشفة المستأجر.');
      const saved = applyTenant(payload.tenant);
      logAction('ARCHIVE_TENANT', `أرشفة المستأجر ${saved.legalName} مع نطاقه التابع`, 'الحوكمة المركزية');
      triggerNotification('تمت أرشفة المستأجر ومدارسه وفروعه مركزياً.', 'info');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر أرشفة المستأجر؛ لم يتم تعديل البيانات.', 'danger');
    } finally {
      setBusyTenantId('');
    }
  };

  const handleRestore = async (tenant: any) => {
    if (!window.confirm(`ستُستعاد المدارس والفروع والهويات التابعة لـ ${tenant.legalName} بحالة معلّقة. هل تريد المتابعة؟`)) return;
    setBusyTenantId(tenant.id);
    try {
      const response = await authenticatedRequest(`/api/admin/central/tenants/${encodeURIComponent(tenant.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'restore' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload?.tenant) throw new Error(payload?.message || 'تعذر استعادة المستأجر.');
      const saved = applyTenant(payload.tenant);
      logAction('RESTORE_TENANT', `استعادة المستأجر كمعلّق للمراجعة: ${saved.legalName}`, 'الحوكمة المركزية');
      triggerNotification('تمت استعادة المستأجر ونطاقه بحالة معلّقة؛ أنشئ أو حدّث الاشتراك ثم فعّل الموارد بعد المراجعة.', 'warning');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر استعادة المستأجر؛ لم يتم تعديل البيانات.', 'danger');
    } finally {
      setBusyTenantId('');
    }
  };

  const statusLabel = (status: string) => status === 'active' ? 'نشط' : status === 'suspended' ? 'موقوف' : status === 'archived' ? 'مؤرشف' : 'قيد التهيئة';
  const statusClass = (status: string) => status === 'active'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : status === 'suspended'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : status === 'archived'
        ? 'border-slate-300 bg-slate-100 text-slate-700'
        : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <div id="super-admin-tenants" className="space-y-6 text-right" dir="rtl">
      <div className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-br from-[#fffdf8] via-[#f8f0df] to-[#efe0c1] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#8b6508]">
              <Building2 className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">Central tenant directory</span>
            </div>
            <h2 className="text-xl font-black text-[#2a1d13]">دليل المستأجرين المركزي</h2>
            <p className="mt-2 max-w-2xl text-xs font-bold leading-6 text-slate-600">إدارة الهوية التجارية والاشتراك والحدود لكل مستأجر، مع إبقاء المدارس والفروع والبيانات التابعة ضمن نطاقه الموثق.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-2 text-[10px] font-black ${directoryStatus === 'ready' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : directoryStatus === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {directoryStatus === 'ready' ? 'المصدر المركزي متصل' : directoryStatus === 'error' ? 'المصدر يحتاج مراجعة' : 'جاري التحميل'}
            </span>
            <button type="button" onClick={() => void loadTenants(true)} className="rounded-2xl border border-[#d4af37]/35 bg-white/80 px-4 py-2 text-xs font-black text-[#5c3f22] transition hover:bg-white">
              <RefreshCw className="ml-1 inline h-4 w-4" /> تحديث
            </button>
            <button type="button" onClick={openCreate} className="rounded-2xl bg-[#2a1d13] px-4 py-2 text-xs font-black text-[#f7d174] shadow-sm transition hover:bg-[#3b281a]">
              <Plus className="ml-1 inline h-4 w-4" /> مستأجر جديد
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'إجمالي المستأجرين', value: tenants.length, icon: Building2, tone: 'text-[#8b6508] bg-[#fff8e7]' },
          { label: 'نشط', value: tenants.filter((tenant) => tenant.status === 'active').length, icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50' },
          { label: 'قيد التهيئة', value: tenants.filter((tenant) => tenant.status === 'provisioning').length, icon: RefreshCw, tone: 'text-amber-700 bg-amber-50' },
          { label: 'المدارس التابعة', value: tenants.reduce((sum, tenant) => sum + tenant.schoolsCount, 0), icon: GraduationCap, tone: 'text-sky-700 bg-sky-50' },
          { label: 'المستخدمون', value: tenants.reduce((sum, tenant) => sum + tenant.usersCount, 0), icon: Users, tone: 'text-violet-700 bg-violet-50' },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-[#d4af37]/20 bg-[#fffdf8] p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-[10px] font-black text-slate-500">{card.label}</span><span className={`rounded-2xl p-2 ${card.tone}`}><card.icon className="h-4 w-4" /></span></div>
            <div className="mt-3 text-2xl font-black text-[#2a1d13]">{card.value.toLocaleString('ar-EG')}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border-2 border-[#d4af37]/25 bg-[#fffdf8] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="ابحث باسم المستأجر أو المعرّف أو الباقة" className="w-full rounded-2xl border border-[#d4af37]/25 bg-white px-10 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#c58a22]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'provisioning', 'suspended', 'archived'] as const).map((status) => (
              <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-2xl border px-3 py-2 text-[10px] font-black transition ${statusFilter === status ? 'border-[#c58a22] bg-[#2a1d13] text-[#f7d174]' : 'border-[#d4af37]/20 bg-white text-slate-600 hover:bg-[#fbf5e8]'}`}>
                {status === 'all' ? 'الكل' : statusLabel(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border-2 border-[#d4af37]/30 bg-[#fffdf8] shadow-lg">
        <div className="flex items-center justify-between bg-[#2a1d13] px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-black text-white"><Building2 className="h-4 w-4 text-[#f7d174]" /> المستأجرون ({filteredTenants.length})</h3>
          <span className="text-[10px] font-bold text-[#d6c8b4]">البيانات من PostgreSQL المركزي</span>
        </div>
        {filteredTenants.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500">لا توجد سجلات مطابقة حالياً.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-right text-xs">
              <thead className="bg-[#f5ead7] text-[#5c3f22]"><tr>
                <th className="p-4 font-black">المستأجر</th><th className="p-4 font-black">الباقة والاشتراك</th><th className="p-4 font-black">النطاق التابع</th><th className="p-4 font-black">المستخدمون / الطلاب</th><th className="p-4 font-black">الحالة</th><th className="p-4 text-center font-black">إجراءات</th>
              </tr></thead>
              <tbody className="divide-y divide-[#eadcc3]">
                {filteredTenants.map((tenant) => {
                  const isBusy = busyTenantId === tenant.id;
                  return <tr key={tenant.id} className="transition hover:bg-[#fcf7ee]">
                    <td className="p-4"><div className="flex items-center gap-3"><span className="rounded-2xl bg-[#f7e8c4] p-2 text-[#8b6508]"><Building2 className="h-4 w-4" /></span><div><div className="font-black text-[#2a1d13]">{tenant.legalName || 'غير متحقق'}</div><div className="mt-1 font-mono text-[10px] text-slate-500" dir="ltr">{tenant.slug}</div></div></div></td>
                    <td className="p-4"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-[#c58a22]" /><span className="font-black text-[#5c3f22]">{tenant.planCode || 'غير متحقق'}</span></div><div className="mt-1 text-[10px] font-bold text-slate-500">{tenant.subscription?.status || 'غير متحقق'} {tenant.subscription?.endsAt ? `• حتى ${String(tenant.subscription.endsAt).slice(0, 10)}` : ''}</div></td>
                    <td className="p-4"><div className="flex items-center gap-3 font-black text-slate-700"><span><GraduationCap className="ml-1 inline h-4 w-4 text-sky-600" />{tenant.schoolsCount}</span><span><GitBranch className="ml-1 inline h-4 w-4 text-emerald-600" />{tenant.branchesCount}</span></div></td>
                    <td className="p-4"><div className="font-mono font-black text-slate-700">{tenant.usersCount.toLocaleString('ar-EG')} / {tenant.studentsCount.toLocaleString('ar-EG')}</div><div className="mt-1 text-[10px] font-bold text-slate-500">مستخدمون / طلاب</div></td>
                    <td className="p-4"><span className={`rounded-full border px-3 py-1 text-[10px] font-black ${statusClass(tenant.status)}`}>{statusLabel(tenant.status)}</span></td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="button" title="تعديل المستأجر" disabled={tenant.status === 'archived'} onClick={() => openEdit(tenant)} className="rounded-xl border border-[#d4af37]/25 bg-white p-2 text-[#8b6508] transition hover:bg-[#fff5d9] disabled:cursor-not-allowed disabled:opacity-40"><Edit3 className="h-4 w-4" /></button>
                        <button type="button" title={tenant.status === 'suspended' ? 'تفعيل المستأجر' : 'تعليق المستأجر'} disabled={isBusy || tenant.status === 'provisioning' || tenant.status === 'archived'} onClick={() => void handleStatus(tenant)} className="rounded-xl border border-[#d4af37]/25 bg-white p-2 text-amber-700 transition hover:bg-[#fff5d9] disabled:cursor-not-allowed disabled:opacity-40">{tenant.status === 'suspended' ? <CheckCircle2 className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}</button>
                        <button type="button" title="فتح المدارس التابعة" onClick={() => onNavigateToTab?.('schools')} className="rounded-xl border border-sky-200 bg-sky-50 p-2 text-sky-700 transition hover:bg-sky-100"><GraduationCap className="h-4 w-4" /></button>
                        {tenant.status === 'archived' ? (
                          <button type="button" title="استعادة المستأجر كمعلّق" disabled={isBusy} onClick={() => void handleRestore(tenant)} className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-700 transition hover:bg-amber-100 disabled:opacity-40"><RotateCcw className="h-4 w-4" /></button>
                        ) : (
                          <button type="button" title="أرشفة المستأجر" disabled={isBusy} onClick={() => void handleArchive(tenant)} className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100 disabled:opacity-40"><Archive className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c120c]/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-[#d4af37]/35 bg-[#fffdf8] shadow-2xl">
          <div className="flex items-center justify-between bg-[#2a1d13] p-5"><button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-white/10 bg-white/10 p-2 text-[#d6c8b4]"><X className="h-4 w-4" /></button><h3 className="text-sm font-black text-white">{editingTenant ? 'تعديل المستأجر والاشتراك' : 'إنشاء مستأجر واشتراك جديد'}</h3></div>
          <form onSubmit={handleSubmit} className="grid max-h-[78vh] grid-cols-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-black text-[#5c3f22]">الاسم القانوني<input required value={form.legalName} onChange={(event) => setForm({ ...form, legalName: event.target.value })} className="mt-1 w-full rounded-2xl border border-[#d4af37]/25 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#c58a22]" /></label>
            <label className="space-y-1 text-xs font-black text-[#5c3f22]">معرف المستأجر (slug)<input required dir="ltr" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="mt-1 w-full rounded-2xl border border-[#d4af37]/25 bg-white px-3 py-2.5 text-left font-mono text-xs text-slate-800 outline-none focus:border-[#c58a22]" /></label>
            <label className="space-y-1 text-xs font-black text-[#5c3f22]">رمز الباقة<input dir="ltr" value={form.planCode} onChange={(event) => setForm({ ...form, planCode: event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })} className="mt-1 w-full rounded-2xl border border-[#d4af37]/25 bg-white px-3 py-2.5 text-left font-mono text-xs text-slate-800 outline-none focus:border-[#c58a22]" /></label>
            <label className="space-y-1 text-xs font-black text-[#5c3f22]">حالة المستأجر<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TenantForm['status'] })} className="mt-1 w-full rounded-2xl border border-[#d4af37]/25 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#c58a22]"><option value="provisioning">قيد التهيئة</option><option value="active">نشط</option><option value="suspended">موقوف</option></select></label>
            <label className="space-y-1 text-xs font-black text-[#5c3f22]">حالة الاشتراك<select required value={form.subscriptionStatus} onChange={(event) => setForm({ ...form, subscriptionStatus: event.target.value as TenantForm['subscriptionStatus'] })} className="mt-1 w-full rounded-2xl border border-[#d4af37]/25 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#c58a22]"><option value="" disabled>غير متحقق — اختر الحالة</option><option value="trial">تجريبي</option><option value="active">نشط</option><option value="past_due">متأخر السداد</option><option value="cancelled">ملغى</option><option value="expired">منتهٍ</option></select></label>
            <label className="space-y-1 text-xs font-black text-[#5c3f22]">حد المقاعد<input type="number" min="1" max="1000000" required value={form.seatLimit} onChange={(event) => setForm({ ...form, seatLimit: event.target.value })} className="mt-1 w-full rounded-2xl border border-[#d4af37]/25 bg-white px-3 py-2.5 font-mono text-xs text-slate-800 outline-none focus:border-[#c58a22]" /></label>
            <label className="space-y-1 text-xs font-black text-[#5c3f22]">بداية الاشتراك<input type="date" required value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} className="mt-1 w-full rounded-2xl border border-[#d4af37]/25 bg-white px-3 py-2.5 font-mono text-xs text-slate-800 outline-none focus:border-[#c58a22]" /></label>
            <label className="space-y-1 text-xs font-black text-[#5c3f22]">نهاية الاشتراك (اختياري)<input type="date" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} className="mt-1 w-full rounded-2xl border border-[#d4af37]/25 bg-white px-3 py-2.5 font-mono text-xs text-slate-800 outline-none focus:border-[#c58a22]" /></label>
            <label className="flex items-center gap-2 self-end rounded-2xl border border-[#d4af37]/20 bg-[#fbf5e8] p-3 text-xs font-black text-[#5c3f22]"><input type="checkbox" checked={form.autoRenew} onChange={(event) => setForm({ ...form, autoRenew: event.target.checked })} className="h-4 w-4 accent-[#c58a22]" /> تجديد تلقائي للاشتراك</label>
            <div className="col-span-full flex items-center justify-between gap-3 border-t border-[#eadcc3] pt-4"><p className="text-[10px] font-bold leading-5 text-slate-500"><ShieldAlert className="ml-1 inline h-4 w-4 text-amber-600" />سيُحفظ المستأجر والاشتراك في المصدر الكانوني؛ إنشاء مدرسة أو مستخدم يتم من شاشته المخصصة.</p><div className="flex gap-2"><button type="button" onClick={() => setShowModal(false)} className="rounded-2xl border border-[#d4af37]/25 px-5 py-2.5 text-xs font-black text-slate-600">إلغاء</button><button type="submit" disabled={isSaving} className="rounded-2xl bg-[#2a1d13] px-5 py-2.5 text-xs font-black text-[#f7d174] disabled:opacity-50">{isSaving ? 'جاري الحفظ...' : 'حفظ مركزي'}</button></div></div>
          </form>
        </div>
      </div>}
    </div>
  );
}
