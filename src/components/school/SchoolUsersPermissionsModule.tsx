import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Home, KeyRound, Lock, LogOut, Plus, RefreshCw, Search, ShieldCheck, UserCheck, UserMinus, Users, X } from 'lucide-react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';

type SchoolUser = {
  id: string;
  display_name: string;
  email?: string;
  username?: string;
  job_id?: string;
  job_title?: string;
  department?: string;
  status: 'invited' | 'active' | 'suspended' | 'disabled' | 'archived';
  version: number;
  branch_name?: string;
  branch_id?: string;
  force_password_change?: boolean;
  last_sign_in_at?: string | null;
  roles?: Array<{ roleKey: string; name: string; assignmentBranchId?: string | null }>;
  directPermissions?: Array<{ permissionKey: string; resource?: string; action?: string; effect?: 'allow' | 'deny'; branchId?: string | null }>;
};

type SchoolRole = {
  id: string;
  roleKey: string;
  name: string;
  description?: string;
  permissions?: Array<{ permissionKey: string; resource?: string; action?: string }>;
};

type SchoolJob = {
  id: string;
  titleAr: string;
  titleEn?: string;
  departmentId?: string;
  departmentName?: string;
};

type SchoolDepartment = {
  id: string;
  nameAr: string;
  nameEn?: string;
};

type PermissionDescriptor = {
  permissionKey: string;
  resource: string;
  action: string;
  description?: string;
};

type Props = {
  selectedSchool?: { name?: string };
  selectedBranch?: { id?: string; name?: string } | null;
  triggerNotification?: (message: string, type?: 'info' | 'warning' | 'success') => void;
  onBackToMainMenu?: () => void;
  /** Trusted server-derived write capability. Read-only users may inspect the directory. */
  canManage?: boolean;
  /** Trusted server-derived capability for role and direct-permission assignment. */
  canAssign?: boolean;
};

const statusLabels: Record<SchoolUser['status'], string> = {
  invited: 'دعوة', active: 'نشط', suspended: 'موقوف', disabled: 'معطل', archived: 'مؤرشف'
};

type StatusFilter = 'all' | SchoolUser['status'];
type ManagementView = 'users' | 'roles' | 'permissions';
type PermissionStateFilter = 'all' | 'effective' | 'direct' | 'inherited' | 'unassigned' | 'denied';

export default function SchoolUsersPermissionsModule({ selectedSchool, selectedBranch, triggerNotification, onBackToMainMenu, canManage = false, canAssign = false }: Props) {
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [roles, setRoles] = useState<SchoolRole[]>([]);
  const [jobs, setJobs] = useState<SchoolJob[]>([]);
  const [departments, setDepartments] = useState<SchoolDepartment[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionDescriptor[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadWarnings, setLoadWarnings] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SchoolUser | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, string[]>>({});
  const [permissionEditing, setPermissionEditing] = useState<SchoolUser | null>(null);
  const [permissionQuery, setPermissionQuery] = useState('');
  const [permissionStateFilter, setPermissionStateFilter] = useState<PermissionStateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeView, setActiveView] = useState<ManagementView>('users');
  const [form, setForm] = useState({ name: '', email: '', jobId: '', jobTitle: '', department: '', initialRole: '', password: '', branchId: '' });
  const canCreate = canManage && canAssign;

  const notify = (message: string, type: 'info' | 'warning' | 'success' = 'info') => triggerNotification?.(message, type);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setLoadWarnings([]);
    try {
      // Keep the three control-plane reads in one authenticated sequence.
      // Firing them concurrently can make a cold Render instance refresh the
      // same session three times and contend for the small platform pool,
      // leaving an otherwise valid directory looking empty.
      const requestSequentially = async (request: () => Promise<Response>): Promise<PromiseSettledResult<Response>> => {
        try { return { status: 'fulfilled', value: await request() }; }
        catch (reason) { return { status: 'rejected', reason }; }
      };
      const usersResult = await requestSequentially(() => authenticatedRequest('/api/school/users', { cache: 'no-store' }));
      const rolesResult = await requestSequentially(() => authenticatedRequest('/api/school/identity-roles', { cache: 'no-store' }));
      const jobsResult = await requestSequentially(() => authenticatedRequest('/api/school/job-catalog', { cache: 'no-store' }));
      // Normalize the already-completed results through allSettled so one
      // malformed payload cannot discard the other two successful reads.
      const [settledUsers, settledRoles, settledJobs] = await Promise.allSettled([
        Promise.resolve(usersResult), Promise.resolve(rolesResult), Promise.resolve(jobsResult),
      ]);
      const settledResult = (result: PromiseSettledResult<PromiseSettledResult<Response>>): PromiseSettledResult<Response> => (
        result.status === 'fulfilled' ? result.value : { status: 'rejected', reason: result.reason }
      );
      const safeUsersResult = settledResult(settledUsers);
      const safeRolesResult = settledResult(settledRoles);
      const safeJobsResult = settledResult(settledJobs);
      const parseResult = async (result: PromiseSettledResult<Response>, label: string) => {
        if (result.status === 'rejected') return { ok: false, payload: {}, message: `${label}: تعذر الاتصال بالخدمة.` };
        const payload = await result.value.json().catch(() => ({}));
        if (!result.value.ok || !payload?.success) return { ok: false, payload, message: `${label}: ${payload?.message || 'تعذر تحميل البيانات.'}` };
        return { ok: true, payload, message: '' };
      };
      const [users, roles, jobs] = await Promise.all([
        parseResult(safeUsersResult, 'مستخدمو المدرسة'),
        parseResult(safeRolesResult, 'الأدوار المعتمدة'),
        parseResult(safeJobsResult, 'دليل الوظائف'),
      ]);
      const warnings = [users, roles, jobs].filter((item) => !item.ok).map((item) => item.message);
      if (users.ok) {
        const nextUsers = Array.isArray(users.payload.users) ? users.payload.users : [];
        setUsers(nextUsers);
        setRoleDrafts(Object.fromEntries(nextUsers.map((user: SchoolUser) => [user.id, user.roles?.[0]?.roleKey || ''])));
        setPermissionDrafts(Object.fromEntries(nextUsers.map((user: SchoolUser) => [user.id, (user.directPermissions || []).filter((permission) => permission.effect !== 'deny').map((permission) => permission.permissionKey)])));
      }
      if (roles.ok) {
        const nextRoles = Array.isArray(roles.payload.roles) ? roles.payload.roles : [];
        setRoles(nextRoles);
        setPermissionCatalog(Array.isArray(roles.payload.permissionCatalog) ? roles.payload.permissionCatalog : []);
        setForm((current) => ({ ...current, initialRole: current.initialRole || nextRoles[0]?.roleKey || '' }));
      }
      if (jobs.ok) {
        setDepartments(Array.isArray(jobs.payload.departments) ? jobs.payload.departments : []);
        setJobs(Array.isArray(jobs.payload.jobs) ? jobs.payload.jobs : []);
      }
      setLoadWarnings(warnings);
      if (warnings.length === 3) throw new Error('تعذر تحميل بيانات وحدة المستخدمين والصلاحيات من المصدر المركزي.');
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'تعذر تحميل دليل المستخدمين.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (editing) setForm((current) => ({ ...current, jobId: editing.job_id || '' }));
  }, [editing]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery = !normalized || [user.display_name, user.email, user.username, user.job_title, user.department, user.branch_name, ...(user.roles || []).flatMap((role) => [role.name, role.roleKey]), ...(user.directPermissions || []).map((permission) => permission.permissionKey)].some((value) => String(value || '').toLowerCase().includes(normalized));
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesRole = roleFilter === 'all' || (user.roles || []).some((role) => role.roleKey === roleFilter);
      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [query, roleFilter, statusFilter, users]);

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate) {
      notify('إنشاء المستخدم يتطلب صلاحيتي تعديل الهوية وإسناد الأدوار.', 'warning');
      return;
    }
    if (!roles.length || !form.initialRole) {
      notify('لا يمكن الحفظ قبل تحميل دور معتمد من المدرسة الأم.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const response = await authenticatedRequest('/api/school/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر إنشاء المستخدم.');
      setShowCreate(false);
      setForm({ name: '', email: '', jobId: '', jobTitle: '', department: '', initialRole: roles[0]?.roleKey || '', password: '', branchId: selectedBranch?.id || '' });
      setTemporaryPassword(payload.temporaryPassword || '');
      setLoginIdentifier(payload.loginIdentifier || payload.user?.email || payload.user?.username || '');
      notify('تم الحفظ بنجاح: أُنشئ المستخدم وربط بالدور وسُجلت العملية في قاعدة البيانات.', 'success');
      await load();
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'تعذر إنشاء المستخدم.', 'warning');
    } finally { setSaving(false); }
  };

  const mutate = async (user: SchoolUser, operation: string, body: Record<string, unknown> = {}) => {
    const isAssignmentOperation = operation === 'assign_role' || operation === 'set_permissions';
    if ((isAssignmentOperation && !canAssign) || (!isAssignmentOperation && !canManage)) {
      notify(isAssignmentOperation
        ? 'لا تملك صلاحية إسناد الأدوار أو التفويضات المباشرة.'
        : 'حسابك للعرض فقط؛ لا تملك صلاحية تعديل مستخدمي المدرسة.', 'warning');
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
    if (!canAssign) {
      notify('لا تملك صلاحية إسناد التفويضات المباشرة.', 'warning');
      return;
    }
    setPermissionEditing(user);
    setPermissionQuery('');
    setPermissionStateFilter('all');
    setPermissionDrafts((drafts) => ({ ...drafts, [user.id]: [...(user.directPermissions || []).filter((permission) => permission.effect !== 'deny').map((permission) => permission.permissionKey)] }));
  };

  const togglePermission = (permissionKey: string) => {
    if (!permissionEditing) return;
    if ((permissionEditing.directPermissions || []).some((permission) => permission.permissionKey === permissionKey && permission.effect === 'deny')) {
      notify('هذه الصلاحية ممنوعة مركزيًا لهذا الموظف ولا يمكن منحها من داخل المدرسة.', 'warning');
      return;
    }
    setPermissionDrafts((drafts) => {
      const current = new Set(drafts[permissionEditing.id] || []);
      if (current.has(permissionKey)) current.delete(permissionKey); else current.add(permissionKey);
      return { ...drafts, [permissionEditing.id]: [...current].sort() };
    });
  };

  const savePermissions = async () => {
    if (!permissionEditing) return;
    if (!confirmAction('سيتم استبدال التفويضات المباشرة الحالية بالقائمة المحددة. هل تريد المتابعة؟')) return;
    const saved = await mutate(permissionEditing, 'set_permissions', { permissionKeys: permissionDrafts[permissionEditing.id] || [] });
    if (saved) setPermissionEditing(null);
  };

  const permissionLabel = (permission: PermissionDescriptor) => {
    const resourceLabels: Record<string, string> = {
      Dashboard: 'لوحة التحكم', Student: 'شؤون الطلاب', StudentDocument: 'مستندات الطلاب',
      Exam: 'الامتحانات والنتائج', Hr: 'الموارد البشرية', Financial: 'الحسابات والمالية',
      Inventory: 'المخزون والمشتريات', Admission: 'القبول والتسجيل', Ai: 'المساعد الذكي',
      Identity: 'المستخدمون والصلاحيات', Audit: 'سجل الرقابة', Database: 'إدارة قاعدة البيانات',
      Assets: 'الأصول الثابتة', Attendance: 'الحضور والانصراف', Branches: 'الفروع', Buses: 'النقل المدرسي',
      Fixed_assets: 'الأصول الثابتة', Invoice: 'الفواتير', Ledger: 'دفتر الأستاذ', Library: 'المكتبة',
      Permissions: 'إدارة الصلاحيات', Procurement: 'المشتريات', Settings: 'الإعدادات',
      Uniform_management: 'الزي المدرسي', Warehouse: 'المستودعات',
    };
    const actionLabels: Record<string, string> = {
      View: 'عرض', Read: 'قراءة', Write: 'إضافة وتعديل', Edit: 'تعديل', Delete: 'حذف',
      Export: 'تصدير', Create: 'إنشاء', Verify: 'تحقق', Archive: 'أرشفة', Approve: 'اعتماد',
      Forecast: 'تنبؤ', Chat: 'محادثة', Assign: 'إسناد', Audit: 'تدقيق', Insert: 'إضافة',
      Print: 'طباعة', Post: 'ترحيل', Cancel: 'إلغاء', Refresh: 'تحديث', Backup: 'نسخة احتياطية',
      Monitor: 'مراقبة', Optimize: 'تحسين', Simulate: 'محاكاة', Borrow: 'إعارة', Reverse: 'عكس القيد',
      Link: 'ربط', Import: 'استيراد', Override: 'تجاوز', Sales: 'مبيعات', Stock: 'مخزون',
    };
    const action = permission.action.split('.').map((part) => actionLabels[part] || part.replaceAll('_', ' ')).join(' — ');
    return `${resourceLabels[permission.resource] || permission.resource.replaceAll('_', ' ')} — ${action}`;
  };

  const permissionOperationalDescription = (permission: PermissionDescriptor) => {
    const [resourceLabel, ...actionParts] = permissionLabel(permission).split(' — ');
    return `يسمح بـ${actionParts.join(' — ') || permission.action} ضمن ${resourceLabel} في نطاق المدرسة.`;
  };

  const centrallyDeniedPermissionKeys = useMemo(() => new Set(
    (permissionEditing?.directPermissions || [])
      .filter((permission) => permission.effect === 'deny')
      .map((permission) => permission.permissionKey),
  ), [permissionEditing]);

  const inheritedPermissionKeys = useMemo(() => {
    if (!permissionEditing) return new Set<string>();
    const roleKeys = new Set((permissionEditing.roles || []).map((role) => role.roleKey));
    return new Set(
      roles
        .filter((role) => roleKeys.has(role.roleKey))
        .flatMap((role) => (role.permissions || []).map((permission) => permission.permissionKey)),
    );
  }, [permissionEditing, roles]);

  const effectivePermissionKeys = useMemo(() => {
    if (!permissionEditing) return new Set<string>();
    const directKeys = new Set(permissionDrafts[permissionEditing.id] || []);
    return new Set(
      [...new Set([...inheritedPermissionKeys, ...directKeys])]
        .filter((permissionKey) => !centrallyDeniedPermissionKeys.has(permissionKey)),
    );
  }, [centrallyDeniedPermissionKeys, inheritedPermissionKeys, permissionDrafts, permissionEditing]);

  const getPermissionState = (permission: PermissionDescriptor) => {
    const centrallyDenied = centrallyDeniedPermissionKeys.has(permission.permissionKey);
    const inherited = inheritedPermissionKeys.has(permission.permissionKey);
    const direct = (permissionDrafts[permissionEditing?.id || ''] || []).includes(permission.permissionKey);
    const effective = effectivePermissionKeys.has(permission.permissionKey);
    return { centrallyDenied, inherited, direct, effective };
  };

  const visiblePermissionCatalog = useMemo(() => {
    const normalized = permissionQuery.trim().toLowerCase();
    return permissionCatalog.filter((permission) => {
      const state = getPermissionState(permission);
      const matchesQuery = !normalized || `${permission.permissionKey} ${permissionLabel(permission)} ${permission.description || ''}`.toLowerCase().includes(normalized);
      const matchesState = permissionStateFilter === 'all'
        || (permissionStateFilter === 'effective' && state.effective)
        || (permissionStateFilter === 'direct' && state.direct && !state.inherited && !state.centrallyDenied)
        || (permissionStateFilter === 'inherited' && state.inherited && !state.centrallyDenied)
        || (permissionStateFilter === 'unassigned' && !state.effective && !state.centrallyDenied)
        || (permissionStateFilter === 'denied' && state.centrallyDenied);
      return matchesQuery && matchesState;
    });
  }, [centrallyDeniedPermissionKeys, effectivePermissionKeys, inheritedPermissionKeys, permissionCatalog, permissionDrafts, permissionEditing, permissionQuery, permissionStateFilter]);

  const permissionSummary = useMemo(() => {
    const states = permissionCatalog.map(getPermissionState);
    return {
      modules: new Set(permissionCatalog.map((permission) => permission.resource)).size,
      effective: states.filter((state) => state.effective).length,
      inherited: states.filter((state) => state.inherited && !state.centrallyDenied).length,
      direct: states.filter((state) => state.direct && !state.inherited && !state.centrallyDenied).length,
      denied: states.filter((state) => state.centrallyDenied).length,
      unassigned: states.filter((state) => !state.effective && !state.centrallyDenied).length,
    };
  }, [centrallyDeniedPermissionKeys, effectivePermissionKeys, inheritedPermissionKeys, permissionCatalog, permissionDrafts, permissionEditing]);

  const visiblePermissionGroups = useMemo(() => {
    const groups = new Map<string, PermissionDescriptor[]>();
    visiblePermissionCatalog.forEach((permission) => {
      const current = groups.get(permission.resource) || [];
      current.push(permission);
      groups.set(permission.resource, current);
    });
    return [...groups.entries()]
      .map(([resource, permissions]) => ({
        resource,
        label: permissionLabel(permissions[0]).split(' — ')[0],
        permissions: [...permissions].sort((left, right) => permissionLabel(left).localeCompare(permissionLabel(right), 'ar')),
      }))
      .sort((left, right) => left.label.localeCompare(right.label, 'ar'));
  }, [visiblePermissionCatalog]);

  const setModuleDirectPermissions = (resource: string, grant: boolean) => {
    if (!permissionEditing || !canAssign) return;
    const eligibleKeys = permissionCatalog
      .filter((permission) => permission.resource === resource)
      .filter((permission) => !centrallyDeniedPermissionKeys.has(permission.permissionKey) && !inheritedPermissionKeys.has(permission.permissionKey))
      .map((permission) => permission.permissionKey);
    setPermissionDrafts((drafts) => {
      const next = new Set(drafts[permissionEditing.id] || []);
      eligibleKeys.forEach((permissionKey) => grant ? next.add(permissionKey) : next.delete(permissionKey));
      return { ...drafts, [permissionEditing.id]: [...next].sort() };
    });
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const saved = await mutate(editing, 'update', { displayName: form.name, email: form.email, jobId: form.jobId, jobTitle: form.jobTitle, department: form.department });
    if (saved) setEditing(null);
  };

  const openNewUser = () => {
    if (!canCreate) {
      notify('إنشاء المستخدم يتطلب صلاحيتي تعديل الهوية وإسناد الأدوار.', 'warning');
      return;
    }
    setEditing(null);
    setForm({ name: '', email: '', jobId: '', jobTitle: '', department: '', initialRole: roles[0]?.roleKey || '', password: '', branchId: selectedBranch?.id || '' });
    setShowCreate(true);
  };

  const confirmAction = (message: string) => typeof window === 'undefined' || window.confirm(message);

  // The permission editor intentionally owns the whole working surface. This
  // keeps the security decision readable on smaller screens and prevents an
  // administrator from confusing a role permission with a direct exception.
  if (permissionEditing) {
    const coverage = permissionCatalog.length ? Math.round((permissionSummary.effective / permissionCatalog.length) * 100) : 0;
    const selectedRoleNames = (permissionEditing.roles || []).map((role) => role.name).filter(Boolean);

    return (
      <section className="min-h-screen bg-slate-100 p-3 text-slate-900 sm:p-6" dir="rtl">
        <div className="mx-auto max-w-[96rem]">
          <div role="dialog" aria-modal="true" aria-label={`صلاحيات ${permissionEditing.display_name}`} className="overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-2xl">
            <header className="bg-gradient-to-l from-slate-950 via-slate-900 to-amber-950 p-5 text-white sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-black text-amber-300"><ShieldCheck className="h-5 w-5" /> مصفوفة قرار الصلاحيات</div>
                  <h2 className="text-2xl font-black">صلاحيات {permissionEditing.display_name}</h2>
                  <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-300">تعرض هذه المصفوفة المصدر الحقيقي لكل صلاحية. القالب المركزي يورّث الصلاحيات، والتفويض المباشر يضيف استثناءً محليًا، والمنع المركزي له الأولوية دائمًا.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-bold">الدور: {selectedRoleNames.join('، ') || 'بدون دور'}</span>
                  <button type="button" aria-label="إغلاق نافذة الصلاحيات" onClick={() => setPermissionEditing(null)} className="rounded-xl bg-white/10 p-2.5 hover:bg-white/20"><X className="h-5 w-5" /></button>
                </div>
              </div>
            </header>

            <div className="grid gap-3 border-b border-slate-100 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-black text-slate-500">إجمالي الصلاحيات</p><p className="mt-1 text-2xl font-black">{permissionCatalog.length}</p><p className="text-[10px] text-slate-500">ضمن {permissionSummary.modules} وحدات</p></div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3"><p className="text-[10px] font-black text-emerald-700">فعّالة الآن</p><p className="mt-1 text-2xl font-black text-emerald-900">{permissionSummary.effective}</p><p className="text-[10px] text-emerald-700">تغطية {coverage}%</p></div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3"><p className="text-[10px] font-black text-sky-700">موروثة من الدور</p><p className="mt-1 text-2xl font-black text-sky-900">{permissionSummary.inherited}</p><p className="text-[10px] text-sky-700">من قالب المدرسة الأم</p></div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3"><p className="text-[10px] font-black text-amber-700">تفويض مباشر</p><p className="mt-1 text-2xl font-black text-amber-900">{permissionSummary.direct}</p><p className="text-[10px] text-amber-700">قابل للتعديل محليًا</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-black text-slate-500">غير ممنوحة</p><p className="mt-1 text-2xl font-black">{permissionSummary.unassigned}</p><p className="text-[10px] text-slate-500">لا تمنح الوصول</p></div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3"><p className="text-[10px] font-black text-rose-700">منع مركزي</p><p className="mt-1 text-2xl font-black text-rose-900">{permissionSummary.denied}</p><p className="text-[10px] text-rose-700">محمي من التجاوز</p></div>
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">✓ فعّالة</span>
                <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sky-800">موروثة من الدور</span>
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">مباشرة من المدرسة</span>
                <span className="rounded-full bg-rose-100 px-3 py-1.5 text-rose-800">ممنوعة مركزيًا</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-64 flex-1"><Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" /><input aria-label="بحث في الصلاحيات" value={permissionQuery} onChange={(event) => setPermissionQuery(event.target.value)} placeholder="ابحث باسم الشاشة أو الوظيفة أو المفتاح" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-9 text-xs outline-none focus:border-amber-400 focus:bg-white" /></div>
                <select aria-label="تصفية حالة الصلاحيات" value={permissionStateFilter} onChange={(event) => setPermissionStateFilter(event.target.value as PermissionStateFilter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold outline-none focus:border-amber-400"><option value="all">كل الحالات</option><option value="effective">الفعالة فقط</option><option value="inherited">الموروثة من الدور</option><option value="direct">التفويض المباشر</option><option value="unassigned">غير الممنوحة</option><option value="denied">المنع المركزي</option></select>
                <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[10px] font-bold text-slate-600">منح أو سحب التفويض يتم من رأس كل وحدة.</span>
              </div>
            </div>

            <div className="bg-slate-50/70 p-3 sm:p-5">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><span className="text-xs font-black text-slate-700">الوحدات والصلاحيات التفصيلية</span><p className="mt-1 text-[10px] text-slate-500">كل وحدة مكتملة تظهر أولاً، وتأتي وظائفها وأزرارها تحتها مباشرة.</p></div><span className="text-xs font-bold text-slate-500">عرض {visiblePermissionCatalog.length} من {permissionCatalog.length} عبر {visiblePermissionGroups.length} وحدات</span></div>
              <div className="space-y-4">{visiblePermissionGroups.map((group) => {
                const allModulePermissions = permissionCatalog.filter((permission) => permission.resource === group.resource);
                const eligiblePermissions = allModulePermissions.filter((permission) => { const state = getPermissionState(permission); return !state.centrallyDenied && !state.inherited; });
                const everyEligibleDirect = eligiblePermissions.length > 0 && eligiblePermissions.every((permission) => getPermissionState(permission).direct);
                const directInModule = allModulePermissions.filter((permission) => getPermissionState(permission).direct && !getPermissionState(permission).inherited).length;
                const inheritedInModule = allModulePermissions.filter((permission) => getPermissionState(permission).inherited && !getPermissionState(permission).centrallyDenied).length;
                const effectiveInModule = allModulePermissions.filter((permission) => getPermissionState(permission).effective).length;
                return <section key={group.resource} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-l from-slate-900 to-slate-800 p-4 text-white lg:flex-row lg:items-center lg:justify-between">
                    <div><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-xs font-black text-slate-950">{group.permissions.length}</span><h3 className="font-black">وحدة {group.label}</h3></div><p className="mt-1 text-[10px] text-slate-300">{effectiveInModule} فعّالة • {inheritedInModule} موروثة • {directInModule} تفويض مباشر • {allModulePermissions.length} صلاحية في الوحدة</p></div>
                    <div className="flex flex-wrap items-center gap-2">{eligiblePermissions.length > 0 ? <><button type="button" disabled={!canAssign || everyEligibleDirect} onClick={() => setModuleDirectPermissions(group.resource, true)} className="rounded-xl bg-amber-400 px-3 py-2 text-[10px] font-black text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-45">{everyEligibleDirect ? 'تفويض الوحدة مكتمل' : `منح تفويضات وحدة ${group.label}`}</button><button type="button" disabled={!canAssign || directInModule === 0} onClick={() => setModuleDirectPermissions(group.resource, false)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-45">سحب التفويض المباشر</button></> : <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-bold text-slate-200">تدار من القالب المركزي أو المنع المركزي</span>}</div>
                  </div>
                  <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right text-xs"><thead className="bg-slate-50 text-[10px] font-black text-slate-600"><tr><th className="p-3">الوظيفة أو الزر</th><th className="p-3">الوصف التشغيلي</th><th className="p-3">مفتاح الصلاحية</th><th className="p-3 text-center">مصدر المنح</th><th className="p-3 text-center">تفويض مباشر</th><th className="p-3 text-center">الحالة الفعالة</th></tr></thead><tbody className="divide-y divide-slate-100">{group.permissions.map((permission) => {
                    const state = getPermissionState(permission);
                    const actionLabel = permissionLabel(permission).split(' — ').slice(1).join(' — ');
                    const source = state.centrallyDenied ? <span className="rounded-full bg-rose-100 px-2 py-1 text-[9px] font-black text-rose-700">منع مركزي</span>
                      : state.inherited && state.direct ? <span className="rounded-full bg-violet-100 px-2 py-1 text-[9px] font-black text-violet-700">دور + مباشر</span>
                        : state.inherited ? <span className="rounded-full bg-sky-100 px-2 py-1 text-[9px] font-black text-sky-700">قالب الدور</span>
                          : state.direct ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800">تفويض مباشر</span>
                            : <span className="text-slate-400">غير ممنوحة</span>;
                    return <tr key={permission.permissionKey} className={state.centrallyDenied ? 'bg-rose-50/70' : state.effective ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'bg-white hover:bg-slate-50'}><td className="p-3"><div className="font-bold text-slate-800">{actionLabel || permission.action}</div><div className="mt-1 text-[10px] text-slate-500">{permission.action}</div></td><td className="max-w-72 p-3 text-[10px] leading-5 text-slate-600">{permissionOperationalDescription(permission)}</td><td className="p-3"><code className="rounded bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600">{permission.permissionKey}</code></td><td className="p-3 text-center">{source}</td><td className="p-3 text-center">{state.centrallyDenied ? <span title="ممنوعة مركزيًا"><Lock className="mx-auto h-4 w-4 text-rose-600" aria-label="ممنوعة مركزيًا" /></span> : <input type="checkbox" aria-label={`تفويض مباشر ${permission.permissionKey}`} checked={state.direct} disabled={state.inherited || !canAssign} onChange={() => togglePermission(permission.permissionKey)} className="h-5 w-5 cursor-pointer accent-amber-600 disabled:cursor-not-allowed disabled:opacity-45" />}</td><td className="p-3 text-center"><label className={`inline-flex min-w-24 items-center justify-center gap-2 rounded-xl border px-2.5 py-1.5 text-[10px] font-black ${state.effective ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : state.centrallyDenied ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-slate-200 bg-slate-50 text-slate-500'}`}><input type="checkbox" aria-label={`الحالة الفعالة ${permission.permissionKey}`} checked={state.effective} disabled aria-readonly="true" className="h-4 w-4 accent-emerald-600 disabled:cursor-default disabled:opacity-100" /><span>{state.effective ? 'مفعّل' : state.centrallyDenied ? 'محظور مركزيًا' : 'غير مفعّل'}</span></label></td></tr>;
                  })}</tbody></table></div>
                </section>;
              })}</div>
              {visiblePermissionGroups.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center"><p className="text-sm font-black text-slate-600">لا توجد صلاحيات مطابقة للتصفية الحالية.</p><button type="button" onClick={() => { setPermissionQuery(''); setPermissionStateFilter('all'); }} className="mt-3 text-xs font-black text-amber-700 underline">إظهار كامل الوحدات</button></div>}
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] leading-5 text-slate-500">الحفظ يحدّث التفويضات المباشرة فقط، ويسجل العملية في الرقابة. صلاحيات الدور تُدار وتنشر من المدرسة الأم.</p><div className="flex gap-2"><button type="button" onClick={() => setPermissionEditing(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-black">إلغاء</button><button type="button" disabled={saving || !canAssign} onClick={() => void savePermissions()} className="rounded-xl bg-amber-600 px-6 py-2.5 text-xs font-black text-white shadow-lg hover:bg-amber-500 disabled:opacity-50">{saving ? 'جارٍ تطبيق الصلاحيات...' : 'حفظ التغييرات وتسجيلها'}</button></div></footer>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] bg-slate-50 p-4 sm:p-6 text-slate-900" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-l from-slate-950 via-slate-900 to-amber-950/40 p-6 text-white shadow-2xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-amber-300"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-black tracking-wide">هوية المدرسة • نطاق موثوق</span></div>
              <h1 className="text-2xl font-black">مستخدمو المدرسة والصلاحيات</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">إنشاء المستخدمين وإسناد القوالب المعتمدة من الإدارة المركزية داخل مدرسة {selectedSchool?.name || 'الحالية'} فقط.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">النطاق: {selectedBranch?.name || 'كل فروع المدرسة'}</span><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-emerald-200">لا توجد صلاحيات منصة أو وصول لمدارس أخرى</span></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {onBackToMainMenu && <button type="button" onClick={onBackToMainMenu} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black shadow-lg transition hover:bg-white/20"><Home className="ml-1 inline h-4 w-4" /> العودة للقائمة الرئيسية</button>}
              <button type="button" onClick={() => void load()} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/15" title="تحديث"><RefreshCw className="inline h-4 w-4" /></button>
              <button type="button" onClick={openNewUser} disabled={!canCreate} title={canCreate ? 'إضافة مستخدم داخل المدرسة الحالية' : 'تحتاج صلاحيتي Identity.Users.Write وIdentity.Users.Assign'} className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black shadow-lg hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="ml-1 inline h-4 w-4" /> مستخدم جديد</button>
            </div>
          </div>
        </div>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error} <button className="mr-3 underline" onClick={() => void load()}>إعادة المحاولة</button></div>}
        {!error && loadWarnings.length > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-900"><div>تم تحميل الأجزاء المتاحة دون إخفاء البيانات السليمة. راجع العناصر التالية ثم أعد المحاولة:</div><ul className="mr-5 list-disc">{loadWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul><button className="mt-1 underline" onClick={() => void load()}>إعادة تحميل الأجزاء المتعثرة</button></div>}
        {(!canManage || !canAssign) && <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs font-bold leading-6 text-sky-900">صلاحيات الإدارة مفصولة: التعديل والحالة يتطلبان Identity.Users.Write، بينما إنشاء مستخدم وإسناد دوره أو تفويضاته يتطلبان أيضًا Identity.Users.Assign.</div>}
        {(temporaryPassword || loginIdentifier) && <div className="flex flex-col gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 sm:flex-row sm:items-center sm:justify-between"><div><b>تم الحفظ بنجاح وتأكيد الربط بقاعدة البيانات.</b>{loginIdentifier && <div className="mt-2 text-xs">اسم الدخول: <code className="rounded bg-white px-2 py-1 font-mono">{loginIdentifier}</code></div>}{temporaryPassword && <div className="mt-2 text-xs">كلمة مرور مؤقتة — اعرضها للمستخدم مرة واحدة فقط: <code className="rounded bg-white px-2 py-1 font-mono">{temporaryPassword}</code></div>}</div><button onClick={() => { setTemporaryPassword(''); setLoginIdentifier(''); }} className="text-xs font-black underline">إخفاء</button></div>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-slate-200 bg-white p-4"><Users className="mb-2 h-5 w-5 text-amber-600" /><div className="text-2xl font-black">{users.length}</div><div className="text-xs font-bold text-slate-500">إجمالي مستخدمي المدرسة</div></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><UserCheck className="mb-2 h-5 w-5 text-emerald-600" /><div className="text-2xl font-black">{users.filter((user) => user.status === 'active').length}</div><div className="text-xs font-bold text-slate-500">حسابات نشطة</div></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><Lock className="mb-2 h-5 w-5 text-amber-600" /><div className="text-2xl font-black">{roles.length}</div><div className="text-xs font-bold text-slate-500">قوالب أدوار منشورة مركزياً</div></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><ShieldCheck className="mb-2 h-5 w-5 text-amber-600" /><div className="text-2xl font-black">{permissionCatalog.length}</div><div className="text-xs font-bold text-slate-500">صلاحيات دقيقة قابلة للإسناد</div></div></div>

        <nav aria-label="شاشات إدارة المستخدمين والصلاحيات" className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {([
            ['users', 'المستخدمون والوظائف'],
            ['roles', 'الأدوار المعتمدة'],
            ['permissions', 'مصفوفة الصلاحيات'],
          ] as Array<[ManagementView, string]>).map(([view, label]) => (
            <button key={view} type="button" onClick={() => setActiveView(view)} className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${activeView === view ? 'bg-slate-950 text-amber-300 shadow' : 'text-slate-600 hover:bg-amber-50 hover:text-amber-800'}`}>
              {label}
            </button>
          ))}
        </nav>

      {activeView === 'users' && <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black">دليل مستخدمي المدرسة</h2><p className="mt-1 text-xs text-slate-500">كل تغيير يمر عبر API موثوق ويُسجل في سجل الرقابة المركزي.</p></div><div className="relative w-full sm:w-80"><Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" /><input aria-label="البحث في مستخدمي المدرسة" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث بالاسم أو البريد أو الدور" className="w-full rounded-xl border border-slate-200 py-2 pl-3 pr-9 text-sm outline-none focus:border-amber-400" /></div></div><div className="flex flex-wrap items-center gap-2"><select aria-label="تصفية حسب الحالة" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold"><option value="all">كل الحالات</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="تصفية حسب الدور" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold"><option value="all">كل الأدوار</option>{roles.map((role) => <option key={role.roleKey} value={role.roleKey}>{role.name}</option>)}</select><span className="text-xs font-bold text-slate-500">عرض {filteredUsers.length} من {users.length}</span>{(query || statusFilter !== 'all' || roleFilter !== 'all') && <button type="button" onClick={() => { setQuery(''); setStatusFilter('all'); setRoleFilter('all'); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">مسح التصفية</button>}</div></div>
          {loading ? <div className="p-12 text-center text-sm font-bold text-slate-500">جارٍ تحميل دليل الهوية...</div> : filteredUsers.length === 0 ? <div className="p-12 text-center text-sm font-bold text-slate-500">لا توجد حسابات مطابقة للتصفية الحالية.</div> : <div className="overflow-x-auto"><table className="min-w-[1180px] w-full text-right text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-4">المستخدم</th><th className="p-4">الوظيفة والقسم</th><th className="p-4">الدور المركزي</th><th className="p-4">تفويض دقيق</th><th className="p-4">الحالة</th><th className="p-4">إجراءات آمنة</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredUsers.map((user) => <tr key={user.id} className="align-top hover:bg-slate-50/70"><td className="p-4"><div className="font-black">{user.display_name}</div><div className="mt-1 text-xs text-slate-500">{user.email || 'بريد غير متاح'}</div><div className="mt-1 text-[10px] text-slate-400">{user.branch_name || 'الفرع الرئيسي'}</div></td><td className="p-4"><div>{user.job_title || '—'}</div><div className="mt-1 text-xs text-slate-500">{user.department || '—'}</div></td><td className="p-4"><div className="flex items-center gap-2"><select aria-label={`الدور للمستخدم ${user.display_name}`} disabled={!canAssign} value={roleDrafts[user.id] || user.roles?.[0]?.roleKey || ''} onChange={(event) => setRoleDrafts((drafts) => ({ ...drafts, [user.id]: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60">{roles.map((role) => <option key={role.roleKey} value={role.roleKey}>{role.name}</option>)}</select>{canAssign && <button disabled={saving || !roleDrafts[user.id] || roleDrafts[user.id] === user.roles?.[0]?.roleKey} onClick={() => confirmAction('سيتم استبدال الدور الحالي بالدور المحدد. هل تريد المتابعة؟') && void mutate(user, 'assign_role', { roleKey: roleDrafts[user.id] })} className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-800 disabled:opacity-40">حفظ</button>}</div><div className="mt-2 flex flex-wrap gap-1">{(roles.find((role) => role.roleKey === (roleDrafts[user.id] || user.roles?.[0]?.roleKey))?.permissions || []).slice(0, 4).map((permission) => <span key={permission.permissionKey} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{permission.permissionKey}</span>)}</div></td><td className="p-4"><div className="flex items-center gap-2"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-800">{(user.directPermissions || []).filter((permission) => permission.effect !== 'deny').length} سماح خاص</span>{(user.directPermissions || []).some((permission) => permission.effect === 'deny') && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black text-rose-700">{(user.directPermissions || []).filter((permission) => permission.effect === 'deny').length} منع مركزي</span>}{canAssign && <button type="button" onClick={() => openPermissionEditor(user)} className="rounded-lg bg-amber-700 px-2.5 py-1.5 text-[10px] font-black text-white hover:bg-amber-600">إدارة الصلاحيات</button>}</div>{(user.directPermissions || []).length > 0 && <div className="mt-2 flex max-w-[260px] flex-wrap gap-1">{(user.directPermissions || []).slice(0, 3).map((permission) => <span key={permission.permissionKey} className={`rounded px-1.5 py-0.5 text-[9px] ${permission.effect === 'deny' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>{permission.effect === 'deny' ? 'منع: ' : ''}{permissionLabel({ permissionKey: permission.permissionKey, resource: permission.resource || permission.permissionKey.split('.')[0], action: permission.action || permission.permissionKey.split('.').slice(1).join('.') })}</span>)}{(user.directPermissions || []).length > 3 && <span className="text-[9px] font-bold text-slate-400">+{(user.directPermissions || []).length - 3}</span>}</div>}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : user.status === 'archived' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700'}`}>{statusLabels[user.status]}</span>{user.force_password_change && <div className="mt-2 text-[10px] font-bold text-amber-700">يتطلب تغيير كلمة المرور</div>}</td><td className="p-4"><div className="flex flex-wrap gap-2">{canManage && <button onClick={() => { setEditing(user); setForm({ name: user.display_name, email: user.email || '', jobTitle: user.job_title || '', department: user.department || '', initialRole: user.roles?.[0]?.roleKey || roles[0]?.roleKey || '', password: '', branchId: user.branch_id || selectedBranch?.id || '' }); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-black hover:bg-slate-50">تحرير</button>}{canManage && <button onClick={() => confirmAction('سيتم إصدار كلمة مرور مؤقتة وإنهاء الجلسات الحالية. هل تريد المتابعة؟') && void mutate(user, 'reset_password')} disabled={saving || user.status === 'archived'} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-black text-amber-700 disabled:opacity-40"><KeyRound className="ml-1 inline h-3 w-3" />ضبط كلمة المرور</button>}{canManage && <button onClick={() => confirmAction('سيتم إنهاء جميع جلسات هذا المستخدم. هل تريد المتابعة؟') && void mutate(user, 'evict_sessions')} disabled={saving || user.status === 'archived'} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-black text-slate-700 disabled:opacity-40"><LogOut className="ml-1 inline h-3 w-3" />إنهاء الجلسات</button>}{canManage && <button onClick={() => confirmAction('سيتم تغيير سياسة كلمة المرور لهذا المستخدم. هل تريد المتابعة؟') && void mutate(user, 'force_password', { forcePasswordChange: !user.force_password_change })} disabled={saving || user.status === 'archived'} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-black text-amber-800 disabled:opacity-40">{user.force_password_change ? 'إلغاء إلزام التغيير' : 'إلزام تغيير المرور'}</button>}{canManage && (user.status === 'active' ? <button onClick={() => confirmAction('سيتم إيقاف الحساب وإنهاء جلساته الحالية. هل تريد المتابعة؟') && void mutate(user, 'status', { status: 'suspended' })} disabled={saving} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[10px] font-black text-rose-700 disabled:opacity-40"><UserMinus className="ml-1 inline h-3 w-3" />إيقاف</button> : user.status !== 'archived' ? <button onClick={() => void mutate(user, 'status', { status: 'active' })} disabled={saving} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black text-emerald-700 disabled:opacity-40">تفعيل</button> : null)}</div></td></tr>)}</tbody></table></div>}
        </div>}

        {activeView === 'roles' && <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby="roles-screen-title">
          <div className="border-b border-slate-100 bg-slate-50 p-5"><h2 id="roles-screen-title" className="font-black">الأدوار المعتمدة من المدرسة الأم</h2><p className="mt-1 text-xs leading-5 text-slate-500">هذه الشاشة للعرض الواضح فقط؛ الإضافة والتعديل والنشر تتم في المدرسة الأم المركزية ثم تصل إلى هذه المدرسة تلقائيًا.</p></div>
          <div className="grid gap-4 p-5 md:grid-cols-2">{roles.map((role) => <article key={role.roleKey} className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">{role.name}</h3><p className="mt-1 font-mono text-[10px] text-slate-500">{role.roleKey}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-amber-800">{(role.permissions || []).length} صلاحية</span></div>{role.description && <p className="mt-3 text-xs leading-5 text-slate-600">{role.description}</p>}<div className="mt-3 flex flex-wrap gap-1.5">{(role.permissions || []).slice(0, 12).map((permission) => <span key={permission.permissionKey} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{permissionLabel(permission)}</span>)}{(role.permissions || []).length > 12 && <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">+{(role.permissions || []).length - 12} أخرى</span>}</div></article>)}</div>
          {roles.length === 0 && <div className="p-12 text-center text-sm font-bold text-slate-500">لا توجد أدوار منشورة من المدرسة الأم بعد.</div>}
        </section>}

        {activeView === 'permissions' && <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby="permissions-screen-title">
          <div className="border-b border-slate-100 bg-slate-50 p-5"><h2 id="permissions-screen-title" className="font-black">مصفوفة الصلاحيات حسب الموظف</h2><p className="mt-1 text-xs leading-5 text-slate-500">اختر الموظف لفتح شاشة السماح والمنع التفصيلي. الأدوار الأساسية والتحديثات مصدرها المدرسة الأم، والتفويض المحلي لا يتجاوز المنع المركزي.</p></div>
          <div className="divide-y divide-slate-100">{users.map((user) => <div key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-black">{user.display_name}</div><div className="mt-1 text-xs text-slate-500">{user.job_title || 'مسمى وظيفي غير محدد'} • {(user.roles || []).map((role) => role.name).join('، ') || 'دون دور'}</div></div><div className="flex flex-wrap items-center gap-2 text-[10px] font-black"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{(user.roles || []).length} دور</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">{(user.directPermissions || []).filter((permission) => permission.effect !== 'deny').length} سماح خاص</span><span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">{(user.directPermissions || []).filter((permission) => permission.effect === 'deny').length} منع مركزي</span><button type="button" disabled={!canAssign} onClick={() => openPermissionEditor(user)} className="rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black text-amber-300 disabled:cursor-not-allowed disabled:opacity-50">فتح التفويض</button></div></div>)}{users.length === 0 && <div className="p-12 text-center text-sm font-bold text-slate-500">لا توجد حسابات لعرض مصفوفة الصلاحيات.</div>}</div>
        </section>}

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-950"><b>سياسة الحوكمة:</b> المدرسة الأم المركزية هي المصدر الوحيد لإضافة الأدوار والصلاحيات ونشرها. المدرسة المفتوحة تدير موظفيها داخل نطاقها فقط، ولا تستطيع إنشاء قالب جديد أو منح Platform.Admin أو تجاوز منع مركزي. الوظيفة تُختار من دليل شؤون الموظفين، بينما الدور يحدد صلاحيات الدخول.</div>
      </div>

          {(showCreate || editing) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><form role="dialog" aria-modal="true" aria-label={editing ? 'تحرير بيانات المستخدم' : 'إنشاء مستخدم مدرسة'} onSubmit={editing ? saveEdit : submitCreate} className="w-full max-w-xl space-y-4 rounded-3xl border border-amber-200 bg-white p-6 shadow-2xl" dir="rtl"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black">{editing ? 'تحرير بيانات المستخدم' : 'إنشاء مستخدم مدرسة'}</h2><p className="mt-1 text-[10px] font-bold text-slate-500">{editing ? 'عدّل البيانات ثم احفظ التعديل بأمان.' : 'أدخل بيانات المستخدم ثم احفظه داخل مدارس الأسرة فقط.'}</p></div><div className="flex items-center gap-2"><button type="button" onClick={openNewUser} disabled={!canCreate} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-black text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="ml-1 inline h-3.5 w-3.5" /> مستخدم جديد</button><button type="button" aria-label="إغلاق نافذة المستخدم" onClick={() => { setShowCreate(false); setEditing(null); }}><X className="h-5 w-5" /></button></div></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">الاسم الكامل<input required minLength={2} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border p-2.5" /></label><label className="text-xs font-bold">البريد الإلكتروني <span className="font-normal text-slate-500">(اختياري)</span><input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="يمكن تركه فارغاً" className="mt-1 w-full rounded-xl border p-2.5" />{!editing && <span className="mt-1 block text-[10px] font-normal text-slate-500">عند تركه فارغاً سيُنشئ النظام اسم دخول داخلياً آمناً.</span>}</label><label className="text-xs font-bold">المسمى الوظيفي<input value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} className="mt-1 w-full rounded-xl border p-2.5" /></label><label className="text-xs font-bold">القسم<select value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} className="mt-1 w-full rounded-xl border p-2.5"><option value="">غير محدد</option>{departments.map((department) => <option key={department.id} value={department.nameAr || department.nameEn || department.id}>{department.nameAr || department.nameEn || department.id}</option>)}</select><span className="mt-1 block text-[10px] font-normal text-slate-500">القائمة من دليل الأقسام في شؤون الموظفين.</span></label><label className="text-xs font-bold">الوظيفة من دليل شؤون الموظفين<select disabled={jobs.length === 0} value={form.jobId} onChange={(event) => setForm((current) => ({ ...current, jobId: event.target.value }))} className="mt-1 w-full rounded-xl border border-amber-200 bg-amber-50 p-2.5 disabled:cursor-not-allowed disabled:bg-slate-100"><option value="">{jobs.length ? 'مسمى يدوي / غير محدد' : 'لا توجد وظائف منشورة من شؤون الموظفين'}</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.titleAr}{job.departmentName ? ` — ${job.departmentName}` : ''}</option>)}</select><span className="mt-1 block text-[10px] font-normal text-slate-500">{jobs.length ? 'يُحفظ معرف الوظيفة مع المستخدم، بينما يحدد الدور الأمني صلاحيات الدخول.' : 'أضف الوظائف من وحدة شؤون الموظفين لتظهر هنا تلقائياً؛ يمكنك استخدام المسمى الوظيفي اليدوي مؤقتاً.'}</span></label>{!editing && <><label className="text-xs font-bold">الدور المعتمد<select required disabled={roles.length === 0 || !canAssign} value={form.initialRole} onChange={(event) => setForm({ ...form, initialRole: event.target.value })} className="mt-1 w-full rounded-xl border border-amber-200 bg-amber-50 p-2.5">{roles.length === 0 ? <option value="">لا توجد أدوار معتمدة منشورة</option> : roles.map((role) => <option key={role.roleKey} value={role.roleKey}>{role.name}</option>)}</select>{roles.length === 0 && <span className="mt-1 block text-[10px] font-normal text-rose-600">لا يمكن الحفظ حتى تصل قوالب الأدوار من المدرسة الأم.</span>}</label><label className="text-xs font-bold">كلمة مرور اختيارية<input type="password" minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="اتركها للتوليد الآمن" className="mt-1 w-full rounded-xl border p-2.5" /><span className="mt-1 block text-[10px] font-normal text-slate-500">8 رموز على الأقل. تركها فارغًا يولّد كلمة مؤقتة مع إلزام تغييرها.</span></label></>}</div><div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">نطاق الحساب: <b>{selectedBranch?.name || 'الفرع الرئيسي'}</b>. لا يمكن للمستخدم الوصول إلى مدرسة أخرى.</div><div className="flex justify-end gap-2"><button type="button" onClick={() => { setShowCreate(false); setEditing(null); }} className="rounded-xl border px-4 py-2 text-xs font-black">إلغاء</button><button type="submit" disabled={saving || (!editing && (!canCreate || roles.length === 0))} className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-black text-white shadow-lg disabled:opacity-50">{saving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديل' : 'إنشاء المستخدم'}</button></div></form></div>}

      {permissionEditing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"><div role="dialog" aria-modal="true" aria-label={`صلاحيات ${permissionEditing.display_name}`} className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-2xl" dir="rtl"><div className="flex items-start justify-between gap-4 bg-gradient-to-l from-slate-950 to-amber-950 p-6 text-white"><div><div className="mb-1 flex items-center gap-2 text-amber-300"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-black">مصفوفة صلاحيات المستخدم</span></div><h2 className="text-xl font-black">صلاحيات {permissionEditing.display_name}</h2><p className="mt-2 text-xs leading-5 text-amber-100/80">علامة الصح تعني أن الصلاحية فعالة من الدور أو التفويض المباشر. الصلاحية غير المحددة لا تسمح بالوصول، والمنع المركزي مقفل ولا يمكن تجاوزه من المدرسة.</p></div><button type="button" aria-label="إغلاق نافذة الصلاحيات" onClick={() => setPermissionEditing(null)} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X className="h-5 w-5" /></button></div><div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between"><div className="text-xs font-bold text-slate-600">الفعالة <span className="text-amber-700">{effectivePermissionKeys.size}</span> من أصل {permissionCatalog.length} • المباشرة القابلة للتعديل <span className="text-amber-700">{(permissionDrafts[permissionEditing.id] || []).length}</span>{centrallyDeniedPermissionKeys.size > 0 && <span className="mr-2 text-rose-700">• {centrallyDeniedPermissionKeys.size} ممنوعة مركزيًا</span>}</div><div className="flex flex-wrap items-center gap-2"><div className="relative w-full sm:w-72"><Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" /><input aria-label="بحث في الوحدات والأزرار" value={permissionQuery} onChange={(event) => setPermissionQuery(event.target.value)} placeholder="بحث في الوحدات والأزرار" className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-xs outline-none focus:border-amber-400" /></div><button type="button" onClick={() => setPermissionDrafts((drafts) => ({ ...drafts, [permissionEditing.id]: visiblePermissionCatalog.filter((permission) => !centrallyDeniedPermissionKeys.has(permission.permissionKey) && !inheritedPermissionKeys.has(permission.permissionKey)).map((permission) => permission.permissionKey) }))} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-[10px] font-black text-amber-800">تحديد المباشر الظاهر</button><button type="button" onClick={() => setPermissionDrafts((drafts) => ({ ...drafts, [permissionEditing.id]: [] }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600">مسح التفويض المباشر</button></div></div><div className="flex-1 overflow-y-auto p-3 sm:p-5"><div className="overflow-hidden rounded-2xl border border-slate-200"><table className="w-full min-w-[860px] text-right text-xs"><thead className="bg-slate-950 text-[10px] font-black text-amber-200"><tr><th className="p-3">الوحدة / الشاشة</th><th className="p-3">الوظيفة / الزر</th><th className="p-3">مفتاح الصلاحية</th><th className="p-3 text-center">من الدور</th><th className="p-3 text-center">تفويض مباشر</th><th className="p-3 text-center">الصلاحية الفعالة</th></tr></thead><tbody className="divide-y divide-slate-100">{visiblePermissionCatalog.map((permission) => { const centrallyDenied = centrallyDeniedPermissionKeys.has(permission.permissionKey); const inherited = inheritedPermissionKeys.has(permission.permissionKey); const direct = (permissionDrafts[permissionEditing.id] || []).includes(permission.permissionKey); const effective = effectivePermissionKeys.has(permission.permissionKey); return <tr key={permission.permissionKey} className={centrallyDenied ? 'bg-rose-50/60' : effective ? 'bg-amber-50/50' : 'bg-white'}><td className="p-3 font-black text-slate-800">{permission.resource}</td><td className="p-3 font-bold text-slate-700">{permissionLabel(permission).split(' — ').slice(1).join(' — ') || permission.action}</td><td className="p-3 font-mono text-[10px] text-slate-500">{permission.permissionKey}</td><td className="p-3 text-center">{inherited ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700">نعم</span> : <span className="text-slate-300">—</span>}</td><td className="p-3 text-center">{centrallyDenied ? <Lock className="mx-auto h-4 w-4 text-rose-600" aria-label="ممنوعة مركزيًا" /> : <input type="checkbox" aria-label={`تفويض مباشر ${permission.permissionKey}`} checked={direct} disabled={inherited || !canAssign} onChange={() => togglePermission(permission.permissionKey)} className="h-5 w-5 accent-amber-600 disabled:cursor-not-allowed disabled:opacity-50" />}</td><td className="p-3 text-center"><input type="checkbox" aria-label={`الصلاحية الفعالة ${permission.permissionKey}`} checked={effective} disabled aria-readonly="true" className="h-5 w-5 accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-100" /></td></tr>; })}</tbody></table>{visiblePermissionCatalog.length === 0 && <div className="p-12 text-center text-sm font-bold text-slate-500">لا توجد صلاحيات مطابقة للبحث.</div>}</div></div><div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPermissionEditing(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-black">إلغاء</button><button type="button" disabled={saving} onClick={() => void savePermissions()} className="rounded-xl bg-amber-600 px-6 py-2.5 text-xs font-black text-white shadow-lg hover:bg-amber-500 disabled:opacity-50">{saving ? 'جارٍ تطبيق الصلاحيات...' : 'حفظ الصلاحيات وتسجيلها'}</button></div></div></div>}
    </section>
  );
}
