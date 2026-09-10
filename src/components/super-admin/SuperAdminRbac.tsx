import { Check, Copy, HelpCircle, Lock as LockIcon, Plus, RefreshCw, Save, Search, Send, ShieldCheck, Sliders, Users, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';
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

export default function SuperAdminRbac({
  schools = [],
  logAction,
  triggerNotification
}: SuperAdminRbacProps) {

  // Roles and permissions come from the canonical mother-school RBAC API.
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [canonicalTemplate, setCanonicalTemplate] = useState<any | null>(null);
  const [lastPropagation, setLastPropagation] = useState<any | null>(null);

  // Permissions state per role
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalogEntry[]>([]);
  const [permissionQuery, setPermissionQuery] = useState('');
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRole, setNewRole] = useState({ roleKey: '', name: '', description: '', permissionKeys: [] as string[] });

  const permissionModules = useMemo(() => {
    const normalizedQuery = permissionQuery.trim().toLowerCase();
    const grouped = new Map<string, PermissionCatalogEntry[]>();
    for (const permission of permissionCatalog) {
      if (normalizedQuery && !`${permission.permissionKey} ${permission.resource} ${permission.action} ${permission.description || ''}`.toLowerCase().includes(normalizedQuery)) continue;
      const current = grouped.get(permission.resource) || [];
      current.push(permission);
      grouped.set(permission.resource, current);
    }
    return [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([resource, permissions]) => ({
        id: `resource-${resource}`,
        name: resource,
        permissions: permissions
          .sort((left, right) => left.permissionKey.localeCompare(right.permissionKey))
          .map(permission => ({
            key: permission.permissionKey,
            label: permission.description && permission.description !== permission.permissionKey
              ? permission.description
              : `${permission.resource} — ${permission.action}`,
          })),
      }));
  }, [permissionCatalog, permissionQuery]);

  useEffect(() => {
    let mounted = true;
    const loadRbac = async () => {
      setIsLoading(true);
      try {
        const [response, templatesResponse] = await Promise.all([
          authenticatedRequest('/api/admin/central/rbac'),
          authenticatedRequest('/api/admin/central/templates'),
        ]);
        const payload = await response.json().catch(() => ({}));
        const templatesPayload = await templatesResponse.json().catch(() => ({}));
        if (!response.ok || !payload?.success || !Array.isArray(payload.roles)) throw new Error(payload?.message || 'تعذر تحميل مصفوفة الصلاحيات المركزية.');
        if (!templatesResponse.ok || !templatesPayload?.success || !Array.isArray(templatesPayload.templates)) throw new Error(templatesPayload?.message || 'تعذر تحميل قالب المدرسة الأم.');
        if (!mounted) return;
        setRoles(payload.roles);
        setPermissionCatalog(Array.isArray(payload.permissionCatalog) ? payload.permissionCatalog : []);
        setCanonicalTemplate(templatesPayload.templates.find((template: any) => template.template_key === 'central-schools-default') || null);
        const permissions = Object.fromEntries(payload.roles.map((role: any) => [role.id, (role.permissions || []).map((permission: any) => permission.permissionKey)]));
        setRolePermissions(permissions);
        setSelectedRoleId((current) => payload.roles.some((role: any) => role.id === current) ? current : (payload.roles[0]?.id || ''));
      } catch (error) {
        if (mounted) triggerNotification(error instanceof Error ? error.message : 'تعذر تحميل مصفوفة الصلاحيات المركزية.', 'danger');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void loadRbac();
    return () => { mounted = false; };
  }, []);

  // Copy Permissions Dialog State
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyState, setCopyState] = useState({
    srcRoleId: '',
    destRoleId: ''
  });

  // Toggle single permission key for active role
  const handleTogglePermission = (roleId: string, permKey: string) => {
    const currentList = rolePermissions[roleId] || [];
    const isChecked = currentList.includes(permKey);
    
    let newList;
    if (isChecked) {
      newList = currentList.filter(k => k !== permKey);
    } else {
      newList = [...currentList, permKey];
    }

    setRolePermissions(prev => ({
      ...prev,
      [roleId]: newList
    }));
  };

  const setModulePermissions = (resource: string, grant: boolean) => {
    if (!selectedRoleId) return;
    const moduleKeys = permissionCatalog.filter((permission) => permission.resource === resource).map((permission) => permission.permissionKey);
    setRolePermissions((previous) => {
      const next = new Set(previous[selectedRoleId] || []);
      for (const key of moduleKeys) grant ? next.add(key) : next.delete(key);
      return { ...previous, [selectedRoleId]: [...next].sort() };
    });
  };

  // Saving requires a central RBAC transaction with audit/version checks.
  const handleSaveRbacTemplate = async () => {
    const activeRole = roles.find(r => r.id === selectedRoleId);
    if (!activeRole) return;
    setIsSaving(true);
    try {
      const response = await authenticatedRequest(`/api/admin/central/rbac/roles/${encodeURIComponent(activeRole.id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionKeys: rolePermissions[activeRole.id] || [],
          expectedVersion: activeRole.version,
          name: activeRole.name,
          description: activeRole.description,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر حفظ الصلاحيات المركزية.');
      if (payload.role) {
        setRoles(previous => previous.map(role => role.id === payload.role.id ? payload.role : role));
      }
      if (Array.isArray(payload.permissionKeys)) {
        setRolePermissions(previous => ({ ...previous, [activeRole.id]: payload.permissionKeys }));
      }
      setLastPropagation(payload.propagation || null);
      triggerNotification(`تم اعتماد صلاحيات دور ${activeRole.name} ونشرها تلقائيًا إلى ${payload.propagation?.targetCount || 0} مدرسة مرتبطة ✅`, 'success');
      logAction('UPDATE_RBAC', `اعتماد صلاحيات الدور [${activeRole.name}]`, 'المستخدمين والصلاحيات');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر حفظ الصلاحيات؛ لم يتم تعديل الإنتاج.', 'danger');
    } finally { setIsSaving(false); }
  };

  const toggleNewRolePermission = (permissionKey: string) => {
    setNewRole((current) => ({
      ...current,
      permissionKeys: current.permissionKeys.includes(permissionKey)
        ? current.permissionKeys.filter((key) => key !== permissionKey)
        : [...current.permissionKeys, permissionKey],
    }));
  };

  const handleCreateRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newRole.name.trim() || !/^[a-z0-9](?:[a-z0-9._-]{1,62})$/.test(newRole.roleKey.trim().toLowerCase())) {
      triggerNotification('أدخل اسم الدور ومفتاحاً إنجليزياً صالحاً مثل student_affairs.', 'warning');
      return;
    }
    if (!newRole.permissionKeys.length) {
      triggerNotification('يجب اختيار صلاحية واحدة على الأقل للدور الجديد.', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      const response = await authenticatedRequest('/api/admin/central/rbac/roles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRole, roleKey: newRole.roleKey.trim().toLowerCase() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر إنشاء الدور الجديد.');
      triggerNotification(`تم إنشاء الدور «${payload.role?.name || newRole.name}» ونشره للمدارس المرتبطة ✅`, 'success');
      logAction('CREATE_RBAC_ROLE', `إنشاء الدور [${payload.role?.name || newRole.name}]`, 'المستخدمين والصلاحيات');
      setShowCreateRole(false);
      setNewRole({ roleKey: '', name: '', description: '', permissionKeys: [] });
      const refresh = await authenticatedRequest('/api/admin/central/rbac');
      const refreshed = await refresh.json().catch(() => ({}));
      if (refresh.ok && refreshed?.success && Array.isArray(refreshed.roles)) {
        setRoles(refreshed.roles);
        setPermissionCatalog(Array.isArray(refreshed.permissionCatalog) ? refreshed.permissionCatalog : permissionCatalog);
        setRolePermissions(Object.fromEntries(refreshed.roles.map((role: any) => [role.id, (role.permissions || []).map((permission: any) => permission.permissionKey)])));
        setSelectedRoleId(payload.role?.id || refreshed.roles[refreshed.roles.length - 1]?.id || '');
      }
      setLastPropagation(payload.propagation || null);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر إنشاء الدور الجديد.', 'danger');
    } finally { setIsSaving(false); }
  };

  // Run Copy Permissions Wizard
  const handleCopyPermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyState.srcRoleId || !copyState.destRoleId) {
      triggerNotification('يرجى اختيار دور المصدر ودور الهدف للاستنساخ', 'warning');
      return;
    }
    if (copyState.srcRoleId === copyState.destRoleId) {
      triggerNotification('لا يمكن نسخ الإعدادات لنفس الدور', 'warning');
      return;
    }

    const srcPerms = rolePermissions[copyState.srcRoleId] || [];
    setRolePermissions(prev => ({
      ...prev,
      [copyState.destRoleId]: [...srcPerms]
    }));

    const srcName = roles.find(r => r.id === copyState.srcRoleId)?.name;
    const destName = roles.find(r => r.id === copyState.destRoleId)?.name;

    triggerNotification(`تم نسخ الصلاحيات إلى مسودة دور ${destName} داخل الشاشة فقط؛ لم تُعتمد مركزيًا.`, 'warning');
    setShowCopyModal(false);
    setCopyState({ srcRoleId: '', destRoleId: '' });
  };

  const handlePublishMotherSchoolRbac = async () => {
    if (!canonicalTemplate?.id) {
      triggerNotification('لا يوجد قالب مركزي منشأ من المدرسة الأم؛ أنشئ القالب أولاً من مساحة التحكم المركزية.', 'warning');
      return;
    }
    if (!window.confirm('سيتم التقاط أدوار المدرسة الأم ونشر إصدار RBAC تلقائياً إلى المدارس المرتبطة بالقالب. هل تريد الاعتماد والنشر؟')) return;
    setIsPublishing(true);
    try {
      const response = await authenticatedRequest(`/api/admin/central/templates/${encodeURIComponent(canonicalTemplate.id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'capture' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر اعتماد ونشر قالب المدرسة الأم.');
      setCanonicalTemplate(payload.template || canonicalTemplate);
      setLastPropagation(payload.propagation || null);
      triggerNotification(`تم نشر إصدار RBAC من المدرسة الأم إلى ${payload.propagation?.targetCount || 0} مدرسة مرتبطة ✅`, 'success');
      logAction('PUBLISH_MOTHER_RBAC', `اعتماد ونشر قالب صلاحيات المدرسة الأم — الإصدار ${payload.template?.version || canonicalTemplate.version}`, 'المستخدمين والصلاحيات');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر اعتماد قالب المدرسة الأم؛ لم يتم نشر أي مدرسة.', 'danger');
    } finally {
      setIsPublishing(false);
    }
  };

  const activeRole = roles.find(r => r.id === selectedRoleId);
  const activeRoleName = activeRole?.name || 'لا يوجد دور محدد';
  const activePermissions = rolePermissions[selectedRoleId] || [];
  const activeRoleSavedPermissions = (activeRole?.permissions || []).map((permission: any) => permission.permissionKey).sort();
  const hasUnsavedChanges = activePermissions.slice().sort().join('|') !== activeRoleSavedPermissions.join('|');
  const linkedSchools = lastPropagation?.targetCount ?? schools.filter((school: any) => school?.status === 'active').length;

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-200" dir="rtl">
      
      {/* Mother-school command center */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-l from-slate-950 via-slate-900 to-amber-950/30 p-6 shadow-2xl">
        <div className="pointer-events-none absolute -left-14 -top-16 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-5 xl:flex-row xl:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-amber-300">
            <ShieldCheck className="h-5 w-5" /><span className="text-[11px] font-black tracking-widest">المدرسة الأم • مصدر القالب المعتمد</span>
          </div>
          <h4 className="text-lg font-black text-white flex items-center gap-2">
            مركز الحوكمة والصلاحيات المركزي
          </h4>
          <p className="max-w-3xl text-xs leading-6 text-slate-300 mt-2">
            عدّل القالب مرة واحدة هنا. كل اعتماد يصنع إصداراً موثقاً، يراجع التعارض، ثم ينشر إعدادات الأدوار فقط تلقائياً للمدارس المرتبطة — دون لمس بياناتها التشغيلية.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateRole(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-4 py-2.5 transition-all cursor-pointer flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة دور جديد</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCopyModal(true)}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 font-extrabold text-xs px-4 py-2.5 transition-all cursor-pointer flex items-center gap-1.5 shadow"
          >
            <Copy className="w-4 h-4" />
            <span>استنساخ قالب صلاحيات كامل</span>
          </button>
          <button
            type="button"
            onClick={() => void handlePublishMotherSchoolRbac()}
            disabled={isPublishing || !canonicalTemplate?.id}
            title="اعتماد ونشر للمدارس"
            className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs px-4 py-2.5 transition-all cursor-pointer flex items-center gap-1.5 shadow"
          >
            {isPublishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isPublishing ? 'جاري إعادة النشر...' : 'إعادة التقاط ونشر القالب'}</span>
          </button>
        </div>
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-2xl font-black text-white">{roles.length}</div><div className="mt-1 text-[10px] font-bold text-slate-400">قوالب أدوار مركزية</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-2xl font-black text-amber-300">{permissionCatalog.length}</div><div className="mt-1 text-[10px] font-bold text-slate-400">صلاحيات دقيقة مسجلة</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-2xl font-black text-emerald-300">{linkedSchools}</div><div className="mt-1 text-[10px] font-bold text-slate-400">مدارس تستقبل التحديث</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-2xl font-black text-violet-300">{canonicalTemplate?.version || '—'}</div><div className="mt-1 text-[10px] font-bold text-slate-400">إصدار القالب المنشور</div></div>
        </div>
      </div>

      {showCreateRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" dir="rtl">
          <form onSubmit={handleCreateRole} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 bg-gradient-to-l from-slate-950 to-amber-950 p-6 text-white">
              <div><div className="mb-1 flex items-center gap-2 text-amber-300"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-black">تعريف دور أمني مركزي</span></div><h3 className="text-xl font-black">إضافة دور جديد للمدارس</h3><p className="mt-2 text-xs leading-5 text-slate-300">الدور يحدد ما يستطيع المستخدم رؤيته وتنفيذه. أما المسمى الوظيفي مثل «معلم» أو «موظف» فيُدار من شؤون الموظفين.</p></div>
              <button type="button" onClick={() => setShowCreateRole(false)} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-4 overflow-y-auto p-6 lg:grid-cols-[320px_1fr]">
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-700">اسم الدور بالعربية<input required minLength={2} maxLength={160} value={newRole.name} onChange={(event) => setNewRole((current) => ({ ...current, name: event.target.value }))} placeholder="مسؤول شؤون الطلاب" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>
                <label className="block text-xs font-black text-slate-700">مفتاح الدور (إنجليزي)<input required pattern="[a-z0-9](?:[a-z0-9._-]{1,62})" value={newRole.roleKey} onChange={(event) => setNewRole((current) => ({ ...current, roleKey: event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') }))} placeholder="student_affairs" className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-mono text-sm" /></label>
                <label className="block text-xs font-black text-slate-700">وصف الدور<textarea maxLength={500} value={newRole.description} onChange={(event) => setNewRole((current) => ({ ...current, description: event.target.value }))} placeholder="وصف مسؤوليات الدور وحدوده" className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-[11px] leading-5 text-indigo-900">بعد الحفظ يُسجل الدور في سجل التدقيق، ويُلتقط داخل قالب المدرسة الأم، ثم يُنشر تلقائياً للمدارس الحالية والمستقبلية.</div>
              </div>
              <div className="space-y-3"><div className="flex items-center justify-between"><div><h4 className="text-sm font-black text-slate-800">صلاحيات الدور</h4><p className="text-[11px] text-slate-500">حدد الوحدات والأزرار التي تظهر وتعمل لهذا الدور.</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{newRole.permissionKeys.length} محددة</span></div><div className="grid max-h-[48vh] gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">{permissionCatalog.map((permission) => { const selected = newRole.permissionKeys.includes(permission.permissionKey); return <button type="button" key={permission.permissionKey} onClick={() => toggleNewRolePermission(permission.permissionKey)} className={`flex items-start gap-2 rounded-xl border p-3 text-right ${selected ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300 text-transparent'}`}><Check className="h-3 w-3" /></span><span><span className="block text-xs font-black text-slate-800">{permission.description || `${permission.resource} — ${permission.action}`}</span><span className="font-mono text-[9px] text-slate-400">{permission.permissionKey}</span></span></button>; })}</div></div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowCreateRole(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-black">إلغاء</button><button type="submit" disabled={isSaving} className="rounded-xl bg-amber-600 px-6 py-2.5 text-xs font-black text-white shadow-lg disabled:opacity-50">{isSaving ? 'جارٍ إنشاء الدور ونشره...' : 'حفظ الدور واعتماده'}</button></div>
          </form>
        </div>
      )}

      {lastPropagation && (
        <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-[10px] text-emerald-300">
          آخر نشر: {lastPropagation.targetCount || 0} مدرسة — تم إنشاء إصدار مستقل لكل مدرسة، مع إبقاء بيانات المدرسة التشغيلية خارج القالب.
        </div>
      )}

      {/* Main split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Roles selection (1/3) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h5 className="text-xs font-black text-white">الأدوار المعتمدة بالنظام</h5>
            <p className="text-[9px] text-slate-500 mt-0.5">اختر دوراً لتعديل امتيازاته العامة. لا توجد صلاحية منصة هنا.</p>
          </div>

          <div className="space-y-2">
            {isLoading ? <div className="text-xs text-slate-400">جاري تحميل الأدوار من المصدر المركزي...</div> : roles.length === 0 ? <div className="text-xs text-amber-400">لا توجد أدوار مركزية متاحة.</div> : roles.map((role) => {
              const isSelected = selectedRoleId === role.id;
              const countOfPerms = rolePermissions[role.id]?.length || 0;
              return (
                <button
                  type="button"
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  aria-pressed={isSelected}
                  className={`p-3.5 border text-right transition-all cursor-pointer space-y-1.5 ${
                    isSelected 
                      ? 'bg-amber-950/40 border-amber-500/80' 
                      : 'bg-slate-950/60 border-slate-850 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-black ${isSelected ? 'text-amber-400' : 'text-white'}`}>{role.name}</span>
                    <span className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[9px] text-slate-400 font-mono">
                      {countOfPerms} صلاحية
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{role.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Permissions Checklist Matrix (2/3) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-6 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-5">
            
            <div className="border-b border-slate-800 pb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h5 className="text-xs font-black text-white">صلاحيات وامتيازات دور: <span className="text-amber-400">{activeRoleName}</span></h5>
                <p className="text-[10px] text-slate-500 mt-0.5">{activePermissions.length} من {permissionCatalog.length} صلاحية مفعّلة {hasUnsavedChanges && <span className="mr-2 text-amber-400">• توجد مسودة غير محفوظة</span>}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px]"><Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" /><input value={permissionQuery} onChange={(event) => setPermissionQuery(event.target.value)} placeholder="ابحث في وحدة أو إجراء..." className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-3 pr-9 text-xs text-white outline-none placeholder:text-slate-600 focus:border-amber-500" /></div>
                <div className="bg-amber-950 text-amber-400 border border-amber-900 text-[10px] font-black px-2.5 py-2 rounded-lg">قالب RLS محكوم</div>
              </div>
            </div>

            {/* Permissions list mapping by categories */}
            <div className="space-y-6">
              {permissionModules.map((mod) => {
                const currentList = rolePermissions[selectedRoleId] || [];
                return (
                  <div key={mod.id} className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2"><h6 className="text-[11px] font-black text-slate-300">{mod.name} <span className="mr-1 text-slate-600">({mod.permissions.filter((permission) => currentList.includes(permission.key)).length}/{mod.permissions.length})</span></h6><div className="flex gap-2"><button type="button" onClick={() => setModulePermissions(mod.name, true)} className="rounded-lg border border-emerald-900 bg-emerald-950/30 px-2 py-1 text-[9px] font-black text-emerald-300 hover:bg-emerald-950">تفعيل الكل</button><button type="button" onClick={() => setModulePermissions(mod.name, false)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[9px] font-black text-slate-400 hover:bg-slate-800">إزالة الكل</button></div></div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {mod.permissions.map((perm) => {
                        const isGranted = currentList.includes(perm.key);
                        return (
                          <button
                            type="button"
                            key={perm.key}
                            onClick={() => handleTogglePermission(selectedRoleId, perm.key)}
                            role="checkbox"
                            aria-checked={isGranted}
                            className={`p-3 border flex justify-between items-center cursor-pointer transition-all ${
                              isGranted 
                                ? 'bg-amber-950/20 border-amber-900 text-amber-300' 
                                : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-950'
                            }`}
                          >
                            <span className="text-xs font-bold leading-relaxed">{perm.label}</span>
                            <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all shrink-0 ${
                              isGranted 
                                ? 'bg-amber-600 border-amber-500 text-white' 
                                : 'border-slate-700'
                            }`}>
                              {isGranted && <Check className="w-3 h-3" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Action trigger footer */}
          <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex flex-col gap-3 border-t border-slate-800 bg-slate-900/95 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-xl">عند الحفظ: فحص إصدار الدور، سجل تدقيق، وحملة نشر مركزية قابلة للتتبع والتراجع، ثم إصدار مستقل لكل مدرسة مرتبطة. لا يتم نشر المسودة قبل اعتمادك.</span>
            <button
              type="button"
              onClick={() => void handleSaveRbacTemplate()}
              disabled={isSaving || !selectedRoleId || !hasUnsavedChanges}
              className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-6 py-2.5 shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جاري الاعتماد والنشر...' : hasUnsavedChanges ? 'اعتماد ونشر التعديلات' : 'لا توجد تعديلات للحفظ'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Modal: Copy Template Wizard */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-slate-850 p-5 flex justify-between items-center">
              <button onClick={() => setShowCopyModal(false)} className="text-slate-400 bg-slate-900 p-1.5 rounded-lg border border-slate-800"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black text-white">استنساخ ونسخ قالب صلاحيات كامل</h3>
            </div>

            <form onSubmit={handleCopyPermissions} className="p-6 space-y-4">
              <div className="space-y-3">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1">نسخ مصفوفة صلاحيات (المصدر):</label>
                  <select
                    value={copyState.srcRoleId}
                    onChange={(e) => setCopyState({...copyState, srcRoleId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- اختر دور قالب المصدر --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1">تطبيقها بالكامل ولصقها في (الهدف):</label>
                  <select
                    value={copyState.destRoleId}
                    onChange={(e) => setCopyState({...copyState, destRoleId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- اختر دور مصفوفة الهدف --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowCopyModal(false)} className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400">إلغاء</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-2 rounded-xl">استنساخ وتطبيق القالب ⚡</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
