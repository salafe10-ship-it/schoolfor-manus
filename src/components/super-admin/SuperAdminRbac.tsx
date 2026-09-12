import {
  AlertTriangle,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  Filter,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Undo2,
  UserRound,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  derivePermissionOverrides,
  hasPermissionMatrixChanges,
  resolveEffectivePermissions,
  type PermissionOverride,
} from '../../authorization/PermissionMatrixPolicy';
import { authenticatedRequest } from '../../utils/authenticatedRequest';
import { comparePermissionResources, permissionActionLabel, permissionModuleLabel } from '../identity/permissionPresentation';

interface SuperAdminRbacProps {
  schools: any[];
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

type PermissionCatalogEntry = {
  permissionKey: string;
  resource: string;
  action: string;
  description?: string;
};

type CentralRole = {
  id: string;
  role_key?: string;
  roleKey?: string;
  name: string;
  description?: string;
  version: number;
  permissions?: PermissionCatalogEntry[];
};

type CentralUser = {
  id: string;
  tenant_id: string;
  school_id?: string | null;
  branch_id?: string | null;
  display_name: string;
  job_title?: string;
  department?: string;
  school_name?: string;
  branch_name?: string;
  status: string;
  version: number;
  roles?: Array<{ roleKey: string; name: string }>;
  directPermissions?: Array<PermissionCatalogEntry & { effect?: 'allow' | 'deny'; branchId?: string | null }>;
};

type PermissionModule = {
  resource: string;
  label: string;
  permissions: Array<PermissionCatalogEntry & { label: string }>;
};

const roleKeyOf = (role: CentralRole | undefined): string => String(role?.role_key || role?.roleKey || '').trim();
const userRoleKey = (user: CentralUser): string => String(user.roles?.[0]?.roleKey || '').trim();
const sortedKeys = (values: readonly string[] | undefined): string[] => [...new Set(values || [])].sort();
const overrideSignature = (overrides: readonly PermissionOverride[] | undefined): string => (overrides || [])
  .map((entry) => `${entry.permissionKey}:${entry.effect}`)
  .sort()
  .join('|');

const SEPARATION_OF_DUTIES_RULES = [
  { keys: ['Financial.Write', 'Financial.Approve'], label: 'إدخال واعتماد العمليات المالية' },
  { keys: ['Invoice.Write', 'Invoice.Approve'], label: 'إعداد واعتماد الفواتير' },
  { keys: ['Ledger.Write', 'Ledger.Approve'], label: 'إعداد واعتماد قيود دفتر الأستاذ' },
] as const;

const separationOfDutiesConflict = (permissionKeys: readonly string[]) => {
  const keys = new Set(permissionKeys);
  return SEPARATION_OF_DUTIES_RULES.find((rule) => rule.keys.every((key) => keys.has(key))) || null;
};

export default function SuperAdminRbac({ schools = [], logAction, triggerNotification }: SuperAdminRbacProps) {
  const [roles, setRoles] = useState<CentralRole[]>([]);
  const [employees, setEmployees] = useState<CentralUser[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalogEntry[]>([]);
  const [savedEmployeePermissions, setSavedEmployeePermissions] = useState<Record<string, string[]>>({});
  const [employeePermissionDrafts, setEmployeePermissionDrafts] = useState<Record<string, string[]>>({});
  const [savedEmployeeOverrides, setSavedEmployeeOverrides] = useState<Record<string, PermissionOverride[]>>({});
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [permissionQuery, setPermissionQuery] = useState('');
  const [directoryQuery, setDirectoryQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEmployeeId, setSavingEmployeeId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [canonicalTemplate, setCanonicalTemplate] = useState<any | null>(null);
  const [lastPropagation, setLastPropagation] = useState<any | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [newRole, setNewRole] = useState({ roleKey: '', name: '', description: '', permissionKeys: [] as string[] });
  const [copyState, setCopyState] = useState({ srcRoleId: '', destRoleId: '' });

  const permissionModules = useMemo<PermissionModule[]>(() => {
    const normalizedQuery = permissionQuery.trim().toLowerCase();
    const grouped = new Map<string, PermissionCatalogEntry[]>();
    for (const permission of permissionCatalog) {
      const resourceLabel = permissionModuleLabel(permission.resource);
      const actionLabel = permissionActionLabel(permission.action);
      if (normalizedQuery && !`${permission.permissionKey} ${permission.resource} ${resourceLabel} ${actionLabel}`.toLowerCase().includes(normalizedQuery)) continue;
      const current = grouped.get(permission.resource) || [];
      current.push(permission);
      grouped.set(permission.resource, current);
    }
    return [...grouped.entries()]
      .map(([resource, permissions]) => ({
        resource,
        label: permissionModuleLabel(resource),
        permissions: permissions
          .slice()
          .sort((left, right) => left.permissionKey.localeCompare(right.permissionKey))
          .map((permission) => ({ ...permission, label: permissionActionLabel(permission.action) })),
      }))
      .sort((left, right) => comparePermissionResources(left.resource, right.resource));
  }, [permissionCatalog, permissionQuery]);

  useEffect(() => {
    if (!permissionModules.length) {
      setSelectedResource('');
      return;
    }
    if (!permissionModules.some((module) => module.resource === selectedResource)) setSelectedResource(permissionModules[0].resource);
  }, [permissionModules, selectedResource]);

  const loadRbac = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rbacResponse, templatesResponse, usersResponse] = await Promise.all([
        authenticatedRequest('/api/admin/central/rbac', { cache: 'no-store' }),
        authenticatedRequest('/api/admin/central/templates', { cache: 'no-store' }),
        authenticatedRequest('/api/admin/central/users', { cache: 'no-store' }),
      ]);
      const [rbacPayload, templatesPayload, usersPayload] = await Promise.all([
        rbacResponse.json().catch(() => ({})),
        templatesResponse.json().catch(() => ({})),
        usersResponse.json().catch(() => ({})),
      ]);
      if (!rbacResponse.ok || !rbacPayload?.success || !Array.isArray(rbacPayload.roles)) throw new Error(rbacPayload?.message || 'تعذر تحميل وظائف وصلاحيات المدرسة الأم.');
      if (!templatesResponse.ok || !templatesPayload?.success || !Array.isArray(templatesPayload.templates)) throw new Error(templatesPayload?.message || 'تعذر تحميل قالب المدرسة الأم.');
      if (!usersResponse.ok || !usersPayload?.success || !Array.isArray(usersPayload.users)) throw new Error(usersPayload?.message || 'تعذر تحميل الموظفين التابعين للمدارس.');

      const nextRoles: CentralRole[] = rbacPayload.roles;
      const nextRolePermissions = Object.fromEntries(nextRoles.map((role) => [role.id, sortedKeys((role.permissions || []).map((permission) => permission.permissionKey))]));
      const nextEmployees: CentralUser[] = usersPayload.users.filter((user: CentralUser) => Boolean(user.school_id) && userRoleKey(user) !== 'platformadmin');
      const roleByKey = new Map(nextRoles.map((role) => [roleKeyOf(role), role]));
      const nextSavedEffective: Record<string, string[]> = {};
      const nextSavedOverrides: Record<string, PermissionOverride[]> = {};
      for (const employee of nextEmployees) {
        const role = roleByKey.get(userRoleKey(employee));
        const baseline = role ? nextRolePermissions[role.id] || [] : [];
        const overrides = (employee.directPermissions || []).map((permission) => ({
          permissionKey: permission.permissionKey,
          effect: permission.effect === 'deny' ? 'deny' as const : 'allow' as const,
        }));
        nextSavedOverrides[employee.id] = overrides;
        nextSavedEffective[employee.id] = resolveEffectivePermissions(baseline, overrides);
      }

      setRoles(nextRoles);
      setEmployees(nextEmployees);
      setPermissionCatalog(Array.isArray(rbacPayload.permissionCatalog) ? rbacPayload.permissionCatalog : []);
      setRolePermissions(nextRolePermissions);
      setSavedEmployeePermissions(nextSavedEffective);
      setEmployeePermissionDrafts(nextSavedEffective);
      setSavedEmployeeOverrides(nextSavedOverrides);
      setExpandedRoles((current) => Object.keys(current).length ? current : Object.fromEntries(nextRoles.map((role) => [role.id, true])));
      setSelectedRoleId((current) => nextRoles.some((role) => role.id === current) ? current : (nextRoles[0]?.id || ''));
      setCanonicalTemplate(templatesPayload.templates.find((template: any) => template.template_key === 'central-schools-default') || null);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تحميل مصفوفة المستخدمين والصلاحيات.', 'danger');
    } finally {
      setIsLoading(false);
    }
  }, [triggerNotification]);

  useEffect(() => { void loadRbac(); }, [loadRbac]);

  const roleHasChanges = (role: CentralRole): boolean => {
    const saved = sortedKeys((role.permissions || []).map((permission) => permission.permissionKey));
    return sortedKeys(rolePermissions[role.id]).join('|') !== saved.join('|');
  };

  const handleTogglePermission = (roleId: string, permissionKey: string) => {
    setSelectedRoleId(roleId);
    setRolePermissions((current) => {
      const next = new Set(current[roleId] || []);
      if (next.has(permissionKey)) next.delete(permissionKey); else next.add(permissionKey);
      return { ...current, [roleId]: [...next].sort() };
    });
  };

  const setModulePermissions = (roleId: string, resource: string, grant: boolean) => {
    const moduleKeys = permissionCatalog.filter((permission) => permission.resource === resource).map((permission) => permission.permissionKey);
    setSelectedRoleId(roleId);
    setRolePermissions((current) => {
      const next = new Set(current[roleId] || []);
      for (const key of moduleKeys) grant ? next.add(key) : next.delete(key);
      return { ...current, [roleId]: [...next].sort() };
    });
  };

  const saveRolePermissions = async (roleId: string) => {
    const role = roles.find((entry) => entry.id === roleId);
    if (!role || !roleHasChanges(role)) return;
    const conflict = separationOfDutiesConflict(rolePermissions[roleId] || []);
    if (conflict) {
      triggerNotification(`تم منع الحفظ: لا يجوز الجمع بين ${conflict.label} في الوظيفة نفسها.`, 'warning');
      return;
    }
    setSelectedRoleId(roleId);
    setIsSaving(true);
    try {
      const response = await authenticatedRequest(`/api/admin/central/rbac/roles/${encodeURIComponent(role.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionKeys: rolePermissions[role.id] || [],
          expectedVersion: role.version,
          name: role.name,
          description: role.description,
          reason: 'اعتماد صلاحيات الوظيفة من المصفوفة المبسطة للمدرسة الأم',
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر حفظ صلاحيات الوظيفة.');
      setLastPropagation(payload.propagation || null);
      triggerNotification(`تم اعتماد صلاحيات دور الوظيفة «${role.name}» وتوزيعها على ${payload.propagation?.targetCount || 0} مدرسة ✅`, 'success');
      logAction('UPDATE_RBAC', `اعتماد صلاحيات الوظيفة [${role.name}]`, 'المستخدمين والصلاحيات');
      await loadRbac();
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر حفظ الصلاحيات؛ لم يتم تعديل المدارس.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEmployeePermission = (employee: CentralUser, role: CentralRole, permissionKey: string) => {
    if (roleHasChanges(role)) {
      triggerNotification('احفظ تعديلات الوظيفة أولاً، ثم أضف استثناء الموظف حتى يكون القرار واضحًا.', 'warning');
      return;
    }
    setEmployeePermissionDrafts((current) => {
      const next = new Set(current[employee.id] || savedEmployeePermissions[employee.id] || []);
      if (next.has(permissionKey)) next.delete(permissionKey); else next.add(permissionKey);
      return { ...current, [employee.id]: [...next].sort() };
    });
  };

  const restoreEmployeeToRole = (employee: CentralUser, role: CentralRole) => {
    setEmployeePermissionDrafts((current) => ({ ...current, [employee.id]: sortedKeys(rolePermissions[role.id]) }));
  };

  const saveEmployeePermissions = async (employee: CentralUser, role: CentralRole) => {
    if (roleHasChanges(role)) {
      triggerNotification('احفظ صلاحيات الوظيفة قبل حفظ استثناءات الموظف.', 'warning');
      return;
    }
    const baseline = rolePermissions[role.id] || [];
    const desired = employeePermissionDrafts[employee.id] || [];
    const overrides = derivePermissionOverrides(baseline, desired);
    setSavingEmployeeId(employee.id);
    try {
      const response = await authenticatedRequest(`/api/admin/central/users/${encodeURIComponent(employee.id)}/permission-overrides`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedVersion: employee.version, overrides }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر حفظ استثناءات الموظف.');
      triggerNotification(overrides.length ? `تم حفظ ${overrides.length} استثناء للموظف ${employee.display_name} وتسجيلها ✅` : `عاد ${employee.display_name} إلى صلاحيات الوظيفة دون استثناءات ✅`, 'success');
      logAction('UPDATE_USER_PERMISSION_OVERRIDES', `ضبط استثناءات الموظف [${employee.display_name}]`, 'المستخدمين والصلاحيات');
      await loadRbac();
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر حفظ استثناءات الموظف.', 'danger');
    } finally {
      setSavingEmployeeId('');
    }
  };

  const toggleNewRolePermission = (permissionKey: string) => {
    setNewRole((current) => ({
      ...current,
      permissionKeys: current.permissionKeys.includes(permissionKey)
        ? current.permissionKeys.filter((key) => key !== permissionKey)
        : [...current.permissionKeys, permissionKey].sort(),
    }));
  };

  const handleCreateRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newRole.name.trim() || !/^[a-z0-9](?:[a-z0-9._-]{1,62})$/.test(newRole.roleKey.trim().toLowerCase())) {
      triggerNotification('أدخل اسم الوظيفة ومفتاحًا إنجليزيًا صالحًا مثل student_affairs.', 'warning');
      return;
    }
    if (!newRole.permissionKeys.length) {
      triggerNotification('اختر صلاحية واحدة على الأقل للوظيفة الجديدة.', 'warning');
      return;
    }
    const conflict = separationOfDutiesConflict(newRole.permissionKeys);
    if (conflict) {
      triggerNotification(`تم منع الإنشاء: لا يجوز الجمع بين ${conflict.label} في الوظيفة نفسها.`, 'warning');
      return;
    }
    setIsSaving(true);
    try {
      const response = await authenticatedRequest('/api/admin/central/rbac/roles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRole, roleKey: newRole.roleKey.trim().toLowerCase() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر إنشاء وظيفة الصلاحيات.');
      triggerNotification(`تم إنشاء الوظيفة «${payload.role?.name || newRole.name}» ونشرها للمدارس ✅`, 'success');
      logAction('CREATE_RBAC_ROLE', `إنشاء وظيفة صلاحيات [${payload.role?.name || newRole.name}]`, 'المستخدمين والصلاحيات');
      setShowCreateRole(false);
      setNewRole({ roleKey: '', name: '', description: '', permissionKeys: [] });
      setLastPropagation(payload.propagation || null);
      await loadRbac();
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر إنشاء الوظيفة.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPermissions = (event: React.FormEvent) => {
    event.preventDefault();
    if (!copyState.srcRoleId || !copyState.destRoleId || copyState.srcRoleId === copyState.destRoleId) {
      triggerNotification('اختر وظيفتين مختلفتين للمصدر والهدف.', 'warning');
      return;
    }
    setRolePermissions((current) => ({ ...current, [copyState.destRoleId]: [...(current[copyState.srcRoleId] || [])] }));
    setSelectedRoleId(copyState.destRoleId);
    setExpandedRoles((current) => ({ ...current, [copyState.destRoleId]: true }));
    setShowCopyModal(false);
    setCopyState({ srcRoleId: '', destRoleId: '' });
    triggerNotification('تم النسخ كمسودة فقط. راجع الوظيفة الهدف ثم اضغط حفظ ونشر.', 'warning');
  };

  const handlePublishMotherSchoolRbac = async () => {
    if (!canonicalTemplate?.id) {
      triggerNotification('لا يوجد قالب منشور للمدرسة الأم.', 'warning');
      return;
    }
    if (roles.some(roleHasChanges)) {
      triggerNotification('توجد تعديلات وظائف غير محفوظة. احفظها أولاً قبل إعادة النشر.', 'warning');
      return;
    }
    if (!window.confirm('سيتم اعتماد نسخة جديدة من صلاحيات المدرسة الأم وتوزيعها على جميع المدارس المرتبطة. هل تريد المتابعة؟')) return;
    setIsPublishing(true);
    try {
      const response = await authenticatedRequest(`/api/admin/central/templates/${encodeURIComponent(canonicalTemplate.id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation: 'capture' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر نشر قالب المدرسة الأم.');
      setCanonicalTemplate(payload.template || canonicalTemplate);
      setLastPropagation(payload.propagation || null);
      triggerNotification(`تم نشر الصلاحيات على ${payload.propagation?.targetCount || 0} مدرسة مرتبطة ✅`, 'success');
      logAction('PUBLISH_MOTHER_RBAC', `اعتماد ونشر قالب المدرسة الأم — الإصدار ${payload.template?.version || canonicalTemplate.version}`, 'المستخدمين والصلاحيات');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر نشر القالب.', 'danger');
    } finally {
      setIsPublishing(false);
    }
  };

  const activeModule = permissionModules.find((module) => module.resource === selectedResource) || null;
  const openSchools = schools.filter((school: any) => ['active', 'provisioning'].includes(String(school?.status || 'active')));
  const openSchoolIds = new Set(openSchools.map((school: any) => String(school.id || '')).filter(Boolean));
  const openEmployees = openSchoolIds.size ? employees.filter((employee) => employee.school_id && openSchoolIds.has(employee.school_id)) : employees;
  const linkedSchools = lastPropagation?.targetCount ?? openSchools.length;

  const roleGroups = useMemo(() => {
    const normalizedQuery = directoryQuery.trim().toLowerCase();
    return roles.map((role) => {
      const roleKey = roleKeyOf(role);
      const roleMatches = !normalizedQuery || `${role.name} ${role.description || ''} ${roleKey}`.toLowerCase().includes(normalizedQuery);
      const members = openEmployees.filter((employee) => {
        if (userRoleKey(employee) !== roleKey) return false;
        if (schoolFilter !== 'all' && employee.school_id !== schoolFilter) return false;
        if (roleMatches) return true;
        return `${employee.display_name} ${employee.job_title || ''} ${employee.department || ''} ${employee.school_name || ''}`.toLowerCase().includes(normalizedQuery);
      });
      return { role, members, visible: roleMatches || members.length > 0 };
    }).filter((group) => group.visible);
  }, [directoryQuery, openEmployees, roles, schoolFilter]);

  const totalDirtyRoles = roles.filter(roleHasChanges).length;
  const totalDirtyEmployees = openEmployees.filter((employee) => hasPermissionMatrixChanges(savedEmployeePermissions[employee.id], employeePermissionDrafts[employee.id])).length;

  return (
    <div className="space-y-5 text-right" dir="rtl">
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-l from-slate-950 via-slate-900 to-amber-950/40 p-6 text-white shadow-2xl">
        <div className="absolute -left-16 -top-20 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex items-center gap-2 text-amber-300"><ShieldCheck className="h-5 w-5" /><span className="text-[11px] font-black tracking-widest">المدرسة الأم • المصدر الوحيد للصلاحيات</span></div>
            <h1 className="text-2xl font-black">جدول الوظائف والموظفين والصلاحيات</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">اختر وحدة من البرنامج، ثم ضع علامة أمام الوظيفة. الموظفون تحتها يرثون القرار تلقائيًا، وأي اختلاف للموظف يظهر كاستثناء واضح قبل الحفظ.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void loadRbac()} disabled={isLoading} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-black hover:bg-white/15 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />تحديث</button>
            <button type="button" onClick={() => void handlePublishMotherSchoolRbac()} disabled={isPublishing || !canonicalTemplate?.id || totalDirtyRoles > 0} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black shadow-lg hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">{isPublishing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{isPublishing ? 'جارٍ التوزيع...' : 'توزيع على المدارس'}</button>
          </div>
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-2xl font-black">{roles.length}</div><div className="mt-1 text-[10px] font-bold text-slate-400">وظائف صلاحيات</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-2xl font-black text-sky-300">{openEmployees.length}</div><div className="mt-1 text-[10px] font-bold text-slate-400">موظفو المدارس المفتوحة</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-2xl font-black text-amber-300">{permissionCatalog.length}</div><div className="mt-1 text-[10px] font-bold text-slate-400">صلاحيات البرنامج</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-2xl font-black text-emerald-300">{linkedSchools}</div><div className="mt-1 text-[10px] font-bold text-slate-400">مدارس تستقبل القالب</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-2xl font-black text-violet-300">{canonicalTemplate?.version || '—'}</div><div className="mt-1 text-[10px] font-bold text-slate-400">إصدار المدرسة الأم</div></div>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-4">
        {[
          ['١', 'اختر وحدة البرنامج', 'مثل الطلاب أو الحسابات'],
          ['٢', 'حدد صلاحية الوظيفة', 'علامة واحدة لكل الموظفين'],
          ['٣', 'راجع استثناء الموظف', 'السماح والمنع يظهران بلون واضح'],
          ['٤', 'احفظ وانشر', 'توثيق ثم توزيع للمدارس'],
        ].map(([number, title, detail]) => <div key={number} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">{number}</span><span><span className="block text-xs font-black text-slate-800">{title}</span><span className="mt-0.5 block text-[10px] text-slate-500">{detail}</span></span></div>)}
      </section>

      {(totalDirtyRoles > 0 || totalDirtyEmployees > 0) && <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900"><AlertTriangle className="h-5 w-5 shrink-0" />لديك {totalDirtyRoles} تعديل وظيفة و{totalDirtyEmployees} تعديل موظف غير محفوظ. احفظ كل صف يحمل علامة «غير محفوظ».</div>}
      {lastPropagation && <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800"><Check className="h-4 w-4" />آخر توزيع ناجح: {lastPropagation.targetCount || 0} مدرسة، مع إصدار مستقل وآمن لكل مدرسة.</div>}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div><h2 className="flex items-center gap-2 text-sm font-black text-slate-900"><SlidersHorizontal className="h-4 w-4 text-amber-600" />اختر وحدة البرنامج</h2><p className="mt-1 text-[11px] text-slate-500">جميع وحدات البرنامج موجودة هنا، واعرض وحدة واحدة فقط لتبقى الشاشة بسيطة.</p></div>
            <div className="relative w-full xl:w-80"><Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" /><input value={permissionQuery} onChange={(event) => setPermissionQuery(event.target.value)} placeholder="بحث عن وحدة أو صلاحية..." className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-xs outline-none focus:border-amber-400" /></div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {permissionModules.map((module) => <button key={module.resource} type="button" onClick={() => setSelectedResource(module.resource)} className={`shrink-0 rounded-xl border px-3 py-2 text-[11px] font-black transition ${selectedResource === module.resource ? 'border-amber-500 bg-amber-500 text-white shadow' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'}`}>{module.label}<span className={`mr-1.5 rounded-full px-1.5 py-0.5 text-[9px] ${selectedResource === module.resource ? 'bg-white/20' : 'bg-slate-100'}`}>{module.permissions.length}</span></button>)}
            {!permissionModules.length && <span className="px-3 py-2 text-xs font-bold text-slate-500">لا توجد صلاحيات مطابقة للبحث.</span>}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">{activeModule?.label || 'جدول الصلاحيات'}</h3>
            <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-slate-600"><span className="h-3 w-3 rounded border border-slate-300 bg-white" />موروثة من الوظيفة</span>
              <span className="flex items-center gap-1 text-emerald-700"><span className="h-3 w-3 rounded border border-emerald-500 bg-emerald-100" />سماح خاص للموظف</span>
              <span className="flex items-center gap-1 text-rose-700"><span className="h-3 w-3 rounded border border-rose-500 bg-rose-100" />منع خاص للموظف</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative"><Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" /><input value={directoryQuery} onChange={(event) => setDirectoryQuery(event.target.value)} placeholder="بحث بالوظيفة أو الموظف..." className="w-full rounded-xl border border-slate-200 py-2 pl-3 pr-9 text-xs outline-none focus:border-amber-400 sm:w-64" /></div>
            <label className="relative"><Filter className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" /><select aria-label="تصفية الموظفين حسب المدرسة" value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-xs font-bold sm:w-56"><option value="all">كل المدارس المفتوحة</option>{openSchools.map((school: any) => <option key={school.id} value={school.id}>{school.name || school.display_name}</option>)}</select></label>
          </div>
        </div>

        {isLoading ? <div className="flex items-center justify-center gap-3 p-16 text-sm font-bold text-slate-500"><RefreshCw className="h-5 w-5 animate-spin text-amber-500" />جارٍ تحميل جدول الصلاحيات...</div> : activeModule ? (
          <div className="max-h-[68vh] overflow-auto">
            <table className="w-full min-w-[880px] border-separate border-spacing-0 text-right">
              <thead className="sticky top-0 z-20 bg-slate-900 text-white shadow">
                <tr>
                  <th className="sticky right-0 z-30 min-w-[310px] border-l border-slate-700 bg-slate-900 p-3 text-xs font-black">الوظيفة وتحتها الموظفون <span className="mt-1 block text-[9px] font-normal text-slate-400">الاسم والمسمى الوظيفي والمدرسة</span></th>
                  {activeModule.permissions.map((permission) => <th key={permission.permissionKey} className="min-w-[112px] border-l border-slate-700 p-3 text-center"><span className="block text-[11px] font-black">{permission.label}</span><span className="mt-1 block font-mono text-[8px] font-normal text-slate-400">{permission.permissionKey}</span></th>)}
                  <th className="sticky left-0 z-30 min-w-[150px] bg-slate-900 p-3 text-center text-xs font-black">الحفظ</th>
                </tr>
              </thead>
              {roleGroups.map(({ role, members }) => {
                const expanded = expandedRoles[role.id] !== false;
                const roleDraft = new Set(rolePermissions[role.id] || []);
                const dirtyRole = roleHasChanges(role);
                const roleConflict = separationOfDutiesConflict(rolePermissions[role.id] || []);
                return <tbody key={role.id} className="border-b border-slate-200">
                  <tr className="bg-amber-50/80">
                    <th className="sticky right-0 z-10 border-b border-l border-amber-200 bg-amber-50 p-3">
                      <button type="button" onClick={() => setExpandedRoles((current) => ({ ...current, [role.id]: !expanded }))} className="flex w-full items-center gap-3 text-right">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</span>
                        <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-black text-slate-900"><BriefcaseBusiness className="h-4 w-4 text-amber-700" />{role.name}{dirtyRole && <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[9px] text-amber-900">غير محفوظ</span>}{roleConflict && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] text-rose-800">تعارض فصل واجبات</span>}</span><span className={`mt-1 block text-[10px] font-bold ${roleConflict ? 'text-rose-700' : 'text-slate-500'}`}>{roleConflict ? `يجب فصل ${roleConflict.label} قبل النشر` : `${members.length} موظف • صلاحيات الوظيفة تطبق على الجميع`}</span></span>
                      </button>
                    </th>
                    {activeModule.permissions.map((permission) => {
                      const checked = roleDraft.has(permission.permissionKey);
                      return <td key={permission.permissionKey} className={`border-b border-l border-amber-200 p-3 text-center ${checked ? 'bg-amber-100/80' : ''}`}><label className="inline-flex cursor-pointer flex-col items-center gap-1"><input type="checkbox" checked={checked} onChange={() => handleTogglePermission(role.id, permission.permissionKey)} className="h-5 w-5 rounded border-slate-300 accent-amber-600" /><span className={`text-[9px] font-black ${checked ? 'text-amber-800' : 'text-slate-400'}`}>{checked ? 'مسموح' : 'ممنوع'}</span></label></td>;
                    })}
                    <td className="sticky left-0 z-10 border-b border-amber-200 bg-amber-50 p-3 text-center"><div className="flex flex-col gap-1.5"><button type="button" onClick={() => void saveRolePermissions(role.id)} disabled={isSaving || !dirtyRole || Boolean(roleConflict)} className="flex items-center justify-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-[10px] font-black text-white shadow disabled:cursor-not-allowed disabled:bg-slate-300"><Save className="h-3.5 w-3.5" />{roleConflict ? 'أزل التعارض' : isSaving && selectedRoleId === role.id ? 'جارٍ النشر...' : 'حفظ ونشر'}</button><div className="flex gap-1"><button type="button" onClick={() => setModulePermissions(role.id, activeModule.resource, true)} className="flex-1 rounded-md border border-emerald-200 bg-white px-1 py-1 text-[8px] font-black text-emerald-700">السماح بالكل</button><button type="button" onClick={() => setModulePermissions(role.id, activeModule.resource, false)} className="flex-1 rounded-md border border-rose-200 bg-white px-1 py-1 text-[8px] font-black text-rose-700">منع الكل</button></div></div></td>
                  </tr>
                  {expanded && members.map((employee) => {
                    const effectiveDraft = new Set(employeePermissionDrafts[employee.id] || []);
                    const dirtyEmployee = hasPermissionMatrixChanges(savedEmployeePermissions[employee.id], employeePermissionDrafts[employee.id]);
                    const currentOverrides = derivePermissionOverrides(rolePermissions[role.id] || [], employeePermissionDrafts[employee.id] || []);
                    const savedOverrides = savedEmployeeOverrides[employee.id] || [];
                    const hasSavedOverrides = savedOverrides.length > 0;
                    return <tr key={employee.id} className="bg-white hover:bg-slate-50/70">
                      <td className="sticky right-0 z-10 border-b border-l border-slate-200 bg-inherit p-3 pr-10"><div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"><UserRound className="h-4 w-4" /></span><span className="min-w-0"><span className="flex items-center gap-2 text-xs font-black text-slate-800">{employee.display_name}{dirtyEmployee && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] text-amber-800">غير محفوظ</span>}</span><span className="mt-1 block truncate text-[9px] font-bold text-slate-500">{employee.job_title || role.name} • {employee.school_name || 'مدرسة غير مسماة'}{employee.branch_name ? ` • ${employee.branch_name}` : ''}</span></span></div></td>
                      {activeModule.permissions.map((permission) => {
                        const roleAllows = roleDraft.has(permission.permissionKey);
                        const employeeAllows = effectiveDraft.has(permission.permissionKey);
                        const exception = roleAllows === employeeAllows ? 'inherited' : employeeAllows ? 'allow' : 'deny';
                        return <td key={permission.permissionKey} className={`border-b border-l p-3 text-center ${exception === 'allow' ? 'border-emerald-200 bg-emerald-50' : exception === 'deny' ? 'border-rose-200 bg-rose-50' : 'border-slate-200'}`}><label className={`inline-flex flex-col items-center gap-1 ${dirtyRole ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`} title={exception === 'allow' ? 'سماح خاص لهذا الموظف' : exception === 'deny' ? 'منع خاص لهذا الموظف' : 'موروثة من الوظيفة'}><input type="checkbox" checked={employeeAllows} disabled={dirtyRole || savingEmployeeId === employee.id} onChange={() => toggleEmployeePermission(employee, role, permission.permissionKey)} className={`h-5 w-5 rounded accent-amber-600 ${exception === 'allow' ? 'ring-2 ring-emerald-400' : exception === 'deny' ? 'ring-2 ring-rose-400' : ''}`} /><span className={`text-[8px] font-black ${exception === 'allow' ? 'text-emerald-700' : exception === 'deny' ? 'text-rose-700' : 'text-slate-400'}`}>{exception === 'allow' ? 'سماح خاص' : exception === 'deny' ? 'منع خاص' : 'من الوظيفة'}</span></label></td>;
                      })}
                      <td className="sticky left-0 z-10 border-b border-slate-200 bg-inherit p-3 text-center"><div className="flex flex-col gap-1.5"><button type="button" onClick={() => void saveEmployeePermissions(employee, role)} disabled={dirtyRole || savingEmployeeId === employee.id || (!dirtyEmployee && overrideSignature(currentOverrides) === overrideSignature(savedOverrides))} className="flex items-center justify-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-[9px] font-black text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"><Save className="h-3 w-3" />{savingEmployeeId === employee.id ? 'جارٍ الحفظ...' : 'حفظ الموظف'}</button><button type="button" onClick={() => restoreEmployeeToRole(employee, role)} disabled={dirtyRole || (!hasSavedOverrides && !dirtyEmployee)} className="flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[8px] font-black text-slate-600 disabled:opacity-40"><Undo2 className="h-3 w-3" />إلغاء الاستثناء</button></div></td>
                    </tr>;
                  })}
                  {expanded && members.length === 0 && <tr><td colSpan={activeModule.permissions.length + 2} className="border-b border-slate-200 bg-slate-50/50 p-4 pr-12 text-xs font-bold text-slate-400">لا يوجد موظفون مربوطون بهذه الوظيفة في التصفية الحالية.</td></tr>}
                </tbody>;
              })}
            </table>
            {!roleGroups.length && <div className="p-14 text-center text-sm font-bold text-slate-500">لا توجد وظائف أو موظفون مطابقون للبحث والتصفية.</div>}
          </div>
        ) : <div className="p-14 text-center text-sm font-bold text-slate-500">اختر وحدة من البرنامج لعرض جدولها.</div>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button type="button" onClick={() => setShowAdvancedTools((current) => !current)} className="flex w-full items-center justify-between p-4 text-right"><span><span className="flex items-center gap-2 text-sm font-black text-slate-800"><SlidersHorizontal className="h-4 w-4" />أدوات إعداد الوظائف</span><span className="mt-1 block text-[10px] text-slate-500">إضافة وظيفة أو نسخ صلاحيات وظيفة أخرى — تستخدم عند الحاجة فقط.</span></span><ChevronDown className={`h-5 w-5 text-slate-400 transition ${showAdvancedTools ? 'rotate-180' : ''}`} /></button>
        {showAdvancedTools && <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4"><button type="button" onClick={() => setShowCreateRole(true)} className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white"><Plus className="h-4 w-4" />إضافة وظيفة صلاحيات</button><button type="button" onClick={() => setShowCopyModal(true)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700"><Copy className="h-4 w-4" />نسخ من وظيفة أخرى</button></div>}
      </section>

      {showCreateRole && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"><form onSubmit={handleCreateRole} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between bg-slate-900 p-5 text-white"><div><h3 className="text-lg font-black">إضافة وظيفة صلاحيات</h3><p className="mt-1 text-xs text-slate-300">أنشئ الوظيفة مرة واحدة في المدرسة الأم، ثم تُنشر للمدارس التابعة.</p></div><button type="button" aria-label="إغلاق" onClick={() => setShowCreateRole(false)} className="rounded-lg bg-white/10 p-2"><X className="h-4 w-4" /></button></div><div className="grid gap-4 overflow-y-auto p-5 lg:grid-cols-[300px_1fr]"><div className="space-y-3"><label className="block text-xs font-black text-slate-700">اسم الوظيفة بالعربية<input required minLength={2} maxLength={160} value={newRole.name} onChange={(event) => setNewRole((current) => ({ ...current, name: event.target.value }))} placeholder="مسؤول شؤون الطلاب" className="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label><label className="block text-xs font-black text-slate-700">رمز الوظيفة<input required pattern="[a-z0-9](?:[a-z0-9._-]{1,62})" value={newRole.roleKey} onChange={(event) => setNewRole((current) => ({ ...current, roleKey: event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') }))} placeholder="student_affairs" className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-mono" /></label><label className="block text-xs font-black text-slate-700">وصف مختصر<textarea maxLength={500} value={newRole.description} onChange={(event) => setNewRole((current) => ({ ...current, description: event.target.value }))} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3" /></label></div><div><div className="mb-3 flex items-center justify-between"><div><h4 className="text-sm font-black">صلاحيات البداية</h4><p className="text-[10px] text-slate-500">يمكن تعديلها لاحقًا من الجدول.</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{newRole.permissionKeys.length} محددة</span></div><div className="grid max-h-[50vh] gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">{permissionCatalog.map((permission) => { const selected = newRole.permissionKeys.includes(permission.permissionKey); return <button type="button" key={permission.permissionKey} onClick={() => toggleNewRolePermission(permission.permissionKey)} className={`flex items-center gap-2 rounded-xl border p-3 text-right ${selected ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300 text-transparent'}`}><Check className="h-3 w-3" /></span><span><span className="block text-xs font-black">{permissionModuleLabel(permission.resource)} — {permissionActionLabel(permission.action)}</span><span className="font-mono text-[8px] text-slate-400">{permission.permissionKey}</span></span></button>; })}</div></div></div><div className="flex justify-end gap-2 border-t border-slate-100 p-4"><button type="button" onClick={() => setShowCreateRole(false)} className="rounded-xl border px-4 py-2 text-xs font-black">إلغاء</button><button type="submit" disabled={isSaving} className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-black text-white disabled:opacity-50">{isSaving ? 'جارٍ الحفظ والنشر...' : 'حفظ الوظيفة واعتمادها'}</button></div></form></div>}

      {showCopyModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"><div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between bg-slate-900 p-5 text-white"><h3 className="text-sm font-black">نسخ صلاحيات وظيفة</h3><button type="button" onClick={() => setShowCopyModal(false)}><X className="h-4 w-4" /></button></div><form onSubmit={handleCopyPermissions} className="space-y-4 p-5"><label className="block text-xs font-black">الوظيفة المصدر<select value={copyState.srcRoleId} onChange={(event) => setCopyState((current) => ({ ...current, srcRoleId: event.target.value }))} className="mt-1 w-full rounded-xl border p-3"><option value="">اختر...</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><label className="block text-xs font-black">الوظيفة الهدف<select value={copyState.destRoleId} onChange={(event) => setCopyState((current) => ({ ...current, destRoleId: event.target.value }))} className="mt-1 w-full rounded-xl border p-3"><option value="">اختر...</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><div className="rounded-xl bg-amber-50 p-3 text-[10px] font-bold text-amber-900">النسخ ينشئ مسودة في الجدول، ولن يوزعها حتى تضغط «حفظ ونشر» أمام الوظيفة الهدف.</div><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowCopyModal(false)} className="rounded-xl border px-4 py-2 text-xs font-black">إلغاء</button><button type="submit" className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-black text-white">نسخ كمسودة</button></div></form></div></div>}

    </div>
  );
}
