import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, KeyRound, Lock, Plus, RefreshCw, Search, ShieldCheck, UserCheck, UserMinus, Users, X } from 'lucide-react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';

type SchoolUser = {
  id: string;
  display_name: string;
  email?: string;
  job_title?: string;
  department?: string;
  status: 'invited' | 'active' | 'suspended' | 'disabled' | 'archived';
  version: number;
  branch_name?: string;
  branch_id?: string;
  force_password_change?: boolean;
  last_sign_in_at?: string | null;
  roles?: Array<{ roleKey: string; name: string; assignmentBranchId?: string | null }>;
  directPermissions?: Array<{ permissionKey: string; resource?: string; action?: string; branchId?: string | null }>;
};

type SchoolRole = {
  id: string;
  roleKey: string;
  name: string;
  description?: string;
  permissions?: Array<{ permissionKey: string; resource?: string; action?: string }>;
};

type PermissionDescriptor = {
  permissionKey: string;
  resource: string;
  action: string;
  description?: string;
};

type Props = {
  selectedSchool?: { name?: string };
  selectedBranch?: { name?: string } | null;
  triggerNotification?: (message: string, type?: 'info' | 'warning' | 'success') => void;
  /** Trusted server-derived write capability. Read-only users may inspect the directory. */
  canManage?: boolean;
};

const statusLabels: Record<SchoolUser['status'], string> = {
  invited: 'دعوة', active: 'نشط', suspended: 'موقوف', disabled: 'معطل', archived: 'مؤرشف'
};

export default function SchoolUsersPermissionsModule({ selectedSchool, selectedBranch, triggerNotification, canManage = false }: Props) {
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [roles, setRoles] = useState<SchoolRole[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionDescriptor[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SchoolUser | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, string[]>>({});
  const [permissionEditing, setPermissionEditing] = useState<SchoolUser | null>(null);
  const [permissionQuery, setPermissionQuery] = useState('');
  const [form, setForm] = useState({ name: '', email: '', jobTitle: '', department: '', initialRole: '', password: '' });

  const notify = (message: string, type: 'info' | 'warning' | 'success' = 'info') => triggerNotification?.(message, type);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        authenticatedRequest('/api/school/users', { cache: 'no-store' }),
        authenticatedRequest('/api/school/identity-roles', { cache: 'no-store' }),
      ]);
      const usersPayload = await usersResponse.json().catch(() => ({}));
      const rolesPayload = await rolesResponse.json().catch(() => ({}));
      if (!usersResponse.ok || !usersPayload?.success) throw new Error(usersPayload?.message || 'تعذر تحميل مستخدمي المدرسة.');
      if (!rolesResponse.ok || !rolesPayload?.success) throw new Error(rolesPayload?.message || 'تعذر تحميل قوالب الصلاحيات.');
      const nextRoles = Array.isArray(rolesPayload.roles) ? rolesPayload.roles : [];
      const nextCatalog = Array.isArray(rolesPayload.permissionCatalog) ? rolesPayload.permissionCatalog : [];
      setUsers(Array.isArray(usersPayload.users) ? usersPayload.users : []);
      setRoles(nextRoles);
      setPermissionCatalog(nextCatalog);
      setForm((current) => ({ ...current, initialRole: current.initialRole || nextRoles[0]?.roleKey || '' }));
      setRoleDrafts(Object.fromEntries((usersPayload.users || []).map((user: SchoolUser) => [user.id, user.roles?.[0]?.roleKey || 'schooladmin'])));
      setPermissionDrafts(Object.fromEntries((usersPayload.users || []).map((user: SchoolUser) => [user.id, (user.directPermissions || []).map((permission) => permission.permissionKey)])));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'تعذر تحميل دليل المستخدمين.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) => [user.display_name, user.email, user.job_title, user.department, user.branch_name, ...(user.roles || []).map((role) => role.name)].some((value) => String(value || '').toLowerCase().includes(normalized)));
  }, [query, users]);

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await authenticatedRequest('/api/school/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر إنشاء المستخدم.');
      setShowCreate(false);
      setForm({ name: '', email: '', jobTitle: '', department: '', initialRole: roles[0]?.roleKey || '', password: '' });
      setTemporaryPassword(payload.temporaryPassword || '');
      notify('تم إنشاء مستخدم المدرسة وإسناد الدور المركزي بنجاح.', 'success');
      await load();
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'تعذر إنشاء المستخدم.', 'warning');
    } finally { setSaving(false); }
  };

  const mutate = async (user: SchoolUser, operation: string, body: Record<string, unknown> = {}) => {
    if (!canManage) {
      notify('حسابك للعرض فقط؛ لا تملك صلاحية الكتابة الإدارية لمستخدمي المدرسة.', 'warning');
      return false;
    }
    setSaving(true);
    try {
      const response = await authenticatedRequest(`/api/school/users/${encodeURIComponent(user.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation, expectedVersion: user.version, ...body }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر حفظ التغيير.');
      if (payload.temporaryPassword) setTemporaryPassword(payload.temporaryPassword);
      notify(operation === 'archive' ? 'تمت أرشفة المستخدم بأمان.' : 'تم حفظ التغيير وتسجيله في سجل الرقابة.', 'success');
      await load();
      return true;
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'تعذر حفظ التغيير.', 'warning');
      return false;
    } finally { setSaving(false); }
  };

  const openPermissionEditor = (user: SchoolUser) => {
    setPermissionEditing(user);
    setPermissionQuery('');
    setPermissionDrafts((drafts) => ({ ...drafts, [user.id]: [...(user.directPermissions || []).map((permission) => permission.permissionKey)] }));
  };

  const togglePermission = (permissionKey: string) => {
    if (!permissionEditing) return;
    setPermissionDrafts((drafts) => {
      const current = new Set(drafts[permissionEditing.id] || []);
      if (current.has(permissionKey)) current.delete(permissionKey); else current.add(permissionKey);
      return { ...drafts, [permissionEditing.id]: [...current].sort() };
    });
  };

  const savePermissions = async () => {
    if (!permissionEditing) return;
    const saved = await mutate(permissionEditing, 'set_permissions', { permissionKeys: permissionDrafts[permissionEditing.id] || [] });
    if (saved) setPermissionEditing(null);
  };

  const permissionLabel = (permission: PermissionDescriptor) => {
    const resourceLabels: Record<string, string> = {
      Dashboard: 'لوحة التحكم', Student: 'شؤون الطلاب', StudentDocument: 'مستندات الطلاب',
      Exam: 'الامتحانات والنتائج', Hr: 'الموارد البشرية', Financial: 'الحسابات والمالية',
      Inventory: 'المخزون والمشتريات', Admission: 'القبول والتسجيل', Ai: 'المساعد الذكي',
      Identity: 'المستخدمون والصلاحيات', Audit: 'سجل الرقابة', Database: 'إدارة قاعدة البيانات',
    };
    const actionLabels: Record<string, string> = {
      View: 'عرض', Read: 'قراءة', Write: 'إضافة وتعديل', Edit: 'تعديل', Delete: 'حذف',
      Export: 'تصدير', Create: 'إنشاء', Verify: 'تحقق', Archive: 'أرشفة', Approve: 'اعتماد',
      Forecast: 'تنبؤ', Chat: 'محادثة', Assign: 'إسناد', Audit: 'تدقيق',
    };
    return `${resourceLabels[permission.resource] || permission.resource} — ${actionLabels[permission.action] || permission.action}`;
  };

  const visiblePermissionCatalog = useMemo(() => {
    const normalized = permissionQuery.trim().toLowerCase();
    return permissionCatalog.filter((permission) => !normalized || `${permission.permissionKey} ${permissionLabel(permission)}`.toLowerCase().includes(normalized));
  }, [permissionCatalog, permissionQuery]);

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    await mutate(editing, 'update', { displayName: form.name, email: form.email, jobTitle: form.jobTitle, department: form.department });
    setEditing(null);
  };

  return (
    <section className="min-h-[70vh] bg-slate-50 p-4 sm:p-6 text-slate-900" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-3xl bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-indigo-200"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-black tracking-wide">هوية المدرسة • نطاق موثوق</span></div>
              <h1 className="text-2xl font-black">مستخدمو المدرسة والصلاحيات</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">إنشاء المستخدمين وإسناد القوالب المعتمدة من الإدارة المركزية داخل مدرسة {selectedSchool?.name || 'الحالية'} فقط.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">الفرع: {selectedBranch?.name || 'كل فروع المدرسة'}</span><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-emerald-200">لا توجد صلاحيات منصة أو وصول لمدارس أخرى</span></div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => void load()} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/15" title="تحديث"><RefreshCw className="inline h-4 w-4" /></button>
              {canManage && <button type="button" onClick={() => setShowCreate(true)} className="rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-black shadow-lg hover:bg-indigo-400"><Plus className="ml-1 inline h-4 w-4" /> مستخدم جديد</button>}
            </div>
          </div>
        </div>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error} <button className="mr-3 underline" onClick={() => void load()}>إعادة المحاولة</button></div>}
        {!canManage && <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs font-bold leading-6 text-sky-900">وضع القراءة فقط: يمكنك مراجعة المستخدمين والأدوار والتفويضات، بينما تتطلب الإضافة أو التعديل أو الإسناد صلاحية الكتابة الإدارية.</div>}
        {temporaryPassword && <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between"><div><b>كلمة مرور مؤقتة — اعرضها للمستخدم مرة واحدة فقط:</b><code className="mr-2 rounded bg-white px-2 py-1 font-mono">{temporaryPassword}</code></div><button onClick={() => setTemporaryPassword('')} className="text-xs font-black underline">إخفاء</button></div>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-slate-200 bg-white p-4"><Users className="mb-2 h-5 w-5 text-indigo-600" /><div className="text-2xl font-black">{users.length}</div><div className="text-xs font-bold text-slate-500">إجمالي مستخدمي المدرسة</div></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><UserCheck className="mb-2 h-5 w-5 text-emerald-600" /><div className="text-2xl font-black">{users.filter((user) => user.status === 'active').length}</div><div className="text-xs font-bold text-slate-500">حسابات نشطة</div></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><Lock className="mb-2 h-5 w-5 text-amber-600" /><div className="text-2xl font-black">{roles.length}</div><div className="text-xs font-bold text-slate-500">قوالب أدوار منشورة مركزياً</div></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><ShieldCheck className="mb-2 h-5 w-5 text-violet-600" /><div className="text-2xl font-black">{permissionCatalog.length}</div><div className="text-xs font-bold text-slate-500">صلاحيات دقيقة قابلة للإسناد</div></div></div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black">دليل مستخدمي المدرسة</h2><p className="mt-1 text-xs text-slate-500">كل تغيير يمر عبر API موثوق ويُسجل في سجل الرقابة المركزي.</p></div><div className="relative w-full sm:w-80"><Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث بالاسم أو البريد أو الدور" className="w-full rounded-xl border border-slate-200 py-2 pl-3 pr-9 text-sm outline-none focus:border-indigo-400" /></div></div>
          {loading ? <div className="p-12 text-center text-sm font-bold text-slate-500">جارٍ تحميل دليل الهوية...</div> : filteredUsers.length === 0 ? <div className="p-12 text-center text-sm font-bold text-slate-500">لا توجد حسابات مطابقة.</div> : <div className="overflow-x-auto"><table className="min-w-[1180px] w-full text-right text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-4">المستخدم</th><th className="p-4">الوظيفة والقسم</th><th className="p-4">الدور المركزي</th><th className="p-4">تفويض دقيق</th><th className="p-4">الحالة</th><th className="p-4">إجراءات آمنة</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredUsers.map((user) => <tr key={user.id} className="align-top hover:bg-slate-50/70"><td className="p-4"><div className="font-black">{user.display_name}</div><div className="mt-1 text-xs text-slate-500">{user.email || 'بريد غير متاح'}</div><div className="mt-1 text-[10px] text-slate-400">{user.branch_name || 'الفرع الرئيسي'}</div></td><td className="p-4"><div>{user.job_title || '—'}</div><div className="mt-1 text-xs text-slate-500">{user.department || '—'}</div></td><td className="p-4"><div className="flex items-center gap-2"><select disabled={!canManage} value={roleDrafts[user.id] || user.roles?.[0]?.roleKey || ''} onChange={(event) => setRoleDrafts((drafts) => ({ ...drafts, [user.id]: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60">{roles.map((role) => <option key={role.roleKey} value={role.roleKey}>{role.name}</option>)}</select>{canManage && <button disabled={saving || !roleDrafts[user.id] || roleDrafts[user.id] === user.roles?.[0]?.roleKey} onClick={() => void mutate(user, 'assign_role', { roleKey: roleDrafts[user.id] })} className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700 disabled:opacity-40">حفظ</button>}</div><div className="mt-2 flex flex-wrap gap-1">{(roles.find((role) => role.roleKey === (roleDrafts[user.id] || user.roles?.[0]?.roleKey))?.permissions || []).slice(0, 4).map((permission) => <span key={permission.permissionKey} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{permission.permissionKey}</span>)}</div></td><td className="p-4"><div className="flex items-center gap-2"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-700">{(user.directPermissions || []).length} صلاحية</span>{canManage && <button type="button" onClick={() => openPermissionEditor(user)} className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-[10px] font-black text-white hover:bg-violet-500">إدارة الصلاحيات</button>}</div>{(user.directPermissions || []).length > 0 && <div className="mt-2 flex max-w-[260px] flex-wrap gap-1">{(user.directPermissions || []).slice(0, 3).map((permission) => <span key={permission.permissionKey} className="rounded bg-violet-50 px-1.5 py-0.5 text-[9px] text-violet-700">{permissionLabel({ permissionKey: permission.permissionKey, resource: permission.resource || permission.permissionKey.split('.')[0], action: permission.action || permission.permissionKey.split('.').slice(1).join('.') })}</span>)}{(user.directPermissions || []).length > 3 && <span className="text-[9px] font-bold text-slate-400">+{(user.directPermissions || []).length - 3}</span>}</div>}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : user.status === 'archived' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700'}`}>{statusLabels[user.status]}</span>{user.force_password_change && <div className="mt-2 text-[10px] font-bold text-amber-700">يتطلب تغيير كلمة المرور</div>}</td><td className="p-4"><div className="flex flex-wrap gap-2">{canManage && <button onClick={() => { setEditing(user); setForm({ name: user.display_name, email: user.email || '', jobTitle: user.job_title || '', department: user.department || '', initialRole: user.roles?.[0]?.roleKey || roles[0]?.roleKey || '', password: '' }); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-black hover:bg-slate-50">تحرير</button>}{canManage && <button onClick={() => void mutate(user, 'reset_password')} disabled={saving || user.status === 'archived'} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-black text-amber-700 disabled:opacity-40"><KeyRound className="ml-1 inline h-3 w-3" />ضبط كلمة المرور</button>}{canManage && (user.status === 'active' ? <button onClick={() => void mutate(user, 'status', { status: 'suspended' })} disabled={saving} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[10px] font-black text-rose-700 disabled:opacity-40"><UserMinus className="ml-1 inline h-3 w-3" />إيقاف</button> : user.status !== 'archived' ? <button onClick={() => void mutate(user, 'status', { status: 'active' })} disabled={saving} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black text-emerald-700 disabled:opacity-40">تفعيل</button> : null)}</div></td></tr>)}</tbody></table></div>}
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-xs leading-6 text-indigo-900"><b>سياسة الحوكمة:</b> الأدوار المعروضة قوالب منشورة من المدرسة الأم المركزية. مدير المدرسة لا يستطيع إنشاء صلاحية جديدة أو منح Platform.Admin أو تعديل مستخدم خارج نطاق مدرسته.</div>
      </div>

      {(showCreate || editing) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><form onSubmit={editing ? saveEdit : submitCreate} className="w-full max-w-xl space-y-4 rounded-3xl bg-white p-6 shadow-2xl" dir="rtl"><div className="flex items-center justify-between"><h2 className="text-lg font-black">{editing ? 'تحرير بيانات المستخدم' : 'إنشاء مستخدم مدرسة'}</h2><button type="button" onClick={() => { setShowCreate(false); setEditing(null); }}><X className="h-5 w-5" /></button></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">الاسم الكامل<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border p-2.5" /></label><label className="text-xs font-bold">البريد الإلكتروني<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-xl border p-2.5" /></label><label className="text-xs font-bold">المسمى الوظيفي<input value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} className="mt-1 w-full rounded-xl border p-2.5" /></label><label className="text-xs font-bold">القسم<input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} className="mt-1 w-full rounded-xl border p-2.5" /></label>{!editing && <><label className="text-xs font-bold">الدور المعتمد<select required value={form.initialRole} onChange={(event) => setForm({ ...form, initialRole: event.target.value })} className="mt-1 w-full rounded-xl border p-2.5">{roles.map((role) => <option key={role.roleKey} value={role.roleKey}>{role.name}</option>)}</select></label><label className="text-xs font-bold">كلمة مرور اختيارية<input type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="اتركها للتوليد الآمن" className="mt-1 w-full rounded-xl border p-2.5" /></label></>}</div><div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">الفرع الافتراضي: <b>{selectedBranch?.name || 'الفرع الرئيسي'}</b>. يمكن تغيير النطاق لاحقاً من خلال مدير المدرسة وفق الفروع المنشورة مركزياً.</div><div className="flex justify-end gap-2"><button type="button" onClick={() => { setShowCreate(false); setEditing(null); }} className="rounded-xl border px-4 py-2 text-xs font-black">إلغاء</button><button disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-black text-white disabled:opacity-50">{saving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديل' : 'إنشاء المستخدم'}</button></div></form></div>}

      {permissionEditing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"><div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" dir="rtl"><div className="flex items-start justify-between gap-4 bg-gradient-to-l from-violet-950 to-indigo-950 p-6 text-white"><div><div className="mb-1 flex items-center gap-2 text-violet-200"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-black">تفويض دقيق على مستوى المستخدم</span></div><h2 className="text-xl font-black">صلاحيات {permissionEditing.display_name}</h2><p className="mt-2 text-xs leading-5 text-violet-100/80">هذه الصلاحيات إضافية فوق الدور المركزي، وتطبق داخل المدرسة والفرع الموثوقين فقط. لا يمكن منح صلاحية إدارة المنصة.</p></div><button type="button" onClick={() => setPermissionEditing(null)} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X className="h-5 w-5" /></button></div><div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs font-bold text-slate-600">تم اختيار <span className="text-violet-700">{(permissionDrafts[permissionEditing.id] || []).length}</span> صلاحية مباشرة من أصل {permissionCatalog.length}</div><div className="flex items-center gap-2"><div className="relative w-full sm:w-72"><Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" /><input value={permissionQuery} onChange={(event) => setPermissionQuery(event.target.value)} placeholder="بحث في الوحدات والأزرار" className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-xs outline-none focus:border-violet-400" /></div><button type="button" onClick={() => setPermissionDrafts((drafts) => ({ ...drafts, [permissionEditing.id]: visiblePermissionCatalog.map((permission) => permission.permissionKey) }))} className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-[10px] font-black text-violet-700">تحديد الظاهر</button><button type="button" onClick={() => setPermissionDrafts((drafts) => ({ ...drafts, [permissionEditing.id]: [] }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600">مسح الكل</button></div></div><div className="flex-1 overflow-y-auto p-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visiblePermissionCatalog.map((permission) => { const selected = (permissionDrafts[permissionEditing.id] || []).includes(permission.permissionKey); return <button key={permission.permissionKey} type="button" onClick={() => togglePermission(permission.permissionKey)} className={`flex min-h-[76px] items-start gap-3 rounded-2xl border p-3 text-right transition ${selected ? 'border-violet-400 bg-violet-50 shadow-sm' : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50'}`}><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${selected ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 text-transparent'}`}><Check className="h-4 w-4" /></span><span><span className="block text-xs font-black text-slate-800">{permissionLabel(permission)}</span><span className="mt-1 block font-mono text-[9px] text-slate-400">{permission.permissionKey}</span></span></button>; })}</div>{visiblePermissionCatalog.length === 0 && <div className="p-12 text-center text-sm font-bold text-slate-500">لا توجد صلاحيات مطابقة للبحث.</div>}</div><div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPermissionEditing(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-black">إلغاء</button><button type="button" disabled={saving} onClick={() => void savePermissions()} className="rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-black text-white shadow-lg hover:bg-violet-500 disabled:opacity-50">{saving ? 'جارٍ تطبيق التفويض...' : 'حفظ الصلاحيات وتسجيلها'}</button></div></div></div>}
    </section>
  );
}
