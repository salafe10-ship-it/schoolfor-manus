import { Check, Copy, HelpCircle, Lock as LockIcon, RefreshCw, Save, Send, ShieldCheck, Sliders, Users, X } from 'lucide-react';
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

  const permissionModules = useMemo(() => {
    const grouped = new Map<string, PermissionCatalogEntry[]>();
    for (const permission of permissionCatalog) {
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
  }, [permissionCatalog]);

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

  const activeRoleName = roles.find(r => r.id === selectedRoleId)?.name || 'لا يوجد دور محدد';

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-200" dir="rtl">
      
      {/* Top control description and quick utilities */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="text-sm font-black text-white flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-amber-400" />
            مركز الحوكمة المركزية ومصفوفات الصلاحيات الفيدرالية (RBAC Templates)
          </h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            تحكم وصياغة الإصدار الحالي لقالب الدور من المدرسة الأم. كل اعتماد ناجح يصدر نسخة موثقة وينشرها تلقائيًا للمدارس المرتبطة مع حملة نشر مركزية قابلة للتتبع والتراجع.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
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
            <p className="text-[9px] text-slate-500 mt-0.5">اختر دوراً لتعديل امتيازاته العامة</p>
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
            
            <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
              <div>
                <h5 className="text-xs font-black text-white">صلاحيات وامتيازات دور: <span className="text-amber-400">{activeRoleName}</span></h5>
                <p className="text-[10px] text-slate-500 mt-0.5">تحكم بامتيازات هذا الدور عبر التفعيل المباشر للحقائب المنطقية</p>
              </div>

              <div className="bg-amber-950 text-amber-400 border border-amber-900 text-[10px] font-black px-2.5 py-1 rounded-lg">
                قالب حوكمة معزول RLS
              </div>
            </div>

            {/* Permissions list mapping by categories */}
            <div className="space-y-6">
              {permissionModules.map((mod) => {
                const currentList = rolePermissions[selectedRoleId] || [];
                return (
                  <div key={mod.id} className="space-y-3">
                    <h6 className="text-[11px] font-black text-slate-400 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-lg w-fit">{mod.name}</h6>
                    
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
          <div className="pt-4 mt-6 border-t border-slate-800 flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-semibold leading-relaxed max-w-sm">
              التغيير الحالي يُحفظ بإصدار جديد مع فحص تعارض وتدقيق مركزي، ثم يُنشر تلقائياً إلى المدارس المرتبطة مع سجل قابل للتتبع والتراجع.
            </span>
            <button
              type="button"
              onClick={() => void handleSaveRbacTemplate()}
              disabled={isSaving || !selectedRoleId}
              className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-6 py-2.5 shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جاري الاعتماد المركزي...' : 'تطبيق وحفظ التعديلات الحالية'}</span>
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
